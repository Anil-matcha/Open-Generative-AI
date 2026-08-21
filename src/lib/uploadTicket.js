import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { validateUploadProxyTarget } from './uploadProxyTarget.js';

export const UPLOAD_TICKET_FIELD = 'x-upload-ticket';
const VERSION = 'v1';
const AAD = Buffer.from('open-generative-ai-upload-ticket-v1');
const USED_TICKETS_KEY = Symbol.for('open-generative-ai.used-upload-tickets');

function usedTickets() {
    if (!globalThis[USED_TICKETS_KEY]) globalThis[USED_TICKETS_KEY] = new Map();
    return globalThis[USED_TICKETS_KEY];
}

function getSecret(env) {
    const secret = env.UPLOAD_PROXY_TICKET_SECRET;
    if (typeof secret !== 'string' || secret.length < 32) {
        throw new Error('UPLOAD_PROXY_TICKET_SECRET must contain at least 32 characters');
    }
    return createHash('sha256').update(secret).digest();
}

function apiKeyDigest(apiKey) {
    return createHash('sha256').update(apiKey).digest('base64url');
}

function decodeCanonicalBase64Url(value, expectedLength) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid encoding');
    const decoded = Buffer.from(value, 'base64url');
    if (decoded.toString('base64url') !== value || (expectedLength && decoded.length !== expectedLength)) {
        throw new Error('Invalid encoding');
    }
    return decoded;
}

function normalizeFields(fields) {
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
        throw new Error('Upload credentials are missing signed fields');
    }

    const normalized = {};
    const entries = Object.entries(fields);
    if (entries.length > 100) throw new Error('Upload credentials contain too many signed fields');
    let totalLength = 0;
    for (const [name, value] of entries) {
        if (typeof name !== 'string' || typeof value !== 'string' || name.length > 200 || value.length > 20_000) {
            throw new Error('Upload credentials contain invalid signed fields');
        }
        totalLength += name.length + value.length;
        if (totalLength > 100_000) throw new Error('Upload credentials are too large');
        normalized[name] = value;
    }

    if (!normalized.key) throw new Error('Upload credentials are missing an object key');
    return normalized;
}

export function createUploadTicket({
    apiKey,
    targetUrl,
    fields,
    env = process.env,
    now = Date.now(),
} = {}) {
    const target = validateUploadProxyTarget(targetUrl, { env });
    if (!target.ok) throw new Error(`Upload target rejected: ${target.reason}`);

    const ttl = Math.min(Math.max(Number(env.UPLOAD_PROXY_TICKET_TTL_SECONDS || 300), 30), 600);
    const payload = Buffer.from(JSON.stringify({
        version: 1,
        ticketId: randomBytes(16).toString('base64url'),
        expiresAt: now + ttl * 1000,
        apiKeyHash: apiKeyDigest(apiKey),
        targetUrl: target.url,
        fields: normalizeFields(fields),
    }));

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', getSecret(env), iv);
    cipher.setAAD(AAD);
    const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

export function consumeUploadTicket(ticket, {
    apiKey,
    env = process.env,
    now = Date.now(),
} = {}) {
    try {
        const [version, encodedIv, encodedTag, encodedCiphertext, extra] = String(ticket || '').split('.');
        if (version !== VERSION || extra !== undefined) return { ok: false, reason: 'invalid_ticket' };

        const iv = decodeCanonicalBase64Url(encodedIv, 12);
        const tag = decodeCanonicalBase64Url(encodedTag, 16);
        const ciphertext = decodeCanonicalBase64Url(encodedCiphertext);
        if (ciphertext.length === 0) return { ok: false, reason: 'invalid_ticket' };

        const decipher = createDecipheriv('aes-256-gcm', getSecret(env), iv);
        decipher.setAAD(AAD);
        decipher.setAuthTag(tag);
        const plaintext = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);
        const payload = JSON.parse(plaintext.toString('utf8'));

        if (payload.version !== 1 || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= now) {
            return { ok: false, reason: 'expired_ticket' };
        }

        const expected = Buffer.from(apiKeyDigest(apiKey));
        const actual = Buffer.from(String(payload.apiKeyHash || ''));
        if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
            return { ok: false, reason: 'credential_mismatch' };
        }

        const target = validateUploadProxyTarget(payload.targetUrl, { env });
        if (!target.ok) return { ok: false, reason: 'invalid_target' };

        return {
            ok: true,
            ticketId: payload.ticketId,
            expiresAt: payload.expiresAt,
            targetUrl: target.url,
            fields: normalizeFields(payload.fields),
        };
    } catch {
        return { ok: false, reason: 'invalid_ticket' };
    }
}

export function reserveUploadTicket(ticketId, expiresAt, { now = Date.now() } = {}) {
    if (typeof ticketId !== 'string' || !ticketId || !Number.isFinite(expiresAt) || expiresAt <= now) return false;
    const store = usedTickets();
    for (const [id, expiry] of store) {
        if (expiry <= now) store.delete(id);
    }
    if (store.has(ticketId)) return false;
    store.set(ticketId, expiresAt);
    return true;
}

export function releaseUploadTicket(ticketId) {
    usedTickets().delete(ticketId);
}

export function resetUsedUploadTickets() {
    usedTickets().clear();
}

export function protectUploadCredentials(data, {
    apiKey,
    proxyUrl,
    env = process.env,
} = {}) {
    if (!data || typeof data !== 'object' || typeof data.url !== 'string') {
        throw new Error('Upstream did not return upload credentials');
    }

    const fields = normalizeFields(data.fields);
    const ticket = createUploadTicket({ apiKey, targetUrl: data.url, fields, env });
    const safe = {
        url: proxyUrl,
        fields: {
            key: fields.key,
            [UPLOAD_TICKET_FIELD]: ticket,
        },
    };

    if (typeof data.prefix === 'string') safe.prefix = data.prefix;
    return safe;
}
