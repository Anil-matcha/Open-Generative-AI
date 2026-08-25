import { evaluateJsonSafety } from './contentSafety.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const DEFAULT_TIMEOUT_MS = 45_000;
const MAX_PROVIDER_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_TASK_CHARACTERS = 20_000;
const MAX_CONTEXT_CHARACTERS = 30_000;
const MAX_INSTRUCTIONS_CHARACTERS = 20_000;
const MAX_TOOLS = 20;

export const BRAIN_PROVIDER_IDS = Object.freeze([
    'gemini',
    'groq',
    'openrouter',
    'anthropic',
]);

export const BRAIN_SENSITIVITIES = Object.freeze([
    'PUBLIC',
    'NORMAL',
    'PRIVATE',
    'CLIENT_CONFIDENTIAL',
]);

export const DEFAULT_BRAIN_MODELS = Object.freeze({
    gemini: 'gemini-3.7-flash',
    groq: 'openai/gpt-oss-120b',
    openrouter: 'openrouter/free',
    anthropic: 'claude-sonnet-5',
});

const PROVIDER_DEFINITIONS = Object.freeze({
    gemini: Object.freeze({
        id: 'gemini',
        label: 'Google Gemini',
        keyVariable: 'GEMINI_API_KEY',
        modelVariable: 'GEMINI_MODEL',
    }),
    groq: Object.freeze({
        id: 'groq',
        label: 'Groq',
        keyVariable: 'GROQ_API_KEY',
        modelVariable: 'GROQ_MODEL',
    }),
    openrouter: Object.freeze({
        id: 'openrouter',
        label: 'OpenRouter',
        keyVariable: 'OPENROUTER_API_KEY',
        modelVariable: 'OPENROUTER_MODEL',
    }),
    anthropic: Object.freeze({
        id: 'anthropic',
        label: 'Anthropic',
        keyVariable: 'ANTHROPIC_API_KEY',
        modelVariable: 'ANTHROPIC_MODEL',
    }),
});

const MODE_INSTRUCTIONS = Object.freeze({
    plan: 'Return a concise, executable production plan with ordered steps and provider recommendations.',
    script: 'Return production-ready narration or dialogue plus a brief shot plan.',
    prompt: 'Return polished generation prompts tailored to the requested production tools.',
    strategy: 'Act as the creative director: clarify the goal, recommend a workflow, and provide the strongest next action.',
    route: 'Select the best existing agent or tool for the task and explain the routing decision briefly.',
    'research-plan': 'Return a verification-first research plan. Distinguish known facts, assumptions, and evidence still needed.',
    'content-plan': 'Return a practical content plan with audience, format, sequence, and reuse opportunities.',
    'creative-direction': 'Return creative direction covering the core idea, tone, visual language, and production priorities.',
    'budget-plan': 'Recommend a cost-aware production approach without authorizing or initiating any spending.',
    'tool-selection': 'Recommend existing tools based on capability, quality, consistency, prompt fit, and cost. Do not execute them.',
    'result-evaluation': 'Evaluate the supplied result against the stated objective and identify the smallest useful revision.',
});

const SIDE_EFFECT_MODES = new Set([
    'external-mutation',
    'paid-generation',
    'publishing',
]);

function normalizedSecret(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function isConfigured(value) {
    return normalizedSecret(value).length > 0;
}

function parseProviderList(value, fallback = []) {
    const source = typeof value === 'string' ? value.split(',') : fallback;
    const providers = [];
    for (const entry of source) {
        const provider = String(entry).trim().toLowerCase();
        if (BRAIN_PROVIDER_IDS.includes(provider) && !providers.includes(provider)) providers.push(provider);
    }
    return providers;
}

function strictBoolean(value, fallback) {
    if (value == null || value === '') return { value: fallback };
    if (String(value).toLowerCase() === 'true') return { value: true };
    if (String(value).toLowerCase() === 'false') return { value: false };
    return { error: 'BRAIN_ENABLE_AUTOMATIC_FALLBACK must be true or false.' };
}

function strictAttempts(value) {
    if (value == null || value === '') return { value: 3 };
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > BRAIN_PROVIDER_IDS.length) {
        return { error: `BRAIN_MAX_ATTEMPTS must be an integer from 1 to ${BRAIN_PROVIDER_IDS.length}.` };
    }
    return { value: parsed };
}

