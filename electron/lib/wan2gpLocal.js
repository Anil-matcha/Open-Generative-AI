// Local Wan2GP engine: runs `wgp.py --process settings.json` from the user's
// Wan2GP folder. No electron import — the provider passes paths in.

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createProgressParser, summarizeRun, tailLines } = require('./wan2gpOutput');

const MEDIA_EXTENSIONS = new Set(['.mp4', '.mkv', '.mov', '.webm', '.png', '.jpg', '.jpeg', '.webp']);
const OUTPUT_CAP = 2 * 1024 * 1024; // keep the last 2 MB of console output

function defaultPythonPath(dir, platform = process.platform) {
    return platform === 'win32'
        ? path.join(dir, 'venv', 'Scripts', 'python.exe')
        : path.join(dir, 'venv', 'bin', 'python');
}

function resolveInstall({ dir, python } = {}, platform = process.platform) {
    const root = (dir || '').trim();
    if (!root) return null;
    return {
        dir: root,
        python: (python || '').trim() || defaultPythonPath(root, platform),
        wgpPath: path.join(root, 'wgp.py'),
        defaultsDir: path.join(root, 'defaults'),
        ckptsDir: path.join(root, 'ckpts'),
    };
}

function checkInstall(install) {
    if (!install) return { ok: false, error: 'Wan2GP folder not set' };
    if (!fs.existsSync(install.dir)) return { ok: false, error: `Folder not found: ${install.dir}` };
    if (!fs.existsSync(install.wgpPath)) return { ok: false, error: `wgp.py not found in ${install.dir} — is this the Wan2GP folder?` };
    if (!fs.existsSync(install.python)) return { ok: false, error: `Python not found: ${install.python}` };
    return { ok: true };
}

// Status of each requested model type in the installed Wan2GP:
//   'available'     — <dir>/defaults/<type>.json exists and one of its weight files is in ckpts/
//   'missing'       — the model is defined but its weights are not downloaded yet
//   'installed'     — defined, weight files could not be determined
//   (absent)        — no defaults/<type>.json: this Wan2GP version lacks the model
function localModelStatus(install, modelTypes) {
    const statuses = new Map();
    for (const modelType of modelTypes) {
        const defPath = path.join(install.defaultsDir, `${modelType}.json`);
        if (!fs.existsSync(defPath)) continue;
        let urls = null;
        try { urls = JSON.parse(fs.readFileSync(defPath, 'utf-8'))?.model?.URLs; } catch { /* unreadable def */ }
        if (!Array.isArray(urls) || urls.length === 0) {
            statuses.set(modelType, 'installed');
            continue;
        }
        const onDisk = urls.some(u => fs.existsSync(path.join(install.ckptsDir, path.basename(String(u)))));
        statuses.set(modelType, onDisk ? 'available' : 'missing');
    }
    return statuses;
}

function dirSize(dir) {
    let total = 0;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return 0; }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) total += dirSize(full);
        else if (entry.isFile()) {
            try { total += fs.statSync(full).size; } catch { /* file moved mid-scan */ }
        }
    }
    return total;
}

function newestMediaFile(dir) {
    let best = null;
    let entries;
    try { entries = fs.readdirSync(dir); } catch { return null; }
    for (const name of entries) {
        if (!MEDIA_EXTENSIONS.has(path.extname(name).toLowerCase())) continue;
        const full = path.join(dir, name);
        const mtime = fs.statSync(full).mtimeMs;
        if (!best || mtime > best.mtime) best = { full, mtime };
    }
    return best?.full || null;
}

// Kill wgp.py together with any children it spawned (ffmpeg, compile workers).
function killTree(child) {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
        return;
    }
    try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already gone */ }
    setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
            try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
        }
    }, 5000).unref();
}

function spawnWgp(install, args) {
    return spawn(install.python, [install.wgpPath, ...args], {
        cwd: install.dir,
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
        // Own process group on POSIX so cancellation can signal the whole tree.
        detached: process.platform !== 'win32',
    });
}

function collectOutput(child, onChunk) {
    let output = '';
    const handle = (data) => {
        const text = data.toString();
        output = (output + text).slice(-OUTPUT_CAP);
        onChunk?.(text);
    };
    child.stdout.on('data', handle);
    child.stderr.on('data', handle);
    return () => output;
}

// Starts a generation. Returns { child, done } where `done` resolves to the
// media path or rejects with an Error carrying the log tail.
function runGeneration({ install, settings, runDir, onProgress }) {
    const outDir = path.join(runDir, 'out');
    fs.mkdirSync(outDir, { recursive: true });
    const settingsPath = path.join(runDir, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    const child = spawnWgp(install, ['--process', settingsPath, '--output-dir', outDir]);
    const parse = createProgressParser();
    let modelReady = false;
    const getOutput = collectOutput(child, (text) => {
        for (const event of parse(text)) {
            if (event.status !== 'loading') modelReady = true;
            onProgress?.(event);
        }
    });

    // WanGP prints nothing while it downloads weights in CLI mode, so report
    // download progress from the growth of <Wan2GP>/ckpts until the model loads.
    const baseline = dirSize(install.ckptsDir);
    const downloadTimer = setInterval(() => {
        if (modelReady) return;
        const downloaded = dirSize(install.ckptsDir) - baseline;
        if (downloaded > 0) onProgress?.({ status: 'downloading', downloadedBytes: downloaded, progress: 0.02 });
    }, 2000);

    const done = new Promise((resolve, reject) => {
        child.on('error', (err) => {
            clearInterval(downloadTimer);
            reject(new Error(`Could not start Wan2GP (${install.python}): ${err.message}`));
        });
        child.on('close', (exitCode, signal) => {
            clearInterval(downloadTimer);
            const output = getOutput();
            fs.writeFileSync(path.join(runDir, 'wgp.log'), output);
            const result = summarizeRun({ exitCode, signal, output });
            if (!result.ok) {
                reject(new Error(result.error));
                return;
            }
            const mediaPath = (result.savedPath && fs.existsSync(result.savedPath)) ? result.savedPath : newestMediaFile(outDir);
            if (!mediaPath) {
                reject(new Error(`Wan2GP reported success but no media file was found in ${outDir}.\n\n${tailLines(output)}`));
                return;
            }
            resolve(mediaPath);
        });
    });

    return { child, done };
}

// `wgp.py --process <settings> --dry-run`: validates the install and settings
// without generating. Resolves { ok, message }.
function dryRun({ install, settings, runDir }) {
    fs.mkdirSync(runDir, { recursive: true });
    const settingsPath = path.join(runDir, 'dry-run.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    const child = spawnWgp(install, ['--process', settingsPath, '--dry-run']);
    const getOutput = collectOutput(child);
    return new Promise((resolve) => {
        child.on('error', (err) => resolve({ ok: false, message: `Could not start ${install.python}: ${err.message}` }));
        child.on('close', (exitCode) => {
            const output = getOutput();
            const m = output.match(/Validation complete\.\s*(\d+)\/(\d+) task/);
            if (exitCode === 0 && m && m[1] === m[2] && Number(m[2]) > 0) {
                resolve({ ok: true, message: 'Wan2GP validated a test task.' });
            } else {
                resolve({ ok: false, message: tailLines(output, 8) || `Exited with code ${exitCode}` });
            }
        });
    });
}

module.exports = {
    checkInstall,
    defaultPythonPath,
    dryRun,
    killTree,
    localModelStatus,
    resolveInstall,
    runGeneration,
};
