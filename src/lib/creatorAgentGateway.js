// Creator-authenticated adapter around the EXISTING MuAPI Agent Blueprints API.
// This intentionally reuses the Agent functions already implemented in
// packages/studio/src/muapi.js (getUserAgents/createAgent/sendAgentChatMessage/
// pollAgentChatResult/getAgentConversation) rather than re-implementing any Agent
// networking. It mirrors the authorize -> server-owned-key -> act pattern already
// established by creatorMuapiProxy.js / muapiCreatorProvider.js for image/video.
//
// The model never supplies a raw external agent id: every call here is keyed by
// one of the fixed internal ids in creatorAgentRegistry.js, resolved server-side
// to the matching MuAPI agent by exact provisioned name.
import {
    createAgent,
    getAgentConversation,
    getUserAgents,
    pollAgentChatResult,
    sendAgentChatMessage,
} from 'studio/src/muapi.js';

import { creatorAgentDefinition, listEnabledCreatorAgents, publicCreatorAgent } from './creatorAgentRegistry.js';
import { muapiConfiguration } from './muapiCreatorProvider.js';

const AGENT_CACHE_TTL_MS = 5 * 60 * 1000;
const OPAQUE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,139}$/;
const MAX_TASK_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 1200;

export class CreatorAgentError extends Error {
    constructor(code, message, status = 400) {
        super(message);
        this.name = 'CreatorAgentError';
        this.code = code;
        this.status = status;
    }
}

function agentCacheStore() {
    const key = Symbol.for('open-generative-ai.creator-agent-cache');
    if (!globalThis[key]) globalThis[key] = new Map();
    return globalThis[key];
}

// Test-only hook, mirroring rateLimit.js's resetRateLimitStore, so test suites
// don't leak resolved agent slugs across otherwise-independent test cases.
export function resetCreatorAgentCache() {
    agentCacheStore().clear();
}

function requireConfiguredMuapi(env) {
    const configuration = muapiConfiguration(env);
    if (!configuration.configured) {
        throw new CreatorAgentError('agent_provider_unconfigured', 'The Creator Agent Team requires the safe active MuAPI configuration.', 503);
    }
    return configuration;
}

async function listExternalAgents(apiKey) {
    const agents = await getUserAgents(apiKey);
    return Array.isArray(agents) ? agents : [];
}

function matchByProvisionName(externalAgents, provisionName) {
    return externalAgents.find((agent) => typeof agent?.name === 'string' && agent.name.trim() === provisionName) || null;
}

// The app's own AgentStudio.jsx treats `agent_id` (falling back to `id`) as the
// identifier used in Agent chat/detail calls — mirrored here rather than assuming
// a `slug` field, since MuAPI's Agent objects do not expose one directly.
function externalAgentSlug(agent) {
    const candidate = agent?.agent_id || agent?.id || agent?.slug;
    return typeof candidate === 'string' && OPAQUE_ID_PATTERN.test(candidate) ? candidate : null;
}

function boundedTask(value) {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) throw new CreatorAgentError('invalid_task', 'A task is required to delegate to a Creator Team agent.');
    if (text.length > MAX_TASK_LENGTH) throw new CreatorAgentError('invalid_task', `Task must be ${MAX_TASK_LENGTH} characters or fewer.`);
    return text;
}

function boundedConversationId(value) {
    if (value == null || value === '') return null;
    const id = String(value);
    if (!OPAQUE_ID_PATTERN.test(id)) throw new CreatorAgentError('invalid_conversation', 'Conversation reference is invalid.');
    return id;
}

export async function resolveCreatorAgent(internalId, { env = process.env, forceRefresh = false } = {}) {
    const definition = creatorAgentDefinition(internalId);
    if (!definition || !definition.enabled) {
        throw new CreatorAgentError('agent_unavailable', 'That Creator Team agent is not available.', 404);
    }
    const configuration = requireConfiguredMuapi(env);
    const cache = agentCacheStore();
    const cacheKey = `${configuration.keyMode}:${internalId}`;
    const cached = cache.get(cacheKey);
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
        return { definition, slug: cached.slug };
    }
    const externalAgents = await listExternalAgents(configuration.apiKey);
    const match = matchByProvisionName(externalAgents, definition.provisionName);
    const slug = match ? externalAgentSlug(match) : null;
    if (!slug) {
        throw new CreatorAgentError('agent_not_provisioned', 'That Creator Team agent has not been provisioned yet.', 409);
    }
    cache.set(cacheKey, { slug, expiresAt: Date.now() + AGENT_CACHE_TTL_MS });
    return { definition, slug };
}

