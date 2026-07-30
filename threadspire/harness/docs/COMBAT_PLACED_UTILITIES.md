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
1. **Done.** The declaration carries the chosen square(s); the pending preview on the
   player map. (Rides the declare channel — no immediate-materialise message, and none
   turned out to be needed: see piece 3.)
2. **Done.** The gesture: left-tap an empty square with a place-utility armed; Caltrops'
   five squares with the countdown by the cursor.
3. **Done.** Resolution-time materialisation: the LM's board creates the marker token(s)
   on the chosen squares, LM-owned, carrying the placer.
4. **Built, and waiting on velo.** Consumption + log fire once, at resolution, after
   materialisation — not per square, not on tap. Both sides are written and covered; the
   channel between them is three velo files that have to be pasted. See below.
5. **Done.** Marker tokens are inert to targeting: they are not fighters and never resolve
   as one (the tokenFighter path returns null for them), so they cannot be aimed at.

## What piece 3 turned out to be, and the two traps in it

No new message type. The marker is a board TOKEN, and the board already replicates to
every player through the state feed, so the LM making one is the whole of the transport.
F3's register needed no new row.

`resolvePlacement(charId)` is on the LM's Ground row, beside the readout A25 built. It
reads the declare, snaps each square the same way a token snaps, and pushes one marker per
square. Two things in that were nearly wrong in ways that would have shipped looking right:

- **The placer goes in `placer`, never in `charId`.** `tokenIsMine` reads `charId`, so a
  marker carrying it would be draggable by the Fell who placed it — a player quietly moving
  their own caltrops after the fact, which is exactly the ownership the whole design was
  arranged to avoid. `tokenArt` reads it too and would have put the placer's portrait on
  the thing. A marker records who placed it; it does not impersonate them.
- **The placement's id comes from the declaration, not the clock.** `placementId` is
  `pl:<charId>:<round>:<utility>` — a Fell spends one Act a round, so that names a
  placement exactly once. A `Date.now()` id would make the same placement a different
  placement on every read, so nothing could recognise a repeat and "Place it" twice would
  put down two sets. It also means both sides can derive the same id without telling each
  other, which is what piece 4 needs.

"Already resolved" is asked of the BOARD (is there a marker with this pid) rather than of a
flag kept beside it, so it survives the LoreMaster reloading their own page. The tokens are
the record.

## Piece 4: what it turned out to need

The log fires at resolution on both sides now. The pack getting lighter lives on the sheet,
in `cbSpendUtility`, and it used to fire inside `cbDeclare` at declare-build. It no longer
does — for a `target:"place"` utility only; a Tablet or an Ash Salt is still spent where it
always was, because those really do resolve the moment they are chosen.

### Why this signal is guarded differently from every other one

Three things already travel LM → sheet: a pending hit, a recap, a charge. Each compares an
`at` stamp against a variable in the sheet's window, and that is good enough for them — a
reload re-showing a pending hit is harmless, and re-applying a charge is idempotent because
it is a SET. Taking a utility out of an inventory is a DECREMENT and is neither. A reload
mid-battle would charge the player twice for the same Caltrops.

So the guard is durable at both ends of the store:

- the board writes `placed = {pid, util, squares, at}` to the Fell's `CombatPlayer` row
- the sheet spends and writes back `placedAck = pid` through the existing combat-sync
- the condition is `placed.pid !== placedAck`

The window variable beside it is only the fast half — it stops one poll firing while the
ack is in flight. Two rules make it hold:

- **The sheet ADOPTS the stored ack the moment combat state arrives**, before anything of
  its own can push. Without that, a fresh sheet pushes an empty ack over a real one and the
  placement reads as unspent again.
- **An empty ack is never written to the row.** Empty means "I have nothing to say", never
  "forget what I said". Enforced at the velo end as well, so one careless caller cannot
  erase it.

Both halves of the guard have a case in A29 that fails without them — the durable half was
probed by deleting it and every case still passed, so the two-copies-of-one-sheet scenario
was added to make it earn its place.

