import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../src/lib/templates.js', () => ({
  templates: [],
  TEMPLATE_CATEGORIES: {}
}));
vi.mock('../../../src/lib/thumbnails.js', () => ({
  getTemplateThumbnail: vi.fn()
}));
vi.mock('../../../src/lib/router.js', () => ({
  navigate: vi.fn()
}));
vi.mock('../../../src/components/AuthModal.js');
vi.mock('../../../src/components/UploadPicker.js');
vi.mock('../../../src/lib/muapi.js');
vi.mock('../../../src/lib/models.js', () => ({
  i2iModels: [],
  i2vModels: []
}));
vi.mock('../../../src/lib/muapiConfig.js', () => ({
  PIXVERSE_ADVANCED_EFFECTS: {}
}));
vi.mock('../../../src/lib/thumbnails.js');
vi.mock('../../../src/components/MediaPreview.js', () => ({
  createMediaPreview: vi.fn(() => ({ element: document.createElement('div') }))
}));
vi.mock('../../../src/components/InlineInstructions.js', () => ({
  createInlineInstructions: vi.fn(() => document.createElement('div'))
}));
vi.mock('../../../src/lib/muapiEnhanced.js', () => ({
  applyPixverseAdvancedEffect: vi.fn()
}));

import { EffectsStudio } from '../../../src/components/EffectsStudio.js';
import { templates } from '../../../src/lib/templates.js';
import { getTemplateThumbnail } from '../../../src/lib/thumbnails.js';
import { navigate } from '../../../src/lib/router.js';
import { AuthModal } from '../../../src/components/AuthModal.js';
import { createUploadPicker } from '../../../src/components/UploadPicker.js';
import { muapi } from '../../../src/lib/muapi.js';

describe('EffectsStudio Template Integration', () => {
  const mockEffectsTemplates = [
    {
      id: 'tiktok-video',
      name: 'TikTok Video Creator',
      description: 'Create viral 9:16 videos with trending effects',
      category: 'Social Media',
      icon: '🎵',
      outputType: 'video',
      model: 'ai-video-effects',
      modelType: 'i2v',
      aspectRatio: '9:16',
      inputs: [
        { name: 'image_url', type: 'image', label: 'Upload your photo' },
        { name: 'prompt', type: 'text', label: 'Describe the video', placeholder: 'e.g. dancing in the rain' },
        { name: 'name', type: 'select', label: 'Effect', options: ['360 Rotation', 'Cakeify', 'Disney Princess It'] },
        { name: 'aspect_ratio', type: 'select', label: 'Aspect Ratio', options: ['9:16', '16:9'] },
        { name: 'duration', type: 'select', label: 'Duration', options: ['5', '8', '10'] }
      ],
      basePrompt: '{prompt}, TikTok video format, vertical 9:16, trending content, viral style'
    },
    {
      id: 'instagram-reel',
      name: 'Instagram Reel Generator',
      description: 'Aesthetic reels with cinematic motion',
      category: 'Social Media',
      icon: '📸',
      outputType: 'video',
      model: 'motion-controls',
      modelType: 'i2v',
      aspectRatio: '9:16',
      inputs: [
        { name: 'image_url', type: 'image', label: 'Upload your photo' },
        { name: 'prompt', type: 'text', label: 'Describe the scene' },
        { name: 'name', type: 'select', label: 'Camera Motion', options: ['Dolly In', 'Dolly Zoom In'] }
      ],
      basePrompt: '{prompt}, Instagram Reel format, cinematic motion'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    // Mock templates to return effects templates
    templates.length = 0;
    mockEffectsTemplates.forEach(template => templates.push(template));
  });

  describe('Templates Tab', () => {
    it('should render Templates tab alongside existing effect tabs', () => {
      const container = EffectsStudio();
      document.body.appendChild(container);

      const tabs = container.querySelectorAll('.tab-button');
      expect(tabs.length).toBe(9); // 8 original + 1 Templates tab

      const templatesTab = Array.from(tabs).find(tab => tab.textContent.includes('Templates'));
      expect(templatesTab).toBeTruthy();
    });

    it('should filter and display only effects-related templates', () => {
      const container = EffectsStudio();
      document.body.appendChild(container);

      // Click Templates tab
      const templatesTab = Array.from(container.querySelectorAll('.tab-button'))
        .find(tab => tab.textContent.includes('Templates'));
      templatesTab.click();

      // Should show effects templates
      const templateCards = container.querySelectorAll('.template-card');
      expect(templateCards.length).toBe(2); // TikTok and Instagram templates
    });

    it('should display templates grouped by category', () => {
      const container = EffectsStudio();
      document.body.appendChild(container);

      const templatesTab = Array.from(container.querySelectorAll('.tab-button'))
        .find(tab => tab.textContent.includes('Templates'));
      templatesTab.click();

      const categories = container.querySelectorAll('.template-category');
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0].textContent).toContain('Social Media');
    });
  });

  describe('Template Selection', () => {
    it('should navigate to template creation route when template is clicked', () => {
      const container = EffectsStudio();
      document.body.appendChild(container);

      // Click Templates tab
      const templatesTab = Array.from(container.querySelectorAll('.tab-button'))
        .find(tab => tab.textContent.includes('Templates'));
      templatesTab.click();

      // Click on a template
      const templateCard = container.querySelector('.template-card');
      templateCard.click();

      expect(navigate).toHaveBeenCalledWith('effects/template/tiktok-video');
    });

    it('should display template thumbnails correctly', () => {
      getTemplateThumbnail.mockReturnValue('/thumbnails/tiktok.png');

      const container = EffectsStudio();
      document.body.appendChild(container);

      const templatesTab = Array.from(container.querySelectorAll('.tab-button'))
        .find(tab => tab.textContent.includes('Templates'));
      templatesTab.click();

      const thumbnail = container.querySelector('.template-thumbnail');
      expect(thumbnail).toBeTruthy();
      expect(thumbnail.src).toContain('/thumbnails/tiktok.png');
    });
  });

  describe('Template Filtering', () => {
    it('should only show templates with effects-related models', () => {
      // Add a non-effects template
      templates.push({
        id: 'non-effects',
        name: 'Regular Template',
        model: 'text-to-image',
        category: 'General'
      });

      const container = EffectsStudio();
      document.body.appendChild(container);

      const templatesTab = Array.from(container.querySelectorAll('.tab-button'))
        .find(tab => tab.textContent.includes('Templates'));
      templatesTab.click();

      const templateCards = container.querySelectorAll('.template-card');
      expect(templateCards.length).toBe(2); // Should exclude non-effects template
    });

    it('should include templates from all effects model types', () => {
      // Add templates from different effect models
      templates.push({
        id: 'explosion-effect',
        name: 'Explosion Effect',
        model: 'video-effects',
        category: 'VFX'
      });

      const container = EffectsStudio();
      document.body.appendChild(container);

      const templatesTab = Array.from(container.querySelectorAll('.tab-button'))
        .find(tab => tab.textContent.includes('Templates'));
      templatesTab.click();

      const templateCards = container.querySelectorAll('.template-card');
      expect(templateCards.length).toBe(3); // Should include explosion effect
    });
  });
});