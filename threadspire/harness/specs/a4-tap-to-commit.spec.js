/* A4 — tapping the target IS the send.
 *
 * A Beat is one Act. A button between choosing and doing was a second way to do the same
 * thing and a first way to forget to, so it is gone: tap a card, tap a target, done.
 *
 * The one addition beyond that: right-clicking a foe with an EMPTY hand is a standard
 * attack. Nothing held is not nothing meant, and hitting the thing in front of you is
 * the ordinary case that should not need choosing first.
 *
 * What must not change, and is asserted again here because this is exactly the sort of
 * edit that would quietly break it: right-click on empty map still opens the roll picker,
 * and a drag is still not a tap.
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
  { src: 'Blade', nm: 'Basic attack', desc: 'Tier 0 · standard strike', dmg: 6, base: 3, dt: 'phys',
    tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false },
  { src: 'Blade', nm: 'Rend', desc: 'a tier two', dmg: 8, base: 4, dt: 'phys',
    tier: 2, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false },
  { src: 'skills', nm: 'Any skill', desc: 'pick one', dmg: 0, base: 0, dt: null,
    tier: null, kind: 'standard', contest: 'evasion', castSkill: '', locked: false }
];

/* Stand the table up and capture what the row asks the sheet to declare. */
async function seat(frame, opts) {
  /* The shared-store poll writes S.mode and S.tokens from the feed, which is exactly the
     state these cases set and then measure. A poll landing mid-test replaces it and the case
     fails for a reason unrelated to what it asks. Correct product behaviour, wrong thing to
     leave running while measuring local rendering. */
    await frame.evaluate(() => { window.applyRemoteSnapshot = function () {}; });
  opts = opts || {};
  await frame.evaluate(({ acts, fighters, myCharId, round }) => {
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
                        active: true, round: round, phase: 'commit', fighters: fighters });
    window.renderTokens(); window.render();
  }, { acts: opts.acts || ACTS, fighters: FIGHTERS, myCharId: F.FELL_CHAR_ID, round: 1 });
}

const sent = (frame) => frame.evaluate(() => window.__sent);
const arm = (frame, nm) => frame.evaluate((n) => window.handArm(n, 'act'), nm);
const tapToken = (frame, id) => frame.evaluate((i) => {
  const t = window.S.tokens.find((x) => x.id === i);
  return window.handAimByTap(t);
}, id);
const rightClick = (frame, id) => frame.evaluate((i) => {
  const el = document.querySelector('.token[data-tok="' + i + '"]');
  const r = el.getBoundingClientRect();
  el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true,
    clientX: Math.round(r.left + r.width / 2), clientY: Math.round(r.top + r.height / 2) }));
}, id);
const pickerOpen = (frame) => frame.evaluate(() =>
  document.getElementById('typePick').classList.contains('open'));
const closePicker = (frame) => frame.evaluate(() => {
  document.getElementById('typePick').classList.remove('open', 'atcursor');
});

test.describe('A4 the target tap is the send', () => {

  test('there is no Send control anywhere on the row', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Basic attack');

    const found = await player.evaluate(() =>
      document.querySelectorAll('#hand [data-send], #hand .hs-btn').length);
    expect(found, 'choosing and doing are one gesture now').toBe(0);
  });

  test('tapping a target declares, with no second step', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await arm(player, 'Basic attack');
    expect(await sent(player), 'nothing has gone yet').toHaveLength(0);

    await tapToken(player, 'tkFoe');

    const out = await sent(player);
    expect(out, 'the tap on the target sent it').toHaveLength(1);
    expect(out[0].act).toBe('Basic attack');
    expect(out[0].target).toBe('m:cb-erasure');
  });

  test('right-clicking a foe declares the same way', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Rend');
    await closePicker(player);

    await rightClick(player, 'tkFoe');

    const out = await sent(player);
    expect(out).toHaveLength(1);
    expect(out[0].act).toBe('Rend');
    expect(await pickerOpen(player), 'and it is not also the picker').toBe(false);
  });

  test('right-clicking a foe with an empty hand is a standard attack', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await closePicker(player);

    expect(await player.evaluate(() => window.armed), 'nothing held').toBe(null);
    await rightClick(player, 'tkFoe');

    const out = await sent(player);
    expect(out, 'hitting the thing in front of you needs no choosing first').toHaveLength(1);
    expect(out[0].act).toBe('Basic attack');
    expect(out[0].target).toBe('m:cb-erasure');
    expect(await pickerOpen(player)).toBe(false);
  });

  test('the standard attack is the tier 0 strike, not whatever is first', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    /* put a tier 2 ahead of the basic attack: the shortcut must still pick the basic one */
    await seat(player, { acts: [ACTS[1], ACTS[0], ACTS[2]] });
    await closePicker(player);

    await rightClick(player, 'tkFoe');
    expect((await sent(player))[0].act).toBe('Basic attack');
  });

  test('a card that still needs a choice does not go on a target tap', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await arm(player, 'Any skill');
    await tapToken(player, 'tkFoe');

    expect(await sent(player), 'which skill is still unanswered').toHaveLength(0);
    const note = await player.evaluate(() => {
      const n = document.querySelector('#hand .hand-note');
      return n ? n.textContent : null;
    });
    expect(note).toContain('skill');

    /* answer it, tap again, and now it goes */
    await player.evaluate(() => window.handPick('skill', 'Guard'));
    await tapToken(player, 'tkFoe');
    expect(await sent(player)).toHaveLength(1);
  });

  /* ---- what must not have changed -------------------------------------------------- */

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

    expect(await pickerOpen(player), 'rolling outside a card is still a whole feature').toBe(true);
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
    expect(await sent(player), 'and no standard attack at something that is not there').toHaveLength(0);
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
    expect(await sent(player), 'moving your own Fell is not declaring an attack on it').toHaveLength(0);
  });
});
