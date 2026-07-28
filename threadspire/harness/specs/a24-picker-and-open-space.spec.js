/* A24 — the row behaves the same on both sides of the table, and the ground has rules.
 *
 * Three things live play caught that the suite did not.
 *
 * ONE CARD OPEN. The LoreMaster's cards have always worked this way: the one being read
 * is open and the rest step back. The player's row lit every card equally, which makes
 * "open" mean nothing - a gold border among four gold-borderable cards is not a signal.
 *
 * THE DROP-UP MUST NOT COVER THE INSTRUCTION. The pill above the cards is the current
 * instruction - choose a skill, tap your target - and the skill list grew straight over
 * it. Twenty-four skills reach it today and a full pack of utilities will reach it next,
 * so what is guarded here is the RULE (the block yields to the pill and scrolls inside
 * what is left), not the skill case.
 *
 * OPEN SPACES, PER UTILITY. The FellGuide does not give one answer for the four placed
 * utilities. Darkshard is "set in an open space"; Caltrops "cover five adjacent spaces
 * from where they land"; a Rune or a Trap fires when a target "steps into the marked
 * space". Only the first asks for the square to be free, and the test that matters is the
 * one that proves the other three are still allowed to sit on an occupied one.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function playerOnly() {
  return {
    player: {
      role: 'player', campaignId: F.CAMPAIGN_A, characterId: F.FELL_CHAR_ID,
      character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A
    }
  };
}

const SKILLS = {};
['Guard', 'Might', 'Grace', 'Weaving', 'Spirit', 'Creation', 'Lore', 'Insight', 'Resolve',
 'Stealth', 'Survival', 'Craft', 'Medicine', 'Persuasion', 'Deceit', 'Intimidation',
 'Perception', 'Athletics', 'Acrobatics', 'Riding', 'Command', 'Empathy', 'Nature', 'Tinker']
  .forEach((n, i) => { SKILLS[n] = i % 5; });

const wep = (src, nm, desc) => ({
  src: src, nm: nm, desc: desc, dmg: 6, base: 3, dt: 'phys', tier: 0, kind: 'weapon',
  contest: 'evasion', castSkill: '', locked: false, bar: ''
});
const SKILL_ACT = {
  src: 'skills', nm: 'Use a skill', desc: 'All 24 skills may be attempted as an Act.',
  dmg: 0, base: 0, dt: null, tier: null, kind: 'standard', contest: 'evasion',
  castSkill: '', locked: false, bar: ''
};
const UTIL_ACT = {
  src: 'utility', nm: 'Use a utility', desc: 'Spend your Act on a utility you carry.',
  dmg: 0, base: 0, dt: null, tier: null, kind: 'standard', contest: 'evasion',
  castSkill: '', locked: false, bar: ''
};
/* as the sheet classifies them from the FellGuide - only Darkshard wants the space clear */
const PLACED = [
  { name: 'Darkshard', qty: 1, use: 'Act', roll: 'none', target: 'place', places: 1, space: 'empty' },
  { name: 'Caltrops',  qty: 1, use: 'Act', roll: 'none', target: 'place', places: 5, space: 'any'   },
  { name: 'Rune',      qty: 1, use: 'Act', roll: 'none', target: 'place', places: 1, space: 'any'   },
  { name: 'Trap',      qty: 1, use: 'Act', roll: 'none', target: 'place', places: 1, space: 'any'   }
];

async function seat(frame, opts) {
  const o = opts || {};
  await frame.evaluate(() => {
    window.applyRemoteSnapshot = function () {};
    window.ensureSheet = function () {};
    var _sf = document.getElementById('sheetFrame'); if (_sf) _sf.remove();
  });
  await frame.evaluate(({ acts, items, skills, tokens, myCharId }) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = tokens;
    window.__sent = [];
    window.sheet.postMessage = function (m) {
      if (!m || m.type !== 'ts-declare') return;
      window.__sent.push(m);
      window.handDeclareResult({ ok: true, round: m.round });
    };
    window.tsHandTake({
      charge: 2, acts: acts, reacts: [], skills: skills, items: items, stances: [],
      gates: { noAct: false, noReact: false, notes: [] },
      active: true, round: 1, phase: 'commit',
      fighters: [{ key: 'm:cb-erasure', name: 'The Erasure', side: 'monster', charId: '' }]
    });
    window.renderTokens(); window.render();
  }, {
    acts: o.acts || [wep('Ashen Blade', 'Basic attack', 'A plain swing.')],
    items: o.items || [],
    skills: o.skills || {},
    /* the centre of a square, not the corner where four of them meet: t.x is where the
       token IS, and a token sitting on an intersection occupies none of them fully */
    tokens: o.tokens || [{ id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 450, y: 450, cells: 1 }],
    myCharId: F.FELL_CHAR_ID
  });
}

