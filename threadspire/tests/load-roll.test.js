/* Opening an adventure used to throw a die. A saved log ends where the last session left
 * off, often on a roll, and the code that animates the newest unseen roll fired on that
 * historical entry as the log loaded, throwing a die tagged with whoever rolled last
 * (Astra, in the Stone and Sovereign campaign) out of nowhere. A loaded log now marks its
 * last roll as already shown, so only a roll that genuinely arrives live is animated.
 *
 *   node threadspire/tests/load-roll.test.js
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

  // watch throwFor without animating
  js('window.__throws=[]; throwFor=function(e){ window.__throws.push(e && e.who); };');
  js('S.role="lm"; S.character={name:"LM"};');

  console.log('\nloading an adventure does not throw a historical die');

  js('flourishedId=0; window.__throws=[];');
  js('applyRemoteSnapshot({ log:[ {id:101,kind:"say",who:"Astra",text:"hi"}, {id:102,kind:"roll",who:"Astra",rollType:"attack",n:4} ] });');
  check('a log ending on a roll throws nothing on load', js('window.__throws.length') === 0, 'threw for ' + js('JSON.stringify(window.__throws)'));
  check('the guard is seeded to the loaded roll', js('flourishedId') === 102, 'flourishedId=' + js('flourishedId'));

  js('flourishedId=0; window.__throws=[];');
  js('applyRemoteSnapshot({ log:[ {id:201,kind:"roll",who:"Kethol",rollType:"attack",n:3}, {id:202,kind:"say",who:"Kethol",text:"done"} ] });');
  check('the guard finds the last roll even behind later chatter', js('flourishedId') === 201, 'flourishedId=' + js('flourishedId'));
  check('a log ending on chatter throws nothing', js('window.__throws.length') === 0, 'threw for ' + js('JSON.stringify(window.__throws)'));

  js('flourishedId=0; window.__throws=[];');
  js('applyRemoteSnapshot({ log:[ {id:301,kind:"sys",html:"x"} ] });');
  check('a log with no rolls leaves the guard alone and throws nothing', js('window.__throws.length') === 0 && js('flourishedId') === 0, 'flourishedId=' + js('flourishedId'));

  console.log('\na live roll after load still animates');

  js('flourishedId=0;');
  js('applyRemoteSnapshot({ log:[ {id:401,kind:"roll",who:"Astra",rollType:"attack",n:2} ] });');
  js('window.__throws=[];');
  js('applyRemoteState({ log: S.log.concat([{id:402,kind:"roll",who:"Astra",rollType:"attack",n:6}]) });');
  check('a roll that arrives after load throws once', js('window.__throws.length') === 1 && js('window.__throws[0]') === 'Astra', 'threw for ' + js('JSON.stringify(window.__throws)'));

  console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'all ' + pass + ' checks passed'));
  process.exit(fail ? 1 : 0);
})();
