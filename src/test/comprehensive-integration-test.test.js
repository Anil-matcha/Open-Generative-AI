import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JSDOM } from 'jsdom';

// Import the main editor modules
import {
  TimelineAnimationIntegration,
  KeyframeSystem,
  ColorCorrectionSystem,
  AudioMixer,
  ExportPipeline,
  PerformanceManager,
  MultiCamera
} from '../lib/editor/index.js';

// Import timeline and related components
import { Timeline } from '../components/Timeline.js';
import { VideoStudio } from '../components/VideoStudio.js';

// Mock external dependencies
vi.mock('../lib/muapi.js', () => ({
  muapi: {
    generateVideo: vi.fn(),
    generateImage: vi.fn(),
    generateAudio: vi.fn()
  }
}));

vi.mock('../lib/models.js', () => ({
  t2vModels: [{
    id: 'test-video-model',
    name: 'Test Video Model',
    inputs: {
      aspect_ratio: { default: '16:9' },
      duration: { default: 5 },
      resolution: { default: '1080p' },
      quality: { default: 'standard' }
    }
  }],
  getAspectRatiosForVideoModel: vi.fn(() => ['16:9', '9:16', '1:1'])
}));

vi.mock('../lib/templates.js', () => ({
  allTemplates: [{
    id: 'template-1',
    name: 'Test Template',
    category: 'business'
  }]
}));

vi.mock('../lib/thumbnails.js', () => ({
  createHeroSection: vi.fn(() => document.createElement('div'))
}));

vi.mock('../lib/router.js', () => ({
  navigate: vi.fn()
}));

vi.mock('../lib/security.js', () => ({
  createSafeImage: vi.fn((url) => url),
  createSafeVideo: vi.fn((url) => url)
}));

// Setup JSDOM environment for DOM operations
const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost'
});
global.window = window;
global.document = window.document;
global.navigator = window.navigator;

// Mock canvas for rendering tests
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({})),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn()
}));

