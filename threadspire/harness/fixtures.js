/* Fixtures for the tabletop harness.
 *
 * Loaded two ways on purpose: as a <script> by harness/host.html, and as a CommonJS
 * module by the Playwright specs. One copy of the data, so a spec's expected act and
 * scene counts are DERIVED from the same fixture the harness serves rather than typed
 * in by hand. A hand-typed count is a second source of truth, and the moment the
 * fixture changes it silently starts asserting the wrong thing.
 *
 * Shape note: rawCampaign is the authored campaign record as loadCampaign() returns it
 * (velo/page-threadspire.js buildContext puts blob.data here). ThreadSpire builds its
 * own spine from it in spineFromRawCampaign(): acts[].sessions[].scenes[], where a
 * scene's prose lives in `entries` and its combatants in `combatants`, and the Fell
 * written into every scene come from the campaign-level `players`.
 */
(function (factory) {
  var v = factory();
  if (typeof module === 'object' && module.exports) module.exports = v;
  if (typeof window !== 'undefined') window.TS_FIXTURES = v;
})(function () {
  'use strict';

  function scene(id, name, beats) {
    return {
      id: id,
      name: name,
      entries: (beats || []).map(function (b, i) {
        return { type: 'general', title: b, body: 'Beat ' + (i + 1) + ' of ' + name + '.' };
      }),
      combatants: []
    };
  }

  /* Adventure A. The one a LoreMaster boots on. Two acts, three scenes. */
  var BEACONS = {
    name: 'The Beacons of Ruin',
    players: [],
    acts: [
      {
        id: 'act-bea-1', name: 'Act I: The Signal',
        sessions: [{
          id: 'ses-bea-1', name: 'Session 1',
          scenes: [
            scene('sc-bea-1', 'The Watchfire', ['The fire is lit', 'Someone answers']),
            scene('sc-bea-2', 'The Long Road', ['Tracks in the ash'])
          ]
        }]
      },
      {
        id: 'act-bea-2', name: 'Act II: The Answer',
        sessions: [{
          id: 'ses-bea-2', name: 'Session 1',
          scenes: [scene('sc-bea-3', 'The Ruined Tower', ['What the beacon called'])]
        }]
      }
    ]
  };

  /* Adventure B. The one switched TO. Deliberately a different shape from A: three acts
   * and five scenes, so "the new adventure's story stood up" cannot pass by accident on
   * A's numbers, and so neither matches advBlank()'s one-act-one-scene empty table. */
  var STONE = {
    name: 'Stone and Sovereign',
    players: [],
    acts: [
      {
        id: 'act-sto-1', name: 'Act I: The Quarry',
        sessions: [{
          id: 'ses-sto-1', name: 'Session 1',
          scenes: [
            scene('sc-sto-1', 'The Cut Face', ['Stone remembers']),
            scene('sc-sto-2', 'The Overseer', ['A tally that does not add up'])
          ]
        }]
      },
      {
        id: 'act-sto-2', name: 'Act II: The Court',
        sessions: [{
          id: 'ses-sto-2', name: 'Session 1',
          scenes: [
            scene('sc-sto-3', 'The Antechamber', ['Waiting is the test']),
            scene('sc-sto-4', 'The Sovereign', ['The crown speaks'])
          ]
        }]
      },
      {
        id: 'act-sto-3', name: 'Act III: The Weight',
        sessions: [{
          id: 'ses-sto-3', name: 'Session 1',
          scenes: [scene('sc-sto-5', 'The Undercroft', ['What the stone was holding up'])]
        }]
      }
    ]
  };

  var CAMPAIGN_A = 'cmp-beacons-0001';
  var CAMPAIGN_B = 'cmp-stone-0002';

  /* The Fell that joins in S1.
   *
   * Deliberately NOT written into BEACONS.players. A Fell in the roster that has never
   * been placed in a scene is the exact case docs/threadspire.html calls out in
   * tokenPalette(): the palette used to offer only the Fell already written into the
   * scene, so a Fell who had joined but never been placed could not be found at all.
   * Requirement B1 says roster and tokens must agree, and this is the arrangement where
   * that can actually fail. Putting the Fell in `players` too would test nothing.
   */
  var FELL_CHAR_ID = 'chr-maerwen-0001';
  var PARTY_A = [{
    memberId: 'mem-0001',
    memberName: 'Ilse',
    charId: FELL_CHAR_ID,
    name: 'Maerwen Ash',
    charName: 'Maerwen Ash',
    level: 3,
    maxVit: 28,
    image: ''
  }];

  /* What TS_CHAR_LOAD hands back for that Fell. */
  var CHARACTER_A = {
    id: FELL_CHAR_ID,
    name: 'Maerwen Ash',
    level: 3,
    maxVit: 28,
    curVit: 28
  };

  /* What TS_CAMPAIGN_LIST hands back: every adventure this member runs. The Settings
   * dropdown is built straight from this, and S2 picks adventure B out of it. */
  var CAMPAIGN_LIST = [
    { id: CAMPAIGN_A, name: BEACONS.name, role: 'loremaster' },
    { id: CAMPAIGN_B, name: STONE.name, role: 'loremaster' }
  ];

  /* Derive the act and scene count from the fixture itself, the same walk seamsBody()
   * does for its "Story here" line. Specs compare against this, never a typed number. */
  function countStory(raw) {
    var acts = (raw && raw.acts) || [];
    var scenes = 0;
    acts.forEach(function (a) {
      (a.sessions || []).forEach(function (se) { scenes += (se.scenes || []).length; });
    });
    return { acts: acts.length, scenes: scenes };
  }

  return {
    CAMPAIGN_A: CAMPAIGN_A,
    CAMPAIGN_B: CAMPAIGN_B,
    BEACONS: BEACONS,
    STONE: STONE,
    PARTY_A: PARTY_A,
    CHARACTER_A: CHARACTER_A,
    FELL_CHAR_ID: FELL_CHAR_ID,
    CAMPAIGN_LIST: CAMPAIGN_LIST,
    countStory: countStory,
    byId: function (id) { return id === CAMPAIGN_B ? STONE : (id === CAMPAIGN_A ? BEACONS : null); }
  };
});
