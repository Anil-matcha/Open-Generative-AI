import assert from 'node:assert/strict';
import test from 'node:test';

import {
    handleAnthropicAssistant,
    handleBrainAssistant,
    handleCreatorProviders,
    handleMuapiImage,
    handleMuapiStatus,
    handleMuapiVideo,
    handleOpenAiImage,
} from '../../src/lib/creatorProviderGateway.js';
import { createCreatorSession, creatorCookieSettings } from '../../src/lib/creatorAuth.js';
import {
    BRAIN_REASONING_TOOL_ID,
    ELEVENLABS_VOICE_TOOL_ID,
    HEYGEN_AVATAR_VIDEO_TOOL_ID,
    MUAPI_IMAGE_TOOL_ID,
    MUAPI_VIDEO_TOOL_ID,
} from '../../src/lib/creatorToolRegistry.js';
import { resetRateLimitStore } from '../../src/lib/rateLimit.js';

const baseEnv = {
    CREATOR_SESSION_SECRET: 'creator-test-session-secret-that-is-longer-than-thirty-two-characters',
    CREATOR_GITHUB_ALLOWED_USER_IDS: '12345678',
    CREATOR_GITHUB_ALLOWED_LOGINS: 'lalambert1982-eng',
    CREATOR_STUDIO_RATE_LIMIT: '20',
    CREATOR_STUDIO_STATUS_RATE_LIMIT: '20',
    CONTENT_SAFETY_MODE: 'enforce',
};
const githubUser = { id: 12345678, login: 'lalambert1982-eng' };
const session = createCreatorSession(githubUser, { env: baseEnv });
const sessionCookieName = creatorCookieSettings(baseEnv).sessionName;

