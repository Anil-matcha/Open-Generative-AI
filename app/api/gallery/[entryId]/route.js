import { NextResponse } from 'next/server';
import { getUser } from '../../_lib/balance';

const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET = process.env.TOS_BUCKET || '';
const TOS_ENABLED = !!(TOS_ENDPOINT && TOS_BUCKET);

async function tosUpload(key, buffer, contentType) {
    const tosUrl = `https://${TOS_BUCKET}.${TOS_ENDPOINT}/${key}`;
    const response = await fetch(tosUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
        },
        body: buffer,
    });
    if (!response.ok) throw new Error(`TOS upload failed: ${response.status}`);
    return response;
}

export async function DELETE(request, { params }) {
    try {
        const user = await getUser(request);
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!TOS_ENABLED) {
            return NextResponse.json({ error: 'TOS not enabled' }, { status: 503 });
        }

        const { entryId } = await params;
        const url = `https://${TOS_BUCKET}.${TOS_ENDPOINT}/gallery/${user.id}/entries.json`;

        const r = await fetch(url);
        if (!r.ok) {
            return NextResponse.json({ error: 'Entries not found' }, { status: 404 });
        }

        let entries = await r.json();
        entries = entries.filter(e => e.id !== entryId);

        const buf = Buffer.from(JSON.stringify(entries));
        await tosUpload(`gallery/${user.id}/entries.json`, buf, 'application/json');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Gallery delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
