import {
    MUAPI_IMAGE_TOOL_ID,
    MUAPI_VIDEO_TOOL_ID,
} from './creatorToolRegistry.js';
import { buildMuapiUrl } from './muapiProxy.js';

const MAX_PROVIDER_JSON_BYTES = 2 * 1024 * 1024;
const MAX_PROMPT_CHARACTERS = 4000;
const OPAQUE_ID_PATTERN = /^[A-Za-z0-9_-]{3,200}$/;
const MODEL_ID_PATTERN = /^[A-Za-z0-9._-]{2,120}$/;
const IMAGE_ASPECT_RATIOS = new Set(['1:1', '3:4', '4:3', '9:16', '16:9', '3:2', '2:3', '5:4', '4:5', '21:9']);
const VIDEO_ASPECT_RATIOS = new Set(['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', '9:21']);
const IMAGE_SIZE_TO_RATIO = Object.freeze({
    '1024x1024': '1:1',
    '1536x1024': '3:2',
    '1024x1536': '2:3',
});
const VIDEO_FRAME_TO_RATIO = Object.freeze({
    '1280:720': '16:9',
    '720:1280': '9:16',
    '1280:768': '16:9',
    '768:1280': '9:16',
    '1920:1080': '16:9',
    '1080:1920': '9:16',
});

function normalizedString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function configuredApiKey(value) {
    const key = normalizedString(value);
    if (!/^[\x21-\x7E]{8,4096}$/.test(key) || /[\r\n]/.test(key)) return false;
    return !/^(?:<.*>|change-?me|placeholder|your[-_]?api[-_]?key)$/i.test(key);
}

function configuredModel(value, fallback) {
    const model = normalizedString(value) || fallback;
    return MODEL_ID_PATTERN.test(model) ? model : fallback;
}

function textInput(value, name, maximum = MAX_PROMPT_CHARACTERS) {
    if (typeof value !== 'string') return { error: `${name} must be text.` };
    const normalized = value.trim();
    if (!normalized) return { error: `${name} is required.` };
    if (normalized.length > maximum) return { error: `${name} must be ${maximum} characters or fewer.` };
    return { value: normalized };
}

function httpsUrl(value, name, { optional = false } = {}) {
    if ((value == null || value === '') && optional) return { value: '' };
    if (typeof value !== 'string' || value.length > 4096) {
        return { error: `${name} must be a valid HTTPS URL.` };
    }
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

function safeProviderText(value, secrets = []) {
    if (typeof value !== 'string') return '';
    let sanitized = value
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\b(?:sk|xi|key)-[A-Za-z0-9_-]{8,}\b/gi, '[redacted]');
    for (const secret of secrets) {
        if (typeof secret === 'string' && secret.length >= 3) {
            sanitized = sanitized.split(secret).join('[redacted]');
        }
    }
    return sanitized.trim().slice(0, 400);
}

function providerMessage(value, secrets) {
    return safeProviderText(
        value?.error?.message ||
        value?.error?.detail ||
        value?.error ||
        value?.detail ||
        value?.message ||
        '',
        secrets,
    );
}

function boundedInteger(value, fallback, minimum, maximum) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.round(Math.min(maximum, Math.max(minimum, parsed)));
}

function outputCandidate(value) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        return value.url || value.video_url || value.image_url || value.output_url || '';
    }
    return '';
}

function safeOutputUrl(value) {
    const candidates = [
        value?.url,
        value?.output_url,
        value?.video_url,
        value?.image_url,
        Array.isArray(value?.outputs) ? value.outputs[0] : null,
        Array.isArray(value?.output) ? value.output[0] : value?.output,
        value?.data?.url,
        Array.isArray(value?.data?.outputs) ? value.data.outputs[0] : null,
        value?.data?.output,
    ];
    for (const candidate of candidates) {
        const parsed = httpsUrl(outputCandidate(candidate), 'MuAPI output URL', { optional: true });
        if (parsed.value) return parsed.value;
    }
    return null;
}

function requestId(value) {
    const candidate = normalizedString(
        value?.request_id ||
        value?.prediction_id ||
        value?.id ||
        value?.data?.request_id ||
        value?.data?.id,
    );
    return OPAQUE_ID_PATTERN.test(candidate) ? candidate : '';
}

function normalizedStatus(value, { hasUrl = false, hasJobId = false } = {}) {
    if (hasUrl) return 'completed';
    const status = normalizedString(value).toLowerCase();
    if (['completed', 'succeeded', 'success', 'done'].includes(status)) return 'completed';
    if (['failed', 'error', 'canceled', 'cancelled'].includes(status)) return 'failed';
    if (['processing', 'running', 'in_progress', 'in-progress'].includes(status)) return 'processing';
    if (['queued', 'pending', 'waiting', 'created'].includes(status)) return 'queued';
    return hasJobId ? 'queued' : 'unknown';
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
    const raw = await response.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_PROVIDER_JSON_BYTES) {
        return { error: 'provider_response_too_large' };
    }
    try {
        return { value: JSON.parse(raw) };
    } catch {
        return { error: 'invalid_provider_response' };
    }
}

