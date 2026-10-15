/* A LoreMaster's own world, in no master table, gets its Brand whole from the BrandForge
 * (Nate, 2026-10-15: "We need to update the BrandForge to include this").
 *
 *   - The Brand is bound to its world: forged alone it names the world, forged as all three it
 *     takes the world's name, and the world's card finds it by that name.
 *   - It cannot be submitted without the canon parts: the working, the question, Lore of the
 *     Brand with its form, tone and cost, five Example Skill Checks and one Talent.
 *   - Lore of the Brand is written in the canon shape. Fed a vault page's parts, the forge
 *     writes that page's paragraph word for word (when the vault sits beside this repo).
 *   - The Talent is priced as CANON.md prices every Talent, and its words are flagged if they
 *     price it again or name a set amount.
 *
 *   node threadspire/tests/brandforge-brand.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
const VAULT = path.join(ROOT, '..', 'lorefell-fellguide');
let pass = 0, fail = 0;
function check(n, ok, d){ if (ok === true){ console.log('  PASS  ' + n); pass++; } else { console.log('  FAIL  ' + n + '\n          ' + d); fail++; } }

(async () => {
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'docs', 'brandforge.html'), 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true,
    url:'https://example.test/brandforge.html',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => null; w.console.error = () => {}; } });
  const w = dom.window;
  await new Promise((r) => w.addEventListener('load', r, { once:true }));
  const js = (s) => w.eval(s);
  const set = (id, v) => { const el = w.document.getElementById(id); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles:true })); };
  const missing = () => JSON.parse(js(`JSON.stringify(missingFor('brand'))`));
  const item = () => JSON.parse(js(`JSON.stringify(brandItem())`));

  const G = {
    b_name:'Gelidane', b_world:'Vulkaris', b_verb_long:'Frostmending', b_verb_short:'Mend',
    b_q:'How surely can I still a body, a flow, or a foe with the cold?',
    b_form:'ice-vein healing, frozen breath, and snow sigils, a magic that mends and preserves by slowing and stilling, drawing the cold inward to hold a body together',
    b_tone:'stoic and enduring',
    b_cost:'gentler than most Brands and crueler in its own way, for Frostmending brings emotional numbness, and those who lean on it too long find their feelings frosting over along with their wounds',
    b_c1:'Mend a wound or a failing body by slowing and stilling it against the cold.',
    b_c2:'Freeze a flow, a flood, or a foe in place with frozen breath.',
    b_c3:'Read the cold of a place, what it preserves and what it has claimed.',
    b_c4:'Still an ally’s bleeding so they can fight on through the round.',
    b_c5:'Freeze the ground under a charging foe so it slides past its mark.',
    b_talent:'The Killing Cold',
    b_talent_text:'The frost slips through every guard. This round, the damage you and every ally you can see deal ignores Durability and Resistance.'
  };

  console.log('\na Brand forged on its own');
  js(`setKind('brand')`);
  check('the Brand tab asks for its world', js(`!document.getElementById('f_bworld').classList.contains('hide')`) === true, 'world field hidden');
  check('an empty Brand is missing every canon part',
    ['its world', 'the practice', 'the question', 'its form, tone and cost', 'five example skill checks', "the Talent's name and what it does"].every((p) => missing().includes(p)), JSON.stringify(missing()));
  Object.entries(G).forEach(([k, v]) => set(k, v));
  check('filled whole, nothing is missing', missing().length === 0, JSON.stringify(missing()));
  set('b_c5', '');
  check('four checks are not enough: a canon Brand has five', missing().includes('five example skill checks'), JSON.stringify(missing()));
  set('b_c5', G.b_c5);
  set('b_cost', '');
  check('Lore of the Brand without its cost cannot be submitted', missing().includes('its form, tone and cost'), JSON.stringify(missing()));
  set('b_cost', G.b_cost);
  set('b_world', '');
  check('a Brand with no world cannot be submitted', missing().includes('its world'), JSON.stringify(missing()));
  set('b_world', G.b_world);

  const it = item();
  check('the Brand names its world', it.world === 'Vulkaris', it.world);
  check('it carries its question, five checks and its Talent',
    it.question === G.b_q && it.checks.length === 5 && it.talent.name === G.b_talent && it.talent.text === G.b_talent_text, JSON.stringify(it));
  check('its lore is written in the canon shape, with the world, the working, the form, the tone and the cost',
    it.lore === 'Gelidane is the Brand of Vulkaris, the working called Frostmending. It exists as ' + G.b_form + '. Its tone is stoic and enduring. Its cost is ' + G.b_cost + '.', it.lore);
  check('the parts travel with it too', it.form === G.b_form && it.tone === G.b_tone && it.cost === G.b_cost, JSON.stringify(it));
  set('b_tone', 'Its tone is stoic and enduring.');
  check('an opening the form already says is not doubled', item().lore.includes('Its tone is stoic and enduring. Its cost'), item().lore);
  set('b_tone', G.b_tone);

  const page = js(`document.getElementById('b_page').textContent`);
  check('the page preview reads as a canon Brand page',
    /Also called Frostmending\./.test(page) && page.includes('“' + G.b_q + '”') && /Lore of the Brand/.test(page) && /Example Skill Checks/.test(page) && /Talent: The Killing Cold/.test(page) && !/more to write/.test(page), page);
  set('b_c3', '');
  check('the preview shows what is still to write', /1 more to write/.test(js(`document.getElementById('b_page').textContent`)), js(`document.getElementById('b_page').textContent`));
  set('b_c3', G.b_c3);

  console.log('\nthe Talent, priced as every Talent is');
  const price = js(`document.getElementById('b_talent_price').textContent`);
  const canonPrice = 'A Fellmark: it works at no cost. Any other result: it works and costs one Lore Point, or with none an Ascension Crystal, or with neither a Paragon Point. With none of the three, it fails.';
  check('the forge shows the canon price under the Talent', price.includes(canonPrice) && /one round unless its own words say otherwise/.test(price), price);
  const canonMd = path.join(VAULT, '_Canon', 'CANON.md');
  if (!fs.existsSync(canonMd)) console.log('  SKIP  the vault is not beside this repo, so the price is not checked against CANON.md');
  else check('that price is CANON.md word for word', fs.readFileSync(canonMd, 'utf8').includes(canonPrice), 'CANON.md Talent line changed');
  const tflags = () => js(`document.getElementById('b_talent_flags').textContent`);
  check('a canon Talent raises no flag', tflags() === '', tflags());
  set('b_talent_text', 'The frost slips through every guard. It costs a Lore Point.');
  check('a Talent that prices itself is flagged', /Leave the price out of its words/.test(tflags()), tflags());
  set('b_talent_text', 'Deal 2d6 cold damage to a foe you can see.');
  check('a Talent that names a set amount is flagged', /never name a set amount/.test(tflags()), tflags());
  set('b_talent_text', G.b_talent_text);
  set('b_c2', 'Deal cold damage to a foe in reach.');
  check('a check that deals damage is flagged', /never deals damage on its own/.test(js(`document.getElementById('b_c_flags').textContent`)), js(`document.getElementById('b_c_flags').textContent`));
  set('b_c2', G.b_c2);

  console.log('\nforged as all three');
  js(`setKind('stratum')`);
  set('w_name', 'Hrimfast');
  check('the Brand takes the world’s name, and its own world field steps aside',
    js(`document.getElementById('b_world').value`) === 'Hrimfast' && js(`document.getElementById('f_bworld').classList.contains('hide')`) === true && item().world === 'Hrimfast',
    js(`document.getElementById('b_world').value`));
  check('the world names its Brand', js(`document.getElementById('w_brand').value`) === 'Gelidane', js(`document.getElementById('w_brand').value`));

  console.log('\nthe vault’s Brand pages, written back by the forge');
  const dir = path.join(VAULT, 'The FellGuide', 'The FellGuide', 'The Lore (Contains Spoilers)', 'Brands of Magic');
  if (!fs.existsSync(dir)) console.log('  SKIP  the vault is not beside this repo');
  else {
    js(`setKind('brand')`);
    const re = /^(\S+) is the Brand of (.+?), the working called (.+?)\. It exists as (.+?)\. Its tone is (.+?)\. Its cost is (.+)\.$/;
    let tried = 0; const off = [];
    fs.readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'Brands of Magic.md').forEach((f) => {
      const md = fs.readFileSync(path.join(dir, f), 'utf8');
      const lore = ((md.split('## Lore of the Brand')[1] || '').trim().split('\n')[0] || '').replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1');
      const m = lore.match(re); if (!m) return;
      tried++;
      set('b_name', m[1]); set('b_world', m[2]); set('b_verb_long', m[3]); set('b_form', m[4]); set('b_tone', m[5]); set('b_cost', m[6]);
      if (item().lore !== lore) off.push(f + ': ' + item().lore);
    });
    check('every canon page in the plain shape (' + tried + ') comes back word for word', tried >= 3 && off.length === 0, tried + ' tried | ' + off.join(' | '));
  }

  console.log('\nthe world’s card finds a Brand that names it');
  const src = fs.readFileSync(path.join(ROOT, 'velo', 'backend', 'characters.web.js'), 'utf8');
  const fnSrc = src.slice(src.indexOf('async function forgedWorldBrand'), src.indexOf('\n}\n', src.indexOf('async function forgedWorldBrand')) + 2);
  const brands = [
    { creationName:'Glassvoice', creatorMemberId:'lm1', payload:JSON.stringify({ meta:{ kind:'brand', world:'Vessra', question:'How truly can I sing a thing into glass?', talent:{ name:'The Shattering', text:'Every foe you can see is glass this round.' } } }) },
    { creationName:'Ashsong', creatorMemberId:'lm1', payload:JSON.stringify({ meta:{ kind:'brand', world:'Elsewhere', question:'How?' } }) }
  ];
  const wixData = { query(){ const q = { eq(){ return q; }, limit(){ return q; }, async find(){ return { items:brands }; } }; return q; } };
  const forgedWorldBrand = new Function('wixData', fnSrc + '\nreturn forgedWorldBrand;')(wixData);
  const b = await forgedWorldBrand({ creatorMemberId:'lm1' }, { glance:{} }, 'Vessra');
  check('a world forged alone, naming no Brand, gets the Brand forged for it',
    !!b && b.name === 'Glassvoice' && b.question === 'How truly can I sing a thing into glass?' && b.talent.name === 'The Shattering', JSON.stringify(b));
  const n = await forgedWorldBrand({ creatorMemberId:'lm1' }, { glance:{ brand:'Ashsong' } }, 'Vessra');
  check('a Brand the world names still comes first', !!n && n.name === 'Ashsong', JSON.stringify(n));
  const none = await forgedWorldBrand({ creatorMemberId:'lm1' }, { glance:{} }, 'Nowhere');
  check('a world no Brand names gives none', none === null, JSON.stringify(none));

  console.log('\n' + (fail ? 'FAILED ' + fail : 'all ' + pass + ' passed'));
  process.exit(fail ? 1 : 0);
})();
