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
| `ts-declare-result` | FellGlass → ThreadSpire | `ALLOW.fellglass` += `'ts-declare-result'` |
| `ts-hand-request` | ThreadSpire → FellGlass | `CHILD.threadspire.types` += `'ts-hand-request'` |
| `ts-declare` | ThreadSpire → FellGlass | `CHILD.threadspire.types` += `'ts-declare'` |
| `ts-undo` | ThreadSpire → FellGlass | `CHILD.threadspire.types` += `'ts-undo'` |
| `ts-undo-result` | FellGlass → ThreadSpire | `ALLOW.fellglass` += `'ts-undo-result'` |

Applied, that is:

```js
fellglass: ['init', 'new', 'libraries', 'ts-hand', 'ts-declare-result'],   // handled by docs/threadspire.html, not the page bridge
CHILD = { threadspire: { tool: 'fellglass',
          types: ['ts-god', 'ts-new', 'goto-panel', 'ts-hand-request', 'ts-declare'] } };
```

### A blind spot worth knowing about while applying these

`emits()` only recognises a type it can see inline in the call:

```js
matchAll(/\.postMessage\s*\(\s*\{\s*type\s*:\s*['"]([^'"]+)['"]/g, s)
```

A payload assembled into a variable first and posted afterwards is invisible to it, so
the gap count understates the real contract surface rather than overstating it. `ts-declare`
was written that way at first and the checker did not see it at all; it is now posted as a
literal so the gate can check it. Worth remembering when reading a green result: green
means nothing unregistered was *detected*, not that nothing unregistered exists.

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

---

## F4 — The harness decides a declare's adventure differently from production

**Status:** a known limit of the mock, not a defect in either. Recorded so nothing is
believed to be covered that is not.
**Opened:** 2026-07-26, building the declare relay for S3e.
**Files:** `threadspire/harness/host.html`, `velo/backend/combat.web.js`

### The difference

`saveCombatDeclare` does not take a campaign from its caller. It looks one up from the
character:

```js
const campaignId = await charCampaign(charId);   // reads the Characters row
```

So in production the adventure a declare belongs to is a property of the **Fell**, and a
declare is filed wherever that Fell's record says it belongs, no matter which page sent
it.

The harness has no Characters collection to ask, so `takeDeclare` files the declare under
the **sending frame's** binding instead.

### What that means for what the specs can prove

For every arrangement the scenarios actually set up, the two agree: the fixture Fell
belongs to the adventure their frame is bound to, so both routes reach the same row. S3e
is sound for what it claims.

They come apart in exactly one case, and it is a case the harness therefore cannot catch:
a Fell whose record points at adventure A sitting in a frame bound to adventure B.
Production files that declare under A and the LoreMaster running B never sees it, which
would read at the table as "my declare did not go through" with nothing wrong on either
screen. The harness would file it under B and the round would appear to work.

This is the same family as B6, which guards the board against another adventure bleeding
in. There is no equivalent guard on the declare path, in the harness or in a spec.

### What would settle it

Give the harness a character-to-adventure map, resolve `takeDeclare` through it rather
than through the frame binding, and add the mismatched case as its own scenario: a Fell
bound elsewhere declares, and the LoreMaster of the frame's adventure must NOT see it.
That is a harness change plus one spec, and until it exists the declare path is only
proven for Fell who are where they say they are.

---

## F5 — Two functions sharing a name at the top level of one script, twice now

**Status:** both instances fixed. Recorded because it is a pattern, not an incident, and
because nothing in the toolchain catches it.
**Found:** 2026-07-26, building the combat round trip.
**Files:** `docs/fellglass.html`, `docs/threadspire.html`

### What happened, twice

A classic script hoists every top-level `function` declaration onto one object, so a
second declaration of the same name silently replaces the first EVERYWHERE, including at
call sites written before it. No error, no warning, nothing at load.

**`sendDeclare`, in fellglass.html.** The transport at 4636 and a builder added later by
22482d5. The builder won, so its own last line handed its payload to itself and recursed
until the stack gave out, and the reqId, the pending table and the seven second retry
became unreachable. A declare carrying damage never left the sheet. Verified in a browser:
RangeError, zero messages posted.