function creatorRequest(path, body, sessionValue = session, extraHeaders = {}) {
    return new Request(`https://local.test/api/creator/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
            ...(sessionValue ? { cookie: `${sessionCookieName}=${sessionValue}` } : {}),
            ...(body === undefined ? {} : { 'content-type': 'application/json' }),
            ...(body === undefined ? {} : { origin: 'https://local.test', 'sec-fetch-site': 'same-origin' }),
            ...extraHeaders,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}

test('creator gateway rejects missing, tampered, or weak session authentication', async () => {
    resetRateLimitStore();
    const missing = await handleCreatorProviders(creatorRequest('providers', undefined, ''), {
        env: baseEnv,
    });
    assert.equal(missing.status, 401);

    const tampered = await handleCreatorProviders(creatorRequest('providers', undefined, `${session}x`), {
        env: baseEnv,
    });
    assert.equal(tampered.status, 401);

    const weakConfiguration = await handleCreatorProviders(
        creatorRequest('providers'),
        {
            env: {
                CREATOR_SESSION_SECRET: 'short',
                CREATOR_GITHUB_ALLOWED_LOGINS: 'lalambert1982-eng',
            },
        },
    );
    assert.equal(weakConfiguration.status, 503);
});

test('creator gateway rejects cross-origin paid mutations even with a valid session', async () => {
    resetRateLimitStore();
    const response = await handleAnthropicAssistant(
        creatorRequest(
            'assistant',
            { prompt: 'Build a short launch plan.', mode: 'plan' },
            session,
            { origin: 'https://attacker.test', 'sec-fetch-site': 'cross-site' },
        ),
        { env: { ...baseEnv, ANTHROPIC_API_KEY: 'anthropic-provider-secret' } },
    );
    assert.equal(response.status, 403);
});

test('provider-neutral assistant route preserves Creator Studio authentication', async () => {
    resetRateLimitStore();
    const response = await handleBrainAssistant(
        creatorRequest('assistant', { prompt: 'Build a short launch plan.', mode: 'plan' }, ''),
        { env: { ...baseEnv, GEMINI_API_KEY: 'gemini-provider-secret' } },
    );
    assert.equal(response.status, 401);
});

test('provider-neutral assistant route rejects cross-origin mutations before provider access', async () => {
    resetRateLimitStore();
    let called = false;
    const response = await handleBrainAssistant(
        creatorRequest(
            'assistant',
            { prompt: 'Build a short launch plan.', mode: 'plan' },
            session,
            { origin: 'https://attacker.test', 'sec-fetch-site': 'cross-site' },
        ),
        {
            env: { ...baseEnv, GEMINI_API_KEY: 'gemini-provider-secret' },
            fetchImpl: async () => { called = true; return new Response('{}'); },
        },
    );
    assert.equal(response.status, 403);
    assert.equal(called, false);
});

test('provider-neutral assistant returns a normalized Gemini response without secrets', async () => {
    resetRateLimitStore();
    const providerKey = 'gemini-provider-secret';
    let captured;
    const response = await handleBrainAssistant(
        creatorRequest('assistant', { prompt: 'Build a short launch plan.', mode: 'plan' }),
        {
            env: {
                ...baseEnv,
                GEMINI_API_KEY: providerKey,
                BRAIN_PROVIDER: 'gemini',
                BRAIN_ENABLE_AUTOMATIC_FALLBACK: 'false',
            },
            fetchImpl: async (url, options) => {
                captured = { url, options };
                return new Response(JSON.stringify({
                    modelVersion: 'gemini-3.7-flash',
                    candidates: [{
                        content: { parts: [{ text: JSON.stringify({
                            message: 'I prepared a safe launch plan.',
                            plan: ['Draft the hook.', 'Build the assets.'],
                            suggestedActions: [{
                                action: 'image.generate',
                                parameters: { prompt: 'A cinematic launch graphic.', aspectRatio: '16:9' },
                            }],
                            referencedAssets: [],
                        }) }] },
                        finishReason: 'STOP',
                    }],
                    usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 18, totalTokenCount: 30 },
                }), { status: 200 });
            },
        },
    );

    assert.equal(response.status, 200);
    assert.equal(captured.options.headers['x-goog-api-key'], providerKey);
    const text = await response.text();
    const body = JSON.parse(text);
    assert.equal(body.provider, 'gemini');
    assert.equal(body.toolId, BRAIN_REASONING_TOOL_ID);
    assert.equal(body.text, 'I prepared a safe launch plan.');
    assert.deepEqual(body.plan, ['Draft the hook.', 'Build the assets.']);
    assert.equal(body.suggestedActions[0].action, 'image.generate');
    assert.equal(body.suggestedActions[0].requiresApproval, true);
    assert.equal(body.requiresApproval, true);
    const providerRequest = JSON.parse(captured.options.body);
    assert.equal(providerRequest.generationConfig.responseMimeType, 'application/json');
    assert.equal(text.includes(providerKey), false);
    assert.equal(text.includes(session), false);
});

test('provider status reports readiness without disclosing provider credentials', async () => {
    resetRateLimitStore();
    const secrets = {
        GEMINI_API_KEY: 'gemini-provider-secret',
        GROQ_API_KEY: 'groq-provider-secret',
        OPENROUTER_API_KEY: 'openrouter-provider-secret',
        ANTHROPIC_API_KEY: 'anthropic-provider-secret',
        OPENAI_API_KEY: 'openai-provider-secret',
        ELEVENLABS_API_KEY: 'elevenlabs-provider-secret',
        ELEVENLABS_VOICE_ID: 'elevenlabs-voice-id',
        HEYGEN_API_KEY: 'heygen-provider-secret',
        HEYGEN_AVATAR_ID: 'heygen-avatar-id',
        HEYGEN_VOICE_ID: 'heygen-voice-id',
        RUNWAY_API_KEY: 'runway-provider-secret',
        MUAPI_API_KEY: 'muapi-sandbox-provider-secret',
    };
    const response = await handleCreatorProviders(creatorRequest('providers'), {
        env: {
            ...baseEnv,
            ...secrets,
            BRAIN_PROVIDER: 'gemini',
            BRAIN_FALLBACK_ORDER: 'gemini,groq,openrouter',
            MUAPI_KEY_MODE: 'sandbox',
            MUAPI_ALLOW_PAID_GENERATION: 'false',
        },
    });

    assert.equal(response.status, 200);
    const text = await response.text();
    const body = JSON.parse(text);
    assert.deepEqual(body.providers.map((provider) => provider.configured), [true, true, true, true]);
    assert.deepEqual(body.providers.map((provider) => provider.toolId), [
        BRAIN_REASONING_TOOL_ID,
        undefined,
        ELEVENLABS_VOICE_TOOL_ID,
        HEYGEN_AVATAR_VIDEO_TOOL_ID,
    ]);
    assert.deepEqual(body.providers[1].toolIds, [MUAPI_IMAGE_TOOL_ID, MUAPI_VIDEO_TOOL_ID]);
    assert.deepEqual(body.brainProviders.map((provider) => provider.id), [
        'gemini',
        'groq',
        'openrouter',
        'anthropic',
    ]);
    assert.deepEqual(body.generationProviders.map((provider) => provider.id), [
        'muapi',
        'elevenlabs',
        'heygen',
    ]);
    assert.deepEqual(body.deferredGenerationProviders.map((provider) => provider.id), ['openai', 'runway']);
    assert.equal(body.brain.selectedProvider, 'gemini');
    for (const secret of Object.values(secrets)) assert.equal(text.includes(secret), false);
    assert.equal(text.includes(session), false);
});

test('MuAPI image and video routes preserve auth, safety, fixed host routing, and server-only keys', async () => {
    resetRateLimitStore();
    const providerKey = 'muapi-sandbox-provider-secret';
    const env = {
        ...baseEnv,
        MUAPI_API_KEY: providerKey,
        MUAPI_KEY_MODE: 'sandbox',
        MUAPI_ALLOW_PAID_GENERATION: 'false',
    };
    const captured = [];
    const fetchImpl = async (url, options) => {
        captured.push({ url, options });
        return new Response(JSON.stringify({ request_id: `job-${captured.length}23`, status: 'pending' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    };

    const image = await handleMuapiImage(
        creatorRequest('image', { prompt: 'A dramatic track stadium.', aspectRatio: '1:1' }),
        { env, fetchImpl },
    );
    const video = await handleMuapiVideo(
        creatorRequest('video', { prompt: 'A sprinter accelerates.', aspectRatio: '16:9', duration: 5 }),
        { env, fetchImpl },
    );

    assert.equal(image.status, 202);
    assert.equal(video.status, 202);
    assert.equal(captured[0].url, 'https://api.muapi.ai/api/v1/nano-banana');
    assert.equal(captured[1].url, 'https://api.muapi.ai/api/v1/seedance-lite-t2v');
    assert.equal(captured[0].options.headers['x-api-key'], providerKey);
    assert.equal(captured[0].options.headers.cookie, undefined);
    assert.equal((await image.text()).includes(providerKey), false);
    assert.equal((await video.text()).includes(providerKey), false);

    let unsafeCalled = false;
    const unsafe = await handleMuapiImage(
        creatorRequest('image', { prompt: 'Create explicit sexual content involving a child.' }),
        { env, fetchImpl: async () => { unsafeCalled = true; return new Response('{}'); } },
    );
    assert.equal(unsafe.status, 422);
    assert.equal(unsafeCalled, false);
});

test('MuAPI status polling is authenticated, rate limited, and returns no server secret', async () => {
    resetRateLimitStore();
    const providerKey = 'muapi-sandbox-provider-secret';
    const env = {
        ...baseEnv,
        MUAPI_API_KEY: providerKey,
        MUAPI_KEY_MODE: 'sandbox',
    };
    const response = await handleMuapiStatus(
        creatorRequest('muapi/status?id=image-job-123&kind=image'),
        {
            env,
            fetchImpl: async () => new Response(JSON.stringify({
                status: 'completed',
                outputs: ['https://cdn.muapi.ai/mock/image.png'],
            }), { status: 200 }),
        },
    );
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.equal(JSON.parse(text).url, 'https://cdn.muapi.ai/mock/image.png');
    assert.equal(text.includes(providerKey), false);
});

test('creator gateway blocks unsafe prompts before any provider call', async () => {
    resetRateLimitStore();
    let called = false;
    const response = await handleAnthropicAssistant(
        creatorRequest('assistant', { prompt: 'Create explicit sexual content involving a child.' }),
        {
            env: { ...baseEnv, ANTHROPIC_API_KEY: 'anthropic-provider-secret' },
            fetchImpl: async () => {
                called = true;
                return new Response('{}');
            },
        },
    );

    assert.equal(response.status, 422);
    assert.equal(called, false);
    assert.equal((await response.json()).reason, 'sexual_content_involving_minors');
});

test('Anthropic assistant keeps both access and provider secrets server-side', async () => {
    resetRateLimitStore();
    const providerKey = 'anthropic-provider-secret';
    let captured;
    const response = await handleAnthropicAssistant(
        creatorRequest('assistant', { prompt: 'Build a short launch plan.', mode: 'plan' }),
        {
            env: { ...baseEnv, ANTHROPIC_API_KEY: providerKey },
            fetchImpl: async (url, options) => {
                captured = { url, options };
                return new Response(JSON.stringify({
                    model: 'claude-sonnet-5',
                    content: [{ type: 'text', text: '1. Draft the hook.\n2. Build the assets.' }],
                    stop_reason: 'end_turn',
                    usage: { input_tokens: 12, output_tokens: 18 },
                }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
            },
        },
    );

    assert.equal(response.status, 200);
    assert.equal(captured.url, 'https://api.anthropic.com/v1/messages');
    assert.equal(captured.options.headers['x-api-key'], providerKey);
    assert.equal(captured.options.headers.cookie, undefined);
    const upstreamBody = JSON.parse(captured.options.body);
    assert.equal(upstreamBody.messages[0].content, 'Task:\nBuild a short launch plan.');

    const text = await response.text();
    assert.equal(text.includes(providerKey), false);
    assert.equal(text.includes(session), false);
    assert.equal(JSON.parse(text).text.includes('Draft the hook'), true);
});

test('OpenAI image proxy returns image bytes without exposing the API key', async () => {
    resetRateLimitStore();
    const providerKey = 'openai-provider-secret';
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    let captured;
    const response = await handleOpenAiImage(
        creatorRequest('image', { prompt: 'A dramatic track stadium at sunset.', quality: 'low' }),
        {
            env: { ...baseEnv, OPENAI_API_KEY: providerKey },
            fetchImpl: async (url, options) => {
                captured = { url, options };
                return new Response(JSON.stringify({
                    data: [{ b64_json: Buffer.from(png).toString('base64') }],
                }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
            },
        },
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.equal(captured.url, 'https://api.openai.com/v1/images/generations');
    assert.equal(captured.options.headers.authorization, `Bearer ${providerKey}`);
    assert.equal(captured.options.headers.cookie, undefined);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), png);
});

test('creator provider polling/status endpoint is rate limited by GitHub identity', async () => {
    resetRateLimitStore();
    const env = { ...baseEnv, CREATOR_STUDIO_STATUS_RATE_LIMIT: '1' };
    assert.equal((await handleCreatorProviders(creatorRequest('providers'), { env })).status, 200);
    assert.equal((await handleCreatorProviders(creatorRequest('providers'), { env })).status, 429);
});
