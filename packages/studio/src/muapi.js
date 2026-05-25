import { getModelById, getVideoModelById, getI2IModelById, getI2VModelById, getV2VModelById, getLipSyncModelById } from './models.js';
import { buildProviderRequestHeaders, getActiveProvider } from './apiProviders.js';

const BASE_URL = 'https://api.muapi.ai';
export const MUAPI_PROXY_PATHS = Object.freeze({
    apiV1: '/api/api/v1',
    workflow: '/api/workflow',
    agents: '/api/agents',
    app: '/api/app'
});
const normalizeApiKey = (apiKey) => {
    if (typeof apiKey !== 'string') return apiKey || null;
    const trimmed = apiKey.trim();
    return trimmed && trimmed !== 'null' && trimmed !== 'undefined' ? trimmed : null;
};

const jsonHeaders = (apiKey, apiConfig = null) => {
    const headers = apiConfig
        ? buildProviderRequestHeaders(apiConfig, { json: true })
        : { 'Content-Type': 'application/json' };
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const normalizedKey = normalizeApiKey(apiKey);
    if (normalizedKey) headers['x-api-key'] = normalizedKey;
    return headers;
};

function getPathValue(source, path) {
    if (!source || !path) return null;
    return path.split('.').reduce((value, key) => {
        if (value == null) return null;
        const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
            const arrayValue = value[arrayMatch[1]];
            return Array.isArray(arrayValue) ? arrayValue[Number(arrayMatch[2])] : null;
        }
        return value[key];
    }, source);
}

function getFirstString(source, paths) {
    for (const path of paths) {
        const value = getPathValue(source, path);
        if (typeof value === 'string' && value.trim()) return value.trim();
        if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    }
    return null;
}

function isNonIdString(value) {
    const text = String(value || '').trim().toLowerCase();
    return (
        !text ||
        /^https?:\/\//i.test(text) ||
        ['success', 'ok', 'failed', 'error', 'processing', 'pending', 'running', 'queued'].includes(text) ||
        text.includes('成功') ||
        text.includes('失败') ||
        text.includes('处理中')
    );
}

function normalizeIdCandidate(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (text.length < 3 || isNonIdString(text)) return null;
    return text;
}

function findRequestIdLikeValue(value, depth = 0) {
    if (!value || depth > 5) return null;
    const direct = normalizeIdCandidate(value);
    if (direct) return direct;

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findRequestIdLikeValue(item, depth + 1);
            if (found) return found;
        }
        return null;
    }

    if (typeof value !== 'object') return null;

    const preferredKeys = [
        'request_id',
        'requestId',
        'task_id',
        'taskId',
        'taskid',
        'id',
        '_id',
        'job_id',
        'jobId',
        'generation_id',
        'generationId',
        'prediction_id',
        'predictionId',
    ];
    for (const key of preferredKeys) {
        const found = findRequestIdLikeValue(value[key], depth + 1);
        if (found) return found;
    }

    for (const key of ['data', 'result', 'task', 'job', 'generation', 'prediction']) {
        const found = findRequestIdLikeValue(value[key], depth + 1);
        if (found) return found;
    }

    for (const [key, nested] of Object.entries(value)) {
        if (!/(request|task|job|generation|prediction|^id$|_id$)/i.test(key)) continue;
        const found = findRequestIdLikeValue(nested, depth + 1);
        if (found) return found;
    }

    return null;
}

