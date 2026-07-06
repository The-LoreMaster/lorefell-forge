// Page code for the SagaForge page. Relays the AI call to the shared backend
// and sizes the embed to its content. Paste into the SagaForge page in Wix.
import { aiForge } from 'backend/forge.web.js';

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
      // Bring the page back to the embed's top when the flow advances.
      try { $w(EMBED).scrollTo(); } catch (e) {}
      return;
    }

    if (msg.type === 'LOREFELL_AI_FORGE') {
      const reqId = msg.reqId;
      try {
        const r = await aiForge(msg.payload || {});
        embed.postMessage({ type: 'LOREFELL_AI_FORGE_RESULT', reqId: reqId, ok: !!(r && r.ok), text: (r && r.text) || '', status: (r && r.status) || 0, error: (r && r.error) || '' });
      } catch (e) {
        embed.postMessage({ type: 'LOREFELL_AI_FORGE_RESULT', reqId: reqId, ok: false, error: 'relay unreachable' });
      }
      return;
    }
  });
});
