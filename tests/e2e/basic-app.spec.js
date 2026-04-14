import { test, expect } from '@playwright/test';

test.describe('Basic App Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
    await expect(page.locator('#app')).toBeVisible();
  });

  test('should show sidebar navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');

    // Check if sidebar exists (only visible on desktop)
    const sidebar = page.locator('aside');
    const isDesktop = page.viewportSize()?.width >= 768;
    if (isDesktop) {
      await expect(sidebar).toBeVisible();
      // Check for navigation labels in sidebar
      await expect(page.locator('aside span').filter({ hasText: /^Image$/ })).toBeVisible();
      await expect(page.locator('aside span').filter({ hasText: /^Video$/ })).toBeVisible();
      await expect(page.locator('aside span').filter({ hasText: /^Audio$/ })).toBeVisible();
    }
  });

  test('should navigate to image studio', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');

    // Click on Image in sidebar (only on desktop)
    const isDesktop = page.viewportSize()?.width >= 768;
    if (isDesktop) {
      await page.locator('aside span').filter({ hasText: /^Image$/ }).click();
    } else {
      // On mobile, might need different navigation
      // For now, navigate directly via URL
      await page.goto('/#/image');
    }

    // Wait for content to load
    await page.waitForSelector('#content-area');

    // Check URL
    await expect(page).toHaveURL(/.*#\/image/);
  });
});