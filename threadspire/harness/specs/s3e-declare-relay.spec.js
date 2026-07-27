/* S3e — the harness can carry a declare from one frame to the other.
 *
 * This tests the HARNESS, not the product, and it exists before the product code that
 * will depend on it. Until now host.html stubbed TS_COMBAT_DECLARES to an empty list and
 * dropped every sheet message on the floor, so a two-frame table could not carry a Beat
 * at all. Anything built on top of that would have "passed" against a relay that never
 * moved a byte, which is the exact shape of a silent sync bug.
 *
 * So the relay is proven first, on its own, with a declare posted the way the sheet posts
 * one: up through ThreadSpire as TS_TOOL_UP, into the store, and out to the LoreMaster's
 * frame through TS_COMBAT_DECLARES.
 *
 * What this deliberately does NOT prove is in FINDINGS.md F4: production decides which
 * adventure a declare belongs to from the character's own record, and the harness decides
 * it from the sending frame's binding, because there is no Characters collection here to
 * ask. A Fell whose record points somewhere else is a case only production can catch.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function bothSides() {
  return {
    lm: {
      role: 'lm',
      campaignId: F.CAMPAIGN_A,
      rawCampaign: F.BEACONS,
      party: F.PARTY_A
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

/* Post a declare exactly as FellGlass does: the sheet posts to its parent, ThreadSpire
 * relays it up as TS_TOOL_UP. Driven from inside the player frame so it travels the real
 * road rather than being written into the store from the side. */
async function declareFromSheet(frame, decl) {
  await frame.evaluate((d) => {
    window.parent.postMessage({ type: 'TS_TOOL_UP', tool: 'fellglass', msg: d }, '*');
  }, decl);
}

const DECLARE = {
  type: 'combat-declare',
  charId: F.FELL_CHAR_ID,
  act: 'Razorwind', react: '', target: 'm:cb-erasure',
  round: 1, dmg: 7, base: 4, dt: 'magic',
  fellmark: false, doubleFell: false, pierce: 0, applies: '',
  actTier: 1, acc: 8, roll: 4, kind: 'weapon', fellstrike: false,
  charge: 1, curVit: 28, maxVit: 28, affs: [],
  reqId: 77
};

