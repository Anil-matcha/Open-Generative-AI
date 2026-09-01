import assert from 'node:assert/strict';
import test from 'node:test';

import { createCreatorSession, creatorCookieSettings } from '../../src/lib/creatorAuth.js';
import { handleBrainAssistant } from '../../src/lib/creatorProviderGateway.js';
import { resetRateLimitStore } from '../../src/lib/rateLimit.js';
import {
    boundedSelenaContext,
    normalizeSelenaPlan,
} from '../../src/lib/selenaOrchestrator.js';

const env = {
    CREATOR_SESSION_SECRET: 'creator-selena-test-secret-that-is-longer-than-thirty-two-characters',
    CREATOR_GITHUB_ALLOWED_USER_IDS: '12345678',
    CREATOR_GITHUB_ALLOWED_LOGINS: 'lalambert1982-eng',
    CREATOR_STUDIO_RATE_LIMIT: '50',
    CONTENT_SAFETY_MODE: 'enforce',
    GEMINI_API_KEY: 'server-only-gemini-provider-secret',
    BRAIN_PROVIDER: 'gemini',
    BRAIN_ENABLE_AUTOMATIC_FALLBACK: 'false',
};
const user = { id: 12345678, login: 'lalambert1982-eng' };
const projectId = '11111111-1111-4111-8111-111111111111';
const assetId = '22222222-2222-4222-8222-222222222222';

test('Selena rejects unknown tools and derives approval from the server allowlist', () => {
    const plan = normalizeSelenaPlan({
        text: 'Provider fallback text.',
        structuredOutput: {
            message: 'I prepared the requested actions.',
            plan: ['Review the media.', 'Approve any external action.'],
            referencedAssets: [assetId, assetId, 'bad id with spaces'],
            suggestedActions: [
                {
                    action: 'shell.exec',
                    parameters: { command: 'rm -rf /' },
                },
                {
                    action: 'video.generate',
                    requiresApproval: false,
                    destination: 'https://attacker.test',
                    parameters: {
                        prompt: 'Animate the opening.',
                        aspectRatio: '16:9',
                        duration: 999,
                        endpoint: 'https://attacker.test/provider',
                        apiKey: 'client-secret',
                    },
                },
                {
                    action: 'social.schedule',
                    requiresApproval: false,
                    parameters: { platform: 'instagram', caption: 'Draft only.' },
                },
            ],
        },
    });

    assert.deepEqual(plan.suggestedActions.map((item) => item.action), ['video.generate', 'social.schedule']);
    assert.equal(plan.suggestedActions[0].destination, '/studio/tools/video');
    assert.equal(plan.suggestedActions[0].requiresApproval, true);
    assert.equal(plan.suggestedActions[0].parameters.duration, 12);
    assert.deepEqual(Object.keys(plan.suggestedActions[0].parameters).sort(), ['aspectRatio', 'duration', 'prompt']);
    assert.equal(plan.suggestedActions[1].available, false);
    assert.equal(plan.suggestedActions[1].requiresApproval, true);
    assert.equal(plan.requiresApproval, true);
    assert.deepEqual(plan.referencedAssets, [assetId]);
    assert.equal(JSON.stringify(plan).includes('client-secret'), false);
    assert.equal(JSON.stringify(plan).includes('rm -rf'), false);
    assert.equal(JSON.stringify(plan).includes('attacker.test'), false);
});

