import { NextResponse } from 'next/server';

const DEFAULT_YUNWU_BASE_URL = 'https://yunwu.ai/v1';
const YUNWU_BASE_URL = (process.env.YUNWU_API_BASE_URL || DEFAULT_YUNWU_BASE_URL).replace(/\/+$/, '');
const YUNWU_UPSTREAM_TIMEOUT_MS = Number(process.env.YUNWU_API_TIMEOUT_MS || 180000);

function normalizeApiKey(value) {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed && trimmed !== 'null' && trimmed !== 'undefined' ? trimmed : null;
}

function getApiKey(request) {
    const auth = normalizeApiKey(request.headers.get('authorization'));
    if (auth?.toLowerCase().startsWith('bearer ')) {
        return normalizeApiKey(auth.slice(7));
    }

    const headerKey = normalizeApiKey(request.headers.get('x-api-key'));
    if (headerKey) return headerKey;

    return normalizeApiKey(request.cookies.get('yunwu_api_key')?.value) || normalizeApiKey(process.env.YUNWU_API_KEY);
}

function cleanHeaders(request, apiKey) {
    const headers = new Headers();
    const contentType = request.headers.get('content-type');
    const accept = request.headers.get('accept');

    if (contentType) headers.set('content-type', contentType);
    if (accept) headers.set('accept', accept);
    headers.set('authorization', `Bearer ${apiKey}`);
    return headers;
}

function jsonResponse(payload, status = 200) {
    return NextResponse.json(payload, { status });
}

function buildTargetUrl(pathSegments, search) {
    const path = (pathSegments || []).join('/');
    return path ? `${YUNWU_BASE_URL}/${path}${search}` : `${YUNWU_BASE_URL}${search}`;
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

async function buildImageEditFormData(request) {
    const payload = await request.json();
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
    const apiKey = getApiKey(request);
    if (!apiKey) {
        return jsonResponse({ error: '缺少 YunwuAPI Key。请先在设置中保存密钥。' }, 401);
    }

    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    const { search } = new URL(request.url);
    const targetUrl = buildTargetUrl(pathSegments, search);

    try {
        const headers = cleanHeaders(request, apiKey);
        const init = {
            method,
            headers,
            signal: AbortSignal.timeout(YUNWU_UPSTREAM_TIMEOUT_MS),
        };

        if (method !== 'GET' && method !== 'HEAD') {
            if (path === 'images/edits' && request.headers.get('content-type')?.includes('application/json')) {
                headers.delete('content-type');
                init.body = await buildImageEditFormData(request);
            } else {
                init.body = await request.arrayBuffer();
            }
        }

        const response = await fetch(targetUrl, init);
        return forwardResponse(response);
    } catch (error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            return jsonResponse({
                error: 'YunwuAPI 上游请求超时。建议稍后重试，或暂时切换到已验证可用的 Gpt Image 1.5 / Gpt Image 1。',
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
