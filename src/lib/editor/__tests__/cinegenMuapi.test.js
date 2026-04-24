import { describe, it, expect, vi } from 'vitest';
import { CineGenMuAPI } from '../cinegenMuapi.js';

// Mock muapi
vi.mock('../../muapi.js', () => ({
  muapi: {
    applyWanAIEffect: vi.fn(),
    generateImage: vi.fn(),
    applySAM3Segmentation: vi.fn(),
    generateMusic: vi.fn()
  }
}));

import { muapi } from '../../muapi.js';

describe('CineGenMuAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateVideo', () => {
    it('should call muapi.applyWanAIEffect with correct parameters', async () => {
      const mockResult = { videoUrl: 'test.mp4' };
      muapi.applyWanAIEffect.mockResolvedValue(mockResult);

      const result = await CineGenMuAPI.generateVideo('test prompt', 'wan-2.1');

      expect(muapi.applyWanAIEffect).toHaveBeenCalledWith('test prompt', 'wan-2.1', {});
      expect(result).toBe(mockResult);
    });

    it('should use default model when not specified', async () => {
      const mockResult = { videoUrl: 'test.mp4' };
      muapi.applyWanAIEffect.mockResolvedValue(mockResult);

      await CineGenMuAPI.generateVideo('test prompt');

      expect(muapi.applyWanAIEffect).toHaveBeenCalledWith('test prompt', 'wan-2.1', {});
    });
  });

  describe('generateImage', () => {
    it('should call muapi.generateImage with correct parameters', async () => {
      const mockResult = { imageUrl: 'test.jpg' };
      muapi.generateImage.mockResolvedValue(mockResult);

      const result = await CineGenMuAPI.generateImage('test prompt', 'flux-dev');

      expect(muapi.generateImage).toHaveBeenCalledWith('test prompt', 'flux-dev', {});
      expect(result).toBe(mockResult);
    });

    it('should use default model when not specified', async () => {
      const mockResult = { imageUrl: 'test.jpg' };
      muapi.generateImage.mockResolvedValue(mockResult);

      await CineGenMuAPI.generateImage('test prompt');

      expect(muapi.generateImage).toHaveBeenCalledWith('test prompt', 'flux-dev', {});
    });
  });

  describe('applySAM3Segmentation', () => {
    it('should call muapi.applySAM3Segmentation with correct parameters', async () => {
      const mockImageData = 'base64data';
      const mockPrompts = ['person', 'car'];
      const mockResult = { masks: [] };
      muapi.applySAM3Segmentation.mockResolvedValue(mockResult);

      const result = await CineGenMuAPI.applySAM3Segmentation(mockImageData, mockPrompts);

      expect(muapi.applySAM3Segmentation).toHaveBeenCalledWith(mockImageData, mockPrompts);
      expect(result).toBe(mockResult);
    });
  });

  describe('generateMusic', () => {
    it('should call muapi.generateMusic with correct parameters', async () => {
      const mockContext = { videoId: '123' };
      const mockOptions = { genre: 'rock', mood: 'energetic' };
      const mockResult = { musicUrl: 'test.mp3' };
      muapi.generateMusic.mockResolvedValue(mockResult);

      const result = await CineGenMuAPI.generateMusic(mockContext, mockOptions);

      expect(muapi.generateMusic).toHaveBeenCalledWith({
        ...mockContext,
        ...mockOptions
      });
      expect(result).toBe(mockResult);
    });
  });
});