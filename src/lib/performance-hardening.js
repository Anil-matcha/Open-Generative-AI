/**
 * Performance Hardening Utilities
 * Provides lazy loading, bundle optimization, and performance monitoring enhancements
 */

import { perfMonitor } from './performance.js';

// Lazy loading for components
export class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }

  async loadComponent(componentPath) {
    if (this.loadedModules.has(componentPath)) {
      return this.loadedModules.get(componentPath);
    }

    if (this.loadingPromises.has(componentPath)) {
      return this.loadingPromises.get(componentPath);
    }

    const loadPromise = this._loadComponent(componentPath);
    this.loadingPromises.set(componentPath, loadPromise);

    try {
      const component = await loadPromise;
      this.loadedModules.set(componentPath, component);
      this.loadingPromises.delete(componentPath);
      return component;
    } catch (error) {
      this.loadingPromises.delete(componentPath);
      throw error;
    }
  }

  async _loadComponent(componentPath) {
    const startTime = performance.now();
    
    try {
      const module = await import(componentPath);
      const loadTime = performance.now() - startTime;
      
      perfMonitor.trackMetric('component_load_time', loadTime, {
        component: componentPath,
        success: true
      });
      
      return module.default || module;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      
      perfMonitor.trackMetric('component_load_time', loadTime, {
        component: componentPath,
        success: false,
        error: error.message
      });
      
      throw error;
    }
  }
}

// Bundle optimization utilities
export class BundleOptimizer {
  constructor() {
    this.bundles = new Map();
    this.bundleStats = new Map();
  }

  trackBundleLoad(bundleName, size, loadTime) {
    this.bundleStats.set(bundleName, {
      size,
      loadTime,
      timestamp: Date.now()
    });
    
    perfMonitor.trackMetric('bundle_load_time', loadTime, {
      bundle: bundleName,
      size
    });
  }

  getBundleStats() {
    return Object.fromEntries(this.bundleStats);
  }

  preloadCriticalResources() {
    // Preload critical fonts, images, or scripts
    const criticalResources = [
      // Add critical resources that should be preloaded
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.url;
      link.as = resource.type;
      document.head.appendChild(link);
    });
  }
}

// Memory management utilities
export class MemoryManager {
  constructor() {
    this.gcThreshold = 100 * 1024 * 1024; // 100MB
    this.checkInterval = 30000; // 30 seconds
    this.intervalId = null;
  }

  startMonitoring() {
    if (typeof performance.memory !== 'undefined') {
      this.intervalId = setInterval(() => {
        const memoryUsage = performance.memory.usedJSHeapSize;
        
        perfMonitor.trackMetric('memory_usage', memoryUsage);
        
        if (memoryUsage > this.gcThreshold) {
          if (typeof gc !== 'undefined') {
            gc(); // Manual garbage collection if available
            perfMonitor.trackEvent('manual_gc_triggered');
          }
        }
      }, this.checkInterval);
    }
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  forceGC() {
    if (typeof gc !== 'undefined') {
      const before = performance.memory?.usedJSHeapSize || 0;
      gc();
      const after = performance.memory?.usedJSHeapSize || 0;
      const freed = before - after;
      
      perfMonitor.trackMetric('gc_freed_memory', freed);
      return freed;
    }
    return 0;
  }
}

// Image optimization utilities
export class ImageOptimizer {
  constructor() {
    this.supportedFormats = ['webp', 'avif'];
    this.imageCache = new Map();
  }

  async loadOptimizedImage(src, options = {}) {
    const {
      width,
      height,
      quality = 0.8,
      format = 'webp'
    } = options;

    const cacheKey = `${src}-${width}-${height}-${quality}-${format}`;
    
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey);
    }

    // Check if browser supports the requested format
    if (!this.supportsFormat(format)) {
      return this.loadFallbackImage(src, options);
    }

    try {
      const optimizedSrc = this.generateOptimizedSrc(src, { width, height, quality, format });
      const img = await this.loadImage(optimizedSrc);
      
      this.imageCache.set(cacheKey, img);
      return img;
    } catch (error) {
      // Fallback to original image
      return this.loadFallbackImage(src, options);
    }
  }

  supportsFormat(format) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    
    try {
      return canvas.toDataURL(`image/${format}`).indexOf(`image/${format}`) === 5;
    } catch {
      return false;
    }
  }

  generateOptimizedSrc(originalSrc, options) {
    // This would integrate with an image optimization service
    // For now, return the original src
    return originalSrc;
  }

  async loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async loadFallbackImage(src, options) {
    const img = await this.loadImage(src);
    this.imageCache.set(`${src}-${options.width}-${options.height}-${options.quality}-fallback`, img);
    return img;
  }
}

// Resource preloading utilities
export class ResourcePreloader {
  constructor() {
    this.preloaded = new Set();
  }

  preloadScript(src) {
    if (this.preloaded.has(src)) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        this.preloaded.add(src);
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  preloadStyle(href) {
    if (this.preloaded.has(href)) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => {
        this.preloaded.add(href);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  preloadFont(href) {
    if (this.preloaded.has(href)) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'font';
      link.onload = () => {
        this.preloaded.add(href);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
}

// Initialize performance hardening
export function initializePerformanceHardening() {
  const lazyLoader = new LazyLoader();
  const bundleOptimizer = new BundleOptimizer();
  const memoryManager = new MemoryManager();
  const imageOptimizer = new ImageOptimizer();
  const resourcePreloader = new ResourcePreloader();

  // Start memory monitoring
  memoryManager.startMonitoring();

  // Preload critical resources
  bundleOptimizer.preloadCriticalResources();

  console.log('[Performance] Initialized performance hardening system');

  return {
    lazyLoader,
    bundleOptimizer,
    memoryManager,
    imageOptimizer,
    resourcePreloader
  };
}

// Intersection Observer for lazy loading
export class LazyLoadObserver {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };
    this.observer = null;
    this.callbacks = new Map();
  }

  observe(element, callback) {
    if (!this.observer) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const elementCallback = this.callbacks.get(entry.target);
            if (elementCallback) {
              elementCallback(entry.target);
              this.unobserve(entry.target);
            }
          }
        });
      }, this.options);
    }

    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element) {
    if (this.observer) {
      this.observer.unobserve(element);
      this.callbacks.delete(element);
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.callbacks.clear();
    }
  }
}
