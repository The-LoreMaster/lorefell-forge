# Deploy Manifest: which tool serves from where

The single source of truth for how each tool reaches a player's screen. Read this BEFORE
verifying "is my change live". `SERVING.md` walks the chain step by step.

## One serving path

Every tool is served the same way since LoreFell left Wix on 2026-10-11. The CMS path
(Seed Embeds, the SiteEmbeds collection, `/_functions/embed`) is retired, and so is the
`?info=1` check that went with it.

- The tool's HTML: `docs/<tool>.html`, published by `Deploy Pages` (`.github/workflows/pages.yml`)
  on a push to main touching `docs/**`, at `https://table.lorefell.com/<tool>.html`. The old
  `the-loremaster.github.io/lorefell-forge/...` addresses redirect there.
- The page players open: lorefell-site frames that HTML on its own page at
  `https://www.lorefell.com/<path>` (`src/tools/tools.js`), loading it as `?v=<commit>` from
  `table.lorefell.com/version.json`.
- The page code and backend: `velo/page-<tool>.js`, `velo/public/` and `velo/backend/`, copied
  into lorefell-site (`src/tools/`, `api/velo/`) by its nightly Vault sync or a site PR.
- `embeds/<tool>.html` is not served. It stays byte-identical to `docs/` because the checks
  compare the two.

## The per-tool map

From lorefell-site `src/tools/tools.js`. If that list changes, correct this table.

| Tool | HTML on table.lorefell.com | Site address | Page code |
| --- | --- | --- | --- |
| ThreadSpire | `threadspire.html` | `/the-threadspire` | `velo/page-threadspire.js` |
| FellGlass | `fellglass.html` | `/the-fellglass` | `velo/page-fellglass.js` |
| FellForge | `fellforge.html` | `/the-fellforge` | `velo/page-fellforge.js` |
| Join | `join.html` | `/join` | `velo/page-join.js` |
| SigilForge | `sigilforge.html` | `/the-sigilforge` | `velo/page-sigilforge.js` |
| ShardForge | `shardforge.html` | `/the-shardforge` | `velo/page-shardforge.js` |
| BondForge | `bondforge.html` | `/the-bondforge` | `velo/page-bondforge.js` |
| BrandForge | `brandforge.html` | `/the-brandforge` | `velo/page-brandforge.js` |
| FoeForge | `foeforge.html` | `/the-foeforge` | `velo/page-foeforge.js` |
| RelicForge | `relicforge.html` | `/the-relicforge` | `velo/page-relicforge.js` |
| The Anexanum | `the_anexanum.html` | `/the-anexanum` | `velo/page-the_anexanum.js` |
| SagaForge | `sagaforge.html` | retired (Nate, 2026-10-17), not on the site | `velo/page-sagaforge.js`, writing through the site's `/api/saga/stream` |
| The Sphere | `the_sphere.html` | none in `tools.js` | none. Baked from the vault by Deploy Pages, kept current by Sphere Sync |

The FateWell is retired (2026-09-28, folded into ThreadSpire). `/the-fatewell` is now a page
of the site, not the tool.

## Verify-live checklist

Run this AFTER a merge, before telling Nate it is live. Never report live off a workflow
run without checking its head_sha matches the merge commit. A green run for an earlier
commit is not evidence.

A change to `docs/`:
  1. Did `Deploy Pages` run green ON THE MERGE COMMIT? (Actions, check head_sha)
  2. If not, dispatch it: it does not always fire, and never fires during an Actions incident.
  3. `https://table.lorefell.com/version.json` names the merge commit.
  4. Open view-source of `https://table.lorefell.com/<tool>.html`, search for a string from the change.

A change to `velo/`:
  1. The copy is on lorefell-site's main: `src/tools/pages/`, `src/tools/public/` or `api/velo/`,
     from a Vault sync commit or the site PR.
  2. Cloudflare Pages has deployed that commit.

## The traps that cost the most time, recorded so they are not re-sprung

1. **Stale run read as fresh.** A green Deploy Pages run was read as confirmation without
   checking its head_sha. It was for an earlier commit, and the real one never fired (an
   Actions incident throttled the trigger). ALWAYS check head_sha equals the merge commit
   before trusting a green run.
2. **The site's copy is behind.** A `velo/` change merged in the forge is not live until the
   site carries it. Look on lorefell-site's main, not the forge's.
