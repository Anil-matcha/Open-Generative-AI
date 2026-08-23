import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;
const MAX_SESSION_TTL_SECONDS = 24 * 60 * 60;
const MAX_SESSION_TOKEN_LENGTH = 4096;

function configuredSecret(value, minimumLength = 32) {
    return typeof value === 'string' && value.trim().length >= minimumLength;
}

function boundedInteger(value, fallback, minimum, maximum) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, Math.round(parsed)));
}

function base64UrlEncode(value) {
    return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value) {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function digest(value, secret) {
    return createHmac('sha256', secret).update(value, 'utf8').digest('base64url');
}

function constantTimeTextMatch(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string') return false;
    const leftBuffer = Buffer.from(left, 'utf8');
    const rightBuffer = Buffer.from(right, 'utf8');
    if (leftBuffer.length !== rightBuffer.length) return false;
    return timingSafeEqual(leftBuffer, rightBuffer);
}

function configuredList(value, transform = (item) => item) {
    if (typeof value !== 'string') return [];
    return value
        .split(',')
        .map((item) => transform(item.trim()))
        .filter(Boolean);
}

export function creatorCookieSettings(env = process.env) {
    const development = env.NODE_ENV === 'development';
    const prefix = development ? '' : '__Host-';
    return {
        secure: !development,
        sessionName: `${prefix}creator_session`,
        oauthStateName: `${prefix}creator_oauth_state`,
        oauthVerifierName: `${prefix}creator_oauth_verifier`,
        oauthReturnName: `${prefix}creator_oauth_return`,
    };
}

export function creatorSessionTtl(env = process.env) {
    return boundedInteger(
        env.CREATOR_SESSION_TTL_SECONDS,
        DEFAULT_SESSION_TTL_SECONDS,
        5 * 60,
        MAX_SESSION_TTL_SECONDS,
    );
}

export function creatorAuthConfiguration(env = process.env) {
    const allowedIds = configuredList(env.CREATOR_GITHUB_ALLOWED_USER_IDS);
    const allowedLogins = configuredList(
        env.CREATOR_GITHUB_ALLOWED_LOGINS,
        (login) => login.toLowerCase(),
    );
    if (!configuredSecret(env.CREATOR_SESSION_SECRET)) {
        return { error: 'Creator Studio session authentication is not configured securely.' };
    }
    if (allowedIds.length === 0 && allowedLogins.length === 0) {
        return { error: 'Creator Studio GitHub authorization is not configured.' };
    }
    return {
        secret: env.CREATOR_SESSION_SECRET.trim(),
        allowedIds,
        allowedLogins,
    };
}

export function githubOauthConfiguration(env = process.env) {
    const clientId = String(env.GITHUB_OAUTH_CLIENT_ID || '').trim();
    const clientSecret = String(env.GITHUB_OAUTH_CLIENT_SECRET || '').trim();
    const callbackValue = String(env.GITHUB_OAUTH_CALLBACK_URL || '').trim();
    if (!/^[A-Za-z0-9]{10,100}$/.test(clientId) || clientSecret.length < 20) {
        return { error: 'GitHub OAuth credentials are not configured.' };
    }

    try {
        const callbackUrl = new URL(callbackValue);
        const localDevelopment = env.NODE_ENV === 'development' &&
            callbackUrl.protocol === 'http:' &&
            ['127.0.0.1', '::1'].includes(callbackUrl.hostname);
        if ((!localDevelopment && callbackUrl.protocol !== 'https:') || callbackUrl.username || callbackUrl.password || callbackUrl.hash) {
            return { error: 'GitHub OAuth callback URL is not configured securely.' };
        }
        return { clientId, clientSecret, callbackUrl: callbackUrl.toString() };
    } catch {
        return { error: 'GitHub OAuth callback URL is not configured securely.' };
    }
}

export function isAllowedGithubIdentity(user, env = process.env) {
    const configuration = creatorAuthConfiguration(env);
    if (configuration.error) return { allowed: false, configurationError: configuration.error };

    const id = String(user?.id || '').trim();
    const login = String(user?.login || '').trim().toLowerCase();
    if (!/^\d+$/.test(id) || !/^[a-z0-9-]{1,39}$/.test(login)) {
        return { allowed: false };
    }

    const idAllowed = configuration.allowedIds.length === 0 || configuration.allowedIds.includes(id);
    const loginAllowed = configuration.allowedLogins.length === 0 || configuration.allowedLogins.includes(login);
    return { allowed: idAllowed && loginAllowed, id, login };
}

export function createCreatorSession(user, { env = process.env, now = Date.now() } = {}) {
    const identity = isAllowedGithubIdentity(user, env);
    if (identity.configurationError) throw new Error(identity.configurationError);
    if (!identity.allowed) throw new Error('GitHub identity is not authorized for Creator Studio.');

    const configuration = creatorAuthConfiguration(env);
    const issuedAt = Math.floor(now / 1000);
    const payload = base64UrlEncode(JSON.stringify({
        v: 1,
        sub: identity.id,
        login: identity.login,
        iat: issuedAt,
        exp: issuedAt + creatorSessionTtl(env),
    }));
    return `${payload}.${digest(payload, configuration.secret)}`;
}

export function verifyCreatorSession(token, { env = process.env, now = Date.now() } = {}) {
    const configuration = creatorAuthConfiguration(env);
    if (configuration.error) return { valid: false, configurationError: configuration.error };
    if (typeof token !== 'string' || token.length === 0 || token.length > MAX_SESSION_TOKEN_LENGTH) {
        return { valid: false };
    }

    const parts = token.split('.');
    if (parts.length !== 2 || !constantTimeTextMatch(parts[1], digest(parts[0], configuration.secret))) {
        return { valid: false };
    }

    let payload;
    try {
        payload = JSON.parse(base64UrlDecode(parts[0]));
    } catch {
        return { valid: false };
    }

    const currentTime = Math.floor(now / 1000);
    const lifetime = Number(payload?.exp) - Number(payload?.iat);
    if (
        payload?.v !== 1 ||
        !Number.isInteger(payload?.iat) ||
        !Number.isInteger(payload?.exp) ||
        payload.iat > currentTime + 60 ||
        payload.exp <= currentTime ||
        lifetime < 5 * 60 ||
        lifetime > MAX_SESSION_TTL_SECONDS
    ) {
        return { valid: false };
    }

    const identity = isAllowedGithubIdentity({ id: payload.sub, login: payload.login }, env);
    if (!identity.allowed) return { valid: false };
    return {
        valid: true,
        user: { id: identity.id, login: identity.login },
        expiresAt: payload.exp,
    };
}

export function cookieValue(request, name) {
    const header = request?.headers?.get('cookie');
    if (typeof header !== 'string' || header.length > 16 * 1024) return '';
    for (const part of header.split(';')) {
        const separator = part.indexOf('=');
        if (separator < 1) continue;
        if (part.slice(0, separator).trim() === name) {
            return part.slice(separator + 1).trim();
        }
    }
    return '';
}

export function authenticateCreatorRequest(request, { env = process.env, now = Date.now() } = {}) {
    const { sessionName } = creatorCookieSettings(env);
    return verifyCreatorSession(cookieValue(request, sessionName), { env, now });
}

export function isSameOriginMutation(request) {
    const method = String(request?.method || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;

    const fetchSite = request?.headers?.get('sec-fetch-site');
    if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return false;

    const origin = request?.headers?.get('origin');
    if (!origin) return !fetchSite || fetchSite === 'same-origin' || fetchSite === 'none';
    try {
        return new URL(origin).origin === new URL(request.url).origin;
    } catch {
        return false;
    }
}

export function safeCreatorReturnPath(value) {
    if (typeof value !== 'string') return '/studio/creator';
    if (!/^\/studio(?:\/|$)/.test(value) || value.includes('\\') || value.includes('//')) {
        return '/studio/creator';
    }
    return value.slice(0, 512);
}
