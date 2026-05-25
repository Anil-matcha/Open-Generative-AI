import { NextResponse } from 'next/server';

const DEFAULT_BASE_URL = 'https://www.hfsyapi.cn/v1';
const ARK_DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const PROVIDER_UPSTREAM_TIMEOUT_MS = Number(process.env.API_PROVIDER_TIMEOUT_MS || 300000);

function normalizeValue(value) {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed && trimmed !== 'null' && trimmed !== 'undefined' ? trimmed : null;
}

function normalizeProviderId(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeBaseUrl(value, providerId = '') {
    const raw =
        normalizeValue(value) ||
        (providerId === 'seedance-ark' ? process.env.SEEDANCE_BASE_URL || ARK_DEFAULT_BASE_URL : null) ||
        process.env.API_PROVIDER_BASE_URL ||
        DEFAULT_BASE_URL;
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('API 地址只支持 http 或 https。');
    }
    return raw.replace(/\/+$/, '');
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

    const id = raw.toLowerCase();
    const aliases = new Set([id]);
    const compact = id.replace(/_/g, '-');
    aliases.add(compact);
    aliases.add(compact.replace(/-(text-to-image|image-to-image|text-to-video|image-to-video|async-generations|generations|edits)$/g, ''));
    aliases.add(compact.replace(/-edit$/g, ''));

    if (compact.includes('gpt-image-2-all')) aliases.add('gpt-image-2-all');
    if (compact.includes('gpt-image-2pro')) aliases.add('gpt-image-2pro');
    if (compact.includes('gpt-image-2')) aliases.add('gpt-image-2');
    if (compact.includes('gemini-3.1-flash-image-preview')) aliases.add('gemini-3.1-flash-image-preview');
    if (compact.includes('gemini-3-pro-image-preview')) aliases.add('gemini-3-pro-image-preview');
    if (compact.includes('sd-2-vip')) aliases.add('sd-2-vip');
    if (compact.includes('sd-2')) aliases.add('sd-2');
    if (compact.includes('kling-v3')) aliases.add('kling-v3');
    if (compact.includes('sora-2')) aliases.add('sora-2');

    return Array.from(aliases).filter(Boolean);
}

function getModelKey(modelIds = []) {
    const modelKeyMap = getModelKeyMap();
    const lowerMap = Object.fromEntries(
        Object.entries(modelKeyMap).map(([modelId, key]) => [String(modelId).toLowerCase(), normalizeValue(String(key || ''))]),
    );

    for (const modelId of modelIds) {
        for (const alias of getModelAliases(modelId)) {
            if (lowerMap[alias]) return lowerMap[alias];
        }
    }

    return null;
}

