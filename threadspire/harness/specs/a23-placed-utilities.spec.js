/* A23 — a placement is a declaration, and nothing is on the ground until it is resolved.
 *
 * Caltrops, Rune, Trap and Darkshard go on the floor rather than at anybody. The rule that
 * shapes all of it: the player picks the squares during the declare phase and NOTHING
 * appears on the board. The marker is created by the LoreMaster when they resolve it.
 *
 * That one rule dissolves the two hard questions. Undo needs no new protocol, because an
 * undone declare places nothing - there was never anything to take back. Visibility needs
 * no rule, because before resolution there is no token to see. And tokens stay
 * LoreMaster-authored, so "only the LoreMaster may delete a marker" is true by
 * construction rather than by a permission check.
 *
 * These cover the player's half: choosing squares, seeing them pending, and the
 * declaration carrying them. What the LoreMaster does with them at resolution is the next
 * piece, and F7 records the one line production needs before the squares can survive the
 * trip live.
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

const ACTS = [
  { src: 'utility', nm: 'Use a utility', desc: 'Spend your Act on a utility you carry.',
    dmg: 0, base: 0, dt: null, tier: null, kind: 'standard', contest: 'evasion',
    castSkill: '', locked: false, bar: '' }
];
/* as the sheet classifies them from the FellGuide (A22) */
const ITEMS = [
  { name: 'Caltrops', qty: 1, use: 'Act', roll: 'none', target: 'place', places: 5 },
  { name: 'Rune', qty: 1, use: 'Act', roll: 'none', target: 'place', places: 1 },
  { name: 'Ash Salt', qty: 1, use: 'Act', roll: 'none', target: 'any' }
];

async function seat(frame) {
  await frame.evaluate(() => {
    window.applyRemoteSnapshot = function () {};
    window.ensureSheet = function () {};
    var _sf = document.getElementById('sheetFrame'); if (_sf) _sf.remove();
  });
  await frame.evaluate(({ acts, items, myCharId }) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [{ id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 400, y: 400, cells: 1 }];
    window.__sent = [];
    window.sheet.postMessage = function (m) {
      if (!m || m.type !== 'ts-declare') return;
      window.__sent.push(m);
      window.handDeclareResult({ ok: true, round: m.round });
    };
    window.tsHandTake({ charge: 1, acts: acts, reacts: [], skills: {}, items: items, stances: [],
                        gates: { noAct: false, noReact: false, notes: [] },
                        active: true, round: 1, phase: 'commit',
                        fighters: [{ key: 'm:cb-erasure', name: 'The Erasure', side: 'monster', charId: '' }] });
    window.renderTokens(); window.render();
  }, { acts: ACTS, items: ITEMS, myCharId: F.FELL_CHAR_ID });
}

const takeUp = (frame, name) => frame.evaluate((n) => {
  window.handArm('Use a utility', 'act');
  document.querySelector('#hand .hand-pick .hp-opt[data-val="' + n + '"]').click();
}, name);
const placeAt = (frame, x, y) => frame.evaluate(({ px, py }) => window.handPlaceAt(px, py), { px: x, py: y });
const marks = (frame) => frame.evaluate(() => document.querySelectorAll('.placemark').length);
const sent = (frame) => frame.evaluate(() => window.__sent);
const left = (frame) => frame.evaluate(() => window.handPlacesLeft());

test.describe('A23 choosing where it goes', () => {

  test('a placed utility asks for the ground, not for a target or the dice', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await takeUp(player, 'Rune');

    expect(await left(player), 'one square for a Rune').toBe(1);
    expect(await player.evaluate(() =>
      document.getElementById('tray').classList.contains('awaiting')),
      'the dice have nothing to do with laying a rune').toBe(false);
    expect(await sent(player), 'and nothing has been declared yet').toHaveLength(0);
  });

  test('Caltrops wants five, and counts them down', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await takeUp(player, 'Caltrops');

    expect(await left(player)).toBe(5);
    await placeAt(player, 800, 800);
    expect(await left(player), 'four to go').toBe(4);
    await placeAt(player, 900, 800);
    await placeAt(player, 1000, 800);
    expect(await left(player)).toBe(2);
  });

  test('the same square twice is a slip, not a second caltrop', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await takeUp(player, 'Caltrops');

    await placeAt(player, 800, 800);
    await placeAt(player, 830, 830);          /* same square once snapped */
    expect(await left(player), 'one square, one caltrop').toBe(4);
  });

  test('the squares show as pending, and are not tokens', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    const before = await player.evaluate(() => window.S.tokens.length);

    await takeUp(player, 'Caltrops');
    await placeAt(player, 800, 800);
    await placeAt(player, 900, 800);

    expect(await marks(player), 'two pending squares are shown').toBe(2);
    expect(await player.evaluate(() => window.S.tokens.length),
      'and NOTHING has been put on the board - the LoreMaster does that at resolution')
      .toBe(before);
  });

  test('the last square is the commit, and the declaration carries them all', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await takeUp(player, 'Caltrops');

    await placeAt(player, 800, 800);
    await placeAt(player, 900, 800);
    await placeAt(player, 1000, 800);
    await placeAt(player, 800, 900);
    expect(await sent(player), 'four is not five').toHaveLength(0);

    await placeAt(player, 900, 900);
    const out = await sent(player);
    expect(out, 'the fifth square commits it, the way the last tap on a target does').toHaveLength(1);
    expect(out[0].item).toBe('Caltrops');
    expect(out[0].places, 'all five travel with the declaration').toHaveLength(5);
    /* the centre of the square tapped, snapped exactly as a token is - a marker and a
       token on the same square really do share it */
    expect(out[0].places[0]).toEqual({ x: 850, y: 850 });
    expect(out[0].target, 'it is aimed at the ground, not at anybody').toBeFalsy();
    expect(out[0].roll, 'and no face was ever asked for').toBeFalsy();
  });

  test('a one-square placement commits on the first tap', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await takeUp(player, 'Rune');

    await placeAt(player, 1200, 700);
    const out = await sent(player);
    expect(out).toHaveLength(1);
    expect(out[0].places).toEqual([{ x: 1250, y: 750 }]);
  });

  test('a utility that is not placed puts nothing on the ground', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await takeUp(player, 'Ash Salt');

    expect(await left(player), 'a tonic is used on somebody, not laid down').toBe(0);
    expect(await placeAt(player, 800, 800), 'and a tap on the floor is not for it').toBe(false);
    expect(await marks(player)).toBe(0);
  });

  test('putting the card down forgets the squares', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await takeUp(player, 'Caltrops');
    await placeAt(player, 800, 800);
    expect(await marks(player)).toBe(1);

    await player.evaluate(() => window.handDisarm());
    expect(await marks(player), 'nothing was ever on the ground to leave behind').toBe(0);
    expect(await sent(player)).toHaveLength(0);
  });
});
