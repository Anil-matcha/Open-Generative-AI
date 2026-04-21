import { test, expect } from '@playwright/test';

test.describe('Offline Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set offline mode before each test
    await page.addInitScript(() => {
      localStorage.setItem('force_offline_mode', 'true');
      // Mock navigator.onLine to be false
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    });

    // Navigate to the app
    await page.goto('/');
  });

  test('should load application in offline mode', async ({ page }) => {
    // Check that the app loads without network errors
    await expect(page.locator('#app')).toBeVisible();

    // Check for offline mode indicator
    await expect(page.locator('text=/offline|local/i')).toBeVisible({ timeout: 10000 });
  });

  test('should allow creating projects offline', async ({ page }) => {
    // Navigate to projects section
    await page.click('text=/project|create/i');

    // Fill project details
    await page.fill('input[name="project-name"]', 'Offline Test Project');
    await page.fill('textarea[name="description"]', 'Testing offline functionality');

    // Save project
    await page.click('button:has-text("Save")');

    // Verify project was created
    await expect(page.locator('text=Offline Test Project')).toBeVisible();
  });

  test('should generate images offline', async ({ page }) => {
    // Navigate to image generation
    await page.click('text=/image|generate/i');

    // Enter prompt
    await page.fill('input[placeholder*="prompt"]', 'a beautiful sunset over mountains');

    // Generate image
    await page.click('button:has-text("Generate")');

    // Wait for generation to complete (should be fast in offline mode)
    await page.waitForSelector('img[alt*="generated"]', { timeout: 10000 });

    // Verify image was generated
    const image = page.locator('img[alt*="generated"]');
    await expect(image).toBeVisible();
  });

  test('should process image-to-image offline', async ({ page }) => {
    // First generate a base image
    await page.click('text=/image|generate/i');
    await page.fill('input[placeholder*="prompt"]', 'a red apple');
    await page.click('button:has-text("Generate")');
    await page.waitForSelector('img[alt*="generated"]');

    // Select the image for editing
    await page.click('img[alt*="generated"]');
    await page.click('text=/edit|transform/i');

    // Apply image-to-image transformation
    await page.fill('input[placeholder*="prompt"]', 'make it blue');
    await page.click('button:has-text("Transform")');

    // Verify transformation completed
    await page.waitForSelector('img[alt*="transformed"]', { timeout: 10000 });
    await expect(page.locator('img[alt*="transformed"]')).toBeVisible();
  });

  test('should generate videos offline', async ({ page }) => {
    // Navigate to video generation
    await page.click('text=/video/i');

    // Enter video prompt
    await page.fill('input[placeholder*="video prompt"]', 'a butterfly flying through a garden');

    // Set duration
    await page.selectOption('select[name="duration"]', '5');

    // Generate video
    await page.click('button:has-text("Generate Video")');

    // Wait for video generation to complete
    await page.waitForSelector('video', { timeout: 20000 });

    // Verify video was generated
    const video = page.locator('video');
    await expect(video).toBeVisible();
  });

  test('should allow timeline editing offline', async ({ page }) => {
    // Navigate to timeline editor
    await page.click('text=/timeline|editor/i');

    // Add a clip to timeline
    await page.click('button:has-text("Add Clip")');

    // Upload or select media
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/sample-video.mp4');

    // Verify clip was added
    await expect(page.locator('.timeline-clip')).toBeVisible();

    // Test playback controls
    await page.click('button[title*="play"]');
    await page.waitForTimeout(1000);
    await page.click('button[title*="pause"]');
  });

  test('should persist data across sessions', async ({ page, context }) => {
    // Create a project
    await page.click('text=/project|create/i');
    await page.fill('input[name="project-name"]', 'Persistence Test');
    await page.click('button:has-text("Save")');

    // Reload the page
    await page.reload();

    // Verify project still exists
    await expect(page.locator('text=Persistence Test')).toBeVisible();
  });

  test('should handle offline media uploads', async ({ page }) => {
    // Navigate to media library
    await page.click('text=/media|library/i');

    // Upload a file
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/sample-image.png');

    // Verify file was uploaded and stored locally
    await expect(page.locator('img[alt*="sample"]')).toBeVisible();

    // Check that it's accessible offline
    await page.reload();
    await expect(page.locator('img[alt*="sample"]')).toBeVisible();
  });

  test('should export and import project data', async ({ page }) => {
    // Create some content
    await page.click('text=/project|create/i');
    await page.fill('input[name="project-name"]', 'Export Test Project');
    await page.click('button:has-text("Save")');

    // Export data
    await page.click('text=/export|backup/i');
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toMatch(/backup|export/);

    // Import data (in a real test, you'd upload the exported file)
    // This tests the import functionality exists
    await expect(page.locator('text=/import/i')).toBeVisible();
  });

  test('should show offline status indicators', async ({ page }) => {
    // Check for offline status in UI
    await expect(page.locator('text=/offline|disconnected/i')).toBeVisible();

    // Check that online-only features are disabled or show appropriate messages
    const onlineOnlyElements = page.locator('[data-online-only]');
    if (await onlineOnlyElements.count() > 0) {
      await expect(onlineOnlyElements.first()).toHaveAttribute('disabled');
    }
  });

  test('should gracefully handle network restoration', async ({ page }) => {
    // Simulate coming back online
    await page.addScriptTag({
      content: `
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        window.dispatchEvent(new Event('online'));
      `
    });

    // Check that the app responds to online status
    await expect(page.locator('text=/online|connected/i')).toBeVisible({ timeout: 5000 });
  });

  test('should work without external API keys', async ({ page }) => {
    // Clear any stored API keys
    await page.addInitScript(() => {
      localStorage.removeItem('muapi_key');
    });

    await page.reload();

    // App should still work with local AI
    await page.click('text=/generate/i');
    await page.fill('input[placeholder*="prompt"]', 'test prompt');
    await page.click('button:has-text("Generate")');

    // Should generate using local AI
    await page.waitForSelector('img', { timeout: 10000 });
  });
});