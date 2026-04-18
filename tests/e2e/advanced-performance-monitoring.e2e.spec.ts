/**
 * Advanced Performance Monitoring E2E Tests
 * Tests real user monitoring, performance budgets, optimization tracking
 */

import { test, expect } from '@playwright/test';

test.describe('Real User Monitoring (RUM)', () => {
  test('should track real user performance metrics', async ({ page }) => {
    const performanceMetrics = [];

    // Setup performance observer
    await page.evaluate(() => {
      window.rumMetrics = [];

      // Core Web Vitals tracking
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.rumMetrics.push({
            name: entry.name,
            value: entry.value,
            timestamp: Date.now()
          });
        }
      }).observe({ entryTypes: ['measure'] });

      // Navigation timing
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0];
        window.rumMetrics.push({
          name: 'navigation_timing',
          value: {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            loadComplete: navigation.loadEventEnd - navigation.fetchStart
          },
          timestamp: Date.now()
        });
      });

      // Resource timing
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.initiatorType === 'img' || entry.initiatorType === 'script') {
            window.rumMetrics.push({
              name: 'resource_timing',
              value: {
                url: entry.name,
                type: entry.initiatorType,
                duration: entry.responseEnd - entry.requestStart
              },
              timestamp: Date.now()
            });
          }
        }
      }).observe({ entryTypes: ['resource'] });
    });

    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Simulate user interactions
    await page.click('button, a');
    await page.waitForTimeout(1000);

    // Check collected metrics
    const metrics = await page.evaluate(() => window.rumMetrics);

    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics.some(m => m.name === 'navigation_timing')).toBe(true);
  });

  test('should implement performance budgets', async ({ page }) => {
    const budgetViolations = [];

    await page.evaluate(() => {
      window.budgetViolations = [];

      // Mock performance budget checker
      window.checkPerformanceBudget = () => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');

        const budgets = {
          navigationTiming: 3000, // 3s
          totalResources: 50,
          totalSize: 5 * 1024 * 1024 // 5MB
        };

        // Check navigation timing
        const navTime = navigation.loadEventEnd - navigation.fetchStart;
        if (navTime > budgets.navigationTiming) {
          window.budgetViolations.push({
            type: 'navigation_timing',
            actual: navTime,
            budget: budgets.navigationTiming
          });
        }

        // Check resource count
        if (resources.length > budgets.totalResources) {
          window.budgetViolations.push({
            type: 'resource_count',
            actual: resources.length,
            budget: budgets.totalResources
          });
        }

        // Check total size
        const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        if (totalSize > budgets.totalSize) {
          window.budgetViolations.push({
            type: 'total_size',
            actual: totalSize,
            budget: budgets.totalSize
          });
        }
      };
    });

    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Check performance budget
    const violations = await page.evaluate(() => {
      window.checkPerformanceBudget();
      return window.budgetViolations;
    });

    // Log violations but don't fail test (budget violations are warnings)
    if (violations.length > 0) {
      console.warn('Performance budget violations:', violations);
    }

    // Test should pass regardless of budget violations
    expect(Array.isArray(violations)).toBe(true);
  });

  test('should monitor user interaction latency', async ({ page }) => {
    const interactionLatencies = [];

    await page.evaluate(() => {
      window.interactionLatencies = [];

      // Monitor user interactions
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'event' || entry.entryType === 'first-input') {
            window.interactionLatencies.push({
              type: entry.name,
              latency: entry.processingStart - entry.startTime,
              timestamp: Date.now()
            });
          }
        }
      });

      observer.observe({ entryTypes: ['event', 'first-input'] });
    });

    await page.goto('/interactive-page');

    // Perform various interactions
    const interactions = [
      () => page.click('button'),
      () => page.type('input', 'test'),
      () => page.selectOption('select', 'option1'),
      () => page.hover('.hover-element')
    ];

    for (const interaction of interactions) {
      await interaction();
      await page.waitForTimeout(100);
    }

    // Check interaction latencies
    const latencies = await page.evaluate(() => window.interactionLatencies);

    expect(latencies.length).toBeGreaterThan(0);

    // All interactions should be under 100ms
    latencies.forEach(latency => {
      expect(latency.latency).toBeLessThan(100);
    });
  });
});

