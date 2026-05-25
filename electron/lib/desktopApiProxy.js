const crypto = require('crypto');
const http = require('http');

const MUAPI_BASE = 'https://api.muapi.ai';
const HFSY_DEFAULT_BASE = 'https://www.hfsyapi.cn/v1';
const HFSY_TEMP_IMAGE_BASE = String(process.env.HFSY_TEMP_IMAGE_BASE || 'http://www.hfsyapi.cn/public/temp_images').replace(/\/+$/, '');
const ARK_DEFAULT_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
const REQUEST_TIMEOUT_MS = Number(process.env.API_PROVIDER_TIMEOUT_MS || 300000);
const TOKEN_HEADER = 'x-mozenaigc-desktop-token';

function normalizeValue(value) {
    if (!value) return null;
    const raw = Array.isArray(value) ? value[0] : value;
    const trimmed = String(raw).trim();
    return trimmed && trimmed !== 'null' && trimmed !== 'undefined' ? trimmed : null;
}

function normalizeBaseUrl(value) {
    const raw = normalizeValue(value);
    if (!raw) return null;
    try {
        const parsed = new URL(raw);
        if (!['http:', 'https:'].includes(parsed.protocol)) return null;
        return raw.replace(/\/+$/, '');
    } catch {
        return null;
    }
}

function resolveProviderBaseUrl(value, providerId = '') {
    return (
        normalizeBaseUrl(value) ||
        (providerId === 'seedance-ark' ? normalizeBaseUrl(process.env.SEEDANCE_BASE_URL) || ARK_DEFAULT_BASE : null) ||
        normalizeBaseUrl(process.env.API_PROVIDER_BASE_URL) ||
        HFSY_DEFAULT_BASE
    );
}

function normalizeProviderId(value) {
    return String(value || '').trim().toLowerCase();
}

function parseJsonEnv(name) {
    const raw = normalizeValue(process.env[name]);
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
    const raw = normalizeValue(String(modelId || ''));
    if (!raw) return [];

    const id = raw.toLowerCase().replace(/_/g, '-');
    const aliases = new Set([id]);
    aliases.add(id.replace(/-(text-to-image|image-to-image|text-to-video|image-to-video|async-generations|generations|edits|omni-reference|1080p)$/g, ''));
    aliases.add(id.replace(/-edit$/g, ''));

    if (id.includes('gpt-image-2-all')) aliases.add('gpt-image-2-all');
    if (id.includes('gpt-image-2pro')) aliases.add('gpt-image-2pro');
    if (id.includes('gpt-image-2')) aliases.add('gpt-image-2');
    if (id.includes('gemini-3.1-flash-image-preview')) aliases.add('gemini-3.1-flash-image-preview');
    if (id.includes('gemini-3-pro-image-preview')) aliases.add('gemini-3-pro-image-preview');
    if (id.includes('seedance-v2.0')) {
        aliases.add('seedance-v2.0');
        aliases.add('sd-2-vip');
        aliases.add('sd-2');
    }
    if (id.includes('sd-2-vip')) aliases.add('sd-2-vip');
    if (id.includes('sd-2')) aliases.add('sd-2');
    if (id.includes('kling-v3')) aliases.add('kling-v3');
    if (id.includes('sora-2')) aliases.add('sora-2');

    return Array.from(aliases).filter(Boolean);
}

