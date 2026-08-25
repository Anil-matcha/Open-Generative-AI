import { evaluateJsonSafety } from './contentSafety.js';
import { authenticateCreatorRequest, isSameOriginMutation } from './creatorAuth.js';
import {
    brainErrorResponse,
    brainProviderStatuses,
    brainRouterStatus,
    reasonWithBrain,
} from './brainRouter.js';
import {
    ANTHROPIC_ASSISTANT_TOOL_ID,
    BRAIN_REASONING_TOOL_ID,
    ELEVENLABS_VOICE_TOOL_ID,
    OPENAI_IMAGE_TOOL_ID,
    RUNWAY_VIDEO_TOOL_ID,
} from './creatorToolRegistry.js';
import {
    createHeyGenAvatarVideoJob,
    getHeyGenAvatarVideoJob,
    heyGenProviderStatus,
} from './heygenProvider.js';
import { checkRateLimit } from './rateLimit.js';

const DEFAULT_REQUEST_LIMIT = 30;
const DEFAULT_STATUS_LIMIT = 120;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_JSON_BODY_BYTES = 64 * 1024;
const MAX_PROVIDER_JSON_BYTES = 32 * 1024 * 1024;
const MAX_BINARY_BYTES = 32 * 1024 * 1024;

const OPENAI_IMAGE_URL = 'https://api.openai.com/v1/images/generations';
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';
const RUNWAY_API_BASE = 'https://api.dev.runwayml.com/v1';

const IMAGE_SIZES = new Set(['1024x1024', '1024x1536', '1536x1024']);
const IMAGE_QUALITIES = new Set(['low', 'medium', 'high']);
const RUNWAY_RATIOS = new Set([
    '1280:720',
    '720:1280',
    '1280:768',
    '768:1280',
    '1920:1080',
    '1080:1920',
]);
const OPAQUE_ID_PATTERN = /^[A-Za-z0-9_-]{3,200}$/;

function creatorHeaders(extra = {}) {
    return {
        'cache-control': 'no-store',
        'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
        'referrer-policy': 'no-referrer',
        'x-content-type-options': 'nosniff',
        ...extra,
    };
}

export function creatorJson(body, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: creatorHeaders({
            'content-type': 'application/json; charset=utf-8',
            ...extraHeaders,
        }),
    });
}

function boundedNumber(value, fallback, minimum, maximum) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, parsed));
}

function configuredSecret(value, minimumLength = 1) {
    return typeof value === 'string' && value.trim().length >= minimumLength;
}

function normalizedSecret(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function rateLimitValue(env, name, fallback, maximum) {
    return Math.round(boundedNumber(env[name], fallback, 1, maximum));
}

export function authorizeCreatorRequest(request, {
    env = process.env,
    action = 'request',
    statusRequest = false,
} = {}) {
    const authentication = authenticateCreatorRequest(request, { env });
    if (authentication.configurationError) {
        return {
            response: creatorJson({ error: authentication.configurationError }, 503),
        };
    }
    if (!authentication.valid) {
        return {
            response: creatorJson({ error: 'Unauthorized: GitHub sign-in is required.' }, 401),
        };
    }
    if (!isSameOriginMutation(request)) {
        return {
            response: creatorJson({ error: 'Cross-origin Creator Studio request rejected.' }, 403),
        };
    }

    const limit = statusRequest
        ? rateLimitValue(env, 'CREATOR_STUDIO_STATUS_RATE_LIMIT', DEFAULT_STATUS_LIMIT, 600)
        : rateLimitValue(env, 'CREATOR_STUDIO_RATE_LIMIT', DEFAULT_REQUEST_LIMIT, 300);
    const windowMs = rateLimitValue(
        env,
        'CREATOR_STUDIO_RATE_WINDOW_MS',
        DEFAULT_WINDOW_MS,
        60 * 60 * 1000,
    );
    const rate = checkRateLimit(`creator:github:${authentication.user.id}:${action}`, { limit, windowMs });
    if (!rate.allowed) {
        return {
            response: creatorJson(
                { error: 'Creator Studio rate limit exceeded. Please wait before trying again.' },
                429,
                { 'retry-after': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))) },
            ),
        };
    }

    return { user: authentication.user };
}

