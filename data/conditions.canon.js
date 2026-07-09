/* LoreFell canon conditions pack. Generated from SigilForge, which is canon for conditions.
   37 afflictions, 34 combat effects, 6 impairments.
   Only an affliction carries a Breakout. Do not hand-edit. Regenerate from SigilForge. */
(function(g){
  var CONDITIONS = [
  {
    "name": "Bleeding",
    "type": "affliction",
    "family": "Precision",
    "cost": 3,
    "breakout": "Renewal",
    "rule": "Whenever you take damage, take your own Base Damage.",
    "forgeable": true,
    "enforce": {
      "bucket": "A",
      "kind": "onDamageTaken",
      "op": "addBase",
      "value": 1
    }
  },
  {
    "name": "Impeded",
    "type": "affliction",
    "family": "Precision",
    "cost": 3,
    "breakout": "Movement",
    "rule": "Your Evasion becomes 0.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Vulnerable",
    "type": "affliction",
    "family": "Precision",
    "cost": 3,
    "breakout": "Guard",
    "rule": "Your Durability becomes 0.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Immobilized",
    "type": "affliction",
    "family": "Precision",
    "cost": 3,
    "breakout": "Movement",
    "rule": "You cannot move.",
    "forgeable": true,
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noMove"
    }
  },
  {
    "name": "Hunted",
    "type": "affliction",
    "family": "Precision",
    "cost": 3,
    "breakout": "Elusion",
    "rule": "Fellmarks land against you on a 5 or 6.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Slashed",
    "type": "affliction",
    "family": "Precision",
    "cost": 4,
    "breakout": "Renewal",
    "rule": "Your maximum Vitality is halved.",
    "forgeable": true,
    "enforce": {
      "bucket": "A",
      "kind": "passive",
      "op": "maxVitHalved"
    }
  },
  {
    "name": "Frenzied",
    "type": "affliction",
    "family": "Precision",
    "cost": 4,
    "breakout": "Conviction",
    "rule": "You may only target the source of this Affliction.",
    "forgeable": true,
    "enforce": {
      "bucket": "B",
      "kind": "target",
      "op": "mustSource"
    }
  },
  {
    "name": "Disenchanted",
    "type": "affliction",
    "family": "Precision",
    "cost": 4,
    "breakout": "Creation",
    "rule": "Your weapons lose their Infusions.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Disarmed",
    "type": "affliction",
    "family": "Precision",
    "cost": 4,
    "breakout": "Finesse",
    "rule": "You cannot utilize your weapon.",
    "forgeable": true,
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noWeapon"
    }
  },
  {
    "name": "Disrupted",
    "type": "affliction",
    "family": "Precision",
    "cost": 4,
    "breakout": "Weaving",
    "rule": "Your spells automatically fail unless a Fellmark is rolled.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Lacerated",
    "type": "affliction",
    "family": "Precision",
    "cost": 5,
    "breakout": "Poise",
    "rule": "You cannot utilize attacks.",
    "forgeable": true,
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noAttack"
    }
  },
  {
    "name": "Diminished",
    "type": "affliction",
    "family": "Power",
    "cost": 3,
    "breakout": "Resolve",
    "rule": "Your Resistance becomes 0.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Bruised",
    "type": "affliction",
    "family": "Power",
    "cost": 3,
    "breakout": "Bearing",
    "rule": "Bonus Damage dealt to you counts as Base Damage instead.",
    "forgeable": true,
    "enforce": {
      "bucket": "A",
      "kind": "dmgIn",
      "op": "bonusAsBase"
    }
  },
  {
    "name": "Dazzled",
    "type": "affliction",
    "family": "Power",
    "cost": 3,
    "breakout": "Vigilance",
    "rule": "Your Accuracy is halved.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Terrorized",
    "type": "affliction",
    "family": "Power",
    "cost": 3,
    "breakout": "Conviction",
    "rule": "You cannot voluntarily move closer to the source of this Affliction.",
    "forgeable": true,
    "enforce": {
      "bucket": "B",
      "kind": "target",
      "op": "noCloserToSource"
    }
  },
  {
    "name": "Disoriented",
    "type": "affliction",
    "family": "Power",
    "cost": 3,
    "breakout": "Logic",
    "rule": "Roll 1d6 before each attack. On an odd result, you must target an ally if able.",
    "forgeable": true,
    "enforce": {
      "bucket": "B",
      "kind": "target",
      "op": "oddTargetsAlly"
    }
  },
  {
    "name": "Mangled",
    "type": "affliction",
    "family": "Power",
    "cost": 3,
    "breakout": "Renewal",
    "rule": "Whenever you deal damage, you take your own Base Damage.",
    "forgeable": true,
    "enforce": {
      "bucket": "A",
      "kind": "onDealDamage",
      "op": "selfBase"
    }
  },
  {
    "name": "Vitiated",
    "type": "affliction",
    "family": "Power",
    "cost": 4,
    "breakout": "Resonance",
    "rule": "Damage you deal is halved.",
    "forgeable": true,
    "enforce": {
      "bucket": "A",
      "kind": "dmgOut",
      "op": "magicHalved"
    }
  },
  {
    "name": "Unclad",
    "type": "affliction",
    "family": "Power",
    "cost": 4,
    "breakout": "Creation",
    "rule": "Your armor loses its Augmentations.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Staggered",
    "type": "affliction",
    "family": "Power",
    "cost": 4,
    "breakout": "Reflex",
    "rule": "You cannot utilize Reacts.",
    "forgeable": true,
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noReact"
    }
  },
  {
    "name": "Agonized",
    "type": "affliction",
    "family": "Power",
    "cost": 5,
    "breakout": "Bearing",
    "rule": "You cannot attack and your Evasion becomes 0.",
    "forgeable": true,
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noAttack"
    }
  },
  {
    "name": "Crippled",
    "type": "affliction",
    "family": "Power",
    "cost": 5,
    "breakout": "Anchor",
    "rule": "All of your attributes become equal to your lowest attribute.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Jinxed",
    "type": "affliction",
    "family": "Magic",
    "cost": 3,
    "breakout": "Resonance",
    "rule": "Your rolls of 1 or 2 count as Fellstrikes.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Masked",
    "type": "affliction",
    "family": "Magic",
    "cost": 3,
    "breakout": "Vigilance",
    "rule": "You may only see spaces and targets in your space or adjacent spaces.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Ignited",
    "type": "affliction",
    "family": "Magic",
    "cost": 3,
    "breakout": "Endurance",
    "rule": "Whenever you utilize an Act, take 1d6 damage.",
    "forgeable": true,
    "enforce": {
      "bucket": "A",
      "kind": "onAct",
      "op": "selfRoll",
      "value": "1d6"
    }
  },
  {
    "name": "Worn",
    "type": "affliction",
    "family": "Magic",
    "cost": 3,
    "breakout": "Reflex",
    "rule": "You gain 1 rank of Fatigue.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Unlucky",
    "type": "affliction",
    "family": "Magic",
    "cost": 4,
    "breakout": "Resonance",
    "rule": "All your rolls become Unlucky.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Reapt",
    "type": "affliction",
    "family": "Magic",
    "cost": 4,
    "breakout": "Weaving",
    "rule": "You no longer gain Charges.",
    "forgeable": true,
    "enforce": {
      "bucket": "A",
      "kind": "passive",
      "op": "noChargeGain"
    }
  },
  {
    "name": "Harvested",
    "type": "affliction",
    "family": "Magic",
    "cost": 4,
    "breakout": "Spirit",
    "rule": "Any source that would heal your Vitality deals Base Damage instead.",
    "forgeable": true,
    "enforce": {
      "bucket": "A",
      "kind": "heal",
      "op": "invertToBase"
    }
  },
  {
    "name": "Accursed",
    "type": "affliction",
    "family": "Magic",
    "cost": 4,
    "breakout": "Sanctum",
    "rule": "You take damage equal to the damage you deal to others.",
    "forgeable": true,
    "enforce": {
      "bucket": "A",
      "kind": "onDealDamage",
      "op": "selfEqualDealt"
    }
  },
  {
    "name": "Enfeebled",
    "type": "affliction",
    "family": "Magic",
    "cost": 4,
    "breakout": "Temper",
    "rule": "Lose half your current Vitality.",
    "forgeable": true,
    "enforce": {
      "bucket": "A",
      "kind": "onApply",
      "op": "loseHalfCurrent"
    }
  },
  {
    "name": "Ensnared",
    "type": "affliction",
    "family": "Magic",
    "cost": 5,
    "breakout": "Might",
    "rule": "You may not utilize Acts.",
    "forgeable": true,
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "noAct"
    }
  },
  {
    "name": "Frozen",
    "type": "affliction",
    "family": "Magic",
    "cost": 5,
    "breakout": "Bearing",
    "rule": "You may only utilize Skill Rolls.",
    "forgeable": true,
    "enforce": {
      "bucket": "B",
      "kind": "gate",
      "op": "skillOnly"
    }
  },
  {
    "name": "Conjoined",
    "type": "affliction",
    "family": "Magic",
    "cost": 5,
    "breakout": "Sanctum",
    "rule": "Choose a target ally. Any damage dealt to that ally is also dealt to you.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Synchronized",
    "type": "affliction",
    "family": "Magic",
    "cost": 5,
    "breakout": "Trickery",
    "rule": "Each Affliction that afflicts an ally also afflicts you.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Plagued",
    "type": "affliction",
    "family": "Magic",
    "cost": 5,
    "breakout": "Sanctum",
    "rule": "Each Affliction that afflicts an enemy also afflicts you.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Strung",
    "type": "affliction",
    "family": "Magic",
    "cost": 5,
    "breakout": "Resonance",
    "rule": "Each spell that targets an enemy also targets an ally.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "reminder",
      "op": null
    }
  },
  {
    "name": "Attuned",
    "type": "effect",
    "cost": 3,
    "breakout": "",
    "rule": "Gain 1 Charge.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Restored",
    "type": "effect",
    "cost": 3,
    "breakout": "",
    "rule": "The target gains 1 Charge.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Transferred",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Take 1 Charge from the target.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Drained",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "The target loses 1 Charge.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Advanced",
    "type": "effect",
    "cost": 1,
    "breakout": "",
    "rule": "Move up to 3 spaces.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Pursued",
    "type": "effect",
    "cost": 1,
    "breakout": "",
    "rule": "Move adjacent to the target.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Repositioned",
    "type": "effect",
    "cost": 1,
    "breakout": "",
    "rule": "Move an ally up to 3 spaces.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Swapped",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Swap positions with the target.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Pushed",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Move the target 3 spaces directly away.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Pulled",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Move the target 3 spaces directly toward you.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Placed",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Move the target to an empty space within 3 spaces.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Gathered",
    "type": "effect",
    "cost": 3,
    "breakout": "",
    "rule": "Move each affected target 3 spaces toward a chosen space.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Scattered",
    "type": "effect",
    "cost": 3,
    "breakout": "",
    "rule": "Move each affected target 3 spaces from a chosen space.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Tracked",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Ignore your weapon's range.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Exposed",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Ignore the target's Durability.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Pierced",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Ignore the target's Resistance.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Sabotaged",
    "type": "effect",
    "cost": 3,
    "breakout": "",
    "rule": "Ignore the target's Armor Stance.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Crushed",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Deal your Base Damage again.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Refracted",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Another target takes half your Bonus Damage.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Bonus Damage",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Add 1d6 to your Bonus Damage.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Cleaved",
    "type": "effect",
    "cost": 3,
    "breakout": "",
    "rule": "deal your Base Damage to another target.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Siphoned",
    "type": "effect",
    "cost": 3,
    "breakout": "",
    "rule": "deal Base Damage and restore that much Vitality.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Mended",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Restore Vitality equal to your Spirit.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Dispelled",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Remove one Effect from the target.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Purged",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Remove one Affliction from the target.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Redirected",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Move one Effect from one target to another.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Reinforced",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Restore the target's Armor Stance.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Guarded",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Reduce the next damage the target takes before your next roll by your Power.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Warded",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Reduce the next Magic damage the target takes before your next roll by your Magic.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Bound",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Damage dealt to the target is dealt to you instead, until an attack lands against that target.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Obscured",
    "type": "effect",
    "cost": 3,
    "breakout": "",
    "rule": "Enemies cannot see or target the target until it deals damage or is dealt damage.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    },
    "appliedBy": [
      "a forged spell",
      "The Xenophis, the Umbra Aspect",
      "the Shadowmeld augmentation",
      "the Gloomcowl relic"
    ]
  },
  {
    "name": "Echoed",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "The next spell the target casts also targets themselves.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Manifested",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Create a temporary object, barrier, or terrain feature in an empty space that has a Vitality of 1.",
    "forgeable": true,
    "enforce": {
      "bucket": "C",
      "kind": "effect",
      "op": null
    }
  },
  {
    "name": "Lucky",
    "type": "effect",
    "cost": 2,
    "breakout": "",
    "rule": "Your roll is Lucky for this attack.",
    "forgeable": true,
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
