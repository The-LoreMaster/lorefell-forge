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
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '', done = null, error = '';
    for (;;) {
      const r = await reader.read();
      if (r.done) break;
      buf += dec.decode(r.value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let o;
        try { o = JSON.parse(line); } catch (e) { continue; }
        if (o.t) { text += o.t; embed.postMessage({ type: 'SF_CHUNK', reqId: msg.reqId, t: o.t }); }
        else if (o.done) done = o;
        else if (o.error) error = o.error;
      }
    }
    if (error) reply(msg.reqId, false, { text }, error);
    else if (!done) reply(msg.reqId, false, { text }, 'The writing stopped before it finished. Try again.');
    else if (done.stop === 'max_tokens') reply(msg.reqId, false, { text }, 'That ran too long and was cut off. Try again, or split it with a note.');
    else reply(msg.reqId, true, { text, usage: done.usage }, '');
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
