const { defineConfig, devices } = require('@playwright/test');

/* Playwright config for the tabletop harness. Separate from playwright.config.js on
 * purpose; that one is the Fellwake semantic-zoom explorer and is left alone.
 *
 * Why not reuse it:
 *
 *  - It pins executablePath to '/tmp/chromium', the binary @sparticuz/chromium unpacks.
 *    That is a Linux serverless build and the path does not exist on Windows, so the
 *    config cannot launch a browser here at all. This one sets no executablePath, which
 *    is how you ask for the standard chromium Playwright keeps in its own cache
 *    (ms-playwright), resolved per platform.
 *  - Its global-setup.js sets process.env.FW_CHROMIUM and nothing ever reads it. The
 *    variable is dead, so there is no globalSetup here rather than an inherited one that
 *    does nothing.
 *
 * What IS reused is the shape: a local http-server, and desktop plus mobile projects.
 *
 * testDir is ./harness/specs, not ./tests. The zoom config's testDir is ./tests and
 * Playwright globs it recursively, so a spec dropped under tests/ would be collected by
 * the zoom run too. Keeping these specs outside tests/ is what leaves that config
 * genuinely untouched.
 *
 * The server serves the REPOSITORY ROOT (..), not threadspire/, because the harness has
 * to embed docs/threadspire.html. Same origin matters: the specs reach into the iframe
 * to read the page's own state, and a cross-origin frame would make that impossible.
 *
 * Port 4174 so a zoom run already holding 4173 does not collide.
 */

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}`;

module.exports = defineConfig({
  testDir: './harness/specs',
  timeout: 45000,
  /* The state feed pulls on a 1100ms beat, so a cross-side assertion has to be allowed
   * to wait through a beat or two without the default 5s expect timeout cutting it off. */
  expect: { timeout: 10000 },
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: `npx http-server .. -p ${PORT} -s -c-1`,
    url: `${BASE}/threadspire/harness/host.html`,
    reuseExistingServer: true,
    timeout: 30000
  },
  projects: [
    {
      name: 'desktop',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], browserName: 'chromium' }
    }
  ]
});
