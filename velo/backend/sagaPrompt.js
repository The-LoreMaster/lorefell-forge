// The SagaForge's writer: the questions it asks, the request it sends for each stage, and how it
// reads what comes back. Pure: no database, no network. The site's stream endpoint sends what
// buildRequest returns to Claude, and the tool and the backend read results with parseResult.
//
// The method is _Canon/ADVENTURE_WRITING.md in the vault, carried here in sagaCanon.js. Every
// request starts from the same long system prompt (house rules, format, canon, the worked
// example), which is cached, then the world, then the LoreMaster's own house rules.

import { HOUSE, WORLDS, LINEAGES, LISTS, EXAMPLE } from './sagaCanon.js';

export const MODEL = 'claude-opus-5-5';

export const QUESTIONS = [
  { id: 'type', round: 1, label: 'Type', help: 'Tale is one session. Story is 3 to 6. Legacy is 10 to 12. Chronicle is an open table.', pick: ['Tale', 'Story', 'Legacy', 'Chronicle'] },
  { id: 'world', round: 1, label: 'World', help: 'The world the Fell wake on. Its Brand comes with the waking.', pick: 'worlds' },
  { id: 'table', round: 1, label: 'The Fell', help: 'How many, what level, and which lineages if you know them.' },
  { id: 'length', round: 1, label: 'Sessions', help: 'How many, and how long each runs.' },
  { id: 'question', round: 2, label: 'The question', help: 'The one question the adventure answers.' },
  { id: 'patron', round: 2, label: 'Who needs the Fell', help: 'And why they cannot do it themselves.' },
  { id: 'opposition', round: 2, label: 'What stands against them', help: 'A person or a force, and what it wants that makes sense from where it stands.' },
  { id: 'count', round: 2, label: 'The count', help: 'What the table measures: shards, days, rafts. Optional for a Tale.' },
  { id: 'moments', round: 2, label: 'Moments', help: 'One or two things you want to happen.' },
  { id: 'close', round: 2, label: 'The close', help: 'How it should feel at the end.' },
  { id: 'canon', round: 2, label: 'Canon', help: 'What it must touch, and what it must leave alone.' },
  { id: 'split', round: 3, label: 'Fight, talk, explore', help: 'A rough split.' },
  { id: 'branching', round: 3, label: 'Branching', help: 'One road with choices, or real forks.' },
  { id: 'lines', round: 3, label: 'Hard lines', help: 'What this table never wants to see.' },
  { id: 'voice', round: 3, label: 'Your voice', help: 'A paragraph in your own table voice, about anything at all.' }
];

export const STAGES = ['questions', 'spine', 'cast', 'outline', 'writing'];

export function worldOf(saga) {
  const w = String((saga && saga.answers && saga.answers.world) || '').toLowerCase();
  return WORLDS.find((x) => w && (w === x.name.toLowerCase() || w.indexOf(x.name.toLowerCase()) >= 0)) || null;
}

export function meta() {
  return {
    questions: QUESTIONS,
    worlds: WORLDS.map((w) => ({ name: w.name, line: w.line, lineage: w.lineage, histories: w.histories })),
    lineages: LINEAGES.map((l) => l.name),
    stages: STAGES
  };
}

