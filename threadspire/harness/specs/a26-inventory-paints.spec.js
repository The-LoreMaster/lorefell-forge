/* A26 — loading a Fell paints her pack.
 *
 * The live report was that the LoreMaster could see Astra carrying a Tablet and Ash Salt
 * while Astra's own Inventory showed none, and that adding any one utility made ALL of
 * them appear at once.
 *
 * That last detail is the whole diagnosis, and it was in the first report all along. If
 * two views were filtering the same pack differently, adding one utility would reveal
 * ONE. Revealing all of them means the rows were in C.inventory the entire time and the
 * Inventory tab had simply never been painted since the record arrived - the add called
 * renderItems, and renderItems drew everything it found.
 *
 * And so it was: renderAll repaints seventeen things and renderItems is not among them.
 * It runs at init, against the blank character that exists before any record has loaded,
 * and then only when the player themselves edits the pack. Every other view - the combat
 * card, the utility picker, what the LoreMaster sees - reads C.inventory live and was
 * right the whole time. The Inventory tab was the one telling the truth about a character
 * nobody was looking at.
 *
 * This is the equipSeed fault from A-equip wearing the opposite coat. There, a derivation
 * ran only in renderAll and the paths that rebuilt on their own missed it. Here, a paint
 * is missing FROM renderAll. Same lesson: a render list is a promise that everything on
 * screen matches the record, and anything left off it silently breaks that promise.
 */
const { test, expect } = require('@playwright/test');
const S = require('./_sheet.js');

/* a pack that is already hers before the sheet ever opens */
const PACKED = {
  inventory: [
    { itemId: 'i2', quantity: 1, discovered: true,  equipped: true },
    { itemId: 'i1', quantity: 2, discovered: true,  equipped: true },
    { itemId: 'i4', quantity: 1, discovered: false, equipped: false }
  ]
};

/* what the Inventory tab is actually showing, by name */
const shown = (frame) => frame.evaluate(() =>
  [...document.querySelectorAll('#itemsWrap .item-row .inm')].map(n => n.textContent.trim()));
const emptyNote = (frame) => frame.evaluate(() => {
  const n = document.querySelector('#itemsWrap .note');
  return n ? n.textContent : '';
});
/* the same pack as every other view resolves it */
const packNames = (frame) => frame.evaluate(() => cbPack().map(u => u.name));

test.describe('A26 the Inventory shows what she is carrying', () => {

  test('a loaded Fell has her pack on screen, not an empty shelf', async ({ page }) => {
    const frame = await S.mountSheet(page, { record: PACKED });

    const pack = await packNames(frame);
    expect(pack.length, 'the record really does carry utilities').toBeGreaterThan(0);

    const rows = await shown(frame);
    expect(rows.length,
      'the Inventory paints one row per inventory entry - it does not filter, so every'
      + ' row in the record should be on screen the moment she is opened')
      .toBe(PACKED.inventory.length);
    expect(await emptyNote(frame), 'and it does not claim the pack is light')
      .not.toMatch(/pack is light/i);
  });

  test('the Inventory and the pack name the same utilities', async ({ page }) => {
    const frame = await S.mountSheet(page, { record: PACKED });

    const rows = (await shown(frame)).join(' | ');
    for (const name of await packNames(frame)) {
      expect(rows, name + ' is in the pack, so it is on the shelf').toContain(name);
    }
  });

  /* the exact reported gesture, and the one that made the fault look like a filter */
  test('adding a utility does not "reveal" ones that were already there', async ({ page }) => {
    const frame = await S.mountSheet(page, { record: PACKED });

    const before = (await shown(frame)).length;
    await frame.evaluate(() => {
      C.inventory.push({ itemId: 'i3', quantity: 1, discovered: true, equipped: false });
      renderItems();
    });
    const after = (await shown(frame)).length;

    expect(after - before,
      'adding one shows one. If this jumps by the whole pack, the rows were there all'
      + ' along and the tab had never been painted - which is the bug, not the fix')
      .toBe(1);
  });

  test('a re-render after the record lands does not change what is shown', async ({ page }) => {
    const frame = await S.mountSheet(page, { record: PACKED });

    const first = await shown(frame);
    /* renderAll is what a record landing triggers; it must leave the shelf alone because
       the shelf was already right */
    await frame.evaluate(() => renderAll());
    expect(await shown(frame), 'renderAll and the loaded state agree').toEqual(first);
  });

  test('an empty pack still says so', async ({ page }) => {
    const frame = await S.mountSheet(page, { record: { inventory: [] } });
    expect(await shown(frame)).toHaveLength(0);
    expect(await emptyNote(frame), 'the light-pack note is right when the pack IS light')
      .toMatch(/pack is light/i);
  });
});
