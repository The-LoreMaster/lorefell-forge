// backend/campaignview.web.js
// Shared table state for the ThreadSpire join. One row per campaign, a versioned snapshot
// the LoreMaster and their players read and write through these member-checked methods.
// The admin-locked collection is reached only here, never queried by an embed directly.
import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';
import { myAdventureRole } from 'backend/fatewell.web.js';

// TELEMETRY. The 2-second table-state poll runs through here, so this is the steady baseline
// of calls that everything else stacks on top of. Counting it shows how much quota the poll
// alone spends per minute, which matters because the quota is a per-minute budget.
let TELE_CV = null;
function cvTeleReset() { TELE_CV = { get: 0, query: 0, insert: 0, update: 0, remove: 0, total: 0, byColl: {} }; }
function cvTeleBump(op, coll) { if (!TELE_CV) return; TELE_CV[op] = (TELE_CV[op] || 0) + 1; TELE_CV.total++; TELE_CV.byColl[coll] = (TELE_CV.byColl[coll] || 0) + 1; }
const wd = {
  get: (c, id, o) => { cvTeleBump('get', c); return wixData.get(c, id, o); },
  insert: (c, r, o) => { cvTeleBump('insert', c); return wixData.insert(c, r, o); },
  update: (c, r, o) => { cvTeleBump('update', c); return wixData.update(c, r, o); },
  remove: (c, id, o) => { cvTeleBump('remove', c); return wixData.remove(c, id, o); },
  query: (c) => { cvTeleBump('query', c); return wixData.query(c); }
};

const CV = 'CampaignView';

async function memberId() {
  try { const m = await currentMember.getMember(); return m ? m._id : ''; }
  catch (e) { return ''; }
}

export const getCampaignState = webMethod(Permissions.Anyone, async (campaignId, since) => {
  cvTeleReset();
  const mid = await memberId(); if (!mid || !campaignId) return null;
  try {
    const r = await wd.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
    const row = r.items[0]; if (!row) return null;
    if (typeof since === 'number' && (row.version || 0) <= since) return null;
    let snap = null; try { snap = JSON.parse(row.snapshot || 'null'); } catch (e) { snap = null; }
    return { version: row.version || 0, snap: snap, tele: TELE_CV };
  } catch (e) { return null; }
});

export const saveCampaignState = webMethod(Permissions.Anyone, async (campaignId, snap) => {
  cvTeleReset();
  const mid = await memberId(); if (!mid || !campaignId) return { ok: false };
  try {
    const ex = await wd.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
    const cur = ex.items[0];
    const version = (cur ? (cur.version || 0) : 0) + 1;
    // Absent means keep. The table sends heavy things apart from light ones, so a push
    // carries only what it is about, and the row remembers everything else it was ever
    // given. To clear a thing, send it empty; to leave it alone, do not send it.
    let body = snap || null;
    if (body && cur && cur.snapshot) {
      try {
        const prev = JSON.parse(cur.snapshot);
        if (prev) {
          const merged = Object.assign({}, body);
          Object.keys(prev).forEach((k) => { if (merged[k] === undefined) merged[k] = prev[k]; });
          body = merged;
        }
      } catch (e) {}
    }
    const base = cur ? Object.assign({}, cur) : {};
    const row = Object.assign(base, { campaignId: String(campaignId), version: version, snapshot: JSON.stringify(body), updatedBy: mid });
    if (cur) { row._id = cur._id; await wd.update(CV, row, { suppressAuth: true }); }
    else { await wd.insert(CV, row, { suppressAuth: true }); }
    return { ok: true, version: version, tele: TELE_CV };
  } catch (e) { return { ok: false, error: String(e) }; }
});

async function lmOnly(campaignId) {
  try { const r = await myAdventureRole(campaignId); return r === 'loremaster' || r === 'lorekeeper'; }
  catch (e) { return false; }
}

// The LoreMaster's Journal, stored on the same campaign row but read only by the LM, so it
// never travels to a player. Kept apart from the shared snapshot field.
export const getJournal = webMethod(Permissions.Anyone, async (campaignId) => {
  cvTeleReset();
  const mid = await memberId(); if (!mid || !campaignId) return [];
  if (!(await lmOnly(campaignId))) return [];
  try {
    const r = await wd.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
    const row = r.items[0]; if (!row || !row.journal) return [];
    try { return JSON.parse(row.journal); } catch (e) { return []; }
  } catch (e) { return []; }
});

export const saveJournal = webMethod(Permissions.Anyone, async (campaignId, entries) => {
  cvTeleReset();
  const mid = await memberId(); if (!mid || !campaignId) return { ok: false };
  if (!(await lmOnly(campaignId))) return { ok: false };
  try {
    const ex = await wd.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
    const cur = ex.items[0];
    const j = JSON.stringify(Array.isArray(entries) ? entries : []);
    if (cur) { const row = Object.assign({}, cur, { journal: j }); await wd.update(CV, row, { suppressAuth: true }); }
    else { await wd.insert(CV, { campaignId: String(campaignId), version: 0, snapshot: 'null', journal: j, updatedBy: mid }, { suppressAuth: true }); }
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});
