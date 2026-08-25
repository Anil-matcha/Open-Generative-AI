import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes,
} from 'node:crypto';

import { del as deleteBlob, get as getBlob, list as listBlobs, put as putBlob } from '@vercel/blob';

import { evaluateJsonSafety } from './contentSafety.js';
import { authorizeCreatorRequest, creatorJson } from './creatorProviderGateway.js';
import { YOUTUBE_PUBLISH_TOOL_ID } from './creatorToolRegistry.js';

export const YOUTUBE_UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload';
export const YOUTUBE_ALLOWED_VIDEO_MIME_TYPES = Object.freeze([
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-m4v',
    'video/x-matroska',
]);

const ALLOWED_VIDEO_MIME_TYPES = new Set(YOUTUBE_ALLOWED_VIDEO_MIME_TYPES);
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const YOUTUBE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';
const TOKEN_ROOT = 'creator-social/youtube-credentials';
const HISTORY_ROOT = 'creator-social/youtube-history';
const CLAIM_ROOT = 'creator-social/youtube-publish-claims';
const STAGING_ROOT = 'creator-youtube-staging';
const DEFAULT_MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
const MAX_CONFIGURED_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
// Leave a small margin for authorization, upload initialization, and cleanup
// within the route's 300-second Vercel Hobby execution limit.
const DEFAULT_UPLOAD_TIMEOUT_MS = 285 * 1000;
const MAX_UPLOAD_TIMEOUT_MS = 285 * 1000;
const STAGING_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const CLAIM_MAX_AGE_MS = 15 * 60 * 1000;
const MAX_JSON_BODY_BYTES = 32 * 1024;
const MAX_STORED_RECORD_BYTES = 64 * 1024;
const MAX_GOOGLE_RESPONSE_BYTES = 256 * 1024;
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{6,32}$/;

const defaultBlobStore = {
    del: deleteBlob,
    get: getBlob,
    list: listBlobs,
    put: putBlob,
};

function normalized(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function boundedInteger(value, fallback, minimum, maximum) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, Math.round(parsed)));
}

function decodeEncryptionKey(value) {
    const raw = normalized(value);
    if (!/^[A-Za-z0-9+/_-]{43,44}={0,2}$/.test(raw)) return null;
    const standard = raw.replaceAll('-', '+').replaceAll('_', '/');
    try {
        const key = Buffer.from(standard, 'base64');
        return key.length === 32 ? key : null;
    } catch {
        return null;
    }
}

function secureCallbackUrl(value, env) {
    try {
        const url = new URL(normalized(value));
        const localDevelopment = env.NODE_ENV === 'development' &&
            url.protocol === 'http:' &&
            ['127.0.0.1', '::1', 'localhost'].includes(url.hostname);
        if (
            (!localDevelopment && url.protocol !== 'https:') ||
            url.username ||
            url.password ||
            url.hash ||
            url.search ||
            url.pathname !== '/api/social/youtube/callback'
        ) {
            return null;
        }
        return url.toString();
    } catch {
        return null;
    }
}

export function youtubeConfiguration(env = process.env) {
    const clientId = normalized(env.YOUTUBE_OAUTH_CLIENT_ID);
    const clientSecret = normalized(env.YOUTUBE_OAUTH_CLIENT_SECRET);
    const callbackUrl = secureCallbackUrl(env.YOUTUBE_OAUTH_CALLBACK_URL, env);
    const encryptionKey = decodeEncryptionKey(env.YOUTUBE_TOKEN_ENCRYPTION_KEY);
    const blobToken = normalized(env.BLOB_READ_WRITE_TOKEN);
    const missing = [];

    if (!/^[A-Za-z0-9._-]{20,220}\.apps\.googleusercontent\.com$/.test(clientId)) {
        missing.push('YOUTUBE_OAUTH_CLIENT_ID');
    }
    if (clientSecret.length < 20 || clientSecret.length > 512) {
        missing.push('YOUTUBE_OAUTH_CLIENT_SECRET');
    }
    if (!callbackUrl) missing.push('YOUTUBE_OAUTH_CALLBACK_URL');
    if (!encryptionKey) missing.push('YOUTUBE_TOKEN_ENCRYPTION_KEY');
    if (blobToken.length < 20 || blobToken.length > 4096) missing.push('BLOB_READ_WRITE_TOKEN');

    if (missing.length) {
        return {
            configured: false,
            error: 'YouTube publishing is not configured securely.',
            missing,
        };
    }

    return {
        configured: true,
        clientId,
        clientSecret,
        callbackUrl,
        encryptionKey,
        blobToken,
    };
}

