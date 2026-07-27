/* A14 — two hands, and a pack that holds what your Wit allows.
 *
 * The row was showing three Basic attacks because every weapon a Fell OWNED fed it. A
 * Fell owning three weapons is not a Fell holding three. Two hands is the whole rule: a
 * form's grip is 1 or 2, and what is in hand may total 2.
 *
 * Utilities are carried rather than held, so they cost no hands. What limits them is Wit,
 * which is what the Attributes card has always said Wit does.
 *
 * Against the real sheet: the grip numbers live in WEAPON_DB, the count lives on the
 * character, and the Acts are derived from both. A mock would have had to invent all
 * three and would then agree with itself.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { mountSheet, weaponRecord } = require(path.join(__dirname, '_sheet.js'));

/* Dagger is one hand, Great Sword is two, Longbow is two. Straight from WEAPON_DB. */
async function armed(page, list) {
  const frame = await mountSheet(page, { home: 'threadspire' });
  await frame.evaluate((ws) => {
    C.weapons = ws.map((s) => {
      const w = newWeapon();
      w.tree = s.tree; w.formIdx = s.form || 0; w.level = 3;
      if (typeof s.equipped === 'boolean') w.equipped = s.equipped;
      return w;
    });
    CUR_WIX_ID = 'chr-harness-0001';
    COMBAT = { active: true, round: 1, phase: 'commit', fighters: [], you: {} };
    renderWeapons(); renderBattle();
  }, list);
  return frame;
}

const grips = (frame) => frame.evaluate(() => C.weapons.map((w) => weaponGrip(w)));
const worn = (frame) => frame.evaluate(() => C.weapons.map((w) => !!w.equipped));
const actSources = (frame) => frame.evaluate(() =>
  (window.COMBAT_ACTS || []).filter((a) => a.kind === 'weapon').map((a) => a.src));
const refusal = (frame, i) => frame.evaluate((idx) => gripRefusal(idx), i);
const takeUp = (frame, i) => frame.evaluate((idx) => { toggleWeaponEquip(idx); }, i);
const warnText = (frame) => frame.evaluate(() => {
  const n = document.querySelector('#weaponsWrap .equip-warn');
  return n ? n.textContent : null;
});
const refusedBtn = (frame) => frame.evaluate(() =>
  document.querySelectorAll('#weaponsWrap .flagbtn.refused').length);

