// backend/fatewell.web.js
// FateWell is the loremaster and lorekeeper hub. Hosted mode opens one campaign by id
// and saves its contents back. Campaigns are admin-read, so the embed never queries
// directly; it goes through these owner-checked methods.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const COLLECTION = 'Campaigns';

async function memberId() {
  try { const m = await currentMember.getMember(); return m ? m._id : ''; }
  catch (e) { return ''; }
}

export const loadCampaign = webMethod(Permissions.Anyone, async (campaignId) => {
  if (!campaignId) return null;
  const id = await memberId();
  const r = await wixData.get(COLLECTION, campaignId, { suppressAuth: true }).catch(() => null);
  if (!r) return null;
  if (r.ownerMemberId && id && r.ownerMemberId !== id) return null;
  let data = {}; try { data = r.data ? JSON.parse(r.data) : {}; } catch (e) { data = {}; }
  return { title: r.name || 'Campaign', data: data };
});

export const saveCampaign = webMethod(Permissions.Anyone, async (campaignId, blob, title) => {
  const id = await memberId();
  let row;
  if (campaignId) {
    row = await wixData.get(COLLECTION, campaignId, { suppressAuth: true }).catch(() => null);
    if (row && row.ownerMemberId && id && row.ownerMemberId !== id) return { ok: false };
    if (!row) row = { _id: campaignId, ownerMemberId: id };
  } else {
    row = { ownerMemberId: id };
  }
  if (blob && blob.campaign) {
    row.data = JSON.stringify(blob.campaign);
    if (blob.campaign.name) row.name = blob.campaign.name;
  }
  if (title) row.name = title;
  row.ownerMemberId = row.ownerMemberId || id;
  const saved = await wixData.save(COLLECTION, row, { suppressAuth: true });
  return { ok: true, id: saved._id };
});