// Idempotent: reuses any existing MuAPI agent whose name already matches a
// registry entry's provisionName, and only calls createAgent for entries with
// no match. Safe to call repeatedly; never creates a duplicate.
export async function ensureCreatorAgents({ env = process.env } = {}) {
    const configuration = requireConfiguredMuapi(env);
    const externalAgents = await listExternalAgents(configuration.apiKey);
    const cache = agentCacheStore();
    const results = [];
    for (const definition of listEnabledCreatorAgents()) {
        const existing = matchByProvisionName(externalAgents, definition.provisionName);
        const existingSlug = existing ? externalAgentSlug(existing) : null;
        if (existingSlug) {
            results.push({ id: definition.id, provisionName: definition.provisionName, status: 'existing', slug: existingSlug });
            cache.set(`${configuration.keyMode}:${definition.id}`, { slug: existingSlug, expiresAt: Date.now() + AGENT_CACHE_TTL_MS });
            continue;
        }
        const created = await createAgent(configuration.apiKey, {
            name: definition.provisionName,
            description: definition.description,
            system_prompt: definition.systemPrompt,
            welcome_message: definition.welcomeMessage,
            skill_ids: [...definition.skillIds],
        });
        const slug = externalAgentSlug(created);
        if (!slug) {
            throw new CreatorAgentError('agent_provision_failed', `Provisioning ${definition.label} did not return a usable agent id.`, 502);
        }
        results.push({ id: definition.id, provisionName: definition.provisionName, status: 'created', slug });
        cache.set(`${configuration.keyMode}:${definition.id}`, { slug, expiresAt: Date.now() + AGENT_CACHE_TTL_MS });
    }
    return results;
}

function mergedTaskMessage(task, contextSummary) {
    const boundedInput = boundedTask(task);
    const boundedContext = typeof contextSummary === 'string' ? contextSummary.trim().slice(0, MAX_CONTEXT_LENGTH) : '';
    if (!boundedContext) return boundedInput;
    return `Project context (reference only, do not restate as fact beyond what is given):\n${boundedContext}\n\nTask:\n${boundedInput}`;
}

// Delegates one bounded task to an existing MuAPI agent and returns its reply.
// Agent chat turns poll the same billed predictions endpoint used by paid media
// generation (see pollAgentChatResult in muapi.js), so callers MUST treat this as
// cost-incurring and gate it behind the same approval flow as image/video generation.
export async function delegateToCreatorAgent(internalId, { task, contextSummary, conversationId, env = process.env } = {}) {
    const boundedInput = mergedTaskMessage(task, contextSummary);
    const boundedConversation = boundedConversationId(conversationId);
    const { definition, slug } = await resolveCreatorAgent(internalId, { env });
    const configuration = requireConfiguredMuapi(env);
    let submission;
    try {
        submission = await sendAgentChatMessage(configuration.apiKey, slug, { message: boundedInput, conversationId: boundedConversation });
    } catch {
        throw new CreatorAgentError('agent_dispatch_failed', 'The Creator Team agent could not accept this task right now.', 502);
    }
    if (!submission?.request_id) {
        throw new CreatorAgentError('agent_dispatch_failed', 'The Creator Team agent did not accept this task.', 502);
    }
    let result;
    try {
        result = await pollAgentChatResult(configuration.apiKey, submission.request_id);
    } catch {
        throw new CreatorAgentError('agent_result_failed', 'The Creator Team agent did not return a result in time.', 502);
    }
    const messages = Array.isArray(result?.messages) ? result.messages : [];
    const reply = [...messages].reverse().find((message) => message?.role === 'assistant' && typeof message?.content === 'string' && message.content.trim());
    return {
        agentId: definition.id,
        label: definition.label,
        conversationId: result?.conversation_id || boundedConversation || null,
        message: reply ? reply.content.trim().slice(0, 12_000) : 'The agent did not return a text reply.',
    };
}

export async function fetchCreatorAgentConversation(internalId, conversationId, { env = process.env } = {}) {
    const boundedConversation = boundedConversationId(conversationId);
    if (!boundedConversation) throw new CreatorAgentError('invalid_conversation', 'A conversation reference is required.');
    const { slug } = await resolveCreatorAgent(internalId, { env });
    const configuration = requireConfiguredMuapi(env);
    let result;
    try {
        result = await getAgentConversation(configuration.apiKey, slug, boundedConversation);
    } catch {
        throw new CreatorAgentError('agent_conversation_unavailable', 'That conversation could not be loaded.', 502);
    }
    const messages = Array.isArray(result?.messages) ? result.messages : [];
    return {
        conversationId: boundedConversation,
        messages: messages
            .filter((message) => message?.role === 'assistant' || message?.role === 'user')
            .slice(-50)
            .map((message) => ({ role: message.role, text: typeof message.content === 'string' ? message.content.slice(0, 12_000) : '' })),
    };
}

export function listCreatorAgentCatalog() {
    return listEnabledCreatorAgents().map(publicCreatorAgent);
}
