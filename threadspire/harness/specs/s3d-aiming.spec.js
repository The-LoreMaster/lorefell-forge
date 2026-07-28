/* S3d — aiming a held card, without taking the roll picker away from anyone.
 *
 * Right-click has opened the roll-type picker anywhere on the table since long before
 * combat existed here, and rolling an attack or a skill outside a fight is a feature of
 * the tool rather than a combat convenience. Aiming is ADDITIVE. It intercepts exactly
 * one case and lets every other one through untouched.
 *
 * The rule, stated once:
 *
 *   right-click on a token, combat ACTIVE, token resolves to a fighter  -> aim
 *   right-click on anything else, ever                                  -> roll picker
 *
 * "Anything else" includes bare table in a fight, a token that resolves to nothing, and
 * every right-click outside combat. The failure this guards against is not a wrong
 * target, it is a feature quietly disappearing whenever a battle is running.
 *
 * Tapping is the primary path and is a separate question: a tap aims only when a card is
 * actually held, so tapping a token to look at it keeps working.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function playerOnly() {
  return {
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

const FIGHTERS = [
  { key: 'm:cb-erasure', name: 'The Erasure', side: 'monster', charId: '' },
  /* the player's own Fell, so their own token both resolves AND is draggable, which is
     the only token on the board where the drag-versus-tap distinction can actually bite */
  { key: 'p:pl-7', name: 'Alarik', side: 'fell', charId: F.FELL_CHAR_ID }
];

const ACTS = [
  { src: 'Wand', nm: 'Basic attack', desc: 'Tier 0 · standard strike', dmg: 7, base: 4, dt: 'magic',
    tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false }
];

/* Two tokens: one that is a fighter, one that is not. Both are real tokens on the board. */
async function seat(frame, opts) {
  /* The shared-store poll writes S.mode and S.tokens from the feed, which is exactly the
     state these cases set and then measure. A poll landing mid-test replaces it and the case
     fails for a reason unrelated to what it asks. Correct product behaviour, wrong thing to
     leave running while measuring local rendering. */
    await frame.evaluate(() => { window.applyRemoteSnapshot = function () {};
    /* and the sheet in this frame, which is real and boots on its own clock. When it
       finishes it posts a hand of its own - inactive, empty - which replaces whatever a
       spec injected and empties the row, taking any note with it. Whether that lands
       before or after an assertion moves with machine load, which is what made it look
       like noise. Specs that drive the REAL sheet do not pin this; specs that inject a
       hand must. */
    window.ensureSheet = function () {};
    var _sf = document.getElementById("sheetFrame"); if (_sf) _sf.remove(); });
  opts = opts || {};
  await frame.evaluate(({ active, fighters, myCharId }) => {
    window.S.role = 'player';
    window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [
      { id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 400, y: 400, cells: 1 },
      { id: 'tkGhost', kind: 'foe', refId: 'cb-not-here', name: 'Leftover', x: 800, y: 400, cells: 1 },
      { id: 'tkMine', kind: 'p', refId: 'pl-7', charId: myCharId, name: 'Alarik', x: 1200, y: 400, cells: 1 }
    ];
    window.tsHandTake({ charge: 3, acts: window.__ACTS, reacts: [], skills: {}, items: [], stances: [],
                        gates: { noAct: false, noReact: false, notes: [] },
                        active: active, round: 1, fighters: fighters });
    window.renderTokens();
    window.render();
  }, { active: opts.active !== false, fighters: opts.fighters || FIGHTERS, myCharId: F.FELL_CHAR_ID });
}

async function loadActs(frame) {
  await frame.evaluate((a) => { window.__ACTS = a; }, ACTS);
}

const closePicker = (frame) => frame.evaluate(() => {
  const p = document.getElementById('typePick');
  p.classList.remove('open', 'atcursor');
});

const pickerOpen = (frame) => frame.evaluate(() =>
  document.getElementById('typePick').classList.contains('open'));

