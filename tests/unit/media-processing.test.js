import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MuAPIAdvancedEffects } from '../../src/lib/muapi/MuAPIAdvancedEffects.js';
import MuAPIConnection from '../../src/lib/muapi/MuAPIConnection.js';

// Mock MuAPIConnection
vi.mock('../src/lib/muapi/MuAPIConnection.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    _makeRequest: vi.fn(),
    uploadFile: vi.fn()
  })),
  getMuAPIInstance: vi.fn(() => ({
    _makeRequest: vi.fn(),
    uploadFile: vi.fn()
  }))
}));

describe('Media Processing Features - Comprehensive Tests', () => {
  let effectsProcessor;
  let mockMuapi;

  beforeEach(() => {
    // Reset mocks
    mockMuapi = {
      _makeRequest: vi.fn(),
      uploadFile: vi.fn()
    };

    // Mock the getMuAPIInstance to return our mock
    MuAPIConnection.getMuAPIInstance = vi.fn(() => mockMuapi);

    effectsProcessor = new MuAPIAdvancedEffects();
  });

  describe('Upscale Functionality', () => {
    const mockImageData = {
      url: 'https://example.com/image.jpg',
      type: 'image',
      width: 512,
      height: 512
    };

    const mockVideoData = {
      url: 'https://example.com/video.mp4',
      type: 'video',
      duration: 30
    };

    describe('Image Upscaling', () => {
      it('should successfully upscale image with default scale factor', async () => {
        mockMuapi._makeRequest.mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/upscaled.jpg' }
        });

        const result = await effectsProcessor.upscaleImage(mockImageData, 2);

        expect(mockMuapi._makeRequest).toHaveBeenCalledWith('/effects/upscale', {
          method: 'POST',
          body: JSON.stringify({
            image_url: mockImageData.url,
            scale: 2,
            method: 'ai'
          })
        });
        expect(result.url).toBe('https://example.com/upscaled.jpg');
      });

      it('should handle upscale with custom options', async () => {
        const options = {
          method: 'topaz',
          quality: 'high',
          faceEnhancement: true
        };

        mockMuapi._makeRequest.mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/upscaled-topaz.jpg' }
        });

        const result = await effectsProcessor.upscaleImage(mockImageData, 4, options);

        expect(mockMuapi._makeRequest).toHaveBeenCalledWith('/effects/upscale', {
          method: 'POST',
          body: JSON.stringify({
            image_url: mockImageData.url,
            scale: 4,
            method: 'topaz',
            quality: 'high',
            face_enhancement: true
          })
        });
      });

      it('should handle upscale failure gracefully', async () => {
        mockMuapi._makeRequest.mockRejectedValue(new Error('Network error'));

        const result = await effectsProcessor.upscaleImage(mockImageData, 2);

        expect(result).toEqual(mockImageData); // Should return original data on failure
      });

      it('should validate upscale parameters', async () => {
        // Test invalid scale factor
        await expect(effectsProcessor.upscaleImage(mockImageData, 0))
          .rejects.toThrow('Invalid scale factor');

        await expect(effectsProcessor.upscaleImage(mockImageData, 10))
          .rejects.toThrow('Scale factor too high');
      });

      it('should handle different image formats', async () => {
        const formats = ['jpg', 'png', 'webp', 'tiff'];

        mockMuapi._makeRequest.mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/upscaled.jpg' }
        });

        for (const format of formats) {
          const formatData = { ...mockImageData, format };
          const result = await effectsProcessor.upscaleImage(formatData, 2);

          expect(result.url).toBeDefined();
        }
      });

      it('should upscale images with different aspect ratios', async () => {
        const aspectRatios = [
          { width: 1920, height: 1080 }, // 16:9
          { width: 1024, height: 1024 }, // 1:1
          { width: 1080, height: 1920 }, // 9:16
          { width: 4000, height: 3000 }  // 4:3
        ];

        mockMuapi._makeRequest.mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/upscaled.jpg' }
        });

        for (const dimensions of aspectRatios) {
          const testData = { ...mockImageData, ...dimensions };
          const result = await effectsProcessor.upscaleImage(testData, 2);

          expect(result.url).toBeDefined();
        }
      });

      it('should handle large image files', async () => {
        const largeImageData = {
          ...mockImageData,
          fileSize: 50 * 1024 * 1024, // 50MB
          width: 8000,
          height: 6000
        };

        mockMuapi._makeRequest.mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/upscaled-large.jpg' }
        });

        const result = await effectsProcessor.upscaleImage(largeImageData, 2);

        expect(result.url).toBeDefined();
      });
    });

    describe('Video Upscaling', () => {
      it('should upscale video successfully', async () => {
        mockMuapi._makeRequest.mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/upscaled-video.mp4' }
        });

        const result = await effectsProcessor.upscaleVideo(mockVideoData, 2);

        expect(mockMuapi._makeRequest).toHaveBeenCalledWith('/effects/video-upscale', {
          method: 'POST',
          body: JSON.stringify({
            video_url: mockVideoData.url,
            scale: 2,
            method: 'ai'
          })
        });
      });

      it('should handle video upscale with frame interpolation', async () => {
        const options = {
          frameInterpolation: true,
          targetFps: 60
        };

        mockMuapi._makeRequest.mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/upscaled-video-60fps.mp4' }
        });

        const result = await effectsProcessor.upscaleVideo(mockVideoData, 2, options);

        expect(result.url).toBeDefined();
      });

      it('should upscale video with different codecs', async () => {
        const codecs = ['h264', 'h265', 'vp9', 'av1'];

        mockMuapi._makeRequest.mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/upscaled-video.mp4' }
        });

        for (const codec of codecs) {
          const testData = { ...mockVideoData, codec };
          const result = await effectsProcessor.upscaleVideo(testData, 2);

          expect(result.url).toBeDefined();
        }
      });
    });
  });

  describe('Video Tools', () => {
    const mockVideoData = {
      url: 'https://example.com/video.mp4',
      type: 'video',
      duration: 30,
      width: 1920,
      height: 1080
    };

    it('should apply video stabilization', async () => {
      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/stabilized-video.mp4' }
      });

      const result = await effectsProcessor.applyVideoEffect(mockVideoData, 'stabilize');

      expect(result.url).toBe('https://example.com/stabilized-video.mp4');
    });

    it('should apply color correction to video', async () => {
      const colorOptions = {
        brightness: 0.1,
        contrast: 0.2,
        saturation: -0.1
      };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/color-corrected-video.mp4' }
      });

      const result = await effectsProcessor.applyVideoColorCorrection(mockVideoData, colorOptions);

      expect(result.url).toBeDefined();
    });

    it('should handle video denoising', async () => {
      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/denoised-video.mp4' }
      });

      const result = await effectsProcessor.applyVideoEffect(mockVideoData, 'denoise', { strength: 0.8 });

      expect(result.url).toBeDefined();
    });

    it('should apply multiple video effects in sequence', async () => {
      const effects = ['stabilize', 'denoise', 'sharpen'];

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/processed-video.mp4' }
      });

      const result = await effectsProcessor.applyVideoEffects(mockVideoData, effects);

      expect(mockMuapi._makeRequest).toHaveBeenCalledTimes(effects.length);
      expect(result.appliedEffects).toHaveLength(effects.length);
    });

    it('should handle video compression and optimization', async () => {
      const compressionOptions = {
        targetBitrate: '5000k',
        codec: 'h265',
        preset: 'slow'
      };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/compressed-video.mp4' }
      });

      const result = await effectsProcessor.compressVideo(mockVideoData, compressionOptions);

      expect(result.url).toBeDefined();
    });
  });

  describe('Lip Sync Functionality', () => {
    const mockVideoData = {
      url: 'https://example.com/video.mp4',
      type: 'video'
    };

    const mockAudioData = {
      url: 'https://example.com/audio.wav',
      type: 'audio',
      duration: 10
    };

    it('should successfully sync lips with audio', async () => {
      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: {
          request_id: 'lip-sync-123',
          status: 'completed',
          outputs: ['https://example.com/lip-synced-video.mp4']
        }
      });

      const result = await effectsProcessor.lipSync(mockVideoData, mockAudioData);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/lip-synced-video.mp4');
    });

    it('should handle lip sync with different quality settings', async () => {
      const qualityOptions = {
        model: 'high-quality-sync',
        enhanceAudio: true,
        smoothTransitions: true
      };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: {
          request_id: 'lip-sync-hq-123',
          status: 'completed',
          outputs: ['https://example.com/lip-synced-hq-video.mp4']
        }
      });

      const result = await effectsProcessor.lipSync(mockVideoData, mockAudioData, qualityOptions);

      expect(result.success).toBe(true);
    });

    it('should handle lip sync processing timeout', async () => {
      // Mock polling that exceeds max attempts
      effectsProcessor.pollForResult = vi.fn().mockResolvedValue({
        success: false,
        error: 'Polling timeout exceeded'
      });

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { request_id: 'lip-sync-timeout-123' }
      });

      const result = await effectsProcessor.lipSync(mockVideoData, mockAudioData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Polling timeout exceeded');
    });

    it('should handle lip sync with different audio formats', async () => {
      const audioFormats = ['wav', 'mp3', 'aac', 'flac'];

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: {
          request_id: 'lip-sync-format-123',
          status: 'completed',
          outputs: ['https://example.com/lip-synced-video.mp4']
        }
      });

      for (const format of audioFormats) {
        const testAudio = { ...mockAudioData, format };
        const result = await effectsProcessor.lipSync(mockVideoData, testAudio);

        expect(result.success).toBe(true);
      }
    });

    it('should handle lip sync with multilingual audio', async () => {
      const languages = ['en', 'es', 'fr', 'de', 'ja'];

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: {
          request_id: 'lip-sync-lang-123',
          status: 'completed',
          outputs: ['https://example.com/lip-synced-video.mp4']
        }
      });

      for (const language of languages) {
        const testAudio = { ...mockAudioData, language };
        const result = await effectsProcessor.lipSync(mockVideoData, testAudio, { language });

        expect(result.success).toBe(true);
      }
    });

    it('should validate lip sync input parameters', async () => {
      // Test with missing video
      await expect(effectsProcessor.lipSync(null, mockAudioData))
        .rejects.toThrow('Video data is required');

      // Test with missing audio
      await expect(effectsProcessor.lipSync(mockVideoData, null))
        .rejects.toThrow('Audio data is required');

      // Test with invalid video format
      const invalidVideo = { ...mockVideoData, type: 'image' };
      await expect(effectsProcessor.lipSync(invalidVideo, mockAudioData))
        .rejects.toThrow('Invalid video format');
    });

    it('should handle lip sync with background music', async () => {
      const audioWithMusic = {
        ...mockAudioData,
        hasBackgroundMusic: true,
        separateTracks: true
      };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: {
          request_id: 'lip-sync-music-123',
          status: 'completed',
          outputs: ['https://example.com/lip-synced-with-music.mp4']
        }
      });

      const result = await effectsProcessor.lipSync(mockVideoData, audioWithMusic, {
        preserveBackgroundMusic: true
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Watermark Functionality', () => {
    const mockMediaData = {
      url: 'https://example.com/image.jpg',
      type: 'image'
    };

    it('should add text watermark successfully', async () => {
      const watermarkOptions = {
        text: '© 2024 Company',
        position: 'bottom-right',
        opacity: 0.8,
        color: '#ffffff',
        font: 'Arial',
        size: 'medium'
      };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/watermarked-image.jpg' }
      });

      const result = await effectsProcessor.addWatermark(mockMediaData, watermarkOptions);

      expect(result.url).toBe('https://example.com/watermarked-image.jpg');
      expect(result.watermark).toEqual(watermarkOptions);
    });

    it('should add image watermark', async () => {
      const watermarkOptions = {
        imageUrl: 'https://example.com/logo.png',
        position: 'top-left',
        opacity: 0.6,
        size: 'small'
      };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/image-watermarked.jpg' }
      });

      const result = await effectsProcessor.addWatermark(mockMediaData, watermarkOptions);

      expect(result.url).toBe('https://example.com/image-watermarked.jpg');
    });

    it('should handle all watermark positions', async () => {
      const positions = [
        'top-left', 'top-center', 'top-right',
        'center-left', 'center', 'center-right',
        'bottom-left', 'bottom-center', 'bottom-right'
      ];

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/positioned-watermark.jpg' }
      });

      for (const position of positions) {
        const result = await effectsProcessor.addWatermark(mockMediaData, {
          text: 'Watermark',
          position
        });

        expect(result.url).toBeDefined();
      }
    });

    it('should handle watermark opacity ranges', async () => {
      const opacities = [0.1, 0.3, 0.5, 0.7, 0.9];

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/opacity-watermark.jpg' }
      });

      for (const opacity of opacities) {
        const result = await effectsProcessor.addWatermark(mockMediaData, {
          text: 'Watermark',
          opacity
        });

        expect(result.url).toBeDefined();
      }
    });

    it('should add watermarks to video files', async () => {
      const videoData = {
        url: 'https://example.com/video.mp4',
        type: 'video'
      };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/watermarked-video.mp4' }
      });

      const result = await effectsProcessor.addWatermark(videoData, {
        text: '© 2024',
        position: 'bottom-right',
        opacity: 0.7
      });

      expect(result.url).toBe('https://example.com/watermarked-video.mp4');
    });

    it('should handle watermark with custom styling', async () => {
      const customOptions = {
        text: 'CONFIDENTIAL',
        color: '#ff0000',
        font: 'Impact',
        size: 'large',
        stroke: true,
        strokeColor: '#000000',
        strokeWidth: 3,
        shadow: true,
        angle: 45
      };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/custom-watermark.jpg' }
      });

      const result = await effectsProcessor.addWatermark(mockMediaData, customOptions);

      expect(result.url).toBeDefined();
      expect(result.watermark).toEqual(customOptions);
    });

    it('should validate watermark parameters', async () => {
      // Test with missing text and image
      await expect(effectsProcessor.addWatermark(mockMediaData, {}))
        .rejects.toThrow('Either text or imageUrl is required');

      // Test with invalid position
      await expect(effectsProcessor.addWatermark(mockMediaData, {
        text: 'Test',
        position: 'invalid-position'
      })).rejects.toThrow('Invalid position');

      // Test with invalid opacity
      await expect(effectsProcessor.addWatermark(mockMediaData, {
        text: 'Test',
        opacity: 1.5
      })).rejects.toThrow('Opacity must be between 0 and 1');
    });

    it('should handle batch watermarking', async () => {
      const mediaFiles = [
        { url: 'https://example.com/image1.jpg', type: 'image' },
        { url: 'https://example.com/image2.jpg', type: 'image' },
        { url: 'https://example.com/video1.mp4', type: 'video' }
      ];

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/watermarked.jpg' }
      });

      const results = await effectsProcessor.applyBatchEffects(mediaFiles, [
        { name: 'watermark', options: { text: '© Company' } }
      ]);

      expect(results).toHaveLength(mediaFiles.length);
      results.forEach(result => {
        expect(result.url).toBeDefined();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network failures gracefully', async () => {
      const mockData = { url: 'https://example.com/image.jpg', type: 'image' };

      mockMuapi._makeRequest.mockRejectedValue(new Error('Network timeout'));

      const result = await effectsProcessor.applyFilter(mockData, 'blur');

      expect(result).toEqual(mockData); // Should return original data
    });

    it('should handle invalid media URLs', async () => {
      const invalidData = { url: 'invalid-url', type: 'image' };

      await expect(effectsProcessor.applyFilter(invalidData, 'blur'))
        .rejects.toThrow('Invalid URL format');
    });

    it('should handle unsupported media types', async () => {
      const unsupportedData = { url: 'https://example.com/file.xyz', type: 'xyz' };

      await expect(effectsProcessor.applyFilter(unsupportedData, 'blur'))
        .rejects.toThrow('Unsupported media type');
    });

    it('should handle API rate limiting', async () => {
      mockMuapi._makeRequest.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded'
      });

      const mockData = { url: 'https://example.com/image.jpg', type: 'image' };

      await expect(effectsProcessor.applyFilter(mockData, 'blur'))
        .rejects.toThrow('Rate limit exceeded');
    });

    it('should handle large file processing timeouts', async () => {
      const largeFile = {
        url: 'https://example.com/large-video.mp4',
        type: 'video',
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB
        duration: 120
      };

      mockMuapi._makeRequest.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({
            success: true,
            data: { url: 'https://example.com/processed-large-video.mp4' }
          }), 35000); // Simulate long processing time
        });
      });

      // Test with custom timeout
      const result = await effectsProcessor.applyVideoEffect(largeFile, 'upscale', {}, { timeout: 60000 });

      expect(result.url).toBeDefined();
    });

    it('should handle concurrent processing limits', async () => {
      const mockData = { url: 'https://example.com/image.jpg', type: 'image' };
      const effects = ['blur', 'sharpen', 'contrast', 'brightness'];

      // Simulate server busy for concurrent requests
      let callCount = 0;
      mockMuapi._makeRequest.mockImplementation(() => {
        callCount++;
        if (callCount > 2) {
          return Promise.reject({ status: 503, message: 'Server busy' });
        }
        return Promise.resolve({
          success: true,
          data: { url: 'https://example.com/processed.jpg' }
        });
      });

      const results = await effectsProcessor.applyBatchEffects([mockData], effects);

      // Should process some successfully and handle failures gracefully
      expect(results).toHaveLength(1);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should optimize processing for different file sizes', async () => {
      const fileSizes = [
        { size: 1024 * 1024, expectedQuality: 'high' }, // 1MB
        { size: 10 * 1024 * 1024, expectedQuality: 'medium' }, // 10MB
        { size: 100 * 1024 * 1024, expectedQuality: 'low' } // 100MB
      ];

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/optimized.jpg' }
      });

      for (const { size, expectedQuality } of fileSizes) {
        const mockData = {
          url: 'https://example.com/image.jpg',
          type: 'image',
          fileSize: size
        };

        const result = await effectsProcessor.optimizeProcessing(mockData);

        expect(result.quality).toBe(expectedQuality);
      }
    });

    it('should handle memory constraints for large files', async () => {
      const largeImage = {
        url: 'https://example.com/huge-image.jpg',
        type: 'image',
        width: 20000,
        height: 15000,
        fileSize: 500 * 1024 * 1024 // 500MB
      };

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/processed-huge.jpg' }
      });

      const result = await effectsProcessor.processLargeFile(largeImage);

      expect(result.chunksProcessed).toBeGreaterThan(1);
      expect(result.memoryOptimized).toBe(true);
    });

    it('should implement caching for repeated operations', async () => {
      const mockData = { url: 'https://example.com/image.jpg', type: 'image' };
      const filterName = 'blur';

      mockMuapi._makeRequest.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/blurred.jpg' }
      });

      // First call
      await effectsProcessor.applyFilter(mockData, filterName);

      // Second call with same parameters - should use cache
      const result = await effectsProcessor.applyFilter(mockData, filterName);

      // Should only call API once due to caching
      expect(mockMuapi._makeRequest).toHaveBeenCalledTimes(1);
      expect(result.url).toBe('https://example.com/blurred.jpg');
    });
  });
});