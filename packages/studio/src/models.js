// Memefast models catalog

// ── Image generation (text → image) ──────────────────────────────────────────
export const t2iModels = [
  {
    id: "flux-pro",
    name: "Flux Pro",
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
    name: "Flux Dev",
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
    name: "Flux Schnell",
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
    id: "dall-e-3",
    name: "DALL-E 3",
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
    id: "gpt-image-1",
    name: "GPT Image",
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
  {
    id: "pixverse-v5.5",
    name: "Pixverse V5.5",
    apiId: "pixverse-v5.5",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1", "4:3", "3:4"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
      duration: { enum: [4, 8], default: 4, title: "Duration", type: "int" }
    }
  },
  {
    id: "veo-3.1",
    name: "VEO 3.1 4K",
    apiId: "veo-3.1",
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
    name: "VEO 3",
    apiId: "veo-3",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      }
    }
  },
  {
    id: "happyhorse",
    name: "HappyHorse",
    apiId: "happyhorse",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      }
    }
  },
  {
    id: "kling-v2-master",
    name: "Kling V2 Master",
    apiId: "kling-v2-master",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
      duration: { enum: [5, 10], default: 5, title: "Duration", type: "int" }
    }
  },
  {
    id: "wan2.1-t2v-14b",
    name: "WAN 2.1 T2V",
    apiId: "wan2.1-t2v-14b",
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
  {
    id: "pixverse-v5.5-i2v",
    name: "Pixverse V5.5 (фото→видео)",
    apiId: "pixverse-v5.5",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1", "4:3", "3:4"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
      duration: { enum: [4, 8], default: 4, title: "Duration", type: "int" }
    }
  },
  {
    id: "kling-v2-master-i2v",
    name: "Kling V2 Master (фото→видео)",
    apiId: "kling-v2-master",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
      duration: { enum: [5, 10], default: 5, title: "Duration", type: "int" }
    }
  },
  {
    id: "wan2.1-i2v-14b",
    name: "WAN 2.1 (фото→видео)",
    apiId: "wan2.1-i2v-14b",
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

// ── Audio ────────────────────────────────────────────────────────────────────
export const audioModels = [
  {
    id: "tts-1",
    name: "TTS Standard",
    apiId: "tts-1",
    inputs: {
      voice: { enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"], default: "alloy" }
    }
  },
  {
    id: "tts-1-hd",
    name: "TTS HD",
    apiId: "tts-1-hd",
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
export const getEffectsForI2VModel      = (id) => [];
export const getDefaultEffectForI2VModel = (id) => null;
export const getModesForModel           = (id) => [];

// ── LipSync helpers ───────────────────────────────────────────────────────────
export const getResolutionsForLipSyncModel = (id) => [];
