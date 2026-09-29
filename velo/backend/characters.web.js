// backend/characters.web.js
// Player-facing character IO for FellGlass. The Characters collection is admin-read,
// so the embed never queries it directly. Every read here strips the sealed past:
// loadCharacter returns only the sheet data. FateWell uses its own loremaster-gated
// reader to see the sealed past. Ownership is checked on every read and write.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { uploadRune } from 'backend/loreforge.web.js';
import { currentMember, members } from 'wix-members-backend';
import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';

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
  await rowAdventureIntoData(r, data);
  return { forged: false, character: data };  // sealed past intentionally absent
});
// The row's campaignId is the truth about which adventure a Fell is in. A Fell attached
// through an invite, or forged into one, had the row set and the sheet's record not, so its
// Lore tab read No adventure. Loading carries the row's adventure into the record the sheet
// reads; the next save writes it back.
async function rowAdventureIntoData(r, data) {
  if (!r || !data) return;
  const cid = r.campaignId || '';
  data.identity = data.identity || {};
  // unlinked or removed: the record forgets the adventure the row no longer names
  if (!cid) { if (data.identity.campaignId || data.identity.campaign) { data.identity.campaignId = ''; data.identity.campaign = ''; } return; }
  if (data.identity.campaignId === cid && data.identity.campaign) return;
  let name = r.campaign || '';
  if (!name) { try { const c = await wixData.get('Campaigns', cid, { suppressAuth: true }); if (c && c.name) name = c.name; } catch (e) {} }
  data.identity.campaignId = cid;
  data.identity.campaign = name || data.identity.campaign || '';
}

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
  // A Fell's talents are the talents of every skill it has put a Mastery point into, named
  // from the Talents collection (the sheet never stored them as a list).
  let talents = [];
  try {
    const mastered = Object.keys(data.skills || {}).filter((k) => data.skills[k] && Number(data.skills[k].mastery) > 0);
    if (mastered.length) {
      const rt = await wixData.query('Talents').hasSome('skill', mastered).limit(50).find({ suppressAuth: true });
      talents = rt.items.map((t) => t.name).filter(Boolean);
    }
  } catch (e) { talents = []; }
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
    // what the table's fog needs to know of how this Fell sees: Echosight sees through
    // darkness and concealment, Ever-Watchful always perceives the Obscured and hidden
    senses: {
      echosight: ((data.armor && data.armor.augs) || []).indexOf('Echosight') >= 0,
      everWatchful: talents.indexOf('Ever-Watchful') >= 0
    },
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

// A portrait used to be baked into the record as a data url: a wall of encoded bytes,
// too heavy to share with the table and unable to travel to another device at all. It
// is uploaded once to stored media and kept as a plain address from then on, the same
// as every other picture in the forge already is. Runs on save, so a portrait converts
// the first time its Fell is saved and is never carried as bytes again.
function toHttpsImage(u) {
  if (typeof u !== 'string') return '';
  const m = u.match(/^wix:image:\/\/v1\/([^/]+)/);
  if (m) return 'https://static.wixstatic.com/media/' + m[1];
  return u;
}
async function storePortrait(character) {
  try {
    const idn = (character && character.identity) || {};
    const p = (character && character.portrait) || idn.portrait || '';
    if (typeof p !== 'string' || p.indexOf('data:') !== 0) return character;
    const comma = p.indexOf(',');
    const b64 = comma >= 0 ? p.slice(comma + 1) : '';
    if (!b64) return character;
    const ref = await uploadRune(b64, 'fell-portrait-' + Date.now());
    const url = toHttpsImage(ref);
    if (!url) return character;
    if (character.portrait !== undefined) character.portrait = url;
    if (character.identity) character.identity.image = url;
    return character;
  } catch (e) { return character; }
}

