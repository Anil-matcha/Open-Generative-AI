import { BaseModal } from './BaseModal';

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const VOLUME_PRESETS = [0, 25, 50, 75, 100];

export class PreviewMediaModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Media Preview',
      size: 'full',
      showFooter: false,
      ...options
    });

    this.mediaUrl = options.mediaUrl || '';
    this.mediaType = options.mediaType || 'video';
    this.volume = options.volume ?? 100;
    this.isMuted = options.isMuted || false;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.playbackSpeed = 1;
    this.isFullscreen = false;
    this.showWaveform = false;
    this.loopEnabled = false;
    this.aspectRatio = '16:9';
  }

  renderBody() {
    return `
      <div class="previewmedia-container">
        <div class="previewmedia-header">
          <div class="media-info">
            <span class="media-type-badge">${this.mediaType.toUpperCase()}</span>
            <span class="media-name">${this.getFileName()}</span>
          </div>
          <div class="header-controls">
            <button class="control-btn ${this.loopEnabled ? 'active' : ''}" data-action="loop" aria-label="Toggle loop">
              <span>🔁</span>
            </button>
            <button class="control-btn" data-action="pip" aria-label="Picture in picture">
              <span>⊟</span>
            </button>
            <button class="control-btn" data-action="fullscreen" aria-label="Toggle fullscreen">
              <span>⛶</span>
            </button>
          </div>
        </div>

        <div class="previewmedia-viewport">
          <div class="viewport-wrapper" style="aspect-ratio: ${this.aspectRatio};">
            ${this.mediaUrl ? `
              ${this.mediaType === 'video' ? `
                <video class="media-video" src="${this.mediaUrl}" ${this.isMuted ? 'muted' : ''} playsinline controls>
                  Your browser does not support video playback.
                </video>
                ${this.showWaveform ? `
                  <div class="audio-waveform">
                    <canvas class="waveform-canvas"></canvas>
                  </div>
                ` : ''}
              ` : this.mediaType === 'audio' ? `
                <div class="audio-visualizer">
                  <div class="audio-icon">🎵</div>
                  ${this.showWaveform ? `
                    <div class="waveform-display">
                      <canvas class="waveform-canvas"></canvas>
                    </div>
                  ` : `
                    <div class="audio-artwork">
                      <div class="artwork-placeholder">♪</div>
                    </div>
                  `}
                </div>
              ` : `
                <img class="media-image" src="${this.mediaUrl}" alt="Preview" />
              `}
            ` : `
              <div class="media-placeholder">
                <span>No media loaded</span>
              </div>
            `}

            ${this.isPlaying ? `
              <div class="play-overlay">
                <div class="pause-indicator">⏸</div>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="previewmedia-controls">
          <div class="timeline-scrubber">
            <div class="scrubber-track">
              <div class="scrubber-progress" style="width: ${this.getProgressPercent()}%"></div>
              <div class="scrubber-handle" style="left: ${this.getProgressPercent()}%"></div>
            </div>
            <div class="time-display">
              <span class="current-time">${this.formatTime(this.currentTime)}</span>
              <span class="time-separator">/</span>
              <span class="total-time">${this.formatTime(this.duration)}</span>
            </div>
          </div>

          <div class="control-bar">
            <div class="control-group main-controls">
              <button class="control-btn skip-btn" data-action="skip-back" aria-label="Skip back 10s">
                <span>⏪</span>
              </button>
              <button class="control-btn play-btn ${this.isPlaying ? 'playing' : ''}" data-action="play-pause" aria-label="${this.isPlaying ? 'Pause' : 'Play'}">
                <span>${this.isPlaying ? '⏸' : '▶'}</span>
              </button>
              <button class="control-btn skip-btn" data-action="skip-forward" aria-label="Skip forward 10s">
                <span>⏩</span>
              </button>
            </div>

            <div class="control-group volume-controls">
              <button class="control-btn volume-btn ${this.isMuted ? 'muted' : ''}" data-action="toggle-mute" aria-label="${this.isMuted ? 'Unmute' : 'Mute'}">
                <span>${this.getVolumeIcon()}</span>
              </button>
              <div class="volume-slider">
                <input type="range" class="volume-input" min="0" max="100" value="${this.isMuted ? 0 : this.volume}" />
                <div class="volume-fill" style="width: ${this.isMuted ? 0 : this.volume}%"></div>
              </div>
              <span class="volume-value">${this.isMuted ? 0 : this.volume}%</span>
            </div>

            <div class="control-group playback-controls">
              <div class="speed-selector">
                <button class="speed-btn" data-action="speed">${this.playbackSpeed}x</button>
                <div class="speed-dropdown">
                  ${PLAYBACK_SPEEDS.map(speed => `
                    <button class="speed-option ${this.playbackSpeed === speed ? 'active' : ''}" data-speed="${speed}">
                      ${speed}x
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="control-group view-controls">
              <button class="control-btn ${this.showWaveform ? 'active' : ''}" data-action="toggle-waveform" aria-label="Toggle waveform">
                <span>∿</span>
              </button>
              <div class="aspect-selector">
                <button class="aspect-btn" data-action="aspect">${this.aspectRatio}</button>
              </div>
            </div>
          </div>
        </div>

        <div class="previewmedia-info">
          <div class="info-section">
            <span class="info-label">Duration</span>
            <span class="info-value">${this.formatTime(this.duration)}</span>
          </div>
          <div class="info-section">
            <span class="info-label">Resolution</span>
            <span class="info-value">1920 × 1080</span>
          </div>
          <div class="info-section">
            <span class="info-label">Frame Rate</span>
            <span class="info-value">30 fps</span>
          </div>
        </div>
      </div>

      <div class="modal-footer previewmedia-footer">
        <div class="footer-left">
          <button class="modal-btn modal-btn-secondary" data-action="add-to-timeline">
            <span>Add to Timeline</span>
          </button>
        </div>
        <div class="footer-right">
          <button class="modal-btn modal-btn-secondary modal-cancel">Close</button>
          <button class="modal-btn modal-btn-primary" data-action="use-media">
            Use Media
          </button>
        </div>
      </div>
    `;
  }

  getFileName() {
    if (!this.mediaUrl) return 'No file selected';
    try {
      const url = new URL(this.mediaUrl);
      const parts = url.pathname.split('/');
      return parts[parts.length - 1] || 'Untitled';
    } catch {
      return 'Preview';
    }
  }

  getProgressPercent() {
    if (this.duration === 0) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  getVolumeIcon() {
    if (this.isMuted || this.volume === 0) return '🔇';
    if (this.volume < 33) return '🔈';
    if (this.volume < 66) return '🔉';
    return '🔊';
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  setupEventListeners() {
    super.setupEventListeners();

    const video = this.overlay.querySelector('.media-video');
    if (video) {
      video.addEventListener('loadedmetadata', () => {
        this.duration = video.duration;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });

      video.addEventListener('timeupdate', () => {
        this.currentTime = video.currentTime;
        this.updateProgress();
      });

      video.addEventListener('play', () => { this.isPlaying = true; this.updateBody(this.renderBody()); this.setupEventListeners(); });
      video.addEventListener('pause', () => { this.isPlaying = false; this.updateBody(this.renderBody()); this.setupEventListeners(); });
      video.addEventListener('ended', () => {
        this.isPlaying = false;
        if (this.loopEnabled) video.currentTime = 0;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    }

    this.overlay.querySelectorAll('.control-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleControlAction(action, btn);
      });
    });

    const scrubberTrack = this.overlay.querySelector('.scrubber-track');
    if (scrubberTrack) {
      scrubberTrack.addEventListener('click', (e) => {
        const rect = scrubberTrack.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * this.duration;
        const video = this.overlay.querySelector('.media-video');
        if (video) video.currentTime = newTime;
        this.currentTime = newTime;
        this.updateProgress();
      });
    }

    const volumeInput = this.overlay.querySelector('.volume-input');
    if (volumeInput) {
      volumeInput.addEventListener('input', (e) => {
        this.volume = parseInt(e.target.value);
        this.isMuted = false;
        const video = this.overlay.querySelector('.media-video');
        if (video) video.volume = this.volume / 100;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    }

    this.overlay.querySelectorAll('.speed-option').forEach(opt => {
      opt.addEventListener('click', () => {
        this.playbackSpeed = parseFloat(opt.dataset.speed);
        const video = this.overlay.querySelector('.media-video');
        if (video) video.playbackRate = this.playbackSpeed;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelector('[data-action="add-to-timeline"]')?.addEventListener('click', () => {
      this.onConfirm({ action: 'addToTimeline', mediaUrl: this.mediaUrl, mediaType: this.mediaType });
    });

    this.overlay.querySelector('[data-action="use-media"]')?.addEventListener('click', () => {
      this.onConfirm({ action: 'useMedia', mediaUrl: this.mediaUrl, mediaType: this.mediaType });
    });
  }

  handleControlAction(action, btn) {
    const video = this.overlay.querySelector('.media-video');

    switch (action) {
      case 'play-pause':
        if (video) {
          if (this.isPlaying) video.pause();
          else video.play();
        }
        break;
      case 'skip-back':
        if (video) video.currentTime = Math.max(0, video.currentTime - 10);
        break;
      case 'skip-forward':
        if (video) video.currentTime = Math.min(this.duration, video.currentTime + 10);
        break;
      case 'toggle-mute':
        this.isMuted = !this.isMuted;
        if (video) video.muted = this.isMuted;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
        break;
      case 'loop':
        this.loopEnabled = !this.loopEnabled;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
        break;
      case 'pip':
        if (video && document.pictureInPictureEnabled) {
          if (document.pictureInPictureElement) document.exitPictureInPicture();
          else video.requestPictureInPicture();
        }
        break;
      case 'fullscreen':
        const viewport = this.overlay.querySelector('.previewmedia-container');
        if (!document.fullscreenElement) {
          viewport?.requestFullscreen();
          this.isFullscreen = true;
        } else {
          document.exitFullscreen();
          this.isFullscreen = false;
        }
        break;
      case 'toggle-waveform':
        this.showWaveform = !this.showWaveform;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
        break;
    }
  }

  updateProgress() {
    const progress = this.overlay.querySelector('.scrubber-progress');
    const handle = this.overlay.querySelector('.scrubber-handle');
    const currentTimeEl = this.overlay.querySelector('.current-time');
    if (progress) progress.style.width = `${this.getProgressPercent()}%`;
    if (handle) handle.style.left = `${this.getProgressPercent()}%`;
    if (currentTimeEl) currentTimeEl.textContent = this.formatTime(this.currentTime);
  }
}

export default PreviewMediaModal;