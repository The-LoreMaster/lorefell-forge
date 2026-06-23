// The ShardForge page code.
// Set the Embed a Site element ID to match EMBED below (Wix default is often #html1).
// The tool is self-contained for its UI. The page only relays submission, ledger reads,
// and votes to the shared backend. It validates nothing itself, the backend does that.

import { submitCreation, getCreations, getCatalog, castVote } from 'backend/forge.web.js';
import { currentMember } from 'wix-members-frontend';

const FORGE_KEY = 'shardforge';
const EMBED = '#html1';   // change to your Embed a Site element ID

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'CATALOG_LOAD') {
      const side = (msg.payload && msg.payload.side) || 'infusion';
      const coll = side === 'augmentation' ? 'Augmentations' : 'Infusions';
      let rows = [];
      try { rows = await getCatalog(coll, { limit: 500 }); } catch (e) { rows = []; }
      const items = rows.map(function (r) {
        return {
          name: r.name || '',
          cat: side === 'augmentation' ? (r.domain || '') : (r.attribute || ''),
          desc: r.effect || '',
          core: side === 'augmentation' ? !!r.core : false,
          lore: r.lore || ''
        };
      });
      embed.postMessage({ type: 'CATALOG_RESULT', side: side, items: items });
      return;
    }

    if (msg.type === 'SHARD_SUBMIT') {
      const p = msg.payload || {};
      const side = p.side === 'augmentation' ? 'augmentation' : 'infusion';
      const payload = {
        kind: side,
        title: String(p.name || '').slice(0, 120),
        shorthand: String(p.effect || ''),
        fullText: String(p.effect || '') + (p.lore ? '\n\n' + p.lore : ''),
        selections: [],
        meta: {
          side: side,
          category: p.category || '',
          lore: p.lore || '',
          submittedBy: p.submittedBy || ''
        }
      };
      let res = { ok: false, errors: ['The forge could not reach the vault.'] };
      try { res = await submitCreation(FORGE_KEY, payload); }
      catch (e) { res = { ok: false, errors: ['The forge could not reach the vault. Try again.'] }; }
      embed.postMessage({ type: 'SHARD_SUBMIT_RESULT', ok: !!res.ok, errors: res.errors || [] });

    } else if (msg.type === 'SHARD_LOAD_LEDGER') {
      const p = msg.payload || {};
      const scope = p.scope || 'all';
      const opts = { limit: 60, kind: p.side === 'augmentation' ? 'augmentation' : 'infusion' };
      if (scope === 'canon') opts.canonStatus = 'canon';
      if (scope === 'mine') {
        try { const me = await currentMember.getMember(); if (me) opts.creatorMemberId = me._id; }
        catch (e) {}
      }
      let items = [];
      try { items = await getCreations(FORGE_KEY, opts); } catch (e) { items = []; }
      embed.postMessage({ type: 'SHARD_LEDGER_RESULT', scope: scope, items: items });

    } else if (msg.type === 'SHARD_VOTE') {
      const id = msg.payload && msg.payload.creationId;
      let r = { ok: false };
      try { r = await castVote(FORGE_KEY, id); }
      catch (e) { r = { ok: false, error: 'The vote could not reach the vault.' }; }
      embed.postMessage({ type: 'SHARD_VOTE_RESULT', creationId: id, ok: !!r.ok, voteCount: r.voteCount, already: !!r.already, signin: !!r.signin, error: r.error || '' });
    }
  });
});