/* A real right-click, dispatched where the browser would put one. */
const rightClickToken = (frame, tokenId) => frame.evaluate((id) => {
  const el = document.querySelector('.token[data-tok="' + id + '"]');
  if (!el) throw new Error('no token element for ' + id);
  const r = el.getBoundingClientRect();
  el.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true, cancelable: true,
    clientX: Math.round(r.left + r.width / 2), clientY: Math.round(r.top + r.height / 2)
  }));
}, tokenId);

const rightClickMap = (frame) => frame.evaluate(() => {
  const m = document.getElementById('map');
  m.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }));
});

const armedTarget = (frame) => frame.evaluate(() =>
  window.armed ? { key: window.armed.target || null, name: window.armed.targetName || null } : null);

const arm = (frame, nm) => frame.evaluate((n) => window.handArm(n, 'act'), nm);

test.describe('S3d aiming never takes the roll picker away', () => {

  test.beforeEach(async ({ page }) => {
    await T.openTable(page, playerOnly());
  });

  /* ---- outside combat: the picker owns every right-click -------------------------- */

  test('outside combat, right-click on a token opens the roll picker', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: false });
    await closePicker(player);

    await rightClickToken(player, 'tkFoe');
    expect(await pickerOpen(player), 'no fight on, so this is the picker\'s gesture').toBe(true);
  });

  test('outside combat, right-click on bare table opens the roll picker', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: false });
    await closePicker(player);

    await rightClickMap(player);
    expect(await pickerOpen(player)).toBe(true);
  });

  test('outside combat, a held card cannot make a token swallow the picker', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);

    /* hold a card while a fight is on, then the fight ends with it still held */
    await seat(player, { active: true });
    await arm(player, 'Basic attack');
    await seat(player, { active: false });
    await closePicker(player);

    await rightClickToken(player, 'tkFoe');
    expect(await pickerOpen(player), 'the fight is over; the picker is back to owning this').toBe(true);
  });

  /* ---- inside combat: only a resolvable token is intercepted ---------------------- */

  test('inside combat, right-click a fighter with a card held aims and does not open the picker', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: true });
    await arm(player, 'Basic attack');
    await closePicker(player);

    await rightClickToken(player, 'tkFoe');

    expect(await armedTarget(player)).toEqual({ key: 'm:cb-erasure', name: 'The Erasure' });
    expect(await pickerOpen(player), 'this one case belongs to aiming').toBe(false);
  });

  test('inside combat, right-click a token that is not a fighter opens the roll picker', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: true });
    await arm(player, 'Basic attack');
    await closePicker(player);

    await rightClickToken(player, 'tkGhost');

    expect(await pickerOpen(player), 'a token resolving to nothing is not aiming\'s business').toBe(true);
    expect((await armedTarget(player)).key, 'and nothing was aimed at').toBe(null);
  });

  test('inside combat, right-click on bare table opens the roll picker', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: true });
    await arm(player, 'Basic attack');
    await closePicker(player);

    await rightClickMap(player);
    expect(await pickerOpen(player)).toBe(true);
  });

  /* Superseded by A4. This used to answer an empty hand with "choose an Act first"; the
   * ruling is now that right-clicking a foe with nothing held IS the standard attack,
   * because nothing held is not nothing meant. What has not changed, and is what this
   * case is really guarding, is that the gesture is still taken from the picker only
   * when it lands on a real fighter during a real fight. */
  /* Superseded twice. It first answered an empty hand with "choose an Act", then with a
   * standard attack; the ruling now is that it opens the choice of what to do and the
   * roll commits, which A9 covers in full. What this case is really guarding, and what
   * has never changed, is that the gesture is taken from the picker ONLY when it lands
   * on a real fighter during a real fight. */
  test('inside combat with no card held, right-click a fighter is aiming\'s, not the picker\'s', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: true });
    await closePicker(player);

    expect(await player.evaluate(() => window.armed), 'nothing held to begin with').toBe(null);
    await rightClickToken(player, 'tkFoe');

    expect(await player.evaluate(() => !!document.querySelector('#hand .hand-pickmenu')),
      'it offers the choice rather than assuming one').toBe(true);
    expect(await pickerOpen(player), 'and the roll picker stays out of it').toBe(false);
  });

  /* ---- tapping, the primary path -------------------------------------------------- */

  test('a tap with a card held aims at the token', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: true });
    await arm(player, 'Basic attack');

    await player.evaluate(() => {
      const t = window.S.tokens.find((x) => x.id === 'tkFoe');
      window.handAimByTap(t);
    });

    expect(await armedTarget(player)).toEqual({ key: 'm:cb-erasure', name: 'The Erasure' });
  });

  test('a tap with no card held selects the token, as it always did', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: true });

    const took = await player.evaluate(() => {
      const t = window.S.tokens.find((x) => x.id === 'tkFoe');
      return window.handAimByTap(t);
    });
    expect(took, 'nothing held, so the tap is not aiming\'s').toBe(false);
  });

  test('a tap on a token that is not a fighter is not aiming\'s either', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: true });
    await arm(player, 'Basic attack');

    const took = await player.evaluate(() => {
      const t = window.S.tokens.find((x) => x.id === 'tkGhost');
      return window.handAimByTap(t);
    });
    expect(took).toBe(false);
  });

  /* Only the player's OWN Fell is draggable for them, so it is the one token where a
   * drag could ever be mistaken for a tap. It also resolves to a fighter, which is what
   * makes this test mean something: nothing but the drag-versus-tap distinction is
   * standing between a moved token and a declared attack on yourself. */
  test('a drag moves the token and never aims', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: true });
    await arm(player, 'Basic attack');

    const moved = await player.evaluate(() => {
      const el = document.querySelector('.token[data-tok="tkMine"]');
      if (!el) throw new Error('the Fell token was not drawn');
      const before = window.S.tokens.find((t) => t.id === 'tkMine').x;
      const r = el.getBoundingClientRect();
      const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
      const ev = (type, cx, cy) => new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, clientX: cx, clientY: cy });
      el.setPointerCapture = function(){}; el.releasePointerCapture = function(){};
      el.dispatchEvent(ev('pointerdown', x, y));
      el.dispatchEvent(ev('pointermove', x + 140, y + 60));
      el.dispatchEvent(ev('pointerup', x + 140, y + 60));
      return { before: before, after: window.S.tokens.find((t) => t.id === 'tkMine').x };
    });

    /* if this is equal the drag never ran and the assertion below would pass for the
       wrong reason, which is exactly how the first version of this test fooled me */
    expect(moved.after, 'the drag actually ran and moved the token').not.toBe(moved.before);
    expect((await armedTarget(player)).key, 'dragging a token is moving it, not attacking it').toBe(null);
  });

  test('but a tap on that same token does aim, so the distinction is the only thing at work', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: true });
    await arm(player, 'Basic attack');

    await player.evaluate(() => {
      const el = document.querySelector('.token[data-tok="tkMine"]');
      const r = el.getBoundingClientRect();
      const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
      const ev = (type) => new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, clientX: x, clientY: y });
      el.setPointerCapture = function(){}; el.releasePointerCapture = function(){};
      el.dispatchEvent(ev('pointerdown'));
      el.dispatchEvent(ev('pointerup'));       /* no move between them: a tap */
    });

    expect(await armedTarget(player)).toEqual({ key: 'p:pl-7', name: 'Alarik' });
  });

  /* ---- the card shows where it points --------------------------------------------- */

  test('the held card names what it is pointed at', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: true });
    await arm(player, 'Basic attack');
    await rightClickToken(player, 'tkFoe');

    const text = await player.evaluate(() => {
      const c = document.querySelector('#hand .hcard.armed');
      return c ? c.textContent : null;
    });
    expect(text).toContain('The Erasure');
  });

  test('putting the card down forgets what it was pointed at', async ({ page }) => {
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await loadActs(player);
    await seat(player, { active: true });
    await arm(player, 'Basic attack');
    await rightClickToken(player, 'tkFoe');
    expect((await armedTarget(player)).key).toBe('m:cb-erasure');

    await player.evaluate(() => window.handDisarm());
    expect(await armedTarget(player)).toBe(null);
  });
});
