/* S3c — which fighter a token is.
 *
 * The board and the fight name their people differently, and this is the seam between
 * them. It is built and proven on its own, before any gesture sits on it, because its
 * failure mode is the worst one available here: not an error, but a real attack landing
 * on the wrong creature, discovered a round later when someone's Vitality is wrong.
 *
 * So the property under test is not only "the right token resolves to the right
 * fighter". It is also "everything else resolves to nothing", which is the half that
 * keeps a wrong answer from ever being produced.
 *
 * The two sides:
 *   FateWell publishes fighters as 'm:<combatantId>' for foes and NPCs and
 *   'p:<playerId>' for the Fell, the latter carrying charId as well (combatFighters,
 *   docs/fatewell.html).
 *   ThreadSpire's foe tokens carry refId, which is the scene foe's id, which came from
 *   the very same combatant through tsSpineScene and tsCastFoe. Fell tokens carry
 *   charId, and their refId is NOT dependable: scene-built Fell carry the player id
 *   there, roster-built Fell carry the character id.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function playerOnly() {
  return {
    player: {
      role: 'player',
      campaignId: F.CAMPAIGN_A,
      characterId: F.FELL_CHAR_ID,
      character: F.CHARACTER_A,
      characters: [F.CHARACTER_A],
      party: F.PARTY_A
    }
  };
}

/* A published board, shaped as combatFighters builds one. */
const FIGHTERS = [
  { key: 'm:cb-erasure', name: 'The Erasure', side: 'monster', charId: '' },
  { key: 'm:cb-swordsman', name: 'Masked Swordsman', side: 'monster', charId: '' },
  { key: 'm:cb-herald', name: 'The Herald', side: 'npc', charId: '' },
  { key: 'p:pl-7', name: 'Alarik', side: 'fell', charId: F.FELL_CHAR_ID }
];

async function seat(frame, opts) {
  opts = opts || {};
  await frame.evaluate(({ fighters, active, tokens }) => {
    window.S.role = 'player';
    window.S.mode = 'combat';
    window.S.tokens = tokens;
    window.tsHandTake({ charge: 0, acts: [], reacts: [], skills: {}, items: [], stances: [],
                        gates: { noAct: false, noReact: false, notes: [] },
                        active: active, round: 1, fighters: fighters });
    window.render();
  }, { fighters: opts.fighters || FIGHTERS, active: opts.active !== false, tokens: opts.tokens || [] });
}

const keyOf = (frame, tokenId) => frame.evaluate((id) => {
  const t = (window.S.tokens || []).find((x) => x.id === id);
  return window.tokenTargetKey(t);
}, tokenId);

const targetable = (frame, tokenId) => frame.evaluate((id) => {
  const t = (window.S.tokens || []).find((x) => x.id === id);
  return window.tokenTargetable(t);
}, tokenId);

/* These cases set S.tokens and S.mode locally and then assert on what the page did
 * with them. The shared-store poll writes both of those from the feed, so a poll landing
 * mid-test replaces the very state under test and the case fails for a reason that has
 * nothing to do with what it is asking. That is correct product behaviour, the LoreMaster
 * owns the board, and it makes the feed the wrong thing to leave running while measuring
 * local rendering. Pinned after boot; the specs that are ABOUT sync leave it alone. */
async function pinFeed(frame) {
  await frame.evaluate(() => { window.applyRemoteSnapshot = function () {}; });
}

