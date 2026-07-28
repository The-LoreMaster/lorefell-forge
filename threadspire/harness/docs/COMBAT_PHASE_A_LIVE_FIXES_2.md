# Phase A — live fixes, round 2 (targeting is still broken; that is the blocker)

From a second live test. The #1 targeting fix did not actually let a player aim at a
foe, only at Fell. Everything else is downstream of that, so it comes first, and it is
a real mapping bug the A16 guard cannot see. Nothing below is phone work.

## 1. A foe still cannot be targeted (THE blocker — fix first)
Symptom: with a card armed, tapping/right-clicking a FOE does nothing; only a Fell can
be aimed at.

Root cause (traced in the deployed code): tokenFighter resolves a foe by
`handFighterByKey('m:' + t.refId)`, but the fighter list is built by combatFighters as
`{ key: 'm:' + f.id }` from `S.scene.foes[].id`. Foe tokens carry a `refId` taken from
their PLACEMENT SOURCE (adventure foe = refId:f.id at ~5806, palette/roster/account
placements set refId from their own source), and a foe added to a scene gets a FRESH
`id = mkId()` at ~2373. So the token's `refId` and the scene-foe's `id` that
combatFighters keys on are not guaranteed to be the same value, and when they differ the
lookup misses and the foe is inert. Fell tokens work because both ends key on the stable
`charId`.

Why A16 did not catch it: A16 builds one self-consistent scene and derives both ends
from it, so refId and id agree by construction. The real bug is that across placement
sources they DON'T agree. The fix and its test both have to use the id that actually
reaches S.scene.foes.

Fix: make the foe fighter key and the foe token refId resolve to the SAME identity.
Either combatFighters keys on the same id the token carries, or tokenFighter resolves
through whatever maps a placed token to its scene-foe, whichever is the true 1:1 link.
Do not paper over it by matching on name. Add the debug already wired at ~6896 (it logs
refId and the published keys on a missed gesture) to a real reproduction that places a
foe the way the LM actually does — from the adventure/palette, not a hand-built scene —
and assert the foe resolves. This is the same token-to-fighter class as Phase 3; it must
resolve on a stable identity, not a per-source one.

Until this works, none of the attack flow can be tested, so it is the whole job here.

## 2. Cards are still clipped — show all or none
A card is either fully on the row or not shown. Never a half card at the right edge.
Whatever count fits fully, show; the rest go behind the pager. No partial cards ever.

## 3. The Utility/Item cards are redundant and cluttered
- There are two entries where there should be one: an "Item" (e.g. Tablet) card AND a
  "Use a Utility" card. Remove the "Item" card ENTIRELY. Only "Use a Utility" is right.
- The "Use a Utility" card, once a utility is chosen, currently shows the chosen one in
  gold with the options also listed above — redundant. It should read plainly "Use a
  Utility" (no gold pre-pick), and reveal the options above ONLY when clicked, then set
  the choice without also keeping the list open.
- Any utility or skill that targets must prompt to target a foe or ally, the same aim
  step an attack uses — not resolve targetless.
- The overlaying option windows are clutter. Use the drop-up from the card (as built for
  the pickers), not a floating window stacked over the row.

## 4. The combat panel is in the wrong place
It was moved to the BOTTOM of every slideout tab (it appears under Inventory, Skills,
etc.), which is not the fix. It must live on the Fellmark GEM only — opening the gem
shows the combat panel; the five tabs (Inventory/Skills/Arsenal/Attributes/Lore) show
ONLY their own content with no combat panel appended. Right now it is appended to all of
them and is not on the gem at all.

## 5. The LoreMaster sees no "locked in"
The player side shows a declaration was made, but the LM sees nothing — no ring, no
mark, no "declared" on the Fell. The LM needs to see, at a glance, which Fell have
declared and which they are waiting on (A5's LM half). Wire the LM-side declared
indicator so it actually shows on the LM's view of each Fell.

## Order
1 (targeting) first and alone if need be — nothing downstream is testable without it.
Then 3 (utility cleanup) and 4 (panel on the gem) and 5 (LM locked-in), then 2 (clip).
Visual polish, especially LM-side, is a separate later pass the designer is holding.
