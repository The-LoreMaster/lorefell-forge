/* Aurum, fatigue, and mobility are shown by counters and pips that were built once at
 * boot and never redrawn. A Fell loaded afterwards changed the values underneath them
 * and the display stood still: the coins were saved and loaded correctly, the sheet just
 * never repainted them, so they looked lost until a tab change happened to rebuild the
 * section. renderAll repaints all three now. These checks load a Fell with non-default
 * values and confirm the screen matches the record.
 *
 *   node threadspire/tests/sheet-render.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = path.join(__dirname, '..', '..', 'docs', 'fellglass.html');

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok === true) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name + '\n          ' + detail); fail++; }
}

async function boot() {
  const dom = new JSDOM(fs.readFileSync(HTML, 'utf8'), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://example.test/fellglass.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.fetch = () => Promise.reject(new Error('offline'));
      w.console.error = () => {};
    }
  });
  await new Promise((r) => dom.window.addEventListener('load', r, { once: true }));
  await new Promise((r) => setTimeout(r, 300));
  return dom.window;
}

(async () => {
  const w = await boot();
  const js = (s) => w.eval(s);
  const grid = () => js('[...document.querySelectorAll("#aurumGrid .v")].map(x=>x.textContent).join(",")');
  const total = () => js('document.getElementById("aurumTotal").textContent');
  const litPips = () => js('[...document.querySelectorAll("#fatiguePips .fpip")].filter(p=>p.classList.contains("on")).length');
  const mob = () => js('document.getElementById("mobVal").textContent');

  console.log('\na loaded Fell shows what it holds');

  js('god=false; var rec=seedSheet({}); rec.created=true; rec.aurum={oro:5,arca:2,atla:1,zurith:3}; rec.fatigue=2; rec.mobility=7; loadCharacter(rec);');

  // 5*1 + 2*10 + 1*50 + 3*100 = 375
  check('aurum counters show the loaded coins', grid() === '5,2,1,3', 'grid shows ' + grid());
  check('aurum total is the weighted sum', total() === '375', 'total=' + total());
  check('fatigue lights the loaded number of pips', litPips() === 2, 'lit=' + litPips());
  check('mobility shows its loaded value', mob() === '7', 'mobVal=' + mob());

  console.log('\nswitching Fells carries the display across');

  js('var r2=seedSheet({}); r2.created=true; r2.aurum={oro:1,arca:0,atla:0,zurith:0}; r2.fatigue=0; r2.mobility=5; loadCharacter(r2);');
  check('aurum redraws for the new Fell', grid() === '1,0,0,0', 'grid shows ' + grid());
  check('fatigue redraws for the new Fell', litPips() === 0, 'lit=' + litPips());
  check('mobility redraws for the new Fell', mob() === '5', 'mobVal=' + mob());

  console.log('\nthe coins still spend');

  js('var s=[...document.querySelectorAll("#aurumGrid .counter")][0]; s.querySelector(".ctl button:last-child").click();');
  check('the Oro plus button raises Oro and its display', js('C.aurum.oro') === 2 && grid().split(',')[0] === '2', 'oro=' + js('C.aurum.oro') + ' grid=' + grid());

  console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'all ' + pass + ' checks passed'));
  process.exit(fail ? 1 : 0);
})();
