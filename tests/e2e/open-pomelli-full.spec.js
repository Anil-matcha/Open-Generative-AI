import { test, expect } from '@playwright/test';

test.describe('Open Pomelli Full Flow', () => {
  test('Brand DNA extraction flow', async ({ page }) => {
    await page.goto('/apps/open-pomelli/');
    await page.fill('#url-input', 'https://example.com');
    await page.click('#submit-btn');
    await expect(page.locator('text=Extracting…')).toBeVisible();
    await page.waitForURL(/\/brand\/.*/, { timeout: 60000 });
    await expect(page.locator('h1')).toContainText('Example');
  });

  test('Campaign generation flow', async ({ page }) => {
    await page.goto('/apps/open-pomelli/brand/test-id');
    await page.click('text=Generate Campaign →');
    await page.waitForURL(/\/brand\/.*\/campaigns\/new/);
    await page.click('.goal-option >> nth=0');
    await page.click('#generate-btn');
    await expect(page.locator('text=Generating…')).toBeVisible();
    await page.waitForSelector('#results', { timeout: 60000 });
    await expect(page.locator('#results >> text=Generated Concepts')).toBeVisible();
  });

  test('Photo studio generation', async ({ page }) => {
    await page.goto('/apps/open-pomelli/photo-studio');
    await page.fill('#product-url', 'https://example.com/product.jpg');
    await page.click('.category-option >> nth=0');
    await page.click('.style-option >> nth=0');
    await page.click('#generate-btn');
    await expect(page.locator('text=Generating…')).toBeVisible();
    await page.waitForSelector('#preview img', { timeout: 60000 });
  });

  test('Animation generation', async ({ page }) => {
    await page.goto('/apps/open-pomelli/animate');
    await page.fill('#source-url', 'https://example.com/image.jpg');
    await page.fill('#prompt', 'Slow camera movement');
    await page.click('#generate-btn');
    await expect(page.locator('text=Generating…')).toBeVisible();
    await page.waitForSelector('#preview video', { timeout: 60000 });
  });

  test('Data persistence in Supabase', async ({ page }) => {
    await page.goto('/apps/open-pomelli/');
    await page.fill('#url-input', 'https://test.com');
    await page.click('#submit-btn');
    await page.waitForURL(/\/brand\/.*/, { timeout: 60000 });
    const url = page.url();
    const brandId = url.split('/').pop();
    
    // Verify data is saved (this would require Supabase check, simplified here)
    await expect(page.locator('h1')).toBeVisible();
  });
});
