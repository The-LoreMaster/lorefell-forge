# Canon Sources & Drift Backlog

Companion to the **canon drift gate** (`canon/checkCanon.js`, `canon/canon.map.json`,
`.github/workflows/canon.yml`). This doc is the human-facing half: the target architecture, the
source-of-truth decisions still owed, the gate's known blind spots, and the live drift found while
building it.

## Target architecture (decided)

Canon lives in the **vault** (`lorefell-fellguide`, the `_Canon` master docs), human-authored. A
**generator** turns vault master docs into **Wix CMS collections**. Tools read canon **from Wix at
runtime**. Wix is a generated output, never a source. Tools must not hardcode canon.

> vault master doc → generator → Wix CMS seed/collection → tool consumes from Wix

Today most concepts are far from this: canon is scattered across hand-maintained JSON and inline HTML
blobs. The **v1 gate is interim**. It protects against drift *during* the migration. Each concept
graduates out of the gate's co-change axis as it moves to vault → generated → Wix.

## How the gate works (v1)

Three axes, routed by `canon/canon.map.json` (each concept-bearing file is policed by exactly one):

- **Axis 1. Generated staleness.** Re-runs a generator. Fails if committed output differs. v1 gates
  **only** the `build.js` rules pipeline (`rules.core.js` → `docs/rules.js`, `velo/backend/rules.js`).
- **Axis 2. Docs ↔ embeds mirror.** Every `embeds/<name>.html` must byte-match `docs/<name>.html`.
- **Axis 3. Manual co-change.** For each concept, if a push touches some but not all sibling blocks,
  it fails and prints the exact `[canon-skip: <concept>]` token to override. Differential: it only
  reads the current diff, so pre-existing drift never trips it. In-file blocks are delimited by
  a `/* CANON:<concept> start */` and `/* CANON:<concept> end */` comment pair.

**Running it locally.** CI runs the gate with no special setup. A local or pre-commit run
(`node canon/checkCanon.js`) is blocked under the Fellboard guard, whose `NODE_SCRIPTS` allow-list
permits only four exact scripts. To run it by hand, add `canon/checkCanon.js` to `NODE_SCRIPTS` in
`.claude/hooks/guard.js`. That is a manual guard edit Nate owns. CI does not need it.

## ⚠️ Known blind spots (v2 backlog, in priority order)

1. **Vault → seed staleness is NOT gated (this is the gap that bites most).** Axis 1 cannot verify the
   `canonFromVault.js` step (vault `_Canon/collections/*.md` → `schemas/seed/*.json`) because the vault
   is a **separate private repo** not checked out in forge CI. So a vault edit that isn't regenerated
   into the seed, or a seed hand-edited out of step with the vault, passes CI silently. **v2 item #1:**
   check out the vault in `canon.yml` (deploy key / token or submodule) and add a `canonFromVault.js`
   regen-diff to axis 1.
2. **Re-enable genCanon in axis 1.** `genCanon.js` is currently excluded because it is broken (below).
   Once fixed, its five baked targets should move from axis-3 co-change back to axis-1 regen-diff.
3. **Worlds** co-change group (threadspire / fatewell / bondforge / sagaforge / fellforge /
   the_cartographer). Sibling set not yet pinned. Add once enumerated.
4. **Axis 4. Wix-seed ↔ inline parity.** Value-equality between seeds and inline copies. Too brittle
   until consolidation collapses the shape mismatches.

## Source-of-truth backlog (worst drift first)

Each concept: where its truth lives now, and the recommended authoritative source. This is the
migration order. Fix the actively-broken ones first.

### 1. Foe pack. WORST, actively disagreeing
- **Now:** `docs/fatewell.html` `FW_FOE_PACK` (carries infusion rule text) vs `docs/sagaforge.html`
  `FOE_PACK` (names only, **already drifted**) vs Wix `CanonFoePack` (live, foeforge reads it at
  runtime). `data/FoePack.canon.json` is dead (its generator `build-canon-pack.py` is absent).
- **Recommend:** author a vault foe-pack collection (builds / tiers / stances / pools), generate
  `schemas/seed/CanonFoePack.json` from it, and push to Wix. This needs authoring first. The 15 builds
  and the tier ladder currently live only as prose in `LoreVault/Running the Game/Building Crucibles.md`.
  Then migrate fatewell and sagaforge to read Wix like foeforge already does. **Interim source of
  record:** `schemas/seed/CanonFoePack.json`.