export function youtubeCookieSettings(env = process.env) {
    const prefix = env.NODE_ENV === 'development' ? '' : '__Host-';
    return {
        secure: env.NODE_ENV !== 'development',
        stateName: `${prefix}creator_youtube_oauth_state`,
        verifierName: `${prefix}creator_youtube_oauth_verifier`,
        subjectName: `${prefix}creator_youtube_oauth_subject`,
        returnName: `${prefix}creator_youtube_oauth_return`,
    };
}

export function youtubeMaxUploadBytes(env = process.env) {
    return boundedInteger(
        env.YOUTUBE_UPLOAD_MAX_BYTES,
        DEFAULT_MAX_UPLOAD_BYTES,
        1024 * 1024,
        MAX_CONFIGURED_UPLOAD_BYTES,
    );
}

function youtubeUploadTimeout(env = process.env) {
    return boundedInteger(
        env.YOUTUBE_UPLOAD_TIMEOUT_MS,
        DEFAULT_UPLOAD_TIMEOUT_MS,
        30_000,
        MAX_UPLOAD_TIMEOUT_MS,
    );
}

function userNamespace(userId) {
    return createHash('sha256').update(String(userId), 'utf8').digest('hex').slice(0, 32);
}

export function youtubeStagingPrefix(userId) {
    const normalizedUserId = String(userId || '');
    if (!/^\d{1,30}$/.test(normalizedUserId)) return '';
    return `${STAGING_ROOT}/${normalizedUserId}/`;
}

export function isYoutubeStagingPath(pathname, userId) {
    const prefix = youtubeStagingPrefix(userId);
    if (!prefix || typeof pathname !== 'string' || pathname.length > 320) return false;
    if (!pathname.startsWith(prefix) || pathname.includes('..') || pathname.includes('\\') || pathname.includes('//')) {
        return false;
    }
    const filename = pathname.slice(prefix.length);
    return /^[A-Za-z0-9_-]{8,100}-[A-Za-z0-9][A-Za-z0-9._-]{0,140}$/.test(filename);
}

function credentialPath(userId) {
    return `${TOKEN_ROOT}/${userNamespace(userId)}.json.enc`;
}

function historyPrefix(userId) {
    return `${HISTORY_ROOT}/${userNamespace(userId)}/`;
}

function claimPath(userId, stagingPathname) {
    const digest = createHash('sha256').update(stagingPathname, 'utf8').digest('hex');
    return `${CLAIM_ROOT}/${userNamespace(userId)}/${digest}.json.enc`;
}

function blobAuthOptions(configuration) {
    return { token: configuration.blobToken };
}

function encryptRecord(value, aad, configuration) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', configuration.encryptionKey, iv);
    cipher.setAAD(Buffer.from(aad, 'utf8'));
    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(value), 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [
        'v1',
        iv.toString('base64url'),
        encrypted.toString('base64url'),
        tag.toString('base64url'),
    ].join('.');
}

function decryptRecord(value, aad, configuration) {
    if (typeof value !== 'string' || value.length > MAX_STORED_RECORD_BYTES) {
        throw new Error('Encrypted YouTube record is invalid.');
    }
    const parts = value.split('.');
    if (parts.length !== 4 || parts[0] !== 'v1') {
        throw new Error('Encrypted YouTube record is invalid.');
    }
    try {
        const iv = Buffer.from(parts[1], 'base64url');
        const encrypted = Buffer.from(parts[2], 'base64url');
        const tag = Buffer.from(parts[3], 'base64url');
        if (iv.length !== 12 || tag.length !== 16 || encrypted.length === 0) {
            throw new Error('invalid_record');
        }
        const decipher = createDecipheriv('aes-256-gcm', configuration.encryptionKey, iv);
        decipher.setAAD(Buffer.from(aad, 'utf8'));
        decipher.setAuthTag(tag);
        const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
        return JSON.parse(plaintext);
    } catch {
        throw new Error('Encrypted YouTube record could not be authenticated.');
    }
}

async function blobText(result) {
    if (!result || result.statusCode !== 200 || !result.stream || !result.blob) return null;
    if (!Number.isFinite(result.blob.size) || result.blob.size <= 0 || result.blob.size > MAX_STORED_RECORD_BYTES) {
        throw new Error('Stored YouTube record is invalid.');
    }
    const text = await new Response(result.stream).text();
    if (new TextEncoder().encode(text).byteLength > MAX_STORED_RECORD_BYTES) {
        throw new Error('Stored YouTube record is invalid.');
    }
    return text;
}

