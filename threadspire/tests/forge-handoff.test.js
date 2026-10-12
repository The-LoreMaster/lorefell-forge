/* FellForge and FellGlass hand a Fell between them (Nate, 2026-10-12):
 *
 *   - Creation offers a third path, The FellForge Path. Picking it asks the host page to open
 *     FellForge (fellforge-open), which saves a forged record and sends the player back with it.
 *   - A forged Fell opens creation pre-filled, and the 2.5 second fallback that opens a blank
 *     wizard leaves it alone (it used to reset the wizard and drop the seed).
 *   - What the Archive wrote in FellForge lands in the sheet's Description when creation ends.
 *
 *   node threadspire/tests/forge-handoff.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const HTML = path.join(__dirname, '..', '..', 'docs', 'fellglass.html');

let pass = 0, fail = 0;
function check(n, ok, d){ if(ok===true){console.log('  PASS  '+n);pass++;} else {console.log('  FAIL  '+n+'\n          '+d);fail++;} }

async function boot(){
  const posted = [];
  const dom = new JSDOM(fs.readFileSync(HTML,'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://example.test/fg.html',
    beforeParse(w){
      w.HTMLCanvasElement.prototype.getContext=()=>null; w.fetch=()=>Promise.reject(new Error('offline'));
      w.console.error=()=>{}; w.confirm=()=>true; w.alert=()=>{};
      // hosted: the sheet talks to a parent page, which records what it is asked
      Object.defineProperty(w,'parent',{ configurable:true, value:{ postMessage(m){ posted.push(m); } } });
    } });
  await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));
  await new Promise(r=>setTimeout(r,100));
  return { w: dom.window, posted };
}

const SEED = {
  identity: { name:'Veyel', sex:'Female', lineage:'Fribbit', origin:'The Clever', motivation:'The Resistant',
    desc:'You woke in the rain with mud to the knees and a name that did not fit.' },
  hooks:'Quirk: Hums a tune no one else knows.',
  fragments:'Keepsake: You carry a sealed letter you cannot bring yourself to open.',
  firstImpression:'Strangers see someone listening for a voice behind them.',
  tips:'Ask before you act.\nKeep the letter closed.\nTrust the rain.'
};

(async () => {
  console.log('\nFellForge to FellGlass handoff');

  // 1. the path step offers FellForge, and picking it asks the host to open FellForge
  {
    const { w, posted } = await boot();
    const js = (s)=>w.eval(s);
    js('ccOpen()');
    const names = js('[...document.querySelectorAll("#ccCard .lu-opt .o-nm")].map(e=>e.textContent)');
    check('creation offers three paths, FellForge among them', names.length===3 && names.includes('The FellForge Path'), JSON.stringify(names));
    js('[...document.querySelectorAll("#ccCard .lu-opt")].find(b=>b.textContent.includes("The FellForge Path")).click()');
    check('picking it posts fellforge-open to the host page', posted.some(m=>m&&m.type==='fellforge-open'), JSON.stringify(posted.map(m=>m&&m.type)));
  }

  // 2. a forged Fell arrives before the fallback timer, and the timer does not wipe it
  {
    const { w } = await boot();
    const js = (s)=>w.eval(s);
    w.dispatchEvent(new w.MessageEvent('message', { data:{ type:'new', forge:SEED, charId:'row-1' } }));
    await new Promise(r=>setTimeout(r,2700));
    check('the forged seed survives the 2.5 second fallback', js('!!(CC&&CC.forge&&CC.path==="pregen")'), 'CC=' + js('JSON.stringify(CC&&{path:CC.path,step:CC.step,forge:!!CC.forge})'));
    check('the name carries over', js('CC&&CC.name')==='Veyel', String(js('CC&&CC.name')));
  }

  // 3. the Archive's text becomes the sheet's Description when creation finishes
  {
    const { w } = await boot();
    const js = (s)=>w.eval(s);
    js('ccOpenForge('+JSON.stringify(SEED)+')');
    check('the Archive text pre-fills the identity Description', js('CC.desc')===SEED.identity.desc, String(js('CC.desc')));
    // finish the choices the forge leaves open (the arsenal), then apply
    js('CC.weaponTree=CC.weaponTree||"Blades"; CC.infusion=CC.infusion||null; CC.lbType=CC.lbType||"Familiar"; if(!CC.pgOrigin) CC.pgOrigin=PREGEN_ORIGINS[0]; CC.motivation=CC.motivation||"The Resistant"; ccApply();');
    const desc = js('C.identity.desc')||'';
    check('the sheet is marked created', js('C.created')===true, 'created=' + js('C.created'));
    check('the Description holds what the Archive wrote', desc.includes(SEED.identity.desc), JSON.stringify(desc.slice(0,200)));
    check('first impression, how to play and fragments follow it', desc.includes(SEED.firstImpression) && desc.includes('Trust the rain.') && desc.includes('sealed letter'), JSON.stringify(desc));
    check('the Description field shows it', js('document.getElementById("f-desc").value')===desc, 'field differs');
  }

  // 4. on FellGlass's own page the forging covers the sheet until ThreadSpire takes over, and
  //    the move waits for the first save to be answered (the sheet used to flash in between)
  {
    const { w, posted } = await boot();
    const js = (s)=>w.eval(s);
    w.dispatchEvent(new w.MessageEvent('message', { data:{ type:'new', forge:SEED, charId:'row-1' } }));
    await new Promise(r=>setTimeout(r,200));
    js('CC.weaponTree=CC.weaponTree||"Blades"; CC.infusion=CC.infusion||null; CC.lbType=CC.lbType||"Familiar"; if(!CC.pgOrigin) CC.pgOrigin=PREGEN_ORIGINS[0]; CC.motivation=CC.motivation||"The Resistant"; ccApply();');
    const opened = ()=>posted.some(m=>m&&m.type==='threadspire-open');
    await new Promise(r=>setTimeout(r,3600));
    check('with the save unanswered, it does not leave yet', !opened(), 'left before the save was answered');
    check('the forging still covers the sheet', js('document.getElementById("forge").classList.contains("play")'), 'the sheet is showing');
    const seq = js('SAVE_SEQ');
    w.dispatchEvent(new w.MessageEvent('message', { data:{ type:'saved', ok:true, saveSeq:seq, charId:'row-1', localId:js('CUR_LOCAL_ID') } }));
    await new Promise(r=>setTimeout(r,500));
    check('once the save is answered, it opens ThreadSpire with the Fell', posted.some(m=>m&&m.type==='threadspire-open'&&m.charId==='row-1'), JSON.stringify(posted.filter(m=>m&&m.type==='threadspire-open')));
    check('and the forging is still up as the page leaves', js('document.getElementById("forge").classList.contains("play") && !document.getElementById("forge").classList.contains("out")'), 'cleared before leaving');
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
