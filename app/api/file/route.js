import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';

const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET   = process.env.TOS_BUCKET   || '';
const TOS_REGION   = process.env.TOS_REGION   || 'cn-beijing';
const TOS_AK       = process.env.TOS_ACCESS_KEY || '';
const TOS_SK       = process.env.TOS_SECRET_KEY || '';
const TOS_ENABLED  = !!(TOS_ENDPOINT && TOS_BUCKET && TOS_AK && TOS_SK);

function sha256hex(data) { return createHash('sha256').update(data).digest('hex'); }
function hmac(key, data)  { return createHmac('sha256', key).update(data).digest(); }

const EMPTY_HASH = sha256hex(''); // sha256 of empty body for GET requests

// Signed GET to TOS (TOS4-HMAC-SHA256), mirroring the working PUT signer.
// The bucket is private, so anonymous reads are 403 — we sign server-side.
async function signedGet(key) {
    const now = new Date();
    const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const date = iso.slice(0, 8);
    const datetime = iso;
    const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
    const path = `/${key}`;
    const payloadHash = EMPTY_HASH;

    const canonHeaders = `host:${host}\nx-tos-content-sha256:${payloadHash}\nx-tos-date:${datetime}\n`;
    const signedHeaders = 'host;x-tos-content-sha256;x-tos-date';
    const canonical = `GET\n${path}\n\n${canonHeaders}\n${signedHeaders}\n${payloadHash}`;

    const scope = `${date}/${TOS_REGION}/tos/request`;
    const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;
    const sigKey = hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
    const sig = createHmac('sha256', sigKey).update(strToSign).digest('hex');
    const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;

    return fetch(`https://${host}${path}`, {
        headers: {
            'Authorization': auth,
            'X-Tos-Content-Sha256': payloadHash,
            'X-Tos-Date': datetime,
        },
    });
}

// GET /api/file?key=images/123_abc.png
// Streams a private TOS object back to the browser through a same-origin URL,
// so generated images display without making the bucket public.
export async function GET(request) {
    if (!TOS_ENABLED) {
        return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    // Only allow our own folders; block path traversal / arbitrary keys.
    if (key.includes('..') || !/^(images|ref|videos|gen)\//.test(key)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const r = await signedGet(key);
        if (!r.ok) return new Response(null, { status: r.status });
        const ct = r.headers.get('content-type') || 'application/octet-stream';
        const buf = await r.arrayBuffer();
        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Type': ct,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