// The long, fixed part of every request. It never changes between calls, so it is cached.
function houseSystem() {
  return [
    'You are the SagaForge, the adventure writer for LoreFell, a dark and weird fantasy tabletop roleplaying game. You write adventures for a LoreMaster (the person running the game) to run for their table of Fell (the players\' characters).',
    'You work in stages, and the LoreMaster approves each one. You follow ADVENTURE_WRITING, ADVENTURE_FORMAT and STYLE below exactly. They are requirements, and each one came from a draft that failed without it. CANON is the single source of truth for rules and terms: never invent a rule, a number or a mechanic, and never contradict canon lore. Use the worked example, The Stone Warren, as the standard for voice, layout and how much to explain.',
    'Write like a person who runs games, not like an assistant. Plain words, short sentences, specific things. No hype. Never mention that you are an AI, and never address the LoreMaster about yourself.',
    '\n# ADVENTURE_WRITING\n\n' + HOUSE.writing,
    '\n# ADVENTURE_FORMAT\n\n' + HOUSE.format,
    '\n# STYLE\n\n' + HOUSE.style,
    '\n# CANON\n\n' + HOUSE.canon,
    '\n# Building Crucibles (foe numbers)\n\n' + HOUSE.crucibles,
    '\n# Making the Call (rolls)\n\n' + HOUSE.makingTheCall,
    '\n# Shaping an Adventure\n\n' + HOUSE.shaping,
    '\n# The Story So Far\n\n' + HOUSE.storySoFar,
    '\n# Canon names you may use\n\nSkills: ' + LISTS.skills.join(', ') + '\nStances: ' + LISTS.stances.join(', ') + '\nBuilds: ' + LISTS.builds.join(', ') +
      '\nInfusions: ' + LISTS.infusions.join(', ') + '\nAugmentations: ' + LISTS.augmentations.join(', ') + '\nAfflictions: ' + LISTS.afflictions.join(', ') +
      '\nCombat effects: ' + LISTS.combatEffects.join(', ') + '\nCanon pages you may link: ' + LISTS.links.join(', ') +
      '\nLineages: ' + LINEAGES.map((l) => l.name).join(', ') + '\nWorlds: ' + WORLDS.map((w) => w.name + ' (' + w.lineage + (w.histories.length ? '; History: ' + w.histories.join(', ') : '; no History yet') + ')').join('; '),
    '\n# The worked example: The Stone Warren\n\n## Overview\n\n' + EXAMPLE.overview + '\n\n## A scene\n\n' + EXAMPLE.scene + '\n\n## A fight scene\n\n' + EXAMPLE.fight + '\n\n## A foe\n\n' + EXAMPLE.foe + '\n\n## A character\n\n' + EXAMPLE.character
  ].join('\n');
}
let HOUSE_TEXT = null;
function houseText() { if (HOUSE_TEXT === null) HOUSE_TEXT = houseSystem(); return HOUSE_TEXT; }

function worldText(saga) {
  const w = worldOf(saga);
  if (!w) return '';
  const lin = LINEAGES.find((l) => l.name.toLowerCase() === String(w.lineage).toLowerCase());
  return '# The world: ' + w.name + '\n\n' + w.vault + (w.stratum ? '\n\n## The full world page\n\n' + w.stratum : '') +
    (lin ? '\n\n## Its lineage, the ' + lin.name + '\n\n' + lin.line : '');
}

function rulesText(rules) {
  const list = (rules || []).map((r) => String(r || '').trim()).filter(Boolean);
  if (!list.length) return '';
  return '# The LoreMaster\'s own house rules\n\nThese come from the LoreMaster who is using you. Follow them as you follow ADVENTURE_WRITING.\n\n' + list.map((r, i) => (i + 1) + '. ' + r).join('\n');
}

function system(saga, rules) {
  const blocks = [{ type: 'text', text: houseText(), cache_control: { type: 'ephemeral' } }];
  const w = worldText(saga);
  if (w) blocks.push({ type: 'text', text: w, cache_control: { type: 'ephemeral' } });
  const r = rulesText(rules);
  if (r) blocks.push({ type: 'text', text: r });
  return blocks;
}

