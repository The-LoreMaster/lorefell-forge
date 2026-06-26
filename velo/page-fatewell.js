// The FateWell page code.
// Point the Embed a Site element at the GitHub Pages copy of fatewell.html and set
// EMBED to its element ID. The campaign to open is taken from the page URL query
// campaignId. The tool requests forge, assets, and glossary on load; those are
// answered from canon Creations, an owner-scoped Assets collection, and a Glossary collection.

import { loadCampaign, saveCampaign, deleteCampaign, listMyCampaigns, getSealed, getForgeLibrary, listAssets, saveAsset, deleteAsset, listGlossary, getCampaignPlayers, detachCharacter, assignClue, setMemberRole, myAdventureRole } from 'backend/fatewell.web.js';
import { getFoePack } from 'backend/forge.web.js';
import { publishAdventure, myPublishedAdventures, unpublishAdventure, getPublishedPack } from 'backend/published.web.js';
import { createInvite, revokeInvite } from 'backend/invites.web.js';
import { uploadRune } from 'backend/loreforge.web.js';
import wixLocation from 'wix-location';

const EMBED = '#html1';   // change to your Embed a Site element ID


// Every uploaded image gets a unique media name so two uploads can never collide
// and overwrite each other (a same-name upload can replace the prior file).
function uniqName(base) {
  return String(base || 'img').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 40)
    + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// uploadRune can hand back a wix:image:// descriptor, which a plain <img> cannot load.
// Convert it to the static URL so covers render in the embed.
function toStaticImageUrl(u) {
  if (!u || typeof u !== 'string') return '';
  const m = u.match(/^wix:image:\/\/v1\/([^/]+)/);
  if (m) return 'https://static.wixstatic.com/media/' + m[1];
  return u;
}

// Cover images pasted as data URIs bloat the saved row past Wix's per-item size limit
// (WDE0009). Walk the campaign, push each inline image to media, and keep only a usable
// URL. Also repair any descriptor already stored from before this fix.
async function inlineCoverImages(node) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) node[i] = await inlineCoverImages(node[i]);
    return node;
  }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) node[k] = await inlineCoverImages(node[k]);
    return node;
  }
  if (typeof node === 'string' && node.indexOf('data:') === 0) {
    try { const url = await uploadRune(node, uniqName('cover')); return toStaticImageUrl(url); } catch (e) { return node; }
  }
  if (typeof node === 'string' && node.indexOf('wix:image://') === 0) {
    return toStaticImageUrl(node);
  }
  return node;
}

