import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createCreatorSession, creatorCookieSettings } from '../../src/lib/creatorAuth.js';
import { proxyCreatorCreativeCanvas } from '../../src/lib/creatorMuapiProxy.js';
import { resetRateLimitStore } from '../../src/lib/rateLimit.js';

const baseEnv = {
    CREATOR_SESSION_SECRET: 'creative-canvas-test-secret-that-is-longer-than-thirty-two-characters',
    CREATOR_GITHUB_ALLOWED_USER_IDS: '12345678',
    CREATOR_GITHUB_ALLOWED_LOGINS: 'lalambert1982-eng',
    CREATOR_STUDIO_RATE_LIMIT: '50',
    CREATOR_STUDIO_STATUS_RATE_LIMIT: '50',
    CONTENT_SAFETY_MODE: 'enforce',
};
const user = { id: 12345678, login: 'lalambert1982-eng' };

function creatorRequest(path = 'sessions') {
    const session = createCreatorSession(user, { env: baseEnv });
    const cookieName = creatorCookieSettings(baseEnv).sessionName;
    return new Request(`https://local.test/api/v1/creative-agent/${path}`, {
        method: 'GET',
        headers: {
            cookie: `${cookieName}=${session}`,
            authorization: 'Bearer browser-provider-key-that-must-be-ignored',
            'x-api-key': 'browser-api-key-that-must-be-ignored',
        },
    });
}

test('Creator-authenticated CreativeCanvas calls use the active server credential only', async () => {
    resetRateLimitStore();
    const providerKey = 'server-only-muapi-sandbox-key';
    let captured;
    const response = await proxyCreatorCreativeCanvas(creatorRequest(), {
        pathSegments: ['sessions'],
        env: {
            ...baseEnv,
            MUAPI_API_KEY: providerKey,
            MUAPI_KEY_MODE: 'sandbox',
            MUAPI_ALLOW_PAID_GENERATION: 'false',
        },
        fetchImpl: async (url, options) => {
            captured = { url, options };
            return new Response(JSON.stringify({ sessions: [] }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        },
    });

    assert.equal(response.status, 200);
    assert.equal(captured.url, 'https://api.muapi.ai/api/v1/creative-agent/sessions');
    assert.equal(captured.options.headers.get('x-api-key'), providerKey);
    assert.equal(captured.options.headers.has('authorization'), false);
    assert.equal(captured.options.headers.has('cookie'), false);
    assert.equal((await response.text()).includes(providerKey), false);
});

test('CreativeCanvas fails closed when Production paid generation is disabled', async () => {
    resetRateLimitStore();
    let upstreamCalls = 0;
    const response = await proxyCreatorCreativeCanvas(creatorRequest(), {
        pathSegments: ['sessions'],
        env: {
            ...baseEnv,
            MUAPI_PRODUCTION_API_KEY: 'server-only-muapi-production-key',
            MUAPI_KEY_MODE: 'production',
            MUAPI_ALLOW_PAID_GENERATION: 'false',
        },
        fetchImpl: async () => {
            upstreamCalls += 1;
            return new Response('{}');
        },
    });
    assert.equal(response.status, 503);
    assert.equal(upstreamCalls, 0);
    const body = await response.json();
    assert.equal(body.missing.includes('MUAPI_ALLOW_PAID_GENERATION=true'), true);
    assert.equal(JSON.stringify(body).includes('server-only-muapi-production-key'), false);
});

test('standalone CreativeCanvas BYOK compatibility remains isolated outside Creator sessions', async () => {
    const legacyKey = 'legacy-standalone-byok-key';
    let captured;
    const request = new Request('https://local.test/api/v1/creative-agent/sessions', {
        method: 'GET',
        headers: { 'x-api-key': legacyKey },
    });
    const response = await proxyCreatorCreativeCanvas(request, {
        pathSegments: ['sessions'],
        env: baseEnv,
        fetchImpl: async (url, options) => {
            captured = { url, options };
            return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
        },
    });
    assert.equal(response.status, 200);
    assert.equal(captured.options.headers.get('x-api-key'), legacyKey);
});

test('Creator Graphic Studio no longer persists a MuAPI credential for CreativeCanvas', async () => {
    const designAgent = await readFile(new URL('../../packages/studio/src/components/DesignAgentStudio.jsx', import.meta.url), 'utf8');
    const graphicStudio = await readFile(new URL('../../packages/studio/src/components/GraphicStudio.jsx', import.meta.url), 'utf8');
    const creatorProxy = await readFile(new URL('../../src/lib/creatorMuapiProxy.js', import.meta.url), 'utf8');
    assert.doesNotMatch(designAgent, /localStorage\.setItem\(["']token["']/);
    assert.doesNotMatch(designAgent, /sessionStorage\.setItem\(["']token["']/);
    assert.doesNotMatch(designAgent, /x-api-key|authorization/i);
    assert.match(graphicStudio, /owner-authenticated Creator server adapter/i);
    assert.match(creatorProxy, /apiKeyOverride: credential\.apiKey/);
});
