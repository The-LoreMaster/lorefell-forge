/* Make your own: a custom ability at the slot (Nate, 2026-10-14).
 *
 * An empty ability slot the weapon has unlocked (levels 2, 6 and 10, Creating Abilities)
 * offers "Make your own" beside the FellGuide's list. It opens the SigilForge's builder in
 * the sheet, with the SigilForge's own components and tier budgets, and the rules of Ability
 * Components: exactly three inlays, one effect (a Combat Effect or an Affliction, never both,
 * never neither), the tier ceiling hard, the wound gate and the family gate. Saved, it fills
 * the slot with its name at the slot's tier and works like any set ability. "Also submit to
 * the LoreForge" sends it the way the SigilForge does. The LoreMaster's view of a Fell gets
 * the same, since it is the same sheet (ThreadSpire loads fellglass.html?host=threadspire).
 *
 *   node threadspire/tests/custom-ability.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
let pass = 0, fail = 0;
function check(n, ok, d){ if (ok === true){ console.log('  PASS  ' + n); pass++; } else { console.log('  FAIL  ' + n + '\n          ' + d); fail++; } }

async function boot(url){
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'docs', 'fellglass.html'), 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url,
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => null; w.fetch = () => Promise.reject(new Error('offline')); w.console.error = () => {}; w.confirm = () => true; w.alert = () => {}; } });
  const w = dom.window;
  await new Promise((r) => w.addEventListener('load', r, { once:true }));
  await new Promise((r) => setTimeout(r, 300));
  return w;
}

function block(file){
  const s = fs.readFileSync(path.join(ROOT, 'docs', file), 'utf8');
  const a = s.indexOf('/*SIGIL_RULES_BEGIN'), b = s.indexOf('/*SIGIL_RULES_END*/');
  return a < 0 || b < 0 ? null : s.slice(a, b);
}

