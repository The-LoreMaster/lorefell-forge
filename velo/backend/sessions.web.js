// backend/sessions.web.js
// What the tables and the Hearth ask about sessions: the next one, reminders on or off, and
// the recaps the LoreMaster writes and sends. Setting the next session and sending a recap
// are the adventure's LoreMaster's alone (not a lorekeeper's). The work is in sessionsCore.js.
import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';
import { myAdventureRole } from 'backend/fatewell.web.js';
import { RECAP_TEMPLATE_ID, REMINDER_TEMPLATE_ID, templatesSet, sessionRow, sessionSave, optOutOf, recapsOf, ownerOf, playersOf, whenText, tableLink, emailEach, emailImage, adventureImage, nextOccurrence, upcoming, skipsOf } from 'backend/sessionsCore.js';

async function memberId() {
  try { const m = await currentMember.getMember(); return m ? m._id : ''; } catch (e) { return ''; }
}
async function roleAt(campaignId) {
  try { return await myAdventureRole(campaignId); } catch (e) { return ''; }
}
async function isLoreMaster(campaignId) { return (await roleAt(campaignId)) === 'loremaster'; }

// The next session for anyone at the adventure; the LoreMaster also gets the recaps sent and
// who can receive one.
export const getSession = webMethod(Permissions.Anyone, async (campaignId) => {
  const mid = await memberId(); if (!mid || !campaignId) return { ok: false };
  const role = await roleAt(campaignId);
  const players = await playersOf(campaignId);
  const isPlayer = players.some((p) => p.memberId === mid);
  if (!role && !isPlayer) return { ok: false, error: 'not at this adventure' };
  let row = null; try { row = await sessionRow(campaignId); } catch (e) {}
  const nx = nextOccurrence(row);
  const out = { ok: true, nextAt: nx, note: (row && row.nextNote) || '', when: nx ? whenText(nx) : '',
    repeat: !!(row && row.repeatWeekly), firstAt: (row && row.nextAt) || 0, until: (row && row.repeatUntil) || 0, weeks: upcoming(row, 6),
    remindersOff: optOutOf(row).indexOf(mid) >= 0, emailReady: templatesSet() };
  if (role === 'loremaster') { out.recaps = recapsOf(row); out.players = players; }
  return out;
});

// The next session, once or every week (with an end if wanted). opts: { repeat, until }.
export const setNextSession = webMethod(Permissions.Anyone, async (campaignId, atMs, note, opts) => {
  if (!campaignId || !(await isLoreMaster(campaignId))) return { ok: false, error: 'only the LoreMaster' };
  const at = Number(atMs) || 0, o = opts || {};
  if (at && at < Date.now() - 3600 * 1000) return { ok: false, error: 'that time has passed' };
  const patch = { nextAt: at, nextNote: String(note || '').slice(0, 300), repeatWeekly: !!(at && o.repeat), repeatUntil: Number(o.until) || 0 };
  if (!at || !o.repeat) patch.skips = '[]';
  let row = null;
  try { row = await sessionSave(campaignId, patch); } catch (e) { return { ok: false, error: 'not saved' }; }
  const nx = nextOccurrence(row);
  return { ok: true, nextAt: nx, when: nx ? whenText(nx) : '', repeat: patch.repeatWeekly, firstAt: at, until: patch.repeatUntil, weeks: upcoming(row, 6) };
});
// Skip one week of a repeating session, or bring it back.
export const skipSessionWeek = webMethod(Permissions.Anyone, async (campaignId, weekMs, skip) => {
  if (!campaignId || !(await isLoreMaster(campaignId))) return { ok: false, error: 'only the LoreMaster' };
  let row = null; try { row = await sessionRow(campaignId); } catch (e) {}
  if (!row || !row.repeatWeekly) return { ok: false, error: 'not a weekly session' };
  const w = Number(weekMs) || 0; let list = skipsOf(row).filter((x) => x !== w && x > Date.now() - 86400000 * 8);
  if (skip) list.push(w);
  try { row = await sessionSave(campaignId, { skips: JSON.stringify(list) }); } catch (e) { return { ok: false, error: 'not saved' }; }
  const nx = nextOccurrence(row);
  return { ok: true, nextAt: nx, when: nx ? whenText(nx) : '', weeks: upcoming(row, 6) };
});

