import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';
import { priceRub } from '../../_lib/pricing';
import { BILLING_ENABLED, getUser, deduct, refund } from '../../_lib/balance';

export const maxDuration = 300; // Vercel Pro: allow up to 5min for long generations

const store = global._mf_workflows ?? (global._mf_workflows = new Map());
const runStore = global._mf_runs ?? (global._mf_runs = new Map());

// ── TOS (Volcano Engine Object Storage) ──────────────────────────────────────
const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET   = process.env.TOS_BUCKET   || '';
const TOS_REGION   = process.env.TOS_REGION   || 'cn-beijing';
const TOS_AK       = process.env.TOS_ACCESS_KEY || '';
const TOS_SK       = process.env.TOS_SECRET_KEY || '';
const TOS_ENABLED  = !!(TOS_ENDPOINT && TOS_BUCKET && TOS_AK && TOS_SK);

function sha256hex(data) { return createHash('sha256').update(data).digest('hex'); }
function hmac(key, data)  { return createHmac('sha256', key).update(data).digest(); }

async function tosUpload(key, buffer, contentType) {
    if (!TOS_ENABLED) return null;
    try {
        const now = new Date();
        const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
        const date = iso.slice(0, 8);   // YYYYMMDD
        const datetime = iso;            // YYYYMMDDTHHmmssZ
        const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
        const path = `/${key}`;
        const payloadHash = sha256hex(buffer);

        // Volcano Engine TOS4 signing (TOS4-HMAC-SHA256)
        const canonHeaders = `content-length:${buffer.length}\ncontent-type:${contentType}\nhost:${host}\nx-tos-content-sha256:${payloadHash}\nx-tos-date:${datetime}\n`;
        const signedHeaders = 'content-length;content-type;host;x-tos-content-sha256;x-tos-date';
        const canonical = `PUT\n${path}\n\n${canonHeaders}\n${signedHeaders}\n${payloadHash}`;

        const scope = `${date}/${TOS_REGION}/tos/request`;
        const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;

        // TOS4 signing key: HMAC(HMAC(HMAC(HMAC("TOS4"+SK, date), region), "tos"), "tos4_request")
        const sigKey = hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
        const sig = createHmac('sha256', sigKey).update(strToSign).digest('hex');
        const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;

        const res = await fetch(`https://${host}${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': auth,
                'Content-Type': contentType,
                'Content-Length': String(buffer.length),
                'X-Tos-Content-Sha256': payloadHash,
                'X-Tos-Date': datetime,
            },
            body: buffer,
        });
        if (!res.ok) { console.error('TOS upload failed:', res.status, await res.text().catch(() => '')); return null; }
        return `https://${host}${path}`;
    } catch (e) { console.error('TOS upload error:', e.message); return null; }
}

// Resolve any private/TOS URL to a base64 data URL so external AI APIs can use it.
// Server-to-server fetches are not subject to CORS; only browser→TOS is blocked.
async function resolveImageUrl(url) {
    if (!url || url.startsWith('data:')) return url;
    const tosHost = TOS_ENABLED ? `${TOS_BUCKET}.${TOS_ENDPOINT}` : '';
    if (tosHost && url.startsWith(`https://${tosHost}`)) {
        try {
            const r = await fetch(url);
            if (!r.ok) return url;
            const buf = await r.arrayBuffer();
            const ct = r.headers.get('content-type') || 'image/png';
            return `data:${ct};base64,${Buffer.from(buf).toString('base64')}`;
        } catch { return url; }
    }
    return url;
}

// Upload base64 data URL → TOS public URL (falls back to original if TOS unavailable)
async function maybeUploadToTOS(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:') || !TOS_ENABLED) return dataUrl;
    const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
    if (!m) return dataUrl;
    const contentType = m[1];
    const ext = contentType.split('/')[1]?.split('+')[0] || 'bin';
    const buffer = Buffer.from(m[2], 'base64');
    const tosKey = `images/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    return (await tosUpload(tosKey, buffer, contentType)) || dataUrl;
}

// Save generation to user's gallery index
async function saveToGallery(userId, outputs, model, prompt) {
    if (!userId || !TOS_ENABLED || !outputs?.length) return;
    try {
        const key = `gallery/${userId}/entries.json`;
        const url = `https://${TOS_BUCKET}.${TOS_ENDPOINT}/${key}`;
        let entries = [];
        try {
            const r = await fetch(url);
            if (r.ok) entries = await r.json();
        } catch {}

        // Add new entries for each output
        for (const out of outputs) {
            if (out.type === 'error') continue; // skip errors
            entries.unshift({
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                type: out.type.replace('_url', ''), // image_url → image, etc.
                url: out.value,
                model,
                prompt: prompt || '',
                created_at: new Date().toISOString()
            });
        }
        const buf = Buffer.from(JSON.stringify(entries));
        await tosUpload(key, buf, 'application/json').catch(() => {});
    } catch { /* best-effort */ }
}

// Download video from CDN URL and re-upload to TOS videos/ folder.
// Keeps a permanent copy — CDN URLs from ARK/Memefast expire.
async function maybeUploadVideoToTOS(videoUrl) {
    if (!videoUrl || !TOS_ENABLED) return videoUrl;
    const tosHost = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
    if (videoUrl.startsWith(`https://${tosHost}`)) return videoUrl; // already in TOS
    try {
        const r = await fetch(videoUrl);
        if (!r.ok) return videoUrl;
        const buf = Buffer.from(await r.arrayBuffer());
        const ct = r.headers.get('content-type') || 'video/mp4';
        const ext = ct.includes('webm') ? 'webm' : ct.includes('mov') ? 'mov' : 'mp4';
        const tosKey = `videos/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
        return (await tosUpload(tosKey, buf, ct)) || videoUrl;
    } catch { return videoUrl; }
}

// Persist workflow to TOS (so it survives Vercel cold starts)
async function tosSaveWorkflow(id, data) {
    if (!TOS_ENABLED) return;
    const buf = Buffer.from(JSON.stringify(data));
    await tosUpload(`workflows/${id}.json`, buf, 'application/json').catch(() => {});
    // Update workflow index
    await tosUpdateIndex(id, { id, name: data.name || 'Untitled', updated_at: data.updated_at || new Date().toISOString(), thumbnail: data.thumbnail || null }).catch(() => {});
}

async function tosLoadIndex() {
    if (!TOS_ENABLED) return [];
    try {
        const url = `https://${TOS_BUCKET}.${TOS_ENDPOINT}/workflows/index.json`;
        const r = await fetch(url);
        if (!r.ok) return [];
        return await r.json();
    } catch { return []; }
}

async function tosUpdateIndex(id, meta) {
    if (!TOS_ENABLED) return;
    const index = await tosLoadIndex();
    const existing = index.findIndex(w => w.id === id);
    if (existing >= 0) index[existing] = { ...index[existing], ...meta };
    else index.unshift(meta);
    const buf = Buffer.from(JSON.stringify(index));
    await tosUpload('workflows/index.json', buf, 'application/json').catch(() => {});
}

async function tosRemoveFromIndex(id) {
    if (!TOS_ENABLED) return;
    const index = await tosLoadIndex();
    const filtered = index.filter(w => w.id !== id);
    const buf = Buffer.from(JSON.stringify(filtered));
    await tosUpload('workflows/index.json', buf, 'application/json').catch(() => {});
}

async function tosLoadCommunity() {
    if (!TOS_ENABLED) return [];
    try {
        const url = `https://${TOS_BUCKET}.${TOS_ENDPOINT}/workflows/community.json`;
        const r = await fetch(url);
        if (!r.ok) return [];
        return await r.json();
    } catch { return []; }
}

async function tosUpdateCommunity(id, meta) {
    if (!TOS_ENABLED) return;
    const list = await tosLoadCommunity();
    const existing = list.findIndex(w => w.id === id);
    if (existing >= 0) list[existing] = { ...list[existing], ...meta };
    else list.unshift(meta);
    const buf = Buffer.from(JSON.stringify(list));
    await tosUpload('workflows/community.json', buf, 'application/json').catch(() => {});
}

async function tosRemoveFromCommunity(id) {
    if (!TOS_ENABLED) return;
    const list = await tosLoadCommunity();
    const filtered = list.filter(w => w.id !== id);
    const buf = Buffer.from(JSON.stringify(filtered));
    await tosUpload('workflows/community.json', buf, 'application/json').catch(() => {});
}

// Load workflow from TOS (public read, no auth needed)
async function tosLoadWorkflow(id) {
    if (!TOS_ENABLED) return null;
    try {
        const url = `https://${TOS_BUCKET}.${TOS_ENDPOINT}/workflows/${id}.json`;
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.json();
    } catch { return null; }
}

