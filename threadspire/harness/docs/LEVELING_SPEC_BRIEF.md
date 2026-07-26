# Leveling: the walkthrough spec + the access buttons

Two jobs in one brief, because they're the same feature seen from two sides:

1. **The test** — walk a Fell through leveling in every path and prove it sticks.
2. **The access** — make sure the Level Up control is reachable and works in both
   contexts: a player on their own Fell, and the LoreMaster doing it *for* a
   player. Everything must be able to be leveled to the right level.

Hand this to Claude Code alongside `S3_AND_LEVELING_PREP.md` (the rules) and
`REQUIREMENTS.md` (the two-oracle model). Read those first.

---

## How leveling actually works today (verified in docs/fellglass.html)

- The sheet is one FellGlass page, embedded in ThreadSpire as an iframe
  (`#sheetFrame`). The player opens their own; the LoreMaster opens a player's via
  `TS_GOD_SHEET` ("god sheet"). Same sheet, two ways in.
- The **Level Up button** (`#lvlUpBtn`, "⬥ Level Up") is in the sheet header. It is
  hidden by default and shown only when `crystals() >= 1`:
  ```
  $("lvlUpBtn").classList.toggle("show", crystals() >= 1);
  crystals = floor(lorePoints / (level + 1))
  ```
  So the button appears only when the Fell has banked enough Lore Points for at
  least one Ascension Crystal. Its visibility is recomputed inside `renderDials()`.
- Pressing it runs `luOpen()` → the 3-step Ascend flow → `luApply()` commits:
  crystal spent (`lorePoints -= level+1`), `level++`, the chosen attribute +1, the
  track advanced (weapon / armor / lorebound), and `d6 + Vigor` added to max
  vitality. Then `scheduleSave()`.

---

## PART A — The access requirement (buttons, both sides)

Your rule: **the Level Up path must be reachable and work for the player on their
own Fell, and for the LoreMaster acting on any player's Fell, and it must be able
to level the right things to the right level.** Break that into checks, and fix
whatever fails.

### A-req-1 — The button shows when a crystal is available (player's own Fell)
Open a Fell that has `lorePoints >= level + 1`. The Level Up button must be
visible. If it isn't, the visibility toggle isn't firing on that code path
(suspect: `renderDials()` not called after a load, so the toggle never runs).

### A-req-2 — The button shows in the LoreMaster's god-sheet too
LoreMaster opens a player's Fell via `TS_GOD_SHEET`. If that Fell has a crystal
available, the Level Up button must be visible **there as well**, so the
LoreMaster can level a player who can't or won't. If it's hidden in god-sheet,
that's the gap your requirement is about — find where the god path suppresses it
and open it for a keeper.

### A-req-3 — Leveling from the god-sheet writes to the right Fell
When the LoreMaster levels a player's Fell, the change must save to **that
player's** record, not the LoreMaster's, and must survive a reload on the
player's own side. (This is where god-sheet edits are most likely to go wrong —
writing to the wrong record, or not persisting.)

### A-req-4 — Every track is reachable to its full level
From the Level Up flow, all three tracks must be selectable and levelable to cap:
- a **weapon** to L10 (including the L4 and L8 infusion-or-reforge forks),
- **armor** to L10 (including the odd-level defensive-attribute bonus),
- a **lorebound** to L10 (crossing Familiar→Companion→Corsair at L4 and L7).
Nothing may be blocked short of its proper cap by a UI gate. If a track can't
reach a level the rules allow, that's a bug.

### A-req-5 — The button hides again when no crystal remains
After an Ascend spends the last crystal, the button hides until another is
earned. (Prevents a level-up with no crystal to pay for it.)

**If any of A-req-1..5 fail, that's the feature work.** Most likely candidates,
from reading the code: the button-visibility toggle not re-running after a sheet
load, and the god-sheet either hiding the button or writing to the wrong record.
Fix in `docs/fellglass.html` (and the ThreadSpire god-sheet plumbing in
`docs/threadspire.html` if the write-target is wrong), then mirror to `embeds/`
and run the canon gate — the normal discipline.

---

## PART B — The walkthrough test (leveling.spec.js)

