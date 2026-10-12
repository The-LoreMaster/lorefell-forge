// Every restyled player tool carries the same copy of scripts/site-look.css and the same font link,
// and its docs/ and embeds/ copies are byte-identical. A tool is listed here once it is restyled.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TOOLS = ['join', 'fellforge', 'shardforge', 'bondforge', 'relicforge', 'brandforge', 'foeforge', 'sigilforge', 'the_anexanum'];
const FONTS = '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600&family=Cinzel:wght@500;600&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">';
const block = '/* site-look:start */\n' + fs.readFileSync(path.join(__dirname, 'site-look.css'), 'utf8').trimEnd() + '\n/* site-look:end */';

let bad = 0;
for (const t of TOOLS) {
  const docs = fs.readFileSync(path.join(ROOT, 'docs', t + '.html'), 'utf8');
  const emb = fs.readFileSync(path.join(ROOT, 'embeds', t + '.html'), 'utf8');
  const fail = (m) => { bad++; console.error(`site-look ${t}: ${m}`); };
  if (docs !== emb) fail('docs/ and embeds/ differ');
  if (!docs.includes(block)) fail('site-look block missing or edited (paste scripts/site-look.css between the markers)');
  if (!docs.includes(FONTS)) fail('font link missing or different');
  if (/Crimson Pro|Cinzel Decorative/.test(docs)) fail('still loads or names an old font');
}
if (bad) { console.error(`site-look: ${bad} problem(s)`); process.exit(1); }
console.log(`site-look: ${TOOLS.length} tools match`);