// Persist run result to TOS — allows any serverless instance to read it (cross-instance polling)
async function tosSaveRun(runId, data) {
    if (!TOS_ENABLED) return;
    const buf = Buffer.from(JSON.stringify(data));
    await tosUpload(`runs/${runId}.json`, buf, 'application/json').catch(() => {});
    // Also save to videos/ if any output is a video_url
    const nodes = data?.nodes || {};
    const hasVideo = Object.values(nodes).some(runs =>
        Array.isArray(runs) && runs.some(r => r?.result?.outputs?.some(o => o?.type === 'video_url' && o?.value))
    );
    if (hasVideo) {
        await tosUpload(`videos/${runId}.json`, buf, 'application/json').catch(() => {});
    }
}

async function tosLoadRun(runId) {
    if (!TOS_ENABLED) return null;
    try {
        const url = `https://${TOS_BUCKET}.${TOS_ENDPOINT}/runs/${runId}.json`;
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.json();
    } catch { return null; }
}
// ─────────────────────────────────────────────────────────────────────────────

const MEMEFAST = 'https://memefast.top';

// ── ARK (Volcano Engine) — direct API for Seedance 2.0 ───────────────────────
const ARK_API_KEY = process.env.ARK_API_KEY || '';
const ARK_BASE    = 'https://ark.cn-beijing.volces.com';

