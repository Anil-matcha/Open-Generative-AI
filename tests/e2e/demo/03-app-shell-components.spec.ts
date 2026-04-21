import { test, expect } from '@playwright/test';

test.describe('Demo Video: App Shell Components', () => {
  test('should demonstrate app shell components', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1, [data-testid="app-title"], .app-loaded', { timeout: 10000 });

    // Demonstrate header component
    const header = page.locator('header, [data-testid="app-header"]').first();
    if (await header.isVisible()) {
      await header.screenshot({ path: 'demo-screenshots/shell-header.png' });
    }

    // Demonstrate sidebar
    const sidebar = page.locator('aside, [data-testid="app-sidebar"], .sidebar').first();
    if (await sidebar.isVisible()) {
      await sidebar.screenshot({ path: 'demo-screenshots/shell-sidebar.png' });
    }

    // Demonstrate responsive design
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'demo-screenshots/shell-mobile-layout.png' });

    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'demo-screenshots/shell-tablet-layout.png' });

    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'demo-screenshots/shell-desktop-layout.png' });

    // Test component visibility
    await expect(page.locator('body')).toBeVisible();

    // Demonstrate layout changes on navigation
    const navItem = page.locator('[data-testid="timeline-nav"], text=/timeline/i').first();
    if (await navItem.isVisible()) {
      await navItem.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'demo-screenshots/shell-timeline-layout.png' });
    }
  });
});