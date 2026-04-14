import { BaseModal } from './BaseModal';

const EDITOR_TOOLS = [
  { id: 'crop', name: 'Crop', icon: '✂' },
  { id: 'rotate', name: 'Rotate', icon: '↻' },
  { id: 'flip', name: 'Flip', icon: '⇆' },
  { id: 'sharpen', name: 'Sharpen', icon: '◆' },
  { id: 'blur', name: 'Blur', icon: '○' },
  { id: 'brightness', name: 'Brightness', icon: '☀' }
];

const FILTERS = [
  { id: 'none', name: 'None', preview: 'linear-gradient(135deg, #666, #999)' },
  { id: 'vintage', name: 'Vintage', preview: 'linear-gradient(135deg, #8b7355, #c4a77d)', filter: 'sepia(0.5) saturate(1.2)' },
  { id: 'cool', name: 'Cool', preview: 'linear-gradient(135deg, #4a90d9, #67b5e8)', filter: 'hue-rotate(20deg) saturate(1.1)' },
  { id: 'warm', name: 'Warm', preview: 'linear-gradient(135deg, #e8a84c, #f5c77d)', filter: 'sepia(0.3) saturate(1.3)' },
  { id: 'dramatic', name: 'Dramatic', preview: 'linear-gradient(135deg, #2c3e50, #4a69ad)', filter: 'contrast(1.3) saturate(0.8)' },
  { id: 'fade', name: 'Fade', preview: 'linear-gradient(135deg, #b8c5d6, #d5dde6)', filter: 'brightness(1.1) saturate(0.7)' },
  { id: 'bw', name: 'B&W', preview: 'linear-gradient(135deg, #333, #666)', filter: 'grayscale(1)' },
  { id: 'sepia', name: 'Sepia', preview: 'linear-gradient(135deg, #8b4513, #d2691e)', filter: 'sepia(0.8)' },
  { id: 'cinema', name: 'Cinema', preview: 'linear-gradient(135deg, #1a1a2e, #16213e)', filter: 'contrast(1.2) saturate(0.9) brightness(0.9)' },
  { id: 'vivid', name: 'Vivid', preview: 'linear-gradient(135deg, #e74c3c, #9b59b6)', filter: 'saturate(1.5) contrast(1.1)' },
  { id: 'muted', name: 'Muted', preview: 'linear-gradient(135deg, #7f8c8d, #95a5a6)', filter: 'saturate(0.6) brightness(1.1)' },
  { id: 'golden', name: 'Golden', preview: 'linear-gradient(135deg, #d4af37, #f0e68c)', filter: 'sepia(0.4) saturate(1.2) brightness(1.05)' }
];

const STICKER_CATEGORIES = [
  { id: 'emoji', name: 'Emoji', icon: '😀' },
  { id: 'shapes', name: 'Shapes', icon: '⬡' },
  { id: 'badges', name: 'Badges', icon: '★' },
  { id: 'arrows', name: 'Arrows', icon: '→' }
];

const TEXT_STYLES = [
  { id: 'modern', name: 'Modern', font: 'Inter' },
  { id: 'bold', name: 'Bold', font: 'Inter', weight: 700 },
  { id: 'handwritten', name: 'Handwritten', font: 'Caveat' },
  { id: 'serif', name: 'Serif', font: 'Playfair Display' }
];

