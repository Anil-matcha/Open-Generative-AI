/**
 * 3D Camera Effects System
 * Professional cinematic camera movements for timeline clips
 */

export class CameraEffects {
  constructor(container, options = {}) {
    this.container = container;
    this.keyframeSystem = options.keyframeSystem;
    this.timelineState = options.timelineState;
    this.onPreviewUpdate = options.onPreviewUpdate || (() => {});
    this.onKeyframeUpdate = options.onKeyframeUpdate || (() => {});

    // Camera effect types with their default parameters
    this.effectTypes = {
      shake: {
        name: 'Camera Shake',
        icon: '📹',
        description: 'Random camera shake for impact or earthquake effects',
        parameters: {
          intensity: { type: 'range', min: 1, max: 50, default: 10, unit: 'px', label: 'Intensity' },
          duration: { type: 'range', min: 0.5, max: 10, default: 2, unit: 's', label: 'Duration' },
          frequency: { type: 'range', min: 5, max: 30, default: 15, unit: 'Hz', label: 'Frequency' },
          decay: { type: 'range', min: 0, max: 1, default: 0.8, step: 0.1, unit: '', label: 'Decay' }
        }
      },
      hitchcock: {
        name: 'Hitchcock Zoom',
        icon: '🔍',
        description: 'Zoom in while panning out (or vice versa) for dramatic effect',
        parameters: {
          startScale: { type: 'range', min: 50, max: 200, default: 100, unit: '%', label: 'Start Scale' },
          endScale: { type: 'range', min: 50, max: 200, default: 150, unit: '%', label: 'End Scale' },
          direction: { type: 'select', options: ['in', 'out'], default: 'in', label: 'Direction' },
          duration: { type: 'range', min: 1, max: 20, default: 5, unit: 's', label: 'Duration' },
          easing: { type: 'select', options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'], default: 'ease-in-out', label: 'Easing' }
        }
      },
      orbit: {
        name: 'Orbit',
        icon: '🔄',
        description: 'Circular camera movement around a center point',
        parameters: {
          radius: { type: 'range', min: 10, max: 200, default: 50, unit: 'px', label: 'Radius' },
          speed: { type: 'range', min: 0.1, max: 5, default: 1, step: 0.1, unit: 'rev/s', label: 'Speed' },
          direction: { type: 'select', options: ['clockwise', 'counterclockwise'], default: 'clockwise', label: 'Direction' },
          duration: { type: 'range', min: 1, max: 30, default: 10, unit: 's', label: 'Duration' },
          centerX: { type: 'range', min: -100, max: 100, default: 0, unit: '%', label: 'Center X' },
          centerY: { type: 'range', min: -100, max: 100, default: 0, unit: '%', label: 'Center Y' }
        }
      },
      'pan-left': {
        name: 'Pan Left',
        icon: '⬅️',
        description: 'Horizontal camera pan to the left',
        parameters: {
          distance: { type: 'range', min: 10, max: 500, default: 100, unit: 'px', label: 'Distance' },
          duration: { type: 'range', min: 1, max: 20, default: 5, unit: 's', label: 'Duration' },
          easing: { type: 'select', options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'], default: 'ease-in-out', label: 'Easing' },
          speedRamping: { type: 'checkbox', default: false, label: 'Speed Ramping' }
        }
      },
      'pan-right': {
        name: 'Pan Right',
        icon: '➡️',
        description: 'Horizontal camera pan to the right',
        parameters: {
          distance: { type: 'range', min: 10, max: 500, default: 100, unit: 'px', label: 'Distance' },
          duration: { type: 'range', min: 1, max: 20, default: 5, unit: 's', label: 'Duration' },
          easing: { type: 'select', options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'], default: 'ease-in-out', label: 'Easing' },
          speedRamping: { type: 'checkbox', default: false, label: 'Speed Ramping' }
        }
      },
      'tilt-up': {
        name: 'Tilt Up',
        icon: '⬆️',
        description: 'Vertical camera tilt upward',
        parameters: {
          distance: { type: 'range', min: 10, max: 500, default: 100, unit: 'px', label: 'Distance' },
          duration: { type: 'range', min: 1, max: 20, default: 5, unit: 's', label: 'Duration' },
          easing: { type: 'select', options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'], default: 'ease-in-out', label: 'Easing' },
          speedRamping: { type: 'checkbox', default: false, label: 'Speed Ramping' }
        }
      },
      'tilt-down': {
        name: 'Tilt Down',
        icon: '⬇️',
        description: 'Vertical camera tilt downward',
        parameters: {
          distance: { type: 'range', min: 10, max: 500, default: 100, unit: 'px', label: 'Distance' },
          duration: { type: 'range', min: 1, max: 20, default: 5, unit: 's', label: 'Duration' },
          easing: { type: 'select', options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'], default: 'ease-in-out', label: 'Easing' },
          speedRamping: { type: 'checkbox', default: false, label: 'Speed Ramping' }
        }
      }
    };

    this.currentEffect = null;
    this.currentParameters = {};
    this.selectedClipId = null;
    this.previewInterval = null;
    this.isPreviewing = false;

    this.initializeUI();
  }

  initializeUI() {
    this.container.innerHTML = `
      <div class="camera-effects-panel">
        <div class="effects-header">
          <h3>🎥 Camera Effects</h3>
          <div class="preview-controls">
            <button class="preview-btn" id="previewBtn">▶️ Preview</button>
            <button class="apply-btn" id="applyBtn">Apply Effect</button>
          </div>
        </div>

        <div class="effects-selector">
          <label>Effect Type:</label>
          <select id="effectSelect">
            <option value="">Select Effect...</option>
          </select>
        </div>

        <div class="effect-description" id="effectDescription"></div>

        <div class="parameters-panel" id="parametersPanel"></div>

        <div class="timeline-preview" id="timelinePreview">
          <div class="preview-track">
            <div class="clip-visualization" id="clipVisualization"></div>
            <div class="effect-keyframes" id="effectKeyframes"></div>
          </div>
          <div class="time-markers" id="timeMarkers"></div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.populateEffectSelector();
  }

  bindEvents() {
    const effectSelect = this.container.querySelector('#effectSelect');
    const previewBtn = this.container.querySelector('#previewBtn');
    const applyBtn = this.container.querySelector('#applyBtn');

    effectSelect.addEventListener('change', (e) => {
      this.selectEffect(e.target.value);
    });

    previewBtn.addEventListener('click', () => {
      this.togglePreview();
    });

    applyBtn.addEventListener('click', () => {
      this.applyEffect();
    });

    // Parameter change events are bound dynamically when parameters are created
  }

  populateEffectSelector() {
    const select = this.container.querySelector('#effectSelect');
    select.innerHTML = '<option value="">Select Effect...</option>';

    Object.entries(this.effectTypes).forEach(([key, effect]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${effect.icon} ${effect.name}`;
      select.appendChild(option);
    });
  }

  selectEffect(effectKey) {
    if (!effectKey) {
      this.currentEffect = null;
      this.showEffectDescription('');
      this.showParameters({});
      return;
    }

    this.currentEffect = effectKey;
    const effect = this.effectTypes[effectKey];

    // Initialize parameters with defaults
    this.currentParameters = {};
    Object.entries(effect.parameters).forEach(([key, param]) => {
      this.currentParameters[key] = param.default;
    });

    this.showEffectDescription(effect.description);
    this.showParameters(effect.parameters);
    this.updateTimelinePreview();
  }

  showEffectDescription(description) {
    const descEl = this.container.querySelector('#effectDescription');
    descEl.textContent = description;
  }

  showParameters(parameters) {
    const panel = this.container.querySelector('#parametersPanel');
    panel.innerHTML = '';

    Object.entries(parameters).forEach(([key, param]) => {
      const paramEl = this.createParameterControl(key, param);
      panel.appendChild(paramEl);
    });
  }

  createParameterControl(key, param) {
    const container = document.createElement('div');
    container.className = 'parameter-control';

    const label = document.createElement('label');
    label.textContent = param.label;
    container.appendChild(label);

    let input;

    if (param.type === 'range') {
      input = document.createElement('input');
      input.type = 'range';
      input.min = param.min;
      input.max = param.max;
      input.step = param.step || 1;
      input.value = this.currentParameters[key];

      const valueDisplay = document.createElement('span');
      valueDisplay.className = 'value-display';
      valueDisplay.textContent = `${input.value}${param.unit}`;

      input.addEventListener('input', (e) => {
        this.currentParameters[key] = parseFloat(e.target.value);
        valueDisplay.textContent = `${e.target.value}${param.unit}`;
        this.updateTimelinePreview();
      });

      container.appendChild(input);
      container.appendChild(valueDisplay);

    } else if (param.type === 'select') {
      input = document.createElement('select');
      param.options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option;
        optionEl.textContent = option;
        input.appendChild(optionEl);
      });
      input.value = this.currentParameters[key];

      input.addEventListener('change', (e) => {
        this.currentParameters[key] = e.target.value;
        this.updateTimelinePreview();
      });

      container.appendChild(input);

    } else if (param.type === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = this.currentParameters[key];

      input.addEventListener('change', (e) => {
        this.currentParameters[key] = e.target.checked;
        this.updateTimelinePreview();
      });

      container.appendChild(input);
    }

    return container;
  }

  updateTimelinePreview() {
    if (!this.currentEffect || !this.selectedClipId) return;

    const clip = this.getSelectedClip();
    if (!clip) return;

    const keyframes = this.generateEffectKeyframes(this.currentEffect, this.currentParameters, clip);
    this.visualizeKeyframes(keyframes);
  }

  generateEffectKeyframes(effectType, params, clip) {
    const keyframes = [];
    const clipStart = clip.startTime / 1000; // Convert to seconds
    const clipDuration = (clip.endTime - clip.startTime) / 1000;

    switch (effectType) {
      case 'shake':
        keyframes.push(...this.generateShakeKeyframes(params, clipStart, clipDuration));
        break;
      case 'hitchcock':
        keyframes.push(...this.generateHitchcockKeyframes(params, clipStart, clipDuration));
        break;
      case 'orbit':
        keyframes.push(...this.generateOrbitKeyframes(params, clipStart, clipDuration));
        break;
      case 'pan-left':
      case 'pan-right':
        keyframes.push(...this.generatePanKeyframes(effectType, params, clipStart, clipDuration));
        break;
      case 'tilt-up':
      case 'tilt-down':
        keyframes.push(...this.generateTiltKeyframes(effectType, params, clipStart, clipDuration));
        break;
    }

    return keyframes;
  }

  generateShakeKeyframes(params, startTime, duration) {
    const keyframes = [];
    const { intensity, frequency, decay } = params;
    const numKeyframes = Math.floor(frequency * duration);

    for (let i = 0; i <= numKeyframes; i++) {
      const t = i / numKeyframes;
      const time = startTime + t * duration;

      // Exponential decay
      const currentIntensity = intensity * Math.pow(1 - t, decay);

      // Random shake values
      const shakeX = (Math.random() - 0.5) * 2 * currentIntensity;
      const shakeY = (Math.random() - 0.5) * 2 * currentIntensity;

      keyframes.push({
        time,
        properties: {
          x: shakeX,
          y: shakeY
        }
      });
    }

    return keyframes;
  }

  generateHitchcockKeyframes(params, startTime, duration) {
    const keyframes = [];
    const { startScale, endScale, direction } = params;

    // Start keyframe
    keyframes.push({
      time: startTime,
      properties: {
        scale: direction === 'in' ? startScale : endScale
      }
    });

    // End keyframe
    keyframes.push({
      time: startTime + duration,
      properties: {
        scale: direction === 'in' ? endScale : startScale
      }
    });

    return keyframes;
  }

  generateOrbitKeyframes(params, startTime, duration) {
    const keyframes = [];
    const { radius, speed, direction, centerX, centerY } = params;
    const numKeyframes = Math.max(30, Math.floor(speed * duration * 10)); // At least 30 keyframes

    for (let i = 0; i <= numKeyframes; i++) {
      const t = i / numKeyframes;
      const time = startTime + t * duration;

      // Calculate angle based on direction and speed
      const angle = t * speed * 2 * Math.PI * (direction === 'clockwise' ? 1 : -1);

      // Convert polar to cartesian coordinates
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      keyframes.push({
        time,
        properties: { x, y }
      });
    }

    return keyframes;
  }

  generatePanKeyframes(effectType, params, startTime, duration) {
    const keyframes = [];
    const { distance, speedRamping } = params;

    const direction = effectType === 'pan-left' ? -1 : 1;

    if (speedRamping) {
      // Speed ramping: slow start, fast middle, slow end
      const rampPoints = [
        { time: startTime, x: 0 },
        { time: startTime + duration * 0.1, x: distance * 0.05 },
        { time: startTime + duration * 0.5, x: distance * 0.8 },
        { time: startTime + duration * 0.9, x: distance * 0.95 },
        { time: startTime + duration, x: distance }
      ];

      rampPoints.forEach(point => {
        keyframes.push({
          time: point.time,
          properties: { x: point.x * direction }
        });
      });
    } else {
      // Linear pan
      keyframes.push({
        time: startTime,
        properties: { x: 0 }
      });

      keyframes.push({
        time: startTime + duration,
        properties: { x: distance * direction }
      });
    }

    return keyframes;
  }

  generateTiltKeyframes(effectType, params, startTime, duration) {
    const keyframes = [];
    const { distance, speedRamping } = params;

    const direction = effectType === 'tilt-up' ? -1 : 1;

    if (speedRamping) {
      // Similar speed ramping as pan
      const rampPoints = [
        { time: startTime, y: 0 },
        { time: startTime + duration * 0.1, y: distance * 0.05 },
        { time: startTime + duration * 0.5, y: distance * 0.8 },
        { time: startTime + duration * 0.9, y: distance * 0.95 },
        { time: startTime + duration, y: distance }
      ];

      rampPoints.forEach(point => {
        keyframes.push({
          time: point.time,
          properties: { y: point.y * direction }
        });
      });
    } else {
      // Linear tilt
      keyframes.push({
        time: startTime,
        properties: { y: 0 }
      });

      keyframes.push({
        time: startTime + duration,
        properties: { y: distance * direction }
      });
    }

    return keyframes;
  }

  visualizeKeyframes(keyframes) {
    const visualization = this.container.querySelector('#clipVisualization');
    const keyframeMarkers = this.container.querySelector('#effectKeyframes');
    const timeMarkers = this.container.querySelector('#timeMarkers');

    // Get clip duration for scaling
    const clip = this.getSelectedClip();
    if (!clip) return;

    const clipDuration = (clip.endTime - clip.startTime) / 1000;

    // Clear previous visualization
    visualization.innerHTML = '';
    keyframeMarkers.innerHTML = '';
    timeMarkers.innerHTML = '';

    // Create clip visualization bar
    const clipBar = document.createElement('div');
    clipBar.className = 'clip-bar';
    clipBar.style.width = '100%';
    visualization.appendChild(clipBar);

    // Create time markers
    for (let i = 0; i <= clipDuration; i += Math.max(1, Math.floor(clipDuration / 10))) {
      const marker = document.createElement('div');
      marker.className = 'time-marker';
      marker.style.left = `${(i / clipDuration) * 100}%`;
      marker.textContent = `${i}s`;
      timeMarkers.appendChild(marker);
    }

    // Create keyframe markers
    keyframes.forEach(kf => {
      const marker = document.createElement('div');
      marker.className = 'keyframe-marker';
      marker.style.left = `${((kf.time - clip.startTime / 1000) / clipDuration) * 100}%`;

      // Tooltip showing keyframe properties
      const properties = Object.entries(kf.properties)
        .map(([prop, value]) => `${prop}: ${value.toFixed(1)}`)
        .join(', ');
      marker.title = `Time: ${kf.time.toFixed(1)}s\n${properties}`;

      keyframeMarkers.appendChild(marker);
    });
  }

  togglePreview() {
    if (this.isPreviewing) {
      this.stopPreview();
    } else {
      this.startPreview();
    }
  }

  startPreview() {
    if (!this.currentEffect || !this.selectedClipId) return;

    const previewBtn = this.container.querySelector('#previewBtn');
    previewBtn.textContent = '⏹️ Stop';
    previewBtn.classList.add('active');
    this.isPreviewing = true;

    const clip = this.getSelectedClip();
    if (!clip) return;

    const keyframes = this.generateEffectKeyframes(this.currentEffect, this.currentParameters, clip);
    const duration = (clip.endTime - clip.startTime) / 1000;

    let currentTime = 0;
    const fps = 30;
    const frameInterval = 1000 / fps;

    this.previewInterval = setInterval(() => {
      currentTime += frameInterval / 1000;

      if (currentTime >= duration) {
        currentTime = 0; // Loop preview
      }

      // Find interpolated values at current time
      const interpolatedValues = this.interpolateKeyframeValues(keyframes, clip.startTime / 1000 + currentTime);

      // Update preview
      this.onPreviewUpdate(this.selectedClipId, interpolatedValues);

    }, frameInterval);
  }

  stopPreview() {
    if (this.previewInterval) {
      clearInterval(this.previewInterval);
      this.previewInterval = null;
    }

    const previewBtn = this.container.querySelector('#previewBtn');
    previewBtn.textContent = '▶️ Preview';
    previewBtn.classList.remove('active');
    this.isPreviewing = false;

    // Reset to original state
    this.onPreviewUpdate(this.selectedClipId, { x: 0, y: 0, scale: 100, rotation: 0 });
  }

  interpolateKeyframeValues(keyframes, time) {
    const result = { x: 0, y: 0, scale: 100, rotation: 0 };

    // Group keyframes by property
    const propertyKeyframes = {};
    keyframes.forEach(kf => {
      Object.entries(kf.properties).forEach(([prop, value]) => {
        if (!propertyKeyframes[prop]) {
          propertyKeyframes[prop] = [];
        }
        propertyKeyframes[prop].push({ time: kf.time, value });
      });
    });

    // Interpolate each property
    Object.entries(propertyKeyframes).forEach(([prop, propKeyframes]) => {
      propKeyframes.sort((a, b) => a.time - b.time);

      if (propKeyframes.length === 1) {
        result[prop] = propKeyframes[0].value;
      } else {
        // Find surrounding keyframes
        const before = propKeyframes.findLast(kf => kf.time <= time);
        const after = propKeyframes.find(kf => kf.time > time);

        if (before && after) {
          const t = (time - before.time) / (after.time - before.time);
          result[prop] = before.value + (after.value - before.value) * t;
        } else if (before) {
          result[prop] = before.value;
        } else if (after) {
          result[prop] = after.value;
        }
      }
    });

    return result;
  }

  applyEffect() {
    if (!this.currentEffect || !this.selectedClipId || !this.keyframeSystem) return;

    const clip = this.getSelectedClip();
    if (!clip) return;

    const keyframes = this.generateEffectKeyframes(this.currentEffect, this.currentParameters, clip);

    // Apply keyframes to the keyframe system
    keyframes.forEach(kf => {
      Object.entries(kf.properties).forEach(([property, value]) => {
        this.keyframeSystem.createKeyframe(
          this.selectedClipId,
          kf.time,
          property,
          value,
          this.currentParameters.easing || 'linear'
        );
      });
    });

    // Notify about keyframe updates
    this.onKeyframeUpdate();

    // Show success feedback
    this.showSuccessMessage('Camera effect applied successfully!');
  }

  showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;

    this.container.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  getSelectedClip() {
    if (!this.timelineState || !this.selectedClipId) return null;

    // Find the clip across all tracks
    for (const track of this.timelineState.tracks || []) {
      const clip = track.clips?.find(c => c.id === this.selectedClipId);
      if (clip) return clip;
    }

    return null;
  }

  setSelectedClip(clipId) {
    this.selectedClipId = clipId;
    this.updateTimelinePreview();
  }

  destroy() {
    this.stopPreview();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// CSS styles for the camera effects panel
const cameraEffectsStyles = `
.camera-effects-panel {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.effects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.effects-header h3 {
  margin: 0;
  color: white;
}

.preview-controls {
  display: flex;
  gap: 8px;
}

.preview-btn, .apply-btn {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.preview-btn:hover, .apply-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.preview-btn.active {
  background: rgba(0, 150, 255, 0.3);
  border-color: rgba(0, 150, 255, 0.5);
}

.apply-btn {
  background: rgba(0, 255, 150, 0.1);
  border-color: rgba(0, 255, 150, 0.3);
}

.apply-btn:hover {
  background: rgba(0, 255, 150, 0.2);
}

.effects-selector {
  margin-bottom: 12px;
}

.effects-selector label {
  display: block;
  color: white;
  margin-bottom: 4px;
  font-weight: 500;
}

#effectSelect {
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
}

.effect-description {
  margin-bottom: 16px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  min-height: 20px;
}

.parameters-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.parameter-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.parameter-control label {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.parameter-control input[type="range"] {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  -webkit-appearance: none;
}

.parameter-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(0, 150, 255, 0.8);
  cursor: pointer;
}

.parameter-control select {
  padding: 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
}

.parameter-control input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.value-display {
  color: rgba(0, 150, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
  text-align: right;
}

.timeline-preview {
  margin-top: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.preview-track {
  position: relative;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;
}

.clip-visualization {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.clip-bar {
  height: 100%;
  background: linear-gradient(90deg, rgba(0, 150, 255, 0.3), rgba(0, 200, 255, 0.5));
  border-radius: 4px;
}

.effect-keyframes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.keyframe-marker {
  position: absolute;
  top: 2px;
  width: 2px;
  height: 36px;
  background: rgba(255, 255, 0, 0.8);
  border-radius: 1px;
  transform: translateX(-1px);
}

.time-markers {
  position: relative;
  height: 20px;
  display: flex;
  align-items: center;
}

.time-marker {
  position: absolute;
  top: 0;
  width: 1px;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  padding-left: 2px;
}

.success-notification {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 12px 16px;
  background: rgba(0, 255, 150, 0.9);
  color: white;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 255, 150, 0.3);
  z-index: 1000;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = cameraEffectsStyles;
  document.head.appendChild(styleSheet);
}