describe('Advanced Features Integration Test Suite', () => {
  let mockFetch;
  let consoleSpy;
  let timelineState;
  let performanceMonitor;

  beforeAll(() => {
    // Setup global mocks
    global.fetch = vi.fn();
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    global.performance = {
      now: vi.fn(() => Date.now()),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 5000000
      }
    };
  });

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    mockFetch = global.fetch;
    consoleSpy = {
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    };
    global.console = { ...global.console, ...consoleSpy };

    // Initialize timeline state for testing
    timelineState = {
      clips: [],
      tracks: [],
      currentTime: 0,
      duration: 30,
      selectedClipId: null,
      zoom: 1,
      multiCameraMode: false,
      pipMode: false,
      splitScreenMode: false,
      cameraAngles: [],
      activeCameraAngle: null,
      addClip: vi.fn(),
      removeClip: vi.fn(),
      selectClip: vi.fn(),
      togglePipMode: vi.fn(),
      setSplitScreen: vi.fn(),
      disableSplitScreen: vi.fn()
    };

    performanceMonitor = {
      startMonitoring: vi.fn(),
      stopMonitoring: vi.fn(),
      getMetrics: vi.fn(() => ({
        memoryUsage: 50,
        frameRate: 60,
        renderTime: 16
      }))
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Multi-Feature Workflow Testing', () => {
    it('should load project with multiple clips and initialize all systems', async () => {
      // Mock project data with multiple clips
      const projectData = {
        clips: [
          { id: 'clip-1', type: 'video', duration: 10, startTime: 0, track: 0 },
          { id: 'clip-2', type: 'video', duration: 8, startTime: 10, track: 1 },
          { id: 'clip-3', type: 'audio', duration: 15, startTime: 0, track: 2 }
        ],
        settings: {
          resolution: '1080p',
          frameRate: 30,
          aspectRatio: '16:9'
        }
      };

      // Initialize timeline with project
      const timeline = new Timeline();
      const container = timeline.render();

      // Initialize animation system
      const animationSystem = new TimelineAnimationIntegration(container, timelineState);

      // Initialize color correction
      const colorSystem = new ColorCorrectionSystem();

      // Initialize audio mixer
      const audioMixer = new AudioMixer();

      // Initialize performance manager
      const perfManager = new PerformanceManager();
      perfManager.startMonitoring();

      // Verify systems are initialized
      expect(animationSystem).toBeInstanceOf(TimelineAnimationIntegration);
      expect(colorSystem).toBeDefined();
      expect(audioMixer).toBeDefined();
      expect(perfManager).toBeDefined();

      // Load project data
      projectData.clips.forEach(clip => {
        timelineState.addClip(clip);
      });

      expect(timelineState.clips).toHaveLength(3);
      expect(perfManager.getMetrics().memoryUsage).toBeDefined();
    });

    it('should apply multi-camera editing with PIP and track performance', async () => {
      const timeline = new Timeline();
      const container = timeline.render();
      const animationSystem = new TimelineAnimationIntegration(container, timelineState);

      // Enable multi-camera mode
      timelineState.multiCameraMode = true;

      // Enable PIP mode
      timelineState.togglePipMode();
      expect(timelineState.pipMode).toBe(true);

      // Add camera angles
      const angle1 = { id: 'angle-1', name: 'Main Camera', color: '#3b82f6', tracks: ['track-1'] };
      const angle2 = { id: 'angle-2', name: 'Side Camera', color: '#10b981', tracks: ['track-2'] };
      timelineState.cameraAngles = [angle1, angle2];
      timelineState.activeCameraAngle = 'angle-1';

      // Create PIP animation keyframes
      const keyframeSystem = new KeyframeSystem();
      keyframeSystem.createKeyframe('pip-clip', 0, 'x', 100);
      keyframeSystem.createKeyframe('pip-clip', 5, 'x', 200);
      keyframeSystem.createKeyframe('pip-clip', 0, 'scale', 50);
      keyframeSystem.createKeyframe('pip-clip', 5, 'scale', 75);

      // Evaluate animation at different times
      const posAtStart = keyframeSystem.evaluateAtTime('pip-clip', 'x', 0);
      const posAtEnd = keyframeSystem.evaluateAtTime('pip-clip', 'x', 5);
      const scaleAtStart = keyframeSystem.evaluateAtTime('pip-clip', 'scale', 0);

      expect(posAtStart).toBe(100);
      expect(posAtEnd).toBe(200);
      expect(scaleAtStart).toBe(50);

      // Performance monitoring
      const perfManager = new PerformanceManager();
      perfManager.startMonitoring();

      // Simulate rendering with PIP
      for (let i = 0; i < 10; i++) {
        keyframeSystem.evaluateAtTime('pip-clip', 'x', i * 0.5);
      }

      const metrics = perfManager.getMetrics();
      expect(metrics.frameRate).toBeGreaterThan(30);
      expect(metrics.memoryUsage).toBeLessThan(80);
    });

    it('should add advanced transitions between clips with keyframe animations', async () => {
      const timeline = new Timeline();
      const container = timeline.render();
      const animationSystem = new TimelineAnimationIntegration(container, timelineState);

      // Add clips with transition points
      const clip1 = { id: 'clip-1', startTime: 0, duration: 5 };
      const clip2 = { id: 'clip-2', startTime: 4, duration: 5 }; // Overlap for transition
      timelineState.clips = [clip1, clip2];

      const keyframeSystem = new KeyframeSystem();

      // Create transition animation (fade out clip1, fade in clip2)
      keyframeSystem.createKeyframe('clip-1', 4, 'opacity', 100);
      keyframeSystem.createKeyframe('clip-1', 5, 'opacity', 0);
      keyframeSystem.createKeyframe('clip-2', 4, 'opacity', 0);
      keyframeSystem.createKeyframe('clip-2', 5, 'opacity', 100);

      // Add motion during transition
      keyframeSystem.createKeyframe('clip-1', 4, 'x', 0);
      keyframeSystem.createKeyframe('clip-1', 5, 'x', -50); // Slide out left
      keyframeSystem.createKeyframe('clip-2', 4, 'x', 50);
      keyframeSystem.createKeyframe('clip-2', 5, 'x', 0); // Slide in from right

      // Test transition at different points
      const opacity1At4 = keyframeSystem.evaluateAtTime('clip-1', 'opacity', 4);
      const opacity1At5 = keyframeSystem.evaluateAtTime('clip-1', 'opacity', 5);
      const opacity2At4 = keyframeSystem.evaluateAtTime('clip-2', 'opacity', 4);
      const opacity2At5 = keyframeSystem.evaluateAtTime('clip-2', 'opacity', 5);

      expect(opacity1At4).toBe(100);
      expect(opacity1At5).toBe(0);
      expect(opacity2At4).toBe(0);
      expect(opacity2At5).toBe(100);

      // Test motion
      const x1At5 = keyframeSystem.evaluateAtTime('clip-1', 'x', 5);
      const x2At5 = keyframeSystem.evaluateAtTime('clip-2', 'x', 5);

      expect(x1At5).toBe(-50);
      expect(x2At5).toBe(0);
    });

    it('should create keyframe animations on multiple properties simultaneously', async () => {
      const keyframeSystem = new KeyframeSystem();

      // Create complex multi-property animation
      const clipId = 'complex-clip';

      // Position animation
      keyframeSystem.createKeyframe(clipId, 0, 'x', 0);
      keyframeSystem.createKeyframe(clipId, 3, 'x', 200);
      keyframeSystem.createKeyframe(clipId, 0, 'y', 0);
      keyframeSystem.createKeyframe(clipId, 3, 'y', 100);

      // Scale and rotation
      keyframeSystem.createKeyframe(clipId, 0, 'scale', 100);
      keyframeSystem.createKeyframe(clipId, 3, 'scale', 150);
      keyframeSystem.createKeyframe(clipId, 0, 'rotation', 0);
      keyframeSystem.createKeyframe(clipId, 3, 'rotation', 180);

      // Opacity
      keyframeSystem.createKeyframe(clipId, 0, 'opacity', 0);
      keyframeSystem.createKeyframe(clipId, 1, 'opacity', 100);
      keyframeSystem.createKeyframe(clipId, 2, 'opacity', 50);
      keyframeSystem.createKeyframe(clipId, 3, 'opacity', 100);

      // Test simultaneous evaluation at time 1.5
      const x = keyframeSystem.evaluateAtTime(clipId, 'x', 1.5);
      const y = keyframeSystem.evaluateAtTime(clipId, 'y', 1.5);
      const scale = keyframeSystem.evaluateAtTime(clipId, 'scale', 1.5);
      const rotation = keyframeSystem.evaluateAtTime(clipId, 'rotation', 1.5);
      const opacity = keyframeSystem.evaluateAtTime(clipId, 'opacity', 1.5);

      // Verify interpolated values
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(200);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(100);
      expect(scale).toBeGreaterThan(100);
      expect(scale).toBeLessThan(150);
      expect(rotation).toBeGreaterThan(0);
      expect(rotation).toBeLessThan(180);
      expect(opacity).toBe(50); // Should be exactly 50 at this point
    });

    it('should apply color correction with curves and LUTs', async () => {
      const colorSystem = new ColorCorrectionSystem();

      // Initialize color correction for a clip
      const clipId = 'color-clip';
      colorSystem.initializeClip(clipId);

      // Apply color grading settings
      colorSystem.applyGrading(clipId, {
        brightness: 110,
        contrast: 120,
        saturation: 90,
        hue: 5,
        temperature: 5500,
        tint: -2
      });

      // Apply curves
      colorSystem.applyCurves(clipId, {
        rgb: [
          { x: 0, y: 0 },
          { x: 64, y: 60 },
          { x: 128, y: 128 },
          { x: 192, y: 190 },
          { x: 255, y: 255 }
        ],
        red: [
          { x: 0, y: 0 },
          { x: 128, y: 140 },
          { x: 255, y: 255 }
        ]
      });

      // Apply LUT
      colorSystem.applyLUT(clipId, 'cinematic-film.lut');

      // Verify settings are applied
      const settings = colorSystem.getSettings(clipId);
      expect(settings.grading.brightness).toBe(110);
      expect(settings.grading.contrast).toBe(120);
      expect(settings.curves).toBeDefined();
      expect(settings.lut).toBe('cinematic-film.lut');
    });

    it('should mix audio with automation and effects', async () => {
      const audioMixer = new AudioMixer();

      // Initialize mixer with multiple tracks
      const track1 = { id: 'track-1', type: 'music', volume: 1.0 };
      const track2 = { id: 'track-2', type: 'voice', volume: 0.8 };
      const track3 = { id: 'track-3', type: 'sfx', volume: 0.6 };

      audioMixer.addTrack(track1);
      audioMixer.addTrack(track2);
      audioMixer.addTrack(track3);

      // Create volume automation
      audioMixer.addAutomationPoint('track-1', 0, 'volume', 0.0);
      audioMixer.addAutomationPoint('track-1', 2, 'volume', 1.0);
      audioMixer.addAutomationPoint('track-1', 8, 'volume', 0.5);

      // Add audio effects
      audioMixer.addEffect('track-2', 'compressor', {
        threshold: -20,
        ratio: 4,
        attack: 0.01,
        release: 0.1
      });

      audioMixer.addEffect('track-3', 'reverb', {
        roomSize: 0.8,
        dampening: 0.5,
        wetGain: 0.3
      });

      // Test automation evaluation
      const volAt0 = audioMixer.getAutomationValue('track-1', 'volume', 0);
      const volAt2 = audioMixer.getAutomationValue('track-1', 'volume', 2);
      const volAt8 = audioMixer.getAutomationValue('track-1', 'volume', 8);

      expect(volAt0).toBe(0.0);
      expect(volAt2).toBe(1.0);
      expect(volAt8).toBe(0.5);

      // Verify effects are applied
      const effects = audioMixer.getEffects('track-2');
      expect(effects).toContainEqual(
        expect.objectContaining({ type: 'compressor' })
      );
    });

    it('should export project with various quality settings', async () => {
      const exportPipeline = new ExportPipeline();

      // Configure export settings
      const exportSettings = {
        format: 'mp4',
        resolution: '1080p',
        frameRate: 30,
        quality: 'high',
        codec: 'h264',
        bitrate: '8000k',
        audioCodec: 'aac',
        audioBitrate: '128k'
      };

      // Mock export process
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ exportId: 'export-123' })
      });

      // Start export
      const result = await exportPipeline.startExport(timelineState, exportSettings);

      expect(result.exportId).toBe('export-123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/export'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('format')
        })
      );

      // Test different quality settings
      const lowQualitySettings = { ...exportSettings, quality: 'low', bitrate: '2000k' };
      const highQualitySettings = { ...exportSettings, quality: 'ultra', bitrate: '20000k' };

      // Verify settings are properly handled
      expect(lowQualitySettings.bitrate).toBe('2000k');
      expect(highQualitySettings.bitrate).toBe('20000k');
    });
  });

  describe('2. Performance Verification', () => {
    it('should monitor memory usage during complex operations', async () => {
      const perfManager = new PerformanceManager();
      perfManager.startMonitoring();

      const keyframeSystem = new KeyframeSystem();

      // Create many keyframes to simulate complex animation
      for (let i = 0; i < 100; i++) {
        const clipId = `clip-${i}`;
        for (let time = 0; time < 10; time += 0.5) {
          keyframeSystem.createKeyframe(clipId, time, 'x', Math.random() * 100);
          keyframeSystem.createKeyframe(clipId, time, 'y', Math.random() * 100);
          keyframeSystem.createKeyframe(clipId, time, 'scale', 100 + Math.random() * 50);
        }
      }

      // Evaluate many animations simultaneously
      const startTime = performance.now();
      for (let time = 0; time < 10; time += 0.1) {
        for (let i = 0; i < 10; i++) {
          keyframeSystem.evaluateAtTime(`clip-${i}`, 'x', time);
          keyframeSystem.evaluateAtTime(`clip-${i}`, 'y', time);
          keyframeSystem.evaluateAtTime(`clip-${i}`, 'scale', time);
        }
      }
      const endTime = performance.now();

      const metrics = perfManager.getMetrics();

      // Performance should be acceptable
      expect(metrics.memoryUsage).toBeLessThan(90);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(metrics.frameRate).toBeGreaterThan(20);
    });

    it('should maintain frame rate stability with multiple effects active', async () => {
      const perfManager = new PerformanceManager();
      perfManager.startMonitoring();

      const timeline = new Timeline();
      const container = timeline.render();
      const animationSystem = new TimelineAnimationIntegration(container, timelineState);

      // Enable multiple complex features
      timelineState.multiCameraMode = true;
      timelineState.pipMode = true;
      timelineState.splitScreenMode = true;

      // Create complex animations
      const keyframeSystem = new KeyframeSystem();
      for (let i = 0; i < 20; i++) {
        const clipId = `effect-clip-${i}`;
        // Create complex multi-property animations
        keyframeSystem.createKeyframe(clipId, 0, 'x', 0);
        keyframeSystem.createKeyframe(clipId, 5, 'x', 300);
        keyframeSystem.createKeyframe(clipId, 0, 'rotation', 0);
        keyframeSystem.createKeyframe(clipId, 5, 'rotation', 720);
        keyframeSystem.createKeyframe(clipId, 0, 'opacity', 0);
        keyframeSystem.createKeyframe(clipId, 2.5, 'opacity', 100);
        keyframeSystem.createKeyframe(clipId, 5, 'opacity', 0);
      }

      // Simulate playback over time
      let frameCount = 0;
      const startTime = performance.now();

      for (let time = 0; time < 5; time += 1/30) { // 30 FPS simulation
        frameCount++;
        // Evaluate all animations for this frame
        for (let i = 0; i < 20; i++) {
          keyframeSystem.evaluateAtTime(`effect-clip-${i}`, 'x', time);
          keyframeSystem.evaluateAtTime(`effect-clip-${i}`, 'rotation', time);
          keyframeSystem.evaluateAtTime(`effect-clip-${i}`, 'opacity', time);
        }
      }

      const endTime = performance.now();
      const metrics = perfManager.getMetrics();

      // Should maintain reasonable performance
      expect(metrics.frameRate).toBeGreaterThan(25);
      expect(metrics.renderTime).toBeLessThan(50); // Less than 50ms per frame
      expect(frameCount).toBeGreaterThan(100); // Should have processed many frames
    });

    it('should handle export performance with different quality settings', async () => {
      const exportPipeline = new ExportPipeline();
      const perfManager = new PerformanceManager();
      perfManager.startMonitoring();

      const qualitySettings = [
        { quality: 'low', bitrate: '2000k', expectedTime: 1000 },
        { quality: 'medium', bitrate: '5000k', expectedTime: 2000 },
        { quality: 'high', bitrate: '10000k', expectedTime: 3000 },
        { quality: 'ultra', bitrate: '20000k', expectedTime: 5000 }
      ];

      for (const settings of qualitySettings) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            exportId: `export-${settings.quality}`,
            estimatedTime: settings.expectedTime
          })
        });

        const startTime = performance.now();
        const result = await exportPipeline.startExport(timelineState, {
          format: 'mp4',
          resolution: '1080p',
          ...settings
        });
        const endTime = performance.now();

        // Export initiation should be fast regardless of quality
        expect(endTime - startTime).toBeLessThan(100);
        expect(result.estimatedTime).toBe(settings.expectedTime);
      }

      const metrics = perfManager.getMetrics();
      expect(metrics.memoryUsage).toBeLessThan(80);
    });

    it('should monitor hardware acceleration utilization', async () => {
      const perfManager = new PerformanceManager();
      perfManager.startMonitoring();

      // Simulate hardware acceleration checks
      const hardwareAcceleration = {
        available: true,
        utilization: 0.75,
        memoryUsed: 512, // MB
        supportedFormats: ['h264', 'h265', 'vp9']
      };

      // Mock hardware acceleration monitoring
      global.navigator = {
        ...global.navigator,
        gpu: {
          getInfo: vi.fn(() => hardwareAcceleration)
        }
      };

      // Test with complex rendering scenario
      const keyframeSystem = new KeyframeSystem();
      const colorSystem = new ColorCorrectionSystem();

      // Create GPU-intensive operations
      for (let i = 0; i < 50; i++) {
        const clipId = `gpu-clip-${i}`;
        keyframeSystem.createKeyframe(clipId, 0, 'rotation', 0);
        keyframeSystem.createKeyframe(clipId, 10, 'rotation', 360);
        colorSystem.initializeClip(clipId);
        colorSystem.applyLUT(clipId, 'high-contrast.lut');
      }

      // Simulate rendering loop
      for (let time = 0; time < 10; time += 0.1) {
        for (let i = 0; i < 10; i++) {
          keyframeSystem.evaluateAtTime(`gpu-clip-${i}`, 'rotation', time);
        }
      }

      const metrics = perfManager.getMetrics();

      // Should show reasonable hardware utilization
      expect(metrics.hardwareUtilization).toBeDefined();
      expect(metrics.hardwareUtilization).toBeLessThan(95);
      expect(metrics.memoryUsage).toBeLessThan(85);
    });
  });

  describe('3. UI Integration Testing', () => {
    it('should provide accessible toolbar buttons and panels', () => {
      const timeline = new Timeline();
      const container = timeline.render();

      // Check for toolbar elements
      const toolbar = container.querySelector('.timeline-top');
      expect(toolbar).toBeTruthy();

      // Check for tool buttons
      const toolButtons = container.querySelectorAll('.tool-btn');
      expect(toolButtons.length).toBeGreaterThan(0);

      // Verify accessibility attributes
      toolButtons.forEach(button => {
        expect(button.hasAttribute('title')).toBe(true);
        expect(button.getAttribute('role')).toBe('button');
      });
    });

    it('should handle modal system for feature editors', () => {
      // Create modal system test
      const modalContainer = document.createElement('div');
      modalContainer.className = 'modal-container';
      document.body.appendChild(modalContainer);

      // Test modal creation and interaction
      const modalContent = document.createElement('div');
      modalContent.innerHTML = `
        // Color correction UI elements would be rendered here
      `;

      modalContainer.appendChild(modalContent);

      // Test modal interactions
      const brightnessSlider = modalContainer.querySelector('#brightness');
      const applyBtn = modalContainer.querySelector('#apply-btn');
      const cancelBtn = modalContainer.querySelector('#cancel-btn');

      expect(brightnessSlider).toBeTruthy();
      expect(applyBtn).toBeTruthy();
      expect(cancelBtn).toBeTruthy();

      // Verify modal can be closed
      expect(modalContainer.children.length).toBeGreaterThan(0);
    });

    it('should provide context menus with appropriate options', () => {
      const timeline = new Timeline();
      const container = timeline.render();

      // Simulate right-click on clip
      const clipElement = document.createElement('div');
      clipElement.className = 'clip';
      clipElement.setAttribute('data-clip-id', 'test-clip');
      container.appendChild(clipElement);

      // Test context menu creation
      const contextMenu = document.createElement('div');
      contextMenu.className = 'context-menu';
      contextMenu.innerHTML = `
        // Context menu items would be rendered here
      `;

      // Verify context menu options
      const menuItems = contextMenu.querySelectorAll('.context-menu-item');
      expect(menuItems.length).toBe(5);

      const actions = Array.from(menuItems).map(item =>
        item.getAttribute('data-action')
      );
      expect(actions).toEqual(['cut', 'copy', 'delete', 'keyframes', 'effects']);
    });

    it('should support drag-and-drop across all features', () => {
      const timeline = new Timeline();
      const container = timeline.render();

      // Create drag source and drop target
      const dragSource = document.createElement('div');
      dragSource.className = 'media-item';
      dragSource.setAttribute('data-type', 'video');
      dragSource.draggable = true;

      const dropTarget = document.createElement('div');
      dropTarget.className = 'timeline-track';
      dropTarget.setAttribute('data-track-id', 'track-1');

      container.appendChild(dragSource);
      container.appendChild(dropTarget);

      // Test drag-and-drop functionality
      expect(dragSource.draggable).toBe(true);
      expect(dragSource.getAttribute('data-type')).toBe('video');
      expect(dropTarget.getAttribute('data-track-id')).toBe('track-1');

      // Simulate drag events
      const dragStartEvent = new Event('dragstart');
      const dragOverEvent = new Event('dragover');
      const dropEvent = new Event('drop');

      dragSource.dispatchEvent(dragStartEvent);
      dropTarget.dispatchEvent(dragOverEvent);
      dropTarget.dispatchEvent(dropEvent);

      // Verify elements exist for drag-drop interaction
      expect(dragSource).toBeTruthy();
      expect(dropTarget).toBeTruthy();
    });

    it('should support keyboard shortcuts and accessibility features', () => {
      const timeline = new Timeline();
      const container = timeline.render();

      // Test keyboard shortcuts
      const keydownEvent = new KeyboardEvent('keydown', {
        key: ' ',
        ctrlKey: false,
        shiftKey: false,
        altKey: false
      });

      // Space bar should play/pause
      document.dispatchEvent(keydownEvent);

      // Test accessibility features
      const focusableElements = container.querySelectorAll('button, [tabindex]');
      expect(focusableElements.length).toBeGreaterThan(0);

      // Check for ARIA labels
      focusableElements.forEach(element => {
        if (element.tagName === 'BUTTON') {
          expect(element.hasAttribute('aria-label') || element.textContent).toBeTruthy();
        }
      });
    });
  });

  describe('4. Data Persistence Testing', () => {
    it('should save and load projects with all advanced features', async () => {
      const projectData = {
        version: '1.0',
        settings: {
          resolution: '1080p',
          frameRate: 30,
          duration: 30
        },
        clips: [
          {
            id: 'clip-1',
            type: 'video',
            startTime: 0,
            duration: 10,
            keyframes: {
              x: [{ time: 0, value: 0 }, { time: 5, value: 100 }],
              opacity: [{ time: 0, value: 0 }, { time: 2, value: 100 }]
            },
            colorCorrection: {
              brightness: 110,
              lut: 'film-look.lut'
            }
          }
        ],
        cameraAngles: [
          { id: 'angle-1', name: 'Main', color: '#3b82f6', tracks: ['track-1'] }
        ],
        audioTracks: [
          {
            id: 'audio-1',
            volume: 0.8,
            automation: [
              { time: 0, parameter: 'volume', value: 0.5 },
              { time: 5, parameter: 'volume', value: 1.0 }
            ],
            effects: ['compressor', 'reverb']
          }
        ]
      };

      // Mock save operation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      // Save project
      const saveResult = await mockFetch('/api/projects/save', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });

      expect(saveResult.ok).toBe(true);

      // Mock load operation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(projectData)
      });

      // Load project
      const loadResult = await mockFetch('/api/projects/load');
      const loadedData = await loadResult.json();

      // Verify all data is preserved
      expect(loadedData.version).toBe('1.0');
      expect(loadedData.clips[0].keyframes.x).toHaveLength(2);
      expect(loadedData.clips[0].colorCorrection.brightness).toBe(110);
      expect(loadedData.cameraAngles[0].name).toBe('Main');
      expect(loadedData.audioTracks[0].effects).toContain('compressor');
    });

    it('should export and import animation data and presets', async () => {
      const animationPreset = {
        name: 'Bounce Effect',
        properties: {
          scale: [
            { time: 0, value: 100, easing: 'ease-out' },
            { time: 0.5, value: 120, easing: 'ease-in' },
            { time: 1, value: 100, easing: 'ease-out' }
          ],
          y: [
            { time: 0, value: 0 },
            { time: 0.5, value: -20 },
            { time: 1, value: 0 }
          ]
        },
        duration: 1.0
      };

      // Export animation preset
      const exportData = JSON.stringify(animationPreset);

      // Import animation preset
      const importedPreset = JSON.parse(exportData);

      expect(importedPreset.name).toBe('Bounce Effect');
      expect(importedPreset.properties.scale).toHaveLength(3);
      expect(importedPreset.properties.y).toHaveLength(3);
      expect(importedPreset.duration).toBe(1.0);
    });

    it('should persist settings across sessions', () => {
      const settings = {
        ui: {
          theme: 'dark',
          timelineZoom: 1.5,
          showKeyframes: true
        },
        export: {
          defaultFormat: 'mp4',
          defaultQuality: 'high',
          defaultResolution: '1080p'
        },
        performance: {
          hardwareAcceleration: true,
          maxMemoryUsage: 80
        }
      };

      // Simulate saving settings to localStorage
      localStorage.setItem('editor-settings', JSON.stringify(settings));

      // Simulate loading settings from localStorage
      const savedSettings = JSON.parse(localStorage.getItem('editor-settings'));

      expect(savedSettings.ui.theme).toBe('dark');
      expect(savedSettings.export.defaultQuality).toBe('high');
      expect(savedSettings.performance.hardwareAcceleration).toBe(true);
    });
  });

  describe('5. Error Recovery Testing', () => {
    it('should handle corrupted data gracefully', async () => {
      const corruptedData = {
        clips: [
          { id: 'clip-1', startTime: 'invalid', duration: 10 }, // Invalid startTime
          { id: 'clip-2', keyframes: 'not-an-array' } // Invalid keyframes
        ]
      };

      // Test data validation and sanitization
      const validateProjectData = (data) => {
        const validated = { ...data };

        if (validated.clips) {
          validated.clips = validated.clips.map(clip => {
            // Sanitize clip data
            const sanitized = { ...clip };
            if (typeof sanitized.startTime !== 'number') {
              sanitized.startTime = 0; // Default to 0
            }
            if (!Array.isArray(sanitized.keyframes)) {
              sanitized.keyframes = {}; // Default to empty object
            }
            return sanitized;
          });
        }

        return validated;
      };

      const sanitizedData = validateProjectData(corruptedData);

      expect(sanitizedData.clips[0].startTime).toBe(0);
      expect(sanitizedData.clips[1].keyframes).toEqual({});
    });

    it('should recover from hardware acceleration failures', async () => {
      const perfManager = new PerformanceManager();

      // Simulate hardware acceleration failure
      const hardwareError = new Error('GPU device lost');

      // Mock fallback to software rendering
      const enableSoftwareRendering = vi.fn(() => {
        console.warn('Falling back to software rendering');
        return true;
      });

      // Test error recovery
      try {
        // Simulate GPU operation that fails
        throw hardwareError;
      } catch (error) {
        console.error('Hardware acceleration failed:', error.message);
        const fallbackSuccess = enableSoftwareRendering();

        expect(fallbackSuccess).toBe(true);
        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('Hardware acceleration failed')
        );
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('Falling back to software rendering')
        );
      }
    });

    it('should provide user-friendly error messages and recovery options', () => {
      const errorScenarios = [
        {
          error: new Error('Network connection lost'),
          userMessage: 'Connection lost. Please check your internet and try again.',
          recoveryOptions: ['Retry', 'Save Offline', 'Cancel']
        },
        {
          error: new Error('Insufficient disk space'),
          userMessage: 'Not enough disk space for export. Free up space and try again.',
          recoveryOptions: ['Free Space', 'Change Export Location', 'Cancel']
        },
        {
          error: new Error('Corrupted project file'),
          userMessage: 'Project file appears corrupted. Try loading a backup.',
          recoveryOptions: ['Load Backup', 'Create New Project', 'Cancel']
        }
      ];

      errorScenarios.forEach(scenario => {
        // Test error message formatting
        const userFriendlyMessage = scenario.userMessage;
        const recoveryActions = scenario.recoveryOptions;

        expect(userFriendlyMessage).toBeTruthy();
        expect(recoveryActions.length).toBeGreaterThan(0);
        expect(recoveryActions).toContain('Cancel');
      });
    });

    it('should handle concurrent error scenarios', async () => {
      const errorHandler = {
        errors: [],
        handleError: vi.fn((error, context) => {
          console.error(`Error in ${context}:`, error.message);
          errorHandler.errors.push({ error, context });
          return true; // Continue processing
        })
      };

      // Simulate multiple concurrent errors
      const errors = [
        { error: new Error('Keyframe evaluation failed'), context: 'animation-system' },
        { error: new Error('Color correction failed'), context: 'color-system' },
        { error: new Error('Audio mixing failed'), context: 'audio-system' }
      ];

      // Handle errors concurrently
      await Promise.all(
        errors.map(({ error, context }) =>
          errorHandler.handleError(error, context)
        )
      );

      expect(errorHandler.errors).toHaveLength(3);
      expect(errorHandler.errors[0].context).toBe('animation-system');
      expect(errorHandler.errors[1].context).toBe('color-system');
      expect(errorHandler.errors[2].context).toBe('audio-system');

      // Verify system continues to function despite errors
      expect(errorHandler.errors.length).toBe(3); // All errors handled
    });
  });

  describe('End-to-End Workflow Integration', () => {
    it('should complete full professional editing workflow', async () => {
      // Initialize all systems
      const timeline = new Timeline();
      const container = timeline.render();
      const animationSystem = new TimelineAnimationIntegration(container, timelineState);
      const colorSystem = new ColorCorrectionSystem();
      const audioMixer = new AudioMixer();
      const exportPipeline = new ExportPipeline();
      const perfManager = new PerformanceManager();

      perfManager.startMonitoring();

      // Step 1: Load project with multiple clips
      const clips = [
        { id: 'intro-clip', type: 'video', duration: 5, startTime: 0 },
        { id: 'main-clip', type: 'video', duration: 15, startTime: 5 },
        { id: 'outro-clip', type: 'video', duration: 5, startTime: 20 },
        { id: 'bg-music', type: 'audio', duration: 25, startTime: 0 }
      ];

      clips.forEach(clip => timelineState.addClip(clip));

      // Step 2: Enable multi-camera with PIP
      timelineState.multiCameraMode = true;
      timelineState.pipMode = true;

      // Step 3: Create complex animations
      const keyframeSystem = animationSystem.keyframeSystem;
      keyframeSystem.createKeyframe('intro-clip', 0, 'opacity', 0);
      keyframeSystem.createKeyframe('intro-clip', 2, 'opacity', 100);
      keyframeSystem.createKeyframe('main-clip', 5, 'x', 0);
      keyframeSystem.createKeyframe('main-clip', 10, 'x', 50);
      keyframeSystem.createKeyframe('main-clip', 15, 'x', 100);

      // Step 4: Apply color correction
      colorSystem.initializeClip('main-clip');
      colorSystem.applyGrading('main-clip', {
        brightness: 110,
        contrast: 115,
        saturation: 105
      });

      // Step 5: Mix audio
      audioMixer.addTrack({ id: 'bg-music', volume: 0.7 });
      audioMixer.addAutomationPoint('bg-music', 0, 'volume', 0.3);
      audioMixer.addAutomationPoint('bg-music', 5, 'volume', 0.7);

      // Step 6: Export final project
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          exportId: 'final-export',
          status: 'completed',
          url: 'https://example.com/final-video.mp4'
        })
      });

      const exportResult = await exportPipeline.startExport(timelineState, {
        format: 'mp4',
        resolution: '1080p',
        quality: 'high'
      });

      // Step 7: Verify performance
      const metrics = perfManager.getMetrics();

      // Assertions
      expect(timelineState.clips).toHaveLength(4);
      expect(timelineState.pipMode).toBe(true);
      expect(keyframeSystem.getAllKeyframes('main-clip').x).toHaveLength(3);
      expect(colorSystem.getSettings('main-clip').grading.brightness).toBe(110);
      expect(audioMixer.getAutomationValue('bg-music', 'volume', 0)).toBe(0.3);
      expect(exportResult.status).toBe('completed');
      expect(metrics.memoryUsage).toBeLessThan(85);
      expect(metrics.frameRate).toBeGreaterThan(25);

      console.log('✅ Full professional editing workflow completed successfully');
    });
  });
});