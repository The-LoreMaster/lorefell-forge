# LoreFell Forge Change Log

Build batches pushed to this repo, newest at the top. The apply workflow is manual, so a push here changes the repo only. Collections change in Wix when the apply workflow runs.

---

## 2026-06-24 — FoeForge: blank start, live abilities only, provenance badges, full text

- Removed the demo foe. The builder opens blank, no name and no preset infusions, augmentations, or acts
- Dropped the sample act list. Acts now come only from SigilForge submissions, submitted and canonized, with an empty state when none exist
- Each ability, infusion, and augmentation carries a Canon or Submitted badge
- Abilities show their full description, not the shorthand. getCreations now returns fullText

## 2026-06-24 — FoeForge wired: submit to the Pentifax, builder reads live components

- Submit routes a foe to the Pentifax, the foe canon hall (Creations, kind foe, meta hall pentifax). Save stays private and local
- The builder reads abilities, infusions, and augmentations, official and submitted. Infusions and augmentations come from their collections plus ShardForge submissions, abilities from SigilForge creations
- Live components feed the pickers and the client validator. The baked pack and sample acts remain as an offline fallback
- Added a foeforge ForgeConfig row, loremaster access. Ability cost defaults to the tier minimum since SigilForge does not store a numeric cost yet

## 2026-06-24 — BondForge portraits no longer click to enlarge

- Removed the in-place zoom from catalog, ledger, and preview portraits. They fill their panel and do nothing on tap

## 2026-06-24 — Add SYNC_RUNBOOK for a two-token chat

- Documented the full loop a chat with forge and vault tokens follows: edit vault canon, regenerate seed, push both, dispatch the Apply Action for Wix
- Spelled out what is automatic (Pages, seed via Action) and what is manual (Velo paste)

## 2026-06-23 — Infusion gem icon; FellGuide as source for the collections

- ShardForge infusions now show a faceted gem. Augmentations keep the shield
- Added canonFromVault.js: reads hidden source docs in the vault (_Canon/collections) into the CMS seed, then apply pushes to Wix. One way, the vault is never written to
- Portraits are never emitted, so manual Wix uploads survive every sync (upsertItems merges)
- Added npm run canon and npm run sync. Source docs and a governance note live in the vault

## 2026-06-23 — BondForge cards: larger left-half portrait, click to zoom in place

- Catalog and ledger portraits now fill the left half of the card and stretch to its height
- Clicking a portrait expands it in place inside the card and shows the full uncropped image. Clicking again collapses it
- Removed the fixed centered lightbox, which anchored to the middle of the embed iframe and forced scrolling

## 2026-06-23 — Canon moves to editable CMS collections

- Added three content collections you edit in the CMS: Lorebounds, Infusions, Augmentations. Real columns plus a native Image field, created and seeded by the apply pipeline
- Added a generic backend read getCatalog(collectionId). Sorts by displayOrder and converts Wix image fields to URLs. Any forge can use it
- BondForge catalog now reads Lorebounds. ShardForge catalog reads Infusions and Augmentations per side. Baked sets remain only as an offline fallback
- Retired the earlier Creations-based bond seed and its endpoint

## 2026-06-23 — BondForge catalog reads canon from the CMS

- Catalog now loads canon lorebounds from the Creations collection (kind bond, canonStatus canon) through getCreations. The baked 18 remain only as an offline fallback
- page-bondforge.js handles CATALOG_LOAD and returns canon rows normalized for the catalog
- Added backend/canonBonds.js (the 18 canon bonds) and a guarded /_functions/seedBonds endpoint to load them once. Idempotent
- Portrait convention still applies: a canon row with no imageUrl falls back to bonds/<slug> art, then the letter

## 2026-06-23 — BondForge: ledger, voting, submission to the LoreForge

- Wired the BondForge lorebound generator to the shared backend (forgeKey bondforge, kind bond)
- Added a Ledger tab to view, vote, and review submissions (All / Canon / Mine)
- Submit now routes to the vault through page-bondforge.js and submitCreation. Portrait uploads reuse the rune uploader, set as the creation image
- Added a bondforge ForgeConfig row with an empty ruleset. No backend change, kind already generalized

## 2026-06-23 — ShardForge: desktop reveals Canonize on click

