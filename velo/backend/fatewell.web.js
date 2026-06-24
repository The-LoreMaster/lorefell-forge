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


const KEEPER_ROLES = ['loremaster', 'lorekeeper'];

async function isKeeper() {
  try {
    const roles = await currentMember.getRoles();
    if (Array.isArray(roles)) {
      return roles.some((r) => {
        const t = String((r && (r.title || r.name)) || '').toLowerCase();
        return KEEPER_ROLES.some((k) => t.indexOf(k) !== -1);
      });
    }
  } catch (e) {}
  return false;
}

// Sealed pasts for a campaign roster. Returns nothing unless the caller holds a
// loremaster or lorekeeper role, so the player view can never reach it. Matched to
// the roster by member id first, then by character name.
export const getSealed = webMethod(Permissions.Anyone, async (memberIds, names) => {
  if (!(await isKeeper())) return [];
  const ids = Array.isArray(memberIds) ? memberIds.filter(Boolean) : [];
  const nm = Array.isArray(names) ? names.filter(Boolean) : [];
  if (!ids.length && !nm.length) return [];
  let items = [];
  try {
    const r = await wixData.query('Characters')
      .hasSome('ownerMemberId', ids.length ? ids : ['__none__']).limit(200)
      .find({ suppressAuth: true });
    items = r.items;
    if (nm.length) {
      const rn = await wixData.query('Characters')
        .hasSome('charName', nm).limit(200).find({ suppressAuth: true });
      rn.items.forEach((it) => { if (!items.some((x) => x._id === it._id)) items.push(it); });
    }
  } catch (e) { items = []; }
  return items.filter((it) => it.sealedPast).map((it) => {
    let sp = {}; try { sp = JSON.parse(it.sealedPast); } catch (e) { sp = {}; }
    return {
      charId: it._id,
      name: it.charName || '',
      ownerMemberId: it.ownerMemberId || '',
      sealCode: it.sealCode || '',
      reveals: Array.isArray(sp.reveals) ? sp.reveals : [],
      fragments: Array.isArray(sp.fragments) ? sp.fragments : []
    };
  });
});
