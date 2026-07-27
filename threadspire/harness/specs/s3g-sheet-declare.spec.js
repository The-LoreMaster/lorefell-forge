/* S3g — the sheet's half of ts-declare, against the real sheet.
 *
 * S3f drives the row and stubs the sheet, because what it is about is the row, the round
 * it stamps and the road out. That leaves the sheet's own half unproven, and the sheet is
 * where the round gate actually lives, so this covers it against docs/fellglass.html
 * itself with nothing standing in.
 *
 * The gate matters because its failure is invisible. mergeDeclares clears a declare whose
 * round is not the round the board is running, so a stale one is not rejected, it is
 * erased, and neither side says anything. Refusing it here, out loud, is the difference
 * between a player being told to declare again and a player watching their Act evaporate.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { mountSheet, weaponRecord } = require(path.join(__dirname, '_sheet.js'));

/* Put the sheet in a fight, holding a weapon with a basic attack. */
async function inCombat(page, round) {
  const frame = await mountSheet(page, { home: 'threadspire' });
  const w = await weaponRecord(frame, 'Blade', 5);
  await frame.evaluate(({ weapon, round }) => {
    C.weapons = [weapon];
    C.charge = 0;
    CUR_WIX_ID = 'chr-harness-0001';
    COMBAT = { active: true, round: round, phase: 'commit', fighters: [
      { key: 'm:cb-1', name: 'A foe', side: 'monster', charId: '' }
    ], you: {} };
    renderBattle();
  }, { weapon: w, round });
  return frame;
}

const declare = (page, frame, msg) => frame.evaluate((m) => { window.onmessage({ data: m }); }, msg);
const result = (page) => page.evaluate(() => window.FSH.lastDeclareResult);
const sentOut = (page) => page.evaluate(() => window.FSH.declaresOut);

