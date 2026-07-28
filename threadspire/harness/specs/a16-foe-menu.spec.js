/* A16 — the no-card menu on a foe, and the seam it depends on.
 *
 * Right-clicking a foe with an empty hand should offer Attack or Skill, then the specific
 * one, then the roll. That flow exists. What was never proven is the thing underneath it:
 * that the keys the LoreMaster PUBLISHES and the refIds the player's TOKENS carry are the
 * same strings.
 *
 * Every spec until now, this one's ancestors included, hand-wrote the fighters list in the
 * shape combatFighters was believed to build. A comment asserting a shape is not a test of
 * it. If those two ever drifted, the row would resolve nothing, every gesture would fall
 * through to the dice picker, and the whole suite would stay green while combat was
 * unplayable — which is exactly what live play reported.
 *
 * So this builds ONE scene and derives both ends from it with the real functions.
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

/* A scene with foes on it, as an adventure hands one over. */
const SCENE = {
  id: 'sc-1', name: 'The Breach', beats: [], npcs: [], accountTokens: [],
  foes: [
    { id: 'cb-erasure', name: 'The Erasure', sr: 'Champion', side: 'foe', curVit: 30, maxVit: 30, charge: 0 },
    { id: 'cb-swordsman', name: 'Masked Swordsman', sr: 'Elite', side: 'foe', curVit: 12, maxVit: 12, charge: 0 }
  ],
  fell: [{ id: 'pl-7', charId: F.FELL_CHAR_ID, name: 'Maerwen', level: 12, curVit: 70, maxVit: 70 }]
};

test.describe('A16 the board and the fight agree on who is who', () => {

  test('every foe the palette offers is a fighter the publish names', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await frames.lm.evaluate(() => { window.applyRemoteSnapshot = function () {};
    /* and the sheet in this frame, which is real and boots on its own clock. When it
       finishes it posts a hand of its own - inactive, empty - which replaces whatever a
       spec injected and empties the row, taking any note with it. Whether that lands
       before or after an assertion moves with machine load, which is what made it look
       like noise. Specs that drive the REAL sheet do not pin this; specs that inject a
       hand must. */
    window.ensureSheet = function () {};
    var _sf = document.getElementById("sheetFrame"); if (_sf) _sf.remove(); });

    const seam = await frames.lm.evaluate((sc) => {
      window.S.scene = sc;
      window.S.party = [{ charId: sc.fell[0].charId, charName: 'Maerwen' }];
      /* both ends, from the real functions, off the one scene */
      const published = window.combatFighters().map((f) => f.key);
      const onPalette = window.tokenPalette().foes
        .map((p) => ({ name: p.name, refId: p.refId, wouldBe: 'm:' + p.refId }));
      return { published: published, onPalette: onPalette };
    }, SCENE);

    expect(seam.onPalette.length, 'the palette offers the scene foes').toBe(2);
    seam.onPalette.forEach((p) => {
      expect(seam.published, p.name + ' is offered to place but not named as a fighter')
        .toContain(p.wouldBe);
    });
    expect(seam.published, 'and the Fell too').toContain('p:' + F.FELL_CHAR_ID);
  });

  test('a token placed from the palette resolves against the published list', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    await frames.lm.evaluate(() => { window.applyRemoteSnapshot = function () {};
    /* and the sheet in this frame, which is real and boots on its own clock. When it
       finishes it posts a hand of its own - inactive, empty - which replaces whatever a
       spec injected and empties the row, taking any note with it. Whether that lands
       before or after an assertion moves with machine load, which is what made it look
       like noise. Specs that drive the REAL sheet do not pin this; specs that inject a
       hand must. */
    window.ensureSheet = function () {};
    var _sf = document.getElementById("sheetFrame"); if (_sf) _sf.remove(); });
    await frames.player.evaluate(() => { window.applyRemoteSnapshot = function () {};
    /* and the sheet in this frame, which is real and boots on its own clock. When it
       finishes it posts a hand of its own - inactive, empty - which replaces whatever a
       spec injected and empties the row, taking any note with it. Whether that lands
       before or after an assertion moves with machine load, which is what made it look
       like noise. Specs that drive the REAL sheet do not pin this; specs that inject a
       hand must. */
    window.ensureSheet = function () {};
    var _sf = document.getElementById("sheetFrame"); if (_sf) _sf.remove(); });

    /* what the LoreMaster would publish, and what they would place, both real */
    const real = await frames.lm.evaluate((sc) => {
      window.S.scene = sc;
      window.S.party = [{ charId: sc.fell[0].charId, charName: 'Maerwen' }];
      const p = window.tokenPalette().foes[0];
      return {
        fighters: window.combatFighters(),
        token: { id: 'tk1', kind: p.kind, name: p.name, refId: p.refId, cells: p.cells, x: 400, y: 400 }
      };
    }, SCENE);

    /* the player's board and hand, given exactly those */
    const resolved = await frames.player.evaluate(({ fighters, token, myCharId }) => {
      window.S.role = 'player'; window.S.mode = 'combat';
      window.S.characterId = myCharId;
      window.S.map = { w: 2400, h: 1600 };
      window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
      window.S.tokens = [token];
      window.sheet.postMessage = function () {};
      window.tsHandTake({ charge: 1, acts: [], reacts: [], skills: {}, items: [], stances: [],
                          gates: { noAct: false, noReact: false, notes: [] },
                          active: true, round: 1, phase: 'commit', fighters: fighters });
      window.renderTokens(); window.render();
      const f = window.tokenFighter(token);
      return { key: f && f.key, name: f && f.name, targetable: window.tokenTargetable(token) };
    }, { fighters: real.fighters, token: real.token, myCharId: F.FELL_CHAR_ID });

    expect(resolved.targetable).toBe(true);
    expect(resolved.key, 'the seam holds end to end, with nothing hand-written between')
      .toBe('m:cb-erasure');
    expect(resolved.name).toBe('The Erasure');
  });
});

