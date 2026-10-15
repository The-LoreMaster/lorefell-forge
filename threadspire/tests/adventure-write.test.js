/* Locking an adventure to the vault writes it out as vault pages (velo/backend/adventureFormat.js
 * writeAdventure), and the vault reads them back the same way the live sync does (readAdventure).
 * These checks write and read back:
 *
 *   - a vault adventure comes back exactly as it went out, ids and all
 *   - an adventure made in the tools comes back with its acts, sessions and scenes, their ids,
 *     every beat's words, its foes and characters, and how many of each foe each scene had
 *   - no file takes a name the vault already uses
 *   - saving a checked-out adventure back changes only what the table changed
 *
 *   node threadspire/tests/adventure-write.test.js
 */
const path = require('path');
const { buildPack } = require('../../scripts/adventureFromVault.js');
const { writeAdventure, readAdventure, rewriteAdventure, markCheckedOut, clearCheckedOut } = require('../../velo/backend/adventureFormat.js');
const { folderFiles } = require('../../scripts/adventureFromVault.js');

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

console.log('adventure-write: a checked-out adventure, saved back');
// the fixture as a LoreMaster might have written it by hand: a key only the vault reads, a link in
// a beat, a character with no page, and the check-out mark
const hand = folderFiles(path.join(__dirname, 'fixtures', 'Adventures', 'A Test Night'));
const ov = 'A Test Night.md';
hand[ov] = markCheckedOut(hand[ov].replace(/^canon: .*$/m, '').replace('---\n', '---\nteaches_extra: "kept"\n').replace(/^characters:\n/m, 'characters:\n  - "[[Somebody Elsewhere]]"\n'), 0);
const gate = Object.keys(hand).find((p) => /The Gate/.test(p));
hand[gate] = hand[gate].replace(/\n$/, '') + '\n\nA note that names [[Mara]].\n';
const handPack = readAdventure(hand, 'A Test Night', { builtAt: 0 }).pack;
const handLib = clone(handPack.foes.concat(handPack.npcs)).map((e) => Object.assign(e, { campaignId: handPack.campaign.id }));
check('the mark reads as checked_out on the overview, and clears', /^checked_out: true$/m.test(hand[ov]) && !/checked_out/.test(clearCheckedOut(hand[ov])), hand[ov]);
const same = rewriteAdventure(clone(handPack.campaign), clone(handLib), hand, 'A Test Night', new Set());
check('saved with no changes, only the mark comes off the overview', Object.keys(same.files).join(',') === ov && same.files[ov] === clearCheckedOut(hand[ov]) && same.deletes.length === 0,
  Object.keys(same.files).join(',') + ' / ' + same.deletes.join(','));
const edited = clone(handPack.campaign);
const scs = edited.acts[0].sessions[0].scenes;
scs[0].entries[0].body += ' More.';
scs[0].entries.push({ id: 'new-1', type: 'clue', title: 'Found', body: 'A key.' });
scs.splice(1, 1);
const lib2 = clone(handLib); lib2.find((e) => e.name === 'Test Hound').maxVit = 9;
edited.worldId = 'world:vyrathis'; edited.worldName = 'Vyrathis';
const r2 = rewriteAdventure(edited, lib2, hand, 'A Test Night', new Set());
const before = hand[gate].split('\n'), after = (r2.files[gate] || '').split('\n');
const differing = after.filter((ln) => before.indexOf(ln) < 0);
check('an edited beat and a new beat change only their own lines', differing.length >= 1 && differing.every((ln) => /More\.|\[!clue\] Found|A key\./.test(ln)) && /A note that names \[\[Mara\]\]/.test(r2.files[gate]),
  differing.join(' | '));
check('a removed scene is deleted from the vault', r2.deletes.length === 1 && /The Fight/.test(r2.deletes[0]), JSON.stringify(r2.deletes));
const houndPage = Object.keys(r2.files).find((p) => /Test Hound/.test(p));
check('an edited foe changes only the line that changed', !!houndPage && r2.files[houndPage].split('\n').filter((ln) => hand[houndPage].split('\n').indexOf(ln) < 0).join('|') === 'vitality: 9', houndPage && r2.files[houndPage]);
check('the overview keeps what only the vault reads, and links to pages outside the folder', /teaches_extra: "kept"/.test(r2.files[ov]) && /Somebody Elsewhere/.test(r2.files[ov]) && !/checked_out/.test(r2.files[ov]), r2.files[ov]);
const back2 = readAdventure(r2.all, 'A Test Night', { builtAt: 0 }).pack;
check('it reads back with the changes and the world', back2.foes[0].maxVit === 9 && back2.campaign.worldId === 'world:vyrathis' && back2.campaign.acts[0].sessions[0].scenes.length === 1
  && back2.campaign.acts[0].sessions[0].scenes[0].entries.some((e) => e.title === 'Found'), JSON.stringify(back2.campaign).slice(0, 300));

console.log('adventure-write: pictures');
const pic = clone(handPack.campaign), lib3 = clone(handLib);
pic.img = 'https://static.example.com/cover.png';
pic.acts[0].sessions[0].scenes[0].img = 'https://static.example.com/gate.png';
pic.acts[0].sessions[0].scenes[0].entries[1].img = 'https://static.example.com/beat.png';
pic.acts[0].sessions[0].scenes[1].img = 'blob:https://x/123';
lib3.find((e) => e.name === 'Test Hound').img = 'https://static.example.com/hound.png';
const r3 = rewriteAdventure(pic, lib3, hand, 'A Test Night', new Set());
check('a picture goes to the vault as its address: covers in frontmatter, a beat\'s at its foot', /^image: "https:\/\/static\.example\.com\/cover\.png"$/m.test(r3.files[ov])
  && /!\[\]\(https:\/\/static\.example\.com\/beat\.png\)/.test(r3.files[gate]) && /^image: "https:\/\/static\.example\.com\/gate\.png"$/m.test(r3.files[gate]), r3.files[gate]);
const back3 = readAdventure(r3.all, 'A Test Night', { builtAt: 0 }).pack;
const s3 = back3.campaign.acts[0].sessions[0].scenes;
check('and reads back as the same pictures, the beat\'s words untouched', back3.campaign.img === pic.img && s3[0].img === 'https://static.example.com/gate.png'
  && s3[0].entries[1].img === 'https://static.example.com/beat.png' && s3[0].entries[1].body === handPack.campaign.acts[0].sessions[0].scenes[0].entries[1].body
  && back3.foes[0].img === 'https://static.example.com/hound.png' && !s3[1].img, JSON.stringify([back3.campaign.img, s3[0].img, s3[0].entries[1], s3[1].img]));
const { overlayCampaign } = require('../../velo/backend/vaultSync.js');
const table = clone(handPack.campaign); table.acts[0].sessions[0].scenes[0].img = 'https://t/cover.png'; table.acts[0].sessions[0].scenes[0].entries[0].img = 'https://t/b.png';
const laid = overlayCampaign(table, handPack.campaign, {});
check('a vault page that names no picture never blanks one the table has', laid.acts[0].sessions[0].scenes[0].img === 'https://t/cover.png' && laid.acts[0].sessions[0].scenes[0].entries[0].img === 'https://t/b.png',
  JSON.stringify([laid.acts[0].sessions[0].scenes[0].img, laid.acts[0].sessions[0].scenes[0].entries[0].img]));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
