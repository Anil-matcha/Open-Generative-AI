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

// Append a memefast routing suffix to the model name so the client can pick a
// strategy: :floor (cheapest), :nitro (fastest), :stable (most reliable).
// 'default' / empty leaves the model name untouched.
function applyRouting(modelId, routing) {
    if (routing && routing !== 'default') return `${modelId}:${routing}`;
    return modelId;
}

export async function generateImage(apiKey, params) {
    const modelInfo = getModelById(params.model);
    const baseModelId = modelInfo?.apiId || params.model;

    // Gemini image models (gemini-*-image-*) are not served by /v1/images/generations.
    // They use the native Gemini generateContent endpoint, which supports
    // imageConfig (aspectRatio / imageSize) and base64 reference images.
    if (/gemini.*image/i.test(baseModelId)) {
        return generateGeminiImage(apiKey, baseModelId, params);
    }

    const modelId = applyRouting(baseModelId, params.routing);
    const payload = { model: modelId, prompt: params.prompt, n: 1 };

    if (params.size) {
        payload.size = params.size;
    } else if (params.resolution && params.resolution.includes('x')) {
        payload.size = params.resolution;
    } else if (params.aspect_ratio) {
        payload.size = aspectRatioToSize(params.aspect_ratio);
    }

    if (params.quality) payload.quality = params.quality;
    payload.format = params.format || 'jpeg';

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
    // Return the raw url/base64 immediately so the UI can show it without waiting.
    // The caller mirrors it to TOS in the background (see runGeneration).
    return { ...data, url };
}

// Fetch a remote image (or pass through a data URI) and return Gemini inline_data.
async function urlToInlineData(url) {
    try {
        if (!url) return null;
        let dataUrl = url;
        if (!url.startsWith('data:')) {
            const r = await fetch(url);
            if (!r.ok) return null;
            const blob = await r.blob();
            dataUrl = await new Promise((resolve, reject) => {
                const fr = new FileReader();
                fr.onload = () => resolve(fr.result);
                fr.onerror = reject;
                fr.readAsDataURL(blob);
            });
        }
        const m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/s);
        if (!m) return null;
        return { mime_type: m[1], data: m[2] };
    } catch {
        return null;
    }
}

// Pull a base64 image out of a Gemini generateContent response.
function extractGeminiImage(data) {
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return null;
    for (const p of parts) {
        const inline = p?.inlineData || p?.inline_data;
        if (inline?.data) {
            const mime = inline.mimeType || inline.mime_type || 'image/png';
            return `data:${mime};base64,${inline.data}`;
        }
    }
    return null;
}

