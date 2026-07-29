// ============================================================================
// PROPOSED replacement for velo/backend/combat.web.js — paste this whole file.
//
// velo/ is guard-denied to agents, so this is carried in the repo instead of edited in
// place. Nothing here is live until it is pasted into Wix and published.
//
// WHAT CHANGED, and why each one has BOTH ends (F7's lesson: a write with no read is
// worse than nothing, because the diff looks complete while the feature stays dead):
//
//   1. resolveCombatPlacement  NEW. The loremaster resolved a placed utility, so the
//      marker is on the board and the placer's pack should now get lighter. Writes
//      `placed`. Read back by getCombatForChar (the sheet, which does the spending) and
//      by getCombatDeclares (the board, so it can tell after a reload).
//
//   2. syncCombatPlayer accepts `placedAck`. The sheet's acknowledgement that it has
//      spent that placement. Written here, read back by getCombatForChar.
//
//      It is written ONLY when non-empty. A sheet that has just reloaded has no ack in
//      memory; if an empty one were allowed to land it would erase the real one, the
//      placement would read as unspent, and the Fell would be charged for the same
//      Caltrops twice. Empty means "I have nothing to say", never "forget what I said".
//
// WHY AN ACK AT ALL, rather than a timestamp like pendingHit and chargeSet use. Those
// compare an `at` against a variable in the sheet's window, which a reload clears -
// re-showing a pending hit is harmless and re-applying a charge is idempotent because it
// is a set. Taking a utility OUT of an inventory is a decrement and is neither. So the
// guard has to be durable at both ends, and `placed.pid !== placedAck` is that guard with
// both halves in the same row.
//
// The pid is derived by the board from the declaration (Fell, round, utility), never
// minted from a clock, so it is stable across reads and both sides can name the same
// placement without either telling the other.
//
// COLLECTION FIELDS TO ADD to CombatPlayer, both Text:
//   placed      (Text)   JSON: {pid, util, squares, at}
//   placedAck   (Text)   the pid the sheet last spent
// An array or object does not fit a Wix TEXT field, which is why `places`, `defEva` and
// `plog` are all JSON strings already and why these two follow them.
// ============================================================================

// backend/combat.web.js
// Live combat sync between FateWell (the loremaster board) and FellGlass (player sheets).
// Two collections, both admin-read so the embeds never query directly:
//
//   CombatState   one row per campaign: the battle the loremaster is running.
//     campaignId (Text, indexed), active (Boolean), round (Number), phase (Text),
//     sceneId (Text), sceneName (Text), fighters (Text, JSON), spotlightChars (Text, JSON),
//     updatedAt (Number)
//
//   CombatPlayer  one row per campaign+character: a player's declaration plus any
//                 conditions the loremaster has landed on them.
//     campaignId (Text, indexed), charId (Text, indexed),
//     act (Text), react (Text), target (Text), round (Number), dmg (Number), base (Number), dt (Text), fellmark (Boolean), applies (Text), actTier (Number), chargeSet (Number), chargeSetAt (Number), charge (Number),
//     curVit (Number), maxVit (Number), affs (Text, JSON),
//     appliedByLm (Text, JSON), recapMsg (Text), recapAt (Number),
//     pendBase (Number), pendBonus (Number), pendDt (Text), pendingHitAt (Number), updatedAt (Number),
//     places (Text, JSON), placed (Text, JSON), placedAck (Text)
//
// Writes are field-merged, never whole-row replaced, so the player declaration and the
// loremaster's applied conditions do not clobber each other. Everything is additive.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';

