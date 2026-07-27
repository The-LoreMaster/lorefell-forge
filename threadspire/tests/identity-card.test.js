/* Four changes to the identity card, on the player's own sheet and on the LoreMaster's
 * view of a player (the god-sheet), which are the same page told apart by the god flag:
 *
 *   - The Motivation dropdown hides once a motivation is chosen; it only clutters the card
 *     after it has done its job, and returns if the motivation is cleared.
 *   - The Adventure block sits under the whole Motivation area and above Description.
 *   - The leave control reads "Leave adventure" for the player and "Kick Player" for the
 *     LoreMaster looking at that player. Same action, different words for who does it.
 *   - The manual "LM Mode" button is gone; the LoreMaster reaches a player through the
 *     table now, so the toggle is unnecessary.
 *
 *   node threadspire/tests/identity-card.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const HTML = path.join(__dirname, '..', '..', 'docs', 'fellglass.html');

let pass = 0, fail = 0;
function check(n, ok, d){ if(ok===true){console.log('  PASS  '+n);pass++;} else {console.log('  FAIL  '+n+'\n          '+d);fail++;} }

async function boot(){
  const dom = new JSDOM(fs.readFileSync(HTML,'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://example.test/fg.html?host=threadspire',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>null; w.fetch=()=>Promise.reject(new Error('offline')); w.console.error=()=>{}; w.confirm=()=>true; w.alert=()=>{}; } });
  await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));
  await new Promise(r=>setTimeout(r,300));
  return dom.window;
}

(async () => {
  const w = await boot();
  const js = (s)=>w.eval(s);

  console.log('\nidentity card: motivation dropdown, order, kick vs leave, no LM Mode');

  check('the LM Mode button is removed', js('!document.getElementById("godBtn")'), 'still present');

  js('C.created=true; C.identity.motivation=""; renderMotivation();');
  check('with no motivation, the dropdown shows', js('document.getElementById("f-motivation-wrap").style.display') !== 'none', 'display=' + js('document.getElementById("f-motivation-wrap").style.display'));
  js('C.identity.motivation=(MOTIVATIONS&&MOTIVATIONS[0])||"The Witty"; renderMotivation();');
  check('once a motivation is chosen, the dropdown hides', js('document.getElementById("f-motivation-wrap").style.display') === 'none', 'display=' + js('document.getElementById("f-motivation-wrap").style.display'));

  const order = js('(function(){var ids=["f-motivation-wrap","motivationCard","f-advname","f-desc"]; var all=[...document.querySelectorAll("*")]; return ids.map(function(id){var e=document.getElementById(id); return e?all.indexOf(e):-1;}).join(",");})()');
  const p = order.split(',').map(Number);
  check('order is motivation, then card, then adventure, then description', p[0]<p[1] && p[1]<p[2] && p[2]<p[3], 'positions=' + order);

  js('CUR_WIX_ID="chr-1"; C.identity.campaign="Stone and Sovereign"; C.identity.campaignId="sdd6wqrh";');
  js('god=false; renderCampaignOptions();');
  check('player side shows "Leave adventure"', /Leave adventure/.test(js('document.getElementById("f-advact").innerHTML')), js('document.getElementById("f-advact").innerHTML').slice(0,80));
  js('god=true; renderCampaignOptions();');
  check('LM side shows "Kick Player"', /Kick Player/.test(js('document.getElementById("f-advact").innerHTML')), js('document.getElementById("f-advact").innerHTML').slice(0,80));

  console.log('\n' + (fail ? 'FAILED ' + fail : 'all ' + pass + ' passed'));
  process.exit(fail ? 1 : 0);
})();
