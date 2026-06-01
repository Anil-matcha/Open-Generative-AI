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

async function tosUpload(key, buffer, contentType) {
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
    if (!res.ok) throw new Error(`TOS upload failed: ${res.status}`);
    return `https://${host}${path}`;
}

export const config = { api: { bodyParser: false } };

export async function POST(request) {
    if (!TOS_ENABLED) {
        return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ct = file.type || 'application/octet-stream';
        const ext = file.name?.split('.').pop()?.toLowerCase() || 'bin';
        const folder = ct.startsWith('video') ? 'videos' : ct.startsWith('audio') ? 'audios' : 'images';
        const tosKey = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

        const url = await tosUpload(tosKey, buffer, ct);
        return NextResponse.json({ url });
    } catch (e) {
        console.error('Upload error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
