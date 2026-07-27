# Findings

Things the harness turned up that are worth knowing but are **not** being patched.

A finding lands here when it is real in the code and we can say precisely why, but we
have not shown it bites in production. Writing it down is the point: it stays on the
record without a speculative fix riding on the back of it.

Each entry says what was observed, how it was observed, what is unproven, and what
would settle it.

> These F-numbers are this file's own and run in the order things were found. They are
> not the F-numbers in `COMBAT_PLANNING_BRIEF.md`, which number rules corrections. F2
> here is the FoeForge crash; F2 there is the magic accuracy display.

---

## F1 — A render throw during a bridge load strands LOADING, and the suppressed saves are lost

**Status:** real in the code, unproven in production. Not patched.
**Found:** 2026-07-26, while diagnosing B-case-1.
**Files:** `docs/fellglass.html`

### What is true in the code

`LOADING` shuts the autosave while a Fell is being written into the fields, so a load
cannot be mistaken for the player typing. Three things combine badly:

1. **`loadCharacter` has no try/catch around `renderAll`.** It sets `LOADING` true
   (4445), calls `renderAll()` (4452), then schedules the clear (4454). `renderAll` fans
   out to nineteen render functions on one line. If any of them throws, the clear two
   lines below is never reached and `LOADING` stays set.

2. **The throw also aborts the caller.** The bridge's `init` handler calls
   `loadCharacter(d.character)` at 5696 and then starts clue and combat polling at 5697,
   gated on `CUR_WIX_ID`. A throw inside `loadCharacter` skips 5697 entirely, so the
   sheet goes quiet on the wire — the only thing it ever posts is its opening `ready`.

3. **`scheduleSave` discards rather than defers.** Its `LOADING` guard (4141) returns
   with no timer left pending. The save is not queued for later; it is dropped. So even
   once the watchdog clears `LOADING`, nothing retries the edit that was suppressed. It
   is gone, and the sheet never said so.

The `setLoading` watchdog (4071, `LOAD_MAX_MS` 8000) does bound how long this lasts. It
restores saving. It cannot recover what was already dropped.

### How it was observed

A harness fixture supplied a weapon as `{tree, level, formIdx}`, omitting the
`infusions`, `abilities` and `afflictions` arrays that `newWeapon()` (2368) always
builds. `renderWeapons` dereferences `w.infusions[i]` (3559) and `renderBattle`
dereferences `w.abilities.filter` (3877). Both threw, `LOADING` stayed set, and every
autosave was silently suppressed: `SAVE_SEQ` 0, nothing on the wire but `ready`.

From the outside this was indistinguishable from "leveling does not save".

### What is NOT established

- **That any real record triggers it.** Production weapons come from `newWeapon()` or
  the creation wizard, both of which always include those arrays. The trigger here was
  the harness's own bad fixture. No production path is known to throw in `renderAll`.
- **That the watchdog fails.** It was briefly believed the watchdog had not fired at 8
  seconds. That was never demonstrated — the probe likely ran inside the 8-second
  window. There is no evidence against the watchdog and no change is proposed for it.

### Why it is still worth recording

The failure mode is silent and total. Any render throw on any load, from any cause,
turns the sheet into one that accepts edits and writes none of them, while the save line
still reads whatever it last said. That is the shape of every "it did not save" report
that cannot be reproduced — which the comment above `LOADING` at 4057 already
acknowledges as the reason the flag was made self-clearing.

### What would settle it

A spec that loads a Fell whose record is realistic but incomplete in some way a real
account could produce — a partial migration, an older schema, a field an import
dropped — and asserts the sheet still saves. If one is found that throws, F1 becomes a
bug with a reproduction and gets fixed properly. Candidate fixes, if it comes to that:
wrap `renderAll` so one failing panel cannot take the load down with it, and have
`scheduleSave` defer under `LOADING` rather than discard.

---

## F2 — FoeForge does not start without its bridge: a stale built-in pack throws on load

**Status:** real in the code, pre-existing, believed not to bite production. Not patched.
**Found:** 2026-07-26, while trying to test the F2 accuracy fix behaviourally.
**Files:** `docs/foeforge.html`

### What is true in the code

`const state` is initialised at 1155 and its `signatureAffliction` field sorts the
affliction catalogue by name (1156):

```js
signatureAffliction:((PACK.afflictions.slice().sort((a,b)=>a.name.localeCompare(b.name))[0])||{}).name||"",
```

That reads `.name` off every entry. The **built-in** `PACK` embedded in the page holds
afflictions as plain strings:

