/* The sheet change log records every edit to a Fell's sheet, from either side, with what
 * changed, who changed it, and when. Two people can hold the same Fell open, the player
 * on their device and the LoreMaster from the rail, and a change one made used to be
 * invisible to the other. This is the record that makes them comparable.
 *
 *   node threadspire/tests/sheet-log.test.js
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
  const reset = () => js('_sheetLog=[]; _sheetLogPrev={};');

  console.log('\nreading a save as a diff');

  reset();
  js('sheetLogChanges("c1","Nyra",{aurum:{oro:5},vitality:{current:20}},"player");');
  check('the first sight of a Fell is a baseline, not a change', js('_sheetLog.length') === 0, 'len=' + js('_sheetLog.length'));

  js('sheetLogChanges("c1","Nyra",{aurum:{oro:8},vitality:{current:20}},"player");');
  check('a single changed field logs one entry', js('_sheetLog.length') === 1, 'len=' + js('_sheetLog.length'));
  check('the entry names the dotted path', js('_sheetLog[0].field') === 'aurum.oro', 'field=' + js('_sheetLog[0].field'));
  check('the entry records from and to', js('_sheetLog[0].from') === 5 && js('_sheetLog[0].to') === 8, 'from=' + js('_sheetLog[0].from') + ' to=' + js('_sheetLog[0].to'));

  js('sheetLogChanges("c1","Nyra",{aurum:{oro:8},vitality:{current:12},fatigue:3},"loremaster");');
  check('two fields changing logs two entries', js('_sheetLog.length') === 3, 'len=' + js('_sheetLog.length'));
  check('the newest change is first', js('_sheetLog[0].who') === 'loremaster', 'who=' + js('_sheetLog[0].who'));

  const beforeNoop = js('_sheetLog.length');
  js('sheetLogChanges("c1","Nyra",{aurum:{oro:8},vitality:{current:12},fatigue:3},"player");');
  check('a save that changed nothing adds nothing', js('_sheetLog.length') === beforeNoop, 'len=' + js('_sheetLog.length'));

  console.log('\nwho made it');

  reset();
  js('sheetLogChanges("c9","Rurik",{aurum:{oro:0}},"loremaster");');       // baseline
  js('sheetLogChanges("c9","Rurik",{aurum:{oro:4}},"loremaster");');
  check('an edit to a held Fell is attributed to the LoreMaster', js('_sheetLog[0].who') === 'loremaster', 'who=' + js('_sheetLog[0].who'));

  reset();
  js('sheetLogChanges("cP","Seraphel",{skills:{Aim:1}},"player");');        // baseline
  js('sheetLogChanges("cP","Seraphel",{skills:{Aim:3}},"player");');
  check('an edit on a player\'s own sheet is attributed to the player', js('_sheetLog[0].who') === 'player', 'who=' + js('_sheetLog[0].who'));

  const rmk = js('sheetLogRemoteMark("c2","Kethol","loremaster"); JSON.stringify(_sheetLog[0])');
  check('a change learned from the state feed is recorded as a remote edit', /"remote":true/.test(rmk) && /"who":"loremaster"/.test(rmk), rmk);

  console.log('\nthe window');

  js('S.role="lm"; openSheetLog();');
  const html = js('document.querySelector(".tsm-panel") ? document.querySelector(".tsm-panel").innerHTML : ""');
  check('the log window renders its rows', /slw-row/.test(html), 'no rows rendered');

  console.log('\nhousekeeping');

  js('_sheetLog=[]; _sheetLogPrev={}; for(var i=0;i<250;i++){ sheetLogPush({ts:Date.now(),who:"player",charId:"c1",field:"x"+i}); }');
  check('the log is capped so a long session cannot grow it without bound', js('_sheetLog.length') === 200, 'len=' + js('_sheetLog.length'));

  js('clearSheetLog();');
  check('clearing empties the log', js('_sheetLog.length') === 0, 'len=' + js('_sheetLog.length'));

  js('_sheetLog=[]; sheetLogPush({ts:Date.now(),who:"player",charId:"c1",field:"aurum.oro",from:1,to:2}); S.role="lm";');
  const seam = js('seamsBody()');
  check('the Seams panel shows a clickable count', /openSheetLog/.test(seam) && /1 recorded/.test(seam), 'seam line missing');

  console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'all ' + pass + ' checks passed'));
  process.exit(fail ? 1 : 0);
})();
