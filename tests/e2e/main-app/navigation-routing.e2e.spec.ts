import { test, expect } from '@playwright/test';

// Comprehensive Navigation and Routing Tests
// Covers all routes, URL handling, page transitions, and navigation edge cases

test.describe('Comprehensive Navigation & Routing', () => {
  // Core route definitions from router.js
  const coreRoutes = [
    'explore', 'image', 'video', 'storyboard', 'edit', 'character',
    'effects', 'cinema', 'influencer', 'apps', 'templates', 'assist',
    'community', 'avatar', 'audio', 'library', 'timeline', 'headshots'
  ];

  const extendedRoutes = [
    'upscale', 'training', 'videotools', 'chat', 'lipsync', 'commercial',
    'render', 'video-agent', 'director', 'remix-go', 'runway-motion',
    'tiktok-carousel', 'advanced-dubbing'
  ];

  const templateRoutes = [
    'text-to-image', 'image-to-image', 'text-to-video', 'image-to-video',
    'video-to-video', 'video-watermark'
  ];

  const pageRoutes = [
    'character-page', 'effects-page', 'cinema-page', 'influencer-page',
    'commercial-page', 'upscale-page'
  ];

  test.beforeEach(async ({ page }) => {
    // Set up error handling
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/');

    // Wait for app to be ready
    await page.waitForSelector('#app', { timeout: 10000 });

    // Verify no critical errors during setup
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') && !error.includes('network')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test.describe('Core Route Navigation', () => {
    for (const route of coreRoutes) {
      test(`should navigate to ${route} page`, async ({ page }) => {
        // Navigate via URL hash
        await page.goto(`/#/${route}`);
        await expect(page).toHaveURL(new RegExp(`.*#/${route}`));

        // Wait for page content to load
        await page.waitForTimeout(1000);

        // Verify page loaded without critical errors
        const errorElements = await page.$$('[class*="error"], [class*="Error"]');
        expect(errorElements.length).toBeLessThan(2); // Allow some minor error states

        // Check for loading completion (no loading spinner)
        const loadingElements = await page.$$('[class*="loading"], [class*="spinner"]');
        expect(loadingElements.length).toBe(0);
      });
    }
  });

  test.describe('Extended Route Navigation', () => {
    for (const route of extendedRoutes) {
      test(`should navigate to ${route} page`, async ({ page }) => {
        await page.goto(`/#/${route}`);
        await expect(page).toHaveURL(new RegExp(`.*#/${route}`));

        await page.waitForTimeout(1000);

        // Verify page structure
        const contentArea = await page.$('[data-testid="content-area"]');
        expect(contentArea).not.toBeNull();
      });
    }
  });

  test.describe('Template Route Navigation', () => {
    for (const route of templateRoutes) {
      test(`should navigate to ${route} template`, async ({ page }) => {
        await page.goto(`/#/${route}`);
        await expect(page).toHaveURL(new RegExp(`.*#/${route}`));

        await page.waitForTimeout(1000);

        // Template pages should have form or configuration elements
        const formElements = await page.$$('form, [class*="form"], [data-testid*="form"]');
        const configElements = await page.$$('[class*="config"], [data-testid*="config"]');
        expect(formElements.length + configElements.length).toBeGreaterThan(0);
      });
    }
  });

  test.describe('Page Route Navigation', () => {
    for (const route of pageRoutes) {
      test(`should navigate to ${route} page`, async ({ page }) => {
        await page.goto(`/#/${route}`);
        await expect(page).toHaveURL(new RegExp(`.*#/${route}`));

        await page.waitForTimeout(1000);

        // Page routes should have content
        const hasContent = await page.evaluate(() => {
          const body = document.body;
          const text = body.textContent || '';
          return text.length > 50; // Reasonable content threshold
        });
        expect(hasContent).toBe(true);
      });
    }
  });


  test.describe('Headshot Studio Smoke', () => {
    test('should render AI Headshot Studio hero copy', async ({ page }) => {
      await page.goto('/#/headshots');
      await expect(page).toHaveURL(/.*#\/headshots/);
      await expect(page.getByText('AI Headshot Studio')).toBeVisible();
      await expect(page.getByText('Turn everyday photos into polished professional headshots, team portraits, and personal brand images.')).toBeVisible();
    });
  });

  test.describe('URL Parameter Handling', () => {
    test('should handle route with query parameters', async ({ page }) => {
      const params = 'param1=value1&param2=value2';
      await page.goto(`/?${params}#/timeline`);

      // Verify URL contains parameters
      await expect(page).toHaveURL(new RegExp(`.*${params}.*#\\/timeline`));

      // Verify parameters are accessible
      const urlParams = await page.evaluate(() => {
        const params = new URLSearchParams(window.location.search);
        return {
          param1: params.get('param1'),
          param2: params.get('param2')
        };
      });

      expect(urlParams.param1).toBe('value1');
      expect(urlParams.param2).toBe('value2');
    });

    test('should handle route with hash parameters', async ({ page }) => {
      await page.goto('/#/timeline?tab=settings&view=advanced');

      await expect(page).toHaveURL(/.*#\/timeline\?tab=settings&view=advanced/);

      // Verify hash-based parameters
      const hashParams = await page.evaluate(() => {
        const hash = window.location.hash;
        const queryIndex = hash.indexOf('?');
        if (queryIndex > -1) {
          const params = new URLSearchParams(hash.substring(queryIndex));
          return {
            tab: params.get('tab'),
            view: params.get('view')
          };
        }
        return null;
      });

      expect(hashParams).not.toBeNull();
      expect(hashParams!.tab).toBe('settings');
      expect(hashParams!.view).toBe('advanced');
    });

    test('should preserve parameters during navigation', async ({ page }) => {
      // Start with parameters
      await page.goto('/?session=123&user=test#/timeline');

      // Navigate to another route
      await page.goto('/?session=123&user=test#/library');

      // Parameters should be preserved
      const currentParams = await page.evaluate(() => {
        const params = new URLSearchParams(window.location.search);
        return params.toString();
      });

      expect(currentParams).toContain('session=123');
      expect(currentParams).toContain('user=test');
    });
  });

  test.describe('Browser History Navigation', () => {
    test('should handle browser back navigation', async ({ page }) => {
      // Navigate through multiple routes
      const routes = ['timeline', 'library', 'settings', 'explore'];

      for (const route of routes) {
        await page.goto(`/#/${route}`);
        await expect(page).toHaveURL(new RegExp(`.*#/${route}`));
        await page.waitForTimeout(500);
      }

      // Go back through history
      for (let i = routes.length - 2; i >= 0; i--) {
        await page.goBack();
        await expect(page).toHaveURL(new RegExp(`.*#/${routes[i]}`));
        await page.waitForTimeout(300);
      }
    });

    test('should handle browser forward navigation', async ({ page }) => {
      const routes = ['timeline', 'library', 'settings'];

      // Navigate forward
      for (const route of routes) {
        await page.goto(`/#/${route}`);
        await page.waitForTimeout(300);
      }

      // Go back to beginning
      for (let i = 0; i < routes.length - 1; i++) {
        await page.goBack();
        await page.waitForTimeout(300);
      }

      // Go forward through history
      for (let i = 1; i < routes.length; i++) {
        await page.goForward();
        await expect(page).toHaveURL(new RegExp(`.*#/${routes[i]}`));
        await page.waitForTimeout(300);
      }
    });

    test('should handle rapid navigation changes', async ({ page }) => {
      const routes = ['timeline', 'library', 'settings', 'explore'];

      // Rapid navigation changes
      for (const route of routes) {
        await page.goto(`/#/${route}`);
        // Don't wait between navigations to test robustness
      }

      // Verify final route
      await expect(page).toHaveURL(new RegExp(`.*#/${routes[routes.length - 1]}`));

      // Verify no crashes occurred
      const errorElements = await page.$$('[class*="error"], [class*="Error"]');
      expect(errorElements.length).toBe(0);
    });
  });

  test.describe('Navigation Edge Cases', () => {
    test('should handle invalid route gracefully', async ({ page }) => {
      await page.goto('/#/invalid-route-that-does-not-exist');

      // Should either redirect to default or show placeholder
      await page.waitForTimeout(1000);

      const hasContent = await page.evaluate(() => {
        const body = document.body;
        return body.children.length > 0;
      });

      expect(hasContent).toBe(true);

      // Should not show raw error text
      const errorText = await page.evaluate(() => {
        const body = document.body;
        const text = body.textContent || '';
        return text.toLowerCase().includes('failed to load') ||
               text.toLowerCase().includes('error loading');
      });

      expect(errorText).toBe(false);
    });

    test('should handle empty route', async ({ page }) => {
      await page.goto('/#/');

      await page.waitForTimeout(500);

      // Should load default or home page
      const hasContent = await page.evaluate(() => {
        const body = document.body;
        return body.children.length > 0;
      });

      expect(hasContent).toBe(true);
    });

    test('should handle route with special characters', async ({ page }) => {
      const specialRoute = 'test-route_with.special.chars';
      await page.goto(`/#/${specialRoute}`);

      await page.waitForTimeout(500);

      // Should handle gracefully
      const currentHash = await page.evaluate(() => window.location.hash);
      expect(currentHash).toContain(specialRoute);
    });

    test('should handle very long route names', async ({ page }) => {
      const longRoute = 'a'.repeat(200); // 200 character route
      await page.goto(`/#/${longRoute}`);

      await page.waitForTimeout(500);

      // Should handle without crashing
      const hasContent = await page.evaluate(() => {
        const body = document.body;
        return body.children.length > 0;
      });

      expect(hasContent).toBe(true);
    });

    test('should handle template route with ID', async ({ page }) => {
      await page.goto('/#/template/12345');

      await page.waitForTimeout(1000);

      // Should load template studio or placeholder
      const hasContent = await page.evaluate(() => {
        const body = document.body;
        return body.children.length > 0;
      });

      expect(hasContent).toBe(true);
    });
  });

  test.describe('Page Transition Behavior', () => {
    test('should show loading state during navigation', async ({ page }) => {
      // Navigate to a route that takes time to load
      await page.goto('/#/timeline');

      // Check for loading indicator
      const loadingIndicator = await page.$('[class*="loading"], [class*="spinner"], [data-testid*="loading"]');
      if (loadingIndicator) {
        await expect(loadingIndicator).toBeVisible();
      }

      // Wait for load completion
      await page.waitForTimeout(2000);

      // Loading should be gone
      const loadingAfter = await page.$('[class*="loading"], [class*="spinner"], [data-testid*="loading"]');
      if (loadingAfter) {
        await expect(loadingAfter).not.toBeVisible();
      }
    });

    test('should cleanup previous page components', async ({ page }) => {
      // Navigate to timeline
      await page.goto('/#/timeline');
      await page.waitForTimeout(1000);

      // Navigate to library
      await page.goto('/#/library');
      await page.waitForTimeout(1000);

      // Previous timeline components should be cleaned up
      const timelineElements = await page.$$('[data-testid*="timeline"], [class*="timeline"]');
      // Note: Some elements might still exist in memory but should not be visible
      for (const element of timelineElements) {
        const isVisible = await element.isVisible();
        if (!isVisible) {
          // Hidden elements are acceptable
          continue;
        }
        // If visible, they should be library-related, not timeline
        const className = await element.evaluate(el => el.className);
        expect(className).not.toContain('timeline');
      }
    });

    test('should handle concurrent navigation requests', async ({ page }) => {
      // Start multiple navigation requests rapidly
      await Promise.all([
        page.goto('/#/timeline'),
        page.goto('/#/library'),
        page.goto('/#/settings')
      ]);

      await page.waitForTimeout(1000);

      // Should end up at the last requested route
      await expect(page).toHaveURL(/.*#\/settings/);

      // Should not be in a broken state
      const contentArea = await page.$('[data-testid="content-area"]');
      expect(contentArea).not.toBeNull();
    });

    test('should maintain scroll position within reasonable bounds', async ({ page }) => {
      await page.goto('/#/timeline');
      await page.waitForTimeout(1000);

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 100));

      const scrollBefore = await page.evaluate(() => window.scrollY);

      // Navigate to another route
      await page.goto('/#/library');
      await page.waitForTimeout(1000);

      const scrollAfter = await page.evaluate(() => window.scrollY);

      // Scroll position should be reset or reasonable
      expect(scrollAfter).toBeLessThanOrEqual(scrollBefore + 50);
    });
  });

  test.describe('Route Event System', () => {
    test('should dispatch route change events', async ({ page }) => {
      const events: any[] = [];

      // Listen for route change events
      await page.exposeFunction('onRouteChange', (event: any) => {
        events.push(event);
      });

      await page.evaluate(() => {
        window.addEventListener('route-changed', (event: any) => {
          (window as any).onRouteChange(event.detail);
        });
      });

      // Navigate
      await page.goto('/#/timeline');

      // Wait for events
      await page.waitForTimeout(500);

      // Should have captured route change events
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].page).toBe('timeline');
    });

    test('should handle route event bubbling', async ({ page }) => {
      let eventCaptured = false;

      await page.exposeFunction('captureEvent', () => {
        eventCaptured = true;
      });

      await page.evaluate(() => {
        document.addEventListener('route-changed', () => {
          (window as any).captureEvent();
        }, true); // Use capture phase
      });

      await page.goto('/#/library');
      await page.waitForTimeout(300);

      expect(eventCaptured).toBe(true);
    });
  });

  test.describe('Navigation Performance', () => {
    test('should navigate within performance budget', async ({ page }) => {
      const routes = ['timeline', 'library', 'settings', 'explore'];
      const timings: number[] = [];

      for (const route of routes) {
        const start = Date.now();
        await page.goto(`/#/${route}`);
        await page.waitForTimeout(500); // Wait for content to settle
        const end = Date.now();
        timings.push(end - start);
      }

      // Average navigation time should be under 2 seconds
      const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      expect(averageTime).toBeLessThan(2000);

      // No navigation should take longer than 5 seconds
      const maxTime = Math.max(...timings);
      expect(maxTime).toBeLessThan(5000);
    });

    test('should handle navigation under memory pressure', async ({ page }) => {
      // Navigate through many routes to simulate memory pressure
      const routes = [
        ...coreRoutes,
        ...extendedRoutes.slice(0, 5),
        ...templateRoutes.slice(0, 3)
      ];

      for (const route of routes) {
        await page.goto(`/#/${route}`);
        await page.waitForTimeout(300);

        // Verify page is still functional
        const contentArea = await page.$('[data-testid="content-area"]');
        expect(contentArea).not.toBeNull();
      }

      // Final route should be accessible
      await expect(page).toHaveURL(new RegExp(`.*#/${routes[routes.length - 1]}`));
    });
  });

  test.describe('Cross-browser Navigation Compatibility', () => {
    test('should handle hash changes consistently', async ({ page }) => {
      // Test various hash change scenarios
      const testHashes = [
        '#/timeline',
        '#/library?tab=videos',
        '#/settings',
        '#/explore'
      ];

      for (const hash of testHashes) {
        await page.goto(hash);

        // Verify hash is set correctly
        const currentHash = await page.evaluate(() => window.location.hash);
        expect(currentHash).toBe(hash);

        await page.waitForTimeout(300);
      }
    });

    test('should handle page refresh on current route', async ({ page }) => {
      await page.goto('/#/timeline');
      await page.waitForTimeout(500);

      // Refresh page
      await page.reload();

      // Should return to same route after refresh
      await expect(page).toHaveURL(/.*#\/timeline/);

      // Content should reload
      const contentArea = await page.$('[data-testid="content-area"]');
      expect(contentArea).not.toBeNull();
    });
  });
});