async function generateVideoARK(model, params) {
    // ARK needs public HTTP URLs — it cannot accept base64 data URLs.
    const resolvePublic = async (u) => {
        if (!u || typeof u !== 'string') return undefined;
        if (!u.startsWith('data:')) return u;
        const uploaded = await maybeUploadToTOS(u);
        return (uploaded && !uploaded.startsWith('data:')) ? uploaded : undefined;
    };
    const imageUrl = await resolvePublic(params.image_url);
    const videoUrl = await resolvePublic(params.video_url);
    const audioUrl = await resolvePublic(params.audio_url);
    // Character node → face reference (asset://… URI or a public image URL).
    const faceAsset = params.face_asset && String(params.face_asset).startsWith('asset://')
      ? params.face_asset
      : await resolvePublic(params.face_asset);

    // Build the multimodal content array (text + optional reference media).
    const content = [{ type: 'text', text: params.prompt || '' }];
    if (imageUrl) content.push({ type: 'image_url', image_url: { url: imageUrl }, role: 'first_frame' });
    if (videoUrl) content.push({ type: 'video_url', video_url: { url: videoUrl }, role: 'reference_video' });
    if (audioUrl) content.push({ type: 'audio_url', audio_url: { url: audioUrl }, role: 'reference_audio' });
    if (faceAsset) content.push({ type: 'image_url', image_url: { url: faceAsset }, role: 'reference_image' });

    // Output parameters go directly in the request body (abbreviations like
    // --rs/--rt/--dur are NOT supported by Seedance 2.0).
    const body = { model, content, watermark: false };
    if (params.resolution) {
        let res = String(params.resolution).toLowerCase();
        // Seedance 2.0 Fast caps at 720p — downgrade 1080p to avoid a 400.
        if (/fast/i.test(model) && res === '1080p') res = '720p';
        body.resolution = res;
    }
    if (params.aspect_ratio) body.ratio = params.aspect_ratio;
    if (params.duration) {
        const d = Math.max(4, Math.min(15, Number(params.duration) || 5));
        body.duration = d;
    }
    // Generate native audio when an audio reference is supplied.
    if (audioUrl) body.generate_audio = true;

    const submitRes = await fetch(`${ARK_BASE}/api/v3/contents/generations/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ARK_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!submitRes.ok) {
        const txt = await submitRes.text().catch(() => submitRes.statusText);
        throw new Error(`ARK submit ${submitRes.status}: ${txt.slice(0, 300)}`);
    }
    const submitData = await submitRes.json();
    const taskId = submitData.id || submitData.task_id;
    if (!taskId) throw new Error('ARK: no task id in response: ' + JSON.stringify(submitData).slice(0, 200));

    // Poll for up to 290s (60 attempts × 5s each, within Vercel 300s limit)
    for (let i = 0; i < 58; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const pollRes = await fetch(`${ARK_BASE}/api/v3/contents/generations/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${ARK_API_KEY}` },
        });
        if (!pollRes.ok) continue;
        const p = await pollRes.json();
        const st = String(p.status || '').toLowerCase();
        if (st === 'succeeded' || st === 'completed' || st === 'success') {
            const arkUrl = p.content?.video_url || p.video_url;
            if (!arkUrl) throw new Error('ARK succeeded but no video URL');
            // ARK CDN (volces.com) has CORS restrictions — re-upload to TOS immediately
            // so the browser can play it. Falls back to ARK URL if TOS is unavailable.
            const finalUrl = await maybeUploadVideoToTOS(arkUrl);
            return [{ type: 'video_url', value: finalUrl }];
        }
        if (st === 'failed' || st === 'error' || st === 'expired' || st === 'cancelled') {
            throw new Error(p.error?.message || p.error || p.message || 'ARK video generation failed');
        }
    }
    throw new Error('ARK video generation timed out after 290s');
}

function genId() { return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

// Strip base64 data URLs from nodes before persisting — prevents 413 on save
function stripBase64(val) {
    if (typeof val === 'string') {
        return val.startsWith('data:') && val.length > 500 ? '' : val;
    }
    if (Array.isArray(val)) return val.map(stripBase64);
    if (val && typeof val === 'object') {
        const out = {};
        for (const k of Object.keys(val)) out[k] = stripBase64(val[k]);
        return out;
    }
    return val;
}

function emptyWorkflow(id) {
    return { workflow_id: id, id, name: 'Untitled', nodes: [], edges: [], created_at: new Date().toISOString() };
}

const VIDEO_MODELS = new Set([
    'video-passthrough',
    'doubao-seedance-2-0-260128', 'doubao-seedance-2-0-fast-260128',
    'doubao-seedance-1-0-lite-i2v-250428', 'doubao-seedance-1-0-lite-t2v-250428',
    'doubao-seedance-1-0-pro-250528', 'doubao-seedance-1-0-pro-fast-251015',
    'doubao-seedance-1-5-pro-251215',
    'veo3.1', 'veo3.1-fast', 'veo3.1-pro', 'veo3.1-4k',
    'veo_3_1', 'veo_3_1-fast', 'veo_3_1-4K',
    'sora-2',
    'grok-video-3', 'grok-video-3-10s',
    'kling-video', 'kling-video-extend', 'kling-omni-video', 'kling-avatar-image2video',
    'happyhorse-1.0-t2v', 'happyhorse-1.0-i2v', 'happyhorse-1.0-r2v', 'happyhorse-1.0-video-edit',
    'mj_video',
    'pixverse-video', 'pixverse-multi-transition', 'pixverse-mimic',
    'wan2.5-i2v-preview', 'wan2.6-i2v',
    'vidu2.0', 'viduq2', 'viduq2-pro', 'viduq2-turbo',
    'viduq3', 'viduq3-pro', 'viduq3-turbo', 'viduq3-mix',
    // Edit video (renamed for UI categorization — mapped via MODEL_ID_MAP)
    'pixverse-video-edit', 'pixverse-restyle-edit', 'pixverse-lipsync-edit',
    'pixverse-multi-transition-edit',
    'kling-video-edit-extend', 'kling-effects-edit',
    'wan2.6-v2v-edit',
    'vidu-video-edit',
    'seedance-video-edit',
]);

const TEXT_MODELS = new Set(['text-passthrough', 'any-llm', 'openrouter-vision', 'gpt-5-nano', 'gpt-5-mini', 'whisper-1', 'gpt-4o-transcribe']);

const AUDIO_MODELS = new Set([
    'audio-passthrough',
    'MiniMax-Voice-Clone', 'MiniMax-Voice-Design',
    'speech-02-hd', 'speech-02-turbo',
    'speech-2.6-hd', 'speech-2.6-turbo',
    'speech-2.8-hd', 'speech-2.8-turbo',
    'tts-1', 'tts-1-hd', 'gpt-4o-mini-tts',
    'vidu-tts', 'qwen3-tts-flash',
    'kling-sound-effect', 'kling-tts', 'kling-video-sound',
    'suno-inspire', 'suno-custom', 'suno-continue',
]);

// Fal.ai image models — use POST /fal-ai/{path} (separate registry, not in /v1/models)
// nano-banana removed: "No available channel" error with current Memefast key
const FAL_IMAGE_MODEL_MAP = {};

// Models that generate images via /v1/chat/completions (not /v1/images/generations)
const CHAT_IMAGE_MODELS = new Set([
    'gemini-2.5-flash-image',
    'gemini-3-pro-image-preview',
    'gemini-3.1-flash-image-preview',
    // Edit variants (same models, renamed for UI categorization)
    'gemini-2.5-flash-image-edit',
    'gemini-3-pro-image-edit',
    'gemini-3.1-flash-image-edit',
]);

// Schema key → actual Memefast model ID (for models renamed to include "edit"/"reference" in key)
const MODEL_ID_MAP = {
    'flux-edit-kontext-pro':         'flux.1-kontext-pro',
    'kling-omni-image-edit':         'kling-omni-image',
    'grok-imagine-image-reference':  'grok-imagine-image-pro',
    'mj_inpaint-edit':               'mj_inpaint',
    'mj_variation-reference':        'mj_variation',
    'gemini-2.5-flash-image-edit':   'gemini-2.5-flash-image',
    'gemini-3-pro-image-edit':       'gemini-3-pro-image-preview',
    'gemini-3.1-flash-image-edit':   'gemini-3.1-flash-image-preview',
    'gpt-image-2-edit':              'gpt-image-2',
    'gpt-image-1.5-edit':            'gpt-image-1.5',
    'gpt-image-1-edit':              'gpt-image-1',
    'pixverse-video-edit':               'pixverse-modify',
    'pixverse-restyle-edit':             'pixverse-restyle',
    'pixverse-lipsync-edit':             'pixverse-lipsync',
    'pixverse-multi-transition-edit':    'pixverse-multi-transition',
    'kling-video-edit-extend':           'kling-video-extend',
    'kling-effects-edit':                'kling-effects',
    'wan2.6-v2v-edit':                   'wan2.6-v2v',
    'vidu-video-edit':                   'vidu-video-edit',
    'seedance-video-edit':               'doubao-seedance-video-edit',
};

function computeImageSize(aspectRatio, resolution, width, height) {
    if (width && height) return `${width}x${height}`;
    const base = resolution === '4k' ? 4096 : resolution === '2k' ? 2048 : 1024;
    const scale = base / 1024;
    const AR1K = {
        '1:1': [1024, 1024], '16:9': [1792, 1024], '9:16': [1024, 1792],
        '4:3': [1024, 768],  '3:4': [768, 1024],   '3:2': [1536, 1024],
        '2:3': [1024, 1536], '21:9': [2048, 878],
    };
    const [w, h] = AR1K[aspectRatio] || AR1K['1:1'];
    return `${Math.round(w * scale)}x${Math.round(h * scale)}`;
}

async function generateImage(apiKey, model, params) {
    const apiModel = MODEL_ID_MAP[model] || model;
    // Prefer an explicit pixel size (e.g. gpt-image-2 "Size" field); otherwise
    // derive it from aspect_ratio + resolution for models that use those.
    const size = params.size || computeImageSize(params.aspect_ratio, params.resolution, params.width, params.height);
    // Collect every wired reference image (images_list = up to 16, plus a single
    // image_url for backward compatibility).
    const imgs = [
        ...(Array.isArray(params.images_list) ? params.images_list : []),
        params.image_url,
    ].filter(Boolean);
    const imgInput = imgs[0];

    // Use /v1/images/edits whenever a reference image is wired in (editing mode).
    if (imgInput && (model.includes('edit') || model.includes('reference') || model.includes('inpaint') || model.startsWith('gpt-image'))) {
        const form = new FormData();
        form.append('model', apiModel);
        form.append('prompt', params.prompt || '');
        form.append('n', '1');
        form.append('size', size);
        if (params.quality) form.append('quality', params.quality);
        if (params.format) form.append('format', params.format);
        for (const u of imgs) form.append('image[]', u);
        const editRes = await fetch(`${MEMEFAST}/v1/images/edits`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: form,
        });
        if (editRes.ok) {
            const editData = await editRes.json();
            const editItem = editData.data?.[0];
            const editUrl = editItem?.url || (editItem?.b64_json ? `data:image/png;base64,${editItem.b64_json}` : '') || '';
            if (editUrl) return [{ type: 'image_url', value: editUrl }];
        }
        // Fall through to standard generations if edits fails
    }

    const body = { model: apiModel, prompt: params.prompt || '', n: 1, size, response_format: 'url' };
    if (params.quality) body.quality = params.quality;
    if (params.format) body.format = params.format;
    if (imgInput) body.image_url = imgInput;

    const res = await fetch(`${MEMEFAST}/v1/images/generations`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Image API ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();
    const item = data.data?.[0];
    const url = item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : '') || data.url || '';
    return [{ type: 'image_url', value: url }];
}

async function generateFalImage(apiKey, model, params) {
    const falPath = FAL_IMAGE_MODEL_MAP[model] || model;
    const imageSize = (params.width && params.height)
        ? { width: parseInt(params.width), height: parseInt(params.height) }
        : params.aspect_ratio === '16:9' ? 'landscape_16_9'
        : params.aspect_ratio === '9:16' ? 'portrait_16_9'
        : params.aspect_ratio === '4:3'  ? 'landscape_4_3'
        : 'square_hd';
    const body = { prompt: params.prompt || '', num_images: 1, image_size: imageSize };
    const imgInput = params.image_url || params.images_list?.[0];
    if (imgInput) body.image_url = imgInput;

    const res = await fetch(`${MEMEFAST}/fal-ai/${falPath}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Fal API ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();
    if (data.images?.length) return [{ type: 'image_url', value: data.images[0].url }];
    const requestId = data.request_id;
    if (!requestId) throw new Error('Fal API: no images and no request_id in response');
    for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 4000));
        const poll = await fetch(`${MEMEFAST}/fal-ai/${falPath}/requests/${requestId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (!poll.ok) continue;
        const pData = await poll.json();
        if (pData.images?.length) return [{ type: 'image_url', value: pData.images[0].url }];
        const st = (pData.status || '').toUpperCase();
        if (st === 'ERROR' || st === 'FAILED') throw new Error(pData.error || 'Fal image generation failed');
    }
    throw new Error('Fal image generation timed out');
}

// Fetch a remote image (or pass through a data URI) → Gemini inline_data.
async function urlToInlineData(url) {
    try {
        if (!url) return null;
        if (url.startsWith('data:')) {
            const m = url.match(/^data:([^;]+);base64,(.+)$/s);
            return m ? { mime_type: m[1], data: m[2] } : null;
        }
        const r = await fetch(url);
        if (!r.ok) return null;
        const ct = r.headers.get('content-type') || 'image/png';
        const buf = Buffer.from(await r.arrayBuffer());
        return { mime_type: ct, data: buf.toString('base64') };
    } catch {
        return null;
    }
}

// Gemini image models (Nano Banana 2 / Pro) via the native generateContent API.
// Honours generationConfig.imageConfig (aspectRatio + imageSize) and embeds an
// optional reference image inline as base64.
async function generateChatImage(apiKey, model, params) {
    const apiModel = MODEL_ID_MAP[model] || model;
    const parts = [{ text: params.prompt || '' }];
    // Embed every wired reference image (images_list, plus a single image_url).
    const imgs = [
        ...(Array.isArray(params.images_list) ? params.images_list : []),
        params.image_url,
    ].filter(Boolean);
    for (const u of imgs) {
        const inline = await urlToInlineData(u);
        if (inline) parts.push({ inline_data: inline });
    }

    const imageConfig = {};
    if (params.aspect_ratio) imageConfig.aspectRatio = params.aspect_ratio;
    if (params.imageSize) imageConfig.imageSize = params.imageSize;

    const body = {
        contents: [{ parts }],
        generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            ...(Object.keys(imageConfig).length ? { imageConfig } : {}),
        },
    };

    const res = await fetch(`${MEMEFAST}/v1beta/models/${apiModel}:generateContent`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Gemini Image API ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();
    const respParts = data?.candidates?.[0]?.content?.parts || [];
    for (const p of respParts) {
        const inline = p?.inlineData || p?.inline_data;
        if (inline?.data) {
            const mime = inline.mimeType || inline.mime_type || 'image/png';
            return [{ type: 'image_url', value: `data:${mime};base64,${inline.data}` }];
        }
    }
    // Fallback: some channels still return a text part with an embedded URL.
    const textPart = respParts.find((p) => typeof p?.text === 'string')?.text || '';
    const match = textPart.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (match) return [{ type: 'image_url', value: match[0] }];
    const urlMatch = textPart.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp|gif)/i);
    if (urlMatch) return [{ type: 'image_url', value: urlMatch[0] }];
    return [{ type: 'image_url', value: '' }];
}

async function generateText(apiKey, model, params) {
    // Transcription models — audio URL → text
    if (model === 'whisper-1' || model === 'gpt-4o-transcribe') {
        const res = await fetch(`${MEMEFAST}/v1/audio/transcriptions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, url: params.audio_url || '', response_format: 'json' }),
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => res.statusText);
            throw new Error(`Transcription API ${res.status}: ${txt.slice(0, 200)}`);
        }
        const data = await res.json();
        return [{ type: 'text', value: data.text || '' }];
    }

    const messages = params.image_url
        ? [{ role: 'user', content: [
              { type: 'image_url', image_url: { url: params.image_url } },
              { type: 'text', text: params.prompt || '' }
          ]}]
        : [{ role: 'user', content: params.prompt || '' }];
    const res = await fetch(`${MEMEFAST}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model === 'text-passthrough' ? 'gpt-4o-mini' : model, messages, max_tokens: 4096 }),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Text API ${res.status}: ${txt.slice(0, 200)}`);
    }
    const data = await res.json();
    return [{ type: 'text', value: data.choices?.[0]?.message?.content || '' }];
}

