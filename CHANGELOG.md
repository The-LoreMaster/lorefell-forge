# LoreFell Forge Change Log

Build batches pushed to this repo, newest at the top. The apply workflow is manual, so a push here changes the repo only. Collections change in Wix when the apply workflow runs.

---

## 2026-06-20 — SigilForge data, interpreter, and two-gate record

- Replaced the toy ForgeConfig and ForgeComponents seeds with the real SigilForge set: one config row and 103 components. Rider is renamed to Inlay, the spread and amplify ban flags are carried as categories, and major afflictions are tagged by cost.
- Corrected the gates to current canon. Afflictions need Tier 2 and 2nd Form. Major Afflictions and All Enemies need Tier 3 and 3rd Form. Spread needs 2nd Form. Amplify needs Tier 2. Three Targets needs 2nd Form.
- Added the Form floor so Tier cannot fall below the weapon Form, the mythic budget of 7 at Tier 3 on a 3rd Form item, and an Inlay cap that counts Spread and Amplify against the two-Inlay limit.
- Extended the interpreter with the rules it lacked: mutual exclusion, the one-Affliction sub cap, Spread requiring Secondary Targets, No Damage requiring an Inlay, and Spread and Amplify each naming an eligible Inlay with the per-component bans.
- Sigils schema gains the two-gate model and record fields: kind, canonStatus, creatorName, legality, creatorNote, fingerprint, basedOn.
- Added the CreationApprovals collection for per-campaign LoreMaster approval.
- Backend re-validates every submission, writes the legality proof and author, and exposes findSimilar for the overlap check.
- Interpreter tested against legal and illegal builds before committing.
