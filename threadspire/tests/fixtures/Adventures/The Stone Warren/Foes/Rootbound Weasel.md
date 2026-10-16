---
type: foe
id: rootbound-weasel
name: Rootbound Weasel
shatter_rating: Minion
build: Reaver
vitality: 4
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
affliction: "[[Immobilized]]"
stance: null
infusions:
  - "[[Rooting]]"
  - "[[Hunting]]"
  - "[[Swift]]"
augmentations:
  - "[[Echosight]]"
  - "[[Driftstep]]"
acts:
  - name: Into the Wall
    tier: 1
    kind: ability
    points: 2
    targeting: One Target
    damage: Standard Damage
    effect: Pulled
    text: "It bites and drags. Standard Damage to one target, who is pulled 3 spaces toward the nearest wall."
  - name: Bark Coils
    tier: 2
    kind: ability
    points: 4
    targeting: Two Targets
    damage: Standard Damage
    effect: Immobilized
    text: "Soft bark unwinds off it and wraps round two legs at once. Standard Damage to two targets, who are Immobilized and cannot move until they break out with Movement."
  - name: Spore Burst
    tier: 3
    kind: ability
    points: 5
    targeting: Three Targets
    damage: Standard Damage
    effect: Dazzled
    text: "The bark on its back splits and a grey cloud comes out. Standard Damage to three targets, who are Dazzled: their Accuracy is halved until they break out."
react: When a Fell turns their back on it to set stone, it bites them once.
loot:
  - "[[Rooting]]"
  - "[[Hunting]]"
  - "[[Swift]]"
  - "[[Echosight]]"
  - "[[Driftstep]]"
---
# Rootbound Weasel

A weasel the grey root caught and wound in soft bark from nose to tail, and now walks about. It bulges in the wrong places. Its eyes are open and blank, and it makes no sound.

They move all at once, every one turning the same way at the same moment, because the root moves them and nothing else does. A Minion fields only its Standard Attack. Its signature Immobilized is the bark it leaves on whoever it bites. Its hole is everything: every attribute is 0, and it stays up only on its Vitality.

## What it wants

Warmth. Nothing is left of the weasel. The root moves it the way you move your fingers, and the root reaches for warmth: lamps, fire, bodies. It has no fear, no hunger of its own and no anger. It goes toward the nearest light.

## Getting past it without a fight

Put out the lamps and keep still, and it loses you. Send a lit lamp away down a side tunnel, and it follows. [[05 - Down the Shaft|Down the Shaft]] writes out both.
