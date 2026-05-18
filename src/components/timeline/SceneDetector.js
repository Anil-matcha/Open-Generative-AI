import { createElementFromHTML } from '../../utils/jsx.js';

export class SceneDetector {
  constructor(container, timeline, options = {}) {
    this.container = container;
    this.timeline = timeline;
    this.scenes = [];
    this.isProcessing = false;
    this.sensitivity = 0.5;
    this.minDuration = 2.0; // seconds
    this.showToast = options.showToast || ((message, type) => console.log(`[${type?.toUpperCase()}] ${message}`));
    this.init();
  }

  init() {
    this.createUI();
    this.setupEventListeners();
  }

  createUI() {
    const surface = createElementFromHTML(`
      <div class="scene-detector">
        <div class="card-title">🎬 Scene Detection</div>

        <!-- Controls -->
        <div class="scene-controls">
          <div class="control-group">
            <label>Sensitivity (0.1 - 0.9)</label>
            <input type="range" id="sensitivitySlider" min="0.1" max="0.9" step="0.1" value="${this.sensitivity}">
            <span id="sensitivityValue">${this.sensitivity}</span>
          </div>

          <div class="control-group">
            <label>Min Scene Duration (seconds)</label>
            <input type="range" id="minDurationSlider" min="0.5" max="10.0" step="0.5" value="${this.minDuration}">
            <span id="minDurationValue">${this.minDuration}s</span>
          </div>

          <button id="detectScenesBtn" class="primary-btn">🔍 Detect Scenes</button>
          <button id="clearScenesBtn" class="mini-btn">🗑️ Clear</button>
        </div>

        <!-- Progress -->
        <div id="detectionProgress" class="progress-container" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
          </div>
          <div class="progress-text" id="progressText">Analyzing video...</div>
        </div>

        <!-- Scene Grid -->
        <div id="sceneGrid" class="scene-grid"></div>

        <!-- Scene Actions -->
        <div id="sceneActions" class="scene-actions" style="display: none;">
          <button id="mergeShortScenesBtn" class="mini-btn">🔗 Merge Short Scenes</button>
          <button id="exportSceneMarkersBtn" class="mini-btn">📤 Export Markers</button>
        </div>
      </div>
    `);

    // Add custom styles
    const styles = `
      .scene-detector {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .scene-controls {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .control-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .control-group label {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255,255,255,0.8);
      }

      .control-group input[type="range"] {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: rgba(255,255,255,0.2);
        outline: none;
      }

      .control-group input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--cyan);
        cursor: pointer;
        box-shadow: 0 0 8px rgba(34,211,238,0.4);
      }

      .control-group span {
        font-size: 11px;
        color: rgba(255,255,255,0.6);
        align-self: flex-end;
      }

      .progress-container {
        padding: 12px;
        background: rgba(0,0,0,0.2);
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.1);
      }

      .progress-bar {
        height: 6px;
        background: rgba(255,255,255,0.2);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(to right, var(--cyan), var(--emerald));
        border-radius: inherit;
        transition: width 0.3s ease;
      }

      .progress-text {
        font-size: 12px;
        color: rgba(255,255,255,0.7);
        text-align: center;
      }

      .scene-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;
        padding: 8px;
        background: rgba(0,0,0,0.1);
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.05);
      }

      .scene-item {
        position: relative;
        aspect-ratio: 16/9;
        border-radius: 8px;
        border: 2px solid transparent;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.15s ease;
        background: rgba(0,0,0,0.3);
      }

      .scene-item:hover {
        border-color: rgba(34,211,238,0.4);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(34,211,238,0.2);
      }

      .scene-item.selected {
        border-color: var(--cyan);
        box-shadow: 0 0 16px rgba(34,211,238,0.4);
      }

      .scene-thumbnail {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .scene-info {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 6px 8px;
        background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        color: white;
        font-size: 10px;
      }

      .scene-time {
        font-weight: 600;
        color: var(--cyan);
      }

      .scene-confidence {
        font-size: 9px;
        opacity: 0.8;
      }

      .scene-marker {
        position: absolute;
        top: -6px;
        width: 2px;
        height: 20px;
        background: var(--cyan);
        box-shadow: 0 0 8px rgba(34,211,238,0.8);
        cursor: pointer;
        z-index: 10;
      }

      .scene-marker:hover {
        background: #ff6b6b;
        box-shadow: 0 0 12px rgba(255,107,107,0.8);
      }

      .scene-marker.selected {
        background: var(--emerald);
        box-shadow: 0 0 12px rgba(52,211,153,0.8);
      }

      .scene-marker::before {
        content: '🎬';
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        background: rgba(0,0,0,0.8);
        padding: 2px 4px;
        border-radius: 4px;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.15s ease;
      }

      .scene-marker:hover::before {
        opacity: 1;
      }

      .scene-actions {
        display: flex;
        gap: 8px;
        justify-content: center;
        padding: 12px;
        background: rgba(0,0,0,0.1);
        border-radius: 8px;
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    this.container.appendChild(surface);
    this.surface = surface;
  }

  setupEventListeners() {
    // Sensitivity slider
    const sensitivitySlider = this.surface.querySelector('#sensitivitySlider');
    const sensitivityValue = this.surface.querySelector('#sensitivityValue');

    sensitivitySlider.addEventListener('input', (e) => {
      this.sensitivity = parseFloat(e.target.value);
      sensitivityValue.textContent = this.sensitivity;
    });

    // Min duration slider
    const minDurationSlider = this.surface.querySelector('#minDurationSlider');
    const minDurationValue = this.surface.querySelector('#minDurationValue');

    minDurationSlider.addEventListener('input', (e) => {
      this.minDuration = parseFloat(e.target.value);
      minDurationValue.textContent = `${this.minDuration}s`;
    });

    // Detect scenes button
    const detectBtn = this.surface.querySelector('#detectScenesBtn');
    detectBtn.addEventListener('click', () => this.detectScenes());

    // Clear scenes button
    const clearBtn = this.surface.querySelector('#clearScenesBtn');
    clearBtn.addEventListener('click', () => this.clearScenes());

    // Scene actions
    const mergeBtn = this.surface.querySelector('#mergeShortScenesBtn');
    mergeBtn.addEventListener('click', () => this.mergeShortScenes());

    const exportBtn = this.surface.querySelector('#exportSceneMarkersBtn');
    exportBtn.addEventListener('click', () => this.exportSceneMarkers());
  }

  async detectScenes() {
    if (this.isProcessing) return;

    const videoTrack = this.timeline.tracks.find(track => track.type === 'video');
    if (!videoTrack || videoTrack.clips.length === 0) {
      this.
      return;
    }

    this.isProcessing = true;
    this.showProgress(true);

    try {
      // Get the first video clip's source
      const primaryClip = videoTrack.clips[0];
      const videoUrl = primaryClip.src || primaryClip.mediaUrl;

      if (!videoUrl) {
        throw new Error('No video URL found');
      }

      // Call TransNet V2 scene detection via MuAPI
      const result = await this.callSceneDetectionAPI(videoUrl);

      this.scenes = result.scenes.map(scene => ({
        ...scene,
        startTime: scene.timestamp,
        endTime: scene.timestamp + (scene.duration || 0),
        confidence: scene.confidence || 0.8,
        thumbnail: scene.thumbnail || this.generateThumbnailPlaceholder(scene.timestamp)
      }));

      this.renderSceneGrid();
      this.addTimelineMarkers();
      this.showSceneActions(true);

      this.

    } catch (error) {
      console.error('Scene detection failed:', error);
      this.
    } finally {
      this.isProcessing = false;
      this.showProgress(false);
    }
  }

  async callSceneDetectionAPI(videoUrl) {
    // Simulate progress updates
    const progressContainer = this.surface.querySelector('#detectionProgress');
    const progressFill = this.surface.querySelector('#progressFill');
    const progressText = this.surface.querySelector('#progressText');

    // Progress simulation
    const progressSteps = [
      { progress: 10, text: 'Loading video...' },
      { progress: 30, text: 'Extracting frames...' },
      { progress: 60, text: 'Running TransNet V2 analysis...' },
      { progress: 85, text: 'Processing results...' },
      { progress: 100, text: 'Complete' }
    ];

    for (const step of progressSteps) {
      progressFill.style.width = `${step.progress}%`;
      progressText.textContent = step.text;
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      // Use MuAPI for scene detection
      const muapiClient = window.muapiClient || window.muapi;
      if (muapiClient && muapiClient.processVideo) {
        const result = await muapiClient.processVideo({
          model: 'transnet-v2',
          videoUrl: videoUrl,
          task: 'scene-detection',
          sensitivity: this.sensitivity,
          advanced: true,
          confidenceThreshold: this.sensitivity
        });

        return {
          scenes: result.scenes || []
        };
      } else {
        throw new Error('MuAPI client not available. Scene detection requires MuAPI or real backend service.');
      }
    } catch (error) {
      console.error('Scene detection API error:', error);
      throw new Error('Failed to detect scenes: ' + error.message);
    }
  }

  renderSceneGrid() {
    const grid = this.surface.querySelector('#sceneGrid');
    grid.innerHTML = '';

    this.scenes.forEach((scene, index) => {
      const sceneItem = document.createElement('div');
      sceneItem.className = 'scene-item';
      sceneItem.dataset.index = index;

      sceneItem.innerHTML = `
        <img src="${scene.thumbnail}" alt="Scene ${index + 1}" class="scene-thumbnail">
        <div class="scene-info">
          <div class="scene-time">${this.formatTime(scene.startTime)}</div>
          <div class="scene-confidence">${Math.round(scene.confidence * 100)}% conf.</div>
        </div>
      `;

      sceneItem.addEventListener('click', () => this.selectScene(index));
      grid.appendChild(sceneItem);
    });
  }

  addTimelineMarkers() {
    // Clear existing markers
    this.clearTimelineMarkers();

    const timelineBody = document.querySelector('.timeline-body');
    if (!timelineBody) return;

    const timelineWidth = timelineBody.clientWidth - 100; // Account for track labels
    const totalDuration = this.timeline.timelineSeconds;

    this.scenes.forEach((scene, index) => {
      const marker = document.createElement('div');
      marker.className = 'scene-marker';
      marker.dataset.sceneIndex = index;
      marker.style.left = `${100 + (scene.startTime / totalDuration) * timelineWidth}px`;

      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectScene(index);
        this.timeline.seekTo(scene.startTime);
      });

      timelineBody.appendChild(marker);
    });
  }

  clearTimelineMarkers() {
    const existingMarkers = document.querySelectorAll('.scene-marker');
    existingMarkers.forEach(marker => marker.remove());
  }

  selectScene(index) {
    // Update UI selection
    const sceneItems = this.surface.querySelectorAll('.scene-item');
    sceneItems.forEach((item, i) => {
      item.classList.toggle('selected', i === index);
    });

    // Update marker selection
    const markers = document.querySelectorAll('.scene-marker');
    markers.forEach((marker, i) => {
      marker.classList.toggle('selected', i === index);
    });

    // Seek to scene
    if (this.scenes[index]) {
      this.timeline.seekTo(this.scenes[index].startTime);
    }
  }

  mergeShortScenes() {
    const mergedScenes = [];
    let currentScene = null;

    this.scenes.forEach(scene => {
      if (!currentScene) {
        currentScene = { ...scene };
        return;
      }

      const duration = scene.endTime - currentScene.startTime;
      if (duration < this.minDuration) {
        // Merge scenes
        currentScene.endTime = scene.endTime;
        currentScene.confidence = Math.max(currentScene.confidence, scene.confidence);
      } else {
        // Save current scene and start new one
        mergedScenes.push(currentScene);
        currentScene = { ...scene };
      }
    });

    if (currentScene) {
      mergedScenes.push(currentScene);
    }

    this.scenes = mergedScenes;
    this.renderSceneGrid();
    this.addTimelineMarkers();
    this.
  }

  exportSceneMarkers() {
    const markers = this.scenes.map(scene => ({
      time: scene.startTime,
      duration: scene.endTime - scene.startTime,
      confidence: scene.confidence,
      type: scene.type || 'scene'
    }));

    const dataStr = JSON.stringify(markers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene-markers.json';
    a.click();

    URL.revokeObjectURL(url);
    this.
  }

  clearScenes() {
    this.scenes = [];
    this.renderSceneGrid();
    this.clearTimelineMarkers();
    this.showSceneActions(false);
    this.
  }

  showProgress(show) {
    const progress = this.surface.querySelector('#detectionProgress');
    progress.style.display = show ? 'block' : 'none';
  }

  showSceneActions(show) {
    const actions = this.surface.querySelector('#sceneActions');
    actions.style.display = show ? 'flex' : 'none';
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  generateThumbnailPlaceholder(timestamp) {
    // Generate a placeholder thumbnail - in real implementation, extract actual frames
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop stop-color="#1e293b"/>
            <stop offset="1" stop-color="#334155"/>
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill="url(#g)"/>
        <text x="160" y="90" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
          ${this.formatTime(timestamp)}
        </text>
        <text x="160" y="115" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="Arial">
          Scene Preview
        </text>
      </svg>
    `)}`;
  }

  console.log(message, type = 'info') {
    this.
  }

  destroy() {
    this.clearTimelineMarkers();
    if (this.surface && this.surface.parentNode) {
      this.surface.parentNode.removeChild(this.surface);
    }
  }
}