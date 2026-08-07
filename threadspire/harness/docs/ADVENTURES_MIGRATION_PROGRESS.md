# Adventures rearchitecture: progress and what remains

Nate's ruling: one adventure, one source. Fresh Adventures collection, Campaigns migrated and
retired. Beats batched per scene. Terminology is Adventures, not Campaigns.

## Done (this PR)

- Four collections: Adventures (root), AdvActs, AdvSessions, AdvScenes. Scenes carry beats and
  combatants as JSON, batched per scene. createCollection.js auto-creates them.
- Backend velo/backend/adventures.web.js, hand-paste as a NEW backend web module:
  - loadAdventure(advId): the whole tree, in the in-memory shape the tools already hold.
  - saveAdventureRoot / saveAdvAct / saveAdvSession / saveAdvScene: per-row writes, id-addressed,
    ownership-checked, so one edit writes one small row.
  - removeAdvScene / removeAdvSession / removeAdvAct.
  - migrateCampaign(campaignId): decomposes one Campaigns.data blob into the tree, additive and
    idempotent, keeps the same id so members/players/stages still resolve, returns a clean flag
    comparing scenes written to scenes read back.

## Remaining (next PRs)

1. **Paste + apply.** Nate pastes adventures.web.js as a new backend module; apply.yml creates
   the four collections.
2. **Page bridges.** ThreadSpire and FateWell pages need to expose the new methods to their
   embeds, the same way they expose loadCampaign/saveCampaign today.
3. **FateWell read/write.** Switch FateWell from loadCampaign/saveCampaign(blob) to
   loadAdventure + the per-row saves. On open, migrate on first touch if the adventure has a
   Campaigns row and no Adventures row yet (call migrateCampaign once, then read the tree).
4. **ThreadSpire read/write.** This is the one that fixes the reported bug. Replace
   spineFromRawCampaign / loadAdventureSpine (lossy, active-scene-only) with loadAdventure (whole
   tree, lossless). Every edit that calls storySave now ALSO writes the changed row via
   saveAdvScene/saveAdvAct/etc. The live shared-state row stays for real-time play; it stops
   carrying story, the collections carry story.
5. **Migrate all + retire the blob.** A one-time pass migrates every Campaigns row (migrateCampaign
   loops the collection), verifies clean round-trip, then the loadCampaign/saveCampaign blob path
   is removed and Campaigns retired.

## The rule that kills the bug

ThreadSpire must load the WHOLE tree, not a spine. A writer that holds only the active scene and
saves will overwrite the scenes it did not load. loadAdventure returns everything; the per-row
saves touch only what changed. Those two together mean an edit in scene 3 can never delete scene 4.

## Lossy spine, for the record

The old tsSpineScene reduced every scene to { id, name, beats:[{kind,title,body}], foes, npcs, fell }
and dropped beat speaker/handle/img/pinned/posted and scene prep/desc/mode/status/att/refs/ps/hooks/
dis/loot/battle. That is why a save-back from the old ThreadSpire would have destroyed content,
including beat images. The new path carries the whole scene, so nothing is lost.
