/* Locking an adventure to the vault writes it out as vault pages (velo/backend/adventureFormat.js
 * writeAdventure), and the vault reads them back the same way the live sync does (readAdventure).
 * These checks write and read back:
 *
 *   - a vault adventure comes back exactly as it went out, ids and all
 *   - an adventure made in the tools comes back with its acts, sessions and scenes, their ids,
 *     every beat's words, its foes and characters, and how many of each foe each scene had
 *   - no file takes a name the vault already uses
 *
 *   node threadspire/tests/adventure-write.test.js
 */
const path = require('path');
const { buildPack } = require('../../scripts/adventureFromVault.js');
const { writeAdventure, readAdventure } = require('../../velo/backend/adventureFormat.js');

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok === true) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name + '\n          ' + detail); fail++; }
}
const clone = (x) => JSON.parse(JSON.stringify(x));
const strip = (p) => { const c = clone(p); delete c.meta.builtAt; return c; };

console.log('adventure-write: a vault adventure, out and back');
const fixture = buildPack(path.join(__dirname, 'fixtures', 'Adventures', 'A Test Night'), { builtAt: 0 }).pack;
const out = writeAdventure(clone(fixture.campaign), clone(fixture.foes.concat(fixture.npcs)), new Set());
check('it writes the overview, the scenes, the foe and the character', Object.keys(out.files).sort().join(' | ') ===
  ['A Test Night.md', 'Characters/Mara.md', 'Foes/Test Hound.md', 'Scenes/01 - The Gate.md', 'Scenes/02 - The Fight.md'].join(' | '), Object.keys(out.files).join(' | '));
const back = readAdventure(out.files, out.folder, { builtAt: 0 }).pack;
check('read back, it is the same pack, ids and all', JSON.stringify(strip(back)) === JSON.stringify(strip(fixture)),
  JSON.stringify(strip(back)).slice(0, 300) + '\n          vs ' + JSON.stringify(strip(fixture)).slice(0, 300));
check('a library id the vault made maps to itself', out.libIdMap['a-test-night--test-hound'] === 'a-test-night--test-hound', JSON.stringify(out.libIdMap));

console.log('adventure-write: an adventure made in ThreadSpire');
const lib = [
  { id: 'L9xQ', type: 'monster', name: 'Ash Hound', desc: 'It burns.', sr: 'Minion', build: 'Reaver', stance: 'Stalwart', maxVit: 4,
    attrs: { Precision: 1 }, sig: 'Bleeding', infusions: ['Brutal'], augments: [], abilities: [{ name: 'Bite', tier: 1, desc: 'It bites: hard.' }] },
  { id: 'N1zz', type: 'npc', name: 'Mara', role: 'keeper', desc: 'She keeps the gate.' },
  { id: 'K7aa', type: 'monster', name: 'Spare "Wolf"', desc: '', sr: 'Elite', build: 'Stalker', campaignId: 'adv-r4nd0m' },
  { id: 'X000', type: 'monster', name: 'Not this adventure\'s', campaignId: 'someone-else' }
];
const ts = {
  id: 'adv-r4nd0m', name: 'The Ash Road', type: 'story', desc: 'A road.', notes: 'Notes on\n\nthe road.', world: 'Vyrathis', level: 2,
  acts: [
    { id: 'act-a', name: 'The Gate', sessions: [{ id: 'ses-a', name: 'Night one', scenes: [
      { id: 'sc-1', name: 'Arrival', entries: [
        { id: 'e1', type: 'readaloud', title: 'The road', body: 'Ash, everywhere.\n\nAnd quiet.' },
        { id: 'e2', type: 'dialogue', title: '', speaker: 'N1zz', body: '*If asked:* "Go back."' },
        { id: 'e3', type: 'general', title: 'A heading only', body: '' },
        { id: 'e4', type: 'general', title: '', body: 'A plain note.' },
        { id: 'e5', type: 'general', title: 'Titled note', body: 'With words.' },
        { id: 'e6', type: 'general', title: '', body: '> looks like a quote\nbut is a note' },
        { id: 'e7', type: 'lorecheck', title: 'Vigilance: Seeing it', body: '- **Fellmark.** *Read:* You see.' },
        { id: 'e8', type: 'choice', title: 'Which way', body: '- **Left.** Go.' }
      ], combatants: [{ id: 'cb1', libId: 'N1zz', type: 'npc' }] }] }] },
    { id: 'act-b', name: 'The Fire', sessions: [
      { id: 'ses-b', name: 'Night two', scenes: [
        { id: 'sc-2', name: 'Hounds', beats: [{ id: 'b1', kind: 'crucible', title: 'The pack', body: 'They come.' }],
          combatants: [{ id: 'c1', libId: 'L9xQ', type: 'monster' }, { id: 'c2', libId: 'L9xQ', type: 'monster' }, { id: 'c3', libId: 'L9xQ', type: 'monster' }] }] },
      { id: 'ses-c', name: 'Night three', scenes: [{ id: 'sc-3', name: 'Arrival', entries: [] }] }] }
  ]
};
const w = writeAdventure(clone(ts), clone(lib), new Set(['mara', '02 - hounds']));
const names = Object.keys(w.files).sort();
check('no file takes a name the vault already has', names.indexOf('Characters/Mara (The Ash Road).md') >= 0 && names.indexOf('Scenes/02 - Hounds (The Ash Road).md') >= 0, names.join(' | '));
check('a foe kept for the adventure comes too, another adventure\'s does not', names.some((n) => /Spare Wolf/.test(n)) && !names.some((n) => /Not this/.test(n)), names.join(' | '));
const r = readAdventure(w.files, w.folder, { builtAt: 0 });
const p = r.pack, c = p.campaign;
check('the adventure keeps its id and is marked synced', c.id === 'adv-r4nd0m' && c.synced === true && c.type === 'story' && c.level === 2, JSON.stringify({ id: c.id, s: c.synced, t: c.type }));
check('acts and sessions keep their ids and names', JSON.stringify(c.acts.map((a) => [a.id, a.name, a.sessions.map((s) => [s.id, s.name])])) ===
  JSON.stringify([['act-a', 'The Gate', [['ses-a', 'Night one']]], ['act-b', 'The Fire', [['ses-b', 'Night two'], ['ses-c', 'Night three']]]]), JSON.stringify(c.acts.map((a) => [a.id, a.sessions.map((s) => s.id)])));
