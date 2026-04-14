import { test, expect } from '@playwright/test';
import { performanceBudget } from '../src/lib/performance-budget.js';

test.describe('Comprehensive Performance Testing', () => {
  test.describe.configure({ mode: 'serial' }); // Run tests sequentially for accurate measurements

  test('bundle size budgets', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for bundles to load
    await page.waitForTimeout(2000);

    // Check bundle sizes via performance API
    const bundleStats = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(r => r.name.includes('.js'));

      return jsResources.map(r => ({
        url: r.name,
        size: r.transferSize || r.decodedBodySize || 0,
        loadTime: r.responseEnd - r.requestStart
      }));
    });

    console.log('Bundle analysis:', bundleStats);

    // Basic bundle size checks
    const totalSize = bundleStats.reduce((sum, r) => sum + r.size, 0);
    expect(totalSize).toBeLessThan(2 * 1024 * 1024); // 2MB total

    // Check for any extremely large bundles
    const largeBundles = bundleStats.filter(r => r.size > 500 * 1024); // 500KB
    expect(largeBundles.length).toBeLessThan(3); // Max 3 large bundles
  });

  test('core web vitals', async ({ page }) => {
    // Start monitoring CWV
    await page.addScriptTag({
      content: `
        window.cwvMetrics = {};

        // Polyfill for web-vitals if needed
        if (!window.performance.getEntriesByType) {
          window.performance.getEntriesByType = () => [];
        }
      `
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for page to stabilize
    await page.waitForTimeout(3000);

    // Measure Core Web Vitals
    const cwvMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics = {
          fcp: null,
          lcp: null,
          cls: 0,
          fid: null
        };

        // FCP
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!metrics.fcp) {
              metrics.fcp = entry.startTime;
            }
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // LCP
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metrics.lcp = Math.max(metrics.lcp || 0, entry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // CLS
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metrics.cls += entry.value;
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // FID
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!metrics.fid) {
              metrics.fid = entry.processingStart - entry.startTime;
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Resolve after 5 seconds
        setTimeout(() => {
          fcpObserver.disconnect();
          lcpObserver.disconnect();
          clsObserver.disconnect();
          fidObserver.disconnect();
          resolve(metrics);
        }, 5000);
      });
    });

    console.log('Core Web Vitals:', cwvMetrics);

    // Assert reasonable performance
    if (cwvMetrics.fcp) {
      expect(cwvMetrics.fcp).toBeLessThan(2000); // FCP < 2s
    }

    if (cwvMetrics.lcp) {
      expect(cwvMetrics.lcp).toBeLessThan(3000); // LCP < 3s
    }

    expect(cwvMetrics.cls).toBeLessThan(0.1); // CLS < 0.1
  });

  test('memory usage monitoring', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Navigate through different sections to trigger memory usage
    const sections = ['image', 'video', 'timeline', 'templates'];

    for (const section of sections) {
      await page.click(`[data-nav="${section}"]`);
      await page.waitForTimeout(1000);
    }

    // Check memory usage
    const memoryStats = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          usagePercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        };
      }
      return null;
    });

    if (memoryStats) {
      console.log('Memory usage:', memoryStats);
      expect(memoryStats.usagePercent).toBeLessThan(80); // < 80% of heap limit
      expect(memoryStats.used).toBeLessThan(100 * 1024 * 1024); // < 100MB
    }
  });

  test('image loading performance', async ({ page }) => {
    await page.goto('/image', { waitUntil: 'networkidle' });

    // Wait for images to load
    await page.waitForTimeout(3000);

    // Check image loading performance
    const imageStats = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const stats = images.map(img => {
        const entry = performance.getEntriesByName(img.src)[0];
        return {
          src: img.src,
          loadTime: entry ? entry.responseEnd - entry.requestStart : null,
          size: entry ? entry.transferSize : null,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        };
      });

      return {
        totalImages: images.length,
        loadedImages: stats.filter(s => s.loadTime !== null).length,
        avgLoadTime: stats.filter(s => s.loadTime).reduce((sum, s) => sum + s.loadTime, 0) / stats.filter(s => s.loadTime).length,
        slowImages: stats.filter(s => s.loadTime && s.loadTime > 1000).length
      };
    });

    console.log('Image loading stats:', imageStats);

    // Assert reasonable image loading performance
    expect(imageStats.loadedImages).toBeGreaterThan(0);
    expect(imageStats.avgLoadTime || 0).toBeLessThan(2000); // < 2s average
    expect(imageStats.slowImages).toBeLessThan(imageStats.totalImages * 0.2); // < 20% slow images
  });

  test('component render performance', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Trigger some interactions
    await page.click('[data-nav="image"]');
    await page.waitForTimeout(1000);
    await page.click('[data-nav="video"]');
    await page.waitForTimeout(1000);

    // Get basic performance metrics
    const perfMetrics = await page.evaluate(() => {
      return {
        navigationTiming: performance.getEntriesByType('navigation')[0],
        resources: performance.getEntriesByType('resource').length,
        longTasks: performance.getEntriesByType('longtask').length
      };
    });

    console.log('Performance metrics:', perfMetrics);

    // Assert reasonable performance
    expect(perfMetrics.longTasks).toBeLessThan(5); // Few long tasks
    expect(perfMetrics.resources).toBeLessThan(200); // Reasonable number of resources
  });

  test('network request optimization', async ({ page }) => {
    const client = await page.context().newCDPSession(page);

    // Enable network tracking
    await client.send('Network.enable');

    const requests = [];

    client.on('Network.responseReceived', (event) => {
      requests.push({
        url: event.response.url,
        status: event.response.status,
        size: event.response.encodedDataLength || 0,
        timing: event.response.timing
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Analyze network requests
    const networkStats = {
      totalRequests: requests.length,
      totalSize: requests.reduce((sum, r) => sum + r.size, 0),
      slowRequests: requests.filter(r => {
        const timing = r.timing;
        return timing && (timing.receiveHeadersEnd - timing.requestTime) > 1000;
      }).length,
      largeRequests: requests.filter(r => r.size > 100 * 1024).length // > 100KB
    };

    console.log('Network stats:', networkStats);

    // Assert reasonable network performance
    expect(networkStats.totalRequests).toBeLessThan(100);
    expect(networkStats.slowRequests).toBeLessThan(10);
    expect(networkStats.largeRequests).toBeLessThan(5);
  });
});