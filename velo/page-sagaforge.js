// Page code for the SagaForge page. Relays the AI call to the shared backend
// and sizes the embed to its content. Paste into the SagaForge page in Wix.
import { aiForge } from 'backend/forge.web.js';
import wixWindow from 'wix-window-frontend';

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
      try {
        const r = await aiForge(msg.payload || {});
        embed.postMessage({ type: 'LOREFELL_AI_FORGE_RESULT', reqId: reqId, ok: !!(r && r.ok), text: (r && r.text) || '', status: (r && r.status) || 0, error: (r && r.error) || '' });
      } catch (e) {
        // surface the real failure so setup issues are diagnosable
        const detail = (e && (e.message || e.toString())) || 'unknown';
        embed.postMessage({ type: 'LOREFELL_AI_FORGE_RESULT', reqId: reqId, ok: false, error: 'relay: ' + detail });
      }
      return;
    }
  });
});
