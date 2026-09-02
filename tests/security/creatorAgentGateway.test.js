import assert from 'node:assert/strict';
import test from 'node:test';

import { createCreatorSession, creatorCookieSettings } from '../../src/lib/creatorAuth.js';
import {
    CreatorAgentError,
    ensureCreatorAgents,
    fetchCreatorAgentConversation,
    pollCreatorAgentDelegation,
    resetCreatorAgentCache,
    resolveCreatorAgent,
    submitCreatorAgentDelegation,
} from '../../src/lib/creatorAgentGateway.js';
import {
    handleCreatorAgentConversation,
    handleCreatorAgentDelegate,
    handleCreatorAgentEnsure,
    handleCreatorAgents,
    handleCreatorAgentStatus,
} from '../../src/lib/creatorProviderGateway.js';
import {
    CREATOR_AGENT_REGISTRY,
    isValidCreatorAgentId,
    listEnabledCreatorAgents,
} from '../../src/lib/creatorAgentRegistry.js';
import { resetRateLimitStore } from '../../src/lib/rateLimit.js';
import { normalizeSelenaPlan, SELENA_ACTION_REGISTRY } from '../../src/lib/selenaOrchestrator.js';

const baseEnv = {
    CREATOR_SESSION_SECRET: 'creator-agent-test-secret-that-is-longer-than-thirty-two-characters',
    CREATOR_GITHUB_ALLOWED_USER_IDS: '12345678',
    CREATOR_GITHUB_ALLOWED_LOGINS: 'lalambert1982-eng',
    CREATOR_STUDIO_RATE_LIMIT: '50',
    CREATOR_STUDIO_STATUS_RATE_LIMIT: '50',
    CONTENT_SAFETY_MODE: 'enforce',
};
const configuredEnv = {
    ...baseEnv,
    MUAPI_KEY_MODE: 'sandbox',
    MUAPI_API_KEY: 'muapi-server-only-secret',
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

async function withMockFetch(handler, run) {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = handler;
    try {
        return await run();
    } finally {
        globalThis.fetch = originalFetch;
    }
}

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

test('creatorAgentRegistry never accepts an arbitrary or unknown model-supplied agent id', () => {
    assert.equal(isValidCreatorAgentId('creative-director'), true);
    assert.equal(isValidCreatorAgentId('shell.exec'), false);
    assert.equal(isValidCreatorAgentId('../../etc/passwd'), false);
    assert.equal(isValidCreatorAgentId(''), false);
    assert.equal(isValidCreatorAgentId(null), false);
    assert.equal(isValidCreatorAgentId('made-up-agent'), false);
    assert.equal(Object.keys(CREATOR_AGENT_REGISTRY).length, 8);
    assert.equal(listEnabledCreatorAgents().length, 8);
});

test('resolveCreatorAgent requires a configured MuAPI key before contacting the Agent API', async () => {
    resetCreatorAgentCache();
    await assert.rejects(
        () => resolveCreatorAgent('creative-director', { env: baseEnv }),
        (error) => error instanceof CreatorAgentError && error.code === 'agent_provider_unconfigured' && error.status === 503,
    );
});

test('resolveCreatorAgent rejects unknown internal ids before any network call', async () => {
    resetCreatorAgentCache();
    let called = false;
    await withMockFetch(async () => {
        called = true;
        return jsonResponse([]);
    }, async () => {
        await assert.rejects(
            () => resolveCreatorAgent('made-up-agent', { env: configuredEnv }),
            (error) => error instanceof CreatorAgentError && error.code === 'agent_unavailable' && error.status === 404,
        );
    });
    assert.equal(called, false);
});

test('resolveCreatorAgent matches only by exact provisioned name, never a model-supplied id', async () => {
    resetCreatorAgentCache();
    await withMockFetch(async (url) => {
        assert.equal(String(url), 'https://api.muapi.ai/agents/user/agents');
        return jsonResponse([
            { name: 'Some Other Agent', agent_id: 'agent-other' },
            { name: 'G.FURY Creative Director', agent_id: 'agent-creative-director-123' },
        ]);
    }, async () => {
        const { definition, slug } = await resolveCreatorAgent('creative-director', { env: configuredEnv });
        assert.equal(definition.id, 'creative-director');
        assert.equal(slug, 'agent-creative-director-123');
    });
});

test('resolveCreatorAgent reports agents that exist in the registry but are not yet provisioned in MuAPI', async () => {
    resetCreatorAgentCache();
    await withMockFetch(async () => jsonResponse([]), async () => {
        await assert.rejects(
            () => resolveCreatorAgent('creative-director', { env: configuredEnv, forceRefresh: true }),
            (error) => error instanceof CreatorAgentError && error.code === 'agent_not_provisioned' && error.status === 409,
        );
    });
});

test('ensureCreatorAgents is idempotent: reuses existing agents by name and only creates the ones missing', async () => {
    resetCreatorAgentCache();
    const existingNames = new Set(['G.FURY Creative Director', 'G.FURY Marketing']);
    const existingAgents = [...existingNames].map((name, index) => ({ name, agent_id: `existing-${index}` }));
    let createCalls = 0;
    await withMockFetch(async (url, options = {}) => {
        const href = String(url);
        if (href.endsWith('/agents/user/agents')) {
            return jsonResponse(existingAgents);
        }
        if (href.endsWith('/agents') && options.method === 'POST') {
            createCalls += 1;
            const payload = JSON.parse(options.body);
            assert.equal(existingNames.has(payload.name), false, 'must never re-create an already-provisioned agent');
            return jsonResponse({ name: payload.name, agent_id: `created-${createCalls}` });
        }
        throw new Error(`Unexpected request to ${href}`);
    }, async () => {
        const results = await ensureCreatorAgents({ env: configuredEnv });
        assert.equal(results.length, 8);
        const existingResults = results.filter((entry) => entry.status === 'existing');
        const createdResults = results.filter((entry) => entry.status === 'created');
        assert.equal(existingResults.length, 2);
        assert.equal(createdResults.length, 6);
        assert.equal(createCalls, 6);
    });
});

test('submitCreatorAgentDelegation rejects an empty or oversized task without contacting MuAPI', async () => {
    resetCreatorAgentCache();
    let called = false;
    await withMockFetch(async () => {
        called = true;
        return jsonResponse([]);
    }, async () => {
        await assert.rejects(
            () => submitCreatorAgentDelegation('creative-director', { task: '   ', env: configuredEnv }),
            (error) => error instanceof CreatorAgentError && error.code === 'invalid_task',
        );
        await assert.rejects(
            () => submitCreatorAgentDelegation('creative-director', { task: 'x'.repeat(4001), env: configuredEnv }),
            (error) => error instanceof CreatorAgentError && error.code === 'invalid_task',
        );
    });
    assert.equal(called, false);
});

test('submitCreatorAgentDelegation returns immediately with a pending requestId instead of blocking on the agent reply', async () => {
    resetCreatorAgentCache();
    let chatBody;
    let resultEndpointCalled = false;
    await withMockFetch(async (url, options = {}) => {
        const href = String(url);
        if (href.endsWith('/agents/user/agents')) {
            return jsonResponse([{ name: 'G.FURY Content & Script', agent_id: 'agent-content-script' }]);
        }
        if (href.endsWith('/agents/by-slug/agent-content-script/chat')) {
            chatBody = JSON.parse(options.body);
            return jsonResponse({ request_id: 'req-1' });
        }
        if (href.endsWith('/api/v1/predictions/req-1/result')) {
            resultEndpointCalled = true;
            return jsonResponse({ is_complete: true, conversation_id: 'conv-1', messages: [] });
        }
        throw new Error(`Unexpected request to ${href}`);
    }, async () => {
        const submitted = await submitCreatorAgentDelegation('content-script', {
            task: 'Write three short hooks for a Creator Studio launch video.',
            contextSummary: 'Project "Launch" — 2 asset(s), 0 storyboard scene(s).',
            env: configuredEnv,
        });
        assert.equal(submitted.agentId, 'content-script');
        assert.equal(submitted.status, 'pending');
        assert.equal(submitted.requestId, 'req-1');
    });
    assert.match(chatBody.message, /Project "Launch"/);
    assert.match(chatBody.message, /Write three short hooks/);
    assert.equal(chatBody.conversation_id, null);
    // submitCreatorAgentDelegation must never itself poll for the result — that
    // is the whole point of splitting submit from poll, so a Creator Studio
    // request can never be held open for minutes waiting on the agent.
    assert.equal(resultEndpointCalled, false);
});

test('submitCreatorAgentDelegation surfaces dispatch failures as bounded, provider-detail-free errors', async () => {
    resetCreatorAgentCache();
    await withMockFetch(async (url) => {
        const href = String(url);
        if (href.endsWith('/agents/user/agents')) {
            return jsonResponse([{ name: 'G.FURY Marketing', agent_id: 'agent-marketing' }]);
        }
        if (href.endsWith('/agents/by-slug/agent-marketing/chat')) {
            return jsonResponse({ detail: 'internal upstream failure with secret-token-abc' }, 500);
        }
        throw new Error(`Unexpected request to ${href}`);
    }, async () => {
        await assert.rejects(
            () => submitCreatorAgentDelegation('marketing', { task: 'Draft a campaign angle.', env: configuredEnv }),
            (error) => {
                assert.ok(error instanceof CreatorAgentError);
                assert.equal(error.code, 'agent_dispatch_failed');
                assert.equal(error.status, 502);
                assert.equal(error.message.includes('secret-token-abc'), false);
                return true;
            },
        );
    });
});

test('pollCreatorAgentDelegation makes exactly one bounded check per call and never blocks waiting for completion', async () => {
    resetCreatorAgentCache();
    let resultCalls = 0;
    await withMockFetch(async (url) => {
        const href = String(url);
        if (href.endsWith('/api/v1/predictions/req-pending/result')) {
            resultCalls += 1;
            return jsonResponse({ is_complete: false });
        }
        throw new Error(`Unexpected request to ${href}`);
    }, async () => {
        const start = Date.now();
        const pending = await pollCreatorAgentDelegation('creative-director', 'req-pending', { env: configuredEnv });
        assert.equal(pending.status, 'pending');
        assert.equal(pending.message, null);
        assert.ok(Date.now() - start < 500, 'a single status check must not sleep/retry internally');
    });
    assert.equal(resultCalls, 1);
});

test('pollCreatorAgentDelegation returns the assistant reply once the agent turn is complete', async () => {
    resetCreatorAgentCache();
    await withMockFetch(async (url) => {
        const href = String(url);
        if (href.endsWith('/api/v1/predictions/req-done/result')) {
            return jsonResponse({
                is_complete: true,
                conversation_id: 'conv-1',
                messages: [
                    { role: 'user', content: 'Write three short hooks.' },
                    { role: 'assistant', content: 'Here are three hooks for your launch video.' },
                ],
            });
        }
        throw new Error(`Unexpected request to ${href}`);
    }, async () => {
        const result = await pollCreatorAgentDelegation('content-script', 'req-done', { env: configuredEnv });
        assert.equal(result.status, 'completed');
        assert.equal(result.conversationId, 'conv-1');
        assert.equal(result.message, 'Here are three hooks for your launch video.');
    });
});

test('pollCreatorAgentDelegation rejects a malformed requestId before any network call', async () => {
    resetCreatorAgentCache();
    let called = false;
    await withMockFetch(async () => {
        called = true;
        return jsonResponse({});
    }, async () => {
        await assert.rejects(
            () => pollCreatorAgentDelegation('creative-director', '../../etc/passwd', { env: configuredEnv }),
            (error) => error instanceof CreatorAgentError && error.code === 'invalid_request' && error.status === 400,
        );
    });
    assert.equal(called, false);
});

test('fetchCreatorAgentConversation requires a bounded conversation id', async () => {
    resetCreatorAgentCache();
    await assert.rejects(
        () => fetchCreatorAgentConversation('creative-director', ''),
        (error) => error instanceof CreatorAgentError && error.code === 'invalid_conversation',
    );
});

test('handleCreatorAgents returns only the public catalog shape behind Creator Studio authentication', async () => {
    resetRateLimitStore();
    const unauthenticated = await handleCreatorAgents(creatorRequest('agents', undefined, ''), { env: baseEnv });
    assert.equal(unauthenticated.status, 401);

    resetRateLimitStore();
    const response = await handleCreatorAgents(creatorRequest('agents'), { env: baseEnv });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.agents.length, 8);
    for (const agent of body.agents) {
        assert.deepEqual(Object.keys(agent).sort(), ['boundaries', 'description', 'id', 'label']);
    }
    assert.equal(JSON.stringify(body).includes('systemPrompt'), false);
    assert.equal(JSON.stringify(body).includes('provisionName'), false);
});

