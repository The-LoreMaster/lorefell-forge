// Adventures: the shared source of truth for an adventure's authored story, decomposed so
// FateWell and ThreadSpire both read and write the SAME rows. No tool owns the adventure;
// these collections do. Replaces the single Campaigns.data blob, which forced whole-adventure
// writes and let the two tools drift.
//
// The tree: Adventures (root) -> AdvActs -> AdvSessions -> AdvScenes. Per Nate, beats and
// combatants are batched INTO the scene row as JSON, not their own rows, so a scene is one
// row and an edit to it writes one row. Beat images are stored media URLs (short), so a scene
// row stays well under the size cap that started all this.
//
// Every write is per-row and id-addressed, so removing a foe in scene 3 touches one AdvScenes
// row and nothing else. Loading always returns the WHOLE tree (all acts/sessions/scenes), so a
// writer can never overwrite scenes it did not load. That single rule kills the old
// spine-clobbers-the-rest bug.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';
import { gunzipSync } from 'zlib';

// TELEMETRY. Every Wix data call goes through this wrapper so we can SEE, per save, how many
// reads and writes actually happened and against which collection. The quota is a per-minute
// call count, so knowing the exact tally of a save is the difference between guessing and
// knowing where a flood comes from. Each webMethod resets the tally at its start and returns
// TELE in its result; the page logs it to the seams panel. Zero cost beyond a counter.
var TELE = null;
var _lastBulkInsert = {}; // advId -> last time a full bulk-insert ran, to catch a runaway loop
function teleReset() { TELE = { get: 0, query: 0, insert: 0, update: 0, remove: 0, total: 0, byColl: {} }; }
function teleEnter() { if (!TELE) { teleReset(); return true; } return false; } // true if this is the outermost
function teleBump(op, coll) {
  if (!TELE) return;
  TELE[op] = (TELE[op] || 0) + 1;
  TELE.total++;
  TELE.byColl[coll] = (TELE.byColl[coll] || 0) + 1;
}
const wd = {
  get: (c, id, o) => { teleBump('get', c); return wixData.get(c, id, o); },
  insert: (c, r, o) => { teleBump('insert', c); return wixData.insert(c, r, o); },
  update: (c, r, o) => { teleBump('update', c); return wixData.update(c, r, o); },
  remove: (c, id, o) => { teleBump('remove', c); return wixData.remove(c, id, o); },
  query: (c) => { teleBump('query', c); return wixData.query(c); }
};

const ADV = 'Adventures';
const ACTS = 'AdvActs';
const SES = 'AdvSessions';
const SCN = 'AdvScenes';
const CAMPAIGNS = 'Campaigns';

async function memberId() {
  try { const m = await currentMember.getMember(); return (m && m._id) || null; } catch (e) { return null; }
}

// A keeper of this adventure may read and write it; anyone else may not. Mirrors the check
// saveCampaign/loadCampaign already use, so ownership does not change meaning across tools.
async function roleFor(id, advId, ownerId) {
  if (ownerId && id && ownerId === id) return 'loremaster';
  try {
    const km = await wd.query('AdventureMembers').eq('memberId', id).eq('campaignId', advId).limit(1).find({ suppressAuth: true, consistentRead: true });
    if (km.items.length) return km.items[0].role || 'member';
  } catch (e) {}
  return 'member';
}
async function mayKeep(id, advId, ownerId) {
  const r = await roleFor(id, advId, ownerId);
  return r === 'loremaster' || r === 'lorekeeper';
}

function jparse(s, d) { try { return s ? JSON.parse(s) : d; } catch (e) { return d; } }
function jorder(s) { const a = jparse(s, []); return Array.isArray(a) ? a : []; }

// Order a list of rows by an explicit id-order array when present, else by sortIndex, else by
// insertion. The order array is authoritative because reordering must not require rewriting
// every child's sortIndex, only the parent's one order field.
function ordered(rows, idKey, orderIds) {
  if (orderIds && orderIds.length) {
    const byId = {}; rows.forEach(r => { byId[r[idKey]] = r; });
    const out = []; orderIds.forEach(id => { if (byId[id]) { out.push(byId[id]); delete byId[id]; } });
    rows.forEach(r => { if (byId[r[idKey]]) out.push(r); }); // any not named in the order, appended
    return out;
  }
  return rows.slice().sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0));
}

