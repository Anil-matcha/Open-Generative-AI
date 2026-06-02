import { NextResponse } from 'next/server';
import { getUser } from '../_lib/balance';

const TOS_ENDPOINT = process.env.TOS_ENDPOINT || '';
const TOS_BUCKET = process.env.TOS_BUCKET || '';
const TOS_ENABLED = !!(TOS_ENDPOINT && TOS_BUCKET);

export async function GET(request) {
    try {
        const user = await getUser(request);
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!TOS_ENABLED) {
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
