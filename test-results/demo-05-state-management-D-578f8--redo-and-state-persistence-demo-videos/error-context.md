# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo/05-state-management.spec.ts >> Demo Video: State Management >> should demonstrate undo/redo and state persistence
- Location: tests/e2e/demo/05-state-management.spec.ts:4:3

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
  3  | test.describe('Demo Video: State Management', () => {
  4  |   test('should demonstrate undo/redo and state persistence', async ({ page }) => {
  5  |     await page.goto('/timeline', { waitUntil: 'networkidle' });
> 6  |     await page.waitForSelector('[data-testid="timeline"], .timeline', { timeout: 10000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  7  | 
  8  |     // Perform some actions that can be undone
  9  |     const initialScreenshot = await page.screenshot();
  10 |     await page.screenshot({ path: 'demo-screenshots/state-initial.png' });
  11 | 
  12 |     // Try to add a clip or perform an action
  13 |     const addButton = page.locator('[data-testid="add-clip"], button:has-text("Add"), [class*="add"]').first();
  14 |     if (await addButton.isVisible()) {
  15 |       await addButton.click();
  16 |       await page.waitForTimeout(1000);
  17 |       await page.screenshot({ path: 'demo-screenshots/state-after-action.png' });
  18 | 
  19 |       // Try undo
  20 |       const undoButton = page.locator('[data-testid="undo-btn"], button:has-text("Undo"), [class*="undo"]').first();
  21 |       if (await undoButton.isVisible()) {
  22 |         await undoButton.click();
  23 |         await page.waitForTimeout(500);
  24 |         await page.screenshot({ path: 'demo-screenshots/state-after-undo.png' });
  25 | 
  26 |         // Try redo
  27 |         const redoButton = page.locator('[data-testid="redo-btn"], button:has-text("Redo"), [class*="redo"]').first();
  28 |         if (await redoButton.isVisible()) {
  29 |           await redoButton.click();
  30 |           await page.waitForTimeout(500);
  31 |           await page.screenshot({ path: 'demo-screenshots/state-after-redo.png' });
  32 |         }
  33 |       }
  34 |     }
  35 | 
  36 |     // Demonstrate project state persistence (if supported)
  37 |     // This would typically involve saving and reloading
  38 |     const saveButton = page.locator('[data-testid="save-btn"], button:has-text("Save")').first();
  39 |     if (await saveButton.isVisible()) {
  40 |       await saveButton.click();
  41 |       await page.waitForTimeout(1000);
  42 |       await page.screenshot({ path: 'demo-screenshots/state-saved.png' });
  43 |     }
  44 |   });
  45 | });
```