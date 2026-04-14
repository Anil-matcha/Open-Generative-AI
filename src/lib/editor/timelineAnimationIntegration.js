/**
 * Timeline Integration
 * Integrates keyframe animation system with the existing timeline interface
 */

import { KeyframeSystem, ANIMATION_PROPERTIES } from './keyframeSystem.js';
import { KeyframeEditor } from './keyframeEditor.js';
import { AnimationControls } from './animationControls.jsx';
import { MotionGraphicsTools } from './motionGraphicsTools.js';

export class TimelineAnimationIntegration {
  constructor(timelineContainer, timelineState) {
    this.timelineContainer = timelineContainer;
    this.timelineState = timelineState;

    // Initialize keyframe system
    this.keyframeSystem = new KeyframeSystem();

    // Create integration components
    this.keyframeEditor = null;
    this.animationControls = null;
    this.motionGraphicsTools = null;

    this.selectedClipId = null;
    this.selectedProperty = null;
    this.showKeyframeIndicators = true;

    this.init();
  }

  init() {
    this.injectStyles();
    this.createKeyframeIndicators();
    this.createPropertyPanel();
    this.createAnimationToolbar();
    this.createMotionGraphicsPanel();

    // Initialize components
    this.initializeComponents();

    // Bind to existing timeline events
    this.bindTimelineEvents();
  }

