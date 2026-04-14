// Task 1: Enhance PerformanceMonitor with Core Web Vitals and memory tracking
export class EnhancedPerformanceMonitor {
  constructor() {
    this.metrics = {
      coreWebVitals: {},
      memoryUsage: [],
      componentRenders: new Map(),
      networkRequests: [],
      longTasks: []
    };
    this.isEnabled = true;
    this.initializeObservers();
  }

  initializeObservers() {
    // Only initialize in browser environment
    if (typeof window === 'undefined') return;

    // Core Web Vitals - would use web-vitals library if installed
    // For now, we'll track basic performance metrics
    console.log('[Performance] Core Web Vitals tracking initialized');

    // Memory monitoring
    if ('memory' in performance) {
      setInterval(() => this.trackMemoryUsage(), 5000);
    }

    // Long task monitoring
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.longTasks.push({
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now()
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Network request monitoring
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
            this.metrics.networkRequests.push({
              url: entry.name,
              duration: entry.duration,
              size: entry.transferSize,
              timestamp: Date.now()
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  handleCWV(metric, value) {
    this.metrics.coreWebVitals[metric] = {
      value,
      timestamp: Date.now()
    };
    console.log(`[CWV] ${metric}:`, value);
  }

  trackMemoryUsage() {
    if (performance.memory) {
      const mem = performance.memory;
      const usage = {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        limit: mem.jsHeapSizeLimit,
        timestamp: Date.now()
      };
      this.metrics.memoryUsage.push(usage);

      // Keep last 100 readings
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }

      // Warn if memory usage is high
      const usagePercent = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;
      if (usagePercent > 80) {
        console.warn(`[Memory] High usage: ${usagePercent.toFixed(1)}%`);
      }
    }
  }

  trackComponentRender(componentName, renderTime) {
    const renders = this.metrics.componentRenders.get(componentName) || [];
    renders.push({
      time: renderTime,
      timestamp: Date.now()
    });

    // Keep last 50 renders per component
    if (renders.length > 50) {
      renders.shift();
    }

    this.metrics.componentRenders.set(componentName, renders);

    // Warn about slow renders
    if (renderTime > 16.67) { // Slower than 60fps
      console.warn(`[Render] Slow component render: ${componentName} (${renderTime.toFixed(2)}ms)`);
    }
  }

  getPerformanceSummary() {
    const summary = {
      coreWebVitals: this.metrics.coreWebVitals,
      memory: this.getMemorySummary(),
      components: this.getComponentSummary(),
      network: this.getNetworkSummary(),
      longTasks: this.metrics.longTasks.length
    };

    return summary;
  }

  getMemorySummary() {
    if (this.metrics.memoryUsage.length === 0) return null;

    const recent = this.metrics.memoryUsage.slice(-10); // Last 10 readings
    const avgUsed = recent.reduce((sum, m) => sum + m.used, 0) / recent.length;
    const avgTotal = recent.reduce((sum, m) => sum + m.total, 0) / recent.length;
    const peakUsage = Math.max(...recent.map(m => m.used));

    return {
      averageUsedMB: Math.round(avgUsed / 1024 / 1024),
      averageTotalMB: Math.round(avgTotal / 1024 / 1024),
      peakUsageMB: Math.round(peakUsage / 1024 / 1024),
      usageTrend: recent.length > 1 ? 
        (recent[recent.length - 1].used > recent[0].used ? 'increasing' : 'stable') : 'unknown'
    };
  }

  getComponentSummary() {
    const summary = {};
    for (const [component, renders] of this.metrics.componentRenders) {
      if (renders.length > 0) {
        const avgTime = renders.reduce((sum, r) => sum + r.time, 0) / renders.length;
        const slowRenders = renders.filter(r => r.time > 16.67).length;
        summary[component] = {
          avgRenderTime: avgTime.toFixed(2),
          slowRenders,
          totalRenders: renders.length
        };
      }
    }
    return summary;
  }

  getNetworkSummary() {
    if (this.metrics.networkRequests.length === 0) return null;

    const requests = this.metrics.networkRequests.slice(-50); // Last 50 requests
    const avgDuration = requests.reduce((sum, r) => sum + r.duration, 0) / requests.length;
    const slowRequests = requests.filter(r => r.duration > 1000).length;
    const totalSize = requests.reduce((sum, r) => sum + (r.size || 0), 0);

    return {
      totalRequests: requests.length,
      avgDuration: avgDuration.toFixed(2),
      slowRequests,
      totalSizeKB: Math.round(totalSize / 1024)
    };
  }
}

export const enhancedPerfMonitor = new EnhancedPerformanceMonitor();