async function parseCreatorJson(request, { env = process.env } = {}) {
    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_JSON_BODY_BYTES) {
        return { response: creatorJson({ error: 'Request body is too large.' }, 413) };
    }

    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_JSON_BODY_BYTES) {
        return { response: creatorJson({ error: 'Request body is too large.' }, 413) };
    }

    let value;
    try {
        value = JSON.parse(raw);
    } catch {
        return { response: creatorJson({ error: 'A valid JSON request body is required.' }, 400) };
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { response: creatorJson({ error: 'The request body must be a JSON object.' }, 400) };
    }

    const safety = evaluateJsonSafety(raw, { env });
    if (!safety.allowed) {
        return {
            response: creatorJson(
                { error: 'Request blocked by content safety policy.', reason: safety.reason },
                422,
            ),
        };
    }

    return { value, safety };
}

function stringField(value, name, { minimum = 1, maximum = 4000, optional = false } = {}) {
    if (value == null && optional) return { value: '' };
    if (typeof value !== 'string') return { error: `${name} must be text.` };
    const normalized = value.trim();
    if (!normalized && optional) return { value: '' };
    if (normalized.length < minimum) return { error: `${name} is required.` };
    if (normalized.length > maximum) return { error: `${name} must be ${maximum} characters or fewer.` };
    return { value: normalized };
}

function safeHttpsUrl(value, name, { optional = true } = {}) {
    if ((value == null || value === '') && optional) return { value: '' };
    if (typeof value !== 'string' || value.length > 4096) return { error: `${name} must be a valid HTTPS URL.` };
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
            return { error: `${name} must be a valid HTTPS URL.` };
        }
        return { value: url.toString() };
    } catch {
        return { error: `${name} must be a valid HTTPS URL.` };
    }
}

function safeProviderMessage(value) {
    if (typeof value !== 'string') return '';
    return value
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\b(?:sk|xi|key)-[A-Za-z0-9_-]{12,}\b/g, '[redacted]')
        .trim()
        .slice(0, 400);
}

function upstreamMessage(value) {
    return safeProviderMessage(
        value?.error?.message ||
        value?.error?.detail ||
        value?.detail ||
        value?.message ||
        '',
    );
}

function providerFailure(provider, response, value) {
    const detail = upstreamMessage(value);
    if (response.status === 401 || response.status === 403) {
        return creatorJson({
            error: `${provider} rejected the configured API credentials.`,
        }, 502);
    }
    if (response.status === 429) {
        return creatorJson({
            error: `${provider} rate limit or account balance limit was reached.`,
            ...(detail ? { detail } : {}),
        }, 429);
    }
    if (response.status === 400 || response.status === 404 || response.status === 409 || response.status === 422) {
        return creatorJson({
            error: `${provider} rejected the generation request.`,
            ...(detail ? { detail } : {}),
        }, 422);
    }
    return creatorJson({
        error: `${provider} is temporarily unavailable.`,
        ...(detail ? { detail } : {}),
    }, 502);
}

async function fetchWithTimeout(fetchImpl, url, options, timeoutMs) {
    try {
        return await fetchImpl(url, {
            ...options,
            redirect: 'error',
            signal: AbortSignal.timeout(timeoutMs),
        });
    } catch (error) {
        const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
        return { networkError: timedOut ? 'timeout' : 'unavailable' };
    }
}

async function readProviderJson(response) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_PROVIDER_JSON_BYTES) {
        return { error: 'provider_response_too_large' };
    }
    try {
        return { value: JSON.parse(text) };
    } catch {
        return { error: 'invalid_provider_response' };
    }
}

function missingProviderConfiguration(provider, names) {
    return creatorJson({
        error: `${provider} is not configured.`,
        missing: names,
    }, 503);
}

function networkFailure(provider, result) {
    return creatorJson({
        error: result.networkError === 'timeout'
            ? `${provider} request timed out.`
            : `${provider} is temporarily unavailable.`,
    }, result.networkError === 'timeout' ? 504 : 502);
}

function heyGenResultResponse(result, successStatus = 200) {
    if (result.ok) return creatorJson(result.job, successStatus);
    return creatorJson({
        error: result.error,
        ...(Array.isArray(result.missing) ? { missing: result.missing } : {}),
        ...(result.detail ? { detail: result.detail } : {}),
    }, result.status || 502);
}