**`lmSetCharge`, in threadspire.html.** The remote push at 3869 and the strip's charge pip
toggle, `lmSetCharge(side, id, tier)`, at 7530. The pip toggle won, so `chargeFell`'s call
arrived with a charId where a side belongs and a value where an id does. `findC` could not
resolve it, so it did nothing and reported nothing: a charge a Fell had earned never left
the LoreMaster's board and their sheet went on showing the old meter.

### Why neither was noticed

Both failures are silent in the way that matters. The first threw, but inside a click
handler where the exception went to the console and the button simply appeared to do
nothing. The second did not even throw. Neither is visible by reading the calling code,
which is the trap: at both call sites the name meant the right thing and resolved to the
wrong function.

Both were caught the same way, and it is worth naming. A test was written against the
function that had been READ, and it failed against the function that actually RUNS. The
test did not know it was looking for this; it simply asserted an outcome and did not get
it. An assertion that the effect happened, rather than that the call was made, is what
made either of them findable.

### What is NOT established

Whether there are more. Two were found by tripping over them, not by looking. Nothing in
`npm run checks` looks for duplicate top-level declarations, and `checkGlobals` is about
globals READ without being SET, which is a different question and would not see this.

### What would settle it

A check over each tool's HTML that collects `^function NAME` at the top level of every
script block and reports any name declared more than once. That is a small script, it is
mechanical, and it would have caught both of these at the moment they were introduced. It
belongs beside checkContracts and checkGlobals, which means `scripts/`, a denied path, so
it is written down here rather than added.

---

## F6 — The sheet's own Act dropdown cannot tell two weapons apart

**Status:** real, reproduced, deliberately not fixed. It bites only when the sheet is
used on its own; ThreadSpire's card row, which is the surface at the table, resolves this
correctly now.
**Found:** 2026-07-27, building per-card selection for the card row.
**Files:** `docs/fellglass.html`

### What is wrong

`renderBattle` puts one Act per weapon, so a Fell carrying two trees has two entries
named "Basic attack", differing only in `src`. They are not the same deed: the damage
differs, and `Afflicted`, `Merciless`, `Powerful` and `Ethereal` are all read off
`e.src` inside `cbDeclare`.

The declare UI carries the Act as a bare name. `cbArOptions` gives both entries the same
option value, `cbHandPick(nm)` sets the select by name, and `cbActEntry` returns the
first match. So a player looking at two identical "Basic attack" options picks one, has
no way to tell which, and always gets the first weapon's.

### What is already fixed, and why that is not this

The row identifies a card by source and position, sends `src` with the declare, and
`cbActEntry(nm, src)` prefers the weapon named. `src` is a preference: a caller that
passes nothing gets the first match exactly as before, which is what keeps this dropdown
working rather than newly broken. Proven in `s3g`, against the real sheet, both ways
round.

That fix stops at the wire. It cannot reach the dropdown, because the dropdown never
knows which weapon in the first place.

### Why it is not being fixed here

The option value would have to stop being the Act's name and start being an identity,
and four places read it as a name: `cbHandPick`, `cbKindOf`, `cbHandSeg` and
`cbDmgHint`. That is a refactor of the sheet's declare UI, and the sheet's declare UI is
retired while ThreadSpire is hosting: on the table this code does not run. It is off-table
solo use that still reaches it.

### What would settle it

Give each Act a stable key in `renderBattle`, value the options by it, and take the four
readers through a lookup instead of a name. Then `cbActEntry`'s `src` argument becomes
belt and braces rather than the only thing standing between a player and the wrong
weapon. One spec: two weapons, pick the second in the sheet's own dropdown, assert the
damage that goes out is the second one's.

---

## F7 — A declared placement could not reach the LoreMaster (FIXED, and my diagnosis was wrong)

**Status:** fixed in velo by Nate, commit 24bfb6a. Kept because the way the finding was
WRONG is the useful part.
**Found:** 2026-07-28, building Caltrops, Rune, Trap and Darkshard.
**Files:** `velo/backend/combat.web.js` (denied to agents), `threadspire/harness/host.html`

### What was wrong