// A player's own choice; anyone at the adventure may set it for themselves only.
export const setRemindersOff = webMethod(Permissions.Anyone, async (campaignId, off) => {
  const mid = await memberId(); if (!mid || !campaignId) return { ok: false };
  let row = null; try { row = await sessionRow(campaignId); } catch (e) {}
  let list = optOutOf(row).filter((x) => x !== mid);
  if (off) list.push(mid);
  try { await sessionSave(campaignId, { optOut: JSON.stringify(list) }); } catch (e) { return { ok: false }; }
  return { ok: true, remindersOff: !!off };
});

// Send a recap the LoreMaster has read and edited. Only to players of this adventure,
// whatever the table asks for.
export const sendRecap = webMethod(Permissions.Anyone, async (campaignId, text, memberIds, title, image) => {
  if (!campaignId || !(await isLoreMaster(campaignId))) return { ok: false, error: 'only the LoreMaster' };
  if (!templatesSet()) return { ok: false, error: 'the recap email template is not set up yet' };
  const body = String(text || '').trim().slice(0, 8000);
  if (!body) return { ok: false, error: 'the recap is empty' };
  const players = await playersOf(campaignId);
  const want = (Array.isArray(memberIds) ? memberIds : []).map(String);
  const to = players.filter((p) => want.indexOf(p.memberId) >= 0).map((p) => p.memberId);
  if (!to.length) return { ok: false, error: 'nobody chosen' };
  const { name } = await ownerOf(campaignId);
  const r = await emailEach(RECAP_TEMPLATE_ID, to, { adventure: name || 'Your adventure', title: String(title || 'Session recap').slice(0, 120), recap: body, image: emailImage(image || await adventureImage(campaignId)), link: tableLink(campaignId) }, campaignId);
  let row = null; try { row = await sessionRow(campaignId); } catch (e) {}
  const recaps = recapsOf(row);
  recaps.unshift({ id: 'r' + Date.now(), at: Date.now(), title: String(title || 'Session recap').slice(0, 120), text: body, sent: r.sent, failed: r.failed.length });
  try { await sessionSave(campaignId, { recaps: JSON.stringify(recaps.slice(0, 40)) }); } catch (e) {}
  return { ok: r.sent > 0, sent: r.sent, failed: r.failed.length, error: r.sent ? '' : 'no email went out' };
});

// A test of either email, sent to the LoreMaster alone: the recap with what is in the recap
// window (or a sample), the reminder with the next session as set (or a sample time).
export const sendTestEmail = webMethod(Permissions.Anyone, async (campaignId, kind, text, title, image) => {
  if (!campaignId || !(await isLoreMaster(campaignId))) return { ok: false, error: 'only the LoreMaster' };
  if (!templatesSet()) return { ok: false, error: 'the email templates are not set up yet' };
  const mid = await memberId(); if (!mid) return { ok: false, error: 'sign in' };
  const { name } = await ownerOf(campaignId);
  let r;
  if (kind === 'reminder') {
    let row = null; try { row = await sessionRow(campaignId); } catch (e) {}
    const at = nextOccurrence(row) || (Date.now() + 86400000);
    r = await emailEach(REMINDER_TEMPLATE_ID, [mid], { adventure: name || 'Your adventure', when: whenText(at), note: (row && row.nextNote) || 'This is a test of the reminder email.', image: emailImage(image || await adventureImage(campaignId)), link: tableLink(campaignId) });
  } else {
    const body = String(text || '').trim().slice(0, 8000) || 'This is a test of the recap email. The story you write or draft in the recap window goes here, paragraph by paragraph, so you can see how it reads before your players do.';
    r = await emailEach(RECAP_TEMPLATE_ID, [mid], { adventure: name || 'Your adventure', title: String(title || 'Session recap').slice(0, 120), recap: body, image: emailImage(image || await adventureImage(campaignId)), link: tableLink(campaignId) });
  }
  return { ok: r.sent > 0, error: r.sent ? '' : 'the email did not go out' };
});

