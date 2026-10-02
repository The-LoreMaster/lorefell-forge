// scripts/syncSigilRules.js
// The table's Summon a foe builds acts by the SigilForge's rules, so it carries the SigilForge's
// own component list (damage packages, targets, combat effects, afflictions with their
// families and costs) and its tier budgets. This copies them from docs/sigilforge.html into
// docs/threadspire.html between the SIGIL_RULES markers. Run with --check to fail when they
// have drifted (part of npm run checks).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const sf = fs.readFileSync(path.join(root, 'docs/sigilforge.html'), 'utf8');
const a = sf.indexOf('const COMPONENTS = ['); const b = sf.indexOf('\n];', a);
if (a < 0 || b < 0) { console.error('SigilForge COMPONENTS not found'); process.exit(1); }
const comps = sf.slice(a + 'const COMPONENTS = '.length, b + 2);
const tb = sf.match(/tierBudgets:\s*(\{[^}]*\})/);
if (!tb) { console.error('SigilForge tierBudgets not found'); process.exit(1); }
const block = '/*SIGIL_RULES_BEGIN (copied from docs/sigilforge.html by scripts/syncSigilRules.js; do not edit here)*/\n'
  + 'var SIGIL_COMPONENTS = ' + comps + ';\nvar SIGIL_TIER_BUDGETS = ' + tb[1] + ';\n/*SIGIL_RULES_END*/';
const tsPath = path.join(root, 'docs/threadspire.html');
let ts = fs.readFileSync(tsPath, 'utf8');
const s = ts.indexOf('/*SIGIL_RULES_BEGIN'), e = ts.indexOf('/*SIGIL_RULES_END*/');
if (s < 0 || e < 0) { console.error('SIGIL_RULES markers missing in threadspire.html'); process.exit(1); }
const cur = ts.slice(s, e + '/*SIGIL_RULES_END*/'.length);
if (process.argv.includes('--check')) {
  if (cur !== block) { console.error('Sigil rules in threadspire.html have drifted from sigilforge.html: run node scripts/syncSigilRules.js'); process.exit(1); }
  console.log('sigil rules in step'); process.exit(0);
}
ts = ts.slice(0, s) + block + ts.slice(e + '/*SIGIL_RULES_END*/'.length);
fs.writeFileSync(tsPath, ts);
console.log('sigil rules copied');
