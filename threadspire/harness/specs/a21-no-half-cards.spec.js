/* A21 — whole cards or none.
 *
 * A row that scrolls shows whatever its edge lands on, and what it landed on was half a
 * card: something that is there and is not, which reads worse than a card plainly absent.
 * A player counting their options counted one they could not read.
 *
 * The scroller is cut to a whole number of cards. Everything follows from that - with the
 * row resting on card edges (A13) and the visible width an exact multiple of one card,
 * there is no resting position that can show part of one. The rest are behind the arrows,
 * which is what the arrows are for.
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

const acts = (n) => {
  const out = [];
  for (let i = 1; i <= n; i++) {
    out.push({ src: 'Ashen Blade', nm: 'Strike ' + i, desc: 'standard strike', dmg: 6, base: 3,
      dt: 'phys', tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false });
  }
  return out;
};

async function seat(frame, n) {
  await frame.evaluate(() => {
    window.applyRemoteSnapshot = function () {};
    window.ensureSheet = function () {};
    var _sf = document.getElementById('sheetFrame'); if (_sf) _sf.remove();
  });
  await frame.evaluate(({ a, myCharId }) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [];
    window.sheet.postMessage = function () {};
    window.tsHandTake({ charge: 1, acts: a, reacts: [], skills: {}, items: [], stances: [],
                        gates: { noAct: false, noReact: false, notes: [] },
                        active: true, round: 1, phase: 'commit', fighters: [] });
    window.render();
  }, { a: acts(n), myCharId: F.FELL_CHAR_ID });
}

/* every card measured against the visible band: whole, hidden, or the thing that must
   never happen - straddling an edge */
const slice = (frame) => frame.evaluate(() => {
  const sc = document.querySelector('#hand .hand-scroll');
  const b = sc.getBoundingClientRect();
  const rects = Array.from(sc.querySelectorAll('.hcard')).map((c) => c.getBoundingClientRect());
  const overlaps = (r) => r.right > b.left + 1 && r.left < b.right - 1;
  return {
    total: rects.length,
    whole: rects.filter((r) => r.left >= b.left - 1 && r.right <= b.right + 1).length,
    partial: rects.filter((r) => overlaps(r) && (r.left < b.left - 1 || r.right > b.right + 1)).length,
    bandW: b.width,
    scrollLeft: sc.scrollLeft,
    max: sc.scrollWidth - sc.clientWidth
  };
});

test.describe('A21 never half a card', () => {

  test('a hand too long for the row shows whole cards only', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 12);

    const g = await slice(player);
    expect(g.max, 'there is more hand than row, which is the case in question').toBeGreaterThan(0);
    expect(g.partial, 'not one card cut off half way').toBe(0);
    expect(g.whole, 'and what is shown is shown properly').toBeGreaterThan(0);
    expect(g.whole, 'with the rest behind the arrows').toBeLessThan(g.total);
  });

  test('and at every resting place along it', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 12);

    /* the far end is the one that catches a row quantised only at its start */
    await player.evaluate(() => {
      const sc = document.querySelector('#hand .hand-scroll');
      sc.scrollLeft = sc.scrollWidth;
    });
    await page.waitForTimeout(200);
    expect((await slice(player)).partial, 'at the end of the row').toBe(0);

    /* and page by page back to the start */
    for (let i = 0; i < 6; i++) {
      await player.evaluate(() => window.handPage(-1));
      await page.waitForTimeout(120);
      const g = await slice(player);
      expect(g.partial, 'after paging back ' + (i + 1)).toBe(0);
      if (g.scrollLeft <= 3) break;
    }
  });

  test('a hand that fits shows all of it and needs no arrows', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 2);

    const g = await slice(player);
    expect(g.whole, 'both of them').toBe(2);
    expect(g.partial).toBe(0);
    expect(g.max, 'nothing to scroll to').toBeLessThanOrEqual(1);
  });

  /* THE invariant, and the one worth stating at several widths rather than one. A band
     that happens to be a whole number of cards wide by luck will pass the partial-card
     checks above without the row doing anything at all; the point is that it is a whole
     number at EVERY width, which only holds if something makes it so. */
  test('the band is a whole number of cards wide, whatever the table', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');

    for (const width of [1280, 1440, 1600, 1730, 1800, 1920]) {
      await page.setViewportSize({ width: width, height: 1000 });
      await seat(player, 12);

      const m = await player.evaluate(() => {
        const sc = document.querySelector('#hand .hand-scroll');
        const cs = getComputedStyle(sc);
        const gap = parseFloat(cs.columnGap || cs.gap) || 0;
        const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        const cw = sc.querySelector('.hcard').getBoundingClientRect().width;
        return { inner: sc.getBoundingClientRect().width - pad, cw: cw, gap: gap };
      });
      /* inner = n*cw + (n-1)*gap for a whole n, which is to say (inner+gap) divides evenly
         by (cw+gap) */
      const n = (m.inner + m.gap) / (m.cw + m.gap);
      expect(Math.abs(n - Math.round(n)),
        'at ' + width + 'px the band holds ' + n.toFixed(2) + ' cards').toBeLessThan(0.02);
      expect((await slice(player)).partial, 'and so nothing is cut at ' + width + 'px').toBe(0);
    }
  });

  test('a narrow table still shows at least one whole card', async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 900 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 12);

    const g = await slice(player);
    expect(g.whole, 'a row with nothing readable on it would be worse than a cramped one')
      .toBeGreaterThanOrEqual(1);
    expect(g.partial).toBe(0);
  });

  test('the arrows still say which way there is more', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, 12);

    const arrows = () => player.evaluate(() => ({
      left: !document.querySelector('#hand .hand-pager.left').classList.contains('gone'),
      right: !document.querySelector('#hand .hand-pager.right').classList.contains('gone')
    }));
    expect(await arrows(), 'at the start, only forward').toEqual({ left: false, right: true });

    await player.evaluate(() => {
      const sc = document.querySelector('#hand .hand-scroll');
      sc.scrollLeft = sc.scrollWidth;
      sc.dispatchEvent(new Event('scroll'));
    });
    expect(await arrows(), 'at the end, only back').toEqual({ left: true, right: false });
  });
});
