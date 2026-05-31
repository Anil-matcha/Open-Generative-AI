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

async function submitVideo(apiKey, payload, onRequestId) {
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

export async function generateImage(apiKey, params) {
    const modelInfo = getModelById(params.model);
    const modelId = modelInfo?.apiId || params.model;

    const payload = {
        model: modelId,
        prompt: params.prompt,
        n: 1,
    };

    // Map aspect_ratio to size where needed (DALL-E 3, GPT Image)
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
    const url = data.data?.[0]?.url || data.data?.[0]?.b64_json
        ? `data:image/png;base64,${data.data[0].b64_json}` : null;
    return { ...data, url: data.data?.[0]?.url || url };
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

export async function generateVideo(apiKey, params) {
    const modelInfo = getVideoModelById(params.model);
    const modelId = modelInfo?.apiId || params.model;

    const payload = { model: modelId };
    if (params.prompt) payload.prompt = params.prompt;
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.mode) payload.mode = params.mode;
    if (params.image_url) payload.image_url = params.image_url;

    return submitVideo(apiKey, payload, params.onRequestId);
}

export async function generateI2V(apiKey, params) {
    const modelInfo = getI2VModelById(params.model);
    const modelId = modelInfo?.apiId || params.model;
    const imageField = modelInfo?.imageField || 'image_url';

    const payload = { model: modelId };
    if (params.prompt) payload.prompt = params.prompt;
    if (params.image_url) payload[imageField] = params.image_url;
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;

    return submitVideo(apiKey, payload, params.onRequestId);
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
                const balance = data.balance ?? data.credits ?? data.remaining ??
                    data.total_granted ?? data.credit ?? null;
                return { balance };
            }
        } catch (err) {
            if (err.message === 'Unauthorized') throw err;
        }
    }
    return { balance: null };
}

// ── Workflow / Agent stubs (not available in Memefast) ───────────────────────
export async function getTemplateWorkflows() { return []; }
export async function getUserWorkflows()     { return []; }
export async function getPublishedWorkflows(){ return []; }
export async function getTemplateAgents()   { return []; }
export async function getUserAgents()       { return []; }
export async function getPublishedAgents()  { return []; }
export async function getUserConversations(){ return []; }

export async function createWorkflow()    { throw new Error('Workflows недоступны в Memefast API'); }
export async function updateWorkflowName(){ throw new Error('Workflows недоступны в Memefast API'); }
export async function deleteWorkflow()    { throw new Error('Workflows недоступны в Memefast API'); }
export async function getWorkflowInputs() { return {}; }
export async function executeWorkflow()   { throw new Error('Workflows недоступны в Memefast API'); }
export async function getAllNodeSchemas()  { return {}; }
export async function getWorkflowData()   { return {}; }
export async function getNodeSchemas()    { return {}; }
export async function runSingleNode()     { throw new Error('Workflows недоступны в Memefast API'); }
export async function deleteNodeRun()     { return {}; }
export async function getNodeStatus()     { return {}; }
export async function calculateDynamicCost() { return { cost: 0 }; }
export async function registerAppInterest()  { return {}; }
export async function getAppInterests()      { return []; }
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
