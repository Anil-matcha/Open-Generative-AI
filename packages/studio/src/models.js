// Memefast model definitions

const AR_STANDARD = ['16:9', '9:16', '1:1', '4:3', '3:4'];
const AR_VIDEO = ['16:9', '9:16', '1:1'];
const DUR_STANDARD = [5, 10];
const VOICES_OPENAI = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

// ─── Text-to-Image ───────────────────────────────────────────────────────────

export const t2iModels = [
  {
    id: 'flux-1.1-ultra',
    name: 'Flux 1.1 Ultra',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_STANDARD, default: '1:1', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
    }
  },
  {
    id: 'gpt-image-1',
    name: 'GPT-Image-1',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: ['1:1', '16:9', '9:16'], default: '1:1', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
    }
  },
  {
    id: 'dall-e-3',
    name: 'DALL·E 3',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: ['1:1', '16:9', '9:16'], default: '1:1', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
      quality: { enum: ['standard', 'hd'], default: 'standard', type: 'string', title: 'Quality', name: 'quality' },
    }
  },
  {
    id: 'ideogram-v3',
    name: 'Ideogram V3',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_STANDARD, default: '1:1', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
    }
  },
];

// ─── Image-to-Image ──────────────────────────────────────────────────────────

export const i2iModels = [
  {
    id: 'gpt-image-1',
    name: 'GPT-Image-1 Edit',
    imageField: 'image_url',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: ['1:1', '16:9', '9:16'], default: '1:1', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
    }
  },
  {
    id: 'flux-1.1-ultra',
    name: 'Flux 1.1 Ultra Edit',
    imageField: 'image_url',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_STANDARD, default: '1:1', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
    }
  },
];

// ─── Text-to-Video ───────────────────────────────────────────────────────────

export const t2vModels = [
  {
    id: 'veo3.1-fast',
    name: 'VEO 3.1 Fast',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_VIDEO, default: '16:9', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
    }
  },
  {
    id: 'veo3.1',
    name: 'VEO 3.1',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_VIDEO, default: '16:9', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
    }
  },
  {
    id: 'kling-video-v1.6-standard',
    name: 'Kling 1.6 Standard',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_VIDEO, default: '16:9', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
      duration: { enum: DUR_STANDARD, default: 5, type: 'int', title: 'Duration (s)', name: 'duration' },
    }
  },
  {
    id: 'kling-video-v1.6-pro',
    name: 'Kling 1.6 Pro',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_VIDEO, default: '16:9', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
      duration: { enum: DUR_STANDARD, default: 5, type: 'int', title: 'Duration (s)', name: 'duration' },
    }
  },
  {
    id: 'sora-turbo',
    name: 'Sora Turbo',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_VIDEO, default: '16:9', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
      duration: { enum: DUR_STANDARD, default: 5, type: 'int', title: 'Duration (s)', name: 'duration' },
    }
  },
  {
    id: 'pixverse-v4.5',
    name: 'Pixverse V4.5',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_VIDEO, default: '16:9', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
      duration: { enum: [5, 8], default: 5, type: 'int', title: 'Duration (s)', name: 'duration' },
    }
  },
  {
    id: 'seedance-1-lite',
    name: 'Seedance 1 Lite',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_VIDEO, default: '16:9', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
      duration: { enum: [5, 10], default: 5, type: 'int', title: 'Duration (s)', name: 'duration' },
    }
  },
  {
    id: 'seedance-1-pro',
    name: 'Seedance 1 Pro',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_VIDEO, default: '16:9', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
      duration: { enum: [5, 10], default: 5, type: 'int', title: 'Duration (s)', name: 'duration' },
    }
  },
];

// ─── Image-to-Video ──────────────────────────────────────────────────────────

export const i2vModels = [
  {
    id: 'wan-i2v-14b',
    name: 'WAN I2V',
    imageField: 'images',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_VIDEO, default: '16:9', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
      duration: { enum: DUR_STANDARD, default: 5, type: 'int', title: 'Duration (s)', name: 'duration' },
    }
  },
  {
    id: 'kling-video-v1.6-standard',
    name: 'Kling 1.6 Standard (I2V)',
    imageField: 'images',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_VIDEO, default: '16:9', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
      duration: { enum: DUR_STANDARD, default: 5, type: 'int', title: 'Duration (s)', name: 'duration' },
    }
  },
  {
    id: 'kling-video-v1.6-pro',
    name: 'Kling 1.6 Pro (I2V)',
    imageField: 'images',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_VIDEO, default: '16:9', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
      duration: { enum: DUR_STANDARD, default: 5, type: 'int', title: 'Duration (s)', name: 'duration' },
    }
  },
  {
    id: 'pixverse-v4.5',
    name: 'Pixverse V4.5 (I2V)',
    imageField: 'images',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: { enum: AR_VIDEO, default: '16:9', type: 'string', title: 'Aspect Ratio', name: 'aspect_ratio' },
      duration: { enum: [5, 8], default: 5, type: 'int', title: 'Duration (s)', name: 'duration' },
    }
  },
];

// ─── Video-to-Video ──────────────────────────────────────────────────────────

export const v2vModels = [
  {
    id: 'kling-video-effects',
    name: 'Kling Video Effects',
    videoField: 'video_url',
    hasPrompt: true,
    inputs: {
      prompt: { type: 'string', title: 'Effect Prompt', name: 'prompt' },
    }
  },
];

// ─── LipSync ─────────────────────────────────────────────────────────────────

