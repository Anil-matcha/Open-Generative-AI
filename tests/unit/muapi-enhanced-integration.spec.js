import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MuapiEnhancedClient, muapiEnhanced } from '../../src/lib/muapiEnhanced.js';
import { loadConfig, validateConfig, getFeatureFlag } from '../../src/lib/muapiConfig.js';

// Mock the underlying muapi module
vi.mock('../../src/lib/muapi.js', () => ({
  muapi: {
    makeRequest: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch for carousel functionality
global.fetch = vi.fn();

import { muapi } from '../../src/lib/muapi.js';

describe('MuAPI Enhanced Features Integration Tests', () => {
  let client;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-api-key-12345');
    client = new MuapiEnhancedClient();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Complete Video Production Workflow', () => {
    it('should execute a complete video translation and dubbing workflow', async () => {
      const videoUrl = 'https://example.com/source-video.mp4';
      const sourceLang = 'en';
      const targetLang = 'es';

      // Mock all API calls in sequence
      muapi.makeRequest
        .mockResolvedValueOnce({ language: 'en' }) // detectLanguage
        .mockResolvedValueOnce({ translated_url: 'https://example.com/translated.mp4' }) // translateVideo
        .mockResolvedValueOnce({ dubbed_url: 'https://example.com/dubbed.mp4' }) // dubVideo
        .mockResolvedValueOnce({ voice_id: 'cloned-voice-123' }) // cloneVoice
        .mockResolvedValueOnce({ preview_url: 'https://example.com/preview.wav' }) // generatePreviewAudio
        .mockResolvedValueOnce({ sync_quality: 0.95 }) // analyzeLipSync
        .mockResolvedValueOnce({ processed_url: 'https://example.com/final.mp4' }); // applyPixverseAdvancedEffect

      // Step 1: Detect language
      const detectedLang = await client.detectLanguage(videoUrl);
      expect(detectedLang).toBe('en');

      // Step 2: Translate video
      const translated = await client.translateVideo(videoUrl, sourceLang, targetLang, {
        preserveTone: true,
        quality: 'high'
      });
      expect(translated.translated_url).toBe('https://example.com/translated.mp4');

      // Step 3: Clone voice for dubbing
      const clonedVoice = await client.cloneVoice('https://example.com/reference.wav', 'Actor Voice');
      expect(clonedVoice.voice_id).toBe('cloned-voice-123');

      // Step 4: Get available voices
      muapi.makeRequest.mockResolvedValueOnce({ voices: [
        { id: 'voice-1', name: 'Spanish Male', gender: 'male' },
        { id: 'voice-2', name: 'Spanish Female', gender: 'female' }
      ] });
      const voices = await client.getAvailableVoices('es');
      expect(voices).toHaveLength(2);

      // Step 5: Generate preview audio
      const preview = await client.generatePreviewAudio('Hola mundo', 'voice-1', 'es');
      expect(preview.preview_url).toBe('https://example.com/preview.wav');

      // Step 6: Dub the video
      const dubbed = await client.dubVideo(videoUrl, sourceLang, targetLang, {
        clone: true,
        voiceId: 'cloned-voice-123',
        style: 'natural',
        lipSyncQuality: 'high'
      });
      expect(dubbed.dubbed_url).toBe('https://example.com/dubbed.mp4');

      // Step 7: Analyze lip sync quality
      const lipSyncAnalysis = await client.analyzeLipSync(videoUrl, 'https://example.com/audio.wav');
      expect(lipSyncAnalysis.sync_quality).toBe(0.95);

      // Step 8: Apply advanced effects
      const finalVideo = await client.applyPixverseAdvancedEffect(videoUrl, 'cinematic-depth', {
        intensity: 7,
        style: 'cinematic'
      });
      expect(finalVideo.processed_url).toBe('https://example.com/final.mp4');

      // Verify all API calls were made
      expect(muapi.makeRequest).toHaveBeenCalledTimes(8);
    });

    it('should handle workflow failures gracefully', async () => {
      const videoUrl = 'https://example.com/video.mp4';

      // Mock API failure
      muapi.makeRequest.mockRejectedValueOnce(new Error('Language detection failed'));

      // Should fallback to default language
      const detectedLang = await client.detectLanguage(videoUrl);
      expect(detectedLang).toBe('en');

      // Subsequent operations should still work
      muapi.makeRequest.mockResolvedValueOnce({ translated_url: 'translated.mp4' });
      const translated = await client.translateVideo(videoUrl, 'en', 'es');
      expect(translated.translated_url).toBe('translated.mp4');
    });
  });

  describe('Configuration Integration', () => {
    it('should respect feature flags in operations', async () => {
      // Mock config with disabled features
      const mockConfig = {
        features: {
          aiEnhancement: false,
          advancedEffects: false
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockConfig));

      const config = loadConfig();
      expect(config.features.aiEnhancement).toBe(false);

      // Operations should still work but may have different behavior
      muapi.makeRequest.mockResolvedValue({ translated_url: 'result.mp4' });
      const result = await client.translateVideo('video.mp4', 'en', 'es');
      expect(result.translated_url).toBe('result.mp4');
    });

    it('should validate configuration before operations', () => {
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

      // Should be able to perform operations with valid config
      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        api: {
          baseURL: '', // Invalid
          apiKey: '' // Invalid
        },
        performance: {
          maxConcurrency: 0 // Invalid
        }
      };

      const validation = validateConfig(invalidConfig);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('MuAPI base URL is required');
      expect(validation.errors).toContain('Max concurrency must be at least 1');
    });
  });

  describe('Advanced Effects Pipeline', () => {
    it('should execute complex effects pipeline', async () => {
      const videoUrl = 'https://example.com/video.mp4';

      // Mock all effects calls
      muapi.makeRequest
        .mockResolvedValueOnce({ processed_url: 'https://example.com/step1.mp4' }) // Pixverse
        .mockResolvedValueOnce({ video_url: 'https://example.com/step2.mp4' }) // Veo
        .mockResolvedValueOnce({ processed_url: 'https://example.com/final.mp4' }); // Runway

      // Step 1: Apply Pixverse cinematic effect
      const step1 = await client.applyPixverseAdvancedEffect(videoUrl, 'cinematic-depth', {
        intensity: 8,
        style: 'cinematic'
      });
      expect(step1.processed_url).toBe('https://example.com/step1.mp4');

      // Step 2: Apply Veo image-to-video (using video as source for effect)
      const step2 = await client.applyVeoAdvancedI2V(step1.processed_url, {
        prompt: 'Add dynamic camera movement',
        motionStrength: 7,
        cameraMovement: 'pan-left'
      });
      expect(step2.video_url).toBe('https://example.com/step2.mp4');

      // Step 3: Apply Runway motion control
      const final = await client.applyRunwayMotion(step2.video_url, {
        type: 'zoom',
        direction: 'in',
        speed: 6,
        stabilization: true
      });
      expect(final.processed_url).toBe('https://example.com/final.mp4');

      expect(muapi.makeRequest).toHaveBeenCalledTimes(3);
    });

    it('should handle effects pipeline errors', async () => {
      const videoUrl = 'https://example.com/video.mp4';

      // First effect succeeds, second fails, third succeeds
      muapi.makeRequest
        .mockResolvedValueOnce({ processed_url: 'step1.mp4' })
        .mockRejectedValueOnce(new Error('Veo processing failed'))
        .mockResolvedValueOnce({ processed_url: 'step3.mp4' });

      // First step should succeed
      const step1 = await client.applyPixverseAdvancedEffect(videoUrl, 'effect');
      expect(step1.processed_url).toBe('step1.mp4');

      // Second step should fail
      await expect(client.applyVeoAdvancedI2V('step1.mp4')).rejects.toThrow('Veo processing failed');

      // Third step should still work with original video
      const step3 = await client.applyRunwayMotion(videoUrl);
      expect(step3.processed_url).toBe('step3.mp4');
    });
  });

  describe('Multi-Language Content Production', () => {
    it('should handle multi-language dubbing workflow', async () => {
      const sourceVideo = 'https://example.com/source.mp4';
      const languages = [
        { code: 'es', name: 'Spanish', voice: 'es-voice-1' },
        { code: 'fr', name: 'French', voice: 'fr-voice-1' },
        { code: 'de', name: 'German', voice: 'de-voice-1' }
      ];

      // Mock voice fetching and dubbing for each language
      let callCount = 0;
      muapi.makeRequest.mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          // Voice fetching calls
          return Promise.resolve({
            voices: [{ id: `${languages[callCount - 1].code}-voice-1`, name: `Voice ${callCount}` }]
          });
        } else {
          // Dubbing calls
          const langIndex = callCount - 4;
          return Promise.resolve({
            dubbed_url: `https://example.com/${languages[langIndex].code}-dubbed.mp4`
          });
        }
      });

      const dubbedVersions = [];

      for (const lang of languages) {
        // Get voices for language
        const voices = await client.getAvailableVoices(lang.code);
        expect(voices).toHaveLength(1);
        expect(voices[0].id).toBe(`${lang.code}-voice-1`);

        // Dub video
        const dubbed = await client.dubVideo(sourceVideo, 'en', lang.code, {
          voiceId: voices[0].id,
          style: 'natural'
        });
        expect(dubbed.dubbed_url).toContain(`${lang.code}-dubbed.mp4`);

        dubbedVersions.push({
          language: lang.code,
          video: dubbed.dubbed_url
        });
      }

      expect(dubbedVersions).toHaveLength(3);
      expect(muapi.makeRequest).toHaveBeenCalledTimes(6); // 3 voice fetches + 3 dubbing calls
    });

    it('should handle language detection and translation chain', async () => {
      const videoUrl = 'https://example.com/video.mp4';
      const targetLanguages = ['es', 'fr', 'de'];

      // Mock language detection
      muapi.makeRequest.mockResolvedValueOnce({ language: 'en' });

      // Mock translation calls
      let translationCount = 0;
      muapi.makeRequest.mockImplementation((endpoint) => {
        if (endpoint === 'detect-language') {
          return Promise.resolve({ language: 'en' });
        } else if (endpoint === 'video-translate') {
          translationCount++;
          const lang = targetLanguages[translationCount - 1];
          return Promise.resolve({
            translated_url: `https://example.com/translated-${lang}.mp4`
          });
        }
        return Promise.resolve({});
      });

      const sourceLang = await client.detectLanguage(videoUrl);
      expect(sourceLang).toBe('en');

      const translations = [];
      for (const targetLang of targetLanguages) {
        const translated = await client.translateVideo(videoUrl, sourceLang, targetLang);
        translations.push({
          language: targetLang,
          url: translated.translated_url
        });
      }

      expect(translations).toHaveLength(3);
      translations.forEach((translation, index) => {
        expect(translation.url).toContain(`translated-${targetLanguages[index]}.mp4`);
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should implement retry logic for transient failures', async () => {
      const videoUrl = 'https://example.com/video.mp4';

      // Mock API failure then success
      muapi.makeRequest
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce({ translated_url: 'success.mp4' });

      // Should eventually succeed
      const result = await client.translateVideo(videoUrl, 'en', 'es');
      expect(result.translated_url).toBe('success.mp4');
      expect(muapi.makeRequest).toHaveBeenCalledTimes(3);
    });

    it('should handle rate limiting gracefully', async () => {
      muapi.makeRequest.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded',
        retryAfter: 60
      });

      await expect(client.translateVideo('video.mp4', 'en', 'es'))
        .rejects.toEqual({
          status: 429,
          message: 'Rate limit exceeded',
          retryAfter: 60
        });
    });

    it('should provide fallback behavior for API unavailability', async () => {
      // Mock complete API unavailability
      muapi.makeRequest.mockRejectedValue(new Error('API unavailable'));

      // Language detection should fallback
      const detected = await client.detectLanguage('video.mp4');
      expect(detected).toBe('en');

      // Voice fetching should return defaults
      const voices = await client.getAvailableVoices('es');
      expect(voices).toHaveLength(2); // Default voices
      expect(voices[0].name).toBe('Spanish Male');

      // Other operations should fail gracefully
      await expect(client.translateVideo('video.mp4', 'en', 'es'))
        .rejects.toThrow('API unavailable');
    });

    it('should handle partial failures in batch operations', async () => {
      const videos = [
        'https://example.com/video1.mp4',
        'https://example.com/video2.mp4',
        'https://example.com/video3.mp4'
      ];

      // Mock mixed success/failure
      let callCount = 0;
      muapi.makeRequest.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Processing failed for video2'));
        }
        return Promise.resolve({
          translated_url: `https://example.com/translated${callCount}.mp4`
        });
      });

      const results = [];

      for (let i = 0; i < videos.length; i++) {
        try {
          const result = await client.translateVideo(videos[i], 'en', 'es');
          results.push({ success: true, url: result.translated_url });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Processing failed for video2');
      expect(results[2].success).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent operations efficiently', async () => {
      const videoUrls = Array.from({ length: 5 }, (_, i) => `https://example.com/video${i}.mp4`);

      muapi.makeRequest.mockResolvedValue({ translated_url: 'result.mp4' });

      // Execute multiple operations concurrently
      const promises = videoUrls.map(url =>
        client.translateVideo(url, 'en', 'es')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.translated_url).toBe('result.mp4');
      });

      expect(muapi.makeRequest).toHaveBeenCalledTimes(5);
    });

    it('should respect performance limits from configuration', () => {
      // Test with dev config (limited concurrency)
      const config = loadConfig();
      expect(config.performance.maxConcurrency).toBe(1); // Dev limit
      expect(config.performance.requestsPerMinute).toBe(10); // Dev limit
    });

    it('should handle memory-intensive operations', async () => {
      const largeVideoUrl = 'https://example.com/4k-video.mp4';

      muapi.makeRequest.mockResolvedValue({
        processed_url: 'https://example.com/processed-4k.mp4',
        memoryUsed: 1000000, // 1GB
        processingTime: 120 // 2 minutes
      });

      const result = await client.applyPixverseAdvancedEffect(largeVideoUrl, 'super-resolution');

      expect(result.processed_url).toBe('https://example.com/processed-4k.mp4');
      expect(result.memoryUsed).toBe(1000000);
      expect(result.processingTime).toBe(120);
    });
  });

  describe('Singleton Instance Integration', () => {
    it('should provide consistent singleton instance', () => {
      expect(muapiEnhanced).toBeInstanceOf(MuapiEnhancedClient);
      expect(muapiEnhanced.client).toBe(muapi);

      // Multiple imports should return same instance
      const { muapiEnhanced: instance2 } = require('../../src/lib/muapiEnhanced.js');
      expect(instance2).toBe(muapiEnhanced);
    });

    it('should share state across operations', async () => {
      // Mock stateful operations
      let voiceCallCount = 0;
      muapi.makeRequest.mockImplementation((endpoint) => {
        if (endpoint === 'get-voices') {
          voiceCallCount++;
          return Promise.resolve({
            voices: [{ id: `voice-${voiceCallCount}`, name: `Voice ${voiceCallCount}` }]
          });
        }
        return Promise.resolve({ result: 'success' });
      });

      // First call
      const voices1 = await muapiEnhanced.getAvailableVoices('es');
      expect(voices1[0].id).toBe('voice-1');

      // Second call should get different voices (simulating API behavior)
      const voices2 = await muapiEnhanced.getAvailableVoices('fr');
      expect(voices2[0].id).toBe('voice-2');
    });
  });
});