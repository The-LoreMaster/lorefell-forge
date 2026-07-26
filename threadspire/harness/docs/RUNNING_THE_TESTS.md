# Running the ThreadSpire tests — start here any time

Keep this. It's everything you need to run the two-sided ThreadSpire test suite
from a cold start, even if you closed the terminal, restarted the computer, or
forgot where you were.

---

## The 30-second version

Open Windows Terminal and run these, one at a time:

```
cd "C:\Users\Nate Johnson\LoreFell\lorefell-forge\threadspire"
npx playwright test --config=tabletop.config.js
```

That's the whole thing once it's set up. The lines below are for the first run on
a fresh machine, or when something looks off.

---

## Full cold-start (first time, or after a new computer)

**1. Open the terminal.** Press the Windows key, type `terminal`, open Windows
Terminal.

**2. Go to the test folder.** Paste this exactly (the quotes matter — your path
has a space in it):

```
cd "C:\Users\Nate Johnson\LoreFell\lorefell-forge\threadspire"
```

Your prompt should now end in `...lorefell-forge\threadspire>`.

**3. Install the test tools** (only needed the first time, or after a fresh
pull):

```
npm install
```
Good result: ends with "added N packages" or "up to date". Yellow warnings are
fine. Red errors — stop and ask for help.

**4. Install the browser** (only needed once per machine):

```
npx playwright install chromium
```
Good result: "downloaded" or silent (already there). Both are fine.

**5. Run the tests:**

```
npx playwright test --config=tabletop.config.js
```

---

## How to read the result

The last line is the scorecard: `26 passed, 2 failed` (or similar).

- **All passed** → everything the suite checks is working. 
- **Something failed** → each failure names which check (e.g. `C1 the table opens
  on the scene you left`). A failure is usually one of two things:
  - a **real bug** in ThreadSpire, or
  - a **test that needs updating** because the tool changed on purpose.

  You don't have to tell which. That's the agent's job — see below.

The detailed results are written to disk at `threadspire\test-results\`, and
Claude Code reads those directly. So after a run you don't need to copy long
output — just tell it the run finished.

---

## The workflow going forward (this is the important part)

This is the loop that makes the tests pay off. Follow it and you never lose track.

**When you want to check the tool is healthy** (after any change, before a
session, whenever you're unsure):

1. You run the test command in your terminal (step 5 above).
2. You tell Claude Code: **"tests done"** (and paste the bottom summary line to
   your other assistant if you want a second read).
3. Claude Code reads the artifacts and tells you what passed, what failed, and
   for each failure, whether it's a real bug or a test that needs updating.

**When a real bug is found:**

1. Claude Code diagnoses the root cause and proposes a fix in `docs/`.
2. It mirrors `docs/` → `embeds/` and runs `node canon/checkCanon.js`.
3. It commits locally and tells you the change is ready.
4. **You run `git push`** (you hold the token, not the agent).
5. You run the tests again to confirm the fix went green.

**When you add a new thing to test:**

Point Claude Code at the requirements list (THREADSPIRE_REQUIREMENTS.md). Each
requirement becomes one new check. Once written, it runs forever after with the
rest — that's the whole value: a bug caught once can't come back unnoticed.

---

## The rules that keep this safe (don't skip)

- **You run the commands, not Claude Code.** The guard you built stays exactly as
  it is. If Claude Code asks you to edit the guard or offers guard changes, you
  can decline — running the tests yourself sidesteps all of it. Tell it once:
  *"I run the tests in my own terminal; don't try to run npx/npm yourself and
  don't offer guard edits."*
- **You do the `git push`.** The token lives on your machine, never in a chat.
- **Never let it edit `embeds/` directly** — that's a mirror of `docs/`. Edit
  `docs/`, mirror, run the canon gate.
- **`scripts/`, `schemas/`, and `.github/workflows/apply.yml` are off-limits
  without a heads-up** — pushing changes to those fires a live Wix data
  migration. For test work you should never need to touch them.

---

## If something breaks and you're stuck

Paste the terminal output to your assistant and say what step you were on. Test
runs only read your code and drive a throwaway browser — running them can't harm
your repo, your files, or your live site. The worst case is an error message, and
an error is just information. Nothing here is dangerous.

---

## One housekeeping note

The test suite (the `harness/` folder, `tabletop.config.js`, the spec files) is
currently **uncommitted** on the branch `feature/threadspire-tabletop-harness`.
Once Claude Code commits it and you push, it's saved in the repo permanently and
this runbook's cold-start "npm install" step will pull it down on any machine.
Until then, it lives only in your local folder — so don't delete that folder.
```
