const { defineConfig, devices } = require('@playwright/test');

const frontendPort = process.env.PORT || 3000;
const backendPort = process.env.BACKEND_PORT || 3030;

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `npm run start:backend`,
      url: `http://127.0.0.1:${backendPort}`,
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: `npm run start:frontend`,
      url: `http://127.0.0.1:${frontendPort}`,
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