### 2. Aspects. A real name mismatch already exists
- **Now:** `docs/fellglass.html` `ASPECTS` lists **Redoubt** as its 12th aspect. `docs/fatewell.html`
  `CANON_ASPECT_NAMES` lists **Unbind** in that slot. They disagree today. Categories for `Redoubt`
  and `Kindle` are hand-set correctly in fellglass but genCanon would overwrite them (below).
- **Recommend:** vault `_Canon/collections/Lorebounds.md` (already the source for the seed) is
  authoritative. Extend the pipeline so `CANON_ASPECT_NAMES` derives from it too. Decide Unbind vs
  Redoubt. **Interim source of record:** `schemas/seed/Lorebounds.json`.

### 3. Weapons. Two hand-kept shapes
- **Now:** `data/Weapons.canon.json` (nested → fellglass `WEAPON_DB` via genCanon) and
  `schemas/seed/CanonWeapons.json` (flattened → Wix). Same data, two shapes, nothing enforces
  agreement. Vault has per-weapon callouts (`Tree/Form/Affliction/Grip/Range`).
- **Recommend:** vault Weapon Trees become source → generator emits one seed → fellglass reads Wix.
  **Interim source of record:** `schemas/seed/CanonWeapons.json`.

### 4. Skills & 5. Attributes. Multiple hardcoded copies, no source
- **Skills now:** `fellglass SKILLS` (grouped, with descriptions) + `brandforge SKILLS` (flat 24) +
  fatewell/fellforge references. **Attributes now:** `fellglass ATTRS` + `fatewell ATTRS` +
  `brandforge ATTRIBUTES`. Currently the 24 skills / 8 attributes appear aligned, but there is no
  single source.
- **Recommend:** author `_Canon/collections/Skills.md` and `Attributes.md` from the `_Canon/CANON.md`
  tables → seeds → Wix. Tools read Wix.

### 6. Infusions & Augmentations. Already have a clean path (lowest risk)
- **Now:** vault `_Canon/collections/{Infusions,Augmentations}.md` → seeds → shardforge/foeforge via
  genCanon → Wix. This IS the target shape. Only genCanon's breakage (below) and the unmanaged
  `fellglass` placeholder copies (`INFUSIONS`/`AUGMENTATIONS`, `INF_REMINDER`/`AUG_REMINDER`) need
  attention. **Source of record:** the vault collections.

### Deferred (author later / may stay prose)
- **Talents**. Only placeholders in code (`fellglass TALENTS`). Real data is vault callouts. Author
  `_Canon/collections/Talents.md` when ready.
- **Currency**. Vault-prose only (`fellglass AURUM` is the sole code copy). Structure only if a tool
  needs it.
- **Worlds / Sphere**. Hardcoded across many tools (see blind spot #3). Author `Worlds.md` from the
  Stratums pages.

## Dead files. Read by nothing in either repo (delete or clearly mark)

They look canonical by name but nothing consumes them (only `CHANGELOG` history):
`data/CanonConditions.seed.json`, `data/CanonAspects.seed.json`, `data/FoePack.canon.json`,
`data/Worlds.canon.json`, `data/SphereTree.canon.json`.

## Live issues found while building the gate (fix independently)

- **`genCanon.js` is broken on 3 of its 5 targets.** Running it errors with `MISS` on the shardforge
  infusion catalog, shardforge augment catalog, and foeforge augmentations. Its regex anchors no
  longer match the current HTML. It exits non-zero. (Reason genCanon is excluded from axis 1 in v1.)
- **`genCanon.js` `ASPECT_META` regresses two aspects.** It has no key for `Redoubt` or `Kindle` (it
  still carries the obsolete `Pyre`), so a re-bake would flip both categories to the default
  `support`. The committed `fellglass` is *more correct* than genCanon's output. Fix `ASPECT_META`
  (add `Redoubt`, `Kindle`. Drop `Pyre`) before re-enabling genCanon.
- **A 5th affliction copy** lives in `docs/brandforge.html` (`const AFFLICTIONS`), beyond the
  conditions group currently gated (`data/conditions.canon.js`, fatewell, fellglass) and the copies in
  `sigilforge`, the foe packs. Fold into the conditions group when convenient.
- **Misleading provenance comments:** `data/conditions.canon.js` says "Regenerate from SigilForge"
  (no such script exists. It's the de-facto source but the extraction is manual). `genCanon.js` calls
  `data/Weapons.canon.json` "vault-extracted" (it is hand-maintained). The `foeforge` PACK marker
  credits `build-canon-pack.py` for augments that `genCanon` actually rewrites.