function modelFor(provider, env) {
    const definition = PROVIDER_DEFINITIONS[provider];
    return normalizedSecret(env[definition.modelVariable]) || DEFAULT_BRAIN_MODELS[provider];
}

function providerKey(provider, env) {
    return normalizedSecret(env[PROVIDER_DEFINITIONS[provider].keyVariable]);
}

function parseSensitivityProviders(env, sensitivity) {
    if (sensitivity === 'PUBLIC' || sensitivity === 'NORMAL') return [...BRAIN_PROVIDER_IDS];
    if (sensitivity === 'PRIVATE') {
        return parseProviderList(env.BRAIN_PRIVATE_ELIGIBLE_PROVIDERS);
    }
    return parseProviderList(env.BRAIN_CLIENT_CONFIDENTIAL_ELIGIBLE_PROVIDERS);
}

export function getBrainConfiguration(env = process.env) {
    const selectedProvider = normalizedSecret(env.BRAIN_PROVIDER).toLowerCase() || 'gemini';
    const fallback = strictBoolean(env.BRAIN_ENABLE_AUTOMATIC_FALLBACK, true);
    const attempts = strictAttempts(env.BRAIN_MAX_ATTEMPTS);
    const rawFallbackEntries = typeof env.BRAIN_FALLBACK_ORDER === 'string'
        ? env.BRAIN_FALLBACK_ORDER.split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean)
        : [];
    const configuredOrder = env.BRAIN_FALLBACK_ORDER == null || env.BRAIN_FALLBACK_ORDER === ''
        ? ['gemini', 'groq', 'openrouter']
        : parseProviderList(env.BRAIN_FALLBACK_ORDER);
    const errors = [];

    if (!BRAIN_PROVIDER_IDS.includes(selectedProvider)) {
        errors.push('BRAIN_PROVIDER must name a supported brain provider.');
    }
    if (env.BRAIN_FALLBACK_ORDER != null && env.BRAIN_FALLBACK_ORDER !== '' && configuredOrder.length === 0) {
        errors.push('BRAIN_FALLBACK_ORDER must contain at least one supported provider.');
    }
    if (rawFallbackEntries.some((provider) => !BRAIN_PROVIDER_IDS.includes(provider))) {
        errors.push('BRAIN_FALLBACK_ORDER contains an unsupported provider.');
    }
    if (fallback.error) errors.push(fallback.error);
    if (attempts.error) errors.push(attempts.error);

    const fallbackOrder = [];
    for (const provider of [selectedProvider, ...configuredOrder]) {
        if (BRAIN_PROVIDER_IDS.includes(provider) && !fallbackOrder.includes(provider)) fallbackOrder.push(provider);
    }

    return Object.freeze({
        selectedProvider,
        fallbackOrder: Object.freeze(fallbackOrder),
        automaticFallback: fallback.value ?? false,
        maxAttempts: attempts.value ?? 1,
        valid: errors.length === 0,
        errors: Object.freeze(errors),
    });
}

export function brainProviderStatuses(env = process.env) {
    const configuration = getBrainConfiguration(env);
    const privateProviders = parseSensitivityProviders(env, 'PRIVATE');
    const confidentialProviders = parseSensitivityProviders(env, 'CLIENT_CONFIDENTIAL');
    return BRAIN_PROVIDER_IDS.map((provider) => {
        const definition = PROVIDER_DEFINITIONS[provider];
        const configured = isConfigured(env[definition.keyVariable]);
        return {
            id: provider,
            label: definition.label,
            category: 'brain',
            capability: 'Reasoning',
            built: true,
            configured,
            tested: false,
            productionReady: false,
            selected: configuration.selectedProvider === provider,
            inFallbackOrder: configuration.fallbackOrder.includes(provider),
            model: modelFor(provider, env),
            sensitivityEligibility: {
                public: true,
                normal: true,
                private: privateProviders.includes(provider),
                clientConfidential: confidentialProviders.includes(provider),
            },
        };
    });
}