// ---- things the LoreMaster gives a Fell ----
// A clue, quest, secret or note handed out from ThreadSpire's scene runner lands in the
// Fell's data.given. The player's open sheet may still hold an older copy of the Fell,
// and its next autosave writes the whole record, which would quietly drop anything given
// in between. So every save keeps what is already given on the row, adds anything new it
// carries, and drops only what someone dismissed (data.givenGone, kept as a tombstone
// list so a dismissal also survives a stale save).
function parseData(row) { try { return row && row.data ? JSON.parse(row.data) : {}; } catch (e) { return {}; } }
function mergeGiven(prev, next) {
  const gone = Array.from(new Set([].concat((prev && prev.givenGone) || [], (next && next.givenGone) || []))).slice(-500);
  const out = [], seen = {};
  [].concat((prev && prev.given) || [], (next && next.given) || []).forEach((g) => {
    if (!g || !g.id || seen[g.id] || gone.indexOf(g.id) >= 0) return;
    seen[g.id] = true; out.push(g);
  });
  next.given = out; next.givenGone = gone;
  return next;
}
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
  await storePortrait(c);
  if (charId) mergeGiven(parseData(row), c);
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

// ---- the Archive and the Sealed Past ----
// FellForge writes a Fell's description (Consult the Archive) and seals the buried truths
// of its forgotten life (the Sealed Past) for the LoreMaster. These two do the same for a
// Fell that was never forged, straight from the sheet. Same house style, same shapes.
const ARCHIVE_MODEL = 'claude-sonnet-4-6';
const ARCHIVE_SYSTEM = [
  'You write for LoreFell, a dark grounded weird-fantasy world.',
  'A Fell wakes with no memory of the life they lived before. The player knows only loose fragments.',
  'House style is strict. No em dashes. No en dashes. No semicolons. No ellipses. Short declarative sentences. State facts directly. Dark and grounded. Never whimsical, never hype, never a sales pitch.',
  'Return only a JSON object. No prose around it. No code fences.'
].join(' ');
async function archiveCall(prompt, maxTokens) {
  const key = await getSecret('ANTHROPIC_API_KEY');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: ARCHIVE_MODEL, max_tokens: maxTokens || 900, system: ARCHIVE_SYSTEM, messages: [{ role: 'user', content: prompt }] })
  });
  if (!res.ok) { const t = await res.text(); throw new Error('Archive call failed ' + res.status + ' ' + t.slice(0, 160)); }
  const data = await res.json();
  let t = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  try { return JSON.parse(t); } catch (e) { return {}; }
}
function fellFacts(c) {
  const f = c || {};
  const lines = [];
  if (f.name) lines.push('Name: ' + f.name);
  if (f.sex) lines.push('Sex: ' + f.sex);
  if (f.lineage) lines.push('Lineage: ' + f.lineage + (f.lineageDesc ? ' (' + f.lineageDesc + ')' : ''));
  if (f.origin) lines.push('Origin: ' + f.origin);
  if (f.motivation) lines.push('Motivation: ' + f.motivation);
  if (f.level) lines.push('Level: ' + f.level);
  if (f.titles) lines.push('Titles: ' + f.titles);
  if (f.hooks) lines.push('Roleplaying hooks:\n' + f.hooks);
  if (f.fragments) lines.push('Forgotten fragments:\n' + f.fragments);
  if (f.desc) lines.push('What is written of them now: ' + f.desc);
  return lines.join('\n');
}

// Consult the Archive: a two or three sentence description of who this Fell is now. Any
// signed-in member may ask, for the Fell in front of them; nothing is saved here, the sheet
// keeps the answer the way it keeps anything the player writes.
export const consultArchive = webMethod(Permissions.Anyone, async (fell) => {
  const me = await memberId();
  if (!me) return { ok: false, error: 'not signed in' };
  try {
    const o = await archiveCall([
      'Write the Archive entry for this Fell, freshly woken with no memory of the life before.',
      fellFacts(fell),
      '',
      'Return JSON with exactly these keys:',
      '"description": two or three sentences on who this Fell is now, awake without memory, written in second person.',
      '"firstImpression": one or two sentences on how strangers read them at a glance.',
      '"tips": an array of three short second-person lines on how to play them.',
      (fell && fell.fragments) ? '"fragments": an empty array, since this Fell already holds its fragments.'
        : '"fragments": an array of three objects, each {"type": one word such as Scent, Sound, Name, Scar, Object, Place, "text": a short concrete half-memory from the forgotten life}.'
    ].join('\n'), 1100);
    const d = String((o && o.description) || '').trim();
    if (!d) return { ok: false, error: 'the Archive gave no answer' };
    const tips = Array.isArray(o.tips) ? o.tips.map((x) => String(x).trim()).filter(Boolean).slice(0, 5) : [];
    const frags = Array.isArray(o.fragments) ? o.fragments.filter((x) => x && (x.text || typeof x === 'string')).slice(0, 5) : [];
    return { ok: true, description: d, firstImpression: String(o.firstImpression || '').trim(), tips: tips, fragments: frags };
  } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
});

