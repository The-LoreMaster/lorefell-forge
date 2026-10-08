/* B-case-2: a Fell forged before 2026-10-08 gets its attribute lineage bonus.
 *
 * The forging used to read an attribute lineage's bonus ("+1 Vigor") as a skill named
 * after the attribute, so the record holds grants.skills.Vigor = 1 and no attribute
 * point. lineageBackfill moves it to the attribute once, on load, and saves. Vigor also
 * lifts max Vitality, because level 1 counted Vigor.
 */
const { test, expect } = require('@playwright/test');
const S = require('./_sheet.js');

/* the embed can show the default sheet before the record lands, so wait for this Fell */
async function mount(page, opts) {
  const frame = await S.mountSheet(page, opts);
  await frame.waitForFunction(() => C.identity && C.identity.name === 'Orrin Vale');
  return frame;
}

function oldFell(attr, extra) {
  return Object.assign({
    created: true,
    vitL1: 1,
    identity: { name: 'Orrin Vale', lineage: 'The Hallowed' },
    lore: { level: 2, lorePoints: 0 },
    attrs: { vigor: { base: 1, mod: 0 }, power: { base: 1, mod: 0 } },
    grants: { attrs: {}, skills: { [attr]: 1, Might: 1 } },
    vitality: { max: 9, current: 7 },
    weapons: [], armor: { level: 0 }, lorebounds: []
  }, extra || {});
}

test.describe('B2 an old Fell gets its attribute lineage bonus', () => {
  test('the stray skill becomes an attribute point, Vitality follows Vigor, and it saves', async ({ page }) => {
    let frame = await mount(page, { record: oldFell('Vigor') });
    const now = await frame.evaluate(() => ({ g: C.grants, vit: C.vitality }));
    expect(now.g.attrs.vigor).toBe(1);
    expect(now.g.skills.Vigor).toBeUndefined();
    expect(now.g.skills.Might).toBe(1);
    expect(now.vit.max).toBe(10);
    expect(now.vit.current).toBe(8);

    await page.waitForFunction(() => window.FSH.saves.length > 0);
    frame = await S.reloadSheet(page);
    const again = await frame.evaluate(() => ({ g: C.grants, vit: C.vitality }));
    expect(again.g.attrs.vigor).toBe(1);
    expect(again.vit.max).toBe(10);
  });

  test('a non-Vigor attribute leaves Vitality alone, and a LoreMaster-set maximum is kept', async ({ page }) => {
    const frame = await mount(page, { record: oldFell('Power', { lmVit: 1 }) });
    const now = await frame.evaluate(() => ({ g: C.grants, vit: C.vitality }));
    expect(now.g.attrs.power).toBe(1);
    expect(now.g.skills.Power).toBeUndefined();
    expect(now.vit.max).toBe(9);
  });

  test('the same repair runs in the ThreadSpire embed', async ({ page }) => {
    const frame = await mount(page, { home: 'threadspire', record: oldFell('Wit') });
    const g = await frame.evaluate(() => C.grants);
    expect(g.attrs.wit).toBe(1);
    expect(g.skills.Wit).toBeUndefined();
  });
});