### What has to be pasted, and in what order

Nothing above is live until three velo files are updated. `velo/**` is denied to agents and
has no workflow — it is pasted by hand.

1. `combat.web.PROPOSED.js` — whole-file replacement. Adds `resolveCombatPlacement`, serves
   `placed`/`placedAck`, accepts an ack on sync.
2. `page-threadspire.PATCH.md` — two edits: one import, one `TS_COMBAT_PLACED` case.
3. `fgSheetBridge.PROPOSED.js` — whole-file replacement. Passes `placedAck` on sync, **and
   passes `places` on the declare, which it never has** — see F11. That second one is not
   part of piece 4; it may be why the squares are not arriving live at all.

And two Text fields on `CombatPlayer`: `placed`, `placedAck`. Wix accepts a write to a
field that does not exist and keeps nothing, which is F8's shape, so a missing field looks
exactly like a feature that does not work.

## The Darkshard argument, named rather than settled

Piece 5 says a marker is never a fighter and can never be aimed at. The FellGuide gives a
Darkshard a Vitality and says it "shatters when it takes damage equal to its Vitality",
which makes it a thing that CAN be attacked — so for that one utility the rule and the book
disagree.

Left as it is on purpose. A Darkshard being broken is the LoreMaster's to adjudicate, the
same as a Rune going off when somebody steps into its square, and both are the same
deferred piece of positional resolution. Making one marker targetable and not the others
would need a shape neither the wire nor the board has today. It is written here so that
nobody later reads `tokenFighter` returning null for a Darkshard as an oversight.

## Correction on record: Rune and Trap could not be used at all

Found starting piece 3: `cbActUtilities` matched `use === "Act"` exactly, and the Relics
collection says `"Act to place"` for a Rune and a Trap. Two of the four utilities this
document is about could be carried, equipped and never spent — they were absent from the
Act picker AND from the reminder list. Fixed; see F10 in FINDINGS.md. The harness fixtures
had been handing the sheet `use:'Act'`, a value the store has never produced, which is why
every placement spec was green over it.