export async function saveYoutubeCredential(user, credential, {
    env = process.env,
    blobStore = defaultBlobStore,
    now = Date.now(),
} = {}) {
    const configuration = youtubeConfiguration(env);
    if (!configuration.configured) throw new Error(configuration.error);
    const userId = String(user?.id || '');
    const refreshToken = normalized(credential?.refreshToken);
    if (!/^\d{1,30}$/.test(userId) || refreshToken.length < 10 || refreshToken.length > 4096) {
        throw new Error('YouTube credential is invalid.');
    }
    const record = {
        v: 1,
        refreshToken,
        scope: YOUTUBE_UPLOAD_SCOPE,
        connectedAt: new Date(now).toISOString(),
    };
    const encrypted = encryptRecord(record, `youtube-credential:${userId}`, configuration);
    await blobStore.put(credentialPath(userId), encrypted, {
        ...blobAuthOptions(configuration),
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
        contentType: 'application/octet-stream',
    });
    return { connectedAt: record.connectedAt };
}

export async function loadYoutubeCredential(user, {
    env = process.env,
    blobStore = defaultBlobStore,
} = {}) {
    const configuration = youtubeConfiguration(env);
    if (!configuration.configured) throw new Error(configuration.error);
    const userId = String(user?.id || '');
    if (!/^\d{1,30}$/.test(userId)) throw new Error('YouTube user identity is invalid.');
    const result = await blobStore.get(credentialPath(userId), {
        ...blobAuthOptions(configuration),
        access: 'private',
        useCache: false,
    });
    const encrypted = await blobText(result);
    if (!encrypted) return null;
    const record = decryptRecord(encrypted, `youtube-credential:${userId}`, configuration);
    if (
        record?.v !== 1 ||
        record?.scope !== YOUTUBE_UPLOAD_SCOPE ||
        typeof record.refreshToken !== 'string' ||
        record.refreshToken.length < 10 ||
        record.refreshToken.length > 4096 ||
        typeof record.connectedAt !== 'string'
    ) {
        throw new Error('Stored YouTube credential is invalid.');
    }
    return record;
}

export async function deleteYoutubeCredential(user, {
    env = process.env,
    blobStore = defaultBlobStore,
} = {}) {
    const configuration = youtubeConfiguration(env);
    if (!configuration.configured) throw new Error(configuration.error);
    const userId = String(user?.id || '');
    if (!/^\d{1,30}$/.test(userId)) throw new Error('YouTube user identity is invalid.');
    await blobStore.del(credentialPath(userId), blobAuthOptions(configuration));
}

function parseScopes(value) {
    return normalized(value).split(/\s+/).filter(Boolean);
}

function hasOnlyUploadScope(value) {
    const scopes = parseScopes(value);
    return scopes.length === 1 && scopes[0] === YOUTUBE_UPLOAD_SCOPE;
}

async function limitedJson(response, maximum = MAX_GOOGLE_RESPONSE_BYTES) {
    const declared = Number(response?.headers?.get?.('content-length') || 0);
    if (declared > maximum) return { error: 'response_too_large' };
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maximum) return { error: 'response_too_large' };
    if (!text) return { value: {} };
    try {
        return { value: JSON.parse(text) };
    } catch {
        return { error: 'invalid_json' };
    }
}

async function googleFetch(fetchImpl, url, options, timeoutMs = 15_000) {
    try {
        return await fetchImpl(url, {
            ...options,
            cache: 'no-store',
            redirect: 'error',
            signal: AbortSignal.timeout(timeoutMs),
        });
    } catch (error) {
        return {
            networkError: error?.name === 'TimeoutError' || error?.name === 'AbortError'
                ? 'timeout'
                : 'unavailable',
        };
    }
}

export function youtubeAuthorizationUrl({ state, challenge, env = process.env }) {
    const configuration = youtubeConfiguration(env);
    if (!configuration.configured) throw new Error(configuration.error);
    if (!/^[A-Za-z0-9_-]{40,128}$/.test(state) || !/^[A-Za-z0-9_-]{40,128}$/.test(challenge)) {
        throw new Error('YouTube OAuth state is invalid.');
    }
    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set('client_id', configuration.clientId);
    url.searchParams.set('redirect_uri', configuration.callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', YOUTUBE_UPLOAD_SCOPE);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    return url;
}

export async function exchangeYoutubeAuthorizationCode({
    code,
    verifier,
    env = process.env,
    fetchImpl = fetch,
} = {}) {
    const configuration = youtubeConfiguration(env);
    if (!configuration.configured) return { error: 'youtube_not_configured' };
    if (typeof code !== 'string' || code.length < 4 || code.length > 2048) return { error: 'invalid_code' };
    if (typeof verifier !== 'string' || !/^[A-Za-z0-9_-]{40,128}$/.test(verifier)) {
        return { error: 'invalid_verifier' };
    }
    const response = await googleFetch(fetchImpl, GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: configuration.clientId,
            client_secret: configuration.clientSecret,
            code,
            code_verifier: verifier,
            grant_type: 'authorization_code',
            redirect_uri: configuration.callbackUrl,
        }),
    });
    if (response.networkError) return { error: `network_${response.networkError}` };
    const decoded = await limitedJson(response);
    if (!response.ok || decoded.error) return { error: 'token_exchange_failed' };
    const accessToken = normalized(decoded.value?.access_token);
    const refreshToken = normalized(decoded.value?.refresh_token);
    if (
        normalized(decoded.value?.token_type).toLowerCase() !== 'bearer' ||
        accessToken.length < 10 ||
        accessToken.length > 4096 ||
        refreshToken.length < 10 ||
        refreshToken.length > 4096 ||
        !hasOnlyUploadScope(decoded.value?.scope)
    ) {
        return { error: 'token_response_rejected', refreshToken: refreshToken || null };
    }
    return { accessToken, refreshToken, scope: YOUTUBE_UPLOAD_SCOPE };
}

