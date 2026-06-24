// scripts/checkContracts.js
// Static check that each tool and its page bridge agree on postMessage types. A tool
// that emits a type nobody handles, or a bridge that emits a type the tool never reads,
// is a silent break. This scans both sides and reports the gaps.
//
// Handler idioms vary across tools (m.type, msg.type, d.type, data.type, switch/case,
// and !== guards), so detection covers all of them. HEIGHT and READY pings are one-way
// by design (the bridge may ignore them), so they are skipped. Genuine one-offs go in
// ALLOW. Run with: npm run contracts
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOOLS = ['fatewell', 'foeforge', 'sigilforge', 'bondforge', 'relicforge', 'brandforge', 'shardforge', 'fellforge', 'fellglass'];

// genuine one-way messages handled outside the paired bridge
const ALLOW = {
  '*': ['LOREFELL_FEEDBACK_SUBMIT'],
  fellglass: ['init', 'new', 'libraries']   // also driven by the FellForge handoff
};
// one-way ping families: resize and readiness pings a bridge may legitimately ignore
const PING = /(?:HEIGHT|READY)$/i;

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; } }
function uniq(a) { return Array.from(new Set(a)); }
function matchAll(re, s) { const o = []; let m; while ((m = re.exec(s))) o.push(m[1]); return o; }

function emits(s) {
  return uniq([].concat(
    matchAll(/post(?:ToWix|Message)?\s*\(\s*\{\s*type\s*:\s*['"]([^'"]+)['"]/g, s),
    matchAll(/\bpost\s*\(\s*\{\s*type\s*:\s*['"]([^'"]+)['"]/g, s),
    matchAll(/\.postMessage\s*\(\s*\{\s*type\s*:\s*['"]([^'"]+)['"]/g, s)
  ));
}
function handles(s) {
  return uniq([].concat(
    matchAll(/(?:\bm|\bmsg|\bd|\bdata|e\.data)\.type\s*(?:===?|!==?)\s*['"]([^'"]+)['"]/g, s),
    matchAll(/\bcase\s+['"]([^'"]+)['"]\s*:/g, s)
  ));
}
function allowed(tool, t) {
  if (PING.test(t) || t === 'ready') return true;
  return (ALLOW['*'] || []).includes(t) || (ALLOW[tool] || []).includes(t);
}

let problems = 0;
TOOLS.forEach((tool) => {
  const toolSrc = read(path.join(ROOT, 'docs', tool + '.html'));
  const bridgeSrc = read(path.join(ROOT, 'velo', 'page-' + tool + '.js'));
  if (!toolSrc || !bridgeSrc) { console.log('skip ' + tool + ' (missing tool or bridge)'); return; }

  const toolEmits = emits(toolSrc), toolHandles = handles(toolSrc);
  const bridgeEmits = emits(bridgeSrc), bridgeHandles = handles(bridgeSrc);

  const emitUnheard = toolEmits.filter((t) => !bridgeHandles.includes(t) && !allowed(tool, t));
  const recvUnsent = bridgeEmits.filter((t) => !toolHandles.includes(t) && !allowed(tool, t));

  if (emitUnheard.length || recvUnsent.length) {
    problems += emitUnheard.length + recvUnsent.length;
    console.log('\n' + tool + ':');
    emitUnheard.forEach((t) => console.log('  tool emits "' + t + '" but the bridge does not handle it'));
    recvUnsent.forEach((t) => console.log('  bridge emits "' + t + '" but the tool does not handle it'));
  } else {
    console.log('ok ' + tool);
  }
});

if (problems) { console.error('\n' + problems + ' contract gap(s) found'); process.exit(1); }
console.log('\nall contracts aligned');
