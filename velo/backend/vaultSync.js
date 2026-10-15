// Synced adventures: an adventure whose master copy lives in the vault (Adventures/ in
// lorefell-fellguide), built into a pack by scripts/adventureFromVault.js.
//
// The vault's copy rides on the adventure's root row, in meta.vaultSync, and is laid over the
// stored tree every time the adventure loads. So the vault decides the prep (names, notes,
// scenes, beats, their order) and the table keeps its play (ticked beats, the log, battle,
// loot, pinned and posted beats, foes as they stand). A prep edit made in either tool is not
// kept: the next load lays the vault's copy back over it. That is the lock, and it holds
// whichever save path a tool uses, because it sits on the one path every tool loads through.
//
// Nothing here touches the database. adventures.web.js reads and writes; this decides.

export const VAULT_KEY = 'vaultSync';

// The flags a load adds to the campaign. They are worked out at load, never stored.
const LOAD_FLAGS = ['synced', 'vaultPath', 'vaultAt'];

// A scene's prep, owned by the vault. Everything else on a scene is the table's.
const SCENE_PREP = ['id', 'name', 'prep', 'img', 'desc', 'entries', 'order', 'crucible', 'location'];
// A beat's prep. Anything else a beat carries (pinned, open, posted, qStatus) is the table's.
const BEAT_PREP = ['id', 'type', 'kind', 'title', 'body', 'speaker', 'handle', 'img'];
// The adventure's own prep, at the top of the campaign.
const ROOT_PREP = ['name', 'desc', 'notes', 'type', 'world', 'worldId', 'worldName', 'level', 'img'];

// A picture the vault has wins; where the vault has none, the table keeps its own, so a cover
// added in a tool is never blanked by a vault page that names no picture.
function pick(o, keys) { const out = {}; keys.forEach((k) => { if (o && o[k] !== undefined && !(k === 'img' && !o[k])) out[k] = o[k]; }); return out; }
function byId(list) { const m = {}; (list || []).forEach((x) => { if (x && x.id != null) m[String(x.id)] = x; }); return m; }

// What a write keeps: the stored vault copy survives any write that did not mean to change it,
// and the load flags are never stored.
export function keepVault(prevMeta, nextMeta) {
  let prev = prevMeta;
  if (typeof prev === 'string') { try { prev = JSON.parse(prev); } catch (e) { prev = {}; } }
  const out = Object.assign({}, nextMeta || {});
  delete out[VAULT_KEY];
  LOAD_FLAGS.forEach((k) => { delete out[k]; });
  if (prev && prev[VAULT_KEY]) out[VAULT_KEY] = prev[VAULT_KEY];
  return out;
}

// A beat list from the vault, carrying the table's own marks on each beat it still has.
function mergeBeats(vaultEntries, storedList, asKind) {
  const stored = byId(storedList);
  return (vaultEntries || []).map((e) => {
    const prep = pick(e, BEAT_PREP);
    if (asKind) { prep.kind = e.type || e.kind || 'general'; delete prep.type; }
    else { prep.type = e.type || e.kind || 'general'; delete prep.kind; }
    const had = stored[String(e.id)] || {};
    const play = {}; Object.keys(had).forEach((k) => { if (BEAT_PREP.indexOf(k) < 0 || (k === 'img' && !prep.img)) play[k] = had[k]; });
    return Object.assign({ pinned: false, open: false }, play, prep);
  });
}

// One scene: the vault's prep over the table's play. Foes the vault places are added once; a
// foe the LoreMaster removed at the table stays removed, and one they added stays.
export function mergeScene(stored, vs) {
  const base = Object.assign({}, vs, stored || {}, pick(vs, SCENE_PREP));
  base.entries = mergeBeats(vs.entries, stored && (stored.entries || stored.beats), false);
  base.beats = mergeBeats(vs.entries, stored && (stored.beats || stored.entries), true);
  const seeded = Array.isArray(stored && stored.vaultSeeded) ? stored.vaultSeeded.slice() : [];
  const cbs = Array.isArray(stored && stored.combatants) ? stored.combatants.slice() : [];
  const have = {}; cbs.forEach((c) => { if (c && c.id != null) have[String(c.id)] = 1; });
  (vs.combatants || []).forEach((c) => {
    const id = String(c.id);
    if (seeded.indexOf(id) >= 0) return;
    seeded.push(id);
    if (!have[id]) cbs.push(Object.assign({}, c));
  });
  base.combatants = cbs;
  base.vaultSeeded = seeded;
  return base;
}

// The whole adventure: the vault's acts, sessions and scenes in the vault's order, each scene
// carrying the play of the stored scene with the same id. A scene the vault no longer has is
// gone, since the vault is the master copy.
export function overlayCampaign(stored, vaultCampaign, info) {
  const vc = vaultCampaign || {};
  const scenes = {};
  ((stored && stored.acts) || []).forEach((a) => (a.sessions || []).forEach((se) => (se.scenes || []).forEach((sc) => { if (sc && sc.id != null) scenes[String(sc.id)] = sc; })));
  const actsStored = byId(stored && stored.acts);
  const sesStored = {};
  ((stored && stored.acts) || []).forEach((a) => (a.sessions || []).forEach((se) => { if (se && se.id != null) sesStored[String(se.id)] = se; }));
  const acts = (vc.acts || []).map((a) => {
    const act = Object.assign({}, actsStored[String(a.id)] || {}, a);
    act.sessions = (a.sessions || []).map((se) => {
      const ses = Object.assign({}, sesStored[String(se.id)] || {}, se);
      ses.scenes = (se.scenes || []).map((vs) => mergeScene(scenes[String(vs.id)], vs));
      return ses;
    });
    return act;
  });
  const out = Object.assign({}, stored || {}, pick(vc, ROOT_PREP), { acts: acts, synced: true });
  if (info && info.path) out.vaultPath = info.path;
  if (info && info.at) out.vaultAt = info.at;
  const sceneIds = {}; acts.forEach((a) => a.sessions.forEach((se) => se.scenes.forEach((sc) => { sceneIds[String(sc.id)] = 1; })));
  if (out.activeSceneId && !sceneIds[String(out.activeSceneId)]) out.activeSceneId = '';
  return out;
}

// A pack is a vault pack this module will take: the right format, from the vault, with an id.
export function vaultPackProblem(pack) {
  if (!pack || !pack.meta || pack.meta.format !== 'lorefell-adventure-pack-1') return 'That is not a LoreFell adventure pack.';
  if (pack.meta.source !== 'vault') return 'That pack was not built from the vault.';
  const c = pack.campaign;
  if (!c || !c.id || !Array.isArray(c.acts)) return 'The pack has no adventure in it.';
  if (c.synced !== true) return 'The adventure is not marked synced in the vault.';
  return '';
}

// A short fingerprint of what a pack carries (the adventure, its foes and characters, never
// when it was built), so a sync that brings nothing new writes nothing.
export function packSig(pack) {
  const text = JSON.stringify({ c: pack && pack.campaign, f: pack && pack.foes, n: pack && pack.npcs });
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16) + ':' + text.length;
}

