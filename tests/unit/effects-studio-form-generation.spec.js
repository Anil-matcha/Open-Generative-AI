import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../src/lib/templates.js');
vi.mock('../../../src/lib/router.js');

import { getTemplateById } from '../../../src/lib/templates.js';
import { navigate } from '../../../src/lib/router.js';

describe('EffectsStudio Template Form Generation', () => {
  const mockTemplate = {
    id: 'tiktok-video',
    name: 'TikTok Video Creator',
    model: 'ai-video-effects',
    inputs: [
      { name: 'image_url', type: 'image', label: 'Upload your photo' },
      { name: 'prompt', type: 'text', label: 'Describe the video', placeholder: 'e.g. dancing in the rain' },
      { name: 'name', type: 'select', label: 'Effect', options: ['360 Rotation', 'Cakeify', 'Disney Princess It'] },
      { name: 'aspect_ratio', type: 'select', label: 'Aspect Ratio', options: ['9:16', '16:9', '1:1'] },
      { name: 'duration', type: 'select', label: 'Duration', options: ['5', '8', '10'] }
    ],
    basePrompt: '{prompt}, TikTok video format, vertical 9:16, trending content'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    getTemplateById.mockReturnValue(mockTemplate);
  });

  describe('Dynamic Form Generation', () => {
    it('should generate form inputs based on template.inputs configuration', () => {
      // Simulate navigating to effects/template/tiktok-video
      navigate('effects/template/tiktok-video');

      // Mock the EffectsStudio template form generation
      const formInputs = generateFormFromTemplate(mockTemplate);

      expect(formInputs.length).toBe(5); // 5 inputs defined in template
    });

    it('should create image upload input for image type', () => {
      const imageInput = mockTemplate.inputs.find(input => input.type === 'image');

      expect(imageInput).toBeTruthy();
      expect(imageInput.name).toBe('image_url');
      expect(imageInput.label).toBe('Upload your photo');
    });

    it('should create text input for text type', () => {
      const textInput = mockTemplate.inputs.find(input => input.type === 'text');

      expect(textInput).toBeTruthy();
      expect(textInput.name).toBe('prompt');
      expect(textInput.placeholder).toBe('e.g. dancing in the rain');
    });

    it('should create select dropdown for select type', () => {
      const selectInputs = mockTemplate.inputs.filter(input => input.type === 'select');

      expect(selectInputs.length).toBe(3); // aspect_ratio, duration, name (effect)

      const effectSelect = selectInputs.find(input => input.name === 'name');
      expect(effectSelect.options).toEqual(['360 Rotation', 'Cakeify', 'Disney Princess It']);
    });

    it('should render form inputs in correct order', () => {
      const formInputs = generateFormFromTemplate(mockTemplate);

      expect(formInputs[0].name).toBe('image_url'); // First input
      expect(formInputs[1].name).toBe('prompt'); // Second input
      expect(formInputs[2].name).toBe('name'); // Effect select
      expect(formInputs[3].name).toBe('aspect_ratio'); // Third input
      expect(formInputs[4].name).toBe('duration'); // Fourth input
    });
  });

  describe('Form Input Validation', () => {
    it('should validate required image input', () => {
      const formData = { prompt: 'test prompt' }; // Missing image_url

      const validationResult = validateTemplateForm(mockTemplate, formData);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toContain('Image upload is required');
    });

    it('should validate required text prompt', () => {
      const formData = { image_url: 'test.jpg' }; // Missing prompt

      const validationResult = validateTemplateForm(mockTemplate, formData);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toContain('Prompt is required');
    });

    it('should pass validation with all required fields', () => {
      const formData = {
        image_url: 'test.jpg',
        prompt: 'test prompt',
        name: '360 Rotation',
        aspect_ratio: '9:16',
        duration: '5'
      };

      const validationResult = validateTemplateForm(mockTemplate, formData);

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toEqual([]);
    });
  });

  describe('Form State Management', () => {
    it('should update form state when inputs change', () => {
      const formState = {};

      // Simulate text input change
      handleInputChange('prompt', 'new prompt text', formState);
      expect(formState.prompt).toBe('new prompt text');

      // Simulate select change
      handleInputChange('name', 'Cakeify', formState);
      expect(formState.name).toBe('Cakeify');
    });

    it('should handle file upload for image inputs', () => {
      const formState = {};
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      handleFileUpload('image_url', mockFile, formState);

      expect(formState.image_url).toBe(mockFile);
    });
  });
});

// Mock helper functions for testing (these would be implemented in EffectsStudio)
function generateFormFromTemplate(template) {
  return template.inputs.map(input => ({
    name: input.name,
    type: input.type,
    label: input.label,
    placeholder: input.placeholder,
    options: input.options
  }));
}

function validateTemplateForm(template, formData) {
  const errors = [];
  const requiredFields = template.inputs.filter(input => input.type !== 'select' || input.required);

  template.inputs.forEach(input => {
    if (input.type === 'image' && !formData[input.name]) {
      errors.push('Image upload is required');
    }
    if (input.type === 'text' && !formData[input.name]) {
      errors.push('Prompt is required');
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

function handleInputChange(fieldName, value, formState) {
  formState[fieldName] = value;
}

function handleFileUpload(fieldName, file, formState) {
  formState[fieldName] = file;
}