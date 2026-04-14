import { test, expect } from '@playwright/test';

test.describe('Video Generation Tests', () => {
  test('should generate a video from text prompt', async ({ page }) => {
    // Navigate to video studio
    await page.goto('/#/video');
    await page.waitForSelector('#content-area');

    // Wait for the page to load
    await page.waitForSelector('textarea[placeholder*="Describe the video"]');

    // Enter a prompt
    const promptTextarea = page.locator('textarea[placeholder*="Describe the video"]');
    await promptTextarea.fill('A cat playing in a garden with flowers blooming');

    // Click generate button
    const generateBtn = page.locator('button:has-text("Generate ✨")');
    await generateBtn.click();

    // Wait for generation to start
    await expect(generateBtn).toContainText('Generating...');

    // Wait for generation to complete or timeout
    await page.waitForTimeout(10000); // Videos take longer

    // Check that button is back to normal
    const buttonText = await generateBtn.textContent();
    expect(buttonText).not.toContain('Generating...');
  });

  test('should handle image-to-video generation', async ({ page }) => {
    await page.goto('/#/video');
    await page.waitForSelector('#content-area');

    // Check for upload functionality
    const uploadArea = page.locator('[data-testid="upload-area"], .upload-area, input[type="file"]');
    const uploadExists = await uploadArea.count() > 0;
    expect(uploadExists).toBe(true);
  });

  test('should support different video models and settings', async ({ page }) => {
    await page.goto('/#/video');
    await page.waitForSelector('#content-area');

    // Look for model selection
    const modelBtn = page.locator('#v-model-btn-label, button:has-text("Model")').first();
    if (await modelBtn.count() > 0) {
      await modelBtn.click();
      await page.waitForTimeout(500);
    }

    // Look for duration/aspect ratio controls
    const durationBtn = page.locator('button:has-text("Duration"), #duration-btn-label').first();
    if (await durationBtn.count() > 0) {
      await durationBtn.click();
      await page.waitForTimeout(500);
    }
  });
});