async function generateVideo(apiKey, model, params) {
    const apiModel = MODEL_ID_MAP[model] || model;

    // Seedance 2.0 models go through ARK (Volcano Engine) directly, not Memefast
    if (/doubao-seedance-2-0/i.test(apiModel)) {
        return generateVideoARK(apiModel, params);
    }

    // Resolve TOS/private URLs to base64 so Memefast can access the image
    const imageUrl = params.image_url ? await resolveImageUrl(params.image_url) : undefined;
    const videoUrl = params.video_url ? await resolveImageUrl(params.video_url) : undefined;
    const audioUrl = params.audio_url || undefined;
    const body = {
        model: apiModel, prompt: params.prompt || '',
        image_url: imageUrl,
        duration: params.duration || 5,
        aspect_ratio: params.aspect_ratio || '16:9',
    };
    if (videoUrl) body.video_url = videoUrl;
    if (audioUrl) body.audio_url = audioUrl;
    const res = await fetch(`${MEMEFAST}/v1/video/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Video API ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();
    const taskId = data.task_id || data.id;
    // If the create response already contains a finished video, return it directly
    if (data.video_url) return [{ type: 'video_url', value: data.video_url }];
    if (!taskId) return [{ type: 'video_url', value: data.url || data.video_url || '' }];

    // Poll Memefast: GET /v1/videos/{taskId} → { status, video_url }
    // status flow: queued → video_generating → (video_url populated when done)
    // Poll for up to 260s (stay within Vercel's 300s maxDuration with margin).
    for (let i = 0; i < 86; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`${MEMEFAST}/v1/videos/${taskId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (!poll.ok) continue;
        const pData = await poll.json();
        // Done as soon as a video URL is available
        if (pData.video_url || pData.url) {
            return [{ type: 'video_url', value: pData.video_url || pData.url }];
        }
        const st = (pData.status || '').toLowerCase();
        if (st === 'completed' || st === 'succeeded' || st === 'success' || st === 'done' || st === 'finished') {
            return [{ type: 'video_url', value: pData.video_url || pData.url || pData.output?.url || '' }];
        }
        if (st === 'failed' || st === 'error') throw new Error(pData.error || pData.message || 'Video generation failed');
    }
    throw new Error('Video generation timed out after 260s');
}

async function generateAudio(apiKey, model, params) {
    // Suno music generation — async with task polling
    if (model.startsWith('suno-')) {
        const mode = model.replace('suno-', ''); // 'inspire' | 'custom' | 'continue'
        const body = { model: 'suno-v4', mode, prompt: params.prompt || '' };
        if (mode === 'custom') {
            body.lyrics = params.lyrics || params.prompt || '';
            body.style  = params.style  || '';
            body.title  = params.title  || '';
            delete body.prompt;
        }
        if (mode === 'continue' && params.audio_url) {
            body.audio_url   = params.audio_url;
            body.continue_at = params.continue_at ? parseFloat(params.continue_at) : 0;
        }
        const sRes = await fetch(`${MEMEFAST}/v1/audio/music`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!sRes.ok) { const t = await sRes.text().catch(() => sRes.statusText); throw new Error(`Suno API ${sRes.status}: ${t.slice(0, 300)}`); }
        const sData = await sRes.json();
        const taskId = sData.task_id || sData.id;
        if (!taskId) return [{ type: 'audio_url', value: sData.url || sData.audio_url || '' }];
        for (let i = 0; i < 120; i++) {
            await new Promise(r => setTimeout(r, 5000));
            const poll = await fetch(`${MEMEFAST}/v1/audio/music/${taskId}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
            if (!poll.ok) continue;
            const p = await poll.json();
            const st = (p.status || '').toLowerCase();
            if (st === 'completed' || st === 'succeeded' || st === 'success') {
                const clips = Array.isArray(p.clips) ? p.clips : Array.isArray(p.data) ? p.data : [];
                if (clips.length) return clips.map(c => ({ type: 'audio_url', value: c.audio_url || c.url || '' })).filter(c => c.value);
                return [{ type: 'audio_url', value: p.url || p.audio_url || '' }];
            }
            if (st === 'failed' || st === 'error') throw new Error(p.error || 'Suno generation failed');
        }
        throw new Error('Suno music generation timed out');
    }

    // Kling video→sound — generates audio from a video clip
    if (model === 'kling-video-sound') {
        const res = await fetch(`${MEMEFAST}/v1/video/create`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'kling-video-sound', video_url: params.video_url || '' }),
        });
        if (!res.ok) { const t = await res.text().catch(() => res.statusText); throw new Error(`Kling Video Sound API ${res.status}: ${t.slice(0, 200)}`); }
        const d = await res.json();
        const taskId = d.task_id || d.id;
        if (!taskId) return [{ type: 'audio_url', value: d.url || d.audio_url || '' }];
        for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const poll = await fetch(`${MEMEFAST}/v1/videos/${taskId}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
            if (!poll.ok) continue;
            const p = await poll.json();
            if (p.audio_url || p.url) return [{ type: 'audio_url', value: p.audio_url || p.url }];
            const st = (p.status || '').toLowerCase();
            if (st === 'completed' || st === 'succeeded') return [{ type: 'audio_url', value: p.url || p.audio_url || '' }];
            if (st === 'failed' || st === 'error') throw new Error(p.error || 'Video sound generation failed');
        }
        throw new Error('Video sound generation timed out');
    }

    // Kling sound effect — uses video/create endpoint
    if (model === 'kling-sound-effect') {
        const res = await fetch(`${MEMEFAST}/v1/video/create`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'kling-sound', prompt: params.prompt || '', duration: params.duration || 5 }),
        });
        if (!res.ok) { const t = await res.text().catch(() => res.statusText); throw new Error(`Kling Sound API ${res.status}: ${t.slice(0, 200)}`); }
        const d = await res.json();
        const taskId = d.task_id || d.id;
        if (!taskId) return [{ type: 'audio_url', value: d.url || d.audio_url || '' }];
        for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const poll = await fetch(`${MEMEFAST}/v1/videos/${taskId}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
            if (!poll.ok) continue;
            const p = await poll.json();
            if (p.audio_url || p.url) return [{ type: 'audio_url', value: p.audio_url || p.url }];
            const st = (p.status || '').toLowerCase();
            if (st === 'completed' || st === 'succeeded') return [{ type: 'audio_url', value: p.url || p.audio_url || '' }];
            if (st === 'failed' || st === 'error') throw new Error(p.error || 'Sound effect generation failed');
        }
        throw new Error('Sound effect generation timed out');
    }

    // MiniMax Voice Clone — send audio sample as reference
    const body = { model, input: params.prompt || '', voice: params.voice || 'alloy', speed: params.speed ? parseFloat(params.speed) : undefined };
    if (model === 'MiniMax-Voice-Clone' && params.audio_url) body.voice_id = params.audio_url;

    const res = await fetch(`${MEMEFAST}/v1/audio/speech`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Audio API ${res.status}: ${txt.slice(0, 200)}`);
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('audio') || ct.includes('octet-stream')) {
        const buf = await res.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        return [{ type: 'audio_url', value: `data:audio/mp3;base64,${b64}` }];
    }
    const data = await res.json();
    return [{ type: 'audio_url', value: data.url || data.audio_url || '' }];
}

// Map a model id to its billing category (matches the node-schema categories).
function modelCategory(model) {
    if (VIDEO_MODELS.has(model)) return 'video';
    if (AUDIO_MODELS.has(model)) return 'audio';
    if (TEXT_MODELS.has(model)) return 'text';
    return 'image';
}

// Cost of a node run in rubles (0 for passthroughs / unknown free models).
function costForNode(model, params) {
    return priceRub(modelCategory(model), model, params);
}

