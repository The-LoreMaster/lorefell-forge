/* A10 — which card, and where the row was.
 *
 * A Fell carrying a sword and a bow has two cards called "Basic attack". They are not the
 * same deed: the damage differs, and so do the infusions the sheet reads off the weapon.
 * The row identified a card by its name, so:
 *
 *   taking one up lit both of them
 *   declaring one stamped both of them
 *   and the sheet, asked for "Basic attack", always built the FIRST weapon's — so tapping
 *   the bow declared the sword
 *
 * The last of those is the one that mattered. A card is identified now by where it came
 * from and where it sits, and the weapon travels with the declare.
 *
 * The other half of this is smaller and just as visible in play: the row is rebuilt whole
 * on every choice, and rebuilding it sent it back to the first card. A player who paged
 * right to find their bow tapped it and watched the row snap back to the sword, with the
 * card they had just chosen now off-screen.
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

/* one Fell, two weapons, and the same Act on both */
const TWINS = [
  { src: 'Ashen Blade', nm: 'Basic attack', desc: 'standard strike', dmg: 6, base: 3, dt: 'phys',
    tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false },
  { src: 'Longbow', nm: 'Basic attack', desc: 'standard strike', dmg: 4, base: 2, dt: 'phys',
    tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false },
  { src: 'skills', nm: 'Any skill', desc: 'pick one', dmg: 0, base: 0, dt: null,
    tier: null, kind: 'standard', contest: 'evasion', castSkill: '', locked: false }
];

/* enough cards that the row has to scroll */
function manyActs() {
  const out = [];
  for (let i = 1; i <= 14; i++) {
    out.push({ src: 'Ashen Blade', nm: 'Strike ' + i, desc: 'a card', dmg: 5, base: 2, dt: 'phys',
               tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false });
  }
  return out;
}

async function seat(frame, acts, opts) {
  opts = opts || {};
  await frame.evaluate(() => { window.applyRemoteSnapshot = function () {}; });
  await frame.evaluate(({ a, fighters, myCharId, o }) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [{ id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 400, y: 400, cells: 1 }];
    window.__sent = [];
    window.sheet.postMessage = function (m) {
      if (!m || m.type !== 'ts-declare') return;
      window.__sent.push(m);
      window.handDeclareResult({ ok: true, round: m.round });
    };
    window.tsHandTake({ charge: 1, acts: a, reacts: o.reacts || [], skills: { Guard: 3 },
                        items: [], stances: [], gates: { noAct: false, noReact: false, notes: [] },
                        active: true, round: 1, phase: o.phase || 'commit', fighters: fighters });
    window.renderTokens(); window.render();
  }, { a: acts, fighters: FIGHTERS, myCharId: F.FELL_CHAR_ID, o: opts });
}

/* the cards as the row drew them, in order */
const cards = (frame) => frame.evaluate(() =>
  Array.from(document.querySelectorAll('#hand .hcard')).map((c) => ({
    act: c.getAttribute('data-act'), key: c.getAttribute('data-key'),
    armed: c.classList.contains('armed'), declared: c.classList.contains('declared'),
    text: c.textContent.replace(/\s+/g, ' ').trim()
  })));
/* tap the nth card on the row, through the row's own click handler rather than by name */
const tapCard = (frame, n) => frame.evaluate((i) => {
  document.querySelectorAll('#hand .hcard')[i].click();
}, n);
const sent = (frame) => frame.evaluate(() => window.__sent);
const aimAndRoll = (frame) => frame.evaluate(() => {
  window.handAimByTap(window.S.tokens.find((t) => t.id === 'tkFoe'));
  window.handRollDo(4);
});