export function brainRouterStatus(env = process.env) {
    const configuration = getBrainConfiguration(env);
    const providers = brainProviderStatuses(env);
    const selected = providers.find((provider) => provider.id === configuration.selectedProvider);
    return {
        id: 'brain',
        label: 'Selena Brain',
        category: 'brain-router',
        capability: 'Provider-neutral reasoning',
        built: true,
        configured: configuration.valid && selected?.configured === true,
        tested: false,
        productionReady: false,
        selectedProvider: configuration.selectedProvider,
        model: selected?.model || null,
        fallbackEnabled: configuration.automaticFallback,
        fallbackOrder: configuration.fallbackOrder,
        maxAttempts: configuration.maxAttempts,
        configurationValid: configuration.valid,
        ...(configuration.valid ? {} : { configurationErrors: configuration.errors }),
    };
}

function boundedString(value, name, maximum, { required = false } = {}) {
    if (value == null) {
        if (required) throw new BrainRouterError('invalid_request', `${name} is required.`, 400);
        return '';
    }
    if (typeof value !== 'string') throw new BrainRouterError('invalid_request', `${name} must be text.`, 400);
    const normalized = value.trim();
    if (required && !normalized) throw new BrainRouterError('invalid_request', `${name} is required.`, 400);
    if (normalized.length > maximum) {
        throw new BrainRouterError('invalid_request', `${name} must be ${maximum} characters or fewer.`, 400);
    }
    return normalized;
}

function boundedJson(value, name, maximum) {
    if (value == null) return { value: null, text: '' };
    if (typeof value === 'string') {
        return { value, text: boundedString(value, name, maximum) };
    }
    let text;
    try {
        text = JSON.stringify(value);
    } catch {
        throw new BrainRouterError('invalid_request', `${name} must be JSON serializable.`, 400);
    }
    if (text.length > maximum) {
        throw new BrainRouterError('invalid_request', `${name} must be ${maximum} characters or fewer when serialized.`, 400);
    }
    return { value, text };
}

function normalizeTools(value) {
    if (value == null) return [];
    if (!Array.isArray(value) || value.length > MAX_TOOLS) {
        throw new BrainRouterError('invalid_request', `Tools must be an array of at most ${MAX_TOOLS} definitions.`, 400);
    }
    return value.map((tool, index) => {
        if (!tool || typeof tool !== 'object' || Array.isArray(tool)) {
            throw new BrainRouterError('invalid_request', `Tool ${index + 1} must be an object.`, 400);
        }
        const name = boundedString(tool.name, `Tool ${index + 1} name`, 64, { required: true });
        if (!/^[A-Za-z0-9_-]+$/.test(name)) {
            throw new BrainRouterError('invalid_request', `Tool ${index + 1} name is invalid.`, 400);
        }
        const description = boundedString(tool.description || '', `Tool ${index + 1} description`, 2000);
        const schema = boundedJson(
            tool.inputSchema || { type: 'object', properties: {} },
            `Tool ${index + 1} input schema`,
            10_000,
        ).value;
        if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
            throw new BrainRouterError('invalid_request', `Tool ${index + 1} input schema must be an object.`, 400);
        }
        return { name, description, inputSchema: schema };
    });
}

