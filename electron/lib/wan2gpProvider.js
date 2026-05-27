// Wan2GP HTTP provider — alternate local engine alongside sd.cpp.
// User runs Wan2GP themselves (https://github.com/deepbeepmeep/Wan2GP) and
// points this app at its Gradio server. We never bundle Python or weights.
// Useful when sd.cpp can't run a model (e.g. video) or the user has a
// dedicated CUDA box and only wants this Mac as the UI.

const { ipcMain, app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { withWan2gpAvailability } = require('./wan2gpModelAvailability');

const DATA_DIR = path.join(app.getPath('userData'), 'local-ai');
const CONFIG_FILE = path.join(DATA_DIR, 'wan2gp.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── Catalog ──────────────────────────────────────────────────────────────────
// `fn` is the *preferred* Gradio api_name Wan2GP exposes via /gradio_api/call/<fn>.
// Wan2GP builds rename these between versions (and Pinokio packages drop them
// entirely on some endpoints), so at probe time we pull /info from the server
// and remap each catalog entry's `fn` to whatever is actually registered. The
// `fnAliases` list lets us match newer/older variants; `family` is the final
// fallback for fuzzy matching. See resolveFnNames() below.
const WAN2GP_CATALOG = [
    {
        id: 'wan2gp:flux-dev',
        name: 'Flux.1 Dev (Wan2GP)',
        description: 'Image — FLUX.1 dev served by Wan2GP. 1024px output.',
        type: 'image',
        family: 'flux',
        provider: 'wan2gp',
        fn: 'flux',
        fnAliases: ['flux_dev', 'flux_1_dev', 'flux1_dev', 'flux_image'],
        aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        defaultSteps: 28,
        defaultGuidance: 3.5,
        tags: ['image', 'flux', 'remote'],
    },
    {
        id: 'wan2gp:qwen-image',
        name: 'Qwen Image (Wan2GP)',
        description: 'Image — Qwen-Image text-to-image served by Wan2GP.',
        type: 'image',
        family: 'qwen',
        provider: 'wan2gp',
        fn: 'qwen_image',
        fnAliases: ['qwen', 'qwen_t2i', 'qwen_image_t2i'],
        aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        defaultSteps: 30,
        defaultGuidance: 4.0,
        tags: ['image', 'qwen', 'remote'],
    },
    {
        id: 'wan2gp:wan22-t2v',
        name: 'Wan 2.2 (Text-to-Video)',
        description: 'Video — Wan 2.2 text-to-video. Slow on consumer GPUs.',
        type: 'video',
        family: 'wan',
        provider: 'wan2gp',
        fn: 'wan22_t2v',
        fnAliases: ['wan_2_2_t2v', 'wan22_text2video', 'wan_t2v', 'wan2_2_t2v', 't2v'],
        aspectRatios: ['16:9', '1:1', '9:16'],
        defaultSteps: 25,
        defaultGuidance: 5.0,
        tags: ['video', 'wan', 'text-to-video'],
    },
    {
        id: 'wan2gp:wan22-i2v',
        name: 'Wan 2.2 (Image-to-Video)',
        description: 'Video — Wan 2.2 image-to-video. Provide a start frame.',
        type: 'video',
        family: 'wan',
        provider: 'wan2gp',
        fn: 'wan22_i2v',
        fnAliases: ['wan_2_2_i2v', 'wan22_image2video', 'wan_i2v', 'wan2_2_i2v', 'i2v'],
        needsImage: true,
        aspectRatios: ['16:9', '1:1', '9:16'],
        defaultSteps: 25,
        defaultGuidance: 5.0,
        tags: ['video', 'wan', 'image-to-video'],
    },
    {
        id: 'wan2gp:hunyuan-video',
        name: 'Hunyuan Video (Wan2GP)',
        description: 'Video — Hunyuan text-to-video via Wan2GP.',
        type: 'video',
        family: 'hunyuan',
        provider: 'wan2gp',
        fn: 'hunyuan_video',
        fnAliases: ['hunyuan', 'hunyuan_t2v', 'hyvideo', 'hy_video'],
        aspectRatios: ['16:9', '1:1', '9:16'],
        defaultSteps: 30,
        defaultGuidance: 6.0,
        tags: ['video', 'hunyuan'],
    },
    {
        id: 'wan2gp:ltx-video',
        name: 'LTX Video (Wan2GP)',
        description: 'Video — LTX text-to-video. Fastest video option in Wan2GP.',
        type: 'video',
        family: 'ltx',
        provider: 'wan2gp',
        fn: 'ltx_video',
        fnAliases: ['ltx', 'ltx_t2v', 'ltxv', 'ltx_v', 'ltx_2', 'ltx2'],
        aspectRatios: ['16:9', '1:1', '9:16'],
        defaultSteps: 20,
        defaultGuidance: 3.0,
        tags: ['video', 'ltx', 'fast'],
    },
];

function getModelById(id) { return WAN2GP_CATALOG.find(m => m.id === id) || null; }

// ─── Config ───────────────────────────────────────────────────────────────────
function readConfig() {
    if (!fs.existsSync(CONFIG_FILE)) return { url: '' };
    try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')); }
    catch { return { url: '' }; }
}
function writeConfig(cfg) { fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2)); }
function normalizeUrl(url) { return (url || '').trim().replace(/\/+$/, ''); }

