import { BaseModal } from './BaseModal';

const TABS = ['General', 'Audio', 'Video', 'Keyboard', 'Export'];

const KEYBOARD_SHORTCUTS = {
  'Playback': [
    { action: 'Play/Pause', keys: ['Space'] },
    { action: 'Skip Forward', keys: ['→'] },
    { action: 'Skip Backward', keys: ['←'] },
    { action: 'Jump to Start', keys: ['Home'] },
    { action: 'Jump to End', keys: ['End'] }
  ],
  'Editing': [
    { action: 'Undo', keys: ['Ctrl', 'Z'] },
    { action: 'Redo', keys: ['Ctrl', 'Y'] },
    { action: 'Cut', keys: ['Ctrl', 'X'] },
    { action: 'Copy', keys: ['Ctrl', 'C'] },
    { action: 'Paste', keys: ['Ctrl', 'V'] },
    { action: 'Delete', keys: ['Delete'] },
    { action: 'Duplicate', keys: ['Ctrl', 'D'] }
  ],
  'Timeline': [
    { action: 'Zoom In', keys: ['+', '='] },
    { action: 'Zoom Out', keys: ['-'] },
    { action: 'Split Clip', keys: ['S'] },
    { action: 'Add Track', keys: ['Ctrl', 'T'] }
  ],
  'Export': [
    { action: 'Export', keys: ['Ctrl', 'E'] },
    { action: 'Quick Export', keys: ['Ctrl', 'Shift', 'E'] }
  ]
};

const VIDEO_RESOLUTIONS = [
  { id: '4k', label: '4K (3840×2160)', aspect: '16:9' },
  { id: '1080p', label: 'Full HD (1920×1080)', aspect: '16:9' },
  { id: '720p', label: 'HD (1280×720)', aspect: '16:9' },
  { id: '480p', label: 'SD (854×480)', aspect: '16:9' },
  { id: '9:16', label: 'Vertical (1080×1920)', aspect: '9:16' },
  { id: '1:1', label: 'Square (1080×1080)', aspect: '1:1' }
];

const AUDIO_SAMPLE_RATES = ['44.1 kHz', '48 kHz', '96 kHz'];