function getModelKey(modelIds = []) {
    const lowerMap = Object.fromEntries(
        Object.entries(getModelKeyMap()).map(([modelId, key]) => [
            String(modelId).toLowerCase().replace(/_/g, '-'),
            normalizeValue(key),
        ]),
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

function isSeedanceArkProvider(providerId, baseUrl) {
    return providerId === 'seedance-ark' || isArkBase(baseUrl);
}

function getHeader(headers, name) {
    return normalizeValue(headers[name.toLowerCase()]);
}

function getBearerToken(headers) {
    const auth = getHeader(headers, 'authorization');
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null;
    return normalizeValue(auth.slice(7));
}

function getApiV1BaseInfo(headers) {
    const providerId = normalizeProviderId(getHeader(headers, 'x-provider-id'));
    const headerBaseUrl = normalizeBaseUrl(getHeader(headers, 'x-provider-base-url'));
    const fallbackBaseUrl =
        providerId === 'seedance-ark'
            ? normalizeBaseUrl(process.env.SEEDANCE_BASE_URL) || ARK_DEFAULT_BASE
            : MUAPI_BASE;

    return {
        providerId,
        baseUrl: headerBaseUrl || fallbackBaseUrl,
        usesProviderBase: Boolean(headerBaseUrl || providerId === 'seedance-ark'),
    };
}

function getProviderV1BaseInfo(headers) {
    const providerId = normalizeProviderId(getHeader(headers, 'x-provider-id'));
    const baseUrl = resolveProviderBaseUrl(getHeader(headers, 'x-provider-base-url'), providerId);
    return {
        providerId,
        baseUrl,
        usesProviderBase: true,
    };
}

function getMuapiRouteBaseInfo(headers) {
    const providerId = normalizeProviderId(getHeader(headers, 'x-provider-id'));
    const headerBaseUrl = normalizeBaseUrl(getHeader(headers, 'x-provider-base-url'));
    return {
        providerId,
        baseUrl: headerBaseUrl || MUAPI_BASE,
        usesProviderBase: Boolean(headerBaseUrl),
    };
}

function normalizeHttpUrl(value) {
    const raw = normalizeValue(value);
    if (!raw) return null;
    try {
        const parsed = new URL(raw);
        if (!['http:', 'https:'].includes(parsed.protocol)) return null;
        return parsed.toString();
    } catch {
        return null;
    }
}

function parseJsonBody(buffer, headers) {
    if (!buffer?.byteLength || !String(getHeader(headers, 'content-type') || '').includes('application/json')) {
        return null;
    }
    try {
        return JSON.parse(Buffer.from(buffer).toString('utf8'));
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

function getProviderPayloadModelIds(pathSegments, payload) {
    const ids = [];
    const pathModel = Array.isArray(pathSegments) ? pathSegments[pathSegments.length - 1] : '';
    if (pathModel) ids.push(pathModel);
    if (payload?.model) ids.push(payload.model);
    if (Array.isArray(payload?.models)) ids.push(...payload.models);
    return ids;
}

function getApiKey(headers, modelIds = [], providerBase = null) {
    const bearerKey = getBearerToken(headers);
    if (bearerKey) return bearerKey;

    const headerKey = getHeader(headers, 'x-api-key');
    if (headerKey) return headerKey;

    const arkKey = normalizeValue(process.env.ARK_API_KEY);
    if (providerBase && isSeedanceArkProvider(providerBase.providerId, providerBase.baseUrl) && arkKey) {
        return arkKey;
    }

    return (
        getModelKey(modelIds) ||
        normalizeValue(process.env.API_PROVIDER_KEY) ||
        normalizeValue(process.env.HFSY_API_KEY) ||
        normalizeValue(process.env.MUAPI_API_KEY) ||
        normalizeValue(process.env.YUNWU_API_KEY)
    );
}

function cleanApiV1Headers(sourceHeaders, apiKey, usesProviderBase) {
    const headers = new Headers();
    const skip = new Set([
        'host',
        'connection',
        'content-length',
        'cookie',
        'origin',
        'referer',
        'sec-fetch-dest',
        'sec-fetch-mode',
        'sec-fetch-site',
        TOKEN_HEADER,
        'x-provider-base-url',
        'x-provider-id',
    ]);

    Object.entries(sourceHeaders).forEach(([key, value]) => {
        const lower = key.toLowerCase();
        if (skip.has(lower)) return;
        if (lower === 'authorization' || lower === 'x-api-key') return;
        if (Array.isArray(value)) {
            value.forEach((item) => item != null && headers.append(key, String(item)));
        } else if (value != null) {
            headers.set(key, String(value));
        }
    });

    if (apiKey) {
        headers.set('x-api-key', apiKey);
        if (usesProviderBase) headers.set('authorization', `Bearer ${apiKey}`);
    }

    return headers;
}

function cleanProviderHeaders(sourceHeaders, apiKey) {
    const headers = new Headers();
    const contentType = getHeader(sourceHeaders, 'content-type');
    const accept = getHeader(sourceHeaders, 'accept');

    if (contentType) headers.set('content-type', contentType);
    if (accept) headers.set('accept', accept);
    if (apiKey) headers.set('authorization', `Bearer ${apiKey}`);
    return headers;
}

function cleanMuapiRouteHeaders(sourceHeaders, apiKey, usesProviderBase) {
    const headers = new Headers();
    const skip = new Set([
        'host',
        'connection',
        'content-length',
        'cookie',
        'origin',
        'referer',
        'sec-fetch-dest',
        'sec-fetch-mode',
        'sec-fetch-site',
        TOKEN_HEADER,
        'x-provider-base-url',
        'x-provider-id',
    ]);

    Object.entries(sourceHeaders).forEach(([key, value]) => {
        const lower = key.toLowerCase();
        if (skip.has(lower)) return;
        if (lower === 'authorization' || lower === 'x-api-key') return;
        if (Array.isArray(value)) {
            value.forEach((item) => item != null && headers.append(key, String(item)));
        } else if (value != null) {
            headers.set(key, String(value));
        }
    });

    if (apiKey) {
        headers.set('x-api-key', apiKey);
        if (usesProviderBase) headers.set('authorization', `Bearer ${apiKey}`);
    }

    return headers;
}

function buildApiV1TargetUrl(baseUrl, path, search, usesProviderBase) {
    const base = usesProviderBase ? baseUrl : `${baseUrl}/api/v1`;
    return path ? `${base}/${path}${search}` : `${base}${search}`;
}

function buildProviderTargetUrl(baseUrl, pathSegments, search) {
    const path = (pathSegments || []).join('/');
    return path ? `${baseUrl}/${path}${search}` : `${baseUrl}${search}`;
}

function buildMuapiRouteTargetUrl(baseUrl, family, pathSegments, search) {
    const rawPath = (pathSegments || []).join('/');
    const path = family === 'app' && rawPath === 'get_upload_file' ? 'get_file_upload_url' : rawPath;
    const base = `${baseUrl}/${family}`;

    if (family === 'agents') {
        return {
            targetUrl: path ? `${base}/${path}${search}` : `${base}${search}`,
            path,
        };
    }

    return {
        targetUrl: path ? `${base}/${path}${search}` : `${base}/${search}`,
        path,
    };
}

function rewriteAppUploadResponse(path, text) {
    if (path !== 'get_file_upload_url') return null;

    try {
        const data = JSON.parse(text || '{}');
        if (!data || typeof data !== 'object' || Array.isArray(data) || !data.url) return null;
        const originalTargetUrl = data.url;
        return JSON.stringify({
            ...data,
            url: '/api/upload-binary',
            fields: {
                ...(data.fields && typeof data.fields === 'object' ? data.fields : {}),
                'x-proxy-target-url': originalTargetUrl,
            },
        });
    } catch {
        return null;
    }
}

function isAllowedOrigin(origin) {
    if (!origin || origin === 'null' || origin === 'file://') return true;
    try {
        const url = new URL(origin);
        return ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    } catch {
        return false;
    }
}

function corsHeaders(request) {
    const origin = request.headers.origin;
    const allowOrigin = isAllowedOrigin(origin) ? origin || 'null' : 'null';
    return {
        'access-control-allow-origin': allowOrigin,
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'access-control-allow-headers':
            request.headers['access-control-request-headers'] ||
            'content-type,authorization,x-api-key,x-provider-base-url,x-provider-id,x-mozenaigc-desktop-token',
        'access-control-max-age': '600',
        vary: 'origin',
    };
}

function withRequestId(payload, requestId) {
    if (!requestId || !payload || typeof payload !== 'object' || Array.isArray(payload) || payload.request_id) {
        return payload;
    }
    return { ...payload, request_id: requestId };
}

function sendJson(response, status, payload, extraHeaders = {}, requestId = null) {
    response.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        ...(requestId ? { 'x-request-id': requestId } : {}),
        ...extraHeaders,
    });
    response.end(JSON.stringify(withRequestId(payload, requestId)));
}

function sendText(response, status, text, contentType, extraHeaders = {}, requestId = null) {
    response.writeHead(status, {
        'content-type': contentType || 'text/plain; charset=utf-8',
        ...(requestId ? { 'x-request-id': requestId } : {}),
        ...extraHeaders,
    });
    response.end(text);
}

function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        request.on('data', (chunk) => chunks.push(chunk));
        request.on('end', () => resolve(Buffer.concat(chunks)));
        request.on('error', reject);
    });
}

