import { test, expect } from '@playwright/test';

test.describe('Demo Video: Toolbar & Editing Controls', () => {
  test('should demonstrate toolbar and editing controls', async ({ page }) => {
    await page.goto('/timeline', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="timeline"], .timeline', { timeout: 10000 });

    // Screenshot toolbar
    const toolbar = page.locator('[data-testid="toolbar"], .toolbar, [class*="toolbar"]').first();
    if (await toolbar.isVisible()) {
      await toolbar.screenshot({ path: 'demo-screenshots/toolbar-main.png' });
    }

    // Demonstrate tool selection
    const tools = ['select', 'move', 'edit'];
    for (const tool of tools) {
      const toolButton = page.locator(`[data-testid="${tool}-tool"], button:has-text("${tool}"), [class*="${tool}"]`).first();
      if (await toolButton.isVisible()) {
        await toolButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `demo-screenshots/toolbar-${tool}-selected.png` });
      }
    }

    // Demonstrate zoom controls
    const zoomIn = page.locator('[data-testid="zoom-in"], button:has-text("Zoom In"), [class*="zoom-in"]').first();
    if (await zoomIn.isVisible()) {
      await zoomIn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/toolbar-zoom-in.png' });
    }

    const zoomOut = page.locator('[data-testid="zoom-out"], button:has-text("Zoom Out"), [class*="zoom-out"]').first();
    if (await zoomOut.isVisible()) {
      await zoomOut.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/toolbar-zoom-out.png' });
    }

    // Demonstrate track management
    const addTrack = page.locator('[data-testid="add-track"], button:has-text("Add Track")').first();
    if (await addTrack.isVisible()) {
      await addTrack.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/toolbar-add-track.png' });
    }

    const removeTrack = page.locator('[data-testid="remove-track"], button:has-text("Remove Track")').first();
    if (await removeTrack.isVisible()) {
      await removeTrack.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/toolbar-remove-track.png' });
    }

    // Verify toolbar is functional
    await expect(page.locator('[data-testid="toolbar"], .toolbar')).toBeVisible();
  });
});