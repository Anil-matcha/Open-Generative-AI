import { evaluateRequestSafety } from './contentSafety.js';

const MUAPI_BASE = 'https://api.muapi.ai';
const REQUEST_HEADER_BLOCKLIST = new Set([
    'authorization',
    'connection',
    'content-length',
    'cookie',
    'forwarded',
    'host',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'x-api-key',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-port',
    'x-forwarded-proto',
]);

const RESPONSE_HEADER_ALLOWLIST = new Set([
    'cache-control',
    'content-disposition',
    'content-language',
    'content-type',
    'etag',
    'expires',
    'last-modified',
    'retry-after',
]);

function json(body, status, extraHeaders = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
            ...extraHeaders,
        },
    });
}

function normalizeKey(value) {
    if (typeof value !== 'string') return null;
    const key = value.trim();
    if (key.length < 8 || key.length > 4096 || /[\r\n]/.test(key)) return null;
    return key;
}

export function getApiKeyFromRequest(request) {
    if (!request?.headers) return null;

    const headerKey = normalizeKey(request.headers.get('x-api-key'));
    if (headerKey) return headerKey;

    const authorization = request.headers.get('authorization');
    const match = typeof authorization === 'string'
        ? authorization.match(/^Bearer\s+(.+)$/i)
        : null;
    return normalizeKey(match?.[1]);
}

export function unauthorizedResponse() {
    return json({ error: 'Unauthorized: a valid API key header is required' }, 401);
}

export function sanitizeUpstreamHeaders(request, apiKey) {
    const headers = new Headers();
    for (const [name, value] of request.headers.entries()) {
        const lowerName = name.toLowerCase();
        const isInfrastructureHeader = lowerName.startsWith('cf-') ||
            lowerName.startsWith('sec-') ||
            lowerName.startsWith('x-amzn-') ||
            lowerName.startsWith('x-vercel-');
        if (!REQUEST_HEADER_BLOCKLIST.has(lowerName) && !isInfrastructureHeader) headers.set(name, value);
    }
    headers.set('x-api-key', apiKey);
    return headers;
}

export function buildMuapiUrl(prefix, pathSegments = [], search = '') {
    const safePrefix = String(prefix || '')
        .split('/')
        .filter(Boolean)
        .map(encodeURIComponent)
        .join('/');

    const safePath = pathSegments.map((segment) => {
        const value = String(segment);
        if (!value || value === '.' || value === '..' || value.includes('/') || value.includes('\\')) {
            throw new Error('Invalid proxy path');
        }
        return encodeURIComponent(value);
    }).join('/');

    const pathname = safePath ? `${safePrefix}/${safePath}` : safePrefix;
    return `${MUAPI_BASE}/${pathname}${search}`;
}

function responseHeaders(upstreamHeaders, audited) {
    const headers = new Headers();
    for (const [name, value] of upstreamHeaders.entries()) {
        if (RESPONSE_HEADER_ALLOWLIST.has(name.toLowerCase())) headers.set(name, value);
    }
    headers.set('cache-control', headers.get('cache-control') || 'no-store');
    if (audited) headers.set('x-content-safety', 'audit');
    return headers;
}

function maxRequestBytes(env) {
    const parsed = Number(env.MUAPI_PROXY_MAX_BODY_BYTES || 50 * 1024 * 1024);
    return Number.isFinite(parsed) && parsed > 0
        ? Math.min(parsed, 100 * 1024 * 1024)
        : 50 * 1024 * 1024;
}

export async function fetchMuapi(request, {
    prefix,
    pathSegments = [],
    method = request.method,
    requireApiKey = true,
    env = process.env,
} = {}) {
    const apiKey = getApiKeyFromRequest(request);
    if (requireApiKey && !apiKey) return { response: unauthorizedResponse() };

    let targetUrl;
    try {
        targetUrl = buildMuapiUrl(prefix, pathSegments, new URL(request.url).search);
    } catch {
        return { response: json({ error: 'Invalid proxy path' }, 400) };
    }

    const upperMethod = String(method).toUpperCase();
    let body;
    let safety = { allowed: true };
    if (!['GET', 'HEAD'].includes(upperMethod)) {
        const declaredLength = Number(request.headers.get('content-length') || 0);
        if (declaredLength > maxRequestBytes(env)) {
            return { response: json({ error: 'Request body is too large' }, 413) };
        }

        body = await request.arrayBuffer();
        if (body.byteLength > maxRequestBytes(env)) {
            return { response: json({ error: 'Request body is too large' }, 413) };
        }

        safety = evaluateRequestSafety(request.headers.get('content-type'), body, { env });
        if (!safety.allowed) {
            return {
                response: json({ error: 'Request blocked by content safety policy', reason: safety.reason }, 422),
            };
        }
    }

    try {
        const upstream = await fetch(targetUrl, {
            method: upperMethod,
            headers: sanitizeUpstreamHeaders(request, apiKey),
            body,
            redirect: 'manual',
            signal: AbortSignal.timeout(60_000),
        });

        const responseBody = await upstream.arrayBuffer();
        return {
            apiKey,
            upstream,
            body: responseBody,
            safety,
            response: new Response(responseBody, {
                status: upstream.status,
                headers: responseHeaders(upstream.headers, safety.audited),
            }),
        };
    } catch (error) {
        const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
        return {
            response: json(
                { error: timedOut ? 'Upstream request timed out' : 'Upstream service unavailable' },
                timedOut ? 504 : 502,
            ),
        };
    }
}

export async function proxyMuapi(request, options) {
    const result = await fetchMuapi(request, options);
    return result.response;
}
