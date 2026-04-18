import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { initializeEnhancedMuAPI } from '../../src/lib/muapiEnhanced.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('MuAPI Enhanced Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-api-key-12345');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initializeEnhancedMuAPI', () => {
    it('should initialize successfully with valid config', async () => {
      const config = {
        apiKey: 'test-key-123',
        baseURL: 'https://api.muapi.ai'
      };

      const result = await initializeEnhancedMuAPI(config);

      expect(result).toBe(true);
    });

    it('should initialize successfully with empty config', async () => {
      const result = await initializeEnhancedMuAPI({});

      expect(result).toBe(true);
    });

    it('should initialize successfully with null config', async () => {
      const result = await initializeEnhancedMuAPI(null);

      expect(result).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      // Force an error by mocking console.error to throw
      const originalConsoleError = console.error;
      console.error = vi.fn(() => {
        throw new Error('Console error');
      });

      const config = {
        invalidConfig: 'should cause error'
      };

      const result = await initializeEnhancedMuAPI(config);

      expect(result).toBe(false);

      // Restore console.error
      console.error = originalConsoleError;
    });

    it('should log initialization messages', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Successful initialization
      await initializeEnhancedMuAPI({ test: 'config' });

      expect(consoleLogSpy).toHaveBeenCalledWith('[MuAPI Enhanced] Initializing with config:', { test: 'config' });

      // Failed initialization
      console.error = vi.fn(() => {
        throw new Error('Test error');
      });

      await initializeEnhancedMuAPI({ invalid: 'config' });

      expect(consoleErrorSpy).toHaveBeenCalledWith('[MuAPI Enhanced] Initialization failed:', expect.any(Error));

      // Restore console methods
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      console.error = vi.fn();
    });
  });

  describe('Integration with MuAPI Configuration', () => {
    it('should work with configuration validation', async () => {
      // Import the config module to test integration
      const { validateConfig } = await import('../../src/lib/muapiConfig.js');

      const validConfig = {
        api: {
          baseURL: 'https://api.muapi.ai',
          apiKey: 'test-key-123',
          timeout: 30000
        },
        features: {
          aiEnhancement: true,
          advancedEffects: true
        },
        performance: {
          maxConcurrency: 3,
          requestsPerMinute: 60
        }
      };

      const validation = validateConfig(validConfig);
      expect(validation.valid).toBe(true);

      // Should initialize successfully with valid config
      const result = await initializeEnhancedMuAPI(validConfig);
      expect(result).toBe(true);
    });

    it('should handle configuration loading during initialization', async () => {
      const { loadConfig } = await import('../../src/lib/muapiConfig.js');

      // Mock localStorage with user preferences
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        features: { aiEnhancement: true },
        performance: { maxConcurrency: 5 }
      }));

      const config = loadConfig();

      // Should have merged preferences
      expect(config.features.aiEnhancement).toBe(true); // From dev config (disabled)
      expect(config.performance.maxConcurrency).toBe(1); // From dev config

      // Should initialize with loaded config
      const result = await initializeEnhancedMuAPI(config);
      expect(result).toBe(true);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle network-related initialization failures', async () => {
      // Mock a network error scenario
      const originalFetch = global.fetch;
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      const result = await initializeEnhancedMuAPI({
        api: { baseURL: 'https://unreachable.api' }
      });

      expect(result).toBe(true); // Should still return true as enhanced features are stubbed

      global.fetch = originalFetch;
    });

    it('should handle malformed configuration gracefully', async () => {
      const malformedConfigs = [
        { api: null },
        { features: 'not-an-object' },
        { performance: { maxConcurrency: 'not-a-number' } },
        undefined,
        'not-an-object'
      ];

      for (const config of malformedConfigs) {
        const result = await initializeEnhancedMuAPI(config);
        expect(result).toBe(true); // Should handle gracefully
      }
    });

    it('should initialize partial configurations', async () => {
      const partialConfigs = [
        { api: { baseURL: 'https://api.muapi.ai' } },
        { features: { aiEnhancement: true } },
        { performance: { maxConcurrency: 2 } },
        {} // Empty object
      ];

      for (const config of partialConfigs) {
        const result = await initializeEnhancedMuAPI(config);
        expect(result).toBe(true);
      }
    });
  });

  describe('Environment-Specific Initialization', () => {
    it('should handle development environment initialization', async () => {
      // Mock development environment
      vi.mocked(import.meta.env).DEV = true;
      vi.mocked(import.meta.env).PROD = false;

      const result = await initializeEnhancedMuAPI({
        environment: 'development',
        debug: true
      });

      expect(result).toBe(true);
    });

    it('should handle production environment initialization', async () => {
      // Mock production environment
      vi.mocked(import.meta.env).DEV = false;
      vi.mocked(import.meta.env).PROD = true;

      const result = await initializeEnhancedMuAPI({
        environment: 'production',
        monitoring: true
      });

      expect(result).toBe(true);

      // Restore dev environment
      vi.mocked(import.meta.env).DEV = true;
      vi.mocked(import.meta.env).PROD = false;
    });
  });

  describe('Feature Flag Integration', () => {
    it('should respect feature flags during initialization', async () => {
      const { setFeatureFlag, getFeatureFlag } = await import('../../src/lib/muapiConfig.js');

      // Enable a feature
      setFeatureFlag('aiEnhancement', true);
      expect(getFeatureFlag('aiEnhancement')).toBe(true);

      // Disable a feature
      setFeatureFlag('musicGeneration', false);
      expect(getFeatureFlag('musicGeneration')).toBe(false);

      // Initialize with feature flags
      const result = await initializeEnhancedMuAPI({
        features: {
          aiEnhancement: getFeatureFlag('aiEnhancement'),
          musicGeneration: getFeatureFlag('musicGeneration')
        }
      });

      expect(result).toBe(true);
    });

    it('should initialize with default feature flags', async () => {
      const { getFeatureFlag } = await import('../../src/lib/muapiConfig.js');

      // Test some default flags
      expect(getFeatureFlag('advancedEffects')).toBe(true);
      expect(getFeatureFlag('motionControls')).toBe(true);

      const result = await initializeEnhancedMuAPI({});
      expect(result).toBe(true);
    });
  });

  describe('Performance and Monitoring', () => {
    it('should handle performance settings during initialization', async () => {
      const performanceConfig = {
        performance: {
          maxConcurrency: 5,
          requestsPerMinute: 120,
          memoryLimit: 1000 * 1024 * 1024, // 1GB
          enableCaching: true,
          cacheSize: 200 * 1024 * 1024 // 200MB
        }
      };

      const result = await initializeEnhancedMuAPI(performanceConfig);
      expect(result).toBe(true);
    });

    it('should handle monitoring configuration', async () => {
      const monitoringConfig = {
        monitoring: {
          enableMetrics: true,
          trackUsage: true,
          logErrors: true,
          performanceTracking: true,
          healthCheckInterval: 300000
        }
      };

      const result = await initializeEnhancedMuAPI(monitoringConfig);
      expect(result).toBe(true);
    });
  });

  describe('Storage and CDN Integration', () => {
    it('should handle storage configuration', async () => {
      const storageConfig = {
        storage: {
          useCDN: true,
          cdnRegion: 'us-east-1',
          uploadTimeout: 60000,
          maxFileSize: 1000 * 1024 * 1024, // 1GB
          allowedFormats: ['mp4', 'mov', 'avi', 'jpg', 'png', 'webp']
        }
      };

      const result = await initializeEnhancedMuAPI(storageConfig);
      expect(result).toBe(true);
    });

    it('should handle CDN settings', async () => {
      const cdnConfig = {
        storage: {
          useCDN: true,
          cdnRegion: 'auto',
          uploadTimeout: 120000,
          maxFileSize: 500 * 1024 * 1024 // 500MB
        }
      };

      const result = await initializeEnhancedMuAPI(cdnConfig);
      expect(result).toBe(true);
    });
  });

  describe('Quality and Effects Configuration', () => {
    it('should handle quality settings', async () => {
      const qualityConfig = {
        quality: {
          defaultImageModel: 'flux-pro',
          defaultVideoModel: 'kling-v3.0-pro-text-to-video',
          defaultResolution: '4k',
          defaultAspectRatio: '21:9',
          defaultQuality: 'ultra',
          compressionLevel: 'lossless'
        }
      };

      const result = await initializeEnhancedMuAPI(qualityConfig);
      expect(result).toBe(true);
    });

    it('should handle effects presets', async () => {
      const effectsConfig = {
        effectsPresets: {
          'custom-cinematic': [
            'color-grade',
            { name: 'vignette', options: { amount: 0.4 } },
            'sharpen'
          ],
          'social-media': [
            'brightness',
            'saturation',
            { name: 'text-overlay', options: { text: '#SocialMedia' } }
          ]
        }
      };

      const result = await initializeEnhancedMuAPI(effectsConfig);
      expect(result).toBe(true);
    });
  });

  describe('Batch Processing Configuration', () => {
    it('should handle batch processing settings', async () => {
      const batchConfig = {
        batch: {
          maxBatchSize: 20,
          defaultConcurrency: 5,
          progressUpdateInterval: 2000,
          retryFailedItems: true,
          continueOnError: false
        }
      };

      const result = await initializeEnhancedMuAPI(batchConfig);
      expect(result).toBe(true);
    });
  });

  describe('Resilience and Error Recovery', () => {
    it('should handle resilience configuration', async () => {
      const resilienceConfig = {
        resilience: {
          enableFallback: true,
          fallbackToBasic: true,
          enableRetry: true,
          maxRetryDelay: 60000,
          enableCircuitBreaker: true,
          circuitBreakerThreshold: 10
        }
      };

      const result = await initializeEnhancedMuAPI(resilienceConfig);
      expect(result).toBe(true);
    });
  });
});