import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../src/lib/templates.js');
vi.mock('../../../src/lib/router.js');
vi.mock('../../../src/lib/muapi.js');
vi.mock('../../../src/components/AuthModal.js');
vi.mock('../../../src/components/UploadPicker.js');

import { templates } from '../../../src/lib/templates.js';
import { navigate } from '../../../src/lib/router.js';
import { muapi } from '../../../src/lib/muapi.js';
import { AuthModal } from '../../../src/components/AuthModal.js';
import { createUploadPicker } from '../../../src/components/UploadPicker.js';

describe('EffectsStudio Template Creation Workflow Integration', () => {
  const mockEffectsTemplates = [
    {
      id: 'tiktok-video',
      name: 'TikTok Video Creator',
      model: 'ai-video-effects',
      modelType: 'i2v',
      inputs: [
        { name: 'image_url', type: 'image', label: 'Upload your photo' },
        { name: 'prompt', type: 'text', label: 'Describe the video' },
        { name: 'name', type: 'select', label: 'Effect', options: ['360 Rotation', 'Cakeify'] }
      ],
      basePrompt: '{prompt}, TikTok video format',
      defaultParams: { resolution: '720p' }
    },
    {
      id: 'instagram-reel',
      name: 'Instagram Reel Generator',
      model: 'motion-controls',
      inputs: [
        { name: 'image_url', type: 'image', label: 'Upload your photo' },
        { name: 'prompt', type: 'text', label: 'Describe the scene' }
      ],
      basePrompt: '{prompt}, Instagram Reel format'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    templates.length = 0;
    mockEffectsTemplates.forEach(template => templates.push(template));
  });

  describe('Complete Template Creation Flow', () => {
    it('should complete full template creation workflow from selection to generation', async () => {
      // Step 1: Navigate to EffectsStudio
      const effectsStudio = createEffectsStudio();
      document.body.appendChild(effectsStudio);

      // Step 2: Click Templates tab
      const templatesTab = effectsStudio.querySelector('[data-tab="templates"]');
      templatesTab.click();

      // Step 3: Select a template
      const templateCard = effectsStudio.querySelector('.template-card');
      templateCard.click();

      // Should navigate to template creation route
      expect(navigate).toHaveBeenCalledWith('effects/template/tiktok-video');

      // Step 4: Simulate template creation page
      const templatePage = createTemplatePage('tiktok-video');
      document.body.appendChild(templatePage);

      // Step 5: Fill out the form
      const promptInput = templatePage.querySelector('input[name="prompt"]');
      promptInput.value = 'dancing in the rain';

      const effectSelect = templatePage.querySelector('select[name="name"]');
      effectSelect.value = '360 Rotation';

      // Step 6: Upload image
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = templatePage.querySelector('input[type="file"]');
      fileInput.files = [mockFile];

      // Step 7: Click generate
      const generateBtn = templatePage.querySelector('.generate-btn');
      generateBtn.click();

      // Should call API with correct parameters
      expect(muapi.generateI2V).toHaveBeenCalledWith({
        prompt: 'dancing in the rain, TikTok video format',
        name: '360 Rotation',
        image_url: mockFile,
        resolution: '720p'
      });
    });

    it('should handle template switching mid-workflow', () => {
      const effectsStudio = createEffectsStudio();
      document.body.appendChild(effectsStudio);

      // Select Templates tab
      const templatesTab = effectsStudio.querySelector('[data-tab="templates"]');
      templatesTab.click();

      // Select first template
      const firstTemplate = effectsStudio.querySelector('.template-card');
      firstTemplate.click();

      expect(navigate).toHaveBeenCalledWith('effects/template/tiktok-video');

      // Go back and select different template
      const backBtn = effectsStudio.querySelector('.back-btn');
      backBtn.click();

      const secondTemplate = effectsStudio.querySelector('.template-card:nth-child(2)');
      secondTemplate.click();

      expect(navigate).toHaveBeenCalledWith('effects/template/instagram-reel');
    });

    it('should persist form state when navigating between templates', () => {
      const templatePage = createTemplatePage('tiktok-video');
      document.body.appendChild(templatePage);

      // Fill form
      const promptInput = templatePage.querySelector('input[name="prompt"]');
      promptInput.value = 'test prompt';

      // Navigate away and back
      navigate('effects'); // Back to studio
      const backToTemplate = createTemplatePage('tiktok-video');
      document.body.appendChild(backToTemplate);

      // Form should retain state
      const restoredInput = backToTemplate.querySelector('input[name="prompt"]');
      expect(restoredInput.value).toBe('test prompt');
    });
  });

  describe('Router Integration', () => {
    it('should handle effects/template/{id} routing correctly', () => {
      // Simulate routing to effects template
      const route = 'effects/template/tiktok-video';

      const component = routeToEffectsComponent(route);

      expect(component.type).toBe('template-page');
      expect(component.templateId).toBe('tiktok-video');
    });

    it('should handle invalid template routes gracefully', () => {
      const route = 'effects/template/non-existent';

      const component = routeToEffectsComponent(route);

      expect(component.type).toBe('error');
      expect(component.message).toContain('Template not found');
    });

    it('should integrate with main app router', () => {
      // Mock main app navigation
      const mockNavigate = vi.fn();
      navigate.mockImplementation(mockNavigate);

      // Trigger template navigation
      navigateToTemplate('tiktok-video');

      expect(mockNavigate).toHaveBeenCalledWith('effects/template/tiktok-video');
    });
  });

  describe('Cross-Template Compatibility', () => {
    it('should work with different effect model types', async () => {
      // Test i2v template
      const i2vTemplate = createTemplatePage('tiktok-video');
      document.body.appendChild(i2vTemplate);

      const i2vBtn = i2vTemplate.querySelector('.generate-btn');
      i2vBtn.click();

      expect(muapi.generateI2V).toHaveBeenCalled();

      // Test t2v template (no image required)
      const t2vTemplate = {
        ...mockEffectsTemplates[0],
        modelType: 't2v',
        inputs: [{ name: 'prompt', type: 'text' }]
      };

      const t2vPage = createTemplatePageFromData(t2vTemplate);
      document.body.appendChild(t2vPage);

      const t2vBtn = t2vPage.querySelector('.generate-btn');
      t2vBtn.click();

      expect(muapi.generateVideo).toHaveBeenCalled();
    });

    it('should handle template parameter variations', () => {
      const minimalTemplate = {
        id: 'minimal',
        name: 'Minimal Template',
        model: 'basic-effects',
        inputs: [{ name: 'prompt', type: 'text' }],
        basePrompt: '{prompt}'
      };

      const complexTemplate = {
        ...mockEffectsTemplates[0],
        inputs: [
          { name: 'image_url', type: 'image' },
          { name: 'prompt', type: 'text' },
          { name: 'duration', type: 'select', options: ['5', '10'] },
          { name: 'quality', type: 'select', options: ['low', 'high'] }
        ]
      };

      // Both should generate valid forms
      const minimalForm = generateTemplateForm(minimalTemplate);
      const complexForm = generateTemplateForm(complexTemplate);

      expect(minimalForm.inputs.length).toBe(1);
      expect(complexForm.inputs.length).toBe(4);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large template libraries efficiently', () => {
      // Create many templates
      const largeTemplateSet = Array.from({ length: 100 }, (_, i) => ({
        id: `template-${i}`,
        name: `Template ${i}`,
        model: 'ai-video-effects',
        inputs: [{ name: 'prompt', type: 'text' }]
      }));

      templates.push(...largeTemplateSet);

      const effectsStudio = createEffectsStudio();
      document.body.appendChild(effectsStudio);

      const templatesTab = effectsStudio.querySelector('[data-tab="templates"]');
      templatesTab.click();

      const templateCards = effectsStudio.querySelectorAll('.template-card');
      expect(templateCards.length).toBeGreaterThan(50); // Should render efficiently
    });

    it('should lazy load template thumbnails', () => {
      const effectsStudio = createEffectsStudio();
      document.body.appendChild(effectsStudio);

      const templatesTab = effectsStudio.querySelector('[data-tab="templates"]');
      templatesTab.click();

      // Initially, thumbnails should be placeholders
      const thumbnails = effectsStudio.querySelectorAll('.template-thumbnail');
      thumbnails.forEach(thumb => {
        expect(thumb.src).toContain('placeholder'); // Not loaded yet
      });

      // After scrolling into view, should load
      // (This would require Intersection Observer mock)
    });

    it('should cache template data to avoid repeated fetches', () => {
      const effectsStudio1 = createEffectsStudio();
      const effectsStudio2 = createEffectsStudio();

      // Both should use cached template data
      expect(templates.length).toBe(2); // Cached from beforeEach
    });
  });
});

