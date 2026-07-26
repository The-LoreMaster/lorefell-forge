# ThreadSpire two-sided test plan for Claude Code

A plan for driving ThreadSpire as both LoreMaster and player with Playwright,
against the FellGuide rulebook as the oracle. Written to hand to Claude Code.

---

## Answers to the questions the agent already raised

**docs/ vs embeds/ is not a guess.** `docs/*.html` is the source, served by GitHub
Pages. `embeds/*.html` must be a byte-for-byte mirror of `docs/` (Wix reads the
embed copy). The canon gate (`node canon/checkCanon.js`) fails if they drift. So:
**edit `docs/`, then copy to `embeds/`, then run the gate.** Never edit `embeds/`
directly. The agent's standing-guard instinct is right; add this one rule.

**"Stress test" here means functional + regression, not load.** Confirmed. Edge
cases, invalid input, boundary values, state corruption, and the two-tab
LoreMaster/player sync. Not hundreds of concurrent sessions.

**There is already a Playwright harness in `threadspire/`** (`playwright.config.js`,
`global-setup.js`, `tests/zoom.spec.js`). But it tests the Fellwake semantic-zoom
explorer via `?demo=1` on a different `dist/` build. It does **not** test the live
tabletop. The tabletop harness is new work, described below. Reuse the config
pattern (local http-server, the sparticuz chromium binary, desktop + mobile
projects), not the existing specs.

---

## The one hard fact that shapes everything

ThreadSpire is **not a standalone page**. It runs inside a Wix iframe and gets
everything through `postMessage` with its parent:

- Its role (LoreMaster or player) arrives as a `THREADSPIRE_ROLE_HINT` and then a
  full `THREADSPIRE_CONTEXT` message.
- The adventure arrives on that context as `rawCampaign` (ThreadSpire builds its
  own spine from it — this is the recent "adventure is its own record" change).
- Live sync between the LoreMaster and players runs through a **state feed**:
  `TS_STATE_PUSH` and `TS_STATE_PULL` messages, answered by the parent, which is
  really the Wix backend holding one shared state row per adventure.
- Every other backend call is a `TS_*` request that expects a `TS_RESULT` reply
  keyed by `reqId`.

`function tsEmbedded()` gates all of it: `return window.parent && window.parent
!== window`. Opened directly, `tsEmbedded()` is false, and ThreadSpire falls back
to a **standalone prototype bench** — a demo adventure called "The Silent Beacon"
with no role and no sync. Useful for eyeballing, useless for two-sided testing.

**So the harness's whole job is to be a convincing parent frame.** Everything
else follows from that.

---

## Architecture: the harness is a mock Wix parent

Build one small HTML host page, `threadspire/harness/host.html`, that Playwright
loads. It:

1. Embeds `docs/threadspire.html` in an iframe (so `tsEmbedded()` is true).
2. Sends the boot handshake: `THREADSPIRE_ROLE_HINT` then `THREADSPIRE_CONTEXT`
   with a role and a `rawCampaign` the test chose.
3. Answers every `TS_*` request the page emits, keyed by `reqId`, with a
   `TS_RESULT`. Most can return canned data; the ones that matter are enumerated
   below.
4. Backs the **state feed** onto a shared store keyed by adventure id, so a
   second iframe (or second Playwright page) acting as the other role reads what
   the first wrote. This is what makes LoreMaster↔player sync testable.

The shared store is the key design choice. Options, simplest first:

- **Same-page, two iframes.** One `host.html` embeds two ThreadSpire iframes,
  one booted as LoreMaster, one as player, both talking to one in-memory JS
  object as the state row. Easiest to reason about, no cross-tab plumbing.
  Recommended for v1.
- **Two Playwright pages, shared via a tiny local server.** More faithful to
  real life (separate tabs, real network round-trips through `http-server` plus a
  small state endpoint), but more moving parts. Graduate to this once the
  same-page version is green.

Do **not** try to run the real Wix backend or hit live data. The harness replaces
it. That keeps tests deterministic and keeps your live CampaignView untouched.

---

## The message contract the harness must satisfy