function jparse(v, fb) { try { return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }

async function stateRow(campaignId) {
  const r = await wixData.query('CombatState').eq('campaignId', campaignId).limit(1).find({ suppressAuth: true });
  return r.items.length ? r.items[0] : null;
}
async function playerRow(campaignId, charId) {
  const r = await wixData.query('CombatPlayer').eq('campaignId', campaignId).eq('charId', charId).limit(1).find({ suppressAuth: true });
  return r.items.length ? r.items[0] : null;
}
async function charCampaign(charId) {
  const c = await wixData.get('Characters', charId, { suppressAuth: true }).catch(() => null);
  // The sheet stores its adventure id in `campaign`. If your Characters collection keeps
  // the campaign id elsewhere, adjust this single line.
  return c ? (c.campaignId || c.campaign || '') : '';
}

// FateWell -> publish the battle the loremaster is running (or clear it).
export const publishCombatState = webMethod(Permissions.Anyone, async (campaignId, state) => {
  if (!campaignId) return { ok: false };
  const s = state || {};
  const existing = await stateRow(campaignId);
  const row = existing || { campaignId: campaignId };
  row.active = !!s.active;
  row.round = s.round || 0;
  row.phase = s.phase || '';
  row.sceneId = s.sceneId || '';
  row.sceneName = s.sceneName || '';
  row.fighters = JSON.stringify(s.fighters || []);
  row.spotlightChars = JSON.stringify(s.spotlightChars || []);
  row.log = JSON.stringify(s.log || []);
  row.updatedAt = Date.now();
  try {
    if (existing) await wixData.update('CombatState', row, { suppressAuth: true });
    else await wixData.insert('CombatState', row, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false }; }
});

// FateWell -> push the conditions the loremaster has landed on one character.
export const applyCombatToChar = webMethod(Permissions.Anyone, async (campaignId, charId, applied, recap) => {
  if (!campaignId || !charId) return { ok: false };
  const existing = await playerRow(campaignId, charId);
  const row = existing || { campaignId: campaignId, charId: charId };
  row.appliedByLm = JSON.stringify(applied || []);
  if (recap && recap.at) { row.recapMsg = recap.msg || ''; row.recapAt = recap.at; }
  row.updatedAt = Date.now();
  try {
    if (existing) await wixData.update('CombatPlayer', row, { suppressAuth: true });
    else await wixData.insert('CombatPlayer', row, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false }; }
});

// FateWell -> read every player's declaration for a campaign.
export const getCombatDeclares = webMethod(Permissions.Anyone, async (campaignId) => {
  if (!campaignId) return [];
  const r = await wixData.query('CombatPlayer').eq('campaignId', campaignId).limit(50).find({ suppressAuth: true });
  return r.items.map((it) => ({
    charId: it.charId || '',
    act: it.act || '', react: it.react || '', target: it.target || '', places: jparse(it.places, []),
    round: it.round || 0, dmg: it.dmg || 0, base: it.base || 0, dt: it.dt || '', fellmark: !!it.fellmark, doubleFell: !!it.doubleFell, pierce: it.pierce || 0, applies: it.applies || '', actTier: (typeof it.actTier === 'number') ? it.actTier : -1,
    acc: it.acc || 0, roll: it.roll || 0, kind: it.kind || '', fellstrike: !!it.fellstrike, defEva: jparse(it.defEva, []), plog: jparse(it.plog, []),
    charge: it.charge || 0, curVit: it.curVit || 0, maxVit: it.maxVit || 0,
    affs: jparse(it.affs, []),
    gear: jparse(it.gear, null),
    // so the board can tell an already-resolved placement after its own page reloads,
    // rather than knowing it only from the marker tokens it happens to still be holding
    placed: jparse(it.placed, null)
  }));
});

// FateWell -> queue damage for a player to confirm on their own sheet (ownership rule).
export const dealDamageToChar = webMethod(Permissions.Anyone, async (campaignId, charId, base, bonus, dt) => {
  if (!campaignId || !charId) return { ok: false };
  const existing = await playerRow(campaignId, charId);
  const row = existing || { campaignId: campaignId, charId: charId };
  row.pendBase = Math.max(0, Number(base) || 0);
  row.pendBonus = Math.max(0, Number(bonus) || 0);
  row.pendDt = dt || 'phys';
  row.pendingHit = row.pendBase + row.pendBonus;
  row.pendingHitAt = Date.now();
  row.updatedAt = Date.now();
  try {
    if (existing) await wixData.update('CombatPlayer', row, { suppressAuth: true });
    else await wixData.insert('CombatPlayer', row, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false }; }
});

// FateWell -> the loremaster resolved a placed utility. The marker is on the board; this
// is what tells the placer's sheet to spend the thing out of their pack.
//
// No timestamp, deliberately. Every other signal here carries one so the sheet can tell a
// new one from the same one polled again, but a stamp would make this placement look new
// on every read and the one thing this must never do is fire twice. The pid is stable, and
// stability is what makes it comparable against the ack the sheet writes back.
export const resolveCombatPlacement = webMethod(Permissions.Anyone, async (campaignId, charId, placement) => {
  if (!campaignId || !charId) return { ok: false };
  const p = placement || {};
  if (!p.pid) return { ok: false };            // an unnamed placement cannot be acked
  const existing = await playerRow(campaignId, charId);
  const row = existing || { campaignId: campaignId, charId: charId };
  row.placed = JSON.stringify({
    pid: String(p.pid),
    util: p.util || '',
    squares: Math.max(0, Number(p.squares) || 0),
    at: Date.now()
  });
  row.updatedAt = Date.now();
  try {
    if (existing) await wixData.update('CombatPlayer', row, { suppressAuth: true });
    else await wixData.insert('CombatPlayer', row, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false }; }
});

// FateWell -> a player's attack landed, advance their shared charge (player sheet adopts it).
export const setCombatCharge = webMethod(Permissions.Anyone, async (campaignId, charId, value) => {
  if (!campaignId || !charId) return { ok: false };
  const existing = await playerRow(campaignId, charId);
  const row = existing || { campaignId: campaignId, charId: charId };
  row.chargeSet = Math.max(0, Math.min(3, Number(value) || 0));
  row.chargeSetAt = Date.now();
  row.updatedAt = Date.now();
  try {
    if (existing) await wixData.update('CombatPlayer', row, { suppressAuth: true });
    else await wixData.insert('CombatPlayer', row, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false }; }
});

// FellGlass -> the battle this character is in, plus any conditions landed on them.
export const getCombatForChar = webMethod(Permissions.Anyone, async (charId) => {
  if (!charId) return null;
  const campaignId = await charCampaign(charId);
  if (!campaignId) return null;
  const st = await stateRow(campaignId);
  if (!st || !st.active) return { active: false };
  const pr = await playerRow(campaignId, charId);
  return {
    active: true,
    round: st.round || 0, phase: st.phase || '',
    sceneId: st.sceneId || '', sceneName: st.sceneName || '',
    fighters: jparse(st.fighters, []),
    spotlightChars: jparse(st.spotlightChars, []),
    log: jparse(st.log, []),
    you: pr ? { act: pr.act || '', react: pr.react || '', target: pr.target || '', places: jparse(pr.places, []) } : {},
    applied: pr ? jparse(pr.appliedByLm, []) : [],
    recap: pr ? { msg: pr.recapMsg || '', at: pr.recapAt || 0 } : { msg: '', at: 0 },
    pendingHit: pr ? { base: pr.pendBase || 0, bonus: pr.pendBonus || 0, dt: pr.pendDt || 'phys', at: pr.pendingHitAt || 0 } : { base: 0, bonus: 0, dt: 'phys', at: 0 },
    chargeSet: pr ? { value: pr.chargeSet || 0, at: pr.chargeSetAt || 0 } : { value: 0, at: 0 },
    // The read half of resolveCombatPlacement, and of the sheet's own ack. These two go
    // together or neither is any use: the sheet spends when placed.pid differs from
    // placedAck, so serving one without the other would make a double-spend impossible to
    // see from here and perfectly possible at the table.
    placed: pr ? jparse(pr.placed, null) : null,
    placedAck: pr ? (pr.placedAck || '') : ''
  };
});

// FellGlass -> a player's live vitality, charge, and conditions changed mid-combat.
// Merges only those fields, leaving the declaration and any applied conditions intact.
export const syncCombatPlayer = webMethod(Permissions.Anyone, async (charId, snap) => {
  if (!charId) return { ok: false };
  const campaignId = await charCampaign(charId);
  if (!campaignId) return { ok: false };
  const s = snap || {};
  const existing = await playerRow(campaignId, charId);
  const row = existing || { campaignId: campaignId, charId: charId };
  if (typeof s.curVit === 'number') row.curVit = s.curVit;
  if (typeof s.maxVit === 'number') row.maxVit = s.maxVit;
  if (typeof s.charge === 'number') row.charge = s.charge;
  if (Array.isArray(s.affs)) row.affs = JSON.stringify(s.affs);
  if (Array.isArray(s.defEva)) row.defEva = JSON.stringify(s.defEva);
  if (Array.isArray(s.plog)) row.plog = JSON.stringify(s.plog);
  if (s.gear && typeof s.gear === 'object') row.gear = JSON.stringify(s.gear);
  // The sheet acknowledging a placement it has spent. Written only when NON-EMPTY: a sheet
  // that has just reloaded has no ack in memory, and letting an empty one land would erase
  // the real one and charge the Fell for the same Caltrops twice. Empty means "nothing to
  // say", not "forget what I said".
  if (typeof s.placedAck === 'string' && s.placedAck) row.placedAck = s.placedAck;
  row.updatedAt = Date.now();
  try {
    if (existing) await wixData.update('CombatPlayer', row, { suppressAuth: true });
    else await wixData.insert('CombatPlayer', row, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false }; }
});

// FellGlass -> a player declares their turn.
export const saveCombatDeclare = webMethod(Permissions.Anyone, async (charId, decl) => {
  if (!charId) return { ok: false };
  const campaignId = await charCampaign(charId);
  if (!campaignId) return { ok: false };
  const d = decl || {};
  const existing = await playerRow(campaignId, charId);
  const row = existing || { campaignId: campaignId, charId: charId };
  row.act = d.act || '';
  row.react = d.react || '';
  row.target = d.target || '';
  row.places = JSON.stringify(Array.isArray(d.places) ? d.places : []);
  row.round = typeof d.round === 'number' ? d.round : 0;
  row.dmg = typeof d.dmg === 'number' ? d.dmg : 0;
  row.base = typeof d.base === 'number' ? d.base : 0;
  row.dt = d.dt || '';
  row.fellmark = !!d.fellmark;
  row.applies = d.applies || '';
  row.doubleFell = !!d.doubleFell;
  row.pierce = typeof d.pierce === 'number' ? d.pierce : 0;
  row.actTier = (typeof d.actTier === 'number') ? d.actTier : -1;
  row.acc = typeof d.acc === 'number' ? d.acc : 0;
  row.roll = typeof d.roll === 'number' ? d.roll : 0;
  row.kind = d.kind || '';
  row.fellstrike = !!d.fellstrike;
  row.charge = typeof d.charge === 'number' ? d.charge : 0;
  row.curVit = typeof d.curVit === 'number' ? d.curVit : 0;
  row.maxVit = typeof d.maxVit === 'number' ? d.maxVit : 0;
  row.affs = JSON.stringify(d.affs || []);
  row.updatedAt = Date.now();
  try {
    if (existing) await wixData.update('CombatPlayer', row, { suppressAuth: true });
    else await wixData.insert('CombatPlayer', row, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false }; }
});
