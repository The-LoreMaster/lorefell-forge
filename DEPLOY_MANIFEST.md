# Deploy Manifest: which tool serves from where

The single source of truth for how each tool reaches a player's screen. Read this BEFORE
verifying "is my change live". It exists because a whole afternoon was lost verifying the
CMS path for a tool that is actually served from GitHub Pages. Do not guess the path from
SERVING.md prose or from memory; look it up here, per tool.

## The two serving paths

There are TWO independent ways a tool reaches the live site, and each tool uses exactly
one. They deploy through different workflows and are verified differently.

**PAGES path** - the Wix HTML component points at a `the-loremaster.github.io/...` URL.
  - Deployed by: `Deploy Pages` workflow (`.github/workflows/pages.yml`), on push touching `docs/**`.
  - What it serves: `docs/<tool>.html` verbatim, at `https://the-loremaster.github.io/lorefell-forge/<tool>.html`.
  - Verify live by: opening that github.io URL's view-source and searching for a string from the change.
  - The `embeds/` mirror and the SiteEmbeds CMS are IRRELEVANT to these tools. Do not check `?info=1` for them.

**CMS path** - the Wix HTML component points at `/_functions/embed?slug=<tool>`.
  - Deployed by: `Seed Embeds` workflow (`.github/workflows/embeds.yml`), on push touching `embeds/**`.
  - What it serves: `embeds/<tool>.html`, chunked into SiteEmbeds CMS rows, reassembled by `get_embed`.
  - Verify live by: `https://lorefell.com/_functions/embed?slug=<tool>&info=1`, compare `total decoded` to `embeds/<tool>.html` byte length.

## The per-tool map (THE thing to look up)

The path is decided by ONE place only: what the Wix HTML component on that tool's page is
set to. That is not in the repo, so it is recorded here. If a tool's behaviour contradicts
this, the Wix component was changed; open the Wix editor, click the component, and read its
Website address, then correct this file.

| Tool         | Path  | Live URL the component points at                                          | Deploy workflow |
| ---          | ---   | ---                                                                       | ---             |
| threadspire  | PAGES | https://the-loremaster.github.io/lorefell-forge/threadspire.html          | Deploy Pages    |
| fatewell     | PAGES | https://the-loremaster.github.io/lorefell-forge/fatewell.html (confirm)   | Deploy Pages    |
| fellglass    | PAGES | https://the-loremaster.github.io/lorefell-forge/fellglass.html (confirm)  | Deploy Pages    |

Tools not listed: verify the component's Website address in the Wix editor and add a row
before assuming either path. A blank row is better than a guessed one.

## Verify-live checklist, per path

Run this AFTER a merge, before telling Nate it is live. Never report live off a workflow
run without checking its head_sha matches the merge commit; a green run for an earlier
commit is not evidence.

PAGES tool:
  1. Did `Deploy Pages` run green ON THE MERGE COMMIT? (Actions, check head_sha)
  2. If not, dispatch it: it does not always fire, and never fires during an Actions incident.
  3. Open view-source of the github.io URL, search for a string from the change.

CMS tool:
  1. Is `embeds/<tool>.html` byte-identical to `docs/<tool>.html`? (repo)
  2. Did `Seed Embeds` run green ON THE MERGE COMMIT? (Actions, check head_sha)
  3. `?info=1` total decoded matches `embeds/<tool>.html` length AND row timestamps are recent?
  4. If CMS is current but page is stale: the Wix component or a Wix publish-cache; republish the site.

## The two traps that cost the most time, recorded so they are not re-sprung

1. **Wrong path assumed.** SERVING.md said "the live site serves from Wix, not Pages, do
   not check Pages." That is true for CMS tools and FALSE for threadspire, which is a Pages
   tool. The fix was `Deploy Pages`, not anything CMS. ALWAYS look up the path in the table
   above first.
2. **Stale run read as fresh.** A green Seed Embeds / Deploy Pages run was read as
   confirmation without checking its head_sha. It was for an earlier commit; the real one
   never fired (an Actions incident throttled the trigger). ALWAYS check head_sha equals the
   merge commit before trusting a green run.
