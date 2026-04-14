import { BaseModal } from './BaseModal';

export class TemplateGeneratorModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Video Automation Creator',
      size: 'medium',
      closable: false,
      ...options
    });

    this.isWarningClosed = false;
    this.checkBrowserCompatibility();
  }

  checkBrowserCompatibility() {
    const ua = navigator.userAgent;
    this.isSafari = ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1;
  }

  renderBody() {
    if (this.isSafari && !this.isWarningClosed) {
      return this.renderSafariWarning();
    }

    return `
      <div class="template-generator-content">
        <div class="generator-offer">
          <div class="generator-text-box">
            <p class="generator-text">Do you want to use the Video Automation Creator?</p>
            <div class="help-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <path d="M12 17h.01"/>
              </svg>
            </div>
          </div>

          <div class="generator-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>

          <div class="generator-buttons">
            <button class="generator-btn generator-yes" id="accept-generator">
              Yes
            </button>
            <button class="generator-btn generator-no" id="decline-generator">
              No, thanks
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderSafariWarning() {
    return `
      <div class="template-generator-content">
        <div class="generator-warning">
          <div class="warning-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
          </div>
          <div class="warning-content">
            <span class="warning-text">
              We recommend using
              <a href="https://www.google.com/chrome/" class="warning-link" target="_blank" rel="noopener noreferrer">Google Chrome</a>
              browser for the best experience.
            </span>
            <p class="warning-small-text">
              Safari may have limited functionality with the Video Automation Creator.
            </p>
          </div>
          <button class="generator-btn generator-yes" id="accept-warning">
            Accept
          </button>
        </div>
      </div>
    `;
  }

  renderFooter() {
    // No footer for this modal
    return '';
  }

  setupEventListeners() {
    super.setupEventListeners();

    if (this.isSafari && !this.isWarningClosed) {
      const acceptBtn = this.overlay.querySelector('#accept-warning');
      if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
          this.isWarningClosed = true;
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        });
      }
    } else {
      const acceptBtn = this.overlay.querySelector('#accept-generator');
      const declineBtn = this.overlay.querySelector('#decline-generator');

      if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
          this.onConfirm({ action: 'accept' });
          this.close();
        });
      }

      if (declineBtn) {
        declineBtn.addEventListener('click', () => {
          this.onCancel({ action: 'decline' });
          this.close();
        });
      }
    }
  }
}

export default TemplateGeneratorModal;