export async function revokeYoutubeToken(token, {
    fetchImpl = fetch,
} = {}) {
    const normalizedToken = normalized(token);
    if (normalizedToken.length < 10 || normalizedToken.length > 4096) return { revoked: false, invalid: true };
    const response = await googleFetch(fetchImpl, GOOGLE_REVOKE_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: normalizedToken }),
    });
    if (response.networkError) return { revoked: false, networkError: response.networkError };
    return { revoked: response.ok || response.status === 400, status: response.status };
}

async function refreshYoutubeAccessToken(refreshToken, {
    env,
    fetchImpl,
}) {
    const configuration = youtubeConfiguration(env);
    if (!configuration.configured) return { error: 'youtube_not_configured' };
    const response = await googleFetch(fetchImpl, GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: configuration.clientId,
            client_secret: configuration.clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });
    if (response.networkError) return { error: `network_${response.networkError}` };
    const decoded = await limitedJson(response);
    if (!response.ok || decoded.error) {
        return { error: response.status === 400 ? 'reconnect_required' : 'refresh_failed' };
    }
    const accessToken = normalized(decoded.value?.access_token);
    const returnedScope = normalized(decoded.value?.scope);
    if (
        normalized(decoded.value?.token_type).toLowerCase() !== 'bearer' ||
        accessToken.length < 10 ||
        accessToken.length > 4096 ||
        (returnedScope && !hasOnlyUploadScope(returnedScope))
    ) {
        return { error: 'refresh_response_rejected' };
    }
    return { accessToken };
}

function textField(value, name, maximum, { optional = false } = {}) {
    if ((value == null || value === '') && optional) return { value: '' };
    if (typeof value !== 'string') return { error: `${name} must be text.` };
    const result = value.trim();
    if (!result && !optional) return { error: `${name} is required.` };
    if (result.length > maximum) return { error: `${name} must be ${maximum} characters or fewer.` };
    return { value: result };
}

function tagsField(value) {
    const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
    const tags = raw.map((item) => String(item).trim()).filter(Boolean);
    if (tags.length > 30 || tags.some((tag) => tag.length > 100) || tags.join(',').length > 500) {
        return { error: 'Tags must contain at most 30 short values and 500 total characters.' };
    }
    return { value: tags };
}

function parsePublishInput(value, user, env) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { error: 'The publish request must be a JSON object.' };
    }
    const pathname = normalized(value.pathname);
    if (!isYoutubeStagingPath(pathname, user.id)) {
        return { error: 'The staged video path is invalid.' };
    }
    const title = textField(value.title, 'Title', 100);
    if (title.error) return title;
    const description = textField(value.description, 'Description', 5000, { optional: true });
    if (description.error) return description;
    const tags = tagsField(value.tags);
    if (tags.error) return tags;
    if (typeof value.madeForKids !== 'boolean') {
        return { error: 'Choose whether this video is made for children.' };
    }
    if (typeof value.containsSyntheticMedia !== 'boolean') {
        return { error: 'Choose whether this video contains synthetic media.' };
    }
    if (value.approved !== true) {
        return { error: 'Confirm the private YouTube upload before publishing.' };
    }
    return {
        value: {
            pathname,
            title: title.value,
            description: description.value,
            tags: tags.value,
            madeForKids: value.madeForKids,
            containsSyntheticMedia: value.containsSyntheticMedia,
            maxUploadBytes: youtubeMaxUploadBytes(env),
        },
    };
}

