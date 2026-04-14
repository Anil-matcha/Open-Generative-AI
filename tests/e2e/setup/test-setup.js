import { test as base } from '@playwright/test';

// Extend base test with common fixtures
export const test = base.extend({
  // Mock API responses
  mockAPI: async ({ page }, use) => {
    await page.route('**/api/**', async route => {
      const url = route.request().url();

      // Mock common API responses
      if (url.includes('/api/generate/image')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            imageUrl: 'https://example.com/mock-image.jpg'
          })
        });
      } else if (url.includes('/api/user/profile')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user123',
            name: 'Test User',
            email: 'test@example.com'
          })
        });
      } else {
        await route.continue();
      }
    });

    await use(page);
  },

  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token');
      localStorage.setItem('user_id', 'user123');
    });

    await use(page);
  }
});

export { expect } from '@playwright/test';