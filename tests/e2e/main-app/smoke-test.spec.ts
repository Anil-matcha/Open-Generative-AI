import { test, expect } from '@playwright/test';

// All routes from router and navigation tests
const routes = [
  // Core routes
  'timeline',
  'library',
  'settings',
  'explore',
  'image',
  'video',
  'storyboard',
  'edit',
  'character',
  'effects',
  'vfx',
  'ai-vfx',
  'cinema',
  'influencer',
  'apps',
  'templates',
  'assist',
  'community',
  'avatar',
  'audio',
  'headshots',
  // Extended routes
  'upscale',
  'training',
  'videotools',
  'chat',
  'lipsync',
  'video-agent',
  'director',
  'tiktok-carousel',
  'runway-motion',
  'advanced-dubbing',
  'commercial',
  'render',
  'remix-go',
  // Template routes
  'text-to-image',
  'image-to-image',
  'text-to-video',
  'image-to-video',
  'video-to-video',
  'video-watermark',
  // Page routes
  'character-page',
  'effects-page',
  'cinema-page',
  'influencer-page',
  'commercial-page',
  'upscale-page',
  'training-page',
  'video-tools-page',
  'chat-page',
  'lipsync-page',
  'video-agent-page',
  'director-page',
  'tiktok-carousel-page',
  'runway-motion-page',
  'advanced-dubbing-page',
  // landing is special - it's a full-page without app shell
  // 'landing' - skipped
  // Root
  ''
];

test.describe('Smoke Test - Route Console Health', () => {
  for (const route of routes) {
    test(`should load route /${route || ''} without console errors`, async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      const url = route ? `/#/${route}` : '/';
      await page.goto(url);
      await page.waitForTimeout(1500);

      // Filter out benign errors (favicon, extensions, etc.)
      const criticalErrors = consoleErrors.filter(err =>
        !err.includes('favicon') &&
        !err.includes('net::ERR_ABORTED') &&
        !err.includes(' Chrome ')
      );

      expect(criticalErrors).toEqual([]);
    });
  }
});
