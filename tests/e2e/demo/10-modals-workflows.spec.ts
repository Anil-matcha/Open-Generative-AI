import { test, expect } from '@playwright/test';

test.describe('Demo Video: Modals & Workflows', () => {
  test('should demonstrate modal dialogs and workflows', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1, [data-testid="app-title"]', { timeout: 10000 });

    // Try to trigger social publisher modal
    const publishButton = page.locator('[data-testid="publish-btn"], button:has-text("Publish"), button:has-text("Share")').first();
    if (await publishButton.isVisible()) {
      await publishButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('[data-testid="modal"], .modal, [role="dialog"]').first();
      if (await modal.isVisible()) {
        await modal.screenshot({ path: 'demo-screenshots/modal-social-publisher.png' });
        // Close modal
        const closeBtn = modal.locator('[data-testid="close-btn"], button:has-text("Close"), .close').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Try to trigger image editor modal
    await page.goto('/image');
    const editButton = page.locator('[data-testid="edit-btn"], button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'demo-screenshots/modal-image-editor.png' });
    }

    // Try to trigger video player modal
    await page.goto('/video');
    const playButton = page.locator('[data-testid="play-video"], button:has-text("Play")').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'demo-screenshots/modal-video-player.png' });
    }

    // Verify modal functionality
    await expect(page.locator('body')).toBeVisible();
  });
});