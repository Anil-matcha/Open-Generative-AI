import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';

import {
    creatorCookieSettings,
    githubOauthConfiguration,
    safeCreatorReturnPath,
} from '../../../../../src/lib/creatorAuth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function noStoreJson(body, status) {
    return NextResponse.json(body, {
        status,
        headers: {
            'cache-control': 'no-store',
            'referrer-policy': 'no-referrer',
        },
    });
}

export function GET(request) {
    const oauth = githubOauthConfiguration(process.env);
    if (oauth.error) return noStoreJson({ error: oauth.error }, 503);

    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier, 'utf8').digest('base64url');
    const returnTo = safeCreatorReturnPath(new URL(request.url).searchParams.get('returnTo'));
    const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
    authorizeUrl.searchParams.set('client_id', oauth.clientId);
    authorizeUrl.searchParams.set('redirect_uri', oauth.callbackUrl);
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('code_challenge', challenge);
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    authorizeUrl.searchParams.set('scope', 'offline_access');
    authorizeUrl.searchParams.set('allow_signup', 'false');
    authorizeUrl.searchParams.set('prompt', 'select_account');

    const response = NextResponse.redirect(authorizeUrl);
    response.headers.set('cache-control', 'no-store');
    response.headers.set('referrer-policy', 'no-referrer');
    const cookies = creatorCookieSettings(process.env);
    const options = {
        httpOnly: true,
        secure: cookies.secure,
        sameSite: 'lax',
        path: '/',
        maxAge: 10 * 60,
    };
    response.cookies.set(cookies.oauthStateName, state, options);
    response.cookies.set(cookies.oauthVerifierName, verifier, options);
    response.cookies.set(cookies.oauthReturnName, returnTo, options);
    return response;
}