test.describe('A16 right-clicking a foe with an empty hand', () => {

  const ACTS = [
    { src: 'Ashen Blade', nm: 'Basic attack', desc: 'standard strike', dmg: 6, base: 3, dt: 'phys',
      tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false },
    { src: 'Ashen Blade', nm: 'Rend', desc: 'a tier two', dmg: 9, base: 4, dt: 'phys',
      tier: 2, kind: 'weapon', contest: 'evasion', castSkill: '', locked: true },
    { src: 'skills', nm: 'Any skill', desc: 'pick one', dmg: 0, base: 0, dt: null,
      tier: null, kind: 'standard', contest: 'evasion', castSkill: '', locked: false }
  ];

  async function seatFromScene(page) {
    const frames = await T.openTableAndBoot(page, bothSides());
    await frames.lm.evaluate(() => { window.applyRemoteSnapshot = function () {};
    /* and the sheet in this frame, which is real and boots on its own clock. When it
       finishes it posts a hand of its own - inactive, empty - which replaces whatever a
       spec injected and empties the row, taking any note with it. Whether that lands
       before or after an assertion moves with machine load, which is what made it look
       like noise. Specs that drive the REAL sheet do not pin this; specs that inject a
       hand must. */
    window.ensureSheet = function () {};
    var _sf = document.getElementById("sheetFrame"); if (_sf) _sf.remove(); });
    await frames.player.evaluate(() => { window.applyRemoteSnapshot = function () {};
    /* and the sheet in this frame, which is real and boots on its own clock. When it
       finishes it posts a hand of its own - inactive, empty - which replaces whatever a
       spec injected and empties the row, taking any note with it. Whether that lands
       before or after an assertion moves with machine load, which is what made it look
       like noise. Specs that drive the REAL sheet do not pin this; specs that inject a
       hand must. */
    window.ensureSheet = function () {};
    var _sf = document.getElementById("sheetFrame"); if (_sf) _sf.remove(); });

    const real = await frames.lm.evaluate((sc) => {
      window.S.scene = sc;
      window.S.party = [{ charId: sc.fell[0].charId, charName: 'Maerwen' }];
      const p = window.tokenPalette().foes[0];
      return { fighters: window.combatFighters(),
               token: { id: 'tk1', kind: p.kind, name: p.name, refId: p.refId, cells: 1, x: 400, y: 400 } };
    }, SCENE);

    await frames.player.evaluate(({ fighters, token, acts, myCharId }) => {
      window.S.role = 'player'; window.S.mode = 'combat';
      window.S.characterId = myCharId;
      window.S.map = { w: 2400, h: 1600 };
      window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
      window.S.tokens = [token];
      window.__sent = [];
      window.sheet.postMessage = function (m) {
        if (!m || m.type !== 'ts-declare') return;
        window.__sent.push(m);
        window.handDeclareResult({ ok: true, round: m.round });
      };
      window.tsHandTake({ charge: 1, acts: acts, reacts: [], skills: { Guard: 3, Perception: 4 },
                          items: [], stances: [], gates: { noAct: false, noReact: false, notes: [] },
                          active: true, round: 1, phase: 'commit', fighters: fighters });
      window.renderTokens(); window.render();
      document.getElementById('typePick').classList.remove('open', 'atcursor');
    }, { fighters: real.fighters, token: real.token, acts: ACTS, myCharId: F.FELL_CHAR_ID });

    return frames.player;
  }

  const rightClick = (frame) => frame.evaluate(() => {
    const el = document.querySelector('.token[data-tok="tk1"]');
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true,
      clientX: Math.round(r.left + r.width / 2), clientY: Math.round(r.top + r.height / 2) }));
  });
  const menu = (frame) => frame.evaluate(() => {
    const m = document.querySelector('#hand .hand-pickmenu');
    if (!m) return null;
    return {
      text: m.textContent.replace(/\s+/g, ' ').trim(),
      opts: Array.from(m.querySelectorAll('.hp-opt')).map((b) => ({
        act: (b.querySelector('.hp-name') || {}).textContent || b.textContent.trim(),
        kind: b.getAttribute('data-pkind'), take: b.getAttribute('data-ptake'),
        locked: b.classList.contains('locked'), text: b.textContent.replace(/\s+/g, ' ').trim()
      }))
    };
  });
  const dicePicker = (frame) => frame.evaluate(() =>
    document.getElementById('typePick').classList.contains('open'));

  test('it offers Attack or Skill rather than rolling a bare die', async ({ page }) => {
    const player = await seatFromScene(page);
    await rightClick(player);

    const m = await menu(player);
    expect(m, 'the menu is what a foe gets, not the dice tray').not.toBeNull();
    expect(m.text).toContain('The Erasure');
    expect(m.opts.map((o) => o.kind)).toEqual(['attack', 'skill']);
    expect(await dicePicker(player), 'and the roll picker stays out of it').toBe(false);
  });

  test('Attack lists the weapon Acts, locked ones greyed and priced', async ({ page }) => {
    const player = await seatFromScene(page);
    await rightClick(player);
    await player.evaluate(() => window.handPickKind('attack'));

    const m = await menu(player);
    const acts = m.opts.map((o) => o.act);
    expect(acts).toContain('Basic attack');
    expect(acts, 'F9: a charge away is shown, not hidden').toContain('Rend');

    const rend = m.opts.find((o) => o.act === 'Rend');
    expect(rend.locked).toBe(true);
    expect(rend.text, 'wearing what would unlock it').toContain('Charge 2');
    expect(rend.take, 'and not takeable').toBeFalsy();
  });

  test('Skill lists the skills, and choosing one goes to the roll', async ({ page }) => {
    const player = await seatFromScene(page);
    await rightClick(player);
    await player.evaluate(() => window.handPickKind('skill'));

    const m = await menu(player);
    expect(m.text).toContain('Perception');

    await player.evaluate(() => {
      const b = Array.from(document.querySelectorAll('#hand .hand-pickmenu .hp-opt'))
        .find((x) => x.textContent.indexOf('Perception') === 0);
      b.click();
    });

    expect(await player.evaluate(() => document.getElementById('tray').classList.contains('awaiting')),
      'the same prompt everything else ends at').toBe(true);
    expect(await player.evaluate(() => window.armed.skill)).toBe('Perception');
    expect(await player.evaluate(() => window.__sent), 'and nothing sent yet').toHaveLength(0);
  });

  test('the choice carries the target, and the roll commits it', async ({ page }) => {
    const player = await seatFromScene(page);
    await rightClick(player);
    await player.evaluate(() => window.handPickKind('attack'));
    const m = await menu(player);
    const basic = m.opts.find((o) => o.act === 'Basic attack');
    await player.evaluate((k) => { window.handPickTake(k, ''); }, basic.take);
    await player.evaluate(() => window.handRollDo(5));

    const out = await player.evaluate(() => window.__sent);
    expect(out).toHaveLength(1);
    expect(out[0].act).toBe('Basic attack');
    expect(out[0].target, 'the foe that was right-clicked').toBe('m:cb-erasure');
    expect(out[0].roll).toBe(5);
  });
});