The full outbound set the page can emit (from the source): `TS_ADVENTURE_CREATE,
TS_ASSET_DELETE, TS_ASSET_LIST, TS_ASSET_SAVE, TS_ASSET_UPLOAD, TS_CAMPAIGN_LIST,
TS_CAMPAIGN_SET, TS_CHAR_LIST, TS_CHAR_LOAD, TS_CHAR_SAVEMETA, TS_COMBAT_APPLY,
TS_COMBAT_CHARGE, TS_COMBAT_DAMAGE, TS_COMBAT_DECLARES, TS_COMBAT_PUBLISH,
TS_EFFECTS, TS_FELL_WIPE, TS_FORGE_ACT, TS_FORGE_DATA, TS_FORGE_ITEM,
TS_GOD_SHEET, TS_GOD_SHEET_CLOSE, TS_INVITE_MAKE, TS_INVITE_REVOKE,
TS_JOURNAL_GET, TS_JOURNAL_SAVE, TS_LM_PORTRAIT_GET, TS_LM_PORTRAIT_SAVE,
TS_NEW_ADVENTURE, TS_OFFLINE_FELL, TS_PARTY_DETACH, TS_PARTY_LIST,
TS_PARTY_REMOVE, TS_PARTY_ROLE, TS_PUBLISH, TS_PUBLISH_LIST, TS_QUEST_SAVE,
TS_RATING, TS_SHELVES_GET, TS_SHELVES_SET, TS_STAGE_DELETE, TS_STAGE_LIST,
TS_STAGE_SAVE, TS_STATE_PULL, TS_STATE_PUSH, TS_TOOL_DOWN, TS_TOOL_UP,
TS_UNPUBLISH`.

Don't implement all 40+ at once. Tier them:

**Tier 1 — the spine of a session (implement first):**
- `THREADSPIRE_CONTEXT` (outbound from harness): role + `rawCampaign` + `party`.
- `TS_STATE_PUSH` / `TS_STATE_PULL`: the shared state row. The heart of sync.
- `TS_PARTY_LIST`: who is at the table.
- `TS_CHAR_LOAD` / `TS_CHAR_LIST`: the Fell sheets.
- `TS_STAGE_LIST` / `TS_STAGE_SAVE`: the board per scene.

**Tier 2 — combat and the LoreMaster's tools:**
- `TS_COMBAT_DECLARES`, `TS_COMBAT_APPLY`, `TS_COMBAT_DAMAGE`,
  `TS_COMBAT_CHARGE`, `TS_COMBAT_PUBLISH`.
