import { getModelById, getVideoModelById, getI2IModelById, getI2VModelById, getV2VModelById, getLipSyncModelById, getAudioModelById } from './models.js';

// Browser: route through /api/mf proxy (Next.js re-issues the call server-side, avoiding CORS).
// SSR / Electron file:// renderer: call memefast.top directly.
const BASE_URL = (typeof window !== 'undefined' && window.location?.protocol?.startsWith('http'))
    ? '/api/mf'
    : 'https://memefast.top';

function authHeaders(key) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
    };
}

function notifyAuthRequired(status, detail) {
    if (typeof window === 'undefined') return;
    if (status !== 401 && status !== 403) return;
    window.dispatchEvent(new CustomEvent('muapi:auth-required', { detail: { status, message: detail } }));
}

// ─── Video task polling ───────────────────────────────────────────────────────

async function pollVideoTask(taskId, key, maxAttempts = 450, interval = 4000) {
    const pollUrl = `${BASE_URL}/v1/video/task/${taskId}`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(r => setTimeout(r, interval));
        try {
            const res = await fetch(pollUrl, { headers: authHeaders(key) });
            if (!res.ok) {
                const errText = await res.text();
                if (res.status >= 500) continue;
                notifyAuthRequired(res.status, errText);
                throw new Error(`Poll failed: ${res.status} - ${errText.slice(0, 120)}`);
            }
            const data = await res.json();
            const status = (data.status || '').toLowerCase();
            if (status === 'completed' || status === 'succeeded' || status === 'success') {
                const url = data.video_url || data.url || data.output?.url || data.outputs?.[0];
                return { ...data, url };
            }
            if (status === 'failed' || status === 'error') {
                throw new Error(`Generation failed: ${data.error || data.message || 'Unknown error'}`);
            }
            // still pending/processing — keep looping
        } catch (err) {
            if (attempt === maxAttempts) throw err;
        }
    }
    throw new Error('Generation timed out after polling.');
}

// ─── Image generation ─────────────────────────────────────────────────────────

// Maps aspect ratio string like "16:9" to OpenAI size parameter
function aspectRatioToSize(ar) {
    const map = {
        '1:1':  '1024x1024',
        '16:9': '1792x1024',
        '9:16': '1024x1792',
        '4:3':  '1365x1024',
        '3:4':  '1024x1365',
        '3:2':  '1536x1024',
        '2:3':  '1024x1536',
    };
    return map[ar] || '1024x1024';
}

export async function generateImage(apiKey, params) {
    const payload = {
        model: params.model || 'dall-e-3',
        prompt: params.prompt,
        n: 1,
        size: aspectRatioToSize(params.aspect_ratio),
    };
    if (params.quality) payload.quality = params.quality;

    const response = await fetch(`${BASE_URL}/v1/images/generations`, {
        method: 'POST',
        headers: authHeaders(apiKey),
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`Image generation failed: ${response.status} - ${errText.slice(0, 120)}`);
    }
    const data = await response.json();
    const url = data.data?.[0]?.url || data.data?.[0]?.b64_json;
    return { ...data, url };
}

export async function generateI2I(apiKey, params) {
    const modelInfo = getI2IModelById(params.model);
    const imageUrl = params.image_url || params.images_list?.[0];

    // Use image edits endpoint when an image is provided
    if (imageUrl) {
        // Try edits endpoint (OpenAI-compatible)
        const editPayload = {
            model: params.model || 'gpt-image-1',
            prompt: params.prompt,
            n: 1,
            size: aspectRatioToSize(params.aspect_ratio),
            image: imageUrl,
        };
        const response = await fetch(`${BASE_URL}/v1/images/edits`, {
            method: 'POST',
            headers: authHeaders(apiKey),
            body: JSON.stringify(editPayload),
        });
        if (!response.ok) {
            const errText = await response.text();
            notifyAuthRequired(response.status, errText);
            throw new Error(`Image edit failed: ${response.status} - ${errText.slice(0, 120)}`);
        }
        const data = await response.json();
        const url = data.data?.[0]?.url || data.data?.[0]?.b64_json;
        return { ...data, url };
    }

    return generateImage(apiKey, params);
}

// ─── Video generation ─────────────────────────────────────────────────────────

