const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:3333',
    headless: true,
  },
  webServer: {
    command: 'npx serve . -l 3333 --no-clipboard',
    url: 'http://localhost:3333',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
