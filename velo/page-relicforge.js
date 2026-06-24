// The RelicForge page code.
// Relays the live catalog read and relic submissions to the shared backend.
// Set EMBED to your Embed a Site element ID (Wix default is often #html1).

import { submitCreation, getCreations, getCatalog } from 'backend/forge.web.js';
import { uploadRune } from 'backend/loreforge.web.js';
import { currentMember } from 'wix-members-frontend';

const FORGE_KEY = 'relicforge';
const EMBED = '#html1';

function relicFullText(p) {
  const f = p.form || {};
  const head = [f.group || 'Relic', f.use || '', f.rarity || ''].filter(Boolean).join(', ');
  const line2 = ['Cost: ' + (f.cost || 'unset'), 'Uses: ' + (f.uses || 'unset')].join('   ');
  return [head, line2, '', f.description || ''].join('\n');
}

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'RELIC_LIBRARY_LOAD') {
      let canon = [];
      try {
        const rows = await getCatalog('Relics', { limit: 400 });
        canon = (rows || []).map(function (r) {
          return {
            n: r.name || '', g: r.group || 'Other', u: r.use || '',
            c: r.cost || '', x: r.uses || '', d: r.description || '',
            image: r.image || '', canon: true
          };
        });
      } catch (e) { canon = []; }

      let community = [];
      try {
        const subs = await getCreations(FORGE_KEY, { kind: 'relic', limit: 200 });
        community = (subs || []).map(function (it) {
          let m = {};
          try { m = (JSON.parse(it.payload || '{}').meta) || {}; } catch (e) {}
          return {
            n: it.creationName || '', g: m.group || 'Other', u: m.use || '',
            c: m.cost || '', x: m.uses || '', d: m.description || it.fullText || '',
            image: it.imageUrl || '', by: it.creatorName || m.creator || '',
            canon: it.canonStatus === 'canon', id: it.creationId || ''
          };
        });
      } catch (e) { community = []; }

      embed.postMessage({ type: 'RELIC_LIBRARY', relics: canon.concat(community) });
      return;
    }

    if (msg.type === 'RELIC_SUBMIT') {
      const p = msg.payload || {};
      let imageUrl = '';
      if (p.image) {
        try { imageUrl = await uploadRune(p.image, p.title || 'relic'); }
        catch (e) { imageUrl = ''; }
      }
      let creator = '';
      try { const me = await currentMember.getMember(); if (me) creator = (me.profile && me.profile.nickname) || ''; }
      catch (e) {}
      const f = p.form || {};
      const payload = {
        kind: 'relic',
        title: String(p.title || '').slice(0, 120),
        tier: p.tier || f.rarity || 'Common',
        shorthand: [f.group || 'Relic', f.use || ''].filter(Boolean).join(', '),
        fullText: relicFullText(p),
        imageUrl: imageUrl,
        selections: [],
        meta: {
          group: f.group || '', use: f.use || '', cost: f.cost || '',
          uses: f.uses || '', rarity: f.rarity || '', description: f.description || '',
          creator: creator
        }
      };
      let res = { ok: false, errors: ['The forge could not reach the vault.'] };
      try { res = await submitCreation(FORGE_KEY, payload); }
      catch (e) { res = { ok: false, errors: ['The forge could not reach the vault. Try again.'] }; }
      embed.postMessage({ type: 'RELIC_SUBMIT_RESULT', ok: !!res.ok, creationId: res.creationId || '', errors: res.errors || [] });
    }
  });
});
