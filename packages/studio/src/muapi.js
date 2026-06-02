import { getModelById, getVideoModelById, getI2IModelById, getI2VModelById, getV2VModelById, getLipSyncModelById, getAudioModelById } from './models.js';

// Browser: route through Next.js proxy /api/mf → memefast.top (avoids CORS)
// SSR / Electron: call upstream directly
const BASE_URL = (typeof window !== 'undefined' && window.location?.protocol?.startsWith('http'))
    ? '/api/mf'
    : 'https://memefast.top';

function notifyAuthRequired(status, detail) {
    if (typeof window === 'undefined') return;
    if (status !== 401 && status !== 403) return;
    window.dispatchEvent(new CustomEvent('muapi:auth-required', { detail: { status, message: detail } }));
}

function bearerHeaders(key) {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
}

// ── Unified video format (/v1/video/create → /v1/video/task/{id}) ────────────

async function pollVideoTask(taskId, key, maxAttempts = 300, interval = 3000) {
    const pollUrl = `${BASE_URL}/v1/video/task/${taskId}`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, { headers: bearerHeaders(key) });
            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 500) continue;
                notifyAuthRequired(response.status, errText);
                throw new Error(`Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }
            const data = await response.json();
            const status = (data.status || '').toLowerCase();
            if (status === 'completed' || status === 'succeeded' || status === 'success') {
                const url = data.url || data.video_url || data.output?.url || data.data?.url;
                return { ...data, url };
            }
            if (status === 'failed' || status === 'error') {
                throw new Error(`Generation failed: ${data.error || data.message || 'Unknown error'}`);
            }
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('Generation timed out after polling.');
}

async function submitUnifiedVideo(apiKey, payload, onRequestId) {
    const response = await fetch(`${BASE_URL}/v1/video/create`, {
        method: 'POST',
        headers: bearerHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 200)}`);
    }
    const submitData = await response.json();
    const taskId = submitData.task_id || submitData.id;
    if (!taskId) {
        const url = submitData.url || submitData.video_url;
        return { ...submitData, url };
    }
    if (onRequestId) onRequestId(taskId);
    return await pollVideoTask(taskId, apiKey);
}

// ── Kling (/v1/kling/videos → /v1/kling/videos/{id}) ─────────────────────────

async function pollKlingTask(taskId, key, maxAttempts = 300, interval = 3000) {
    const pollUrl = `${BASE_URL}/v1/kling/videos/${taskId}`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, { headers: bearerHeaders(key) });
            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 500) continue;
                notifyAuthRequired(response.status, errText);
                throw new Error(`Kling Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }
            const data = await response.json();
            const taskData = data.data || data;
            const status = (taskData.task_status || '').toLowerCase();
            if (status === 'succeed' || status === 'completed' || status === 'success') {
                const videos = taskData.task_result?.videos || [];
                const url = videos[0]?.url || taskData.url;
                return { ...data, url };
            }
            if (status === 'failed' || status === 'error') {
                throw new Error(`Kling generation failed: ${taskData.task_status_msg || 'Unknown error'}`);
            }
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('Kling generation timed out after polling.');
}

async function submitKlingT2V(apiKey, payload, onRequestId) {
    const response = await fetch(`${BASE_URL}/v1/kling/videos`, {
        method: 'POST',
        headers: bearerHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`Kling API Failed: ${response.status} - ${errText.slice(0, 200)}`);
    }
    const submitData = await response.json();
    const taskId = submitData.data?.task_id || submitData.task_id;
    if (!taskId) throw new Error('Kling: no task_id in response');
    if (onRequestId) onRequestId(taskId);
    return await pollKlingTask(taskId, apiKey);
}

async function submitKlingI2V(apiKey, payload, onRequestId) {
    const response = await fetch(`${BASE_URL}/v1/kling/videos/image2video`, {
        method: 'POST',
        headers: bearerHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`Kling I2V API Failed: ${response.status} - ${errText.slice(0, 200)}`);
    }
    const submitData = await response.json();
    const taskId = submitData.data?.task_id || submitData.task_id;
    if (!taskId) throw new Error('Kling I2V: no task_id in response');
    if (onRequestId) onRequestId(taskId);
    return await pollKlingTask(taskId, apiKey);
}

// ── Luma (/v1/luma/generations → /v1/luma/generations/{id}) ──────────────────

async function pollLumaTask(taskId, key, maxAttempts = 300, interval = 3000) {
    const pollUrl = `${BASE_URL}/v1/luma/generations/${taskId}`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, { headers: bearerHeaders(key) });
            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 500) continue;
                notifyAuthRequired(response.status, errText);
                throw new Error(`Luma Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }
            const data = await response.json();
            const state = (data.state || '').toLowerCase();
            if (state === 'completed') {
                const url = data.assets?.video || data.video_url;
                return { ...data, url };
            }
            if (state === 'failed') {
                throw new Error(`Luma generation failed: ${data.failure_reason || 'Unknown error'}`);
            }
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('Luma generation timed out after polling.');
}