// The Sealed Past and the LoreMaster's notes are the LoreMaster's alone. The player owns the
// Fell, so owning it is deliberately not enough, and a lorekeeper who helps run the table is
// not the LoreMaster either: only the adventure's owner, or a member made its loremaster, may
// read or write them. Both live in the row's sealedPast field, which no other read returns.
async function sealGate(charId) {
  const me = await memberId();
  if (!me) return { ok: false, error: 'not signed in' };
  const row = await wixData.get(COLLECTION, charId, { suppressAuth: true }).catch(() => null);
  if (!row) return { ok: false, error: 'not found' };
  const cid = row.campaignId || '';
  if (!cid) return { ok: false, error: 'that Fell is not in an adventure' };
  try {
    const camp = await wixData.get('Campaigns', cid, { suppressAuth: true }).catch(() => null);
    if (camp && camp.ownerMemberId === me) return { ok: true, row: row };
  } catch (e) {}
  try {
    const r = await wixData.query('AdventureMembers').eq('campaignId', cid).eq('memberId', me).limit(1).find({ suppressAuth: true });
    const role = r.items.length ? r.items[0].role : '';
    if (role === 'loremaster') return { ok: true, row: row };
  } catch (e) {}
  return { ok: false, forbidden: true, error: 'for the LoreMaster only' };
}
function readSealed(row) {
  let s = {}; try { s = row.sealedPast ? JSON.parse(row.sealedPast) : {}; } catch (e) { s = {}; }
  return { code: row.sealCode || '', reveals: Array.isArray(s.reveals) ? s.reveals : [], fragments: Array.isArray(s.fragments) ? s.fragments : [], notes: typeof s.lmNotes === 'string' ? s.lmNotes : '' };
}
export const lmSealedGet = webMethod(Permissions.Anyone, async (charId) => {
  if (!charId) return { ok: false, error: 'no Fell given' };
  const gate = await sealGate(charId);
  if (!gate.ok) return gate;
  return Object.assign({ ok: true }, readSealed(gate.row));
});
// Weave a Sealed Past for a Fell that has none, or anew. The fragments FellForge rolled are
// kept; the reveals are written from everything the sheet knows of the Fell.
export const lmSealedWeave = webMethod(Permissions.Anyone, async (charId) => {
  if (!charId) return { ok: false, error: 'no Fell given' };
  const gate = await sealGate(charId);
  if (!gate.ok) return gate;
  const row = gate.row;
  const had = readSealed(row);
  let data = {}; try { data = row.data ? JSON.parse(row.data) : {}; } catch (e) { data = {}; }
  let seed = {}; try { seed = row.forgeSeed ? JSON.parse(row.forgeSeed) : {}; } catch (e) { seed = {}; }
  const id = data.identity || {};
  const fell = {
    name: id.name || row.charName || '', sex: (seed.identity && seed.identity.sex) || '',
    lineage: id.lineage || '', lineageDesc: id.lineageDesc || '', origin: id.origin || '', motivation: id.motivation || '',
    level: (data.lore && data.lore.level) || row.level || 1, titles: (data.titles || []).join(', '),
    hooks: seed.hooks || '', desc: id.desc || '',
    fragments: had.fragments.length ? had.fragments.map((f) => (f.type ? f.type + ': ' : '') + (f.text || f)).join('\n') : (seed.fragments || '')
  };
  try {
    const o = await archiveCall([
      'Seal the forgotten past of this Fell for the LoreMaster.',
      fellFacts(fell),
      '',
      'Return JSON with exactly this key:',
      '"reveals": an array of three to five lines for the LoreMaster only. Each names one buried truth of the forgotten past that the facts point toward. The player must never be told these. Keep each one usable as plot, not a riddle.'
    ].join('\n'), 900);
    const reveals = Array.isArray(o && o.reveals) ? o.reveals.map((x) => String(x).trim()).filter(Boolean).slice(0, 6) : [];
    if (!reveals.length) return { ok: false, error: 'the seal would not hold' };
    const code = row.sealCode || ('S-' + Math.random().toString(36).slice(2, 6).toUpperCase());
    row.sealCode = code;
    row.sealedPast = JSON.stringify({ reveals: reveals, fragments: had.fragments, lmNotes: had.notes });
    await wixData.save(COLLECTION, row, { suppressAuth: true });
    return { ok: true, code: code, reveals: reveals, fragments: had.fragments, notes: had.notes };
  } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
});