function normalizeDesiredOutput(value) {
    if (value == null || value === '' || value === 'text') return { type: 'text', schema: null };
    if (value === 'json') return { type: 'json', schema: null };
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new BrainRouterError('invalid_request', 'Desired output must be text, json, or a JSON output definition.', 400);
    }
    const type = value.type === 'structured' ? 'json' : value.type;
    if (type !== 'text' && type !== 'json') {
        throw new BrainRouterError('invalid_request', 'Desired output type must be text or json.', 400);
    }
    const schema = value.schema == null
        ? null
        : boundedJson(value.schema, 'Desired output schema', 15_000).value;
    if (schema != null && (typeof schema !== 'object' || Array.isArray(schema))) {
        throw new BrainRouterError('invalid_request', 'Desired output schema must be an object.', 400);
    }
    return { type, schema };
}

export function normalizeBrainRequest(request) {
    if (!request || typeof request !== 'object' || Array.isArray(request)) {
        throw new BrainRouterError('invalid_request', 'A brain request object is required.', 400);
    }
    const task = boundedString(request.task, 'Task', MAX_TASK_CHARACTERS, { required: true });
    const instructions = boundedString(request.instructions || '', 'Instructions', MAX_INSTRUCTIONS_CHARACTERS);
    const context = boundedJson(request.context, 'Context', MAX_CONTEXT_CHARACTERS);
    const mode = boundedString(request.mode || 'strategy', 'Mode', 64).toLowerCase();
    if (!/^[a-z][a-z0-9-]*$/.test(mode)) {
        throw new BrainRouterError('invalid_request', 'Mode is invalid.', 400);
    }
    const sensitivity = boundedString(request.sensitivity || 'NORMAL', 'Sensitivity', 32).toUpperCase();
    if (!BRAIN_SENSITIVITIES.includes(sensitivity)) {
        throw new BrainRouterError('invalid_request', 'Sensitivity must be PUBLIC, NORMAL, PRIVATE, or CLIENT_CONFIDENTIAL.', 400);
    }
    const agent = boundedString(request.agent || '', 'Agent', 120);
    const sideEffect = boundedString(request.sideEffect || 'none', 'Side effect', 40).toLowerCase();
    return Object.freeze({
        task,
        instructions,
        context: context.value,
        contextText: context.text,
        mode,
        sensitivity,
        agent,
        tools: Object.freeze(normalizeTools(request.tools)),
        desiredOutput: Object.freeze(normalizeDesiredOutput(request.desiredOutput)),
        fallbackAllowed: request.allowFallback !== false &&
            request.requiresExplicitApproval !== true &&
            !SIDE_EFFECT_MODES.has(sideEffect),
    });
}

function modeInstruction(mode) {
    return MODE_INSTRUCTIONS[mode] || `Complete the requested ${mode} reasoning task using the supplied context.`;
}

function brainPrompts(request, env) {
    const system = [
        env.BRAIN_SYSTEM_PROMPT ||
            'You are a reasoning engine used by Selena and the existing G.FURY Creator Studio agents. Reason and recommend; never claim that a media generation, purchase, deployment, publication, or other external action occurred unless a tool result explicitly confirms it.',
        request.agent ? `You are supporting the existing agent named: ${request.agent}.` : '',
        modeInstruction(request.mode),
        request.instructions,
        request.desiredOutput.type === 'json'
            ? 'Return valid JSON matching the requested schema when one is supplied.'
            : '',
    ].filter(Boolean).join('\n\n');
    const user = [
        `Task:\n${request.task}`,
        request.contextText ? `Context:\n${request.contextText}` : '',
    ].filter(Boolean).join('\n\n');
    return { system, user };
}

function openAiTools(tools) {
    return tools.map((tool) => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
        },
    }));
}

function geminiTools(tools) {
    return tools.length === 0 ? undefined : [{
        functionDeclarations: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parametersJsonSchema: tool.inputSchema,
        })),
    }];
}

function anthropicTools(tools) {
    return tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
    }));
}

