// Wan2GP model catalog + settings builder.
// `modelType` is the real WanGP model_type: the basename of <Wan2GP>/defaults/<modelType>.json.
// Pure module (no electron import) so it can be unit-tested with node:test.

const RES_480P = { '16:9': '832x480', '9:16': '480x832', '1:1': '720x720', '4:3': '832x624', '3:4': '624x832' };
const RES_720P = { '16:9': '1280x720', '9:16': '720x1280', '1:1': '960x960', '4:3': '1104x832', '3:4': '832x1104' };
const RES_IMAGE = { '1:1': '1024x1024', '16:9': '1280x720', '9:16': '720x1280', '4:3': '1104x832', '3:4': '832x1104' };

const WAN2GP_CATALOG = [
    {
        id: 'wan2gp:flux-dev',
        name: 'Flux.1 Dev (Wan2GP)',
        description: 'Image — FLUX.1 dev (12B) served by Wan2GP.',
        type: 'image',
        family: 'flux',
        provider: 'wan2gp',
        modelType: 'flux',
        resolutions: RES_IMAGE,
        aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        tags: ['image', 'flux'],
    },
    {
        id: 'wan2gp:qwen-image',
        name: 'Qwen Image (Wan2GP)',
        description: 'Image — Qwen-Image 20B text-to-image served by Wan2GP.',
        type: 'image',
        family: 'qwen',
        provider: 'wan2gp',
        modelType: 'qwen_image_20B',
        resolutions: RES_IMAGE,
        aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        tags: ['image', 'qwen'],
    },
    {
        id: 'wan2gp:wan21-t2v-1.3b',
        name: 'Wan 2.1 1.3B (Text-to-Video)',
        description: 'Video — lightest Wan model, 480p. Runs on ~8 GB VRAM; a 5 s clip takes a few minutes.',
        type: 'video',
        family: 'wan',
        provider: 'wan2gp',
        modelType: 't2v_1.3B',
        resolutions: RES_480P,
        aspectRatios: ['16:9', '9:16', '1:1'],
        tags: ['video', 'wan', 'text-to-video', 'fast'],
    },
    {
        id: 'wan2gp:wan22-t2v',
        name: 'Wan 2.2 14B (Text-to-Video)',
        description: 'Video — Wan 2.2 text-to-video, 480p. Slow on consumer GPUs.',
        type: 'video',
        family: 'wan',
        provider: 'wan2gp',
        modelType: 't2v_2_2',
        resolutions: RES_480P,
        aspectRatios: ['16:9', '9:16', '1:1'],
        tags: ['video', 'wan', 'text-to-video'],
    },
    {
        id: 'wan2gp:wan22-i2v',
        name: 'Wan 2.2 14B (Image-to-Video)',
        description: 'Video — Wan 2.2 image-to-video, 480p. Provide a start frame.',
        type: 'video',
        family: 'wan',
        provider: 'wan2gp',
        modelType: 'i2v_2_2',
        needsImage: true,
        resolutions: RES_480P,
        aspectRatios: ['16:9', '9:16', '1:1'],
        tags: ['video', 'wan', 'image-to-video'],
    },
    {
        id: 'wan2gp:hunyuan-video',
        name: 'Hunyuan Video 1.5 (Wan2GP)',
        description: 'Video — Hunyuan Video 1.5 text-to-video, 480p.',
        type: 'video',
        family: 'hunyuan',
        provider: 'wan2gp',
        modelType: 'hunyuan_1_5_480_t2v',
        resolutions: RES_480P,
        aspectRatios: ['16:9', '9:16', '1:1'],
        tags: ['video', 'hunyuan'],
    },
    {
        id: 'wan2gp:ltx-video',
        name: 'LTX-2 Distilled (Wan2GP)',
        description: 'Video — LTX-2 distilled, 8 steps, 720p. Fastest large video model in Wan2GP.',
        type: 'video',
        family: 'ltx',
        provider: 'wan2gp',
        modelType: 'ltx2_22B_distilled',
        resolutions: RES_720P,
        aspectRatios: ['16:9', '9:16', '1:1'],
        tags: ['video', 'ltx', 'fast'],
    },
];

function getModelById(id) {
    return WAN2GP_CATALOG.find(m => m.id === id) || null;
}

function toInt(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n) : null;
}

// Build the settings object passed to `wgp.py --process` (local) or `wangp_generate` (MCP).
// Only fields the user actually chose are set; everything else falls back to the
// model's own defaults in Wan2GP, which are tuned per model (distilled models use
// few steps, LTX has its own frame count, etc.).
function buildWan2gpSettings(model, params = {}, { imageStart } = {}) {
    if (!model?.modelType) throw new Error('Unknown Wan2GP model');
    if (model.needsImage && !imageStart) {
        throw new Error(`${model.name} requires a start-frame image — upload one first.`);
    }

    const settings = {
        model_type: model.modelType,
        prompt: params.prompt || '',
    };
    if (params.negative_prompt) settings.negative_prompt = params.negative_prompt;

    const resolution = model.resolutions?.[params.aspect_ratio] || model.resolutions?.[model.aspectRatios?.[0]];
    if (resolution) settings.resolution = resolution;

    const steps = toInt(params.steps);
    if (steps && steps > 0) settings.num_inference_steps = steps;

    const frames = toInt(params.video_length);
    if (model.type === 'video' && frames && frames > 0) settings.video_length = frames;

    const seed = toInt(params.seed);
    settings.seed = seed !== null && seed >= 0 ? seed : Math.floor(Math.random() * 2147483647);

    if (imageStart) settings.image_start = imageStart;
    return settings;
}

module.exports = { WAN2GP_CATALOG, getModelById, buildWan2gpSettings };