function generationProviderStatuses(env) {
    const heyGen = heyGenProviderStatus(env);
    return [
        {
            id: 'openai',
            label: 'OpenAI',
            category: 'generation',
            capability: 'Image generation',
            toolId: OPENAI_IMAGE_TOOL_ID,
            built: true,
            configured: configuredSecret(env.OPENAI_API_KEY),
            tested: false,
            productionReady: false,
            model: env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
        },
        {
            id: 'elevenlabs',
            label: 'ElevenLabs',
            category: 'generation',
            capability: 'Voice generation',
            toolId: ELEVENLABS_VOICE_TOOL_ID,
            built: true,
            configured: configuredSecret(env.ELEVENLABS_API_KEY) && configuredSecret(env.ELEVENLABS_VOICE_ID),
            tested: false,
            productionReady: false,
            model: env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
        },
        {
            ...heyGen,
            category: 'generation',
            built: true,
            tested: false,
            productionReady: false,
        },
        {
            id: 'runway',
            label: 'Runway',
            category: 'generation',
            capability: 'Cinematic video',
            toolId: RUNWAY_VIDEO_TOOL_ID,
            built: true,
            configured: configuredSecret(env.RUNWAY_API_KEY),
            tested: false,
            productionReady: false,
            model: env.RUNWAY_VIDEO_MODEL || 'gen4.5',
        },
    ];
}

export async function handleCreatorProviders(request, { env = process.env } = {}) {
    const auth = authorizeCreatorRequest(request, { env, action: 'providers', statusRequest: true });
    if (auth.response) return auth.response;
    const brain = {
        ...brainRouterStatus(env),
        toolId: BRAIN_REASONING_TOOL_ID,
    };
    const brainProviders = brainProviderStatuses(env);
    const generationProviders = generationProviderStatuses(env);
    return creatorJson({
        providers: [brain, ...generationProviders],
        brain,
        brainProviders,
        generationProviders,
    });
}

async function handleBrainReasoning(request, {
    env,
    fetchImpl,
    providerOverride = null,
    action = 'brain',
} = {}) {
    const auth = authorizeCreatorRequest(request, { env, action });
    if (auth.response) return auth.response;

    const parsed = await parseCreatorJson(request, { env });
    if (parsed.response) return parsed.response;
    try {
        const result = await reasonWithBrain({
            task: parsed.value.task ?? parsed.value.prompt,
            instructions: parsed.value.instructions,
            context: parsed.value.context,
            mode: parsed.value.mode,
            tools: parsed.value.tools,
            sensitivity: parsed.value.sensitivity,
            desiredOutput: parsed.value.desiredOutput,
            agent: parsed.value.agent,
            allowFallback: parsed.value.allowFallback,
            requiresExplicitApproval: parsed.value.requiresExplicitApproval,
            sideEffect: parsed.value.sideEffect,
        }, { env, fetchImpl, providerOverride });
        return creatorJson({
            ...result,
            toolId: providerOverride === 'anthropic'
                ? ANTHROPIC_ASSISTANT_TOOL_ID
                : BRAIN_REASONING_TOOL_ID,
            // Keep the legacy field while clients migrate to finishReason.
            stopReason: result.finishReason,
        });
    } catch (error) {
        const failure = brainErrorResponse(error);
        return creatorJson(failure.body, failure.status);
    }
}

export async function handleBrainAssistant(request, {
    env = process.env,
    fetchImpl = fetch,
} = {}) {
    return handleBrainReasoning(request, { env, fetchImpl, action: 'brain' });
}

export async function handleAnthropicAssistant(request, {
    env = process.env,
    fetchImpl = fetch,
} = {}) {
    return handleBrainReasoning(request, {
        env: {
            ...env,
            BRAIN_SYSTEM_PROMPT: env.BRAIN_SYSTEM_PROMPT || env.ANTHROPIC_ASSISTANT_SYSTEM_PROMPT,
        },
        fetchImpl,
        providerOverride: 'anthropic',
        action: 'anthropic',
    });
}

