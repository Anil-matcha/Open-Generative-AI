import {
    buildProviderRequestHeaders,
    getActiveProvider,
    getProviderProxyBase,
    normalizeApiConfig,
    normalizeApiKey,
} from './apiProviders.js';

export const YUNWU_PROXY_PATHS = Object.freeze({
    v1: '/api/yunwu/v1',
});

const IMAGE_REQUEST_TIMEOUT_MS = 300000;
const GPT_IMAGE_2_PRIMARY_MODEL = 'gpt-image-2-all';
const GPT_IMAGE_2_BACKUP_MODEL = 'gpt-image-2';

function buildApiConfig(apiConfigOrKey) {
    if (typeof apiConfigOrKey === 'string' || !apiConfigOrKey) {
        return normalizeApiConfig(null, normalizeApiKey(apiConfigOrKey));
    }
    return normalizeApiConfig(apiConfigOrKey);
}

const aspectSizeMap = {
    auto: 'auto',
    '1:1': '1024x1024',
    '4:3': '1536x1024',
    '3:2': '1536x1024',
    '16:9': '1536x1024',
    '3:4': '1024x1536',
    '2:3': '1024x1536',
    '9:16': '1024x1536',
};

const seedreamLiteSizeMap = {
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

function isSeedreamLiteModel(modelId) {
    return /seedream[-_. ]?5(?:\.|-)?0[-_. ]?lite/i.test(String(modelId || ''));
}

function isGeminiImageModel(modelId) {
    return /^gemini-3(?:\.1|-pro).*image-preview$/i.test(String(modelId || ''));
}

function normalizeModelId(modelId) {
    return String(modelId || '').trim().replace(/-edit$/, '').toLowerCase();
}

function isGptImage2PrimaryModel(modelId) {
    return normalizeModelId(modelId) === GPT_IMAGE_2_PRIMARY_MODEL;
}

function isGptImage2BackupModel(modelId) {
    return normalizeModelId(modelId) === GPT_IMAGE_2_BACKUP_MODEL;
}

function isGptImage2FamilyModel(modelId) {
    return isGptImage2PrimaryModel(modelId) || isGptImage2BackupModel(modelId);
}

function getImageSize(aspectRatio) {
    return aspectSizeMap[aspectRatio] || '1024x1024';
}

function getSeedreamLiteSize(aspectRatio, qualityValue) {
    const tier = String(qualityValue || '2K').toUpperCase() === '3K' ? '3K' : '2K';
    return seedreamLiteSizeMap[tier]?.[aspectRatio] || seedreamLiteSizeMap[tier]['1:1'];
}

function getImageQuality(value) {
    if (!value) return undefined;
    const normalized = String(value).toLowerCase();
    if (['auto', 'low', 'medium', 'high'].includes(normalized)) return normalized;
    if (normalized === '1k') return 'low';
    if (normalized === '2k') return 'medium';
    if (normalized === '4k') return 'high';
    return undefined;
}

function getYunwuImageModel(modelId) {
    const normalized = normalizeModelId(modelId || GPT_IMAGE_2_BACKUP_MODEL);
    return isGptImage2BackupModel(normalized) ? GPT_IMAGE_2_PRIMARY_MODEL : normalized;
}

function normalizeB64Image(value, mimeType = 'image/png') {
    if (!value) return '';
    const text = String(value).trim();
    if (!text) return '';
    if (text.startsWith('data:image/')) return text;
    return `data:${mimeType};base64,${text}`;
}

function isLikelyImageBase64(value) {
    const text = String(value || '').replace(/\s+/g, '');
    return text.length > 200 && /^[A-Za-z0-9+/=]+$/.test(text);
}

function extractUrlFromText(value) {
    if (typeof value !== 'string') return '';
    const text = value.trim();
    if (!text) return '';
    if (text.startsWith('data:image/')) return text;

    const markdownImage = text.match(/!\[[^\]]*]\(([^)\s]+)\)/i);
    if (markdownImage?.[1]) return markdownImage[1];

    const imageUrl = text.match(/https?:\/\/[^\s"'<>)]*(?:png|jpe?g|webp|gif|bmp|avif|heic|heif)(?:\?[^\s"'<>)]*)?/i);
    if (imageUrl?.[0]) return imageUrl[0];

    const dataUrl = text.match(/data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]+/i);
    return dataUrl?.[0]?.replace(/\s+/g, '') || '';
}

