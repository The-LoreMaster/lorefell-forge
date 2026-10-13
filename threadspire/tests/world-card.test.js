/* A world the Sphere does not hold is read on the sheet's Lore tab: a BrandForge world's
 * overview, then the rest of what its maker wrote behind one fold. A canon world keeps its
 * link to the Sphere and has no card. FellGlass and ThreadSpire share this sheet.
 *
 *   node threadspire/tests/world-card.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let pass = 0, fail = 0;
function check(n, ok, d){ if (ok === true){ console.log('  PASS  ' + n); pass++; } else { console.log('  FAIL  ' + n + '\n          ' + d); fail++; } }

(async () => {
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'fellglass.html'), 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true,
    url:'https://example.test/fg.html?host=threadspire',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => null; w.fetch = () => Promise.reject(new Error('offline')); w.console.error = () => {}; } });
  const w = dom.window;
  await new Promise((r) => w.addEventListener('load', r, { once:true }));
  await new Promise((r) => setTimeout(r, 300));
  const js = (s) => w.eval(s);
  const card = () => js(`document.getElementById('advWorld').innerHTML`);
  const link = () => js(`document.getElementById('tsSpireLink').innerHTML`);

  console.log('\nthe world card on the Lore tab');
  js(`C.identity.campaignId = 'adv-f'; C.identity.campaign = 'Cold Road'; C.identity.worldId = '';
      ADVS = [{ id:'adv-f', name:'Cold Road', worldId:'forged:w1', world:{ name:'Hrimfast', overview:'A winter <that> never breaks.', people:'Clans that endure.', magic:'Ice-vein healing.', architecture:'', faith:'The long dark.', life:'' } },
              { id:'adv-c', name:'Bells', worldId:'world:burhallow', world:null }];
      renderCampaignOptions();`);
  check('a forged world shows its name and overview', /Hrimfast/.test(card()) && /A winter &lt;that&gt; never breaks\./.test(card()), card());
  check('the rest sits behind one fold, empty parts left out',
    /<details>/.test(card()) && /The people/.test(card()) && /The magic here/.test(card()) && /Faith and belief/.test(card()) && !/Architecture/.test(card()) && !/Daily life/.test(card()), card());
  check('a forged world has no Sphere link', link() === '', link());
  js(`C.identity.campaignId = 'adv-c'; renderCampaignOptions();`);
  check('a canon world has its Sphere link and no card', /See this saga in the Sphere/.test(link()) && card() === '', card() + ' | ' + link());

  console.log('\n' + (fail ? 'FAILED ' + fail : 'all ' + pass + ' passed'));
  process.exit(fail ? 1 : 0);
})();
