/* S3a — the player's hand crosses the frame.
 *
 * ThreadSpire draws the Act/React cards under the map, but it does not work out what
 * belongs on them. FellGlass does, from the arsenal, inventory, talents and charge it
 * already holds, and hands the result over. This is that seam, and nothing here touches
 * the map: if this passes, the card row has something true to draw.
 *
 * Oracle is the FellGuide:
 *   F9  A locked act stays VISIBLE. The sheet's own hand drops an act the charge cannot
 *       reach (cbDealAttacks returns early on tier > charge); the card row has to show
 *       it greyed so a player can see what the next charge buys. So the feed carries
 *       every act and marks the ones out of reach, rather than filtering them.
 *   F3  Contest is set by standard-versus-ability, never by weapon family. A standard
 *       attack rolls Precision against Evasion for every weapon, magic included. Only a
 *       CHARGED ability on a magic weapon is a Spell Attack, rolling its tree's Magic
 *       skill against Difficulty. (Weapon Abilities.md, Spell Attack.md, CANON.md
 *       "Attack Resolution".)
 *   Spell skill is a property of the TREE: Foci casts on Weaving, Artifact on Spirit,
 *       Tome on Creation. (Magic Weapons.md, the Spell Skill column.)
 *
 * This asserts the DATA only. Resolving a spell against Difficulty is its own step and
 * is not built yet.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { mountSheet, weaponRecord } = require(path.join(__dirname, '_sheet.js'));

/* The tree -> skill mapping, as the FellGuide states it. Written out here rather than
 * read from the page: a test that asks the code what the rule is cannot catch the code
 * getting the rule wrong.
 *
 * Keyed "Grimoire" because that is what w.tree holds. The vault calls this tree the
 * Tome Tree and the tool calls it Grimoire, after its third form; the forms are the
 * same three either way (Cards, Scroll, Grimoire). Asserted under the tool's key
 * because the tool's key is what the mapping has to match at runtime. */
const TREE_SKILL = { Foci: 'Weaving', Artifact: 'Spirit', Grimoire: 'Creation' };

/* Stand a Fell up holding one weapon of the given tree, carrying one ability at each
 * tier, at a known charge. ABILITIES normally arrives from the site library, which the
 * sheet harness does not serve, so it is seeded here: without it every ability resolves
 * to a null tier and there is nothing to lock or to cast. */
async function armFell(frame, tree, charge) {
  const w = await weaponRecord(frame, tree, 9);
  return frame.evaluate(({ weapon, tree, charge }) => {
    ABILITIES = [
      { name: 'Tier One Strike', use: 'Act', tier: 1 },
      { name: 'Tier Two Strike', use: 'Act', tier: 2 },
      { name: 'Tier Three Strike', use: 'Act', tier: 3 }
    ];
    weapon.abilities = ['Tier One Strike', 'Tier Two Strike', 'Tier Three Strike'];
    C.weapons = [weapon];
    C.charge = charge;
    renderBattle();
    return { tree: tree, charge: C.charge };
  }, { weapon: w, tree, charge });
}

const handOf = (page) => page.evaluate(() => window.FSH.lastHand);
const actNamed = (hand, nm) => (hand.acts || []).find((a) => a.nm === nm);