async function parsePublishRequest(request, env) {
    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_JSON_BODY_BYTES) {
        return { response: creatorJson({ error: 'Publish metadata is too large.' }, 413) };
    }
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_JSON_BODY_BYTES) {
        return { response: creatorJson({ error: 'Publish metadata is too large.' }, 413) };
    }
    let value;
    try {
        value = JSON.parse(raw);
    } catch {
        return { response: creatorJson({ error: 'Valid publish metadata is required.' }, 400) };
    }
    const safety = evaluateJsonSafety(raw, { env });
    if (!safety.allowed) {
        return {
            response: creatorJson({
                error: 'Publish request blocked by content safety policy.',
                reason: safety.reason,
            }, 422),
        };
    }
    return { value };
}

async function inspectVideoStream(stream, contentType) {
    const reader = stream.getReader();
    const initialChunks = [];
    let prefix = Buffer.alloc(0);
    while (prefix.length < 16) {
        const next = await reader.read();
        if (next.done) break;
        const chunk = next.value instanceof Uint8Array ? next.value : new Uint8Array(next.value);
        initialChunks.push(chunk);
        prefix = Buffer.concat([
            prefix,
            Buffer.from(chunk.slice(0, Math.max(0, 16 - prefix.length))),
        ]);
    }

    const isoMedia = ['video/mp4', 'video/quicktime', 'video/x-m4v'].includes(contentType) &&
        prefix.length >= 12 && prefix.subarray(4, 8).toString('ascii') === 'ftyp';
    const matroska = ['video/webm', 'video/x-matroska'].includes(contentType) &&
        prefix.length >= 4 &&
        prefix[0] === 0x1a && prefix[1] === 0x45 && prefix[2] === 0xdf && prefix[3] === 0xa3;
    if (!isoMedia && !matroska) {
        await reader.cancel('invalid_video_signature').catch(() => {});
        return { error: 'The uploaded file does not match its declared video type.' };
    }

    let initialIndex = 0;
    const replayStream = new ReadableStream({
        async pull(controller) {
            if (initialIndex < initialChunks.length) {
                controller.enqueue(initialChunks[initialIndex]);
                initialIndex += 1;
                return;
            }
            const next = await reader.read();
            if (next.done) controller.close();
            else controller.enqueue(next.value);
        },
        cancel(reason) {
            return reader.cancel(reason);
        },
    });
    return { stream: replayStream };
}

function validYoutubeUploadLocation(value) {
    if (typeof value !== 'string' || value.length > 4096) return '';
    try {
        const url = new URL(value);
        const uploadId = url.searchParams.get('upload_id');
        return url.origin === 'https://www.googleapis.com' &&
            url.pathname === '/upload/youtube/v3/videos' &&
            typeof uploadId === 'string' &&
            uploadId.length > 0 &&
            uploadId.length <= 2048 &&
            !url.username &&
            !url.password &&
            !url.hash
            ? url.toString()
            : '';
    } catch {
        return '';
    }
}

function safeGoogleMessage(value) {
    const message = value?.error?.message || value?.message || '';
    return typeof message === 'string'
        ? message
            .replace(/[\u0000-\u001F\u007F]/g, ' ')
            .replace(/\bya29\.[A-Za-z0-9._-]{10,}\b/g, '[redacted]')
            .replace(/\b1\/\/[A-Za-z0-9._-]{10,}\b/g, '[redacted]')
            .replace(/\bGOCSPX-[A-Za-z0-9_-]{10,}\b/g, '[redacted]')
            .trim()
            .slice(0, 300)
        : '';
}

function youtubeFailure(response, value, phase) {
    const detail = safeGoogleMessage(value);
    if (response.status === 401 || response.status === 403) {
        return creatorJson({ error: 'YouTube rejected the connected account or upload permission.' }, 409);
    }
    if (response.status === 429) {
        return creatorJson({ error: 'YouTube upload quota was reached. Try again later.' }, 429);
    }
    if (response.status >= 400 && response.status < 500) {
        return creatorJson({
            error: `YouTube rejected the ${phase}.`,
            ...(detail ? { detail } : {}),
        }, 422);
    }
    return creatorJson({ error: `YouTube could not complete the ${phase}.` }, 502);
}

async function writePublishClaim(pathname, userId, stagingPathname, {
    configuration,
    blobStore,
    now,
}) {
    const encrypted = encryptRecord({
        v: 1,
        stagingPathHash: createHash('sha256').update(stagingPathname, 'utf8').digest('hex'),
        claimedAt: new Date(now).toISOString(),
    }, `youtube-publish-claim:${userId}:${pathname}`, configuration);
    await blobStore.put(pathname, encrypted, {
        ...blobAuthOptions(configuration),
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: false,
        cacheControlMaxAge: 60,
        contentType: 'application/octet-stream',
    });
}