export class SettingsModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Settings',
      size: 'large',
      showFooter: false,
      ...options
    });

    this.activeTab = 'General';
    this.generalSettings = {
      theme: 'dark',
      language: 'en',
      autoSave: true,
      autoSaveInterval: 5,
      showTooltips: true,
      showWaveform: true
    };
    this.audioSettings = {
      inputDevice: 'default',
      outputDevice: 'default',
      sampleRate: '48 kHz',
      normalizeAudio: true,
      noiseReduction: false,
      echoCancellation: true
    };
    this.videoSettings = {
      gpuAcceleration: true,
      hardwareDecoding: true,
      previewQuality: 'high',
      renderQuality: 'high',
      defaultResolution: '1080p'
    };
    this.exportSettings = {
      format: 'mp4',
      codec: 'h264',
      quality: 'high',
      audioBitrate: '320 kbps',
      videoBitrate: '10 Mbps'
    };
  }

  renderBody() {
    return `
      <div class="settings-container">
        <div class="settings-sidebar">
          <nav class="settings-nav">
            ${TABS.map(tab => `
              <button class="nav-item ${this.activeTab === tab ? 'active' : ''}" data-tab="${tab}">
                ${this.getTabIcon(tab)}
                <span>${tab}</span>
              </button>
            `).join('')}
          </nav>
        </div>

        <div class="settings-content">
          <div class="settings-panel" data-panel="General" style="display: ${this.activeTab === 'General' ? 'block' : 'none'}">
            <div class="settings-section">
              <h3>Appearance</h3>
              <div class="setting-row">
                <label class="setting-label">Theme</label>
                <div class="theme-options">
                  <button class="theme-btn ${this.generalSettings.theme === 'dark' ? 'active' : ''}" data-theme="dark">
                    <span class="theme-preview dark"></span>
                    <span>Dark</span>
                  </button>
                  <button class="theme-btn ${this.generalSettings.theme === 'light' ? 'active' : ''}" data-theme="light">
                    <span class="theme-preview light"></span>
                    <span>Light</span>
                  </button>
                  <button class="theme-btn ${this.generalSettings.theme === 'system' ? 'active' : ''}" data-theme="system">
                    <span class="theme-preview system"></span>
                    <span>System</span>
                  </button>
                </div>
              </div>
              <div class="setting-row">
                <label class="setting-label">Language</label>
                <select class="setting-select">
                  <option value="en" selected>English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
            </div>

            <div class="settings-section">
              <h3>Editor</h3>
              <div class="setting-row">
                <label class="setting-label">Auto-Save</label>
                <label class="toggle-switch">
                  <input type="checkbox" ${this.generalSettings.autoSave ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              ${this.generalSettings.autoSave ? `
                <div class="setting-row sub-setting">
                  <label class="setting-label">Auto-Save Interval</label>
                  <select class="setting-select compact">
                    <option value="1" ${this.generalSettings.autoSaveInterval === 1 ? 'selected' : ''}>1 minute</option>
                    <option value="3" ${this.generalSettings.autoSaveInterval === 3 ? 'selected' : ''}>3 minutes</option>
                    <option value="5" ${this.generalSettings.autoSaveInterval === 5 ? 'selected' : ''}>5 minutes</option>
                    <option value="10" ${this.generalSettings.autoSaveInterval === 10 ? 'selected' : ''}>10 minutes</option>
                  </select>
                </div>
              ` : ''}
              <div class="setting-row">
                <label class="setting-label">Show Tooltips</label>
                <label class="toggle-switch">
                  <input type="checkbox" ${this.generalSettings.showTooltips ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="setting-row">
                <label class="setting-label">Show Waveform</label>
                <label class="toggle-switch">
                  <input type="checkbox" ${this.generalSettings.showWaveform ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="settings-panel" data-panel="Audio" style="display: ${this.activeTab === 'Audio' ? 'block' : 'none'}">
            <div class="settings-section">
              <h3>Audio Devices</h3>
              <div class="setting-row">
                <label class="setting-label">Input Device</label>
                <select class="setting-select">
                  <option value="default" selected>System Default</option>
                  <option value="builtin">Built-in Microphone</option>
                  <option value="usb">External USB Microphone</option>
                </select>
              </div>
              <div class="setting-row">
                <label class="setting-label">Output Device</label>
                <select class="setting-select">
                  <option value="default" selected>System Default</option>
                  <option value="speakers">Built-in Speakers</option>
                  <option value="headphones">Headphones</option>
                </select>
              </div>
              <div class="setting-row">
                <label class="setting-label">Sample Rate</label>
                <select class="setting-select">
                  ${AUDIO_SAMPLE_RATES.map(rate => `
                    <option value="${rate}" ${this.audioSettings.sampleRate === rate ? 'selected' : ''}>${rate}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="settings-section">
              <h3>Audio Processing</h3>
              <div class="setting-row">
                <label class="setting-label">Normalize Audio</label>
                <label class="toggle-switch">
                  <input type="checkbox" ${this.audioSettings.normalizeAudio ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="setting-row">
                <label class="setting-label">Noise Reduction</label>
                <label class="toggle-switch">
                  <input type="checkbox" ${this.audioSettings.noiseReduction ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="setting-row">
                <label class="setting-label">Echo Cancellation</label>
                <label class="toggle-switch">
                  <input type="checkbox" ${this.audioSettings.echoCancellation ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="settings-panel" data-panel="Video" style="display: ${this.activeTab === 'Video' ? 'block' : 'none'}">
            <div class="settings-section">
              <h3>Performance</h3>
              <div class="setting-row">
                <label class="setting-label">GPU Acceleration</label>
                <label class="toggle-switch">
                  <input type="checkbox" ${this.videoSettings.gpuAcceleration ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="setting-row">
                <label class="setting-label">Hardware Decoding</label>
                <label class="toggle-switch">
                  <input type="checkbox" ${this.videoSettings.hardwareDecoding ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="settings-section">
              <h3>Quality</h3>
              <div class="setting-row">
                <label class="setting-label">Preview Quality</label>
                <select class="setting-select">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high" selected>High</option>
                </select>
              </div>
              <div class="setting-row">
                <label class="setting-label">Render Quality</label>
                <select class="setting-select">
                  <option value="standard">Standard</option>
                  <option value="high" selected>High</option>
                  <option value="maximum">Maximum</option>
                </select>
              </div>
              <div class="setting-row">
                <label class="setting-label">Default Resolution</label>
                <select class="setting-select">
                  ${VIDEO_RESOLUTIONS.map(res => `
                    <option value="${res.id}" ${this.videoSettings.defaultResolution === res.id ? 'selected' : ''}>${res.label}</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>

          <div class="settings-panel" data-panel="Keyboard" style="display: ${this.activeTab === 'Keyboard' ? 'block' : 'none'}">
            <div class="settings-section">
              <div class="shortcuts-header">
                <h3>Keyboard Shortcuts</h3>
                <button class="text-btn">Reset to Defaults</button>
              </div>
              ${Object.entries(KEYBOARD_SHORTCUTS).map(([category, shortcuts]) => `
                <div class="shortcut-category">
                  <h4>${category}</h4>
                  <div class="shortcut-list">
                    ${shortcuts.map(shortcut => `
                      <div class="shortcut-row">
                        <span class="shortcut-action">${shortcut.action}</span>
                        <div class="shortcut-keys">
                          ${shortcut.keys.map(key => `<kbd class="key">${key}</kbd>`).join('')}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="settings-panel" data-panel="Export" style="display: ${this.activeTab === 'Export' ? 'block' : 'none'}">
            <div class="settings-section">
              <h3>Video Format</h3>
              <div class="format-options">
                <button class="format-btn ${this.exportSettings.format === 'mp4' ? 'active' : ''}" data-format="mp4">
                  <span class="format-icon">🎬</span>
                  <span class="format-name">MP4</span>
                  <span class="format-desc">Most compatible</span>
                </button>
                <button class="format-btn ${this.exportSettings.format === 'webm' ? 'active' : ''}" data-format="webm">
                  <span class="format-icon">🌐</span>
                  <span class="format-name">WebM</span>
                  <span class="format-desc">Smaller size</span>
                </button>
                <button class="format-btn ${this.exportSettings.format === 'mov' ? 'active' : ''}" data-format="mov">
                  <span class="format-icon">🍎</span>
                  <span class="format-name">MOV</span>
                  <span class="format-desc">Pro quality</span>
                </button>
              </div>
            </div>

            <div class="settings-section">
              <h3>Quality Presets</h3>
              <div class="quality-options">
                <button class="quality-btn ${this.exportSettings.quality === 'low' ? 'active' : ''}" data-quality="low">
                  <span class="quality-label">Low</span>
                  <span class="quality-size">~50 MB/min</span>
                </button>
                <button class="quality-btn ${this.exportSettings.quality === 'medium' ? 'active' : ''}" data-quality="medium">
                  <span class="quality-label">Medium</span>
                  <span class="quality-size">~100 MB/min</span>
                </button>
                <button class="quality-btn ${this.exportSettings.quality === 'high' ? 'active' : ''}" data-quality="high">
                  <span class="quality-label">High</span>
                  <span class="quality-size">~200 MB/min</span>
                </button>
                <button class="quality-btn ${this.exportSettings.quality === 'max' ? 'active' : ''}" data-quality="max">
                  <span class="quality-label">Maximum</span>
                  <span class="quality-size">~500 MB/min</span>
                </button>
              </div>
            </div>

            <div class="settings-section">
              <h3>Advanced</h3>
              <div class="setting-row">
                <label class="setting-label">Audio Bitrate</label>
                <select class="setting-select">
                  <option value="128">128 kbps</option>
                  <option value="192">192 kbps</option>
                  <option value="256">256 kbps</option>
                  <option value="320" selected>320 kbps</option>
                </select>
              </div>
              <div class="setting-row">
                <label class="setting-label">Video Bitrate</label>
                <select class="setting-select">
                  <option value="5">5 Mbps</option>
                  <option value="10" selected>10 Mbps</option>
                  <option value="20">20 Mbps</option>
                  <option value="50">50 Mbps</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer settings-footer">
        <div class="footer-left">
          <button class="modal-btn modal-btn-secondary" data-action="reset">
            Reset All Settings
          </button>
        </div>
        <div class="footer-right">
          <button class="modal-btn modal-btn-secondary modal-cancel">Cancel</button>
          <button class="modal-btn modal-btn-primary" data-action="save">
            Save Settings
          </button>
        </div>
      </div>
    `;
  }

  getTabIcon(tab) {
    const icons = {
      'General': '⚙',
      'Audio': '🔊',
      'Video': '🎥',
      'Keyboard': '⌨',
      'Export': '📤'
    };
    return `<span class="tab-icon">${icons[tab]}</span>`;
  }

  setupEventListeners() {
    super.setupEventListeners();

    this.overlay.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this.activeTab = item.dataset.tab;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.generalSettings.theme = btn.dataset.theme;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const section = e.target.closest('.settings-panel');
        if (section) {
          const label = e.target.closest('.setting-row')?.querySelector('.setting-label')?.textContent;
          if (label) {
            if (label.includes('Auto-Save')) this.generalSettings.autoSave = e.target.checked;
            else if (label.includes('Tooltip')) this.generalSettings.showTooltips = e.target.checked;
            else if (label.includes('Waveform')) this.generalSettings.showWaveform = e.target.checked;
            else if (label.includes('GPU')) this.videoSettings.gpuAcceleration = e.target.checked;
            else if (label.includes('Hardware')) this.videoSettings.hardwareDecoding = e.target.checked;
            else if (label.includes('Normalize')) this.audioSettings.normalizeAudio = e.target.checked;
            else if (label.includes('Noise')) this.audioSettings.noiseReduction = e.target.checked;
            else if (label.includes('Echo')) this.audioSettings.echoCancellation = e.target.checked;
          }
        }
      });
    });

    this.overlay.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.exportSettings.format = btn.dataset.format;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.quality-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.exportSettings.quality = btn.dataset.quality;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
      this.generalSettings = { theme: 'dark', language: 'en', autoSave: true, autoSaveInterval: 5, showTooltips: true, showWaveform: true };
      this.audioSettings = { inputDevice: 'default', outputDevice: 'default', sampleRate: '48 kHz', normalizeAudio: true, noiseReduction: false, echoCancellation: true };
      this.videoSettings = { gpuAcceleration: true, hardwareDecoding: true, previewQuality: 'high', renderQuality: 'high', defaultResolution: '1080p' };
      this.exportSettings = { format: 'mp4', codec: 'h264', quality: 'high', audioBitrate: '320 kbps', videoBitrate: '10 Mbps' };
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    });

    this.overlay.querySelector('[data-action="save"]')?.addEventListener('click', () => {
      this.onConfirm({
        action: 'settingsSaved',
        general: this.generalSettings,
        audio: this.audioSettings,
        video: this.videoSettings,
        export: this.exportSettings
      });
      this.close();
    });
  }
}

export default SettingsModal;