test.describe('S3a the hand crosses the frame', () => {
  test('the sheet hands its acts over when asked', async ({ page }) => {
    const frame = await mountSheet(page, { home: 'threadspire' });
    await page.evaluate(() => { window.FSH.lastHand = null; });
    await frame.evaluate(() => { window._tsHandSig = null; tsSendHand(); });

    const hand = await handOf(page);
    expect(hand, 'a hand arrived at the ThreadSpire side').toBeTruthy();
    expect(Array.isArray(hand.acts)).toBe(true);
    expect(Array.isArray(hand.reacts)).toBe(true);
    expect(typeof hand.charge).toBe('number');
  });

  test('F9 an act above the charge travels, marked locked, instead of being dropped', async ({ page }) => {
    const frame = await mountSheet(page, { home: 'threadspire' });
    await armFell(frame, 'Foci', 0);

    const hand = await handOf(page);
    const t3 = actNamed(hand, 'Tier Three Strike');
    const t1 = actNamed(hand, 'Tier One Strike');

    expect(t3, 'the tier 3 act is present at charge 0, not filtered out').toBeTruthy();
    expect(t3.locked, 'and it reads as locked').toBe(true);
    expect(t1.locked, 'so does the tier 1 act, at charge 0').toBe(true);

    /* the sheet's own hand is where the filtering happens; prove the two really do
     * differ, or this assertion is only testing itself */
    const shown = await frame.evaluate(() =>
      (window.COMBAT_ACTS || []).filter((a) => typeof a.tier === 'number' && a.tier > 0 && a.tier > (C.charge || 0)).length);
    expect(shown, 'there are acts the sheet would have dropped').toBeGreaterThan(0);
  });

  test('F9 a charge unlocks in place, and the row is told', async ({ page }) => {
    const frame = await mountSheet(page, { home: 'threadspire' });
    await armFell(frame, 'Foci', 0);
    expect(actNamed(await handOf(page), 'Tier One Strike').locked).toBe(true);

    /* the LoreMaster lighting a charge does not rebuild the hand, it only changes what
     * the hand can reach, so renderCharges has to be a sender too */
    await frame.evaluate(() => { C.charge = 1; renderCharges(); });

    const after = await handOf(page);
    expect(after.charge).toBe(1);
    expect(actNamed(after, 'Tier One Strike').locked, 'tier 1 is now in reach').toBe(false);
    expect(actNamed(after, 'Tier Two Strike').locked, 'tier 2 still is not').toBe(true);
  });

  test('F3 a standard attack rolls against Evasion, whatever the weapon', async ({ page }) => {
    for (const tree of ['Foci', 'Blade', 'Axe']) {
      const frame = await mountSheet(page, { home: 'threadspire' });
      await armFell(frame, tree, 3);
      const basic = actNamed(await handOf(page), 'Basic attack');
      expect(basic, `${tree} has a basic attack`).toBeTruthy();
      expect(basic.contest, `${tree} basic attack resolves on Evasion`).toBe('evasion');
      expect(basic.castSkill, `${tree} basic attack casts nothing`).toBe('');
    }
  });

  test('F3 a charged ability on a magic weapon is a Spell Attack on its tree skill', async ({ page }) => {
    for (const tree of Object.keys(TREE_SKILL)) {
      const frame = await mountSheet(page, { home: 'threadspire' });
      await armFell(frame, tree, 3);
      const hand = await handOf(page);

      for (const nm of ['Tier One Strike', 'Tier Two Strike', 'Tier Three Strike']) {
        const act = actNamed(hand, nm);
        expect(act, `${tree} carries ${nm}`).toBeTruthy();
        expect(act.contest, `${tree} ${nm} rolls against Difficulty`).toBe('difficulty');
        expect(act.castSkill, `${tree} casts on ${TREE_SKILL[tree]}`).toBe(TREE_SKILL[tree]);
      }
    }
  });

  test('F3 a charged ability on a physical weapon still rolls against Evasion', async ({ page }) => {
    for (const tree of ['Blade', 'Axe']) {
      const frame = await mountSheet(page, { home: 'threadspire' });
      await armFell(frame, tree, 3);
      const act = actNamed(await handOf(page), 'Tier Two Strike');
      expect(act.contest, `${tree} abilities are not spells`).toBe('evasion');
      expect(act.castSkill).toBe('');
    }
  });

  test('a card has words on it', async ({ page }) => {
    const frame = await mountSheet(page, { home: 'threadspire' });
    await armFell(frame, 'Foci', 3);
    const hand = await handOf(page);

    expect(actNamed(hand, 'Basic attack').desc, 'the basic attack explains itself').toBeTruthy();

    /* F5 rides this feed: the movement React's text is canon now, and the card row
     * renders whatever arrives here */
    const move = (hand.reacts || []).find((r) => r.nm === 'Move');
    expect(move, 'Move is offered as a React').toBeTruthy();
    expect(move.desc).toContain('never part of an Act');
    expect(move.desc).not.toContain('part of an Act or React');
  });

  test('an unchanged hand does not cross the frame twice', async ({ page }) => {
    const frame = await mountSheet(page, { home: 'threadspire' });
    await armFell(frame, 'Foci', 1);
    const before = await page.evaluate(() => window.FSH.hands.length);

    await frame.evaluate(() => { renderBattle(); renderBattle(); });
    const after = await page.evaluate(() => window.FSH.hands.length);

    expect(after, 'repainting the same hand sends nothing').toBe(before);
  });
});
