/* S3b — the card row draws the hand.
 *
 * S3a proved the hand crosses the frame with the right contents. This is the other half:
 * given a hand, what the player sees along the bottom of the map.
 *
 * The hand is injected here rather than pumped through a live sheet. That is deliberate
 * and it is the seam S3a already covers: this spec is about the ROW, and a real sheet
 * would only make the input harder to control without testing anything S3a does not.
 * The two together cover sheet-to-row; neither claims to on its own.
 *
 * Oracle is the FellGuide by way of the brief:
 *   F9  A locked act is visible, not absent, so a player can see what a charge buys.
 *   F3  Only a charged magic-weapon ability casts against Difficulty, and the card has
 *       to say so, because it is a different roll from every other card on the row.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function playerOnly() {
  return {
    player: {
      role: 'player',
      campaignId: F.CAMPAIGN_A,
      characterId: F.FELL_CHAR_ID,
      character: F.CHARACTER_A,
      characters: [F.CHARACTER_A],
      party: F.PARTY_A
    }
  };
}

/* A hand shaped exactly as tsHandPayload builds one. Written out rather than derived so
 * a change to the payload shape shows up here as a failure and not as a silent pass. */
function handAt(charge) {
  const lock = (tier) => typeof tier === 'number' && tier > 0 && tier > charge;
  const acts = [
    { src: 'Wand', nm: 'Basic attack', desc: 'Tier 0 · standard strike', dmg: 7, base: 4, dt: 'magic',
      aff: '', tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '' },
    { src: 'Wand', nm: 'Razorwind', desc: 'Cast. On a success, deal Standard Damage.', dmg: 7, base: 4,
      dt: 'magic', aff: '', tier: 1, kind: 'weapon', contest: 'difficulty', castSkill: 'Weaving' },
    { src: 'Wand', nm: 'Worldspire', desc: 'Cast at three targets.', dmg: 9, base: 4, dt: 'magic',
      aff: '', tier: 3, kind: 'weapon', contest: 'difficulty', castSkill: 'Weaving' },
    { src: 'skills', nm: 'Any skill', desc: 'All 24 skills may be attempted as an Act.', dmg: 0, base: 0,
      dt: null, aff: '', tier: null, kind: 'standard', contest: 'evasion', castSkill: '' }
  ].map((a) => Object.assign(a, { locked: lock(a.tier) }));
  const reacts = [
    { src: 'movement', nm: 'Move', desc: 'Movement is a React. It spends your entire React and is never part of an Act. Once per round.', tier: null, kind: 'standard', locked: false },
    { src: 'The Aerostrix', nm: 'Augury', desc: 'When a Fell makes an attack, that attack is a Lucky Roll.', tier: 1, kind: 'lorebound', locked: lock(1) }
  ];
  return { charge, gates: { noAct: false, noReact: false, notes: [] }, acts, reacts,
           skills: { Guard: 3, Might: 1, Vigilance: 2 },
           items: [{ name: 'Emberdraught', qty: 2 }],
           stances: ['Shrouded', 'Stalwart', 'Vestments'], worn: 'Stalwart',
           round: 1, phase: 'resolve', active: true, declared: false, reactUsed: false };
  /* phase resolve because this spec reaches React cards, and Reacts only exist while the
     board is resolving (A8). What it is testing is the row, not the phase rule. */
}

/* Put the table in a fight and hand the row something to draw. */
async function dealHand(frame, charge) {
  await frame.evaluate((h) => {
    window.S.role = 'player';
    window.S.mode = 'combat';
    window.tsHandTake(h);
    window.render();
  }, handAt(charge));
}

const cardNames = (frame) => frame.evaluate(() =>
  Array.from(document.querySelectorAll('#hand .hcard')).map((c) => c.getAttribute('data-act')));

/* The row shows one group at a time now (A3), so a card may be behind the other tab. A
 * player reaches it by tapping the tab, and so do these helpers: what is under test here
 * is the card, not which tab happened to be open. */
const reveal = (frame, nm) => frame.evaluate((n) => {
  const inActs = ((window.hand && window.hand.acts) || []).some((a) => a.nm === n);
  window.handSetTab(inActs ? 'act' : 'react');
}, nm);

