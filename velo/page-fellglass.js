// The FellGlass (character sheet) page code.
// Point the Embed a Site element at the GitHub Pages copy of fellglass.html and set
// EMBED to its element ID. The character to show is taken from the page URL query
// charId, which your character list page sets when a player taps a character.

import { loadCharacter, saveCharacter } from 'backend/characters.web.js';
import wixLocation from 'wix-location';

const EMBED = '#html1';   // change to your Embed a Site element ID

$w.onReady(() => {
  const embed = $w(EMBED);
  let charId = (wixLocation.query && wixLocation.query.charId) || '';

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'ready') {
      if (!charId) { embed.postMessage({ type: 'new' }); return; }
      let res = null;
      try { res = await loadCharacter(charId); } catch (e) { res = null; }
      if (res && res.forged) {
        // Forged Fell, not yet built. Open creation pre-filled with the forged identity.
        embed.postMessage({ type: 'new', forge: res.seed || {} });
      } else if (res && res.character && res.character.created) {
        embed.postMessage({ type: 'init', character: res.character });
      } else {
        embed.postMessage({ type: 'new' });
      }
    } else if (msg.type === 'save') {
      try {
        const r = await saveCharacter(charId, msg.character || {});
        if (r && r.ok && r.id && !charId) charId = r.id;
      } catch (e) {}
    } else if (msg.type === 'LOREFELL_FEEDBACK_SUBMIT') {
      console.log('FellGlass feedback:', JSON.stringify(msg.payload || {}));
    }
  });
});
