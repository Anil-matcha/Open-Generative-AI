import { BaseModal } from './BaseModal';
import { addVideoErrorRecovery } from '../../lib/videoPlayer.js';

export class VideoPlayerModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: options.title || 'Video Player',
      size: 'large',
      ...options
    });

    this.url = options.url || '';
    this.videoTitle = options.title || '';
  }

  renderBody() {
    if (!this.url) {
      return '<div class="video-placeholder">No video URL provided</div>';
    }

    return `
      <div class="video-player-container">
        <div class="video-wrapper">
          <video
            controls
            autoplay
            muted
            class="video-player"
            src="${this.url}"
            poster=""
          >
            Your browser does not support the video tag.
          </video>
        </div>
        ${this.videoTitle ? `<div class="video-info"><h4>${this.videoTitle}</h4></div>` : ''}
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    const video = this.overlay.querySelector('.video-player');
    if (video) {
      addVideoErrorRecovery(video, {
        onError: (message, error) => {
          console.error('VideoPlayerModal error:', message, error);
          // Could show error in modal
        }
      });
    }
  }

  renderFooter() {
    return `
      <button class="modal-btn modal-btn-secondary modal-cancel">Close</button>
    `;
  }
}

export default VideoPlayerModal;