const cardByName = async (frame, nm) => { await reveal(frame, nm); return frame.evaluate((n) => {
  const c = Array.from(document.querySelectorAll('#hand .hcard')).find((x) => x.getAttribute('data-act') === n);
  if (!c) return null;
  return {
    locked: c.classList.contains('locked'),
    barred: c.classList.contains('barred'),
    armed: c.classList.contains('armed'),
    ariaDisabled: c.getAttribute('aria-disabled'),
    ariaPressed: c.getAttribute('aria-pressed'),
    text: c.textContent,
    lit: c.querySelectorAll('.hc-pip.on').length
  };
}, nm); };

const rowHidden = (frame) => frame.evaluate(() =>
  document.getElementById('hand').classList.contains('hidden'));

/* Tap a card the way a finger does, through the row's own listener, reaching its tab
 * first if it is behind the other one. */
const tapCard = async (frame, nm) => { await reveal(frame, nm); return frame.evaluate((n) => {
  const c = Array.from(document.querySelectorAll('#hand .hcard')).find((x) => x.getAttribute('data-act') === n);
  if (!c) throw new Error('no card named ' + n);
  c.click();
}, nm); };

const tapOption = (frame, val) => frame.evaluate((v) => {
  const o = Array.from(document.querySelectorAll('#hand .hp-opt')).find((x) => x.getAttribute('data-val') === v);
  if (!o) throw new Error('no option named ' + v);
  o.click();
}, val);

const armedNames = (frame) => frame.evaluate(() =>
  Array.from(document.querySelectorAll('#hand .hcard.armed')).map((c) => c.getAttribute('data-act')));

const pickerLabel = (frame) => frame.evaluate(() => {
  const p = document.querySelector('#hand .hand-pick .hp-lab');
  return p ? p.textContent : null;
});

/* These cases set S.tokens and S.mode locally and then assert on what the page did
 * with them. The shared-store poll writes both of those from the feed, so a poll landing
 * mid-test replaces the very state under test and the case fails for a reason that has
 * nothing to do with what it is asking. That is correct product behaviour, the LoreMaster
 * owns the board, and it makes the feed the wrong thing to leave running while measuring
 * local rendering. Pinned after boot; the specs that are ABOUT sync leave it alone. */
async function pinFeed(frame) {
  await frame.evaluate(() => { window.applyRemoteSnapshot = function () {};
    /* and the sheet in this frame, which is real and boots on its own clock. When it
       finishes it posts a hand of its own - inactive, empty - which replaces whatever a
       spec injected and empties the row, taking any note with it. Whether that lands
       before or after an assertion moves with machine load, which is what made it look
       like noise. Specs that drive the REAL sheet do not pin this; specs that inject a
       hand must. */
    window.ensureSheet = function () {};
    var _sf = document.getElementById("sheetFrame"); if (_sf) _sf.remove(); });
}

