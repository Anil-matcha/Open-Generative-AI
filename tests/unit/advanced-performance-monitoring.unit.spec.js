/**
 * Advanced Performance Monitoring Unit Tests
 * Tests RUM, performance budgets, memory management, and optimization tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import {
  RealUserMonitor,
  PerformanceBudgetManager,
  MemoryProfiler,
  ServiceWorkerCacheMonitor,
  ThirdPartyScriptOptimizer,
  PerformanceRegressionDetector,
  ResourceLoadingOptimizer,
  InteractionLatencyTracker
} from '../../src/lib/advanced-performance-monitoring.js';

describe('RealUserMonitor', () => {
  let rumMonitor;

  beforeEach(() => {
    // Mock PerformanceObserver
    global.PerformanceObserver = vi.fn((callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn()
    }));

    // Mock performance API
    global.performance = {
      getEntriesByType: vi.fn(() => []),
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      memory: {
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 200 * 1024 * 1024
      }
    };

    rumMonitor = new RealUserMonitor();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Web Vitals Tracking', () => {
    it('should track LCP metrics', () => {
      const mockLCP = { startTime: 2500, size: 100000 };
      rumMonitor.handleLCP(mockLCP);

      expect(rumMonitor.metrics.lcp.length).toBe(1);
      expect(rumMonitor.metrics.lcp[0].value).toBe(2500);
      expect(rumMonitor.metrics.lcp[0].timestamp).toBeDefined();
    });

    it('should track FID metrics', () => {
      const mockFID = { processingStart: 100, startTime: 50 };
      rumMonitor.handleFID(mockFID);

      expect(rumMonitor.metrics.fid.length).toBe(1);
      expect(rumMonitor.metrics.fid[0].value).toBe(50); // processingStart - startTime
    });

    it('should track CLS metrics', () => {
      const mockCLS = { value: 0.1 };
      rumMonitor.handleCLS(mockCLS);

      expect(rumMonitor.metrics.cls.length).toBe(1);
      expect(rumMonitor.metrics.cls[0].value).toBe(0.1);
    });

    it('should calculate performance scores', () => {
      // Add some metrics
      rumMonitor.handleLCP({ startTime: 2000 });
      rumMonitor.handleFID({ processingStart: 120, startTime: 100 });
      rumMonitor.handleCLS({ value: 0.05 });

      const scores = rumMonitor.calculatePerformanceScores();

      expect(scores).toHaveProperty('lcp');
      expect(scores).toHaveProperty('fid');
      expect(scores).toHaveProperty('cls');
      expect(scores).toHaveProperty('overall');

      // Good scores should be high
      expect(scores.lcp).toBeGreaterThan(0.8); // LCP 2s is good
      expect(scores.fid).toBeGreaterThan(0.9); // FID 20ms is excellent
      expect(scores.cls).toBeGreaterThan(0.9); // CLS 0.05 is good
    });
  });

  describe('Navigation Timing', () => {
    it('should track navigation performance', () => {
      const mockNavigation = {
        domContentLoadedEventEnd: 1500,
        loadEventEnd: 3000,
        fetchStart: 0,
        responseStart: 200,
        responseEnd: 800,
        domInteractive: 1200
      };

      rumMonitor.trackNavigationTiming(mockNavigation);

      expect(rumMonitor.metrics.navigation).toBeDefined();
      expect(rumMonitor.metrics.navigation.domContentLoaded).toBe(1500);
      expect(rumMonitor.metrics.navigation.loadComplete).toBe(3000);
      expect(rumMonitor.metrics.navigation.ttfb).toBe(200);
    });

    it('should detect slow navigation', () => {
      const slowNavigation = {
        domContentLoadedEventEnd: 5000,
        loadEventEnd: 8000,
        fetchStart: 0
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      rumMonitor.trackNavigationTiming(slowNavigation);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow navigation detected')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Resource Timing', () => {
    it('should track resource loading performance', () => {
      const mockResource = {
        name: 'https://example.com/app.js',
        initiatorType: 'script',
        transferSize: 500000,
        requestStart: 100,
        responseEnd: 600
      };

      rumMonitor.trackResourceTiming(mockResource);

      expect(rumMonitor.metrics.resources.length).toBe(1);
      expect(rumMonitor.metrics.resources[0].url).toBe('https://example.com/app.js');
      expect(rumMonitor.metrics.resources[0].loadTime).toBe(500);
      expect(rumMonitor.metrics.resources[0].size).toBe(500000);
    });

    it('should categorize resources by type', () => {
      const resources = [
        { name: 'app.js', initiatorType: 'script', transferSize: 100000, requestStart: 0, responseEnd: 200 },
        { name: 'style.css', initiatorType: 'link', transferSize: 50000, requestStart: 0, responseEnd: 100 },
        { name: 'image.jpg', initiatorType: 'img', transferSize: 200000, requestStart: 0, responseEnd: 300 }
      ];

      resources.forEach(resource => rumMonitor.trackResourceTiming(resource));

      const categorized = rumMonitor.getResourceBreakdown();

      expect(categorized.scripts).toBeDefined();
      expect(categorized.styles).toBeDefined();
      expect(categorized.images).toBeDefined();
    });
  });

  describe('User Interaction Tracking', () => {
    it('should track user interactions', () => {
      const mockInteraction = {
        name: 'click',
        startTime: 1000,
        processingStart: 1020,
        duration: 50
      };

      rumMonitor.trackUserInteraction(mockInteraction);

      expect(rumMonitor.metrics.interactions.length).toBe(1);
      expect(rumMonitor.metrics.interactions[0].type).toBe('click');
      expect(rumMonitor.metrics.interactions[0].latency).toBe(20);
    });

    it('should calculate interaction satisfaction', () => {
      // Fast interactions
      rumMonitor.trackUserInteraction({ name: 'click', startTime: 0, processingStart: 10 });
      rumMonitor.trackUserInteraction({ name: 'scroll', startTime: 0, processingStart: 5 });

      // Slow interaction
      rumMonitor.trackUserInteraction({ name: 'click', startTime: 0, processingStart: 200 });

      const satisfaction = rumMonitor.getInteractionSatisfaction();

      expect(satisfaction.score).toBeGreaterThan(0);
      expect(satisfaction.score).toBeLessThanOrEqual(1);
      expect(satisfaction.fastInteractions).toBe(2);
      expect(satisfaction.slowInteractions).toBe(1);
    });
  });

  describe('Performance Reporting', () => {
    it('should generate comprehensive performance report', () => {
      // Add sample metrics
      rumMonitor.handleLCP({ startTime: 2200 });
      rumMonitor.handleFID({ processingStart: 150, startTime: 120 });
      rumMonitor.handleCLS({ value: 0.08 });
      rumMonitor.trackNavigationTiming({
        domContentLoadedEventEnd: 1800,
        loadEventEnd: 2800,
        fetchStart: 0
      });

      const report = rumMonitor.generatePerformanceReport();

      expect(report).toHaveProperty('coreWebVitals');
      expect(report).toHaveProperty('navigation');
      expect(report).toHaveProperty('resources');
      expect(report).toHaveProperty('interactions');
      expect(report).toHaveProperty('scores');
      expect(report).toHaveProperty('timestamp');
    });

    it('should send reports to analytics endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const report = { test: 'data' };
      await rumMonitor.sendReport(report);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/performance'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(report)
        })
      );
    });
  });
});

describe('PerformanceBudgetManager', () => {
  let budgetManager;

  beforeEach(() => {
    budgetManager = new PerformanceBudgetManager();
  });

  describe('Budget Definition', () => {
    it('should set performance budgets', () => {
      const budgets = {
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        totalSize: 5 * 1024 * 1024,
        resourceCount: 50
      };

      budgetManager.setBudgets(budgets);

      expect(budgetManager.budgets).toEqual(budgets);
    });

    it('should validate budget values', () => {
      expect(() => budgetManager.setBudgets({ lcp: -100 })).toThrow('Invalid budget value');
      expect(() => budgetManager.setBudgets({ cls: 2.0 })).toThrow('CLS budget must be <= 1.0');
    });
  });

  describe('Budget Checking', () => {
    beforeEach(() => {
      budgetManager.setBudgets({
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        totalSize: 2 * 1024 * 1024,
        resourceCount: 30
      });
    });

    it('should check Core Web Vitals budgets', () => {
      const results = budgetManager.checkBudgets({
        lcp: 2200, // Good
        fid: 150,  // Bad
        cls: 0.05  // Good
      });

      expect(results.lcp.passed).toBe(true);
      expect(results.fid.passed).toBe(false);
      expect(results.cls.passed).toBe(true);
      expect(results.overall.passed).toBe(false);
    });

    it('should check resource budgets', () => {
      const results = budgetManager.checkBudgets({
        totalSize: 3 * 1024 * 1024, // Over budget
        resourceCount: 25 // Under budget
      });

      expect(results.totalSize.passed).toBe(false);
      expect(results.resourceCount.passed).toBe(true);
    });
  });

  describe('Budget Reporting', () => {
    it('should generate budget violation report', () => {
      budgetManager.setBudgets({
        lcp: 2500,
        totalSize: 2 * 1024 * 1024
      });

      const violations = budgetManager.getBudgetViolations({
        lcp: 3000,
        totalSize: 3 * 1024 * 1024
      });

      expect(violations.length).toBe(2);
      expect(violations[0].metric).toBe('lcp');
      expect(violations[1].metric).toBe('totalSize');
    });

    it('should calculate budget utilization', () => {
      budgetManager.setBudgets({
        lcp: 2500,
        fid: 100
      });

      const utilization = budgetManager.getBudgetUtilization({
        lcp: 2000,
        fid: 80
      });

      expect(utilization.lcp).toBe(0.8); // 80% of budget used
      expect(utilization.fid).toBe(0.8);
    });
  });
});

describe('MemoryProfiler', () => {
  let memoryProfiler;

  beforeEach(() => {
    // Mock performance.memory
    global.performance.memory = {
      usedJSHeapSize: 50 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 200 * 1024 * 1024
    };

    memoryProfiler = new MemoryProfiler();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Memory Monitoring', () => {
    it('should track memory usage over time', () => {
      memoryProfiler.startMonitoring();

      // Simulate memory changes
      global.performance.memory.usedJSHeapSize = 60 * 1024 * 1024;
      memoryProfiler.takeSnapshot();

      global.performance.memory.usedJSHeapSize = 70 * 1024 * 1024;
      memoryProfiler.takeSnapshot();

      const history = memoryProfiler.getMemoryHistory();
      expect(history.length).toBeGreaterThan(1);
      expect(history[history.length - 1].used).toBe(70 * 1024 * 1024);
    });

    it('should detect memory leaks', () => {
      memoryProfiler.startMonitoring();

      // Simulate increasing memory usage
      for (let i = 0; i < 10; i++) {
        global.performance.memory.usedJSHeapSize = (50 + i * 5) * 1024 * 1024;
        memoryProfiler.takeSnapshot();
      }

      const leakDetected = memoryProfiler.detectMemoryLeak();
      expect(leakDetected).toBe(true);
    });

    it('should trigger garbage collection when needed', () => {
      global.performance.memory.usedJSHeapSize = 180 * 1024 * 1024; // 90% of limit
      global.gc = vi.fn();

      memoryProfiler.checkMemoryPressure();

      expect(global.gc).toHaveBeenCalled();
    });

    it('should calculate memory efficiency', () => {
      // Set up memory usage pattern
      memoryProfiler.startMonitoring();

      // Low memory usage initially
      global.performance.memory.usedJSHeapSize = 30 * 1024 * 1024;
      memoryProfiler.takeSnapshot();

      // Higher usage during operation
      global.performance.memory.usedJSHeapSize = 80 * 1024 * 1024;
      memoryProfiler.takeSnapshot();

      // Back to lower usage after cleanup
      global.performance.memory.usedJSHeapSize = 35 * 1024 * 1024;
      memoryProfiler.takeSnapshot();

      const efficiency = memoryProfiler.calculateMemoryEfficiency();
      expect(efficiency).toBeGreaterThan(0);
      expect(efficiency).toBeLessThanOrEqual(1);
    });
  });

  describe('Memory Analysis', () => {
    it('should analyze memory patterns', () => {
      memoryProfiler.startMonitoring();

      // Simulate different memory patterns
      const patterns = [
        { time: 0, memory: 50 * 1024 * 1024 },
        { time: 1000, memory: 60 * 1024 * 1024 },
        { time: 2000, memory: 55 * 1024 * 1024 },
        { time: 3000, memory: 70 * 1024 * 1024 },
        { time: 4000, memory: 65 * 1024 * 1024 }
      ];

      patterns.forEach(pattern => {
        global.performance.memory.usedJSHeapSize = pattern.memory;
        memoryProfiler.takeSnapshot();
      });

      const analysis = memoryProfiler.analyzeMemoryPatterns();

      expect(analysis).toHaveProperty('averageUsage');
      expect(analysis).toHaveProperty('peakUsage');
      expect(analysis).toHaveProperty('trend');
      expect(analysis.averageUsage).toBeDefined();
      expect(analysis.peakUsage).toBeDefined();
    });

    it('should generate memory reports', () => {
      memoryProfiler.startMonitoring();
      memoryProfiler.takeSnapshot();

      const report = memoryProfiler.generateMemoryReport();

      expect(report).toHaveProperty('current');
      expect(report).toHaveProperty('peak');
      expect(report).toHaveProperty('average');
      expect(report).toHaveProperty('efficiency');
      expect(report).toHaveProperty('recommendations');
    });
  });
});

describe('ServiceWorkerCacheMonitor', () => {
  let cacheMonitor;

  beforeEach(() => {
    // Mock Cache API
    global.caches = {
      open: vi.fn().mockResolvedValue({
        match: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
        keys: vi.fn().mockResolvedValue([])
      })
    };

    cacheMonitor = new ServiceWorkerCacheMonitor();
  });

  describe('Cache Performance Monitoring', () => {
    it('should track cache hit rates', async () => {
      // Simulate cache operations
      await cacheMonitor.recordCacheAccess('hit');
      await cacheMonitor.recordCacheAccess('hit');
      await cacheMonitor.recordCacheAccess('miss');
      await cacheMonitor.recordCacheAccess('hit');

      const hitRate = cacheMonitor.getCacheHitRate();
      expect(hitRate).toBe(0.75); // 3 hits out of 4 requests
    });

    it('should measure cache response times', async () => {
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 50));
      await cacheMonitor.recordCacheResponseTime(Date.now() - startTime);

      const avgResponseTime = cacheMonitor.getAverageCacheResponseTime();
      expect(avgResponseTime).toBeGreaterThan(45);
      expect(avgResponseTime).toBeLessThan(55);
    });

    it('should analyze cache efficiency', async () => {
      // Add cache entries
      await cacheMonitor.recordCacheEntry('script.js', 100000, 'js');
      await cacheMonitor.recordCacheEntry('style.css', 50000, 'css');
      await cacheMonitor.recordCacheEntry('image.jpg', 200000, 'image');

      const efficiency = await cacheMonitor.analyzeCacheEfficiency();

      expect(efficiency).toHaveProperty('totalSize');
      expect(efficiency).toHaveProperty('entryCount');
      expect(efficiency).toHaveProperty('compressionRatio');
      expect(efficiency.totalSize).toBe(350000);
      expect(efficiency.entryCount).toBe(3);
    });
  });

  describe('Cache Strategy Analysis', () => {
    it('should recommend cache strategies', async () => {
      // Simulate access patterns
      const accessPatterns = [
        { url: 'app.js', hits: 100, misses: 1 },
        { url: 'data.json', hits: 10, misses: 20 },
        { url: 'static.png', hits: 50, misses: 0 }
      ];

      for (const pattern of accessPatterns) {
        for (let i = 0; i < pattern.hits; i++) {
          await cacheMonitor.recordCacheAccess('hit', pattern.url);
        }
        for (let i = 0; i < pattern.misses; i++) {
          await cacheMonitor.recordCacheAccess('miss', pattern.url);
        }
      }

      const recommendations = await cacheMonitor.getCacheStrategyRecommendations();

      expect(recommendations).toContainEqual(
        expect.objectContaining({
          url: 'app.js',
          recommendedStrategy: 'Cache First'
        })
      );

      expect(recommendations).toContainEqual(
        expect.objectContaining({
          url: 'data.json',
          recommendedStrategy: 'Network First'
        })
      );
    });

    it('should detect stale cache entries', async () => {
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      await cacheMonitor.recordCacheEntry('fresh.js', 1000, 'js', now);
      await cacheMonitor.recordCacheEntry('stale.js', 1000, 'js', oneDayAgo);

      const staleEntries = await cacheMonitor.detectStaleEntries(12 * 60 * 60 * 1000); // 12 hours

      expect(staleEntries).toContain('stale.js');
      expect(staleEntries).not.toContain('fresh.js');
    });
  });
});

describe('PerformanceRegressionDetector', () => {
  let regressionDetector;

  beforeEach(() => {
    regressionDetector = new PerformanceRegressionDetector();
  });

  describe('Baseline Management', () => {
    it('should establish performance baselines', () => {
      const metrics = {
        lcp: 2000,
        fid: 50,
        cls: 0.05,
        fcp: 1500
      };

      regressionDetector.setBaseline(metrics);

      expect(regressionDetector.baseline).toEqual(metrics);
    });

    it('should update baselines over time', () => {
      // Initial baseline
      regressionDetector.setBaseline({ lcp: 2000 });

      // Add measurements
      for (let i = 0; i < 10; i++) {
        regressionDetector.recordMeasurement({ lcp: 1950 + i * 10 });
      }

      regressionDetector.updateBaseline();

      // Baseline should be updated to recent average
      expect(regressionDetector.baseline.lcp).toBeGreaterThan(2000);
    });
  });

  describe('Regression Detection', () => {
    beforeEach(() => {
      regressionDetector.setBaseline({
        lcp: 2000,
        fid: 50,
        cls: 0.05
      });
    });

    it('should detect performance regressions', () => {
      const currentMetrics = {
        lcp: 2800, // Significantly worse
        fid: 45,   // Slightly better
        cls: 0.15  // Significantly worse
      };

      const regressions = regressionDetector.detectRegressions(currentMetrics);

      expect(regressions.length).toBe(2);
      expect(regressions.some(r => r.metric === 'lcp')).toBe(true);
      expect(regressions.some(r => r.metric === 'cls')).toBe(true);
    });

    it('should calculate regression severity', () => {
      const severeRegression = regressionDetector.calculateRegressionSeverity('lcp', 2000, 3500);
      const minorRegression = regressionDetector.calculateRegressionSeverity('fid', 50, 60);

      expect(severeRegression).toBe('severe');
      expect(minorRegression).toBe('minor');
    });

    it('should handle acceptable variations', () => {
      const minorVariation = {
        lcp: 2100, // Within acceptable range
        fid: 55,   // Within acceptable range
        cls: 0.06  // Within acceptable range
      };

      const regressions = regressionDetector.detectRegressions(minorVariation);

      expect(regressions.length).toBe(0);
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze performance trends', () => {
      // Add measurements over time
      const measurements = [
        { timestamp: Date.now() - 60000, metrics: { lcp: 2000 } },
        { timestamp: Date.now() - 30000, metrics: { lcp: 2100 } },
        { timestamp: Date.now(), metrics: { lcp: 2200 } }
      ];

      measurements.forEach(m => regressionDetector.recordMeasurement(m.metrics, m.timestamp));

      const trend = regressionDetector.analyzeTrend('lcp');

      expect(trend.direction).toBe('increasing');
      expect(trend.slope).toBeGreaterThan(0);
      expect(trend.significance).toBeDefined();
    });

    it('should predict future performance', () => {
      // Add historical data
      for (let i = 0; i < 10; i++) {
        regressionDetector.recordMeasurement({
          lcp: 2000 + i * 20
        });
      }

      const prediction = regressionDetector.predictFuturePerformance('lcp', 5);

      expect(prediction).toHaveProperty('predictedValue');
      expect(prediction).toHaveProperty('confidence');
      expect(prediction.predictedValue).toBeGreaterThan(2000);
    });
  });
});</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/tests/unit/advanced-performance-monitoring.unit.spec.js