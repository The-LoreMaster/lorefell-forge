// backend/campaignview.web.js
// Shared table state for the ThreadSpire join. One row per campaign, a versioned snapshot
// the LoreMaster and their players read and write through these member-checked methods.
// The admin-locked collection is reached only here, never queried by an embed directly.
import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';
import { myAdventureRole } from 'backend/fatewell.web.js';
import { mediaManager } from 'wix-media-backend';

// Music at the table: the LoreMaster uploads an audio file they own (a song downloaded from
// Suno, say) into the site's Media Manager under LoreFell Music. Suno's own file addresses are
// signed and expire, so a copy on the site is what plays for everyone. A song is too big to
// pass through a backend call (Wix refuses it with 413), so the backend only asks Wix for an
// upload address and the browser sends the file there itself.
// kind 'sound' sends it to LoreFell Sounds (placed sounds and trigger sounds), else LoreFell Music
export const musicUploadUrl = webMethod(Permissions.Anyone, async (name, mime, kind) => {
  try {
    const m = await currentMember.getMember().catch(() => null);
    if (!m || !m._id) return { ok: false, error: 'sign in to upload music' };
    const type = String(mime || '');
    if (!/^audio\//i.test(type)) return { ok: false, error: 'that is not an audio file' };
    const fileName = String(name || 'track').replace(/[^\w .()-]+/g, '').slice(0, 120) || 'track';
    const r = await mediaManager.getUploadUrl(kind === 'sound' ? '/LoreFell Sounds' : '/LoreFell Music', {
      mediaOptions: { mimeType: type, mediaType: 'audio' },
      metadataOptions: { isPrivate: false, isVisitorUpload: false, fileName: fileName }
    });
    if (!r || !r.uploadUrl) return { ok: false, error: 'no upload address' };
    return { ok: true, uploadUrl: r.uploadUrl, uploadToken: r.uploadToken || '', fileName: fileName };
  } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
});

// A video map (MP4 or WebM), uploaded straight from the browser into Media Manager, LoreFell
// Maps, the way music is: members only, video only. The browser posts the file to the address.
export const mapVideoUploadUrl = webMethod(Permissions.Anyone, async (name, mime) => {
  try {
    const m = await currentMember.getMember().catch(() => null);
    if (!m || !m._id) return { ok: false, error: 'sign in to upload a map' };
    const type = String(mime || '');
    if (!/^video\/(mp4|webm)$/i.test(type)) return { ok: false, error: 'a video map must be an MP4 or WebM' };
    const fileName = String(name || 'map').replace(/[^\w .()-]+/g, '').slice(0, 120) || 'map';
    const r = await mediaManager.getUploadUrl('/LoreFell Maps', {
      mediaOptions: { mimeType: type, mediaType: 'video' },
      metadataOptions: { isPrivate: false, isVisitorUpload: false, fileName: fileName }
    });
    if (!r || !r.uploadUrl) return { ok: false, error: 'no upload address' };
    return { ok: true, uploadUrl: r.uploadUrl, uploadToken: r.uploadToken || '', fileName: fileName };
  } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
});

// TELEMETRY. The 2-second table-state poll runs through here, so this is the steady baseline
// of calls that everything else stacks on top of. Counting it shows how much quota the poll
// alone spends per minute, which matters because the quota is a per-minute budget.
let TELE_CV = null;
function cvTeleReset() { TELE_CV = { get: 0, query: 0, insert: 0, update: 0, remove: 0, total: 0, byColl: {} }; }
function cvTeleBump(op, coll) { if (!TELE_CV) return; TELE_CV[op] = (TELE_CV[op] || 0) + 1; TELE_CV.total++; TELE_CV.byColl[coll] = (TELE_CV.byColl[coll] || 0) + 1; }
const wd = {
  get: (c, id, o) => { cvTeleBump('get', c); return wixData.get(c, id, o); },
  insert: (c, r, o) => { cvTeleBump('insert', c); return wixData.insert(c, r, o); },
  update: (c, r, o) => { cvTeleBump('update', c); return wixData.update(c, r, o); },
  remove: (c, id, o) => { cvTeleBump('remove', c); return wixData.remove(c, id, o); },
  query: (c) => { cvTeleBump('query', c); return wixData.query(c); }
};

const CV = 'CampaignView';

async function memberId() {
  try { const m = await currentMember.getMember(); return m ? m._id : ''; }
  catch (e) { return ''; }
}

export const getCampaignState = webMethod(Permissions.Anyone, async (campaignId, since) => {
  cvTeleReset();
  const mid = await memberId(); if (!mid || !campaignId) return null;
  try {
    const r = await wd.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
    const row = r.items[0];
    // nothing stored yet is an answer of its own, not a failed read: a new adventure
    if (!row) return { version: 0, none: true, snap: null };
    if (typeof since === 'number' && (row.version || 0) <= since) return null;
    let snap = null; try { snap = JSON.parse(row.snapshot || 'null'); } catch (e) { snap = null; }
    return { version: row.version || 0, snap: snap, tele: TELE_CV };
  } catch (e) { return null; }
});

function mergeDraw(a, b) {
  a = a || {}; b = b || {};
  const gone = Array.from(new Set([].concat(a.gone || [], b.gone || []))).slice(-3000);
  const goneSet = {}; gone.forEach((g) => { goneSet[g] = 1; });
  const seen = {}, strokes = [];
  [].concat(a.strokes || [], b.strokes || []).forEach((s) => {
    if (!s || !s.id || seen[s.id] || goneSet[s.id]) return;
    seen[s.id] = 1; strokes.push(s);
  });
  return { strokes: strokes.slice(-600), gone: gone };
}
function bindingEmpty(b) { return !b || (!b.mapId && !((b.tokens || []).length)); }
function mergeBindings(prevInst, nextInst) {
  const out = Object.assign({}, nextInst), pb = prevInst.bindings || {}, nb = nextInst.bindings || {}, b = {};
  Object.keys(pb).concat(Object.keys(nb)).forEach((k) => {
    if (b[k] !== undefined) return;
    const p = pb[k], n = nb[k];
    if (n === undefined) { b[k] = p; return; }                     // a scene this screen did not send stays
    if (p === undefined) { b[k] = n; return; }
    // never emptied (nor stripped of every token) by a copy, unless that screen cleared it on purpose
    const stripped = bindingEmpty(n) || (!(n.tokens || []).length && (p.tokens || []).length >= 3);
    if (stripped && !bindingEmpty(p) && !((Number(n.cleared) || 0) >= (Number(p.at) || 0) && n.cleared)) { b[k] = p; return; }
    b[k] = (Number(p.at) || 0) > (Number(n.at) || 0) ? p : n;       // the newer layout of the scene wins
  });
  out.bindings = b;
  return out;
}
function mergePings(a, b) {
  const seen = {}, out = [];
  [].concat(a || [], b || []).forEach((p) => { if (p && p.id && !seen[p.id]) { seen[p.id] = 1; out.push(p); } });
  return out.slice(-20);
}
export const saveCampaignState = webMethod(Permissions.Anyone, async (campaignId, snap) => {
  cvTeleReset();
  const mid = await memberId(); if (!mid || !campaignId) return { ok: false };
  try {
    const ex = await wd.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
    const cur = ex.items[0];
    const version = (cur ? (cur.version || 0) : 0) + 1;
    // Absent means keep. The table sends heavy things apart from light ones, so a push
    // carries only what it is about, and the row remembers everything else it was ever
    // given. To clear a thing, send it empty; to leave it alone, do not send it.
    let body = snap || null;
    // The board is the LoreMaster's alone to write: a player's table may send only what is
    // its own (token moves, drawings, pings, the log). A player's whole snapshot, saved over the
    // LoreMaster's, emptied every scene of The Ashen Hands.
    let lmHere = false;
    try { const role = await myAdventureRole(campaignId); lmHere = role === 'loremaster' || role === 'lorekeeper'; } catch (e) {}
    if (body && !lmHere) { const mine = {}; ['tokens', 'draw', 'pings', 'log'].forEach((k) => { if (body[k] !== undefined) mine[k] = body[k]; }); body = mine; }
    if (body && cur && cur.snapshot) {
      try {
        const prev = JSON.parse(cur.snapshot);
        if (prev) {
          const merged = Object.assign({}, body);
          Object.keys(prev).forEach((k) => { if (merged[k] === undefined) merged[k] = prev[k]; });
          // Drawings and pings come from every seat at once, so a push merges into them
          // rather than replacing them: strokes are a union by id, minus anything erased
          // (erasures are kept as tombstones so an older copy cannot bring a stroke back),
          // and pings keep only the last few.
          if (body.draw || prev.draw) merged.draw = mergeDraw(prev.draw, body.draw);
          // Scene by scene, the newer layout wins, and an emptied one never replaces a laid-out
          // one: with a phone and a computer both open as LoreMaster, each saved its whole copy
          // of every scene, and the older copy of a scene (or one that had not loaded) put back
          // or emptied what the other screen had laid out.
          if (lmHere && body.instance && prev.instance && prev.instance.bindings) merged.instance = mergeBindings(prev.instance, body.instance);
          // A player's table may move tokens, never add or take them away: its copy of the
          // table's tokens is only what it was shown, so it moves the stored ones by id.
          if (!lmHere && Array.isArray(body.tokens) && Array.isArray(prev.tokens)) {
            const mv = {}; body.tokens.forEach((t) => { if (t && t.id) mv[t.id] = t; });
            merged.tokens = prev.tokens.map((t) => (t && mv[t.id] ? Object.assign({}, t, { x: mv[t.id].x, y: mv[t.id].y }) : t));
          }
          if (body.pings || prev.pings) merged.pings = mergePings(prev.pings, body.pings);
          body = merged;
        }
      } catch (e) {}
    }
    // Saved versions: the board is kept every so often, and the board as it was is kept
    // whenever a save would empty most of it, so any loss can be undone from the table.
    try { await historyKeep(String(campaignId), cur, body, mid, version); } catch (e) {}
    // And such a save is refused outright: a screen whose copy of the board came up nearly
    // empty (a phone beside the computer, a read that failed) must not write it over the
    // board. Clearing on purpose goes a scene at a time, or says so (allowShrink).
    if (lmHere && cur && cur.snapshot && !(snap && snap.allowShrink)) {
      try {
        const a = boardSummary(JSON.parse(cur.snapshot)), b = boardSummary(body);
        const lost = (x, y, min) => x >= min && y < x / 3;
        if ((lost(a.placed, b.placed, 6) && lost(a.maps, b.maps, 2)) || (a.scenes >= 3 && b.scenes === 0)) {
          return { ok: false, held: true, error: 'held: that save would have emptied most of the board (' + b.placed + ' of ' + a.placed + ' tokens, ' + b.maps + ' of ' + a.maps + ' maps)' };
        }
      } catch (e) {}
    }
    if (body && body.allowShrink !== undefined) delete body.allowShrink;
    const base = cur ? Object.assign({}, cur) : {};
    const row = Object.assign(base, { campaignId: String(campaignId), version: version, snapshot: JSON.stringify(body), updatedBy: mid });
    if (cur) { row._id = cur._id; await wd.update(CV, row, { suppressAuth: true }); }
    else { await wd.insert(CV, row, { suppressAuth: true }); }
    return { ok: true, version: version, tele: TELE_CV };
  } catch (e) { return { ok: false, error: String(e) }; }
});

/* ---- saved versions of a board ----
   BoardHistory keeps an adventure's board (the table's saved state) as it was: every fifteen
   minutes while it is being changed, and always just before a save that would take most of it
   away (most of its placed tokens, maps or effects at once). Thirty are kept per adventure,
   the oldest let go. The LoreMaster can list them, with what each held, and put one back; the
   board as it stood is kept first, so a restore can itself be undone. */
const BH = 'BoardHistory';
const BOARD_KEYS = ['instance', 'tokens', 'effects', 'fog', 'walls', 'lights', 'notes', 'weather', 'draw', 'grid', 'map', 'background', 'backgroundUrl', 'music', 'activeSceneId'];
function boardSummary(snap) {
  const s = snap || {}; const b = (s.instance && s.instance.bindings) || {};
  let placed = 0, maps = 0; Object.keys(b).forEach((k) => { if (b[k]) { placed += (b[k].tokens || []).length; if (b[k].mapId) maps++; } });
  let fx = 0; Object.keys(s.effects || {}).forEach((k) => { fx += ((s.effects[k] || []).length || 0); });
  return { scenes: Object.keys(b).length, maps: maps, placed: placed, tokens: (s.tokens || []).length, effects: fx, notes: Object.keys(s.notes || {}).length, stages: ((s.instance && s.instance.stages) || []).length };
}
async function historyPut(campaignId, snap, version, mid, reason) {
  await wixData.insert(BH, { campaignId: campaignId, at: Date.now(), version: version || 0, summary: JSON.stringify(boardSummary(snap)), reason: reason, savedBy: mid || '', snapshot: JSON.stringify(snap) }, { suppressAuth: true });
  const old = await wixData.query(BH).eq('campaignId', campaignId).descending('at').skip(30).limit(50).find({ suppressAuth: true });
  for (const it of old.items) { try { await wixData.remove(BH, it._id, { suppressAuth: true }); } catch (e) {} }
}
async function historyKeep(campaignId, cur, next, mid, version) {
  if (!cur || !cur.snapshot) return;
  let prev = null; try { prev = JSON.parse(cur.snapshot); } catch (e) { return; }
  const a = boardSummary(prev), b = boardSummary(next);
  const big = (x, y) => x >= 4 && y < x / 2;
  if (big(a.placed, b.placed) || big(a.maps, b.maps) || big(a.effects, b.effects)) { await historyPut(campaignId, prev, cur.version, cur.updatedBy, 'before a large loss'); return; }
  const last = await wixData.query(BH).eq('campaignId', campaignId).descending('at').limit(1).find({ suppressAuth: true });
  const lastAt = last.items[0] ? last.items[0].at : 0;
  if (Date.now() - lastAt > 15 * 60 * 1000) await historyPut(campaignId, next, version, mid, 'kept');
}
export const listBoardHistory = webMethod(Permissions.Anyone, async (campaignId) => {
  if (!(await lmOnly(campaignId))) return { ok: false, error: 'only the LoreMaster' };
  const mid = await memberId();
  const r = await wixData.query(BH).eq('campaignId', String(campaignId)).descending('at').limit(30).find({ suppressAuth: true });
  const cv = await wixData.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
  let now = null; try { now = boardSummary(JSON.parse(cv.items[0].snapshot)); } catch (e) {}
  return { ok: true, now: now, items: r.items.map((it) => ({ id: it._id, at: it.at, version: it.version, reason: it.reason || '', byYou: it.savedBy === mid, summary: (() => { try { return JSON.parse(it.summary); } catch (e) { return {}; } })() })) };
});
// a version kept by hand, from Saved versions
export const saveBoardVersionNow = webMethod(Permissions.Anyone, async (campaignId) => {
  if (!(await lmOnly(campaignId))) return { ok: false, error: 'only the LoreMaster' };
  const mid = await memberId();
  const cv = await wixData.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
  const cur = cv.items[0]; if (!cur) return { ok: false, error: 'no board yet' };
  let snap = {}; try { snap = JSON.parse(cur.snapshot) || {}; } catch (e) { return { ok: false, error: 'unreadable' }; }
  await historyPut(String(campaignId), snap, cur.version, mid, 'saved by hand');
  return { ok: true, summary: boardSummary(snap) };
});
export const restoreBoardHistory = webMethod(Permissions.Anyone, async (campaignId, historyId) => {
  if (!(await lmOnly(campaignId))) return { ok: false, error: 'only the LoreMaster' };
  const mid = await memberId();
  const h = await wixData.get(BH, String(historyId), { suppressAuth: true }).catch(() => null);
  if (!h || h.campaignId !== String(campaignId)) return { ok: false, error: 'no such saved version' };
  const cv = await wixData.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
  const cur = cv.items[0]; if (!cur) return { ok: false, error: 'no board to restore into' };
  let curSnap = {}, old = {}; try { curSnap = JSON.parse(cur.snapshot) || {}; old = JSON.parse(h.snapshot) || {}; } catch (e) { return { ok: false, error: 'unreadable' }; }
  await historyPut(String(campaignId), curSnap, cur.version, mid, 'before a restore');
  BOARD_KEYS.forEach((k) => { if (old[k] !== undefined) curSnap[k] = old[k]; });
  cur.snapshot = JSON.stringify(curSnap); cur.version = (cur.version || 0) + 1; cur.updatedBy = mid;
  await wixData.update(CV, cur, { suppressAuth: true });
  return { ok: true, version: cur.version, summary: boardSummary(curSnap) };
});

// The Journal and Saved versions are the LoreMaster's alone: a lorekeeper helps with the map
// and the Fell, and neither reads the LoreMaster's notes nor puts the board back.
// A rest between sessions, for a Fell's own sheet opened away from the table: whether its
// adventure has one open (the board's rest, written by the LoreMaster's table), and the Skill
// Difficulty an inspection is rolled against (the party's average level divided by 5).
// Only the Fell's owner asks; nothing else of the board is returned.
export const betweenRestFor = webMethod(Permissions.Anyone, async (charId) => {
  const mid = await memberId(); if (!mid || !charId) return { rest: null };
  let ch = null; try { ch = await wixData.get('Characters', String(charId), { suppressAuth: true }); } catch (e) {}
  if (!ch || ch.ownerMemberId !== mid || !ch.campaignId) return { rest: null };
  let rest = null;
  try {
    const cv = await wixData.query(CV).eq('campaignId', String(ch.campaignId)).limit(1).find({ suppressAuth: true });
    const snap = cv.items[0] ? JSON.parse(cv.items[0].snapshot || '{}') : {};
    if (snap.rest && snap.rest.open && snap.rest.between) rest = { id: String(snap.rest.id || ''), open: true, between: true, at: snap.rest.at || 0 };
  } catch (e) {}
  if (!rest) return { rest: null };
  let apl = 0;
  try {
    const r = await wixData.query('Characters').eq('campaignId', String(ch.campaignId)).limit(100).find({ suppressAuth: true });
    const lv = r.items.map((c) => Number(c.level) || 1);
    apl = lv.length ? Math.floor((lv.reduce((a, b) => a + b, 0) / lv.length) / 5) : 0;
  } catch (e) {}
  return { rest: rest, apl: apl };
});

async function lmOnly(campaignId) {
  try { const r = await myAdventureRole(campaignId); return r === 'loremaster'; }
  catch (e) { return false; }
}

// The LoreMaster's Journal, stored on the same campaign row but read only by the LM, so it
// never travels to a player. Kept apart from the shared snapshot field.
export const getJournal = webMethod(Permissions.Anyone, async (campaignId) => {
  cvTeleReset();
  const mid = await memberId(); if (!mid || !campaignId) return [];
  if (!(await lmOnly(campaignId))) return [];
  try {
    const r = await wd.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
    const row = r.items[0]; if (!row || !row.journal) return [];
    try { return JSON.parse(row.journal); } catch (e) { return []; }
  } catch (e) { return []; }
});

export const saveJournal = webMethod(Permissions.Anyone, async (campaignId, entries) => {
  cvTeleReset();
  const mid = await memberId(); if (!mid || !campaignId) return { ok: false };
  if (!(await lmOnly(campaignId))) return { ok: false };
  try {
    const ex = await wd.query(CV).eq('campaignId', String(campaignId)).limit(1).find({ suppressAuth: true });
    const cur = ex.items[0];
    const j = JSON.stringify(Array.isArray(entries) ? entries : []);
    if (cur) { const row = Object.assign({}, cur, { journal: j }); await wd.update(CV, row, { suppressAuth: true }); }
    else { await wd.insert(CV, { campaignId: String(campaignId), version: 0, snapshot: 'null', journal: j, updatedBy: mid }, { suppressAuth: true }); }
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Music at the table: every song uploaded to the site's LoreFell Music folder, for the Manage
// music window's Show my other adventures' songs. Members only; read-only.
export const musicLibrary = webMethod(Permissions.Anyone, async (kind) => {
  try {
    const m = await currentMember.getMember().catch(() => null);
    if (!m || !m._id) return { ok: false, files: [] };
    const folders = await mediaManager.listFolders({}, null, { limit: 200 }).catch(() => []);
    const want = kind === 'sound' ? 'LoreFell Sounds' : 'LoreFell Music';
    const folder = (folders || []).find((f) => String(f.folderName || f.displayName || '').trim() === want);
    if (!folder) return { ok: true, files: [] };
    const files = await mediaManager.listFiles({ parentFolderId: folder.folderId || folder._id }, null, { limit: 500 }).catch(() => []);
    const out = (files || []).filter((f) => /audio/i.test(String(f.mediaType || f.mimeType || 'audio'))).map((f) => ({
      title: String(f.originalFileName || f.displayName || f.fileName || 'Song').replace(/\.[a-z0-9]+$/i, ''),
      url: 'https://static.wixstatic.com/mp3/' + f.fileName
    })).filter((f) => /\/mp3\/.+/.test(f.url));
    return { ok: true, files: out };
  } catch (e) { return { ok: false, files: [], error: String((e && e.message) || e) }; }
});
