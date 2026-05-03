import { describe, it, expect, vi } from 'vitest';
import { openaiConfig } from '../../src/lib/config/openaiConfig';

describe('OpenAI Configuration', () => {
  describe('API Key Validation', () => {
    it('should validate OPENAI_API_KEY environment variable', () => {
      // Test missing API key
      expect(() => openaiConfig.validateApiKey()).toThrow('OpenAI API key not configured');

      // Test valid API key (mock environment)
      const originalEnv = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'sk-test-key-123';
      expect(openaiConfig.validateApiKey()).toBe(true);
      process.env.OPENAI_API_KEY = originalEnv;
    });

    it('should return API key from environment', () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'sk-test-key';
      expect(openaiConfig.getApiKey()).toBe('sk-test-key');
      process.env.OPENAI_API_KEY = originalEnv;
    });

    it('should mask API key for logging', () => {
      expect(openaiConfig.maskApiKey('sk-1234567890abcdef')).toBe('sk-12345678...');
      expect(openaiConfig.maskApiKey('')).toBe('');
      expect(openaiConfig.maskApiKey(null)).toBe('');
    });
  });

  describe('Model Configuration', () => {
    it('should return default image model', () => {
      expect(openaiConfig.getImageModel()).toBe('gpt-image-2');
    });

    it('should allow model override', () => {
      const originalModel = openaiConfig.getImageModel();
      openaiConfig.setImageModel('gpt-image-1.5');
      expect(openaiConfig.getImageModel()).toBe('gpt-image-1.5');
      openaiConfig.setImageModel(originalModel);
    });

    it('should validate supported models', () => {
      const validModels = ['gpt-image-2', 'gpt-image-1.5', 'gpt-image-1', 'gpt-image-1-mini'];

      validModels.forEach(model => {
        expect(openaiConfig.isValidImageModel(model)).toBe(true);
      });

      expect(openaiConfig.isValidImageModel('invalid-model')).toBe(false);
    });
  });

  describe('Configuration Object', () => {
    it('should return complete configuration object', () => {
      const config = openaiConfig.getConfig();

      expect(config).toHaveProperty('apiKey');
      expect(config).toHaveProperty('imageModel');
      expect(config).toHaveProperty('baseURL');
      expect(config).toHaveProperty('timeout');
      expect(config).toHaveProperty('maxRetries');
    });

    it('should have default timeout settings', () => {
      const config = openaiConfig.getConfig();
      expect(config.timeout).toBeGreaterThan(0);
      expect(config.maxRetries).toBeGreaterThan(0);
    });
  });
});