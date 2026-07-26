# ThreadSpire testing docs

Planning and oracle documents for the two-sided tabletop test harness. These live
in the repo so anyone (including Claude Code) can read them without a download
round-trip.

- **TEST_PLAN.md** — how the harness works: the mock Wix parent, the postMessage
  contract, the message tiers, and the two-oracle model. Read this first.
- **REQUIREMENTS.md** — the software-behavior checklist (A–F). What each scenario
  must assert. The oracle for everything the FellGuide can't cover.
- **S3_AND_LEVELING_PREP.md** — the rules and numbers for the combat scenario (S3)
  and the Fell leveling walkthrough, pulled from the tool. Includes the resolved
  aurum weights.
- **RUNNING_THE_TESTS.md** — the cold-start runbook: how to run the suite from
  scratch and the workflow going forward.

## The two oracles, in one line

The **FellGuide** is the authority on game *rules* (combat numbers, leveling costs,
aurum weights). These **docs** are the authority on software *behavior* (does
switching adventures work, does state sync, does a level-up persist). A test
assertion answers to exactly one of them; a disagreement between tool and oracle
is a finding to report, not to code around.