// Generate / edit an image via the native Gemini generateContent endpoint
// (gemini-*-image-* models, e.g. gemini-3.1-flash-image-preview / Nano Banana 2).
// Supports generationConfig.imageConfig (aspectRatio + imageSize) and base64
// reference images embedded inline. Returns the raw base64 data URI; the caller
// mirrors it to TOS in the background.
async function generateGeminiImage(apiKey, baseModelId, params) {
    const routing = params.routing && params.routing !== 'default' ? `:${params.routing}` : '';
    const url = `${BASE_URL}/v1beta/models/${baseModelId}${routing}:generateContent`;

    const parts = [{ text: params.prompt || '' }];
    // Reference images (editing): embed each one as inline base64 data.
    const refs = Array.isArray(params.images_list) && params.images_list.length > 0
        ? params.images_list.filter(Boolean)
        : params.image_url ? [params.image_url] : [];
    for (const u of refs) {
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

    const response = await fetch(url, {
        method: 'POST',
        headers: bearerHeaders(apiKey),
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 200)}`);
    }
    const data = await response.json();
    const raw = extractGeminiImage(data);
    if (!raw) {
        console.error('[generateGeminiImage] No image in response:', JSON.stringify(data).slice(0, 800));
        throw new Error('Сервер не вернул изображение (нет URL в ответе).');
    }
    // Raw base64 returned immediately; runGeneration mirrors it to TOS in the background.
    return { ...data, url: raw };
}

// Mirror an image (base64 data URI) to TOS via the server, returning a permanent
// public URL. The upload runs server-side because browser→TOS PUTs are CORS-blocked.
// Falls back to the original image on any failure so generation still works.
export async function persistImageToTOS(image) {
    try {
        if (typeof window === 'undefined' || !image) return image;
        // Only base64 data URIs need mirroring; remote http URLs already persist.
        if (typeof image === 'string' && !image.startsWith('data:')) return image;

        const resp = await fetch('/api/upload-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image }),
        });
        if (!resp.ok) return image; // storage not configured / upload failed → keep original
        const { url } = await resp.json();
        return url || image;
    } catch (err) {
        console.warn('persistImageToTOS failed:', err?.message);
        return image;
    }
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

// Image editing via POST /v1/images/edits (multipart/form-data).
// Fetches each image URL as a blob and appends it to the form.
// Used by gpt-image-2 and any model with editEndpoint: true in models.js.
async function generateImageEdit(apiKey, params) {
    const form = new FormData();
    const modelInfo = getModelById(params.model);
    form.append('model', applyRouting(modelInfo?.apiId || params.model, params.routing));
    form.append('prompt', params.prompt || '');
    form.append('n', '1');

    const size = params.size
        || (params.resolution?.includes('x') ? params.resolution : null)
        || (params.aspect_ratio ? aspectRatioToSize(params.aspect_ratio) : '1024x1024');
    form.append('size', size);

    if (params.quality) form.append('quality', params.quality);
    form.append('format', params.format || 'jpeg');
    form.append('background', params.background || 'auto');
    form.append('moderation', params.moderation || 'auto');

    const urls = Array.isArray(params.images_list) && params.images_list.length > 0
        ? params.images_list
        : params.image_url ? [params.image_url] : [];
    for (const url of urls) {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`Не удалось загрузить изображение: ${url}`);
        const blob = await r.blob();
        const ext = blob.type.includes('png') ? 'png' : 'jpeg';
        form.append('image', blob, `image.${ext}`);
    }

    const response = await fetch(`${BASE_URL}/v1/images/edits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`API Request Failed: ${response.status} - ${errText.slice(0, 200)}`);
    }
    const data = await response.json();
    const url = extractImageUrl(data);
    if (!url) throw new Error('Сервер не вернул изображение (нет URL в ответе).');
    // Raw url/base64 returned immediately; TOS mirroring happens in the background.
    return { ...data, url };
}

export async function generateI2I(apiKey, params) {
    const modelInfo = getModelById(params.model);
    if (modelInfo?.editEndpoint) {
        return generateImageEdit(apiKey, params);
    }
    return generateImage(apiKey, params);
}

// ── Seedance 2.0 direct via Volcano Ark (round-robin endpoints) ───────────────

