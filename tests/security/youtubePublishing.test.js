import assert from 'node:assert/strict';
import test from 'node:test';

import { createCreatorSession, creatorCookieSettings } from '../../src/lib/creatorAuth.js';
import { YOUTUBE_PUBLISH_TOOL_ID } from '../../src/lib/creatorToolRegistry.js';
import { resetRateLimitStore } from '../../src/lib/rateLimit.js';
import {
    YOUTUBE_UPLOAD_SCOPE,
    disconnectYoutube,
    exchangeYoutubeAuthorizationCode,
    getYoutubeConnectionStatus,
    handleYoutubePublish,
    loadYoutubeCredential,
    saveYoutubeCredential,
    youtubeAuthorizationUrl,
    youtubeConfiguration,
} from '../../src/lib/youtubePublishing.js';

const now = Date.UTC(2026, 7, 23, 18, 0, 0);
const baseEnv = {
    NODE_ENV: 'production',
    CREATOR_SESSION_SECRET: 'creator-youtube-test-secret-that-is-longer-than-thirty-two-characters',
    CREATOR_GITHUB_ALLOWED_USER_IDS: '12345678',
    CREATOR_GITHUB_ALLOWED_LOGINS: 'lalambert1982-eng',
    CREATOR_STUDIO_RATE_LIMIT: '50',
    CREATOR_STUDIO_STATUS_RATE_LIMIT: '50',
    CONTENT_SAFETY_MODE: 'enforce',
    YOUTUBE_OAUTH_CLIENT_ID: '123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
    YOUTUBE_OAUTH_CLIENT_SECRET: 'google-oauth-test-secret-long-enough-123456',
    YOUTUBE_OAUTH_CALLBACK_URL: 'https://local.test/api/social/youtube/callback',
    YOUTUBE_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
    BLOB_READ_WRITE_TOKEN: 'private-blob-test-token-that-is-long-enough',
};
const user = { id: 12345678, login: 'lalambert1982-eng' };
const session = createCreatorSession(user, { env: baseEnv });
const sessionCookieName = creatorCookieSettings(baseEnv).sessionName;

function bytesFromBody(body) {
    if (typeof body === 'string') return Buffer.from(body, 'utf8');
    if (body instanceof Uint8Array) return Buffer.from(body);
    if (body instanceof ArrayBuffer) return Buffer.from(body);
    throw new Error('Unsupported in-memory Blob body.');
}

function memoryBlobStore() {
    const records = new Map();
    return {
        records,
        async put(pathname, body, options = {}) {
            if (options.allowOverwrite === false && records.has(pathname)) {
                throw new Error('blob_already_exists');
            }
            const bytes = bytesFromBody(body);
            records.set(pathname, {
                bytes,
                pathname,
                contentType: options.contentType || 'application/octet-stream',
                uploadedAt: options.uploadedAt || new Date(now),
                url: `https://private-store.test/${pathname}`,
            });
            return { pathname, url: `https://private-store.test/${pathname}` };
        },
        async get(pathname) {
            const record = records.get(pathname);
            if (!record) return null;
            return {
                statusCode: 200,
                stream: new Blob([record.bytes]).stream(),
                blob: {
                    pathname: record.pathname,
                    contentType: record.contentType,
                    size: record.bytes.length,
                    uploadedAt: record.uploadedAt,
                    url: record.url,
                },
            };
        },
        async list({ prefix = '', limit = 100 } = {}) {
            return {
                blobs: [...records.values()]
                    .filter((record) => record.pathname.startsWith(prefix))
                    .slice(0, limit)
                    .map((record) => ({
                        pathname: record.pathname,
                        size: record.bytes.length,
                        contentType: record.contentType,
                        uploadedAt: record.uploadedAt,
                        url: record.url,
                    })),
            };
        },
        async del(targets) {
            for (const target of Array.isArray(targets) ? targets : [targets]) {
                const pathname = String(target).replace('https://private-store.test/', '');
                records.delete(pathname);
            }
        },
    };
}