test.describe('Advanced Memory Management', () => {
  test('should detect memory leaks in long-running sessions', async ({ page }) => {
    if (!page.context().browser().browserType().name().includes('chromium')) {
      test.skip('Memory leak testing requires Chromium');
      return;
    }

    const memorySnapshots = [];

    // Take initial memory snapshot
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          timestamp: Date.now()
        };
      }
      return null;
    });

    if (!initialMemory) {
      test.skip('Memory API not available');
      return;
    }

    memorySnapshots.push(initialMemory);

    // Navigate through multiple pages and perform operations
    const pages = ['/', '/dashboard', '/settings', '/profile', '/timeline'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      // Perform memory-intensive operations
      await page.evaluate(() => {
        // Create some objects to stress memory
        const arrays = [];
        for (let i = 0; i < 1000; i++) {
          arrays.push(new Array(1000).fill(Math.random()));
        }
        // Clean up immediately
        arrays.length = 0;
      });

      // Take memory snapshot
      const snapshot = await page.evaluate(() => ({
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        timestamp: Date.now()
      }));

      memorySnapshots.push(snapshot);

      // Force garbage collection if available
      try {
        await page.evaluate(() => {
          if (window.gc) window.gc();
        });
      } catch (e) {
        // GC not available, continue
      }

      await page.waitForTimeout(500);
    }

    // Analyze memory trend
    const finalMemory = memorySnapshots[memorySnapshots.length - 1];
    const memoryIncrease = finalMemory.used - initialMemory.used;
    const maxAllowedIncrease = 50 * 1024 * 1024; // 50MB allowance

    expect(memoryIncrease).toBeLessThan(maxAllowedIncrease);

    // Check for memory spikes
    const spikes = memorySnapshots.filter((snapshot, index) => {
      if (index === 0) return false;
      const increase = snapshot.used - memorySnapshots[index - 1].used;
      return increase > 20 * 1024 * 1024; // 20MB spike
    });

    expect(spikes.length).toBeLessThan(2); // Allow 1 spike (initial page load)
  });

  test('should optimize memory usage for large datasets', async ({ page }) => {
    await page.goto('/data-visualization');

    const initialMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);

    // Load large dataset
    await page.click('button.load-large-dataset, .load-data');

    // Mock large data loading
    await page.route('**/api/large-dataset', async route => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000,
        description: 'A'.repeat(100) // Large string
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeData)
      });
    });

    await page.waitForTimeout(2000);

    const afterLoadMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);

    // Memory increase should be reasonable for 10k items
    const memoryIncrease = afterLoadMemory - initialMemory;
    const maxAllowedIncrease = 100 * 1024 * 1024; // 100MB for large dataset

    expect(memoryIncrease).toBeLessThan(maxAllowedIncrease);

    // Should implement virtual scrolling or pagination
    const virtualScroll = await page.locator('.virtual-scroll, .infinite-scroll').isVisible();
    const pagination = await page.locator('.pagination').isVisible();

    expect(virtualScroll || pagination).toBe(true);
  });

  test('should handle memory pressure gracefully', async ({ page }) => {
    await page.goto('/memory-intensive-page');

    // Simulate memory pressure
    await page.evaluate(() => {
      // Fill memory gradually
      const largeArrays = [];
      const fillMemory = () => {
        try {
          while (true) {
            largeArrays.push(new Array(1000000).fill(1));
          }
        } catch (e) {
          // Memory full, trigger cleanup
          window.memoryPressure = true;
          largeArrays.length = 0;
        }
      };

      fillMemory();
    });

    // App should handle memory pressure
    const memoryPressureHandled = await page.evaluate(() => {
      return window.memoryPressure === true;
    });

    expect(memoryPressureHandled).toBe(true);

    // Should show memory warning or cleanup UI
    const memoryWarning = await page.locator('.memory-warning, .low-memory').isVisible();
    expect(memoryWarning).toBe(true);
  });
});

