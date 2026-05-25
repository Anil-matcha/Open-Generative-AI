import { NextResponse } from 'next/server';

const MUAPI_BASE = 'https://api.muapi.ai';
const ARK_DEFAULT_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
const PROVIDER_BASE_URL_COOKIE = 'provider_base_url';
const UPSTREAM_TIMEOUT_MS = Number(process.env.API_PROVIDER_TIMEOUT_MS || 300000);

function normalizeApiKey(value) {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed && trimmed !== 'null' && trimmed !== 'undefined' ? trimmed : null;
}

function decodeCookieValue(value) {
    if (!value) return null;
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function normalizeBaseUrl(value) {
    const raw = normalizeApiKey(decodeCookieValue(value));
    if (!raw) return null;
    try {
        const parsed = new URL(raw);
        if (!['http:', 'https:'].includes(parsed.protocol)) return null;
        return raw.replace(/\/+$/, '');
    } catch {
        return null;
    }
}

function normalizeProviderId(value) {
    return String(value || '').trim().toLowerCase();
}

function getProviderBaseInfo(request) {
    const headerBaseUrl = normalizeBaseUrl(request.headers.get('x-provider-base-url'));
    const cookieBaseUrl = normalizeBaseUrl(request.cookies.get(PROVIDER_BASE_URL_COOKIE)?.value);
    const providerId = normalizeProviderId(request.headers.get('x-provider-id'));
    const fallbackBaseUrl = providerId === 'seedance-ark'
        ? normalizeBaseUrl(process.env.SEEDANCE_BASE_URL) || ARK_DEFAULT_BASE
        : MUAPI_BASE;
    return {
        providerId,
        baseUrl: headerBaseUrl || cookieBaseUrl || fallbackBaseUrl,
        usesProviderBase: Boolean(headerBaseUrl || cookieBaseUrl || providerId === 'seedance-ark'),
    };
}

function parseJsonEnv(name) {
    const raw = normalizeApiKey(process.env[name]);
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function getModelKeyMap() {
    return {
        ...parseJsonEnv('HFSY_MODEL_KEYS_JSON'),
        ...parseJsonEnv('API_PROVIDER_MODEL_KEYS_JSON'),
    };
}

function getModelAliases(modelId) {
    const raw = normalizeApiKey(String(modelId || ''));
    if (!raw) return [];
    const id = raw.toLowerCase().replace(/_/g, '-');
    const aliases = new Set([id]);
    aliases.add(id.replace(/-(text-to-image|image-to-image|text-to-video|image-to-video|omni-reference|1080p)$/g, ''));
    if (id.includes('gpt-image-2pro')) aliases.add('gpt-image-2pro');
    if (id.includes('gpt-image-2')) aliases.add('gpt-image-2');
    if (id.includes('gemini-3.1-flash-image-preview')) aliases.add('gemini-3.1-flash-image-preview');
    if (id.includes('gemini-3-pro-image-preview')) aliases.add('gemini-3-pro-image-preview');
    if (id.includes('seedance-v2.0')) aliases.add('seedance-v2.0');
    if (id.includes('seedance-v2.0')) aliases.add('sd-2-vip');
    if (id.includes('seedance-v2.0')) aliases.add('sd-2');
    if (id.includes('sd-2-vip')) aliases.add('sd-2-vip');
    if (id.includes('sd-2')) aliases.add('sd-2');
    if (id.includes('kling-v3')) aliases.add('kling-v3');
    if (id.includes('sora-2')) aliases.add('sora-2');
    return Array.from(aliases).filter(Boolean);
}

function getModelKey(modelIds = []) {
    const lowerMap = Object.fromEntries(
        Object.entries(getModelKeyMap()).map(([modelId, key]) => [String(modelId).toLowerCase(), normalizeApiKey(String(key || ''))]),
    );

    for (const modelId of modelIds) {
        for (const alias of getModelAliases(modelId)) {
            if (lowerMap[alias]) return lowerMap[alias];
        }
    }
    return null;
}

function isArkBase(baseUrl) {
    try {
        const hostname = new URL(baseUrl).hostname.toLowerCase();
        return hostname.includes('ark.') && hostname.includes('volces.com');
    } catch {
        return false;
    }
}

function isSeedanceArkProvider(providerBase = {}) {
    return providerBase.providerId === 'seedance-ark' || isArkBase(providerBase.baseUrl);
}

function parseJsonBody(bodyBuffer) {
    if (!bodyBuffer?.byteLength) return null;
    try {
        return JSON.parse(Buffer.from(bodyBuffer).toString('utf8'));
    } catch {
        return null;
    }
}

function getPayloadModelIds(path, payload) {
    const ids = [];
    if (path) ids.push(path);
    if (payload?.model) ids.push(payload.model);
    if (payload?.endpoint) ids.push(payload.endpoint);
    return ids;
}

function getApiKey(request, modelIds = [], providerBase = null) {
    const headerKey = normalizeApiKey(request.headers.get('x-api-key'));
    if (headerKey) return headerKey;
    const arkKey = normalizeApiKey(process.env.ARK_API_KEY);
    if (providerBase && isSeedanceArkProvider(providerBase) && arkKey) return arkKey;
    return (
        getModelKey(modelIds) ||
        normalizeApiKey(request.cookies.get('provider_api_key')?.value) ||
        normalizeApiKey(request.cookies.get('yunwu_api_key')?.value) ||
        normalizeApiKey(request.cookies.get('muapi_key')?.value) ||
        normalizeApiKey(process.env.API_PROVIDER_KEY) ||
        normalizeApiKey(process.env.HFSY_API_KEY) ||
        normalizeApiKey(process.env.MUAPI_API_KEY)
    );
}

function cleanHeaders(request, apiKey, usesProviderBase) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('content-length');
    headers.delete('cookie');
    headers.delete('x-provider-base-url');
    headers.delete('x-provider-id');
    if (apiKey) {
        headers.set('x-api-key', apiKey);
        if (usesProviderBase) headers.set('authorization', `Bearer ${apiKey}`);
    }
    return headers;
}

function createClientRequestId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildTargetUrl(baseUrl, path, search, usesProviderBase) {
    const base = usesProviderBase ? baseUrl : `${baseUrl}/api/v1`;
    return path ? `${base}/${path}${search}` : `${base}${search}`;
}

function isHfsyBase(baseUrl) {
    try {
        return new URL(baseUrl).hostname.includes('hfsyapi.cn');
    } catch {
        return false;
    }
}

function isHfsyVideoModel(path) {
    const id = String(path || '').toLowerCase();
    return (
        id.includes('text-to-video') ||
        id.includes('image-to-video') ||
        id.includes('omni-reference') ||
        id.includes('seedance') ||
        id.includes('sd-2') ||
        id.includes('kling-v3') ||
        id.includes('sora-2') ||
        id === 'sd-2' ||
        id === 'sd-2-vip'
    );
}

function buildHfsyVideoTargetUrl(baseUrl, path, search) {
    if (!isHfsyBase(baseUrl) || !isHfsyVideoModel(path)) return null;
    const origin = new URL(baseUrl).origin;
    return `${origin}/v1/video/create${search}`;
}

function toPayloadString(value) {
    if (typeof value === 'string') return value.trim() || null;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (value && typeof value === 'object') {
        return toPayloadString(
            value.url ||
            value.uri ||
            value.image_url ||
            value.video_url ||
            value.audio_url ||
            value.file_url ||
            value.result_url,
        );
    }
    return null;
}

function compactPayloadStrings(...values) {
    const flattened = values.flatMap((value) => (Array.isArray(value) ? value : [value]));
    const seen = new Set();
    const result = [];
    flattened.forEach((value) => {
        const item = toPayloadString(value);
        if (!item || seen.has(item)) return;
        seen.add(item);
        result.push(item);
    });
    return result;
}

function firstPayloadString(...values) {
    return compactPayloadStrings(...values)[0] || null;
}

function inferVideoOrientation(payload = {}) {
    const explicit = String(payload.orientation || '').trim().toLowerCase();
    if (['landscape', 'portrait'].includes(explicit)) return explicit;

    const ratio = String(payload.aspect_ratio || payload.aspectRatio || '').trim();
    const match = ratio.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
    if (!match) return 'landscape';
    return Number(match[1]) >= Number(match[2]) ? 'landscape' : 'portrait';
}

function normalizeVideoDuration(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
}

function normalizeHfsyVideoSize(payload = {}) {
    const explicit = String(payload.size || '').trim();
    if (explicit) return explicit;
    const resolution = String(payload.resolution || '').trim().toLowerCase();
    if (!resolution) return 'large';
    if (resolution === '1080p' || resolution === 'large') return 'large';
    if (resolution === '720p' || resolution === 'small') return 'small';
    return resolution;
}

function normalizeHfsyVideoPayload(path, payload = {}) {
    const body = {
        ...payload,
        model: payload.model || path,
        orientation: inferVideoOrientation(payload),
        size: normalizeHfsyVideoSize(payload),
        watermark: Boolean(payload.watermark),
    };

    const duration = normalizeVideoDuration(payload.duration);
    if (duration) body.duration = duration;

    const imageInputs = compactPayloadStrings(
        payload.images,
        payload.images_list,
        payload.reference_images,
        payload.image_url,
        payload.first_frame_url,
    );
    if (imageInputs.length > 0) {
        body.images = imageInputs;
        body.images_list = imageInputs;
        body.reference_images = compactPayloadStrings(payload.reference_images).length > 0
            ? compactPayloadStrings(payload.reference_images)
            : imageInputs;
        body.image_url = body.image_url || imageInputs[0];
        body.first_frame_url = body.first_frame_url || imageInputs[0];
    }

    const lastFrame = firstPayloadString(
        payload.last_frame_url,
        payload.last_image,
        payload.end_image_url,
    );
    if (lastFrame) {
        body.last_frame_url = lastFrame;
        body.last_image = lastFrame;
    }

    const videoFiles = compactPayloadStrings(payload.video_files, payload.videos_list, payload.video_url);
    if (videoFiles.length > 0) {
        body.video_files = videoFiles;
        body.videos_list = body.videos_list || videoFiles;
        body.video_url = body.video_url || videoFiles[0];
    }

    const audioFiles = compactPayloadStrings(payload.audio_files, payload.audios_list, payload.audio_url);
    if (audioFiles.length > 0) {
        body.audio_files = audioFiles;
        body.audios_list = body.audios_list || audioFiles;
        body.audio_url = body.audio_url || audioFiles[0];
    }

    return body;
}

function buildHfsyVideoBody(path, payload) {
    return JSON.stringify(normalizeHfsyVideoPayload(path, payload || {}));
}

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

function getFirstString(source, paths = []) {
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
        const preferredKeys = ['video_url', 'result_url', 'output_url', 'download_url', 'file_url', 'source_url', 'url'];
        for (const key of preferredKeys) {
            const found = findUrlLikeValue(value[key], key);
            if (found) return found;
        }
        const containerKeys = ['data', 'result', 'results', 'output', 'outputs', 'video', 'videos', 'content', 'file', 'files'];
        for (const key of containerKeys) {
            const found = findUrlLikeValue(value[key], key);
            if (found) return found;
        }
    }
    return null;
}