// The LoreMaster's notes on a Fell: how they mean to handle the player and its lore. Kept
// beside the Sealed Past, behind the same gate, so a weave never touches them.
export const lmNotesSave = webMethod(Permissions.Anyone, async (charId, text) => {
  if (!charId) return { ok: false, error: 'no Fell given' };
  const gate = await sealGate(charId);
  if (!gate.ok) return gate;
  const row = gate.row;
  const had = readSealed(row);
  row.sealedPast = JSON.stringify({ reveals: had.reveals, fragments: had.fragments, lmNotes: String(text || '').slice(0, 20000) });
  try { await wixData.save(COLLECTION, row, { suppressAuth: true }); return { ok: true }; }
  catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
});

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
export const lmCreateOfflineFell = webMethod(Permissions.Anyone, async (campaignId, name, level, maxVit) => {
  if (!campaignId) return { ok: false, error: 'no adventure' };
  if (!(await lmMayRun(campaignId))) return { ok: false, error: 'not your adventure' };
  const nm = String(name || '').trim().slice(0, 80) || 'Unnamed Fell';
  const lvl = Number(level) || 1;
  const mv = Number(maxVit) || 0;
  // The same fields the roster reads for any Fell, so one of these reads identically in
  // FateWell and at the table: level from lore, vitality from its own place.
  // Thin is not the same as blank. A sheet without attributes is a sheet the reader
  // reaches into and finds nothing, so the shape is written out even where it is empty.
  const data = {
    offline: true,
    identity: { name: nm, campaignId: campaignId, desc: '', lineage: '', origin: '', motivation: '' },
    grants: { skills: {}, attrs: {} },
    created: false,
    portrait: '',
    titles: [],
    attrs: {},
    lore: { level: lvl, lorePoints: 0, skyvaultShards: 0, paragonPoints: 0 },
    vitality: { max: mv, current: mv, temp: 0 },
    aurum: { oro: 0, arca: 0, atla: 0, zurith: 0 },
    fatigue: 0, mobility: 5, charge: 0,
    skills: {}, weapons: [],
    armor: { level: 0, augs: [null, null], active: null },
    lorebounds: [], inventory: [], afflictions: [], impairments: [],
    effects: [], boons: [], banes: [],
    records: { quests: [], characters: [], notes: [] }
  };
  try {
    const saved = await wixData.insert(COLLECTION, {
      ownerMemberId: '', charName: nm, level: lvl,
      campaignId: campaignId, data: JSON.stringify(data)
    }, { suppressAuth: true });
    return { ok: true, id: saved._id, name: nm };
  } catch (e) { return { ok: false, error: (e && e.message) ? e.message : String(e) }; }
});

