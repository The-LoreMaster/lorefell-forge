// Ability tier budgets are canon (CANON.md, Ability building): Tier 1 spends 1 to 2, Tier 2 spends
// 3 to 4, Tier 3 spends 5 or more with no ceiling. SigilForge's CONFIG.tierBudgets is the table every
// tool reads, so it must match, and no tool may print a Tier 3 ceiling (Nate, 2026-10-12).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CANON = { 1: [1, 2], 2: [3, 4], 3: [5, 99] };
let bad = 0;
const fail = (m) => { bad++; console.error('tier-budgets: ' + m); };

const sf = fs.readFileSync(path.join(ROOT, 'docs', 'sigilforge.html'), 'utf8');
const m = sf.match(/tierBudgets:\s*(\{[^}]*\})/);
if (!m) fail('SigilForge tierBudgets not found');
else {
  const tb = Function('return ' + m[1])();
  if (JSON.stringify(tb) !== JSON.stringify(CANON)) fail('SigilForge tierBudgets ' + m[1] + ' differ from canon ' + JSON.stringify(CANON));
}
for (const dir of ['docs', 'embeds']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter(n => n.endsWith('.html'))) {
    const s = fs.readFileSync(path.join(ROOT, dir, f), 'utf8');
    const hit = s.match(/Tier 3[^<\n]{0,40}?\b5\s*(?:-|to)\s*6\b/i);
    if (hit) fail(`${dir}/${f} gives Tier 3 a ceiling: "${hit[0]}"`);
    const data = s.match(/["']?T3["']?\s*:\s*\[\s*5\s*,\s*6\s*\]/);
    if (data) fail(`${dir}/${f} caps Tier 3 at 6 in its rule data: "${data[0].replace(/\s+/g, ' ')}"`);
  }
}
if (bad) process.exit(1);
console.log('tier-budgets: canon (1-2, 3-4, 5+)');