function extractRequestId(data, fallback = null) {
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

function extractStatus(data) {
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

function normalizeStatus(status) {
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

function extractVideoUrl(data) {
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
    if (direct && !isNonErrorMessage(direct)) return direct;
    return null;
}

function normalizeHfsyVideoResponse(data, { requestId = null, model = null } = {}) {
    const id = extractRequestId(data, requestId);
    const providerStatus = extractStatus(data);
    const status = normalizeStatus(providerStatus);
    const url = extractVideoUrl(data);
    const rawError = extractErrorMessage(data);
    const error = status === 'failed' || !status ? rawError : null;
    const normalizedStatus = url
        ? 'completed'
        : error
            ? 'failed'
            : status === 'completed' && id
                ? 'processing'
                : status || (id ? 'processing' : null);

    return {
        ...(data && typeof data === 'object' ? data : { raw: data }),
        provider: 'hfsy',
        model,
        id,
        request_id: id,
        task_id: id,
        status: normalizedStatus || undefined,
        provider_status: providerStatus || undefined,
        url: url || undefined,
        outputs: url ? [url] : undefined,
        error: error || undefined,
    };
}

function readEnvString(name, fallback = null) {
    return normalizeApiKey(process.env[name]) || fallback;
}

function readEnvBool(name, fallback = false) {
    const raw = normalizeApiKey(process.env[name]);
    if (raw == null) return fallback;
    if (/^(1|true|yes|y|on)$/i.test(raw)) return true;
    if (/^(0|false|no|n|off)$/i.test(raw)) return false;
    return fallback;
}

function readEnvOptionalBool(name, fallback = null) {
    const raw = normalizeApiKey(process.env[name]);
    if (raw == null) return fallback;
    if (/^(1|true|yes|y|on)$/i.test(raw)) return true;
    if (/^(0|false|no|n|off)$/i.test(raw)) return false;
    return fallback;
}

function readPositiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
}

function resolveArkModel(payload = {}) {
    return (
        readEnvString('SEEDANCE_ENDPOINT_ID') ||
        readEnvString('SEEDANCE_MODEL') ||
        normalizeApiKey(String(payload.model || '')) ||
        'doubao-seedance-2-0-260128'
    );
}

function resolveArkImageModel(payload = {}) {
    return (
        readEnvString('SEEDREAM_ENDPOINT_ID') ||
        readEnvString('SEEDREAM_MODEL') ||
        readEnvString('ARK_SEEDREAM_ENDPOINT_ID') ||
        normalizeApiKey(String(payload.model || '')) ||
        'doubao-seedream-5.0-lite'
    );
}

const SEEDREAM_LITE_SIZE_MAP = {
    '2K': {
        '1:1': '2048x2048',
        '4:3': '2304x1728',
        '3:4': '1728x2304',
        '16:9': '2848x1600',
        '9:16': '1600x2848',
        '3:2': '2496x1664',
        '2:3': '1664x2496',
        '21:9': '3136x1344',
    },
    '3K': {
        '1:1': '3072x3072',
        '4:3': '3456x2592',
        '3:4': '2592x3456',
        '16:9': '4096x2304',
        '9:16': '2304x4096',
        '3:2': '3744x2496',
        '2:3': '2496x3744',
        '21:9': '4704x2016',
    },
};

function isArkImageGenerationPath(path) {
    return String(path || '').replace(/^\/+|\/+$/g, '').toLowerCase() === 'images/generations';
}

function isSeedreamImageModel(modelId) {
    const id = String(modelId || '').trim().toLowerCase();
    return (
        id.startsWith('ep-') ||
        id.includes('seedream') ||
        id.includes('seed-dream')
    );
}

function shouldUseArkImageAdapter(providerBase, path, payload) {
    if (!providerBase.usesProviderBase || !isSeedanceArkProvider(providerBase) || !isArkImageGenerationPath(path) || !payload) {
        return false;
    }
    return isSeedreamImageModel(payload.model) || isSeedreamImageModel(resolveArkImageModel(payload));
}

function normalizeSeedreamSize(payload = {}) {
    const rawSize = String(payload.size || '').trim();
    if (/^\d+\s*x\s*\d+$/i.test(rawSize)) return rawSize.toLowerCase().replace(/\s+/g, '');
    if (['2K', '3K'].includes(rawSize.toUpperCase())) return rawSize.toUpperCase();

    const tierSource = payload.quality || payload.resolution || readEnvString('SEEDREAM_QUALITY', '2K');
    const tier = String(tierSource || '2K').toUpperCase() === '3K' ? '3K' : '2K';
    const ratio = String(payload.aspect_ratio || payload.aspectRatio || rawSize || '1:1').trim();
    return SEEDREAM_LITE_SIZE_MAP[tier]?.[ratio] || SEEDREAM_LITE_SIZE_MAP[tier]['1:1'];
}

function normalizeArkImageInput(payload = {}) {
    const images = compactPayloadStrings(
        payload.image,
        payload.images,
        payload.image_urls,
        payload.images_list,
        payload.reference_images,
        payload.image_url,
    ).slice(0, 14);
    if (images.length === 0) return undefined;
    return images.length === 1 ? images[0] : images;
}

function buildArkImageBody(payload = {}) {
    const image = normalizeArkImageInput(payload);
    const body = {
        model: resolveArkImageModel(payload),
        prompt: String(payload.prompt || '').trim(),
        n: Math.max(1, Math.min(15, Number(payload.n) || 1)),
        size: normalizeSeedreamSize(payload),
        sequential_image_generation: payload.sequential_image_generation || 'disabled',
        response_format: payload.response_format || 'url',
        output_format: payload.output_format || 'jpeg',
        stream: Boolean(payload.stream),
        watermark: typeof payload.watermark === 'boolean' ? payload.watermark : false,
    };

    if (image) body.image = image;
    if (Array.isArray(payload.tools) && payload.tools.length > 0) body.tools = payload.tools;
    if (payload.optimize_prompt_options && typeof payload.optimize_prompt_options === 'object') {
        body.optimize_prompt_options = payload.optimize_prompt_options;
    }

    return JSON.stringify(body);
}

function normalizeImageUrlCandidate(value) {
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (!text) return null;
    if (/^data:image\//i.test(text)) return text;
    if (/^https?:\/\//i.test(text)) return text;
    return null;
}

function findImageUrlLikeValue(value, keyHint = '') {
    if (!value) return null;
    const hint = String(keyHint || '').toLowerCase();
    if (typeof value === 'string') {
        return /(url|image|result|output|file|download|b64)/i.test(hint)
            ? normalizeImageUrlCandidate(value)
            : null;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findImageUrlLikeValue(item, hint);
            if (found) return found;
        }
        return null;
    }
    if (typeof value === 'object') {
        const preferredKeys = ['url', 'image_url', 'result_url', 'output_url', 'download_url', 'file_url', 'b64_json'];
        for (const key of preferredKeys) {
            const found = findImageUrlLikeValue(value[key], key);
            if (found) return found;
        }
        const containerKeys = ['data', 'result', 'results', 'output', 'outputs', 'image', 'images', 'content', 'file', 'files'];
        for (const key of containerKeys) {
            const found = findImageUrlLikeValue(value[key], key);
            if (found) return found;
        }
    }
    return null;
}

function extractImageUrl(data) {
    const direct = getFirstString(data, [
        'url',
        'image_url',
        'result_url',
        'data.url',
        'data.image_url',
        'data.result_url',
        'data[0].url',
        'data[0].image_url',
        'data[0].result_url',
        'result.url',
        'result.image_url',
        'result.result_url',
        'result[0].url',
        'result[0].image_url',
        'output.url',
        'output[0].url',
        'outputs[0].url',
        'outputs[0]',
    ]);
    const url = normalizeImageUrlCandidate(direct) || findImageUrlLikeValue(data);
    if (url) return url;

    const b64 = getFirstString(data, ['b64_json', 'data.b64_json', 'data[0].b64_json', 'result.b64_json', 'result[0].b64_json']);
    return b64 ? `data:image/png;base64,${b64}` : null;
}

function extractImageErrorMessage(data) {
    return getFirstString(data, [
        'data[0].error.message',
        'data[0].error',
        'data.error.message',
        'data.error',
        'result.error.message',
        'result.error',
        'error.message',
        'error',
        'message',
    ]);
}

function normalizeArkImageResponse(data, { model = null } = {}) {
    const source = data && typeof data === 'object' ? data : { raw: data };
    const url = extractImageUrl(source);
    const id = extractRequestId(source);
    const providerStatus = extractStatus(source);
    const status = normalizeStatus(providerStatus);
    const rawError = extractImageErrorMessage(source);
    const error = !url && rawError && !isNonErrorMessage(rawError) ? rawError : null;
    const normalizedStatus = url ? 'completed' : error ? 'failed' : status || (id ? 'processing' : undefined);

    return {
        ...source,
        provider: 'seedance-ark',
        trustedForSeedance: Boolean(url),
        model: model || source.model,
        id,
        request_id: id,
        task_id: id,
        status: normalizedStatus,
        provider_status: providerStatus || undefined,
        url: url || undefined,
        outputs: url ? [url] : undefined,
        data: Array.isArray(source.data) ? source.data : url ? [{ url }] : source.data,
        error: error || undefined,
    };
}

function resolveArkSettings(payload = {}) {
    const qualityPreset = String(payload.quality || readEnvString('SEEDANCE_QUALITY_PRESET', 'standard')).toLowerCase();
    let resolution = payload.resolution || readEnvString('SEEDANCE_RESOLUTION', '720p');
    let fps = readPositiveNumber(payload.fps, Number(readEnvString('SEEDANCE_FPS', '24')));
    let duration = readPositiveNumber(payload.duration, Number(readEnvString('SEEDANCE_DURATION', '5')));
    let generateAudio = typeof payload.generate_audio === 'boolean'
        ? payload.generate_audio
        : readEnvBool('SEEDANCE_GENERATE_AUDIO', true);
    let draftMode = typeof payload.draft_mode === 'boolean'
        ? payload.draft_mode
        : readEnvOptionalBool('SEEDANCE_DRAFT_MODE', null);

    if (qualityPreset === 'preview') {
        resolution = payload.resolution || readEnvString('SEEDANCE_PREVIEW_RESOLUTION', resolution);
        fps = readPositiveNumber(payload.fps, Number(readEnvString('SEEDANCE_PREVIEW_FPS', String(fps))));
        duration = readPositiveNumber(payload.duration, Number(readEnvString('SEEDANCE_PREVIEW_DURATION', String(duration))));
        if (typeof payload.generate_audio !== 'boolean') {
            generateAudio = readEnvBool('SEEDANCE_PREVIEW_GENERATE_AUDIO', false);
        }
        if (typeof payload.draft_mode !== 'boolean') {
            draftMode = readEnvOptionalBool('SEEDANCE_PREVIEW_DRAFT_MODE', true);
        }
    } else if (qualityPreset === 'hd' && !payload.resolution) {
        resolution = '1080p';
    }

    return {
        qualityPreset,
        resolution: String(resolution || '720p'),
        aspectRatio: String(payload.aspect_ratio || payload.aspectRatio || '16:9'),
        fps: Math.round(fps || 24),
        duration: Math.round(duration || 5),
        generateAudio,
        draftMode,
        watermark: Boolean(payload.watermark),
    };
}

function appendArkPromptFlags(prompt, settings) {
    let text = String(prompt || '').trim();
    if (!text) text = 'Generate a cinematic video.';
    if (!/(^|\s)--rs\s+/i.test(text)) text += ` --rs ${settings.resolution}`;
    if (!/(^|\s)--(?:ratio|rt)\s+/i.test(text)) text += ` --ratio ${settings.aspectRatio}`;
    if (!/(^|\s)--dur\s+/i.test(text)) text += ` --dur ${settings.duration}`;
    if (!/(^|\s)--fps\s+/i.test(text)) text += ` --fps ${settings.fps}`;
    if (!/(^|\s)--wm\s+/i.test(text)) text += ` --wm ${settings.watermark ? 'true' : 'false'}`;
    return text;
}

function getArkImageInputs(payload = {}) {
    const images = compactPayloadStrings(
        payload.images,
        payload.images_list,
        payload.reference_images,
        payload.image_url,
        payload.first_frame_url,
    );
    const lastFrame = firstPayloadString(payload.last_frame_url, payload.last_image, payload.end_image_url);
    if (lastFrame && !images.includes(lastFrame)) images.push(lastFrame);
    return images;
}

function normalizeArkGenerationMode(payload = {}, imageInputs = []) {
    const explicit = String(payload.generation_mode || payload.seedance_mode || payload.mode || readEnvString('SEEDANCE_REFERENCE_MODE', 'auto')).toLowerCase();
    if (explicit === 'omni') return 'i2v_reference';
    if (explicit === 'i2v') return 'i2v_first_frame';
    if (explicit === 'flf') return 'i2v_first_last_frame';
    if (['t2v', 'i2v_first_frame', 'i2v_first_last_frame', 'i2v_reference'].includes(explicit)) return explicit;
    if (imageInputs.length === 0) return 't2v';
    if (imageInputs.length === 1) return 'i2v_first_frame';
    if (imageInputs.length === 2) return 'i2v_first_last_frame';
    return 'i2v_reference';
}

function getArkImageRole(generationMode, index) {
    if (generationMode === 'i2v_first_frame') return index === 0 ? 'first_frame' : 'reference_image';
    if (generationMode === 'i2v_first_last_frame') {
        if (index === 0) return 'first_frame';
        if (index === 1) return 'last_frame';
        return 'reference_image';
    }
    return 'reference_image';
}

function buildArkVideoBody(path, payload = {}) {
    if (payload.request_id) {
        const error = new Error('Ark 官方 Seedance adapter 暂不支持续写任务；请先使用文生视频、单图生视频、首尾帧或多参考图。');
        error.status = 400;
        throw error;
    }

    const imageInputs = getArkImageInputs(payload).slice(0, Number(readEnvString('SEEDANCE_MAX_REFERENCE_IMAGES', '9')) || 9);
    const generationMode = normalizeArkGenerationMode(payload, imageInputs);
    if (generationMode !== 't2v' && imageInputs.length === 0) {
        const error = new Error('Ark Seedance 图生视频需要至少 1 张参考图。');
        error.status = 400;
        throw error;
    }
    if (generationMode === 'i2v_first_last_frame' && imageInputs.length < 2) {
        const error = new Error('Ark Seedance 首尾帧模式需要同时传入起始帧和结束帧。');
        error.status = 400;
        throw error;
    }

    const settings = resolveArkSettings(payload);
    const content = [
        {
            type: 'text',
            text: appendArkPromptFlags(payload.prompt, settings),
        },
    ];

    if (generationMode !== 't2v') {
        imageInputs.forEach((url, index) => {
            content.push({
                type: 'image_url',
                image_url: { url },
                role: getArkImageRole(generationMode, index),
            });
        });
    }

    const body = {
        model: resolveArkModel({ ...payload, model: payload.model || path }),
        content,
        generate_audio: settings.generateAudio,
        watermark: settings.watermark,
    };
    if (settings.draftMode !== null && settings.draftMode !== undefined) body.draft_mode = settings.draftMode;
    return JSON.stringify(body);
}

function normalizeArkVideoResponse(data, { requestId = null, model = null } = {}) {
    const source = data && typeof data === 'object' ? data : { raw: data };
    const id = extractRequestId(source, requestId);
    const providerStatus = extractStatus(source);
    const status = normalizeStatus(providerStatus);
    const url = extractVideoUrl(source);
    const rawError = extractErrorMessage(source);
    const error = status === 'failed' || !status ? rawError : null;
    const normalizedStatus = url
        ? 'completed'
        : error
            ? 'failed'
            : status === 'completed' && id
                ? 'processing'
                : status || (id ? 'processing' : null);

    return {
        ...source,
        provider: 'seedance-ark',
        model: model || source.model,
        id,
        request_id: id,
        task_id: id,
        status: normalizedStatus || undefined,
        provider_status: providerStatus || undefined,
        url: url || undefined,
        outputs: url ? [url] : undefined,
        error: error || undefined,
    };
}

async function readUpstreamJson(response) {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return { raw: text };
    }
}

function hasStructuredHfsyTaskData(data, normalized) {
    if (!data || typeof data !== 'object') return false;
    if (Object.prototype.hasOwnProperty.call(data, 'raw') && Object.keys(data).length === 1) return false;
    return Boolean(normalized?.url || normalized?.provider_status || extractRequestId(data));
}

function extractHfsyPollRequestId(path) {
    const normalized = String(path || '').replace(/^\/+|\/+$/g, '');
    const predictionMatch = normalized.match(/^predictions\/([^/]+)\/result$/i);
    if (predictionMatch) return decodeURIComponent(predictionMatch[1]);
    const generationMatch = normalized.match(/^(?:video\/generations|pg\/videos\/async-generations)\/([^/]+)(?:\/result)?$/i);
    if (generationMatch) return decodeURIComponent(generationMatch[1]);
    return null;
}

function extractArkPollRequestId(path) {
    const normalized = String(path || '').replace(/^\/+|\/+$/g, '');
    const predictionMatch = normalized.match(/^predictions\/([^/]+)\/result$/i);
    if (predictionMatch) return decodeURIComponent(predictionMatch[1]);
    const arkTaskMatch = normalized.match(/^contents\/generations\/tasks\/([^/]+)$/i);
    if (arkTaskMatch) return decodeURIComponent(arkTaskMatch[1]);
    return null;
}

function appendQuery(url, query = {}) {
    const parsed = new URL(url);
    Object.entries(query).forEach(([key, value]) => {
        if (value != null && value !== '') parsed.searchParams.set(key, value);
    });
    return parsed.toString();
}

function buildHfsyVideoPollCandidates(baseUrl, requestId) {
    const origin = new URL(baseUrl).origin;
    const encodedId = encodeURIComponent(requestId);
    return [
        appendQuery(`${origin}/v1/video/query`, { id: requestId }),
        `${origin}/pg/videos/async-generations/${encodedId}`,
        `${origin}/pg/videos/async-generations/${encodedId}/result`,
        appendQuery(`${origin}/pg/videos/async-generations`, { request_id: requestId }),
        appendQuery(`${origin}/pg/videos/async-generations`, { task_id: requestId }),
        `${baseUrl}/video/generations/${encodedId}`,
    ];
}

async function fetchHfsyVideoResult(baseUrl, requestId, headers) {
    const candidates = buildHfsyVideoPollCandidates(baseUrl, requestId);
    let lastResult = null;

    for (const targetUrl of candidates) {
        const response = await fetch(targetUrl, {
            headers,
            method: 'GET',
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        });
        const data = await readUpstreamJson(response);
        const normalized = normalizeHfsyVideoResponse(data, { requestId });
        lastResult = { response, data: normalized, targetUrl };

        if (response.ok && hasStructuredHfsyTaskData(data, normalized)) {
            return lastResult;
        }

        if (!response.ok && ![404, 405].includes(response.status)) {
            return lastResult;
        }
    }

    return {
        response: { status: lastResult?.response?.status || 502 },
        data: {
            provider: 'hfsy',
            id: requestId,
            request_id: requestId,
            task_id: requestId,
            status: 'failed',
            error: 'HFSY 视频任务查询未返回结构化 JSON，请检查轮询路径或上游任务 ID。',
        },
        targetUrl: lastResult?.targetUrl,
    };
}

async function fetchArkVideoResult(baseUrl, requestId, headers) {
    const targetUrl = `${baseUrl.replace(/\/+$/, '')}/contents/generations/tasks/${encodeURIComponent(requestId)}`;
    const response = await fetch(targetUrl, {
        headers,
        method: 'GET',
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const data = await readUpstreamJson(response);
    return {
        response,
        data: normalizeArkVideoResponse(data, { requestId }),
        targetUrl,
    };
}

// Proxies /api/api/v1/* -> https://api.muapi.ai/api/v1/*
// This is required because the AiAgent library hardcodes a double /api/api
export async function GET(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const providerBase = getProviderBaseInfo(request);
    const targetUrl = buildTargetUrl(providerBase.baseUrl, path, search, providerBase.usesProviderBase);

    const apiKey = getApiKey(request, getPayloadModelIds(path), providerBase);
    const headers = cleanHeaders(request, apiKey, providerBase.usesProviderBase);
    const hfsyRequestId = providerBase.usesProviderBase && isHfsyBase(providerBase.baseUrl)
        ? extractHfsyPollRequestId(path)
        : null;
    const arkRequestId = providerBase.usesProviderBase && isSeedanceArkProvider(providerBase)
        ? extractArkPollRequestId(path)
        : null;
    
    console.log(`[double-api proxy GET] ${arkRequestId ? `Seedance Ark video poll ${arkRequestId}` : hfsyRequestId ? `HFSY video poll ${hfsyRequestId}` : targetUrl} | apiKey: ${apiKey ? apiKey.slice(0,8)+'...' : 'MISSING'}`);

    try {
        if (arkRequestId) {
            if (!apiKey) {
                return NextResponse.json({ error: '缺少 Ark API Key，请在 .env.local 设置 ARK_API_KEY。' }, { status: 400 });
            }
            const result = await fetchArkVideoResult(providerBase.baseUrl, arkRequestId, headers);
            return NextResponse.json(
                result?.data || { error: 'Seedance Ark 视频任务查询失败', request_id: arkRequestId },
                { status: result?.response?.status || 502 },
            );
        }

        if (hfsyRequestId) {
            const result = await fetchHfsyVideoResult(providerBase.baseUrl, hfsyRequestId, headers);
            return NextResponse.json(
                result?.data || { error: 'HFSY 视频任务查询失败', request_id: hfsyRequestId },
                { status: result?.response?.status || 502 },
            );
        }

        const response = await fetch(targetUrl, { headers, method: 'GET', signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
        const data = await readUpstreamJson(response);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const providerBase = getProviderBaseInfo(request);

    try {
        const body = await request.arrayBuffer();
        const payload = request.headers.get('content-type')?.includes('application/json') ? parseJsonBody(body) : null;
        const apiKey = getApiKey(request, getPayloadModelIds(path, payload), providerBase);
        const headers = cleanHeaders(request, apiKey, providerBase.usesProviderBase);
        const arkVideoRequest = providerBase.usesProviderBase && isSeedanceArkProvider(providerBase) && payload && isHfsyVideoModel(path);
        const arkImageRequest = shouldUseArkImageAdapter(providerBase, path, payload);
        if ((arkVideoRequest || arkImageRequest) && !apiKey) {
            return NextResponse.json({ error: '缺少 Ark API Key，请在 .env.local 设置 ARK_API_KEY。' }, { status: 400 });
        }

        const hfsyVideoUrl = arkVideoRequest ? null : buildHfsyVideoTargetUrl(providerBase.baseUrl, path, search);
        const arkVideoUrl = arkVideoRequest ? `${providerBase.baseUrl.replace(/\/+$/, '')}/contents/generations/tasks${search}` : null;
        const arkImageUrl = arkImageRequest ? `${providerBase.baseUrl.replace(/\/+$/, '')}/images/generations${search}` : null;
        const targetUrl = arkVideoUrl || arkImageUrl || hfsyVideoUrl || buildTargetUrl(providerBase.baseUrl, path, search, providerBase.usesProviderBase);
        const requestBody = arkVideoUrl && payload
            ? buildArkVideoBody(path, payload)
            : arkImageUrl && payload
                ? buildArkImageBody(payload)
            : hfsyVideoUrl && payload
                ? buildHfsyVideoBody(path, payload)
                : body;

        if (arkVideoUrl || arkImageUrl || hfsyVideoUrl) {
            headers.set('content-type', 'application/json');
            if (!headers.get('x-request-id')) headers.set('x-request-id', createClientRequestId());
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: requestBody,
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        });

        const data = await readUpstreamJson(response);
        if (arkVideoUrl) {
            return NextResponse.json(
                normalizeArkVideoResponse(data, { model: resolveArkModel(payload) }),
                { status: response.status },
            );
        }

        if (arkImageUrl) {
            return NextResponse.json(
                normalizeArkImageResponse(data, { model: resolveArkImageModel(payload) }),
                { status: response.status },
            );
        }

        if (hfsyVideoUrl) {
            return NextResponse.json(
                normalizeHfsyVideoResponse(data, { model: payload?.model || path }),
                { status: response.status },
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
