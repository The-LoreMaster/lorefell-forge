/* A19 — one card for a utility, and it asks before it says.
 *
 * From live play. Three complaints, all about the same card:
 *
 *   TWO ENTRIES FOR ONE DEED. Every Act-use utility was put on the row as its own card
 *   AND covered by the generic "Use a utility" - so a Fell carrying a Tablet had a
 *   Tablet card sitting next to a Use a utility card that could also produce the Tablet.
 *   The generic one is the right one; which utility is a choice made on it.
 *
 *   THE SAME FACT TWICE. Choosing a utility left the list open above the card while the
 *   card named the choice in gold below it. Neither read as the live one. The list closes
 *   on the answer now, and the card carries it.
 *
 *   A WINDOW OVER THE ROW. The target-first menu was drawn the full width of the table.
 *   It is a short list about one foe and is a block now, like the drop-up.
 *
 * And the rule underneath all of it: a utility or a skill that has a target asks for one,
 * through the same aim step an attack uses. Nothing resolves at nobody.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');
const path = require('path');
const { mountSheet } = require(path.join(__dirname, '_sheet.js'));

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
  { key: 'p:pl-9', name: 'Alarik', side: 'fell', charId: 'chr-ally-0002' }
];
const ACTS = [
  { src: 'Ashen Blade', nm: 'Basic attack', desc: 'standard strike', dmg: 6, base: 3, dt: 'phys',
    tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false },
  { src: 'skills', nm: 'Any skill', desc: 'pick one', dmg: 0, base: 0, dt: null,
    tier: null, kind: 'standard', contest: 'evasion', castSkill: '', locked: false },
  { src: 'utility', nm: 'Use a utility', desc: 'Spend your Act on a utility you carry.',
    dmg: 0, base: 0, dt: null, tier: null, kind: 'standard', contest: 'evasion',
    castSkill: '', locked: false, bar: '' }
];

async function seat(frame) {
  await frame.evaluate(() => {
    window.applyRemoteSnapshot = function () {};
    window.ensureSheet = function () {};
    var _sf = document.getElementById('sheetFrame'); if (_sf) _sf.remove();
  });
  await frame.evaluate(({ acts, fighters, myCharId }) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [
      { id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 400, y: 400, cells: 1 },
      { id: 'tkAlly', kind: 'p', refId: 'pl-9', charId: 'chr-ally-0002', name: 'Alarik', x: 800, y: 400, cells: 1 }
    ];
    window.__sent = [];
    window.sheet.postMessage = function (m) {
      if (!m || m.type !== 'ts-declare') return;
      window.__sent.push(m);
      window.handDeclareResult({ ok: true, round: m.round });
    };
    window.tsHandTake({ charge: 1, acts: acts, reacts: [], skills: { Guard: 3, Perception: 4 },
                        items: [{ name: 'Ashen Tonic', qty: 2, use: 'Act' },
                                { name: 'Tablet', qty: 1, use: 'Act' }],
                        stances: [], gates: { noAct: false, noReact: false, notes: [] },
                        active: true, round: 1, phase: 'commit', fighters: fighters });
    window.renderTokens(); window.render();
  }, { acts: ACTS, fighters: FIGHTERS, myCharId: F.FELL_CHAR_ID });
}

const cards = (frame) => frame.evaluate(() =>
  Array.from(document.querySelectorAll('#hand .hcard')).map((c) => ({
    act: c.getAttribute('data-act'),
    text: c.textContent.replace(/\s+/g, ' ').trim(),
    armed: c.classList.contains('armed')
  })));
const pickerUp = (frame) => frame.evaluate(() => !!document.querySelector('#hand .hand-pick'));
const pickerOpts = (frame) => frame.evaluate(() =>
  Array.from(document.querySelectorAll('#hand .hand-pick .hp-opt')).map((b) => b.getAttribute('data-val')));
const tapCard = (frame, nm) => frame.evaluate((n) => {
  Array.from(document.querySelectorAll('#hand .hcard'))
    .find((c) => c.getAttribute('data-act') === n).click();
}, nm);

test.describe('A19 one card, and it asks before it says', () => {

  test('the utility is chosen on the card, not listed beside it', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    const names = (await cards(player)).map((c) => c.act);
    expect(names, 'one entry for the deed').toContain('Use a utility');
    expect(names, 'and no second entry for the thing').not.toContain('Ashen Tonic');
    expect(names).not.toContain('Tablet');
  });

  test('taking it up asks which, and says nothing yet', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    expect(await pickerUp(player), 'nothing is asked before the card is taken up').toBe(false);

    await tapCard(player, 'Use a utility');
    expect(await pickerUp(player), 'the tap is what opens it').toBe(true);
    expect(await pickerOpts(player)).toEqual(['Ashen Tonic', 'Tablet']);

    const card = (await cards(player)).find((c) => c.act === 'Use a utility');
    expect(card.text, 'and the card names nothing while the list is up')
      .not.toContain('Ashen Tonic');
  });

  test('answering closes the list and the card carries the answer', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await tapCard(player, 'Use a utility');

    await player.evaluate(() => {
      document.querySelector('#hand .hand-pick .hp-opt[data-val="Tablet"]').click();
    });

    expect(await pickerUp(player), 'the list has done its job').toBe(false);
    const card = (await cards(player)).find((c) => c.act === 'Use a utility');
    expect(card.text, 'and the card says which').toContain('Tablet');
    expect(await player.evaluate(() => window.armed.item)).toBe('Tablet');
  });

  test('tapping the held card again re-opens the choice rather than dropping it', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await tapCard(player, 'Use a utility');
    await player.evaluate(() => {
      document.querySelector('#hand .hand-pick .hp-opt[data-val="Tablet"]').click();
    });

    await tapCard(player, 'Use a utility');
    expect(await pickerUp(player), 'changing your mind is commoner than putting it back').toBe(true);
    expect(await player.evaluate(() => !!window.armed), 'and the card is still held').toBe(true);

    /* and again, with the list open, does put it down */
    await tapCard(player, 'Use a utility');
    expect(await player.evaluate(() => !!window.armed)).toBe(false);
  });

  test('a utility still has to be aimed at somebody', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await tapCard(player, 'Use a utility');
    await player.evaluate(() => {
      document.querySelector('#hand .hand-pick .hp-opt[data-val="Ashen Tonic"]').click();
    });

    /* the roll is the commit, and it refuses to run without a target */
    await player.evaluate(() => window.handDeclare());
    expect(await player.evaluate(() => window.__sent), 'nothing resolves at nobody').toHaveLength(0);

    await player.evaluate(() => window.handAimByTap(window.S.tokens.find((t) => t.id === 'tkFoe')));
    expect(await player.evaluate(() => document.getElementById('tray').classList.contains('awaiting')),
      'the same aim step an attack uses').toBe(true);

    await player.evaluate(() => window.handRollDo(3));
    const out = await player.evaluate(() => window.__sent);
    expect(out).toHaveLength(1);
    expect(out[0].item).toBe('Ashen Tonic');
    expect(out[0].target).toBe('m:cb-erasure');
  });

  test('and it can be aimed at an ally, not only a foe', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await tapCard(player, 'Use a utility');
    await player.evaluate(() => {
      document.querySelector('#hand .hand-pick .hp-opt[data-val="Ashen Tonic"]').click();
    });
    await player.evaluate(() => window.handAimByTap(window.S.tokens.find((t) => t.id === 'tkAlly')));
    await player.evaluate(() => window.handRollDo(3));

    const out = await player.evaluate(() => window.__sent);
    expect(out[0].target, 'a tonic is for your friends').toBe('p:pl-9');
  });

  test('a skill asks the same way', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await tapCard(player, 'Any skill');
    expect(await pickerUp(player)).toBe(true);

    await player.evaluate(() => {
      document.querySelector('#hand .hand-pick .hp-opt[data-val="Perception"]').click();
    });
    expect(await pickerUp(player), 'closed on the answer, same as a utility').toBe(false);

    await player.evaluate(() => window.handAimByTap(window.S.tokens.find((t) => t.id === 'tkFoe')));
    await player.evaluate(() => window.handRollDo(2));
    const out = await player.evaluate(() => window.__sent);
    expect(out[0].skill).toBe('Perception');
    expect(out[0].target).toBe('m:cb-erasure');
  });

  test('the target-first menu is a block, not a band across the table', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await player.evaluate(() => {
      const el = document.querySelector('.token[data-tok="tkFoe"]');
      const r = el.getBoundingClientRect();
      el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true,
        clientX: Math.round(r.left + r.width / 2), clientY: Math.round(r.top + r.height / 2) }));
    });

    const g = await player.evaluate(() => {
      const m = document.querySelector('#hand .hand-pickmenu');
      const sc = document.querySelector('#hand .hand-scroll');
      const r = (n) => { const b = n.getBoundingClientRect(); return { l: b.left, r: b.right, w: b.width }; };
      return { menu: r(m), band: r(sc) };
    });
    expect(g.menu.w, 'a short list about one foe').toBeLessThanOrEqual(360);
    expect(g.menu.w, 'not the width of the table').toBeLessThan(g.band.w);
  });
});