async function runNode(runId, nodeId, model, params, apiKey, userId = null) {
    try {
        let outputs;
        // Passthroughs
        if (model === 'image-passthrough') outputs = [{ type: 'image_url', value: params.image_url || '' }];
        else if (model === 'video-passthrough') outputs = [{ type: 'video_url', value: params.video_url || '' }];
        else if (model === 'audio-passthrough') outputs = [{ type: 'audio_url', value: params.audio_url || '' }];
        else if (model === 'text-passthrough') outputs = [{ type: 'text', value: params.prompt || '' }];
        // Generation
        else if (VIDEO_MODELS.has(model)) outputs = await generateVideo(apiKey, model, params);
        else if (TEXT_MODELS.has(model)) outputs = await generateText(apiKey, model, params);
        else if (AUDIO_MODELS.has(model)) outputs = await generateAudio(apiKey, model, params);
        else if (model in FAL_IMAGE_MODEL_MAP) outputs = await generateFalImage(apiKey, model, params);
        else if (CHAT_IMAGE_MODELS.has(model)) outputs = await generateChatImage(apiKey, model, params);
        else outputs = await generateImage(apiKey, model, params);

        // Upload generated base64 images to TOS SYNCHRONOUSLY so the client
        // receives a public URL instead of a multi-MB base64 data URL. Holding
        // base64 in node fields blows the workflow-save payload past Vercel's
        // request-body limit (413) when this image is wired into another node.
        for (const out of outputs) {
            if (out.type === 'image_url' && out.value?.startsWith('data:')) {
                const uploaded = await maybeUploadToTOS(out.value);
                if (uploaded && uploaded !== out.value) out.value = uploaded;
            }
        }

        const runResult = { status: 'completed', nodes: { [nodeId]: [{ status: 'succeeded', result: { outputs } }] } };
        runStore.set(runId, runResult);

        // Save to user's gallery
        await saveToGallery(userId, outputs, model, params.prompt);

        // Background: upload video outputs to TOS and persist the run JSON.
        // Fire-and-forget — failure here only affects reload persistence, not display.
        (async () => {
            try {
                let changed = false;
                for (const out of outputs) {
                    if (out.type === 'video_url' && out.value) {
                        const uploaded = await maybeUploadVideoToTOS(out.value);
                        if (uploaded && uploaded !== out.value) { out.value = uploaded; changed = true; }
                    }
                }
                if (changed) runStore.set(runId, runResult);
                await tosSaveRun(runId, runResult);
            } catch { /* best-effort */ }
        })();
    } catch (err) {
        console.error(`Node run error [${nodeId}]:`, err.message);
        const runResult = { status: 'failed', nodes: { [nodeId]: [{ status: 'failed', result: { outputs: [{ type: 'error', value: err.message }] } }] } };
        runStore.set(runId, runResult);
        await tosSaveRun(runId, runResult).catch(() => {});
    }
}

