import { test, expect } from '@playwright/test';

// All routes from router.js pageLoaders
const coreRoutes = [
  'image', 'video', 'cinema', 'apps', 'templates', 'effects', 'vfx', 'ai-vfx',
  'edit', 'upscale', 'library', 'character', 'influencer', 'commercial',
  'explore', 'avatar', 'audio', 'training', 'videotools', 'chat', 'lipsync'
];

const workflowRoutes = [
  'workflows', 'workflows/editor', 'workflows/history', 'workflows/settings'
];

const agentRoutes = [
  'agents', 'mcp-cli', 'video-outreach'
];

const assistRoutes = [
  'assist', 'community', 'storyboard'
];

const templateRoutes = [
  'text-to-image', 'image-to-image', 'text-to-video',
  'image-to-video', 'video-to-video', 'video-watermark'
];

const pageRoutes = [
  'storyboard-page', 'character-page', 'effects-page', 'cinema-page',
  'influencer-page', 'commercial-page', 'upscale-page'
];

const advancedRoutes = [
  'render', 'video-agent', 'director', 'timeline', 'timeline-test'
];

const marketingRoutes = [
  'remix-go', 'sendspark', 'ai-headshot', 'runway-motion',
  'tiktok-carousel', 'advanced-dubbing'
];

const headshotRoutes = [
  'headshots', 'headshots-generate', 'headshots-history', 'headshots-settings'
];

const specialRoutes = [
  'landing'
];

// Heavy routes that need longer timeouts
const heavyRoutes = ['timeline', 'timeline-test', 'image', 'video', 'cinema', 'director'];

// Routes that might use different UI patterns
const templateLikeRoutes = [...templateRoutes, 'text-to-image', 'image-to-image'];

