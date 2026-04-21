import { test, expect } from '@playwright/test';

test.describe('Demo Video: State Management', () => {
  test('should demonstrate undo/redo and state persistence', async ({ page }) => {
    await page.goto('/timeline', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="timeline"], .timeline', { timeout: 10000 });

    // Perform some actions that can be undone
    const initialScreenshot = await page.screenshot();
    await page.screenshot({ path: 'demo-screenshots/state-initial.png' });

    // Try to add a clip or perform an action
    const addButton = page.locator('[data-testid="add-clip"], button:has-text("Add"), [class*="add"]').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'demo-screenshots/state-after-action.png' });

      // Try undo
      const undoButton = page.locator('[data-testid="undo-btn"], button:has-text("Undo"), [class*="undo"]').first();
      if (await undoButton.isVisible()) {
        await undoButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'demo-screenshots/state-after-undo.png' });

        // Try redo
        const redoButton = page.locator('[data-testid="redo-btn"], button:has-text("Redo"), [class*="redo"]').first();
        if (await redoButton.isVisible()) {
          await redoButton.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'demo-screenshots/state-after-redo.png' });
        }
      }
    }

    // Demonstrate project state persistence (if supported)
    // This would typically involve saving and reloading
    const saveButton = page.locator('[data-testid="save-btn"], button:has-text("Save")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'demo-screenshots/state-saved.png' });
    }
  });
});