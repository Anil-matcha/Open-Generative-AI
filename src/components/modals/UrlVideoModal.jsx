import { BaseModal } from './BaseModal';

export class UrlVideoModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Add Video from URL',
      size: 'medium',
      ...options
    });

    this.currentValue = '';
    this.isLoading = false;
    this.error = null;
  }

  renderBody() {
    return `
      <div class="url-video-modal">
        <div class="url-video-header">
          <div class="url-video-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M10 14l2-2 2 2m-2-2v6m4-6h-4m4 0l4-4m-4 4V3a1 1 0 00-1-1H9a1 1 0 00-1 1v4M5 9h14l-1 8a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z"/>
            </svg>
          </div>
          <p class="url-video-description">
            Add your URL or download video from external hosting (YouTube, Vimeo, etc.)
          </p>
        </div>

        <div class="url-video-input-section">
          <div class="url-input-group">
            <div class="url-input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <input
              type="text"
              id="url-input"
              class="url-input"
              placeholder="Paste the URL to external video hosting (YouTube, Vimeo, etc.)"
              value="${this.currentValue}"
            />
          </div>

          ${this.error ? `<div class="url-error">${this.error}</div>` : ''}

          <button
            id="add-url-btn"
            class="url-add-btn ${!this.currentValue ? 'disabled' : ''}"
            ${!this.currentValue ? 'disabled' : ''}
          >
            ${this.isLoading ? '<div class="btn-spinner"></div> Adding...' : 'Add to Timeline'}
          </button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    const urlInput = this.overlay.querySelector('#url-input');
    const addBtn = this.overlay.querySelector('#add-url-btn');

    if (urlInput) {
      urlInput.addEventListener('input', (e) => {
        this.currentValue = e.target.value;
        this.validateUrl();
        this.updateButtonState();
      });

      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && this.currentValue) {
          this.onAddUrl();
        }
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => this.onAddUrl());
    }
  }

  validateUrl() {
    this.error = null;

    if (!this.currentValue.trim()) {
      return true;
    }

    let url = this.currentValue.trim();

    // Add protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        this.error = 'Invalid URL protocol';
        return false;
      }
      this.currentValue = url;
      return true;
    } catch (e) {
      this.error = 'Invalid URL format';
      return false;
    }
  }

  updateButtonState() {
    const addBtn = this.overlay.querySelector('#add-url-btn');
    const isValid = this.currentValue.trim() && !this.error;

    if (addBtn) {
      addBtn.classList.toggle('disabled', !isValid);
      addBtn.disabled = !isValid;
    }

    this.updateErrorDisplay();
  }

  updateErrorDisplay() {
    const existingError = this.overlay.querySelector('.url-error');
    if (this.error && !existingError) {
      const errorEl = document.createElement('div');
      errorEl.className = 'url-error';
      errorEl.textContent = this.error;
      const inputGroup = this.overlay.querySelector('.url-input-group');
      if (inputGroup) {
        inputGroup.insertAdjacentElement('afterend', errorEl);
      }
    } else if (!this.error && existingError) {
      existingError.remove();
    } else if (this.error && existingError) {
      existingError.textContent = this.error;
    }
  }

  async onAddUrl() {
    if (!this.validateUrl() || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.updateBody(this.renderBody());
    this.setupEventListeners();

    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Return the URL data
      const videoData = {
        url: this.currentValue,
        type: 'video',
        source: 'url'
      };

      this.onConfirm(videoData);
      this.close();
    } catch (e) {
      this.error = e.message || 'Failed to add video';
      this.isLoading = false;
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    }
  }
}

export default UrlVideoModal;