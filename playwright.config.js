// @ts-check
const { defineConfig } = require('@playwright/test');

// Use the pre-installed Chromium (this environment ships one and blocks
// re-downloads). Override with PW_CHROMIUM_PATH if your machine differs.
const CHROMIUM = process.env.PW_CHROMIUM_PATH || '/opt/pw-browsers/chromium';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3457',
    trace: 'on-first-retry',
    // Smoke tests assert UI rendering only, so they pass even when the
    // external Supabase/Mapbox/font CDNs are unreachable (sandbox/CI).
    launchOptions: { executablePath: CHROMIUM },
  },
  projects: [
    { name: 'mobile',  use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'python3 -m http.server 3457',
    url: 'http://localhost:3457',
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
