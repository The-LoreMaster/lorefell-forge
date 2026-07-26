# S3 combat oracle + Fell leveling walkthrough

Prep for the two scenarios that need the rulebook as oracle. Everything here is
pulled from the actual tool code (`docs/fellglass.html`), so where the vault is
silent or disagrees, this is at least what the tool currently does — and a
disagreement between tool and vault is itself a finding to log.

---

## Part 1 — The aurum weights Claude Code couldn't find

It looked in the vault and came up empty. The reason: **the weights live in the
tool, not the rulebook.** In `docs/fellglass.html`:

```
const AURUM = [["oro","Oro",1], ["arca","Arca",10], ["atla","Atla",50], ["zurith","Zurith",100]];
```

So the denominations are:

| Coin   | Worth in Oro |
|--------|--------------|
| Oro    | 1            |
| Arca   | 10           |
| Atla   | 50           |
| Zurith | 100          |

The sheet totals them into a single "worth in oro" figure. That matches the
×1/×10/×50/×100 the requirements doc assumed, so that assumption was right.

**One thing to settle before asserting it as a rule:** confirm the vault agrees.
If the FellGuide states the same weights, assert against the vault. If the vault
is silent, the tool is the de facto canon — note in the test that the oracle here
is the tool, not the rulebook, so nobody later mistakes it for a vault-derived
number. If the vault *disagrees*, that's a bug: flag it, don't paper over it.

**The D2 assertion, ready to write:** put 3 Oro, 2 Arca, 1 Atla, 1 Zurith on a
sheet → total must read `3 + 20 + 50 + 100 = 173` oro. Any other number is a bug.

---

## Part 2 — The combat rules S3 needs (from the tool; verify against vault)

S3 is a Beat of combat across both sides. The assertions it needs, and where the
numbers come from in the tool:

**Foe damage** (`foeDamage` in threadspire, `fwFoeDamage` in fatewell — identical):
- Base = 1 + (Power or Magic, whichever the attack type uses).
- Bonus = the weapon bonus for party level, plus infusion stacks.
- Attack type is magic if the foe's kit leans magic, else physical.
- Accuracy = `1d6 + Precision` (physical) or `1d6 + Magic` (magic).

**Weapon bonus by level** (`BONUS_BY_LEVEL`), the number a weapon adds:

| Weapon level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|--------------|---|---|---|---|---|---|---|---|---|----|
| Bonus damage | 1 | 1 | 3 | 3 | 6 | 6 | 10| 10| 15| 15 |

**Foe rungs** (Minion/Elite/Champion/Epic/Forsaken) carry attribute offsets and
vitality weights — pull the exact offsets from `FW_FOE_PACK.tiers` in
`docs/fatewell.html` when writing the foe-damage assertion, so a dropped Elite's
numbers can be checked against its rung.

**Act/React economy** (the load-bearing rule): one Act + one React per Beat. Dig
In trades the Act for a second React. All In trades the React for a second Act. A
second Act without All In must be refused. This is the first assertion to write —
it's the rule players feel every turn.

**For S3, verify each against the vault before asserting.** The tool gives you the
expected numbers; the FellGuide says whether they're *right*. Read the combat
chapter, confirm base/bonus/accuracy and the Act/React economy match, then assert.
Where they diverge, the divergence is the finding.

---

## Part 3 — The Fell leveling walkthrough (you said this isn't happening)

This is the big one. The leveling system is real and complete in `fellglass.html`
(the "Ascend" flow, `luApply`). If leveling "isn't happening", the harness should
walk every path and pin down where it breaks. Here's the full model, so the
scenario can assert each step.

### The shape of one level-up

Triggered by the level-up button, resolved in a rest, four steps:

1. **Invest the Ascension Crystal.** Raise one attribute (+1 base). The
   attribute's *category* decides the whole path:
   - an **offensive** attribute (Power / Precision / Magic) → forge a **weapon**
   - a **defensive** attribute (Evasion / Durability / Resistance) → temper
     **armor**
   - a **core** attribute (Vigor and the others) → deepen a **lorebound** bond
2. **Advance the chosen track** (weapon / armor / lorebound — detailed below).
3. **Vitality.** Roll d6 + Vigor; the total is added to max vitality.
4. **Ascend** commits it (`luApply`): crystal spent (`lorePoints -= level+1`),
   level++, the attribute and any track bonus written, weapon/armor/lorebound
   updated, vitality raised.

**Cost:** a crystal costs `level + 1` Lore Points. (Lore Points + 1 per level make
one crystal.) The scenario should assert the crystal can't be spent without enough
Lore Points, and that spending deducts exactly `level + 1`.

