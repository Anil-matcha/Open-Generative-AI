/**
 * MuAPI Enhanced Configuration
 * Configuration settings for advanced MuAPI capabilities in Open-Higgsfield-AI
 */

export const MUAPI_ENHANCED_CONFIG = {
  // Core API Configuration
  api: {
    baseURL: import.meta.env.VITE_MUAPI_URL || 'https://muapi.ai/api/v1',
    apiKey: import.meta.env.MUAPI_API_KEY,
    sandboxMode: import.meta.env.DEV || false,
    timeout: 30000, // 30 seconds
    retries: 3
  },

  // Feature Flags
  features: {
    // AI Enhancement Features
    aiEnhancement: true,
    superResolution: true,
    denoising: true,
    autoAdjust: true,

    // Processing Features
    batchProcessing: true,
    realTimeProcessing: false,
    adaptiveTranscoding: true,

    // Effects & Post-Processing
    advancedEffects: true,
    colorGrading: true,
    lutSupport: true,
    watermarking: true,
    textOverlays: true,

    // Specialized Features
    faceSwap: true,
    dressChange: true,
    backgroundRemoval: true,
    lipSync: true,

    // Video Features
    motionControls: true,
    vfx: true,
    videoEffects: true,

    // Music & Audio
    musicGeneration: true,
    speechSynthesis: true
  },

  // Performance Settings
  performance: {
    maxConcurrency: 3,
    bandwidthLimit: null, // bytes per second, null = unlimited
    requestsPerMinute: 60,
    memoryLimit: 500 * 1024 * 1024, // 500MB
    enableCaching: true,
    cacheSize: 100 * 1024 * 1024 // 100MB
  },

  // Quality Settings
  quality: {
    defaultImageModel: 'flux-dev',
    defaultVideoModel: 'kling-v2',
    defaultResolution: '1080p',
    defaultAspectRatio: '16:9',
    defaultQuality: 'high',
    compressionLevel: 'balanced'
  },

  // Batch Processing
  batch: {
    maxBatchSize: 10,
    defaultConcurrency: 3,
    progressUpdateInterval: 1000, // ms
    retryFailedItems: true,
    continueOnError: true
  },

  // CDN & Storage
  storage: {
    useCDN: true,
    cdnRegion: 'auto',
    uploadTimeout: 60000, // 1 minute
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'wav', 'mp3']
  },

  // Effects Presets
  effectsPresets: {
    'vintage-film': [
      'sepia',
      { name: 'color-grade', options: { contrast: 0.2, saturation: -0.1 } },
      { name: 'vignette', options: { amount: 0.3 } }
    ],
    'cyberpunk': [
      { name: 'color-grade', options: { saturation: 0.3, temperature: 2000 } },
      'sharpen',
      { name: 'vignette', options: { amount: 0.2, color: '#00ffff' } }
    ],
    'moody-drama': [
      { name: 'color-grade', options: { contrast: 0.3, brightness: -0.1 } },
      'blur',
      { name: 'vignette', options: { amount: 0.4 } }
    ],
    'clean-minimal': [
      'sharpen',
      { name: 'color-grade', options: { contrast: 0.1, saturation: -0.1 } }
    ],
    'vibrant-social': [
      { name: 'color-grade', options: { saturation: 0.2, contrast: 0.1 } },
      'sharpen'
    ]
  },

  // UI Integration Settings
  ui: {
    showAdvancedOptions: true,
    enableBatchUI: true,
    showProgressIndicators: true,
    enableDragDrop: true,
    maxPreviewSize: 320 // pixels
  },

  // Error Handling & Resilience
  resilience: {
    enableFallback: true,
    fallbackToBasic: true,
    enableRetry: true,
    maxRetryDelay: 30000, // 30 seconds
    enableCircuitBreaker: false,
    circuitBreakerThreshold: 5
  },

  // Analytics & Monitoring
  monitoring: {
    enableMetrics: true,
    trackUsage: true,
    logErrors: true,
    performanceTracking: true,
    healthCheckInterval: 300000 // 5 minutes
  }
};