A placed utility is declared with the squares it goes on. `saveCombatDeclare` wrote a
fixed set of fields with no room for them, so a placement travelled from the row to the
sheet to the page and died at the collection.

### What I got wrong, which matters more than the finding

I wrote this up as ONE line, on the write path:

```js
row.places = Array.isArray(d.places) ? d.places : [];      // what I said
```

It was three sites, and that line alone would have made things worse rather than better:
the squares would have been persisted and never read back, so the feature would still have
been dead live while looking fixed in the diff. The write is only a third of a round trip
and I stopped at it - I traced how the data leaves and never asked how it returns.

What it actually needed:

```js
row.places = JSON.stringify(Array.isArray(d.places) ? d.places : []);   // write
places: jparse(it.places, [])                                          // the LM's declare list
places: jparse(pr.places, [])                                          // a Fell's own declaration
```

And a JSON string rather than an array, because an array does not fit a Wix TEXT field -
the same treatment `defEva` and `plog` already get, which was sitting in the same
function as the answer.

### What the harness now does about it

It round-trips `places` exactly as the collection does: JSON string on write, `jparse`
on read, at all three sites. It used to hold an array, which made the mock a DIFFERENT
SHAPE from the store rather than merely a more capable one - a JSON-encoding fault would
have passed here and failed live. That is the same class of miss as the finding itself,
and it is closed rather than noted.

### What is still not proven

That a placement's squares survive to the LoreMaster on the live site. The velo change is
pasted; until a real round trip is seen, the LoreMaster-side materialisation is not being
built against the harness alone.


---

## F8 — The seed reported success while the site served a truncated tool (SUPERSEDED by F9)

> **The diagnosis below is wrong.** Nothing was ever truncated and the seed was never at
> fault. The rows this calls short were the only correctly decoded ones; the rows it calls
> healthy were serving raw base64. F9 has the real cause. The hardening described here is
> worth keeping on its own merits, but it fixed nothing, because nothing here was broken.

Three round-3 fixes were verified, committed, merged, deployed and green, and none of
them were on the live site. Two of the three were in `threadspire.html`; the third was
in `fellglass.html`. Everything that could be checked from the repo said they had
shipped: the full suite passed, the gate passed, GitHub Pages served both files with
every change present, `embeds/` carried them, and Seed Embeds ran green for both
commits.

### The chain nobody was watching

The live site does not serve from Pages at all. It serves from the `SiteEmbeds` CMS
collection through `GET /_functions/embed?slug=<tool>`, seeded from `embeds/**` by
`scripts/seedEmbeds.js`. Pages being green is not evidence about the live site, and for
this whole session it had been read as if it were.

A tool too large for one Wix item is split across part rows - the head at `slug`, the
rest at `slug#2`, `slug#3` - and each chunk is stored base64 encoded. Nate's `?info=1`
readout showed threadspire reassembling to ~505,000 characters against 550,487 on disk:
seven parts present, none missing, but two of them holding 90,000 base64 characters
where they should have held 120,000.

### What the numbers say, and what they do not

90,000 base64 characters decode to exactly 67,500 bytes - three quarters. A chunk sized
at 90,000 characters of plain HTML inflates to 120,000 once base64 encoded, so a field
whose maxLength was set back when a chunk WAS 90,000 plain characters would keep exactly
the first 90,000 of the encoded value and drop the rest. The history fits: `CHUNK` was
360,000, then 90,000, and base64 arrived later still, in a commit whose message says the
schema had already been formalized.

What that theory does NOT explain is why only two of the six full-size rows were short
rather than all of them, and the collection schema cannot be read from the repo. So the
cause is a strong candidate, not a proven one - which is why the fix below does not
depend on it being right.

### The actual defect

`seedEmbeds.js` asked every write whether it returned 2xx, and every write did. A 2xx on
a write is not evidence that the bytes landed: a store can accept a value and keep less
of it. The script had no read-back, so it could not tell "stored" from "accepted", and
reported success for a collection that would serve a tool with a hole in it.

This is F5's shape again, and A6's, and the one this file keeps recording: a green signal
measuring something adjacent to the thing that matters. The suite proved the code was
right. Nothing proved the code was *served*.

