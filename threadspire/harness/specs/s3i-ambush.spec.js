/* S3i — F8, the ambush opening.
 *
 * ORACLE: The FellGuide, "The Combat", Ambush.
 *
 *   "When the Fell move on an enemy undetected, they roll Presence against the enemy's
 *    Vigilance. On a success the Fell take a free opening Act each, resolved as a
 *    Spotlight, before the LoreMaster Commits the first round. Enemies take no React
 *    during this opening. ... The reverse holds. Enemies who catch the Fell unaware take
 *    the same free opening before anyone declares."
 *
 * Plus the designer's ruling on Q3: the opening Act is per PARTICIPATING Fell, not a
 * blanket grant to the party, and not everyone necessarily participates. So who is in it
 * is modelled explicitly rather than inferred from being at the table.
 *
 * The contest itself is not simulated here and is not meant to be. Presence is rolled on
 * the player's own sheet like every other player roll, and the board records the outcome;
 * what this covers is what the outcome then permits and forbids.
 *
 * Participants ride on spotlightChars, which already exists on CombatState and already
 * means "who is in the Spotlight". Canon resolves the opening AS a Spotlight, so that is
 * the right field rather than an overload of one, and it needs no schema change.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function bothSides() {
  return {
    lm: { role: 'lm', campaignId: F.CAMPAIGN_A, rawCampaign: F.BEACONS, party: F.PARTY_A },
    player: {
      role: 'player', campaignId: F.CAMPAIGN_A, characterId: F.FELL_CHAR_ID,
      character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A
    }
  };
}

const ACTS = [
  { src: 'Blade', nm: 'Basic attack', desc: 'standard strike', dmg: 6, base: 3, dt: 'phys',
    tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false }
];
const REACTS = [
  { src: 'movement', nm: 'Move', desc: 'Movement is a React.', tier: null, kind: 'standard', locked: false }
];

/* The row cases mount the PLAYER alone, deliberately. With a LoreMaster frame up too,
 * that frame publishes mode 'explore' and the player adopts it through
 * applyRemoteSnapshot, which hides the row underneath the test. That is correct product
 * behaviour, the LoreMaster owns whether a fight is on, and it makes a two-frame mount
 * the wrong tool for asking what a card looks like. The LoreMaster cases above need both
 * frames and do not touch the row. */
function playerOnly() {
  return {
    player: {
      role: 'player', campaignId: F.CAMPAIGN_A, characterId: F.FELL_CHAR_ID,
      character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A
    }
  };
}

/* Hand the row exactly what the sheet would derive from a published opening. */
async function rowInOpening(frame, opts) {
  await frame.evaluate(({ side, inIt, acts, reacts }) => {
    window.S.role = 'player';
    window.S.mode = 'combat';
    window.tsHandTake({
      charge: 3, acts: acts, reacts: reacts, skills: {}, items: [], stances: [],
      gates: { noAct: false, noReact: false, notes: [] },
      active: true, round: 1,
      phase: side ? ('ambush:' + side) : 'commit',
      opening: !!side, openingSide: side || '', inOpening: !!inIt,
      fighters: [{ key: 'm:cb-1', name: 'The Erasure', side: 'monster', charId: '' }]
    });
    window.render();
  }, { side: opts.side || '', inIt: !!opts.inIt, acts: ACTS, reacts: REACTS });
}

const card = (frame, nm) => frame.evaluate((n) => {
  const c = Array.from(document.querySelectorAll('#hand .hcard')).find((x) => x.getAttribute('data-act') === n);
  return c ? { barred: c.classList.contains('barred'), text: c.textContent } : null;
}, nm);

const phaseNote = (frame) => frame.evaluate(() => {
  const n = document.querySelector('#hand .hs-phase');
  return n ? n.textContent : null;
});

const armed = (frame, nm, group) => frame.evaluate(
  ({ n, g }) => { window.handArm(n, g); return !!window.armed; }, { n: nm, g: group });

