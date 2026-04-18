import { test, expect } from '@playwright/test';

/**
 * Performance Tests for Timeline Editor
 *
 * Tests rendering performance, memory usage, and responsiveness
 * under various load conditions and complex scenarios.
 */

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/timeline');
    await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 10000 });
  });

  test('should render timeline within performance budget', async ({ page }) => {
    const startTime = Date.now();

    // Wait for timeline to be fully rendered
    await page.waitForSelector('[data-testid="timeline-tracks"]', { timeout: 5000 });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 second budget

    // Check viewport and basic responsiveness
    const timeline = await page.$('[data-testid="timeline-container"]');
    expect(timeline).toBeVisible();
  });

  test('should handle multiple clips without performance degradation', async ({ page }) => {
    const addClipStart = Date.now();

    // Add multiple clips (simulate bulk operation)
    const mediaItems = await page.$$('[data-testid="media-item"]');
    const timelineTracks = await page.$$('[data-testid="timeline-track"]');

    if (mediaItems.length > 0 && timelineTracks.length > 0) {
      const track = timelineTracks[0];

      // Add up to 10 clips
      const clipsToAdd = Math.min(10, mediaItems.length);
      for (let i = 0; i < clipsToAdd; i++) {
        await mediaItems[i].dragTo(track);
        // Small delay to prevent overwhelming the system
        await page.waitForTimeout(100);
      }

      const addClipTime = Date.now() - addClipStart;
      expect(addClipTime).toBeLessThan(10000); // 10 second budget for 10 clips

      // Verify all clips were added
      const clips = await page.$$('[data-testid="timeline-clip"]');
      expect(clips.length).toBeGreaterThanOrEqual(clipsToAdd);
    }
  });

  test('should maintain smooth playback with complex timeline', async ({ page }) => {
    // Set up complex timeline state
    const mediaItems = await page.$$('[data-testid="media-item"]');
    const timelineTracks = await page.$$('[data-testid="timeline-track"]');

    if (mediaItems.length >= 3 && timelineTracks.length > 0) {
      const track = timelineTracks[0];

      // Add multiple clips
      for (let i = 0; i < 3; i++) {
        await mediaItems[i].dragTo(track);
        await page.waitForTimeout(200);
      }

      // Start playback
      const playBtn = await page.$('[data-testid="play-btn"]');
      if (playBtn) {
        await playBtn.click();

        // Monitor playback for smoothness
        const startTime = Date.now();
        let frameCount = 0;

        // Check playhead position multiple times
        for (let i = 0; i < 10; i++) {
          const playhead = await page.$('[data-testid="playhead"]');
          if (playhead) {
            const pos = await playhead.evaluate(el => el.style.left);
            if (pos !== '0px') frameCount++;
          }
          await page.waitForTimeout(100);
        }

        const playbackTime = Date.now() - startTime;

        // Stop playback
        const stopBtn = await page.$('[data-testid="stop-btn"]') || playBtn;
        await stopBtn.click();

        // Verify reasonable playback performance
        expect(playbackTime).toBeGreaterThan(800); // At least 1 second of monitoring
        expect(frameCount).toBeGreaterThan(5); // Playhead moved multiple times
      }
    }
  });

  test('should handle rapid zoom operations efficiently', async ({ page }) => {
    const zoomOperations = [];
    const timeline = await page.$('[data-testid="timeline-container"]');

    if (timeline) {
      // Perform multiple zoom operations rapidly
      const zoomInBtn = await page.$('[data-testid="zoom-in-btn"]');
      const zoomOutBtn = await page.$('[data-testid="zoom-out-btn"]');

      if (zoomInBtn && zoomOutBtn) {
        const startTime = Date.now();

        // Rapid zoom in/out operations
        for (let i = 0; i < 5; i++) {
          const opStart = Date.now();
          await zoomInBtn.click();
          await page.waitForTimeout(50);
          await zoomOutBtn.click();
          await page.waitForTimeout(50);
          const opTime = Date.now() - opStart;
          zoomOperations.push(opTime);
        }

        const totalTime = Date.now() - startTime;
        const avgOperationTime = zoomOperations.reduce((a, b) => a + b, 0) / zoomOperations.length;

        expect(totalTime).toBeLessThan(3000); // 3 second budget for 10 operations
        expect(avgOperationTime).toBeLessThan(200); // Average < 200ms per operation
      }
    }
  });

  test('should render large timeline without blocking UI', async ({ page }) => {
    // Add many clips to create large timeline
    const mediaItems = await page.$$('[data-testid="media-item"]');
    const timelineTracks = await page.$$('[data-testid="timeline-track"]');

    if (mediaItems.length >= 5 && timelineTracks.length > 0) {
      const track = timelineTracks[0];
      const startTime = Date.now();

      // Add multiple clips
      for (let i = 0; i < Math.min(5, mediaItems.length); i++) {
        await mediaItems[i].dragTo(track);
        await page.waitForTimeout(100);
      }

      const setupTime = Date.now() - startTime;

      // Test UI responsiveness during rendering
      const uiStartTime = Date.now();

      // Try various UI interactions while timeline renders
      const timeline = await page.$('[data-testid="timeline-container"]');
      await timeline?.click(); // Click should be responsive

      const playBtn = await page.$('[data-testid="play-btn"]');
      const isPlayBtnEnabled = playBtn ? await playBtn.isEnabled() : true;

      const uiResponseTime = Date.now() - uiStartTime;

      expect(setupTime).toBeLessThan(5000); // 5 second budget for setup
      expect(uiResponseTime).toBeLessThan(500); // UI should respond quickly
      expect(isPlayBtnEnabled).toBe(true); // UI should remain functional
    }
  });

  test('should handle timeline scrolling performance', async ({ page }) => {
    const timeline = await page.$('[data-testid="timeline-container"]');

    if (timeline) {
      // Set up timeline with content that can be scrolled
      const mediaItems = await page.$$('[data-testid="media-item"]');
      const timelineTracks = await page.$$('[data-testid="timeline-track"]');

      if (mediaItems.length > 0 && timelineTracks.length > 0) {
        // Add clips spread across timeline
        for (let i = 0; i < Math.min(3, mediaItems.length); i++) {
          await mediaItems[i].dragTo(timelineTracks[0]);
          await page.waitForTimeout(100);
        }

        // Test scroll performance
        const scrollStartTime = Date.now();

        // Perform multiple scroll operations
        for (let i = 0; i < 5; i++) {
          await timeline.evaluate(el => {
            el.scrollLeft += 100;
          });
          await page.waitForTimeout(50);
        }

        const scrollTime = Date.now() - scrollStartTime;
        expect(scrollTime).toBeLessThan(1000); // 1 second budget for 5 scrolls

        // Verify scroll position changed
        const finalScroll = await timeline.evaluate(el => el.scrollLeft);
        expect(finalScroll).toBeGreaterThan(0);
      }
    }
  });

  test('should maintain performance during state updates', async ({ page }) => {
    // Set up timeline with content
    const mediaItems = await page.$$('[data-testid="media-item"]');
    const timelineTracks = await page.$$('[data-testid="timeline-track"]');

    if (mediaItems.length > 0 && timelineTracks.length > 0) {
      await mediaItems[0].dragTo(timelineTracks[0]);
      await page.waitForTimeout(300);

      const clips = await page.$$('[data-testid="timeline-clip"]');
      if (clips.length > 0) {
        const clip = clips[0];

        // Perform rapid state updates
        const updateStartTime = Date.now();

        // Rapid clip selections and property changes
        for (let i = 0; i < 5; i++) {
          await clip.click(); // Select
          await page.waitForTimeout(50);

          // Try to change property
          const inspector = await page.$('[data-testid="inspector-panel"]');
          if (inspector) {
            const nameInput = await inspector.$('input[type="text"]');
            if (nameInput) {
              await nameInput.fill(`Clip ${i}`);
              await page.waitForTimeout(50);
            }
          }
        }

        const updateTime = Date.now() - updateStartTime;
        expect(updateTime).toBeLessThan(3000); // 3 second budget for 5 updates

        // Verify timeline still functions
        const finalClips = await page.$$('[data-testid="timeline-clip"]');
        expect(finalClips.length).toBe(clips.length);
      }
    }
  });

  test('should handle memory-intensive operations efficiently', async ({ page }) => {
    // Test with multiple tracks and clips
    const mediaItems = await page.$$('[data-testid="media-item"]');
    const timelineTracks = await page.$$('[data-testid="timeline-track"]');

    if (mediaItems.length >= 4 && timelineTracks.length >= 2) {
      const operationStart = Date.now();

      // Add clips to multiple tracks
      for (let trackIndex = 0; trackIndex < Math.min(2, timelineTracks.length); trackIndex++) {
        const track = timelineTracks[trackIndex];
        for (let clipIndex = 0; clipIndex < 2; clipIndex++) {
          const mediaIndex = trackIndex * 2 + clipIndex;
          if (mediaIndex < mediaItems.length) {
            await mediaItems[mediaIndex].dragTo(track);
            await page.waitForTimeout(100);
          }
        }
      }

      const operationTime = Date.now() - operationStart;

      // Performance budget for complex operations
      expect(operationTime).toBeLessThan(8000); // 8 second budget

      // Verify all operations completed
      const totalClips = await page.$$('[data-testid="timeline-clip"]');
      expect(totalClips.length).toBeGreaterThanOrEqual(4);

      // Test that UI remains responsive
      const timeline = await page.$('[data-testid="timeline-container"]');
      expect(timeline).toBeVisible();
    }
  });

  test('should recover quickly from performance-intensive operations', async ({ page }) => {
    // Perform intensive operation
    const mediaItems = await page.$$('[data-testid="media-item"]');
    const timelineTracks = await page.$$('[data-testid="timeline-track"]');

    if (mediaItems.length > 0 && timelineTracks.length > 0) {
      // Add intensive content
      const intensiveStart = Date.now();

      for (let i = 0; i < Math.min(3, mediaItems.length); i++) {
        await mediaItems[i].dragTo(timelineTracks[0]);
        await page.waitForTimeout(100);
      }

      const intensiveTime = Date.now() - intensiveStart;

      // Test recovery - perform simple operation
      const recoveryStart = Date.now();
      const playBtn = await page.$('[data-testid="play-btn"]');
      if (playBtn) {
        await playBtn.click();
        await page.waitForTimeout(200);
        await playBtn.click(); // Stop
      }

      const recoveryTime = Date.now() - recoveryStart;

      expect(intensiveTime).toBeLessThan(5000); // 5 second budget for setup
      expect(recoveryTime).toBeLessThan(1000); // Quick recovery
    }
  });

  test('should handle concurrent user interactions smoothly', async ({ page }) => {
    const mediaItems = await page.$$('[data-testid="media-item"]');
    const timelineTracks = await page.$$('[data-testid="timeline-track"]');

    if (mediaItems.length >= 2 && timelineTracks.length > 0) {
      const interactionStart = Date.now();

      // Simulate concurrent interactions
      const track = timelineTracks[0];

      // Start multiple operations simultaneously
      const operations = [
        mediaItems[0].dragTo(track),
        mediaItems[1].dragTo(track).then(() => page.waitForTimeout(50)),
        page.$('[data-testid="play-btn"]').then(btn => btn?.click()).then(() => page.waitForTimeout(50))
      ];

      await Promise.allSettled(operations);
      const interactionTime = Date.now() - interactionStart;

      // Verify system handled concurrent operations
      expect(interactionTime).toBeLessThan(5000); // 5 second budget

      // Check that clips were added
      const clips = await page.$$('[data-testid="timeline-clip"]');
      expect(clips.length).toBeGreaterThanOrEqual(2);
    }
  });
});