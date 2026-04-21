# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo/06-toolbar-editing-controls.spec.ts >> Demo Video: Toolbar & Editing Controls >> should demonstrate toolbar and editing controls
- Location: tests/e2e/demo/06-toolbar-editing-controls.spec.ts:4:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="timeline"], .timeline') to be visible

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Demo Video: Toolbar & Editing Controls', () => {
  4  |   test('should demonstrate toolbar and editing controls', async ({ page }) => {
  5  |     await page.goto('/timeline', { waitUntil: 'networkidle' });
> 6  |     await page.waitForSelector('[data-testid="timeline"], .timeline', { timeout: 10000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  7  | 
  8  |     // Screenshot toolbar
  9  |     const toolbar = page.locator('[data-testid="toolbar"], .toolbar, [class*="toolbar"]').first();
  10 |     if (await toolbar.isVisible()) {
  11 |       await toolbar.screenshot({ path: 'demo-screenshots/toolbar-main.png' });
  12 |     }
  13 | 
  14 |     // Demonstrate tool selection
  15 |     const tools = ['select', 'move', 'edit'];
  16 |     for (const tool of tools) {
  17 |       const toolButton = page.locator(`[data-testid="${tool}-tool"], button:has-text("${tool}"), [class*="${tool}"]`).first();
  18 |       if (await toolButton.isVisible()) {
  19 |         await toolButton.click();
  20 |         await page.waitForTimeout(500);
  21 |         await page.screenshot({ path: `demo-screenshots/toolbar-${tool}-selected.png` });
  22 |       }
  23 |     }
  24 | 
  25 |     // Demonstrate zoom controls
  26 |     const zoomIn = page.locator('[data-testid="zoom-in"], button:has-text("Zoom In"), [class*="zoom-in"]').first();
  27 |     if (await zoomIn.isVisible()) {
  28 |       await zoomIn.click();
  29 |       await page.waitForTimeout(500);
  30 |       await page.screenshot({ path: 'demo-screenshots/toolbar-zoom-in.png' });
  31 |     }
  32 | 
  33 |     const zoomOut = page.locator('[data-testid="zoom-out"], button:has-text("Zoom Out"), [class*="zoom-out"]').first();
  34 |     if (await zoomOut.isVisible()) {
  35 |       await zoomOut.click();
  36 |       await page.waitForTimeout(500);
  37 |       await page.screenshot({ path: 'demo-screenshots/toolbar-zoom-out.png' });
  38 |     }
  39 | 
  40 |     // Demonstrate track management
  41 |     const addTrack = page.locator('[data-testid="add-track"], button:has-text("Add Track")').first();
  42 |     if (await addTrack.isVisible()) {
  43 |       await addTrack.click();
  44 |       await page.waitForTimeout(500);
  45 |       await page.screenshot({ path: 'demo-screenshots/toolbar-add-track.png' });
  46 |     }
  47 | 
  48 |     const removeTrack = page.locator('[data-testid="remove-track"], button:has-text("Remove Track")').first();
  49 |     if (await removeTrack.isVisible()) {
  50 |       await removeTrack.click();
  51 |       await page.waitForTimeout(500);
  52 |       await page.screenshot({ path: 'demo-screenshots/toolbar-remove-track.png' });
  53 |     }
  54 | 
  55 |     // Verify toolbar is functional
  56 |     await expect(page.locator('[data-testid="toolbar"], .toolbar')).toBeVisible();
  57 |   });
  58 | });
```