import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';
import { getUser } from '../../_lib/balance';

const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET = process.env.TOS_BUCKET || '';
const TOS_REGION = process.env.TOS_REGION || 'cn-beijing';
const TOS_AK = process.env.TOS_ACCESS_KEY || '';
const TOS_SK = process.env.TOS_SECRET_KEY || '';
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

export async function DELETE(request, { params }) {
    try {
        const user = await getUser(request);
        console.log('[gallery delete] user:', user?.id);
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!TOS_ENABLED) {
            console.log('[gallery delete] TOS not enabled');
            return NextResponse.json({ error: 'TOS not enabled' }, { status: 503 });
        }

        const { entryId } = await params;
        console.log('[gallery delete] entryId:', entryId);
        const url = `https://${TOS_BUCKET}.${TOS_ENDPOINT}/gallery/${user.id}/entries.json`;

        const r = await fetch(url);
        if (!r.ok) {
            console.log('[gallery delete] entries fetch failed:', r.status);
            return NextResponse.json({ error: 'Entries not found' }, { status: 404 });
        }

        let entries = await r.json();
        console.log('[gallery delete] entries before filter:', entries.length);
        entries = entries.filter(e => e.id !== entryId);
        console.log('[gallery delete] entries after filter:', entries.length);

        const buf = Buffer.from(JSON.stringify(entries));
        const uploadResult = await tosUpload(`gallery/${user.id}/entries.json`, buf, 'application/json');

        if (!uploadResult) {
            console.error('[gallery delete] tosUpload failed');
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
        }

        console.log('[gallery delete] upload success');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Gallery delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
