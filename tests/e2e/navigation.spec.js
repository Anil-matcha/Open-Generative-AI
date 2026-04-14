import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('should navigate between different studios', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load
    await page.waitForSelector('#app');

    // Check initial page is image studio
    await expect(page).toHaveURL(/.*#\/image/);

    // Navigate to video studio
    await page.goto('/#/video');
    await expect(page).toHaveURL(/.*#\/video/);

    // Navigate to audio studio
    await page.goto('/#/audio');
    await expect(page).toHaveURL(/.*#\/audio/);

    // Navigate to cinema studio
    await page.goto('/#/cinema');
    await expect(page).toHaveURL(/.*#\/cinema/);

    // Navigate to timeline editor
    await page.goto('/#/edit');
    await expect(page).toHaveURL(/.*#\/edit/);
  });

  test('should load timeline editor', async ({ page }) => {
    await page.goto('/#/timeline');
    await page.waitForSelector('#content-area');

    // Check that timeline editor loads
    await expect(page.locator('#content-area')).toBeVisible();
  });
});