function createRequestId() {
    return crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function redactText(value) {
    return String(value || '')
        .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;"']+/gi, '$1[redacted]')
        .replace(/(x-api-key\s*[:=]\s*)[^\s,;"']+/gi, '$1[redacted]')
        .replace(/(api[_-]?key\s*[:=]\s*)[^\s,&"'}]+/gi, '$1[redacted]')
        .replace(/\b(sk-[A-Za-z0-9_-]{8,})\b/g, '[redacted-key]')
        .slice(0, 300);
}

function safeErrorMessage(error, fallback = 'Desktop API proxy request failed.') {
    return redactText(error?.message || fallback) || fallback;
}

function logProxyRequest({ method, route, requestId, providerId }) {
    console.info(`[desktop-api] ${method} ${route} request=${requestId} provider=${providerId || 'default'}`);
}

function logProxyFailure({ route, requestId, providerId, error }) {
    console.warn(`[desktop-api] failure ${route} request=${requestId} provider=${providerId || 'default'} error=${safeErrorMessage(error)}`);
}

function detectImageMime(buffer) {
    if (!buffer?.length) return null;
    if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        return 'image/png';
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return 'image/jpeg';
    }
    if (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
        return 'image/webp';
    }
    const gifHeader = buffer.length >= 6 ? buffer.subarray(0, 6).toString('ascii') : '';
    if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
        return 'image/gif';
    }
    return null;
}

function blobFromImageBuffer(buffer, mimeType, label = '参考图') {
    if (!buffer?.length) {
        throw new Error(`${label} 为空，无法作为有效图片上传。`);
    }

    const normalizedMime = String(mimeType || '').split(';')[0].trim().toLowerCase();
    const detectedMime = detectImageMime(buffer);
    const head = buffer.subarray(0, Math.min(buffer.length, 80)).toString('utf8').trim().toLowerCase();
    if (head.startsWith('<!doctype') || head.startsWith('<html')) {
        throw new Error(`${label} 返回的是网页 HTML，不是图片。请换用可直连图片 URL，或重新上传图片。`);
    }

    const signatureRequiredMimes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
    if (signatureRequiredMimes.has(normalizedMime) && !detectedMime) {
        throw new Error(`${label} 的内容不是有效图片数据，请重新选择或上传原图。`);
    }
    if (!detectedMime && normalizedMime && !normalizedMime.startsWith('image/')) {
        throw new Error(`${label} 返回的类型是 ${normalizedMime}，不是图片。`);
    }
    if (!detectedMime && !normalizedMime) {
        throw new Error(`${label} 缺少图片类型，且无法识别为有效图片。`);
    }

    return new Blob([new Uint8Array(buffer)], { type: detectedMime || normalizedMime || 'image/png' });
}

function dataUrlToBlob(dataUrl, label = '参考图') {
    const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
    if (!match) throw new Error(`${label} 不是有效 data URL。`);

    const mimeType = match[1] || 'application/octet-stream';
    const isBase64 = Boolean(match[2]);
    const encoded = isBase64 ? match[3].replace(/\s+/g, '') : match[3];
    const raw = isBase64 ? Buffer.from(encoded, 'base64') : Buffer.from(decodeURIComponent(encoded), 'utf8');

    return blobFromImageBuffer(raw, mimeType, label);
}

async function imageSourceToBlob(source, label = '参考图') {
    if (typeof source !== 'string' || !source.trim()) return null;
    const trimmed = source.trim();

    if (trimmed.startsWith('data:')) return dataUrlToBlob(trimmed, label);

    if (/^https?:\/\//i.test(trimmed)) {
        const response = await fetch(trimmed, {
            headers: { accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.8' },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) {
            throw new Error(`参考图下载失败：${response.status} ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        return blobFromImageBuffer(buffer, response.headers.get('content-type') || '', label);
    }

    return null;
}

async function buildImageEditFormData(payload) {
    const formData = new FormData();

    [
        'model',
        'prompt',
        'n',
        'size',
        'quality',
        'background',
        'moderation',
        'output_format',
        'output_compression',
        'response_format',
    ].forEach((field) => {
        const value = payload[field];
        if (value !== undefined && value !== null && value !== '') {
            formData.append(field, String(value));
        }
    });

    const imageSources = Array.isArray(payload.images)
        ? payload.images
        : Array.isArray(payload.images_list)
            ? payload.images_list
            : payload.image_url
                ? [payload.image_url]
                : [];

    if (imageSources.length === 0) {
        throw new Error('图生图需要至少一张参考图。');
    }

    for (const [index, source] of imageSources.entries()) {
        const blob = await imageSourceToBlob(source, `第 ${index + 1} 张参考图`);
        if (!blob) throw new Error(`无法读取第 ${index + 1} 张参考图。`);
        const extension = blob.type?.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
        formData.append('image', blob, `reference-${index + 1}.${extension}`);
    }

    return formData;
}

function readEnvString(name, fallback = null) {
    return normalizeValue(process.env[name]) || fallback;
}

function resolveArkImageModel(payload = {}) {
    return (
        readEnvString('SEEDREAM_ENDPOINT_ID') ||
        readEnvString('SEEDREAM_MODEL') ||
        readEnvString('ARK_SEEDREAM_ENDPOINT_ID') ||
        normalizeValue(String(payload.model || '')) ||
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
    return id.startsWith('ep-') || id.includes('seedream') || id.includes('seed-dream');
}

function shouldUseArkImageAdapter(providerId, baseUrl, path, payload) {
    if (!isSeedanceArkProvider(providerId, baseUrl) || !isArkImageGenerationPath(path) || !payload) return false;
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
    const imageSources = [
        payload.image,
        payload.images,
        payload.image_urls,
        payload.images_list,
        payload.reference_images,
        payload.image_url,
    ].flatMap((value) => (Array.isArray(value) ? value : [value]));
    const seen = new Set();
    const images = imageSources
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
        .filter((value) => {
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        })
        .slice(0, 14);

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

function normalizeImageUrlCandidate(value) {
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (!text) return null;
    if (/^data:image\//i.test(text)) return text;
    if (/^https?:\/\//i.test(text)) return text;
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
        'result[0].url',
        'output.url',
        'output[0].url',
        'outputs[0].url',
        'outputs[0]',
    ]);
    const url = normalizeImageUrlCandidate(direct);
    if (url) return url;

    const b64 = getFirstString(data, ['b64_json', 'data.b64_json', 'data[0].b64_json', 'result.b64_json', 'result[0].b64_json']);
    return b64 ? `data:image/png;base64,${b64}` : null;
}

function extractRequestId(data) {
    return getFirstString(data, [
        'request_id',
        'task_id',
        'id',
        'data.request_id',
        'data.task_id',
        'data.id',
        'data[0].request_id',
        'data[0].task_id',
        'data[0].id',
        'result.request_id',
        'result.task_id',
        'result.id',
    ]);
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
    const error = !url ? extractImageErrorMessage(source) : null;

    return {
        ...source,
        provider: 'seedance-ark',
        trustedForSeedance: Boolean(url),
        model: model || source.model,
        id,
        request_id: id,
        task_id: id,
        status: url ? 'completed' : error ? 'failed' : id ? 'processing' : source.status,
        url: url || undefined,
        outputs: url ? [url] : undefined,
        data: Array.isArray(source.data) ? source.data : url ? [{ url }] : source.data,
        error: error || undefined,
    };
}

function safelyDecode(value) {
    try {
        return decodeURIComponent(String(value || ''));
    } catch {
        return String(value || '');
    }
}

function looksLikeHtml(value) {
    const text = safelyDecode(value).trim().toLowerCase();
    return (
        text.startsWith('<!doctype') ||
        text.startsWith('<html') ||
        text.includes('<html') ||
        text.includes('<head') ||
        text.includes('<body') ||
        text.includes('&lt;!doctype') ||
        text.includes('&lt;html')
    );
}

function summarizeBody(text) {
    return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

function normalizeUploadUrl(baseUrl, value) {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return '';
    if (looksLikeHtml(raw)) return '';
    try {
        const url = new URL(raw, `${baseUrl.replace(/\/+$/, '')}/upload`).toString();
        return looksLikeHtml(url) ? '' : url;
    } catch {
        return '';
    }
}

function extractUploadedUrl(baseUrl, payload) {
    if (!payload) return '';
    if (typeof payload === 'string') return normalizeUploadUrl(baseUrl, payload);
    if (Array.isArray(payload)) return extractUploadedUrl(baseUrl, payload[0]);
    if (typeof payload !== 'object') return '';

    const direct = payload.url || payload.file_url || payload.image_url || payload.src || payload.path;
    if (direct) return normalizeUploadUrl(baseUrl, direct);

    const firstDataItem = Array.isArray(payload.data) ? payload.data[0] : payload.data;
    return extractUploadedUrl(baseUrl, firstDataItem);
}

function parseUploadResponse(text) {
    const trimmed = text.trim();
    if (!trimmed) return null;
    try {
        return JSON.parse(trimmed);
    } catch {
        return trimmed;
    }
}

const STATUS_IMAGE_MODELS = [
    {
        id: 'doubao-seedream-5.0-lite',
        label: 'Doubao Seedream 5.0 Lite',
        provider: 'Volcengine Ark',
        kind: 'image',
        requires: 'ark-seedream',
    },
    {
        id: 'gemini-3.1-flash-image-preview',
        label: 'Nano Banana',
        provider: 'Yunwu / Provider Proxy',
        kind: 'image',
        requires: 'provider-key',
    },
    {
        id: 'gemini-3-pro-image-preview',
        label: 'Nano Banana Pro',
        provider: 'Yunwu / Provider Proxy',
        kind: 'image',
        requires: 'provider-key',
    },
    {
        id: 'gpt-image-2-all',
        label: 'GPT Image 2 All',
        provider: 'Yunwu / Provider Proxy',
        kind: 'image',
        requires: 'provider-key',
        aliases: ['gpt-image-2'],
    },
];

const STATUS_VIDEO_MODELS = [
    {
        id: 'sd-2-vip',
        label: 'Seedance 2.0 I2V',
        provider: 'Volcengine Ark',
        kind: 'video',
        requires: 'ark-seedance',
    },
    {
        id: 'sd-2',
        label: 'Seedance 2.0 Fast',
        provider: 'Volcengine Ark',
        kind: 'video',
        requires: 'ark-seedance',
    },
];

function hasEnv(name) {
    return Boolean(normalizeValue(process.env[name]));
}

function hasAnyEnv(names) {
    return names.some(hasEnv);
}

function getStatusModelAliases(model) {
    const values = new Set(getModelAliases(model.id));
    (model.aliases || []).forEach((alias) => {
        getModelAliases(alias).forEach((value) => values.add(value));
    });
    return Array.from(values).filter(Boolean);
}

function hasModelKeyForStatus(model) {
    const lowerMap = Object.fromEntries(
        Object.entries(getModelKeyMap()).map(([modelId, key]) => [
            String(modelId).toLowerCase().replace(/_/g, '-'),
            normalizeValue(key),
        ]),
    );
    return getStatusModelAliases(model).some((alias) => Boolean(lowerMap[alias]));
}

function providerKeyStatus(model) {
    if (hasModelKeyForStatus(model)) {
        return {
            status: 'ok',
            detail: '已配置模型专用密钥',
        };
    }

    if (hasAnyEnv(['YUNWU_API_KEY', 'API_PROVIDER_KEY', 'HFSY_API_KEY', 'MUAPI_API_KEY'])) {
        return {
            status: 'ok',
            detail: '已配置通用服务端密钥',
        };
    }

    return {
        status: 'error',
        detail: '缺少模型密钥或通用服务端密钥',
    };
}

function arkSeedreamStatus() {
    if (!hasEnv('ARK_API_KEY')) {
        return {
            status: 'error',
            detail: '缺少 ARK_API_KEY',
        };
    }

    if (!hasAnyEnv(['SEEDREAM_ENDPOINT_ID', 'SEEDREAM_MODEL', 'ARK_SEEDREAM_ENDPOINT_ID'])) {
        return {
            status: 'warn',
            detail: 'Ark 密钥存在，但未检测到 Seedream endpoint/model',
        };
    }

    return {
        status: 'ok',
        detail: '已配置 Ark 密钥和 Seedream endpoint/model',
    };
}

function arkSeedanceStatus() {
    if (!hasEnv('ARK_API_KEY')) {
        return {
            status: 'error',
            detail: '缺少 ARK_API_KEY',
        };
    }

    if (!hasAnyEnv(['SEEDANCE_ENDPOINT_ID', 'SEEDANCE_MODEL'])) {
        return {
            status: 'error',
            detail: '缺少 Seedance endpoint/model',
        };
    }

    return {
        status: 'ok',
        detail: '已配置 Ark 密钥和 Seedance endpoint/model',
    };
}

function resolveModelStatus(model) {
    const result =
        model.requires === 'ark-seedream'
            ? arkSeedreamStatus()
            : model.requires === 'ark-seedance'
                ? arkSeedanceStatus()
                : providerKeyStatus(model);

    return {
        id: model.id,
        label: model.label,
        kind: model.kind,
        provider: model.provider,
        status: result.status,
        detail: result.detail,
    };
}

function handleProviderStatus(request, response, headers, requestId) {
    if (request.method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed.' }, { allow: 'GET', ...headers }, requestId);
        return;
    }

    const models = [...STATUS_IMAGE_MODELS, ...STATUS_VIDEO_MODELS].map(resolveModelStatus);
    const summary = models.reduce(
        (acc, model) => {
            acc.total += 1;
            acc[model.status] = (acc[model.status] || 0) + 1;
            return acc;
        },
        { total: 0, ok: 0, warn: 0, error: 0 },
    );
    const status = summary.error > 0 ? 'error' : summary.warn > 0 ? 'warn' : 'ok';

    logProxyRequest({ method: request.method, route: '/api/provider/status', requestId, providerId: 'status' });
    sendJson(response, 200, {
        status,
        summary,
        models,
        updatedAt: new Date().toISOString(),
    }, headers, requestId);
}

function getMultipartBoundary(contentType) {
    const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(String(contentType || ''));
    return match ? (match[1] || match[2] || '').trim() : '';
}

function findMultipartFileMeta(buffer, contentType) {
    const boundary = getMultipartBoundary(contentType);
    if (!boundary || !buffer?.byteLength) return null;

    const text = buffer.toString('latin1');
    const boundaryMarker = `--${boundary}`;
    const parts = text.split(boundaryMarker);
    for (const part of parts) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd < 0) continue;
        const headerText = part.slice(0, headerEnd);
        if (!/content-disposition\s*:/i.test(headerText) || !/name="file"/i.test(headerText)) continue;

        const typeMatch = /content-type\s*:\s*([^\r\n]+)/i.exec(headerText);
        const fileNameMatch = /filename="([^"]*)"/i.exec(headerText);
        return {
            contentType: normalizeValue(typeMatch?.[1]) || 'application/octet-stream',
            fileName: normalizeValue(fileNameMatch?.[1]) || 'image.png',
        };
    }
    return null;
}

function splitProxyPath(pathname, prefix) {
    const raw = pathname.replace(prefix, '').replace(/^\/+/, '');
    const decoded = raw ? decodeURIComponent(raw) : '';
    return decoded ? decoded.split('/').filter(Boolean) : [];
}

async function handleApiV1(request, response, url, headers, requestId) {
    const path = decodeURIComponent(url.pathname.replace(/^\/api\/api\/v1\/?/, ''));
    const body = ['GET', 'HEAD'].includes(request.method) ? null : await readRequestBody(request);
    const payload = parseJsonBody(body, request.headers);
    const providerBase = getApiV1BaseInfo(request.headers);
    const apiKey = getApiKey(request.headers, getPayloadModelIds(path, payload), providerBase);

    if (!apiKey) {
        sendJson(
            response,
            401,
            {
                error: '缺少 API Key。请在 API 管理页保存通道密钥，或配置 API_PROVIDER_KEY / HFSY_API_KEY / MUAPI_API_KEY。',
            },
            headers,
            requestId,
        );
        return;
    }

    const targetUrl = buildApiV1TargetUrl(providerBase.baseUrl, path, url.search, providerBase.usesProviderBase);
    const forwardHeaders = cleanApiV1Headers(request.headers, apiKey, providerBase.usesProviderBase);
    const init = {
        method: request.method,
        headers: forwardHeaders,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    };

    if (!['GET', 'HEAD'].includes(request.method)) {
        init.body = body;
    }

    logProxyRequest({
        method: request.method,
        route: `/api/api/v1/${path}`,
        requestId,
        providerId: providerBase.providerId || 'muapi',
    });

    try {
        const upstream = await fetch(targetUrl, init);
        const text = await upstream.text();
        sendText(response, upstream.status, text, upstream.headers.get('content-type'), headers, requestId);
    } catch (error) {
        logProxyFailure({ route: '/api/api/v1/*', requestId, providerId: providerBase.providerId || 'muapi', error });
        const timeout = error.name === 'AbortError' || error.name === 'TimeoutError';
        sendJson(
            response,
            timeout ? 504 : 502,
            {
                error: timeout ? 'API 上游请求超时。' : safeErrorMessage(error),
            },
            headers,
            requestId,
        );
    }
}

async function handleProviderV1(request, response, url, headers, requestId) {
    const pathSegments = splitProxyPath(url.pathname, /^\/api\/provider\/v1\/?/);
    const path = pathSegments.join('/');
    const providerBase = getProviderV1BaseInfo(request.headers);

    try {
        let body = null;
        let payload = null;

        if (!['GET', 'HEAD'].includes(request.method)) {
            body = await readRequestBody(request);
            payload = parseJsonBody(body, request.headers);
        }

        const apiKey = getApiKey(request.headers, getProviderPayloadModelIds(pathSegments, payload), providerBase);
        if (!apiKey) {
            sendJson(
                response,
                401,
                {
                    error: '缺少 API Key。请在 API 管理页保存通道密钥，或在环境变量中配置 HFSY_MODEL_KEYS_JSON / API_PROVIDER_KEY。',
                },
                headers,
                requestId,
            );
            return;
        }

        const forwardHeaders = cleanProviderHeaders(request.headers, apiKey);
        const arkImageRequest =
            request.method === 'POST' && shouldUseArkImageAdapter(providerBase.providerId, providerBase.baseUrl, path, payload);
        const targetUrl = buildProviderTargetUrl(providerBase.baseUrl, pathSegments, url.search);
        const init = {
            method: request.method,
            headers: forwardHeaders,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        };

        if (!['GET', 'HEAD'].includes(request.method)) {
            if (arkImageRequest) {
                forwardHeaders.set('content-type', 'application/json');
                init.body = buildArkImageBody(payload || {});
            } else if (path === 'images/edits' && String(getHeader(request.headers, 'content-type') || '').includes('application/json')) {
                forwardHeaders.delete('content-type');
                init.body = await buildImageEditFormData(payload || {});
            } else {
                init.body = body;
            }
        }

        logProxyRequest({
            method: request.method,
            route: `/api/provider/v1/${path}`,
            requestId,
            providerId: providerBase.providerId || 'hfsy',
        });

        const upstream = await fetch(targetUrl, init);
        const text = await upstream.text();

        if (arkImageRequest) {
            let data = null;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                data = { raw: text };
            }
            sendJson(response, upstream.status, normalizeArkImageResponse(data, { model: resolveArkImageModel(payload || {}) }), headers, requestId);
            return;
        }

        sendText(response, upstream.status, text, upstream.headers.get('content-type'), headers, requestId);
    } catch (error) {
        logProxyFailure({ route: '/api/provider/v1/*', requestId, providerId: providerBase.providerId || 'hfsy', error });
        const timeout = error.name === 'AbortError' || error.name === 'TimeoutError';
        sendJson(
            response,
            timeout ? 504 : 500,
            {
                error: timeout ? 'API 上游请求超时。可以稍后再试，或切换到已验证可用的通道。' : safeErrorMessage(error),
                cause: error.cause ? safeErrorMessage(error.cause, null) : null,
            },
            headers,
            requestId,
        );
    }
}

async function handleProviderUpload(request, response, headers, requestId) {
    if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed.' }, { allow: 'POST', ...headers }, requestId);
        return;
    }

    const contentType = getHeader(request.headers, 'content-type') || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
        sendJson(response, 400, { error: '图片上传需要 multipart/form-data。' }, headers, requestId);
        return;
    }

    const body = await readRequestBody(request);
    const fileMeta = findMultipartFileMeta(body, contentType);
    if (!fileMeta) {
        sendJson(response, 400, { error: '缺少图片文件。' }, headers, requestId);
        return;
    }

    if (!String(fileMeta.contentType || '').startsWith('image/')) {
        sendJson(response, 400, { error: 'HFSY 临时图床仅用于图片上传。' }, headers, requestId);
        return;
    }

    const targetUrl = `${HFSY_TEMP_IMAGE_BASE}/upload?returnFormat=full&autoRetry=true`;
    logProxyRequest({ method: request.method, route: '/api/provider/upload', requestId, providerId: 'hfsy-upload' });

    try {
        const upstream = await fetch(targetUrl, {
            method: 'POST',
            body,
            headers: {
                accept: 'application/json,text/plain,*/*',
                'content-type': contentType,
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        const text = await upstream.text();
        if (!upstream.ok) {
            sendJson(
                response,
                upstream.status,
                { error: `HFSY 图片上传失败：${upstream.status} ${upstream.statusText} - ${summarizeBody(text)}` },
                headers,
                requestId,
            );
            return;
        }

        const upstreamContentType = upstream.headers.get('content-type') || '';
        if (/text\/html/i.test(upstreamContentType) || looksLikeHtml(text)) {
            sendJson(
                response,
                502,
                {
                    error: 'HFSY 图片上传入口返回了网页 HTML，未获得可用图片链接；请改用公网图片 URL 或配置可用图床/上传接口。',
                    upstreamContentType,
                    upstreamPreview: summarizeBody(text),
                },
                headers,
                requestId,
            );
            return;
        }

        const payload = parseUploadResponse(text);
        const uploadedUrl = extractUploadedUrl(HFSY_TEMP_IMAGE_BASE, payload);
        if (!uploadedUrl) {
            sendJson(response, 502, { error: 'HFSY 图片上传成功但未返回可用图片链接。' }, headers, requestId);
            return;
        }

        sendJson(response, 200, { url: uploadedUrl, file_url: uploadedUrl, data: payload }, headers, requestId);
    } catch (error) {
        logProxyFailure({ route: '/api/provider/upload', requestId, providerId: 'hfsy-upload', error });
        const timeout = error.name === 'AbortError' || error.name === 'TimeoutError';
        sendJson(response, timeout ? 504 : 500, { error: timeout ? '图片上传超时。' : safeErrorMessage(error, '图片上传失败。') }, headers, requestId);
    }
}

async function handleMuapiRouteFamily(request, response, url, headers, requestId, family) {
    const allowedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']);
    if (!allowedMethods.has(request.method)) {
        sendJson(response, 405, { error: 'Method not allowed.' }, { allow: Array.from(allowedMethods).join(','), ...headers }, requestId);
        return;
    }

    const pathSegments = splitProxyPath(url.pathname, new RegExp(`^/api/${family}/?`));
    const providerBase = getMuapiRouteBaseInfo(request.headers);
    const body = ['GET', 'HEAD'].includes(request.method) ? null : await readRequestBody(request);
    const apiKey = getApiKey(request.headers, [], providerBase);
    const forwardHeaders = cleanMuapiRouteHeaders(request.headers, apiKey, providerBase.usesProviderBase);
    const { targetUrl, path } = buildMuapiRouteTargetUrl(providerBase.baseUrl, family, pathSegments, url.search);
    const init = {
        method: request.method,
        headers: forwardHeaders,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    };

    if (!['GET', 'HEAD'].includes(request.method)) {
        init.body = body;
    }

    logProxyRequest({
        method: request.method,
        route: `/api/${family}/${path}`,
        requestId,
        providerId: providerBase.providerId || 'muapi',
    });

    try {
        const upstream = await fetch(targetUrl, init);
        const text = await upstream.text();
        const rewrittenAppUpload = family === 'app' ? rewriteAppUploadResponse(path, text) : null;

        if (rewrittenAppUpload) {
            sendText(response, upstream.status, rewrittenAppUpload, 'application/json; charset=utf-8', headers, requestId);
            return;
        }

        sendText(response, upstream.status, text, upstream.headers.get('content-type'), headers, requestId);
    } catch (error) {
        logProxyFailure({ route: `/api/${family}/*`, requestId, providerId: providerBase.providerId || 'muapi', error });
        const timeout = error.name === 'AbortError' || error.name === 'TimeoutError';
        sendJson(
            response,
            timeout ? 504 : 502,
            {
                error: timeout ? 'API 上游请求超时。' : safeErrorMessage(error),
            },
            headers,
            requestId,
        );
    }
}

async function parseMultipartBody(body, contentType) {
    const request = new Request('http://127.0.0.1/upload-binary', {
        method: 'POST',
        headers: { 'content-type': contentType },
        body: new Uint8Array(body),
    });
    return request.formData();
}

async function handleUploadBinary(request, response, headers, requestId) {
    if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed.' }, { allow: 'POST', ...headers }, requestId);
        return;
    }

    const contentType = getHeader(request.headers, 'content-type') || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
        sendJson(response, 400, { error: '二进制上传需要 multipart/form-data。' }, headers, requestId);
        return;
    }

    try {
        const body = await readRequestBody(request);
        const formData = await parseMultipartBody(body, contentType);
        const targetUrl = normalizeHttpUrl(formData.get('x-proxy-target-url'));

        if (!targetUrl) {
            sendJson(response, 400, { error: '缺少有效的 x-proxy-target-url。' }, headers, requestId);
            return;
        }

        const forwardFormData = new FormData();
        for (const [key, value] of formData.entries()) {
            if (key === 'x-proxy-target-url') continue;
            if (typeof value === 'string') {
                forwardFormData.append(key, value);
            } else {
                forwardFormData.append(key, value, value.name || 'file');
            }
        }

        logProxyRequest({ method: request.method, route: '/api/upload-binary', requestId, providerId: 'muapi-upload' });
        const upstream = await fetch(targetUrl, {
            method: 'POST',
            body: forwardFormData,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        const text = await upstream.text();
        sendText(response, upstream.ok ? 204 : upstream.status, upstream.ok ? '' : text, upstream.headers.get('content-type'), headers, requestId);
    } catch (error) {
        logProxyFailure({ route: '/api/upload-binary', requestId, providerId: 'muapi-upload', error });
        const timeout = error.name === 'AbortError' || error.name === 'TimeoutError';
        sendJson(response, timeout ? 504 : 502, { error: timeout ? '上传上游请求超时。' : safeErrorMessage(error, '上传失败。') }, headers, requestId);
    }
}

function ensureAuthorized(request, response, headers, token, requestId) {
    if (request.headers[TOKEN_HEADER] === token) return true;
    sendJson(response, 401, { error: 'Unauthorized desktop API proxy request.' }, headers, requestId);
    return false;
}

async function routeRequest(request, response, token) {
    const headers = corsHeaders(request);

    if (request.method === 'OPTIONS') {
        response.writeHead(204, headers);
        response.end();
        return;
    }

    const requestId = createRequestId();
    if (!ensureAuthorized(request, response, headers, token, requestId)) return;

    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname.startsWith('/api/api/v1')) {
        await handleApiV1(request, response, url, headers, requestId);
        return;
    }

    if (url.pathname.startsWith('/api/provider/v1')) {
        await handleProviderV1(request, response, url, headers, requestId);
        return;
    }

    if (url.pathname === '/api/provider/status') {
        handleProviderStatus(request, response, headers, requestId);
        return;
    }

    if (url.pathname === '/api/provider/upload') {
        await handleProviderUpload(request, response, headers, requestId);
        return;
    }

    if (url.pathname.startsWith('/api/workflow')) {
        await handleMuapiRouteFamily(request, response, url, headers, requestId, 'workflow');
        return;
    }

    if (url.pathname.startsWith('/api/agents')) {
        await handleMuapiRouteFamily(request, response, url, headers, requestId, 'agents');
        return;
    }

    if (url.pathname.startsWith('/api/app')) {
        await handleMuapiRouteFamily(request, response, url, headers, requestId, 'app');
        return;
    }

    if (url.pathname === '/api/upload-binary') {
        await handleUploadBinary(request, response, headers, requestId);
        return;
    }

    sendJson(response, 404, { error: 'Desktop API proxy route not implemented.', path: url.pathname }, headers, requestId);
}

function startDesktopApiProxy() {
    const token = crypto.randomBytes(32).toString('hex');
    const server = http.createServer((request, response) => {
        routeRequest(request, response, token).catch((error) => {
            const requestId = createRequestId();
            logProxyFailure({ route: 'unhandled', requestId, providerId: 'desktop', error });
            sendJson(response, 500, { error: safeErrorMessage(error, 'Desktop API proxy error.') }, corsHeaders(request), requestId);
        });
    });

    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            const origin = `http://127.0.0.1:${address.port}`;
            server.off('error', reject);
            resolve({
                origin,
                token,
                close: () =>
                    new Promise((closeResolve, closeReject) => {
                        server.close((error) => (error ? closeReject(error) : closeResolve()));
                    }),
            });
        });
    });
}

module.exports = {
    TOKEN_HEADER,
    startDesktopApiProxy,
};
