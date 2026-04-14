/**
 * Color Correction System for Timeline Editor
 * Provides comprehensive color grading tools integrated with keyframe animation
 */

import { KeyframeSystem, ANIMATION_PROPERTIES } from './keyframeSystem.js';

export class ColorCorrectionSystem {
  constructor(timelineContainer, state, keyframeSystem) {
    this.timelineContainer = timelineContainer;
    this.state = state;
    this.keyframeSystem = keyframeSystem;
    this.selectedClipId = null;
    this.colorCorrectionPanel = null;
    this.colorScopes = null;
    this.lutManager = new LUTManager();
    this.curveEditor = null;
    this.levelsEditor = null;
    this.colorScopesRenderer = null;

    this.initialize();
  }

  initialize() {
    this.createColorCorrectionPanel();
    this.createColorScopes();
    this.bindEvents();
  }

  createColorCorrectionPanel() {
    const panel = document.createElement('div');
    panel.className = 'color-correction-panel';
    panel.innerHTML = `
      <div class="color-panel-header">
        <h3>Color Correction</h3>
        <div class="panel-tabs">
          <button class="tab-btn active" data-tab="basic">Basic</button>
          <button class="tab-btn" data-tab="curves">Curves</button>
          <button class="tab-btn" data-tab="wheels">Wheels</button>
          <button class="tab-btn" data-tab="lut">LUT</button>
        </div>
      </div>

      <div class="tab-content active" data-tab="basic">
        ${this.createBasicAdjustmentsHTML()}
      </div>

      <div class="tab-content" data-tab="curves">
        ${this.createCurvesEditorHTML()}
      </div>

      <div class="tab-content" data-tab="wheels">
        ${this.createColorWheelsHTML()}
      </div>

      <div class="tab-content" data-tab="lut">
        ${this.createLUTPanelHTML()}
      </div>

      <div class="color-presets">
        <button class="preset-btn" data-preset="neutral">Reset</button>
        <button class="preset-btn" data-preset="warm">Warm</button>
        <button class="preset-btn" data-preset="cool">Cool</button>
        <button class="preset-btn" data-preset="vintage">Vintage</button>
        <button class="preset-btn" data-preset="cinematic">Cinematic</button>
      </div>
    `;

    this.colorCorrectionPanel = panel;
    this.bindPanelEvents();
    return panel;
  }

  createBasicAdjustmentsHTML() {
    return `
      <div class="adjustment-group">
        <h4>Exposure & Tone</h4>
        <div class="slider-row">
          <label>Brightness</label>
          <input type="range" class="color-slider" data-property="brightness" min="0" max="200" step="1">
          <span class="value-display">100%</span>
        </div>
        <div class="slider-row">
          <label>Contrast</label>
          <input type="range" class="color-slider" data-property="contrast" min="0" max="200" step="1">
          <span class="value-display">100%</span>
        </div>
        <div class="slider-row">
          <label>Gamma</label>
          <input type="range" class="color-slider" data-property="gamma" min="0.1" max="4" step="0.1">
          <span class="value-display">1.0</span>
        </div>
      </div>

      <div class="adjustment-group">
        <h4>Levels</h4>
        <div class="levels-editor">
          <div class="histogram-container">
            <canvas class="histogram-canvas" width="256" height="80"></canvas>
            <div class="levels-markers">
              <div class="input-black-marker" data-type="input-black"></div>
              <div class="input-gamma-marker" data-type="input-gamma"></div>
              <div class="input-white-marker" data-type="input-white"></div>
              <div class="output-black-marker" data-type="output-black"></div>
              <div class="output-white-marker" data-type="output-white"></div>
            </div>
          </div>
          <div class="levels-values">
            <div class="input-levels">
              <label>Input:</label>
              <input type="number" class="input-black" min="0" max="255" value="0">
              <input type="number" class="input-gamma" min="0.1" max="10" step="0.1" value="1.0">
              <input type="number" class="input-white" min="0" max="255" value="255">
            </div>
            <div class="output-levels">
              <label>Output:</label>
              <input type="number" class="output-black" min="0" max="255" value="0">
              <input type="number" class="output-white" min="0" max="255" value="255">
            </div>
          </div>
          <button class="auto-levels-btn">Auto Levels</button>
        </div>
      </div>

      <div class="adjustment-group">
        <h4>Color</h4>
        <div class="slider-row">
          <label>Saturation</label>
          <input type="range" class="color-slider" data-property="saturation" min="0" max="200" step="1">
          <span class="value-display">100%</span>
        </div>
        <div class="slider-row">
          <label>Hue</label>
          <input type="range" class="color-slider" data-property="hue" min="-180" max="180" step="1">
          <span class="value-display">0°</span>
        </div>
        <div class="slider-row">
          <label>Vibrance</label>
          <input type="range" class="color-slider" data-property="vibrance" min="-100" max="100" step="1">
          <span class="value-display">0</span>
        </div>
      </div>

      <div class="adjustment-group">
        <h4>White Balance</h4>
        <div class="slider-row">
          <label>Temperature</label>
          <input type="range" class="color-slider" data-property="temperature" min="2000" max="12000" step="50">
          <span class="value-display">6500K</span>
        </div>
        <div class="slider-row">
          <label>Tint</label>
          <input type="range" class="color-slider" data-property="tint" min="-50" max="50" step="1">
          <span class="value-display">0</span>
        </div>
      </div>

      <div class="adjustment-group">
        <h4>RGB Channels</h4>
        <div class="rgb-controls">
          <div class="channel-control">
            <label>Red Gain</label>
            <input type="range" class="color-slider" data-property="redGain" min="0" max="200" step="1">
            <span class="value-display">100%</span>
          </div>
          <div class="channel-control">
            <label>Green Gain</label>
            <input type="range" class="color-slider" data-property="greenGain" min="0" max="200" step="1">
            <span class="value-display">100%</span>
          </div>
          <div class="channel-control">
            <label>Blue Gain</label>
            <input type="range" class="color-slider" data-property="blueGain" min="0" max="200" step="1">
            <span class="value-display">100%</span>
          </div>
        </div>
      </div>
    `;
  }

