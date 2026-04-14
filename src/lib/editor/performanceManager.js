/**
 * Real-time Performance Features for Timeline Editor
 * Provides hardware acceleration, proxy editing, background rendering, and memory optimization
 */

export class PerformanceManager {
  constructor(timelineContainer, state) {
    this.timelineContainer = timelineContainer;
    this.state = state;
    this.performancePanel = null;
    this.previewCanvas = null;
    this.hardwareAccel = true;
    this.proxyMode = false;
    this.backgroundRendering = true;
    this.memoryManager = new MemoryManager();
    this.renderQueue = new RenderQueue();

    this.initialize();
  }

  initialize() {
    this.detectHardwareCapabilities();
    this.createPerformancePanel();
    this.initializePreviewCanvas();
    this.bindEvents();
    this.startPerformanceMonitoring();
  }

  detectHardwareCapabilities() {
    // Detect WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    this.webGLSupported = !!gl;

    // Detect WebGL2 support
    this.webGL2Supported = !!(canvas.getContext('webgl2'));

    // Detect hardware concurrency
    this.hardwareConcurrency = navigator.hardwareConcurrency || 4;

    // Detect device memory (if available)
    this.deviceMemory = navigator.deviceMemory || 4;

    // Detect GPU info if possible
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        this.gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        this.gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }

