/* The Brands on the character sheet (FellGlass, and so ThreadSpire): each world's magic, held,
 * rolled and mastered like a skill, at the bottom of Skills (Nate, 2026-10-13).
 *
 *   - The sheet's BRANDS match the vault word for word, when the vault sits beside this repo
 *     (../lorefell-fellguide). Without it, that part is skipped and says so.
 *   - A Fell holds its home world's Brand from the start, and a world's Brand on arriving there.
 *   - A Brand answers only on its own world until its first Mastery, or Spindle threads it.
 *   - A Talent: a Fellmark makes it free, otherwise a Lore Point, then an Ascension Crystal, then
 *     a Paragon Point, and with none it fails. Skyvault Shards are never spent.
 *
 *   node threadspire/tests/brands-canon.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
const VAULT = path.join(ROOT, '..', 'lorefell-fellguide');
let pass = 0, fail = 0;
function check(n, ok, d){ if (ok === true){ console.log('  PASS  ' + n); pass++; } else { console.log('  FAIL  ' + n + '\n          ' + d); fail++; } }

(async () => {
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'docs', 'fellglass.html'), 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true,
    url:'https://example.test/fg.html?host=threadspire',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => null; w.fetch = () => Promise.reject(new Error('offline')); w.console.error = () => {}; } });
  const w = dom.window;
  await new Promise((r) => w.addEventListener('load', r, { once:true }));
  await new Promise((r) => setTimeout(r, 300));
  const js = (s) => w.eval(s);
  const BRANDS = JSON.parse(js('JSON.stringify(BRANDS)'));

  console.log('\nthe sheet carries the vault’s Brands');
  check('36 Brands, one per world', BRANDS.length === 36 && new Set(BRANDS.map((b) => b.worldId)).size === 36, BRANDS.length);
  const vaultCanon = path.join(VAULT, '_Canon', 'CANON.md');
  if (!fs.existsSync(vaultCanon)) console.log('  SKIP  the vault is not beside this repo, so the word-for-word check is skipped');
  else {
    const dir = path.join(VAULT, 'The FellGuide', 'The FellGuide', 'The Lore (Contains Spoilers)', 'Brands of Magic');
    const drift = [];
    BRANDS.forEach((b) => {
      const s = fs.readFileSync(path.join(dir, b.name + '.md'), 'utf8');
      const q = (s.match(/^> \*"(.*)"\*$/m) || [])[1], t = s.match(/> \[!note\] Talent: (.*)\n>\n> (.*)/) || [];
      if (q !== b.q || t[1] !== b.talent || t[2] !== b.text) drift.push(b.name);
    });
    const canon = fs.readFileSync(vaultCanon, 'utf8');
    BRANDS.forEach((b) => { if (!new RegExp('^\\| ' + b.lineage + ' \\|.*\\| ' + b.name + ' \\|.*\\| ' + b.world + ' \\|$', 'm').test(canon)) drift.push(b.name + ' (master table)'); });
    check('every question and Talent matches its vault page, and every Brand its master-table row', drift.length === 0, drift.join(', '));
  }

  console.log('\nholding a Brand');
  js(`C.created = true; C.identity.lineage = 'Wolfir'; C.identity.campaignId = 'adv-1'; C.identity.worldId = '';
      ADVS = [{ id:'adv-1', name:'Ash Road', worldId:'world:kwuhara' }]; C.brands = {}; renderSkills();`);
  check('the home world’s Brand is held from the start, at 0', js(`JSON.stringify(C.brands.Gelidane)`) === JSON.stringify({ rank:0, mastery:0, threaded:false }), js(`JSON.stringify(C.brands)`));
  check('arriving on a world attunes its Brand', !!js(`C.brands.Khaldurgy`), js(`JSON.stringify(C.brands)`));
  check('they sit at the bottom of Skills', /Brands/.test(js(`[...document.querySelectorAll('#skillsWrap .skill-group h3')].pop().textContent`)), 'not last');
  check('a Brand away from its world says so', js(`brandCallable('Gelidane')`) === false && /Answers only on Vulkaris/.test(js(`document.getElementById('skillsWrap').textContent`)), 'callable away from home');
  check('the world you stand on answers', js(`brandCallable('Khaldurgy')`) === true, 'not callable here');
  js(`C.brands.Gelidane.threaded = true;`);
  check('Spindle’s thread carries it anywhere', js(`brandCallable('Gelidane')`) === true, 'thread ignored');
  js(`C.brands.Gelidane.threaded = false; C.brands.Gelidane.mastery = 1;`);
  check('a mastered Brand answers on any world', js(`brandCallable('Gelidane')`) === true, 'mastery ignored');
  check('the roll adds rank and Mastery, like a skill', js(`C.brands.Khaldurgy.rank = 3; skillBonusOf('Khaldurgy')`) === 3, js(`skillBonusOf('Khaldurgy')`));
  js(`C.brands.Khaldurgy.rank = 2; skillGrowFellmark('Khaldurgy')`);
  check('a Fellmark grows it by 1', js(`C.brands.Khaldurgy.rank`) === 3, js(`C.brands.Khaldurgy.rank`));
  check('a mastered Brand counts as a thread for Discord', /1 mastered\. Each is a thread Discord can pull\./.test(js(`(renderSkills(), document.getElementById('skillsWrap').textContent)`)), 'no count');

  console.log('\ninvoking a Talent');
  const invoke = (die, lore) => js(`(function(){ Math.random = function(){ return ${(die - 1) / 6 + 0.01}; };
      C.lore.lorePoints = ${lore.lp}; C.lore.ascPending = ${lore.asc}; C.lore.paragonPoints = ${lore.pp}; C.lore.skyvaultShards = 5;
      var r = brandInvoke('Gelidane'); return JSON.stringify({ r: r, lp: C.lore.lorePoints, asc: C.lore.ascPending, pp: C.lore.paragonPoints, sh: C.lore.skyvaultShards }); })()`);
  let o = JSON.parse(invoke(6, { lp:1, asc:1, pp:1 }));
  check('a Fellmark makes it free', o.r.ok && o.r.paid === 'free' && o.lp === 1 && o.pp === 1, JSON.stringify(o));
  o = JSON.parse(invoke(3, { lp:2, asc:1, pp:1 }));
  check('otherwise it costs a Lore Point first', o.r.ok && o.lp === 1 && o.asc === 1 && o.pp === 1, JSON.stringify(o));
  o = JSON.parse(invoke(3, { lp:0, asc:1, pp:1 }));
  check('then an Ascension Crystal', o.r.ok && o.asc === 0 && o.pp === 1, JSON.stringify(o));
  o = JSON.parse(invoke(3, { lp:0, asc:0, pp:1 }));
  check('then a Paragon Point', o.r.ok && o.pp === 0, JSON.stringify(o));
  o = JSON.parse(invoke(3, { lp:0, asc:0, pp:0 }));
  check('with none it fails, and Skyvault Shards are never spent', !o.r.ok && o.sh === 5, JSON.stringify(o));
  check('an unmastered Brand has no Talent to invoke', js(`brandInvoke('Khaldurgy')`) === null, 'invoked');

  console.log('\n' + (fail ? 'FAILED ' + fail : 'all ' + pass + ' passed'));
  process.exit(fail ? 1 : 0);
})();
