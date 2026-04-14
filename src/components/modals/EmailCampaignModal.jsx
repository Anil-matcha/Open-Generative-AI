import { BaseModal } from './BaseModal';

const EMAIL_TEMPLATES = [
  { id: 'welcome', name: 'Welcome Series', description: '3-email onboarding sequence', emails: 3 },
  { id: 'newsletter', name: 'Monthly Newsletter', description: 'Regular updates to your audience', emails: 1 },
  { id: 'promo', name: 'Promotional', description: 'Special offers and announcements', emails: 1 },
  { id: 'followup', name: 'Follow-up Series', description: 'Nurture leads over time', emails: 5 },
  { id: 'reengagement', name: 'Re-engagement', description: 'Win back inactive subscribers', emails: 2 }
];

const SCHEDULE_OPTIONS = [
  { id: 'immediate', name: 'Send Immediately' },
  { id: 'scheduled', name: 'Schedule for Later' },
  { id: 'automated', name: 'Automated Triggers' }
];

const SEGMENTS = [
  { id: 'all', name: 'All Subscribers', count: 15420 },
  { id: 'active', name: 'Active Users (90 days)', count: 12450 },
  { id: 'engaged', name: 'Highly Engaged', count: 8230 },
  { id: 'new', name: 'New Subscribers', count: 1520 },
  { id: 'inactive', name: 'Inactive (90+ days)', count: 2970 }
];

