/* The shared FellGlass bridge, one copy for the sheet's own page and for the copy
   embedded in ThreadSpire's rail. These two used to be hand-copied and drift; this
   proves the one handler routes saves, opens Fells, and reaches host hooks the same
   way for both hosts.\n\n     node threadspire/tests/fg-bridge.test.mjs */
import { handleSheetMessage } from '../../velo/public/fgSheetBridge.js';
import { submitAbility } from '../../velo/public/abilitySubmit.js';
import { fileURLToPath } from 'url';

let pass=0, fail=0;
const t=(n,ok,d)=>{console.log((ok?'  PASS  ':'  FAIL  ')+n+(ok?'':'  -> '+d));ok?pass++:fail++;};

function mkApi(over={}){
  const calls=[];
  const rec=(name)=>(...args)=>{calls.push({name,args});return (over[name]?over[name](...args):Promise.resolve(defaultFor(name)));};
  const api={};
  ['listMyCharacters','myAdventures','loadCharacter','saveCharacter','deleteCharacter','leaveAdventure','getClueCards','listQuests','getCombatForChar','saveCombatDeclare','syncCombatPlayer','getLibraries','lmSaveCharacter'].forEach(n=>api[n]=rec(n));
  api._calls=calls;
  return api;
}
function defaultFor(name){
  if(name==='listMyCharacters')return [{id:'c1'},{id:'c2'}];
  if(name==='myAdventures')return [];
  if(name==='getLibraries')return {origins:[1]};
  if(name==='loadCharacter')return {forged:false,character:{created:true,identity:{name:'X'}}};
  if(name==='saveCharacter')return {ok:true,id:'c1'};
  if(name==='lmSaveCharacter')return {ok:true,id:'gc'};
  if(name==='deleteCharacter')return {ok:true};
  if(name==='listQuests')return {ok:true,quests:[]};
  if(name==='getClueCards')return [];
  if(name==='getCombatForChar')return null;
  return undefined;
}
function ctx(over={}){
  let id=over.id||'';
  const sent=[];
  return {
    reply:(o)=>sent.push(o),
    getCharId:()=>id, setCharId:(v)=>id=v,
    api:over.api||mkApi(),
    _sent:sent, get id(){return id;},
    ...over.ctxExtra
  };
}

