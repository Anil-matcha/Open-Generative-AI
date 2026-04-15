import { test, expect } from '@playwright/test';

test.describe('Advanced Dubbing Studio', () => {
  test('should load advanced dubbing studio correctly', async ({ page }) => {
    await page.goto('/#/advanced-dubbing');

    // Check if page loads
    await expect(page.locator('h1')).toContainText('Advanced Dubbing Studio');

    // Check for main sections
    await expect(page.locator('text=Source Video')).toBeVisible();
    await expect(page.locator('text=Voice Selection')).toBeVisible();
    await expect(page.locator('text=Quality Controls')).toBeVisible();
    await expect(page.locator('text=Preview & Generate')).toBeVisible();
  });

  test('should have language selection interface', async ({ page }) => {
    await page.goto('/#/advanced-dubbing');

    // Check for language selectors
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.locator('text=Source Language')).toBeVisible();
    await expect(page.locator('text=Target Language')).toBeVisible();
  });

  test('should have voice selection interface', async ({ page }) => {
    await page.goto('/#/advanced-dubbing');

    // Check for voice controls
    await expect(page.locator('text=Voice Selection')).toBeVisible();
    await expect(page.locator('text=Voice Style')).toBeVisible();
    await expect(page.locator('#voice-list')).toBeVisible();
  });

  test('should have quality controls', async ({ page }) => {
    await page.goto('/#/advanced-dubbing');

    // Check for quality controls
    await expect(page.locator('text=Lip Sync Quality')).toBeVisible();
    await expect(page.locator('text=Speed Adjustment')).toBeVisible();
    await expect(page.locator('text=Preserve Emotion')).toBeVisible();
  });

  test('should have action buttons', async ({ page }) => {
    await page.goto('/#/advanced-dubbing');

    // Check for action buttons
    await expect(page.locator('text=Generate Voice Preview')).toBeVisible();
    await expect(page.locator('text=Translate Only')).toBeVisible();
    await expect(page.locator('text=Translate & Dub')).toBeVisible();
  });

  test('should navigate from apps hub', async ({ page }) => {
    await page.goto('/#/apps');

    // Find and click the Advanced Dubbing app
    await page.locator('text=Advanced Dubbing').click();

    // Should navigate to advanced dubbing studio
    await expect(page.locator('h1')).toContainText('Advanced Dubbing Studio');
  });

  test('should handle video upload interface', async ({ page }) => {
    await page.goto('/#/advanced-dubbing');

    // Check for video upload section
    await expect(page.locator('text=Source Video')).toBeVisible();

    // Should have upload trigger (though we can't test actual upload without file)
    const uploadTrigger = page.locator('button').filter({ hasText: /Choose|Upload/ });
    await expect(uploadTrigger.or(page.locator('[data-upload-trigger]'))).toBeVisible();
  });

  test('should initialize with default languages', async ({ page }) => {
    await page.goto('/#/advanced-dubbing');

    // Check default language selections
    const sourceSelect = page.locator('select').nth(0);
    const targetSelect = page.locator('select').nth(1);

    await expect(sourceSelect).toHaveValue('en');
    await expect(targetSelect).toHaveValue('es');
  });
});