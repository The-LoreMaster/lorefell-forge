/* A27 — a Rune is an Act, and for a long time the sheet did not think so.
 *
 * `cbActUtilities` asked `u.use === "Act"`, an exact string match. The Relics collection
 * does not say "Act" every time it means one. Read straight off schemas/seed/Relics.json:
 *
 *     Rune            "Act to place"
 *     Trap            "Act to place"
 *     Skyvault Shard  "Act, or Rest"
 *
 * All three carry an Act in the FellGuide. None of them could ever be spent as one.
 *
 * And they were not merely misfiled, they were absent from BOTH surfaces: the Act picker
 * refused them on the exact match, and `renderBattle`'s reminder list drops anything whose
 * use is not literally Act, React or Passive, because that is all `put` has buckets for.
 * So two of the four placed utilities - the whole reason COMBAT_PLACED_UTILITIES exists -
 * could be carried, equipped and never used.
 *
 * The reason it went unseen for so long is the part worth keeping. The harness handed the
 * sheet `use: 'Act'` for a Rune. The store has never said that. Every placement spec was
 * passing against a value nothing in production produces, which is F9's lesson wearing
 * different clothes: the two ends of the pipe were verified with different tools, so the
 * check could stay green while the thing it checked was unreachable.
 *
 * These cases are pinned to the SEED FILE rather than to a hand-written list, so a value
 * changing in Relics.json cannot quietly stop being covered here.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { mountSheet } = require(path.join(__dirname, '_sheet.js'));

const RELICS = require(path.join(__dirname, '..', '..', '..', 'schemas', 'seed', 'Relics.json'));
const ROWS = Array.isArray(RELICS) ? RELICS : (RELICS.items || RELICS.rows || []);

/* every Relic whose use names an Act, however it words it */
const ACT_ISH = ROWS.filter((r) => /(^|[^A-Za-z])act([^A-Za-z]|$)/i.test(String(r.use || '')));
/* the ones the old exact match would have thrown away */
const NOT_LITERALLY_ACT = ACT_ISH.filter((r) => r.use !== 'Act');

/* The shelf as libraries.web.js builds it: `use` copied verbatim off the Relics row, no
   normalising anywhere on the way. That copy is the whole point of the fixture. */
const SHELF = ROWS.map((r, i) => ({
  id: 'u-' + i, name: r.name, use: r.use || 'Out of Combat', desc: r.description || '',
  veiled: r.veiled || '', group: r.group || '', rarity: r.rarity || '', uses: r.uses || ''
}));
const idOf = (name) => SHELF.filter((s) => s.name === name)[0].id;

async function carryingAll(page, names) {
  const frame = await mountSheet(page, { home: 'threadspire' });
  await frame.evaluate(({ shelf, inv }) => {
    ITEMS_LIB = shelf;
    C.inventory = inv;
    C.attrs.wit.base = 12; C.attrs.wit.mod = 0;      /* room for everything under test */
    C.weapons = [];
    CUR_WIX_ID = 'chr-harness-0001';
    COMBAT = { active: true, round: 1, phase: 'commit',
               fighters: [{ key: 'p:pl-7', name: 'Maerwen', side: 'fell', charId: 'chr-harness-0001' },
                          { key: 'm:cb-1', name: 'A foe', side: 'monster', charId: '' }],
               you: {} };
    renderItems(); renderBattle();
  }, { shelf: SHELF, inv: names.map((n) => ({ itemId: idOf(n), quantity: 1, discovered: true, equipped: true })) });
  return frame;
}

const offered = (frame) => frame.evaluate(() => cbActUtilities().map((u) => u.name));

test.describe('A27 the seed says what an Act is, and the sheet must agree', () => {

  test('the seed really does word an Act more than one way', async () => {
    /* If this ever fails the fault is gone from the data and the rest of this file is
       guarding nothing - which is worth being told rather than left to pass emptily. */
    expect(NOT_LITERALLY_ACT.length,
      'Relics.json no longer carries an Act worded as anything but "Act"').toBeGreaterThan(0);
    expect(NOT_LITERALLY_ACT.map((r) => r.name)).toEqual(
      expect.arrayContaining(['Rune', 'Trap', 'Skyvault Shard']));
  });

  test('every Act-ish utility in the seed reaches the picker', async ({ page }) => {
    const names = ACT_ISH.map((r) => r.name);
    const frame = await carryingAll(page, names);
    const got = await offered(frame);
    names.forEach((n) => {
      expect(got, n + ' is an Act in the FellGuide and cannot be spent as one').toContain(n);
    });
  });

  test('a React is still not an Act, however the word sits inside it', async ({ page }) => {
    /* "React" contains "act". A looser check than this one would have made every React
       utility a combat Act, which is the opposite fault and a worse one. */
    const reacts = ROWS.filter((r) => r.use === 'React').map((r) => r.name);
    expect(reacts.length, 'the seed carries React utilities to check against').toBeGreaterThan(0);
    const frame = await carryingAll(page, reacts);
    const got = await offered(frame);
    reacts.forEach((n) => {
      expect(got, n + ' is a React and must not be offered as an Act').not.toContain(n);
    });
  });

  test('a Rune can be taken up, and it wants the ground', async ({ page }) => {
    const frame = await carryingAll(page, ['Rune']);
    const u = await frame.evaluate(() => cbActUtilities().filter((x) => x.name === 'Rune')[0]);
    expect(u, 'carried, equipped, and an Act to place').toBeTruthy();
    expect(u.target, 'it goes on the floor, not at anybody').toBe('place');
    expect(u.roll, 'and placing it asks for no dice').toBe('none');
  });

  test('the card exists at all, which is a different question from being carried', async ({ page }) => {
    /* cbOwnsActUtility decides whether "Use a utility" is on the row; cbActUtilities
       decides whether it is greyed. Both read the use, and both were exact. */
    const frame = await mountSheet(page, { home: 'threadspire' });
    const owns = await frame.evaluate(({ shelf, id }) => {
      ITEMS_LIB = shelf;
      /* owned but NOT equipped: the card should exist, greyed */
      C.inventory = [{ itemId: id, quantity: 1, discovered: true, equipped: false }];
      return cbOwnsActUtility();
    }, { shelf: SHELF, id: idOf('Trap') });
    expect(owns, 'owning a Trap means the utility card exists').toBe(true);
  });

  test('an Act-ish utility is not ALSO listed as a reminder', async ({ page }) => {
    /* renderBattle skips a utility that is its own Act, because "Use a utility" is the
       card and which one is a choice made on it. The skip was exact too - though the
       reminder list dropped these anyway, since `put` has no bucket named "Act to place".
       Absent from both surfaces is exactly how a whole feature goes missing quietly. */
    const frame = await carryingAll(page, ['Rune', 'Trap']);
    const names = await frame.evaluate(() =>
      (window.COMBAT_ACTS || []).concat(window.COMBAT_REACTS || []).map((e) => e.nm));
    expect(names, 'a Rune is chosen on the utility card, not listed beside it').not.toContain('Rune');
    expect(names).not.toContain('Trap');
  });
});