test.describe('A14 what a Fell has in hand', () => {

  test('grip comes off the form, not a guess', async ({ page }) => {
    const frame = await armed(page, [{ tree: 'Blade', form: 0 }, { tree: 'Blade', form: 2 },
                                     { tree: 'Bow', form: 1 }]);
    expect(await grips(frame), 'Dagger one, Scimitar two, Longbow two').toEqual([1, 2, 2]);
  });

  test('two one-hand weapons both go in hand', async ({ page }) => {
    const frame = await armed(page, [{ tree: 'Blade', form: 0, equipped: false },
                                     { tree: 'Bludgeon', form: 0, equipped: false }]);
    await takeUp(frame, 0);
    await takeUp(frame, 1);
    expect(await worn(frame)).toEqual([true, true]);
  });

  test('a third one-hand weapon is refused, and says what is in the way', async ({ page }) => {
    const frame = await armed(page, [{ tree: 'Blade', form: 0, equipped: true },
                                     { tree: 'Bludgeon', form: 0, equipped: true },
                                     { tree: 'Polearm', form: 0, equipped: false }]);
    const why = await refusal(frame, 2);
    expect(why, 'refused').not.toBe('');
    expect(why, 'and names what is holding the hands').toContain('Dagger');
    expect(why).toContain('Mace');

    await takeUp(frame, 2);
    expect((await worn(frame))[2], 'not silently swallowed, and not silently allowed').toBe(false);
    expect(await refusedBtn(frame), 'the button that refused says so').toBe(1);
    expect(await warnText(frame)).toBe(why);
  });

  test('a two-hand weapon is refused over a one-hand one', async ({ page }) => {
    const frame = await armed(page, [{ tree: 'Blade', form: 0, equipped: true },
                                     { tree: 'Bow', form: 1, equipped: false }]);
    const why = await refusal(frame, 1);
    expect(why).toContain('both hands');
    await takeUp(frame, 1);
    expect(await worn(frame)).toEqual([true, false]);
  });

  test('set the one-hand down and the two-hand goes up', async ({ page }) => {
    const frame = await armed(page, [{ tree: 'Blade', form: 0, equipped: true },
                                     { tree: 'Bow', form: 1, equipped: false }]);
    await takeUp(frame, 0);                       /* set the dagger down */
    expect(await refusal(frame, 1), 'both hands are free now').toBe('');
    await takeUp(frame, 1);
    expect(await worn(frame)).toEqual([false, true]);
  });

  test('a two-hand weapon leaves no hand for anything else', async ({ page }) => {
    const frame = await armed(page, [{ tree: 'Bow', form: 1, equipped: true },
                                     { tree: 'Blade', form: 0, equipped: false }]);
    expect(await refusal(frame, 1), 'no hand free').not.toBe('');
    await takeUp(frame, 1);
    expect(await worn(frame)).toEqual([true, false]);
  });

  test('only what is in hand feeds the Acts', async ({ page }) => {
    const frame = await armed(page, [{ tree: 'Blade', form: 0, equipped: true },
                                     { tree: 'Bludgeon', form: 0, equipped: false },
                                     { tree: 'Polearm', form: 0, equipped: false }]);
    let src = await actSources(frame);
    expect(src, 'one weapon held, one Basic attack').toEqual(['Dagger']);

    await takeUp(frame, 1);
    src = await actSources(frame);
    expect(src.sort(), 'and the row follows immediately').toEqual(['Dagger', 'Mace']);

    await takeUp(frame, 0);
    expect(await actSources(frame), 'setting one down takes its Acts with it').toEqual(['Mace']);
  });

  test('a Fell holding nothing still has fists', async ({ page }) => {
    const frame = await armed(page, [{ tree: 'Blade', form: 0, equipped: false }]);
    expect(await actSources(frame), 'owning a dagger you are not holding is not holding it')
      .toEqual(['Unarmed']);
  });

  test('what is in hand survives a reload', async ({ page }) => {
    const frame = await armed(page, [{ tree: 'Blade', form: 0, equipped: false },
                                     { tree: 'Bludgeon', form: 0, equipped: false }]);
    await takeUp(frame, 1);

    /* the sheet saves the character; what comes back has to remember */
    const saved = await frame.evaluate(() => JSON.parse(JSON.stringify(C.weapons)));
    expect(saved.map((w) => !!w.equipped)).toEqual([false, true]);

    const back = await frame.evaluate((ws) => {
      C.weapons = ws; equipSeed(); renderBattle();
      return { worn: C.weapons.map((w) => !!w.equipped),
               src: (window.COMBAT_ACTS || []).filter((a) => a.kind === 'weapon').map((a) => a.src) };
    }, saved);
    expect(back.worn, 'a decision already made is not seeded over').toEqual([false, true]);
    expect(back.src).toEqual(['Mace']);
  });

  test('a Fell from before hands were counted is given what fits', async ({ page }) => {
    /* no equipped flag anywhere: an empty row would be a worse greeting than a guess */
    const frame = await armed(page, [{ tree: 'Blade', form: 0 }, { tree: 'Bludgeon', form: 0 },
                                     { tree: 'Polearm', form: 0 }]);
    const seeded = await frame.evaluate(() => { equipSeed(); renderBattle(); return C.weapons.map((w) => !!w.equipped); });
    expect(seeded, 'the first two one-hand weapons, and no more').toEqual([true, true, false]);
  });

  test('and a two-hand weapon first takes both hands on its own', async ({ page }) => {
    const frame = await armed(page, [{ tree: 'Bow', form: 1 }, { tree: 'Blade', form: 0 }]);
    const seeded = await frame.evaluate(() => { equipSeed(); return C.weapons.map((w) => !!w.equipped); });
    expect(seeded).toEqual([true, false]);
  });
});

