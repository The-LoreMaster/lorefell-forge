// The FellGlass (character sheet) page code.
// Point the Embed a Site element at the GitHub Pages copy of fellglass.html and set
// EMBED to its element ID. The character to show is taken from the page URL query
// charId, which your character list page sets when a player taps a character.
//
// The sheet's bridge lives in backend/fgSheetBridge.js and is shared with ThreadSpire,
// which embeds the same sheet in its rail. This page supplies only what is particular
// to running the sheet on its own: it tracks charId, it opens the forge for an unbuilt
// Fell (initNeedsCreated), it bounces an entry that already has a character to the
// table, and it navigates when the sheet asks for ThreadSpire.

import { listMyCharacters, myAdventures, loadCharacter, saveCharacter, deleteCharacter, leaveAdventure } from 'backend/characters.web.js';
import { getClueCards, listQuests } from 'backend/fatewell.web.js';
import { getCombatForChar, saveCombatDeclare, syncCombatPlayer } from 'backend/combat.web.js';
import { getLibraries } from 'backend/libraries.web.js';
import { handleSheetMessage } from 'backend/fgSheetBridge.js';
import wixLocation from 'wix-location';

const EMBED = '#html1';   // change to your Embed a Site element ID

const api = {
  listMyCharacters, myAdventures, loadCharacter, saveCharacter, deleteCharacter,
  leaveAdventure, getClueCards, listQuests, getCombatForChar, saveCombatDeclare,
  syncCombatPlayer, getLibraries
};

$w.onReady(() => {
  const embed = $w(EMBED);
  let charId = (wixLocation.query && wixLocation.query.charId) || '';

  embed.onMessage(async (event) => {
    await handleSheetMessage(event.data, {
      reply: (obj) => embed.postMessage(obj),
      getCharId: () => charId,
      setCharId: (id) => { charId = id; },
      api: api,
      // Standalone, an unbuilt Fell should open the forge rather than a blank sheet.
      initNeedsCreated: true,
      // Site entry with an existing character heads to the table; the sheet lives in
      // ThreadSpire's rail now. Returning true stops the bridge, since we navigated.
      onReady: async (list) => {
        if (!charId && list.length) {
          try { wixLocation.to('/the-threadspire?character=' + encodeURIComponent(list[0].id)); return true; } catch (e) {}
        }
        return false;
      },
      onThreadspireOpen: (m) => {
        const c = encodeURIComponent(m.charId || '');
        const cp = m.campaignId ? '&campaign=' + encodeURIComponent(m.campaignId) : '';
        try { wixLocation.to('/the-threadspire?character=' + c + cp); } catch (e) {}
      },
      onFeedback: (payload) => { console.log('FellGlass feedback:', JSON.stringify(payload)); }
    });
  });
});
