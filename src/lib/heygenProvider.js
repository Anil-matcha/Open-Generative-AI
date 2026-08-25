import { randomUUID } from 'node:crypto';

import {
    HEYGEN_AVATAR_VIDEO_TOOL,
    HEYGEN_AVATAR_VIDEO_TOOL_ID,
} from './creatorToolRegistry.js';

const HEYGEN_API_BASE = 'https://api.heygen.com/v3';
const MAX_PROVIDER_JSON_BYTES = 2 * 1024 * 1024;
const MAX_SCRIPT_CHARACTERS = 5000;
const MAX_TITLE_CHARACTERS = 100;
const MAX_MOTION_PROMPT_CHARACTERS = 500;
const OPAQUE_ID_PATTERN = /^[A-Za-z0-9_-]{3,200}$/;
const HEYGEN_ASPECT_RATIOS = new Set(['16:9', '9:16', '4:5', '5:4', '1:1', 'auto']);
const HEYGEN_RESOLUTIONS = new Set(['720p', '1080p', '4k']);
const HEYGEN_EXPRESSIVENESS = new Set(['low', 'medium', 'high']);
const HEYGEN_TERMINAL_STATUSES = new Set(['completed', 'failed']);
const HEYGEN_ENGINE_LABELS = new Set(['Avatar III', 'Avatar IV', 'Avatar V']);

function normalizedString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function configuredApiKey(value) {
    const apiKey = normalizedString(value);
    if (!/^[\x21-\x7E]{8,512}$/.test(apiKey)) return false;
    return !/^(?:<.*>|change-?me|placeholder|your[-_]?api[-_]?key)$/i.test(apiKey);
}

function textInput(value, name, { optional = false, maximum } = {}) {
    if (value == null && optional) return { value: '' };
    if (typeof value !== 'string') return { error: `${name} must be text.` };
    const normalized = value.trim();
    if (!normalized && optional) return { value: '' };
    if (!normalized) return { error: `${name} is required.` };
    if (normalized.length > maximum) return { error: `${name} must be ${maximum} characters or fewer.` };
    return { value: normalized };
}

function optionalOpaqueId(value, fallback, name) {
    if (value == null || value === '') return { value: fallback };
    if (typeof value !== 'string' || !OPAQUE_ID_PATTERN.test(value.trim())) {
        return { error: `${name} must be a valid HeyGen identifier.` };
    }
    return { value: value.trim() };
}

function httpsUrl(value, name) {
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

function backgroundInput(value) {
    if (value == null) return { value: null };
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { error: 'Background must be an object.' };
    }

    const selected = [];
    if (value.value != null && value.value !== '') {
        const backgroundValue = textInput(value.value, 'Background value', { maximum: 100 });
        if (backgroundValue.error) return backgroundValue;
        if (/[^\x20-\x7E]/.test(backgroundValue.value)) {
            return { error: 'Background value contains unsupported characters.' };
        }
        selected.push(['value', backgroundValue.value]);
    }
    if (value.url != null && value.url !== '') {
        const url = httpsUrl(value.url, 'Background URL');
        if (url.error) return url;
        selected.push(['url', url.value]);
    }
    if (value.assetId != null && value.assetId !== '') {
        const assetId = optionalOpaqueId(value.assetId, '', 'Background asset ID');
        if (assetId.error) return assetId;
        selected.push(['asset_id', assetId.value]);
    }
    if (selected.length !== 1) {
        return { error: 'Background must provide exactly one value, URL, or asset ID.' };
    }
    return { value: Object.fromEntries(selected) };
}

function captionInput(value) {
    if (value == null || value === false) return { value: null };
    if (value === true) return { value: { file_format: 'srt', style: 'default' } };
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { error: 'Caption settings must be true, false, or an object.' };
    }
    if (value.enabled === false) return { value: null };
    if (value.style != null && value.style !== 'default') {
        return { error: 'Caption style must be default.' };
    }
    return { value: { file_format: 'srt', style: 'default' } };
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
        value?.detail ||
        value?.message ||
        '',
        secrets,
    );
}

function normalizedStatus(value, fallback = 'unknown') {
    const status = normalizedString(value).toLowerCase();
    if (status === 'waiting' || status === 'pending') return 'queued';
    if (status === 'error' || status === 'canceled' || status === 'cancelled') return 'failed';
    if (status === 'queued' || status === 'processing' || HEYGEN_TERMINAL_STATUSES.has(status)) return status;
    return fallback;
}

function safeDuration(value) {
    const duration = Number(value);
    return Number.isFinite(duration) && duration >= 0 && duration <= 24 * 60 * 60
        ? duration
        : null;
}

