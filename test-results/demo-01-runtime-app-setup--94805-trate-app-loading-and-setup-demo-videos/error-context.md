# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo/01-runtime-app-setup.spec.ts >> Demo Video: Runtime & App Setup >> should demonstrate app loading and setup
- Location: tests/e2e/demo/01-runtime-app-setup.spec.ts:4:3

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
  3  | test.describe('Demo Video: Runtime & App Setup', () => {
  4  |   test('should demonstrate app loading and setup', async ({ page }) => {
  5  |     // Navigate to app
  6  |     const startTime = Date.now();
  7  |     await page.goto('/', { waitUntil: 'networkidle' });
  8  | 
  9  |     // Wait for app to load
> 10 |     await page.waitForSelector('h1, [data-testid="app-title"], .app-loaded', { timeout: 10000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  11 | 
  12 |     const loadTime = Date.now() - startTime;
  13 |     console.log(`App load time: ${loadTime}ms`);
  14 | 
  15 |     // Verify app is loaded
  16 |     await expect(page).toHaveTitle(/AI Video Agency|Open-Higgsfield-AI/);
  17 | 
  18 |     // Take screenshot of loaded app
  19 |     await page.screenshot({ path: 'demo-screenshots/runtime-app-setup-loaded.png' });
  20 | 
  21 |     // Demonstrate responsive design by resizing
  22 |     await page.setViewportSize({ width: 768, height: 1024 }); // Mobile
  23 |     await page.waitForTimeout(1000);
  24 |     await page.screenshot({ path: 'demo-screenshots/runtime-app-setup-mobile.png' });
  25 | 
  26 |     await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
  27 |     await page.waitForTimeout(1000);
  28 |     await page.screenshot({ path: 'demo-screenshots/runtime-app-setup-desktop.png' });
  29 | 
  30 |     // Verify load time is under 5 seconds as per requirements
  31 |     expect(loadTime).toBeLessThan(5000);
  32 |   });
  33 | });
```