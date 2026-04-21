import { test, expect } from '@playwright/test';

test.describe('Demo Video: Media Ingest', () => {
  test('should demonstrate media file upload and drag-and-drop', async ({ page }) => {
    await page.goto('/library', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="library"], .library, [class*="library"]', { timeout: 10000 });

    // Screenshot initial library
    await page.screenshot({ path: 'demo-screenshots/media-ingest-initial.png' });

    // Demonstrate file upload
    const fileInput = page.locator('input[type="file"], [data-testid="file-upload"]').first();
    if (await fileInput.isVisible()) {
      // Note: In a real demo, we'd need sample media files
      // For now, just show the upload interface
      await page.screenshot({ path: 'demo-screenshots/media-ingest-upload-ui.png' });

      // Try to trigger file picker
      try {
        await fileInput.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'demo-screenshots/media-ingest-file-picker.png' });
      } catch (error) {
        console.log('File picker interaction failed:', error.message);
      }
    }

    // Demonstrate drag-and-drop area
    const dropZone = page.locator('[data-testid="drop-zone"], .drop-zone, [class*="drop"]').first();
    if (await dropZone.isVisible()) {
      await dropZone.hover();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/media-ingest-drop-zone.png' });
    }

    // Navigate to different media types
    const mediaTypes = ['video', 'image', 'audio'];
    for (const type of mediaTypes) {
      const typeTab = page.locator(`[data-testid="${type}-tab"], button:has-text("${type}")`).first();
      if (await typeTab.isVisible()) {
        await typeTab.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `demo-screenshots/media-ingest-${type}-library.png` });
      }
    }

    // Demonstrate media library integration
    const mediaItems = page.locator('[data-testid="media-item"], .media-item, [class*="media-item"]');
    const itemCount = await mediaItems.count();
    console.log(`Found ${itemCount} media items in library`);

    if (itemCount > 0) {
      await mediaItems.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/media-ingest-item-selected.png' });
    }

    // Verify upload functionality is present
    await expect(page.locator('input[type="file"], [data-testid="file-upload"]')).toBeVisible();
  });
});