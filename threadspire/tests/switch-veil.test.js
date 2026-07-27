/* Switching to a large adventure hung on "Still here" even though its story loaded (Seams
 * showed the real 6 acts / 69 scenes). The veil-lift sat inside the try that builds the
 * spine, after loadAdventureSpine, and a large or awkward spine that threw while standing
 * up skipped the lift, and the throw was swallowed silently. The veil never came down.
 *
 * The lift now happens whether the spine stood up cleanly, stumbled, or never arrived, so
 * a switch can never hang the table. A build error is recorded in Seams rather than eaten.
 *
 *   node threadspire/tests/switch-veil.test.js
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
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

(async () => {
  const w = await boot();
  const js = (s)=>w.eval(s);
  js('S.role="lm"; S.instance={bindings:{}};');
  w.__raw = { name:'Stone and Sovereign', players:[], acts:[{id:'a1',name:'Act I',sessions:[{id:'s1',name:'S1',scenes:[{id:'sc1',name:'Scene',entries:[],combatants:[]}]}]}] };

  console.log('\na switch never hangs the table on "Still here"');

  js('S._advRemote=false; S.adventure=null; _advSwitching=true; advGoing("S&S");');
  js('(window.onmessage)({ data:{ type:"THREADSPIRE_CONTEXT", role:"lm", campaignId:"SnS", switched:true, rawCampaign: window.__raw } });');
  await sleep(40);
  check('a clean switch lifts the veil', js('_advSwitching')===false && js('advVeiled()')===false, 'switching='+js('_advSwitching')+' veiled='+js('advVeiled()'));
  check('a clean switch loads the story', js('S.adventure && S.adventure.acts && S.adventure.acts.length')===1, 'acts='+js('S.adventure&&S.adventure.acts&&S.adventure.acts.length'));

  js('S._advRemote=false; S.adventure=null; _advSwitching=true; advGoing("S&S");');
  js('var _os=spineFromRawCampaign; window.spineFromRawCampaign=function(){ throw new Error("boom big spine"); };');
  js('(window.onmessage)({ data:{ type:"THREADSPIRE_CONTEXT", role:"lm", campaignId:"SnS", switched:true, rawCampaign: window.__raw } });');
  await sleep(40);
  check('a throwing spine build STILL lifts the veil', js('_advSwitching')===false && js('advVeiled()')===false, 'switching='+js('_advSwitching')+' veiled='+js('advVeiled()'));
  check('the spine error is recorded, not swallowed', /spine build: boom/.test(js('SEAM.lastErr||""')), 'lastErr='+js('SEAM.lastErr'));
  js('window.spineFromRawCampaign=_os;');

  js('S._advRemote=false; S.adventure=null; _advSwitching=true; advGoing("S&S");');
  js('(window.onmessage)({ data:{ type:"THREADSPIRE_CONTEXT", role:"lm", campaignId:"SnS", switched:true } });');
  await sleep(40);
  check('a switch with no rawCampaign still lifts the veil', js('_advSwitching')===false && js('advVeiled()')===false, 'switching='+js('_advSwitching'));

  console.log('\n' + (fail ? 'FAILED ' + fail : 'all ' + pass + ' passed'));
  process.exit(fail ? 1 : 0);
})();