/* ---- utilities ---- */

async function packed(page, wit, n) {
  const frame = await mountSheet(page, { home: 'threadspire' });
  await frame.evaluate(({ w, count }) => {
    ITEMS_LIB = [];
    C.inventory = [];
    for (let i = 1; i <= count; i++) {
      ITEMS_LIB.push({ id: 'u' + i, name: 'Utility ' + i, use: 'Act', desc: 'a thing' });
      C.inventory.push({ itemId: 'u' + i, quantity: 1, discovered: true, equipped: false });
    }
    /* an attribute is {base, mod} on the character, and attrTotal adds grants and
       stance on top; base is the part a rest buys */
    C.attrs.wit.base = w; C.attrs.wit.mod = 0;
    C.weapons = [];
    CUR_WIX_ID = 'chr-harness-0001';
    COMBAT = { active: true, round: 1, phase: 'commit', fighters: [], you: {} };
    renderItems(); renderBattle();
  }, { w: wit, count: n });
  return frame;
}

const cap = (frame) => frame.evaluate(() => utilityCap());
const packWorn = (frame) => frame.evaluate(() => C.inventory.map((i) => !!i.equipped));
const takeUtil = (frame, i) => frame.evaluate((idx) => { toggleUtilityEquip(idx); }, i);
const pickerNames = (frame) => frame.evaluate(() => cbUtilities().map((u) => u.name));

test.describe('A14 what a Fell carries', () => {

  test('the pack holds one, and one more for every point of Wit', async ({ page }) => {
    const frame = await packed(page, 2, 6);
    expect(await cap(frame), 'Wit 2 carries three').toBe(3);
  });

  test('a utility past the cap is refused and says why', async ({ page }) => {
    const frame = await packed(page, 0, 3);            /* Wit 0 carries one */
    await takeUtil(frame, 0);
    await takeUtil(frame, 1);

    expect(await packWorn(frame), 'the second did not go in').toEqual([true, false, false]);
    const w = await frame.evaluate(() => {
      const n = document.querySelector('#itemsWrap .equip-warn');
      return n ? n.textContent : null;
    });
    expect(w).toContain('Wit');
    expect(w, 'and what to do about it').toContain('Set one down');
  });

  test('utilities cost no hands', async ({ page }) => {
    const frame = await packed(page, 1, 2);
    await frame.evaluate(() => {
      const b = newWeapon(); b.tree = 'Bow'; b.formIdx = 1; b.equipped = true;
      C.weapons = [b];
    });
    await takeUtil(frame, 0);
    await takeUtil(frame, 1);
    expect(await packWorn(frame), 'both hands on a bow and the pack is still the pack')
      .toEqual([true, true]);
  });

  test('only what is carried reaches the combat picker', async ({ page }) => {
    const frame = await packed(page, 1, 3);
    await takeUtil(frame, 1);
    expect(await pickerNames(frame)).toEqual(['Utility 2']);

    await takeUtil(frame, 2);
    expect((await pickerNames(frame)).sort()).toEqual(['Utility 2', 'Utility 3']);

    await takeUtil(frame, 1);
    expect(await pickerNames(frame), 'setting one down takes it off the row').toEqual(['Utility 3']);
  });

  test('the utility Act is there only while something is carried', async ({ page }) => {
    const frame = await packed(page, 1, 2);
    const hasAct = () => frame.evaluate(() => {
      renderBattle();
      return (window.COMBAT_ACTS || []).some((a) => a.src === 'utility');
    });
    expect(await hasAct(), 'an empty pack offers nothing to spend an Act on').toBe(false);
    await takeUtil(frame, 0);
    expect(await hasAct()).toBe(true);
  });
});
