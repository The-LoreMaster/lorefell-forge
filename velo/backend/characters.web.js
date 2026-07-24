// backend/characters.web.js
// Player-facing character IO for FellGlass. The Characters collection is admin-read,
// so the embed never queries it directly. Every read here strips the sealed past:
// loadCharacter returns only the sheet data. FateWell uses its own loremaster-gated
// reader to see the sealed past. Ownership is checked on every read and write.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember, members } from 'wix-members-backend';

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
      if (c) {
        let worldId = c.worldId || '';
        if (!worldId && c.data) { try { worldId = (JSON.parse(c.data).campaign || {}).worldId || ''; } catch (e) {} }
        out.push({ id: cid, name: c.name || 'Adventure', worldId: worldId });
      }
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

// A public, safe view of any character for ThreadSpire: card fields only, no sealed
// past, no private mechanics. Includes the owner's display name and whether the
// caller owns it. Used for party lore pages and the player's own card.
export const threadspirePublicChar = webMethod(Permissions.Anyone, async (charId) => {
  const me = await memberId();
  const r = await wixData.get(COLLECTION, charId, { suppressAuth: true }).catch(() => null);
  if (!r) return null;
  let data = {}; try { data = r.data ? JSON.parse(r.data) : {}; } catch (e) { data = {}; }
  const idn = data.identity || {};
  const arsenal = {
    weapons: (data.weapons || []).map((w) => w && (w.name || w.form || '')).filter(Boolean),
    lorebounds: (data.lorebounds || []).map((l) => l && (l.name || l.type || '')).filter(Boolean),
    armor: data.armor && (data.armor.active || data.armor.name) ? [data.armor.active || data.armor.name] : []
  };
  const talents = (data.talents || []).map((t) => (typeof t === 'string' ? t : (t && t.name))).filter(Boolean);
  let playerName = '';
  const ownerId = r.ownerMemberId || r._owner;
  if (ownerId) {
    try { const mem = await members.getMember(ownerId, { fieldsets: ['FULL'] }); playerName = (mem && (mem.profile && mem.profile.nickname)) || (mem && mem.contactDetails && mem.contactDetails.firstName) || ''; } catch (e) {}
  }
  return {
    id: charId,
    name: idn.name || 'Unnamed',
    playerName: playerName,
    image: data.portrait || idn.image || '',
    lineage: idn.lineage || '',
    origin: idn.origin || '',
    motivation: idn.motivation || '',
    blurb: idn.desc || '',
    arsenal: arsenal,
    talents: talents,
    locationId: idn.locationId || '',
    worldId: idn.worldId || '',
    isOwner: !!(me && ownerId && me === ownerId)
  };
});

export const deleteCharacter = webMethod(Permissions.Anyone, async (charId) => {
  const id = await memberId();
  if (!charId) return { ok: false, error: 'no id' };
  const row = await wixData.get(COLLECTION, charId, { suppressAuth: true }).catch(() => null);
  if (!row) return { ok: true, id: charId, already: true };
  if (row.ownerMemberId && id && row.ownerMemberId !== id) return { ok: false, error: 'not yours' };
  const campId = row.campaignId || '';
  await wixData.remove(COLLECTION, charId, { suppressAuth: true });

  // Drop campaign membership only for a plain player who has no other character left
  // in that campaign. Never remove the campaign owner or a lorekeeper.
  let leftCampaign = false;
  if (id && campId) {
    let isOwner = false;
    try { const c = await wixData.get('Campaigns', campId, { suppressAuth: true }).catch(() => null); isOwner = !!(c && c.ownerMemberId === id); } catch (e) {}
    if (!isOwner) {
      let others = 0;
      try { const r = await wixData.query(COLLECTION).eq('ownerMemberId', id).eq('campaignId', campId).limit(1).find({ suppressAuth: true }); others = r.items.length; } catch (e) {}
      if (!others) {
        try {
          const m = await wixData.query('AdventureMembers').eq('campaignId', campId).eq('memberId', id).limit(20).find({ suppressAuth: true });
          for (const mm of m.items) {
            if (mm.role === 'loremaster' || mm.role === 'lorekeeper') continue;
            await wixData.remove('AdventureMembers', mm._id, { suppressAuth: true });
            leftCampaign = true;
          }
        } catch (e) {}
      }
    }
  }
  return { ok: true, id: charId, leftCampaign: leftCampaign };
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
  row.campaignId = (c.identity && c.identity.campaignId) || row.campaignId || '';
  const saved = await wixData.save(COLLECTION, row, { suppressAuth: true });
  return { ok: true, id: saved._id };
});