test('Selena context is bounded and excludes media URLs and provider metadata', () => {
    const context = boundedSelenaContext({
        workspace: 'Scene Builder',
        project: {
            id: projectId,
            name: 'Campaign Project',
            secret: 'must-not-leak',
            assets: [{
                id: assetId,
                type: 'image',
                title: 'Opening Frame',
                source: 'muapi',
                url: 'https://cdn.muapi.ai/outputs/opening.png',
                provider: { requestId: 'provider-job-secret' },
            }],
            storyboard: {
                scenes: [{ id: 'scene-1', title: 'Opening', imageUrl: 'https://cdn.muapi.ai/outputs/opening.png' }],
            },
        },
        selectedAssetId: assetId,
    });
    assert.equal(context.project.assetCount, 1);
    assert.equal(context.project.storyboard.sceneCount, 1);
    assert.equal(context.selectedAsset.id, assetId);
    const serialized = JSON.stringify(context);
    assert.equal(serialized.includes('must-not-leak'), false);
    assert.equal(serialized.includes('provider-job-secret'), false);
    assert.equal(serialized.includes('cdn.muapi.ai'), false);
});

test('Selena route loads the authenticated owner Project and returns only validated actions', async () => {
    resetRateLimitStore();
    const session = createCreatorSession(user, { env });
    const cookieName = creatorCookieSettings(env).sessionName;
    let projectLoaderUser;
    let providerRequest;
    const request = new Request('https://local.test/api/creator/assistant', {
        method: 'POST',
        headers: {
            cookie: `${cookieName}=${session}`,
            'content-type': 'application/json',
            origin: 'https://local.test',
            'sec-fetch-site': 'same-origin',
        },
        body: JSON.stringify({
            prompt: 'Prepare an Instagram post from my selected asset.',
            workspace: 'Selena',
            projectId,
            selectedAssetId: assetId,
            context: { injected: 'browser context must not be trusted' },
        }),
    });
    const response = await handleBrainAssistant(request, {
        env,
        projectLoader: async (authenticatedUser, requestedProjectId) => {
            projectLoaderUser = authenticatedUser;
            assert.equal(requestedProjectId, projectId);
            return {
                id: projectId,
                name: 'Owner Project',
                hiddenCredential: 'project-secret',
                assets: [{
                    id: assetId,
                    type: 'image',
                    title: 'Opening Frame',
                    source: 'generated',
                    url: 'https://cdn.muapi.ai/outputs/opening.png',
                }],
                storyboard: { scenes: [] },
            };
        },
        fetchImpl: async (_url, options) => {
            providerRequest = JSON.parse(options.body);
            return new Response(JSON.stringify({
                modelVersion: 'gemini-test',
                candidates: [{
                    content: { parts: [{ text: JSON.stringify({
                        message: 'Your Instagram draft is ready to review.',
                        plan: ['Open Publish.', 'Review the caption.', 'Confirm only when ready.'],
                        suggestedActions: [
                            { action: 'social.prepare', parameters: { assetId, platform: 'instagram', caption: 'Track season starts now.' } },
                            { action: 'arbitrary.invoke', parameters: { url: 'https://attacker.test' } },
                        ],
                        referencedAssets: [assetId],
                    }) }] },
                    finishReason: 'STOP',
                }],
            }), { status: 200, headers: { 'content-type': 'application/json' } });
        },
    });

    assert.equal(response.status, 200);
    assert.equal(projectLoaderUser.id, String(user.id));
    const body = await response.json();
    assert.equal(body.provider, 'gemini');
    assert.equal(body.message, 'Your Instagram draft is ready to review.');
    assert.deepEqual(body.suggestedActions.map((item) => item.action), ['social.prepare']);
    assert.equal(body.suggestedActions[0].requiresApproval, false);
    assert.equal(body.requiresApproval, false);
    const outbound = JSON.stringify(providerRequest);
    assert.equal(outbound.includes('Owner Project'), true);
    assert.equal(outbound.includes('Opening Frame'), true);
    assert.equal(outbound.includes('browser context must not be trusted'), false);
    assert.equal(outbound.includes('project-secret'), false);
    assert.equal(outbound.includes('cdn.muapi.ai'), false);
    const serialized = JSON.stringify(body);
    assert.equal(serialized.includes(env.GEMINI_API_KEY), false);
    assert.equal(serialized.includes(session), false);
    assert.equal(serialized.includes('attacker.test'), false);
});
