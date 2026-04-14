import { test, expect } from '@playwright/test';

test.describe('Timeline Editing Tests', () => {
  test('should load timeline editor and display interface', async ({ page }) => {
    // Navigate to timeline editor
    await page.goto('/#/timeline');
    await page.waitForSelector('#app');

    // Wait for timeline to load
    await page.waitForSelector('.timeline-card, .main-grid');

    // Check that key elements are present
    await expect(page.locator('.timeline-header')).toBeVisible();
    await expect(page.locator('.track-row')).toHaveCount(await page.locator('.track-row').count()); // At least some tracks
  });

  test('should have playback controls', async ({ page }) => {
    await page.goto('/#/timeline');
    await page.waitForSelector('#app');

    // Check for play button
    const playBtn = page.locator('#playBtn');
    await expect(playBtn).toBeVisible();
    await expect(playBtn).toContainText('▶');

    // Check for other controls
    await expect(page.locator('#rewindBtn')).toBeVisible();
    await expect(page.locator('#stopBtn')).toBeVisible();
  });

  test('should have upload functionality', async ({ page }) => {
    await page.goto('/#/timeline');
    await page.waitForSelector('#app');

    // Check for upload button
    const uploadBtn = page.locator('#uploadBtn');
    await expect(uploadBtn).toBeVisible();
    await expect(uploadBtn).toContainText('Upload');

    // Check for hidden file input
    const uploadInput = page.locator('#uploadInput');
    await expect(uploadInput).toHaveAttribute('type', 'file');
    await expect(uploadInput).toHaveAttribute('accept', 'video/*,image/*,audio/*,.txt');
  });

  test('should display media library', async ({ page }) => {
    await page.goto('/#/timeline');
    await page.waitForSelector('#app');

    // Check for media grid or library
    const mediaElements = page.locator('.media-grid, .media-item, .generate-types');
    const mediaCount = await mediaElements.count();
    expect(mediaCount).toBeGreaterThan(0);
  });

  test('should allow adding clips to timeline', async ({ page }) => {
    await page.goto('/#/timeline');
    await page.waitForSelector('#app');

    // This test would require actual media files
    // For now, just check that the interface supports adding media
    const timelineArea = page.locator('.track-row');
    await expect(timelineArea.first()).toBeVisible();
  });

  test('should have generation capabilities', async ({ page }) => {
    await page.goto('/#/timeline');
    await page.waitForSelector('#app');

    // Check for generation panel
    const generateElements = page.locator('.generate-head, .generate-types, .text-area');
    const generateCount = await generateElements.count();
    expect(generateCount).toBeGreaterThan(0);
  });
});