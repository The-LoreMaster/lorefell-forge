// backend/libraries.web.js
// Canon content libraries for FellGlass. The sheet ships placeholders and replaces
// each list only when real rows arrive, so collections can come online one at a time.
// Lineages, infusions, and augmentations are wired from their collections. Origins and
// motivations ship as canon inside the sheet and are overridden here only when their
// collections actually hold rows, so nothing breaks before they are filled in.
//
// The sheet drops any row whose attribute is not one of the eight it knows, so the
// attribute column must hold the lowercase id (precision, power, magic, vigor, wit,
// evasion, durability, resistance) rather than a display name.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';
import { ownerOf } from 'backend/sessionsCore.js';

async function callerId() {
  try { const m = await currentMember.getMember(); return (m && m._id) || ''; } catch (e) { return ''; }
}
// Who runs an adventure: its owner and anyone holding the loremaster role in it.
async function adventureLms(campaignId) {
  const cid = String(campaignId || '');
  if (!cid) return [];
  const out = {};
  try { const o = await ownerOf(cid); if (o && o.owner) out[o.owner] = 1; } catch (e) {}
  try {
    const r = await wixData.query('AdventureMembers').eq('campaignId', cid).eq('role', 'loremaster').limit(20).find({ suppressAuth: true });
    r.items.forEach((m) => { if (m.memberId) out[m.memberId] = 1; });
  } catch (e) {}
  return Object.keys(out);
}
const FORGED_KEYS = ['sigilforge', 'shardforge', 'bondforge', 'brandforge'];
// What the forges made that this caller may see: everything in the vote or voted canon, plus
// the caller's own work and the work of the adventure's LoreMaster, private included.
async function forgedRows(me, lms) {
  const rows = [], seen = {};
  const take = (items) => (items || []).forEach((it) => { if (it && it._id && !seen[it._id]) { seen[it._id] = 1; rows.push(it); } });
  try {
    const r = await wixData.query('Creations').hasSome('forgeKey', FORGED_KEYS).hasSome('canonStatus', ['submitted', 'canon'])
      .descending('_createdDate').limit(1000).find({ suppressAuth: true });
    take(r.items);
  } catch (e) {}
  const who = Array.from(new Set([me].concat(lms || []).filter(Boolean)));
  for (const id of who) {
    try {
      const r = await wixData.query('Creations').hasSome('forgeKey', FORGED_KEYS).eq('creatorMemberId', id)
        .descending('_createdDate').limit(500).find({ suppressAuth: true });
      take(r.items);
    } catch (e) {}
  }
  return rows;
}

// One Creations row as the sheet reads it, and which list it belongs on.
function shapeForged(it, me) {
  let pl = {};
  try { pl = typeof it.payload === 'string' ? JSON.parse(it.payload) : (it.payload || {}); } catch (e) { pl = {}; }
  const m = pl.meta || {};
  const name = String(it.creationName || pl.title || '').trim();
  if (!name) return null;
  const base = { id: it._id, name: name, by: it.creatorName || m.creator || '', canon: it.canonStatus === 'canon',
    status: it.canonStatus || '', mine: !!me && it.creatorMemberId === me };
  const text = it.shorthand || it.fullText || '';
  if (it.forgeKey === 'sigilforge') {
    if (pl.mode === 'monster' || pl.kind === 'foe' || it.kind === 'foe') return null;
    const item = m.item || m.weapon || m.focus || '';
    if (!item) return null;
    return { bucket: 'abilities', entry: Object.assign(base, { item: item, tier: Number(pl.tier) || 1, type: m.type || 'Ability', desc: text }) };
  }
  if (it.forgeKey === 'shardforge') {
    const side = String(it.kind || pl.kind || m.side || '') === 'augmentation' ? 'augmentation' : 'infusion';
    if (side === 'augmentation') return { bucket: 'augmentations', entry: Object.assign(base, { category: m.category || '', desc: text }) };
    return { bucket: 'infusions', entry: Object.assign(base, { weaponCat: String(m.category || '').toLowerCase(), desc: text }) };
  }
  if (it.forgeKey === 'bondforge') {
    return { bucket: 'lorebounds', entry: Object.assign(base, { world: m.world || '', aspectName: m.aspectName || '', initial: m.initial || '', desc: m.initial || text,
      branches: Array.isArray(m.branches) ? m.branches : [], crowns: Array.isArray(m.crowns) ? m.crowns : [] }) };
  }
  if (it.forgeKey === 'brandforge' && (m.kind || pl.kind) === 'lineage') {
    return { bucket: 'lineages', entry: Object.assign(base, { desc: m.body || it.fullText || '', bonusType: m.bonusType || '', bonusValue: m.bonusValue || '' }) };
  }
  return null;
}
// The creations the adventure's LoreMaster assigned to it, kept on its Campaigns row.
async function assignedOf(campaignId) {
  try {
    const c = await wixData.get('Campaigns', String(campaignId), { suppressAuth: true });
    return Array.isArray(c && c.forgedIds) ? c.forgedIds.map(String) : [];
  } catch (e) { return []; }
}
async function rowsById(ids) {
  if (!ids || !ids.length) return [];
  try {
    const r = await wixData.query('Creations').hasSome('_id', ids.slice(0, 500)).limit(500).find({ suppressAuth: true });
    return r.items;
  } catch (e) { return []; }
}

