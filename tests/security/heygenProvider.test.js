import assert from 'node:assert/strict';
import test from 'node:test';

import {
    handleCreatorProviders,
    handleHeyGenStatus,
    handleHeyGenVideo,
} from '../../src/lib/creatorProviderGateway.js';
import { createCreatorSession, creatorCookieSettings } from '../../src/lib/creatorAuth.js';
import {
    buildHeyGenVideoPayload,
    heyGenProviderStatus,
} from '../../src/lib/heygenProvider.js';
import {
    HEYGEN_AVATAR_VIDEO_TOOL_ID,
    getCreatorToolDefinition,
} from '../../src/lib/creatorToolRegistry.js';
import { resetRateLimitStore } from '../../src/lib/rateLimit.js';

const GREG_DIGITAL_TWIN_ID = 'cae16de37d204cdc98a8c36dd859cd46';
const GREG_HEYGEN_VOICE_ID = 'aecf8d74f6b8467b84d24e9dc541b19a';
const TEST_HEYGEN_CREDENTIAL = 'test-only-not-a-real-provider-credential';

const baseEnv = {
    CREATOR_SESSION_SECRET: 'creator-test-session-secret-that-is-longer-than-thirty-two-characters',
    CREATOR_GITHUB_ALLOWED_USER_IDS: '12345678',
    CREATOR_GITHUB_ALLOWED_LOGINS: 'lalambert1982-eng',
    CREATOR_STUDIO_RATE_LIMIT: '50',
    CREATOR_STUDIO_STATUS_RATE_LIMIT: '50',
    CONTENT_SAFETY_MODE: 'enforce',
};
const heyGenEnv = {
    ...baseEnv,
    HEYGEN_API_KEY: TEST_HEYGEN_CREDENTIAL,
    HEYGEN_AVATAR_ID: GREG_DIGITAL_TWIN_ID,
    HEYGEN_VOICE_ID: GREG_HEYGEN_VOICE_ID,
};
const githubUser = { id: 12345678, login: 'lalambert1982-eng' };
const session = createCreatorSession(githubUser, { env: baseEnv });
const sessionCookieName = creatorCookieSettings(baseEnv).sessionName;