$w.onReady(() => {
  const embed = $w(EMBED);
  const campaignId = (wixLocation.query && wixLocation.query.campaignId) || '';

  embed.onMessage(async (event) => {
    const m = event.data;
    if (!m || typeof m !== 'object' || !m.type) return;

    if (m.type === 'lmtool-ready') {
      const importId = (wixLocation.query && wixLocation.query.import) || '';
      if (importId) {
        let pack = null;
        try { pack = await getPublishedPack(importId); } catch (e) { pack = null; }
        if (pack) embed.postMessage({ type: 'lmtool-import-pack', id: importId, pack: pack });
      }
      if (!campaignId) {
        // hub mode: hand the tool every adventure this member owns, so it can show,
        // edit, and keep persisting them, each stamped with this member as loremaster.
        let mine = [];
        try { mine = await listMyCampaigns(); } catch (e) { mine = []; }
        embed.postMessage({ type: 'lmtool-hosted', campaigns: mine });
        return;
      }
      let blob = null;
      try { blob = await loadCampaign(campaignId); } catch (e) { blob = null; }
      embed.postMessage({
        type: 'lmtool-open',
        campaignId: campaignId,
        title: (blob && blob.title) || 'Campaign',
        data: (blob && blob.data) ? { campaign: blob.data } : null,
        role: (blob && blob.role) || ''
      });
      let players = [];
      try { players = await getCampaignPlayers(campaignId, (blob && blob.title) || ''); } catch (e) { players = []; }
      if (players.length) embed.postMessage({ type: 'lmtool-players', campaignId: campaignId, players: players });
    } else if (m.type === 'lmtool-sync') {
      const list = Array.isArray(m.campaigns) ? m.campaigns : [];
      let saved = 0, owner = '';
      const errors = [];
      const slimmed = [];
      for (const it of list) {
        try {
          if (it.data && it.data.campaign) it.data.campaign = await inlineCoverImages(it.data.campaign);
          const r = await saveCampaign(it.id, it.data || {}, '');
          if (r && r.ok) { saved++; owner = r.owner || owner; if (it.data && it.data.campaign) slimmed.push({ id: it.id, campaign: it.data.campaign }); }
          else errors.push((r && (r.error || (r.skipped ? 'skipped: no campaign data' : 'not saved'))) || 'not saved');
        } catch (e) { errors.push(String(e)); }
      }
      embed.postMessage({ type: 'lmtool-sync-result', saved: saved, failed: list.length - saved, errors: errors.slice(0, 3), memberId: owner });
      if (slimmed.length) embed.postMessage({ type: 'lmtool-campaigns-slimmed', campaigns: slimmed });
    } else if (m.type === 'lmtool-players-request') {
      const cid = m.campaignId || campaignId;
      if (!cid) return;
      let players = [];
      try { players = await getCampaignPlayers(cid, ''); } catch (e) { players = []; }
      embed.postMessage({ type: 'lmtool-players', campaignId: cid, players: players });
    } else if (m.type === 'lmtool-set-role') {
      const cid = m.campaignId || campaignId;
      let res = null;
      try { res = await setMemberRole(cid, m.memberId, m.role); } catch (e) { res = null; }
      let players = [];
      try { players = await getCampaignPlayers(cid, ''); } catch (e) { players = []; }
      let myRole = '';
      try { myRole = await myAdventureRole(cid); } catch (e) { myRole = ''; }
      embed.postMessage({ type: 'lmtool-role-set', ok: !!(res && res.ok), transferred: !!(res && res.transferred), error: (res && res.error) || '', campaignId: cid });
      embed.postMessage({ type: 'lmtool-players', campaignId: cid, players: players });
      embed.postMessage({ type: 'lmtool-role', campaignId: cid, role: myRole });
    } else if (m.type === 'lmtool-publish') {
      let res = null;
      try {
        // Inline embedded data-URI images (cover art, NPC portraits) to media URLs so the
        // stored pack stays well under the per-document size limit.
        if (m.pack) m.pack = await inlineCoverImages(m.pack);
        res = await publishAdventure(m.title, m.blurb, m.pack, m.campaignId);
      } catch (e) { res = { ok: false, error: String(e) }; }
      embed.postMessage({ type: 'lmtool-publish-result', ok: !!(res && res.ok), updated: !!(res && res.updated), error: (res && res.error) || '' });
    } else if (m.type === 'lmtool-published-request') {
      let items = [];
      try { items = await myPublishedAdventures(); } catch (e) { items = []; }
      embed.postMessage({ type: 'lmtool-published-list', items: items });
    } else if (m.type === 'lmtool-unpublish') {
      let res = null;
      try { res = await unpublishAdventure(m.id); } catch (e) { res = { ok: false, error: String(e) }; }
      embed.postMessage({ type: 'lmtool-unpublish-result', ok: !!(res && res.ok), error: (res && res.error) || '' });
    } else if (m.type === 'lmtool-foepack-request') {
      let pack = null;
      try { pack = await getFoePack(); } catch (e) { pack = null; }
      embed.postMessage({ type: 'lmtool-foepack', pack: pack });
    } else if (m.type === 'lmtool-assign-clue') {
      let res = null;
      try { res = await assignClue(m.campaignId || campaignId, m.charIds || [], m.clue || {}); } catch (e) { res = null; }
      embed.postMessage({ type: 'lmtool-clue-assigned', ok: !!(res && res.ok), count: (res && res.count) || 0, handle: (m.clue && m.clue.handle) || '' });
    } else if (m.type === 'lmtool-save') {
      const cid = m.campaignId || campaignId;
      const hasCampaign = !!(m.data && m.data.campaign);
      if (!cid && !hasCampaign) return;  // local hub autosave with no chosen adventure: ignore
      try {
        if (m.data && m.data.campaign) m.data.campaign = await inlineCoverImages(m.data.campaign);
        const r = await saveCampaign(cid, m.data || {}, '');
        if (r && r.ok && m.data && m.data.campaign) {
          embed.postMessage({ type: 'lmtool-campaigns-slimmed', campaigns: [{ id: cid, campaign: m.data.campaign }] });
        }
      } catch (e) {}
    } else if (m.type === 'lmtool-campaign-delete') {
      let dres = { ok: false };
      try { dres = await deleteCampaign(m.campaignId); } catch (e) { dres = { ok: false, error: String(e) }; }
      embed.postMessage({ type: 'lmtool-campaign-deleted', campaignId: m.campaignId, ok: !!(dres && dres.ok) });
    } else if (m.type === 'lmtool-campaign-title') {
      try { await saveCampaign(m.campaignId || campaignId, null, m.title || ''); } catch (e) {}
    } else if (m.type === 'lmtool-forge-request') {
      let abilities = [];
      try { abilities = await getForgeLibrary(); } catch (e) { abilities = []; }
      embed.postMessage({ type: 'lmtool-forge', abilities: abilities });
    } else if (m.type === 'lmtool-assets-request') {
      let assets = [];
      try { assets = await listAssets(); } catch (e) { assets = []; }
      embed.postMessage({ type: 'lmtool-assets', assets: assets });
    } else if (m.type === 'lmtool-asset-save') {
      const asset = m.asset || {};
      if (asset.image && /^data:/.test(asset.image)) {
        try { asset.image = toStaticImageUrl(await uploadRune(asset.image, uniqName(asset.name || 'asset'))); } catch (e) { /* upload failed; keep the downscaled data URI so the image still persists */ }
      } else if (asset.image && asset.image.indexOf('wix:image://') === 0) {
        asset.image = toStaticImageUrl(asset.image);
      }
      let ares = { ok: false };
      try { ares = await saveAsset(asset); } catch (e) { ares = { ok: false }; }
      embed.postMessage({ type: 'lmtool-asset-saved', assetId: asset.assetId, image: asset.image, ok: !!(ares && ares.ok) });
    } else if (m.type === 'lmtool-asset-delete') {
      try { await deleteAsset(m.assetId); } catch (e) {}
    } else if (m.type === 'lmtool-glossary-request') {
      let glossary = [];
      try { glossary = await listGlossary(); } catch (e) { glossary = []; }
      embed.postMessage({ type: 'lmtool-glossary', glossary: glossary });
    } else if (m.type === 'lmtool-sealed-request') {
      let sealed = [];
      try { sealed = await getSealed(m.memberIds || [], m.names || [], m.charIds || []); } catch (e) { sealed = []; }
      embed.postMessage({ type: 'lmtool-sealed', sealed: sealed });
    } else if (m.type === 'lmtool-invite-create') {
      let url = '';
      try { const r = await createInvite(m.campaignId || campaignId); url = (r && r.url) || ''; } catch (e) { url = ''; }
      embed.postMessage({ type: 'lmtool-invite', url: url });
    } else if (m.type === 'lmtool-invite-revoke') {
      try { await revokeInvite(m.campaignId || campaignId); } catch (e) {}
    } else if (m.type === 'lmtool-detach') {
      try { await detachCharacter(m.charId); } catch (e) {}
    } else if (m.type === 'LOREFELL_FEEDBACK_SUBMIT') {
      console.log('FateWell feedback:', JSON.stringify(m.payload || {}));
    }
  });
});