export const getLibraries = webMethod(Permissions.Anyone, async (opts) => {
  const out = {};
  try {
    const r = await wixData.query('Lineages')
      .ascending('displayOrder').limit(200).find({ suppressAuth: true });
    const lineages = r.items.map((it) => ({
      name: it.name || '',
      description: it.body || '',
      bonusType: it.bonusType || 'skill',
      bonusName: it.bonusValue || ''
    })).filter((l) => l.name);
    if (lineages.length) out.lineages = lineages;
  } catch (e) {}

  // Origins. The sheet already carries the eight as canon, so an empty or missing
  // collection leaves those standing rather than emptying the dropdown.
  try {
    const ro = await wixData.query('Origins')
      .ascending('displayOrder').limit(200).find({ suppressAuth: true });
    const origins = ro.items.map((it) => ({
      name: it.name || '',
      attr: String(it.attribute || it.attr || '').trim().toLowerCase(),
      description: it.body || it.description || ''
    })).filter((o) => o.name && o.attr);
    if (origins.length) out.origins = origins;
  } catch (e) {}

  // Motivations. titleEarned is the Title the vow pays out when its three skills are
  // walked to four masteries each.
  try {
    const rmo = await wixData.query('Motivations')
      .ascending('displayOrder').limit(200).find({ suppressAuth: true });
    const motivations = rmo.items.map((it) => ({
      name: it.name || '',
      attr: String(it.attribute || it.attr || '').trim().toLowerCase(),
      titleEarned: it.titleEarned || it.title || ''
    })).filter((m) => m.name && m.attr);
    if (motivations.length) out.motivations = motivations;
  } catch (e) {}

  // Infusions and augmentations, sent as components so the sheet's existing loader maps
  // them by kind. Infusion attribute is the weapon category it belongs to.
  const components = [];
  try {
    const ri = await wixData.query('Infusions').ascending('displayOrder').limit(300).find({ suppressAuth: true });
    ri.items.forEach((it) => {
      if (it.name) components.push({ kind: 'infusion', name: it.name, description: it.effect || '', use: 'Passive', weaponCat: it.attribute || '', category: it.attribute || '' });
    });
  } catch (e) {}
  try {
    const ra = await wixData.query('Augmentations').ascending('displayOrder').limit(300).find({ suppressAuth: true });
    ra.items.forEach((it) => {
      if (it.name) components.push({ kind: 'augmentation', name: it.name, description: it.effect || '', use: 'Passive', category: it.domain || '' });
    });
  } catch (e) {}
  if (components.length) out.components = components;

  // Utilities: the shelf the RelicForge fills, read from the utilities table (stored as Relics). The sheet had four placeholders written into
  // it, so a Fell could carry nothing that actually exists in the game.
  try {
    const ru = await wixData.query('Relics').ascending('displayOrder').limit(500).find({ suppressAuth: true });
    const utilities = ru.items.map((it) => ({
      id: it._id,
      name: it.name || '',
      use: it.use || 'Out of Combat',
      description: it.description || '',
      veiled: it.veiled || '',
      group: it.group || '',
      rarity: it.rarity || '',
      uses: it.uses || ''
    })).filter((u) => u.name);
    if (utilities.length) out.utilities = utilities;
  } catch (e) {}

  // Talents, one per skill, granted by its first Mastery point.
  try {
    const rt = await wixData.query('Talents').ascending('displayOrder').limit(100).find({ suppressAuth: true });
    const talents = rt.items.map((it) => ({ name: it.name || '', skill: it.skill || '', attribute: it.attribute || '', effect: it.effect || '' })).filter((t) => t.name && t.skill);
    if (talents.length) out.talents = talents;
  } catch (e) {}

  // Weapon abilities and spells, by tree, form and tier, from the FellGuide.
  try {
    const rw2 = await wixData.query('WeaponAbilities').ascending('displayOrder').limit(200).find({ suppressAuth: true });
    const wab = rw2.items.map((it) => ({ name: it.name || '', tree: it.tree || '', form: it.form || '', tier: Number(it.tier) || 1,
      shorthand: it.shorthand || '', description: it.description || '' })).filter((a) => a.name && a.tree);
    if (wab.length) out.weaponAbilities = wab;
  } catch (e) {}

  // The weapon trees. Each form carries its own Fellmark Affliction, its grip, and its range,
  // so the sheet reads three of each rather than one for the whole tree.
  try {
    const rw = await wixData.query('CanonWeapons').ascending('displayOrder').limit(50).find({ suppressAuth: true });
    const weapons = rw.items.map((it) => ({
      tree: it.tree || '',
      category: it.category || '',
      formOne: it.formOne || '', formTwo: it.formTwo || '', formThree: it.formThree || '',
      afflictionOne: it.afflictionOne || '', afflictionTwo: it.afflictionTwo || '', afflictionThree: it.afflictionThree || '',
      gripOne: it.gripOne, gripTwo: it.gripTwo, gripThree: it.gripThree,
      rangeOne: it.rangeOne, rangeTwo: it.rangeTwo, rangeThree: it.rangeThree
    })).filter((w) => w.tree);
    if (weapons.length) out.weapons = weapons;
  } catch (e) {}

  // What the forges made: SigilForge abilities and spells, ShardForge infusions and
  // augmentations, BondForge lorebounds and BrandForge lineages. Nothing forged reaches a
  // player unless the adventure's LoreMaster assigned it to that adventure, and what is
  // assigned is theirs to take (marked adv). The LoreMaster sees everything they may assign,
  // their own private work included (Nate, 2026-10-13).
  try {
    const cid = (opts && opts.campaignId) || '';
    const me = await callerId();
    const lms = await adventureLms(cid);
    const assigned = cid ? await assignedOf(cid) : [];
    const isLm = !!me && lms.indexOf(me) >= 0;
    const items = isLm ? await forgedRows(me, lms) : await rowsById(assigned);
    const forged = { abilities: [], infusions: [], augmentations: [], lorebounds: [], lineages: [] };
    items.forEach((it) => {
      const sh = shapeForged(it, me);
      if (!sh || !forged[sh.bucket]) return;
      sh.entry.adv = assigned.indexOf(String(it._id)) >= 0;
      forged[sh.bucket].push(sh.entry);
    });
    out.forged = forged;
  } catch (e) {}

  return out;
});

