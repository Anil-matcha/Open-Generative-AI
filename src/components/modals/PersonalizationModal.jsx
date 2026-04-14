import { BaseModal } from './BaseModal';

const MERGE_FIELDS = [
  { token: '{{first_name}}', label: 'First Name', preview: 'John' },
  { token: '{{last_name}}', label: 'Last Name', preview: 'Smith' },
  { token: '{{email}}', label: 'Email', preview: 'john@example.com' },
  { token: '{{company}}', label: 'Company', preview: 'Acme Corp' },
  { token: '{{job_title}}', label: 'Job Title', preview: 'Manager' },
  { token: '{{phone}}', label: 'Phone', preview: '+1 555-1234' },
  { token: '{{city}}', label: 'City', preview: 'San Francisco' },
  { token: '{{country}}', label: 'Country', preview: 'United States' }
];

const TOKEN_MODES = [
  { id: 'plain', name: 'Plain Text', icon: 'Aa' },
  { id: 'uppercase', name: 'UPPERCASE', icon: 'AB' },
  { id: 'lowercase', name: 'lowercase', icon: 'ab' },
  { id: 'title', name: 'Title Case', icon: 'Ab' }
];

const DYNAMIC_ELEMENTS = [
  { type: 'text', label: 'Dynamic Text', icon: 'T', description: 'Insert personalized text' },
  { type: 'image', label: 'Dynamic Image', icon: '🖼', description: 'Per-recipient images' },
  { type: 'background', label: 'Dynamic Background', icon: '◐', description: 'Per-recipient backgrounds' },
  { type: 'color', label: 'Dynamic Color', icon: '🎨', description: 'Per-recipient colors' }
];

