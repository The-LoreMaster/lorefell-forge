/* A-req-1 and A-req-2 — the Level Up control is reachable in both of the sheet's homes.
 *
 * ORACLE: LEVELING_SPEC_BRIEF.md, Part A. Software behavior, so the brief is the spec.
 * No FellGuide number is asserted here; nothing in this file is a game rule.
 *
 *   A-req-1. A Fell with a crystal available shows the Level Up button.
 *   A-req-2. The same is true in the LoreMaster's god-sheet.
 *
 * WHY ONE SPEC COVERS BOTH. ensureSheet() in threadspire.html:6026 is the only place
 * #sheetFrame's src is ever set, and it always sets fellglass.html?host=threadspire. The
 * player's own sheet (threadspire.html:2970) and the god-sheet (2965) both go through
 * it. Same frame, same URL, same body.tsembed. So a button hidden by the embed styling
 * is hidden identically on both sides, and reachable on both sides once it is not.
 *
 * WHAT THIS IS DESIGNED TO CATCH. #lvlUpBtn lives inside <header> (fellglass.html:733),
 * and the embed stylesheet (fellglass.html:5665) hides the whole header:
 *
 *     body.tsembed header, ... { display:none!important }
 *
 * The visibility toggle itself is healthy: it is the last line of renderLore()
 * (fellglass.html:2743), and renderLore runs on every bridge load through
 * loadCharacter -> renderAll. So the button is correctly given its `show` class and is
 * still invisible, because a child cannot escape an ancestor hidden with !important.
 *
 * That distinction is asserted explicitly below rather than left implied: the tsembed
 * case checks that the class IS present and the button is STILL not visible. A test that
 * only checked visibility could be "fixed" by making the toggle fire more often, which
 * would fix nothing.
 */
const { test, expect } = require('@playwright/test');

const SHEET_HOST = '/threadspire/harness/sheet-host.html';
const CHAR_ID = 'chr-maerwen-0001';

/* A Fell holding exactly one Ascension Crystal.
 *
 * crystals() is floor(lorePoints / (level + 1)), so level 1 with 2 Lore Points is
 * floor(2/2) = 1: the smallest fixture that must show the button. loadCharacter runs
 * every record through seedSheet, so a partial record like this is filled out with
 * defaults rather than needing every field spelled here. */
const FELL_WITH_ONE_CRYSTAL = {
  identity: { name: 'Maerwen Ash' },
  lore: { level: 1, lorePoints: 2 },
  attrs: { vigor: { base: 2, mod: 0 }, power: { base: 1, mod: 0 } },
  armor: { level: 0 },
  weapons: [],
  lorebounds: []
};

async function mountSheet(page, home, record) {
  await page.goto(SHEET_HOST);
  await page.waitForFunction(() => !!window.FSH);
  await page.evaluate(
    (c) => window.FSH.mount(c),
    { record, home, charId: CHAR_ID }
  );
  const el = await page.waitForSelector('iframe#fg');
  const frame = await el.contentFrame();
  /* Wait for the record to have actually loaded, not merely for the frame to exist.
   * C and crystals are top-level let/const bindings, so they are reached bare rather
   * than through window. */
  await frame.waitForFunction(() => typeof C !== 'undefined' && !!C && !!C.lore);
  await frame.waitForFunction(() => C.lore.lorePoints === 2 && C.lore.level === 1);
  return frame;
}

test.describe('A-req-1 / A-req-2 the Level Up button is reachable', () => {

  test('the fixture really does hold a crystal', async ({ page }) => {
    const frame = await mountSheet(page, 'standalone', FELL_WITH_ONE_CRYSTAL);

    /* If this ever fails, every other assertion in this file is meaningless: the button
     * would be correctly hidden and we would be testing nothing. */
    expect(await frame.evaluate(() => crystals())).toBe(1);
  });

  test('standalone: the button is visible', async ({ page }) => {
    const frame = await mountSheet(page, 'standalone', FELL_WITH_ONE_CRYSTAL);

    /* The control. The sheet's own page has no tsembed class, so this is the behaviour
     * the embed is supposed to match. */
    await expect(frame.locator('#lvlUpBtn')).toBeVisible();
  });

  test('A-req-1 in ThreadSpire: the button is visible', async ({ page }) => {
    const frame = await mountSheet(page, 'threadspire', FELL_WITH_ONE_CRYSTAL);

    /* Same Fell, same crystal, the home ThreadSpire actually uses. */
    expect(await frame.evaluate(() => document.body.classList.contains('tsembed'))).toBe(true);
    await expect(frame.locator('#lvlUpBtn')).toBeVisible();
  });

  test('the button is not hidden by the toggle, but by the embed styling', async ({ page }) => {
    const frame = await mountSheet(page, 'threadspire', FELL_WITH_ONE_CRYSTAL);

    /* renderLore() did its job: the class is on. */
    expect(
      await frame.evaluate(() => document.getElementById('lvlUpBtn').classList.contains('show')),
      'renderLore() should have applied the show class'
    ).toBe(true);

    /* And the header above it is what removes it from the page. Naming the ancestor is
     * what makes this a diagnosis rather than an observation. */
    const headerHidden = await frame.evaluate(() => {
      const h = document.querySelector('header');
      return h ? getComputedStyle(h).display === 'none' : null;
    });
    expect(headerHidden, 'the embed stylesheet should no longer hide the whole header').toBe(false);

    /* .hd-btns is the box the design constraint says must survive, because LM Mode
     * lives there too. */
    await expect(frame.locator('.hd-btns')).toBeVisible();
    await expect(frame.locator('#lvlUpBtn')).toBeVisible();
  });

});
