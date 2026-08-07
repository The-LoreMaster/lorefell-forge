# One adventure, one source: shared read/write for FateWell and ThreadSpire

## The problem, stated plainly

There is no single source of truth for an adventure. Today:

- The whole adventure is ONE JSON blob in one field: `Campaigns.data` (optionally gzipped).
- FateWell reads and writes that whole blob.
- ThreadSpire cannot write the whole blob (too large for its live path and no save-back method), so it loads only the ACTIVE SCENE as a "spine" and writes a transient shared-state row for live play.
- The transient row is not storage. On reload ThreadSpire re-reads `Campaigns.data`, which never received its edits. Foe removals, added beats, added scenes are lost.

The two tools hold two different representations and drift. This is the whole bug.

## The principle (Nate's ruling)

The adventure lives in Wix as the ONE source of truth. FateWell and ThreadSpire are both
readers AND writers of that same adventure. Neither is the source; the collection is. If the
blob is too big to write safely as a whole, DECOMPOSE it into per-component collections so
each tool writes only the small piece it changed.

## Why decomposition is the real fix, not a bigger blob

A single blob forces whole-adventure writes. Two writers plus whole-adventure writes equals
last-writer-wins clobbering: ThreadSpire saves the scene it is on, and in doing so overwrites
every scene FateWell just edited, or vice versa. Decomposition removes the conflict: a foe
removed in scene 3 writes ONE scene row, touching nothing else. It also removes the size cap
that started all this, since no single row holds the whole story.

## Proposed collections (decomposed)

The adventure tree is Adventure -> Acts -> Sessions -> Scenes -> (beats, combatants, etc).
Rows carry parent ids so the tree is reassembled on read. All ids are the existing string ids
the tools already mint (mkId), so nothing has to be renumbered.

- **Adventures**: one row per adventure. id, name, ownerMemberId, activeSceneId, order of acts.
  Small. Replaces the role `Campaigns` plays as the adventure's identity, keeps ownership.
- **AdvActs**: id, advId, name, notes, img, desc, order, entries, manualRefs. One row per act.
- **AdvSessions**: id, advId, actId, name, order. One row per session.
- **AdvScenes**: id, advId, actId, sesId, name, prep, img, desc, mode, status, order, and the
  scene's own light fields (beatDone, att, refs, ps, hooks, dis, loot). One row per scene.
  The heavy lists below are their OWN rows so a scene row stays small.
- **AdvBeats**: id, advId, sceneId, order, kind, title, body, speaker, handle, img, pinned,
  posted. One row per beat. Beats are the bulk of the text (the screenshot's long scenes), so
  they must not sit inside the scene row.
- **AdvCombatants**: id, advId, sceneId, side (foe/fell/npc), and the combatant snapshot. One
  row per placed foe/fell/npc in a scene. This is what "remove a foe / add a foe" writes.

Stages, maps, tokens, and players already live in their own collections (Stages, Assets,
CombatPlayer, AdventureMembers) and are referenced by id; they are NOT part of this
decomposition and are left as they are. This change is only the authored STORY tree.

## Read model

- Both tools load an adventure by advId: read the Adventures row, then its AdvActs,
  AdvSessions, AdvScenes for the tree, and lazily the AdvBeats/AdvCombatants for the scene(s)
  being shown. ThreadSpire can still load only the active scene's beats/combatants for speed,
  but the TREE (all acts/sessions/scenes, names and order) is always loaded whole, so it can
  never overwrite scenes it did not load. That single rule kills the "spine clobbers the rest"
  failure directly.

## Write model

- Every edit writes the SMALLEST row that changed, by id, via a backend method that updates
  one row: saveAdvScene(scene), saveAdvBeat(beat), removeAdvCombatant(id), addAdvCombatant(c),
  saveAdvAct(act), etc. Backup-first read-modify-write, suppressAuth after an ownership/role
  check (the same check saveCampaign already does).
- The live shared-state row stays exactly as it is for real-time play (tokens, map, phase, log).
  It is the relay; the collections are the truth. They stop fighting because they stop
  overlapping: the relay never persists story, the collections never carry live token nudges.

## Migration (must be safe; touches saved campaigns)

1. Backup every `Campaigns` row first (scripts/backup.js already exists; extend it).
2. A one-time migration reads each `Campaigns.data` blob, decomposes it into the new rows,
   and records the advId mapping. It is ADDITIVE: it does not delete `Campaigns` until both
   tools read/write the new collections and a full adventure round-trips byte-clean.
3. Dual-read window: the tools read new collections but fall back to the old blob if an
   adventure has not been migrated yet, so nothing breaks mid-migration.
4. Only after every adventure is migrated and verified does the old blob path retire.

## Sequencing (each its own PR, gated, approved before apply.yml fires)

1. Schemas for the six collections + apply wiring. Backup-first. No reads/writes yet.
2. Backend read methods (load the tree; load a scene's beats/combatants).
3. Backend write methods (per-row saves, ownership-checked, backup-first).
4. The one-time migration script, additive, reversible, verified round-trip.
5. FateWell switched to read/write the collections (dual-read fallback on).
6. ThreadSpire switched to read the whole tree and write per-row (dual-read fallback on).
7. Verify a full adventure edits in both tools and persists. Then retire the blob path.

## Open questions for Nate before step 1

- Is `Campaigns` kept as the Adventures identity row (rename in place), or a fresh Adventures
  collection with `Campaigns` migrated in and retired? Rename-in-place is less disruptive.
- Beats can be large and many. One row per beat is cleanest for conflict-free writes but means
  more rows per adventure. Acceptable, or should beats batch per scene into one row?
- Any adventure currently mid-play we must not migrate during a live session?