const cards = (frame) => frame.evaluate(() =>
  [...document.querySelectorAll('#hand .hcard')].map((c) => ({
    name: (c.querySelector('.hc-line') || {}).textContent || '',
    armed: c.classList.contains('armed'),
    resting: c.classList.contains('resting'),
    opacity: Number(getComputedStyle(c).opacity),
    open: !!c.querySelector('.hc-desc')
  })));
const takeUp = (frame, name) => frame.evaluate((n) => {
  window.handArm('Use a utility', 'act');
  document.querySelector('#hand .hand-pick .hp-opt[data-val="' + n + '"]').click();
}, name);
const placeAt = (frame, x, y) => frame.evaluate(({ px, py }) => window.handPlaceAt(px, py), { px: x, py: y });
/* Where the squares are, wherever they have got to. A one-square utility COMMITS on the
   tap - that is A23's rule, and it is the same rule as the last tap on a target - so by
   the time this asks, the card is down and the squares have travelled with the
   declaration. Reading armed.places alone would report "nothing was laid" for every
   utility that worked. */
const placed = (frame) => frame.evaluate(() => {
  if (window.armed && window.armed.places && window.armed.places.length) return window.armed.places.slice();
  var out = window.__sent || [];
  var last = out[out.length - 1];
  return (last && last.places) ? last.places.slice() : [];
});
const note = (frame) => frame.evaluate(() => {
  var n = document.querySelector('#hand .hand-note');
  return n ? n.textContent : '';
});

test.describe('A24 one card open, the rest at rest', () => {

  test('taking a card up sets the others back', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [
      wep('Ashen Blade', 'Basic attack', 'A plain swing.'),
      wep('Ashen Blade', 'Riposte', 'Answer a miss.'),
      wep('Hollow Bow', 'Loose', 'At range.')
    ] });

    const before = await cards(player);
    expect(before, 'three cards, none of them holding anything back yet').toHaveLength(3);
    expect(before.some((c) => c.resting), 'nothing is at rest until something is held').toBe(false);

    await player.evaluate(() => window.handArm('Riposte', 'act'));
    const after = await cards(player);
    const open = after.filter((c) => c.armed);
    const rest = after.filter((c) => c.resting);

    expect(open, 'exactly one card is the one being read').toHaveLength(1);
    expect(rest, 'and the other two step back').toHaveLength(2);
    expect(open[0].name).toContain('Riposte');
    /* the point of the whole change: dimmed, not merely un-gold */
    rest.forEach((c) => expect(c.opacity, 'a resting card is visibly quieter').toBeLessThan(0.8));
    expect(open[0].opacity, 'and the held one is at full strength').toBe(1);
  });

  test('only the held card is open; the rest are one line', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [
      wep('Ashen Blade', 'Basic attack', 'A plain swing.'),
      wep('Ashen Blade', 'Riposte', 'Answer a miss.'),
      wep('Hollow Bow', 'Loose', 'At range.')
    ] });
    await player.evaluate(() => window.handArm('Riposte', 'act'));

    const c = await cards(player);
    expect(c.filter((x) => x.open), 'one open card, not three').toHaveLength(1);
    expect(c.find((x) => x.open).name).toContain('Riposte');
  });

  test('moving to another card moves what is open', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [
      wep('Ashen Blade', 'Basic attack', 'A plain swing.'),
      wep('Ashen Blade', 'Riposte', 'Answer a miss.'),
      wep('Hollow Bow', 'Loose', 'At range.')
    ] });

    await player.evaluate(() => window.handArm('Riposte', 'act'));
    await player.evaluate(() => window.handArm('Loose', 'act'));
    const c = await cards(player);
    const open = c.filter((x) => x.armed);
    expect(open, 'still exactly one').toHaveLength(1);
    expect(open[0].name).toContain('Loose');
    expect(c.filter((x) => x.resting), 'and the other two, including the one just put down').toHaveLength(2);
  });

  test('putting the card down brings the row back up', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [
      wep('Ashen Blade', 'Basic attack', 'A plain swing.'),
      wep('Ashen Blade', 'Riposte', 'Answer a miss.')
    ] });

    await player.evaluate(() => window.handArm('Riposte', 'act'));
    expect((await cards(player)).some((c) => c.resting)).toBe(true);
    await player.evaluate(() => window.handDisarm());
    expect((await cards(player)).some((c) => c.resting),
      'nothing is being read, so nothing is being held back').toBe(false);
  });
});