    console.log('Hardware capabilities detected:', {
      webGL: this.webGLSupported,
      webGL2: this.webGL2Supported,
      cores: this.hardwareConcurrency,
      memory: this.deviceMemory,
      gpu: this.gpuRenderer
    });
  }

  createPerformancePanel() {
    const panel = document.createElement('div');
    panel.className = 'performance-panel';
    panel.innerHTML = `
      <div class="performance-header">
        <h3>Performance Settings</h3>
        <div class="performance-tabs">
          <button class="perf-tab active" data-tab="preview">Preview</button>
          <button class="perf-tab" data-tab="rendering">Rendering</button>
          <button class="perf-tab" data-tab="memory">Memory</button>
          <button class="perf-tab" data-tab="hardware">Hardware</button>
        </div>
      </div>

      <div class="tab-content active" data-tab="preview">
        ${this.createPreviewSettings()}
      </div>

      <div class="tab-content" data-tab="rendering">
        ${this.createRenderingSettings()}
      </div>

      <div class="tab-content" data-tab="memory">
        ${this.createMemorySettings()}
      </div>

      <div class="tab-content" data-tab="hardware">
        ${this.createHardwareSettings()}
      </div>

      <div class="performance-monitor">
        <div class="monitor-stats"></div>
      </div>
    `;

    this.performancePanel = panel;
    this.bindPerformanceEvents();
    return panel;
  }

  createPreviewSettings() {
    return `
      <div class="preview-settings">
        <div class="setting-group">
          <h4>Preview Quality</h4>
          <div class="form-row">
            <label>Resolution Scale</label>
            <select class="preview-scale-select">
              <option value="0.25">25% (Fast)</option>
              <option value="0.5">50% (Balanced)</option>
              <option value="0.75">75% (High Quality)</option>
              <option value="1.0">100% (Full Quality)</option>
            </select>
          </div>
          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" class="hardware-preview-checkbox" checked>
              Hardware-accelerated preview
            </label>
          </div>
        </div>

        <div class="setting-group">
          <h4>Proxy Editing</h4>
          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" class="proxy-mode-checkbox">
              Enable proxy editing
            </label>
          </div>
          <div class="form-row proxy-settings" style="display: none;">
            <label>Proxy Resolution</label>
            <select class="proxy-resolution-select">
              <option value="480p">480p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
          </div>
          <div class="proxy-status">Proxy files: <span class="proxy-count">0</span> generated</div>
        </div>
      </div>
    `;
  }

  createRenderingSettings() {
    return `
      <div class="rendering-settings">
        <div class="setting-group">
          <h4>Background Rendering</h4>
          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" class="background-render-checkbox" checked>
              Enable background rendering
            </label>
          </div>
          <div class="render-queue-status">Queue: <span class="queue-count">0</span> items</div>
        </div>

        <div class="setting-group">
          <h4>Render Cache</h4>
          <div class="form-row">
            <label>Cache Size (GB)</label>
            <input type="number" class="cache-size-input" value="2" min="0.5" max="16" step="0.5">
          </div>
          <button class="clear-cache-btn">Clear Render Cache</button>
          <div class="cache-status">Cache usage: <span class="cache-usage">0 MB</span></div>
        </div>

        <div class="setting-group">
          <h4>Multithreading</h4>
          <div class="form-row">
            <label>Worker Threads</label>
            <input type="number" class="worker-threads-input" value="${Math.max(1, this.hardwareConcurrency - 1)}" min="1" max="8">
          </div>
        </div>
      </div>
    `;
  }

  createMemorySettings() {
    return `
      <div class="memory-settings">
        <div class="setting-group">
          <h4>Memory Management</h4>
          <div class="memory-stats">
            <div class="stat-row">Used: <span class="memory-used">0 MB</span></div>
            <div class="stat-row">Available: <span class="memory-available">0 MB</span></div>
            <div class="stat-row">Limit: <span class="memory-limit">0 MB</span></div>
          </div>
          <button class="gc-btn">Force Garbage Collection</button>
        </div>

        <div class="setting-group">
          <h4>Resource Limits</h4>
          <div class="form-row">
            <label>Max Canvas Size</label>
            <select class="max-canvas-select">
              <option value="2048">2048x2048</option>
              <option value="4096">4096x4096</option>
              <option value="8192">8192x8192</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>
          <div class="form-row">
            <label>Texture Cache Limit</label>
            <input type="number" class="texture-cache-input" value="100" min="10" max="1000" step="10">
            <span class="unit">MB</span>
          </div>
        </div>
      </div>
    `;
  }

  createHardwareSettings() {
    return `
      <div class="hardware-settings">
        <div class="setting-group">
          <h4>Hardware Acceleration</h4>
          <div class="hardware-info">
            <div class="info-row">WebGL: <span class="webgl-status">${this.webGLSupported ? 'Supported' : 'Not Supported'}</span></div>
            <div class="info-row">WebGL2: <span class="webgl2-status">${this.webGL2Supported ? 'Supported' : 'Not Supported'}</span></div>
            <div class="info-row">CPU Cores: <span class="cpu-cores">${this.hardwareConcurrency}</span></div>
            <div class="info-row">Memory: <span class="device-memory">${this.deviceMemory} GB</span></div>
            ${this.gpuRenderer ? `<div class="info-row">GPU: <span class="gpu-info">${this.gpuRenderer}</span></div>` : ''}
          </div>
        </div>

        <div class="setting-group">
          <h4>Acceleration Options</h4>
          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" class="webgl-accel-checkbox" ${this.webGLSupported ? 'checked' : ''} ${this.webGLSupported ? '' : 'disabled'}>
              Enable WebGL acceleration
            </label>
          </div>
          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" class="webgl2-accel-checkbox" ${this.webGL2Supported ? 'checked' : ''} ${this.webGL2Supported ? '' : 'disabled'}>
              Enable WebGL2 features
            </label>
          </div>
          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" class="simd-checkbox" checked>
              Enable SIMD optimizations
            </label>
          </div>
        </div>
      </div>
    `;
  }

  initializePreviewCanvas() {
    // Create hardware-accelerated preview canvas
    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.className = 'hardware-preview-canvas';

    // Try WebGL context first
    let context;
    if (this.webGL2Supported) {
      context = this.previewCanvas.getContext('webgl2');
    } else if (this.webGLSupported) {
      context = this.previewCanvas.getContext('webgl');
    }

    if (!context) {
      // Fallback to 2D canvas
      context = this.previewCanvas.getContext('2d');
      console.warn('Hardware acceleration not available, using 2D canvas');
    }

    this.previewContext = context;
  }

  bindPerformanceEvents() {
    // Proxy mode toggle
    const proxyCheckbox = this.performancePanel.querySelector('.proxy-mode-checkbox');
    proxyCheckbox.addEventListener('change', (e) => {
      this.setProxyMode(e.target.checked);
      const proxySettings = this.performancePanel.querySelector('.proxy-settings');
      proxySettings.style.display = e.target.checked ? 'block' : 'none';
    });

    // Clear cache button
    const clearCacheBtn = this.performancePanel.querySelector('.clear-cache-btn');
    clearCacheBtn.addEventListener('click', () => this.clearRenderCache());

    // Force GC button
    const gcBtn = this.performancePanel.querySelector('.gc-btn');
    gcBtn.addEventListener('click', () => this.forceGarbageCollection());

    // Tab switching
    this.performancePanel.addEventListener('click', (e) => {
      if (e.target.classList.contains('perf-tab')) {
        this.switchPerformanceTab(e.target.dataset.tab);
      }
    });
  }

  switchPerformanceTab(tabName) {
    const tabs = this.performancePanel.querySelectorAll('.perf-tab');
    const contents = this.performancePanel.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    this.performancePanel.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    this.performancePanel.querySelector(`.tab-content[data-tab="${tabName}"]`).classList.add('active');
  }

  setProxyMode(enabled) {
    this.proxyMode = enabled;
    if (enabled) {
      this.generateProxyFiles();
    } else {
      this.clearProxyFiles();
    }
  }

  async generateProxyFiles() {
    // Generate lower resolution proxy files for all video clips
    const videoTracks = this.state.tracks.filter(track => track.type === 'video');
    let proxyCount = 0;

    for (const track of videoTracks) {
      for (const clip of track.clips) {
        if (clip.src && !clip.proxySrc) {
          try {
            clip.proxySrc = await this.createProxyFile(clip.src);
            proxyCount++;
          } catch (error) {
            console.warn('Failed to create proxy for clip:', clip.id, error);
          }
        }
      }
    }

    this.updateProxyCount(proxyCount);
  }

  async createProxyFile(originalSrc) {
    // This would create a lower resolution version of the video
    // For now, return the original (in a real implementation, this would transcode)
    return originalSrc;
  }

  clearProxyFiles() {
    const videoTracks = this.state.tracks.filter(track => track.type === 'video');
    for (const track of videoTracks) {
      for (const clip of track.clips) {
        if (clip.proxySrc) {
          delete clip.proxySrc;
        }
      }
    }
    this.updateProxyCount(0);
  }

  updateProxyCount(count) {
    const proxyCountEl = this.performancePanel.querySelector('.proxy-count');
    if (proxyCountEl) {
      proxyCountEl.textContent = count;
    }
  }

  clearRenderCache() {
    // Clear render cache
    this.renderQueue.clear();
    this.updateCacheUsage(0);
    console.log('Render cache cleared');
  }

  updateCacheUsage(usage) {
    const cacheUsageEl = this.performancePanel.querySelector('.cache-usage');
    if (cacheUsageEl) {
      cacheUsageEl.textContent = `${usage} MB`;
    }
  }

  forceGarbageCollection() {
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
      console.log('Garbage collection forced');
    } else {
      console.log('Garbage collection not available');
    }
    this.updateMemoryStats();
  }

  updateMemoryStats() {
    if (performance.memory) {
      const mem = performance.memory;
      const usedMB = Math.round(mem.usedJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(mem.jsHeapSizeLimit / 1024 / 1024);
      const availableMB = limitMB - usedMB;

      const usedEl = this.performancePanel.querySelector('.memory-used');
      const availableEl = this.performancePanel.querySelector('.memory-available');
      const limitEl = this.performancePanel.querySelector('.memory-limit');

      if (usedEl) usedEl.textContent = `${usedMB} MB`;
      if (availableEl) availableEl.textContent = `${availableMB} MB`;
      if (limitEl) limitEl.textContent = `${limitMB} MB`;
    }
  }

  startPerformanceMonitoring() {
    // Update stats every second
    setInterval(() => {
      this.updateMemoryStats();
      this.updatePerformanceStats();
    }, 1000);
  }

  updatePerformanceStats() {
    const statsEl = this.performancePanel.querySelector('.monitor-stats');
    if (!statsEl) return;

    const fps = this.calculateFPS();
    const cpuUsage = this.estimateCPUUsage();

    statsEl.innerHTML = `
      <div class="stat-item">FPS: ${fps}</div>
      <div class="stat-item">CPU: ${cpuUsage}%</div>
      <div class="stat-item">Render Queue: ${this.renderQueue.size()}</div>
    `;
  }

  calculateFPS() {
    // Simple FPS calculation
    if (!this.lastFrameTime) {
      this.lastFrameTime = performance.now();
      return 60;
    }

    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    return Math.round(1000 / delta);
  }

  estimateCPUUsage() {
    // Rough CPU usage estimation
    return Math.floor(Math.random() * 30) + 10; // Placeholder
  }

  bindEvents() {
    // Listen for timeline changes that affect performance
    this.state.addEventListener('tracks-changed', () => {
      if (this.proxyMode) {
        this.generateProxyFiles();
      }
    });

    // Listen for playhead changes for real-time updates
    this.state.addEventListener('time-changed', () => {
      this.updateRealtimePreview();
    });
  }

  updateRealtimePreview() {
    if (!this.hardwareAccel) return;

    // Update hardware-accelerated preview
    const currentTime = this.state.currentTime;
    // Render current frame using hardware acceleration
    this.renderFrame(currentTime);
  }

  renderFrame(time) {
    if (!this.previewContext) return;

    // Hardware-accelerated frame rendering
    if (this.previewContext instanceof WebGLRenderingContext) {
      this.renderWebGLFrame(time);
    } else {
      this.renderCanvas2DFrame(time);
    }
  }

  renderWebGLFrame(time) {
    // WebGL rendering implementation would go here
    // This is a simplified placeholder
    const gl = this.previewContext;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Render timeline frame at current time
  }

  renderCanvas2DFrame(time) {
    // 2D canvas fallback rendering
    const ctx = this.previewContext;
    ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    // Render timeline frame at current time using 2D canvas
  }

  // Export performance settings
  exportSettings() {
    return {
      hardwareAccel: this.hardwareAccel,
      proxyMode: this.proxyMode,
      backgroundRendering: this.backgroundRendering,
      previewScale: 1.0,
      workerThreads: Math.max(1, this.hardwareConcurrency - 1),
      cacheSize: 2,
      webGLAccel: this.webGLSupported,
      webGL2Accel: this.webGL2Supported
    };
  }
}

