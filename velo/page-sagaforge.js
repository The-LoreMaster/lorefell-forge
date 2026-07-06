// Page code for the SagaForge page. Relays the AI call to the shared backend
// and sizes the embed to its content. Paste into the SagaForge page in Wix.
import wixWindow from 'wix-window-frontend';
import { aiForge } from 'backend/forge.web.js';

// The page runs on the live site, so it can call the long-timeout http-function
// same origin. If that ever fails it falls back to the web method.
const AI_URL = '/_functions/aiforge';

const EMBED = '#html1';

$w.onReady(function () {
  const embed = $w(EMBED);
  if (!embed || !embed.onMessage) return;

  embed.onMessage(async (event) => {
    const msg = event && event.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'SAGA_HEIGHT') {
      // Wix manages iframe height from the editor; nothing to do unless pinned.
      return;
    }

    if (msg.type === 'SAGA_SCROLLTOP') {
      // Bring the page back to the embed when the flow advances. scrollTo on the
      // element moves the Wix page to it; the window scroll is a fallback.
      try { $w(EMBED).scrollTo(); } catch (e) {}
      try { if (wixWindow && wixWindow.scrollTo) wixWindow.scrollTo(0, 0); } catch (e) {}
      return;
    }

    if (msg.type === 'LOREFELL_AI_FORGE') {
      const reqId = msg.reqId;
      let httpErr = '';
      try {
        // primary: the http-function, which carries the long timeout
        const res = await fetch(AI_URL, {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg.payload || {})
        });
        if (!res.ok) { httpErr = 'http-fn status ' + res.status; }
        else {
          const r = await res.json();
          embed.postMessage({ type: 'LOREFELL_AI_FORGE_RESULT', reqId: reqId, ok: !!(r && r.ok), text: (r && r.text) || '', status: (r && r.status) || 0, error: (r && r.error) || '' });
          return;
        }
      } catch (e1) {
        httpErr = (e1 && (e1.message || e1.toString())) || 'fetch threw';
      }
      // fallback: the web method
      try {
        const r = await aiForge(msg.payload || {});
        embed.postMessage({ type: 'LOREFELL_AI_FORGE_RESULT', reqId: reqId, ok: !!(r && r.ok), text: (r && r.text) || '', status: (r && r.status) || 0, error: (r && r.error) || '' });
      } catch (e2) {
        const detail = (e2 && (e2.message || e2.toString())) || 'unknown';
        embed.postMessage({ type: 'LOREFELL_AI_FORGE_RESULT', reqId: reqId, ok: false, error: 'relay: ' + detail + ' | http-fn: ' + httpErr });
      }
      return;
    }
  });
});
