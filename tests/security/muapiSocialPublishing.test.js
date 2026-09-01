import assert from 'node:assert/strict';
import test from 'node:test';

import { POST as socialPostRoute } from '../../app/api/social/muapi/[[...path]]/route.js';
import { createCreatorSession, creatorCookieSettings } from '../../src/lib/creatorAuth.js';
import { resetRateLimitStore } from '../../src/lib/rateLimit.js';

import {
    createMuapiSocialConnectUrl,
    creatorSocialExternalId,
    disconnectMuapiSocialAccount,
    getMuapiSocialPostStatus,
    listMuapiSocialAccounts,
    muapiSocialConfiguration,
    muapiSocialProviderStatus,
    publishMuapiSocial,
    safeSocialMediaUrl,
} from '../../src/lib/muapiSocialPublishing.js';

const env = {
    CREATOR_SESSION_SECRET: 'creator-social-test-secret-that-is-longer-than-thirty-two-characters',
    MUAPI_SOCIAL_API_KEY: 'server-only-social-provider-secret',
    MUAPI_ALLOW_SOCIAL_PUBLISHING: 'false',
};
const user = { id: '12345678', login: 'lalambert1982-eng' };

function json(value, { status = 200 } = {}) {
    return new Response(JSON.stringify(value), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

function account(platform = 'tiktok', id = 91) {
    return {
        id,
        platform_name: platform,
        account_name: `G.FURY ${platform}`,
        platform_user_id: 'provider-private-user-id',
        external_user_id: creatorSocialExternalId(user, env),
        connected: true,
        connected_at: '2026-08-28T10:00:00Z',
    };
}

test('MuAPI social configuration is separate, server-only, and publishing fails closed', () => {
    assert.equal(muapiSocialConfiguration({}).configured, false);
    assert.equal(muapiSocialConfiguration(env).configured, true);
    assert.equal(muapiSocialConfiguration(env).publishingEnabled, false);
    const status = muapiSocialProviderStatus(env);
    assert.equal(status.successfulPublishCostUsd, 0.01);
    assert.equal(status.schedulingAvailable, false);
    assert.equal(status.tiktokPublicApproved, false);
    assert.equal(JSON.stringify(status).includes(env.MUAPI_SOCIAL_API_KEY), false);
});

test('Creator identity is opaque and media URLs use a strict public-host allowlist', () => {
    const externalId = creatorSocialExternalId(user, env);
    assert.match(externalId, /^gfury_[a-f0-9]{32}$/);
    assert.equal(externalId.includes(user.id), false);
    assert.equal(safeSocialMediaUrl('https://cdn.muapi.ai/outputs/video.mp4', { env }).value, 'https://cdn.muapi.ai/outputs/video.mp4');
    assert.equal(safeSocialMediaUrl('http://cdn.muapi.ai/output.mp4', { env }).error.length > 0, true);
    assert.equal(safeSocialMediaUrl('https://127.0.0.1/output.mp4', { env }).error.length > 0, true);
    assert.equal(safeSocialMediaUrl('https://attacker.test/output.mp4', { env }).error.length > 0, true);
});

test('account listing sends only the opaque owner id and keeps the provider key server-side', async () => {
    let captured;
    const result = await listMuapiSocialAccounts(user, {
        env,
        fetchImpl: async (url, options) => {
            captured = { url, options };
            return json([account('instagram', 57), account('tiktok', 91), { ...account('tiktok', 92), external_user_id: 'another-user' }]);
        },
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.accounts.map(({ id, platform }) => [id, platform]), [[57, 'instagram'], [91, 'tiktok']]);
    assert.match(captured.url, /^https:\/\/api\.muapi\.ai\/api\/v1\/social\/ext\/accounts\?external_user_id=gfury_/);
    assert.equal(captured.options.headers['x-api-key'], env.MUAPI_SOCIAL_API_KEY);
    assert.equal(JSON.stringify(result).includes(env.MUAPI_SOCIAL_API_KEY), false);
    assert.equal(JSON.stringify(result).includes('provider-private-user-id'), false);
});

test('connect URL generation uses fixed MuAPI paths and a same-origin Studio return', async () => {
    let captured;
    const result = await createMuapiSocialConnectUrl(user, {
        platform: 'instagram',
        returnTo: '/studio/publish',
    }, {
        requestUrl: 'https://preview.example/api/social/muapi/connect',
        env,
        fetchImpl: async (url, options) => {
            captured = { url, options, body: JSON.parse(options.body) };
            return json({ url: 'https://www.instagram.com/oauth/authorize?safe=1' });
        },
    });
    assert.equal(result.ok, true);
    assert.equal(result.platform, 'instagram');
    assert.equal(captured.url, 'https://api.muapi.ai/api/v1/social/instagram/connect-url');
    assert.equal(captured.body.external_user_id, creatorSocialExternalId(user, env));
    assert.equal(captured.body.redirect_to, 'https://preview.example/studio/publish?social=connected');

    const unsafe = await createMuapiSocialConnectUrl(user, { platform: 'tiktok' }, {
        requestUrl: 'https://preview.example/api/social/muapi/connect',
        env,
        fetchImpl: async () => json({ url: 'https://attacker.test/steal-oauth' }),
    });
    assert.equal(unsafe.status, 502);
});

test('publishing requires approval, an explicit server switch, and account ownership', async () => {
    const input = {
        platform: 'tiktok',
        accountId: 91,
        mediaUrl: 'https://cdn.muapi.ai/outputs/video.mp4',
        mediaType: 'VIDEO',
        caption: 'G.FURY test',
        privacyLevel: 'PUBLIC_TO_EVERYONE',
        approved: true,
    };
    const noApproval = await publishMuapiSocial(user, { ...input, approved: false }, { env });
    assert.equal(noApproval.status, 403);
    const locked = await publishMuapiSocial(user, input, { env });
    assert.equal(locked.status, 403);

    const enabledEnv = { ...env, MUAPI_ALLOW_SOCIAL_PUBLISHING: 'true' };
    let rejectedCalls = 0;
    const rejected = await publishMuapiSocial(user, { ...input, approved: false }, {
        env: enabledEnv,
        fetchImpl: async () => { rejectedCalls += 1; return json([]); },
    });
    assert.equal(rejected.status, 400);
    assert.equal(rejectedCalls, 0);
    let publishBody;
    let calls = 0;
    const published = await publishMuapiSocial(user, input, {
        env: enabledEnv,
        fetchImpl: async (url, options) => {
            calls += 1;
            if (url.includes('/social/ext/accounts')) return json([{
                ...account('tiktok', 91),
                external_user_id: creatorSocialExternalId(user, enabledEnv),
            }]);
            publishBody = JSON.parse(options.body);
            return json({ request_id: 'publish_job_123', status: 'processing' });
        },
    });
    assert.equal(calls, 2);
    assert.equal(published.ok, true);
    assert.equal(published.post.status, 'publishing');
    assert.equal(published.post.estimatedSuccessfulPublishCostUsd, 0.01);
    assert.equal(publishBody.privacy_level, 'SELF_ONLY');
    assert.equal(publishBody.account_id, 91);
    assert.equal(JSON.stringify(published).includes(enabledEnv.MUAPI_SOCIAL_API_KEY), false);

    const scheduled = await publishMuapiSocial(user, { ...input, scheduledAt: '2026-09-01T12:00:00Z' }, { env: enabledEnv });
    assert.equal(scheduled.status, 400);
    assert.match(scheduled.error, /scheduling is not available/i);
});

test('Instagram and TikTok request shapes cannot cross platform accounts', async () => {
    const enabledEnv = { ...env, MUAPI_ALLOW_SOCIAL_PUBLISHING: 'true' };
    let calls = 0;
    const result = await publishMuapiSocial(user, {
        platform: 'instagram',
        accountId: 91,
        mediaUrl: 'https://cdn.muapi.ai/outputs/image.jpg',
        mediaType: 'IMAGE',
        caption: 'G.FURY graphic',
        approved: true,
    }, {
        env: enabledEnv,
        fetchImpl: async () => {
            calls += 1;
            return json([{ ...account('tiktok', 91), external_user_id: creatorSocialExternalId(user, enabledEnv) }]);
        },
    });
    assert.equal(calls, 1);
    assert.equal(result.status, 422);
});

test('Instagram publishing uses the documented fixed payload and disconnect verifies account ownership', async () => {
    const enabledEnv = { ...env, MUAPI_ALLOW_SOCIAL_PUBLISHING: 'true' };
    const requests = [];
    const fetchImpl = async (url, options) => {
        requests.push({ url, options, body: options.body ? JSON.parse(options.body) : null });
        if (url.includes('/social/ext/accounts') && options.method === 'GET') {
            return json([{ ...account('instagram', 57), external_user_id: creatorSocialExternalId(user, enabledEnv) }]);
        }
        if (url.endsWith('/instagram-publish')) return json({ request_id: 'instagram_job_57' });
        if (url.endsWith('/accounts/57/disconnect')) return json({ disconnected: true });
        throw new Error(`Unexpected test URL: ${url}`);
    };
    const published = await publishMuapiSocial(user, {
        platform: 'instagram',
        accountId: 57,
        mediaUrl: 'https://cdn.muapi.ai/outputs/image.jpg',
        mediaType: 'IMAGE',
        caption: 'G.FURY graphic',
        placement: 'timeline',
        shareToFeed: true,
        approved: true,
    }, { env: enabledEnv, fetchImpl });
    assert.equal(published.ok, true);
    const publishRequest = requests.find((item) => item.url.endsWith('/instagram-publish'));
    assert.deepEqual(publishRequest.body, {
        account_id: 57,
        media_url: 'https://cdn.muapi.ai/outputs/image.jpg',
        caption: 'G.FURY graphic',
        media_type: 'IMAGE',
        placement: 'timeline',
        share_to_feed: true,
    });
    const rejectedDisconnect = await disconnectMuapiSocialAccount(user, { accountId: 57 }, { env: enabledEnv, fetchImpl });
    assert.equal(rejectedDisconnect.status, 400);
    const disconnected = await disconnectMuapiSocialAccount(user, { accountId: 57, approved: true }, { env: enabledEnv, fetchImpl });
    assert.equal(disconnected.ok, true);
    assert.equal(disconnected.disconnected, true);
    assert.equal(requests.some((item) => item.url === 'https://api.muapi.ai/api/v1/social/ext/accounts/57/disconnect'), true);
});

test('post status polling normalizes provider completion and does not expose upstream data', async () => {
    const result = await getMuapiSocialPostStatus('publish_job_123', {
        env,
        fetchImpl: async (url, options) => {
            assert.equal(url, 'https://api.muapi.ai/api/v1/predictions/publish_job_123/result');
            assert.equal(options.headers['x-api-key'], env.MUAPI_SOCIAL_API_KEY);
            return json({ status: 'completed', output: { platform: 'tiktok', url: 'https://www.tiktok.com/@gfury/video/123' } });
        },
    });
    assert.equal(result.ok, true);
    assert.equal(result.post.status, 'published');
    assert.equal(result.post.platform, 'tiktok');
    assert.equal(JSON.stringify(result).includes(env.MUAPI_SOCIAL_API_KEY), false);
});

test('social routes enforce Creator authentication, same-origin mutation checks, and content safety before provider access', async () => {
    resetRateLimitStore();
    const routeEnv = {
        ...env,
        CREATOR_GITHUB_ALLOWED_USER_IDS: user.id,
        CREATOR_GITHUB_ALLOWED_LOGINS: user.login,
        CONTENT_SAFETY_MODE: 'enforce',
        MUAPI_ALLOW_SOCIAL_PUBLISHING: 'true',
    };
    const keys = Object.keys(routeEnv);
    const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
    Object.assign(process.env, routeEnv);
    const session = createCreatorSession(user, { env: routeEnv });
    const cookieName = creatorCookieSettings(routeEnv).sessionName;
    const validBody = {
        platform: 'tiktok',
        accountId: 91,
        mediaUrl: 'https://cdn.muapi.ai/outputs/video.mp4',
        mediaType: 'VIDEO',
        caption: 'Creator Studio test',
        approved: true,
    };
    const request = (body, { origin = 'https://local.test', authenticated = true } = {}) => new Request('https://local.test/api/social/muapi/publish', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            origin,
            'sec-fetch-site': origin === 'https://local.test' ? 'same-origin' : 'cross-site',
            ...(authenticated ? { cookie: `${cookieName}=${session}` } : {}),
        },
        body: JSON.stringify(body),
    });
    const originalFetch = globalThis.fetch;
    let called = false;
    globalThis.fetch = async () => { called = true; return json([]); };
    try {
        const missing = await socialPostRoute(request(validBody, { authenticated: false }), { params: Promise.resolve({ path: ['publish'] }) });
        assert.equal(missing.status, 401);
        const crossOrigin = await socialPostRoute(request(validBody, { origin: 'https://attacker.test' }), { params: Promise.resolve({ path: ['publish'] }) });
        assert.equal(crossOrigin.status, 403);
        const unsafe = await socialPostRoute(request({ ...validBody, caption: 'sexual content involving a child' }), { params: Promise.resolve({ path: ['publish'] }) });
        assert.equal(unsafe.status, 422);
        assert.equal(called, false);
    } finally {
        globalThis.fetch = originalFetch;
        for (const key of keys) {
            if (previous[key] === undefined) delete process.env[key];
            else process.env[key] = previous[key];
        }
    }
});
