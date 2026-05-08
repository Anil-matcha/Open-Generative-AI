# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo/03-app-shell-components.spec.ts >> Demo Video: App Shell Components >> should demonstrate app shell components
- Location: tests/e2e/demo/03-app-shell-components.spec.ts:4:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('h1, [data-testid="app-title"], .app-loaded') to be visible

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Demo Video: App Shell Components', () => {
  4  |   test('should demonstrate app shell components', async ({ page }) => {
  5  |     await page.goto('/', { waitUntil: 'networkidle' });
> 6  |     await page.waitForSelector('h1, [data-testid="app-title"], .app-loaded', { timeout: 10000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  7  | 
  8  |     // Demonstrate header component
  9  |     const header = page.locator('header, [data-testid="app-header"]').first();
  10 |     if (await header.isVisible()) {
  11 |       await header.screenshot({ path: 'demo-screenshots/shell-header.png' });
  12 |     }
  13 | 
  14 |     // Demonstrate sidebar
  15 |     const sidebar = page.locator('aside, [data-testid="app-sidebar"], .sidebar').first();
  16 |     if (await sidebar.isVisible()) {
  17 |       await sidebar.screenshot({ path: 'demo-screenshots/shell-sidebar.png' });
  18 |     }
  19 | 
  20 |     // Demonstrate responsive design
  21 |     await page.setViewportSize({ width: 375, height: 667 }); // iPhone
  22 |     await page.waitForTimeout(1000);
  23 |     await page.screenshot({ path: 'demo-screenshots/shell-mobile-layout.png' });
  24 | 
  25 |     await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
  26 |     await page.waitForTimeout(1000);
  27 |     await page.screenshot({ path: 'demo-screenshots/shell-tablet-layout.png' });
  28 | 
  29 |     await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
  30 |     await page.waitForTimeout(1000);
  31 |     await page.screenshot({ path: 'demo-screenshots/shell-desktop-layout.png' });
  32 | 
  33 |     // Test component visibility
  34 |     await expect(page.locator('body')).toBeVisible();
  35 | 
  36 |     // Demonstrate layout changes on navigation
  37 |     const navItem = page.locator('[data-testid="timeline-nav"], text=/timeline/i').first();
  38 |     if (await navItem.isVisible()) {
  39 |       await navItem.click();
  40 |       await page.waitForTimeout(1000);
  41 |       await page.screenshot({ path: 'demo-screenshots/shell-timeline-layout.png' });
  42 |     }
  43 |   });
  44 | });
```