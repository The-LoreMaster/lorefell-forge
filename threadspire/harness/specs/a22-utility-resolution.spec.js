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

/* The shelf as the FellGuide describes it, for the ones under test.
 *
 * `use` is copied VERBATIM from schemas/seed/Relics.json, which is what the live chain
 * does at every hop: the Relics collection -> libraries.web.js -> ITEMS_LIB -> here. It
 * used to say 'Act' for a Rune, which the store has never said, and that one invented
 * value was enough to hide the fact that a Rune could not be used in a fight at all. A
 * fixture that is merely close is worse than none. */
const SHELF = [
  { id: 'u-tablet', name: 'Tablet', use: 'Act', desc: 'strikes automatically' },
  { id: 'u-potion', name: 'Potion', use: 'Act', desc: 'casts automatically' },
  { id: 'u-salt', name: 'Ash Salt', use: 'Act', desc: 'breaks an Affliction' },
  { id: 'u-powder', name: 'Revealing Powder', use: 'Act', desc: 'see through Obscured' },
  { id: 'u-lens', name: 'Aether Lens', use: 'Act', desc: 'for the duration of a battle' },
  { id: 'u-caltrops', name: 'Caltrops', use: 'Act', desc: 'five adjacent spaces' },
  { id: 'u-rune', name: 'Rune', use: 'Act to place', desc: 'casts when stepped on' },
  { id: 'u-trap', name: 'Trap', use: 'Act to place', desc: 'strikes when stepped on' },
  { id: 'u-sky', name: 'Skyvault Shard', use: 'Act, or Rest', desc: 'a shard of the Aether' },
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
    const frame = await packed(page, SHELF.filter((e) => /(^|[^A-Za-z])act([^A-Za-z]|$)/i.test(e.use))
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

/* ---- the pack and the combat view are the same pack ---- */

test.describe('A22 one answer to what she is carrying', () => {

  /* The bug this closes, live: the LoreMaster saw Astra carrying a Tablet and Ash Salt
     while Astra's own Inventory showed none, and adding any utility made them all appear.
     Two filters answered one question - the combat derivation on `discovered && equipped`,
     cbPack on `discovered || veiled open` - so a utility known ON SIGHT passed one and
     failed the other. Adding something re-ran equipSeed and reconciled them, which is why
     the workaround looked like the feature.

     A shelf with one of each kind of "known": one discovered, one known on sight and never
     discovered, one neither. */
  const SHELF2 = [
    { id: 'k-charm', name: 'Warding Charm', use: 'React', desc: 'turn a blow aside' },
    { id: 'k-open', name: 'Torch', use: 'React', desc: 'known on sight', veiled: 'open' },
    { id: 'k-dark', name: 'Veiled Idol', use: 'React', desc: 'unidentified', veiled: 'a cold weight' }
  ];

  async function mixed(page) {
    const frame = await mountSheet(page, { home: 'threadspire' });
    await frame.evaluate((shelf) => {
      ITEMS_LIB = shelf;
      C.inventory = [
        { itemId: 'k-charm', quantity: 1, discovered: true,  equipped: true },
        { itemId: 'k-open',  quantity: 1, discovered: false, equipped: true },
        { itemId: 'k-dark',  quantity: 1, discovered: false, equipped: true }
      ];
      C.attrs.wit.base = 8; C.attrs.wit.mod = 0;
      C.weapons = [];
      CUR_WIX_ID = 'chr-harness-0001';
      COMBAT = { active: true, round: 1, phase: 'commit',
                 fighters: [{ key: 'p:pl-7', name: 'Maerwen', side: 'fell', charId: 'chr-harness-0001' }],
                 you: {} };
      renderItems(); renderBattle();
    }, SHELF2);
    return frame;
  }
  /* what each side thinks she has: the pack, and what the combat derivation put on a card */
  const bothViews = (frame) => frame.evaluate(() => ({
    pack: cbUtilities().map((u) => u.name).sort(),
    combat: (window.COMBAT_REACTS || []).filter((r) => r.kind === 'item')
              .map((r) => r.nm).sort()
  }));

  test('the pack and the combat view name the same utilities', async ({ page }) => {
    const frame = await mixed(page);
    const v = await bothViews(frame);
    expect(v.combat, 'one question, one answer').toEqual(v.pack);
  });

  test('a utility known on sight is carried by BOTH, not one', async ({ page }) => {
    const frame = await mixed(page);
    const v = await bothViews(frame);
    /* the exact case that diverged: never discovered, but the book says it is known */
    expect(v.pack, 'the FellGuide says some are known on sight').toContain('Torch');
    expect(v.combat, 'and the combat view used to miss it').toContain('Torch');
  });

  test('an unidentified one is carried by NEITHER', async ({ page }) => {
    const frame = await mixed(page);
    const v = await bothViews(frame);
    expect(v.pack).not.toContain('Veiled Idol');
    expect(v.combat).not.toContain('Veiled Idol');
  });

  test('they agree after every change, not only after a re-seed', async ({ page }) => {
    const frame = await mixed(page);
    /* adding one used to be what reconciled them - so the interesting assertion is that
       they already agreed BEFORE, and still agree after each step */
    let v = await bothViews(frame);
    expect(v.combat).toEqual(v.pack);

    await frame.evaluate(() => {
      ITEMS_LIB.push({ id: 'k-new', name: 'Smoke Bomb', use: 'React', desc: 'reposition' });
      C.inventory.push({ itemId: 'k-new', quantity: 1, discovered: true, equipped: true });
      renderItems(); renderBattle();
    });
    v = await bothViews(frame);
    expect(v.combat, 'adding one changes both together').toEqual(v.pack);
    expect(v.pack).toContain('Smoke Bomb');

    await frame.evaluate(() => {
      C.inventory[0].equipped = false;
      renderItems(); renderBattle();
    });
    v = await bothViews(frame);
    expect(v.combat, 'and setting one down removes it from both').toEqual(v.pack);
    expect(v.pack).not.toContain('Warding Charm');
  });
});