async function createVideoTask(apiKey, payload, onRequestId) {
    const response = await fetch(`${BASE_URL}/v1/video/create`, {
        method: 'POST',
        headers: authHeaders(apiKey),
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`Video create failed: ${response.status} - ${errText.slice(0, 120)}`);
    }
    const data = await response.json();
    const taskId = data.id || data.task_id;
    if (!taskId) {
        // Response might already contain the result
        const url = data.video_url || data.url || data.outputs?.[0];
        return { ...data, url };
    }
    if (onRequestId) onRequestId(taskId);
    return pollVideoTask(taskId, apiKey);
}

export async function generateVideo(apiKey, params) {
    const payload = { model: params.model };
    if (params.prompt) payload.prompt = params.prompt;
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.enhance_prompt !== undefined) payload.enhance_prompt = params.enhance_prompt;
    return createVideoTask(apiKey, payload, params.onRequestId);
}

export async function generateI2V(apiKey, params) {
    const modelInfo = getI2VModelById(params.model);
    const payload = { model: params.model };
    if (params.prompt) payload.prompt = params.prompt;
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;

    // Memefast I2V uses "images" array
    const imageUrl = params.image_url;
    if (imageUrl) payload.images = [imageUrl];
    if (params.enhance_prompt !== undefined) payload.enhance_prompt = params.enhance_prompt;

    return createVideoTask(apiKey, payload, params.onRequestId);
}

export async function generateMarketingStudioAd(apiKey, params) {
    const payload = {
        model: 'seedance-1-pro',
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio || '16:9',
    };
    if (params.images_list?.length) payload.images = params.images_list;
    return createVideoTask(apiKey, payload, params.onRequestId);
}

export async function processV2V(apiKey, params) {
    const payload = {
        model: params.model || 'kling-video-effects',
        video_url: params.video_url,
    };
    if (params.prompt) payload.prompt = params.prompt;
    if (params.image_url) payload.image_url = params.image_url;
    return createVideoTask(apiKey, payload, params.onRequestId);
}

// ─── LipSync ──────────────────────────────────────────────────────────────────

export async function processLipSync(apiKey, params) {
    const payload = {
        model: params.model || 'kling-advanced-lip-sync',
    };
    if (params.audio_url) payload.audio_url = params.audio_url;
    if (params.image_url) payload.image_url = params.image_url;
    if (params.video_url) payload.video_url = params.video_url;
    if (params.resolution) payload.resolution = params.resolution;
    return createVideoTask(apiKey, payload, params.onRequestId);
}

// ─── Audio ────────────────────────────────────────────────────────────────────

export async function generateAudio(apiKey, params) {
    const modelId = params._modelId || params.model || 'tts-1';
    const payload = {
        model: modelId,
        input: params.text || params.prompt || '',
        voice: params.voice || 'alloy',
        response_format: 'mp3',
    };

    const response = await fetch(`${BASE_URL}/v1/audio/speech`, {
        method: 'POST',
        headers: authHeaders(apiKey),
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`Audio generation failed: ${response.status} - ${errText.slice(0, 120)}`);
    }

    // Check if response is JSON (some models return URL) or binary audio
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const data = await response.json();
        return { url: data.url || data.audio_url };
    }

    // Binary audio — convert to object URL for in-browser playback
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return { url };
}

// ─── File upload ──────────────────────────────────────────────────────────────