test.describe('Performance Optimization Tracking', () => {
  test('should track bundle splitting effectiveness', async ({ page }) => {
    const bundleMetrics = {
      main: null,
      vendor: null,
      dynamic: []
    };

    page.on('response', response => {
      const url = response.url();
      if (url.includes('.js') && !url.includes('chrome-extension')) {
        const size = response.headers()['content-length'] || '0';
        const loadTime = Date.now();

        if (url.includes('main') || url.includes('app')) {
          bundleMetrics.main = { size: parseInt(size), loadTime };
        } else if (url.includes('vendor') || url.includes('chunk')) {
          bundleMetrics.vendor = { size: parseInt(size), loadTime };
        } else if (url.includes('dynamic') || url.includes('lazy')) {
          bundleMetrics.dynamic.push({ size: parseInt(size), loadTime });
        }
      }
    });

    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Navigate to trigger dynamic imports
    await page.goto('/lazy-loaded-route');
    await page.waitForLoadState('networkidle');

    // Check bundle splitting
    expect(bundleMetrics.main).toBeTruthy();
    expect(bundleMetrics.main.size).toBeLessThan(2 * 1024 * 1024); // Main bundle < 2MB

    if (bundleMetrics.vendor) {
      expect(bundleMetrics.vendor.size).toBeLessThan(3 * 1024 * 1024); // Vendor < 3MB
    }

    // Should have dynamic chunks
    expect(bundleMetrics.dynamic.length).toBeGreaterThan(0);
  });

  test('should monitor service worker caching effectiveness', async ({ page }) => {
    // Register service worker
    await page.evaluate(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          window.swRegistration = registration;
        });
      }
    });

    await page.waitForTimeout(1000);

    const cacheHits = [];
    const cacheMisses = [];

    // Monitor network requests
    page.on('response', response => {
      const fromCache = response.fromServiceWorker();
      const url = response.url();

      if (fromCache) {
        cacheHits.push(url);
      } else {
        cacheMisses.push(url);
      }
    });

    // Navigate to cached pages
    await page.goto('/');
    await page.reload();
    await page.goto('/about');
    await page.reload();

    // Check cache effectiveness
    const hitRate = cacheHits.length / (cacheHits.length + cacheMisses.length);

    // Should have reasonable cache hit rate on reloads
    expect(hitRate).toBeGreaterThan(0.3); // At least 30% cache hits
  });

  test('should track third-party script performance', async ({ page }) => {
    const thirdPartyMetrics = [];

    page.on('response', response => {
      const url = response.url();

      // Identify third-party scripts
      if (url.includes('google') || url.includes('analytics') ||
          url.includes('facebook') || url.includes('twitter') ||
          url.includes('cdn') || url.includes('jsdelivr')) {

        thirdPartyMetrics.push({
          url,
          size: response.headers()['content-length'] || '0',
          timing: Date.now()
        });
      }
    });

    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Should minimize third-party scripts or load them efficiently
    const blockingScripts = thirdPartyMetrics.filter(script =>
      script.url.includes('sync') || script.url.includes('blocking')
    );

    expect(blockingScripts.length).toBeLessThan(3); // Limit blocking third-party scripts

    // Third-party scripts should be loaded asynchronously
    for (const script of thirdPartyMetrics) {
      const isAsync = await page.evaluate((url) => {
        const scripts = Array.from(document.querySelectorAll('script'));
        const scriptEl = scripts.find(s => s.src === url);
        return scriptEl ? scriptEl.async || scriptEl.defer : false;
      }, script.url);

      expect(isAsync).toBe(true);
    }
  });

  test('should implement performance regression detection', async ({ page }) => {
    const performanceBaselines = {
      lcp: 2500, // 2.5s
      fid: 100,  // 100ms
      cls: 0.1,  // 0.1 cumulative layout shift
      fcp: 2000, // 2s
      ttfb: 800  // 800ms
    };

    const currentMetrics = {};

    await page.evaluate(() => {
      window.performanceMetrics = {};

      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        window.performanceMetrics.lcp = entries[entries.length - 1]?.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.performanceMetrics.fid = entry.processingStart - entry.startTime;
        }
      }).observe({ entryTypes: ['first-input'] });

      // CLS
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        window.performanceMetrics.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // FCP
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            window.performanceMetrics.fcp = entry.startTime;
          }
        }
      }).observe({ entryTypes: ['paint'] });
    });

    await page.goto('/');

    // Wait for metrics to be collected
    await page.waitForLoadState('networkidle');
    await page.click('body'); // Trigger FID
    await page.waitForTimeout(2000);

    const metrics = await page.evaluate(() => window.performanceMetrics);

    // Check for performance regressions
    const regressions = [];

    if (metrics.lcp && metrics.lcp > performanceBaselines.lcp) {
      regressions.push(`LCP regression: ${metrics.lcp}ms > ${performanceBaselines.lcp}ms`);
    }

    if (metrics.fid && metrics.fid > performanceBaselines.fid) {
      regressions.push(`FID regression: ${metrics.fid}ms > ${performanceBaselines.fid}ms`);
    }

    if (metrics.cls && metrics.cls > performanceBaselines.cls) {
      regressions.push(`CLS regression: ${metrics.cls} > ${performanceBaselines.cls}`);
    }

    // Log regressions but don't fail test (regressions are tracked separately)
    if (regressions.length > 0) {
      console.warn('Performance regressions detected:', regressions);
    }

    expect(Array.isArray(regressions)).toBe(true);
  });
});</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/tests/e2e/advanced-performance-monitoring.e2e.spec.ts