# Facts

Values you cannot work out by reading the code, and that cost a session when guessed.
This is deliberately not an architecture document. Architecture drifts and a stale
description of how things fit together is worse than none, because it gets believed.
`CANON_SOURCES.md` exists for exactly that reason. Everything here is a fact with its
evidence beside it, so it can be re-checked rather than trusted.

If you find yourself about to guess a route, a destination or a field name, look here
first, and if it is not here, grep for it and then add it.

---

## Wix page routes

The route a tool lives at is not derivable from its filename. `threadspire.html` does
not live at `/threadspire`.

| Tool | Route | Evidence |
|---|---|---|
| FellGlass | `/the-fellglass` | `velo/page-threadspire.js`, the OPEN_SHEET handler |
| ThreadSpire | `/the-threadspire` | `velo/page-fellglass.js`, two navigations |

Routes for the other tools are not recorded here because nothing in the repo proves
them. Do not add one from memory. Add it when a navigation in `velo/**` shows it, and
cite that line.

**Better than knowing the route:** do not navigate to a literal. Rebuild the current
page from `wixLocation.path`, the way `TS_CAMPAIGN_SET` does. A guessed route sends the
browser nowhere and the button simply looks dead, with no error anywhere.

## Where a Velo file goes

Velo is pasted by hand. Nothing deploys it, so a file in the wrong place fails quietly
or fails publish.

| Pattern | Destination | Symptom if wrong |
|---|---|---|
| `velo/page-*.js` | the **page** of the same name | backend imports fail |
| `velo/backend/*.web.js` | **Backend** | publish fails, `Cannot find module 'wix-web-module'` |

A new `TS_*` (or `FORGE_*`) bridge call means the matching `page-*.js` must be pasted
again. Until it is, the tool asks a question nobody hears.

## Paths that write to live infrastructure

A push to `main` touching any of these fires `apply.yml`, which writes to the live Wix
CMS. Not reversible with `git revert`.

- `schemas/**`
- `scripts/**`
- `.github/workflows/apply.yml`

`scripts/**` surprises people: adding a check script to `scripts/` triggers a CMS run.
The steps are idempotent and additive, but back up before any schema change regardless.
Timestamped backups go in `/backups`.

## Wix reserved field ids

`title` and `status` are reserved on a collection. Use `creationName` and `forgeStatus`.

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

**None of these catch a function that exists but is never called.** `stagesBody` needed
the map shelf and never asked for it, so every stage looked mapless, and nothing flagged
it because every symbol resolved. Before editing a function, grep its name to see who
calls it and who it depends on. That habit catches more than any of the above.
