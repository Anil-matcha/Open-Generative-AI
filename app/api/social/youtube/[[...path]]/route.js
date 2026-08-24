import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

import {
    authenticateCreatorRequest,
    safeCreatorReturnPath,
} from '../../../../../src/lib/creatorAuth.js';
import {
    authorizeCreatorRequest,
    creatorJson,
} from '../../../../../src/lib/creatorProviderGateway.js';
import {
    YOUTUBE_ALLOWED_VIDEO_MIME_TYPES,
    deleteYoutubeCredential,
    disconnectYoutube,
    exchangeYoutubeAuthorizationCode,
    getYoutubeConnectionStatus,
    handleYoutubePublish,
    isYoutubeStagingPath,
    revokeYoutubeToken,
    saveYoutubeCredential,
    youtubeAuthorizationUrl,
    youtubeConfiguration,
    youtubeCookieSettings,
    youtubeMaxUploadBytes,
} from '../../../../../src/lib/youtubePublishing.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Vercel Hobby deployments accept a maximum function duration of 300 seconds.
export const maxDuration = 300;

function noStoreJson(body, status = 200) {
    return NextResponse.json(body, {
        status,
        headers: {
            'cache-control': 'no-store',
            'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
            'referrer-policy': 'no-referrer',
            'x-content-type-options': 'nosniff',
        },
    });
}

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
    response.cookies.set(cookies.stateName, '', expired);
    response.cookies.set(cookies.verifierName, '', expired);
    response.cookies.set(cookies.subjectName, '', expired);
    response.cookies.set(cookies.returnName, '', expired);
    return response;
}

function creatorRedirect(request, returnTo, code = '') {
    const configuration = youtubeConfiguration(process.env);
    const origin = configuration.configured
        ? new URL(configuration.callbackUrl).origin
        : new URL(request.url).origin;
    const target = new URL(safeCreatorReturnPath(returnTo), origin);
    if (code) target.searchParams.set('youtubeAuthError', code);
    else target.searchParams.set('youtube', 'connected');
    return target;
}

async function startYoutubeOauth(request) {
    const auth = authorizeCreatorRequest(request, {
        env: process.env,
        action: 'youtube-connect',
        statusRequest: true,
    });
    if (auth.response) return auth.response;
    const configuration = youtubeConfiguration(process.env);
    if (!configuration.configured) {
        return noStoreJson({ error: configuration.error, missing: configuration.missing }, 503);
    }

    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier, 'utf8').digest('base64url');
    const returnTo = safeCreatorReturnPath(new URL(request.url).searchParams.get('returnTo'));
    const authorizationUrl = youtubeAuthorizationUrl({ state, challenge, env: process.env });
    const cookies = youtubeCookieSettings(process.env);
    const options = cookieOptions(cookies, 10 * 60);
    const response = NextResponse.redirect(authorizationUrl);
    response.headers.set('cache-control', 'no-store');
    response.headers.set('referrer-policy', 'no-referrer');
    response.cookies.set(cookies.stateName, state, options);
    response.cookies.set(cookies.verifierName, verifier, options);
    response.cookies.set(cookies.subjectName, auth.user.id, options);
    response.cookies.set(cookies.returnName, returnTo, options);
    return response;
}

async function finishYoutubeOauth(request) {
    const cookies = youtubeCookieSettings(process.env);
    const returnTo = safeCreatorReturnPath(request.cookies.get(cookies.returnName)?.value);
    const fail = (code) => {
        const response = NextResponse.redirect(creatorRedirect(request, returnTo, code));
        response.headers.set('cache-control', 'no-store');
        response.headers.set('referrer-policy', 'no-referrer');
        return clearOauthCookies(response, cookies);
    };

    const authentication = authenticateCreatorRequest(request, { env: process.env });
    if (!authentication.valid) return fail('creator_session_required');
    const configuration = youtubeConfiguration(process.env);
    if (!configuration.configured) return fail('youtube_not_configured');

    const url = new URL(request.url);
    if (url.searchParams.has('error')) return fail('youtube_denied');
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const expectedState = request.cookies.get(cookies.stateName)?.value;
    const verifier = request.cookies.get(cookies.verifierName)?.value;
    const expectedSubject = request.cookies.get(cookies.subjectName)?.value;
    if (
        !code ||
        !safeEqual(state, expectedState) ||
        !verifier ||
        !safeEqual(expectedSubject, authentication.user.id)
    ) {
        return fail('invalid_youtube_oauth_state');
    }

    const exchanged = await exchangeYoutubeAuthorizationCode({
        code,
        verifier,
        env: process.env,
    });
    if (exchanged.error) {
        if (exchanged.refreshToken) await revokeYoutubeToken(exchanged.refreshToken).catch(() => {});
        return fail(exchanged.error === 'token_response_rejected'
            ? 'youtube_scope_rejected'
            : 'youtube_token_exchange_failed');
    }

    try {
        await saveYoutubeCredential(authentication.user, {
            refreshToken: exchanged.refreshToken,
        }, { env: process.env });
    } catch {
        await revokeYoutubeToken(exchanged.refreshToken).catch(() => {});
        await deleteYoutubeCredential(authentication.user, { env: process.env }).catch(() => {});
        return fail('youtube_token_storage_failed');
    }

    const response = NextResponse.redirect(creatorRedirect(request, returnTo));
    response.headers.set('cache-control', 'no-store');
    response.headers.set('referrer-policy', 'no-referrer');
    return clearOauthCookies(response, cookies);
}

