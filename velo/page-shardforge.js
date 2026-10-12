// The ShardForge page code.
// Set the Embed a Site element ID to match EMBED below (Wix default is often #html1).
// The tool is self-contained for its UI. The page only relays a submission to the shared
// backend. It validates nothing itself, the backend does that. The catalogs live on the
// character sheet and the votes in the LoreForge (Nate, 2026-10-12).

import { submitCreation } from 'backend/forge.web.js';

const FORGE_KEY = 'shardforge';
const EMBED = '#html1';   // change to your Embed a Site element ID

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

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
          lore: p.lore || ''
        }
      };
      let res = { ok: false, errors: ['The forge could not reach the vault.'] };
      try { res = await submitCreation(FORGE_KEY, payload); }
      catch (e) { res = { ok: false, errors: ['The forge could not reach the vault. Try again.'] }; }
      embed.postMessage({ type: 'SHARD_SUBMIT_RESULT', ok: !!res.ok, errors: res.errors || [] });

    }
  });
});
