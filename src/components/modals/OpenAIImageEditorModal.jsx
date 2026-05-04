import { BaseModal } from './BaseModal';
import { openaiService } from '../../lib/openaiService';
import { assetImportService } from '../../lib/editor/assetImportService';

export class OpenAIImageEditorModal extends BaseModal {
   constructor(options = {}) {
     super({
       title: 'AI Image Editor (OpenAI)',
       size: 'full',
       ...options
     });

     this.image = options.image || null; // Base64 encoded image
     this.referenceImages = options.referenceImages || []; // Additional reference images for edits
     this.mask = options.mask || null; // Base64 encoded mask for selective editing
     this.mode = options.mode || 'generate'; // 'generate', 'edit', 'variations'
     this.conversationHistory = options.conversationHistory || []; // For multi-turn editing

     // UI state
     this.prompt = options.prompt || '';
     this.isGenerating = false;
     this.generatedImages = [];
     this.partialImages = [];
     this.currentStep = 'input'; // 'input', 'generating', 'results'

     // Output settings
     this.outputSettings = {
       size: '1024x1024',
       quality: 'auto',
       style: 'vivid',
       background: 'auto',
       format: 'png',
       compression: undefined, // Only for JPEG/WebP
       moderation: 'auto'
     };

     // Multi-turn state
     this.previousResponseId = options.previousResponseId || null;
     this.multiTurnMode = options.multiTurnMode || false;

     // Timeline integration callbacks
     this.selectedImageIndex = null;
     this.onAddToTimeline = options.onAddToTimeline || null; // Callback for adding new clips to timeline
     this.onConfirm = options.onConfirm || null; // Callback for confirming edit/clip replacement
   }

  renderBody() {
    return `
      <div class="openai-image-editor-container">
        ${this.renderModeSelector()}
        ${this.renderInputPanel()}
        ${this.renderOutputSettings()}
        ${this.renderPreviewArea()}
        ${this.renderResultsPanel()}
      </div>
    `;
  }

  renderModeSelector() {
    return `
      <div class="editor-mode-selector">
        <div class="mode-buttons">
          <button class="mode-btn ${this.mode === 'generate' ? 'active' : ''}" data-mode="generate">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Generate New
          </button>
          <button class="mode-btn ${this.mode === 'edit' ? 'active' : ''}" data-mode="edit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit Existing
          </button>
          <button class="mode-btn ${this.mode === 'variations' ? 'active' : ''}" data-mode="variations">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Create Variations
          </button>
          <button class="mode-btn ${this.multiTurnMode ? 'active' : ''}" data-mode="multiturn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Multi-turn Edit
          </button>
        </div>
      </div>
    `;
  }

  renderInputPanel() {
    if (this.currentStep !== 'input') return '';

    return `
      <div class="input-panel">
        <div class="prompt-section">
          <label class="input-label">
            ${this.mode === 'generate' ? 'Describe the image you want to create' :
              this.mode === 'edit' ? 'Describe how to edit the image' :
              this.mode === 'variations' ? 'Describe the variations you want' :
              'Describe your edit instruction'}
          </label>
          <textarea
            class="prompt-textarea"
            placeholder="${this.getPromptPlaceholder()}"
            rows="4"
            maxlength="1000"
          >${this.prompt}</textarea>
          <div class="character-count">
            <span id="char-count">0</span>/1000 characters
          </div>
        </div>

        ${this.renderImageUpload()}
        ${this.renderMaskUpload()}
        ${this.renderMultiTurnHistory()}
      </div>
    `;
  }

  renderImageUpload() {
    if (this.mode === 'generate') return '';

    return `
      <div class="upload-section">
        <label class="input-label">Input Image</label>
        <div class="upload-area ${this.image ? 'has-image' : ''}" id="image-upload">
          ${this.image ? `
            <div class="uploaded-image">
              <img src="data:image/png;base64,${this.image}" alt="Input image" />
              <button class="remove-image-btn" data-remove="image">×</button>
            </div>
          ` : `
            <div class="upload-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p>Drop main image here or click to browse</p>
              <input type="file" accept="image/*" style="display: none;" />
            </div>
          `}
        </div>
        ${this.mode === 'edit' ? this.renderReferenceImages() : ''}
      </div>
    `;
  }

