import { test, expect } from '@playwright/test';

const TEST_API_KEY = process.env.TEST_MUAPI_KEY || '';

test.describe('Open Generative AI — E2E Smoke Tests', () => {
  test.describe('App Shell', () => {
    test('loads and shows API key modal when no key is set', async ({ page }) => {
      // Clear localStorage to simulate first visit
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());

      await page.goto('/studio/image');

      // Should show the API key entry modal
      const apiKeyInput = page.locator('input[type="password"], input[placeholder*="key"], input[placeholder*="API"]');
      await expect(apiKeyInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('shows studio tabs after entering API key', async ({ page }) => {
      if (!TEST_API_KEY) {
        test.skip(true, 'TEST_MUAPI_KEY not set');
        return;
      }

      await page.goto('/studio/image');
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      // Enter API key
      const apiKeyInput = page.locator('input[type="password"], input[placeholder*="key"], input[placeholder*="API"]').first();
      await apiKeyInput.fill(TEST_API_KEY);

      // Click save/submit button
      const saveButton = page.locator('button').filter({ hasText: /save|submit|continue|enter/i }).first();
      await saveButton.click();

      // Should see the studio interface
      await expect(page.locator('header, nav, [role="navigation"]').first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Navigation', () => {
    test('sidebar categories are visible', async ({ page }) => {
      await page.goto('/studio/image');

      // Sidebar should have navigation categories
      const sidebar = page.locator('aside, nav[aria-label*="navigation" i], [role="navigation"]').first();
      await expect(sidebar).toBeVisible({ timeout: 10000 });
    });

    test('tab switching works via URL', async ({ page }) => {
      await page.goto('/studio/video');
      await expect(page).toHaveURL(/\/studio\/video/);

      await page.goto('/studio/audio');
      await expect(page).toHaveURL(/\/studio\/audio/);

      await page.goto('/studio/lipsync');
      await expect(page).toHaveURL(/\/studio\/lipsync/);
    });
  });

  test.describe('Image Studio', () => {
    test('renders prompt textarea', async ({ page }) => {
      await page.goto('/studio/image');

      // Should have a textarea for prompts
      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible({ timeout: 10000 });
    });

    test('model selector is present', async ({ page }) => {
      await page.goto('/studio/image');

      // Model selector should be visible
      const modelSelector = page.locator('select, [role="combobox"], [data-testid="model-selector"]').first();
      await expect(modelSelector).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Video Studio', () => {
    test('renders without crashing', async ({ page }) => {
      await page.goto('/studio/video');

      // Page should load without errors
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Check no error boundary is shown
      const errorFallback = page.locator('text=Something went wrong');
      await expect(errorFallback).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Lip Sync Studio', () => {
    test('renders without crashing', async ({ page }) => {
      await page.goto('/studio/lipsync');

      const body = page.locator('body');
      await expect(body).toBeVisible();

      const errorFallback = page.locator('text=Something went wrong');
      await expect(errorFallback).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Security Headers', () => {
    test('response includes security headers', async ({ page }) => {
      const response = await page.goto('/studio/image');
      const headers = response.headers();

      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });
});