  injectStyles() {
    const styles = `
      .timeline-animation-integration {
        position: relative;
      }

      .keyframe-indicators {
        position: absolute;
        top: 0;
        left: 100px;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }

      .keyframe-track-indicators {
        position: absolute;
        left: 0;
        right: 0;
        height: 40px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }

      .keyframe-dot {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #22d3ee;
        border: 1px solid white;
        border-radius: 50%;
        pointer-events: auto;
        cursor: pointer;
        z-index: 10;
        top: 50%;
        transform: translate(-50%, -50%);
      }

      .keyframe-dot.selected {
        background: #ef4444;
        transform: translate(-50%, -50%) scale(1.2);
      }

      .keyframe-dot:hover {
        transform: translate(-50%, -50%) scale(1.3);
      }

      .property-panel-overlay {
        position: absolute;
        top: 0;
        right: 0;
        width: 280px;
        background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
        border: 1px solid var(--border);
        border-radius: 8px;
        backdrop-filter: blur(20px);
        z-index: 20;
        display: none;
      }

      .property-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
      }

      .property-panel-title {
        font-size: 14px;
        font-weight: 600;
        color: rgba(255,255,255,0.9);
      }

      .property-panel-content {
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;
      }

      .property-group {
        margin-bottom: 16px;
        padding: 12px;
        background: rgba(0,0,0,0.2);
        border: 1px solid var(--border);
        border-radius: 6px;
      }

      .property-group-title {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255,255,255,0.8);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .property-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 12px;
        color: rgba(255,255,255,0.7);
      }

      .property-item:last-child {
        margin-bottom: 0;
      }

      .property-value {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .property-input {
        width: 60px;
        padding: 2px 4px;
        background: rgba(0,0,0,0.3);
        border: 1px solid var(--border);
        border-radius: 3px;
        color: white;
        font-size: 11px;
        text-align: center;
      }

      .property-unit {
        font-size: 10px;
        color: rgba(255,255,255,0.5);
      }

      .keyframe-button {
        width: 20px;
        height: 20px;
        border: 1px solid var(--border);
        background: rgba(34,211,238,0.1);
        color: #22d3ee;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        transition: all 0.15s ease;
      }

      .keyframe-button:hover {
        background: rgba(34,211,238,0.2);
        transform: scale(1.1);
      }

      .keyframe-button.has-keyframes {
        background: #22d3ee;
        color: black;
      }

      .animation-toolbar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
        border-top: 1px solid var(--border);
        padding: 8px 16px;
        backdrop-filter: blur(20px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 15;
      }

      .animation-tools-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .animation-tools-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tool-toggle {
        padding: 6px 12px;
        border: 1px solid var(--border);
        background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.7);
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.15s ease;
      }

      .tool-toggle:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(34,211,238,0.3);
      }

      .tool-toggle.active {
        background: rgba(34,211,238,0.2);
        border-color: rgba(34,211,238,0.4);
        color: #cffafe;
      }

      .motion-graphics-panel {
        position: fixed;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
        width: 320px;
        max-height: 80vh;
        overflow-y: auto;
        background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
        border: 1px solid var(--border);
        border-radius: 12px;
        backdrop-filter: blur(20px);
        z-index: 1000;
        display: none;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        background: rgba(0,0,0,0.2);
      }

      .panel-title {
        font-size: 14px;
        font-weight: 600;
        color: rgba(255,255,255,0.9);
      }

      .panel-close {
        background: none;
        border: none;
        color: rgba(255,255,255,0.6);
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
      }

      .panel-content {
        padding: 16px;
      }

      .timeline-scrub-handle {
        position: absolute;
        top: -4px;
        width: 12px;
        height: 12px;
        background: #22d3ee;
        border: 2px solid white;
        border-radius: 50%;
        cursor: ew-resize;
        z-index: 25;
        display: none;
      }

      .timeline-scrub-handle.active {
        display: block;
      }

      .keyframe-curve-preview {
        position: absolute;
        top: 0;
        left: 100px;
        right: 0;
        height: 40px;
        pointer-events: none;
        z-index: 5;
      }

      .curve-path {
        stroke: rgba(34,211,238,0.6);
        stroke-width: 2;
        fill: none;
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  createKeyframeIndicators() {
    const indicators = document.createElement('div');
    indicators.className = 'keyframe-indicators';
    this.timelineContainer.appendChild(indicators);
    this.keyframeIndicators = indicators;
  }

  createPropertyPanel() {
    const panel = document.createElement('div');
    panel.className = 'property-panel-overlay';
    panel.innerHTML = `
      <div class="property-panel-header">
        <div class="property-panel-title">Animation Properties</div>
        <button class="panel-close" id="closePropertyPanel">×</button>
      </div>
      <div class="property-panel-content" id="propertyPanelContent">
        <!-- Properties will be populated here -->
      </div>
    `;

    this.timelineContainer.appendChild(panel);
    this.propertyPanel = panel;

    // Bind close event
    panel.querySelector('#closePropertyPanel').addEventListener('click', () => {
      this.hidePropertyPanel();
    });
  }

  createAnimationToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'animation-toolbar';
    toolbar.innerHTML = `
      <div class="animation-tools-left">
        <button class="tool-toggle" id="keyframeEditorToggle" title="Keyframe Editor">
          🎬 Keyframes
        </button>
        <button class="tool-toggle" id="animationControlsToggle" title="Animation Controls">
          ▶ Controls
        </button>
        <button class="tool-toggle" id="motionGraphicsToggle" title="Motion Graphics">
          ✨ Effects
        </button>
      </div>
      <div class="animation-tools-right">
        <button class="tool-toggle" id="showKeyframesToggle" title="Show/Hide Keyframe Indicators">
          👁 Indicators
        </button>
        <button class="tool-toggle" id="autoKeyframeToggle" title="Auto-Keyframing">
          🔄 Auto-Key
        </button>
      </div>
    `;

    this.timelineContainer.appendChild(toolbar);
    this.animationToolbar = toolbar;

    // Bind toolbar events
    this.bindToolbarEvents();
  }

  createMotionGraphicsPanel() {
    const panel = document.createElement('div');
    panel.className = 'motion-graphics-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <div class="panel-title">Motion Graphics Tools</div>
        <button class="panel-close" id="closeMotionPanel">×</button>
      </div>
      <div class="panel-content" id="motionGraphicsContent">
        <!-- Motion graphics tools will be mounted here -->
      </div>
    `;

    document.body.appendChild(panel);
    this.motionGraphicsPanel = panel;

    // Bind close event
    panel.querySelector('#closeMotionPanel').addEventListener('click', () => {
      this.hideMotionGraphicsPanel();
    });
  }

