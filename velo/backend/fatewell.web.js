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
export const getSealed = webMethod(Permissions.Anyone, async (memberIds, names, charIds) => {
  if (!(await isKeeper())) return [];
  const ids = Array.isArray(memberIds) ? memberIds.filter(Boolean) : [];
  const nm = Array.isArray(names) ? names.filter(Boolean) : [];
  const cids = Array.isArray(charIds) ? charIds.filter(Boolean) : [];
  if (!ids.length && !nm.length && !cids.length) return [];
  let items = [];
  const seen = (it) => items.some((x) => x._id === it._id);
  try {
    if (cids.length) {
      const rc = await wixData.query('Characters').hasSome('_id', cids).limit(200).find({ suppressAuth: true });
      rc.items.forEach((it) => { if (!seen(it)) items.push(it); });
    }
    if (ids.length) {
      const r = await wixData.query('Characters').hasSome('ownerMemberId', ids).limit(200).find({ suppressAuth: true });
      r.items.forEach((it) => { if (!seen(it)) items.push(it); });
    }
    if (nm.length) {
      const rn = await wixData.query('Characters').hasSome('charName', nm).limit(200).find({ suppressAuth: true });
      rn.items.forEach((it) => { if (!seen(it)) items.push(it); });
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

// Roster for a campaign, drawn from characters whose campaign field matches the name.
// Carries charId so the tool can link a player to a character sheet precisely, which
// is what the sealed past match keys on first. Names and levels only, no sealed content.
export const getCampaignPlayers = webMethod(Permissions.Anyone, async (campaignId, campaignName) => {
  const cid = String(campaignId || '').trim();
  const nm = String(campaignName || '').trim();
  if (!cid && !nm) return [];

  // members who joined (so a member with no character yet still shows), with their names
  const nameOf = {}; let members = [];
  try {
    if (cid) {
      const rm = await wixData.query('AdventureMembers').eq('campaignId', cid).limit(500).find({ suppressAuth: true });
      members = rm.items;
      members.forEach((m) => { if (m.memberId) nameOf[m.memberId] = m.name || ''; });
    }
  } catch (e) { members = []; }

  // characters linked to this adventure, by id with a legacy name fallback
  let chars = [];
  try {
    if (cid) { const rc = await wixData.query('Characters').eq('campaignId', cid).limit(500).find({ suppressAuth: true }); chars = rc.items; }
    if (nm) {
      const rn = await wixData.query('Characters').eq('campaign', nm).limit(500).find({ suppressAuth: true });
      rn.items.forEach((it) => { if (!chars.some((x) => x._id === it._id)) chars.push(it); });
    }
  } catch (e) {}

  const out = [];
  const withChar = {};
  chars.forEach((it) => {
    let lvl = 1;
    try { const dat = typeof it.data === 'string' ? JSON.parse(it.data) : (it.data || {}); lvl = Number(dat.level || (dat.identity && dat.identity.level)) || 1; } catch (e) {}
    const mid = it.ownerMemberId || '';
    withChar[mid] = true;
    out.push({ id: mid, memberId: mid, memberName: nameOf[mid] || '', charId: it._id, name: it.charName || '', level: lvl });
  });
  // joined members who have not attached a character yet
  members.forEach((m) => {
    if (m.memberId && !withChar[m.memberId]) {
      out.push({ id: m.memberId, memberId: m.memberId, memberName: m.name || '', charId: null, name: m.name || 'Player', level: 1 });
    }
  });
  return out.filter((p) => p.name || p.charId);
});

// Unlink a character from its adventure. Loremaster and lorekeeper only, since this is
// the roster owner acting. A character holds one adventure at a time, so clearing the
// link frees it to join another.
export const detachCharacter = webMethod(Permissions.Anyone, async (charId) => {
  if (!(await isKeeper())) return { ok: false };
  if (!charId) return { ok: false };
  try {
    const row = await wixData.get('Characters', charId, { suppressAuth: true });
    if (row) { row.campaignId = ''; await wixData.update('Characters', row, { suppressAuth: true }); }
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// ---- Reference feeds for the FateWell library ----

// Forged reference content the loremaster can pull up at the table. Sourced from canon
// SigilForge creations. Tier and use live in the creation payload; name and shorthand
// are the surfaced columns. Read only.
export const getForgeLibrary = webMethod(Permissions.Anyone, async () => {
  let items = [];
  try {
    const r = await wixData.query('Creations')
      .eq('forgeKey', 'sigilforge').eq('canonStatus', 'canon')
      .limit(500).find({ suppressAuth: true });
    items = r.items;
  } catch (e) { items = []; }
  return items.map((it) => {
    let pl = {};
    try { pl = typeof it.payload === 'string' ? JSON.parse(it.payload) : (it.payload || {}); } catch (e) { pl = {}; }
    return {
      title: it.creationName || pl.name || '',
      tier: Number(pl.tier) || 1,
      use: pl.use || 'Act',
      shorthand: it.shorthand || pl.shorthand || ''
    };
  }).filter((a) => a.title);
});

// The loremaster's own asset library (monsters, npcs, items), owner scoped. The tool
// sends rows already shaped by assetToRow and parses the JSON fields back itself.
// Canon foes from the Pentifax, surfaced as read-only monster assets. FoeForge vitality
// is party scaled (APL x party x tier weight), so there is no fixed number to store here;
// the table value is left at zero for the loremaster to set for their party. Editing a
// canon foe in the tool forks a personal copy, which then shadows the canon entry.
const FOE_WEIGHT = { Minion: 1, Elite: 2, Champion: 3, Epic: 5, Forsaken: 8 };

async function getCanonFoes() {
  let items = [];
  try {
    const r = await wixData.query('Creations')
      .eq('forgeKey', 'foeforge').eq('canonStatus', 'canon')
      .limit(200).find({ suppressAuth: true });
    items = r.items;
  } catch (e) { items = []; }
  return items.map((it) => {
    let pl = {};
    try { pl = typeof it.payload === 'string' ? JSON.parse(it.payload) : (it.payload || {}); } catch (e) { pl = {}; }
    const meta = (pl && pl.meta) || {};
    const acts = Array.isArray(meta.acts) ? meta.acts : [];
    return {
      assetId: 'foe:' + (it._id || it.creationName || ''),
      type: 'monster',
      name: it.creationName || pl.title || '',
      description: meta.description || it.fullText || '',
      shatterRating: meta.shatterRating || '',
      lp: 0, sp: 0, maxVit: 0,
      role: 'Foe',
      image: it.imageUrl || pl.imageUrl || '',
      attrs: '{}',
      inventory: '[]',
      abilities: JSON.stringify(acts.map((a) => ({ name: a.name, tier: a.tier }))),
      foeWeight: FOE_WEIGHT[meta.shatterRating] || 0
    };
  }).filter((f) => f.name);
}

export const listAssets = webMethod(Permissions.Anyone, async () => {
  const mid = await memberId();
  let owned = [];
  if (mid) {
    try {
      const r = await wixData.query('Assets').eq('ownerMemberId', mid).limit(1000).find({ suppressAuth: true });
      owned = r.items;
    } catch (e) { owned = []; }
  }
  const ownedIds = {};
  owned.forEach((o) => { if (o.assetId) ownedIds[o.assetId] = true; });
  let foes = [];
  try { foes = await getCanonFoes(); } catch (e) { foes = []; }
  foes = foes.filter((f) => !ownedIds[f.assetId]);
  return owned.concat(foes);
});

export const saveAsset = webMethod(Permissions.Anyone, async (asset) => {
  const mid = await memberId(); if (!mid || !asset || !asset.assetId) return { ok: false };
  const row = Object.assign({}, asset, { ownerMemberId: mid });
  try {
    const ex = await wixData.query('Assets')
      .eq('ownerMemberId', mid).eq('assetId', String(asset.assetId))
      .limit(1).find({ suppressAuth: true });
    if (ex.items.length) {
      const merged = Object.assign({}, ex.items[0], row);
      const u = await wixData.update('Assets', merged, { suppressAuth: true });
      return { ok: true, id: u._id };
    }
    const ins = await wixData.insert('Assets', row, { suppressAuth: true });
    return { ok: true, id: ins._id };
  } catch (e) { return { ok: false, error: String(e) }; }
});

export const deleteAsset = webMethod(Permissions.Anyone, async (assetId) => {
  const mid = await memberId(); if (!mid || !assetId) return { ok: false };
  try {
    const ex = await wixData.query('Assets')
      .eq('ownerMemberId', mid).eq('assetId', String(assetId))
      .limit(1).find({ suppressAuth: true });
    if (ex.items.length) await wixData.remove('Assets', ex.items[0]._id, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Canon glossary terms, read by anyone. Empty until rows are added in the CMS.
export const listGlossary = webMethod(Permissions.Anyone, async () => {
  try {
    const r = await wixData.query('Glossary').ascending('displayOrder').limit(1000).find({ suppressAuth: true });
    return r.items.map((it) => ({
      id: it._id,
      term: it.term || '',
      type: it.type || '',
      description: it.description || '',
      aliases: it.aliases || ''
    })).filter((g) => g.term);
  } catch (e) { return []; }
});