test.describe('A24 the drop-up does not cover the instruction', () => {

  /* the pill and the block, in one measurement, so a regression cannot pass by moving
     one of them */
  const geom = (frame) => frame.evaluate(() => {
    var pk = document.querySelector('#hand .hand-pick');
    var say = document.querySelector('#hand .hand-send');
    if (!pk || !say) return null;
    var a = pk.getBoundingClientRect(), b = say.getBoundingClientRect();
    var list = pk.querySelector('.hp-list');
    return {
      overlaps: a.top < b.bottom && a.bottom > b.top,
      offTop: a.top < 0,
      pillVisible: b.height > 0 && b.top >= 0 && b.bottom <= window.innerHeight,
      opts: pk.querySelectorAll('.hp-opt').length,
      fits: !list || list.scrollHeight <= list.clientHeight + 1,
      reachable: !list || list.clientHeight > 0
    };
  });

  test('twenty-four skills do not grow over the pill', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [wep('Ashen Blade', 'Basic attack', 'A plain swing.'), SKILL_ACT],
                         skills: SKILLS });

    await player.evaluate(() => window.handArm('Use a skill', 'act'));
    const g = await geom(player);
    expect(g.opts, 'the whole skill list is on show').toBe(24);
    expect(g.overlaps, 'the block must not sit over the current instruction').toBe(false);
    expect(g.pillVisible, 'and the instruction is still on the table to be read').toBe(true);
  });

  test('and do not run off the top of the table either', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [wep('Ashen Blade', 'Basic attack', 'A plain swing.'), SKILL_ACT],
                         skills: SKILLS });

    await player.evaluate(() => window.handArm('Use a skill', 'act'));
    const g = await geom(player);
    expect(g.offTop, 'clearing the pill by leaving the screen is not clearing the pill').toBe(false);
    expect(g.reachable, 'and what is left is big enough to choose from').toBe(true);
  });

  /* the rule, not the skill case: the same guard against a pack long enough to reach */
  test('a long utility list obeys the same rule', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    const many = [];
    for (let i = 0; i < 18; i++) {
      many.push({ name: 'Tonic ' + (i + 1), qty: 1, use: 'Act', roll: 'none', target: 'any' });
    }
    await seat(player, { acts: [UTIL_ACT], items: many });

    await player.evaluate(() => window.handArm('Use a utility', 'act'));
    const g = await geom(player);
    expect(g.opts, 'eighteen utilities is a list long enough to reach the pill').toBe(18);
    expect(g.overlaps, 'and it yields exactly as the skill list does').toBe(false);
    expect(g.offTop).toBe(false);
  });

  test('a short list is not pushed around by a rule it never trips', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [UTIL_ACT], items: [
      { name: 'Ash Salt', qty: 1, use: 'Act', roll: 'none', target: 'any' },
      { name: 'Potion', qty: 2, use: 'Act', roll: 'auto', target: 'any' }
    ] });

    await player.evaluate(() => window.handArm('Use a utility', 'act'));
    const g = await geom(player);
    expect(g.opts).toBe(2);
    expect(g.overlaps).toBe(false);
    expect(g.fits, 'two utilities have no business scrolling').toBe(true);
  });
});

test.describe('A24 the pill names the step that is next', () => {

  const hint = (frame) => frame.evaluate(() => {
    var h = document.querySelector('#hand .hs-hint');
    return h ? h.textContent : '';
  });

  test('a placed utility asks for spaces, not for a target', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [UTIL_ACT], items: PLACED });

    await takeUp(player, 'Caltrops');
    expect(await hint(player), 'there is nobody to tap; there is ground to choose')
      .toMatch(/5 spaces/i);
    await placeAt(player, 1250, 750);
    expect(await hint(player), 'and it counts down as they go').toMatch(/4 spaces/i);
  });

  test('one square asks for one space', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [UTIL_ACT], items: PLACED });

    await takeUp(player, 'Rune');
    expect(await hint(player)).toBe('Choose a space');
  });

  test('a utility with a target still asks for the target', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [UTIL_ACT], items: [
      { name: 'Ash Salt', qty: 1, use: 'Act', roll: 'none', target: 'any' }
    ] });

    await takeUp(player, 'Ash Salt');
    expect(await hint(player)).toBe('Tap your target');
  });

  test('and a weapon is unchanged', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await player.evaluate(() => window.handArm('Basic attack', 'act'));
    expect(await hint(player)).toBe('Tap your target');
  });
});

