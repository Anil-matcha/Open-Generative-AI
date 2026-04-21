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

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - img [ref=e8] [cursor=pointer]
        - navigation [ref=e12]:
          - generic [ref=e13] [cursor=pointer]: Explore
          - generic [ref=e14] [cursor=pointer]: Image
          - generic [ref=e15] [cursor=pointer]: Video
          - generic [ref=e16] [cursor=pointer]: Tools
          - generic [ref=e17] [cursor=pointer]: Storyboard
          - generic [ref=e18] [cursor=pointer]: Edit
          - generic [ref=e19] [cursor=pointer]: Character
          - generic [ref=e20] [cursor=pointer]: Vibe Motion
          - generic [ref=e21] [cursor=pointer]: Cinema Studio
          - generic [ref=e22] [cursor=pointer]: AI Influencer
          - generic [ref=e23] [cursor=pointer]: Apps
          - generic [ref=e24] [cursor=pointer]: Templates
          - generic [ref=e25] [cursor=pointer]: Assist
          - generic [ref=e26] [cursor=pointer]: Community
      - button "Update API Key" [ref=e28]:
        - img [ref=e29]
  - generic [ref=e31]:
    - complementary [ref=e32]:
      - generic [ref=e33]:
        - generic [ref=e34] [cursor=pointer]:
          - button [ref=e35]:
            - img [ref=e36]
          - generic [ref=e41]: Apps
        - generic [ref=e42] [cursor=pointer]:
          - button [ref=e43]:
            - img [ref=e44]
          - generic [ref=e48]: Image
        - generic [ref=e49] [cursor=pointer]:
          - button [ref=e50]:
            - img [ref=e51]
          - generic [ref=e54]: Video
        - generic [ref=e55] [cursor=pointer]:
          - button [ref=e56]:
            - img [ref=e57]
          - generic [ref=e59]: Cinema
        - generic [ref=e60] [cursor=pointer]:
          - button [ref=e61]:
            - img [ref=e62]
          - generic [ref=e65]: Character
        - generic [ref=e66] [cursor=pointer]:
          - button [ref=e67]:
            - img [ref=e68]
          - generic [ref=e70]: Influencer
        - generic [ref=e71] [cursor=pointer]:
          - button [ref=e72]:
            - img [ref=e73]
          - generic [ref=e80]: Storyboard
        - generic [ref=e81] [cursor=pointer]:
          - button [ref=e82]:
            - img [ref=e83]
          - generic [ref=e85]: Effects
        - generic [ref=e86] [cursor=pointer]:
          - button [ref=e87]:
            - img [ref=e88]
          - generic [ref=e91]: Edit
        - generic [ref=e92] [cursor=pointer]:
          - button [ref=e93]:
            - img [ref=e94]
          - generic [ref=e99]: Upscale
        - generic [ref=e100] [cursor=pointer]:
          - button [ref=e101]:
            - img [ref=e102]
          - generic [ref=e106]: Audio
        - generic [ref=e107] [cursor=pointer]:
          - button [ref=e108]:
            - img [ref=e109]
          - generic [ref=e113]: Avatar
        - generic [ref=e114] [cursor=pointer]:
          - button [ref=e115]:
            - img [ref=e116]
          - generic [ref=e120]: Training
        - generic [ref=e121] [cursor=pointer]:
          - button [ref=e122]:
            - img [ref=e123]
          - generic [ref=e126]: Video Tools
        - generic [ref=e127] [cursor=pointer]:
          - button [ref=e128]:
            - img [ref=e129]
          - generic [ref=e131]: Render
        - generic [ref=e132] [cursor=pointer]:
          - button [ref=e133]:
            - img [ref=e134]
          - generic [ref=e138]: Video Agent
        - generic [ref=e139] [cursor=pointer]:
          - button [ref=e140]:
            - img [ref=e141]
          - generic [ref=e144]: Director
        - generic [ref=e145] [cursor=pointer]:
          - button [ref=e146]:
            - img [ref=e147]
          - generic [ref=e152]: Timeline
        - generic [ref=e153] [cursor=pointer]:
          - button [ref=e154]:
            - img [ref=e155]
          - generic [ref=e157]: Chat
        - generic [ref=e158] [cursor=pointer]:
          - button [ref=e159]:
            - img [ref=e160]
          - generic [ref=e163]: Commercial
        - generic [ref=e164] [cursor=pointer]:
          - button [ref=e165]:
            - img [ref=e166]
          - generic [ref=e168]: Templates
        - generic [ref=e169] [cursor=pointer]:
          - button [ref=e170]:
            - img [ref=e171]
          - generic [ref=e174]: Explore
        - generic [ref=e175] [cursor=pointer]:
          - button [ref=e176]:
            - img [ref=e177]
          - generic [ref=e180]: Library
        - generic [ref=e181] [cursor=pointer]:
          - button [ref=e182]:
            - img [ref=e183]
          - generic [ref=e188]: Community
        - generic [ref=e189] [cursor=pointer]:
          - button [ref=e190]:
            - img [ref=e191]
          - generic [ref=e195]: Assist
        - generic [ref=e196] [cursor=pointer]:
          - button [ref=e197]:
            - img [ref=e198]
          - generic [ref=e201]: Commits (0)
        - generic [ref=e202] [cursor=pointer]:
          - button [ref=e203]:
            - img [ref=e204]
          - generic [ref=e208]: Remix Go
      - generic [ref=e210] [cursor=pointer]:
        - button [ref=e211]:
          - img [ref=e212]
        - generic [ref=e215]: Settings
    - main [ref=e216]:
      - generic [ref=e217]: "Failed to load timeline: track is not defined"
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