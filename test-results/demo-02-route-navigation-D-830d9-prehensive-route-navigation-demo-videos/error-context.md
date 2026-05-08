# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo/02-route-navigation.spec.ts >> Demo Video: Route Navigation & URL Handling >> should demonstrate comprehensive route navigation
- Location: tests/e2e/demo/02-route-navigation.spec.ts:4:3

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
  3  | test.describe('Demo Video: Route Navigation & URL Handling', () => {
  4  |   test('should demonstrate comprehensive route navigation', async ({ page }) => {
  5  |     await page.goto('/', { waitUntil: 'networkidle' });
> 6  |     await page.waitForSelector('h1, [data-testid="app-title"], .app-loaded', { timeout: 10000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  7  | 
  8  |     // Core Routes
  9  |     const coreRoutes = ['timeline', 'library', 'settings', 'explore', 'image', 'video', 'storyboard', 'edit', 'character'];
  10 | 
  11 |     for (const route of coreRoutes) {
  12 |       console.log(`Navigating to: ${route}`);
  13 |       try {
  14 |         // Try clicking navigation element
  15 |         const navElement = page.locator(`[data-testid="${route}-nav"], text=/${route}/i`).first();
  16 |         if (await navElement.isVisible()) {
  17 |           await navElement.click();
  18 |           await page.waitForTimeout(1000);
  19 |           await page.screenshot({ path: `demo-screenshots/navigation-${route}.png` });
  20 |         } else {
  21 |           // Try direct URL navigation
  22 |           await page.goto(`/${route}`);
  23 |           await page.waitForTimeout(1000);
  24 |           await page.screenshot({ path: `demo-screenshots/navigation-${route}-direct.png` });
  25 |         }
  26 |       } catch (error) {
  27 |         console.log(`Route ${route} navigation failed: ${error.message}`);
  28 |       }
  29 |     }
  30 | 
  31 |     // Extended Routes
  32 |     const extendedRoutes = ['effects', 'cinema', 'influencer', 'apps', 'templates', 'assist', 'community', 'avatar', 'audio'];
  33 | 
  34 |     for (const route of extendedRoutes) {
  35 |       console.log(`Navigating to extended route: ${route}`);
  36 |       try {
  37 |         const navElement = page.locator(`[data-testid="${route}-nav"], text=/${route}/i`).first();
  38 |         if (await navElement.isVisible()) {
  39 |           await navElement.click();
  40 |           await page.waitForTimeout(1000);
  41 |           await page.screenshot({ path: `demo-screenshots/navigation-extended-${route}.png` });
  42 |         }
  43 |       } catch (error) {
  44 |         console.log(`Extended route ${route} navigation failed: ${error.message}`);
  45 |       }
  46 |     }
  47 | 
  48 |     // Template Routes
  49 |     const templateRoutes = [
  50 |       'text-to-image', 'image-to-image', 'text-to-video', 'image-to-video', 'video-to-video'
  51 |     ];
  52 | 
  53 |     for (const route of templateRoutes) {
  54 |       console.log(`Navigating to template route: ${route}`);
  55 |       try {
  56 |         await page.goto(`/templates/${route}`);
  57 |         await page.waitForTimeout(1000);
  58 |         await page.screenshot({ path: `demo-screenshots/navigation-template-${route}.png` });
  59 |       } catch (error) {
  60 |         console.log(`Template route ${route} navigation failed: ${error.message}`);
  61 |       }
  62 |     }
  63 | 
  64 |     // Demonstrate URL parameter handling
  65 |     await page.goto('/image?model=flux-dev&prompt=test');
  66 |     await page.waitForTimeout(1000);
  67 |     await page.screenshot({ path: 'demo-screenshots/navigation-url-params.png' });
  68 | 
  69 |     // Demonstrate browser history navigation
  70 |     await page.goBack();
  71 |     await page.waitForTimeout(500);
  72 |     await page.goForward();
  73 |     await page.waitForTimeout(500);
  74 |     await page.screenshot({ path: 'demo-screenshots/navigation-history.png' });
  75 | 
  76 |     // Verify URL structure
  77 |     const currentUrl = page.url();
  78 |     expect(currentUrl).toMatch(/^http:\/\/localhost:\d+\//);
  79 |   });
  80 | });
```