async function youtubeStatus(request) {
    const auth = authorizeCreatorRequest(request, {
        env: process.env,
        action: 'youtube-status',
        statusRequest: true,
    });
    if (auth.response) return auth.response;
    try {
        return noStoreJson(await getYoutubeConnectionStatus(auth.user, { env: process.env }));
    } catch {
        return noStoreJson({ error: 'YouTube connection status is temporarily unavailable.' }, 503);
    }
}

async function youtubeBlobUpload(request) {
    const auth = authorizeCreatorRequest(request, {
        env: process.env,
        action: 'youtube-blob-token',
    });
    if (auth.response) return auth.response;
    const configuration = youtubeConfiguration(process.env);
    if (!configuration.configured) {
        return noStoreJson({ error: configuration.error, missing: configuration.missing }, 503);
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return noStoreJson({ error: 'A valid Blob upload request is required.' }, 400);
    }
    if (body?.type !== 'blob.generate-client-token') {
        return noStoreJson({ error: 'Unsupported Blob upload event.' }, 400);
    }
    const pathname = body?.payload?.pathname;
    if (!isYoutubeStagingPath(pathname, auth.user.id)) {
        return noStoreJson({ error: 'The staged YouTube pathname is invalid.' }, 400);
    }

    try {
        const result = await handleUpload({
            token: configuration.blobToken,
            request,
            body,
            onBeforeGenerateToken: async (requestedPathname) => {
                if (!isYoutubeStagingPath(requestedPathname, auth.user.id)) {
                    throw new Error('invalid_youtube_staging_path');
                }
                return {
                    allowedContentTypes: [...YOUTUBE_ALLOWED_VIDEO_MIME_TYPES],
                    maximumSizeInBytes: youtubeMaxUploadBytes(process.env),
                    validUntil: Date.now() + 10 * 60 * 1000,
                    addRandomSuffix: true,
                    allowOverwrite: false,
                    cacheControlMaxAge: 60,
                };
            },
        });
        return noStoreJson(result);
    } catch {
        return noStoreJson({ error: 'Creator Studio could not authorize the private video upload.' }, 502);
    }
}

async function youtubeDisconnect(request) {
    const auth = authorizeCreatorRequest(request, {
        env: process.env,
        action: 'youtube-disconnect',
    });
    if (auth.response) return auth.response;
    const configuration = youtubeConfiguration(process.env);
    if (!configuration.configured) {
        return noStoreJson({ error: configuration.error, missing: configuration.missing }, 503);
    }
    try {
        const result = await disconnectYoutube(auth.user, { env: process.env });
        if (!result.disconnected) {
            return noStoreJson({ error: 'Google could not revoke the YouTube connection. Try again.' }, 502);
        }
        return noStoreJson(result);
    } catch {
        return noStoreJson({ error: 'Creator Studio could not disconnect YouTube.' }, 503);
    }
}

async function dispatch(request, context, method) {
    const { path = [] } = await context.params;
    const route = `${method}:${path.join('/')}`;
    switch (route) {
        case 'GET:connect':
            return startYoutubeOauth(request);
        case 'GET:callback':
            return finishYoutubeOauth(request);
        case 'GET:status':
            return youtubeStatus(request);
        case 'POST:blob-upload':
            return youtubeBlobUpload(request);
        case 'POST:publish':
            return handleYoutubePublish(request, { env: process.env });
        case 'POST:disconnect':
            return youtubeDisconnect(request);
        default:
            return creatorJson({ error: 'YouTube publishing route not found.' }, 404);
    }
}

export function GET(request, context) {
    return dispatch(request, context, 'GET');
}

export function POST(request, context) {
    return dispatch(request, context, 'POST');
}