// Change one of the table's own Fell. Only a Fell nobody owns can be edited this way:
// a player's Fell is theirs and goes through their own sheet.
export const lmSaveOfflineFell = webMethod(Permissions.Anyone, async (charId, patch) => {
  if (!charId) return { ok: false, error: 'no Fell given' };
  const row = await wixData.get(COLLECTION, charId, { suppressAuth: true }).catch(() => null);
  if (!row) return { ok: false, error: 'not found' };
  if (row.ownerMemberId) return { ok: false, error: 'that Fell belongs to a player' };
  if (!(await lmMayRun(row.campaignId))) return { ok: false, error: 'not your adventure' };
  const p = patch || {};
  let data = {};
  try { data = row.data ? JSON.parse(row.data) : {}; } catch (e) { data = {}; }
  if (p.name !== undefined) {
    const nm = String(p.name).trim().slice(0, 80) || 'Unnamed Fell';
    row.charName = nm;
    data.identity = data.identity || {};
    data.identity.name = nm;
  }
  if (p.level !== undefined) {
    const lvl = Number(p.level) || 1;
    row.level = lvl;
    data.lore = data.lore || {};
    data.lore.level = lvl;
  }
  if (p.maxVit !== undefined) {
    const mv = Number(p.maxVit) || 0;
    data.vitality = data.vitality || {};
    data.vitality.max = mv;
    if (!data.vitality.current) data.vitality.current = mv;
  }
  data.offline = true;
  row.data = JSON.stringify(data);
  try { await wixData.update(COLLECTION, row, { suppressAuth: true }); return { ok: true, id: charId }; }
  catch (e) { return { ok: false, error: (e && e.message) ? e.message : String(e) }; }
});

// Empty a Fell back to nothing but its name. For a sheet that was written over with
// another Fell's life, which is a thing that happened, and which nothing else can undo.
export const lmWipeFell = webMethod(Permissions.Anyone, async (charId) => {
  if (!charId) return { ok: false, error: 'no Fell given' };
  const row = await wixData.get(COLLECTION, charId, { suppressAuth: true }).catch(() => null);
  if (!row) return { ok: false, error: 'not found' };
  if (!(await lmMayRun(row.campaignId))) return { ok: false, error: 'not your adventure' };
  // Only a Fell the table keeps may be emptied: one with no player behind it, or held by the
  // adventure's own account. A player's Fell is theirs to rebuild.
  let kept = !row.ownerMemberId;
  if (!kept) {
    try { const camp = await wixData.get('Campaigns', row.campaignId, { suppressAuth: true }).catch(() => null); kept = !!(camp && camp.ownerMemberId && camp.ownerMemberId === row.ownerMemberId); } catch (e) {}
  }
  if (!kept) return { ok: false, error: "a player's Fell is theirs to start over" };
  let old = {};
  try { old = row.data ? JSON.parse(row.data) : {}; } catch (e) { old = {}; }
  const idn = old.identity || {};
  const data = {
    offline: !!old.offline,
    identity: { name: row.charName || idn.name || 'Unnamed Fell', campaignId: row.campaignId || '',
                campaign: row.campaign || '', desc: '', lineage: '', origin: '', motivation: '' },
    grants: { skills: {}, attrs: {} },
    created: false,
    portrait: '',
    titles: [],
    attrs: {},
    lore: { level: 1, lorePoints: 0, skyvaultShards: 0, paragonPoints: 0 },
    vitality: { max: 5, current: 5, temp: 0 },
    aurum: { oro: 0, arca: 0, atla: 0, zurith: 0 },
    fatigue: 0, mobility: 5, charge: 0,
    skills: {}, weapons: [],
    armor: { level: 0, augs: [null, null], active: null },
    lorebounds: [], inventory: [], afflictions: [], impairments: [],
    effects: [], boons: [], banes: [],
    records: { quests: [], characters: [], notes: [] }
  };
  row.level = 1;
  row.data = JSON.stringify(data);
  try { await wixData.update(COLLECTION, row, { suppressAuth: true }); return { ok: true }; }
  catch (e) { return { ok: false, error: (e && e.message) ? e.message : String(e) }; }
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
  await rowAdventureIntoData(r, data);
  return { forged: false, character: data };
});

export const lmSaveCharacter = webMethod(Permissions.Anyone, async (charId, character) => {
  if (!charId) return { ok: false, error: 'no Fell given' };
  const gate = await lmMayTouch(charId);
  if (!gate.ok) return { ok: false, error: gate.error };
  const row = gate.row;
  const c = character || {};
  await storePortrait(c);
  mergeGiven(parseData(row), c);
  row.data = JSON.stringify(c);
  row.charName = (c.identity && c.identity.name) || row.charName || 'Unnamed Fell';
  row.level = (c.lore && c.lore.level) || row.level || 1;
  // the owner and the adventure are the player's to change, never the LoreMaster's
  const saved = await wixData.save(COLLECTION, row, { suppressAuth: true });
  return { ok: true, id: saved._id };
});

