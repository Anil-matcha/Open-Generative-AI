import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  generateTikTokCarousel,
  uploadCarouselMusic,
  generateCarouselPreview,
  initializeEnhancedMuAPI
} from '../../src/lib/muapiEnhanced.js';
import {
  loadConfig,
  validateConfig,
  getFeatureFlag,
  setFeatureFlag,
  getModelFeatures,
  hasAdvancedFeatures
} from '../../src/lib/muapiConfig.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

describe('MuAPI Enhanced Features Edge Cases and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-api-key-12345');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Configuration Edge Cases', () => {
    it('should handle missing environment variables', () => {
      // Mock missing environment variables
      vi.mocked(import.meta.env).VITE_MUAPI_URL = undefined;
      vi.mocked(import.meta.env).MUAPI_API_KEY = undefined;

      const config = loadConfig();

      // Should still load with defaults
      expect(config.api.baseURL).toBe('https://muapi.ai/api/v1');
      expect(config.api.apiKey).toBeUndefined();

      // Restore
      vi.mocked(import.meta.env).VITE_MUAPI_URL = 'https://test.muapi.ai/api/v1';
      vi.mocked(import.meta.env).MUAPI_API_KEY = 'test-env-key';
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('corrupted json { invalid');

      const config = loadConfig();

      // Should load default config despite corruption
      expect(config).toHaveProperty('api');
      expect(config).toHaveProperty('features');
    });

    it('should handle extremely large user preferences', () => {
      const largePrefs = {
        features: {},
        performance: {},
        quality: {}
      };

      // Add many properties to simulate large config
      for (let i = 0; i < 1000; i++) {
        largePrefs.features[`feature${i}`] = Math.random() > 0.5;
        largePrefs.performance[`setting${i}`] = Math.floor(Math.random() * 100);
        largePrefs.quality[`quality${i}`] = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(largePrefs));

      const config = loadConfig();

      // Should handle large configs without issues
      expect(config).toHaveProperty('features');
      expect(Object.keys(config.features || {})).toHaveLength(1000);
    });

    it('should handle feature flag conflicts', () => {
      // Set conflicting flags in localStorage
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        features: {
          aiEnhancement: true, // User enabled
          realTimeProcessing: true // But this requires advancedEffects
        }
      }));

      const config = loadConfig();

      // Should merge but validation should catch conflicts
      const validation = validateConfig(config);
      expect(validation.valid).toBe(false); // Due to missing advancedEffects
    });

    it('should handle unknown feature flags gracefully', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        features: {
          unknownFeature: true,
          anotherUnknown: false
        }
      }));

      const flag1 = getFeatureFlag('unknownFeature', false);
      const flag2 = getFeatureFlag('anotherUnknown', true);

      expect(flag1).toBe(true); // From user prefs
      expect(flag2).toBe(false); // From user prefs (overriding default)
    });
  });

  describe('TikTok Carousel Edge Cases', () => {
    const mockImageUrls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg'
    ];

    it('should handle extremely long URLs', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000) + '.jpg';
      const longUrls = [longUrl, longUrl, longUrl];

      const mockSubmitResponse = { data: { request_id: 'long-url-carousel-123' } };
      const mockResultResponse = {
        data: {
          status: 'completed',
          outputs: ['https://example.com/result.mp4']
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSubmitResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResultResponse)
        });

      const result = await generateTikTokCarousel(longUrls);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(longUrl.substring(0, 100)) // Should contain start of URL
        })
      );
    });

    it('should handle special characters in image URLs', async () => {
      const specialUrls = [
        'https://example.com/image with spaces.jpg',
        'https://example.com/image+plus.jpg',
        'https://example.com/image%20encoded.jpg',
        'https://example.com/имя.jpg', // Unicode
        'https://example.com/image#fragment.jpg'
      ];

      const mockSubmitResponse = { data: { request_id: 'special-chars-carousel-123' } };
      const mockResultResponse = {
        data: {
          status: 'completed',
          outputs: ['https://example.com/result.mp4']
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSubmitResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResultResponse)
        });

      const result = await generateTikTokCarousel(specialUrls);

      expect(result.success).toBe(true);
      // Should handle URL encoding properly
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle empty or whitespace-only options', async () => {
      const optionsWithWhitespace = {
        layout: '   ', // Whitespace
        transitions: '', // Empty
        musicUrl: null,
        timings: [] // Empty array
      };

      const mockSubmitResponse = { data: { request_id: 'whitespace-carousel-123' } };
      const mockResultResponse = {
        data: {
          status: 'completed',
          outputs: ['https://example.com/result.mp4']
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSubmitResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResultResponse)
        });

      const result = await generateTikTokCarousel(mockImageUrls, optionsWithWhitespace);

      expect(result.success).toBe(true);
      // Should use defaults for empty/whitespace values
      expect(global.fetch).toHaveBeenNthCalledWith(1, expect.any(String), expect.objectContaining({
        body: expect.stringContaining('"layout":"horizontal"') // Default used
      }));
    });

    it('should handle extremely large timing arrays', async () => {
      const largeTimings = Array.from({ length: 1000 }, () => Math.random() * 10);

      const mockSubmitResponse = { data: { request_id: 'large-timings-carousel-123' } };
      const mockResultResponse = {
        data: {
          status: 'completed',
          outputs: ['https://example.com/result.mp4']
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSubmitResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResultResponse)
        });

      const result = await generateTikTokCarousel(mockImageUrls, {
        timings: largeTimings.slice(0, 10) // Should only use first 10
      });

      expect(result.success).toBe(true);
    });

    it('should handle network interruptions during polling', async () => {
      const mockSubmitResponse = { data: { request_id: 'interrupt-carousel-123' } };

      // Simulate network interruptions during polling
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSubmitResponse)
          });
        } else {
          // Simulate network errors during polling
          return Promise.reject(new Error('Network interrupted'));
        }
      });

      const result = await generateTikTokCarousel(mockImageUrls);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Carousel generation timeout');
    });

    it('should handle invalid JSON responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const result = await generateTikTokCarousel(mockImageUrls);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Carousel generation failed');
    });

    it('should handle extremely slow responses', async () => {
      const mockSubmitResponse = { data: { request_id: 'slow-carousel-123' } };
      const mockResultResponse = {
        data: {
          status: 'completed',
          outputs: ['https://example.com/result.mp4']
        }
      };

      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        return new Promise(resolve => {
          setTimeout(() => {
            if (callCount === 1) {
              resolve({
                ok: true,
                json: () => Promise.resolve(mockSubmitResponse)
              });
            } else {
              resolve({
                ok: true,
                json: () => Promise.resolve(mockResultResponse)
              });
            }
          }, 1000); // 1 second delay
        });
      });

      const startTime = Date.now();
      const result = await generateTikTokCarousel(mockImageUrls);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeGreaterThan(1000); // Should have waited
    });
  });

  describe('Music Upload Edge Cases', () => {
    it('should handle extremely large files', async () => {
      // Mock a 500MB file
      const largeFile = new File(['x'.repeat(500 * 1024 * 1024)], 'large-music.mp3', {
        type: 'audio/mpeg'
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          url: 'https://example.com/uploaded-large.mp3',
          duration: 3600,
          format: 'mp3'
        })
      });

      const result = await uploadCarouselMusic(largeFile);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/uploaded-large.mp3');
      expect(result.duration).toBe(3600);
    });

    it('should handle files with special characters in names', async () => {
      const specialFile = new File(['music data'], 'música español ñ.mp3', {
        type: 'audio/mpeg'
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          url: 'https://example.com/uploaded-special.mp3',
          duration: 120,
          format: 'mp3'
        })
      });

      const result = await uploadCarouselMusic(specialFile);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/uploaded-special.mp3');
    });

    it('should handle zero-byte files', async () => {
      const emptyFile = new File([], 'empty.mp3', { type: 'audio/mpeg' });

      await expect(uploadCarouselMusic(emptyFile))
        .rejects.toThrow('Valid audio file required');
    });

    it('should handle files without mime types', async () => {
      const noMimeFile = new File(['music data'], 'music.mp3');

      await expect(uploadCarouselMusic(noMimeFile))
        .rejects.toThrow('Valid audio file required');
    });
  });

  describe('Preview Generation Edge Cases', () => {
    it('should handle malformed image URLs', async () => {
      const malformedUrls = [
        'not-a-url',
        'ftp://example.com/image.jpg',
        '://missing-protocol',
        '',
        null,
        undefined
      ];

      // Should filter out malformed URLs
      const result = await generateCarouselPreview(malformedUrls);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No images provided');
    });

    it('should handle mixed valid and invalid URLs', async () => {
      const mixedUrls = [
        'https://example.com/valid1.jpg',
        'invalid-url',
        'https://example.com/valid2.jpg',
        '',
        'https://example.com/valid3.jpg'
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          thumbnail_url: 'https://example.com/preview.jpg'
        })
      });

      const result = await generateCarouselPreview(mixedUrls);

      expect(result.success).toBe(true);
      // Should still work with valid URLs
      expect(result.thumbnailUrl).toBe('https://example.com/preview.jpg');
    });

    it('should handle extremely small images', async () => {
      const tinyUrls = ['https://example.com/tiny.jpg'];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          thumbnail_url: 'https://example.com/tiny-preview.jpg'
        })
      });

      const result = await generateCarouselPreview(tinyUrls, {
        width: 1,
        height: 1
      });

      expect(result.success).toBe(true);
      expect(result.thumbnailUrl).toBe('https://example.com/tiny-preview.jpg');
    });
  });

  describe('Model Feature Detection Edge Cases', () => {
    it('should handle unknown model variations', () => {
      const unknownModels = [
        'unknown-model',
        'seedance-v2.0-t2v-turbo',
        'kling-v4.0-pro',
        'wan3.0-text-to-video',
        null,
        undefined,
        '',
        'model-with-dashes-and-numbers-123-v2'
      ];

      unknownModels.forEach(model => {
        const features = getModelFeatures(model);
        expect(features).toEqual([]);
        expect(hasAdvancedFeatures(model)).toBe(false);
      });
    });

    it('should handle case-sensitive model names', () => {
      expect(getModelFeatures('SEEDANCE-V2.0-T2V')).toEqual([]);
      expect(getModelFeatures('Seedance-v2.0-t2v')).toEqual([]);

      // Only exact match should work
      expect(getModelFeatures('seedance-v2.0-t2v')).toEqual([
        'aiVideoEffects', 'motionControls', 'musicGeneration', 'lipsync'
      ]);
    });

    it('should handle models with similar names', () => {
      const similarModels = [
        'seedance-v2.0-t2v',
        'seedance-v2.0-i2v',
        'seedance-v2.0-extend'
      ];

      const expectedFeatures = [
        ['aiVideoEffects', 'motionControls', 'musicGeneration', 'lipsync'],
        ['aiVideoEffects', 'motionControls', 'vfx', 'musicGeneration', 'lipsync'],
        ['aiVideoEffects', 'motionControls', 'musicGeneration', 'lipsync']
      ];

      similarModels.forEach((model, index) => {
        expect(getModelFeatures(model)).toEqual(expectedFeatures[index]);
      });
    });

    it('should handle models with special characters', () => {
      const specialModels = [
        'model_with_underscores',
        'model-with-dashes',
        'model.with.dots',
        'model+v2.1',
        'model%20with%20spaces'
      ];

      specialModels.forEach(model => {
        const features = getModelFeatures(model);
        expect(Array.isArray(features)).toBe(true);
      });
    });
  });

  describe('Initialization Edge Cases', () => {
    it('should handle initialization with malformed config', async () => {
      const malformedConfigs = [
        null,
        undefined,
        'not-an-object',
        123,
        [],
        { api: null },
        { features: 'not-an-object' },
        { performance: { maxConcurrency: 'not-a-number' } }
      ];

      for (const config of malformedConfigs) {
        const result = await initializeEnhancedMuAPI(config);
        expect(result).toBe(true); // Should handle gracefully
      }
    });

    it('should handle extremely nested configuration objects', async () => {
      const deepConfig = {
        deeply: {
          nested: {
            config: {
              with: {
                many: {
                  levels: {
                    of: {
                      nesting: {
                        value: 'test'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const result = await initializeEnhancedMuAPI(deepConfig);
      expect(result).toBe(true);
    });

    it('should handle circular references in config', async () => {
      const circularConfig = { self: null };
      circularConfig.self = circularConfig;

      // Should handle without infinite recursion
      const result = await initializeEnhancedMuAPI(circularConfig);
      expect(result).toBe(true);
    });

    it('should handle initialization during network outages', async () => {
      // Mock network issues
      const originalFetch = global.fetch;
      global.fetch = vi.fn(() => Promise.reject(new Error('Network completely down')));

      const result = await initializeEnhancedMuAPI({
        api: { baseURL: 'https://unreachable.api' }
      });

      expect(result).toBe(true); // Should still succeed as enhanced features are stubbed

      global.fetch = originalFetch;
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle extremely high concurrency settings', () => {
      const highConcurrencyConfig = {
        performance: {
          maxConcurrency: 1000,
          requestsPerMinute: 10000
        }
      };

      const validation = validateConfig(highConcurrencyConfig);
      expect(validation.valid).toBe(true); // Should allow high values
    });

    it('should handle zero or negative performance settings', () => {
      const invalidPerformanceConfig = {
        performance: {
          maxConcurrency: 0,
          requestsPerMinute: -1,
          memoryLimit: -1000
        }
      };

      const validation = validateConfig(invalidPerformanceConfig);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Max concurrency must be at least 1');
      expect(validation.errors).toContain('Requests per minute must be at least 1');
    });

    it('should handle extremely large memory limits', () => {
      const largeMemoryConfig = {
        performance: {
          memoryLimit: 1000 * 1024 * 1024 * 1024 // 1TB
        }
      };

      const validation = validateConfig(largeMemoryConfig);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Feature Flag Edge Cases', () => {
    it('should handle rapid feature flag changes', () => {
      // Rapidly change flags
      for (let i = 0; i < 100; i++) {
        setFeatureFlag('aiEnhancement', i % 2 === 0);
        expect(getFeatureFlag('aiEnhancement')).toBe(i % 2 === 0);
      }
    });

    it('should handle feature flags with special values', () => {
      const specialValues = [
        null,
        undefined,
        0,
        1,
        '',
        'false',
        'true',
        [],
        {},
        NaN
      ];

      specialValues.forEach(value => {
        setFeatureFlag('testFlag', value);
        expect(getFeatureFlag('testFlag')).toBe(value);
      });
    });

    it('should handle feature flag name collisions', () => {
      // Set multiple flags with similar names
      setFeatureFlag('feature', true);
      setFeatureFlag('feature1', false);
      setFeatureFlag('featureTest', true);

      expect(getFeatureFlag('feature')).toBe(true);
      expect(getFeatureFlag('feature1')).toBe(false);
      expect(getFeatureFlag('featureTest')).toBe(true);
    });
  });

  describe('Integration Edge Cases', () => {
    it('should handle mixed valid and invalid operations', async () => {
      // Mix of operations that should succeed and fail
      const operations = [
        () => generateTikTokCarousel([]), // Should fail - no images
        () => uploadCarouselMusic(new File([''], 'empty.mp3', { type: 'audio/mpeg' })), // Should fail - empty file
        () => generateCarouselPreview(['invalid-url']), // Should work but filter invalid
        () => initializeEnhancedMuAPI({}), // Should succeed
        () => getModelFeatures('seedance-v2.0-t2v'), // Should succeed
        () => hasAdvancedFeatures('unknown-model') // Should succeed with false
      ];

      const results = await Promise.allSettled(operations.map(op => op()));

      expect(results[0].status).toBe('rejected'); // No images
      expect(results[1].status).toBe('rejected'); // Empty file
      expect(results[2].status).toBe('fulfilled'); // Preview with invalid URL
      expect(results[3].status).toBe('fulfilled'); // Initialization
      expect(results[4].status).toBe('fulfilled'); // Model features
      expect(results[5].status).toBe('fulfilled'); // Has features check
    });

    it('should handle memory pressure scenarios', async () => {
      // Simulate memory pressure by creating many large objects
      const largeObjects = Array.from({ length: 1000 }, () => ({
        data: 'x'.repeat(10000), // 10KB each
        metadata: {
          nested: {
            deeply: {
              nested: 'value'
            }
          }
        }
      }));

      // Should still handle configuration operations
      const config = loadConfig();
      expect(config).toHaveProperty('api');

      // Should still handle feature operations
      const features = getModelFeatures('kling-v3.0-pro-text-to-video');
      expect(features).toHaveLength(6);

      // Clean up
      largeObjects.length = 0;
    });

    it('should handle extremely long operation chains', async () => {
      // Chain many operations together
      let result = 'initial';

      for (let i = 0; i < 100; i++) {
        result = await initializeEnhancedMuAPI({ step: i });
        expect(result).toBe(true);

        const features = getModelFeatures('seedance-v2.0-t2v');
        expect(features).toHaveLength(4);

        const flag = getFeatureFlag('aiEnhancement', false);
        expect(typeof flag).toBe('boolean');
      }

      expect(result).toBe(true);
    });
  });
});