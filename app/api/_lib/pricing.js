// Server-side pricing for Open-Generative-AI generations.
// Ported from creator-club src/lib/billing.ts.
//
// Method: ruble_price = memefast_cost_in_CNY (¥) × CNY_TO_RUB × PLATFORM_MARKUP.
// The CNY ("🍐") cost per model is memefast's "your price" from memefast.top/pricing.
//
// Tune via env (or edit the constants below):
//   CNY_TO_RUB       — yuan→ruble rate (CBR), default 10.55
//   PLATFORM_MARKUP  — platform margin, default 1.15 (+15%)

const CNY_TO_RUB = Number(process.env.CNY_TO_RUB || 10.55);
const PLATFORM_MARKUP = Number(process.env.PLATFORM_MARKUP || 1.15);

// ── Memefast VIDEO prices in CNY (¥) ────────────────────────────────────────
const MEMEFAST_VIDEO_CNY = {
    'veo3.1': 0.980, 'veo3.1-fast': 0.980, 'veo3.1-components': 0.980,
    'veo3.1-4k': 1.400, 'veo3.1-pro': 4.900, 'veo3.1-pro-4k': 4.900,
    'veo3.1-components-4k': 1.400,
    'veo_3_1': 1.022, 'veo_3_1-fast': 0.602, 'veo_3_1-components': 1.022,
    'veo_3_1-4K': 1.190, 'veo_3_1-fast-4K': 0.602, 'veo_3_1-components-4K': 1.190,
    'veo_3_1-fast-components-4K': 1.204,
    'sora-2': 0.060, 'sora-2-pro': 1.800,
    'grok-video-3': 0.600, 'grok-video-3-10s': 0.600,
    'omni-flash': 2.600, 'omni-flash-components': 2.600,
    'kling-video': 1.190, 'kling-omni-video': 1.190, 'kling-v2-5-turbo': 1.190,
    'kling-v2-6': 1.190, 'kling-motion-control': 0.595,
    'kling-avatar-image2video': 1.700, 'kling-effects': 1.700,
    'kling-video-extend': 1.190, 'kling-video-sound': 0.595,
    'vidu2.0': 1.000, 'viduq1': 1.000, 'viduq1-classic': 4.000,
    'viduq2': 0.1875, 'viduq2-pro': 0.250, 'viduq2-turbo': 0.1875,
    'viduq3': 2.500, 'viduq3-pro': 2.188, 'viduq3-turbo': 1.250, 'viduq3-mix': 6.250,
    'MiniMax-Hailuo-02': 3.200, 'MiniMax-Hailuo-2.3': 3.200,
    'happyhorse-1.0-t2v': 1.260, 'happyhorse-1.0-i2v': 1.260,
    'happyhorse-1.0-r2v': 1.260, 'happyhorse-1.0-video-edit': 1.260,
    'wan2.5-i2v-preview': 1.000, 'wan2.6-i2v': 1.000, 'wan2.6-v2v': 1.000,
    'mj_video': 1.000,
    'pixverse-video': 0.600, 'pixverse-multi-transition': 0.600, 'pixverse-mimic': 0.600,
    'pixverse-modify': 0.600, 'pixverse-restyle': 0.600, 'pixverse-lipsync': 0.600,
    'doubao-seedance-2-0-260128': 30.000,
    'doubao-seedance-2-0-fast-260128': 15.000,
    'doubao-seedance-1-5-pro-251215': 24.000,
    'doubao-seedance-1-0-pro-250528': 22.500,
    'doubao-seedance-1-0-pro-fast-251015': 6.300,
    'doubao-seedance-1-0-lite-t2v-250428': 15.000,
    'doubao-seedance-1-0-lite-i2v-250428': 15.000,
    'doubao-seedance-video-edit': 15.000,
};

// ── Memefast IMAGE prices in CNY (¥) ────────────────────────────────────────
const MEMEFAST_IMAGE_CNY = {
    'gemini-3-pro-image-preview': 0.330, 'gemini-3.1-flash-image-preview': 0.1655,
    'gemini-2.5-flash-image': 0.360, 'gemini-2.5-flash-image-preview': 0.360,
    'gpt-image-2': 0.14, 'gpt-image-1.5': 0.10, 'gpt-image-1': 0.10, 'gpt-image-1-mini': 0.05,
    'flux-1.1-pro': 0.30, 'flux-2-pro': 0.30, 'flux.1-kontext-pro': 0.12,
    'doubao-seedream-5-0-260128': 0.22, 'doubao-seedream-4-5-251128': 0.25,
    'doubao-seedream-4-0-250828': 0.20, 'doubao-seedream-3-0-t2i-250415': 0.10,
    'mj_imagine': 0.18, 'mj_edits': 0.18, 'mj_inpaint': 0.01, 'mj_variation': 0.18,
    'kling-image': 0.0425, 'kling-omni-image': 0.340,
    'grok-4.2-image': 0.12, 'grok-4.1-image': 0.10, 'grok-4-image': 0.08,
    'grok-imagine-image': 0.208, 'grok-imagine-image-pro': 0.728,
    'qwen-image-max': 0.50, 'qwen-image-2.0-2026-03-03': 0.26, 'qwen-image-edit-2509': 0.12,
    'z-image-turbo': 0.10, 'wan2.7-image-pro': 0.65,
    'dall-e-3': 0.30,
};

