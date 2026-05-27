const { ipcMain, app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { spawn, execFile } = require('child_process');
const {
    getBundledBinaryResourceDir,
    pickBinaryAssetForPlatform,
} = require('./localInferenceAssets');
const {
    formatStartupProgressMessage,
    parseGenerationProgressChunk,
    resolveGenerationSteps,
    resolveGuidanceScale,
} = require('./localInferenceRuntime');
const {
    LOCAL_AI_DIR_ENV,
    resolveLocalAiPaths,
} = require('./localInferencePaths');

// ─── Paths ────────────────────────────────────────────────────────────────────
const {
    dataDir: DATA_DIR,
    binDir: BIN_DIR,
    modelsDir: MODELS_DIR,
    tmpDir: TMP_DIR,
} = resolveLocalAiPaths({ userDataPath: app.getPath('userData') });

for (const dir of [BIN_DIR, MODELS_DIR, TMP_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
}

const BINARY_NAME = process.platform === 'win32' ? 'sd-cli.exe' : 'sd-cli';
const BINARY_PATH = path.join(BIN_DIR, BINARY_NAME);

// ─── State ────────────────────────────────────────────────────────────────────
let activeProcess = null;
const activeDownloads = new Map(); // modelId → request object

// ─── GitHub release asset matcher per platform ───────────────────────────────
// Asset names look like: sd-master-44cca3d-bin-Darwin-macOS-15.7.4-arm64.zip
// We pick the best match in priority order so a single release that only
// ships e.g. avx512 still resolves cleanly.
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'open-generative-ai' } }, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                reject(new Error(`HTTP ${res.statusCode} from ${url}`));
                return;
            }
            let body = '';
            res.on('data', (d) => { body += d; });
            res.on('end', () => {
                try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
            });
            res.on('error', reject);
        }).on('error', reject);
    });
}

// ─── Robust HTTPS download with redirect-following, range-resume, and retry ───
function downloadFile(url, destPath, onProgress) {
    const tmp = destPath + '.part';

    // Outer total so progress never goes backwards across retries/redirects
    let knownTotal = 0;

    const attempt = (requestUrl, redirectsLeft, retriesLeft) => new Promise((resolve, reject) => {
        // Resume from however many bytes are already on disk
        const alreadyDownloaded = fs.existsSync(tmp) ? fs.statSync(tmp).size : 0;

        const parsed = new URL(requestUrl);
        const mod = parsed.protocol === 'https:' ? https : http;

        const reqHeaders = {
            'User-Agent': 'Mozilla/5.0 (compatible; open-generative-ai/1.0)',
            'Accept': '*/*',
            'Connection': 'keep-alive',
        };
        if (alreadyDownloaded > 0) reqHeaders['Range'] = `bytes=${alreadyDownloaded}-`;

        const req = mod.get({ hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers: reqHeaders }, (res) => {
            const { statusCode, headers } = res;

            // Follow redirects
            if ([301, 302, 303, 307, 308].includes(statusCode)) {
                res.resume();
                if (redirectsLeft <= 0) { reject(new Error('Too many redirects')); return; }
                resolve(attempt(headers.location, redirectsLeft - 1, retriesLeft));
                return;
            }

            // 206 Partial Content (range accepted) or 200 OK (server ignored Range)
            if (statusCode !== 200 && statusCode !== 206) {
                res.resume();
                reject(new Error(`HTTP ${statusCode} from ${parsed.hostname}${parsed.pathname}`));
                return;
            }

            // content-length on a 206 is the remaining bytes; on 200 it's the full file
            const chunkSize = parseInt(headers['content-length'] || '0', 10);
            if (statusCode === 200) {
                // Server ignored our Range header — restart the file
                if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
                knownTotal = chunkSize;
            } else {
                // 206: total = already downloaded + remaining
                knownTotal = alreadyDownloaded + chunkSize;
            }

            let received = alreadyDownloaded;
            const out = fs.createWriteStream(tmp, { flags: statusCode === 206 ? 'a' : 'w' });

            res.on('data', (chunk) => {
                received += chunk.length;
                if (knownTotal && onProgress) onProgress(received / knownTotal);
            });
            res.pipe(out);
            out.on('finish', () => { fs.renameSync(tmp, destPath); resolve(); });
            out.on('error', reject);
            res.on('error', reject);
        });

        req.on('error', (err) => {
            if (retriesLeft > 0) {
                console.warn(`[download] ${err.message} — retrying in 3s (${retriesLeft} left)`);
                setTimeout(() => resolve(attempt(requestUrl, redirectsLeft, retriesLeft - 1)), 3000);
            } else {
                reject(err);
            }
        });

        req.setTimeout(60000, () => req.destroy(new Error('Request timed out')));
    });

    return attempt(url, 10, 5);
}

