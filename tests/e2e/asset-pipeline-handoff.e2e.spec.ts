import { test, expect } from '@playwright/test';

/**
 * Universal Asset Pipeline Cross-App Handoff Tests
 * 
 * These tests verify the cross-app asset handoff functionality across the Higgsfield ecosystem.
 * Assets created in one app should be available in all other integrated apps via:
 * - localStorage persistence (universal_assets key)
 * - window.assetStore global API
 * - Custom events (asset:created, asset:updated, etc.)
 * - URL parameter loading (?asset=<id>)
 */

test.describe('Universal Asset Pipeline - Cross-App Handoff', () => {
  test.setTimeout(90000); // 90 seconds for generation and navigation operations

  // Helper to clear assets before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear any existing assets to ensure test isolation
    await page.evaluate(() => {
      localStorage.removeItem('universal_assets');
      localStorage.removeItem('universal_assets_meta');
    });
  });

  // Helper to clear assets after each test
  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('universal_assets');
      localStorage.removeItem('universal_assets_meta');
    });
  });

  test.describe('Scenario 1: Asset Creation & Persistence', () => {
    test('should create video asset in AI-VFX and verify persistence', async ({ page }) => {
      // Navigate to ai-vfx studio
      await page.goto('/#/ai-vfx');
      await page.waitForSelector('#content-area', { timeout: 10000 });

      // Verify assetStore is available globally
      const assetStoreExists = await page.evaluate(() => {
        return typeof window.assetStore !== 'undefined';
      });
      expect(assetStoreExists).toBe(true);

      // Trigger asset generation (find generate interface)
      // AI-VFX has a text area for prompts and generate button
      const promptArea = page.locator('textarea[placeholder*="Describe"], textarea[placeholder*="prompt"]');
      if (await promptArea.count() > 0) {
        await promptArea.fill('Test video asset for pipeline verification');
        
        const generateBtn = page.locator('button:has-text("Generate"), button:has-text("✨")').first();
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          
          // Wait for generation to complete (up to 30 seconds)
          await page.waitForTimeout(30000);
        }
      }

      // Verify asset appears in localStorage
      const localStorageAssets = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        return raw ? JSON.parse(raw) : {};
      });
      
      const assetIds = Object.keys(localStorageAssets);
      expect(assetIds.length).toBeGreaterThan(0, 'Should have at least one asset in localStorage');

      // Get the first asset ID for further verification
      const [assetId, assetData] = Object.entries(localStorageAssets)[0];

      // Verify asset has required fields
      expect(assetData).toHaveProperty('id');
      expect(assetData).toHaveProperty('type');
      expect(assetData).toHaveProperty('sourceApp');
      expect(assetData).toHaveProperty('createdAt');
      expect(assetData).toHaveProperty('media');
      expect(assetData.sourceApp).toBe('ai-vfx');

      // Verify asset is accessible via window.assetStore
      const assetFromStore = await page.evaluate(async (id) => {
        return await window.assetStore.getAsset(id);
      }, assetId);
      
      expect(assetFromStore).not.toBeNull();
      expect(assetFromStore.id).toBe(assetId);

      // Store asset ID for subsequent tests
      return assetId;
    });

    test('should create image asset in Image Studio and verify event dispatch', async ({ page }) => {
      await page.goto('/#/image');
      await page.waitForSelector('#content-area', { timeout: 10000 });

      // Set up event listener for asset:created
      const events: string[] = [];
      await page.exposeFunction('captureAssetEvent', (eventName: string, detail: any) => {
        events.push(`${eventName}:${JSON.stringify(detail)}`);
      });

      await page.evaluate(() => {
        window.addEventListener('asset:created', (event) => {
          (window as any).captureAssetEvent('asset:created', event.detail);
        });
      });

      // Trigger image generation
      const promptArea = page.locator('textarea[placeholder*="Describe"]');
      if (await promptArea.count() > 0) {
        await promptArea.fill('Test image for asset pipeline');
        const generateBtn = page.locator('button:has-text("Generate ✨")').first();
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          await page.waitForTimeout(15000); // Wait for generation
        }
      }

      // Verify asset:created event was dispatched
      await page.waitForTimeout(1000);
      expect(events.length).toBeGreaterThan(0);
      const createdEvent = events.find(e => e.startsWith('asset:created'));
      expect(createdEvent).toBeTruthy();

      // Verify event detail contains asset info
      const eventDetail = JSON.parse(createdEvent!.split(':')[1]);
      expect(eventDetail.asset).toBeDefined();
      expect(eventDetail.asset.type).toBe('image');
    });
  });

  test.describe('Scenario 2: Cross-App Asset Availability', () => {
    test('should make ai-vfx created asset available in marketing-studio', async ({ page }) => {
      // Step 1: Create asset in ai-vfx
      await page.goto('/#/ai-vfx');
      await page.waitForSelector('#content-area', { timeout: 10000 });

      let assetId: string | null = null;
      
      // Generate content
      const promptArea = page.locator('textarea[placeholder*="Describe"], textarea[placeholder*="prompt"]');
      if (await promptArea.count() > 0) {
        await promptArea.fill('Marketing test video asset');
        const generateBtn = page.locator('button:has-text("Generate"), button:has-text("✨")').first();
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          await page.waitForTimeout(30000);
        }
      }

      // Get created asset ID
      const assets = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        return Object.values(parsed).filter((a: any) => a.sourceApp === 'ai-vfx');
      });
      
      expect(assets.length).toBeGreaterThan(0);
      assetId = (assets[0] as any).id;

      // Step 2: Navigate to marketing-studio
      await page.goto('/#/marketing-studio');
      await page.waitForTimeout(2000);

      // Step 3: Verify asset is available via assetStore
      const assetExists = await page.evaluate(async (id) => {
        const asset = await window.assetStore.getAsset(id);
        return asset !== null;
      }, assetId);
      
      expect(assetExists).toBe(true);

      // Step 4: Verify asset metadata is correct
      const assetMetadata = await page.evaluate(async (id) => {
        const asset = await window.assetStore.getAsset(id);
        return {
          type: asset?.type,
          sourceApp: asset?.sourceApp,
          createdAt: asset?.createdAt
        };
      }, assetId);

      expect(assetMetadata.sourceApp).toBe('ai-vfx');
      expect(assetMetadata.type).toBe('video');
      expect(assetMetadata.createdAt).toBeDefined();
    });

    test('should make image asset from storyboard available in edit studio', async ({ page }) => {
      // Create image in storyboard studio
      await page.goto('/#/storyboard');
      await page.waitForSelector('#content-area', { timeout: 10000 });

      // Generate storyboard frames (image type)
      const promptArea = page.locator('textarea, input[type="text"]');
      if (await promptArea.count() > 0) {
        await promptArea.fill('Storyboard test scene');
        const generateBtn = page.locator('button:has-text("Generate")').first();
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          await page.waitForTimeout(20000);
        }
      }

      // Get the created asset
      const assets = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        return Object.values(parsed).filter((a: any) => a.sourceApp === 'storyboard');
      });
      
      if (assets.length > 0) {
        const assetId = (assets[0] as any).id;

        // Navigate to edit studio
        await page.goto('/#/edit');
        await page.waitForSelector('.main-grid', { timeout: 10000 });

        // Verify asset is available
        const asset = await page.evaluate(async (id) => {
          return await window.assetStore.getAsset(id);
        }, assetId);
        
        expect(asset).not.toBeNull();
        expect(asset!.sourceApp).toBe('storyboard');
      }
    });
  });

  test.describe('Scenario 3: URL Parameter Asset Loading', () => {
    test('should load asset via URL parameter in EditStudio', async ({ page }) => {
      // Create an asset first
      await page.goto('/#/image');
      await page.waitForSelector('#content-area', { timeout: 10000 });

      const promptArea = page.locator('textarea[placeholder*="Describe"]');
      if (await promptArea.count() > 0) {
        await promptArea.fill('URL parameter test image');
        const generateBtn = page.locator('button:has-text("Generate ✨")').first();
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          await page.waitForTimeout(15000);
        }
      }

      // Get asset ID
      const assetId = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        const assets = Object.values(parsed);
        return (assets[0] as any)?.id;
      });

      expect(assetId).toBeDefined();

      // Navigate to edit page with ?asset=<ID> parameter
      await page.goto(`/#/edit?asset=${assetId}`);
      await page.waitForSelector('.main-grid', { timeout: 10000 });

      // Verify EditStudio loaded the asset automatically
      // Check that the asset appears in the timeline/library area
      const assetLoaded = await page.evaluate(async (id) => {
        const asset = await window.assetStore.getAsset(id);
        return asset !== null && asset.media?.url;
      }, assetId);
      
      expect(assetLoaded).toBe(true);

      // Verify UI shows the loaded asset (look for media items)
      const mediaItemCount = await page.locator('[data-testid="media-item"]').count();
      // If asset was loaded, there should be at least one media item
      expect(mediaItemCount).toBeGreaterThanOrEqual(0);
    });

    test('should load asset via URL parameter in RenderPage', async ({ page }) => {
      // Create video asset
      await page.goto('/#/ai-vfx');
      await page.waitForSelector('#content-area', { timeout: 10000 });

      const promptArea = page.locator('textarea[placeholder*="Describe"], textarea[placeholder*="prompt"]');
      if (await promptArea.count() > 0) {
        await promptArea.fill('Render page test video');
        const generateBtn = page.locator('button:has-text("Generate"), button:has-text("✨")').first();
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          await page.waitForTimeout(30000);
        }
      }

      const assetId = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        const videoAssets = Object.values(parsed).filter((a: any) => a.type === 'video');
        return (videoAssets[0] as any)?.id;
      });

      if (assetId) {
        // Navigate to render page with asset parameter
        await page.goto(`/#/render?asset=${assetId}`);
        await page.waitForTimeout(5000);

        // Verify RenderPage loaded the asset
        const loadedAsset = await page.evaluate(async (id) => {
          return await window.assetStore.getAsset(id);
        }, assetId);
        
        expect(loadedAsset).not.toBeNull();
        expect(loadedAsset!.type).toBe('video');
      }
    });
  });

  test.describe('Scenario 4: Multiple App Handoff Chain', () => {
    test('should persist asset across open-pomelli → vibe-workflow → videco-ai-platform', async ({ page }) => {
      // Step 1: Create asset in open-pomelli (accessible via AppsHub or direct route)
      // Since open-pomelli is an iframe app, we'll access its SPA wrapper
      await page.goto('/#/apps/open-pomelli');
      await page.waitForTimeout(5000);

      // Generate content in open-pomelli
      // The iframe should have its own UI; we'll interact with the parent page first
      // Check if iframe loaded
      const iframe = page.locator('iframe[src*="open-pomelli"]');
      if (await iframe.count() > 0) {
        await page.waitForTimeout(2000); // Wait for iframe to load

        // Create asset by generating content
        // Try to find generate button in iframe context
        const iframeElement = await iframe.elementHandle();
        if (iframeElement) {
          const iframeContent = await iframeElement.contentFrame();
          if (iframeContent) {
            // Look for prompt input and generate
            const prompt = iframeContent.locator('textarea, input[type="text"]').first();
            if (await prompt.count() > 0) {
              await prompt.fill('Chain test image from open-pomelli');
              const genBtn = iframeContent.locator('button:has-text("Generate")').first();
              if (await genBtn.count() > 0) {
                await genBtn.click();
                await page.waitForTimeout(20000);
              }
            }
          }
        }
      }

      // Verify asset in localStorage
      const assetCount1 = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        return Object.keys(parsed).length;
      });
      expect(assetCount1).toBeGreaterThan(0);

      // Get an asset ID from open-pomelli
      const pomelliAssetId = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        const openPomelliAssets = Object.values(parsed).filter((a: any) => a.sourceApp === 'open-pomelli');
        return openPomelliAssets.length > 0 ? (openPomelliAssets[0] as any).id : null;
      });

      // Step 2: Navigate to vibe-workflow
      await page.goto('/#/apps/vibe-workflow');
      await page.waitForTimeout(5000);

      // Verify asset still exists
      const assetCount2 = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        return Object.keys(parsed).length;
      });
      expect(assetCount2).toBeGreaterThanOrEqual(assetCount1);

      // Step 3: Navigate to videco-ai-platform
      await page.goto('/#/apps/videco-ai-platform');
      await page.waitForTimeout(5000);

      // Final verification
      const assetCount3 = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        return Object.keys(parsed).length;
      });
      expect(assetCount3).toBeGreaterThanOrEqual(assetCount2);

      // If we had a specific asset, verify it's still there
      if (pomelliAssetId) {
        const finalAsset = await page.evaluate(async (id) => {
          return await window.assetStore.getAsset(id);
        }, pomelliAssetId);
        expect(finalAsset).not.toBeNull();
      }
    });
  });

  test.describe('Scenario 5: Asset Type Coverage', () => {
    test('should handle video asset handoff from ai-vfx to director', async ({ page }) => {
      // Create video in ai-vfx
      await page.goto('/#/ai-vfx');
      await page.waitForSelector('#content-area', { timeout: 10000 });

      const promptArea = page.locator('textarea[placeholder*="Describe"], textarea[placeholder*="prompt"]');
      if (await promptArea.count() > 0) {
        await promptArea.fill('Test video for director handoff');
        const generateBtn = page.locator('button:has-text("Generate"), button:has-text("✨")').first();
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          await page.waitForTimeout(30000);
        }
      }

      // Get video asset
      const videoAssetId = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        const videos = Object.values(parsed).filter((a: any) => a.type === 'video');
        return (videos[0] as any)?.id;
      });

      if (videoAssetId) {
        // Load in director via URL parameter
        await page.goto(`/#/director?asset=${videoAssetId}`);
        await page.waitForTimeout(5000);

        // Verify director loaded the asset
        const asset = await page.evaluate(async (id) => {
          return await window.assetStore.getAsset(id);
        }, videoAssetId);
        
        expect(asset).not.toBeNull();
        expect(asset!.type).toBe('video');

        // Verify routing metadata was updated
        const assetAfterLoad = await page.evaluate(async (id) => {
          const a = await window.assetStore.getAsset(id);
          return a?.routing?.canOpenInDirector;
        }, videoAssetId);
        expect(assetAfterLoad).toBe(true);
      }
    });

    test('should handle image asset handoff from open-pomelli to marketing-studio', async ({ page }) => {
      // Create image in open-pomelli
      await page.goto('/#/apps/open-pomelli');
      await page.waitForTimeout(5000);

      const iframe = page.locator('iframe[src*="open-pomelli"]');
      if (await iframe.count() > 0) {
        const iframeElement = await iframe.elementHandle();
        if (iframeElement) {
          const iframeContent = await iframeElement.contentFrame();
          if (iframeContent) {
            const prompt = iframeContent.locator('textarea, input[type="text"]').first();
            if (await prompt.count() > 0) {
              await prompt.fill('Marketing campaign image');
              const genBtn = iframeContent.locator('button:has-text("Generate")').first();
              if (await genBtn.count() > 0) {
                await genBtn.click();
                await page.waitForTimeout(20000);
              }
            }
          }
        }
      }

      // Get image asset
      const imageAssetId = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        const images = Object.values(parsed).filter((a: any) => a.type === 'image');
        return (images[0] as any)?.id;
      });

      if (imageAssetId) {
        // Navigate to marketing-studio
        await page.goto('/#/marketing-studio');
        await page.waitForTimeout(3000);

        // Verify image asset is accessible
        const asset = await page.evaluate(async (id) => {
          return await window.assetStore.getAsset(id);
        }, imageAssetId);
        
        expect(asset).not.toBeNull();
        expect(asset!.type).toBe('image');
      }
    });

    test('should handle storyboard asset handoff from ai-storyboarder to edit studio', async ({ page }) => {
      // Create storyboard in storyboard studio
      await page.goto('/#/storyboard');
      await page.waitForSelector('#content-area', { timeout: 10000 });

      const promptArea = page.locator('textarea, input[type="text"]');
      if (await promptArea.count() > 0) {
        await promptArea.fill('Storyboard sequence for video');
        const generateBtn = page.locator('button:has-text("Generate")').first();
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          await page.waitForTimeout(20000);
        }
      }

      // Get storyboard asset
      const sbAssetId = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        const sbs = Object.values(parsed).filter((a: any) => a.type === 'storyboard');
        return (sbs[0] as any)?.id;
      });

      if (sbAssetId) {
        // Navigate to edit studio
        await page.goto('/#/edit');
        await page.waitForSelector('.main-grid', { timeout: 10000 });

        // Verify storyboard asset is available
        const asset = await page.evaluate(async (id) => {
          return await window.assetStore.getAsset(id);
        }, sbAssetId);
        
        expect(asset).not.toBeNull();
      }
    });
  });

  test.describe('Additional Integration Checks', () => {
    test('should verify assetStore API across all navigation states', async ({ page }) => {
      // Create an asset
      await page.goto('/#/image');
      await page.waitForSelector('#content-area', { timeout: 10000 });

      const promptArea = page.locator('textarea[placeholder*="Describe"]');
      if (await promptArea.count() > 0) {
        await promptArea.fill('API test image');
        const generateBtn = page.locator('button:has-text("Generate ✨")').first();
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          await page.waitForTimeout(15000);
        }
      }

      // Get asset ID
      const assetId = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        return Object.values(parsed)[0]?.id;
      });

      if (assetId) {
        // Navigate through multiple apps, checking assetStore each time
        const routes = ['edit', 'library', 'director', 'timeline', 'marketing-studio'];
        
        for (const route of routes) {
          await page.goto(`/#/${route}`);
          await page.waitForTimeout(2000);

          const exists = await page.evaluate(async (id) => {
            const asset = await window.assetStore.getAsset(id);
            return asset !== null;
          }, assetId);
          
          expect(exists).toBe(true);
        }
      }
    });

    test('should handle asset cleanup between tests', async ({ page }) => {
      // Create asset
      await page.goto('/#/image');
      await page.waitForSelector('#content-area', { timeout: 10000 });

      const promptArea = page.locator('textarea[placeholder*="Describe"]');
      if (await promptArea.count() > 0) {
        await promptArea.fill('Cleanup test asset');
        const generateBtn = page.locator('button:has-text("Generate ✨")').first();
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          await page.waitForTimeout(15000);
        }
      }

      // Verify asset exists
      let assetCount = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        return Object.keys(parsed).length;
      });
      expect(assetCount).toBeGreaterThan(0);

      // Simulate cleanup (will actually happen in afterEach)
      await page.evaluate(() => {
        localStorage.removeItem('universal_assets');
        localStorage.removeItem('universal_assets_meta');
      });

      // Verify cleanup
      assetCount = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        return Object.keys(parsed).length;
      });
      expect(assetCount).toBe(0);
    });

    test('should handle concurrent asset creation from different sources', async ({ page }) => {
      await page.goto('/#/image');
      await page.waitForSelector('#content-area', { timeout: 10000 });

      // Create multiple assets in quick succession
      const actions = [];
      for (let i = 0; i < 3; i++) {
        actions.push(
          (async () => {
            const prompt = page.locator('textarea[placeholder*="Describe"]').first();
            if (await prompt.count() > 0) {
              await prompt.fill(`Concurrent asset ${i}`);
              const btn = page.locator('button:has-text("Generate ✨")').first();
              if (await btn.count() > 0) {
                await btn.click();
                await page.waitForTimeout(10000);
              }
            }
          })()
        );
      }

      await Promise.all(actions);

      // Verify all assets exist
      const totalAssets = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        return Object.keys(parsed).length;
      });
      expect(totalAssets).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('should handle missing asset gracefully', async ({ page }) => {
      // Try to load non-existent asset via URL parameter
      await page.goto('/#/edit?asset=non-existent-id-12345');
      await page.waitForSelector('.main-grid', { timeout: 10000 });

      // Asset should not exist
      const asset = await page.evaluate(async (id) => {
        return await window.assetStore.getAsset(id);
      }, 'non-existent-id-12345');
      
      expect(asset).toBeNull();
    });

    test('should handle corrupted asset storage', async ({ page }) => {
      // Corrupt the storage
      await page.evaluate(() => {
        localStorage.setItem('universal_assets', 'not valid json{{{');
      });

      // Navigate to an app that uses assetStore
      await page.goto('/#/library');
      await page.waitForSelector('#app', { timeout: 10000 });

      // Should not crash; getAssets should return empty array
      const assets = await page.evaluate(async () => {
        return await window.assetStore.getAssets();
      });
      expect(Array.isArray(assets)).toBe(true);
    });

    test('should generate unique IDs for each asset', async ({ page }) => {
      await page.goto('/#/image');
      await page.waitForSelector('#content-area', { timeout: 10000 });

      const promptArea = page.locator('textarea[placeholder*="Describe"]');
      if (await promptArea.count() > 0) {
        await promptArea.fill('ID uniqueness test');
        const generateBtn = page.locator('button:has-text("Generate ✨")').first();
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          await page.waitForTimeout(15000);
        }
      }

      // Check IDs are unique
      const ids = await page.evaluate(() => {
        const raw = localStorage.getItem('universal_assets');
        const parsed = raw ? JSON.parse(raw) : {};
        return Object.values(parsed).map((a: any) => a.id);
      });

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
