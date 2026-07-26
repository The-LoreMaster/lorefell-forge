/* The adventure is its own thing now, stored once and read by whoever opens it. ThreadSpire
 * builds its play spine from the authored campaign record straight from the account, rather
 * than waiting for FateWell to shape it and push it across. So an adventure opens with its
 * story on the first load and on a switch, by anyone who keeps it, with no push required.
 *
 * These checks build the spine from a raw campaign, confirm the cast (foes with computed
 * damage, npcs split out, party Fell placed), stand it up through the context handler on
 * both a fresh open and a switch, and confirm a live FateWell push still wins when there
 * is one.
 *
 *   node threadspire/tests/adventure-source.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = path.join(__dirname, '..', '..', 'docs', 'threadspire.html');

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

const RAW = {
  name: 'Stone and Sovereign',
  players: [{ id: 'p1', charId: 'c1', name: 'Nyra', maxVit: 20 }],
  acts: [{ id: 'a1', name: 'Act I', sessions: [{ id: 's1', name: 'Session 1', scenes: [
    { id: 'sc1', name: 'The Understone',
      entries: [{ type: 'general', title: 'Open', body: 'A cold hall.' }],
      combatants: [
        { id: 'f1', name: 'Grimgrit', sr: 'Elite', maxVit: 30, attrs: { Power: 3, Magic: 0, Precision: 2 }, infusions: [] },
        { id: 'n1', type: 'npc', name: 'Glower' }
      ] }
  ] }] }]
};

(async () => {
  const w = await boot();
  const js = (s) => w.eval(s);
  w.__raw = RAW;
  js('S.role="lm"; S.instance={bindings:{}};');

  console.log('\nthe spine is built from the authored adventure');

  const sp = JSON.parse(js('JSON.stringify(spineFromRawCampaign(window.__raw, null))'));
  const scene = sp.acts[0].sessions[0].scenes[0];
  check('the act and scene come across', sp.acts.length === 1 && sp.acts[0].sessions[0].scenes.length === 1, JSON.stringify(sp.acts.length));
  check('scene entries become beats', scene.beats.length === 1 && scene.beats[0].body === 'A cold hall.', JSON.stringify(scene.beats));
  check('a foe is cast with damage computed by the table', scene.foes.length === 1 && typeof scene.foes[0].dmg.base === 'number', JSON.stringify(scene.foes[0] && scene.foes[0].dmg));
  check('an npc is separated from the foes', scene.npcs.length === 1 && scene.npcs[0].name === 'Glower', JSON.stringify(scene.npcs));
  check('the party Fell lands on the scene by charId', scene.fell.length === 1 && scene.fell[0].charId === 'c1', JSON.stringify(scene.fell));

  console.log('\nopening and switching stand up the story');

  js('S._advRemote=false; S.adventure=null; _advSwitching=true;');
  js('(window.onmessage)({ data: Object.assign({ type:"THREADSPIRE_CONTEXT", role:"lm", campaignId:"SnS", switched:true, rawCampaign: window.__raw }) });');
  check('a switched context stands up the adventure', js('S.adventure && S.adventure.acts && S.adventure.acts.length') === 1, 'acts=' + js('S.adventure && S.adventure.acts && S.adventure.acts.length'));
  check('the switch veil lifts once the story is up', js('_advSwitching') === false, '_advSwitching=' + js('_advSwitching'));

  js('S._advRemote=false; S.adventure=null;');
  js('(window.onmessage)({ data:{ type:"THREADSPIRE_CONTEXT", role:"lm", campaignId:"SnS", rawCampaign: window.__raw } });');
  check('a fresh open also stands up the story', js('S.adventure && S.adventure.name') === 'Stone and Sovereign', 'name=' + js('S.adventure && S.adventure.name'));

  console.log('\na live push still wins over the stored copy');

  js('S._advRemote=true; S.adventure={name:"Live Pushed",activeSceneId:"x",acts:[{id:"z",name:"Live",sessions:[]}]};');
  js('(window.onmessage)({ data:{ type:"THREADSPIRE_CONTEXT", role:"lm", campaignId:"SnS", rawCampaign: window.__raw } });');
  check('a live FateWell push is not overwritten by the stored copy', js('S.adventure && S.adventure.name') === 'Live Pushed', 'name=' + js('S.adventure && S.adventure.name'));

  console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'all ' + pass + ' checks passed'));
  process.exit(fail ? 1 : 0);
})();