// ─── Extract zip on each platform ────────────────────────────────────────────
function extractZip(zipPath, destDir) {
    return new Promise((resolve, reject) => {
        let cmd, args;
        if (process.platform === 'win32') {
            cmd = 'powershell';
            args = ['-NoProfile', '-Command', `Expand-Archive -Force -Path "${zipPath}" -DestinationPath "${destDir}"`];
        } else {
            cmd = 'unzip';
            args = ['-o', zipPath, '-d', destDir];
        }
        execFile(cmd, args, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// ─── Binary management ────────────────────────────────────────────────────────
// Recursively find a file by name under dir; returns full path or null.
function findFile(dir, name) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const found = findFile(full, name);
            if (found) return found;
        } else if (entry.name === name) {
            return full;
        }
    }
    return null;
}

function ensureBinaryPermissions() {
    if (process.platform === 'win32') return;

    for (const fileName of [
        BINARY_NAME,
        'sd-server',
        'libstable-diffusion.dylib',
        'libstable-diffusion.so',
    ]) {
        const fullPath = findFile(BIN_DIR, fileName);
        if (fullPath) fs.chmodSync(fullPath, 0o755);
    }
}

function ensureBundledBinaryInstalled() {
    if (fs.existsSync(BINARY_PATH)) {
        ensureBinaryPermissions();
        return true;
    }

    if (!app.isPackaged) return false;

    const bundledDir = getBundledBinaryResourceDir({
        resourcesPath: process.resourcesPath,
        platform: process.platform,
        arch: process.arch,
    });
    const bundledBinaryPath = path.join(bundledDir, BINARY_NAME);
    if (!fs.existsSync(bundledBinaryPath)) return false;

    fs.cpSync(bundledDir, BIN_DIR, { recursive: true, force: true });
    ensureBinaryPermissions();
    return fs.existsSync(BINARY_PATH);
}

async function getBinaryStatus() {
    const exists = ensureBundledBinaryInstalled() || fs.existsSync(BINARY_PATH);
    return {
        exists,
        path: BINARY_PATH,
        dataDir: DATA_DIR,
        modelsDir: MODELS_DIR,
        envVar: LOCAL_AI_DIR_ENV,
    };
}

// Metal-enabled binaries hosted on our own release (macOS arm64 only).
// Other platforms fall back to the stock leejet release.
const CUSTOM_BINARIES = {
    'darwin-arm64': 'https://github.com/Anil-matcha/Open-Generative-AI/releases/download/v1.0.3-binaries/sd-cli-metal-macos-arm64.zip',
};

async function downloadBinary(mainWindow) {
    const send = (data) => mainWindow?.webContents.send('local-ai:download-progress', { id: '__binary__', ...data });

    try {
        send({ phase: 'fetching-release', progress: 0 });

        if (ensureBundledBinaryInstalled()) {
            send({ phase: 'done', progress: 1 });
            return { ok: true, source: 'bundled' };
        }

        const platformKey = `${process.platform}-${process.arch}`;
        const customUrl = CUSTOM_BINARIES[platformKey];

        let downloadUrl, zipName;

        if (customUrl) {
            downloadUrl = customUrl;
            zipName = path.basename(customUrl);
        } else {
            // Walk recent releases until we find one that actually ships a
            // build for this platform. leejet sometimes publishes a partial
            // release (e.g. master-587 ships only Mac arm64 + Linux ROCm),
            // so the very latest tag isn't always usable.
            const releases = await fetchJson(
                'https://api.github.com/repos/leejet/stable-diffusion.cpp/releases?per_page=15'
            );

            let chosen = null;
            let lastSeen = [];
            for (const release of releases) {
                const zips = (release.assets || [])
                    .filter(a => a.name.endsWith('.zip'));
                lastSeen = zips.map(a => a.name);
                const pickedName = pickBinaryAssetForPlatform({
                    platform: process.platform,
                    arch: process.arch,
                    zipNames: lastSeen,
                });
                if (pickedName) {
                    chosen = zips.find(a => a.name === pickedName);
                    break;
                }
            }

            if (!chosen) {
                if (process.platform === 'darwin' && process.arch !== 'arm64') {
                    throw new Error('Local inference on macOS only supports Apple Silicon (M1/M2/M3/M4). Mac Intel is not supported by stable-diffusion.cpp upstream.');
                }
                if (process.platform === 'linux' && process.arch === 'arm64') {
                    throw new Error('No upstream stable-diffusion.cpp binary found for linux-arm64. Install a build that bundles local-ai/linux-arm64/bin or provide the binary manually.');
                }
                const available = lastSeen.join(', ') || '(none)';
                throw new Error(`No binary found for ${process.platform}-${process.arch} in the last 15 releases. Latest release assets: ${available}`);
            }
            downloadUrl = chosen.browser_download_url;
            zipName = chosen.name;
        }

        send({ phase: 'downloading', progress: 0 });
        const zipPath = path.join(BIN_DIR, zipName);
        await downloadFile(downloadUrl, zipPath, (p) => {
            send({ phase: 'downloading', progress: p });
        });

        send({ phase: 'extracting', progress: 0.95 });
        await extractZip(zipPath, BIN_DIR);
        fs.unlinkSync(zipPath);

        // The zip may extract into a subdirectory — find the binary wherever it landed
        const foundBinary = findFile(BIN_DIR, BINARY_NAME);
        if (!foundBinary) throw new Error(`Extracted archive but could not find "${BINARY_NAME}" inside ${BIN_DIR}`);

        // Move it to the expected root location if it's nested
        if (foundBinary !== BINARY_PATH) {
            fs.renameSync(foundBinary, BINARY_PATH);
        }

        ensureBinaryPermissions();

        // macOS: strip Gatekeeper quarantine so the downloaded binary can run
        if (process.platform === 'darwin') {
            await new Promise((res) => execFile('xattr', ['-cr', BIN_DIR], () => res()));
        }

        send({ phase: 'done', progress: 1 });
        return { ok: true };
    } catch (err) {
        send({ phase: 'error', error: err.message });
        throw err;
    }
}

// ─── Model management ─────────────────────────────────────────────────────────
function getModelState(model) {
    const filePath = path.join(MODELS_DIR, model.filename);
    const partPath = filePath + '.part';
    if (fs.existsSync(filePath)) return 'downloaded';
    if (fs.existsSync(partPath)) return 'partial';
    return 'not-downloaded';
}

function getAuxState(aux) {
    const filePath = path.join(MODELS_DIR, aux.filename);
    return fs.existsSync(filePath) ? 'downloaded' : 'not-downloaded';
}

async function listModels() {
    const { LOCAL_MODEL_CATALOG, ZIMAGE_AUXILIARY } = require('./modelCatalog');
    const auxStatus = {
        llm: getAuxState(ZIMAGE_AUXILIARY.llm),
        vae: getAuxState(ZIMAGE_AUXILIARY.vae),
    };
    return LOCAL_MODEL_CATALOG.map(m => ({
        ...m,
        state: getModelState(m),
        path: path.join(MODELS_DIR, m.filename),
        ...(m.requiresAuxiliary ? { auxiliaryStatus: auxStatus } : {}),
    }));
}

async function downloadModel(modelId, mainWindow) {
    const { LOCAL_MODEL_CATALOG } = require('./modelCatalog');
    const model = LOCAL_MODEL_CATALOG.find(m => m.id === modelId);
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    const destPath = path.join(MODELS_DIR, model.filename);
    if (fs.existsSync(destPath)) return { ok: true, path: destPath };

    const send = (data) => mainWindow?.webContents.send('local-ai:download-progress', { id: modelId, ...data });
    send({ phase: 'downloading', progress: 0 });

    try {
        await downloadFile(model.downloadUrl, destPath, (p) => {
            send({ phase: 'downloading', progress: p });
        });
    } catch (err) {
        throw new Error(`Failed to download "${model.name}" (id: ${model.id}, url: ${model.downloadUrl}): ${err.message}`);
    }

    send({ phase: 'done', progress: 1 });
    return { ok: true, path: destPath };
}

async function downloadAuxiliary(auxKey, mainWindow) {
    const { ZIMAGE_AUXILIARY } = require('./modelCatalog');
    const aux = ZIMAGE_AUXILIARY[auxKey];
    if (!aux) throw new Error(`Unknown auxiliary file: ${auxKey}`);

    const destPath = path.join(MODELS_DIR, aux.filename);
    if (fs.existsSync(destPath)) return { ok: true, path: destPath };

    const id = aux.id;
    const send = (data) => mainWindow?.webContents.send('local-ai:download-progress', { id, ...data });
    send({ phase: 'downloading', progress: 0 });

    try {
        await downloadFile(aux.downloadUrl, destPath, (p) => {
            send({ phase: 'downloading', progress: p });
        });
    } catch (err) {
        throw new Error(`Failed to download "${aux.displayName}" (id: ${aux.id}, url: ${aux.downloadUrl}): ${err.message}`);
    }

    send({ phase: 'done', progress: 1 });
    return { ok: true, path: destPath };
}

async function deleteModel(modelId) {
    const { LOCAL_MODEL_CATALOG } = require('./modelCatalog');
    const model = LOCAL_MODEL_CATALOG.find(m => m.id === modelId);
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    const filePath = path.join(MODELS_DIR, model.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const partPath = filePath + '.part';
    if (fs.existsSync(partPath)) fs.unlinkSync(partPath);
    return { ok: true };
}

// ─── Generation ───────────────────────────────────────────────────────────────
function arToDimensions(ar, modelType) {
    const base = (modelType === 'sdxl' || modelType === 'z-image') ? 1024 : 512;
    const map = {
        '1:1': [base, base],
        '16:9': [Math.round(base * 16 / 9 / 64) * 64, base],
        '9:16': [base, Math.round(base * 16 / 9 / 64) * 64],
        '4:3': [Math.round(base * 4 / 3 / 64) * 64, base],
        '3:4': [base, Math.round(base * 4 / 3 / 64) * 64],
    };
    return map[ar] || [base, base];
}

async function generate(params, mainWindow) {
    const { LOCAL_MODEL_CATALOG, ZIMAGE_AUXILIARY } = require('./modelCatalog');
    const send = (data) => mainWindow?.webContents.send('local-ai:progress', data);

    ensureBundledBinaryInstalled();
    if (!fs.existsSync(BINARY_PATH)) throw new Error('sd.cpp binary not installed. Download it in Settings > Local Models.');

    const model = LOCAL_MODEL_CATALOG.find(m => m.id === params.model);
    if (!model) throw new Error(`Unknown local model: ${params.model}`);

    const modelPath = path.join(MODELS_DIR, model.filename);
    if (!fs.existsSync(modelPath)) throw new Error(`Model file not found. Download "${model.name}" in Settings > Local Models.`);

    if (model.requiresAuxiliary) {
        const llmPath = path.join(MODELS_DIR, ZIMAGE_AUXILIARY.llm.filename);
        const vaePath = path.join(MODELS_DIR, ZIMAGE_AUXILIARY.vae.filename);
        if (!fs.existsSync(llmPath)) throw new Error('Text encoder (Qwen3-4B) not downloaded. Go to Settings > Local Models and download all required files for Z-Image.');
        if (!fs.existsSync(vaePath)) throw new Error('VAE (ae.safetensors) not downloaded. Go to Settings > Local Models and download all required files for Z-Image.');
    }

    const [width, height] = arToDimensions(params.aspect_ratio || '1:1', model.type);
    const seed = params.seed && params.seed !== -1 ? params.seed : Math.floor(Math.random() * 2147483647);
    const outPath = path.join(TMP_DIR, `gen-${Date.now()}.png`);

    const steps = resolveGenerationSteps(params, model);
    const cfgScale = resolveGuidanceScale(params, model);
    const sampler = model.sampler || 'euler_a';

    // z-image GGUFs are standalone diffusion transformers loaded via --diffusion-model.
    // -m triggers full-model SD version detection which fails for these files (0 KV metadata).
    const modelFlag = (model.type === 'z-image' || model.type === 'flux')
        ? '--diffusion-model'
        : '-m';

    const args = [
        modelFlag, modelPath,
        '-p', params.prompt || '',
        '-o', outPath,
        '--steps', String(steps),
        '-H', String(height),
        '-W', String(width),
        '--cfg-scale', String(cfgScale),
        '--seed', String(seed),
        '--sampling-method', sampler,
        '-v',
    ];

    if (params.negative_prompt) {
        args.push('-n', params.negative_prompt);
    }

    if (model.type === 'z-image') {
        const llmPath = path.join(MODELS_DIR, ZIMAGE_AUXILIARY.llm.filename);
        const vaePath = path.join(MODELS_DIR, ZIMAGE_AUXILIARY.vae.filename);
        args.push('--llm', llmPath);
        args.push('--vae', vaePath);
        if (model.scheduler) args.push('--scheduler', model.scheduler);
    } else if (model.type === 'sdxl') {
        args.push('--sd-version', 'sdxl');
    } else if (model.type === 'sd2') {
        args.push('--sd-version', 'sd2');
    } else if (model.type === 'flux') {
        args.push('--flux');
    }

    return new Promise((resolve, reject) => {
        const startupStartedAt = Date.now();
        let startupHeartbeat = null;
        let samplingStarted = false;

        const sendStartupProgress = () => {
            send({
                step: 0,
                totalSteps: steps,
                status: 'starting',
                progress: 0,
                message: formatStartupProgressMessage(Date.now() - startupStartedAt),
            });
        };
        const stopStartupHeartbeat = () => {
            if (startupHeartbeat) {
                clearInterval(startupHeartbeat);
                startupHeartbeat = null;
            }
        };

        sendStartupProgress();
        startupHeartbeat = setInterval(() => {
            if (!samplingStarted) sendStartupProgress();
        }, 5000);

        console.log('[sd-cli] command:', BINARY_PATH, args.join(' '));
        // DYLD_LIBRARY_PATH lets macOS find libstable-diffusion.dylib next to sd-cli
        const spawnEnv = { ...process.env, DYLD_LIBRARY_PATH: BIN_DIR, LD_LIBRARY_PATH: BIN_DIR };
        activeProcess = spawn(BINARY_PATH, args, { env: spawnEnv });
        const progressState = { tail: '', lastStep: 0, lastTotalSteps: 0 };
        const outputLines = [];

        const handleOutput = (data) => {
            const line = data.toString();
            outputLines.push(line.trimEnd());
            const progressEvents = parseGenerationProgressChunk(line, progressState);
            for (const event of progressEvents) {
                samplingStarted = true;
                stopStartupHeartbeat();
                send({ ...event, status: 'generating' });
            }
        };

        activeProcess.stdout.on('data', handleOutput);
        activeProcess.stderr.on('data', handleOutput);

        activeProcess.on('close', (code) => {
            stopStartupHeartbeat();
            activeProcess = null;
            const allOutput = outputLines.filter(l => l.trim()).join('\n');
            console.error('[sd-cli] full output:\n' + allOutput);
            if (code !== 0) {
                const tail = outputLines.filter(l => l.trim()).slice(-20).join('\n');
                reject(new Error(`sd-cli exited (code ${code}):\n${tail}`));
                return;
            }
            if (!fs.existsSync(outPath)) {
                reject(new Error('sd.cpp finished but no output image found'));
                return;
            }
            try {
                const imgBuffer = fs.readFileSync(outPath);
                const dataUrl = `data:image/png;base64,${imgBuffer.toString('base64')}`;
                fs.unlinkSync(outPath);
                send({ step: steps, totalSteps: steps, status: 'done', progress: 1 });
                resolve({ url: dataUrl, seed });
            } catch (err) {
                reject(err);
            }
        });

        activeProcess.on('error', (err) => {
            stopStartupHeartbeat();
            activeProcess = null;
            reject(err);
        });
    });
}

function cancelGeneration() {
    if (activeProcess) {
        activeProcess.kill('SIGTERM');
        activeProcess = null;
    }
    return { ok: true };
}

// ─── IPC Registration ─────────────────────────────────────────────────────────
function getMainWindow() {
    return BrowserWindow.getAllWindows()[0] || null;
}

function register() {
    ipcMain.handle('local-ai:binary-status', () => getBinaryStatus());
    ipcMain.handle('local-ai:download-binary', () => downloadBinary(getMainWindow()));
    ipcMain.handle('local-ai:list-models', () => listModels());
    ipcMain.handle('local-ai:download-model', (_, modelId) => downloadModel(modelId, getMainWindow()));
    ipcMain.handle('local-ai:download-auxiliary', (_, auxKey) => downloadAuxiliary(auxKey, getMainWindow()));
    ipcMain.handle('local-ai:delete-model', (_, modelId) => deleteModel(modelId));
    ipcMain.handle('local-ai:generate', (_, params) => generate(params, getMainWindow()));
    ipcMain.handle('local-ai:cancel-generation', () => cancelGeneration());
}

module.exports = {
    register,
};
