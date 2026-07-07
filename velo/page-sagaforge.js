// Page code for the SagaForge page. Identical AI path to SigilForge, which works.
// Paste into the SagaForge page in Wix. Set the embed element ID to match EMBED.
import wixWindow from 'wix-window-frontend';
import { aiForge, getForgeLibrary } from 'backend/forge.web.js';

const EMBED = '#html1';

$w.onReady(function () {
  const embed = $w(EMBED);
  if (!embed || !embed.onMessage) return;

  embed.onMessage(async (event) => {
    const msg = event && event.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'SAGA_HEIGHT') {
      return;
    }

    if (msg.type === 'SAGA_SCROLLTOP') {
      try { $w(EMBED).scrollTo(); } catch (e) {}
      try { if (wixWindow && wixWindow.scrollTo) wixWindow.scrollTo(0, 0); } catch (e) {}
      return;
    }

    // SagaForge asks for the canon Act pool so forged foes can carry real Acts.
    if (msg.type === 'SAGA_CANON_ACTS_REQUEST') {
      let acts = [];
      try { acts = await getForgeLibrary(); } catch (e) { acts = []; }
      embed.postMessage({ type: 'SAGA_CANON_ACTS', acts: acts });
      return;
    }

    if (msg.type === 'LOREFELL_AI_FORGE') {
      const reqId = msg.reqId;
      try {
        const r = await aiForge(msg.payload || {});
        embed.postMessage({ type: 'LOREFELL_AI_FORGE_RESULT', reqId: reqId, ok: !!(r && r.ok), text: (r && r.text) || '', status: (r && r.status) || 0, error: (r && r.error) || '' });
      } catch (e) {
        embed.postMessage({ type: 'LOREFELL_AI_FORGE_RESULT', reqId: reqId, ok: false, error: 'relay[bridge-v3-webmethod-only]: ' + ((e && (e.message || e.toString())) || 'unreachable') });
      }
      return;
    }
  });
});
