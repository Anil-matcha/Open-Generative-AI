# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: main-app/timeline-editor.e2e.spec.ts >> Clip Management Operations >> should add clip to timeline via drag and drop
- Location: tests/e2e/main-app/timeline-editor.e2e.spec.ts:856:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="timeline-container"]') to be visible

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
  753 |   });
  754 | 
  755 |   test('should display clip thumbnails or waveforms', async ({ page }) => {
  756 |     const clips = await page.$$('[data-testid="timeline-clip"]');
  757 | 
  758 |     for (const clip of clips) {
  759 |       // Check for either thumbnail or waveform
  760 |       const thumbnail = await clip.$('[data-testid="clip-thumbnail"]');
  761 |       const waveform = await clip.$('[data-testid="clip-waveform"]');
  762 | 
  763 |       const hasVisualContent = thumbnail !== null || waveform !== null;
  764 |       expect(hasVisualContent).toBe(true);
  765 |     }
  766 |   });
  767 | 
  768 |   test('should handle track height adjustments', async ({ page }) => {
  769 |     const tracks = await page.$$('[data-testid="timeline-track"]');
  770 | 
  771 |     if (tracks.length > 0) {
  772 |       const firstTrack = tracks[0];
  773 |       const initialHeight = await firstTrack.evaluate(el => el.clientHeight);
  774 | 
  775 |       // Try to adjust track height (may need specific UI controls)
  776 |       const resizeHandle = await firstTrack.$('[data-testid="track-resize-handle"]');
  777 |       if (resizeHandle) {
  778 |         const handleBox = await resizeHandle.boundingBox();
  779 |         await page.mouse.move(handleBox.x, handleBox.y);
  780 |         await page.mouse.down();
  781 |         await page.mouse.move(handleBox.x, handleBox.y + 20); // Drag down 20px
  782 |         await page.mouse.up();
  783 | 
  784 |         await page.waitForTimeout(100);
  785 | 
  786 |         const newHeight = await firstTrack.evaluate(el => el.clientHeight);
  787 |         expect(newHeight).not.toBe(initialHeight);
  788 |       }
  789 |     }
  790 |   });
  791 | 
  792 |   test('should render selection overlays correctly', async ({ page }) => {
  793 |     // Select a clip
  794 |     const clips = await page.$$('[data-testid="timeline-clip"]');
  795 |     if (clips.length > 0) {
  796 |       await clips[0].click();
  797 | 
  798 |       // Check for selection indicator
  799 |       const selectionOverlay = await page.$('[data-testid="selection-overlay"]');
  800 |       expect(selectionOverlay).not.toBeNull();
  801 |     }
  802 |   });
  803 | 
  804 |   test('should display track controls and properties', async ({ page }) => {
  805 |     const tracks = await page.$$('[data-testid="timeline-track"]');
  806 | 
  807 |     for (const track of tracks) {
  808 |       // Check for track controls
  809 |       const muteBtn = await track.$('[data-testid="track-mute-btn"]');
  810 |       const soloBtn = await track.$('[data-testid="track-solo-btn"]');
  811 |       const lockBtn = await track.$('[data-testid="track-lock-btn"]');
  812 | 
  813 |       // At least one control should be present
  814 |       const hasControls = muteBtn !== null || soloBtn !== null || lockBtn !== null;
  815 |       expect(hasControls).toBe(true);
  816 |     }
  817 |   });
  818 | 
  819 |   test('should handle timeline scrolling and panning', async ({ page }) => {
  820 |     const timeline = await page.$('[data-testid="timeline-container"]');
  821 | 
  822 |     if (timeline) {
  823 |       const initialScroll = await timeline.evaluate(el => el.scrollLeft);
  824 | 
  825 |       // Try to scroll timeline
  826 |       await timeline.evaluate(el => el.scrollLeft += 100);
  827 | 
  828 |       const newScroll = await timeline.evaluate(el => el.scrollLeft);
  829 |       expect(newScroll).toBeGreaterThan(initialScroll);
  830 |     }
  831 |   });
  832 | 
  833 |   test('should render transitions between clips', async ({ page }) => {
  834 |     const transitions = await page.$$('[data-testid="timeline-transition"]');
  835 | 
  836 |     // May or may not have transitions depending on content
  837 |     // If present, verify they have proper positioning
  838 |     for (const transition of transitions) {
  839 |       const transitionPos = await transition.evaluate(el => ({
  840 |         left: el.style.left,
  841 |         width: el.style.width
  842 |       }));
  843 | 
  844 |       expect(transitionPos.left).toBeDefined();
  845 |       expect(transitionPos.width).toBeDefined();
  846 |     }
  847 |   });
  848 | 
  849 | // Clip Management Operations Tests
  850 | test.describe('Clip Management Operations', () => {
  851 |   test.beforeEach(async ({ page }) => {
  852 |     await page.goto('/#timeline');
> 853 |     await page.waitForSelector('[data-testid="timeline-container"]', { timeout: 10000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  854 |   });
  855 | 
  856 |   test('should add clip to timeline via drag and drop', async ({ page }) => {
  857 |     // Find media library and timeline
  858 |     const mediaItems = await page.$$('[data-testid="media-item"]');
  859 |     const timelineTracks = await page.$$('[data-testid="timeline-track"]');
  860 | 
  861 |     if (mediaItems.length > 0 && timelineTracks.length > 0) {
  862 |       const mediaItem = mediaItems[0];
  863 |       const timelineTrack = timelineTracks[0];
  864 | 
  865 |       // Count clips before
  866 |       const clipsBefore = await page.$$('[data-testid="timeline-clip"]');
  867 | 
  868 |       // Perform drag and drop
  869 |       await mediaItem.dragTo(timelineTrack);
  870 | 
  871 |       // Wait for clip to be added
  872 |       await page.waitForTimeout(500);
  873 | 
  874 |       // Count clips after
  875 |       const clipsAfter = await page.$$('[data-testid="timeline-clip"]');
  876 |       expect(clipsAfter.length).toBeGreaterThan(clipsBefore.length);
  877 |     }
  878 |   });
  879 | 
  880 |   test('should select and move clip', async ({ page }) => {
  881 |     const clips = await page.$$('[data-testid="timeline-clip"]');
  882 | 
  883 |     if (clips.length > 0) {
  884 |       const clip = clips[0];
  885 | 
  886 |       // Select clip
  887 |       await clip.click();
  888 | 
  889 |       // Verify selection
  890 |       const selectionOverlay = await page.$('[data-testid="selection-overlay"]');
  891 |       expect(selectionOverlay).not.toBeNull();
  892 | 
  893 |       // Get initial position
  894 |       const initialPos = await clip.evaluate(el => el.style.left);
  895 | 
  896 |       // Attempt to move clip (drag operation)
  897 |       const clipBox = await clip.boundingBox();
  898 |       await page.mouse.move(clipBox.x + 10, clipBox.y + 10);
  899 |       await page.mouse.down();
  900 | 
  901 |       // Drag 50px to the right
  902 |       await page.mouse.move(clipBox.x + 60, clipBox.y + 10);
  903 |       await page.mouse.up();
  904 | 
  905 |       // Wait for position update
  906 |       await page.waitForTimeout(200);
  907 | 
  908 |       // Check if position changed
  909 |       const newPos = await clip.evaluate(el => el.style.left);
  910 |       // Note: Position change depends on timeline implementation
  911 |       // This test verifies the drag operation doesn't crash
  912 |       expect(typeof newPos).toBe('string');
  913 |     }
  914 |   });
  915 | 
  916 |   test('should delete selected clip', async ({ page }) => {
  917 |     const clipsBefore = await page.$$('[data-testid="timeline-clip"]');
  918 | 
  919 |     if (clipsBefore.length > 0) {
  920 |       const clip = clipsBefore[0];
  921 | 
  922 |       // Select and delete clip
  923 |       await clip.click();
  924 | 
  925 |       // Try different delete methods
  926 |       try {
  927 |         await page.keyboard.press('Delete');
  928 |       } catch {
  929 |         // Try alternative delete method
  930 |         const deleteBtn = await page.$('[data-testid="delete-clip-btn"]');
  931 |         if (deleteBtn) {
  932 |           await deleteBtn.click();
  933 |         }
  934 |       }
  935 | 
  936 |       // Wait for deletion
  937 |       await page.waitForTimeout(500);
  938 | 
  939 |       // Check clips after
  940 |       const clipsAfter = await page.$$('[data-testid="timeline-clip"]');
  941 |       // Note: Deletion may be prevented or may require confirmation
  942 |       // This test verifies the operation is handled
  943 |       expect(Array.isArray(clipsAfter)).toBe(true);
  944 |     }
  945 |   });
  946 | 
  947 |   test('should resize clip duration', async ({ page }) => {
  948 |     const clips = await page.$$('[data-testid="timeline-clip"]');
  949 | 
  950 |     if (clips.length > 0) {
  951 |       const clip = clips[0];
  952 | 
  953 |       // Look for resize handle
```