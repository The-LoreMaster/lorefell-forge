// FoeForge page code.
// Submit routes to the Pentifax, the foe canon hall (Creations, kind foe).
// The builder reads abilities, infusions, and augmentations, both official and submitted.
// Set EMBED to your Embed a Site element ID.

import { submitCreation, getCreations, getCatalog } from 'backend/forge.web.js';
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

function foeFullText(p) {
  const lines = [];
  lines.push((p.shatterRating || '') + ' ' + (p.build || '') + ', ' + (p.stance || '') + ' stance.');
  if (p.signatureAffliction) lines.push('Signature: ' + p.signatureAffliction + '.');
  if ((p.infusions || []).length) lines.push('Infusions: ' + p.infusions.join(', ') + '.');
  if ((p.augmentations || []).length) lines.push('Augmentations: ' + p.augmentations.join(', ') + '.');
  if ((p.acts || []).length) lines.push('Acts: ' + p.acts.map(function (a) { return 'T' + a.tier + ' ' + a.name; }).join(', ') + '.');
  return lines.join('\n');
}

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'FOE_LIBRARY_LOAD') {
      let infOff = [], augOff = [], infSub = [], augSub = [], abilRows = [];
      try { infOff = await getCatalog('Infusions', { limit: 500 }); } catch (e) {}
      try { augOff = await getCatalog('Augmentations', { limit: 500 }); } catch (e) {}
      try { infSub = live(await getCreations('shardforge', { kind: 'infusion', limit: 300 })); } catch (e) {}
      try { augSub = live(await getCreations('shardforge', { kind: 'augmentation', limit: 300 })); } catch (e) {}
      try { abilRows = live(await getCreations('sigilforge', { limit: 500 })); } catch (e) {}

      const infusions = dedupeByName(
        infOff.map(function (r) { return { name: r.name, family: r.attribute || '', type: '', effect: r.effect || '' }; })
          .concat(infSub.map(function (r) { const m = meta(r); return { name: r.creationName, family: m.category || '', type: '', effect: r.shorthand || '' }; }))
      );
      const augmentations = dedupeByName(
        augOff.map(function (r) { return { name: r.name, type: r.core ? 'Core' : 'Non-Core', effect: r.effect || '' }; })
          .concat(augSub.map(function (r) { return { name: r.creationName, type: 'Non-Core', effect: r.shorthand || '' }; }))
      );
      const abilities = dedupeByName(
        abilRows.map(function (r) {
          const pl = payloadOf(r);
          const tier = Number(pl.tier) || 1;
          const cost = (pl.cost != null ? Number(pl.cost) : (TIER_MIN[tier] || 1));
          return { name: r.creationName, tier: tier, cost: cost, effect: r.shorthand || '' };
        })
      );

      embed.postMessage({ type: 'FOE_LIBRARY', library: { infusions: infusions, augmentations: augmentations, abilities: abilities } });
      return;
    }

    if (msg.type === 'FOE_SUBMIT') {
      const p = msg.payload || {};
      let imageUrl = '';
      if (p.image) { try { imageUrl = await uploadRune(p.image, p.name || 'foe'); } catch (e) { imageUrl = ''; } }
      const payload = {
        kind: 'foe',
        title: String(p.name || '').slice(0, 120),
        shorthand: (p.shatterRating || '') + ' ' + (p.build || ''),
        fullText: foeFullText(p),
        imageUrl: imageUrl,
        selections: [],
        meta: {
          hall: 'pentifax',
          build: p.build || '', stance: p.stance || '',
          signatureAffliction: p.signatureAffliction || '',
          infusions: p.infusions || [], augmentations: p.augmentations || [],
          acts: p.acts || [], shatterRating: p.shatterRating || ''
        }
      };
      let res = { ok: false, errors: ['The forge could not reach the Pentifax.'] };
      try { res = await submitCreation(FORGE_KEY, payload); }
      catch (e) { res = { ok: false, errors: ['The forge could not reach the Pentifax. Try again.'] }; }
      embed.postMessage({ type: 'FOE_SUBMIT_RESULT', ok: !!res.ok, errors: res.errors || [] });
      return;
    }
  });
});