function normalizeOutputUrlCandidate(value) {
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (!text) return null;
    if (/^(blob:|data:video\/)/i.test(text)) return text;
    if (!/^https?:\/\//i.test(text)) return null;

    let pathname = text.split(/[?#]/)[0];
    try {
        pathname = new URL(text).pathname || pathname;
    } catch {
        // Keep the split fallback.
    }
    if (/\.(png|jpe?g|webp|gif|avif|bmp|svg)$/i.test(pathname)) return null;
    return text;
}

function findUrlLikeValue(value, keyHint = '') {
    if (!value) return null;
    const hint = String(keyHint || '').toLowerCase();
    if (typeof value === 'string') {
        return /(url|video|result|output|file|download|source|raw)/i.test(hint)
            ? normalizeOutputUrlCandidate(value)
            : null;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findUrlLikeValue(item, hint);
            if (found) return found;
        }
        return null;
    }
    if (typeof value === 'object') {
        for (const key of ['video_url', 'result_url', 'output_url', 'download_url', 'file_url', 'source_url', 'url']) {
            const found = findUrlLikeValue(value[key], key);
            if (found) return found;
        }
        for (const key of ['data', 'result', 'results', 'output', 'outputs', 'video', 'videos', 'content', 'file', 'files']) {
            const found = findUrlLikeValue(value[key], key);
            if (found) return found;
        }
    }
    return null;
}

export function extractRequestId(data, fallback = null) {
    const direct = getFirstString(data, [
        'request_id',
        'requestId',
        'task_id',
        'taskId',
        'taskid',
        'id',
        '_id',
        'job_id',
        'jobId',
        'generation_id',
        'generationId',
        'prediction_id',
        'predictionId',
        'data',
        'data.request_id',
        'data.requestId',
        'data.task_id',
        'data.taskId',
        'data.taskid',
        'data.id',
        'data._id',
        'data.job_id',
        'data.generation_id',
        'data.prediction_id',
        'data[0].request_id',
        'data[0].task_id',
        'data[0].taskId',
        'data[0].id',
        'result',
        'result.request_id',
        'result.requestId',
        'result.task_id',
        'result.taskId',
        'result.id',
        'result.job_id',
        'result.generation_id',
        'result.prediction_id',
        'result[0].request_id',
        'result[0].task_id',
        'result[0].taskId',
        'result[0].id',
    ]);
    return normalizeIdCandidate(direct) || findRequestIdLikeValue(data) || fallback;
}

export function extractOutputUrl(data) {
    const direct = getFirstString(data, [
        'url',
        'video_url',
        'video_urls[0]',
        'result_url',
        'output.url',
        'outputs[0]',
        'data.url',
        'data.video_url',
        'data.video_urls[0]',
        'data.result_url',
        'data.output.url',
        'data.outputs[0]',
        'data[0].url',
        'data[0].video_url',
        'data[0].result_url',
        'data.result.url',
        'data.result.video_url',
        'data.result.result_url',
        'data.content.video_url',
        'data.content.video_urls[0]',
        'result.url',
        'result.video_url',
        'result.video_urls[0]',
        'result.result_url',
        'result[0].url',
        'result[0].video_url',
        'result[0].result_url',
        'content.video_url',
        'content.video_urls[0]',
    ]);
    return normalizeOutputUrlCandidate(direct) || findUrlLikeValue(data);
}

export function extractProviderStatus(data) {
    return getFirstString(data, [
        'data.status',
        'data.state',
        'result.status',
        'result.state',
        'task.status',
        'task.state',
        'status',
        'state',
        'data.code',
        'code',
    ]);
}

function isNonErrorMessage(message) {
    const value = String(message || '').trim().toLowerCase();
    if (!value) return true;
    return (
        ['success', 'ok', 'submitted', 'processing', 'pending', 'running', 'queued', 'request success', 'request successful'].includes(value) ||
        value.includes('successfully') ||
        value.includes('成功') ||
        value.includes('已提交') ||
        value.includes('处理中')
    );
}

function extractErrorMessage(data) {
    if (!data) return null;
    if (typeof data === 'string') return isNonErrorMessage(data) ? null : data;
    const direct = getFirstString(data, [
        'error',
        'message',
        'detail',
        'data.error',
        'data.message',
        'data.detail',
        'error.message',
    ]);
    return direct && !isNonErrorMessage(direct) ? direct : null;
}

export function normalizeTaskStatus(status) {
    const value = String(status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (!value) return null;
    if (['0', '200'].includes(value)) return null;
    if (['completed', 'complete', 'succeeded', 'success', 'successful', 'done', 'finished', 'finish', 'generated'].includes(value)) return 'completed';
    if (value.includes('success')) return 'completed';
    if (['failed', 'failure', 'error', 'errored', 'canceled', 'cancelled', 'rejected'].includes(value)) return 'failed';
    if (value.includes('error') || value.includes('invalid') || value.includes('fail') || value.includes('cancel') || value.includes('reject')) return 'failed';
    if (['processing', 'running', 'queued', 'pending', 'in_progress', 'not_start', 'not_started', 'created', 'submitted', 'waiting', 'starting', 'started', 'generating', 'in_queue', 'queue', 'preparing'].includes(value)) return 'processing';
    if (value.includes('process') || value.includes('queue') || value.includes('pending') || value.includes('generat')) return 'processing';
    return value;
}

export function normalizeGenerationResult(data, fallbackRequestId = null) {
    const source = data && typeof data === 'object' ? data : { raw: data };
    const requestId = extractRequestId(source, fallbackRequestId);
    const providerStatus = extractProviderStatus(source);
    const status = normalizeTaskStatus(providerStatus);
    const url = extractOutputUrl(source);
    const rawError = extractErrorMessage(source);
    const error = status === 'failed' || !status ? rawError : null;
    const normalizedStatus = url
        ? 'completed'
        : error
            ? 'failed'
            : status === 'completed' && requestId
                ? 'processing'
                : status || (requestId ? 'processing' : null);

    return {
        ...source,
        id: source.id || requestId,
        request_id: source.request_id || requestId,
        task_id: source.task_id || requestId,
        status: normalizedStatus || source.status || undefined,
        provider_status: providerStatus || source.provider_status,
        url: url || undefined,
        outputs: url ? [url] : source.outputs,
        error: source.error || error || undefined,
    };
}

export async function pollForResult(requestId, key, maxAttempts = 900, interval = 2000, apiConfig = null, onStatus = null) {
    const pollUrl = `${MUAPI_PROXY_PATHS.apiV1}/predictions/${encodeURIComponent(requestId)}/result`;
    let completedWithoutUrlAttempts = 0;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, {
                headers: jsonHeaders(key, apiConfig)
            });
            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 500) {
                    if (onStatus) {
                        onStatus({
                            request_id: requestId,
                            task_id: requestId,
                            status: 'processing',
                            provider_status: `retry ${response.status}`,
                            attempt,
                            maxAttempts,
                            responseSummary: errText.slice(0, 220),
                        });
                    }
                    continue;
                }
                throw new Error(`轮询失败：${response.status} - ${errText.slice(0, 100)}`);
            }
            const data = await response.json();
            const normalized = normalizeGenerationResult(data, requestId);
            const responseSummary = summarizeResponseForMessage(normalized);
            if (normalized.url) return { ...normalized, status: 'completed' };
            if (normalized.status === 'failed') {
                const error = new Error(`生成失败：${extractErrorMessage(data) || '未知错误'}`);
                error.response = normalized;
                error.responseSummary = responseSummary;
                throw error;
            }
            const providerTaskStatus = normalizeTaskStatus(normalized.provider_status || normalized.status);
            if (providerTaskStatus === 'completed') {
                completedWithoutUrlAttempts += 1;
                if (completedWithoutUrlAttempts >= 5) {
                    const error = new Error(`任务显示已完成但没有返回可播放视频地址（响应：${responseSummary}）`);
                    error.response = normalized;
                    error.responseSummary = responseSummary;
                    throw error;
                }
            } else {
                completedWithoutUrlAttempts = 0;
            }
            if (onStatus) onStatus({ ...normalized, attempt, maxAttempts, responseSummary });
        } catch (error) {
            if (isTransientPollError(error) && attempt < maxAttempts) {
                if (onStatus) {
                    onStatus({
                        request_id: requestId,
                        task_id: requestId,
                        status: 'processing',
                        provider_status: 'retrying',
                        attempt,
                        maxAttempts,
                        responseSummary: error.message?.slice(0, 220),
                    });
                }
                continue;
            }
            throw error;
        }
    }
    throw new Error('轮询超时。');
}

