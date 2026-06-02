import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';
import { getUser } from '../_lib/balance';

// Allow time to download the generated video from the CDN and re-upload to TOS.
export const maxDuration = 60;

const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET = process.env.TOS_BUCKET || '';
const TOS_REGION = process.env.TOS_REGION || 'cn-beijing';
const TOS_AK = process.env.TOS_ACCESS_KEY || '';
const TOS_SK = process.env.TOS_SECRET_KEY || '';
const TOS_READ_ENABLED = !!(TOS_ENDPOINT && TOS_BUCKET);
const TOS_ENABLED = !!(TOS_ENDPOINT && TOS_BUCKET && TOS_AK && TOS_SK);

function sha256hex(data) { return createHash('sha256').update(data).digest('hex'); }
function hmac(key, data) { return createHmac('sha256', key).update(data).digest(); }

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
        if (!res.ok) {
            console.error('TOS upload failed:', res.status, await res.text().catch(() => ''));
            return null;
        }
        return `https://${host}${path}`;
    } catch (e) {
        console.error('TOS upload error:', e.message);
        return null;
    }
}

// Download a media file from a (possibly expiring) CDN URL and re-upload it to
// TOS for permanent storage. Returns the permanent TOS URL, or the original URL
// on failure. Mirrors the workflow builder's behaviour so generated videos land
// in the bucket's videos/ folder.
async function maybeUploadMediaToTOS(srcUrl, kind) {
    if (!srcUrl || !TOS_ENABLED) return srcUrl;
    const tosHost = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
    if (srcUrl.startsWith(`https://${tosHost}`)) return srcUrl; // already in TOS
    try {
        const r = await fetch(srcUrl);
        if (!r.ok) return srcUrl;
        const buf = Buffer.from(await r.arrayBuffer());
        const ct = r.headers.get('content-type') || (kind === 'video' ? 'video/mp4' : kind === 'audio' ? 'audio/mpeg' : 'image/png');
        let folder = 'images', ext = 'png';
        if (kind === 'video') {
            folder = 'videos';
            ext = ct.includes('webm') ? 'webm' : ct.includes('mov') ? 'mov' : 'mp4';
        } else if (kind === 'audio') {
            folder = 'audio';
            ext = ct.includes('wav') ? 'wav' : ct.includes('ogg') ? 'ogg' : 'mp3';
        } else {
            ext = (ct.split('/')[1] || 'png').split('+')[0];
        }
        const tosKey = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
        return (await tosUpload(tosKey, buf, ct)) || srcUrl;
    } catch {
        return srcUrl;
    }
}

export async function GET(request) {
    try {
        const user = await getUser(request);
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!TOS_READ_ENABLED) {
            return NextResponse.json({ entries: [] });
        }

        const url = `https://${TOS_BUCKET}.${TOS_ENDPOINT}/gallery/${user.id}/entries.json`;
        const r = await fetch(url);

        if (!r.ok) {
            return NextResponse.json({ entries: [] });
        }

        const entries = await r.json();

        // Filter by type if requested
        const searchParams = new URL(request.url).searchParams;
        const type = searchParams.get('type');

        if (type) {
            const filtered = entries.filter(e => e.type === type);
            return NextResponse.json({ entries: filtered });
        }

        return NextResponse.json({ entries });
    } catch (error) {
        console.error('Gallery fetch error:', error);
        return NextResponse.json({ entries: [] });
    }
}

export async function POST(request) {
    try {
        const user = await getUser(request);
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!TOS_ENABLED) {
            return NextResponse.json({ error: 'TOS not enabled' }, { status: 503 });
        }

        const body = await request.json();
        const { url, type = 'video', model = '', prompt = '' } = body;
        if (!url) {
            return NextResponse.json({ error: 'url required' }, { status: 400 });
        }

        // Mirror the media into TOS (videos/ for video, audio/ for audio, images/ for image)
        // so it survives the source CDN URL expiring. Falls back to the original URL.
        const permanentUrl = await maybeUploadMediaToTOS(url, type);

        const key = `gallery/${user.id}/entries.json`;
        const tosUrl = `https://${TOS_BUCKET}.${TOS_ENDPOINT}/${key}`;
        let entries = [];
        try {
            const r = await fetch(tosUrl);
            if (r.ok) entries = await r.json();
        } catch {}

        const entry = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            type,
            url: permanentUrl,
            model,
            prompt,
            created_at: new Date().toISOString(),
        };
        entries.unshift(entry);

        const buf = Buffer.from(JSON.stringify(entries));
        const result = await tosUpload(key, buf, 'application/json');
        if (!result) {
            return NextResponse.json({ error: 'TOS upload failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, entry });
    } catch (error) {
        console.error('Gallery save error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
