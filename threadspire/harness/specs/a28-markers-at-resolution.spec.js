/* A28 — the LoreMaster makes the marker, and nobody can aim at it.
 *
 * Pieces 3 and 5 of COMBAT_PLACED_UTILITIES. A23 proved the player's half: the squares are
 * chosen, they show as pending, they travel with the declaration, and NOTHING is on the
 * board. A25 proved the squares survive the trip to the LoreMaster. This is what happens
 * when the LoreMaster resolves it.
 *
 * The rule being pinned: the marker is created by the LoreMaster, at resolution, on the
 * declared squares. Everything else in the design hangs off that one sentence, so most of
 * these cases are really asking "is that still the only way a marker comes to exist".
 *
 * Two traps have their own cases, because both would have shipped looking correct:
 *
 *   The placer is recorded under `placer`, NOT under `charId`. tokenIsMine reads charId,
 *   so a marker carrying it would be draggable by the Fell who placed it - a player able
 *   to move their own caltrops after the fact. tokenArt reads it too, and would have put
 *   the placer's portrait on the thing, a face lying on the floor.
 *
 *   The placement's identity is derived from the declaration, not from the clock. A
 *   Date.now() id makes the same placement a different placement on every read, so
 *   nothing can ever recognise a repeat and "Place it" twice puts down two sets.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function lmOnly() {
  return {
    lm: { role: 'lm', campaignId: F.CAMPAIGN_A, characters: [F.CHARACTER_A], party: F.PARTY_A }
  };
}

/* The LoreMaster's own board, mid-fight, with one Fell on it and one declare against
 * them. The same seat A25 uses, plus the map and tokens a resolution needs. */
async function seatLm(frame, declare, tokens) {
  await frame.evaluate(() => {
    window.applyRemoteSnapshot = function () {};
    window.ensureSheet = function () {};
    var _sf = document.getElementById('sheetFrame'); if (_sf) _sf.remove();
  });
  await frame.evaluate(({ dcl, charId, toks }) => {
    window.S.role = 'lm'; window.S.mode = 'combat';
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = toks || [];
    window.S.scene = window.S.scene || {};
    window.S.scene.combatPhase = 'commit';
    window.S.scene.foes = [];
    window.S.scene.fell = [{ id: 'p1', charId: charId, name: 'Astra', charge: 0, affs: [] }];
    window.S.declares = dcl ? [dcl] : [];
    window.render();
  }, { dcl: declare, charId: F.FELL_CHAR_ID, toks: tokens });
}

const base = {
  charId: F.FELL_CHAR_ID, act: 'Use a utility · Caltrops', react: '', target: '',
  round: 1, dmg: 0, base: 0, dt: '', roll: 0, acc: 0, kind: 'standard', affs: []
};

const resolve = (frame) => frame.evaluate((c) => window.resolvePlacement(c), F.FELL_CHAR_ID);
const markers = (frame) => frame.evaluate(() =>
  (window.S.tokens || []).filter((t) => t.kind === 'marker'));
const logText = (frame) => frame.evaluate(() =>
  (window.S.log || []).map((e) => String(e.html || e.text || '').replace(/<[^>]*>/g, '')).join(' | '));

/* the Ground row as the LoreMaster reads it, straight off the built html */
const groundRow = (frame) => frame.evaluate((charId) => {
  var html = window.fellDeclareHtml({ charId: charId, id: 'p1', charge: 0, affs: [] });
  var box = document.createElement('div');
  box.innerHTML = html;
  var row = [...box.querySelectorAll('.bt-row')]
    .filter((r) => (r.querySelector('.bt-lbl') || {}).textContent === 'Ground')[0];
  if (!row) return null;
  return {
    text: row.textContent.replace('Ground', '').trim(),
    button: (row.querySelector('button') || {}).textContent || '',
    done: !!row.querySelector('.bt-done')
  };
}, F.FELL_CHAR_ID);

