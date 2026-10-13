// The RelicForge page code.
// Relays a submission to the shared backend. The catalog lives on the character sheet and
// the votes in the LoreForge (Nate, 2026-10-13).
// Set EMBED to your Embed a Site element ID (Wix default is often #html1).

import { submitCreation } from 'backend/forge.web.js';
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

    if (msg.type === 'RELIC_SUBMIT') {
      const p = msg.payload || {};
      let imageUrl = '';
      if (p.image) {
        try { imageUrl = await uploadRune(p.image, uniqName(p.title || 'relic')); }
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
