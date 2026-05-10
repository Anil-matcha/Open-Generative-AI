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
        description: 'WaveSpeed 主推的本地模型，6B 参数，8 步极速生成，无需 API Key。',
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
        description: '来自通义-MAI 的完整质量 6B 参数模型，细节更丰富，支持 50 步生成。',
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
        description: '通用型 SD 1.5 模型，适合人像、风景和艺术风格。',
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
        description: '基于 SD 1.5 的高写实人物与场景模型。',
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
        description: '高质量的动漫与插画风图像生成模型。',
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
        description: '官方 Stable Diffusion XL 基础模型，分辨率更高，画质优秀。',
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
        description: '图像模型 - 由 Wan2GP 提供的 FLUX.1 dev，需要运行 Wan2GP 服务。',
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
        description: '图像模型 - 由 Wan2GP 提供的 Qwen-Image 文生图。',
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
        description: '视频模型 - Wan 2.2 文生视频，在消费级 GPU 上速度较慢。',
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
        description: '视频模型 - Wan 2.2 图生视频，需要提供起始帧。',
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
        description: '视频模型 - 通过 Wan2GP 提供的 Hunyuan 文生视频。',
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
        description: '视频模型 - LTX 文生视频，是 Wan2GP 中最快的视频选项。',
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
