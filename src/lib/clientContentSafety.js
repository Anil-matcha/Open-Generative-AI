import { evaluateJsonSafety } from './contentSafety.js';

function browserSafetyEnv() {
    const viteEnv = import.meta.env || {};
    return {
        CONTENT_SAFETY_MODE: viteEnv.VITE_CONTENT_SAFETY_MODE,
        CONTENT_SAFETY_BLOCKED_TERMS: viteEnv.VITE_CONTENT_SAFETY_BLOCKED_TERMS,
    };
}

export function serializeSafePayload(payload, { env = browserSafetyEnv() } = {}) {
    const body = JSON.stringify(payload);
    const result = evaluateJsonSafety(body, { env });
    if (!result.allowed) {
        throw new Error(`Request blocked by content safety policy (${result.reason})`);
    }
    return body;
}
