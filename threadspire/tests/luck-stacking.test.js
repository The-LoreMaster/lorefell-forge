/* Luck stacks (CANON.md, Luck; Nate, 2026-10-14). Each source of Lucky adds one die to the
 * roll and the roller keeps the highest. Each source of Unlucky adds one die and the roller
 * keeps the lowest. Lucky and Unlucky cancel one for one.
 *
 *   - luckDice, the one helper, in the sheet (FellGlass, and so ThreadSpire's sheet) and in
 *     ThreadSpire's own table, with the same answers in both.
 *   - Real roll sites: a Motivation-lucky skill plus a granted Lucky Roll on the table's skill
 *     roll, a granted Lucky Roll plus the Lucky Effect in a fight, Hunting on a roll already
 *     Lucky, and Afterimage plus a granted Lucky Roll on ThreadSpire's Evasion roll.
 *   - The sources Nate had wired on 2026-10-14: the combat card's skill roll counts the
 *     Motivation, the quick skill, attack and evade rolls count the Lucky Effect and the
 *     Unlucky Affliction, the quick evade counts Afterimage, Swift's second attack counts and
 *     spends a granted Lucky Roll, and the sheet's Evasion roll spends the grant it counts.
 *   - Favored, the Lucky Aspects and their second dice (bl-0a14luckwire): a level 10 weapon's
 *     rolls, Boon on any roll, Augury on an attack, Elude on an Evade, each "Add a second
 *     Lucky die" upgrade one more, the React that sends an Aspect to an ally, ThreadSpire's
 *     fighters row that hands it on, and one roll stacking three sources.
 *
 * Math.random is stubbed so every die is known.
 *
 *   node threadspire/tests/luck-stacking.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
let pass = 0, fail = 0;
function check(n, ok, d){ if (ok === true){ console.log('  PASS  ' + n); pass++; } else { console.log('  FAIL  ' + n + '\n          ' + d); fail++; } }

async function boot(file, url){
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'docs', file), 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url,
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => null; w.fetch = () => Promise.reject(new Error('offline')); w.console.error = () => {}; } });
  const w = dom.window;
  await new Promise((r) => w.addEventListener('load', r, { once:true }));
  await new Promise((r) => setTimeout(r, 300));
  return w;
}
/* the dice to come, as faces: each Math.random call yields the next face */
function dice(w, faces){ w.eval('window.__faces = ' + JSON.stringify(faces) + '; Math.random = function(){ var f = window.__faces.length ? window.__faces.shift() : 3; return (f - 1) / 6 + 0.01; };'); }

function helperCases(w, where){
  const js = (s) => w.eval(s);
  const ld = (l, u, faces) => { dice(w, faces); return JSON.parse(js('JSON.stringify(luckDice(' + l + ',' + u + '))')); };
  console.log('\nluckDice in ' + where);
  let r = ld(0, 0, [4, 6]);
  check('no Luck is one die', r.dice.length === 1 && r.n === 4 && r.net === 0 && r.note === '', JSON.stringify(r));
  r = ld(1, 0, [2, 5]);
  check('one Lucky source rolls 2 and keeps the highest', r.dice.join() === '2,5' && r.n === 5 && r.note === 'Lucky: 2 | 5', JSON.stringify(r));
  r = ld(2, 0, [3, 5, 2]);
  check('two Lucky sources roll 3 and keep the highest', r.dice.join() === '3,5,2' && r.n === 5 && r.net === 2 && r.note === 'Lucky x2: 3 | 5 | 2', JSON.stringify(r));
  r = ld(1, 1, [2, 6, 6]);
  check('one Lucky and one Unlucky roll 1', r.dice.length === 1 && r.n === 2 && r.net === 0 && /cancel/.test(r.note), JSON.stringify(r));
  r = ld(0, 2, [4, 1, 6]);
  check('two Unlucky sources roll 3 and keep the lowest', r.dice.join() === '4,1,6' && r.n === 1 && r.net === -2 && r.note === 'Unlucky x2: 4 | 1 | 6', JSON.stringify(r));
  r = ld(3, 1, [2, 4, 3]);
  check('three Lucky and one Unlucky are Lucky x2', r.dice.length === 3 && r.n === 4 && r.net === 2, JSON.stringify(r));
  dice(w, [5]);
  r = JSON.parse(js('JSON.stringify(luckDice(1, 0, 1))'));
  check('a die already thrown is the first of the set', r.dice.join() === '1,5' && r.n === 5, JSON.stringify(r));
}

