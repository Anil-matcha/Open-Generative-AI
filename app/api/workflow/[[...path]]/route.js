import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';

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

        // Volcano Engine TOS native signing uses X-Date / X-Content-Sha256 (not x-amz-*)
        const canonHeaders = `content-length:${buffer.length}\ncontent-type:${contentType}\nhost:${host}\nx-content-sha256:${payloadHash}\nx-date:${datetime}\n`;
        const signedHeaders = 'content-length;content-type;host;x-content-sha256;x-date';
        const canonical = `PUT\n${path}\n\n${canonHeaders}\n${signedHeaders}\n${payloadHash}`;

        // TOS signing: no "AWS4" prefix, service = "tos", terminal = "request"
        const scope = `${date}/${TOS_REGION}/tos/request`;
        const strToSign = `HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;

        const sigKey = hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
        const sig = createHmac('sha256', sigKey).update(strToSign).digest('hex');
        const auth = `HMAC-SHA256 Credential=${TOS_AK}/${scope},Date=${datetime},SignedHeaders=${signedHeaders},Signature=${sig}`;

        const res = await fetch(`https://${host}${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': auth,
                'Content-Type': contentType,
                'Content-Length': String(buffer.length),
                'X-Content-Sha256': payloadHash,
                'X-Date': datetime,
            },
            body: buffer,
        });
        if (!res.ok) { console.error('TOS upload failed:', res.status, await res.text().catch(() => '')); return null; }
        return `https://${host}${path}`;
    } catch (e) { console.error('TOS upload error:', e.message); return null; }
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

// Persist workflow to TOS (so it survives Vercel cold starts)
async function tosSaveWorkflow(id, data) {
    if (!TOS_ENABLED) return;
    const buf = Buffer.from(JSON.stringify(data));
    await tosUpload(`workflows/${id}.json`, buf, 'application/json').catch(() => {});
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
// ─────────────────────────────────────────────────────────────────────────────

const MEMEFAST = 'https://memefast.top';

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
    'kling-video-edit-extend',
]);

const TEXT_MODELS = new Set(['text-passthrough', 'any-llm', 'openrouter-vision', 'gpt-5-nano', 'gpt-5-mini']);