function buildMissingRequestIdMessage(normalized) {
    const status = normalized?.provider_status || normalized?.status || normalized?.code;
    const detail = normalized?.error || normalized?.message || normalized?.detail;
    const parts = [];
    if (status) parts.push(`状态：${String(status).slice(0, 80)}`);
    if (detail && detail !== status) parts.push(`信息：${String(detail).slice(0, 120)}`);
    const responseSummary = summarizeResponseForMessage(normalized);
    if (responseSummary) parts.push(`响应：${responseSummary}`);
    return parts.length
        ? `提交成功但接口未返回任务 ID，无法轮询视频结果（${parts.join('，')}）`
        : '提交成功但接口未返回任务 ID，无法轮询视频结果。';
}

function summarizeResponseForMessage(value) {
    if (value == null) return null;
    try {
        const seen = new WeakSet();
        const summary = JSON.stringify(value, (key, current) => {
            if (typeof current === 'string') return current.length > 160 ? `${current.slice(0, 160)}...` : current;
            if (current && typeof current === 'object') {
                if (seen.has(current)) return '[Circular]';
                seen.add(current);
            }
            return current;
        });
        return summary && summary.length > 220 ? `${summary.slice(0, 220)}...` : summary;
    } catch {
        return String(value).slice(0, 220);
    }
}