  renderReferenceImages() {
    return `
      <div class="reference-images-section">
        <label class="input-label">Reference Images (Optional)</label>
        <div class="reference-images-grid">
          ${this.referenceImages.map((img, index) => `
            <div class="reference-image-item">
              <img src="data:image/png;base64,${img}" alt="Reference ${index + 1}" />
              <button class="remove-ref-btn" data-remove-ref="${index}">×</button>
            </div>
          `).join('')}
          <div class="add-reference-btn" id="add-reference">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Add Reference</span>
            <input type="file" accept="image/*" multiple style="display: none;" />
          </div>
        </div>
      </div>
    `;
  }

  renderMaskUpload() {
    if (this.mode !== 'edit') return '';

    return `
      <div class="upload-section">
        <label class="input-label">
          Mask (Optional)
          <span class="help-text">Upload a mask to specify which areas to edit</span>
        </label>
        <div class="upload-area ${this.mask ? 'has-image' : ''}" id="mask-upload">
          ${this.mask ? `
            <div class="uploaded-image">
              <img src="data:image/png;base64,${this.mask}" alt="Mask image" />
              <button class="remove-image-btn" data-remove="mask">×</button>
            </div>
          ` : `
            <div class="upload-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                <circle cx="12" cy="17" r="1"/>
              </svg>
              <p>Optional: Drop mask image here</p>
              <input type="file" accept="image/*" style="display: none;" />
            </div>
          `}
        </div>
      </div>
    `;
  }

