/* The vault's Adventures become ThreadSpire adventures through scripts/adventureFromVault.js.
 * These checks build a pack from a small fixture adventure written to the vault's
 * ADVENTURE_FORMAT.md, then stand it up in ThreadSpire the way an import does.
 *
 *   - the frontmatter reads: maps, lists, lists of maps, quoted links, [] and null
 *   - every callout becomes the right beat kind, choices as beats, quests as quests
 *   - headings and plain paragraphs become general beats, wikilinks become their words
 *   - every id comes from the vault, and building twice gives the same ids
 *   - foes and characters become library records, speakers link to them
 *   - foes are placed once each, whatever the count says
 *   - ThreadSpire casts the scenes, beats, foes and NPCs from the pack
 *
 *   node threadspire/tests/adventure-vault.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { buildPack, parseYaml } = require('../../scripts/adventureFromVault.js');

const HTML = path.join(__dirname, '..', '..', 'docs', 'threadspire.html');
const FIXTURE = path.join(__dirname, 'fixtures', 'Adventures', 'A Test Night');

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok === true) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name + '\n          ' + detail); fail++; }
}

async function boot() {
  const dom = new JSDOM(fs.readFileSync(HTML, 'utf8'), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://example.test/threadspire.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.fetch = () => Promise.reject(new Error('offline'));
      w.console.error = () => {};
    }
  });
  await new Promise((r) => dom.window.addEventListener('load', r, { once: true }));
  await new Promise((r) => setTimeout(r, 250));
  return dom.window;
}

(async function main() {
  console.log('adventure-vault: the converter');

  const y = parseYaml('a: 1\nb: "[[X|Y]]"\nc: []\nd: null\ne:\n  - one\n  - "two"\nf:\n  - foe: "[[F]]"\n    count: "1"\n  - foe: "[[G]]"\n    count: two\ng:\n  k: v\n  n: 3\nh: true');
  check('YAML: scalars, quoted links, [] and null', y.a === 1 && y.b === '[[X|Y]]' && Array.isArray(y.c) && y.c.length === 0 && y.d === null && y.h === true, JSON.stringify(y));
  check('YAML: lists and lists of maps', JSON.stringify(y.e) === '["one","two"]' && y.f.length === 2 && y.f[0].foe === '[[F]]' && y.f[0].count === '1' && y.f[1].count === 'two', JSON.stringify(y.f));
  check('YAML: nested maps', y.g && y.g.k === 'v' && y.g.n === 3, JSON.stringify(y.g));

  const r1 = buildPack(FIXTURE, { builtAt: 0 });
  const r2 = buildPack(FIXTURE, { builtAt: 0 });
  const pack = r1.pack, camp = pack.campaign;
  check('the pack is a lorefell-adventure-pack-1', pack.meta.format === 'lorefell-adventure-pack-1' && !!camp, JSON.stringify(pack.meta));
  check('building twice gives the same pack, ids and all', JSON.stringify(r1.pack) === JSON.stringify(r2.pack), 'the two builds differ');
  check('the adventure keeps its vault id and is marked synced', camp.id === 'a-test-night' && camp.synced === true && pack.meta.synced === true, camp.id + ' ' + camp.synced);
  check('a scenes adventure is one act with one session, scenes in order', camp.acts.length === 1 && camp.acts[0].sessions.length === 1
    && camp.acts[0].sessions[0].scenes.map((s) => s.id).join(',') === 'tn-01-the-gate,tn-02-the-fight', JSON.stringify(camp.acts[0].sessions[0].scenes.map((s) => s.id)));
  check('a character with no page is reported, not invented', r1.warnings.some((w) => /Nobody Here/.test(w)) && pack.npcs.length === 1, JSON.stringify(r1.warnings));

  const gate = camp.acts[0].sessions[0].scenes[0];
  const kinds = gate.entries.map((e) => e.type).join(',');
  check('callouts, notes and headings map to beat kinds in order', kinds === 'readaloud,general,lorecheck,dialogue,dialogue,dialogue,general,quest,beat', kinds);
  const ids = gate.entries.map((e) => e.id);
  check('beat ids are unique and carry the scene id', new Set(ids).size === ids.length && ids.every((i) => i.indexOf('tn-01-the-gate--') === 0), JSON.stringify(ids));
  const mara = pack.npcs[0];
  const said = gate.entries.filter((e) => e.type === 'dialogue');
  check('a speaker who is a character links to their record; anyone else keeps a name', said[0].speaker === mara.id && said[1].speaker === mara.id && said[2].speaker === 'A stranger', JSON.stringify(said.map((e) => e.speaker)));
  check('wikilinks become their words', /I keep the gate\./.test(said[0].body) && /Go to The Fight\./.test(gate.entries[8].body), said[0].body + ' | ' + gate.entries[8].body);
  check('a note keeps its words', gate.entries[1].body === 'This applies to any Fell that looks closely.' && gate.entries[6].title === 'Going in', JSON.stringify(gate.entries[1]));
  check('a check keeps all its results', /\*\*Fellmark\.\*\*/.test(gate.entries[2].body) && /\*\*Success\.\*\*/.test(gate.entries[2].body) && gate.entries[2].title === 'Vigilance: Seeing it', gate.entries[2].body);
  check('a speaking character is placed in the scene as an NPC', gate.combatants.length === 1 && gate.combatants[0].libId === mara.id && gate.combatants[0].type === 'npc', JSON.stringify(gate.combatants));

  const fight = camp.acts[0].sessions[0].scenes[1];
  const hound = pack.foes[0];
  check('each foe is placed once, whatever the count says', fight.combatants.length === 1 && fight.combatants[0].libId === hound.id, JSON.stringify(fight.combatants));
  check('a foe record reads its frontmatter', hound.id === 'a-test-night--test-hound' && hound.sr === 'Elite' && hound.build === 'Reaver' && hound.stance === 'Stalwart'
    && hound.sig === 'Bleeding' && hound.infusions[0] === 'Brutal' && hound.maxVit === 7, JSON.stringify(hound));
  check('a foe keeps its Acts and its React', hound.abilities.length === 1 && hound.abilities[0].name === 'Savage Bite' && hound.abilities[0].use === 'Act'
    && /React: When a Fell runs/.test(hound.desc), JSON.stringify(hound.abilities) + ' ' + hound.desc);

  console.log('adventure-vault: ThreadSpire stands it up');
  const w = await boot();
  w.S.library = JSON.parse(JSON.stringify(pack.foes.concat(pack.npcs)));
  const spine = w.spineFromRawCampaign(JSON.parse(JSON.stringify(camp)), null);
  const sc = spine && spine.acts[0].sessions[0].scenes;
  check('the spine has both scenes', !!sc && sc.length === 2, JSON.stringify(spine && spine.acts));
  check('the scene keeps every beat', sc[0].beats.length === gate.entries.length && sc[0].beats[7].kind === 'quest', JSON.stringify(sc[0].beats.map((b) => b.kind)));
  check('the foe is cast with its name and rating', sc[1].foes.length === 1 && sc[1].foes[0].name === 'Test Hound' && sc[1].foes[0].sr === 'Elite', JSON.stringify(sc[1].foes));
  check('the character is cast as an NPC', sc[0].npcs.length === 1 && sc[0].npcs[0].name === 'Mara', JSON.stringify(sc[0].npcs));
  const sp = w.beatSpeaker(sc[0].beats[3], sc[0]);
  check('a dialogue beat shows its speaker by name', !!sp && sp.name === 'Mara', JSON.stringify(sp));

  const html = w.beatBodyHtml('- **Fellmark.** *Read:* You <see> it.\n- **Success.** *Then:* 2 * 3');
  check('a beat body shows bold, italic and list marks, and stays escaped', html.indexOf('<b>Fellmark.</b>') >= 0 && html.indexOf('<i>Read:</i>') >= 0
    && html.indexOf('\u2022 ') === 0 && html.indexOf('&lt;see&gt;') >= 0 && html.indexOf('<see>') < 0 && html.indexOf('2 * 3') >= 0, html);
  check('Call for the check starts on the skill the beat names', w.beatSkill({ title: 'Vigilance: Seeing it' }) === 'Vigilance'
    && w.beatSkill({ title: 'The door' }) === 'Lore' && w.beatSkill({ title: 'Nonsense: x' }) === 'Lore', w.beatSkill({ title: 'Vigilance: Seeing it' }));

  console.log('adventure-vault: a synced adventure in ThreadSpire');
  const synced = JSON.parse(JSON.stringify(camp)); synced.vaultPath = 'Adventures/A Test Night';
  w.S.campaignId = 'a-test-night';
  w.S.adventure = w.spineFromRawCampaign(synced, null);
  w.S.syncInfo = { campaignId: 'a-test-night', admin: true, canSync: true, synced: true };
  check('a synced adventure knows it is synced', w.advSynced() === true, JSON.stringify(Object.keys(w.S.adventure)));
  const toasts = []; w.playToast = (m) => toasts.push(m);
  const before = w.S.adventure.acts[0].name;
  w.tsAsk2 = () => { throw new Error('the rename box opened'); };
  let opened = false; try { w.storyRename('act', w.S.adventure.acts[0].id); } catch (e) { opened = true; }
  check('a prep edit is refused with a word, and nothing opens', !opened && w.S.adventure.acts[0].name === before && toasts.length === 1 && /vault/.test(toasts[0]), toasts.join(' | '));
  w.isLM = () => true;
  w.SW.open = true; w.SW.kind = 'scene'; w.SW.id = w.S.adventure.acts[0].sessions[0].scenes[0].id; w.SW.beatOpen = {};
  w.SW.beatOpen[w.SW.id + ':2'] = true;
  w.swPaint();
  const win = w.document.getElementById('storyWin').innerHTML;
  check('the Story window wears the lock and says where it is kept', /sw-box synced/.test(win) && /sw-lock/.test(win) && /Kept in the vault/.test(win), win.slice(0, 400));
  check('the Story window shows a beat as written, bold and all', /<b>Fellmark\.<\/b>/.test(win) && !/\*\*Fellmark/.test(win), (win.match(/sw-bbody[^<]*<[^]{0,200}/) || [''])[0]);
  // jsdom's cascade ignores !important, so check the rules a browser applies rather than computed style
  const rules = []; for (const ss of w.document.styleSheets) for (const r of ss.cssRules) if (r.selectorText) rules.push(r.selectorText + '{' + r.style.cssText + '}');
  const missing = ['.sw-adds', '.sw-tools', '.sw-ins', '.sw-bedit', '.sw-cover-tools'].filter((c) => !rules.some((r) => r.indexOf('.sw-box.synced ' + c + '{') === 0 && /display: none !important/.test(r)));
  check('no adding, renaming, moving or editing controls on a synced adventure', missing.length === 0, 'no hiding rule for ' + missing.join(', '));
  const untouched = JSON.stringify(w.S.adventure);
  ['swAdd("scene", w.S.adventure.acts[0].sessions[0].id)', 'storyBeatAdd(w.SW.id, 0)', 'storyBeatOpen(w.SW.id, 0)', 'swDescEdit()', 'swCoverClear()', 'tsPartImport("scene", w.S.adventure.acts[0].sessions[0].id)', 'contOpen(w.SW.id)', 'advTypeWorldEdit()']
    .forEach((c) => { try { w.eval(c.replace(/w\./g, '')); } catch (e) {} });
  check('every edit the Story window offers is refused on a synced adventure', JSON.stringify(w.S.adventure) === untouched && !w.document.querySelector('#tsModal.open'), 'something changed or a box opened');
  const dropped = JSON.stringify(w.S.adventure.acts[0].sessions[0].scenes[0].beats.map((b) => b.id));
  w.SW.beat = 0; w.swBeatDrop(w.SW.id, 2);
  check('dragging a beat on a synced adventure moves nothing', JSON.stringify(w.S.adventure.acts[0].sessions[0].scenes[0].beats.map((b) => b.id)) === dropped, 'the beats moved');
  // a foe kept in the vault: its sheet reads but does not edit or save
  const vfoe = Object.assign(JSON.parse(JSON.stringify(pack.foes[0])), { campaignId: 'a-test-night' });
  w.S.library = [vfoe]; w.S.libLoaded = true; w.FORGE.loaded = true;
  let saved = 0; const _libSave = w.libSave; w.libSave = () => { saved++; };
  try { w.entrySheet('lib', null, 'foe', vfoe.id); } catch (e) { console.log('          sheet threw: ' + e.message); }
  const panel = w.document.querySelector('#tsModal .tsm-panel');
  const live = panel ? [...panel.querySelectorAll('input, select, textarea, button')].filter((el) => !el.disabled && !/sheetBack|tsCloseModal/.test(el.getAttribute('onclick') || '') && !el.classList.contains('tsm-x')) : ['no sheet'];
  check('a vault foe\'s sheet says where it is kept, and nothing on it can be changed', !!panel && panel.classList.contains('sheet-locked') && /Kept in the vault/.test(panel.innerHTML) && live.length === 0,
    panel ? live.map((el) => el.outerHTML.slice(0, 80)).join(' | ') : 'no sheet opened');
  w.sheetSync({ obj: vfoe, lib: vfoe });
  check('and nothing it holds is saved', saved === 0, 'saved ' + saved);
  w.libSave = _libSave; w.tsCloseModal();
  const banner = w.syncBannerHtml();
  check('the Story window says where it is kept, and an admin gets the switch', /Kept in the vault/.test(banner) && /Adventures\/A Test Night/.test(banner) && /Lift the vault lock/.test(banner), banner);
  w.S.syncInfo.admin = false;
  check('anyone else gets no switch', !/Lift the vault lock/.test(w.syncBannerHtml()), w.syncBannerHtml());
  w.S.adventure.synced = false;
  check('an adventure that is not synced edits as always', w.syncedNo() === false && w.syncBannerHtml() === '', w.syncBannerHtml());
  w.S.syncInfo = { campaignId: 'a-test-night', admin: true, canSync: false, synced: false };
  check('an admin gets Lock to the vault on an adventure never kept there', /Lock to the vault</.test(w.syncBannerHtml()) && !/again/.test(w.syncBannerHtml()), w.syncBannerHtml());
  w.S.syncInfo.admin = false;
  check('anyone else does not', w.syncBannerHtml() === '', w.syncBannerHtml());

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