/* ---- and the sheet's own derivation, where the duplicate was born ---- */

test.describe('A19 the sheet stops putting a utility on the row twice', () => {

  test('an Act utility makes no card of its own', async ({ page }) => {
    const frame = await mountSheet(page, { home: 'threadspire' });
    const acts = await frame.evaluate(() => {
      ITEMS_LIB = [
        { id: 'u1', name: 'Tablet', use: 'Act', desc: 'a tablet' },
        { id: 'u2', name: 'Warding Charm', use: 'React', desc: 'turn a blow' },
        { id: 'u3', name: 'Hearthstone', use: 'Passive', desc: 'warm' }
      ];
      C.inventory = [
        { itemId: 'u1', quantity: 1, discovered: true, equipped: true },
        { itemId: 'u2', quantity: 1, discovered: true, equipped: true },
        { itemId: 'u3', quantity: 1, discovered: true, equipped: true }
      ];
      C.attrs.wit.base = 5; C.attrs.wit.mod = 0;
      C.weapons = [];
      CUR_WIX_ID = 'chr-harness-0001';
      COMBAT = { active: true, round: 1, phase: 'commit', fighters: [], you: {} };
      renderBattle();
      return {
        acts: (window.COMBAT_ACTS || []).map((a) => a.nm),
        reacts: (window.COMBAT_REACTS || []).map((r) => r.nm)
      };
    });

    expect(acts.acts, 'the deed').toContain('Use a utility');
    expect(acts.acts, 'and not the thing as well').not.toContain('Tablet');
    expect(acts.reacts, 'a React utility still belongs to the Reacts tab, by name')
      .toContain('Warding Charm');
    expect(acts.acts, 'a Passive is never a chosen Act').not.toContain('Hearthstone');
  });
});