async function acquirePublishClaim(user, stagingPathname, {
    env,
    blobStore,
    now,
}) {
    const configuration = youtubeConfiguration(env);
    const userId = String(user.id);
    const pathname = claimPath(userId, stagingPathname);
    try {
        await writePublishClaim(pathname, userId, stagingPathname, {
            configuration,
            blobStore,
            now,
        });
        return { claimed: true, pathname };
    } catch {
        // A fixed, non-overwritable private Blob acts as a distributed replay lock.
    }

    let existing;
    try {
        const result = await blobStore.get(pathname, {
            ...blobAuthOptions(configuration),
            access: 'private',
            useCache: false,
        });
        const encrypted = await blobText(result);
        existing = encrypted
            ? decryptRecord(encrypted, `youtube-publish-claim:${userId}:${pathname}`, configuration)
            : null;
    } catch {
        return { claimed: false, error: 'claim_unavailable' };
    }

    const claimedAt = new Date(existing?.claimedAt).getTime();
    if (existing?.v === 1 && Number.isFinite(claimedAt) && now - claimedAt <= CLAIM_MAX_AGE_MS) {
        return { claimed: false, conflict: true };
    }

    try {
        await blobStore.del(pathname, blobAuthOptions(configuration));
        await writePublishClaim(pathname, userId, stagingPathname, {
            configuration,
            blobStore,
            now,
        });
        return { claimed: true, pathname };
    } catch {
        return { claimed: false, conflict: true };
    }
}

async function releasePublishClaim(pathname, configuration, blobStore) {
    if (!pathname) return;
    await blobStore.del(pathname, blobAuthOptions(configuration));
}

async function saveYoutubeHistory(user, record, {
    env,
    blobStore,
    now,
}) {
    const configuration = youtubeConfiguration(env);
    const userId = String(user.id);
    const pathname = `${historyPrefix(userId)}${String(now).padStart(13, '0')}-${record.videoId}.json.enc`;
    const encrypted = encryptRecord(
        { v: 1, ...record },
        `youtube-history:${userId}:${pathname}`,
        configuration,
    );
    await blobStore.put(pathname, encrypted, {
        ...blobAuthOptions(configuration),
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: false,
        cacheControlMaxAge: 60,
        contentType: 'application/octet-stream',
    });
}

async function readYoutubeHistory(user, {
    env,
    blobStore,
    limit = 10,
}) {
    const configuration = youtubeConfiguration(env);
    const userId = String(user.id);
    const listed = await blobStore.list({
        ...blobAuthOptions(configuration),
        prefix: historyPrefix(userId),
        limit: 50,
    });
    const items = [...(listed.blobs || [])]
        .sort((left, right) => String(right.pathname).localeCompare(String(left.pathname)))
        .slice(0, limit);
    const history = [];
    for (const item of items) {
        try {
            const result = await blobStore.get(item.pathname, {
                ...blobAuthOptions(configuration),
                access: 'private',
                useCache: false,
            });
            const encrypted = await blobText(result);
            if (!encrypted) continue;
            const record = decryptRecord(
                encrypted,
                `youtube-history:${userId}:${item.pathname}`,
                configuration,
            );
            if (record?.v === 1 && VIDEO_ID_PATTERN.test(record.videoId)) {
                history.push({
                    videoId: record.videoId,
                    title: String(record.title || '').slice(0, 100),
                    privacyStatus: 'private',
                    uploadedAt: record.uploadedAt,
                    url: `https://www.youtube.com/watch?v=${record.videoId}`,
                    studioUrl: `https://studio.youtube.com/video/${record.videoId}/edit`,
                });
            }
        } catch {
            // Ignore an individual malformed history record without exposing its contents.
        }
    }
    return history;
}

export async function cleanupExpiredYoutubeStaging(user, {
    env = process.env,
    blobStore = defaultBlobStore,
    now = Date.now(),
} = {}) {
    const configuration = youtubeConfiguration(env);
    if (!configuration.configured) return { deleted: 0 };
    const prefix = youtubeStagingPrefix(user?.id);
    if (!prefix) return { deleted: 0 };
    const expired = [];
    let cursor;
    for (let page = 0; page < 5; page += 1) {
        const listed = await blobStore.list({
            ...blobAuthOptions(configuration),
            prefix,
            limit: 100,
            ...(cursor ? { cursor } : {}),
        });
        expired.push(...(listed.blobs || [])
            .filter((item) => now - new Date(item.uploadedAt).getTime() > STAGING_MAX_AGE_MS)
            .map((item) => item.url || item.pathname)
            .filter(Boolean));
        cursor = listed.cursor;
        if (!listed.hasMore || !cursor) break;
    }
    if (expired.length) await blobStore.del(expired, blobAuthOptions(configuration));
    return { deleted: expired.length };
}

