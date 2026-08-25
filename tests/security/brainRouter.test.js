import assert from 'node:assert/strict';
import test from 'node:test';

import {
    BrainRouterError,
    brainErrorResponse,
    brainProviderStatuses,
    brainRouterStatus,
    getBrainConfiguration,
    reasonWithBrain,
} from '../../src/lib/brainRouter.js';

const baseEnv = {
    BRAIN_PROVIDER: 'gemini',
    BRAIN_FALLBACK_ORDER: 'gemini,groq,openrouter',
    BRAIN_ENABLE_AUTOMATIC_FALLBACK: 'true',
    BRAIN_MAX_ATTEMPTS: '3',
    GEMINI_API_KEY: 'gemini-test-provider-secret',
    GEMINI_MODEL: 'gemini-3.7-flash',
    GROQ_API_KEY: 'groq-test-provider-secret',
    GROQ_MODEL: 'openai/gpt-oss-120b',
    OPENROUTER_API_KEY: 'openrouter-test-provider-secret',
    OPENROUTER_MODEL: 'openrouter/free',
    ANTHROPIC_API_KEY: 'anthropic-test-provider-secret',
    ANTHROPIC_MODEL: 'claude-sonnet-5',
};

const request = {
    task: 'Create a short launch plan.',
    mode: 'plan',
    sensitivity: 'NORMAL',
};

function geminiSuccess(text = 'Gemini plan') {
    return new Response(JSON.stringify({
        modelVersion: 'gemini-3.7-flash',
        candidates: [{
            content: { parts: [{ text }] },
            finishReason: 'STOP',
        }],
        usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            totalTokenCount: 15,
        },
    }), { status: 200, headers: { 'content-type': 'application/json' } });
}

