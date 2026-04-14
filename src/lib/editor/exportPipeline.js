/**
 * Advanced Export Pipeline for Timeline Editor
 * Provides comprehensive export capabilities with multiple formats and quality settings
 */

export class ExportPipeline {
  constructor(timelineContainer, state) {
    this.timelineContainer = timelineContainer;
    this.state = state;
    this.exportPanel = null;
    this.isExporting = false;
    this.exportProgress = 0;
    this.exportWorker = null;

    this.initialize();
  }

  initialize() {
    this.createExportPanel();
    this.bindEvents();
  }

  createExportPanel() {
    const panel = document.createElement('div');
    panel.className = 'export-panel';
    panel.innerHTML = `
      <div class="export-header">
        <h3>Export Project</h3>
        <div class="export-tabs">
          <button class="export-tab active" data-tab="single">Single Export</button>
          <button class="export-tab" data-tab="batch">Batch Export</button>
          <button class="export-tab" data-tab="presets">Presets</button>
        </div>
      </div>

      <div class="tab-content active" data-tab="single">
        ${this.createSingleExportForm()}
      </div>

      <div class="tab-content" data-tab="batch">
        ${this.createBatchExportForm()}
      </div>

      <div class="tab-content" data-tab="presets">
        ${this.createPresetsPanel()}
      </div>

      <div class="export-progress" style="display: none;">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <div class="progress-text">Preparing export...</div>
        <button class="cancel-export-btn">Cancel</button>
      </div>

      <div class="export-actions">
        <button class="export-btn primary">Export</button>
        <button class="export-btn secondary">Queue Export</button>
      </div>
    `;

    this.exportPanel = panel;
    this.bindExportEvents();
    return panel;
  }