function tryParseJson(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function extractProviderRequestId(message, source = null) {
    const direct = source
        ? getFirstString(source, [
            'request_id',
            'requestId',
            'trace_id',
            'traceId',
            'error.request_id',
            'error.requestId',
            'data.request_id',
            'data.requestId',
        ])
        : null;
    if (direct) return direct;
    const match = String(message || '').match(/request\s*id\s*:?\s*([a-z0-9-]+)/i);
    return match?.[1] || null;
}

function isRealPersonPolicyError(message) {
    const value = String(message || '').toLowerCase();
    return (
        value.includes('real person') ||
        value.includes('真人') ||
        value.includes('真人人脸') ||
        value.includes('人脸')
    );
}

function buildSubmitFailureError(response, errText) {
    const parsed = tryParseJson(errText);
    const normalized = parsed ? normalizeGenerationResult(parsed) : null;
    const providerMessage =
        (parsed && extractErrorMessage(parsed)) ||
        normalized?.error ||
        errText ||
        `${response.status} ${response.statusText}`;
    const requestId = extractProviderRequestId(providerMessage, parsed || normalized);
    const message = isRealPersonPolicyError(providerMessage)
        ? `Seedance 2.0 已拒绝提交：参考图疑似包含真人人脸。请改用火山方舟可信虚拟人像、已入库授权真人素材，或先用非人像素材测试链路。${requestId ? `Request id：${requestId}` : ''}`
        : `API 请求失败：${response.status} ${response.statusText} - ${String(providerMessage).slice(0, 320)}`;

    const error = new Error(message);
    if (normalized) error.response = normalized;
    if (parsed || errText) error.responseSummary = summarizeResponseForMessage(parsed || errText);
    return error;
}

function isTransientPollError(error) {
    const message = String(error?.message || '').toLowerCase();
    return (
        error?.name === 'AbortError' ||
        error?.name === 'TimeoutError' ||
        message.includes('failed to fetch') ||
        message.includes('network') ||
        message.includes('load failed') ||
        message.includes('timeout')
    );
}

async function submitAndPoll(endpoint, payload, key, onRequestId, maxAttempts = 60, apiConfig = null, onStatus = null) {
    const url = `${MUAPI_PROXY_PATHS.apiV1}/${endpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: jsonHeaders(key, apiConfig),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw buildSubmitFailureError(response, errText);
    }
    const submitData = await response.json();
    const normalizedSubmit = normalizeGenerationResult(submitData);
    const requestId = normalizedSubmit.request_id || normalizedSubmit.id;
    if (!requestId && !normalizedSubmit.url) {
        const error = new Error(buildMissingRequestIdMessage(normalizedSubmit));
        error.response = normalizedSubmit;
        throw error;
    }
    if (!requestId) return { ...normalizedSubmit, status: 'completed' };
    if (onRequestId) onRequestId(requestId, normalizedSubmit);
    if (normalizedSubmit.url) return { ...normalizedSubmit, status: 'completed' };
    return await pollForResult(requestId, key, maxAttempts, 2000, apiConfig, onStatus);
}

export async function generateImage(apiKey, params, apiConfig = null) {
    const modelInfo = getModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = { prompt: params.prompt };
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (params.image_url) { 
        payload.image_url = params.image_url; 
        payload.strength = params.strength || 0.6; 
    } else if (params.images_list) {
        payload.images_list = params.images_list;
    } else {
        payload.image_url = null;
    }
    if (params.seed && params.seed !== -1) payload.seed = params.seed;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60, apiConfig, params.onStatus);
}

export async function generateI2I(apiKey, params, apiConfig = null) {
    const modelInfo = getI2IModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    if (params.prompt) payload.prompt = params.prompt;
    const imageField = modelInfo?.imageField || 'image_url';
    const imagesList = params.images_list?.length > 0 ? params.images_list : (params.image_url ? [params.image_url] : null);
    if (imagesList) {
        if (imageField === 'images_list') payload.images_list = imagesList;
        else payload[imageField] = imagesList[0];
    }
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60, apiConfig, params.onStatus);
}

function toAssetUrl(value) {
    if (!value) return null;
    if (typeof value === 'string') return value.trim() || null;
    if (typeof value === 'object') {
        return toAssetUrl(value.url || value.uri || value.image_url || value.video_url || value.audio_url);
    }
    return null;
}

function toAssetUrlArray(value) {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.map(toAssetUrl).filter(Boolean);
}

function copyArrayPayloadFields(payload, params, fields) {
    fields.forEach((field) => {
        const values = toAssetUrlArray(params[field]);
        if (values.length > 0) payload[field] = values;
    });
}

function copyScalarPayloadFields(payload, params, fields) {
    fields.forEach((field) => {
        if (params[field] !== undefined && params[field] !== null && params[field] !== '') {
            payload[field] = params[field];
        }
    });
}

export async function generateVideo(apiKey, params, apiConfig = null) {
    const modelInfo = getVideoModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    copyScalarPayloadFields(payload, params, [
        'prompt',
        'request_id',
        'aspect_ratio',
        'duration',
        'resolution',
        'quality',
        'mode',
        'seedance_mode',
        'image_url',
        'first_frame_url',
        'last_frame_url',
        'last_image',
        'video_url',
        'audio_url',
        'return_last_frame',
        'generate_audio',
    ]);
    copyArrayPayloadFields(payload, params, [
        'images_list',
        'reference_images',
        'video_files',
        'audio_files',
        'videos_list',
        'audios_list',
    ]);
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, apiConfig, params.onStatus);
}

export async function generateI2V(apiKey, params, apiConfig = null) {
    const modelInfo = getI2VModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    if (params.prompt) payload.prompt = params.prompt;
    const imageField = modelInfo?.imageField || 'image_url';
    const imageUrls = toAssetUrlArray(params.images_list).length > 0
        ? toAssetUrlArray(params.images_list)
        : toAssetUrlArray(params.image_url);
    if (imageUrls.length > 0) {
        if (imageField === 'images_list') payload.images_list = imageUrls;
        else payload[imageField] = imageUrls[0];
    }
    const lastImageField = modelInfo?.lastImageField;
    if (lastImageField && params.last_image) {
        payload[lastImageField] = params.last_image;
    }
    copyScalarPayloadFields(payload, params, [
        'aspect_ratio',
        'duration',
        'resolution',
        'quality',
        'mode',
        'seedance_mode',
        'first_frame_url',
        'last_frame_url',
        'return_last_frame',
        'generate_audio',
    ]);
    copyArrayPayloadFields(payload, params, [
        'reference_images',
        'video_files',
        'audio_files',
        'videos_list',
        'audios_list',
    ]);
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, apiConfig, params.onStatus);
}

export async function generateMarketingStudioAd(apiKey, params, apiConfig = null) {
    const endpoint = params.resolution === '1080p' ? 'sd-2-vip-omni-reference-1080p' : 'seedance-2-vip-omni-reference';
    const payload = {
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio || '16:9',
        duration: params.duration || 5,
        images_list: params.images_list || [],
        video_files: params.video_files || []
    };
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, apiConfig, params.onStatus);
}

export async function processV2V(apiKey, params, apiConfig = null) {
    const modelInfo = getV2VModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const videoField = modelInfo?.videoField || 'video_url';
    const payload = { [videoField]: params.video_url };
    if (modelInfo?.imageField && params.image_url) {
        payload[modelInfo.imageField] = params.image_url;
    }
    if (modelInfo?.hasPrompt && params.prompt) {
        payload.prompt = params.prompt;
    }
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, apiConfig, params.onStatus);
}

export async function processLipSync(apiKey, params, apiConfig = null) {
    const modelInfo = getLipSyncModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    if (params.audio_url) payload.audio_url = params.audio_url;
    if (params.image_url) payload.image_url = params.image_url;
    if (params.video_url) payload.video_url = params.video_url;
    if (modelInfo?.hasPrompt) payload.prompt = params.prompt || '';
    if (params.resolution) payload.resolution = params.resolution;
    if (params.seed !== undefined && params.seed !== -1) payload.seed = params.seed;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, apiConfig, params.onStatus);
}

function isHfsyProvider(apiConfig) {
    const provider = getActiveProvider(apiConfig);
    return provider?.id === 'hfsy' || String(provider?.baseUrl || '').toLowerCase().includes('hfsyapi.cn');
}

function isSeedanceArkProvider(apiConfig) {
    const provider = getActiveProvider(apiConfig);
    const baseUrl = String(provider?.baseUrl || '').toLowerCase();
    return provider?.id === 'seedance-ark' || (baseUrl.includes('ark.') && baseUrl.includes('volces.com'));
}

function safelyDecodeUploadValue(value) {
    try {
        return decodeURIComponent(String(value || ''));
    } catch {
        return String(value || '');
    }
}

function isUsableRemoteUploadUrl(value) {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!/^https?:\/\//i.test(raw)) return false;
    const decoded = safelyDecodeUploadValue(raw).toLowerCase();
    return !(
        decoded.includes('<!doctype') ||
        decoded.includes('<html') ||
        decoded.includes('<head') ||
        decoded.includes('<body') ||
        decoded.includes('&lt;!doctype') ||
        decoded.includes('&lt;html')
    );
}

function imageFileToDataUrl(file, onProgress) {
    return new Promise((resolve, reject) => {
        if (!file?.type?.startsWith('image/')) {
            reject(new Error('只能把图片文件转为 Seedance Ark base64 输入'));
            return;
        }

        const reader = new FileReader();
        reader.onprogress = (event) => {
            if (onProgress && event.lengthComputable) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            if (!/^data:image\/[a-z0-9.+-]+;base64,/i.test(result)) {
                reject(new Error('图片 base64 转换失败，请换一张图片重试。'));
                return;
            }
            if (onProgress) onProgress(100);
            resolve(result);
        };
        reader.onerror = () => reject(new Error('图片读取失败，无法转为 Seedance Ark 输入。'));
        reader.readAsDataURL(file);
    });
}

function uploadProviderImageFile(apiKey, file, onProgress, apiConfig) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/provider/upload');

        const headers = buildProviderRequestHeaders(apiConfig);
        Object.entries(headers).forEach(([key, value]) => {
            if (key.toLowerCase() !== 'content-type' && value) xhr.setRequestHeader(key, value);
        });
        const normalizedKey = normalizeApiKey(apiKey);
        if (normalizedKey) xhr.setRequestHeader('x-api-key', normalizedKey);

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded * 100) / event.total);
                    onProgress(percentComplete);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    const fileUrl =
                        data.url ||
                        data.file_url ||
                        data.image_url ||
                        data.data?.url ||
                        data.data?.file_url ||
                        data.data?.image_url;
                    if (!fileUrl) reject(new Error('上传响应未返回图片 URL'));
                    else if (!isUsableRemoteUploadUrl(fileUrl)) {
                        reject(new Error('上传响应返回的不是可用公网图片 URL，请改用公网图片链接或可用图床。'));
                    }
                    else resolve(fileUrl);
                } catch {
                    reject(new Error('上传响应解析失败'));
                }
            } else {
                let detail = xhr.statusText;
                try {
                    const errObj = JSON.parse(xhr.responseText);
                    detail = errObj.error || errObj.detail || detail;
                } catch {
                    // fallback to statusText
                }
                reject(new Error(`${xhr.status} - ${detail}`));
            }
        };

        xhr.onerror = () => reject(new Error('网络错误，无法上传图片'));
        xhr.send(formData);
    });
}

export function uploadFile(apiKey, file, onProgress, apiConfig = null) {
    if (file?.type?.startsWith('image/') && isSeedanceArkProvider(apiConfig)) {
        return imageFileToDataUrl(file, onProgress);
    }

    if (file?.type?.startsWith('image/') && isHfsyProvider(apiConfig)) {
        return uploadProviderImageFile(apiKey, file, onProgress, apiConfig);
    }

    return new Promise((resolve, reject) => {
        const url = `${MUAPI_PROXY_PATHS.apiV1}/upload_file`;
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        const normalizedKey = normalizeApiKey(apiKey);
        if (normalizedKey) xhr.setRequestHeader('x-api-key', normalizedKey);

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    onProgress(percentComplete);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    const fileUrl = data.url || data.file_url || data.data?.url;
                    if (!fileUrl) {
                        reject(new Error('文件上传未返回 URL'));
                    } else {
                        resolve(fileUrl);
                    }
                } catch (e) {
                    reject(new Error('上传响应解析失败'));
                }
            } else {
                let detail = xhr.statusText;
                try {
                    const errObj = JSON.parse(xhr.responseText);
                    detail = errObj.detail || detail;
                } catch (e) {
                    // fallback to statusText
                }
                reject(new Error(`文件上传失败：${xhr.status} - ${detail}`));
            }
        };

        xhr.onerror = () => reject(new Error('文件上传过程中出现网络错误'));
        xhr.send(formData);
    });
}

export async function getUserBalance(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.apiV1}/account/balance`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取余额失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function getTemplateWorkflows(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/get-template-workflows`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取模板工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getUserWorkflows(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/get-workflow-defs`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取我的工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getPublishedWorkflows(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/get-published-workflows`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取已发布工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getTemplateAgents(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.agents}/templates/agents`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取模板智能体失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.agents || data.items || []);
};

export async function getUserAgents(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.agents}/user/agents`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取我的智能体失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.agents || data.items || []);
};

export async function getPublishedAgents(apiKey) {
    // MuAPI: GET /agents/featured/agents
    const response = await fetch(`${MUAPI_PROXY_PATHS.agents}/featured/agents`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取精选智能体失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.agents || data.items || []);
};

// GET /agents/user/conversations — returns the user's chat history across all agents
export async function getUserConversations(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.agents}/user/conversations`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取对话失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
};

export async function createWorkflow(apiKey, payload) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/create`, {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`创建工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function updateWorkflowName(apiKey, workflowId, name) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/update-name/${workflowId}`, {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify({ name })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`重命名工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function deleteWorkflow(apiKey, workflowId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/delete-workflow-def/${workflowId}`, {
        method: 'DELETE',
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`删除工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getWorkflowInputs(apiKey, workflowId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/${workflowId}/api-inputs`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取工作流输入失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function executeWorkflow(apiKey, workflowId, inputs) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/${workflowId}/api-execute`, {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify({ inputs })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`执行工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    const submitData = await response.json();
    const runId = submitData.run_id || submitData.id;
    if (!runId) return submitData;
    
    // Poll for results
    return await pollWorkflowResult(runId, apiKey);
};

async function pollWorkflowResult(runId, apiKey, maxAttempts = 900, interval = 2000) {
    const pollUrl = `${MUAPI_PROXY_PATHS.workflow}/run/${runId}/api-outputs`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, {
                headers: jsonHeaders(apiKey)
            });
            if (!response.ok) {
                if (response.status >= 500) continue;
                throw new Error(`轮询失败：${response.status}`);
            }
            const data = await response.json();
            const status = data.status?.toLowerCase();
            if (status === 'completed' || status === 'succeeded' || status === 'success') return data;
            if (status === 'failed' || status === 'error') throw new Error(`工作流运行失败：${data.error || '未知错误'}`);
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('工作流轮询超时。');
};

export async function getAllNodeSchemas(apiKey, workflowId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/${workflowId}/node-schemas`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取节点 schema 失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getWorkflowData(apiKey, workflowId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/get-workflow-def/${workflowId}`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取工作流数据失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getNodeSchemas(apiKey, workflowId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/${workflowId}/api-node-schemas`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取节点 schema 失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function runSingleNode(apiKey, workflowId, nodeId, payload) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/${workflowId}/node/${nodeId}/run`, {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`运行单个节点失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function deleteNodeRun(apiKey, nodeRunId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/node-run/${nodeRunId}`, {
        method: 'DELETE',
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`删除节点运行记录失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function getNodeStatus(apiKey, runId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/run/${runId}/status`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取节点状态失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

/**
 * Handle proxy requests centralizing communication logic with MuAPI.
 * This is used by the server-side entry points.
 */
export async function handleProxyRequest(prefix, path, method, headers, body, apiKey) {
    const url = `${BASE_URL}/${prefix}/${path}`;
    
    const finalHeaders = new Headers(headers);
    finalHeaders.delete('host');
    finalHeaders.delete('connection');
    finalHeaders.delete('content-length'); // Let fetch recalculate this for safety

    const normalizedKey = normalizeApiKey(apiKey);
    if (normalizedKey) {
        finalHeaders.set('x-api-key', normalizedKey);
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
        
        return {
            status: response.status,
            contentType,
            data: buffer
        };
    } catch (error) {
        console.error(`MuAPI Proxy error for ${url}:`, error);
        throw error;
    }
}

/**
 * A centralized handler for Next.js API routes or middleware.
 */
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

        return await handleProxyRequest(
            prefix, 
            pathWithSearch, 
            method, 
            request.headers, 
            body, 
            apiKey
        );
    } catch (error) {
        console.error(`Server proxy failed:`, error);
        throw error;
    }
}

export async function calculateDynamicCost(apiKey, taskName, payload) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.apiV1}/app/calculate_dynamic_cost`, {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify({ task_name: taskName, payload })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to calculate dynamic cost: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function registerAppInterest(apiKey, appName) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.app}/interest`, {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify({ app_name: appName })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to register interest: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function getAppInterests(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.app}/interests`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取兴趣登记失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}
