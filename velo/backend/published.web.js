// backend/published.web.js
// The published-adventure library. A loremaster publishes a snapshot of their adventure
// as an importable pack; anyone can browse the list and import their own editable copy.
// 'title' is fine here as a custom field on this collection; the list never returns the
// heavy pack, only metadata, so browsing stays light.
import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

async function me() {
  try { const m = await currentMember.getMember(); return m ? m._id : ''; } catch (e) { return ''; }
}
async function myName() {
  try {
    const m = await currentMember.getMember({ fieldsets: ['FULL'] });
    if (!m) return '';
    const ci = m.contactDetails || {};
    const full = [ci.firstName, ci.lastName].filter(Boolean).join(' ');
    return full || m.profile && m.profile.nickname || m.loginEmail || '';
  } catch (e) { return ''; }
}

// Publish, or update an existing publish of the same source adventure by the same author.
export const publishAdventure = webMethod(Permissions.SiteMember, async (title, blurb, pack, sourceCampaignId) => {
  const mid = await me();
  if (!mid) return { ok: false, error: 'You need to be signed in.' };
  if (!pack || !pack.campaign) return { ok: false, error: 'Nothing to publish.' };
  const row = {
    title: String(title || pack.campaign.name || 'Adventure'),
    blurb: String(blurb || ''),
    authorName: await myName(),
    authorMemberId: mid,
    sourceCampaignId: String(sourceCampaignId || ''),
    pack: JSON.stringify(pack),
    publishedAt: new Date().toISOString()
  };
  try {
    let existing = null;
    if (sourceCampaignId) {
      const ex = await wixData.query('PublishedAdventures')
        .eq('authorMemberId', mid).eq('sourceCampaignId', String(sourceCampaignId))
        .limit(1).find({ suppressAuth: true });
      if (ex.items.length) existing = ex.items[0];
    }
    if (existing) { row._id = existing._id; await wixData.update('PublishedAdventures', row, { suppressAuth: true }); return { ok: true, id: existing._id, updated: true }; }
    const saved = await wixData.insert('PublishedAdventures', row, { suppressAuth: true });
    return { ok: true, id: saved._id };
  } catch (e) { return { ok: false, error: String(e) }; }
});

export const unpublishAdventure = webMethod(Permissions.SiteMember, async (id) => {
  const mid = await me();
  if (!mid || !id) return { ok: false };
  try {
    const row = await wixData.get('PublishedAdventures', id, { suppressAuth: true }).catch(() => null);
    if (!row) return { ok: true, already: true };
    if (row.authorMemberId !== mid) return { ok: false, error: 'Not yours to unpublish.' };
    await wixData.remove('PublishedAdventures', id, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Light list for the directory: metadata only, never the pack.
export const listPublishedAdventures = webMethod(Permissions.Anyone, async () => {
  try {
    const r = await wixData.query('PublishedAdventures').descending('publishedAt').limit(200).find({ suppressAuth: true });
    return r.items.map((it) => ({
      id: it._id, title: it.title || 'Adventure', blurb: it.blurb || '',
      author: it.authorName || '', publishedAt: it.publishedAt || ''
    }));
  } catch (e) { return []; }
});

// The author's own published adventures, so FateWell can show what is live and let them update or pull it.
export const myPublishedAdventures = webMethod(Permissions.Anyone, async () => {
  const mid = await me();
  if (!mid) return [];
  try {
    const r = await wixData.query('PublishedAdventures').eq('authorMemberId', mid).limit(200).find({ suppressAuth: true });
    return r.items.map((it) => ({ id: it._id, title: it.title || 'Adventure', sourceCampaignId: it.sourceCampaignId || '', publishedAt: it.publishedAt || '' }));
  } catch (e) { return []; }
});

// The full pack for one published adventure, used when a member imports their own copy.
export const getPublishedPack = webMethod(Permissions.Anyone, async (id) => {
  if (!id) return null;
  try {
    const row = await wixData.get('PublishedAdventures', id, { suppressAuth: true }).catch(() => null);
    if (!row || !row.pack) return null;
    let pack = null; try { pack = JSON.parse(row.pack); } catch (e) { pack = null; }
    return pack;
  } catch (e) { return null; }
});
