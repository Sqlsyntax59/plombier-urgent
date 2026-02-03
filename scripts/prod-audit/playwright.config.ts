import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.AUDIT_BASE_URL || 'https://plombier-urgent.vercel.app';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'audit-results.json' }],
    ['list']
  ],
  timeout: 60000,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results/',
});
