# LoreFell Forge

Shared kernel and canon data pipeline for the LoreFell forge tools.

The tools are static HTML in `docs/`, served by GitHub Pages at table.lorefell.com. The site
(`The-LoreMaster/lorefell-site`, www.lorefell.com) shows each tool in a frame on its own page,
and runs the tool's page code and backend from `velo/` on Cloudflare. LoreFell left Wix on
2026-10-11. The canon collections are managed from CI: schemas in this repo are the source of
truth, and a GitHub Action writes the seed to D1, the tools' database. The Cloudflare token
lives only as an encrypted Action secret.

## Layout

- `docs/` static tools served by Pages. `forgemaster.html` is the kernel, `the_hearth.html` the hub, `rules.js` the shared interpreter (generated).
- `embeds/` a byte-identical mirror of `docs/`. Nothing serves it, but the checks compare the two.
- `schemas/` collection definitions, one JSON per collection. Source of truth for structure.
- `schemas/seed/` seed rows. JSON fields are kept as real objects and stored as JSON text in D1.
- `scripts/` build, check and data tooling. `rules.core.js` is the one rule source. `build.js` generates the runtime copies. `applyD1.js` seeds D1.
- `velo/` the tools' page code (`page-*.js`, `public/`) and backend (`backend/`). lorefell-site copies it into `src/tools/` and `api/velo/` and runs it there.
- `.github/workflows/` `pages.yml` deploys `docs/`, `apply.yml` seeds D1 from `schemas/seed/`. D1's nightly backup runs in lorefell-site.
- `backups/` local snapshots, gitignored. CI stores backups as private Action artifacts.

## One rule source

`scripts/rules.core.js` is the only place the interpreter is edited. Run `npm run build`
to regenerate `docs/rules.js` (browser) and `velo/backend/rules.js` (Velo ESM). The build
fails if the kernel stops loading the shared file, so the copies cannot drift.

## Field naming

Wix reserved the field ids `title`, `status`, and `_owner`, and the D1 tables keep Wix's
shape. Collections here use `forgeTitle`, `creationName`, and `forgeStatus` instead.

## Apply CMS

1. The repo holds two Action secrets: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (with D1 edit).
2. Apply CMS runs on every push to main that changes `schemas/seed/`, or from the Actions tab (Run workflow).
3. It keeps every table it touches as an artifact, then seeds D1. Each row is matched on its natural key, so a second run changes nothing.

## Serving the tools

Deploy Pages (`pages.yml`) publishes `docs/` on every push to main that touches it, and
writes `version.json` with the commit. `SERVING.md` has the whole chain.
The kernel loads at:
`https://table.lorefell.com/forgemaster.html?forge=sigilforge`
