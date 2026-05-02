import { test, expect } from '@playwright/test';

test('basic app load test', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#app')).toBeVisible();
});