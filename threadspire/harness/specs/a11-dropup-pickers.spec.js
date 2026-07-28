/* A11 — the skill and utility pickers open out of their own card.
 *
 * What this replaces: a band the full width of the table, two rows deep, floating above
 * the row with nothing tying it to the card that asked for it. Twenty-four skills laid
 * out across a metre of table is a list to read rather than a choice to make, and at that
 * width it ran out past the sheet rail and off the table.
 *
 * So: a small block, opening upward out of the card, no wider than a couple of cards, and
 * never outside the band the cards themselves are allowed to use. It has to follow the
 * card, which means following the scroll, which is why it is placed in script.
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

const FIGHTERS = [{ key: 'm:cb-erasure', name: 'The Erasure', side: 'monster', charId: '' }];
/* all 24, because the picker's whole problem was what it did with a long list */
const SKILLS = {};
['Guard', 'Might', 'Grace', 'Weaving', 'Spirit', 'Creation', 'Lore', 'Insight', 'Resolve',
 'Stealth', 'Survival', 'Craft', 'Medicine', 'Persuasion', 'Deceit', 'Intimidation',
 'Perception', 'Athletics', 'Acrobatics', 'Riding', 'Command', 'Empathy', 'Nature', 'Tinker']
  .forEach((n, i) => { SKILLS[n] = i % 5; });

const weapon = (nm) => ({ src: 'Ashen Blade', nm: nm, desc: 'standard strike', dmg: 6, base: 3,
  dt: 'phys', tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false });
const ACTS = [
  weapon('Basic attack'), weapon('Rend'), weapon('Cleave'), weapon('Sunder'), weapon('Riposte'),
  { src: 'skills', nm: 'Any skill', desc: 'All 24 skills may be attempted as an Act.', dmg: 0,
    base: 0, dt: null, tier: null, kind: 'standard', contest: 'evasion', castSkill: '', locked: false },
  { src: 'utility', nm: 'Use a utility', desc: 'Spend your Act on a utility you carry.', dmg: 0,
    base: 0, dt: null, tier: null, kind: 'standard', contest: 'evasion', castSkill: '', locked: false }
];

async function seat(frame) {
  await frame.evaluate(() => { window.applyRemoteSnapshot = function () {};
    /* and the sheet in this frame, which is real and boots on its own clock. When it
       finishes it posts a hand of its own - inactive, empty - which replaces whatever a
       spec injected and empties the row, taking any note with it. Whether that lands
       before or after an assertion moves with machine load, which is what made it look
       like noise. Specs that drive the REAL sheet do not pin this; specs that inject a
       hand must. */
    window.ensureSheet = function () {};
    var _sf = document.getElementById("sheetFrame"); if (_sf) _sf.remove(); });
  await frame.evaluate(({ acts, skills, fighters, myCharId }) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [{ id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 400, y: 400, cells: 1 }];
    window.sheet.postMessage = function () {};
    window.tsHandTake({ charge: 3, acts: acts, reacts: [], skills: skills,
                        items: [{ name: 'Vial of Ash', qty: 2 }, { name: 'Rope', qty: 1 }],
                        stances: [], gates: { noAct: false, noReact: false, notes: [] },
                        active: true, round: 1, phase: 'commit', fighters: fighters });
    window.renderTokens(); window.render();
  }, { acts: ACTS, skills: SKILLS, fighters: FIGHTERS, myCharId: F.FELL_CHAR_ID });
}

const arm = (frame, nm) => frame.evaluate((n) => window.handArm(n, 'act'), nm);
/* where the drop-up is, against the card it belongs to and the band it must stay inside */
const geom = (frame) => frame.evaluate(() => {
  const el = document.getElementById('hand');
  const pk = el.querySelector('.hand-pick');
  if (!pk) return null;
  const card = el.querySelector('.hcard.armed');
  const sc = el.querySelector('.hand-scroll');
  const r = (n) => { const b = n.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; };
  const list = pk.querySelector('.hp-list');
  return {
    pick: r(pk), card: r(card), band: r(sc),
    opts: pk.querySelectorAll('.hp-opt').length,
    tail: pk.style.getPropertyValue('--pick-tail'),
    tailPx: parseFloat(pk.style.getPropertyValue('--pick-tail')) || 0,
    listScrolls: list ? list.scrollHeight > list.clientHeight + 1 : null,
    sideways: list ? list.scrollWidth > list.clientWidth + 1 : null,
    viewport: window.innerWidth
  };
});

