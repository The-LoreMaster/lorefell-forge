/* LoreFell canon conditions pack. Generated from the FellGuide vault (The Combat/The Afflictions).
   54 afflictions, 39 combat effects, 6 impairments. Do not hand-edit. Regenerate from canon. */
(function(g){
  var CONDITIONS = [
  {
    "name": "Accursed",
    "type": "affliction",
    "breakout": "Sanctum",
    "rule": "You take damage equal to the damage you deal to others.",
    "enforce": {
      "bucket": "A",
      "kind": "onDealDamage",
      "op": "selfEqualDealt"
    }
  },
  {
    "name": "Agonized",
    "type": "affliction",
    "breakout": "Bearing",
    "rule": "You cannot attack and your Evasion becomes 0.",
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noAttack"
    }
  },
  {
    "name": "Anchored",
    "type": "affliction",
    "breakout": "Movement",
    "rule": "You cannot swap tiered abilities in battle.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Benighted",
    "type": "affliction",
    "breakout": "Resolve",
    "rule": "You are unable to imprint, slag, or use Paragon Points in battle.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Bleeding",
    "type": "affliction",
    "breakout": "Renewal",
    "rule": "Whenever you take damage, take 1 additional Base Damage.",
    "enforce": {
      "bucket": "A",
      "kind": "onDamageTaken",
      "op": "addBase",
      "value": 1
    }
  },
  {
    "name": "Bruised",
    "type": "affliction",
    "breakout": "Bearing",
    "rule": "Bonus Damage dealt to you counts as Base Damage instead.",
    "enforce": {
      "bucket": "A",
      "kind": "dmgIn",
      "op": "bonusAsBase"
    }
  },
  {
    "name": "Conjoined",
    "type": "affliction",
    "breakout": "Sanctum",
    "rule": "Choose a target ally. Any damage dealt to that ally is also dealt to you.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Constrained",
    "type": "affliction",
    "breakout": "Creation",
    "rule": "You can only have one of the following summoned during battle: - Weapon - Armor - Lorebound",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Crippled",
    "type": "affliction",
    "breakout": "Anchor",
    "rule": "All of your attributes become equal to your lowest attribute.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Dazzled",
    "type": "affliction",
    "breakout": "Vigilance",
    "rule": "Your Accuracy is halved.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Defanged",
    "type": "affliction",
    "breakout": "Creation",
    "rule": "Your Lorebound loses its Aspects.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Diminished",
    "type": "affliction",
    "breakout": "Resolve",
    "rule": "Your Resistance becomes 0.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Disarmed",
    "type": "affliction",
    "breakout": "Finesse",
    "rule": "You cannot utilize your weapon.",
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noWeapon"
    }
  },
  {
    "name": "Disenchanted",
    "type": "affliction",
    "breakout": "Creation",
    "rule": "Your weapons lose their Infusions.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Dislocated",
    "type": "affliction",
    "breakout": "Finesse",
    "rule": "All Physical damage you deal is halved.",
    "enforce": {
      "bucket": "A",
      "kind": "dmgOut",
      "op": "physHalved"
    }
  },
  {
    "name": "Disoriented",
    "type": "affliction",
    "breakout": "Logic",
    "rule": "Roll 1d6 before each attack. On an odd result, you must target an ally if able.",
    "enforce": {
      "bucket": "B",
      "kind": "target",
      "op": "oddTargetsAlly"
    }
  },
  {
    "name": "Disrupted",
    "type": "affliction",
    "breakout": "Weaving",
    "rule": "Your spells automatically fail unless a Fellmark is rolled.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Enfeebled",
    "type": "affliction",
    "breakout": "Temper",
    "rule": "Lose half your current Vitality.",
    "enforce": {
      "bucket": "A",
      "kind": "onApply",
      "op": "loseHalfCurrent"
    }
  },
  {
    "name": "Ensnared",
    "type": "affliction",
    "breakout": "Might",
    "rule": "You may not utilize Acts.",
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noAct"
    }
  },
  {
    "name": "Fragmented",
    "type": "affliction",
    "breakout": "Lore",
    "rule": "You may not use or activate Remnants.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Frenzied",
    "type": "affliction",
    "breakout": "Conviction",
    "rule": "You may only target the source of this Affliction.",
    "enforce": {
      "bucket": "B",
      "kind": "target",
      "op": "mustSource"
    }
  },
  {
    "name": "Frozen",
    "type": "affliction",
    "breakout": "Bearing",
    "rule": "You may only utilize Skill Rolls.",
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "skillOnly"
    }
  },
  {
    "name": "Harvested",
    "type": "affliction",
    "breakout": "Spirit",
    "rule": "Any source that would heal your Vitality deals Base Damage instead.",
    "enforce": {
      "bucket": "A",
      "kind": "heal",
      "op": "invertToBase"
    }
  },
  {
    "name": "Hunted",
    "type": "affliction",
    "breakout": "Elusion",
    "rule": "Fellmarks land against you on a 5 or 6.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Ignited",
    "type": "affliction",
    "breakout": "Endurance",
    "rule": "Whenever you utilize an Act, take 1d6 damage.",
    "enforce": {
      "bucket": "A",
      "kind": "onAct",
      "op": "selfRoll",
      "value": "1d6"
    }
  },
  {
    "name": "Immobilized",
    "type": "affliction",
    "breakout": "Movement",
    "rule": "You cannot move as part of an Act or React.",
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noMove"
    }
  },
  {
    "name": "Impeded",
    "type": "affliction",
    "breakout": "Movement",
    "rule": "Your Evasion becomes 0.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Inept",
    "type": "affliction",
    "breakout": "Logic",
    "rule": "You may not use Skill Rolls except to remove Afflictions or Effects.",
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "skillOnlyCleanse"
    }
  },
  {
    "name": "Inert",
    "type": "affliction",
    "breakout": "Lore",
    "rule": "You may not search for or use Skyvault Shards in battle.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Infected",
    "type": "affliction",
    "breakout": "Endurance",
    "rule": "You take 1 additional Base Damage whenever you take damage.",
    "enforce": {
      "bucket": "A",
      "kind": "onDamageTaken",
      "op": "addBase",
      "value": 1
    }
  },
  {
    "name": "Jinxed",
    "type": "affliction",
    "breakout": "Resonance",
    "rule": "Your rolls of 1 or 2 count as Fellstrikes.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Lacerated",
    "type": "affliction",
    "breakout": "Poise",
    "rule": "You cannot utilize attacks.",
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noAttack"
    }
  },
  {
    "name": "Mangled",
    "type": "affliction",
    "breakout": "Renewal",
    "rule": "Whenever you deal damage, you take your own Base Damage.",
    "enforce": {
      "bucket": "A",
      "kind": "onDealDamage",
      "op": "selfBase"
    }
  },
  {
    "name": "Masked",
    "type": "affliction",
    "breakout": "Vigilance",
    "rule": "You may only see spaces and targets in your space or adjacent spaces.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Nullified",
    "type": "affliction",
    "breakout": "Creation",
    "rule": "You cannot gain the benefits of Effects.",
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noEffectGain"
    }
  },
  {
    "name": "Persecuted",
    "type": "affliction",
    "breakout": "Trickery",
    "rule": "Enemies must target you if able.",
    "enforce": {
      "bucket": "B",
      "kind": "target",
      "op": "enemiesMustHitYou"
    }
  },
  {
    "name": "Plagued",
    "type": "affliction",
    "breakout": "Sanctum",
    "rule": "Each Affliction that afflicts an enemy also afflicts you.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Reapt",
    "type": "affliction",
    "breakout": "Weaving",
    "rule": "You no longer gain Charges.",
    "enforce": {
      "bucket": "A",
      "kind": "passive",
      "op": "noChargeGain"
    }
  },
  {
    "name": "Restricted",
    "type": "affliction",
    "breakout": "Creation",
    "rule": "You lose the benefits of Talents.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Slashed",
    "type": "affliction",
    "breakout": "Renewal",
    "rule": "Your maximum Vitality is halved.",
    "enforce": {
      "bucket": "A",
      "kind": "passive",
      "op": "maxVitHalved"
    }
  },
  {
    "name": "Staggered",
    "type": "affliction",
    "breakout": "Reflex",
    "rule": "You cannot utilize Reacts.",
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noReact"
    }
  },
  {
    "name": "Strung",
    "type": "affliction",
    "breakout": "Resonance",
    "rule": "Each spell that targets an enemy also targets an ally.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Stymied",
    "type": "affliction",
    "breakout": "Reflex",
    "rule": "You may only make a single Evasion roll each round.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Suppressed",
    "type": "affliction",
    "breakout": "Resolve",
    "rule": "You cannot utilize Precision or Power weapon abilities.",
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noPrecPowAbility"
    }
  },
  {
    "name": "Synchronized",
    "type": "affliction",
    "breakout": "Trickery",
    "rule": "Each Affliction that afflicts an ally also afflicts you.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Tainted",
    "type": "affliction",
    "breakout": "Sanctum",
    "rule": "You cannot use potions or runes.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Terrorized",
    "type": "affliction",
    "breakout": "Conviction",
    "rule": "You cannot voluntarily move closer to the source of this Affliction.",
    "enforce": {
      "bucket": "B",
      "kind": "target",
      "op": "noCloserToSource"
    }
  },
  {
    "name": "Unclad",
    "type": "affliction",
    "breakout": "Creation",
    "rule": "Your armor loses its Augmentations.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Unlucky",
    "type": "affliction",
    "breakout": "Resonance",
    "rule": "All your rolls become Unlucky.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Vitiated",
    "type": "affliction",
    "breakout": "Resonance",
    "rule": "All Magic damage you deal is halved.",
    "enforce": {
      "bucket": "A",
      "kind": "dmgOut",
      "op": "magicHalved"
    }
  },
  {
    "name": "Vulnerable",
    "type": "affliction",
    "breakout": "Guard",
    "rule": "Your Durability becomes 0.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Withered",
    "type": "affliction",
    "breakout": "Endurance",
    "rule": "Any source that would heal your Vitality does not heal your Vitality.",
    "enforce": {
      "bucket": "A",
      "kind": "heal",
      "op": "blocked"
    }
  },
  {
    "name": "Witless",
    "type": "affliction",
    "breakout": "Logic",
    "rule": "You cannot utilize Utility Items.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Worn",
    "type": "affliction",
    "breakout": "Reflex",
    "rule": "You gain 1 rank of Fatigue.",
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Attuned",
    "type": "effect",
    "breakout": "",
    "rule": "Gain 1 Charge.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Restored",
    "type": "effect",
    "breakout": "",
    "rule": "A target gains 1 Charge.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Drained",
    "type": "effect",
    "breakout": "",
    "rule": "A target loses 1 Charge.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Transferred",
    "type": "effect",
    "breakout": "",
    "rule": "Move 1 Charge between two targets.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Advanced",
    "type": "effect",
    "breakout": "",
    "rule": "Move up to 3 spaces.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Pursued",
    "type": "effect",
    "breakout": "",
    "rule": "Move adjacent to a target.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Repositioned",
    "type": "effect",
    "breakout": "",
    "rule": "Move an ally up to 3 spaces.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Swapped",
    "type": "effect",
    "breakout": "",
    "rule": "Swap positions with a target.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Pushed",
    "type": "effect",
    "breakout": "",
    "rule": "Move one target 3 spaces directly away from the attacker or source space.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Pulled",
    "type": "effect",
    "breakout": "",
    "rule": "Move one target 3 spaces directly toward the attacker or source space.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Gathered",
    "type": "effect",
    "breakout": "",
    "rule": "Choose an empty space within range. Move each affected target 3 spaces toward that space.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Scattered",
    "type": "effect",
    "breakout": "",
    "rule": "Choose a space within range. Move each affected target 3 spaces away from that space.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Placed",
    "type": "effect",
    "breakout": "",
    "rule": "Move one target to an empty space within 3 spaces of its current space.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Mended",
    "type": "effect",
    "breakout": "",
    "rule": "Restore Vitality equal to your Spirit.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Siphoned",
    "type": "effect",
    "breakout": "",
    "rule": "Deal Base Damage and restore that much Vitality.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Purged",
    "type": "effect",
    "breakout": "",
    "rule": "Remove an Affliction.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Dispelled",
    "type": "effect",
    "breakout": "",
    "rule": "Remove one Effect.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Manifested",
    "type": "effect",
    "breakout": "",
    "rule": "Create a temporary object, barrier, or terrain feature in an empty space.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Cleaved",
    "type": "effect",
    "breakout": "",
    "rule": "Deal Base Damage to another target.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Crushed",
    "type": "effect",
    "breakout": "",
    "rule": "Deal Base Damage again.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Refracted",
    "type": "effect",
    "breakout": "",
    "rule": "Choose another target. They take half Bonus Damage.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Redirected",
    "type": "effect",
    "breakout": "",
    "rule": "Move one Effect from one target to another.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Lucky",
    "type": "effect",
    "breakout": "",
    "rule": "Your rolls are Lucky Rolls until you take damage.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Guarded",
    "type": "effect",
    "breakout": "",
    "rule": "The next source of damage against the target is reduced by your Power.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Warded",
    "type": "effect",
    "breakout": "",
    "rule": "The next source of Magic damage against the target is reduced by your Magic.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Bound",
    "type": "effect",
    "breakout": "",
    "rule": "Damage dealt to the target is dealt to you instead until either of you take damage.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Reinforced",
    "type": "effect",
    "breakout": "",
    "rule": "Restore the target's Armor Stance. Until they take damage, its benefits are doubled.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Sheltered",
    "type": "effect",
    "breakout": "",
    "rule": "Ignore the next Effect applied to the target.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Obscured",
    "type": "effect",
    "breakout": "",
    "rule": "Enemies cannot see or target you until you deal damage or the end of your next round.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Studied",
    "type": "effect",
    "breakout": "Trickery",
    "rule": "Your attacks against the target are Lucky Rolls until you deal damage to them.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Tracked",
    "type": "effect",
    "breakout": "Elusion",
    "rule": "You always know the target's location until you deal damage to them.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Exposed",
    "type": "effect",
    "breakout": "Guard",
    "rule": "Ignore the target's Durability until after you deal damage to them.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Pierced",
    "type": "effect",
    "breakout": "Sanctum",
    "rule": "Ignore the target's Resistance until after you deal damage to them.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Unraveled",
    "type": "effect",
    "breakout": "Creation",
    "rule": "Ignore one of the target's Infusions until after you deal damage to them.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Shattered",
    "type": "effect",
    "breakout": "Creation",
    "rule": "Ignore one of the target's Augmentations until after you deal damage to them.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Sabotaged",
    "type": "effect",
    "breakout": "Anchor",
    "rule": "Ignore the target's Armor Stance until after you deal damage to them.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Sealed",
    "type": "effect",
    "breakout": "Lore",
    "rule": "Ignore one Utility Item effect affecting the target until after you deal damage to them.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Echoed",
    "type": "effect",
    "breakout": "Resonance",
    "rule": "The next spell the target casts also targets themselves.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Broken",
    "type": "effect",
    "breakout": "Weaving",
    "rule": "The next Charge the target gains is lost.",
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Blinded",
    "type": "impairment",
    "breakout": "",
    "rule": "Bleeding (until end of battle) - Permanent Effect: Dazzled",
    "enforce": {
      "bucket": "C",
      "kind": "impairment",
      "op": null
    }
  },
  {
    "name": "Concussed",
    "type": "impairment",
    "breakout": "",
    "rule": "Agonized (until end of battle) - Permanent Effect: Disoriented",
    "enforce": {
      "bucket": "C",
      "kind": "impairment",
      "op": null
    }
  },
  {
    "name": "Dismembered",
    "type": "impairment",
    "breakout": "",
    "rule": "Disarmed and Bleeding (until end of battle) - Permanent Effect: Mangled",
    "enforce": {
      "bucket": "C",
      "kind": "impairment",
      "op": null
    }
  },
  {
    "name": "Maimed",
    "type": "impairment",
    "breakout": "",
    "rule": "Bleeding and Immobilized (until end of battle) - Permanent Effect: Impeded",
    "enforce": {
      "bucket": "C",
      "kind": "impairment",
      "op": null
    }
  },
  {
    "name": "Severed",
    "type": "impairment",
    "breakout": "",
    "rule": "None - Permanent Effect: Disrupted and Diminished",
    "enforce": {
      "bucket": "C",
      "kind": "impairment",
      "op": null
    }
  },
  {
    "name": "Sundered",
    "type": "impairment",
    "breakout": "",
    "rule": "None - Permanent Effect (Unbranded): Dead. Your soul is cast into Pandemonium. - Permanent Effect (Branded): FellScarred. Your Brand becomes permanently damaged. Its powers may be altered, hindered, corrupted, or transformed at the LoreMaster's discretion.",
    "enforce": {
      "bucket": "C",
      "kind": "impairment",
      "op": null
    }
  }
];
  var byName = {};
  CONDITIONS.forEach(function(c){ byName[c.name.toLowerCase()] = c; });
  g.CANON_CONDITIONS = CONDITIONS;
  g.canonCondition = function(n){ return byName[String(n||"").toLowerCase().replace(/[*\s]+$/,"")] || null; };
  g.canonByBucket = function(b){ return CONDITIONS.filter(function(c){ return c.enforce.bucket===b; }); };
  g.canonByType = function(t){ return CONDITIONS.filter(function(c){ return c.type===t; }); };
})(typeof window!=="undefined"?window:this);
