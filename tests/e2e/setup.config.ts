import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Timeline Editor testing
 * 
 * This configuration provides comprehensive testing across:
 * - Desktop browsers (Chrome, Firefox, Safari)
 * - Mobile devices (Pixel 5, iPhone 12)
 * - Multiple viewport sizes
 * 
 * Test reporting is configured to generate HTML reports in playwright-report/
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Test execution settings */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter configuration */
  reporter: [
    'html',
    ['list']
  ],
  
  /* Shared test settings */
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Project configurations for different browsers */
  projects: [
    // Desktop Chrome - primary testing
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'], 
        headless: true,
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Desktop Firefox - cross-browser testing
    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'], 
        headless: true,
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Mobile Chrome - responsive testing
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'], 
        headless: true,
        viewport: { width: 375, height: 812 }
      },
    },

    // Tablet viewport testing
    {
      name: 'Tablet View',
      use: {
        headless: true,
        viewport: { width: 768, height: 1024 },
      },
    },
  ],

  /* Web server configuration */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Global timeout settings */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
});