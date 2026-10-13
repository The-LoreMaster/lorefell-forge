// The FellForge page code.
// Point the Embed a Site element's ID at EMBED below (Wix default is often #html1),
// and set its URL to the GitHub Pages copy of fellforge.html.
// FellForge ships its own library. On "ready", a Fell forged for an adventure (?campaign=)
// is sent the lineages that adventure's LoreMaster assigned in ThreadSpire, Forged for this
// adventure. The page relays the Archive call and the forging, then sends the player to
// FellGlass to finish the Fell.

import { generateProfile, saveFell } from 'backend/fellforge.web.js';
import { getLibraries } from 'backend/libraries.web.js';
import wixLocation from 'wix-location';

const EMBED = '#html1';   // change to your Embed a Site element ID

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'ready') {
      const campaignId = (wixLocation.query && wixLocation.query.campaign) || '';
      if (!campaignId) return;
      try {
        const lib = await getLibraries({ campaignId: campaignId });
        const mine = ((lib && lib.forged && lib.forged.lineages) || []).filter((l) => l && l.adv && l.name);
        if (mine.length) embed.postMessage({ type: 'init', forgedLineages: mine.map((l) => ({ name: l.name, desc: l.desc || '' })) });
      } catch (e) {}
    } else if (msg.type === 'generate') {
      const reqId = msg.reqId;
      try {
        const profile = await generateProfile(msg.character || {});
        embed.postMessage({ type: 'profile', reqId: reqId, profile: profile });
      } catch (e) {
        embed.postMessage({ type: 'profileError', reqId: reqId, message: 'The Archive did not answer. Retry in a moment.' });
      }
    } else if (msg.type === 'submit') {
      try {
        const campaignId = (wixLocation.query && wixLocation.query.campaign) || '';
        const saved = await saveFell(Object.assign({}, msg.record || {}, campaignId ? { campaignId: campaignId } : {}));
        const id = (saved && saved.id) || '';
        embed.postMessage({ type: 'submitOk', id: id });
        // The forge does not build the arsenal. FellGlass finishes creation from the forged
        // seed (starting weapon, armor or lorebound, then identity), so go there now.
        if (id) { try { wixLocation.to('/the-fellglass?charId=' + encodeURIComponent(id)); } catch (e) {} }
      } catch (e) {
        embed.postMessage({ type: 'submitError', message: 'The forging failed. Try again.' });
      }
    } else if (msg.type === 'LOREFELL_FEEDBACK_SUBMIT') {
      // No feedback collection yet. Logged for now, wire a collection later if wanted.
      console.log('FellForge feedback:', JSON.stringify(msg.payload || {}));
    }
  });
});
