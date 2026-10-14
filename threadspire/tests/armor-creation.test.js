/* Armor at character creation follows the FellGuide (The Arsenal/Armor, Level 1): the
   crystal's point, then "any other defensive attribute", so the two points land on two
   different attributes. FellGlass draws the creator; ThreadSpire loads the same sheet. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
let pass = 0, fail = 0;
function check(n, ok, d){ if (ok === true){ console.log('  PASS  ' + n); pass++; } else { console.log('  FAIL  ' + n + '\n          ' + d); fail++; } }

(async () => {
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'docs', 'fellglass.html'), 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true,
    url:'https://example.test/fg.html',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => null; w.fetch = () => Promise.reject(new Error('offline')); w.console.error = () => {}; } });
  const w = dom.window;
  await new Promise((r) => w.addEventListener('load', r, { once:true }));
  await new Promise((r) => setTimeout(r, 300));
  const js = (s) => w.eval(s);
  const options = () => js(`JSON.stringify([...document.querySelectorAll('#ccCard .lu-opt, #ccCard button')].map(b => b.textContent.trim()).filter(t => /^\\+1 /.test(t)))`);

  console.log('\narmor at character creation');
  js(`ccOpen(); CC.path = 'custom'; CC.track = 'armor'; CC.armorPts = []; CC.step = 'track-attr'; ccRender();`);
  let o = JSON.parse(options());
  check('all three defensive attributes are offered first', o.length === 3, JSON.stringify(o));
  js(`CC.armorPts = ['durability']; ccRender();`);
  o = JSON.parse(options());
  check('the second point goes to a different attribute', o.length === 2 && !o.some(t => /Durability/.test(t)), JSON.stringify(o));
  check('the step says so', /each in a different defensive attribute/.test(js(`document.getElementById('ccCard').textContent`)), 'old wording');

  console.log('\nthe LoreMaster\'s weapon slot');
  js(`document.body.classList.add('god'); C.weapons=[newWeapon(),newWeapon()]; C.weapons[0].tree=Object.keys(WEAPON_DB)[0]; renderWeapons();`);
  const offered = JSON.parse(js(`JSON.stringify([...document.querySelectorAll('#weaponsWrap select option')].map(o => o.value).filter(Boolean))`));
  const held = js(`C.weapons[0].tree`);
  check('a weapon the Fell holds is not offered again', offered.length > 0 && !offered.includes(held), JSON.stringify({ held, offered }));

  console.log(`\n${fail ? fail + ' failed' : 'all ' + pass + ' passed'}`);
  process.exit(fail ? 1 : 0);
})();