  createCurvesEditorHTML() {
    return `
      <div class="curves-editor">
        <div class="curve-tabs">
          <button class="curve-tab active" data-curve="rgb">RGB</button>
          <button class="curve-tab" data-curve="red">Red</button>
          <button class="curve-tab" data-curve="green">Green</button>
          <button class="curve-tab" data-curve="blue">Blue</button>
          <button class="curve-tab" data-curve="luma">Luma</button>
        </div>
        <div class="curve-canvas-container">
          <canvas class="curve-canvas" width="256" height="256"></canvas>
          <div class="curve-grid"></div>
          <div class="curve-histogram"></div>
        </div>
        <div class="curve-controls">
          <button class="curve-reset-btn">Reset Curve</button>
          <button class="curve-invert-btn">Invert</button>
          <button class="curve-linear-btn">Linear</button>
          <input type="range" class="curve-spline-tension" min="0" max="1" step="0.1" value="0.5" title="Spline Tension">
        </div>
        <div class="curve-info">
          <div class="curve-input">Input: <span class="input-value">0</span></div>
          <div class="curve-output">Output: <span class="output-value">0</span></div>
        </div>
      </div>
    `;
  }

  createColorWheelsHTML() {
    return `
      <div class="color-wheels">
        <div class="wheel-group">
          <h4>Lift (Shadows)</h4>
          <div class="color-wheel" data-wheel="lift">
            <canvas class="wheel-canvas" width="120" height="120"></canvas>
            <div class="wheel-indicator"></div>
          </div>
        </div>
        <div class="wheel-group">
          <h4>Gamma (Midtones)</h4>
          <div class="color-wheel" data-wheel="gamma">
            <canvas class="wheel-canvas" width="120" height="120"></canvas>
            <div class="wheel-indicator"></div>
          </div>
        </div>
        <div class="wheel-group">
          <h4>Gain (Highlights)</h4>
          <div class="color-wheel" data-wheel="gain">
            <canvas class="wheel-canvas" width="120" height="120"></canvas>
            <div class="wheel-indicator"></div>
          </div>
        </div>
      </div>
    `;
  }

  createLUTPanelHTML() {
    return `
      <div class="lut-panel">
        <div class="lut-browser">
          <h4>LUT Library</h4>
          <div class="lut-categories">
            <button class="lut-category active" data-category="film">Film</button>
            <button class="lut-category" data-category="video">Video</button>
            <button class="lut-category" data-category="cinematic">Cinematic</button>
            <button class="lut-category" data-category="custom">Custom</button>
          </div>
          <div class="lut-grid">
            <!-- LUT thumbnails will be populated here -->
          </div>
        </div>
        <div class="lut-controls">
          <div class="slider-row">
            <label>Strength</label>
            <input type="range" class="lut-slider" data-property="lutStrength" min="0" max="100" step="1">
            <span class="value-display">100%</span>
          </div>
          <button class="lut-load-btn">Load LUT File</button>
          <input type="file" class="lut-file-input" accept=".cube,.3dl" style="display: none;">
        </div>
      </div>
    `;
  }