  initializeComponents() {
    // Initialize keyframe editor in a modal
    this.keyframeEditor = new KeyframeEditor(document.createElement('div'), this.keyframeSystem, this.timelineState);

    // Initialize animation controls
    this.animationControls = new AnimationControls(document.createElement('div'), this.keyframeSystem, this.timelineState);

    // Initialize motion graphics tools
    this.motionGraphicsTools = new MotionGraphicsTools(this.motionGraphicsPanel.querySelector('#motionGraphicsContent'), this.keyframeSystem, this.timelineState);
  }

  bindToolbarEvents() {
    // Keyframe editor toggle
    this.animationToolbar.querySelector('#keyframeEditorToggle').addEventListener('click', () => {
      this.showKeyframeEditor();
    });

    // Animation controls toggle
    this.animationToolbar.querySelector('#animationControlsToggle').addEventListener('click', () => {
      this.showAnimationControls();
    });

    // Motion graphics toggle
    this.animationToolbar.querySelector('#motionGraphicsToggle').addEventListener('click', () => {
      this.toggleMotionGraphicsPanel();
    });

    // Show keyframes toggle
    this.animationToolbar.querySelector('#showKeyframesToggle').addEventListener('click', (e) => {
      this.showKeyframeIndicators = !this.showKeyframeIndicators;
      e.target.classList.toggle('active', this.showKeyframeIndicators);
      this.updateKeyframeIndicators();
    });

    // Auto-keyframe toggle
    this.animationToolbar.querySelector('#autoKeyframeToggle').addEventListener('click', (e) => {
      this.autoKeyframing = !this.autoKeyframing;
      e.target.classList.toggle('active', this.autoKeyframing);
    });
  }

  bindTimelineEvents() {
    // Listen for clip selection changes
    this.timelineContainer.addEventListener('clipSelected', (e) => {
      this.selectedClipId = e.detail.clipId;
      this.updatePropertyPanel();
      this.keyframeEditor.setSelectedClip(this.selectedClipId);
      this.motionGraphicsTools.setSelectedClip(this.selectedClipId);
    });

    // Listen for timeline clicks to add keyframes
    this.timelineContainer.addEventListener('timelineClick', (e) => {
      if (this.autoKeyframing && this.selectedClipId && this.selectedProperty) {
        const time = e.detail.time;
        const currentValue = this.keyframeSystem.evaluateAtTime(this.selectedClipId, this.selectedProperty, time);
        if (currentValue !== null) {
          this.keyframeSystem.createKeyframe(this.selectedClipId, time, this.selectedProperty, currentValue);
          this.updateKeyframeIndicators();
        }
      }
    });

    // Listen for playhead changes
    this.timelineContainer.addEventListener('playheadChanged', (e) => {
      const time = e.detail.time;
      this.updatePropertyValues(time);
    });
  }

  updateKeyframeIndicators() {
    if (!this.showKeyframeIndicators) {
      this.keyframeIndicators.innerHTML = '';
      return;
    }

    this.keyframeIndicators.innerHTML = '';

    // Get all clips
    this.timelineState.tracks.forEach((track, trackIndex) => {
      track.items.forEach(clip => {
        const clipKeyframes = this.keyframeSystem.getAllKeyframes(clip.id);
        if (clipKeyframes.size === 0) return;

        // Create track indicator container
        const trackIndicator = document.createElement('div');
        trackIndicator.className = 'keyframe-track-indicators';
        trackIndicator.style.top = `${trackIndex * 62}px`;

        // Add keyframe dots for each property
        for (const [property, keyframes] of clipKeyframes) {
          keyframes.forEach(keyframe => {
            const dot = document.createElement('div');
            dot.className = 'keyframe-dot';
            dot.style.left = `${(keyframe.time / this.timelineState.timelineSeconds) * 100}%`;
            dot.dataset.clipId = clip.id;
            dot.dataset.property = property;
            dot.dataset.time = keyframe.time;

            dot.addEventListener('click', (e) => {
              e.stopPropagation();
              this.selectKeyframe(clip.id, property, keyframe.time);
            });

            trackIndicator.appendChild(dot);
          });
        }

        this.keyframeIndicators.appendChild(trackIndicator);
      });
    });
  }

