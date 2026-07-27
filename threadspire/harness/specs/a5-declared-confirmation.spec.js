/* A5 — a declaration you can see, from both chairs.
 *
 * With no Send button and no form, the only evidence a declare happened is what the table
 * shows afterwards. A declaration you cannot see is one you will make twice, and a
 * LoreMaster who cannot see who is locked in cannot tell waiting from stalled.
 *
 *   PLAYER: the card stamps "Declared at <target>" and the target token wears a ring.
 *   LOREMASTER: every Fell who has declared wears a ring, so who is outstanding is a
 *   glance rather than a count.
 *
 * Both clear when the round moves on, since a declaration belongs to its round.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function playerOnly() {
  return {
    player: {
      role: 'player', campaignId: F.CAMPAIGN_A, characterId: F.FELL_CHAR_ID,
      character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A
    }
  };
}
function bothSides() {
  return {
    lm: { role: 'lm', campaignId: F.CAMPAIGN_A, rawCampaign: F.BEACONS, party: F.PARTY_A },
    player: playerOnly().player
  };
}

const ACTS = [
  { src: 'Blade', nm: 'Basic attack', desc: 'Tier 0 · standard strike', dmg: 6, base: 3, dt: 'phys',
    tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false },
  { src: 'Blade', nm: 'Rend', desc: 'a tier two', dmg: 8, base: 4, dt: 'phys',
    tier: 2, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false }
];

async function seat(frame, round) {
  /* same reason as s3b and s3c: this measures local rendering, and the feed rewrites the
     very state it is measuring */
  await frame.evaluate(() => { window.applyRemoteSnapshot = function () {}; });
  await frame.evaluate(({ acts, myCharId, r }) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [
      { id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 400, y: 400, cells: 1 },
      { id: 'tkOther', kind: 'foe', refId: 'cb-other', name: 'Another', x: 800, y: 400, cells: 1 }
    ];
    window.sheet.postMessage = function (m) {
      if (!m || m.type !== 'ts-declare') return;
      window.handDeclareResult({ ok: true, round: m.round });
    };
    window.tsHandTake({ charge: 3, acts: acts, reacts: [], skills: {}, items: [], stances: [],
                        gates: { noAct: false, noReact: false, notes: [] },
                        active: true, round: r, phase: 'commit',
                        fighters: [{ key: 'm:cb-erasure', name: 'The Erasure', side: 'monster', charId: '' },
                                   { key: 'm:cb-other', name: 'Another', side: 'monster', charId: '' }] });
    window.renderTokens(); window.render();
  }, { acts: ACTS, myCharId: F.FELL_CHAR_ID, r: round || 1 });
}

const declare = (frame, act, tokenId) => frame.evaluate(({ a, id }) => {
  window.handArm(a, 'act');
  window.handAimByTap(window.S.tokens.find((t) => t.id === id));
}, { a: act, id: tokenId });

const cardText = (frame, nm) => frame.evaluate((n) => {
  const c = Array.from(document.querySelectorAll('#hand .hcard')).find((x) => x.getAttribute('data-act') === n);
  return c ? { text: c.textContent, declared: c.classList.contains('declared') } : null;
}, nm);

const tokenMark = (frame, id, cls) => frame.evaluate(({ i, c }) => {
  const el = document.querySelector('.token[data-tok="' + i + '"]');
  return el ? el.classList.contains(c) : null;
}, { i: id, c: cls });

test.describe('A5 the declaration is visible from both chairs', () => {

  test('the card stamps what was declared and at whom', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 1);

    expect((await cardText(player, 'Basic attack')).declared, 'nothing declared yet').toBe(false);

    await declare(player, 'Basic attack', 'tkFoe');

    const c = await cardText(player, 'Basic attack');
    expect(c.declared).toBe(true);
    expect(c.text).toContain('Declared');
    expect(c.text, 'and names the target, not just the fact').toContain('The Erasure');
  });

  test('only the declared card is stamped', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 1);

    await declare(player, 'Rend', 'tkFoe');
    expect((await cardText(player, 'Rend')).declared).toBe(true);
    expect((await cardText(player, 'Basic attack')).declared, 'the others are not').toBe(false);
  });

  test('the target token is ringed, and only the target', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 1);

    expect(await tokenMark(player, 'tkFoe', 'aimed'), 'no ring before').toBe(false);

    await declare(player, 'Basic attack', 'tkFoe');

    expect(await tokenMark(player, 'tkFoe', 'aimed'), 'the one aimed at').toBe(true);
    expect(await tokenMark(player, 'tkOther', 'aimed'), 'and not the other one').toBe(false);
  });

  test('the round moving on clears the stamp and the ring', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 1);
    await declare(player, 'Basic attack', 'tkFoe');
    expect((await cardText(player, 'Basic attack')).declared).toBe(true);

    /* the sheet ticks the round and sends a fresh hand */
    await seat(player, 2);

    expect((await cardText(player, 'Basic attack')).declared,
      'a declaration belongs to the round it was made in').toBe(false);
    expect(await tokenMark(player, 'tkFoe', 'aimed')).toBe(false);
  });

  test('the LoreMaster sees which Fell are locked in', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await frames.lm.evaluate(() => { window.applyRemoteSnapshot = function () {}; });

    /* a Fell token on the LoreMaster's board, and a declaration from that Fell */
    await frames.lm.evaluate((cid) => {
      window.S.mode = 'combat';
      window.S.map = { w: 2400, h: 1600 };
      window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
      window.S.tokens = [{ id: 'tkFell', kind: 'p', refId: 'pl-7', charId: cid, name: 'Maerwen', x: 400, y: 400, cells: 1 }];
      window.S.declares = [];
      window.renderTokens();
    }, F.FELL_CHAR_ID);

    expect(await tokenMark(frames.lm, 'tkFell', 'declared'),
      'nobody has declared yet').toBe(false);

    await frames.player.evaluate((cid) => {
      window.parent.postMessage({ type: 'TS_TOOL_UP', tool: 'fellglass', msg: {
        type: 'combat-declare', charId: cid, act: 'Basic attack', react: '', target: 'm:cb-erasure',
        round: 1, dmg: 6, base: 3, dt: 'phys', actTier: 0, acc: 7, roll: 4, kind: 'weapon',
        charge: 0, curVit: 28, maxVit: 28, affs: []
      } }, '*');
    }, F.FELL_CHAR_ID);
    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);

    await frames.lm.evaluate(() => { window.S.declares = null; window.declaresLoad(); });
    await frames.lm.waitForFunction(() => Array.isArray(window.S.declares) && window.S.declares.length > 0);

    expect(await tokenMark(frames.lm, 'tkFell', 'declared'),
      'the board says who is committed without the LoreMaster counting').toBe(true);
  });

  test('the player\'s own ring does not appear on the LoreMaster board', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await frames.lm.evaluate(() => { window.applyRemoteSnapshot = function () {}; });

    await frames.lm.evaluate((cid) => {
      window.S.mode = 'combat';
      window.S.tokens = [{ id: 'tkFell', kind: 'p', refId: 'pl-7', charId: cid, name: 'Maerwen', x: 400, y: 400, cells: 1 }];
      window.S.declares = [];
      window.renderTokens();
    }, F.FELL_CHAR_ID);

    /* the aimed ring is the declaring player's own view of their own declaration; the
       LoreMaster's board answers a different question and must not borrow the mark */
    expect(await tokenMark(frames.lm, 'tkFell', 'aimed')).toBe(false);
  });
});
