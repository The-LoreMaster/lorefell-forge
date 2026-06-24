# LoreFell Sync Runbook

For a Claude chat that holds two GitHub tokens: a forge token (write to The-LoreMaster/lorefell-forge) and a vault token (write to The-LoreMaster/lorefell-fellguide). The chat does the GitHub work in its own workspace. Wix writes happen in the forge repo's Apply CMS Action, not in the chat.

## Repos

- Forge, public: https://github.com/The-LoreMaster/lorefell-forge
- Vault, private: https://github.com/The-LoreMaster/lorefell-fellguide

Clone both at the start of a working session:

    git clone https://x-access-token:${FORGE_TOKEN}@github.com/The-LoreMaster/lorefell-forge.git
    git clone https://x-access-token:${VAULT_TOKEN}@github.com/The-LoreMaster/lorefell-fellguide.git

Redact tokens in every command echoed back to the user: pipe through
`sed 's/github_pat_[A-Za-z0-9_]*/REDACTED/g'`.

## What is automatic and what is not

- Tool HTML in forge `docs/` (sigilforge.html, shardforge.html, bondforge.html and so on): served by GitHub Pages. A push makes it live. Mirror the same file into `embeds/`.
- Collection data and schema: pushed to Wix only when the Apply CMS Action runs. The chat triggers it or the user does.
- Velo page and backend files in forge `velo/`: not auto-deployed. They are pasted into Wix by the user unless the site is connected to the repo. Flag this whenever one changes.

## Change type A, canon data (lorebounds, infusions, augmentations)

Source of record is the vault, hidden, at `_Canon/collections/Lorebounds.md`, `Infusions.md`, `Augmentations.md`. Format is `## Name` then `Field: value` lines. Block order sets display order. Portraits are not here, they are managed in Wix.

1. Edit the matching doc in the vault clone. Keep the published prose page in agreement.
2. Commit and push the vault.
3. In the forge clone, regenerate the seed from the vault:

       node scripts/canonFromVault.js --vault ../lorefell-fellguide

   It writes `schemas/seed/Lorebounds.json`, `Infusions.json`, `Augmentations.json`. It never writes the portrait field, so Wix image uploads survive.
4. Commit and push the forge.
5. Apply to Wix, see below.

## Change type B, tool or schema or backend code

- Tool HTML: edit `docs/<tool>.html`, mirror to `embeds/<tool>.html`, push. Live on Pages.
- New collection or field: add `schemas/<Name>.json`, push, then apply.
- New seed content not from the vault: add `schemas/seed/<Name>.json`, push, then apply.
- Velo `.js`: edit, push, and tell the user to paste it into Wix.

## Apply to Wix

The Apply CMS Action runs backup, create, then seed. It is manual dispatch. Trigger it from the chat with the forge token (needs Actions write):

    curl -X POST \
      -H "Authorization: Bearer ${FORGE_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      https://api.github.com/repos/The-LoreMaster/lorefell-forge/actions/workflows/apply.yml/dispatches \
      -d '{"ref":"main"}'

Or the user enables the push trigger in `.github/workflows/apply.yml` so it fires on every push that changes the seed. The Action snapshots the collections to `/backups` before writing.

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
