import { test, expect } from '@playwright/test';

test.describe('Demo Video: Library & Asset Browsing', () => {
  test('should demonstrate media library browsing and search', async ({ page }) => {
    await page.goto('/library', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="library"], .library', { timeout: 10000 });

    // Screenshot initial library grid
    await page.screenshot({ path: 'demo-screenshots/library-initial-grid.png' });

    // Demonstrate media grid display
    const mediaGrid = page.locator('[data-testid="media-grid"], .media-grid, [class*="grid"]').first();
    if (await mediaGrid.isVisible()) {
      await mediaGrid.screenshot({ path: 'demo-screenshots/library-media-grid.png' });
    }

    // Demonstrate search functionality
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[placeholder*="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('video');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'demo-screenshots/library-search-video.png' });

      await searchInput.fill('image');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'demo-screenshots/library-search-image.png' });

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    // Demonstrate type filtering
    const filterButtons = ['All', 'Video', 'Image', 'Audio', 'Text'];
    for (const filter of filterButtons) {
      const filterBtn = page.locator(`[data-testid="${filter.toLowerCase()}-filter"], button:has-text("${filter}")`).first();
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `demo-screenshots/library-filter-${filter.toLowerCase()}.png` });
      }
    }

    // Demonstrate media item interaction
    const mediaItems = page.locator('[data-testid="media-item"], .media-item');
    const itemCount = await mediaItems.count();
    console.log(`Found ${itemCount} media items`);

    if (itemCount > 0) {
      // Hover over first item
      await mediaItems.first().hover();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/library-item-hover.png' });

      // Click on first item
      await mediaItems.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'demo-screenshots/library-item-selected.png' });
    }

    // Demonstrate pagination or infinite scroll if present
    const loadMore = page.locator('[data-testid="load-more"], button:has-text("Load More")').first();
    if (await loadMore.isVisible()) {
      await loadMore.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'demo-screenshots/library-load-more.png' });
    }

    // Verify library components are present
    await expect(page.locator('[data-testid="library"]')).toBeVisible();
  });
});