- Desktop now shows the catalog alone by default. The Canonize column appears on the right only when its tab is clicked, and the Ledger takes the full width when active

## 2026-06-23 — ShardForge: one tool for infusions and augmentations

- Folded augmentations into the ShardForge tool with an Infusions / Augmentations toggle up top
- Each side carries its own catalog, categories, and copy. Augmentations keep the Core-first view and Core badge; infusions show the full set
- One shared Ledger that follows the active side (kind infusion or augmentation), same All / Canon / Mine and voting
- No backend change. page-shardforge.js already keys kind off the side

## 2026-06-23 — ShardForge: ledger, voting, submission to the LoreForge

- Wired the ShardForge infusions tool to the shared backend (forgeKey shardforge, kind infusion)
- Added a Ledger tab to view, vote, and review submissions (All / Canon / Mine), mirroring SigilForge
- Submission now posts to the vault through page-shardforge.js and submitCreation instead of a mock
- Generalized submitCreation kind to payload.kind so any forge sets its own (no SigilForge change)
- Added a shardforge ForgeConfig row with an empty ruleset so freeform submissions validate cleanly

## 2026-06-22 — SigilForge: remove false innate trigger, clarify Base Damage

- Innate weapon afflictions trigger on a 6 for every Form. Removed the incorrect 3rd Form 5-or-6 trigger from the tool and the FellGuide
- Base Damage shows cost -1 directly. Dropped the confusing gain a point wording (no modifier was ever applied)

## 2026-06-22 — SigilForge balance pass

- No Damage cost 0 to -2; Purged 1 to 2; Persecuted* 4 to 3 (no longer Major)
- Enfeebled*, Suppressed*, Disarmed* 3 to 4 (now Major Afflictions, Tier 3 + 3rd Form)
- Crushed may now be carried by Spread and named by Amplify (removed from both ban lists)
- All Enemies renamed All Targets; rule now covers all enemies or all allies
- Inert*, Anchored*, Benighted*, Defanged* marked Foe-only (FoeOnly), rejected on Ability and Spell builds in the tool and the validator
- Monster tab relabeled Foe (internal value unchanged)

## 2026-06-21 — SigilForge: Inlay labels, remix + AI fixes, ledger voting

- Renamed the two slot labels from Rider Slot to Inlay Slot (player-facing copy)
- AI Forge now resolves near-miss component names (e.g. Ignited -> Ignited*) and surfaces truly unknown names to the validator loop, so the chosen Inlay no longer drops silently
- Forge from this now loads pre-meta creations by defaulting the weapon/focus, so the build restores and the player re-picks the item
- Added a Vote control to each ledger card (castVote backend, one vote per member via optional voters field, graceful tally-only fallback)

## 2026-06-21 — SigilForge: AI Forge live, Codex category arrows

- Enabled Forge From a Vision (AI_FORGE_ENDPOINT -> apex /_functions/aiForge); card now shows
- Added left/right arrows to the Component Codex category filter row (desktop; touch-scroll on mobile)

## 2026-06-20 — C3: The Forging Ledger, browse and remix

- The Ledger tab now browses the LoreForge through getCreations instead of repeating the component costs the Codex already carries. Filters for All, Canon, and Mine.
- Each entry shows its canon track (Canon, In Vote, Submitted, Declined, Draft) and a Gate 2 line: canon attaches freely, everything else needs LoreMaster approval to attach.
- Forge from this loads a creation back into the Forge by reusing applyAiBuild, and sets basedOn lineage for the next submission. The forge block now carries an identity meta block so remix restores the weapon, spell, or foe faithfully.
- Page code gained the LOREFELL_LOAD_LEDGER route, member-scoped Mine via currentMember, and stores meta on the record. Backend unchanged, getCreations shipped in C1.

## 2026-06-20 — C2: Bring It To Your LoreMaster

- Submit now opens a review step themed on the canon Bring It To Your LoreMaster section instead of forging straight away.
- The panel shows a legality line (tier, points of cap, Inlays, Afflictions, Legal), the canon Five Questions as a self-check, and a one-line note that becomes creatorNote for the LoreMaster at Gate 2.
- Overlap runs through findSimilar before the send. A close match shows its name, creator, and canon badge, with Base mine on this to set basedOn lineage, or send as new.
- Page code gained the LOREFELL_CHECK_OVERLAP route and now carries creatorNote, narrative flavorText, and basedOn onto the record. No backend change, submitCreation already persists all three.

