/**
 * Motion Graphics Tools
 * Advanced motion graphics features for professional animation
 */

import { MotionBlur, SpeedRamping, LayerParenting } from './keyframeSystem.js';

export class MotionGraphicsTools {
  constructor(container, keyframeSystem, timelineState) {
    this.container = container;
    this.keyframeSystem = keyframeSystem;
    this.timelineState = timelineState;

    this.motionBlur = new MotionBlur();
    this.speedRamping = new SpeedRamping();
    this.layerParenting = new LayerParenting();

    this.selectedClipId = null;
    this.init();
  }

  init() {
    this.createUI();
    this.bindEvents();
  }

  createUI() {
    this.container.innerHTML = `
      <div class="motion-graphics-tools">
        <div class="tool-section">
          <h4 class="section-title">Motion Blur</h4>
          <div class="motion-blur-controls">
            <label class="control-label">
              <input type="checkbox" id="motionBlurEnabled">
              Enable Motion Blur
            </label>
            <div class="slider-group">
              <label>Amount:</label>
              <input type="range" id="blurAmount" min="0" max="50" value="0" step="0.5">
              <span id="blurValue">0px</span>
            </div>
            <div class="slider-group">
              <label>Samples:</label>
              <input type="range" id="blurSamples" min="1" max="32" value="8">
              <span id="samplesValue">8</span>
            </div>
          </div>
        </div>

        <div class="tool-section">
          <h4 class="section-title">Speed Ramping</h4>
          <div class="speed-ramping-controls">
            <button id="addSpeedKeyframeBtn" class="mini-btn">Add Speed Keyframe</button>
            <div class="speed-graph">
              <canvas id="speedGraphCanvas" width="300" height="100"></canvas>
            </div>
            <div class="speed-keyframes" id="speedKeyframesList"></div>
          </div>
        </div>

        <div class="tool-section">
          <h4 class="section-title">Layer Parenting</h4>
          <div class="parenting-controls">
            <div class="parent-selector">
              <label>Parent Layer:</label>
              <select id="parentSelect">
                <option value="">None (Root)</option>
              </select>
            </div>
            <div class="child-list">
              <label>Child Layers:</label>
              <div id="childLayersList" class="child-layers"></div>
            </div>
            <button id="applyParentingBtn" class="mini-btn">Apply Parenting</button>
          </div>
        </div>

        <div class="tool-section">
          <h4 class="section-title">Anchor Point</h4>
          <div class="anchor-controls">
            <div class="anchor-visual">
              <canvas id="anchorCanvas" width="100" height="100"></canvas>
            </div>
            <div class="anchor-inputs">
              <div class="input-group">
                <label>X:</label>
                <input type="number" id="anchorX" min="0" max="100" value="50" step="0.1">
                <span>%</span>
              </div>
              <div class="input-group">
                <label>Y:</label>
                <input type="number" id="anchorY" min="0" max="100" value="50" step="0.1">
                <span>%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="tool-section">
          <h4 class="section-title">Advanced Effects</h4>
          <div class="effects-controls">
            <div class="effect-group">
              <label class="control-label">
                <input type="checkbox" id="dropShadowEnabled">
                Drop Shadow
              </label>
              <div class="shadow-controls" id="shadowControls" style="display: none;">
                <div class="input-group">
                  <label>Distance:</label>
                  <input type="number" id="shadowDistance" min="0" max="100" value="4" step="1">
                  <span>px</span>
                </div>
                <div class="input-group">
                  <label>Blur:</label>
                  <input type="number" id="shadowBlur" min="0" max="50" value="8" step="1">
                  <span>px</span>
                </div>
                <div class="color-input">
                  <label>Color:</label>
                  <input type="color" id="shadowColor" value="#000000">
                </div>
              </div>
            </div>

            <div class="effect-group">
              <label class="control-label">
                <input type="checkbox" id="glowEnabled">
                Glow Effect
              </label>
              <div class="glow-controls" id="glowControls" style="display: none;">
                <div class="input-group">
                  <label>Intensity:</label>
                  <input type="number" id="glowIntensity" min="0" max="100" value="20" step="1">
                  <span>%</span>
                </div>
                <div class="color-input">
                  <label>Color:</label>
                  <input type="color" id="glowColor" value="#ffffff">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.addStyles();
    this.setupAnchorCanvas();
  }

  addStyles() {
    const styles = `
      .motion-graphics-tools {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 16px;
        background: rgba(0,0,0,0.2);
        border: 1px solid var(--border);
        border-radius: 8px;
        max-height: 600px;
        overflow-y: auto;
      }

      .tool-section {
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 16px;
      }

      .tool-section:last-child {
        border-bottom: none;
      }

      .section-title {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: rgba(255,255,255,0.9);
      }

      .control-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: rgba(255,255,255,0.8);
        cursor: pointer;
        margin-bottom: 8px;
      }

