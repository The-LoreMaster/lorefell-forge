# The tabletop harness

A mock Wix parent for `docs/threadspire.html`, and the two-sided scenarios that run
against it.

ThreadSpire is not a standalone page. `tsEmbedded()` is `window.parent && window.parent
!== window`, and its role, its adventure and its sync all arrive by `postMessage` from
the page that embeds it. Opened directly it falls back to a demo bench called "The
Silent Beacon" with no role and no sync. So `host.html` exists to be a convincing parent
frame; it stands in for `velo/page-threadspire.js`, answering from memory where the real
page calls a Wix backend.

**The harness replaces the backend. Nothing here ever points at live Wix data.**

## Layout

| File | What it is |
|---|---|
| `host.html` | The mock parent. Two iframes, one shared state store, the `TSH` API specs drive. |
| `fixtures.js` | The adventures, roster and campaign list. Loaded both as a `<script>` and as a CommonJS module, so specs derive expected counts from the same data the harness serves. |
| `specs/_table.js` | Shared helpers. Underscored so Playwright does not collect it as a spec. |
| `specs/s1-fell-joins.spec.js` | S1 — a Fell joins, both sides agree. Requirements B1, B5. |
| `specs/s2-open-adventure.spec.js` | S2 — the LoreMaster opens the chosen adventure. Requirements A1, A2. |
| `specs/b6-other-adventure.spec.js` | The wrong adventure's state never bleeds in. Requirement B6. |
| `specs/s5-persistence.spec.js` | Does the table remember? Requirements C1, C3, C5. |
| `../tabletop.config.js` | Playwright config. Separate from `playwright.config.js`, which is the Fellwake zoom explorer and is left alone. |

## Running it

There is no `npm run` entry for this. `package.json` is fenced by
`.claude/hooks/guard.js`, so the script line has to be added by hand if you want one.

First time only, from `threadspire/`:

```
npm install
npx playwright install chromium
```

`node_modules` is absent from both this directory and the repo root, and the local
`ms-playwright` cache holds no browser, so both steps are required before anything can
run.

Then, from `threadspire/`:

```
npx playwright test --config=tabletop.config.js
```

Useful variants:

```
npx playwright test --config=tabletop.config.js --project=desktop
npx playwright test --config=tabletop.config.js --headed
npx playwright test --config=tabletop.config.js s2
```

The config starts its own `http-server` on port 4174 serving the **repository root**,
because the harness has to embed `docs/threadspire.html` and the specs reach into that
iframe to read the page's own state. Same origin is what makes that possible. Port 4174
keeps it clear of the zoom config's 4173.

## The two oracles

Kept straight deliberately, because they answer different questions.

- **`THREADSPIRE_REQUIREMENTS.md`** is the oracle for software behavior: sections A, B,
  C, D and F. S1 answers to B1 and B5; S2 answers to A1 and A2. Each spec names its
  requirement in a header comment.
- **The FellGuide vault** (`../../lorefell-fellguide`) is the oracle for game rules:
  requirement D2 and all of section E — aurum weights, the Act/React economy, foe stat
  rungs, afflictions, charge and Fellmark maths. **S1 and S2 touch none of it**, so no
  rule-derived assertion appears here. Read the rule, derive the number, assert it; an
  assertion with no rule behind it just encodes today's bugs.

## Keeping the store honest

The shared store is the design decision that matters. If the player can read the
LoreMaster's writes too eagerly, the harness hides the very sync bugs it exists to
catch. So it mirrors what the real feed does:

- Version rises **only** on an accepted push, and the acknowledgement carries it.
  `pushState()` treats an ack without a version as a refusal and writes "FAILED" into
  the Seams panel, so this is contract, not decoration.
- A push **merges** into the stored row; it does not replace it. `saveCampaignState`
  keeps every key the incoming push did not mention — *"a push carries only what it is
  about, and the row remembers everything else it was ever given"*. This matters because
  `pushAdventure` sends only `{ adventure, advRev }`: under replace semantics an ordinary
  `pushState` would appear to wipe the stored story. Clearing still works, because keys
  that mean to clear are sent explicitly empty rather than omitted — `sharedSnapshot`
  always carries `tokens`, so an empty board really does empty the stored board. Omission
  means "no news", not "delete".
- A pull carries a snapshot **only** when the row is strictly newer than the caller's
  `since`. Otherwise it carries the version alone.
- A push whose `campaignId` is not the one the frame is bound to is refused as `stale
  adventure`.
- A pull is stamped with the campaign **the frame is bound to**, not the one the request
  asked for — because a pull in flight across a switch really does come back holding the
  old adventure, and noticing that is the embed's job. Stamping the requested id would
  paper over requirement B6.
- The harness records `TSH.violations` if it ever catches itself serving a snapshot it
  should have withheld. Specs assert that list is empty.

`TSH.log` keeps every message with a sequence number, which is what lets S1 assert the
*ordering* claim in B5 rather than just the end state: for every snapshot the player was
served, there must be an earlier commit of that version.

## What is not built yet

S3 (a Beat of combat, both sides), S4 (the LoreMaster edits a player's Fell) and S6
(invalid and boundary input) are not here. Neither is the FellGlass sheet bridge:
`TS_TOOL_UP` is recorded and left unanswered, which stalls nothing because nothing waits
on a `TS_RESULT` for it, but it means sheet-level scenarios need that relay implemented
first.

S3 onward is also where the FellGuide finally becomes the oracle — the Act/React economy,
foe stat rungs, aurum weights. Those assertions need the rule read and the number derived
first, not a plausible-looking constant.

**C2 (each scene keeps its own board) is partly open.** Two different obstacles, worth
keeping apart:

- *Within one session* — place boards on scene A, move to B, return to A — nothing blocks
  it. `S._advTouch` is only set when a spine loads from a context, so a test that never
  reloads never meets the gate. This is writable today.
- *Across a reload* — `applyRemoteSnapshot` ignores `snap.instance.bindings` while
  `S._advTouch` is within 8 seconds, which it always is immediately after a spine loads
  from a context. A bindings assertion after a reload either sleeps past that window or
  races it, so it wants a test built deliberately around the gate rather than one that
  happens to sleep long enough.

The push-merge correction does **not** change the second case. That gate is in
`applyRemoteSnapshot` and is about timing, not about what the row stores.

**Mobile is not really mobile yet.** The mobile project runs the same flows at an iPhone
viewport, but `selectOption` sets a `<select>` value programmatically and never opens the
native picker. That means requirement F4 (dropdowns open on Android, the SigilForge bug)
is *not* covered by the mobile project passing. Real F4 coverage needs a tap-driven
interaction and belongs with S6.

Unhandled `TS_*` types get a benign, correctly-shaped reply and are collected in
`TSH.unhandled`, so what a scenario actually exercised is visible rather than assumed.
