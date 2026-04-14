/**
 * Animation Controls
 * Professional animation playback and control system
 *
 * Includes rendiv animation primitives for advanced interpolation
 */

// Rendiv-style animation primitives
export function interpolate(frame, inputRange, outputRange, easing = 'linear') {
  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must have the same length');
  }

  if (frame < inputRange[0]) {
    return outputRange[0];
  }

  if (frame > inputRange[inputRange.length - 1]) {
    return outputRange[outputRange.length - 1];
  }

  let i = 0;
  for (; i < inputRange.length - 1; i++) {
    if (frame <= inputRange[i + 1]) {
      break;
    }
  }

  const inputStart = inputRange[i];
  const inputEnd = inputRange[i + 1];
  const outputStart = outputRange[i];
  const outputEnd = outputRange[i + 1];

  const t = (frame - inputStart) / (inputEnd - inputStart);
  const easedT = applyEasing(easing, t);

  if (typeof outputStart === 'string' && typeof outputEnd === 'string') {
    // Color interpolation
    return blendColors(easedT, outputStart, outputEnd);
  }

  return outputStart + (outputEnd - outputStart) * easedT;
}

export function spring({ frame, fps, config = {} }) {
  const {
    damping = 12,
    mass = 1,
    stiffness = 100,
    restDelta = 0.001,
    restSpeed = 0.001
  } = config;

  // Simple spring simulation using semi-implicit Euler integration
  const dt = 1 / fps;
  const k = -stiffness;
  const d = -damping;

  let position = 0;
  let velocity = 0;
  let target = 1;

  for (let f = 0; f <= frame; f++) {
    const Fspring = k * (position - target);
    const Fdamping = d * velocity;

    const a = (Fspring + Fdamping) / mass;
    velocity += a * dt;
    position += velocity * dt;

    // Check if spring has settled
    if (Math.abs(velocity) < restSpeed && Math.abs(position - target) < restDelta) {
      return target;
    }
  }

  return position;
}

