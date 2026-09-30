/* The Level Up control belongs where the eye already is. The header button appears when a
 * crystal is banked, but a player at the table has to scroll up to find it and misses it.
 * So the Ascension Crystals row in the lore card becomes the control itself when a crystal
 * is ready: gold, relabelled "Level Up!", and clickable, calling luOpen. With no crystal it
 * is the plain count, and it is not clickable.
 *
 *   node threadspire/tests/level-up-in-card.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const HTML = path.join(__dirname, '..', '..', 'docs', 'fellglass.html');

let pass = 0, fail = 0;
function check(name, ok, detail){ if(ok===true){console.log('  PASS  '+name);pass++;} else {console.log('  FAIL  '+name+'\n          '+detail);fail++;} }

async function boot(){
  const dom = new JSDOM(fs.readFileSync(HTML,'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://example.test/fg.html?host=threadspire',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>null; w.fetch=()=>Promise.reject(new Error('offline')); w.console.error=()=>{}; } });
  await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));
  await new Promise(r=>setTimeout(r,300));
  return dom.window;
}

(async () => {
  const w = await boot();
  const js = (s) => w.eval(s);

  console.log('\nthe Ascension Crystals row is the Level Up control when a crystal is ready');

  console.log('\noutside a rest a player waits; the row says so and does not open levelling');
  js('god=false; window._restLevelOK=false; C.lore.level=1; C.lore.lorePoints=2; renderLore();');
  const waiting = js('(function(){var d=document.querySelectorAll("#loreGrid .counter");for(var i=0;i<d.length;i++){var nm=d[i].querySelector(".nm");if(nm&&/Ascension Crystals/.test(nm.textContent))return (d[i].classList.contains("crystal-ready")?"ready":"plain")+"|"+(/next rest/.test(nm.textContent)?"waits":"-");}return "none";})()');
  check('a player with a crystal, outside a rest: not ready, says it waits for a rest', waiting === 'plain|waits', 'got: ' + waiting);
  check('the header button stays hidden outside a rest', js('document.getElementById("lvlUpBtn").classList.contains("show")') === false, 'shown');

  console.log('\nat a rest (or for the LoreMaster) the row is the control');
  js('window._restLevelOK=true; C.lore.level=1; C.lore.lorePoints=2; renderLore();');
  const readyRow = js('(function(){var d=document.querySelectorAll("#loreGrid .counter");for(var i=0;i<d.length;i++){if(d[i].classList.contains("crystal-ready"))return d[i].querySelector(".nm").textContent+"|"+d[i].getAttribute("role");}return "NONE";})()');
  check('with a crystal: gold-ready row, labelled "Level Up!", role=button', readyRow === 'Level Up!|button', 'got: ' + readyRow);

  js('var _opened=false; var _o=luOpen; window.luOpen=function(){_opened=true;return _o&&_o();}; renderLore();');
  js('(function(){var d=document.querySelectorAll("#loreGrid .counter");for(var i=0;i<d.length;i++){if(d[i].classList.contains("crystal-ready")){d[i].click();break;}}})()');
  check('clicking the ready row calls luOpen', js('_opened') === true, 'luOpen not called');

  js('C.lore.level=1; C.lore.lorePoints=0; renderLore();');
  const plain = js('(function(){var d=document.querySelectorAll("#loreGrid .counter");for(var i=0;i<d.length;i++){var nm=d[i].querySelector(".nm");if(nm&&/Ascension Crystals/.test(nm.textContent))return d[i].classList.contains("crystal-ready")?"READY":"plain";}return "?";})()');
  check('with no crystal: the plain Ascension Crystals count, not clickable', plain === 'plain', 'got: ' + plain);

  js('window._restLevelOK=false; god=true; C.lore.level=1; C.lore.lorePoints=2; renderLore();');
  const lm = js('(function(){var d=document.querySelectorAll("#loreGrid .counter");for(var i=0;i<d.length;i++){if(d[i].classList.contains("crystal-ready"))return "ready";}return "none";})()');
  check('the LoreMaster can level a Fell at any time', lm === 'ready', 'got: ' + lm);
  js('god=false;');

  console.log('\n' + (fail ? 'FAILED ' + fail : 'all ' + pass + ' passed'));
  process.exit(fail ? 1 : 0);
})();