test.describe('S3i the ambush opening', () => {

  /* ---- the LoreMaster's side ------------------------------------------------------- */

  test('an opening runs before the first Commit, and Commit follows it', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    await frames.lm.evaluate(() => window.lmBeginAmbush('fell'));
    expect(await frames.lm.evaluate(() => window.S.scene.combatPhase),
      'the opening is its own phase, ahead of Commit').toBe('ambush:fell');
    expect(await frames.lm.evaluate(() => window.S.mode)).toBe('combat');

    await frames.lm.evaluate(() => window.lmAmbushResolve());
    expect(await frames.lm.evaluate(() => window.S.scene.combatPhase),
      'once it resolves, the round proper begins at step one').toBe('commit');
  });

  test('participation is per Fell, recorded rather than assumed', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    await frames.lm.evaluate(() => window.lmBeginAmbush('fell'));
    expect(await frames.lm.evaluate(() => window.S.scene.ambush.participants),
      'nobody is in it until the contest says so').toEqual([]);

    await frames.lm.evaluate((cid) => window.lmAmbushToggle(cid), F.FELL_CHAR_ID);
    expect(await frames.lm.evaluate(() => window.S.scene.ambush.participants)).toEqual([F.FELL_CHAR_ID]);

    /* and it is a toggle, because a LoreMaster misreading a roll must be able to undo it */
    await frames.lm.evaluate((cid) => window.lmAmbushToggle(cid), F.FELL_CHAR_ID);
    expect(await frames.lm.evaluate(() => window.S.scene.ambush.participants)).toEqual([]);
  });

  test('the participants are published as the opening Spotlight', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    await frames.lm.evaluate(() => window.lmBeginAmbush('fell'));
    await frames.lm.evaluate((cid) => window.lmAmbushToggle(cid), F.FELL_CHAR_ID);
    await page.waitForFunction(({ c, ch }) => {
      const s = window.TSH.combatFor(c, ch);
      return s.active && s.spotlightChars.length > 0;
    }, { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });

    const st = await page.evaluate(({ c, ch }) => window.TSH.combatFor(c, ch),
      { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });
    expect(st.phase).toBe('ambush:fell');
    expect(st.spotlightChars).toEqual([F.FELL_CHAR_ID]);
  });

  test('nobody participates in the enemy\'s opening', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());

    await frames.lm.evaluate(() => window.lmBeginAmbush('foes'));
    expect(await frames.lm.evaluate(() => window.S.scene.combatPhase)).toBe('ambush:foes');

    await frames.lm.evaluate((cid) => window.lmAmbushToggle(cid), F.FELL_CHAR_ID);
    expect(await frames.lm.evaluate(() => window.S.scene.ambush.participants),
      'the Fell are the ones caught; there is no Fell participation to record').toEqual([]);

    const st = await page.evaluate(({ c, ch }) => window.TSH.combatFor(c, ch),
      { c: F.CAMPAIGN_A, ch: F.FELL_CHAR_ID });
    expect(st.spotlightChars).toEqual([]);
  });

  /* ---- what the opening permits and forbids --------------------------------------- */

  test('a Fell in the opening may Act', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await rowInOpening(player, { side: 'fell', inIt: true });

    const act = await card(player, 'Basic attack');
    expect(act.barred).toBe(false);
    expect(await armed(player, 'Basic attack', 'act')).toBe(true);
    expect(await phaseNote(player)).toContain('One free Act');
  });

  test('nobody Reacts in the opening, not even a participant', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await rowInOpening(player, { side: 'fell', inIt: true });

    const react = await card(player, 'Move');
    expect(react.barred, 'canon is explicit: no React during the opening').toBe(true);
    expect(react.text).toContain('No React');
    expect(await armed(player, 'Move', 'react')).toBe(false);
  });

  test('a Fell left out of the opening takes no Act in it', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await rowInOpening(player, { side: 'fell', inIt: false });

    const act = await card(player, 'Basic attack');
    expect(act.barred, 'the opening is per participant, not a gift to the party').toBe(true);
    expect(act.text).toContain('Not in it');
    expect(await armed(player, 'Basic attack', 'act')).toBe(false);
    expect(await phaseNote(player)).toContain('not in this one');
  });

  test('when the enemy has the opening, no Fell acts at all', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await rowInOpening(player, { side: 'foes', inIt: false });

    expect((await card(player, 'Basic attack')).barred).toBe(true);
    expect((await card(player, 'Move')).barred).toBe(true);
    expect(await phaseNote(player)).toContain('They caught you');
  });

  test('once the opening is over the hand is ordinary again', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');

    await rowInOpening(player, { side: 'fell', inIt: false });
    expect((await card(player, 'Basic attack')).barred).toBe(true);

    await rowInOpening(player, { side: '' });      /* phase back to commit */
    expect((await card(player, 'Basic attack')).barred,
      'a Fell who sat out the opening is in the round like everyone else').toBe(false);
    expect((await card(player, 'Move')).barred).toBe(false);
  });
});
