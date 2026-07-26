# Aurum weights — confirmed, already canon

Checked the FellGuide vault: the Aurum note already carries the weights, and they
match the tool exactly. No change to the vault was needed.

| Coin   | Worth (in Oro) | Source          |
|--------|----------------|-----------------|
| Oro    | 1              | vault + tool ✓  |
| Arca   | 10             | vault + tool ✓  |
| Atla   | 50             | vault + tool ✓  |
| Zurith | 100            | vault + tool ✓  |

Vault: `The FellGuide/.../The Currency/Definitions/Aurum.md` (the "Value" column).
Tool: `docs/fellglass.html`, `const AURUM`.

## For the aurum test (D2)

The oracle is the **vault** — the weights are canon there. Assert: 3 Oro, 2 Arca,
1 Atla, 1 Zurith on a sheet reads `3 + 20 + 50 + 100 = 173` Oro. Tool and vault
agree, so this is a straight rulebook-backed assertion, not a tool constant.
