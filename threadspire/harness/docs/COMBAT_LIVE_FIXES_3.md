# Combat live fixes, round 3 — picker visuals + a real inventory bug

From live play. Two picker-visual mismatches with Fatewell, one genuine data bug
(the inventory disagreeing with the combat utility view), and one mechanic to enforce
on placement. The inventory bug is the priority — it is data integrity, not polish.

## 1. The card picker must match Fatewell: one open, the rest greyed
Clicking a card currently opens all three. It should behave like the LoreMaster's
cards: the CENTRE card open (expanded), the others greyed/dimmed, and moving focus
changes which one is open. Match the LM's card behaviour exactly — one focused-and-
open, the rest collapsed and dimmed — rather than expanding the whole row.

## 2. The skill/utility drop-up covers the pill above the cards
The "Any Skill" drop-up overlaps the "Choose a skill" / "Tap your target" pill that
sits above the cards (image). It must not cover that pill — the pill is the current
instruction and has to stay visible. Position the drop-up so it clears the pill (open
it above the card but below/around the pill, or shift the pill, whichever keeps both
readable). The utility drop-up will collide the same way once there are more
utilities, so fix the placement rule, not just the skill case.

## 3. INVENTORY BUG (priority): the sheet and the combat view disagree
Live symptom: the LoreMaster sees Astra carrying a Tablet and Ash Salt (on her
utility card on the map), but Astra's own Inventory shows none — and adding another
utility suddenly makes all of them appear.

Root cause (traced): two different filters answer "what is she carrying." The combat
utility display filters on discovered && equipped (docs/fellglass.html ~3974), while
cbPack (the sheet's own list) filters on known = discovered || veiled==="open". So a
utility can pass one and fail the other, and the two views disagree about the pack.
Adding a utility triggers a re-seed/re-render (equipSeed runs on renderItems) that
reconciles them, which is why "adding one shows all." This is the same family as the
earlier equipSeed migration faults — two answers to one question.

Fix: one resolver for "what is in the pack," used by BOTH the sheet inventory and the
combat utility view, so they cannot disagree. cbPack already exists as a single
resolver for the sheet; the combat view (and the LM's view of a Fell's utilities)
must read the SAME source and the SAME discovered/equipped rules, not a parallel
filter. Decide the rule once (what makes a utility "carried and showable") and apply
it everywhere. Add a test that the sheet's pack and the combat utility list return
the same set for the same character state — the bug is precisely that they didn't.

## 4. Placement must respect "empty spaces only", per utility
The FellGuide sets this per utility: Darkshard is placed in an "open space" (must be
unoccupied); Caltrops covers "five adjacent spaces"; Rune and Trap mark "the marked
space". So occupancy is a per-utility rule, not a blanket one. Add it to
UTILITY_MODEL (e.g. space: "empty" | "any"), classified from the FellGuide. Where a
utility requires an empty space, the placement gesture must REJECT an occupied square
(one holding a token or an existing marker) — Darkshard for certain. Where the book
does not require empty (a trap laid under where a foe stands may be legitimate), allow
it and leave the adjudication to the LM. Read the rule per utility; do not assume all
four are the same.

## Order
3 first — it is data integrity and it undermines trust in the pack. Then 1 and 2 (the
picker visuals, to match Fatewell), then 4 (the empty-space rule on placement). Piece
3 of the placed-utilities pass (LM materialisation at resolution) still waits on the
live round-trip confirmation, and is separate from these.
