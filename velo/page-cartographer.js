// Page code for The Cartographer page in Wix (dev-only route).
// Paste into the page. Set the embed element ID to match EMBED.
// Relays the tool's save and load calls to the SphereArt backend.
import { listSphereArt, saveSphereArt } from 'backend/sphereart.web.js';

const EMBED = '#html1';

$w.onReady(function () {
  const embed = $w(EMBED);
  if (!embed || !embed.onMessage) return;

  embed.onMessage(async (event) => {
    const m = event && event.data;
    if (!m || m.type !== 'CARTOGRAPHER_CALL') return;
    let ok = true, data = null, error = '';
    try {
      if (m.method === 'listSphereArt') data = await listSphereArt(m.arg || '');
      else if (m.method === 'saveSphereArt') data = await saveSphereArt(m.arg || {});
      else { ok = false; error = 'Unknown method'; }
      if (data && data.ok === false) { ok = false; error = data.error || 'failed'; }
    } catch (e) {
      ok = false; error = (e && (e.message || e.toString())) || 'error';
    }
    embed.postMessage({ type: 'CARTOGRAPHER_RESULT', reqId: m.reqId, ok: ok, data: data, error: error });
  });
});