function answersText(saga) {
  const a = (saga && saga.answers) || {};
  const rolled = (saga && saga.rolled) || {};
  const lines = QUESTIONS.map((q) => '- ' + q.label + (rolled[q.id] ? ' (rolled)' : '') + ': ' + (String(a[q.id] || '').trim() || '(not answered)'));
  const f = ((saga && saga.followups) || []).filter((x) => x && x.q).map((x) => '- Q: ' + x.q + '\n  A: ' + (String(x.a || '').trim() || '(not answered)'));
  return '# The LoreMaster\'s answers\n\n' + lines.join('\n') + (f.length ? '\n\n## Follow-ups\n\n' + f.join('\n') : '');
}
function notesText(saga) {
  const n = ((saga && saga.notes) || []).filter((x) => x && x.note).slice(-12);
  if (!n.length) return '';
  return '\n\n# The LoreMaster\'s notes so far, oldest first\n\n' + n.map((x) => '- ' + (x.target ? '[' + x.target + '] ' : '') + x.note).join('\n');
}
function stageText(saga, upTo) {
  const out = [answersText(saga)];
  if (upTo > 1 && saga.spine) out.push('# The approved spine\n\n' + saga.spine);
  if (upTo > 2 && saga.cast) out.push('# The approved people, foes and choices\n\n' + saga.cast);
  if (upTo > 3 && saga.outline) out.push('# The approved scene outline\n\n' + saga.outline);
  return out.join('\n\n') + notesText(saga);
}

// The adventure's own folder name, used for the overview file and every link.
export function titleOf(saga) {
  const t = String((saga && saga.title) || '').replace(/[\\/:*?"<>|#^[\]]/g, '').trim();
  return t || 'Untitled Adventure';
}

const SCHEMAS = {
  roll: (ids) => ({ type: 'object', additionalProperties: false, required: ['answers'],
    properties: { answers: { type: 'object', additionalProperties: false, required: ids, properties: Object.fromEntries(ids.map((id) => [id, { type: 'string' }])) } } }),
  followups: () => ({ type: 'object', additionalProperties: false, required: ['questions'],
    properties: { questions: { type: 'array', items: { type: 'string' } } } }),
  plan: () => ({ type: 'object', additionalProperties: false, required: ['title', 'files'],
    properties: { title: { type: 'string' }, files: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['path', 'brief'],
      properties: { path: { type: 'string' }, brief: { type: 'string' } } } } } }),
  touches: () => ({ type: 'object', additionalProperties: false, required: ['files'],
    properties: { files: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['path', 'why'], properties: { path: { type: 'string' }, why: { type: 'string' } } } } } }),
  coldread: () => ({ type: 'object', additionalProperties: false, required: ['findings'],
    properties: { findings: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['path', 'problem', 'fix'],
      properties: { path: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } } } } } })
};

