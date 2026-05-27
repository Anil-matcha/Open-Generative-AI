const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = {
    darwin: ['sd-cli', 'libstable-diffusion.dylib'],
    linux: ['sd-cli', 'libstable-diffusion.so'],
    win32: ['sd-cli.exe'],
};

const OPTIONAL_FILES = ['sd-server'];

function resolveSourceBinDir(sourcePath) {
    const absoluteSourcePath = path.resolve(sourcePath);
    const nestedBinDir = path.join(absoluteSourcePath, 'bin');

    if (fs.existsSync(nestedBinDir) && fs.statSync(nestedBinDir).isDirectory()) {
        return nestedBinDir;
    }

    return absoluteSourcePath;
}

function stageLocalAiBinary({ platform, arch, sourcePath }) {
    const sourceBinDir = resolveSourceBinDir(sourcePath);
    const requiredFiles = REQUIRED_FILES[platform];

    if (!requiredFiles) {
        throw new Error(`Unsupported platform "${platform}". Expected one of: ${Object.keys(REQUIRED_FILES).join(', ')}`);
    }

    const missingFiles = requiredFiles.filter((fileName) => !fs.existsSync(path.join(sourceBinDir, fileName)));
    if (missingFiles.length > 0) {
        throw new Error(`Missing required files in ${sourceBinDir}: ${missingFiles.join(', ')}`);
    }

    const repoRoot = path.resolve(__dirname, '..');
    const stageDir = path.join(repoRoot, 'build', 'local-ai', `${platform}-${arch}`, 'bin');

    fs.rmSync(stageDir, { recursive: true, force: true });
    fs.mkdirSync(stageDir, { recursive: true });

    for (const fileName of [...requiredFiles, ...OPTIONAL_FILES]) {
        const sourceFile = path.join(sourceBinDir, fileName);
        if (!fs.existsSync(sourceFile)) continue;

        const targetFile = path.join(stageDir, fileName);
        fs.copyFileSync(sourceFile, targetFile);

        if (platform !== 'win32') {
            fs.chmodSync(targetFile, 0o755);
        }
    }

    return stageDir;
}

function main() {
    const [platform, arch, sourcePath] = process.argv.slice(2);

    if (!platform || !arch || !sourcePath) {
        console.error('Usage: node scripts/stage-local-ai-binary.js <platform> <arch> <source-path>');
        process.exit(1);
    }

    try {
        const stageDir = stageLocalAiBinary({ platform, arch, sourcePath });
        console.log(`Staged local AI binaries in ${stageDir}`);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    resolveSourceBinDir,
    stageLocalAiBinary,
};
