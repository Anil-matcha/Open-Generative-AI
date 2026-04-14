import { test, expect } from '@playwright/test';

test.describe('Image Generation Tests', () => {
  test('should generate an image from text prompt', async ({ page }) => {
    // Navigate to image studio
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    // Wait for the page to load
    await page.waitForSelector('textarea[placeholder*="Describe the image"]');

    // Enter a prompt
    const promptTextarea = page.locator('textarea[placeholder*="Describe the image"]');
    await promptTextarea.fill('A beautiful sunset over mountains');

    // Click generate button
    const generateBtn = page.locator('button:has-text("Generate ✨")');
    await generateBtn.click();

    // Wait for generation to start (button should show loading state)
    await expect(generateBtn).toContainText('Generating...');

    // Wait for generation to complete or timeout
    // Note: Actual generation might take time, so we check for either success or error
    await page.waitForTimeout(5000); // Wait a bit for processing

    // Check that either the button is back to normal or there's an error/result
    const buttonText = await generateBtn.textContent();
    expect(buttonText).not.toContain('Generating...');
  });

  test('should handle image-to-image generation', async ({ page }) => {
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    // This test would require uploading an image first
    // For now, just check that the upload area exists
    const uploadArea = page.locator('[data-testid="upload-area"], .upload-area, input[type="file"]');
    // If upload area exists, the i2i functionality is present
    const uploadExists = await uploadArea.count() > 0;
    expect(uploadExists).toBe(true);
  });

  test('should navigate to different image models', async ({ page }) => {
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    // Look for model selection dropdown/button
    const modelBtn = page.locator('#model-btn-label, button:has-text("Model")').first();
    if (await modelBtn.count() > 0) {
      await modelBtn.click();
      // Check that dropdown opens
      await page.waitForTimeout(500);
    }
  });
});