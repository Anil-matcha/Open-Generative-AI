import { NextResponse } from 'next/server';

const HFSY_TEMP_IMAGE_BASE = 'http://www.hfsyapi.cn/public/temp_images';
const UPSTREAM_TIMEOUT_MS = Number(process.env.API_PROVIDER_TIMEOUT_MS || 300000);

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

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: '缺少图片文件。' }, { status: 400 });
        }

        if (!String(file.type || '').startsWith('image/')) {
            return NextResponse.json({ error: 'HFSY 临时图床仅用于图片上传。' }, { status: 400 });
        }

        const upstreamForm = new FormData();
        upstreamForm.append('file', file, file.name || 'image.png');

        const targetUrl = `${HFSY_TEMP_IMAGE_BASE}/upload?returnFormat=full&autoRetry=true`;
        const response = await fetch(targetUrl, {
            method: 'POST',
            body: upstreamForm,
            headers: {
                Accept: 'application/json,text/plain,*/*',
            },
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        });

        const text = await response.text();
        if (!response.ok) {
            return NextResponse.json(
                { error: `HFSY 图片上传失败：${response.status} ${response.statusText} - ${text.slice(0, 180)}` },
                { status: response.status },
            );
        }

        const contentType = response.headers.get('content-type') || '';
        if (/text\/html/i.test(contentType) || looksLikeHtml(text)) {
            return NextResponse.json(
                {
                    error:
                        'HFSY 图片上传入口返回了网页 HTML，未获得可用图片链接；请改用公网图片 URL 或配置可用图床/上传接口。',
                    upstreamContentType: contentType,
                    upstreamPreview: summarizeBody(text),
                },
                { status: 502 },
            );
        }

        const payload = parseUploadResponse(text);
        const url = extractUploadedUrl(HFSY_TEMP_IMAGE_BASE, payload);
        if (!url) {
            return NextResponse.json({ error: 'HFSY 图片上传成功但未返回可用图片链接。' }, { status: 502 });
        }

        return NextResponse.json({ url, file_url: url, data: payload });
    } catch (error) {
        return NextResponse.json({ error: error.message || '图片上传失败。' }, { status: 500 });
    }
}
