// Memefast models catalog
// platform: 'unified' → POST /v1/video/create + GET /v1/video/task/{id}
// platform: 'kling'   → POST /v1/kling/videos + GET /v1/kling/videos/{id}
// platform: 'luma'    → POST /v1/luma/generations + GET /v1/luma/generations/{id}
// platform: 'sora'    → POST /v1/video/generations + GET /v1/video/generations/{id}
// platform: 'minimax' → POST /v1/video_generation + GET /v1/query/video_generation?task_id=
// platform: 'runway'  → POST /v1/runway/image2video + GET /v1/runway/tasks/{id}

// ── Image generation (text → image) via POST /v1/images/generations ──────────
export const t2iModels = [
  {
    id: "flux-pro",
    name: "FLUX Pro",
    apiId: "flux-pro",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
        default: "1:1", title: "Aspect Ratio", type: "string"
      }
    }
  },
  {
    id: "flux-dev",
    name: "FLUX Dev",
    apiId: "flux-dev",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
        default: "1:1", title: "Aspect Ratio", type: "string"
      }
    }
  },
  {
    id: "flux-schnell",
    name: "FLUX Schnell",
    apiId: "flux-schnell",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
        default: "1:1", title: "Aspect Ratio", type: "string"
      }
    }
  },
  {
    id: "flux-kontext-pro",
    name: "FLUX Kontext Pro",
    apiId: "flux-kontext-pro",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
        default: "1:1", title: "Aspect Ratio", type: "string"
      }
    }
  },
  {
    id: "flux-kontext-max",
    name: "FLUX Kontext Max",
    apiId: "flux-kontext-max",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
        default: "1:1", title: "Aspect Ratio", type: "string"
      }
    }
  },
  {
    id: "gpt-image-1",
    name: "GPT Image 1",
    apiId: "gpt-image-1",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      quality: { enum: ["standard", "hd"], default: "standard", title: "Quality", type: "string" },
      size: {
        enum: ["1024x1024", "1024x1536", "1536x1024"],
        default: "1024x1024", title: "Size", type: "string"
      }
    }
  },
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    apiId: "gpt-image-2",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      quality: { enum: ["standard", "hd"], default: "standard", title: "Quality", type: "string" },
      size: {
        enum: ["1024x1024", "1024x1536", "1536x1024"],
        default: "1024x1024", title: "Size", type: "string"
      }
    }
  },
  {
    id: "dall-e-3",
    name: "DALL·E 3",
    apiId: "dall-e-3",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      quality: { enum: ["standard", "hd"], default: "standard", title: "Quality", type: "string" },
      size: {
        enum: ["1024x1024", "1024x1792", "1792x1024"],
        default: "1024x1024", title: "Size", type: "string"
      }
    }
  },
  {
    id: "ideogram-v3",
    name: "Ideogram V3",
    apiId: "ideogram-v3",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
        default: "1:1", title: "Aspect Ratio", type: "string"
      }
    }
  },
  {
    id: "stable-diffusion-3.5-large",
    name: "Stable Diffusion 3.5 Large",
    apiId: "stable-diffusion-3.5-large",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
        default: "1:1", title: "Aspect Ratio", type: "string"
      }
    }
  }
];

// ── Image-to-image ────────────────────────────────────────────────────────────
export const i2iModels = [];

