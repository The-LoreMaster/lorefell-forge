# Phase A-fix — make the card row usable, from live play

From live testing on the deployed site. The card row renders (tabs, pill, charge
rail, cards on the table) but has bugs and flow problems that block real use. Fix
these before the grip/equip work (A-equip) and before Phase B. Same discipline:
test each against the real files / harness, verify visually in the running site,
docs→embeds mirror, canon gate, push per fix.

## The old tracker must go, entirely
The sheet's OLD combat tracker still appears in the slideout and competes with the
new card row. Remove it. The card row under the map is the ONLY player combat UI.
After a hard refresh the old tracker stopped blocking the side tabs but the NEW row
went missing, so the two are tangled: the fix is to remove the old tracker AND
ensure the new row is what shows when a fight is on. Do not leave both wired.

## Slideouts must coexist with combat (high priority)
In combat the player currently cannot open the side tabs, everything defaults to
the combat window. That is wrong. The player must be able to open Inventory, Skills,
Arsenal, Lore, Attributes, and the Fellmark gem during a fight and peruse their
character. Rule: **any slideout opening (including the gem) temporarily closes the
card row**, exactly as the LM side closes its scene runner when a slideout opens.
Close the slideout, the cards come back. The row and a slideout are never both open.

## More Options is badly wired
Clicking More Options currently opens the LoreMaster's all-players view. That is a
serious bug, it is showing an LM surface to a player. More Options is only ever a
friendly reminder to tap the Fellmark gem. Fix: it opens the gem once, then does not
reappear for the rest of the battle. One-shot reminder, not a live control, and
never the LM view. Also move it further LEFT so it clears the right-hand art rail it
currently overlaps.

## Reacts do not show during declaration
The Reacts tab appears during the declare phase, so players pick a React and never
declare an Act. Hide the Reacts tab entirely during declaration. Reacts belong to
the resolution phase: during resolution the player may use their React at any point
(except Lorebound aspects, which fire only on their own triggers, that is Phase C).
So: declare phase shows Acts only; resolution phase is where Reacts live.

## Per-card selection, not per-name
Clicking one Basic Attack highlights all three weapons' Basic Attacks. Selection
must be per specific card, not every card sharing a name. (Largely moot once equip
filtering lands in A-equip, since only equipped weapons show, but fix the selection
scope regardless.)

## Armor stance change is a React, not an Act
It currently sits in the Acts group. Move Change Armor Stance to Reacts. (Which also
means it is hidden during declaration and available in resolution, per the Reacts
rule above.)

## The skill and utility pickers drop UP from the card
Choosing a Skill for an Act currently opens a huge window listing every skill. Replace
it with a compact option set that drops UP from the card. Same for Utility. No full
takeover window.

## "Items" is "Utility", and it is broken
Rename Items to Utility everywhere in combat. The Utility picker currently shows
[object Object] and does not load the Fell's utilities from the collection, fix the
data binding so it lists the actual utilities the Fell has (and, once A-equip lands,
only equipped ones).

## Layout: align, center, never clip
- Cards align under the Acts tab. Never cut a card off half-way.
- Center the whole cluster (the Acts/Reacts tabs plus the cards) between the dice
  tray on the left and More Options on the right (after More Options moves left).
- The row starts and ends clear of both, nothing clipped at either edge.

## Cards stay where the player left them
Selecting a card currently snaps the row back to the leftmost card. It must not:
the scroll position stays where the player scrolled it when they pick a card.

## The combat flow, simplified (targeting opens a roll, never auto-declares)
Two paths, and neither auto-declares, the roll always happens first:
  - **Card first:** click a card to arm it, then right-click a foe to target it, the
    player is prompted to roll the dice. Same for a skill card. The roll resolves the
    declare; targeting does not silently declare.
  - **No card:** right-click a foe OR empty space and choose Attack or Skill, then
    choose the specific option (standard / ability / spell, or which skill) right in
    the dice menu, and roll.
Fix the current bug where right-clicking a foe after selecting a card auto-sets the
target as declared with no roll and no way to undo. There must be a roll step, and a
way to back out before committing.

For the dice menu's ability/spell list: show charge-locked abilities the SAME way the
row does, per F9 — visible but greyed, wearing the charge that would unlock them, not
hidden. (An earlier draft of this brief wrongly said to hide them "to match the row's
usable-only principle"; that was wrong. F9 is locked and tested: the row keeps locked
acts visible so a player sees what a charge would buy, and the dice menu follows the
same rule so there is one behaviour, not two. The designer confirmed locked-but-greyed
everywhere.) Standard attack is always available (Precision vs Evasion; a magic
weapon's standard swing is still Precision vs Evasion, only a charged ability is a
Spell Attack vs Difficulty, per canon).
