import { test, expect } from '@playwright/test';

test.describe('Demo Video: Runtime & App Setup', () => {
  test('should demonstrate app loading and setup', async ({ page }) => {
    // Navigate to app
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for app to load
    await page.waitForSelector('h1, [data-testid="app-title"], .app-loaded', { timeout: 10000 });

    const loadTime = Date.now() - startTime;
    console.log(`App load time: ${loadTime}ms`);

    // Verify app is loaded
    await expect(page).toHaveTitle(/AI Video Agency|Open-Higgsfield-AI/);

    // Take screenshot of loaded app
    await page.screenshot({ path: 'demo-screenshots/runtime-app-setup-loaded.png' });

    // Demonstrate responsive design by resizing
    await page.setViewportSize({ width: 768, height: 1024 }); // Mobile
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'demo-screenshots/runtime-app-setup-mobile.png' });

    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'demo-screenshots/runtime-app-setup-desktop.png' });

    // Verify load time is under 5 seconds as per requirements
    expect(loadTime).toBeLessThan(5000);
  });
});