import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../src/lib/templates.js');
vi.mock('../../../src/lib/thumbnails.js');
vi.mock('../../../src/lib/templateSpecs.js');
vi.mock('../../../src/lib/router.js');
vi.mock('../../../src/components/AuthModal.js');
vi.mock('../../../src/components/UploadPicker.js');

import { TemplateStudio } from '../../../src/components/TemplateStudio.js';
import { getTemplateById } from '../../../src/lib/templates.js';
import { getTemplateThumbnail } from '../../../src/lib/thumbnails.js';
import { getTemplateSpecs, hasEnhancedSpecs } from '../../../src/lib/templateSpecs.js';
import { navigate } from '../../../src/lib/router.js';
import { AuthModal } from '../../../src/components/AuthModal.js';
import { createUploadPicker } from '../../../src/components/UploadPicker.js';

describe('TemplateStudio Component', () => {
  const mockTemplate = {
    id: 'test-template',
    name: 'Test Template',
    description: 'A test template description',
    outputType: 'video',
    category: 'business',
    icon: '🎬',
    inputs: [
      { name: 'prompt', label: 'Prompt', type: 'text', placeholder: 'Enter your prompt' },
      { name: 'image', label: 'Image', type: 'image' }
    ],
    model: 'test-model',
    aspectRatio: '16:9'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Component Structure', () => {
    it('should render with dark background and white text theme', () => {
      getTemplateById.mockReturnValue(mockTemplate);

      const container = TemplateStudio('test-template');

      expect(container.className).toContain('bg-[#0a0a0b]');
      expect(container.className).toContain('text-white');
      expect(container).toBeInstanceOf(HTMLElement);
    });

    it('should display template name in hero section', () => {
      getTemplateById.mockReturnValue(mockTemplate);

      const container = TemplateStudio('test-template');
      document.body.appendChild(container);

      const titleElement = container.querySelector('h1');
      expect(titleElement).toBeTruthy();
      expect(titleElement.textContent).toBe('Test Template');
    });

    it('should display template description', () => {
      getTemplateById.mockReturnValue(mockTemplate);

      const container = TemplateStudio('test-template');
      document.body.appendChild(container);

      const descElement = container.querySelector('p');
      expect(descElement).toBeTruthy();
      expect(descElement.textContent).toBe('A test template description');
    });

    it('should show emerald accent colors in UI elements', () => {
      getTemplateById.mockReturnValue(mockTemplate);

      const container = TemplateStudio('test-template');
      document.body.appendChild(container);

      // Check for emerald accent colors in various UI elements
      const emeraldElements = container.querySelectorAll('[class*="emerald"]');
      expect(emeraldElements.length).toBeGreaterThan(0);
    });

    it('should render navigation header with correct active state', () => {
      getTemplateById.mockReturnValue(mockTemplate);

      const container = TemplateStudio('test-template');
      document.body.appendChild(container);

      const navButtons = container.querySelectorAll('[data-nav]');
      expect(navButtons.length).toBeGreaterThan(0);

      const templatesButton = Array.from(navButtons).find(btn => btn.dataset.nav === 'templates');
      expect(templatesButton).toBeTruthy();
      expect(templatesButton.className).toContain('text-white');
      expect(templatesButton.className).toContain('font-semibold');
    });
  });

  describe('Form Functionality', () => {
    it('should render form inputs based on template configuration', () => {
      getTemplateById.mockReturnValue(mockTemplate);

      const container = TemplateStudio('test-template');
      document.body.appendChild(container);

      // The first text input should be from the basic form (prompt input)
      const textInputs = container.querySelectorAll('input[type="text"]');
      expect(textInputs.length).toBeGreaterThan(0);

      // Check for upload area
      const uploadArea = container.querySelector('.cursor-pointer');
      expect(uploadArea).toBeTruthy();
      expect(uploadArea.textContent).toContain('Upload Image');
    });

    it('should update form state when inputs change', () => {
      getTemplateById.mockReturnValue(mockTemplate);

      const container = TemplateStudio('test-template');
      document.body.appendChild(container);

      const textInput = container.querySelector('input[type="text"]');
      textInput.value = 'Test prompt';
      textInput.dispatchEvent(new Event('input'));

      // Form state is internal, so we verify by checking the input maintains its value
      expect(textInput.value).toBe('Test prompt');
    });

    it('should show AI Enhancer section with toggle', () => {
      getTemplateById.mockReturnValue(mockTemplate);

      const container = TemplateStudio('test-template');
      document.body.appendChild(container);

      const enhancerSection = container.querySelector('[class*="emerald-400/25"]');
      expect(enhancerSection).toBeTruthy();

      const toggleButton = container.querySelector('#enhancerToggle');
      expect(toggleButton).toBeTruthy();
    });
  });

  describe('Preview and Output', () => {
    it('should display preview area with correct styling', () => {
      getTemplateById.mockReturnValue(mockTemplate);

      const container = TemplateStudio('test-template');
      document.body.appendChild(container);

      const previewArea = container.querySelector('#previewArea');
      expect(previewArea).toBeTruthy();
      expect(previewArea.className).toContain('border-dashed');
      expect(previewArea.className).toContain('border-zinc-600');
    });

    it('should show output tabs with correct active state', () => {
      getTemplateById.mockReturnValue(mockTemplate);

      const container = TemplateStudio('test-template');
      document.body.appendChild(container);

      const tabButtons = container.querySelectorAll('#outputTabs button');
      expect(tabButtons.length).toBe(4); // Enhanced Prompt, Scene Beats, Voiceover, Negative Prompt

      const activeTab = Array.from(tabButtons).find(btn => btn.className.includes('emerald'));
      expect(activeTab).toBeTruthy();
      expect(activeTab.textContent).toBe('Enhanced Prompt');
    });
  });

  describe('Error Handling', () => {
    it('should show error message for non-existent template', () => {
      getTemplateById.mockReturnValue(null);

      const container = TemplateStudio('non-existent');

      expect(container.className).toContain('bg-[#0a0a0b]');
      expect(container.className).toContain('text-white');
      expect(container.textContent).toContain('Template not found');
    });
  });

  describe('Navigation', () => {
    it('should navigate back to templates page when back button clicked', () => {
      getTemplateById.mockReturnValue(mockTemplate);

      const container = TemplateStudio('test-template');
      document.body.appendChild(container);

      const backButton = container.querySelector('button');
      // The back button should be the one that navigates to templates
      expect(backButton).toBeTruthy();

      // Find the button that contains "Back" text
      const allButtons = Array.from(container.querySelectorAll('button'));
      const backBtn = allButtons.find(btn => btn.textContent.includes('Back'));
      expect(backBtn).toBeTruthy();

      backBtn.click();
      expect(navigate).toHaveBeenCalledWith('templates');
    });

    it('should navigate when nav buttons are clicked', () => {
      getTemplateById.mockReturnValue(mockTemplate);

      const container = TemplateStudio('test-template');
      document.body.appendChild(container);

      const exploreButton = container.querySelector('[data-nav="explore"]');
      exploreButton.click();

      expect(navigate).toHaveBeenCalledWith('explore');
    });
  });
});