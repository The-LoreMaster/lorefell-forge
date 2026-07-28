/* A6 — a fight starting reaches the table, through every real seam.
 *
 * This is the case the other 158 could not have caught, and it exists because they did
 * not. Every card-row spec injects a hand directly, which is the right way to test what
 * the row DRAWS and precisely why none of them ever asked the sheet to notice a fight and
 * say so. tsSendHand was wired to the hand being rebuilt and to the charge changing, but
 * not to combat state arriving, so a LoreMaster could start a battle and the player's row
 * would never appear. Green suite, dead feature.
 *
 * So nothing is injected here. The LoreMaster starts a fight the way a LoreMaster does,
 * and the assertions walk the whole road:
 *
 *   the sheet is embedded as the real page embeds it, with ?host=threadspire
 *   so body.tsembed is set, so cbOnTable() is true
 *   so A1 replaces the declare builder with the pointer at the table
 *   and the combat state reaching the sheet makes it hand out a live hand
 *   so the row appears with cards on it
 *
 * It is slow, because it waits on the sheet's real fifteen second combat poll. That is
 * the point: it is the only case here that runs at the table's own speed.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

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

/* The sheet ThreadSpire hosts inside a given frame. It loads itself 1.5s after boot, so
 * this waits for it rather than assuming. */
async function sheetOf(page, frame) {
  await frame.waitForFunction(() => {
    const f = document.getElementById('sheetFrame');
    return !!(f && f.src && f.contentWindow);
  }, { timeout: 20000 });
  await page.waitForTimeout(600);
  const kids = frame.childFrames();
  if (!kids.length) throw new Error('ThreadSpire never stood its sheet up');
  return kids[0];
}

test.describe('A6 a fight reaches the table', () => {

  test('the embedded sheet is loaded the way the real page loads it', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    const sheet = await sheetOf(page, frames.player);

    const how = await sheet.evaluate(() => ({
      search: location.search,
      tsembed: document.body.classList.contains('tsembed'),
      onTable: typeof cbOnTable === 'function' ? cbOnTable() : null
    }));

    /* Without the host param the sheet believes it is standalone, keeps its own chrome,
       and goes on offering the declare builder A1 removed. Everything downstream of
       cbOnTable() depends on this one query string. */
    expect(how.search, 'the sheet is embedded, and told so').toContain('host=threadspire');
    expect(how.tsembed, 'so it wears body.tsembed').toBe(true);
    expect(how.onTable, 'so it knows there is a table in front of the player').toBe(true);
  });

  test('the LoreMaster starts a fight and the player gets a card row', async ({ page }) => {
    /* the sheet polls combat state every fifteen seconds; this waits for a real one */
    test.setTimeout(90000);

    const frames = await T.openTableAndBoot(page, bothSides());
    const sheet = await sheetOf(page, frames.player);

    /* before: no fight, no row, and the sheet is not offering a builder either */
    expect(await frames.player.evaluate(() =>
      document.getElementById('hand').classList.contains('hidden')), 'no fight, no row').toBe(true);

    await frames.lm.evaluate(() => window.devCombat());

    /* the row appears only because the sheet noticed the fight and said so */
    await frames.player.waitForFunction(() => window.hand && window.hand.active === true,
      { timeout: 45000 });

    const row = await frames.player.evaluate(() => ({
      shown: !document.getElementById('hand').classList.contains('hidden'),
      cards: document.querySelectorAll('#hand .hcard').length,
      tabs: Array.from(document.querySelectorAll('#hand .hand-tab')).map((t) => t.getAttribute('data-tab')),
      pill: !document.getElementById('moreOpt').classList.contains('hidden')
    }));

    expect(row.shown, 'the row is up').toBe(true);
    expect(row.cards, 'with the Fell\'s own Acts on it, derived rather than injected').toBeGreaterThan(0);
    /* Acts only: a fight that has just begun is taking declarations, and Reacts do not
       appear until the board is resolving (A8). */
    expect(row.tabs).toEqual(['act']);
    expect(row.pill, 'and the reminder pill with it').toBe(true);
  });

  test('and the sheet points at the table instead of offering its own builder', async ({ page }) => {
    test.setTimeout(90000);

    const frames = await T.openTableAndBoot(page, bothSides());
    const sheet = await sheetOf(page, frames.player);

    await frames.lm.evaluate(() => window.devCombat());
    await frames.player.waitForFunction(() => window.hand && window.hand.active === true,
      { timeout: 45000 });

    /* The fight lives on the Fellmark gem now (A20), so this asks for it the way a player
       opening the gem does, then reads what the gem shows them. */
    await sheet.evaluate(() => { window.onmessage({ data: { type: 'goto-panel', panel: 'combat' } }); });

    const shown = await sheet.evaluate(() => {
      const bn = document.getElementById('combatBanner');
      return {
        builder: !!document.getElementById('cbAct') || !!document.getElementById('cbSend'),
        folded: /hand stays folded/i.test(bn ? bn.textContent : ''),
        text: bn ? bn.textContent.replace(/\s+/g, ' ') : '',
        cbsFull: document.body.classList.contains('cbs-full')
      };
    });

    expect(shown.builder, 'the on-sheet declare builder is gone in a ThreadSpire fight').toBe(false);
    expect(shown.folded, 'and so is its folded-hand prompt').toBe(false);
    expect(shown.text, 'it points at the table instead').toContain('Declare from the map');
    /* and it DOES take the room here, because the slideout was opened FOR the fight. The
       height it used to steal was from the five reference tabs, which no longer see it. */
    expect(shown.cbsFull, 'the gem panel is the fight and nothing else').toBe(true);
  });
});
