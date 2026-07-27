/* A12 — the utilities a Fell is actually carrying.
 *
 * An inventory row is a pointer, not a thing: {itemId, quantity, discovered, equipped}.
 * The name, the use and the description live on the library entry it points at.
 *
 * Three places read a name straight off the row, got undefined, and fell back to
 * String(row). That is how the literal "[object Object]" reached the table: the fallback
 * then passed the truthiness check that was meant to drop empties, so it was offered to
 * the player as something they could spend their Act on. The picker listed one of those
 * per item in the pack and named none of them.
 *
 * Against the real sheet, because the defect was in the sheet's reading of its own data
 * and a mock inventory would simply have agreed with whatever shape the mock invented.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { mountSheet } = require(path.join(__dirname, '_sheet.js'));

/* A pack: one known, one identified, one still veiled, one known on sight, and one
   pointing at a library entry that no longer exists. */
async function withPack(page) {
  const frame = await mountSheet(page, { home: 'threadspire' });
  await frame.evaluate(() => {
    ITEMS_LIB = [
      { id: 'u1', name: 'Ashen Tonic', use: 'Act', desc: 'Restores a measure of vitality.' },
      { id: 'u2', name: 'Waxed Rope', use: 'Out of Combat', desc: 'Fifty feet, treated against rot.' },
      { id: 'u3', name: 'Veiled Idol', use: 'Passive', desc: 'It hums when held near ruins.',
        veiled: 'a cold weight wrapped in cloth' },
      { id: 'u4', name: 'Torch', use: 'Act', desc: 'Light, and a poor weapon.', veiled: 'open' }
    ];
    /* Wit enough to carry the lot, since what this is about is what the names are and
       not how many fit - that is A14's question */
    C.attrs.wit.base = 5; C.attrs.wit.mod = 0;
    C.inventory = [
      { itemId: 'u1', quantity: 2, discovered: true, equipped: true },
      { itemId: 'u2', quantity: 1, discovered: true, equipped: true },
      { itemId: 'u3', quantity: 1, discovered: false, equipped: true },  /* not identified yet */
      { itemId: 'u4', quantity: 1, discovered: false, equipped: true },  /* known on sight */
      { itemId: 'gone', quantity: 1, discovered: true, equipped: true }  /* not on the shelf */
    ];
    CUR_WIX_ID = 'chr-harness-0001';
    COMBAT = { active: true, round: 1, phase: 'commit', fighters: [], you: {} };
    renderBattle();
  });
  return frame;
}

const handItems = (page) => page.evaluate(() => (window.FSH.lastHand || {}).items);

test.describe('A12 the utilities travel by name, not by [object Object]', () => {

  test('the hand carries the names the Fell would recognise', async ({ page }) => {
    const frame = await withPack(page);
    await frame.evaluate(() => { window._tsHandSig = null; tsSendHand(); });
    await page.waitForFunction(() => window.FSH.lastHand !== null);

    const items = await handItems(page);
    const names = items.map((i) => i.name);
    expect(names, 'nothing stringified an object on the way out').not.toContain('[object Object]');
    expect(names).toContain('Ashen Tonic');
    /* the rope is carried and known, but it is not an Act, and this hand is the combat
       Act picker. Category is A17's question; this one is about names surviving the trip */
    expect(names).toContain('Torch');
  });

  test('the count comes off the row it is written on', async ({ page }) => {
    const frame = await withPack(page);
    await frame.evaluate(() => { window._tsHandSig = null; tsSendHand(); });
    await page.waitForFunction(() => window.FSH.lastHand !== null);

    const tonic = (await handItems(page)).filter((i) => i.name === 'Ashen Tonic')[0];
    expect(tonic.qty, 'the sheet counts in quantity, and it was being read as qty').toBe(2);
  });

  test('what it is for travels with it', async ({ page }) => {
    const frame = await withPack(page);
    await frame.evaluate(() => { window._tsHandSig = null; tsSendHand(); });
    await page.waitForFunction(() => window.FSH.lastHand !== null);

    const tonic = (await handItems(page)).filter((i) => i.name === 'Ashen Tonic')[0];
    expect(tonic.use, 'the row is told what each one is for').toBe('Act');
    /* and the use is read off the library rather than guessed, which is what lets the
       category filter work at all */
    const pack = await frame.evaluate(() => cbUtilities().map((u) => u.name + ':' + u.use));
    expect(pack).toContain('Waxed Rope:Out of Combat');
  });

  test('a utility nobody has identified is not offered by name', async ({ page }) => {
    const frame = await withPack(page);
    await frame.evaluate(() => { window._tsHandSig = null; tsSendHand(); });
    await page.waitForFunction(() => window.FSH.lastHand !== null);

    const names = (await handItems(page)).map((i) => i.name);
    expect(names, 'it is a cold weight wrapped in cloth until the LoreMaster says otherwise')
      .not.toContain('Veiled Idol');
    expect(names, 'but the ones known on sight are').toContain('Torch');
  });

  test('a row pointing at nothing is dropped rather than named', async ({ page }) => {
    const frame = await withPack(page);
    await frame.evaluate(() => { window._tsHandSig = null; tsSendHand(); });
    await page.waitForFunction(() => window.FSH.lastHand !== null);

    const items = await handItems(page);
    expect(items, 'the tonic and the torch: the rope is no Act, the idol is unidentified')
      .toHaveLength(2);
    items.forEach((i) => expect(i.name && i.name.length, 'no empty names either').toBeTruthy());
  });

  test('the sheet own picker and the row agree about the pack', async ({ page }) => {
    const frame = await withPack(page);
    await frame.evaluate(() => { window._tsHandSig = null; tsSendHand(); });
    await page.waitForFunction(() => window.FSH.lastHand !== null);

    /* the same resolver feeds both, so a Fell cannot see one list on the sheet and a
       different one on the table */
    const fromSheet = await frame.evaluate(() => cbActUtilities().map((u) => u.name));
    const fromHand = (await handItems(page)).map((i) => i.name);
    expect(fromHand).toEqual(fromSheet);
  });

  test('the Act is a utility, and it is there only when there is one to use', async ({ page }) => {
    const frame = await withPack(page);

    let act = await frame.evaluate(() =>
      (window.COMBAT_ACTS || []).filter((a) => a.src === 'utility')[0] || null);
    expect(act, 'a pack with something usable in it offers the Act').not.toBeNull();
    expect(act.nm).toBe('Use a utility');

    /* everything veiled: nothing to spend an Act on, so no card for it */
    act = await frame.evaluate(() => {
      C.inventory.forEach((i) => { i.discovered = false; });
      ITEMS_LIB.forEach((l) => { if (l.veiled === 'open') l.veiled = 'wrapped'; });
      renderBattle();
      return (window.COMBAT_ACTS || []).filter((a) => a.src === 'utility')[0] || null;
    });
    expect(act, 'a pack of unknowns is not a pack of options').toBeNull();
  });
});