export async function handleOpenAiImage(request, {
    env = process.env,
    fetchImpl = fetch,
} = {}) {
    const auth = authorizeCreatorRequest(request, { env, action: 'openai-image' });
    if (auth.response) return auth.response;
    if (!configuredSecret(env.OPENAI_API_KEY)) {
        return missingProviderConfiguration('OpenAI', ['OPENAI_API_KEY']);
    }

    const parsed = await parseCreatorJson(request, { env });
    if (parsed.response) return parsed.response;
    const prompt = stringField(parsed.value.prompt, 'Prompt', { maximum: 4000 });
    if (prompt.error) return creatorJson({ error: prompt.error }, 400);
    const size = IMAGE_SIZES.has(parsed.value.size) ? parsed.value.size : '1024x1024';
    const defaultQuality = IMAGE_QUALITIES.has(env.OPENAI_IMAGE_DEFAULT_QUALITY)
        ? env.OPENAI_IMAGE_DEFAULT_QUALITY
        : 'low';
    const quality = IMAGE_QUALITIES.has(parsed.value.quality) ? parsed.value.quality : defaultQuality;

    const result = await fetchWithTimeout(fetchImpl, OPENAI_IMAGE_URL, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${normalizedSecret(env.OPENAI_API_KEY)}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
            prompt: prompt.value,
            size,
            quality,
            n: 1,
            output_format: 'png',
        }),
    }, 150_000);
    if (result.networkError) return networkFailure('OpenAI', result);

    const decoded = await readProviderJson(result);
    if (decoded.error) return creatorJson({ error: 'OpenAI returned an invalid response.' }, 502);
    if (!result.ok) return providerFailure('OpenAI', result, decoded.value);
    const encoded = decoded.value?.data?.[0]?.b64_json;
    if (typeof encoded !== 'string' || !/^[A-Za-z0-9+/=\r\n]+$/.test(encoded)) {
        return creatorJson({ error: 'OpenAI returned no image data.' }, 502);
    }
    const image = Buffer.from(encoded, 'base64');
    if (image.length === 0 || image.length > MAX_BINARY_BYTES) {
        return creatorJson({ error: 'OpenAI image response was invalid or too large.' }, 502);
    }

    return new Response(image, {
        status: 200,
        headers: creatorHeaders({
            'content-type': 'image/png',
            'content-disposition': 'inline; filename="creator-studio-image.png"',
            'x-generation-provider': 'openai',
            'x-creator-tool-id': OPENAI_IMAGE_TOOL_ID,
        }),
    });
}

