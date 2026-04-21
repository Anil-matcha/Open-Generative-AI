import { test, expect } from '@playwright/test';

test.describe('Demo Video: Animation System', () => {
  test('should demonstrate animation library and keyframe creation', async ({ page }) => {
    await page.goto('/animation', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="animation-studio"], .animation-studio', { timeout: 10000 });

    await page.screenshot({ path: 'demo-screenshots/animation-system-initial.png' });

    // Animation library browser
    const library = page.locator('[data-testid="animation-library"]').first();
    if (await library.isVisible()) {
      await library.screenshot({ path: 'demo-screenshots/animation-library.png' });
    }

    // Keyframe creation and management
    const timeline = page.locator('[data-testid="animation-timeline"]').first();
    if (await timeline.isVisible()) {
      await timeline.click({ position: { x: 100, y: 50 } });
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/animation-keyframe-added.png' });
    }

    await expect(page.locator('[data-testid="animation-studio"]')).toBeVisible();
  });
});

test.describe('Demo Video: Multi-Camera Editing', () => {
  test('should demonstrate multi-camera editing features', async ({ page }) => {
    await page.goto('/multi-camera', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="multi-camera"], .multi-camera', { timeout: 10000 });

    await page.screenshot({ path: 'demo-screenshots/multi-camera-initial.png' });

    // PIP mode
    const pipButton = page.locator('[data-testid="pip-mode"]').first();
    if (await pipButton.isVisible()) {
      await pipButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/multi-camera-pip.png' });
    }

    // Camera angle switching
    const angleSelect = page.locator('[data-testid="camera-angle"]').first();
    if (await angleSelect.isVisible()) {
      await angleSelect.selectOption('angle-2');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/multi-camera-angle-switch.png' });
    }

    await expect(page.locator('[data-testid="multi-camera"]')).toBeVisible();
  });
});

test.describe('Demo Video: Transition System', () => {
  test('should demonstrate transition library and application', async ({ page }) => {
    await page.goto('/transitions', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="transition-studio"], .transition-studio', { timeout: 10000 });

    await page.screenshot({ path: 'demo-screenshots/transition-system-initial.png' });

    // Transition library browsing
    const library = page.locator('[data-testid="transition-library"]').first();
    if (await library.isVisible()) {
      await library.screenshot({ path: 'demo-screenshots/transition-library.png' });
    }

    // Preview functionality
    const previewBtn = page.locator('[data-testid="preview-transition"]').first();
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'demo-screenshots/transition-preview.png' });
    }

    await expect(page.locator('[data-testid="transition-studio"]')).toBeVisible();
  });
});

test.describe('Demo Video: Color Correction & Scopes', () => {
  test('should demonstrate color correction tools', async ({ page }) => {
    await page.goto('/color', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="color-studio"], .color-studio', { timeout: 10000 });

    await page.screenshot({ path: 'demo-screenshots/color-correction-initial.png' });

    // Color panel interface
    const colorPanel = page.locator('[data-testid="color-panel"]').first();
    if (await colorPanel.isVisible()) {
      await colorPanel.screenshot({ path: 'demo-screenshots/color-panel.png' });
    }

    // Brightness adjustment
    const brightness = page.locator('[data-testid="brightness-slider"]').first();
    if (await brightness.isVisible()) {
      await brightness.fill('70');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/color-brightness-adjusted.png' });
    }

    // Waveform scope
    const waveform = page.locator('[data-testid="waveform-scope"]').first();
    if (await waveform.isVisible()) {
      await waveform.screenshot({ path: 'demo-screenshots/color-waveform-scope.png' });
    }

    await expect(page.locator('[data-testid="color-studio"]')).toBeVisible();
  });
});

test.describe('Demo Video: Audio Mixing & Effects', () => {
  test('should demonstrate audio mixing capabilities', async ({ page }) => {
    await page.goto('/audio', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="audio-studio"], .audio-studio', { timeout: 10000 });

    await page.screenshot({ path: 'demo-screenshots/audio-mixing-initial.png' });

    // Audio mixer controls
    const mixer = page.locator('[data-testid="audio-mixer"]').first();
    if (await mixer.isVisible()) {
      await mixer.screenshot({ path: 'demo-screenshots/audio-mixer.png' });
    }

    // Level adjustment
    const levelSlider = page.locator('[data-testid="audio-level"]').first();
    if (await levelSlider.isVisible()) {
      await levelSlider.fill('80');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/audio-level-adjusted.png' });
    }

    // Effect application (reverb)
    const reverbBtn = page.locator('[data-testid="reverb-effect"]').first();
    if (await reverbBtn.isVisible()) {
      await reverbBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/audio-reverb-applied.png' });
    }

    await expect(page.locator('[data-testid="audio-studio"]')).toBeVisible();
  });
});