test('handleCreatorAgentEnsure requires authentication, a configured MuAPI key, and explicit confirmation', async () => {
    resetRateLimitStore();
    const unauthenticated = await handleCreatorAgentEnsure(creatorRequest('agents/ensure', {}, ''), { env: configuredEnv });
    assert.equal(unauthenticated.status, 401);

    resetRateLimitStore();
    const unconfirmed = await handleCreatorAgentEnsure(creatorRequest('agents/ensure', {}), { env: configuredEnv });
    assert.equal(unconfirmed.status, 400);

    resetRateLimitStore();
    const unconfigured = await handleCreatorAgentEnsure(creatorRequest('agents/ensure', { confirm: true }), { env: baseEnv });
    assert.equal(unconfigured.status, 503);
});

test('handleCreatorAgentEnsure never calls MuAPI without confirm: true, and never returns external slugs or provision names', async () => {
    resetRateLimitStore();
    resetCreatorAgentCache();
    let called = false;
    await withMockFetch(async () => {
        called = true;
        return jsonResponse([]);
    }, async () => {
        const unconfirmed = await handleCreatorAgentEnsure(creatorRequest('agents/ensure', {}), { env: configuredEnv });
        assert.equal(unconfirmed.status, 400);
    });
    assert.equal(called, false, 'provisioning must never run without explicit confirmation');

    resetRateLimitStore();
    resetCreatorAgentCache();
    let createCalls = 0;
    await withMockFetch(async (url, options = {}) => {
        const href = String(url);
        if (href.endsWith('/agents/user/agents')) return jsonResponse([]);
        if (href.endsWith('/agents') && options.method === 'POST') {
            createCalls += 1;
            const payload = JSON.parse(options.body);
            return jsonResponse({ name: payload.name, agent_id: `created-agent-${createCalls}` });
        }
        throw new Error(`Unexpected request to ${href}`);
    }, async () => {
        const confirmed = await handleCreatorAgentEnsure(creatorRequest('agents/ensure', { confirm: true }), { env: configuredEnv });
        assert.equal(confirmed.status, 200);
        const body = await confirmed.json();
        assert.equal(body.agents.length, 8);
        for (const agent of body.agents) {
            assert.deepEqual(Object.keys(agent).sort(), ['id', 'status']);
        }
        assert.equal(JSON.stringify(body).includes('created-'), false);
        assert.equal(JSON.stringify(body).includes('agent_id'), false);
        assert.equal(JSON.stringify(body).includes('G.FURY'), false);
    });
});