### The fix

The run now reads back every row it wrote, decodes it exactly as `get_embed` does,
reassembles head + parts in order, and compares the result to the file on disk character
for character. A mismatch fails the run. The claim is no longer "the writes were
accepted" but "the site will serve the file we have".

Because a truncating field is invisible from outside, a mismatch is also repaired rather
than only reported: the read-back says how much the field actually kept, and four base64
characters carry three bytes, so the chunk size is recomputed and rewritten in one step.
A cap nobody can see becomes a cap that is measured.

Three smaller things were closed on the way, each the same silence one layer over:

- Chunks are now budgeted in BYTES, not characters. The limit sits on the encoded string,
  base64 is a function of bytes, and 90,000 characters of one tool is 90,048 bytes and of
  another exactly 90,000 - so a character budget lands on a different encoded length for
  every file and cannot be reasoned about.
- The split walks code points instead of slicing by index. `String.slice` cuts on UTF-16
  units, so a chunk boundary could fall between the halves of a surrogate pair and each
  half would encode to a replacement character - a document differing from the file by a
  character nobody could see.
- `get_embed` collects parts with `.limit(100)` and silently reassembles what it has, so
  the seeder refuses to write more parts than the reader will ever fetch.
- The row snapshot is re-read rather than taken once before the run's own inserts. A slug
  that is not found is INSERTED, and `get_embed` takes the head with `.limit(1)`, so a
  duplicate row lets the site serve a stale chunk while every write succeeds. Duplicates
  are now deleted and named.

### What this does not cover

`scripts/` is guard-denied, so the replacement was written and tested against a simulated
collection and handed over to be applied by hand. The simulation covers a healthy store, a
field capping at 90,000 and at tighter values, and a row that accepts a write and keeps
nothing - that last one must fail the run rather than shrink the chunk, since a smaller
chunk cannot fix a refused write.

---

## F9 — atob does not return what the decode assumed, and the failure was silent

For a week the live ThreadSpire was missing changes that had been verified, committed,
merged, deployed and seeded green. Three re-seeds changed nothing. The cause was one
expression in `get_embed`:

```js
decodeURIComponent(escape(atob(raw)))
```

That idiom needs `atob` to return a BINARY string - one character per byte, every code
unit under 256 - so that `escape` can turn each byte into `%XX` and `decodeURIComponent`
can read the run of them back as UTF-8. In this backend `atob` returns a string that has
ALREADY been decoded as UTF-8.

For a chunk of pure ASCII the difference does not exist and the idiom round-trips
perfectly. For a chunk holding even one character above 0x7F, `escape` emits a single
`%XX` for a whole code point, `decodeURIComponent` finds a byte that cannot begin a UTF-8
sequence, and throws `URIError`.

And then:

```js
catch (e) { return raw; }
```

The raw base64 was served as though it were the document. Right length, right content
type, 200 OK, and base64 text where the tool should be.

### What made it so hard to see

Of seven part rows, the only two that decoded were the only two whose source is pure
ASCII. So `?info=1` reported five rows at their base64 length and two at their decoded
length - and we read it exactly backwards, calling the five healthy and the two truncated.
Every number after that was interpreted through that inversion. The seed was rewritten
twice to fix a truncation that never happened.

Nate broke it open by noticing that `decoded == stored` is impossible for base64 that
decoded: 120,000 base64 characters cannot decode to 120,000 anything. That one
observation inverted the whole picture and identified the healthy rows as the short ones.

### How it was confirmed

The served page WAS the evidence, because the broken rows were being served as their own
raw base64. Fetching it and comparing byte for byte against a locally recomputed encode
showed the stored value was perfect - so nothing was corrupt, and the fault had to be in
the decode. Substituting a UTF-8-returning `atob` locally then reproduced the live pattern
exactly: chunks 3 and 4 decode, the other five throw `URIError`. Seven rows, seven
matches, no exceptions.

### The fix

`Buffer.from(raw, 'base64').toString('utf8')`, which is the decode this environment
actually has and the same one the seeder verifies with, so the two ends agree by
construction instead of by coincidence. A `TextDecoder` path is kept behind it in case
`Buffer` ever goes away.

