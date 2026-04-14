import { test, expect } from '@playwright/test';

test.describe('Audio Production Tests', () => {
  test('should generate music from prompt', async ({ page }) => {
    // Navigate to audio studio
    await page.goto('/#/audio');
    await page.waitForSelector('#content-area');

    // Wait for the page to load
    await page.waitForSelector('textarea[placeholder*="Describe the music"]');

    // Select a music model if available
    const musicModelBtn = page.locator('button:has-text("Music"), button:has-text("Suno")').first();
    if (await musicModelBtn.count() > 0) {
      await musicModelBtn.click();
    }

    // Enter a prompt
    const promptTextarea = page.locator('textarea[placeholder*="Describe the music"]');
    await promptTextarea.fill('Upbeat electronic music with synth leads and driving beat');

    // Select duration
    const durationSelect = page.locator('select, button:has-text("30")').first();
    if (await durationSelect.count() > 0) {
      await durationSelect.click();
      // If it's a select, choose 30 seconds
      if (await page.locator('option').count() > 0) {
        await page.selectOption('select', '30');
      }
    }

    // Click generate button
    const generateBtn = page.locator('button:has-text("Generate Audio")');
    await generateBtn.click();

    // Wait for generation to start
    await page.waitForTimeout(2000);

    // Check that button shows loading or completes
    const buttonText = await generateBtn.textContent();
    expect(buttonText).not.toBe('Generate Audio');
  });

  test('should support different audio models', async ({ page }) => {
    await page.goto('/#/audio');
    await page.waitForSelector('#content-area');

    // Check for model buttons
    const modelButtons = page.locator('button:has-text("Music"), button:has-text("Speech"), button:has-text("TTS")');
    const modelCount = await modelButtons.count();
    expect(modelCount).toBeGreaterThan(0);

    // Click on different models
    for (let i = 0; i < Math.min(modelCount, 2); i++) {
      await modelButtons.nth(i).click();
      await page.waitForTimeout(500);
    }
  });

  test('should handle speech synthesis', async ({ page }) => {
    await page.goto('/#/audio');
    await page.waitForSelector('#content-area');

    // Look for speech/TTS model
    const speechBtn = page.locator('button:has-text("Speech"), button:has-text("TTS")').first();
    if (await speechBtn.count() > 0) {
      await speechBtn.click();

      // Check for text input for speech
      const textInput = page.locator('textarea, input[type="text"]').first();
      if (await textInput.count() > 0) {
        await textInput.fill('Hello, this is a test of text-to-speech synthesis.');
      }
    }
  });
});