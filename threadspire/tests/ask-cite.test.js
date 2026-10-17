/* Ask's citations: a beat, a History page and a rulebook page each become a link, and a cite
 * that leads nowhere real is dropped. A rulebook page links only when the site sent it with the
 * question (TS_ASK_SOURCES), so a page the answer made up never shows.
 *
 * askAnswerHtml is read out of docs/threadspire.html and run with stand-ins for the helpers it
 * calls, so the test checks the shipped function, not a copy.
 *
 *   node threadspire/tests/ask-cite.test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML = fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'threadspire.html'), 'utf8');
const start = HTML.indexOf('function askAnswerHtml(');
const end = HTML.indexOf('\nfunction askPaint(', start);
if (start < 0 || end < 0) { console.log('  FAIL  askAnswerHtml not found in docs/threadspire.html'); process.exit(1); }

const ctx = {
  esc: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
  beatBodyHtml: (s) => String(s),
  askFindBeat: (id) => id === 'b1' ? { scene: { name: 'The Gate' }, beat: { title: 'The Sovereign speaks' } } : null,
};
vm.createContext(ctx);
vm.runInContext(HTML.slice(start, end), ctx);
const html = (t, sources, streaming) => ctx.askAnswerHtml(t, streaming, sources);

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name + '\n          ' + detail); fail++; }
}

const SENT = [{ b: 'FellGuide', t: 'Survival', u: '/fellguide/survival/' }, { b: 'LoreVault', t: 'Calling a Rest', u: '/lorevault/calling-a-rest/' }];
let out = html('A rest that is interrupted gives nothing. {{r:/fellguide/survival/}} {{r:/lorevault/calling-a-rest/}}', SENT);
check('a rulebook page that was sent links to the site, named by its title',
  out.includes('href="https://www.lorefell.com/fellguide/survival/"') && out.includes('>Survival</a>')
  && out.includes('href="https://www.lorefell.com/lorevault/calling-a-rest/"') && out.includes('title="LoreVault: Calling a Rest"'), out);

out = html('Made up. {{r:/fellguide/made-up/}}', SENT);
check('a rulebook page that was not sent is dropped', !out.includes('<a') && !out.includes('{{'), out);

out = html('Before the sources arrive. {{r:/fellguide/survival/}}', undefined);
check('with no sources yet, a rulebook cite shows nothing', !out.includes('<a'), out);

out = html('Odd. {{r:javascript:alert(1)}}', [{ b: 'FellGuide', t: 'X', u: 'javascript:alert(1)' }]);
check('an address outside the two books never links, even if sent', !out.includes('<a'), out);

out = html('The Sovereign. {{b:b1}} Missing. {{b:nope}} A History. {{h:/lore/histories/chimes-of-banding/}}', SENT);
check('beats and Histories still link as before, and a missing beat is dropped',
  out.includes('>The Sovereign speaks</a>') && out.includes('href="https://www.lorefell.com/lore/histories/chimes-of-banding/"') && (out.match(/<a /g) || []).length === 2, out);

out = html('Streaming {{r:/fellguide/surv', SENT, true);
check('a cite cut off mid-stream is hidden until it is whole', out === 'Streaming ', out);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
