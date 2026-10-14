# Where the tools are actually served from

The one page to read before verifying "is my change live". It records the real chain so
nobody re-derives it. `DEPLOY_MANIFEST.md` has the per-tool table and the checklist.

LoreFell left Wix on 2026-10-11. Until 2026-10-12 some tools were served from the Wix CMS
through the Seed Embeds workflow and `/_functions/embed`. That path is retired. There is one
path now, and every tool uses it.

## The chain, in order

1. **`docs/<tool>.html`**: the source you edit.
2. **Deploy Pages** (`.github/workflows/pages.yml`): runs on a push to main that touches
   `docs/**`, or by hand. It publishes `docs/` to GitHub Pages at
   `https://table.lorefell.com/<tool>.html` and writes `docs/version.json` with the first 12
   characters of the commit.
3. **The site's tool page** (lorefell-site, `src/pages/[tool].astro`, the list in
   `src/tools/tools.js`, which gives each tool's `path`): `https://www.lorefell.com/<path>`
   frames the tool from table.lorefell.com. It reads `version.json` uncached and loads the tool as `?v=<commit>`,
   so a hard refresh shows the new tool once the deploy finishes.
4. **The page code around the frame**: `velo/page-<tool>.js` and `velo/public/`, copied into
   lorefell-site `src/tools/` by `npm run tools:sync`. It answers the tool's messages as the
   Wix page used to.
5. **The backend**: `velo/backend/`, copied into lorefell-site `api/velo/` by
   `npm run api:velo` and served at `/api/velo/<module>/<method>` on Cloudflare Pages
   Functions. The data is in D1.

So a change to `docs/` is live when Deploy Pages finishes on the merge commit. A change to
`velo/` is live only once its copy is on the site's main: the site's nightly Vault sync
copies the forge's `velo/` from the forge's main, or a site PR runs `npm run tools:sync` and
`npm run api:velo` (merge the forge PR first). Cloudflare Pages then rebuilds the site.

`embeds/` is a byte-identical mirror of `docs/`. Nothing serves it any more, but the Canon
Drift Gate and `npm run checks` still fail if it differs, so mirror every change.

## Diagnosis order when "my change isn't live"

1. Did Deploy Pages run green on the merge commit? (Actions, check head_sha)
2. Does `https://table.lorefell.com/version.json` name the merge commit?
3. Does view-source of `https://table.lorefell.com/<tool>.html` hold a string from the change?
4. For a `velo/` change: is the copy on lorefell-site's main (`src/tools/` or `api/velo/`),
   and has Cloudflare Pages deployed it?

## Notes recorded so they are not rediscovered

- `ensureSheet()` in `threadspire.html` loads `fellglass.html?host=threadspire` (relative).
  On table.lorefell.com that resolves beside it.
- `velo/**` is not pasted anywhere any more. The site copies it. When the forge sits beside
  the site, `check:velo` and `check:tools` in lorefell-site fail while the copy is behind.