  createColorScopes() {
    const scopesContainer = document.createElement('div');
    scopesContainer.className = 'color-scopes-container';
    scopesContainer.innerHTML = `
      <div class="scopes-header">
        <h4>Color Scopes</h4>
        <div class="scope-tabs">
          <button class="scope-tab active" data-scope="waveform">Waveform</button>
          <button class="scope-tab" data-scope="vectorscope">Vectorscope</button>
          <button class="scope-tab" data-scope="rgb-histogram">RGB Histogram</button>
          <button class="scope-tab" data-scope="parade">Parade</button>
        </div>
        <div class="scope-controls">
          <label class="checkbox-label">
            <input type="checkbox" class="scope-overlay-checkbox" checked>
            Show on preview
          </label>
          <select class="scope-intensity-select">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div class="scope-display">
        <canvas class="scope-canvas" width="400" height="200"></canvas>
        <div class="scope-grid"></div>
        <div class="scope-info">
          <div class="scope-readout"></div>
        </div>
      </div>
    `;

    this.colorScopes = scopesContainer;
    this.initializeColorScopesRenderer();
    return scopesContainer;
  }

  initializeColorScopesRenderer() {
    this.colorScopesRenderer = new ColorScopesRenderer(this.colorScopes.querySelector('.scope-canvas'));
  }

