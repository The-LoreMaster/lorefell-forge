/* A15 — a foe you can actually aim at, and a declaration you can take back.
 *
 * Both from playing Phase A on the live site.
 *
 * TARGETING. The tap-to-aim handler lived inside the drag wiring, and the drag wiring was
 * attached only to tokens a player may MOVE - their own Fell. A foe is nobody's to move,
 * so a foe had no pointer handler at all and there was nothing to aim at. The one thing a
 * player needs to do to a foe was the one thing they could not do. Moving and targeting
 * are two permissions and are wired separately now.
 *
 * UNDO. After the roll commits, the map shows what was declared and the way back out of
 * it. The window closes when the LoreMaster starts resolving - a declaration being acted
 * on is no longer the player's to pull back - and that hinge is visible on the board
 * rather than being a timer nobody can see.
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

const FIGHTERS = [
  { key: 'm:cb-erasure', name: 'The Erasure', side: 'monster', charId: '' },
  { key: 'p:pl-7', name: 'Maerwen', side: 'fell', charId: F.FELL_CHAR_ID }
];
const ACTS = [
  { src: 'Ashen Blade', nm: 'Basic attack', desc: 'standard strike', dmg: 6, base: 3, dt: 'phys',
    tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false }
];

async function seat(frame, opts) {
  opts = opts || {};
  await frame.evaluate(() => { window.applyRemoteSnapshot = function () {};
    /* and the sheet in this frame, which is real and boots on its own clock. When it
       finishes it posts a hand of its own - inactive, empty - which replaces whatever a
       spec injected and empties the row, taking any note with it. Whether that lands
       before or after an assertion moves with machine load, which is what made it look
       like noise. Specs that drive the REAL sheet do not pin this; specs that inject a
       hand must. */
    window.ensureSheet = function () {};
    var _sf = document.getElementById("sheetFrame"); if (_sf) _sf.remove(); });
  await frame.evaluate(({ acts, fighters, myCharId, o }) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [
      { id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 400, y: 400, cells: 1 },
      { id: 'tkMine', kind: 'p', refId: 'pl-7', charId: myCharId, name: 'Maerwen', x: 900, y: 400, cells: 1 }
    ];
    window.__sent = [];
    window.__undo = [];
    window.sheet.postMessage = function (m) {
      if (!m) return;
      if (m.type === 'ts-declare'){ window.__sent.push(m); window.handDeclareResult({ ok: true, round: m.round }); return; }
      if (m.type === 'ts-undo'){ window.__undo.push(m); window.handUndoResult({ ok: true, round: m.round }); return; }
    };
    window.tsHandTake({ charge: 1, acts: acts, reacts: [], skills: { Guard: 3 }, items: [], stances: [],
                        gates: { noAct: false, noReact: false, notes: [] },
                        active: true, round: 1, phase: o.phase || 'commit',
                        declared: !!o.declared, fighters: fighters });
    window.renderTokens(); window.render();
  }, { acts: ACTS, fighters: FIGHTERS, myCharId: F.FELL_CHAR_ID, o: opts });
}

/* a real tap: down and up on the token without moving between them */
const tap = (frame, id) => frame.evaluate((tid) => {
  const el = document.querySelector('.token[data-tok="' + tid + '"]');
  const r = el.getBoundingClientRect();
  const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
  const ev = (t) => new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 1, clientX: x, clientY: y });
  el.setPointerCapture = function () {}; el.releasePointerCapture = function () {};
  el.dispatchEvent(ev('pointerdown'));
  el.dispatchEvent(ev('pointerup'));
}, id);

const arm = (frame, nm) => frame.evaluate((n) => window.handArm(n, 'act'), nm);
const promptUp = (frame) => frame.evaluate(() => !!document.querySelector('#hand .hand-roll'));
const sent = (frame) => frame.evaluate(() => window.__sent);