test.describe('A24 an open space, where the book asks for one', () => {

  const OCCUPIED = { x: 450, y: 450 };     /* the centre of the square the foe stands in */
  const EMPTY = { x: 1250, y: 750 };

  test('Darkshard refuses an occupied square, and says why', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [UTIL_ACT], items: PLACED });
    await takeUp(player, 'Darkshard');

    expect(await placeAt(player, 420, 430), 'the tap is answered, not ignored').toBe(true);
    expect(await placed(player), 'and nothing was laid').toHaveLength(0);
    expect(await note(player), 'the player is told the rule, not left guessing').toMatch(/open space/i);
    expect(await player.evaluate(() => window.__sent), 'nothing declared').toHaveLength(0);
  });

  test('Darkshard takes a clear one', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [UTIL_ACT], items: PLACED });
    await takeUp(player, 'Darkshard');

    await placeAt(player, 1200, 700);
    const out = await player.evaluate(() => window.__sent);
    expect(out, 'one square, and it commits').toHaveLength(1);
    expect(out[0].places).toEqual([EMPTY]);
  });

  /* the half of the rule that is easy to get wrong by making it a blanket one */
  for (const nm of ['Caltrops', 'Rune', 'Trap']) {
    test(nm + ' may be laid where somebody is standing', async ({ page }) => {
      await T.openTable(page, playerOnly());
      const player = await T.frameFor(page, 'player');
      await T.waitBooted(page, player, 'player');
      await seat(player, { acts: [UTIL_ACT], items: PLACED });
      await takeUp(player, nm);

      expect(await placeAt(player, 420, 430)).toBe(true);
      const on = await placed(player);
      expect(on, 'the book does not ask this one for a clear space').toHaveLength(1);
      expect(on[0]).toEqual(OCCUPIED);
      expect(await note(player), 'and nothing was refused').not.toMatch(/open space/i);
    });
  }

  test('a big foe holds every square it covers', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, {
      acts: [UTIL_ACT], items: PLACED,
      /* a 2-cell token centred on a grid line covers the four squares around it */
      tokens: [{ id: 'tkBig', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 500, y: 500, cells: 2 }]
    });
    await takeUp(player, 'Darkshard');

    /* not the centre square - a corner of the footprint, which a centre-only check misses */
    await placeAt(player, 420, 420);
    expect(await placed(player), 'its own corner is still underneath it').toHaveLength(0);
    await placeAt(player, 570, 570);
    expect(await placed(player), 'and so is the far corner').toHaveLength(0);
    await placeAt(player, 720, 420);
    expect(await placed(player), 'the square beside the footprint is free').toHaveLength(1);
  });

  test('Darkshard will not take the same square twice', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    /* a two-square Darkshard is not the book's, but it is the only way to reach the
       "your own" branch, and the branch is real for any placed utility that wants more
       than one clear space */
    await seat(player, { acts: [UTIL_ACT], items: [
      { name: 'Darkshard', qty: 1, use: 'Act', roll: 'none', target: 'place', places: 2, space: 'empty' }
    ] });
    await takeUp(player, 'Darkshard');

    await placeAt(player, 1200, 700);
    await placeAt(player, 1210, 710);
    expect(await placed(player), 'one square, one shard').toHaveLength(1);
  });

  test('an unclassified utility is not refused on a guess', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, { acts: [UTIL_ACT], items: [
      /* no space field at all - something nobody has read yet */
      { name: 'Oddment', qty: 1, use: 'Act', roll: 'none', target: 'place', places: 1 }
    ] });
    await takeUp(player, 'Oddment');

    await placeAt(player, 420, 430);
    expect(await placed(player),
      'the default is permissive: the LoreMaster refuses it, not the tool').toHaveLength(1);
  });
});