function getPayloadModelIds(pathSegments, payload) {
    const ids = [];
    const pathModel = Array.isArray(pathSegments) ? pathSegments[pathSegments.length - 1] : '';
    if (pathModel) ids.push(pathModel);
    if (payload?.model) ids.push(payload.model);
    if (Array.isArray(payload?.models)) ids.push(...payload.models);
    return ids;
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

function getApiKey(request, modelIds = [], { providerId = '', baseUrl = '' } = {}) {
    const auth = normalizeValue(request.headers.get('authorization'));
    if (auth?.toLowerCase().startsWith('bearer ')) {
        return normalizeValue(auth.slice(7));
    }

    const headerKey = normalizeValue(request.headers.get('x-api-key'));
    if (headerKey) return headerKey;

    const arkKey = normalizeValue(process.env.ARK_API_KEY);
    if (isSeedanceArkProvider(providerId, baseUrl) && arkKey) return arkKey;

    return (
        getModelKey(modelIds) ||
        normalizeValue(request.cookies.get('provider_api_key')?.value) ||
        normalizeValue(request.cookies.get('yunwu_api_key')?.value) ||
        normalizeValue(process.env.API_PROVIDER_KEY) ||
        normalizeValue(process.env.HFSY_API_KEY) ||
        normalizeValue(process.env.YUNWU_API_KEY)
    );
}

function cleanHeaders(request, apiKey) {
    const headers = new Headers();
    const contentType = request.headers.get('content-type');
    const accept = request.headers.get('accept');

    if (contentType) headers.set('content-type', contentType);
    if (accept) headers.set('accept', accept);
    if (apiKey) headers.set('authorization', `Bearer ${apiKey}`);
    return headers;
}

function jsonResponse(payload, status = 200) {
    return NextResponse.json(payload, { status });
}

function buildTargetUrl(baseUrl, pathSegments, search) {
    const path = (pathSegments || []).join('/');
    return path ? `${baseUrl}/${path}${search}` : `${baseUrl}${search}`;
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

    return new Blob([buffer], { type: detectedMime || normalizedMime || 'image/png' });
}

function dataUrlToBlob(dataUrl, label = '参考图') {
    const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
    if (!match) throw new Error(`${label} 不是有效 data URL。`);

    const mimeType = match[1] || 'application/octet-stream';
    const isBase64 = Boolean(match[2]);
    const encoded = isBase64 ? match[3].replace(/\s+/g, '') : match[3];
    const raw = isBase64
        ? Buffer.from(encoded, 'base64')
        : Buffer.from(decodeURIComponent(encoded), 'utf8');

    return blobFromImageBuffer(raw, mimeType, label);
}

async function imageSourceToBlob(source, label = '参考图') {
    if (typeof source !== 'string' || !source.trim()) return null;
    const trimmed = source.trim();

    if (trimmed.startsWith('data:')) return dataUrlToBlob(trimmed, label);

    if (/^https?:\/\//i.test(trimmed)) {
        const response = await fetch(trimmed, {
            headers: { accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.8' },
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

    const passthroughFields = [
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
    ];

    passthroughFields.forEach((field) => {
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

function parseJsonBody(bodyBuffer) {
    if (!bodyBuffer?.byteLength) return null;
    try {
        return JSON.parse(Buffer.from(bodyBuffer).toString('utf8'));
    } catch {
        return null;
    }
}

async function forwardResponse(response) {
    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        try {
            return jsonResponse(JSON.parse(text), response.status);
        } catch {
            return new NextResponse(text, {
                status: response.status,
                headers: { 'content-type': contentType },
            });
        }
    }

    return new NextResponse(text, {
        status: response.status,
        headers: { 'content-type': contentType || 'text/plain; charset=utf-8' },
    });
}

async function handle(request, params, method) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    const { search } = new URL(request.url);

    try {
        const providerId = normalizeProviderId(request.headers.get('x-provider-id'));
        const baseUrl = normalizeBaseUrl(request.headers.get('x-provider-base-url'), providerId);
        let bodyBuffer = null;
        let jsonPayload = null;

        if (method !== 'GET' && method !== 'HEAD') {
            bodyBuffer = await request.arrayBuffer();
            if (request.headers.get('content-type')?.includes('application/json')) {
                jsonPayload = parseJsonBody(bodyBuffer);
            }
        }

        const apiKey = getApiKey(request, getPayloadModelIds(pathSegments, jsonPayload), { providerId, baseUrl });
        if (!apiKey) {
            return jsonResponse({
                error: '缺少 API Key。请在 API 管理页保存通道密钥，或在 .env.local 配置 HFSY_MODEL_KEYS_JSON / API_PROVIDER_KEY。',
            }, 401);
        }
        const headers = cleanHeaders(request, apiKey);
        const arkImageRequest = method === 'POST' && shouldUseArkImageAdapter(providerId, baseUrl, path, jsonPayload);
        const targetUrl = buildTargetUrl(baseUrl, pathSegments, search);
        const init = {
            method,
            headers,
            signal: AbortSignal.timeout(PROVIDER_UPSTREAM_TIMEOUT_MS),
        };

        if (method !== 'GET' && method !== 'HEAD') {
            if (arkImageRequest) {
                headers.set('content-type', 'application/json');
                init.body = buildArkImageBody(jsonPayload || {});
            } else if (path === 'images/edits' && request.headers.get('content-type')?.includes('application/json')) {
                headers.delete('content-type');
                init.body = await buildImageEditFormData(jsonPayload || {});
            } else {
                init.body = bodyBuffer;
            }
        }

        const response = await fetch(targetUrl, init);
        if (arkImageRequest) {
            const text = await response.text();
            let data = null;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                data = { raw: text };
            }
            return jsonResponse(
                normalizeArkImageResponse(data, { model: resolveArkImageModel(jsonPayload || {}) }),
                response.status,
            );
        }

        return forwardResponse(response);
    } catch (error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            return jsonResponse({
                error: 'API 上游请求超时。可以稍后再试，或切换到已验证可用的通道。',
            }, 504);
        }

        return jsonResponse({
            error: error.message,
            cause: error.cause?.message || null,
        }, 500);
    }
}

export async function GET(request, { params }) {
    return handle(request, params, 'GET');
}

export async function POST(request, { params }) {
    return handle(request, params, 'POST');
}

export async function DELETE(request, { params }) {
    return handle(request, params, 'DELETE');
}

export async function PUT(request, { params }) {
    return handle(request, params, 'PUT');
}