async function submitLumaVideo(apiKey, payload, onRequestId) {
    const response = await fetch(`${BASE_URL}/v1/luma/generations`, {
        method: 'POST',
        headers: bearerHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`Luma API Failed: ${response.status} - ${errText.slice(0, 200)}`);
    }
    const submitData = await response.json();
    const taskId = submitData.id;
    if (!taskId) throw new Error('Luma: no id in response');
    if (onRequestId) onRequestId(taskId);
    return await pollLumaTask(taskId, apiKey);
}

// ── Sora / OpenAI video format (/v1/video/generations → /v1/video/generations/{id}) ──

async function pollSoraTask(taskId, key, maxAttempts = 300, interval = 4000) {
    const pollUrl = `${BASE_URL}/v1/video/generations/${taskId}`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, { headers: bearerHeaders(key) });
            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 500) continue;
                notifyAuthRequired(response.status, errText);
                throw new Error(`Sora Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }
            const data = await response.json();
            const status = (data.status || '').toLowerCase();
            if (status === 'completed' || status === 'succeeded') {
                const url = data.url || data.video_url || data.data?.[0]?.url;
                return { ...data, url };
            }
            if (status === 'failed') {
                throw new Error(`Sora generation failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('Sora generation timed out after polling.');
}

async function submitSoraVideo(apiKey, payload, onRequestId) {
    const response = await fetch(`${BASE_URL}/v1/video/generations`, {
        method: 'POST',
        headers: bearerHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`Sora API Failed: ${response.status} - ${errText.slice(0, 200)}`);
    }
    const submitData = await response.json();
    const taskId = submitData.id || submitData.task_id;
    if (taskId) {
        if (onRequestId) onRequestId(taskId);
        return await pollSoraTask(taskId, apiKey);
    }
    const url = submitData.url || submitData.video_url;
    return { ...submitData, url };
}

// ── Runway (/v1/runway/image2video → /v1/runway/tasks/{id}) ──────────────────

