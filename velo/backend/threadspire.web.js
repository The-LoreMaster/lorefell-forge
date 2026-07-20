// backend/threadspire.web.js
// ThreadSpire is the table runtime. Stages are saved tables: a map reference, every
// token's position and footprint, and the grid. Each stage belongs to the member who
// made it. The collection is admin-read, so the embed never queries directly; it goes
// through these owner-checked methods, the same shape the Assets trio uses.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const COLLECTION = 'Stages';

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