export class PersonalizationModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Video Personalization',
      size: 'large',
      showFooter: false,
      ...options
    });

    this.mergeFields = options.mergeFields || [];
    this.tokenMode = 'plain';
    this.selectedElement = null;
    this.dynamicContent = [];
    this.previewData = {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah@techcorp.com',
      company: 'TechCorp',
      job_title: 'Product Manager',
      phone: '+1 555-9876',
      city: 'Austin',
      country: 'United States'
    };
    this.isPreviewMode = false;
    this.step = 'fields';
  }

  renderBody() {
    return `
      <div class="personalization-container">
        <div class="personalization-header">
          <div class="step-indicators">
            <div class="step-indicator ${this.step === 'fields' ? 'active' : ''} ${this.isStepCompleted('fields') ? 'completed' : ''}">
              <span class="step-num">1</span>
              <span class="step-label">Merge Fields</span>
            </div>
            <div class="step-line ${this.isStepCompleted('fields') ? 'active' : ''}"></div>
            <div class="step-indicator ${this.step === 'content' ? 'active' : ''} ${this.isStepCompleted('content') ? 'completed' : ''}">
              <span class="step-num">2</span>
              <span class="step-label">Dynamic Content</span>
            </div>
            <div class="step-line ${this.isStepCompleted('content') ? 'active' : ''}"></div>
            <div class="step-indicator ${this.step === 'preview' ? 'active' : ''}">
              <span class="step-num">3</span>
              <span class="step-label">Preview</span>
            </div>
          </div>
        </div>

        <div class="personalization-content">
          <div class="step-panel ${this.step === 'fields' ? 'active' : ''}" data-step="fields">
            <div class="fields-section">
              <div class="section-header">
                <h3>Available Merge Fields</h3>
                <p>Click to insert into your video</p>
              </div>
              <div class="merge-fields-grid">
                ${MERGE_FIELDS.map(field => `
                  <button class="merge-field-btn" data-token="${field.token}">
                    <span class="field-token">${field.token}</span>
                    <span class="field-label">${field.label}</span>
                    <span class="field-preview">${field.preview}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="mode-section">
              <h4>Token Format</h4>
              <div class="mode-options">
                ${TOKEN_MODES.map(mode => `
                  <button class="mode-btn ${this.tokenMode === mode.id ? 'active' : ''}" data-mode="${mode.id}">
                    <span class="mode-icon">${mode.icon}</span>
                    <span class="mode-name">${mode.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="active-fields-section">
              <h4>Active Fields (${this.mergeFields.length})</h4>
              ${this.mergeFields.length === 0 ? `
                <div class="empty-fields">
                  <p>No merge fields added yet. Click fields above to add them.</p>
                </div>
              ` : `
                <div class="active-fields-list">
                  ${this.mergeFields.map((token, idx) => `
                    <div class="field-chip">
                      <span class="chip-token">${token}</span>
                      <button class="chip-remove" data-index="${idx}">×</button>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <div class="step-panel" data-step="content" style="display: ${this.step === 'content' ? 'flex' : 'none'}">
            <div class="dynamic-elements">
              <div class="section-header">
                <h3>Dynamic Elements</h3>
                <p>Create per-viewer content variations</p>
              </div>
              <div class="elements-grid">
                ${DYNAMIC_ELEMENTS.map(el => `
                  <button class="element-card" data-type="${el.type}">
                    <span class="element-icon">${el.icon}</span>
                    <span class="element-label">${el.label}</span>
                    <span class="element-desc">${el.description}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="content-mapping">
              <h4>Content Mapping</h4>
              ${this.dynamicContent.length === 0 ? `
                <div class="empty-mapping">
                  <p>Select a dynamic element to configure content mapping</p>
                </div>
              ` : `
                <div class="mapping-list">
                  ${this.dynamicContent.map((item, idx) => `
                    <div class="mapping-row">
                      <span class="mapping-type">${item.type}</span>
                      <span class="mapping-token">${item.token}</span>
                      <span class="mapping-values">${item.values?.length || 0} values</span>
                      <button class="mapping-remove" data-index="${idx}">×</button>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <div class="step-panel" data-step="preview" style="display: ${this.step === 'preview' ? 'block' : 'none'}">
            <div class="preview-section">
              <div class="section-header">
                <h3>Preview Personalization</h3>
                <p>See how your video will look with sample data</p>
              </div>

              <div class="preview-controls">
                <div class="preview-data-form">
                  <h4>Sample Data</h4>
                  ${['first_name', 'last_name', 'company'].map(field => `
                    <div class="form-group">
                      <label>${field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                      <input type="text" class="preview-input" data-field="${field}" value="${this.previewData[field]}" />
                    </div>
                  `).join('')}
                </div>

                <div class="preview-toggle">
                  <label class="toggle-label">
                    <input type="checkbox" class="preview-checkbox" ${this.isPreviewMode ? 'checked' : ''} />
                    <span>Enable preview mode in editor</span>
                  </label>
                </div>
              </div>

              <div class="preview-output">
                <h4>Token Preview</h4>
                <div class="token-preview-grid">
                  ${this.mergeFields.map(token => `
                    <div class="token-preview-item">
                      <span class="token-label">${token}</span>
                      <span class="token-result">${this.resolveToken(token)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="personalization-footer">
          <div class="footer-nav">
            <button class="nav-btn back-btn ${this.step === 'fields' ? 'disabled' : ''}" data-nav="back" ${this.step === 'fields' ? 'disabled' : ''}>
              ← Back
            </button>
            <button class="nav-btn next-btn modal-btn modal-btn-primary" data-nav="next">
              ${this.step === 'preview' ? 'Apply & Finish' : 'Next →'}
            </button>
          </div>
          <div class="footer-info">
            <span class="fields-count">${this.mergeFields.length} merge fields configured</span>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="display: none;">
        <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
      </div>
    `;
  }

  isStepCompleted(step) {
    const steps = ['fields', 'content', 'preview'];
    const currentIdx = steps.indexOf(this.step);
    const stepIdx = steps.indexOf(step);
    return stepIdx < currentIdx;
  }

  resolveToken(token) {
    const field = token.replace(/[{}]/g, '');
    if (this.previewData[field] !== undefined) {
      let value = this.previewData[field];
      if (this.tokenMode === 'uppercase') value = value.toUpperCase();
      else if (this.tokenMode === 'lowercase') value = value.toLowerCase();
      else if (this.tokenMode === 'title') value = value.replace(/\b\w/g, l => l.toUpperCase());
      return value;
    }
    return token;
  }

  setupEventListeners() {
    super.setupEventListeners();

    this.overlay.querySelectorAll('.merge-field-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const token = btn.dataset.token;
        if (!this.mergeFields.includes(token)) {
          this.mergeFields.push(token);
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        }
      });
    });

    this.overlay.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.mergeFields.splice(idx, 1);
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tokenMode = btn.dataset.mode;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.element-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.dynamicContent.push({ type, token: '{{name}}', values: [] });
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.preview-input').forEach(input => {
      input.addEventListener('input', (e) => {
        this.previewData[e.target.dataset.field] = e.target.value;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelector('.nav-btn[data-nav="next"]')?.addEventListener('click', () => {
      const steps = ['fields', 'content', 'preview'];
      const currentIdx = steps.indexOf(this.step);
      if (currentIdx < steps.length - 1) {
        this.step = steps[currentIdx + 1];
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      } else {
        this.finishPersonalization();
      }
    });

    this.overlay.querySelector('.nav-btn[data-nav="back"]')?.addEventListener('click', () => {
      const steps = ['fields', 'content', 'preview'];
      const currentIdx = steps.indexOf(this.step);
      if (currentIdx > 0) {
        this.step = steps[currentIdx - 1];
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      }
    });
  }

  finishPersonalization() {
    this.onConfirm({
      action: 'personalizationConfigured',
      mergeFields: this.mergeFields,
      tokenMode: this.tokenMode,
      dynamicContent: this.dynamicContent,
      previewData: this.previewData,
      enablePreview: this.isPreviewMode
    });
    this.close();
  }
}

export default PersonalizationModal;