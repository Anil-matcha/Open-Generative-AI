import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createMuapiImageJob,
    createMuapiVideoJob,
    getMuapiGenerationJob,
    muapiConfiguration,
    muapiProviderStatus,
    normalizeMuapiImageInput,
    normalizeMuapiVideoInput,
} from '../../src/lib/muapiCreatorProvider.js';
import {
    MUAPI_IMAGE_TOOL_ID,
    MUAPI_VIDEO_TOOL_ID,
} from '../../src/lib/creatorToolRegistry.js';

const sandboxEnv = {
    MUAPI_API_KEY: 'sandbox-provider-secret',
    MUAPI_KEY_MODE: 'sandbox',
    MUAPI_ALLOW_PAID_GENERATION: 'false',
    MUAPI_IMAGE_MODEL: 'nano-banana',
    MUAPI_VIDEO_MODEL: 'seedance-lite-t2v',
    MUAPI_IMAGE_TO_VIDEO_MODEL: 'kling-v2.1-master-i2v',
};

test('MuAPI configuration requires an explicit key mode and fails closed for paid production', () => {
    assert.deepEqual(muapiConfiguration({ MUAPI_API_KEY: 'sandbox-provider-secret' }).missing, ['MUAPI_KEY_MODE']);
    assert.deepEqual(
        muapiConfiguration({
            MUAPI_API_KEY: 'production-provider-secret',
            MUAPI_KEY_MODE: 'production',
        }).missing,
        ['MUAPI_ALLOW_PAID_GENERATION=true'],
    );
    assert.equal(muapiConfiguration(sandboxEnv).configured, true);
    assert.equal(muapiConfiguration({
        ...sandboxEnv,
        MUAPI_KEY_MODE: 'production',
        MUAPI_ALLOW_PAID_GENERATION: 'true',
    }).configured, true);
});

test('MuAPI status exposes safe mode and model metadata without the API key', () => {
    const status = muapiProviderStatus(sandboxEnv);
    assert.equal(status.id, 'muapi');
    assert.equal(status.configured, true);
    assert.equal(status.keyMode, 'sandbox');
    assert.equal(status.paidGenerationAllowed, false);
    assert.deepEqual(status.toolIds, [MUAPI_IMAGE_TOOL_ID, MUAPI_VIDEO_TOOL_ID]);
    assert.equal(JSON.stringify(status).includes(sandboxEnv.MUAPI_API_KEY), false);
});

test('MuAPI normalizes fixed image and video models without accepting a client model override', () => {
    const image = normalizeMuapiImageInput({
        prompt: 'A cinematic track stadium.',
        aspectRatio: '16:9',
        model: 'attacker-model',
    }, { env: sandboxEnv });
    assert.equal(image.value.model, 'nano-banana');
    assert.deepEqual(image.value.payload, {
        prompt: 'A cinematic track stadium.',
        aspect_ratio: '16:9',
        image_url: null,
    });

    const video = normalizeMuapiVideoInput({
        prompt: 'A sprinter accelerates out of the blocks.',
        firstFrameUrl: 'https://assets.example.test/start.png',
        aspectRatio: '9:16',
        duration: 5,
        model: 'attacker-model',
    }, { env: sandboxEnv });
    assert.equal(video.value.model, 'kling-v2.1-master-i2v');
    assert.equal(video.value.payload.image_url, 'https://assets.example.test/start.png');
    assert.equal(video.value.payload.aspect_ratio, '9:16');
});

test('MuAPI image creation keeps the Sandbox key server-side and normalizes a queued job', async () => {
    let captured;
    const result = await createMuapiImageJob({
        prompt: 'A dramatic track stadium at sunset.',
        aspectRatio: '1:1',
    }, {
        env: sandboxEnv,
        fetchImpl: async (url, options) => {
            captured = { url, options };
            return new Response(JSON.stringify({ request_id: 'image-job-123', status: 'pending' }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        },
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 202);
    assert.equal(result.job.jobId, 'image-job-123');
    assert.equal(result.job.toolId, MUAPI_IMAGE_TOOL_ID);
    assert.equal(result.job.keyMode, 'sandbox');
    assert.equal(captured.url, 'https://api.muapi.ai/api/v1/nano-banana');
    assert.equal(captured.options.headers['x-api-key'], sandboxEnv.MUAPI_API_KEY);
    assert.equal(captured.options.headers.authorization, undefined);
    assert.equal(JSON.stringify(result).includes(sandboxEnv.MUAPI_API_KEY), false);
});

test('MuAPI video creation supports an immediate Sandbox mock output', async () => {
    const result = await createMuapiVideoJob({
        prompt: 'A sprinter accelerates under stadium lights.',
        aspectRatio: '16:9',
        duration: 5,
    }, {
        env: sandboxEnv,
        fetchImpl: async () => new Response(JSON.stringify({
            id: 'video-job-123',
            status: 'completed',
            outputs: ['https://cdn.muapi.ai/mock/video.mp4'],
        }), { status: 200 }),
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.equal(result.job.toolId, MUAPI_VIDEO_TOOL_ID);
    assert.equal(result.job.url, 'https://cdn.muapi.ai/mock/video.mp4');
    assert.equal(result.job.status, 'completed');
});

test('MuAPI polling uses the fixed prediction result endpoint and normalizes output URLs', async () => {
    let captured;
    const result = await getMuapiGenerationJob('image-job-123', 'image', {
        env: sandboxEnv,
        fetchImpl: async (url, options) => {
            captured = { url, options };
            return new Response(JSON.stringify({
                status: 'succeeded',
                output: { url: 'https://cdn.muapi.ai/mock/image.png' },
            }), { status: 200 });
        },
    });

    assert.equal(result.ok, true);
    assert.equal(captured.url, 'https://api.muapi.ai/api/v1/predictions/image-job-123/result');
    assert.equal(captured.options.headers['x-api-key'], sandboxEnv.MUAPI_API_KEY);
    assert.equal(result.job.status, 'completed');
    assert.equal(result.job.url, 'https://cdn.muapi.ai/mock/image.png');
    assert.equal(JSON.stringify(result).includes(sandboxEnv.MUAPI_API_KEY), false);
});

test('MuAPI rejects unsafe identifiers and invalid first-frame URLs before provider access', async () => {
    assert.equal(
        normalizeMuapiVideoInput({
            prompt: 'Animate the scene.',
            firstFrameUrl: 'http://insecure.example.test/frame.png',
        }, { env: sandboxEnv }).error,
        'First-frame image URL must be a valid HTTPS URL.',
    );

    let called = false;
    const result = await getMuapiGenerationJob('../secret', 'image', {
        env: sandboxEnv,
        fetchImpl: async () => { called = true; return new Response('{}'); },
    });
    assert.equal(result.status, 400);
    assert.equal(called, false);
});