export class EmailCampaignModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Email Campaign',
      size: 'large',
      showFooter: false,
      ...options
    });

    this.step = 1;
    this.campaignName = '';
    this.selectedTemplate = null;
    this.selectedSegment = 'all';
    this.scheduleType = 'immediate';
    this.scheduledDate = '';
    this.scheduledTime = '';
    this.subject = '';
    this.previewText = '';
    this.isSending = false;
    this.sendProgress = 0;
  }

  renderBody() {
    return `
      <div class="campaign-container">
        <div class="campaign-progress">
          <div class="progress-step ${this.step >= 1 ? 'active' : ''} ${this.step > 1 ? 'completed' : ''}">
            <span class="step-number">1</span>
            <span class="step-label">Setup</span>
          </div>
          <div class="progress-line ${this.step > 1 ? 'active' : ''}"></div>
          <div class="progress-step ${this.step >= 2 ? 'active' : ''} ${this.step > 2 ? 'completed' : ''}">
            <span class="step-number">2</span>
            <span class="step-label">Template</span>
          </div>
          <div class="progress-line ${this.step > 2 ? 'active' : ''}"></div>
          <div class="progress-step ${this.step >= 3 ? 'active' : ''} ${this.step > 3 ? 'completed' : ''}">
            <span class="step-number">3</span>
            <span class="step-label">Recipients</span>
          </div>
          <div class="progress-line ${this.step > 3 ? 'active' : ''}"></div>
          <div class="progress-step ${this.step >= 4 ? 'active' : ''}">
            <span class="step-number">4</span>
            <span class="step-label">Review</span>
          </div>
        </div>

        <div class="campaign-content">
          ${this.step === 1 ? this.renderSetupStep() : ''}
          ${this.step === 2 ? this.renderTemplateStep() : ''}
          ${this.step === 3 ? this.renderRecipientsStep() : ''}
          ${this.step === 4 ? this.renderReviewStep() : ''}
          ${this.step === 5 ? this.renderSendingStep() : ''}
        </div>
      </div>
    `;
  }

  renderSetupStep() {
    return `
      <div class="setup-step">
        <h3 class="step-title">Campaign Setup</h3>
        <p class="step-description">Enter the basic details for your email campaign</p>

        <div class="form-section">
          <div class="form-group">
            <label>Campaign Name</label>
            <input type="text" class="form-input" placeholder="e.g., Summer Sale Announcement" value="${this.campaignName}" />
            <span class="form-hint">Internal name for your reference</span>
          </div>

          <div class="form-group">
            <label>Subject Line</label>
            <input type="text" class="form-input" placeholder="e.g., Don't miss our biggest sale of the year!" value="${this.subject}" />
            <span class="form-hint">This appears in recipients' inboxes</span>
          </div>

          <div class="form-group">
            <label>Preview Text</label>
            <input type="text" class="form-input" placeholder="e.g., Get up to 50% off this weekend only" value="${this.previewText}" />
            <span class="form-hint">Short text shown after the subject</span>
          </div>

          <div class="form-group">
            <label>From Name</label>
            <input type="text" class="form-input" placeholder="Your Brand" value="Your Brand" />
          </div>

          <div class="form-group">
            <label>Reply-To Email</label>
            <input type="email" class="form-input" placeholder="support@yourbrand.com" value="support@yourbrand.com" />
          </div>
        </div>

        <div class="step-actions">
          <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
          <button class="modal-btn modal-btn-primary next-btn" ${!this.campaignName || !this.subject ? 'disabled' : ''}>Continue</button>
        </div>
      </div>
    `;
  }

  renderTemplateStep() {
    return `
      <div class="template-step">
        <h3 class="step-title">Choose Template</h3>
        <p class="step-description">Select an email template to start with</p>

        <div class="template-grid">
          ${EMAIL_TEMPLATES.map(template => `
            <div class="template-card ${this.selectedTemplate === template.id ? 'selected' : ''}" data-template="${template.id}">
              <div class="template-preview">
                <div class="preview-mockup">
                  <div class="mockup-header"></div>
                  <div class="mockup-content">
                    <div class="mockup-line long"></div>
                    <div class="mockup-line medium"></div>
                    <div class="mockup-line short"></div>
                  </div>
                </div>
              </div>
              <div class="template-info">
                <h4>${template.name}</h4>
                <p>${template.description}</p>
                <span class="email-count">${template.emails} email${template.emails > 1 ? 's' : ''}</span>
              </div>
              ${this.selectedTemplate === template.id ? '<div class="selected-check"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>' : ''}
            </div>
          `).join('')}
        </div>

        <div class="step-actions">
          <button class="modal-btn modal-btn-secondary back-btn">Back</button>
          <button class="modal-btn modal-btn-primary next-btn" ${!this.selectedTemplate ? 'disabled' : ''}>Continue</button>
        </div>
      </div>
    `;
  }

  renderRecipientsStep() {
    return `
      <div class="recipients-step">
        <h3 class="step-title">Select Recipients</h3>
        <p class="step-description">Choose which subscribers will receive this campaign</p>

        <div class="schedule-section">
          <h4>When to Send</h4>
          <div class="schedule-options">
            ${SCHEDULE_OPTIONS.map(option => `
              <button class="schedule-option ${this.scheduleType === option.id ? 'selected' : ''}" data-schedule="${option.id}">
                ${option.id === 'immediate' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>' : ''}
                ${option.id === 'scheduled' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' : ''}
                ${option.id === 'automated' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>' : ''}
                ${option.name}
              </button>
            `).join('')}
          </div>

          ${this.scheduleType === 'scheduled' ? `
            <div class="schedule-datetime">
              <div class="form-group">
                <label>Date</label>
                <input type="date" class="form-input" value="${this.scheduledDate || '2026-04-20'}" />
              </div>
              <div class="form-group">
                <label>Time</label>
                <input type="time" class="form-input" value="${this.scheduledTime || '09:00'}" />
              </div>
            </div>
          ` : ''}
        </div>

        <div class="segments-section">
          <h4>Select Segment</h4>
          <div class="segment-list">
            ${SEGMENTS.map(segment => `
              <label class="segment-option ${this.selectedSegment === segment.id ? 'selected' : ''}">
                <input type="radio" name="segment" value="${segment.id}" ${this.selectedSegment === segment.id ? 'checked' : ''} />
                <div class="segment-info">
                  <span class="segment-name">${segment.name}</span>
                  <span class="segment-count">${segment.count.toLocaleString()} subscribers</span>
                </div>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="step-actions">
          <button class="modal-btn modal-btn-secondary back-btn">Back</button>
          <button class="modal-btn modal-btn-primary next-btn">Review Campaign</button>
        </div>
      </div>
    `;
  }

  renderReviewStep() {
    const template = EMAIL_TEMPLATES.find(t => t.id === this.selectedTemplate);
    const segment = SEGMENTS.find(s => s.id === this.selectedSegment);

    return `
      <div class="review-step">
        <h3 class="step-title">Review Your Campaign</h3>
        <p class="step-description">Make sure everything looks good before sending</p>

        <div class="review-cards">
          <div class="review-card">
            <h4>Campaign Details</h4>
            <div class="review-row">
              <span class="review-label">Name</span>
              <span class="review-value">${this.campaignName}</span>
            </div>
            <div class="review-row">
              <span class="review-label">Subject</span>
              <span class="review-value">${this.subject}</span>
            </div>
            <div class="review-row">
              <span class="review-label">From</span>
              <span class="review-value">Your Brand &lt;support@yourbrand.com&gt;</span>
            </div>
          </div>

          <div class="review-card">
            <h4>Content</h4>
            <div class="review-row">
              <span class="review-label">Template</span>
              <span class="review-value">${template?.name || 'None'}</span>
            </div>
            <div class="review-row">
              <span class="review-label">Preview</span>
              <span class="review-value preview-text">${this.previewText || 'No preview text'}</span>
            </div>
          </div>

          <div class="review-card">
            <h4>Delivery</h4>
            <div class="review-row">
              <span class="review-label">Recipients</span>
              <span class="review-value">${segment?.name || 'All Subscribers'} (${segment?.count?.toLocaleString() || 0})</span>
            </div>
            <div class="review-row">
              <span class="review-label">Schedule</span>
              <span class="review-value">${this.scheduleType === 'immediate' ? 'Send Immediately' : this.scheduleType === 'scheduled' ? `Scheduled for ${this.scheduledDate} at ${this.scheduledTime}` : 'Automated Triggers'}</span>
            </div>
          </div>
        </div>

        <div class="send-estimate">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
          <span>Estimated reach: <strong>${segment?.count?.toLocaleString() || 0} subscribers</strong></span>
        </div>

        <div class="step-actions">
          <button class="modal-btn modal-btn-secondary back-btn">Back</button>
          <button class="modal-btn modal-btn-primary send-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            ${this.scheduleType === 'immediate' ? 'Send Now' : 'Schedule Campaign'}
          </button>
        </div>
      </div>
    `;
  }

  renderSendingStep() {
    return `
      <div class="sending-step">
        <div class="sending-animation">
          <div class="envelope-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </div>
          <div class="send-progress-bar">
            <div class="progress-fill" style="width: ${this.sendProgress}%"></div>
          </div>
          <span class="progress-text">${Math.round(this.sendProgress)}% sent</span>
        </div>
        <h3>${this.scheduleType === 'immediate' ? 'Sending Campaign...' : 'Campaign Scheduled!'}</h3>
        <p>${this.scheduleType === 'immediate' ? 'Please wait while we send your emails' : 'Your campaign will be sent at the scheduled time'}</p>
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    if (this.step === 1) {
      const nextBtn = this.overlay.querySelector('.next-btn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          const nameInput = this.overlay.querySelector('.form-input');
          const subjectInput = this.overlay.querySelectorAll('.form-input')[1];
          this.campaignName = nameInput?.value || '';
          this.subject = subjectInput?.value || '';
          if (this.campaignName && this.subject) {
            this.step = 2;
            this.updateBody(this.renderBody());
            this.setupEventListeners();
          }
        });
      }
    }

    if (this.step === 2) {
      this.overlay.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', (e) => {
          this.selectedTemplate = e.currentTarget.dataset.template;
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        });
      });

      this.overlay.querySelector('.back-btn')?.addEventListener('click', () => {
        this.step = 1;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });

      this.overlay.querySelector('.next-btn')?.addEventListener('click', () => {
        this.step = 3;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    }

    if (this.step === 3) {
      this.overlay.querySelectorAll('.schedule-option').forEach(option => {
        option.addEventListener('click', (e) => {
          this.scheduleType = e.currentTarget.dataset.schedule;
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        });
      });

      this.overlay.querySelectorAll('input[name="segment"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          this.selectedSegment = e.target.value;
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        });
      });

      this.overlay.querySelector('.back-btn')?.addEventListener('click', () => {
        this.step = 2;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });

      this.overlay.querySelector('.next-btn')?.addEventListener('click', () => {
        this.step = 4;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    }

    if (this.step === 4) {
      this.overlay.querySelector('.back-btn')?.addEventListener('click', () => {
        this.step = 3;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });

      this.overlay.querySelector('.send-btn')?.addEventListener('click', () => {
        this.startSend();
      });
    }
  }

  startSend() {
    this.step = 5;
    this.updateBody(this.renderBody());
    this.setupEventListeners();

    if (this.scheduleType === 'immediate') {
      const interval = setInterval(() => {
        this.sendProgress += 2;
        if (this.sendProgress >= 100) {
          clearInterval(interval);
          this.onConfirm({ action: 'campaignSent', campaign: this.getCampaignData() });
          setTimeout(() => this.close(), 500);
        } else {
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        }
      }, 50);
    } else {
      setTimeout(() => {
        this.onConfirm({ action: 'campaignScheduled', campaign: this.getCampaignData() });
        this.close();
      }, 1000);
    }
  }

  getCampaignData() {
    return {
      name: this.campaignName,
      subject: this.subject,
      previewText: this.previewText,
      template: this.selectedTemplate,
      segment: this.selectedSegment,
      scheduleType: this.scheduleType,
      scheduledDate: this.scheduledDate,
      scheduledTime: this.scheduledTime
    };
  }
}

export default EmailCampaignModal;
