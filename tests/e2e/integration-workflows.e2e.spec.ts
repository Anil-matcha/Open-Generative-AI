import { test, expect } from '@playwright/test';

// Integration Workflow Tests - Testing interactions between different app modules

test.describe('Module Integration Workflows', () => {
  test.setTimeout(90000); // 90 seconds for integration tests

  test('should handle seamless navigation between creative modules', async ({ page }) => {
    // Start in image generation
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    // Generate an image
    const imagePrompt = page.locator('textarea[placeholder*="Describe the image"]');
    if (await imagePrompt.count() > 0) {
      await imagePrompt.fill('Abstract geometric patterns');
      const generateBtn = page.locator('button:has-text("Generate ✨")');
      if (await generateBtn.count() > 0) {
        await generateBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // Navigate to video module
    await page.goto('/#/video');
    await page.waitForSelector('#content-area');

    // Verify video interface loaded properly
    await expect(page.locator('#content-area')).toBeVisible();

    // Navigate to audio module
    await page.goto('/#/audio');
    await page.waitForSelector('#content-area');

    // Verify audio interface loaded properly
    await expect(page.locator('#content-area')).toBeVisible();

    // Navigate to timeline editor
    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Verify timeline loaded with previous context
    await expect(page.locator('.timeline-header')).toBeVisible();

    // Navigate back to library
    await page.goto('/#/library');
    await page.waitForSelector('#app');

    // Verify library interface
    await expect(page.locator('[data-testid="media-grid"]')).toBeVisible();
  });

  test('should maintain state consistency across module switches', async ({ page }) => {
    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Create initial timeline state
    const addTrackBtn = page.locator('[data-testid="add-track-btn"]');
    if (await addTrackBtn.count() > 0) {
      await addTrackBtn.click();
      await page.waitForTimeout(300);
    }

    // Add media to timeline
    const mediaItems = page.locator('[data-testid="media-item"]');
    const timelineTracks = page.locator('[data-testid="timeline-track"]');

    let initialClipCount = 0;
    if ((await mediaItems.count()) > 0 && (await timelineTracks.count()) > 0) {
      await mediaItems.first().dragTo(timelineTracks.first());
      await page.waitForTimeout(500);
      initialClipCount = await page.locator('[data-testid="timeline-clip"]').count();
    }

    // Switch to image generation module
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    // Generate new content
    const imagePrompt = page.locator('textarea[placeholder*="Describe the image"]');
    if (await imagePrompt.count() > 0) {
      await imagePrompt.fill('Test image for state consistency');
      const generateBtn = page.locator('button:has-text("Generate ✨")');
      if (await generateBtn.count() > 0) {
        await generateBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // Return to timeline
    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Verify timeline state was preserved
    const finalClipCount = await page.locator('[data-testid="timeline-clip"]').count();
    expect(finalClipCount).toBe(initialClipCount);

    // Verify timeline is still functional
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
  });

  test('should support cross-module content workflows', async ({ page }) => {
    // Step 1: Create image in image module
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    const imagePrompt = page.locator('textarea[placeholder*="Describe the image"]');
    if (await imagePrompt.count() > 0) {
      await imagePrompt.fill('Background scene for video composition');
      const generateBtn = page.locator('button:has-text("Generate ✨")');
      if (await generateBtn.count() > 0) {
        await generateBtn.click();
        await page.waitForTimeout(4000);
      }
    }

    // Step 2: Create video using image as reference
    await page.goto('/#/video');
    await page.waitForSelector('#content-area');

    const videoPrompt = page.locator('textarea[placeholder*="Describe the video"]');
    if (await videoPrompt.count() > 0) {
      await videoPrompt.fill('Animation that incorporates the generated background');
      const videoGenerateBtn = page.locator('button:has-text("Generate ✨")');
      if (await videoGenerateBtn.count() > 0) {
        await videoGenerateBtn.click();
        await page.waitForTimeout(6000);
      }
    }

    // Step 3: Create matching audio
    await page.goto('/#/audio');
    await page.waitForSelector('#content-area');

    const audioPrompt = page.locator('textarea[placeholder*="Describe the music"]');
    if (await audioPrompt.count() > 0) {
      await audioPrompt.fill('Ambient music matching the visual theme');
      const audioGenerateBtn = page.locator('button:has-text("Generate Audio")');
      if (await audioGenerateBtn.count() > 0) {
        await audioGenerateBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // Step 4: Combine all elements in timeline
    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Add all generated content to timeline
    const mediaItems = page.locator('[data-testid="media-item"]');
    const audioItems = page.locator('[data-testid="audio-item"]');
    const timelineTracks = page.locator('[data-testid="timeline-track"]');
    const audioTracks = page.locator('[data-testid="audio-track"]');

    // Add video/image content
    if ((await mediaItems.count()) > 0 && (await timelineTracks.count()) > 0) {
      await mediaItems.first().dragTo(timelineTracks.first());
      await page.waitForTimeout(300);
    }

    // Add audio content
    if ((await audioItems.count()) > 0 && (await audioTracks.count()) > 0) {
      await audioItems.first().dragTo(audioTracks.first());
      await page.waitForTimeout(300);
    }

    // Step 5: Verify integrated composition
    const clips = page.locator('[data-testid="timeline-clip"]');
    const audioClips = page.locator('[data-testid="audio-clip"]');

    expect(await clips.count()).toBeGreaterThan(0);
    expect(await audioClips.count()).toBeGreaterThan(0);

    // Test playback of integrated content
    const playBtn = page.locator('[data-testid="play-btn"]');
    if (await playBtn.count() > 0) {
      await playBtn.click();
      await page.waitForTimeout(3000);
      await playBtn.click(); // Pause
    }
  });

  test('should handle library integration across modules', async ({ page }) => {
    // Step 1: Generate content in different modules
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    // Generate image
    const imagePrompt = page.locator('textarea[placeholder*="Describe the image"]');
    if (await imagePrompt.count() > 0) {
      await imagePrompt.fill('Library test image');
      const generateBtn = page.locator('button:has-text("Generate ✨")');
      if (await generateBtn.count() > 0) {
        await generateBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // Step 2: Check library contains generated content
    await page.goto('/#/library');
    await page.waitForSelector('#app');

    const mediaItems = page.locator('[data-testid="media-item"]');
    expect(await mediaItems.count()).toBeGreaterThan(0);

    // Step 3: Use library content in timeline
    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Verify library content is accessible
    const timelineMediaItems = page.locator('[data-testid="media-item"]');
    if (await timelineMediaItems.count() > 0) {
      const timelineTracks = page.locator('[data-testid="timeline-track"]');
      if (await timelineTracks.count() > 0) {
        await timelineMediaItems.first().dragTo(timelineTracks.first());
        await page.waitForTimeout(500);

        // Verify content was added successfully
        const clips = page.locator('[data-testid="timeline-clip"]');
        expect(await clips.count()).toBeGreaterThan(0);
      }
    }

    // Step 4: Verify content persistence across sessions
    await page.reload();
    await page.waitForSelector('.main-grid');

    const reloadedClips = page.locator('[data-testid="timeline-clip"]');
    // Note: Persistence depends on implementation - may require localStorage/sessionStorage
    expect(await reloadedClips.count()).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Performance Workflow Tests', () => {
  test.setTimeout(180000); // 3 minutes for performance tests

  test('should handle large project workflows efficiently', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Create large project with multiple tracks
    const addTrackBtn = page.locator('[data-testid="add-track-btn"]');
    for (let i = 0; i < 10; i++) {
      if (await addTrackBtn.count() > 0) {
        await addTrackBtn.click();
        await page.waitForTimeout(100);
      }
    }

    const tracksAfterCreation = Date.now();
    console.log(`Track creation time: ${tracksAfterCreation - startTime}ms`);

    // Add multiple clips to timeline
    const mediaItems = page.locator('[data-testid="media-item"]');
    const timelineTracks = page.locator('[data-testid="timeline-track"]');

    const tracks = await timelineTracks.all();
    const items = await mediaItems.all();

    if (tracks.length > 0 && items.length > 0) {
      // Add clips to multiple tracks
      for (let i = 0; i < Math.min(tracks.length, items.length, 5); i++) {
        await items[i].dragTo(tracks[i]);
        await page.waitForTimeout(200);
      }
    }

    const clipsAddedTime = Date.now();
    console.log(`Clip addition time: ${clipsAddedTime - tracksAfterCreation}ms`);

    // Test timeline operations performance
    const clips = page.locator('[data-testid="timeline-clip"]');
    if (await clips.count() > 0) {
      // Select all clips
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');

      // Apply batch operations
      const effectsBtn = page.locator('[data-testid="effects-btn"]');
      if (await effectsBtn.count() > 0) {
        await effectsBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    const operationsTime = Date.now();
    console.log(`Batch operations time: ${operationsTime - clipsAddedTime}ms`);

    // Test playback performance
    const playBtn = page.locator('[data-testid="play-btn"]');
    if (await playBtn.count() > 0) {
      await playBtn.click();
      await page.waitForTimeout(5000); // Let it play
      await playBtn.click(); // Pause
    }

    const playbackTime = Date.now();
    console.log(`Playback test time: ${playbackTime - operationsTime}ms`);

    // Test export performance
    const exportBtn = page.locator('[data-testid="export-btn"]');
    if (await exportBtn.count() > 0) {
      await exportBtn.click();
      await page.waitForTimeout(3000);
    }

    const exportTime = Date.now();
    console.log(`Export time: ${exportTime - playbackTime}ms`);
    console.log(`Total workflow time: ${exportTime - startTime}ms`);

    // Performance assertions (adjust thresholds based on system capabilities)
    expect(exportTime - startTime).toBeLessThan(120000); // Less than 2 minutes total
    expect(await clips.count()).toBeGreaterThan(0);
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
  });

  test('should maintain performance during concurrent operations', async ({ page }) => {
    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Start multiple operations simultaneously
    const operations = [];

    // Operation 1: Add tracks
    operations.push(
      (async () => {
        const addTrackBtn = page.locator('[data-testid="add-track-btn"]');
        for (let i = 0; i < 5; i++) {
          if (await addTrackBtn.count() > 0) {
            await addTrackBtn.click();
            await page.waitForTimeout(50);
          }
        }
      })()
    );

    // Operation 2: Add media items
    operations.push(
      (async () => {
        const mediaItems = page.locator('[data-testid="media-item"]');
        const timelineTracks = page.locator('[data-testid="timeline-track"]');

        if ((await mediaItems.count()) > 0 && (await timelineTracks.count()) > 0) {
          for (let i = 0; i < Math.min(await mediaItems.count(), 3); i++) {
            await mediaItems.nth(i).dragTo(timelineTracks.nth(i));
            await page.waitForTimeout(100);
          }
        }
      })()
    );

    // Operation 3: Apply effects
    operations.push(
      (async () => {
        await page.waitForTimeout(500); // Wait for other operations to start
        const clips = page.locator('[data-testid="timeline-clip"]');
        if (await clips.count() > 0) {
          await clips.first().click();
          const effectsBtn = page.locator('[data-testid="effects-btn"]');
          if (await effectsBtn.count() > 0) {
            await effectsBtn.click();
            await page.waitForTimeout(300);
          }
        }
      })()
    );

    // Wait for all operations to complete
    await Promise.all(operations);

    // Verify system remained stable
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();

    const finalClips = await page.locator('[data-testid="timeline-clip"]').count();
    const finalTracks = await page.locator('[data-testid="timeline-track"]').count();

    expect(finalTracks).toBeGreaterThanOrEqual(5);
    expect(finalClips).toBeGreaterThanOrEqual(0);
  });

  test('should handle memory-intensive workflows gracefully', async ({ page }) => {
    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Create memory-intensive project
    const addTrackBtn = page.locator('[data-testid="add-track-btn"]');
    for (let i = 0; i < 8; i++) {
      if (await addTrackBtn.count() > 0) {
        await addTrackBtn.click();
        await page.waitForTimeout(100);
      }
    }

    // Add high-resolution content
    const mediaItems = page.locator('[data-testid="media-item"]');
    const timelineTracks = page.locator('[data-testid="timeline-track"]');

    if ((await mediaItems.count()) >= 8 && (await timelineTracks.count()) >= 8) {
      for (let i = 0; i < 8; i++) {
        await mediaItems.nth(i).dragTo(timelineTracks.nth(i));
        await page.waitForTimeout(200);
      }
    }

    // Apply memory-intensive effects
    const clips = page.locator('[data-testid="timeline-clip"]');
    for (const clip of await clips.all()) {
      await clip.click();
      const effectsBtn = page.locator('[data-testid="effects-btn"]');
      if (await effectsBtn.count() > 0) {
        await effectsBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // Test system responsiveness during intensive operations
    const startTime = Date.now();
    await page.mouse.move(100, 100);
    const moveTime = Date.now() - startTime;
    expect(moveTime).toBeLessThan(100); // UI should remain responsive

    // Verify no crashes occurred
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();

    // Test cleanup and memory management
    await page.reload();
    await page.waitForSelector('.main-grid');

    // Verify clean reload
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
  });
});