function safeJsonParse(value) {
    if (typeof value !== 'string') return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function normalizedUsage(inputTokens, outputTokens, totalTokens) {
    const input = Number.isFinite(Number(inputTokens)) ? Number(inputTokens) : null;
    const output = Number.isFinite(Number(outputTokens)) ? Number(outputTokens) : null;
    const total = Number.isFinite(Number(totalTokens))
        ? Number(totalTokens)
        : input != null && output != null ? input + output : null;
    return { inputTokens: input, outputTokens: output, totalTokens: total };
}

function normalizeStructuredOutput(text, desiredOutput) {
    if (desiredOutput.type !== 'json') return null;
    const parsed = safeJsonParse(text);
    if (parsed == null) {
        throw new BrainRouterError(
            'malformed_provider_response',
            'The reasoning provider returned malformed structured output.',
            502,
            { fallbackEligible: true },
        );
    }
    return parsed;
}

function isSafetyReason(value) {
    return typeof value === 'string' && /safety|blocked|content[_ -]?filter|prohibited|policy violation|refusal/i.test(value);
}

function upstreamErrorText(value) {
    const values = [
        value?.error?.message,
        value?.error?.detail,
        value?.message,
        value?.detail,
        value?.promptFeedback?.blockReason,
    ];
    return values.find((entry) => typeof entry === 'string') || '';
}

function providerHttpError(provider, status, value) {
    const label = PROVIDER_DEFINITIONS[provider].label;
    const upstream = upstreamErrorText(value);
    if (status === 429) {
        return new BrainRouterError('provider_capacity', `${label} is temporarily rate limited or out of quota.`, 429, {
            provider,
            fallbackEligible: true,
        });
    }
    if (status === 408 || status >= 500) {
        return new BrainRouterError('provider_unavailable', `${label} is temporarily unavailable.`, 502, {
            provider,
            fallbackEligible: true,
        });
    }
    if (status === 401 || status === 403) {
        return new BrainRouterError('provider_credentials', `${label} rejected its server-side credentials.`, 502, {
            provider,
        });
    }
    if (isSafetyReason(upstream)) {
        return new BrainRouterError('safety_rejection', `${label} rejected the request for safety reasons.`, 422, {
            provider,
        });
    }
    if (/unsupported|not supported|does not support|capability/i.test(upstream)) {
        return new BrainRouterError('unsupported_capability', `${label} does not support a required capability.`, 422, {
            provider,
            fallbackEligible: true,
        });
    }
    if (status === 404) {
        return new BrainRouterError('provider_configuration', `${label} rejected the configured model or endpoint.`, 502, {
            provider,
        });
    }
    return new BrainRouterError('provider_rejected', `${label} rejected the reasoning request.`, 422, {
        provider,
    });
}

async function readJsonResponse(response, provider) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_PROVIDER_RESPONSE_BYTES) {
        throw new BrainRouterError('malformed_provider_response', `${PROVIDER_DEFINITIONS[provider].label} returned an oversized response.`, 502, {
            provider,
            fallbackEligible: true,
        });
    }
    const value = safeJsonParse(text);
    if (value == null) {
        throw new BrainRouterError('malformed_provider_response', `${PROVIDER_DEFINITIONS[provider].label} returned an invalid response.`, 502, {
            provider,
            fallbackEligible: true,
        });
    }
    if (!response.ok) throw providerHttpError(provider, response.status, value);
    return value;
}

async function providerFetch(provider, fetchImpl, url, options) {
    let response;
    try {
        response = await fetchImpl(url, {
            ...options,
            redirect: 'error',
            signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
        });
    } catch (error) {
        const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
        throw new BrainRouterError(
            timedOut ? 'provider_timeout' : 'provider_unavailable',
            timedOut
                ? `${PROVIDER_DEFINITIONS[provider].label} request timed out.`
                : `${PROVIDER_DEFINITIONS[provider].label} is temporarily unavailable.`,
            timedOut ? 504 : 502,
            { provider, fallbackEligible: true },
        );
    }
    return readJsonResponse(response, provider);
}

function resultOrMalformed(provider, result) {
    if (result.text || result.toolCalls.length > 0) return result;
    throw new BrainRouterError(
        'malformed_provider_response',
        `${PROVIDER_DEFINITIONS[provider].label} returned no reasoning result.`,
        502,
        { provider, fallbackEligible: true },
    );
}

