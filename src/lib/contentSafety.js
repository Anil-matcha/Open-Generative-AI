const DEFAULT_MODE = 'enforce';
const VALID_MODES = new Set(['enforce', 'audit', 'off']);
const TEXT_FIELD_PATTERN = /(prompt|message|instruction|description|caption|text|query|content|script|input|system)/i;

const MINOR_TERMS = /\b(child|children|kid|kids|minor|underage|preteen|teenager|schoolgirl|schoolboy)\b/i;
const SEXUAL_TERMS = /\b(sex|sexual|nude|nudity|porn|pornographic|explicit|erotic|fetish|rape)\b/i;
const NON_CONSENSUAL_TERMS = /\b(non[- ]?consensual|without consent|rape|sexual assault|drugged|unconscious)\b/i;

function normalizeMode(value) {
    const mode = String(value || DEFAULT_MODE).trim().toLowerCase();
    return VALID_MODES.has(mode) ? mode : DEFAULT_MODE;
}

function configuredTerms(env) {
    return String(env.CONTENT_SAFETY_BLOCKED_TERMS || '')
        .split(',')
        .map((term) => term.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 100);
}

function collectText(value, output, key = '', depth = 0) {
    if (depth > 8 || output.length >= 200) return;

    if (typeof value === 'string') {
        if (!key || TEXT_FIELD_PATTERN.test(key)) output.push(value.slice(0, 20_000));
        return;
    }

    if (Array.isArray(value)) {
        for (const item of value) collectText(item, output, key, depth + 1);
        return;
    }

    if (value && typeof value === 'object') {
        for (const [childKey, childValue] of Object.entries(value)) {
            collectText(childValue, output, childKey, depth + 1);
        }
    }
}

function findViolation(text, env) {
    if (MINOR_TERMS.test(text) && SEXUAL_TERMS.test(text)) {
        return 'sexual_content_involving_minors';
    }

    if (NON_CONSENSUAL_TERMS.test(text) && SEXUAL_TERMS.test(text)) {
        return 'non_consensual_sexual_content';
    }

    const normalized = text.toLowerCase();
    if (configuredTerms(env).some((term) => normalized.includes(term))) {
        return 'operator_blocked_term';
    }

    return null;
}

export function getContentSafetyMode(env = process.env) {
    return normalizeMode(env.CONTENT_SAFETY_MODE);
}

export function evaluateJsonSafety(body, { env = process.env } = {}) {
    const mode = getContentSafetyMode(env);
    if (mode === 'off') return { allowed: true, mode };

    let parsed;
    try {
        const text = typeof body === 'string'
            ? body
            : new TextDecoder().decode(body instanceof ArrayBuffer ? new Uint8Array(body) : body);
        parsed = JSON.parse(text);
    } catch {
        return { allowed: true, mode };
    }

    const values = [];
    collectText(parsed, values);
    const reason = findViolation(values.join('\n'), env);
    if (!reason) return { allowed: true, mode };

    return {
        allowed: mode === 'audit',
        audited: mode === 'audit',
        mode,
        reason,
    };
}

export function evaluateRequestSafety(contentType, body, options = {}) {
    const normalizedType = String(contentType || '').toLowerCase();
    if (!normalizedType.includes('application/json')) {
        return { allowed: true, mode: getContentSafetyMode(options.env || process.env) };
    }
    return evaluateJsonSafety(body, options);
}
