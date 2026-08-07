const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { resolveSourceBinDir, stageLocalAiBinary } = require('../scripts/stage-local-ai-binary');

const repoRoot = path.resolve(__dirname, '..');

function makeSourceDir(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-stage-'));
    for (const [name, contents] of Object.entries(files)) {
        const full = path.join(dir, name);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, contents);
    }
    return dir;
}

function cleanup(sourceDir, platform, arch) {
    fs.rmSync(sourceDir, { recursive: true, force: true });
    fs.rmSync(path.join(repoRoot, 'build', 'local-ai', `${platform}-${arch}`), {
        recursive: true,
        force: true,
    });
}

test('stages every runtime file beside the entry point, not just known names', () => {
    // A Windows CUDA build: the engine is useless without its ggml backends and
    // the CUDA runtime, none of which are named in REQUIRED_FILES.
    const sourceDir = makeSourceDir({
        'sd-cli.exe': 'exe',
        'sd-server.exe': 'exe',
        'stable-diffusion.dll': 'dll',
        'ggml.dll': 'dll',
        'ggml-base.dll': 'dll',
        'ggml-cuda.dll': 'dll',
        'ggml-cpu-haswell.dll': 'dll',
        'cudart64_12.dll': 'dll',
        'cublas64_12.dll': 'dll',
        'cublasLt64_12.dll': 'dll',
        'libwebp.dll': 'dll',
    });

    try {
        const stageDir = stageLocalAiBinary({ platform: 'win32', arch: 'x64', sourcePath: sourceDir });
        const staged = fs.readdirSync(stageDir).sort();

        assert.deepEqual(staged, [
            'cublas64_12.dll',
            'cublasLt64_12.dll',
            'cudart64_12.dll',
            'ggml-base.dll',
            'ggml-cpu-haswell.dll',
            'ggml-cuda.dll',
            'ggml.dll',
            'libwebp.dll',
            'sd-cli.exe',
            'sd-server.exe',
            'stable-diffusion.dll',
        ]);
    } finally {
        cleanup(sourceDir, 'win32', 'x64');
    }
});

test('rejects a source directory missing the core shared library', () => {
    const sourceDir = makeSourceDir({ 'sd-cli.exe': 'exe' });

    try {
        assert.throws(
            () => stageLocalAiBinary({ platform: 'win32', arch: 'x64', sourcePath: sourceDir }),
            /Missing required files.*stable-diffusion\.dll/s
        );
    } finally {
        cleanup(sourceDir, 'win32', 'x64');
    }
});

test('rejects an unsupported platform', () => {
    const sourceDir = makeSourceDir({ 'sd-cli': 'bin' });

    try {
        assert.throws(
            () => stageLocalAiBinary({ platform: 'sunos', arch: 'x64', sourcePath: sourceDir }),
            /Unsupported platform "sunos"/
        );
    } finally {
        cleanup(sourceDir, 'sunos', 'x64');
    }
});

test('resolveSourceBinDir prefers a nested bin directory when present', () => {
    const sourceDir = makeSourceDir({ [path.join('bin', 'sd-cli')]: 'bin' });

    try {
        assert.equal(resolveSourceBinDir(sourceDir), path.join(path.resolve(sourceDir), 'bin'));
    } finally {
        fs.rmSync(sourceDir, { recursive: true, force: true });
    }
});
