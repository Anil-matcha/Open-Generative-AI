import { test, expect } from '@playwright/test';

test.describe('Demo Video: Timeline Engine', () => {
  test('should demonstrate timeline functionality', async ({ page }) => {
    await page.goto('/timeline', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="timeline"], .timeline, #timeline', { timeout: 10000 });

    // Screenshot initial timeline state
    await page.screenshot({ path: 'demo-screenshots/timeline-initial.png' });

    // Try to find and demonstrate track rendering
    const tracks = page.locator('[data-testid="timeline-track"], .track, [class*="track"]');
    const trackCount = await tracks.count();
    console.log(`Found ${trackCount} timeline tracks`);

    if (trackCount > 0) {
      await tracks.first().screenshot({ path: 'demo-screenshots/timeline-track.png' });
    }

    // Demonstrate playhead movement
    const playhead = page.locator('[data-testid="playhead"], .playhead, [class*="playhead"]');
    if (await playhead.isVisible()) {
      // Try to drag playhead
      try {
        await playhead.dragTo(page.locator('body'), { targetPosition: { x: 200, y: 0 } });
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'demo-screenshots/timeline-playhead-moved.png' });
      } catch (error) {
        console.log('Playhead drag failed:', error.message);
      }
    }

    // Demonstrate playback controls
    const playButton = page.locator('[data-testid="play-btn"], button:has-text("Play"), [class*="play"]').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'demo-screenshots/timeline-playing.png' });

      const pauseButton = page.locator('[data-testid="pause-btn"], button:has-text("Pause"), [class*="pause"]').first();
      if (await pauseButton.isVisible()) {
        await pauseButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'demo-screenshots/timeline-paused.png' });
      }
    }

    // Demonstrate stop control
    const stopButton = page.locator('[data-testid="stop-btn"], button:has-text("Stop"), [class*="stop"]').first();
    if (await stopButton.isVisible()) {
      await stopButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/timeline-stopped.png' });
    }
  });
});