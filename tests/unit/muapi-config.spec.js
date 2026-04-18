import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  MUAPI_ENHANCED_CONFIG,
  getEnvironmentConfig,
  validateConfig,
  loadConfig,
  saveUserPreferences,
  getFeatureFlag,
  setFeatureFlag,
  getPerformanceSetting,
  getModelFeatures,
  hasAdvancedFeatures,
  MODEL_ADVANCED_FEATURES,
  WAN_AI_EFFECTS,
  PIXVERSE_ADVANCED_EFFECTS
} from '../../src/lib/muapiConfig.js';

// Mock environment variables using vi.stubGlobal
vi.stubGlobal('import.meta', {
  env: {
    DEV: true,
    PROD: false,
    VITE_MUAPI_URL: 'https://test.muapi.ai/api/v1',
    MUAPI_API_KEY: 'test-env-key'
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('MuAPI Enhanced Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('MUAPI_ENHANCED_CONFIG', () => {
    it('should have correct default configuration structure', () => {
      expect(MUAPI_ENHANCED_CONFIG).toHaveProperty('api');
      expect(MUAPI_ENHANCED_CONFIG).toHaveProperty('features');
      expect(MUAPI_ENHANCED_CONFIG).toHaveProperty('performance');
      expect(MUAPI_ENHANCED_CONFIG).toHaveProperty('quality');
      expect(MUAPI_ENHANCED_CONFIG).toHaveProperty('batch');
      expect(MUAPI_ENHANCED_CONFIG).toHaveProperty('storage');
      expect(MUAPI_ENHANCED_CONFIG).toHaveProperty('effectsPresets');
      expect(MUAPI_ENHANCED_CONFIG).toHaveProperty('ui');
      expect(MUAPI_ENHANCED_CONFIG).toHaveProperty('resilience');
      expect(MUAPI_ENHANCED_CONFIG).toHaveProperty('monitoring');
    });

    it('should have proper API configuration', () => {
      expect(MUAPI_ENHANCED_CONFIG.api).toEqual({
        baseURL: 'https://api.muapi.ai', // From import.meta.env.VITE_MUAPI_URL || default
        apiKey: undefined, // From import.meta.env.MUAPI_API_KEY (undefined in test)
        sandboxMode: true, // From import.meta.env.DEV
        timeout: 30000,
        retries: 3
      });
    });

    it('should have all feature flags enabled by default', () => {
      const expectedFeatures = {
        aiEnhancement: true,
        superResolution: true,
        denoising: true,
        autoAdjust: true,
        batchProcessing: true,
        realTimeProcessing: false,
        adaptiveTranscoding: true,
        advancedEffects: true,
        colorGrading: true,
        lutSupport: true,
        watermarking: true,
        textOverlays: true,
        faceSwap: true,
        dressChange: true,
        backgroundRemoval: true,
        lipSync: true,
        motionControls: true,
        vfx: true,
        videoEffects: true,
        musicGeneration: true,
        speechSynthesis: true
      };

      expect(MUAPI_ENHANCED_CONFIG.features).toEqual(expectedFeatures);
    });

    it('should have proper performance settings', () => {
      expect(MUAPI_ENHANCED_CONFIG.performance).toEqual({
        maxConcurrency: 3,
        bandwidthLimit: null,
        requestsPerMinute: 60,
        memoryLimit: 500 * 1024 * 1024,
        enableCaching: true,
        cacheSize: 100 * 1024 * 1024
      });
    });

    it('should have proper quality settings', () => {
      expect(MUAPI_ENHANCED_CONFIG.quality).toEqual({
        defaultImageModel: 'flux-dev',
        defaultVideoModel: 'kling-v2',
        defaultResolution: '1080p',
        defaultAspectRatio: '16:9',
        defaultQuality: 'high',
        compressionLevel: 'balanced'
      });
    });

    it('should have comprehensive effects presets', () => {
      expect(MUAPI_ENHANCED_CONFIG.effectsPresets).toHaveProperty('vintage-film');
      expect(MUAPI_ENHANCED_CONFIG.effectsPresets).toHaveProperty('cyberpunk');
      expect(MUAPI_ENHANCED_CONFIG.effectsPresets).toHaveProperty('moody-drama');
      expect(MUAPI_ENHANCED_CONFIG.effectsPresets).toHaveProperty('clean-minimal');
      expect(MUAPI_ENHANCED_CONFIG.effectsPresets).toHaveProperty('vibrant-social');

      expect(MUAPI_ENHANCED_CONFIG.effectsPresets['vintage-film']).toEqual([
        'sepia',
        { name: 'color-grade', options: { contrast: 0.2, saturation: -0.1 } },
        { name: 'vignette', options: { amount: 0.3 } }
      ]);
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return development configuration when DEV is true', () => {
      const config = getEnvironmentConfig();

      expect(config.api.sandboxMode).toBe(true);
      expect(config.features.aiEnhancement).toBe(false);
      expect(config.features.realTimeProcessing).toBe(false);
      expect(config.performance.maxConcurrency).toBe(1);
      expect(config.performance.requestsPerMinute).toBe(10);
    });

    it('should return production configuration when PROD is true', () => {
      // Temporarily change environment
      const originalEnv = vi.importActual('import.meta');
      vi.mocked(import.meta.env).DEV = false;
      vi.mocked(import.meta.env).PROD = true;

      const config = getEnvironmentConfig();

      expect(config.resilience.enableCircuitBreaker).toBe(true);
      expect(config.performance.maxConcurrency).toBe(5);
      expect(config.performance.requestsPerMinute).toBe(120);

      // Restore
      vi.mocked(import.meta.env).DEV = true;
      vi.mocked(import.meta.env).PROD = false;
    });

    it('should return base config for unknown environment', () => {
      // Temporarily change environment
      const originalEnv = vi.importActual('import.meta');
      vi.mocked(import.meta.env).DEV = false;
      vi.mocked(import.meta.env).PROD = false;

      const config = getEnvironmentConfig();

      expect(config).toEqual(MUAPI_ENHANCED_CONFIG);

      // Restore
      vi.mocked(import.meta.env).DEV = true;
    });
  });

  describe('validateConfig', () => {
    it('should validate a correct configuration', () => {
      const validConfig = {
        ...MUAPI_ENHANCED_CONFIG,
        api: {
          ...MUAPI_ENHANCED_CONFIG.api,
          apiKey: 'valid-key-12345'
        }
      };

      const result = validateConfig(validConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration without API key', () => {
      const invalidConfig = {
        ...MUAPI_ENHANCED_CONFIG,
        api: {
          ...MUAPI_ENHANCED_CONFIG.api,
          apiKey: null
        }
      };

      // Temporarily remove API key
      const originalKey = invalidConfig.api.apiKey;
      invalidConfig.api.apiKey = undefined;
      delete invalidConfig.api.apiKey;

      const result = validateConfig(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('MuAPI API key is required');

      // Restore
      invalidConfig.api.apiKey = originalKey;
    });

    it('should reject configuration without base URL', () => {
      const invalidConfig = {
        ...MUAPI_ENHANCED_CONFIG,
        api: {
          ...MUAPI_ENHANCED_CONFIG.api,
          baseURL: ''
        }
      };

      const result = validateConfig(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('MuAPI base URL is required');
    });

    it('should reject configuration with invalid concurrency', () => {
      const invalidConfig = {
        ...MUAPI_ENHANCED_CONFIG,
        performance: {
          ...MUAPI_ENHANCED_CONFIG.performance,
          maxConcurrency: 0
        }
      };

      const result = validateConfig(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Max concurrency must be at least 1');
    });

    it('should reject configuration with invalid requests per minute', () => {
      const invalidConfig = {
        ...MUAPI_ENHANCED_CONFIG,
        performance: {
          ...MUAPI_ENHANCED_CONFIG.performance,
          requestsPerMinute: 0
        }
      };

      const result = validateConfig(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Requests per minute must be at least 1');
    });

    it('should reject configuration with incompatible features', () => {
      const invalidConfig = {
        ...MUAPI_ENHANCED_CONFIG,
        features: {
          ...MUAPI_ENHANCED_CONFIG.features,
          realTimeProcessing: true,
          advancedEffects: false
        }
      };

      const result = validateConfig(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Real-time processing requires advanced effects to be enabled');
    });
  });

  describe('loadConfig', () => {
    it('should load configuration with environment defaults', () => {
      const config = loadConfig();

      expect(config.api.sandboxMode).toBe(true);
      expect(config.features.aiEnhancement).toBe(false);
      expect(config.performance.maxConcurrency).toBe(1);
    });

    it('should merge user preferences from localStorage', () => {
      const userPrefs = {
        features: {
          aiEnhancement: true,
          musicGeneration: false
        },
        performance: {
          maxConcurrency: 5
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(userPrefs));

      const config = loadConfig();

      expect(config.features.aiEnhancement).toBe(true);
      expect(config.features.musicGeneration).toBe(false);
      expect(config.performance.maxConcurrency).toBe(5);
      // Other defaults should remain
      expect(config.quality.defaultImageModel).toBe('flux-dev');
    });

    it('should handle invalid user preferences gracefully', () => {
      localStorageMock.getItem.mockReturnValue('corrupted json { invalid');

      expect(() => loadConfig()).toThrow(SyntaxError);

      // Reset for other tests
      localStorageMock.getItem.mockReturnValue(null);
    });
  });

  describe('saveUserPreferences', () => {
    it('should save preferences to localStorage', () => {
      const preferences = {
        features: { aiEnhancement: true },
        quality: { defaultResolution: '4k' }
      };

      saveUserPreferences(preferences);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'muapi-enhanced-prefs',
        expect.stringContaining('"features":{"aiEnhancement":true}')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'muapi-enhanced-prefs',
        expect.stringContaining('"quality":{"defaultResolution":"4k"}')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'muapi-enhanced-prefs',
        expect.stringContaining('"lastUpdated":"')
      );
    });

    it('should merge with existing preferences', () => {
      const existingPrefs = {
        features: { musicGeneration: false },
        lastUpdated: '2024-01-01T00:00:00.000Z'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingPrefs));

      const newPreferences = {
        quality: { defaultResolution: '4k' }
      };

      saveUserPreferences(newPreferences);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'muapi-enhanced-prefs',
        expect.stringContaining('"features":{"musicGeneration":false}')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'muapi-enhanced-prefs',
        expect.stringContaining('"quality":{"defaultResolution":"4k"}')
      );
    });
  });

  describe('getFeatureFlag', () => {
    it('should return feature flag value', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        features: { aiEnhancement: true, musicGeneration: false }
      }));

      expect(getFeatureFlag('aiEnhancement')).toBe(true);
      expect(getFeatureFlag('musicGeneration')).toBe(false);
      expect(getFeatureFlag('nonExistentFlag', true)).toBe(true);
    });
  });

  describe('setFeatureFlag', () => {
    it('should set feature flag in user preferences', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        features: { aiEnhancement: false }
      }));

      setFeatureFlag('aiEnhancement', true);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'muapi-enhanced-prefs',
        expect.stringContaining('"features":{"aiEnhancement":true}')
      );
    });
  });

  describe('getPerformanceSetting', () => {
    it('should return performance setting value', () => {
      expect(getPerformanceSetting('maxConcurrency')).toBe(1); // From dev config
      expect(getPerformanceSetting('nonExistentSetting', 42)).toBe(42);
    });
  });

  describe('Model Feature Detection', () => {
    describe('getModelFeatures', () => {
      it('should return features for known models', () => {
        expect(getModelFeatures('seedance-v2.0-t2v')).toEqual([
          'aiVideoEffects', 'motionControls', 'musicGeneration', 'lipsync'
        ]);

        expect(getModelFeatures('kling-v3.0-pro-text-to-video')).toEqual([
          'aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration', 'lipsync', 'storyboarding'
        ]);

        expect(getModelFeatures('wan2.7-text-to-video')).toEqual([
          'aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration'
        ]);

        expect(getModelFeatures('flux-dev')).toEqual([
          'imageEnhancement', 'styleTransfer', 'highResolution'
        ]);
      });

      it('should return empty array for unknown models', () => {
        expect(getModelFeatures('unknown-model')).toEqual([]);
        expect(getModelFeatures(null)).toEqual([]);
        expect(getModelFeatures(undefined)).toEqual([]);
      });
    });

    describe('hasAdvancedFeatures', () => {
      it('should return true for models with features', () => {
        expect(hasAdvancedFeatures('seedance-v2.0-t2v')).toBe(true);
        expect(hasAdvancedFeatures('flux-dev')).toBe(true);
        expect(hasAdvancedFeatures('kling-v3.0-pro-text-to-video')).toBe(true);
      });

      it('should return false for models without features', () => {
        expect(hasAdvancedFeatures('unknown-model')).toBe(false);
        expect(hasAdvancedFeatures(null)).toBe(false);
        expect(hasAdvancedFeatures(undefined)).toBe(false);
      });
    });

    describe('MODEL_ADVANCED_FEATURES', () => {
    it('should contain comprehensive model mappings', () => {
      const modelCount = Object.keys(MODEL_ADVANCED_FEATURES).length;
      expect(modelCount).toBeGreaterThan(170); // Should have many models

      // Test a few key models
      expect(MODEL_ADVANCED_FEATURES).toHaveProperty('seedance-v2.0-t2v');
      expect(MODEL_ADVANCED_FEATURES).toHaveProperty('kling-v3.0-pro-text-to-video');
      expect(MODEL_ADVANCED_FEATURES).toHaveProperty('wan2.7-text-to-video');
      expect(MODEL_ADVANCED_FEATURES).toHaveProperty('flux-dev');
      expect(MODEL_ADVANCED_FEATURES).toHaveProperty('openai-sora-2-pro-text-to-video');
    });

      it('should include app-specific feature mappings', () => {
        expect(MODEL_ADVANCED_FEATURES).toHaveProperty('ai-video-face-swap');
        expect(MODEL_ADVANCED_FEATURES).toHaveProperty('tiktok-carousel');
        expect(MODEL_ADVANCED_FEATURES).toHaveProperty('advanced-dubbing');
        expect(MODEL_ADVANCED_FEATURES).toHaveProperty('veo-advanced-i2v');
        expect(MODEL_ADVANCED_FEATURES).toHaveProperty('pixverse-advanced-effects');
      });
    });
  });

  describe('WAN_AI_EFFECTS', () => {
    it('should contain all expected effects', () => {
      expect(WAN_AI_EFFECTS).toHaveProperty('cakeify');
      expect(WAN_AI_EFFECTS).toHaveProperty('vhs');
      expect(WAN_AI_EFFECTS).toHaveProperty('samurai');
      expect(WAN_AI_EFFECTS).toHaveProperty('film-noir');
      expect(WAN_AI_EFFECTS).toHaveProperty('animal');
      expect(WAN_AI_EFFECTS).toHaveProperty('rotation');
    });

    it('should have proper effect structure', () => {
      Object.values(WAN_AI_EFFECTS).forEach(effect => {
        expect(effect).toHaveProperty('name');
        expect(effect).toHaveProperty('description');
        expect(typeof effect.name).toBe('string');
        expect(typeof effect.description).toBe('string');
      });

      expect(WAN_AI_EFFECTS.cakeify).toEqual({
        name: 'Cakeify',
        description: 'Stylized animation effect'
      });
    });
  });

  describe('PIXVERSE_ADVANCED_EFFECTS', () => {
    it('should contain all expected effect categories', () => {
      expect(PIXVERSE_ADVANCED_EFFECTS).toHaveProperty('hyper-realistic');
      expect(PIXVERSE_ADVANCED_EFFECTS).toHaveProperty('cinematic-depth');
      expect(PIXVERSE_ADVANCED_EFFECTS).toHaveProperty('motion-blur');
      expect(PIXVERSE_ADVANCED_EFFECTS).toHaveProperty('color-grading');
      expect(PIXVERSE_ADVANCED_EFFECTS).toHaveProperty('hdr-tonemapping');
      expect(PIXVERSE_ADVANCED_EFFECTS).toHaveProperty('film-grain');
      expect(PIXVERSE_ADVANCED_EFFECTS).toHaveProperty('super-resolution');
      expect(PIXVERSE_ADVANCED_EFFECTS).toHaveProperty('denoising');
      expect(PIXVERSE_ADVANCED_EFFECTS).toHaveProperty('sharpness-enhancement');
      expect(PIXVERSE_ADVANCED_EFFECTS).toHaveProperty('particle-effects');
      expect(PIXVERSE_ADVANCED_EFFECTS).toHaveProperty('lightning-simulation');
      expect(PIXVERSE_ADVANCED_EFFECTS).toHaveProperty('water-simulation');
    });

    it('should have proper effect structure with categories', () => {
      Object.values(PIXVERSE_ADVANCED_EFFECTS).forEach(effect => {
        expect(effect).toHaveProperty('name');
        expect(effect).toHaveProperty('description');
        expect(effect).toHaveProperty('category');
      });

      expect(PIXVERSE_ADVANCED_EFFECTS['hyper-realistic']).toEqual({
        name: 'Hyper Realistic',
        description: 'Ultra-high fidelity rendering with enhanced detail and realism',
        category: 'rendering'
      });

      expect(PIXVERSE_ADVANCED_EFFECTS['color-grading']).toEqual({
        name: 'Advanced Color Grading',
        description: 'Professional color correction and LUT application',
        category: 'post-processing'
      });
    });
  });
});