(async()=>{
  // save routing: without godCharId -> saveCharacter, ack carries saveSeq
  {
    const c=ctx();
    await handleSheetMessage({type:'save',charId:'c1',saveSeq:7,character:{}},c);
    const savedMsg=c._sent.find(m=>m.type==='saved');
    t('save without god calls saveCharacter', c.api._calls.some(x=>x.name==='saveCharacter')&&!c.api._calls.some(x=>x.name==='lmSaveCharacter'),'calls: '+c.api._calls.map(x=>x.name));
    t('save acks with the same saveSeq', savedMsg&&savedMsg.saveSeq===7, JSON.stringify(savedMsg));
  }
  // save routing: with godCharId matching -> lmSaveCharacter
  {
    const c=ctx({ctxExtra:{godCharId:'gc'}});
    await handleSheetMessage({type:'save',charId:'gc',saveSeq:3,character:{}},c);
    t('save on the held Fell goes through lmSaveCharacter', c.api._calls.some(x=>x.name==='lmSaveCharacter')&&!c.api._calls.some(x=>x.name==='saveCharacter'),'calls: '+c.api._calls.map(x=>x.name));
    const savedMsg=c._sent.find(m=>m.type==='saved');
    t('gated save still acks', savedMsg&&savedMsg.saveSeq===3, JSON.stringify(savedMsg));
  }
  // save routing: godCharId set but a DIFFERENT charId -> normal save (player editing own)
  {
    const c=ctx({ctxExtra:{godCharId:'gc'}});
    await handleSheetMessage({type:'save',charId:'other',saveSeq:1,character:{}},c);
    t('a save for a different Fell is not gated', c.api._calls.some(x=>x.name==='saveCharacter')&&!c.api._calls.some(x=>x.name==='lmSaveCharacter'),'calls: '+c.api._calls.map(x=>x.name));
  }
  // failed save acks ok:false with reason
  {
    const c=ctx({api:mkApi({saveCharacter:()=>Promise.resolve({ok:false,error:'not yours'})})});
    await handleSheetMessage({type:'save',charId:'c1',saveSeq:2,character:{}},c);
    const s=c._sent.find(m=>m.type==='saved');
    t('a refused save acks ok:false with the reason', s&&s.ok===false&&s.error==='not yours', JSON.stringify(s));
  }
  // a throwing save still acks
  {
    const c=ctx({api:mkApi({saveCharacter:()=>{throw new Error('boom');}})});
    await handleSheetMessage({type:'save',charId:'c1',saveSeq:9,character:{}},c);
    const s=c._sent.find(m=>m.type==='saved');
    t('a throwing save still acks ok:false', s&&s.ok===false&&/boom/.test(s.error), JSON.stringify(s));
  }
  // initNeedsCreated true: an uncreated record opens 'new' (the forge)
  {
    const c=ctx({ctxExtra:{initNeedsCreated:true},api:mkApi({loadCharacter:()=>Promise.resolve({forged:false,character:{created:false}})})});
    await handleSheetMessage({type:'select-character',charId:'c1'},c);
    t('standalone: uncreated Fell opens new (forge)', c._sent.some(m=>m.type==='new'), c._sent.map(m=>m.type).join(','));
  }
  // initNeedsCreated false (default): an uncreated record opens 'init'
  {
    const c=ctx({api:mkApi({loadCharacter:()=>Promise.resolve({forged:false,character:{created:false}})})});
    await handleSheetMessage({type:'select-character',charId:'c1'},c);
    t('threadspire: uncreated Fell opens init (shown as-is)', c._sent.some(m=>m.type==='init'), c._sent.map(m=>m.type).join(','));
  }
  // ready onReady handled -> bridge stops, no characters/adventures sent
  {
    const c=ctx({ctxExtra:{onReady:async()=>true}});
    await handleSheetMessage({type:'ready'},c);
    t('onReady returning true halts the bridge', c._sent.length===0, 'sent: '+c._sent.map(m=>m.type).join(','));
  }
  // ready onReady not handled -> full open sequence
  {
    const c=ctx({ctxExtra:{onReady:async()=>false}});
    await handleSheetMessage({type:'ready'},c);
    const types=c._sent.map(m=>m.type);
    t('ready sends characters, adventures, and opens', types.includes('characters')&&types.includes('adventures')&&(types.includes('init')||types.includes('new')), types.join(','));
  }
  // threadspire-open routed to host hook
  {
    let hit=null; const c=ctx({ctxExtra:{onThreadspireOpen:(m)=>hit=m.charId}});
    await handleSheetMessage({type:'threadspire-open',charId:'zz'},c);
    t('threadspire-open reaches the host hook', hit==='zz', 'hit='+hit);
  }
  // feedback routed to host hook
  {
    let hit=null; const c=ctx({ctxExtra:{onFeedback:(p)=>hit=p}});
    await handleSheetMessage({type:'LOREFELL_FEEDBACK_SUBMIT',payload:{comment:'hi'}},c);
    t('feedback reaches the host hook', hit&&hit.comment==='hi', JSON.stringify(hit));
  }
  // unknown/absent hooks do not throw
  {
    const c=ctx();
    await handleSheetMessage({type:'threadspire-open',charId:'x'},c); // no hook supplied
    await handleSheetMessage({type:'LOREFELL_FEEDBACK_SUBMIT',payload:{}},c);
    t('missing host hooks are silently fine', true);
  }
  // clues-request replies with clues
  {
    const c=ctx();
    await handleSheetMessage({type:'clues-request',charId:'c1'},c);
    t('clues-request replies clues', c._sent.some(m=>m.type==='clues'), c._sent.map(m=>m.type).join(','));
  }

  // LOREFELL_ABILITY_SUBMIT from the sheet's "Make your own": the SigilForge page's own submit
  {
    const calls=[];
    const sapi=mkApi();
    sapi.submitAbility=submitAbility;
    sapi.findSimilar=(k,p)=>{calls.push(['findSimilar',k,p]);return Promise.resolve([{title:'Near'}]);};
    sapi.submitCreation=(k,p)=>{calls.push(['submitCreation',k,p]);return Promise.resolve({ok:true,errors:[],warnings:['w1']});};
    sapi.uploadRune=()=>{calls.push(['uploadRune']);return Promise.resolve('u');};
    const c=ctx({api:sapi});
    await handleSheetMessage({type:'LOREFELL_ABILITY_SUBMIT',reqId:4,payload:{title:'Ember Lash',flavorText:'Sparks.',fullExplanation:'Attack.',cost:2,runePng:'',forge:{tier:1,form:1,mode:'weapon',kind:'character',selections:['Standard Damage','One Target','Advanced'],meta:{type:'Ability'}}}},c);
    const sub=calls.find(x=>x[0]==='submitCreation');
    t('ability submit calls submitCreation for the sigilforge, as the SigilForge page does', sub&&sub[1]==='sigilforge'&&sub[2].title==='Ember Lash'&&sub[2].authored===true&&sub[2].cost===2&&sub[2].selections.join()==='Standard Damage,One Target,Advanced'&&sub[2].fullText==='Attack.', JSON.stringify(sub));
    t('no rune, no upload', !calls.some(x=>x[0]==='uploadRune'), JSON.stringify(calls.map(x=>x[0])));
    const r=c._sent.find(m=>m.type==='LOREFELL_SUBMIT_RESULT');
    t('it answers LOREFELL_SUBMIT_RESULT with the reqId, ok, warnings and similar', r&&r.reqId===4&&r.ok===true&&r.warnings[0]==='w1'&&r.similar[0].title==='Near', JSON.stringify(r));
  }
  {
    const sapi=mkApi();
    sapi.submitAbility=submitAbility;
    sapi.findSimilar=()=>{throw new Error('down');};
    sapi.submitCreation=()=>Promise.reject(new Error('down'));
    sapi.uploadRune=()=>Promise.reject(new Error('down'));
    const c=ctx({api:sapi});
    await handleSheetMessage({type:'LOREFELL_ABILITY_SUBMIT',reqId:5,payload:{title:'X',runePng:'data:',forge:{}}},c);
    const r=c._sent.find(m=>m.type==='LOREFELL_SUBMIT_RESULT');
    t('a backend that throws answers ok:false with the SigilForge page\'s words', r&&r.ok===false&&r.errors[0]==='The forge could not reach the vault. Try again.'&&r.reqId===5, JSON.stringify(r));
  }
  {
    const c=ctx();
    await handleSheetMessage({type:'LOREFELL_ABILITY_SUBMIT',reqId:6,payload:{title:'X'}},c);
    const r=c._sent.find(m=>m.type==='LOREFELL_SUBMIT_RESULT');
    t('a host that has not wired the submit still answers, ok:false', r&&r.ok===false&&r.reqId===6&&r.errors.length===1, JSON.stringify(r));
  }
  // both hosts wire it: the sheet's own page and ThreadSpire
  {
    const fs=await import('fs');
    const root=fileURLToPath(new URL('../../velo/', import.meta.url));
    for (const pg of ['page-fellglass.js','page-threadspire.js']){
      const src=fs.readFileSync(root+pg,'utf8');
      t(pg+' hands the bridge the SigilForge submit and its web methods', /from 'public\/abilitySubmit\.js'/.test(src)&&/submitAbility, submitCreation, findSimilar, uploadRune/.test(src), 'not wired');
    }
    const sf=fs.readFileSync(root+'page-sigilforge.js','utf8');
    t('page-sigilforge.js submits through the same shared function', /submitAbility\(raw, \{ submitCreation, findSimilar, uploadRune \}\)/.test(sf), 'not shared');
  }

  console.log('\n'+(fail?('FAILED '+fail+' of '+(pass+fail)):('all '+pass+' passed')));
  process.exit(fail?1:0);
})();