test.describe('A28 the marker is made at resolution', () => {

  test('resolving a placement puts a marker on each declared square', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, {
      places: [{ x: 350, y: 450 }, { x: 350, y: 550 }, { x: 450, y: 450 }]
    }));

    expect(await markers(lm), 'nothing is on the ground before it is resolved').toHaveLength(0);
    await resolve(lm);

    const m = await markers(lm);
    expect(m, 'one marker per declared square').toHaveLength(3);
    expect(m.map((t) => ({ x: t.x, y: t.y })),
      'exactly where they were declared, not near them')
      .toEqual([{ x: 350, y: 450 }, { x: 350, y: 550 }, { x: 450, y: 450 }]);
    m.forEach((t) => expect(t.name, 'and each knows what it is').toBe('Caltrops'));
  });

  test('the marker records who placed it, and does NOT impersonate them', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { places: [{ x: 350, y: 450 }] }));
    await resolve(lm);

    const t = (await markers(lm))[0];
    expect(t.placer, 'the placer is on the record').toBe(F.FELL_CHAR_ID);
    expect(t.placerName).toBe('Astra');
    /* the trap: charId is read by tokenIsMine and by tokenArt, and a marker carrying it
       would be draggable by its placer and would wear their portrait */
    expect(t.charId, 'the placer is recorded, not impersonated').toBeFalsy();
    expect(await lm.evaluate((id) =>
      window.tokenArt((window.S.tokens || []).filter((x) => x.id === id)[0]), t.id),
      'and it wears no face').toBe('');
  });

  test('the log says who placed what, and on how many squares', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, {
      places: [{ x: 350, y: 450 }, { x: 350, y: 550 }, { x: 450, y: 450 },
               { x: 450, y: 550 }, { x: 550, y: 450 }]
    }));
    await resolve(lm);

    const l = await logText(lm);
    expect(l).toContain('Astra');
    expect(l).toContain('Caltrops');
    expect(l, 'the table cannot see the board from every chair').toContain('5 squares');
  });

  test('one square is a square, not "1 squares"', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { act: 'Use a utility · Rune', places: [{ x: 350, y: 450 }] }));
    await resolve(lm);

    expect(await logText(lm)).toContain('1 square.');
  });

  test('resolving twice does not put down a second set', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { places: [{ x: 350, y: 450 }, { x: 350, y: 550 }] }));

    await resolve(lm);
    await resolve(lm);

    expect(await markers(lm), 'the same placement is one placement').toHaveLength(2);
    expect(await logText(lm), 'and the second press says so rather than going quiet')
      .toContain('already on the board');
  });

  test('the id is the declaration, not the clock', async ({ page }) => {
    /* If the id were minted from Date.now() the check above would pass only because both
       presses happened in the same millisecond, or fail at random. Ask for it twice and
       assert it is stable, which is the property the check above actually depends on. */
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { places: [{ x: 350, y: 450 }] }));

    const ids = await lm.evaluate((c) => {
      const d = window.declareFor(c);
      const a = window.placementId(c, d);
      const b = window.placementId(c, d);
      return [a, b];
    }, F.FELL_CHAR_ID);
    expect(ids[0], 'the same placement has the same id every time it is asked').toBe(ids[1]);
    expect(ids[0], 'and it names the Fell, the round and the utility').toContain('Caltrops');
    expect(ids[0]).toContain('1');
  });

  test('a malformed square is refused and counted, not placed at a guess', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { places: [{ x: 350, y: 450 }, { y: 550 }] }));
    await resolve(lm);

    const m = await markers(lm);
    expect(m, 'the good one is placed').toHaveLength(1);
    expect(m[0], 'and nothing landed at the origin because a field was missing')
      .toMatchObject({ x: 350, y: 450 });
    expect(await logText(lm), 'the loss is named, not swallowed').toMatch(/malformed/i);
  });

  test('a placement with no usable square places nothing and says why', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { places: [{ y: 550 }] }));
    await resolve(lm);

    expect(await markers(lm)).toHaveLength(0);
    expect(await logText(lm)).toMatch(/no square the board can use/i);
  });

  test('the Ground row offers the button, then reports it is done', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { places: [{ x: 350, y: 450 }] }));

    let g = await groundRow(lm);
    expect(g.button, 'there is something to resolve').toBe('Place it');
    expect(g.done).toBe(false);

    await resolve(lm);
    g = await groundRow(lm);
    expect(g.button, 'and once it is down there is nothing left to press').toBe('');
    expect(g.done, 'a button that simply vanished would look like one that did nothing').toBe(true);
  });

  test('a declare with no squares gets no button at all', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { places: [] }));

    const g = await groundRow(lm);
    expect(g, 'the readout still reports the empty array').not.toBeNull();
    expect(g.text, 'which is the diagnostic A25 pinned').toMatch(/empty/i);
    expect(g.button, 'but there is nothing to place').toBe('');
  });

  test('an unnamed utility resolves as unnamed rather than as the word "utility"', async ({ page }) => {
    /* A declare whose act carries no name after the separator. It should still resolve -
       a marker the LoreMaster can see and move beats a placement that silently does
       nothing - but it must not claim a name it was not given. */
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { act: 'Use a utility', places: [{ x: 350, y: 450 }] }));
    await resolve(lm);

    const m = await markers(lm);
    expect(m, 'it is still placed').toHaveLength(1);
    expect(m[0].name).toBe('a utility');
  });
});

