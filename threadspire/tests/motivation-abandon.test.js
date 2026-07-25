/* A vow holds once chosen, until its Title is earned. A player who wants out before
 * then can abandon it: the +1 the choosing granted is handed back, and the slot opens
 * for a new pursuit. The reward path is untouched, so the two rules that keep this
 * honest are that abandoning cannot farm the attribute, and cannot drive it negative.
 *
 *   node threadspire/tests/motivation-abandon.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = path.join(__dirname, '..', '..', 'docs', 'fellglass.html');

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok === true) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name + '\n          ' + detail); fail++; }
}

async function boot() {
  const dom = new JSDOM(fs.readFileSync(HTML, 'utf8'), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://example.test/fellglass.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.fetch = () => Promise.reject(new Error('offline'));
      w.console.error = () => {};
    }
  });
  await new Promise((r) => dom.window.addEventListener('load', r, { once: true }));
  await new Promise((r) => setTimeout(r, 300));
  return dom.window;
}

(async () => {
  const w = await boot();
  const js = (s) => w.eval(s);
  const buttons = () => js('[...document.querySelectorAll("#motivationCard button")].map(b=>b.textContent).join("|")');
  const disabled = () => js('document.getElementById("f-motivation").disabled');
  const pick = (name) => js('var s=document.getElementById("f-motivation"); s.value=' + JSON.stringify(name) + '; s.dispatchEvent(new window.Event("change"));');

  console.log('\nchoosing a vow, then abandoning it');

  js('god=false; var rec=seedSheet({}); rec.created=true; rec.identity.motivation=""; loadCharacter(rec);');
  const witBefore = js('C.grants.attrs.wit||0');
  pick('The Witty');
  check('choosing from empty grants +1', js('(C.grants.attrs.wit||0)') === witBefore + 1, 'wit=' + js('C.grants.attrs.wit||0'));
  check('and locks the dropdown', disabled() === true, 'disabled=' + disabled());

  js('renderMotivation();');
  check('an incomplete vow offers to be abandoned', /Abandon this vow/.test(buttons()), 'buttons: ' + buttons());

  js('abandonMotivation();');
  check('abandoning hands back the +1', js('C.grants.attrs.wit||0') === witBefore, 'wit=' + js('C.grants.attrs.wit||0'));
  check('abandoning clears the vow', js('C.identity.motivation') === '', 'motivation=' + JSON.stringify(js('C.identity.motivation')));
  check('abandoning opens the slot again', disabled() === false, 'disabled=' + disabled());

  console.log('\nthe two rules that keep it honest');

  js('for(var i=0;i<5;i++){ var s=document.getElementById("f-motivation"); s.value="The Witty"; s.dispatchEvent(new window.Event("change")); abandonMotivation(); }');
  check('picking and dropping in a loop cannot farm the attribute', js('C.grants.attrs.wit||0') === witBefore, 'wit=' + js('C.grants.attrs.wit||0'));

  js('C.identity.motivation="The Precise"; C.grants.attrs.precision=0; abandonMotivation();');
  check('abandoning a vow whose grant is already gone cannot go negative', (js('C.grants.attrs.precision||0')) >= 0, 'precision=' + js('C.grants.attrs.precision||0'));

  console.log('\nwhat stays untouched');

  js('C.identity.motivation="The Witty"; motSkills(motByName("The Witty")).forEach(function(n){C.skills[n].mastery=4;}); renderMotivation();');
  check('a completed vow offers the Title, never abandon', /Claim Title/.test(buttons()) && !/Abandon/.test(buttons()), 'buttons: ' + buttons());

  js('god=true; C.identity.motivation="The Precise"; renderMotivation();');
  check('the LoreMaster side does not show the player abandon button', !/Abandon this vow/.test(buttons()), 'buttons: ' + buttons());

  console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'all ' + pass + ' checks passed'));
  process.exit(fail ? 1 : 0);
})();
