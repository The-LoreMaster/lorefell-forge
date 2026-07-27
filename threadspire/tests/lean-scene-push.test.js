/* A player needs the scene in front of them, not the whole authored adventure. A six-act,
 * sixty-nine-scene story was 690KB and could not ride the one shared state row to the
 * players (Wix caps it), so it either failed or, once handled, simply did not travel. But
 * the players never needed the other sixty-eight scenes: only the active one, its board,
 * foes, and beats, is what the map and combat run on.
 *
 * So only the active scene travels now, wrapped as a one-scene adventure the player stands
 * up exactly as before. A large story rides the row in a few KB, and the players get what
 * they need. When the loremaster changes scenes, advRev bumps and the new scene goes next.
 *
 *   node threadspire/tests/lean-scene-push.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const HTML = path.join(__dirname, '..', '..', 'docs', 'threadspire.html');

let pass = 0, fail = 0;
function check(n, ok, d){ if(ok===true){console.log('  PASS  '+n);pass++;} else {console.log('  FAIL  '+n+'\n          '+d);fail++;} }

async function boot(){
  const dom = new JSDOM(fs.readFileSync(HTML,'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://example.test/t.html',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>null; w.fetch=()=>Promise.reject(new Error('offline')); w.console.error=()=>{}; } });
  await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));
  await new Promise(r=>setTimeout(r,250));
  return dom.window;
}

(async () => {
  const w = await boot();
  const js = (s)=>w.eval(s);
  js('S.role="lm"; S.instance={bindings:{}};');
  js([
    'var acts=[];',
    'for(var a=0;a<3;a++){ var scenes=[]; for(var sc=0;sc<20;sc++){ scenes.push({id:"sc-"+a+"-"+sc,name:"Scene "+a+"-"+sc,beats:[{kind:"general",title:"b",body:"x".repeat(500)}],foes:[],npcs:[],fell:[]}); }',
    '  acts.push({id:"act-"+a,name:"Act "+a,sessions:[{id:"ses-"+a,name:"S",scenes:scenes}]}); }',
    'acts[1].sessions[0].scenes[5].foes=[{id:"f1",name:"Grimgrit",sr:"Elite",curVit:30,maxVit:30}];',
    'S.adventure={name:"Stone and Sovereign",activeSceneId:"sc-1-5",acts:acts};'
  ].join("\n"));

  console.log('\nonly the active scene travels to the players');

  const wholeKB = js('Math.round(JSON.stringify(S.adventure).length/1024)');
  const lean = js('activeSceneSpine()');
  const leanKB = js('Math.round(JSON.stringify(activeSceneSpine()).length/1024)');
  check('the whole adventure is large', wholeKB > 25, wholeKB + 'KB');
  check('the lean push is far smaller than the whole', leanKB < wholeKB/10, 'lean=' + leanKB + 'KB whole=' + wholeKB + 'KB');
  check('the lean spine carries the active scene id', lean.activeSceneId === 'sc-1-5', lean.activeSceneId);
  check('the lean spine has exactly one scene', lean.acts[0].sessions[0].scenes.length === 1, String(lean.acts[0].sessions[0].scenes.length));
  check('the lean scene keeps its foes, so combat works', lean.acts[0].sessions[0].scenes[0].foes.length === 1 && lean.acts[0].sessions[0].scenes[0].foes[0].name === 'Grimgrit', JSON.stringify(lean.acts[0].sessions[0].scenes[0].foes));

  js('var _lean=activeSceneSpine(); S.role="player"; S._advRemote=false; S.adventure=null; loadAdventureSpine(_lean);');
  check('a player applying it lands on the active scene', js('S.scene && S.scene.id') === 'sc-1-5', 'scene=' + js('S.scene&&S.scene.id'));
  check('the player sees the foe for combat', js('S.scene && S.scene.foes && S.scene.foes.length') === 1, 'foes=' + js('S.scene&&S.scene.foes&&S.scene.foes.length'));

  console.log('\n' + (fail ? 'FAILED ' + fail : 'all ' + pass + ' passed'));
  process.exit(fail ? 1 : 0);
})();
