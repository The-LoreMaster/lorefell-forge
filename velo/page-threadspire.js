// Page code for the ThreadSpire page in Wix.
// Paste into the ThreadSpire page. Set the embed element ID to match EMBED.
// The standalone tool works without this; the bridge only adds per-campaign
// discovery, lifting LM-revealed nodes out of fog for a player's campaign.
import { listDiscovered } from 'backend/fatewell.web.js';

const EMBED = '#html1';

$w.onReady(function () {
  const embed = $w(EMBED);
  if (!embed || !embed.onMessage) return;

  embed.onMessage(async (event) => {
    const msg = event && event.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'THREADSPIRE_READY') {
      const cid = msg.campaignId || '';
      if (!cid) return;
      let nodes = [];
      try {
        const r = await listDiscovered(cid);
        nodes = (r && r.nodes) || [];
      } catch (e) { nodes = []; }
      embed.postMessage({ type: 'threadspire-discovered', nodes: nodes });
    }
  });
});
