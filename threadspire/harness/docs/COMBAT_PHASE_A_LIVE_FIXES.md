# Phase A — live-play fixes (targeting, undo, and the rest)

From playing Phase A on the deployed site. The declare side is built but several
things are broken or wrong in real play. The targeting bug makes combat unplayable
(a player cannot attack a foe), so it and undo go first. Same discipline: verify
visually in the running site, harness tests, ls-remote after each push, mirror,
gate. The map card area is the player's home for combat, including undo; the sheet's
combat panel is a backup and its internals are not in scope here.

## 1. Targeting foes is broken (fix first — combat is unplayable without it)
A player can only target their own Fell tokens, not foes. Root cause: the tap/aim
handler (handAimByTap) is wired inside wireDrag, which is only attached when a token
is draggable, and for a player only their own Fell is draggable (draggable =
t.mine || ownFell || S.role==='lm'). Foe tokens get no pointer handler at all, so
there is nothing to aim at.

Fix: wire the aim/target handler to every TARGETABLE token (tokenTargetable), not
only draggable ones. A foe a player cannot move must still be tappable/right-
clickable to target. Keep drag gated to owned tokens; separate "can I move this"
from "can I target this". After the fix: with a card armed, tapping OR right-
clicking a foe opens the roll prompt (per the roll-step flow already built).

## 2. Right-click on a foe with no card gives no options
Right-clicking a foe currently just rolls the die with no menu. It should offer the
no-card path: Attack or Skill, then the specific option (standard / ability / spell,
or which skill), then the roll prompt — the same flow specced earlier. Charge-locked
abilities appear greyed with their price (F9), not hidden. Empty-map right-click
stays the existing roll-type picker, unchanged (out-of-combat rolling is protected).

## 3. Undo on the map, until resolution
After a declare (roll commits it), the map card area replaces the cards with an
"Act Declared" pill and an Undo button, right where the player is looking. Undo
returns them to arming (the declaration is retracted). Undo is available until the
LoreMaster moves to the resolution phase; once resolution begins, undo is gone (the
LM advancing the phase is what closes the window). The sheet panel's own "Edit
Declaration" stays as the backup path and is not the focus.

## 4. The combat panel must not hijack the other tabs
After locking in, the sheet's combat panel takes over Inventory, Skills, Arsenal,
Attributes and Lore. It must show on the Fellmark GEM only; the other tabs keep
their own content during a fight, exactly as they do before a declare. The combat
panel is fine as-is internally; the bug is that it is bound to every tab rather than
just the gem.

## 5. More Options overcorrected — move it closer to the gem
It was moved too far left. Bring it back toward the gem so it sits near it without
overlapping the gem or the cards. Keep the one-shot behaviour (disappears after the
first click) — that part is right.

## 6. The Fellmark gem, redder during combat (no new art needed)
There is already a combat tint: `.hFell.combat img{ filter:drop-shadow(0 0 6px
var(--danger)); }`. Intensify it so the gem reads clearly redder in a fight — a
stronger/redder drop-shadow, or a layered red glow, using the existing --danger
(#a32d2d). No new asset from the artist; this is CSS on the art that is already
there.

## 7. Use a Utility as an Act option — category first, then availability
Two filters at two layers, which resolves an earlier apparent contradiction (an
earlier turn said "keep out-of-combat utilities listed-but-tagged per F9"; that was
about availability, this is about category — they are different questions, and the
designer confirmed category filtering here):

  - CATEGORY (is this a combat Act at all?): the combat Act picker shows only
    utilities whose `use === "Act"`. A "React" utility belongs to the React picker
    (resolution), a "Passive" is never a chosen Act, and an "Out of Combat" utility
    (rest, treasure, etc.) never appears in the combat Act picker even when equipped
    — it is not an Act by nature, so showing it in combat is clutter with no path to
    use it. Its "Out of Combat" tag still shows in the sheet's Utility tab, just not
    in the combat picker.
  - AVAILABILITY (can I use this Act now?): among the use==="Act" utilities, "Use a
    Utility" is greyed until one is equipped (F9), lighting up when one is. This is
    the F9 listed-but-greyed behaviour, applied within the category that can be an
    Act at all.

So: combat Act picker = equipped utilities where use==="Act", with the option greyed
when none is equipped. cbUtilities already reads `use`, so the data is there.

## Order
1 (targeting) and 3 (undo) first, then deploy so the player can actually play a
round. Then 2 (right-click menu), 4 (tab hijack), then the polish 5/6/7.