test.describe('A28 a marker is not a combatant', () => {

  /* A player, in a fight, with a marker sitting on the board beside a real foe. */
  async function seatPlayer(frame) {
    await frame.evaluate(() => {
      window.applyRemoteSnapshot = function () {};
      window.ensureSheet = function () {};
      var _sf = document.getElementById('sheetFrame'); if (_sf) _sf.remove();
    });
    await frame.evaluate((charId) => {
      window.S.role = 'player'; window.S.mode = 'combat';
      window.S.characterId = charId;
      window.S.map = { w: 2400, h: 1600 };
      window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
      window.S.tokens = [
        { id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 400, y: 400, cells: 1 },
        /* 850,850 is the CENTRE of cell [8,8] on a 100 grid with no offset, which is what
           resolvePlacement snaps to and what a tap anywhere in that cell produces. Sitting
           it at 800,800 - the corner - would put it half a square off every real marker,
           and handSquareTaken measures from centres. */
        { id: 'mk-1', kind: 'marker', name: 'Caltrops', label: 'C', x: 850, y: 850, cells: 1,
          placer: charId, placerName: 'Astra', util: 'Caltrops', pid: 'pl:x:1:Caltrops', round: 1 }
      ];
      window.tsHandTake({ charge: 1,
        acts: [{ src: 'weapon', nm: 'Basic attack', desc: 'a strike', dmg: 4, base: 4,
                 dt: 'phys', tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '',
                 locked: false, bar: '' }],
        reacts: [], skills: {}, items: [], stances: [],
        gates: { noAct: false, noReact: false, notes: [] },
        active: true, round: 1, phase: 'commit',
        fighters: [{ key: 'm:cb-erasure', name: 'The Erasure', side: 'monster', charId: '' },
                   { key: 'p:pl-7', name: 'Astra', side: 'fell', charId: charId }] });
      window.renderTokens(); window.render();
    }, F.FELL_CHAR_ID);
  }

  const tok = (frame, id) => frame.evaluate((i) =>
    (window.S.tokens || []).filter((t) => t.id === i)[0], id);

  test('a marker resolves to no fighter, mid-fight, beside one that does', async ({ page }) => {
    await T.openTable(page, { player: { role: 'player', campaignId: F.CAMPAIGN_A,
      characterId: F.FELL_CHAR_ID, character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A } });
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seatPlayer(player);

    const out = await player.evaluate(() => {
      const byId = (i) => (window.S.tokens || []).filter((t) => t.id === i)[0];
      return {
        foe: !!window.tokenFighter(byId('tkFoe')),
        marker: window.tokenFighter(byId('mk-1')),
        markerKey: window.tokenTargetKey(byId('mk-1')),
        markerTargetable: window.tokenTargetable(byId('mk-1'))
      };
    });
    expect(out.foe, 'the fight is genuinely on, so null is not just "no battle"').toBe(true);
    expect(out.marker, 'a marker is never a fighter').toBeNull();
    expect(out.markerKey).toBeNull();
    expect(out.markerTargetable).toBe(false);
  });

  test('aiming a held card at a marker does not take', async ({ page }) => {
    await T.openTable(page, { player: { role: 'player', campaignId: F.CAMPAIGN_A,
      characterId: F.FELL_CHAR_ID, character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A } });
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seatPlayer(player);

    const took = await player.evaluate(() => {
      window.handArm('Basic attack', 'act');
      const mk = (window.S.tokens || []).filter((t) => t.id === 'mk-1')[0];
      return { taken: window.handAimByTap(mk), target: window.armed && window.armed.target };
    });
    expect(took.taken, 'the gesture belongs to the picker, not to the card').toBe(false);
    expect(took.target, 'and nothing was aimed at').toBeFalsy();
  });

  test('the placer cannot move their own marker', async ({ page }) => {
    await T.openTable(page, { player: { role: 'player', campaignId: F.CAMPAIGN_A,
      characterId: F.FELL_CHAR_ID, character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A } });
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seatPlayer(player);

    expect(await player.evaluate(() =>
      window.tokenIsMine((window.S.tokens || []).filter((t) => t.id === 'mk-1')[0])),
      'placing it is not owning it - the LoreMaster made it').toBe(false);

    /* and the drawn token wears neither the owner rim nor a drag cursor */
    const cls = await player.evaluate(() => {
      const el = document.querySelector('#tokenLayer .token[data-tok="mk-1"]');
      return el ? el.className : null;
    });
    expect(cls, 'the marker is drawn').toBeTruthy();
    expect(cls).toContain('marker');
    expect(cls, 'not theirs').not.toContain('mine');
    expect(cls, 'and not draggable').not.toContain('lm-drag');
  });

  /* ---- the whole road ----
     Everything above hands one frame a declare or a token directly. This one runs the
     road: a player takes up Caltrops and taps two squares, the declaration travels to the
     store, the LoreMaster reads it back, resolves it, and the markers the LoreMaster made
     have to arrive on the PLAYER's board through the state feed.

     That last leg is the one worth a whole test. A marker only exists at all so that
     everyone at the table can see where the caltrops are; a marker the LoreMaster can see
     and the player cannot is the feature not working, and it would pass every case above.

     It cannot prove the live path - production is a different store, which is F7 and F9's
     lesson and the reason the Ground readout still names its three failures. What it does
     prove is that everything on this side of velo is whole. */
  test('a marker the LoreMaster makes arrives on the player\'s board', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, {
      lm: { role: 'lm', campaignId: F.CAMPAIGN_A, rawCampaign: F.BEACONS, party: F.PARTY_A },
      player: {
        role: 'player', campaignId: F.CAMPAIGN_A, characterId: F.FELL_CHAR_ID,
        character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A
      }
    });

    /* The player's side. The feed is deliberately LEFT RUNNING here - it is the thing
       under test - so only the sheet iframe is stood down. */
    await frames.player.evaluate(() => {
      window.ensureSheet = function () {};
      var _sf = document.getElementById('sheetFrame'); if (_sf) _sf.remove();
    });
    await frames.player.evaluate((charId) => {
      window.S.role = 'player'; window.S.mode = 'combat';
      window.S.characterId = charId;
      window.S.map = { w: 2400, h: 1600 };
      window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
      /* the sheet's half, posting up the way fellglass does, including the act name it
         builds for a utility - which is where the utility's name survives the trip */
      window.sheet.postMessage = function (m) {
        if (!m || m.type !== 'ts-declare') return;
        window.parent.postMessage({ type: 'TS_TOOL_UP', tool: 'fellglass', msg: {
          type: 'combat-declare', charId: window.S.characterId,
          act: m.item ? (m.act + ' · ' + m.item) : m.act,
          react: '', target: m.target || '', round: m.round, places: m.places,
          dmg: 0, base: 0, dt: '', fellmark: false, doubleFell: false, pierce: 0,
          applies: '', actTier: 0, acc: 0, roll: 0, kind: 'standard', fellstrike: false,
          charge: 1, curVit: 28, maxVit: 28, affs: [], reqId: 9
        } }, '*');
        window.handDeclareResult({ ok: true, round: m.round });
      };
      window.tsHandTake({
        charge: 1,
        acts: [{ src: 'utility', nm: 'Use a utility', desc: 'Spend your Act on a utility.',
                 dmg: 0, base: 0, dt: null, tier: null, kind: 'standard',
                 contest: 'evasion', castSkill: '', locked: false }],
        reacts: [], skills: {},
        items: [{ name: 'Caltrops', qty: 1, use: 'Act', roll: 'none', target: 'place',
                  places: 2, space: 'any' }],
        stances: [], gates: { noAct: false, noReact: false, notes: [] },
        active: true, round: 1, phase: 'commit',
        fighters: [{ key: 'm:cb-erasure', name: 'The Erasure', side: 'monster', charId: '' }]
      });
      window.render();
    }, F.FELL_CHAR_ID);

    await frames.player.evaluate(() => {
      window.handArm('Use a utility', 'act');
      document.querySelector('#hand .hand-pick .hp-opt[data-val="Caltrops"]').click();
      window.handPlaceAt(340, 440);          /* cell [3,4], centre 350,450 */
      window.handPlaceAt(340, 540);          /* cell [3,5], centre 350,550 */
    });
    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);

    /* the LoreMaster reads the declare back and resolves it */
    await frames.lm.evaluate((charId) => {
      window.S.mode = 'combat';
      window.S.map = { w: 2400, h: 1600 };
      window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
      window.S.scene = window.S.scene || {};
      window.S.scene.combatPhase = 'commit';
      window.S.scene.fell = [{ id: 'p1', charId: charId, name: 'Astra', charge: 0, affs: [] }];
      window.S.declares = null; window.declaresLoad();
    }, F.FELL_CHAR_ID);
    await frames.lm.waitForFunction(() => Array.isArray(window.S.declares) && window.S.declares.length > 0);
    await frames.lm.evaluate((c) => window.resolvePlacement(c), F.FELL_CHAR_ID);

    /* it reached the store */
    await page.waitForFunction((c) => {
      const row = window.TSH.store[c];
      return !!row && !!row.snap && (row.snap.tokens || []).filter((t) => t && t.kind === 'marker').length === 2;
    }, F.CAMPAIGN_A);

    /* and it reached the player, which is the whole reason a marker exists */
    await frames.player.waitForFunction(() =>
      (window.S.tokens || []).filter((t) => t && t.kind === 'marker').length === 2);

    const seen = await frames.player.evaluate(() =>
      (window.S.tokens || []).filter((t) => t.kind === 'marker')
        .map((t) => ({ x: t.x, y: t.y, name: t.name, placer: t.placer, charId: t.charId || '' })));
    expect(seen.map((t) => ({ x: t.x, y: t.y })),
      'on the squares the player chose, all the way round')
      .toEqual([{ x: 350, y: 450 }, { x: 350, y: 550 }]);
    seen.forEach((t) => {
      expect(t.name).toBe('Caltrops');
      expect(t.placer, 'carrying who put it there').toBe(F.FELL_CHAR_ID);
      expect(t.charId, 'and still not impersonating them after the round trip').toBe('');
    });

    /* and it is still not something the player may aim at, on the far side of the wire */
    expect(await frames.player.evaluate(() =>
      (window.S.tokens || []).filter((t) => t.kind === 'marker')
        .every((t) => window.tokenTargetable(t) === false))).toBe(true);
  });

  test('a marker occupies its square, so an open-space utility is refused onto it', async ({ page }) => {
    /* Darkshard is "set in an open space". handSquareTaken counts every token's footprint,
       and a marker is a token, so a marker already down blocks one. That was true by
       construction before piece 3 and only becomes reachable now that markers exist. */
    await T.openTable(page, { player: { role: 'player', campaignId: F.CAMPAIGN_A,
      characterId: F.FELL_CHAR_ID, character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A } });
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seatPlayer(player);

    await player.evaluate(() => {
      window.tsHandTake({ charge: 1,
        acts: [{ src: 'utility', nm: 'Use a utility', desc: 'Spend your Act on a utility.',
                 dmg: 0, base: 0, dt: null, tier: null, kind: 'standard',
                 contest: 'evasion', castSkill: '', locked: false, bar: '' }],
        reacts: [], skills: {},
        items: [{ name: 'Darkshard', qty: 1, use: 'Act', roll: 'none', target: 'place',
                  places: 1, space: 'empty' }],
        stances: [], gates: { noAct: false, noReact: false, notes: [] },
        active: true, round: 1, phase: 'commit',
        fighters: [{ key: 'm:cb-erasure', name: 'The Erasure', side: 'monster', charId: '' }] });
      window.handArm('Use a utility', 'act');
      document.querySelector('#hand .hand-pick .hp-opt[data-val="Darkshard"]').click();
    });

    /* a tap anywhere in cell [8,8], which is the marker's square once snapped */
    const taken = await player.evaluate(() => window.handSquareTaken(850, 850));
    expect(taken, 'the marker is what is standing there').toBe('Caltrops');
    await player.evaluate(() => window.handPlaceAt(800, 800));
    expect(await player.evaluate(() => (window.armed.places || []).length),
      'a shard needs an open space and that one is not open').toBe(0);
  });
});
