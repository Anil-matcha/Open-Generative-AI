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
    
    // Get Started button should be visible
    await expect(page.getByRole('button', { name: /Try Timeline Editor Free/i })).toBeVisible();
  });

  test('should display app cards in grid', async ({ page }) => {
    await page.goto('/#/landing');
    await page.waitForSelector('[data-testid="app-card"]', { timeout: 10000 });
    
    // The apps grid section should be present with 33 apps
    const cards = page.locator('[data-testid="app-card"]');
    await expect(cards).toHaveCount(33);
    
    // First card should be visible
    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();
  });

  test('should have hero section', async ({ page }) => {
    await page.goto('/#/landing');
    await page.waitForSelector('[data-testid="hero-section"]', { timeout: 10000 });
    
    const hero = page.locator('[data-testid="hero-section"]');
    await expect(hero).toBeVisible();
  });

  test('should have apps grid section', async ({ page }) => {
    await page.goto('/#/landing');
    await page.waitForSelector('[data-testid="apps-grid-section"]', { timeout: 10000 });
    
    const grid = page.locator('[data-testid="apps-grid-section"]');
    await expect(grid).toBeVisible();
  });
});