- `TS_GOD_SHEET` / `TS_GOD_SHEET_CLOSE` (LoreMaster opening a player's Fell).
- `TS_JOURNAL_GET/SAVE`, `TS_QUEST_SAVE`.

**Tier 3 — everything else** returns a benign canned reply so nothing hangs on a
missing `TS_RESULT`. A catch-all that replies `{ ok:true }` to any unhandled
`reqId` keeps the page from stalling; log those so you know what a scenario
actually exercised.

Every reply uses the same shape the page waits on: `{ type:'TS_RESULT',
reqId:<the id from the request>, ok:true, data:<payload> }`. Get `reqId`
threading right once and the rest is data.

---

## Where the rulebook comes in (the oracle)

The FellGuide repo (`lorefell-fellguide`, the private Obsidian vault) is the
source of intended behavior. Before writing assertions for a mechanic, read its
rule and turn it into concrete expectations. Examples of what to pin:

- **Act/React economy.** One Act and one React per Beat. Dig In trades the Act for
  a second React. All In trades the React for a second Act. A scenario should try
  to spend two Acts without All In and assert the table refuses it.
- **Committing.** Whatever the rulebook says a commitment locks, assert it locks
  and cannot be taken back within the Beat.
- **Aurum denominations.** Oro/Arca/Atla/Zurith and their weights (the sheet
  totals them ×1/×10/×50/×100). Assert the total after a known set of coins.
- **Foe stat rungs.** Minion/Elite/Champion/Epic/Forsaken offsets. When the LM
  drops a foe, assert its derived damage matches the rulebook's formula.

The pattern: **rule → expected value → assertion.** Where the tool and the
rulebook disagree, that's a bug found. Capture it, don't fix around it.

---

## The two-sided scenarios (what to actually script)

Each is one spec file. Each boots the harness, drives the UI, and asserts against
the rulebook and against cross-side sync.

**S1 — a Fell joins and both sides agree.**
Player boots, opens their Fell, sets a stat. Assert the LoreMaster side sees the
same Fell in the roster with the same value after one state beat. This is the
sync smoke test; if it fails, nothing downstream is trustworthy.

**S2 — the LoreMaster opens the chosen adventure.**
LM boots on Beacons, switches to a second adventure via Settings. Assert the
story stands up (acts/scenes present) with no "Still here", and the Seams window's
"Story here" line reports the act/scene count. (This is the exact path that has
been breaking; make it a permanent guard.)

**S3 — a Beat of combat, both sides.**
LM places a foe and starts combat. Player declares an Act. LM applies damage.
Assert: the declare shows on the LM side, the damage shows on the player side,
and the Act/React economy held (a second Act without All In is refused).

**S4 — the LoreMaster edits a player's Fell.**
LM opens a player's Fell (`TS_GOD_SHEET`), changes a field. Assert the change log
(the Sheet-changes window) records it attributed to the LoreMaster, and the
player's side reflects it after a beat.

**S5 — reload persistence.**
After S3, reload both pages. Assert the board, the roster, and the combat state
come back from the shared store rather than resetting. This catches the class of
"it's gone" bugs.

**S6 — invalid and boundary input.**
Spend more aurum than held (assert clamp at zero). Declare with no target
(assert refusal). Switch to an adventure id that does not exist (assert the
graceful "no story loaded" message, not a hang). Corruption cases live here.

Start with S1 and S2. They are the foundation and the current pain. The rest
build on a green sync layer.

---

## Reusability, which is the whole point

Each scenario is a committed spec. After any change to `docs/threadspire.html` or
`velo/page-threadspire.js`, re-running the suite is one command. That is the
payoff over manual clicking: a regression in sync or combat shows up the same
minute it lands, named by the failing scenario.

Wire the suite into the repo the way the unit tests already are: a line in
`package.json` so `npm run e2e` (or similar) runs it, kept separate from the fast
jsdom `npm run checks` so the gates stay quick.

---

## Guardrails for the agent

- **Read the rule before asserting behavior.** The vault is the oracle. An
  assertion with no rule behind it is just encoding today's behavior, bugs and
  all.
- **Edit `docs/`, mirror to `embeds/`, run `node canon/checkCanon.js`.** Never
  touch `embeds/` directly. Never touch `scripts/`, `schemas/`, or
  `.github/workflows/apply.yml` without flagging first — pushes touching those
  fire a live Wix CMS migration.
- **The harness replaces the backend. Never point tests at live Wix data.**
- **A found bug is reported, not silently worked around.** The point is to surface
  disagreements between the tools and the rulebook.
- **Keep the two-sided store honest.** If the harness lets the player read the
  LM's writes too eagerly (no version gating), it will hide real sync bugs. Model
  the `since`/version handshake the real `TS_STATE_PULL` uses.

---

## Suggested first message to Claude Code

> Read `docs/threadspire.html` and `velo/page-threadspire.js` to learn the
> postMessage contract (`THREADSPIRE_CONTEXT`, `TS_STATE_PUSH/PULL`, the
> `TS_*`/`TS_RESULT` reqId pattern, and `tsEmbedded()`). Then build
> `threadspire/harness/host.html`: a mock Wix parent that embeds ThreadSpire in an
> iframe, boots it with a role and a `rawCampaign`, and backs the state feed onto
> a shared in-memory store so a LoreMaster iframe and a player iframe sync. Reuse
> the Playwright config pattern already in `threadspire/`. Deliver scenario S1 (a
> Fell joins, both sides agree) and S2 (open the chosen adventure, story stands
> up, no "Still here") first, with assertions derived from the FellGuide rules.
> Edit only `docs/`, mirror to `embeds/`, run `node canon/checkCanon.js`, and
> leave `scripts/`, `schemas/`, and the workflow files alone.

---

## On the PAT

The agent's advice was right: don't paste it into chat. You said you want to paste
it yourself in the code and rotate it after — that is the safe version of this.
Two ways to do it cleanly:

- Let Claude Code run read-only, and you run the pushes yourself with `git push`
  when a change is ready. The agent flags when it needs a push; you do it. No
  token in the agent's context at all.
- Or paste the PAT directly into your local git credential store (or a
  `.git-credentials` file git already reads), so the token lives in your
  environment, not in any chat transcript. Then Claude Code's `git push` just
  works and never sees the token as text. Rotate it whenever you like.

Either way the token stays out of the conversation log, which is the thing worth
protecting.
