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

    this.activeTab = 'template';
    this.selectedTemplate = 'professional';
    this.branding = {
      logo: null,
      primaryColor: '#00D4FF',
      font: 'Inter'
    };
    this.pageContent = {
      title: 'Your Personalized Video Experience',
      subtitle: 'Watch the video created just for you',
      ctaText: 'Watch Now',
      includeForm: true,
      components: ['hero', 'video', 'features', 'testimonial', 'cta']
    };
    this.generatedPages = [];
    this.generatedCode = '';

    // Inject styles for landing page builder
    this.injectStyles();
  }

  injectStyles() {
    if (!document.querySelector('#landing-page-builder-styles')) {
      const style = document.createElement('style');
      style.id = 'landing-page-builder-styles';
      style.textContent = `
        .landing-page-builder {
          min-height: 600px;
        }

        .builder-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          margin-bottom: 24px;
        }

        .tab-btn {
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          color: var(--text);
        }

        .tab-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .builder-content {
          padding: 24px 0;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .template-card {
          padding: 16px;
          border: 2px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .template-card:hover {
          border-color: var(--primary);
          background: var(--panel-soft);
        }

        .template-card.selected {
          border-color: var(--primary);
          background: var(--primary-soft);
        }

        .branding-section {
          margin-bottom: 24px;
        }

        .branding-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 12px;
        }

        .color-picker, .font-picker {
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--panel);
        }

        .content-section {
          margin-bottom: 24px;
        }

        .content-field {
          margin-bottom: 16px;
        }

        .content-field label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text);
        }

        .content-field input,
        .content-field textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--panel);
          color: var(--text);
          font-size: 14px;
        }

        .content-field textarea {
          resize: vertical;
          min-height: 80px;
        }

        .components-section {
          margin-bottom: 24px;
        }

        .component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }

        .component-item {
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--panel);
        }

        .component-item:hover {
          border-color: var(--primary);
          background: var(--primary-soft);
        }

        .component-item.selected {
          border-color: var(--primary);
          background: var(--primary-soft);
        }

        .preview-section {
          margin-bottom: 24px;
        }

        .code-preview {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
          line-height: 1.4;
          max-height: 300px;
          overflow-y: auto;
          white-space: pre-wrap;
          color: var(--text);
        }

        .code-stats {
          margin-top: 12px;
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--muted);
        }

        .builder-actions {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          text-align: center;
        }

        .generate-btn {
          background: linear-gradient(to right, var(--cyan), var(--emerald));
          color: #03131a;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        }

        .generate-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 211, 238, 0.3);
        }

        @media (max-width: 768px) {
          .builder-tabs {
            flex-wrap: wrap;
          }

          .tab-btn {
            flex: 1;
            text-align: center;
          }

          .template-grid {
            grid-template-columns: 1fr;
          }

          .branding-options {
            grid-template-columns: 1fr;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  renderBody() {
    return `
      <div class="landing-page-builder">
        <div class="builder-tabs">
          <button class="tab-btn ${this.activeTab === 'template' ? 'active' : ''}" data-tab="template">🎨 Template</button>
          <button class="tab-btn ${this.activeTab === 'content' ? 'active' : ''}" data-tab="content">📝 Content</button>
          <button class="tab-btn ${this.activeTab === 'components' ? 'active' : ''}" data-tab="components">🧩 Components</button>
          <button class="tab-btn ${this.activeTab === 'code' ? 'active' : ''}" data-tab="code">💻 Code</button>
        </div>

        <div class="tab-content">
          ${this.renderActiveTab()}
        </div>

        <div class="builder-actions">
          <button class="generate-btn" onclick="this.handleGenerate()">
            🚀 Generate Landing Pages
          </button>
        </div>
      </div>
    `;
  }

  renderActiveTab() {
    switch (this.activeTab) {
      case 'template':
        return this.renderTemplateTab();
      case 'content':
        return this.renderContentTab();
      case 'components':
        return this.renderComponentsTab();
      case 'code':
        return this.renderCodeTab();
      default:
        return this.renderTemplateTab();
    }
  }

  renderTemplateTab() {
    return `
      <div class="template-section">
        <h4>Choose Template</h4>
        <div class="template-grid">
          <button class="template-card ${this.selectedTemplate === 'professional' ? 'selected' : ''}" data-template="professional">
            <div class="template-preview professional-preview">
              <div class="preview-header">Header</div>
              <div class="preview-body">
                <div class="preview-video">🎬 Video</div>
                <div class="preview-text">Content</div>
              </div>
            </div>
            <span class="template-name">Professional</span>
            <span class="template-desc">Clean, business-focused design</span>
          </button>

          <button class="template-card ${this.selectedTemplate === 'corporate' ? 'selected' : ''}" data-template="corporate">
            <div class="template-preview corporate-preview">
              <div class="preview-header">Header</div>
              <div class="preview-body">
                <div class="preview-video">🎬 Video</div>
                <div class="preview-text">Content</div>
              </div>
            </div>
            <span class="template-name">Corporate</span>
            <span class="template-desc">Executive, enterprise styling</span>
          </button>

          <button class="template-card ${this.selectedTemplate === 'modern' ? 'selected' : ''}" data-template="modern">
            <div class="template-preview modern-preview">
              <div class="preview-header">Header</div>
              <div class="preview-body">
                <div class="preview-video">🎬 Video</div>
                <div class="preview-text">Content</div>
              </div>
            </div>
            <span class="template-name">Modern</span>
            <span class="template-desc">Contemporary, sleek design</span>
          </button>

          <button class="template-card ${this.selectedTemplate === 'minimal' ? 'selected' : ''}" data-template="minimal">
            <div class="template-preview minimal-preview">
              <div class="preview-header">Header</div>
              <div class="preview-body">
                <div class="preview-video">🎬 Video</div>
                <div class="preview-text">Content</div>
              </div>
            </div>
            <span class="template-name">Minimal</span>
            <span class="template-desc">Simple, distraction-free layout</span>
          </button>
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
      </div>
    `;
  }

  renderContentTab() {
    return `
      <div class="content-section">
        <h4>Page Content</h4>
        <div class="content-options">
          <div class="content-item">
            <label for="page-title">Hero Title</label>
            <input type="text" id="page-title" class="text-input" value="${this.pageContent.title}" placeholder="Your Personalized Video Experience">
            <small>Use {{first_name}}, {{company}}, etc. for personalization</small>
          </div>

          <div class="content-item">
            <label for="page-subtitle">Hero Subtitle</label>
            <input type="text" id="page-subtitle" class="text-input" value="${this.pageContent.subtitle}" placeholder="Watch the video created just for you">
          </div>

          <div class="content-item">
            <label for="cta-text">Call to Action Button</label>
            <input type="text" id="cta-text" class="text-input" value="${this.pageContent.ctaText}" placeholder="Watch Your Video">
          </div>

          <div class="content-item">
            <label for="description">Description Text</label>
            <textarea id="description" class="text-input" rows="3" placeholder="Add a personalized message...">This video was created specifically for you based on your interests and needs.</textarea>
          </div>

          <div class="content-item">
            <label>
              <input type="checkbox" id="include-form" ${this.pageContent.includeForm ? 'checked' : ''}>
              Include Lead Capture Form
            </label>
          </div>

          <div class="content-item">
            <label>
              <input type="checkbox" id="include-social" checked>
              Include Social Sharing Buttons
            </label>
          </div>
        </div>

        <div class="personalization-preview">
          <h4>Preview with Sample Data</h4>
          <div class="preview-card">
            <h2 id="preview-title">${this.pageContent.title.replace(/\{\{([^}]+)\}\}/g, (match, token) => {
              const samples = { first_name: 'John', company: 'Acme Corp', job_title: 'Manager' };
              return samples[token] || match;
            })}</h2>
            <p id="preview-subtitle">${this.pageContent.subtitle}</p>
            <button id="preview-cta">${this.pageContent.ctaText}</button>
          </div>
        </div>
      </div>
    `;
  }

  renderComponentsTab() {
    const components = [
      { id: 'hero', name: 'Hero Section', desc: 'Main title, subtitle, CTA', icon: '🎯', required: true },
      { id: 'video', name: 'Video Player', desc: 'Your personalized video', icon: '🎬', required: true },
      { id: 'features', name: 'Feature List', desc: 'Key benefits or points', icon: '✅', required: false },
      { id: 'testimonial', name: 'Testimonial', desc: 'Social proof section', icon: '💬', required: false },
      { id: 'social-proof', name: 'Social Proof', desc: 'Stats, awards, logos', icon: '🏆', required: false },
      { id: 'faq', name: 'FAQ Section', desc: 'Frequently asked questions', icon: '❓', required: false },
      { id: 'contact', name: 'Contact Info', desc: 'Get in touch details', icon: '📞', required: false },
      { id: 'footer', name: 'Footer', desc: 'Links and legal info', icon: '📄', required: true }
    ];

    return `
      <div class="components-section">
        <h4>Choose Components</h4>
        <p>Drag and drop to reorder. Click to toggle on/off.</p>

        <div class="components-list">
          ${components.map(comp => `
            <div class="component-item ${this.pageContent.components.includes(comp.id) ? 'active' : ''}" data-component="${comp.id}">
              <div class="component-drag">⋮⋮</div>
              <div class="component-info">
                <span class="component-icon">${comp.icon}</span>
                <div class="component-details">
                  <span class="component-name">${comp.name}</span>
                  <span class="component-desc">${comp.desc}</span>
                </div>
              </div>
              <label class="component-toggle">
                <input type="checkbox" ${this.pageContent.components.includes(comp.id) ? 'checked' : ''} ${comp.required ? 'disabled' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          `).join('')}
        </div>

        <div class="component-config">
          <h4>Configure Selected Components</h4>

          ${this.pageContent.components.includes('features') ? `
            <div class="config-section">
              <h5>Features List</h5>
              <div id="features-list">
                <div class="feature-item">
                  <input type="text" placeholder="Feature title" value="Personalized Content">
                  <input type="text" placeholder="Feature description" value="Content tailored to your needs">
                </div>
                <button class="mini-btn" onclick="this.addFeature()">+ Add Feature</button>
              </div>
            </div>
          ` : ''}

          ${this.pageContent.components.includes('testimonial') ? `
            <div class="config-section">
              <h5>Testimonial</h5>
              <textarea placeholder="Add a testimonial..." rows="3">"This personalized approach completely changed how we connect with our audience."</textarea>
              <input type="text" placeholder="Author name" value="Sarah Johnson">
              <input type="text" placeholder="Author title" value="Marketing Director">
            </div>
          ` : ''}

          ${this.pageContent.components.includes('social-proof') ? `
            <div class="config-section">
              <h5>Social Proof Stats</h5>
              <div class="stats-grid">
                <div class="stat-item">
                  <input type="text" placeholder="Number" value="10,000+">
                  <input type="text" placeholder="Label" value="Happy Customers">
                </div>
                <div class="stat-item">
                  <input type="text" placeholder="Number" value="500+">
                  <input type="text" placeholder="Label" value="Videos Created">
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderCodeTab() {
    const generatedCode = this.generateLandingPageCode();

    return `
      <div class="code-section">
        <h4>Generated Landing Page Code</h4>
        <p>This is the complete HTML/CSS/JS code for your landing page. Copy and deploy anywhere.</p>

        <div class="code-controls">
          <button class="mini-btn" onclick="navigator.clipboard.writeText(this.generatedCode)">📋 Copy Code</button>
          <button class="mini-btn" onclick="this.downloadCode()">💾 Download HTML</button>
          <button class="mini-btn" onclick="this.previewCode()">👁️ Preview</button>
        </div>

        <div class="code-preview">
          <pre><code>${generatedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </div>

        <div class="code-stats">
          <span>📏 ${generatedCode.length} characters</span>
          <span>🧩 ${this.pageContent.components.length} components</span>
          <span>🎨 ${this.selectedTemplate} template</span>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Tab switching
    this.content.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeTab = e.currentTarget.dataset.tab;
        this.render();
        this.setupEventListeners();
      });
    });

    // Template selection
    this.content.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', (e) => {
        this.selectedTemplate = e.currentTarget.dataset.template;
        this.render();
        this.setupEventListeners();
      });
    });

    // Component toggles
    this.content.querySelectorAll('.component-toggle input').forEach(input => {
      input.addEventListener('change', (e) => {
        const componentId = e.target.closest('.component-item').dataset.component;
        if (e.target.checked) {
          if (!this.pageContent.components.includes(componentId)) {
            this.pageContent.components.push(componentId);
          }
        } else {
          this.pageContent.components = this.pageContent.components.filter(c => c !== componentId);
        }
        this.render();
        this.setupEventListeners();
      });
    });

    // Content inputs
    const contentInputs = ['page-title', 'page-subtitle', 'cta-text', 'description'];
    contentInputs.forEach(id => {
      const input = this.content.querySelector(`#${id}`);
      if (input) {
        input.addEventListener('input', (e) => {
          const field = id.replace('page-', '').replace('-', '_');
          this.pageContent[field] = e.target.value;
          this.updatePreview();
        });
      }
    });

    // Include form checkbox
    const includeForm = this.content.querySelector('#include-form');
    if (includeForm) {
      includeForm.addEventListener('change', (e) => {
        this.pageContent.includeForm = e.target.checked;
      });
    }

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

    this.content.querySelector('.generate-btn')?.addEventListener('click', () => {
      this.handleGenerate();
    });
  }

  updatePreview() {
    // Update the preview with current content
    const previewTitle = this.content.querySelector('#preview-title');
    const previewSubtitle = this.content.querySelector('#preview-subtitle');
    const previewCta = this.content.querySelector('#preview-cta');

    if (previewTitle) {
      previewTitle.textContent = this.pageContent.title.replace(/\{\{([^}]+)\}\}/g, (match, token) => {
        const samples = { first_name: 'John', company: 'Acme Corp', job_title: 'Manager' };
        return samples[token] || match;
      });
    }

    if (previewSubtitle) {
      previewSubtitle.textContent = this.pageContent.subtitle;
    }

    if (previewCta) {
      previewCta.textContent = this.pageContent.ctaText;
    }
  }

  generateLandingPageCode() {
    const templateStyles = {
      professional: `
        body { font-family: 'Inter', sans-serif; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .cta-btn { background: #4f46e5; border: none; padding: 12px 24px; border-radius: 8px; color: white; font-weight: 600; }
      `,
      corporate: `
        body { font-family: 'Georgia', serif; }
        .hero { background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); color: white; }
        .cta-btn { background: #2d3748; border: 2px solid #e2e8f0; padding: 12px 24px; border-radius: 0; color: white; font-weight: 600; }
      `,
      modern: `
        body { font-family: 'Poppins', sans-serif; }
        .hero { background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%); color: white; }
        .cta-btn { background: transparent; border: 2px solid white; padding: 12px 24px; border-radius: 25px; color: white; font-weight: 600; }
      `,
      minimal: `
        body { font-family: 'Helvetica', sans-serif; color: #333; }
        .hero { background: #f8f9fa; color: #333; }
        .cta-btn { background: #333; border: none; padding: 12px 24px; border-radius: 0; color: white; font-weight: 600; }
      `
    };

    const componentsHtml = {
      hero: `
        <section class="hero">
          <div class="container">
            <h1>${this.pageContent.title}</h1>
            <p>${this.pageContent.subtitle}</p>
            <button class="cta-btn">${this.pageContent.ctaText}</button>
          </div>
        </section>
      `,
      video: `
        <section class="video-section">
          <div class="container">
            <h2>Your Personalized Video</h2>
            <div class="video-wrapper">
              <video controls poster="VIDEO_POSTER_URL">
                <source src="PERSONALIZED_VIDEO_URL" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>
      `,
      features: `
        <section class="features">
          <div class="container">
            <h2>Why Choose Us</h2>
            <div class="features-grid">
              <div class="feature">
                <h3>Personalized</h3>
                <p>Content tailored specifically for you</p>
              </div>
              <div class="feature">
                <h3>Professional</h3>
                <p>High-quality production standards</p>
              </div>
              <div class="feature">
                <h3>Engaging</h3>
                <p>Captivating content that drives results</p>
              </div>
            </div>
          </div>
        </section>
      `,
      testimonial: `
        <section class="testimonial">
          <div class="container">
            <blockquote>
              "This personalized approach completely changed how we connect with our audience."
            </blockquote>
            <cite>- Sarah Johnson, Marketing Director</cite>
          </div>
        </section>
      `,
      social_proof: `
        <section class="social-proof">
          <div class="container">
            <div class="stats">
              <div class="stat"><span class="number">10,000+</span><span class="label">Happy Customers</span></div>
              <div class="stat"><span class="number">500+</span><span class="label">Videos Created</span></div>
              <div class="stat"><span class="number">98%</span><span class="label">Satisfaction Rate</span></div>
            </div>
          </div>
        </section>
      `,
      contact: `
        <section class="contact">
          <div class="container">
            <h2>Get In Touch</h2>
            <p>Ready to create your personalized video experience?</p>
            <a href="mailto:contact@yourcompany.com" class="cta-btn">Contact Us</a>
          </div>
        </section>
      `,
      footer: `
        <footer>
          <div class="container">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
          </div>
        </footer>
      `
    };

    const selectedComponents = this.pageContent.components
      .map(comp => componentsHtml[comp])
      .filter(Boolean)
      .join('\n');

    const logoHtml = this.branding.logo ?
      `<img src="${this.branding.logo}" alt="Logo" class="logo">` :
      '<h1 class="brand-name">Your Company</h1>';

    const formHtml = this.pageContent.includeForm ? `
      <section class="lead-form">
        <div class="container">
          <h2>Stay Connected</h2>
          <form id="leadForm">
            <input type="email" placeholder="Your email address" required>
            <input type="text" placeholder="Your name">
            <button type="submit" class="cta-btn">Subscribe</button>
          </form>
        </div>
      </section>
    ` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.pageContent.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=${this.branding.font.replace(' ', '+')}:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: '${this.branding.font}', sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .hero { padding: 100px 0; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.25rem; margin-bottom: 2rem; }
        .cta-btn {
            display: inline-block;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
            cursor: pointer;
            border: none;
        }
        .cta-btn:hover { transform: translateY(-2px); }
        .video-section { padding: 60px 0; background: #f8f9fa; }
        .video-wrapper { max-width: 800px; margin: 0 auto; }
        video { width: 100%; border-radius: 8px; }
        .features { padding: 60px 0; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
        .feature { text-align: center; }
        .feature h3 { margin-bottom: 1rem; color: ${this.branding.primaryColor}; }
        .testimonial { padding: 60px 0; background: #f8f9fa; text-align: center; }
        blockquote { font-size: 1.5rem; font-style: italic; margin-bottom: 1rem; }
        cite { color: #666; }
        .social-proof { padding: 60px 0; }
        .stats { display: flex; justify-content: space-around; flex-wrap: wrap; }
        .stat { text-align: center; }
        .stat .number { font-size: 2rem; font-weight: bold; color: ${this.branding.primaryColor}; display: block; }
        .contact { padding: 60px 0; background: ${this.branding.primaryColor}; color: white; text-align: center; }
        footer { padding: 20px 0; background: #333; color: white; text-align: center; }
        .lead-form { padding: 60px 0; background: #f8f9fa; }
        #leadForm { max-width: 400px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
        #leadForm input { padding: 12px; border: 1px solid #ddd; border-radius: 4px; }
        @media (max-width: 768px) {
            .hero h1 { font-size: 2rem; }
            .stats { flex-direction: column; gap: 2rem; }
        }

        ${templateStyles[this.selectedTemplate] || ''}
    </style>
</head>
<body>
    <header>
        <nav class="container" style="padding: 20px 0; display: flex; justify-content: space-between; align-items: center;">
            ${logoHtml}
            <div>
                <a href="#contact" style="margin-left: 20px; color: ${this.branding.primaryColor};">Contact</a>
            </div>
        </nav>
    </header>

    ${selectedComponents}

    ${formHtml}

    <script>
        // Personalization token replacement
        function personalizeContent() {
            const urlParams = new URLSearchParams(window.location.search);
            const tokens = {
                first_name: urlParams.get('first_name') || 'there',
                last_name: urlParams.get('last_name') || '',
                company: urlParams.get('company') || 'your company',
                email: urlParams.get('email') || '',
                job_title: urlParams.get('job_title') || 'professional',
                city: urlParams.get('city') || 'your city',
                country: urlParams.get('country') || 'your country'
            };

            // Replace all {{token}} patterns in text content
            document.querySelectorAll('*').forEach(element => {
                if (element.children.length === 0) { // Only text nodes
                    element.innerHTML = element.innerHTML.replace(/\\{\\{([^}]+)\\}\\}/g, (match, token) => {
                        return tokens[token] || match;
                    });
                }
            });
        }

        // Form submission
        document.getElementById('leadForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);

            try {
                const response = await fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    
                    e.target.reset();
                } else {
                    
                }
            } catch (error) {
                console.error('Form submission error:', error);
                
            }
        });

        // Initialize personalization
        document.addEventListener('DOMContentLoaded', personalizeContent);
    </script>
</body>
</html>`;
  }

  handleGenerate() {
    // Generate the actual HTML code
    this.generatedCode = this.generateLandingPageCode();

    // Simulate page generation for multiple contacts
    const pageCount = 10; // This would come from personalization data
    this.generatedPages = Array.from({ length: pageCount }, (_, i) => ({
      name: `Landing Page ${i + 1}`,
      url: `data:text/html;charset=utf-8,${encodeURIComponent(this.generatedCode)}`,
      code: this.generatedCode
    }));

    this.onComplete?.({
      template: this.selectedTemplate,
      branding: this.branding,
      content: this.pageContent,
      components: this.pageContent.components,
      pages: this.generatedPages,
      code: this.generatedCode
    });

    // Switch to code tab to show results
    this.activeTab = 'code';
    this.render();
    this.setupEventListeners();
  }
}
