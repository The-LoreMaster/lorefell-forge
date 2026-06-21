# LoreFell Forge Change Log

Build batches pushed to this repo, newest at the top. The apply workflow is manual, so a push here changes the repo only. Collections change in Wix when the apply workflow runs.

---

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
