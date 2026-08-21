import { createHash } from 'node:crypto';
import {
    buildMuapiUrl,
    getApiKeyFromRequest,
    sanitizeUpstreamHeaders,
    unauthorizedResponse,
} from './muapiProxy.js';
import { checkRateLimit } from './rateLimit.js';
import { getUploadMaxBytes, validateUploadedFile } from './uploadProxyTarget.js';

function json(body, status, headers = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
            ...headers,
        },
    });
}

function identifier(apiKey) {
    return `direct:${createHash('sha256').update(apiKey).digest('base64url')}`;
}

export async function handleDirectUploadProxy(request, { env = process.env } = {}) {
    const apiKey = getApiKeyFromRequest(request);
    if (!apiKey) return unauthorizedResponse();

    const limit = Math.min(Math.max(Number(env.UPLOAD_PROXY_RATE_LIMIT || 20), 1), 200);
    const rate = checkRateLimit(identifier(apiKey), { limit, windowMs: 60_000 });
    if (!rate.allowed) {
        return json({ error: 'Too many upload attempts' }, 429, {
            'retry-after': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))),
        });
    }

    const requestLength = Number(request.headers.get('content-length') || 0);
    if (requestLength > getUploadMaxBytes(env) + 1024 * 1024) return json({ error: 'Upload is too large' }, 413);

    let incoming;
    try {
        incoming = await request.formData();
    } catch {
        return json({ error: 'Invalid multipart upload' }, 400);
    }

    const files = incoming.getAll('file').filter((value) => value && typeof value.arrayBuffer === 'function');
    if (files.length !== 1) return json({ error: 'Exactly one file is required' }, 400);

    const file = files[0];
    const validation = await validateUploadedFile(file, { env });
    if (!validation.ok) {
        return json(
            { error: 'Upload rejected', reason: validation.reason },
            validation.reason === 'file_too_large' ? 413 : 400,
        );
    }

    const body = new FormData();
    body.append('file', file, file.name);
    const headers = sanitizeUpstreamHeaders(request, apiKey);
    headers.delete('content-type');

    try {
        const upstream = await fetch(buildMuapiUrl('api/v1', ['upload_file']), {
            method: 'POST',
            headers,
            body,
            redirect: 'manual',
            signal: AbortSignal.timeout(30_000),
        });
        const responseBody = await upstream.arrayBuffer();
        const responseHeaders = new Headers({ 'cache-control': 'no-store' });
        const contentType = upstream.headers.get('content-type');
        if (contentType) responseHeaders.set('content-type', contentType);
        return new Response(responseBody, { status: upstream.status, headers: responseHeaders });
    } catch (error) {
        const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
        return json({ error: timedOut ? 'Upload timed out' : 'Upload service unavailable' }, timedOut ? 504 : 502);
    }
}
