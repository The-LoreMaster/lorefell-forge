# Combat — deferred items (do not lose these)

## The Fellmark-gem combat slideout needs a redesign (Nate's, deferred by Nate)
Nate wants to change the combat panel that lives on the Fellmark gem. Not now — he
asked to come back to it and explicitly said "don't let me forget". Raise it after the
current Fell-side card redesign lands. No spec yet; it's a placeholder so the intent
survives the session.

## Utilities do not all roll (rules correctness, surfaced in the card redesign)
The FellGuide is explicit, per utility, in prose: many combat utilities resolve with NO
roll. Tablet "strikes automatically with no accuracy roll. The effect triggers the
moment the target is chosen." Potion "casts automatically with no accuracy or casting
roll." Ash Salt just lifts an Affliction. So the current combat flow that makes a
player roll to use a utility is wrong for those. There is NO structured roll flag on
utility data today — the behaviour is only in the description text — so resolving this
properly needs a roll/target model added to utility data (e.g. roll: none | auto |
attack; target: foe | ally | self | none), read from or matched to the FellGuide.
Tracked here so it's designed, not guessed, when utility resolution is built.

## Urgent-alert corner (already captured in COMBAT_UI_REBUILD_BRIEF.md, Phase B)
Both sides, top-left, always on. Listed here only as a pointer; the spec lives in the
rebuild brief.
