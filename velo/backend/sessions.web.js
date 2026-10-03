// backend/sessions.web.js
// What the tables and the Hearth ask about sessions: the next one, reminders on or off, and
// the recaps the LoreMaster writes and sends. Setting the next session and sending a recap
// are the adventure's LoreMaster's alone (not a lorekeeper's). The work is in sessionsCore.js.
import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';
import { myAdventureRole } from 'backend/fatewell.web.js';
import { RECAP_TEMPLATE_ID, templatesSet, sessionRow, sessionSave, optOutOf, recapsOf, ownerOf, playersOf, whenText, tableLink, emailEach } from 'backend/sessionsCore.js';

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
  const out = { ok: true, nextAt: (row && row.nextAt) || 0, note: (row && row.nextNote) || '', when: row && row.nextAt ? whenText(row.nextAt) : '',
    remindersOff: optOutOf(row).indexOf(mid) >= 0, emailReady: templatesSet() };
  if (role === 'loremaster') { out.recaps = recapsOf(row); out.players = players; }
  return out;
});

export const setNextSession = webMethod(Permissions.Anyone, async (campaignId, atMs, note) => {
  if (!campaignId || !(await isLoreMaster(campaignId))) return { ok: false, error: 'only the LoreMaster' };
  const at = Number(atMs) || 0;
  if (at && at < Date.now() - 3600 * 1000) return { ok: false, error: 'that time has passed' };
  try { await sessionSave(campaignId, { nextAt: at, nextNote: String(note || '').slice(0, 300) }); }
  catch (e) { return { ok: false, error: 'not saved' }; }
  return { ok: true, nextAt: at, when: at ? whenText(at) : '' };
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
export const sendRecap = webMethod(Permissions.Anyone, async (campaignId, text, memberIds, title) => {
  if (!campaignId || !(await isLoreMaster(campaignId))) return { ok: false, error: 'only the LoreMaster' };
  if (!templatesSet()) return { ok: false, error: 'the recap email template is not set up yet' };
  const body = String(text || '').trim().slice(0, 8000);
  if (!body) return { ok: false, error: 'the recap is empty' };
  const players = await playersOf(campaignId);
  const want = (Array.isArray(memberIds) ? memberIds : []).map(String);
  const to = players.filter((p) => want.indexOf(p.memberId) >= 0).map((p) => p.memberId);
  if (!to.length) return { ok: false, error: 'nobody chosen' };
  const { name } = await ownerOf(campaignId);
  const r = await emailEach(RECAP_TEMPLATE_ID, to, { adventure: name || 'Your adventure', title: String(title || 'Session recap').slice(0, 120), recap: body, link: tableLink(campaignId) });
  let row = null; try { row = await sessionRow(campaignId); } catch (e) {}
  const recaps = recapsOf(row);
  recaps.unshift({ id: 'r' + Date.now(), at: Date.now(), title: String(title || 'Session recap').slice(0, 120), text: body, sent: r.sent, failed: r.failed.length });
  try { await sessionSave(campaignId, { recaps: JSON.stringify(recaps.slice(0, 40)) }); } catch (e) {}
  return { ok: r.sent > 0, sent: r.sent, failed: r.failed.length, error: r.sent ? '' : 'no email went out' };
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
  try { const r = await wixData.query('AdventureSessions').hasSome('campaignId', list).gt('nextAt', Date.now()).limit(100).find({ suppressAuth: true }); rows = r.items; } catch (e) { rows = []; }
  const out = [];
  for (const row of rows) { const { name } = await ownerOf(row.campaignId); out.push({ campaignId: row.campaignId, adventure: name || 'Adventure', nextAt: row.nextAt, when: whenText(row.nextAt), note: row.nextNote || '', link: tableLink(row.campaignId) }); }
  return out.sort((a, b) => a.nextAt - b.nextAt);
});
