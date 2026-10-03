/* One character sheet. ThreadSpire shows the FellGlass sheet exactly, player and
 * LoreMaster alike (CLAUDE.md, standing rule 1). Two ways that drifts, both pinned here:
 *
 *   TABS. The LoreMaster's tab bar (GOD_TABS in threadspire.html) reaches every FellGlass
 *   panel (PANELS in fellglass.html) exactly once, under the same names and in the same
 *   order, with Weapons, Lorebounds and Armor gathered under Arsenal (ARSENAL_TABS) as the
 *   player has them. A panel added, renamed or reordered in FellGlass fails this until
 *   ThreadSpire follows.
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
const ARSENAL_TABS = arrayLiteral(TS, /var ARSENAL_TABS = (\[[\s\S]*?\]\s*\]);/);
check('ARSENAL_TABS found in threadspire.html', Array.isArray(ARSENAL_TABS), 'pattern did not match');
if (PANELS && GOD_TABS && ARSENAL_TABS){
  /* The bar may gather Weapons, Lorebounds and Armor under one Arsenal tab, the three
     drawn inside the sheet the way the player sees them. Opened out, the bar is still
     every FellGlass panel exactly once, under FellGlass's name. */
  const flat = [];
  GOD_TABS.forEach(t => { if (t[0] === 'arsenal') ARSENAL_TABS.forEach(a => flat.push(a)); else flat.push(t); });
  const want = PANELS.map(p => p[0] + ':' + p[1]).sort().join(', ');
  const got = flat.map(t => t[0] + ':' + t[1]).sort().join(', ');
  check('LoreMaster tabs reach every FellGlass panel once, under the same names', want === got,
    'fellglass: ' + want + '\n          threadspire: ' + got);
  const order = PANELS.map(p => p[0]).filter(k => !ARSENAL_TABS.some(a => a[0] === k));
  const barOrder = GOD_TABS.map(t => t[0]).filter(k => k !== 'arsenal');
  check('the bar keeps FellGlass\'s order', order.join(',') === barOrder.join(','), order.join(',') + ' vs ' + barOrder.join(','));
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
