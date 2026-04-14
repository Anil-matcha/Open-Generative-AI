import { BaseModal } from './BaseModal';

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: '▶', color: '#FF0000', description: 'Video sharing platform' },
  { id: 'facebook', name: 'Facebook', icon: 'f', color: '#1877F2', description: 'Social media' },
  { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F', description: 'Photo & video' },
  { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', color: '#000000', description: 'Microblogging' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in', color: '#0A66C2', description: 'Professional network' },
  { id: 'tiktok', name: 'TikTok', icon: '♪', color: '#000000', description: 'Short video' }
];

const POST_TYPES = [
  { id: 'video', label: 'Video Post', icon: '🎬' },
  { id: 'reel', label: 'Reel/Short', icon: '⚡' },
  { id: 'story', label: 'Story', icon: '📱' },
  { id: 'carousel', label: 'Carousel', icon: '🖼' }
];

const SCHEDULE_PRESETS = [
  { id: 'now', label: 'Publish Now', icon: '🚀' },
  { id: '1h', label: 'In 1 hour', icon: '1h' },
  { id: '3h', label: 'In 3 hours', icon: '3h' },
  { id: 'tomorrow', label: 'Tomorrow', icon: '📅' },
  { id: 'custom', label: 'Custom Date', icon: '⏰' }
];

export class SocialPublisherModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Publish to Social Media',
      size: 'large',
      showFooter: false,
      ...options
    });

    this.selectedPlatforms = [];
    this.postType = 'video';
    this.caption = '';
    this.hashtags = [];
    this.hashtagInput = '';
    this.scheduleMode = 'now';
    this.scheduledTime = null;
    this.isPublishing = false;
    this.showAnalytics = false;
    this.analyticsData = {
      estimatedReach: 0,
      estimatedViews: 0,
      optimalPostTime: '9:00 AM - 11:00 AM'
    };
    this.step = 'select';
  }

  renderBody() {
    return `
      <div class="socialpublisher-container">
        <div class="publisher-header">
          <div class="step-tabs">
            <button class="step-tab ${this.step === 'select' ? 'active' : ''}" data-step="select">
              <span class="step-num">1</span>
              <span class="step-label">Select Platforms</span>
            </button>
            <button class="step-tab ${this.step === 'compose' ? 'active' : ''}" data-step="compose">
              <span class="step-num">2</span>
              <span class="step-label">Compose</span>
            </button>
            <button class="step-tab ${this.step === 'schedule' ? 'active' : ''}" data-step="schedule">
              <span class="step-num">3</span>
              <span class="step-label">Schedule</span>
            </button>
            <button class="step-tab ${this.step === 'review' ? 'active' : ''}" data-step="review">
              <span class="step-num">4</span>
              <span class="step-label">Review</span>
            </button>
          </div>
        </div>

        <div class="publisher-content">
          <div class="step-panel ${this.step === 'select' ? 'active' : ''}" data-panel="select">
            <div class="platforms-section">
              <h3>Choose Platforms</h3>
              <div class="platforms-grid">
                ${PLATFORMS.map(platform => `
                  <button class="platform-card ${this.selectedPlatforms.includes(platform.id) ? 'selected' : ''}" 
                          data-platform="${platform.id}"
                          style="--platform-color: ${platform.color}">
                    <div class="platform-icon" style="background: ${platform.color}20; color: ${platform.color}">
                      ${platform.icon}
                    </div>
                    <div class="platform-info">
                      <span class="platform-name">${platform.name}</span>
                      <span class="platform-desc">${platform.description}</span>
                    </div>
                    ${this.selectedPlatforms.includes(platform.id) ? `
                      <div class="selected-badge">✓</div>
                    ` : ''}
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="post-type-section">
              <h3>Post Type</h3>
              <div class="post-types">
                ${POST_TYPES.map(type => `
                  <button class="post-type-btn ${this.postType === type.id ? 'active' : ''}" data-type="${type.id}">
                    <span class="type-icon">${type.icon}</span>
                    <span class="type-label">${type.label}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="step-panel" data-panel="compose" style="display: ${this.step === 'compose' ? 'block' : 'none'}">
            <div class="compose-section">
              <div class="caption-section">
                <h3>Caption</h3>
                <div class="caption-input-container">
                  <textarea class="caption-input" 
                            placeholder="Write a caption for your post..."
                            aria-label="Post caption">${this.caption}</textarea>
                  <div class="caption-meta">
                    <span class="char-count">${this.caption.length}/2200</span>
                  </div>
                </div>
              </div>

              <div class="hashtags-section">
                <h3>Hashtags</h3>
                <div class="hashtags-input-container">
                  <div class="hashtags-display">
                    ${this.hashtags.map((tag, idx) => `
                      <span class="hashtag">
                        #${tag}
                        <button class="hashtag-remove" data-index="${idx}">×</button>
                      </span>
                    `).join('')}
                    <input type="text" class="hashtag-input" 
                           placeholder="${this.hashtags.length === 0 ? 'Add hashtags...' : ''}"
                           aria-label="Add hashtag" />
                  </div>
                  <div class="hashtag-suggestions">
                    <span class="suggestion-label">Suggestions:</span>
                    ${['trending', 'viral', 'fyp', 'newvideo', 'edit'].map(tag => `
                      <button class="suggestion-chip" data-tag="${tag}">#${tag}</button>
                    `).join('')}
                  </div>
                </div>
              </div>

              <div class="preview-section">
                <h3>Preview</h3>
                <div class="post-preview-card">
                  <div class="preview-header">
                    <div class="preview-avatar"></div>
                    <div class="preview-info">
                      <span class="preview-name">Your Channel</span>
                      <span class="preview-time">Just now</span>
                    </div>
                  </div>
                  <div class="preview-content">
                    <p>${this.caption || 'Your caption will appear here...'}</p>
                    ${this.hashtags.length > 0 ? `
                      <div class="preview-hashtags">
                        ${this.hashtags.map(t => `<span class="preview-tag">#${t}</span>`).join('')}
                      </div>
                    ` : ''}
                  </div>
                  <div class="preview-media">
                    <div class="media-placeholder">
                      <span>Video thumbnail</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="step-panel" data-panel="schedule" style="display: ${this.step === 'schedule' ? 'block' : 'none'}">
            <div class="schedule-section">
              <div class="schedule-options">
                <h3>When to Publish</h3>
                <div class="schedule-presets">
                  ${SCHEDULE_PRESETS.map(preset => `
                    <button class="schedule-btn ${this.scheduleMode === preset.id ? 'active' : ''}" data-schedule="${preset.id}">
                      <span class="schedule-icon">${preset.icon}</span>
                      <span class="schedule-label">${preset.label}</span>
                    </button>
                  `).join('')}
                </div>
              </div>

              ${this.scheduleMode === 'custom' ? `
                <div class="custom-datetime">
                  <div class="datetime-row">
                    <div class="datetime-field">
                      <label>Date</label>
                      <input type="date" class="date-input" />
                    </div>
                    <div class="datetime-field">
                      <label>Time</label>
                      <input type="time" class="time-input" />
                    </div>
                  </div>
                </div>
              ` : ''}

              <div class="optimal-time">
                <div class="optimal-badge">
                  <span class="optimal-icon">⭐</span>
                  <span>Optimal posting time: ${this.analyticsData.optimalPostTime}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="step-panel" data-panel="review" style="display: ${this.step === 'review' ? 'block' : 'none'}">
            <div class="review-section">
              <h3>Review & Publish</h3>

              <div class="review-summary">
                <div class="summary-card">
                  <h4>Platforms</h4>
                  <div class="summary-platforms">
                    ${this.selectedPlatforms.map(pid => {
                      const platform = PLATFORMS.find(p => p.id === pid);
                      return `<span class="platform-badge" style="--platform-color: ${platform.color}">${platform.icon} ${platform.name}</span>`;
                    }).join('')}
                  </div>
                </div>

                <div class="summary-card">
                  <h4>Post Details</h4>
                  <div class="summary-detail">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${POST_TYPES.find(t => t.id === this.postType)?.label}</span>
                  </div>
                  <div class="summary-detail">
                    <span class="detail-label">Caption:</span>
                    <span class="detail-value">${this.caption.substring(0, 50)}${this.caption.length > 50 ? '...' : ''}</span>
                  </div>
                  <div class="summary-detail">
                    <span class="detail-label">Hashtags:</span>
                    <span class="detail-value">${this.hashtags.length} added</span>
                  </div>
                </div>

                <div class="summary-card">
                  <h4>Schedule</h4>
                  <div class="summary-detail">
                    <span class="detail-label">When:</span>
                    <span class="detail-value">${this.getScheduleLabel()}</span>
                  </div>
                </div>
              </div>

              <div class="estimated-reach">
                <h4>Estimated Performance</h4>
                <div class="reach-metrics">
                  <div class="metric">
                    <span class="metric-value">${this.selectedPlatforms.length * 500}+</span>
                    <span class="metric-label">Est. Reach</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">${this.selectedPlatforms.length * 150}+</span>
                    <span class="metric-label">Est. Views</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="publisher-footer">
          <div class="footer-nav">
            ${this.step !== 'select' ? `
              <button class="nav-btn back-btn" data-nav="back">
                ← Back
              </button>
            ` : ''}
            <button class="nav-btn next-btn modal-btn modal-btn-primary" data-nav="next">
              ${this.step === 'review' ? '🚀 Publish Now' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="display: none;">
        <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
      </div>
    `;
  }

  getScheduleLabel() {
    if (this.scheduleMode === 'now') return 'Publish immediately';
    if (this.scheduleMode === '1h') return 'In 1 hour';
    if (this.scheduleMode === '3h') return 'In 3 hours';
    if (this.scheduleMode === 'tomorrow') return 'Tomorrow at 9:00 AM';
    return 'Custom date/time';
  }

  setupEventListeners() {
    super.setupEventListeners();

    this.overlay.querySelectorAll('.step-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.step = tab.dataset.step;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.platform-card').forEach(card => {
      card.addEventListener('click', () => {
        const platformId = card.dataset.platform;
        if (this.selectedPlatforms.includes(platformId)) {
          this.selectedPlatforms = this.selectedPlatforms.filter(p => p !== platformId);
        } else {
          this.selectedPlatforms.push(platformId);
        }
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.post-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.postType = btn.dataset.type;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    const captionInput = this.overlay.querySelector('.caption-input');
    if (captionInput) {
      captionInput.addEventListener('input', (e) => {
        this.caption = e.target.value;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    }

    const hashtagInput = this.overlay.querySelector('.hashtag-input');
    if (hashtagInput) {
      hashtagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const tag = this.hashtagInput.trim().replace(/^#/, '');
          if (tag && !this.hashtags.includes(tag)) {
            this.hashtags.push(tag);
            this.hashtagInput = '';
            this.updateBody(this.renderBody());
            this.setupEventListeners();
          }
        }
      });
      hashtagInput.addEventListener('input', (e) => {
        this.hashtagInput = e.target.value;
      });
    }

    this.overlay.querySelectorAll('.hashtag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.hashtags.splice(idx, 1);
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        if (!this.hashtags.includes(tag)) {
          this.hashtags.push(tag);
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        }
      });
    });

    this.overlay.querySelectorAll('.schedule-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.scheduleMode = btn.dataset.schedule;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelector('.nav-btn[data-nav="next"]')?.addEventListener('click', () => {
      const steps = ['select', 'compose', 'schedule', 'review'];
      const currentIdx = steps.indexOf(this.step);
      if (currentIdx < steps.length - 1) {
        this.step = steps[currentIdx + 1];
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      } else {
        this.publishPost();
      }
    });

    this.overlay.querySelector('.nav-btn[data-nav="back"]')?.addEventListener('click', () => {
      const steps = ['select', 'compose', 'schedule', 'review'];
      const currentIdx = steps.indexOf(this.step);
      if (currentIdx > 0) {
        this.step = steps[currentIdx - 1];
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      }
    });
  }

  publishPost() {
    this.isPublishing = true;
    this.updateBody(this.renderBody());
    this.setupEventListeners();

    setTimeout(() => {
      this.onConfirm({
        action: 'postPublished',
        platforms: this.selectedPlatforms,
        postType: this.postType,
        caption: this.caption,
        hashtags: this.hashtags,
        scheduleMode: this.scheduleMode,
        scheduledTime: this.scheduledTime
      });
      this.isPublishing = false;
      this.close();
    }, 1500);
  }
}

export default SocialPublisherModal;