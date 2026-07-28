/* A25 — the LoreMaster can see whether the squares arrived.
 *
 * This is a diagnostic, and it is here for one reason: piece 3 of the placed utilities
 * (real markers on the board at resolution) must not be built on an unproven pipe. F7 was
 * written up as one missing line in velo and turned out to be three sites and a JSON
 * encoding - and a write-only fix would have passed every test in this harness while the
 * LoreMaster never read a single square back.
 *
 * So what is guarded here is not "it shows the squares". It is that the readout tells the
 * THREE cases apart, because each accuses a different part of the pipe:
 *
 *   listed        row -> sheet -> store -> LoreMaster is whole
 *   empty array   the field came back with nothing in it: the write path or the encoding
 *   absent        the field is not on the record: the declare read is not selecting it
 *   unparsed      it came back as the raw JSON string: jparse is missing on that read
 *
 * A readout that renders nothing for the last three would be worse than no readout at
 * all, because "I see no squares" would look exactly like "there was no placement".
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function lmOnly() {
  return {
    lm: { role: 'lm', campaignId: F.CAMPAIGN_A, characters: [F.CHARACTER_A], party: F.PARTY_A }
  };
}

/* the LoreMaster's own view, with one Fell in the fight and one declare against them */
async function seatLm(frame, declare) {
  await frame.evaluate(() => {
    window.applyRemoteSnapshot = function () {};
    window.ensureSheet = function () {};
    var _sf = document.getElementById('sheetFrame'); if (_sf) _sf.remove();
  });
  await frame.evaluate(({ dcl, charId }) => {
    window.S.role = 'lm'; window.S.mode = 'combat';
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.scene = window.S.scene || {};
    window.S.scene.combatPhase = 'commit';
    window.S.scene.foes = [];
    window.S.scene.fell = [{ id: 'p1', charId: charId, name: 'Astra', charge: 0, affs: [] }];
    window.S.declares = dcl ? [dcl] : [];
  }, { dcl: declare, charId: F.FELL_CHAR_ID });
}

/* the readout as the LoreMaster would read it, straight off the built html */
const ground = (frame) => frame.evaluate(({ charId }) => {
  var html = window.fellDeclareHtml({ charId: charId, id: 'p1', charge: 0, affs: [] });
  var box = document.createElement('div');
  box.innerHTML = html;
  var rows = [...box.querySelectorAll('.bt-row')];
  var row = rows.filter((r) => (r.querySelector('.bt-lbl') || {}).textContent === 'Ground')[0];
  if (!row) return null;
  return {
    text: row.textContent.replace('Ground', '').trim(),
    title: (row.querySelector('[title]') || {}).title || ''
  };
}, { charId: T.FIXTURES.FELL_CHAR_ID });

const base = {
  charId: F.FELL_CHAR_ID, act: 'Use a utility · Caltrops', react: '', target: '',
  round: 1, dmg: 0, base: 0, dt: '', roll: 0, acc: 0, kind: 'standard', affs: []
};

