// The Anexanum page code (a hidden, members-only page: /the-anexanum).
// Nate's lore desk. The embed asks for a ticket naming the signed-in member; the table room
// lets in only the member who owns the connected YouTube channel. Set EMBED to the page's
// HTML embed element ID.

import { authentication, currentMember } from 'wix-members-frontend';
import { anexanumTicket } from 'backend/tableroom.web.js';

const EMBED = '#html1';

$w.onReady(async () => {
  const embed = $w(EMBED);
  const reply = (id, ok, data) => { try { embed.postMessage({ type: 'AX_REPLY', id, ok, data }); } catch (e) {} };
  embed.onMessage(async (event) => {
    const m = event && event.data;
    if (!m || !m.type) return;
    if (m.type === 'AX_TICKET') {
      let me = null; try { me = await currentMember.getMember(); } catch (e) { me = null; }
      if (!me) { try { await authentication.promptLogin({ mode: 'login' }); } catch (e) {} }
      let r = null; try { r = await anexanumTicket(); } catch (e) { r = { ok: false, error: String(e).slice(0, 80) }; }
      reply(m.id, !!(r && r.ok), r);
    }
  });
});