function getNodeSchemas() {
    const F = {
        prompt:        { type: "string", title: "Prompt", description: "Describe what you want to generate", examples: [""] },
        width:         { type: "int", title: "Width", default: 1024, minValue: 256, maxValue: 4096, step: 64 },
        height:        { type: "int", title: "Height", default: 1024, minValue: 256, maxValue: 4096, step: 64 },
        images_list:   { type: "array", title: "Input Images", field: "images_list", maxItems: 5, description: "Images to edit or use as reference", examples: [] },
        image_url:     { type: "string", title: "Image URL", field: "image", description: "URL of the input image", examples: [] },
        video_url:     { type: "string", title: "Video URL", field: "video", description: "URL of the input video", examples: [] },
        audio_url:     { type: "string", title: "Audio URL", field: "audio", description: "URL of the input audio", examples: [] },
        duration:      { type: "int", title: "Duration (sec)", default: 5, minValue: 3, maxValue: 30, step: 1 },
        voice:         { enum: ["alloy","echo","fable","onyx","nova","shimmer"], type: "string", title: "Voice", default: "alloy" },
        speed:         { enum: ["0.5","0.75","1.0","1.25","1.5","2.0"], type: "string", title: "Speed", default: "1.0" },
        // Aspect ratio presets per model capability
        ar_simple:     { enum: ["1:1","16:9","9:16"], type: "string", title: "Aspect Ratio", default: "1:1" },
        ar_std:        { enum: ["1:1","16:9","9:16","4:3","3:4"], type: "string", title: "Aspect Ratio", default: "1:1" },
        ar_ext:        { enum: ["1:1","16:9","9:16","4:3","3:4","3:2","2:3"], type: "string", title: "Aspect Ratio", default: "1:1" },
        ar_wide:       { enum: ["1:1","16:9","9:16","4:3","3:4","3:2","2:3","21:9"], type: "string", title: "Aspect Ratio", default: "1:1" },
        ar_video:      { enum: ["16:9","9:16","1:1","4:3"], type: "string", title: "Aspect Ratio", default: "16:9" },
        ar_seed2:      { enum: ["21:9","16:9","4:3","1:1","3:4","9:16"], type: "string", title: "Aspect Ratio", default: "16:9" },
        // Resolution presets per model capability
        res_2k:        { enum: ["1k","2k"], type: "string", title: "Resolution", default: "1k" },
        res_4k:        { enum: ["1k","2k","4k"], type: "string", title: "Resolution", default: "1k" },
        res_video:     { enum: ["480p","720p","1080p"], type: "string", title: "Resolution", default: "1080p" },
        res_video_fast:{ enum: ["480p","720p"], type: "string", title: "Resolution", default: "720p" },
        dur_seed2:     { type: "int", title: "Duration (sec)", default: 5, minValue: 4, maxValue: 15, step: 1 },
        // Quality presets
        quality_hq:    { enum: ["low","medium","high"], type: "string", title: "Quality", default: "low" },
        quality_std:   { enum: ["standard","hd"], type: "string", title: "Quality", default: "standard" },
        // Suno music fields
        lyrics:        { type: "string", title: "Lyrics", description: "Song lyrics", examples: [""] },
        style:         { type: "string", title: "Music Style", description: "Describe the musical style", examples: ["pop", "rock", "jazz"] },
        title:         { type: "string", title: "Song Title", description: "Title for the generated song", examples: [""] },
    };

    const ms = (props) => ({ input_schema: { schemas: { input_data: { properties: props } } } });

    const T = {
        // Image generation — model-specific schemas
        t2i_gpt2:   ms({ prompt: F.prompt, aspect_ratio: F.ar_ext,    resolution: F.res_4k, quality: F.quality_hq }),
        t2i_gpt1:   ms({ prompt: F.prompt, aspect_ratio: F.ar_ext,    resolution: F.res_2k, quality: F.quality_hq }),
        t2i_dalle:  ms({ prompt: F.prompt, aspect_ratio: F.ar_simple }),
        t2i_flux:   ms({ prompt: F.prompt, aspect_ratio: F.ar_std,    resolution: F.res_2k }),
        t2i_kling:  ms({ prompt: F.prompt, aspect_ratio: F.ar_wide,   resolution: F.res_2k }),
        t2i_seed:   ms({ prompt: F.prompt, aspect_ratio: F.ar_std }),
        t2i_std:    ms({ prompt: F.prompt, aspect_ratio: F.ar_std }),
        t2i_simple: ms({ prompt: F.prompt, aspect_ratio: F.ar_simple }),
        t2iWH:      ms({ prompt: F.prompt, width: F.width, height: F.height }),
        // Image editing — model-specific schemas
        i2i_gpt2:   ms({ prompt: F.prompt, images_list: F.images_list, resolution: F.res_4k, quality: F.quality_hq }),
        i2i_gpt1:   ms({ prompt: F.prompt, images_list: F.images_list, resolution: F.res_2k, quality: F.quality_hq }),
        i2i:        ms({ prompt: F.prompt, images_list: F.images_list }),
        imgRef:     ms({ prompt: F.prompt, image_url: F.image_url }),
        // Passthrough
        imgPass:    ms({ image_url: F.image_url }),
        vidPass:    ms({ video_url: F.video_url }),
        audPass:    ms({ audio_url: F.audio_url }),
        // Video generation — model-specific schemas
        // t2v variants — all accept an OPTIONAL image first-frame (image-to-video).
        // image_url is optional: leave empty for pure text-to-video.
        t2v:        ms({ prompt: F.prompt, image_url: F.image_url, aspect_ratio: F.ar_video, duration: F.duration }),
        t2v_seed:   ms({ prompt: F.prompt, image_url: F.image_url, aspect_ratio: F.ar_video, duration: { type: "int", title: "Duration (sec)", default: 5, minValue: 5, maxValue: 10, step: 5 } }),
        // Seedance 2.0 — adds optional reference video and audio inputs + resolution.
        // Resolution 480p/720p/1080p, ratio incl. 21:9/3:4, duration 4–15s.
        t2v_seed2:      ms({ prompt: F.prompt, image_url: F.image_url, video_url: F.video_url, audio_url: F.audio_url, resolution: F.res_video,      aspect_ratio: F.ar_seed2, duration: F.dur_seed2 }),
        // Seedance 2.0 Fast — same, but max resolution is 720p.
        t2v_seed2_fast: ms({ prompt: F.prompt, image_url: F.image_url, video_url: F.video_url, audio_url: F.audio_url, resolution: F.res_video_fast, aspect_ratio: F.ar_seed2, duration: F.dur_seed2 }),
        t2v_veo:    ms({ prompt: F.prompt, aspect_ratio: F.ar_video, duration: { type: "int", title: "Duration (sec)", default: 8, minValue: 5, maxValue: 8, step: 1 } }),
        t2v_veo4k:  ms({ prompt: F.prompt, aspect_ratio: F.ar_video, resolution: F.res_4k, duration: { type: "int", title: "Duration (sec)", default: 8, minValue: 5, maxValue: 8, step: 1 } }),
        // Veo with optional image first-frame (image-to-video). image_url is optional — leave empty for pure text-to-video.
        i2v_veo:    ms({ prompt: F.prompt, image_url: F.image_url, aspect_ratio: F.ar_video, duration: { type: "int", title: "Duration (sec)", default: 8, minValue: 5, maxValue: 8, step: 1 } }),
        i2v_veo4k:  ms({ prompt: F.prompt, image_url: F.image_url, aspect_ratio: F.ar_video, resolution: F.res_4k, duration: { type: "int", title: "Duration (sec)", default: 8, minValue: 5, maxValue: 8, step: 1 } }),
        t2v_sora:   ms({ prompt: F.prompt, image_url: F.image_url, aspect_ratio: { enum: ["16:9","9:16","1:1"], type: "string", title: "Aspect Ratio", default: "16:9" }, duration: { type: "int", title: "Duration (sec)", default: 5, minValue: 5, maxValue: 20, step: 5 } }),
        t2v_grok:   ms({ prompt: F.prompt, image_url: F.image_url, aspect_ratio: F.ar_video, duration: { type: "int", title: "Duration (sec)", default: 5, minValue: 5, maxValue: 5, step: 1 } }),
        t2v_grok10: ms({ prompt: F.prompt, image_url: F.image_url, aspect_ratio: F.ar_video, duration: { type: "int", title: "Duration (sec)", default: 10, minValue: 10, maxValue: 10, step: 1 } }),
        t2v_kling:  ms({ prompt: F.prompt, image_url: F.image_url, aspect_ratio: { enum: ["16:9","9:16","1:1","4:3","3:4"], type: "string", title: "Aspect Ratio", default: "16:9" }, duration: { type: "int", title: "Duration (sec)", default: 5, minValue: 5, maxValue: 10, step: 5 } }),
        t2v_pixv:   ms({ prompt: F.prompt, image_url: F.image_url, aspect_ratio: { enum: ["16:9","9:16","1:1"], type: "string", title: "Aspect Ratio", default: "16:9" }, duration: { type: "int", title: "Duration (sec)", default: 5, minValue: 4, maxValue: 8, step: 1 } }),
        // i2v variants (image-to-video)
        i2v:        ms({ prompt: F.prompt, image_url: F.image_url, duration: F.duration }),
        i2v_seed:   ms({ prompt: F.prompt, image_url: F.image_url, duration: { type: "int", title: "Duration (sec)", default: 5, minValue: 5, maxValue: 10, step: 5 } }),
        i2v_kling:  ms({ prompt: F.prompt, image_url: F.image_url, duration: { type: "int", title: "Duration (sec)", default: 5, minValue: 5, maxValue: 10, step: 5 } }),
        // Edit video
        vidEdit:    ms({ prompt: F.prompt, video_url: F.video_url }),
        vidExtend:  ms({ prompt: F.prompt, video_url: F.video_url, duration: { type: "int", title: "Duration (sec)", default: 5, minValue: 5, maxValue: 10, step: 5 } }),
        lipsync:    ms({ video_url: F.video_url, audio_url: F.audio_url }),
        // Text
        vision:     ms({ prompt: F.prompt, image_url: F.image_url }),
        txtPass:    ms({ prompt: { type: "string", title: "Text", description: "Enter your text", examples: [""] } }),
        // Audio — model-specific schemas
        speech_full:  ms({ prompt: F.prompt, voice: F.voice, speed: F.speed }),  // OpenAI tts-1/tts-1-hd/gpt-4o-mini-tts
        speech:       ms({ prompt: F.prompt, voice: F.voice }),                  // Minimax speech
        tts:          ms({ prompt: F.prompt }),                                   // models without voice selector
        voice_clone:  ms({ prompt: F.prompt, audio_url: F.audio_url }),          // MiniMax-Voice-Clone: voice sample + text
        sound_effect: ms({ prompt: F.prompt, duration: { type: "int", title: "Duration (sec)", default: 5, minValue: 1, maxValue: 30, step: 1 } }), // Kling sound effect
        // Kling TTS — voice selector, no speed
        kling_tts:    ms({ prompt: F.prompt, voice: F.voice }),
        // Kling video→sound — input video, generates matching audio
        vid2sound:    ms({ video_url: F.video_url }),
        // Transcription — audio → text
        transcription: ms({ audio_url: F.audio_url }),
        // Suno music generation modes
        suno_inspire: ms({ prompt: F.prompt }),                                                          // inspiration mode: describe the song
        suno_custom:  ms({ title: F.title, lyrics: F.lyrics, style: F.style }),                        // custom mode: lyrics + style + title
        suno_continue:ms({ prompt: F.prompt, audio_url: F.audio_url }),                                 // continuation mode: extend an existing track
    };

    return {
        categories: {
            image: {
                models: {
                    "image-passthrough":              T.imgPass,
                    // OpenAI GPT Image 2 — 4k, extended AR, quality: low/medium/high
                    "gpt-image-2":                    T.t2i_gpt2,
                    "gpt-image-2-edit":               T.i2i_gpt2,
                    // OpenAI GPT Image 1.5 — 2k, extended AR
                    "gpt-image-1.5":                  T.t2i_gpt1,
                    "gpt-image-1.5-edit":             T.i2i_gpt1,
                    // OpenAI GPT Image 1 — 2k, extended AR
                    "gpt-image-1":                    T.t2i_gpt1,
                    "gpt-image-1-edit":               T.i2i_gpt1,
                    // GPT Image Mini / DALL-E 3 — simple AR only
                    "gpt-image-1-mini":               T.t2i_dalle,
                    "dall-e-3":                       T.t2i_dalle,
                    // Flux — 2k, standard AR
                    "flux-2-pro":                     T.t2i_flux,
                    "flux-1.1-pro":                   T.t2i_flux,
                    "flux-edit-kontext-pro":          T.i2i,
                    // ByteDance Seedream — standard AR
                    "doubao-seedream-5-0-260128":      T.t2i_seed,
                    "doubao-seedream-4-5-251128":      T.t2i_seed,
                    "doubao-seedream-4-0-250828":      T.t2i_seed,
                    "doubao-seedream-3-0-t2i-250415":  T.t2i_seed,
                    // Qwen Image — simple AR
                    "qwen-image-max":                 T.t2i_simple,
                    "qwen-image-2.0-2026-03-03":      T.t2i_simple,
                    "qwen-image-edit-2509":           T.i2i,
                    // z-image — simple AR
                    "z-image-turbo":                  T.t2i_simple,
                    // Kling Image — 2k, wide AR (21:9 included)
                    "kling-image":                    T.t2i_kling,
                    "kling-omni-image-edit":          T.imgRef,
                    // Grok Image — standard AR
                    "grok-4.2-image":                 T.t2i_std,
                    "grok-4.1-image":                 T.t2i_std,
                    "grok-4-image":                   T.t2i_std,
                    "grok-imagine-image":             T.t2i_std,
                    "grok-imagine-image-reference":   T.imgRef,
                    // Midjourney — standard AR
                    "mj_imagine":                     T.t2i_std,
                    "mj_edits":                       T.i2i,
                    "mj_inpaint-edit":                T.i2i,
                    "mj_variation-reference":         T.imgRef,
                    // Wan Image — width/height sliders
                    "wan2.7-image-pro":               T.t2iWH,
                    // Gemini Image — standard AR (generate)
                    "gemini-3.1-flash-image-preview": T.t2i_std,
                    "gemini-3-pro-image-preview":     T.t2i_std,
                    "gemini-2.5-flash-image":         T.t2i_std,
                    // Gemini Edit Image — prompt + image ref
                    "gemini-2.5-flash-image-edit":    T.imgRef,
                    "gemini-3-pro-image-edit":        T.imgRef,
                    "gemini-3.1-flash-image-edit":    T.imgRef,
                }
            },
            video: {
                models: {
                    "video-passthrough":                    T.vidPass,
                    // ByteDance Seedance 2.0 — image + video + audio reference inputs
                    "doubao-seedance-2-0-260128":           T.t2v_seed2,
                    "doubao-seedance-2-0-fast-260128":      T.t2v_seed2_fast,
                    // ByteDance Seedance 1.x — 5s or 10s, standard AR
                    "doubao-seedance-1-5-pro-251215":       T.t2v_seed,
                    "doubao-seedance-1-0-pro-fast-251015":  T.t2v_seed,
                    "doubao-seedance-1-0-pro-250528":       T.t2v_seed,
                    "doubao-seedance-1-0-lite-t2v-250428":  T.t2v_seed,
                    "doubao-seedance-1-0-lite-i2v-250428":  T.i2v_seed,
                    // Google Veo — up to 8s; optional image first-frame (image-to-video). Veo 3.1-4k supports 4k.
                    "veo3.1-pro":    T.i2v_veo,
                    "veo3.1-4k":     T.i2v_veo4k,
                    "veo3.1":        T.i2v_veo,
                    "veo3.1-fast":   T.i2v_veo,
                    "veo_3_1":       T.i2v_veo,
                    "veo_3_1-fast":  T.i2v_veo,
                    // OpenAI Sora — up to 20s
                    "sora-2": T.t2v_sora,
                    // Grok Video — 5s fixed / 10s fixed
                    "grok-video-3":     T.t2v_grok,
                    "grok-video-3-10s": T.t2v_grok10,
                    // Kling Video — 5s or 10s, extended AR
                    "kling-omni-video":            T.t2v_kling,
                    "kling-video":                 T.t2v_kling,
                    "kling-avatar-image2video":    T.i2v_kling,
                    // Edit video
                    "kling-video-edit-extend":     T.vidExtend,
                    "kling-effects-edit":          T.vidEdit,
                    "pixverse-multi-transition-edit": T.vidEdit,
                    "wan2.6-v2v-edit":             T.vidEdit,
                    "vidu-video-edit":             T.vidEdit,
                    "seedance-video-edit":         T.vidEdit,
                    // Happyhorse
                    "happyhorse-1.0-t2v":        T.t2v,
                    "happyhorse-1.0-i2v":        T.i2v,
                    "happyhorse-1.0-r2v":        T.i2v,
                    "happyhorse-1.0-video-edit": T.vidEdit,
                    // Midjourney Video
                    "mj_video": T.t2v,
                    // Pixverse — 4-8s, 16:9/9:16/1:1
                    "pixverse-video":            T.t2v_pixv,
                    "pixverse-mimic":            T.i2v,
                    "pixverse-video-edit":       T.vidEdit,
                    "pixverse-restyle-edit":     T.vidEdit,
                    "pixverse-lipsync-edit":     T.lipsync,
                    // Wan Video — image-to-video only
                    "wan2.6-i2v":           T.i2v,
                    "wan2.5-i2v-preview":   T.i2v,
                    // Vidu Video — standard AR, 4-8s
                    "vidu2.0":      T.t2v,
                    "viduq3-turbo": T.t2v,
                    "viduq3-pro":   T.t2v,
                    "viduq3":       T.t2v,
                    "viduq2-turbo": T.t2v,
                    "viduq2-pro":   T.t2v,
                    "viduq2":       T.t2v,
                }
            },
            text: {
                models: {
                    "text-passthrough":  T.txtPass,
                    "any-llm":           T.vision,
                    "openrouter-vision": T.vision,
                    "gpt-5-nano":        T.vision,
                    "gpt-5-mini":        T.vision,
                    // Transcription — audio input → text output
                    "whisper-1":         T.transcription,
                    "gpt-4o-transcribe": T.transcription,
                }
            },
            audio: {
                models: {
                    "audio-passthrough":    T.audPass,
                    // OpenAI TTS — voice + speed
                    "tts-1-hd":             T.speech_full,
                    "tts-1":                T.speech_full,
                    "gpt-4o-mini-tts":      T.speech_full,
                    // Minimax Speech — voice, no speed
                    "speech-2.8-hd":        T.speech,
                    "speech-2.8-turbo":     T.speech,
                    "speech-2.6-hd":        T.speech,
                    "speech-2.6-turbo":     T.speech,
                    "speech-02-hd":         T.speech,
                    "speech-02-turbo":      T.speech,
                    // MiniMax Voice Clone — voice sample (audio) + text
                    "MiniMax-Voice-Clone":  T.voice_clone,
                    // Text-only TTS
                    "MiniMax-Voice-Design": T.tts,
                    "qwen3-tts-flash":      T.tts,
                    "vidu-tts":             T.tts,
                    // Kling Sound Effect — prompt + duration
                    "kling-sound-effect":   T.sound_effect,
                    // Kling TTS — prompt + voice
                    "kling-tts":            T.kling_tts,
                    // Kling video→sound — video input → matching audio
                    "kling-video-sound":    T.vid2sound,
                    // Suno music — three modes
                    "suno-inspire":         T.suno_inspire,
                    "suno-custom":          T.suno_custom,
                    "suno-continue":        T.suno_continue,
                }
            },
        }
    };
}