function extractImageCandidate(value, seen = new Set()) {
    if (!value) return '';
    if (typeof value === 'string') return extractUrlFromText(value);
    if (typeof value !== 'object') return '';
    if (seen.has(value)) return '';
    seen.add(value);

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = extractImageCandidate(item, seen);
            if (found) return found;
        }
        return '';
    }

    const directUrlKeys = [
        'url',
        'image_url',
        'imageUrl',
        'result_url',
        'resultUrl',
        'output_url',
        'outputUrl',
        'output_image_url',
        'outputImageUrl',
        'generated_image_url',
        'generatedImageUrl',
        'result',
    ];

    for (const key of directUrlKeys) {
        const candidate = value[key];
        if (typeof candidate === 'string') {
            const found = extractUrlFromText(candidate) || (/^https?:\/\//i.test(candidate) ? candidate : '');
            if (found) return found;
        } else if (candidate && typeof candidate === 'object') {
            const found = extractImageCandidate(candidate, seen);
            if (found) return found;
        }
    }

    const b64 =
        value.b64_json ||
        value.b64Json ||
        value.base64 ||
        value.base64_image ||
        value.image_base64 ||
        (isLikelyImageBase64(value.result) ? value.result : '') ||
        value.inlineData?.data ||
        value.inline_data?.data;
    if (b64) {
        const mime =
            value.mime_type ||
            value.mimeType ||
            value.inlineData?.mimeType ||
            value.inlineData?.mime_type ||
            value.inline_data?.mime_type ||
            'image/png';
        return normalizeB64Image(b64, mime);
    }

    const priorityKeys = [
        'data',
        'output',
        'outputs',
        'result',
        'results',
        'image',
        'images',
        'content',
        'message',
        'choices',
        'candidates',
        'parts',
        'tool_calls',
        'annotations',
    ];
    for (const key of priorityKeys) {
        const found = extractImageCandidate(value[key], seen);
        if (found) return found;
    }

    for (const item of Object.values(value)) {
        const found = extractImageCandidate(item, seen);
        if (found) return found;
    }

    return '';
}

function buildGeminiPrompt(prompt, aspectRatio) {
    const text = String(prompt || '').trim() || 'Generate an image.';
    if (!aspectRatio || aspectRatio === 'auto') return text;
    return `${text}\n\nOutput image aspect ratio: ${aspectRatio}.`;
}

function buildGeminiImageMessages({ prompt, aspectRatio, imageUrls = [] } = {}) {
    return [
        {
            role: 'user',
            content: [
                { type: 'text', text: buildGeminiPrompt(prompt, aspectRatio) },
                ...imageUrls.filter(Boolean).map((url) => ({
                    type: 'image_url',
                    image_url: { url },
                })),
            ],
        },
    ];
}

async function parseImageResponse(response, providerName = 'API') {
    const text = await response.text();
    let data;

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { error: text };
    }

    if (!response.ok) {
        const message = data?.error?.message || data?.error || data?.detail || text || response.statusText;
        const normalizedMessage = String(message);
        if (response.status === 429 || normalizedMessage.includes('负载已饱和') || normalizedMessage.includes('Too Many Requests')) {
            throw new Error(`${providerName} 上游分组负载饱和，建议稍后重试，或切换到 API 检查页标记为可用的模型。`);
        }
        throw new Error(`${providerName} 请求失败：${response.status} ${response.statusText} - ${normalizedMessage.slice(0, 160)}`);
    }

    const item =
        data?.data?.[0] ||
        data?.output?.[0] ||
        data?.outputs?.[0] ||
        data?.choices?.[0]?.message ||
        data?.candidates?.[0]?.content ||
        data;
    const url = extractImageCandidate(item) || extractImageCandidate(data);
    const b64 = item?.b64_json || data?.b64_json;

    if (url) return { ...data, id: data.id || data.task_id || item.id, url };
    if (b64) return { ...data, id: data.id || data.task_id || item.id, url: `data:image/png;base64,${b64}` };

    throw new Error(`${providerName} 返回中未找到图片 URL 或 b64_json。`);
}

