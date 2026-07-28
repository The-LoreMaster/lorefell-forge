/* A22 — utilities do not all roll, and using one costs you the thing.
 *
 * The FellGuide says this per item, in prose: Tablet "strikes automatically with no
 * accuracy roll", Potion "casts automatically with no accuracy or casting roll", Ash Salt
 * breaks an Affliction, Rune and Trap are laid down and go off later. Rolling for every
 * one of them - which is what the row did - was a rules bug wearing a UI.
 *
 * Nothing structured carried any of it, so the classification is a table read from the
 * FellGuide one entry at a time. These cases pin the table against the rules, and pin the
 * two things that follow from it: no dice for any of the fifteen, and the pack actually
 * getting lighter when something is spent.
 *
 * Against the real sheet, because that is where the classification, the inventory and the
 * log all are - a mock would agree with whatever it invented.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { mountSheet } = require(path.join(__dirname, '_sheet.js'));

/* the shelf as the FellGuide describes it, for the ones under test */
const SHELF = [
  { id: 'u-tablet', name: 'Tablet', use: 'Act', desc: 'strikes automatically' },
  { id: 'u-potion', name: 'Potion', use: 'Act', desc: 'casts automatically' },
  { id: 'u-salt', name: 'Ash Salt', use: 'Act', desc: 'breaks an Affliction' },
  { id: 'u-powder', name: 'Revealing Powder', use: 'Act', desc: 'see through Obscured' },
  { id: 'u-lens', name: 'Aether Lens', use: 'Act', desc: 'for the duration of a battle' },
  { id: 'u-caltrops', name: 'Caltrops', use: 'Act', desc: 'five adjacent spaces' },
  { id: 'u-rune', name: 'Rune', use: 'Act', desc: 'casts when stepped on' },
  { id: 'u-bracewell', name: 'Bracewell', use: 'React', desc: 'halve one attack' }
];

async function packed(page, rows) {
  const frame = await mountSheet(page, { home: 'threadspire' });
  await frame.evaluate(({ shelf, inv }) => {
    ITEMS_LIB = shelf;
    C.inventory = inv;
    C.attrs.wit.base = 8; C.attrs.wit.mod = 0;      /* room to carry them all */
    C.weapons = [];
    CUR_WIX_ID = 'chr-harness-0001';
    COMBAT = { active: true, round: 1, phase: 'commit',
               fighters: [{ key: 'p:pl-7', name: 'Maerwen', side: 'fell', charId: 'chr-harness-0001' },
                          { key: 'm:cb-1', name: 'A foe', side: 'monster', charId: '' }],
               you: {} };
    renderItems(); renderBattle();
  }, { shelf: SHELF, inv: rows });
  return frame;
}
const carrying = (name, qty) => ({ itemId: 'u-' + name, quantity: qty === undefined ? 1 : qty,
                                   discovered: true, equipped: true });

const model = (frame, name) => frame.evaluate((n) => {
  const e = ITEMS_LIB.filter((l) => l.name === n)[0];
  return cbUtilityModel(e);
}, name);
const pack = (frame) => frame.evaluate(() =>
  (C.inventory || []).map((i) => ({ id: i.itemId, n: i.quantity })));
const log = (frame) => frame.evaluate(() =>
  (C.plog || window._plog || []).map((e) => (e && (e.text || e.html)) || '').join(' | '));

