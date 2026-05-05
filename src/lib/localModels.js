// Frontend-side local model catalog.
// Two providers:
//   - sdcpp: bundled engine, weights live on disk
//   - wan2gp: user-run remote Gradio server
// Mirrors electron/lib/modelCatalog.js (sd.cpp) and electron/lib/wan2gpProvider.js (wan2gp).
export const LOCAL_MODEL_CATALOG = [
    // ── sd.cpp: Z-Image (Tongyi-MAI) ────────────────────────────────────────
    {
        id: 'z-image-turbo',
        name: 'Z-Image Turbo',
        description: 'WaveSpeed\'s featured local model — 6B params, ultra-fast 8-step generation. No API key needed.',
        type: 'z-image',
        provider: 'sdcpp',
        filename: 'z_image_turbo-Q4_K.gguf',
        sizeGB: 3.4,
        aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        defaultSteps: 8,
        defaultGuidance: 1.0,
        tags: ['turbo', 'fast', 'local', 'featured'],
        featured: true,
    },
    {
        id: 'z-image-base',
        name: 'Z-Image Base',
        description: 'Full-quality 6B parameter model from Tongyi-MAI — higher detail, 50-step generation.',
        type: 'z-image',
        provider: 'sdcpp',
        filename: 'Z-Image-Q4_K_M.gguf',
        sizeGB: 3.5,
        aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        defaultSteps: 50,
        defaultGuidance: 7.5,
        tags: ['high-quality', 'local', 'detailed'],
        featured: true,
    },
    // ── sd.cpp: SD 1.5 (small, M2-friendly) ─────────────────────────────────
    {
        id: 'dreamshaper-8',
        name: 'Dreamshaper 8',
        description: 'Versatile SD 1.5 model — great for portraits, landscapes, and artistic styles.',
        type: 'sd1',
        provider: 'sdcpp',
        filename: 'DreamShaper_8_pruned.safetensors',
        sizeGB: 2.1,
        aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        defaultSteps: 20,
        defaultGuidance: 7.5,
        tags: ['photorealistic', 'artistic', 'versatile'],
    },
    {
        id: 'realistic-vision-v51',
        name: 'Realistic Vision v5.1',
        description: 'Highly photorealistic people and scenes, based on SD 1.5.',
        type: 'sd1',
        provider: 'sdcpp',
        filename: 'realisticVisionV51_v51VAE.safetensors',
        sizeGB: 2.1,
        aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        defaultSteps: 25,
        defaultGuidance: 7,
        tags: ['photorealistic', 'portraits', 'people'],
    },
    {
        id: 'anything-v5',
        name: 'Anything v5',
        description: 'High quality anime and illustration style image generation.',
        type: 'sd1',
        provider: 'sdcpp',
        filename: 'Anything-v5.0-PRT.safetensors',
        sizeGB: 2.1,
        aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        defaultSteps: 20,
        defaultGuidance: 7,
        tags: ['anime', 'illustration', 'artistic'],
    },
    // ── sd.cpp: SDXL ────────────────────────────────────────────────────────
    {
        id: 'stable-diffusion-xl-base',
        name: 'SDXL Base 1.0',
        description: 'Official Stable Diffusion XL base model — higher resolution, excellent quality.',
        type: 'sdxl',
        provider: 'sdcpp',
        filename: 'sd_xl_base_1.0.safetensors',
        sizeGB: 6.9,
        aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        defaultSteps: 30,
        defaultGuidance: 7.5,
        tags: ['sdxl', 'high-quality', 'versatile'],
    },

    // ── Wan2GP: image models ────────────────────────────────────────────────
    {
        id: 'wan2gp:flux-dev',
        name: 'Flux.1 Dev (Wan2GP)',
        description: 'Image — FLUX.1 dev served by Wan2GP. Requires running Wan2GP server.',
        type: 'image',
        family: 'flux',
        provider: 'wan2gp',
        aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        defaultSteps: 28,
        defaultGuidance: 3.5,
        tags: ['image', 'flux', 'remote'],
    },
    {
        id: 'wan2gp:qwen-image',
        name: 'Qwen Image (Wan2GP)',
        description: 'Image — Qwen-Image text-to-image served by Wan2GP.',
        type: 'image',
        family: 'qwen',
        provider: 'wan2gp',
        aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
        defaultSteps: 30,
        defaultGuidance: 4.0,
        tags: ['image', 'qwen', 'remote'],
    },
    // ── Wan2GP: video models ────────────────────────────────────────────────
    {
        id: 'wan2gp:wan22-t2v',
        name: 'Wan 2.2 (Text-to-Video)',
        description: 'Video — Wan 2.2 text-to-video. Slow on consumer GPUs.',
        type: 'video',
        family: 'wan',
        provider: 'wan2gp',
        aspectRatios: ['16:9', '1:1', '9:16'],
        defaultSteps: 25,
        defaultGuidance: 5.0,
        tags: ['video', 'wan', 'text-to-video'],
    },
    {
        id: 'wan2gp:wan22-i2v',
        name: 'Wan 2.2 (Image-to-Video)',
        description: 'Video — Wan 2.2 image-to-video. Provide a start frame.',
        type: 'video',
        family: 'wan',
        provider: 'wan2gp',
        needsImage: true,
        aspectRatios: ['16:9', '1:1', '9:16'],
        defaultSteps: 25,
        defaultGuidance: 5.0,
        tags: ['video', 'wan', 'image-to-video'],
    },
    {
        id: 'wan2gp:hunyuan-video',
        name: 'Hunyuan Video (Wan2GP)',
        description: 'Video — Hunyuan text-to-video via Wan2GP.',
        type: 'video',
        family: 'hunyuan',
        provider: 'wan2gp',
        aspectRatios: ['16:9', '1:1', '9:16'],
        defaultSteps: 30,
        defaultGuidance: 6.0,
        tags: ['video', 'hunyuan'],
    },
    {
        id: 'wan2gp:ltx-video',
        name: 'LTX Video (Wan2GP)',
        description: 'Video — LTX text-to-video. Fastest video option in Wan2GP.',
        type: 'video',
        family: 'ltx',
        provider: 'wan2gp',
        aspectRatios: ['16:9', '1:1', '9:16'],
        defaultSteps: 20,
        defaultGuidance: 3.0,
        tags: ['video', 'ltx', 'fast'],
    },
];

export function getLocalModelById(id) {
    return LOCAL_MODEL_CATALOG.find(m => m.id === id) || null;
}

export const isWan2gpModelId = (id) => getLocalModelById(id)?.provider === 'wan2gp';
export const isLocalModelId  = (id) => !!getLocalModelById(id);

export const localT2VModels = LOCAL_MODEL_CATALOG.filter(m => m.provider === 'wan2gp' && m.type === 'video' && !m.needsImage);
export const localI2VModels = LOCAL_MODEL_CATALOG.filter(m => m.provider === 'wan2gp' && m.type === 'video' &&  m.needsImage);
