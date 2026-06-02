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

// Generate a TOS presigned PUT URL valid for 1 hour.
// The browser can PUT the file directly to TOS without going through Vercel.
function presignedPutUrl(key, contentType, expiresSeconds = 3600) {
    const now = new Date();
    const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const date = iso.slice(0, 8);
    const datetime = iso;
    const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;

    const scope = `${date}/${TOS_REGION}/tos/request`;
    const credential = `${TOS_AK}/${scope}`;

    const signedHeaders = 'host';
    const canonicalQuery = [
        `X-Tos-Algorithm=TOS4-HMAC-SHA256`,
        `X-Tos-Credential=${encodeURIComponent(credential)}`,
        `X-Tos-Date=${datetime}`,
        `X-Tos-Expires=${expiresSeconds}`,
        `X-Tos-SignedHeaders=${signedHeaders}`,
    ].join('&');

    const canonicalHeaders = `host:${host}\n`;
    const canonicalRequest = [
        'PUT',
        `/${key}`,
        canonicalQuery,
        canonicalHeaders,
        signedHeaders,
        'UNSIGNED-PAYLOAD',
    ].join('\n');

    const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonicalRequest)}`;
    const sigKey = hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
    const sig = createHmac('sha256', sigKey).update(strToSign).digest('hex');

    return `https://${host}/${key}?${canonicalQuery}&X-Tos-Signature=${sig}`;
}

// Server-side TOS upload (signed PUT). Server→TOS is not subject to browser CORS.
async function tosUpload(key, buffer, contentType) {
    if (!TOS_ENABLED) return null;
    try {
        const now = new Date();
        const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
        const date = iso.slice(0, 8);
        const datetime = iso;
        const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
        const path = `/${key}`;
        const payloadHash = sha256hex(buffer);

        const canonHeaders = `content-length:${buffer.length}\ncontent-type:${contentType}\nhost:${host}\nx-tos-content-sha256:${payloadHash}\nx-tos-date:${datetime}\n`;
        const signedHeaders = 'content-length;content-type;host;x-tos-content-sha256;x-tos-date';
        const canonical = `PUT\n${path}\n\n${canonHeaders}\n${signedHeaders}\n${payloadHash}`;

        const scope = `${date}/${TOS_REGION}/tos/request`;
        const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;
        const sigKey = hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
        const sig = createHmac('sha256', sigKey).update(strToSign).digest('hex');
        const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;

        const res = await fetch(`https://${host}${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': auth,
                'Content-Type': contentType,
                'Content-Length': String(buffer.length),
                'X-Tos-Content-Sha256': payloadHash,
                'X-Tos-Date': datetime,
            },
            body: buffer,
        });
        if (!res.ok) { console.error('TOS upload failed:', res.status, await res.text().catch(() => '')); return null; }
        return `https://${host}${path}`;
    } catch (e) { console.error('TOS upload error:', e.message); return null; }
}

// POST /api/upload-file  { image: "data:image/png;base64,..." }  or  { url: "https://..." }
// Server downloads/decodes the bytes and uploads them to TOS, returning a permanent public URL.
// Used to mirror generated images (e.g. base64 from Gemini) into TOS, bypassing browser CORS.
export async function POST(request) {
    if (!TOS_ENABLED) {
        return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }
    try {
        const body = await request.json();
        const src = body.image || body.url;
        if (!src || typeof src !== 'string') {
            return NextResponse.json({ error: 'Missing image/url' }, { status: 400 });
        }

        let buffer;
        let contentType;
        const m = src.match(/^data:([^;]+);base64,(.+)$/s);
        if (m) {
            contentType = m[1];
            buffer = Buffer.from(m[2], 'base64');
        } else {
            const r = await fetch(src);
            if (!r.ok) return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
            contentType = r.headers.get('content-type') || 'image/png';
            buffer = Buffer.from(await r.arrayBuffer());
        }

        const ext = (contentType.split('/')[1] || 'png').split('+')[0];
        const key = `images/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const publicUrl = await tosUpload(key, buffer, contentType);
        if (!publicUrl) return NextResponse.json({ error: 'Upload failed' }, { status: 502 });
        // The bucket is private, so return a same-origin proxy URL that streams the
        // object through our signed-GET route — this is what <img> will load.
        return NextResponse.json({ url: `/api/file?key=${encodeURIComponent(key)}` });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// GET /api/upload-file?filename=video.mp4&type=video/mp4
// Returns { putUrl, publicUrl } — client PUTs file directly to TOS
export async function GET(request) {
    if (!TOS_ENABLED) {
        return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'upload';
    const contentType = searchParams.get('type') || 'application/octet-stream';

    const ext = filename.split('.').pop()?.toLowerCase() || 'bin';
    // All user-uploaded reference files (from PC) go into the ref/ folder.
    const key = `ref/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const putUrl = presignedPutUrl(key, contentType);
    const publicUrl = `https://${TOS_BUCKET}.${TOS_ENDPOINT}/${key}`;

    return NextResponse.json({ putUrl, publicUrl });
}
