import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

import { buildMuapiUrl } from './muapiProxy.js';

const SOCIAL_PLATFORMS = new Set(['instagram', 'tiktok']);
const ACCOUNT_ID_PATTERN = /^\d{1,15}$/;
const JOB_ID_PATTERN = /^[A-Za-z0-9_-]{3,200}$/;
const TIKTOK_PRIVACY = new Set([
    'PUBLIC_TO_EVERYONE',
    'MUTUAL_FOLLOW_FRIENDS',
    'FOLLOWER_OF_CREATOR',
    'SELF_ONLY',
]);
const DEFAULT_MEDIA_HOSTS = Object.freeze([
    'cdn.muapi.ai',
    '*.muapi.ai',
    '*.vercel-storage.com',
    '*.heygen.ai',
    '*.heygen.com',
]);
const MAX_PROVIDER_JSON_BYTES = 2 * 1024 * 1024;

function normalizedString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function configuredApiKey(value) {
    const key = normalizedString(value);
    if (!/^[\x21-\x7E]{8,4096}$/.test(key) || /[\r\n]/.test(key)) return false;
    return !/^(?:<.*>|change-?me|placeholder|your[-_]?api[-_]?key)$/i.test(key);
}

function textField(value, name, { maximum, optional = false } = {}) {
    if (value == null && optional) return { value: '' };
    if (typeof value !== 'string') return { error: `${name} must be text.` };
    const text = value.trim();
    if (!text && optional) return { value: '' };
    if (!text) return { error: `${name} is required.` };
    if (text.length > maximum) return { error: `${name} must be ${maximum} characters or fewer.` };
    return { value: text };
}

function platformValue(value) {
    const platform = normalizedString(value).toLowerCase();
    return SOCIAL_PLATFORMS.has(platform)
        ? { value: platform }
        : { error: 'Platform must be Instagram or TikTok.' };
}

function accountId(value) {
    const id = String(value ?? '').trim();
    return ACCOUNT_ID_PATTERN.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0
        ? { value: Number(id) }
        : { error: 'A valid connected account is required.' };
}

function configuredMediaHosts(env) {
    const values = normalizedString(env.MUAPI_SOCIAL_ALLOWED_MEDIA_HOSTS)
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter((value) => /^(?:\*\.)?[a-z0-9.-]+$/.test(value));
    return values.length ? values : DEFAULT_MEDIA_HOSTS;
}

function hostMatches(hostname, pattern) {
    if (pattern.startsWith('*.')) {
        const suffix = pattern.slice(1);
        return hostname.endsWith(suffix) && hostname.length > suffix.length;
    }
    return hostname === pattern;
}

export function safeSocialMediaUrl(value, { env = process.env } = {}) {
    if (typeof value !== 'string' || value.length > 4096) {
        return { error: 'Media URL must be a permitted public HTTPS Creator asset.' };
    }
    try {
        const url = new URL(value);
        const hostname = url.hostname.toLowerCase();
        if (
            url.protocol !== 'https:' ||
            url.username ||
            url.password ||
            url.hash ||
            hostname === 'localhost' ||
            hostname.endsWith('.local') ||
            isIP(hostname) !== 0 ||
            !configuredMediaHosts(env).some((pattern) => hostMatches(hostname, pattern))
        ) {
            return { error: 'Media URL must be a permitted public HTTPS Creator asset.' };
        }
        return { value: url.toString() };
    } catch {
        return { error: 'Media URL must be a permitted public HTTPS Creator asset.' };
    }
}

function safeRedirectUrl(value) {
    if (typeof value !== 'string' || value.length > 4096) return '';
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password || url.hash) return '';
        return url.toString();
    } catch {
        return '';
    }
}

function safeConnectionUrl(value, platform) {
    const url = safeRedirectUrl(value);
    if (!url) return '';
    const hostname = new URL(url).hostname.toLowerCase();
    const allowed = platform === 'instagram'
        ? ['muapi.ai', 'facebook.com', 'instagram.com']
        : ['muapi.ai', 'tiktok.com'];
    return allowed.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)) ? url : '';
}

async function fetchWithTimeout(fetchImpl, url, options, timeoutMs) {
    try {
        return await fetchImpl(url, {
            ...options,
            redirect: 'error',
            signal: AbortSignal.timeout(timeoutMs),
        });
    } catch (error) {
        return { networkError: error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 'timeout' : 'unavailable' };
    }
}

