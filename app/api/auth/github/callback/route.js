import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

import {
    createCreatorSession,
    creatorCookieSettings,
    creatorSessionTtl,
    githubOauthConfiguration,
    isAllowedGithubIdentity,
    safeCreatorReturnPath,
} from '../../../../../src/lib/creatorAuth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeEqual(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string') return false;
    const leftBuffer = Buffer.from(left, 'utf8');
    const rightBuffer = Buffer.from(right, 'utf8');
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function cookieOptions(cookies, maxAge) {
    return {
        httpOnly: true,
        secure: cookies.secure,
        sameSite: 'lax',
        path: '/',
        maxAge,
    };
}

function clearOauthCookies(response, cookies) {
    const expired = cookieOptions(cookies, 0);
    response.cookies.set(cookies.oauthStateName, '', expired);
    response.cookies.set(cookies.oauthVerifierName, '', expired);
    response.cookies.set(cookies.oauthReturnName, '', expired);
    return response;
}

function redirectTarget(oauth, returnTo, errorCode = '') {
    const target = new URL(safeCreatorReturnPath(returnTo), new URL(oauth.callbackUrl).origin);
    if (errorCode) target.searchParams.set('authError', errorCode);
    else target.searchParams.set('auth', 'github');
    return target;
}

async function githubJson(url, options) {
    try {
        const response = await fetch(url, {
            ...options,
            cache: 'no-store',
            redirect: 'error',
            signal: AbortSignal.timeout(10_000),
        });
        const value = await response.json().catch(() => null);
        return { response, value };
    } catch {
        return { networkError: true };
    }
}

export async function GET(request) {
    const oauth = githubOauthConfiguration(process.env);
    if (oauth.error) {
        return NextResponse.json({ error: oauth.error }, {
            status: 503,
            headers: { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' },
        });
    }

    const cookies = creatorCookieSettings(process.env);
    const returnTo = safeCreatorReturnPath(request.cookies.get(cookies.oauthReturnName)?.value);
    const fail = (code) => {
        const response = NextResponse.redirect(redirectTarget(oauth, returnTo, code));
        response.headers.set('cache-control', 'no-store');
        response.headers.set('referrer-policy', 'no-referrer');
        return clearOauthCookies(response, cookies);
    };

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const expectedState = request.cookies.get(cookies.oauthStateName)?.value;
    const verifier = request.cookies.get(cookies.oauthVerifierName)?.value;
    if (url.searchParams.has('error')) return fail('github_denied');
    if (!code || code.length > 512 || !safeEqual(state, expectedState) || !verifier || verifier.length > 256) {
        return fail('invalid_oauth_state');
    }

    const tokenResult = await githubJson('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'user-agent': 'Open-Generative-AI-Creator-Studio',
        },
        body: JSON.stringify({
            client_id: oauth.clientId,
            client_secret: oauth.clientSecret,
            code,
            redirect_uri: oauth.callbackUrl,
            code_verifier: verifier,
        }),
    });
    const accessToken = tokenResult.value?.access_token;
    if (tokenResult.networkError || !tokenResult.response?.ok || typeof accessToken !== 'string' || accessToken.length > 1024) {
        return fail('github_token_exchange_failed');
    }
    const grantedScopes = String(tokenResult.value?.scope || '')
        .split(',')
        .map((scope) => scope.trim())
        .filter(Boolean);
    if (grantedScopes.some((scope) => !['offline_access', 'read:user'].includes(scope))) {
        return fail('github_scope_rejected');
    }

    const userResult = await githubJson('https://api.github.com/user', {
        method: 'GET',
        headers: {
            accept: 'application/vnd.github+json',
            authorization: `Bearer ${accessToken}`,
            'user-agent': 'Open-Generative-AI-Creator-Studio',
            'x-github-api-version': '2022-11-28',
        },
    });
    if (userResult.networkError || !userResult.response?.ok) return fail('github_identity_failed');

    const identity = isAllowedGithubIdentity(userResult.value, process.env);
    if (!identity.allowed) return fail('github_account_not_allowed');

    let session;
    try {
        session = createCreatorSession(userResult.value, { env: process.env });
    } catch {
        return fail('session_creation_failed');
    }

    const response = NextResponse.redirect(redirectTarget(oauth, returnTo));
    response.headers.set('cache-control', 'no-store');
    response.headers.set('referrer-policy', 'no-referrer');
    response.cookies.set(
        cookies.sessionName,
        session,
        cookieOptions(cookies, creatorSessionTtl(process.env)),
    );
    return clearOauthCookies(response, cookies);
}
