/* A18 — a foe keeps its name for the whole fight.
 *
 * A foe's id is not a label. It is the only thing tying three places together: the token
 * on the board carries it as refId, the published fighters list keys on it, and FateWell
 * finds the combatant by it to apply damage. If it ever changes, all three come apart
 * without a sound - the token stops resolving, the foe goes inert, and a player can see
 * a foe they cannot attack.
 *
 * It used to be minted with Math.random when a combatant carried neither an id nor a
 * libId. The spine is rebuilt whenever the campaign arrives again, which is often, and a
 * token placed before a rebuild kept the name it was placed under. So the bug was never a
 * mismatch between two sources - it was ONE source answering differently the second time
 * it was asked, which is why A16, asking once, could not see it.
 *
 * This asks twice, and it places the foe the way lmPlaceToken does rather than by hand.
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

/* A scene as the CMS hands one over: combatants, and not all of them tidy. The bare one
   is the case that was random - no id, no libId - and the pair from one library entry is
   the case that could collide onto a single identity. */
const RAW_SCENE = {
  id: 'sc-breach', name: 'The Breach',
  combatants: [
    { name: 'The Erasure', sr: 'Champion', type: 'monster', side: 'foe', maxVit: 30, curVit: 30 },
    { libId: 'lib-swordsman', name: 'Masked Swordsman', sr: 'Elite', type: 'monster', side: 'foe', maxVit: 12, curVit: 12 },
    { libId: 'lib-swordsman', name: 'Masked Swordsman 2', sr: 'Elite', type: 'monster', side: 'foe', maxVit: 12, curVit: 12 },
    { id: 'cb-herald', name: 'The Herald', type: 'npc', side: 'npc' }
  ],
  entries: []
};

/* Build the runtime scene the way the LM's own path does. */
const spine = (frame, raw) => frame.evaluate((sc) => {
  const built = window.tsSpineScene(sc, { players: [] });
  window.S.scene = built;
  return { foes: built.foes.map((f) => ({ name: f.name, id: f.id })),
           npcs: built.npcs.map((n) => ({ name: n.name, id: n.id })) };
}, raw);

