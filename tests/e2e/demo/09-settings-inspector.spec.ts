import { test, expect } from '@playwright/test';

test.describe('Demo Video: Settings & Inspector', () => {
  test('should demonstrate settings panel and inspector', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="settings"], .settings', { timeout: 10000 });

    // Screenshot settings panel
    await page.screenshot({ path: 'demo-screenshots/settings-panel.png' });

    // Demonstrate clip settings if in timeline context
    await page.goto('/timeline');
    await page.waitForSelector('[data-testid="timeline"]', { timeout: 10000 });

    const clip = page.locator('[data-testid="timeline-clip"], .clip').first();
    if (await clip.isVisible()) {
      await clip.click();
      await page.waitForTimeout(500);

      // Look for inspector/settings panel
      const inspector = page.locator('[data-testid="inspector"], .inspector, [class*="inspector"]').first();
      if (await inspector.isVisible()) {
        await inspector.screenshot({ path: 'demo-screenshots/inspector-clip-settings.png' });

        // Demonstrate parameter adjustment
        const sliders = inspector.locator('input[type="range"], [data-testid*="slider"]');
        const sliderCount = await sliders.count();
        console.log(`Found ${sliderCount} parameter sliders`);

        if (sliderCount > 0) {
          // Adjust first slider
          const firstSlider = sliders.first();
          await firstSlider.fill('50');
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'demo-screenshots/inspector-parameter-adjusted.png' });
        }

        // Demonstrate real-time preview updates
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'demo-screenshots/inspector-preview-update.png' });
      }
    }

    // Verify settings functionality
    await expect(page.locator('[data-testid="settings"]')).toBeVisible();
  });
});