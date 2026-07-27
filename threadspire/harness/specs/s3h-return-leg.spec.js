/* S3h — the LoreMaster's resolution reaching the player.
 *
 * The outward half is proven: a card declared reaches the board. This is the answer.
 * Three separate things travel back and the sheet reads all of them off one combat-state:
 *
 *   conditions and a recap    what landed on the Fell, and a line saying so
 *   damage                    QUEUED for the player to confirm, never applied to them
 *   charge                    what their strike earned, which unlocks the next tier
 *
 * Each carries its own timestamp, because that is the only thing separating a new
 * resolution from the same one polled again fifteen seconds later. The stamps are the
 * property most worth testing here: without them, a fight would re-apply its damage
 * forever and every poll would look like a fresh hit.
 *
 * Damage is queued rather than applied on purpose, and that is a rule rather than an
 * implementation detail: a Fell's Vitality is theirs, so the board asks and the player's
 * own sheet answers.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function bothSides() {
  return {
    lm: { role: 'lm', campaignId: F.CAMPAIGN_A, rawCampaign: F.BEACONS, party: F.PARTY_A },
    player: {
      role: 'player', campaignId: F.CAMPAIGN_A, characterId: F.FELL_CHAR_ID,
      character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A
    }
  };
}

/* The LoreMaster publishes a fight, the way combatPublish does. Without this there is no
 * battle and getCombatForChar answers {active:false} to everything. */
async function openBattle(frame, round) {
  await frame.evaluate((r) => window.tsAsk('TS_COMBAT_PUBLISH', {
    state: { active: true, round: r, phase: 'resolve', sceneId: 'sc1', sceneName: 'The fight',
             fighters: [{ key: 'm:cb-1', name: 'The Erasure', side: 'monster' }],
             spotlightChars: [], log: [] }
  }), round || 1);
}

const combatFor = (page) => page.evaluate(
  ({ c, ch }) => window.TSH.combatFor(c, ch), { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });

