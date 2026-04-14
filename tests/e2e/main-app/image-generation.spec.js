import { test, expect } from '@playwright/test';

test.describe('Image Generation Studio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/image');
    await page.waitForSelector('[data-testid="image-studio"]');
  });

  test('should render image generation interface', async ({ page }) => {
    await expect(page.locator('[data-testid="image-studio"]')).toBeVisible();
    await expect(page.locator('[data-testid="prompt-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="generate-btn"]')).toBeVisible();
  });

  test('should generate image with prompt', async ({ page }) => {
    await page.fill('[data-testid="prompt-input"]', 'A beautiful sunset over mountains');
    await page.click('[data-testid="generate-btn"]');

    // Wait for generation to complete
    await page.waitForSelector('[data-testid="generated-image"]', { timeout: 30000 });
    await expect(page.locator('[data-testid="generated-image"]')).toBeVisible();
  });

  test('should support aspect ratio selection', async ({ page }) => {
    await page.click('[data-testid="aspect-ratio-select"]');
    await page.click('[data-testid="ratio-16-9"]');

    const selectedRatio = await page.locator('[data-testid="aspect-ratio-select"]').textContent();
    expect(selectedRatio).toContain('16:9');
  });

  test('should support style selection', async ({ page }) => {
    await page.click('[data-testid="style-select"]');
    await page.click('[data-testid="style-realistic"]');

    const selectedStyle = await page.locator('[data-testid="style-select"]').textContent();
    expect(selectedStyle).toContain('Realistic');
  });

  test('should support negative prompts', async ({ page }) => {
    await page.fill('[data-testid="negative-prompt-input"]', 'blurry, low quality');
    await page.fill('[data-testid="prompt-input"]', 'A beautiful landscape');
    await page.click('[data-testid="generate-btn"]');

    await page.waitForSelector('[data-testid="generated-image"]');
    await expect(page.locator('[data-testid="generated-image"]')).toBeVisible();
  });

  test('should save generated images', async ({ page }) => {
    await page.fill('[data-testid="prompt-input"]', 'A serene lake');
    await page.click('[data-testid="generate-btn"]');

    await page.waitForSelector('[data-testid="generated-image"]');
    await page.click('[data-testid="save-image-btn"]');

    // Check if saved to library
    await page.goto('/#/library');
    await expect(page.locator('[data-testid="saved-image"]')).toBeVisible();
  });

  test('should support batch generation', async ({ page }) => {
    await page.fill('[data-testid="prompt-input"]', 'A variety of flowers');
    await page.fill('[data-testid="batch-count-input"]', '4');
    await page.click('[data-testid="generate-btn"]');

    // Wait for all images to generate
    await page.waitForSelector('[data-testid="generated-images-grid"]');
    const imageCount = await page.locator('[data-testid="generated-image"]').count();
    expect(imageCount).toBe(4);
  });

  test('should handle generation errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/generate/image', route => route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Generation failed' })
    }));

    await page.fill('[data-testid="prompt-input"]', 'Test prompt');
    await page.click('[data-testid="generate-btn"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Generation failed');
  });

  test('should support image variations', async ({ page }) => {
    await page.fill('[data-testid="prompt-input"]', 'A portrait');
    await page.click('[data-testid="generate-btn"]');

    await page.waitForSelector('[data-testid="generated-image"]');
    await page.click('[data-testid="create-variations-btn"]');

    await page.waitForSelector('[data-testid="variation-images"]');
    const variationCount = await page.locator('[data-testid="variation-image"]').count();
    expect(variationCount).toBeGreaterThan(1);
  });

  test('should support inpainting', async ({ page }) => {
    await page.fill('[data-testid="prompt-input"]', 'A landscape');
    await page.click('[data-testid="generate-btn"]');

    await page.waitForSelector('[data-testid="generated-image"]');
    await page.click('[data-testid="inpainting-mode-btn"]');

    await expect(page.locator('[data-testid="inpainting-tools"]')).toBeVisible();
  });
});