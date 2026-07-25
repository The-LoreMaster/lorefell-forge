/* A Fell in the roster should be placeable as a token. The palette used to read only the
 * Fell already written into the current scene, so after an adventure is reimported with
 * fresh scenes, every Fell sat in the roster but appeared nowhere in the token list. The
 * palette reads the roster now, preferring a scene entry where one exists so a placed
 * Fell keeps its scene id.
 *
 *   node threadspire/tests/token-palette.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = path.join(__dirname, '..', '..', 'docs', 'threadspire.html');

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok === true) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name + '\n          ' + detail); fail++; }
}

async function boot() {
  const dom = new JSDOM(fs.readFileSync(HTML, 'utf8'), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://example.test/threadspire.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.fetch = () => Promise.reject(new Error('offline'));
      w.console.error = () => {};
    }
  });
  await new Promise((r) => dom.window.addEventListener('load', r, { once: true }));
  await new Promise((r) => setTimeout(r, 250));
  return dom.window;
}

(async () => {
  const w = await boot();
  const js = (s) => w.eval(s);
  const fell = () => JSON.parse(js('JSON.stringify(tokenPalette().fell)'));

  console.log('\nthe roster feeds the palette');

  js('S.role="lm"; S.party=[{charId:"c1",charName:"Nyra Voss"},{charId:"c2",charName:"Kethol"}]; S.scene.fell=[];');
  check('every roster Fell is offered when the scene names none', fell().length === 2, 'fell=' + JSON.stringify(fell()));
  check('a roster Fell carries its charId as its ref', fell()[0].refId === fell()[0].charId, JSON.stringify(fell()[0]));

  console.log('\nthe scene entry is preferred where it exists');

  js('S.scene.fell=[{id:"scene-1",charId:"c1",name:"Nyra Voss"}];');
  check('a Fell in the scene is not duplicated by the roster', fell().length === 2, 'len=' + fell().length);
  check('the scene entry keeps its own id as ref', fell().find((f) => f.charId === 'c1').refId === 'scene-1', JSON.stringify(fell()));

  console.log('\nplacing a roster Fell');

  js('S.scene.fell=[]; S.tokens=[]; S.map={w:2400,h:1600}; S.grid={offX:0,offY:0};');
  js('lmPlaceToken("p","c2");');
  check('a roster Fell places as a token carrying its charId', js('S.tokens.length') === 1 && js('S.tokens[0].charId') === 'c2', JSON.stringify(js('JSON.stringify(S.tokens)')));
  check('the placed token carries the Fell name', js('S.tokens[0].name') === 'Kethol', 'name=' + js('S.tokens[0].name'));

  console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'all ' + pass + ' checks passed'));
  process.exit(fail ? 1 : 0);
})();