// ---- READ: the whole tree for one adventure ----
// Returns the adventure in the shape the tools already hold in memory: { name, activeSceneId,
// acts:[{ id,name,..., sessions:[{ id,name, scenes:[ scene ] }] }] }, so neither tool needs a
// new in-memory model, only a new load/save path.
export const loadAdventure = webMethod(Permissions.Anyone, async (advId) => {
  teleEnter();
  if (!advId) return null;
  const id = await memberId();
  const root = await wd.get(ADV, advId, { suppressAuth: true }).catch(() => null);
  if (!root) return null;
  if (root.ownerMemberId && id && root.ownerMemberId !== id) {
    if (!(await mayKeep(id, advId, root.ownerMemberId))) return null;
  }

  const [actQ, sesQ, scnQ] = await Promise.all([
    wd.query(ACTS).eq('advId', advId).limit(200).find({ suppressAuth: true, consistentRead: true }),
    wd.query(SES).eq('advId', advId).limit(500).find({ suppressAuth: true, consistentRead: true }),
    wd.query(SCN).eq('advId', advId).limit(1000).find({ suppressAuth: true, consistentRead: true })
  ]);

  const scenesBySes = {};
  scnQ.items.forEach(r => { (scenesBySes[r.sesId] = scenesBySes[r.sesId] || []).push(r); });
  const sesByAct = {};
  sesQ.items.forEach(r => { (sesByAct[r.actId] = sesByAct[r.actId] || []).push(r); });

  const acts = ordered(actQ.items, 'actId', jorder(root.actOrder)).map(a => {
    const sessions = ordered(sesByAct[a.actId] || [], 'sesId', jorder(a.sessionOrder)).map(se => {
      const sceneRows = ordered(scenesBySes[se.sesId] || [], 'sceneId', jorder(se.sceneOrder));
      const scenes = sceneRows.map(row => { const s = sceneFromRow(row); delete s._row; return s; });
      return Object.assign({ id: se.sesId, name: se.name || '', scenes: scenes }, jparse(se.extra, {}));
    });
    return Object.assign({ id: a.actId, name: a.name || '', notes: a.notes || '', img: a.img || '', desc: a.desc || '', sessions: sessions }, jparse(a.extra, {}));
  });

  // The tree's freshness is the most recent write to any of its rows - the root, an act, a
  // session, or a scene. ThreadSpire edits a single scene row, so the root alone is not
  // enough; take the max across everything. FateWell compares this against its own blob's
  // write time and loads whichever is newer, so an edit made in either tool wins by recency.
  const stamps = [root._updatedDate]
    .concat(actQ.items.map(r => r._updatedDate))
    .concat(sesQ.items.map(r => r._updatedDate))
    .concat(scnQ.items.map(r => r._updatedDate))
    .filter(Boolean).map(d => +new Date(d));
  const updatedAt = stamps.length ? Math.max.apply(null, stamps) : 0;

  const metaObj = jparse(root.meta, {});
  // Spread the campaign-level fields back to the top level where the tools keep them, with the
  // structural fields winning, so loading the tree reconstructs the whole campaign losslessly.
  return Object.assign({}, metaObj, {
    id: advId,
    name: root.name || 'Adventure',
    activeSceneId: root.activeSceneId || '',
    acts: acts,
    role: 'loremaster',
    updatedAt: updatedAt,
    meta: metaObj
  });
});

// A scene row -> the in-memory scene object. Beats and combatants come out of their JSON
// fields; the rest of the scene's own fields ride in sceneData so no scene property is lost,
// however many the tools add later.
function sceneFromRow(r) {
  const extra = jparse(r.sceneData, {});
  const scene = Object.assign({}, extra, {
    id: r.sceneId,
    name: r.name || '',
    prep: r.prep || '',
    img: r.img || '',
    desc: r.desc || '',
    mode: r.mode || 'roleplay',
    status: r.status || 'active',
    beats: jparse(r.beats, []),
    combatants: jparse(r.combatants, [])
  });
  scene._row = r; // internal, stripped before returning the tree
  return scene;
}

// ---- WRITE: one row at a time ----