function networkFailure(result) {
    return {
        ok: false,
        status: result.networkError === 'timeout' ? 504 : 502,
        error: result.networkError === 'timeout'
            ? 'MuAPI request timed out.'
            : 'MuAPI is temporarily unavailable.',
    };
}

function providerFailure(response, value, secrets) {
    const detail = providerMessage(value, secrets);
    if (response.status === 401 || response.status === 403) {
        return { ok: false, status: 502, error: 'MuAPI rejected the configured API credentials.' };
    }
    if (response.status === 429) {
        return {
            ok: false,
            status: 429,
            error: 'MuAPI rate limit or account balance limit was reached.',
            ...(detail ? { detail } : {}),
        };
    }
    if ([400, 404, 409, 422].includes(response.status)) {
        return {
            ok: false,
            status: 422,
            error: 'MuAPI rejected the generation request.',
            ...(detail ? { detail } : {}),
        };
    }
    return {
        ok: false,
        status: 502,
        error: 'MuAPI is temporarily unavailable.',
        ...(detail ? { detail } : {}),
    };
}

function publicJob({ kind, model, keyMode, value }) {
    const url = safeOutputUrl(value);
    const jobId = requestId(value);
    const status = normalizedStatus(value?.status || value?.data?.status, {
        hasUrl: Boolean(url),
        hasJobId: Boolean(jobId),
    });
    return {
        provider: 'muapi',
        toolId: kind === 'image' ? MUAPI_IMAGE_TOOL_ID : MUAPI_VIDEO_TOOL_ID,
        kind,
        jobId: jobId || null,
        status,
        url,
        model,
        keyMode,
        error: status === 'failed' ? 'MuAPI generation failed.' : null,
    };
}

export function muapiConfiguration(env = process.env) {
    const keyMode = normalizedString(env.MUAPI_KEY_MODE).toLowerCase();
    const paidGenerationAllowed = normalizedString(env.MUAPI_ALLOW_PAID_GENERATION).toLowerCase() === 'true';
    const apiKeyVariable = keyMode === 'production' ? 'MUAPI_PRODUCTION_API_KEY' : 'MUAPI_API_KEY';
    const apiKey = normalizedString(env[apiKeyVariable]);
    const missing = [];
    if (!configuredApiKey(apiKey)) missing.push(apiKeyVariable);
    if (!['sandbox', 'production'].includes(keyMode)) missing.push('MUAPI_KEY_MODE');
    if (keyMode === 'production' && !paidGenerationAllowed) {
        missing.push('MUAPI_ALLOW_PAID_GENERATION=true');
    }
    return {
        configured: missing.length === 0,
        missing,
        apiKey,
        keyMode,
        paidGenerationAllowed,
        imageModel: configuredModel(env.MUAPI_IMAGE_MODEL, 'nano-banana'),
        videoModel: configuredModel(env.MUAPI_VIDEO_MODEL, 'seedance-lite-t2v'),
        imageToVideoModel: configuredModel(env.MUAPI_IMAGE_TO_VIDEO_MODEL, 'kling-v2.1-master-i2v'),
    };
}

export function muapiProviderStatus(env = process.env) {
    const configuration = muapiConfiguration(env);
    const modeLabel = configuration.keyMode === 'sandbox'
        ? 'Sandbox · $0 mock data'
        : configuration.keyMode === 'production'
            ? 'Production · paid generation enabled'
            : 'Key mode required';
    return {
        id: 'muapi',
        label: 'MuAPI',
        capability: 'Image and cinematic video generation',
        toolIds: [MUAPI_IMAGE_TOOL_ID, MUAPI_VIDEO_TOOL_ID],
        configured: configuration.configured,
        status: configuration.configured ? modeLabel : 'Setup Required',
        model: `${configuration.imageModel} · ${configuration.videoModel}`,
        keyMode: configuration.keyMode || null,
        paidGenerationAllowed: configuration.paidGenerationAllowed,
    };
}

export function normalizeMuapiImageInput(value, { env = process.env } = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { error: 'MuAPI image input must be an object.' };
    }
    const configuration = muapiConfiguration(env);
    if (!configuration.configured) {
        return { error: 'MuAPI is not configured.', missing: configuration.missing };
    }
    const prompt = textInput(value.prompt, 'Image prompt');
    if (prompt.error) return prompt;
    const requestedRatio = value.aspectRatio || IMAGE_SIZE_TO_RATIO[value.size] || '1:1';
    if (typeof requestedRatio !== 'string' || !IMAGE_ASPECT_RATIOS.has(requestedRatio)) {
        return { error: 'Image aspect ratio is not supported by MuAPI.' };
    }
    return {
        value: {
            kind: 'image',
            model: configuration.imageModel,
            payload: {
                prompt: prompt.value,
                aspect_ratio: requestedRatio,
                image_url: null,
            },
        },
    };
}

