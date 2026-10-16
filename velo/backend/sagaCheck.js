// The SagaForge's scan: every file of an adventure checked against STYLE.md and
// ADVENTURE_FORMAT.md / ADVENTURE_WRITING.md, with no model involved. Pure. It catches what a
// rule can catch: banned punctuation and words, rolls missing a result or the Fellmark line,
// non-canon skills, missing explainers and bridges, fights that don't close, foes without a want.
// What a rule can't catch is left to the cold read.

import { LISTS, WORLDS, LINEAGES } from './sagaCanon.js';

const SKILLS = LISTS.skills.concat(WORLDS.map((w) => String(w.brand || '').split(',')[0].trim()).filter(Boolean));

const BAN = [
  [/[—–]/, 'em or en dash'],
  [/(?<![-|])--(?![-|])/, 'double hyphen used as a dash'],
  [/;/, 'semicolon'],
  [/\.\.\.|…/, 'ellipsis'],
  [/\bas if\b/i, '"as if"'],
  [/\bas though\b/i, '"as though"'],
  [/(^|[.!?]\s+)Not [^.]{1,60}, but /, '"Not X, but Y"'],
  [/\b(HP|DM|XP|AC|DC)\b/, 'a game term LoreFell does not use'],
  [/\bcampaign\b/i, '"campaign" (say adventure)'],
  [/\bparty\b(?! Level| Size)/i, '"party" (say the Fell)'],
  [/\binitiative\b/i, '"initiative"'],
  [/\badvantage\b/i, '"advantage" (say Lucky)'],
  [/\brelic\b/i, '"relic" (a pack item is a utility)'],
  [/\b(your|their|his|her|its|a|each|every|next|whose) turn\b|\bturn order\b/i, '"turn" (LoreFell has rounds)'],
  [/\b(ThreadSpire|FateWell|SagaForge|website)\b/, 'names a tool (the books stand alone)'],
  [/(?<!\*)\*[A-Za-z]+\*(?![*:])/, 'single-word italics for emphasis'],
  [/\b(tapestry of|testament to|symphony of|palpable|loomed ominously|sent shivers|little did they know|in that moment)\b/i, 'stock phrase']
];

function frontEnd(t) { return t.startsWith('---') ? t.indexOf('\n---', 3) : -1; }
function typeOf(t) { const m = t.match(/^type:\s*(\S+)/m); return m ? m[1] : ''; }

