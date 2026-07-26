const { defineConfig, devices } = require('@playwright/test');
const spart = require('@sparticuz/chromium').default;

// the browser CDN is blocked here, so tests run on the chromium binary shipped
// inside @sparticuz/chromium (see SCHEMA.md deviation 5)
// --single-process makes closing one context kill the shared browser, which
// failed every second test. Strip it; keep the sandbox flags the binary needs.
const args = spart.args.filter((a) => a !== '--single-process');
const launchOptions = { executablePath: '/tmp/chromium', args };

module.exports = defineConfig({
  testDir: './tests',
  // tests/ also holds the jsdom unit tests, which are plain node scripts run by
  // `npm run checks` from the repo root. Playwright's default testMatch collects
  // *.test.js as well as *.spec.js, so without this it picks those up and fails
  // each one with "no tests found in file". Only the .spec.js files are Playwright's.
  testMatch: '**/*.spec.js',
  timeout: 30000,
  retries: 0,
  globalSetup: require.resolve('./global-setup.js'),
  use: { baseURL: 'http://127.0.0.1:4173', launchOptions },
  webServer: {
    command: 'npx http-server -p 4173 -s -c-1 .',
    url: 'http://127.0.0.1:4173/dist/threadspire.html',
    reuseExistingServer: true,
    timeout: 20000
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 }, launchOptions } },
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium', launchOptions } }
  ]
});