test.describe('S3g the sheet decides whether a declare goes out', () => {

  test('a good declare is accepted and a combat-declare goes out', async ({ page }) => {
    const frame = await inCombat(page, 3);

    await declare(page, frame, { type: 'ts-declare', act: 'Basic attack', target: 'm:cb-1', round: 3, roll: 4 });
    await page.waitForFunction(() => window.FSH.lastDeclareResult !== null);

    expect((await result(page)).ok).toBe(true);

    await page.waitForFunction(() => window.FSH.declaresOut.length > 0);
    const out = (await sentOut(page))[0];
    expect(out.act).toBe('Basic attack');
    expect(out.target).toBe('m:cb-1');
    expect(out.round, 'stamped with the round it was made for').toBe(3);
    expect(typeof out.reqId, 'and carrying a reqId, so the ack can be matched').toBe('number');
  });

  test('a declare for a round that has passed is refused, and nothing goes out', async ({ page }) => {
    const frame = await inCombat(page, 3);

    /* the row was still drawing round 2 when the player tapped */
    await declare(page, frame, { type: 'ts-declare', act: 'Basic attack', target: 'm:cb-1', round: 2, roll: 4 });
    await page.waitForFunction(() => window.FSH.lastDeclareResult !== null);

    const res = await result(page);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('stale-round');
    expect(res.round, 'and says which round the fight is actually on').toBe(3);
    expect(await sentOut(page), 'nothing was posted to be silently cleared').toEqual([]);
  });

  test('a declare for a round that has not happened yet is refused too', async ({ page }) => {
    const frame = await inCombat(page, 3);

    await declare(page, frame, { type: 'ts-declare', act: 'Basic attack', target: 'm:cb-1', round: 4, roll: 4 });
    await page.waitForFunction(() => window.FSH.lastDeclareResult !== null);

    expect((await result(page)).reason, 'the gate is equality, not "at least"').toBe('stale-round');
    expect(await sentOut(page)).toEqual([]);
  });

  test('a declare with no round at all is refused rather than defaulted', async ({ page }) => {
    const frame = await inCombat(page, 3);

    await declare(page, frame, { type: 'ts-declare', act: 'Basic attack', target: 'm:cb-1', roll: 4 });
    await page.waitForFunction(() => window.FSH.lastDeclareResult !== null);

    expect((await result(page)).reason, 'guessing a round is what this exists to prevent').toBe('stale-round');
    expect(await sentOut(page)).toEqual([]);
  });

  test('an attack with no roll is refused', async ({ page }) => {
    const frame = await inCombat(page, 3);

    await declare(page, frame, { type: 'ts-declare', act: 'Basic attack', target: 'm:cb-1', round: 3 });
    await page.waitForFunction(() => window.FSH.lastDeclareResult !== null);

    expect((await result(page)).reason).toBe('needs-roll');
    expect(await sentOut(page)).toEqual([]);
  });

  test('an Act the sheet does not have is refused', async ({ page }) => {
    const frame = await inCombat(page, 3);

    await declare(page, frame, { type: 'ts-declare', act: 'Sunderbane', target: 'm:cb-1', round: 3, roll: 4 });
    await page.waitForFunction(() => window.FSH.lastDeclareResult !== null);

    expect((await result(page)).reason).toBe('unknown-act');
    expect(await sentOut(page)).toEqual([]);
  });

  test('an Act above the charge is refused even if the row asked for it', async ({ page }) => {
    const frame = await inCombat(page, 3);

    /* the row should never offer this, but the sheet is the one that knows, and a second
       surface onto the same Beat is exactly where a stale hand would show up */
    const named = await frame.evaluate(() => {
      ABILITIES = [{ name: 'Tier Two Strike', use: 'Act', tier: 2 }];
      C.weapons[0].abilities = ['Tier Two Strike'];
      C.charge = 0;
      renderBattle();
      return (window.COMBAT_ACTS || []).some((a) => a.nm === 'Tier Two Strike');
    });
    expect(named, 'the act is on the sheet, just out of reach').toBe(true);

    await declare(page, frame, { type: 'ts-declare', act: 'Tier Two Strike', target: 'm:cb-1', round: 3, roll: 4 });
    await page.waitForFunction(() => window.FSH.lastDeclareResult !== null);

    expect((await result(page)).reason).toBe('locked');
    expect(await sentOut(page)).toEqual([]);
  });

  test('a declare with no fight on is refused', async ({ page }) => {
    const frame = await inCombat(page, 3);
    await frame.evaluate(() => { COMBAT.active = false; });

    await declare(page, frame, { type: 'ts-declare', act: 'Basic attack', target: 'm:cb-1', round: 3, roll: 4 });
    await page.waitForFunction(() => window.FSH.lastDeclareResult !== null);

    expect((await result(page)).reason).toBe('no-combat');
    expect(await sentOut(page)).toEqual([]);
  });

  /* A Fell carrying two weapons has two Acts called "Basic attack", and they are not the
     same deed: the damage differs, and Afflicted, Merciless, Powerful and Ethereal are all
     read off the weapon. The sheet used to resolve on the name alone and always built the
     first weapon's, so a player tapping the bow's card swung the sword. The row now says
     which one, and the sheet honours it. */
  test('two weapons offering the same Act are not the same Act', async ({ page }) => {
    const frame = await inCombat(page, 3);

    const w = await frame.evaluate(() => {
      const second = newWeapon();
      second.tree = 'Bow';
      second.level = 1;                            /* a weaker one, so the damage differs */
      C.weapons = [C.weapons[0], second];
      renderBattle();
      const acts = (window.COMBAT_ACTS || []).filter((a) => a.nm === 'Basic attack');
      return { names: acts.map((a) => a.src), dmg: acts.map((a) => a.dmg) };
    });
    expect(w.names, 'two cards, one per weapon').toHaveLength(2);
    expect(w.dmg[0], 'and they hit for different amounts').not.toBe(w.dmg[1]);

    /* declare the SECOND one, which is not the one a name-only lookup would find */
    await declare(page, frame, { type: 'ts-declare', act: 'Basic attack', src: w.names[1],
                                 target: 'm:cb-1', round: 3, roll: 4 });
    await page.waitForFunction(() => window.FSH.declaresOut.length > 0);

    const out = (await sentOut(page))[0];
    expect(out.dmg, 'the weapon that was tapped is the weapon that swings').toBe(w.dmg[1]);
  });

  test('a declare with no weapon named still takes the first, as it always did', async ({ page }) => {
    const frame = await inCombat(page, 3);
    const dmg = await frame.evaluate(() => {
      const second = newWeapon();
      second.tree = 'Bow'; second.level = 1;
      C.weapons = [C.weapons[0], second];
      renderBattle();
      return (window.COMBAT_ACTS || []).filter((a) => a.nm === 'Basic attack').map((a) => a.dmg);
    });

    /* the sheet's own dropdown has no way to say which, and must keep working */
    await declare(page, frame, { type: 'ts-declare', act: 'Basic attack', target: 'm:cb-1', round: 3, roll: 4 });
    await page.waitForFunction(() => window.FSH.declaresOut.length > 0);

    expect((await sentOut(page))[0].dmg).toBe(dmg[0]);
  });

  test('the sheet hands the row a fresh hand after a declare', async ({ page }) => {
    const frame = await inCombat(page, 3);
    await page.evaluate(() => { window.FSH.hands = []; });

    await declare(page, frame, { type: 'ts-declare', act: 'Basic attack', target: 'm:cb-1', round: 3, roll: 4 });
    await page.waitForFunction(() => window.FSH.hands.length > 0);

    const hand = await page.evaluate(() => window.FSH.lastHand);
    expect(hand.declared, 'so the row can grey the Act it has just spent').toBe(true);
  });
});