// ---- the LoreMaster's hand on a player's sheet ----
// loadCharacter and saveCharacter refuse anything that is not yours, which is right for
// a player. A LoreMaster running the adventure the Fell belongs to is the one exception,
// and it is decided here rather than trusted from the page: the caller's role is read
// from AdventureMembers against the campaign stamped on the character's own row, so
// nothing the browser sends can widen it.
async function lmMayTouch(charId) {
  const me = await memberId();
  if (!me) return { ok: false, error: 'not signed in' };
  const row = await wixData.get(COLLECTION, charId, { suppressAuth: true }).catch(() => null);
  if (!row) return { ok: false, error: 'not found' };
  if (row.ownerMemberId && row.ownerMemberId === me) return { ok: true, row: row };
  const cid = row.campaignId || '';
  if (!cid) return { ok: false, error: 'that Fell is not in an adventure' };
  try {
    const r = await wixData.query('AdventureMembers')
      .eq('campaignId', cid).eq('memberId', me).limit(1).find({ suppressAuth: true });
    const role = r.items.length ? r.items[0].role : '';
    if (role === 'loremaster' || role === 'lorekeeper') return { ok: true, row: row };
  } catch (e) {}
  try {
    const camp = await wixData.get('Campaigns', cid, { suppressAuth: true }).catch(() => null);
    if (camp && camp.ownerMemberId === me) return { ok: true, row: row };
  } catch (e) {}
  return { ok: false, error: 'not your adventure' };
}

// Which adventure a Fell belongs to. The record is the truth: a player arrives at the
// table by way of their Fell, and the table used to learn the adventure only from the
// address bar, so anyone who came in without it sat at an adventure of nobody and
// received nothing. Readable by the Fell's owner and by whoever runs the adventure.
export const charAdventure = webMethod(Permissions.Anyone, async (charId) => {
  if (!charId) return null;
  const me = await memberId();
  if (!me) return null;
  const row = await wixData.get(COLLECTION, charId, { suppressAuth: true }).catch(() => null);
  if (!row) return null;
  const cid = row.campaignId || '';
  if (row.ownerMemberId && row.ownerMemberId === me) return { campaignId: cid, campaign: row.campaign || '' };
  if (!cid) return null;
  try {
    const camp = await wixData.get('Campaigns', cid, { suppressAuth: true }).catch(() => null);
    if (camp && camp.ownerMemberId === me) return { campaignId: cid, campaign: row.campaign || '' };
  } catch (e) {}
  try {
    const r = await wixData.query('AdventureMembers')
      .eq('campaignId', cid).eq('memberId', me).limit(1).find({ suppressAuth: true });
    if (r.items.length) return { campaignId: cid, campaign: row.campaign || '' };
  } catch (e) {}
  return null;
});

// A player stepping away from an adventure. Their Fell is theirs, so it is unlinked
// rather than given up.
export const leaveAdventure = webMethod(Permissions.Anyone, async (charId) => {
  if (!charId) return { ok: false, error: 'no Fell given' };
  const me = await memberId();
  if (!me) return { ok: false, error: 'not signed in' };
  const row = await wixData.get(COLLECTION, charId, { suppressAuth: true }).catch(() => null);
  if (!row) return { ok: false, error: 'not found' };
  if (!row.ownerMemberId || row.ownerMemberId !== me) return { ok: false, error: 'not your Fell' };
  const cid = row.campaignId || '';
  row.campaignId = ''; row.campaign = '';
  try {
    let data = {};
    try { data = row.data ? JSON.parse(row.data) : {}; } catch (e) { data = {}; }
    if (data && data.identity) { data.identity.campaignId = ''; data.identity.campaign = ''; }
    row.data = JSON.stringify(data);
    await wixData.update(COLLECTION, row, { suppressAuth: true });
  } catch (e) { return { ok: false, error: 'could not leave' }; }
  if (cid) {
    try {
      const r = await wixData.query('AdventureMembers')
        .eq('campaignId', cid).eq('memberId', me).limit(5).find({ suppressAuth: true });
      for (const it of r.items) { await wixData.remove('AdventureMembers', it._id, { suppressAuth: true }); }
    } catch (e) {}
  }
  return { ok: true };
});

// Whether the caller runs this adventure. Used where there is no character to ask,
// such as making a new one for someone at the table.
async function lmMayRun(campaignId) {
  const me = await memberId();
  if (!me || !campaignId) return false;
  try {
    const camp = await wixData.get('Campaigns', campaignId, { suppressAuth: true }).catch(() => null);
    if (camp && camp.ownerMemberId === me) return true;
  } catch (e) {}
  try {
    const r = await wixData.query('AdventureMembers')
      .eq('campaignId', campaignId).eq('memberId', me).limit(1).find({ suppressAuth: true });
    const role = r.items.length ? r.items[0].role : '';
    return role === 'loremaster' || role === 'lorekeeper';
  } catch (e) {}
  return false;
}

// A Fell for someone at the table who is not on a device. It is a real character row
// with a real sheet, owned by nobody: the adventure governs it, so the LoreMaster and
// any lorekeeper can fill it in through the same gate as everyone else's. Offline-ness
// lives in the sheet data, not in a new column, so no collection has to change.
export const lmCreateOfflineFell = webMethod(Permissions.Anyone, async (campaignId, name) => {
  if (!campaignId) return { ok: false, error: 'no adventure' };
  if (!(await lmMayRun(campaignId))) return { ok: false, error: 'not your adventure' };
  const nm = String(name || '').trim().slice(0, 80) || 'Unnamed Fell';
  const data = { offline: true, identity: { name: nm, campaignId: campaignId } };
  try {
    const saved = await wixData.insert(COLLECTION, {
      ownerMemberId: '', charName: nm, level: 1,
      campaignId: campaignId, data: JSON.stringify(data)
    }, { suppressAuth: true });
    return { ok: true, id: saved._id, name: nm };
  } catch (e) { return { ok: false, error: (e && e.message) ? e.message : String(e) }; }
});