```js
"afflictions": ["Ensnared","Disoriented","Staggered", ...]
```

so `a.name` is `undefined` and `.localeCompare` throws. Because the throw happens inside
a top-level `const` initialiser, the rest of that script block never runs: `state` stays
in its temporal dead zone and every function below that reads it — `scaleFoe`,
`renderScaled`, `statText`, the whole tool — is unreachable. The page paints its shell
and does nothing.

The embedded pack carries `"generatedFrom": "85eae58", "generatedOn": "2026-06-23"`. It
is a snapshot from when afflictions were strings, and the shape has since moved.

### How it was observed

Served the repo over http and loaded `docs/foeforge.html` in chromium. One page error,
`Cannot read properties of undefined (reading 'localeCompare')`. `typeof BUILDS`
resolves, `state` raises `ReferenceError: state is not defined`.

Checked against the same file at `5a48a3c`, before the F2 accuracy change, served side
by side: identical error from both. The crash predates that work and is unrelated to it.

### What is NOT established

- **That production is affected.** Live FoeForge takes its pack from the bridge
  (`getFoePack`, `velo/backend/forge.web.js:493`), which serves the `CanonFoePack`
  collection. The seed for that collection holds afflictions as OBJECTS —
  `{"name":"Ensnared","cost":4,"breakout":"Might", ...}` — which is the shape 1156
  wants. So the hosted tool very likely starts fine and only the bridgeless page dies.
- **That the live collection matches its seed.** The seed was read from
  `schemas/seed/CanonFoePack.json`, not from the CMS. If the live rows ever went back to
  strings, production would break exactly the same way.

### Why it is still worth recording

It makes FoeForge untestable and undebuggable outside the site, which is how the tools
are usually worked on, and it fails silently: no message on the page, one console error,
a shell that looks like it merely has no data. It is also a shape drift with a date on
it — a generated fallback left behind by its own source — so the same staleness may sit
in other embedded packs.

### What would settle it

Load the hosted FoeForge and check `PACK.afflictions[0]`. An object means production is
fine and only the fallback is stale, which is a regeneration. A string means the tool is
down for everyone and it is a bug with a reproduction. Either way the durable fix is for
1156 to read a name off both shapes rather than assume one.

---

## F3 — postMessage types this build adds that `checkContracts` cannot be told about

**Status:** not a defect. A register, kept because the fix is a denied path.
**Opened:** 2026-07-26, with the combat card row.
**Files:** `scripts/checkContracts.js` (denied), `docs/fellglass.html`, `docs/threadspire.html`

### Why this entry exists

`scripts/checkContracts.js` pairs every postMessage type a tool emits against the bridge
that handles it, and reports anything unpaired. It has escape hatches for the two
legitimate exceptions — `ALLOW` for a type handled somewhere other than the paired page
bridge, and `CHILD` for a parent talking down into a tool it hosts in an iframe — but
both are literals inside the script, and `scripts/` is denied to agents.

The player-facing combat work talks between ThreadSpire and the FellGlass iframe it
hosts. Those messages are real contracts, just not page-bridge ones, so each one lands
the gate one gap deeper. Rather than let them accumulate unrecorded, every type is
listed here as it is added, with the exact entry it needs, so they can be registered in
one pass by someone who can edit the file.

### The register

| Type | Direction | Entry it needs |
| --- | --- | --- |
| `ts-hand` | FellGlass → ThreadSpire | `ALLOW.fellglass` += `'ts-hand'` |
| `ts-hand-request` | ThreadSpire → FellGlass | `CHILD.threadspire.types` += `'ts-hand-request'` |

Applied, that is:

```js
fellglass: ['init', 'new', 'libraries', 'ts-hand'],   // ts-hand is handled by docs/threadspire.html, not the page bridge
CHILD = { threadspire: { tool: 'fellglass', types: ['ts-god', 'ts-new', 'goto-panel', 'ts-hand-request'] } };
```

### The rule this register follows

A type goes in `CHILD` when ThreadSpire sends it down to the sheet, because the sheet is
the thing that must handle it and the checker can verify that. A type goes in `ALLOW`
when the sheet sends it up to ThreadSpire, because the checker only knows about the
sheet's *page* bridge and cannot see ThreadSpire handling it.

Renaming a message to slip past the checker's `PING` exemption would make the gate green
and the contract unchecked. Not done, and not to be done.

### What would settle it

The two entries above, applied in one edit. Until then `npm run contracts` reports one
gap per row in that table, and those gaps are expected rather than new.
