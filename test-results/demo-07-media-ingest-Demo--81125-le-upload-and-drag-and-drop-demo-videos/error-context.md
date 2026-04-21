# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo/07-media-ingest.spec.ts >> Demo Video: Media Ingest >> should demonstrate media file upload and drag-and-drop
- Location: tests/e2e/demo/07-media-ingest.spec.ts:4:3

# Error details

```
Error: page.waitForSelector: Target page, context or browser has been closed
Call log:
  - waiting for locator('[data-testid="library"], .library, [class*="library"]') to be visible

```

```
Error: write EPIPE
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Demo Video: Media Ingest', () => {
  4  |   test('should demonstrate media file upload and drag-and-drop', async ({ page }) => {
  5  |     await page.goto('/library', { waitUntil: 'networkidle' });
> 6  |     await page.waitForSelector('[data-testid="library"], .library, [class*="library"]', { timeout: 10000 });
     |     ^ Error: write EPIPE
  7  | 
  8  |     // Screenshot initial library
  9  |     await page.screenshot({ path: 'demo-screenshots/media-ingest-initial.png' });
  10 | 
  11 |     // Demonstrate file upload
  12 |     const fileInput = page.locator('input[type="file"], [data-testid="file-upload"]').first();
  13 |     if (await fileInput.isVisible()) {
  14 |       // Note: In a real demo, we'd need sample media files
  15 |       // For now, just show the upload interface
  16 |       await page.screenshot({ path: 'demo-screenshots/media-ingest-upload-ui.png' });
  17 | 
  18 |       // Try to trigger file picker
  19 |       try {
  20 |         await fileInput.click();
  21 |         await page.waitForTimeout(1000);
  22 |         await page.screenshot({ path: 'demo-screenshots/media-ingest-file-picker.png' });
  23 |       } catch (error) {
  24 |         console.log('File picker interaction failed:', error.message);
  25 |       }
  26 |     }
  27 | 
  28 |     // Demonstrate drag-and-drop area
  29 |     const dropZone = page.locator('[data-testid="drop-zone"], .drop-zone, [class*="drop"]').first();
  30 |     if (await dropZone.isVisible()) {
  31 |       await dropZone.hover();
  32 |       await page.waitForTimeout(500);
  33 |       await page.screenshot({ path: 'demo-screenshots/media-ingest-drop-zone.png' });
  34 |     }
  35 | 
  36 |     // Navigate to different media types
  37 |     const mediaTypes = ['video', 'image', 'audio'];
  38 |     for (const type of mediaTypes) {
  39 |       const typeTab = page.locator(`[data-testid="${type}-tab"], button:has-text("${type}")`).first();
  40 |       if (await typeTab.isVisible()) {
  41 |         await typeTab.click();
  42 |         await page.waitForTimeout(1000);
  43 |         await page.screenshot({ path: `demo-screenshots/media-ingest-${type}-library.png` });
  44 |       }
  45 |     }
  46 | 
  47 |     // Demonstrate media library integration
  48 |     const mediaItems = page.locator('[data-testid="media-item"], .media-item, [class*="media-item"]');
  49 |     const itemCount = await mediaItems.count();
  50 |     console.log(`Found ${itemCount} media items in library`);
  51 | 
  52 |     if (itemCount > 0) {
  53 |       await mediaItems.first().click();
  54 |       await page.waitForTimeout(500);
  55 |       await page.screenshot({ path: 'demo-screenshots/media-ingest-item-selected.png' });
  56 |     }
  57 | 
  58 |     // Verify upload functionality is present
  59 |     await expect(page.locator('input[type="file"], [data-testid="file-upload"]')).toBeVisible();
  60 |   });
  61 | });
```