## 2026-06-20 — C1: SigilForge tool repointed to the vault

- Tool now writes to Creations through submitCreation. It emits a payload.forge block in the interpreter shape (tier, form, mode, kind, selections as labels, spreadTarget, amplifyTarget) and defers the success message to a LOREFELL_SUBMIT_RESULT from the page bridge, so it never claims a save the vault refused.
- Renamed rider to Inlay across all player copy and the AI Forge contract. Code identifiers, CSS classes, and the rune renderer were left untouched.
- Added page-sigilforge.js for The SigilForge page, bridging submit and feedback, storing the rune via uploadRune, and reporting overlap from findSimilar.
- forge.web.js keeps the tool's authored shorthand and full text when provided, and gained getCreations for the Ledger browse and basedOn lineage.
- embeds/sigilforge.html plus scripts/seedEmbeds.js, wired into apply.yml, seed the tool into the SiteEmbeds sigilforge row.

## 2026-06-20 — Backend moved to the modern .web.js web module

- Replaced backend/forge.jsw with backend/forge.web.js, since Wix deprecated .jsw web modules. getForgeDefinition, submitCreation, and findSimilar are now webMethod exports with explicit permissions (Anyone for the definition read, SiteMember for submit and overlap). rules.js stays a plain backend module imported by it.

## 2026-06-20 — Fix collection create: send collection.id

- createCollection.js was putting the new collection id in collection._id, which Wix Data v2 rejects with `id must not be empty`. It now sends collection.id. This also removes the old duplicate-collection behavior, since Wix no longer derives the id from the display name.

## 2026-06-20 — Component ids aligned to the tool labels

- Set ForgeComponents componentId equal to each component label so the SigilForge tool, which selects components by label, submits ids the backend validates directly. No mapping layer between tool and CMS.

## 2026-06-20 — Unified Creations collection and legacy migration

- Renamed the SigilForge submission target from Sigils to a single shared Creations collection that every forge writes to and LoreForge and the viewers read, discriminated by forgeKey and kind. Sigils was deleted.
- Added imageUrl and sourceId to the record. imageUrl carries the primary visual, sourceId records provenance for imported rows.
- Added scripts/migrate.js, an idempotent one-time migration that copies legacy LoreForgeAbilities rows into Creations, folding the build into payload, mapping loreForgeApproved to the canon track, and skipping anything already migrated. LoreForgeAbilities is left intact as a backup.
- The migration runs as the final step of the Apply workflow, so one run creates, seeds, and migrates. It is non-fatal if the legacy collection is absent.
- Repointed the backend overlap lookup, the backup fallback set, the kernel fallback definition, and the README.

## 2026-06-20 — SigilForge data, interpreter, and two-gate record

- Replaced the toy ForgeConfig and ForgeComponents seeds with the real SigilForge set: one config row and 103 components. Rider is renamed to Inlay, the spread and amplify ban flags are carried as categories, and major afflictions are tagged by cost.
- Corrected the gates to current canon. Afflictions need Tier 2 and 2nd Form. Major Afflictions and All Enemies need Tier 3 and 3rd Form. Spread needs 2nd Form. Amplify needs Tier 2. Three Targets needs 2nd Form.
- Added the Form floor so Tier cannot fall below the weapon Form, the mythic budget of 7 at Tier 3 on a 3rd Form item, and an Inlay cap that counts Spread and Amplify against the two-Inlay limit.
- Extended the interpreter with the rules it lacked: mutual exclusion, the one-Affliction sub cap, Spread requiring Secondary Targets, No Damage requiring an Inlay, and Spread and Amplify each naming an eligible Inlay with the per-component bans.
- Sigils schema gains the two-gate model and record fields: kind, canonStatus, creatorName, legality, creatorNote, fingerprint, basedOn.
- Added the CreationApprovals collection for per-campaign LoreMaster approval.
- Backend re-validates every submission, writes the legality proof and author, and exposes findSimilar for the overlap check.
- Interpreter tested against legal and illegal builds before committing.