  createSingleExportForm() {
    return `
      <div class="export-form">
        <div class="form-section">
          <h4>Output Settings</h4>
          <div class="form-row">
            <label>Format</label>
            <select class="format-select">
              <option value="mp4">MP4 (H.264)</option>
              <option value="mov">QuickTime MOV</option>
              <option value="avi">AVI</option>
              <option value="webm">WebM</option>
              <option value="gif">Animated GIF</option>
            </select>
          </div>

          <div class="form-row">
            <label>Quality Preset</label>
            <select class="quality-select">
              <option value="draft">Draft (Fast)</option>
              <option value="good">Good (Balanced)</option>
              <option value="better">Better (High Quality)</option>
              <option value="best">Best (Maximum Quality)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div class="form-section custom-settings" style="display: none;">
          <h4>Custom Quality Settings</h4>
          <div class="form-row">
            <label>Resolution</label>
            <select class="resolution-select">
              <option value="720p">720p HD (1280x720)</option>
              <option value="1080p">1080p Full HD (1920x1080)</option>
              <option value="1440p">1440p QHD (2560x1440)</option>
              <option value="2160p">2160p 4K (3840x2160)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div class="form-row custom-resolution" style="display: none;">
            <label>Width</label>
            <input type="number" class="width-input" value="1920" min="320" max="7680">
            <label>Height</label>
            <input type="number" class="height-input" value="1080" min="240" max="4320">
          </div>

          <div class="form-row">
            <label>Frame Rate</label>
            <select class="framerate-select">
              <option value="24">24 fps (Film)</option>
              <option value="25">25 fps (PAL)</option>
              <option value="30">30 fps (NTSC)</option>
              <option value="60">60 fps (High Speed)</option>
            </select>
          </div>

          <div class="form-row">
            <label>Bitrate Mode</label>
            <select class="bitrate-mode-select">
              <option value="cbr">Constant Bitrate (CBR)</option>
              <option value="vbr">Variable Bitrate (VBR)</option>
            </select>
          </div>

          <div class="form-row bitrate-settings">
            <label>Target Bitrate</label>
            <input type="number" class="bitrate-input" value="8000" min="100" max="50000" step="100">
            <span class="bitrate-unit">kbps</span>
          </div>
        </div>

        <div class="form-section">
          <h4>Time Range</h4>
          <div class="form-row">
            <label>Export Range</label>
            <select class="range-select">
              <option value="entire">Entire Timeline</option>
              <option value="workarea">Work Area</option>
              <option value="selection">Selected Clips</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div class="form-row custom-range" style="display: none;">
            <label>Start Time</label>
            <input type="text" class="start-time-input" value="00:00:00:00" placeholder="HH:MM:SS:FF">
            <label>End Time</label>
            <input type="text" class="end-time-input" value="00:01:00:00" placeholder="HH:MM:SS:FF">
          </div>
        </div>

        <div class="form-section">
          <h4>Hardware Acceleration</h4>
          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" class="hardware-accel-checkbox" checked>
              Enable hardware acceleration
            </label>
          </div>
          <div class="form-row">
            <label>Encoder</label>
            <select class="encoder-select">
              <option value="auto">Auto-detect</option>
              <option value="nvenc">NVIDIA NVENC</option>
              <option value="amf">AMD AMF</option>
              <option value="qsv">Intel Quick Sync</option>
              <option value="software">Software (CPU)</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  createBatchExportForm() {
    return `
      <div class="batch-export-form">
        <div class="batch-queue"></div>
        <div class="batch-controls">
          <button class="add-to-queue-btn">Add to Queue</button>
          <button class="clear-queue-btn">Clear Queue</button>
          <button class="export-all-btn">Export All</button>
        </div>
        <div class="batch-settings">
          <div class="form-row">
            <label>Concurrent Exports</label>
            <input type="number" class="concurrent-input" value="1" min="1" max="4">
          </div>
          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" class="shutdown-checkbox">
              Shutdown when complete
            </label>
          </div>
        </div>
      </div>
    `;
  }

  createPresetsPanel() {
    return `
      <div class="presets-panel">
        <div class="preset-categories">
          <button class="preset-category active" data-category="social">Social Media</button>
          <button class="preset-category" data-category="web">Web</button>
          <button class="preset-category" data-category="broadcast">Broadcast</button>
          <button class="preset-category" data-category="mobile">Mobile</button>
        </div>
        <div class="preset-grid"></div>
      </div>
    `;
  }

  bindExportEvents() {
    // Quality preset change
    const qualitySelect = this.exportPanel.querySelector('.quality-select');
    qualitySelect.addEventListener('change', (e) => {
      const customSettings = this.exportPanel.querySelector('.custom-settings');
      customSettings.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });

    // Resolution change
    const resolutionSelect = this.exportPanel.querySelector('.resolution-select');
    resolutionSelect.addEventListener('change', (e) => {
      const customRes = this.exportPanel.querySelector('.custom-resolution');
      customRes.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });

    // Range change
    const rangeSelect = this.exportPanel.querySelector('.range-select');
    rangeSelect.addEventListener('change', (e) => {
      const customRange = this.exportPanel.querySelector('.custom-range');
      customRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });

    // Tab switching
    this.exportPanel.addEventListener('click', (e) => {
      if (e.target.classList.contains('export-tab')) {
        this.switchExportTab(e.target.dataset.tab);
      }
    });

    // Export buttons
    const exportBtn = this.exportPanel.querySelector('.export-btn.primary');
    exportBtn.addEventListener('click', () => this.startExport());

    const queueBtn = this.exportPanel.querySelector('.export-btn.secondary');
    queueBtn.addEventListener('click', () => this.queueExport());
  }

  switchExportTab(tabName) {
    const tabs = this.exportPanel.querySelectorAll('.export-tab');
    const contents = this.exportPanel.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    this.exportPanel.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    this.exportPanel.querySelector(`.tab-content[data-tab="${tabName}"]`).classList.add('active');
  }

  async startExport() {
    if (this.isExporting) return;

    this.isExporting = true;
    this.showProgress(true);

    try {
      const settings = this.getExportSettings();
      await this.performExport(settings);
    } catch (error) {
      console.error('Export failed:', error);
      this.showError('Export failed: ' + error.message);
    } finally {
      this.isExporting = false;
      this.showProgress(false);
    }
  }

  getExportSettings() {
    return {
      format: this.exportPanel.querySelector('.format-select').value,
      quality: this.exportPanel.querySelector('.quality-select').value,
      resolution: this.exportPanel.querySelector('.resolution-select').value,
      width: parseInt(this.exportPanel.querySelector('.width-input').value),
      height: parseInt(this.exportPanel.querySelector('.height-input').value),
      framerate: parseInt(this.exportPanel.querySelector('.framerate-select').value),
      bitrate: parseInt(this.exportPanel.querySelector('.bitrate-input').value),
      range: this.exportPanel.querySelector('.range-select').value,
      startTime: this.exportPanel.querySelector('.start-time-input').value,
      endTime: this.exportPanel.querySelector('.end-time-input').value,
      hardwareAccel: this.exportPanel.querySelector('.hardware-accel-checkbox').checked,
      encoder: this.exportPanel.querySelector('.encoder-select').value
    };
  }

  async performExport(settings) {
    // Initialize Web Worker for export processing
    this.exportWorker = new Worker('/src/lib/editor/exportWorker.js');

    return new Promise((resolve, reject) => {
      this.exportWorker.onmessage = (e) => {
        const { type, progress, result, error } = e.data;

        if (type === 'progress') {
          this.updateProgress(progress);
        } else if (type === 'complete') {
          resolve(result);
        } else if (type === 'error') {
          reject(new Error(error));
        }
      };

      this.exportWorker.postMessage({
        action: 'export',
        settings,
        timelineData: this.getTimelineData()
      });
    });
  }

  getTimelineData() {
    return {
      tracks: this.state.tracks,
      currentTime: this.state.currentTime,
      duration: this.state.duration,
      projectSettings: this.state.projectSettings
    };
  }

  showProgress(show) {
    const progressEl = this.exportPanel.querySelector('.export-progress');
    progressEl.style.display = show ? 'block' : 'none';

    if (!show) {
      this.exportProgress = 0;
      this.updateProgress(0);
    }
  }

  updateProgress(progress) {
    this.exportProgress = progress;
    const progressFill = this.exportPanel.querySelector('.progress-fill');
    const progressText = this.exportPanel.querySelector('.progress-text');

    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Exporting... ${progress}%`;
  }

