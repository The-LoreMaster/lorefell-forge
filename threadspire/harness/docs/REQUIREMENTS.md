# ThreadSpire requirements: what to actually check

You are right that the FellGuide can't be the whole test. There are **two
oracles**, and they answer different questions:

- **The FellGuide** is the oracle for *game rules* — what the dice do, what an Act
  costs, how afflictions land. It says nothing about software behavior.
- **This document** is the oracle for *software behavior* — does switching
  adventures work, do the two sides sync, does the table open where you left it.
  The FellGuide will never contain these, because they aren't rules, they're the
  contract the app has to keep.

Every item below is a real requirement. Most were bugs we actually hit and fixed
this session; a few are ones you named that we should lock in before they break.
Each is written as a check: a thing to do, and what must be true after.

---

## A. Adventure lifecycle (where most of the pain has been)

**A1. Opening an adventure loads its story.**
Open an adventure. Its acts and scenes must be present, not an empty table. The
Seams window's "Story here" line must report the act/scene count.

**A2. Switching adventures inside ThreadSpire works.**
From one adventure, open Settings, pick another, press "Open the chosen
adventure". The new adventure's story must stand up. No "Still here". No empty
table.

**A3. A stale or reimported link never opens the wrong adventure.**
Open with a campaign id that no longer exists. It must not silently open a
*different* adventure. It either recovers the right one (from the Fell) or says
plainly it found no story — never shows Beacons when you asked for Stone and
Sovereign.

**A4. Reload keeps you in the same adventure.**
Reload the page. The same adventure loads, not a different one and not the demo
bench.

**A5. Opening does not auto-roll a die.**
Open an adventure whose log ends on a roll. No die should throw itself on load,
and no die should be labelled with whoever rolled last session.

**A6. The adventure is readable without a FateWell push.**
Open an adventure that has not been pushed from FateWell in this session. Its
story must still load, because ThreadSpire reads the adventure's own record. (A
live FateWell push, when there is one, still wins.)

---

## B. Two-sided sync (the LoreMaster ↔ player contract)

**B1. A Fell shows on both sides.**
A player joins with a Fell. The LoreMaster's roster shows that Fell. The same
Fell shows in the LoreMaster's token list (roster and tokens must agree).

**B2. A player's sheet edit reaches the LoreMaster.**
Player changes a stat, aurum, vitality. After one sync beat, the LoreMaster sees
the new value.

**B3. A LoreMaster's edit to a player's Fell reaches the player.**
LoreMaster opens a player's Fell, changes a field. The player's sheet reflects it
after a beat, and the change log records it attributed to the LoreMaster.

**B4. Combat declares cross the table.**
Player declares an Act. The LoreMaster sees the declare. LoreMaster applies
damage. The player sees the result.