test.describe('A22 how each utility resolves, from the FellGuide', () => {

  test('the two that strike or cast do it automatically, with no roll', async ({ page }) => {
    const frame = await packed(page, [carrying('tablet'), carrying('potion')]);
    expect(await model(frame, 'Tablet')).toMatchObject({ roll: 'auto', target: 'foe' });
    expect(await model(frame, 'Potion')).toMatchObject({ roll: 'auto', target: 'any' });
  });

  test('the ones that just do a thing roll nothing at all', async ({ page }) => {
    const frame = await packed(page, [carrying('salt'), carrying('powder')]);
    expect(await model(frame, 'Ash Salt')).toMatchObject({ roll: 'none', target: 'any' });
    /* used, not aimed: there is nobody to point it at */
    expect(await model(frame, 'Revealing Powder')).toMatchObject({ roll: 'none', target: 'none' });
  });

  test('the placed ones are placed, and their trigger is not the player\'s roll', async ({ page }) => {
    const frame = await packed(page, [carrying('caltrops'), carrying('rune')]);
    const c = await model(frame, 'Caltrops');
    expect(c).toMatchObject({ roll: 'none', target: 'place' });
    expect(c.places, 'five adjacent spaces from where they land').toBe(5);
    /* placing costs the Act; the automatic strike when somebody steps in is the
       LoreMaster's to resolve, and is deliberately not modelled here */
    expect(await model(frame, 'Rune')).toMatchObject({ roll: 'none', target: 'place' });
  });

  test('NOT ONE of them opens the dice', async ({ page }) => {
    const frame = await packed(page, SHELF.filter((e) => e.use === 'Act')
      .map((e) => ({ itemId: e.id, quantity: 1, discovered: true, equipped: true })));
    const rolls = await frame.evaluate(() =>
      cbActUtilities().map((u) => ({ name: u.name, roll: u.roll })));
    expect(rolls.length).toBeGreaterThan(0);
    rolls.forEach((r) => {
      expect(['none', 'auto'], r.name + ' would open the dice').toContain(r.roll);
    });
  });

  test('an unclassified utility resolves rather than blocking the round', async ({ page }) => {
    const frame = await packed(page, [{ itemId: 'u-mystery', quantity: 1, discovered: true, equipped: true }]);
    await frame.evaluate(() => {
      ITEMS_LIB.push({ id: 'u-mystery', name: 'Something Nobody Classified', use: 'Act', desc: '?' });
      renderBattle();
    });
    const m = await model(frame, 'Something Nobody Classified');
    expect(m.roll, 'never the dice').toBe('none');
    expect(m.target, 'and asks for nothing it cannot get').toBe('none');
  });

  test('a library that carries its own answer is believed over the table', async ({ page }) => {
    const frame = await packed(page, [carrying('tablet')]);
    const m = await frame.evaluate(() => cbUtilityModel(
      { name: 'Tablet', roll: 'cast', target: 'ally' }));
    expect(m.roll, 'the shelf wins if it ever says').toBe('cast');
    expect(m.target).toBe('ally');
  });
});

test.describe('A22 using one costs you the thing', () => {

  test('a one-use utility leaves the pack when it is used', async ({ page }) => {
    const frame = await packed(page, [carrying('salt')]);
    expect((await pack(frame)).length).toBe(1);

    await frame.evaluate(() => { cbSpendUtility('Ash Salt', 'p:pl-7'); });
    expect(await pack(frame), 'spent, and gone').toEqual([]);
  });

  test('a many-use utility ticks down and goes at zero', async ({ page }) => {
    const frame = await packed(page, [carrying('bracewell', 3)]);
    await frame.evaluate(() => { cbSpendUtility('Bracewell', ''); });
    expect((await pack(frame))[0].n, 'two left').toBe(2);

    await frame.evaluate(() => { cbSpendUtility('Bracewell', ''); cbSpendUtility('Bracewell', ''); });
    expect(await pack(frame), 'and then it is gone').toEqual([]);
  });

  test('every use is written down, with who it was used on', async ({ page }) => {
    const frame = await packed(page, [carrying('salt')]);
    await frame.evaluate(() => {
      window._plog = [];
      cbSpendUtility('Ash Salt', 'm:cb-1');
    });
    const l = await log(frame);
    expect(l, 'the table can see a pack getting lighter').toContain('Ash Salt');
    expect(l, 'and on whom').toContain('A foe');
  });

  test('the Aether Lens survives its own use and goes at the end of the battle', async ({ page }) => {
    const frame = await packed(page, [carrying('lens')]);

    await frame.evaluate(() => { cbSpendUtility('Aether Lens', ''); });
    expect((await pack(frame)).length,
      'it lasts the battle and is used once a round; the use must not take it').toBe(1);

    /* the round comes and goes, and it is still there */
    await frame.evaluate(() => { cbSpendUtility('Aether Lens', ''); });
    expect((await pack(frame)).length).toBe(1);

    /* and now the battle ends */
    await frame.evaluate(() => {
      setCombatState({ active: false, round: 2, phase: '', fighters: [], you: {} });
    });
    expect(await pack(frame), 'the end of the battle is what spends it').toEqual([]);
  });

  test('a battle ending takes nothing that was never used', async ({ page }) => {
    const frame = await packed(page, [carrying('lens'), carrying('salt')]);
    await frame.evaluate(() => {
      setCombatState({ active: false, round: 2, phase: '', fighters: [], you: {} });
    });
    expect((await pack(frame)).length, 'both still in the pack').toBe(2);
  });
});
