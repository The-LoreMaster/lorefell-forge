/* A4 — the gestures, and what they must never take.
 *
 * This began as "the target tap IS the send". That was reversed by live play: targeting
 * now opens a roll and the roll commits, which A9 covers. What survives here is
 * everything that was true either way and is easy to break while changing the flow:
 *
 *   there is no separate Send control on the row
 *   right-click on empty map still opens the roll picker, which is a whole feature of
 *   the tool and not a combat convenience
 *   a token that resolves to nothing is the picker's gesture too
 *   a drag is not a tap, so moving your own Fell never aims at it
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
  { key: 'p:pl-7', name: 'Alarik', side: 'fell', charId: F.FELL_CHAR_ID }
];
const ACTS = [
  { src: 'Blade', nm: 'Basic attack', desc: 'standard strike', dmg: 6, base: 3, dt: 'phys',
    tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false },
  { src: 'skills', nm: 'Any skill', desc: 'pick one', dmg: 0, base: 0, dt: null,
    tier: null, kind: 'standard', contest: 'evasion', castSkill: '', locked: false }
];

async function seat(frame) {
  await frame.evaluate(() => { window.applyRemoteSnapshot = function () {}; });
  await frame.evaluate(({ acts, fighters, myCharId }) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [
      { id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 400, y: 400, cells: 1 },
      { id: 'tkGhost', kind: 'foe', refId: 'cb-nope', name: 'Leftover', x: 800, y: 400, cells: 1 },
      { id: 'tkMine', kind: 'p', refId: 'pl-7', charId: myCharId, name: 'Alarik', x: 1200, y: 400, cells: 1 }
    ];
    window.__sent = [];
    window.sheet.postMessage = function (m) {
      if (!m || m.type !== 'ts-declare') return;
      window.__sent.push(m);
      window.handDeclareResult({ ok: true, round: m.round });
    };
    window.tsHandTake({ charge: 3, acts: acts, reacts: [], skills: { Guard: 3 }, items: [], stances: [],
                        gates: { noAct: false, noReact: false, notes: [] },
                        active: true, round: 1, phase: 'commit', fighters: fighters });
    window.renderTokens(); window.render();
  }, { acts: ACTS, fighters: FIGHTERS, myCharId: F.FELL_CHAR_ID });
}

const sent = (frame) => frame.evaluate(() => window.__sent);
const arm = (frame, nm) => frame.evaluate((n) => window.handArm(n, 'act'), nm);
const pickerOpen = (frame) => frame.evaluate(() =>
  document.getElementById('typePick').classList.contains('open'));
const closePicker = (frame) => frame.evaluate(() => {
  document.getElementById('typePick').classList.remove('open', 'atcursor');
});
const rightClick = (frame, id) => frame.evaluate((i) => {
  const el = document.querySelector('.token[data-tok="' + i + '"]');
  const r = el.getBoundingClientRect();
  el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true,
    clientX: Math.round(r.left + r.width / 2), clientY: Math.round(r.top + r.height / 2) }));
}, id);

test.describe('A4 the gestures, and what they must not take', () => {

  test('there is no separate Send control on the row', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Basic attack');

    const found = await player.evaluate(() =>
      document.querySelectorAll('#hand [data-send], #hand .hs-btn').length);
    expect(found, 'the roll is what commits; a Send button would be a second way').toBe(0);
  });

  test('a card that still needs a choice says so instead of aiming', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await arm(player, 'Any skill');
    await player.evaluate(() => window.handAimByTap(window.S.tokens.find((t) => t.id === 'tkFoe')));

    expect(await player.evaluate(() => !!document.querySelector('#hand .hand-roll')),
      'which skill is still unanswered, so there is nothing to roll for').toBe(false);
    expect(await sent(player)).toHaveLength(0);
    const note = await player.evaluate(() => {
      const n = document.querySelector('#hand .hand-note');
      return n ? n.textContent : null;
    });
    expect(note).toContain('skill');
  });

  test('right-click on empty map still opens the roll picker', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await closePicker(player);

    await player.evaluate(() => {
      document.getElementById('map').dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }));
    });

    expect(await pickerOpen(player), 'rolling outside combat is a whole feature').toBe(true);
    expect(await sent(player)).toHaveLength(0);
  });

  test('right-click on a token that is not a fighter still opens the picker', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await closePicker(player);

    await rightClick(player, 'tkGhost');
    expect(await pickerOpen(player)).toBe(true);
    expect(await player.evaluate(() => !!document.querySelector('#hand .hand-pickmenu')),
      'and no combat menu for something that is not in the fight').toBe(false);
  });

  test('a drag still is not a tap', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Basic attack');

    const moved = await player.evaluate(() => {
      const el = document.querySelector('.token[data-tok="tkMine"]');
      const before = window.S.tokens.find((t) => t.id === 'tkMine').x;
      const r = el.getBoundingClientRect();
      const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
      const ev = (t, cx, cy) => new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 1, clientX: cx, clientY: cy });
      el.setPointerCapture = function(){}; el.releasePointerCapture = function(){};
      el.dispatchEvent(ev('pointerdown', x, y));
      el.dispatchEvent(ev('pointermove', x + 140, y + 60));
      el.dispatchEvent(ev('pointerup', x + 140, y + 60));
      return { before: before, after: window.S.tokens.find((t) => t.id === 'tkMine').x };
    });

    expect(moved.after, 'the drag ran').not.toBe(moved.before);
    expect(await player.evaluate(() => !!document.querySelector('#hand .hand-roll')),
      'moving your own Fell is not aiming at it').toBe(false);
    expect(await sent(player)).toHaveLength(0);
  });
});