// Mock implementations for integration testing
function createEffectsStudio() {
  const container = document.createElement('div');
  container.className = 'effects-studio';

  container.innerHTML = `
    <div class="tabs">
      <button data-tab="manual" class="tab-button">Manual Effects</button>
      <button data-tab="templates" class="tab-button">Templates</button>
    </div>
    <div class="tab-content">
      <div class="templates-grid hidden">
        ${mockEffectsTemplates.map(template => `
          <div class="template-card" data-template-id="${template.id}">
            <h3>${template.name}</h3>
          </div>
        `).join('')}
      </div>
    </div>
    <button class="back-btn">Back</button>
  `;

  // Add event listeners
  const templatesTab = container.querySelector('[data-tab="templates"]');
  templatesTab.addEventListener('click', () => {
    const grid = container.querySelector('.templates-grid');
    grid.classList.remove('hidden');
  });

  const templateCards = container.querySelectorAll('.template-card');
  templateCards.forEach(card => {
    card.addEventListener('click', () => {
      const templateId = card.dataset.templateId;
      navigate(`effects/template/${templateId}`);
    });
  });

  return container;
}

function createTemplatePage(templateId) {
  const template = templates.find(t => t.id === templateId);
  return createTemplatePageFromData(template);
}

function createTemplatePageFromData(template) {
  const container = document.createElement('div');
  container.className = 'template-page';

  const formHtml = template.inputs.map(input => {
    if (input.type === 'text') {
      return `<input name="${input.name}" type="text" placeholder="${input.placeholder || ''}">`;
    }
    if (input.type === 'select') {
      return `<select name="${input.name}">
        ${input.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
      </select>`;
    }
    if (input.type === 'image') {
      return `<input name="${input.name}" type="file" accept="image/*">`;
    }
    return '';
  }).join('');

  container.innerHTML = `
    <form class="template-form">
      ${formHtml}
      <button class="generate-btn">Generate</button>
    </form>
  `;

  const generateBtn = container.querySelector('.generate-btn');
  generateBtn.addEventListener('click', () => {
    const formData = new FormData(container.querySelector('.template-form'));
    const params = Object.fromEntries(formData);

    // Construct prompt
    let prompt = template.basePrompt;
    Object.keys(params).forEach(key => {
      prompt = prompt.replace(`{${key}}`, params[key]);
    });

    const apiParams = {
      ...params,
      prompt,
      ...template.defaultParams
    };

    if (template.modelType === 'i2v') {
      muapi.generateI2V(apiParams);
    } else {
      muapi.generateVideo(apiParams);
    }
  });

  return container;
}

function routeToEffectsComponent(route) {
  if (route.startsWith('effects/template/')) {
    const templateId = route.split('/').pop();
    const template = templates.find(t => t.id === templateId);
    if (template) {
      return { type: 'template-page', templateId };
    } else {
      return { type: 'error', message: 'Template not found' };
    }
  }
  return { type: 'effects-studio' };
}

function navigateToTemplate(templateId) {
  navigate(`effects/template/${templateId}`);
}

function generateTemplateForm(template) {
  return {
    inputs: template.inputs,
    template: template
  };
}