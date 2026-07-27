# Player-facing combat at the table — planning brief (v2, decisions locked)

For Claude Code planning mode. Build a player-facing combat UI in ThreadSpire on
top of the systems that already exist. The Step 1 review is done and confirmed most
of the engine, sync, and even the card UI already exist; this version folds in the
designer's rulings. Review is complete; the next step is PLAN, then build.

## What the review established (reuse, do not rebuild)

- **FateWell (docs/fatewell.html)** holds the whole resolution engine: accuracy
  (cbRollFoeAcc), evasion (cbRollFoeEva), luck, damage resolution (cbFoeResolve),
  charge advancement, conditions, stances, impairments. Reuse wholesale.
- **combat.web.js + schemas/CombatState.json + schemas/CombatPlayer.json**: the
  sync protocol is complete and symmetric, and CombatPlayer already carries every
  field a declared Beat needs. NO schema change.
- **FellGlass (docs/fellglass.html)** already derives the hand as COMBAT_ACTS /
  COMBAT_REACTS from arsenal, talents, inventory, and charges, and already renders
  `.cbc-card` cards with charge pips, picked state, tier, damage lines. The visual
  spec largely exists; it lives in the sheet's battle panel, not under the map.
- **fwTokenPopup** is a working per-combatant panel with touch-swipe: a template
  for the player token panel, needs a player-privilege version.
- **ThreadSpire** owns the token board (renderTokens, selectToken, the token layer).

Genuinely new work, small and specific: (1) a channel to get COMBAT_ACTS out of
the sheet iframe, (2) the tap-to-target gesture layer, (3) the card row under the
map, (4) the player declare round-trip driven from ThreadSpire.

## LOCKED DECISIONS (designer rulings, build to these exactly)

**D1 — No Dig In / All In. Remove the idea entirely.** These are NOT LoreFell
mechanics and are not in the FellGuide; they were a discarded idea. The Beat is
exactly **one Act and one React per round, no trade, no sacrifice.** Any earlier
brief text or assumption about a second Act/second React is wrong. Do not build,
plan, or test them.

**D2 — The gesture model is tap-card-then-tap-target, on both platforms.**
  - The player's Acts and Reacts are cards along the bottom of the map (from
    COMBAT_ACTS / COMBAT_REACTS). **Tap a card to select it** — it glows gold,
    grows slightly, and shimmers (animation, matching the existing lvlglow /
    gempulse gold language). A skill Act lets the player choose which skill.
  - **Then tap a target token** to apply the selected Act/React to that combatant
    and roll. This is the primary flow for BOTH desktop and mobile, so the phone
    majority gets a natural two-tap flow with no hidden long-press and no conflict
    with token dragging.
  - **Desktop convenience:** right-clicking a token may also open the same
    target-and-roll, as a power-user shortcut that does the same thing as
    tap-target. It is not the primary path and must not be the only path.
  - **Do not use long-press** as the target gesture; the two-tap flow replaces it
    and is drag-safe.

**D3 — The right-click collision is resolved by target.** ThreadSpire already binds
contextmenu on the map (threadspire.html:7313, tpAtCursor) to open the roll-type
picker. Keep that for right-click on **empty map**. Right-click on a **token**
routes to the attack/target flow instead. Disambiguate by hit-testing the token
layer in the contextmenu handler before falling through to the existing picker.

## Rules corrections to fold in (FellGuide is the authority)

**F2 — Fix the magic accuracy display.** Canon and the actual roll use Precision
for a Magical Attack (Magic only sets Base Damage). FateWell's displayed line
(fwFoeDamage) wrongly says "1d6 + Magic". Fix the display to show Precision. The
roll is already correct; only the shown text misleads the LM.

**F4 — Ties: higher wins, a tie goes to the attacker.** So accuracy >= evasion
hits. This matches what both tools already do (acc >= eva), so it is confirmed, not
changed. Document it; assert it in tests.

**F5 — Movement is always a React, never part of an Act.** Fix the COMBAT_REACTS
entry text (fellglass.html:3944) that wrongly says movement can be "part of an
Act." sendReact already implements it correctly; only the card text is wrong, and
it would render verbatim on any card built from COMBAT_REACTS.

**F3 — Add Spell Attacks.** The FellGuide (The Combat.md:120-124) separates a
Magical Attack (rolls Precision vs Evasion) from a Spell Attack, which does NOT
roll against Evasion: 1d6 + Magic skill + Mastery vs the LM's 1d6 + Difficulty.
Neither tool implements this second contest today. Add it as its own resolution
path; a spell ability must resolve via Difficulty, not Evasion.

**F8 — Add Ambush.** The FellGuide (The Combat.md:29) defines a Presence-vs-
Vigilance opening: a free Act per Fell, resolved as a Spotlight before the first
Commit. Add it as the combat opener.