// ─── State ────────────────────────────────────────────────────────────────────
let activeAbort = null;

// Map of uploaded source URL → { path, url, orig_name } so generate() can
// rehydrate the Gradio file descriptor when the renderer passes the URL back.
const uploadedFiles = new Map();

// Per-base cache of resolved api_names. Populated by probe(); consumed by
// listModels() and generate(). Without this we'd hit FnIndexInferError on
// every call because Wan2GP's api_name strings drift between releases.
// Shape: Map<baseUrl, { apiNames: string[], resolved: Map<modelId, string|null> }>
const fnResolutionCache = new Map();

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function httpJson(urlStr, { method = 'GET', body = null, timeoutMs = 5000 } = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(urlStr);
        const mod = u.protocol === 'https:' ? https : http;
        const headers = body ? { 'Content-Type': 'application/json' } : {};
        const req = mod.request({
            hostname: u.hostname, port: u.port, path: u.pathname + u.search,
            method, headers,
        }, (res) => {
            let buf = '';
            res.on('data', (d) => { buf += d; });
            res.on('end', () => resolve({ status: res.statusCode, body: buf }));
            res.on('error', reject);
        });
        req.on('error', reject);
        req.setTimeout(timeoutMs, () => req.destroy(new Error('Request timed out')));
        if (body) req.write(body);
        req.end();
    });
}

// Pull the list of registered api_names from Gradio's /info endpoint.
// Gradio v4 exposes { named_endpoints: { "/api_name": {...}, ... } }; older
// builds use the legacy /api or a flat dependencies array. We try /info first,
// fall back to /api, and finally to /config['dependencies']. Returns an array
// of bare api_name strings (no leading slash). Empty array means we couldn't
// discover any — the server is reachable but doesn't expose a name index.
async function fetchApiNames(base) {
    const candidates = [`${base}/info`, `${base}/api`, `${base}/gradio_api/info`];
    for (const candidate of candidates) {
        try {
            const res = await httpJson(candidate, { timeoutMs: 8000 });
            if (res.status !== 200) continue;
            const parsed = JSON.parse(res.body);
            const named = parsed.named_endpoints || parsed.unnamed_endpoints || parsed;
            if (named && typeof named === 'object') {
                const keys = Object.keys(named).filter(k => k.startsWith('/'));
                if (keys.length) return keys.map(k => k.replace(/^\/+/, ''));
            }
        } catch { /* try next */ }
    }
    // Legacy fallback — /config exposes dependencies[] with api_name fields.
    try {
        const res = await httpJson(`${base}/config`, { timeoutMs: 5000 });
        if (res.status === 200) {
            const cfg = JSON.parse(res.body);
            const deps = Array.isArray(cfg.dependencies) ? cfg.dependencies : [];
            return deps.map(d => d.api_name).filter(n => typeof n === 'string' && n && n !== 'false');
        }
    } catch { /* ignore */ }
    return [];
}