  renderMultiTurnHistory() {
    if (!this.multiTurnMode || this.conversationHistory.length === 0) return '';

    return `
      <div class="conversation-history">
        <label class="input-label">Previous Edits</label>
        <div class="history-list">
          ${this.conversationHistory.map((item, index) => `
            <div class="history-item">
              <div class="history-prompt">${item.prompt}</div>
              <div class="history-image">
                <img src="data:image/png;base64,${item.image}" alt="Previous edit ${index + 1}" />
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderOutputSettings() {
    if (this.currentStep !== 'input') return '';

    const { size, quality, style, background, format, compression, moderation } = this.outputSettings;
    return `
      <div class="output-settings">
        <h4 class="settings-title">Output Settings</h4>

        <div class="presets-section">
          <label class="input-label">Quick Presets</label>
          <div class="preset-buttons">
            <button class="preset-btn ${this.isCurrentPreset('web') ? 'active' : ''}" data-preset="web">
              <span class="preset-icon">🌐</span>
              <span>Web</span>
            </button>
            <button class="preset-btn ${this.isCurrentPreset('print') ? 'active' : ''}" data-preset="print">
              <span class="preset-icon">🖨️</span>
              <span>Print</span>
            </button>
            <button class="preset-btn ${this.isCurrentPreset('social') ? 'active' : ''}" data-preset="social">
              <span class="preset-icon">📱</span>
              <span>Social</span>
            </button>
            <button class="preset-btn ${this.isCurrentPreset('hd') ? 'active' : ''}" data-preset="hd">
              <span class="preset-icon">🎬</span>
              <span>HD Video</span>
            </button>
            <button class="preset-btn ${this.isCurrentPreset('4k') ? 'active' : ''}" data-preset="4k">
              <span class="preset-icon">🎥</span>
              <span>4K Ultra HD</span>
            </button>
          </div>
        </div>

        <div class="settings-grid">
          <div class="setting-group">
            <label>Size</label>
            <select class="setting-select" data-setting="size">
              <option value="1024x1024" ${size === '1024x1024' ? 'selected' : ''}>1024×1024 (Square)</option>
              <option value="1024x1792" ${size === '1024x1792' ? 'selected' : ''}>1024×1792 (Portrait)</option>
              <option value="1792x1024" ${size === '1792x1024' ? 'selected' : ''}>1792×1024 (Landscape)</option>
              <option value="2048x2048" ${size === '2048x2048' ? 'selected' : ''}>2048×2048 (2K Square)</option>
              <option value="2048x1152" ${size === '2048x1152' ? 'selected' : ''}>2048×1152 (2K Landscape)</option>
              <option value="1152x2048" ${size === '1152x2048' ? 'selected' : ''}>1152×2048 (2K Portrait)</option>
              <option value="3840x2160" ${size === '3840x2160' ? 'selected' : ''}>3840×2160 (4K Landscape)</option>
              <option value="2160x3840" ${size === '2160x3840' ? 'selected' : ''}>2160×3840 (4K Portrait)</option>
            </select>
          </div>
          <div class="setting-group">
            <label>Quality</label>
            <select class="setting-select" data-setting="quality">
              <option value="auto" ${quality === 'auto' ? 'selected' : ''}>Auto (Recommended)</option>
              <option value="low" ${quality === 'low' ? 'selected' : ''}>Low (Fast, Draft)</option>
              <option value="medium" ${quality === 'medium' ? 'selected' : ''}>Medium (Balanced)</option>
              <option value="high" ${quality === 'high' ? 'selected' : ''}>High (Best Quality)</option>
            </select>
          </div>
          <div class="setting-group">
            <label>Style</label>
            <select class="setting-select" data-setting="style">
              <option value="vivid" ${style === 'vivid' ? 'selected' : ''}>Vivid (Colorful)</option>
              <option value="natural" ${style === 'natural' ? 'selected' : ''}>Natural (Realistic)</option>
            </select>
          </div>
          <div class="setting-group">
            <label>Background</label>
            <select class="setting-select" data-setting="background">
              <option value="auto" ${background === 'auto' ? 'selected' : ''}>Auto</option>
              <option value="opaque" ${background === 'opaque' ? 'selected' : ''}>Opaque</option>
              <option value="transparent" ${background === 'transparent' ? 'selected' : ''}>Transparent</option>
            </select>
          </div>
          <div class="setting-group">
            <label>Format</label>
            <select class="setting-select" data-setting="format">
              <option value="png" ${format === 'png' ? 'selected' : ''}>PNG (Lossless)</option>
              <option value="jpeg" ${format === 'jpeg' ? 'selected' : ''}>JPEG (Smaller)</option>
              <option value="webp" ${format === 'webp' ? 'selected' : ''}>WebP (Modern)</option>
            </select>
          </div>
          ${['jpeg', 'webp'].includes(format) ? `
          <div class="setting-group">
            <label>Compression</label>
            <input type="range" class="setting-range" data-setting="compression"
                   min="0" max="100" value="${compression || 75}"
                   title="Compression level (0-100%)">
            <span class="compression-value">${compression || 75}%</span>
          </div>
          ` : ''}
          <div class="setting-group">
            <label>Content Moderation</label>
            <select class="setting-select" data-setting="moderation">
              <option value="auto" ${moderation === 'auto' ? 'selected' : ''}>Auto (Standard)</option>
              <option value="low" ${moderation === 'low' ? 'selected' : ''}>Low (Less Restrictive)</option>
            </select>
          </div>
        </div>

        <div class="settings-info">
          <div class="info-item">
            <span class="info-label">Est. Cost:</span>
            <span class="info-value">${this.calculateEstimatedCost()}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Processing:</span>
            <span class="info-value">${this.getEstimatedTime()}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Resolution:</span>
            <span class="info-value">${this.getResolutionInfo()}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderPreviewArea() {
    if (this.currentStep === 'generating') {
      return this.renderGenerationProgress();
    }

    return `
      <div class="preview-area">
        <div class="preview-placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <p>Your AI-generated images will appear here</p>
        </div>
      </div>
    `;
  }

  renderGenerationProgress() {
    return `
      <div class="generation-progress">
        <div class="progress-header">
          <div class="progress-spinner"></div>
          <span>Generating images with AI...</span>
        </div>
        <div class="partial-images-grid">
          ${this.partialImages.map((partial, index) => `
            <div class="partial-image-item">
              <img src="data:image/png;base64,${partial.b64_json}" alt="Partial ${index + 1}" />
              <span class="partial-label">Step ${partial.partial_image_index + 1}</span>
            </div>
          `).join('')}
        </div>
        <div class="progress-status">This may take a few seconds...</div>
      </div>
    `;
  }

  renderResultsPanel() {
    if (this.currentStep !== 'results' || this.generatedImages.length === 0) return '';

    return `
      <div class="results-panel">
        <div class="results-header">
          <h4>Generated Images</h4>
          <span class="results-count">${this.generatedImages.length} image${this.generatedImages.length > 1 ? 's' : ''}</span>
          ${this.generatedImages.length > 0 ? `
            <button class="modal-btn modal-btn-secondary add-all-to-timeline-btn">
              Add All to Timeline
            </button>
          ` : ''}
        </div>
        <div class="results-grid">
          ${this.generatedImages.map((img, index) => `
            <div class="result-item" data-index="${index}">
              <div class="result-image">
                <img src="data:image/png;base64,${img.base64}" alt="Generated image ${index + 1}" />
                <div class="result-overlay">
                  <button class="select-result-btn" data-select="${index}">Select</button>
                </div>
              </div>
              ${img.revised_prompt ? `<div class="revised-prompt">${img.revised_prompt}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ${this.multiTurnMode ? `
          <div class="multiturn-actions">
            <button class="modal-btn modal-btn-secondary continue-editing-btn">Continue Editing</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderFooter() {
    const canGenerate = this.prompt.trim().length > 0 &&
                       (!['edit', 'variations'].includes(this.mode) || this.image);

    return `
      <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
      ${this.currentStep === 'input' ? `
        <button class="modal-btn modal-btn-primary generate-btn" ${(!canGenerate || this.isGenerating) ? 'disabled' : ''}>
          ${this.isGenerating ? '<span class="btn-spinner"></span> Generating...' : 'Generate Images'}
        </button>
      ` : this.currentStep === 'results' ? `
        ${this.selectedImageIndex !== null ? `
          <button class="modal-btn modal-btn-secondary add-to-timeline-btn">Add to Timeline</button>
          <button class="modal-btn modal-btn-primary apply-selected-btn">Apply Selected</button>
        ` : `
          <button class="modal-btn modal-btn-primary apply-selected-btn" disabled>Select an image first</button>
        `}
      ` : ''}
    `;
  }

  getPromptPlaceholder() {
    switch (this.mode) {
      case 'generate':
        return 'A photorealistic image of a serene mountain lake at sunset...';
      case 'edit':
        return 'Add a rainbow in the sky, make the trees greener...';
      case 'variations':
        return 'Create more dramatic lighting, different color palettes...';
      default:
        return 'Describe your edit...';
    }
  }

  // ===============================
  // Output Settings & Presets
  // ===============================

  isCurrentPreset(presetName) {
    const presets = {
      web: { size: '1024x1024', quality: 'low', style: 'vivid', format: 'webp', compression: 75 },
      print: { size: '2048x2048', quality: 'high', style: 'natural', format: 'png' },
      social: { size: '1024x1024', quality: 'medium', style: 'vivid', format: 'jpeg', compression: 85 },
      hd: { size: '2048x1152', quality: 'high', style: 'vivid', format: 'png' },
      '4k': { size: '3840x2160', quality: 'high', style: 'vivid', format: 'png' }
    };

    const preset = presets[presetName];
    if (!preset) return false;

    return Object.keys(preset).every(key => this.outputSettings[key] === preset[key]);
  }

  applyPreset(presetName) {
    const presets = {
      web: { size: '1024x1024', quality: 'low', style: 'vivid', format: 'webp', compression: 75 },
      print: { size: '2048x2048', quality: 'high', style: 'natural', format: 'png' },
      social: { size: '1024x1024', quality: 'medium', style: 'vivid', format: 'jpeg', compression: 85 },
      hd: { size: '2048x1152', quality: 'high', style: 'vivid', format: 'png' },
      '4k': { size: '3840x2160', quality: 'high', style: 'vivid', format: 'png' }
    };

    const preset = presets[presetName];
    if (preset) {
      this.outputSettings = { ...this.outputSettings, ...preset };
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    }
  }

  calculateEstimatedCost() {
    // GPT Image 2 pricing based on documentation
    const pricing = {
      '1024x1024': { low: 0.006, medium: 0.053, high: 0.211 },
      '1024x1792': { low: 0.005, medium: 0.041, high: 0.165 },
      '1792x1024': { low: 0.005, medium: 0.041, high: 0.165 },
      '2048x2048': { low: 0.006, medium: 0.053, high: 0.211 }, // Estimated 2K square
      '2048x1152': { low: 0.005, medium: 0.041, high: 0.165 }, // Estimated 2K landscape
      '1152x2048': { low: 0.005, medium: 0.041, high: 0.165 }, // Estimated 2K portrait
      '3840x2160': { low: 0.006, medium: 0.053, high: 0.211 }, // Estimated 4K
      '2160x3840': { low: 0.005, medium: 0.041, high: 0.165 }  // Estimated 4K portrait
    };

    const sizePricing = pricing[this.outputSettings.size] || pricing['1024x1024'];
    const quality = this.outputSettings.quality === 'auto' ? 'medium' : this.outputSettings.quality;
    const cost = sizePricing[quality] || sizePricing.medium;

    return `$${cost.toFixed(3)}`;
  }

  getEstimatedTime() {
    // Estimated generation times based on size and quality
    const timeEstimates = {
      '1024x1024': { auto: '10-20s', low: '5-15s', medium: '10-25s', high: '20-40s' },
      '1024x1792': { auto: '15-30s', low: '8-20s', medium: '15-35s', high: '25-50s' },
      '1792x1024': { auto: '15-30s', low: '8-20s', medium: '15-35s', high: '25-50s' },
      '2048x2048': { auto: '20-40s', low: '10-25s', medium: '20-45s', high: '35-70s' },
      '2048x1152': { auto: '18-35s', low: '9-22s', medium: '18-40s', high: '30-60s' },
      '1152x2048': { auto: '18-35s', low: '9-22s', medium: '18-40s', high: '30-60s' },
      '3840x2160': { auto: '45-90s', low: '25-50s', medium: '45-90s', high: '70-140s' },
      '2160x3840': { auto: '45-90s', low: '25-50s', medium: '45-90s', high: '70-140s' }
    };

    const sizeEstimate = timeEstimates[this.outputSettings.size] || timeEstimates['1024x1024'];
    const quality = this.outputSettings.quality;
    return sizeEstimate[quality] || sizeEstimate.auto;
  }

  getResolutionInfo() {
    const [width, height] = this.outputSettings.size.split('x').map(Number);
    const pixels = width * height;
    const megapixels = (pixels / 1000000).toFixed(1);

    if (pixels >= 8294400) return `${megapixels}MP (4K)`;
    if (pixels >= 2621440) return `${megapixels}MP (2K)`;
    return `${megapixels}MP (HD)`;
   }

   mapQuality(quality) {
     const qualityMap = {
       'auto': 'standard',
       'low': 'standard',
       'medium': 'hd',
       'high': 'hd'
     };
     return qualityMap[quality] || 'standard';
   }

   updateSettingsDisplay() {
    // Update cost and time displays
    const infoItems = this.overlay.querySelectorAll('.info-value');
    if (infoItems.length >= 2) {
      infoItems[0].textContent = this.calculateEstimatedCost(); // Cost
      infoItems[1].textContent = this.getEstimatedTime(); // Time
      if (infoItems[2]) {
        infoItems[2].textContent = this.getResolutionInfo(); // Resolution
      }
    }

    // Re-render settings to show/hide compression control
    const settingsContainer = this.overlay.querySelector('.output-settings');
    if (settingsContainer) {
      const newSettingsHtml = this.renderOutputSettings();
      settingsContainer.outerHTML = newSettingsHtml;
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Mode selection
    this.overlay.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        if (mode === 'multiturn') {
          this.multiTurnMode = !this.multiTurnMode;
        } else {
          this.mode = mode;
          this.multiTurnMode = false;
        }
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    // Prompt input
    const promptTextarea = this.overlay.querySelector('.prompt-textarea');
    if (promptTextarea) {
      promptTextarea.addEventListener('input', (e) => {
        this.prompt = e.target.value;
        this.updateCharCount();
      });
      this.updateCharCount();
    }

    // File uploads
    this.setupFileUploads();

    // Preset buttons
    this.overlay.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.currentTarget.dataset.preset;
        this.applyPreset(preset);
      });
    });

    // Output settings - select dropdowns
    this.overlay.querySelectorAll('.setting-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const setting = e.target.dataset.setting;
        this.outputSettings[setting] = e.target.value;
        this.updateSettingsDisplay();
      });
    });

    // Compression range input
    const compressionRange = this.overlay.querySelector('input[data-setting="compression"]');
    if (compressionRange) {
      compressionRange.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        this.outputSettings.compression = value;
        // Update the display value
        const valueSpan = e.target.parentElement.querySelector('.compression-value');
        if (valueSpan) {
          valueSpan.textContent = `${value}%`;
        }
        this.updateSettingsDisplay();
      });
    }

    // Generate button
    const generateBtn = this.overlay.querySelector('.generate-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateImages());
    }

    // Result selection
    this.overlay.querySelectorAll('.select-result-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.select);
        this.selectResult(index);
      });
    });

    // Continue editing
    const continueBtn = this.overlay.querySelector('.continue-editing-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => this.continueEditing());
    }

    // Add to timeline
    const addToTimelineBtn = this.overlay.querySelector('.add-to-timeline-btn');
    if (addToTimelineBtn) {
      addToTimelineBtn.addEventListener('click', () => this.addSelectedToTimeline());
    }

     // Apply selected button
     const applyBtn = this.overlay.querySelector('.apply-selected-btn');
     if (applyBtn) {
       applyBtn.addEventListener('click', () => this.addSelectedToTimeline());
     }

     // Add all to timeline
    const addAllToTimelineBtn = this.overlay.querySelector('.add-all-to-timeline-btn');
    if (addAllToTimelineBtn) {
      addAllToTimelineBtn.addEventListener('click', () => this.addAllToTimeline());
    }
  }

  setupFileUploads() {
    // Image upload
    const imageUpload = this.overlay.querySelector('#image-upload');
    if (imageUpload) {
      const input = imageUpload.querySelector('input[type="file"]');
      const placeholder = imageUpload.querySelector('.upload-placeholder');

      if (input && placeholder) {
        placeholder.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => this.handleFileUpload(e, 'image'));
      }

      // Drag and drop
      imageUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUpload.classList.add('drag-over');
      });
      imageUpload.addEventListener('dragleave', () => {
        imageUpload.classList.remove('drag-over');
      });
      imageUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUpload.classList.remove('drag-over');
        this.handleFileDrop(e, 'image');
      });
    }

    // Mask upload (for edit mode)
    const maskUpload = this.overlay.querySelector('#mask-upload');
    if (maskUpload) {
      const input = maskUpload.querySelector('input[type="file"]');
      const placeholder = maskUpload.querySelector('.upload-placeholder');

      if (input && placeholder) {
        placeholder.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => this.handleFileUpload(e, 'mask'));
      }

      maskUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        maskUpload.classList.add('drag-over');
      });
      maskUpload.addEventListener('dragleave', () => {
        maskUpload.classList.remove('drag-over');
      });
      maskUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        maskUpload.classList.remove('drag-over');
        this.handleFileDrop(e, 'mask');
      });
    }

    // Remove buttons
    this.overlay.querySelectorAll('.remove-image-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.remove;
        this.removeUploadedImage(type);
      });
    });

    // Add reference image button
    const addRefBtn = this.overlay.querySelector('#add-reference');
    if (addRefBtn) {
      const input = addRefBtn.querySelector('input[type="file"]');
      if (input) {
        addRefBtn.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => this.handleReferenceImagesUpload(e));
      }
    }

    // Remove reference image buttons
    this.overlay.querySelectorAll('.remove-ref-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.removeRef);
        this.removeReferenceImage(index);
      });
    });
  }

  async handleFileUpload(e, type) {
    const file = e.target.files[0];
    if (file) {
      await this.processFile(file, type);
    }
  }

  async handleFileDrop(e, type) {
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await this.processFile(file, type);
    }
  }

  async processFile(file, type) {
    try {
      const base64 = await this.fileToBase64(file);
      if (type === 'image') {
        this.image = base64;
      } else if (type === 'mask') {
        this.mask = base64;
      }
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    } catch (error) {
      console.error('File processing error:', error);
      this.showError('Failed to process image file');
    }
  }

  removeUploadedImage(type) {
    if (type === 'image') {
      this.image = null;
    } else if (type === 'mask') {
      this.mask = null;
    }
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  async handleReferenceImagesUpload(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (this.referenceImages.length >= 4) break; // Limit to 4 reference images
      const base64 = await this.fileToBase64(file);
      this.referenceImages.push(base64);
    }
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  removeReferenceImage(index) {
    this.referenceImages.splice(index, 1);
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  updateCharCount() {
    const textarea = this.overlay.querySelector('.prompt-textarea');
    const counter = this.overlay.querySelector('#char-count');
    if (textarea && counter) {
      counter.textContent = textarea.value.length;
    }
  }

  async generateImages() {
    if (!this.prompt.trim()) return;

    this.isGenerating = true;
    this.currentStep = 'generating';
    this.partialImages = [];
    this.generatedImages = [];
    this.updateBody(this.renderBody());
    this.setupEventListeners();

    try {
      if (this.multiTurnMode && this.conversationHistory.length > 0) {
        // Use multi-turn editing
        const result = await openaiService.multiTurnImageEditing({
          input: this.prompt,
          previousResponseId: this.previousResponseId,
          imageInputs: this.conversationHistory
        });

        this.generatedImages = result.images;
        this.previousResponseId = result.response_id;

       } else if (this.mode === 'generate') {
         // Generate new images
         const serviceParams = {
           prompt: this.prompt,
           onPartialImage: (partial) => this.handlePartialImage(partial),
           partialImages: 2,
           size: this.outputSettings.size,
           quality: this.mapQuality(this.outputSettings.quality),
           style: this.outputSettings.style,
           background: this.outputSettings.background,
           output_format: this.outputSettings.format,
           moderation: this.outputSettings.moderation
         };
         if (this.outputSettings.compression !== undefined && ['jpeg', 'webp'].includes(this.outputSettings.format)) {
           serviceParams.output_compression = this.outputSettings.compression;
         }
         const result = await openaiService.streamImageGeneration(serviceParams);

         this.generatedImages = result.images;

       } else if (this.mode === 'edit' && this.image) {
         // Edit existing image
         const serviceParams = {
           image: this.image,
           images: this.referenceImages,
           mask: this.mask,
           prompt: this.prompt,
           n: 1,
           size: this.outputSettings.size,
           quality: this.mapQuality(this.outputSettings.quality),
           style: this.outputSettings.style,
           background: this.outputSettings.background,
           output_format: this.outputSettings.format,
           moderation: this.outputSettings.moderation
         };
         if (this.outputSettings.compression !== undefined && ['jpeg', 'webp'].includes(this.outputSettings.format)) {
           serviceParams.output_compression = this.outputSettings.compression;
         }
         const result = await openaiService.editImage(serviceParams);

         this.generatedImages = result.images;

       } else if (this.mode === 'variations' && this.image) {
         // Create variations
         const serviceParams = {
           image: this.image,
           n: 4,
           size: this.outputSettings.size,
           output_format: this.outputSettings.format
         };
         if (this.outputSettings.compression !== undefined && ['jpeg', 'webp'].includes(this.outputSettings.format)) {
           serviceParams.output_compression = this.outputSettings.compression;
         }
         const result = await openaiService.generateVariations(serviceParams);

         this.generatedImages = result.images;
       }

       // For edit mode: immediately confirm with first image
       if (this.mode === 'edit' && this.onConfirm && this.generatedImages.length > 0) {
         const editedImage = this.generatedImages[0];
         await this.onConfirm({ editedImage: editedImage.base64 });
         this.close();
         return;
       }

       this.currentStep = 'results';
       this.isGenerating = false;
       this.updateBody(this.renderBody());
       this.setupEventListeners();

    } catch (error) {
      console.error('Image generation failed:', error);
      this.showError(error.message || 'Failed to generate images');
      this.isGenerating = false;
      this.currentStep = 'input';
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    }
  }

  handlePartialImage(partial) {
    this.partialImages.push(partial);
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  selectResult(index) {
    const selectedImage = this.generatedImages[index];
    if (selectedImage) {
      // Update UI to show selected
      this.overlay.querySelectorAll('.result-item').forEach(item => {
        item.classList.remove('selected');
      });
      this.overlay.querySelector(`[data-index="${index}"]`).classList.add('selected');

      // Store selected image index
      this.selectedImageIndex = index;

      // Enable apply button
      const applyBtn = this.overlay.querySelector('.apply-selected-btn');
      if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.textContent = 'Apply Selected Image';
      }
    }
  }

  continueEditing() {
    // Add selected image to conversation history
    const selectedIndex = this.overlay.querySelector('.result-item.selected')?.dataset.index;
    if (selectedIndex !== undefined) {
      const selectedImage = this.generatedImages[selectedIndex];
      this.conversationHistory.push({
        prompt: this.prompt,
        image: selectedImage.base64
      });
    }

    // Reset for new input
    this.prompt = '';
    this.currentStep = 'input';
    this.generatedImages = [];
    this.partialImages = [];
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  async addSelectedToTimeline() {
    if (this.selectedImageIndex === null) return;

    const selectedImage = this.generatedImages[this.selectedImageIndex];
    if (!selectedImage) return;

    try {
      // Route based on mode: edit uses onConfirm, others use onAddToTimeline
      if (this.mode === 'edit' && this.onConfirm) {
        await this.onConfirm({ editedImage: selectedImage.base64 });
      } else if (this.onAddToTimeline) {
        await this.onAddToTimeline(selectedImage);
      } else {
        console.log('No callback configured for this action');
        this.showError('Timeline integration not configured');
        return;
      }

      this.close();
    } catch (error) {
      this.showError(`Failed: ${error.message}`);
    }
  }

  async addAllToTimeline() {
    if (this.generatedImages.length === 0) return;

    try {
      if (this.onAddToTimeline) {
        // Add all images using the callback
        for (const image of this.generatedImages) {
          await this.onAddToTimeline(image);
        }
      } else {
        console.log('Adding all images to timeline:', this.generatedImages);
        this.showError('Timeline integration not configured');
      }

      // Close modal after successful addition
      this.close();
    } catch (error) {
      this.showError(`Failed to add images to timeline: ${error.message}`);
    }
  }

  showError(message) {
    // Simple error display - you might want to enhance this
    alert(`Error: ${message}`);
  }
}

export default OpenAIImageEditorModal;