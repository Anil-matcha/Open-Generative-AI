/**
 * VideoPersonalizationHub.jsx
 * Main orchestration hub for video personalization workflow
 * Following Timeline Design System with consistent styling
 */

import { BaseModal } from './BaseModal.jsx';

export class VideoPersonalizationHub extends BaseModal {
  constructor(options = {}) {
    super({
      title: '🎬 Personalization Suite',
      size: 'full',
      showFooter: false,
      ...options
    });

    this.activeTab = 'upload';
    this.contacts = [];
    this.videos = [];
    this.templates = [];
    this.generations = [];
    this.analytics = {};

    // Check for pre-loaded video from timeline editor
    if (options.preloadedVideo) {
      this.videos = [options.preloadedVideo];
      this.activeTab = 'contacts'; // Skip upload, go to contacts
    }

    this.workflowSteps = [
      { id: 'upload', label: 'Upload Video', icon: '📤', description: 'Upload your base video' },
      { id: 'contacts', label: 'Import Contacts', icon: '👥', description: 'Add your contact list' },
      { id: 'personalize', label: 'Configure Tokens', icon: '🏷️', description: 'Set up personalization' },
      { id: 'generate', label: 'Generate Videos', icon: '⚡', description: 'Create personalized videos' },
      { id: 'deliver', label: 'Create Landing Pages', icon: '🏠', description: 'Build delivery pages' },
      { id: 'analytics', label: 'View Analytics', icon: '📊', description: 'Track performance' }
    ];
  }