export function normalizeMuapiVideoInput(value, { env = process.env } = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { error: 'MuAPI video input must be an object.' };
    }
    const configuration = muapiConfiguration(env);
    if (!configuration.configured) {
        return { error: 'MuAPI is not configured.', missing: configuration.missing };
    }
    const prompt = textInput(value.prompt, 'Video prompt');
    if (prompt.error) return prompt;
    const firstFrame = httpsUrl(value.firstFrameUrl, 'First-frame image URL', { optional: true });
    if (firstFrame.error) return firstFrame;
    const requestedRatio = value.aspectRatio || VIDEO_FRAME_TO_RATIO[value.ratio] || '16:9';
    if (typeof requestedRatio !== 'string' || !VIDEO_ASPECT_RATIOS.has(requestedRatio)) {
        return { error: 'Video aspect ratio is not supported by MuAPI.' };
    }
    const model = firstFrame.value ? configuration.imageToVideoModel : configuration.videoModel;
    return {
        value: {
            kind: 'video',
            model,
            payload: {
                prompt: prompt.value,
                aspect_ratio: requestedRatio,
                duration: boundedInteger(value.duration, 5, 3, 12),
                ...(firstFrame.value ? { image_url: firstFrame.value } : {}),
            },
        },
    };
}

async function createMuapiGenerationJob(input, {
    env = process.env,
    fetchImpl = fetch,
    timeoutMs = 60_000,
} = {}) {
    const configuration = muapiConfiguration(env);
    if (!configuration.configured) {
        return {
            ok: false,
            status: 503,
            error: 'MuAPI is not configured.',
            missing: configuration.missing,
        };
    }
    const result = await fetchWithTimeout(fetchImpl, buildMuapiUrl('api/v1', [input.model]), {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': configuration.apiKey,
        },
        body: JSON.stringify(input.payload),
    }, timeoutMs);
    if (result.networkError) return networkFailure(result);
    const decoded = await readProviderJson(result);
    if (decoded.error) return { ok: false, status: 502, error: 'MuAPI returned an invalid response.' };
    if (!result.ok) return providerFailure(result, decoded.value, [configuration.apiKey]);
    const job = publicJob({
        kind: input.kind,
        model: input.model,
        keyMode: configuration.keyMode,
        value: decoded.value,
    });
    if (!job.jobId && !job.url) {
        return { ok: false, status: 502, error: 'MuAPI returned no valid job ID or output URL.' };
    }
    return { ok: true, status: job.status === 'completed' ? 200 : 202, job };
}

export async function createMuapiImageJob(value, options = {}) {
    const normalized = normalizeMuapiImageInput(value, options);
    if (normalized.error) {
        return {
            ok: false,
            status: normalized.missing ? 503 : 400,
            error: normalized.error,
            ...(normalized.missing ? { missing: normalized.missing } : {}),
        };
    }
    return createMuapiGenerationJob(normalized.value, options);
}

export async function createMuapiVideoJob(value, options = {}) {
    const normalized = normalizeMuapiVideoInput(value, options);
    if (normalized.error) {
        return {
            ok: false,
            status: normalized.missing ? 503 : 400,
            error: normalized.error,
            ...(normalized.missing ? { missing: normalized.missing } : {}),
        };
    }
    return createMuapiGenerationJob(normalized.value, options);
}

export async function getMuapiGenerationJob(jobId, kind, {
    env = process.env,
    fetchImpl = fetch,
    timeoutMs = 30_000,
} = {}) {
    const configuration = muapiConfiguration(env);
    if (!configuration.configured) {
        return {
            ok: false,
            status: 503,
            error: 'MuAPI is not configured.',
            missing: configuration.missing,
        };
    }
    if (!OPAQUE_ID_PATTERN.test(jobId) || !['image', 'video'].includes(kind)) {
        return { ok: false, status: 400, error: 'A valid MuAPI job ID and kind are required.' };
    }
    const result = await fetchWithTimeout(
        fetchImpl,
        buildMuapiUrl('api/v1/predictions', [jobId, 'result']),
        { headers: { 'x-api-key': configuration.apiKey } },
        timeoutMs,
    );
    if (result.networkError) return networkFailure(result);
    const decoded = await readProviderJson(result);
    if (decoded.error) return { ok: false, status: 502, error: 'MuAPI returned an invalid response.' };
    if (!result.ok) return providerFailure(result, decoded.value, [configuration.apiKey]);
    const model = kind === 'image' ? configuration.imageModel : configuration.videoModel;
    return {
        ok: true,
        status: 200,
        job: publicJob({ kind, model, keyMode: configuration.keyMode, value: decoded.value }),
    };
}