export function blendColors(value, color1, color2) {
  // Parse hex colors to RGB
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  if (!c1 || !c2) return color1; // Fallback to first color

  const r = Math.round(c1.r + (c2.r - c1.r) * value);
  const g = Math.round(c1.g + (c2.g - c1.g) * value);
  const b = Math.round(c1.b + (c2.b - c1.b) * value);

  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function applyEasing(easing, t) {
  switch (easing) {
    case 'linear':
      return t;
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return 1 - Math.pow(1 - t, 2);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case 'bounce':
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    case 'elastic':
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    default:
      return t;
  }
}

export function getSpringDuration(config = {}) {
  const { damping = 12, mass = 1, stiffness = 100 } = config;

  // Estimate duration based on spring parameters
  // This is a simplified approximation
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  if (zeta >= 1) {
    // Overdamped
    return 1.0;
  } else {
    // Underdamped
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    return Math.log(100) / (zeta * omega); // Time to reach 1% of target
  }
}

// Perlin noise generator for organic animations
class PerlinNoise {
  constructor() {
    this.permutation = [];
    this.init();
  }

  init() {
    // Initialize permutation array
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    // Shuffle the array
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }

    // Duplicate the array to avoid overflow
    this.permutation = [...this.permutation, ...this.permutation];
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return a + t * (b - a);
  }

  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise3D(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;

    return this.lerp(
      this.lerp(
        this.lerp(this.grad(this.permutation[AA], x, y, z), this.grad(this.permutation[BA], x - 1, y, z), u),
        this.lerp(this.grad(this.permutation[AB], x, y - 1, z), this.grad(this.permutation[BB], x - 1, y - 1, z), u),
        v
      ),
      this.lerp(
        this.lerp(this.grad(this.permutation[AA + 1], x, y, z - 1), this.grad(this.permutation[BA + 1], x - 1, y, z - 1), u),
        this.lerp(this.grad(this.permutation[AB + 1], x, y - 1, z - 1), this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    );
  }

  noise2D(x, y) {
    return this.noise3D(x, y, 0);
  }
}

// Global noise instance
const noiseInstance = new PerlinNoise();

export function noise2D(x, y) {
  return noiseInstance.noise2D(x, y);
}

export function noise3D(x, y, z) {
  return noiseInstance.noise3D(x, y, z);
}

// Sequence and timing utilities
export function useSequence(startFrame, durationInFrames) {
  return {
    from: startFrame,
    durationInFrames,
    to: startFrame + durationInFrames
  };
}

export function useSeries(sequences) {
  let currentFrame = 0;
  return sequences.map(seq => ({
    ...seq,
    from: currentFrame,
    to: currentFrame + seq.durationInFrames,
    _start: currentFrame += seq.durationInFrames
  }));
}

export class AnimationControls {
  constructor(container, keyframeSystem, timelineState) {
    this.container = container;
    this.keyframeSystem = keyframeSystem;
    this.timelineState = timelineState;
    this.isPlaying = false;
    this.loop = false;
    this.reverse = false;
    this.speed = 1.0;
    this.animationFrame = null;
    this.startTime = 0;
    this.pausedTime = 0;

    this.init();
  }

  init() {
    this.createUI();
    this.bindEvents();
  }

  createUI() {
    this.container.innerHTML = `
      <div class="animation-controls">
        <div class="playback-controls">
          <button id="playBtn" class="control-btn primary">
            <span class="icon">▶</span>
            <span class="label">Play</span>
          </button>
          <button id="pauseBtn" class="control-btn">
            <span class="icon">⏸</span>
            <span class="label">Pause</span>
          </button>
          <button id="stopBtn" class="control-btn">
            <span class="icon">⏹</span>
            <span class="label">Stop</span>
          </button>
          <button id="rewindBtn" class="control-btn">
            <span class="icon">⏮</span>
            <span class="label">Rewind</span>
          </button>
        </div>

        <div class="loop-controls">
          <label class="control-label">
            <input type="checkbox" id="loopToggle">
            Loop
          </label>
          <label class="control-label">
            <input type="checkbox" id="reverseToggle">
            Reverse
          </label>
        </div>

        <div class="speed-control">
          <label class="control-label">Speed:</label>
          <input type="range" id="speedSlider" min="0.1" max="4" step="0.1" value="1">
          <span id="speedValue">1.0x</span>
        </div>

        <div class="easing-preview">
          <canvas id="easingCanvas" width="200" height="60"></canvas>
        </div>

        <div class="animation-info">
          <div class="info-item">
            <span class="label">Duration:</span>
            <span id="durationDisplay">00:00.00</span>
          </div>
          <div class="info-item">
            <span class="label">Current:</span>
            <span id="currentTimeDisplay">00:00.00</span>
          </div>
          <div class="info-item">
            <span class="label">Progress:</span>
            <span id="progressDisplay">0%</span>
          </div>
        </div>
      </div>
    `;

    this.addStyles();
  }

  addStyles() {
    const styles = `
      .animation-controls {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px;
        background: rgba(0,0,0,0.2);
        border: 1px solid var(--border);
        border-radius: 8px;
        flex-wrap: wrap;
      }

      .playback-controls {
        display: flex;
        gap: 8px;
      }

      .control-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border: 1px solid var(--border);
        background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.8);
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.15s ease;
      }

      .control-btn:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(34,211,238,0.3);
      }

      .control-btn.primary {
        background: rgba(34,211,238,0.2);
        border-color: rgba(34,211,238,0.4);
        color: #cffafe;
      }

      .control-btn .icon {
        font-size: 14px;
      }

      .loop-controls {
        display: flex;
        gap: 12px;
      }

      .control-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: rgba(255,255,255,0.7);
        cursor: pointer;
      }

      .control-label input[type="checkbox"] {
        margin: 0;
      }

      .speed-control {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .speed-control input[type="range"] {
        width: 80px;
      }

      .speed-control #speedValue {
        font-size: 11px;
        color: rgba(255,255,255,0.8);
        min-width: 30px;
      }

      .easing-preview {
        flex: 1;
        min-width: 200px;
      }

      .easing-preview canvas {
        width: 100%;
        height: 60px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: rgba(0,0,0,0.2);
      }

      .animation-info {
        display: flex;
        gap: 16px;
        font-size: 11px;
        color: rgba(255,255,255,0.6);
      }

      .info-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      .info-item .label {
        font-weight: 600;
        color: rgba(255,255,255,0.5);
      }

      @media (max-width: 768px) {
        .animation-controls {
          flex-direction: column;
          align-items: stretch;
        }

        .playback-controls,
        .loop-controls,
        .speed-control,
        .animation-info {
          justify-content: center;
        }

        .easing-preview {
          order: -1;
          min-width: auto;
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  bindEvents() {
    // Playback controls
    this.container.querySelector('#playBtn').addEventListener('click', () => {
      this.play();
    });

    this.container.querySelector('#pauseBtn').addEventListener('click', () => {
      this.pause();
    });

    this.container.querySelector('#stopBtn').addEventListener('click', () => {
      this.stop();
    });

    this.container.querySelector('#rewindBtn').addEventListener('click', () => {
      this.rewind();
    });

    // Loop and reverse controls
    this.container.querySelector('#loopToggle').addEventListener('change', (e) => {
      this.loop = e.target.checked;
    });

    this.container.querySelector('#reverseToggle').addEventListener('change', (e) => {
      this.reverse = e.target.checked;
    });

    // Speed control
    const speedSlider = this.container.querySelector('#speedSlider');
    speedSlider.addEventListener('input', (e) => {
      this.speed = parseFloat(e.target.value);
      this.container.querySelector('#speedValue').textContent = `${this.speed.toFixed(1)}x`;
    });
  }

  play() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.startTime = performance.now() - this.pausedTime;
    this.animate();

    // Update UI
    this.updatePlaybackButtons();
  }

  pause() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.pausedTime = performance.now() - this.startTime;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.updatePlaybackButtons();
  }

  stop() {
    this.isPlaying = false;
    this.pausedTime = 0;
    this.timelineState.playheadPercent = 0;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.updatePlaybackButtons();
    this.updateInfo();
  }

  rewind() {
    this.timelineState.playheadPercent = 0;
    this.pausedTime = 0;
    this.updateInfo();
  }

  animate() {
    if (!this.isPlaying) return;

    const currentTime = performance.now();
    const elapsed = (currentTime - this.startTime) * this.speed / 1000; // Convert to seconds

    let progress = elapsed / this.timelineState.timelineSeconds;

    if (this.reverse) {
      progress = 1 - progress;
    }

    if (this.loop) {
      progress = progress % 1;
      if (this.reverse) {
        progress = 1 - progress;
      }
    } else if (progress >= 1) {
      this.stop();
      return;
    }

    this.timelineState.playheadPercent = Math.max(0, Math.min(100, progress * 100));

    this.updateInfo();
    this.renderEasingPreview();

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  updatePlaybackButtons() {
    const playBtn = this.container.querySelector('#playBtn');
    const pauseBtn = this.container.querySelector('#pauseBtn');

    if (this.isPlaying) {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'flex';
    } else {
      playBtn.style.display = 'flex';
      pauseBtn.style.display = 'none';
    }
  }

  updateInfo() {
    const duration = this.timelineState.timelineSeconds;
    const current = (this.timelineState.playheadPercent / 100) * duration;
    const progress = this.timelineState.playheadPercent;

    this.container.querySelector('#durationDisplay').textContent = this.formatTime(duration);
    this.container.querySelector('#currentTimeDisplay').textContent = this.formatTime(current);
    this.container.querySelector('#progressDisplay').textContent = `${progress.toFixed(1)}%`;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hundredths = Math.floor((seconds % 1) * 100);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  }

  renderEasingPreview() {
    const canvas = this.container.querySelector('#easingCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      const y = (i / 10) * height;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Draw easing curve based on current keyframes
    // This is a simplified preview - in a real implementation you'd sample the actual animation
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i <= width; i++) {
      const t = i / width;
      const easedT = this.applyEasing('ease-out', t); // Default easing for preview
      const x = i;
      const y = height - (easedT * height);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  applyEasing(easing, t) {
    switch (easing) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - Math.pow(1 - t, 2);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      default:
        return t;
    }
  }

  // Animation presets and utilities
  applyPreset(preset) {
    const presets = {
      'bounce-in': { easing: 'ease-out', duration: 0.6 },
      'fade-in': { easing: 'ease-in', duration: 0.3 },
      'slide-in-left': { easing: 'ease-out', duration: 0.4 },
      'scale-in': { easing: 'ease-out', duration: 0.3 },
      'rotate-in': { easing: 'ease-out', duration: 0.5 }
    };

    if (presets[preset]) {
      // Apply preset settings
      // This would typically update the keyframe system
      console.log(`Applying preset: ${preset}`, presets[preset]);
    }
  }

  // Rendiv-style spring animation
  applySpringAnimation(property, config = {}) {
    const fps = 30; // Assume 30fps for animation calculations
    const frame = (this.timelineState.playheadPercent / 100) * this.timelineState.timelineSeconds * fps;

    const springValue = spring({ frame, fps, config });

    // Apply to keyframe system
    if (this.keyframeSystem && this.keyframeSystem.setProperty) {
      this.keyframeSystem.setProperty(property, springValue);
    }

    return springValue;
  }

  // Organic noise animation
  applyNoiseAnimation(property, frequency = 0.05, amplitude = 1) {
    const frame = (this.timelineState.playheadPercent / 100) * this.timelineState.timelineSeconds * 30;
    const noiseValue = noise2D(frame * frequency, 0) * amplitude;

    // Apply to keyframe system
    if (this.keyframeSystem && this.keyframeSystem.setProperty) {
      this.keyframeSystem.setProperty(property, noiseValue);
    }

    return noiseValue;
  }

  exportAnimation() {
    // Export animation data for use in other systems
    return {
      duration: this.timelineState.timelineSeconds,
      keyframes: this.keyframeSystem.serialize(),
      settings: {
        loop: this.loop,
        reverse: this.reverse,
        speed: this.speed
      }
    };
  }

  importAnimation(data) {
    if (data.keyframes) {
      this.keyframeSystem.deserialize(data.keyframes);
    }

    if (data.settings) {
      this.loop = data.settings.loop || false;
      this.reverse = data.settings.reverse || false;
      this.speed = data.settings.speed || 1.0;

      // Update UI
      this.container.querySelector('#loopToggle').checked = this.loop;
      this.container.querySelector('#reverseToggle').checked = this.reverse;
      this.container.querySelector('#speedSlider').value = this.speed;
      this.container.querySelector('#speedValue').textContent = `${this.speed.toFixed(1)}x`;
    }

    this.updateInfo();
  }
}

// Easing curve editor for advanced control
export class EasingCurveEditor {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.points = [0.25, 0.1, 0.25, 1]; // Default cubic bezier
    this.draggingPoint = -1;
    this.onChange = null;

    this.init();
  }

  init() {
    this.createUI();
    this.bindEvents();
    this.render();
  }

  createUI() {
    this.container.innerHTML = `
      <div class="easing-editor">
        <div class="editor-header">
          <h4>Easing Curve Editor</h4>
          <div class="preset-buttons">
            <button class="preset-btn" data-preset="linear">Linear</button>
            <button class="preset-btn" data-preset="ease-in">Ease In</button>
            <button class="preset-btn" data-preset="ease-out">Ease Out</button>
            <button class="preset-btn" data-preset="ease-in-out">Ease In/Out</button>
          </div>
        </div>
        <div class="curve-canvas-container">
          <canvas id="easingCurveCanvas" width="300" height="200"></canvas>
        </div>
        <div class="curve-controls">
          <div class="point-controls">
            <div class="control-group">
              <label>P1 X:</label>
              <input type="number" id="p1x" step="0.01" min="0" max="1" value="0.25">
            </div>
            <div class="control-group">
              <label>P1 Y:</label>
              <input type="number" id="p1y" step="0.01" min="0" max="1" value="0.10">
            </div>
            <div class="control-group">
              <label>P2 X:</label>
              <input type="number" id="p2x" step="0.01" min="0" max="1" value="0.25">
            </div>
            <div class="control-group">
              <label>P2 Y:</label>
              <input type="number" id="p2y" step="0.01" min="0" max="1" value="1.00">
            </div>
          </div>
          <div class="curve-info">
            <span id="curveEquation">cubic-bezier(0.25, 0.1, 0.25, 1)</span>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#easingCurveCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.addStyles();
  }

  addStyles() {
    const styles = `
      .easing-editor {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background: rgba(0,0,0,0.2);
        border: 1px solid var(--border);
        border-radius: 8px;
      }

      .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .editor-header h4 {
        margin: 0;
        color: rgba(255,255,255,0.9);
        font-size: 14px;
      }

      .preset-buttons {
        display: flex;
        gap: 6px;
      }

      .preset-btn {
        padding: 4px 8px;
        border: 1px solid var(--border);
        background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.7);
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.15s ease;
      }

      .preset-btn:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(34,211,238,0.3);
      }

      .preset-btn.active {
        background: rgba(34,211,238,0.2);
        border-color: rgba(34,211,238,0.4);
        color: #cffafe;
      }

      .curve-canvas-container {
        display: flex;
        justify-content: center;
      }

      .curve-canvas-container canvas {
        border: 1px solid var(--border);
        border-radius: 4px;
        background: rgba(0,0,0,0.3);
        cursor: crosshair;
      }

      .curve-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      .point-controls {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        flex: 1;
      }

      .control-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .control-group label {
        font-size: 11px;
        color: rgba(255,255,255,0.7);
        min-width: 35px;
      }

      .control-group input {
        width: 50px;
        padding: 2px 4px;
        background: rgba(0,0,0,0.3);
        border: 1px solid var(--border);
        border-radius: 3px;
        color: white;
        font-size: 11px;
      }

      .curve-info {
        font-family: monospace;
        font-size: 11px;
        color: rgba(34,211,238,0.8);
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  bindEvents() {
    // Canvas interaction
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

    // Preset buttons
    this.container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.target.dataset.preset;
        this.applyPreset(preset);
      });
    });

    // Input controls
    const inputs = ['p1x', 'p1y', 'p2x', 'p2y'];
    inputs.forEach(id => {
      const input = this.container.querySelector(`#${id}`);
      input.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
          const index = inputs.indexOf(id);
          this.points[index] = Math.max(0, Math.min(1, value));
          this.render();
          this.updateEquation();
          if (this.onChange) this.onChange(this.points);
        }
      });
    });
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.canvas.width;
    const y = 1 - (e.clientY - rect.top) / this.canvas.height;

    // Check if clicking near control points
    const pointRadius = 0.05;
    for (let i = 0; i < this.points.length; i += 2) {
      const px = this.points[i];
      const py = this.points[i + 1];
      if (Math.abs(x - px) < pointRadius && Math.abs(y - py) < pointRadius) {
        this.draggingPoint = i / 2;
        return;
      }
    }

    // If not near a point, create a new custom curve
    this.draggingPoint = -1;
  }

  handleMouseMove(e) {
    if (this.draggingPoint === -1) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / this.canvas.width));
    const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / this.canvas.height));

    this.points[this.draggingPoint * 2] = x;
    this.points[this.draggingPoint * 2 + 1] = y;

    this.updateInputs();
    this.render();
    this.updateEquation();

    if (this.onChange) this.onChange(this.points);
  }

  handleMouseUp() {
    this.draggingPoint = -1;
  }

  applyPreset(preset) {
    const presets = {
      linear: [0, 0, 1, 1],
      'ease-in': [0.42, 0, 1, 1],
      'ease-out': [0, 0, 0.58, 1],
      'ease-in-out': [0.42, 0, 0.58, 1]
    };

    if (presets[preset]) {
      this.points = [...presets[preset]];
      this.updateInputs();
      this.render();
      this.updateEquation();
      if (this.onChange) this.onChange(this.points);
    }

    // Update active preset button
    this.container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === preset);
    });
  }

  updateInputs() {
    const inputs = ['p1x', 'p1y', 'p2x', 'p2y'];
    inputs.forEach((id, index) => {
      this.container.querySelector(`#${id}`).value = this.points[index].toFixed(2);
    });
  }

  updateEquation() {
    const equation = `cubic-bezier(${this.points[0].toFixed(2)}, ${this.points[1].toFixed(2)}, ${this.points[2].toFixed(2)}, ${this.points[3].toFixed(2)})`;
    this.container.querySelector('#curveEquation').textContent = equation;
  }

  render() {
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    // Draw grid
    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      const y = (i / 10) * height;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // Draw bezier curve
    this.ctx.strokeStyle = '#22d3ee';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    for (let t = 0; t <= 1; t += 0.005) {
      const x = this.bezierCurve(t, 0, 0, this.points[0], this.points[1], this.points[2], this.points[3], 1, 1) * width;
      const y = height - (this.bezierCurve(t, 0, 0, this.points[1], this.points[0], this.points[3], this.points[2], 1, 1) * height);

      if (t === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    // Draw control lines
    this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);

    // Line from start to P1
    this.ctx.beginPath();
    this.ctx.moveTo(0, height);
    this.ctx.lineTo(this.points[0] * width, height - (this.points[1] * height));
    this.ctx.stroke();

    // Line from end to P2
    this.ctx.beginPath();
    this.ctx.moveTo(width, 0);
    this.ctx.lineTo(this.points[2] * width, height - (this.points[3] * height));
    this.ctx.stroke();

    this.ctx.setLineDash([]);

    // Draw control points
    const pointCoords = [
      { x: 0, y: height, isEndpoint: true }, // Start
      { x: this.points[0] * width, y: height - (this.points[1] * height), isEndpoint: false }, // P1
      { x: this.points[2] * width, y: height - (this.points[3] * height), isEndpoint: false }, // P2
      { x: width, y: 0, isEndpoint: true } // End
    ];

    pointCoords.forEach((point, index) => {
      this.ctx.fillStyle = point.isEndpoint ? '#10b981' : '#22d3ee';
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
      this.ctx.fill();

      if (!point.isEndpoint) {
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    });
  }

  bezierCurve(t, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
    const cx = 3 * (p1x - p0x);
    const bx = 3 * (p2x - p1x) - cx;
    const ax = p3x - p0x - cx - bx;

    const cy = 3 * (p1y - p0y);
    const by = 3 * (p2y - p1y) - cy;
    const ay = p3y - p0y - cy - by;

    return ax * t * t * t + bx * t * t + cx * t + p0x;
  }

  getPoints() {
    return [...this.points];
  }

  setPoints(points) {
    this.points = [...points];
    this.updateInputs();
    this.render();
    this.updateEquation();
  }

  setOnChange(callback) {
    this.onChange = callback;
  }
}