(async () => {
  /* ---------- the sheet ---------- */
  const w = await boot('fellglass.html', 'https://example.test/fg.html?host=threadspire');
  const js = (s) => w.eval(s);
  helperCases(w, 'the sheet');

  console.log('\nthe table’s skill roll: a Motivation-lucky skill and a granted Lucky Roll');
  js(`window.__rolls = []; tableRoll = function(t, n, mods, total, note){ window.__rolls.push({ t:t, n:n, total:total, note:note }); };
      C.created = true; C.identity.motivation = 'The Precise';
      motSkills(motByName('The Precise')).forEach(function(n){ C.skills[n].mastery = 4; C.skills[n].rank = 0; });
      window._tsLuckyAt = 1000; window._tsLuckyUsed = 0;`);
  const sk = js(`motSkills(motByName('The Precise'))[0]`);
  check('the skill is Lucky by its Motivation', js(`skillIsLucky(${JSON.stringify(sk)})`) === true, 'not lucky');
  dice(w, [2, 5, 3]);
  js(`quickSkillRoll(${JSON.stringify(sk)})`);
  let roll = JSON.parse(js('JSON.stringify(window.__rolls.pop() || null)'));
  check('both sources: three dice, the highest kept', roll && roll.n === 5 && roll.note === 'Lucky x2 (Motivation and granted) 2 | 5 | 3', JSON.stringify(roll));
  check('the granted Lucky Roll is spent', js('tsLuckyWaits()') === false, 'still waiting');
  dice(w, [2, 4, 6]);
  js(`quickSkillRoll(${JSON.stringify(sk)})`);
  roll = JSON.parse(js('JSON.stringify(window.__rolls.pop() || null)'));
  check('the Motivation alone: two dice, as before', roll && roll.n === 4 && roll.note === 'Lucky 2 | 4', JSON.stringify(roll));
  js(`window._tsLuckyAt = 2000;`);
  dice(w, [1, 3]);
  js(`quickSkillRoll('Logic')`);
  roll = JSON.parse(js('JSON.stringify(window.__rolls.pop() || null)'));
  check('a granted Lucky Roll alone: two dice, as before', roll && roll.n === 3 && roll.note === 'Lucky Roll (granted) 1 | 3', JSON.stringify(roll));

  console.log('\nin a fight: the granted mark and the Lucky Effect');
  js(`CUR_WIX_ID = 'fell-1'; COMBAT = { active:true, round:1, fighters:[{ charId:'fell-1', luck:'lucky' }] };
      window._tsLuckyAt = 3000; window._tsLuckyUsed = 0; C.effects = [{ name:'Lucky' }]; C.afflictions = [];`);
  check('two Lucky sources are counted', js('JSON.stringify(cbMyLuckCount())') === JSON.stringify({ lucky:2, unlucky:0, granted:true, mot:false, favored:false, asp:[] }), js('JSON.stringify(cbMyLuckCount())'));
  check('the banner says Lucky x2', /Lucky roll x2/.test(js('cbLuckBanner()')), js('cbLuckBanner()'));
  dice(w, [3, 2, 6]);
  let v = js('cbLuckRollD6()');
  check('the attack die rolls 3 and keeps the highest', v === 6 && js('JSON.stringify(window._cbRollDice)') === '[3,2,6]' && js('window._cbRollNet') === 2, v + ' ' + js('JSON.stringify(window._cbRollDice)'));
  check('the grant is spent by that roll', js('window._tsLuckyUsed') === 3000, js('window._tsLuckyUsed'));
  js(`C.afflictions = [{ name:'Unlucky' }];`);
  dice(w, [4, 1]);
  v = js('cbLuckRollD6()');
  check('the Lucky Effect and the Unlucky Affliction cancel: one die', v === 4 && js('window._cbRollDice') === null && js('window._cbRollNet') === 0, v + ' ' + js('JSON.stringify(window._cbRollDice)'));
  js(`C.effects = []; C.afflictions = [{ name:'Unlucky' }];`);
  dice(w, [4, 1]);
  v = js('cbLuckRollD6()');
  check('the Unlucky Affliction alone: two dice, the lowest kept', v === 1 && js('JSON.stringify(window._cbRollDice)') === '[4,1]', v);

  console.log('\nHunting on a roll already thrown');
  /* the Hunting step in cbDeclare, run on its own with a known roll */
  const hunt = (rollDice, net, face, faces) => {
    dice(w, faces);
    return js(`(function(){ window._cbRollDice = ${JSON.stringify(rollDice)}; window._cbRollNet = ${net}; var roll = ${face}, infNotes = [];
      ${js('cbDeclare.toString()').match(/var _dice=window\._cbRollDice[\s\S]*?\n    else \{ var _hb[\s\S]*?\}\n/)[0]}
      return JSON.stringify({ roll:roll, note:infNotes[0] }); })()`);
  };
  let h = JSON.parse(hunt([3, 2, 6], 2, 6, [5]));
  check('Lucky x2 plus Hunting: a fourth die, highest kept', h.roll === 6 && h.note === 'Hunting adds a Lucky die: 3 | 2 | 6 | 5, keeping 6.', JSON.stringify(h));
  h = JSON.parse(hunt(null, 0, 2, [4]));
  check('a plain roll plus Hunting: two dice, as before', h.roll === 4 && h.note === 'Hunting makes the attack a Lucky Roll: 2 | 4, keeping 4.', JSON.stringify(h));
  h = JSON.parse(hunt([5, 2], -1, 2, []));
  check('Unlucky plus Hunting cancel: the first die stands, as before', h.roll === 5 && /the first stands, 5/.test(h.note), JSON.stringify(h));
  h = JSON.parse(hunt([5, 3, 1], -2, 1, []));
  check('Unlucky x2 plus Hunting: one Unlucky die falls away', h.roll === 3 && /cancels one Unlucky die/.test(h.note), JSON.stringify(h));

  console.log('\nthe sources wired on 2026-10-14');
  const lastRoll = () => JSON.parse(js('JSON.stringify(window.__rolls.pop() || null)'));
  /* 1. the combat card's skill roll counts the Motivation */
  js(`COMBAT = { active:true, round:4, fighters:[{ charId:'fell-1', luck:'' }] }; C.effects = []; C.afflictions = [];
      window.__actEntry = cbActEntry; cbActEntry = function(){ return { src:'skills' }; };
      ['cbAct','cbSkillSel'].forEach(function(id){ var e = document.createElement('input'); e.id = id; document.body.appendChild(e); });
      document.getElementById('cbAct').value = 'Skill roll'; document.getElementById('cbSkillSel').value = ${JSON.stringify(sk)};`);
  dice(w, [2, 4]);
  v = js('cbLuckRollD6()');
  check('combat card skill roll: a Motivation-lucky skill rolls 2, highest kept', v === 4 && js('JSON.stringify(window._cbRollDice)') === '[2,4]', v + ' ' + js('JSON.stringify(window._cbRollDice)'));
  js(`C.effects = [{ name:'Lucky' }];`);
  dice(w, [2, 4, 5]);
  v = js('cbLuckRollD6()');
  check('combat card skill roll: Motivation plus the Lucky Effect roll 3', v === 5 && js('JSON.stringify(window._cbRollDice)') === '[2,4,5]', v + ' ' + js('JSON.stringify(window._cbRollDice)'));
  js(`document.getElementById('cbSkillSel').value = 'Logic'; C.effects = [];`);
  dice(w, [2, 4]);
  v = js('cbLuckRollD6()');
  check('combat card skill roll: a skill outside the Motivation is one die', v === 2 && js('window._cbRollDice') === null, String(v));
  js(`cbActEntry = window.__actEntry; ['cbAct','cbSkillSel'].forEach(function(id){ document.getElementById(id).remove(); });`);

  /* 2. the quick rolls count the Lucky Effect and the Unlucky Affliction */
  js(`window._tsLuckyAt = 4000; window._tsLuckyUsed = 0; C.effects = [{ name:'Lucky' }]; C.afflictions = [];`);
  dice(w, [1, 2, 6 - 1]);
  js(`quickSkillRoll('Logic')`);
  roll = lastRoll();
  check('quick skill roll: a grant and the Lucky Effect roll 3', roll && roll.n === 5 && roll.note === 'Lucky x2 (granted and Lucky Effect) 1 | 2 | 5', JSON.stringify(roll));
  js(`C.effects = []; C.afflictions = [{ name:'Unlucky' }];`);
  js(`C.weapons = [{ tree:Object.keys(WEAPON_DB)[0], level:1, formIdx:0, equipped:true }];`);
  dice(w, [5, 2]);
  js(`quickAttackRoll(0)`);
  roll = lastRoll();
  check('quick attack roll: the Unlucky Affliction rolls 2, lowest kept', roll && roll.t === 'attack' && roll.n === 2 && /Unlucky 5 \| 2/.test(roll.note), JSON.stringify(roll));
  const evade = () => js(`window.dispatchEvent(new MessageEvent('message', { data:{ type:'ts-quick-roll', kind:'evade' } }))`);
  js(`C.armor = C.armor || {}; C.armor.augs = []; window._afterRound = undefined;`);
  dice(w, [5, 3]);
  evade();
  roll = lastRoll();
  check('quick evade: the Unlucky Affliction rolls 2, lowest kept', roll && roll.t === 'evade' && roll.n === 3 && roll.note === 'Unlucky 5 | 3', JSON.stringify(roll));

  /* 3. the quick evade counts Afterimage, once a round */
  js(`C.afflictions = []; C.armor.augs = ['Afterimage']; COMBAT.round = 5;`);
  dice(w, [2, 4]);
  evade();
  roll = lastRoll();
  check('quick evade: Afterimage rolls 2, highest kept', roll && roll.n === 4 && roll.note === 'Lucky (Afterimage) 2 | 4', JSON.stringify(roll));
  dice(w, [2, 4]);
  evade();
  roll = lastRoll();
  check('quick evade: Afterimage is spent for the round', roll && roll.n === 2 && roll.note === '', JSON.stringify(roll));
  js(`C.effects = [{ name:'Lucky' }]; COMBAT.round = 6;`);
  dice(w, [2, 1, 4]);
  evade();
  roll = lastRoll();
  check('quick evade: Afterimage and the Lucky Effect roll 3', roll && roll.n === 4 && roll.note === 'Lucky x2 (Afterimage and Lucky Effect) 2 | 1 | 4', JSON.stringify(roll));

  /* 5. the sheet's Evasion roll spends the grant it counts */
  js(`C.effects = []; C.armor.augs = []; COMBAT = { active:true, round:7, fighters:[{ charId:'fell-1', luck:'lucky' }] };
      window._tsLuckyAt = 5000; window._tsLuckyUsed = 0; window._evaRolls = {};`);
  dice(w, [1, 6]);
  js(`cbRollEva('foe-9', 3, 2)`);
  const er = JSON.parse(js(`JSON.stringify(window._evaRolls['foe-9'])`));
  check('cbRollEva: the granted Lucky Roll rolls 2, highest kept', er.r === 6 && er.dice.join() === '1,6' && er.lk === 'Lucky', JSON.stringify(er));
  check('cbRollEva: and the grant is spent', js('window._tsLuckyUsed') === 5000 && js('cbMyLuckCount().granted') === false, js('window._tsLuckyUsed'));

  /* ---------- Favored, the Lucky Aspects and their second dice ---------- */
  console.log('\nFavored: a level 10 weapon’s attacks, abilities and spells are Lucky');
  js(`COMBAT = { active:true, round:8, fighters:[{ charId:'fell-1', luck:'' }, { charId:'fell-2', name:'Brin', luck:'' }] };
      window._tsLuckyAt = 0; window._tsLuckyUsed = 0; C.effects = []; C.afflictions = []; C.armor.augs = []; window._aspSpent = {}; window._aspUse = null;
      C.weapons = [{ tree:Object.keys(WEAPON_DB)[0], level:10, formIdx:0, equipped:true, abilities:[], infusions:[] }];`);
  check('a level 10 weapon is Favored, a level 9 is not', js('weaponFavored(C.weapons[0])') === true && js(`weaponFavored({ tree:C.weapons[0].tree, level:9 })`) === false, 'wrong');
  dice(w, [2, 5]);
  js(`quickAttackRoll(0)`);
  roll = lastRoll();
  check('quick attack with a Favored weapon: two dice, highest kept', roll && roll.n === 5 && /Lucky \(Favored\) 2 \| 5/.test(roll.note), JSON.stringify(roll));
  js(`window.__actEntry = cbActEntry; cbActEntry = function(nm){ return nm === 'Spell' ? { kind:'weapon', src:weaponName(C.weapons[0]), nm:'Spell' } : { kind:'standard', src:'charge' }; };
      var _a = document.createElement('input'); _a.id = 'cbAct'; document.body.appendChild(_a); _a.value = 'Spell';`);
  check('the card counts Favored on an ability made with that weapon', js('JSON.stringify(cbMyLuckCount(true))') === JSON.stringify({ lucky:1, unlucky:0, granted:false, mot:false, favored:true, asp:[] }), js('JSON.stringify(cbMyLuckCount(true))'));
  dice(w, [1, 4]);
  v = js('cbLuckRollD6()');
  check('the card’s roll with a Favored weapon rolls 2, highest kept', v === 4 && js('JSON.stringify(window._cbRollDice)') === '[1,4]', v + ' ' + js('JSON.stringify(window._cbRollDice)'));
  js(`document.getElementById('cbAct').value = 'Charge';`);
  check('an Act made without the weapon is not Favored', js('cbMyLuckCount(true).lucky') === 0, js('JSON.stringify(cbMyLuckCount(true))'));
  js(`C.afflictions = [{ name:'Unlucky' }]; document.getElementById('cbAct').value = 'Spell';`);
  dice(w, [6, 2]);
  v = js('cbLuckRollD6()');
  check('Favored and the Unlucky Affliction cancel: one die', v === 6 && js('window._cbRollDice') === null, String(v));
  js(`C.afflictions = []; C.weapons[0].level = 9;`);
  dice(w, [2, 5]);
  js(`quickAttackRoll(0)`);
  roll = lastRoll();
  check('a level 9 weapon rolls one die', roll && roll.n === 2 && !/Lucky/.test(roll.note), JSON.stringify(roll));

  /* Favored's reach (Nate, 2026-10-14): "all attacks from that weapon only, including
     abilities and spells." A second weapon in the other hand is not Favored. */
  console.log('\nFavored reaches that weapon only');
  js(`C.afflictions = []; window._aspSpent = {}; COMBAT.fighters[0].asp = [];
      var _trees = Object.keys(WEAPON_DB).filter(function(t){ return WEAPON_DB[t].forms[0] !== WEAPON_DB[Object.keys(WEAPON_DB)[0]].forms[0]; });
      C.weapons = [{ tree:Object.keys(WEAPON_DB)[0], level:10, formIdx:0, equipped:true, abilities:[], infusions:[] },
                   { tree:_trees[0], level:5, formIdx:0, equipped:true, abilities:[], infusions:[] }];`);
  check('two weapons in hand, different names, only the first Favored', js('weaponName(C.weapons[0]) !== weaponName(C.weapons[1]) && weaponFavored(C.weapons[0]) && !weaponFavored(C.weapons[1])') === true, 'setup');
  dice(w, [2, 5]);
  js(`quickAttackRoll(1)`);
  roll = lastRoll();
  check('quick attack with the other weapon: one die, no Favored', roll && roll.n === 2 && !/Favored|Lucky/.test(roll.note), JSON.stringify(roll));
  dice(w, [2, 5]);
  js(`quickAttackRoll(0)`);
  roll = lastRoll();
  check('while the level 10 weapon’s own attack is still Lucky (Favored)', roll && roll.n === 5 && /Lucky \(Favored\)/.test(roll.note), JSON.stringify(roll));
  js(`cbActEntry = function(nm){ return nm === 'Spell' ? { kind:'weapon', src:weaponName(C.weapons[1]), nm:'Spell' } : (nm === 'Basic attack' ? { kind:'weapon', src:weaponName(C.weapons[1]), nm:'Basic attack' } : { kind:'standard', src:'charge' }); };
      document.getElementById('cbAct').value = 'Spell';`);
  check('the card: an ability or spell made with the other weapon is not Favored', js('JSON.stringify(cbMyLuckCount(true))') === JSON.stringify({ lucky:0, unlucky:0, granted:false, mot:false, favored:false, asp:[] }), js('JSON.stringify(cbMyLuckCount(true))'));
  js(`document.getElementById('cbAct').value = 'Basic attack';`);
  check('the card: the other weapon’s standard attack is not Favored', js('cbMyLuckCount(true).favored') === false && js('cbMyLuckCount(true).lucky') === 0, js('JSON.stringify(cbMyLuckCount(true))'));
  js(`cbActEntry = function(nm){ return { kind:'weapon', src:weaponName(C.weapons[0]), nm:nm }; };`);
  check('the card: the level 10 weapon’s standard attack is', js('cbMyLuckCount(true).favored') === true, js('JSON.stringify(cbMyLuckCount(true))'));
  js(`C.weapons[1] = { tree:C.weapons[0].tree, level:3, formIdx:0, equipped:true, abilities:[], infusions:[] }; C.weapons[0].equipped = false;
      cbActEntry = function(nm){ return { kind:'weapon', src:weaponName(C.weapons[1]), nm:nm }; };`);
  check('a level 10 weapon left in the pack does not lend Favored to a lesser one of its name in hand', js('cbMyLuckCount(true).favored') === false, js('JSON.stringify(cbMyLuckCount(true))'));
  /* back as the sections below expect it: one level 9 weapon, the card on its Spell */
  js(`C.weapons = [{ tree:Object.keys(WEAPON_DB)[0], level:9, formIdx:0, equipped:true, abilities:[], infusions:[] }];
      cbActEntry = function(nm){ return nm === 'Spell' ? { kind:'weapon', src:weaponName(C.weapons[0]), nm:'Spell' } : { kind:'standard', src:'charge' }; };
      document.getElementById('cbAct').value = 'Spell';`);

  console.log('\nthe Lucky Aspects on this Fell’s row: Boon, Augury, Elude');
  const giveAsp = (list) => js(`COMBAT.fighters[0].asp = ${JSON.stringify(list)}; window._aspSpent = {};`);
  giveAsp([{ id:'fell-2:8:Boon', nm:'Boon', on:'any', dice:1, to:'fell-1', round:8 }]);
  dice(w, [1, 3]);
  js(`quickSkillRoll('Logic')`);
  roll = lastRoll();
  check('Boon makes a skill roll Lucky: two dice, highest kept', roll && roll.n === 3 && roll.note === 'Lucky (Boon) 1 | 3', JSON.stringify(roll));
  check('Boon is spent by that roll', js(`!!window._aspSpent['fell-2:8:Boon']`) === true && js(`cbAspLuckFor('skill').length`) === 0, js('JSON.stringify(window._aspSpent)'));
  check('the spent Aspect rides to the table in the gear', js(`cbGearSnap().aspSpent.indexOf('fell-2:8:Boon') >= 0`) === true, js('JSON.stringify(cbGearSnap().aspSpent)'));
  giveAsp([{ id:'fell-2:8:Augury', nm:'Augury', on:'attack', dice:1, to:'fell-1', round:8 }]);
  check('Augury does not touch an Evade or a skill roll', js(`cbAspLuckFor('evade').length`) === 0 && js(`cbAspLuckFor('skill').length`) === 0, 'counted');
  dice(w, [2, 6]);
  js(`quickAttackRoll(0)`);
  roll = lastRoll();
  check('Augury makes the attack Lucky: two dice, highest kept', roll && roll.n === 6 && /Lucky \(Augury\) 2 \| 6/.test(roll.note), JSON.stringify(roll));
  giveAsp([{ id:'fell-2:8:Augury', nm:'Augury', on:'attack', dice:1, to:'fell-1', round:7 }]);
  check('an Aspect from another round does not count', js(`cbAspLuckFor('attack').length`) === 0, 'counted');
  giveAsp([{ id:'fell-2:8:Elude', nm:'Elude', on:'evade', dice:1, to:'fell-1', round:8 }]);
  check('Elude does not touch an attack', js(`cbAspLuckFor('attack').length`) === 0, 'counted');
  dice(w, [3, 5]);
  js(`window._evaRolls = {}; cbRollEva('foe-3', 4, 2)`);
  let er2 = JSON.parse(js(`JSON.stringify(window._evaRolls['foe-3'])`));
  check('Elude makes the Evasion roll Lucky: two dice, highest kept', er2.r === 5 && er2.dice.join() === '3,5' && er2.lk === 'Lucky', JSON.stringify(er2));
  check('Elude is spent by that roll', js(`!!window._aspSpent['fell-2:8:Elude']`) === true, js('JSON.stringify(window._aspSpent)'));
  giveAsp([{ id:'fell-2:8:Elude', nm:'Elude', on:'evade', dice:2, to:'fell-1', round:8 }]);
  dice(w, [1, 2, 4]);
  evade();
  roll = lastRoll();
  check('Elude with its second Lucky die: three dice, highest kept', roll && roll.n === 4 && roll.note === 'Lucky x2 (Elude and Elude’s second die) 1 | 2 | 4', JSON.stringify(roll));
  giveAsp([{ id:'fell-2:8:Boon', nm:'Boon', on:'any', dice:2, to:'fell-1', round:8 }]);
  check('the banner counts Boon with its second die', /Lucky roll x2/.test(js('cbLuckBanner()')), js('cbLuckBanner()'));

  console.log('\nthe "Add a second Lucky die" upgrades, at the charge that reaches them');
  const lbDice = (lb, charge) => js(`(function(){ C.charge = ${charge}; return aspectLuckDice(${JSON.stringify(lb)}); })()`);
  const pick = (type, part) => js(`aspectOf(${JSON.stringify(type)})[${JSON.stringify(part)}].findIndex(function(t){ return /^Add a second Lucky die/.test(t); })`);
  const boonB = pick('The Drakelith', 'branch'), augC = pick('The Aerostrix', 'crown'), eluC = pick('The Slipfang', 'crown');
  check('the second die is Boon’s Branch and the Crown of Augury and Elude', boonB >= 0 && augC >= 0 && eluC >= 0, [boonB, augC, eluC].join());
  check('Boon at Familiar form is one die', lbDice({ type:'The Drakelith', level:2 }, 1) === 1, 'wrong');
  check('Boon with no charge resolves nothing', lbDice({ type:'The Drakelith', level:2 }, 0) === 0, 'wrong');
  check('Boon’s Branch second die at Charge 2: two dice', lbDice({ type:'The Drakelith', level:4, branchPick:boonB }, 2) === 2, 'wrong');
  check('Boon’s Branch second die at Charge 1: the Initial only', lbDice({ type:'The Drakelith', level:4, branchPick:boonB }, 1) === 1, 'wrong');
  check('Boon’s other Branch adds no die', lbDice({ type:'The Drakelith', level:4, branchPick:1 - boonB }, 3) === 1, 'wrong');
  check('Augury’s Crown second die at Charge 3: two dice', lbDice({ type:'The Aerostrix', level:7, branchPick:0, crownPick:augC }, 3) === 2, 'wrong');
  check('Augury’s Crown second die at Charge 2: one die', lbDice({ type:'The Aerostrix', level:7, branchPick:0, crownPick:augC }, 2) === 1, 'wrong');
  check('Elude’s Crown at the Everpresent Bond, no charge: two dice', lbDice({ type:'The Slipfang', level:10, branchPick:0, crownPick:eluC }, 0) === 2, 'wrong');
  check('an Aspect that is not Lucky adds nothing', lbDice({ type:'The Boreal', level:10 }, 3) === 0, 'wrong');

  console.log('\nthe React that sends an Aspect');
  js(`C.lorebounds = [{ type:'The Drakelith', level:4, branchPick:${boonB} }]; C.charge = 2;
      window.__post = []; postToVelo = function(m){ window.__post.push(m); }; applyCombatMode = function(){};
      var _r = document.createElement('select'); _r.id = 'cbReact'; _r.innerHTML = '<option value="Boon">Boon</option>'; document.body.appendChild(_r);
      var _t = document.createElement('select'); _t.id = 'cbAspTarget'; _t.innerHTML = '<option value="Brin">Brin</option><option value="__self__">Yourself</option>'; document.body.appendChild(_t);
      window._declPayload = { type:'combat-declare', charId:'fell-1' }; COMBAT.fighters[0].asp = []; window._aspSpent = {};`);
  js(`sendReact()`);
  const use = JSON.parse(js('JSON.stringify(window._aspUse)'));
  check('Boon on an ally: the use names the ally, two dice with the Branch', use && use.to === 'fell-2' && use.nm === 'Boon' && use.on === 'any' && use.dice === 2 && use.round === 8, JSON.stringify(use));
  check('the use rides in the gear to the table', js('JSON.stringify(cbGearSnap().asp)') === JSON.stringify(use), js('JSON.stringify(cbGearSnap().asp)'));
  check('an ally’s Aspect does not make this Fell’s own roll Lucky', js(`cbAspLuckFor('skill').length`) === 0, 'counted');
  js(`C.lorebounds = [{ type:'The Aerostrix', level:7, branchPick:0, crownPick:${augC} }]; C.charge = 3;
      document.getElementById('cbReact').innerHTML = '<option value="Augury">Augury</option>'; document.getElementById('cbAspTarget').value = '__self__';
      window._declPayload = { type:'combat-declare', charId:'fell-1' };`);
  js(`sendReact()`);
  check('Augury on itself at Corsair form counts on its own attack, two dice', js(`JSON.stringify(cbAspLuckFor('attack').map(function(a){ return [a.nm, a.dice]; }))`) === '[["Augury",2]]', js(`JSON.stringify(window._aspUse)`));
  js(`window._aspUse = null; C.lorebounds = []; ['cbReact','cbAspTarget'].forEach(function(id){ document.getElementById(id).remove(); });`);

  console.log('\none roll stacking three sources: Favored, Augury and Boon');
  js(`C.weapons[0].level = 10; C.effects = []; C.afflictions = [];`);
  giveAsp([{ id:'fell-2:8:Augury', nm:'Augury', on:'attack', dice:1, to:'fell-1', round:8 }, { id:'fell-3:8:Boon', nm:'Boon', on:'any', dice:1, to:'fell-1', round:8 }]);
  check('the card counts three Lucky sources', js('cbMyLuckCount(true).lucky') === 3, js('JSON.stringify(cbMyLuckCount(true))'));
  dice(w, [2, 1, 5, 3]);
  js(`quickAttackRoll(0)`);
  roll = lastRoll();
  check('quick attack: four dice, highest kept', roll && roll.n === 5 && /Lucky x3 \(Favored, Augury and Boon\) 2 \| 1 \| 5 \| 3/.test(roll.note), JSON.stringify(roll));
  check('both Aspects are spent', js(`cbAspLuckFor('attack').length`) === 0, 'still there');
  giveAsp([{ id:'fell-2:9:Augury', nm:'Augury', on:'attack', dice:1, to:'fell-1', round:8 }, { id:'fell-3:9:Boon', nm:'Boon', on:'any', dice:1, to:'fell-1', round:8 }]);
  js(`C.afflictions = [{ name:'Unlucky' }];`);
  dice(w, [4, 2, 6]);
  v = js('cbLuckRollD6()');
  check('the card: three Lucky and the Unlucky Affliction are Lucky x2, three dice', v === 6 && js('JSON.stringify(window._cbRollDice)') === '[4,2,6]' && js('window._cbRollNet') === 2, v + ' ' + js('JSON.stringify(window._cbRollDice)'));
  js(`C.afflictions = []; cbActEntry = window.__actEntry; document.getElementById('cbAct').remove();`);

  /* ---------- ThreadSpire's own table ---------- */
  const t = await boot('threadspire.html', 'https://example.test/threadspire.html');
  helperCases(t, 'ThreadSpire');
  const tj = (s) => t.eval(s);
  console.log('\nThreadSpire’s Evasion roll: Afterimage and a granted Lucky Roll');
  tj(`S.role = 'lm'; S.round = 1; S.log = [];
      S.scene = { foes:[{ id:'foe-1', name:'Reaver', attrs:{} }], fell:[{ id:'p1', charId:'ch-1', name:'Astra', attrs:{ Evasion:2 } }], lucky1:{ 'p:ch-1':{ at:1, round:1 } }, afterimg:{} };
      kitHasAug = function(id, n){ return n === 'Afterimage'; }; kitCheckMiss = function(){}; combatPublish = function(){}; paintLmStrip = function(){}; applyRemoteState = function(){};`);
  dice(t, [2, 3, 5]);
  tj(`tsRollEva('p1', 'foe-1')`);
  const ev = JSON.parse(tj(`JSON.stringify(S.scene.eva[tsEvaKey('p1', 'foe-1')])`));
  const line = tj(`(S.log[S.log.length - 1] || {}).html || ''`);
  check('two Lucky sources: three dice, highest kept', ev.r === 5 && ev.total === 7, JSON.stringify(ev));
  check('the log shows every die', /Afterimage and a granted Lucky Roll, Lucky x2: 2 \| 3 \| 5\./.test(line), line);
  check('the grant is spent', !tj(`luckGranted('p:ch-1')`), 'grant still there');

  console.log('\nThreadSpire’s Swift attack: Hunting and a granted Lucky Roll');
  tj(`S.log = []; S.scene.lucky1 = { 'p:ch-1':{ at:2, round:1 } }; S.scene.landed = {};
      declareFor = function(){ return { act:'x' }; }; fellByCharId = function(){ return { name:'Astra', affs:[] }; };
      dclFoe = function(){ return S.scene.foes[0]; }; kitAtkWeapon = function(){ return { infs:['Hunting'] }; };
      kitAttr = function(){ return 1; }; kitToHit = function(){ return { hit:false, line:'Misses' }; }; resolveOnFoe = function(){};`);
  dice(t, [1, 2, 4]);
  tj(`kitSwift('ch-1')`);
  const sw = tj(`(S.log[S.log.length - 1] || {}).html || ''`);
  check('Hunting and a grant: three dice, highest kept', /rolls 4 \(Hunting and a granted Lucky Roll, Lucky x2: 1 \| 2 \| 4\)/.test(sw), sw);
  check('Swift spends the grant', !tj(`luckGranted('p:ch-1')`), 'grant still there');
  tj(`S.log = []; S.scene.landed = {}; S.scene.lucky1 = { 'p:ch-1':{ at:3, round:1 } }; kitAtkWeapon = function(){ return {}; };
      fellByCharId = function(){ return { name:'Astra', affs:['Unlucky'] }; };`);
  dice(t, [2, 6]);
  tj(`kitSwift('ch-1')`);
  const sw2 = tj(`(S.log[S.log.length - 1] || {}).html || ''`);
  check('a grant and Unlucky cancel: one die', /rolls 2 \(a granted Lucky Roll and Unlucky cancel: one die\)/.test(sw2), sw2);

  console.log('\nThreadSpire hands an Aspect on, and counts it on its own rolls');
  tj(`S.round = 2; S.scene.lucky1 = {}; S.scene.aspSpent = {}; S.scene.afterimg = {}; S.log = [];
      kitHasAug = function(){ return false; };
      S.declares = [{ charId:'ch-2', act:'x', round:2, gear:{ asp:{ id:'ch-2:2:Elude', nm:'Elude', on:'evade', dice:2, to:'ch-1', round:2 } } },
                    { charId:'ch-1', act:'y', round:2, gear:{ aspSpent:[] } }];
      S.party = []; partyLoad = function(){};
      declareFor = function(cid){ var h = null; (S.declares || []).forEach(function(x){ if (x.charId === cid) h = x; }); return h || { act:'x' }; };`);
  const row = JSON.parse(tj(`JSON.stringify(combatFighters().filter(function(f){ return f.charId === 'ch-1'; })[0])`));
  check('the fighters row carries the Aspect to the Fell it was used on', row && row.asp && row.asp.length === 1 && row.asp[0].nm === 'Elude' && row.asp[0].dice === 2, JSON.stringify(row));
  check('Elude is not handed on to an attack', tj(`tsAspFor('ch-1', 'attack').length`) === 0, 'counted');
  dice(t, [1, 2, 4]);
  tj(`tsRollEva('p1', 'foe-1')`);
  const ev2 = JSON.parse(tj(`JSON.stringify(S.scene.eva[tsEvaKey('p1', 'foe-1')])`));
  const line2 = tj(`(S.log[S.log.length - 1] || {}).html || ''`);
  check('Elude and its second die on the table’s Evasion roll: three dice, highest kept', ev2.r === 4 && /Elude and Elude’s second die, Lucky x2: 1 \| 2 \| 4\./.test(line2), JSON.stringify(ev2) + ' ' + line2);
  check('the table spends it, and the row no longer carries it', tj(`!!S.scene.aspSpent['ch-2:2:Elude']`) && tj(`tsAspFor('ch-1').length`) === 0, 'still there');
  tj(`S.scene.aspSpent = {}; S.declares[1].gear.aspSpent = ['ch-2:2:Elude'];`);
  check('an Aspect the sheet spent is not handed on again', tj(`tsAspFor('ch-1').length`) === 0, 'handed on');
  tj(`S.log = []; S.scene.landed = {}; S.scene.lucky1 = {};
      S.declares = [{ charId:'ch-2', act:'x', round:2, gear:{ asp:{ id:'ch-2:2:Augury', nm:'Augury', on:'attack', dice:1, to:'ch-1', round:2 } } },
                    { charId:'ch-3', act:'z', round:2, gear:{ asp:{ id:'ch-3:2:Boon', nm:'Boon', on:'any', dice:1, to:'ch-1', round:2 } } }];
      kitAtkWeapon = function(){ return { favored:true }; }; fellByCharId = function(){ return { name:'Astra', affs:[] }; };`);
  dice(t, [1, 2, 3, 5]);
  tj(`kitSwift('ch-1')`);
  const sw3 = tj(`(S.log[S.log.length - 1] || {}).html || ''`);
  check('Swift with Favored, Augury and Boon: four dice, highest kept', /rolls 5 \(Favored, Augury and Boon, Lucky x3: 1 \| 2 \| 3 \| 5\)/.test(sw3), sw3);
  check('Swift spends both Aspects', tj(`!!S.scene.aspSpent['ch-2:2:Augury'] && !!S.scene.aspSpent['ch-3:2:Boon']`) === true, 'not spent');
  tj(`S.log = []; S.scene.landed = {}; S.declares = []; kitAtkWeapon = function(){ return { favored:true }; };`);
  dice(t, [2, 6]);
  tj(`kitSwift('ch-1')`);
  const sw4 = tj(`(S.log[S.log.length - 1] || {}).html || ''`);
  check('Swift with a Favored weapon alone: two dice, highest kept', /rolls 6 \(Favored, a Lucky Roll: 2 \| 6\)/.test(sw4), sw4);

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