function safeOutputUrl(value) {
    if (value == null || value === '') return null;
    const parsed = httpsUrl(value, 'HeyGen output URL');
    return parsed.error ? null : parsed.value;
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

function providerFailure(response, value, secrets) {
    const detail = providerMessage(value, secrets);
    if (response.status === 401 || response.status === 403) {
        return {
            ok: false,
            kind: 'provider',
            status: 502,
            error: 'HeyGen rejected the configured API credentials.',
        };
    }
    if (response.status === 429) {
        return {
            ok: false,
            kind: 'provider',
            status: 429,
            error: 'HeyGen rate limit or account balance limit was reached.',
            ...(detail ? { detail } : {}),
        };
    }
    if ([400, 404, 409, 422].includes(response.status)) {
        return {
            ok: false,
            kind: 'provider',
            status: 422,
            error: 'HeyGen rejected the generation request.',
            ...(detail ? { detail } : {}),
        };
    }
    return {
        ok: false,
        kind: 'provider',
        status: 502,
        error: 'HeyGen is temporarily unavailable.',
        ...(detail ? { detail } : {}),
    };
}

function networkFailure(result) {
    return {
        ok: false,
        kind: 'network',
        status: result.networkError === 'timeout' ? 504 : 502,
        error: result.networkError === 'timeout'
            ? 'HeyGen request timed out.'
            : 'HeyGen is temporarily unavailable.',
    };
}

function publicJob({ jobId, status, videoUrl = null, thumbnailUrl = null, duration = null, error = null }) {
    return {
        provider: 'heygen',
        toolId: HEYGEN_AVATAR_VIDEO_TOOL_ID,
        jobId,
        status,
        videoUrl,
        thumbnailUrl,
        duration,
        error,
    };
}

export function heyGenConfiguration(env = process.env) {
    const apiKey = normalizedString(env.HEYGEN_API_KEY);
    const avatarId = normalizedString(env.HEYGEN_AVATAR_ID);
    const voiceId = normalizedString(env.HEYGEN_VOICE_ID);
    const missing = [];
    if (!configuredApiKey(apiKey)) missing.push('HEYGEN_API_KEY');
    if (!OPAQUE_ID_PATTERN.test(avatarId)) missing.push('HEYGEN_AVATAR_ID');
    if (!OPAQUE_ID_PATTERN.test(voiceId)) missing.push('HEYGEN_VOICE_ID');
    return {
        configured: missing.length === 0,
        missing,
        apiKey,
        avatarId,
        voiceId,
    };
}

export function heyGenProviderStatus(env = process.env) {
    const configuration = heyGenConfiguration(env);
    const engine = HEYGEN_ENGINE_LABELS.has(env.HEYGEN_VIDEO_ENGINE)
        ? env.HEYGEN_VIDEO_ENGINE
        : 'Avatar IV';
    return {
        id: 'heygen',
        label: 'HeyGen',
        capability: 'Avatar video',
        toolId: HEYGEN_AVATAR_VIDEO_TOOL.id,
        configured: configuration.configured,
        status: configuration.configured ? 'Ready' : 'Setup Required',
        model: engine,
        identity: {
            name: HEYGEN_AVATAR_VIDEO_TOOL.defaultIdentity.name,
            type: HEYGEN_AVATAR_VIDEO_TOOL.defaultIdentity.type,
        },
    };
}

export function normalizeHeyGenScriptInput(value, { env = process.env } = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { error: 'HeyGen input must be an object.' };
    }
    const configuration = heyGenConfiguration(env);
    if (!configuration.configured) {
        return { error: 'HeyGen is not configured.', missing: configuration.missing };
    }

    const script = textInput(value.script, 'Avatar script', { maximum: MAX_SCRIPT_CHARACTERS });
    if (script.error) return script;
    const title = textInput(value.title, 'Title', { optional: true, maximum: MAX_TITLE_CHARACTERS });
    if (title.error) return title;
    const avatarId = optionalOpaqueId(value.avatarId, configuration.avatarId, 'Avatar override');
    if (avatarId.error) return avatarId;
    const voiceId = optionalOpaqueId(value.voiceId, configuration.voiceId, 'Voice override');
    if (voiceId.error) return voiceId;

    const aspectRatio = value.aspectRatio == null || value.aspectRatio === '' ? '9:16' : value.aspectRatio;
    if (typeof aspectRatio !== 'string' || !HEYGEN_ASPECT_RATIOS.has(aspectRatio)) {
        return { error: 'Aspect ratio is not supported by HeyGen.' };
    }
    const resolution = value.resolution == null || value.resolution === '' ? '1080p' : value.resolution;
    if (typeof resolution !== 'string' || !HEYGEN_RESOLUTIONS.has(resolution)) {
        return { error: 'Resolution is not supported by HeyGen.' };
    }

    const background = backgroundInput(value.background);
    if (background.error) return background;
    const caption = captionInput(value.captions);
    if (caption.error) return caption;
    const motionPrompt = textInput(value.motionPrompt, 'Motion prompt', {
        optional: true,
        maximum: MAX_MOTION_PROMPT_CHARACTERS,
    });
    if (motionPrompt.error) return motionPrompt;
    const expressiveness = value.expressiveness == null || value.expressiveness === ''
        ? ''
        : value.expressiveness;
    if (typeof expressiveness !== 'string' || (expressiveness && !HEYGEN_EXPRESSIVENESS.has(expressiveness))) {
        return { error: 'Expressiveness must be low, medium, or high.' };
    }

    return {
        value: {
            title: title.value || 'G.FURY Creator Studio',
            avatarId: avatarId.value,
            aspectRatio,
            resolution,
            background: background.value,
            caption: caption.value,
            motionPrompt: motionPrompt.value,
            expressiveness,
            source: {
                type: 'script',
                script: script.value,
                voiceId: voiceId.value,
            },
        },
    };
}