### Path A — weapons (offensive attribute)

Investing an offensive attribute advances **that attribute's weapons only** (a
Power crystal can't level a Magic weapon). Options at step 2:
- Level an owned weapon of that category to the next level (cap 10).
- Or take up a **new** weapon of that category (max 3 weapons, never the same
  weapon tree twice).

Weapon level benefits (`WEAPON_LEVELS`), the things the scenario should assert
land on the sheet:

| Level | What it grants |
|-------|----------------|
| 1 | +1 bonus damage, first Infusion |
| 2 | a Tier 1 weapon ability |
| 3 | bonus damage +2 (total 3) |
| 4 | 2nd Infusion + Affliction slots open, then **choose**: 2nd Infusion *or* reforge to next form |
| 5 | bonus damage +3 (total 6) |
| 6 | a Tier 2 weapon ability |
| 7 | bonus damage +4 (total 10) |
| 8 | 3rd Infusion + Affliction slots open, then **choose**: 3rd Infusion *or* reforge to final form |
| 9 | bonus damage +5 (total 15) |
| 10 | a Tier 3 weapon ability |

The **level 4 and 8 fork** (infusion vs reforge) is the trickiest path — the
scenario must walk both branches and assert reforge advances the weapon's form
(`formIdx`) while keeping earned abilities, and that choosing an infusion instead
opens the slot without changing form.

### Path B — armor (defensive attribute)

Step 2 tempers armor: gain armor at L1 if you have none, else level it (cap 10).

Armor level pattern (`ARMOR_LEVELS`):
- **Odd levels (1,3,5,7,9):** after the crystal, raise *another* defensive
  attribute by +1 (the "armor growth" step). The scenario should assert this
  second bonus actually applies.
- **Even levels: 2 →** Tier 1 stance, **4 →** augmentation, **6 →** Tier 2
  stance, **8 →** augmentation, **10 →** Tier 3 stance.

### Path C — lorebounds (core attribute)

Step 2 deepens a bond: level an owned lorebound (cap 10) or bond a new one (max
2). Lorebound **form by level**: Familiar (1–3), Companion (4–6), Corsair (7+) —
so the scenario should assert the form label changes at 4 and 7.

- **Odd lorebound levels:** raise *any* other attribute by +1 (the "lorebound
  growth" step). Assert it applies.
- Lorebound benefits per level come from `LOREBOUND_LEVELS` — pull the exact
  strings when writing the assertions.

### The walkthrough scenario (what to build)

One spec, `leveling.spec.js`, that drives the Ascend flow and asserts the sheet
after each. Cover, at minimum:

1. **A weapon level-up** — invest Power, level a Power weapon, assert bonus damage
   and the level benefit landed, vitality rose by the rolled amount.
2. **The level-4 reforge fork** — assert form advances and abilities are kept.
3. **The level-4 infusion fork** — assert the slot opens, form unchanged.
4. **An armor level-up on an odd level** — assert the second defensive attribute
   bonus applied, not just the crystal.
5. **A lorebound level-up crossing a form boundary** (3→4 or 6→7) — assert the
   form label changed and the odd-level growth applied.
6. **The crystal economy** — assert `level+1` Lore Points are deducted, and a
   level-up is refused without enough.
7. **Persistence** — after Ascend, reload; assert the new level, weapon/armor/
   lorebound state, and vitality all survive (this is where "leveling isn't
   happening" most likely bites — if the Ascend applies but doesn't save, it
   would look like it never happened).

**Assertion oracle:** for the *mechanics* above, the tool code is the spec (the
tables here). For whether those mechanics are *correct LoreFell rules* (does a
crystal really cost level+1, is the d6+Vigor vitality roll right, are the form
boundaries at 4 and 7), the **FellGuide is the oracle** — read the progression
chapter and confirm each number before locking the assertion. Log any tool/vault
disagreement rather than assuming the tool is right.

---

## Suggested order

1. **D2 aurum** — smallest, and the weights are now known. Confirm against the
   vault, then assert 173-oro. Warm-up.
2. **Leveling walkthrough** — this is the one you flagged as actually broken, so
   it has the highest chance of finding a real bug. Start with the weapon path and
   the persistence check (item 7), since "applies but doesn't save" is the most
   likely culprit for "leveling isn't happening".
3. **S3 combat** — once leveling and aurum are green, the full Beat, with the
   Act/React economy asserted first.

Hand Claude Code this document alongside the requirements list. Tell it: the
tables here are the tool's current behavior; the FellGuide is the authority on
whether they're the right rules; a disagreement is a finding, not a thing to code
around.
