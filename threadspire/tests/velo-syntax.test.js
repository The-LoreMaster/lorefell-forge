/* Every Velo file is pasted into Wix by hand, so a syntax error is only found after the
 * paste, in the editor, with the page already broken. This parses each one as the ES module
 * Velo loads it as, which catches what a plain script check misses: a duplicate import is
 * an early error in a module and nothing at all in a script. (It happened: listAssets was
 * imported twice in page-threadspire.js.)
 *
 *   node threadspire/tests/velo-syntax.test.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..', 'velo');
const files = [];
(function walk(d){ fs.readdirSync(d).forEach(f => { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.js$/.test(f)) files.push(p); }); })(ROOT);
let pass = 0, fail = 0;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'velo-'));
files.forEach(f => {
  const rel = path.relative(ROOT, f);
  const out = path.join(tmp, rel.replace(/[\\/]/g, '__') + '.mjs');
  fs.copyFileSync(f, out);
  try { execFileSync(process.execPath, ['--check', out], { stdio: 'pipe' }); pass++; }
  catch (e) { fail++; console.log('  FAIL  ' + rel + '\n' + String(e.stderr || e.message).split('\n').slice(0, 5).join('\n')); }
});
console.log((fail ? '' : 'all ') + pass + ' Velo files parse' + (fail ? ', ' + fail + ' do not' : ''));
process.exit(fail ? 1 : 0);
