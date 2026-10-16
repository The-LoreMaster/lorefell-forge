// The SagaForge page code. The tool (docs/sagaforge.html) asks for two things:
//   SF_CALL    a backend method from sagaforge.web.js: { reqId, method, args }, answered SF_RESULT
//   SF_STREAM  a stage of writing: { reqId, step, saga, opts }. The words come back as SF_CHUNK
//              while they are written, then SF_RESULT with the whole text.
// The writing goes to the site's stream endpoint (lorefell-site functions/api/saga/stream.js),
// which holds the key and checks the caller is an admin.
// Set EMBED to your Embed a Site element ID (Wix default is often #html1).

import { sfMeta, sfList, sfGet, sfSave, sfRemove, sfRules, sfSaveRules, sfCheck, sfPublish } from 'backend/sagaforge.web.js';

const EMBED = '#html1';
const METHODS = { sfMeta, sfList, sfGet, sfSave, sfRemove, sfRules, sfSaveRules, sfCheck, sfPublish };

// Read Claude's own event stream, which the site passes through untouched so its server spends
// next to no time on it. Text arrives in content_block_delta events, the stop reason and output
// count in message_delta, the end in message_stop, and a failure as an error event. Claude sends
// a ping while it thinks, so a stream silent for two minutes has dropped and is cancelled.
async function readClaude(res, onText) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  const out = { text: '', stop: '', done: false, error: '', usage: { in: 0, out: 0, cached: 0 } };
  let buf = '', last = Date.now();
  const dog = setInterval(() => { if (Date.now() - last > 120000) { try { reader.cancel(); } catch (e) { /* gone */ } } }, 5000);
  const take = (block) => {
    const data = block.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
    if (!data) return;
    let o; try { o = JSON.parse(data); } catch (e) { return; }
    if (o.type === 'content_block_delta' && o.delta && o.delta.type === 'text_delta') { out.text += o.delta.text; onText(o.delta.text); }
    else if (o.type === 'message_start' && o.message && o.message.usage) { out.usage.in = o.message.usage.input_tokens || 0; out.usage.cached = o.message.usage.cache_read_input_tokens || 0; }
    else if (o.type === 'message_delta') { if (o.delta && o.delta.stop_reason) out.stop = o.delta.stop_reason; if (o.usage) out.usage.out = o.usage.output_tokens || 0; }
    else if (o.type === 'message_stop') out.done = true;
    else if (o.type === 'error') out.error = (o.error && o.error.type === 'overloaded_error') ? 'busy' : String((o.error && o.error.message) || 'error');
  };
  try {
    for (;;) {
      const r = await reader.read();
      last = Date.now();
      if (r.done) break;
      buf += dec.decode(r.value, { stream: true }).replace(/\r\n/g, '\n');
      let cut;
      while ((cut = buf.indexOf('\n\n')) >= 0) { take(buf.slice(0, cut)); buf = buf.slice(cut + 2); }
    }
    if (buf.trim()) take(buf);
  } catch (e) { out.dropped = true; } finally { clearInterval(dog); }
  return out;
}

$w.onReady(() => {
  const embed = $w(EMBED);
  const reply = (reqId, ok, data, error) => embed.postMessage({ type: 'SF_RESULT', reqId, ok, data, error });

  async function stream(msg) {
    let text = '';
    let res;
    try {
      res = await fetch('/api/saga/stream', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: msg.step, saga: msg.saga, opts: msg.opts || {} }) });
    } catch (e) { reply(msg.reqId, false, null, 'The writer could not be reached. Check the connection and try again.'); return; }
    if (!res.ok || !res.body) {
      let err = 'The writer said no (' + res.status + ').';
      try { const j = await res.json(); if (j && j.error) err = j.error; } catch (e) { /* not JSON */ }
      reply(msg.reqId, false, null, err);
      return;
    }
    const r = await readClaude(res, (t) => embed.postMessage({ type: 'SF_CHUNK', reqId: msg.reqId, t }));
    if (r.error) reply(msg.reqId, false, { text: r.text }, r.error === 'busy' ? 'The writer is busy. Wait a minute and try again.' : 'The writer stopped: ' + r.error.slice(0, 200));
    else if (r.dropped) reply(msg.reqId, false, { text: r.text }, 'The connection to the writer dropped. Try again.');
    else if (r.stop === 'refusal') reply(msg.reqId, false, { text: r.text }, 'The writer declined this one. Try a note that words it differently.');
    else if (!r.done) reply(msg.reqId, false, { text: r.text }, 'The writing stopped before it finished. Try again.');
    else if (r.stop === 'max_tokens') reply(msg.reqId, false, { text: r.text }, 'That ran too long and was cut off. Try again, or split it with a note.');
    else reply(msg.reqId, true, { text: r.text, usage: r.usage }, '');
  }

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'SF_CALL') {
      const fn = METHODS[msg.method];
      if (!fn) { reply(msg.reqId, false, null, 'No such call: ' + msg.method); return; }
      try { reply(msg.reqId, true, await fn(...(msg.args || [])), ''); }
      catch (e) { reply(msg.reqId, false, null, (e && e.message) || String(e)); }
      return;
    }
    if (msg.type === 'SF_STREAM') { stream(msg); }
  });
});