export const saveAdventureRoot = webMethod(Permissions.Anyone, async (advId, root) => {
  const id = await memberId();
  if (!advId || !root) return { ok: false, error: 'no adventure' };
  const existing = await wd.get(ADV, advId, { suppressAuth: true }).catch(() => null);
  if (existing && existing.ownerMemberId && id && existing.ownerMemberId !== id) {
    if (!(await mayKeep(id, advId, existing.ownerMemberId))) return { ok: false, error: 'owned by another member' };
  }
  const row = existing || { _id: advId, advId: advId, ownerMemberId: id };
  if (root.name !== undefined) row.name = root.name || 'Adventure';
  if (root.activeSceneId !== undefined) row.activeSceneId = root.activeSceneId || '';
  if (root.actOrder !== undefined) row.actOrder = JSON.stringify(root.actOrder || []);
  if (root.meta !== undefined) row.meta = JSON.stringify(root.meta || {});
  if (!row.ownerMemberId) row.ownerMemberId = id;
  row.updatedAt = Date.now();
  try {
    const saved = existing ? await wd.update(ADV, row, { suppressAuth: true }) : await wd.insert(ADV, row, { suppressAuth: true });
    return { ok: true, id: saved._id };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});

async function saveChild(coll, idKey, advId, keyVal, fields) {
  const id = await memberId();
  const root = await wd.get(ADV, advId, { suppressAuth: true }).catch(() => null);
  if (root && root.ownerMemberId && id && root.ownerMemberId !== id) {
    if (!(await mayKeep(id, advId, root.ownerMemberId))) return { ok: false, error: 'owned by another member' };
  }
  const q = await wd.query(coll).eq(idKey, keyVal).eq('advId', advId).limit(1).find({ suppressAuth: true, consistentRead: true });
  const existing = q.items[0] || null;
  const row = existing || Object.assign({ advId: advId }, { [idKey]: keyVal });
  Object.keys(fields).forEach(k => { row[k] = fields[k]; });
  row.updatedAt = Date.now();
  try {
    const saved = existing ? await wd.update(coll, row, { suppressAuth: true }) : await wd.insert(coll, row, { suppressAuth: true });
    return { ok: true, id: saved._id };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
}

export const saveAdvAct = webMethod(Permissions.Anyone, async (advId, act) => {
  if (!act || !act.id) return { ok: false, error: 'no act' };
  const { id, name, notes, img, desc, sessions } = act;
  const extra = {}; Object.keys(act).forEach(k => { if (!['id', 'name', 'notes', 'img', 'desc', 'sessions', 'sortIndex', 'sessionOrder'].includes(k)) extra[k] = act[k]; });
  return saveChild(ACTS, 'actId', advId, id, {
    name: name || '', notes: notes || '', img: img || '', desc: desc || '',
    sortIndex: act.sortIndex || 0,
    sessionOrder: JSON.stringify((sessions || []).map(s => s.id)),
    extra: JSON.stringify(extra)
  });
});

export const saveAdvSession = webMethod(Permissions.Anyone, async (advId, actId, ses) => {
  if (!ses || !ses.id) return { ok: false, error: 'no session' };
  const extra = {}; Object.keys(ses).forEach(k => { if (!['id', 'name', 'scenes', 'sortIndex', 'sceneOrder'].includes(k)) extra[k] = ses[k]; });
  return saveChild(SES, 'sesId', advId, ses.id, {
    actId: actId,
    name: ses.name || '',
    sortIndex: ses.sortIndex || 0,
    sceneOrder: JSON.stringify((ses.scenes || []).map(s => s.id)),
    extra: JSON.stringify(extra)
  });
});

export const saveAdvScene = webMethod(Permissions.Anyone, async (advId, actId, sesId, scene) => {
  if (!scene || !scene.id) return { ok: false, error: 'no scene' };
  // The scene's own fields, minus the ones that get their own column, ride in sceneData so
  // nothing is lost. Beats and combatants are batched here as JSON, per Nate.
  const own = {}; Object.keys(scene).forEach(k => {
    if (!['id', 'name', 'prep', 'img', 'desc', 'mode', 'status', 'beats', 'combatants', '_row'].includes(k)) own[k] = scene[k];
  });
  return saveChild(SCN, 'sceneId', advId, scene.id, {
    actId: actId, sesId: sesId,
    name: scene.name || '',
    prep: scene.prep || '', img: scene.img || '', desc: scene.desc || '',
    mode: scene.mode || 'roleplay', status: scene.status || 'active',
    beats: JSON.stringify(scene.beats || []),
    combatants: JSON.stringify(scene.combatants || []),
    sceneData: JSON.stringify(own)
  });
});

async function removeChild(coll, idKey, advId, keyVal) {
  const id = await memberId();
  const root = await wd.get(ADV, advId, { suppressAuth: true }).catch(() => null);
  if (root && root.ownerMemberId && id && root.ownerMemberId !== id) {
    if (!(await mayKeep(id, advId, root.ownerMemberId))) return { ok: false, error: 'owned by another member' };
  }
  const q = await wd.query(coll).eq(idKey, keyVal).eq('advId', advId).limit(1).find({ suppressAuth: true, consistentRead: true });
  if (!q.items.length) return { ok: true, gone: true };
  try { await wd.remove(coll, q.items[0]._id, { suppressAuth: true }); return { ok: true }; }
  catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
}
export const removeAdvScene = webMethod(Permissions.Anyone, async (advId, sceneId) => removeChild(SCN, 'sceneId', advId, sceneId));
export const removeAdvSession = webMethod(Permissions.Anyone, async (advId, sesId) => removeChild(SES, 'sesId', advId, sesId));
export const removeAdvAct = webMethod(Permissions.Anyone, async (advId, actId) => removeChild(ACTS, 'actId', advId, actId));

// ---- MIGRATION: one Campaigns blob -> the decomposed tree ----
// Additive and idempotent: it writes the new rows and stamps migratedFrom, but does NOT delete
// the Campaigns row. The blob path stays until every adventure round-trips clean, then retires.
function unpackCampaignData(data) {
  if (data && typeof data.campaignGz === 'string') {
    try { return JSON.parse(gunzipSync(Buffer.from(data.campaignGz, 'base64')).toString('utf8')); } catch (e) { return {}; }
  }
  return data || {};
}

// FateWell hands the whole campaign object on each save. Writing every row every time blows
// the per-minute quota on a large adventure (a 69 scene save was ~200 calls). So this diffs:
// it reads the adventure's rows once, then writes ONLY the root, acts, sessions and scenes
// whose content actually changed, and removes rows the campaign dropped. An unchanged scene
// costs nothing. A one scene edit costs one write. That keeps a save within quota and lets
// FateWell and ThreadSpire share the tree without either flooding the API.
export const saveAdventureFromCampaign = webMethod(Permissions.Anyone, async (advId, campaign, force) => {
  teleEnter();
  if (!advId || !campaign) return { ok: false, error: 'no adventure' };
  const id = await memberId();
  const existingRoot = await wd.get(ADV, advId, { suppressAuth: true }).catch(() => null);
  if (existingRoot && existingRoot.ownerMemberId && id && existingRoot.ownerMemberId !== id) {
    if (!(await mayKeep(id, advId, existingRoot.ownerMemberId))) return { ok: false, error: 'owned by another member' };
  }
  const acts = Array.isArray(campaign.acts) ? campaign.acts : [];

  // Read the current rows once.
  //
  // The scene read asked for .limit(2000). Wix Data caps .find() at 1000, so that one query
  // REJECTED on every call, and the old .catch(() => []) turned the rejection into an empty
  // list. An empty list is exactly what a fresh collection looks like, so the diff concluded
  // the tree was missing and re-inserted all of it, every save, forever. The rows were always
  // present and always carried the right advId; the query never ran far enough to see them.
  // That is why .eq('advId') looked broken while an unfiltered scan of the same collection
  // found the same rows: the unfiltered probes below use limit(1), which is under the cap.
  //
  // Two rules come out of it. Stay at or under the cap, and never let a read that FAILED look
  // like a collection that is EMPTY, because the second one is what writes.
  const readErr = {};
  const readTree = (coll, cap) => wd.query(coll).eq('advId', advId).limit(cap)
    .find({ suppressAuth: true, consistentRead: true })
    .then(r => r.items)
    .catch(e => { readErr[coll] = (e && e.message) || String(e); return null; });
  const [actRows, sesRows, scnRows] = await Promise.all([
    readTree(ACTS, 500), readTree(SES, 1000), readTree(SCN, 1000)
  ]);
  // A failed read tells us nothing about what is stored, so refuse rather than diff against a
  // guess. Treating a failed read as an empty tree is precisely what flooded the collection.
  if (!actRows || !sesRows || !scnRows) {
    return { ok: false, error: 'reconcile refused: a tree read failed, so an empty result cannot be trusted', readErr: readErr, advId: advId, tele: TELE };
  }
  // Guard: if the diff would insert many rows because it found none, something is wrong (the
  // query failed or the collection is mid-repair). Refuse to bulk-insert rather than flood.
  const blobSceneCount = acts.reduce((n, a) => n + (a.sessions || []).reduce((m, s) => m + (s.scenes || []).length, 0), 0);
  // The flood was not a single bulk-insert, it was the SAME bulk-insert firing over and over
  // because the query never found the rows it had just written. So allow a bulk population when
  // the tree is empty (a fresh collection legitimately needs it), but refuse to do it AGAIN for
  // the same adventure within a short window. A healthy write finds its rows on the next save
  // and never trips this; a runaway loop trips it on the second pass and stops.
  if (scnRows.length === 0 && blobSceneCount > 5 && !force) {
    const last = _lastBulkInsert[advId] || 0;
    if (Date.now() - last < 30000) {
      return { ok: false, error: 'reconcile refused: repeated bulk-insert for the same adventure within 30s, the query is not finding written rows', advId: advId, blobSceneCount: blobSceneCount, tele: TELE };
    }
    _lastBulkInsert[advId] = Date.now();
  }
  const actBy = index(actRows, 'actId'), sesBy = index(sesRows, 'sesId'), scnBy = index(scnRows, 'sceneId');
  let writes = 0;

  // root: write only if name, active scene, act order, or any campaign-level field changed
  const actOrder = JSON.stringify(acts.map(a => a.id));
  const rootMeta = JSON.stringify(rootMetaOf(campaign));
  if (!existingRoot || existingRoot.name !== (campaign.name || 'Adventure') || existingRoot.activeSceneId !== (campaign.activeSceneId || '') || existingRoot.actOrder !== actOrder || !jsonEq(existingRoot.meta, rootMeta)) {
    await saveAdventureRootRow(advId, campaign, acts, existingRoot, id); writes++;
  }

  const keepA = {}, keepSe = {}, keepSc = {};
  // A single save must not fire so many writes that it trips the per-minute quota (WDE0014).
  // The diff already skips unchanged rows, so a normal edit is a handful of writes. But a
  // first save after migration, or a broad change, could still be many. Cap the writes this
  // call makes; whatever is left over is written by the next save, since the diff will still
  // see it as changed. Better a save that lands most of the change and finishes than one that
  // floods and lands none.
  // 120 covers a large adventure (about eighty rows for sixty nine scenes with their
  // sessions, acts and root) in ONE pass, so a fresh population does not depend on reading
  // back rows it just wrote. The cap still exists so a runaway can never write unbounded.
  var WRITE_BUDGET = 120;
  var budgetLeft = WRITE_BUDGET;
  for (let ai = 0; ai < acts.length; ai++) {
    const a = acts[ai]; keepA[a.id] = 1;
    const aRow = actBy[a.id];
    const aFields = actFields(advId, a, ai);
    if (budgetLeft > 0 && rowChanged(aRow, aFields)) { await writeRow(ACTS, aRow, aFields); writes++; budgetLeft--; }
    const sessions = a.sessions || [];
    for (let si = 0; si < sessions.length; si++) {
      const se = sessions[si]; keepSe[se.id] = 1;
      const sRow = sesBy[se.id];
      const sFields = sesFields(advId, a.id, se, si);
      if (budgetLeft > 0 && rowChanged(sRow, sFields)) { await writeRow(SES, sRow, sFields); writes++; budgetLeft--; }
      const scenes = se.scenes || [];
      for (let ci = 0; ci < scenes.length; ci++) {
        const sc = scenes[ci]; keepSc[sc.id] = 1;
        const cRow = scnBy[sc.id];
        const cFields = sceneFields(advId, a.id, se.id, sc, ci);
        if (budgetLeft > 0 && rowChanged(cRow, cFields)) { await writeRow(SCN, cRow, cFields); writes++; budgetLeft--; }
      }
    }
  }

  // prune rows the campaign dropped, using the already-read lists (no extra queries)
  for (const row of scnRows) { if (!keepSc[row.sceneId]) { try { await wd.remove(SCN, row._id, { suppressAuth: true }); writes++; } catch (e) {} } }
  for (const row of sesRows) { if (!keepSe[row.sesId]) { try { await wd.remove(SES, row._id, { suppressAuth: true }); writes++; } catch (e) {} } }
  for (const row of actRows) { if (!keepA[row.actId]) { try { await wd.remove(ACTS, row._id, { suppressAuth: true }); writes++; } catch (e) {} } }

  return { ok: true, advId: advId, writes: writes, tele: TELE,
    diag: {
      queryAdvId: advId,
      blobScenes: (function(){ let n = 0; acts.forEach(a => (a.sessions||[]).forEach(s => n += (s.scenes||[]).length)); return n; })(),
      storedScenes: scnRows.length,
      matched: (function(){ let n = 0; acts.forEach(a => (a.sessions||[]).forEach(s => (s.scenes||[]).forEach(sc => { if (scnBy[sc.id]) n++; }))); return n; })(),
      sampleBlobId: (acts[0] && acts[0].sessions && acts[0].sessions[0] && acts[0].sessions[0].scenes && acts[0].sessions[0].scenes[0] && acts[0].sessions[0].scenes[0].id) || '(none)',
      sampleStoredId: (scnRows[0] && scnRows[0].sceneId) || '(none)',
      // Empty when the reads succeeded. If a read ever fails again this carries the reason,
      // so the next person sees the error instead of a plausible looking zero.
      readErr: readErr,
      // A read that came back exactly at the cap may have been truncated, which hides rows from
      // the diff and makes it re-insert them as duplicates. Same failure, quieter.
      sceneReadCapped: scnRows.length >= 1000,
      // count ALL scenes in the collection, unfiltered, and sample the advId they actually
      // carry. If total is high but storedScenes is 0, the advId filter is the mismatch and
      // this shows what advId the rows were really written under.
      totalScenesAllAdvs: await wd.query(SCN).limit(1).find({ suppressAuth: true, consistentRead: true }).then(r => r.totalCount).catch(() => -1),
      sampleAnyAdvId: await wd.query(SCN).limit(1).find({ suppressAuth: true, consistentRead: true }).then(r => (r.items[0] && r.items[0].advId) || '(empty)').catch(() => '(err)')
    }
  };
});

function index(rows, key) { const m = {}; (rows || []).forEach(r => { m[r[key]] = r; }); return m; }

// a row needs writing only if one of its stored fields differs from what we would write. The
// JSON fields (beats, combatants, sceneData, extra, sessionOrder, sceneOrder, actOrder) are
// compared by VALUE, not by their serialized string: two objects that are equal can serialize
// with different key order, and a string compare there would call every row changed and write
// the whole tree every save, which is exactly the flood this diff exists to avoid.
var JSON_FIELDS = { beats: 1, combatants: 1, sceneData: 1, extra: 1, sessionOrder: 1, sceneOrder: 1, actOrder: 1, meta: 1 };
function canon(v) {
  // a stable serialization: sort object keys so equal values serialize identically
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
function jsonEq(a, b) {
  var pa, pb;
  try { pa = typeof a === 'string' ? JSON.parse(a || 'null') : a; } catch (e) { pa = a; }
  try { pb = typeof b === 'string' ? JSON.parse(b || 'null') : b; } catch (e) { pb = b; }
  return canon(pa) === canon(pb);
}
function rowChanged(row, fields) {
  if (!row) return true;
  return Object.keys(fields).some(function (k) {
    if (JSON_FIELDS[k]) return !jsonEq(row[k], fields[k]);
    return String(row[k] === undefined ? '' : row[k]) !== String(fields[k] === undefined ? '' : fields[k]);
  });
}
async function writeRow(coll, row, fields) {
  const out = Object.assign(row ? { _id: row._id } : {}, fields, { updatedAt: Date.now() });
  if (row) return wd.update(coll, out, { suppressAuth: true });
  return wd.insert(coll, out, { suppressAuth: true });
}
// Everything on the campaign that is not the structure itself - notes, entries, manual
// references, description, image, and whatever else FateWell keeps at the top level - so the
// tree carries a lossless copy and a tool loading the tree does not lose it.
function rootMetaOf(campaign) {
  const meta = {};
  Object.keys(campaign || {}).forEach(k => {
    if (!['id', 'name', 'activeSceneId', 'acts', 'role', 'updatedAt', 'meta', '_row'].includes(k)) meta[k] = campaign[k];
  });
  return meta;
}
async function saveAdventureRootRow(advId, campaign, acts, existing, id) {
  const row = existing || { _id: advId, advId: advId, ownerMemberId: id };
  row.name = campaign.name || 'Adventure';
  row.activeSceneId = campaign.activeSceneId || '';
  row.actOrder = JSON.stringify(acts.map(a => a.id));
  row.meta = JSON.stringify(rootMetaOf(campaign));
  if (!row.ownerMemberId) row.ownerMemberId = id;
  row.updatedAt = Date.now();
  return existing ? wd.update(ADV, row, { suppressAuth: true }) : wd.insert(ADV, row, { suppressAuth: true });
}
function actFields(advId, a, i) {
  const extra = {}; Object.keys(a).forEach(k => { if (!['id', 'name', 'notes', 'img', 'desc', 'sessions', 'sortIndex', 'sessionOrder'].includes(k)) extra[k] = a[k]; });
  return { advId: advId, actId: a.id, name: a.name || '', notes: a.notes || '', img: a.img || '', desc: a.desc || '', sortIndex: i, sessionOrder: JSON.stringify((a.sessions || []).map(s => s.id)), extra: JSON.stringify(extra) };
}
function sesFields(advId, actId, se, i) {
  const extra = {}; Object.keys(se).forEach(k => { if (!['id', 'name', 'scenes', 'sortIndex', 'sceneOrder'].includes(k)) extra[k] = se[k]; });
  return { advId: advId, sesId: se.id, actId: actId, name: se.name || '', sortIndex: i, sceneOrder: JSON.stringify((se.scenes || []).map(s => s.id)), extra: JSON.stringify(extra) };
}
function sceneFields(advId, actId, sesId, sc, i) {
  const own = {}; Object.keys(sc).forEach(k => { if (!['id', 'name', 'prep', 'img', 'desc', 'mode', 'status', 'beats', 'combatants', '_row'].includes(k)) own[k] = sc[k]; });
  return { advId: advId, sceneId: sc.id, actId: actId, sesId: sesId, sortIndex: i, name: sc.name || '', prep: sc.prep || '', img: sc.img || '', desc: sc.desc || '', mode: sc.mode || 'roleplay', status: sc.status || 'active', beats: JSON.stringify(sc.beats || []), combatants: JSON.stringify(sc.combatants || []), sceneData: JSON.stringify(own) };
}

// The compressed save path used migrateCampaign to reconcile the tree, but that method also
// reads the whole tree back to verify and re-stamps the Campaigns row every call, which is
// migration bookkeeping, not routine save cost. On a hot autosave that verify-read was firing
// again and again and stacking toward the quota. This does only the write: read the blob once,
// decompress, diff-write the tree. No read-back, no re-stamp. Same tree result, a fraction of
// the calls.
export const saveAdventureFromBlob = webMethod(Permissions.Anyone, async (advId) => {
  teleReset();
  if (!advId) return { ok: false, error: 'no adventure' };
  const camp = await wd.get(CAMPAIGNS, advId, { suppressAuth: true }).catch(() => null);
  if (!camp) return { ok: false, error: 'no blob' };
  const data = unpackCampaignData(jparse(camp.data, {}));
  const res = await saveAdventureFromCampaign(advId, Object.assign({ name: camp.name || data.name }, data));
  return { ok: (res && res.ok) !== false, advId: advId, tele: TELE, diag: res && res.diag, writes: (res && res.writes) || 0 };
});

// REPAIR. The scene collection filled with thousands of duplicate rows because the reconcile
// read asked for more rows than Wix Data will return, failed, and was read as an empty tree,
// so every save re-inserted everything. That read is fixed above. This still scans in pages
// and matches advId in code rather than filtering, because a repair pass should not depend on
// the same query whose failure it is cleaning up after. It removes every scene, session and
// act row for the given advId. After this, the tree can be rebuilt once, cleanly.
export const purgeAdventureTree = webMethod(Permissions.Anyone, async (advId) => {
  teleReset();
  if (!advId) return { ok: false, error: 'no adventure' };
  async function purge(coll) {
    let removed = 0, skip = 0;
    for (let page = 0; page < 400; page++) {
      const res = await wd.query(coll).limit(100).skip(skip).find({ suppressAuth: true, consistentRead: true }).catch(() => null);
      if (!res || !res.items || !res.items.length) break;
      let rp = 0;
      for (const row of res.items) {
        if (row.advId === advId) { try { await wd.remove(coll, row._id, { suppressAuth: true }); removed++; rp++; } catch (e) {} }
      }
      if (!rp) skip += res.items.length; // only advance when nothing was removed, since removal shifts the window
      if (res.items.length < 100) break;
    }
    return removed;
  }
  const removedScenes = await purge(SCN);
  const removedSessions = await purge(SES);
  const removedActs = await purge(ACTS);
  return { ok: true, advId: advId, removedScenes: removedScenes, removedSessions: removedSessions, removedActs: removedActs, tele: TELE };
});

// WIPE AND RE-MIGRATE, through Velo. This was built on the belief that REST written rows could
// not answer an .eq('advId') query from Velo. That was wrong: the reconcile read was over the
// Wix Data row cap and failed, and a failed read looked empty no matter who wrote the rows.
// The write path was never the problem. The method is still the right way to clear a collection
// the flood filled and rebuild it from the Campaigns blobs, so it stays. It clears the four
// collections completely, then rebuilds every adventure. It is heavy by design and meant to be
// run once, by hand, not on a hot path. Returns a per-adventure count so it can be verified.
// Bounded repair, in small calls so none times out (Velo caps a web method near 14s, and
// clearing thousands of rows in one call hit a 504). The tool loops these until done.

// Delete up to `budget` rows across the four collections in one call. Returns how many were
// removed and a rough count still present, so the caller knows whether to call again.
export const wipeChunk = webMethod(Permissions.Anyone, async (budget) => {
  teleReset();
  const cap = Math.min(budget || 300, 400);
  let removed = 0;
  for (const coll of [SCN, SES, ACTS, ADV]) {
    while (removed < cap) {
      const res = await wd.query(coll).limit(Math.min(100, cap - removed)).find({ suppressAuth: true, consistentRead: true }).catch(() => null);
      if (!res || !res.items || !res.items.length) break;
      for (const row of res.items) {
        if (removed >= cap) break;
        try { await wd.remove(coll, row._id, { suppressAuth: true }); removed++; } catch (e) {}
      }
      if (res.items.length < 100) break;
    }
    if (removed >= cap) break;
  }
  // report remaining scene count so the caller knows if more passes are needed
  const remainingScenes = await wd.query(SCN).limit(1).find({ suppressAuth: true, consistentRead: true }).then(r => r.totalCount).catch(() => -1);
  const remainingTree = await wd.query(ADV).limit(1).find({ suppressAuth: true, consistentRead: true }).then(r => r.totalCount).catch(() => -1);
  const done = (remainingScenes === 0 && remainingTree === 0);
  return { ok: true, removed: removed, remainingScenes: remainingScenes, remainingTree: remainingTree, done: done, tele: TELE };
});

// Rebuild ONE adventure from its blob through wixData, so its rows are queryable. Verifies by
// the same query the tools use. Small enough to finish in one call.
export const remigrateOne = webMethod(Permissions.Anyone, async (advId) => {
  teleReset();
  if (!advId) return { ok: false, error: 'no advId' };
  const camp = await wd.get(CAMPAIGNS, advId, { suppressAuth: true }).catch(() => null);
  if (!camp) return { ok: false, error: 'no blob for ' + advId };
  const data = unpackCampaignData(jparse(camp.data, {}));
  if (!data || !Array.isArray(data.acts)) return { ok: false, error: 'no acts', advId: advId };
  await saveAdventureFromCampaign(advId, Object.assign({ name: camp.name || data.name }, data), true);
  const check = await wd.query(SCN).eq('advId', advId).limit(1).find({ suppressAuth: true, consistentRead: true }).then(r => r.totalCount).catch(() => -1);
  const blobScenes = data.acts.reduce((n, a) => n + (a.sessions || []).reduce((m, s) => m + (s.scenes || []).length, 0), 0);
  return { ok: check === blobScenes, advId: advId, name: camp.name, blobScenes: blobScenes, queryableScenes: check, tele: TELE };
});

// List the adventure ids to rebuild, so the tool can loop remigrateOne over them.
export const listCampaignIds = webMethod(Permissions.Anyone, async () => {
  const camps = await wd.query(CAMPAIGNS).limit(200).find({ suppressAuth: true, consistentRead: true }).then(r => r.items).catch(() => []);
  return { ok: true, ids: camps.map(c => ({ advId: c._id, name: c.name })) };
});

export const migrateCampaign = webMethod(Permissions.Anyone, async (campaignId) => {
  teleReset();
  if (!campaignId) return { ok: false, error: 'no campaign' };
  const id = await memberId();
  const camp = await wd.get(CAMPAIGNS, campaignId, { suppressAuth: true }).catch(() => null);
  if (!camp) return { ok: false, error: 'campaign not found' };
  if (camp.ownerMemberId && id && camp.ownerMemberId !== id) {
    if (!(await mayKeep(id, campaignId, camp.ownerMemberId))) return { ok: false, error: 'owned by another member' };
  }
  const data = unpackCampaignData(jparse(camp.data, {}));
  const advId = campaignId; // keep the same id so members, players, stages still resolve

  // reuse the diff based writer so migrating a large adventure does not flood the API. On a
  // fresh adventure every row is new, so all get written; on a re-run only changes write.
  const res = await saveAdventureFromCampaign(advId, Object.assign({ name: camp.name || data.name }, data));

  // stamp the source so a re-run is a no-op update and we can tell what has moved
  try { camp.migratedTo = advId; camp.migratedAt = Date.now(); await wd.update(CAMPAIGNS, camp, { suppressAuth: true }); } catch (e) {}

  const back = await loadAdventure(advId);
  const backScenes = (back && back.acts || []).reduce((n, a) => n + (a.sessions || []).reduce((m, s) => m + (s.scenes || []).length, 0), 0);
  const nScenes = (data.acts || []).reduce((n, a) => n + (a.sessions || []).reduce((m, s) => m + (s.scenes || []).length, 0), 0);
  return { ok: (res && res.ok) !== false, advId: advId, scenesWritten: nScenes, scenesReadBack: backScenes, clean: nScenes === backScenes, tele: TELE };
});
