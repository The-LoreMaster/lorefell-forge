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
  let role = 'loremaster';
  if (r.ownerMemberId && id && r.ownerMemberId !== id) {
    role = await roleFor(id, campaignId, r.ownerMemberId);
    if (role !== 'loremaster' && role !== 'lorekeeper') return null; // not a keeper of this adventure
  }
  let data = {}; try { data = r.data ? JSON.parse(r.data) : {}; } catch (e) { data = {}; }
  return { title: r.name || 'Campaign', data: data, role: role };
});

export const listMyCampaigns = webMethod(Permissions.Anyone, async () => {
  const id = await memberId();
  if (!id) return [];
  const out = []; const seen = {};
  try {
    const r = await wixData.query(COLLECTION).eq('ownerMemberId', id).limit(50).find({ suppressAuth: true });
    r.items.forEach((it) => {
      seen[it._id] = 1;
      let data = {}; try { data = it.data ? JSON.parse(it.data) : {}; } catch (e) { data = {}; }
      out.push({ id: it._id, name: it.name || 'Adventure', data: data, role: 'loremaster' });
    });
  } catch (e) {}
  try {
    const km = await wixData.query('AdventureMembers').eq('memberId', id).hasSome('role', ['loremaster', 'lorekeeper']).limit(100).find({ suppressAuth: true });
    for (const m of km.items) {
      if (!m.campaignId || seen[m.campaignId]) continue;
      const c = await wixData.get(COLLECTION, m.campaignId, { suppressAuth: true }).catch(() => null);
      if (!c) continue;
      seen[m.campaignId] = 1;
      let data = {}; try { data = c.data ? JSON.parse(c.data) : {}; } catch (e) { data = {}; }
      out.push({ id: c._id, name: c.name || 'Adventure', data: data, role: m.role || 'lorekeeper' });
    }
  } catch (e) {}
  return out;
});

export const saveCampaign = webMethod(Permissions.Anyone, async (campaignId, blob, title) => {
  try {
    const id = await memberId();
    // Never create an empty row. A save with no campaign id and no real campaign blob is a
    // stray autosave from the tool running outside a chosen adventure. Ignore it.
    const hasCampaign = !!(blob && (blob.campaign || blob.campaignGz));
    if (!campaignId && !hasCampaign) return { ok: false, skipped: true };

    let existing = null;
    if (campaignId) {
      existing = await wixData.get(COLLECTION, campaignId, { suppressAuth: true }).catch(() => null);
      if (existing && existing.ownerMemberId && id && existing.ownerMemberId !== id) {
        const r2 = await roleFor(id, campaignId, existing.ownerMemberId);
        if (r2 !== 'loremaster' && r2 !== 'lorekeeper') return { ok: false, error: 'owned by another member' };
      }
    }

    const row = existing || { ownerMemberId: id };
    if (campaignId && !existing) row._id = campaignId;
    if (blob && typeof blob.campaignGz === 'string') {
      // compressed payload from the tool: store the gzip wrapper as-is
      row.data = JSON.stringify({ campaignGz: blob.campaignGz });
      if (blob.name) row.name = blob.name;
    } else if (hasCampaign) {
      row.data = JSON.stringify(blob.campaign);
      if (blob.campaign.name) row.name = blob.campaign.name;
    }
    if (title) row.name = title;
    if (!row.name) row.name = 'Adventure';
    if (!row.ownerMemberId) row.ownerMemberId = id;

    const saved = existing
      ? await wixData.update(COLLECTION, row, { suppressAuth: true })
      : await wixData.insert(COLLECTION, row, { suppressAuth: true });
    return { ok: true, id: saved._id, owner: id };
  } catch (e) {
    // Surface the real cause to the caller instead of Velo's generic wrapper.
    return { ok: false, error: (e && e.message) ? e.message : String(e) };
  }
});


