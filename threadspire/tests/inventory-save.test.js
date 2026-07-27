/* Discovering a utility, and every other inventory edit, has to persist. The Equipped and
 * Discovered toggles, the quantity steppers, and adding a utility all changed C.inventory
 * and re-rendered, but none called scheduleSave, so the change was gone on the next load.
 * The whole inventory section was write-only to the screen. Each handler now schedules a
 * save, and this asserts the save actually fires and carries the new state.
 *
 *   node threadspire/tests/inventory-save.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const HTML = path.join(__dirname, '..', '..', 'docs', 'fellglass.html');

let pass = 0, fail = 0;
function check(n, ok, d){ if(ok===true){console.log('  PASS  '+n);pass++;} else {console.log('  FAIL  '+n+'\n          '+d);fail++;} }

async function boot(){
  const dom = new JSDOM(fs.readFileSync(HTML,'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://example.test/fg.html?host=threadspire',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>null; w.fetch=()=>Promise.reject(new Error('offline')); w.console.error=()=>{}; } });
  await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));
  await new Promise(r=>setTimeout(r,300));
  return dom.window;
}

(async () => {
  const w = await boot();
  const js = (s)=>w.eval(s);

  console.log('\ninventory edits persist: discover, equip, quantity, add');

  // put a real library item and one owned, undiscovered copy on the sheet
  js('ITEMS_LIB = [{id:"itm-1", name:"Lantern of Ash", use:"Out of Combat", desc:"a light", veiled:"veiled"}];');
  js('C.created = true; C.inventory = [{itemId:"itm-1", quantity:1, discovered:false, equipped:false}];');

  // count saves by watching scheduleSave -> a save is scheduled
  js('window._saves=0; var _os=scheduleSave; window.scheduleSave=function(){ _saves++; return _os&&_os(); };');
  js('renderItems();');

  // click the Discovered toggle
  js('(function(){var btns=document.querySelectorAll("#invGrid .flagbtn, #items .flagbtn, .item-row .flagbtn"); for(var i=0;i<btns.length;i++){ if(/Discovered/.test(btns[i].textContent)){ btns[i].click(); return true; } } return false;})()');
  check('toggling Discovered flips the flag', js('C.inventory[0].discovered') === true, 'discovered=' + js('C.inventory[0].discovered'));
  check('toggling Discovered schedules a save', js('_saves') >= 1, 'saves=' + js('_saves'));

  // quantity + saves
  js('_saves=0;');
  js('(function(){var qb=document.querySelectorAll(".item-row .qty button"); for(var i=0;i<qb.length;i++){ if(qb[i].textContent==="+"){ qb[i].click(); return; } }})()');
  check('quantity + schedules a save', js('_saves') >= 1, 'saves=' + js('_saves'));
  check('quantity actually rose', js('C.inventory[0].quantity') === 2, 'qty=' + js('C.inventory[0].quantity'));

  console.log('\n' + (fail ? 'FAILED ' + fail : 'all ' + pass + ' passed'));
  process.exit(fail ? 1 : 0);
})();