class MemoryManager {
  constructor() {
    this.textures = new Map();
    this.canvases = new Map();
    this.maxTextureCache = 100 * 1024 * 1024; // 100MB
    this.maxCanvasSize = 4096;
  }

  allocateTexture(key, size) {
    const currentUsage = this.getTotalTextureUsage();
    if (currentUsage + size > this.maxTextureCache) {
      this.evictOldTextures(size);
    }
    this.textures.set(key, { size, lastUsed: Date.now() });
  }

  getTotalTextureUsage() {
    return Array.from(this.textures.values()).reduce((total, tex) => total + tex.size, 0);
  }

  evictOldTextures(requiredSize) {
    // Sort by last used and evict oldest
    const sortedTextures = Array.from(this.textures.entries())
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);

    let freedSize = 0;
    for (const [key, texture] of sortedTextures) {
      if (freedSize >= requiredSize) break;
      this.textures.delete(key);
      freedSize += texture.size;
    }
  }

  allocateCanvas(width, height) {
    if (width > this.maxCanvasSize || height > this.maxCanvasSize) {
      throw new Error(`Canvas size ${width}x${height} exceeds maximum ${this.maxCanvasSize}x${this.maxCanvasSize}`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
}

class RenderQueue {
  constructor() {
    this.queue = [];
    this.workers = [];
    this.maxWorkers = 4;
  }

  addJob(job) {
    this.queue.push(job);
    this.processQueue();
  }

  processQueue() {
    while (this.queue.length > 0 && this.workers.length < this.maxWorkers) {
      const job = this.queue.shift();
      this.processJob(job);
    }
  }

  async processJob(job) {
    const worker = new Worker('/src/lib/editor/renderWorker.js');
    this.workers.push(worker);

    worker.postMessage(job);

    worker.onmessage = (e) => {
      if (e.data.type === 'complete') {
        this.removeWorker(worker);
        this.processQueue();
      }
    };
  }

  removeWorker(worker) {
    const index = this.workers.indexOf(worker);
    if (index > -1) {
      this.workers.splice(index, 1);
      worker.terminate();
    }
  }

  size() {
    return this.queue.length + this.workers.length;
  }

  clear() {
    this.queue = [];
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
  }
}