function compatibleSuccess(provider, text = `${provider} plan`) {
    return new Response(JSON.stringify({
        model: provider === 'groq' ? 'openai/gpt-oss-120b' : 'selected/free-model',
        choices: [{
            message: { role: 'assistant', content: text },
            finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    }), { status: 200, headers: { 'content-type': 'application/json' } });
}

test('Brain Router defaults to Gemini and keeps its API key server-side', async () => {
    let captured;
    const result = await reasonWithBrain(request, {
        env: baseEnv,
        fetchImpl: async (url, options) => {
            captured = { url, options };
            return geminiSuccess();
        },
    });

    assert.equal(result.provider, 'gemini');
    assert.equal(result.model, 'gemini-3.7-flash');
    assert.equal(result.text, 'Gemini plan');
    assert.deepEqual(result.toolCalls, []);
    assert.deepEqual(result.usage, { inputTokens: 10, outputTokens: 5, totalTokens: 15 });
    assert.equal(captured.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent');
    assert.equal(captured.options.headers['x-goog-api-key'], baseEnv.GEMINI_API_KEY);
    assert.equal(captured.options.body.includes(baseEnv.GEMINI_API_KEY), false);
});

test('Groq adapter normalizes OpenAI-compatible responses and tools', async () => {
    let captured;
    const result = await reasonWithBrain({
        ...request,
        tools: [{
            name: 'route_agent',
            description: 'Select an existing agent.',
            inputSchema: { type: 'object', properties: { agent: { type: 'string' } }, required: ['agent'] },
        }],
    }, {
        env: { ...baseEnv, BRAIN_PROVIDER: 'groq', BRAIN_ENABLE_AUTOMATIC_FALLBACK: 'false' },
        fetchImpl: async (url, options) => {
            captured = { url, options };
            return new Response(JSON.stringify({
                model: 'openai/gpt-oss-120b',
                choices: [{
                    message: {
                        role: 'assistant',
                        content: '',
                        tool_calls: [{
                            id: 'call-1',
                            type: 'function',
                            function: { name: 'route_agent', arguments: '{"agent":"scriptwriter"}' },
                        }],
                    },
                    finish_reason: 'tool_calls',
                }],
                usage: { prompt_tokens: 20, completion_tokens: 4, total_tokens: 24 },
            }), { status: 200 });
        },
    });

    assert.equal(captured.url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(captured.options.headers.authorization, `Bearer ${baseEnv.GROQ_API_KEY}`);
    assert.deepEqual(result.toolCalls, [{
        id: 'call-1',
        name: 'route_agent',
        arguments: { agent: 'scriptwriter' },
    }]);
    assert.equal(result.finishReason, 'tool_calls');
});

test('OpenRouter adapter uses the current free router and reports the model actually selected', async () => {
    let captured;
    const result = await reasonWithBrain(request, {
        env: { ...baseEnv, BRAIN_PROVIDER: 'openrouter', BRAIN_ENABLE_AUTOMATIC_FALLBACK: 'false' },
        fetchImpl: async (url, options) => {
            captured = { url, options };
            return compatibleSuccess('openrouter');
        },
    });

    assert.equal(captured.url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(JSON.parse(captured.options.body).model, 'openrouter/free');
    assert.equal(result.provider, 'openrouter');
    assert.equal(result.model, 'selected/free-model');
});

test('Anthropic remains available through the normalized brain interface', async () => {
    let captured;
    const result = await reasonWithBrain(request, {
        env: { ...baseEnv, BRAIN_PROVIDER: 'anthropic', BRAIN_ENABLE_AUTOMATIC_FALLBACK: 'false' },
        fetchImpl: async (url, options) => {
            captured = { url, options };
            return new Response(JSON.stringify({
                model: 'claude-sonnet-5',
                content: [{ type: 'text', text: 'Anthropic plan' }],
                stop_reason: 'end_turn',
                usage: { input_tokens: 11, output_tokens: 7 },
            }), { status: 200 });
        },
    });

    assert.equal(captured.url, 'https://api.anthropic.com/v1/messages');
    assert.equal(captured.options.headers['x-api-key'], baseEnv.ANTHROPIC_API_KEY);
    assert.equal(result.provider, 'anthropic');
    assert.equal(result.text, 'Anthropic plan');
    assert.deepEqual(result.usage, { inputTokens: 11, outputTokens: 7, totalTokens: 18 });
});

test('a Gemini quota response falls back once to Groq', async () => {
    const calls = [];
    const result = await reasonWithBrain(request, {
        env: baseEnv,
        fetchImpl: async (url) => {
            calls.push(url);
            if (calls.length === 1) {
                return new Response(JSON.stringify({ error: { message: 'quota exhausted' } }), { status: 429 });
            }
            return compatibleSuccess('groq');
        },
    });

    assert.equal(result.provider, 'groq');
    assert.equal(calls.length, 2);
});

test('a provider timeout falls back to the next eligible provider', async () => {
    let calls = 0;
    const result = await reasonWithBrain(request, {
        env: baseEnv,
        fetchImpl: async () => {
            calls += 1;
            if (calls === 1) {
                const error = new Error('aborted');
                error.name = 'AbortError';
                throw error;
            }
            return compatibleSuccess('groq');
        },
    });
    assert.equal(result.provider, 'groq');
    assert.equal(calls, 2);
});

test('temporary provider errors can reach the OpenRouter tertiary fallback', async () => {
    const calls = [];
    const result = await reasonWithBrain(request, {
        env: baseEnv,
        fetchImpl: async (url) => {
            calls.push(url);
            if (calls.length < 3) {
                return new Response(JSON.stringify({ error: { message: 'temporarily unavailable' } }), { status: 503 });
            }
            return compatibleSuccess('openrouter');
        },
    });
    assert.equal(result.provider, 'openrouter');
    assert.equal(calls.length, 3);
});

test('an explicitly unsupported capability falls back cleanly', async () => {
    let calls = 0;
    const result = await reasonWithBrain(request, {
        env: baseEnv,
        fetchImpl: async () => {
            calls += 1;
            if (calls === 1) {
                return new Response(JSON.stringify({
                    error: { message: 'This model does not support the requested capability.' },
                }), { status: 400 });
            }
            return compatibleSuccess('groq');
        },
    });
    assert.equal(result.provider, 'groq');
    assert.equal(calls, 2);
});

test('malformed provider responses can fall back without exposing provider data', async () => {
    let calls = 0;
    const result = await reasonWithBrain(request, {
        env: baseEnv,
        fetchImpl: async () => {
            calls += 1;
            return calls === 1 ? new Response('not-json', { status: 200 }) : compatibleSuccess('groq');
        },
    });
    assert.equal(result.provider, 'groq');
    assert.equal(calls, 2);
});

test('BRAIN_MAX_ATTEMPTS strictly bounds provider attempts', async () => {
    let calls = 0;
    await assert.rejects(
        reasonWithBrain(request, {
            env: { ...baseEnv, BRAIN_MAX_ATTEMPTS: '2' },
            fetchImpl: async () => {
                calls += 1;
                return new Response(JSON.stringify({ error: { message: 'temporary outage' } }), { status: 503 });
            },
        }),
        (error) => {
            assert.equal(error instanceof BrainRouterError, true);
            assert.deepEqual(error.attemptedProviders, ['gemini', 'groq']);
            return true;
        },
    );
    assert.equal(calls, 2);
});

test('safety rejections never fall back', async () => {
    let calls = 0;
    await assert.rejects(
        reasonWithBrain(request, {
            env: baseEnv,
            fetchImpl: async () => {
                calls += 1;
                return new Response(JSON.stringify({
                    candidates: [{ content: { parts: [] }, finishReason: 'SAFETY' }],
                }), { status: 200 });
            },
        }),
        (error) => error.code === 'safety_rejection' && error.attemptedProviders.length === 1,
    );
    assert.equal(calls, 1);
});

test('invalid provider credentials and rejected input never fall back', async () => {
    for (const [status, code] of [[401, 'provider_credentials'], [400, 'provider_rejected']]) {
        let calls = 0;
        await assert.rejects(
            reasonWithBrain(request, {
                env: baseEnv,
                fetchImpl: async () => {
                    calls += 1;
                    return new Response(JSON.stringify({ error: { message: 'request rejected' } }), { status });
                },
            }),
            (error) => error.code === code,
        );
        assert.equal(calls, 1);
    }
});

test('invalid requests are rejected before any provider call', async () => {
    let calls = 0;
    await assert.rejects(
        reasonWithBrain({ task: '', sensitivity: 'NORMAL' }, {
            env: baseEnv,
            fetchImpl: async () => { calls += 1; return geminiSuccess(); },
        }),
        (error) => error.code === 'invalid_request',
    );
    assert.equal(calls, 0);
});

test('internal brain callers retain the repository content-safety boundary', async () => {
    let calls = 0;
    await assert.rejects(
        reasonWithBrain({
            task: 'Create explicit sexual content involving a child.',
            sensitivity: 'NORMAL',
        }, {
            env: { ...baseEnv, CONTENT_SAFETY_MODE: 'enforce' },
            fetchImpl: async () => { calls += 1; return geminiSuccess(); },
        }),
        (error) => error.code === 'safety_rejection',
    );
    assert.equal(calls, 0);
});

test('missing primary configuration stops instead of silently sending work elsewhere', async () => {
    let calls = 0;
    await assert.rejects(
        reasonWithBrain(request, {
            env: { ...baseEnv, GEMINI_API_KEY: '' },
            fetchImpl: async () => { calls += 1; return compatibleSuccess('groq'); },
        }),
        (error) => error.code === 'provider_configuration_missing' && error.provider === 'gemini',
    );
    assert.equal(calls, 0);
});

test('sensitive work fails closed when no reviewed provider is eligible', async () => {
    let calls = 0;
    await assert.rejects(
        reasonWithBrain({ ...request, sensitivity: 'CLIENT_CONFIDENTIAL' }, {
            env: baseEnv,
            fetchImpl: async () => { calls += 1; return geminiSuccess(); },
        }),
        (error) => error.code === 'sensitivity_provider_unavailable',
    );
    assert.equal(calls, 0);
});

test('sensitivity routing only calls an explicitly reviewed eligible provider', async () => {
    const calls = [];
    const result = await reasonWithBrain({ ...request, sensitivity: 'PRIVATE' }, {
        env: { ...baseEnv, BRAIN_PRIVATE_ELIGIBLE_PROVIDERS: 'groq' },
        fetchImpl: async (url) => {
            calls.push(url);
            return compatibleSuccess('groq');
        },
    });
    assert.equal(result.provider, 'groq');
    assert.deepEqual(calls, ['https://api.groq.com/openai/v1/chat/completions']);
});

test('paid-generation and publishing classifications disable automatic fallback', async () => {
    for (const sideEffect of ['paid-generation', 'publishing']) {
        let calls = 0;
        await assert.rejects(
            reasonWithBrain({ ...request, sideEffect }, {
                env: baseEnv,
                fetchImpl: async () => {
                    calls += 1;
                    return new Response(JSON.stringify({ error: { message: 'quota' } }), { status: 429 });
                },
            }),
            (error) => error.code === 'provider_capacity',
        );
        assert.equal(calls, 1);
    }
});

test('structured output is normalized without leaking provider-specific shapes', async () => {
    const result = await reasonWithBrain({
        ...request,
        desiredOutput: {
            type: 'json',
            schema: {
                type: 'object',
                properties: { title: { type: 'string' } },
                required: ['title'],
            },
        },
    }, {
        env: baseEnv,
        fetchImpl: async () => geminiSuccess('{"title":"Launch"}'),
    });
    assert.deepEqual(result.structuredOutput, { title: 'Launch' });
});

test('brain status distinguishes build and configuration without exposing secrets', () => {
    const configuration = getBrainConfiguration(baseEnv);
    const providers = brainProviderStatuses(baseEnv);
    const router = brainRouterStatus(baseEnv);
    const serialized = JSON.stringify({ configuration, providers, router });

    assert.equal(configuration.selectedProvider, 'gemini');
    assert.deepEqual(configuration.fallbackOrder, ['gemini', 'groq', 'openrouter']);
    assert.equal(router.configured, true);
    assert.equal(router.built, true);
    assert.equal(router.selectedProvider, 'gemini');
    assert.equal(providers.find((provider) => provider.id === 'anthropic').inFallbackOrder, false);
    for (const key of [
        baseEnv.GEMINI_API_KEY,
        baseEnv.GROQ_API_KEY,
        baseEnv.OPENROUTER_API_KEY,
        baseEnv.ANTHROPIC_API_KEY,
    ]) assert.equal(serialized.includes(key), false);
});

test('brain errors serialize only safe routing metadata', () => {
    const failure = brainErrorResponse(new BrainRouterError(
        'provider_credentials',
        'Google Gemini rejected its server-side credentials.',
        502,
        { provider: 'gemini', attemptedProviders: ['gemini'] },
    ));
    assert.deepEqual(failure, {
        status: 502,
        body: {
            error: 'Google Gemini rejected its server-side credentials.',
            code: 'provider_credentials',
            provider: 'gemini',
            attemptedProviders: ['gemini'],
        },
    });
});
