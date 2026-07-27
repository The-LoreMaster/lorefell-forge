# Phase A-equip — grips, the equip toggle, and showing only what is equipped

Why the row shows three Basic Attacks: there is no equip filter, so every weapon the
Fell owns contributes its Acts. A Fell has two hands; it cannot wield three weapons.
This phase adds the grip/equip system on top of data that already exists.

Grip data is already present: WEAPON_DB carries grips:[n,n,n] per form (e.g. Axe
Hatchet=1, War Axe=2, Great Axe=2), mirrored in the CanonWeapons seed. No vault or
schema work is needed for grips, this is UI and logic on existing data.

## Weapons: the grip rule and the equip toggle
- A Fell has 2 hands. A weapon's grip (from its form's grips value) is 1 or 2.
- Equipped weapons may total at most 2 grip: so up to TWO one-grip weapons, OR ONE
  two-grip weapon. Nothing that would exceed 2 grip.
- Each weapon's Arsenal card gets an Equipped toggle the Fell controls.
- If the player tries to equip a weapon with insufficient free grip (e.g. a 2-grip
  when a 1-grip is already equipped, or a third 1-grip), the equip button turns RED
  and shows a warning explaining why (which grips are taken, what would have to come
  off first). The equip is refused, not silently swallowed.

## Only equipped weapons feed the card row
The combat card row shows Acts ONLY from equipped weapons. An unequipped weapon
contributes nothing to the hand. This is what fixes the three-Basic-Attacks problem
at its root.

## Utilities: their own equip, no grip cost
- Utilities have an Equipped state too, toggled on their card.
- Utilities do NOT consume grip slots (grips are hands; utilities are carried).
- A Fell may equip at most (1 + Wit) utilities. Trying to equip beyond that is
  refused with a warning, same pattern as weapons but counting against 1+Wit rather
  than grip.
- Only equipped utilities appear in the combat Utility picker.

## Lorebounds: no equipped state
Lorebounds are not equipped and are unaffected by this. (Their combat role is Phase C.)

## Where equip state lives
Equipped is per-Fell state on the weapon/utility entry, saved like the rest of the
sheet (scheduleSave). It must survive a reload and reach the card row's derivation
(COMBAT_ACTS/REACTS already derive from arsenal/inventory; they now filter on
equipped). Confirm the derivation reads the equipped flag and the row reflects a
change immediately when the player equips/unequips.

## Sequence
A-equip lands after A-fix (A-fix makes the row usable; A-equip makes it show the
right cards). Test on the live site: equip one weapon, see only its Acts; equip a
second one-grip, see both; try a third or a two-grip over a one-grip, see the red
refusal; equip utilities up to 1+Wit, see the limit enforced.
