# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: main-app/timeline-editor.e2e.spec.ts >> App Shell Components >> should handle responsive layout changes
- Location: tests/e2e/main-app/timeline-editor.e2e.spec.ts:97:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="mobile-sidebar"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="mobile-sidebar"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - img [ref=e8] [cursor=pointer]
        - generic [ref=e12]:
          - button [ref=e13]:
            - img [ref=e14]
          - button "Update API Key" [ref=e15]:
            - img [ref=e16]
    - main [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e22]:
          - img "image studio" [ref=e23]
          - generic [ref=e25]:
            - heading "Image Studio" [level=1] [ref=e26]
            - paragraph [ref=e27]: Transform images with AI — upscale, stylize, animate and more
        - generic [ref=e29]:
          - generic [ref=e30]:
            - button "Reference image" [ref=e31]:
              - img [ref=e33]
            - textbox "Describe the image you want to create" [ref=e36]
            - button "🚀" [ref=e37]
          - generic [ref=e38]:
            - generic [ref=e39]:
              - button "G Nano Banana Select AI generation model" [ref=e40]:
                - generic [ref=e42]: G
                - generic [ref=e43]: Nano Banana
                - img [ref=e44]
                - text: Select AI generation model
              - button "1:1 Change aspect ratio" [ref=e46]:
                - img [ref=e47]
                - generic [ref=e49]: 1:1
                - img [ref=e50]
                - text: Change aspect ratio
              - text: Set output quality
              - button "Advanced Show advanced options" [ref=e52]:
                - img [ref=e53]
                - generic [ref=e56]: Advanced
                - img [ref=e57]
                - text: Show advanced options
              - button "Tools Quick starters & prompt enhancer" [ref=e59]:
                - img [ref=e60]
                - generic [ref=e62]: Tools
                - img [ref=e63]
                - text: Quick starters & prompt enhancer
            - button "Generate ✨ Generate AI image from prompt" [ref=e65]
        - generic [ref=e66]:
          - generic [ref=e67]:
            - generic [ref=e68]:
              - generic [ref=e70]: "1"
              - generic [ref=e71]:
                - generic [ref=e72]: Choose a model
                - generic [ref=e73]: Select from 20+ AI models in the sidebar. Each model has different strengths for portraits, landscapes, or abstract art.
            - generic [ref=e74]:
              - generic [ref=e76]: "2"
              - generic [ref=e77]:
                - generic [ref=e78]: Write your prompt
                - generic [ref=e79]: Describe what you want to create. Be specific about style, lighting, composition, and mood for better results.
            - generic [ref=e80]:
              - generic [ref=e82]: "3"
              - generic [ref=e83]:
                - generic [ref=e84]: Set parameters
                - generic [ref=e85]: Adjust aspect ratio, resolution, and other settings. Use negative prompts to exclude unwanted elements.
            - generic [ref=e86]:
              - generic [ref=e88]: "4"
              - generic [ref=e89]:
                - generic [ref=e90]: Generate and refine
                - generic [ref=e91]: Click Generate to create your image. Use the result as a starting point and iterate on your prompt for improvements.
          - generic [ref=e92]:
            - button "Quick Tips" [ref=e93]:
              - img [ref=e95]
              - text: Quick Tips
            - generic [ref=e97]:
              - generic [ref=e98]:
                - generic [ref=e99]: ●
                - generic [ref=e100]: Add "4K, detailed, professional" to improve quality
              - generic [ref=e101]:
                - generic [ref=e102]: ●
                - generic [ref=e103]: Specify camera angles like "shot from below" or "bird's eye view"
              - generic [ref=e104]:
                - generic [ref=e105]: ●
                - generic [ref=e106]: "Reference art styles: \"in the style of watercolor painting\""
        - generic [ref=e108]: History
        - generic:
          - generic:
            - img
          - generic:
            - button "↻ Regenerate"
            - button "↓ Download"
            - button "+ New"
  - generic:
    - button:
      - img
    - generic: Explore
    - generic: Image
    - generic: → Text to Image
    - generic: → Image to Image
    - generic: Video
    - generic: → Text to Video
    - generic: → Image to Video
    - generic: → Video to Video
    - generic: → Watermark Remover
    - generic: Tools
    - generic: → Storyboard
    - generic: → Character
    - generic: → Vibe Motion
    - generic: → Cinema Studio
    - generic: → AI Influencer
    - generic: → Commercial
    - generic: → Upscale
    - generic: Storyboard
    - generic: Edit
    - generic: Character
    - generic: Vibe Motion
    - generic: Cinema Studio
    - generic: AI Influencer
    - generic: Apps
    - generic: Templates
    - generic: Assist
    - generic: Community
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // 1. Test runtime/app setup (Vite config, security headers, performance)
  4   | test.describe('Runtime & App Setup', () => {
  5   |   test('should load app with correct security headers', async ({ page }) => {
  6   |     const response = await page.goto('/');
  7   |     expect(response?.status()).toBe(200);
  8   |     // Check security headers
  9   |     const headers = response?.headers();
  10  |     expect(headers).toBeDefined();
  11  |     // Check for basic security headers
  12  |     expect(headers?.['x-content-type-options']).toBe('nosniff');
  13  |   });
  14  | 
  15  |   test('should have correct Vite config and app mounted', async ({ page }) => {
  16  |     await page.goto('/');
  17  |     await expect(page.locator('#app')).toBeVisible();
  18  |     await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  19  |   });
  20  | 
  21  |   test('should have correct viewport and basic performance metrics', async ({ page }) => {
  22  |     const start = Date.now();
  23  |     await page.goto('/');
  24  |     const loadTime = Date.now() - start;
  25  |     expect(loadTime).toBeLessThan(5000);
  26  | 
  27  |     // Check viewport
  28  |     const viewport = page.viewportSize();
  29  |     expect(viewport?.width).toBeGreaterThan(800);
  30  |     expect(viewport?.height).toBeGreaterThan(600);
  31  |   });
  32  | 
  33  |   test('should handle JavaScript errors gracefully', async ({ page }) => {
  34  |     const errors: string[] = [];
  35  |     page.on('pageerror', error => errors.push(error.message));
  36  | 
  37  |     await page.goto('/');
  38  |     await page.waitForTimeout(2000);
  39  | 
  40  |     // Should not have critical JavaScript errors
  41  |     const criticalErrors = errors.filter(error =>
  42  |       !error.includes('favicon') && !error.includes('network')
  43  |     );
  44  |     expect(criticalErrors.length).toBe(0);
  45  |   });
  46  | });
  47  | 
  48  | // 2. Test route navigation and page loading
  49  | test.describe('Route Navigation', () => {
  50  |   test('should navigate to timeline page', async ({ page }) => {
  51  |     await page.goto('/#timeline');
  52  |     await expect(page).toHaveURL(/.*#\/timeline/);
  53  |   });
  54  | 
  55  |   test('should navigate to library page', async ({ page }) => {
  56  |     await page.goto('/');
  57  |     await page.click('[data-route="library"]');
  58  |     await expect(page).toHaveURL(/.*#\/library/);
  59  |   });
  60  | 
  61  |   test('should navigate to settings page', async ({ page }) => {
  62  |     await page.goto('/');
  63  |     await page.click('[data-route="settings"]');
  64  |     await expect(page).toHaveURL(/.*#\/settings/);
  65  |   });
  66  | 
  67  |   test('should handle browser back/forward navigation', async ({ page }) => {
  68  |     await page.goto('/');
  69  |     await page.click('[data-route="timeline"]');
  70  |     await page.click('[data-route="library"]');
  71  |     await page.goBack();
  72  |     await expect(page).toHaveURL(/.*#\/timeline/);
  73  |   });
  74  | });
  75  | 
  76  | // 3. Test app shell components (Header, Sidebar, Layout)
  77  | test.describe('App Shell Components', () => {
  78  |   test('should render Header component', async ({ page }) => {
  79  |     await page.goto('/');
  80  |     await expect(page.locator('[data-testid="header"]')).toBeVisible();
  81  |     await expect(page.locator('[data-testid="app-title"]')).toBeVisible();
  82  |   });
  83  | 
  84  |   test('should render Sidebar component with navigation', async ({ page }) => {
  85  |     await page.goto('/');
  86  |     await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  87  |     await expect(page.locator('[data-testid="nav-timeline"]')).toBeVisible();
  88  |     await expect(page.locator('[data-testid="nav-library"]')).toBeVisible();
  89  |   });
  90  | 
  91  |   test('should render main Layout component', async ({ page }) => {
  92  |     await page.goto('/');
  93  |     await expect(page.locator('[data-testid="main-layout"]')).toBeVisible();
  94  |     await expect(page.locator('[data-testid="content-area"]')).toBeVisible();
  95  |   });
  96  | 
  97  |   test('should handle responsive layout changes', async ({ page }) => {
  98  |     await page.setViewportSize({ width: 375, height: 667 });
  99  |     await page.goto('/');
> 100 |     await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible();
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
  101 |   });
  102 | });
  103 | 
  104 | // 4. Test timeline engine (tracks, clips, playhead, timeline controls)
  105 | test.describe('Timeline Engine', () => {
  106 |   test('should render timeline tracks', async ({ page }) => {
  107 |     await page.goto('/#timeline');
  108 |     await expect(page.locator('[data-testid="timeline-tracks"]')).toBeVisible();
  109 |   });
  110 | 
  111 |   test('should add clips to timeline', async ({ page }) => {
  112 |     await page.goto('/#timeline');
  113 |     await page.click('[data-testid="add-clip-btn"]');
  114 |     await expect(page.locator('[data-testid="timeline-clip"]')).toBeVisible();
  115 |   });
  116 | 
  117 |   test('should move playhead', async ({ page }) => {
  118 |     await page.goto('/#timeline');
  119 |     await page.click('[data-testid="playhead"]');
  120 |     const position = await page.locator('[data-testid="playhead"]').evaluate(el => el.style.left);
  121 |     expect(position).not.toBe('');
  122 |   });
  123 | 
  124 |   test('should control timeline playback', async ({ page }) => {
  125 |     await page.goto('/#timeline');
  126 |     await page.click('[data-testid="play-btn"]');
  127 |     await page.click('[data-testid="pause-btn"]');
  128 |     await page.click('[data-testid="stop-btn"]');
  129 |   });
  130 | });
  131 | 
  132 | // 5. Test state management (undo/redo, persistence, project state)
  133 | test.describe('State Management', () => {
  134 |   test('should undo last action', async ({ page }) => {
  135 |     await page.goto('/#timeline');
  136 |     await page.click('[data-testid="add-clip-btn"]');
  137 |     await page.click('[data-testid="undo-btn"]');
  138 |     const clipCount = await page.locator('[data-testid="timeline-clip"]').count();
  139 |     expect(clipCount).toBe(0);
  140 |   });
  141 | 
  142 |   test('should redo last action', async ({ page }) => {
  143 |     await page.goto('/#timeline');
  144 |     await page.click('[data-testid="add-clip-btn"]');
  145 |     await page.click('[data-testid="undo-btn"]');
  146 |     await page.click('[data-testid="redo-btn"]');
  147 |     const clipCount = await page.locator('[data-testid="timeline-clip"]').count();
  148 |     expect(clipCount).toBe(1);
  149 |   });
  150 | 
  151 |   test('should save project state', async ({ page }) => {
  152 |     await page.goto('/#timeline');
  153 |     await page.click('[data-testid="save-project-btn"]');
  154 |     await expect(page.locator('[data-testid="save-status"]')).toHaveText('Saved');
  155 |   });
  156 | });
  157 | 
  158 | // 6. Test toolbar/editing controls (tool selection, zoom, track management)
  159 | test.describe('Toolbar & Editing Controls', () => {
  160 |   test('should select editing tool', async ({ page }) => {
  161 |     await page.goto('/#timeline');
  162 |     await page.click('[data-testid="select-tool"]');
  163 |     await expect(page.locator('[data-testid="active-tool"]')).toHaveText('Select');
  164 |   });
  165 | 
  166 |   test('should adjust zoom level', async ({ page }) => {
  167 |     await page.goto('/#timeline');
  168 |     await page.click('[data-testid="zoom-in-btn"]');
  169 |     const zoomLevel = await page.locator('[data-testid="zoom-level"]').textContent();
  170 |     expect(zoomLevel).toContain('125%');
  171 |   });
  172 | 
  173 |   test('should manage tracks', async ({ page }) => {
  174 |     await page.goto('/#timeline');
  175 |     await page.click('[data-testid="add-track-btn"]');
  176 |     await expect(page.locator('[data-testid="timeline-track"]')).toHaveCount(2);
  177 |   });
  178 | });
  179 | 
  180 | // 7. Test media ingest (upload, drag-drop, library integration)
  181 | test.describe('Media Ingest', () => {
  182 |   test('should upload media file', async ({ page }) => {
  183 |     await page.goto('/#library');
  184 |     await page.setInputFiles('[data-testid="file-input"]', 'tests/samples/sample-video.mp4');
  185 |     await expect(page.locator('[data-testid="media-item"]')).toBeVisible();
  186 |   });
  187 | 
  188 |   test('should drag and drop media', async ({ page }) => {
  189 |     await page.goto('/#timeline');
  190 |     const fileInput = await page.$('[data-testid="file-input"]');
  191 |     await fileInput.setInputFiles('tests/samples/sample-video.mp4');
  192 |     await page.locator('[data-testid="media-item"]').dragTo(page.locator('[data-testid="timeline-track"]'));
  193 |   });
  194 | 
  195 |   test('should integrate with media library', async ({ page }) => {
  196 |     await page.goto('/#library');
  197 |     await expect(page.locator('[data-testid="media-grid"]')).toBeVisible();
  198 |   });
  199 | });
  200 | 
```