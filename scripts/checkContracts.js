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
const TOOLS = ['fatewell', 'foeforge', 'sigilforge', 'bondforge', 'relicforge', 'brandforge', 'shardforge', 'fellforge', 'fellglass', 'join', 'loreforge', 'the_hearth', 'threadspire'];

// genuine one-way messages handled outside the paired bridge
const ALLOW = {
  '*': ['LOREFELL_FEEDBACK_SUBMIT'],
  fellglass: ['init', 'new', 'libraries', 'ts-hand', 'ts-declare-result', 'ts-undo-result'],  // FellForge handoff, plus combat replies handled by docs/threadspire.html not the page bridge
  // The page answers THREADSPIRE_WANT_LORE for the older build under threadspire/app
  // and threadspire/dist. docs/threadspire.html never asks, so the reply lands nowhere
  // in the live tool. Kept because the older build still reads it.
  threadspire: ['THREADSPIRE_LORE', 'init']   // 'init' here is posted straight to the sheet iframe (godShow re-lighting a cached Fell), not a page-bridge message
};

// Some tools host another tool in an iframe and talk downward to it. Those types are
// not the page bridge's business, but they are still a contract: if the child stops
// handling one, the parent goes quiet with no error. Checked against the child instead.
const CHILD = {
  threadspire: { tool: 'fellglass', types: ['ts-god', 'ts-god-flush', 'ts-new', 'goto-panel', 'ts-hand-request', 'ts-declare', 'ts-undo'] }
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
    matchAll(/\.postMessage\s*\(\s*\{\s*type\s*:\s*['"]([^'"]+)['"]/g, s),
    // A page may hand its sheet bridge to a shared module and send down through an
    // injected reply(...). Reading only the page would miss every send, so the check
    // would pass by going blind. reply({ type: '...' }) is a send too.
    matchAll(/\breply\s*\(\s*\{\s*type\s*:\s*['"]([^'"]+)['"]/g, s)
  ));
}
// A page that imports a shared bridge module keeps its contract in that module. Fold the
// module's source in so the send and handle scan sees through the delegation.
function withImportedBridges(pageSrc) {
  if (!pageSrc) return pageSrc;
  let out = pageSrc;
  // A page shares client-side code from public/; it may only import web-modules from
  // backend/. Either can hold a bridge, so follow both. The folder in the import path
  // is where the file actually lives, so read from there rather than guessing.
  const re = /from\s+['"](backend|public)\/([A-Za-z0-9_.-]+\.js)['"]/g;
  let m;
  while ((m = re.exec(pageSrc))) {
    if (!/bridge/i.test(m[2])) continue;   // only shared bridge modules, not every helper
    const extra = read(path.join(ROOT, 'velo', m[1], m[2]));
    if (extra) out += '\n' + extra;
  }
  return out;
}
function handles(s) {
  return uniq([].concat(
    matchAll(/(?:\bm|\bmsg|\bd|\bdata|e\.data)\.type\s*(?:===?|!==?)\s*['"]([^'"]+)['"]/g, s),
    matchAll(/\bcase\s+['"]([^'"]+)['"]\s*:/g, s)
  ));
}
function childTypes(tool) { return (CHILD[tool] && CHILD[tool].types) || []; }
function allowed(tool, t) {
  if (PING.test(t) || t === 'ready') return true;
  if (childTypes(tool).includes(t)) return true;
  return (ALLOW['*'] || []).includes(t) || (ALLOW[tool] || []).includes(t);
}

let problems = 0;
TOOLS.forEach((tool) => {
  const toolSrc = read(path.join(ROOT, 'docs', tool + '.html'));
  // The FellGlass sheet's bridge is shared, and its sends are a contract with the
  // fellglass sheet no matter which page hosts it. ThreadSpire relays those same sends
  // to the fellglass iframe wrapped in TS_TOOL_DOWN, so they are not threadspire.html's
  // to handle: fold the shared module in for fellglass only.
  const bridgeSrc = tool === 'fellglass'
    ? withImportedBridges(read(path.join(ROOT, 'velo', 'page-' + tool + '.js')))
    : read(path.join(ROOT, 'velo', 'page-' + tool + '.js'));
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

// the downward contracts: a hosting tool and the tool it embeds
Object.keys(CHILD).forEach((parent) => {
  const spec = CHILD[parent];
  const parentSrc = read(path.join(ROOT, 'docs', parent + '.html'));
  const childSrc = read(path.join(ROOT, 'docs', spec.tool + '.html'));
  if (!parentSrc || !childSrc) { console.log('skip ' + parent + ' -> ' + spec.tool + ' (missing source)'); return; }
  const childHandles = handles(childSrc);
  const parentEmits = emits(parentSrc);
  const deaf = spec.types.filter((t) => !childHandles.includes(t));
  const silent = spec.types.filter((t) => !parentEmits.includes(t));
  if (deaf.length || silent.length) {
    problems += deaf.length + silent.length;
    console.log('\n' + parent + ' -> ' + spec.tool + ':');
    deaf.forEach((t) => console.log('  ' + parent + ' sends "' + t + '" but ' + spec.tool + ' does not handle it'));
    silent.forEach((t) => console.log('  "' + t + '" is declared for ' + spec.tool + ' but ' + parent + ' never sends it'));
  } else {
    console.log('ok ' + parent + ' -> ' + spec.tool);
  }
});

if (problems) { console.error('\n' + problems + ' contract gap(s) found'); process.exit(1); }
console.log('\nall contracts aligned');