test.describe('S3c a token resolves to the fighter it is, or to nothing', () => {

  test('a foe token resolves to its combatant', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await seat(player, { tokens: [
      { id: 'tk1', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure' },
      { id: 'tk2', kind: 'foe', refId: 'cb-swordsman', name: 'Masked Swordsman' }
    ] });

    expect(await keyOf(player, 'tk1')).toBe('m:cb-erasure');
    expect(await keyOf(player, 'tk2')).toBe('m:cb-swordsman');
  });

  test('two foes of the same kind do not collapse onto one another', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    /* the case that matters: two copies of one library foe, same name, different
       combatants. Hitting "the other one" is invisible until someone dies wrong. */
    await seat(player, {
      fighters: [
        { key: 'm:cb-a', name: 'Masked Swordsman', side: 'monster', charId: '' },
        { key: 'm:cb-b', name: 'Masked Swordsman', side: 'monster', charId: '' }
      ],
      tokens: [
        { id: 'tkA', kind: 'foe', refId: 'cb-a', name: 'Masked Swordsman' },
        { id: 'tkB', kind: 'foe', refId: 'cb-b', name: 'Masked Swordsman' }
      ]
    });

    const a = await keyOf(player, 'tkA');
    const b = await keyOf(player, 'tkB');
    expect(a).toBe('m:cb-a');
    expect(b).toBe('m:cb-b');
    expect(a).not.toBe(b);
  });

  test('an NPC token resolves the same way a foe does', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await seat(player, { tokens: [{ id: 'tk3', kind: 'npc', refId: 'cb-herald', name: 'The Herald' }] });
    expect(await keyOf(player, 'tk3')).toBe('m:cb-herald');
  });

  test('a Fell resolves on charId, from either kind of token', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    /* the scene-built token carries the LoreMaster's player id in refId, the
       roster-built one carries the character id. Both are the same Fell and both must
       land on the same fighter; building 'p:' + refId would get one right and one
       silently wrong. */
    await seat(player, { tokens: [
      { id: 'tkScene', kind: 'p', refId: 'pl-7', charId: F.FELL_CHAR_ID, name: 'Alarik' },
      { id: 'tkRoster', kind: 'p', refId: F.FELL_CHAR_ID, charId: F.FELL_CHAR_ID, name: 'Alarik' }
    ] });

    expect(await keyOf(player, 'tkScene')).toBe('p:pl-7');
    expect(await keyOf(player, 'tkRoster'), 'the roster token is the same Fell').toBe('p:pl-7');
  });

  /* ---- everything that must resolve to nothing ------------------------------------ */

  test('a token for a fighter who is not on the field is inert', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await seat(player, { tokens: [{ id: 'tkGhost', kind: 'foe', refId: 'cb-not-here', name: 'Leftover' }] });

    expect(await keyOf(player, 'tkGhost'), 'no guess, no nearest match').toBe(null);
    expect(await targetable(player, 'tkGhost')).toBe(false);
  });

  test('a Fell token with no charId behind it is inert', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await seat(player, { tokens: [{ id: 'tkAnon', kind: 'p', refId: 'pl-7', charId: '', name: 'Someone' }] });

    /* refId alone WOULD have made 'p:pl-7' here, and it would even have been right.
       It is still refused: the rule is charId or nothing, because the same shortcut is
       wrong for a roster token and there is no way to tell them apart afterwards. */
    expect(await keyOf(player, 'tkAnon')).toBe(null);
  });

  test('scenery is not a combatant', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await seat(player, { tokens: [
      { id: 'tkArt', kind: 'asset', refId: 'cb-erasure', name: 'A brazier' }
    ] });

    /* its refId would resolve if the kind were not checked. It is checked. */
    expect(await keyOf(player, 'tkArt')).toBe(null);
  });

  test('no fight on means nothing can be aimed at', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    const tokens = [{ id: 'tk1', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure' }];

    await seat(player, { tokens, active: true });
    expect(await keyOf(player, 'tk1'), 'targetable while the battle is on').toBe('m:cb-erasure');

    /* the LoreMaster ends the fight; the row goes away and so do the targets */
    await seat(player, { tokens, active: false });
    expect(await keyOf(player, 'tk1')).toBe(null);
    expect(await player.evaluate(() => document.getElementById('hand').classList.contains('hidden')),
      'the row and the targets agree about whether there is a fight').toBe(true);
  });

  test('a board the LoreMaster has not published yet has no targets', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    await seat(player, { fighters: [], tokens: [{ id: 'tk1', kind: 'foe', refId: 'cb-erasure' }] });
    expect(await keyOf(player, 'tk1')).toBe(null);
  });

  test('with no hand at all nothing resolves and nothing throws', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    const r = await player.evaluate(() => {
      window.S.tokens = [{ id: 'tk1', kind: 'foe', refId: 'cb-erasure' }];
      try {
        return { key: window.tokenTargetKey(window.S.tokens[0]),
                 none: window.tokenTargetKey(null), threw: null };
      } catch (e) { return { threw: String(e.message) }; }
    });
    expect(r.threw).toBe(null);
    expect(r.key).toBe(null);
    expect(r.none).toBe(null);
  });

  /* ---- the id chain itself -------------------------------------------------------- */

  test('the id a foe token carries really is the combatant id the fight publishes', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await pinFeed(player);

    /* The whole mapping rests on one claim: that the refId on a foe token is the same id
     * FateWell built 'm:<id>' from. Everything above assumes it. This proves it, by
     * running a LoreMaster's raw scene through the page's OWN spine builder and then
     * through its own token palette, and checking what comes out the far end.
     */
    const chain = await player.evaluate(() => {
      const raw = {
        name: 'Proving ground',
        players: [],
        acts: [{ id: 'a1', name: 'Act', sessions: [{ id: 's1', name: 'Session', scenes: [{
          id: 'sc1', name: 'The fight', entries: [],
          combatants: [
            { id: 'cb-erasure', name: 'The Erasure', sr: 'Champion', side: 'monster', maxVit: 53, abilities: [] },
            { id: 'cb-herald', name: 'The Herald', side: 'npc', type: 'npc' }
          ]
        }] }] }]
      };
      const spine = window.spineFromRawCampaign(raw, 'sc1');
      const scene = spine.acts[0].sessions[0].scenes[0];
      window.S.scene = window.tsSceneFromSpine ? window.tsSceneFromSpine(scene) : scene;
      const palette = window.tokenPalette();
      return {
        sceneFoeIds: (window.S.scene.foes || []).map((f) => f.id),
        paletteFoeRefIds: (palette.foes || []).map((f) => f.refId),
        paletteNpcRefIds: (palette.npcs || []).map((n) => n.refId)
      };
    });

    expect(chain.sceneFoeIds, 'the spine keeps the combatant id').toContain('cb-erasure');
    expect(chain.paletteFoeRefIds, 'and the token offered for it carries that id').toContain('cb-erasure');
    expect(chain.paletteNpcRefIds, 'and so does an NPC').toContain('cb-herald');

    /* so 'm:' + refId is the key the fight published, which is the whole claim */
    await seat(player, { tokens: [{ id: 'tkChain', kind: 'foe', refId: chain.paletteFoeRefIds[0] }] });
    expect(await keyOf(player, 'tkChain')).toBe('m:cb-erasure');
  });
});
