const STORE_KEY = Symbol.for('open-generative-ai.rate-limit');

function getStore() {
    if (!globalThis[STORE_KEY]) globalThis[STORE_KEY] = new Map();
    return globalThis[STORE_KEY];
}

export function checkRateLimit(identifier, {
    limit = 20,
    windowMs = 60_000,
    now = Date.now(),
} = {}) {
    const store = getStore();
    const key = String(identifier || 'anonymous');
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
        const entry = { count: 1, resetAt: now + windowMs };
        store.set(key, entry);
        return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: entry.resetAt };
    }

    existing.count += 1;
    const allowed = existing.count <= limit;

    if (store.size > 5_000) {
        for (const [storedKey, entry] of store) {
            if (entry.resetAt <= now) store.delete(storedKey);
        }
        while (store.size > 5_000) store.delete(store.keys().next().value);
    }

    return {
        allowed,
        remaining: Math.max(0, limit - existing.count),
        resetAt: existing.resetAt,
    };
}

export function resetRateLimitStore() {
    getStore().clear();
}