/* ---- the Codex: the story so far, as the LoreMaster shared it ----
   Each entry is a recap the players were meant to read (sent, or added from a session's
   video), with the names it mentions (checked against the Story when it was added), so the
   Codex never shows anything the recaps did not. Anyone at the adventure reads it; only the
   LoreMaster adds to it or takes from it. */
function codexOf(row) { try { const v = JSON.parse((row && row.codex) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
// a sent recap taken off the list (the email itself has gone, of course)
export const deleteRecap = webMethod(Permissions.Anyone, async (campaignId, id) => {
  if (!campaignId || !(await isLoreMaster(campaignId))) return { ok: false, error: 'only the LoreMaster' };
  let row = null; try { row = await sessionRow(campaignId); } catch (e) {}
  const list = recapsOf(row).filter((r) => r.id !== String(id));
  try { await sessionSave(campaignId, { recaps: JSON.stringify(list) }); } catch (e2) { return { ok: false }; }
  return { ok: true, recaps: list };
});
function itemsOf(row) { try { const v = JSON.parse((row && row.codexItems) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
async function atAdventure(campaignId, mid) {
  const role = await roleAt(campaignId); if (role) return role;
  const pl = await playersOf(campaignId); return pl.some((p) => p.memberId === mid) ? 'player' : '';
}
// A line anyone at the adventure adds to the Codex (a person, a place, a thing, a quest, a
// clue, or a note on the story), marked with who wrote it. They may take back their own;
// the LoreMaster may take back any.
export const addCodexItem = webMethod(Permissions.Anyone, async (campaignId, item) => {
  const mid = await memberId(); if (!mid || !campaignId) return { ok: false };
  const role = await atAdventure(campaignId, mid); if (!role) return { ok: false, error: 'not at this adventure' };
  const i = item || {}, kinds = ['story', 'person', 'place', 'thing', 'quests', 'clues'];
  const clean = { id: 'ci' + Date.now() + Math.floor(Math.random() * 1000), kind: kinds.indexOf(i.kind) >= 0 ? i.kind : 'story', name: String(i.name || '').slice(0, 80),
    text: String(i.text || '').slice(0, 2000), by: mid, byName: String(i.byName || '').slice(0, 60), at: Date.now() };
  if (!clean.text && !clean.name) return { ok: false, error: 'nothing to add' };
  let row = null; try { row = await sessionRow(campaignId); } catch (e) {}
  const list = itemsOf(row); list.push(clean);
  try { await sessionSave(campaignId, { codexItems: JSON.stringify(list.slice(-500)) }); } catch (e) { return { ok: false, error: 'not saved' }; }
  return { ok: true, items: list };
});
export const removeCodexItem = webMethod(Permissions.Anyone, async (campaignId, id) => {
  const mid = await memberId(); if (!mid || !campaignId) return { ok: false };
  const lm = await isLoreMaster(campaignId);
  let row = null; try { row = await sessionRow(campaignId); } catch (e) {}
  const list = itemsOf(row).filter((x) => !(x.id === String(id) && (lm || x.by === mid)));
  try { await sessionSave(campaignId, { codexItems: JSON.stringify(list) }); } catch (e) { return { ok: false }; }
  return { ok: true, items: list };
});
export const getCodex = webMethod(Permissions.Anyone, async (campaignId) => {
  const mid = await memberId(); if (!mid || !campaignId) return { ok: false };
  const role = await roleAt(campaignId);
  if (!role) { const pl = await playersOf(campaignId); if (!pl.some((p) => p.memberId === mid)) return { ok: false, error: 'not at this adventure' }; }
  let row = null; try { row = await sessionRow(campaignId); } catch (e) {}
  // what each Fell keeps in its Records that the table shares: the characters, quests and
  // clues it wrote down (never its Secrets or its own Notes)
  const records = [];
  try {
    const r = await wixData.query('Characters').eq('campaignId', String(campaignId)).limit(60).find({ suppressAuth: true });
    r.items.forEach((c) => {
      let d = {}; try { d = typeof c.data === 'string' ? JSON.parse(c.data) : (c.data || {}); } catch (e) {}
      const rec = d.records || {}, pick = (k) => (Array.isArray(rec[k]) ? rec[k] : []).map((x) => String(x || '').slice(0, 600)).filter(Boolean).slice(0, 40);
      const one = { fell: c.charName || d.name || 'A Fell', characters: pick('characters'), quests: pick('quests'), clues: pick('clues') };
      if (one.characters.length || one.quests.length || one.clues.length) records.push(one);
    });
  } catch (e) {}
  return { ok: true, entries: codexOf(row), records: records, items: itemsOf(row), me: mid, lm: role === 'loremaster' };
});
export const addCodexEntry = webMethod(Permissions.Anyone, async (campaignId, entry) => {
  if (!campaignId || !(await isLoreMaster(campaignId))) return { ok: false, error: 'only the LoreMaster' };
  const e = entry || {};
  const clean = { id: String(e.id || ('cx' + Date.now())).slice(0, 40), at: Number(e.at) || Date.now(), session: String(e.session || '').slice(0, 120), text: String(e.text || '').slice(0, 6000),
    videoId: String(e.videoId || '').slice(0, 20), names: (Array.isArray(e.names) ? e.names : []).slice(0, 80).map((n) => ({ n: String(n.n || '').slice(0, 80), k: String(n.k || '').slice(0, 12) })) };
  if (!clean.text) return { ok: false, error: 'nothing to add' };
  let row = null; try { row = await sessionRow(campaignId); } catch (e2) {}
  let list = codexOf(row).filter((x) => x.id !== clean.id && !(clean.session && x.session === clean.session));
  list.push(clean); list.sort((a, b) => a.at - b.at); list = list.slice(-200);
  try { await sessionSave(campaignId, { codex: JSON.stringify(list) }); } catch (e3) { return { ok: false, error: 'not saved' }; }
  return { ok: true, entries: list };
});
export const removeCodexEntry = webMethod(Permissions.Anyone, async (campaignId, id) => {
  if (!campaignId || !(await isLoreMaster(campaignId))) return { ok: false, error: 'only the LoreMaster' };
  let row = null; try { row = await sessionRow(campaignId); } catch (e) {}
  const list = codexOf(row).filter((x) => x.id !== String(id));
  try { await sessionSave(campaignId, { codex: JSON.stringify(list) }); } catch (e2) { return { ok: false }; }
  return { ok: true, entries: list };
});

// For the Hearth: the next session of every adventure this member plays in or runs.
export const myNextSessions = webMethod(Permissions.Anyone, async () => {
  const mid = await memberId(); if (!mid) return [];
  const ids = {};
  try { const r = await wixData.query('AdventureMembers').eq('memberId', mid).limit(200).find({ suppressAuth: true }); r.items.forEach((m) => { ids[m.campaignId] = 1; }); } catch (e) {}
  try { const r = await wixData.query('Characters').eq('ownerMemberId', mid).limit(200).find({ suppressAuth: true }); r.items.forEach((c) => { if (c.campaignId) ids[c.campaignId] = 1; }); } catch (e) {}
  try { const r = await wixData.query('Campaigns').eq('ownerMemberId', mid).limit(200).find({ suppressAuth: true }); r.items.forEach((c) => { ids[c._id] = 1; }); } catch (e) {}
  const list = Object.keys(ids); if (!list.length) return [];
  let rows = [];
  try { const r = await wixData.query('AdventureSessions').hasSome('campaignId', list).gt('nextAt', 0).limit(100).find({ suppressAuth: true }); rows = r.items; } catch (e) { rows = []; }
  const out = [];
  for (const row of rows) {
    const nx = nextOccurrence(row); if (!nx || nx < Date.now()) continue;
    const { name, owner } = await ownerOf(row.campaignId);
    let role = owner === mid ? 'loremaster' : '';
    if (!role) { try { role = await myAdventureRole(row.campaignId); } catch (e) {} }
    out.push({ campaignId: row.campaignId, adventure: name || 'Adventure', nextAt: nx, when: whenText(nx), note: row.nextNote || '', link: tableLink(row.campaignId), weekly: !!row.repeatWeekly, lm: role === 'loremaster' || role === 'lorekeeper' });
  }
  return out.sort((a, b) => a.nextAt - b.nextAt);
});
