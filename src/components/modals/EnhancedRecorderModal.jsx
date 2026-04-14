import { BaseModal } from './BaseModal';

const QUALITY_PRESETS = [
  { id: '720p', name: '720p HD', resolution: '1280x720', fps: 30, bitrate: '5 Mbps' },
  { id: '1080p', name: '1080p Full HD', resolution: '1920x1080', fps: 30, bitrate: '10 Mbps' },
  { id: '1080p60', name: '1080p 60fps', resolution: '1920x1080', fps: 60, bitrate: '15 Mbps' },
  { id: '4k', name: '4K Ultra HD', resolution: '3840x2160', fps: 30, bitrate: '35 Mbps' }
];

const RECORDING_SOURCES = [
  { id: 'screen', name: 'Entire Screen', icon: 'monitor', enabled: true },
  { id: 'window', name: 'Application Window', icon: 'window', enabled: true },
  { id: 'tab', name: 'Browser Tab', icon: 'chrome', enabled: false },
  { id: 'camera', name: 'Webcam', icon: 'camera', enabled: true }
];

export class EnhancedRecorderModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Screen Recorder',
      size: 'large',
      showFooter: false,
      ...options
    });

    this.recordingState = 'idle';
    this.selectedSources = ['screen'];
    this.webcamEnabled = true;
    this.audioEnabled = true;
    this.systemAudioEnabled = false;
    this.microphoneEnabled = true;
    this.selectedQuality = '1080p';
    this.recordingTime = 0;
    this.recordingInterval = null;
    this.annotations = [];
    this.annotationColor = '#22d3ee';
    this.annotationTool = 'none';
    this.isDrawing = false;
    this.recordedBlob = null;
  }

  renderBody() {
    return `
      <div class="recorder-container">
        <div class="recorder-main">
          <div class="recorder-preview">
            ${this.recordingState === 'idle' ? this.renderIdlePreview() : ''}
            ${this.recordingState === 'recording' ? this.renderRecordingPreview() : ''}
            ${this.recordingState === 'paused' ? this.renderPausedPreview() : ''}
            ${this.recordingState === 'stopped' ? this.renderStoppedPreview() : ''}
          </div>

          <div class="recorder-controls">
            ${this.recordingState === 'idle' ? `
              <button class="recorder-main-btn start-btn" aria-label="Start Recording">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </button>
            ` : ''}
            ${this.recordingState === 'recording' ? `
              <button class="recorder-main-btn pause-btn" aria-label="Pause">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              </button>
              <button class="recorder-main-btn stop-btn" aria-label="Stop">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
              </button>
            ` : ''}
            ${this.recordingState === 'paused' ? `
              <button class="recorder-main-btn resume-btn" aria-label="Resume">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </button>
              <button class="recorder-main-btn stop-btn" aria-label="Stop">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
              </button>
            ` : ''}
            ${this.recordingState === 'stopped' ? `
              <button class="recorder-main-btn re-record-btn" aria-label="Record Again">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2.5 2v6h6M21.5 22v-6h-6"/>
                  <path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.3"/>
                </svg>
              </button>
            ` : ''}
          </div>

          ${this.recordingState === 'recording' || this.recordingState === 'paused' ? `
            <div class="recording-timer">
              <span class="timer-dot ${this.recordingState === 'recording' ? 'active' : ''}"></span>
              <span class="timer-text">${this.formatTime(this.recordingTime)}</span>
            </div>
          ` : ''}
        </div>

        <div class="recorder-sidebar">
          <div class="sidebar-section">
            <h4>Sources</h4>
            <div class="source-list">
              ${RECORDING_SOURCES.map(source => `
                <label class="source-item ${!source.enabled ? 'disabled' : ''}">
                  <input type="checkbox" 
                         value="${source.id}" 
                         ${this.selectedSources.includes(source.id) ? 'checked' : ''} 
                         ${!source.enabled ? 'disabled' : ''} />
                  <span class="source-icon">
                    ${source.id === 'screen' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' : ''}
                    ${source.id === 'window' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>' : ''}
                    ${source.id === 'tab' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>' : ''}
                    ${source.id === 'camera' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' : ''}
                  </span>
                  <span class="source-name">${source.name}</span>
                  ${!source.enabled ? '<span class="unavailable">N/A</span>' : ''}
                </label>
              `).join('')}
            </div>
          </div>

          <div class="sidebar-section">
            <h4>Audio</h4>
            <div class="audio-options">
              <label class="audio-item">
                <input type="checkbox" ${this.microphoneEnabled ? 'checked' : ''} data-audio="microphone" />
                <span class="audio-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </span>
                <span>Microphone</span>
              </label>
              <label class="audio-item">
                <input type="checkbox" ${this.systemAudioEnabled ? 'checked' : ''} data-audio="system" />
                <span class="audio-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </svg>
                </span>
                <span>System Audio</span>
              </label>
            </div>
          </div>

          <div class="sidebar-section">
            <h4>Quality</h4>
            <div class="quality-options">
              ${QUALITY_PRESETS.map(preset => `
                <label class="quality-option ${this.selectedQuality === preset.id ? 'selected' : ''}">
                  <input type="radio" name="quality" value="${preset.id}" ${this.selectedQuality === preset.id ? 'checked' : ''} />
                  <div class="quality-info">
                    <span class="quality-name">${preset.name}</span>
                    <span class="quality-details">${preset.resolution} • ${preset.fps}fps</span>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>

          ${this.recordingState === 'stopped' ? `
            <div class="sidebar-section">
              <h4>Actions</h4>
              <div class="action-buttons">
                <button class="modal-btn modal-btn-primary download-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                </button>
                <button class="modal-btn modal-btn-secondary save-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save to Library
                </button>
              </div>
            </div>
          ` : ''}
        </div>

        ${this.recordingState === 'recording' ? this.renderAnnotationToolbar() : ''}
      </div>
    `;
  }

  renderIdlePreview() {
    return `
      <div class="preview-placeholder">
        <div class="placeholder-content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <p>Select sources to start recording</p>
          <span class="placeholder-hint">Click the red button to begin</span>
        </div>
      </div>
    `;
  }

  renderRecordingPreview() {
    return `
      <div class="preview-recording">
        <div class="recording-indicator">
          <span class="rec-dot"></span>
          <span>REC</span>
        </div>
        <div class="preview-screen">
          <div class="screen-mock">
            <div class="mock-toolbar"></div>
            <div class="mock-content">
              <div class="mock-video-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            </div>
          </div>
          ${this.webcamEnabled ? `
            <div class="webcam-preview">
              <div class="webcam-mock"></div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderPausedPreview() {
    return `
      <div class="preview-paused">
        <div class="paused-indicator">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
          <span>PAUSED</span>
        </div>
      </div>
    `;
  }

  renderStoppedPreview() {
    return `
      <div class="preview-stopped">
        <div class="stopped-content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
          <h4>Recording Complete</h4>
          <p>Duration: ${this.formatTime(this.recordingTime)}</p>
          <p class="file-info">Format: WebM • Size: ~12.5 MB</p>
        </div>
      </div>
    `;
  }

  renderAnnotationToolbar() {
    return `
      <div class="annotation-toolbar">
        <div class="annotation-tools">
          <button class="annotation-btn ${this.annotationTool === 'pen' ? 'active' : ''}" data-tool="pen" aria-label="Pen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
          </button>
          <button class="annotation-btn ${this.annotationTool === 'arrow' ? 'active' : ''}" data-tool="arrow" aria-label="Arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
          <button class="annotation-btn ${this.annotationTool === 'rect' ? 'active' : ''}" data-tool="rect" aria-label="Rectangle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            </svg>
          </button>
          <button class="annotation-btn ${this.annotationTool === 'text' ? 'active' : ''}" data-tool="text" aria-label="Text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4 7 4 4 20 4 20 7"/>
              <line x1="9" y1="20" x2="15" y2="20"/>
              <line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
          </button>
          <button class="annotation-btn ${this.annotationTool === 'none' ? 'active' : ''}" data-tool="none" aria-label="Select">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
            </svg>
          </button>
        </div>
        <div class="annotation-colors">
          <button class="color-btn active" style="background: #22d3ee" data-color="#22d3ee"></button>
          <button class="color-btn" style="background: #34d399" data-color="#34d399"></button>
          <button class="color-btn" style="background: #f472b6" data-color="#f472b6"></button>
          <button class="color-btn" style="background: #fbbf24" data-color="#fbbf24"></button>
          <button class="color-btn" style="background: #ffffff" data-color="#ffffff"></button>
        </div>
        <button class="annotation-btn clear-btn" aria-label="Clear annotations">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  setupEventListeners() {
    super.setupEventListeners();

    const startBtn = this.overlay.querySelector('.start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startRecording());
    }

    const pauseBtn = this.overlay.querySelector('.pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pauseRecording());
    }

    const resumeBtn = this.overlay.querySelector('.resume-btn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => this.resumeRecording());
    }

    const stopBtn = this.overlay.querySelector('.stop-btn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stopRecording());
    }

    const reRecordBtn = this.overlay.querySelector('.re-record-btn');
    if (reRecordBtn) {
      reRecordBtn.addEventListener('click', () => this.resetRecording());
    }

    this.overlay.querySelectorAll('input[data-audio]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.dataset.audio === 'microphone') {
          this.microphoneEnabled = e.target.checked;
        } else if (e.target.dataset.audio === 'system') {
          this.systemAudioEnabled = e.target.checked;
        }
      });
    });

    this.overlay.querySelectorAll('input[name="quality"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.selectedQuality = e.target.value;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.annotation-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.annotationTool = btn.dataset.tool;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.annotationColor = btn.dataset.color;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    const downloadBtn = this.overlay.querySelector('.download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadRecording());
    }
  }

  startRecording() {
    this.recordingState = 'recording';
    this.recordingTime = 0;
    this.updateBody(this.renderBody());
    this.setupEventListeners();

    this.recordingInterval = setInterval(() => {
      this.recordingTime++;
      const timerEl = this.overlay.querySelector('.timer-text');
      if (timerEl) {
        timerEl.textContent = this.formatTime(this.recordingTime);
      }
    }, 1000);
  }

  pauseRecording() {
    this.recordingState = 'paused';
    clearInterval(this.recordingInterval);
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  resumeRecording() {
    this.recordingState = 'recording';
    this.updateBody(this.renderBody());
    this.setupEventListeners();

    this.recordingInterval = setInterval(() => {
      this.recordingTime++;
      const timerEl = this.overlay.querySelector('.timer-text');
      if (timerEl) {
        timerEl.textContent = this.formatTime(this.recordingTime);
      }
    }, 1000);
  }

  stopRecording() {
    this.recordingState = 'stopped';
    clearInterval(this.recordingInterval);
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  resetRecording() {
    this.recordingState = 'idle';
    this.recordingTime = 0;
    this.recordedBlob = null;
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  downloadRecording() {
    this.onConfirm({ action: 'download', duration: this.recordingTime, quality: this.selectedQuality });
    this.close();
  }
}

export default EnhancedRecorderModal;