async function readProviderJson(response) {
    const raw = await response.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_PROVIDER_JSON_BYTES) return { error: true };
    try {
        return { value: JSON.parse(raw) };
    } catch {
        return { error: true };
    }
}

function providerFailure(response) {
    if (response.status === 401 || response.status === 403) {
        return { ok: false, status: 502, error: 'MuAPI rejected the configured social publishing credential.' };
    }
    if (response.status === 429) {
        return { ok: false, status: 429, error: 'MuAPI social publishing rate or account limit was reached.' };
    }
    if ([400, 404, 409, 422].includes(response.status)) {
        return { ok: false, status: 422, error: 'MuAPI rejected the social publishing request.' };
    }
    return { ok: false, status: 502, error: 'MuAPI social publishing is temporarily unavailable.' };
}

async function providerRequest(pathSegments, {
    env,
    fetchImpl,
    timeoutMs,
    method = 'GET',
    body,
    search = '',
} = {}) {
    const configuration = muapiSocialConfiguration(env);
    if (!configuration.configured) {
        return { ok: false, status: 503, error: 'MuAPI social publishing is not configured.', missing: configuration.missing };
    }
    const response = await fetchWithTimeout(
        fetchImpl,
        buildMuapiUrl('api/v1', pathSegments, search),
        {
            method,
            headers: {
                'x-api-key': configuration.apiKey,
                ...(body ? { 'content-type': 'application/json' } : {}),
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        },
        timeoutMs,
    );
    if (response.networkError) {
        return {
            ok: false,
            status: response.networkError === 'timeout' ? 504 : 502,
            error: response.networkError === 'timeout'
                ? 'MuAPI social publishing timed out.'
                : 'MuAPI social publishing is temporarily unavailable.',
        };
    }
    const decoded = await readProviderJson(response);
    if (decoded.error) return { ok: false, status: 502, error: 'MuAPI returned an invalid social publishing response.' };
    if (!response.ok) return providerFailure(response);
    return { ok: true, value: decoded.value, configuration };
}

export function muapiSocialConfiguration(env = process.env) {
    const dedicatedKey = normalizedString(env.MUAPI_SOCIAL_API_KEY);
    const productionKey = normalizedString(env.MUAPI_PRODUCTION_API_KEY);
    const apiKey = configuredApiKey(dedicatedKey) ? dedicatedKey : productionKey;
    const missing = [];
    if (!configuredApiKey(apiKey)) missing.push('MUAPI_SOCIAL_API_KEY or MUAPI_PRODUCTION_API_KEY');
    return {
        configured: missing.length === 0,
        missing,
        apiKey,
        credentialSource: configuredApiKey(dedicatedKey) ? 'dedicated' : 'production',
        publishingEnabled: normalizedString(env.MUAPI_ALLOW_SOCIAL_PUBLISHING).toLowerCase() === 'true',
        tiktokPublicApproved: normalizedString(env.MUAPI_TIKTOK_PUBLIC_PUBLISHING_APPROVED).toLowerCase() === 'true',
    };
}

export function muapiSocialProviderStatus(env = process.env) {
    const configuration = muapiSocialConfiguration(env);
    return {
        provider: 'muapi-social',
        configured: configuration.configured,
        publishingEnabled: configuration.publishingEnabled,
        tiktokPublicApproved: configuration.tiktokPublicApproved,
        platforms: ['instagram', 'tiktok'],
        successfulPublishCostUsd: 0.01,
        schedulingAvailable: false,
        status: !configuration.configured
            ? 'Setup Required'
            : configuration.publishingEnabled
                ? 'Publishing enabled · approval required'
                : 'Connections available · publishing locked',
        missing: configuration.missing,
    };
}

export function creatorSocialExternalId(user, env = process.env) {
    const subject = String(user?.id || '').trim();
    const secret = normalizedString(env.CREATOR_SESSION_SECRET);
    if (!/^\d+$/.test(subject) || secret.length < 32) throw new Error('Creator social identity is not configured securely.');
    return `gfury_${createHmac('sha256', secret).update(`muapi-social:${subject}`, 'utf8').digest('hex').slice(0, 32)}`;
}

function normalizeAccount(value, externalUserId) {
    const id = accountId(value?.id);
    const platform = platformValue(value?.platform_name);
    if (id.error || platform.error || value?.external_user_id !== externalUserId) return null;
    return {
        id: id.value,
        platform: platform.value,
        accountName: normalizedString(value?.account_name).slice(0, 120) || `${platform.value} account`,
        connected: value?.connected === true,
        connectedAt: normalizedString(value?.connected_at).slice(0, 40) || null,
    };
}

export async function listMuapiSocialAccounts(user, {
    env = process.env,
    fetchImpl = fetch,
    timeoutMs = 15_000,
} = {}) {
    const externalUserId = creatorSocialExternalId(user, env);
    const result = await providerRequest(['social', 'ext', 'accounts'], {
        env,
        fetchImpl,
        timeoutMs,
        search: `?external_user_id=${encodeURIComponent(externalUserId)}`,
    });
    if (!result.ok) return result;
    const values = Array.isArray(result.value) ? result.value : Array.isArray(result.value?.data) ? result.value.data : [];
    return {
        ok: true,
        accounts: values.map((value) => normalizeAccount(value, externalUserId)).filter(Boolean),
    };
}

export async function createMuapiSocialConnectUrl(user, value, {
    requestUrl,
    env = process.env,
    fetchImpl = fetch,
    timeoutMs = 15_000,
} = {}) {
    const platform = platformValue(value?.platform);
    if (platform.error) return { ok: false, status: 400, error: platform.error };
    const returnPath = typeof value?.returnTo === 'string' && /^\/studio(?:\/|$)/.test(value.returnTo) && !value.returnTo.includes('//')
        ? value.returnTo.slice(0, 512)
        : '/studio/publish';
    let redirectTo;
    try {
        const origin = new URL(requestUrl).origin;
        redirectTo = new URL(returnPath, origin);
        redirectTo.searchParams.set('social', 'connected');
    } catch {
        return { ok: false, status: 400, error: 'Social connection return URL is invalid.' };
    }
    const result = await providerRequest(['social', platform.value, 'connect-url'], {
        env,
        fetchImpl,
        timeoutMs,
        method: 'POST',
        body: {
            external_user_id: creatorSocialExternalId(user, env),
            redirect_to: redirectTo.toString(),
        },
    });
    if (!result.ok) return result;
    const url = safeConnectionUrl(result.value?.url, platform.value);
    return url
        ? { ok: true, platform: platform.value, url }
        : { ok: false, status: 502, error: 'MuAPI returned no valid social connection URL.' };
}

export async function disconnectMuapiSocialAccount(user, value, options = {}) {
    if (value?.approved !== true) {
        return { ok: false, status: 400, error: 'Explicit approval is required before disconnecting a social account.' };
    }
    const id = accountId(value?.accountId);
    if (id.error) return { ok: false, status: 400, error: id.error };
    const accounts = await listMuapiSocialAccounts(user, options);
    if (!accounts.ok) return accounts;
    const account = accounts.accounts.find((item) => item.id === id.value);
    if (!account) return { ok: false, status: 404, error: 'Connected social account was not found.' };
    const result = await providerRequest(['social', 'ext', 'accounts', id.value, 'disconnect'], {
        env: options.env || process.env,
        fetchImpl: options.fetchImpl || fetch,
        timeoutMs: options.timeoutMs || 15_000,
        method: 'POST',
    });
    return result.ok
        ? { ok: true, accountId: id.value, platform: account.platform, disconnected: true }
        : result;
}

function publishInput(value, configuration, env) {
    if (value?.approved !== true) return { error: 'Review and explicit approval are required before publishing.' };
    if (value?.scheduledAt || value?.scheduled_at) {
        return { error: 'Social scheduling is not available through the verified REST contract.' };
    }
    const platform = platformValue(value?.platform);
    if (platform.error) return platform;
    const id = accountId(value?.accountId);
    if (id.error) return id;
    const mediaUrl = safeSocialMediaUrl(value?.mediaUrl, { env });
    if (mediaUrl.error) return mediaUrl;
    const caption = textField(value?.caption, platform.value === 'tiktok' ? 'TikTok caption' : 'Instagram caption', {
        maximum: platform.value === 'tiktok' ? 150 : 2200,
        optional: true,
    });
    if (caption.error) return caption;
    const mediaType = normalizedString(value?.mediaType).toUpperCase();
    if (platform.value === 'tiktok' && mediaType !== 'VIDEO') return { error: 'TikTok publishing currently requires a video Asset.' };
    if (platform.value === 'instagram' && !['IMAGE', 'VIDEO'].includes(mediaType)) {
        return { error: 'Instagram publishing requires an image or video Asset.' };
    }
    const requestedPrivacy = normalizedString(value?.privacyLevel).toUpperCase() || 'SELF_ONLY';
    if (!TIKTOK_PRIVACY.has(requestedPrivacy)) return { error: 'TikTok privacy selection is invalid.' };
    return {
        value: {
            platform: platform.value,
            accountId: id.value,
            mediaUrl: mediaUrl.value,
            caption: caption.value,
            mediaType,
            privacyLevel: platform.value === 'tiktok' && !configuration.tiktokPublicApproved
                ? 'SELF_ONLY'
                : requestedPrivacy,
            disableComment: value?.disableComment === true,
            disableDuet: value?.disableDuet === true,
            disableStitch: value?.disableStitch === true,
            shareToFeed: value?.shareToFeed !== false,
            placement: ['reels', 'stories', 'timeline'].includes(value?.placement) ? value.placement : 'reels',
        },
    };
}

export async function publishMuapiSocial(user, value, {
    env = process.env,
    fetchImpl = fetch,
    timeoutMs = 30_000,
} = {}) {
    const configuration = muapiSocialConfiguration(env);
    if (!configuration.configured) {
        return { ok: false, status: 503, error: 'MuAPI social publishing is not configured.', missing: configuration.missing };
    }
    if (!configuration.publishingEnabled) {
        return { ok: false, status: 403, error: 'MuAPI social publishing is locked. Enable it explicitly before publishing.' };
    }
    const normalized = publishInput(value, configuration, env);
    if (normalized.error) return { ok: false, status: 400, error: normalized.error };
    const accounts = await listMuapiSocialAccounts(user, { env, fetchImpl, timeoutMs });
    if (!accounts.ok) return accounts;
    const account = accounts.accounts.find((item) =>
        item.id === normalized.value.accountId &&
        item.platform === normalized.value.platform &&
        item.connected
    );
    if (!account) return { ok: false, status: 422, error: 'Select a connected account for the chosen platform.' };

    const body = normalized.value.platform === 'instagram'
        ? {
            account_id: account.id,
            media_url: normalized.value.mediaUrl,
            caption: normalized.value.caption,
            media_type: normalized.value.mediaType,
            placement: normalized.value.placement,
            share_to_feed: normalized.value.shareToFeed,
        }
        : {
            account_id: account.id,
            media_url: normalized.value.mediaUrl,
            title: normalized.value.caption,
            privacy_level: normalized.value.privacyLevel,
            disable_comment: normalized.value.disableComment,
            disable_duet: normalized.value.disableDuet,
            disable_stitch: normalized.value.disableStitch,
        };
    const result = await providerRequest([`${normalized.value.platform}-publish`], {
        env,
        fetchImpl,
        timeoutMs,
        method: 'POST',
        body,
    });
    if (!result.ok) return result;
    const jobId = normalizedString(result.value?.request_id || result.value?.id);
    if (!JOB_ID_PATTERN.test(jobId)) return { ok: false, status: 502, error: 'MuAPI returned no valid social publishing job ID.' };
    return {
        ok: true,
        status: 202,
        post: {
            provider: 'muapi-social',
            platform: normalized.value.platform,
            accountId: account.id,
            accountName: account.accountName,
            jobId,
            status: 'publishing',
            privacyLevel: normalized.value.platform === 'tiktok' ? normalized.value.privacyLevel : null,
            estimatedSuccessfulPublishCostUsd: 0.01,
        },
    };
}

function normalizedPostStatus(value) {
    const raw = normalizedString(value).toLowerCase();
    if (['completed', 'succeeded', 'success', 'done'].includes(raw)) return 'published';
    if (['failed', 'error', 'canceled', 'cancelled'].includes(raw)) return 'failed';
    return 'publishing';
}

export async function getMuapiSocialPostStatus(jobId, {
    env = process.env,
    fetchImpl = fetch,
    timeoutMs = 15_000,
} = {}) {
    const id = normalizedString(jobId);
    if (!JOB_ID_PATTERN.test(id)) return { ok: false, status: 400, error: 'Social publishing job ID is invalid.' };
    const result = await providerRequest(['predictions', id, 'result'], { env, fetchImpl, timeoutMs });
    if (!result.ok) return result;
    const status = normalizedPostStatus(result.value?.status || result.value?.data?.status);
    const platform = platformValue(result.value?.output?.platform || result.value?.data?.output?.platform);
    const url = safeRedirectUrl(result.value?.output?.url || result.value?.data?.output?.url);
    return {
        ok: true,
        post: {
            provider: 'muapi-social',
            jobId: id,
            status,
            platform: platform.value || null,
            url: url || null,
            error: status === 'failed' ? 'Social publishing failed.' : null,
        },
    };
}
