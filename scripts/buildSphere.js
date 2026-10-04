#!/usr/bin/env node
// scripts/buildSphere.js
// Bakes the Sphere widget (docs/the_sphere.html) from the FellGuide vault.
// The vault is the only source of world text. The widget never carries copy of its own,
// so a page edited in Obsidian reaches the Sphere on the next build with nothing to retype.
//
//   VAULT_DIR=../lorefell-fellguide node scripts/buildSphere.js
//   node scripts/buildSphere.js --vault /path/to/lorefell-fellguide [--check]
//
// --check exits 1 when docs/the_sphere.html is stale against the vault (nothing is written).
// Every FellGuide link is built from the file's real path in the vault, so a folder rename
// in Obsidian can never strand a link again: the next build simply follows it.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'sphere', 'sphere.config.json'), 'utf8'));
const TEMPLATE = path.join(ROOT, 'sphere', 'template.html');
const OUT = path.join(ROOT, 'docs', 'the_sphere.html');

function vaultDir() {
  const i = process.argv.indexOf('--vault');
  if (i >= 0 && process.argv[i + 1]) return path.resolve(process.argv[i + 1]);
  if (process.env.VAULT_DIR) return path.resolve(process.env.VAULT_DIR);
  console.error('Set the vault path: VAULT_DIR=../lorefell-fellguide or --vault <path>');
  process.exit(1);
}
const VAULT = vaultDir();
const CHECK = process.argv.includes('--check');

/* ------------------------------------------------------------------ vault index */
// Every published page, keyed by lower-cased file name, so [[wikilinks]] resolve the way
// Obsidian resolves them. _Canon is excluded from Publish; Archive is never linked to.
const PAGES = {};
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    const rel = path.relative(VAULT, full).split(path.sep).join('/');
    if (ent.isDirectory()) {
      if (rel === '_Canon' || rel === 'Archive') continue;
      walk(full);
    } else if (ent.name.endsWith('.md')) {
      const key = ent.name.slice(0, -3).toLowerCase();
      if (!PAGES[key]) PAGES[key] = rel;
    }
  }
}
walk(VAULT);

// Obsidian Publish address for a vault path: path segments, spaces as +, no .md.
function publishUrl(rel) {
  const segs = rel.replace(/\.md$/, '').split('/').map((s) => encodeURIComponent(s).replace(/%20/g, '+'));
  return CONFIG.fellguideBase + segs.join('/');
}
function pageUrl(name) {
  const rel = PAGES[String(name).split('#')[0].trim().toLowerCase()];
  return rel ? publishUrl(rel) : null;
}

function findDir(start, name) {
  const hit = Object.values(PAGES).find((r) => r.split('/').slice(-2, -1)[0] === name);
  return hit ? path.dirname(hit) : null;
}
const STRATUMS = findDir(VAULT, 'Stratums');
const SPHERE_DIR = STRATUMS ? path.dirname(STRATUMS) : null;
if (!STRATUMS) { console.error('No Stratums folder found in the vault.'); process.exit(1); }
const read = (rel) => fs.readFileSync(path.join(VAULT, rel), 'utf8');

