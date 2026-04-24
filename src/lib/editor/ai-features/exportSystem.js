export const EXPORT_PRESETS = {
  DRAFT: { id: 'draft', label: 'Draft', resolution: '720p', fps: 24 },
  STANDARD: { id: 'standard', label: 'Standard', resolution: '1080p', fps: 30 },
  HIGH: { id: 'high', label: 'High Quality', resolution: '4K', fps: 60 }
};

export const ASPECT_RATIOS = {
  '16:9': { label: '16:9 (Landscape)', width: 1920, height: 1080 },
  '4:3': { label: '4:3 (Standard)', width: 1440, height: 1080 },
  '21:9': { label: '21:9 (Cinematic)', width: 2560, height: 1080 },
  '1:1': { label: '1:1 (Square)', width: 1080, height: 1080 },
  '9:16': { label: '9:16 (Vertical)', width: 1080, height: 1920 }
};

export class ExportSystem {
  constructor(timelineState) {
    this.state = timelineState;
    this.currentPreset = EXPORT_PRESETS.STANDARD;
    this.currentAspectRatio = ASPECT_RATIOS['16:9'];
    this.modal = null;
  }

  init(container) {
    this.container = container;
    this.renderExportButton();
    return this;
  }

  renderExportButton() {
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.innerHTML = '📤 Export';
    btn.title = 'Export timeline to video file';
    btn.addEventListener('click', () => this.showExportModal());

    this.container.appendChild(btn);
  }

  showExportModal() {
    this.closeModal();

    const modal = document.createElement('div');
    modal.className = 'export-modal';
    modal.innerHTML = `
      <div class="modal-header">
        <h3>Export Timeline</h3>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-body">
        <div class="export-preview">
          <div class="preview-info">
            <span class="preview-duration">Duration: ${this.formatDuration()}</span>
            <span class="preview-clips">Clips: ${this.state.clips?.length || 0}</span>
          </div>
        </div>

        <div class="form-group">
          <label>Quality Preset</label>
          <div class="preset-grid">
            ${Object.values(EXPORT_PRESETS).map(preset => `
              <button class="preset-btn ${preset.id === this.currentPreset.id ? 'active' : ''}" data-preset="${preset.id}">
                <span class="preset-label">${preset.label}</span>
                <span class="preset-detail">${preset.resolution} @ ${preset.fps}fps</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label>Aspect Ratio</label>
          <select id="export-aspect">
            ${Object.entries(ASPECT_RATIOS).map(([key, ar]) => `
              <option value="${key}" ${key === '16:9' ? 'selected' : ''}>${ar.label}</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Format</label>
          <select id="export-format">
            <option value="mp4">MP4 (H.264)</option>
            <option value="webm">WebM (VP9)</option>
            <option value="mov">MOV (ProRes)</option>
          </select>
        </div>

        <div class="export-progress" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">Exporting... 0%</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-export">Export Video</button>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;
    this.setupModalEvents(modal);
  }

  setupModalEvents(modal) {
    modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
    modal.querySelector('.btn-cancel').addEventListener('click', () => this.closeModal());

    modal.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => this.selectPreset(btn.dataset.preset));
    });

    modal.querySelector('#export-aspect').addEventListener('change', (e) => {
      this.currentAspectRatio = ASPECT_RATIOS[e.target.value];
    });

    modal.querySelector('.btn-export').addEventListener('click', () => this.startExport());
  }

  selectPreset(presetId) {
    this.currentPreset = EXPORT_PRESETS[presetId.toUpperCase()] || EXPORT_PRESETS.STANDARD;

    const btns = this.modal.querySelectorAll('.preset-btn');
    btns.forEach(btn => btn.classList.toggle('active', btn.dataset.preset === presetId));
  }

  async startExport() {
    const exportBtn = this.modal.querySelector('.btn-export');
    const progressEl = this.modal.querySelector('.export-progress');
    const progressFill = progressEl.querySelector('.progress-fill');
    const progressText = progressEl.querySelector('.progress-text');

    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting...';
    progressEl.style.display = 'block';

    try {
      const timelineData = this.prepareTimelineData();

      for (let i = 0; i <= 100; i += 5) {
        await this.delay(100);
        progressFill.style.width = `${i}%`;
        progressText.textContent = `Exporting... ${i}%`;
      }

      const result = await this.executeExport(timelineData);
      this.showExportSuccess(result);
    } catch (error) {
      this.showExportError(error.message);
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export Video';
    }
  }

  prepareTimelineData() {
    return {
      clips: this.state.clips || [],
      preset: this.currentPreset,
      aspectRatio: this.currentAspectRatio,
      duration: this.calculateDuration()
    };
  }

  async executeExport(timelineData) {
    console.log('Executing export with:', timelineData);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          outputUrl: URL.createObjectURL(new Blob(['video'], { type: 'video/mp4' })),
          fileSize: '125 MB',
          duration: timelineData.duration
        });
      }, 3000);
    });
  }

  calculateDuration() {
    const clips = this.state.clips || [];
    if (clips.length === 0) return 0;

    const maxEnd = Math.max(...clips.map(c => c.endTime || c.startTime + c.duration));
    return maxEnd;
  }

  formatDuration() {
    const seconds = this.calculateDuration();
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  showExportSuccess(result) {
    const toast = document.createElement('div');
    toast.className = 'export-toast success';
    toast.innerHTML = `
      <span>Export complete!</span>
      <a href="${result.outputUrl}" download>Download Video</a>
    `;
    this.showToast(toast);
    this.closeModal();
  }

  showExportError(message) {
    const toast = document.createElement('div');
    toast.className = 'export-toast error';
    toast.textContent = `Export failed: ${message}`;
    this.showToast(toast);
  }

  showToast(toast) {
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    toast.style.color = 'white';
    toast.style.zIndex = '10000';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  closeModal() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
      this.modal = null;
    }
  }

  destroy() {
    this.closeModal();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export function createExportSystem(timelineState, container) {
  return new ExportSystem(timelineState).init(container);
}