// files: { path: text }. Returns [{ path, line, problem }].
export function checkFiles(files, title) {
  const out = [];
  const paths = Object.keys(files || {});
  const names = new Set(paths.map((p) => p.replace(/^.*\//, '').replace(/\.md$/, '')));
  LISTS.links.concat(LISTS.pages || [], LISTS.infusions, LISTS.augmentations, LISTS.afflictions, LISTS.combatEffects, WORLDS.map((w) => w.name), LINEAGES.map((l) => 'The ' + l.name)).forEach((n) => names.add(n));
  const flag = (path, line, problem) => out.push({ path: path, line: line, problem: problem });
  const overview = (title || '') + '.md';

  paths.forEach((path) => {
    const t = String(files[path] || '');
    const lines = t.split('\n');
    const fe = frontEnd(t);
    const fmLines = fe > 0 ? t.slice(0, fe).split('\n').length : 0;
    const body = fe > 0 ? t.slice(t.indexOf('\n', fe + 1) + 1) : t;
    const type = typeOf(t);
    if (fe < 0) flag(path, 1, 'no frontmatter');

    lines.forEach((ln, i) => {
      const inFm = i < fmLines;
      BAN.forEach(([re, msg]) => {
        if (inFm && msg !== 'semicolon' && msg !== 'em or en dash') return;
        if (/^\s*\|?\s*-{3,}/.test(ln) && msg.indexOf('hyphen') >= 0) return;
        if (re.test(ln)) flag(path, i + 1, msg);
      });
      if (/\b[A-Z]{4,}\b/.test(ln.replace(/\[\[[^\]]*\]\]/g, '')) && !inFm && !/\b(DOWN|STOP)\b/.test(ln)) flag(path, i + 1, 'capitals that read as a code (write the choice in plain words)');
      for (const m of ln.matchAll(/\[\[([^\]|#]+)/g)) {
        const target = m[1].trim().replace(/\\$/, '');
        const leaf = target.replace(/^.*\//, '');
        if (!names.has(target) && !names.has(leaf) && !/^The FellGuide\//.test(target)) flag(path, i + 1, 'link to a page that is not in this adventure or the canon list: [[' + target + ']]');
      }
    });

    // Rolls: four results, each opening with Read, and the Fellmark line.
    body.split(/\n(?=> \[!)/).forEach((b) => {
      const h = b.match(/^> \[!lorecheck\] ([A-Za-z]+):/);
      if (!h) return;
      const ln = lines.findIndex((l) => l.startsWith(b.split('\n')[0])) + 1;
      if (SKILLS.indexOf(h[1]) < 0) flag(path, ln, h[1] + ' is not a canon skill or Brand');
      ['Fellmark', 'Success', 'Failure', 'Fellstrike'].forEach((r) => {
        const m = b.match(new RegExp('- \\*\\*' + r + '\\.\\*\\* (.*)'));
        if (!m) flag(path, ln, 'the ' + h[1] + ' roll has no ' + r + ' result');
        else if (!/^\*Read:\*/.test(m[1])) flag(path, ln, 'the ' + r + ' result does not open with *Read:*');
      });
      const fm = b.match(/- \*\*Fellmark\.\*\* (.*)/);
      if (fm && !new RegExp('Their ' + h[1] + ' increases by 1\\.').test(fm[1])) flag(path, ln, 'the Fellmark does not end "Their ' + h[1] + ' increases by 1."');
      if (/\bUnlucky\b|takes? \d+ damage|\bloses? (a|an|the|their) /i.test(b)) flag(path, ln, 'a result may add a penalty');
    });

    if (type === 'scene') {
      const fmText = fe > 0 ? t.slice(0, fe) : '';
      for (const m of fmText.matchAll(/skill:\s*([A-Za-z]+)/g)) if (SKILLS.indexOf(m[1]) < 0) flag(path, 1, m[1] + ' in the checks is not a canon skill or Brand');
      const fight = /^crucible:\s*true/m.test(t);
      if (fight) ['Fatigue', 'Treasure Phase', 'Lore Point'].forEach((w) => { if (body.indexOf(w) < 0) flag(path, 1, 'the fight does not close with the ' + w); });
      if (/^order:\s*1\s*$/m.test(t)) ['Renewal', 'Lore', 'Vigilance'].forEach((s) => { if (!new RegExp('\\[!lorecheck\\] ' + s + ':').test(body)) flag(path, 1, 'the waking has no ' + s + ' roll'); });
      if (!fight && !/\[!choice\]/.test(body)) flag(path, 1, 'a scene with no fight has no choice');
      if (!/\[!reminder\] How this scene works/.test(body)) flag(path, 1, 'no "How this scene works" explainer at the top');
      if (!/\[!readaloud\] (Opening|Resolution)/.test(body)) flag(path, 1, 'no Opening read-aloud');
      if (!/\[!readaloud\] Closing/.test(body)) flag(path, 1, 'no Closing read-aloud');
    }
    if (type === 'foe') {
      const acts = (t.match(/^\s*- name:/gm) || []).length;
      if (acts !== 3) flag(path, 1, 'a foe needs 3 Acts, this one has ' + acts);
      ['affliction', 'stance', 'infusions', 'augmentations', 'react', 'loot', 'shatter_rating', 'build', 'vitality'].forEach((k) => { if (!new RegExp('^' + k + ':', 'm').test(t)) flag(path, 1, 'the foe has no ' + k); });
      ['## What it wants', '## Getting past it without a fight'].forEach((h) => { if (t.indexOf(h) < 0) flag(path, 1, 'the foe has no "' + h.slice(3) + '" section'); });
    }
    if (type === 'adventure' || path === overview) {
      ['## The choices that shape the night', '## How the night ends', '## What the foes want'].forEach((h) => { if (t.indexOf(h) < 0) flag(path, 1, 'the overview has no "' + h.slice(3) + '" section'); });
    }
  });
  return out;
}
