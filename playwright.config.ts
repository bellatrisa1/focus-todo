import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:3108', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: {
    command:
      'npm run build && npm run start -- --hostname 127.0.0.1 --port 3108',
    env: { FOCUS_BUILD_DIR: '.next-test' },
    timeout: 120000,
    url: 'http://127.0.0.1:3108',
    reuseExistingServer: false,
  },
});
