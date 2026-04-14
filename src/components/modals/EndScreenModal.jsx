import { BaseModal } from './BaseModal';

const END_SCREEN_PRESETS = [
  { id: 'subscribe', name: 'Subscribe CTA', icon: 'bell', description: 'Encourage viewers to subscribe' },
  { id: 'likeComment', name: 'Like & Comment', icon: 'heart', description: 'Boost engagement' },
  { id: 'watchMore', name: 'Watch More', icon: 'play', description: 'Link to more content' },
  { id: 'custom', name: 'Custom', icon: 'settings', description: 'Create your own' }
];

const CTA_STYLES = [
  { id: 'filled', name: 'Filled', preview: 'bg-cyan text-black' },
  { id: 'outlined', name: 'Outlined', preview: 'border-cyan text-cyan' },
  { id: 'minimal', name: 'Minimal', preview: 'text-cyan underline' }
];

const BUTTON_POSITIONS = [
  { id: 'center', name: 'Center', x: 50, y: 50 },
  { id: 'bottom-left', name: 'Bottom Left', x: 15, y: 80 },
  { id: 'bottom-right', name: 'Bottom Right', x: 85, y: 80 },
  { id: 'bottom-center', name: 'Bottom Center', x: 50, y: 80 }
];

export class EndScreenModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'End Screen Editor',
      size: 'large',
      showFooter: false,
      ...options
    });

    this.activeTab = 'presets';
    this.selectedPreset = 'subscribe';
    this.ctaButtons = [
      { id: 1, text: 'Subscribe', url: '', style: 'filled', position: 'bottom-right' }
    ];
    this.activeButtonId = 1;
    this.endScreenStyle = {
      backgroundColor: 'rgba(0,0,0,0.8)',
      textColor: '#ffffff',
      showWatermark: true,
      duration: 10
    };
    this.isPlaying = false;
    this.playbackProgress = 0;
  }

  renderBody() {
    return `
      <div class="endscreen-container">
        <div class="endscreen-tabs">
          <button class="endscreen-tab ${this.activeTab === 'presets' ? 'active' : ''}" data-tab="presets">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            Presets
          </button>
          <button class="endscreen-tab ${this.activeTab === 'buttons' ? 'active' : ''}" data-tab="buttons">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
            Buttons
          </button>
          <button class="endscreen-tab ${this.activeTab === 'style' ? 'active' : ''}" data-tab="style">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="13.5" cy="6.5" r="2.5"/>
              <circle cx="19" cy="17" r="2.5"/>
              <circle cx="6" cy="12" r="2.5"/>
              <path d="M13.5 9v2.5l3 3M8.5 12.5l-3 3M11.5 13.5l-3 3"/>
            </svg>
            Style
          </button>
          <button class="endscreen-tab ${this.activeTab === 'preview' ? 'active' : ''}" data-tab="preview">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Preview
          </button>
        </div>

        <div class="endscreen-content">
          ${this.activeTab === 'presets' ? this.renderPresetsTab() : ''}
          ${this.activeTab === 'buttons' ? this.renderButtonsTab() : ''}
          ${this.activeTab === 'style' ? this.renderStyleTab() : ''}
          ${this.activeTab === 'preview' ? this.renderPreviewTab() : ''}
        </div>
      </div>
    `;
  }

  renderPresetsTab() {
    return `
      <div class="presets-section">
        <h3 class="section-title">Choose a Preset</h3>
        <p class="section-description">Start with a template and customize it</p>
        
        <div class="presets-grid">
          ${END_SCREEN_PRESETS.map(preset => `
            <div class="preset-card ${this.selectedPreset === preset.id ? 'selected' : ''}" data-preset="${preset.id}">
              <div class="preset-icon">
                ${preset.id === 'subscribe' ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' : ''}
                ${preset.id === 'likeComment' ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' : ''}
                ${preset.id === 'watchMore' ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>' : ''}
                ${preset.id === 'custom' ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' : ''}
              </div>
              <h4>${preset.name}</h4>
              <p>${preset.description}</p>
            </div>
          `).join('')}
        </div>

        <div class="step-actions">
          <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
          <button class="modal-btn modal-btn-primary apply-preset-btn">Apply Preset</button>
        </div>
      </div>
    `;
  }

  renderButtonsTab() {
    const activeButton = this.ctaButtons.find(b => b.id === this.activeButtonId);

    return `
      <div class="buttons-section">
        <div class="buttons-list">
          <h4>CTA Buttons (${this.ctaButtons.length}/4)</h4>
          ${this.ctaButtons.map(btn => `
            <div class="button-item ${this.activeButtonId === btn.id ? 'active' : ''}" data-button-id="${btn.id}">
              <div class="button-preview">
                <span class="preview-btn ${btn.style}">${btn.text || 'Button'}</span>
              </div>
              <span class="button-label">${btn.text || `Button ${btn.id}`}</span>
              <div class="button-item-actions">
                <button class="icon-btn edit-button-btn" data-button-id="${btn.id}" aria-label="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="icon-btn remove-button-btn" data-button-id="${btn.id}" aria-label="Remove" ${this.ctaButtons.length <= 1 ? 'disabled' : ''}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          `).join('')}
          ${this.ctaButtons.length < 4 ? `
            <button class="add-button-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Button
            </button>
          ` : ''}
        </div>

        <div class="button-editor">
          ${activeButton ? `
            <h4>Edit Button</h4>
            <div class="form-group">
              <label>Button Text</label>
              <input type="text" class="form-input" value="${activeButton.text}" data-field="text" placeholder="e.g., Subscribe" />
            </div>
            <div class="form-group">
              <label>URL / Link</label>
              <input type="url" class="form-input" value="${activeButton.url}" data-field="url" placeholder="https://..." />
            </div>
            <div class="form-group">
              <label>Button Style</label>
              <div class="style-options">
                ${CTA_STYLES.map(style => `
                  <button class="style-option ${activeButton.style === style.id ? 'selected' : ''}" data-style="${style.id}">
                    <span class="style-preview ${style.preview}">Button</span>
                    <span class="style-name">${style.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>
            <div class="form-group">
              <label>Position</label>
              <div class="position-options">
                ${BUTTON_POSITIONS.map(pos => `
                  <button class="position-option ${activeButton.position === pos.id ? 'selected' : ''}" data-position="${pos.id}">
                    <div class="position-preview">
                      <div class="position-dot" style="left: ${pos.x}%; top: ${pos.y}%;"></div>
                    </div>
                    <span>${pos.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderStyleTab() {
    return `
      <div class="style-section">
        <h3 class="section-title">End Screen Style</h3>
        <p class="section-description">Customize the appearance of your end screen</p>

        <div class="style-options-grid">
          <div class="style-option-group">
            <label>Background Color</label>
            <div class="color-picker-row">
              <input type="color" class="color-picker" value="${this.endScreenStyle.backgroundColor.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+).*/,'#$1$2$3').substring(0,7) || '#000000'}" data-field="backgroundColor" />
              <input type="text" class="form-input color-text" value="${this.endScreenStyle.backgroundColor}" />
            </div>
          </div>

          <div class="style-option-group">
            <label>Text Color</label>
            <div class="color-picker-row">
              <input type="color" class="color-picker" value="${this.endScreenStyle.textColor.replace('#','') || 'ffffff'}" data-field="textColor" />
              <input type="text" class="form-input color-text" value="${this.endScreenStyle.textColor}" />
            </div>
          </div>

          <div class="style-option-group">
            <label>Duration</label>
            <div class="duration-slider">
              <input type="range" min="5" max="30" value="${this.endScreenStyle.duration}" data-field="duration" />
              <span class="duration-value">${this.endScreenStyle.duration} seconds</span>
            </div>
          </div>

          <div class="style-option-group">
            <label class="checkbox-label">
              <input type="checkbox" ${this.endScreenStyle.showWatermark ? 'checked' : ''} data-field="showWatermark" />
              <span>Show Watermark</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  renderPreviewTab() {
    return `
      <div class="preview-section">
        <h3 class="section-title">Preview</h3>
        <p class="section-description">See how your end screen will look</p>

        <div class="preview-viewport">
          <div class="endscreen-preview" style="background: ${this.endScreenStyle.backgroundColor}; color: ${this.endScreenStyle.textColor};">
            ${this.endScreenStyle.showWatermark ? `
              <div class="watermark">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            ` : ''}
            ${this.ctaButtons.map(btn => {
              const pos = BUTTON_POSITIONS.find(p => p.id === btn.position);
              return `<button class="preview-cta-btn ${btn.style}" style="left: ${pos?.x || 50}%; top: ${pos?.y || 80}%; transform: translate(-50%, -50%);">${btn.text || 'Button'}</button>`;
            }).join('')}
          </div>
          <div class="preview-controls">
            <button class="preview-play-btn ${this.isPlaying ? 'playing' : ''}" aria-label="Play preview">
              ${this.isPlaying ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'}
            </button>
            <div class="preview-progress">
              <div class="preview-progress-bar" style="width: ${this.playbackProgress}%"></div>
            </div>
            <span class="preview-time">0:${this.playbackProgress * 0.1 | 0}/${this.endScreenStyle.duration}s</span>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    this.overlay.querySelectorAll('.endscreen-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.activeTab = e.currentTarget.dataset.tab;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    if (this.activeTab === 'presets') {
      this.overlay.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', (e) => {
          this.selectedPreset = e.currentTarget.dataset.preset;
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        });
      });

      this.overlay.querySelector('.apply-preset-btn')?.addEventListener('click', () => {
        this.applyPreset();
      });
    }

    if (this.activeTab === 'buttons') {
      this.overlay.querySelectorAll('.button-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (!e.target.closest('.icon-btn')) {
            this.activeButtonId = parseInt(item.dataset.buttonId);
            this.updateBody(this.renderBody());
            this.setupEventListeners();
          }
        });
      });

      this.overlay.querySelectorAll('.edit-button-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.activeButtonId = parseInt(btn.dataset.buttonId);
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        });
      });

      this.overlay.querySelectorAll('.remove-button-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idToRemove = parseInt(btn.dataset.buttonId);
          if (this.ctaButtons.length > 1) {
            this.ctaButtons = this.ctaButtons.filter(b => b.id !== idToRemove);
            this.activeButtonId = this.ctaButtons[0].id;
            this.updateBody(this.renderBody());
            this.setupEventListeners();
          }
        });
      });

      this.overlay.querySelector('.add-button-btn')?.addEventListener('click', () => {
        const newId = Math.max(...this.ctaButtons.map(b => b.id)) + 1;
        this.ctaButtons.push({ id: newId, text: 'New Button', url: '', style: 'filled', position: 'bottom-center' });
        this.activeButtonId = newId;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });

      const textInput = this.overlay.querySelector('input[data-field="text"]');
      if (textInput) {
        textInput.addEventListener('input', (e) => {
          this.updateButtonField(this.activeButtonId, 'text', e.target.value);
        });
      }

      const urlInput = this.overlay.querySelector('input[data-field="url"]');
      if (urlInput) {
        urlInput.addEventListener('input', (e) => {
          this.updateButtonField(this.activeButtonId, 'url', e.target.value);
        });
      }

      this.overlay.querySelectorAll('.style-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
          this.updateButtonField(this.activeButtonId, 'style', opt.dataset.style);
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        });
      });

      this.overlay.querySelectorAll('.position-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
          this.updateButtonField(this.activeButtonId, 'position', opt.dataset.position);
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        });
      });
    }

    if (this.activeTab === 'style') {
      const durationSlider = this.overlay.querySelector('input[data-field="duration"]');
      if (durationSlider) {
        durationSlider.addEventListener('input', (e) => {
          this.endScreenStyle.duration = parseInt(e.target.value);
          const valueSpan = durationSlider.parentElement.querySelector('.duration-value');
          if (valueSpan) valueSpan.textContent = `${e.target.value} seconds`;
        });
      }
    }

    if (this.activeTab === 'preview') {
      this.overlay.querySelector('.preview-play-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
          this.playPreview();
        }
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    }
  }

  updateButtonField(buttonId, field, value) {
    const button = this.ctaButtons.find(b => b.id === buttonId);
    if (button) {
      button[field] = value;
    }
  }

  applyPreset() {
    const presets = {
      subscribe: [{ text: 'Subscribe', url: '', style: 'filled', position: 'bottom-right' }],
      likeComment: [
        { text: 'Like', url: '', style: 'outlined', position: 'bottom-left' },
        { text: 'Comment', url: '', style: 'outlined', position: 'bottom-right' }
      ],
      watchMore: [{ text: 'Watch More', url: '', style: 'filled', position: 'center' }],
      custom: [{ text: 'Click Here', url: '', style: 'filled', position: 'bottom-center' }]
    };

    this.ctaButtons = presets[this.selectedPreset] || presets.custom;
    this.activeButtonId = this.ctaButtons[0].id;
    this.onConfirm({ action: 'presetApplied', preset: this.selectedPreset, buttons: this.ctaButtons });
    this.close();
  }

  playPreview() {
    this.playbackProgress = 0;
    const interval = setInterval(() => {
      this.playbackProgress += 1;
      if (this.playbackProgress >= 100 || !this.isPlaying) {
        clearInterval(interval);
        if (this.playbackProgress >= 100) {
          this.isPlaying = false;
          this.playbackProgress = 0;
        }
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      }
    }, this.endScreenStyle.duration * 10);
  }
}

export default EndScreenModal;
