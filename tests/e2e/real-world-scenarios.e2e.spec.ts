import { test, expect } from '@playwright/test';

// Real-World Usage Scenario Tests

test.describe('Real-World Content Creation Scenarios', () => {
  test.setTimeout(120000);

  test('should create a professional product demo video', async ({ page }) => {
    // Scenario: Marketing team creating a product demo video

    // Step 1: Generate hero image for thumbnail
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    const imagePrompt = page.locator('textarea[placeholder*="Describe the image"]');
    if (await imagePrompt.count() > 0) {
      await imagePrompt.fill('Professional product shot with clean background, modern design, high quality');
      const generateBtn = page.locator('button:has-text("Generate ✨")');
      if (await generateBtn.count() > 0) {
        await generateBtn.click();
        await page.waitForTimeout(5000);
      }
    }

    // Step 2: Create product demo video
    await page.goto('/#/video');
    await page.waitForSelector('#content-area');

    const videoPrompt = page.locator('textarea[placeholder*="Describe the video"]');
    if (await videoPrompt.count() > 0) {
      await videoPrompt.fill('Smooth product demonstration video showing features, professional lighting, cinematic camera movement');
      const videoGenerateBtn = page.locator('button:has-text("Generate ✨")');
      if (await videoGenerateBtn.count() > 0) {
        await videoGenerateBtn.click();
        await page.waitForTimeout(8000);
      }
    }

    // Step 3: Generate professional voiceover script and audio
    await page.goto('/#/audio');
    await page.waitForSelector('#content-area');

    const audioPrompt = page.locator('textarea[placeholder*="Describe the music"]');
    if (await audioPrompt.count() > 0) {
      await audioPrompt.fill('Professional corporate background music, motivational and modern, suitable for product demo');
      const audioGenerateBtn = page.locator('button:has-text("Generate Audio")');
      if (await audioGenerateBtn.count() > 0) {
        await audioGenerateBtn.click();
        await page.waitForTimeout(4000);
      }
    }

    // Step 4: Edit in timeline for professional finish
    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Set up professional timeline structure
    const addTrackBtn = page.locator('[data-testid="add-track-btn"]');
    for (let i = 0; i < 2; i++) {
      if (await addTrackBtn.count() > 0) {
        await addTrackBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // Add all content to timeline
    const mediaItems = page.locator('[data-testid="media-item"]');
    const audioItems = page.locator('[data-testid="audio-item"]');
    const timelineTracks = page.locator('[data-testid="timeline-track"]');
    const audioTracks = page.locator('[data-testid="audio-track"]');

    // Add video content
    if ((await mediaItems.count()) > 0 && (await timelineTracks.count()) > 0) {
      await mediaItems.first().dragTo(timelineTracks.first());
      await page.waitForTimeout(300);
    }

    // Add audio content
    if ((await audioItems.count()) > 0 && (await audioTracks.count()) > 0) {
      await audioItems.first().dragTo(audioTracks.first());
      await page.waitForTimeout(300);
    }

    // Step 5: Apply professional editing techniques
    const clips = page.locator('[data-testid="timeline-clip"]');
    if (await clips.count() > 0) {
      await clips.first().click();

      // Add professional transitions
      const transitionBtn = page.locator('[data-testid="apply-transition-btn"]');
      if (await transitionBtn.count() > 0) {
        await transitionBtn.click();
        await page.waitForTimeout(500);
      }

      // Apply color correction for professional look
      const colorBtn = page.locator('[data-testid="color-correct-btn"]');
      if (await colorBtn.count() > 0) {
        await colorBtn.click();
        await page.waitForTimeout(500);
      }

      // Add professional text overlays
      const textBtn = page.locator('[data-testid="add-text-btn"]');
      if (await textBtn.count() > 0) {
        await textBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Step 6: Audio mixing for professional sound
    const audioMixerBtn = page.locator('[data-testid="audio-mixer-btn"]');
    if (await audioMixerBtn.count() > 0) {
      await audioMixerBtn.click();
      await page.waitForTimeout(500);
    }

    // Step 7: Final export for multiple platforms
    const exportBtn = page.locator('[data-testid="export-btn"]');
    if (await exportBtn.count() > 0) {
      await exportBtn.click();
      await page.waitForTimeout(3000);
    }

    // Verify professional workflow completion
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
  });

  test('should create social media content series', async ({ page }) => {
    // Scenario: Social media manager creating a content series

    const contentPieces = [
      'Engaging hook image for social media',
      'Educational infographic style',
      'Call-to-action focused design',
      'Behind-the-scenes content'
    ];

    // Step 1: Generate multiple images for content series
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    for (const prompt of contentPieces) {
      const imagePrompt = page.locator('textarea[placeholder*="Describe the image"]');
      if (await imagePrompt.count() > 0) {
        await imagePrompt.fill(prompt);
        const generateBtn = page.locator('button:has-text("Generate ✨")');
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          await page.waitForTimeout(4000);
        }
      }
    }

    // Step 2: Create video content for series
    await page.goto('/#/video');
    await page.waitForSelector('#content-area');

    const videoPrompts = [
      'Short engaging video for social media algorithm',
      'Quick tip video with text overlays',
      'Storytelling video for brand narrative'
    ];

    for (const prompt of videoPrompts) {
      const videoPrompt = page.locator('textarea[placeholder*="Describe the video"]');
      if (await videoPrompt.count() > 0) {
        await videoPrompt.fill(prompt);
        const videoGenerateBtn = page.locator('button:has-text("Generate ✨")');
        if (await videoGenerateBtn.count() > 0) {
          await videoGenerateBtn.click();
          await page.waitForTimeout(6000);
        }
      }
    }

    // Step 3: Create themed music for the series
    await page.goto('/#/audio');
    await page.waitForSelector('#content-area');

    const audioPrompt = page.locator('textarea[placeholder*="Describe the music"]');
    if (await audioPrompt.count() > 0) {
      await audioPrompt.fill('Upbeat, modern music suitable for social media content series, energetic and engaging');
      const audioGenerateBtn = page.locator('button:has-text("Generate Audio")');
      if (await audioGenerateBtn.count() > 0) {
        await audioGenerateBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // Step 4: Batch edit content for social media optimization
    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Create multiple timeline projects for different platforms
    const platformConfigs = ['instagram', 'tiktok', 'youtube', 'linkedin'];

    for (const platform of platformConfigs) {
      // Add content optimized for each platform
      const mediaItems = page.locator('[data-testid="media-item"]');
      const timelineTracks = page.locator('[data-testid="timeline-track"]');

      if ((await mediaItems.count()) > 0 && (await timelineTracks.count()) > 0) {
        await mediaItems.first().dragTo(timelineTracks.first());
        await page.waitForTimeout(300);
      }

      // Apply platform-specific optimizations
      const clips = page.locator('[data-testid="timeline-clip"]');
      if (await clips.count() > 0) {
        await clips.first().click();

        // Add platform-specific text and branding
        const textBtn = page.locator('[data-testid="add-text-btn"]');
        if (await textBtn.count() > 0) {
          await textBtn.click();
          await page.waitForTimeout(200);
        }

        // Apply platform-optimized effects
        const effectsBtn = page.locator('[data-testid="effects-btn"]');
        if (await effectsBtn.count() > 0) {
          await effectsBtn.click();
          await page.waitForTimeout(300);
        }
      }

      // Export for specific platform
      const exportBtn = page.locator(`[data-testid="export-${platform}-btn"], [data-testid="export-btn"]`);
      if (await exportBtn.count() > 0) {
        await exportBtn.click();
        await page.waitForTimeout(2000);
      }

      // Clear timeline for next platform
      await page.reload();
      await page.waitForSelector('.main-grid');
    }

    // Verify social media series workflow completion
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
  });

  test('should handle educational content creation workflow', async ({ page }) => {
    // Scenario: Educator creating course content

    // Step 1: Create visual aids and diagrams
    await page.goto('/#/image');
    await page.waitForSelector('#content-area');

    const educationalImages = [
      'Clear diagram explaining complex concept',
      'Step-by-step process visualization',
      'Educational infographic with data',
      'Concept illustration for teaching'
    ];

    for (const prompt of educationalImages) {
      const imagePrompt = page.locator('textarea[placeholder*="Describe the image"]');
      if (await imagePrompt.count() > 0) {
        await imagePrompt.fill(prompt);
        const generateBtn = page.locator('button:has-text("Generate ✨")');
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          await page.waitForTimeout(4000);
        }
      }
    }

    // Step 2: Create explanatory videos
    await page.goto('/#/video');
    await page.waitForSelector('#content-area');

    const videoPrompts = [
      'Slow-paced explanatory video with clear narration',
      'Step-by-step tutorial with visual demonstrations',
      'Concept explanation with animations and graphics'
    ];

    for (const prompt of videoPrompts) {
      const videoPrompt = page.locator('textarea[placeholder*="Describe the video"]');
      if (await videoPrompt.count() > 0) {
        await videoPrompt.fill(prompt);
        const videoGenerateBtn = page.locator('button:has-text("Generate ✨")');
        if (await videoGenerateBtn.count() > 0) {
          await videoGenerateBtn.click();
          await page.waitForTimeout(7000);
        }
      }
    }

    // Step 3: Create educational audio content
    await page.goto('/#/audio');
    await page.waitForSelector('#content-area');

    const audioPrompt = page.locator('textarea[placeholder*="Describe the music"]');
    if (await audioPrompt.count() > 0) {
      await audioPrompt.fill('Calm, focused background music suitable for educational content, not distracting');
      const audioGenerateBtn = page.locator('button:has-text("Generate Audio")');
      if (await audioGenerateBtn.count() > 0) {
        await audioGenerateBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // Step 4: Structure educational content in timeline
    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Create structured educational timeline
    const addTrackBtn = page.locator('[data-testid="add-track-btn"]');
    for (let i = 0; i < 3; i++) {
      if (await addTrackBtn.count() > 0) {
        await addTrackBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // Organize content by educational segments
    const mediaItems = page.locator('[data-testid="media-item"]');
    const audioItems = page.locator('[data-testid="audio-item"]');
    const timelineTracks = page.locator('[data-testid="timeline-track"]');
    const audioTracks = page.locator('[data-testid="audio-track"]');

    // Add educational visuals
    const tracks = await timelineTracks.all();
    const items = await mediaItems.all();

    for (let i = 0; i < Math.min(tracks.length, items.length, 3); i++) {
      await items[i].dragTo(tracks[i]);
      await page.waitForTimeout(300);
    }

    // Add educational audio
    if ((await audioItems.count()) > 0 && (await audioTracks.count()) > 0) {
      await audioItems.first().dragTo(audioTracks.first());
      await page.waitForTimeout(300);
    }

    // Step 5: Apply educational formatting
    const clips = page.locator('[data-testid="timeline-clip"]');
    for (const clip of await clips.all()) {
      await clip.click();

      // Add educational text overlays
      const textBtn = page.locator('[data-testid="add-text-btn"]');
      if (await textBtn.count() > 0) {
        await textBtn.click();
        await page.waitForTimeout(200);
      }

      // Add chapter markers
      const markerBtn = page.locator('[data-testid="add-marker-btn"]');
      if (await markerBtn.count() > 0) {
        await markerBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // Step 6: Export educational package
    const exportBtn = page.locator('[data-testid="export-educational-btn"], [data-testid="export-btn"]');
    if (await exportBtn.count() > 0) {
      await exportBtn.click();
      await page.waitForTimeout(3000);
    }

    // Verify educational content workflow completion
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
    expect(await clips.count()).toBeGreaterThan(0);
  });

  test('should handle real-time collaborative editing session', async ({ page }) => {
    // Scenario: Team collaborating on a project in real-time

    await page.goto('/#/edit');
    await page.waitForSelector('.main-grid');

    // Step 1: Set up collaborative project structure
    const addTrackBtn = page.locator('[data-testid="add-track-btn"]');
    for (let i = 0; i < 4; i++) {
      if (await addTrackBtn.count() > 0) {
        await addTrackBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // Step 2: Simulate team member contributions
    const mediaItems = page.locator('[data-testid="media-item"]');
    const timelineTracks = page.locator('[data-testid="timeline-track"]');

    if ((await mediaItems.count()) >= 4 && (await timelineTracks.count()) >= 4) {
      // Team member 1: Add main content
      await mediaItems.nth(0).dragTo(timelineTracks.nth(0));
      await page.waitForTimeout(300);

      // Team member 2: Add secondary content
      await mediaItems.nth(1).dragTo(timelineTracks.nth(1));
      await page.waitForTimeout(300);

      // Team member 3: Add B-roll
      await mediaItems.nth(2).dragTo(timelineTracks.nth(2));
      await page.waitForTimeout(300);

      // Team member 4: Add graphics
      await mediaItems.nth(3).dragTo(timelineTracks.nth(3));
      await page.waitForTimeout(300);
    }

    // Step 3: Simulate collaborative editing
    const clips = page.locator('[data-testid="timeline-clip"]');
    if (await clips.count() >= 4) {
      // Apply collaborative effects and adjustments
      for (let i = 0; i < Math.min(await clips.count(), 4); i++) {
        await clips.nth(i).click();

        // Different team members apply different effects
        const effectsBtn = page.locator('[data-testid="effects-btn"]');
        if (await effectsBtn.count() > 0) {
          await effectsBtn.click();
          await page.waitForTimeout(300);
        }

        // Add collaborative annotations
        const commentBtn = page.locator('[data-testid="add-comment-btn"]');
        if (await commentBtn.count() > 0) {
          await commentBtn.click();
          await page.waitForTimeout(200);
        }
      }
    }

    // Step 4: Version control and review process
    const saveBtn = page.locator('[data-testid="save-project-btn"]');
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(1000);
    }

    // Simulate review feedback implementation
    const feedbackBtn = page.locator('[data-testid="implement-feedback-btn"]');
    if (await feedbackBtn.count() > 0) {
      await feedbackBtn.click();
      await page.waitForTimeout(500);
    }

    // Step 5: Final collaborative export
    const exportBtn = page.locator('[data-testid="export-collaborative-btn"], [data-testid="export-btn"]');
    if (await exportBtn.count() > 0) {
      await exportBtn.click();
      await page.waitForTimeout(3000);
    }

    // Verify collaborative workflow completion
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
    expect(await timelineTracks.count()).toBeGreaterThanOrEqual(4);
  });
});