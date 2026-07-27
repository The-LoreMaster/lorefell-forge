/* S3f — the card row declares, and the LoreMaster sees it.
 *
 * The whole road, on the relay S3e proved: a card held on the map, its sub-choice and
 * its target, into the sheet's own cbDeclare so every rule that shapes a declaration is
 * applied once and in one place, out as combat-declare, into the store, and back out to
 * the LoreMaster's board through declaresLoad.
 *
 * Two properties get their own cases because both fail SILENTLY if they are wrong:
 *
 *   ROUND GATING. mergeDeclares clears any declare whose round is not the round the
 *   board is running. A declare stamped with the wrong round therefore does not arrive
 *   wrong, it does not arrive at all, and nobody is told. So the row sends the round it
 *   read off the hand, and the sheet refuses out loud if the fight has moved on since.
 *
 *   MID-RESOLVE. A declare made while the LoreMaster is already resolving must not be
 *   quietly dropped. As long as the round still matches it is stored and read like any
 *   other, and the row says the board is resolving rather than leaving the player to
 *   wonder.
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

const FIGHTERS = [{ key: 'm:cb-erasure', name: 'The Erasure', side: 'monster', charId: '' }];

const ACTS = [
  { src: 'Wand', nm: 'Basic attack', desc: 'standard strike', dmg: 7, base: 4, dt: 'magic',
    aff: '', tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false },
  { src: 'skills', nm: 'Any skill', desc: 'any of the 24', dmg: 0, base: 0, dt: null,
    aff: '', tier: null, kind: 'standard', contest: 'evasion', castSkill: '', locked: false }
];

/* Stand the player's side up with a hand, a board and a token, and stub the sheet frame
 * so ts-declare is answered the way FellGlass answers it. The sheet's own half is proven
 * separately; what is under test here is the row, the round it stamps, and the road out. */
async function seatPlayer(frame, opts) {
  opts = opts || {};
  await frame.evaluate(({ round, phase, acts, fighters, sheetRound }) => {
    window.S.role = 'player';
    window.S.mode = 'combat';
    window.S.characterId = window.S.characterId || 'chr-maerwen-0001';
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [{ id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 400, y: 400, cells: 1 }];

    /* stand in for the sheet frame: it validates the round exactly as fellglass does and
       posts the declare on up the way the sheet would */
    window.__sent = [];
    window.sheet.postMessage = function (m) {
      if (!m || m.type !== 'ts-declare') return;
      if (m.round !== sheetRound) {
        window.handDeclareResult({ ok: false, reason: 'stale-round', round: sheetRound });
        return;
      }
      window.__sent.push(m);
      window.parent.postMessage({ type: 'TS_TOOL_UP', tool: 'fellglass', msg: {
        type: 'combat-declare', charId: window.S.characterId,
        act: m.skill ? (m.act + ' · ' + m.skill) : m.act,
        react: '', target: m.target, round: m.round,
        dmg: 7, base: 4, dt: 'magic', fellmark: false, doubleFell: false, pierce: 0,
        applies: '', actTier: 0, acc: 8, roll: m.roll, kind: 'weapon', fellstrike: false,
        charge: 1, curVit: 28, maxVit: 28, affs: [], reqId: 5
      } }, '*');
      window.handDeclareResult({ ok: true, round: m.round });
    };

    window.tsHandTake({ charge: 3, acts: acts, reacts: [], skills: { Guard: 3 }, items: [],
                        stances: [], gates: { noAct: false, noReact: false, notes: [] },
                        active: true, round: round, phase: phase, fighters: fighters,
                        declared: false, reactUsed: false });
    window.renderTokens();
    window.render();
  }, { round: opts.round || 1, phase: opts.phase || 'commit', acts: opts.acts || ACTS,
       fighters: FIGHTERS, sheetRound: (opts.sheetRound === undefined ? (opts.round || 1) : opts.sheetRound) });
}

const arm = (frame, nm) => frame.evaluate((n) => window.handArm(n, 'act'), nm);
const aim = (frame) => frame.evaluate(() => window.handAim(window.S.tokens.find((t) => t.id === 'tkFoe')));
const send = (frame) => frame.evaluate(() => window.handDeclare());
const note = (frame) => frame.evaluate(() => {
  const n = document.querySelector('#hand .hand-note');
  return n ? n.textContent : null;
});