test.describe('A18 a foe keeps its identity across a rebuild', () => {

  test('the same scene built twice names its foes the same', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    const first = await spine(frames.lm, RAW_SCENE);
    const second = await spine(frames.lm, RAW_SCENE);

    expect(second.foes, 'this is the bug: a rebuild used to rename them').toEqual(first.foes);
    expect(second.npcs, 'and an NPC is targetable too').toEqual(first.npcs);
  });

  test('two foes from one library entry are still two foes', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    const built = await spine(frames.lm, RAW_SCENE);
    const ids = built.foes.map((f) => f.id);
    expect(new Set(ids).size, 'sharing an identity would land one foe\'s damage on both')
      .toBe(ids.length);
  });

  test('no foe is named with anything random', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, bothSides());
    const built = await spine(frames.lm, RAW_SCENE);
    /* the bare combatant is the one that used to be random; it should now be derived */
    const bare = built.foes.find((f) => f.name === 'The Erasure');
    expect(bare.id).toBe('f-x-0');
  });

  test('a token placed before a rebuild still resolves after it', async ({ page }) => {
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

    /* the LoreMaster builds the scene, and places a foe the way the palette does */
    const placed = await frames.lm.evaluate((sc) => {
      window.S.scene = window.tsSpineScene(sc, { players: [] });
      window.S.party = [];
      window.S.map = { w: 2400, h: 1600 };
      window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
      window.S.tokens = [];
      const target = window.tokenPalette().foes[0];
      window.lmPlaceToken('foe', target.refId);
      return { token: window.S.tokens[0], name: target.name };
    }, RAW_SCENE);

    /* then the campaign arrives again, as it does, and the scene is rebuilt underneath */
    const after = await frames.lm.evaluate((sc) => {
      window.S.scene = window.tsSpineScene(sc, { players: [] });
      return { fighters: window.combatFighters(), tokens: window.S.tokens };
    }, RAW_SCENE);

    expect(after.tokens[0].refId, 'the token is untouched by a rebuild, as it must be')
      .toBe(placed.token.refId);

    /* the player, given exactly what the LoreMaster published and placed */
    const resolved = await frames.player.evaluate(({ fighters, tokens, myCharId }) => {
      window.S.role = 'player'; window.S.mode = 'combat';
      window.S.characterId = myCharId;
      window.S.map = { w: 2400, h: 1600 };
      window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
      window.S.tokens = tokens;
      window.sheet.postMessage = function () {};
      window.tsHandTake({ charge: 1, acts: [], reacts: [], skills: {}, items: [], stances: [],
                          gates: { noAct: false, noReact: false, notes: [] },
                          active: true, round: 1, phase: 'commit', fighters: fighters });
      window.renderTokens(); window.render();
      const t = window.S.tokens[0];
      const f = window.tokenFighter(t);
      return { targetable: window.tokenTargetable(t), key: f && f.key, name: f && f.name,
               refId: t.refId, published: fighters.map((x) => x.key) };
    }, { fighters: after.fighters, tokens: after.tokens, myCharId: F.FELL_CHAR_ID });

    expect(resolved.targetable,
      'a foe on the board after a refresh is still a foe you can attack').toBe(true);
    expect(resolved.key).toBe('m:' + resolved.refId);
    expect(resolved.name).toBe(placed.name);
  });

  test('and can actually be attacked, end to end', async ({ page }) => {
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

    const board = await frames.lm.evaluate((sc) => {
      window.S.scene = window.tsSpineScene(sc, { players: [] });
      window.S.party = [];
      window.S.map = { w: 2400, h: 1600 };
      window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
      window.S.tokens = [];
      window.lmPlaceToken('foe', window.tokenPalette().foes[0].refId);
      window.S.scene = window.tsSpineScene(sc, { players: [] });   /* and a refresh */
      return { fighters: window.combatFighters(), tokens: window.S.tokens };
    }, RAW_SCENE);

    const sent = await frames.player.evaluate(({ fighters, tokens, myCharId }) => {
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
      window.tsHandTake({ charge: 1, phase: 'commit', active: true, round: 1,
                          acts: [{ src: 'Ashen Blade', nm: 'Basic attack', desc: 'standard strike',
                                   dmg: 6, base: 3, dt: 'phys', tier: 0, kind: 'weapon',
                                   contest: 'evasion', castSkill: '', locked: false }],
                          reacts: [], skills: {}, items: [], stances: [],
                          gates: { noAct: false, noReact: false, notes: [] }, fighters: fighters });
      window.renderTokens(); window.render();

      window.handArm('Basic attack', 'act');
      /* a real tap on the foe */
      const el = document.querySelector('.token[data-tok="' + tokens[0].id + '"]');
      const r = el.getBoundingClientRect();
      const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
      el.setPointerCapture = function () {}; el.releasePointerCapture = function () {};
      const ev = (n) => new PointerEvent(n, { bubbles: true, cancelable: true, pointerId: 1, clientX: x, clientY: y });
      el.dispatchEvent(ev('pointerdown'));
      el.dispatchEvent(ev('pointerup'));
      const prompt = document.getElementById('tray').classList.contains('awaiting');
      window.handRollDo(4);
      return { prompt: prompt, out: window.__sent };
    }, { fighters: board.fighters, tokens: board.tokens, myCharId: F.FELL_CHAR_ID });

    expect(sent.prompt, 'tapping the foe opened the roll').toBe(true);
    expect(sent.out, 'and the roll committed an attack on it').toHaveLength(1);
    expect(sent.out[0].target).toBe(board.tokens[0].refId ? 'm:' + board.tokens[0].refId : null);
  });
});
