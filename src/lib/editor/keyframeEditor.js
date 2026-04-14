/**
 * Keyframe Editor Interface
 * Timeline-based keyframe visualization and editing interface
 */

export class KeyframeEditor {
  constructor(container, keyframeSystem, timelineState) {
    this.container = container;
    this.keyframeSystem = keyframeSystem;
    this.timelineState = timelineState;
    this.selectedClipId = null;
    this.selectedProperty = null;
    this.selectedKeyframes = new Set();
    this.zoom = 1;
    this.pan = 0;
    this.dragging = null;
    this.draggingKeyframe = null;

    this.init();
  }

  init() {
    this.createUI();
    this.bindEvents();
    this.render();
  }

  createUI() {
    this.container.innerHTML = `
      <div class="keyframe-editor">
        <div class="keyframe-toolbar">
          <div class="property-selector">
            <select id="propertySelect">
              <option value="">Select Property</option>
              <optgroup label="Position">
                <option value="x">X Position</option>
                <option value="y">Y Position</option>
              </optgroup>
              <optgroup label="Scale">
                <option value="scale">Scale</option>
                <option value="scaleX">Scale X</option>
                <option value="scaleY">Scale Y</option>
              </optgroup>
              <optgroup label="Rotation">
                <option value="rotation">Rotation</option>
                <option value="anchorX">Anchor X</option>
                <option value="anchorY">Anchor Y</option>
              </optgroup>
              <optgroup label="Appearance">
                <option value="opacity">Opacity</option>
                <option value="brightness">Brightness</option>
                <option value="contrast">Contrast</option>
                <option value="saturation">Saturation</option>
              </optgroup>
              <optgroup label="Crop">
                <option value="cropTop">Crop Top</option>
                <option value="cropBottom">Crop Bottom</option>
                <option value="cropLeft">Crop Left</option>
                <option value="cropRight">Crop Right</option>
              </optgroup>
              <optgroup label="Motion">
                <option value="blur">Motion Blur</option>
                <option value="playbackRate">Playback Rate</option>
              </optgroup>
            </select>
          </div>
          <div class="keyframe-controls">
            <button id="addKeyframeBtn" class="mini-btn">Add Keyframe</button>
            <button id="deleteKeyframeBtn" class="mini-btn">Delete</button>
            <button id="copyKeyframesBtn" class="mini-btn">Copy</button>
            <button id="pasteKeyframesBtn" class="mini-btn">Paste</button>
          </div>
          <div class="easing-selector">
            <label>Easing:</label>
            <select id="easingSelect">
              <option value="linear">Linear</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="ease-in-out">Ease In Out</option>
              <option value="bezier">Custom Bezier</option>
            </select>
          </div>
          <div class="interpolation-selector">
            <label>Interpolation:</label>
            <select id="interpolationSelect">
              <option value="smooth">Smooth</option>
              <option value="step">Step</option>
              <option value="hold">Hold</option>
            </select>
          </div>
        </div>
        <div class="keyframe-timeline">
          <div class="timeline-header">
            <div class="time-ruler"></div>
          </div>
          <div class="timeline-body">
            <div class="keyframe-lanes"></div>
            <div class="curve-canvas"></div>
          </div>
        </div>
        <div class="keyframe-properties-panel">
          <div class="property-value-editor">
            <label>Value:</label>
            <input type="number" id="valueInput" step="0.01">
            <span id="unitLabel"></span>
          </div>
          <div class="bezier-editor" id="bezierEditor" style="display: none;">
            <canvas id="bezierCanvas" width="200" height="200"></canvas>
            <div class="bezier-controls">
              <input type="number" id="p1x" placeholder="P1 X" step="0.01">
              <input type="number" id="p1y" placeholder="P1 Y" step="0.01">
              <input type="number" id="p2x" placeholder="P2 X" step="0.01">
              <input type="number" id="p2y" placeholder="P2 Y" step="0.01">
            </div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    this.addStyles();
  }

  addStyles() {
    const styles = `
      .keyframe-editor {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 8px;
      }

      .keyframe-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-bottom: 1px solid var(--border);
        background: rgba(0,0,0,0.2);
        flex-wrap: wrap;
      }

