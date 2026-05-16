/**
 * Input Validation Utilities
 * Validates all user inputs to prevent injection attacks and data corruption
 */

import { validateURL, validateFileUpload } from './security/index.js';

const MAX_PROMPT_LENGTH = 4096;
const MAX_URL_LENGTH = 2048;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export const InputValidator = {
  validatePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw new Error(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`);
    }
    if (prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }
    return prompt.trim();
  },

  validateImageUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }
    if (url.length > MAX_URL_LENGTH) {
      throw new Error(`URL exceeds maximum length of ${MAX_URL_LENGTH} characters`);
    }
    const parsed = new URL(url);
    if (!['https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTPS URLs are allowed for security reasons');
    }
    return url;
  },

  validateFileSize(file, maxSizeMB = 10) {
    if (!file) {
      throw new Error('File is required');
    }
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }
    return true;
  },

  validateFileType(file, allowedTypes) {
    if (!file) {
      throw new Error('File is required');
    }
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
    return true;
  },

  validateNumericParam(value, name, min, max) {
    if (value === undefined || value === null) {
      return undefined;
    }
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`${name} must be a number`);
    }
    if (num < min || num > max) {
      throw new Error(`${name} must be between ${min} and ${max}`);
    }
    return num;
  },

  validateGuidanceScale(value) {
    return this.validateNumericParam(value, 'guidanceScale', 1, 20);
  },

  validateSteps(value) {
    return this.validateNumericParam(value, 'steps', 1, 200);
  },

  validateSeed(value) {
    if (value === undefined || value === null) return undefined;
    const num = Number(value);
    if (isNaN(num)) throw new Error('Seed must be a number');
    if (num < 0 || num > 2147483647) throw new Error('Seed must be between 0 and 2147483647');
    return Math.floor(num);
  },

  validateImageSize(width, height) {
    const validSizes = ['256x256', '512x512', '1024x1024', '1152x896', '1536x896', '1792x1024', '768x1344'];
    const size = `${width}x${height}`;
    if (!validSizes.includes(size)) {
      throw new Error(`Image size ${size} is not supported. Valid sizes: ${validSizes.join(', ')}`);
    }
    return size;
  },

  validateVideoParams(params) {
    const validated = {};
    
    if (params.width && params.height) {
      validated.size = this.validateImageSize(params.width, params.height);
    }
    
    if (params.guidance_scale !== undefined) {
      validated.guidance_scale = this.validateGuidanceScale(params.guidance_scale);
    }
    
    if (params.steps !== undefined) {
      validated.steps = this.validateSteps(params.steps);
    }
    
    if (params.seed !== undefined) {
      validated.seed = this.validateSeed(params.seed);
    }
    
    if (params.prompt !== undefined) {
      validated.prompt = this.validatePrompt(params.prompt);
    }
    
    return validated;
  }
};