(async () => {
  console.log('\nthe SigilForge’s components, not a retyped copy');
  const fgB = block('fellglass.html'), tsB = block('threadspire.html');
  check('the sheet carries the SIGIL_RULES block', !!fgB, 'missing');
  check('it is the same block ThreadSpire carries (syncSigilRules --check ties that to sigilforge.html)', fgB === tsB, 'drifted');
  const sf = fs.readFileSync(path.join(ROOT, 'docs', 'sigilforge.html'), 'utf8');
  const a = sf.indexOf('const COMPONENTS = ['), b = sf.indexOf('\n];', a);
  check('and its components are sigilforge.html’s COMPONENTS', !!fgB && fgB.indexOf(sf.slice(a + 'const COMPONENTS = '.length, b + 2)) > 0, 'differs');
  check('docs and embeds of the sheet are byte-identical', fs.readFileSync(path.join(ROOT, 'docs', 'fellglass.html'), 'utf8') === fs.readFileSync(path.join(ROOT, 'embeds', 'fellglass.html'), 'utf8'), 'differ');

  for (const where of [{ name:'FellGlass, the player', url:'https://example.test/fellglass.html', god:false },
                       { name:'ThreadSpire, the LoreMaster opening that Fell (ts-god)', url:'https://example.test/fellglass.html?host=threadspire', god:true }]){
    const w = await boot(where.url);
    const js = (s) => w.eval(s);
    console.log('\n' + where.name);
    js(`window.__subs = []; sigilSubmit = function(p){ window.__subs.push(p); };
        window.__tree = function(cat){ return Object.keys(WEAPON_DB).filter(function(t){ return WEAPON_DB[t].category === cat; })[0]; };
        var rec = seedSheet({}); rec.created = true; rec.identity = rec.identity || {}; rec.identity.name = 'Astra';
        rec.weapons = [{ tree:__tree('precision'), level:2, formIdx:0, equipped:true, abilities:[null,null,null], infusions:[], afflictions:[] }];
        loadCharacter(rec);`);
    if (where.god) js(`window.dispatchEvent(new MessageEvent('message', { data:{ type:'ts-god', on:true } }));`);
    await new Promise((r) => setTimeout(r, 30));
    check('the LoreMaster flag is ' + (where.god ? 'on' : 'off'), js('god') === where.god, String(js('god')));
    const open = () => { js(`_axOpen.w0 = true; renderWeapons();`); };
    const slots = () => js(`[...document.querySelectorAll('#weaponsWrap .ax-slot.empty')].map(function(b){ return b.textContent; }).filter(function(t){ return /ability/.test(t); })`);
    const clickSlot = (tier) => js(`(function(){ var b = [...document.querySelectorAll('#weaponsWrap .ax-slot.empty')].filter(function(x){ return x.textContent === 'Choose a Tier ${tier} ability'; })[0]; if (!b) return false; b.click(); return true; })()`);
    const ownBtn = () => js(`(function(){ var o = document.querySelector('#fgtBody .ax-own'); return o ? o.textContent : ''; })()`);

    open();
    check('a level 2 weapon shows one empty ability slot, Tier 1', JSON.stringify(Array.from(slots())) === '["Choose a Tier 1 ability"]', JSON.stringify(Array.from(slots())));
    check('the empty slot opens', clickSlot(1) === true, 'no slot');
    check('"Make your own" appears on the unlocked empty slot', /^Make your own/.test(ownBtn()), ownBtn());
    js(`fgTellClose(); C.weapons[0].level = 1; renderWeapons();`);
    check('a level 1 weapon has no ability slot to offer it', slots().length === 0, JSON.stringify(Array.from(slots())));
    js(`C.weapons[0].level = 6; C.weapons[0].formIdx = 1; renderWeapons();`);
    clickSlot(1);
    check('a 2nd Form weapon does not offer it at a Tier 1 slot (it forges Tier 2 and 3)', ownBtn() === '', ownBtn());
    js(`fgTellClose();`); clickSlot(2);
    check('it does at that weapon’s Tier 2 slot', /^Make your own/.test(ownBtn()), ownBtn());
    js(`fgTellClose(); C.weapons[0].level = 2; C.weapons[0].formIdx = 0; renderWeapons();`);

    console.log('  the builder');
    clickSlot(1);
    js(`document.querySelector('#fgtBody .ax-own').click();`);
    check('it opens in place, in the slot’s window', js(`!!document.querySelector('#fgTell.open #fgtBody .cab')`) === true && /Make your own Tier 1 ability/.test(js(`document.getElementById('fgtTitle').textContent`)), js(`document.getElementById('fgtTitle').textContent`));
    const set = (key, v) => js(`(function(){ var e = document.querySelector('#fgtBody [data-cab="${key}"]'); if (e.type === 'checkbox') { e.checked = ${JSON.stringify(!!v)}; e.dispatchEvent(new Event('change')); return; } e.value = ${JSON.stringify(v)}; e.dispatchEvent(new Event(e.tagName === 'SELECT' ? 'change' : 'input')); })()`);
    const saveDisabled = () => js(`document.querySelector('#fgtBody [data-cab="save"]').disabled`);
    const errs = () => js(`document.querySelector('#fgtBody .cab-errs').textContent`);
    check('the Affliction list holds only the weapon’s family', js(`[...document.querySelectorAll('#fgtBody [data-cab="aff"] option')].slice(1).every(function(o){ var c = cabComp(o.value); return c && c.family === 'Precision'; })`) === true, 'other family offered');
    set('name', 'Quickstep Cut'); set('line', 'The blade is gone before the eye can follow.');
    check('no effect chosen: it cannot be saved', saveDisabled() === true && /Choose one effect/.test(errs()), errs());
    set('effect', 'Bonus Damage'); set('targeting', 'Three Targets');
    check('over the Tier 1 budget (2 + 2 = 4 of 1 to 2): it cannot be saved', saveDisabled() === true && /costs 4, over the Tier 1 budget of 1 to 2/.test(errs()), errs());
    js(`document.querySelector('#fgtBody [data-cab="save"]').disabled = false; document.querySelector('#fgtBody [data-cab="save"]').click();`);
    check('and a forced click saves nothing', js(`C.weapons[0].abilities[0]`) === null, String(js(`C.weapons[0].abilities[0]`)));
    set('targeting', 'One Target'); set('aff', 'Bleeding*');
    check('a Combat Effect and an Affliction both: it cannot be saved', saveDisabled() === true && /never both/.test(errs()), errs());
    set('aff', '');
    check('one target, Standard Damage and Bonus Damage (2) is legal at Tier 1', saveDisabled() === false && errs() === '', errs());
    set('submit', true);
    js(`document.querySelector('#fgtBody [data-cab="save"]').click();`);
    check('a valid build fills the slot with its name', js(`C.weapons[0].abilities[0]`) === 'Quickstep Cut', String(js(`C.weapons[0].abilities[0]`)));
    check('at the slot’s tier, and kept on the Fell', js(`JSON.stringify([ABILITIES.filter(function(x){ return x.name === 'Quickstep Cut'; })[0].tier, C.forgedKept['ability:Quickstep Cut'].tier])`) === '[1,1]', js(`JSON.stringify(C.forgedKept['ability:Quickstep Cut'])`));
    check('the slot now reads its name', /Quickstep Cut/.test(js(`document.getElementById('weaponsWrap').textContent`)), 'not shown');
    check('it works like any set ability: an Act at Tier 1 on the weapon', js(`JSON.stringify((window.COMBAT_ACTS || []).filter(function(a){ return a.nm === 'Quickstep Cut'; }).map(function(a){ return [a.tier, a.kind, a.src === weaponName(C.weapons[0])]; }))`) === '[[1,"weapon",true]]', js(`JSON.stringify(window.COMBAT_ACTS)`));
    const sub = JSON.parse(js(`JSON.stringify(window.__subs[0] || null)`));
    check('"Also submit to the LoreForge" calls the submit path', js(`window.__subs.length`) === 1 && sub.title === 'Quickstep Cut' && sub.tier === 'T1' && sub.forge.selections.join() === 'Standard Damage,One Target,Bonus Damage' && sub.forge.family === 'Precision' && sub.cost === 2, JSON.stringify(sub));
    check('the submission carries the player’s line', sub && sub.flavorText === 'The blade is gone before the eye can follow.', sub && sub.flavorText);
    check('a saved name cannot be taken twice', /already exists/.test(js(`cabCheck({ tier:1, family:'Precision', damage:'Standard Damage', targeting:'One Target', effects:['Advanced'], name:'Quickstep Cut', line:'x' }).join(' ')`)), 'allowed');

    console.log('  without the checkbox');
    js(`C.weapons[0].level = 6; renderWeapons();`);
    clickSlot(2);
    js(`document.querySelector('#fgtBody .ax-own').click();`);
    set('name', 'Pinning Thrust'); set('line', 'It nails the foe to where it stood.'); set('aff', 'Immobilized*');
    check('a Tier 2 build with a Precision Affliction (3) saves', saveDisabled() === false, errs());
    js(`document.querySelector('#fgtBody [data-cab="save"]').click();`);
    check('it fills the Tier 2 slot', js(`C.weapons[0].abilities[1]`) === 'Pinning Thrust', String(js(`C.weapons[0].abilities[1]`)));
    check('and nothing is submitted when the box is not ticked', js(`window.__subs.length`) === 1, String(js(`window.__subs.length`)));
  }

  console.log('\nthe rules, checked directly');
  const w = await boot('https://example.test/fellglass.html');
  const ck = (bd) => Array.from(w.eval(`cabCheck(${JSON.stringify(Object.assign({ name:'X', line:'y' }, bd))})`)).join(' | ');
  check('neither effect: refused', /Choose one effect/.test(ck({ tier:1, family:'Power', damage:'Standard Damage', targeting:'One Target', effects:[] })), 'allowed');
  check('both effects: refused', /never both/.test(ck({ tier:3, family:'Power', damage:'Standard Damage', targeting:'One Target', effects:['Crushed', 'Vitiated*'] })), 'allowed');
  check('the family gate: a Magic Affliction on a Power weapon is refused', /is a Magic Affliction, and this weapon is Power/.test(ck({ tier:2, family:'Power', damage:'Standard Damage', targeting:'One Target', effects:['Jinxed*'] })), 'allowed');
  check('the wound gate: No Damage with a Power Affliction is refused', /needs a wound/.test(ck({ tier:2, family:'Power', damage:'No Damage', targeting:'One Target', effects:['Bruised*'] })), 'allowed');
  check('a Magic build may afflict with No Damage', ck({ tier:2, family:'Magic', damage:'No Damage', targeting:'One Target', effects:['Jinxed*'] }) === '', ck({ tier:2, family:'Magic', damage:'No Damage', targeting:'One Target', effects:['Jinxed*'] }));
  check('an attack effect needs damage', /only works on an attack/.test(ck({ tier:1, family:'Power', damage:'No Damage', targeting:'One Target', effects:['Bonus Damage'] })), 'allowed');
  check('Tier 2 ceiling is 4: Double Standard and Pushed (3 + 2 = 5) is refused', /costs 5, over the Tier 2 budget of 3 to 4/.test(ck({ tier:2, family:'Precision', damage:'Double Standard', targeting:'One Target', effects:['Pushed'] })), 'allowed');
  check('Double Standard and Advanced (3 + 1 = 4) fits Tier 2', ck({ tier:2, family:'Precision', damage:'Double Standard', targeting:'One Target', effects:['Advanced'] }) === '', 'refused');
  check('Tier 3 has no ceiling: All Targets and a Major Affliction (4 + 5) is legal', ck({ tier:3, family:'Precision', damage:'Standard Damage', targeting:'All Targets', effects:['Lacerated*'] }) === '', ck({ tier:3, family:'Precision', damage:'Standard Damage', targeting:'All Targets', effects:['Lacerated*'] }));
  check('under the floor is legal, and simply weaker (Tier 3 at 1)', ck({ tier:3, family:'Precision', damage:'Standard Damage', targeting:'One Target', effects:['Advanced'] }) === '', 'refused');
  check('a name and a line are asked for', /Name it/.test(Array.from(w.eval(`cabCheck({ tier:1, family:'Power', damage:'Standard Damage', targeting:'One Target', effects:['Advanced'], name:'', line:'' })`)).join(' ')) && /Write its line/.test(Array.from(w.eval(`cabCheck({ tier:1, family:'Power', damage:'Standard Damage', targeting:'One Target', effects:['Advanced'], name:'', line:'' })`)).join(' ')), 'not asked');

  console.log('\nthe submit path itself');
  w.eval(`var r0 = seedSheet({}); r0.created = true; loadCharacter(r0); sigilSubmit({ title:'Ember Lash', tier:'T1', forge:{ tier:1 } }); sigilSubmit({ title:'Ember Lash', tier:'T1', forge:{ tier:1 } });`);
  check('it keeps the SigilForge payload on the Fell, once per name, for the page to carry', w.eval(`JSON.stringify((C.loreforgeOut || []).map(function(x){ return x.payload.title; }))`) === '["Ember Lash"]', w.eval(`JSON.stringify(C.loreforgeOut)`));

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
