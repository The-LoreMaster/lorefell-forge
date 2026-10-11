// backend/sessionsCore.js
// The next session, its reminder email, and the recaps a LoreMaster sends. Shared by
// sessions.web.js (what the tables ask for) and the hourly job in jobs.config.
//
// Emails go out as Wix Triggered Emails to site members, by member id: no mailbox, no
// email list. Two templates are made once in the Wix dashboard; paste their ids below.
import wixData from 'wix-data';
import { triggeredEmails } from 'wix-crm-backend';

// ---- paste the two Triggered Email ids here ----
export const RECAP_TEMPLATE_ID = 'VX06mcS';
export const REMINDER_TEMPLATE_ID = 'VX0AdjX';

const SESSIONS = 'AdventureSessions';
const SITE_URL = 'https://play.lorefell.com';
const TABLE_PATH = '/the-threadspire';
const ZONE = 'America/Phoenix';          // Arizona: no daylight saving, so the hour never shifts
const REMIND_HOUR = 8;                   // the morning of: from 8:00 AM Arizona time
const OPTS = { suppressAuth: true };

export function templatesSet() {
  return RECAP_TEMPLATE_ID.indexOf('PASTE_') !== 0 && REMINDER_TEMPLATE_ID.indexOf('PASTE_') !== 0;
}
function parseList(s) { try { const v = JSON.parse(s || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }

export async function sessionRow(campaignId) {
  const r = await wixData.query(SESSIONS).eq('campaignId', String(campaignId)).limit(1).find(OPTS);
  return r.items[0] || null;
}
export async function sessionSave(campaignId, patch) {
  const cur = await sessionRow(campaignId);
  const row = Object.assign(cur || { campaignId: String(campaignId) }, patch);
  return cur ? wixData.update(SESSIONS, row, OPTS) : wixData.insert(SESSIONS, row, OPTS);
}
/* A session that repeats every week: from its first time, a week at a time, past any week
   the LoreMaster skipped, up to an end if one is set. The next one is the first that has not
   finished (taken as three hours after it starts). Arizona has no daylight saving, so a week
   is always the same hour on the clock. */
export const WEEK = 7 * 86400000;
export function skipsOf(row) { return parseList(row && row.skips).map(Number).filter(Boolean); }
export function nextOccurrence(row, now) {
  if (!row || !row.nextAt) return 0;
  now = now || Date.now();
  let t = Number(row.nextAt);
  if (!row.repeatWeekly) return t;
  const skips = skipsOf(row), until = Number(row.repeatUntil) || 0;
  let guard = 0;
  while (t < now - 3 * 3600000 && guard++ < 600) t += WEEK;
  while (skips.indexOf(t) >= 0 && guard++ < 700) t += WEEK;
  if (until && t > until) return 0;
  return t;
}
/* the next few weeks of a repeating session, for choosing which to skip */
export function upcoming(row, n) {
  if (!row || !row.repeatWeekly || !row.nextAt) return [];
  const out = [], until = Number(row.repeatUntil) || 0, skips = skipsOf(row);
  let t = Number(row.nextAt), guard = 0;
  while (t < Date.now() - 3 * 3600000 && guard++ < 600) t += WEEK;
  while (out.length < (n || 6) && (!until || t <= until)) { out.push({ at: t, skipped: skips.indexOf(t) >= 0 }); t += WEEK; }
  return out;
}
export function optOutOf(row) { return parseList(row && row.optOut).map(String); }
export function recapsOf(row) { return parseList(row && row.recaps); }

// Who owns the adventure: the Campaigns row, or the shared story's root for one that lives
// only there (the same two places the live room ticket reads).
export async function ownerOf(campaignId) {
  try { const c = await wixData.get('Campaigns', campaignId, OPTS); if (c && c.ownerMemberId) return { owner: c.ownerMemberId, name: c.name || '' }; } catch (e) {}
  try {
    const r = await wixData.query('Adventures').eq('advId', campaignId).limit(1).find(OPTS);
    const a = r.items[0]; if (a) return { owner: a.ownerMemberId || '', name: a.name || '' };
  } catch (e) {}
  return { owner: '', name: '' };
}

// Everyone at the adventure but its LoreMaster: members who joined (with a name) and the
// owners of Fells in it. Each once, by member id.
export async function playersOf(campaignId) {
  const { owner } = await ownerOf(campaignId);
  const out = {}; const add = (id, name) => { id = String(id || ''); if (!id || id === owner) return; if (!out[id]) out[id] = { memberId: id, name: name || '' }; else if (name && !out[id].name) out[id].name = name; };
  try {
    const r = await wixData.query('AdventureMembers').eq('campaignId', String(campaignId)).limit(500).find(OPTS);
    r.items.forEach((m) => { if (m.role !== 'loremaster') add(m.memberId, m.name); });
  } catch (e) {}
  try {
    const r = await wixData.query('Characters').eq('campaignId', String(campaignId)).limit(500).find(OPTS);
    r.items.forEach((c) => add(c.ownerMemberId, ''));
  } catch (e) {}
  return Object.keys(out).map((k) => out[k]);
}

export function whenText(ms) {
  try {
    const d = new Date(Number(ms));
    const day = d.toLocaleDateString('en-US', { timeZone: ZONE, weekday: 'long', month: 'long', day: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { timeZone: ZONE, hour: 'numeric', minute: '2-digit' });
    return day + ' at ' + time + ' Arizona time';
  } catch (e) { return ''; }
}
function zoneParts(ms) {
  const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(ms)).forEach((x) => { p[x.type] = x.value; });
  return { day: p.year + '-' + p.month + '-' + p.day, hour: Number(p.hour) };
}
// The adventure's header picture as a plain https address an email can load. Wix's own
// wix:image:// form becomes its public address; anything else that is not https is left out,
// which means a clear one-pixel strip, so the email reads as if there were no picture slot.
export const BLANK_IMAGE = 'https://table.lorefell.com/assets/email-blank.png';
export function emailImage(u) {
  u = String(u || '').trim();
  const m = u.match(/^wix:image:\/\/v1\/([^/#]+)/);
  if (m) return 'https://static.wixstatic.com/media/' + m[1];
  if (/^https:\/\//.test(u)) return u;
  return BLANK_IMAGE;
}
// The picture set on the adventure itself (its root's meta.img), for emails sent without a
// table open, such as the morning reminder.
export async function adventureImage(campaignId) {
  try {
    const r = await wixData.query('Adventures').eq('advId', String(campaignId)).limit(1).find(OPTS);
    const a = r.items[0]; if (!a || !a.meta) return '';
    const meta = typeof a.meta === 'string' ? JSON.parse(a.meta) : a.meta;
    return (meta && meta.img) || '';
  } catch (e) { return ''; }
}
export function tableLink(campaignId) { return SITE_URL + TABLE_PATH + '?campaign=' + encodeURIComponent(campaignId); }
// A player's own way in: their Fell in this adventure, so the table opens on the player's
// side with that Fell in hand (a link naming only the adventure would leave them choosing).
// Someone with no Fell there gets the adventure's link.
export async function playerLink(campaignId, memberId) {
  try {
    const r = await wixData.query('Characters').eq('campaignId', String(campaignId)).eq('ownerMemberId', String(memberId)).limit(1).find(OPTS);
    const c = r.items[0];
    if (c && c._id) return SITE_URL + TABLE_PATH + '?character=' + encodeURIComponent(c._id) + '&campaign=' + encodeURIComponent(campaignId);
  } catch (e) {}
  return tableLink(campaignId);
}

// Each member gets the same words and their own link.
export async function emailEach(templateId, memberIds, variables, campaignId) {
  let sent = 0; const failed = [];
  for (const id of memberIds) {
    const v = Object.assign({}, variables);
    if (campaignId) v.link = await playerLink(campaignId, id);
    try { await triggeredEmails.emailMember(templateId, id, { variables: v }); sent++; }
    catch (e) { failed.push(String(id)); }
  }
  return { sent: sent, failed: failed };
}

// The hourly job. On a session's own day, from the morning hour until it starts, each
// player who has not turned reminders off gets one email. remindedFor records the session
// it was sent for, so it goes once, and a session moved to another time gets its own.
export async function sendDueReminders() {
  if (!templatesSet()) return { ok: false, error: 'templates not set' };
  const now = Date.now(), today = zoneParts(now);
  if (today.hour < REMIND_HOUR) return { ok: true, sent: 0 };
  let rows = [];
  try { const r = await wixData.query(SESSIONS).gt('nextAt', 0).limit(1000).find(OPTS); rows = r.items; } catch (e) { return { ok: false, error: String(e) }; }
  let sent = 0;
  for (const row of rows) {
    const at = nextOccurrence(row, now);
    if (!at || at < now || Number(row.remindedFor) === at) continue;
    if (zoneParts(at).day !== today.day) continue;
    const off = optOutOf(row);
    const players = (await playersOf(row.campaignId)).filter((p) => off.indexOf(p.memberId) < 0);
    const { name } = await ownerOf(row.campaignId);
    const image = emailImage(await adventureImage(row.campaignId));
    const r = await emailEach(REMINDER_TEMPLATE_ID, players.map((p) => p.memberId), {
      adventure: name || 'Your adventure', when: whenText(at), note: row.nextNote || '', image: image, link: tableLink(row.campaignId)
    }, row.campaignId);
    sent += r.sent;
    row.remindedFor = at;
    try { await wixData.update(SESSIONS, row, OPTS); } catch (e) {}
  }
  return { ok: true, sent: sent };
}