// Map each catalog model to a real api_name on this server. Strategy:
//   1. exact match on `fn`
//   2. exact match on any `fnAliases` entry
//   3. fuzzy: api_name contains the model's `family` substring
//      (e.g. catalog wants `ltx_video`; server registered `ltx_2_t2v` → match)
// Returns { resolved: Map<modelId, string|null>, apiNames: string[] }.
function resolveFnNames(apiNames) {
    const set = new Set(apiNames);
    const resolved = new Map();
    for (const m of WAN2GP_CATALOG) {
        let hit = null;
        if (set.has(m.fn)) hit = m.fn;
        if (!hit && Array.isArray(m.fnAliases)) {
            for (const a of m.fnAliases) { if (set.has(a)) { hit = a; break; } }
        }
        if (!hit && m.family) {
            // Prefer names that also match the type (image vs video keyword).
            const typeHint = m.type === 'video' ? /(video|t2v|i2v|v2v)/i : /(image|t2i|txt2img)/i;
            const fuzzy = apiNames.find(n => n.toLowerCase().includes(m.family) && typeHint.test(n))
                       || apiNames.find(n => n.toLowerCase().includes(m.family));
            if (fuzzy) hit = fuzzy;
        }
        resolved.set(m.id, hit);
    }
    return { resolved, apiNames };
}

