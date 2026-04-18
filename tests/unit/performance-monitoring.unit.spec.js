/**
 * Performance Monitoring and Optimization Unit Tests
 * Tests performance tracking, memory management, lazy loading, and optimization features
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import {
  LazyLoader,
  BundleOptimizer,
  MemoryManager,
  ImageOptimizer,
  ResourcePreloader,
  initializePerformanceHardening,
  LazyLoadObserver
} from '../../src/lib/performance-hardening.js';

import {
  EnhancedPerformanceMonitor,
  enhancedPerfMonitor
} from '../../src/lib/enhanced-performance-monitor.js';

import { perfMonitor } from '../../src/lib/performance.js';

describe('LazyLoader', () => {
  let lazyLoader;
  let mockPerfMonitor;

  beforeEach(() => {
    mockPerfMonitor = {
      trackMetric: vi.fn()
    };
    lazyLoader = new LazyLoader();
    lazyLoader.perfMonitor = mockPerfMonitor;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Loading', () => {
    it('should load components lazily with performance tracking', async () => {
      const mockModule = { default: { name: 'TestComponent' } };
      const mockImport = vi.fn(() => Promise.resolve(mockModule));

      // Mock dynamic import
      global.import = mockImport;

      const startTime = Date.now();
      const result = await lazyLoader.loadComponent('./TestComponent.js');

      expect(result).toBe(mockModule.default);
      expect(mockImport).toHaveBeenCalledWith('./TestComponent.js');
      expect(mockPerfMonitor.trackMetric).toHaveBeenCalledWith(
        'component_load_time',
        expect.any(Number),
        expect.objectContaining({
          component: './TestComponent.js',
          success: true
        })
      );
    });

    it('should cache loaded modules', async () => {
      const mockModule = { default: 'component' };
      const mockImport = vi.fn(() => Promise.resolve(mockModule));

      global.import = mockImport;

      // Load component twice
      await lazyLoader.loadComponent('./CachedComponent.js');
      await lazyLoader.loadComponent('./CachedComponent.js');

      // Should only import once
      expect(mockImport).toHaveBeenCalledTimes(1);
    });

    it('should handle loading failures', async () => {
      const error = new Error('Module not found');
      const mockImport = vi.fn(() => Promise.reject(error));

      global.import = mockImport;

      await expect(lazyLoader.loadComponent('./BrokenComponent.js')).rejects.toThrow('Module not found');

      expect(mockPerfMonitor.trackMetric).toHaveBeenCalledWith(
        'component_load_time',
        expect.any(Number),
        expect.objectContaining({
          component: './BrokenComponent.js',
          success: false,
          error: 'Module not found'
        })
      );
    });

    it('should prevent concurrent loading of same module', async () => {
      const mockModule = { default: 'component' };
      let resolvePromise;
      const loadingPromise = new Promise(resolve => {
        resolvePromise = () => resolve(mockModule);
      });

      const mockImport = vi.fn(() => loadingPromise);
      global.import = mockImport;

      // Start two concurrent loads
      const load1 = lazyLoader.loadComponent('./ConcurrentComponent.js');
      const load2 = lazyLoader.loadComponent('./ConcurrentComponent.js');

      resolvePromise();

      const [result1, result2] = await Promise.all([load1, load2]);

      expect(result1).toBe(mockModule.default);
      expect(result2).toBe(mockModule.default);
      expect(mockImport).toHaveBeenCalledTimes(1);
    });
  });
});

describe('BundleOptimizer', () => {
  let bundleOptimizer;
  let mockPerfMonitor;

  beforeEach(() => {
    mockPerfMonitor = {
      trackMetric: vi.fn()
    };
    bundleOptimizer = new BundleOptimizer();
    bundleOptimizer.perfMonitor = mockPerfMonitor;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Bundle Tracking', () => {
    it('should track bundle load performance', () => {
      bundleOptimizer.trackBundleLoad('main.js', 1024000, 2500); // 1MB, 2.5s

      expect(bundleOptimizer.bundleStats.get('main.js')).toEqual({
        size: 1024000,
        loadTime: 2500,
        timestamp: expect.any(Number)
      });

      expect(mockPerfMonitor.trackMetric).toHaveBeenCalledWith('bundle_load_time', 2500, {
        bundle: 'main.js',
        size: 1024000
      });
    });

    it('should provide bundle statistics', () => {
      bundleOptimizer.trackBundleLoad('app.js', 500000, 1000);
      bundleOptimizer.trackBundleLoad('vendor.js', 2000000, 3000);

      const stats = bundleOptimizer.getBundleStats();

      expect(stats).toHaveProperty('app.js');
      expect(stats).toHaveProperty('vendor.js');
      expect(stats['app.js'].size).toBe(500000);
      expect(stats['vendor.js'].loadTime).toBe(3000);
    });
  });

  describe('Critical Resource Preloading', () => {
    beforeEach(() => {
      global.document = {
        head: {
          appendChild: vi.fn()
        },
        createElement: vi.fn(() => ({
          rel: '',
          href: '',
          as: ''
        }))
      };
    });

    it('should preload critical resources', () => {
      bundleOptimizer.preloadCriticalResources();

      // Should create link elements for preloading
      expect(document.createElement).toHaveBeenCalledWith('link');
    });
  });
});

describe('MemoryManager', () => {
  let memoryManager;
  let mockPerfMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
    mockPerfMonitor = {
      trackMetric: vi.fn(),
      trackEvent: vi.fn()
    };

    // Mock performance.memory
    global.performance.memory = {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB
    };

    memoryManager = new MemoryManager();
    memoryManager.perfMonitor = mockPerfMonitor;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Memory Monitoring', () => {
    it('should start memory monitoring', () => {
      memoryManager.startMonitoring();

      expect(memoryManager.intervalId).toBeDefined();

      // Fast-forward to trigger monitoring
      vi.advanceTimersByTime(30000);

      expect(mockPerfMonitor.trackMetric).toHaveBeenCalledWith('memory_usage', 50 * 1024 * 1024);
    });

    it('should stop memory monitoring', () => {
      memoryManager.startMonitoring();
      expect(memoryManager.intervalId).toBeDefined();

      memoryManager.stopMonitoring();
      expect(memoryManager.intervalId).toBeNull();
    });

    it('should trigger garbage collection when threshold exceeded', () => {
      // Mock high memory usage
      global.performance.memory.usedJSHeapSize = 150 * 1024 * 1024; // 150MB

      // Mock gc function
      global.gc = vi.fn();

      memoryManager.startMonitoring();
      vi.advanceTimersByTime(30000);

      expect(global.gc).toHaveBeenCalled();
      expect(mockPerfMonitor.trackEvent).toHaveBeenCalledWith('manual_gc_triggered');
    });

    it('should track memory freed by GC', () => {
      global.gc = vi.fn(() => {
        const before = global.performance.memory.usedJSHeapSize;
        global.performance.memory.usedJSHeapSize = 30 * 1024 * 1024; // Reduced to 30MB
        return before - global.performance.memory.usedJSHeapSize;
      });

      const freed = memoryManager.forceGC();

      expect(freed).toBe(20 * 1024 * 1024); // 20MB freed
      expect(mockPerfMonitor.trackMetric).toHaveBeenCalledWith('gc_freed_memory', 20 * 1024 * 1024);
    });
  });
});

describe('ImageOptimizer', () => {
  let imageOptimizer;

  beforeEach(() => {
    imageOptimizer = new ImageOptimizer();

    // Mock canvas for format support detection
    global.HTMLCanvasElement.prototype.toDataURL = vi.fn((format) => {
      if (format === 'image/webp') return 'data:image/webp;base64,test';
      if (format === 'image/avif') return ''; // Not supported
      return 'data:image/png;base64,test';
    });

    // Mock Image constructor
    global.Image = vi.fn(() => ({
      onload: null,
      onerror: null,
      src: ''
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Format Support Detection', () => {
    it('should detect supported formats', () => {
      expect(imageOptimizer.supportsFormat('webp')).toBe(true);
      expect(imageOptimizer.supportsFormat('avif')).toBe(false);
    });
  });

  describe('Image Loading', () => {
    it('should load optimized images with caching', async () => {
      const mockImg = { src: 'optimized.webp', width: 100, height: 100 };
      global.Image.mockImplementation(() => {
        const img = {
          onload: null,
          onerror: null,
          src: ''
        };
        setTimeout(() => img.onload && img.onload(), 10);
        return img;
      });

      const result = await imageOptimizer.loadOptimizedImage('test.jpg', {
        width: 100,
        height: 100,
        format: 'webp'
      });

      expect(result).toBeDefined();
      expect(imageOptimizer.imageCache.size).toBe(1);
    });

    it('should fallback to original image when optimization fails', async () => {
      // Mock failed optimization
      imageOptimizer.generateOptimizedSrc = vi.fn(() => {
        throw new Error('Optimization failed');
      });

      global.Image.mockImplementation(() => {
        const img = {
          onload: null,
          onerror: null,
          src: ''
        };
        setTimeout(() => img.onload && img.onload(), 10);
        return img;
      });

      const result = await imageOptimizer.loadOptimizedImage('test.jpg');

      expect(result).toBeDefined();
      expect(imageOptimizer.generateOptimizedSrc).toHaveBeenCalledWith('test.jpg', {});
    });
  });
});

describe('ResourcePreloader', () => {
  let preloader;

  beforeEach(() => {
    preloader = new ResourcePreloader();

    global.document = {
      head: {
        appendChild: vi.fn()
      },
      createElement: vi.fn(() => ({
        src: '',
        onload: null,
        onerror: null,
        rel: '',
        href: '',
        as: ''
      }))
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Script Preloading', () => {
    it('should preload scripts only once', async () => {
      const mockScript = { src: 'test.js', onload: null };
      document.createElement.mockReturnValue(mockScript);

      const promise1 = preloader.preloadScript('test.js');
      const promise2 = preloader.preloadScript('test.js');

      // Simulate script load
      setTimeout(() => mockScript.onload(), 10);

      await Promise.all([promise1, promise2]);

      expect(document.createElement).toHaveBeenCalledTimes(1);
      expect(document.head.appendChild).toHaveBeenCalledTimes(1);
    });
  });

  describe('Style Preloading', () => {
    it('should preload stylesheets', async () => {
      const mockLink = { href: 'style.css', rel: '', onload: null };
      document.createElement.mockReturnValue(mockLink);

      const promise = preloader.preloadStyle('style.css');

      mockLink.onload();
      await promise;

      expect(mockLink.rel).toBe('stylesheet');
      expect(mockLink.href).toBe('style.css');
    });
  });
});

describe('LazyLoadObserver', () => {
  let observer;
  let mockElement;

  beforeEach(() => {
    mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn((callback) => ({
      observe: vi.fn((element) => {
        // Simulate intersection immediately
        setTimeout(() => callback([{ isIntersecting: true, target: element }]), 10);
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    }));

    observer = new LazyLoadObserver();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Element Observation', () => {
    it('should observe elements and trigger callbacks on intersection', async () => {
      const callback = vi.fn();

      observer.observe(mockElement, callback);

      // Wait for intersection simulation
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(callback).toHaveBeenCalledWith(mockElement);
    });

    it('should unobserve elements after callback', async () => {
      const callback = vi.fn();

      observer.observe(mockElement, callback);

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(observer.observer.unobserve).toHaveBeenCalledWith(mockElement);
    });

    it('should disconnect observer', () => {
      observer.disconnect();

      expect(observer.observer.disconnect).toHaveBeenCalled();
      expect(observer.callbacks.size).toBe(0);
    });
  });
});

describe('EnhancedPerformanceMonitor', () => {
  let perfMonitor;

  beforeEach(() => {
    // Mock PerformanceObserver
    global.PerformanceObserver = vi.fn((callback) => ({
      observe: vi.fn()
    }));

    // Mock performance API
    global.performance.memory = {
      usedJSHeapSize: 40 * 1024 * 1024,
      totalJSHeapSize: 80 * 1024 * 1024,
      jsHeapSizeLimit: 200 * 1024 * 1024
    };

    perfMonitor = new EnhancedPerformanceMonitor();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Web Vitals Tracking', () => {
    it('should handle CWV metrics', () => {
      perfMonitor.handleCWV('LCP', 1200);
      perfMonitor.handleCWV('FID', 50);

      expect(perfMonitor.metrics.coreWebVitals.LCP).toEqual({
        value: 1200,
        timestamp: expect.any(Number)
      });
    });
  });

  describe('Memory Usage Tracking', () => {
    it('should track memory usage', () => {
      perfMonitor.trackMemoryUsage();

      expect(perfMonitor.metrics.memoryUsage.length).toBe(1);
      expect(perfMonitor.metrics.memoryUsage[0].used).toBe(40 * 1024 * 1024);
    });

    it('should maintain memory usage history limit', () => {
      // Add more readings than the limit
      for (let i = 0; i < 105; i++) {
        perfMonitor.trackMemoryUsage();
      }

      expect(perfMonitor.metrics.memoryUsage.length).toBe(100);
    });
  });

  describe('Component Render Tracking', () => {
    it('should track component render times', () => {
      perfMonitor.trackComponentRender('TestComponent', 25.5);

      expect(perfMonitor.metrics.componentRenders.get('TestComponent')).toHaveLength(1);
      expect(perfMonitor.metrics.componentRenders.get('TestComponent')[0].time).toBe(25.5);
    });

    it('should warn about slow renders', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      perfMonitor.trackComponentRender('SlowComponent', 20); // Over 16.67ms

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow component render: SlowComponent')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Summary', () => {
    it('should generate comprehensive performance summary', () => {
      perfMonitor.handleCWV('LCP', 1000);
      perfMonitor.trackMemoryUsage();
      perfMonitor.trackComponentRender('Comp1', 10);

      const summary = perfMonitor.getPerformanceSummary();

      expect(summary).toHaveProperty('coreWebVitals');
      expect(summary).toHaveProperty('memory');
      expect(summary).toHaveProperty('components');
      expect(summary).toHaveProperty('network');
      expect(summary.coreWebVitals.LCP.value).toBe(1000);
    });

    it('should handle missing memory data', () => {
      delete global.performance.memory;

      const summary = perfMonitor.getPerformanceSummary();
      expect(summary.memory).toBeNull();
    });
  });
});

describe('Initialization', () => {
  it('should initialize performance hardening system', () => {
    const result = initializePerformanceHardening();

    expect(result).toHaveProperty('lazyLoader');
    expect(result).toHaveProperty('bundleOptimizer');
    expect(result).toHaveProperty('memoryManager');
    expect(result).toHaveProperty('imageOptimizer');
    expect(result).toHaveProperty('resourcePreloader');

    // Should start memory monitoring
    expect(result.memoryManager.intervalId).toBeDefined();
  });
});