      .property-selector select,
      .easing-selector select,
      .interpolation-selector select {
        padding: 6px 8px;
        background: rgba(0,0,0,0.3);
        border: 1px solid var(--border);
        border-radius: 4px;
        color: white;
        font-size: 12px;
      }

      .keyframe-controls {
        display: flex;
        gap: 6px;
      }

      .keyframe-timeline {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .timeline-header {
        height: 30px;
        border-bottom: 1px solid var(--border);
        background: rgba(0,0,0,0.1);
        position: relative;
      }

      .time-ruler {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px);
        background-size: 20px 100%;
      }

      .timeline-body {
        flex: 1;
        position: relative;
        overflow: auto;
      }

      .keyframe-lanes {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }

      .keyframe-lane {
        position: absolute;
        left: 0;
        right: 0;
        height: 40px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        pointer-events: auto;
      }

      .keyframe-diamond {
        position: absolute;
        width: 12px;
        height: 12px;
        background: #22d3ee;
        transform: rotate(45deg) translate(-50%, -50%);
        border: 2px solid white;
        cursor: pointer;
        pointer-events: auto;
        z-index: 10;
      }

      .keyframe-diamond.selected {
        background: #ef4444;
        border-color: white;
      }

      .keyframe-diamond:hover {
        transform: rotate(45deg) translate(-50%, -50%) scale(1.2);
      }

      .curve-canvas {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }

      .keyframe-properties-panel {
        padding: 12px;
        border-top: 1px solid var(--border);
        background: rgba(0,0,0,0.2);
      }

