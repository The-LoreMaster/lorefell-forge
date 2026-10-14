# Facts

Values you cannot work out by reading the code, and that cost a session when guessed.
This is deliberately not an architecture document. Architecture drifts and a stale
description of how things fit together is worse than none, because it gets believed.
`CANON_SOURCES.md` exists for exactly that reason. Everything here is a fact with its
evidence beside it, so it can be re-checked rather than trusted.

If you find yourself about to guess a route, a destination or a field name, look here
first, and if it is not here, grep for it and then add it.

---

## Tool routes

The route a tool lives at is not derivable from its filename. `threadspire.html` does
not live at `/threadspire`.

The site kept the Wix addresses when it took the tools over on 2026-10-11. The list is
lorefell-site `src/tools/tools.js` (`path`), which is where to look first and where to
correct any of these.

| Tool | Route |
|---|---|
| ThreadSpire | `/the-threadspire` |
| FellGlass | `/the-fellglass` |
| FellForge | `/the-fellforge` |
| Join | `/join` |
| SigilForge | `/the-sigilforge` |
| ShardForge | `/the-shardforge` |
| BondForge | `/the-bondforge` |
| BrandForge | `/the-brandforge` |
| FoeForge | `/the-foeforge` |
| RelicForge | `/the-relicforge` |
| The Anexanum | `/the-anexanum` |

The Hearth (`/the-hearth/`), the LoreForge (`/the-loreforge/`) and The Fatewell
(`/the-fatewell/`, the LoreMaster's page) are pages of the site, not tools. The FateWell tool
is retired, and the SagaForge is dropped. Every other site address is in lorefell-site
`src/data/links.js`.

**Better than knowing the route:** do not navigate to a literal. Rebuild the current
page from `wixLocation.path`, the way `TS_CAMPAIGN_SET` does. The site's stand-in for
`wix-location` (lorefell-site `src/tools/wix/wix-location.js`) gives the same `path`. A
guessed route sends the browser nowhere and the button simply looks dead, with no error
anywhere.

## Where a Velo file goes

Nobody pastes Velo any more. lorefell-site copies it from the forge's main, in its nightly
Vault sync or in a site PR, with only the imports changed.

| Pattern | Destination | Symptom if wrong |
|---|---|---|
| `velo/page-*.js` | lorefell-site `src/tools/pages/`, by `npm run tools:sync`, the host page of the tool of the same name | the copy fails if the page imports a method the backend does not offer |
| `velo/public/*.js` | lorefell-site `src/tools/public/`, by `npm run tools:sync` | |
| `velo/backend/*.js` | lorefell-site `api/velo/`, by `npm run api:velo`, served at `/api/velo/<module>/<method>` | `check:velo` fails while the copy is behind |

A new `TS_*` (or `FORGE_*`) bridge call means the matching `page-*.js` must reach the site
again. Until it does, the tool asks a question nobody hears.

## Paths that write to live infrastructure

A push to `main` touching any of these fires `apply.yml`, which writes to the live database
(D1). Not reversible with `git revert`.

- `schemas/seed/**`
- `scripts/applyD1.js`
- `.github/workflows/apply.yml`

The run is idempotent: each row is matched on its natural key, so only what changed is
written. Apply CMS keeps every table it touches as an artifact before writing, and
lorefell-site backs up D1 every night.

## Reserved field ids

Wix reserved `title` and `status` on a collection, and the D1 tables keep Wix's field
names. Use `creationName` and `forgeStatus`.

## What the checks catch, and what they do not

| Check | Catches | Command |
|---|---|---|
| `checkContracts.js` | a postMessage type one side sends and the other never handles, in both directions, including a tool talking down to a tool it embeds | `npm run contracts` |
| `checkGlobals.js` | `window.X` read somewhere and assigned nowhere | `npm run globals` |
| `checkCanon.js` | generated files stale, docs/embeds mirror drift, one-sided edits to paired concepts | `node canon/checkCanon.js` |
| symbol audit (in the ThreadSpire handoff) | a function called but no longer defined | see the handoff |

`npm run checks` runs the first two together. `checkContracts.js` runs in CI through
`.github/workflows/contracts.yml`; `checkGlobals.js` is not wired into that workflow yet,
because updating a workflow file needs a token with `workflow` scope. Adding it is two
lines: a `- 'scripts/checkGlobals.js'` path entry under both triggers, and a
`- run: node scripts/checkGlobals.js` step after the contracts step.

## When two tables disagree

The sync-bug protocol, learned the slow way. Do these in order and do not skip to fixing:

1. **Trace from the write, not the read.** Find where the value is *set* and follow it
   outward. The map bug survived four read-side fixes because the write side never sent
   anything: `applyRemoteState` drew the screen and stopped. The shelf bug and the slug
   bug were the same shape. Where is it set, who sends it, who stores it, who fetches
   it, who paints it, in that order.
2. **Open the seams on both tables** (Settings > Show the seams, or the player menu) and
   compare lines. The wrong number names the broken side: an empty Adventure line means
   nothing can sync for that table; a FAILED push means the loremaster's changes are not
   leaving; `nothing newer than vN` on one side while the other pushed vN+3 means the
   pull side; `other adventure` means a scoping leak.
3. Only then patch, on the side the numbers indict.

Known refusals: `WDE0109: Payload is too large` on the push means the snapshot is over
Wix's size ceiling and no state row is being written at all. The seams panel shows the
snapshot size next to the push; if it climbs toward hundreds of KB, something oversized
has crept in, and the usual culprit is a picture riding as encoded bytes instead of a
stored address.

**None of these catch a function that exists but is never called.** `stagesBody` needed
the map shelf and never asked for it, so every stage looked mapless, and nothing flagged
it because every symbol resolved. Before editing a function, grep its name to see who
calls it and who it depends on. That habit catches more than any of the above.