**B5. Sync is not instant-but-wrong.**
A change made on one side must not appear on the other *before* it was actually
saved. (Guards against the harness — and the real feed — showing writes that
haven't landed.) The Sheet-changes window is the tool to verify who wrote what,
when.

**B6. The wrong adventure's state never bleeds in.**
While in adventure X, a state update belonging to adventure Y must be ignored,
not applied. (This is the "other adventure" guard in the state feed.)

---

## C. Persistence and state (your "does it remember" questions)

**C1. The table opens on the scene you left.**
Leave a scene, come back to the adventure. It opens on the scene that was active,
not the first scene. (`activeSceneId` is preserved.)

**C2. Each scene keeps its own board.**
Place tokens and a map on scene A, move to scene B, return to A. Scene A's board
(its stage: tokens, map, positions) comes back. Scene B has its own. They do not
cross-contaminate. (Per-scene `bindings`.)

**C3. Tokens and maps survive a reload.**
Set up a board, reload. The board comes back from the shared store, not reset.

**C4. Combat state survives a reload.**
Mid-combat, reload both sides. Round, declares, and vitality come back.

**C5. Switching adventures does not carry the old board over.**
Move from adventure X to Y. Y's board is Y's, not X's tokens wearing Y's face.
(The `advReset` clear-down.)

**C6. What belongs to one adventure is cleared when you leave it.**
Journal, quests, library, published shelves from adventure X must not show while
in Y.

---

## D. The Fell sheet (FellGlass, embedded in the rail)

**D1. A loaded Fell shows all its values.**
Open a Fell. Aurum counters, fatigue pips, mobility, vitality all show the saved
values, not defaults or zeros. (This was the aurum bug — the data loaded but the
sheet didn't repaint.)

**D2. Aurum totals correctly.**
Set known coins (Oro/Arca/Atla/Zurith). The total must equal the FellGuide
weights (×1 / ×10 / ×50 / ×100). *This one's assertion comes from the FellGuide.*

**D3. A save is acknowledged.**
Make an edit. The sheet must show it saved ("Autosaved"), or clearly show it did
not ("Not saved") — never silently drop it.

**D4. Switching Fells repaints the sheet.**
Open Fell A, then Fell B. B's values show, not A's leftovers.

**D5. The sheet works in both homes.**
The same sheet is embedded on its own page and in ThreadSpire's rail. Both must
load, save, and open the forge for an unbuilt Fell the same way (per the shared
bridge).

---

## E. Combat, against the FellGuide rules (this is where the rulebook is the oracle)

For each, read the FellGuide rule first, then assert the tool matches.

**E1. Act/React economy.** One Act, one React per Beat. Dig In: Act traded for a
second React. All In: React traded for a second Act. A second Act without All In
must be refused.

**E2. Committing.** Whatever the rulebook says committing locks, it locks, and
cannot be undone within the Beat.

**E3. Foe stat rungs.** Minion/Elite/Champion/Epic/Forsaken offsets. A dropped
foe's derived damage must match the rulebook formula for its rung.

**E4. Afflictions.** Land per the rulebook (on the hit, by family, precision vs
power vs magic). Assert the ones the rules gate by family only appear for the
right weapon family.

**E5. Charge / Fellmark / vitality math.** Whatever the rulebook specifies for
charging, Fellmark triggers, and damage reduction, assert the numbers the tool
produces match.

*(Expand E as you and Claude Code read more of the vault. These are the load-
bearing ones to start.)*

---

## F. Input, boundaries, and corruption (the "try to break it" set)

**F1. Overspend clamps.** Spend more aurum than held → clamps at zero, no
negative.

**F2. Empty required fields refuse.** Declare with no target, save a Fell with no
name where the rules require one → refused, not a broken state.

**F3. A missing adventure is graceful.** Open an id that doesn't exist → the "no
story loaded" message, not a hang or a crash.

**F4. Dropdowns open on mobile.** Every native dropdown (especially SigilForge,
which broke on Android) opens its picker on a tap. Run the mobile Playwright
project, not just desktop.

**F5. Rapid double-actions don't double-apply.** Two fast clicks on a save, a
declare, or an adventure-open must not produce two writes or two navigations.

---

## How to use this list

1. **Tier it.** Section A and B first (adventure + sync — the foundation and the
   pain). Then C (persistence). Then D. Then E and F as depth.

2. **Each item becomes one assertion in a scenario spec.** When it passes, it's a
   permanent guard: the same bug can't come back unnoticed.

3. **Two oracles, kept straight.** For A, B, C, D, F, *this document* is the
   spec — the expected behavior is written here. For D2 and all of E, the
   *FellGuide* is the spec — read the rule, derive the number, assert it. Tell
   Claude Code which oracle each check answers to, so it doesn't try to find
   adventure-switching in a rulebook that will never mention it.

4. **A disagreement is a bug, logged not patched-around.** Whether the tool
   disagrees with this list or with the FellGuide, that's a finding. Capture it.

---

## The short version to hand Claude Code

> Two oracles. The FellGuide governs game rules (sections D2 and E). This
> requirements list governs software behavior (A, B, C, D, F) — those will never
> be in the rulebook because they're the app's contract, not the game's. Build the
> scenarios in tier order: A (adventure lifecycle) and B (two-sided sync) first,
> then C (persistence), then D/E/F. Each requirement becomes one assertion. A
> disagreement with either oracle is a bug to report, not to code around.
