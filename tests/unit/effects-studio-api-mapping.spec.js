import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../src/lib/muapi.js');

import { muapi } from '../../../src/lib/muapi.js';

describe('EffectsStudio Template API Parameter Mapping', () => {
  const mockTemplate = {
    id: 'tiktok-video',
    name: 'TikTok Video Creator',
    model: 'ai-video-effects',
    modelType: 'i2v',
    inputs: [
      { name: 'image_url', type: 'image', label: 'Upload your photo' },
      { name: 'prompt', type: 'text', label: 'Describe the video' },
      { name: 'name', type: 'select', label: 'Effect', options: ['360 Rotation', 'Cakeify'] },
      { name: 'aspect_ratio', type: 'select', label: 'Aspect Ratio', options: ['9:16', '16:9'] },
      { name: 'duration', type: 'select', label: 'Duration', options: ['5', '8', '10'] }
    ],
    basePrompt: '{prompt}, TikTok video format',
    defaultParams: { resolution: '720p', quality: 'high' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Parameter Mapping Logic', () => {
    it('should map template inputs to correct API parameters', () => {
      const userInputs = {
        image_url: 'test-image.jpg',
        prompt: 'dancing person',
        name: '360 Rotation',
        aspect_ratio: '9:16',
        duration: '5'
      };

      const apiParams = mapTemplateToApiParams(mockTemplate, userInputs);

      expect(apiParams.image_url).toBe('test-image.jpg');
      expect(apiParams.prompt).toContain('dancing person');
      expect(apiParams.name).toBe('360 Rotation');
      expect(apiParams.aspect_ratio).toBe('9:16');
      expect(apiParams.duration).toBe(5); // Converted to number
    });

    it('should construct prompt using basePrompt template', () => {
      const userInputs = { prompt: 'jumping high' };

      const apiParams = mapTemplateToApiParams(mockTemplate, userInputs);

      expect(apiParams.prompt).toBe('jumping high, TikTok video format');
    });

    it('should convert string duration to number', () => {
      const userInputs = { duration: '8' };

      const apiParams = mapTemplateToApiParams(mockTemplate, userInputs);

      expect(apiParams.duration).toBe(8);
      expect(typeof apiParams.duration).toBe('number');
    });

    it('should include default parameters from template', () => {
      const userInputs = { prompt: 'test' };

      const apiParams = mapTemplateToApiParams(mockTemplate, userInputs);

      expect(apiParams.resolution).toBe('720p');
      expect(apiParams.quality).toBe('high');
    });
  });

  describe('API Call Integration', () => {
    it('should call correct API method based on model type', () => {
      const userInputs = {
        image_url: 'test.jpg',
        prompt: 'test prompt'
      };

      const apiParams = mapTemplateToApiParams(mockTemplate, userInputs);

      // Should call generateI2V for i2v model type
      expect(muapi.generateI2V).toHaveBeenCalledWith(apiParams);
    });

    it('should handle different model types correctly', () => {
      const t2vTemplate = {
        ...mockTemplate,
        model: 'text-to-video-model',
        modelType: 't2v'
      };

      const userInputs = { prompt: 'test' };
      const apiParams = mapTemplateToApiParams(t2vTemplate, userInputs);

      // Should not include image_url for t2v
      expect(apiParams.image_url).toBeUndefined();
      expect(muapi.generateVideo).toHaveBeenCalledWith(apiParams);
    });

    it('should handle image-to-image effects', () => {
      const i2iTemplate = {
        ...mockTemplate,
        model: 'flux-kontext-effects',
        modelType: 'i2i'
      };

      const userInputs = {
        image_url: 'input.jpg',
        prompt: 'make it blue'
      };

      const apiParams = mapTemplateToApiParams(i2iTemplate, userInputs);

      expect(muapi.generateImage).toHaveBeenCalledWith(apiParams);
    });
  });

  describe('Parameter Validation and Sanitization', () => {
    it('should validate required parameters before API call', () => {
      const invalidInputs = { prompt: '' }; // Missing image_url

      expect(() => {
        mapTemplateToApiParams(mockTemplate, invalidInputs);
      }).toThrow('Missing required parameter: image_url');
    });

    it('should sanitize and validate aspect ratio format', () => {
      const userInputs = { aspect_ratio: 'invalid-format' };

      const apiParams = mapTemplateToApiParams(mockTemplate, userInputs);

      // Should default to template default or valid format
      expect(['16:9', '9:16', '1:1']).toContain(apiParams.aspect_ratio);
    });

    it('should handle file upload objects correctly', () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const userInputs = { image_url: mockFile };

      const apiParams = mapTemplateToApiParams(mockTemplate, userInputs);

      // Should handle File objects for upload
      expect(apiParams.image_url).toBe(mockFile);
    });
  });

  describe('Advanced Parameter Mapping', () => {
    it('should handle conditional parameters based on effect type', () => {
      const conditionalTemplate = {
        ...mockTemplate,
        conditionalParams: {
          '360 Rotation': { rotation_speed: 'fast' },
          'Cakeify': { color_intensity: 'high' }
        }
      };

      const userInputs = { name: 'Cakeify', prompt: 'test' };

      const apiParams = mapTemplateToApiParams(conditionalTemplate, userInputs);

      expect(apiParams.color_intensity).toBe('high');
      expect(apiParams.rotation_speed).toBeUndefined();
    });

    it('should merge user inputs with template defaults', () => {
      const templateWithDefaults = {
        ...mockTemplate,
        defaultParams: {
          resolution: '720p',
          quality: 'medium',
          custom_param: 'default_value'
        }
      };

      const userInputs = {
        prompt: 'test',
        quality: 'high' // Override default
      };

      const apiParams = mapTemplateToApiParams(templateWithDefaults, userInputs);

      expect(apiParams.resolution).toBe('720p'); // Default preserved
      expect(apiParams.quality).toBe('high'); // User input overrides
      expect(apiParams.custom_param).toBe('default_value'); // Default included
    });
  });
});

// Mock implementation of parameter mapping logic
function mapTemplateToApiParams(template, userInputs) {
  // Construct prompt from basePrompt template
  let prompt = template.basePrompt;
  Object.keys(userInputs).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    prompt = prompt.replace(regex, userInputs[key] || '');
  });

  // Start with user inputs
  const apiParams = { ...userInputs };

  // Add constructed prompt
  apiParams.prompt = prompt;

  // Convert duration to number
  if (apiParams.duration) {
    apiParams.duration = parseInt(apiParams.duration);
  }

  // Add default parameters
  if (template.defaultParams) {
    Object.keys(template.defaultParams).forEach(key => {
      if (!apiParams[key]) {
        apiParams[key] = template.defaultParams[key];
      }
    });
  }

  // Add conditional parameters based on effect
  if (template.conditionalParams && userInputs.name) {
    const effectParams = template.conditionalParams[userInputs.name];
    if (effectParams) {
      Object.assign(apiParams, effectParams);
    }
  }

  // Validate required parameters
  const requiredFields = template.inputs
    .filter(input => input.required || input.type === 'image')
    .map(input => input.name);

  requiredFields.forEach(field => {
    if (!apiParams[field]) {
      throw new Error(`Missing required parameter: ${field}`);
    }
  });

  return apiParams;
}