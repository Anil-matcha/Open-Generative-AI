import { NextResponse } from 'next/server';

import { creatorCookieSettings, isSameOriginMutation } from '../../../../src/lib/creatorAuth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function POST(request) {
    if (!isSameOriginMutation(request)) {
        return NextResponse.json({ error: 'Cross-origin logout request rejected.' }, {
            status: 403,
            headers: { 'cache-control': 'no-store' },
        });
    }

    const cookies = creatorCookieSettings(process.env);
    const response = new NextResponse(null, {
        status: 204,
        headers: { 'cache-control': 'no-store' },
    });
    response.cookies.set(cookies.sessionName, '', {
        httpOnly: true,
        secure: cookies.secure,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
    return response;
}
