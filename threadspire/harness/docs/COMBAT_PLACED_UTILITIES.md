# Placed utilities — Caltrops, Rune, Trap, Darkshard

The four target:'place' utilities. A player declares a placement during the declare
phase; the marker token does NOT appear on the board until the LoreMaster resolves
that declaration. This one rule (Nate's) shapes everything and dissolves the hard
protocol questions.

## The rule that shapes it: markers materialise at resolution, not on tap
Placing a utility is a DECLARATION, like declaring an attack. During the declare phase
nothing is added to the board — the player picks the square(s) and sees a pending
preview, and the choice rides the existing declare channel to the LoreMaster. The real
marker token is created by the LoreMaster when they resolve that Fell's declaration,
during the resolution phase.

Why this is the right shape:
- Undo needs no new protocol. A pending placement is just a declaration, undoable
  exactly like any declared Act (empty the declare, as saveCombatDeclare does). By the
  time a token exists, resolution has begun and undo is already closed by the existing
  rule — so placement undo is consistent with every other Act for free. No un-place
  message, no removing tokens already on the board.
- Visibility needs no special rule. Before resolution there is no token, only a pending
  declaration seen by the declarer and the LoreMaster (the declare feed). After
  resolution the marker is a board token, visible like any token. "Hidden from enemies"
  stays narrative — the LoreMaster adjudicates the foe not having seen it — rather than
  a mechanical fog.
- No player-authored-token protocol. Tokens stay LoreMaster-authored: the player
  DECLARES the placement, the LM CREATES the token when resolving. LM-only deletion is
  then true by construction (the LM owns what it made), not a permission check.

## The flow
1. Declare phase: arm a place-utility, left-tap an empty square. A pending placement
   preview shows on the player's map and travels with the declaration. Caltrops shows
   its five squares with the countdown by the cursor as they are chosen. The Act is
   declared; consumption is NOT spent yet (an undone declare must place and spend
   nothing). Undoable like any declare, until the LM enters resolution.
2. Resolution phase: the LM resolves that Fell's declared placement and materialises
   the marker token(s) on the board — exactly on the chosen square(s). The token
   carries who placed it. Consumption fires once here, on resolution, with a log line
   ("Astra placed Caltrops on 5 squares"). One-use goes, three-use ticks down.
3. Thereafter: the marker is an LM-owned board token. Only the LM removes it. Rune and
   Trap's automatic trigger (a target stepping in) stays the LM's to adjudicate for now
   — auto-triggering is deferred positional-resolution work for Phase B/C, not this.

## The pieces, in build order
1. The declaration carries the chosen square(s); the pending preview on the player map.
   (Rides the declare channel — no immediate-materialise message. If a distinct message
   is still needed for the LM's resolution-time materialisation, register it in
   FINDINGS F3.)
2. The gesture: left-tap an empty square with a place-utility armed; Caltrops' five
   squares with the countdown by the cursor.
3. Resolution-time materialisation: the LM's board creates the marker token(s) on the
   chosen squares, LM-owned, carrying the placer.
4. Consumption + log fire once, at resolution, after materialisation — not per square,
   not on tap.
5. Marker tokens are inert to targeting: they are not fighters and never resolve as one
   (the tokenFighter path returns null for them), so they cannot be aimed at as targets.

## Correction on record: Glyph is a real combat Act
Earlier this was mis-called unreachable. Glyph is use:"Act" in both the FellGuide and
schemas/seed/Relics.json; its description carries two modes and the in-fight one ("spend
your Act to lay the Affliction onto an enemy") makes it a combat Act. It reaches
cbActUtilities() and its UTILITY_MODEL entry (none/foe) is doing real work. It must not
be removed as dead code — that would cost a player a legal option.