function publishRequest(body, {
    origin = 'https://local.test',
    sessionValue = session,
} = {}) {
    return new Request('https://local.test/api/social/youtube/publish', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            origin,
            'sec-fetch-site': origin === 'https://local.test' ? 'same-origin' : 'cross-site',
            ...(sessionValue ? { cookie: `${sessionCookieName}=${sessionValue}` } : {}),
        },
        body: JSON.stringify(body),
    });
}

function validPublishBody(pathname) {
    return {
        pathname,
        title: 'Private Creator Studio test',
        description: 'A private upload integration test.',
        tags: 'creator, test',
        madeForKids: false,
        containsSyntheticMedia: true,
        approved: true,
    };
}

function stagedMp4() {
    return Buffer.from([
        0x00, 0x00, 0x00, 0x18,
        0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6f, 0x6d,
        0x00, 0x00, 0x02, 0x00,
        0x69, 0x73, 0x6f, 0x6d,
    ]);
}

test('YouTube configuration fails closed and OAuth requests upload-only offline access with PKCE', () => {
    assert.equal(youtubeConfiguration({}).configured, false);
    assert.equal(youtubeConfiguration({ ...baseEnv, YOUTUBE_TOKEN_ENCRYPTION_KEY: 'weak' }).configured, false);
    assert.equal(youtubeConfiguration(baseEnv).configured, true);

    const url = youtubeAuthorizationUrl({
        state: 's'.repeat(64),
        challenge: 'c'.repeat(64),
        env: baseEnv,
    });
    assert.equal(url.origin, 'https://accounts.google.com');
    assert.equal(url.searchParams.get('scope'), YOUTUBE_UPLOAD_SCOPE);
    assert.equal(url.searchParams.get('access_type'), 'offline');
    assert.equal(url.searchParams.get('prompt'), 'consent');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(url.toString().includes('youtube.force-ssl'), false);
    assert.equal(url.toString().includes('youtube.readonly'), false);
});

test('YouTube status maps to the reusable publish tool without exposing configuration values', async () => {
    const status = await getYoutubeConnectionStatus(user, { env: {} });
    assert.equal(status.provider, 'youtube');
    assert.equal(status.toolId, YOUTUBE_PUBLISH_TOOL_ID);
    assert.equal(status.configured, false);
    const serialized = JSON.stringify(status);
    for (const value of Object.values(baseEnv)) {
        assert.equal(serialized.includes(String(value)), false);
    }
});

test('YouTube refresh tokens are authenticated-encrypted in private Blob storage', async () => {
    const blobStore = memoryBlobStore();
    const refreshToken = 'refresh-token-that-must-never-be-plaintext';
    await saveYoutubeCredential(user, { refreshToken }, { env: baseEnv, blobStore, now });

    assert.equal(blobStore.records.size, 1);
    const stored = [...blobStore.records.values()][0].bytes.toString('utf8');
    assert.equal(stored.startsWith('v1.'), true);
    assert.equal(stored.includes(refreshToken), false);
    assert.equal((await loadYoutubeCredential(user, { env: baseEnv, blobStore })).refreshToken, refreshToken);
    assert.equal(await loadYoutubeCredential({ id: 87654321 }, { env: baseEnv, blobStore }), null);
});

