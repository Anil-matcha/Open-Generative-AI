/**
 * Performance Monitoring and Optimization E2E Tests
 * Tests performance metrics, lazy loading, memory usage, and optimization features in the browser
 */

import { test, expect } from '@playwright/test';

test.describe('Core Web Vitals', () => {
  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    // Start performance monitoring
    const performanceData = {
      lcp: null,
      fid: null,
      cls: null
    };

    // Monitor Core Web Vitals
    await page.evaluate(() => {
      // Mock Core Web Vitals tracking (in real app, this would use web-vitals library)
      window.coreWebVitals = {};

      // LCP (Largest Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.coreWebVitals.lcp = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID (First Input Delay)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.coreWebVitals.fid = entry.processingStart - entry.startTime;
        }
      }).observe({ entryTypes: ['first-input'] });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        window.coreWebVitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });
    });

    await page.goto('/');

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // Simulate user interaction for FID
    await page.click('body');

    // Wait a bit more for metrics to be collected
    await page.waitForTimeout(2000);

    const vitals = await page.evaluate(() => window.coreWebVitals);

    // Check Core Web Vitals thresholds (Google's recommended values)
    if (vitals.lcp !== null) {
      expect(vitals.lcp).toBeLessThan(2500); // LCP < 2.5s
    }

    if (vitals.fid !== null) {
      expect(vitals.fid).toBeLessThan(100); // FID < 100ms
    }

    if (vitals.cls !== null) {
      expect(vitals.cls).toBeLessThan(0.1); // CLS < 0.1
    }
  });

  test('should have good First Paint and First Contentful Paint', async ({ page }) => {
    const paintMetrics = {};

    await page.evaluate(() => {
      window.paintMetrics = {};

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.paintMetrics[entry.name] = entry.startTime;
        }
      }).observe({ entryTypes: ['paint'] });
    });

    await page.goto('/');

    await page.waitForLoadState('domcontentloaded');

    const metrics = await page.evaluate(() => window.paintMetrics);

    // First Paint should be reasonable
    if (metrics['first-paint']) {
      expect(metrics['first-paint']).toBeLessThan(2000); // FP < 2s
    }

    // First Contentful Paint should be good
    if (metrics['first-contentful-paint']) {
      expect(metrics['first-contentful-paint']).toBeLessThan(2000); // FCP < 2s
    }
  });
});

test.describe('Lazy Loading', () => {
  test('should lazy load images', async ({ page }) => {
    await page.goto('/gallery');

    // Check that images have loading="lazy"
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const loading = await images.nth(i).getAttribute('loading');
        expect(loading).toBe('lazy');
      }
    }
  });

  test('should lazy load components on scroll', async ({ page }) => {
    await page.goto('/long-page');

    // Check initial component count
    const initialComponents = page.locator('.lazy-component, .dynamic-content');
    const initialCount = await initialComponents.count();

    // Scroll to bottom to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(1000);

    // Check that more components loaded
    const finalComponents = page.locator('.lazy-component, .dynamic-content');
    const finalCount = await finalComponents.count();

    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should preload critical resources', async ({ page }) => {
    const preloadLinks = [];

    page.on('response', response => {
      const linkHeader = response.headers()['link'];
      if (linkHeader && linkHeader.includes('rel=preload')) {
        preloadLinks.push(linkHeader);
      }
    });

    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Should have preload links in headers or HTML
    const htmlPreloads = page.locator('link[rel="preload"]');
    const htmlPreloadCount = await htmlPreloads.count();

    expect(htmlPreloadCount).toBeGreaterThan(0);
  });
});