/* ------------------------------------------------------------------ markdown */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s) {
  // Pull links out first so their text is not mangled by the emphasis pass.
  const keep = [];
  const hold = (h) => '\u0000' + (keep.push(h) - 1) + '\u0000';
  s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, target, label) => {
    const text = label || target.split('#')[0];
    const url = pageUrl(target);
    return hold(url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>` : esc(text));
  });
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (m, text, url) =>
    hold(`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>`));
  s = esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(\[\u201c])\*([^*\s](?:[^*]*?[^*\s])?)\*(?=[\s.,:!?)\]\u201d]|$)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => keep[+i]);
}
const plain = (s) => String(s)
  .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, t, l) => l || t.split('#')[0])
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*?([^*]+)\*\*?/g, '$1').trim();

function clean(md) {
  return md.replace(/\r/g, '')
    .replace(/^---\n[\s\S]*?\n---\n/, '')       // front matter
    .replace(/<!--[\s\S]*?-->/g, '')           // hidden notes
    .replace(/!\[\[[^\]]*\]\]/g, '');           // image embeds
}

// Split a body into blocks: para, list, table, callout, quote.
function blocks(md) {
  const out = [];
  const lines = md.split('\n');
  for (let i = 0; i < lines.length;) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }
    if (/^>/.test(ln)) {
      const q = [];
      while (i < lines.length && /^>/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''));
      const c = q[0].match(/^\[!(\w+)\][-+]?\s*(.*)$/);
      if (c) out.push({ t: 'callout', kind: c[1].toLowerCase(), title: c[2].trim(), body: q.slice(1).join('\n') });
      else out.push({ t: 'quote', lines: q });
      continue;
    }
    if (/^\s*\|/.test(ln)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const body = rows.filter((r) => !/^\s*\|[\s:|-]+\|\s*$/.test(r)).map(cells);
      out.push({ t: 'table', head: body[0], rows: body.slice(1) });
      continue;
    }
    if (/^\s*[-*]\s+/.test(ln)) {
      const items = [];
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^\s*[-*]\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        else items[items.length - 1] += ' ' + lines[i].trim();
        i++;
      }
      out.push({ t: 'list', items });
      continue;
    }
    if (/^#{1,6}\s/.test(ln)) {
      // A page's own # title is the page name; deeper headings become sub-heads.
      if (!/^#\s/.test(ln)) out.push({ t: 'sub', text: ln.replace(/^#+\s*/, '') });
      i++; continue;
    }
    const p = [ln.trim()]; i++;
    while (i < lines.length && lines[i].trim() && !/^(>|\s*\||\s*[-*]\s+|#{1,6}\s)/.test(lines[i])) p.push(lines[i++].trim());
    out.push({ t: 'para', text: p.join(' ') });
  }
  return out;
}

function render(bs) {
  return bs.map((b) => {
    if (b.t === 'para') return `<p>${inline(b.text)}</p>`;
    if (b.t === 'sub') return `<div class="sub">${inline(b.text)}</div>`;
    if (b.t === 'table') {
      return `<div class="tbl"><table class="lf"><tr>${b.head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr>` +
        b.rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('') + '</table></div>';
    }
    if (b.t === 'list') {
      // "**Name.** text" items read as headed entries (challenges and the like).
      if (b.items.every((it) => /^\*\*[^*]+\*\*/.test(it))) {
        return b.items.map((it) => {
          const m = it.match(/^\*\*([^*]+?)\.?\*\*\.?\s*(.*)$/);
          return `<div class="chal"><div class="ch-t">${inline(m[1])}</div><p>${inline(m[2])}</p></div>`;
        }).join('');
      }
      return `<ul class="lst">${b.items.map((it) => `<li>${inline(it)}</li>`).join('')}</ul>`;
    }
    if (b.t === 'callout') {
      const inner = render(blocks(b.body));
      return `<div class="note">${b.title ? `<div class="nt">${inline(b.title)}</div>` : ''}${inner}</div>`;
    }
    if (b.t === 'quote') {
      const s = saying(b);
      if (s) return `<div class="w-saying">${inline(s.text)}<span class="attr">${inline(s.attr)}</span></div>`;
      return `<blockquote>${render(blocks(b.lines.join('\n')))}</blockquote>`;
    }
    return '';
  }).join('');
}

// A saying is a blockquote whose first line is an italic quotation and whose last line names the speaker.
function saying(b) {
  const ls = b.lines.map((l) => l.trim()).filter(Boolean);
  if (ls.length < 2) return null;
  const q = ls[0].match(/^\*\s*["\u201c](.+?)["\u201d]\s*\*$/);
  if (!q) return null;
  return { text: q[1], attr: ls[ls.length - 1] };
}

// Page -> { head: blocks before the first ##, sections: [{ title, blocks }] }
function parsePage(rel) {
  const md = clean(read(rel));
  const parts = md.split(/^##\s+(.+?)\s*$/m);
  const head = blocks(parts[0]);
  const sections = [];
  for (let i = 1; i < parts.length; i += 2) sections.push({ title: parts[i].trim(), blocks: blocks(parts[i + 1] || '') });
  return { head, sections };
}

function glanceOf(head) {
  const c = head.find((b) => b.t === 'callout' && /at a glance/i.test(b.title));
  if (!c) return [];
  return c.body.split('\n').map((l) => l.match(/^\*\*(.+?):\*\*\s*(.+)$/)).filter(Boolean).map((m) => [m[1].trim(), m[2].trim()]);
}

function firstSentence(bs) {
  const para = bs.find((b) => b.t === 'para');
  let text = '';
  if (para) text = plain(para.text);
  else {
    const list = bs.find((b) => b.t === 'list');
    if (list) {
      const names = list.items.map((it) => (it.match(/^\*\*([^*]+?)\.?\*\*/) || [])[1]).filter(Boolean);
      if (names.length) return names.length > 3 ? names.slice(0, 3).join(', ') + ', and more.' : names.join(', ') + '.';
    }
    const tbl = bs.find((b) => b.t === 'table');
    if (tbl) return tbl.rows.length + ' powers, and what each one wants.';
  }
  const m = text.match(/^.+?[.!?](?=\s+[A-Z"\u201c]|$)/);
  let s = m ? m[0] : text;
  if (s.length > 170) s = s.slice(0, s.lastIndexOf(' ', 165)) + '\u2026';
  return s;
}

/* ------------------------------------------------------------------ lorebounds */
// A lorebound's home world is the first world named in its description.
const worldFiles = fs.readdirSync(path.join(VAULT, STRATUMS)).filter((f) => f.endsWith('.md') && f !== 'Stratums.md');
const worldNames = worldFiles.map((f) => f.slice(0, -3));

const LOREBOUNDS = {};
const lbDir = Object.values(PAGES).find((r) => /\/Lorebound Types\/Lorebound Types\.md$/.test(r));
if (lbDir) {
  const dir = path.dirname(lbDir);
  for (const f of fs.readdirSync(path.join(VAULT, dir))) {
    if (!f.endsWith('.md') || f === 'Lorebound Types.md') continue;
    const rel = dir + '/' + f;
    const md = clean(read(rel));
    const descMd = md.split(/^#{1,6}\s/m)[0];
    const desc = blocks(descMd).filter((b) => b.t === 'para');
    if (!desc.length) continue;
    const text = desc.map((b) => b.text).join(' ');
    let home = null, at = Infinity;
    for (const w of worldNames) {
      const k = text.search(new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b'));
      if (k >= 0 && k < at) { at = k; home = w; }
    }
    if (!home) continue;
    const asp = md.match(/Aspect\s*\n+\*\*([^*]+)\*\*(?:\s*\n\*([^*]+)\*)?/);
    (LOREBOUNDS[home] = LOREBOUNDS[home] || []).push({
      name: f.slice(0, -3), url: publishUrl(rel), desc,
      aspect: asp ? asp[1].trim() : '', aspectLine: asp && asp[2] ? asp[2].trim() : ''
    });
  }
}

/* ------------------------------------------------------------------ related pages */
// The FellGuide keeps a world's people, magic, figures and powers on their own pages.
// The Sphere gathers them back onto the world.
const pagesIn = (re) => Object.values(PAGES).filter((r) => re.test(r));
const LINEAGE_PAGES = pagesIn(/\/The Lineages\/(?!The Lineages\.md$)[^/]+\.md$/);
const BRAND_PAGES = pagesIn(/\/Brands of Magic\/(?!Brands of Magic\.md$)[^/]+\.md$/);
const LORE_PEOPLE = pagesIn(/\/Characters\/.+\.md$/);
const stem = (rel) => path.basename(rel, '.md');
const norm = (s) => plain(s).replace(/\s+/g, ' ').trim().toLowerCase();

function lineagePage(word) {
  const w = word.toLowerCase();
  return LINEAGE_PAGES.find((r) => {
    const n = stem(r).replace(/^The\s+/, '').toLowerCase();
    return n === w || n.startsWith(w) || w.startsWith(n);
  }) || null;
}
function brandPage(brand) {
  return BRAND_PAGES.find((r) => stem(r).toLowerCase() === String(brand).toLowerCase()) || null;
}
// Body of a stand-alone page, minus its title, profile and spoiler callouts.
function pageBody(rel) {
  return blocks(clean(read(rel))).filter((b) => !(b.t === 'callout' && /(profile|at a glance|spoiler)/i.test(b.title + ' ' + b.kind)));
}
function firstProse(rel) { return firstSentence(pageBody(rel)); }

// Who and what belongs to each world: characters by their Home World line, factions and
// Aspects of Discord by the world named in their At a Glance callout.
const RELATED = {};
for (const rel of LORE_PEOPLE) {
  const name = stem(rel);
  if (path.basename(path.dirname(rel)) === name) continue;          // folder index pages
  const md = clean(read(rel));
  const home = md.match(/\*\*Home World:\*\*\s*(.+)/);
  const glance = (md.match(/^> \[!note\][^\n]*at a Glance\n((?:>.*\n?)+)/im) || [])[1] || '';
  const kind = /Canon Characters/.test(rel) ? 'Figures' : /Aspects of Discord/.test(rel) ? 'Aspects of Discord' : 'Powers';
  const hits = new Set();
  if (home) hits.add(home[1].trim());
  for (const w of worldNamesAll()) if (glance && new RegExp('\\b' + w + '\\b').test(glance)) hits.add(w);
  for (const w of hits) (RELATED[w] = RELATED[w] || []).push({ name, kind, url: publishUrl(rel), line: firstProse(rel) });
}
function worldNamesAll() { return fs.readdirSync(path.join(VAULT, STRATUMS)).filter((f) => f.endsWith('.md') && f !== 'Stratums.md').map((f) => f.slice(0, -3)); }

/* ------------------------------------------------------------------ worlds */
const RUNE = { world: '\u16a0', brand: '\u16b9', lineage: '\u16d6', lorebound: '\u16c8', campaign: '\u16df', factions: '\u16a8', challenges: '\u16be', lore: '\u16d2' };
const titleCase = (s) => s.replace(/^the\s+/i, 'The ');

function buildWorld(name) {
  const rel = STRATUMS + '/' + name + '.md';
  const url = publishUrl(rel);
  const { head, sections } = parsePage(rel);
  const glance = glanceOf(head);
  const g = Object.fromEntries(glance.map(([k, v]) => [k.toLowerCase(), v]));
  const lineage = titleCase(g.lineage || '');
  const lineageWord = lineage.replace(/^The\s+/, '');
  const [brand, art] = (g.brand || '').split(/,\s*the art of\s*/i).map((s) => (s || '').trim());
  const q = head.find((b) => b.t === 'quote' && saying(b));
  const say = q ? saying(q) : null;

  // "Canon coming soon" belongs to the world, not to whichever section it sits under.
  let soon = null;
  sections.forEach((s) => {
    s.blocks = s.blocks.filter((b) => {
      if (b.t === 'callout' && /coming soon/i.test(b.title)) { soon = render(blocks(b.body)) || null; return false; }
      return true;
    });
  });

  const lbs = (LOREBOUNDS[name] || []).slice();
  const core = [], rest = [];
  for (const s of sections) {
    const h = s.title, card = { title: h, html: render(s.blocks), teaser: firstSentence(s.blocks), url, _paras: s.blocks.filter((b) => b.t === 'para').map((b) => b.text) };
    if (/^realm overview$/i.test(h)) core[0] = { ...card, key: 'world', tag: 'The Realm', title: 'The World', rune: RUNE.world };
    else if (!core[1] && [brand, art].some((b) => b && h.toLowerCase() === b.toLowerCase()))
      core[1] = { ...card, key: 'brand', tag: 'Brand of Magic', lead: 'Brand of ' + name + (art ? ' \u00b7 the art of ' + art : ''), rune: RUNE.brand };
    else if (lineageWord && new RegExp('\\b' + lineageWord + '\\w*\\b', 'i').test(h) && !core[2]) core[2] = { ...card, key: 'lineage', tag: 'Lineage', rune: RUNE.lineage };
    else if (lbs.some((lb) => lb.name.toLowerCase() === h.toLowerCase())) {
      const lb = lbs.splice(lbs.findIndex((x) => x.name.toLowerCase() === h.toLowerCase()), 1)[0];
      core.push({ ...card, key: 'lb:' + lb.name, tag: 'Lorebound', rune: RUNE.lorebound, html: card.html + aspectHtml(lb), url: lb.url, linkLabel: lb.name });
    }
    else if (/^the factions$/i.test(h)) rest.push({ ...card, key: 'factions', tag: 'Powers', rune: RUNE.factions });
    else if (/^current challenges$/i.test(h)) rest.push({ ...card, key: 'challenges', tag: 'Threats', rune: RUNE.challenges });
    else rest.push({ ...card, key: 'sec:' + rest.length, tag: 'Lore', rune: RUNE.lore });
  }
  for (const lb of lbs) {
    core.push({ key: 'lb:' + lb.name, tag: 'Lorebound', rune: RUNE.lorebound, title: lb.name, url: lb.url, linkLabel: lb.name,
      teaser: firstSentence(lb.desc), html: render(lb.desc) + aspectHtml(lb) });
  }
  const camp = CONFIG.campaigns[name];
  if (camp) {
    let html = '', teaser = 'Watch the campaign played in ' + name + '.', curl = url, label = null;
    const hist = camp.history && PAGES[camp.history.toLowerCase()];
    if (hist) {
      const hp = parsePage(hist);
      const intro = hp.head.filter((b) => b.t === 'para').slice(0, 2);
      if (intro.length) { html += render(intro); teaser = firstSentence(intro); }
      curl = publishUrl(hist); label = camp.history;
    }
    html += `<p><a class="watch-link" href="${esc(camp.url)}" target="_blank" rel="noopener">&#9654;&nbsp; Watch ${esc(camp.name)} on YouTube</a></p>`;
    core.push({ key: 'campaign', tag: 'The Fell', rune: RUNE.campaign, title: camp.name, teaser, html, url: curl, linkLabel: label });
  }
  // Lineage: the lineage's own FellGuide page, with what the world page adds about them.
  const lp = lineagePage(lineageWord);
  if (lp) {
    const body = pageBody(lp), own = core[2];
    core[2] = { key: 'lineage', tag: 'Lineage', rune: RUNE.lineage, title: lineage, lead: 'Lineage of ' + name,
      teaser: firstSentence(body), url: publishUrl(lp), linkLabel: lineage,
      html: render(body) + (own ? `<div class="sub">${esc(lineage)} of ${esc(name)}</div>` + own.html : '') };
  }
  // Brand: the Brand's own page (lore, in battle, outside battle). The world page's copy is
  // usually the same lore paragraph, so it is only kept when it says something the page does not.
  const bp = brandPage(brand);
  if (bp) {
    const body = pageBody(bp), own = core[1];
    const pageText = norm(body.map((b) => b.text || '').join(' '));
    const extra = own && own.html && !own._paras.every((p) => pageText.includes(norm(p)));
    core[1] = { key: 'brand', tag: 'Brand of Magic', rune: RUNE.brand, title: brand,
      lead: 'Brand of ' + name + (art ? ' \u00b7 the art of ' + art : ''),
      teaser: firstSentence(body.filter((b) => b.t === 'para' && !/^\*Also called/i.test(b.text))), url: publishUrl(bp), linkLabel: brand,
      html: render(body) + (extra ? `<div class="sub">${esc(brand)} in ${esc(name)}</div>` + own.html : '') };
  }
  // Figures and powers tied to this world.
  const tied = (RELATED[name] || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  if (tied.length) {
    const groups = ['Figures', 'Powers', 'Aspects of Discord'].map((k) => [k, tied.filter((r) => r.kind === k)]).filter(([, l]) => l.length);
    const html = groups.map(([k, l]) => `<div class="sub">${esc(k)}</div>` + l.map((r) =>
      `<div class="chal"><div class="ch-t"><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a></div>${r.line ? `<p>${esc(r.line)}</p>` : ''}</div>`).join('')).join('');
    const names = tied.map((r) => r.name);
    rest.unshift({ key: 'people', tag: 'People and Powers', rune: RUNE.factions, title: 'Figures and Forces', url,
      teaser: (names.length > 3 ? names.slice(0, 3).join(', ') + ', and more' : names.join(', ').replace(/, ([^,]*)$/, ' and $1')) + '.', html });
  }
  const cards = [core[0], core[1], core[2], ...core.slice(3)].filter(Boolean).concat(rest).map(({ _paras, ...c }) => c);
  return {
    name, url, lineage, brand, art,
    glance: glance.filter(([k]) => !/^(lineage|brand)$/i.test(k)),
    saying: say ? { text: inline(say.text), attr: inline(say.attr) } : null,
    soon, cards
  };
}
function aspectHtml(lb) {
  if (!lb.aspect) return '';
  return `<div class="note"><div class="nt">Aspect</div><p><strong>${esc(lb.aspect)}</strong>${lb.aspectLine ? '. ' + inline(lb.aspectLine) : ''}</p></div>`;
}

/* ------------------------------------------------------------------ about */
function aboutPage(file) {
  const rel = SPHERE_DIR + '/' + file + '.md';
  if (!fs.existsSync(path.join(VAULT, rel))) return null;
  const { head, sections } = parsePage(rel);
  const q = head.find((b) => b.t === 'quote' && saying(b));
  const s = q ? saying(q) : null;
  return {
    title: file, url: publishUrl(rel),
    saying: s ? { text: inline(s.text), attr: inline(s.attr) } : null,
    sections: sections.map((x) => [x.title, render(x.blocks)])
  };
}

/* ------------------------------------------------------------------ assemble */
const worlds = {};
const problems = [];
for (const n of worldNames) {
  try { worlds[n] = buildWorld(n); } catch (e) { problems.push(n + ': ' + e.message); }
}
const placed = new Set();
const rings = CONFIG.rings.map((r) => r.filter((w) => {
  if (!worlds[w]) { console.warn('warning: ' + w + ' is in the ring layout but has no page in Stratums; skipped.'); return false; }
  placed.add(w); return true;
}));
for (const w of worldNames.sort()) if (!placed.has(w)) { rings[rings.length - 1].push(w); console.warn('note: ' + w + ' is new, placed on the outer ring.'); }

for (const w of Object.values(worlds)) {
  if (!w.brand) problems.push(w.name + ': no Brand line in the At a Glance callout');
  if (!w.cards.length) problems.push(w.name + ': no sections');
  if (!w.cards.some((c) => c.key === 'world')) problems.push(w.name + ': no Realm Overview section');
}
if (problems.length) { console.error('The Sphere cannot be built:\n  ' + problems.join('\n  ')); process.exit(1); }

let sha = '';
try { sha = execFileSync('git', ['-C', VAULT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch (e) { /* not a checkout */ }

const data = {
  rings,
  worlds,
  about: [aboutPage('The Sphere'), aboutPage('The Skyvault')].filter(Boolean)
};
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const html = fs.readFileSync(TEMPLATE, 'utf8').replace('/*__SPHERE_DATA__*/null', () => json);

const before = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
if (CHECK) {
  if (before !== html) { console.error('docs/the_sphere.html is stale against the vault. Run scripts/buildSphere.js.'); process.exit(1); }
  console.log('The Sphere is current with the vault' + (sha ? ' at ' + sha : '') + '.');
} else {
  fs.writeFileSync(OUT, html);
  const cards = Object.values(worlds).reduce((n, w) => n + w.cards.length, 0);
  console.log(`${before === html ? 'Unchanged' : 'Wrote'} docs/the_sphere.html: ${Object.keys(worlds).length} worlds, ${cards} cards` + (sha ? `, vault ${sha}` : '') + '.');
}
