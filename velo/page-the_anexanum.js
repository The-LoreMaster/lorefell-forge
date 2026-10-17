// The Anexanum page code (a hidden, members-only page: /the-anexanum).
// Nate's lore desk. The embed asks for a ticket naming the signed-in member; the table room
// lets in only the member who owns the connected YouTube channel. Set EMBED to the page's
// HTML embed element ID.
//
// A History can be tied to one of the LoreMaster's adventures. AX_ADVENTURES lists them, and
// AX_ADVENTURE reads one back as a compact record of what the table built and played: the
// Story's outline (acts, sessions, scenes, beat titles and speakers, never whole beat text),
// the adventure's people and foes, the Codex and what each Fell wrote down, the Journal, the
// quest board, the recaps, and the Fell at the table. The Anexanum checks names and events
// against it. Every read is the LoreMaster's own, through the same backend ThreadSpire uses.

import { authentication, currentMember } from 'wix-members-frontend';
import { anexanumTicket } from 'backend/tableroom.web.js';
import { listMyCampaigns, getCampaignPlayers, listQuests, listAssets } from 'backend/fatewell.web.js';
import { loadAdventure } from 'backend/adventures.web.js';
import { getJournal } from 'backend/campaignview.web.js';
import { getCodex, getSession } from 'backend/sessions.web.js';
import { lmLoadCharacter } from 'backend/characters.web.js';

const EMBED = '#html1';

const cut = (t, n) => { const s = String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); return s.slice(0, n); };
const safe = async (p, fb) => { try { const r = await p; return r == null ? fb : r; } catch (e) { return fb; } };

async function adventureRecord(id) {
  const [adv, codex, journal, quests, ses, players, assets] = await Promise.all([
    safe(loadAdventure(id), null), safe(getCodex(id), {}), safe(getJournal(id), []), safe(listQuests(id), []),
    safe(getSession(id), {}), safe(getCampaignPlayers(id, ''), []), safe(listAssets(), [])
  ]);
  if (!adv) return { ok: false, error: 'That adventure could not be read. Only its LoreMaster can tie it.' };
  const beats = (sc) => (sc && (sc.beats && sc.beats.length ? sc.beats : sc.entries)) || [];
  const story = (adv.acts || []).map((a) => ({
    name: cut(a.name, 120), desc: cut(a.desc, 300),
    sessions: (a.sessions || []).map((se) => ({
      name: cut(se.name, 120),
      scenes: (se.scenes || []).map((sc) => ({
        name: cut(sc.name, 120), desc: cut(sc.desc || sc.prep, 300),
        beats: beats(sc).filter(Boolean).map((b) => ({ title: cut(b.title, 120), speaker: cut(b.speaker, 80) })).filter((b) => b.title || b.speaker).slice(0, 40)
      }))
    }))
  }));
  const people = (assets || []).filter((r) => r && r.campaignId && String(r.campaignId) === String(id) && (r.type === 'npc' || r.type === 'monster') && r.name)
    .map((r) => ({ name: cut(r.name, 80), type: r.type, desc: cut(r.description || r.desc, 160) })).slice(0, 120);
  const fell = [];
  for (const p of (players || []).filter((x) => x && x.charId && x.role !== 'loremaster').slice(0, 10)) {
    const c = await safe(lmLoadCharacter(p.charId), null);
    const ch = (c && c.character) || {}, idn = ch.identity || {};
    fell.push({ name: cut(p.name || idn.name || ch.name, 80), lineage: cut(idn.lineage, 60), level: p.level || 1, player: cut(p.memberName, 60) });
  }
  return {
    ok: true, id: id, name: cut(adv.name, 120), story: story, people: people, fell: fell,
    codex: ((codex && codex.entries) || []).map((e) => ({ session: cut(e.session, 120), text: cut(e.text, 1500) })).slice(-40),
    records: ((codex && codex.records) || []).map((r) => ({ fell: cut(r.fell, 80), characters: (r.characters || []).map((x) => cut(x, 200)).slice(0, 20), quests: (r.quests || []).map((x) => cut(x, 200)).slice(0, 20), clues: (r.clues || []).map((x) => cut(x, 200)).slice(0, 20) })),
    journal: (Array.isArray(journal) ? journal : []).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0)).map((e) => ({ ts: e.ts || 0, text: cut(e.text, 400) })).filter((e) => e.text).slice(-80),
    quests: (Array.isArray(quests) ? quests : []).map((q) => ({ title: cut(q.title, 120), status: q.status || 'open', body: cut(q.body, 300) })).slice(0, 60),
    recaps: ((ses && ses.recaps) || []).map((r) => ({ title: cut(r.title, 120), text: cut(r.text, 1500) })).slice(-30)
  };
}

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
    } else if (m.type === 'AX_ADVENTURES') {
      const list = await safe(listMyCampaigns(), []);
      reply(m.id, true, { items: (list || []).map((c) => ({ id: c.id, name: c.name || 'Adventure' })) });
    } else if (m.type === 'AX_ADVENTURE') {
      let r = null; try { r = await adventureRecord(String(m.adv || '')); } catch (e) { r = { ok: false, error: String(e).slice(0, 80) }; }
      reply(m.id, !!(r && r.ok), r);
    }
  });
});