async function pollRunwayTask(taskId, key, maxAttempts = 300, interval = 4000) {
    const pollUrl = `${BASE_URL}/v1/runway/tasks/${taskId}`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, { headers: bearerHeaders(key) });
            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 500) continue;
                notifyAuthRequired(response.status, errText);
                throw new Error(`Runway Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }
            const data = await response.json();
            const status = (data.status || '').toLowerCase();
            if (status === 'succeeded' || status === 'completed') {
                const url = data.output?.[0] || data.url;
                return { ...data, url };
            }
            if (status === 'failed') {
                throw new Error(`Runway generation failed: ${data.failure_code || 'Unknown error'}`);
            }
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('Runway generation timed out after polling.');
}

async function submitRunwayI2V(apiKey, payload, onRequestId) {
    const response = await fetch(`${BASE_URL}/v1/runway/image2video`, {
        method: 'POST',
        headers: bearerHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`Runway API Failed: ${response.status} - ${errText.slice(0, 200)}`);
    }
    const submitData = await response.json();
    const taskId = submitData.id || submitData.task_id;
    if (!taskId) throw new Error('Runway: no task id in response');
    if (onRequestId) onRequestId(taskId);
    return await pollRunwayTask(taskId, apiKey);
}

// ── Image generation ──────────────────────────────────────────────────────────

export async function generateImage(apiKey, params) {
    const modelInfo = getModelById(params.model);
    const modelId = modelInfo?.apiId || params.model;

    // Gemini image models (gemini-*-image-*) are not served by /v1/images/generations.
    // They are exposed only through the OpenAI-compatible /v1/chat/completions endpoint,
    // returning the image embedded in the assistant message.
    if (/gemini.*image/i.test(modelId)) {
        return generateImageViaChat(apiKey, modelId, params);
    }

    const payload = { model: modelId, prompt: params.prompt, n: 1 };

    if (params.size) {
        payload.size = params.size;
    } else if (params.resolution && params.resolution.includes('x')) {
        payload.size = params.resolution;
    } else if (params.aspect_ratio) {
        payload.size = aspectRatioToSize(params.aspect_ratio);
    }

    if (params.quality) payload.quality = params.quality;

    const response = await fetch(`${BASE_URL}/v1/images/generations`, {
        method: 'POST',
        headers: bearerHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 200)}`);
    }
    const data = await response.json();
    const url = extractImageUrl(data);
    if (!url) {
        console.error('[generateImage] No image URL in response:', JSON.stringify(data).slice(0, 500));
        throw new Error('Сервер не вернул изображение (нет URL в ответе).');
    }
    return { ...data, url };
}

