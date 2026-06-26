// FoeForge page code.
// Submit routes to the Pentifax, the foe canon hall (Creations, kind foe).
// The builder reads abilities, infusions, and augmentations, both official and submitted.
// Set EMBED to your Embed a Site element ID.

import { submitCreation, getCreations, getCatalog, castVote, buildLegalAct, saveFoe, myFoes, deleteFoe, getFoePack } from 'backend/forge.web.js';
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

      embed.postMessage({ type: 'FOE_LIBRARY', library: { infusions: infusions, augmentations: augmentations, abilities: abilities } });
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

    if (msg.type === 'FOE_SEND_ACT') {
      const payload = (msg.payload && msg.payload.act) || null;
      const name = (msg.payload && msg.payload.name) || (payload && payload.title) || '';
      let ok = false, cid = '';
      if (payload) {
        try {
          const ex = await getCreations('sigilforge', { limit: 500 });
          const hit = ex.find(function (r) { return String(r.creationName || '').toLowerCase() === String(name).toLowerCase(); });
          if (hit) { ok = true; cid = hit.creationId; }
        } catch (e) {}
        if (!cid) {
          try { const res = await submitCreation('sigilforge', payload); ok = !!(res && res.ok); cid = (res && res.creationId) || ''; } catch (e) {}
        }
      }
      embed.postMessage({ type: 'FOE_ACT_SENT', name: name, ok: ok, creationId: cid });
      return;
    }

    if (msg.type === 'FOE_SAVE') {
      let res = { ok: false };
      const p = msg.payload || {};
      try {
        // The image rides inside the saved payload JSON. A base64 data URI would push the
        // row past the per-document size limit, so upload it to a media URL first. This is
        // the same step the submit path already takes.
        if (p.image && String(p.image).indexOf('data:') === 0) {
          try { p.image = await uploadRune(p.image, uniqName(p.name || 'foe')); }
          catch (e) { p.image = ''; }
        }
        res = await saveFoe(p);
      } catch (e) {
        res = { ok: false, errors: [String((e && e.message) || e)] };
      }
      embed.postMessage({ type: 'FOE_SAVED', ok: !!res.ok, foeId: res.foeId || '', errors: res.errors || [] });
      return;
    }

    if (msg.type === 'FOE_LOAD_MINE') {
      let items = [];
      try { items = await myFoes(); } catch (e) { items = []; }
      embed.postMessage({ type: 'FOE_MINE', items: items });
      return;
    }

    if (msg.type === 'FOE_DELETE') {
      const id = msg.payload && msg.payload.foeId;
      let res = { ok: false };
      try { res = await deleteFoe(id); } catch (e) { res = { ok: false }; }
      embed.postMessage({ type: 'FOE_DELETED', ok: !!res.ok, foeId: id });
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
      if (p.image) { try { imageUrl = await uploadRune(p.image, uniqName(p.name || 'foe')); } catch (e) { imageUrl = ''; } }
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
