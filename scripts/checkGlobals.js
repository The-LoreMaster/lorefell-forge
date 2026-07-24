// scripts/checkGlobals.js
// Static check for globals that are read but never given a value.
//
// window._tsAsk was read in five places in ThreadSpire and assigned in none, so every
// guard on it was permanently false: the combat state never reached the players' sheets,
// the declares never came back, the party and published lookups never ran, and the
// adventure switcher reported that the page had not answered a question it never asked.
// Nothing catches this. It is valid JavaScript, the syntax check passes, the symbol
// audit passes because every function called does exist, and the failure is silence.
//
// So: find every `window.NAME` read, find every `window.NAME =` write, and report the
// reads with no matching write. Run with: npm run globals
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIRS = ['docs', 'velo'];

// Names the browser or a library owns. A read with no write is correct for these.
const BUILTIN = new Set([
  'location', 'parent', 'top', 'self', 'document', 'innerWidth', 'innerHeight',
  'localStorage', 'sessionStorage', 'navigator', 'history', 'screen', 'frames',
  'devicePixelRatio', 'scrollY', 'scrollX', 'origin', 'crypto', 'performance',
  'matchMedia', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'fetch', 'alert',
  'confirm', 'prompt', 'open', 'close', 'print', 'focus', 'blur', 'addEventListener',
  'removeEventListener', 'postMessage', 'URL', 'Image', 'FileReader', 'Blob',
  'Promise', 'JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean',
  'isNaN', 'parseInt', 'parseFloat', 'encodeURIComponent', 'decodeURIComponent',
  'THREE', 'React', 'jQuery', '$', 'wixDevelopersAnalytics', 'Wix',
  'scrollTo', 'scrollBy', 'pageYOffset', 'pageXOffset', 'getSelection',
  'ResizeObserver', 'IntersectionObserver', 'MutationObserver', 'clipboardData',
  'speechSynthesis', 'AudioContext', 'webkitAudioContext', 'visualViewport',
  'onmessage', 'onerror', 'onresize', 'onload', 'onbeforeunload', 'name', 'status'
]);

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; } }

function sources() {
  const out = [];
  DIRS.forEach((d) => {
    const dir = path.join(ROOT, d);
    let names = [];
    try { names = fs.readdirSync(dir); } catch (e) { return; }
    names.forEach((n) => {
      const full = path.join(dir, n);
      let st = null; try { st = fs.statSync(full); } catch (e) { return; }
      if (st.isDirectory()) {
        let inner = []; try { inner = fs.readdirSync(full); } catch (e) { return; }
        inner.forEach((i) => { if (/\.(js|html)$/.test(i)) out.push(path.join(full, i)); });
        return;
      }
      if (/\.(js|html)$/.test(n)) out.push(full);
    });
  });
  return out;
}

function matchAll(re, s) { const o = []; let m; while ((m = re.exec(s))) o.push(m[1]); return o; }

// Reads of the real global object only. `rect.window.height` is a property on someone
// else's object, not a global, so anything preceded by a dot or word character is out.
const READ = /(?<![.\w$])window\.([A-Za-z_$][\w$]*)/g;
// Writes are collected through any receiver, repo wide. The idiom varies: window.X =,
// but also root.X = and g.X = inside an IIFE handed the window. Resolving those aliases
// properly is more machinery than this earns; accepting any receiver keeps the check
// quiet on real code while still catching a name written by nobody at all.
const WRITE = /(?:^|[^.\w$])(?:[A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*=(?!=)/g;
// A plain top level declaration is reachable as window.NAME in a browser.
const DECL = /(?:^|\n)\s*(?:var|let|const|function)\s+([A-Za-z_$][\w$]*)/g;

const files = sources();
const written = new Set();
const declared = new Set();
const texts = {};
files.forEach((f) => {
  const src = read(f);
  if (!src) return;
  texts[f] = src;
  matchAll(WRITE, src).forEach((n) => written.add(n));
  matchAll(DECL, src).forEach((n) => declared.add(n));
});

let problems = 0;
files.forEach((f) => {
  const src = texts[f];
  if (!src) return;
  const dead = Array.from(new Set(matchAll(READ, src)))
    .filter((n) => !BUILTIN.has(n) && !written.has(n) && !declared.has(n));
  if (!dead.length) return;
  problems += dead.length;
  console.log('\n' + path.relative(ROOT, f) + ':');
  dead.forEach((n) => {
    const reads = (src.match(new RegExp('window\\.' + n + '\\b', 'g')) || []).length;
    console.log('  window.' + n + ' read ' + reads + ' time(s), assigned nowhere in the repo');
  });
});

if (problems) {
  console.error('\n' + problems + ' global(s) read but never set');
  console.error('Either assign it, or use the condition it was standing in for.');
  process.exit(1);
}
console.log('no globals are read without being set');
