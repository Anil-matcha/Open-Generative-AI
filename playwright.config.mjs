import { defineConfig } from '@playwright/test';
import { randomBytes } from 'node:crypto';

process.env.STUDIO_TEST_PASSWORD ||= randomBytes(24).toString('hex');
const secret = randomBytes(32).toString('hex');
export default defineConfig({
  testDir: './tests/browser',
  outputDir: 'work/browser-results',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:3210',
    headless: true,
    screenshot: 'only-on-failure',
    launchOptions: process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } } : {},
  },
  webServer: {
    command: 'npm start -- --hostname 127.0.0.1 --port 3210',
    url: 'http://127.0.0.1:3210/login',
    reuseExistingServer: false,
    env: { STUDIO_PASSWORD: process.env.STUDIO_TEST_PASSWORD, STUDIO_SESSION_SECRET: secret, ENABLE_PAID_APIS: 'false' },
  },
});
