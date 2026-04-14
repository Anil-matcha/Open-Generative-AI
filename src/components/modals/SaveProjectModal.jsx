import { BaseModal } from './BaseModal';

const PROJECT_TEMPLATES = [
  { id: 'blank', name: 'Blank Project', icon: '📄', description: 'Start from scratch' },
  { id: 'marketing', name: 'Marketing Video', icon: '📊', description: 'Promo & ads template' },
  { id: 'social', name: 'Social Media', icon: '📱', description: 'Square/vertical formats' },
  { id: 'tutorial', name: 'Tutorial', icon: '📚', description: 'Educational content' }
];

const TAG_SUGGESTIONS = ['marketing', 'social', 'tutorial', 'product', 'brand', 'campaign', 'intro', 'outro'];

export class SaveProjectModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Save Project',
      size: 'medium',
      showFooter: false,
      ...options
    });

    this.projectName = options.projectName || '';
    this.projectTags = options.projectTags || [];
    this.projectLocation = options.projectLocation || 'My Projects';
    this.autoSaveEnabled = options.autoSaveEnabled ?? true;
    this.autoSaveInterval = options.autoSaveInterval || 5;
    this.includePreview = options.includePreview ?? true;
    this.selectedTemplate = null;
    this.tagInput = '';
    this.isSaving = false;
    this.lastSaved = options.lastSaved || null;
  }

  renderBody() {
    return `
      <div class="saveproject-container">
        <div class="saveproject-form">
          <div class="form-section">
            <label class="form-label">Project Name</label>
            <input type="text" class="form-input project-name-input" 
                   value="${this.projectName}" 
                   placeholder="Enter project name..."
                   aria-label="Project name" />
          </div>

          <div class="form-section">
            <label class="form-label">Tags</label>
            <div class="tags-input-container">
              <div class="tags-display">
                ${this.projectTags.map((tag, idx) => `
                  <span class="tag">
                    ${tag}
                    <button class="tag-remove" data-index="${idx}" aria-label="Remove tag">×</button>
                  </span>
                `).join('')}
                <input type="text" class="tag-input-field" 
                       value="${this.tagInput}"
                       placeholder="${this.projectTags.length === 0 ? 'Add tags...' : ''}"
                       aria-label="Add tags" />
              </div>
              <div class="tag-suggestions">
                ${TAG_SUGGESTIONS.filter(t => !this.projectTags.includes(t)).slice(0, 4).map(tag => `
                  <button class="suggestion-chip" data-tag="${tag}">${tag}</button>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="form-section">
            <label class="form-label">Location</label>
            <div class="location-selector">
              <button class="location-btn">
                <span class="folder-icon">📁</span>
                <span class="folder-path">${this.projectLocation}</span>
                <span class="chevron">▼</span>
              </button>
              <div class="location-dropdown">
                <div class="location-option selected">
                  <span>📁</span> My Projects
                </div>
                <div class="location-option">
                  <span>📁</span> Work
                </div>
                <div class="location-option">
                  <span>📁</span> Personal
                </div>
                <div class="location-option">
                  <span>📁</span> Client Projects
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <label class="form-label">Template</label>
            <div class="template-grid">
              ${PROJECT_TEMPLATES.map(t => `
                <button class="template-card ${this.selectedTemplate === t.id ? 'selected' : ''}" data-template="${t.id}">
                  <span class="template-icon">${t.icon}</span>
                  <span class="template-name">${t.name}</span>
                  <span class="template-desc">${t.description}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="saveproject-options">
          <div class="options-section">
            <h4>Auto-Save</h4>
            <label class="toggle-label">
              <input type="checkbox" class="toggle-input" ${this.autoSaveEnabled ? 'checked' : ''} data-option="autoSave" />
              <span class="toggle-switch"></span>
              <span class="toggle-text">Enable auto-save</span>
            </label>
            ${this.autoSaveEnabled ? `
              <div class="interval-selector">
                <span>Save every</span>
                <select class="interval-select" data-option="interval">
                  <option value="1" ${this.autoSaveInterval === 1 ? 'selected' : ''}>1 min</option>
                  <option value="3" ${this.autoSaveInterval === 3 ? 'selected' : ''}>3 min</option>
                  <option value="5" ${this.autoSaveInterval === 5 ? 'selected' : ''}>5 min</option>
                  <option value="10" ${this.autoSaveInterval === 10 ? 'selected' : ''}>10 min</option>
                </select>
              </div>
            ` : ''}
          </div>

          <div class="options-section">
            <h4>Export Options</h4>
            <label class="toggle-label">
              <input type="checkbox" class="toggle-input" ${this.includePreview ? 'checked' : ''} data-option="preview" />
              <span class="toggle-switch"></span>
              <span class="toggle-text">Generate preview thumbnail</span>
            </label>
          </div>

          ${this.lastSaved ? `
            <div class="last-saved-info">
              <span class="saved-icon">✓</span>
              <span class="saved-text">Last saved: ${this.formatDate(this.lastSaved)}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="modal-footer saveproject-footer">
        <div class="footer-left">
          <button class="modal-btn modal-btn-secondary" data-action="save-as">
            Save As...
          </button>
        </div>
        <div class="footer-right">
          <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
          <button class="modal-btn modal-btn-primary" data-action="save" ${this.isSaving || !this.projectName ? 'disabled' : ''}>
            ${this.isSaving ? '<span class="btn-spinner"></span> Saving...' : '💾 Save Project'}
          </button>
        </div>
      </div>
    `;
  }

  formatDate(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  setupEventListeners() {
    super.setupEventListeners();

    const nameInput = this.overlay.querySelector('.project-name-input');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        this.projectName = e.target.value;
        this.updateFooterState();
      });
    }

    const tagInputField = this.overlay.querySelector('.tag-input-field');
    if (tagInputField) {
      tagInputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const tag = this.tagInput.trim();
          if (tag && !this.projectTags.includes(tag)) {
            this.projectTags.push(tag);
            this.tagInput = '';
            this.updateBody(this.renderBody());
            this.setupEventListeners();
          }
        } else if (e.key === 'Backspace' && this.tagInput === '' && this.projectTags.length > 0) {
          this.projectTags.pop();
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        } else {
          this.tagInput = e.target.value;
        }
      });
    }

    this.overlay.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.projectTags.splice(idx, 1);
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        if (!this.projectTags.includes(tag)) {
          this.projectTags.push(tag);
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        }
      });
    });

    this.overlay.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectedTemplate = card.dataset.template;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelector('[data-option="autoSave"]')?.addEventListener('change', (e) => {
      this.autoSaveEnabled = e.target.checked;
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    });

    this.overlay.querySelector('[data-option="interval"]')?.addEventListener('change', (e) => {
      this.autoSaveInterval = parseInt(e.target.value);
    });

    this.overlay.querySelector('[data-option="preview"]')?.addEventListener('change', (e) => {
      this.includePreview = e.target.checked;
    });

    this.overlay.querySelector('[data-action="save"]')?.addEventListener('click', () => this.saveProject());
    this.overlay.querySelector('[data-action="save-as"]')?.addEventListener('click', () => this.saveAsProject());
  }

  updateFooterState() {
    const saveBtn = this.overlay?.querySelector('[data-action="save"]');
    if (saveBtn) {
      saveBtn.disabled = !this.projectName || this.isSaving;
    }
  }

  saveProject() {
    if (!this.projectName) return;

    this.isSaving = true;
    this.updateBody(this.renderBody());
    this.setupEventListeners();

    setTimeout(() => {
      this.onConfirm({
        action: 'projectSaved',
        projectName: this.projectName,
        tags: this.projectTags,
        location: this.projectLocation,
        autoSave: this.autoSaveEnabled,
        autoSaveInterval: this.autoSaveInterval,
        includePreview: this.includePreview,
        template: this.selectedTemplate
      });
      this.lastSaved = new Date();
      this.isSaving = false;
      this.close();
    }, 800);
  }

  saveAsProject() {
    const modal = new SaveProjectModal({
      ...this.options,
      projectName: this.projectName + ' (Copy)'
    });
    modal.open();
  }
}

export default SaveProjectModal;