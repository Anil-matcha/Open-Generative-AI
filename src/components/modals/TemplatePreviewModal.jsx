import { BaseModal } from './BaseModal';

export class TemplatePreviewModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Template Preview',
      size: 'full',
      ...options
    });

    this.template = options.template || null;
    this.previewMode = options.previewMode || 'desktop'; // desktop, tablet, mobile
    this.showControls = options.showControls !== false;
  }

  renderBody() {
    if (!this.template) {
      return `
        <div class="template-preview-empty">
          <div class="empty-state">
            <span class="empty-icon">📋</span>
            <h3>No Template Selected</h3>
            <p>Select a template to preview it here.</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="template-preview-container">
        ${this.showControls ? this.renderPreviewControls() : ''}

        <div class="preview-viewport ${this.previewMode}">
          <div class="preview-content">
            ${this.renderTemplateContent()}
          </div>
        </div>

        <div class="preview-info">
          <div class="template-details">
            <h4>${this.template.name || 'Template Preview'}</h4>
            <div class="template-meta">
              <span class="template-category">${this.template.category || 'General'}</span>
              <span class="template-duration">${this.template.duration || '0:00'}</span>
              <span class="template-resolution">${this.template.resolution || '1920x1080'}</span>
            </div>
          </div>

          <div class="preview-actions">
            <button class="modal-btn modal-btn-secondary preview-edit">
              Edit Template
            </button>
            <button class="modal-btn modal-btn-primary preview-use">
              Use This Template
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderPreviewControls() {
    return `
      <div class="preview-controls">
        <div class="control-group">
          <label>Preview Mode:</label>
          <div class="mode-buttons">
            <button class="mode-btn ${this.previewMode === 'desktop' ? 'active' : ''}" data-mode="desktop">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Desktop
            </button>
            <button class="mode-btn ${this.previewMode === 'tablet' ? 'active' : ''}" data-mode="tablet">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12" y2="18"/>
              </svg>
              Tablet
            </button>
            <button class="mode-btn ${this.previewMode === 'mobile' ? 'active' : ''}" data-mode="mobile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12" y2="18"/>
              </svg>
              Mobile
            </button>
          </div>
        </div>

        <div class="control-group">
          <button class="modal-btn modal-btn-secondary preview-play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            Play Preview
          </button>
        </div>
      </div>
    `;
  }

  renderTemplateContent() {
    if (!this.template) return '';

    // This would render the actual template content
    // For now, show a placeholder representation
    return `
      <div class="template-canvas" style="
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
      ">
        <div class="template-placeholder">
          <span class="template-icon">${this.getTemplateIcon(this.template.type)}</span>
          <h3>${this.template.name}</h3>
          <p>Template preview would render here</p>
          <small>${this.template.description || 'Template content'}</small>
        </div>
      </div>
    `;
  }

  getTemplateIcon(type) {
    const icons = {
      video: '🎬',
      image: '🖼️',
      text: '📝',
      cinematic: '🎭',
      social: '📱',
      business: '💼',
      educational: '📚'
    };
    return icons[type] || '📋';
  }

  setupEventListeners() {
    super.setupEventListeners();

    const modeButtons = this.overlay?.querySelectorAll('.mode-btn');
    const playBtn = this.overlay?.querySelector('.preview-play');
    const editBtn = this.overlay?.querySelector('.preview-edit');
    const useBtn = this.overlay?.querySelector('.preview-use');

    modeButtons?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.setPreviewMode(mode);
      });
    });

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.playPreview();
      });
    }

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.editTemplate();
      });
    }

    if (useBtn) {
      useBtn.addEventListener('click', () => {
        this.useTemplate();
      });
    }
  }

  setPreviewMode(mode) {
    this.previewMode = mode;

    const viewport = this.overlay?.querySelector('.preview-viewport');
    const modeButtons = this.overlay?.querySelectorAll('.mode-btn');

    if (viewport) {
      viewport.className = `preview-viewport ${mode}`;
    }

    modeButtons?.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  playPreview() {
    // Template preview playback logic
    console.log('Playing template preview...');
  }

  editTemplate() {
    // Open template editor
    console.log('Opening template editor...');
    this.close();
  }

  useTemplate() {
    // Use this template
    console.log('Using template...');
    this.close();
  }
}