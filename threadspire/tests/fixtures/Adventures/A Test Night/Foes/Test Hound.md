---
type: foe
id: test-hound
name: Test Hound
shatter_rating: Elite
build: Reaver
vitality: 7
attributes:
  Precision: 0
  Power: 0
  Magic: 0
  Evasion: 0
  Durability: 0
  Resistance: 0
  Vigor: 0
  Wit: 0
standard_attack:
  roll: 1d6 + 0 Precision against the target's 1d6 + Evasion
  base: 1
  bonus: 1
affliction: "[[Bleeding]]"
stance: Stalwart
infusions:
  - "[[Brutal]]"
augmentations: []
acts:
  - name: Savage Bite
    tier: 1
    kind: physical
    points: 2
    targeting: One Target
    damage: Standard Damage
    effect: Bleeding
    text: It bites one Fell.
react: When a Fell runs, it snaps once.
loot: []
---
# Test Hound

A hound for the test.
