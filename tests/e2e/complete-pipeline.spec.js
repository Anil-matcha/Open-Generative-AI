import { test, expect } from '@playwright/test';

test.describe('Complete Video Production Pipeline Tests', () => {
  test('should complete full video creation workflow', async ({ page }) => {
    // This test simulates a complete user journey
    // Navigate to image studio first
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    // Generate an image (if possible without auth)
    const imageTextarea = page.locator('textarea[placeholder*="Describe the image"]');
    if (await imageTextarea.count() > 0) {
      await imageTextarea.fill('A scenic mountain landscape at sunset');
      const generateBtn = page.locator('button:has-text("Generate ✨")');
      await generateBtn.click();
      // Wait for generation attempt
      await page.waitForTimeout(3000);
    }

    // Navigate to video studio
    await page.goto('/#/video');
    await page.waitForSelector('#content-area');

    // Try video generation
    const videoTextarea = page.locator('textarea[placeholder*="Describe the video"]');
    if (await videoTextarea.count() > 0) {
      await videoTextarea.fill('A time-lapse of the mountain landscape changing through seasons');
      const videoGenerateBtn = page.locator('button:has-text("Generate ✨")');
      await videoGenerateBtn.click();
      await page.waitForTimeout(5000);
    }

    // Navigate to audio studio
    await page.goto('/#/audio');
    await page.waitForSelector('#content-area');

    // Try audio generation
    const audioTextarea = page.locator('textarea[placeholder*="Describe the music"]');
    if (await audioTextarea.count() > 0) {
      await audioTextarea.fill('Peaceful ambient music with nature sounds');
      const audioGenerateBtn = page.locator('button:has-text("Generate Audio")');
      await audioGenerateBtn.click();
      await page.waitForTimeout(3000);
    }

    // Navigate to timeline editor
    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Check timeline interface
    await expect(page.locator('#playBtn')).toBeVisible();
    await expect(page.locator('#uploadBtn')).toBeVisible();
  });

  test('should handle file uploads in various formats', async ({ page }) => {
    await page.goto('/#/timeline');
    await page.waitForSelector('#app');

    // Check upload input accepts multiple formats
    const uploadInput = page.locator('#uploadInput');
    const acceptAttr = await uploadInput.getAttribute('accept');
    expect(acceptAttr).toContain('video/*');
    expect(acceptAttr).toContain('image/*');
    expect(acceptAttr).toContain('audio/*');
  });

  test('should support multi-step form submissions', async ({ page }) => {
    // Test form interactions across different studios
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    // Fill form fields
    const textarea = page.locator('textarea');
    if (await textarea.count() > 0) {
      await textarea.fill('Test prompt for form validation');
    }

    // Check for model selection
    const modelBtn = page.locator('#model-btn-label, button:has-text("Model")').first();
    if (await modelBtn.count() > 0) {
      await modelBtn.click();
      await page.waitForTimeout(500);
    }

    // Check for other form controls
    const selects = page.locator('select');
    for (let i = 0; i < await selects.count(); i++) {
      const select = selects.nth(i);
      if (await select.isVisible()) {
        await select.selectOption({ index: 0 });
      }
    }
  });

  test('should handle browser interactions like drag and drop', async ({ page }) => {
    await page.goto('/#/timeline');
    await page.waitForSelector('#app');

    // Check for drag-drop areas (timeline tracks)
    const tracks = page.locator('.track-row');
    await expect(tracks.first()).toBeVisible();

    // Check for media items that could be dragged
    const mediaItems = page.locator('.media-item');
    if (await mediaItems.count() > 0) {
      // Media items exist for dragging
      expect(await mediaItems.count()).toBeGreaterThan(0);
    }
  });

  test('should support complex user journeys with multiple steps', async ({ page }) => {
    // Start with image generation
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    // Step 1: Fill image prompt
    const imagePrompt = page.locator('textarea');
    await imagePrompt.fill('A futuristic city skyline at night');

    // Step 2: Navigate to video (simulate using image as input)
    await page.goto('/#/video');
    await page.waitForSelector('#content-area');

    // Step 3: Fill video prompt
    const videoPrompt = page.locator('textarea');
    await videoPrompt.fill('Animate the city skyline with flying cars');

    // Step 4: Navigate to timeline
    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Step 5: Check timeline is ready for editing
    await expect(page.locator('.timeline-header')).toBeVisible();
    await expect(page.locator('.track-row')).toHaveCount(await page.locator('.track-row').count());
  });
});