// The LoreMaster gives one entry to each chosen Fell. Each Fell is checked on its own:
// only the LoreMaster of the adventure that Fell is in may write to it. Giving the same
// entry again replaces it, and brings it back if the player had dismissed it.
export const giveRecord = webMethod(Permissions.Anyone, async (charIds, entry) => {
  const e = entry || {};
  if (!Array.isArray(charIds) || !charIds.length || !e.id) return { ok: false, error: 'nothing to give', given: [] };
  const kinds = ['quests', 'characters', 'clues', 'secrets', 'notes'];
  const item = {
    id: String(e.id).slice(0, 120),
    kind: kinds.indexOf(e.kind) >= 0 ? e.kind : 'notes',
    title: String(e.title || '').slice(0, 300),
    body: String(e.body || '').slice(0, 4000),
    scene: String(e.scene || '').slice(0, 200),
    at: Date.now()
  };
  const given = [], refused = [];
  for (const cid of charIds) {
    try {
      const gate = await lmMayTouch(cid);
      if (!gate.ok) { refused.push(cid); continue; }
      const row = gate.row;
      const data = parseData(row);
      data.given = (data.given || []).filter((g) => g && g.id !== item.id).concat([item]);
      data.givenGone = (data.givenGone || []).filter((id) => id !== item.id);
      row.data = JSON.stringify(data);
      await wixData.save(COLLECTION, row, { suppressAuth: true });
      given.push(cid);
    } catch (err) { refused.push(cid); }
  }
  return { ok: given.length > 0, given: given, refused: refused };
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

// ---- dice ----
// What dice a player owns is worked out here, from their own Fells, so it cannot be claimed
// from the page: every lineage any of their Fells has taken, and the highest level any has
// reached (Resplendent at 10, Ascendent at 20, Transcendent at 30). Their choice of set per
// kind of roll is kept in DicePrefs, one row per member.
async function diceOwned(me) {
  const lineages = [], seen = {}; let maxLevel = 0;
  try {
    const rs = await wixData.query('Characters').eq('ownerMemberId', me).limit(200).find({ suppressAuth: true });
    rs.items.forEach((row) => {
      let data = {}; try { data = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}); } catch (e) { data = {}; }
      const lin = String((data.identity && data.identity.lineage) || '').trim();
      if (lin && !seen[lin.toLowerCase()]) { seen[lin.toLowerCase()] = 1; lineages.push(lin); }
      const lv = Math.max(Number(row.level) || 0, Number(data.lore && data.lore.level) || 0, Number(data.level) || 0);
      if (lv > maxLevel) maxLevel = lv;
    });
  } catch (e) {}
  return { lineages, maxLevel };
}
export const myDice = webMethod(Permissions.Anyone, async () => {
  const m = await currentMember.getMember().catch(() => null);
  if (!m || !m._id) return { ok: false, lineages: [], maxLevel: 0, picks: {} };
  const own = await diceOwned(m._id);
  let picks = {};
  try { const r = await wixData.query('DicePrefs').eq('memberId', m._id).limit(1).find({ suppressAuth: true }); if (r.items[0]) picks = JSON.parse(r.items[0].picks || '{}') || {}; } catch (e) { picks = {}; }
  return { ok: true, lineages: own.lineages, maxLevel: own.maxLevel, picks };
});
export const saveDicePicks = webMethod(Permissions.Anyone, async (picks) => {
  const m = await currentMember.getMember().catch(() => null);
  if (!m || !m._id) return { ok: false };
  const clean = {};
  ['attack', 'evade', 'skill', 'generic'].forEach((k) => { const v = picks && picks[k]; if (typeof v === 'string' && v.length < 60) clean[k] = v; });
  try {
    const r = await wixData.query('DicePrefs').eq('memberId', m._id).limit(1).find({ suppressAuth: true });
    if (r.items[0]) await wixData.update('DicePrefs', Object.assign({}, r.items[0], { picks: JSON.stringify(clean) }), { suppressAuth: true });
    else await wixData.insert('DicePrefs', { memberId: m._id, picks: JSON.stringify(clean) }, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});