// ── Audio prices in CNY (¥) — approximate flat per call ──────────────────────
const MEMEFAST_AUDIO_CNY = {
    'tts-1': 0.05, 'tts-1-hd': 0.10, 'gpt-4o-mini-tts': 0.05,
    'speech-02-hd': 0.05, 'speech-02-turbo': 0.03,
    'speech-2.6-hd': 0.05, 'speech-2.6-turbo': 0.03,
    'speech-2.8-hd': 0.05, 'speech-2.8-turbo': 0.03,
    'MiniMax-Voice-Clone': 0.10, 'MiniMax-Voice-Design': 0.08,
    'qwen3-tts-flash': 0.03, 'vidu-tts': 0.03,
    'kling-sound-effect': 0.20, 'kling-tts': 0.05, 'kling-video-sound': 0.30,
    'suno-inspire': 0.50, 'suno-custom': 0.50, 'suno-continue': 0.50,
};

// Schema key → real model id (mirror of MODEL_ID_MAP in route.js, for pricing lookups)
const PRICE_MODEL_ALIAS = {
    'flux-edit-kontext-pro': 'flux.1-kontext-pro',
    'kling-omni-image-edit': 'kling-omni-image',
    'grok-imagine-image-reference': 'grok-imagine-image-pro',
    'mj_inpaint-edit': 'mj_inpaint', 'mj_variation-reference': 'mj_variation',
    'gemini-2.5-flash-image-edit': 'gemini-2.5-flash-image',
    'gemini-3-pro-image-edit': 'gemini-3-pro-image-preview',
    'gemini-3.1-flash-image-edit': 'gemini-3.1-flash-image-preview',
    'gpt-image-2-edit': 'gpt-image-2', 'gpt-image-1.5-edit': 'gpt-image-1.5',
    'gpt-image-1-edit': 'gpt-image-1',
    'pixverse-video-edit': 'pixverse-modify', 'pixverse-restyle-edit': 'pixverse-restyle',
    'pixverse-lipsync-edit': 'pixverse-lipsync',
    'pixverse-multi-transition-edit': 'pixverse-multi-transition',
    'kling-video-edit-extend': 'kling-video-extend', 'kling-effects-edit': 'kling-effects',
    'wan2.6-v2v-edit': 'wan2.6-v2v', 'seedance-video-edit': 'doubao-seedance-video-edit',
};

function round2(n) { return Math.round(n * 100) / 100; }

function videoPriceRub(model, durationSec) {
    const baseCny = MEMEFAST_VIDEO_CNY[model] ?? 2.0;        // default ¥2
    const dur = durationSec || 5;
    const durMult = dur <= 8 ? 1.0 : dur <= 10 ? 1.5 : 2.0; // scale by duration
    return round2(baseCny * durMult * CNY_TO_RUB * PLATFORM_MARKUP);
}

function imagePriceRub(model) {
    const cny = MEMEFAST_IMAGE_CNY[model] ?? 0.30;          // default ¥0.30
    return round2(cny * CNY_TO_RUB * PLATFORM_MARKUP);
}

function audioPriceRub(model) {
    const cny = MEMEFAST_AUDIO_CNY[model] ?? 0.05;          // default ¥0.05
    return round2(cny * CNY_TO_RUB * PLATFORM_MARKUP);
}

// Passthrough / free models never charge.
const FREE_MODELS = new Set([
    'image-passthrough', 'video-passthrough', 'audio-passthrough', 'text-passthrough',
]);

// Sets mirroring route.js categorisation (kept local to avoid a circular import).
const VIDEO_SET = new Set(Object.keys(MEMEFAST_VIDEO_CNY).concat([
    'veo3.1-pro', 'veo3.1-4k',
]));
const AUDIO_SET = new Set(Object.keys(MEMEFAST_AUDIO_CNY));
const IMAGE_SET = new Set(Object.keys(MEMEFAST_IMAGE_CNY));

/**
 * Cost of one generation in rubles. `category` is one of
 * 'image' | 'video' | 'audio' | 'text' (from the node-schema category).
 * Returns 0 for free/passthrough models.
 */
function priceRub(category, model, params = {}) {
    if (!model || FREE_MODELS.has(model)) return 0;
    const real = PRICE_MODEL_ALIAS[model] || model;

    if (category === 'video' || VIDEO_SET.has(real)) {
        const dur = parseInt(String(params.duration ?? 5), 10) || 5;
        return videoPriceRub(real, dur);
    }
    if (category === 'audio' || AUDIO_SET.has(real)) {
        return audioPriceRub(real);
    }
    if (category === 'text') {
        // Flat estimate for LLM/vision calls
        return round2(0.05 * CNY_TO_RUB * PLATFORM_MARKUP);
    }
    // default → image
    return imagePriceRub(real);
}

export { priceRub, CNY_TO_RUB, PLATFORM_MARKUP };
