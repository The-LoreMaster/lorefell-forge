/* A13 — where the row sits, and what it never covers.
 *
 * Three complaints from live play, all about the same band of table:
 *
 *   the Acts tab stood over empty air rather than over the first card
 *   a short hand hugged the left instead of sitting in the middle of the space it had
 *   the row rested with a card cut off half way through
 *
 * The band the cards get is the table minus the dice tray on the left and the More
 * Options pill and the Fellmark gem on the right. Those clearances come from shared CSS
 * variables so the row and the pill cannot disagree about where the pill is. What this
 * spec holds is that the row respects them, centres inside them when it can, and lines
 * its tab up with its cards either way.
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
const acts = (n) => {
  const out = [];
  for (let i = 1; i <= n; i++) {
    out.push({ src: 'Ashen Blade', nm: 'Strike ' + i, desc: 'standard strike', dmg: 6, base: 3,
      dt: 'phys', tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false });
  }
  return out;
};

async function seat(frame, n) {
  await frame.evaluate(() => { window.applyRemoteSnapshot = function () {};
    /* and the sheet in this frame, which is real and boots on its own clock. When it
       finishes it posts a hand of its own - inactive, empty - which replaces whatever a
       spec injected and empties the row, taking any note with it. Whether that lands
       before or after an assertion moves with machine load, which is what made it look
       like noise. Specs that drive the REAL sheet do not pin this; specs that inject a
       hand must. */
    window.ensureSheet = function () {};
    var _sf = document.getElementById("sheetFrame"); if (_sf) _sf.remove(); });
  await frame.evaluate(({ a, fighters, myCharId }) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [{ id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 400, y: 400, cells: 1 }];
    window.sheet.postMessage = function () {};
    window.tsHandTake({ charge: 1, acts: a, reacts: [], skills: { Guard: 3 }, items: [], stances: [],
                        gates: { noAct: false, noReact: false, notes: [] },
                        active: true, round: 1, phase: 'commit', fighters: fighters });
    window.renderTokens(); window.render();
  }, { a: acts(n), fighters: FIGHTERS, myCharId: F.FELL_CHAR_ID });
}

const layout = (frame) => frame.evaluate(() => {
  const el = document.getElementById('hand');
  const sc = el.querySelector('.hand-scroll');
  const cards = Array.from(sc.querySelectorAll('.hcard'));
  const r = (n) => { const b = n.getBoundingClientRect(); return { l: b.left, r: b.right, w: b.width }; };
  const pill = document.getElementById('moreOpt');
  return {
    /* absent whenever there is only one group to show, which is most of the time now */
    tabs: el.querySelector('.hand-tabs') ? r(el.querySelector('.hand-tabs')) : null,
    band: r(sc),
    first: r(cards[0]),
    last: r(cards[cards.length - 1]),
    cards: cards.map(r),
    pill: pill && !pill.classList.contains('hidden') ? r(pill) : null,
    fits: sc.scrollWidth <= sc.clientWidth + 1,
    scrollLeft: sc.scrollLeft,
    max: sc.scrollWidth - sc.clientWidth,
    leftGone: el.querySelector('.hand-pager.left').classList.contains('gone'),
    rightGone: el.querySelector('.hand-pager.right').classList.contains('gone')
  };
});

/* resolving, so there are two groups and therefore a tab row */
async function seatResolving(frame, n) {
  await frame.evaluate(() => {
    window.applyRemoteSnapshot = function () {};
    window.ensureSheet = function () {};
    var _sf = document.getElementById('sheetFrame'); if (_sf) _sf.remove();
  });
  await frame.evaluate(({ a, fighters, myCharId }) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [];
    window.sheet.postMessage = function () {};
    window.tsHandTake({ charge: 1, acts: a, skills: {}, items: [], stances: [],
                        reacts: [{ src: 'movement', nm: 'Move', desc: 'a react', tier: null,
                                   kind: 'standard', locked: false }],
                        gates: { noAct: false, noReact: false, notes: [] },
                        active: true, round: 1, phase: 'resolve', fighters: fighters });
    window.render();
  }, { a: acts(n), fighters: FIGHTERS, myCharId: F.FELL_CHAR_ID });
}

test.describe('A13 the row sits where it should', () => {

  /* The Acts label is gone: with one group there is nothing to choose between and the
     label sat where the first card wanted to be. The tab row comes back during resolution,
     when there are two groups, and THEN it has to stand over the cards rather than over
     the air beside them - which is what handTabsAlign is for. */
  test('with one group there is no tab row at all', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 2);

    expect(await player.evaluate(() =>
      document.querySelectorAll('#hand .hand-tab').length), 'nothing to label').toBe(0);
  });

  test('and when the tabs return, they stand over the first card', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seatResolving(player, 12);

    const g = await layout(player);
    expect(g.tabs, 'the row is there to align to').not.toBeNull();
    expect(Math.abs(g.tabs.l - g.first.l), 'over the cards, not the air beside them')
      .toBeLessThanOrEqual(1);
  });

  test('a hand that fits sits in the middle of the space it has', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 2);

    const g = await layout(player);
    const cardsMid = (g.first.l + g.last.r) / 2;
    const bandMid = (g.band.l + g.band.r) / 2;
    expect(Math.abs(cardsMid - bandMid), 'centred between its two clearances')
      .toBeLessThanOrEqual(2);
  });

  test('a hand that does not fit starts at the beginning, reachable', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 12);

    const g = await layout(player);
    /* the trap centring an overflowing row would spring: the first card pushed off the
       left-hand end where no amount of scrolling reaches it */
    expect(g.first.l, 'the first card is on the table').toBeGreaterThanOrEqual(g.band.l - 1);
    expect(g.leftGone, 'and the row is at its beginning, so no arrow back').toBe(true);
  });

  test('the row rests with a whole card against its edge, never half of one', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 12);

    /* scrolled to somewhere deliberately between two cards */
    await player.evaluate(() => {
      const sc = document.querySelector('#hand .hand-scroll');
      sc.scrollLeft = 213;
    });
    await page.waitForTimeout(250);          /* the snap is not instantaneous */

    const g = await layout(player);
    const off = Math.min.apply(null, g.cards.map((c) => Math.abs(c.l - g.band.l)));
    expect(off, 'some card is flush with the left edge of the row').toBeLessThanOrEqual(3);
  });

  test('paging lands on a card boundary, not part way through one', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 12);

    await player.evaluate(() => window.handPage(1));
    await page.waitForTimeout(250);

    const g = await layout(player);
    expect(g.scrollLeft, 'it moved').toBeGreaterThan(0);
    const off = Math.min.apply(null, g.cards.map((c) => Math.abs(c.l - g.band.l)));
    expect(off).toBeLessThanOrEqual(3);
  });

  test('no arrow back when there is nothing behind you', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 12);

    let g = await layout(player);
    expect(g.leftGone, 'at the start').toBe(true);
    expect(g.rightGone, 'and there is more to the right').toBe(false);

    await player.evaluate(() => {
      const sc = document.querySelector('#hand .hand-scroll');
      sc.scrollLeft = sc.scrollWidth;
      sc.dispatchEvent(new Event('scroll'));
    });
    g = await layout(player);
    expect(g.rightGone, 'and none forward at the end').toBe(true);
    expect(g.leftGone).toBe(false);
  });

  test('a hand short enough to fit needs no arrows at all', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 2);

    const g = await layout(player);
    expect(g.leftGone).toBe(true);
    expect(g.rightGone).toBe(true);
  });
});