  selectKeyframe(clipId, property, time) {
    this.selectedClipId = clipId;
    this.selectedProperty = property;

    // Update keyframe editor
    if (this.keyframeEditor) {
      this.keyframeEditor.setSelectedClip(clipId);
      this.keyframeEditor.selectedProperty = property;
      this.keyframeEditor.render();
    }

    // Update property panel
    this.updatePropertyPanel();
  }

  updatePropertyPanel() {
    if (!this.selectedClipId) {
      this.propertyPanel.style.display = 'none';
      return;
    }

    const content = this.propertyPanel.querySelector('#propertyPanelContent');
    content.innerHTML = '';

    // Group properties
    const propertyGroups = {
      'Position': ['x', 'y'],
      'Scale': ['scale', 'scaleX', 'scaleY'],
      'Rotation': ['rotation', 'anchorX', 'anchorY'],
      'Appearance': ['opacity', 'brightness', 'contrast', 'saturation'],
      'Crop': ['cropTop', 'cropBottom', 'cropLeft', 'cropRight'],
      'Motion': ['blur', 'playbackRate']
    };

    const currentTime = (this.timelineState.playheadPercent / 100) * this.timelineState.timelineSeconds;

    for (const [groupName, properties] of Object.entries(propertyGroups)) {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'property-group';

      groupDiv.innerHTML = `<div class="property-group-title">${groupName}</div>`;

      properties.forEach(prop => {
        const value = this.keyframeSystem.evaluateAtTime(this.selectedClipId, prop, currentTime);
        const hasKeyframes = this.keyframeSystem.getKeyframes(this.selectedClipId, prop).length > 0;
        const propConfig = ANIMATION_PROPERTIES[prop];

        const propertyDiv = document.createElement('div');
        propertyDiv.className = 'property-item';

        propertyDiv.innerHTML = `
          <span>${propConfig ? prop : prop}</span>
          <div class="property-value">
            <input type="number" class="property-input" data-property="${prop}"
                   value="${value !== null ? value : (propConfig ? propConfig.default : 0)}"
                   step="${propConfig ? (propConfig.type === 'number' ? '0.01' : '1') : '0.01'}">
            <span class="property-unit">${propConfig ? propConfig.unit : ''}</span>
            <button class="keyframe-button ${hasKeyframes ? 'has-keyframes' : ''}"
                    data-property="${prop}" title="Add/Remove Keyframe">
              ${hasKeyframes ? '●' : '○'}
            </button>
          </div>
        `;

        // Bind events
        const input = propertyDiv.querySelector('.property-input');
        input.addEventListener('input', (e) => {
          const newValue = parseFloat(e.target.value);
          this.updatePropertyValue(prop, newValue, currentTime);
        });

        const keyframeBtn = propertyDiv.querySelector('.keyframe-button');
        keyframeBtn.addEventListener('click', () => {
          this.toggleKeyframe(prop, currentTime);
        });

        groupDiv.appendChild(propertyDiv);
      });

      content.appendChild(groupDiv);
    }

    this.propertyPanel.style.display = 'block';
  }

  updatePropertyValue(property, value, time) {
    if (!this.selectedClipId) return;

    // Update the keyframe system
    this.keyframeSystem.createKeyframe(this.selectedClipId, time, property, value);

    // Update indicators
    this.updateKeyframeIndicators();

    // Update keyframe editor if open
    if (this.keyframeEditor) {
      this.keyframeEditor.render();
    }
  }

