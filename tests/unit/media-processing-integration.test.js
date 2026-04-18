import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MuAPIAdvancedEffects, getAdvancedEffects } from '../../src/lib/muapi/MuAPIAdvancedEffects.js';
import MuAPIConnection from '../../src/lib/muapi/MuAPIConnection.js';

// Mock the entire MuAPI system
vi.mock('../src/lib/muapi/MuAPIConnection.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    _makeRequest: vi.fn(),
    uploadFile: vi.fn(),
    initialize: vi.fn().mockResolvedValue(true)
  })),
  getMuAPIInstance: vi.fn(() => ({
    _makeRequest: vi.fn(),
    uploadFile: vi.fn()
  }))
}));

describe('Media Processing Integration Tests', () => {
  let effectsProcessor;
  let mockMuapi;

  beforeEach(() => {
    mockMuapi = {
      _makeRequest: vi.fn(),
      uploadFile: vi.fn(),
      initialize: vi.fn().mockResolvedValue(true)
    };

    MuAPIConnection.getMuAPIInstance = vi.fn(() => mockMuapi);
    effectsProcessor = new MuAPIAdvancedEffects();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Media Production Pipeline', () => {
    const testImage = {
      url: 'https://example.com/source-image.jpg',
      type: 'image',
      width: 1024,
      height: 768,
      fileSize: 2048000 // 2MB
    };

    const testVideo = {
      url: 'https://example.com/source-video.mp4',
      type: 'video',
      duration: 60,
      width: 1920,
      height: 1080,
      fileSize: 104857600 // 100MB
    };

    const testAudio = {
      url: 'https://example.com/dialogue.wav',
      type: 'audio',
      duration: 45,
      sampleRate: 44100
    };

    it('should execute complete image enhancement pipeline', async () => {
      // Setup mocks for the entire pipeline
      mockMuapi._makeRequest.mockImplementation((endpoint, options) => {
        if (endpoint.includes('upscale')) {
          return Promise.resolve({
            success: true,
            data: { url: 'https://example.com/upscaled.jpg' }
          });
        } else if (endpoint.includes('effects/filter')) {
          return Promise.resolve({
            success: true,
            data: { url: 'https://example.com/enhanced.jpg' }
          });
        } else if (endpoint.includes('effects/watermark')) {
          return Promise.resolve({
            success: true,
            data: { url: 'https://example.com/final.jpg' }
          });
        }
        return Promise.resolve({ success: true, data: { url: 'https://example.com/result.jpg' } });
      });

      // Execute the complete pipeline
      let processedImage = testImage;

      // Step 1: Upscale
      processedImage = await effectsProcessor.upscaleImage(processedImage, 2, { method: 'ai' });
      expect(processedImage.url).toBe('https://example.com/upscaled.jpg');

      // Step 2: Apply enhancement filters
      processedImage = await effectsProcessor.applyFilters(processedImage, [
        'sharpen',
        { name: 'color-grade', options: { contrast: 0.1, saturation: 0.1 } }
      ]);
      expect(processedImage.appliedFilters).toHaveLength(2);

      // Step 3: Add watermark
      processedImage = await effectsProcessor.addWatermark(processedImage, {
        text: '© 2024 Production',
        position: 'bottom-right',
        opacity: 0.8
      });
      expect(processedImage.watermark).toBeDefined();

      // Verify final result
      expect(processedImage.url).toBe('https://example.com/final.jpg');
      expect(mockMuapi._makeRequest).toHaveBeenCalledTimes(4); // upscale + 2 filters + watermark
    });

    it('should execute complete video production pipeline', async () => {
      // Setup mocks for video pipeline
      let callCount = 0;
      mockMuapi._makeRequest.mockImplementation(() => {
        callCount++;
        const urls = [
          'https://example.com/stabilized.mp4',
          'https://example.com/color-corrected.mp4',
          'https://example.com/lip-synced.mp4',
          'https://example.com/watermarked.mp4'
        ];
        return Promise.resolve({
          success: true,
          data: { url: urls[callCount - 1] || 'https://example.com/final.mp4' }
        });
      });

      let processedVideo = testVideo;

      // Step 1: Video stabilization
      processedVideo = await effectsProcessor.applyVideoEffect(processedVideo, 'stabilize');
      expect(processedVideo.url).toBe('https://example.com/stabilized.mp4');

      // Step 2: Color correction
      processedVideo = await effectsProcessor.applyVideoColorCorrection(processedVideo, {
        brightness: 0.1,
        contrast: 0.2
      });
      expect(processedVideo.url).toBe('https://example.com/color-corrected.mp4');

      // Step 3: Lip sync
      processedVideo = await effectsProcessor.lipSync(processedVideo, testAudio, {
        model: 'high-quality'
      });
      expect(processedVideo.url).toBe('https://example.com/lip-synced.mp4');

      // Step 4: Add watermark
      processedVideo = await effectsProcessor.addWatermark(processedVideo, {
        text: 'Production Watermark',
        position: 'top-left'
      });
      expect(processedVideo.url).toBe('https://example.com/watermarked.mp4');
    });

    it('should handle AI video effects pipeline', async () => {
      const mockRequestId = 'ai-effects-123';
      mockMuapi._makeRequest.mockImplementation((endpoint) => {
        if (endpoint.includes('/api/v1/generate_wan_ai_effects')) {
          return Promise.resolve({
            success: true,
            data: { request_id: mockRequestId }
          });
        } else if (endpoint.includes(`/api/v1/predictions/${mockRequestId}/result`)) {
          return Promise.resolve({
            success: true,
            data: {
              status: 'completed',
              outputs: ['https://example.com/ai-effect-video.mp4']
            }
          });
        }
        return Promise.resolve({ success: true });
      });

      const result = await effectsProcessor.applyAIVideoEffect(testVideo, {
        prompt: 'Add cinematic lighting and atmosphere',
        effectName: 'Cinematic Lighting',
        quality: 'high'
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/ai-effect-video.mp4');
    });

    it('should execute batch processing across multiple files', async () => {
      const mediaFiles = [
        { ...testImage, id: 'img1' },
        { ...testImage, id: 'img2' },
        { ...testVideo, id: 'vid1' }
      ];

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/processed.jpg' }
      });

      const effects = [
        { name: 'watermark', options: { text: 'Batch Process' } },
        'sharpen'
      ];

      const results = await effectsProcessor.applyBatchEffects(mediaFiles, effects);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.url).toBeDefined();
        expect(result.appliedFilters).toBeDefined();
      });

      expect(mockMuapi._makeRequest).toHaveBeenCalledTimes(6); // 3 files × 2 effects
    });
  });

  describe('Advanced Effects Combinations', () => {
    it('should apply cinematic preset effect collection', async () => {
      const testMedia = { ...testVideo };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/cinematic-result.mp4' }
      });

      const result = await effectsProcessor.applyPreset(testMedia, 'cinematic-vfx');

      expect(result.url).toBe('https://example.com/cinematic-result.mp4');
      expect(mockMuapi._makeRequest).toHaveBeenCalledTimes(3); // explosion + shake + color-grade
    });

    it('should handle motion graphics with keyframe animation', async () => {
      const testMedia = { ...testImage };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/animated-result.mp4' }
      });

      const result = await effectsProcessor.applyMotionControl(testMedia, 'zoom', {
        duration: 3,
        intensity: 'smooth'
      });

      expect(result.url).toBe('https://example.com/animated-result.mp4');
    });

    it('should combine VFX with audio synchronization', async () => {
      const testMedia = { ...testVideo };
      const audioData = { ...testAudio };

      let callCount = 0;
      mockMuapi._makeRequest.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            success: true,
            data: { url: 'https://example.com/vfx-added.mp4' }
          });
        } else {
          return Promise.resolve({
            success: true,
            data: {
              request_id: 'lip-sync-123',
              status: 'completed',
              outputs: ['https://example.com/final-synced.mp4']
            }
          });
        }
      });

      // Apply VFX first
      const withVFX = await effectsProcessor.applyVFX(testMedia, 'lightning', {
        intensity: 'dramatic'
      });

      // Then lip sync
      const finalResult = await effectsProcessor.lipSync(withVFX, audioData);

      expect(finalResult.url).toBe('https://example.com/final-synced.mp4');
    });
  });

  describe('Real-world Production Scenarios', () => {
    it('should handle social media content creation pipeline', async () => {
      const rawVideo = {
        ...testVideo,
        url: 'https://example.com/raw-footage.mp4',
        description: 'Product demo footage'
      };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/social-ready.mp4' }
      });

      // Complete social media preparation pipeline
      let processed = rawVideo;

      // Step 1: Stabilize footage
      processed = await effectsProcessor.applyVideoEffect(processed, 'stabilize');

      // Step 2: Color grade for social media
      processed = await effectsProcessor.applyColorGrading(processed, {
        saturation: 0.2,
        contrast: 0.1,
        brightness: 0.05
      });

      // Step 3: Add branded watermark
      processed = await effectsProcessor.addWatermark(processed, {
        text: '@BrandName',
        position: 'bottom-right',
        opacity: 0.9,
        color: '#ffffff'
      });

      // Step 4: Apply trendy effect
      processed = await effectsProcessor.applyPreset(processed, 'vibrant-social');

      expect(processed.appliedFilters).toBeDefined();
      expect(processed.watermark).toBeDefined();
    });

    it('should handle professional video production workflow', async () => {
      const productionVideo = { ...testVideo };
      const voiceOver = { ...testAudio };

      let callCount = 0;
      mockMuapi._makeRequest.mockImplementation(() => {
        callCount++;
        const results = [
          { url: 'https://example.com/color-graded.mp4' },
          { url: 'https://example.com/lip-synced-pro.mp4' },
          { url: 'https://example.com/with-lower-third.mp4' }
        ];
        return Promise.resolve({
          success: true,
          data: results[callCount - 1] || { url: 'https://example.com/final.mp4' }
        });
      });

      // Professional workflow
      let finalVideo = productionVideo;

      // Color grading
      finalVideo = await effectsProcessor.applyColorGrading(finalVideo, {
        temperature: 5500,
        tint: -5,
        contrast: 0.15
      });

      // Lip sync with professional quality
      finalVideo = await effectsProcessor.lipSync(finalVideo, voiceOver, {
        model: 'sync-lipsync',
        enhanceAudio: true,
        quality: 'professional'
      });

      // Add lower third graphics
      finalVideo = await effectsProcessor.addTextOverlay(finalVideo, {
        text: 'Professional Production',
        position: 'bottom',
        font: 'Helvetica Bold',
        size: 48,
        color: '#ffffff',
        background: true,
        backgroundColor: '#000000',
        backgroundOpacity: 0.7
      });

      expect(finalVideo.url).toBe('https://example.com/with-lower-third.mp4');
    });

    it('should handle content repurposing workflow', async () => {
      const originalVideo = { ...testVideo };

      // Simulate repurposing for different platforms
      const platforms = [
        { name: 'tiktok', size: '9:16', duration: 60 },
        { name: 'instagram', size: '1:1', duration: 90 },
        { name: 'youtube', size: '16:9', duration: 180 }
      ];

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/repurposed.mp4' }
      });

      for (const platform of platforms) {
        const repurposed = await effectsProcessor.repurposeContent(originalVideo, {
          platform: platform.name,
          aspectRatio: platform.size,
          maxDuration: platform.duration,
          addCaptions: true,
          optimizeForPlatform: true
        });

        expect(repurposed.platform).toBe(platform.name);
        expect(repurposed.aspectRatio).toBe(platform.size);
      }
    });

    it('should handle multilingual content production', async () => {
      const sourceVideo = { ...testVideo };
      const translations = [
        { language: 'es', audio: { ...testAudio, language: 'es' } },
        { language: 'fr', audio: { ...testAudio, language: 'fr' } },
        { language: 'de', audio: { ...testAudio, language: 'de' } }
      ];

      let callCount = 0;
      mockMuapi._makeRequest.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          success: true,
          data: {
            request_id: `lip-sync-${translations[callCount - 1]?.language}-123`,
            status: 'completed',
            outputs: [`https://example.com/${translations[callCount - 1]?.language}-version.mp4`]
          }
        });
      });

      const multilingualVersions = [];

      for (const translation of translations) {
        const localizedVersion = await effectsProcessor.lipSync(sourceVideo, translation.audio, {
          language: translation.language,
          accentMatching: true
        });

        multilingualVersions.push({
          language: translation.language,
          video: localizedVersion
        });
      }

      expect(multilingualVersions).toHaveLength(3);
      multilingualVersions.forEach(version => {
        expect(version.video.success).toBe(true);
        expect(version.video.url).toContain(version.language);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large batch processing efficiently', async () => {
      const largeBatch = Array.from({ length: 50 }, (_, i) => ({
        ...testImage,
        id: `img${i}`,
        url: `https://example.com/image${i}.jpg`
      }));

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/processed.jpg' }
      });

      const startTime = Date.now();
      const results = await effectsProcessor.applyBatchEffects(largeBatch, ['watermark']);
      const endTime = Date.now();

      expect(results).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should implement intelligent caching for repeated operations', async () => {
      const testMedia = { ...testImage };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/filtered.jpg' }
      });

      // First application
      await effectsProcessor.applyFilter(testMedia, 'blur');

      // Second application of same filter - should use cache
      await effectsProcessor.applyFilter(testMedia, 'blur');

      expect(mockMuapi._makeRequest).toHaveBeenCalledTimes(1); // Only once due to caching
    });

    it('should handle memory management for large files', async () => {
      const largeVideo = {
        ...testVideo,
        fileSize: 2147483648, // 2GB
        width: 3840,
        height: 2160
      };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/processed-4k.mp4' }
      });

      const result = await effectsProcessor.processLargeFile(largeVideo, {
        chunkSize: 100 * 1024 * 1024, // 100MB chunks
        parallelProcessing: true
      });

      expect(result.chunksProcessed).toBeGreaterThan(1);
      expect(result.memoryOptimized).toBe(true);
    });

    it('should implement progressive enhancement for slow connections', async () => {
      const testMedia = { ...testVideo };

      // Simulate slow connection with progressive responses
      mockMuapi._makeRequest.mockImplementation((endpoint, options) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              data: { url: 'https://example.com/progressive-result.mp4' }
            });
          }, 1000); // 1 second delay
        });
      });

      const result = await effectsProcessor.processWithProgressiveEnhancement(testMedia, {
        quality: 'adaptive',
        maxWaitTime: 5000
      });

      expect(result.quality).toBe('adaptive');
      expect(result.progressive).toBe(true);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should implement automatic retry logic for transient failures', async () => {
      const testMedia = { ...testImage };

      let failureCount = 0;
      mockMuapi._makeRequest.mockImplementation(() => {
        failureCount++;
        if (failureCount < 3) {
          return Promise.reject(new Error('Temporary network error'));
        }
        return Promise.resolve({
          success: true,
          data: { url: 'https://example.com/retry-success.jpg' }
        });
      });

      const result = await effectsProcessor.applyFilterWithRetry(testMedia, 'blur', {
        maxRetries: 3,
        backoffMs: 100
      });

      expect(failureCount).toBe(3); // Failed twice, succeeded on third try
      expect(result.url).toBe('https://example.com/retry-success.jpg');
    });

    it('should handle partial pipeline failures gracefully', async () => {
      const testMedia = { ...testVideo };

      let callCount = 0;
      mockMuapi._makeRequest.mockImplementation(() => {
        callCount++;
        if (callCount === 2) { // Second effect fails
          return Promise.reject(new Error('Effect processing failed'));
        }
        return Promise.resolve({
          success: true,
          data: { url: 'https://example.com/partial-result.mp4' }
        });
      });

      const effects = ['stabilize', 'failed-effect', 'watermark'];
      const result = await effectsProcessor.applyPipelineWithRecovery(testMedia, effects);

      expect(result.partialSuccess).toBe(true);
      expect(result.completedEffects).toContain('stabilize');
      expect(result.completedEffects).toContain('watermark');
      expect(result.failedEffects).toContain('failed-effect');
    });

    it('should provide detailed error reporting and diagnostics', async () => {
      const testMedia = { ...testImage };

      mockMuapi._makeRequest.mockRejectedValue({
        status: 400,
        message: 'Invalid image format',
        details: {
          supportedFormats: ['jpg', 'png', 'webp'],
          providedFormat: 'bmp'
        }
      });

      try {
        await effectsProcessor.applyFilter(testMedia, 'blur');
      } catch (error) {
        expect(error.details).toBeDefined();
        expect(error.supportedFormats).toEqual(['jpg', 'png', 'webp']);
        expect(error.providedFormat).toBe('bmp');
      }
    });

    it('should handle API rate limiting with exponential backoff', async () => {
      const testMedia = { ...testImage };

      let callCount = 0;
      mockMuapi._makeRequest.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject({
            status: 429,
            message: 'Rate limit exceeded',
            retryAfter: 2
          });
        }
        return Promise.resolve({
          success: true,
          data: { url: 'https://example.com/rate-limit-success.jpg' }
        });
      });

      const startTime = Date.now();
      const result = await effectsProcessor.applyFilterWithRateLimitHandling(testMedia, 'blur');
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThan(2000); // At least 2 seconds due to retry
      expect(result.url).toBe('https://example.com/rate-limit-success.jpg');
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should handle different video codecs and containers', async () => {
      const codecs = [
        { codec: 'h264', container: 'mp4' },
        { codec: 'h265', container: 'mp4' },
        { codec: 'vp9', container: 'webm' },
        { codec: 'av1', container: 'mkv' }
      ];

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/transcoded.mp4' }
      });

      for (const { codec, container } of codecs) {
        const testVideo = {
          ...testVideo,
          codec,
          container,
          url: `https://example.com/video.${container}`
        };

        const result = await effectsProcessor.transcodeVideo(testVideo, {
          targetCodec: 'h264',
          targetContainer: 'mp4'
        });

        expect(result.url).toBe('https://example.com/transcoded.mp4');
      }
    });

    it('should handle different image formats and color spaces', async () => {
      const formats = [
        { format: 'jpg', colorSpace: 'srgb' },
        { format: 'png', colorSpace: 'srgb' },
        { format: 'webp', colorSpace: 'display-p3' },
        { format: 'tiff', colorSpace: 'adobe-rgb' }
      ];

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/converted.jpg' }
      });

      for (const { format, colorSpace } of formats) {
        const testImage = {
          ...testImage,
          format,
          colorSpace,
          url: `https://example.com/image.${format}`
        };

        const result = await effectsProcessor.convertImage(testImage, {
          targetFormat: 'jpg',
          targetColorSpace: 'srgb'
        });

        expect(result.url).toBe('https://example.com/converted.jpg');
      }
    });

    it('should handle audio format conversions', async () => {
      const formats = ['wav', 'mp3', 'aac', 'flac', 'ogg'];

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/converted.wav' }
      });

      for (const format of formats) {
        const testAudio = {
          ...testAudio,
          format,
          url: `https://example.com/audio.${format}`
        };

        const result = await effectsProcessor.convertAudio(testAudio, {
          targetFormat: 'wav',
          sampleRate: 44100
        });

        expect(result.url).toBe('https://example.com/converted.wav');
      }
    });
  });
});