import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive E2E testing configuration for Open-Higgsfield-AI ecosystem
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000
  },

  projects: [
    // Main app testing
    {
      name: 'main-app-chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
      testMatch: '**/main-app/**/*.spec.js'
    },
    {
      name: 'main-app-firefox',
      use: { ...devices['Desktop Firefox'], headless: true },
      testMatch: '**/main-app/**/*.spec.js'
    },
    {
      name: 'main-app-mobile',
      use: { ...devices['Pixel 5'], headless: true },
      testMatch: '**/main-app/**/*.spec.js'
    },

    // Module integration testing
    {
      name: 'modules-chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
      testMatch: '**/modules/**/*.spec.js'
    },

    // App integration testing
    {
      name: 'apps-chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
      testMatch: '**/apps/**/*.spec.js'
    },

    // Performance testing
    {
      name: 'performance',
      use: { ...devices['Desktop Chrome'], headless: true },
      testMatch: '**/performance/**/*.spec.js'
    },

    // Accessibility testing
    {
      name: 'accessibility',
      use: { ...devices['Desktop Chrome'], headless: true },
      testMatch: '**/accessibility/**/*.spec.js'
    }
  ],

  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:8080',
      reuseExistingServer: !process.env.CI,
      timeout: 120000
    },
    // Module servers for integration testing
    {
      command: 'cd modules/CineGen && npm run dev',
      url: 'http://localhost:8081',
      reuseExistingServer: !process.env.CI,
      timeout: 60000
    },
    {
      command: 'cd apps/director && npm run dev',
      url: 'http://localhost:8082',
      reuseExistingServer: !process.env.CI,
      timeout: 60000
    }
  ],

  globalSetup: './tests/e2e/setup/global-setup.js',
  globalTeardown: './tests/e2e/setup/global-teardown.js'
});