export const deleteCampaign = webMethod(Permissions.Anyone, async (campaignId) => {
  try {
    if (!campaignId) return { ok: false, error: 'no id' };
    const id = await memberId();
    const existing = await wixData.get(COLLECTION, campaignId, { suppressAuth: true }).catch(() => null);
    if (!existing) return { ok: true, id: campaignId, already: true };
    if (existing.ownerMemberId && id && existing.ownerMemberId !== id) {
      return { ok: false, error: 'owned by another member' };
    }
    await wixData.remove(COLLECTION, campaignId, { suppressAuth: true });
    return { ok: true, id: campaignId };
  } catch (e) {
    return { ok: false, error: (e && e.message) ? e.message : String(e) };
  }
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

// The adventures this member runs: ones they own, plus ones where their AdventureMembers
// role is loremaster or lorekeeper. Keeper powers are scoped to these, so a member can be
// the loremaster of one adventure and a plain player in another. The role query degrades
// to owner-only if the role field is not present yet.
async function keeperCampaignIds(id) {
  if (!id) return [];
  const set = {};
  try {
    const owned = await wixData.query(COLLECTION).eq('ownerMemberId', id).limit(200).find({ suppressAuth: true });
    owned.items.forEach((it) => { set[it._id] = 1; });
  } catch (e) {}
  try {
    const kept = await wixData.query('AdventureMembers').eq('memberId', id).hasSome('role', ['loremaster', 'lorekeeper']).limit(200).find({ suppressAuth: true });
    kept.items.forEach((m) => { if (m.campaignId) set[m.campaignId] = 1; });
  } catch (e) {}
  return Object.keys(set);
}

// One member's role in one adventure. Owner is always the loremaster.
async function roleFor(id, campaignId, ownerId) {
  if (ownerId && id && ownerId === id) return 'loremaster';
  try {
    const r = await wixData.query('AdventureMembers').eq('campaignId', campaignId).eq('memberId', id).limit(1).find({ suppressAuth: true });
    if (r.items.length && r.items[0].role) return r.items[0].role;
  } catch (e) {}
  return 'player';
}
async function upsertMemberRole(campaignId, mid, role) {
  try {
    const r = await wixData.query('AdventureMembers').eq('campaignId', campaignId).eq('memberId', mid).limit(1).find({ suppressAuth: true });
    if (r.items.length) { const row = r.items[0]; row.role = role; await wixData.update('AdventureMembers', row, { suppressAuth: true }); }
    else { await wixData.insert('AdventureMembers', { campaignId: campaignId, memberId: mid, role: role, status: 'member', joinedAt: new Date().toISOString() }, { suppressAuth: true }); }
  } catch (e) {}
}
export const myAdventureRole = webMethod(Permissions.Anyone, async (campaignId) => {
  const id = await memberId();
  if (!id || !campaignId) return '';
  const camp = await wixData.get(COLLECTION, campaignId, { suppressAuth: true }).catch(() => null);
  if (!camp) return '';
  return await roleFor(id, campaignId, camp.ownerMemberId);
});
// Only the loremaster (owner) sets roles. Loremaster is a handoff: the target becomes
// owner and the previous owner steps down to lorekeeper, so there is always exactly one.
export const setMemberRole = webMethod(Permissions.Anyone, async (campaignId, targetMemberId, role) => {
  const id = await memberId();
  if (!id || !campaignId || !targetMemberId) return { ok: false };
  const camp = await wixData.get(COLLECTION, campaignId, { suppressAuth: true }).catch(() => null);
  if (!camp) return { ok: false };
  if (camp.ownerMemberId !== id) return { ok: false, error: 'Only the loremaster can change roles.' };
  role = (['player', 'lorekeeper', 'loremaster'].indexOf(role) !== -1) ? role : 'player';
  if (role === 'loremaster') {
    if (targetMemberId === id) return { ok: true };
    camp.ownerMemberId = targetMemberId;
    try { await wixData.update(COLLECTION, camp, { suppressAuth: true }); } catch (e) { return { ok: false, error: 'transfer failed' }; }
    await upsertMemberRole(campaignId, targetMemberId, 'loremaster');
    await upsertMemberRole(campaignId, id, 'lorekeeper');
    return { ok: true, transferred: true };
  }
  await upsertMemberRole(campaignId, targetMemberId, role);
  return { ok: true };
});

// Sealed pasts for a campaign roster. Returns nothing unless the caller holds a
// loremaster or lorekeeper role, so the player view can never reach it. Matched to
// the roster by member id first, then by character name.
export const getSealed = webMethod(Permissions.Anyone, async (memberIds, names, charIds) => {
  const sealedCallerId = await memberId();
  const sealedKeeperCids = await keeperCampaignIds(sealedCallerId);
  if (!sealedKeeperCids.length) return [];
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
  return items.filter((it) => it.sealedPast && sealedKeeperCids.indexOf(it.campaignId || '') !== -1).map((it) => {
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

  // owner of this adventure is its loremaster
  let ownerId = '';
  try { if (cid) { const cc = await wixData.get(COLLECTION, cid, { suppressAuth: true }).catch(() => null); ownerId = (cc && cc.ownerMemberId) || ''; } } catch (e) {}

  // members who joined (so a member with no character yet still shows), with names and roles
  const nameOf = {}; const roleOf = {}; let members = [];
  try {
    if (cid) {
      const rm = await wixData.query('AdventureMembers').eq('campaignId', cid).limit(500).find({ suppressAuth: true });
      members = rm.items;
      members.forEach((m) => { if (m.memberId) { nameOf[m.memberId] = m.name || ''; if (m.role) roleOf[m.memberId] = m.role; } });
    }
  } catch (e) { members = []; }
  const roleAt = (mid) => (mid && ownerId && mid === ownerId) ? 'loremaster' : (roleOf[mid] || 'player');

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
    let lvl = 1, maxVit = 0;
    try {
      const dat = typeof it.data === 'string' ? JSON.parse(it.data) : (it.data || {});
      lvl = Number(dat.level || (dat.lore && dat.lore.level) || (dat.identity && dat.identity.level)) || 1;
      maxVit = Number(dat.vitality && dat.vitality.max) || 0;
    } catch (e) {}
    const mid = it.ownerMemberId || '';
    withChar[mid] = true;
    out.push({ id: mid, memberId: mid, memberName: nameOf[mid] || '', charId: it._id, name: it.charName || '', level: lvl, maxVit: maxVit, role: roleAt(mid) });
  });
  // joined members who have not attached a character yet
  members.forEach((m) => {
    if (m.memberId && !withChar[m.memberId]) {
      out.push({ id: m.memberId, memberId: m.memberId, memberName: m.name || '', charId: null, name: m.name || 'Player', level: 1, maxVit: 0, role: roleAt(m.memberId) });
    }
  });
  return out.filter((p) => p.name || p.charId);
});

// Unlink a character from its adventure. Loremaster and lorekeeper only, since this is
// the roster owner acting. A character holds one adventure at a time, so clearing the
// link frees it to join another.
export const detachCharacter = webMethod(Permissions.Anyone, async (charId) => {
  if (!charId) return { ok: false };
  const id = await memberId();
  const keeperCids = await keeperCampaignIds(id);
  try {
    const row = await wixData.get('Characters', charId, { suppressAuth: true });
    if (!row) return { ok: false };
    if (keeperCids.indexOf(row.campaignId || '') === -1) return { ok: false, error: 'not your adventure' };
    row.campaignId = ''; await wixData.update('Characters', row, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// ---- Reference feeds for the FateWell library ----

// Forged reference content the loremaster can pull up at the table. Sourced from canon
// SigilForge creations. Tier and use live in the creation payload; name and shorthand
// are the surfaced columns. Read only.
export const getForgeLibrary = webMethod(Permissions.Anyone, async () => {
  const mid = await memberId();
  let canon = [], mine = [];
  try {
    const r = await wixData.query('Creations')
      .eq('forgeKey', 'sigilforge').eq('canonStatus', 'canon')
      .limit(500).find({ suppressAuth: true });
    canon = r.items;
  } catch (e) { canon = []; }
  // The loremaster's own forged Acts are usable at their own table, canon or not.
  if (mid) {
    try {
      const r2 = await wixData.query('Creations')
        .eq('forgeKey', 'sigilforge').eq('creatorMemberId', mid).ne('canonStatus', 'canon')
        .limit(500).find({ suppressAuth: true });
      mine = r2.items;
    } catch (e) { mine = []; }
  }
  const shape = (it, source) => {
    let pl = {};
    try { pl = typeof it.payload === 'string' ? JSON.parse(it.payload) : (it.payload || {}); } catch (e) { pl = {}; }
    return {
      title: it.creationName || pl.name || '',
      tier: Number(pl.tier) || 1,
      use: pl.use || 'Act',
      shorthand: it.shorthand || pl.shorthand || '',
      effect: pl.full || pl.effect || it.shorthand || '',
      source: source
    };
  };
  return canon.map((it) => shape(it, 'canon'))
    .concat(mine.map((it) => shape(it, 'mine')))
    .filter((a) => a.title);
});

// An Act the loremaster forged at the table. It lands in Creations as their own private
// creation, so it is theirs on the next load and can be voted toward canon later. Written
// with suppressAuth after the fields are checked, the same shape SigilForge submits.
export const submitAct = webMethod(Permissions.SiteMember, async (act) => {
  const mid = await memberId();
  if (!mid) return { ok: false, error: 'not a member' };
  const name = String((act && act.name) || '').trim();
  if (!name) return { ok: false, error: 'an Act needs a name' };
  const tier = Math.min(3, Math.max(1, Number(act && act.tier) || 1));
  const effect = String((act && act.effect) || '').trim();
  try {
    const row = await wixData.insert('Creations', {
      forgeKey: 'sigilforge',
      creationName: name,
      creatorMemberId: mid,
      canonStatus: 'private',
      shorthand: effect,
      payload: JSON.stringify({ name: name, tier: tier, use: 'Act', full: effect, effect: effect })
    }, { suppressAuth: true });
    return { ok: true, id: row._id };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// An item the loremaster forged at the table, saved as their own creation.
export const submitItem = webMethod(Permissions.SiteMember, async (item) => {
  const mid = await memberId();
  if (!mid) return { ok: false, error: 'not a member' };
  const name = String((item && item.name) || '').trim();
  if (!name) return { ok: false, error: 'an item needs a name' };
  const rule = String((item && item.rule) || '').trim();
  try {
    const row = await wixData.insert('Creations', {
      forgeKey: 'itemforge',
      creationName: name,
      creatorMemberId: mid,
      canonStatus: 'private',
      shorthand: rule,
      payload: JSON.stringify({ name: name, rule: rule })
    }, { suppressAuth: true });
    return { ok: true, id: row._id };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// The pools a foe is built from. Canon lists live in the tool, so this returns only what the
// collections add on top: the loremaster's own forged infusions, augmentations, and items,
// plus any that reached canon. The tool merges these with its canon lists.
export const getForgePools = webMethod(Permissions.Anyone, async () => {
  const mid = await memberId();
  const out = { infusions: [], augmentations: [], items: [] };
  const KEYS = { shardforge: 'infusions', augmentforge: 'augmentations', itemforge: 'items' };
  for (const key of Object.keys(KEYS)) {
    const bucket = KEYS[key];
    let rows = [];
    try {
      const r = await wixData.query('Creations')
        .eq('forgeKey', key).eq('canonStatus', 'canon')
        .limit(500).find({ suppressAuth: true });
      rows = r.items;
    } catch (e) { rows = []; }
    if (mid) {
      try {
        const r2 = await wixData.query('Creations')
          .eq('forgeKey', key).eq('creatorMemberId', mid).ne('canonStatus', 'canon')
          .limit(500).find({ suppressAuth: true });
        rows = rows.concat(r2.items);
      } catch (e) {}
    }
    const seen = {};
    rows.forEach((it) => {
      let pl = {};
      try { pl = typeof it.payload === 'string' ? JSON.parse(it.payload) : (it.payload || {}); } catch (e) { pl = {}; }
      const name = it.creationName || pl.name || '';
      if (!name || seen[name]) return;
      seen[name] = 1;
      out[bucket].push({
        name: name,
        family: pl.family || '',
        rule: pl.rule || pl.full || it.shorthand || '',
        source: it.canonStatus === 'canon' ? 'canon' : 'mine'
      });
    });
  }
  return out;
});

// The loremaster's own asset library (monsters, npcs, items), owner scoped. The tool
// sends rows already shaped by assetToRow and parses the JSON fields back itself.
// Canon foes from the Pentifax, surfaced as read-only monster assets. FoeForge vitality
// is party scaled (APL x party x tier weight), so there is no fixed number to store here;
// the table value is left at zero for the loremaster to set for their party. Editing a
// canon foe in the tool forks a personal copy, which then shadows the canon entry.
const FOE_WEIGHT = { Minion: 1, Elite: 2, Champion: 3, Epic: 5, Forsaken: 8 };

// Map a Creations foe row to a FateWell monster asset. Handles both shapes:
// canon foes nest under payload.meta, private foes store the flat tool state.
// Acts carry their full text in `effect`; the signature affliction rides along
// so the foe card can quick-apply it. Source marks canon versus the loremaster's own.
function mapFoeRow(it, source) {
  let pl = {};
  try { pl = typeof it.payload === 'string' ? JSON.parse(it.payload) : (it.payload || {}); } catch (e) { pl = {}; }
  const m = (pl && pl.meta) || pl || {};
  const acts = Array.isArray(m.acts) ? m.acts : [];
  const prefix = source === 'mine' ? 'myfoe:' : 'foe:';
  return {
    assetId: prefix + (it._id || it.creationName || ''),
    type: 'monster',
    name: it.creationName || pl.title || pl.name || '',
    description: m.description || it.fullText || '',
    shatterRating: m.shatterRating || '',
    signatureAffliction: m.signatureAffliction || '',
    source: source,
    lp: 0, sp: 0, maxVit: 0,
    role: 'Foe',
    image: it.imageUrl || pl.imageUrl || pl.image || '',
    attrs: '{}',
    inventory: '[]',
    abilities: JSON.stringify(acts.map((a) => ({
      name: a.name, tier: a.tier,
      use: (a.cost != null && a.cost !== '' ? ('Cost ' + a.cost) : ''),
      desc: a.effect || a.text || a.fullText || ''
    }))),
    foeWeight: FOE_WEIGHT[m.shatterRating] || 0
  };
}

async function getCanonFoes() {
  let items = [];
  try {
    const r = await wixData.query('Creations')
      .eq('forgeKey', 'foeforge').eq('canonStatus', 'canon')
      .limit(200).find({ suppressAuth: true });
    items = r.items;
  } catch (e) { items = []; }
  return items.map((it) => mapFoeRow(it, 'canon')).filter((f) => f.name);
}

// The loremaster's own private foes (FoeForge saves under foeforge.private).
// Visible only to their creator, surfaced alongside canon with a 'mine' source tag.
async function getMyForgeFoes(mid) {
  if (!mid) return [];
  let items = [];
  try {
    const r = await wixData.query('Creations')
      .eq('forgeKey', 'foeforge.private').eq('creatorMemberId', mid)
      .limit(200).find({ suppressAuth: true });
    items = r.items;
  } catch (e) { items = []; }
  return items.map((it) => mapFoeRow(it, 'mine')).filter((f) => f.name);
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
  let canonFoes = [];
  try { canonFoes = await getCanonFoes(); } catch (e) { canonFoes = []; }
  let myFoes = [];
  try { myFoes = await getMyForgeFoes(mid); } catch (e) { myFoes = []; }
  const foes = canonFoes.concat(myFoes).filter((f) => !ownedIds[f.assetId]);
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


/* ===================== Clue cards =====================
   Clues discovered through lore checks are carded to specific characters and
   surfaced read-only on their FellGlass sheet, under Notes. Stored in the
   ClueCards collection. 'title' is a reserved Wix field id, so we use clueTitle. */
export const assignClue = webMethod(Permissions.Anyone, async (campaignId, charIds, clue) => {
  if (!Array.isArray(charIds) || !charIds.length) return { ok: false, count: 0 };
  const handle = String((clue && clue.handle) || '').toLowerCase();
  let n = 0;
  for (const cid of charIds) {
    if (!cid) continue;
    try {
      const ex = await wixData.query('ClueCards')
        .eq('charId', cid).eq('handle', handle).eq('campaignId', campaignId || '')
        .limit(1).find({ suppressAuth: true });
      const row = {
        campaignId: campaignId || '', charId: cid, handle: handle,
        clueTitle: (clue && clue.title) || '', clueBody: (clue && clue.body) || '',
        scene: (clue && clue.scene) || '', discoveredAt: Date.now()
      };
      if (ex.items.length) { row._id = ex.items[0]._id; await wixData.update('ClueCards', row, { suppressAuth: true }); }
      else { await wixData.insert('ClueCards', row, { suppressAuth: true }); }
      n++;
    } catch (e) {}
  }
  return { ok: true, count: n };
});
/* Quest board. The LoreMaster posts quest notes from FateWell, players read the
   campaign board in FellGlass. Upserts key on campaignId + entryId, updates carry
   the full record since a partial update replaces the row. */
export const upsertQuest = webMethod(Permissions.Anyone, async (campaignId, quest) => {
  if (!campaignId || !quest || !quest.entryId) return { ok: false };
  const ex = await wixData.query('QuestBoard')
    .eq('campaignId', campaignId).eq('entryId', quest.entryId)
    .limit(1).find({ suppressAuth: true });
  const row = {
    campaignId: campaignId, entryId: quest.entryId,
    questTitle: quest.title || '', questBody: quest.body || '',
    questStatus: quest.status || 'open',
    postedAt: (ex.items[0] && ex.items[0].postedAt) || Date.now()
  };
  try {
    if (ex.items.length) { await wixData.update('QuestBoard', Object.assign({}, ex.items[0], row), { suppressAuth: true }); }
    else { await wixData.insert('QuestBoard', row, { suppressAuth: true }); }
  } catch (e) { return { ok: false }; }
  return { ok: true };
});

export const listQuests = webMethod(Permissions.Anyone, async (campaignId) => {
  if (!campaignId) return { ok: true, quests: [] };
  try {
    const r = await wixData.query('QuestBoard').eq('campaignId', campaignId)
      .ne('questStatus', 'removed').ascending('postedAt').limit(50)
      .find({ suppressAuth: true });
    const quests = r.items.map(function (q) {
      return { entryId: q.entryId, title: q.questTitle || '', body: q.questBody || '', status: q.questStatus || 'open' };
    });
    return { ok: true, quests: quests };
  } catch (e) { return { ok: false, quests: [], error: 'The board could not be reached.' }; }
});

// ThreadSpire discovery. The LoreMaster reveals nodes to a campaign. Cascade is
// upward only: revealing a node reveals its ancestors, never its children, so a
// location never spoils its own scenarios. Ancestor ids are passed by the client
// which holds the graph; this method just writes the set it is given.
// World layer meta for ThreadSpire: is the world open to players, and what it faces.
// Both live inside the saved campaign blob; this reads them out without exposing the
// rest of the campaign.
export const getWorldMeta = webMethod(Permissions.Anyone, async (campaignId) => {
  if (!campaignId) return { ok: true, worldUnlocked: false, worldIssues: [] };
  try {
    const c = await wixData.get(COLLECTION, campaignId, { suppressAuth: true }).catch(() => null);
    if (!c) return { ok: true, worldUnlocked: false, worldIssues: [] };
    // data is the campaign object itself (saveCampaign stores blob.campaign)
    let unlocked = false, issues = [];
    if (c.data) {
      try {
        const camp = JSON.parse(c.data) || {};
        unlocked = !!camp.worldUnlocked;
        issues = Array.isArray(camp.worldIssues) ? camp.worldIssues : [];
      } catch (e) {}
    }
    return { ok: true, worldUnlocked: unlocked, worldIssues: issues };
  } catch (e) { return { ok: false, worldUnlocked: false, worldIssues: [] }; }
});

export const revealNodes = webMethod(Permissions.Anyone, async (campaignId, nodeIds) => {
  if (!campaignId || !Array.isArray(nodeIds) || !nodeIds.length) return { ok: false };
  try {
    const existing = await wixData.query('ThreadSpireDiscovery')
      .eq('campaignId', campaignId).limit(1000).find({ suppressAuth: true });
    const have = {};
    existing.items.forEach((r) => { have[r.nodeId] = true; });
    const inserts = [];
    nodeIds.forEach((nid) => { if (nid && !have[nid]) inserts.push({ campaignId: campaignId, nodeId: nid, revealedAt: Date.now() }); });
    for (const row of inserts) { await wixData.insert('ThreadSpireDiscovery', row, { suppressAuth: true }); }
    return { ok: true, added: inserts.length };
  } catch (e) { return { ok: false, error: 'The reveal could not be saved.' }; }
});

export const hideNode = webMethod(Permissions.Anyone, async (campaignId, nodeId) => {
  if (!campaignId || !nodeId) return { ok: false };
  try {
    const ex = await wixData.query('ThreadSpireDiscovery')
      .eq('campaignId', campaignId).eq('nodeId', nodeId).limit(1).find({ suppressAuth: true });
    if (ex.items.length) await wixData.remove('ThreadSpireDiscovery', ex.items[0]._id, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false }; }
});

export const listDiscovered = webMethod(Permissions.Anyone, async (campaignId) => {
  if (!campaignId) return { ok: true, nodes: [] };
  try {
    const r = await wixData.query('ThreadSpireDiscovery').eq('campaignId', campaignId)
      .limit(1000).find({ suppressAuth: true });
    return { ok: true, nodes: r.items.map((x) => x.nodeId) };
  } catch (e) { return { ok: false, nodes: [], error: 'The Sphere could not be reached.' }; }
});

export const getClueCards = webMethod(Permissions.Anyone, async (charId) => {
  if (!charId) return [];
  let items = [];
  try {
    const r = await wixData.query('ClueCards').eq('charId', charId)
      .descending('discoveredAt').limit(200).find({ suppressAuth: true });
    items = r.items;
  } catch (e) { items = []; }
  return items.map((it) => ({ handle: it.handle, title: it.clueTitle, body: it.clueBody, scene: it.scene, at: it.discoveredAt }));
});
