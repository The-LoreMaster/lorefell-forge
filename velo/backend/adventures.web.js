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
    const km = await wixData.query('AdventureMembers').eq('memberId', id).eq('campaignId', advId).limit(1).find({ suppressAuth: true });
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
  if (!advId) return null;
  const id = await memberId();
  const root = await wixData.get(ADV, advId, { suppressAuth: true }).catch(() => null);
  if (!root) return null;
  if (root.ownerMemberId && id && root.ownerMemberId !== id) {
    if (!(await mayKeep(id, advId, root.ownerMemberId))) return null;
  }

  const [actQ, sesQ, scnQ] = await Promise.all([
    wixData.query(ACTS).eq('advId', advId).limit(200).find({ suppressAuth: true }),
    wixData.query(SES).eq('advId', advId).limit(500).find({ suppressAuth: true }),
    wixData.query(SCN).eq('advId', advId).limit(1000).find({ suppressAuth: true })
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

  return {
    id: advId,
    name: root.name || 'Adventure',
    activeSceneId: root.activeSceneId || '',
    acts: acts,
    role: 'loremaster',
    meta: jparse(root.meta, {})
  };
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
  const existing = await wixData.get(ADV, advId, { suppressAuth: true }).catch(() => null);
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
    const saved = existing ? await wixData.update(ADV, row, { suppressAuth: true }) : await wixData.insert(ADV, row, { suppressAuth: true });
    return { ok: true, id: saved._id };
  } catch (e) { return { ok: false, error: (e && e.message) || String(e) }; }
});

async function saveChild(coll, idKey, advId, keyVal, fields) {
  const id = await memberId();
  const root = await wixData.get(ADV, advId, { suppressAuth: true }).catch(() => null);
  if (root && root.ownerMemberId && id && root.ownerMemberId !== id) {
    if (!(await mayKeep(id, advId, root.ownerMemberId))) return { ok: false, error: 'owned by another member' };
  }
  const q = await wixData.query(coll).eq(idKey, keyVal).eq('advId', advId).limit(1).find({ suppressAuth: true });
  const existing = q.items[0] || null;
  const row = existing || Object.assign({ advId: advId }, { [idKey]: keyVal });
  Object.keys(fields).forEach(k => { row[k] = fields[k]; });
  row.updatedAt = Date.now();
  try {
    const saved = existing ? await wixData.update(coll, row, { suppressAuth: true }) : await wixData.insert(coll, row, { suppressAuth: true });
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
  const root = await wixData.get(ADV, advId, { suppressAuth: true }).catch(() => null);
  if (root && root.ownerMemberId && id && root.ownerMemberId !== id) {
    if (!(await mayKeep(id, advId, root.ownerMemberId))) return { ok: false, error: 'owned by another member' };
  }
  const q = await wixData.query(coll).eq(idKey, keyVal).eq('advId', advId).limit(1).find({ suppressAuth: true });
  if (!q.items.length) return { ok: true, gone: true };
  try { await wixData.remove(coll, q.items[0]._id, { suppressAuth: true }); return { ok: true }; }
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

// FateWell hands the whole campaign object on each save. Write it into the tree the same way
// the migration does, so FateWell and ThreadSpire land on the SAME rows. Idempotent: it
// overwrites the adventure's rows by id and prunes rows for scenes/acts/sessions the campaign
// no longer contains, so a delete in FateWell reaches the shared source too.
export const saveAdventureFromCampaign = webMethod(Permissions.Anyone, async (advId, campaign) => {
  if (!advId || !campaign) return { ok: false, error: 'no adventure' };
  const id = await memberId();
  const existingRoot = await wixData.get(ADV, advId, { suppressAuth: true }).catch(() => null);
  if (existingRoot && existingRoot.ownerMemberId && id && existingRoot.ownerMemberId !== id) {
    if (!(await mayKeep(id, advId, existingRoot.ownerMemberId))) return { ok: false, error: 'owned by another member' };
  }
  const acts = Array.isArray(campaign.acts) ? campaign.acts : [];

  await saveAdventureRoot(advId, {
    name: campaign.name || 'Adventure',
    activeSceneId: campaign.activeSceneId || '',
    actOrder: acts.map(a => a.id),
    meta: { source: 'fatewell', savedAt: Date.now() }
  });

  const keepActs = {}, keepSes = {}, keepScn = {};
  for (const a of acts) {
    keepActs[a.id] = 1;
    await saveAdvAct(advId, a);
    for (const se of (a.sessions || [])) {
      keepSes[se.id] = 1;
      await saveAdvSession(advId, a.id, se);
      for (const sc of (se.scenes || [])) {
        keepScn[sc.id] = 1;
        await saveAdvScene(advId, a.id, se.id, sc);
      }
    }
  }

  await pruneMissing(SCN, 'sceneId', advId, keepScn);
  await pruneMissing(SES, 'sesId', advId, keepSes);
  await pruneMissing(ACTS, 'actId', advId, keepActs);

  return { ok: true, advId: advId };
});

async function pruneMissing(coll, idKey, advId, keep) {
  try {
    const q = await wixData.query(coll).eq('advId', advId).limit(1000).find({ suppressAuth: true });
    for (const row of q.items) {
      if (!keep[row[idKey]]) { try { await wixData.remove(coll, row._id, { suppressAuth: true }); } catch (e) {} }
    }
  } catch (e) {}
}

export const migrateCampaign = webMethod(Permissions.Anyone, async (campaignId) => {
  if (!campaignId) return { ok: false, error: 'no campaign' };
  const id = await memberId();
  const camp = await wixData.get(CAMPAIGNS, campaignId, { suppressAuth: true }).catch(() => null);
  if (!camp) return { ok: false, error: 'campaign not found' };
  if (camp.ownerMemberId && id && camp.ownerMemberId !== id) {
    if (!(await mayKeep(id, campaignId, camp.ownerMemberId))) return { ok: false, error: 'owned by another member' };
  }
  const data = unpackCampaignData(jparse(camp.data, {}));
  const acts = Array.isArray(data.acts) ? data.acts : [];
  const advId = campaignId; // keep the same id so members, players, stages still resolve

  await saveAdventureRoot(advId, {
    name: camp.name || data.name || 'Adventure',
    activeSceneId: data.activeSceneId || '',
    actOrder: acts.map(a => a.id),
    meta: { migratedFrom: campaignId, migratedAt: Date.now() }
  });

  let nScenes = 0;
  for (const a of acts) {
    await saveAdvAct(advId, a);
    for (const se of (a.sessions || [])) {
      await saveAdvSession(advId, a.id, se);
      for (const sc of (se.scenes || [])) {
        await saveAdvScene(advId, a.id, se.id, sc);
        nScenes++;
      }
    }
  }

  // stamp the source so a re-run is a no-op update and we can tell what has moved
  try { camp.migratedTo = advId; camp.migratedAt = Date.now(); await wixData.update(CAMPAIGNS, camp, { suppressAuth: true }); } catch (e) {}

  // read it back and count, so the caller can verify the round-trip
  const back = await loadAdventure(advId);
  const backScenes = (back && back.acts || []).reduce((n, a) => n + (a.sessions || []).reduce((m, s) => m + (s.scenes || []).length, 0), 0);
  return { ok: true, advId: advId, scenesWritten: nScenes, scenesReadBack: backScenes, clean: nScenes === backScenes };
});
