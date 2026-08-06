# Where the tools are actually served from

The one page to read before verifying "is my change live". Twice now, time was lost
verifying GitHub Pages when the live site does not serve from Pages. This records the
real chain so nobody re-derives it.

## FIRST: which path does THIS tool use? Look it up in DEPLOY_MANIFEST.md

There are TWO serving paths, and each tool uses exactly one: the PAGES path (Wix component
points at a github.io URL, deployed by Deploy Pages) or the CMS path (component points at
/_functions/embed, deployed by Seed Embeds). DEPLOY_MANIFEST.md has the per-tool map and
is the source of truth. threadspire, fatewell, and fellglass are PAGES tools; for them the
CMS and this document's CMS chain below DO NOT APPLY, and the fix for a stale one is Deploy
Pages, not anything CMS. Do not assume the CMS path for a tool without checking the manifest.

The rest of this document describes the CMS path, which applies only to CMS tools.

## The CMS path (only for tools the manifest marks CMS) is served from Wix, NOT GitHub Pages

GitHub Pages (the-loremaster.github.io) exists and deploys on push, but the public
site does NOT serve from it. A green "Deploy Pages" run tells you nothing about what a
player sees. Do not use Pages status as evidence a change is live.

## The real chain, in order

1. **docs/<tool>.html** — the source you edit.
2. **embeds/<tool>.html** — a byte-identical copy that MUST match docs/. This is what
   the live site serves. If embeds/ is stale, the change is not live even if docs/ is
   perfect.
3. **Seed Embeds workflow** (.github/workflows/embeds.yml → scripts/seedEmbeds.js) —
   fires on push to main touching embeds/**. Pushes each embeds/<slug>.html into the
   **SiteEmbeds** Wix CMS collection, matched on slug, idempotent upsert. Large tools
   are split across part rows (slug, slug#2, slug#3…) because Wix caps a data item near
   512KB. The script exits non-zero if any chunk fails, so a green run means all rows
   wrote.
4. **SiteEmbeds CMS collection** (in Wix) — holds the served HTML, in parts.
5. **GET /_functions/embed?slug=<tool>** (velo/backend/http-functions.js → get_embed) —
   reassembles the parts and returns the full HTML document, with Cache-Control:
   no-cache.
6. **The Wix HTML component** on the page points its URL at that /_functions/embed
   endpoint. This is the last hop and the one the repo cannot see or verify.

So: edit docs/ → mirror to embeds/ → push to main → Seed Embeds writes SiteEmbeds →
/_functions/embed serves it → the Wix component shows it. Pages is not in this chain.

## The decisive check — is the CMS current?

Every embed endpoint has a built-in size diagnostic (no-cache):

    https://lorefell.com/_functions/embed?slug=threadspire&info=1
    https://lorefell.com/_functions/embed?slug=fellglass&info=1

It returns per-part char counts and a total. Compare the total to what the current
embeds/<tool>.html should produce (measure with: node -e "console.log(require('fs').
readFileSync('embeds/<tool>.html','utf8').length)"). 
  - totals MATCH  → the CMS has the current code; any remaining problem is the LAST hop
    (the Wix HTML component not pointing at /_functions/embed, or static HTML pasted
    into the Wix editor overriding it).
  - totals SHORT/STALE → the seed did not land despite a green run; debug seedEmbeds.

## Diagnosis order when "my change isn't live"

1. Is embeds/<tool>.html updated and byte-matching docs/? (git — repo-checkable)
2. Did Seed Embeds run green on the commit? (Actions — repo-checkable)
3. Does /_functions/embed?slug=<tool>&info=1 total match embeds/? (one URL — the fork)
4. If the CMS is current but the page is stale: the Wix HTML component / editor is the
   cause. Not repo-checkable — must inspect the live page.

Do NOT check GitHub Pages. It is not the serving path.

## Notes / gotchas recorded so they aren't rediscovered

- ensureSheet() in threadspire.html loads `fellglass.html?host=threadspire` (relative).
  Inside a document served from /_functions/embed that would resolve to
  /_functions/fellglass.html and 404 — so the live sheet iframe likely does not load
  through that relative line as-is. Worth confirming how the live sheet frame resolves.
- A ?v= cache-buster on the sheet iframe is NOT a general fix: the embed endpoint
  already sends no-cache, and threadspire-side changes aren't governed by that iframe
  URL anyway.
- velo/** (http-functions.js, combat.web.js, etc.) is pasted into Wix BY HAND. A repo
  change to velo is not live until pasted and published. There is no workflow for it.
- The Wix site domain (lorefell.com) is not otherwise recorded in the repo; it is here
  now so the serving chain can be checked end to end.
