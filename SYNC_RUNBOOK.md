# LoreFell Sync Runbook

For a Claude chat that holds two GitHub tokens: a forge token (write to The-LoreMaster/lorefell-forge) and a vault token (write to The-LoreMaster/lorefell-fellguide). The chat does the GitHub work in its own workspace. Database writes happen in the forge repo's Apply CMS Action (into D1, the tools' database since 2026-10-11), not in the chat.

## Repos

- Forge, public: https://github.com/The-LoreMaster/lorefell-forge
- Vault, private: https://github.com/The-LoreMaster/lorefell-fellguide

Clone both at the start of a working session:

    git clone https://x-access-token:${FORGE_TOKEN}@github.com/The-LoreMaster/lorefell-forge.git
    git clone https://x-access-token:${VAULT_TOKEN}@github.com/The-LoreMaster/lorefell-fellguide.git

Redact tokens in every command echoed back to the user: pipe through
`sed 's/github_pat_[A-Za-z0-9_]*/REDACTED/g'`.

## What is automatic and what is not

- Tool HTML in forge `docs/` (sigilforge.html, shardforge.html, bondforge.html and so on): served by GitHub Pages at table.lorefell.com, which the site frames on each tool's page. A push to main makes it live. Mirror the same file into `embeds/`. Nothing serves `embeds/`, but the checks fail if it differs.
- Collection data: written to D1 when the Apply CMS Action runs, on any push to main that changes `schemas/seed/`, or by hand.
- Velo page and backend files in forge `velo/`: nobody pastes them. lorefell-site copies them from the forge's main (`src/tools/` and `api/velo/`) in its nightly Vault sync, or in a site PR that runs `npm run tools:sync` and `npm run api:velo`. Merge the forge PR first. Flag this whenever one changes, because it is live only once the site carries the copy.

## Change type A, canon data (lorebounds, infusions, augmentations)

Source of record is the vault, hidden, at `_Canon/collections/Lorebounds.md`, `Infusions.md`, `Augmentations.md`. Format is `## Name` then `Field: value` lines. Block order sets display order. Portraits are not here. They live in the database (D1).

1. Edit the matching doc in the vault clone. Keep the published prose page in agreement.
2. Commit and push the vault.
3. In the forge clone, regenerate the seed from the vault:

       node scripts/canonFromVault.js --vault ../lorefell-fellguide

   It writes `schemas/seed/Lorebounds.json`, `Infusions.json`, `Augmentations.json`. It never writes the portrait field, and Apply CMS keeps fields the seed does not carry, so portraits survive.
4. Commit and push the forge.
5. Apply to D1, see below.

## Change type B, tool or schema or backend code

- Tool HTML: edit `docs/<tool>.html`, mirror to `embeds/<tool>.html`, push. Live on Pages.
- The nine player tools (all but FellGlass and ThreadSpire) carry the site look from `scripts/site-look.css`, pasted between the `site-look:start` and `site-look:end` markers. To change the look, edit that file and paste it into all nine; `npm run sitelook` (part of `npm run checks`) fails if any copy differs.
- New collection or field: add `schemas/<Name>.json`, push, then apply.
- New seed content not from the vault: add `schemas/seed/<Name>.json`, push, then apply.
- Velo `.js`: edit and push. It reaches players once lorefell-site carries the copy (see above).

## Apply to D1

The Apply CMS Action (`scripts/applyD1.js`) keeps a copy of each table it touches, then seeds D1. It runs on every push to main that changes `schemas/seed/`, or by hand. Trigger it from the chat with the forge token (needs Actions write):

    curl -X POST \
      -H "Authorization: Bearer ${FORGE_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      https://api.github.com/repos/The-LoreMaster/lorefell-forge/actions/workflows/apply.yml/dispatches \
      -d '{"ref":"main"}'

The Action keeps the rows it found as an artifact (`backups/`) before writing.

## Discipline

- Commit identity: `LoreKeeper <lorekeeper@local>`.
- `git pull --rebase` before every push. One batch per commit.
- CHANGELOG newest first in both repos that have one.
- Banned tokens, checked on added lines only via `git diff --cached -U0 | grep '^+'`: no em dashes, no semicolons, no ellipses, no "not X but Y", no rhetorical triples, no hype. Short declarative sentences.
- Backups before destructive CMS writes. The Action handles this.

## Push protocol with the user

- Stage and hold until the user says push.
- Forge repo changes: the chat pushes directly.
- Vault changes: the chat pushes directly with the vault token. State plainly that the prose page and the source doc must agree.
- After a canon push, offer to dispatch the Apply Action, do not assume.

## Key files

- Forge engine and tools: `docs/*.html`, mirrored `embeds/*.html`.
- Generic backend: `velo/backend/forge.web.js` with `getForgeDefinition`, `submitCreation`, `getCreations`, `castVote`, `getCatalog`.
- Page bridges: `velo/page-*.js`.
- Rules: `scripts/rules.core.js` builds `docs/rules.js` and `velo/backend/rules.js` via `node scripts/build.js`. The two copies must match.
- Collections: `schemas/*.json`, seed `schemas/seed/*.json`.
- Canon source of record: vault `_Canon/collections/*.md`, governance `_Canon/COLLECTIONS.md`.
- This runbook and the conventions doc are the source of truth for process.