async function callGemini(request, { env, fetchImpl, model, key }) {
    const prompts = brainPrompts(request, env);
    const generationConfig = { maxOutputTokens: 4096 };
    if (request.desiredOutput.type === 'json') {
        generationConfig.responseMimeType = 'application/json';
        if (request.desiredOutput.schema) generationConfig.responseJsonSchema = request.desiredOutput.schema;
    }
    const body = {
        systemInstruction: { parts: [{ text: prompts.system }] },
        contents: [{ role: 'user', parts: [{ text: prompts.user }] }],
        generationConfig,
    };
    const tools = geminiTools(request.tools);
    if (tools) body.tools = tools;

    const value = await providerFetch(
        'gemini',
        fetchImpl,
        `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`,
        {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify(body),
        },
    );
    const candidate = value?.candidates?.[0];
    if (isSafetyReason(value?.promptFeedback?.blockReason) || isSafetyReason(candidate?.finishReason)) {
        throw new BrainRouterError('safety_rejection', 'Google Gemini rejected the request for safety reasons.', 422, {
            provider: 'gemini',
        });
    }
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
        .filter((part) => typeof part?.text === 'string')
        .map((part) => part.text)
        .join('\n')
        .trim();
    const toolCalls = parts
        .filter((part) => part?.functionCall && typeof part.functionCall.name === 'string')
        .map((part, index) => ({
            id: `gemini-call-${index + 1}`,
            name: part.functionCall.name,
            arguments: part.functionCall.args && typeof part.functionCall.args === 'object'
                ? part.functionCall.args
                : {},
        }));
    const usage = value?.usageMetadata || {};
    return resultOrMalformed('gemini', {
        provider: 'gemini',
        model: value?.modelVersion || model,
        text,
        structuredOutput: normalizeStructuredOutput(text, request.desiredOutput),
        toolCalls,
        usage: normalizedUsage(usage.promptTokenCount, usage.candidatesTokenCount, usage.totalTokenCount),
        finishReason: candidate?.finishReason || null,
    });
}

function normalizeOpenAiToolCalls(toolCalls, provider) {
    if (!Array.isArray(toolCalls)) return [];
    return toolCalls.map((toolCall, index) => {
        const name = toolCall?.function?.name;
        const args = safeJsonParse(toolCall?.function?.arguments || '{}');
        if (typeof name !== 'string' || !args || typeof args !== 'object' || Array.isArray(args)) {
            throw new BrainRouterError(
                'malformed_provider_response',
                `${PROVIDER_DEFINITIONS[provider].label} returned a malformed tool call.`,
                502,
                { provider, fallbackEligible: true },
            );
        }
        return {
            id: typeof toolCall.id === 'string' ? toolCall.id : `${provider}-call-${index + 1}`,
            name,
            arguments: args,
        };
    });
}

function openAiResponseFormat(request) {
    if (request.desiredOutput.type !== 'json') return undefined;
    if (!request.desiredOutput.schema) return { type: 'json_object' };
    return {
        type: 'json_schema',
        json_schema: {
            name: 'brain_response',
            strict: false,
            schema: request.desiredOutput.schema,
        },
    };
}

