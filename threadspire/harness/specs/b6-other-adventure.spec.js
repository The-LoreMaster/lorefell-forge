/* B6 — the wrong adventure's state never bleeds in.
 *
 * ORACLE: THREADSPIRE_REQUIREMENTS.md, section B.
 *
 *   B6. While in adventure X, a state update belonging to adventure Y must be ignored,
 *       not applied.
 *
 * Both halves of the guard are exercised, because the state feed can carry the wrong
 * adventure in either direction:
 *
 *   - A PULL that left before a switch and lands after it comes back holding the
 *     adventure the table has just left. The embed must discard it.
 *   - A PUSH sent before a switch and arriving after it would write the old table over
 *     the new adventure's stored state. The parent must refuse it.
 *
 * Both are races measured in milliseconds, so both are injected deliberately rather than
 * waited for. The injection only forges the envelope; what is being tested is entirely
 * the embed's and the parent's own handling of it.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function table() {
  return {
    lm: {
      role: 'lm',
      campaignId: F.CAMPAIGN_A,
      party: F.PARTY_A,
      campaignList: F.CAMPAIGN_LIST
    },
    player: {
      role: 'player',
      campaignId: F.CAMPAIGN_A,
      characterId: F.FELL_CHAR_ID,
      character: F.CHARACTER_A,
      characters: [F.CHARACTER_A],
      party: F.PARTY_A
    }
  };
}

test.describe('B6 the wrong adventure never bleeds in', () => {

  test('a pull stamped with another adventure is not applied', async ({ page }) => {
    const { lm, player } = await T.openTableAndBoot(page, table());

    /* Get the table into a known, synced condition first, so a failure to adopt later
     * means the guard fired rather than the feed never having worked at all. */
    const v0 = await page.evaluate((c) => window.TSH.versionOf(c), F.CAMPAIGN_A);
    await lm.evaluate(() => window.applyRemoteState({ log: window.S.log }));
    const v1 = await T.waitForCommitPast(page, F.CAMPAIGN_A, v0);
    await player.waitForFunction((v) => window._stateSeen >= v, v1);

    /* Now every answer to this player claims to be about the other adventure. The row's
     * version at that moment is the most the player may ever hold: boot commits arrive in
     * a burst (the first push, then pushAdventure on its ack), so the player can already
     * be past v1 here, and any answer sent after this line is stamped. */
    const vStamped = await page.evaluate((c) => {
      window.TSH.stampPullsAs('player', c.b);
      return window.TSH.versionOf(c.a);
    }, { a: F.CAMPAIGN_A, b: F.CAMPAIGN_B });

    /* The LoreMaster writes again. The row genuinely advances. */
    await lm.evaluate(() => window.applyRemoteState({ log: window.S.log }));
    const v2 = await T.waitForCommitPast(page, F.CAMPAIGN_A, vStamped);

    /* Give the player several feed beats to get it wrong in. The feed runs on a 1100ms
     * interval, so this is three or four chances to wrongly adopt. */
    await page.waitForTimeout(4000);

    const seen = await player.evaluate(() => window._stateSeen);
    expect(seen, `player adopted v${seen} from an adventure it is not in`).toBeLessThan(v2);
    expect(seen).toBeGreaterThanOrEqual(v1);
    expect(seen, 'player adopted a version committed after its pulls were stamped').toBeLessThanOrEqual(vStamped);

    /* And it says why, in its own words, rather than silently doing nothing. The Seams
     * panel is the tool for telling "ignored on purpose" from "the feed died". */
    const rows = await T.seams(player);
    expect(rows['Last pull']).toContain('other adventure');
  });

  test('a push for an adventure the frame has left is refused', async ({ page }) => {
    const { lm } = await T.openTableAndBoot(page, table());
    /* the LoreMaster's table writes nothing until its first pull lands (fcfc9d7); wait for
       that first write, so the push below is one the table really sends */
    await page.waitForFunction(() => window.TSH.stats.pushes > 0);

    /* The parent has moved on to the other adventure; the embed has not been told and
     * still stamps its writes with the one it believes it is running. Both rows are read
     * in the same turn as the rebind: the LoreMaster's first push waits for its first pull
     * and lands a moment after boot, so a reading taken earlier can be overtaken by it.
     * From the rebind on, every push from this frame is refused. */
    const { aBefore, bBefore } = await page.evaluate((c) => {
      window.TSH.rebind('lm', c.b);
      return { aBefore: window.TSH.versionOf(c.a), bBefore: window.TSH.versionOf(c.b) };
    }, { a: F.CAMPAIGN_A, b: F.CAMPAIGN_B });

    await lm.evaluate(() => window.pushState());
    await page.waitForFunction(() => window.TSH.stats.pushRefused > 0);

    /* Neither row moved. The write landed nowhere, which is the point: landing it on B
     * would be the old table overwriting the new adventure. */
    expect(await page.evaluate((c) => window.TSH.versionOf(c), F.CAMPAIGN_A)).toBe(aBefore);
    expect(await page.evaluate((c) => window.TSH.versionOf(c), F.CAMPAIGN_B)).toBe(bBefore);

    /* The LoreMaster is told the table and the players have split, rather than believing
     * the write succeeded. A silent failure here is the worst case: the LoreMaster keeps
     * running a table nobody else can see. */
    const rows = await T.seams(lm);
    expect(rows['Last push']).toContain('FAILED');
    expect(rows['Last push']).toContain('stale adventure');
  });

});