test.describe('A15 targeting a foe', () => {

  test('a foe token gets a pointer handler even though it cannot be moved', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    /* the shape of the bug: draggable was the gate, and a foe is not draggable */
    const kinds = await player.evaluate(() => ({
      foeDraggable: !!document.querySelector('.token[data-tok="tkFoe"]').classList.contains('mine'),
      foeTargetable: window.tokenTargetable(window.S.tokens.find((t) => t.id === 'tkFoe')),
      mineTargetable: window.tokenTargetable(window.S.tokens.find((t) => t.id === 'tkMine'))
    }));
    expect(kinds.foeDraggable, 'still nobody a player may move').toBe(false);
    expect(kinds.foeTargetable, 'and still something they must be able to aim at').toBe(true);
    expect(kinds.mineTargetable).toBe(true);
  });

  test('tapping a foe with a card held opens the roll', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Basic attack');

    await tap(player, 'tkFoe');

    expect(await promptUp(player), 'this is what was impossible in play').toBe(true);
    expect(await sent(player), 'and it still does not declare on its own').toHaveLength(0);
    expect(await player.evaluate(() => window.armed.targetName)).toBe('The Erasure');
  });

  test('the roll then commits it, from a tap on a foe', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Basic attack');
    await tap(player, 'tkFoe');
    await player.evaluate(() => window.handRollDo(4));

    const out = await sent(player);
    expect(out).toHaveLength(1);
    expect(out[0].target).toBe('m:cb-erasure');
    expect(out[0].roll).toBe(4);
  });

  test('a drag on a foe is not a tap, and does not move it either', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Basic attack');

    const moved = await player.evaluate(() => {
      const el = document.querySelector('.token[data-tok="tkFoe"]');
      const t = window.S.tokens.find((x) => x.id === 'tkFoe');
      const before = t.x;
      const r = el.getBoundingClientRect();
      const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
      const ev = (n, cx, cy) => new PointerEvent(n, { bubbles: true, cancelable: true, pointerId: 1, clientX: cx, clientY: cy });
      el.setPointerCapture = function () {}; el.releasePointerCapture = function () {};
      el.dispatchEvent(ev('pointerdown', x, y));
      el.dispatchEvent(ev('pointermove', x + 120, y + 40));
      el.dispatchEvent(ev('pointerup', x + 120, y + 40));
      return { before: before, after: t.x };
    });

    expect(moved.after, 'a foe is still nobody a player may move').toBe(moved.before);
    expect(await promptUp(player), 'and a wandering finger is not a tap').toBe(false);
  });

  test('the player can still move their own Fell', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    const moved = await player.evaluate(() => {
      const el = document.querySelector('.token[data-tok="tkMine"]');
      const t = window.S.tokens.find((x) => x.id === 'tkMine');
      const before = t.x;
      const r = el.getBoundingClientRect();
      const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
      const ev = (n, cx, cy) => new PointerEvent(n, { bubbles: true, cancelable: true, pointerId: 1, clientX: cx, clientY: cy });
      el.setPointerCapture = function () {}; el.releasePointerCapture = function () {};
      el.dispatchEvent(ev('pointerdown', x, y));
      el.dispatchEvent(ev('pointermove', x + 140, y));
      el.dispatchEvent(ev('pointerup', x + 140, y));
      return { before: before, after: t.x };
    });
    expect(moved.after, 'separating the two permissions did not take the drag away')
      .not.toBe(moved.before);
  });
});

test.describe('A15 taking it back', () => {

  const pill = (frame) => frame.evaluate(() => {
    const n = document.querySelector('#hand .hand-done');
    return n ? n.textContent.replace(/\s+/g, ' ').trim() : null;
  });
  const cardsShowing = (frame) => frame.evaluate(() =>
    document.querySelectorAll('#hand .hcard').length);

  test('once declared, the map shows what was declared and the way out', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Basic attack');
    await tap(player, 'tkFoe');
    await player.evaluate(() => window.handRollDo(4));

    /* the sheet confirms the declaration on the next hand it sends */
    await seat(player, { declared: true });

    const p = await pill(player);
    expect(p, 'right where the player is looking').toContain('Act declared');
    expect(p, 'and what they declared').toContain('Basic attack');
    expect(p).toContain('The Erasure');
    expect(p).toContain('Undo');
    expect(await cardsShowing(player), 'the cards give way to it').toBe(0);
  });

  test('Undo asks the sheet, and the row goes back to arming', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Basic attack');
    await tap(player, 'tkFoe');
    await player.evaluate(() => window.handRollDo(4));
    await seat(player, { declared: true });

    await player.evaluate(() => document.querySelector('#hand [data-undo]').click());

    expect(await player.evaluate(() => window.__undo), 'it asks rather than deciding locally')
      .toHaveLength(1);
    expect((await player.evaluate(() => window.__undo))[0].round).toBe(1);

    /* the sheet answers ok and sends a hand with nothing declared */
    await seat(player);
    expect(await pill(player), 'the pill is gone').toBe(null);
    expect(await cardsShowing(player), 'and the cards are back').toBeGreaterThan(0);
  });

  test('once the LoreMaster is resolving, there is no undo', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { declared: true, phase: 'resolve' });

    expect(await pill(player), 'the window closed when the board moved').toBe(null);
    expect(await player.evaluate(() => window.handUndoOpen())).toBe(false);
  });

  test('and nothing to take back before anything is declared', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    expect(await pill(player)).toBe(null);
    expect(await cardsShowing(player)).toBeGreaterThan(0);
  });

  test('the opening is one free Act and is not taken back', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await player.evaluate(() => { window.applyRemoteSnapshot = function () {};
    /* and the sheet in this frame, which is real and boots on its own clock. When it
       finishes it posts a hand of its own - inactive, empty - which replaces whatever a
       spec injected and empties the row, taking any note with it. Whether that lands
       before or after an assertion moves with machine load, which is what made it look
       like noise. Specs that drive the REAL sheet do not pin this; specs that inject a
       hand must. */
    window.ensureSheet = function () {};
    var _sf = document.getElementById("sheetFrame"); if (_sf) _sf.remove(); });
    await player.evaluate(({ acts, fighters, myCharId }) => {
      window.S.role = 'player'; window.S.mode = 'combat';
      window.S.characterId = myCharId;
      window.S.tokens = [];
      window.sheet.postMessage = function () {};
      window.tsHandTake({ charge: 1, acts: acts, reacts: [], skills: {}, items: [], stances: [],
                          gates: { noAct: false, noReact: false, notes: [] },
                          active: true, round: 1, phase: 'ambush:fell', declared: true,
                          opening: true, openingSide: 'fell', inOpening: true, fighters: fighters });
      window.render();
    }, { acts: ACTS, fighters: FIGHTERS, myCharId: F.FELL_CHAR_ID });

    expect(await player.evaluate(() => window.handUndoOpen())).toBe(false);
  });
});