// Generate an image through the OpenAI-compatible chat endpoint (Gemini image models).
async function generateImageViaChat(apiKey, modelId, params) {
    // Build the user content. Include reference images (for editing) when provided.
    const refs = Array.isArray(params.images_list) ? params.images_list.filter(Boolean) : [];
    let content;
    if (refs.length > 0) {
        content = [
            { type: 'text', text: params.prompt },
            ...refs.map((u) => ({ type: 'image_url', image_url: { url: u } })),
        ];
    } else {
        content = params.prompt;
    }

    const payload = {
        model: modelId,
        messages: [{ role: 'user', content }],
        modalities: ['text', 'image'],
        stream: false,
    };

    const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: bearerHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 200)}`);
    }
    const data = await response.json();
    const url = extractImageFromChat(data);
    if (!url) {
        console.error('[generateImageViaChat] No image in chat response:', JSON.stringify(data).slice(0, 800));
        throw new Error('Сервер не вернул изображение (нет URL в ответе).');
    }
    return { ...data, url };
}

// Pull an image URL / data URI out of an OpenAI-compatible chat completion response.
function extractImageFromChat(data) {
    const msg = data?.choices?.[0]?.message;
    if (!msg) return null;

    // 1) OpenRouter / new-api style: message.images[].image_url.url
    const imgs = msg.images;
    if (Array.isArray(imgs) && imgs.length > 0) {
        const first = imgs[0];
        const u = typeof first === 'string' ? first : (first?.image_url?.url || first?.url || first?.image_url);
        if (u) return u;
    }

    // 2) content as an array of parts, with image_url parts
    if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
            const u = part?.image_url?.url || (part?.type === 'image_url' ? part?.image_url : null);
            if (typeof u === 'string') return u;
            if (part?.type === 'output_image' && part?.image) return part.image;
        }
    }

    // 3) content as a string: markdown image, data URI, or bare URL
    if (typeof msg.content === 'string') {
        const c = msg.content;
        const md = c.match(/!\[[^\]]*\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/i);
        if (md) return md[1];
        const data64 = c.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
        if (data64) return data64[0];
        const httpUrl = c.match(/https?:\/\/\S+\.(?:png|jpe?g|webp|gif)(?:\?\S*)?/i);
        if (httpUrl) return httpUrl[0];
    }

    return null;
}

// Robustly pull an image URL (or base64 data URI) out of various provider response shapes.
function extractImageUrl(data) {
    if (!data || typeof data !== 'object') return null;

    // Common containers that may hold the image item(s).
    const item =
        data.data?.[0] ||
        data.images?.[0] ||
        data.output?.[0] ||
        data.output ||
        data.result?.[0] ||
        data.result ||
        data;

    const fromItem = (it) => {
        if (!it) return null;
        if (typeof it === 'string') return it; // some APIs return a bare URL string
        return (
            it.url ||
            it.image_url ||
            it.image ||
            it.imageUrl ||
            (it.b64_json ? `data:image/png;base64,${it.b64_json}` : null) ||
            (it.base64 ? `data:image/png;base64,${it.base64}` : null) ||
            null
        );
    };

    return (
        fromItem(item) ||
        data.url ||
        data.image_url ||
        (Array.isArray(data.urls) ? data.urls[0] : null) ||
        null
    );
}

function aspectRatioToSize(ratio) {
    const map = {
        '1:1':  '1024x1024',
        '16:9': '1792x1024',
        '9:16': '1024x1792',
        '4:3':  '1024x768',
        '3:4':  '768x1024',
        '3:2':  '1536x1024',
        '2:3':  '1024x1536',
    };
    return map[ratio] || '1024x1024';
}

export async function generateI2I(apiKey, params) {
    return generateImage(apiKey, params);
}

// ── Video generation (routes by platform) ─────────────────────────────────────

export async function generateVideo(apiKey, params) {
    const modelInfo = getVideoModelById(params.model);
    const modelId = modelInfo?.apiId || params.model;
    const platform = modelInfo?.platform || 'unified';

    if (platform === 'kling') {
        const payload = {
            model_name: modelId,
            prompt: params.prompt || '',
        };
        if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
        if (params.duration) payload.duration = String(params.duration);
        if (params.mode) payload.mode = params.mode;
        return submitKlingT2V(apiKey, payload, params.onRequestId);
    }

    if (platform === 'luma') {
        const payload = { model: modelId };
        if (params.prompt) payload.prompt = params.prompt;
        if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
        if (params.loop != null) payload.loop = params.loop;
        return submitLumaVideo(apiKey, payload, params.onRequestId);
    }

    if (platform === 'sora') {
        const payload = { model: modelId };
        if (params.prompt) payload.prompt = params.prompt;
        if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
        if (params.duration) payload.duration = params.duration;
        return submitSoraVideo(apiKey, payload, params.onRequestId);
    }

    // unified format (pixverse, veo, grok, wan, happyhorse, minimax, etc.)
    const payload = { model: modelId };
    if (params.prompt) payload.prompt = params.prompt;
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.mode) payload.mode = params.mode;
    if (params.image_url) payload.image_url = params.image_url;
    return submitUnifiedVideo(apiKey, payload, params.onRequestId);
}

export async function generateI2V(apiKey, params) {
    const modelInfo = getI2VModelById(params.model);
    const modelId = modelInfo?.apiId || params.model;
    const platform = modelInfo?.platform || 'unified';
    const imageField = modelInfo?.imageField || 'image_url';

    if (platform === 'kling') {
        const payload = {
            model_name: modelId,
            prompt: params.prompt || '',
            [imageField]: params.image_url,
        };
        if (params.duration) payload.duration = String(params.duration);
        if (params.mode) payload.mode = params.mode;
        return submitKlingI2V(apiKey, payload, params.onRequestId);
    }

    if (platform === 'luma') {
        const payload = { model: modelId };
        if (params.prompt) payload.prompt = params.prompt;
        if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
        // Luma keyframes format: {frame0: {type: "image", url: "..."}}
        if (params.image_url) {
            payload.keyframes = { frame0: { type: 'image', url: params.image_url } };
        }
        return submitLumaVideo(apiKey, payload, params.onRequestId);
    }

    if (platform === 'runway') {
        const payload = { model: modelId };
        if (params.prompt) payload.promptText = params.prompt;
        if (params.image_url) payload[imageField] = params.image_url;
        if (params.duration) payload.duration = params.duration;
        if (params.ratio) payload.ratio = params.ratio;
        else if (params.aspect_ratio) payload.ratio = params.aspect_ratio;
        return submitRunwayI2V(apiKey, payload, params.onRequestId);
    }

    // unified format
    const payload = { model: modelId };
    if (params.prompt) payload.prompt = params.prompt;
    if (params.image_url) payload[imageField] = params.image_url;
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    return submitUnifiedVideo(apiKey, payload, params.onRequestId);
}

export async function generateMarketingStudioAd(apiKey, params) {
    throw new Error('Маркетинговые видео недоступны в Memefast API');
}

export async function processV2V(apiKey, params) {
    throw new Error('Video-to-video недоступен в Memefast API');
}

export async function processLipSync(apiKey, params) {
    throw new Error('LipSync недоступен в Memefast API');
}

// ── Audio ─────────────────────────────────────────────────────────────────────

export async function generateAudio(apiKey, params) {
    const modelId = params._modelId || params.model || 'tts-1';
    const payload = {
        model: modelId,
        input: params.text || params.input || params.prompt || '',
        voice: params.voice || 'alloy',
    };
    if (params.speed) payload.speed = params.speed;

    const response = await fetch(`${BASE_URL}/v1/audio/speech`, {
        method: 'POST',
        headers: bearerHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`Audio generation failed: ${response.status} - ${errText.slice(0, 200)}`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return { url };
}

// ── File upload (base64 data URL, no upload endpoint on Memefast) ─────────────

export function uploadFile(apiKey, file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        if (onProgress) onProgress(30);
        reader.onload = () => {
            if (onProgress) onProgress(100);
            resolve(reader.result);
        };
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
    });
}

// ── Balance query ─────────────────────────────────────────────────────────────

export async function getUserBalance(apiKey) {
    const endpoints = [
        '/v1/user/info',
        '/v1/dashboard/billing/credit_grants',
        '/v1/user/balance',
        '/v1/dashboard/balance',
    ];
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                headers: bearerHeaders(apiKey)
            });
            if (response.status === 401 || response.status === 403) {
                notifyAuthRequired(response.status, await response.text());
                throw new Error('Unauthorized');
            }
            if (response.ok) {
                const data = await response.json();
                // new-api/one-api format: { success:true, data:{ quota:N, used_quota:N } }
                if (data.data?.quota !== undefined) {
                    const remaining = (data.data.quota - (data.data.used_quota || 0)) / 500000;
                    return { balance: remaining.toFixed(2) };
                }
                const balance = data.balance ?? data.credits ?? data.remaining ??
                    data.total_granted ?? data.credit ?? data.data?.balance ?? null;
                return { balance };
            }
        } catch (err) {
            if (err.message === 'Unauthorized') throw err;
        }
    }
    return { balance: null };
}

// ── localStorage helpers for local-first workflow/agent storage ───────────────
function lsGet(key, def) {
    if (typeof window === 'undefined') return def;
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; } catch { return def; }
}
function lsSet(key, val) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function genId() { return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

// ── Workflows (TOS-backed) ────────────────────────────────────────────────────
export async function getTemplateWorkflows(_apiKey) { return []; }
export async function getUserWorkflows(apiKey) {
    try {
        const r = await fetch('/api/workflow/list', { headers: { 'Authorization': `Bearer ${apiKey}` } });
        if (!r.ok) return [];
        return await r.json();
    } catch { return []; }
}
export async function getPublishedWorkflows(apiKey) {
    try {
        const r = await fetch('/api/workflow/community', { headers: { 'Authorization': `Bearer ${apiKey}` } });
        if (!r.ok) return [];
        return await r.json();
    } catch { return []; }
}

export async function createWorkflow(apiKey, data = {}) {
    const r = await fetch('/api/workflow/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Failed to create workflow');
    return await r.json();
}
export async function updateWorkflowName(apiKey, id, name) {
    const r = await fetch(`/api/workflow/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    if (!r.ok) return {};
    return await r.json();
}
export async function deleteWorkflow(apiKey, id) {
    await fetch(`/api/workflow/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${apiKey}` } });
    return { success: true };
}
export async function getWorkflowData(apiKey, id) {
    try {
        const response = await fetch(`/api/workflow/${id}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!response.ok) throw new Error('Not found');
        const wf = await response.json();
        return {
            workflow_id: id, id,
            name: wf.name || 'Untitled Workflow',
            data: { nodes: wf.nodes || [] },
            edges: wf.edges || [],
            is_owner: true, is_published: false, is_template: false,
            show_temp_button: false, run_id: null, category: 'General',
        };
    } catch {
        return { workflow_id: id, id, name: 'Untitled Workflow', data: { nodes: [] }, edges: [], is_owner: true, is_published: false, is_template: false, show_temp_button: false, run_id: null, category: 'General' };
    }
}
export async function getWorkflowInputs(apiKey, id) {
    try {
        const wf = await getWorkflowData(apiKey, id);
        const nodes = wf.data?.nodes || wf.nodes || [];
        const properties = {};
        for (const node of nodes) {
            // Nodes saved by builder use category/model, not type
            const cat = node.category || node.type || '';
            const model = node.model || '';
            if (cat === 'text' || node.type === 'textNode') {
                const prompt = node.input_params?.prompt || node.data?.formValues?.prompt || '';
                properties[node.id] = {
                    type: 'string',
                    title: node.id,
                    description: 'Text input',
                    default: prompt,
                    examples: [prompt],
                };
            } else if (model.includes('passthrough') && (cat === 'image' || node.type === 'uploadNode')) {
                const url = node.input_params?.image_url || node.data?.formValues?.image_url || '';
                properties[node.id] = {
                    type: 'string',
                    title: node.id + ' (image URL)',
                    description: 'Image URL',
                    field: 'image',
                    default: url,
                };
            }
        }
        return { properties, required: [] };
    } catch {
        return { properties: {}, required: [] };
    }
}
export async function getAllNodeSchemas(_apiKey, id) {
    try {
        const response = await fetch(`/api/workflow/${id}/node-schemas`);
        if (!response.ok) return { categories: {} };
        return await response.json();
    } catch { return { categories: {} }; }
}
export async function getNodeSchemas(_apiKey)             { return { categories: {} }; }
export async function calculateDynamicCost(_apiKey)      { return { cost: 0 }; }
export async function executeWorkflow(apiKey, id, inputs) {
    const response = await fetch(`/api/workflow/${id}/run`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: inputs || {} }),
    });
    if (!response.ok) throw new Error(`Execution failed: ${response.status}`);
    return await response.json();
}
export async function runSingleNode(_apiKey, _type, _inputs) { return { status: 'completed', output: {} }; }
export async function deleteNodeRun()                        { return {}; }
export async function getNodeStatus()                        { return { status: 'completed' }; }

// ── Agents (local storage) ────────────────────────────────────────────────────
export async function getTemplateAgents()    { return []; }
export async function getUserAgents()        { return lsGet('mf_agents', []); }
export async function getPublishedAgents()   { return []; }
export async function getUserConversations() { return lsGet('mf_conversations', []); }

// ── Apps ──────────────────────────────────────────────────────────────────────
export async function registerAppInterest()  { return {}; }
export async function getAppInterests()      { return []; }

// ── Other ─────────────────────────────────────────────────────────────────────
export async function runClipping()          { throw new Error('AI-нарезка недоступна в Memefast API'); }
export async function runMotionGraphics()    { throw new Error('Motion Graphics недоступны в Memefast API'); }
export async function runMotionGraphicsEdit(){ throw new Error('Motion Graphics недоступны в Memefast API'); }

export async function handleProxyRequest(prefix, path, method, headers, body, apiKey) {
    const url = `${BASE_URL}/${path}`;
    const finalHeaders = new Headers(headers);
    finalHeaders.delete('host');
    finalHeaders.delete('connection');
    finalHeaders.delete('content-length');
    if (apiKey) finalHeaders.set('Authorization', `Bearer ${apiKey}`);
    const response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: (method !== 'GET' && method !== 'HEAD') ? body : undefined,
        redirect: 'follow',
    });
    const contentType = response.headers.get('Content-Type') || 'application/json';
    const buffer = await response.arrayBuffer();
    return { status: response.status, contentType, data: buffer };
}

export async function handleServerSideProxy(prefix, request, params, apiKey) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    const method = request.method;
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') body = await request.arrayBuffer();
    const { search } = new URL(request.url);
    const pathWithSearch = search ? `${path}${search}` : path;
    return handleProxyRequest(prefix, pathWithSearch, method, request.headers, body, apiKey);
}