export async function GET(request, { params }) {
    const { path = [] } = await params;

    if (path[0] === 'list') {
        const index = await tosLoadIndex();
        return NextResponse.json(index);
    }

    if (path[0] === 'community') {
        const list = await tosLoadCommunity();
        return NextResponse.json(list);
    }

    if (path[0] === 'get-workflow-def') {
        const id = path[1];
        const wf = store.get(id) || {};
        return NextResponse.json({
            workflow_id: id, id, name: wf.name || 'Untitled Workflow',
            data: { nodes: wf.nodes || [] },
            edges: wf.edges || [],
            is_owner: true, is_published: false, is_template: false,
            show_temp_button: false, run_id: null, category: 'General',
        });
    }

    if (path[1] === 'node-schemas') {
        return NextResponse.json(getNodeSchemas());
    }

    if (path[0] === 'run' && path[2] === 'status') {
        const runId = path[1];
        let run = runStore.get(runId);
        if (!run) run = await tosLoadRun(runId);
        if (!run) return NextResponse.json({ status: 'processing', nodes: {} });
        return NextResponse.json(run);
    }

    // GET /api/workflow/debug-video?model=veo3.1&prompt=cat — dumps raw create response + task fields
    // GET /api/workflow/debug-video?task=TASK_ID — polls a specific task and dumps raw response
    if (path[0] === 'debug-video') {
        const { searchParams } = new URL(request.url);
        const cookieKey = request.headers.get('cookie')?.match(/muapi_key=([^;]+)/)?.[1] || '';
        const apiKey = searchParams.get('key')
            || request.headers.get('authorization')?.replace('Bearer ', '')
            || cookieKey || '';
        const task = searchParams.get('task');
        try {
            if (task) {
                // Try several common poll-endpoint shapes and report which works
                const candidates = [
                    `${MEMEFAST}/v1/video/task/${task}`,
                    `${MEMEFAST}/v1/video/tasks/${task}`,
                    `${MEMEFAST}/v1/video/generations/${task}`,
                    `${MEMEFAST}/v1/video/${task}`,
                    `${MEMEFAST}/v1/videos/${task}`,
                ];
                const results = [];
                for (const url of candidates) {
                    try {
                        const r = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
                        const txt = await r.text();
                        results.push({ url, status: r.status, body: txt.slice(0, 800) });
                    } catch (e) { results.push({ url, error: e.message }); }
                }
                return NextResponse.json({ task, results });
            }
            const model = searchParams.get('model') || 'veo3.1';
            const prompt = searchParams.get('prompt') || 'a cat walking';
            const r = await fetch(`${MEMEFAST}/v1/video/create`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, prompt, duration: 5, aspect_ratio: '16:9' }),
            });
            const txt = await r.text();
            let parsed = null; try { parsed = JSON.parse(txt); } catch {}
            return NextResponse.json({ ok: r.ok, status: r.status, raw: txt.slice(0, 1500), keys: parsed ? Object.keys(parsed) : null, parsed });
        } catch (e) {
            return NextResponse.json({ ok: false, error: e.message });
        }
    }

    // GET /api/workflow/debug-models?key=...
    if (path[0] === 'debug-models') {
        const { searchParams } = new URL(request.url);
        const cookieKey = request.headers.get('cookie')?.match(/muapi_key=([^;]+)/)?.[1] || '';
        const apiKey = searchParams.get('key')
            || request.headers.get('authorization')?.replace('Bearer ', '')
            || cookieKey
            || '';
        try {
            const r = await fetch(`${MEMEFAST}/v1/models`, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });
            const data = await r.json();
            const ids = (data.data || []).map(m => m.id).sort();
            return NextResponse.json({ ok: r.ok, status: r.status, count: ids.length, models: ids });
        } catch (e) {
            return NextResponse.json({ ok: false, error: e.message });
        }
    }

    if (path[0] === 'proxy-download') {
        const { searchParams } = new URL(request.url);
        const fileUrl = searchParams.get('url');
        if (!fileUrl) return NextResponse.json({ error: 'No URL' }, { status: 400 });
        try {
            const r = await fetch(fileUrl);
            if (!r.ok) return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
            const contentType = r.headers.get('content-type') || 'application/octet-stream';
            const arrayBuffer = await r.arrayBuffer();
            return new Response(arrayBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': 'attachment',
                    'Cache-Control': 'no-store',
                },
            });
        } catch (e) {
            return NextResponse.json({ error: e.message }, { status: 502 });
        }
    }

    const id = path[0];
    if (!id) return NextResponse.json([]);
    let wf = store.get(id);
    if (!wf) {
        wf = await tosLoadWorkflow(id);
        if (wf) store.set(id, wf);
    }
    return NextResponse.json(wf || emptyWorkflow(id));
}

