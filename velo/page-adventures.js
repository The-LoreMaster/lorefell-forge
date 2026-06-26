// The Adventure Directory page code.
// Paste into the Wix page that holds the directory embed and set EMBED to its element ID.
// Lists every published adventure and, on import, sends the player to the FateWell page
// with ?import=<id>. The FateWell page bridge fetches the pack and hands it to the tool,
// which imports a fresh, fully owned copy. The original published row is never touched.

import { listPublishedAdventures } from 'backend/published.web.js';
import wixLocation from 'wix-location';

// The element ID of the directory HTML embed on this page.
const EMBED = '#html1';

// The page slug that hosts the FateWell (loremaster) embed. Change this to match your
// site if the FateWell page lives at a different path.
const FATEWELL_PATH = '/fatewell';

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object' || !msg.type) return;

    if (msg.type === 'adv-ready') {
      let items = [];
      try { items = await listPublishedAdventures(); } catch (e) { items = []; }
      embed.postMessage({ type: 'adv-list', items: items });
    } else if (msg.type === 'adv-import') {
      const id = msg.id || '';
      if (id) wixLocation.to(FATEWELL_PATH + '?import=' + encodeURIComponent(id));
    } else if (msg.type === 'adv-height') {
      // The embed reports its content height. Resize the iframe when the element allows it.
      try { if (embed.style && typeof msg.height === 'number') embed.style.height = msg.height + 'px'; } catch (e) {}
    }
  });
});
