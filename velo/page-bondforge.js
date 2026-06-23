// The BondForge page code.
// Relays submission, ledger reads, and votes to the shared backend.
// Set EMBED to your Embed a Site element ID (Wix default is often #html1).

import { submitCreation, getCreations, castVote } from 'backend/forge.web.js';
import { uploadRune } from 'backend/loreforge.web.js';
import { currentMember } from 'wix-members-frontend';

const FORGE_KEY = 'bondforge';
const EMBED = '#html1';

function bondFullText(p) {
  const lines = [];
  if (p.aspectName) lines.push('Aspect: ' + p.aspectName);
  if (p.initial) lines.push('Initial. ' + p.initial);
  const br = Array.isArray(p.branches) ? p.branches.filter(Boolean) : [];
  const cr = Array.isArray(p.crowns) ? p.crowns.filter(Boolean) : [];
  if (br.length) lines.push('Branching, keep one: ' + br.join(' OR '));
  if (cr.length) lines.push('Crown, keep one: ' + cr.join(' OR '));
  return lines.join('\n');
}

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'BOND_SUBMIT') {
      const p = msg.payload || {};
      let imageUrl = '';
      if (p.image) {
        try { imageUrl = await uploadRune(p.image, p.name || 'lorebound'); }
        catch (e) { imageUrl = ''; }
      }
      const payload = {
        kind: 'bond',
        title: String(p.name || '').slice(0, 120),
        shorthand: String(p.initial || ''),
        fullText: bondFullText(p),
        imageUrl: imageUrl,
        selections: [],
        meta: {
          world: p.world || '',
          role: p.role || '',
          archetype: p.archetype || '',
          aspectName: p.aspectName || '',
          initial: p.initial || '',
          branches: Array.isArray(p.branches) ? p.branches : [],
          crowns: Array.isArray(p.crowns) ? p.crowns : [],
          creator: p.creator || ''
        }
      };
      let res = { ok: false, errors: ['The forge could not reach the vault.'] };
      try { res = await submitCreation(FORGE_KEY, payload); }
      catch (e) { res = { ok: false, errors: ['The forge could not reach the vault. Try again.'] }; }
      embed.postMessage({ type: 'BOND_SUBMIT_RESULT', ok: !!res.ok, errors: res.errors || [] });

    } else if (msg.type === 'BOND_LOAD_LEDGER') {
      const p = msg.payload || {};
      const scope = p.scope || 'all';
      const opts = { limit: 60, kind: 'bond' };
      if (scope === 'canon') opts.canonStatus = 'canon';
      if (scope === 'mine') {
        try { const me = await currentMember.getMember(); if (me) opts.creatorMemberId = me._id; }
        catch (e) {}
      }
      let items = [];
      try { items = await getCreations(FORGE_KEY, opts); } catch (e) { items = []; }
      embed.postMessage({ type: 'BOND_LEDGER_RESULT', scope: scope, items: items });

    } else if (msg.type === 'BOND_VOTE') {
      const id = msg.payload && msg.payload.creationId;
      let r = { ok: false };
      try { r = await castVote(FORGE_KEY, id); }
      catch (e) { r = { ok: false, error: 'The vote could not reach the vault.' }; }
      embed.postMessage({ type: 'BOND_VOTE_RESULT', creationId: id, ok: !!r.ok, voteCount: r.voteCount, already: !!r.already, signin: !!r.signin, error: r.error || '' });
    }
  });
});