/**
 * Get configuration for specific environment
 */
export function getEnvironmentConfig() {
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;

  if (isDev) {
    return {
      ...MUAPI_ENHANCED_CONFIG,
      features: {
        ...MUAPI_ENHANCED_CONFIG.features,
        aiEnhancement: false, // Disable expensive features in dev
        realTimeProcessing: false
      },
      performance: {
        ...MUAPI_ENHANCED_CONFIG.performance,
        maxConcurrency: 1,
        requestsPerMinute: 10
      },
      api: {
        ...MUAPI_ENHANCED_CONFIG.api,
        sandboxMode: true
      }
    };
  }

  if (isProd) {
    return {
      ...MUAPI_ENHANCED_CONFIG,
      // Production settings are more conservative
      performance: {
        ...MUAPI_ENHANCED_CONFIG.performance,
        maxConcurrency: 5,
        requestsPerMinute: 120
      },
      resilience: {
        ...MUAPI_ENHANCED_CONFIG.resilience,
        enableCircuitBreaker: true
      }
    };
  }

  return MUAPI_ENHANCED_CONFIG;
}

/**
 * Validate configuration
 */
export function validateConfig(config) {
  const errors = [];

  // Check required fields
  if (!config.api.apiKey && !import.meta.env.MUAPI_API_KEY) {
    errors.push('MuAPI API key is required');
  }

  if (!config.api.baseURL) {
    errors.push('MuAPI base URL is required');
  }

  // Check performance limits
  if (config.performance.maxConcurrency < 1) {
    errors.push('Max concurrency must be at least 1');
  }

  if (config.performance.requestsPerMinute < 1) {
    errors.push('Requests per minute must be at least 1');
  }

  // Check feature compatibility
  if (config.features.realTimeProcessing && !config.features.advancedEffects) {
    errors.push('Real-time processing requires advanced effects to be enabled');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Load configuration from environment and localStorage
 */
export function loadConfig() {
  const envConfig = getEnvironmentConfig();

  // Load user preferences from localStorage
  const userPrefs = JSON.parse(localStorage.getItem('muapi-enhanced-prefs') || '{}');

  // Merge configurations (user prefs override defaults)
  const config = {
    ...envConfig,
    features: {
      ...envConfig.features,
      ...userPrefs.features
    },
    performance: {
      ...envConfig.performance,
      ...userPrefs.performance
    },
    quality: {
      ...envConfig.quality,
      ...userPrefs.quality
    }
  };

  // Validate final configuration
  const validation = validateConfig(config);
  if (!validation.valid) {
    console.warn('[MuAPI Enhanced] Configuration validation failed:', validation.errors);
    // Continue with config but log warnings
  }

  return config;
}

/**
 * Save user preferences to localStorage
 */
export function saveUserPreferences(preferences) {
  const currentPrefs = JSON.parse(localStorage.getItem('muapi-enhanced-prefs') || '{}');
  const updatedPrefs = {
    ...currentPrefs,
    ...preferences,
    lastUpdated: new Date().toISOString()
  };

  localStorage.setItem('muapi-enhanced-prefs', JSON.stringify(updatedPrefs));
}

/**
 * Get feature flag with fallback
 */
export function getFeatureFlag(flagName, defaultValue = false) {
  const config = loadConfig();
  return config.features[flagName] !== undefined ? config.features[flagName] : defaultValue;
}

/**
 * Update feature flag
 */
export function setFeatureFlag(flagName, enabled) {
  const userPrefs = JSON.parse(localStorage.getItem('muapi-enhanced-prefs') || '{}');
  const features = userPrefs.features || {};

  features[flagName] = enabled;
  saveUserPreferences({ features });
}

/**
 * Get performance setting
 */
export function getPerformanceSetting(settingName, defaultValue) {
  const config = loadConfig();
  return config.performance[settingName] !== undefined ? config.performance[settingName] : defaultValue;
}

// Comprehensive model mapping based on MuAPI playground - 100+ models with advanced features
export const MODEL_ADVANCED_FEATURES = {
  // ===== SEEDANCE MODELS =====
  'seedance-v2.0-t2v': ['aiVideoEffects', 'motionControls', 'musicGeneration', 'lipsync'],
  'seedance-v2.0-i2v': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration', 'lipsync'],
  'seedance-v2.0-extend': ['aiVideoEffects', 'motionControls', 'musicGeneration', 'lipsync'],
  'seedance-pro-t2v': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration', 'lipsync'],
  'seedance-pro-i2v': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration', 'lipsync'],
  'seedance-lite-i2v': ['motionControls', 'basicEffects'],
  'seedance-v1.5-pro-t2v': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration'],
  'seedance-v1.5-pro-i2v-fast': ['motionControls', 'vfx'],
  'seedance-v1.5-pro-video-extend-fast': ['motionControls', 'vfx'],

  // ===== KLING MODELS =====
  'kling-v3.0-pro-text-to-video': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration', 'lipsync', 'storyboarding'],
  'kling-v3.0-standard-text-to-video': ['motionControls', 'vfx', 'musicGeneration'],
  'kling-v3.0-pro-image-to-video': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration', 'lipsync'],
  'kling-v3.0-standard-image-to-video': ['motionControls', 'vfx'],
  'kling-v2.6-pro-t2v': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration', 'lipsync'],
  'kling-v2.6-std-motion-control': ['motionControls', 'vfx', 'cameraControl'],
  'kling-v2.5-turbo-pro-t2v': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration'],
  'kling-v2.5-turbo-pro-i2v': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration'],
  'kling-v2.1-master-t2v': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration'],
  'kling-v2.1-master-i2v': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration'],
  'kling-v2.1-standard-t2v': ['motionControls', 'vfx'],
  'kling-v2.1-standard-i2v': ['motionControls', 'vfx'],
  'kling-v2.1-pro-t2v': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration'],
  'kling-v2.1-pro-i2v': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration'],
  'kling-o1-text-to-video': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration', 'lipsync'],
  'kling-o1-edit-image': ['faceSwap', 'backgroundRemoval', 'skinEnhancement', 'imageUpscaling'],
  'kling-o1-standard-image-to-video': ['motionControls', 'vfx'],
  'kling-v2-avatar-pro': ['lipsync', 'avatarAnimation', 'facialAnimation'],

  // ===== WAN MODELS =====
  'wan2.7-text-to-video': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration'],
  'wan2.7-text-to-image-pro': ['imageEnhancement', 'styleTransfer', 'highResolution'],
  'wan2.7-image-edit': ['objectRemoval', 'backgroundSwap', 'styleTransfer'],
  'wan2.6-text-to-video': ['aiVideoEffects', 'motionControls', 'vfx'],
  'wan2.6-image-edit': ['objectRemoval', 'backgroundSwap', 'styleTransfer'],
  'wan2.5-text-to-video': ['aiVideoEffects', 'motionControls', 'vfx'],
  'wan2.5-text-to-video-fast': ['motionControls', 'basicEffects'],
  'wan2.5-text-to-image': ['imageEnhancement', 'styleTransfer'],
  'wan2.2-text-to-video': ['aiVideoEffects', 'motionControls', 'vfx'],
  'wan2.2-image-to-video': ['motionControls', 'vfx', 'facialAnimation'],
  'wan2.1-text-to-video': ['aiVideoEffects', 'motionControls', 'vfx'],
  'wan2.1-text-to-image': ['imageEnhancement', 'styleTransfer'],
  'wan2.1-image-to-video': ['motionControls', 'vfx', 'facialAnimation'],
  'wan2.1-lora-t2v': ['characterConsistency', 'styleConsistency', 'customTraining'],
  'wan2.1-lora-i2v': ['characterConsistency', 'styleConsistency', 'customTraining'],

  // ===== VEO MODELS =====
  'veo3.1-text-to-video': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration', 'highQuality'],
  'veo3.1-image-to-video': ['motionControls', 'vfx', 'facialAnimation', 'highQuality'],
  'veo3.1-lite-text-to-video': ['motionControls', 'basicEffects'],
  'veo3.1-lite-image-to-video': ['motionControls', 'basicEffects'],
  'veo3-fast-text-to-video': ['motionControls', 'basicEffects', 'fastGeneration'],
  'veo3-fast-image-to-video': ['motionControls', 'basicEffects', 'fastGeneration'],
  'veo3-text-to-video': ['aiVideoEffects', 'motionControls', 'vfx'],
  'veo3-image-to-video': ['motionControls', 'vfx', 'facialAnimation'],
  'veo4-image-to-video': ['motionControls', 'vfx', 'facialAnimation', 'cameraControl'],

  // ===== RUNWAY MODELS =====
  'runway-text-to-video': ['aiVideoEffects', 'motionControls', 'vfx'],
  'runway-image-to-video': ['motionControls', 'vfx', 'facialAnimation'],
  'runway-act-two-v2v': ['facialAnimation', 'expressionTransfer', 'lipSync'],
  'runway-act-two-i2v': ['facialAnimation', 'expressionTransfer', 'lipSync'],
  'runway-aleph-v2v': ['styleTransfer', 'visualTransformation'],

  // ===== PIXVERSE MODELS =====
  'pixverse-v6-i2v': ['motionControls', 'vfx', 'facialAnimation', 'promptControl'],
  'pixverse-v5.5-t2v': ['aiVideoEffects', 'motionControls', 'vfx'],
  'pixverse-v5-t2v': ['aiVideoEffects', 'motionControls', 'vfx'],
  'pixverse-v4.5-t2v': ['aiVideoEffects', 'motionControls', 'vfx'],
  'pixverse-v4.5-i2v': ['motionControls', 'vfx', 'facialAnimation'],

  // ===== OPENAI SORA MODELS =====
  'openai-sora-2-pro-text-to-video': ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration', 'storyboarding', 'highQuality'],
  'openai-sora-2-pro-image-to-video': ['motionControls', 'vfx', 'facialAnimation', 'highQuality'],
  'openai-sora-2-pro-storyboard': ['storyboarding', 'characterConsistency', 'sceneManagement'],
  'openai-sora-2-standard-text-to-video': ['motionControls', 'vfx', 'musicGeneration'],
  'openai-sora-2-image-to-video': ['motionControls', 'vfx', 'facialAnimation'],
  'openai-sora': ['motionControls', 'vfx'],

  // ===== FLUX MODELS =====
  'flux-dev': ['imageEnhancement', 'styleTransfer', 'highResolution'],
  'flux-pro': ['imageEnhancement', 'styleTransfer', 'highResolution', 'professional'],
  'flux-max': ['imageEnhancement', 'styleTransfer', 'highResolution', 'professional', 'ultraQuality'],
  'flux-2-dev': ['imageEnhancement', 'styleTransfer', 'highResolution'],
  'flux-2-pro': ['imageEnhancement', 'styleTransfer', 'highResolution', 'professional'],
  'flux-2-klein-4b': ['imageEnhancement', 'styleTransfer', 'fastGeneration'],
  'flux-2-klein-4b-turbo': ['imageEnhancement', 'styleTransfer', 'ultraFast'],
  'flux-2-klein-9b-turbo': ['imageEnhancement', 'styleTransfer', 'ultraFast', 'highQuality'],
  'flux-kontext-dev-t2i': ['imageEnhancement', 'styleTransfer', 'contextAware'],
  'flux-kontext-pro-t2i': ['imageEnhancement', 'styleTransfer', 'contextAware', 'professional'],
  'flux-kontext-pro-i2i': ['imageEnhancement', 'styleTransfer', 'contextAware', 'professional'],
  'flux-kontext-max-t2i': ['imageEnhancement', 'styleTransfer', 'contextAware', 'ultraQuality'],
  'flux-kontext-max-i2i': ['imageEnhancement', 'styleTransfer', 'contextAware', 'ultraQuality'],
  'flux-kontext-effects': ['imageEnhancement', 'styleTransfer', 'cinematicEffects'],
  'flux-pulid': ['faceConsistency', 'characterConsistency'],
  'flux-schnell': ['imageEnhancement', 'styleTransfer', 'ultraFast'],

  // ===== MIDJOURNEY MODELS =====
  'midjourney-v7': ['imageEnhancement', 'styleTransfer', 'artistic', 'highQuality'],
  'midjourney-v7-style-reference': ['imageEnhancement', 'styleTransfer', 'cinematic'],
  'midjourney-v7-image-to-image': ['imageEnhancement', 'styleTransfer', 'artistic'],
  'midjourney-v7-image-to-video': ['motionControls', 'artisticAnimation'],

  // ===== SPECIALIZED APPS =====
  'ai-video-face-swap': ['faceSwap', 'facialAnimation', 'expressionTransfer'],
  'ai-image-face-swap': ['faceSwap', 'highPrecision'],
  'ai-dress-change': ['clothingSwap', 'posePreservation'],
  'ai-background-remover': ['backgroundRemoval', 'precisionMasking'],
  'ai-skin-enhancer': ['skinEnhancement', 'portraitRetouching'],
  'ai-image-upscaler': ['imageUpscaling', 'detailEnhancement'],
  'ai-image-extension': ['imageExtension', 'outpainting'],
  'ai-product-shot': ['productPhotography', 'studioLighting'],
  'ai-product-photography': ['productPhotography', 'lifestyleShots'],
  'ai-ghibli-style': ['styleTransfer', 'animationStyle'],
  'ai-anime-generator': ['styleTransfer', 'animeStyle'],
  'ai-color-photo': ['colorization', 'historicalEnhancement'],
  'ai-object-eraser': ['objectRemoval', 'contentAwareFill'],
  'ai-captions': ['textOverlay', 'animatedCaptions'],
  'ai-clippings': ['videoEditing', 'shortFormContent'],
  'ai-video-upscaler': ['videoUpscaling', 'qualityEnhancement'],
  'ai-clipping': ['videoEditing', 'shortFormContent'],
  'heygen-video-translate': ['videoTranslation', 'lipSync', 'multiLanguage'],

  // ===== AUDIO & MUSIC =====
  'suno-create-music': ['musicGeneration', 'vocals', 'professionalQuality'],
  'suno-remix-music': ['musicRemixing', 'styleTransfer'],
  'suno-extend-music': ['musicExtension', 'continuation'],
  'suno-add-vocals': ['vocalAddition', 'harmony'],
  'suno-generate-mashup': ['musicMashup', 'multiTrack'],
  'suno-generate-lyrics': ['lyricGeneration', 'songwriting'],
  'mmaudio-v2-text-to-audio': ['textToSpeech', 'voiceSynthesis'],
  'mmaudio-v2-video-to-video': ['audioSync', 'lipSync'],
  'ltx-2-19b-lipsync': ['lipSync', 'facialAnimation', 'highQuality'],

  // ===== STABLE DIFFUSION =====
  'sd-2-t2v': ['motionControls', 'vfx', 'cameraControl'],
  'sd-2-t2v-480p': ['motionControls', 'costEffective'],
  'sd-2-i2v': ['motionControls', 'vfx', 'facialAnimation'],
  'sd-2-i2v-480p': ['motionControls', 'costEffective'],
  'sd-2-omni-reference-480p': ['characterConsistency', 'referenceBased'],
  'sd-2-vip-first-last-frame-fast': ['transitionEffects', 'fastGeneration'],
  'sd-2-first-last-frame': ['transitionEffects', 'highQuality'],
  'sd-2-image-to-video': ['motionControls', 'vfx', 'audioSync'],
  'sd-2-image-to-video-fast': ['motionControls', 'costEffective'],
  'sd-2-text-to-video-fast': ['motionControls', 'fastGeneration'],
  'sd-2-character': ['characterConsistency', 'reusableCharacters'],
  'sd-2-video-edit': ['videoEditing', 'promptBased'],

  // ===== QWEN MODELS =====
  'qwen-text-to-image-2512': ['imageEnhancement', 'sceneUnderstanding'],
  'qwen-image-2.0-pro': ['imageEnhancement', 'highFidelity'],
  'qwen-image-2.0-pro-edit': ['imageEditing', 'precisionControl'],
  'qwen-image-edit-plus': ['multiImageEditing', 'contextPreservation'],
  'qwen-image-edit-plus-lora': ['customTraining', 'personalizedEditing'],
  'qwen-image-edit': ['promptBasedEditing', 'naturalLanguage'],

  // ===== OTHER MODELS =====
  'minimax-hailuo-02-standard-i2v': ['motionControls', 'socialMedia'],
  'vidu-v2.0-i2v': ['motionControls', 'emotionDynamics'],
  'vidu-v2.0-t2v': ['aiVideoEffects', 'workflowSupport'],
  'vidu-q2-reference': ['characterConsistency', 'multiReference'],
  'happy-horse-1-text-to-video': ['characterAnimation', 'stylizedMotion'],
  'happy-horse-1-image-to-video': ['characterAnimation', 'stylizedMotion'],
  'hunyuan-text-to-video': ['realisticMotion', 'sceneUnderstanding'],
  'hunyuan-image-to-video': ['naturalAnimation', 'contextAwareness'],
  'hunyuan-fast-text-to-video': ['fastGeneration', 'qualityBalance'],
  'ideogram-v3-reframe': ['aspectRatioAdaptation', 'compositionPreservation'],
  'ideogram-character': ['characterConsistency', 'referenceBased'],
  'gpt-image-1.5': ['visualReasoning', 'complexScenes'],
  'gpt4o-text-to-image': ['basicGeneration', 'multimodal'],
  'gpt4o-image-to-image': ['transformation', 'styleTransfer'],
  'gpt4o-edit': ['preciseEditing', 'objectManipulation'],
  'nano-banana-edit': ['creativeEditing', 'characterPreservation'],
  'bytedance-seedream-v5.0': ['highDetail', 'cinematic'],
  'bytedance-seedream-v5.0-edit': ['styleTransfer', 'characterConsistency'],
  'bytedance-seedream-v4.5': ['versatileGeneration', 'highQuality'],
  'bytedance-seedream-v3': ['artisticGeneration', 'fantasy'],
  'bytedance-seededit-v3': ['maskBasedEditing', 'preciseControl'],
  'hidream-i1-dev': ['fastGeneration', 'previewQuality'],
  'hidream-i1-fast': ['ultraFast', 'iterative'],
  'hidream-i1-full': ['maximumQuality', 'productionReady'],
  'grok-imagine-image-to-image': ['transformation', 'contextPreservation'],
  'grok-imagine-extend': ['videoExtension', 'consistencyMaintenance'],
  'z-image-base': ['reliableGeneration', 'versatileStyles'],
  'z-image-p': ['consistentOutput', 'qualityFocused'],
  'chroma-image': ['creativeGeneration', 'highQuality'],
  'google-imagen4-fast': ['rapidGeneration', 'accessibility'],
  'google-imagen4-ultra': ['photorealistic', 'productionQuality'],
  'ltx-2-19b-text-to-video': ['coherentVideo', 'temporalStability'],
  'openai-sora-2-pro-characters': ['characterDefinition', 'consistency'],
  'photo-pack': ['professionalPortraits', 'styleVariations'],
  'add-image-watermark': ['watermarking', 'customPositioning'],
  'remix-video': ['videoTransformation', 'formatConversion'],
  'image-effects': ['visualEffects', 'filterApplication'],
  'video-effects': ['cinematicFilters', 'colorGrading'],
  'motion-controls': ['cameraMovement', 'dynamicAnimation'],
  'vfx': ['specialEffects', 'compositing'],

  // ===== NEW APP FEATURE MAPPINGS =====
  'runway-motion': ['motionControls', 'vfx', 'facialAnimation'],
  'tiktok-carousel': ['videoEditing', 'shortFormContent', 'socialMedia'],
  'advanced-dubbing': ['lipSync', 'voiceSynthesis', 'multiLanguage'],
  'veo-advanced-i2v': ['motionControls', 'vfx', 'facialAnimation', 'cameraControl', 'highQuality'],
  'pixverse-advanced-effects': ['aiVideoEffects', 'motionControls', 'vfx', 'facialAnimation', 'promptControl', 'advancedEffects']
};

export function getModelFeatures(modelId) {
  return MODEL_ADVANCED_FEATURES[modelId] || [];
}

export function hasAdvancedFeatures(modelId) {
  const features = getModelFeatures(modelId);
  return features.length > 0;
}

// Wan AI Effects Configuration
export const WAN_AI_EFFECTS = {
  cakeify: { name: 'Cakeify', description: 'Stylized animation effect' },
  vhs: { name: 'VHS Footage', description: 'Retro video tape effect' },
  samurai: { name: 'Samurai It', description: 'Character animation style' },
  'film-noir': { name: 'Film Noir', description: 'Cinematic black & white style' },
  animal: { name: 'Animal Transformation', description: 'Animal character effects' },
  rotation: { name: 'Rotation Effect', description: 'Dynamic rotation animations' }
};

export const PIXVERSE_ADVANCED_EFFECTS = {
  // Advanced Rendering Controls
  'hyper-realistic': {
    name: 'Hyper Realistic',
    description: 'Ultra-high fidelity rendering with enhanced detail and realism',
    category: 'rendering'
  },
  'cinematic-depth': {
    name: 'Cinematic Depth',
    description: 'Advanced depth of field and bokeh effects for cinematic quality',
    category: 'rendering'
  },
  'motion-blur': {
    name: 'Motion Blur Control',
    description: 'Precise motion blur simulation for dynamic camera movements',
    category: 'rendering'
  },

  // Post-Processing Options
  'color-grading': {
    name: 'Advanced Color Grading',
    description: 'Professional color correction and LUT application',
    category: 'post-processing'
  },
  'hdr-tonemapping': {
    name: 'HDR Tone Mapping',
    description: 'High dynamic range tone mapping for enhanced contrast',
    category: 'post-processing'
  },
  'film-grain': {
    name: 'Film Grain',
    description: 'Authentic film grain simulation with adjustable intensity',
    category: 'post-processing'
  },

  // Quality Enhancement Toggles
  'super-resolution': {
    name: 'Super Resolution',
    description: 'AI-powered upscaling to 4K resolution with detail enhancement',
    category: 'quality'
  },
  'denoising': {
    name: 'AI Denoising',
    description: 'Advanced noise reduction while preserving fine details',
    category: 'quality'
  },
  'sharpness-enhancement': {
    name: 'Sharpness Enhancement',
    description: 'Intelligent edge enhancement and detail sharpening',
    category: 'quality'
  },

  // Special Effects
  'particle-effects': {
    name: 'Particle Effects',
    description: 'Dynamic particle systems for magical and atmospheric effects',
    category: 'effects'
  },
  'lightning-simulation': {
    name: 'Lightning Simulation',
    description: 'Realistic lightning and electrical effects',
    category: 'effects'
  },
  'water-simulation': {
    name: 'Water Simulation',
    description: 'Advanced fluid dynamics for realistic water effects',
    category: 'effects'
  }
};

/**
 * Export for use in application
 */
export default {
  loadConfig,
  validateConfig,
  saveUserPreferences,
  getFeatureFlag,
  setFeatureFlag,
  getPerformanceSetting,
  getModelFeatures,
  hasAdvancedFeatures,
  MODEL_ADVANCED_FEATURES,
  MUAPI_ENHANCED_CONFIG
};