  toggleKeyframe(property, time) {
    if (!this.selectedClipId) return;

    const keyframes = this.keyframeSystem.getKeyframes(this.selectedClipId, property);
    const existingKeyframe = keyframes.find(kf => Math.abs(kf.time - time) < 0.1);

    if (existingKeyframe) {
      this.keyframeSystem.removeKeyframe(this.selectedClipId, property, existingKeyframe.id);
    } else {
      const currentValue = this.keyframeSystem.evaluateAtTime(this.selectedClipId, property, time);
      if (currentValue !== null) {
        this.keyframeSystem.createKeyframe(this.selectedClipId, time, property, currentValue);
      }
    }

    this.updateKeyframeIndicators();
    this.updatePropertyPanel();
  }

  updatePropertyValues(time) {
    if (!this.propertyPanel.style.display !== 'none') return;

    const inputs = this.propertyPanel.querySelectorAll('.property-input');
    inputs.forEach(input => {
      const property = input.dataset.property;
      const value = this.keyframeSystem.evaluateAtTime(this.selectedClipId, property, time);
      if (value !== null) {
        input.value = value;
      }
    });
  }

  showKeyframeEditor() {
    // Create modal for keyframe editor
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="width: 90%; max-width: 1200px; height: 80vh;">
        <div class="modal-header">
          <h3>Keyframe Editor</h3>
          <button class="modal-close" id="closeKeyframeEditor">×</button>
        </div>
        <div class="modal-body">
          <!-- Keyframe editor will be mounted here -->
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Mount keyframe editor
    const editorContainer = modal.querySelector('.modal-body');
    editorContainer.appendChild(this.keyframeEditor.container);

    // Bind close event
    modal.querySelector('#closeKeyframeEditor').addEventListener('click', () => {
      modal.remove();
    });
  }

  showAnimationControls() {
    // Create modal for animation controls
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="width: 600px;">
        <div class="modal-header">
          <h3>Animation Controls</h3>
          <button class="modal-close" id="closeAnimationControls">×</button>
        </div>
        <div class="modal-body">
          <!-- Animation controls will be mounted here -->
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Mount animation controls
    const controlsContainer = modal.querySelector('.modal-body');
    controlsContainer.appendChild(this.animationControls.container);

    // Bind close event
    modal.querySelector('#closeAnimationControls').addEventListener('click', () => {
      modal.remove();
    });
  }

  toggleMotionGraphicsPanel() {
    if (this.motionGraphicsPanel.style.display === 'none') {
      this.showMotionGraphicsPanel();
    } else {
      this.hideMotionGraphicsPanel();
    }
  }

  showMotionGraphicsPanel() {
    this.motionGraphicsPanel.style.display = 'block';
  }

  hideMotionGraphicsPanel() {
    this.motionGraphicsPanel.style.display = 'none';
  }

  hidePropertyPanel() {
    this.propertyPanel.style.display = 'none';
  }

  // Timeline integration methods
  getClipAnimationData(clipId) {
    return {
      keyframes: this.keyframeSystem.serialize()[clipId] || {},
      transform: this.motionGraphicsTools.getClipTransform(clipId, 0)
    };
  }

  // Export all animation data
  exportAnimationData() {
    return {
      keyframes: this.keyframeSystem.serialize(),
      motionGraphics: this.motionGraphicsTools.exportSettings(),
      animationSettings: this.animationControls.exportAnimation()
    };
  }

  // Import animation data
  importAnimationData(data) {
    if (data.keyframes) {
      this.keyframeSystem.deserialize(data.keyframes);
    }

    if (data.motionGraphics) {
      // Import motion graphics settings
      // This would need to be implemented in the motion graphics tools
    }

    if (data.animationSettings) {
      this.animationControls.importAnimation(data.animationSettings);
    }

    this.updateKeyframeIndicators();
  }

  // Real-time animation preview
  startAnimationPreview() {
    this.animationControls.play();
  }

  stopAnimationPreview() {
    this.animationControls.stop();
  }

  // Timeline scrubbing integration
  scrubToTime(time) {
    this.timelineState.playheadPercent = (time / this.timelineState.timelineSeconds) * 100;
    this.updatePropertyValues(time);
    this.updateKeyframeIndicators();
  }
}</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/src/lib/editor/timelineAnimationIntegration.js