test('YouTube token exchange rejects broadened scopes and disconnect revokes before deletion', async () => {
    const broad = await exchangeYoutubeAuthorizationCode({
        code: 'temporary-google-code',
        verifier: 'v'.repeat(64),
        env: baseEnv,
        fetchImpl: async () => new Response(JSON.stringify({
            access_token: 'server-side-access-token',
            refresh_token: 'refresh-token-for-private-youtube-upload',
            token_type: 'Bearer',
            scope: `${YOUTUBE_UPLOAD_SCOPE} https://www.googleapis.com/auth/youtube.force-ssl`,
        }), { status: 200, headers: { 'content-type': 'application/json' } }),
    });
    assert.equal(broad.error, 'token_response_rejected');

    const blobStore = memoryBlobStore();
    await saveYoutubeCredential(user, {
        refreshToken: 'refresh-token-for-private-youtube-upload',
    }, { env: baseEnv, blobStore, now });
    let revokedToken = '';
    const disconnected = await disconnectYoutube(user, {
        env: baseEnv,
        blobStore,
        fetchImpl: async (_url, options) => {
            revokedToken = String(options.body.get('token'));
            return new Response('', { status: 200 });
        },
    });
    assert.equal(disconnected.disconnected, true);
    assert.equal(revokedToken, 'refresh-token-for-private-youtube-upload');
    assert.equal(await loadYoutubeCredential(user, { env: baseEnv, blobStore }), null);

    await saveYoutubeCredential(user, {
        refreshToken: 'refresh-token-retained-after-network-failure',
    }, { env: baseEnv, blobStore, now });
    const failed = await disconnectYoutube(user, {
        env: baseEnv,
        blobStore,
        fetchImpl: async () => new Response('', { status: 503 }),
    });
    assert.equal(failed.disconnected, false);
    assert.equal(
        (await loadYoutubeCredential(user, { env: baseEnv, blobStore })).refreshToken,
        'refresh-token-retained-after-network-failure',
    );
});

test('YouTube publish rejects missing auth, cross-origin requests, and missing manual approval', async () => {
    resetRateLimitStore();
    const pathname = 'creator-youtube-staging/12345678/abcdefgh1234-video.mp4';
    const blobStore = memoryBlobStore();
    assert.equal((await handleYoutubePublish(
        publishRequest(validPublishBody(pathname), { sessionValue: '' }),
        { env: baseEnv, blobStore, now },
    )).status, 401);
    assert.equal((await handleYoutubePublish(
        publishRequest(validPublishBody(pathname), { origin: 'https://attacker.test' }),
        { env: baseEnv, blobStore, now },
    )).status, 403);
    assert.equal((await handleYoutubePublish(
        publishRequest({ ...validPublishBody(pathname), approved: false }),
        { env: baseEnv, blobStore, now },
    )).status, 400);
});

