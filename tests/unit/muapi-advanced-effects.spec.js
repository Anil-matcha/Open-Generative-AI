import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  applyPixverseAdvancedEffect,
  applyVeoAdvancedI2V,
  applyRunwayMotion
} from '../../src/lib/muapiEnhanced.js';

// Mock the underlying muapi module
vi.mock('../../src/lib/muapi.js', () => ({
  muapi: {
    makeRequest: vi.fn()
  }
}));

import { muapi } from '../../src/lib/muapi.js';

describe('MuAPI Advanced Effects Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('applyPixverseAdvancedEffect', () => {
    it('should apply Pixverse effect with default options', async () => {
      const videoUrl = 'https://example.com/video.mp4';
      const effectType = 'hyper-realistic';
      const mockResponse = { processed_url: 'https://example.com/pixverse-result.mp4' };

      muapi.makeRequest.mockResolvedValue(mockResponse);

      const result = await applyPixverseAdvancedEffect(videoUrl, effectType);

      expect(result).toEqual(mockResponse);
      expect(muapi.makeRequest).toHaveBeenCalledWith('pixverse-advanced-effect', {
        video_url: videoUrl,
        effect_type: effectType,
        intensity: 5,
        duration: null,
        style: 'cinematic'
      });
    });

    it('should apply Pixverse effect with custom options', async () => {
      const videoUrl = 'https://example.com/video.mp4';
      const effectType = 'motion-blur';
      const options = {
        intensity: 8,
        duration: 10,
        style: 'realistic',
        customParam: 'test'
      };
      const mockResponse = { processed_url: 'https://example.com/custom-pixverse.mp4' };

      muapi.makeRequest.mockResolvedValue(mockResponse);

      const result = await applyPixverseAdvancedEffect(videoUrl, effectType, options);

      expect(result).toEqual(mockResponse);
      expect(muapi.makeRequest).toHaveBeenCalledWith('pixverse-advanced-effect', {
        video_url: videoUrl,
        effect_type: effectType,
        intensity: 8,
        duration: 10,
        style: 'realistic',
        customParam: 'test'
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('Pixverse processing failed');
      muapi.makeRequest.mockRejectedValue(error);

      await expect(applyPixverseAdvancedEffect('video.mp4', 'effect'))
        .rejects.toThrow('Pixverse processing failed');
    });

    it('should support different effect types', async () => {
      const effectTypes = [
        'hyper-realistic',
        'cinematic-depth',
        'motion-blur',
        'color-grading',
        'hdr-tonemapping',
        'film-grain',
        'super-resolution',
        'denoising',
        'sharpness-enhancement',
        'particle-effects',
        'lightning-simulation',
        'water-simulation'
      ];

      muapi.makeRequest.mockResolvedValue({ processed_url: 'result.mp4' });

      for (const effectType of effectTypes) {
        await applyPixverseAdvancedEffect('video.mp4', effectType);
        expect(muapi.makeRequest).toHaveBeenCalledWith('pixverse-advanced-effect', {
          video_url: 'video.mp4',
          effect_type: effectType,
          intensity: 5,
          duration: null,
          style: 'cinematic'
        });
        vi.clearAllMocks();
      }
    });
  });

  describe('applyVeoAdvancedI2V', () => {
    it('should apply Veo I2V with default options', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const mockResponse = { video_url: 'https://example.com/veo-result.mp4' };

      muapi.makeRequest.mockResolvedValue(mockResponse);

      const result = await applyVeoAdvancedI2V(imageUrl);

      expect(result).toEqual(mockResponse);
      expect(muapi.makeRequest).toHaveBeenCalledWith('veo-advanced-i2v', {
        image_url: imageUrl,
        prompt: '',
        motion_strength: 5,
        camera_movement: 'subtle',
        duration: 5,
        resolution: '1080p',
        aspect_ratio: '16:9',
        style: 'realistic'
      });
    });

    it('should apply Veo I2V with custom options', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const options = {
        prompt: 'A serene mountain landscape at sunset',
        motionStrength: 8,
        cameraMovement: 'pan-left',
        duration: 10,
        resolution: '4k',
        aspectRatio: '21:9',
        style: 'cinematic'
      };
      const mockResponse = { video_url: 'https://example.com/custom-veo.mp4' };

      muapi.makeRequest.mockResolvedValue(mockResponse);

      const result = await applyVeoAdvancedI2V(imageUrl, options);

      expect(result).toEqual(mockResponse);
      expect(muapi.makeRequest).toHaveBeenCalledWith('veo-advanced-i2v', {
        image_url: imageUrl,
        prompt: 'A serene mountain landscape at sunset',
        motion_strength: 8,
        camera_movement: 'pan-left',
        duration: 10,
        resolution: '4k',
        aspect_ratio: '21:9',
        style: 'cinematic'
      });
    });

    it('should handle API errors', async () => {
      muapi.makeRequest.mockRejectedValue(new Error('Veo processing failed'));

      await expect(applyVeoAdvancedI2V('image.jpg'))
        .rejects.toThrow('Veo processing failed');
    });

    it('should support different motion strengths', async () => {
      const strengths = [1, 3, 5, 7, 10];
      muapi.makeRequest.mockResolvedValue({ video_url: 'result.mp4' });

      for (const strength of strengths) {
        await applyVeoAdvancedI2V('image.jpg', { motionStrength: strength });
        expect(muapi.makeRequest).toHaveBeenCalledWith('veo-advanced-i2v', {
          image_url: 'image.jpg',
          prompt: '',
          motion_strength: strength,
          camera_movement: 'subtle',
          duration: 5,
          resolution: '1080p',
          aspect_ratio: '16:9',
          style: 'realistic'
        });
        vi.clearAllMocks();
      }
    });

    it('should support different camera movements', async () => {
      const movements = ['subtle', 'pan-left', 'pan-right', 'zoom-in', 'zoom-out', 'tilt-up', 'tilt-down'];
      muapi.makeRequest.mockResolvedValue({ video_url: 'result.mp4' });

      for (const movement of movements) {
        await applyVeoAdvancedI2V('image.jpg', { cameraMovement: movement });
        expect(muapi.makeRequest).toHaveBeenCalledWith('veo-advanced-i2v', {
          image_url: 'image.jpg',
          prompt: '',
          motion_strength: 5,
          camera_movement: movement,
          duration: 5,
          resolution: '1080p',
          aspect_ratio: '16:9',
          style: 'realistic'
        });
        vi.clearAllMocks();
      }
    });

    it('should support different resolutions', async () => {
      const resolutions = ['720p', '1080p', '1440p', '4k', '8k'];
      muapi.makeRequest.mockResolvedValue({ video_url: 'result.mp4' });

      for (const resolution of resolutions) {
        await applyVeoAdvancedI2V('image.jpg', { resolution });
        expect(muapi.makeRequest).toHaveBeenCalledWith('veo-advanced-i2v', {
          image_url: 'image.jpg',
          prompt: '',
          motion_strength: 5,
          camera_movement: 'subtle',
          duration: 5,
          resolution,
          aspect_ratio: '16:9',
          style: 'realistic'
        });
        vi.clearAllMocks();
      }
    });
  });

  describe('applyRunwayMotion', () => {
    it('should apply Runway motion with default options', async () => {
      const videoUrl = 'https://example.com/video.mp4';
      const mockResponse = { processed_url: 'https://example.com/motion-result.mp4' };

      muapi.makeRequest.mockResolvedValue(mockResponse);

      const result = await applyRunwayMotion(videoUrl);

      expect(result).toEqual(mockResponse);
      expect(muapi.makeRequest).toHaveBeenCalledWith('runway-motion', {
        video_url: videoUrl,
        motion_type: 'pan',
        direction: 'left',
        speed: 5,
        intensity: 5,
        stabilization: false,
        motion_blur: false
      });
    });

    it('should apply Runway motion with custom config', async () => {
      const videoUrl = 'https://example.com/video.mp4';
      const motionConfig = {
        type: 'zoom',
        direction: 'in',
        speed: 8,
        intensity: 7,
        stabilization: true,
        motionBlur: true
      };
      const mockResponse = { processed_url: 'https://example.com/custom-motion.mp4' };

      muapi.makeRequest.mockResolvedValue(mockResponse);

      const result = await applyRunwayMotion(videoUrl, motionConfig);

      expect(result).toEqual(mockResponse);
      expect(muapi.makeRequest).toHaveBeenCalledWith('runway-motion', {
        video_url: videoUrl,
        motion_type: 'zoom',
        direction: 'in',
        speed: 8,
        intensity: 7,
        stabilization: true,
        motion_blur: true
      });
    });

    it('should handle API errors', async () => {
      muapi.makeRequest.mockRejectedValue(new Error('Runway motion failed'));

      await expect(applyRunwayMotion('video.mp4'))
        .rejects.toThrow('Runway motion failed');
    });

    it('should support different motion types', async () => {
      const motionTypes = [
        'pan', 'tilt', 'zoom', 'dolly', 'truck', 'pedestal', 'arc', 'follow'
      ];
      muapi.makeRequest.mockResolvedValue({ processed_url: 'result.mp4' });

      for (const type of motionTypes) {
        await applyRunwayMotion('video.mp4', { type });
        expect(muapi.makeRequest).toHaveBeenCalledWith('runway-motion', {
          video_url: 'video.mp4',
          motion_type: type,
          direction: 'left',
          speed: 5,
          intensity: 5,
          stabilization: false,
          motion_blur: false
        });
        vi.clearAllMocks();
      }
    });

    it('should support different directions', async () => {
      const directions = [
        'left', 'right', 'up', 'down', 'in', 'out', 'clockwise', 'counterclockwise'
      ];
      muapi.makeRequest.mockResolvedValue({ processed_url: 'result.mp4' });

      for (const direction of directions) {
        await applyRunwayMotion('video.mp4', { direction });
        expect(muapi.makeRequest).toHaveBeenCalledWith('runway-motion', {
          video_url: 'video.mp4',
          motion_type: 'pan',
          direction,
          speed: 5,
          intensity: 5,
          stabilization: false,
          motion_blur: false
        });
        vi.clearAllMocks();
      }
    });

    it('should support speed and intensity ranges', async () => {
      const speeds = [1, 3, 5, 7, 10];
      const intensities = [1, 3, 5, 7, 10];

      muapi.makeRequest.mockResolvedValue({ processed_url: 'result.mp4' });

      for (const speed of speeds) {
        await applyRunwayMotion('video.mp4', { speed });
        expect(muapi.makeRequest).toHaveBeenCalledWith('runway-motion', {
          video_url: 'video.mp4',
          motion_type: 'pan',
          direction: 'left',
          speed,
          intensity: 5,
          stabilization: false,
          motion_blur: false
        });
        vi.clearAllMocks();
      }

      for (const intensity of intensities) {
        await applyRunwayMotion('video.mp4', { intensity });
        expect(muapi.makeRequest).toHaveBeenCalledWith('runway-motion', {
          video_url: 'video.mp4',
          motion_type: 'pan',
          direction: 'left',
          speed: 5,
          intensity,
          stabilization: false,
          motion_blur: false
        });
        vi.clearAllMocks();
      }
    });

    it('should support stabilization and motion blur options', async () => {
      muapi.makeRequest.mockResolvedValue({ processed_url: 'result.mp4' });

      await applyRunwayMotion('video.mp4', { stabilization: true });
      expect(muapi.makeRequest).toHaveBeenCalledWith('runway-motion', {
        video_url: 'video.mp4',
        motion_type: 'pan',
        direction: 'left',
        speed: 5,
        intensity: 5,
        stabilization: true,
        motion_blur: false
      });

      vi.clearAllMocks();

      await applyRunwayMotion('video.mp4', { motionBlur: true });
      expect(muapi.makeRequest).toHaveBeenCalledWith('runway-motion', {
        video_url: 'video.mp4',
        motion_type: 'pan',
        direction: 'left',
        speed: 5,
        intensity: 5,
        stabilization: false,
        motion_blur: true
      });
    });
  });

  describe('Integration and Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      muapi.makeRequest.mockRejectedValue(new Error('Network timeout'));

      await expect(applyPixverseAdvancedEffect('video.mp4', 'effect'))
        .rejects.toThrow('Network timeout');

      await expect(applyVeoAdvancedI2V('image.jpg'))
        .rejects.toThrow('Network timeout');

      await expect(applyRunwayMotion('video.mp4'))
        .rejects.toThrow('Network timeout');
    });

    it('should handle malformed responses', async () => {
      muapi.makeRequest.mockResolvedValue(null);

      const result1 = await applyPixverseAdvancedEffect('video.mp4', 'effect');
      expect(result1).toBeNull();

      const result2 = await applyVeoAdvancedI2V('image.jpg');
      expect(result2).toBeNull();

      const result3 = await applyRunwayMotion('video.mp4');
      expect(result3).toBeNull();
    });

    it('should handle API rate limiting', async () => {
      muapi.makeRequest.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded'
      });

      await expect(applyPixverseAdvancedEffect('video.mp4', 'effect'))
        .rejects.toEqual({ status: 429, message: 'Rate limit exceeded' });
    });

    it('should handle server errors', async () => {
      muapi.makeRequest.mockRejectedValue({
        status: 500,
        message: 'Internal server error'
      });

      await expect(applyVeoAdvancedI2V('image.jpg'))
        .rejects.toEqual({ status: 500, message: 'Internal server error' });
    });
  });

  describe('Parameter Validation', () => {
    it('should handle missing parameters', async () => {
      muapi.makeRequest.mockResolvedValue({ result: 'success' });

      await expect(applyPixverseAdvancedEffect()).rejects.toThrow();
      await expect(applyVeoAdvancedI2V()).rejects.toThrow();
      await expect(applyRunwayMotion()).rejects.toThrow();
    });

    it('should handle empty strings', async () => {
      muapi.makeRequest.mockResolvedValue({ result: 'success' });

      const result1 = await applyPixverseAdvancedEffect('', 'effect');
      expect(result1).toEqual({ result: 'success' });

      const result2 = await applyVeoAdvancedI2V('');
      expect(result2).toEqual({ result: 'success' });

      const result3 = await applyRunwayMotion('');
      expect(result3).toEqual({ result: 'success' });
    });

    it('should handle invalid URLs', async () => {
      muapi.makeRequest.mockResolvedValue({ result: 'success' });

      const invalidUrls = [
        'not-a-url',
        'ftp://example.com/file.mp4',
        null,
        undefined
      ];

      for (const url of invalidUrls) {
        const result1 = await applyPixverseAdvancedEffect(url, 'effect');
        expect(result1).toEqual({ result: 'success' });

        const result2 = await applyVeoAdvancedI2V(url);
        expect(result2).toEqual({ result: 'success' });

        const result3 = await applyRunwayMotion(url);
        expect(result3).toEqual({ result: 'success' });
      }
    });
  });
});