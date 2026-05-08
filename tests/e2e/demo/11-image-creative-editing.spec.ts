import { test, expect } from '@playwright/test';

test.describe('Demo Video: Image Creative Editing', () => {
  test('should demonstrate image editing features', async ({ page }) => {
    await page.goto('/image/edit', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="image-editor"], .image-editor', { timeout: 10000 });

    // Screenshot initial editor
    await page.screenshot({ path: 'demo-screenshots/image-editor-initial.png' });

    // Demonstrate filter editor
    const filtersPanel = page.locator('[data-testid="filters-panel"], .filters').first();
    if (await filtersPanel.isVisible()) {
      await filtersPanel.screenshot({ path: 'demo-screenshots/image-editor-filters.png' });

      // Apply a filter
      const filterButton = filtersPanel.locator('button').first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'demo-screenshots/image-editor-filter-applied.png' });
      }
    }

    // Demonstrate crop tool
    const cropTool = page.locator('[data-testid="crop-tool"], button:has-text("Crop")').first();
    if (await cropTool.isVisible()) {
      await cropTool.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/image-editor-crop-tool.png' });

      // Simulate crop area selection
      const canvas = page.locator('canvas, [data-testid="image-canvas"]').first();
      if (await canvas.isVisible()) {
        await canvas.click({ position: { x: 50, y: 50 } });
        await canvas.click({ position: { x: 200, y: 200 } });
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'demo-screenshots/image-editor-crop-area.png' });
      }
    }

    // Demonstrate effects application
    const effectsPanel = page.locator('[data-testid="effects-panel"], .effects').first();
    if (await effectsPanel.isVisible()) {
      const effectButton = effectsPanel.locator('button').first();
      if (await effectButton.isVisible()) {
        await effectButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'demo-screenshots/image-editor-effect-applied.png' });
      }
    }

    // Verify editor functionality
    await expect(page.locator('[data-testid="image-editor"]')).toBeVisible();
  });
});