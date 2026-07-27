/* Step 0 of the player-facing combat work: three rules corrections, with the FellGuide
 * as the oracle. Each assertion below names the canon it answers to.
 *
 *   F2  A standard attack resolves on Precision against Evasion whether the weapon is
 *       physical or magic; Magic only sets Base Damage (CANON.md "Attack Resolution",
 *       The Combat.md:118). FateWell's foe card used to print "1d6 + Magic" for a magic
 *       build while cbRollFoeAcc rolled Precision, so the tool told the loremaster to
 *       roll one thing and rolled another.
 *
 *   F4  Higher result hits and a tie goes to the attacker (The Combat.md:108, plus the
 *       designer ruling). Both tools already compare with >=, so this is a regression
 *       pin on behaviour that is correct today, not a change.
 *
 *   F5  Movement is a React, spends the whole React, and is never part of an Act
 *       (CANON.md:101). FellGlass's React list said the opposite.
 *
 *   node threadspire/tests/combat-rules.test.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const FATEWELL = path.join(__dirname, '..', '..', 'docs', 'fatewell.html');
const FELLGLASS = path.join(__dirname, '..', '..', 'docs', 'fellglass.html');

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok === true) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name + '\n          ' + detail); fail++; }
}

async function boot(file) {
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://example.test/tool.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.fetch = () => Promise.reject(new Error('offline'));
      w.console.error = () => {};
      w.alert = () => {};
    }
  });
  await new Promise((r) => dom.window.addEventListener('load', r, { once: true }));
  await new Promise((r) => setTimeout(r, 300));
  return dom.window;
}

(async () => {
  /* ---------------------------------------------------------------- F2 ---- */
  const fw = await boot(FATEWELL);

  console.log('\nF2 a standard attack reads out Precision, whatever the weapon');

  const magicFoe = { sr: 'Elite', attrs: { Magic: 5, Precision: 2, Power: 1, Durability: 0, Resistance: 0, Evasion: 0, Vigor: 0, Wit: 0 } };
  const physFoe  = { sr: 'Elite', attrs: { Magic: 0, Precision: 4, Power: 5, Durability: 0, Resistance: 0, Evasion: 0, Vigor: 0, Wit: 0 } };
  const magicAcc = fw.fwFoeDamage(magicFoe, magicFoe.attrs).acc;
  const physAcc  = fw.fwFoeDamage(physFoe, physFoe.attrs).acc;

  check('a magic build reads out Precision, not Magic',
    /Precision/.test(magicAcc) && !/Magic/.test(magicAcc), 'acc=' + magicAcc);
  check('a magic build reads out its Precision value, not its Magic value',
    magicAcc.indexOf(String(magicFoe.attrs.Precision)) >= 0, 'acc=' + magicAcc);
  check('a physical build is unchanged',
    /Precision/.test(physAcc) && physAcc.indexOf('4') >= 0, 'acc=' + physAcc);
  check('Magic still sets Base Damage on a magic build (1 + Magic)',
    fw.fwFoeDamage(magicFoe, magicFoe.attrs).base === 1 + magicFoe.attrs.Magic,
    'base=' + fw.fwFoeDamage(magicFoe, magicFoe.attrs).base);

  /* Three tools print a standard attack's roll to land, and the first pass at this fix
   * caught only FateWell's. ThreadSpire carries a twin of fwFoeDamage and FoeForge
   * prints the same line for a forged foe, so the rule is checked across docs/ rather
   * than in the one file it was first noticed in. */
  console.log('\nF2 no tool prints Magic as the roll to land');

  const DOCS = path.join(__dirname, '..', '..', 'docs');
  const offenders = fs.readdirSync(DOCS)
    .filter((f) => f.endsWith('.html'))
    .filter((f) => /1d6 \+ Magic/.test(fs.readFileSync(path.join(DOCS, f), 'utf8')));
  check('no tool in docs/ builds a "1d6 + Magic" accuracy line',
    offenders.length === 0, 'offenders=' + JSON.stringify(offenders));

  /* The damage side must NOT have moved: Base Damage on a magic build is 1 + Magic and
   * always was. A fix that flattened the roll and the damage together would pass the
   * check above and still be wrong.
   *
   * FoeForge cannot be booted to ask it directly. Standalone, its built-in pack holds
   * afflictions as plain strings while the page sorts them by .name, so `const state`
   * throws on load and every function below it is unreachable. That is a real bug and
   * an old one, but it is not this one's to fix, so the block that builds the standard
   * attack line is lifted out of the source and RUN instead. It reads nothing but b and
   * s, so it runs honestly with those two supplied: real code, real output, and no
   * dependence on how the source happens to be spaced. */
  const foeforge = fs.readFileSync(path.join(DOCS, 'foeforge.html'), 'utf8');
  const block = foeforge.match(/const castsSpells=[\s\S]*?const std=[^\n]*;/);
  check('FoeForge still builds a standard attack line', !!block,
    'the block that builds it was not found; the shape of renderScaled changed');

  if (block) {
    const stdLine = new Function('b', 's', block[0] + ' return { std:std, accLabel:accLabel, dmgLabel:dmgLabel };');
    const caster = stdLine({ accuracy: ['spell'] }, { attrs: { Magic: 5, Precision: 2, Power: 1 } });
    const fighter = stdLine({ accuracy: ['weapon'] }, { attrs: { Magic: 0, Precision: 4, Power: 6 } });

    check('a caster rolls Precision to land, not Magic',
      caster.accLabel === 'Precision' && /1d6 \+ 2 Precision to land/.test(caster.std), JSON.stringify(caster));
    check('a fighter rolls Precision to land',
      fighter.accLabel === 'Precision' && /1d6 \+ 4 Precision to land/.test(fighter.std), JSON.stringify(fighter));
    check('a caster still takes its Base Damage from Magic',
      caster.dmgLabel === 'Magic' && /Base Damage 6 \(1 \+ Magic\)/.test(caster.std), JSON.stringify(caster));
    check('a fighter still takes its Base Damage from Power',
      fighter.dmgLabel === 'Power' && /Base Damage 7 \(1 \+ Power\)/.test(fighter.std), JSON.stringify(fighter));
  }

  /* ---------------------------------------------------------------- F4 ---- */
  console.log('\nF4 a tie goes to the attacker');

  /* cbFoeResolve is the damage side, so the tie rule is asserted where it is actually
   * decided: every hit test on the board compares accuracy against evasion with >=.
   * Read them out of the source rather than staging a whole scene, so the pin catches a
   * future edit that quietly turns one of them into a bare >. */
  const src = fs.readFileSync(FATEWELL, 'utf8');
  const hitTests = src.match(/(?:st\.acc|_acc|acc)\s*>=?\s*(?:ev\.total|_eva|eva)\b/g) || [];
  check('every accuracy-versus-evasion test on the board exists', hitTests.length >= 4,
    'found ' + hitTests.length + ': ' + JSON.stringify(hitTests));
  check('none of them dropped the tie by comparing with a bare >',
    hitTests.every((t) => t.indexOf('>=') >= 0),
    'offenders=' + JSON.stringify(hitTests.filter((t) => t.indexOf('>=') < 0)));

  /* ---------------------------------------------------------------- F5 ---- */
  const fg = await boot(FELLGLASS);

  console.log('\nF5 movement is a React and never part of an Act');

  fg.renderBattle();
  const reactsHtml = (fg.document.getElementById('reactsList') || { innerHTML: '' }).innerHTML;

  check('the React list says movement spends the whole React',
    /spends your entire React/.test(reactsHtml), 'reactsList=' + reactsHtml.slice(0, 400));
  check('the React list says movement is never part of an Act',
    /never part of an Act/.test(reactsHtml), 'reactsList=' + reactsHtml.slice(0, 400));
  check('the old wording is gone from the whole document',
    !/Movement occurs as part of an Act/.test(fs.readFileSync(FELLGLASS, 'utf8')),
    'the withdrawn sentence is still in docs/fellglass.html');
  check('Move is still offered as a React',
    (fg.COMBAT_REACTS || []).some((r) => r && r.nm === 'Move'),
    'COMBAT_REACTS=' + JSON.stringify(fg.COMBAT_REACTS || []));

  console.log('\n' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(fail ? 1 : 0);
})();
