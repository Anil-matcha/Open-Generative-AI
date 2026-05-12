const { test, expect } = require('@playwright/test');

test.describe('Videco AI Platform Full Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/apps/videco-ai-platform/');
  });

  test('should redirect from root to login page', async ({ page }) => {
    await page.goto('http://localhost:3000/apps/videco-ai-platform/');
    await expect(page).toHaveURL(/.*auth\/login/);
  });

  test('should load login page with email input', async ({ page }) => {
    await page.goto('http://localhost:3000/apps/videco-ai-platform/auth/login');
    const emailInput = await page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('should load video studio page with prompt bar', async ({ page }) => {
    // Mock auth
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({ user: { id: 'test-user' } }));
    });
    await page.goto('http://localhost:3000/apps/videco-ai-platform/studio');
    const promptBar = await page.locator('[data-testid="prompt-bar"]');
    await expect(promptBar).toBeVisible();
  });

  test('should generate text-to-video', async ({ page }) => {
    await page.goto('http://localhost:3000/apps/videco-ai-platform/studio');
    await page.fill('textarea', 'A cat walking in the park');
    await page.click('button:has-text("Generate")');
    const videoElement = await page.locator('video');
    await expect(videoElement).toBeVisible({ timeout: 120000 });
  });

  test('should upload image for image-to-video', async ({ page }) => {
    await page.goto('http://localhost:3000/apps/videco-ai-platform/studio');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-image.jpg');
    const uploadedImage = await page.locator('[data-testid="uploaded-image"]');
    await expect(uploadedImage).toBeVisible();
  });

  test('should display pricing page with plans', async ({ page }) => {
    await page.goto('http://localhost:3000/apps/videco-ai-platform/pricing');
    const pricingPlans = await page.locator('[data-testid="pricing-plan"]');
    await expect(pricingPlans).toHaveCount(3);
  });

  test('should load timeline editor', async ({ page }) => {
    await page.goto('http://localhost:3000/apps/videco-ai-platform/studio');
    const timeline = await page.locator('[data-testid="timeline"]');
    await expect(timeline).toBeVisible();
  });
});
