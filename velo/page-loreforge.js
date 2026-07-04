// LoreForge page code.
// The hall of every forge: all community creations across all types, with the
// Pentifax vote. Reads through getGallery, votes through castVote with each
// row's own forgeKey. Set EMBED to your Embed a Site element ID.

import { getGallery, castVote } from 'backend/forge.web.js';

const EMBED = '#html1';

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const m = event && event.data;
    if (!m || !m.type) return;

    if (m.type === 'LOREFORGE_GALLERY') {
      const p = m.payload || {};
      try {
        const r = await getGallery({
          forgeKey: p.forgeKey || '',
          excludeForgeKey: p.excludeForgeKey || '',
          canonStatus: p.canonStatus || '',
          sort: p.sort || 'votes',
          limit: p.limit || 12,
          skip: p.skip || 0
        });
        embed.postMessage({ type: 'LOREFORGE_ROWS', rows: (r && r.rows) || [], total: (r && r.total) || 0, skip: p.skip || 0 });
      } catch (e) {
        embed.postMessage({ type: 'LOREFORGE_ROWS', rows: [], total: 0, skip: 0 });
      }
      return;
    }

    if (m.type === 'LOREFORGE_VOTE') {
      const p = m.payload || {};
      try {
        const r = await castVote(p.forgeKey, p.creationId);
        embed.postMessage({
          type: 'LOREFORGE_VOTE_RESULT',
          creationId: p.creationId,
          ok: !!(r && r.ok),
          voteCount: (r && r.voteCount) || 0,
          already: !!(r && r.already),
          signin: !!(r && r.signin),
          error: (r && r.error) || ''
        });
      } catch (e) {
        embed.postMessage({ type: 'LOREFORGE_VOTE_RESULT', creationId: p.creationId, ok: false, error: 'The vote could not be saved.' });
      }
      return;
    }
  });
});
