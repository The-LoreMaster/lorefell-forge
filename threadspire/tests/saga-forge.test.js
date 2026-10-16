/* The SagaForge's writer, without a model: the canon bundle is current, every stage builds a
 * request the API accepts, results are read back, ids are made the saga's own, and the scan
 * passes The Stone Warren (the adventure its rules were learned on) and catches what it should.
 *
 *   node threadspire/tests/saga-forge.test.js
 */
const fs = require('fs');
const path = require('path');
const { folderFiles, buildPack } = require('../../scripts/adventureFromVault.js');
const P = require('../../velo/backend/sagaPrompt.js');
const { checkFiles } = require('../../velo/backend/sagaCheck.js');
const { readAdventure } = require('../../velo/backend/adventureFormat.js');

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok === true) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name + '\n          ' + detail); fail++; }
}

console.log('saga-forge: the canon bundle');
const vault = path.resolve(__dirname, '..', '..', '..', 'lorefell-fellguide');
if (fs.existsSync(vault)) {
  const { build } = require('../../scripts/sagaCanonFromVault.js');
  const now = fs.readFileSync(path.join(__dirname, '..', '..', 'velo', 'backend', 'sagaCanon.js'), 'utf8');
  check('velo/backend/sagaCanon.js matches the vault (run scripts/sagaCanonFromVault.js if not)', build(vault) === now, 'stale');
} else console.log('  skip  no vault beside the forge');
const meta = P.meta();
check('it offers every world and the fifteen questions in three rounds', meta.worlds.length > 30 && meta.questions.length === 15 && [1, 2, 3].every((r) => meta.questions.some((q) => q.round === r)), meta.worlds.length + ' worlds');

console.log('saga-forge: every stage builds a request');
const saga = { id: 'sg-test', title: 'The Stone Warren', answers: { type: 'Tale', world: 'Shervinaw', table: '4 Fell, level 1' }, followups: [{ q: 'Which river?', a: 'The Sallowrun' }],
  spine: '# The Stone Warren\n\nThe pitch.', cast: 'People.', outline: 'Scenes.', plan: [{ path: 'The Stone Warren.md', brief: 'overview' }, { path: 'Scenes/01 - Under the Grain.md', brief: 'waking' }, { path: 'Scenes/02 - Nib.md', brief: 'the ask' }],
  files: { 'The Stone Warren.md': '---\ntype: adventure\nid: the-stone-warren\n---\nx', 'Scenes/01 - Under the Grain.md': '---\ntype: scene\nid: sw-01\n---\ny' }, notes: [{ note: 'Furze is too long' }] };
const steps = [['roll', { ids: ['question', 'patron'] }], ['followups', {}], ['spine', {}], ['spine', { retake: true, note: 'darker' }], ['cast', {}], ['outline', {}], ['plan', {}],
  ['write', { path: 'Scenes/02 - Nib.md' }], ['repair', { path: 'Scenes/01 - Under the Grain.md', findings: [{ line: 3, problem: 'semicolon', fix: 'a period' }] }],
  ['revise', { path: 'Scenes/01 - Under the Grain.md', note: 'shorter' }], ['touches', { note: 'Act II drags' }], ['coldread', {}]];
