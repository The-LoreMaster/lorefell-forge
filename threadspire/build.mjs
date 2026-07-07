/* build.mjs
   Parses the vault into threadspire/dist/graph.json and writes threadspire/GAPS.md.
   The wiki page is the source of truth. Read-only over the canon .md files.
   Run from threadspire/: node build.mjs */
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

const ROOT = process.env.TS_VAULT || '/home/claude/fellguide';
const LORE = join(ROOT, 'The FellGuide', 'The FellGuide', 'The Lore (Contains Spoilers)');
const SPHERE_DIR = join(LORE, 'The Sphere');
const STRATUMS = join(SPHERE_DIR, 'Stratums');
const HISTORIES = join(LORE, 'The Histories');

const gaps = [];
const nodes = [];

const slug = (s) => String(s).toLowerCase().replace(/\.md$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const read = (p) => readFileSync(p, 'utf8');
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const mdFiles = (dir) => existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')) : [];

/* first prose paragraph: skip callouts, headings, tables, images, blanks */
function firstParagraph(text, afterHeading) {
  let body = text;
  if (afterHeading) {
    const idx = body.indexOf(afterHeading);
    if (idx >= 0) body = body.slice(idx + afterHeading.length);
  }
  const lines = body.split(/\r?\n/);
  const para = [];
  for (const ln of lines) {
    const t = ln.trim();
    if (!t) { if (para.length) break; continue; }
    if (t.startsWith('>') || t.startsWith('#') || t.startsWith('|') || t.startsWith('![[') || t.startsWith('!')) {
      if (para.length) break; continue;
    }
    para.push(t);
  }
  return para.join(' ').replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1').trim();
}

function calloutField(text, field) {
  const m = text.match(new RegExp('\\*\\*' + field + ':\\*\\*\\s*([^\\n]+)'));
  return m ? m[1].trim() : '';
}

function stripArticle(s) { return s.toLowerCase().replace(/^the\s+/, '').trim(); }

/* ---- sphere ---- */
const spherePath = join(SPHERE_DIR, 'The Sphere.md');
nodes.push({
  id: 'sphere:the-sphere', type: 'sphere', parent: null, title: 'The Sphere',
  summary: existsSync(spherePath) ? firstParagraph(read(spherePath)) : '',
  spoiler: false, vaultUrl: ''
});
['The Skyvault.md', 'The Keelser.md', 'The Eternal Hunt.md'].forEach((f) => {
  if (existsSync(join(SPHERE_DIR, f))) gaps.push('Cosmology page fits no layer, skipped: ' + f);
});

/* ---- worlds ---- */
const worlds = [];
for (const f of mdFiles(STRATUMS)) {
  const title = basename(f, '.md');
  if (/^(the )?stratums$/i.test(title)) continue; // index page, not a world
  const text = read(join(STRATUMS, f));
  const w = {
    id: 'world:' + slug(title), type: 'world', parent: 'sphere:the-sphere', title,
    summary: firstParagraph(text, '## Realm Overview') || firstParagraph(text),
    lineage: calloutField(text, 'Lineage'),
    brand: calloutField(text, 'Brand'),
    spoiler: false, vaultUrl: ''
  };
  if (!w.summary) gaps.push('World has no readable summary: ' + title);
  if (!w.lineage) gaps.push('World has no Lineage in its At-a-Glance: ' + title);
  worlds.push(w); nodes.push(w);
}

/* lore-pending world for arcs that resolve to no world */
let pendingWorld = null;
function getPendingWorld() {
  if (!pendingWorld) {
    pendingWorld = {
      id: 'world:lore-pending', type: 'world', parent: 'sphere:the-sphere',
      title: 'Lore Pending', summary: 'Arcs whose world is not yet recorded in canon gather here until the vault names their Stratum.',
      lineage: '', brand: '', spoiler: false, vaultUrl: ''
    };
    nodes.push(pendingWorld);
  }
  return pendingWorld;
}

function resolveWorldForArc(arcTitle, rootText) {
  const camp = rootText.match(/>\s*A\s+([^\n]+?)\s+history/i);
  if (camp) {
    const lin = stripArticle(camp[1]);
    const hit = worlds.find((w) => stripArticle(w.lineage).includes(lin) || lin.includes(stripArticle(w.lineage) || '\u0000'));
    if (hit) return { world: hit, how: 'lineage' };
  }
  const head = rootText.split(/\r?\n/).slice(0, 40).join('\n');
  const hay = (arcTitle + '\n' + head).toLowerCase();
  const byName = worlds.find((w) => hay.includes(w.title.toLowerCase()));
  if (byName) return { world: byName, how: 'title-mention' };
  return { world: null, how: 'none' };
}

/* ---- maps, locations, scenarios ---- */
if (isDir(HISTORIES)) {
  for (const entry of readdirSync(HISTORIES)) {
    const arcDir = join(HISTORIES, entry);
    if (!isDir(arcDir)) continue;
    const rootMd = join(arcDir, entry + '.md');
    if (!existsSync(rootMd)) { gaps.push('Arc folder without a root page, skipped: ' + entry); continue; }
    const rootText = read(rootMd);
    const res = resolveWorldForArc(entry, rootText);
    let parentId;
    if (res.world) parentId = res.world.id;
    else { parentId = getPendingWorld().id; gaps.push('Arc resolves to no world, parented to Lore Pending: ' + entry); }
    const mapNode = {
      id: 'map:' + slug(entry), type: 'map', parent: parentId, title: entry,
      summary: firstParagraph(rootText), spoiler: true, vaultUrl: ''
    };
    if (res.how === 'title-mention') gaps.push('Arc world resolved by title mention, not an authored link: ' + entry);
    nodes.push(mapNode);

    const locNames = [];
    for (const lf of mdFiles(join(arcDir, 'Locations'))) {
      const lt = basename(lf, '.md');
      locNames.push(lt);
      nodes.push({
        id: 'location:' + slug(lt), type: 'location', parent: mapNode.id, title: lt,
        summary: firstParagraph(read(join(arcDir, 'Locations', lf))), spoiler: true, vaultUrl: ''
      });
    }

    for (const sf of mdFiles(join(arcDir, 'Storyline'))) {
      const m = sf.match(/^(\d+)\s*-\s*(.+)\.md$/);
      const title = m ? m[2] : basename(sf, '.md');
      const order = m ? parseInt(m[1], 10) : 0;
      const text = read(join(arcDir, 'Storyline', sf));
      const mentioned = locNames.find((ln) => text.includes(ln));
      let parent;
      if (mentioned) {
        parent = 'location:' + slug(mentioned);
        gaps.push('Scenario location inferred from text, not an authored link (inferred-location): ' + entry + ' / ' + title + ' -> ' + mentioned);
      } else {
        parent = mapNode.id;
        gaps.push('Scenario mentions no arc location, parented to its map: ' + entry + ' / ' + title);
      }
      nodes.push({
        id: 'scenario:' + slug(title), type: 'scenario', parent, title,
        summary: firstParagraph(text), spoiler: true, order, vaultUrl: ''
      });
    }
  }
} else {
  gaps.push('The Histories directory is missing entirely.');
}

/* ---- connectivity check: every node reaches the sphere ---- */
const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
let broken = 0;
for (const n of nodes) {
  let cur = n, hops = 0;
  while (cur.parent) {
    cur = byId[cur.parent];
    if (!cur || ++hops > 12) { gaps.push('BROKEN CHAIN: ' + n.id); broken++; break; }
  }
  if (cur && cur.type !== 'sphere') { gaps.push('Chain ends off-sphere: ' + n.id + ' at ' + cur.id); broken++; }
}

mkdirSync('dist', { recursive: true });
writeFileSync('dist/graph.json', JSON.stringify({ built: new Date().toISOString(), nodes }, null, 1));
writeFileSync('GAPS.md', '# ThreadSpire GAPS\n\nGenerated by build.mjs. Every hole and inference in the graph, honestly.\n\n'
  + gaps.map((g) => '- ' + g).join('\n') + '\n\nTotal nodes: ' + nodes.length + '. Broken chains: ' + broken + '.\n');
console.log('graph.json written: ' + nodes.length + ' nodes, ' + gaps.length + ' gaps, ' + broken + ' broken chains');
if (broken) process.exit(1);
