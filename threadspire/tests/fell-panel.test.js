/* Regression checks for the seams that used to fail without saying anything.
 *
 * Loads the real docs/threadspire.html in jsdom and exercises the paths behind four
 * bugs that all looked the same from the table: the Fell tab opened empty, the window
 * set itself open and never appeared, the sheet was handed a Fell it could not hear,
 * and every player's dice rolled the wrong colour.
 *
 * Each check is named for the symptom it stands for, so a failure here reads as the
 * bug coming back rather than as an abstract assertion.
 *
 *   node threadspire/tests/fell-panel.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = path.join(__dirname, '..', '..', 'docs', 'threadspire.html');

let pass = 0, fail = 0;
function check(name, fn) {
  let r;
  try { r = fn(); } catch (e) { r = 'threw: ' + e.message; }
  if (r === true) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name + '\n          ' + r); fail++; }
}

async function boot() {
  const dom = new JSDOM(fs.readFileSync(HTML, 'utf8'), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://example.test/threadspire.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.fetch = () => Promise.reject(new Error('offline'));
      w.matchMedia = w.matchMedia || (() => ({
        matches: false, addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {}
      }));
      /* the console is noisy by design once a section is made to throw on purpose */
      w.console.error = () => {};
    }
  });
  await new Promise((r) => dom.window.addEventListener('load', r, { once: true }));
  await new Promise((r) => setTimeout(r, 250));
  return dom.window;
}

(async () => {
  const w = await boot();
  const js = (src) => w.eval(src);

  /* read before any check runs: drawing the Fell is itself what sets these, so asking
     later would only prove that the checks above ran */
  const atBoot = {
    partyIsList: js('Array.isArray(S.party)'),
    partyShape: js('JSON.stringify(S.party)').slice(0, 120),
    partyLoaded: js('_partyLoaded')
  };

  console.log('\nthe roster, which is a list and was once a shelf keyed by name');

  check('the roster starts as a list, not an object', () =>
    atBoot.partyIsList === true || 'S.party booted as ' + atBoot.partyShape);

  check('drawing the Fell does not throw on the seeded roster', () => {
    js('S.role = "lm";');
    js('lmFellBody()');
    return true;
  });

  check('a player is found by name on the roster, so dice keep their colour', () => {
    js('S.party = [{ charId:"c1", charName:"Nyra Voss", diceSkins:{ act:"emberglass" } }];');
    const got = js('skinKey("act","Nyra Voss")');
    return got === 'emberglass' || 'got ' + got + ' rather than emberglass';
  });

  console.log('\nthe Fell tab that opened empty and needed a dozen taps');

  check('the roster begins unread, so opening the tab has reason to fetch', () =>
    atBoot.partyLoaded === false || 'the flag booted as ' + atBoot.partyLoaded);

  check('opening the Fell asks the site for the roster', () => {
    js('window.tsEmbedded = function(){ return true; };');
    js('window.__asked = []; window.tsAsk = function(t){ window.__asked.push(t); return new Promise(function(){}); };');
    js('_partyLoaded = false; _partyLoading = false; S.party = [];');
    js('lmFellBody()');
    const asked = js('JSON.stringify(window.__asked)');
    return asked.indexOf('TS_PARTY_LIST') > -1 || 'nothing was asked for: ' + asked;
  });

  check('a request in flight is not stacked on by a redraw', () => {
    js('window.__asked = [];');
    js('lmFellBody(); lmFellBody(); lmFellBody();');
    const n = js('window.__asked.length');
    return n === 0 || 'a redraw fired ' + n + ' more requests while one was already out';
  });

  check('an empty roster that was never asked for reads differently to one that was', () => {
    js('_partyLoaded = false; _partyLoading = false; S.party = [];');
    const unread = js('lmFellBody()');
    js('_partyLoaded = true; _partyLoading = false; SEAM.partyWhy = "the adventure answered with nobody";');
    const answered = js('lmFellBody()');
    return (unread !== answered) || 'both said the same thing, so a broken bridge still reads as an empty table';
  });

  console.log('\nthe window that set itself open and never appeared');

  check('a section that throws still leaves the window open', () => {
    js('S.openSection = null; window.stagesBody = function(){ throw new Error("boom"); };');
    js('openWin("stages")');
    return js('document.getElementById("win").classList.contains("open")') === true
      || 'the window stayed shut while openSection was ' + js('JSON.stringify(S.openSection)');
  });

  check('the failure is named rather than swallowed', () =>
    /boom/.test(js('SEAM.lastSectionErr || ""'))
      || 'the seam said: ' + js('JSON.stringify(SEAM.lastSectionErr)'));

  check('so the next tap closes cleanly instead of doing nothing', () => {
    js('railClick("stages")');
    return js('S.openSection') === null
      || 'openSection stuck at ' + js('JSON.stringify(S.openSection)');
  });

  console.log('\nthe sheet handed a Fell before it could hear');

  check('a message to a cold frame is held, not dropped', () => {
    js('sheet.ready = false; sheet.queue = [];');
    js('sheet.postMessage({ type:"init", charId:"abc", character:{ identity:{ name:"Kethol" } } })');
    return js('sheet.queue.length') === 1 || 'the queue held ' + js('sheet.queue.length');
  });

  check('a newer Fell supersedes the one waiting rather than stacking behind it', () => {
    js('sheet.postMessage({ type:"init", charId:"xyz", character:{} })');
    const q = JSON.parse(js('JSON.stringify(sheet.queue)'));
    return (q.length === 1 && q[0].charId === 'xyz') || 'the queue held ' + JSON.stringify(q);
  });

  check('held words are said again the moment the sheet answers', () => {
    js('sheet.postMessage({ type:"ts-god", on:true })');
    js('window.__sent = []; sheet.win = function(){ return { postMessage: function(m){ window.__sent.push(m.type); } }; };');
    js('sheet.flush();');
    const got = JSON.parse(js('JSON.stringify(window.__sent)'));
    return (got.length === 2 && got[0] === 'init' && got[1] === 'ts-god')
      || 'the frame received ' + JSON.stringify(got);
  });

  check('and the backlog is emptied once it has been said', () =>
    js('sheet.queue.length') === 0 || 'the queue still holds ' + js('sheet.queue.length'));

  console.log('\n' + (fail
    ? 'FAILED ' + fail + ' of ' + (pass + fail)
    : 'all ' + pass + ' checks passed'));
  process.exit(fail ? 1 : 0);
})();