steps.forEach(([s, o]) => {
  let r = null, err = '';
  try { r = P.buildRequest(s, saga, Object.assign({ rules: ['No talking animals.'] }, o)); } catch (e) { err = e.message; }
  check(s + (o.retake ? ' (another take)' : '') + ' builds a request', !!(r && r.model === P.MODEL && r.messages.length === 1 && r.messages[0].content.length > 50 && r.system.length >= 2), err || JSON.stringify(r && r.system.length));
});
const w = P.buildRequest('write', saga, { path: 'Scenes/02 - Nib.md', rules: ['No talking animals.'] });
check('the house rules are cached, then the world, then the LoreMaster\'s own rules', w.system[0].cache_control && /ADVENTURE_WRITING/.test(w.system[0].text) && /# The world: Shervinaw/.test(w.system[1].text) && /No talking animals/.test(w.system[2].text) && !w.system[2].cache_control, w.system.map((b) => b.text.slice(0, 40)).join(' | '));
check('a scene is written with the overview and the scene before it in view', /=== FILE: The Stone Warren\.md ===/.test(w.messages[0].content) && /=== FILE: Scenes\/01 - Under the Grain\.md ===/.test(w.messages[0].content), w.messages[0].content.slice(-400));
check('the house rules are the same text on every call, so the cache holds', P.buildRequest('spine', saga, {}).system[0].text === w.system[0].text, 'differs');
check('a roll asks for structured output naming only the asked questions', JSON.stringify(P.buildRequest('roll', saga, { ids: ['question'] }).schema.properties.answers.required) === '["question"]', '');
const briefed = Object.assign({}, saga, { brief: 'A Halloween night involving Spindle.' });
const rb = P.buildRequest('roll', briefed, { ids: ['question'] }).messages[0].content;
check('the brief heads a roll, and the roll is told to build on it', /^# The LoreMaster's brief[\s\S]*Halloween night involving Spindle[\s\S]*# The LoreMaster's answers/.test(rb) && /Build every answer on the LoreMaster's brief/.test(rb), rb.slice(0, 300));
check('the brief carries into every stage after', /Halloween night involving Spindle/.test(P.buildRequest('spine', briefed, {}).messages[0].content) && /Halloween night involving Spindle/.test(P.buildRequest('outline', briefed, {}).messages[0].content), 'missing');
check('with no brief, nothing about one is said', !/brief/i.test(P.buildRequest('roll', saga, { ids: ['question'] }).messages[0].content.split('# Your task')[0]), 'leaked');
let bad = '';
try { P.buildRequest('nonsense', saga, {}); } catch (e) { bad = e.message; }
check('an unknown stage is refused', /Unknown SagaForge step/.test(bad), bad);

console.log('saga-forge: reading results back');
check('a file wrapped in a fence with a preamble comes back clean', P.parseResult('write', 'Here it is:\n```markdown\n---\ntype: scene\n---\nBody\n```') === '---\ntype: scene\n---\nBody\n', JSON.stringify(P.parseResult('write', 'Here it is:\n```markdown\n---\ntype: scene\n---\nBody\n```')));
check('structured results parse', P.parseResult('followups', '{"questions":["Which river?"]}').questions[0] === 'Which river?', '');

console.log('saga-forge: ids');
const fx = folderFiles(path.join(__dirname, 'fixtures', 'Adventures', 'The Stone Warren'));
const pre = P.prefixIds(fx, 'sg-abc');
check('the overview takes the saga\'s id, and every other id is prefixed', /^id: sg-abc$/m.test(pre['The Stone Warren.md']) && /^id: sg-abc-rootbound-weasel$/m.test(pre['Foes/Rootbound Weasel.md']) && /^id: sg-abc-sw-01-under-the-grain$/m.test(pre['Scenes/01 - Under the Grain.md']), pre['Foes/Rootbound Weasel.md'].slice(0, 80));
check('prefixing twice changes nothing', JSON.stringify(P.prefixIds(pre, 'sg-abc')) === JSON.stringify(pre), 'changed');
const pack = readAdventure(pre, 'The Stone Warren', { builtAt: 0 }).pack;
check('a prefixed saga reads into a pack under the saga\'s id', pack.campaign.id === 'sg-abc' && pack.foes.every((f) => f.id.indexOf('sg-abc-') === 0) && pack.campaign.acts[0].sessions[0].scenes.length === 8, pack.campaign.id + ' ' + pack.foes.map((f) => f.id).join(','));

console.log('saga-forge: the scan');
const found = checkFiles(fx, 'The Stone Warren');
check('The Stone Warren scans clean', found.length === 0, JSON.stringify(found.slice(0, 5)));
const broken = Object.assign({}, fx);
broken['Scenes/03 - The Larders.md'] = fx['Scenes/03 - The Larders.md'].replace('made room. Their Logic increases by 1.', 'made room.').replace('How this scene works', 'How it goes') + '\nA line with a semicolon; and FURZE is CAME.\n';
broken['Foes/Rootbound Weasel.md'] = fx['Foes/Rootbound Weasel.md'].replace('## What it wants', '## Wants');
const got = checkFiles(broken, 'The Stone Warren').map((f) => f.problem);
['Fellmark does not end', 'How this scene works', 'semicolon', 'capitals that read as a code', 'What it wants'].forEach((want) =>
  check('the scan catches: ' + want, got.some((p) => p.indexOf(want) >= 0), got.join(' | ')));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
