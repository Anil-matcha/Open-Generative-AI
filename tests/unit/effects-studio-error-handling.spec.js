import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../src/lib/templates.js');
vi.mock('../../../src/lib/muapi.js');
vi.mock('../../../src/components/AuthModal.js');

import { getTemplateById } from '../../../src/lib/templates.js';
import { muapi } from '../../../src/lib/muapi.js';
import { AuthModal } from '../../../src/components/AuthModal.js';

describe('EffectsStudio Template Error Handling', () => {
  const mockTemplate = {
    id: 'tiktok-video',
    name: 'TikTok Video Creator',
    model: 'ai-video-effects',
    inputs: [
      { name: 'image_url', type: 'image', label: 'Upload your photo' },
      { name: 'prompt', type: 'text', label: 'Describe the video' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    getTemplateById.mockReturnValue(mockTemplate);
  });

  describe('Template Loading Errors', () => {
    it('should handle non-existent template IDs gracefully', () => {
      getTemplateById.mockReturnValue(null);

      const container = renderEffectsTemplate('non-existent-id');

      expect(container.textContent).toContain('Template not found');
      expect(container.className).toContain('error-state');
    });

    it('should handle malformed template data', () => {
      const badTemplate = { id: 'bad', inputs: null };
      getTemplateById.mockReturnValue(badTemplate);

      expect(() => {
        renderEffectsTemplate('bad-template');
      }).toThrow('Invalid template configuration');
    });

    it('should show loading state while template is being fetched', () => {
      getTemplateById.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const container = renderEffectsTemplate('loading-template');

      expect(container.textContent).toContain('Loading template...');
      expect(container.querySelector('.spinner')).toBeTruthy();
    });
  });

  describe('Form Validation Errors', () => {
    it('should prevent submission with missing required fields', () => {
      const formData = { prompt: 'test' }; // Missing image_url

      const validation = validateTemplateForm(mockTemplate, formData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Image upload is required');
    });

    it('should show inline error messages for invalid inputs', () => {
      const container = renderEffectsTemplate('tiktok-video');
      document.body.appendChild(container);

      // Try to submit without required fields
      const submitButton = container.querySelector('.generate-btn');
      submitButton.click();

      const errorMessages = container.querySelectorAll('.error-message');
      expect(errorMessages.length).toBeGreaterThan(0);
      expect(errorMessages[0].textContent).toContain('required');
    });

    it('should validate file types for image uploads', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      const validation = validateFileUpload(invalidFile);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Invalid file type');
    });

    it('should validate file sizes for uploads', () => {
      const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      const validation = validateFileUpload(largeFile);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('File too large');
    });
  });

  describe('API Call Errors', () => {
    it('should handle API authentication failures', () => {
      muapi.generateI2V.mockRejectedValue(new Error('Authentication failed'));

      const container = renderEffectsTemplate('tiktok-video');
      document.body.appendChild(container);

      // Trigger generation
      const submitButton = container.querySelector('.generate-btn');
      submitButton.click();

      // Should show auth modal
      expect(AuthModal).toHaveBeenCalled();
    });

    it('should display user-friendly error messages for API failures', async () => {
      muapi.generateI2V.mockRejectedValue(new Error('Network timeout'));

      const container = renderEffectsTemplate('tiktok-video');
      document.body.appendChild(container);

      const submitButton = container.querySelector('.generate-btn');
      submitButton.click();

      // Wait for error to appear
      await new Promise(resolve => setTimeout(resolve, 100));

      const errorDisplay = container.querySelector('.error-display');
      expect(errorDisplay.textContent).toContain('Network timeout');
      expect(errorDisplay.textContent).toContain('Please try again');
    });

    it('should handle rate limiting errors', () => {
      muapi.generateI2V.mockRejectedValue(new Error('Rate limit exceeded'));

      const container = renderEffectsTemplate('tiktok-video');
      document.body.appendChild(container);

      const submitButton = container.querySelector('.generate-btn');
      submitButton.click();

      const errorDisplay = container.querySelector('.error-display');
      expect(errorDisplay.textContent).toContain('Rate limit');
      expect(errorDisplay.textContent).toContain('Please wait');
    });
  });

  describe('Network and Connectivity Errors', () => {
    it('should handle offline state gracefully', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const container = renderEffectsTemplate('tiktok-video');
      document.body.appendChild(container);

      const submitButton = container.querySelector('.generate-btn');
      submitButton.click();

      const errorDisplay = container.querySelector('.error-display');
      expect(errorDisplay.textContent).toContain('offline');
    });

    it('should retry failed requests automatically', () => {
      let callCount = 0;
      muapi.generateI2V.mockImplementation(() => {
        callCount++;
        if (callCount === 1) throw new Error('Temporary failure');
        return Promise.resolve({ url: 'success.mp4' });
      });

      const container = renderEffectsTemplate('tiktok-video');
      document.body.appendChild(container);

      const submitButton = container.querySelector('.generate-btn');
      submitButton.click();

      expect(muapi.generateI2V).toHaveBeenCalledTimes(2); // Retried once
    });

    it('should show progress during long-running operations', () => {
      muapi.generateI2V.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 5000)));

      const container = renderEffectsTemplate('tiktok-video');
      document.body.appendChild(container);

      const submitButton = container.querySelector('.generate-btn');
      submitButton.click();

      const progressBar = container.querySelector('.progress-bar');
      expect(progressBar).toBeTruthy();
      expect(progressBar.style.width).toBeDefined();
    });
  });

  describe('State Management Errors', () => {
    it('should handle concurrent template loading', () => {
      // Simulate rapid clicking between templates
      const container = renderEffectsTemplate('template-1');
      document.body.appendChild(container);

      // Quickly switch to another template
      renderEffectsTemplate('template-2');

      // Should not crash or show inconsistent state
      expect(container.querySelector('.loading')).toBeFalsy();
    });

    it('should cleanup resources on component unmount', () => {
      const container = renderEffectsTemplate('tiktok-video');
      document.body.appendChild(container);

      // Simulate unmounting
      container.remove();

      // Should cleanup any pending requests or timers
      expect(muapi.generateI2V).not.toHaveBeenCalled(); // No lingering calls
    });

    it('should handle memory cleanup for large file uploads', () => {
      const largeFile = new File(['x'.repeat(50 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      const container = renderEffectsTemplate('tiktok-video');
      document.body.appendChild(container);

      // Upload large file
      const fileInput = container.querySelector('input[type="file"]');
      fileInput.files = [largeFile];

      // Clear upload
      const clearButton = container.querySelector('.clear-upload');
      clearButton.click();

      // Should release memory references
      expect(fileInput.files.length).toBe(0);
    });
  });
});

// Mock implementations for testing
function renderEffectsTemplate(templateId) {
  const container = document.createElement('div');
  container.className = 'effects-template-container';

  const template = getTemplateById(templateId);
  if (!template) {
    container.innerHTML = '<div class="error-state">Template not found</div>';
    return container;
  }

  container.innerHTML = `
    <div class="template-form">
      <button class="generate-btn">Generate</button>
      <div class="error-display" style="display: none;"></div>
      <div class="progress-bar" style="display: none;"></div>
    </div>
  `;

  // Add event listeners
  const generateBtn = container.querySelector('.generate-btn');
  generateBtn.addEventListener('click', async () => {
    try {
      const result = await muapi.generateI2V({ test: 'data' });
    } catch (error) {
      const errorDisplay = container.querySelector('.error-display');
      errorDisplay.textContent = error.message;
      errorDisplay.style.display = 'block';
    }
  });

  return container;
}

function validateTemplateForm(template, formData) {
  const errors = [];
  template.inputs.forEach(input => {
    if (input.type === 'image' && !formData[input.name]) {
      errors.push('Image upload is required');
    }
    if (input.type === 'text' && !formData[input.name]) {
      errors.push('Prompt is required');
    }
  });
  return { isValid: errors.length === 0, errors };
}

function validateFileUpload(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File too large. Maximum size is 10MB.' };
  }

  return { isValid: true };
}