And the `catch` no longer returns `raw`. A decode that fails now names the rows and the
endpoint answers 500. A page that is silently missing a third of itself is not a
degraded success, and dressing it as one cost a week.

### What this says about the rest of it

The lesson is not "use the right decoder". It is that the two ends of this pipe were
verified with DIFFERENT tools: the seeder checked its work with `Buffer.from`, the site
served with `atob`, and nothing ever compared them. The seed could pass every check it
knew how to make while the page it produced was unreadable. F4 is the same shape - the
harness and production deciding a thing differently - and so is F8, which chased the
seeder because the seeder was the part we could see.

A verify is only worth what it shares with the thing it is verifying.

---

## F10 — Two of the four placed utilities could never be used, and the harness said otherwise

**Status:** fixed, in `docs/fellglass.html`. Recorded because the way it hid is the third
instance of one pattern, and the pattern is now the thing worth guarding against.
**Found:** 2026-07-29, starting piece 3 of the placed utilities.
**Files:** `docs/fellglass.html`, `schemas/seed/Relics.json`, the harness fixtures

### What was wrong

`cbActUtilities()` was `cbUtilities("Act")`, and that filter is an exact string match on
the library's `use`. The Relics collection does not say "Act" every time it means one:

| Utility | `use` in `schemas/seed/Relics.json` |
| --- | --- |
| Rune | `"Act to place"` |
| Trap | `"Act to place"` |
| Skyvault Shard | `"Act, or Rest"` |

All three carry an Act in the FellGuide. None of them could be spent as one. Two of them
are placed utilities, which is most of the feature `COMBAT_PLACED_UTILITIES.md` describes.

They were not misfiled, they were **absent from both surfaces**. The picker refused them on
the exact match, and `renderBattle`'s reminder list drops them too, because `put` only has
buckets named Act, React and Passive and silently ignores a use that is none of the three.
So a Fell could carry a Rune, equip it, and find it nowhere at all — no error, no greyed
card, no entry in a list.

### How the pipe was verified, both ends with the same tool

`use` is copied verbatim at every hop and normalised at none of them:

```
Relics row .use  ->  libraries.web.js:78  use: it.use || 'Out of Combat'
                 ->  fellglass.html:4698  use:F(r,"use")||"Out of Combat"
                 ->  cbPack()             use:e.use||""
                 ->  cbUtilities("Act")   u.use === "Act"
```

Four hops, one value, one comparison. Nothing in between could have turned "Act to place"
into "Act".

### Why it survived so long

The harness fixtures hand the sheet `use: 'Act'` for a Rune — `a22`, `a23` and `a24` all
did. The store has never said that. Every placement spec was green against a value nothing
in production produces.

That is F9's lesson in different clothes, and F7's, and F4's: **the two ends of the pipe
were checked with different values.** F9 was a decoder the seeder did not share; F7 was a
mock holding an array where the collection holds a JSON string; this was a fixture
inventing a field the collection never emits. Each time the check could stay green while
the thing it checked was broken, and each time the harness was the more capable of the two
rather than the more faithful.

### The fix, and what it deliberately does not do

`cbUseIsAct(use)` asks whether the use names an Act as a *word*, so "Act to place" and
"Act, or Rest" both match and "React" does not — the `r` before it is what keeps every
React utility out, which would have been the worse fault in the other direction.

It is used at `cbActUtilities`, at `cbOwnsActUtility` (which decides whether the card
exists at all, a different question from whether it is greyed), and at `renderBattle`'s
reminder skip so a Rune cannot appear in both places at once.

It does **not** rewrite `Relics.json`. The wording there is the FellGuide's and it is
telling the truth — a Rune is an Act to place. The reader was the thing that was wrong.

### What guards it now

`a27-act-to-place-reachable.spec.js`, pinned to the seed file rather than to a hand-written
list, so a value changing in `Relics.json` cannot quietly stop being covered. Its first case
asserts the seed still contains an Act worded some other way, so if the data is ever
normalised the suite says so instead of passing on an empty set. Three of its six cases fail
against the old exact match; the other three are regression guards and pass either way,
which is said here rather than left to look like more coverage than it is.
