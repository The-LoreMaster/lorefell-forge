/* S1 — a Fell joins, and both sides agree.
 *
 * The sync smoke test. If this fails nothing downstream is trustworthy, so it asserts
 * the two things that have to be true before any richer scenario means anything: the
 * table agrees about who is at it, and a value crosses the seam only after it was
 * actually written.
 *
 * ORACLE: THREADSPIRE_REQUIREMENTS.md, section B. These are software-behavior claims,
 * so the requirements list is the spec, not the FellGuide. The FellGuide is the oracle
 * for D2 and section E (aurum weights, the Act/React economy, foe rungs), none of which
 * S1 touches; those assertions arrive with S3 and the sheet scenarios, and are
 * deliberately not invented here. An assertion with no rule behind it would just encode
 * today's behavior.
 *
 *   B1. A Fell shows on both sides. The LoreMaster's roster shows the Fell, and the same
 *       Fell shows in the LoreMaster's token list. Roster and tokens must agree.
 *   B5. Sync is not instant-but-wrong. A change made on one side must not appear on the
 *       other before it was actually saved.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

/* Both sides sit at the same adventure. The Fell is in the roster the LoreMaster is
 * handed, and pointedly NOT written into the campaign's scenes; see the note in
 * fixtures.js for why that is the arrangement where B1 can actually fail. */
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

test.describe('S1 a Fell joins and both sides agree', () => {

  test('B1 the Fell the player brought shows in the LoreMaster roster', async ({ page }) => {
    const { lm } = await T.openTableAndBoot(page, table());

    /* The roster is asked for over the bridge (TS_PARTY_LIST), so wait for the answer
     * rather than assuming it arrived with the context. */
    await lm.waitForFunction(
      (charId) => (window.S.party || []).some((p) => p && p.charId === charId),
      F.FELL_CHAR_ID
    );

    const roster = await lm.evaluate(() => (window.S.party || []).map((p) => ({
      charId: p.charId, name: p.charName || p.name
    })));

    expect(roster).toContainEqual({
      charId: F.FELL_CHAR_ID,
      name: F.PARTY_A[0].charName
    });

    /* And the Seams panel agrees out loud, in the page's own words. A roster that never
     * arrived and a roster that is genuinely empty used to read identically; this line
     * is the page distinguishing them. */
    const rows = await T.seams(lm);
    expect(rows['Roster']).toContain('1 held');
  });

  test('B1 roster and token list agree about that Fell', async ({ page }) => {
    const { lm } = await T.openTableAndBoot(page, table());

    await lm.waitForFunction(
      (charId) => (window.S.party || []).some((p) => p && p.charId === charId),
      F.FELL_CHAR_ID
    );

    /* tokenPalette() is what the LoreMaster's token shelf is built from. A Fell who has
     * joined but has never been placed in a scene must still be offered there, sourced
     * from the roster. */
    const palette = await lm.evaluate(() => {
      const p = window.tokenPalette();
      return (p.fell || []).map((f) => ({ charId: f.charId, name: f.name, source: f.source }));
    });

    const mine = palette.filter((f) => f.charId === F.FELL_CHAR_ID);
    expect(mine, 'the Fell in the roster must be offered in the token list').toHaveLength(1);
    expect(mine[0].name).toBe(F.PARTY_A[0].charName);
    expect(mine[0].source).toBe('roster');
  });

  test('B1 the player side knows the same Fell', async ({ page }) => {
    const { player } = await T.openTableAndBoot(page, table());

    const seen = await player.evaluate(() => ({
      role: window.S.role,
      characterId: window.S.characterId,
      campaignId: window.S.campaignId
    }));

    expect(seen.role).toBe('player');
    expect(seen.characterId).toBe(F.FELL_CHAR_ID);
    expect(seen.campaignId).toBe(F.CAMPAIGN_A);
  });

  test('B5 a write reaches the player only after it landed', async ({ page }) => {
    const { lm, player } = await T.openTableAndBoot(page, table());

    /* Where the shared row stands before the LoreMaster does anything. Captured rather
     * than assumed to be zero: boot itself may already have pushed once, and a test that
     * depends on that not happening is testing the harness, not the product. */
    const before = await page.evaluate((c) => window.TSH.versionOf(c), F.CAMPAIGN_A);

    /* The LoreMaster says something is now true of the table. applyRemoteState is the
     * one road every such change takes, and it schedules the push. */
    await lm.evaluate(() => window.applyRemoteState({ log: window.S.log }));

    /* The row advances. */
    await page.waitForFunction(
      ({ c, v }) => window.TSH.versionOf(c) > v,
      { c: F.CAMPAIGN_A, v: before }
    );
    const after = await page.evaluate((c) => window.TSH.versionOf(c), F.CAMPAIGN_A);
    expect(after).toBeGreaterThan(before);

    /* The player catches up on the feed's own beat, without being handed anything early. */
    await player.waitForFunction((v) => window._stateSeen >= v, after);

    /* The ordering claim, which is what B5 actually says. Every snapshot the player was
     * served must correspond to a commit that had already happened: for each served pull
     * carrying version V there must be a PUSH_COMMIT of V earlier in the log. A harness
     * that let a reader see a write before it landed would fail here, and so would a real
     * feed that did the same. */
    const ordering = await page.evaluate(() => {
      const served = window.TSH.servedPulls('player');
      const commits = window.TSH.commits();
      return served.map((pull) => {
        const commit = commits.find((c) => c.version === pull.version && c.seq < pull.seq);
        return { version: pull.version, hadPriorCommit: !!commit };
      });
    });

    expect(ordering.length, 'the player must actually have been served something').toBeGreaterThan(0);
    for (const o of ordering) {
      expect(o.hadPriorCommit, `player saw v${o.version} with no earlier commit of it`).toBe(true);
    }

    /* The player never runs ahead of the row itself. */
    const playerSeen = await player.evaluate(() => window._stateSeen);
    const rowVersion = await page.evaluate((c) => window.TSH.versionOf(c), F.CAMPAIGN_A);
    expect(playerSeen).toBeLessThanOrEqual(rowVersion);

    /* And the harness did not catch itself being generous. */
    const violations = await page.evaluate(() => window.TSH.violations);
    expect(violations, 'harness served a snapshot it should have withheld').toEqual([]);
  });

  test('the LoreMaster push is accepted, not silently refused', async ({ page }) => {
    const { lm } = await T.openTableAndBoot(page, table());

    await lm.evaluate(() => window.applyRemoteState({ log: window.S.log }));
    await lm.waitForFunction(() => window.SEAM && window.SEAM.pushAt > 0);

    /* pushState() treats an acknowledgement without a version as a refusal and writes
     * "FAILED" into this line. Reading it back is how we know the ack carried one, which
     * is the part of the contract a hand-rolled parent most easily gets wrong. */
    const rows = await T.seams(lm);
    expect(rows['Last push']).not.toContain('FAILED');
    expect(rows['Last push']).toMatch(/^v[1-9]/);
  });

});