A player-side spec that drives the Ascend flow through the real sheet and asserts
the result after each. The harness boots the sheet the same way ThreadSpire does.
For the god-sheet cases, boot as LoreMaster and open a player's Fell.

**The oracle:** the *mechanics* (what each level grants) are the tool tables in
`S3_AND_LEVELING_PREP.md`. Whether those mechanics are the *right rules* (crystal
costs `level+1`, vitality is `d6+Vigor`, form boundaries at 4 and 7) is the
**FellGuide** — read the progression chapter and confirm before locking a number.
A tool/vault disagreement is a finding.

### Fixtures
A Fell with a known state, enough Lore Points for exactly one crystal:
- `lore: { level: 1, lorePoints: 2 }` → `crystals() = floor(2/2) = 1`. Button shows.
- one Power weapon at `{ tree: <a power tree>, level: 1, formIdx: 0 }`
- `armor: { level: 0 }`
- one lorebound at `{ level: 3 }` (poised to cross into Companion at 4)
- `attrs` with a known Vigor so the vitality roll is checkable

For each case, read `window.C` (the character object) after `luApply` and after a
reload.

### B-case-1 — Weapon level, and it persists
Open the Fell (button visible). Level Up → invest Power → level the Power weapon
to L2. Roll vitality, Ascend. Assert on `window.C`:
- `lore.level === 2`, `lore.lorePoints === 0` (spent `level+1 = 2`)
- the Power weapon `level === 2`
- `attrs.power.base` rose by 1
- `vitality.max` rose by the rolled `d6 + Vigor`
**Then reload the sheet and assert all of the above survived.** This is the
highest-value check: if leveling "isn't happening", the likeliest cause is that
`luApply` updates `window.C` but `scheduleSave()` never lands, so a reload shows
the old level. Prove save works, or prove it doesn't.

### B-case-2 — The L4 reforge fork
Fixture: Power weapon at L3. Level to L4, choose **reforge**. Assert `formIdx`
advanced by 1 and earned abilities are retained. Reload, assert it stuck.

### B-case-3 — The L4 infusion fork
Same fixture, choose **infusion** instead. Assert the infusion slot opened and
`formIdx` did **not** change. Reload, assert.

### B-case-4 — Armor on an odd level applies the bonus attribute
Invest a defensive attribute, take armor to L1 (odd). Assert the flow requires a
second defensive-attribute pick and that it applied (`attrs.<def>.base` +1),
**in addition to** the crystal's attribute. Reload, assert.

### B-case-5 — Lorebound crossing a form boundary
Fixture: lorebound at L3. Invest a core attribute, level it to L4. Assert the
form label became **Companion** (was Familiar), and the odd/even growth rule
applied correctly. Reload, assert.

### B-case-6 — The crystal economy
- With `lorePoints < level+1`, assert the button is hidden and Ascend is
  unreachable.
- After a level-up, assert `lorePoints` dropped by exactly `level+1`.

### B-case-7 — LoreMaster levels a player (the god-sheet path)
Boot as LoreMaster, open a player's Fell via god-sheet. Assert the Level Up
button is visible (A-req-2). Level the weapon. Assert it wrote to the **player's**
record: reload the player's own side and confirm the new level is there
(A-req-3). This is the check that proves your "LoreMaster can do it for them"
requirement end to end.

---

## Order of work

1. **B-case-1 first** — one weapon level plus the reload check. If it fails on the
   reload, you've found why leveling "isn't happening" (applies but doesn't save),
   and that's a real fix before anything else.
2. **A-req-1 and A-req-2** — button visibility on both the player and god-sheet
   sides. Cheap, and directly your requirement.
3. **B-case-7** — the full LoreMaster-levels-a-player loop.
4. The rest of B (forks, armor, lorebound, economy) for full coverage.

## The rule for Claude Code

The tool tables are the tool's current behavior; the FellGuide is the authority on
whether they're the right rules; a disagreement is a finding, not a thing to code
around. Player-side and god-sheet are two contexts of the same feature — both must
work. Fix real bugs in `docs/`, mirror to `embeds/`, run the canon gate; leave
`scripts/`, `schemas/`, and the workflow files alone.
