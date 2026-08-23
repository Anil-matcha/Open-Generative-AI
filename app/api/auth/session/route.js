import { NextResponse } from 'next/server';

import { authenticateCreatorRequest } from '../../../../src/lib/creatorAuth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request) {
    const authentication = authenticateCreatorRequest(request, { env: process.env });
    if (authentication.configurationError) {
        return NextResponse.json({ authenticated: false, error: authentication.configurationError }, {
            status: 503,
            headers: { 'cache-control': 'no-store' },
        });
    }
    if (!authentication.valid) {
        return NextResponse.json({ authenticated: false }, {
            status: 401,
            headers: { 'cache-control': 'no-store' },
        });
    }
    return NextResponse.json({
        authenticated: true,
        user: authentication.user,
        expiresAt: authentication.expiresAt,
    }, {
        headers: { 'cache-control': 'no-store' },
    });
}
