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
