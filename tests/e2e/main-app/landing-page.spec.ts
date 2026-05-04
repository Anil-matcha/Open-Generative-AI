import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load landing page and show hero', async ({ page }) => {
    await page.goto('/');
    
    // Wait for landing page hero to appear
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // URL should contain landing hash
    await expect(page).toHaveURL(/.+#\/landing/);
    
    // Hero headline (checking partial text)
    await expect(page.locator('h1')).toContainText('ONE TIMELINE');
    
    // Feature grid should be present
    await expect(page.locator('.feature-grid-section')).toBeVisible();
    
    // Get Started button
    await expect(page.getByRole('button', { name: /Get Started/i })).toBeVisible();
  });

  test('should have navigation links in header', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('header', { timeout: 10000 });
    
    // Header should contain key nav links
    const header = page.locator('header').first();
    await expect(header).toContainText('Explore');
    await expect(header).toContainText('Image');
    await expect(header).toContainText('Video');
    await expect(header).toContainText('Timeline'); // Added
    await expect(header).toContainText('Apps');
  });

  test('should display feature cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.feature-card', { timeout: 10000 });
    
    // Total cards: 8 (core) + 1 (featured timeline) + 15 (remaining) = 24? Wait our list: 23? Let's count
    // ALL_FEATURES length = 23 (we defined). Slice(0,8)=8, plus featured 1, plus slice(8)=15 => total 24.
    // Actually 8+1+15 = 24, not 21 earlier. Let's compute: 
    // ALL_FEATURES has 23 items (we listed 23 lines from timeline to library). 
    // First grid: 8
    // Featured: 1
    // Remaining: ALL_FEATURES.slice(8) => 23 - 8 = 15
    // Total = 24
    // But our earlier count 21 came from older count. Let's adjust to actual count.
    // For robustness, let's assert count > 20
    const cards = page.locator('.feature-card');
    await expect(cards).toHaveCount(24);
    
    // Hover over first card should show "Try" arrow
    const firstCard = cards.first();
    await firstCard.hover();
    await expect(firstCard.locator('text=Try')).toBeVisible();
  });
});
