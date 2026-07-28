/* A8 — Reacts belong to resolution, and stance is one of them.
 *
 * Two rules from live play.
 *
 * REACTS ARE NOT DECLARED. A Beat is declared as an Act; the React answers what happens
 * afterwards and is spent during resolution at a moment the player chooses. With both
 * tabs up while declaring, players were picking a React and never declaring an Act at
 * all, so the Reacts tab is simply absent until the board is resolving.
 *
 * STANCE IS A REACT. Changing armour stance sat in the Acts and cost a player their whole
 * Act to do something they should be able to do while still striking. Moving it also puts
 * it behind the resolution rule above, which is where it belongs.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const T = require('./_table.js');
const { mountSheet, weaponRecord } = require(path.join(__dirname, '_sheet.js'));

const F = T.FIXTURES;

function playerOnly() {
  return {
    player: {
      role: 'player', campaignId: F.CAMPAIGN_A, characterId: F.FELL_CHAR_ID,
      character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A
    }
  };
}

function handAt(phase, opts) {
  opts = opts || {};
  return {
    charge: 2, gates: { noAct: false, noReact: false, notes: [] },
    skills: { Guard: 3 }, items: [], stances: ['Shrouded', 'Stalwart', 'Vestments'], worn: 'Stalwart',
    active: true, round: 1, phase: phase,
    opening: !!opts.opening, openingSide: opts.opening ? 'fell' : '', inOpening: !!opts.inOpening,
    fighters: [{ key: 'm:cb-1', name: 'The Erasure', side: 'monster', charId: '' }],
    acts: [{ src: 'Blade', nm: 'Basic attack', desc: 'standard strike', dmg: 4, base: 2, dt: 'phys',
             tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false }],
    reacts: [{ src: 'movement', nm: 'Move', desc: 'a react', tier: null, kind: 'standard', locked: false },
             { src: 'armor', nm: 'Change Armor Stance', desc: 'Shift your armour stance. Spends your React.',
               tier: null, kind: 'standard', locked: false }]
  };
}

async function deal(frame, phase, opts) {
  await frame.evaluate(() => { window.applyRemoteSnapshot = function () {};
    /* and the sheet in this frame, which is real and boots on its own clock. When it
       finishes it posts a hand of its own - inactive, empty - which replaces whatever a
       spec injected and empties the row, taking any note with it. Whether that lands
       before or after an assertion moves with machine load, which is what made it look
       like noise. Specs that drive the REAL sheet do not pin this; specs that inject a
       hand must. */
    window.ensureSheet = function () {};
    var _sf = document.getElementById("sheetFrame"); if (_sf) _sf.remove(); });
  await frame.evaluate((h) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.tsHandTake(h); window.render();
  }, handAt(phase, opts));
}

const tabs = (frame) => frame.evaluate(() =>
  Array.from(document.querySelectorAll('#hand .hand-tab')).map((t) => t.getAttribute('data-tab')));
const shownNames = (frame) => frame.evaluate(() =>
  Array.from(document.querySelectorAll('#hand .hcard')).map((c) => c.getAttribute('data-act')));

test.describe('A8 Reacts live in resolution', () => {

  test('while declaring there is no Reacts tab at all', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player, 'commit');

    expect(await tabs(player), 'one group to choose from while declaring').toEqual(['act']);
    expect(await shownNames(player)).toEqual(['Basic attack']);
  });

  test('once the board resolves, the Reacts tab appears', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');

    await deal(player, 'commit');
    expect(await tabs(player)).toEqual(['act']);

    await deal(player, 'resolve');
    expect(await tabs(player), 'the React is spent during resolution').toEqual(['act', 'react']);
  });

  test('the tab cannot be reached while declaring, even by asking for it', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player, 'commit');

    await player.evaluate(() => window.handSetTab('react'));
    expect(await shownNames(player), 'still the Acts').toEqual(['Basic attack']);
  });

  test('a player left on the Reacts tab is moved back when the round returns to declaring', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');

    await deal(player, 'resolve');
    await player.evaluate(() => window.handSetTab('react'));
    expect((await shownNames(player))[0]).toBe('Move');

    /* the next round begins and the board is taking declarations again */
    await deal(player, 'commit');
    expect(await shownNames(player), 'not stranded on a tab that is gone').toEqual(['Basic attack']);
    expect(await tabs(player)).toEqual(['act']);
  });

  test('nobody Reacts in the ambush opening either', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');

    /* the opening resolves as a Spotlight, so phase alone would say Reacts are open;
       canon says no React in it, and that wins */
    await deal(player, 'resolve', { opening: true, inOpening: true });
    expect(await tabs(player)).toEqual(['act']);
  });

  test('Change Armor Stance is a React on the row, not an Act', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player, 'resolve');

    expect(await shownNames(player), 'not among the Acts').not.toContain('Change Armor Stance');
    await player.evaluate(() => window.handSetTab('react'));
    expect(await shownNames(player), 'among the Reacts').toContain('Change Armor Stance');
  });
});

/* ---- and the sheet agrees, in its own derivation ------------------------------------ */

test.describe('A8 the sheet derives stance as a React', () => {

  test('Change Armor Stance leaves COMBAT_ACTS for COMBAT_REACTS', async ({ page }) => {
    const frame = await mountSheet(page, { home: 'threadspire' });
    const w = await weaponRecord(frame, 'Blade', 5);
    const sets = await frame.evaluate(({ weapon }) => {
      C.weapons = [weapon];
      renderBattle();
      return {
        acts: (window.COMBAT_ACTS || []).map((a) => a.nm),
        reacts: (window.COMBAT_REACTS || []).map((r) => r.nm)
      };
    }, { weapon: w });

    expect(sets.acts, 'it cost a whole Act to change stance, which it should not')
      .not.toContain('Change Armor Stance');
    expect(sets.reacts).toContain('Change Armor Stance');
  });
});