export function uploadFile(apiKey, file, onProgress) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}/v1/files`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('purpose', 'assistants');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    onProgress(Math.round((event.loaded / event.total) * 100));
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    // OpenAI Files API returns {id, ...} not a direct URL
                    // Try common URL fields first, fall back to building from file ID
                    const fileUrl = data.url || data.file_url || data.data?.url;
                    if (fileUrl) {
                        resolve(fileUrl);
                    } else {
                        reject(new Error('No URL returned from file upload'));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse upload response'));
                }
            } else {
                let detail = xhr.statusText;
                try {
                    const errObj = JSON.parse(xhr.responseText);
                    detail = errObj.error?.message || errObj.detail || detail;
                } catch (_) { /* ignore */ }
                notifyAuthRequired(xhr.status, detail);
                reject(new Error(`File upload failed: ${xhr.status} - ${detail}`));
            }
        };

        xhr.onerror = () => reject(new Error('Network error during file upload'));
        xhr.send(formData);
    });
}

// ─── Account balance ──────────────────────────────────────────────────────────

export async function getUserBalance(apiKey) {
    const response = await fetch(`${BASE_URL}/v1/dashboard/billing/credit_grants`, {
        headers: authHeaders(apiKey),
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`Failed to fetch balance: ${response.status} - ${errText.slice(0, 120)}`);
    }
    const data = await response.json();
    // Normalize to { balance } so the shell UI can display it
    const balance = data.total_available ?? data.balance ?? data.credits ?? data.quota ?? 0;
    return { ...data, balance };
}

// ─── Workflow stubs (not supported by Memefast) ───────────────────────────────

export async function getTemplateWorkflows() { return []; }
export async function getUserWorkflows() { return []; }
export async function getPublishedWorkflows() { return []; }
export async function createWorkflow() { return {}; }
export async function updateWorkflowName() { return {}; }
export async function deleteWorkflow() { return {}; }
export async function getWorkflowInputs() { return {}; }
export async function executeWorkflow() { return {}; }
export async function getAllNodeSchemas() { return {}; }
export async function getWorkflowData() { return {}; }
export async function getNodeSchemas() { return {}; }
export async function runSingleNode() { return {}; }
export async function deleteNodeRun() { return {}; }
export async function getNodeStatus() { return {}; }

// ─── Agent stubs ──────────────────────────────────────────────────────────────

export async function getTemplateAgents() { return []; }
export async function getUserAgents() { return []; }
export async function getPublishedAgents() { return []; }
export async function getUserConversations() { return []; }

// ─── Utility stubs ────────────────────────────────────────────────────────────

export async function calculateDynamicCost() { return { credits: 0 }; }
export async function registerAppInterest() { return {}; }
export async function getAppInterests() { return []; }
export async function runClipping(apiKey, params) {
    const payload = {
        model: 'kling-video-v1.6-standard',
        video_url: params.video_url,
        prompt: `Create ${params.num_highlights || 3} highlight clips, aspect ratio ${params.aspect_ratio || '9:16'}`,
        aspect_ratio: params.aspect_ratio || '9:16',
    };
    return createVideoTask(apiKey, payload, params.onRequestId);
}
export async function runMotionGraphics(apiKey, params) {
    const payload = {
        model: 'veo3.1-fast',
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio || '16:9',
    };
    return createVideoTask(apiKey, payload, params.onRequestId);
}
export async function runMotionGraphicsEdit(apiKey, params) {
    const payload = {
        model: 'veo3.1-fast',
        prompt: params.edit_prompt,
        aspect_ratio: params.aspect_ratio || '16:9',
    };
    return createVideoTask(apiKey, payload, params.onRequestId);
}

// ─── Server-side proxy helpers (used by Next.js API routes) ───────────────────

export async function handleProxyRequest(prefix, path, method, headers, body, apiKey) {
    const url = `https://memefast.top/${path}`;

    const finalHeaders = new Headers(headers);
    finalHeaders.delete('host');
    finalHeaders.delete('connection');
    finalHeaders.delete('content-length');

    if (apiKey) {
        finalHeaders.set('Authorization', `Bearer ${apiKey}`);
    }

    try {
        const response = await fetch(url, {
            method,
            headers: finalHeaders,
            body: (method !== 'GET' && method !== 'HEAD') ? body : undefined,
            redirect: 'follow',
        });

        const contentType = response.headers.get('Content-Type') || 'application/json';
        const buffer = await response.arrayBuffer();

        return { status: response.status, contentType, data: buffer };
    } catch (error) {
        console.error(`Memefast proxy error for ${url}:`, error);
        throw error;
    }
}

export async function handleServerSideProxy(prefix, request, params, apiKey) {
    try {
        const slug = await params;
        const pathSegments = slug.path || [];
        const path = pathSegments.join('/');

        const method = request.method;
        let body = null;
        if (method !== 'GET' && method !== 'HEAD') {
            body = await request.arrayBuffer();
        }

        const { search } = new URL(request.url);
        const pathWithSearch = search ? `${path}${search}` : path;

        return await handleProxyRequest(prefix, pathWithSearch, method, request.headers, body, apiKey);
    } catch (error) {
        console.error(`Server proxy failed:`, error);
        throw error;
    }
}
