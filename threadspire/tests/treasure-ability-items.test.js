/* The Treasure Phase hands over Acts off the fallen as Potions, Tablets, Traps and Runes.
 *
 * Three ends of one pipe, each loaded for real:
 *   - ThreadSpire's Treasure card offers the defeated foes' Acts at the row's tier, leads
 *     with the right Ability Item (a spell in a Potion or Rune, a strike in a Tablet or Trap), and
 *     asks the backend to give it (TS_GIVE_UTILITY).
 *   - FellGlass reads the given row as its Ability Item: the Act's words, its own rule,
 *     and its way of resolving in a fight.
 *   - The backend's save keeps a given row that a sheet loaded before the give never saw.
 *
 *   node threadspire/tests/treasure-ability-items.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
let pass = 0, fail = 0;
function check(n, ok, d){ if (ok === true){ console.log('  PASS  ' + n); pass++; } else { console.log('  FAIL  ' + n + '\n          ' + d); fail++; } }

async function boot(file, url){
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'docs', file), 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:url,
    beforeParse(w){
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.fetch = () => Promise.reject(new Error('offline'));
      w.matchMedia = w.matchMedia || (() => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
      w.console.error = () => {};
    } });
  await new Promise((r) => dom.window.addEventListener('load', r, { once:true }));
  await new Promise((r) => setTimeout(r, 300));
  return dom.window;
}

(async () => {
  console.log('\nThreadSpire: the Treasure card gives an Act off the fallen');
  const w = await boot('threadspire.html', 'https://example.test/threadspire.html');
  const js = (s) => w.eval(s);
  js(`S.role = 'lm'; S.keeper = false; S.party = [{ charId:'c1', charName:'Wren' }, { name:'Tobin' }];
      S.scene = S.scene || {}; S.scene.foes = [
        { id:'f1', side:'foe', name:'Ash Witch', family:'Magic', maxVit:5, curVit:0, abilities:[{ name:'Cinder Hex', tier:2, effect:'Burns what it touches.' }] },
        { id:'f2', side:'foe', name:'Brute', family:'Power', maxVit:5, curVit:0, abilities:[{ name:'Skull Break', tier:2, effect:'Cracks a skull.' }, { name:'Shove', tier:1, effect:'Pushes.' }] },
        { id:'f3', side:'foe', name:'Runner', family:'Power', maxVit:5, curVit:3, abilities:[{ name:'Got Away', tier:2, effect:'Not beaten.' }] } ];
      S.scene.treasure = { open:true, defeated:{ f1:true, f2:true }, lucky:{ c1:true, 'off:Tobin':true }, manual:{ c1:4, 'off:Tobin':2 }, endManual:{}, fatigue:3,
        draws:{ c1:{ band:4, dice:[3,3,3,3], sum:12, loot:'Potion or Tablet, Tier 2' }, 'off:Tobin':{ band:2, dice:[3,3], sum:6, loot:'Trap or Rune, Tier 1' } } };`);

  check('an Ability Item row is read with its tier and its pair',
    js(`JSON.stringify([tpAbilityItemRow('Potion or Tablet, Tier 2'), tpAbilityItemRow('Trap or Rune, Tier 3'), tpAbilityItemRow('Facet')])`)
      === JSON.stringify([{ tier:2, spell:'Potion', strike:'Tablet' }, { tier:3, spell:'Rune', strike:'Trap' }, null]),
    js(`JSON.stringify([tpAbilityItemRow('Potion or Tablet, Tier 2'), tpAbilityItemRow('Trap or Rune, Tier 3')])`));
  const acts = JSON.parse(js(`JSON.stringify(tpFallenActs(S.scene.treasure, 2))`));
  check('only the defeated foes’ Acts at the row’s tier are offered',
    acts.map((a) => a.name).join(',') === 'Cinder Hex,Skull Break', JSON.stringify(acts));
  check('a magic foe’s Act is a spell, a Power foe’s a strike',
    acts[0].spell === true && acts[1].spell === false, JSON.stringify(acts));

  js('render()');
  const card = js(`(document.getElementById('tplOverlay') || {}).innerHTML || ''`);
  check('the card offers the Acts by name with their foe', /Cinder Hex/.test(card) && /Ash Witch/.test(card) && !/Got Away/.test(card), card.slice(0, 300));
  check('the spell leads with a Potion, the strike with a Tablet',
    /class="tpl-btn gold"[^>]*'Potion'\)">Potion/.test(card) && /class="tpl-btn gold"[^>]*'Tablet'\)">Tablet/.test(card), card.match(/<button[^>]*tpLmGiveAbilityItem[^>]*>[^<]*/g));
  check('a Fell at the table with no sheet is told to write it down, with no give button',
    /Trap of Shove/.test(js(`tpAbilityItemHtml(S.scene.treasure, { key:'off:Tobin', name:'Tobin', offline:true }, S.scene.treasure.draws['off:Tobin'])`))
      && !/tpLmGiveAbilityItem/.test(js(`tpAbilityItemHtml(S.scene.treasure, { key:'off:Tobin', name:'Tobin', offline:true }, S.scene.treasure.draws['off:Tobin'])`)), 'offline row');

  js(`window._sent = []; window.parent.postMessage = function(m){ if (m && m.type) _sent.push(m); };`);
  js(`tpLmGiveAbilityItem('c1', 0, 'Potion')`);
  const sent = JSON.parse(js(`JSON.stringify(_sent.filter(function(m){ return m.type === 'TS_GIVE_UTILITY'; }))`));
  check('giving asks the backend with the Ability Item, the Act, its tier and its words',
    sent.length === 1 && sent[0].charId === 'c1' && sent[0].item.abilityItem === 'Potion' && sent[0].item.act.name === 'Cinder Hex'
      && sent[0].item.act.tier === 2 && sent[0].item.act.text === 'Burns what it touches.' && sent[0].item.from === 'Ash Witch', JSON.stringify(sent));
  js(`tpLmGiveAbilityItem('c1', 1, 'Tablet')`);
  check('a second click while it is on its way sends nothing', js(`_sent.filter(function(m){ return m.type === 'TS_GIVE_UTILITY'; }).length`) === 1, 'sent twice');
  w.dispatchEvent(new w.MessageEvent('message', { data:{ type:'TS_RESULT', reqId:sent[0].reqId, ok:true, data:{ ok:true, name:'Potion of Cinder Hex' } } }));
  await new Promise((r) => setTimeout(r, 50));
  check('once given, the row says so and the sheet is told to read again',
    js(`S.scene.treasure.draws.c1.given`) === 'Potion of Cinder Hex' && !!js(`S.sheetRev && S.sheetRev.c1`), js(`JSON.stringify(S.scene.treasure.draws.c1)`));
  js(`tpLmClearDraw('c1')`);
  check('a given draw cannot be re-rolled away', !!js(`S.scene.treasure.draws.c1`), 'the draw was cleared');
  js(`S.keeper = true; _sent = []; S.scene.treasure.draws.c2 = { band:4, loot:'Potion or Tablet, Tier 2' }; tpLmGiveAbilityItem('c2', 0, 'Potion')`);
  check('a lorekeeper cannot give treasure', js(`_sent.length`) === 0, 'a lorekeeper sent it');

  console.log('\nFellGlass: a given Ability Item reads as a Potion or a Trap');
  const g = await boot('fellglass.html', 'https://example.test/fg.html?host=threadspire');
  const gj = (s) => g.eval(s);
  gj(`ITEMS_LIB = [{ id:'rel-potion', name:'Potion', use:'Act', uses:'1 time use', group:'Combat', desc:'Casts automatically with no roll.', veiled:'a stoppered bottle' },
                   { id:'rel-trap', name:'Trap', use:'Act to place', uses:'1 time use', group:'Combat', desc:'Strikes when sprung.', veiled:'a frame of gears' }];
      C.created = true; C.inventory = [
        { itemId:'given:a', quantity:1, discovered:true, equipped:true, custom:{ name:'Potion of Cinder Hex', abilityItem:'Potion', tier:2, desc:'Tier 2. Burns what it touches.' } },
        { itemId:'given:b', quantity:1, discovered:true, equipped:true, custom:{ name:'Trap of Skull Break', abilityItem:'Trap', tier:2, desc:'Tier 2. Cracks a skull.' } },
        { itemId:'given:c', quantity:1, discovered:false, equipped:true, custom:{ name:'Potion of Ember Spit', abilityItem:'Potion', tier:1, desc:'Tier 1. Spits.' } } ];
      renderItems();`);
  const pot = JSON.parse(gj(`JSON.stringify(ITEMS_LIB.find(function(x){ return x.id === 'given:a'; }))`));
  check('the Act’s words come first, then the Potion’s rule', pot.desc === 'Tier 2. Burns what it touches. Casts automatically with no roll.', pot.desc);
  check('it takes the Potion’s use and uses', pot.use === 'Act' && pot.uses === '1 time use', JSON.stringify(pot));
  const pack = JSON.parse(gj(`JSON.stringify(cbPack())`));
  check('in a fight the Potion casts automatically and the Trap is laid on a space',
    pack[0].roll === 'auto' && pack[1].target === 'place', JSON.stringify(pack.map((u) => [u.name, u.roll, u.target])));
  const wrap = gj(`document.getElementById('itemsWrap').textContent`);
  check('as given, it arrives undiscovered: veiled, with the Potion\u2019s hint, and not usable yet',
    !/Ember Spit/.test(wrap) && /a stoppered bottle/.test(wrap) && !pack.some((u) => u.itemId === 'given:c'), wrap.slice(0, 300));
  check('the sheet shows it by name', /Potion of Cinder Hex/.test(gj(`document.getElementById('itemsWrap').textContent`)), 'not in the pack');

  console.log('\nThe backend: a sheet that loaded before the give does not lose it');
  const src = fs.readFileSync(path.join(ROOT, 'velo', 'backend', 'characters.web.js'), 'utf8');
  const mergeUtilGiven = new Function(src.match(/function mergeUtilGiven[\s\S]*?\n}\n/)[0] + 'return mergeUtilGiven;')();
  const given = { itemId:'given:a', quantity:1, custom:{ name:'Potion of Cinder Hex' } };
  const stale = mergeUtilGiven({ inventory:[given], utilGiven:['given:a'] }, { inventory:[{ itemId:'rope', quantity:1 }] });
  check('a stale save keeps the given row', stale.inventory.some((it) => it.itemId === 'given:a') && stale.utilGiven.indexOf('given:a') >= 0, JSON.stringify(stale));
  const used = mergeUtilGiven({ inventory:[given], utilGiven:['given:a'] }, { inventory:[], utilGiven:['given:a'] });
  check('a sheet that had it and used it up keeps it gone', used.inventory.length === 0, JSON.stringify(used));

  console.log('\n' + (fail ? 'FAILED ' + fail : 'all ' + pass + ' passed'));
  process.exit(fail ? 1 : 0);
})();