export class ImglyImageEditorModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Image Editor',
      size: 'full',
      showFooter: false,
      ...options
    });

    this.imageUrl = options.imageUrl || '';
    this.currentTool = 'crop';
    this.currentFilter = 'none';
    this.brightness = 100;
    this.contrast = 100;
    this.saturation = 100;
    this.selectedStickers = [];
    this.textElements = [];
    this.history = [];
    this.historyIndex = -1;
    this.isProcessing = false;
    this.zoom = 1;
  }

  renderBody() {
    return `
      <div class="imgly-editor-container">
        <div class="imgly-editor-main">
          <div class="imgly-toolbar">
            <div class="toolbar-group">
              <button class="toolbar-btn ${this.currentTool === 'crop' ? 'active' : ''}" data-tool="crop" aria-label="Crop tool">
                <span class="tool-icon">✂</span>
                <span class="tool-label">Crop</span>
              </button>
              <button class="toolbar-btn ${this.currentTool === 'rotate' ? 'active' : ''}" data-tool="rotate" aria-label="Rotate tool">
                <span class="tool-icon">↻</span>
                <span class="tool-label">Rotate</span>
              </button>
              <button class="toolbar-btn ${this.currentTool === 'flip' ? 'active' : ''}" data-tool="flip" aria-label="Flip tool">
                <span class="tool-icon">⇆</span>
                <span class="tool-label">Flip</span>
              </button>
            </div>
            <div class="toolbar-divider"></div>
            <div class="toolbar-group">
              <button class="toolbar-btn" data-tool="sharpen" aria-label="Sharpen">
                <span class="tool-icon">◆</span>
                <span class="tool-label">Sharpen</span>
              </button>
              <button class="toolbar-btn" data-tool="blur" aria-label="Blur">
                <span class="tool-icon">○</span>
                <span class="tool-label">Blur</span>
              </button>
            </div>
            <div class="toolbar-divider"></div>
            <div class="toolbar-group">
              <button class="toolbar-btn" data-action="undo" aria-label="Undo" ${this.historyIndex <= 0 ? 'disabled' : ''}>
                <span class="tool-icon">↩</span>
              </button>
              <button class="toolbar-btn" data-action="redo" aria-label="Redo" ${this.historyIndex >= this.history.length - 1 ? 'disabled' : ''}>
                <span class="tool-icon">↪</span>
              </button>
            </div>
          </div>

          <div class="imgly-canvas-area" style="transform: scale(${this.zoom})">
            ${this.imageUrl ? `
              <div class="imgly-image-wrapper">
                <img src="${this.imageUrl}" alt="Editing" class="imgly-preview-image" style="filter: ${this.getFilterStyle()}" />
                ${this.selectedStickers.map(s => `<div class="sticker-element" style="left: ${s.x}%; top: ${s.y}%;">${s.icon}</div>`).join('')}
                ${this.textElements.map(t => `<div class="text-element" style="left: ${t.x}%; top: ${t.y}%; font-family: ${t.font}; font-weight: ${t.weight || 400}; color: ${t.color};">${t.text}</div>`).join('')}
              </div>
            ` : `
              <div class="imgly-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <p>Drop an image here or click to upload</p>
              </div>
            `}
          </div>

          <div class="imgly-zoom-controls">
            <button class="zoom-btn" data-zoom="out" aria-label="Zoom out">−</button>
            <span class="zoom-level">${Math.round(this.zoom * 100)}%</span>
            <button class="zoom-btn" data-zoom="in" aria-label="Zoom in">+</button>
            <button class="zoom-btn fit-btn" data-zoom="fit" aria-label="Fit to screen">⊡</button>
          </div>
        </div>

        <div class="imgly-sidebar">
          <div class="sidebar-tabs">
            <button class="sidebar-tab active" data-tab="filters">Filters</button>
            <button class="sidebar-tab" data-tab="adjust">Adjust</button>
            <button class="sidebar-tab" data-tab="stickers">Stickers</button>
            <button class="sidebar-tab" data-tab="text">Text</button>
          </div>

          <div class="sidebar-content">
            <div class="tab-panel active" data-panel="filters">
              <div class="filters-grid">
                ${FILTERS.map(filter => `
                  <button class="filter-item ${this.currentFilter === filter.id ? 'active' : ''}" data-filter="${filter.id}" aria-label="${filter.name}">
                    <div class="filter-preview" style="background: ${filter.preview}"></div>
                    <span class="filter-name">${filter.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="tab-panel" data-panel="adjust" style="display: none;">
              <div class="adjustment-sliders">
                <div class="slider-group">
                  <label>Brightness</label>
                  <input type="range" class="adjust-slider" data-adjust="brightness" min="0" max="200" value="${this.brightness}" />
                  <span class="slider-value">${this.brightness}%</span>
                </div>
                <div class="slider-group">
                  <label>Contrast</label>
                  <input type="range" class="adjust-slider" data-adjust="contrast" min="0" max="200" value="${this.contrast}" />
                  <span class="slider-value">${this.contrast}%</span>
                </div>
                <div class="slider-group">
                  <label>Saturation</label>
                  <input type="range" class="adjust-slider" data-adjust="saturation" min="0" max="200" value="${this.saturation}" />
                  <span class="slider-value">${this.saturation}%</span>
                </div>
              </div>
              <div class="reset-adjustments">
                <button class="text-btn" data-action="reset-adjust">Reset Adjustments</button>
              </div>
            </div>

            <div class="tab-panel" data-panel="stickers" style="display: none;">
              <div class="sticker-categories">
                ${STICKER_CATEGORIES.map(cat => `
                  <button class="category-btn ${cat.id === 'emoji' ? 'active' : ''}" data-category="${cat.id}">
                    <span class="cat-icon">${cat.icon}</span>
                    <span class="cat-name">${cat.name}</span>
                  </button>
                `).join('')}
              </div>
              <div class="sticker-grid">
                ${['😀', '😎', '🔥', '💯', '⭐', '✨', '👏', '🙌', '💪', '🎉', '❤️', '👍'].map(emoji => `
                  <button class="sticker-btn" data-sticker="${emoji}" aria-label="Add ${emoji} sticker">${emoji}</button>
                `).join('')}
              </div>
            </div>

            <div class="tab-panel" data-panel="text" style="display: none;">
              <div class="text-style-grid">
                ${TEXT_STYLES.map(style => `
                  <button class="text-style-btn ${style.id === 'modern' ? 'active' : ''}" data-text-style="${style.id}">
                    <span class="style-preview" style="font-family: ${style.font}; font-weight: ${style.weight || 400}">Aa</span>
                    <span class="style-name">${style.name}</span>
                  </button>
                `).join('')}
              </div>
              <div class="text-controls">
                <div class="color-picker-group">
                  <label>Color</label>
                  <input type="color" class="text-color" value="#ffffff" />
                </div>
                <button class="add-text-btn modal-btn modal-btn-primary">Add Text</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer imgly-footer">
        <div class="footer-left">
          <span class="unsaved-badge" style="display: ${this.historyIndex >= 0 ? 'flex' : 'none'}">Unsaved changes</span>
        </div>
        <div class="footer-right">
          <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
          <button class="modal-btn modal-btn-secondary" data-action="reset">Reset</button>
          <button class="modal-btn modal-btn-primary" data-action="save" ${this.isProcessing ? 'disabled' : ''}>
            ${this.isProcessing ? '<span class="btn-spinner"></span> Processing...' : 'Apply & Save'}
          </button>
        </div>
      </div>
    `;
  }

  getFilterStyle() {
    const filterMap = {
      none: '',
      vintage: 'sepia(0.5) saturate(1.2)',
      cool: 'hue-rotate(20deg) saturate(1.1)',
      warm: 'sepia(0.3) saturate(1.3)',
      dramatic: 'contrast(1.3) saturate(0.8)',
      fade: 'brightness(1.1) saturate(0.7)',
      bw: 'grayscale(1)',
      sepia: 'sepia(0.8)',
      cinema: 'contrast(1.2) saturate(0.9) brightness(0.9)',
      vivid: 'saturate(1.5) contrast(1.1)',
      muted: 'saturate(0.6) brightness(1.1)',
      golden: 'sepia(0.4) saturate(1.2) brightness(1.05)'
    };
    const baseFilter = filterMap[this.currentFilter] || '';
    const adjustments = `brightness(${this.brightness / 100}) contrast(${this.contrast / 100}) saturate(${this.saturation / 100})`;
    return baseFilter ? `${baseFilter} ${adjustments}` : adjustments;
  }

  setupEventListeners() {
    super.setupEventListeners();

    this.overlay.querySelectorAll('.toolbar-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentTool = btn.dataset.tool;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.toolbar-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.action === 'undo' && this.historyIndex > 0) {
          this.historyIndex--;
        } else if (btn.dataset.action === 'redo' && this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
        }
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.filter-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentFilter = btn.dataset.filter;
        this.pushHistory();
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.adjust-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const adjust = e.target.dataset.adjust;
        this[adjust] = parseInt(e.target.value);
        const valueSpan = slider.parentElement.querySelector('.slider-value');
        if (valueSpan) valueSpan.textContent = `${this[adjust]}%`;
      });
      slider.addEventListener('change', () => this.pushHistory());
    });

    this.overlay.querySelector('.sidebar-tab[data-tab="adjust"]')?.addEventListener('click', () => {
      this.overlay.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
      this.overlay.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      btn => btn.classList.add('active');
      this.overlay.querySelector('[data-panel="adjust"]').style.display = 'block';
      this.overlay.querySelector('[data-panel="adjust"]').classList.add('active');
    });

    this.overlay.querySelectorAll('.sidebar-tab').forEach(tab => {
      if (!tab.dataset.tab.includes('adjust')) {
        tab.addEventListener('click', (e) => {
          this.overlay.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
          this.overlay.querySelectorAll('.tab-panel').forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
          e.target.classList.add('active');
          const panel = this.overlay.querySelector(`[data-panel="${e.target.dataset.tab}"]`);
          if (panel) { panel.style.display = 'block'; panel.classList.add('active'); }
        });
      }
    });

    this.overlay.querySelectorAll('.zoom-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.zoom === 'in') this.zoom = Math.min(3, this.zoom + 0.25);
        else if (btn.dataset.zoom === 'out') this.zoom = Math.max(0.25, this.zoom - 0.25);
        else this.zoom = 1;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.sticker-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedStickers.push({ icon: btn.dataset.sticker, x: 50, y: 50 });
        this.pushHistory();
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelector('.add-text-btn')?.addEventListener('click', () => {
      this.textElements.push({ text: 'Text', x: 50, y: 50, font: 'Inter', color: '#ffffff' });
      this.pushHistory();
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    });

    this.overlay.querySelector('.imgly-placeholder')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            this.imageUrl = ev.target.result;
            this.pushHistory();
            this.updateBody(this.renderBody());
            this.setupEventListeners();
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    });

    this.overlay.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
      this.currentFilter = 'none';
      this.brightness = 100;
      this.contrast = 100;
      this.saturation = 100;
      this.selectedStickers = [];
      this.textElements = [];
      this.history = [];
      this.historyIndex = -1;
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    });

    this.overlay.querySelector('[data-action="save"]')?.addEventListener('click', () => this.saveImage());
  }

  pushHistory() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({
      filter: this.currentFilter,
      brightness: this.brightness,
      contrast: this.contrast,
      saturation: this.saturation,
      stickers: [...this.selectedStickers],
      text: [...this.textElements]
    });
    this.historyIndex = this.history.length - 1;
  }

  saveImage() {
    this.isProcessing = true;
    this.updateBody(this.renderBody());
    this.setupEventListeners();

    setTimeout(() => {
      this.onConfirm({
        action: 'imageEdited',
        imageUrl: this.imageUrl,
        filter: this.currentFilter,
        brightness: this.brightness,
        contrast: this.contrast,
        saturation: this.saturation,
        stickers: this.selectedStickers,
        textElements: this.textElements
      });
      this.close();
    }, 800);
  }
}

export default ImglyImageEditorModal;