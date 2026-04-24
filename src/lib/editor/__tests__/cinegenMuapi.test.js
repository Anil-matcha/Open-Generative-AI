import { describe, it, expect, vi } from 'vitest';
import { CineGenMuAPI } from '../cinegenMuapi.js';

// Mock muapi
vi.mock('../../muapi.js', () => ({
  muapi: {
    generateVideo: vi.fn(),
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
    it('should call muapi.generateVideo with correct parameters', async () => {
      const mockResult = { url: 'test.mp4' };
      muapi.generateVideo.mockResolvedValue(mockResult);

      const result = await CineGenMuAPI.generateVideo('test prompt', 'wan2.1-text-to-video');

      expect(muapi.generateVideo).toHaveBeenCalledWith({ prompt: 'test prompt', model: 'wan2.1-text-to-video' });
      expect(result).toBe(mockResult);
    });

    it('should use default model when not specified', async () => {
      const mockResult = { url: 'test.mp4' };
      muapi.generateVideo.mockResolvedValue(mockResult);

      await CineGenMuAPI.generateVideo('test prompt');

      expect(muapi.generateVideo).toHaveBeenCalledWith({ prompt: 'test prompt', model: 'wan2.1-text-to-video' });
    });
  });

  describe('generateImage', () => {
    it('should call muapi.generateImage with correct parameters', async () => {
      const mockResult = { url: 'test.jpg' };
      muapi.generateImage.mockResolvedValue(mockResult);

      const result = await CineGenMuAPI.generateImage('test prompt', 'flux-dev');

      expect(muapi.generateImage).toHaveBeenCalledWith({ prompt: 'test prompt', model: 'flux-dev' });
      expect(result).toBe(mockResult);
    });

    it('should use default model when not specified', async () => {
      const mockResult = { url: 'test.jpg' };
      muapi.generateImage.mockResolvedValue(mockResult);

      await CineGenMuAPI.generateImage('test prompt');

      expect(muapi.generateImage).toHaveBeenCalledWith({ prompt: 'test prompt', model: 'flux-dev' });
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