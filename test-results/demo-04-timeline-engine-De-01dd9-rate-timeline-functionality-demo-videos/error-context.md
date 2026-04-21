# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo/04-timeline-engine.spec.ts >> Demo Video: Timeline Engine >> should demonstrate timeline functionality
- Location: tests/e2e/demo/04-timeline-engine.spec.ts:4:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="timeline"], .timeline, #timeline') to be visible

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Demo Video: Timeline Engine', () => {
  4  |   test('should demonstrate timeline functionality', async ({ page }) => {
  5  |     await page.goto('/timeline', { waitUntil: 'networkidle' });
> 6  |     await page.waitForSelector('[data-testid="timeline"], .timeline, #timeline', { timeout: 10000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  7  | 
  8  |     // Screenshot initial timeline state
  9  |     await page.screenshot({ path: 'demo-screenshots/timeline-initial.png' });
  10 | 
  11 |     // Try to find and demonstrate track rendering
  12 |     const tracks = page.locator('[data-testid="timeline-track"], .track, [class*="track"]');
  13 |     const trackCount = await tracks.count();
  14 |     console.log(`Found ${trackCount} timeline tracks`);
  15 | 
  16 |     if (trackCount > 0) {
  17 |       await tracks.first().screenshot({ path: 'demo-screenshots/timeline-track.png' });
  18 |     }
  19 | 
  20 |     // Demonstrate playhead movement
  21 |     const playhead = page.locator('[data-testid="playhead"], .playhead, [class*="playhead"]');
  22 |     if (await playhead.isVisible()) {
  23 |       // Try to drag playhead
  24 |       try {
  25 |         await playhead.dragTo(page.locator('body'), { targetPosition: { x: 200, y: 0 } });
  26 |         await page.waitForTimeout(500);
  27 |         await page.screenshot({ path: 'demo-screenshots/timeline-playhead-moved.png' });
  28 |       } catch (error) {
  29 |         console.log('Playhead drag failed:', error.message);
  30 |       }
  31 |     }
  32 | 
  33 |     // Demonstrate playback controls
  34 |     const playButton = page.locator('[data-testid="play-btn"], button:has-text("Play"), [class*="play"]').first();
  35 |     if (await playButton.isVisible()) {
  36 |       await playButton.click();
  37 |       await page.waitForTimeout(2000);
  38 |       await page.screenshot({ path: 'demo-screenshots/timeline-playing.png' });
  39 | 
  40 |       const pauseButton = page.locator('[data-testid="pause-btn"], button:has-text("Pause"), [class*="pause"]').first();
  41 |       if (await pauseButton.isVisible()) {
  42 |         await pauseButton.click();
  43 |         await page.waitForTimeout(500);
  44 |         await page.screenshot({ path: 'demo-screenshots/timeline-paused.png' });
  45 |       }
  46 |     }
  47 | 
  48 |     // Demonstrate stop control
  49 |     const stopButton = page.locator('[data-testid="stop-btn"], button:has-text("Stop"), [class*="stop"]').first();
  50 |     if (await stopButton.isVisible()) {
  51 |       await stopButton.click();
  52 |       await page.waitForTimeout(500);
  53 |       await page.screenshot({ path: 'demo-screenshots/timeline-stopped.png' });
  54 |     }
  55 |   });
  56 | });
```