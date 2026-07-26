/* B-case-1 — one weapon level, and it persists.
 *
 * ORACLE: LEVELING_SPEC_BRIEF.md Part B and S3_AND_LEVELING_PREP.md Part 3 for the
 * mechanics. Those describe what the tool does. Whether they are the RIGHT rules is the
 * FellGuide's to say, and the two numbers this case depends on are called out below so a
 * later vault reading can confirm or contradict them rather than quietly inheriting the
 * tool's word.
 *
 *   Crystal cost: level + 1 Lore Points.        <- tool-derived, unconfirmed against vault
 *   Vitality gain: d6 + Vigor, added to max.    <- tool-derived, unconfirmed against vault
 *
 * The shape of a level-up is asserted, not the rightness of those two constants. If the
 * FellGuide later disagrees with either, that is a finding and this spec is where it
 * lands.
 *
 * WHAT THIS IS REALLY ASKING. Leveling was reported as "not happening". The button being
 * unreachable in the embed explained why nobody could start the flow, and that is fixed.
 * The remaining question is whether the flow, once run, actually STICKS: luApply updates
 * C and calls scheduleSave, and if that save never lands, a reload shows the old level
 * and it would look for all the world like leveling never happened.
 *
 * Two safeguards make the answer trustworthy:
 *
 *  - The rolled vitality is read from the DOM the player actually saw, not assumed. A
 *    d6 is a d6; asserting a guessed number would either be wrong or would have to be
 *    loosened into meaninglessness.
 *  - The reload waits for the save to genuinely arrive at the store, and for the STORED
 *    record to show the new level. scheduleSave fires doSave 600ms later, so reloading
 *    early would report a false "did not save" - the same over-eager-wait mistake that
 *    once made C3 and C5 look like product bugs.
 */
const { test, expect } = require('@playwright/test');
const S = require('./_sheet.js');

const CHAR_ID = 'chr-maerwen-0001';

/* A Fell holding exactly one crystal, with one Power weapon at L1.
 *
 * crystals() is floor(lorePoints / (level + 1)), so level 1 with 2 Lore Points is
 * floor(2/2) = 1. Vigor is fixed at 2 so the vitality roll has a known modifier, and
 * Power starts at 1 so the crystal's +1 is visible as a change rather than a coincidence.
 * loadCharacter runs every record through seedSheet, so the gaps are filled with
 * defaults. The weapon tree is injected by the caller, chosen from the page's own
 * WEAPON_DB. */
function fellWithOneCrystal(weapon) {
  return {
    /* A Fell that has already been forged. Without this, fellglass.html:4461 opens the
     * character-creation wizard 2.5 seconds after load for any record whose `created` is
     * falsy, and ccModal then covers the Ascend button. That is the sheet behaving
     * correctly on a record that claims to be unforged; the fixture was the thing lying.
     * A wait would not fix it, it would only race the timer from the other side. */
    created: true,
    identity: { name: 'Maerwen Ash' },
    lore: { level: 1, lorePoints: 2 },
    attrs: { vigor: { base: 2, mod: 0 }, power: { base: 1, mod: 0 } },
    weapons: [weapon],
    armor: { level: 0 },
    lorebounds: []
  };
}

/* Boot once to read the tool's own weapon data and constructor, then boot again with a
 * fixture built from them. Two mounts rather than hardcoded shapes: both the tree names
 * and the record shape belong to the tool, and a weapon written out by hand here is
 * missing arrays the renderers dereference. See weaponRecord in _sheet.js. */
async function bootWithPowerWeapon(page, home) {
  const probe = await S.mountSheet(page, { home, record: { lore: { level: 1, lorePoints: 2 } }, charId: CHAR_ID });
  const powerTree = await S.treeForCategory(probe, 'power');
  const weapon = await S.weaponRecord(probe, powerTree, 1);
  const frame = await S.mountSheet(page, { home, record: fellWithOneCrystal(weapon), charId: CHAR_ID });
  return { frame, powerTree };
}

/* Drive the Ascend wizard for real: button, attribute, weapon, die, Ascend.
 * Returns the vitality total the player was shown. */
async function levelWeaponToL2(page, frame) {
  await expect(frame.locator('#lvlUpBtn')).toBeVisible();
  await frame.locator('#lvlUpBtn').click();
  await expect(frame.locator('#luModal')).toHaveClass(/open/);

  /* Step 1: invest the crystal in Power. An offensive attribute routes the whole
   * level-up down the weapon track. */
  await frame.locator('.lu-opt', { hasText: /^Power$/ }).click();

  /* Step 2: level the owned Power weapon. Its next level is 2, which is neither of the
   * forks at 4 and 8, so this goes straight to the vitality step. */
  await frame.locator('.lu-opt', { hasText: /to L2/ }).click();

  /* Step 3: roll. The die settles after 650ms, at which point the Ascend button is
   * appended, so waiting for Ascend is waiting for the roll to be recorded. */
  await frame.locator('.lu-roll button').first().click();
  const ascend = frame.locator('button', { hasText: /^Ascend$/ });
  await expect(ascend).toBeVisible();

  /* The number the player actually saw. Cross-checked against what the wizard recorded,
   * because a readout that disagrees with the value being committed would itself be a
   * bug worth catching here. */
  const shown = await frame.locator('.lu-roll .result').textContent();
  const rolled = parseInt(String(shown).trim(), 10);
  expect(Number.isFinite(rolled), `vitality readout was not a number: ${shown}`).toBe(true);
  expect(await frame.evaluate(() => LU.vitRoll)).toBe(rolled);

  await ascend.click();
  return rolled;
}