export async function getYoutubeConnectionStatus(user, {
    env = process.env,
    blobStore = defaultBlobStore,
    now = Date.now(),
} = {}) {
    const configuration = youtubeConfiguration(env);
    if (!configuration.configured) {
        return {
            provider: 'youtube',
            toolId: YOUTUBE_PUBLISH_TOOL_ID,
            configured: false,
            connected: false,
            missing: configuration.missing,
            maxUploadBytes: youtubeMaxUploadBytes(env),
            history: [],
        };
    }
    const credential = await loadYoutubeCredential(user, { env, blobStore });
    const [history] = await Promise.all([
        readYoutubeHistory(user, { env, blobStore }).catch(() => []),
        cleanupExpiredYoutubeStaging(user, { env, blobStore, now }).catch(() => ({ deleted: 0 })),
    ]);
    return {
        provider: 'youtube',
        toolId: YOUTUBE_PUBLISH_TOOL_ID,
        configured: true,
        connected: Boolean(credential),
        connectedAt: credential?.connectedAt || null,
        scope: credential ? 'Upload videos only' : null,
        privacyMode: 'private',
        maxUploadBytes: youtubeMaxUploadBytes(env),
        history,
    };
}

export async function disconnectYoutube(user, {
    env = process.env,
    blobStore = defaultBlobStore,
    fetchImpl = fetch,
} = {}) {
    const credential = await loadYoutubeCredential(user, { env, blobStore });
    if (!credential) return { disconnected: true, wasConnected: false };
    const revocation = await revokeYoutubeToken(credential.refreshToken, { fetchImpl });
    if (!revocation.revoked) {
        return { disconnected: false, error: 'youtube_revocation_failed' };
    }
    await deleteYoutubeCredential(user, { env, blobStore });
    return { disconnected: true, wasConnected: true };
}

