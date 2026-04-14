import { BaseModal } from './BaseModal';

const QUALITY_OPTIONS = [
  { id: '1080p', name: '1080p HD', resolution: '1920x1080', fps: 30 },
  { id: '720p', name: '720p', resolution: '1280x720', fps: 30 },
  { id: '480p', name: '480p', resolution: '854x480', fps: 30 },
  { id: 'audio-only', name: 'Audio Only', resolution: null, fps: null }
];

const MIC_OPTIONS = [
  { id: 'default', label: 'System Default' },
  { id: 'built-in', label: 'Built-in Microphone' },
  { id: 'external', label: 'External USB Mic' }
];

export class RecorderModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Screen Recorder',
      size: 'medium',
      showFooter: false,
      ...options
    });

    this.recordingType = 'screen';
    this.selectedQuality = '1080p';
    this.selectedMic = 'default';
    this.includeWebcam = false;
    this.isRecording = false;
    this.isPaused = false;
    this.recordingTime = 0;
    this.recordedBlob = null;
    this.webcamStream = null;
    this.screenStream = null;
    this.recordingInterval = null;
  }

  renderBody() {
    return `
      <div class="recorder-container">
        <div class="recorder-type-selector">
          <button class="type-btn ${this.recordingType === 'screen' ? 'active' : ''}" data-type="screen">
            <span class="type-icon">🖥</span>
            <span class="type-label">Screen</span>
          </button>
          <button class="type-btn ${this.recordingType === 'camera' ? 'active' : ''}" data-type="camera">
            <span class="type-icon">📷</span>
            <span class="type-label">Webcam</span>
          </button>
          <button class="type-btn ${this.recordingType === 'both' ? 'active' : ''}" data-type="both">
            <span class="type-icon">⊕</span>
            <span class="type-label">Screen + Cam</span>
          </button>
          <button class="type-btn ${this.recordingType === 'audio' ? 'active' : ''}" data-type="audio">
            <span class="type-icon">🎤</span>
            <span class="type-label">Audio</span>
          </button>
        </div>

        <div class="recorder-preview-area">
          <div class="preview-viewport">
            ${this.recordingType === 'screen' ? `
              <div class="screen-preview">
                <div class="preview-placeholder">
                  <span class="placeholder-icon">🖥</span>
                  <span class="placeholder-text">Select screen to record</span>
                </div>
              </div>
            ` : this.recordingType === 'camera' ? `
              <div class="camera-preview">
                ${this.includeWebcam ? `
                  <video class="webcam-feed" autoplay muted playsinline></video>
                ` : `
                  <div class="preview-placeholder">
                    <span class="placeholder-icon">📷</span>
                    <span class="placeholder-text">Camera preview</span>
                  </div>
                `}
              </div>
            ` : this.recordingType === 'both' ? `
              <div class="combined-preview">
                <div class="screen-area">
                  <div class="preview-placeholder">
                    <span>Screen</span>
                  </div>
                </div>
                ${this.includeWebcam ? `
                  <div class="webcam-overlay">
                    <video class="webcam-feed" autoplay muted playsinline></video>
                  </div>
                ` : ''}
              </div>
            ` : `
              <div class="audio-preview">
                <div class="audio-icon">🎤</div>
                <div class="audio-waveform-placeholder">∿∿∿∿∿</div>
              </div>
            `}

            ${this.isRecording ? `
              <div class="recording-status">
                <div class="rec-indicator">
                  <span class="rec-dot"></span>
                  <span class="rec-label">REC</span>
                </div>
                <span class="rec-time">${this.formatTime(this.recordingTime)}</span>
              </div>
            ` : ''}
          </div>

          <div class="preview-controls">
            <button class="preview-toggle ${this.includeWebcam ? 'active' : ''}" data-action="toggle-webcam">
              <span>📷</span> Webcam
            </button>
          </div>
        </div>

        <div class="recorder-options">
          <div class="option-group">
            <label class="option-label">Quality</label>
            <div class="quality-options">
              ${QUALITY_OPTIONS.map(q => `
                <button class="quality-btn ${this.selectedQuality === q.id ? 'active' : ''}" data-quality="${q.id}">
                  <span class="quality-name">${q.name}</span>
                  ${q.resolution ? `<span class="quality-res">${q.resolution}</span>` : ''}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="option-group">
            <label class="option-label">Microphone</label>
            <select class="mic-select">
              ${MIC_OPTIONS.map(mic => `
                <option value="${mic.id}" ${this.selectedMic === mic.id ? 'selected' : ''}>${mic.label}</option>
              `).join('')}
            </select>
          </div>
        </div>

        ${this.recordedBlob ? `
          <div class="recording-preview">
            <h4>Recording Preview</h4>
            <video class="recorded-playback" src="${URL.createObjectURL(this.recordedBlob)}" controls></video>
            <div class="recording-actions">
              <button class="action-btn" data-action="discard">
                <span>🗑</span> Discard
              </button>
              <button class="action-btn" data-action="save">
                <span>💾</span> Save Recording
              </button>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="modal-footer recorder-footer">
        <div class="footer-left">
          ${!this.isRecording && !this.recordedBlob ? `
            <button class="modal-btn modal-btn-secondary" data-action="settings">
              <span>⚙</span> Settings
            </button>
          ` : ''}
        </div>
        <div class="footer-right">
          ${this.isRecording ? `
            <button class="modal-btn ${this.isPaused ? 'modal-btn-primary' : 'modal-btn-secondary'}" data-action="${this.isPaused ? 'resume' : 'pause'}">
              ${this.isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button class="modal-btn modal-btn-danger" data-action="stop">
              ⏹ Stop
            </button>
          ` : this.recordedBlob ? `
            <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
            <button class="modal-btn modal-btn-primary" data-action="use-recording">
              Use Recording
            </button>
          ` : `
            <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
            <button class="modal-btn modal-btn-primary" data-action="start" ${this.recordingType === 'screen' ? '' : ''}>
              ⏺ Start Recording
            </button>
          `}
        </div>
      </div>
    `;
  }

  formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  setupEventListeners() {
    super.setupEventListeners();

    this.overlay.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.recordingType = btn.dataset.type;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.quality-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedQuality = btn.dataset.quality;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    const micSelect = this.overlay.querySelector('.mic-select');
    if (micSelect) {
      micSelect.addEventListener('change', (e) => {
        this.selectedMic = e.target.value;
      });
    }

    this.overlay.querySelector('[data-action="toggle-webcam"]')?.addEventListener('click', () => {
      this.includeWebcam = !this.includeWebcam;
      this.updateBody(this.renderBody());
      this.setupEventListeners();
      if (this.includeWebcam) this.setupWebcam();
    });

    this.overlay.querySelector('[data-action="start"]')?.addEventListener('click', () => this.startRecording());
    this.overlay.querySelector('[data-action="pause"]')?.addEventListener('click', () => this.pauseRecording());
    this.overlay.querySelector('[data-action="resume"]')?.addEventListener('click', () => this.resumeRecording());
    this.overlay.querySelector('[data-action="stop"]')?.addEventListener('click', () => this.stopRecording());
    this.overlay.querySelector('[data-action="discard"]')?.addEventListener('click', () => this.discardRecording());
    this.overlay.querySelector('[data-action="save"]')?.addEventListener('click', () => this.saveRecording());
    this.overlay.querySelector('[data-action="use-recording"]')?.addEventListener('click', () => this.useRecording());
  }

  async setupWebcam() {
    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const webcamEl = this.overlay.querySelector('.webcam-feed');
      if (webcamEl) webcamEl.srcObject = this.webcamStream;
    } catch (err) {
      console.error('Webcam access denied:', err);
      this.includeWebcam = false;
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    }
  }

  async startRecording() {
    try {
      let stream = null;

      if (this.recordingType === 'screen' || this.recordingType === 'both') {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'monitor' },
          audio: false
        });
        stream = displayStream;
        this.screenStream = displayStream;

        displayStream.getVideoTracks()[0].onended = () => {
          if (this.isRecording) this.stopRecording();
        };
      }

      if (this.recordingType === 'camera' || this.recordingType === 'both') {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!stream) stream = camStream;
        else stream = this.mergeStreams(stream, camStream);
        this.webcamStream = camStream;
      }

      if (this.recordingType === 'audio') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      if (stream) {
        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: this.getMimeType()
        });

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.recordedChunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
          this.recordedBlob = new Blob(this.recordedChunks, { type: this.getMimeType() });
          this.isRecording = false;
          clearInterval(this.recordingInterval);
          this.updateBody(this.renderBody());
          this.setupEventListeners();
        };

        this.mediaRecorder.start(1000);
        this.isRecording = true;
        this.isPaused = false;
        this.recordingTime = 0;
        this.recordingInterval = setInterval(() => {
          if (!this.isPaused) {
            this.recordingTime++;
            const recTimeEl = this.overlay?.querySelector('.rec-time');
            if (recTimeEl) recTimeEl.textContent = this.formatTime(this.recordingTime);
          }
        }, 1000);

        this.updateBody(this.renderBody());
        this.setupEventListeners();
      }
    } catch (err) {
      console.error('Recording failed:', err);
    }
  }

  mergeStreams(stream1, stream2) {
    const combined = new MediaStream();
    stream1.getTracks().forEach(track => combined.addTrack(track));
    stream2.getTracks().forEach(track => combined.addTrack(track));
    return combined;
  }

  getMimeType() {
    if (this.recordingType === 'audio') return 'audio/webm';
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9';
    return 'video/webm';
  }

  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    }
  }

  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.stopAllStreams();
    }
  }

  stopAllStreams() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
    }
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => track.stop());
    }
  }

  discardRecording() {
    this.recordedBlob = null;
    this.recordedChunks = [];
    this.recordingTime = 0;
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  saveRecording() {
    if (this.recordedBlob) {
      const url = URL.createObjectURL(this.recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${Date.now()}.${this.recordingType === 'audio' ? 'webm' : 'webm'}`;
      a.click();
    }
  }

  useRecording() {
    if (this.recordedBlob) {
      this.onConfirm({
        action: 'recordingComplete',
        blob: this.recordedBlob,
        duration: this.recordingTime,
        type: this.recordingType,
        quality: this.selectedQuality
      });
      this.close();
    }
  }
}

export default RecorderModal;