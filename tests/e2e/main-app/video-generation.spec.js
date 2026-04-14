import { test, expect } from '@playwright/test';

test.describe('Video Generation Studio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/video');
    await page.waitForSelector('[data-testid="video-studio"]');
  });

  test('should render video generation interface', async ({ page }) => {
    await expect(page.locator('[data-testid="video-studio"]')).toBeVisible();
    await expect(page.locator('[data-testid="video-prompt-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="generate-video-btn"]')).toBeVisible();
  });

  test('should generate video with prompt', async ({ page }) => {
    await page.fill('[data-testid="video-prompt-input"]', 'A butterfly flying through a garden');
    await page.click('[data-testid="generate-video-btn"]');

    // Wait for generation to complete
    await page.waitForSelector('[data-testid="generated-video"]', { timeout: 60000 });
    await expect(page.locator('[data-testid="generated-video"]')).toBeVisible();
  });

  test('should support duration selection', async ({ page }) => {
    await page.click('[data-testid="duration-select"]');
    await page.click('[data-testid="duration-10s"]');

    const selectedDuration = await page.locator('[data-testid="duration-select"]').textContent();
    expect(selectedDuration).toContain('10s');
  });

  test('should support aspect ratio selection', async ({ page }) => {
    await page.click('[data-testid="video-aspect-ratio-select"]');
    await page.click('[data-testid="video-ratio-16-9"]');

    const selectedRatio = await page.locator('[data-testid="video-aspect-ratio-select"]').textContent();
    expect(selectedRatio).toContain('16:9');
  });

  test('should support quality presets', async ({ page }) => {
    await page.click('[data-testid="quality-select"]');
    await page.click('[data-testid="quality-high"]');

    const selectedQuality = await page.locator('[data-testid="quality-select"]').textContent();
    expect(selectedQuality).toContain('High');
  });

  test('should support text-to-video generation', async ({ page }) => {
    await page.click('[data-testid="text-to-video-tab"]');
    await page.fill('[data-testid="video-prompt-input"]', 'A cat playing with yarn');
    await page.click('[data-testid="generate-video-btn"]');

    await page.waitForSelector('[data-testid="generated-video"]');
    await expect(page.locator('[data-testid="generated-video"]')).toBeVisible();
  });

  test('should support image-to-video generation', async ({ page }) => {
    await page.click('[data-testid="image-to-video-tab"]');

    // Upload reference image
    await page.setInputFiles('[data-testid="reference-image-input"]', 'tests/sample-image.jpg');

    await page.fill('[data-testid="video-prompt-input"]', 'Make this image come to life');
    await page.click('[data-testid="generate-video-btn"]');

    await page.waitForSelector('[data-testid="generated-video"]');
    await expect(page.locator('[data-testid="generated-video"]')).toBeVisible();
  });

  test('should support video-to-video generation', async ({ page }) => {
    await page.click('[data-testid="video-to-video-tab"]');

    // Upload reference video
    await page.setInputFiles('[data-testid="reference-video-input"]', 'tests/sample-video.mp4');

    await page.fill('[data-testid="video-prompt-input"]', 'Transform this video style');
    await page.click('[data-testid="generate-video-btn"]');

    await page.waitForSelector('[data-testid="generated-video"]');
    await expect(page.locator('[data-testid="generated-video"]')).toBeVisible();
  });

  test('should save generated videos', async ({ page }) => {
    await page.fill('[data-testid="video-prompt-input"]', 'A serene ocean scene');
    await page.click('[data-testid="generate-video-btn"]');

    await page.waitForSelector('[data-testid="generated-video"]');
    await page.click('[data-testid="save-video-btn"]');

    // Check if saved to library
    await page.goto('/#/library');
    await expect(page.locator('[data-testid="saved-video"]')).toBeVisible();
  });

  test('should support video preview and playback', async ({ page }) => {
    await page.fill('[data-testid="video-prompt-input"]', 'A simple animation');
    await page.click('[data-testid="generate-video-btn"]');

    await page.waitForSelector('[data-testid="generated-video"]');
    await page.click('[data-testid="play-video-btn"]');

    // Check if video is playing
    await expect(page.locator('[data-testid="video-playing"]')).toBeVisible();
  });

  test('should handle generation progress', async ({ page }) => {
    await page.fill('[data-testid="video-prompt-input"]', 'A complex scene');
    await page.click('[data-testid="generate-video-btn"]');

    // Check progress indicator
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();

    await page.waitForSelector('[data-testid="generated-video"]');
    await expect(page.locator('[data-testid="generation-complete"]')).toBeVisible();
  });

  test('should support advanced settings', async ({ page }) => {
    await page.click('[data-testid="advanced-settings-btn"]');

    await expect(page.locator('[data-testid="advanced-panel"]')).toBeVisible();

    // Test various advanced options
    await page.fill('[data-testid="seed-input"]', '12345');
    await page.fill('[data-testid="guidance-scale-input"]', '7.5');
    await page.click('[data-testid="negative-prompt-toggle"]');
    await page.fill('[data-testid="negative-prompt-input"]', 'blurry, distorted');

    await page.fill('[data-testid="video-prompt-input"]', 'A cinematic shot');
    await page.click('[data-testid="generate-video-btn"]');

    await page.waitForSelector('[data-testid="generated-video"]');
  });
});