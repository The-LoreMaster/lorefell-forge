/* Shared helpers for the FellGlass sheet scenarios, against sheet-host.html.
 *
 * Underscored so Playwright's default testMatch does not collect it as a spec.
 */
const SHEET_HOST = '/threadspire/harness/sheet-host.html';

/* The sheet's own frame. Re-acquired after a reload, because the handle from before
 * points at a document that no longer exists. */
async function sheetFrame(page) {
  const el = await page.waitForSelector('iframe#fg');
  const frame = await el.contentFrame();
  if (!frame) throw new Error('no content frame for the sheet');
  return frame;
}

/* Wait for a record to have actually loaded, not merely for the frame to exist.
 * C and crystals are top-level let/const bindings, so they are reached bare rather than
 * through window. */
async function waitLoaded(frame) {
  await frame.waitForFunction(() => typeof C !== 'undefined' && !!C && !!C.lore && !!C.vitality);
}

async function mountSheet(page, { home = 'standalone', record = {}, charId = 'chr-harness-0001' } = {}) {
  await page.goto(SHEET_HOST);
  await page.waitForFunction(() => !!window.FSH);
  await page.evaluate((c) => window.FSH.mount(c), { home, record, charId });
  const frame = await sheetFrame(page);
  await waitLoaded(frame);
  return frame;
}

/* Throw the sheet away and bring it back. sheet-host re-serves what was SAVED, so
 * anything visible afterwards genuinely persisted. */
async function reloadSheet(page) {
  await page.evaluate(() => window.FSH.reload());
  await page.waitForFunction(() => window.FSH.ready === true);
  const frame = await sheetFrame(page);
  await waitLoaded(frame);
  return frame;
}

/* The weapon trees are the tool's data, not something a spec should hardcode. Ask the
 * page which trees belong to a category and take the first. */
async function treeForCategory(frame, category) {
  const tree = await frame.evaluate((cat) => {
    const hit = Object.entries(WEAPON_DB).find(([, db]) => db.category === cat);
    return hit ? hit[0] : null;
  }, category);
  if (!tree) throw new Error(`no weapon tree found for category ${category}`);
  return tree;
}

/* Weapon records come from the tool's own constructor, newWeapon().
 *
 * A hand-written {tree, level, formIdx} looks complete and is not. renderWeapons reads
 * w.infusions[i] (fellglass.html:3559) and renderBattle reads w.abilities.filter
 * (3877), and a weapon missing those arrays throws mid-render. That throw lands inside
 * loadCharacter, which has no try/catch around renderAll, so LOADING is left set and
 * every autosave is suppressed from then on: the sheet takes edits and writes none of
 * them. A whole afternoon went into mistaking that for a product bug. Ask the page for
 * the shape instead of guessing it. */
async function weaponRecord(frame, tree, level) {
  return frame.evaluate(({ t, lv }) => {
    const w = newWeapon();
    w.tree = t;
    if (lv) w.level = lv;
    return w;
  }, { t: tree, lv: level });
}

module.exports = { SHEET_HOST, sheetFrame, waitLoaded, mountSheet, reloadSheet, treeForCategory, weaponRecord };