const AUDIO_MODELS = new Set([
    'audio-passthrough',
    'MiniMax-Voice-Clone', 'MiniMax-Voice-Design',
    'speech-02-hd', 'speech-02-turbo',
    'speech-2.6-hd', 'speech-2.6-turbo',
    'speech-2.8-hd', 'speech-2.8-turbo',
    'tts-1', 'tts-1-hd',
    'vidu-tts', 'qwen3-tts-flash',
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
    'pixverse-video-edit':           'pixverse-modify',
    'pixverse-restyle-edit':         'pixverse-restyle',
    'pixverse-lipsync-edit':         'pixverse-lipsync',
    'kling-video-edit-extend':       'kling-video-extend',
};

async function generateImage(apiKey, model, params) {
    const apiModel = MODEL_ID_MAP[model] || model;
    const size = (params.width && params.height) ? `${params.width}x${params.height}` : '1024x1024';
    const imgInput = params.image_url || params.images_list?.[0];

    // Use /v1/images/edits for image editing models that have an input image
    if (imgInput && (model.includes('edit') || model.includes('reference') || model.includes('inpaint'))) {
        const form = new FormData();
        form.append('model', apiModel);
        form.append('prompt', params.prompt || '');
        form.append('n', '1');
        form.append('size', size);
        form.append('image[]', imgInput);
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

async function generateChatImage(apiKey, model, params) {
    const imgInput = params.image_url || params.images_list?.[0];
    const content = imgInput
        ? [{ type: 'image_url', image_url: { url: imgInput } }, { type: 'text', text: params.prompt || '' }]
        : params.prompt || '';
    const res = await fetch(`${MEMEFAST}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content }],
            max_tokens: 8192,
        }),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Chat Image API ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    // Response may be array of parts or a string with embedded data URL
    if (Array.isArray(msg?.content)) {
        for (const part of msg.content) {
            if (part.type === 'image_url') return [{ type: 'image_url', value: part.image_url?.url || '' }];
            if (part.type === 'image') return [{ type: 'image_url', value: part.source?.url || part.url || '' }];
        }
    }
    const text = typeof msg?.content === 'string' ? msg.content : '';
    const match = text.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (match) return [{ type: 'image_url', value: match[0] }];
    const urlMatch = text.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp|gif)/i);
    if (urlMatch) return [{ type: 'image_url', value: urlMatch[0] }];
    return [{ type: 'image_url', value: text }];
}

async function generateText(apiKey, model, params) {
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
    const res = await fetch(`${MEMEFAST}/v1/video/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: apiModel, prompt: params.prompt || '',
            image_url: params.image_url,
            duration: params.duration || 5,
            aspect_ratio: params.aspect_ratio || '16:9',
        }),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`Video API ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();
    const taskId = data.task_id || data.id;
    if (!taskId) return [{ type: 'video_url', value: data.url || data.video_url || '' }];

    for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`${MEMEFAST}/v1/video/task/${taskId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (!poll.ok) continue;
        const pData = await poll.json();
        const st = (pData.status || '').toLowerCase();
        if (st === 'completed' || st === 'succeeded' || st === 'success') {
            return [{ type: 'video_url', value: pData.url || pData.video_url || pData.output?.url || '' }];
        }
        if (st === 'failed' || st === 'error') throw new Error(pData.error || 'Video generation failed');
    }
    throw new Error('Video generation timed out');
}

async function generateAudio(apiKey, model, params) {
    const res = await fetch(`${MEMEFAST}/v1/audio/speech`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: params.prompt || '', voice: params.voice || 'alloy' }),
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

async function runNode(runId, nodeId, model, params, apiKey) {
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

        // Upload any base64 images to TOS → replace with public URL
        for (const out of outputs) {
            if (out.type === 'image_url' && out.value?.startsWith('data:')) {
                out.value = await maybeUploadToTOS(out.value);
            }
        }

        runStore.set(runId, {
            status: 'completed',
            nodes: { [nodeId]: [{ status: 'succeeded', result: { outputs } }] },
        });
    } catch (err) {
        console.error(`Node run error [${nodeId}]:`, err.message);
        runStore.set(runId, {
            status: 'failed',
            nodes: { [nodeId]: [{ status: 'failed', result: { outputs: [{ type: 'error', value: err.message }] } }] },
        });
    }
}

function getNodeSchemas() {
    const F = {
        prompt:      { type: "string", title: "Prompt", description: "Describe what you want to generate", examples: [""] },
        width:       { type: "int", title: "Width", default: 1024, minValue: 256, maxValue: 4096, step: 64 },
        height:      { type: "int", title: "Height", default: 1024, minValue: 256, maxValue: 4096, step: 64 },
        aspect_ratio:{ enum: ["1:1","16:9","9:16","4:3","3:4","21:9"], type: "string", title: "Aspect Ratio", default: "1:1" },
        quality:     { enum: ["standard","hd"], type: "string", title: "Quality", default: "standard" },
        images_list: { type: "array", title: "Input Images", field: "images_list", maxItems: 5, description: "Images to edit or use as reference", examples: [] },
        image_url:   { type: "string", title: "Image URL", field: "image", description: "URL of the input image", examples: [] },
        video_url:   { type: "string", title: "Video URL", field: "video", description: "URL of the input video", examples: [] },
        audio_url:   { type: "string", title: "Audio URL", field: "audio", description: "URL of the input audio", examples: [] },
        duration:    { type: "int", title: "Duration (sec)", default: 5, minValue: 3, maxValue: 30, step: 1 },
        ar_video:    { enum: ["16:9","9:16","1:1","4:3"], type: "string", title: "Aspect Ratio", default: "16:9" },
        voice:       { enum: ["alloy","echo","fable","onyx","nova","shimmer"], type: "string", title: "Voice", default: "alloy" },
    };

    const ms = (props) => ({ input_schema: { schemas: { input_data: { properties: props } } } });

    const T = {
        t2i:    ms({ prompt: F.prompt, aspect_ratio: F.aspect_ratio }),
        t2iQ:   ms({ prompt: F.prompt, aspect_ratio: F.aspect_ratio, quality: F.quality }),
        t2iWH:  ms({ prompt: F.prompt, width: F.width, height: F.height }),
        i2i:    ms({ prompt: F.prompt, images_list: F.images_list }),
        imgRef: ms({ prompt: F.prompt, image_url: F.image_url }),
        imgPass:ms({ image_url: F.image_url }),
        vidPass:ms({ video_url: F.video_url }),
        audPass:ms({ audio_url: F.audio_url }),
        t2v:    ms({ prompt: F.prompt, duration: F.duration, aspect_ratio: { ...F.ar_video } }),
        i2v:    ms({ prompt: F.prompt, image_url: F.image_url, duration: F.duration }),
        vidEdit:ms({ prompt: F.prompt, video_url: F.video_url }),
        lipsync:ms({ video_url: F.video_url, audio_url: F.audio_url }),
        vision: ms({ prompt: F.prompt, image_url: F.image_url }),
        txtPass:ms({ prompt: { type: "string", title: "Text", description: "Enter your text", examples: [""] } }),
        speech: ms({ prompt: F.prompt, voice: F.voice }),
        tts:    ms({ prompt: F.prompt }),
    };

    return {
        categories: {
            image: {
                models: {
                    "image-passthrough":              T.imgPass,
                    // OpenAI Image
                    "gpt-image-2":                    T.t2iQ,
                    "gpt-image-1.5":                  T.t2iQ,
                    "gpt-image-1":                    T.t2iQ,
                    "gpt-image-1-mini":               T.t2i,
                    "dall-e-3":                       T.t2i,
                    // OpenAI Image Edit (→ /v1/images/edits)
                    "gpt-image-2-edit":               T.i2i,   // → gpt-image-2
                    "gpt-image-1.5-edit":             T.i2i,   // → gpt-image-1.5
                    "gpt-image-1-edit":               T.i2i,   // → gpt-image-1
                    // Flux
                    "flux-2-pro":                     T.t2i,
                    "flux-1.1-pro":                   T.t2i,
                    "flux-edit-kontext-pro":          T.i2i,   // → flux.1-kontext-pro
                    // ByteDance Seedream
                    "doubao-seedream-5-0-260128":      T.t2i,
                    "doubao-seedream-4-5-251128":      T.t2i,
                    "doubao-seedream-4-0-250828":      T.t2i,
                    "doubao-seedream-3-0-t2i-250415":  T.t2i,
                    // Qwen Image
                    "qwen-image-max":                 T.t2i,
                    "qwen-image-2.0-2026-03-03":      T.t2i,
                    "qwen-image-edit-2509":           T.i2i,
                    // z-image
                    "z-image-turbo":                  T.t2i,
                    // Kling Image
                    "kling-image":                    T.t2i,
                    "kling-omni-image-edit":          T.i2i,   // → kling-omni-image
                    // Grok Image
                    "grok-4.2-image":                 T.t2i,
                    "grok-4.1-image":                 T.t2i,
                    "grok-4-image":                   T.t2i,
                    "grok-imagine-image":             T.t2i,
                    "grok-imagine-image-reference":   T.imgRef, // → grok-imagine-image-pro
                    // Midjourney
                    "mj_imagine":                     T.t2i,
                    "mj_edits":                       T.i2i,
                    "mj_inpaint-edit":                T.i2i,   // → mj_inpaint
                    "mj_variation-reference":         T.imgRef, // → mj_variation
                    // Wan Image
                    "wan2.7-image-pro":               T.t2iWH,
                    // Gemini Image (accept optional image for editing)
                    "gemini-3.1-flash-image-preview": T.imgRef,
                    "gemini-3-pro-image-preview":     T.imgRef,
                    "gemini-2.5-flash-image":         T.imgRef,
                    // Gemini Edit Image (same models, shown in Edit Image section)
                    "gemini-2.5-flash-image-edit":    T.imgRef,  // → gemini-2.5-flash-image
                    "gemini-3-pro-image-edit":        T.imgRef,  // → gemini-3-pro-image-preview
                    "gemini-3.1-flash-image-edit":    T.imgRef,  // → gemini-3.1-flash-image-preview
                }
            },
            video: {
                models: {
                    "video-passthrough":                    T.vidPass,
                    // ByteDance Seedance
                    "doubao-seedance-1-5-pro-251215":       T.t2v,
                    "doubao-seedance-1-0-pro-fast-251015":  T.t2v,
                    "doubao-seedance-1-0-pro-250528":       T.t2v,
                    "doubao-seedance-1-0-lite-t2v-250428":  T.t2v,
                    "doubao-seedance-1-0-lite-i2v-250428":  T.i2v,
                    // Google Veo
                    "veo3.1-pro":    T.t2v,
                    "veo3.1-4k":     T.t2v,
                    "veo3.1":        T.t2v,
                    "veo3.1-fast":   T.t2v,
                    "veo_3_1":       T.t2v,
                    "veo_3_1-fast":  T.t2v,
                    // OpenAI Sora
                    "sora-2": T.t2v,
                    // Grok Video
                    "grok-video-3":     T.t2v,
                    "grok-video-3-10s": T.t2v,
                    // Kling Video
                    "kling-omni-video":            T.t2v,
                    "kling-video":                 T.t2v,
                    "kling-avatar-image2video":    T.i2v,
                    "kling-video-edit-extend":     T.i2v,    // → kling-video-extend
                    // Happyhorse
                    "happyhorse-1.0-t2v":        T.t2v,
                    "happyhorse-1.0-i2v":        T.i2v,
                    "happyhorse-1.0-r2v":        T.i2v,
                    "happyhorse-1.0-video-edit": T.vidEdit,
                    // Midjourney Video
                    "mj_video": T.t2v,
                    // Pixverse
                    "pixverse-video":            T.t2v,
                    "pixverse-mimic":            T.i2v,
                    "pixverse-video-edit":       T.vidEdit,  // → pixverse-modify
                    "pixverse-restyle-edit":     T.vidEdit,  // → pixverse-restyle
                    "pixverse-lipsync-edit":     T.lipsync,  // → pixverse-lipsync
                    // Wan Video
                    "wan2.6-i2v":           T.i2v,
                    "wan2.5-i2v-preview":   T.i2v,
                    // Vidu Video
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
                }
            },
            audio: {
                models: {
                    "audio-passthrough":    T.audPass,
                    "speech-2.8-hd":        T.speech,
                    "speech-2.8-turbo":     T.speech,
                    "speech-2.6-hd":        T.speech,
                    "speech-2.6-turbo":     T.speech,
                    "speech-02-hd":         T.speech,
                    "speech-02-turbo":      T.speech,
                    "tts-1-hd":             T.speech,
                    "tts-1":                T.speech,
                    "MiniMax-Voice-Design": T.tts,
                    "qwen3-tts-flash":      T.tts,
                    "vidu-tts":             T.tts,
                }
            },
        }
    };
}

export async function GET(request, { params }) {
    const { path = [] } = await params;

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
        const run = runStore.get(path[1]);
        if (!run) return NextResponse.json({ status: 'processing', nodes: {} });
        return NextResponse.json(run);
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
        const runId = genId();
        return NextResponse.json({ run_id: runId, status: 'completed', result: {} });
    }

    if (path[1] === 'node' && path[3] === 'run') {
        const nodeId = path[2];
        const runId = body.run_id || genId();
        const apiKey = request.headers.get('authorization')?.replace('Bearer ', '') || '';
        const model = body.model || '';
        const params = body.params || {};
        runNode(runId, nodeId, model, params, apiKey).catch(() => {});
        return NextResponse.json({ run_id: runId, status: 'processing' });
    }

    if (['publish', 'template', 'update-category', 'thumbnail'].includes(path[1])) {
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
    return NextResponse.json({ success: true });
}