function fileList(saga) {
  return Object.keys((saga && saga.files) || {}).sort();
}
function filesText(saga, paths) {
  return paths.filter((p) => saga.files && saga.files[p]).map((p) => '=== FILE: ' + p + ' ===\n' + saga.files[p]).join('\n\n');
}
function neighbours(saga, path) {
  const scenes = fileList(saga).filter((p) => /^Scenes\//.test(p));
  const plan = ((saga && saga.plan) || []).map((f) => f.path).filter((p) => /^Scenes\//.test(p));
  const i = plan.indexOf(path);
  const before = i > 0 ? plan.slice(Math.max(0, i - 2), i) : scenes.slice(-2);
  return before.filter((p) => p !== path);
}

const RAW_FILE = 'Reply with the complete file and nothing else: start with its frontmatter line ---, and add no note before or after it, and no code fence around it.';

// One request per stage. step is the stage, opts carries what that stage needs.
export function buildRequest(step, saga, opts) {
  opts = opts || {};
  saga = saga || {};
  const rules = opts.rules || [];
  let text = '';
  let schema = null;
  let effort = 'high';
  const note = String(opts.note || '').trim();
  const again = note ? '\n\nThe LoreMaster\'s note on the last take, which this one must answer:\n' + note : '';
  const prior = (k) => (opts.retake && saga[k]) ? '\n\nThe take they want replaced:\n\n' + saga[k] : '';

  if (step === 'roll') {
    const ids = (opts.ids && opts.ids.length) ? opts.ids : QUESTIONS.map((q) => q.id);
    const asked = QUESTIONS.filter((q) => ids.indexOf(q.id) >= 0).map((q) => '- ' + q.id + ': ' + q.label + '. ' + q.help + (q.pick === 'worlds' ? ' Answer with one world name from the list.' : Array.isArray(q.pick) ? ' Answer with one of: ' + q.pick.join(', ') + '.' : '')).join('\n');
    text = answersText(saga) + '\n\n# Your task\n\nRoll these answers yourself, from the lore, as ADVENTURE_WRITING sets out: inside canon, preferring a world with no History yet, and giving canon characters a cameo at most. Make them fit the answers already given. Write each in a line or two, plainly, the way a LoreMaster would jot it down. For the voice question, write a paragraph of read-aloud in the house voice.\n\n' + asked +
      (saga.lastEngine ? '\n\nThe last adventure leaned on this engine, so pick a different one: ' + saga.lastEngine : '');
    schema = SCHEMAS.roll(ids);
    effort = 'medium';
  } else if (step === 'followups') {
    text = answersText(saga) + '\n\n# Your task\n\nAsk up to three follow-up questions, and only where an answer is thin, unclear, or clashes with canon (say what canon says). Each one short and plain. Ask none if the answers are enough.';
    schema = SCHEMAS.followups();
    effort = 'medium';
  } else if (step === 'spine') {
    text = stageText(saga, 1) + '\n\n# Your task\n\nWrite stage 1, the spine, as ADVENTURE_WRITING sets it out. In markdown, in this order, with these headings: The pitch (two plain sentences), The draw-in, The stakes, The conflict, The path to victory, What keeps them there, Why the players care, What the LoreMaster gets, The scenes (one line each), The endings. Start with a line "# " and the adventure\'s title. Keep it to one page.' + prior('spine') + again;
  } else if (step === 'cast') {
    text = stageText(saga, 2) + '\n\n# Your task\n\nWrite stage 2, the people and the foes, as ADVENTURE_WRITING sets it out. In markdown: The people (each with what they want, what they hide, how they sound, and what they do if the Fell ignore them), How the world meets each Fell (for the world\'s lineage and any lineage the foes touch), The foes (rating, what it wants, why it is there, what drives it, how it fights, and the way past it without a fight), The things the table tracks (each with its one rule), and The choices that shape the night (each choice, where it is made, its answers, and what it changes later).' + prior('cast') + again;
  } else if (step === 'outline') {
    text = stageText(saga, 3) + '\n\n# Your task\n\nWrite stage 3, the scene outline, as ADVENTURE_WRITING sets it out. In markdown, every route listed first, then one section per scene: the place and the problem, who is there, the clues and secrets, two or three beats, the checks (skill and purpose, canon skill names only), and which choices it sets or reads. Then the endings, each with the adventure\'s question answered.' + prior('outline') + again;
  } else if (step === 'plan') {
    text = stageText(saga, 4) + '\n\n# Your task\n\nList every file the finished adventure needs, in the order to write them, as ADVENTURE_FORMAT lays out the folder: the overview first ("<Title>.md"), then "Scenes/NN - <Scene>.md" in play order, then "Foes/<Foe>.md", "Characters/<Name>.md" and "Locations/<Name>.md". File names must be plain and unique. Give the adventure\'s title, and for each file a one-line brief of what it holds.';
    schema = SCHEMAS.plan();
    effort = 'medium';
  } else if (step === 'write') {
    const path = String(opts.path || '');
    const brief = ((saga.plan || []).find((f) => f.path === path) || {}).brief || '';
    const near = path === titleOf(saga) + '.md' ? [] : [titleOf(saga) + '.md'].concat(neighbours(saga, path));
    text = stageText(saga, 4) + '\n\n# The files in this adventure\n\n' + (saga.plan || []).map((f) => '- ' + f.path + ': ' + f.brief).join('\n') +
      (near.length ? '\n\n# Written so far, for continuity\n\n' + filesText(saga, near) : '') +
      '\n\n# Your task\n\nWrite the file ' + path + (brief ? ' (' + brief + ')' : '') + ' in full, to ADVENTURE_FORMAT, at the standard of the worked example, meeting every requirement in ADVENTURE_WRITING. Link other files in this adventure by their names exactly as listed, and scenes with their alias, such as [[01 - Under the Grain|Under the Grain]]. ' + RAW_FILE;
  } else if (step === 'repair' || step === 'revise') {
    const path = String(opts.path || '');
    const why = step === 'repair'
      ? 'These problems were found in it. Fix every one, and change nothing else:\n' + (opts.findings || []).map((f) => '- ' + (f.line ? 'line ' + f.line + ': ' : '') + f.problem + (f.fix ? ' Fix: ' + f.fix : '')).join('\n')
      : 'The LoreMaster\'s note on it:\n' + note + '\n\nChange what the note asks for and what it touches, and keep everything else as it is, word for word.';
    text = stageText(saga, 4) + '\n\n# The file\n\n' + filesText(saga, [path]) + '\n\n# Your task\n\nRewrite ' + path + '. ' + why + '\n\n' + RAW_FILE;
  } else if (step === 'touches') {
    text = stageText(saga, 4) + '\n\n# The files\n\n' + fileList(saga).map((p) => '- ' + p).join('\n') + '\n\n# The LoreMaster\'s note on the whole adventure\n\n' + note + '\n\n# Your task\n\nSay which files must change to answer this note, and why, in a line each. Only the files the note really touches.';
    schema = SCHEMAS.touches();
    effort = 'medium';
  } else if (step === 'coldread') {
    text = filesText(saga, fileList(saga)) + '\n\n# Your task\n\nRead this adventure cold, as a brand-new LoreMaster who has never played LoreFell and must run it tonight. Report only real problems, most serious first, at most 25: anything you would have to guess at, a mechanic used before it is explained, contradictions between files (numbers, who is where, what was chosen), gaps where the Fell could do something reasonable and the text gives nothing, rolls missing results, and lines that make no sense read aloud. Give the file path for each, the problem, and the fix.';
    schema = SCHEMAS.coldread();
  } else {
    throw new Error('Unknown SagaForge step: ' + step);
  }

  return { model: MODEL, system: system(saga, rules), messages: [{ role: 'user', content: text }], max_tokens: 32000, effort: effort, schema: schema };
}

// Strip a fence or a stray line of preamble from a file the model wrote.
export function cleanFile(text) {
  let t = String(text || '').replace(/\r\n/g, '\n').trim();
  const fence = t.match(/^```[a-z]*\n([\s\S]*?)\n```$/);
  if (fence) t = fence[1].trim();
  const i = t.indexOf('---\n');
  if (i > 0) t = t.slice(i);
  t = t.replace(/\n```\s*$/, '').trim();
  return t + '\n';
}

export function parseResult(step, text) {
  if (['roll', 'followups', 'plan', 'touches', 'coldread'].indexOf(step) >= 0) {
    const t = String(text || '').trim();
    const m = t.match(/\{[\s\S]*\}/);
    return JSON.parse(m ? m[0] : t);
  }
  if (step === 'write' || step === 'repair' || step === 'revise') return cleanFile(text);
  return String(text || '').trim() + '\n';
}

// Every id in the adventure is made unique to this saga before it is sent to the table, so two
// adventures never share a foe or a scene id.
export function prefixIds(files, prefix) {
  const out = {};
  Object.keys(files || {}).forEach((p) => {
    out[p] = String(files[p]).replace(/^(---\n[\s\S]*?\n---)/, (fm) => fm.replace(/^id:\s*(\S+)\s*$/m, (all, id) =>
      /^type:\s*adventure\s*$/m.test(fm) ? 'id: ' + prefix : (id.indexOf(prefix + '-') === 0 ? all : 'id: ' + prefix + '-' + id)));
  });
  return out;
}
