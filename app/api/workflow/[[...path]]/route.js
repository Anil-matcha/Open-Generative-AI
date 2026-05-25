import { NextResponse } from 'next/server';

const MUAPI_BASE = 'https://api.muapi.ai';
const PROVIDER_BASE_URL_COOKIE = 'provider_base_url';

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

function getProviderBaseInfo(request) {
    const headerBaseUrl = normalizeBaseUrl(request.headers.get('x-provider-base-url'));
    const cookieBaseUrl = normalizeBaseUrl(request.cookies.get(PROVIDER_BASE_URL_COOKIE)?.value);
    const baseUrl = headerBaseUrl || cookieBaseUrl || MUAPI_BASE;
    return {
        baseUrl,
        usesProviderBase: Boolean(headerBaseUrl || cookieBaseUrl),
    };
}

function getApiKey(request) {
    // Priority 1: Direct x-api-key header
    const headerKey = normalizeApiKey(request.headers.get('x-api-key'));
    if (headerKey) return headerKey;

    // Priority 2: unified Provider cookie, then legacy muapi_key
    return (
        normalizeApiKey(request.cookies.get('provider_api_key')?.value) ||
        normalizeApiKey(request.cookies.get('yunwu_api_key')?.value) ||
        normalizeApiKey(request.cookies.get('muapi_key')?.value)
    );
}

function cleanHeaders(request, apiKey, usesProviderBase) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('cookie'); // Stop forwarding browser cookies to upstream APIs.
    headers.delete('x-provider-base-url');
    headers.delete('x-provider-id');
    if (apiKey) {
        headers.set('x-api-key', apiKey);
        if (usesProviderBase) headers.set('authorization', `Bearer ${apiKey}`);
    }
    return headers;
}

function buildTargetUrl(baseUrl, path, search) {
    return `${baseUrl}/workflow/${path}${search}`;
}

export async function GET(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const providerBase = getProviderBaseInfo(request);
    const targetUrl = buildTargetUrl(providerBase.baseUrl, path, search);

    const apiKey = getApiKey(request);
    const headers = cleanHeaders(request, apiKey, providerBase.usesProviderBase);
    console.log(`[proxy GET] ${targetUrl} | apiKey: ${apiKey ? apiKey.slice(0,8)+'...' : 'MISSING'}`);

    try {
        const response = await fetch(targetUrl, {
            headers,
            method: 'GET',
        });
        const data = await response.json();
        if (path.includes('get-workflow-def')) {
            console.log(`[proxy GET] get-workflow-def response: is_owner=${data?.is_owner}, workflow_id=${data?.workflow_id}`);
        }
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
    const targetUrl = buildTargetUrl(providerBase.baseUrl, path, search);

    const apiKey = getApiKey(request);
    const headers = cleanHeaders(request, apiKey, providerBase.usesProviderBase);
    console.log(`[proxy POST] ${targetUrl} | apiKey: ${apiKey ? apiKey.slice(0,8)+'...' : 'MISSING'} | provider: ${request.headers.get('x-provider-id') || 'legacy'} | header: ${request.headers.get('x-api-key')?.slice(0,8) || 'NONE'}`);

    try {
        const body = await request.arrayBuffer();
        // Decode body to see what workflow_id is being sent
        try {
            const parsed = JSON.parse(Buffer.from(body).toString('utf-8'));
            console.log(`[proxy POST] body: workflow_id=${parsed.workflow_id}, source_workflow_id=${parsed.source_workflow_id}, name=${parsed.name}`);
        } catch(e) { /* ignore decode errors */ }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body
        });
        const data = await response.json();
        console.log(`[proxy POST] response: status=${response.status}`, JSON.stringify(data).slice(0, 200));
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const providerBase = getProviderBaseInfo(request);
    const targetUrl = buildTargetUrl(providerBase.baseUrl, path, search);

    const apiKey = getApiKey(request);
    const headers = cleanHeaders(request, apiKey, providerBase.usesProviderBase);

    try {
        const response = await fetch(targetUrl, {
            method: 'DELETE',
            headers
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const providerBase = getProviderBaseInfo(request);
    const targetUrl = buildTargetUrl(providerBase.baseUrl, path, search);

    const apiKey = getApiKey(request);
    const headers = cleanHeaders(request, apiKey, providerBase.usesProviderBase);

    try {
        const body = await request.arrayBuffer();
        const response = await fetch(targetUrl, {
            method: 'PUT',
            headers,
            body
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
