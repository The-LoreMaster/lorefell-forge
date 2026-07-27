/* A7 — the old tracker is gone, and slideouts coexist with the fight.
 *
 * Two problems that were one problem. The sheet's own combat tracker was still reachable
 * and competed with the card row for the same job, and a player in a fight could not open
 * their Inventory or Skills because everything led back to that tracker. More Options led
 * there too, which is how they were entangled.
 *
 * The rules now:
 *   the card row under the map is the ONLY player combat surface; the sheet's battle
 *   panel is not reachable from the table at all
 *   a player can open every reference panel and the gem DURING a fight
 *   a slideout and the cards are never both open: the row steps aside while one is open
 *   and comes straight back when it closes
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

const HAND = {
  charge: 2, gates: { noAct: false, noReact: false, notes: [] },
  skills: { Guard: 3 }, items: [], stances: [],
  active: true, round: 1, phase: 'commit', fighters: [],
  acts: [{ src: 'Blade', nm: 'Basic attack', desc: 'standard strike', dmg: 4, base: 2, dt: 'phys',
           tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false }],
  reacts: [{ src: 'movement', nm: 'Move', desc: 'a react', tier: null, kind: 'standard', locked: false }]
};

async function deal(frame) {
  await frame.evaluate(() => { window.applyRemoteSnapshot = function () {}; });
  await frame.evaluate((h) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.tsHandTake(h); window.render();
  }, HAND);
}

const rowShown = (frame) => frame.evaluate(() =>
  !document.getElementById('hand').classList.contains('hidden'));
const openSection = (frame) => frame.evaluate(() => window.S.openSection);

test.describe('A7 the tracker goes, the slideouts stay', () => {

  test('the sheet\'s battle panel is not reachable from the table', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    const panels = await player.evaluate(() => Object.keys(window.SHEET_PANELS));
    expect(panels, 'the old tracker is not a panel a player can open').not.toContain('battle');
  });

  test('the gem leads to the menu in a fight, not to the tracker', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    await player.evaluate(() => document.querySelector('.hFell').click());
    expect(await openSection(player), 'the gem is the player\'s menu, in a fight as out of one').toBe('menu');
  });

  test('and so does More Options, since it follows the gem', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    await player.evaluate(() => document.getElementById('moreOpt').click());
    expect(await openSection(player)).toBe('menu');
  });

  test('every reference panel opens during a fight', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    /* the whole reason for keeping the slideout: a player mid-fight can still look
       things up about their own Fell */
    for (const key of ['inventory', 'skills', 'arsenal', 'attributes', 'lore']) {
      await player.evaluate((k) => window.openWin(k), key);
      expect(await openSection(player), `${key} opens in combat`).toBe(key);
      await player.evaluate(() => window.closeWin());
    }
  });

  test('the row steps aside for a slideout and comes back after', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    expect(await rowShown(player), 'cards on the table').toBe(true);

    await player.evaluate(() => window.openWin('inventory'));
    expect(await rowShown(player), 'never both at once').toBe(false);

    await player.evaluate(() => window.closeWin());
    expect(await rowShown(player), 'and straight back when it closes').toBe(true);
  });

  test('the gem does it too, not only the rail tabs', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    await player.evaluate(() => document.querySelector('.hFell').click());
    expect(await rowShown(player), 'the gem is a slideout like any other').toBe(false);

    await player.evaluate(() => window.closeWin());
    expect(await rowShown(player)).toBe(true);
  });

  test('a slideout is not the battle ending, so the reminder stays spent', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    const pillHidden = () => player.evaluate(() =>
      document.getElementById('moreOpt').classList.contains('hidden'));

    await player.evaluate(() => document.getElementById('moreOpt').click());
    expect(await pillHidden(), 'spent').toBe(true);

    await player.evaluate(() => window.closeWin());
    /* the row is back, and the reminder must NOT be: opening a slideout is not a new
       fight, and conflating the two brought it back every time */
    expect(await rowShown(player)).toBe(true);
    expect(await pillHidden(), 'still spent for this battle').toBe(true);
  });

  test('out of combat there is no row and no pill', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    await player.evaluate(() => { window.S.mode = 'roleplay'; window.render(); });
    expect(await rowShown(player)).toBe(false);
    expect(await player.evaluate(() =>
      document.getElementById('moreOpt').classList.contains('hidden'))).toBe(true);
  });
});
