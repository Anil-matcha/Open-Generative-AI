/**
 * Transition Editor with Visual Preview
 * Provides interactive controls for transition parameters and live preview
 */

import { TransitionsLibrary } from './transitionsLibrary.js';

export class TransitionEditor {
  constructor(container, onTransitionChange) {
    this.container = container;
    this.onTransitionChange = onTransitionChange;
    this.library = new TransitionsLibrary();
    this.currentTransition = null;
    this.currentParams = {};
    this.previewCanvas = null;
    this.animationFrame = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 2.0; // seconds

    this.initialize();
  }

  initialize() {
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="transition-editor">
        <div class="transition-editor__header">
          <h3>Transition Editor</h3>
          <div class="transition-editor__controls">
            <button class="transition-btn" id="playPreview">▶ Preview</button>
            <button class="transition-btn" id="stopPreview">⏹ Stop</button>
            <button class="transition-btn" id="resetPreview">🔄 Reset</button>
          </div>
        </div>

        <div class="transition-editor__preview">
          <canvas id="transitionPreview" width="320" height="180"></canvas>
          <div class="transition-editor__timeline">
            <div class="preview-progress" id="previewProgress"></div>
            <div class="preview-playhead" id="previewPlayhead"></div>
          </div>
        </div>

        <div class="transition-editor__library">
          <div class="transition-categories">
            <button class="category-btn active" data-category="all">All</button>
            <button class="category-btn" data-category="fade">Fade</button>
            <button class="category-btn" data-category="wipe">Wipe</button>
            <button class="category-btn" data-category="push">Push</button>
            <button class="category-btn" data-category="zoom">Zoom</button>
            <button class="category-btn" data-category="iris">Iris</button>
            <button class="category-btn" data-category="shape">Shape</button>
          </div>

          <div class="transition-grid" id="transitionGrid">
            ${this.renderTransitionGrid('all')}
          </div>
        </div>

        <div class="transition-editor__params" id="paramsPanel">
          <div class="params-header">
            <h4 id="transitionTitle">Select a Transition</h4>
            <div class="preset-selector">
              <select id="presetSelect">
                <option value="">Choose Preset...</option>
                <optgroup label="Cinematic">
                  ${this.library.getPresets('cinematic').map(preset =>
                    `<option value="cinematic:${preset.name}">${preset.name}</option>`
                  ).join('')}
                </optgroup>
                <optgroup label="Modern">
                  ${this.library.getPresets('modern').map(preset =>
                    `<option value="modern:${preset.name}">${preset.name}</option>`
                  ).join('')}
                </optgroup>
                <optgroup label="Vintage">
                  ${this.library.getPresets('vintage').map(preset =>
                    `<option value="vintage:${preset.name}">${preset.name}</option>`
                  ).join('')}
                </optgroup>
              </select>
            </div>
          </div>

          <div class="duration-control">
            <label>Duration: <span id="durationValue">2.0s</span></label>
            <input type="range" id="durationSlider" min="0.5" max="10.0" step="0.1" value="2.0">
          </div>

          <div class="params-grid" id="paramsGrid">
            <!-- Parameters will be rendered here -->
          </div>

          <div class="advanced-controls">
            <div class="control-group">
              <label>
                <input type="checkbox" id="audioSync"> Audio-synced timing
              </label>
            </div>
            <div class="control-group">
              <label>
                <input type="checkbox" id="keyframeMode"> Keyframe mode
              </label>
            </div>
            <div class="control-group">
              <label>
                <input type="checkbox" id="multiLayer"> Multi-layer transition
              </label>
            </div>
          </div>
        </div>

        <div class="transition-editor__actions">
          <button class="transition-btn secondary" id="savePreset">💾 Save as Preset</button>
          <button class="transition-btn secondary" id="exportTransition">📤 Export</button>
          <button class="transition-btn primary" id="applyTransition">✅ Apply Transition</button>
        </div>
      </div>
    `;

    // Get canvas reference
    this.previewCanvas = this.container.querySelector('#transitionPreview');
    this.setupCanvas();
  }

  renderTransitionGrid(category) {
    let transitions;
    if (category === 'all') {
      transitions = this.library.getAllTransitions();
    } else {
      transitions = this.library.getTransitionsByCategory(category);
    }

    return transitions.map(transition => `
      <div class="transition-item ${this.currentTransition?.key === transition.key ? 'selected' : ''}"
           data-transition="${transition.key}">
        <div class="transition-icon">${transition.icon}</div>
        <div class="transition-name">${transition.name}</div>
        <div class="transition-desc">${transition.description}</div>
      </div>
    `).join('');
  }

  renderParams(transition) {
    if (!transition) {
      return '<p class="no-params">Select a transition to edit its parameters</p>';
    }

    const params = Object.entries(transition.params).map(([key, config]) => {
      const currentValue = this.currentParams[key] !== undefined ? this.currentParams[key] : config.value;

      if (config.type === 'boolean') {
        return `
          <div class="param-item">
            <label>
              <input type="checkbox" data-param="${key}" ${currentValue ? 'checked' : ''}>
              ${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </label>
          </div>
        `;
      }

      if (config.type === 'text') {
        return `
          <div class="param-item">
            <label>${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</label>
            <input type="text" data-param="${key}" value="${currentValue}" placeholder="Enter SVG path...">
          </div>
        `;
      }

      if (config.options) {
        return `
          <div class="param-item">
            <label>${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</label>
            <select data-param="${key}">
              ${config.options.map(option => `
                <option value="${option}" ${currentValue === option ? 'selected' : ''}>
                  ${option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              `).join('')}
            </select>
          </div>
        `;
      }

      // Numeric slider
      return `
        <div class="param-item">
          <label>${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: <span class="param-value">${currentValue}</span></label>
          <input type="range" data-param="${key}" min="${config.min}" max="${config.max}" step="${config.step}" value="${currentValue}">
        </div>
      `;
    }).join('');

    return params;
  }

  setupCanvas() {
    if (!this.previewCanvas) return;

    const ctx = this.previewCanvas.getContext('2d');

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

    // Draw placeholder content
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Transition Preview', this.previewCanvas.width / 2, this.previewCanvas.height / 2 - 20);
    ctx.fillText('Select a transition to preview', this.previewCanvas.width / 2, this.previewCanvas.height / 2 + 10);
  }

  bindEvents() {
    // Category selection
    this.container.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const category = btn.dataset.category;
        this.container.querySelector('#transitionGrid').innerHTML = this.renderTransitionGrid(category);
        this.bindTransitionSelection();
      });
    });

    // Transition selection
    this.bindTransitionSelection();

    // Parameter controls
    this.container.addEventListener('input', (e) => {
      if (e.target.hasAttribute('data-param')) {
        const param = e.target.dataset.param;
        const value = e.target.type === 'checkbox' ? e.target.checked :
                      e.target.type === 'range' ? parseFloat(e.target.value) : e.target.value;

        this.currentParams[param] = value;

        // Update display value
        const valueSpan = e.target.parentElement.querySelector('.param-value');
        if (valueSpan) valueSpan.textContent = value;

        this.updatePreview();
      }
    });

    // Duration control
    this.container.querySelector('#durationSlider').addEventListener('input', (e) => {
      this.duration = parseFloat(e.target.value);
      this.container.querySelector('#durationValue').textContent = `${this.duration}s`;
    });

    // Preview controls
    this.container.querySelector('#playPreview').addEventListener('click', () => this.playPreview());
    this.container.querySelector('#stopPreview').addEventListener('click', () => this.stopPreview());
    this.container.querySelector('#resetPreview').addEventListener('click', () => this.resetPreview());

    // Preset selection
    this.container.querySelector('#presetSelect').addEventListener('change', (e) => {
      const [category, presetName] = e.target.value.split(':');
      if (category && presetName) {
        const presets = this.library.getPresets(category);
        const preset = presets.find(p => p.name === presetName);
        if (preset) {
          this.loadPreset(preset);
        }
      }
    });

    // Action buttons
    this.container.querySelector('#savePreset').addEventListener('click', () => this.savePreset());
    this.container.querySelector('#exportTransition').addEventListener('click', () => this.exportTransition());
    this.container.querySelector('#applyTransition').addEventListener('click', () => this.applyTransition());
  }

  bindTransitionSelection() {
    this.container.querySelectorAll('.transition-item').forEach(item => {
      item.addEventListener('click', () => {
        this.container.querySelectorAll('.transition-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');

        const transitionKey = item.dataset.transition;
        this.selectTransition(transitionKey);
      });
    });
  }

  selectTransition(transitionKey) {
    this.currentTransition = this.library.getTransition(transitionKey);
    this.currentParams = { ...this.currentTransition.params };

    // Update UI
    this.container.querySelector('#transitionTitle').textContent = this.currentTransition.name;
    this.container.querySelector('#paramsGrid').innerHTML = this.renderParams(this.currentTransition);

    this.updatePreview();
    this.onTransitionChange?.(this.currentTransition, this.currentParams);
  }

  loadPreset(preset) {
    this.selectTransition(preset.transition);
    this.currentParams = { ...this.currentParams, ...preset.params };
    this.container.querySelector('#paramsGrid').innerHTML = this.renderParams(this.currentTransition);
    this.updatePreview();
  }

  updatePreview() {
    if (!this.currentTransition || !this.previewCanvas) return;

    const ctx = this.previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

    // Draw sample content (two overlapping rectangles representing clips)
    const progress = this.isPlaying ? (this.currentTime / this.duration) : 0.5;

    // Draw outgoing clip
    ctx.save();
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(20, 20, this.previewCanvas.width - 40, this.previewCanvas.height - 40);

    // Apply transition effect
    const modifiedCtx = this.currentTransition.render(progress, this.currentParams, this.previewCanvas);

    // Draw incoming clip
    modifiedCtx.fillStyle = '#ef4444';
    modifiedCtx.fillRect(40, 40, this.previewCanvas.width - 80, this.previewCanvas.height - 80);

    ctx.restore();

    // Draw progress indicator
    this.updateProgressIndicator(progress);
  }

  updateProgressIndicator(progress) {
    const progressBar = this.container.querySelector('#previewProgress');
    const playhead = this.container.querySelector('#previewPlayhead');

    if (progressBar) {
      progressBar.style.width = `${progress * 100}%`;
    }
    if (playhead) {
      playhead.style.left = `${progress * 100}%`;
    }
  }

  playPreview() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentTime = 0;
    this.animatePreview();
  }

  stopPreview() {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  resetPreview() {
    this.stopPreview();
    this.currentTime = 0;
    this.updatePreview();
    this.updateProgressIndicator(0);
  }

  animatePreview() {
    if (!this.isPlaying) return;

    this.currentTime += 0.016; // ~60fps

    if (this.currentTime >= this.duration) {
      this.currentTime = this.duration;
      this.isPlaying = false;
    }

    this.updatePreview();

    this.animationFrame = requestAnimationFrame(() => this.animatePreview());
  }

  savePreset() {
    const name = prompt('Enter preset name:');
    if (!name) return;

    // In a real implementation, this would save to localStorage or a backend
    console.log('Saving preset:', { name, transition: this.currentTransition.key, params: this.currentParams });
    alert(`Preset "${name}" saved!`);
  }

  exportTransition() {
    const data = {
      transition: this.currentTransition.key,
      params: this.currentParams,
      duration: this.duration,
      timestamp: Date.now()
    };

    // Create downloadable JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentTransition.name.toLowerCase().replace(/\s+/g, '-')}-transition.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  applyTransition() {
    if (!this.currentTransition) {
      alert('Please select a transition first');
      return;
    }

    this.onTransitionChange?.(this.currentTransition, this.currentParams, this.duration);
    alert(`Applied ${this.currentTransition.name} transition`);
  }

  getCurrentConfig() {
    return {
      transition: this.currentTransition,
      params: this.currentParams,
      duration: this.duration
    };
  }

  destroy() {
    this.stopPreview();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}