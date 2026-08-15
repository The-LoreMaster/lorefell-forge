'use strict';
/* Pins the shared combat formulas (data/combat.core.js) to the FellGuide canon tables and to
   the confirmed ruling that the weapon Bonus Damage reads at the FOE's level (party + offset),
   not the doc's stale flat-APL worked examples. Run: node scripts/checkCombatCore.js */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'data', 'combat.core.js'), 'utf8');
const g = {};
(function(){ const window = g; eval(src); })();
const C = g.LF_COMBAT;

let fails = 0;
function eq(label, got, want){
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a !== b){ console.error('FAIL ' + label + '  got ' + a + '  want ' + b); fails++; }
  else console.log('ok   ' + label + '  = ' + a);
}

// --- rating table (Building Crucibles) ---
eq('offset Minion',   C.offset('Minion'),   -2);
eq('offset Elite',    C.offset('Elite'),     0);
eq('offset Champion', C.offset('Champion'),  1);
eq('offset Epic',     C.offset('Epic'),      2);
eq('offset Forsaken', C.offset('Forsaken'),  3);
eq('share Minion',   C.share('Minion'),   0.5);
eq('share Forsaken', C.share('Forsaken'), 2.5);
eq('inf budget Minion',   C.infBudget('Minion'),   0);
eq('inf budget Elite',    C.infBudget('Elite'),    1);
eq('inf budget Champion', C.infBudget('Champion'), 2);
eq('inf budget Forsaken', C.infBudget('Forsaken'), 3);

// --- weapon bonus table (Arsenal) ---
eq('weaponBonus table', [1,2,3,4,5,6,7,8,9,10].map(C.weaponBonus), [1,1,3,3,6,6,10,10,15,15]);

// --- APL / pool / difficulty ---
eq('apl of the 8 (9,5,9,9,6,6,6,1)', C.apl([9,5,9,9,6,6,6,1]), 6);   // 51/8 = 6.375 -> 6
eq('apl empty', C.apl([]), 0);
eq('disruptions(7,5)', C.disruptions(7,5), 12);
eq('skillDifficulty(5)', C.skillDifficulty(5), 1);
eq('skillDifficulty(9)', C.skillDifficulty(9), 1);
eq('skillDifficulty(10)', C.skillDifficulty(10), 2);

// --- vitality: 7 x APL x share (canon worked numbers) ---
eq('vit Minion@6',   C.vitality(6, 'Minion'),   21);  // 7*6*0.5
eq('vit Champion@4', C.vitality(4, 'Champion'), 42);  // 7*4*1.5
eq('vit Forsaken@5', C.vitality(5, 'Forsaken'), 88);  // 7*5*2.5 = 87.5 -> 88
eq('vit Elite@5',    C.vitality(5, 'Elite'),    35);  // one Fell at level 5

// --- attributes: APL + offset, min 0 ---
eq('attr Minion@6',   C.attrValue(6, 'Minion'),   4);
eq('attr Champion@4', C.attrValue(4, 'Champion'), 5);
eq('attr Minion@1',   C.attrValue(1, 'Minion'),   0);  // 1-2 clamped to 0

// --- damage: the RULING is weaponBonus at the foe's level (party + offset) ---
// Masked Sworn, Juggernaut Minion (Power+Durability), APL 6 -> base 1+4=5, foeLevel 4 -> bonus 3
eq('Masked Sworn Minion@6', C.damage({Power:4,Durability:4}, 'Minion', 6, [], 'physical'),
   { base:5, bonus:3, type:'physical' });
// Charnel, Juggernaut Champion, APL 4 -> attr 5, base 6, foeLevel 5 -> bonus 6 (ruling; the doc
// example still reads the stale flat-APL 3 and should be updated to match)
eq('Charnel Champion@4', C.damage({Power:5,Durability:5}, 'Champion', 4, [], 'physical'),
   { base:6, bonus:6, type:'physical' });
// magic build picks Magic for base + type
eq('Adept magic@6', C.damage({Magic:4,Precision:4}, 'Elite', 6, [], 'physical'),
   { base:5, bonus:6, type:'magical' });   // Elite offset 0 -> foeLevel 6 -> bonus 6

// --- infusions apply only within the rating budget ---
// Minion budget 0: Mauling ignored
eq('Minion ignores Mauling', C.damage({Power:4,Durability:4}, 'Minion', 6, ['Mauling'], 'physical').bonus, 3);
// Elite budget 1: Mauling adds Power to bonus
eq('Elite applies Mauling', C.damage({Power:4}, 'Elite', 6, ['Mauling'], 'physical'),
   { base:5, bonus:10, type:'physical' });   // foeLevel 6 -> 6, + Power 4 = 10
// Brutal adds Power to base
eq('Elite applies Brutal', C.damage({Power:4}, 'Elite', 6, ['Brutal'], 'physical').base, 9); // 1+4 +4

console.log(fails ? ('\n' + fails + ' FAILED') : '\nall combat-core checks pass');
process.exit(fails ? 1 : 0);
