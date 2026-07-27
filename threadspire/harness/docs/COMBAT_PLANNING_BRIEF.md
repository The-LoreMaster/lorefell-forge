# Player-facing combat at the table — planning brief

For Claude Code planning mode. The goal is a player-facing combat UI in ThreadSpire
that runs the LoreFell Act/React Beat, built on the systems that already exist, not
a new engine. Review first, plan second, build third.

## Step 1 — review these before proposing anything

Two source systems already implement the rules. Read them and report what they
give us before designing:

1. **FateWell combat (docs/fatewell.html + velo/backend/fatewell.web.js)** — the
   reference implementation. It already has: combat phases (`combatPhase`,
   'commit'), declares (`mergeDeclares`, the `lmtool-combat-declares` message),
   foe damage (`foeDamage`), tiers, and charge advancement. This is how combat
   already resolves on the LoreMaster's side. The player UI must speak the same
   protocol, not invent a parallel one.

2. **FellGlass act derivation (docs/fellglass.html)** — the player's Acts and
   Reacts are ALREADY computed here as `window.COMBAT_ACTS` and
   `window.COMBAT_REACTS`, derived from weapons, armor stances, skills, and items,
   with tier/charge locking (an entry with `tier > C.charge` is locked). The
   requirement "acts and reacts come from arsenal, talents, inventory, and charges"
   is already satisfied at the data level. Reuse this. Do not rebuild it.

3. **The FellGuide rules** (the vault, private repo lorefell-fellguide) — the
   authority on the Act/React Beat: one Act + one React per Beat; Dig In sacrifices
   the Act for a second React; All In sacrifices the React for a second Act;
   charges, tiers, damage, accuracy (1d6 + Precision physical / 1d6 + Magic magic).
   Where FateWell's code and the FellGuide disagree, the FellGuide is the rule and
   the disagreement is a finding to report, not to code around.

**Report from step 1:** what combat resolution already exists and can be reused,
what the player side currently shows (S.scene, foes, tokens, the derived acts), and
what genuinely has to be built new versus wired together.

## Step 2 — the player-facing UI to design (use the frontend-design skill)

Load the frontend-design skill for the visual work. The tool lives in ThreadSpire
(docs/threadspire.html), player-facing, on the map/table view. Requirements from
the designer, treat these as fixed:

- **Act/React cards along the bottom of the map.** The player's available Acts and
  Reacts (from COMBAT_ACTS / COMBAT_REACTS) render as a row of cards beneath the
  map. Locked ones (tier above current charge) read as locked, not absent, so the
  player sees what a charge would unlock.
- **Selection animation.** A chosen card glows gold, grows slightly, and shimmers.
  Animation, not a static highlight. (The Level Up control and the charge gems
  already use a gold glow — `lvlglow`, `gempulse` — match that visual language.)
- **Right-click an enemy token to attack.** Right-clicking (and a touch equivalent,
  long-press, since this must work on mobile) a foe token opens the attack: pick
  the Act, roll, resolve against that foe. The roll uses the existing accuracy and
  foeDamage math, not a new one.
- **Right-click for targeted skills and reacts too.** Same target-first gesture:
  right-click a token, then choose the skill/react to apply to it. A skill Act
  should let the player choose which skill.
- The whole hand is driven by what the player actually has: arsenal (weapons),
  talents/skills, inventory (items), and lit charges. COMBAT_ACTS already encodes
  this; the UI reflects it live as charges change.

**Mobile matters.** ThreadSpire is played on phones. Right-click has no native
mobile equivalent, so every right-click gesture needs a defined touch fallback
(long-press is the usual one). Design both from the start; do not bolt mobile on
after.

## Step 3 — how it should be built (the discipline that has worked)

- **Reuse, don't reinvent.** COMBAT_ACTS/REACTS for the hand, foeDamage and the
  declares protocol for resolution, the existing token board for targeting. New
  code is the UI layer and the gestures, not the rules.
- **The player and LoreMaster share a Beat.** A player's declared Act/React has to
  reach the LoreMaster (the `lmtool-combat-declares` / mergeDeclares path already
  exists) and the resolution has to sync back through the state feed. Plan the
  round-trip, not just the local UI.
- **Test as you go, against the real files, in the two-frame harness.** The harness
  in threadspire/harness/ can drive a player frame and an LM frame. A combat Beat is
  exactly the S3 scenario the test plan has been holding for — it becomes testable
  once this is built. Assert the rules (one Act + one React, Dig In, All In, charge
  locking) with the FellGuide as oracle.
- **docs/ is the source, mirror to embeds/, run the canon gate.** Same discipline as
  every other ThreadSpire change. Never edit generated files or the scripts/schemas
  CMS zone.

## What NOT to do

- Do not build a second combat engine parallel to FateWell's. Adapt the one that
  exists.
- Do not recompute the available acts/reacts; COMBAT_ACTS already does it.
- Do not ship the desktop right-click without its mobile long-press equivalent.
- Do not treat a FateWell-vs-FellGuide rules disagreement as settled; report it.

## The output of planning mode

A plan that: (1) states what already exists and is reused, (2) lays out the
player-facing card UI and the target-first gestures with their mobile fallbacks,
(3) describes the player<->LoreMaster round-trip for a declared Beat, and (4)
sequences the build so each piece is testable in the harness against the FellGuide
rules. Then build it in that order, one testable piece at a time.