test('handleCreatorAgentDelegate rejects unknown agents, invalid tasks, cross-origin requests, and missing confirmation', async () => {
    resetRateLimitStore();
    const badAgent = await handleCreatorAgentDelegate(
        creatorRequest('agents/delegate', { confirm: true, agentId: 'made-up-agent', task: 'Do something.' }),
        { env: configuredEnv },
    );
    assert.equal(badAgent.status, 400);

    resetRateLimitStore();
    const badTask = await handleCreatorAgentDelegate(
        creatorRequest('agents/delegate', { confirm: true, agentId: 'creative-director', task: '' }),
        { env: configuredEnv },
    );
    assert.equal(badTask.status, 400);

    resetRateLimitStore();
    const crossOrigin = await handleCreatorAgentDelegate(
        creatorRequest(
            'agents/delegate',
            { confirm: true, agentId: 'creative-director', task: 'Propose direction.' },
            session,
            { origin: 'https://attacker.test', 'sec-fetch-site': 'cross-site' },
        ),
        { env: configuredEnv },
    );
    assert.equal(crossOrigin.status, 403);

    resetRateLimitStore();
    resetCreatorAgentCache();
    let called = false;
    await withMockFetch(async () => {
        called = true;
        return jsonResponse([]);
    }, async () => {
        const unconfirmed = await handleCreatorAgentDelegate(
            creatorRequest('agents/delegate', { agentId: 'creative-director', task: 'Propose direction.' }),
            { env: configuredEnv },
        );
        assert.equal(unconfirmed.status, 400);
    });
    assert.equal(called, false, 'a consequential/billable delegation must never dispatch without confirm: true');
});