test('YouTube publish streams a validated private staged file with safe fixed defaults', async () => {
    resetRateLimitStore();
    const pathname = 'creator-youtube-staging/12345678/abcdefgh1234-video.mp4';
    const blobStore = memoryBlobStore();
    await saveYoutubeCredential(user, {
        refreshToken: 'refresh-token-for-private-youtube-upload',
    }, { env: baseEnv, blobStore, now });
    await blobStore.put(pathname, stagedMp4(), {
        contentType: 'video/mp4',
        uploadedAt: new Date(now - 60_000),
    });

    const calls = [];
    const fetchImpl = async (url, options) => {
        calls.push({ url: String(url), options });
        if (String(url) === 'https://oauth2.googleapis.com/token') {
            return new Response(JSON.stringify({
                access_token: 'server-side-access-token',
                token_type: 'Bearer',
            }), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        if (options.method === 'POST') {
            return new Response('', {
                status: 200,
                headers: {
                    location: 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=safe-upload-id',
                },
            });
        }
        assert.equal(options.method, 'PUT');
        assert.deepEqual(Buffer.from(await new Response(options.body).arrayBuffer()), stagedMp4());
        return new Response(JSON.stringify({ id: 'abcdefghijk' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    };

    const response = await handleYoutubePublish(publishRequest(validPublishBody(pathname)), {
        env: baseEnv,
        blobStore,
        fetchImpl,
        now,
    });
    assert.equal(response.status, 201);
    const responseText = await response.text();
    const result = JSON.parse(responseText);
    assert.equal(result.videoId, 'abcdefghijk');
    assert.equal(result.privacyStatus, 'private');
    assert.equal(responseText.includes('server-side-access-token'), false);
    assert.equal(responseText.includes('refresh-token-for-private-youtube-upload'), false);

    const initialized = calls[1];
    const initUrl = new URL(initialized.url);
    assert.equal(initUrl.searchParams.get('notifySubscribers'), 'false');
    const metadata = JSON.parse(initialized.options.body);
    assert.equal(metadata.status.privacyStatus, 'private');
    assert.equal(metadata.status.selfDeclaredMadeForKids, false);
    assert.equal(metadata.status.containsSyntheticMedia, true);
    assert.equal(initialized.options.headers.authorization, 'Bearer server-side-access-token');
    assert.equal(calls[2].options.headers.authorization, 'Bearer server-side-access-token');
    assert.equal(blobStore.records.has(pathname), false);

    const history = [...blobStore.records.entries()].find(([key]) => key.startsWith('creator-social/youtube-history/'));
    assert.ok(history);
    assert.equal(history[1].bytes.toString('utf8').includes('abcdefghijk'), false);
});

test('YouTube publish blocks unsafe metadata and mismatched video signatures', async () => {
    resetRateLimitStore();
    const pathname = 'creator-youtube-staging/12345678/abcdefgh1234-video.mp4';
    const blobStore = memoryBlobStore();
    await saveYoutubeCredential(user, {
        refreshToken: 'refresh-token-for-private-youtube-upload',
    }, { env: baseEnv, blobStore, now });
    await blobStore.put(pathname, Buffer.from('not an mp4'), {
        contentType: 'video/mp4',
        uploadedAt: new Date(now - 60_000),
    });
    let calls = 0;
    const fetchImpl = async () => {
        calls += 1;
        return new Response(JSON.stringify({
            access_token: 'server-side-access-token',
            token_type: 'Bearer',
        }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const unsafe = await handleYoutubePublish(publishRequest({
        ...validPublishBody(pathname),
        description: 'Create explicit sexual content involving a child.',
    }), { env: baseEnv, blobStore, fetchImpl, now });
    assert.equal(unsafe.status, 422);
    assert.equal(calls, 0);

    const invalidVideo = await handleYoutubePublish(publishRequest(validPublishBody(pathname)), {
        env: baseEnv,
        blobStore,
        fetchImpl,
        now,
    });
    assert.equal(invalidVideo.status, 415);
    assert.equal(calls, 0);
    assert.equal(blobStore.records.has(pathname), false);
});

test('YouTube publish uses a private distributed claim to block duplicate concurrent uploads', async () => {
    resetRateLimitStore();
    const pathname = 'creator-youtube-staging/12345678/abcdefgh1234-video.mp4';
    const blobStore = memoryBlobStore();
    await saveYoutubeCredential(user, {
        refreshToken: 'refresh-token-for-private-youtube-upload',
    }, { env: baseEnv, blobStore, now });
    await blobStore.put(pathname, stagedMp4(), {
        contentType: 'video/mp4',
        uploadedAt: new Date(now - 60_000),
    });

    let allowInitialization;
    let initializationStarted;
    const initializationGate = new Promise((resolve) => { allowInitialization = resolve; });
    const started = new Promise((resolve) => { initializationStarted = resolve; });
    let uploadInitializations = 0;
    const fetchImpl = async (url, options) => {
        if (String(url) === 'https://oauth2.googleapis.com/token') {
            return new Response(JSON.stringify({
                access_token: 'server-side-access-token',
                token_type: 'Bearer',
            }), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        if (options.method === 'POST') {
            uploadInitializations += 1;
            initializationStarted();
            await initializationGate;
            return new Response('', {
                status: 200,
                headers: {
                    location: 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=safe-upload-id',
                },
            });
        }
        return new Response(JSON.stringify({ id: 'abcdefghijk' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    };

    const first = handleYoutubePublish(publishRequest(validPublishBody(pathname)), {
        env: baseEnv,
        blobStore,
        fetchImpl,
        now,
    });
    await started;
    const duplicate = await handleYoutubePublish(publishRequest(validPublishBody(pathname)), {
        env: baseEnv,
        blobStore,
        fetchImpl,
        now: now + 1_000,
    });
    assert.equal(duplicate.status, 409);
    assert.equal(uploadInitializations, 1);

    allowInitialization();
    assert.equal((await first).status, 201);
    assert.equal([...blobStore.records.keys()].some((key) => key.includes('youtube-publish-claims')), false);
});