async function probe(url) {
    const base = normalizeUrl(url);
    if (!base) return { ok: false, error: 'URL is empty' };
    try {
        const res = await httpJson(`${base}/config`, { timeoutMs: 5000 });
        if (res.status !== 200) return { ok: false, error: `HTTP ${res.status} from /config — is this a Gradio server?` };
        const cfg = JSON.parse(res.body);
        const apiNames = await fetchApiNames(base);
        const { resolved } = resolveFnNames(apiNames);
        fnResolutionCache.set(base, { apiNames, resolved });
        const matched = [...resolved.values()].filter(Boolean).length;
        return {
            ok: true,
            version: cfg.version || 'unknown',
            apiNames,
            matchedModels: matched,
            totalModels: WAN2GP_CATALOG.length,
        };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

// ─── Upload (Gradio v4 /upload) ───────────────────────────────────────────────
// Renderer hands us { name, type, bytes:Uint8Array }. We POST as multipart to
// <base>/upload?upload_id=<id>; Gradio replies with an array of server paths.
// We expose those as a stable HTTP URL the renderer can preview AND stash the
// raw path for generate() to feed back into Gradio's file descriptor.
async function uploadFile({ name, type, bytes }) {
    const { url } = readConfig();
    if (!url) throw new Error('Wan2GP server URL not set. Open Settings → Local Models to configure.');
    const base = normalizeUrl(url);

    if (!bytes || !bytes.length) throw new Error('Empty file payload');
    const safeName = name || 'upload.bin';
    const mime = type || 'application/octet-stream';

    const blob = new Blob([new Uint8Array(bytes)], { type: mime });
    const form = new FormData();
    form.append('files', blob, safeName);

    const uploadId = Math.random().toString(36).slice(2, 12);
    const res = await fetch(`${base}/upload?upload_id=${uploadId}`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Wan2GP upload failed: HTTP ${res.status}`);

    const paths = await res.json();
    const path = Array.isArray(paths) ? paths[0] : paths;
    if (!path || typeof path !== 'string') throw new Error('Wan2GP upload returned no path');

    const fileUrl = `${base}/file=${path.replace(/^\/+/, '')}`;
    uploadedFiles.set(fileUrl, { path, url: fileUrl, orig_name: safeName, mime_type: mime });
    return { url: fileUrl, path };
}

async function listModels() {
    const { url } = readConfig();
    if (!url) return WAN2GP_CATALOG.map(m => ({ ...m, ready: false, unavailableReason: 'Wan2GP URL not set' }));
    const base = normalizeUrl(url);
    const probeRes = await probe(url); // populates fnResolutionCache
    const cached = fnResolutionCache.get(base);
    return WAN2GP_CATALOG.map(m => withWan2gpAvailability(m, probeRes, cached));
}

// ─── Generate ─────────────────────────────────────────────────────────────────
function arToDimensions(ar) {
    const base = 1024;
    const map = {
        '1:1':  [base, base],
        '16:9': [Math.round(base * 16 / 9 / 64) * 64, base],
        '9:16': [base, Math.round(base * 16 / 9 / 64) * 64],
        '4:3':  [Math.round(base * 4 / 3 / 64) * 64, base],
        '3:4':  [base, Math.round(base * 4 / 3 / 64) * 64],
    };
    return map[ar] || [base, base];
}

// Gradio v4 protocol: POST /gradio_api/call/<fn> → { event_id }
//                     GET  /gradio_api/call/<fn>/<event_id> → SSE stream
async function gradioCall(base, fn, payload, onProgress, signal) {
    const post = await fetch(`${base}/gradio_api/call/${fn}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
    });
    if (!post.ok) throw new Error(`Wan2GP POST /call/${fn} → HTTP ${post.status}`);
    const { event_id } = await post.json();
    if (!event_id) throw new Error('Wan2GP did not return an event_id');

    const stream = await fetch(`${base}/gradio_api/call/${fn}/${event_id}`, { signal });
    if (!stream.ok) throw new Error(`Wan2GP stream → HTTP ${stream.status}`);

    const reader = stream.body.getReader();
    const dec = new TextDecoder();
    let buf = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        const blocks = buf.split('\n\n');
        buf = blocks.pop();
        for (const block of blocks) {
            const eMatch = block.match(/event:\s*(\S+)/);
            const dMatch = block.match(/data:\s*(.*)$/s);
            if (!eMatch) continue;
            const evt = eMatch[1];
            const dataStr = dMatch ? dMatch[1].trim() : '';

            if (evt === 'generating' || evt === 'process_generating') {
                const m = dataStr.match(/"progress":\s*([\d.]+)/);
                if (m && onProgress) onProgress(parseFloat(m[1]));
            } else if (evt === 'complete' || evt === 'process_completes') {
                try {
                    const parsed = JSON.parse(dataStr);
                    return Array.isArray(parsed) ? parsed : (parsed.data || parsed);
                } catch {
                    throw new Error(`Wan2GP returned malformed completion: ${dataStr.slice(0, 200)}`);
                }
            } else if (evt === 'error' || evt === 'process_error') {
                throw new Error(`Wan2GP error: ${dataStr.slice(0, 200)}`);
            }
        }
    }
    throw new Error('Wan2GP stream ended without a completion event');
}

function resolveOutputUrl(base, output) {
    const first = Array.isArray(output) ? output[0] : output;
    if (!first) return null;
    if (typeof first === 'string') {
        return first.startsWith('http') ? first : `${base}/file=${first.replace(/^\/+/, '')}`;
    }
    if (first.url) return first.url.startsWith('http') ? first.url : `${base}${first.url}`;
    if (first.path) return `${base}/file=${first.path.replace(/^\/+/, '')}`;
    return null;
}