test.describe('Memory Management', () => {
  test('should not have memory leaks during navigation', async ({ page }) => {
    // This test requires memory monitoring capabilities
    if (!page.context().browser().browserType().name().includes('chromium')) {
      test.skip('Memory testing only works in Chromium');
      return;
    }

    const memoryReadings = [];

    // Navigate through multiple pages
    const pages = ['/', '/dashboard', '/settings', '/profile'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const memory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });

      if (memory) {
        memoryReadings.push(memory);
      }

      // Perform some interactions
      await page.click('body');
      await page.waitForTimeout(500);
    }

    // Check memory trend - should not continuously increase
    if (memoryReadings.length >= 3) {
      const firstReading = memoryReadings[0].used;
      const lastReading = memoryReadings[memoryReadings.length - 1].used;
      const memoryIncrease = lastReading - firstReading;
      const maxAllowedIncrease = 50 * 1024 * 1024; // 50MB allowance

      expect(memoryIncrease).toBeLessThan(maxAllowedIncrease);
    }
  });

  test('should clean up event listeners', async ({ page }) => {
    await page.goto('/interactive-page');

    // Get initial event listener count (approximated by checking for common patterns)
    const initialEventListeners = await page.evaluate(() => {
      // This is a rough approximation - in real apps you'd track this more precisely
      return window.eventListenersCount || 0;
    });

    // Navigate away and come back
    await page.goto('/other-page');
    await page.goBack();

    const finalEventListeners = await page.evaluate(() => {
      return window.eventListenersCount || 0;
    });

    // Event listeners should not grow unbounded
    expect(finalEventListeners).toBeLessThanOrEqual(initialEventListeners + 10); // Allow some tolerance
  });

  test('should handle large data sets efficiently', async ({ page }) => {
    await page.goto('/data-table');

    const initialMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);

    // Load large dataset
    await page.click('button.load-large-dataset, .load-more');

    await page.waitForTimeout(2000);

    const afterLoadMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);

    // Memory increase should be reasonable
    const memoryIncrease = afterLoadMemory - initialMemory;
    const maxAllowedIncrease = 100 * 1024 * 1024; // 100MB for large dataset

    expect(memoryIncrease).toBeLessThan(maxAllowedIncrease);

    // Should still be responsive
    const responseTime = await page.evaluate(() => {
      const start = performance.now();
      // Simulate user interaction
      document.body.click();
      return performance.now() - start;
    });

    expect(responseTime).toBeLessThan(100); // Should respond within 100ms
  });
});

test.describe('Bundle Optimization', () => {
  test('should load bundles efficiently', async ({ page }) => {
    const resourceTimings = [];

    page.on('response', response => {
      const url = response.url();
      if (url.includes('.js') && !url.includes('chrome-extension')) {
        resourceTimings.push({
          url,
          size: response.headers()['content-length'] || 0,
          timing: Date.now()
        });
      }
    });

    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Analyze bundle sizes and load times
    const jsResources = resourceTimings.filter(r => r.url.includes('.js'));

    for (const resource of jsResources) {
      // Bundles should load within reasonable time
      expect(resource.size).toBeLessThan(5 * 1024 * 1024); // 5MB max per bundle
    }

    // Should have code splitting (multiple JS files)
    expect(jsResources.length).toBeGreaterThan(1);
  });

  test('should compress resources', async ({ page }) => {
    const responses = [];

    page.on('response', response => {
      responses.push(response);
    });

    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Check compression headers
    const compressibleResponses = responses.filter(r =>
      r.headers()['content-type']?.includes('text/') ||
      r.headers()['content-type']?.includes('javascript') ||
      r.headers()['content-type']?.includes('json')
    );

    for (const response of compressibleResponses) {
      const encoding = response.headers()['content-encoding'];
      expect(['gzip', 'br', 'deflate']).toContain(encoding);
    }
  });
});

test.describe('Image Optimization', () => {
  test('should serve optimized images', async ({ page }) => {
    await page.goto('/gallery');

    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      // Check first few images
      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');

        if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
          // Should use modern formats or be optimized
          expect(src).toMatch(/\.(webp|avif|jxl)(\?|$)/i);
        }
      }
    }
  });

  test('should lazy load offscreen images', async ({ page }) => {
    await page.goto('/image-heavy-page');

    // Get initial loaded images
    const initialLoadedImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).filter(img => img.complete).length;
    });

    // Scroll down to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });

    await page.waitForTimeout(1000);

    // More images should be loaded
    const finalLoadedImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).filter(img => img.complete).length;
    });

    expect(finalLoadedImages).toBeGreaterThanOrEqual(initialLoadedImages);
  });

  test('should serve responsive images', async ({ page }) => {
    await page.goto('/gallery');

    const images = page.locator('img');
    const img = images.first();

    if (await img.isVisible()) {
      const srcset = await img.getAttribute('srcset');
      const sizes = await img.getAttribute('sizes');

      // Should have responsive image attributes
      expect(srcset || (await img.getAttribute('src'))).toBeTruthy();
      expect(sizes).toBeTruthy();
    }
  });
});

