import { createHash } from 'node:crypto';
import { getApiKeyFromRequest, unauthorizedResponse } from './muapiProxy.js';
import { checkRateLimit } from './rateLimit.js';
import {
    consumeUploadTicket,
    releaseUploadTicket,
    reserveUploadTicket,
    UPLOAD_TICKET_FIELD,
} from './uploadTicket.js';
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

function rateLimitKey(apiKey) {
    return createHash('sha256').update(apiKey).digest('base64url');
}

function rateLimitSettings(env) {
    const limit = Math.min(Math.max(Number(env.UPLOAD_PROXY_RATE_LIMIT || 20), 1), 200);
    const windowMs = Math.min(Math.max(Number(env.UPLOAD_PROXY_RATE_WINDOW_MS || 60_000), 1_000), 3_600_000);
    return { limit, windowMs };
}

export async function handleUploadProxy(request, {
    env = process.env,
    apiKeyOverride = null,
} = {}) {
    const apiKey = typeof apiKeyOverride === 'string' && apiKeyOverride.trim()
        ? apiKeyOverride.trim()
        : getApiKeyFromRequest(request);
    if (!apiKey) return unauthorizedResponse();

    const rate = checkRateLimit(rateLimitKey(apiKey), rateLimitSettings(env));
    if (!rate.allowed) {
        return json({ error: 'Too many upload attempts' }, 429, {
            'retry-after': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))),
        });
    }

    const requestLength = Number(request.headers.get('content-length') || 0);
    if (requestLength > getUploadMaxBytes(env) + 1024 * 1024) {
        return json({ error: 'Upload is too large' }, 413);
    }

    let formData;
    try {
        formData = await request.formData();
    } catch {
        return json({ error: 'Invalid multipart upload' }, 400);
    }

    const ticketValue = formData.get(UPLOAD_TICKET_FIELD);
    if (typeof ticketValue !== 'string') {
        return json({ error: 'Missing upload authorization ticket' }, 401);
    }

    const ticket = consumeUploadTicket(ticketValue, { apiKey, env });
    if (!ticket.ok) {
        return json({ error: 'Invalid or expired upload authorization ticket' }, 401);
    }

    const files = formData.getAll('file').filter((value) => value && typeof value.arrayBuffer === 'function');
    if (files.length !== 1) return json({ error: 'Exactly one file is required' }, 400);

    const file = files[0];
    const signedContentType = ticket.fields['Content-Type'] || ticket.fields['content-type'] || file.type;
    const validation = await validateUploadedFile(file, {
        signedFilename: ticket.fields.key,
        signedContentType,
        env,
    });
    if (!validation.ok) {
        const status = validation.reason === 'file_too_large' ? 413 : 400;
        return json({ error: 'Upload rejected', reason: validation.reason }, status);
    }

    if (!reserveUploadTicket(ticket.ticketId, ticket.expiresAt)) {
        return json({ error: 'Upload authorization ticket has already been used' }, 409);
    }

    const storageForm = new FormData();
    for (const [name, value] of Object.entries(ticket.fields)) storageForm.append(name, value);
    storageForm.append('file', file, file.name);

    try {
        const storageResponse = await fetch(ticket.targetUrl, {
            method: 'POST',
            body: storageForm,
            redirect: 'manual',
            signal: AbortSignal.timeout(30_000),
        });

        if (storageResponse.status >= 200 && storageResponse.status < 300) {
            return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
        }

        releaseUploadTicket(ticket.ticketId);
        console.error('Upload storage provider rejected request', { status: storageResponse.status });
        return json({ error: 'Storage provider rejected upload' }, 502);
    } catch (error) {
        releaseUploadTicket(ticket.ticketId);
        const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
        return json({ error: timedOut ? 'Storage upload timed out' : 'Storage service unavailable' }, timedOut ? 504 : 502);
    }
}
