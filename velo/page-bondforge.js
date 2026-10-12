// The BondForge page code.
// Relays a submission to the shared backend. The catalog lives on the character sheet and
// the votes in the LoreForge (Nate, 2026-10-12).
// Set EMBED to your Embed a Site element ID (Wix default is often #html1).

import { submitCreation } from 'backend/forge.web.js';
import { uploadRune } from 'backend/loreforge.web.js';

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

    if (msg.type === 'BOND_SUBMIT') {
      const p = msg.payload || {};
      let imageUrl = '';
      if (p.image) {
        try { imageUrl = await uploadRune(p.image, uniqName(p.name || 'lorebound')); }
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
          aspectName: p.aspectName || '',
          initial: p.initial || '',
          branches: Array.isArray(p.branches) ? p.branches : [],
          crowns: Array.isArray(p.crowns) ? p.crowns : []
        }
      };
      let res = { ok: false, errors: ['The forge could not reach the vault.'] };
      try { res = await submitCreation(FORGE_KEY, payload); }
      catch (e) { res = { ok: false, errors: ['The forge could not reach the vault. Try again.'] }; }
      embed.postMessage({ type: 'BOND_SUBMIT_RESULT', ok: !!res.ok, errors: res.errors || [] });

    }
  });
});