  showError(message) {
    // Show error toast or notification
    const errorEl = document.createElement('div');
    errorEl.className = 'export-error';
    errorEl.textContent = message;
    this.exportPanel.appendChild(errorEl);

    setTimeout(() => errorEl.remove(), 5000);
  }

  queueExport() {
    const settings = this.getExportSettings();
    // Add to batch queue
    this.addToBatchQueue(settings);
  }

  addToBatchQueue(settings) {
    const queue = this.exportPanel.querySelector('.batch-queue');
    const queueItem = document.createElement('div');
    queueItem.className = 'queue-item';
    queueItem.innerHTML = `
      <div class="queue-info">
        <span class="queue-format">${settings.format.toUpperCase()}</span>
        <span class="queue-quality">${settings.quality}</span>
        <span class="queue-resolution">${settings.width}x${settings.height}</span>
      </div>
      <button class="remove-queue-btn">×</button>
    `;

    queue.appendChild(queueItem);
  }

  cancelExport() {
    if (this.exportWorker) {
      this.exportWorker.terminate();
      this.exportWorker = null;
    }
    this.isExporting = false;
    this.showProgress(false);
  }

  bindEvents() {
    // Cancel export button
    const cancelBtn = this.exportPanel.querySelector('.cancel-export-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelExport());
    }
  }

  // Export pipeline settings
  exportSettings() {
    return {
      defaultFormat: 'mp4',
      defaultQuality: 'good',
      hardwareAccel: true,
      concurrentExports: 1,
      presets: this.getDefaultPresets()
    };
  }

  getDefaultPresets() {
    return {
      social: {
        youtube: { format: 'mp4', width: 1920, height: 1080, framerate: 30 },
        instagram: { format: 'mp4', width: 1080, height: 1080, framerate: 30 },
        tiktok: { format: 'mp4', width: 1080, height: 1920, framerate: 30 }
      },
      web: {
        web_hd: { format: 'webm', width: 1920, height: 1080, framerate: 30 },
        web_sd: { format: 'webm', width: 1280, height: 720, framerate: 24 }
      },
      broadcast: {
        hdtv: { format: 'mov', width: 1920, height: 1080, framerate: 30 },
        uhd: { format: 'mov', width: 3840, height: 2160, framerate: 60 }
      }
    };
  }
}