test('handleCreatorAgentDelegate loads only the authenticated owner Project, never leaks credentials, and returns a pending job', async () => {
    resetRateLimitStore();
    resetCreatorAgentCache();
    let projectLoaderUser;
    const projectId = '11111111-1111-4111-8111-111111111111';
    const projectLoader = async (user, requestedProjectId) => {
        projectLoaderUser = user;
        assert.equal(requestedProjectId, projectId);
        return {
            id: projectId,
            name: 'Launch Project',
            hiddenCredential: 'project-secret',
            assets: [],
            storyboard: { scenes: [] },
        };
    };
    await withMockFetch(async (url, options = {}) => {
        const href = String(url);
        if (href.endsWith('/agents/user/agents')) {
            return jsonResponse([{ name: 'G.FURY Creative Director', agent_id: 'agent-cd' }]);
        }
        if (href.endsWith('/agents/by-slug/agent-cd/chat')) {
            const body = JSON.parse(options.body);
            assert.match(body.message, /Launch Project/);
            assert.equal(body.message.includes('project-secret'), false);
            return jsonResponse({ request_id: 'req-2' });
        }
        throw new Error(`Unexpected request to ${href}`);
    }, async () => {
        const response = await handleCreatorAgentDelegate(
            creatorRequest('agents/delegate', {
                confirm: true,
                agentId: 'creative-director',
                task: 'Propose an opening concept.',
                projectId,
            }),
            { env: configuredEnv, projectLoader },
        );
        assert.equal(response.status, 202);
        const body = await response.json();
        assert.equal(body.result.status, 'pending');
        assert.equal(body.result.requestId, 'req-2');
        assert.equal(JSON.stringify(body).includes('project-secret'), false);
        assert.equal(JSON.stringify(body).includes(configuredEnv.MUAPI_API_KEY), false);
    });
    assert.equal(projectLoaderUser.id, String(githubUser.id));
});