// Generate a Seedance 2.0 video via Ark.
// Submits the task with a short POST, then polls from the browser every 5s
// so we never have a single long-running HTTP connection that can hang.
// After the video is ready, calls /api/upload-file to mirror the Ark CDN URL
// to TOS for permanent storage (fire-and-forget — falls back to Ark URL).
async function generateSeedanceArk(modelInfo, params) {
    const fast = /fast/.test(modelInfo?.apiId || '');
    const body = {
        fast,
        prompt: params.prompt || '',
        image_url: params.image_url || undefined,
        image_urls: Array.isArray(params.image_urls) ? params.image_urls : undefined,
        video_url: params.video_url || undefined,
        video_urls: Array.isArray(params.video_urls) ? params.video_urls : undefined,
        audio_url: params.audio_url || undefined,
        audio_urls: Array.isArray(params.audio_urls) ? params.audio_urls : undefined,
        resolution: params.resolution || undefined,
        ratio: params.aspect_ratio || undefined,
        duration: params.duration || undefined,
    };

    // Step 1: submit task (fast — just creates the Ark task and returns taskId)
    const submit = await fetch('/api/ark/seedance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const submitData = await submit.json().catch(() => ({}));
    if (!submit.ok) throw new Error(`Ark: ${submitData.error || submit.status}`);
    const taskId = submitData.taskId;
    if (!taskId) throw new Error('Ark: задача не создана (нет taskId).');

    // Step 2: poll from the browser — each request is < 1s, no connection hangs
    for (let attempt = 0; attempt < 300; attempt++) {
        await new Promise((r) => setTimeout(r, 5000));
        const poll = await fetch(`/api/ark/seedance?taskId=${encodeURIComponent(taskId)}`);
        const data = await poll.json().catch(() => ({}));
        if (!poll.ok) continue;
        const status = (data.status || '').toLowerCase();
        if (status === 'succeeded' || status === 'success') {
            if (!data.url) throw new Error('Ark: видео готово, но URL не получен.');
            // Return the Ark CDN URL. Permanent TOS mirroring (into videos/) happens
            // server-side when VideoStudio saves the result to the gallery.
            return { url: data.url, id: taskId };
        }
        if (status === 'failed' || status === 'error' || status === 'expired' || status === 'cancelled') {
            throw new Error(`Ark: генерация не удалась (${data.error || status}).`);
        }
    }
    throw new Error('Ark: превышено время ожидания генерации.');
}

// ── Video generation (routes by platform) ─────────────────────────────────────

export async function generateVideo(apiKey, params) {
    const modelInfo = getVideoModelById(params.model);
    const modelId = modelInfo?.apiId || params.model;
    const platform = modelInfo?.platform || 'unified';

    if (modelInfo?.provider === 'ark') {
        return generateSeedanceArk(modelInfo, params);
    }

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

    // unified format (pixverse, veo, grok, wan, happyhorse, minimax, seedance, etc.)
    const payload = { model: modelId };
    if (params.prompt) payload.prompt = params.prompt;
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.mode) payload.mode = params.mode;
    if (params.image_url) payload.image_url = params.image_url;
    if (params.video_url) payload.video_url = params.video_url;
    if (params.audio_url) payload.audio_url = params.audio_url;
    return submitUnifiedVideo(apiKey, payload, params.onRequestId);
}

export async function generateI2V(apiKey, params) {
    const modelInfo = getI2VModelById(params.model);
    const modelId = modelInfo?.apiId || params.model;
    const platform = modelInfo?.platform || 'unified';
    const imageField = modelInfo?.imageField || 'image_url';

    if (modelInfo?.provider === 'ark') {
        return generateSeedanceArk(modelInfo, params);
    }

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
    if (params.video_url) payload.video_url = params.video_url;
    if (params.audio_url) payload.audio_url = params.audio_url;
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

const BALANCE_ENDPOINTS = [
    '/v1/user/info',
    '/v1/dashboard/billing/credit_grants',
    '/v1/user/balance',
    '/v1/dashboard/balance',
];
// Remember which endpoint actually works so polling doesn't spam 404s every
// 30s. `null` = not probed yet, `''` = probed and none work (give up).
let _balanceEndpoint = null;

function parseBalance(data) {
    // new-api/one-api format: { success:true, data:{ quota:N, used_quota:N } }
    if (data.data?.quota !== undefined) {
        const remaining = (data.data.quota - (data.data.used_quota || 0)) / 500000;
        return { balance: remaining.toFixed(2) };
    }
    const balance = data.balance ?? data.credits ?? data.remaining ??
        data.total_granted ?? data.credit ?? data.data?.balance ?? null;
    return { balance };
}

export async function getUserBalance(apiKey) {
    // Once a working endpoint is known, hit only that one. If none worked on the
    // first probe, stop trying entirely to avoid flooding the console with 404s.
    if (_balanceEndpoint === '') return { balance: null };
    const endpoints = _balanceEndpoint ? [_balanceEndpoint] : BALANCE_ENDPOINTS;
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
                _balanceEndpoint = endpoint;
                return parseBalance(await response.json());
            }
        } catch (err) {
            if (err.message === 'Unauthorized') throw err;
        }
    }
    // First full probe found nothing usable — don't retry on later polls.
    if (!_balanceEndpoint) _balanceEndpoint = '';
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
