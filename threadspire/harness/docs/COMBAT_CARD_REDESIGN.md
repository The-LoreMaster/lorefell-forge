# Combat card redesign + the utility roll/target model

From live play once combat worked. Two pieces: the Fell-side card row is restyled to
match the LoreMaster's cards (the bare-arrow change lands on the LM side too), and
utilities get a real roll/target/consumption model because the FellGuide says they do
not all roll. Fell side is the priority; the LM side gets only the shared arrow change
now, its deeper redesign is a later pass.

## A. The cards match the LoreMaster's card style
Reuse the LM's CARD visual (not the bar above them), showing Acts instead of
enemies/Fell.

- COLLAPSED = a single line: the weapon and its attack ("Ashen Blade — Basic Attack"),
  or an ability/spell's name, or "Use a Skill" / "Use a Utility".
- OPENED = the full info, the way the LM card expands:
    - Weapons: Tier, Standard Strike, and what it does to Vitality and
      Durability/Resistance.
    - Abilities / Spells: the description.
- CENTRED between the dice tray and the edge of the portrait.
- Remove the "Acts" label at the top-left of the cards. At this point it is obvious a
  fight is on.
- Remove MORE OPTIONS entirely. The red pulsing Fellmark gem already carries "there is
  more on the gem"; the pill is redundant now.

## B. Bare gold paging arrows, BOTH sides
Replace the circled/shaped pager arrows with a plain gold arrow (no circle, no shape
behind it), left and right, each shown ONLY when it leads somewhere (the existing
appear-only-when-usable rule stays). Apply this to the Fell row AND the LoreMaster's
card strip now — it is the one LM-side change in scope this pass; the rest of the LM
combat redesign is later.

## C. Targeting feedback
- A targeted FOE's token border turns RED; a targeted ALLY's border turns GREEN.
- "Tap your target" is too small to see. Move it to the blue pill, centred ABOVE the
  cards, so it reads as the instruction it is.

## D. The roll interaction (replaces the attack bar popup)
- Remove the attack bar that currently pops up on target.
- Instead, the DICE grows larger, expanding toward the TOP-RIGHT so it does not clip
  back behind the border, and pulses GOLD around it (the pulse must not cover the dice
  skin art).
- A "Manual roll" pill appears to the RIGHT of the dice; tapping it lets the player
  pick 1-6 instead of rolling.
- Skills: replace the pill set with a dropdown that pulls UPWARD (same upward drop as
  the utility picker). The dice behaves the same as for an attack.

## E. The utility roll / target / consumption model (data + logic)
The FellGuide is explicit, per utility, in prose — utilities do NOT all roll, do not
all target, and are not all reusable. There is no structured flag for any of this on
utility data today. Build one, classified FROM the FellGuide (do not guess per item):

  - roll: how it resolves.
      * none  — resolves on use, no roll (Ash Salt lifts an Affliction; Revealing
        Powder, Aether Lens, Gloomcowl, Kindlestone — self/battlefield effects).
      * auto  — targets something but strikes/casts automatically with NO roll (Tablet
        "strikes automatically with no accuracy roll"; Potion "casts automatically").
        The effect triggers the moment the target is chosen.
      * attack/cast — the rare case that does roll; roll as the weapon/spell would.
  - target: foe | ally | self | none | place. Some target a foe (Tablet), some an ally
    or self (Ash Salt, Uncrossing Oil), some target nothing (Revealing Powder), some
    are placed on the battlefield to trigger later (Caltrops, Rune, Trap, Glyph,
    Darkshard), and a few are special (Grappling Hook: foe or ally or object at twice
    Mobility). Where a utility targets, it must prompt to target with the red/ally-green
    feedback from C; where it does not, it resolves without a target step.
  - So a utility with roll:none|auto does NOT open the dice — it resolves on use (or on
    target-select for auto). Only roll:attack/cast opens the dice per D. This fixes the
    current wrong behaviour that rolls for every utility.

## F. Consumption and logging (Nate's addition)
- The Uses field is structured and knowable: "1 time use" (consumed) vs "N individual
  uses" (a counter). When a consumable utility is used, DECREMENT it — remove a
  1-time-use from inventory entirely, and tick down an N-use counter, removing it at 0.
- Every utility use writes to the combat LOG ("Astra used Ash Salt on Billy"), so the
  table and the LoreMaster can see it happened, same as other combat events are logged.
- Consumption and the log entry fire on the actual use/resolution, not on merely
  selecting the card (an undone declare must not consume the item).

## Sequence and cautions
Fell side first: A (cards), C (target feedback), D (dice/roll interaction), E+F
(utility model + consumption/log). B's arrow change spans both sides and is small, do
it alongside A. The LM card style is reused, not rebuilt; its deeper redesign is a
later pass Nate is holding.

The utility model (E) is the substantive new logic and needs the FellGuide as the
oracle — classify each combat utility's roll/target from its description rather than
inventing. Where the description is ambiguous, ask rather than guess. Do not paraphrase
mechanical wording; read it.
