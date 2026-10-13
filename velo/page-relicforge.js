// The RelicForge page code.
// Saves the relic to the maker's own shelf (ThreadSpire: a foe's kit, or a gift to a player's
// Fell), and when asked submits it to the LoreForge for the vote as well (Nate, 2026-10-13).
// Set EMBED to your Embed a Site element ID (Wix default is often #html1).

import { submitCreation } from 'backend/forge.web.js';
import { saveRelic } from 'backend/fatewell.web.js';
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
      let saved = { ok: false, error: 'The forge could not reach the vault. Try again.' };
      try { saved = await saveRelic(Object.assign({ name: payload.title, imageUrl: imageUrl }, payload.meta)); }
      catch (e) { saved = { ok: false, error: 'The forge could not reach the vault. Try again.' }; }
      if (!saved || !saved.ok) {
        embed.postMessage({ type: 'RELIC_SUBMIT_RESULT', ok: false, errors: [(saved && saved.error) || 'The relic did not save. Try again.'] });
        return;
      }
      let loreforge = null;
      if (p.loreforge) {
        try { loreforge = await submitCreation(FORGE_KEY, payload); }
        catch (e) { loreforge = { ok: false, errors: ['The LoreForge could not be reached. Try again.'] }; }
        loreforge = { ok: !!(loreforge && loreforge.ok), creationId: (loreforge && loreforge.creationId) || '', errors: (loreforge && loreforge.errors) || [] };
      }
      embed.postMessage({ type: 'RELIC_SUBMIT_RESULT', ok: true, updated: !!saved.updated, loreforge: loreforge });
    }
  });
});
