/* genCanon.js
   Regenerates every baked canon dataset in the tools from the seed files, so a
   canon edit touches one place. Seeds are the source of truth:
     schemas/seed/Infusions.json      -> shardforge infusion catalog
     schemas/seed/Augmentations.json  -> shardforge augment catalog, foeforge augmentations
     schemas/seed/Lorebounds.json     -> fellglass ASPECTS fallback
     data/conditions.canon.js         -> fatewell + fellglass conditions pack
   Run after any seed edit: node scripts/genCanon.js
   Then cp docs -> embeds and validate per the ritual. */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(root, f), s);
const seed = f => { const d = JSON.parse(read('schemas/seed/' + f)); return Array.isArray(d) ? d : d.items; };

let failures = 0;
function replaceOnce(file, s, re, replacement, label) {
  const m = s.match(re);
  if (!m) { console.error('MISS ' + file + ' :: ' + label); failures++; return s; }
  return s.replace(re, replacement);
}

/* Aspect presentation metadata not carried by the seed. */
const ASPECT_META = {
  Augury: 'control', Distillation: 'negation', Siphon: 'empower', Succor: 'mitigation',
  Scour: 'control', Boon: 'control', Aegis: 'mitigation', Reprisal: 'retort',
  Weave: 'empower', Forfeit: 'control', Adamant: 'mitigation', Unbind: 'restoration',
  Elude: 'negation', Pyre: 'control', Snare: 'retort', Veer: 'control',
  Reap: 'restoration', Umbra: 'control'
};

const ord = (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0);

/* ---- shardforge: infusion + augment catalogs (one-line data:[...] blocks) ---- */
(function shardforge() {
  const file = 'docs/shardforge.html';
  let s = read(file);
  const inf = seed('Infusions.json').slice().sort(ord)
    .map(r => ({ name: r.name, cat: r.attribute, desc: r.effect }));
  s = replaceOnce(file, s, /data:\[\{"name":\s?"Targeted"[^\n]*?\](?=,|\n|\})/,
    'data:' + JSON.stringify(inf), 'infusion catalog');
  const aug = seed('Augmentations.json').slice().sort(ord)
    .map(r => ({ name: r.name, cat: r.domain, core: !!r.core, desc: r.effect }));
  s = replaceOnce(file, s, /data:\[\{"name":\s?"Mistform"[^\n]*?\](?=,|\n|\})/,
    'data:' + JSON.stringify(aug), 'augment catalog');
  write(file, s);
})();

/* ---- foeforge: augmentations array ({name,type,effect}, alphabetical) ---- */
(function foeforge() {
  const file = 'docs/foeforge.html';
  let s = read(file);
  const rows = seed('Augmentations.json').slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(r => ({ name: r.name, type: r.core ? 'Core' : 'Non-Core', effect: r.effect }));
  const body = rows.map(r =>
    '    {\n      "name": ' + JSON.stringify(r.name)
    + ',\n      "type": ' + JSON.stringify(r.type)
    + ',\n      "effect": ' + JSON.stringify(r.effect) + '\n    }').join(',\n');
  s = replaceOnce(file, s, /("augmentations": \[\n)[\s\S]*?(\n  \])/,
    '$1' + body + '$2', 'augmentations array');
  write(file, s);
})();

/* ---- fatewell + fellglass: conditions pack inlined from data/conditions.canon.js ---- */
(function conditions() {
  const pack = read('data/conditions.canon.js').trim();
  const re = /\/\* LoreFell canon conditions pack\.[\s\S]*?\}\)\(typeof window!=="undefined"\?window:this\);/;
  ['docs/fatewell.html', 'docs/fellglass.html'].forEach(file => {
    let s = read(file);
    s = replaceOnce(file, s, re, pack, 'conditions pack');
    write(file, s);
  });
})();

/* ---- fellglass: ASPECTS fallback from the Lorebounds seed ---- */
(function aspects() {
  const file = 'docs/fellglass.html';
  let s = read(file);
  const rows = seed('Lorebounds.json').slice().sort(ord).map(r => ({
    name: r.aspectName,
    category: ASPECT_META[r.aspectName] || 'support',
    use: 'React',
    lorebound: r.name,
    desc: r.initial,
    initial: r.initial,
    branch: [r.branch1, r.branch2],
    crown: [r.crown1, r.crown2]
  }));
  const body = rows.map(r => '  ' + JSON.stringify(r)).join(',\n');
  s = replaceOnce(file, s, /let ASPECTS=\[[\s\S]*?\n\];/,
    'let ASPECTS=[\n' + body + '\n];', 'ASPECTS fallback');
  write(file, s);
})();

if (failures) { console.error(failures + ' target(s) missed'); process.exit(1); }
console.log('genCanon: all baked datasets regenerated from seeds');
