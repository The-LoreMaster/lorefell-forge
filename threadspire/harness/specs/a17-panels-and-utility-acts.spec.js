/* A17 — the sheet stays a sheet, and a rope is not an Act.
 *
 * TABS. cbs-full blanks the whole sheet body behind the combat banner. That was right
 * when the sheet carried the declare builder - the builder deserved the room - and wrong
 * once the map carried it: a player who had locked in and went looking for their
 * Inventory, Skills, Arsenal, Attributes or Lore found the combat panel in all five. On
 * the table the sheet is a reference surface; the combat surface is the map and the gem.
 * Standalone, with no map to declare from, nothing changes.
 *
 * UTILITY ACTS. Two filters at two layers. CATEGORY decides what can be an Act at all:
 * only use==="Act" utilities reach the combat picker, because a rope for climbing is not
 * a worse option in a fight, it is not an option in a fight. AVAILABILITY decides whether
 * the card is live: "Use a utility" is greyed with its reason when nothing is carried,
 * per F9, rather than vanishing.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { mountSheet } = require(path.join(__dirname, '_sheet.js'));

/* A pack with one of each kind, so category filtering has something to get wrong. */
async function packed(page, opts) {
  opts = opts || {};
  const frame = await mountSheet(page, { home: opts.home || 'threadspire' });
  await frame.evaluate((o) => {
    ITEMS_LIB = [
      { id: 'u1', name: 'Ashen Tonic', use: 'Act', desc: 'Restores a measure of vitality.' },
      { id: 'u2', name: 'Waxed Rope', use: 'Out of Combat', desc: 'Fifty feet.' },
      { id: 'u3', name: 'Warding Charm', use: 'React', desc: 'Turn a blow aside.' },
      { id: 'u4', name: 'Hearthstone', use: 'Passive', desc: 'It is simply warm.' }
    ];
    C.inventory = [
      { itemId: 'u1', quantity: 2, discovered: true, equipped: !!o.tonic },
      { itemId: 'u2', quantity: 1, discovered: true, equipped: true },
      { itemId: 'u3', quantity: 1, discovered: true, equipped: true },
      { itemId: 'u4', quantity: 1, discovered: true, equipped: true }
    ];
    C.attrs.wit.base = 5; C.attrs.wit.mod = 0;
    C.weapons = [];
    CUR_WIX_ID = 'chr-harness-0001';
    COMBAT = { active: true, round: 1, phase: o.phase || 'commit',
               fighters: [{ key: 'p:pl-7', name: 'Maerwen', side: 'fell', charId: 'chr-harness-0001' }],
               you: {} };
    if (o.declared) window._declaredRound = 1;
    renderItems(); renderBattle(); applyCombatMode();
  }, opts);
  return frame;
}

const actUtil = (frame) => frame.evaluate(() => cbActUtilities().map((u) => u.name));
const allCarried = (frame) => frame.evaluate(() => cbUtilities().map((u) => u.name));
const utilAct = (frame) => frame.evaluate(() =>
  (window.COMBAT_ACTS || []).filter((a) => a.src === 'utility')[0] || null);

