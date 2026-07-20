// backend/campaignview.web.js
// Shared table state for the ThreadSpire join. One row per campaign, a versioned snapshot
// the LoreMaster and their players read and write through these member-checked methods.
// The admin-locked collection is reached only here, never queried by an embed directly.
import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const CV = 'CampaignView';

async function memberId() {
  try { const m = await currentMember.getMember(); return m ? m._id : ''; }
  catch (e) { return ''; }
}

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
