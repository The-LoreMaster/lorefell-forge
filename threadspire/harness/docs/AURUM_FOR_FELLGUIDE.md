# Aurum weights — to add to the FellGuide

The denominations live in the tool (`docs/fellglass.html`, `const AURUM`) but not
yet in the vault. This makes the vault canonical for them, so a test can assert
against the rulebook rather than against a tool constant. Paste the block below
into the FellGuide's **Aurum** note (in the `lorefell-fellguide` vault).

---

## Denominations

Aurum is counted in four coins. Each is worth a fixed number of the base coin,
Oro.

| Coin   | Worth (in Oro) |
|--------|----------------|
| Oro    | 1              |
| Arca   | 10             |
| Atla   | 50             |
| Zurith | 100            |

A Fell's total worth is the sum of every coin converted to Oro. For example, 3
Oro, 2 Arca, 1 Atla, and 1 Zurith is worth `3 + 20 + 50 + 100 = 173` Oro.

---

*Once this is in the vault, the harness's aurum check (D2) asserts against the
rulebook. If the vault ever states different weights than the tool, that
disagreement is a bug to reconcile, not to silence.*
