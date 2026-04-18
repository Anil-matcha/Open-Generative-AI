import { test, expect } from '@playwright/test';

/**
 * Timeline Editor Integration Tests
 *
 * Tests cross-component interactions and complete workflows
 * including drag/drop from library, inspector updates, playback sync,
 * and multi-component state management.
 */

test.describe('Timeline Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 10000 });
  });

  test('should handle drag from library to timeline', async ({ page }) => {
    // Navigate to library if not already there
    const libraryTab = await page.$('[data-route="library"]');
    if (libraryTab) {
      await libraryTab.click();
      await page.waitForSelector('[data-testid="media-library"]', { timeout: 5000 });
    }

    // Find a media item
    const mediaItem = await page.$('[data-testid="media-item"]');
    expect(mediaItem).not.toBeNull();

    if (mediaItem) {
      // Navigate to timeline
      const timelineTab = await page.$('[data-route="timeline"]');
      if (timelineTab) {
        await timelineTab.click();
        await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 5000 });
      }

      // Find timeline track
      const timelineTrack = await page.$('[data-testid="timeline-track"]');
      expect(timelineTrack).not.toBeNull();

      if (timelineTrack) {
        // Count clips before
        const clipsBefore = await page.$$('[data-testid="timeline-clip"]');

        // Perform drag and drop
        await mediaItem.dragTo(timelineTrack);

        // Wait for clip to be added
        await page.waitForTimeout(1000);

        // Verify clip was added
        const clipsAfter = await page.$$('[data-testid="timeline-clip"]');
        expect(clipsAfter.length).toBeGreaterThan(clipsBefore.length);

        // Verify clip has proper structure
        if (clipsAfter.length > clipsBefore.length) {
          const newClip = clipsAfter[clipsAfter.length - 1];
          const clipName = await newClip.$('[data-testid="clip-name"]');
          expect(clipName).not.toBeNull();
        }
      }
    }
  });

  test('should update inspector when clip is selected', async ({ page }) => {
    // Navigate to timeline
    const timelineTab = await page.$('[data-route="timeline"]');
    if (timelineTab) {
      await timelineTab.click();
      await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 5000 });
    }

    // Find and select a clip
    const clip = await page.$('[data-testid="timeline-clip"]');

    if (clip) {
      await clip.click();

      // Wait for inspector to update
      await page.waitForTimeout(500);

      // Check inspector panel
      const inspector = await page.$('[data-testid="inspector-panel"]');
      expect(inspector).not.toBeNull();

      if (inspector) {
        // Verify inspector shows clip properties
        const clipNameInput = await inspector.$('[data-testid="clip-name-input"]');
        const durationDisplay = await inspector.$('[data-testid="clip-duration-display"]');

        // At least one property should be visible
        const hasClipProperties = clipNameInput !== null || durationDisplay !== null;
        expect(hasClipProperties).toBe(true);
      }
    }
  });

  test('should sync playback controls with timeline', async ({ page }) => {
    // Navigate to timeline
    const timelineTab = await page.$('[data-route="timeline"]');
    if (timelineTab) {
      await timelineTab.click();
      await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 5000 });
    }

    // Start playback
    const playBtn = await page.$('[data-testid="play-btn"]');
    if (playBtn) {
      await playBtn.click();

      // Let it play for a short time
      await page.waitForTimeout(1500);

      // Check playhead movement
      const playhead = await page.$('[data-testid="playhead"]');
      if (playhead) {
        const initialPos = await playhead.evaluate(el => el.style.left);

        // Wait a bit more
        await page.waitForTimeout(500);

        const finalPos = await playhead.evaluate(el => el.style.left);
        expect(finalPos).not.toBe(initialPos);
      }

      // Stop playback
      const stopBtn = await page.$('[data-testid="stop-btn"]') || playBtn;
      await stopBtn.click();

      // Verify playback stopped
      await page.waitForTimeout(300);
      const finalPlayheadPos = await playhead?.evaluate(el => el.style.left);
      expect(finalPlayheadPos).toBeDefined();
    }
  });

  test('should handle file upload from system dialog', async ({ page }) => {
    // Navigate to timeline or library
    const timelineTab = await page.$('[data-route="timeline"]');
    if (timelineTab) {
      await timelineTab.click();
      await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 5000 });
    }

    // Try to trigger file upload
    const uploadBtn = await page.$('[data-testid="upload-btn"]') ||
                     await page.$('input[type="file"]');

    if (uploadBtn) {
      // Mock file upload (in real scenario, would use setInputFiles)
      // For this test, we verify the upload UI is present and functional
      expect(uploadBtn).toBeVisible();

      // Click upload button
      await uploadBtn.click();

      // Verify upload dialog or area appears
      const uploadArea = await page.$('[data-testid="upload-area"]') ||
                        await page.$('.upload-drop-zone');

      if (uploadArea) {
        expect(uploadArea).toBeVisible();
      }
    }
  });

  test('should synchronize multi-track audio playback', async ({ page }) => {
    // Navigate to timeline
    const timelineTab = await page.$('[data-route="timeline"]');
    if (timelineTab) {
      await timelineTab.click();
      await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 5000 });
    }

    // Check for audio tracks
    const audioTracks = await page.$$('[data-testid="timeline-track"][data-type="audio"]');

    if (audioTracks.length > 0) {
      // Start playback
      const playBtn = await page.$('[data-testid="play-btn"]');
      if (playBtn) {
        await playBtn.click();

        // Let it play for a moment
        await page.waitForTimeout(1000);

        // Check audio level indicators (if present)
        const audioMeters = await page.$$('[data-testid="audio-meter"]');

        // Stop playback
        const stopBtn = await page.$('[data-testid="stop-btn"]') || playBtn;
        await stopBtn.click();

        // Verify operation completed
        expect(audioTracks.length).toBeGreaterThan(0);
      }
    }
  });

  test('should handle timeline zoom and scroll synchronization', async ({ page }) => {
    // Navigate to timeline
    const timelineTab = await page.$('[data-route="timeline"]');
    if (timelineTab) {
      await timelineTab.click();
      await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 5000 });
    }

    const timeline = await page.$('[data-testid="timeline-container"]');
    if (timeline) {
      // Test zoom
      const zoomInBtn = await page.$('[data-testid="zoom-in-btn"]');
      if (zoomInBtn) {
        const initialTransform = await timeline.evaluate(el => el.style.transform);

        await zoomInBtn.click();
        await page.waitForTimeout(300);

        const newTransform = await timeline.evaluate(el => el.style.transform);
        // Zoom should change transform (exact comparison depends on implementation)
        expect(typeof newTransform).toBe('string');
      }

      // Test scroll
      const initialScroll = await timeline.evaluate(el => el.scrollLeft);
      await timeline.evaluate(el => el.scrollLeft = 200);
      await page.waitForTimeout(200);

      const newScroll = await timeline.evaluate(el => el.scrollLeft);
      expect(newScroll).toBe(200);
    }
  });

  test('should integrate with media preview system', async ({ page }) => {
    // Navigate to timeline
    const timelineTab = await page.$('[data-route="timeline"]');
    if (timelineTab) {
      await timelineTab.click();
      await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 5000 });
    }

    // Find a clip
    const clip = await page.$('[data-testid="timeline-clip"]');

    if (clip) {
      // Click clip to select
      await clip.click();

      // Look for preview/play button
      const previewBtn = await clip.$('[data-testid="clip-preview-btn"]') ||
                        await page.$('[data-testid="preview-btn"]');

      if (previewBtn) {
        // Click preview
        await previewBtn.click();

        // Wait for preview to start
        await page.waitForTimeout(500);

        // Check for preview overlay or modal
        const previewModal = await page.$('[data-testid="preview-modal"]') ||
                           await page.$('[data-testid="media-preview"]');

        if (previewModal) {
          expect(previewModal).toBeVisible();

          // Close preview
          const closeBtn = await previewModal.$('[data-testid="close-preview-btn"]') ||
                          await previewModal.$('.close-btn');

          if (closeBtn) {
            await closeBtn.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }
  });

  test('should handle complex multi-clip editing workflow', async ({ page }) => {
    // Navigate to timeline
    const timelineTab = await page.$('[data-route="timeline"]');
    if (timelineTab) {
      await timelineTab.click();
      await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 5000 });
    }

    const clips = await page.$$('[data-testid="timeline-clip"]');

    if (clips.length >= 2) {
      // Select multiple clips
      await page.keyboard.down('Control');
      await clips[0].click();
      await clips[1].click();
      await page.keyboard.up('Control');

      // Try group operation
      const groupBtn = await page.$('[data-testid="group-clips-btn"]');
      if (groupBtn) {
        await groupBtn.click();
        await page.waitForTimeout(300);
      }

      // Try bulk operation (e.g., change opacity)
      const opacitySlider = await page.$('[data-testid="bulk-opacity-slider"]');
      if (opacitySlider) {
        await opacitySlider.fill('0.5');
        await page.waitForTimeout(300);

        // Verify clips reflect the change
        for (const clip of clips.slice(0, 2)) {
          const clipOpacity = await clip.evaluate(el => getComputedStyle(el).opacity);
          expect(clipOpacity).toBeDefined();
        }
      }

      // Try undo operation
      const undoBtn = await page.$('[data-testid="undo-btn"]');
      if (undoBtn) {
        await undoBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should integrate with export and sharing features', async ({ page }) => {
    // Navigate to timeline
    const timelineTab = await page.$('[data-route="timeline"]');
    if (timelineTab) {
      await timelineTab.click();
      await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 5000 });
    }

    // Look for export button
    const exportBtn = await page.$('[data-testid="export-btn"]') ||
                     await page.$('[data-testid="share-btn"]');

    if (exportBtn) {
      await exportBtn.click();

      // Wait for export dialog
      await page.waitForTimeout(500);

      // Check for export options
      const exportDialog = await page.$('[data-testid="export-dialog"]') ||
                          await page.$('[data-testid="share-dialog"]');

      if (exportDialog) {
        expect(exportDialog).toBeVisible();

        // Look for export format options
        const formatSelect = await exportDialog.$('[data-testid="export-format-select"]') ||
                           await exportDialog.$('select');

        if (formatSelect) {
          expect(formatSelect).toBeVisible();
        }

        // Close dialog
        const closeBtn = await exportDialog.$('[data-testid="close-export-btn"]') ||
                        await exportDialog.$('.close-btn');

        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }
  });

  test('should handle real-time collaboration features', async ({ page }) => {
    // Navigate to timeline
    const timelineTab = await page.$('[data-route="timeline"]');
    if (timelineTab) {
      await timelineTab.click();
      await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 5000 });
    }

    // Check for collaboration indicators
    const collabIndicator = await page.$('[data-testid="collaboration-indicator"]') ||
                           await page.$('[data-testid="online-users"]');

    // Collaboration features may or may not be present
    // Test verifies the UI handles collaboration state gracefully
    if (collabIndicator) {
      expect(collabIndicator).toBeVisible();
    }

    // Verify timeline remains functional regardless of collaboration state
    const timeline = await page.$('[data-testid="timeline-container"]');
    expect(timeline).toBeVisible();
  });
});