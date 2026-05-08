import { test, expect } from '@playwright/test';

test.describe('Demo Video: Route Navigation & URL Handling', () => {
  test('should demonstrate comprehensive route navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1, [data-testid="app-title"], .app-loaded', { timeout: 10000 });

    // Core Routes
    const coreRoutes = ['timeline', 'library', 'settings', 'explore', 'image', 'video', 'storyboard', 'edit', 'character'];

    for (const route of coreRoutes) {
      console.log(`Navigating to: ${route}`);
      try {
        // Try clicking navigation element
        const navElement = page.locator(`[data-testid="${route}-nav"], text=/${route}/i`).first();
        if (await navElement.isVisible()) {
          await navElement.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: `demo-screenshots/navigation-${route}.png` });
        } else {
          // Try direct URL navigation
          await page.goto(`/${route}`);
          await page.waitForTimeout(1000);
          await page.screenshot({ path: `demo-screenshots/navigation-${route}-direct.png` });
        }
      } catch (error) {
        console.log(`Route ${route} navigation failed: ${error.message}`);
      }
    }

    // Extended Routes
    const extendedRoutes = ['effects', 'cinema', 'influencer', 'apps', 'templates', 'assist', 'community', 'avatar', 'audio'];

    for (const route of extendedRoutes) {
      console.log(`Navigating to extended route: ${route}`);
      try {
        const navElement = page.locator(`[data-testid="${route}-nav"], text=/${route}/i`).first();
        if (await navElement.isVisible()) {
          await navElement.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: `demo-screenshots/navigation-extended-${route}.png` });
        }
      } catch (error) {
        console.log(`Extended route ${route} navigation failed: ${error.message}`);
      }
    }

    // Template Routes
    const templateRoutes = [
      'text-to-image', 'image-to-image', 'text-to-video', 'image-to-video', 'video-to-video'
    ];

    for (const route of templateRoutes) {
      console.log(`Navigating to template route: ${route}`);
      try {
        await page.goto(`/templates/${route}`);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `demo-screenshots/navigation-template-${route}.png` });
      } catch (error) {
        console.log(`Template route ${route} navigation failed: ${error.message}`);
      }
    }

    // Demonstrate URL parameter handling
    await page.goto('/image?model=flux-dev&prompt=test');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'demo-screenshots/navigation-url-params.png' });

    // Demonstrate browser history navigation
    await page.goBack();
    await page.waitForTimeout(500);
    await page.goForward();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'demo-screenshots/navigation-history.png' });

    // Verify URL structure
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/^http:\/\/localhost:\d+\//);
  });
});