**F7 (note, not a change):** canon is silent on spending a low-tier act while at a
higher charge, so it advances nothing but is not illegal. Don't quietly pick a
side; surface the choice in the UI rather than blocking it.

**F9 — Locked acts stay visible.** cbDealAttacks returns early for tier > charge,
so locked acts are absent. The player card row must show locked-but-visible (so a
player sees what a charge would unlock), so the port inverts this.

## Build discipline

- Reuse the engine, sync, and card rendering; new code is the gesture layer, the
  card row placement under the map, the iframe channel for COMBAT_ACTS, and the
  ThreadSpire-side declare caller.
- The player and LoreMaster share a Beat: a player's declared Act/React reaches the
  LM through the existing combat-declare / mergeDeclares path, and resolution syncs
  back. Plan the whole round-trip.
- Use artifact-design for the visual layer (frontend-design was not available;
  this is an acknowledged substitute, not the same skill).
- docs/ is source, mirror to embeds/, run the canon gate. Never touch the
  scripts/schemas CMS zone or generated files.
- Build in testable pieces. A combat Beat is the S3 harness scenario; assert the
  rules with the FellGuide as oracle — one Act + one React (D1), ties to the
  attacker (F4), Precision for magic accuracy (F2), movement as React (F5), Spell
  Attack vs Difficulty (F3), Ambush opener (F8).

## Output of planning mode

A plan that states what is reused, lays out the tap-card-then-tap-target flow with
the card-row UI and the right-click-token desktop shortcut, describes the
player<->LM round-trip for a declared Beat, folds in F2/F4/F5/F3/F8, and sequences
the build so each piece is testable in the harness against the FellGuide. Then
build in that order.


## ADDENDUM — designer rulings on the open questions (v3, authoritative)

These answer the plan's Q1/Q2/Q3 and, importantly, REVERSE the plan's F10
assumption about magic attacks. Build to these. Where the FellGuide does not
already say this, the vault is wrong and must be corrected first, before the code
is built to match, so there is one true rule to build and test against.

**Q1 — Spell ties go to the caster.** A tie (cast result == Difficulty) lands,
consistent with F4's tie-to-attacker. Confirmed.

**Q2 — Each spell (weapon ability) is tied to a SPECIFIC magic skill, per spell,
not chosen at cast time.** Check the FellGuide for the per-spell skill mapping and
use it. If the mapping is missing or incomplete in the vault, that is a vault gap
to fill first; report which spells lack a named skill so it can be corrected in
lorefell-fellguide. Do not fall back to letting the player pick the skill.

**Q3 — Ambush grants a free opening Act to EACH PARTICIPATING Fell, and not every
Fell necessarily participates.** It is per-participant, not a blanket party-wide
Act. The ambush contest determines who participates; only participants get the
opening Act. Model participation explicitly rather than granting to the whole
party.

**F10 (CORRECTED — supersedes the earlier reversal in this addendum) — contest
type is decided by standard-vs-ability, NOT by weapon category.** An earlier draft
of this addendum wrongly said all magic-weapon attacks are Spell Attacks. That is
withdrawn. The correct rule:
  - **Physical weapon, standard attack** → Precision vs Evasion.
  - **Magic weapon, standard attack** (a regular target, requiring no charge) →
    STILL Precision vs Evasion. A magic weapon's basic swing resolves exactly like
    a physical one.
  - **Magic weapon, ABILITY** (the charged one) → Spell Attack: 1d6 + Magic skill +
    Mastery vs the LM's 1d6 + Difficulty, no Evasion roll.
  So the Spell Attack contest is reserved for magic-weapon ABILITIES (which require
  charges). Standard attacks, physical or magic, stay Precision vs Evasion. The
  gate is: is this a charged ability on a magic weapon? Yes → Difficulty contest.
  No → Evasion contest.

  This matches the plan's original F3 reading and is a SMALLER change than the
  earlier (withdrawn) reversal: sendDeclare keeps Precision vs Evasion for every
  standard attack, and only a magic-weapon ability branches to the Difficulty
  contest. cbIncoming rolls Difficulty instead of Evasion only for those abilities.

  **Vault check still required:** the plan's F10 finding flags that the vault
  contradicts itself (Weapon Abilities.md vs CANON.md / Spell Attack.md). The
  corrected ruling above is the canon. Reconcile the FellGuide to it, report which
  pages disagree, get them fixed in lorefell-fellguide, then build the code.

**Sequencing impact.** Step 0 (the F2 display fix, F5 movement text, F4
confirmation) is unaffected by any of this and can proceed immediately. The F10/F3
magic-attack work now depends on the vault being reconciled first, so it stays
sequenced last and gains an explicit "confirm/fix the vault" gate ahead of the
code.