export async function handleElevenLabsSpeech(request, {
    env = process.env,
    fetchImpl = fetch,
} = {}) {
    const auth = authorizeCreatorRequest(request, { env, action: 'elevenlabs-speech' });
    if (auth.response) return auth.response;
    const missing = [];
    if (!configuredSecret(env.ELEVENLABS_API_KEY)) missing.push('ELEVENLABS_API_KEY');
    if (!configuredSecret(env.ELEVENLABS_VOICE_ID)) missing.push('ELEVENLABS_VOICE_ID');
    if (missing.length) return missingProviderConfiguration('ElevenLabs', missing);

    const parsed = await parseCreatorJson(request, { env });
    if (parsed.response) return parsed.response;
    const text = stringField(parsed.value.text, 'Voice script', { maximum: 5000 });
    if (text.error) return creatorJson({ error: text.error }, 400);
    const stability = boundedNumber(parsed.value.stability, 0.5, 0, 1);
    const similarityBoost = boundedNumber(parsed.value.similarityBoost, 0.75, 0, 1);
    const voiceId = normalizedSecret(env.ELEVENLABS_VOICE_ID);

    const result = await fetchWithTimeout(
        fetchImpl,
        `${ELEVENLABS_API_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
        {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'xi-api-key': normalizedSecret(env.ELEVENLABS_API_KEY),
            },
            body: JSON.stringify({
                text: text.value,
                model_id: env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
                voice_settings: {
                    stability,
                    similarity_boost: similarityBoost,
                    style: 0,
                    use_speaker_boost: true,
                },
            }),
        },
        120_000,
    );
    if (result.networkError) return networkFailure('ElevenLabs', result);
    if (!result.ok) {
        const decoded = await readProviderJson(result);
        return providerFailure('ElevenLabs', result, decoded.value || {});
    }

    const audio = Buffer.from(await result.arrayBuffer());
    if (audio.length === 0 || audio.length > MAX_BINARY_BYTES) {
        return creatorJson({ error: 'ElevenLabs audio response was invalid or too large.' }, 502);
    }
    return new Response(audio, {
        status: 200,
        headers: creatorHeaders({
            'content-type': result.headers.get('content-type') || 'audio/mpeg',
            'content-disposition': 'inline; filename="creator-studio-voice.mp3"',
            'x-generation-provider': 'elevenlabs',
            'x-creator-tool-id': ELEVENLABS_VOICE_TOOL_ID,
        }),
    });
}

export async function handleHeyGenVideo(request, {
    env = process.env,
    fetchImpl = fetch,
} = {}) {
    const auth = authorizeCreatorRequest(request, { env, action: 'heygen-create' });
    if (auth.response) return auth.response;

    const parsed = await parseCreatorJson(request, { env });
    if (parsed.response) return parsed.response;
    const result = await createHeyGenAvatarVideoJob(parsed.value, { env, fetchImpl });
    return heyGenResultResponse(result, 202);
}

export async function handleHeyGenStatus(request, {
    env = process.env,
    fetchImpl = fetch,
} = {}) {
    const auth = authorizeCreatorRequest(request, { env, action: 'heygen-status', statusRequest: true });
    if (auth.response) return auth.response;
    const videoId = new URL(request.url).searchParams.get('id') || '';
    const result = await getHeyGenAvatarVideoJob(videoId, { env, fetchImpl });
    return heyGenResultResponse(result);
}

export async function handleRunwayVideo(request, {
    env = process.env,
    fetchImpl = fetch,
} = {}) {
    const auth = authorizeCreatorRequest(request, { env, action: 'runway-create' });
    if (auth.response) return auth.response;
    if (!configuredSecret(env.RUNWAY_API_KEY)) {
        return missingProviderConfiguration('Runway', ['RUNWAY_API_KEY']);
    }

    const parsed = await parseCreatorJson(request, { env });
    if (parsed.response) return parsed.response;
    const prompt = stringField(parsed.value.prompt, 'Video prompt', { maximum: 4000 });
    if (prompt.error) return creatorJson({ error: prompt.error }, 400);
    const firstFrame = safeHttpsUrl(parsed.value.firstFrameUrl, 'First-frame image URL');
    if (firstFrame.error) return creatorJson({ error: firstFrame.error }, 400);
    const ratio = RUNWAY_RATIOS.has(parsed.value.ratio) ? parsed.value.ratio : '1280:720';
    const duration = Math.round(boundedNumber(parsed.value.duration, 5, 2, 10));
    const endpoint = firstFrame.value ? 'image_to_video' : 'text_to_video';
    const payload = {
        model: env.RUNWAY_VIDEO_MODEL || 'gen4.5',
        promptText: prompt.value,
        ratio,
        duration,
    };
    if (firstFrame.value) payload.promptImage = firstFrame.value;

    const result = await fetchWithTimeout(fetchImpl, `${RUNWAY_API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${normalizedSecret(env.RUNWAY_API_KEY)}`,
            'content-type': 'application/json',
            'x-runway-version': env.RUNWAY_API_VERSION || '2024-11-06',
        },
        body: JSON.stringify(payload),
    }, 60_000);
    if (result.networkError) return networkFailure('Runway', result);
    const decoded = await readProviderJson(result);
    if (decoded.error) return creatorJson({ error: 'Runway returned an invalid response.' }, 502);
    if (!result.ok) return providerFailure('Runway', result, decoded.value);
    const taskId = decoded.value?.id;
    if (typeof taskId !== 'string' || !OPAQUE_ID_PATTERN.test(taskId)) {
        return creatorJson({ error: 'Runway returned no valid task ID.' }, 502);
    }
    return creatorJson({
        provider: 'runway',
        toolId: RUNWAY_VIDEO_TOOL_ID,
        id: taskId,
        status: decoded.value.status || 'PENDING',
    }, 202);
}

export async function handleRunwayStatus(request, {
    env = process.env,
    fetchImpl = fetch,
} = {}) {
    const auth = authorizeCreatorRequest(request, { env, action: 'runway-status', statusRequest: true });
    if (auth.response) return auth.response;
    if (!configuredSecret(env.RUNWAY_API_KEY)) {
        return missingProviderConfiguration('Runway', ['RUNWAY_API_KEY']);
    }
    const taskId = new URL(request.url).searchParams.get('id') || '';
    if (!OPAQUE_ID_PATTERN.test(taskId)) return creatorJson({ error: 'A valid Runway task ID is required.' }, 400);

    const result = await fetchWithTimeout(fetchImpl, `${RUNWAY_API_BASE}/tasks/${encodeURIComponent(taskId)}`, {
        headers: {
            authorization: `Bearer ${normalizedSecret(env.RUNWAY_API_KEY)}`,
            'x-runway-version': env.RUNWAY_API_VERSION || '2024-11-06',
        },
    }, 30_000);
    if (result.networkError) return networkFailure('Runway', result);
    const decoded = await readProviderJson(result);
    if (decoded.error) return creatorJson({ error: 'Runway returned an invalid response.' }, 502);
    if (!result.ok) return providerFailure('Runway', result, decoded.value);
    const output = Array.isArray(decoded.value?.output)
        ? decoded.value.output
            .map((value) => safeHttpsUrl(value, 'Runway output URL'))
            .filter((value) => value.value)
            .map((value) => value.value)
            .slice(0, 10)
        : [];
    return creatorJson({
        provider: 'runway',
        toolId: RUNWAY_VIDEO_TOOL_ID,
        id: taskId,
        status: typeof decoded.value?.status === 'string' ? decoded.value.status : 'UNKNOWN',
        output,
        failure: safeProviderMessage(decoded.value?.failure || decoded.value?.failureCode) || null,
    });
}

export function creatorNotFound() {
    return creatorJson({ error: 'Creator Studio route not found.' }, 404);
}
