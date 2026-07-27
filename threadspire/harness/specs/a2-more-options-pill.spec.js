/* A2 — the More Options pill.
 *
 * A quiet reminder that the sheet is still there, parked against the Fellmark gem with
 * its arrow pointing at it.
 *
 * The requirement that can fail silently is the geometric one: the pill must never
 * overlap a card and a card must never overlap the pill. Both are positioned from the
 * gem's own percentage, so they agree by construction rather than by a pixel guess, and
 * that is asserted by MEASURING at several widths rather than by trusting the arithmetic.
 * A fixed padding would pass at whatever width it was tuned for and fail everywhere else.
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

/* Enough cards that the row genuinely runs to its right-hand limit. */
function bigHand() {
  const acts = [];
  for (let i = 0; i < 12; i++) {
    acts.push({ src: 'Blade', nm: 'Act ' + (i + 1), desc: 'a card', dmg: 4, base: 2, dt: 'phys',
                tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false });
  }
  return { charge: 3, acts: acts, reacts: [], skills: {}, items: [], stances: [],
           gates: { noAct: false, noReact: false, notes: [] },
           active: true, round: 1, phase: 'commit', fighters: [] };
}

async function deal(frame, hand) {
  /* The shared-store poll writes S.mode and S.tokens from the feed, which is exactly the
     state these cases set and then measure. A poll landing mid-test replaces it and the case
     fails for a reason unrelated to what it asks. Correct product behaviour, wrong thing to
     leave running while measuring local rendering. */
    await frame.evaluate(() => { window.applyRemoteSnapshot = function () {}; });
  await frame.evaluate((h) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.tsHandTake(h); window.render();
  }, hand || bigHand());
}

const boxes = (frame) => frame.evaluate(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; };
  return {
    pill: r(document.getElementById('moreOpt')),
    gem: r(document.querySelector('.hFell')),
    cards: Array.from(document.querySelectorAll('#hand .hcard')).map(r),
    vw: document.documentElement.clientWidth
  };
});

const overlaps = (a, b) => !(a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t);

