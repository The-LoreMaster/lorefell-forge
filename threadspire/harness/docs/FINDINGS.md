# Findings

Things the harness turned up that are worth knowing but are **not** being patched.

A finding lands here when it is real in the code and we can say precisely why, but we
have not shown it bites in production. Writing it down is the point: it stays on the
record without a speculative fix riding on the back of it.

Each entry says what was observed, how it was observed, what is unproven, and what
would settle it.

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
