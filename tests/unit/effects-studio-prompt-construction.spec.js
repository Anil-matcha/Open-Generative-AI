import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('EffectsStudio Template Prompt Construction', () => {
  const mockTemplate = {
    id: 'tiktok-video',
    name: 'TikTok Video Creator',
    inputs: [
      { name: 'image_url', type: 'image', label: 'Upload your photo' },
      { name: 'prompt', type: 'text', label: 'Describe the video' },
      { name: 'name', type: 'select', label: 'Effect', options: ['360 Rotation', 'Cakeify'] }
    ],
    basePrompt: '{prompt}, TikTok video format, vertical 9:16, trending content, viral style, Gen Z aesthetic, mobile-optimized, engaging, share-worthy, 4K quality'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Base Prompt Variable Replacement', () => {
    it('should replace {prompt} variable with user input', () => {
      const userInputs = { prompt: 'dancing in the rain' };
      const result = constructPrompt(mockTemplate, userInputs);

      expect(result).toContain('dancing in the rain');
      expect(result).toContain('TikTok video format');
    });

    it('should handle multiple variable replacements', () => {
      const templateWithMultipleVars = {
        ...mockTemplate,
        basePrompt: '{prompt} with {effect} effect in {style} style'
      };
      const userInputs = {
        prompt: 'person walking',
        effect: '360 rotation',
        style: 'cinematic'
      };

      const result = constructPrompt(templateWithMultipleVars, userInputs);

      expect(result).toBe('person walking with 360 rotation effect in cinematic style');
    });

    it('should handle empty or undefined variables gracefully', () => {
      const userInputs = { prompt: '' };
      const result = constructPrompt(mockTemplate, userInputs);

      expect(result).toContain(', TikTok video format'); // Empty prompt leaves placeholder
    });

    it('should preserve base prompt structure when variables are missing', () => {
      const userInputs = {}; // No inputs provided
      const result = constructPrompt(mockTemplate, userInputs);

      expect(result).toBe(mockTemplate.basePrompt); // Unchanged base prompt
    });
  });

  describe('Prompt Enhancement and Processing', () => {
    it('should apply template-specific prompt enhancements', () => {
      const enhancedTemplate = {
        ...mockTemplate,
        enhancements: ['add trending hashtags', 'optimize for mobile']
      };
      const userInputs = { prompt: 'cool dance move' };

      const result = constructPrompt(enhancedTemplate, userInputs);

      expect(result).toContain('cool dance move');
      expect(result).toContain('#TikTok');
      expect(result).toContain('mobile-optimized');
    });

    it('should handle effect-specific prompt modifications', () => {
      const effectTemplate = {
        ...mockTemplate,
        effectPrompts: {
          '360 Rotation': 'spinning camera movement',
          'Cakeify': 'colorful animated style'
        }
      };

      const userInputs = { prompt: 'person', name: 'Cakeify' };
      const result = constructPrompt(effectTemplate, userInputs);

      expect(result).toContain('person');
      expect(result).toContain('colorful animated style');
    });

    it('should maintain prompt length limits', () => {
      const longPrompt = 'A'.repeat(1000);
      const userInputs = { prompt: longPrompt };

      const result = constructPrompt(mockTemplate, userInputs);

      expect(result.length).toBeLessThan(2000); // Reasonable limit
      expect(result).toContain('TikTok video format'); // Base prompt preserved
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed template basePrompt', () => {
      const badTemplate = {
        ...mockTemplate,
        basePrompt: '{unclosed_variable'
      };
      const userInputs = { prompt: 'test' };

      const result = constructPrompt(badTemplate, userInputs);

      // Should not crash, return some reasonable result
      expect(typeof result).toBe('string');
    });

    it('should handle special characters in user inputs', () => {
      const userInputs = {
        prompt: 'test with "quotes" and \'apostrophes\' and <tags> & symbols'
      };

      const result = constructPrompt(mockTemplate, userInputs);

      expect(result).toContain('test with "quotes" and \'apostrophes\' and <tags> & symbols');
      expect(result).toContain('TikTok video format');
    });

    it('should sanitize potentially harmful input', () => {
      const userInputs = {
        prompt: '<script>alert("xss")</script> normal text'
      };

      const result = constructPrompt(mockTemplate, userInputs);

      // Should sanitize or escape harmful content
      expect(result).not.toContain('<script>');
      expect(result).toContain('normal text');
    });
  });
});

// Mock implementation of prompt construction logic
function constructPrompt(template, userInputs) {
  let prompt = template.basePrompt;

  // Replace variables in the format {variableName}
  Object.keys(userInputs).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    prompt = prompt.replace(regex, userInputs[key] || '');
  });

  // Apply effect-specific enhancements if available
  if (template.effectPrompts && userInputs.name && template.effectPrompts[userInputs.name]) {
    prompt += `, ${template.effectPrompts[userInputs.name]}`;
  }

  // Apply general enhancements if available
  if (template.enhancements) {
    template.enhancements.forEach(enhancement => {
      prompt += `, ${enhancement}`;
    });
  }

  return prompt;
}