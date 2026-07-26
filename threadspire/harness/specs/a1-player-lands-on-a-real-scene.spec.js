/* A1, the player's half — a player never lands on a scene the adventure does not have.
 *
 * ORACLE: THREADSPIRE_REQUIREMENTS.md, section A.
 *
 *   A1. Opening an adventure loads its story. Its acts and scenes must be present, not
 *       an empty table.
 *
 * This is the permanent guard for the player side of the sc-default defect, which until
 * now could only be seen by reading the code. The chain was:
 *
 *   advBlank() seeds S.adventure.activeSceneId with its own placeholder id, 'sc-default'.
 *   loadAdventureSpine honours any truthy incoming activeSceneId, so the fallback to the
 *   first authored scene never ran, and tsSceneById could not resolve 'sc-default'
 *   against the acts it had just built, leaving the table on the empty Lobby.
 *
 * It reached players because pushAdventure sends S.adventure wholesale, carrying the
 * dangling id to the whole party, and the correction in applyRemoteSnapshot could not
 * help: it skips when snap.activeSceneId equals the reader's own S.scene.id, and both
 * sides were sitting on 'sc-default'. Both agreed, so neither could tell.
 *
 * The fix makes loadAdventureSpine check that the id resolves against the acts it just
 * built and fall back to the first authored scene when it does not, REGARDLESS of where
 * the bad id came from. So this spec asserts the general property, not just the Lobby
 * case: a reimported adventure's leftover scene id has to recover the same way.
 *
 * A player is booted alone here, and seeded with the adventure rather than handed it by
 * a live LoreMaster. That is for determinism, not necessity: the point of these three
 * cases is what the PLAYER does with a given activeSceneId, so the id wants to be chosen
 * rather than whatever a second frame happened to publish. The spine is built by the
 * page's OWN spineFromRawCampaign, so the data takes exactly the shape a LoreMaster
 * would have published, and only the activeSceneId is forged.
 *
 * An earlier version of this comment claimed a live LoreMaster was unworkable because an
 * ordinary push would replace the row and drop the adventure key. That was wrong, and it
 * was the harness's fault, not the product's: saveCampaignState merges, keeping keys a
 * push does not mention, and the mock replaced instead. The mock now merges too, so a
 * live-LoreMaster handover is a perfectly good scenario and worth writing as its own.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;
const FIRST_SCENE = F.BEACONS.acts[0].sessions[0].scenes[0].id;

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

/* Publish an adventure to the shared row the way a LoreMaster does, with its
 * activeSceneId forged to `danglingId`. The spine itself is built inside the page by the
 * real spineFromRawCampaign, so nothing about its shape is guesswork here. */
async function publishAdventureWithActiveScene(page, frame, danglingId) {
  const spine = await frame.evaluate(
    ({ raw, id }) => window.spineFromRawCampaign(raw, id),
    { raw: F.BEACONS, id: danglingId }
  );
  expect(spine, 'the page could not build a spine from the fixture').toBeTruthy();
  expect(spine.activeSceneId).toBe(danglingId);

  return page.evaluate(
    ({ c, s }) => window.TSH.seedStore(c, { adventure: s, advRev: 1 }),
    { c: F.CAMPAIGN_A, s: spine }
  );
}

test.describe('A1 a player lands on a real scene', () => {

  test('the Lobby placeholder never becomes the player\'s scene', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');

    /* Before the story arrives the player is on the empty table, which is correct: there
     * is nothing else for them to be on yet. This is the state the defect made permanent. */
    expect(await player.evaluate(() => window.S.scene.id)).toBe('sc-default');

    await publishAdventureWithActiveScene(page, player, 'sc-default');

    /* The story arrives on the feed, and the player must land on a scene the adventure
     * actually contains. */
    await player.waitForFunction(
      (n) => (window.S.adventure.acts || []).length === n,
      F.countStory(F.BEACONS).acts
    );
    await player.waitForFunction((id) => window.S.scene.id === id, FIRST_SCENE);

    const landed = await player.evaluate(() => ({
      sceneId: window.S.scene.id,
      activeSceneId: window.S.adventure.activeSceneId,
      sceneName: window.S.scene.name
    }));

    expect(landed.sceneId).toBe(FIRST_SCENE);
    expect(landed.sceneId).not.toBe('sc-default');
    expect(landed.sceneName).not.toBe('Lobby');

    /* The adventure's own record of where the table is must be repaired too, not merely
     * the scene being displayed. Leaving a dangling id there would put it straight back
     * into sharedSnapshot and on to everyone else. */
    expect(landed.activeSceneId).toBe(FIRST_SCENE);
  });

  test('a leftover scene id from a reimport recovers the same way', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');

    /* Not the Lobby placeholder: an id shaped like a real scene, from an adventure that
     * was deleted and reimported under fresh ids. The fix is meant to be about
     * resolvability, not about one known-bad constant, and this is what proves it. */
    await publishAdventureWithActiveScene(page, player, 'sc-bea-1-from-the-old-import');

    await player.waitForFunction(
      (n) => (window.S.adventure.acts || []).length === n,
      F.countStory(F.BEACONS).acts
    );
    await player.waitForFunction((id) => window.S.scene.id === id, FIRST_SCENE);

    expect(await player.evaluate(() => window.S.scene.id)).toBe(FIRST_SCENE);
    expect(await player.evaluate(() => window.S.adventure.activeSceneId)).toBe(FIRST_SCENE);
  });

  test('a scene id that does resolve is still honoured', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');

    /* The fallback must not become a bulldozer. A LoreMaster who is genuinely on the
     * third scene has to bring the party there, so a resolvable id is left alone. */
    const realLater = F.BEACONS.acts[1].sessions[0].scenes[0].id;
    await publishAdventureWithActiveScene(page, player, realLater);

    await player.waitForFunction((id) => window.S.scene.id === id, realLater);

    expect(await player.evaluate(() => window.S.scene.id)).toBe(realLater);
    expect(await player.evaluate(() => window.S.scene.id)).not.toBe(FIRST_SCENE);
  });

});
