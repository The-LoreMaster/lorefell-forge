/* A20 — the fight lives on the gem, and the LoreMaster can see who is ready.
 *
 * THE PANEL. The combat banner is appended to the sheet's body, so with the sheet showing
 * inside a slideout it turned up under Inventory, Skills, Arsenal, Attributes and Lore
 * alike: five reference tabs each wearing a combat panel nobody asked that tab for.
 * Removing the takeover was only half the job - the panel still had to have a home. It is
 * the Fellmark gem, and only the gem.
 *
 * LOCKED IN. A declare does not travel on the board state; it is a row of its own the
 * LoreMaster has to go and read, and declaresLoad ran when a fight began, when the round
 * ticked, and when they pressed a button. So a player declaring changed nothing on the
 * LoreMaster's screen - the one person who needs to know who they are waiting on was the
 * last to find out.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');
const path = require('path');
const { mountSheet } = require(path.join(__dirname, '_sheet.js'));

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
function playerOnly() { return { player: bothSides().player }; }

test.describe('A20 the fight lives on the gem', () => {

  async function seatPlayer(frame) {
    await frame.evaluate(() => {
      window.applyRemoteSnapshot = function () {};
      window.S.role = 'player'; window.S.mode = 'combat';
      window.render();
    });
  }

  test('the gem leads to the fight while one is on', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seatPlayer(player);

    await player.evaluate(() => document.getElementById('hudFell').click());
    expect(await player.evaluate(() => window.S.openSection), 'the gem is where the fight is')
      .toBe('combat');
    expect(await player.evaluate(() => window.S.sheetPanel),
      'and the sheet is told which surface to show').toBe('combat');
  });

  test('and to the menu when there is not', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await player.evaluate(() => {
      window.applyRemoteSnapshot = function () {};
      window.S.role = 'player'; window.S.mode = 'explore';
      window.render();
    });

    await player.evaluate(() => document.getElementById('hudFell').click());
    expect(await player.evaluate(() => window.S.openSection),
      'out of a fight the gem is the menu it has always been').toBe('menu');
  });

  test('the five reference tabs ask for themselves, never for the fight', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seatPlayer(player);

    for (const key of ['inventory', 'skills', 'arsenal', 'attributes', 'lore']) {
      await player.evaluate((k) => window.openWin(k), key);
      const asked = await player.evaluate(() => window.S.sheetPanel);
      expect(asked, key + ' asked the sheet for the combat panel').not.toBe('combat');
      await player.evaluate(() => window.closeWin());
    }
  });
});

test.describe('A20 the sheet shows the fight only where it belongs', () => {

  async function inFight(page) {
    const frame = await mountSheet(page, { home: 'threadspire' });
    await frame.evaluate(() => {
      C.weapons = []; C.inventory = [];
      CUR_WIX_ID = 'chr-harness-0001';
      COMBAT = { active: true, round: 1, phase: 'commit',
                 fighters: [{ key: 'p:pl-7', name: 'Maerwen', side: 'fell', charId: 'chr-harness-0001' }],
                 you: {} };
      renderBattle(); applyCombatMode();
    });
    return frame;
  }
  const bannerShown = (frame) => frame.evaluate(() => {
    const b = document.getElementById('combatBanner');
    return !!b && b.style.display !== 'none' && !!b.innerHTML;
  });

  test('a reference panel carries no combat banner', async ({ page }) => {
    const frame = await inFight(page);
    for (const panel of ['lore', 'skills', 'weapons', 'attributes', 'inventory']) {
      await frame.evaluate((p) => { window.onmessage({ data: { type: 'goto-panel', panel: p } }); }, panel);
      expect(await bannerShown(frame), panel + ' still wears the combat panel').toBe(false);
    }
  });

  test('the gem panel is the banner, and takes the room', async ({ page }) => {
    const frame = await inFight(page);
    await frame.evaluate(() => { window.onmessage({ data: { type: 'goto-panel', panel: 'combat' } }); });

    expect(await bannerShown(frame), 'asked for, and there').toBe(true);
    expect(await frame.evaluate(() => document.body.classList.contains('cbs-full')),
      'the slideout was opened for the fight, so the fight is what is in it').toBe(true);
  });

  test('going back to a tab puts the fight away again', async ({ page }) => {
    const frame = await inFight(page);
    await frame.evaluate(() => { window.onmessage({ data: { type: 'goto-panel', panel: 'combat' } }); });
    expect(await bannerShown(frame)).toBe(true);

    await frame.evaluate(() => { window.onmessage({ data: { type: 'goto-panel', panel: 'lore' } }); });
    expect(await bannerShown(frame), 'the Lore tab is the Lore tab').toBe(false);
    expect(await frame.evaluate(() => document.body.classList.contains('cbs-full'))).toBe(false);
  });

  test('standalone, with no gem to open, the fight is simply the sheet', async ({ page }) => {
    const frame = await mountSheet(page, { home: 'standalone' });
    await frame.evaluate(() => {
      C.weapons = []; C.inventory = [];
      CUR_WIX_ID = 'chr-harness-0001';
      COMBAT = { active: true, round: 1, phase: 'commit',
                 fighters: [{ key: 'p:pl-7', name: 'Maerwen', side: 'fell', charId: 'chr-harness-0001' }],
                 you: {} };
      renderBattle(); applyCombatMode();
    });
    expect(await bannerShown(frame), 'there is no table to defer to out here').toBe(true);
  });
});

test.describe('A20 the LoreMaster sees who is locked in', () => {

  test('a declare that lands is read without anyone pressing anything', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    await frames.lm.evaluate((cid) => {
      window.applyRemoteSnapshot = function () {};
      window.S.mode = 'combat';
      window.S.map = { w: 2400, h: 1600 };
      window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
      window.S.tokens = [{ id: 'tkFell', kind: 'p', refId: 'pl-7', charId: cid, name: 'Maerwen', x: 400, y: 400, cells: 1 }];
      window.S.declares = [];
      window.renderTokens();
    }, F.FELL_CHAR_ID);

    const ringed = () => frames.lm.evaluate(() => {
      const el = document.querySelector('.token[data-tok="tkFell"]');
      return !!el && el.classList.contains('declared');
    });
    expect(await ringed(), 'nobody has declared yet').toBe(false);

    /* the player declares, and nobody touches the LoreMaster's screen */
    await frames.player.evaluate((cid) => {
      window.parent.postMessage({ type: 'TS_TOOL_UP', tool: 'fellglass', msg: {
        type: 'combat-declare', charId: cid, act: 'Basic attack', react: '', target: 'm:cb-erasure',
        round: 1, dmg: 6, base: 3, dt: 'phys', actTier: 0, acc: 7, roll: 4, kind: 'weapon',
        charge: 0, curVit: 28, maxVit: 28, affs: []
      } }, '*');
    }, F.FELL_CHAR_ID);
    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);

    /* the feed reads declares on its own now: the LoreMaster finds out by waiting, which
       is the only thing they were not able to do before */
    await frames.lm.waitForFunction(() => {
      const el = document.querySelector('.token[data-tok="tkFell"]');
      return !!el && el.classList.contains('declared');
    }, null, { timeout: 8000 });

    expect(await ringed(), 'and the board says who is committed').toBe(true);
  });

  test('it does not go looking while there is no fight on', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await frames.lm.evaluate(() => {
      window.applyRemoteSnapshot = function () {};
      window.S.mode = 'explore';
      window.__loads = 0;
      const real = window.declaresLoad;
      window.declaresLoad = function () { window.__loads++; return real.apply(this, arguments); };
    });

    await page.waitForTimeout(4000);
    expect(await frames.lm.evaluate(() => window.__loads),
      'a fetch every few seconds out of combat is a fetch for nothing').toBe(0);
  });
});
