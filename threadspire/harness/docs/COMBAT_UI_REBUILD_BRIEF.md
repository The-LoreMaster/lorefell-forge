# Combat rebuild — three phases, tested as they land

For Claude Code. The player-facing combat we built ships the declare UI in the wrong
place (the FellGlass slideout's own panel) instead of on the table, and the deeper
resolution mechanics needed for Lorebound Reacts do not exist yet. This brief covers
three phases. A is independent and ships first. B is foundational engine work. C sits
on B. Build and test each in order, same discipline as the rest of combat: prove a
piece before the next sits on it, harness tests against the real files, docs→embeds
mirror, canon gate, never touch scripts/ or schemas/.

Confirmed by the designer against live testing: the sheet's declare panel currently
takes the whole slideout; the table card row (#hand) is built but not the surface
players actually use; right-click/tap aiming can't work because there are no cards on
the table to arm; the LM lockout and per-interaction resolution do NOT exist (verified
in fatewell.html: setPhase has no readiness check, cbResolveSpot resolves a whole
spotlight in one batch).

---

## PHASE A — the combat UI on the table (independent, ship first)

The table card row (#hand, renderHand in threadspire.html) becomes THE player combat
surface. The sheet's own declare panel is retired.

**A1 — Retire the sheet's declare panel.** In fellglass.html, the battle panel
(renderBattle / cbDeclareFormHtml / cbDeclareFormInit) must no longer render the
declare form for a player in a ThreadSpire fight. The slideout still opens for the
reference tabs (Inventory, Skills, Lore, Arsenal, Attributes) — those stay — but the
"Declare Your Act" builder is gone from it. Do not delete the underlying transport
(sendDeclare) or the derivation (COMBAT_ACTS/REACTS); the table row uses both. Only
the on-sheet declare *UI* is removed.

**A2 — A subtle reminder pill on the map.** Bottom-right, to the LEFT of the Fellmark
gem, a pill reading "More Options" with an arrow pointing toward the gem. It reminds
the player the sheet is there (Inventory/Skills/Lore). Requirements: semi-transparent
and subtle, NOT loud; and it must never overlap the cards, nor the cards it. The card
row ends with padding before the pill; the pill never sits on top of a card.

**A3 — The card row, Option A refined.** Horizontal strip under the map (the built
#hand row), with:
  - Cards from COMBAT_ACTS/REACTS as already built (locked-but-visible per F9).
  - Acts / Reacts tabs above the row; tapping a tab switches which group shows.
  - Left/right pager arrows that appear ONLY when they do something: left shows only
    once scrolled/paged right of the first card; right shows only when cards extend
    past the visible edge (before the pill). Both recompute as the player pages and as
    the hand changes (a spent charge can add or remove cards).
  - Cards stop before the pill with padding; the row never runs under it.
  A visual prototype of this exact layout exists (shared separately) — match it.

**A4 — Tap-to-commit, no Send step.** Tap a card to arm it (gold glow, grow, shimmer —
already built). Then tap a target token to declare — the tap on the target IS the
send. There is NO separate "Send to LoreMaster" button. Right-click a token (desktop)
routes to the same declare. Right-click on an EMPTY map still opens the roll picker
(unchanged). Right-click a token with NO card armed = a standard attack on that token
(the default). Tap flow is primary and identical on phone and desktop; the drag-vs-tap
distinction already built keeps it drag-safe.

**A5 — Two-sided declared confirmation.** After a declare lands:
  - Player side: the armed card stamps "Declared at <target>" and locks; the target
    token gets a marker. The player can plainly see it went through.
  - LM side: the declaring Fell shows a "declared" indicator (token glow or strip
    check) so the LM sees at a glance who is locked in and who they are still waiting
    on.

Phase A depends on nothing below and fixes the live problem players are hitting now.
Ship it first.

---

## PHASE B — the resolution engine (foundational; build before C)

Two things that do NOT exist and must be built. C cannot work without them.

**B1 — The LM lockout before Resolution.** The LoreMaster cannot enter the Resolution
phase until BOTH:
  - every player Fell in the fight has a declaration (an Act, or an explicit Pass), and
  - every foe has a commit (intent + target + accuracy set).
Add a readiness check to the phase transition (setPhase / lockCommits path in
fatewell.html, which today sets the phase with no check). Until ready, the Resolve
control is disabled and shows what is still missing (which Fells have not declared,
which foes are not committed).

**B1a — A Pass declaration.** A player can explicitly declare Pass (doing nothing this
round). A Pass counts as their declaration and satisfies the lockout. Surface it on
the card row as a clear option (e.g. a "Pass" control alongside the cards).

**B1b — LM override.** The LoreMaster can force-mark any player or foe as complete, so
a missing declaration never stalls the table. An overridden combatant is treated as
ready for the lockout. The override is the LM's, visible as such, and reversible before
resolution.

**B2 — Per-interaction resolution granularity.** Today cbResolveSpot resolves an entire
spotlight in one batch forEach. Refactor so a spotlight resolves interaction by
interaction: each foe→Fell and Fell→foe exchange is a discrete, observable resolved
event with its own "resolve" step, and a spotlight is a sequence of these. Preserve
every existing effect (affliction application, Ignited damage, charge advancement on a
confirmed hit, recap, undo) — this is a restructuring of WHEN each interaction resolves,
not a change to what resolving does. The undo stack must still work, per interaction now
rather than per spotlight. This is the substrate Phase C hooks; it is core-loop surgery,
so it gets its own tests proving each interaction resolves in order and the aggregate
outcome matches the old batch resolve exactly.

---

## PHASE C — the Lorebound React auto-prompt (sits on B)

When an interaction resolves (B2) that matches a Lorebound's trigger and the ally is in
range, prompt that Lorebound's OWNER to react, with the benefit landing on the TARGETED
Fell.

**C1 — Per-Lorebound trigger data.** Each Lorebound type has its OWN trigger event,
written as prose in the vault (Solmera: a Fell is hit; Grimgrit: a Fell is hit; Xenophis:
a Fell takes damage; Vixel: an ally is marked; Drakelith: Fells in range; etc.). Encode
these triggers as structured data drawn from the FellGuide — report which Lorebounds lack
a clearly stated trigger so the vault can be filled. Do not invent triggers; read them.

**C2 — Range.** The trigger fires only if the affected Fell is within the Lorebound's
Mobility range of the Lorebound's token: 5 squares in all directions for Familiar and
Companion, 10 for Corsair (Mobility 5 base, doubled at Corsair — confirmed in the
FellGuide). Measured Lorebound-token → affected-Fell-token.

**C3 — Owner prompt, ally benefit.** When a matching trigger fires in range: switch the
Lorebound OWNER's card row to the Reacts tab and glow the usable Aspect card(s) — as many
stages as the owner's current charge allows (Charge 1 = Initial; 2 = +Branching; 3 =
+Crown). The player picks; do not auto-fire. The Aspect's benefit lands on the FELL WHO
WAS TARGETED (an Aspect supports allies; the owner only benefits from their own at Corsair
form — respect that). If the Aspect is charge-locked (no usable stage), do NOT prompt.
Only prompt when actually usable.

**C4 — Timing, no interruption.** The prompt fires at the moment its triggering
interaction resolves (B2), never mid-declaration. Because of B1, the LM can't reach
Resolution until everyone has declared, so there is no declaration to interrupt. The
prompt is a consequence of a resolved hit, offered to the owner during resolution.

**C5 — Clears** when the owner reacts, the round ticks, or the affected Fell leaves range.

Build C only once B2 gives it discrete resolved interactions to hook.

---

## Sequence and testing

A first (ships the live fix). Then B1/B1a/B1b, then B2 (with tests proving per-interaction
resolve equals the old batch aggregate). Then C on top of B2. Each phase: harness tests
against the real files, docs→embeds mirror, canon gate, FellGuide as the rules oracle,
new message types recorded in FINDINGS F3. Push per step so it can be verified against
canon as it lands.

---

## Phase B addition — the urgent-alert corner (top-left, always on)

Decided during Phase A live testing. When the combat panel moved to the Fellmark gem
(#4), urgent prompts that used to ride the banner across every tab (roll Evasion,
incoming hit, your React is needed) became gem-only and so missable if a player is
heads-down in a reference tab. The resting panel belongs on the gem; an urgent, time-
sensitive prompt does not.

The answer is a dedicated urgent-alert zone in the TOP-LEFT corner (the LM log is top-
right at ~88.8% left, so top-left is clear):
  - Fixed to the corner, z-index above everything — slideouts, the gem, the cards. No
    tab, panel or slideout can cover it.
  - Shows regardless of what the player is looking at. Deep in Inventory or not, an
    urgent prompt is right there.
  - Pulsing and obvious, urgent styling, respecting prefers-reduced-motion.
  - Only when needed: appears for a live urgent prompt and is hidden otherwise, never
    persistent clutter.
  - Tappable — taking the player to the action (roll / the gem / the React).
  - Clears when the player responds or the prompt is no longer live.

Scope of "urgent": time-sensitive things that cost you if missed — roll Evasion
against an incoming attack, a React that is needed now, "you are up". NOT the resting
state (the hand, the declared card, charge) which stays on the gem and the row. The
corner is strictly "respond now or lose the chance".

BOTH SIDES. The corner serves the LoreMaster and the player alike — every urgent
prompt surfaces there regardless of which side you are and what you are looking at.
For the player: roll Evasion, React needed, you are up. For the LoreMaster: the
prompts that belong to running resolution — a Fell is waiting on a ruling, all
players have declared and the board is ready to resolve, a foe's React is up. Same
top-left zone, same always-on rule, same "respond now" scope, on each screen.

Why it belongs in Phase B, not A: the prompts it surfaces are fired by the resolution
phase (per-interaction resolution in B, Lorebound React prompts in C). In Phase A
there is nothing urgent to surface, so the zone would be built empty. Build the corner
WITH the prompts that populate it, so it is designed around the real prompts rather
than guessed ones. It serves both sides from the start (see BOTH SIDES above), so the
LM's resolution prompts and the player's React prompts share one always-on zone.