test.describe('A25 proof the squares made the trip', () => {

  test('the squares are named as squares, not as pixels', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    /* the centres of cells [3,4] and [3,5] on a 100 grid, which is what the row sends */
    await seatLm(lm, Object.assign({}, base, { places: [{ x: 350, y: 450 }, { x: 350, y: 550 }] }));

    const g = await ground(lm);
    expect(g, 'a placement declare gets a Ground row').not.toBeNull();
    expect(g.text).toBe('[3,4] [3,5]');
    expect(g.title, 'and the raw pair is kept, so nothing is lost in the translation')
      .toContain('350');
  });

  /* the three failures, each of which accuses a different part of the pipe */

  test('an empty array says so, rather than showing nothing', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { places: [] }));

    const g = await ground(lm);
    expect(g, 'the row is still there - silence would read as "no placement"').not.toBeNull();
    expect(g.text).toMatch(/empty/i);
  });

  test('a missing field is called missing, not empty', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base));       /* no places key at all */

    const g = await ground(lm);
    expect(g).not.toBeNull();
    expect(g.text, 'the read is not selecting it - a different fault from losing it')
      .toMatch(/not sent/i);
    expect(g.text).not.toMatch(/empty/i);
  });

  test('an unparsed JSON string is shown verbatim', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    /* exactly what the collection holds: places is a TEXT field */
    await seatLm(lm, Object.assign({}, base, { places: '[{"x":350,"y":450}]' }));

    const g = await ground(lm);
    expect(g).not.toBeNull();
    expect(g.text, 'jparse is missing on that read, and the string proves it')
      .toMatch(/unparsed/i);
    expect(g.text).toContain('350');
  });

  test('a null field is not mistaken for an empty one', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { places: null }));

    const g = await ground(lm);
    expect(g).not.toBeNull();
    expect(g.text).toMatch(/not sent/i);
  });

  test('a declare that is not a placement gets no Ground row', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, {
      act: 'Ashen Blade · Basic attack', places: [], roll: 4, dmg: 6, base: 3
    }));

    expect(await ground(lm), 'a sword swing has no ground to report').toBeNull();
  });

  test('the grid offset is honoured, not assumed away', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { places: [{ x: 375, y: 475 }] }));
    await lm.evaluate(() => { window.S.grid = { size: 100, offX: 25, offY: 25, opacity: 0.5 }; });

    const g = await ground(lm);
    expect(g.text, 'a shifted grid names the same square it draws').toBe('[3,4]');
  });

  /* ---- the whole road, on the harness store ----
     Everything above hands the readout a declare directly, which proves it can tell the
     four cases apart but proves nothing about the pipe. This one lays a real Caltrops on
     the player's row and reads it off the LoreMaster's board, through the same store,
     JSON-encoded on the way in and parsed on the way out exactly as the collection does.

     It CANNOT prove the live path. Production is a different store with its own three
     read sites, which is the whole reason the readout exists and the reason piece 3 is
     still on hold. What it does prove is that everything on THIS side of velo is sound,
     so if the live readout comes back empty, velo is where to look and not here. */
  test('a real placement travels the road and lands in the readout', async ({ page }) => {
    const frames = await T.openTableAndBoot(page, {
      lm: { role: 'lm', campaignId: F.CAMPAIGN_A, rawCampaign: F.BEACONS, party: F.PARTY_A },
      player: {
        role: 'player', campaignId: F.CAMPAIGN_A, characterId: F.FELL_CHAR_ID,
        character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A
      }
    });

    await frames.player.evaluate(() => {
      window.applyRemoteSnapshot = function () {};
      window.ensureSheet = function () {};
      var _sf = document.getElementById('sheetFrame'); if (_sf) _sf.remove();
    });
    await frames.player.evaluate((charId) => {
      window.S.role = 'player'; window.S.mode = 'combat';
      window.S.characterId = charId;
      window.S.map = { w: 2400, h: 1600 };
      window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
      window.S.tokens = [];
      /* the sheet's half, posting on up the way fellglass does - including the act name
         it builds for a utility, "Use a utility · Caltrops", which is where the LoreMaster
         reads the utility's name from */
      window.sheet.postMessage = function (m) {
        if (!m || m.type !== 'ts-declare') return;
        window.parent.postMessage({ type: 'TS_TOOL_UP', tool: 'fellglass', msg: {
          type: 'combat-declare', charId: window.S.characterId,
          act: m.item ? (m.act + ' · ' + m.item) : m.act,
          react: '', target: m.target || '', round: m.round,
          places: m.places,
          dmg: 0, base: 0, dt: '', fellmark: false, doubleFell: false, pierce: 0,
          applies: '', actTier: 0, acc: 0, roll: 0, kind: 'standard', fellstrike: false,
          charge: 1, curVit: 28, maxVit: 28, affs: [], reqId: 7
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
      window.renderTokens(); window.render();
    }, F.FELL_CHAR_ID);

    await frames.player.evaluate(() => {
      window.handArm('Use a utility', 'act');
      document.querySelector('#hand .hand-pick .hp-opt[data-val="Caltrops"]').click();
      window.handPlaceAt(340, 440);          /* cell [3,4] */
      window.handPlaceAt(340, 540);          /* cell [3,5] */
    });

    await page.waitForFunction((c) => window.TSH.declares(c).length > 0, F.CAMPAIGN_A);
    await frames.lm.evaluate(() => { window.S.declares = null; window.declaresLoad(); });
    await frames.lm.waitForFunction(() => Array.isArray(window.S.declares) && window.S.declares.length > 0);

    /* the LoreMaster's own board, with the Fell on it, and the readout as they see it */
    await frames.lm.evaluate((charId) => {
      /* in the fight, not merely at the table: fellDeclareHtml says nothing at all out of
         combat, so without this the readout comes back empty for the one reason that has
         nothing to do with the squares */
      window.S.mode = 'combat';
      window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
      window.S.scene = window.S.scene || {};
      window.S.scene.combatPhase = 'commit';
      window.S.scene.fell = [{ id: 'p1', charId: charId, name: 'Astra', charge: 0, affs: [] }];
    }, F.FELL_CHAR_ID);

    const seen = await frames.lm.evaluate((cid) => window.declareFor(cid), F.FELL_CHAR_ID);
    expect(seen, 'the declaration arrived').toBeTruthy();
    expect(seen.act, 'wearing the utility name the readout keys on').toContain('Caltrops');

    const g = await ground(frames.lm);
    expect(g, 'and it gets a Ground row').not.toBeNull();
    expect(g.text, 'both squares, all the way from the row to the board').toBe('[3,4] [3,5]');
  });

  test('a square that arrived malformed is not silently dropped', async ({ page }) => {
    await T.openTable(page, lmOnly());
    const lm = await T.frameFor(page, 'lm');
    await T.waitBooted(page, lm, 'lm');
    await seatLm(lm, Object.assign({}, base, { places: [{ x: 350, y: 450 }, { y: 550 }] }));

    const g = await ground(lm);
    expect(g.text, 'two were sent, so two are shown, and the bad one is visible as bad')
      .toBe('[3,4] [?]');
  });
});