test('handleCreatorAgentStatus polls once per call, requires a valid agent id, and never leaks credentials', async () => {
    resetRateLimitStore();
    resetCreatorAgentCache();
    const badAgent = await handleCreatorAgentStatus(
        creatorRequest('agents/status?agentId=made-up-agent&requestId=req-3', undefined),
        { env: configuredEnv },
    );
    assert.equal(badAgent.status, 400);

    resetRateLimitStore();
    let resultCalls = 0;
    await withMockFetch(async (url) => {
        const href = String(url);
        if (href.endsWith('/api/v1/predictions/req-3/result')) {
            resultCalls += 1;
            return jsonResponse({ is_complete: true, conversation_id: 'conv-3', messages: [{ role: 'assistant', content: 'Direction proposed.' }] });
        }
        throw new Error(`Unexpected request to ${href}`);
    }, async () => {
        const response = await handleCreatorAgentStatus(
            creatorRequest('agents/status?agentId=creative-director&requestId=req-3', undefined),
            { env: configuredEnv },
        );
        assert.equal(response.status, 200);
        const body = await response.json();
        assert.equal(body.result.status, 'completed');
        assert.equal(body.result.message, 'Direction proposed.');
        assert.equal(JSON.stringify(body).includes(configuredEnv.MUAPI_API_KEY), false);
    });
    assert.equal(resultCalls, 1);
});

test('handleCreatorAgentConversation rejects an unknown agent id', async () => {
    resetRateLimitStore();
    const response = await handleCreatorAgentConversation(
        creatorRequest(`agents/conversation?agentId=made-up-agent&conversationId=conv-1`, undefined),
        { env: configuredEnv },
    );
    assert.equal(response.status, 400);
});

test('Selena action registry treats agent.delegate and agent.continue as cost-incurring, matching image/video generation', () => {
    assert.equal(SELENA_ACTION_REGISTRY['agent.delegate'].requiresApproval, true);
    assert.equal(SELENA_ACTION_REGISTRY['agent.continue'].requiresApproval, true);
    assert.equal(SELENA_ACTION_REGISTRY['agent.open'].requiresApproval, false);
});

test('Selena normalizeSelenaPlan resolves agentId through the server registry allowlist and drops unknown ids', () => {
    const plan = normalizeSelenaPlan({
        structuredOutput: {
            message: 'I can delegate this to the Content & Script agent.',
            plan: ['Review the drafted hooks before using them.'],
            suggestedActions: [
                {
                    action: 'agent.delegate',
                    parameters: { agentId: 'content-script', task: 'Write three short hooks.' },
                },
                {
                    action: 'agent.delegate',
                    parameters: { agentId: 'made-up-agent', task: 'Do something unsanctioned.' },
                },
            ],
            referencedAssets: [],
        },
    });
    assert.equal(plan.suggestedActions.length, 2);
    assert.equal(plan.suggestedActions[0].parameters.agentId, 'content-script');
    assert.equal(plan.suggestedActions[0].parameters.task, 'Write three short hooks.');
    assert.equal(plan.suggestedActions[0].requiresApproval, true);
    assert.equal('agentId' in plan.suggestedActions[1].parameters, false);
    assert.equal(plan.suggestedActions[1].parameters.task, 'Do something unsanctioned.');
});
