// backend/characters.web.js
// Player-facing character IO for FellGlass. The Characters collection is admin-read,
// so the embed never queries it directly. Every read here strips the sealed past:
// loadCharacter returns only the sheet data. FateWell uses its own loremaster-gated
// reader to see the sealed past. Ownership is checked on every read and write.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const COLLECTION = 'Characters';

async function memberId() {
  try { const m = await currentMember.getMember(); return m ? m._id : ''; }
  catch (e) { return ''; }
}

export const listMyCharacters = webMethod(Permissions.Anyone, async () => {
  const id = await memberId();
  if (!id) return [];
  const r = await wixData.query(COLLECTION)
    .eq('ownerMemberId', id).descending('_updatedDate').limit(100)
    .find({ suppressAuth: true });
  return r.items.map((it) => ({
    id: it._id,
    name: it.charName || 'Unnamed Fell',
    level: it.level || 1,
    campaign: it.campaign || '',
    forged: !it.data && !!it.forgeSeed
  }));
});

export const myAdventures = webMethod(Permissions.Anyone, async () => {
  const id = await memberId();
  if (!id) return [];
  const ids = {};
  try {
    const mem = await wixData.query('AdventureMembers').eq('memberId', id).limit(200).find({ suppressAuth: true });
    mem.items.forEach((r) => { if (r.campaignId) ids[r.campaignId] = true; });
  } catch (e) {}
  try {
    const own = await wixData.query('Campaigns').eq('ownerMemberId', id).limit(200).find({ suppressAuth: true });
    own.items.forEach((r) => { ids[r._id] = true; });
  } catch (e) {}
  const out = [];
  for (const cid of Object.keys(ids)) {
    try {
      const c = await wixData.get('Campaigns', cid, { suppressAuth: true }).catch(() => null);
      if (c) out.push({ id: cid, name: c.name || 'Adventure' });
    } catch (e) {}
  }
  out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return out;
});

export const loadCharacter = webMethod(Permissions.Anyone, async (charId) => {
  const id = await memberId();
  const r = await wixData.get(COLLECTION, charId, { suppressAuth: true }).catch(() => null);
  if (!r) return null;
  if (r.ownerMemberId && id && r.ownerMemberId !== id) return null;
  // A forged Fell that has not been built yet returns its seed, no data.
  if (!r.data && r.forgeSeed) {
    let seed = {}; try { seed = JSON.parse(r.forgeSeed); } catch (e) { seed = {}; }
    return { forged: true, seed: seed };
  }
  let data = {}; try { data = r.data ? JSON.parse(r.data) : {}; } catch (e) { data = {}; }
  return { forged: false, character: data };  // sealed past intentionally absent
});

export const saveCharacter = webMethod(Permissions.Anyone, async (charId, character) => {
  const id = await memberId();
  const c = character || {};
  let row;
  if (charId) {
    row = await wixData.get(COLLECTION, charId, { suppressAuth: true }).catch(() => null);
    if (!row) return { ok: false, error: 'not found' };
    if (row.ownerMemberId && id && row.ownerMemberId !== id) return { ok: false, error: 'not yours' };
  } else {
    row = { ownerMemberId: id };
  }
  row.data = JSON.stringify(c);
  row.charName = (c.identity && c.identity.name) || row.charName || 'Unnamed Fell';
  row.level = (c.lore && c.lore.level) || 1;
  row.campaign = (c.identity && c.identity.campaign) || row.campaign || '';
  const saved = await wixData.save(COLLECTION, row, { suppressAuth: true });
  return { ok: true, id: saved._id };
});
