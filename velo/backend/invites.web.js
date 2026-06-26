// backend/invites.web.js
// Adventure invites. The loremaster mints one reusable, revocable link per adventure.
// A player opens it, signs in, and attaches their own characters. A character holds one
// adventure at a time, so attaching to a new one replaces the old link. Membership is
// recorded on redeem so a player who has not forged yet still appears on the roster.
// The status field is set active now; player-issued invites with loremaster approval
// will reuse it (status pending) without a repaint.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const SITE_URL = 'https://lorefell.com';
const JOIN_PATH = '/join';

function token() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10));
}
async function memberId() {
  try { const m = await currentMember.getMember(); return m ? m._id : ''; } catch (e) { return ''; }
}
async function memberName() {
  try {
    const m = await currentMember.getMember();
    if (!m) return 'Player';
    const p = m.profile || {};
    if (p.nickname) return p.nickname;
    const c = m.contactDetails || {};
    const full = [c.firstName, c.lastName].filter(Boolean).join(' ');
    return full || p.title || (m.loginEmail || '').split('@')[0] || 'Player';
  } catch (e) { return 'Player'; }
}

// Mint a fresh link for an adventure, deactivating any earlier one.
export const createInvite = webMethod(Permissions.Anyone, async (campaignId) => {
  const mid = await memberId();
  if (!mid || !campaignId) return { ok: false };
  try {
    const prior = await wixData.query('CampaignInvites').eq('campaignId', campaignId).eq('active', true).limit(50).find({ suppressAuth: true });
    for (const row of prior.items) { row.active = false; await wixData.update('CampaignInvites', row, { suppressAuth: true }); }
    const t = token();
    await wixData.insert('CampaignInvites', { token: t, campaignId: campaignId, ownerMemberId: mid, active: true, createdAt: new Date().toISOString() }, { suppressAuth: true });
    return { ok: true, token: t, url: SITE_URL + JOIN_PATH + '?t=' + t };
  } catch (e) { return { ok: false, error: String(e) }; }
});

export const revokeInvite = webMethod(Permissions.Anyone, async (campaignId) => {
  const mid = await memberId();
  if (!mid || !campaignId) return { ok: false };
  try {
    const prior = await wixData.query('CampaignInvites').eq('campaignId', campaignId).eq('active', true).limit(50).find({ suppressAuth: true });
    for (const row of prior.items) { row.active = false; await wixData.update('CampaignInvites', row, { suppressAuth: true }); }
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Open the link: validate the token, record membership, return the adventure name so the
// join page can greet the player. Requires a signed-in member.
export const redeemInvite = webMethod(Permissions.Anyone, async (tok) => {
  const mid = await memberId();
  if (!mid) return { ok: false, signin: true };
  if (!tok) return { ok: false };
  try {
    const inv = await wixData.query('CampaignInvites').eq('token', tok).eq('active', true).limit(1).find({ suppressAuth: true });
    if (!inv.items.length) return { ok: false, invalid: true };
    const campaignId = inv.items[0].campaignId;
    let name = 'this adventure', ownerMemberId = '';
    try { const c = await wixData.get('Campaigns', campaignId, { suppressAuth: true }); if (c) { if (c.name) name = c.name; ownerMemberId = c.ownerMemberId || ''; } } catch (e) {}
    const isOwner = !!ownerMemberId && ownerMemberId === mid;
    // The loremaster runs the adventure and is not a player member. Only non-owners who
    // redeem the link become members, and only members may attach a character.
    if (!isOwner) {
      const ex = await wixData.query('AdventureMembers').eq('campaignId', campaignId).eq('memberId', mid).limit(1).find({ suppressAuth: true });
      if (!ex.items.length) {
        await wixData.insert('AdventureMembers', { campaignId: campaignId, memberId: mid, name: await memberName(), status: 'active', joinedAt: new Date().toISOString() }, { suppressAuth: true });
      }
    }
    return { ok: true, campaignId: campaignId, campaignName: name, isOwner: isOwner };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// The signed-in member's characters, with their current adventure link so the join page
// can show what is already attached elsewhere.
export const listJoinCharacters = webMethod(Permissions.Anyone, async () => {
  const mid = await memberId();
  if (!mid) return [];
  try {
    const r = await wixData.query('Characters').eq('ownerMemberId', mid).limit(200).find({ suppressAuth: true });
    return r.items.map((it) => {
      let lvl = 1;
      try { const d = typeof it.data === 'string' ? JSON.parse(it.data) : (it.data || {}); lvl = Number(d.level || (d.identity && d.identity.level)) || 1; } catch (e) {}
      return { charId: it._id, name: it.charName || '', level: lvl, campaignId: it.campaignId || '' };
    }).filter((c) => c.name);
  } catch (e) { return []; }
});

// Attach one of the member's own characters to the adventure. Owner checked. A single
// link field means this also detaches it from any other adventure.
export const attachCharacter = webMethod(Permissions.Anyone, async (campaignId, charId) => {
  const mid = await memberId();
  if (!mid || !campaignId || !charId) return { ok: false };
  try {
    const row = await wixData.get('Characters', charId, { suppressAuth: true });
    if (!row || row.ownerMemberId !== mid) return { ok: false, denied: true };
    // A character joins a campaign only through the invite. Membership is recorded on
    // redeem, so without it there is no attaching, even to a campaign you own.
    const mem = await wixData.query('AdventureMembers').eq('campaignId', campaignId).eq('memberId', mid).limit(1).find({ suppressAuth: true });
    if (!mem.items.length) return { ok: false, denied: true, error: 'Join through the invite link first.' };
    row.campaignId = campaignId;
    await wixData.update('Characters', row, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

export const detachOwnCharacter = webMethod(Permissions.Anyone, async (charId) => {
  const mid = await memberId();
  if (!mid || !charId) return { ok: false };
  try {
    const row = await wixData.get('Characters', charId, { suppressAuth: true });
    if (!row || row.ownerMemberId !== mid) return { ok: false, denied: true };
    row.campaignId = '';
    await wixData.update('Characters', row, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});
