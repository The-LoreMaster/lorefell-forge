// The SagaForge's backend: where a saga is kept between sittings, the LoreMaster's own house
// rules, the scan, and sending a finished saga to the LoreMaster's adventures.
//
// A saga is the whole working state of one adventure being written: the answers, each stage's
// approved text, the file plan, the files, the notes. It lives in the Sagas table, one row per
// saga, gzipped. The writing itself (the calls to Claude) goes through the site's stream
// endpoint, functions/api/saga/stream.js, which builds its requests with sagaPrompt.js.
//
// Admin only for now (Nate, 2026-10-16): only he sees the SagaForge until it is ready.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';
import { gzipSync, gunzipSync } from 'zlib';
import { meta, titleOf, prefixIds } from 'backend/sagaPrompt.js';
import { checkFiles } from 'backend/sagaCheck.js';
import { readAdventure } from 'backend/adventureFormat.js';
import { writeSagaAdventure } from 'backend/adventures.web.js';

const SAGAS = 'Sagas';
const AUTH = { suppressAuth: true };

async function memberId() {
  try { const m = await currentMember.getMember(); return (m && m._id) || ''; } catch (e) { return ''; }
}
function pack(saga) { return gzipSync(Buffer.from(JSON.stringify(saga), 'utf8')).toString('base64'); }
function unpack(row) {
  try { return JSON.parse(gunzipSync(Buffer.from(String(row.sagaGz || ''), 'base64')).toString('utf8')); } catch (e) { return null; }
}
function summary(row) {
  return { id: row._id, title: row.title || 'Untitled', stage: row.stage || 'questions', advId: row.advId || '', updatedAt: row.updatedAt || 0, files: row.files || 0 };
}
async function own(id, mid) {
  const row = id ? await wixData.get(SAGAS, String(id), AUTH).catch(() => null) : null;
  return row && row.ownerMemberId === mid && row.kind !== 'rules' ? row : null;
}
function newId() { return 'sg-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export const sfMeta = webMethod(Permissions.Admin, async () => meta());

export const sfList = webMethod(Permissions.Admin, async () => {
  const mid = await memberId();
  const r = await wixData.query(SAGAS).eq('ownerMemberId', mid).eq('kind', 'saga').descending('_updatedDate').limit(100).find(AUTH).catch(() => ({ items: [] }));
  return { ok: true, sagas: r.items.map(summary) };
});

export const sfGet = webMethod(Permissions.Admin, async (id) => {
  const row = await own(id, await memberId());
  if (!row) return { ok: false, error: 'No such saga.' };
  const saga = unpack(row);
  if (!saga) return { ok: false, error: 'This saga could not be read.' };
  return { ok: true, saga: saga };
});

// Saves the whole saga. A saga with no id is new and gets one.
export const sfSave = webMethod(Permissions.Admin, async (saga) => {
  const mid = await memberId();
  if (!mid) return { ok: false, error: 'Sign in first.' };
  if (!saga || typeof saga !== 'object') return { ok: false, error: 'Nothing to save.' };
  const s = Object.assign({}, saga);
  s.id = s.id || newId();
  s.updatedAt = Date.now();
  const row = { _id: s.id, kind: 'saga', ownerMemberId: mid, title: titleOf(s), stage: s.stage || 'questions', advId: s.advId || '',
    updatedAt: s.updatedAt, files: Object.keys(s.files || {}).length, sagaGz: pack(s) };
  const cur = await wixData.get(SAGAS, s.id, AUTH).catch(() => null);
  if (cur && cur.ownerMemberId !== mid) return { ok: false, error: 'That saga belongs to another member.' };
  if (cur) await wixData.update(SAGAS, Object.assign({}, cur, row), AUTH);
  else await wixData.insert(SAGAS, row, AUTH);
  return { ok: true, id: s.id, updatedAt: s.updatedAt };
});

export const sfRemove = webMethod(Permissions.Admin, async (id) => {
  const row = await own(id, await memberId());
  if (!row) return { ok: false, error: 'No such saga.' };
  await wixData.remove(SAGAS, row._id, AUTH);
  return { ok: true };
});

// The LoreMaster's own house rules, added as they use the tool. Every request carries them.
export const sfRules = webMethod(Permissions.Admin, async () => {
  const mid = await memberId();
  const row = await wixData.get(SAGAS, 'rules-' + mid, AUTH).catch(() => null);
  return { ok: true, rules: (row && Array.isArray(row.rules)) ? row.rules : [] };
});

export const sfSaveRules = webMethod(Permissions.Admin, async (rules) => {
  const mid = await memberId();
  if (!mid) return { ok: false, error: 'Sign in first.' };
  const list = (Array.isArray(rules) ? rules : []).map((r) => String(r || '').trim().slice(0, 600)).filter(Boolean).slice(0, 60);
  const id = 'rules-' + mid;
  const cur = await wixData.get(SAGAS, id, AUTH).catch(() => null);
  const row = { _id: id, kind: 'rules', ownerMemberId: mid, rules: list };
  if (cur) await wixData.update(SAGAS, Object.assign({}, cur, row), AUTH);
  else await wixData.insert(SAGAS, row, AUTH);
  return { ok: true, rules: list };
});

// The scan, run on the saved files.
export const sfCheck = webMethod(Permissions.Admin, async (id) => {
  const row = await own(id, await memberId());
  const saga = row && unpack(row);
  if (!saga) return { ok: false, error: 'No such saga.' };
  return { ok: true, findings: checkFiles(saga.files || {}, titleOf(saga)) };
});

// Sends the saga to the LoreMaster's adventures. The first time makes the adventure under the
// saga's id. After that it replaces the adventure's prep with the saga as it stands now.
export const sfPublish = webMethod(Permissions.Admin, async (id) => {
  const mid = await memberId();
  const row = await own(id, mid);
  const saga = row && unpack(row);
  if (!saga) return { ok: false, error: 'No such saga.' };
  const title = titleOf(saga);
  const files = prefixIds(saga.files || {}, saga.id);
  if (!files[title + '.md']) return { ok: false, error: 'The overview, "' + title + '.md", is not written yet.' };
  let built;
  try { built = readAdventure(files, title, {}); } catch (e) { return { ok: false, error: 'The adventure could not be read: ' + ((e && e.message) || e) }; }
  const p = built.pack;
  p.campaign.id = saga.id;
  p.campaign.name = title;
  const r = await writeSagaAdventure(p, mid);
  if (!r || !r.ok) return { ok: false, error: (r && r.error) || 'The adventure was not made.' };
  saga.advId = saga.id;
  saga.publishedAt = Date.now();
  await wixData.update(SAGAS, Object.assign({}, row, { advId: saga.id, sagaGz: pack(saga), updatedAt: Date.now() }), AUTH);
  return { ok: true, id: saga.id, created: r.created, warnings: built.warnings || [] };
});
