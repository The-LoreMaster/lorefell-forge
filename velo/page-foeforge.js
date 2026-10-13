// FoeForge page code.
// The builder reads abilities, infusions, augmentations and relics, and the member's adventures.
// Save writes the foe to the Foe library ThreadSpire reads (Assets, through saveAsset), in the
// row ThreadSpire writes, so it opens there whole (Nate, 2026-10-12). The Pentifax is gone.
// Set EMBED to your Embed a Site element ID.

import { getCreations, getCatalog, buildLegalAct, getFoePack } from 'backend/forge.web.js';
import { getForgePools, listMyCampaigns, saveAsset } from 'backend/fatewell.web.js';
import { submitFoeToPentifax } from 'backend/forge.web.js';
import { uploadRune } from 'backend/loreforge.web.js';

const FORGE_KEY = 'foeforge';
const EMBED = '#html1';
const TIER_MIN = { 1: 1, 2: 3, 3: 5 };

function live(rows) {
  return (rows || []).filter(function (r) { return r.canonStatus === 'submitted' || r.canonStatus === 'canon'; });
}
function meta(r) { try { return (JSON.parse(r.payload || '{}').meta) || {}; } catch (e) { return {}; }
}
function payloadOf(r) { try { return JSON.parse(r.payload || '{}'); } catch (e) { return {}; } }
function dedupeByName(arr) {
  const seen = {}, out = [];
  arr.forEach(function (x) { const k = (x.name || '').toLowerCase(); if (k && !seen[k]) { seen[k] = 1; out.push(x); } });
  return out;
}

// Every uploaded image gets a unique media name so two uploads can never collide
// and overwrite each other (a same-name upload can replace the prior file).
function uniqName(base) {
  return String(base || 'img').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 40)
    + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'FOE_PACK_REQUEST') {
      let pack = null;
      try { pack = await getFoePack(); } catch (e) { pack = null; }
      embed.postMessage({ type: 'FOE_PACK', pack: pack });
      return;
    }
    if (msg.type === 'FOE_LIBRARY_LOAD') {
      let infOff = [], augOff = [], infSub = [], augSub = [], abilRows = [];
      try { infOff = await getCatalog('Infusions', { limit: 500 }); } catch (e) {}
      try { augOff = await getCatalog('Augmentations', { limit: 500 }); } catch (e) {}
      try { infSub = live(await getCreations('shardforge', { kind: 'infusion', limit: 300 })); } catch (e) {}
      try { augSub = live(await getCreations('shardforge', { kind: 'augmentation', limit: 300 })); } catch (e) {}
      try { abilRows = live(await getCreations('sigilforge', { limit: 500 })); } catch (e) {}

      const infusions = dedupeByName(
        infOff.map(function (r) { return { name: r.name, family: r.attribute || '', type: '', effect: r.effect || '', status: 'canon' }; })
          .concat(infSub.map(function (r) { const m = meta(r); return { name: r.creationName, family: m.category || '', type: '', effect: r.shorthand || '', status: r.canonStatus }; }))
      );
      const augmentations = dedupeByName(
        augOff.map(function (r) { return { name: r.name, type: r.core ? 'Core' : 'Non-Core', effect: r.effect || '', status: 'canon' }; })
          .concat(augSub.map(function (r) { return { name: r.creationName, type: 'Non-Core', effect: r.shorthand || '', status: r.canonStatus }; }))
      );
      const abilities = dedupeByName(
        abilRows.map(function (r) {
          const pl = payloadOf(r);
          const tier = Number(pl.tier) || 1;
          const cost = (pl.cost != null ? Number(pl.cost) : (TIER_MIN[tier] || 1));
          return { name: r.creationName, tier: tier, cost: cost, effect: r.fullText || r.shorthand || '', status: r.canonStatus };
        })
      );

      let relics = [], campaigns = [];
      try { relics = ((await getForgePools()) || {}).items || []; } catch (e) { relics = []; }
      try { campaigns = (await listMyCampaigns()) || []; } catch (e) { campaigns = []; }
      embed.postMessage({ type: 'FOE_LIBRARY', library: { infusions: infusions, augmentations: augmentations, abilities: abilities,
        relics: relics.map(function (r) { return { name: r.name, rule: r.rule || '' }; }),
        campaigns: campaigns.map(function (c) { return { id: c._id || c.id || c.campaignId || '', title: c.title || c.name || '' }; }) } });
      return;
    }

    if (msg.type === 'FOE_BUILD_ACTS') {
      const list = (msg.payload && msg.payload.abilities) || [];
      let existing = [];
      try { existing = await getCreations('sigilforge', { limit: 500 }); } catch (e) {}
      const byname = {};
      existing.forEach(function (r) { byname[String(r.creationName || '').toLowerCase()] = r; });
      const results = [];
      for (const a of list) {
        const key = String(a.name || '').toLowerCase();
        if (byname[key]) {
          const r = byname[key]; const pl = payloadOf(r);
          results.push({ name: r.creationName, ok: true, inLoreForge: true, creationId: r.creationId,
            tier: Number(pl.tier) || a.tier, cost: (pl.cost != null ? Number(pl.cost) : a.tier),
            effect: r.fullText || r.shorthand || '', status: r.canonStatus });
          continue;
        }
        let built = null;
        try { built = await buildLegalAct(a.tier, a.type, a.flavor); } catch (e) { built = null; }
        if (!built || !built.ok) { results.push({ name: a.name, ok: false, inLoreForge: false, tier: a.tier, cost: a.tier, effect: '' }); continue; }
        const payload = built.payload;
        payload.title = String(a.name || '').slice(0, 120);
        payload.creatorNote = String(a.description || '').slice(0, 400);
        payload.meta = { tier: a.tier, cost: built.cost, type: payload.kind, description: a.description || '', source: 'foeforge' };
        results.push({ name: a.name, ok: true, inLoreForge: false, tier: a.tier, cost: built.cost, effect: built.effect, status: 'local', payload: payload });
      }
      embed.postMessage({ type: 'FOE_ACTS_BUILT', results: results });
      return;
    }

    if (msg.type === 'FOE_SAVE') {
      const asset = (msg.payload && msg.payload.asset) || null;
      let res = { ok: false, error: 'Nothing to save.' };
      if (asset && asset.assetId) {
        // A picture rides as a media URL: a base64 data URI would push the row past its size limit.
        if (asset.image && String(asset.image).indexOf('data:') === 0) {
          try { asset.image = await uploadRune(asset.image, uniqName(asset.name || 'foe')); }
          catch (e) { asset.image = ''; }
        }
        try { res = await saveAsset(asset); }
        catch (e) { res = { ok: false, error: String((e && e.message) || e) }; }
      }
      // the Pentifax box: once the foe is in the library, put it before the vote (once per foe),
      // and keep the entry on the library row so neither tool offers it again
      let pentifax = null;
      if (res && res.ok && msg.payload && msg.payload.pentifax) {
        try { pentifax = await submitFoeToPentifax(asset); } catch (e) { pentifax = { ok: false, errors: ['The Pentifax could not be reached.'] }; }
        if (pentifax && (pentifax.ok || pentifax.already)) {
          try {
            const fm = JSON.parse(asset.foeMeta || '{}'); fm.pentifaxId = pentifax.creationId || 'submitted';
            asset.foeMeta = JSON.stringify(fm); await saveAsset(asset);
          } catch (e) {}
        }
      }
      embed.postMessage({ type: 'FOE_SAVED', ok: !!(res && res.ok), error: (res && res.error) || '', pentifax: pentifax });
      return;
    }
  });
});
