// Memefast models catalog
// platform: 'unified' → POST /v1/video/create + GET /v1/video/task/{id}
// platform: 'kling'   → POST /v1/kling/videos + GET /v1/kling/videos/{id}
// platform: 'luma'    → POST /v1/luma/generations + GET /v1/luma/generations/{id}
// platform: 'sora'    → POST /v1/video/generations + GET /v1/video/generations/{id}
// platform: 'minimax' → POST /v1/video_generation + GET /v1/query/video_generation?task_id=
// platform: 'runway'  → POST /v1/runway/image2video + GET /v1/runway/tasks/{id}

// ── Image generation (text → image) via POST /v1/images/generations ──────────
export const t2iModels = [
  // GPT Image models (use size parameter)
  { id: "gpt-image-1.5", name: "GPT Image 1.5", apiId: "gpt-image-1.5", inputs: { prompt: { type: "string" }, size: { enum: ["1024x1024", "1024x1536", "1536x1024"], default: "1024x1024" } } },
  { id: "gpt-image-2", name: "GPT Image 2", apiId: "gpt-image-2", inputs: { prompt: { type: "string" }, quality: { enum: ["standard", "hd"], default: "standard" }, size: { enum: ["1024x1024", "1024x1536", "1536x1024"], default: "1024x1024" } } },
  { id: "gpt-image-1", name: "GPT Image 1", apiId: "gpt-image-1", inputs: { prompt: { type: "string" }, quality: { enum: ["standard", "hd"], default: "standard" }, size: { enum: ["1024x1024", "1024x1536", "1536x1024"], default: "1024x1024" } } },
  { id: "gpt-image-1-miro", name: "GPT Image 1 Miro", apiId: "gpt-image-1-miro", inputs: { prompt: { type: "string" }, size: { enum: ["1024x1024", "1024x1536", "1536x1024"], default: "1024x1024" } } },

  // DALL-E (uses size & quality)
  { id: "dall-e-3", name: "DALL·E 3", apiId: "dall-e-3", inputs: { prompt: { type: "string" }, quality: { enum: ["standard", "hd"], default: "standard" }, size: { enum: ["1024x1024", "1024x1792", "1792x1024"], default: "1024x1024" } } },

  // FLUX 2.x models (use aspect_ratio + resolution)
  { id: "flux-2-pro", name: "Flux 2 Pro", apiId: "flux-2-pro", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"], default: "1:1" }, size: { enum: ["1K", "2K", "4K"], default: "1K" } } },
  { id: "flux-2-pro-turbo", name: "Flux 2 Pro Turbo", apiId: "flux-2-pro-turbo", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "flux-2-dev", name: "Flux 2 Dev", apiId: "flux-2-dev", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "flux-2-flex", name: "Flux 2 Flex", apiId: "flux-2-flex", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K", "4K"], default: "1K" } } },

  // FLUX 1.x models (use aspect_ratio + resolution)
  { id: "flux-1.1-pro", name: "Flux 1.1 Pro", apiId: "flux-1.1-pro", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"], default: "1:1" }, size: { enum: ["1K", "2K", "4K"], default: "1K" } } },
  { id: "flux-1.1-ultra", name: "Flux 1.1 Ultra", apiId: "flux-1.1-ultra", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"], default: "1:1" }, size: { enum: ["1K", "2K", "4K"], default: "1K" } } },
  { id: "flux-pro", name: "FLUX Pro", apiId: "flux-pro", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "flux-schnell", name: "FLUX Schnell", apiId: "flux-schnell", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K"], default: "1K" } } },
  { id: "flux-kontext-pro", name: "FLUX Kontext Pro", apiId: "flux-kontext-pro", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"], default: "1:1" }, size: { enum: ["1K", "2K", "4K"], default: "1K" } } },
  { id: "flux-kontext-max", name: "FLUX Kontext Max", apiId: "flux-kontext-max", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"], default: "1:1" }, size: { enum: ["1K", "2K", "4K"], default: "1K" } } },

  // Other models (use aspect_ratio + resolution)
  { id: "nano-banana", name: "Nano Banana 2", apiId: "gemini-3.1-flash-image-preview", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "nano-banana-pro", name: "Nano Banana Pro", apiId: "gemini-3-pro-image-preview", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K", "4K"], default: "1K" } } },
  { id: "bytedance-seedream-v4", name: "Bytedance Seedream v4", apiId: "bytedance-seedream-v4", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "bytedance-seedream-v4.5", name: "Seedream v4.5", apiId: "bytedance-seedream-v4.5", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K", "4K"], default: "1K" } } },
  { id: "wan2.5-text-to-image", name: "Wan 2.5 Text to Image", apiId: "wan2.5-text-to-image", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "wan2.6-text-to-image", name: "Wan 2.6 Text to Image", apiId: "wan2.6-text-to-image", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "qwen-image", name: "Qwen Image", apiId: "qwen-image", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "chroma-image", name: "Chroma Image", apiId: "chroma-image", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "kling-o1-text-to-image", name: "Kling O1 Text to Image", apiId: "kling-o1-text-to-image", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "grok-imagine-text-to-image", name: "Grok Imagine", apiId: "grok-imagine-text-to-image", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "hunyuan-image-2.1", name: "Hunyuan Image 2.1", apiId: "hunyuan-image-2.1", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "hunyuan-image-3.0", name: "Hunyuan Image 3.0", apiId: "hunyuan-image-3.0", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K", "4K"], default: "1K" } } },
  { id: "google-imagen4", name: "Google Imagen 4", apiId: "google-imagen4", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "google-imagen4-fast", name: "Google Imagen 4 Fast", apiId: "google-imagen4-fast", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "google-imagen4-ultra", name: "Google Imagen 4 Ultra", apiId: "google-imagen4-ultra", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K", "4K"], default: "1K" } } },
  { id: "midjourney-v7-text-to-image", name: "Midjourney v7 Text to Image", apiId: "midjourney-v7-text-to-image", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "midjourney-v7-image-to-image", name: "Midjourney v7 Image to Image", apiId: "midjourney-v7-image-to-image", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "vidu-q2-text-to-image", name: "Vidu Q2 Text to Image", apiId: "vidu-q2-text-to-image", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "ideogram-v3", name: "Ideogram V3", apiId: "ideogram-v3", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "stable-diffusion-3.5-large", name: "Stable Diffusion 3.5 Large", apiId: "stable-diffusion-3.5-large", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K", "4K"], default: "1K" } } },

  // Doodash & Open Image models
  { id: "doodash-sandstream-5.0-2512t28", name: "Doodash Sandstream 5.0 2512t28", apiId: "doodash-sandstream-5.0-2512t28", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K", "4K"], default: "1K" } } },
  { id: "doodash-sandstream-4.5-2512t28", name: "Doodash Sandstream 4.5 2512t28", apiId: "doodash-sandstream-4.5-2512t28", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "doodash-sandstream-4.0-2504828", name: "Doodash Sandstream 4.0 2504828", apiId: "doodash-sandstream-4.0-2504828", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "doodash-sandstream-3.0-t3-25", name: "Doodash Sandstream 3.0 T3 25", apiId: "doodash-sandstream-3.0-t3-25", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K"], default: "1K" } } },
  { id: "open-image-mid", name: "Open Image Mid", apiId: "open-image-mid", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "open-image-2.0-2226-03-03", name: "Open Image 2.0 2226 03 03", apiId: "open-image-2.0-2226-03-03", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "z-image-turbo", name: "Z Image Turbo", apiId: "z-image-turbo", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },

  // Grok models
  { id: "grok-4.1-image", name: "Grok 4.1 Image", apiId: "grok-4.1-image", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
  { id: "grok-4-image", name: "Grok 4 Image", apiId: "grok-4-image", inputs: { prompt: { type: "string" }, aspect_ratio: { enum: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1" }, size: { enum: ["1K", "2K"], default: "1K" } } },
];

// ── Image-to-image ────────────────────────────────────────────────────────────
export const i2iModels = [];

// ── Text-to-video ────────────────────────────────────────────────────────────
export const t2vModels = [
  // ── Seedance (Doubao) ──
  {
    id: "seedance-2.0-t2v",
    name: "Seedance 2.0",
    apiId: "seedance-pro-t2v",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "seedance-2.0-fast-t2v",
    name: "Seedance 2.0 Fast",
    apiId: "seedance-pro-t2v-fast",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "seedance-v1.5-pro-t2v",
    name: "Seedance 1.5 Pro",
    apiId: "seedance-v1.5-pro-t2v",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "seedance-v1.5-pro-t2v-fast",
    name: "Seedance 1.5 Pro Fast",
    apiId: "seedance-v1.5-pro-t2v-fast",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "seedance-lite-t2v",
    name: "Seedance Lite",
    apiId: "seedance-lite-t2v",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Google Veo (unified format) ──
  {
    id: "veo-3.1",
    name: "Google Veo 3.1",
    apiId: "veo3.1-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "veo-3.1-fast",
    name: "Google Veo 3.1 Fast",
    apiId: "veo3.1-fast-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "veo-3",
    name: "Google Veo 3",
    apiId: "veo-3",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Kling (unified format — new IDs) ──
  {
    id: "kling-v2.6-pro-t2v",
    name: "Kling v2.6 Pro",
    apiId: "kling-v2.6-pro-t2v",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "kling-v2.5-turbo-pro-t2v",
    name: "Kling v2.5 Turbo Pro",
    apiId: "kling-v2.5-turbo-pro-t2v",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "kling-o1-text-to-video",
    name: "Kling O1",
    apiId: "kling-o1-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Luma Dream Machine (platform-specific) ──
  {
    id: "luma-dream-machine",
    name: "Luma Dream Machine",
    apiId: "dream-machine",
    platform: "luma",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "4:3", "3:4", "21:9", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      loop: { type: "boolean", default: false, title: "Loop" }
    }
  },
  {
    id: "luma-photon",
    name: "Luma Photon",
    apiId: "photon-1",
    platform: "luma",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "4:3", "3:4", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Minimax Hailuo (unified format) ──
  {
    id: "minimax-hailuo",
    name: "Minimax Hailuo",
    apiId: "minimax-hailuo",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Sora (OpenAI video format) ──
  {
    id: "sora-2",
    name: "Sora 2",
    apiId: "openai-sora-2-text-to-video",
    platform: "sora",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 10, 20], default: 10, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "sora",
    name: "Sora",
    apiId: "openai-sora",
    platform: "sora",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  // ── Wan (unified format) ──
  {
    id: "wan2.5-text-to-video",
    name: "Wan 2.5 T2V",
    apiId: "wan2.5-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "wan2.6-text-to-video",
    name: "Wan 2.6 T2V",
    apiId: "wan2.6-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Grok video (unified format) ──
  {
    id: "grok-imagine-text-to-video",
    name: "Grok Imagine",
    apiId: "grok-imagine-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Pixverse (unified format) ──
  {
    id: "pixverse-v5.5",
    name: "Pixverse V5.5",
    apiId: "pixverse-v5.5",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [4, 8], default: 4, title: "Duration (s)", type: "int" }
    }
  },
  // ── Hunyuan (unified format) ──
  {
    id: "hunyuan-text-to-video",
    name: "Hunyuan T2V",
    apiId: "hunyuan-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "hunyuan-fast-text-to-video",
    name: "Hunyuan Fast T2V",
    apiId: "hunyuan-fast-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── WAN 2.1 (legacy, keep for backwards compat) ──
  {
    id: "wan2.1-t2v-14b",
    name: "WAN 2.1 T2V",
    apiId: "wan2.1-t2v-14b",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
];

// ── Image-to-video ────────────────────────────────────────────────────────────
export const i2vModels = [
  // ── Seedance i2v ──
  {
    id: "seedance-2.0-i2v",
    name: "Seedance 2.0 (фото→видео)",
    apiId: "seedance-pro-i2v",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "seedance-2.0-fast-i2v",
    name: "Seedance 2.0 Fast (фото→видео)",
    apiId: "seedance-pro-i2v-fast",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "seedance-v1.5-pro-i2v",
    name: "Seedance 1.5 Pro (фото→видео)",
    apiId: "seedance-v1.5-pro-i2v",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "seedance-lite-i2v",
    name: "Seedance Lite (фото→видео)",
    apiId: "seedance-lite-i2v",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Veo i2v ──
  {
    id: "veo-3.1-i2v",
    name: "Google Veo 3.1 (фото→видео)",
    apiId: "veo3.1-image-to-video",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "veo-3.1-fast-i2v",
    name: "Google Veo 3.1 Fast (фото→видео)",
    apiId: "veo3.1-fast-image-to-video",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Kling i2v (unified new IDs) ──
  {
    id: "kling-v2.6-pro-i2v",
    name: "Kling v2.6 Pro (фото→видео)",
    apiId: "kling-v2.6-pro-i2v",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "kling-v2.5-turbo-pro-i2v",
    name: "Kling v2.5 Turbo Pro (фото→видео)",
    apiId: "kling-v2.5-turbo-pro-i2v",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "kling-o1-image-to-video",
    name: "Kling O1 (фото→видео)",
    apiId: "kling-o1-image-to-video",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" }
    }
  },
  // ── Luma i2v (platform-specific) ──
  {
    id: "luma-dream-machine-i2v",
    name: "Luma Dream Machine (фото→видео)",
    apiId: "dream-machine",
    platform: "luma",
    imageField: "keyframes",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "4:3", "3:4", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Runway (image-to-video only) ──
  {
    id: "runway-gen4-i2v",
    name: "Runway Gen-4 (фото→видео)",
    apiId: "gen4_turbo",
    platform: "runway",
    imageField: "promptImage",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" },
      ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Ratio", type: "string" }
    }
  },
  // ── Hunyuan i2v ──
  {
    id: "hunyuan-image-to-video",
    name: "Hunyuan (фото→видео)",
    apiId: "hunyuan-image-to-video",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Wan i2v ──
  {
    id: "wan2.5-image-to-video",
    name: "Wan 2.5 (фото→видео)",
    apiId: "wan2.5-image-to-video",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Grok i2v ──
  {
    id: "grok-imagine-image-to-video",
    name: "Grok Imagine (фото→видео)",
    apiId: "grok-imagine-image-to-video",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Pixverse i2v (unified) ──
  {
    id: "pixverse-v5.5-i2v",
    name: "Pixverse V5.5 (фото→видео)",
    apiId: "pixverse-v5.5",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1", "4:3", "3:4"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
      duration: { enum: [4, 8], default: 4, title: "Duration (s)", type: "int" }
    }
  },
  // ── Wan i2v (unified) ──
  {
    id: "wan2.1-i2v-14b",
    name: "WAN 2.1 (фото→видео)",
    apiId: "wan2.1-i2v-14b",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      }
    }
  }
];

// ── Video-to-video ────────────────────────────────────────────────────────────
export const v2vModels = [];

// ── LipSync ───────────────────────────────────────────────────────────────────
export const lipsyncModels = [];
export const imageLipSyncModels = [];
export const videoLipSyncModels = [];

// ── Audio (TTS) via POST /v1/audio/speech ─────────────────────────────────────
export const audioModels = [
  {
    id: "gpt-4o-mini-tts",
    name: "GPT-4o Mini TTS",
    apiId: "gpt-4o-mini-tts",
    inputs: {
      voice: { enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer", "coral", "sage", "ash"], default: "alloy" }
    }
  },
  {
    id: "tts-1-hd",
    name: "TTS HD",
    apiId: "tts-1-hd",
    inputs: {
      voice: { enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"], default: "alloy" }
    }
  },
  {
    id: "tts-1",
    name: "TTS Standard",
    apiId: "tts-1",
    inputs: {
      voice: { enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"], default: "alloy" }
    }
  }
];

// ── Getter helpers ────────────────────────────────────────────────────────────
export const getModelById        = (id) => t2iModels.find(m => m.id === id);
export const getI2IModelById     = (id) => i2iModels.find(m => m.id === id);
export const getVideoModelById   = (id) => [...t2vModels, ...i2vModels].find(m => m.id === id);
export const getI2VModelById     = (id) => i2vModels.find(m => m.id === id);
export const getV2VModelById     = (id) => v2vModels.find(m => m.id === id);
export const getLipSyncModelById = (id) => lipsyncModels.find(m => m.id === id);
export const getAudioModelById   = (id) => audioModels.find(m => m.id === id);

// ── ImageStudio helpers ───────────────────────────────────────────────────────
export const getAspectRatiosForModel = (id) => {
  const m = t2iModels.find(x => x.id === id);
  return m?.inputs?.aspect_ratio?.enum || [];
};
export const getResolutionsForModel = (id) => {
  const m = t2iModels.find(x => x.id === id);
  return m?.inputs?.size?.enum || [];
};
export const getQualityFieldForModel = (id) => {
  const m = t2iModels.find(x => x.id === id);
  return m?.inputs?.quality?.enum ? 'quality' : null;
};
export const getAspectRatiosForI2IModel = (id) => {
  const m = i2iModels.find(x => x.id === id);
  return m?.inputs?.aspect_ratio?.enum || [];
};
export const getResolutionsForI2IModel = (id) => {
  const m = i2iModels.find(x => x.id === id);
  return m?.inputs?.size?.enum || [];
};
export const getQualityFieldForI2IModel = (id) => null;
export const getMaxImagesForI2IModel    = (id) => 1;
export const getEffectsForI2IModel      = (id) => [];
export const getDefaultEffectForI2IModel = (id) => null;

// ── VideoStudio helpers ───────────────────────────────────────────────────────
// Generic capabilities for video models. The unified /v1/video/create endpoint
// forwards `resolution` and `duration`; the sora endpoint forwards `duration`.
// Veo (fixed length / resolution baked into the model id), Luma and Runway are
// excluded from the generic controls.
const VIDEO_RESOLUTIONS = ["1080p", "720p", "480p"];
const VIDEO_DURATIONS = [5, 10];

const isVeoModel = (m) => (m?.apiId || "").startsWith("veo");

const genericResolutions = (m) => {
  if (!m) return [];
  if (m.inputs?.resolution?.enum) return m.inputs.resolution.enum;
  if (m.platform === "unified" && !isVeoModel(m)) return VIDEO_RESOLUTIONS;
  return [];
};
const genericDurations = (m) => {
  if (!m) return [];
  if (m.inputs?.duration?.enum) return m.inputs.duration.enum;
  if ((m.platform === "unified" && !isVeoModel(m)) || m.platform === "sora") return VIDEO_DURATIONS;
  return [];
};

export const getAspectRatiosForVideoModel = (id) => {
  const m = t2vModels.find(x => x.id === id);
  return m?.inputs?.aspect_ratio?.enum || ["16:9", "9:16", "1:1"];
};
export const getDurationsForModel = (id) => {
  const m = [...t2vModels, ...i2vModels].find(x => x.id === id);
  return genericDurations(m);
};
export const getResolutionsForVideoModel = (id) => {
  return genericResolutions(t2vModels.find(x => x.id === id));
};
export const getAspectRatiosForI2VModel = (id) => {
  const m = i2vModels.find(x => x.id === id);
  return m?.inputs?.aspect_ratio?.enum || ["16:9", "9:16", "1:1"];
};
export const getDurationsForI2VModel = (id) => {
  return genericDurations(i2vModels.find(x => x.id === id));
};
export const getResolutionsForI2VModel = (id) => {
  return genericResolutions(i2vModels.find(x => x.id === id));
};
export const getEffectsForI2VModel       = (id) => [];
export const getDefaultEffectForI2VModel = (id) => null;
export const getModesForModel            = (id) => {
  const m = [...t2vModels, ...i2vModels].find(x => x.id === id);
  return m?.inputs?.mode?.enum || [];
};

// ── LipSync helpers ───────────────────────────────────────────────────────────
export const getResolutionsForLipSyncModel = (id) => [];