test.describe('S3b the card row draws the hand', () => {

  test('the row keeps out of the way until there is a fight', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    expect(await rowHidden(player), 'no fight, no row').toBe(true);

    await dealHand(player, 0);
    expect(await rowHidden(player), 'a fight, and the row is up').toBe(false);

    await player.evaluate(() => { window.S.mode = 'roleplay'; window.render(); });
    expect(await rowHidden(player), 'the fight ends and the row goes away').toBe(true);
  });

  test('the row belongs to the player, never the LoreMaster', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await dealHand(player, 0);
    expect(await rowHidden(player)).toBe(false);

    /* the LoreMaster has their own strip in this band; two would fight over it */
    await player.evaluate(() => { window.S.role = 'lm'; window.render(); });
    expect(await rowHidden(player), 'the LoreMaster gets no card row').toBe(true);
  });

  test('every Act and React the hand carries gets a card', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);
    await dealHand(player, 0);

    /* one group at a time since A3, so this is two looks rather than one */
    expect(await cardNames(player), 'the Acts').toEqual(['Basic attack', 'Razorwind', 'Worldspire', 'Any skill']);
    await player.evaluate(() => window.handSetTab('react'));
    expect(await cardNames(player), 'and the Reacts behind their tab').toEqual(['Move', 'Augury']);
  });

  test('F9 a locked act is on the row, greyed and priced, not missing', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);
    await dealHand(player, 0);

    const t3 = await cardByName(player, 'Worldspire');
    expect(t3, 'the tier 3 act is drawn at charge 0').toBeTruthy();
    expect(t3.locked, 'and it reads as locked').toBe(true);
    expect(t3.ariaDisabled, 'and says so to a screen reader').toBe('true');
    expect(t3.text, 'and names the charge that would buy it').toContain('Charge 3');

    const basic = await cardByName(player, 'Basic attack');
    expect(basic.locked, 'a tier 0 act is always in reach').toBe(false);
    expect(basic.text).not.toContain('Charge');
  });

  test('F9 a charge unlocks the card in place', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await dealHand(player, 0);
    expect((await cardByName(player, 'Razorwind')).locked).toBe(true);
    expect((await cardByName(player, 'Razorwind')).lit, 'no gems lit at charge 0').toBe(0);

    await dealHand(player, 1);
    const after = await cardByName(player, 'Razorwind');
    expect(after.locked, 'tier 1 is in reach at charge 1').toBe(false);
    expect(after.lit, 'and one gem is lit').toBe(1);
    expect((await cardByName(player, 'Worldspire')).locked, 'tier 3 still is not').toBe(true);

    /* the card did not move, it changed: the Acts are the same four either way */
    await player.evaluate(() => window.handSetTab('act'));
    expect(await cardNames(player)).toHaveLength(4);
  });

  test('F3 a spell says what it casts on, and a standard attack does not', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);
    await dealHand(player, 3);

    const spell = await cardByName(player, 'Razorwind');
    expect(spell.text, 'a charged magic ability names its skill and its contest')
      .toContain('Casts on Weaving vs Difficulty');

    const basic = await cardByName(player, 'Basic attack');
    expect(basic.text, 'a standard attack rolls the ordinary way and says nothing about casting')
      .not.toContain('Casts on');
  });

  test('an attack shows what it would do, against the right defence', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);
    await dealHand(player, 3);

    const basic = await cardByName(player, 'Basic attack');
    expect(basic.text).toContain('4');            /* base, straight to Vitality */
    expect(basic.text).toContain('3');            /* bonus, 7 total less 4 base */
    expect(basic.text, 'a magic weapon is blocked by Resistance').toContain('Resistance');
    expect(basic.text).not.toContain('Durability');

    const skill = await cardByName(player, 'Any skill');
    expect(skill.text, 'an act with no damage claims none').not.toContain('to Vitality');
  });

  test('a hand with nothing in it says so rather than drawing an empty row', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await player.evaluate(() => {
      window.S.role = 'player';
      window.S.mode = 'combat';
      window.tsHandTake({ charge: 0, acts: [], reacts: [], active: true });
      window.render();
    });

    expect(await rowHidden(player)).toBe(false);
    expect(await cardNames(player)).toHaveLength(0);
    const note = await player.evaluate(() => {
      const n = document.querySelector('#hand .hand-empty');
      return n ? n.textContent : null;
    });
    expect(note, 'and it explains itself').toContain('No Acts');
  });

  /* ---- choosing a card ---------------------------------------------------------- */

  test('tapping a card takes it up, tapping it again puts it down', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);
    await dealHand(player, 3);

    expect(await armedNames(player), 'nothing is held to begin with').toEqual([]);

    await tapCard(player, 'Razorwind');
    expect(await armedNames(player)).toEqual(['Razorwind']);
    expect((await cardByName(player, 'Razorwind')).ariaPressed, 'and says so to a screen reader').toBe('true');

    await tapCard(player, 'Razorwind');
    expect(await armedNames(player), 'the same card again puts it down').toEqual([]);
  });

  test('only one card is held at a time', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);
    await dealHand(player, 3);

    await tapCard(player, 'Razorwind');
    await tapCard(player, 'Basic attack');
    expect(await armedNames(player), 'the second card replaces the first').toEqual(['Basic attack']);

    /* a React is a different slot in the Beat but the same hand: you can still only be
       aiming one thing */
    await tapCard(player, 'Move');
    expect(await armedNames(player)).toEqual(['Move']);
  });

  test('F9 a locked card cannot be taken up', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);
    await dealHand(player, 0);

    await tapCard(player, 'Worldspire');
    expect(await armedNames(player), 'a charge away is still no').toEqual([]);

    await dealHand(player, 3);
    await tapCard(player, 'Worldspire');
    expect(await armedNames(player), 'and yes once the charge is there').toEqual(['Worldspire']);
  });

  test('an act that is a category asks which one before it is anything', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);
    await dealHand(player, 3);

    expect(await pickerLabel(player), 'nothing to choose until a card is held').toBe(null);

    await tapCard(player, 'Any skill');
    expect(await pickerLabel(player)).toBe('Which skill');
    /* the card names nothing while the list is open above it: one fact at a time, A19 */
    expect((await cardByName(player, 'Any skill')).text).not.toContain('Choose a skill');

    await tapOption(player, 'Guard');
    expect((await cardByName(player, 'Any skill')).text, 'the card carries the choice').toContain('Guard');
    expect(await armedNames(player), 'and is still the held card').toEqual(['Any skill']);
  });

  test('a plain act asks nothing', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);
    await dealHand(player, 3);

    await tapCard(player, 'Basic attack');
    expect(await pickerLabel(player), 'an attack is already the whole Act').toBe(null);
  });

  test('D1 the Beat allows one Act and one React, and the row says which are gone', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await player.evaluate((h) => {
      h.declared = true;
      window.S.role = 'player'; window.S.mode = 'combat';
      window.tsHandTake(h); window.render();
    }, handAt(3));

    const act = await cardByName(player, 'Basic attack');
    expect(act.text, 'the Act for this round is already spent').toContain('Act declared');
    await tapCard(player, 'Basic attack');
    expect(await armedNames(player), 'and cannot be taken up again').toEqual([]);

    /* the React is a separate allowance and is still there */
    const react = await cardByName(player, 'Move');
    expect(react.text).not.toContain('React spent');
    await tapCard(player, 'Move');
    expect(await armedNames(player)).toEqual(['Move']);
  });

  test('an affliction that forbids an Act bars the Act cards and says why', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await player.evaluate((h) => {
      h.gates = { noAct: true, noReact: false, notes: [{ name: 'Ensnared', rule: 'You may not utilize Acts.' }] };
      window.S.role = 'player'; window.S.mode = 'combat';
      window.tsHandTake(h); window.render();
    }, handAt(3));

    const act = await cardByName(player, 'Basic attack');
    expect(act.text, 'barred, and it is not a charge problem').toContain('No Act');
    expect(act.text).not.toContain('Charge');
    await tapCard(player, 'Basic attack');
    expect(await armedNames(player)).toEqual([]);

    await tapCard(player, 'Move');
    expect(await armedNames(player), 'the React is untouched by an Act gate').toEqual(['Move']);
  });

  test('a card put down by the round tick does not stay held', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await dealHand(player, 3);
    await tapCard(player, 'Worldspire');
    expect(await armedNames(player)).toEqual(['Worldspire']);

    /* the tier 3 act fires and the meter drops to nothing; what was held is out of
       reach now and must not still be held */
    await dealHand(player, 0);
    expect(await armedNames(player)).toEqual([]);
    expect((await cardByName(player, 'Worldspire')).locked).toBe(true);
  });

  test('a name carrying markup is drawn as text, not as markup', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await player.evaluate(() => {
      window.S.role = 'player';
      window.S.mode = 'combat';
      window.tsHandTake({ charge: 0, active: true, reacts: [],
        acts: [{ src: 'Wand', nm: '<img src=x onerror=alert(1)>', desc: 'x', dmg: 0, base: 0,
                 dt: null, tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false }] });
      window.render();
    });

    const injected = await player.evaluate(() => document.querySelectorAll('#hand img').length);
    expect(injected, 'a card name cannot smuggle an element onto the table').toBe(0);
    expect((await cardNames(player))[0]).toBe('<img src=x onerror=alert(1)>');
  });
});