test.describe('A2 the More Options pill', () => {

  test('it appears with the fight and goes with it', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');

    const hidden = () => player.evaluate(() => document.getElementById('moreOpt').classList.contains('hidden'));
    expect(await hidden(), 'no fight, no reminder').toBe(true);

    await deal(player);
    expect(await hidden()).toBe(false);

    await player.evaluate(() => { window.S.mode = 'roleplay'; window.render(); });
    expect(await hidden(), 'out of combat the sheet is reachable the ordinary ways').toBe(true);
  });

  test('it sits to the LEFT of the Fellmark gem and points at it', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    const g = await boxes(player);
    expect(g.gem, 'the gem is on screen to be pointed at').toBeTruthy();
    expect(g.pill.r, 'the pill ends before the gem begins').toBeLessThanOrEqual(g.gem.l);

    /* vertically it lines up with the gem rather than floating somewhere near it */
    const pillMid = (g.pill.t + g.pill.b) / 2, gemMid = (g.gem.t + g.gem.b) / 2;
    expect(Math.abs(pillMid - gemMid)).toBeLessThan(6);

    const arrow = await player.evaluate(() => {
      const a = document.querySelector('#moreOpt .mo-arrow');
      return a ? a.textContent : null;
    });
    expect(arrow, 'and carries an arrow toward it').toBeTruthy();
  });

  test('it is subtle rather than loud', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    const cs = await player.evaluate(() => {
      const s = getComputedStyle(document.getElementById('moreOpt'));
      return { opacity: parseFloat(s.opacity), bg: s.backgroundColor, anim: s.animationName };
    });
    expect(cs.opacity, 'semi-transparent, not a solid call to action').toBeLessThan(1);
    /* the prototype drew this in alarm red; the brief asked for subtle, so it is not */
    expect(cs.bg).not.toMatch(/rgba?\(\s*(1[6-9]\d|2\d\d)\s*,\s*[0-5]?\d\s*,/);
    expect(cs.anim, 'nothing pulsing for attention').toBe('none');
  });

  /* The harness gives each frame half the page, so a page width is NOT the width the
   * layout sees. These are chosen to land the FRAME at 1100, 950 and 800, all of them
   * above the 700 where the phone rules take the pill away entirely, and the frame's own
   * width is asserted so this cannot drift back into testing the wrong thing. */
  test('no card ever overlaps the pill, at any width', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');

    for (const pageWidth of [2200, 1900, 1600]) {
      await page.setViewportSize({ width: pageWidth, height: 860 });
      await deal(player);
      const width = await player.evaluate(() => document.documentElement.clientWidth);
      expect(width, 'this case is about the desktop layout, where the pill exists').toBeGreaterThan(700);

      const g = await boxes(player);
      expect(g.cards.length, `cards are drawn at ${width}`).toBeGreaterThan(0);

      /* scroll the row hard right: the last card must still stop short of the pill */
      await player.evaluate(() => {
        const s = document.querySelector('#hand .hand-scroll');
        s.scrollLeft = s.scrollWidth;
      });
      const after = await boxes(player);

      after.cards.forEach(function (c, i) {
        expect(overlaps(c, after.pill), `card ${i + 1} clear of the pill at ${width}px`).toBe(false);
      });
      const rightmost = after.cards.reduce((m, c) => Math.max(m, c.r), 0);
      expect(rightmost, `the row stops before the pill at ${width}px`).toBeLessThanOrEqual(after.pill.l);
    }
  });

  test('the row never scrolls the page sideways to make room', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await page.setViewportSize({ width: 1900, height: 860 });
    await deal(player);

    const slop = await player.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(slop, 'the cards scroll inside their own row, never the table').toBeLessThanOrEqual(0);
  });

  /* It is a reminder to tap the Fellmark gem, so it does whatever the gem does, by
   * clicking the gem rather than naming a destination. The gem's own action CHANGES in
   * a fight, so anything hard-coded would be right half the time. */
  test('it goes wherever the gem goes', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    const viaPill = await player.evaluate(() => {
      document.getElementById('moreOpt').click();
      return window.S.openSection;
    });
    /* and the gem itself, from the same starting point */
    const viaGem = await player.evaluate(() => {
      window.closeWin();
      document.querySelector('.hFell').click();
      return window.S.openSection;
    });

    expect(viaPill, 'the pill leads somewhere').toBeTruthy();
    expect(viaPill, 'and it is exactly where the gem leads').toBe(viaGem);
  });

  test('it never opens the LoreMaster\'s roster at a player', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    await player.evaluate(() => document.getElementById('moreOpt').click());

    /* 'fell' is a LOREMASTER rail key and is not in SHEET_PANELS, so for a player
       openWin('fell') falls through to sectionBody('fell') and draws the whole party's
       roster on their table. This pill used to do exactly that. */
    expect(await player.evaluate(() => window.S.openSection),
      'a player must never be shown the LoreMaster\'s all-players view').not.toBe('fell');
  });

  test('it is a one-shot reminder, not a control', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await deal(player);

    const hidden = () => player.evaluate(() =>
      document.getElementById('moreOpt').classList.contains('hidden'));
    expect(await hidden(), 'shown once the fight is on').toBe(false);

    await player.evaluate(() => document.getElementById('moreOpt').click());
    expect(await hidden(), 'and gone once it has done its job').toBe(true);

    /* it stays gone for the rest of the battle, through repaints */
    await deal(player);
    expect(await hidden(), 'a reminder repeated is nagging').toBe(true);

    /* but the next battle reminds them again */
    await player.evaluate(() => { window.S.mode = 'roleplay'; window.render(); });
    await deal(player);
    expect(await hidden(), 'a new fight, a new reminder').toBe(false);
  });

  test('it clears the art rail down the right-hand side', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');

    for (const pageWidth of [2200, 1900, 1600]) {
      await page.setViewportSize({ width: pageWidth, height: 860 });
      await deal(player);
      const g = await player.evaluate(() => {
        const r = (s) => { const e = document.querySelector(s); if (!e) return null;
          const b = e.getBoundingClientRect(); return { l: b.left, r: b.right }; };
        return { pill: r('#moreOpt'), railTab: r('#rail > *'), vw: document.documentElement.clientWidth };
      });
      /* the Inventory/Skills tabs sit on that rail; the ornate art runs a little left of
         them again, so ending before the tabs is the measurable form of clearing it */
      expect(g.pill.r, `pill clears the rail at ${g.vw}px`).toBeLessThan(g.railTab.l);
    }
  });

  test('on a phone, where there is no gem, it stays away', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await page.setViewportSize({ width: 390, height: 780 });
    await deal(player);

    const shown = await player.evaluate(() =>
      getComputedStyle(document.getElementById('moreOpt')).display !== 'none');
    expect(shown, 'the side HUD and its gem are gone; the bottom rail is the way in').toBe(false);
  });
});