// The worlds a LoreMaster may set an adventure in, beyond the canon list: the ones they made
// in the BrandForge (any status) and any voted canon (Nate, 2026-10-13).
export const myForgedWorlds = webMethod(Permissions.Anyone, async () => {
  const me = await callerId();
  const out = [], seen = {};
  const add = (it) => {
    if (!it || seen[it._id]) return;
    let pl = {}; try { pl = typeof it.payload === 'string' ? JSON.parse(it.payload) : (it.payload || {}); } catch (e) { pl = {}; }
    const m = pl.meta || {};
    if ((m.kind || pl.kind) !== 'world') return;
    const name = String(it.creationName || pl.title || '').trim(); if (!name) return;
    seen[it._id] = 1;
    out.push({ id: 'forged:' + it._id, name: name, desc: m.overview || it.shorthand || '', mine: !!me && it.creatorMemberId === me });
  };
  try { const r = await wixData.query('Creations').eq('forgeKey', 'brandforge').eq('canonStatus', 'canon').limit(200).find({ suppressAuth: true }); r.items.forEach(add); } catch (e) {}
  if (me) { try { const r = await wixData.query('Creations').eq('forgeKey', 'brandforge').eq('creatorMemberId', me).limit(200).find({ suppressAuth: true }); r.items.forEach(add); } catch (e) {} }
  return out;
});

// The LoreMaster's shelf for one adventure: everything they may assign (the vote, canon, and
// their own work, private included) and what is assigned now. Refused to anyone else.
export const adventureForgedList = webMethod(Permissions.Anyone, async (campaignId) => {
  const cid = String(campaignId || '');
  const me = await callerId();
  const lms = await adventureLms(cid);
  if (!cid || !me || lms.indexOf(me) < 0) return { ok: false, error: 'Only this adventure\u2019s LoreMaster can choose its forged picks.' };
  const items = [];
  (await forgedRows(me, lms)).forEach((it) => {
    const sh = shapeForged(it, me);
    if (sh) items.push(Object.assign({ kind: sh.bucket }, sh.entry));
  });
  return { ok: true, assigned: await assignedOf(cid), items: items };
});

export const setAdventureForged = webMethod(Permissions.Anyone, async (campaignId, ids) => {
  const cid = String(campaignId || '');
  const me = await callerId();
  const lms = await adventureLms(cid);
  if (!cid || !me || lms.indexOf(me) < 0) return { ok: false, error: 'Only this adventure\u2019s LoreMaster can choose its forged picks.' };
  let row = null;
  try { row = await wixData.get('Campaigns', cid, { suppressAuth: true }); } catch (e) { row = null; }
  if (!row) return { ok: false, error: 'This adventure has no saved record yet. Save it once, then try again.' };
  row.forgedIds = Array.from(new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean))).slice(0, 500);
  try { await wixData.update('Campaigns', row, { suppressAuth: true }); } catch (e) { return { ok: false, error: 'That did not save. Try again.' }; }
  return { ok: true, assigned: row.forgedIds };
});