export async function POST(request, { params }) {
    const { path = [] } = await params;
    let body = {};
    try { body = await request.json(); } catch {}

    if (path[0] === 'cloudfront-signed-url') {
        const fileUrl = body.url;
        if (!fileUrl) return NextResponse.json({ error: 'No URL' }, { status: 400 });
        const proxyUrl = `/api/workflow/proxy-download?url=${encodeURIComponent(fileUrl)}`;
        return NextResponse.json({ signed_url: proxyUrl });
    }

    if (path[0] === 'create' || path.length === 0) {
        const id = body.workflow_id || genId();
        const wf = {
            workflow_id: id, id,
            name: body.name || 'Untitled Workflow',
            nodes: stripBase64(body.data?.nodes || []),
            edges: body.edges || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        store.set(id, wf);
        tosSaveWorkflow(id, wf).catch(() => {});
        return NextResponse.json(wf);
    }

    if (path[1] === 'run') {
        const wfId = path[0];
        const cookieKey1 = request.headers.get('cookie')?.match(/muapi_key=([^;]+)/)?.[1] || '';
        const apiKey = request.headers.get('authorization')?.replace('Bearer ', '') || cookieKey1 || '';
        const inputs = body.inputs || {};
        // Resolve the billing user once for the whole workflow run.
        const billingUser = BILLING_ENABLED ? await getUser(request) : null;

        let wf = store.get(wfId);
        if (!wf) { wf = await tosLoadWorkflow(wfId); if (wf) store.set(wfId, wf); }
        if (!wf) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });

        const nodes = wf.nodes || [];
        const edges = wf.edges || [];

        // Build incoming edges map: nodeId → [{source, sourceHandle, targetHandle}]
        const inEdges = {};
        for (const e of edges) {
            (inEdges[e.target] ??= []).push({ source: e.source, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle });
        }

        // Topological sort
        const visited = new Set(), order = [];
        const visit = (id) => {
            if (visited.has(id)) return;
            visited.add(id);
            for (const dep of (inEdges[id] || [])) visit(dep.source);
            order.push(id);
        };
        for (const n of nodes) visit(n.id);

        // Execute each node in order
        const nodeOutputs = {}; // nodeId → [{type,value}]
        const runId = genId();
        const runNodes = {}; // for pollRunIdStatus format

        const PASSTHROUGH_MODELS = new Set(['text-passthrough', 'image-passthrough', 'video-passthrough', 'audio-passthrough']);

        for (const nodeId of order) {
            const node = nodes.find(n => n.id === nodeId);
            if (!node) continue;

            // Saved nodes use input_params (not data.formValues)
            const params = { ...(node.input_params || {}) };

            // Apply user-provided inputs for input nodes
            const userIn = inputs[nodeId];
            if (userIn) {
                if (userIn.prompt !== undefined) params.prompt = userIn.prompt;
                if (userIn.image_url !== undefined) params.image_url = userIn.image_url;
            }

            // Inject outputs from connected nodes
            for (const dep of (inEdges[nodeId] || [])) {
                const src = (nodeOutputs[dep.source] || [])[0];
                if (!src) continue;
                const th = dep.targetHandle || '';
                // Handle mapping mirrors NodeFlow.jsx client-side edge injection
                if (['imageInput', 'videoInput', 'audioInput2'].includes(th) || th.includes('text')) {
                    params.prompt = src.value;
                } else if (['imageInput2', 'textInput3', 'videoInput6'].includes(th)) {
                    params.images_list = [...(params.images_list || []), src.value];
                } else if (['imageInput3', 'videoInput2', 'audioInput3'].includes(th)) {
                    params.image_url = src.value;
                } else if (['videoInput4', 'audioInput4'].includes(th)) {
                    params.video_url = src.value;
                } else if (['videoInput5', 'audioInput'].includes(th)) {
                    params.audio_url = src.value;
                } else if (th === 'videoInput3') {
                    params.last_image = src.value;
                }
            }

            // Saved nodes use node.model (not node.data.selectedModel.id)
            const model = node.model || '';
            if (model) {
                // Billing: charge this node before running it.
                const cost = costForNode(model, params);
                let billed = false;
                if (billingUser && cost > 0) {
                    const charged = await deduct(billingUser.id, cost);
                    if (!charged.ok && charged.reason === 'insufficient') {
                        return NextResponse.json(
                            { error: 'insufficient_funds', node: nodeId, required: cost, balance: charged.balance },
                            { status: 402 }
                        );
                    }
                    billed = charged.ok;
                }

                const nRunId = genId();
                await runNode(nRunId, nodeId, model, params, apiKey, billingUser?.id);
                const nr = runStore.get(nRunId);
                // Refund if this node failed.
                if (billed && nr?.status === 'failed') {
                    await refund(billingUser.id, cost).catch(() => {});
                }
                const outs = nr?.nodes?.[nodeId]?.[0]?.result?.outputs || [];
                nodeOutputs[nodeId] = outs;
                runNodes[nodeId] = nr?.nodes?.[nodeId] || [];
            }
        }

        // Collect outputs: prefer make_output flag, fallback to non-passthrough nodes
        let outputNodes = nodes.filter(n => n.input_params?.make_output);
        if (!outputNodes.length) outputNodes = nodes.filter(n => n.model && !PASSTHROUGH_MODELS.has(n.model));
        const outputs = outputNodes.flatMap(n => nodeOutputs[n.id] || []);

        const runResult = { status: 'completed', nodes: runNodes, outputs };
        runStore.set(runId, runResult);
        await tosSaveRun(runId, runResult).catch(() => {});
        return NextResponse.json({ run_id: runId, ...runResult });
    }

    if (path[1] === 'node' && path[3] === 'run') {
        const nodeId = path[2];
        const runId = body.run_id || genId();
        const cookieKey2 = request.headers.get('cookie')?.match(/muapi_key=([^;]+)/)?.[1] || '';
        const apiKey = request.headers.get('authorization')?.replace('Bearer ', '') || cookieKey2 || '';
        const model = body.model || '';
        const params = body.params || {};

        // Billing: charge the logged-in user's balance before generating.
        // No-op when billing is disabled or the user isn't authenticated.
        const cost = costForNode(model, params);
        let billedUser = null;
        if (BILLING_ENABLED && cost > 0) {
            const user = await getUser(request);
            if (user) {
                const charged = await deduct(user.id, cost);
                if (!charged.ok && charged.reason === 'insufficient') {
                    return NextResponse.json(
                        { error: 'insufficient_funds', required: cost, balance: charged.balance },
                        { status: 402 }
                    );
                }
                if (charged.ok) billedUser = user;
            }
        }

        await runNode(runId, nodeId, model, params, apiKey, billedUser?.id);
        const result = runStore.get(runId) || { status: 'processing', nodes: {} };

        // Refund if the generation ended up failing.
        if (billedUser && result.status === 'failed') {
            await refund(billedUser.id, cost).catch(() => {});
        }
        return NextResponse.json({ run_id: runId, cost, ...result });
    }

    // Publish: handles both /api/workflow/{id}/publish and /api/workflow/workflow/{id}/publish
    const publishIdx = path.indexOf('publish');
    if (publishIdx > 0) {
        const wfId = path[publishIdx - 1];
        let wf = store.get(wfId);
        if (!wf) { wf = await tosLoadWorkflow(wfId); if (wf) store.set(wfId, wf); }
        if (!wf) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        // Builder sends { publish: true }, our UI sends { is_published: true }
        const published = body.publish !== undefined ? !!body.publish : (body.is_published !== false);
        if (published) {
            await tosUpdateCommunity(wfId, {
                id: wfId,
                name: wf.name || 'Untitled',
                thumbnail: body.thumbnail || wf.thumbnail || null,
                published_at: new Date().toISOString(),
                nodes_count: (wf.nodes || []).length,
            });
        } else {
            await tosRemoveFromCommunity(wfId);
        }
        const updated = { ...wf, is_published: published, updated_at: new Date().toISOString() };
        store.set(wfId, updated);
        tosSaveWorkflow(wfId, updated).catch(() => {});
        return NextResponse.json({ success: true, publish: published, is_published: published });
    }

    if (['template', 'update-category', 'thumbnail'].includes(path[1])) {
        return NextResponse.json({ success: true });
    }

    if (path[0] === 'architect') {
        return NextResponse.json({ request_id: genId(), status: 'completed', result: {} });
    }

    if (path[0] === 'poll-architect') {
        return NextResponse.json({ status: 'completed', result: {} });
    }

    const id = path[0];
    const existing = store.get(id) || emptyWorkflow(id);
    const updated = { ...existing, ...body, workflow_id: id, id, updated_at: new Date().toISOString() };
    store.set(id, updated);
    tosSaveWorkflow(id, updated).catch(() => {});
    return NextResponse.json(updated);
}

export async function PUT(request, { params }) {
    return POST(request, { params });
}

export async function DELETE(request, { params }) {
    const { path = [] } = await params;
    store.delete(path[0]);
    tosRemoveFromIndex(path[0]).catch(() => {});
    return NextResponse.json({ success: true });
}
