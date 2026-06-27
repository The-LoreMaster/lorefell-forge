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
//     pendBase (Number), pendBonus (Number), pendDt (Text), pendingHitAt (Number), updatedAt (Number)
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
  return c ? (c.campaign || '') : '';
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
    act: it.act || '', react: it.react || '', target: it.target || '',
    round: it.round || 0, dmg: it.dmg || 0, base: it.base || 0, dt: it.dt || '', fellmark: !!it.fellmark, doubleFell: !!it.doubleFell, applies: it.applies || '', actTier: (typeof it.actTier === 'number') ? it.actTier : -1,
    charge: it.charge || 0, curVit: it.curVit || 0, maxVit: it.maxVit || 0,
    affs: jparse(it.affs, [])
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
    you: pr ? { act: pr.act || '', react: pr.react || '', target: pr.target || '' } : {},
    applied: pr ? jparse(pr.appliedByLm, []) : [],
    recap: pr ? { msg: pr.recapMsg || '', at: pr.recapAt || 0 } : { msg: '', at: 0 },
    pendingHit: pr ? { base: pr.pendBase || 0, bonus: pr.pendBonus || 0, dt: pr.pendDt || 'phys', at: pr.pendingHitAt || 0 } : { base: 0, bonus: 0, dt: 'phys', at: 0 },
    chargeSet: pr ? { value: pr.chargeSet || 0, at: pr.chargeSetAt || 0 } : { value: 0, at: 0 }
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
  row.round = typeof d.round === 'number' ? d.round : 0;
  row.dmg = typeof d.dmg === 'number' ? d.dmg : 0;
  row.base = typeof d.base === 'number' ? d.base : 0;
  row.dt = d.dt || '';
  row.fellmark = !!d.fellmark;
  row.applies = d.applies || '';
  row.doubleFell = !!d.doubleFell;
  row.actTier = (typeof d.actTier === 'number') ? d.actTier : -1;
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
