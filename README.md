# LoreFell Forge

Shared kernel and CMS pipeline for the LoreFell forge tools.

The tools are static HTML served from GitHub Pages and loaded into Wix as URL embeds.
The Wix CMS is managed from CI: schemas in this repo are the source of truth, and a
GitHub Action writes them to Wix using the Wix Data REST API. No Wix keys live in this
repo. They are stored as encrypted Action secrets.

## Layout

- `docs/` static tools served by Pages. `forgemaster.html` is the kernel, `the_hearth.html` the hub, `rules.js` the shared interpreter (generated).
- `schemas/` collection definitions, one JSON per collection. Source of truth for structure.
- `schemas/seed/` seed rows. JSON fields are kept as real objects and stringified on upload.
- `scripts/` CMS tooling. `rules.core.js` is the one rule source. `build.js` generates the runtime copies.
- `velo/` code to paste into the Wix Velo backend (`backend/forge.jsw`, `backend/rules.js`) and the page wiring.
- `.github/workflows/` `apply.yml` writes schemas and seed to Wix, `backup.yml` runs nightly.
- `backups/` local snapshots, gitignored. CI stores backups as private Action artifacts.

## One rule source

`scripts/rules.core.js` is the only place the interpreter is edited. Run `npm run build`
to regenerate `docs/rules.js` (browser) and `velo/backend/rules.js` (Velo ESM). The build
fails if the kernel stops loading the shared file, so the copies cannot drift.

## Field naming

Wix reserves the field ids `title`, `status`, and `_owner`. Collections here use
`forgeTitle`, `creationName`, and `forgeStatus` instead.

## First test

1. In repo Settings, add Action secrets: `WIX_API_KEY`, `WIX_SITE_ID`, and optionally `WIX_ACCOUNT_ID`.
2. Run the Apply CMS workflow from the Actions tab (Run workflow).
3. It backs up first, creates `ForgeConfig`, `ForgeComponents`, `Creations`, and `CreationApprovals`, then seeds SigilForge.
4. Confirm in the Wix CMS that `ForgeConfig` has one row and `ForgeComponents` has seven.

## Serving the tools

Enable Pages: Settings, Pages, Deploy from a branch, `main`, folder `/docs`.
The kernel loads at:
`https://the-loremaster.github.io/lorefell-forge/forgemaster.html?forge=sigilforge`