function creatorRequest(path, body, {
    sessionValue = session,
    origin = 'https://local.test',
    secFetchSite = 'same-origin',
} = {}) {
    return new Request(`https://local.test/api/creator/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
            ...(sessionValue ? { cookie: `${sessionCookieName}=${sessionValue}` } : {}),
            ...(body === undefined ? {} : { 'content-type': 'application/json' }),
            ...(body === undefined ? {} : { origin, 'sec-fetch-site': secFetchSite }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}

test('HeyGen reports Setup Required when API key, avatar ID, or voice ID is missing', async () => {
    for (const missingName of ['HEYGEN_API_KEY', 'HEYGEN_AVATAR_ID', 'HEYGEN_VOICE_ID']) {
        resetRateLimitStore();
        const env = { ...heyGenEnv };
        delete env[missingName];
        const status = heyGenProviderStatus(env);
        assert.equal(status.configured, false);
        assert.equal(status.status, 'Setup Required');

        const response = await handleHeyGenVideo(
            creatorRequest('heygen', { script: 'A safe short-form video script.' }),
            { env },
        );
        assert.equal(response.status, 503);
        const body = await response.json();
        assert.equal(body.error, 'HeyGen is not configured.');
        assert.deepEqual(body.missing, [missingName]);
    }

    for (const placeholder of ['', '<add-securely>', 'change-me', 'placeholder', 'your_api_key']) {
        const status = heyGenProviderStatus({ ...heyGenEnv, HEYGEN_API_KEY: placeholder });
        assert.equal(status.configured, false);
        assert.equal(status.status, 'Setup Required');
    }
});

test('authenticated HeyGen generation uses Greg Digital Twin and voice with portrait 1080p defaults', async () => {
    resetRateLimitStore();
    let captured;
    const response = await handleHeyGenVideo(
        creatorRequest('heygen', {
            script: 'Greg delivers an approved track and field business tip.',
            title: 'Greg Creator Test',
        }),
        {
            env: heyGenEnv,
            fetchImpl: async (url, options) => {
                captured = { url, options };
                return new Response(JSON.stringify({
                    data: { video_id: 'video_job_123', status: 'waiting' },
                }), { status: 200, headers: { 'content-type': 'application/json' } });
            },
        },
    );

    assert.equal(response.status, 202);
    assert.equal(captured.url, 'https://api.heygen.com/v3/videos');
    assert.equal(captured.options.headers['x-api-key'], TEST_HEYGEN_CREDENTIAL);
    assert.equal(captured.options.headers.cookie, undefined);
    assert.match(captured.options.headers['idempotency-key'], /^[A-Za-z0-9_-]{8,}$/);

    const upstream = JSON.parse(captured.options.body);
    assert.equal(upstream.type, 'avatar');
    assert.equal(upstream.avatar_id, GREG_DIGITAL_TWIN_ID);
    assert.equal(upstream.voice_id, GREG_HEYGEN_VOICE_ID);
    assert.equal(upstream.aspect_ratio, '9:16');
    assert.equal(upstream.resolution, '1080p');
    assert.equal(upstream.output_format, 'mp4');

    const text = await response.text();
    const body = JSON.parse(text);
    assert.deepEqual(body, {
        provider: 'heygen',
        toolId: HEYGEN_AVATAR_VIDEO_TOOL_ID,
        jobId: 'video_job_123',
        status: 'queued',
        videoUrl: null,
        thumbnailUrl: null,
        duration: null,
        error: null,
    });
    for (const value of [TEST_HEYGEN_CREDENTIAL, GREG_DIGITAL_TWIN_ID, GREG_HEYGEN_VOICE_ID, session]) {
        assert.equal(text.includes(value), false);
    }
});

test('HeyGen generation rejects unauthenticated and cross-origin mutations before provider access', async () => {
    resetRateLimitStore();
    let calls = 0;
    const fetchImpl = async () => {
        calls += 1;
        return new Response('{}');
    };
    const unauthenticated = await handleHeyGenVideo(
        creatorRequest('heygen', { script: 'Safe script.' }, { sessionValue: '' }),
        { env: heyGenEnv, fetchImpl },
    );
    assert.equal(unauthenticated.status, 401);

    const crossOrigin = await handleHeyGenVideo(
        creatorRequest('heygen', { script: 'Safe script.' }, {
            origin: 'https://attacker.test',
            secFetchSite: 'cross-site',
        }),
        { env: heyGenEnv, fetchImpl },
    );
    assert.equal(crossOrigin.status, 403);
    assert.equal(calls, 0);
});

test('HeyGen validates scripts, rendering options, and content safety before provider access', async () => {
    let calls = 0;
    const fetchImpl = async () => {
        calls += 1;
        return new Response('{}');
    };

    for (const body of [
        { script: '' },
        { script: 'x'.repeat(5001) },
        { script: 'Safe script.', aspectRatio: '3:2' },
        { script: 'Safe script.', resolution: '8k' },
        { script: 'Safe script.', avatarId: '../wrong' },
        { script: 'Safe script.', background: { url: 'http://unsafe.test/background.png' } },
    ]) {
        resetRateLimitStore();
        const response = await handleHeyGenVideo(creatorRequest('heygen', body), {
            env: heyGenEnv,
            fetchImpl,
        });
        assert.equal(response.status, 400);
    }

    resetRateLimitStore();
    const unsafe = await handleHeyGenVideo(
        creatorRequest('heygen', { script: 'Create explicit sexual content involving a child.' }),
        { env: heyGenEnv, fetchImpl },
    );
    assert.equal(unsafe.status, 422);
    assert.equal(calls, 0);
});

test('HeyGen timeout and upstream errors are sanitized without leaking credentials', async () => {
    resetRateLimitStore();
    const timeout = await handleHeyGenVideo(
        creatorRequest('heygen', { script: 'Safe script.' }),
        {
            env: heyGenEnv,
            fetchImpl: async () => {
                const error = new Error('provider timed out');
                error.name = 'TimeoutError';
                throw error;
            },
        },
    );
    assert.equal(timeout.status, 504);
    assert.equal((await timeout.json()).error, 'HeyGen request timed out.');

    resetRateLimitStore();
    const rejected = await handleHeyGenVideo(
        creatorRequest('heygen', { script: 'Safe script.' }),
        {
            env: heyGenEnv,
            fetchImpl: async () => new Response(JSON.stringify({
                error: {
                    message: `Rejected credential ${TEST_HEYGEN_CREDENTIAL}\nfor ${GREG_DIGITAL_TWIN_ID}`,
                },
            }), { status: 422, headers: { 'content-type': 'application/json' } }),
        },
    );
    assert.equal(rejected.status, 422);
    const text = await rejected.text();
    assert.equal(text.includes(TEST_HEYGEN_CREDENTIAL), false);
    assert.equal(text.includes(GREG_DIGITAL_TWIN_ID), false);
    assert.equal(text.includes('[redacted]'), true);
});

test('authenticated HeyGen status polling returns only normalized safe metadata', async () => {
    resetRateLimitStore();
    let captured;
    const response = await handleHeyGenStatus(
        creatorRequest('heygen/status?id=video_job_123'),
        {
            env: heyGenEnv,
            fetchImpl: async (url, options) => {
                captured = { url, options };
                return new Response(JSON.stringify({
                    data: {
                        id: 'video_job_123',
                        status: 'completed',
                        video_url: 'https://files.heygen.ai/video/greg.mp4',
                        captioned_video_url: 'https://files.heygen.ai/video/greg-captioned.mp4',
                        thumbnail_url: 'https://files.heygen.ai/thumb/greg.jpg',
                        duration: 32.5,
                        video_page_url: 'https://app.heygen.com/video/internal-page',
                        unexpected_secret: TEST_HEYGEN_CREDENTIAL,
                    },
                }), { status: 200, headers: { 'content-type': 'application/json' } });
            },
        },
    );

    assert.equal(response.status, 200);
    assert.equal(captured.url, 'https://api.heygen.com/v3/videos/video_job_123');
    assert.equal(captured.options.headers['x-api-key'], TEST_HEYGEN_CREDENTIAL);
    const text = await response.text();
    const body = JSON.parse(text);
    assert.equal(body.provider, 'heygen');
    assert.equal(body.toolId, HEYGEN_AVATAR_VIDEO_TOOL_ID);
    assert.equal(body.jobId, 'video_job_123');
    assert.equal(body.status, 'completed');
    assert.equal(body.videoUrl, 'https://files.heygen.ai/video/greg-captioned.mp4');
    assert.equal(body.thumbnailUrl, 'https://files.heygen.ai/thumb/greg.jpg');
    assert.equal(body.duration, 32.5);
    assert.equal(body.error, null);
    assert.equal('videoPageUrl' in body, false);
    assert.equal(text.includes(TEST_HEYGEN_CREDENTIAL), false);
});

test('failed HeyGen polling status redacts provider failure data', async () => {
    resetRateLimitStore();
    const response = await handleHeyGenStatus(
        creatorRequest('heygen/status?id=video_job_456'),
        {
            env: heyGenEnv,
            fetchImpl: async () => new Response(JSON.stringify({
                data: {
                    status: 'failed',
                    failure_code: 'rendering_failed',
                    failure_message: `Provider failed with ${TEST_HEYGEN_CREDENTIAL}`,
                },
            }), { status: 200, headers: { 'content-type': 'application/json' } }),
        },
    );
    assert.equal(response.status, 200);
    const text = await response.text();
    const body = JSON.parse(text);
    assert.equal(body.status, 'failed');
    assert.equal(body.error.code, 'rendering_failed');
    assert.equal(body.error.message.includes('[redacted]'), true);
    assert.equal(text.includes(TEST_HEYGEN_CREDENTIAL), false);
});

test('provider status exposes Greg identity and readiness labels but no HeyGen values', async () => {
    resetRateLimitStore();
    const response = await handleCreatorProviders(creatorRequest('providers'), { env: heyGenEnv });
    assert.equal(response.status, 200);
    const text = await response.text();
    const body = JSON.parse(text);
    const heyGen = body.providers.find((provider) => provider.id === 'heygen');
    assert.deepEqual(heyGen.identity, { name: 'Greg', type: 'Digital Twin' });
    assert.equal(heyGen.status, 'Ready');
    assert.equal(heyGen.configured, true);
    assert.equal(heyGen.toolId, HEYGEN_AVATAR_VIDEO_TOOL_ID);
    for (const value of [TEST_HEYGEN_CREDENTIAL, GREG_DIGITAL_TWIN_ID, GREG_HEYGEN_VOICE_ID]) {
        assert.equal(text.includes(value), false);
    }
});

test('HeyGen tool registry is reusable and payload builder preserves a future audio mode', () => {
    const tool = getCreatorToolDefinition(HEYGEN_AVATAR_VIDEO_TOOL_ID);
    assert.equal(tool.provider, 'heygen');
    assert.equal(tool.defaultIdentity.name, 'Greg');
    assert.equal(tool.defaultIdentity.type, 'Digital Twin');
    assert.equal(tool.defaultIdentity.avatarEnvironmentVariable, 'HEYGEN_AVATAR_ID');
    assert.equal(tool.defaultIdentity.voiceEnvironmentVariable, 'HEYGEN_VOICE_ID');
    assert.equal(tool.futureInputModes.includes('audio_url'), true);

    const payload = buildHeyGenVideoPayload({
        avatarId: GREG_DIGITAL_TWIN_ID,
        title: 'Future ElevenLabs handoff',
        resolution: '1080p',
        aspectRatio: '9:16',
        source: { type: 'audio_url', audioUrl: 'https://assets.example.test/voice.mp3' },
    });
    assert.equal(payload.avatar_id, GREG_DIGITAL_TWIN_ID);
    assert.equal(payload.audio_url, 'https://assets.example.test/voice.mp3');
    assert.equal('script' in payload, false);
    assert.equal('voice_id' in payload, false);
});