const sc = c.acts.flatMap((a) => a.sessions.flatMap((s) => s.scenes));
check('scenes keep their ids, names and order, two of a name included', sc.map((s) => s.id + ':' + s.name).join(',') === 'sc-1:Arrival,sc-2:Hounds,sc-3:Arrival', sc.map((s) => s.id + ':' + s.name).join(','));
const want = ts.acts[0].sessions[0].scenes[0].entries;
const got = sc[0].entries;
check('every beat comes back, in order', got.length === want.length, got.length + ' vs ' + want.length);
check('each beat keeps its kind', got.map((e) => e.type).join(',') === 'readaloud,dialogue,general,general,general,general,lorecheck,beat', got.map((e) => e.type).join(','));
check('each beat keeps its title and words', got.every((e, i) => e.body === String(want[i].body).trim() && (want[i].type === 'dialogue' || e.title === want[i].title)),
  JSON.stringify(got.map((e) => [e.title, e.body])));
const mara = p.npcs.find((n) => n.name === 'Mara');
check('a speaker comes back as their character', !!mara && got[1].speaker === mara.id && mara.id === w.libIdMap.N1zz, JSON.stringify([got[1].speaker, w.libIdMap]));
const hound = p.foes.find((f) => f.name === 'Ash Hound');
check('a foe comes back with its numbers and its whole kit, whatever its rating', !!hound && hound.id === w.libIdMap.L9xQ && hound.sr === 'Minion' && hound.build === 'Reaver' && hound.maxVit === 4
  && hound.attrs.Precision === 1 && hound.sig === 'Bleeding' && hound.infusions[0] === 'Brutal' && hound.abilities[0].name === 'Bite' && hound.abilities[0].desc === 'It bites: hard.', JSON.stringify(hound));
check('a foe with quotes in its name survives', p.foes.some((f) => f.name === 'Spare "Wolf"'), JSON.stringify(p.foes.map((f) => f.name)));
check('the scene says how many of each foe it had', /count: "3"/.test(w.files['Scenes/02 - Hounds (The Ash Road).md']) && sc[1].combatants.length === 1 && sc[1].combatants[0].libId === hound.id,
  w.files['Scenes/02 - Hounds (The Ash Road).md']);
check('the overview keeps the notes and summary', c.notes === 'Notes on\n\nthe road.' && c.desc === 'A road.', JSON.stringify([c.notes, c.desc]));
check('reading it back raises no warnings', r.warnings.length === 0, JSON.stringify(r.warnings));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
