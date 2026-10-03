// The Hearth page code.
// The Hearth is the hub of every tool. Tiles fire HEARTH_NAV with a site route;
// this bridge catches it and navigates the parent page. Set EMBED to your
// Embed a Site element ID.

import wixLocation from 'wix-location';
import { myNextSessions } from 'backend/sessions.web.js';

const EMBED = '#html1';

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const m = event && event.data;
    if (!m || !m.type) return;

    // the Hearth asks for the next session of each adventure this member is in
    if (m.type === 'HEARTH_READY') {
      let list = [];
      try { list = await myNextSessions(); } catch (e) { list = []; }
      embed.postMessage({ type: 'HEARTH_SESSIONS', list: list || [] });
      return;
    }
    if (m.type === 'HEARTH_NAV') {
      if (m.route && typeof m.route === 'string' && m.route.charAt(0) === '/') {
        wixLocation.to(m.route);
      }
      return;
    }
  });
});