test.describe('S3e a declare crosses from the player frame to the LoreMaster frame', () => {

  test('the store is empty until somebody declares', async ({ page }) => {
    await T.openTable(page, bothSides());
    const stored = await page.evaluate((c) => window.TSH.declares(c), F.CAMPAIGN_A);
    expect(stored, 'nothing declared, nothing stored').toEqual([]);
  });

  test('a declare posted from the player frame reaches the store', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    await declareFromSheet(frames.player, DECLARE);
    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);

    const stored = await page.evaluate((c) => window.TSH.declares(c), F.CAMPAIGN_A);
    expect(stored).toHaveLength(1);
    expect(stored[0].charId).toBe(F.FELL_CHAR_ID);
    expect(stored[0].act).toBe('Razorwind');
    expect(stored[0].target).toBe('m:cb-erasure');
    expect(stored[0].round).toBe(1);
  });

  test('and the LoreMaster frame reads it back through its own request', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    await declareFromSheet(frames.player, DECLARE);
    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);

    /* the board's own road: declaresLoad asks TS_COMBAT_DECLARES and keeps the answer */
    await frames.lm.evaluate(() => { window.S.declares = null; window.declaresLoad(); });
    await frames.lm.waitForFunction(() => Array.isArray(window.S.declares) && window.S.declares.length > 0);

    const seen = await frames.lm.evaluate(() => window.S.declares);
    expect(seen).toHaveLength(1);
    expect(seen[0].act, 'the LoreMaster sees what the player declared').toBe('Razorwind');
    expect(seen[0].target).toBe('m:cb-erasure');

    /* and by the lookup the board actually uses */
    const byChar = await frames.lm.evaluate((cid) => window.declareFor(cid), F.FELL_CHAR_ID);
    expect(byChar, 'found by the Fell it belongs to').toBeTruthy();
    expect(byChar.act).toBe('Razorwind');
  });

  test('every field the Beat needs survives the crossing', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    await declareFromSheet(frames.player, DECLARE);
    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);

    const got = (await page.evaluate((c) => window.TSH.declares(c), F.CAMPAIGN_A))[0];

    /* the numbers are the ones a resolution is worked out from, so a dropped or
     * defaulted field here is a wrong outcome at the table, not a cosmetic loss */
    expect(got.dmg).toBe(7);
    expect(got.base).toBe(4);
    expect(got.dt).toBe('magic');
    expect(got.actTier).toBe(1);
    expect(got.acc).toBe(8);
    expect(got.roll).toBe(4);
    expect(got.kind).toBe('weapon');
    expect(got.charge).toBe(1);
    expect(got.curVit).toBe(28);
    expect(got.maxVit).toBe(28);
    expect(got.fellmark).toBe(false);
    expect(got.fellstrike).toBe(false);
  });

  test('the sheet is told its declare landed', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    /* catch what ThreadSpire would hand down to the sheet frame */
    await frames.player.evaluate(() => {
      window.__acks = [];
      window.addEventListener('message', function (ev) {
        const d = ev && ev.data;
        if (d && d.type === 'TS_TOOL_DOWN' && d.msg && d.msg.type === 'combat-declare-ack') window.__acks.push(d.msg);
      });
    });

    await declareFromSheet(frames.player, DECLARE);
    await frames.player.waitForFunction(() => (window.__acks || []).length > 0);

    const acks = await frames.player.evaluate(() => window.__acks);
    expect(acks[0].ok, 'answered, so a declare that landed cannot look like one that did not').toBe(true);
    expect(acks[0].reqId, 'and carrying the number the sheet sent').toBe(77);
  });

  test('a second declare replaces the first rather than piling up', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    await declareFromSheet(frames.player, DECLARE);
    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);

    await declareFromSheet(frames.player, Object.assign({}, DECLARE, { act: 'Basic attack', actTier: 0, target: 'm:cb-swordsman' }));
    await page.waitForFunction((c) => window.TSH.declares(c)[0].act === 'Basic attack', F.CAMPAIGN_A);

    const stored = await page.evaluate((c) => window.TSH.declares(c), F.CAMPAIGN_A);
    expect(stored, 'one Fell, one declaration').toHaveLength(1);
    expect(stored[0].act).toBe('Basic attack');
    expect(stored[0].target).toBe('m:cb-swordsman');
    expect(stored[0].actTier).toBe(0);
  });

  test('a declare for one adventure never appears in another', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    await declareFromSheet(frames.player, DECLARE);
    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);

    const other = await page.evaluate((c) => window.TSH.declares(c), F.CAMPAIGN_B);
    expect(other, 'the other table hears nothing').toEqual([]);
  });

  test('a declare with no Fell behind it is refused rather than stored anonymously', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    await frames.player.evaluate(() => {
      window.__acks = [];
      window.addEventListener('message', function (ev) {
        const d = ev && ev.data;
        if (d && d.type === 'TS_TOOL_DOWN' && d.msg && d.msg.type === 'combat-declare-ack') window.__acks.push(d.msg);
      });
    });

    /* charId blanked, and the frame's own characterId blanked with it, so there is
     * genuinely nobody to attribute this to */
    await page.evaluate(() => { window.TSH.frames.player.characterId = ''; });
    await declareFromSheet(frames.player, Object.assign({}, DECLARE, { charId: '' }));
    await frames.player.waitForFunction(() => (window.__acks || []).length > 0);

    const acks = await frames.player.evaluate(() => window.__acks);
    expect(acks[0].ok, 'refused, and said so').toBe(false);
    expect(await page.evaluate((c) => window.TSH.declares(c), F.CAMPAIGN_A)).toEqual([]);
  });

  test('the LoreMaster hears nothing before the player has spoken', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    /* the ordering claim: a read that happens first must not invent an answer */
    await frames.lm.evaluate(() => { window.S.declares = null; window.declaresLoad(); });
    await frames.lm.waitForFunction(() => Array.isArray(window.S.declares));
    expect(await frames.lm.evaluate(() => window.S.declares)).toEqual([]);

    await declareFromSheet(frames.player, DECLARE);
    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);

    await frames.lm.evaluate(() => { window.S.declares = null; window.declaresLoad(); });
    await frames.lm.waitForFunction(() => Array.isArray(window.S.declares) && window.S.declares.length > 0);
    expect(await frames.lm.evaluate(() => window.S.declares[0].act)).toBe('Razorwind');
  });
});
