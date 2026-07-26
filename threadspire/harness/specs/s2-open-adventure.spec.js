/* S2 — the LoreMaster opens the chosen adventure.
 *
 * This is the exact path that has been breaking, so it is written as a permanent guard:
 * boot on one adventure, switch to another through Settings the way a LoreMaster
 * actually does it, and require the new story to stand up.
 *
 * ORACLE: THREADSPIRE_REQUIREMENTS.md, section A. Software behavior, so the requirements
 * list is the spec. The FellGuide has nothing to say about adventure switching and never
 * will; it governs D2 and section E, which S2 does not touch.
 *
 *   A1. Opening an adventure loads its story. Acts and scenes present, not an empty
 *       table, and the Seams window's "Story here" line reports the act/scene count.
 *   A2. Switching adventures inside ThreadSpire works. From one adventure, open Settings,
 *       pick another, press "Open the chosen adventure". The new adventure's story must
 *       stand up. No "Still here". No empty table.
 *
 * Every expected number is derived from the fixture by the same walk seamsBody() does,
 * so the fixture stays the single source of truth.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;
const BEACONS = F.countStory(F.BEACONS);
const STONE = F.countStory(F.STONE);

/* The LoreMaster alone. S2 is about the adventure standing up, and a second frame would
 * only add noise to that. */
function loremaster() {
  return {
    lm: {
      role: 'lm',
      campaignId: F.CAMPAIGN_A,
      party: F.PARTY_A,
      campaignList: F.CAMPAIGN_LIST
    }
  };
}

/* Drive the switch through the real UI: Settings, the dropdown, the button. Reaching in
 * and calling advSwitch() directly would skip the part that keeps breaking. */
async function switchAdventure(frame, toId) {
  await frame.evaluate(() => window.openWin('settings'));
  await frame.waitForSelector('#advSel');
  await frame.selectOption('#advSel', toId);
  const go = frame.locator('button.st-add', { hasText: 'Open the chosen adventure' });
  await go.click();
}

test.describe('S2 the LoreMaster opens the chosen adventure', () => {

  test('A1 the adventure it boots on has its story', async ({ page }) => {
    const { lm } = await T.openTableAndBoot(page, loremaster());

    /* The spine is built from rawCampaign on the context, so wait for it rather than
     * reading a half-built table. */
    await lm.waitForFunction(
      (n) => !!window.S.adventure && (window.S.adventure.acts || []).length === n,
      BEACONS.acts
    );

    const rows = await T.seams(lm);
    const story = T.parseStoryHere(rows['Story here']);

    expect(story, `"Story here" reported no counts: ${rows['Story here']}`).not.toBeNull();
    expect(story).toEqual(BEACONS);
    expect(rows['Adventure']).toContain(F.BEACONS.name);
  });

  test('A2 switching to another adventure stands its story up', async ({ page }) => {
    const { lm } = await T.openTableAndBoot(page, loremaster());

    await lm.waitForFunction(
      (n) => (window.S.adventure.acts || []).length === n,
      BEACONS.acts
    );

    await switchAdventure(lm, F.CAMPAIGN_B);

    /* The table is now bound to the other adventure ... */
    await lm.waitForFunction((id) => window.S.campaignId === id, F.CAMPAIGN_B);

    /* ... and its story arrived. advReset() blanks the table to a single unnamed act and
     * scene on the way through, so waiting for the real count is also what distinguishes
     * "the new story stood up" from "the table was emptied and left that way". */
    await lm.waitForFunction(
      (n) => (window.S.adventure.acts || []).length === n,
      STONE.acts
    );

    const rows = await T.seams(lm);
    const story = T.parseStoryHere(rows['Story here']);

    expect(story, `"Story here" reported no counts: ${rows['Story here']}`).not.toBeNull();
    expect(story).toEqual(STONE);
    expect(story).not.toEqual(BEACONS);
    expect(rows['Adventure']).toContain(F.STONE.name);

    /* The traversal veil lifts when the new table's state has actually arrived. Still
     * showing means the switch never completed, whatever the counters say. */
    expect(await T.veiled(lm), 'the traversal veil never lifted').toBe(false);

    /* And pushes are no longer gated, which is the page's own signal that it considers
     * itself arrived rather than still between adventures. */
    expect(rows['Between adventures']).toBe('no');
  });

  test('A2 no "Still here" after a switch that worked', async ({ page }) => {
    const { lm } = await T.openTableAndBoot(page, loremaster());

    await lm.waitForFunction(
      (n) => (window.S.adventure.acts || []).length === n,
      BEACONS.acts
    );

    const clickedAt = Date.now();
    await switchAdventure(lm, F.CAMPAIGN_B);
    await lm.waitForFunction((id) => window.S.campaignId === id, F.CAMPAIGN_B);

    /* advSwitch() arms a 9 second check that puts up "Still here" if the veil is still
     * covering the table. Asserting straight away would pass before that could ever fire,
     * so wait the timer out. This is the whole point of the guard. */
    const STILL_HERE_AFTER_MS = 9000;
    const elapsed = Date.now() - clickedAt;
    if (elapsed < STILL_HERE_AFTER_MS + 800) {
      await page.waitForTimeout(STILL_HERE_AFTER_MS + 800 - elapsed);
    }

    expect(await T.stillHereShowing(lm), '"Still here" appeared after a switch that worked').toBe(false);

    /* Still the right adventure, still its story: the timer must not have quietly torn
     * anything down on its way past. */
    const rows = await T.seams(lm);
    expect(T.parseStoryHere(rows['Story here'])).toEqual(STONE);
  });

  test('A1 the story is not the standalone demo bench', async ({ page }) => {
    const { lm } = await T.openTableAndBoot(page, loremaster());

    await lm.waitForFunction(
      (n) => (window.S.adventure.acts || []).length === n,
      BEACONS.acts
    );

    /* Opened outside a parent frame ThreadSpire falls back to a demo adventure, "The
     * Silent Beacon". Seeing that here would mean tsEmbedded() was false and the whole
     * harness had failed to be a parent, with every other assertion passing against the
     * wrong page. */
    const name = await lm.evaluate(() => window.S.adventure.name);
    expect(name).toBe(F.BEACONS.name);
    expect(name).not.toMatch(/Silent Beacon/i);
  });

});
