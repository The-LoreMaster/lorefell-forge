/* SigilForge's dropdowns were dead on Android: every native select tap landed and nothing
 * opened, while buttons and text fields beside them worked. The cause was a transform in
 * the page's entry animation. The selects all live inside <main class="page">, and on
 * Android Chrome a transform on the element that holds a native <select> leaves a
 * compositing context that stops the select's popup from opening. FateWell, which works,
 * never animates the container its selects sit in.
 *
 * jsdom cannot reproduce a native select popup or an Android quirk, so this guards the
 * specific cause instead: the page entry animation must stay transform-free, and the
 * selects must remain inside the animated page container (so the coupling is real and
 * this test is guarding the right thing).
 *
 *   node threadspire/tests/sigil-select.test.js
 */
const fs = require('fs');
const path = require('path');

const HTML = path.join(__dirname, '..', '..', 'docs', 'sigilforge.html');
const src = fs.readFileSync(HTML, 'utf8');

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok === true) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name + '\n          ' + detail); fail++; }
}

console.log('\nthe page entry animation must not displace native select popups');

// pull the pageIn keyframes block
const kf = src.match(/@keyframes\s+pageIn\s*\{([^}]*)\}/);
check('the pageIn keyframes exist', !!kf, 'pageIn keyframes not found');
if (kf) {
  check('pageIn does not use transform (breaks Android select popups)', !/transform/i.test(kf[1]), 'transform present in: ' + kf[1].trim());
}

// the selects live inside the animated page, so the coupling this guards is real
check('the forge selects sit inside <main class="page">', /<main class="page[^"]*"[^>]*id="page0"/.test(src) && /id="damageSel"/.test(src), 'page/select structure changed');

// the animation is still applied (we kept the fade, only dropped the transform)
check('the page still fades in', /\.page\.on\{[^}]*animation:pageIn/.test(src), 'pageIn animation was removed entirely');

console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'all ' + pass + ' checks passed'));
process.exit(fail ? 1 : 0);
