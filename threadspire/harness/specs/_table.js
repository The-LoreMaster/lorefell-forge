/* Shared helpers for the tabletop scenarios.
 *
 * Named with a leading underscore so Playwright's default testMatch (**\/*.spec.js)
 * does not collect it as a spec.
 */
const path = require('path');
const FIXTURES = require(path.join(__dirname, '..', 'fixtures.js'));

const HOST = '/threadspire/harness/host.html';

/* Stand the table up: load the mock parent, arrange both bindings, then let the frames
 * boot. Mounting after load rather than from the URL is deliberate; see TSH.mount. */
async function openTable(page, cfg) {
  await page.goto(HOST);
  await page.waitForFunction(() => !!window.TSH && !!window.TS_FIXTURES);
  await page.evaluate((c) => window.TSH.mount(c), cfg);
}

/* The document inside one of the two iframes. */
async function frameFor(page, which) {
  const el = await page.waitForSelector(`iframe[name="ts-${which}"]`);
  const frame = await el.contentFrame();
  if (!frame) throw new Error(`no content frame for ts-${which}`);
  return frame;
}

/* Boot is a two-step handshake: THREADSPIRE_ROLE_HINT paints the right side, then
 * THREADSPIRE_CONTEXT confirms it and carries the adventure. Asserting after only the
 * hint races the page, so wait for the embed to have taken a real context. */
async function waitBooted(page, frame, which) {
  await page.waitForFunction((w) => window.TSH.booted(w), which);
  await frame.waitForFunction(() => !!window.S && window.S.roleReady === true);
}

async function openTableAndBoot(page, cfg) {
  await openTable(page, cfg);
  const out = {};
  for (const which of Object.keys(cfg).filter((k) => k === 'lm' || k === 'player')) {
    out[which] = await frameFor(page, which);
    await waitBooted(page, out[which], which);
  }
  return out;
}

/* Open a rail window inside a frame and wait for its body to render. */
async function openWindow(frame, key) {
  await frame.evaluate((k) => window.openWin(k), key);
  await frame.waitForFunction((k) => window.S && window.S.openSection === k, key);
}

/* The Seams window, read back as a plain object keyed by its left-hand labels.
 *
 * The Seams panel exists to let two tables be compared line by line, which makes it the
 * natural place to assert from: it is the page's own account of what it believes, in
 * the page's own words. */
async function seams(frame) {
  await openWindow(frame, 'seams');
  await frame.waitForSelector('#win .seam-row');
  return frame.evaluate(() => {
    const out = {};
    document.querySelectorAll('#win .seam-row').forEach((r) => {
      const k = r.querySelector('.seam-k');
      const v = r.querySelector('.seam-v');
      if (k) out[k.textContent.trim()] = v ? v.textContent.trim() : '';
    });
    return out;
  });
}

/* Parse the "Story here" line into numbers.
 *
 * The line is asserted by its COUNTS, not by its exact phrasing: requirement A1 says the
 * Seams window must report the act/scene count, and pinning the sentence word for word
 * would make a copy edit look like a regression. A story that failed to load reports
 * "no story loaded ..." and has no numbers at all, so null is the honest answer there.
 */
function parseStoryHere(line) {
  const m = /(\d+)\s+acts?,\s*(\d+)\s+scenes?/.exec(String(line || ''));
  if (!m) return null;
  return { acts: Number(m[1]), scenes: Number(m[2]) };
}

/* Is the "Still here" modal up? That is the page saying a switch never happened, and
 * requirement A2 says it must not appear on a switch that worked. */
async function stillHereShowing(frame) {
  return frame.evaluate(() => {
    const t = Array.from(document.querySelectorAll('.tsm-title'));
    return t.some((el) => /Still here/i.test(el.textContent || '') && !!el.offsetParent);
  });
}

/* Is the traversal veil still covering the table? It lifts when the new adventure's
 * state actually arrives. */
async function veiled(frame) {
  return frame.evaluate(() => {
    const el = document.getElementById('advGo');
    return !!el && el.style.display === 'flex';
  });
}

module.exports = {
  FIXTURES,
  HOST,
  openTable,
  openTableAndBoot,
  frameFor,
  waitBooted,
  openWindow,
  seams,
  parseStoryHere,
  stillHereShowing,
  veiled
};