## Correction on record: Glyph is a real combat Act
Earlier this was mis-called unreachable. Glyph is use:"Act" in both the FellGuide and
schemas/seed/Relics.json; its description carries two modes and the in-fight one ("spend
your Act to lay the Affliction onto an enemy") makes it a combat Act. It reaches
cbActUtilities() and its UTILITY_MODEL entry (none/foe) is doing real work. It must not
be removed as dead code — that would cost a player a legal option.

## Next work: adjacency, and the visibility fork (for the next session)

Two items came off the table once placement went live. See F12 in FINDINGS.md for the full diagnosis, this is the build brief.

### Decided, so build to it

Nate has ruled on the one open design question. The LoreMaster sees a placement in two moments, in sequence, and nothing in between:

1. On declare, as a readout. The instant the player commits the placement (the last square is the commit, same as the last tap on a target), the LoreMaster sees the squares on the declaration through declarePlacesHtml, which of the grid cells, listed. This already exists and is the row the placement is resolved from.
2. On resolution, as markers. When the LoreMaster presses "Place it", real tokens appear on the board for everyone and the pack decrements. This is piece 3 and 4, already built.

Do NOT stream the squares to the LoreMaster while the player is still tapping them. That was considered and rejected: it leaks the player's intent mid-decision and it fights the declare-on-last-tap model, which has nothing to send before the final tap anyway. Both moments above, and only those two.

### Item 1: enforce adjacency on the placement gesture

The rules bug. Caltrops in Relics.json: "When thrown, they cover five adjacent spaces from where they land." Rune and Trap are single-square today so adjacency is moot for them, Caltrops is the one that needs a cluster. The gesture in handPlaceAt (docs/threadspire.html) currently allows any square. It needs a spatial constraint driven off the utility model.

The shape to build, staying inside the pattern handPlaceNeedsEmpty and handSquareTaken already set (a tap that breaks a rule is ANSWERED on the board through handSay, never silently dropped):

- The utility model in docs/fellglass.html (near line 6078) needs space to carry the spatial rule, or a new field alongside it. Right now space is only "any" vs "empty" (may the square be occupied). Caltrops wants a third idea: the squares must form an adjacent cluster from a landing point. Propose the field name to Nate before building, do not overload space if it muddies the occupied-vs-open meaning it already carries. A separate contiguous:true or adjacent:true reads cleaner. His call on the name.
- First tap is the anchor, "where they land". It is always legal (subject to the existing empty check).
- Each subsequent tap must be adjacent to at least one square already placed. 8-neighbour or 4-neighbour: ASK, the book says "adjacent" and does not distinguish, do not guess. A non-adjacent tap is refused with a handSay line the way an occupied square is, so the player learns the rule from the board.
- The grid math is already in handSquareTaken and handPlaceAt (snap, cell size S.grid.size). Adjacency is a one-cell delta check against the existing armed.places list. Do not invent new coordinate handling, reuse the snap already there.
- The fixture and spec for this lives with the other placement specs. F10's lesson applies: the harness fixtures have handed the sheet values the store never produces (use:'Act'), so any new spec must be checked against what Relics.json and UTILITY_MODEL actually carry, not against a convenient fixture. Verify both ends with the same tool (F9).

Watch the cascade space already has: it is read in handPlaceNeedsEmpty, and the picker near line 5358 also lists a "Space" option for the ability forge, a different space, unrelated, do not touch it. Grep before renaming.

### Item 2: the visibility fork, repaste do not recode

The LoreMaster reported seeing no placement. The repo is correct end to end (combat.web.js selects places, fgSheetBridge forwards it, page-threadspire wires the resolve). So this is a stale or partial hand-paste into Wix, and the Ground row on a real declared Caltrops names which file:

- no Ground row: repaste combat.web.js (stale read, predates F7)
- "empty": repaste fgSheetBridge.js (the F11 hop, drops places)
- "unparsed": partial paste of the read side
- "not sent": stale read again (the CMS column now exists)

Get this reading from Nate FIRST. It costs one declared Caltrops and it tells you whether there is any code to write at all. For item 2 there is not, only a repaste. Do not open the velo files to "fix" a bug that is a stale paste, that is the detour F9 warned about, verifying the wrong end.

## Not forgotten: Rune and Trap placement, and their trigger (future build)

Rune and Trap are placed today (single square, they materialise on the resolution swap like Caltrops), but their RULES are not built. Both share a shape distinct from Caltrops:

- One marked space, not a cluster. `places` defaults to 1, so `adjacent` does not apply, and the placement gesture already handles a single square.
- Each carries a BOUND EFFECT chosen when placed: a Rune holds a spell, a Trap holds a physical ability. Canon (Relics.json): "When a target steps into the marked space, the rune casts the spell automatically with no roll" / "the trap strikes automatically with no accuracy roll". The effect fires the instant it is sprung.

What is NOT built, and needs its own pass:

1. Choosing the bound effect at placement. A Rune needs to know WHICH spell, a Trap WHICH ability. That is a second selection layered on the placement act, and the source list is the placer's own spells/abilities. Where that picker lives and how the choice travels in the declare is the design question.
2. The trigger. "A target steps into the marked space" is a movement-driven auto-fire, the same deferred trigger noted for the placed-utilities pass from the start. It needs: detection that a token entered the square, whose turn resolves it, and the no-roll application of the bound effect to whoever sprang it. This is the hard half and it is shared in shape with how a Darkshard's radius is checked (a positional test on the board), so the two may want to be built with one proximity/entry mechanism rather than two.
3. Friend or foe. Does a Rune fire on anyone who steps in, or only enemies? Canon says "a target", which is ambiguous. ASK Nate.

Art for both is already wired (Rune and Trap PNGs on the Relics rows and in MARKER_ART), so they render correctly on placement now. Only the rules remain.