      .control-label input[type="checkbox"] {
        margin: 0;
      }

      .slider-group {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .slider-group label {
        font-size: 12px;
        color: rgba(255,255,255,0.7);
        min-width: 60px;
      }

      .slider-group input[type="range"] {
        flex: 1;
        max-width: 120px;
      }

      .slider-group span {
        font-size: 11px;
        color: rgba(34,211,238,0.8);
        min-width: 30px;
      }

      .speed-graph {
        margin: 12px 0;
        border: 1px solid var(--border);
        border-radius: 4px;
        overflow: hidden;
      }

      .speed-graph canvas {
        display: block;
        background: rgba(0,0,0,0.2);
      }

      .speed-keyframes {
        max-height: 100px;
        overflow-y: auto;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: rgba(0,0,0,0.1);
      }

      .speed-keyframe-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 8px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        font-size: 11px;
        color: rgba(255,255,255,0.7);
      }

      .speed-keyframe-item:last-child {
        border-bottom: none;
      }

      .parent-selector,
      .child-list {
        margin-bottom: 12px;
      }

      .parent-selector select {
        width: 100%;
        padding: 6px 8px;
        background: rgba(0,0,0,0.3);
        border: 1px solid var(--border);
        border-radius: 4px;
        color: white;
        font-size: 12px;
      }

      .child-layers {
        min-height: 40px;
        padding: 8px;
        background: rgba(0,0,0,0.1);
        border: 1px solid var(--border);
        border-radius: 4px;
        font-size: 11px;
        color: rgba(255,255,255,0.6);
      }

      .anchor-controls {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .anchor-visual {
        flex-shrink: 0;
      }

      .anchor-visual canvas {
        border: 1px solid var(--border);
        border-radius: 4px;
        background: rgba(0,0,0,0.2);
        cursor: crosshair;
      }

      .anchor-inputs {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .input-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .input-group label {
        font-size: 12px;
        color: rgba(255,255,255,0.7);
        min-width: 20px;
      }

      .input-group input {
        width: 60px;
        padding: 4px 6px;
        background: rgba(0,0,0,0.3);
        border: 1px solid var(--border);
        border-radius: 3px;
        color: white;
        font-size: 12px;
      }

      .color-input {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .color-input input[type="color"] {
        width: 30px;
        height: 24px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
      }

      .effect-group {
        margin-bottom: 16px;
        padding: 12px;
        background: rgba(0,0,0,0.1);
        border: 1px solid var(--border);
        border-radius: 6px;
      }

      .shadow-controls,
      .glow-controls {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,0.1);
      }

      .mini-btn {
        padding: 6px 12px;
        border: 1px solid var(--border);
        background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.8);
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.15s ease;
      }

      .mini-btn:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(34,211,238,0.3);
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  bindEvents() {
    // Motion blur controls
    this.container.querySelector('#motionBlurEnabled').addEventListener('change', (e) => {
      const controls = this.container.querySelector('.motion-blur-controls .slider-group');
      controls.forEach(group => {
        group.style.display = e.target.checked ? 'flex' : 'none';
      });
    });

    this.container.querySelector('#blurAmount').addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.container.querySelector('#blurValue').textContent = `${value}px`;
      this.updateMotionBlur({ amount: value });
    });

