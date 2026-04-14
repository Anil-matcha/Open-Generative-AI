import { BaseModal } from './BaseModal';

export class AdvanceImageEditorModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Image Editor',
      size: 'full',
      ...options
    });
    
    this.image = options.image || null;
    this.tools = {
      backgroundRemoval: false,
      enhancement: false,
      filters: false,
      crop: false,
      rotate: false,
      flip: false,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      sharpen: 0,
      selectedFilter: 'none',
      activeTool: 'none'
    };
    this.availableFilters = [
      { id: 'none', name: 'Original' },
      { id: 'vintage', name: 'Vintage' },
      { id: 'cool', name: 'Cool' },
      { id: 'warm', name: 'Warm' },
      { id: 'dramatic', name: 'Dramatic' },
      { id: 'fade', name: 'Fade' },
      { id: 'bw', name: 'B&W' },
      { id: 'sepia', name: 'Sepia' }
    ];
    this.isProcessing = false;
    this.hasChanges = false;
  }

  renderBody() {
    return `
      <div class="image-editor-container">
        <div class="image-editor-sidebar">
          <div class="editor-tool-section">
            <h4 class="editor-section-title">Tools</h4>
            <div class="editor-tools-grid">
              <button class="editor-tool-btn ${this.tools.activeTool === 'backgroundRemoval' ? 'active' : ''}" data-tool="backgroundRemoval" aria-label="Background Removal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/>
                </svg>
                <span>Remove BG</span>
              </button>
              <button class="editor-tool-btn ${this.tools.activeTool === 'enhancement' ? 'active' : ''}" data-tool="enhancement" aria-label="Enhancement">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <span>Enhance</span>
              </button>
              <button class="editor-tool-btn ${this.tools.activeTool === 'filters' ? 'active' : ''}" data-tool="filters" aria-label="Filters">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12,2 22,22 2,22"/>
                </svg>
                <span>Filters</span>
              </button>
              <button class="editor-tool-btn ${this.tools.activeTool === 'crop' ? 'active' : ''}" data-tool="crop" aria-label="Crop">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2v6H2M18 22v-6h4M6 16a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-4a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4"/>
                </svg>
                <span>Crop</span>
              </button>
              <button class="editor-tool-btn ${this.tools.activeTool === 'rotate' ? 'active' : ''}" data-tool="rotate" aria-label="Rotate">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                <span>Rotate</span>
              </button>
              <button class="editor-tool-btn ${this.tools.activeTool === 'adjust' ? 'active' : ''}" data-tool="adjust" aria-label="Adjust">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
                <span>Adjust</span>
              </button>
            </div>
          </div>

          ${this.renderFiltersPanel()}
          ${this.renderAdjustmentsPanel()}
          ${this.renderCropPanel()}
          ${this.renderBackgroundRemovalPanel()}
        </div>

        <div class="image-editor-preview">
          <div class="image-preview-area">
            ${this.image ? `
              <div class="image-with-overlay">
                <img src="${this.image}" alt="Editing" class="preview-image" />
                <div class="image-overlay-info">
                  <span>Image loaded</span>
                </div>
              </div>
            ` : `
              <div class="image-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>Select an image to edit</p>
                <button class="modal-btn modal-btn-primary load-image-btn">Load Image</button>
              </div>
            `}
          </div>
          ${this.hasChanges ? '<div class="unsaved-indicator">Unsaved changes</div>' : ''}
        </div>
      </div>
    `;
  }

  renderFiltersPanel() {
    if (this.tools.activeTool !== 'filters') return '';
    return `
      <div class="editor-panel" data-panel="filters">
        <h4 class="editor-section-title">Filters</h4>
        <div class="filters-grid">
          ${this.availableFilters.map(filter => `
            <button class="filter-btn ${this.tools.selectedFilter === filter.id ? 'active' : ''}" data-filter="${filter.id}">
              <div class="filter-preview filter-${filter.id}"></div>
              <span>${filter.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderAdjustmentsPanel() {
    if (this.tools.activeTool !== 'adjust' && this.tools.activeTool !== 'enhancement') return '';
    const { brightness, contrast, saturation, blur, sharpen } = this.tools;
    return `
      <div class="editor-panel" data-panel="adjustments">
        <h4 class="editor-section-title">Adjustments</h4>
        <div class="adjustment-sliders">
          <div class="slider-group">
            <label>Brightness</label>
            <input type="range" min="0" max="200" value="${brightness}" data-adjust="brightness" />
            <span class="slider-value">${brightness}%</span>
          </div>
          <div class="slider-group">
            <label>Contrast</label>
            <input type="range" min="0" max="200" value="${contrast}" data-adjust="contrast" />
            <span class="slider-value">${contrast}%</span>
          </div>
          <div class="slider-group">
            <label>Saturation</label>
            <input type="range" min="0" max="200" value="${saturation}" data-adjust="saturation" />
            <span class="slider-value">${saturation}%</span>
          </div>
          <div class="slider-group">
            <label>Blur</label>
            <input type="range" min="0" max="20" value="${blur}" data-adjust="blur" />
            <span class="slider-value">${blur}px</span>
          </div>
          <div class="slider-group">
            <label>Sharpen</label>
            <input type="range" min="0" max="100" value="${sharpen}" data-adjust="sharpen" />
            <span class="slider-value">${sharpen}%</span>
          </div>
        </div>
        <button class="modal-btn modal-btn-secondary reset-adjustments-btn">Reset All</button>
      </div>
    `;
  }

  renderCropPanel() {
    if (this.tools.activeTool !== 'crop') return '';
    return `
      <div class="editor-panel" data-panel="crop">
        <h4 class="editor-section-title">Aspect Ratio</h4>
        <div class="crop-ratios">
          <button class="crop-ratio-btn active" data-ratio="free">Free</button>
          <button class="crop-ratio-btn" data-ratio="1:1">1:1</button>
          <button class="crop-ratio-btn" data-ratio="4:3">4:3</button>
          <button class="crop-ratio-btn" data-ratio="16:9">16:9</button>
          <button class="crop-ratio-btn" data-ratio="9:16">9:16</button>
          <button class="crop-ratio-btn" data-ratio="3:2">3:2</button>
        </div>
        <div class="crop-actions">
          <button class="modal-btn modal-btn-secondary rotate-left-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 2v6h6M21.5 22v-6h-6"/></svg>
            Rotate Left
          </button>
          <button class="modal-btn modal-btn-secondary rotate-right-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6"/></svg>
            Rotate Right
          </button>
        </div>
      </div>
    `;
  }

  renderBackgroundRemovalPanel() {
    if (this.tools.activeTool !== 'backgroundRemoval') return '';
    return `
      <div class="editor-panel" data-panel="backgroundRemoval">
        <h4 class="editor-section-title">Background Removal</h4>
        <p class="panel-description">AI-powered background removal will automatically detect and remove the background from your image.</p>
        <div class="bg-removal-options">
          <button class="modal-btn modal-btn-primary start-removal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v18M3 12h18"/>
            </svg>
            Start Removal
          </button>
        </div>
        <div class="bg-removal-preview" style="display:none;">
          <div class="preview-placeholder">Processing...</div>
        </div>
      </div>
    `;
  }

  renderFooter() {
    return `
      <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
      <button class="modal-btn modal-btn-secondary reset-btn">Reset Changes</button>
      <button class="modal-btn modal-btn-primary apply-btn" ${this.isProcessing ? 'disabled' : ''}>
        ${this.isProcessing ? '<span class="btn-spinner"></span> Processing...' : 'Apply Changes'}
      </button>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    this.overlay.querySelectorAll('.editor-tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = e.currentTarget.dataset.tool;
        this.setActiveTool(tool);
      });
    });

    this.overlay.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.currentTarget.dataset.filter;
        this.setFilter(filter);
      });
    });

    this.overlay.querySelectorAll('input[type="range"]').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const adjustment = e.target.dataset.adjust;
        const value = parseInt(e.target.value);
        this.setAdjustment(adjustment, value);
      });
    });

    this.overlay.querySelectorAll('.crop-ratio-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ratio = e.currentTarget.dataset.ratio;
        this.setCropRatio(ratio);
      });
    });

    const resetBtn = this.overlay.querySelector('.reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetChanges());
    }

    const resetAdjBtn = this.overlay.querySelector('.reset-adjustments-btn');
    if (resetAdjBtn) {
      resetAdjBtn.addEventListener('click', () => this.resetAdjustments());
    }

    const applyBtn = this.overlay.querySelector('.apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyChanges());
    }
  }

  setActiveTool(tool) {
    this.tools.activeTool = tool;
    this.updateBody(this.renderBody());
    this.setupEventListeners();
    this.hasChanges = true;
  }

  setFilter(filterId) {
    this.tools.selectedFilter = filterId;
    this.hasChanges = true;
    const filterBtns = this.overlay.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filterId);
    });
  }

  setAdjustment(name, value) {
    this.tools[name] = value;
    this.hasChanges = true;
    const slider = this.overlay.querySelector(`input[data-adjust="${name}"]`);
    if (slider) {
      const valueSpan = slider.parentElement.querySelector('.slider-value');
      if (valueSpan) {
        valueSpan.textContent = name === 'blur' ? `${value}px` : `${value}%`;
      }
    }
  }

  setCropRatio(ratio) {
    const btns = this.overlay.querySelectorAll('.crop-ratio-btn');
    btns.forEach(btn => btn.classList.toggle('active', btn.dataset.ratio === ratio));
  }

  resetChanges() {
    this.tools = {
      backgroundRemoval: false,
      enhancement: false,
      filters: false,
      crop: false,
      rotate: false,
      flip: false,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      sharpen: 0,
      selectedFilter: 'none',
      activeTool: 'none'
    };
    this.hasChanges = false;
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  resetAdjustments() {
    this.tools.brightness = 100;
    this.tools.contrast = 100;
    this.tools.saturation = 100;
    this.tools.blur = 0;
    this.tools.sharpen = 0;
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  async applyChanges() {
    this.isProcessing = true;
    this.updateBody(this.renderBody());
    this.setupEventListeners();

    setTimeout(() => {
      this.isProcessing = false;
      this.hasChanges = false;
      this.onConfirm(this.tools);
      this.close();
    }, 1500);
  }
}

export default AdvanceImageEditorModal;