export const lipsyncModels = [
  {
    id: 'kling-advanced-lip-sync',
    name: 'Kling LipSync',
    category: 'image',
    inputs: {
      resolution: { enum: ['720p', '1080p'], default: '720p', type: 'string', title: 'Resolution', name: 'resolution' },
    }
  },
  {
    id: 'pixverse-lipsync',
    name: 'Pixverse LipSync',
    category: 'video',
    inputs: {
      resolution: { enum: ['720p', '1080p'], default: '720p', type: 'string', title: 'Resolution', name: 'resolution' },
    }
  },
];

export const imageLipSyncModels = lipsyncModels.filter(m => m.category === 'image');
export const videoLipSyncModels = lipsyncModels.filter(m => m.category === 'video');

// ─── Audio ───────────────────────────────────────────────────────────────────

export const audioModels = [
  {
    id: 'tts-1',
    name: 'TTS Standard',
    inputs: {
      text: { type: 'string', title: 'Text', name: 'text' },
      voice: { enum: VOICES_OPENAI, default: 'alloy', type: 'string', title: 'Voice', name: 'voice' },
    }
  },
  {
    id: 'tts-1-hd',
    name: 'TTS HD',
    inputs: {
      text: { type: 'string', title: 'Text', name: 'text' },
      voice: { enum: VOICES_OPENAI, default: 'nova', type: 'string', title: 'Voice', name: 'voice' },
    }
  },
  {
    id: 'minimax-speech-02-hd',
    name: 'MiniMax Speech HD',
    inputs: {
      text: { type: 'string', title: 'Text', name: 'text' },
      voice: { enum: ['male-qn-qingse', 'female-shaonv', 'male-qn-jingying', 'female-yujie'], default: 'female-shaonv', type: 'string', title: 'Voice', name: 'voice' },
    }
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export const getModelById = (id) => t2iModels.find(m => m.id === id);
export const getVideoModelById = (id) => t2vModels.find(m => m.id === id);
export const getI2IModelById = (id) => i2iModels.find(m => m.id === id);
export const getI2VModelById = (id) => i2vModels.find(m => m.id === id);
export const getV2VModelById = (id) => v2vModels.find(m => m.id === id);
export const getLipSyncModelById = (id) => lipsyncModels.find(m => m.id === id);
export const getAudioModelById = (id) => audioModels.find(m => m.id === id);

const getEnum = (model, field) => model?.inputs?.[field]?.enum || [];

export const getAspectRatiosForModel = (modelId) => {
  const m = t2iModels.find(m => m.id === modelId);
  return getEnum(m, 'aspect_ratio');
};

export const getAspectRatiosForVideoModel = (modelId) => {
  const m = t2vModels.find(m => m.id === modelId);
  return getEnum(m, 'aspect_ratio');
};

export const getAspectRatiosForI2IModel = (modelId) => {
  const m = i2iModels.find(m => m.id === modelId);
  return getEnum(m, 'aspect_ratio');
};

export const getAspectRatiosForI2VModel = (modelId) => {
  const m = i2vModels.find(m => m.id === modelId);
  return getEnum(m, 'aspect_ratio');
};

export const getDurationsForModel = (modelId) => {
  const m = t2vModels.find(m => m.id === modelId);
  return getEnum(m, 'duration');
};

export const getDurationsForI2VModel = (modelId) => {
  const m = i2vModels.find(m => m.id === modelId);
  return getEnum(m, 'duration');
};

export const getResolutionsForModel = (modelId) => {
  const m = t2iModels.find(m => m.id === modelId);
  return getEnum(m, 'resolution');
};

export const getResolutionsForVideoModel = (modelId) => {
  const m = t2vModels.find(m => m.id === modelId);
  return getEnum(m, 'resolution');
};

export const getResolutionsForI2IModel = (modelId) => {
  const m = i2iModels.find(m => m.id === modelId);
  return getEnum(m, 'resolution');
};

export const getResolutionsForI2VModel = (modelId) => {
  const m = i2vModels.find(m => m.id === modelId);
  return getEnum(m, 'resolution');
};

export const getResolutionsForLipSyncModel = (modelId) => {
  const m = lipsyncModels.find(m => m.id === modelId);
  return getEnum(m, 'resolution');
};

export const getModesForModel = (modelId) => {
  const m = [...t2vModels, ...i2vModels].find(m => m.id === modelId);
  return getEnum(m, 'mode');
};

export const getEffectsForI2VModel = (modelId) => {
  const m = i2vModels.find(m => m.id === modelId);
  return getEnum(m, 'effect');
};

export const getDefaultEffectForI2VModel = (modelId) => {
  const m = i2vModels.find(m => m.id === modelId);
  return m?.inputs?.effect?.default || null;
};

export const getEffectsForI2IModel = (modelId) => {
  const m = i2iModels.find(m => m.id === modelId);
  return getEnum(m, 'effect');
};

export const getDefaultEffectForI2IModel = (modelId) => {
  const m = i2iModels.find(m => m.id === modelId);
  return m?.inputs?.effect?.default || null;
};

export const getQualityFieldForModel = (modelId) => {
  const m = t2iModels.find(m => m.id === modelId);
  return m?.inputs?.quality ? { field: 'quality', values: getEnum(m, 'quality'), default: m.inputs.quality.default } : null;
};

export const getQualityFieldForI2IModel = (modelId) => {
  const m = i2iModels.find(m => m.id === modelId);
  return m?.inputs?.quality ? { field: 'quality', values: getEnum(m, 'quality'), default: m.inputs.quality.default } : null;
};

export const getMaxImagesForI2IModel = (modelId) => {
  const m = i2iModels.find(m => m.id === modelId);
  return m?.inputs?.images_list?.maxItems || 1;
};

export const getAspectRatiosForI2VModel_alias = getAspectRatiosForI2VModel;

export const getAspectRatiosForVideoModel_alias = getAspectRatiosForVideoModel;