  bindPanelEvents() {
    // Tab switching
    const tabs = this.colorCorrectionPanel.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Slider controls
    const sliders = this.colorCorrectionPanel.querySelectorAll('.color-slider');
    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        this.updateColorProperty(e.target.dataset.property, parseFloat(e.target.value));
        this.updateValueDisplay(e.target);
      });
    });

    // Preset buttons
    const presets = this.colorCorrectionPanel.querySelectorAll('.preset-btn');
    presets.forEach(preset => {
      preset.addEventListener('click', () => {
        this.applyPreset(preset.dataset.preset);
      });
    });

    // LUT controls
    const lutLoadBtn = this.colorCorrectionPanel.querySelector('.lut-load-btn');
    const lutFileInput = this.colorCorrectionPanel.querySelector('.lut-file-input');
    lutLoadBtn.addEventListener('click', () => lutFileInput.click());
    lutFileInput.addEventListener('change', (e) => this.loadLUTFile(e.target.files[0]));
  }

  bindScopeEvents() {
    const scopeTabs = this.colorScopes.querySelectorAll('.scope-tab');
    scopeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const scopeType = tab.dataset.scope;
        this.switchScope(scopeType);
      });
    });
  }

  bindEvents() {
    // Listen for clip selection changes
    document.addEventListener('clipSelected', (e) => {
      this.selectedClipId = e.detail.clipId;
      this.updatePanelValues();
    });

    // Listen for timeline changes
    document.addEventListener('playheadChanged', () => {
      this.updatePanelValues();
      this.updateScopes();
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    const tabs = this.colorCorrectionPanel.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    const activeTab = this.colorCorrectionPanel.querySelector(`[data-tab="${tabName}"]`);
    activeTab.classList.add('active');

    // Update tab content
    const contents = this.colorCorrectionPanel.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    const activeContent = this.colorCorrectionPanel.querySelector(`.tab-content[data-tab="${tabName}"]`);
    activeContent.classList.add('active');
  }

  switchScope(scopeType) {
    const tabs = this.colorScopes.querySelectorAll('.scope-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    const activeTab = this.colorScopes.querySelector(`[data-scope="${scopeType}"]`);
    activeTab.classList.add('active');

    this.currentScopeType = scopeType;
    this.updateScopes();
  }

  updateColorProperty(property, value) {
    if (!this.selectedClipId) return;

    const currentTime = this.state.playheadPercent * this.state.timelineSeconds;
    this.keyframeSystem.createKeyframe(this.selectedClipId, currentTime, property, value);

    // Trigger real-time preview update
    this.applyColorCorrections();
  }

  updatePanelValues() {
    if (!this.selectedClipId) return;

    const currentTime = this.state.playheadPercent * this.state.timelineSeconds;

    // Update all sliders with current values
    const sliders = this.colorCorrectionPanel.querySelectorAll('.color-slider');
    sliders.forEach(slider => {
      const property = slider.dataset.property;
      const value = this.keyframeSystem.evaluateAtTime(this.selectedClipId, property, currentTime);
      if (value !== null) {
        slider.value = value;
        this.updateValueDisplay(slider);
      }
    });
  }

  updateValueDisplay(slider) {
    const display = slider.nextElementSibling;
    const property = slider.dataset.property;
    const config = ANIMATION_PROPERTIES[property];
    const value = parseFloat(slider.value);

    if (config.unit === '%') {
      display.textContent = `${value}%`;
    } else if (config.unit === '°') {
      display.textContent = `${value}°`;
    } else if (config.unit === 'K') {
      display.textContent = `${value}K`;
    } else if (config.unit === 'EV') {
      display.textContent = `${value}EV`;
    } else {
      display.textContent = value.toFixed(1);
    }
  }

  applyColorCorrections() {
    if (!this.selectedClipId) return;

    const clipElement = document.querySelector(`[data-clip-id="${this.selectedClipId}"]`);
    if (!clipElement) return;

    const currentTime = this.state.playheadPercent * this.state.timelineSeconds;
    const corrections = this.getCurrentCorrections(currentTime);

    // Apply CSS filters for real-time preview
    const filters = this.buildCSSFilters(corrections);
    clipElement.style.filter = filters;
  }

  getCurrentCorrections(time) {
    const corrections = {};
    Object.keys(ANIMATION_PROPERTIES).forEach(property => {
      if (property.includes('Gain') || property.includes('Gamma') ||
          property.includes('brightness') || property.includes('contrast') ||
          property.includes('saturation') || property.includes('hue')) {
        const value = this.keyframeSystem.evaluateAtTime(this.selectedClipId, property, time);
        if (value !== null) {
          corrections[property] = value;
        }
      }
    });
    return corrections;
  }

  buildCSSFilters(corrections) {
    const filters = [];

    if (corrections.brightness !== undefined && corrections.brightness !== 100) {
      filters.push(`brightness(${corrections.brightness}%)`);
    }

    if (corrections.contrast !== undefined && corrections.contrast !== 100) {
      filters.push(`contrast(${corrections.contrast}%)`);
    }

    if (corrections.saturation !== undefined && corrections.saturation !== 100) {
      filters.push(`saturate(${corrections.saturation}%)`);
    }

    if (corrections.hue !== undefined && corrections.hue !== 0) {
      filters.push(`hue-rotate(${corrections.hue}deg)`);
    }

    return filters.join(' ');
  }

  applyPreset(preset) {
    if (!this.selectedClipId) return;

    const presets = {
      neutral: {
        brightness: 100, contrast: 100, saturation: 100, hue: 0,
        temperature: 6500, tint: 0,
        redGain: 100, greenGain: 100, blueGain: 100
      },
      warm: {
        brightness: 105, contrast: 110, saturation: 115, hue: 15,
        temperature: 8000, tint: 5,
        redGain: 110, greenGain: 105, blueGain: 100
      },
      cool: {
        brightness: 95, contrast: 105, saturation: 110, hue: -10,
        temperature: 4000, tint: -3,
        redGain: 100, greenGain: 105, blueGain: 110
      },
      vintage: {
        brightness: 110, contrast: 120, saturation: 90, hue: 20,
        temperature: 5500, tint: 8,
        redGain: 115, greenGain: 100, blueGain: 95
      },
      cinematic: {
        brightness: 95, contrast: 130, saturation: 105, hue: 5,
        temperature: 6000, tint: 2,
        redGain: 105, greenGain: 100, blueGain: 110
      }
    };

    const presetValues = presets[preset];
    if (!presetValues) return;

    const currentTime = this.state.playheadPercent * this.state.timelineSeconds;

    Object.entries(presetValues).forEach(([property, value]) => {
      this.keyframeSystem.createKeyframe(this.selectedClipId, currentTime, property, value);
    });

    this.updatePanelValues();
    this.applyColorCorrections();
  }

  updateScopes() {
    if (!this.selectedClipId) return;

    const canvas = this.colorScopes.querySelector('.scope-canvas');
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get current frame data (simplified - would need actual video frame data)
    this.renderScope(ctx, this.currentScopeType || 'waveform');
  }

  renderScope(ctx, type) {
    const { width, height } = ctx.canvas;

    switch (type) {
      case 'waveform':
        this.renderWaveform(ctx, width, height);
        break;
      case 'vectorscope':
        this.renderVectorscope(ctx, width, height);
        break;
      case 'histogram':
        this.renderHistogram(ctx, width, height);
        break;
      case 'rgb-parade':
        this.renderRGBParade(ctx, width, height);
        break;
    }
  }

  renderWaveform(ctx, width, height) {
    // Simplified waveform rendering
    ctx.strokeStyle = '#00ff00';
    ctx.beginPath();
    for (let x = 0; x < width; x += 4) {
      const y = height - (Math.sin(x * 0.1) * 0.5 + 0.5) * height * 0.8;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  renderVectorscope(ctx, width, height) {
    // Simplified vectorscope rendering
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;

    // Draw color wheel background
    for (let angle = 0; angle < 360; angle += 1) {
      const rad = angle * Math.PI / 180;
      const x = centerX + Math.cos(rad) * radius;
      const y = centerY + Math.sin(rad) * radius;
      ctx.strokeStyle = `hsl(${angle}, 100%, 50%)`;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Draw sample points (simplified)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX + 20, centerY - 10, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  renderHistogram(ctx, width, height) {
    // Simplified histogram rendering
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    for (let x = 0; x < width; x += 4) {
      const barHeight = Math.random() * height * 0.8;
      ctx.fillRect(x, height - barHeight, 3, barHeight);
    }
  }

  renderRGBParade(ctx, width, height) {
    const channelWidth = width / 3;

    // Red channel
    ctx.strokeStyle = '#ff0000';
    ctx.beginPath();
    for (let x = 0; x < channelWidth; x += 2) {
      const y = height - Math.sin(x * 0.05) * height * 0.4;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Green channel
    ctx.strokeStyle = '#00ff00';
    ctx.beginPath();
    for (let x = 0; x < channelWidth; x += 2) {
      const y = height - Math.cos(x * 0.05) * height * 0.4;
      if (x === 0) ctx.moveTo(x + channelWidth, y);
      else ctx.lineTo(x + channelWidth, y);
    }
    ctx.stroke();

    // Blue channel
    ctx.strokeStyle = '#0000ff';
    ctx.beginPath();
    for (let x = 0; x < channelWidth; x += 2) {
      const y = height - Math.sin(x * 0.05 + Math.PI) * height * 0.4;
      if (x === 0) ctx.moveTo(x + channelWidth * 2, y);
      else ctx.lineTo(x + channelWidth * 2, y);
    }
    ctx.stroke();
  }

  loadLUTFile(file) {
    // Handle LUT file loading
    const reader = new FileReader();
    reader.onload = (e) => {
      const lutData = this.lutManager.parseLUT(e.target.result, file.name);
      if (lutData) {
        this.applyLUT(lutData);
      }
    };
    reader.readAsText(file);
  }

  applyLUT(lutData) {
    if (!this.selectedClipId) return;

    const currentTime = this.state.playheadPercent * this.state.timelineSeconds;
    this.keyframeSystem.createKeyframe(this.selectedClipId, currentTime, 'lutPath', lutData.path);

    // Apply LUT to clip preview
    this.applyColorCorrections();
  }

  // Integration methods
  getPanel() {
    return this.colorCorrectionPanel;
  }

  getScopes() {
    return this.colorScopes;
  }

  setSelectedClip(clipId) {
    this.selectedClipId = clipId;
    this.updatePanelValues();
    this.updateScopes();
  }
}

class LUTManager {
  constructor() {
    this.luts = new Map();
    this.initializeBuiltInLUTs();
  }

  initializeBuiltInLUTs() {
    // Initialize built-in LUT presets
    this.luts.set('film-standard', {
      name: 'Film Standard',
      category: 'film',
      type: '3d',
      size: 32,
      data: this.generateFilmLUT()
    });

    this.luts.set('cinematic-teal-orange', {
      name: 'Teal & Orange',
      category: 'cinematic',
      type: '3d',
      size: 32,
      data: this.generateTealOrangeLUT()
    });
  }

  parseLUT(content, filename) {
    // Parse .cube or .3dl LUT files
    // This is a simplified parser - real implementation would handle various formats
    const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));

    if (lines[0].toLowerCase().includes('cube')) {
      return this.parseCubeLUT(lines, filename);
    }

    return null;
  }

  parseCubeLUT(lines, filename) {
    let size = 32;
    const data = [];

    for (const line of lines) {
      if (line.startsWith('LUT_3D_SIZE')) {
        size = parseInt(line.split(' ')[1]);
      } else if (!line.startsWith('DOMAIN_') && line.includes(' ')) {
        const values = line.split(' ').map(parseFloat);
        if (values.length >= 3) {
          data.push(values);
        }
      }
    }

    return {
      name: filename.replace('.cube', ''),
      path: filename,
      type: '3d',
      size,
      data
    };
  }

  generateFilmLUT() {
    // Generate a simple film-like LUT
    const data = [];
    for (let b = 0; b < 32; b++) {
      for (let g = 0; g < 32; g++) {
        for (let r = 0; r < 32; r++) {
          const rf = r / 31;
          const gf = g / 31;
          const bf = b / 31;

          // Apply film-like curve
          const outR = Math.pow(rf, 0.9) * 0.95;
          const outG = Math.pow(gf, 0.95) * 0.98;
          const outB = Math.pow(bf, 1.0) * 1.02;

          data.push([outR, outG, outB]);
        }
      }
    }
    return data;
  }

  generateTealOrangeLUT() {
    // Generate teal & orange cinematic LUT
    const data = [];
    for (let b = 0; b < 32; b++) {
      for (let g = 0; g < 32; g++) {
        for (let r = 0; r < 32; r++) {
          const rf = r / 31;
          const gf = g / 31;
          const bf = b / 31;

          // Boost blues and cyans, reduce yellows and magentas
          let outR = rf;
          let outG = gf;
          let outB = bf;

          // Teal boost (increase cyan, reduce yellow)
          if (gf > rf && gf > bf) {
            outG *= 1.1;
            outR *= 0.9;
          }

          // Orange boost (increase yellow, reduce blue)
          if (rf > gf && gf > bf) {
            outR *= 1.1;
            outG *= 1.05;
            outB *= 0.85;
          }

          data.push([Math.min(outR, 1), Math.min(outG, 1), Math.min(outB, 1)]);
        }
      }
    }
    return data;
  }

  applyLUTToPixel(r, g, b, lutName, strength = 1) {
    const lut = this.luts.get(lutName);
    if (!lut) return [r, g, b];

    // Simplified LUT application - real implementation would interpolate 3D LUT
    const index = Math.floor(r * (lut.size - 1)) +
                 Math.floor(g * (lut.size - 1)) * lut.size +
                 Math.floor(b * (lut.size - 1)) * lut.size * lut.size;

    if (index < lut.data.length) {
      const lutValues = lut.data[index];
      return [
        r * (1 - strength) + lutValues[0] * strength,
        g * (1 - strength) + lutValues[1] * strength,
        b * (1 - strength) + lutValues[2] * strength
      ];
    }

    return [r, g, b];
  }
}

// Color Scopes Renderer for professional color analysis
class ColorScopesRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.currentScope = 'waveform';
    this.intensity = 'medium';
    this.showOverlay = true;
    this.frameData = null;

    this.initialize();
  }

  initialize() {
    this.drawScopeGrid();
  }

  setScopeType(type) {
    this.currentScope = type;
    this.drawScopeGrid();
    if (this.frameData) {
      this.renderScope(this.frameData);
    }
  }

  setIntensity(intensity) {
    this.intensity = intensity;
  }

  updateFrameData(imageData) {
    this.frameData = imageData;
    this.renderScope(imageData);
  }

  renderScope(imageData) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawScopeGrid();

    switch (this.currentScope) {
      case 'waveform':
        this.renderWaveform(imageData);
        break;
      case 'vectorscope':
        this.renderVectorscope(imageData);
        break;
      case 'rgb-histogram':
        this.renderRGBHistogram(imageData);
        break;
      case 'parade':
        this.renderParade(imageData);
        break;
    }
  }

  renderWaveform(imageData) {
    const { data, width, height } = imageData;
    const scopeHeight = this.canvas.height - 40;
    const scopeWidth = this.canvas.width - 40;

    // Sample pixels across the image
    const samples = [];
    for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 100))) {
      for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 100))) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];

        // Convert to luma
        const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        samples.push({ x: (x / width) * scopeWidth + 20, y: (1 - luma) * scopeHeight + 20 });
      }
    }

    // Draw waveform
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      if (i === 0) {
        this.ctx.moveTo(sample.x, sample.y);
      } else {
        this.ctx.lineTo(sample.x, sample.y);
      }
    }

    this.ctx.stroke();
  }

  renderVectorscope(imageData) {
    const { data, width, height } = imageData;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Draw color wheel background
    this.drawColorWheel(centerX, centerY, radius);

    // Sample pixels and plot vectors
    const vectors = [];
    for (let i = 0; i < Math.min(data.length / 4, 10000); i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      // Convert RGB to UV coordinates (simplified vectorscope)
      const u = (r - g) * 0.5;
      const v = (b - (r + g) * 0.5) * 0.5;

      vectors.push({
        u: u * radius + centerX,
        v: v * radius + centerY
      });
    }

    // Draw vectors
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    vectors.forEach(vector => {
      this.ctx.beginPath();
      this.ctx.arc(vector.u, vector.v, 1, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  renderRGBHistogram(imageData) {
    const { data } = imageData;
    const histogram = { r: new Array(256).fill(0), g: new Array(256).fill(0), b: new Array(256).fill(0) };

    // Calculate histogram
    for (let i = 0; i < data.length; i += 4) {
      histogram.r[data[i]]++;
      histogram.g[data[i + 1]]++;
      histogram.b[data[i + 2]]++;
    }

    const maxValue = Math.max(
      Math.max(...histogram.r),
      Math.max(...histogram.g),
      Math.max(...histogram.b)
    );

    const barWidth = (this.canvas.width - 40) / 256;
    const scopeHeight = this.canvas.height - 40;

    // Draw histograms
    ['r', 'g', 'b'].forEach((channel, index) => {
      this.ctx.strokeStyle = ['#ff0000', '#00ff00', '#0000ff'][index];
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();

      histogram[channel].forEach((value, i) => {
        const x = i * barWidth + 20;
        const height = (value / maxValue) * scopeHeight;
        const y = this.canvas.height - 20 - height;

        if (i === 0) {
          this.ctx.moveTo(x, this.canvas.height - 20);
          this.ctx.lineTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      });

      this.ctx.stroke();
    });
  }

  renderParade(imageData) {
    const { data, width, height } = imageData;
    const scopeWidth = (this.canvas.width - 40) / 3;
    const scopeHeight = this.canvas.height - 40;

    // Sample a center line
    const lineY = Math.floor(height / 2);
    const lineData = [];

    for (let x = 0; x < width; x++) {
      const index = (lineY * width + x) * 4;
      lineData.push({
        r: data[index] / 255,
        g: data[index + 1] / 255,
        b: data[index + 2] / 255
      });
    }

    // Draw RGB parade
    ['r', 'g', 'b'].forEach((channel, index) => {
      this.ctx.strokeStyle = ['#ff0000', '#00ff00', '#0000ff'][index];
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();

      const offsetX = 20 + index * scopeWidth;

      lineData.forEach((pixel, x) => {
        const value = pixel[channel];
        const plotX = offsetX + (x / width) * scopeWidth;
        const plotY = 20 + (1 - value) * scopeHeight;

        if (x === 0) {
          this.ctx.moveTo(plotX, plotY);
        } else {
          this.ctx.lineTo(plotX, plotY);
        }
      });

      this.ctx.stroke();
    });
  }

  drawColorWheel(centerX, centerY, radius) {
    const imageData = this.ctx.createImageData(radius * 2, radius * 2);
    const data = imageData.data;

    for (let y = 0; y < radius * 2; y++) {
      for (let x = 0; x < radius * 2; x++) {
        const dx = x - radius;
        const dy = y - radius;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius) {
          const angle = Math.atan2(dy, dx);
          const hue = (angle + Math.PI) / (Math.PI * 2);
          const saturation = distance / radius;

          // HSV to RGB
          const c = saturation;
          const h = hue * 6;
          const x2 = c * (1 - Math.abs(h % 2 - 1));
          let r = 0, g = 0, b = 0;

          if (h >= 0 && h < 1) { r = c; g = x2; b = 0; }
          else if (h >= 1 && h < 2) { r = x2; g = c; b = 0; }
          else if (h >= 2 && h < 3) { r = 0; g = c; b = x2; }
          else if (h >= 3 && h < 4) { r = 0; g = x2; b = c; }
          else if (h >= 4 && h < 5) { r = x2; g = 0; b = c; }
          else { r = c; g = 0; b = x2; }

          const index = (y * radius * 2 + x) * 4;
          data[index] = r * 255;
          data[index + 1] = g * 255;
          data[index + 2] = b * 255;
          data[index + 3] = 128; // Semi-transparent
        }
      }
    }

    this.ctx.putImageData(imageData, centerX - radius, centerY - radius);
  }

  drawScopeGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;

    // Draw grid lines
    const gridSpacing = 20;
    for (let x = gridSpacing; x < this.canvas.width; x += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = gridSpacing; y < this.canvas.height; y += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Draw border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

// Enhanced Curve Editor with Spline Support
class EnhancedCurveEditor {
  constructor(container) {
    this.container = container;
    this.canvas = container.querySelector('.curve-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.points = { rgb: [], red: [], green: [], blue: [], luma: [] };
    this.currentChannel = 'rgb';
    this.dragging = null;
    this.tension = 0.5;
    this.showHistogram = true;

    this.initialize();
  }

  initialize() {
    this.resetCurve();
    this.bindEvents();
    this.render();
  }

  resetCurve() {
    // Default linear curve
    this.points[this.currentChannel] = [
      { x: 0, y: 0 },
      { x: 255, y: 255 }
    ];
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));

    // Curve controls
    const resetBtn = this.container.querySelector('.curve-reset-btn');
    const invertBtn = this.container.querySelector('.curve-invert-btn');
    const linearBtn = this.container.querySelector('.curve-linear-btn');
    const tensionSlider = this.container.querySelector('.curve-spline-tension');

    resetBtn.addEventListener('click', () => this.resetCurve());
    invertBtn.addEventListener('click', () => this.invertCurve());
    linearBtn.addEventListener('click', () => this.linearCurve());
    tensionSlider.addEventListener('input', (e) => {
      this.tension = parseFloat(e.target.value);
      this.render();
    });

    // Curve tabs
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('curve-tab')) {
        this.setChannel(e.target.dataset.curve);
      }
    });
  }

  setChannel(channel) {
    this.currentChannel = channel;
    if (!this.points[channel]) {
      this.points[channel] = [
        { x: 0, y: 0 },
        { x: 255, y: 255 }
      ];
    }
    this.render();
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 255;
    const y = (1 - (e.clientY - rect.top) / rect.height) * 255;

    // Find closest point
    const points = this.points[this.currentChannel];
    let closestIndex = -1;
    let minDistance = 10;

    points.forEach((point, index) => {
      const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex >= 0) {
      this.dragging = { index: closestIndex, offsetX: x - points[closestIndex].x, offsetY: y - points[closestIndex].y };
    } else {
      // Add new point
      points.push({ x, y });
      points.sort((a, b) => a.x - b.x);
      this.dragging = { index: points.findIndex(p => p.x === x && p.y === y), offsetX: 0, offsetY: 0 };
    }

    this.render();
  }

  handleMouseMove(e) {
    if (!this.dragging) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 255;
    const y = (1 - (e.clientY - rect.top) / rect.height) * 255;

    const points = this.points[this.currentChannel];
    const point = points[this.dragging.index];

    // Constrain to canvas bounds
    point.x = Math.max(0, Math.min(255, x - this.dragging.offsetX));
    point.y = Math.max(0, Math.min(255, y - this.dragging.offsetY));

    // Keep endpoints fixed
    if (this.dragging.index === 0) point.x = 0;
    if (this.dragging.index === points.length - 1) point.x = 255;

    // Resort points
    points.sort((a, b) => a.x - b.x);

    this.updateInfoDisplay(x, y);
    this.render();
  }

  handleMouseUp() {
    this.dragging = null;
  }

  handleDoubleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 255;

    // Remove point closest to click
    const points = this.points[this.currentChannel];
    let closestIndex = -1;
    let minDistance = 10;

    points.forEach((point, index) => {
      if (index === 0 || index === points.length - 1) return; // Don't remove endpoints
      const distance = Math.abs(point.x - x);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex >= 0) {
      points.splice(closestIndex, 1);
      this.render();
    }
  }

  invertCurve() {
    const points = this.points[this.currentChannel];
    points.forEach(point => {
      point.y = 255 - point.y;
    });
    this.render();
  }

  linearCurve() {
    this.points[this.currentChannel] = [
      { x: 0, y: 0 },
      { x: 255, y: 255 }
    ];
    this.render();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.drawGrid();

    // Draw histogram if available
    if (this.showHistogram) {
      this.drawHistogram();
    }

    // Draw curve
    this.drawCurve();

    // Draw points
    this.drawPoints();
  }

  drawGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;

    const step = this.canvas.width / 4;
    for (let i = 0; i <= 4; i++) {
      const x = i * step;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();

      const y = i * step;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  drawHistogram() {
    // Placeholder for histogram drawing
    // In a real implementation, this would draw the image histogram
  }

  drawCurve() {
    const points = this.points[this.currentChannel];
    if (points.length < 2) return;

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    // Use cardinal spline interpolation
    const splinePoints = this.cardinalSpline(points, this.tension);

    splinePoints.forEach((point, index) => {
      const x = (point.x / 255) * this.canvas.width;
      const y = (1 - point.y / 255) * this.canvas.height;

      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });

    this.ctx.stroke();
  }

  cardinalSpline(points, tension) {
    if (points.length < 2) return points;

    const result = [];
    const numSegments = 50; // Smoothness

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];

      for (let t = 0; t <= numSegments; t++) {
        const u = t / numSegments;
        const u2 = u * u;
        const u3 = u2 * u;

        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3
        );

        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * u +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3
        );

        result.push({ x: Math.max(0, Math.min(255, x)), y: Math.max(0, Math.min(255, y)) });
      }
    }

    return result;
  }

  drawPoints() {
    const points = this.points[this.currentChannel];

    points.forEach((point, index) => {
      const x = (point.x / 255) * this.canvas.width;
      const y = (1 - point.y / 255) * this.canvas.height;

      this.ctx.fillStyle = index === 0 || index === points.length - 1 ? '#ff6b6b' : '#ffffff';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    });
  }

  updateInfoDisplay(input, output) {
    const inputEl = this.container.querySelector('.input-value');
    const outputEl = this.container.querySelector('.output-value');

    if (inputEl) inputEl.textContent = Math.round(input);
    if (outputEl) outputEl.textContent = Math.round(output);
  }

  getCurveLUT() {
    const points = this.points[this.currentChannel];
    const lut = new Array(256);

    // Generate LUT from curve points using spline interpolation
    const splinePoints = this.cardinalSpline(points, this.tension);

    for (let i = 0; i < 256; i++) {
      // Find the appropriate spline segment
      let value = i;
      for (let j = 0; j < splinePoints.length - 1; j++) {
        const p1 = splinePoints[j];
        const p2 = splinePoints[j + 1];

        if (i >= p1.x && i <= p2.x) {
          const t = (i - p1.x) / (p2.x - p1.x || 1);
          value = p1.y + (p2.y - p1.y) * t;
          break;
        }
      }

      lut[i] = Math.max(0, Math.min(255, Math.round(value)));
    }

    return lut;
  }
}</content>
<parameter name="filePath">src/lib/editor/colorCorrectionSystem.js