async function callOpenAiCompatible(provider, request, { env, fetchImpl, model, key }) {
    const prompts = brainPrompts(request, env);
    const url = provider === 'groq' ? GROQ_API_URL : OPENROUTER_API_URL;
    const body = {
        model,
        messages: [
            { role: 'system', content: prompts.system },
            { role: 'user', content: prompts.user },
        ],
        max_tokens: 4096,
    };
    if (request.tools.length > 0) body.tools = openAiTools(request.tools);
    const responseFormat = openAiResponseFormat(request);
    if (responseFormat) body.response_format = responseFormat;
    const headers = {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
    };
    if (provider === 'openrouter') {
        headers['http-referer'] = normalizedSecret(env.OPENROUTER_SITE_URL) || 'https://open-generative-ai-lemon.vercel.app';
        headers['x-title'] = normalizedSecret(env.OPENROUTER_APP_NAME) || 'G.FURY Creator Studio';
    }
    const value = await providerFetch(provider, fetchImpl, url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    const choice = value?.choices?.[0];
    if (choice?.message?.refusal || isSafetyReason(choice?.finish_reason)) {
        throw new BrainRouterError('safety_rejection', `${PROVIDER_DEFINITIONS[provider].label} rejected the request for safety reasons.`, 422, {
            provider,
        });
    }
    const content = choice?.message?.content;
    const text = typeof content === 'string'
        ? content.trim()
        : Array.isArray(content)
            ? content.filter((part) => typeof part?.text === 'string').map((part) => part.text).join('\n').trim()
            : '';
    const toolCalls = normalizeOpenAiToolCalls(choice?.message?.tool_calls, provider);
    const usage = value?.usage || {};
    return resultOrMalformed(provider, {
        provider,
        model: typeof value?.model === 'string' ? value.model : model,
        text,
        structuredOutput: normalizeStructuredOutput(text, request.desiredOutput),
        toolCalls,
        usage: normalizedUsage(usage.prompt_tokens, usage.completion_tokens, usage.total_tokens),
        finishReason: choice?.finish_reason || null,
    });
}

async function callAnthropic(request, { env, fetchImpl, model, key }) {
    const prompts = brainPrompts(request, {
        ...env,
        BRAIN_SYSTEM_PROMPT: env.BRAIN_SYSTEM_PROMPT || env.ANTHROPIC_ASSISTANT_SYSTEM_PROMPT,
    });
    const body = {
        model,
        max_tokens: Number.isFinite(Number(env.ANTHROPIC_MAX_TOKENS))
            ? Math.min(16_000, Math.max(512, Math.round(Number(env.ANTHROPIC_MAX_TOKENS))))
            : 6000,
        system: prompts.system,
        messages: [{ role: 'user', content: prompts.user }],
    };
    if (request.tools.length > 0) body.tools = anthropicTools(request.tools);
    const value = await providerFetch('anthropic', fetchImpl, ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': env.ANTHROPIC_API_VERSION || '2023-06-01',
        },
        body: JSON.stringify(body),
    });
    if (isSafetyReason(value?.stop_reason)) {
        throw new BrainRouterError('safety_rejection', 'Anthropic rejected the request for safety reasons.', 422, {
            provider: 'anthropic',
        });
    }
    const blocks = Array.isArray(value?.content) ? value.content : [];
    const text = blocks
        .filter((block) => block?.type === 'text' && typeof block.text === 'string')
        .map((block) => block.text)
        .join('\n')
        .trim();
    const toolCalls = blocks
        .filter((block) => block?.type === 'tool_use' && typeof block.name === 'string')
        .map((block, index) => ({
            id: typeof block.id === 'string' ? block.id : `anthropic-call-${index + 1}`,
            name: block.name,
            arguments: block.input && typeof block.input === 'object' && !Array.isArray(block.input)
                ? block.input
                : {},
        }));
    const usage = value?.usage || {};
    return resultOrMalformed('anthropic', {
        provider: 'anthropic',
        model: typeof value?.model === 'string' ? value.model : model,
        text,
        structuredOutput: normalizeStructuredOutput(text, request.desiredOutput),
        toolCalls,
        usage: normalizedUsage(usage.input_tokens, usage.output_tokens),
        finishReason: value?.stop_reason || null,
    });
}

const PROVIDER_CALLERS = Object.freeze({
    gemini: callGemini,
    groq: (request, options) => callOpenAiCompatible('groq', request, options),
    openrouter: (request, options) => callOpenAiCompatible('openrouter', request, options),
    anthropic: callAnthropic,
});

