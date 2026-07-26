/* S5 — persistence. Does the table remember?
 *
 * ORACLE: THREADSPIRE_REQUIREMENTS.md, section C.
 *
 *   C1. The table opens on the scene you left, not the first scene.
 *   C3. Tokens and maps survive a reload, coming back from the shared store.
 *   C5. Switching adventures does not carry the old board over.
 *
 * The test plan puts S5 after a Beat of combat. These three need no combat, so they are
 * written now rather than held behind S3: they are the "does it remember" questions, and
 * they catch the whole class of "it's gone" bugs on their own.
 *
 * A reload here means the embed's document is thrown away while the shared store stands.
 * Anything on the table afterwards had to come back from the store. That is the only way
 * to tell persistence from a page that simply never re-rendered.
 *
 * C2 (each scene keeps its own board) is deliberately NOT here. applyRemoteSnapshot
 * ignores snap.instance.bindings for 8 seconds after the spine is loaded from a context
 * (the S._advTouch gate), so a bindings assertion on reload either sleeps past that
 * window or races it. It deserves a test built around that gate rather than one that
 * happens to sleep long enough; see the note at the end of the harness README.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

/* The last scene of Beacons, so "opened where I left it" cannot be confused with
 * "opened on the first scene". */
const LAST_SCENE = F.BEACONS.acts[1].sessions[0].scenes[0].id;
const FIRST_SCENE = F.BEACONS.acts[0].sessions[0].scenes[0].id;

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

async function bootedOnBeacons(page) {
  const { lm } = await T.openTableAndBoot(page, loremaster());
  await lm.waitForFunction(
    (n) => (window.S.adventure.acts || []).length === n,
    F.countStory(F.BEACONS).acts
  );
  return lm;
}

test.describe('S5 persistence', () => {

  test('C1 the table opens on the scene you left', async ({ page }) => {
    let lm = await bootedOnBeacons(page);

    /* Sanity: it starts on the first scene, so landing there after the reload would be
     * a real failure and not the fixture agreeing with itself. */
    expect(await lm.evaluate(() => window.S.scene.id)).toBe(FIRST_SCENE);

    const v0 = await page.evaluate((c) => window.TSH.versionOf(c), F.CAMPAIGN_A);
    await lm.evaluate((id) => window.setActiveScene(id), LAST_SCENE);
    await T.waitForCommitPast(page, F.CAMPAIGN_A, v0);

    lm = await T.reloadSide(page, 'lm');

    /* The spine is rebuilt from the context, which knows nothing about where the table
     * was, so it lands on the first scene and the stored activeSceneId has to move it.
     * That is the behaviour being asserted, so wait for the feed rather than reading
     * mid-flight. */
    await lm.waitForFunction((id) => window.S.scene.id === id, LAST_SCENE);

    expect(await lm.evaluate(() => window.S.scene.id)).toBe(LAST_SCENE);
    expect(await lm.evaluate(() => window.S.adventure.activeSceneId)).toBe(LAST_SCENE);
  });

  test('C3 tokens survive a reload', async ({ page }) => {
    let lm = await bootedOnBeacons(page);

    await lm.waitForFunction(
      (charId) => (window.S.party || []).some((p) => p && p.charId === charId),
      F.FELL_CHAR_ID
    );

    /* Place the roster Fell on the map. Roster-sourced palette entries carry the charId
     * as their refId, which is how lmPlaceToken finds them. */
    await lm.evaluate((charId) => window.lmPlaceToken('p', charId), F.FELL_CHAR_ID);
    await lm.waitForFunction(() => (window.S.tokens || []).length > 0);
    /* Wait for the token to be IN the stored snapshot, not merely for the row to have
     * moved. Reloading before this write lands would destroy the frame with the push
     * still pending, and the test would then be asking whether the store remembers
     * something it was never told. */
    await T.waitForCommittedSnap(page, F.CAMPAIGN_A, { tokenCharId: F.FELL_CHAR_ID });

    lm = await T.reloadSide(page, 'lm');

    await lm.waitForFunction(() => (window.S.tokens || []).length > 0);

    const tokens = await lm.evaluate(() => (window.S.tokens || []).map((t) => ({
      charId: t.charId, name: t.name, kind: t.kind
    })));

    expect(tokens).toHaveLength(1);
    expect(tokens[0].charId).toBe(F.FELL_CHAR_ID);
    expect(tokens[0].name).toBe(F.PARTY_A[0].charName);
  });

  test('C5 switching adventures does not carry the old board over', async ({ page }) => {
    const lm = await bootedOnBeacons(page);

    await lm.waitForFunction(
      (charId) => (window.S.party || []).some((p) => p && p.charId === charId),
      F.FELL_CHAR_ID
    );

    await lm.evaluate((charId) => window.lmPlaceToken('p', charId), F.FELL_CHAR_ID);
    await lm.waitForFunction(() => (window.S.tokens || []).length > 0);
    /* The token must be on Beacons' stored board before the switch. Otherwise a push
     * still in flight arrives after the parent has rebound to the other adventure, is
     * refused as stale, and the board this test says was left behind was never written
     * at all. */
    await T.waitForCommittedSnap(page, F.CAMPAIGN_A, { tokenCharId: F.FELL_CHAR_ID });

    /* Switch through the real UI, the same path S2 drives. */
    await lm.evaluate(() => window.openWin('settings'));
    await lm.waitForSelector('#advSel');
    await lm.selectOption('#advSel', F.CAMPAIGN_B);
    await lm.locator('button.st-add', { hasText: 'Open the chosen adventure' }).click();

    await lm.waitForFunction((id) => window.S.campaignId === id, F.CAMPAIGN_B);
    await lm.waitForFunction(
      (n) => (window.S.adventure.acts || []).length === n,
      F.countStory(F.STONE).acts
    );

    /* Stone and Sovereign's board is Stone and Sovereign's. Give the feed a few beats to
     * wrongly deliver Beacons' tokens before believing this. */
    await page.waitForTimeout(3000);
    expect(await lm.evaluate(() => (window.S.tokens || []).length)).toBe(0);

    /* And the adventure that was left still has its board, because nothing is lost by
     * arriving somewhere: it is still there to come back to. */
    const beaconsSnap = await page.evaluate(
      (c) => (window.TSH.store[c] || {}).snap, F.CAMPAIGN_A
    );
    expect(beaconsSnap, 'the adventure left behind lost its board').toBeTruthy();
    expect((beaconsSnap.tokens || []).length).toBe(1);
  });

});
