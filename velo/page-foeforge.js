// FoeForge page code.
// Submit routes to the Pentifax, the foe canon hall (Creations, kind foe).
// The builder reads abilities, infusions, and augmentations, both official and submitted.
// Set EMBED to your Embed a Site element ID.

import { submitCreation, getCreations, getCatalog, castVote } from 'backend/forge.web.js';
import { currentMember } from 'wix-members-frontend';
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
  if (p.description) lines.push(p.description);
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

      embed.postMessage({ type: 'FOE_LIBRARY', library: { infusions: infusions, augmentations: augmentations, abilities: abilities } });
      return;
    }

    if (msg.type === 'FOE_NEW_ABILITIES') {
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
          results.push({ name: r.creationName, ok: true, existed: true, creationId: r.creationId,
            tier: Number(pl.tier) || a.tier, cost: (pl.cost != null ? Number(pl.cost) : a.cost),
            effect: r.fullText || r.shorthand || a.effect, status: r.canonStatus });
          continue;
        }
        const kind = a.type === 'spell' ? 'spell' : 'ability';
        const payload = { kind: kind, authored: true, tier: a.tier, form: 1, cost: a.cost,
          title: String(a.name || '').slice(0, 120),
          shorthand: 'T' + a.tier + ' ' + kind, fullText: a.effect || '', selections: [],
          meta: { tier: a.tier, cost: a.cost, type: kind, description: a.description || '', source: 'foeforge' } };
        let cid = '', ok = false;
        try { const res = await submitCreation('sigilforge', payload); ok = !!(res && res.ok); cid = (res && res.creationId) || ''; } catch (e) {}
        results.push({ name: a.name, ok: ok, existed: false, creationId: cid, tier: a.tier, cost: a.cost, effect: a.effect, status: 'submitted' });
      }
      embed.postMessage({ type: 'FOE_ABILITIES_RESULT', results: results });
      return;
    }

    if (msg.type === 'FOE_LOAD_LEDGER') {
      const scope = (msg.payload && msg.payload.scope) || 'all';
      const opts = { kind: 'foe', limit: 60 };
      if (scope === 'canon') opts.canonStatus = 'canon';
      if (scope === 'mine') { try { const me = await currentMember.getMember(); if (me) opts.creatorMemberId = me._id; } catch (e) {} }
      let items = [];
      try { items = await getCreations(FORGE_KEY, opts); } catch (e) { items = []; }
      embed.postMessage({ type: 'FOE_LEDGER_RESULT', scope: scope, items: items });
      return;
    }

    if (msg.type === 'FOE_VOTE') {
      const id = msg.payload && msg.payload.creationId;
      let r = { ok: false };
      try { r = await castVote(FORGE_KEY, id); } catch (e) { r = { ok: false }; }
      embed.postMessage({ type: 'FOE_VOTE_RESULT', creationId: id, ok: !!r.ok, voteCount: r.voteCount, already: !!r.already, signin: !!r.signin });
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
          acts: p.acts || [], shatterRating: p.shatterRating || '',
          description: p.description || ''
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