async function postJson(apiConfigOrKey, path, payload, { timeoutMs = IMAGE_REQUEST_TIMEOUT_MS } = {}) {
    const apiConfig = buildApiConfig(apiConfigOrKey);
    const provider = getActiveProvider(apiConfig);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(`${getProviderProxyBase()}/${path}`, {
            method: 'POST',
            headers: buildProviderRequestHeaders(apiConfig, { json: true }),
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error(`${provider.name} 请求超时：上游长时间未返回。建议先在 API 检查页跑低成本模型探测，再回到图像创作页。`);
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function shouldFallbackGptImage2Family(response) {
    if (!response || response.ok) return false;
    if (response.status === 429) return true;

    const text = await response.clone().text().catch(() => '');
    return text.includes('负载已饱和') || text.includes('Too Many Requests');
}

async function postImageJson(apiConfig, path, payload) {
    const response = await postJson(apiConfig, path, payload);
    if (!isGptImage2FamilyModel(payload?.model) || !(await shouldFallbackGptImage2Family(response))) {
        return response;
    }

    const fallbackModel = isGptImage2PrimaryModel(payload?.model) ? GPT_IMAGE_2_BACKUP_MODEL : GPT_IMAGE_2_PRIMARY_MODEL;
    return postJson(apiConfig, path, {
        ...payload,
        model: fallbackModel,
    });
}

export async function generateImage(apiConfigOrKey, params) {
    const apiConfig = buildApiConfig(apiConfigOrKey);
    const provider = getActiveProvider(apiConfig);
    const model = getYunwuImageModel(params.model);
    const rawQuality = params.quality || params.resolution;
    const seedreamLite = isSeedreamLiteModel(model);
    const geminiImage = isGeminiImageModel(model);
    const quality = seedreamLite ? undefined : getImageQuality(rawQuality);
    const payload = geminiImage
        ? {
            model,
            messages: buildGeminiImageMessages({
                prompt: params.prompt,
                aspectRatio: params.aspect_ratio,
            }),
            stream: false,
        }
        : seedreamLite
        ? {
            model,
            prompt: params.prompt,
            n: 1,
            size: getSeedreamLiteSize(params.aspect_ratio, rawQuality),
            response_format: 'url',
            output_format: 'jpeg',
            sequential_image_generation: 'disabled',
            stream: false,
            watermark: false,
        }
        : {
            model,
            prompt: params.prompt,
            n: 1,
            size: getImageSize(params.aspect_ratio),
        };

    if (quality) payload.quality = quality;

    const response = await postImageJson(apiConfig, geminiImage ? 'chat/completions' : 'images/generations', payload);
    return parseImageResponse(response, provider.name);
}

export async function generateI2I(apiConfigOrKey, params) {
    const apiConfig = buildApiConfig(apiConfigOrKey);
    const provider = getActiveProvider(apiConfig);
    const model = getYunwuImageModel(params.model);
    const imageUrls = params.images_list?.length ? params.images_list : [params.image_url].filter(Boolean);
    if (isSeedreamLiteModel(model)) {
        const referenceImages = imageUrls.filter(Boolean).slice(0, 1);
        const rawQuality = params.quality || params.resolution;
        const payload = {
            model,
            prompt: params.prompt || 'Edit the reference image according to the user request.',
            images: referenceImages,
            image: referenceImages[0],
            image_url: referenceImages[0],
            n: 1,
            size: getSeedreamLiteSize(params.aspect_ratio, rawQuality),
            response_format: 'url',
            output_format: 'jpeg',
            sequential_image_generation: 'disabled',
            stream: false,
            watermark: false,
        };
        const response = await postImageJson(apiConfig, 'images/generations', payload);
        return parseImageResponse(response, provider.name);
    }

    if (isGeminiImageModel(model)) {
        const payload = {
            model,
            messages: buildGeminiImageMessages({
                prompt: params.prompt || 'Edit the reference image according to the user request.',
                aspectRatio: params.aspect_ratio,
                imageUrls,
            }),
            stream: false,
        };
        const response = await postImageJson(apiConfig, 'chat/completions', payload);
        return parseImageResponse(response, provider.name);
    }

    const quality = getImageQuality(params.quality || params.resolution);
    const payload = {
        model,
        prompt: params.prompt || 'Edit the reference image according to the user request.',
        images: imageUrls,
        image: imageUrls.length === 1 ? imageUrls[0] : imageUrls,
        image_url: imageUrls[0],
        n: 1,
        size: getImageSize(params.aspect_ratio),
    };

    if (quality) payload.quality = quality;

    const response = await postImageJson(apiConfig, 'images/edits', payload);
    return parseImageResponse(response, provider.name);
}

export function uploadFile(_apiKey, file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (event) => {
            if (event.lengthComputable && typeof onProgress === 'function') {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };
        reader.onload = () => {
            if (typeof onProgress === 'function') onProgress(100);
            resolve(reader.result);
        };
        reader.onerror = () => reject(new Error('本地图片读取失败。'));
        reader.readAsDataURL(file);
    });
}

export async function createChatCompletion(apiConfigOrKey, { model = 'gpt-5.5', messages, temperature, max_tokens } = {}) {
    const apiConfig = buildApiConfig(apiConfigOrKey);
    const provider = getActiveProvider(apiConfig);
    const payload = { model, messages };
    if (temperature !== undefined) payload.temperature = temperature;
    if (max_tokens !== undefined) payload.max_tokens = max_tokens;

    const response = await postJson(apiConfig, 'chat/completions', payload);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = data?.error?.message || data?.error || data?.detail || response.statusText;
        throw new Error(`${provider.name} 对话请求失败：${response.status} ${response.statusText} - ${String(message).slice(0, 160)}`);
    }

    return data;
}

export async function analyzeImages(apiConfigOrKey, { model = 'gpt-5.5', prompt, imageUrls = [] } = {}) {
    const content = [
        { type: 'text', text: prompt || '请用中文分析这些图片，输出结构化报告。' },
        ...imageUrls.map((url) => ({
            type: 'image_url',
            image_url: { url },
        })),
    ];

    return createChatCompletion(apiConfigOrKey, {
        model,
        messages: [{ role: 'user', content }],
    });
}
