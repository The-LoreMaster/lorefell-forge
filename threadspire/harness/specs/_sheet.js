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
async function waitLoaded(frame, charId) {
  /* The sheet's built-in blank C already has lore and vitality, so those alone are true
   * before the host's init lands, and a spec that writes C then loses it to loadCharacter.
   * Wait for the init itself: the record's id is current and the load guard is down. */
  await frame.waitForFunction((cid) => typeof C !== 'undefined' && !!C && !!C.lore && !!C.vitality
    && (!cid || CUR_WIX_ID === cid) && !LOADING, charId || '');
}

async function mountSheet(page, { home = 'standalone', record = {}, charId = 'chr-harness-0001' } = {}) {
  await page.goto(SHEET_HOST);
  await page.waitForFunction(() => !!window.FSH);
  await page.evaluate((c) => window.FSH.mount(c), { home, record, charId });
  const frame = await sheetFrame(page);
  await waitLoaded(frame, charId);
  return frame;
}

/* Throw the sheet away and bring it back. sheet-host re-serves what was SAVED, so
 * anything visible afterwards genuinely persisted. */
async function reloadSheet(page) {
  await page.evaluate(() => window.FSH.reload());
  await page.waitForFunction(() => window.FSH.ready === true);
  const frame = await sheetFrame(page);
  await waitLoaded(frame, await page.evaluate(() => window.FSH.charId));
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

/* Crystals are spent at a rest, which the LoreMaster calls (0903f9b): outside one the
 * Level Up button stays hidden. Open a rest between sessions the way ThreadSpire does,
 * with the ts-rest-op the sheet listens for, and wait for the button to be offered. */
async function openRest(frame) {
  await frame.evaluate(() => window.postMessage({ type: 'ts-rest-op', op: 'between', on: true }, '*'));
  await frame.waitForFunction(() => window._restBetween === true);
}

module.exports = { SHEET_HOST, sheetFrame, waitLoaded, mountSheet, reloadSheet, treeForCategory, weaponRecord, openRest };