  renderBody() {
    return `
      <div class="personalization-hub">
        <div class="hub-header">
          <div class="hub-tabs">
            ${this.workflowSteps.map(step => `
              <button class="hub-tab ${this.activeTab === step.id ? 'active' : ''}" data-tab="${step.id}">
                <span class="tab-icon">${step.icon}</span>
                <span class="tab-label">${step.label}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="hub-content">
          ${this.renderTabContent()}
        </div>

        <div class="hub-footer">
          <div class="workflow-progress">
            <div class="progress-track">
              ${this.workflowSteps.map((step, i) => `
                <div class="progress-step ${this.getStepStatus(step.id)}" data-step="${step.id}">
                  <div class="step-dot">${i + 1}</div>
                  <div class="step-label">${step.label}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderTabContent() {
    switch (this.activeTab) {
      case 'upload':
        return this.renderUploadTab();
      case 'contacts':
        return this.renderContactsTab();
      case 'personalize':
        return this.renderPersonalizeTab();
      case 'generate':
        return this.renderGenerateTab();
      case 'deliver':
        return this.renderDeliverTab();
      case 'analytics':
        return this.renderAnalyticsTab();
      default:
        return this.renderUploadTab();
    }
  }

  renderUploadTab() {
    return `
      <div class="tab-content upload-tab">
        <div class="upload-zone" id="video-upload-zone">
          <div class="upload-icon">📤</div>
          <h3>Upload Your Base Video</h3>
          <p>Drag and drop or click to browse</p>
          <input type="file" id="video-input" accept="video/*" style="display: none;">
          <button class="upload-btn">Select Video</button>
        </div>

        <div class="uploaded-videos">
          <h4>Uploaded Videos</h4>
          <div class="video-list">
            ${this.videos.length > 0 ? this.videos.map(video => `
              <div class="video-item">
                <div class="video-thumbnail"></div>
                <div class="video-info">
                  <div class="video-name">${video.name}</div>
                  <div class="video-meta">${video.duration} • ${video.size}</div>
                </div>
                <button class="remove-btn" data-id="${video.id}">✕</button>
              </div>
            `).join('') : '<p class="empty-state">No videos uploaded yet</p>'}
          </div>
        </div>
      </div>
    `;
  }

  renderContactsTab() {
    return `
      <div class="tab-content contacts-tab">
        <div class="import-section">
          <h4>Import Contacts</h4>
          <div class="import-options">
            <button class="import-btn">
              <span>📁</span> Import CSV
            </button>
            <button class="import-btn">
              <span>🔗</span> Connect CRM
            </button>
            <button class="import-btn">
              <span>✏️</span> Manual Entry
            </button>
          </div>
        </div>

        <div class="contacts-list-section">
          <div class="contacts-header">
            <h4>Your Contacts (${this.contacts.length})</h4>
            <div class="contacts-actions">
              <input type="search" class="search-input" placeholder="Search contacts...">
              <button class="export-btn">Export</button>
            </div>
          </div>

          <div class="contacts-list">
            ${this.contacts.length > 0 ? this.contacts.map(contact => `
              <div class="contact-item" data-id="${contact.id}">
                <div class="contact-avatar">${contact.name?.charAt(0) || '?'}</div>
                <div class="contact-info">
                  <div class="contact-name">${contact.name || 'Unnamed'}</div>
                  <div class="contact-email">${contact.email || 'No email'}</div>
                  <div class="contact-fields">${Object.keys(contact.data || {}).length} fields</div>
                </div>
                <button class="edit-btn">Edit</button>
              </div>
            `).join('') : `
              <div class="empty-contacts">
                <p>No contacts imported yet</p>
                <small>Import a CSV or add contacts manually to get started</small>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  renderPersonalizeTab() {
    return `
      <div class="tab-content personalize-tab">
        <div class="token-configuration">
          <h4>Personalization Tokens</h4>
          <p class="token-description">Configure how your video content adapts to each viewer</p>

          <div class="token-grid">
            ${['first_name', 'last_name', 'company', 'email', 'job_title', 'city', 'country'].map(token => `
              <div class="token-item">
                <div class="token-preview" style="background: var(--panel-soft);">
                  <span class="token-icon">🏷️</span>
                  <span class="token-name">{{${token}}}</span>
                </div>
                <input type="text" class="token-input" placeholder="Sample value" data-token="${token}">
              </div>
            `).join('')}
          </div>

          <div class="preview-section">
            <h4>Preview</h4>
            <div class="preview-card">
              <div class="preview-text">
                Hello <strong>{{first_name}}</strong> from <strong>{{company}}</strong>!
                <br><br>
                We're excited to invite you to join us at our upcoming event in <strong>{{city}}</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderGenerateTab() {
    return `
      <div class="tab-content generate-tab">
        <div class="generation-setup">
          <h4>Batch Video Generation</h4>

          <div class="generation-options">
            <div class="option-group">
              <label>Video Template</label>
              <select id="template-select" class="select-input">
                <option value="">Select a template...</option>
                <option value="welcome">Welcome Video</option>
                <option value="product">Product Showcase</option>
                <option value="followup">Follow-up Message</option>
                <option value="custom">Custom Template</option>
              </select>
            </div>

            <div class="option-group">
              <label>Quality</label>
              <select id="quality-select" class="select-input">
                <option value="standard">Standard (720p)</option>
                <option value="high">High (1080p)</option>
                <option value="ultra">Ultra (4K)</option>
              </select>
            </div>

            <div class="option-group">
              <label>Concurrent Jobs</label>
              <input type="range" id="concurrent-slider" min="1" max="5" value="3">
              <span class="range-value">3 simultaneous</span>
            </div>
          </div>

          <div class="generation-summary">
            <div class="summary-item">
              <span class="summary-icon">👥</span>
              <span class="summary-value">${this.contacts.length}</span>
              <span class="summary-label">Contacts</span>
            </div>
            <div class="summary-item">
              <span class="summary-icon">🎬</span>
              <span class="summary-value">1</span>
              <span class="summary-label">Video Template</span>
            </div>
            <div class="summary-item">
              <span class="summary-icon">⏱️</span>
              <span class="summary-value">~${Math.ceil(this.contacts.length * 0.5)}min</span>
              <span class="summary-label">Est. Time</span>
            </div>
          </div>

          <button class="generate-btn" ${this.contacts.length === 0 ? 'disabled' : ''}>
            ⚡ Generate ${this.contacts.length} Videos
          </button>
        </div>

        <div class="generation-progress" style="display: none;">
          <div class="progress-bar-large">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-stats">
            <span class="completed-count">0</span> / <span class="total-count">${this.contacts.length}</span> completed
          </div>
        </div>
      </div>
    `;
  }

  renderDeliverTab() {
    return `
      <div class="tab-content deliver-tab">
        <div class="landing-page-builder">
          <h4>Landing Page Builder</h4>
          <p>Create personalized landing pages for each contact</p>

          <div class="template-selector">
            <div class="template-card selected">
              <div class="template-preview professional"></div>
              <span class="template-name">Professional</span>
            </div>
            <div class="template-card">
              <div class="template-preview corporate"></div>
              <span class="template-name">Corporate</span>
            </div>
            <div class="template-card">
              <div class="template-preview modern"></div>
              <span class="template-name">Modern</span>
            </div>
            <div class="template-card">
              <div class="template-preview minimal"></div>
              <span class="template-name">Minimal</span>
            </div>
          </div>

          <button class="create-pages-btn" ${this.generations.length === 0 ? 'disabled' : ''}>
            🏠 Generate Landing Pages
          </button>
        </div>
      </div>
    `;
  }

  renderAnalyticsTab() {
    return `
      <div class="tab-content analytics-tab">
        <div class="analytics-dashboard">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon">👁️</div>
              <div class="metric-value">${this.analytics.views || 0}</div>
              <div class="metric-label">Total Views</div>
              <div class="metric-change positive">+12.5%</div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">❤️</div>
              <div class="metric-value">${this.analytics.engagement || 0}%</div>
              <div class="metric-label">Engagement</div>
              <div class="metric-change positive">+8.3%</div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">📊</div>
              <div class="metric-value">${this.analytics.retention || 0}%</div>
              <div class="metric-label">Retention</div>
              <div class="metric-change negative">-2.1%</div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">🔗</div>
              <div class="metric-value">${this.analytics.shares || 0}</div>
              <div class="metric-label">Shares</div>
              <div class="metric-change positive">+15.7%</div>
            </div>
          </div>

          <div class="chart-section">
            <h4>Performance Over Time</h4>
            <div class="chart-placeholder">
              <div class="chart-bars">
                ${[40, 65, 45, 80, 55, 90, 70].map((h, i) => `
                  <div class="chart-bar" style="height: ${h}%"></div>
                `).join('')}
              </div>
              <div class="chart-labels">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>
          </div>

          <div class="insights-section">
            <h4>AI Insights</h4>
            <div class="insight-card">
              <span class="insight-icon">💡</span>
              <div class="insight-text">
                <strong>Best time to post:</strong> Tuesday and Thursday between 2-4 PM
              </div>
            </div>
            <div class="insight-card">
              <span class="insight-icon">📈</span>
              <div class="insight-text">
                <strong>Audience retention:</strong> Peak at 0:15-0:30 mark
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getStepStatus(stepId) {
    const currentIndex = this.workflowSteps.findIndex(s => s.id === this.activeTab);
    const stepIndex = this.workflowSteps.findIndex(s => s.id === stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Tab switching
    this.content.querySelectorAll('.hub-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.activeTab = e.currentTarget.dataset.tab;
        this.render();
        this.setupEventListeners();
      });
    });

    // Upload zone
    const uploadZone = this.content.querySelector('#video-upload-zone');
    if (uploadZone) {
      uploadZone.addEventListener('click', () => {
        this.content.querySelector('#video-input')?.click();
      });
    }

    // Video input change
    const videoInput = this.content.querySelector('#video-input');
    if (videoInput) {
      videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.videos.push({
            id: Date.now(),
            name: file.name,
            duration: '0:00',
            size: this.formatFileSize(file.size)
          });
          this.render();
          this.setupEventListeners();
        }
      });
    }

    // Import buttons
    this.content.querySelectorAll('.import-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        alert('Import functionality - connects to ContactImporterModal');
      });
    });

    // Generate button
    const generateBtn = this.content.querySelector('.generate-btn');
    if (generateBtn && !generateBtn.disabled) {
      generateBtn.addEventListener('click', () => {
        this.handleGenerate();
      });
    }

    // Create pages button
    const createPagesBtn = this.content.querySelector('.create-pages-btn');
    if (createPagesBtn && !createPagesBtn.disabled) {
      createPagesBtn.addEventListener('click', () => {
        alert('Landing page generation - connects to LandingPageBuilder');
      });
    }
  }

  handleGenerate() {
    if (this.contacts.length === 0) {
      alert('Please import contacts first');
      return;
    }

    const progressSection = this.content.querySelector('.generation-progress');
    if (progressSection) {
      progressSection.style.display = 'block';
    }

    let progress = 0;
    const total = this.contacts.length;
    const progressFill = this.content.querySelector('.progress-fill');
    const completedCount = this.content.querySelector('.completed-count');

    const interval = setInterval(() => {
      progress += Math.random() * 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        this.generations = this.contacts.map(c => ({ ...c, generated: true }));
        this.onComplete?.({ count: total, generations: this.generations });
      }

      if (progressFill) progressFill.style.width = `${progress}%`;
      if (completedCount) completedCount.textContent = Math.round((progress / 100) * total);
    }, 200);
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