test.describe('B-case-1 a weapon level, and it persists', () => {

  test('the level-up applies, and survives a reload', async ({ page }) => {
    let { frame, powerTree } = await bootWithPowerWeapon(page, 'standalone');

    const before = await frame.evaluate(() => ({
      level: C.lore.level,
      lorePoints: C.lore.lorePoints,
      power: C.attrs.power.base,
      maxVit: C.vitality.max,
      weaponLevel: C.weapons[0].level
    }));
    expect(before).toEqual({ level: 1, lorePoints: 2, power: 1, maxVit: before.maxVit, weaponLevel: 1 });
    expect(await frame.evaluate(() => crystals())).toBe(1);

    const savesBefore = await page.evaluate(() => window.FSH.saveCount());
    const rolled = await levelWeaponToL2(page, frame);

    /* --- it applied --- */
    const after = await frame.evaluate(() => ({
      level: C.lore.level,
      lorePoints: C.lore.lorePoints,
      power: C.attrs.power.base,
      maxVit: C.vitality.max,
      weaponLevel: C.weapons[0].level,
      tree: C.weapons[0].tree
    }));

    expect(after.level).toBe(2);
    expect(after.lorePoints).toBe(0);              // spent level+1 = 2
    expect(after.power).toBe(before.power + 1);    // the crystal's attribute
    expect(after.weaponLevel).toBe(2);
    expect(after.tree).toBe(powerTree);
    expect(after.maxVit).toBe(before.maxVit + rolled);

    /* The crystal is spent, so the button must stand down again (A-req-5). */
    expect(await frame.evaluate(() => crystals())).toBe(0);
    await expect(frame.locator('#lvlUpBtn')).toBeHidden();

    /* --- it reached the store --- */
    /* Both conditions, not either: a save arriving proves the sheet spoke, and the
     * stored level proves it said the right thing. Waiting on only the count would pass
     * on an unrelated autosave that fired before Ascend. */
    await page.waitForFunction(
      (n) => window.FSH.saveCount() > n && ((window.FSH.stored() || {}).lore || {}).level === 2,
      savesBefore
    );

    const stored = await page.evaluate(() => window.FSH.stored());
    expect(stored.lore.level).toBe(2);
    expect(stored.lore.lorePoints).toBe(0);
    expect(stored.weapons[0].level).toBe(2);
    expect(stored.attrs.power.base).toBe(before.power + 1);
    expect(stored.vitality.max).toBe(before.maxVit + rolled);

    /* --- it survived --- */
    frame = await S.reloadSheet(page);

    const reloaded = await frame.evaluate(() => ({
      level: C.lore.level,
      lorePoints: C.lore.lorePoints,
      power: C.attrs.power.base,
      maxVit: C.vitality.max,
      weaponLevel: C.weapons[0].level
    }));

    expect(reloaded.level).toBe(2);
    expect(reloaded.lorePoints).toBe(0);
    expect(reloaded.power).toBe(before.power + 1);
    expect(reloaded.weaponLevel).toBe(2);
    expect(reloaded.maxVit).toBe(before.maxVit + rolled);
  });

  test('the same level-up works in the ThreadSpire embed', async ({ page }) => {
    /* The home the bug report came from. Same flow, same assertions in miniature: if
     * leveling works standalone but not in the rail, the difference is the embed, and
     * that is worth knowing separately rather than inferring. */
    const { frame } = await bootWithPowerWeapon(page, 'threadspire');

    expect(await frame.evaluate(() => document.body.classList.contains('tsembed'))).toBe(true);

    const beforeMax = await frame.evaluate(() => C.vitality.max);
    const savesBefore = await page.evaluate(() => window.FSH.saveCount());
    const rolled = await levelWeaponToL2(page, frame);

    expect(await frame.evaluate(() => C.lore.level)).toBe(2);
    expect(await frame.evaluate(() => C.weapons[0].level)).toBe(2);
    expect(await frame.evaluate(() => C.vitality.max)).toBe(beforeMax + rolled);

    await page.waitForFunction(
      (n) => window.FSH.saveCount() > n && ((window.FSH.stored() || {}).lore || {}).level === 2,
      savesBefore
    );

    const frame2 = await S.reloadSheet(page);
    expect(await frame2.evaluate(() => C.lore.level)).toBe(2);
    expect(await frame2.evaluate(() => C.weapons[0].level)).toBe(2);
  });

});