export function buildHeyGenVideoPayload(input) {
    const payload = {
        type: 'avatar',
        avatar_id: input.avatarId,
        title: input.title,
        resolution: input.resolution,
        aspect_ratio: input.aspectRatio,
        output_format: 'mp4',
    };

    if (input.source?.type === 'script') {
        payload.script = input.source.script;
        payload.voice_id = input.source.voiceId;
    } else if (input.source?.type === 'audio_url') {
        payload.audio_url = input.source.audioUrl;
    } else if (input.source?.type === 'audio_asset') {
        payload.audio_asset_id = input.source.audioAssetId;
    } else {
        throw new Error('Unsupported HeyGen source mode.');
    }

    if (input.background) payload.background = input.background;
    if (input.caption) payload.caption = input.caption;
    if (input.motionPrompt) payload.motion_prompt = input.motionPrompt;
    if (input.expressiveness) payload.expressiveness = input.expressiveness;
    return payload;
}

export async function createHeyGenAvatarVideoJob(value, {
    env = process.env,
    fetchImpl = fetch,
    requestId = randomUUID(),
    timeoutMs = 60_000,
} = {}) {
    const configuration = heyGenConfiguration(env);
    if (!configuration.configured) {
        return {
            ok: false,
            kind: 'configuration',
            status: 503,
            error: 'HeyGen is not configured.',
            missing: configuration.missing,
        };
    }
    const normalized = normalizeHeyGenScriptInput(value, { env });
    if (normalized.error) {
        return {
            ok: false,
            kind: 'validation',
            status: 400,
            error: normalized.error,
        };
    }

    const result = await fetchWithTimeout(fetchImpl, `${HEYGEN_API_BASE}/videos`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': configuration.apiKey,
            'idempotency-key': requestId,
        },
        body: JSON.stringify(buildHeyGenVideoPayload(normalized.value)),
    }, timeoutMs);
    if (result.networkError) return networkFailure(result);

    const decoded = await readProviderJson(result);
    if (decoded.error) {
        return {
            ok: false,
            kind: 'provider',
            status: 502,
            error: 'HeyGen returned an invalid response.',
        };
    }
    const secrets = [configuration.apiKey, normalized.value.avatarId, normalized.value.source.voiceId];
    if (!result.ok) return providerFailure(result, decoded.value, secrets);

    const jobId = normalizedString(decoded.value?.data?.video_id || decoded.value?.data?.id);
    if (!OPAQUE_ID_PATTERN.test(jobId)) {
        return {
            ok: false,
            kind: 'provider',
            status: 502,
            error: 'HeyGen returned no valid video ID.',
        };
    }
    return {
        ok: true,
        job: publicJob({
            jobId,
            status: normalizedStatus(decoded.value?.data?.status, 'queued'),
        }),
    };
}

export async function getHeyGenAvatarVideoJob(jobId, {
    env = process.env,
    fetchImpl = fetch,
    timeoutMs = 30_000,
} = {}) {
    const configuration = heyGenConfiguration(env);
    if (!configuration.configured) {
        return {
            ok: false,
            kind: 'configuration',
            status: 503,
            error: 'HeyGen is not configured.',
            missing: configuration.missing,
        };
    }
    if (typeof jobId !== 'string' || !OPAQUE_ID_PATTERN.test(jobId)) {
        return {
            ok: false,
            kind: 'validation',
            status: 400,
            error: 'A valid HeyGen video ID is required.',
        };
    }

    const result = await fetchWithTimeout(
        fetchImpl,
        `${HEYGEN_API_BASE}/videos/${encodeURIComponent(jobId)}`,
        { headers: { 'x-api-key': configuration.apiKey } },
        timeoutMs,
    );
    if (result.networkError) return networkFailure(result);

    const decoded = await readProviderJson(result);
    if (decoded.error) {
        return {
            ok: false,
            kind: 'provider',
            status: 502,
            error: 'HeyGen returned an invalid response.',
        };
    }
    const secrets = [configuration.apiKey, configuration.avatarId, configuration.voiceId];
    if (!result.ok) return providerFailure(result, decoded.value, secrets);

    const data = decoded.value?.data || {};
    const status = normalizedStatus(data.status);
    const failureMessage = status === 'failed'
        ? safeProviderText(data.failure_message, secrets) || 'HeyGen generation failed.'
        : '';
    const failureCode = status === 'failed'
        ? safeProviderText(data.failure_code, secrets) || 'generation_failed'
        : '';
    return {
        ok: true,
        job: publicJob({
            jobId,
            status,
            videoUrl: safeOutputUrl(data.captioned_video_url) || safeOutputUrl(data.video_url),
            thumbnailUrl: safeOutputUrl(data.thumbnail_url),
            duration: safeDuration(data.duration),
            error: failureMessage ? { code: failureCode, message: failureMessage } : null,
        }),
    };
}