test.describe('A11 the pickers drop up out of the card', () => {

  test('the skill picker is a block over its card, not a band across the table', async ({ page }) => {
    /* wide enough that the row has room to spare, which is where the old full-width band
       was at its worst and where a block has to prove it does not spread to fill */
    await page.setViewportSize({ width: 1800, height: 1000 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Any skill');

    const g = await geom(player);
    expect(g.opts, 'every skill is still offered').toBe(24);
    expect(g.pick.w, 'a couple of cards wide at most').toBeLessThanOrEqual(340);
    expect(g.band.w, 'the row has width to spare here').toBeGreaterThan(340);
    expect(g.pick.w, 'and the block does not take it just because it is there')
      .toBeLessThan(g.band.w);
  });

  test('on a narrow table it gives up width rather than the edge', async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 900 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Any skill');

    const g = await geom(player);
    expect(g.pick.w, 'never wider than the cards themselves are allowed to be')
      .toBeLessThanOrEqual(g.band.w + 1);
    expect(g.pick.l).toBeGreaterThanOrEqual(g.band.l - 1);
    expect(g.pick.r).toBeLessThanOrEqual(g.band.r + 1);
    expect(g.opts, 'and still offers all of them, scrolling if it must').toBe(24);
  });

  test('it opens upward, clear of the card', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Any skill');

    const g = await geom(player);
    expect(g.pick.b, 'its bottom edge sits above the card top').toBeLessThanOrEqual(g.card.t);
    expect(g.card.t - g.pick.b, 'and close enough to belong to it').toBeLessThan(20);
  });

  test('it sits over the card that asked for it', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Any skill');

    const g = await geom(player);
    const cardMid = g.card.l + g.card.w / 2;
    expect(cardMid, 'the card centre falls within the block').toBeGreaterThanOrEqual(g.pick.l);
    expect(cardMid).toBeLessThanOrEqual(g.pick.r);
    expect(g.tail, 'and the notch points at it').toMatch(/^\d+px$/);
  });

  test('it stays inside the band the cards use, at either end', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    /* the last card, which is where a block centred on it would run off the right */
    await arm(player, 'Use a utility');
    let g = await geom(player);
    expect(g.pick.l, 'not into the dice tray').toBeGreaterThanOrEqual(g.band.l - 1);
    expect(g.pick.r, 'not under the sheet rail').toBeLessThanOrEqual(g.band.r + 1);

    /* the first card, the other end */
    await arm(player, 'Any skill');
    await arm(player, 'Basic attack');
    await arm(player, 'Any skill');
    g = await geom(player);
    expect(g.pick.l).toBeGreaterThanOrEqual(g.band.l - 1);
    expect(g.pick.r).toBeLessThanOrEqual(g.band.r + 1);
  });

  test('it follows the card when the row is scrolled', async ({ page }) => {
    /* wide, so the block is narrower than the band and has somewhere to move to; on a
       narrow table it fills the band and staying put is the correct answer */
    await page.setViewportSize({ width: 1800, height: 1000 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Any skill');

    const scrollTo = (x) => player.evaluate((v) => {
      const sc = document.querySelector('#hand .hand-scroll');
      sc.scrollLeft = v < 0 ? sc.scrollWidth : v;
      sc.dispatchEvent(new Event('scroll'));
      return sc.scrollLeft;
    }, x);

    /* The notch is the thing that says which card this belongs to, so that is what has to
       follow: its point should land on the card's centre wherever the row is scrolled to.
       A band that merely covered the card would pass a containment check and fail this. */
    const onTheCard = (g) => Math.abs((g.pick.l + g.tailPx) - (g.card.l + g.card.w / 2));

    const end = await scrollTo(-1);           /* Any skill is near the right-hand end */
    expect(end, 'the row scrolls at all').toBeGreaterThan(0);
    let g = await geom(player);
    expect(g.card.r, 'the card is in view here').toBeLessThanOrEqual(g.band.r + 1);
    expect(onTheCard(g), 'so the notch is on it').toBeLessThanOrEqual(2);

    /* and scrolled right away from it, where there is nothing to point at: the block does
       not chase the card off the table, it stays in the band with the notch turned the way
       the card went */
    await scrollTo(0);
    g = await geom(player);
    expect(g.card.l, 'the card is now off to the right').toBeGreaterThan(g.band.r);
    expect(g.pick.l).toBeGreaterThanOrEqual(g.band.l - 1);
    expect(g.pick.r).toBeLessThanOrEqual(g.band.r + 1);
    expect(g.tailPx, 'the notch leans after it').toBeGreaterThan(g.pick.w / 2);
  });

  test('a long list scrolls, and never sideways', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Any skill');

    expect((await geom(player)).sideways, 'the options wrap, they do not run off the end').toBe(false);
  });

  test('a list that fits does not pretend it scrolls', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    /* two utilities. The notch used to count as overflow and raise a scrollbar over a
       list with four items in it. */
    await arm(player, 'Use a utility');
    const g = await geom(player);
    expect(g.opts).toBe(2);
    expect(g.listScrolls, 'nothing is hidden, so nothing suggests it is').toBe(false);
  });

  /* "Items" was the tool's word for them; the sheet's own section has called them
     Utilities all along, and so does the table now. The wire still says item, which is
     fine - the player never reads the wire. */
  test('the row says utility, never item', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Use a utility');

    const words = await player.evaluate(() => {
      const el = document.getElementById('hand');
      const t = (s) => { const n = el.querySelector(s); return n ? n.textContent : ''; };
      return {
        label: t('.hand-pick .hp-lab'),
        hint: t('.hs-hint'),
        card: t('.hcard.armed .hc-pick'),
        kicker: t('.hcard.armed .hc-kick')
      };
    });
    expect(words.label).toBe('Which utility');
    expect(words.hint).toContain('utility');
    expect(words.card).toContain('utility');
    expect(words.kicker, 'including the word on the card itself').toContain('Utility');
    Object.keys(words).forEach((k) => {
      expect(words[k].toLowerCase(), k + ' still says item').not.toContain('item');
    });
  });

  test('choosing from it still arms the card with the choice', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);
    await arm(player, 'Any skill');

    await player.evaluate(() => {
      document.querySelector('#hand .hand-pick .hp-opt[data-val="Perception"]').click();
    });

    expect(await player.evaluate(() => window.armed.skill)).toBe('Perception');
    const card = await player.evaluate(() =>
      document.querySelector('#hand .hcard.armed').textContent.replace(/\s+/g, ' '));
    expect(card, 'and the card wears the choice').toContain('Perception');
  });
});
