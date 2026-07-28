/* A1 — the sheet stops offering a second place to declare.
 *
 * The table's card row is the player combat surface now. Inside ThreadSpire the sheet
 * must not also render the declare builder: two builders for one Beat is how a
 * declaration gets made twice, or made in the place nobody is looking at.
 *
 * Two things this must NOT do, and both are asserted:
 *   - it must not touch the transport or the derivation. sendDeclare and
 *     COMBAT_ACTS/COMBAT_REACTS are exactly what the table row runs on, so removing the
 *     on-sheet UI while leaving those intact is the whole trick.
 *   - it must not take the standalone sheet's declare form away. There is no map there,
 *     so that form is the only way a player can declare at all.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { mountSheet, weaponRecord } = require(path.join(__dirname, '_sheet.js'));

/* Put the sheet in a live fight in whichever home is asked for. */
async function inCombat(page, home) {
  const frame = await mountSheet(page, { home: home });
  const w = await weaponRecord(frame, 'Blade', 5);
  await frame.evaluate(({ weapon, where }) => {
    C.weapons = [weapon];
    C.charge = 0;
    CUR_WIX_ID = 'chr-harness-0001';
    COMBAT = { active: true, round: 1, phase: 'commit',
               fighters: [{ key: 'm:cb-1', name: 'A foe', side: 'monster', charId: '' }],
               spotlightChars: [], you: {} };
    renderBattle();
    /* On the table the fight shows on the Fellmark gem and nowhere else (A20), so asking
       for that panel is what a player opening the gem does. Standalone there is no gem and
       no table, and the sheet simply IS the combat surface. */
    if (where === 'threadspire') window._tsPanel = 'combat';
    applyCombatMode();
  }, { weapon: w, where: home });
  return frame;
}

const banner = (frame) => frame.evaluate(() => {
  const b = document.getElementById('combatBanner');
  return b ? { html: b.innerHTML, text: b.textContent } : null;
});

const hasDeclareForm = (frame) => frame.evaluate(() =>
  !!document.getElementById('cbAct') || !!document.getElementById('cbSend'));

test.describe('A1 the declare builder leaves the sheet, and only that', () => {

  test('in ThreadSpire the sheet offers no declare builder', async ({ page }) => {
    const frame = await inCombat(page, 'threadspire');

    expect(await hasDeclareForm(frame),
      'no Act select and no Send button: the table has those now').toBe(false);

    const b = await banner(frame);
    expect(b.text, 'and it says where declaring happens instead').toContain('Declare from the map');
  });

  test('and it points the player at what the sheet is still for', async ({ page }) => {
    const frame = await inCombat(page, 'threadspire');
    const b = await banner(frame);
    expect(b.text).toMatch(/Inventory|Skills|Lore|Arsenal/);
  });

  test('the slideout stops being swallowed by the declare panel', async ({ page }) => {
    const frame = await inCombat(page, 'threadspire');
    /* Asked for the fight, it takes the room - that slideout was opened for it. What was
       being swallowed was the REFERENCE tabs, and the fight is not on those at all now
       (A20), so going to one gives the height back and takes the banner with it. */
    expect(await frame.evaluate(() => document.body.classList.contains('cbs-full')),
      'the gem panel is the fight').toBe(true);

    await frame.evaluate(() => { window.onmessage({ data: { type: 'goto-panel', panel: 'lore' } }); });
    const onATab = await frame.evaluate(() => ({
      full: document.body.classList.contains('cbs-full'),
      banner: (document.getElementById('combatBanner') || {}).style
        ? document.getElementById('combatBanner').style.display !== 'none' : false
    }));
    expect(onATab.full, 'the panel that justified the full height is not on this tab').toBe(false);
    expect(onATab.banner, 'nor is the banner').toBe(false);
  });

  test('the reference panels still work while a fight is on', async ({ page }) => {
    const frame = await inCombat(page, 'threadspire');

    /* the whole point of keeping the slideout: a player mid-fight can still look things
       up. Each of these is a real panel on the sheet. */
    for (const panel of ['inventory', 'skills', 'lore', 'weapons', 'attributes']) {
      const ok = await frame.evaluate((p) => {
        try { switchPanel(p); } catch (e) { return 'threw: ' + e.message; }
        const el = document.querySelector('.panel.active');
        return el ? el.id || el.getAttribute('data-panel') || 'active' : 'none';
      }, panel);
      expect(ok, `the ${panel} panel still opens`).not.toContain('threw');
    }
  });

  test('the transport and the derivation are untouched', async ({ page }) => {
    const frame = await inCombat(page, 'threadspire');

    const kept = await frame.evaluate(() => ({
      transport: typeof sendDeclare,
      transportTakesPayload: sendDeclare.length,
      builder: typeof cbDeclare,
      acts: (window.COMBAT_ACTS || []).length,
      reacts: (window.COMBAT_REACTS || []).length
    }));

    expect(kept.transport, 'the table row declares through this').toBe('function');
    expect(kept.transportTakesPayload).toBe(1);
    expect(kept.builder, 'and assembles the payload through this').toBe('function');
    expect(kept.acts, 'the hand the row draws is still derived').toBeGreaterThan(0);
    expect(kept.reacts).toBeGreaterThan(0);
  });

  test('a declare still goes out when the table asks for one', async ({ page }) => {
    const frame = await inCombat(page, 'threadspire');
    await page.evaluate(() => { window.FSH.declaresOut = []; window.FSH.lastDeclareResult = null; });

    await frame.evaluate(() => {
      window.onmessage({ data: { type: 'ts-declare', act: 'Basic attack', target: 'm:cb-1', round: 1, roll: 4 } });
    });
    await page.waitForFunction(() => window.FSH.lastDeclareResult !== null);

    expect((await page.evaluate(() => window.FSH.lastDeclareResult)).ok,
      'retiring the on-sheet UI must not retire declaring').toBe(true);
    expect(await page.evaluate(() => window.FSH.declaresOut.length)).toBe(1);
  });

  test('standalone, with no map to declare from, the form stays', async ({ page }) => {
    const frame = await inCombat(page, 'standalone');

    expect(await hasDeclareForm(frame),
      'there is no card row on a bare sheet; taking this away would leave no way to declare').toBe(true);
  });
});