    this.container.querySelector('#blurSamples').addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.container.querySelector('#samplesValue').textContent = value.toString();
      this.motionBlur.samples = value;
    });

    // Speed ramping controls
    this.container.querySelector('#addSpeedKeyframeBtn').addEventListener('click', () => {
      this.addSpeedKeyframe();
    });

    // Parenting controls
    this.container.querySelector('#applyParentingBtn').addEventListener('click', () => {
      this.applyParenting();
    });

    // Anchor point controls
    const anchorX = this.container.querySelector('#anchorX');
    const anchorY = this.container.querySelector('#anchorY');

    anchorX.addEventListener('input', () => {
      this.updateAnchorPoint();
    });

    anchorY.addEventListener('input', () => {
      this.updateAnchorPoint();
    });

    // Effects controls
    this.container.querySelector('#dropShadowEnabled').addEventListener('change', (e) => {
      const controls = this.container.querySelector('#shadowControls');
      controls.style.display = e.target.checked ? 'block' : 'none';
    });

    this.container.querySelector('#glowEnabled').addEventListener('change', (e) => {
      const controls = this.container.querySelector('#glowControls');
      controls.style.display = e.target.checked ? 'block' : 'none';
    });

    // Shadow controls
    ['shadowDistance', 'shadowBlur'].forEach(id => {
      this.container.querySelector(`#${id}`).addEventListener('input', () => {
        this.updateShadowEffect();
      });
    });

    this.container.querySelector('#shadowColor').addEventListener('input', () => {
      this.updateShadowEffect();
    });

    // Glow controls
    this.container.querySelector('#glowIntensity').addEventListener('input', () => {
      this.updateGlowEffect();
    });

    this.container.querySelector('#glowColor').addEventListener('input', () => {
      this.updateGlowEffect();
    });
  }

  setSelectedClip(clipId) {
    this.selectedClipId = clipId;
    this.updateUI();
  }

  updateUI() {
    if (!this.selectedClipId) return;

    // Update motion blur settings
    this.updateMotionBlurUI();

    // Update speed graph
    this.renderSpeedGraph();

    // Update parenting UI
    this.updateParentingUI();

    // Update anchor point
    this.updateAnchorUI();

    // Update effects
    this.updateEffectsUI();
  }

  updateMotionBlurUI() {
    // Load current motion blur settings for the selected clip
    // This would typically come from the clip's properties
    const blurAmount = 0; // Default
    const samples = this.motionBlur.samples;

    this.container.querySelector('#blurAmount').value = blurAmount;
    this.container.querySelector('#blurValue').textContent = `${blurAmount}px`;
    this.container.querySelector('#blurSamples').value = samples;
    this.container.querySelector('#samplesValue').textContent = samples.toString();
  }

  renderSpeedGraph() {
    const canvas = this.container.querySelector('#speedGraphCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw speed curve
    if (this.speedRamping.keyframes.length > 0) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let x = 0; x < width; x++) {
        const time = (x / width) * this.timelineState.timelineSeconds;
        const speed = this.speedRamping.getSpeedAtTime(time);
        const y = height - ((speed - 0.1) / 3.9) * height; // Map 0.1-4 to canvas height

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw keyframes
      ctx.fillStyle = '#ef4444';
      this.speedRamping.keyframes.forEach(kf => {
        const x = (kf.time / this.timelineState.timelineSeconds) * width;
        const y = height - ((kf.speed - 0.1) / 3.9) * height;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    this.updateSpeedKeyframesList();
  }

  updateSpeedKeyframesList() {
    const list = this.container.querySelector('#speedKeyframesList');
    list.innerHTML = '';

    this.speedRamping.keyframes.forEach((kf, index) => {
      const item = document.createElement('div');
      item.className = 'speed-keyframe-item';
      item.innerHTML = `
        <span>${kf.time.toFixed(1)}s: ${kf.speed.toFixed(1)}x</span>
        <button class="delete-speed-kf" data-index="${index}">×</button>
      `;

      item.querySelector('.delete-speed-kf').addEventListener('click', () => {
        this.speedRamping.keyframes.splice(index, 1);
        this.renderSpeedGraph();
      });

      list.appendChild(item);
    });
  }

  addSpeedKeyframe() {
    const time = (this.timelineState.playheadPercent / 100) * this.timelineState.timelineSeconds;
    const speed = 1.0; // Default speed
    this.speedRamping.addSpeedKeyframe(time, speed);
    this.renderSpeedGraph();
  }

  updateParentingUI() {
    const parentSelect = this.container.querySelector('#parentSelect');
    const childList = this.container.querySelector('#childLayersList');

    // Populate parent select with available clips
    parentSelect.innerHTML = '<option value="">None (Root)</option>';
    this.timelineState.tracks.forEach(track => {
      track.items.forEach(clip => {
        if (clip.id !== this.selectedClipId) {
          const option = document.createElement('option');
          option.value = clip.id;
          option.textContent = `${clip.name} (${track.name})`;
          parentSelect.appendChild(option);
        }
      });
    });

    // Set current parent
    const currentParent = this.layerParenting.getParent(this.selectedClipId);
    parentSelect.value = currentParent || '';

    // Show children
    const children = this.layerParenting.getChildren(this.selectedClipId);
    childList.innerHTML = children.length > 0
      ? children.map(id => `<div>• Child: ${id}</div>`).join('')
      : 'No child layers';
  }

  applyParenting() {
    const parentSelect = this.container.querySelector('#parentSelect');
    const parentId = parentSelect.value;

    if (parentId) {
      this.layerParenting.setParent(this.selectedClipId, parentId);
    } else {
      this.layerParenting.removeParent(this.selectedClipId);
    }

    this.updateParentingUI();
  }

  setupAnchorCanvas() {
    const canvas = this.container.querySelector('#anchorCanvas');
    const ctx = canvas.getContext('2d');
    let isDragging = false;

    const drawAnchor = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw crosshairs
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();

      // Draw anchor point
      const x = (parseFloat(this.container.querySelector('#anchorX').value) / 100) * canvas.width;
      const y = (parseFloat(this.container.querySelector('#anchorY').value) / 100) * canvas.height;

      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / canvas.width) * 100;
      const y = ((e.clientY - rect.top) / canvas.height) * 100;

      this.container.querySelector('#anchorX').value = x.toFixed(1);
      this.container.querySelector('#anchorY').value = y.toFixed(1);

      this.updateAnchorPoint();
      drawAnchor();
    });

    // Initial draw
    drawAnchor();

    // Redraw when inputs change
    this.container.querySelector('#anchorX').addEventListener('input', drawAnchor);
    this.container.querySelector('#anchorY').addEventListener('input', drawAnchor);
  }

  updateAnchorPoint() {
    if (!this.selectedClipId) return;

    const anchorX = parseFloat(this.container.querySelector('#anchorX').value) / 100;
    const anchorY = parseFloat(this.container.querySelector('#anchorY').value) / 100;

    // Update the clip's anchor point keyframes
    this.keyframeSystem.createKeyframe(this.selectedClipId, 0, 'anchorX', anchorX);
    this.keyframeSystem.createKeyframe(this.selectedClipId, 0, 'anchorY', anchorY);
  }

  updateAnchorUI() {
    // Load current anchor point values
    const anchorX = this.keyframeSystem.evaluateAtTime(this.selectedClipId, 'anchorX', 0) || 0.5;
    const anchorY = this.keyframeSystem.evaluateAtTime(this.selectedClipId, 'anchorY', 0) || 0.5;

    this.container.querySelector('#anchorX').value = (anchorX * 100).toFixed(1);
    this.container.querySelector('#anchorY').value = (anchorY * 100).toFixed(1);
  }

  updateEffectsUI() {
    // Load current effects settings
    // This would typically come from the clip's properties
    // For now, just set defaults
  }

  updateMotionBlur(settings) {
    // Apply motion blur settings to the selected clip
    if (settings.amount !== undefined) {
      this.keyframeSystem.createKeyframe(this.selectedClipId, 0, 'blur', settings.amount);
    }
  }

  updateShadowEffect() {
    const enabled = this.container.querySelector('#dropShadowEnabled').checked;
    if (!enabled) return;

    const distance = parseInt(this.container.querySelector('#shadowDistance').value);
    const blur = parseInt(this.container.querySelector('#shadowBlur').value);
    const color = this.container.querySelector('#shadowColor').value;

    // Store shadow effect properties
    const shadowProps = { distance, blur, color };
    // This would be applied to the clip's rendering
    console.log('Shadow effect:', shadowProps);
  }

  updateGlowEffect() {
    const enabled = this.container.querySelector('#glowEnabled').checked;
    if (!enabled) return;

    const intensity = parseInt(this.container.querySelector('#glowIntensity').value);
    const color = this.container.querySelector('#glowColor').value;

    // Store glow effect properties
    const glowProps = { intensity, color };
    // This would be applied to the clip's rendering
    console.log('Glow effect:', glowProps);
  }

  // Integration with timeline
  getClipTransform(clipId, time) {
    const transform = {};

    // Get individual property values
    ['x', 'y', 'scale', 'rotation', 'opacity', 'blur'].forEach(prop => {
      transform[prop] = this.keyframeSystem.evaluateAtTime(clipId, prop, time);
    });

    // Apply parenting
    const transformChain = this.layerParenting.getTransformChain(clipId, this.getAllClipTransforms(time));
    const combinedTransform = this.layerParenting.combineTransforms(transformChain);

    return { ...transform, ...combinedTransform };
  }

  getAllClipTransforms(time) {
    const transforms = {};
    this.timelineState.tracks.forEach(track => {
      track.items.forEach(clip => {
        transforms[clip.id] = this.getClipTransform(clip.id, time);
      });
    });
    return transforms;
  }

  // Export motion graphics settings
  exportSettings() {
    return {
      motionBlur: {
        enabled: this.container.querySelector('#motionBlurEnabled').checked,
        amount: parseFloat(this.container.querySelector('#blurAmount').value),
        samples: parseInt(this.container.querySelector('#blurSamples').value)
      },
      speedRamping: {
        keyframes: [...this.speedRamping.keyframes]
      },
      layerParenting: {
        relationships: {}
      },
      effects: {
        dropShadow: {
          enabled: this.container.querySelector('#dropShadowEnabled').checked,
          distance: parseInt(this.container.querySelector('#shadowDistance').value),
          blur: parseInt(this.container.querySelector('#shadowBlur').value),
          color: this.container.querySelector('#shadowColor').value
        },
        glow: {
          enabled: this.container.querySelector('#glowEnabled').checked,
          intensity: parseInt(this.container.querySelector('#glowIntensity').value),
          color: this.container.querySelector('#glowColor').value
        }
      }
    };
  }
}</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/src/lib/editor/motionGraphicsTools.js