export class BrainRouterError extends Error {
    constructor(code, message, status = 500, {
        provider = null,
        fallbackEligible = false,
        attemptedProviders = [],
    } = {}) {
        super(message);
        this.name = 'BrainRouterError';
        this.code = code;
        this.status = status;
        this.provider = provider;
        this.fallbackEligible = fallbackEligible;
        this.attemptedProviders = attemptedProviders;
    }
}

export function brainErrorResponse(error) {
    if (!(error instanceof BrainRouterError)) {
        return {
            status: 502,
            body: { error: 'The reasoning service is temporarily unavailable.', code: 'brain_unavailable' },
        };
    }
    return {
        status: error.status,
        body: {
            error: error.message,
            code: error.code,
            ...(error.provider ? { provider: error.provider } : {}),
            ...(error.attemptedProviders.length > 0
                ? { attemptedProviders: [...error.attemptedProviders] }
                : {}),
        },
    };
}

export async function reasonWithBrain(request, {
    env = process.env,
    fetchImpl = fetch,
    providerOverride = null,
} = {}) {
    const normalized = normalizeBrainRequest(request);
    const safety = evaluateJsonSafety(JSON.stringify({
        prompt: [
            normalized.task,
            normalized.instructions,
            normalized.contextText,
        ].filter(Boolean).join('\n'),
    }), { env });
    if (!safety.allowed) {
        throw new BrainRouterError(
            'safety_rejection',
            'The reasoning request was blocked by the content safety policy.',
            422,
        );
    }
    const configuration = getBrainConfiguration(env);
    if (!configuration.valid) {
        throw new BrainRouterError('brain_configuration', configuration.errors[0], 503);
    }
    const selectedProvider = providerOverride || configuration.selectedProvider;
    if (!BRAIN_PROVIDER_IDS.includes(selectedProvider)) {
        throw new BrainRouterError('brain_configuration', 'The selected brain provider is unsupported.', 503);
    }
    const configuredOrder = providerOverride
        ? [providerOverride]
        : configuration.automaticFallback && normalized.fallbackAllowed
            ? [selectedProvider, ...configuration.fallbackOrder]
            : [selectedProvider];
    const eligibleProviders = parseSensitivityProviders(env, normalized.sensitivity);
    const order = [];
    for (const provider of configuredOrder) {
        if (eligibleProviders.includes(provider) && !order.includes(provider)) order.push(provider);
    }
    if (order.length === 0) {
        throw new BrainRouterError(
            'sensitivity_provider_unavailable',
            `No eligible reasoning provider is configured for ${normalized.sensitivity} material.`,
            503,
        );
    }

    const attemptedProviders = [];
    let lastError = null;
    for (const provider of order.slice(0, configuration.maxAttempts)) {
        const key = providerKey(provider, env);
        if (!key) {
            throw new BrainRouterError(
                'provider_configuration_missing',
                `${PROVIDER_DEFINITIONS[provider].label} is not configured.`,
                503,
                { provider, attemptedProviders },
            );
        }
        attemptedProviders.push(provider);
        try {
            return await PROVIDER_CALLERS[provider](normalized, {
                env,
                fetchImpl,
                model: modelFor(provider, env),
                key,
            });
        } catch (error) {
            const normalizedError = error instanceof BrainRouterError
                ? error
                : new BrainRouterError('provider_unavailable', `${PROVIDER_DEFINITIONS[provider].label} is temporarily unavailable.`, 502, {
                    provider,
                    fallbackEligible: true,
                });
            lastError = normalizedError;
            if (!normalizedError.fallbackEligible || !configuration.automaticFallback || !normalized.fallbackAllowed) {
                normalizedError.attemptedProviders = [...attemptedProviders];
                throw normalizedError;
            }
        }
    }

    if (lastError) {
        lastError.attemptedProviders = [...attemptedProviders];
        throw lastError;
    }
    throw new BrainRouterError('brain_unavailable', 'No eligible reasoning provider could be attempted.', 503, {
        attemptedProviders,
    });
}