export async function handleYoutubePublish(request, {
    env = process.env,
    blobStore = defaultBlobStore,
    fetchImpl = fetch,
    now = Date.now(),
} = {}) {
    const auth = authorizeCreatorRequest(request, { env, action: 'youtube-publish' });
    if (auth.response) return auth.response;
    const configuration = youtubeConfiguration(env);
    if (!configuration.configured) {
        return creatorJson({ error: configuration.error, missing: configuration.missing }, 503);
    }

    const parsed = await parsePublishRequest(request, env);
    if (parsed.response) return parsed.response;
    const input = parsePublishInput(parsed.value, auth.user, env);
    if (input.error) return creatorJson({ error: input.error }, 400);

    let credential;
    try {
        credential = await loadYoutubeCredential(auth.user, { env, blobStore });
    } catch {
        return creatorJson({ error: 'The encrypted YouTube connection could not be read.' }, 503);
    }
    if (!credential) {
        return creatorJson({ error: 'Connect a YouTube account before uploading.' }, 409);
    }

    let staged;
    try {
        staged = await blobStore.get(input.value.pathname, {
            ...blobAuthOptions(configuration),
            access: 'private',
            useCache: false,
        });
    } catch {
        return creatorJson({ error: 'The private staged video could not be read.' }, 502);
    }
    if (!staged || staged.statusCode !== 200 || !staged.stream) {
        return creatorJson({ error: 'The private staged video was not found. Upload it again.' }, 404);
    }
    const contentType = normalized(staged.blob?.contentType).toLowerCase();
    const size = Number(staged.blob?.size);
    const uploadedAt = new Date(staged.blob?.uploadedAt).getTime();
    if (!ALLOWED_VIDEO_MIME_TYPES.has(contentType)) {
        await blobStore.del(input.value.pathname, blobAuthOptions(configuration)).catch(() => {});
        return creatorJson({ error: 'That staged file type is not allowed for YouTube.' }, 415);
    }
    if (!Number.isSafeInteger(size) || size <= 0 || size > input.value.maxUploadBytes) {
        await blobStore.del(input.value.pathname, blobAuthOptions(configuration)).catch(() => {});
        return creatorJson({ error: 'That staged video exceeds the configured upload limit.' }, 413);
    }
    if (!Number.isFinite(uploadedAt) || now - uploadedAt > STAGING_MAX_AGE_MS || uploadedAt > now + 60_000) {
        await blobStore.del(input.value.pathname, blobAuthOptions(configuration)).catch(() => {});
        return creatorJson({ error: 'That staged video expired. Upload it again.' }, 410);
    }
    const inspected = await inspectVideoStream(staged.stream, contentType);
    if (inspected.error) {
        await blobStore.del(input.value.pathname, blobAuthOptions(configuration)).catch(() => {});
        return creatorJson({ error: inspected.error }, 415);
    }

    const claim = await acquirePublishClaim(auth.user, input.value.pathname, {
        env,
        blobStore,
        now,
    });
    if (!claim.claimed) {
        await inspected.stream.cancel('youtube_publish_already_running').catch(() => {});
        return creatorJson({
            error: claim.conflict
                ? 'This private staged video is already being published. Wait for that request to finish.'
                : 'Creator Studio could not reserve this staged video for publishing.',
        }, claim.conflict ? 409 : 503);
    }

    try {
        const access = await refreshYoutubeAccessToken(credential.refreshToken, { env, fetchImpl });
        if (access.error === 'reconnect_required') {
            return creatorJson({
                error: 'The YouTube connection expired or was revoked. Reconnect the account.',
                code: 'youtube_reconnect_required',
            }, 409);
        }
        if (access.error) {
            return creatorJson({ error: 'YouTube authorization is temporarily unavailable.' }, 502);
        }

        const metadata = {
            snippet: {
                title: input.value.title,
                description: input.value.description,
                categoryId: '22',
                ...(input.value.tags.length ? { tags: input.value.tags } : {}),
            },
            status: {
                privacyStatus: 'private',
                selfDeclaredMadeForKids: input.value.madeForKids,
                containsSyntheticMedia: input.value.containsSyntheticMedia,
            },
        };
        const initUrl = new URL(YOUTUBE_UPLOAD_URL);
        initUrl.searchParams.set('uploadType', 'resumable');
        initUrl.searchParams.set('part', 'snippet,status');
        initUrl.searchParams.set('notifySubscribers', 'false');
        const metadataBody = JSON.stringify(metadata);
        const initialized = await googleFetch(fetchImpl, initUrl, {
            method: 'POST',
            headers: {
                authorization: `Bearer ${access.accessToken}`,
                'content-length': String(Buffer.byteLength(metadataBody)),
                'content-type': 'application/json; charset=UTF-8',
                'x-upload-content-length': String(size),
                'x-upload-content-type': contentType,
            },
            body: metadataBody,
        }, 30_000);
        if (initialized.networkError) {
            return creatorJson({ error: 'YouTube upload initialization timed out.' }, 504);
        }
        if (!initialized.ok) {
            const decoded = await limitedJson(initialized);
            return youtubeFailure(initialized, decoded.value, 'upload initialization');
        }
        const uploadLocation = validYoutubeUploadLocation(initialized.headers.get('location'));
        if (!uploadLocation) {
            return creatorJson({ error: 'YouTube returned an invalid upload destination.' }, 502);
        }

        const uploaded = await googleFetch(fetchImpl, uploadLocation, {
            method: 'PUT',
            headers: {
                authorization: `Bearer ${access.accessToken}`,
                'content-length': String(size),
                'content-type': contentType,
            },
            body: inspected.stream,
            duplex: 'half',
        }, youtubeUploadTimeout(env));
        if (uploaded.networkError) {
            return creatorJson({
                error: uploaded.networkError === 'timeout'
                    ? 'The YouTube upload timed out. The private staged file was retained for retry.'
                    : 'The YouTube upload was interrupted. The private staged file was retained for retry.',
            }, uploaded.networkError === 'timeout' ? 504 : 502);
        }
        const decoded = await limitedJson(uploaded);
        if (!uploaded.ok || decoded.error) return youtubeFailure(uploaded, decoded.value, 'video upload');
        const videoId = normalized(decoded.value?.id);
        if (!VIDEO_ID_PATTERN.test(videoId)) {
            return creatorJson({ error: 'YouTube completed the upload without returning a valid video ID.' }, 502);
        }

        const record = {
            videoId,
            title: input.value.title,
            privacyStatus: 'private',
            uploadedAt: new Date(now).toISOString(),
        };
        let historyRecorded = true;
        let cleanupPending = false;
        try {
            await saveYoutubeHistory(auth.user, record, { env, blobStore, now });
        } catch {
            historyRecorded = false;
        }
        try {
            await blobStore.del(input.value.pathname, blobAuthOptions(configuration));
        } catch {
            cleanupPending = true;
        }

        return creatorJson({
            provider: 'youtube',
            toolId: YOUTUBE_PUBLISH_TOOL_ID,
            ...record,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            studioUrl: `https://studio.youtube.com/video/${videoId}/edit`,
            historyRecorded,
            cleanupPending,
        }, 201);
    } finally {
        await releasePublishClaim(claim.pathname, configuration, blobStore).catch(() => {});
    }
}
