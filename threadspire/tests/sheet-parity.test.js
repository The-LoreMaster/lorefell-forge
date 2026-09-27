/* One character sheet. ThreadSpire shows the FellGlass sheet exactly, player and
 * LoreMaster alike (CLAUDE.md, standing rule 1). Two ways that drifts, both pinned here:
 *
 *   TABS. The LoreMaster's tab bar (GOD_TABS in threadspire.html) is every FellGlass panel
 *   (PANELS in fellglass.html), in the same order, under the same names. A panel added,
 *   renamed or reordered in FellGlass fails this until ThreadSpire follows.
 *
 *   LOOK. The ?host=threadspire style block may hide FellGlass's own navigation and style
 *   the frame's scrollbar. Nothing else. Restyling a card, hiding a title or a header
 *   field in there is exactly the drift the rule forbids.
 *
 *   node threadspire/tests/sheet-parity.test.js
 */
const fs = require('fs');
const path = require('path');
const DOCS = path.join(__dirname, '..', '..', 'docs');
const FG = fs.readFileSync(path.join(DOCS, 'fellglass.html'), 'utf8');
const TS = fs.readFileSync(path.join(DOCS, 'threadspire.html'), 'utf8');

let pass = 0, fail = 0;
function check(n, ok, d){ if(ok===true){console.log('  PASS  '+n);pass++;} else {console.log('  FAIL  '+n+'\n          '+d);fail++;} }

function arrayLiteral(src, re){
  const m = src.match(re);
  if (!m) return null;
  return Function('return ' + m[1])();
}
const PANELS = arrayLiteral(FG, /const PANELS=(\[[\s\S]*?\]\s*\]);/);
const GOD_TABS = arrayLiteral(TS, /var GOD_TABS = (\[[\s\S]*?\]\s*\]);/);

check('PANELS found in fellglass.html', Array.isArray(PANELS), 'pattern did not match');
check('GOD_TABS found in threadspire.html', Array.isArray(GOD_TABS), 'pattern did not match');
if (PANELS && GOD_TABS){
  const want = PANELS.map(p => p[0] + ':' + p[1]).join(', ');
  const got = GOD_TABS.map(t => t[0] + ':' + t[1]).join(', ');
  check('LoreMaster tabs are every FellGlass panel, same order, same names', want === got,
    'fellglass: ' + want + '\n          threadspire: ' + got);
}

const sm = FG.match(/get\('host'\)==='threadspire'\)\{\s*var st=document\.createElement\('style'\);\s*st\.textContent='([^']*)'/);
check('host style block found', !!sm, 'pattern did not match');
if (sm){
  const allowedHide = new Set(['body.tsembed #hub', 'body.tsembed #hubBtn', 'body.tsembed #charSwitch']);
  const bad = [];
  sm[1].replace(/([^{}]+)\{([^}]*)\}/g, function(_, sel, body){
    const sels = sel.split(',').map(x => x.trim());
    const scrollbar = sels.every(x => /^body\.tsembed ::-webkit-scrollbar(-thumb|-track)?$/.test(x));
    const navHide = sels.every(x => allowedHide.has(x)) && /^display:none!important$/.test(body.trim());
    if (!scrollbar && !navHide) bad.push(sel.trim() + '{' + body + '}');
    return '';
  });
  check('host style block only hides navigation and styles the scrollbar', bad.length === 0,
    'not allowed: ' + bad.join(' | '));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
