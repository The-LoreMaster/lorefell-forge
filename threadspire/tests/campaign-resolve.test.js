/* Two guards against opening the wrong adventure, or opening one to an empty table.
 *
 * The campaign resolver recovers a stale link (from a deleted-and-reimported adventure)
 * but must never swap a good link to one adventure for a different one. It only swaps for
 * a campaign it can positively confirm: the one the Fell is in, or the only one that
 * exists. Its decision table is checked here as a plain function, since it runs in Velo
 * and cannot boot under jsdom.
 *
 * The Seams window names the adventure and reports whether its story actually loaded, so
 * an empty table can be told apart from the wrong table at a glance.
 *
 *   node threadspire/tests/campaign-resolve.test.js
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

// A faithful copy of the resolver's decision table (velo/page-threadspire.js). Kept in
// step with it by hand; if the live logic changes, change this with it.
function makeResolve(mineIds, fellCampaign) {
  return async function (want, characterId) {
    const mine = mineIds.map((id) => ({ id }));
    if (!mine.length) return want;
    const has = (id) => id && mine.some((c) => String(c.id) === String(id));
    if (has(want)) return want;
    if (characterId && fellCampaign && has(fellCampaign)) return fellCampaign;
    if (mine.length === 1) return mine[0].id;
    return want;
  };
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

(async () => {
  console.log('\nthe resolver never opens the wrong adventure');

  check('a valid link is kept even with several adventures', await makeResolve(['SnS', 'Beacons'], null)('SnS', 'ch') === 'SnS');
  check('a stale link is NOT swapped to an arbitrary adventure', await makeResolve(['Beacons', 'Other'], null)('DEAD_SnS', 'ch') === 'DEAD_SnS');
  check('a stale link recovers when the Fell confirms the reimported one', await makeResolve(['SnS_new', 'Beacons'], 'SnS_new')('DEAD_SnS', 'ch') === 'SnS_new');
  check('a stale link with exactly one adventure opens it', await makeResolve(['only'], null)('DEAD', 'ch') === 'only');
  check('a player campaignId is left alone', await makeResolve([], null)('pCamp', 'pChar') === 'pCamp');

  const w = await boot();
  const js = (s) => w.eval(s);

  console.log('\nthe Seams window tells an empty table from the wrong one');

  js('S.role="lm"; S.campaignId="sns123456789"; S._advList=[{id:"sns123456789",name:"Stone and Sovereign"},{id:"bea",name:"Beacons of Sellenia"}];');
  js('S.adventure={name:"Stone and Sovereign",acts:[{name:"Act I",sessions:[{name:"S1",scenes:[{id:"x"},{id:"y"}]}]}]};');
  let seam = js('seamsBody()');
  check('the adventure line shows the name, not only the id', /Stone and Sovereign/.test(seam), 'name missing');
  check('the story line reports acts and scenes when present', /1 act, 2 scenes/.test(seam), 'story line wrong');

  js('S.adventure={name:"",acts:[]};');
  check('an adventure with no story says so plainly', /no story loaded/.test(js('seamsBody()')), 'empty-story note missing');

  js('S.campaignId="bea"; S.adventure={name:"Beacons of Sellenia",acts:[{name:"A",sessions:[]}]};');
  check('the wrong adventure shows its own name, so the mistake is visible', /Beacons of Sellenia/.test(js('seamsBody()')), 'name not shown');

  console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'all ' + pass + ' checks passed'));
  process.exit(fail ? 1 : 0);
})();
