/**
 * LandingPageBuilder.jsx
 * Landing page builder modal for video personalization delivery
 * Following Timeline Design System with consistent styling
 */

import { BaseModal } from './BaseModal.jsx';

export class LandingPageBuilder extends BaseModal {
  constructor(options = {}) {
    super({
      title: '🏠 Landing Page Builder',
      size: 'large',
      showFooter: true,
      footerContent: `
        <button class="modal-btn modal-btn-secondary" data-action="cancel">Cancel</button>
        <button class="modal-btn modal-btn-primary" data-action="generate">Generate Pages</button>
      `,
      ...options
    });

    this.selectedTemplate = 'professional';
    this.branding = {
      logo: null,
      primaryColor: '#00D4FF',
      font: 'Inter'
    };
    this.generatedPages = [];
  }

  renderBody() {
    return `
      <div class="landing-page-builder">
        <div class="template-section">
          <h4>Choose Template</h4>
          <div class="template-grid">
            <button class="template-card ${this.selectedTemplate === 'professional' ? 'selected' : ''}" data-template="professional">
              <div class="template-preview professional-preview">
                <div class="preview-header"></div>
                <div class="preview-body">
                  <div class="preview-video"></div>
                  <div class="preview-text"></div>
                </div>
              </div>
              <span class="template-name">Professional</span>
            </button>

            <button class="template-card ${this.selectedTemplate === 'corporate' ? 'selected' : ''}" data-template="corporate">
              <div class="template-preview corporate-preview">
                <div class="preview-header"></div>
                <div class="preview-body">
                  <div class="preview-video"></div>
                  <div class="preview-text"></div>
                </div>
              </div>
              <span class="template-name">Corporate</span>
            </button>

            <button class="template-card ${this.selectedTemplate === 'modern' ? 'selected' : ''}" data-template="modern">
              <div class="template-preview modern-preview">
                <div class="preview-header"></div>
                <div class="preview-body">
                  <div class="preview-video"></div>
                  <div class="preview-text"></div>
                </div>
              </div>
              <span class="template-name">Modern</span>
            </button>

            <button class="template-card ${this.selectedTemplate === 'minimal' ? 'selected' : ''}" data-template="minimal">
              <div class="template-preview minimal-preview">
                <div class="preview-header"></div>
                <div class="preview-body">
                  <div class="preview-video"></div>
                  <div class="preview-text"></div>
                </div>
              </div>
              <span class="template-name">Minimal</span>
            </button>
          </div>
        </div>

        <div class="branding-section">
          <h4>Branding</h4>
          <div class="branding-options">
            <div class="branding-item">
              <label>Logo</label>
              <div class="logo-upload-zone" id="logo-upload-zone">
                ${this.branding.logo ? `
                  <img src="${this.branding.logo}" alt="Logo" class="logo-preview">
                ` : `
                  <span class="upload-icon">📷</span>
                  <span>Click to upload</span>
                `}
              </div>
              <input type="file" id="logo-input" accept="image/*" style="display: none;">
            </div>

            <div class="branding-item">
              <label>Primary Color</label>
              <input type="color" id="color-picker" class="color-picker" value="${this.branding.primaryColor}">
            </div>

            <div class="branding-item">
              <label>Font Family</label>
              <select id="font-select" class="font-select">
                <option value="Inter" ${this.branding.font === 'Inter' ? 'selected' : ''}>Inter</option>
                <option value="Roboto" ${this.branding.font === 'Roboto' ? 'selected' : ''}>Roboto</option>
                <option value="Open Sans" ${this.branding.font === 'Open Sans' ? 'selected' : ''}>Open Sans</option>
                <option value="Montserrat" ${this.branding.font === 'Montserrat' ? 'selected' : ''}>Montserrat</option>
              </select>
            </div>
          </div>
        </div>

        <div class="content-section">
          <h4>Page Content</h4>
          <div class="content-options">
            <div class="content-item">
              <label for="page-title">Page Title</label>
              <input type="text" id="page-title" class="text-input" placeholder="Welcome to {{company}}" value="Personalized Video for You">
            </div>

            <div class="content-item">
              <label for="cta-text">Call to Action Text</label>
              <input type="text" id="cta-text" class="text-input" placeholder="Watch your personalized video" value="Watch Your Video">
            </div>

            <div class="content-item">
              <label>
                <input type="checkbox" id="include-form" checked>
                Include Lead Capture Form
              </label>
            </div>
          </div>
        </div>

        ${this.generatedPages.length > 0 ? `
          <div class="generated-pages-section">
            <h4>Generated Pages (${this.generatedPages.length})</h4>
            <div class="pages-list">
              ${this.generatedPages.map((page, i) => `
                <div class="page-item">
                  <span class="page-number">${i + 1}</span>
                  <span class="page-name">${page.name}</span>
                  <a href="${page.url}" target="_blank" class="page-link">View</a>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Template selection
    this.content.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', (e) => {
        this.selectedTemplate = e.currentTarget.dataset.template;
        this.render();
        this.setupEventListeners();
      });
    });

    // Logo upload
    const logoZone = this.content.querySelector('#logo-upload-zone');
    if (logoZone) {
      logoZone.addEventListener('click', () => {
        this.content.querySelector('#logo-input')?.click();
      });
    }

    const logoInput = this.content.querySelector('#logo-input');
    if (logoInput) {
      logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.branding.logo = e.target.result;
            this.render();
            this.setupEventListeners();
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Color picker
    const colorPicker = this.content.querySelector('#color-picker');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        this.branding.primaryColor = e.target.value;
      });
    }

    // Font select
    const fontSelect = this.content.querySelector('#font-select');
    if (fontSelect) {
      fontSelect.addEventListener('change', (e) => {
        this.branding.font = e.target.value;
      });
    }

    // Footer buttons
    this.content.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      this.close();
    });

    this.content.querySelector('[data-action="generate"]')?.addEventListener('click', () => {
      this.handleGenerate();
    });
  }

  handleGenerate() {
    // Simulate page generation
    const pageCount = 10;
    this.generatedPages = Array.from({ length: pageCount }, (_, i) => ({
      name: `Landing Page ${i + 1}`,
      url: `#page-${i + 1}`
    }));

    this.onComplete?.({
      template: this.selectedTemplate,
      branding: this.branding,
      pages: this.generatedPages.length
    });

    this.render();
    this.setupEventListeners();
  }
}
