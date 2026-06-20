// Wix page code for the SigilForge page.
// Add an HTML element to the page, set its id to match the selector below, and set its
// URL to the GitHub Pages embed:
//   https://the-loremaster.github.io/lorefell-forge/forgemaster.html?forge=sigilforge
// Then paste this into the page code panel. Change '#html1' to your element id.

import { getForgeDefinition, submitCreation } from 'backend/forge.jsw';

$w.onReady(() => {
  const box = $w('#html1');

  box.onMessage(async (event) => {
    const m = event.data || {};

    if (m.type === 'FORGE_READY') {
      try {
        const def = await getForgeDefinition(m.forgeKey || 'sigilforge');
        box.postMessage({ type: 'FORGE_DEFINITION', definition: def });
      } catch (e) {
        box.postMessage({ type: 'FORGE_DEFINITION', definition: null, error: String(e) });
      }
    }

    if (m.type === 'FORGE_SUBMIT') {
      const res = await submitCreation(m.forgeKey, m.payload, m.ownerMemberId);
      box.postMessage({ type: 'FORGE_SUBMIT_RESULT', ...res });
    }
  });
});
