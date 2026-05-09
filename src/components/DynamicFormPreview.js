import { muapi } from '../lib/muapi.js';
import { sanitizeUrl } from '../lib/security.js';

export class DynamicFormPreview {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      updateDelay: options.updateDelay || 500,
      maxPreviewSize: options.maxPreviewSize || 1024 * 1024 * 5,
      showLoadingIndicator: options.showLoadingIndicator !== false,
      ...options,
    };

    this.template = null;
    this.formState = {};
    this.updateTimer = null;
    this.previewContent = null;
    this.isLoading = false;
    this.lastGeneratedPrompt = null;

    this.initializeContainer();
  }

  initializeContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
    }

    this.container.className = 'preview-container';
  }

  setTemplate(template) {
    this.template = template;
    this.previewContent = null;
    this.lastGeneratedPrompt = null;
    this.renderPreviewPlaceholder();
  }

  updateFormState(formState) {
    this.formState = formState;
    this.schedulePreviewUpdate();
  }

  schedulePreviewUpdate() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(() => {
      this.generatePreview();
    }, this.options.updateDelay);
  }

  async generatePreview() {
    if (!this.template) return;

    if (this.showLoadingIndicator) {
      this.showLoading();
    }

    try {
      const previewData = this.buildPreviewData();

      if (!previewData.prompt && !previewData.image_url) {
        this.renderEmptyPreview();
        return;
      }

      this.lastGeneratedPrompt = this.buildPrompt(previewData);
      const previewResult = await this.fetchPreview(this.lastGeneratedPrompt, previewData);

      if (previewResult) {
        this.renderPreview(previewResult);
      } else {
        this.renderPromptPreview(this.lastGeneratedPrompt);
      }
    } catch (error) {
      console.error('[DynamicFormPreview] Generation error:', error);
      this.renderErrorPreview(error.message);
    }
  }

  buildPreviewData() {
    const data = {};

    if (this.template.inputs) {
      this.template.inputs.forEach(input => {
        const value = this.formState[input.name];
        if (value !== null && value !== undefined && value !== '') {
          if (input.type === 'image' && value.startsWith('data:')) {
            data.image_url = value;
          } else {
            data[input.name] = value;
          }
        }
      });
    }

    return data;
  }

  buildPrompt(previewData) {
    let prompt = previewData.prompt || '';

    if (this.template.basePrompt) {
      prompt = this.template.basePrompt.replace('{prompt}', prompt);
    }

    if (this.template.defaultParams) {
      Object.entries(this.template.defaultParams).forEach(([key, value]) => {
        if (!previewData[key]) {
          prompt += `, ${key}:${value}`;
        }
      });
    }

    return prompt;
  }

  async fetchPreview(prompt, previewData) {
    if (this.template.modelType === 'i2i' || this.template.modelType === 'i2v') {
      if (!previewData.image_url) {
        return null;
      }

      const params = {
        model: this.template.model,
        image_url: previewData.image_url,
        prompt: prompt,
        ...(this.template.defaultParams || {}),
      };

      if (previewData.aspect_ratio) {
        params.aspect_ratio = previewData.aspect_ratio;
      }

      const result = await muapi.generateImage(params);
      return result;
    }

    return null;
  }

  renderPreview(result) {
    const previewArea = this.container.querySelector('.preview-area');
    if (!previewArea) return;

    if (result.url) {
      const safeUrl = sanitizeUrl(result.url);

      if (result.type === 'video' || this.template.outputType === 'video') {
        previewArea.innerHTML = `
          <div class="preview-media rounded-xl overflow-hidden">
            <video src="${safeUrl}" controls autoplay loop class="w-full h-full object-contain" style="max-height: 300px;"></video>
          </div>
          <div class="preview-prompt mt-3 p-3 bg-black/30 rounded-lg">
            <p class="text-xs text-zinc-400 mb-1">Generated Prompt</p>
            <p class="text-sm text-zinc-300">${this.lastGeneratedPrompt || 'Prompt preview'}</p>
          </div>
        `;
      } else {
        previewArea.innerHTML = `
          <div class="preview-media rounded-xl overflow-hidden">
            <img src="${safeUrl}" alt="Preview" class="w-full h-full object-contain" style="max-height: 300px;" />
          </div>
          <div class="preview-prompt mt-3 p-3 bg-black/30 rounded-lg">
            <p class="text-xs text-zinc-400 mb-1">Generated Prompt</p>
            <p class="text-sm text-zinc-300">${this.lastGeneratedPrompt || 'Prompt preview'}</p>
          </div>
        `;
      }
    } else {
      this.renderPromptPreview(this.lastGeneratedPrompt);
    }

    this.isLoading = false;
  }

  renderPromptPreview(prompt) {
    const previewArea = this.container.querySelector('.preview-area');
    if (!previewArea) return;

    previewArea.innerHTML = `
      <div class="preview-placeholder p-6 text-center">
        <div class="text-4xl mb-3 opacity-50">📝</div>
        <p class="text-sm text-zinc-400 mb-1">Prompt Preview</p>
        <div class="mt-3 p-4 bg-black/30 rounded-lg text-left">
          <p class="text-sm text-zinc-300 whitespace-pre-wrap">${prompt || 'Enter values to see prompt preview'}</p>
        </div>
      </div>
    `;

    this.isLoading = false;
  }

  renderPreviewPlaceholder() {
    const previewArea = this.container.querySelector('.preview-area');
    if (!previewArea) return;

    previewArea.innerHTML = `
      <div class="preview-placeholder p-6 text-center">
        <div class="text-4xl mb-3 opacity-50">🎯</div>
        <p class="text-sm text-zinc-400 mb-1">Configure settings to see preview</p>
        <p class="text-xs text-zinc-500 mt-1">Upload an image and fill in the details above</p>
      </div>
    `;

    this.isLoading = false;
  }

  renderEmptyPreview() {
    const previewArea = this.container.querySelector('.preview-area');
    if (!previewArea) return;

    previewArea.innerHTML = `
      <div class="preview-placeholder p-6 text-center">
        <div class="text-4xl mb-3 opacity-50">📷</div>
        <p class="text-sm text-zinc-400 mb-1">No image uploaded</p>
        <p class="text-xs text-zinc-500 mt-1">Upload an image to see the preview</p>
      </div>
    `;

    this.isLoading = false;
  }

  renderErrorPreview(errorMessage) {
    const previewArea = this.container.querySelector('.preview-area');
    if (!previewArea) return;

    previewArea.innerHTML = `
      <div class="preview-error p-6 text-center">
        <div class="text-4xl mb-3 opacity-50">⚠️</div>
        <p class="text-sm text-red-400 mb-1">Preview Error</p>
        <p class="text-xs text-zinc-500 mt-1">${errorMessage || 'An error occurred'}</p>
      </div>
    `;

    this.isLoading = false;
  }

  showLoading() {
    const previewArea = this.container.querySelector('.preview-area');
    if (!previewArea) return;

    previewArea.innerHTML = `
      <div class="preview-loading p-6 text-center">
        <div class="inline-block animate-spin text-4xl mb-3">⟳</div>
        <p class="text-sm text-zinc-400 mb-1">Generating preview...</p>
        <p class="text-xs text-zinc-500 mt-1">This may take a moment</p>
      </div>
    `;

    this.isLoading = true;
  }

  getLastGeneratedPrompt() {
    return this.lastGeneratedPrompt;
  }

  clearPreview() {
    this.previewContent = null;
    this.lastGeneratedPrompt = null;
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    this.renderPreviewPlaceholder();
  }

  destroy() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    this.listeners = [];
  }

  setUpdateDelay(delayMs) {
    this.options.updateDelay = delayMs;
  }
}

export function createPreviewManager(container, options = {}) {
  return new DynamicFormPreview(container, options);
}