/**
 * Offline Integration Test
 * Tests complete offline functionality end-to-end
 */

import { MuapiClient } from '../src/lib/muapi.js';
import { LocalAIService } from '../src/lib/local-ai.js';

// Mock fetch for testing
global.fetch = async (url, options) => {
  // Simulate network failure for offline testing
  throw new Error('Network request failed - offline mode');
};

describe('Offline Integration Tests', () => {
  let muapiClient;
  let localAI;

  beforeEach(async () => {
    muapiClient = new MuapiClient();
    localAI = new LocalAIService();

    // Force offline mode
    muapiClient.setOfflineMode(true);

    await localAI.ensureInit();
  });

  test('MuapiClient should use offline mode when configured', () => {
    expect(muapiClient.offlineMode).toBe(true);
  });

  test('should generate images offline', async () => {
    const params = {
      prompt: 'a serene mountain landscape',
      aspect_ratio: '16:9',
      resolution: '1024x576',
      forceLocal: true // Force local processing
    };

    const result = await muapiClient.generateImage(params);

    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('width', 1024);
    expect(result).toHaveProperty('height', 576);
    expect(result.prompt).toBe(params.prompt);
    expect(result.model).toBe('local-text-to-image-v1');
  });

  test('should generate videos offline', async () => {
    const params = {
      prompt: 'a cat playing with yarn',
      duration: 3,
      resolution: '1024x576',
      forceLocal: true
    };

    const result = await muapiClient.generateVideo(params);

    expect(result).toHaveProperty('url');
    expect(result.duration).toBe(params.duration);
    expect(result.model).toBe('local-text-to-video-v1');
    expect(result.note).toContain('placeholder');
  });

  test('should process image-to-image offline', async () => {
    // Create a test image
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, 200, 200);
    }
    const imageUrl = canvas.toDataURL();

    const params = {
      model: 'image-to-image',
      image_url: imageUrl,
      prompt: 'make it green',
      strength: 0.7,
      forceLocal: true
    };

    const result = await muapiClient.generateI2I(params);

    expect(result).toHaveProperty('url');
    expect(result.prompt).toBe(params.prompt);
    expect(result.strength).toBe(params.strength);
  });

  test('should handle text generation offline', async () => {
    const params = {
      model: 'text',
      prompt: 'Write a short story about AI',
      temperature: 0.8,
      max_tokens: 200,
      forceLocal: true
    };

    const result = await muapiClient.generateText(params);

    expect(result).toHaveProperty('text');
    expect(result.prompt).toBe(params.prompt);
    expect(result.temperature).toBe(params.temperature);
    expect(result.tokens_used).toBeGreaterThan(0);
  });

  test('should process audio generation offline', async () => {
    const params = {
      model: 'audio',
      prompt: 'gentle piano music',
      duration: 20,
      style: 'classical',
      forceLocal: true
    };

    const result = await muapiClient.generateAudio(params);

    expect(result).toHaveProperty('url');
    expect(result.duration).toBe(params.duration);
    expect(result.style).toBe(params.style);
  });

  test('should handle offline video processing', async () => {
    const params = {
      task: 'video-processing',
      video_url: 'blob:test-video',
      action: 'stabilize',
      forceLocal: true
    };

    const result = await muapiClient.processVideo(params);

    expect(result.processed).toBe(true);
    expect(result.action).toBe(params.action);
  });

  test('should gracefully handle network failures', async () => {
    // Temporarily enable online mode to test network failure handling
    muapiClient.setOfflineMode(false);

    const params = {
      prompt: 'test image',
      forceLocal: false // Try to use network
    };

    // This should fail due to our mock fetch throwing an error
    await expect(muapiClient.generateImage(params)).rejects.toThrow('Network request failed');

    // Switch back to offline mode
    muapiClient.setOfflineMode(true);

    // Now it should work
    const result = await muapiClient.generateImage({ ...params, forceLocal: true });
    expect(result).toHaveProperty('url');
  });

  test('should detect offline mode automatically', () => {
    // Mock navigator.onLine as false
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

    const newClient = new MuapiClient();
    expect(newClient.offlineMode).toBe(true);
  });

  test('local AI should have all required models', () => {
    const availableModels = localAI.getAvailableModels();

    expect(availableModels).toContain('text-to-image');
    expect(availableModels).toContain('image-to-image');
    expect(availableModels).toContain('text-to-video');
    expect(availableModels).toContain('video-processing');
    expect(availableModels).toContain('audio-generation');
    expect(availableModels).toContain('text-generation');
  });

  test('should reject unknown AI models', async () => {
    await expect(localAI.processRequest('unknown-model-type', {})).rejects.toThrow();
  });

  test('should generate consistent mock data', async () => {
    const prompt1 = 'sunset over ocean';
    const prompt2 = 'sunset over ocean'; // Same prompt

    const result1 = await localAI.processRequest('text-to-image', { prompt: prompt1 });
    const result2 = await localAI.processRequest('text-to-image', { prompt: prompt2 });

    // Results should be different instances but have consistent structure
    expect(result1).toHaveProperty('url');
    expect(result2).toHaveProperty('url');
    expect(result1.url).not.toBe(result2.url); // Different blob URLs
    expect(result1.prompt).toBe(result2.prompt);
  });
});