test.describe('A17 a rope is not an Act', () => {

  test('only Act-category utilities reach the combat picker', async ({ page }) => {
    const frame = await packed(page, { tonic: true });
    expect(await actUtil(frame), 'the tonic, and nothing else').toEqual(['Ashen Tonic']);
  });

  test('the others are still carried, and still known', async ({ page }) => {
    const frame = await packed(page, { tonic: true });
    const carried = await allCarried(frame);
    expect(carried, 'the pack is the pack').toContain('Waxed Rope');
    expect(carried).toContain('Warding Charm');
    expect(carried).toContain('Hearthstone');
    expect(carried, 'four carried, one of them an Act').toHaveLength(4);
  });

  test('the sheet Utility tab still shows what the combat picker will not', async ({ page }) => {
    const frame = await packed(page, { tonic: true });
    /* listed-but-tagged lives here, where "Out of Combat" means something */
    const tab = await frame.evaluate(() =>
      document.getElementById('itemsWrap').textContent.replace(/\s+/g, ' '));
    expect(tab).toContain('Waxed Rope');
    expect(tab).toContain('Ashen Tonic');
  });

  test('the Act is greyed with its reason when nothing usable is carried', async ({ page }) => {
    const frame = await packed(page, { tonic: false });     /* the tonic is on the shelf */
    const a = await utilAct(frame);
    expect(a, 'F9: the card is there rather than vanishing').not.toBeNull();
    expect(a.bar, 'wearing why').toBe('Nothing carried');
    expect(await actUtil(frame)).toEqual([]);
  });

  test('and lights up when one is taken up', async ({ page }) => {
    const frame = await packed(page, { tonic: false });
    expect((await utilAct(frame)).bar).toBe('Nothing carried');

    await frame.evaluate(() => {
      C.inventory[0].equipped = true;
      renderBattle();
    });
    expect((await utilAct(frame)).bar, 'nothing in the way now').toBe('');
    expect(await actUtil(frame)).toEqual(['Ashen Tonic']);
  });

  test('a Fell owning no Act utility at all gets no card', async ({ page }) => {
    const frame = await packed(page, {});
    const gone = await frame.evaluate(() => {
      C.inventory = C.inventory.filter((i) => i.itemId !== 'u1');   /* rope, charm, stone */
      renderBattle();
      return (window.COMBAT_ACTS || []).filter((a) => a.src === 'utility').length;
    });
    expect(gone, 'a permanently dead card is noise, not information').toBe(0);
  });

  test('the bar travels to the row on the hand', async ({ page }) => {
    const frame = await packed(page, { tonic: false });
    await frame.evaluate(() => { window._tsHandSig = null; tsSendHand(); });
    await page.waitForFunction(() => window.FSH.lastHand !== null);

    const act = (await page.evaluate(() => window.FSH.lastHand))
      .acts.filter((a) => a.src === 'utility')[0];
    expect(act, 'the row is told about it').toBeTruthy();
    expect(act.bar, 'and told why it is greyed').toBe('Nothing carried');
  });
});

test.describe('A17 the sheet stays a sheet on the table', () => {

  const full = (frame) => frame.evaluate(() => document.body.classList.contains('cbs-full'));
  const bannerUp = (frame) => frame.evaluate(() => {
    const b = document.getElementById('combatBanner');
    return !!b && b.style.display !== 'none';
  });
  const panelsVisible = (frame) => frame.evaluate(() => {
    /* what cbs-full would have blanked */
    const p = document.querySelector('main') || document.body;
    return window.getComputedStyle(p).display !== 'none';
  });

  test('before a declare, the tabs are readable', async ({ page }) => {
    const frame = await packed(page, { tonic: true });
    expect(await full(frame)).toBe(false);
    expect(await panelsVisible(frame)).toBe(true);
  });

  test('after locking in, the tabs are still readable', async ({ page }) => {
    const frame = await packed(page, { tonic: true, declared: true });
    expect(await full(frame), 'this is the one that took over all five tabs').toBe(false);
    expect(await panelsVisible(frame)).toBe(true);
    expect(await bannerUp(frame), 'the banner still says what is happening').toBe(true);
  });

  test('and during resolution too', async ({ page }) => {
    const frame = await packed(page, { tonic: true, declared: true, phase: 'resolve' });
    expect(await full(frame)).toBe(false);
    expect(await bannerUp(frame)).toBe(true);
  });

  test('standalone, with no map to declare from, the panel still takes the room', async ({ page }) => {
    const frame = await packed(page, { tonic: true, declared: true, home: 'standalone' });
    expect(await full(frame), 'there is no card row out there; the sheet is the only surface')
      .toBe(true);
  });
});