// ── Text-to-video ────────────────────────────────────────────────────────────
export const t2vModels = [
  // ── Google Veo (unified format) ──
  {
    id: "veo-3.1",
    name: "Google Veo 3.1",
    apiId: "veo-3.1",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      }
    }
  },
  {
    id: "veo-3.1-fast",
    name: "Google Veo 3.1 Fast",
    apiId: "veo-3.1-fast",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      }
    }
  },
  {
    id: "veo-3",
    name: "Google Veo 3",
    apiId: "veo-3",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      }
    }
  },
  // ── Kling (platform-specific) ──
  {
    id: "kling-v3-master",
    name: "Kling V3 Master",
    apiId: "kling-v3-master",
    platform: "kling",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["pro", "std"], default: "pro", title: "Mode", type: "string" }
    }
  },
  {
    id: "kling-v2.5-master",
    name: "Kling V2.5 Master",
    apiId: "kling-v2.5-master",
    platform: "kling",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["pro", "std"], default: "pro", title: "Mode", type: "string" }
    }
  },
  {
    id: "kling-v2-master",
    name: "Kling V2 Master",
    apiId: "kling-v2-master",
    platform: "kling",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["pro", "std"], default: "pro", title: "Mode", type: "string" }
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
      aspect_ratio: {
        enum: ["16:9", "9:16", "4:3", "3:4", "21:9", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
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
      aspect_ratio: {
        enum: ["16:9", "9:16", "4:3", "3:4", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      }
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
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      }
    }
  },
  // ── Sora (OpenAI video format) ──
  {
    id: "sora-2",
    name: "Sora 2",
    apiId: "sora-2",
    platform: "sora",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
      duration: { enum: [5, 10, 20], default: 10, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "sora",
    name: "Sora",
    apiId: "sora",
    platform: "sora",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  // ── Wan / 通义万象 (unified format) ──
  {
    id: "wan2.1-t2v-14b",
    name: "WAN 2.1 T2V",
    apiId: "wan2.1-t2v-14b",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      }
    }
  },
  // ── HappyHorse / 通义万象 (unified format) ──
  {
    id: "happyhorse",
    name: "HappyHorse",
    apiId: "happyhorse",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      }
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
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1", "4:3", "3:4"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
      duration: { enum: [4, 8], default: 4, title: "Duration (s)", type: "int" }
    }
  },
  // ── Grok video (unified format) ──
  {
    id: "grok-2-aurora",
    name: "Grok 2 Aurora",
    apiId: "grok-2-aurora",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      }
    }
  }
];

// ── Image-to-video ────────────────────────────────────────────────────────────
export const i2vModels = [
  // ── Kling i2v (platform-specific) ──
  {
    id: "kling-v3-master-i2v",
    name: "Kling V3 Master (фото→видео)",
    apiId: "kling-v3-master",
    platform: "kling",
    imageField: "image",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["pro", "std"], default: "pro", title: "Mode", type: "string" }
    }
  },
  {
    id: "kling-v2.5-master-i2v",
    name: "Kling V2.5 Master (фото→видео)",
    apiId: "kling-v2.5-master",
    platform: "kling",
    imageField: "image",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["pro", "std"], default: "pro", title: "Mode", type: "string" }
    }
  },
  {
    id: "kling-v2-master-i2v",
    name: "Kling V2 Master (фото→видео)",
    apiId: "kling-v2-master",
    platform: "kling",
    imageField: "image",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["pro", "std"], default: "pro", title: "Mode", type: "string" }
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
      aspect_ratio: {
        enum: ["16:9", "9:16", "4:3", "3:4", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      }
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
export const getAspectRatiosForVideoModel = (id) => {
  const m = t2vModels.find(x => x.id === id);
  return m?.inputs?.aspect_ratio?.enum || ["16:9", "9:16", "1:1"];
};
export const getDurationsForModel = (id) => {
  const m = [...t2vModels, ...i2vModels].find(x => x.id === id);
  return m?.inputs?.duration?.enum || [];
};
export const getResolutionsForVideoModel = (id) => {
  const m = t2vModels.find(x => x.id === id);
  return m?.inputs?.resolution?.enum || [];
};
export const getAspectRatiosForI2VModel = (id) => {
  const m = i2vModels.find(x => x.id === id);
  return m?.inputs?.aspect_ratio?.enum || ["16:9", "9:16", "1:1"];
};
export const getDurationsForI2VModel = (id) => {
  const m = i2vModels.find(x => x.id === id);
  return m?.inputs?.duration?.enum || [];
};
export const getResolutionsForI2VModel = (id) => {
  const m = i2vModels.find(x => x.id === id);
  return m?.inputs?.resolution?.enum || [];
};
export const getEffectsForI2VModel       = (id) => [];
export const getDefaultEffectForI2VModel = (id) => null;
export const getModesForModel            = (id) => {
  const m = [...t2vModels, ...i2vModels].find(x => x.id === id);
  return m?.inputs?.mode?.enum || [];
};

// ── LipSync helpers ───────────────────────────────────────────────────────────
export const getResolutionsForLipSyncModel = (id) => [];
