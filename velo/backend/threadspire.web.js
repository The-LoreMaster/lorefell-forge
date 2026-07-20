// backend/threadspire.web.js
// ThreadSpire is the table runtime. Stages are saved tables: a map reference, every
// token's position and footprint, and the grid. Each stage belongs to the member who
// made it. The collection is admin-read, so the embed never queries directly; it goes
// through these owner-checked methods, the same shape the Assets trio uses.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const COLLECTION = 'Stages';
const CV = 'CampaignView';   // the shared table state one campaign's clients read from

async function memberId() {
  try { const m = await currentMember.getMember(); return m ? m._id : ''; }
  catch (e) { return ''; }
}

export const listStages = webMethod(Permissions.Anyone, async (campaignId) => {
  const mid = await memberId();
  if (!mid) return [];
  try {
    let q = wixData.query(COLLECTION).eq('ownerMemberId', mid);
    if (campaignId) q = q.eq('campaignId', String(campaignId));
    const r = await q.limit(1000).find({ suppressAuth: true });
    return r.items;
  } catch (e) { return []; }
});

export const saveStage = webMethod(Permissions.Anyone, async (stage) => {
  const mid = await memberId(); if (!mid || !stage || !stage.stageId) return { ok: false };
  const row = Object.assign({}, stage, { ownerMemberId: mid });
  try {
    const ex = await wixData.query(COLLECTION)
      .eq('ownerMemberId', mid).eq('stageId', String(stage.stageId))
      .limit(1).find({ suppressAuth: true });
    if (ex.items.length) {
      const merged = Object.assign({}, ex.items[0], row);
      const u = await wixData.update(COLLECTION, merged, { suppressAuth: true });
      return { ok: true, id: u._id };
    }
    const ins = await wixData.insert(COLLECTION, row, { suppressAuth: true });
    return { ok: true, id: ins._id };
  } catch (e) { return { ok: false, error: String(e) }; }
});

export const deleteStage = webMethod(Permissions.Anyone, async (stageId) => {
  const mid = await memberId(); if (!mid || !stageId) return { ok: false };
  try {
    const ex = await wixData.query(COLLECTION)
      .eq('ownerMemberId', mid).eq('stageId', String(stageId))
      .limit(1).find({ suppressAuth: true });
    if (ex.items.length) await wixData.remove(COLLECTION, ex.items[0]._id, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// The shared table state. One row per campaign, a versioned snapshot the LoreMaster and
// their players read from and write to. Scoped by campaignId; the admin-locked collection
// is reached only through these methods, never queried by the embed directly.
export const getCampaignState = webMethod(Permissions.Anyone, async (campaignId, since) => {
  const mid = await memberId(); if (!mid || !campaignId) return null;
  try {
    const r = await wixData.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
    const row = r.items[0]; if (!row) return null;
    if (typeof since === 'number' && (row.version || 0) <= since) return null;
    let snap = null; try { snap = JSON.parse(row.snapshot || 'null'); } catch (e) { snap = null; }
    return { version: row.version || 0, snap: snap };
  } catch (e) { return null; }
});

export const saveCampaignState = webMethod(Permissions.Anyone, async (campaignId, snap) => {
  const mid = await memberId(); if (!mid || !campaignId) return { ok: false };
  try {
    const ex = await wixData.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
    const cur = ex.items[0];
    const version = (cur ? (cur.version || 0) : 0) + 1;
    const row = { campaignId: String(campaignId), version: version, snapshot: JSON.stringify(snap || null), updatedBy: mid };
    if (cur) { row._id = cur._id; await wixData.update(CV, row, { suppressAuth: true }); }
    else { await wixData.insert(CV, row, { suppressAuth: true }); }
    return { ok: true, version: version };
  } catch (e) { return { ok: false, error: String(e) }; }
});
