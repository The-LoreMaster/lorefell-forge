# Cleanup — deferred fixes to do before wrapping up

Distinct from FINDINGS.md. FINDINGS holds things we are deliberately NOT patching.
This holds things we ARE going to fix, just not mid-task, so they do not get lost.
Each item says what, why it was deferred, and exactly how to do it.

---

## C1 — Register the combat postMessage types in checkContracts.js

**Why deferred:** `scripts/` is a denied path (editing it can fire a live Wix CMS
migration), and combat keeps adding messages, so it is cheaper and safer to
register them all in one careful pass at the end than to touch that file after
every step.

**Status:** the Contracts CI workflow fails on the feature branch because of this.
That failure is EXPECTED and is only these unregistered messages. It does not touch
main (main is green) and nothing user-facing is affected. Watch only that the
Contracts failure stays this and does not become something new.

**How to do it:** FINDINGS.md F3 keeps the running register of every type combat
adds, with the exact ALLOW / CHILD entry each needs. When combat is done, apply
that whole table to `scripts/checkContracts.js` in one commit, deliberately, aware
of the CMS-migration risk. As of now the register holds:
  - `ts-hand`  → `ALLOW.fellglass += 'ts-hand'`
  - `ts-hand-request` → `CHILD.threadspire.types += 'ts-hand-request'`
  (more will be added as combat grows — read F3 for the current full list)

Done when: the Contracts workflow goes green on the branch again.

---

## C2 — Add .gitattributes to end the line-ending gremlin

**Why deferred:** it triggers a one-time renormalization across HTML files, which
is noise you do not want landing mid-task. Do it at a genuinely quiet moment on its
own small commit.

**The gremlin:** `core.autocrlf=true` with no `.gitattributes` makes git rewrite
line endings differently at different moments, which has repeatedly shown fellglass
/ threadspire as "modified" when only line endings differ, and has blocked merges
(git checkout -- <file> to clear, then merge). It has cost a diagnostic detour
several times this session.

**How to do it:** add a `.gitattributes` at the repo root pinning the served HTML so
git never converts it:
```
docs/*.html   -text
embeds/*.html -text
```
Commit alone. Expect a one-time renormalization touching those files; that is
expected, not drift. After this, mirroring docs→embeds stops producing phantom
line-ending changes.

Done when: committed, and a docs→embeds mirror no longer shows a spurious change.

---

## C3 — The two pre-existing shardforge / foeforge canon axis1 failures

**Why deferred:** clearing them means regenerating baked catalogs via
`scripts/genCanon.js`, which is the CMS-danger zone, real, careful, separate work.

**Status:** pre-existing, not from this session's changes. They surface as a red X
on the canon gate for those files but are documented and merged through.

**How to do it:** regenerate the catalogs (infusion catalog, augment catalog,
augmentations array) with `scripts/genCanon.js`, carefully, on its own PR, aware of
the CMS migration.

Done when: the canon gate is clean without the documented exceptions.

---

## C4 — Confirm items that need a live check

Not code fixes, but things to verify in the running site before calling them done:
  - Brother's SigilForge dropdowns after a hard cache-clear (the `?v=` bump fix).
  - The lean-scene player delivery end to end on two real devices (confirmed once
    already; worth a second look as combat lands).

---

## C5 — Add a duplicate-top-level-function gate to checkGlobals/checkContracts

**Why deferred:** the check belongs in `scripts/` (the denied CMS zone), so it
gets added in the same careful pass as C1.

**Why it matters:** the combat build surfaced TWO live, pre-existing bugs of one
family, a second top-level `function` with the same name silently replacing the
first for the whole script. `sendDeclare` (a builder shadowed the transport →
recursion, the player's Act never posted) and `lmSetCharge` (the pip toggle
shadowed the remote push → an earned charge never reached the Fell's sheet). Both
were invisible to reading and to a test written against the function that was read
rather than the one that ran; only executing the real path revealed them. Tools
that combat does not exercise may hide more.

**How to do it:** collect `^function NAME` per script block and report any NAME
declared more than once at top level in the same block. FINDINGS F5 has the
detail. Add it alongside the C1 contract-registration pass, since both edit
denied-path scripts.

Done when: the gate runs in `npm run checks` and the codebase passes it (or the
remaining duplicates are deliberately triaged).