test.describe('S3f the row declares and the board sees it', () => {

  test('a card, a target and a send reach the LoreMaster', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await seatPlayer(frames.player, { round: 1 });

    await arm(frames.player, 'Basic attack');
    await aim(frames.player);
    await send(frames.player);

    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);

    await frames.lm.evaluate(() => { window.S.declares = null; window.declaresLoad(); });
    await frames.lm.waitForFunction(() => Array.isArray(window.S.declares) && window.S.declares.length > 0);

    const seen = await frames.lm.evaluate((cid) => window.declareFor(cid), F.FELL_CHAR_ID);
    expect(seen, 'the board found the Fell\'s declaration').toBeTruthy();
    expect(seen.act).toBe('Basic attack');
    expect(seen.target).toBe('m:cb-erasure');
    expect(seen.round).toBe(1);
  });

  test('the sub-choice travels with the Act', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await seatPlayer(frames.player, { round: 1 });

    await arm(frames.player, 'Any skill');
    await frames.player.evaluate(() => window.handPick('skill', 'Guard'));
    await aim(frames.player);
    await send(frames.player);

    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);
    const stored = (await page.evaluate((c) => window.TSH.declares(c), F.CAMPAIGN_A))[0];
    expect(stored.act, 'the board is told which skill, not merely that it was a skill').toContain('Guard');
  });

  /* ---- round gating ---------------------------------------------------------------- */

  test('the declare carries the round the hand was drawn from, not a guess', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await seatPlayer(frames.player, { round: 4, sheetRound: 4 });

    await arm(frames.player, 'Basic attack');
    await aim(frames.player);
    await send(frames.player);

    const sent = await frames.player.evaluate(() => window.__sent);
    expect(sent[0].round, 'stamped with the round on the hand').toBe(4);

    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);
    const stored = (await page.evaluate((c) => window.TSH.declares(c), F.CAMPAIGN_A))[0];
    expect(stored.round).toBe(4);
  });

  test('a declare for a round that has passed is refused out loud, not sent to be dropped', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    /* the row is still drawing round 1 while the fight has already moved to round 2:
       exactly the race that mergeDeclares would resolve by silently clearing it */
    await seatPlayer(frames.player, { round: 1, sheetRound: 2 });

    await arm(frames.player, 'Basic attack');
    await aim(frames.player);
    await send(frames.player);

    expect(await frames.player.evaluate(() => window.__sent.length),
      'nothing was posted for a round nobody is running').toBe(0);
    expect(await page.evaluate((c) => window.TSH.declares(c), F.CAMPAIGN_A)).toEqual([]);
    expect(await note(frames.player), 'and the player is told why').toContain('round moved on');
  });

  /* ---- mid-resolve ------------------------------------------------------------------ */

  test('a declare made while the board is resolving still arrives', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await seatPlayer(frames.player, { round: 1, phase: 'resolve' });

    await arm(frames.player, 'Basic attack');
    await aim(frames.player);
    await send(frames.player);

    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);
    const stored = (await page.evaluate((c) => window.TSH.declares(c), F.CAMPAIGN_A))[0];
    expect(stored.act, 'resolving is not a reason to lose it').toBe('Basic attack');

    await frames.lm.evaluate(() => { window.S.declares = null; window.declaresLoad(); });
    await frames.lm.waitForFunction(() => Array.isArray(window.S.declares) && window.S.declares.length > 0);
    expect(await frames.lm.evaluate((cid) => window.declareFor(cid).act, F.FELL_CHAR_ID)).toBe('Basic attack');
  });

  test('and the row says the board is resolving rather than leaving it unexplained', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await seatPlayer(frames.player, { round: 1, phase: 'resolve' });
    await arm(frames.player, 'Basic attack');

    const said = await frames.player.evaluate(() => {
      const n = document.querySelector('#hand .hs-phase');
      return n ? n.textContent : null;
    });
    expect(said).toContain('resolving');
  });

  /* ---- refusing to send something incomplete ---------------------------------------- */

  test('a card with no target is not sent, and says what is missing', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await seatPlayer(frames.player, { round: 1 });

    await arm(frames.player, 'Basic attack');
    await send(frames.player);

    expect(await frames.player.evaluate(() => window.__sent.length)).toBe(0);
    expect(await note(frames.player)).toContain('target');
  });

  test('a category Act with nothing chosen is not sent either', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await seatPlayer(frames.player, { round: 1 });

    await arm(frames.player, 'Any skill');
    await aim(frames.player);
    await send(frames.player);

    expect(await frames.player.evaluate(() => window.__sent.length)).toBe(0);
    expect(await note(frames.player)).toContain('skill');
  });

  test('an attack carries a roll, since the sheet refuses one without', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await seatPlayer(frames.player, { round: 1 });

    await arm(frames.player, 'Basic attack');
    await aim(frames.player);
    await send(frames.player);

    const sent = await frames.player.evaluate(() => window.__sent);
    expect(sent[0].roll).toBeGreaterThanOrEqual(1);
    expect(sent[0].roll).toBeLessThanOrEqual(6);
  });

  test('a sent card is put down, so the same Act cannot be fired twice by accident', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await seatPlayer(frames.player, { round: 1 });

    await arm(frames.player, 'Basic attack');
    await aim(frames.player);
    await send(frames.player);

    expect(await frames.player.evaluate(() => window.armed)).toBe(null);
    expect(await note(frames.player)).toContain('Sent');
  });
});