      .property-value-editor {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .property-value-editor input {
        flex: 1;
        padding: 6px 8px;
        background: rgba(0,0,0,0.3);
        border: 1px solid var(--border);
        border-radius: 4px;
        color: white;
        font-size: 12px;
      }

      .bezier-editor {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .bezier-controls {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .bezier-controls input {
        padding: 4px 6px;
        background: rgba(0,0,0,0.3);
        border: 1px solid var(--border);
        border-radius: 4px;
        color: white;
        font-size: 11px;
      }

      .mini-btn {
        padding: 6px 10px;
        border: 1px solid var(--border);
        background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.8);
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.15s ease;
      }

      .mini-btn:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(34,211,238,0.3);
      }

      .mini-btn:active {
        background: rgba(34,211,238,0.2);
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  bindEvents() {
    // Property selection
    const propertySelect = this.container.querySelector('#propertySelect');
    propertySelect.addEventListener('change', (e) => {
      this.selectedProperty = e.target.value;
      this.render();
    });

    // Keyframe controls
    this.container.querySelector('#addKeyframeBtn').addEventListener('click', () => {
      this.addKeyframeAtPlayhead();
    });

    this.container.querySelector('#deleteKeyframeBtn').addEventListener('click', () => {
      this.deleteSelectedKeyframes();
    });

    this.container.querySelector('#copyKeyframesBtn').addEventListener('click', () => {
      this.copySelectedKeyframes();
    });

    this.container.querySelector('#pasteKeyframesBtn').addEventListener('click', () => {
      this.pasteKeyframes();
    });

    // Easing and interpolation
    const easingSelect = this.container.querySelector('#easingSelect');
    easingSelect.addEventListener('change', (e) => {
      this.updateSelectedKeyframes({ easing: e.target.value });
      this.render();
    });

    const interpolationSelect = this.container.querySelector('#interpolationSelect');
    interpolationSelect.addEventListener('change', (e) => {
      this.updateSelectedKeyframes({ interpolation: e.target.value });
      this.render();
    });

    // Value editor
    const valueInput = this.container.querySelector('#valueInput');
    valueInput.addEventListener('input', (e) => {
      this.updateSelectedKeyframeValue(parseFloat(e.target.value));
    });

    // Timeline interaction
    const timelineBody = this.container.querySelector('.timeline-body');
    timelineBody.addEventListener('click', (e) => {
      if (e.target === timelineBody) {
        const rect = timelineBody.getBoundingClientRect();
        const time = this.pixelsToTime(e.clientX - rect.left);
        this.setPlayhead(time);
      }
    });

    // Bezier editor
    this.setupBezierEditor();
  }

  setSelectedClip(clipId) {
    this.selectedClipId = clipId;
    this.selectedProperty = null;
    this.selectedKeyframes.clear();
    this.render();
  }

  pixelsToTime(pixels) {
    const totalDuration = this.timelineState.timelineSeconds;
    const timelineWidth = this.container.querySelector('.timeline-body').clientWidth;
    return (pixels / timelineWidth) * totalDuration * this.zoom - this.pan;
  }

  timeToPixels(time) {
    const totalDuration = this.timelineState.timelineSeconds;
    const timelineWidth = this.container.querySelector('.timeline-body').clientWidth;
    return ((time + this.pan) / (totalDuration * this.zoom)) * timelineWidth;
  }

  addKeyframeAtPlayhead() {
    if (!this.selectedClipId || !this.selectedProperty) return;

    const time = this.timelineState.playheadPercent * this.timelineState.timelineSeconds / 100;
    const currentValue = this.keyframeSystem.evaluateAtTime(this.selectedClipId, this.selectedProperty, time);

    if (currentValue === null) {
      // Get default value
      const defaultValue = this.getDefaultValue(this.selectedProperty);
      this.keyframeSystem.createKeyframe(this.selectedClipId, time, this.selectedProperty, defaultValue);
    } else {
      this.keyframeSystem.createKeyframe(this.selectedClipId, time, this.selectedProperty, currentValue);
    }

    this.render();
  }

  getDefaultValue(property) {
    const propConfig = ANIMATION_PROPERTIES[property];
    return propConfig ? propConfig.default : 0;
  }

  deleteSelectedKeyframes() {
    if (!this.selectedClipId) return;

    const selectedArray = Array.from(this.selectedKeyframes);
    selectedArray.forEach(keyframeId => {
      const keyframes = this.keyframeSystem.getKeyframes(this.selectedClipId, this.selectedProperty);
      const keyframe = keyframes.find(kf => kf.id === keyframeId);
      if (keyframe) {
        this.keyframeSystem.removeKeyframe(this.selectedClipId, this.selectedProperty, keyframeId);
      }
    });

    this.selectedKeyframes.clear();
    this.render();
  }

  copySelectedKeyframes() {
    if (!this.selectedClipId || this.selectedKeyframes.size === 0) return;

    const keyframesData = {};
    const keyframes = this.keyframeSystem.getKeyframes(this.selectedClipId, this.selectedProperty);

    keyframes.forEach(kf => {
      if (this.selectedKeyframes.has(kf.id)) {
        if (!keyframesData[this.selectedProperty]) {
          keyframesData[this.selectedProperty] = [];
        }
        keyframesData[this.selectedProperty].push({
          time: kf.time,
          value: kf.value,
          easing: kf.easing,
          interpolation: kf.interpolation,
          bezierPoints: kf.bezierPoints
        });
      }
    });

    this.clipboard = keyframesData;
  }

  pasteKeyframes() {
    if (!this.selectedClipId || !this.clipboard) return;

    const offset = this.timelineState.playheadPercent * this.timelineState.timelineSeconds / 100;

    for (const [property, keyframes] of Object.entries(this.clipboard)) {
      keyframes.forEach(kf => {
        this.keyframeSystem.createKeyframe(
          this.selectedClipId,
          kf.time + offset,
          property,
          kf.value,
          kf.easing,
          kf.interpolation
        );
      });
    }

    this.render();
  }

  updateSelectedKeyframes(updates) {
    if (!this.selectedClipId || this.selectedKeyframes.size === 0) return;

    const keyframes = this.keyframeSystem.getKeyframes(this.selectedClipId, this.selectedProperty);
    keyframes.forEach(kf => {
      if (this.selectedKeyframes.has(kf.id)) {
        Object.assign(kf, updates);
      }
    });
  }

  updateSelectedKeyframeValue(value) {
    if (!this.selectedClipId || this.selectedKeyframes.size !== 1) return;

    const keyframeId = Array.from(this.selectedKeyframes)[0];
    const keyframes = this.keyframeSystem.getKeyframes(this.selectedClipId, this.selectedProperty);
    const keyframe = keyframes.find(kf => kf.id === keyframeId);

    if (keyframe) {
      keyframe.value = value;
      this.render();
    }
  }

  setPlayhead(time) {
    this.timelineState.playheadPercent = (time / this.timelineState.timelineSeconds) * 100;
    this.render();
  }

  setupBezierEditor() {
    const canvas = this.container.querySelector('#bezierCanvas');
    const ctx = canvas.getContext('2d');
    const p1x = this.container.querySelector('#p1x');
    const p1y = this.container.querySelector('#p1y');
    const p2x = this.container.querySelector('#p2x');
    const p2y = this.container.querySelector('#p2y');

    let draggingPoint = null;
    let points = [0.25, 0.1, 0.25, 1]; // Default bezier points

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * canvas.width;
        const y = (i / 10) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw bezier curve
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.01) {
        const x = this.bezierCurve(t, 0, 0, points[0], points[1], points[2], points[3], 1, 1) * canvas.width;
        const y = (1 - this.bezierCurve(t, 0, 0, points[1], points[0], points[3], points[2], 1, 1)) * canvas.height;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw control points
      ctx.fillStyle = '#22d3ee';
      const pointCoords = [
        { x: 0, y: canvas.height }, // Start point
        { x: points[0] * canvas.width, y: (1 - points[1]) * canvas.height }, // P1
        { x: points[2] * canvas.width, y: (1 - points[3]) * canvas.height }, // P2
        { x: canvas.width, y: 0 } // End point
      ];

      pointCoords.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        if (index === 1 || index === 2) {
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Draw control lines
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.lineTo(pointCoords[1].x, pointCoords[1].y);
      ctx.moveTo(canvas.width, 0);
      ctx.lineTo(pointCoords[2].x, pointCoords[2].y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const bezierCurve = (t, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) => {
      const cx = 3 * (p1x - p0x);
      const bx = 3 * (p2x - p1x) - cx;
      const ax = p3x - p0x - cx - bx;

      const cy = 3 * (p1y - p0y);
      const by = 3 * (p2y - p1y) - cy;
      const ay = p3y - p0y - cy - by;

      return ay * t * t * t + by * t * t + cy * t + p0y;
    };

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / canvas.width;
      const y = 1 - (e.clientY - rect.top) / canvas.height;

      if (Math.abs(x - points[0]) < 0.05 && Math.abs(y - points[1]) < 0.05) {
        draggingPoint = 0;
      } else if (Math.abs(x - points[2]) < 0.05 && Math.abs(y - points[3]) < 0.05) {
        draggingPoint = 1;
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (draggingPoint !== null) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / canvas.width));
        const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / canvas.height));

        if (draggingPoint === 0) {
          points[0] = x;
          points[1] = y;
          p1x.value = x.toFixed(2);
          p1y.value = y.toFixed(2);
        } else {
          points[2] = x;
          points[3] = y;
          p2x.value = x.toFixed(2);
          p2y.value = y.toFixed(2);
        }

        draw();
        this.updateBezierPoints(points);
      }
    });

    canvas.addEventListener('mouseup', () => {
      draggingPoint = null;
    });

    // Input field handlers
    [p1x, p1y, p2x, p2y].forEach((input, index) => {
      input.addEventListener('input', () => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
          points[index] = Math.max(0, Math.min(1, value));
          draw();
          this.updateBezierPoints(points);
        }
      });
    });

    draw();
  }

  updateBezierPoints(points) {
    if (!this.selectedClipId || this.selectedKeyframes.size === 0) return;

    const keyframes = this.keyframeSystem.getKeyframes(this.selectedClipId, this.selectedProperty);
    keyframes.forEach(kf => {
      if (this.selectedKeyframes.has(kf.id) && kf.easing === 'bezier') {
        kf.bezierPoints = [...points];
      }
    });
  }

  render() {
    this.renderPropertySelector();
    this.renderKeyframes();
    this.renderCurves();
    this.renderPropertiesPanel();
  }

  renderPropertySelector() {
    const select = this.container.querySelector('#propertySelect');
    // Update selected property
    select.value = this.selectedProperty || '';
  }

  renderKeyframes() {
    const lanesContainer = this.container.querySelector('.keyframe-lanes');
    lanesContainer.innerHTML = '';

    if (!this.selectedClipId || !this.selectedProperty) return;

    const keyframes = this.keyframeSystem.getKeyframes(this.selectedClipId, this.selectedProperty);
    const lane = document.createElement('div');
    lane.className = 'keyframe-lane';

    keyframes.forEach(keyframe => {
      const diamond = document.createElement('div');
      diamond.className = `keyframe-diamond ${this.selectedKeyframes.has(keyframe.id) ? 'selected' : ''}`;
      diamond.style.left = `${this.timeToPixels(keyframe.time)}px`;
      diamond.dataset.keyframeId = keyframe.id;

      diamond.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.shiftKey) {
          if (this.selectedKeyframes.has(keyframe.id)) {
            this.selectedKeyframes.delete(keyframe.id);
          } else {
            this.selectedKeyframes.add(keyframe.id);
          }
        } else {
          this.selectedKeyframes.clear();
          this.selectedKeyframes.add(keyframe.id);
        }
        this.render();
      });

      diamond.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.draggingKeyframe = keyframe.id;
      });

      lane.appendChild(diamond);
    });

    lanesContainer.appendChild(lane);
  }

  renderCurves() {
    const canvas = this.container.querySelector('.curve-canvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    if (!this.selectedClipId || !this.selectedProperty) return;

    const keyframes = this.keyframeSystem.getKeyframes(this.selectedClipId, this.selectedProperty);
    if (keyframes.length < 2) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const propConfig = ANIMATION_PROPERTIES[this.selectedProperty];
    const min = propConfig ? propConfig.min : 0;
    const max = propConfig ? propConfig.max : 100;

    keyframes.forEach((keyframe, index) => {
      const x = this.timeToPixels(keyframe.time);
      const normalizedValue = (keyframe.value - min) / (max - min);
      const y = canvas.height - (normalizedValue * canvas.height);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }

  renderPropertiesPanel() {
    const valueInput = this.container.querySelector('#valueInput');
    const unitLabel = this.container.querySelector('#unitLabel');
    const bezierEditor = this.container.querySelector('#bezierEditor');

    if (this.selectedKeyframes.size === 1) {
      const keyframeId = Array.from(this.selectedKeyframes)[0];
      const keyframes = this.keyframeSystem.getKeyframes(this.selectedClipId, this.selectedProperty);
      const keyframe = keyframes.find(kf => kf.id === keyframeId);

      if (keyframe) {
        valueInput.value = keyframe.value;
        const propConfig = ANIMATION_PROPERTIES[this.selectedProperty];
        unitLabel.textContent = propConfig ? propConfig.unit : '';

        // Update easing and interpolation selectors
        this.container.querySelector('#easingSelect').value = keyframe.easing;
        this.container.querySelector('#interpolationSelect').value = keyframe.interpolation;

        // Show/hide bezier editor
        bezierEditor.style.display = keyframe.easing === 'bezier' ? 'block' : 'none';
      }
    } else {
      valueInput.value = '';
      unitLabel.textContent = '';
      bezierEditor.style.display = 'none';
    }
  }
}</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/src/lib/editor/keyframeEditor.js