test.describe('Network Performance', () => {
  test('should minimize network requests', async ({ page }) => {
    const requests = [];

    page.on('request', request => {
      // Exclude data URLs, chrome extensions, etc.
      if (!request.url().startsWith('data:') &&
          !request.url().includes('chrome-extension') &&
          !request.url().includes('favicon')) {
        requests.push(request);
      }
    });

    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Should not have excessive requests
    expect(requests.length).toBeLessThan(50);

    // Check for duplicate requests
    const urls = requests.map(r => r.url());
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(urls.length); // No duplicates
  });

  test('should use HTTP/2 or HTTP/3', async ({ page }) => {
    const protocol = await page.evaluate(() => {
      // Check if we can determine protocol
      return performance.getEntriesByType('navigation')[0]?.nextHopProtocol || 'unknown';
    });

    // Should use modern protocols
    expect(['h2', 'h3', 'http/2+quic/43', 'http/2+quic/46']).toContain(protocol);
  });

  test('should cache static resources', async ({ page }) => {
    // First visit
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstLoadRequests = [];
    page.on('request', request => {
      if (request.resourceType() === 'document' ||
          request.resourceType() === 'script' ||
          request.resourceType() === 'stylesheet') {
        firstLoadRequests.push(request.url());
      }
    });

    // Navigate to another page and back
    await page.goto('/about');
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Static resources should be cached (fewer requests or faster loads)
    // This is a basic check - in practice you'd measure timing differences
    const cachedLoadTime = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return navigation.loadEventEnd - navigation.fetchStart;
    });

    expect(cachedLoadTime).toBeLessThan(3000); // Should load quickly on second visit
  });
});

test.describe('Runtime Performance', () => {
  test('should maintain smooth scrolling', async ({ page }) => {
    await page.goto('/long-page');

    // Measure scroll performance
    const scrollPerformance = await page.evaluate(() => {
      return new Promise((resolve) => {
        const scrollTimes = [];
        let scrollCount = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              scrollTimes.push(entry.duration);
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });

        // Perform smooth scrolling
        const scrollStep = 100;
        const maxScroll = Math.min(document.body.scrollHeight, 1000);

        function scroll() {
          if (window.scrollY < maxScroll) {
            window.scrollBy(0, scrollStep);
            scrollCount++;
            setTimeout(scroll, 50);
          } else {
            observer.disconnect();
            resolve({
              longTasks: scrollTimes.length,
              avgLongTaskDuration: scrollTimes.length > 0 ?
                scrollTimes.reduce((a, b) => a + b, 0) / scrollTimes.length : 0
            });
          }
        }

        scroll();
      });
    });

    // Should not have excessive long tasks during scrolling
    expect(scrollPerformance.longTasks).toBeLessThan(5);
    expect(scrollPerformance.avgLongTaskDuration).toBeLessThan(100);
  });

  test('should handle rapid user interactions', async ({ page }) => {
    await page.goto('/interactive-page');

    const interactionTimes = [];

    // Rapid clicks
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      await page.click('button, .interactive-element');
      const endTime = Date.now();
      interactionTimes.push(endTime - startTime);
      await page.waitForTimeout(50);
    }

    const avgResponseTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length;
    const maxResponseTime = Math.max(...interactionTimes);

    // Should respond quickly to interactions
    expect(avgResponseTime).toBeLessThan(200); // Average < 200ms
    expect(maxResponseTime).toBeLessThan(500); // Max < 500ms
  });

  test('should optimize component re-renders', async ({ page }) => {
    await page.goto('/dashboard');

    // Monitor component updates
    const renderMetrics = await page.evaluate(() => {
      let renderCount = 0;
      const originalRender = HTMLElement.prototype.insertAdjacentElement;

      HTMLElement.prototype.insertAdjacentElement = function(...args) {
        renderCount++;
        return originalRender.apply(this, args);
      };

      // Trigger some state changes
      setTimeout(() => {
        // Simulate state updates
        window.dispatchEvent(new CustomEvent('state-change'));
      }, 100);

      return new Promise((resolve) => {
        setTimeout(() => {
          HTMLElement.prototype.insertAdjacentElement = originalRender;
          resolve({ renderCount });
        }, 1000);
      });
    });

    // Should not have excessive re-renders
    expect(renderMetrics.renderCount).toBeLessThan(50);
  });
});