test.describe('A10 the card you tapped, and the row you left', () => {

  test('two cards can share a name and still be told apart', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, TWINS);

    const c = await cards(player);
    expect(c.filter((x) => x.act === 'Basic attack')).toHaveLength(2);
    expect(c[0].key, 'and the keys are not the same').not.toBe(c[1].key);
    expect(c[0].text, 'the card says which weapon on its face').toContain('Ashen Blade');
    expect(c[1].text).toContain('Longbow');
  });

  test('taking one up lights that one and not its twin', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, TWINS);

    await tapCard(player, 1);                       /* the bow */
    const c = await cards(player);
    expect(c.filter((x) => x.armed).length, 'exactly one card is held').toBe(1);
    expect(c[1].armed, 'and it is the one that was tapped').toBe(true);
    expect(c[0].armed).toBe(false);
  });

  test('tapping the twin swaps to it rather than putting the card down', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, TWINS);

    await tapCard(player, 0);
    await tapCard(player, 1);
    const c = await cards(player);
    expect(c[1].armed, 'the second one is now held').toBe(true);
    expect(c[0].armed).toBe(false);

    /* and tapping the held one again still puts it down: swapping did not cost the toggle */
    await tapCard(player, 1);
    expect((await cards(player)).filter((x) => x.armed).length).toBe(0);
  });

  test('the declare carries the weapon, not just the name', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, TWINS);

    await tapCard(player, 1);                       /* the bow, the second of the two */
    await aimAndRoll(player);

    const out = await sent(player);
    expect(out).toHaveLength(1);
    expect(out[0].act).toBe('Basic attack');
    expect(out[0].src, 'without this the sheet builds the sword').toBe('Longbow');
  });

  test('the declared stamp lands on one card', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, TWINS);

    await tapCard(player, 1);
    await aimAndRoll(player);

    const c = await cards(player);
    expect(c.filter((x) => x.declared).length, 'one declaration, one stamp').toBe(1);
    expect(c[1].declared).toBe(true);
    expect(c[0].declared, 'the sword was not swung').toBe(false);
  });

  test('the target-first menu names the weapon and takes the one named', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, TWINS);

    /* right-click the foe with an empty hand, then choose Attack */
    await player.evaluate(() => {
      const el = document.querySelector('.token[data-tok="tkFoe"]');
      const r = el.getBoundingClientRect();
      el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true,
        clientX: Math.round(r.left + r.width / 2), clientY: Math.round(r.top + r.height / 2) }));
      window.handPickKind('attack');
    });

    const opts = await player.evaluate(() =>
      Array.from(document.querySelectorAll('#hand .hand-pickmenu .hp-opt')).map((b) => ({
        text: b.textContent.replace(/\s+/g, ' ').trim(), take: b.getAttribute('data-ptake')
      })));
    const twins = opts.filter((o) => o.text.indexOf('Basic attack') === 0);
    expect(twins).toHaveLength(2);
    expect(twins[0].text, 'a menu listing it twice with nothing to choose between is worse')
      .toContain('Ashen Blade');
    expect(twins[1].text).toContain('Longbow');
    expect(twins[0].take).not.toBe(twins[1].take);

    /* take the second and roll: the bow again */
    await player.evaluate((k) => { window.handPickTake(k, ''); window.handRollDo(3); }, twins[1].take);
    const out = await sent(player);
    expect(out).toHaveLength(1);
    expect(out[0].src).toBe('Longbow');
  });

  test('choosing a card does not send the row back to the start', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player, manyActs());

    /* Scrolled the way a player scrolls it, rather than by assignment. It matters here:
       the row rests on card edges now (A13), and a gesture settles on one, while a
       number written straight into scrollLeft can leave it between two - somewhere it
       would never be left in play, and somewhere it will not be given back because the
       next repaint snaps it. What has to be preserved is where a player can actually
       leave the row. */
    const box = await page.locator('#if-player').boundingBox();
    const at = await player.evaluate(() => {
      const r = document.querySelector('#hand .hand-scroll').getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await page.mouse.move(box.x + at.x, box.y + at.y);
    await page.mouse.wheel(340, 0);
    await page.waitForTimeout(400);

    /* which card the row is resting on, which is what a player would say about where it
       is - the exact pixel is the browser's business and it moves it by two or three of
       them as it settles */
    const restingOn = () => player.evaluate(() => {
      const sc = document.querySelector('#hand .hand-scroll');
      const b = sc.getBoundingClientRect();
      const c = Array.from(sc.querySelectorAll('.hcard'))
        .filter((x) => x.getBoundingClientRect().left >= b.left - 3)[0];
      return c ? c.getAttribute('data-act') : null;
    });

    const scrolled = await player.evaluate(() =>
      document.querySelector('#hand .hand-scroll').scrollLeft);
    expect(scrolled, 'the row is long enough to scroll at all').toBeGreaterThan(0);
    const wasOn = await restingOn();

    /* take up a card that is in view from there */
    const chose = await player.evaluate(() => {
      const sc = document.querySelector('#hand .hand-scroll');
      const b = sc.getBoundingClientRect();
      /* whole cards only, measured where they actually are: a card half off the edge
         would be scrolled into view and move the row for a reason that is not this one */
      const c = Array.from(sc.querySelectorAll('.hcard')).filter((x) => {
        const r = x.getBoundingClientRect();
        return r.left >= b.left - 1 && r.right <= b.right + 1;
      })[0];
      c.click();
      return c.getAttribute('data-act');
    });

    const after = await player.evaluate(() => document.querySelector('#hand .hand-scroll').scrollLeft);
    expect(await restingOn(), 'the row is still on the card it was on').toBe(wasOn);
    expect(Math.abs(after - scrolled), 'and has not gone travelling to get there')
      .toBeLessThanOrEqual(4);
    expect(after, 'certainly not back to the first card').toBeGreaterThan(scrolled / 2);
    expect((await cards(player)).filter((x) => x.armed).map((x) => x.act)).toEqual([chose]);
  });

  test('the other tab starts at its own beginning', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    /* resolving, so the Reacts tab exists at all */
    await seat(player, manyActs(), { phase: 'resolve', reacts: [
      { src: 'Ashen Blade', nm: 'Parry', desc: 'turn it aside', dmg: 0, base: 0, dt: null,
        tier: 1, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false }
    ] });

    await player.evaluate(() => {
      const sc = document.querySelector('#hand .hand-scroll');
      sc.scrollLeft = sc.scrollWidth - sc.clientWidth;
    });
    await player.evaluate(() => window.handSetTab('react'));

    /* "At its beginning" rather than "at zero": a card snaps its edge to the content box,
       which starts after the row's own padding, so the beginning is a pixel or two in */
    const atStart = () => player.evaluate(() => {
      const sc = document.querySelector('#hand .hand-scroll');
      const pad = parseFloat(getComputedStyle(sc).paddingLeft) || 0;
      return sc.scrollLeft <= pad + 1;
    });

    expect(await atStart(), 'a short Reacts row does not inherit where the Acts row was').toBe(true);

    /* and coming back does not pretend to remember a position it cannot have kept */
    await player.evaluate(() => window.handSetTab('act'));
    expect(await atStart()).toBe(true);
  });
});