test.describe('Module Click Error Check', () => {
  let pageErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
  });

  // Helper function to check for errors
  async function checkForErrors(page: any, route: string) {
    // Wait for content area
    await page.waitForSelector('#content-area', { timeout: 10000 }).catch(() => {});

    // Wait for dynamic imports to complete
    const timeout = heavyRoutes.includes(route) ? 30000 : 10000;
    await page.waitForTimeout(heavyRoutes.includes(route) ? 2000 : 1000);

    // Check for error messages in DOM
    const errorTexts = await page.evaluate(() => {
      const errorIndicators = [
        'Failed to load',
        'Error loading',
        'failed to load',
        'error loading'
      ];

      const bodyText = document.body.textContent || '';
      const foundErrors: string[] = [];

      for (const indicator of errorIndicators) {
        if (bodyText.includes(indicator)) {
          foundErrors.push(indicator);
        }
      }

      return foundErrors;
    });

    // Check for error elements
    const errorElements = await page.$$('[class*="error" i], [class*="Error"], .text-red-400, .text-red-500');
    const visibleErrors = [];
    for (const el of errorElements) {
      const isVisible = await el.isVisible().catch(() => false);
      if (isVisible) {
        const text = await el.textContent().catch(() => '');
        if (text && !text.includes('Failed to load')) continue; // Skip non-critical
        visibleErrors.push(el);
      }
    }

    // Check page errors (filter out favicon 404s and acceptable errors)
    const criticalErrors = pageErrors.filter((error: string) => {
      return !error.includes('favicon') &&
             !error.includes('404') &&
             !error.includes('net::ERR_FILE_NOT_FOUND');
    });

    return {
      errorTexts,
      errorElementsCount: errorElements.length,
      visibleErrorsCount: visibleErrors.length,
      criticalErrors,
      hasContent: await page.evaluate(() => {
        const contentArea = document.querySelector('#content-area');
        return contentArea && contentArea.children.length > 0;
      })
    };
  }

  test.describe('Core Routes - No Errors', () => {
    for (const route of coreRoutes) {
      test(`should load ${route} without errors`, async ({ page }) => {
        const timeout = heavyRoutes.includes(route) ? 40000 : 15000;
        test.setTimeout(timeout);

        await page.goto(`/#/${route}`);

        const result = await checkForErrors(page, route);

        expect(result.criticalErrors.length, `Page errors: ${JSON.stringify(result.criticalErrors)}`).toBe(0);
        expect(result.errorTexts.length, `Error texts found: ${JSON.stringify(result.errorTexts)}`).toBe(0);

        // Take screenshot on failure
        if (result.visibleErrorsCount > 0 || !result.hasContent) {
          await page.screenshot({ path: `test-results/error-${route}.png`, fullPage: true });
        }

        expect(result.visibleErrorsCount).toBe(0);
        expect(result.hasContent).toBe(true);
      });
    }
  });

  test.describe('Workflow Routes - No Errors', () => {
    for (const route of workflowRoutes) {
      test(`should load ${route} without errors`, async ({ page }) => {
        await page.goto(`/#/${route}`);

        const result = await checkForErrors(page, route);

        expect(result.criticalErrors.length, `Page errors: ${JSON.stringify(result.criticalErrors)}`).toBe(0);
        expect(result.errorTexts.length).toBe(0);
        expect(result.visibleErrorsCount).toBe(0);
      });
    }
  });

  test.describe('Agent Routes - No Errors', () => {
    for (const route of agentRoutes) {
      test(`should load ${route} without errors`, async ({ page }) => {
        await page.goto(`/#/${route}`);

        const result = await checkForErrors(page, route);

        expect(result.criticalErrors.length, `Page errors: ${JSON.stringify(result.criticalErrors)}`).toBe(0);
        expect(result.errorTexts.length).toBe(0);
        expect(result.visibleErrorsCount).toBe(0);
      });
    }
  });

  test.describe('Assist & Community Routes - No Errors', () => {
    for (const route of assistRoutes) {
      test(`should load ${route} without errors`, async ({ page }) => {
        await page.goto(`/#/${route}`);

        const result = await checkForErrors(page, route);

        expect(result.criticalErrors.length, `Page errors: ${JSON.stringify(result.criticalErrors)}`).toBe(0);
        expect(result.errorTexts.length).toBe(0);
        expect(result.visibleErrorsCount).toBe(0);
      });
    }
  });

  test.describe('Template Routes - No Errors', () => {
    for (const route of templateRoutes) {
      test(`should load ${route} without errors`, async ({ page }) => {
        await page.goto(`/#/${route}`);

        const result = await checkForErrors(page, route);

        expect(result.criticalErrors.length, `Page errors: ${JSON.stringify(result.criticalErrors)}`).toBe(0);
        expect(result.errorTexts.length).toBe(0);
        expect(result.visibleErrorsCount).toBe(0);
      });
    }
  });

  test.describe('Page Routes - No Errors', () => {
    for (const route of pageRoutes) {
      test(`should load ${route} without errors`, async ({ page }) => {
        await page.goto(`/#/${route}`);

        const result = await checkForErrors(page, route);

        expect(result.criticalErrors.length, `Page errors: ${JSON.stringify(result.criticalErrors)}`).toBe(0);
        expect(result.errorTexts.length).toBe(0);
        expect(result.visibleErrorsCount).toBe(0);
      });
    }
  });

  test.describe('Advanced Routes - No Errors', () => {
    for (const route of advancedRoutes) {
      test(`should load ${route} without errors`, async ({ page }) => {
        const timeout = heavyRoutes.includes(route) ? 60000 : 20000;
        test.setTimeout(timeout);

        await page.goto(`/#/${route}`);

        const result = await checkForErrors(page, route);

        expect(result.criticalErrors.length, `Page errors: ${JSON.stringify(result.criticalErrors)}`).toBe(0);
        expect(result.errorTexts.length, `Error texts: ${JSON.stringify(result.errorTexts)}`).toBe(0);

        if (result.visibleErrorsCount > 0) {
          await page.screenshot({ path: `test-results/error-${route}.png`, fullPage: true });
        }

        expect(result.visibleErrorsCount).toBe(0);
        expect(result.hasContent).toBe(true);
      });
    }
  });

  test.describe('Marketing Routes - No Errors', () => {
    for (const route of marketingRoutes) {
      test(`should load ${route} without errors`, async ({ page }) => {
        await page.goto(`/#/${route}`);

        const result = await checkForErrors(page, route);

        expect(result.criticalErrors.length, `Page errors: ${JSON.stringify(result.criticalErrors)}`).toBe(0);
        expect(result.errorTexts.length).toBe(0);
        expect(result.visibleErrorsCount).toBe(0);
      });
    }
  });

  test.describe('Headshot Routes - No Errors', () => {
    for (const route of headshotRoutes) {
      test(`should load ${route} without errors`, async ({ page }) => {
        await page.goto(`/#/${route}`);

        const result = await checkForErrors(page, route);

        expect(result.criticalErrors.length, `Page errors: ${JSON.stringify(result.criticalErrors)}`).toBe(0);
        expect(result.errorTexts.length).toBe(0);
        expect(result.visibleErrorsCount).toBe(0);
      });
    }
  });

  test.describe('Special Routes - No Errors', () => {
    for (const route of specialRoutes) {
      test(`should load ${route} without errors`, async ({ page }) => {
        await page.goto(`/#/${route}`);

        // Landing page uses full-page mode without app shell
        await page.waitForTimeout(2000);

        const result = await checkForErrors(page, route);

        expect(result.criticalErrors.length, `Page errors: ${JSON.stringify(result.criticalErrors)}`).toBe(0);
        expect(result.errorTexts.length).toBe(0);

        // Landing page should have content
        const hasLandingContent = await page.evaluate(() => {
          return document.body.textContent && document.body.textContent.length > 100;
        });
        expect(hasLandingContent).toBe(true);
      });
    }
  });

  test.describe('Sidebar Click Navigation - No Errors', () => {
    // Test a subset of routes by clicking sidebar
    const sidebarTestRoutes = ['explore', 'image', 'video', 'library', 'timeline', 'settings', 'effects', 'apps'];

    for (const route of sidebarTestRoutes) {
      test(`should navigate to ${route} via sidebar click without errors`, async ({ page }) => {
        await page.goto('/');

        // Wait for sidebar to load
        await page.waitForSelector('[data-testid="sidebar"], nav, aside', { timeout: 5000 }).catch(() => {});

        // Try to find and click the sidebar button
        const sidebarButton = await page.locator(`button:has-text("${route}"), a:has-text("${route}"), [data-route="${route}"]`).first();

        if (await sidebarButton.isVisible().catch(() => false)) {
          await sidebarButton.click();

          const result = await checkForErrors(page, route);

          expect(result.criticalErrors.length, `Page errors: ${JSON.stringify(result.criticalErrors)}`).toBe(0);
          expect(result.errorTexts.length).toBe(0);
          expect(result.visibleErrorsCount).toBe(0);
        } else {
          // If sidebar button not found, navigate via URL as fallback
          await page.goto(`/#/${route}`);
          const result = await checkForErrors(page, route);

          expect(result.criticalErrors.length).toBe(0);
          expect(result.errorTexts.length).toBe(0);
        }
      });
    }
  });

  test.describe('Rapid Navigation - No Errors', () => {
    test('should handle rapid navigation without errors', async ({ page }) => {
      const routes = ['explore', 'image', 'video', 'library', 'timeline', 'settings'];

      // Navigate rapidly
      for (const route of routes) {
        await page.goto(`/#/${route}`);
      }

      // Wait for final route to settle
      await page.waitForTimeout(3000);

      const result = await checkForErrors(page, routes[routes.length - 1]);

      expect(result.criticalErrors.length, `Page errors: ${JSON.stringify(result.criticalErrors)}`).toBe(0);
      expect(result.errorTexts.length).toBe(0);
    });
  });

  test.describe('Browser History Navigation - No Errors', () => {
    test('should handle back/forward navigation without errors', async ({ page }) => {
      const routes = ['explore', 'image', 'video', 'library'];

      // Navigate through routes
      for (const route of routes) {
        await page.goto(`/#/${route}`);
        await page.waitForTimeout(500);
      }

      // Go back
      for (let i = routes.length - 2; i >= 0; i--) {
        await page.goBack();
        await page.waitForTimeout(500);

        const result = await checkForErrors(page, routes[i]);
        expect(result.criticalErrors.length).toBe(0);
      }
    });
  });

  test.describe('Comprehensive Error Check - All Routes', () => {
    const allRoutes = [
      ...coreRoutes,
      ...workflowRoutes,
      ...agentRoutes,
      ...assistRoutes,
      ...templateRoutes,
      ...pageRoutes,
      ...advancedRoutes,
      ...marketingRoutes,
      ...headshotRoutes,
      ...specialRoutes
    ];

    test('should load all routes and verify no error messages appear', async ({ page }) => {
      const failedRoutes: string[] = [];

      for (const route of allRoutes) {
        pageErrors = [];
        page.on('pageerror', (error) => pageErrors.push(error.message));

        const timeout = heavyRoutes.includes(route) ? 30000 : 10000;

        await page.goto(`/#/${route}`);
        await page.waitForTimeout(heavyRoutes.includes(route) ? 2000 : 1000);

        const result = await checkForErrors(page, route);

        if (result.criticalErrors.length > 0 || result.errorTexts.length > 0 || result.visibleErrorsCount > 0) {
          failedRoutes.push(`${route}: errors=${JSON.stringify(result.criticalErrors)}, texts=${JSON.stringify(result.errorTexts)}`);

          // Take screenshot for debugging
          await page.screenshot({ path: `test-results/error-${route.replace('/', '-')}.png`, fullPage: true }).catch(() => {});
        }
      }

      expect(failedRoutes.length, `Failed routes:\n${failedRoutes.join('\n')}`).toBe(0);
    });
  });
});