test.describe('S3h the resolution comes back to the player', () => {

  test('with no fight published there is nothing to come back', async ({ page }) => {
    await T.openTableAndBoot(page, bothSides());
    expect(await combatFor(page), 'no battle, no state').toEqual({ active: false });
  });

  test('a charge the LoreMaster grants reaches the Fell', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await openBattle(frames.lm, 1);

    await frames.lm.evaluate((cid) => window.chargeFell(cid, 2), F.FELL_CHAR_ID);
    await page.waitForFunction(({ c, ch }) => window.TSH.combatFor(c, ch).chargeSet.at > 0,
      { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });

    const st = await combatFor(page);
    expect(st.chargeSet.value).toBe(2);
    expect(st.chargeSet.at, 'stamped, so the sheet can tell it apart from the last one').toBeGreaterThan(0);
  });

  test('damage is queued for the player to confirm, not applied to them', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await openBattle(frames.lm, 1);

    await frames.lm.evaluate((cid) => window.lmDealDamage(cid, 5, 3, 'magic'), F.FELL_CHAR_ID);
    await page.waitForFunction(({ c, ch }) => window.TSH.combatFor(c, ch).pendingHit.at > 0,
      { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });

    const st = await combatFor(page);
    expect(st.pendingHit.base).toBe(5);
    expect(st.pendingHit.bonus).toBe(3);
    expect(st.pendingHit.dt).toBe('magic');
    /* it is PENDING; nothing here has touched the Fell's Vitality, which is theirs */
    expect(st.pendingHit.at).toBeGreaterThan(0);
  });

  test('conditions and a recap land together', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await openBattle(frames.lm, 1);

    await frames.lm.evaluate((cid) => window.tsAsk('TS_COMBAT_APPLY', {
      charId: cid,
      applied: [{ name: 'Bleeding', kind: 'affliction' }],
      recap: { msg: 'Your turn resolved. Marked: Bleeding.', at: 1700000000000 }
    }), F.FELL_CHAR_ID);
    await page.waitForFunction(({ c, ch }) => window.TSH.combatFor(c, ch).applied.length > 0,
      { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });

    const st = await combatFor(page);
    expect(st.applied[0].name).toBe('Bleeding');
    expect(st.recap.msg).toContain('Bleeding');
    expect(st.recap.at).toBe(1700000000000);
  });

  test('a resolution does not disturb the declaration it answers', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await openBattle(frames.lm, 1);

    /* the Fell declares, then the board lands things on them */
    await frames.player.evaluate((cid) => {
      window.parent.postMessage({ type: 'TS_TOOL_UP', tool: 'fellglass', msg: {
        type: 'combat-declare', charId: cid, act: 'Razorwind', react: '', target: 'm:cb-1',
        round: 1, dmg: 7, base: 4, dt: 'magic', actTier: 1, acc: 8, roll: 4, kind: 'weapon',
        charge: 1, curVit: 28, maxVit: 28, affs: []
      } }, '*');
    }, F.FELL_CHAR_ID);
    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);

    await frames.lm.evaluate((cid) => window.chargeFell(cid, 2), F.FELL_CHAR_ID);
    await frames.lm.evaluate((cid) => window.lmDealDamage(cid, 5, 0, 'phys'), F.FELL_CHAR_ID);
    await page.waitForFunction(({ c, ch }) => window.TSH.combatFor(c, ch).pendingHit.at > 0,
      { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });

    /* both halves of the row are intact: this is the merge the real collection does, and
       a whole-row write here would silently lose whichever came first */
    const dec = (await page.evaluate((c) => window.TSH.declares(c), F.CAMPAIGN_A))[0];
    expect(dec.act, 'the declaration survived the resolution').toBe('Razorwind');
    expect(dec.target).toBe('m:cb-1');

    const st = await combatFor(page);
    expect(st.chargeSet.value).toBe(2);
    expect(st.pendingHit.base).toBe(5);
    expect(st.you.act, 'and the board can still see what they declared').toBe('Razorwind');
  });

  test('a second resolution carries a later stamp than the first', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await openBattle(frames.lm, 1);

    await frames.lm.evaluate((cid) => window.lmDealDamage(cid, 3, 0, 'phys'), F.FELL_CHAR_ID);
    await page.waitForFunction(({ c, ch }) => window.TSH.combatFor(c, ch).pendingHit.at > 0,
      { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });
    const first = (await combatFor(page)).pendingHit;

    await page.waitForTimeout(5);
    await frames.lm.evaluate((cid) => window.lmDealDamage(cid, 9, 0, 'phys'), F.FELL_CHAR_ID);
    await page.waitForFunction(({ c, ch, was }) => window.TSH.combatFor(c, ch).pendingHit.at > was,
      { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID, was: first.at });

    const second = (await combatFor(page)).pendingHit;
    expect(second.base).toBe(9);
    /* the stamp is what tells the sheet this is a NEW hit and not the old one polled
       again; equal stamps would make the second hit invisible */
    expect(second.at).toBeGreaterThan(first.at);
  });

  test('reading the same resolution twice reports the same stamp', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await openBattle(frames.lm, 1);

    await frames.lm.evaluate((cid) => window.chargeFell(cid, 3), F.FELL_CHAR_ID);
    await page.waitForFunction(({ c, ch }) => window.TSH.combatFor(c, ch).chargeSet.at > 0,
      { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });

    const a = (await combatFor(page)).chargeSet;
    const b = (await combatFor(page)).chargeSet;
    /* polling must not look like a fresh grant, or a fight would re-charge forever */
    expect(b.at).toBe(a.at);
    expect(b.value).toBe(a.value);
  });

  test('the fight ending takes the state with it', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await openBattle(frames.lm, 1);
    await frames.lm.evaluate((cid) => window.chargeFell(cid, 2), F.FELL_CHAR_ID);
    await page.waitForFunction(({ c, ch }) => window.TSH.combatFor(c, ch).active === true,
      { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });

    await frames.lm.evaluate(() => window.tsAsk('TS_COMBAT_PUBLISH', { state: { active: false } }));
    await page.waitForFunction(({ c, ch }) => window.TSH.combatFor(c, ch).active === false,
      { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });

    expect(await combatFor(page)).toEqual({ active: false });
  });

  test('one adventure\'s resolution never reaches another', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await openBattle(frames.lm, 1);
    await frames.lm.evaluate((cid) => window.chargeFell(cid, 2), F.FELL_CHAR_ID);
    await page.waitForFunction(({ c, ch }) => window.TSH.combatFor(c, ch).chargeSet.at > 0,
      { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });

    const elsewhere = await page.evaluate(
      ({ c, ch }) => window.TSH.combatFor(c, ch), { c: F.CAMPAIGN_B, ch: F.FELL_CHAR_ID });
    expect(elsewhere, 'the other table has no fight and hears nothing').toEqual({ active: false });
  });
});