async function generate(params, mainWindow) {
    const { url } = readConfig();
    if (!url) throw new Error('Wan2GP server URL not set. Open Settings → Local Models to configure.');
    const base = normalizeUrl(url);

    const model = getModelById(params.model);
    if (!model) throw new Error(`Unknown Wan2GP model: ${params.model}`);

    const send = (data) => mainWindow?.webContents.send('local-ai:progress', data);
    send({ status: 'starting', progress: 0 });

    const [width, height] = arToDimensions(params.aspect_ratio || '1:1');
    const seed = params.seed && params.seed !== -1 ? params.seed : Math.floor(Math.random() * 2147483647);
    const steps = params.steps ?? model.defaultSteps;
    const guidance = params.guidance_scale ?? model.defaultGuidance;

    // Image input → resolve to a Gradio file descriptor if we uploaded it.
    let imageDescriptor = null;
    if (params.image) {
        const cached = uploadedFiles.get(params.image);
        if (cached) {
            imageDescriptor = { path: cached.path, url: cached.url, orig_name: cached.orig_name, mime_type: cached.mime_type, meta: { _type: 'gradio.FileData' } };
        } else if (typeof params.image === 'string') {
            imageDescriptor = params.image; // raw URL — Gradio fetches it
        } else {
            imageDescriptor = params.image;
        }
    }
    if (model.needsImage && !imageDescriptor) {
        throw new Error(`${model.name} requires a start-frame image — upload one first.`);
    }

    // Generic positional input — adjust upstream `fn` if signature differs.
    const payload = {
        data: [
            params.prompt || '',
            params.negative_prompt || '',
            width, height, steps, guidance, seed,
            imageDescriptor,
        ],
    };

    // Resolve to whatever api_name the server actually exposes. Falls back to
    // the catalog default so a user with a current Wan2GP build still works
    // even if /info isn't reachable.
    let cached = fnResolutionCache.get(base);
    if (!cached) { await probe(url); cached = fnResolutionCache.get(base); }
    const realFn = cached?.resolved.get(model.id) || model.fn;
    if (cached && cached.apiNames.length && !cached.resolved.get(model.id)) {
        const sample = cached.apiNames.slice(0, 8).join(', ');
        throw new Error(
            `${model.name}: Wan2GP server doesn't expose an api_name matching "${model.fn}". ` +
            `Available endpoints: ${sample}${cached.apiNames.length > 8 ? '…' : ''}. ` +
            `Make sure the model is loaded in Wan2GP, or update Wan2GP to a build that registers this api_name.`
        );
    }

    const ac = new AbortController();
    activeAbort = ac;

    try {
        const result = await gradioCall(base, realFn, payload, (p) => {
            send({ status: 'generating', progress: p });
        }, ac.signal);
        activeAbort = null;

        const mediaUrl = resolveOutputUrl(base, result);
        if (!mediaUrl) throw new Error(`Wan2GP returned unrecognized output: ${JSON.stringify(result).slice(0, 200)}`);

        send({ status: 'done', progress: 1 });
        return { url: mediaUrl, mediaType: model.type, seed };
    } catch (e) {
        activeAbort = null;
        if (e.name === 'AbortError') throw new Error('Generation cancelled');
        throw e;
    }
}

function cancelGeneration() {
    if (activeAbort) {
        activeAbort.abort();
        activeAbort = null;
    }
    return { ok: true };
}

// ─── IPC ──────────────────────────────────────────────────────────────────────
function getMainWindow() { return BrowserWindow.getAllWindows()[0] || null; }

function register() {
    ipcMain.handle('wan2gp:get-config',  () => readConfig());
    ipcMain.handle('wan2gp:set-url',     (_, url) => { writeConfig({ url: normalizeUrl(url) }); return { ok: true }; });
    ipcMain.handle('wan2gp:probe',       (_, url) => probe(url));
    ipcMain.handle('wan2gp:list-models', () => listModels());
    ipcMain.handle('wan2gp:generate',    (_, params) => generate(params, getMainWindow()));
    ipcMain.handle('wan2gp:cancel-generation', () => cancelGeneration());
    ipcMain.handle('wan2gp:upload-file', (_, payload) => uploadFile(payload));
}

module.exports = { register, WAN2GP_CATALOG };
