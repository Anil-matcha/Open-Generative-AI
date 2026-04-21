# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modules/cinegen-integration.spec.js >> CineGen Module Integration >> should handle timeline migration workflows
- Location: tests/e2e/modules/cinegen-integration.spec.js:32:3

# Error details

```
TimeoutError: page.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="new-project-btn"]')

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
      - generic [ref=e217]:
        - generic [ref=e219]:
          - img "image studio" [ref=e220]
          - generic [ref=e222]:
            - heading "Image Studio" [level=1] [ref=e223]
            - paragraph [ref=e224]: Transform images with AI — upscale, stylize, animate and more
        - generic [ref=e226]:
          - generic [ref=e227]:
            - button "Reference image" [ref=e228]:
              - img [ref=e230]
            - textbox "Describe the image you want to create" [ref=e233]
          - generic [ref=e234]:
            - generic [ref=e235]:
              - button "G Nano Banana Select AI generation model" [ref=e236]:
                - generic [ref=e238]: G
                - generic [ref=e239]: Nano Banana
                - img [ref=e240]
                - text: Select AI generation model
              - button "1:1 Change aspect ratio" [ref=e242]:
                - img [ref=e243]
                - generic [ref=e245]: 1:1
                - img [ref=e246]
                - text: Change aspect ratio
              - text: Set output quality
              - button "Advanced Show advanced options" [ref=e248]:
                - img [ref=e249]
                - generic [ref=e252]: Advanced
                - img [ref=e253]
                - text: Show advanced options
              - button "Tools Quick starters & prompt enhancer" [ref=e255]:
                - img [ref=e256]
                - generic [ref=e258]: Tools
                - img [ref=e259]
                - text: Quick starters & prompt enhancer
            - button "Generate ✨ Generate AI image from prompt" [ref=e261]
        - generic [ref=e262]:
          - generic [ref=e263]:
            - generic [ref=e264]:
              - generic [ref=e266]: "1"
              - generic [ref=e267]:
                - generic [ref=e268]: Choose a model
                - generic [ref=e269]: Select from 20+ AI models in the sidebar. Each model has different strengths for portraits, landscapes, or abstract art.
            - generic [ref=e270]:
              - generic [ref=e272]: "2"
              - generic [ref=e273]:
                - generic [ref=e274]: Write your prompt
                - generic [ref=e275]: Describe what you want to create. Be specific about style, lighting, composition, and mood for better results.
            - generic [ref=e276]:
              - generic [ref=e278]: "3"
              - generic [ref=e279]:
                - generic [ref=e280]: Set parameters
                - generic [ref=e281]: Adjust aspect ratio, resolution, and other settings. Use negative prompts to exclude unwanted elements.
            - generic [ref=e282]:
              - generic [ref=e284]: "4"
              - generic [ref=e285]:
                - generic [ref=e286]: Generate and refine
                - generic [ref=e287]: Click Generate to create your image. Use the result as a starting point and iterate on your prompt for improvements.
          - generic [ref=e288]:
            - button "Quick Tips" [ref=e289]:
              - img [ref=e291]
              - text: Quick Tips
            - generic [ref=e293]:
              - generic [ref=e294]:
                - generic [ref=e295]: ●
                - generic [ref=e296]: Add "4K, detailed, professional" to improve quality
              - generic [ref=e297]:
                - generic [ref=e298]: ●
                - generic [ref=e299]: Specify camera angles like "shot from below" or "bird's eye view"
              - generic [ref=e300]:
                - generic [ref=e301]: ●
                - generic [ref=e302]: "Reference art styles: \"in the style of watercolor painting\""
        - generic [ref=e304]: History
        - generic:
          - generic:
            - img
          - generic:
            - button "↻ Regenerate"
            - button "↓ Download"
            - button "+ New"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('CineGen Module Integration', () => {
  4   |   test('should integrate with main app timeline', async ({ page }) => {
  5   |     // Navigate to main app
  6   |     await page.goto('/');
  7   |     await page.waitForSelector('[data-testid="app-shell"]');
  8   | 
  9   |     // Access CineGen through apps hub
  10  |     await page.click('[data-route="apps"]');
  11  |     await page.waitForSelector('[data-testid="apps-hub"]');
  12  | 
  13  |     await page.click('[data-testid="cinegen-app"]');
  14  | 
  15  |     // Should open CineGen interface
  16  |     await expect(page.locator('[data-testid="cinegen-interface"]')).toBeVisible();
  17  | 
  18  |     // Generate video in CineGen
  19  |     await page.fill('[data-testid="cinegen-prompt"]', 'A cinematic scene');
  20  |     await page.click('[data-testid="cinegen-generate"]');
  21  | 
  22  |     await page.waitForSelector('[data-testid="cinegen-video-result"]');
  23  | 
  24  |     // Import to timeline
  25  |     await page.click('[data-testid="import-to-timeline"]');
  26  | 
  27  |     // Should navigate back to timeline with imported video
  28  |     await expect(page).toHaveURL(/.*#\/timeline/);
  29  |     await expect(page.locator('[data-testid="timeline-video-clip"]')).toBeVisible();
  30  |   });
  31  | 
  32  |   test('should handle timeline migration workflows', async ({ page }) => {
  33  |     // Create timeline project
  34  |     await page.goto('/#/timeline');
> 35  |     await page.click('[data-testid="new-project-btn"]');
      |                ^ TimeoutError: page.click: Timeout 10000ms exceeded.
  36  |     await page.fill('[data-testid="project-name"]', 'CineGen Test Project');
  37  | 
  38  |     // Add some basic clips
  39  |     await page.click('[data-testid="add-video-track"]');
  40  |     await page.click('[data-testid="add-text-clip"]');
  41  |     await page.fill('[data-testid="text-content"]', 'Sample Text');
  42  | 
  43  |     // Export timeline for CineGen processing
  44  |     await page.click('[data-testid="export-for-cinegen"]');
  45  | 
  46  |     await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
  47  | 
  48  |     // Access CineGen
  49  |     await page.click('[data-route="apps"]');
  50  |     await page.click('[data-testid="cinegen-app"]');
  51  | 
  52  |     // Import timeline project
  53  |     await page.click('[data-testid="import-timeline-project"]');
  54  |     await expect(page.locator('[data-testid="imported-timeline"]')).toBeVisible();
  55  | 
  56  |     // Process with CineGen enhancements
  57  |     await page.click('[data-testid="enhance-with-cinegen"]');
  58  |     await page.waitForSelector('[data-testid="cinegen-processing-complete"]');
  59  | 
  60  |     // Export back to timeline
  61  |     await page.click('[data-testid="export-to-timeline"]');
  62  | 
  63  |     // Should update original timeline
  64  |     await page.goto('/#/timeline');
  65  |     await expect(page.locator('[data-testid="enhanced-clips"]')).toBeVisible();
  66  |   });
  67  | 
  68  |   test('should support file upload integration', async ({ page }) => {
  69  |     await page.goto('/#/apps');
  70  |     await page.click('[data-testid="cinegen-app"]');
  71  | 
  72  |     // Upload media file
  73  |     await page.setInputFiles('[data-testid="file-upload"]', 'tests/sample-video.mp4');
  74  |     await expect(page.locator('[data-testid="uploaded-file"]')).toBeVisible();
  75  | 
  76  |     // Process uploaded file
  77  |     await page.click('[data-testid="process-uploaded-file"]');
  78  |     await page.waitForSelector('[data-testid="processing-result"]');
  79  | 
  80  |     // Verify integration with main app library
  81  |     await page.goto('/#/library');
  82  |     await expect(page.locator('[data-testid="processed-media"]')).toBeVisible();
  83  |   });
  84  | 
  85  |   test('should integrate playback engine', async ({ page }) => {
  86  |     await page.goto('/#/apps');
  87  |     await page.click('[data-testid="cinegen-app"]');
  88  | 
  89  |     // Generate or upload video content
  90  |     await page.fill('[data-testid="cinegen-prompt"]', 'A simple animation');
  91  |     await page.click('[data-testid="cinegen-generate"]');
  92  |     await page.waitForSelector('[data-testid="cinegen-video-result"]');
  93  | 
  94  |     // Test playback controls
  95  |     await page.click('[data-testid="play-video"]');
  96  |     await expect(page.locator('[data-testid="video-playing"]')).toBeVisible();
  97  | 
  98  |     await page.click('[data-testid="pause-video"]');
  99  |     await expect(page.locator('[data-testid="video-paused"]')).toBeVisible();
  100 | 
  101 |     // Test timeline scrubbing
  102 |     const scrubber = page.locator('[data-testid="video-scrubber"]');
  103 |     await scrubber.click({ position: { x: 100, y: 0 } });
  104 | 
  105 |     // Verify timeline position updated
  106 |     const currentTime = await page.locator('[data-testid="current-time"]').textContent();
  107 |     expect(currentTime).not.toBe('0:00');
  108 |   });
  109 | 
  110 |   test('should handle API communication with main app', async ({ page }) => {
  111 |     // Mock API calls between CineGen and main app
  112 |     await page.route('**/api/cinegen/**', route => {
  113 |       if (route.request().url().includes('/generate')) {
  114 |         route.fulfill({
  115 |           status: 200,
  116 |           contentType: 'application/json',
  117 |           body: JSON.stringify({
  118 |             success: true,
  119 |             videoUrl: 'https://example.com/generated-video.mp4',
  120 |             metadata: { duration: 10, format: 'mp4' }
  121 |           })
  122 |         });
  123 |       } else {
  124 |         route.continue();
  125 |       }
  126 |     });
  127 | 
  128 |     await page.goto('/#/apps');
  129 |     await page.click('[data-testid="cinegen-app"]');
  130 | 
  131 |     await page.fill('[data-testid="cinegen-prompt"]', 'API test');
  132 |     await page.click('[data-testid="cinegen-generate"]');
  133 | 
  134 |     await page.waitForSelector('[data-testid="generation-success"]');
  135 |     await expect(page.locator('[data-testid="generated-video"]')).toBeVisible();
```