// Take someone off the adventure. A member loses their seat and their Fell is released
// rather than destroyed, because the Fell is theirs. A Fell with no member behind it is
// one the table made, so that one goes.
export const lmRemoveFromAdventure = webMethod(Permissions.Anyone, async (campaignId, targetMemberId, charId) => {
  if (!campaignId) return { ok: false, error: 'no adventure' };
  if (!(await lmMayRun(campaignId))) return { ok: false, error: 'not your adventure' };
  const me = await memberId();
  try {
    const camp = await wixData.get('Campaigns', campaignId, { suppressAuth: true }).catch(() => null);
    if (camp && targetMemberId && camp.ownerMemberId === targetMemberId) {
      return { ok: false, error: 'the loremaster cannot be removed from their own adventure' };
    }
  } catch (e) {}
  // Removing a Fell the adventure keeps is not removing a member, so no member is given
  // and this guard is only for a real seat.
  if (targetMemberId && targetMemberId === me) return { ok: false, error: 'you cannot remove yourself' };
  let released = false, deleted = false;
  if (charId) {
    const row = await wixData.get(COLLECTION, charId, { suppressAuth: true }).catch(() => null);
    if (row && String(row.campaignId || '') === String(campaignId)) {
      // A Fell whose record the adventure's own account holds belongs to the table, so
      // removing it removes it. One with a player behind it is theirs and is released.
      let heldByTable = !row.ownerMemberId;
      if (!heldByTable) {
        try {
          const camp = await wixData.get('Campaigns', campaignId, { suppressAuth: true }).catch(() => null);
          heldByTable = !!(camp && camp.ownerMemberId && camp.ownerMemberId === row.ownerMemberId);
        } catch (e) {}
      }
      if (heldByTable) {
        try { await wixData.remove(COLLECTION, charId, { suppressAuth: true }); deleted = true; } catch (e) {}
      } else {
        row.campaignId = ''; row.campaign = '';
        try { await wixData.update(COLLECTION, row, { suppressAuth: true }); released = true; } catch (e) {}
      }
    }
  }
  if (targetMemberId) {
    try {
      const r = await wixData.query('AdventureMembers')
        .eq('campaignId', campaignId).eq('memberId', targetMemberId).limit(5).find({ suppressAuth: true });
      for (const it of r.items) { await wixData.remove('AdventureMembers', it._id, { suppressAuth: true }); }
    } catch (e) {}
  }
  return { ok: true, released: released, deleted: deleted };
});

export const lmLoadCharacter = webMethod(Permissions.Anyone, async (charId) => {
  if (!charId) return null;
  const gate = await lmMayTouch(charId);
  if (!gate.ok) return null;
  const r = gate.row;
  if (!r.data && r.forgeSeed) {
    let seed = {}; try { seed = JSON.parse(r.forgeSeed); } catch (e) { seed = {}; }
    return { forged: true, seed: seed };
  }
  let data = {}; try { data = r.data ? JSON.parse(r.data) : {}; } catch (e) { data = {}; }
  return { forged: false, character: data };
});

export const lmSaveCharacter = webMethod(Permissions.Anyone, async (charId, character) => {
  if (!charId) return { ok: false, error: 'no Fell given' };
  const gate = await lmMayTouch(charId);
  if (!gate.ok) return { ok: false, error: gate.error };
  const row = gate.row;
  const c = character || {};
  row.data = JSON.stringify(c);
  row.charName = (c.identity && c.identity.name) || row.charName || 'Unnamed Fell';
  row.level = (c.lore && c.lore.level) || row.level || 1;
  // the owner and the adventure are the player's to change, never the LoreMaster's
  const saved = await wixData.save(COLLECTION, row, { suppressAuth: true });
  return { ok: true, id: saved._id };
});

export const threadspireSaveMeta = webMethod(Permissions.Anyone, async (charId, patch) => {
  try {
    if (!charId) return { ok: false };
    const id = await memberId();
    const row = await wixData.get(COLLECTION, charId, { suppressAuth: true }).catch(() => null);
    if (!row) return { ok: false, error: 'not found' };
    if (row.ownerMemberId && id && row.ownerMemberId !== id) return { ok: false, error: 'not yours' };
    let data = {};
    try { data = typeof row.data === 'string' ? JSON.parse(row.data || '{}') : (row.data || {}); } catch (e) { data = {}; }
    if (patch && patch.name) { data.identity = data.identity || {}; data.identity.name = patch.name; row.charName = patch.name; }
    if (patch && patch.portrait !== undefined) { data.portrait = patch.portrait; }
    row.data = JSON.stringify(data);
    await wixData.save(COLLECTION, row, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});
