import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';
import { priceRub } from '../../_lib/pricing';

const MUAPI_BASE = 'https://api.muapi.ai';

const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET   = process.env.TOS_BUCKET   || '';
const TOS_REGION   = process.env.TOS_REGION   || 'cn-beijing';
const TOS_AK       = process.env.TOS_ACCESS_KEY || '';
const TOS_SK       = process.env.TOS_SECRET_KEY || '';
const TOS_ENABLED  = !!(TOS_ENDPOINT && TOS_BUCKET && TOS_AK && TOS_SK);

function hmac(key, data) { return createHmac('sha256', key).update(data).digest(); }

// Build a TOS POST-policy form upload (S3-style). The existing frontend does a
// multipart POST of { ...fields, file } to `url`, then builds the public URL.
// All uploads go into the ref/ folder.
function tosPostPolicy(filename) {
    const now = new Date();
    const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const date = iso.slice(0, 8);
    const datetime = iso;
    const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
    const ext = (filename.split('.').pop() || 'bin').toLowerCase();
    const key = `ref/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const credential = `${TOS_AK}/${date}/${TOS_REGION}/tos/request`;
    const expiration = new Date(now.getTime() + 3600 * 1000).toISOString();

    const policy = {
        expiration,
        conditions: [
            { bucket: TOS_BUCKET },
            { key },
            { 'x-tos-algorithm': 'TOS4-HMAC-SHA256' },
            { 'x-tos-credential': credential },
            { 'x-tos-date': datetime },
        ],
    };
    const policyB64 = Buffer.from(JSON.stringify(policy)).toString('base64');
    const sigKey = hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
    const signature = createHmac('sha256', sigKey).update(policyB64).digest('hex');

    return {
        url: `https://${host}`,
        fields: {
            key,
            'x-tos-algorithm': 'TOS4-HMAC-SHA256',
            'x-tos-credential': credential,
            'x-tos-date': datetime,
            policy: policyB64,
            'x-tos-signature': signature,
        },
    };
}

function getApiKey(request) {
    // Priority 1: Direct x-api-key header
    const headerKey = request.headers.get('x-api-key');
    if (headerKey) return headerKey;

    // Priority 2: muapi_key cookie (used by the fixed builder library)
    const cookieKey = request.cookies.get('muapi_key')?.value;
    return cookieKey;
}

function cleanHeaders(request) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('cookie'); // CRITICAL: Stop forwarding browser cookies to MuAPI to avoid auth conflicts
    return headers;
}

export async function GET(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    // Handle alias: get_upload_file -> get_file_upload_url
    const effectivePath = path === 'get_upload_file' ? 'get_file_upload_url' : path;

    // Serve uploads directly from TOS (ref/ folder) instead of proxying muapi.
    if (effectivePath === 'get_file_upload_url' && TOS_ENABLED) {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename') || 'upload.bin';
        return NextResponse.json(tosPostPolicy(filename));
    }

    const { search } = new URL(request.url);
    const targetUrl = `${MUAPI_BASE}/app/${effectivePath}${search}`;

    const headers = cleanHeaders(request);

    const apiKey = getApiKey(request);
    if (apiKey) headers.set('x-api-key', apiKey);

    try {
        const response = await fetch(targetUrl, {
            headers,
            method: 'GET',
        });

        const data = await response.json();

        // SPECIAL CASE: Intercept upload URL and redirect to local binary proxy
        if (effectivePath === 'get_file_upload_url' && data.url) {
            const originalS3Url = data.url;
            // We pass the real S3 URL as a header to our proxy
            data.url = `/api/upload-binary`;
            
            // Store target in a temporary way? 
            // Better: Return the target URL as an extra field that our proxy will look for
            data.fields = {
                ...data.fields,
                'x-proxy-target-url': originalS3Url
            };
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

    // Real generation cost in rubles (model price × CNY→RUB × markup).
    if (path === 'calculate_dynamic_cost') {
        let cb = {};
        try { cb = await request.json(); } catch {}
        // priceRub auto-detects video/audio/image from the model id.
        const cost = priceRub(undefined, cb?.task_name || '', cb?.payload || {});
        return NextResponse.json({ cost, currency: 'RUB' });
    }

    const { search } = new URL(request.url);
    const targetUrl = `${MUAPI_BASE}/app/${path}${search}`;

    const headers = cleanHeaders(request);

    const apiKey = getApiKey(request);
    if (apiKey) headers.set('x-api-key', apiKey);

    try {
        const body = await request.arrayBuffer();
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body
        });

        const data = await response.json();
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
    const targetUrl = `${MUAPI_BASE}/app/${path}${search}`;

    const headers = cleanHeaders(request);

    const apiKey = getApiKey(request);
    if (apiKey) headers.set('x-api-key', apiKey);

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
    const targetUrl = `${MUAPI_BASE}/app/${path}${search}`;

    const headers = cleanHeaders(request);

    const apiKey = getApiKey(request);
    if (apiKey) headers.set('x-api-key', apiKey);

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
