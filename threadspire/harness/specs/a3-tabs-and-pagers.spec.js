/* A3 — the row as Option A: tabs above it, arrows only when they do something.
 *
 * Matches the shared prototype's layout. Two behaviours carry the weight:
 *
 *   TABS. Acts and Reacts are separate groups and only one shows. Both at once is what
 *   made the row long enough to need paging in the first place, and it buried the Reacts
 *   off the right-hand end where nobody looked for them.
 *
 *   CONDITIONAL PAGERS. An arrow is drawn only when it would do something. Left is absent
 *   until you have paged right of the first card; right is absent unless cards run past
 *   the visible edge. Both recompute as the player pages and as the hand changes, since a
 *   spent charge can add or remove a card and change the answer.
 *
 * Frame widths, not page widths: the harness gives each frame half the page.
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

function hand(nActs, nReacts) {
  const mk = (p, i) => ({ src: 'Blade', nm: p + ' ' + (i + 1), desc: 'a card', dmg: 4, base: 2,
                          dt: 'phys', tier: 0, kind: 'weapon', contest: 'evasion',
                          castSkill: '', locked: false });
  return {
    charge: 3,
    acts: Array.from({ length: nActs }, (_, i) => mk('Act', i)),
    reacts: Array.from({ length: nReacts }, (_, i) => mk('React', i)),
    skills: {}, items: [], stances: [],
    gates: { noAct: false, noReact: false, notes: [] },
    active: true, round: 1, phase: 'commit', fighters: []
  };
}

async function deal(frame, h) {
  await frame.evaluate((x) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.tsHandTake(x); window.render();
  }, h);
}

const names = (frame) => frame.evaluate(() =>
  Array.from(document.querySelectorAll('#hand .hcard')).map((c) => c.getAttribute('data-act')));

const pagers = (frame) => frame.evaluate(() => {
  const g = (s) => { const e = document.querySelector('#hand .hand-pager.' + s); return e ? !e.classList.contains('gone') : null; };
  return { left: g('left'), right: g('right') };
});

const tabs = (frame) => frame.evaluate(() =>
  Array.from(document.querySelectorAll('#hand .hand-tab')).map((t) => ({
    tab: t.getAttribute('data-tab'), on: t.classList.contains('on'), text: t.textContent })));

const clickTab = (frame, t) => frame.evaluate((x) =>
  document.querySelector('#hand .hand-tab[data-tab="' + x + '"]').click(), t);

const clickPager = (frame, s) => frame.evaluate((x) =>
  document.querySelector('#hand .hand-pager.' + x).click(), s);

/* Wide enough that the frame is a desktop layout. */
async function wide(page) { await page.setViewportSize({ width: 1900, height: 860 }); }
/* Narrow enough that a handful of cards overflow. */
async function narrow(page) { await page.setViewportSize({ width: 1500, height: 860 }); }

test.describe('A3 tabs and conditional pagers', () => {

  test('the row shows one group at a time', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await wide(page);
    await deal(player, hand(3, 2));

    const shown = await names(player);
    expect(shown, 'Acts to begin with').toEqual(['Act 1', 'Act 2', 'Act 3']);
    expect(shown.some((n) => n.startsWith('React')), 'and no Reacts mixed in').toBe(false);
  });

  test('tapping Reacts switches the row to them', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await wide(page);
    await deal(player, hand(3, 2));

    await clickTab(player, 'react');
    expect(await names(player)).toEqual(['React 1', 'React 2']);

    const t = await tabs(player);
    expect(t.find((x) => x.tab === 'react').on, 'and the tab reads as the live one').toBe(true);
    expect(t.find((x) => x.tab === 'act').on).toBe(false);

    await clickTab(player, 'act');
    expect(await names(player)).toEqual(['Act 1', 'Act 2', 'Act 3']);
  });

  test('each tab says how many are behind it', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await wide(page);
    await deal(player, hand(5, 2));

    const t = await tabs(player);
    expect(t.find((x) => x.tab === 'act').text).toContain('5');
    expect(t.find((x) => x.tab === 'react').text).toContain('2');
  });

  test('the chosen tab survives a new hand arriving', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await wide(page);
    await deal(player, hand(3, 2));

    await clickTab(player, 'react');
    /* a charge lands and the sheet sends a fresh hand: the player should not be thrown
       back to the Acts mid-decision */
    await deal(player, hand(4, 2));
    expect((await names(player))[0]).toBe('React 1');
  });

  /* ---- the arrows ------------------------------------------------------------------ */

  test('with a short hand there are no arrows at all', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await wide(page);
    await deal(player, hand(2, 1));

    expect(await pagers(player), 'nothing off either edge, so nothing to press').toEqual({ left: false, right: false });
  });

  test('a long hand shows the right arrow only, until it is paged', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await narrow(page);
    await deal(player, hand(14, 1));

    expect(await pagers(player), 'more to the right, nothing to the left yet').toEqual({ left: false, right: true });

    await clickPager(player, 'right');
    const mid = await pagers(player);
    expect(mid.left, 'now there is something behind you').toBe(true);
  });

  test('paging to the end retires the right arrow', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await narrow(page);
    await deal(player, hand(14, 1));

    await player.evaluate(() => {
      const s = document.querySelector('#hand .hand-scroll');
      s.scrollLeft = s.scrollWidth;
      s.dispatchEvent(new Event('scroll'));
    });

    const p = await pagers(player);
    expect(p.right, 'nothing further right').toBe(false);
    expect(p.left, 'but plenty behind').toBe(true);
  });

  test('the arrows recompute when the hand changes under them', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await narrow(page);

    await deal(player, hand(14, 1));
    expect((await pagers(player)).right).toBe(true);

    /* a tier fires, the meter drops, and most of the hand goes out of reach */
    await deal(player, hand(2, 1));
    expect((await pagers(player)).right, 'a shorter hand needs no arrow').toBe(false);
  });

  test('switching tabs recomputes them too', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await narrow(page);
    await deal(player, hand(14, 1));

    expect((await pagers(player)).right, 'the Acts overflow').toBe(true);
    await clickTab(player, 'react');
    expect((await pagers(player)).right, 'the single React does not').toBe(false);
  });

  test('the pagers never sit on the pill or the die tray', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await narrow(page);
    await deal(player, hand(14, 1));

    const g = await player.evaluate(() => {
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
        return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
      return {
        right: r(document.querySelector('#hand .hand-pager.right')),
        pill: r(document.getElementById('moreOpt')),
        tray: r(document.getElementById('tray'))
      };
    });
    expect(g.right.r, 'the right arrow stops before the pill').toBeLessThanOrEqual(g.pill.l);
    if (g.tray) {
      const leftPager = await player.evaluate(() => {
        const b = document.querySelector('#hand .hand-pager.left').getBoundingClientRect();
        return { l: b.left, r: b.right };
      });
      expect(leftPager.l, 'and the left arrow begins after the die tray').toBeGreaterThanOrEqual(g.tray.r - 1);
    }
  });
});
