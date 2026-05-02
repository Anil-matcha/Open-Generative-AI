# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: main-app/timeline-editor.e2e.spec.ts >> State Management >> should redo last action
- Location: tests/e2e/main-app/timeline-editor.e2e.spec.ts:142:3

# Error details

```
TimeoutError: page.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="add-clip-btn"]')

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
          - generic [ref=e71]: AI-VFX
        - generic [ref=e72] [cursor=pointer]:
          - button [ref=e73]:
            - img [ref=e74]
          - generic [ref=e76]: Influencer
        - generic [ref=e77] [cursor=pointer]:
          - button [ref=e78]:
            - img [ref=e79]
          - generic [ref=e86]: Storyboard
        - generic [ref=e87] [cursor=pointer]:
          - button [ref=e88]:
            - img [ref=e89]
          - generic [ref=e91]: Effects
        - generic [ref=e92] [cursor=pointer]:
          - button [ref=e93]:
            - img [ref=e94]
          - generic [ref=e96]: VFX
        - generic [ref=e97] [cursor=pointer]:
          - button [ref=e98]:
            - img [ref=e99]
          - generic [ref=e102]: Edit
        - generic [ref=e103] [cursor=pointer]:
          - button [ref=e104]:
            - img [ref=e105]
          - generic [ref=e110]: Upscale
        - generic [ref=e111] [cursor=pointer]:
          - button [ref=e112]:
            - img [ref=e113]
          - generic [ref=e117]: Audio
        - generic [ref=e118] [cursor=pointer]:
          - button [ref=e119]:
            - img [ref=e120]
          - generic [ref=e124]: Avatar
        - generic [ref=e125] [cursor=pointer]:
          - button [ref=e126]:
            - img [ref=e127]
          - generic [ref=e131]: Training
        - generic [ref=e132] [cursor=pointer]:
          - button [ref=e133]:
            - img [ref=e134]
          - generic [ref=e137]: Video Tools
        - generic [ref=e138] [cursor=pointer]:
          - button [ref=e139]:
            - img [ref=e140]
          - generic [ref=e142]: Render
        - generic [ref=e143] [cursor=pointer]:
          - button [ref=e144]:
            - img [ref=e145]
          - generic [ref=e149]: Video Agent
        - generic [ref=e150] [cursor=pointer]:
          - button [ref=e151]:
            - img [ref=e152]
          - generic [ref=e155]: Director
        - generic [ref=e156] [cursor=pointer]:
          - button [ref=e157]:
            - img [ref=e158]
          - generic [ref=e163]: Timeline
        - generic [ref=e164] [cursor=pointer]:
          - button [ref=e165]:
            - img [ref=e166]
          - generic [ref=e168]: Chat
        - generic [ref=e169] [cursor=pointer]:
          - button [ref=e170]:
            - img [ref=e171]
          - generic [ref=e174]: Commercial
        - generic [ref=e175] [cursor=pointer]:
          - button [ref=e176]:
            - img [ref=e177]
          - generic [ref=e179]: Templates
        - generic [ref=e180] [cursor=pointer]:
          - button [ref=e181]:
            - img [ref=e182]
          - generic [ref=e185]: Explore
        - generic [ref=e186] [cursor=pointer]:
          - button [ref=e187]:
            - img [ref=e188]
          - generic [ref=e191]: Library
        - generic [ref=e192] [cursor=pointer]:
          - button [ref=e193]:
            - img [ref=e194]
          - generic [ref=e199]: Community
        - generic [ref=e200] [cursor=pointer]:
          - button [ref=e201]:
            - img [ref=e202]
          - generic [ref=e206]: Assist
        - generic [ref=e207] [cursor=pointer]:
          - button [ref=e208]:
            - img [ref=e209]
          - generic [ref=e212]: Commits (0)
        - generic [ref=e213] [cursor=pointer]:
          - button [ref=e214]:
            - img [ref=e215]
          - generic [ref=e219]: Remix Go
      - generic [ref=e221] [cursor=pointer]:
        - button [ref=e222]:
          - img [ref=e223]
        - generic [ref=e226]: Settings
    - main [ref=e227]:
      - generic [ref=e228]:
        - generic [ref=e230]:
          - img "image studio" [ref=e231]
          - generic [ref=e233]:
            - heading "Image Studio" [level=1] [ref=e234]
            - paragraph [ref=e235]: Transform images with AI — upscale, stylize, animate and more
        - generic [ref=e237]:
          - generic [ref=e238]:
            - button "Reference image" [ref=e239]:
              - img [ref=e241]
            - textbox "Describe the image you want to create" [ref=e244]
            - button "🚀" [ref=e245]
          - generic [ref=e246]:
            - generic [ref=e247]:
              - button "G Nano Banana Select AI generation model" [ref=e248]:
                - generic [ref=e250]: G
                - generic [ref=e251]: Nano Banana
                - img [ref=e252]
                - text: Select AI generation model
              - button "1:1 Change aspect ratio" [ref=e254]:
                - img [ref=e255]
                - generic [ref=e257]: 1:1
                - img [ref=e258]
                - text: Change aspect ratio
              - text: Set output quality
              - button "Advanced Show advanced options" [ref=e260]:
                - img [ref=e261]
                - generic [ref=e264]: Advanced
                - img [ref=e265]
                - text: Show advanced options
              - button "Tools Quick starters & prompt enhancer" [ref=e267]:
                - img [ref=e268]
                - generic [ref=e270]: Tools
                - img [ref=e271]
                - text: Quick starters & prompt enhancer
            - button "Generate ✨ Generate AI image from prompt" [ref=e273]
        - generic [ref=e274]:
          - generic [ref=e275]:
            - generic [ref=e276]:
              - generic [ref=e278]: "1"
              - generic [ref=e279]:
                - generic [ref=e280]: Choose a model
                - generic [ref=e281]: Select from 20+ AI models in the sidebar. Each model has different strengths for portraits, landscapes, or abstract art.
            - generic [ref=e282]:
              - generic [ref=e284]: "2"
              - generic [ref=e285]:
                - generic [ref=e286]: Write your prompt
                - generic [ref=e287]: Describe what you want to create. Be specific about style, lighting, composition, and mood for better results.
            - generic [ref=e288]:
              - generic [ref=e290]: "3"
              - generic [ref=e291]:
                - generic [ref=e292]: Set parameters
                - generic [ref=e293]: Adjust aspect ratio, resolution, and other settings. Use negative prompts to exclude unwanted elements.
            - generic [ref=e294]:
              - generic [ref=e296]: "4"
              - generic [ref=e297]:
                - generic [ref=e298]: Generate and refine
                - generic [ref=e299]: Click Generate to create your image. Use the result as a starting point and iterate on your prompt for improvements.
          - generic [ref=e300]:
            - button "Quick Tips" [ref=e301]:
              - img [ref=e303]
              - text: Quick Tips
            - generic [ref=e305]:
              - generic [ref=e306]:
                - generic [ref=e307]: ●
                - generic [ref=e308]: Add "4K, detailed, professional" to improve quality
              - generic [ref=e309]:
                - generic [ref=e310]: ●
                - generic [ref=e311]: Specify camera angles like "shot from below" or "bird's eye view"
              - generic [ref=e312]:
                - generic [ref=e313]: ●
                - generic [ref=e314]: "Reference art styles: \"in the style of watercolor painting\""
        - generic [ref=e316]: History
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
  100 |     await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible();
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
> 144 |     await page.click('[data-testid="add-clip-btn"]');
      |                ^ TimeoutError: page.click: Timeout 10000ms exceeded.
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
  201 | // 8. Test library/asset browsing (media grid, search, filtering)
  202 | test.describe('Library & Asset Browsing', () => {
  203 |   test('should browse media grid', async ({ page }) => {
  204 |     await page.goto('/#library');
  205 |     await expect(page.locator('[data-testid="media-grid"]')).toBeVisible();
  206 |   });
  207 | 
  208 |   test('should search media', async ({ page }) => {
  209 |     await page.goto('/#library');
  210 |     await page.fill('[data-testid="search-input"]', 'sample');
  211 |     await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  212 |   });
  213 | 
  214 |   test('should filter media by type', async ({ page }) => {
  215 |     await page.goto('/#library');
  216 |     await page.click('[data-testid="filter-video"]');
  217 |     await expect(page.locator('[data-testid="video-results"]')).toBeVisible();
  218 |   });
  219 | });
  220 | 
  221 | // 9. Test settings/inspector (clip settings, text/video settings)
  222 | test.describe('Settings & Inspector', () => {
  223 |   test('should open clip settings', async ({ page }) => {
  224 |     await page.goto('/#timeline');
  225 |     await page.click('[data-testid="clip-settings-btn"]');
  226 |     await expect(page.locator('[data-testid="inspector-panel"]')).toBeVisible();
  227 |   });
  228 | 
  229 |   test('should adjust video settings', async ({ page }) => {
  230 |     await page.goto('/settings');
  231 |     await page.selectOption('[data-testid="video-quality"]', 'high');
  232 |     await expect(page.locator('[data-testid="video-settings"]')).toHaveValue('high');
  233 |   });
  234 | 
  235 |   test(' should adjust text settings', async ({ page }) => {
  236 |     await page.goto('/settings');
  237 |     await page.fill('[data-testid="font-size"]', '18');
  238 |     await expect(page.locator('[data-testid="text-preview"]')).toHaveCSS('font-size', '18px');
  239 |   });
  240 | });
  241 | 
  242 | // 10. Test modals/workflows (social publisher, image editor, video player)
  243 | test.describe('Modals & Workflows', () => {
  244 |   test('should open social publisher modal', async ({ page }) => {
```