// The FellForge page code.
// Point the Embed a Site element's ID at EMBED below (Wix default is often #html1),
// and set its URL to the GitHub Pages copy of fellforge.html.
// FellForge ships its own library, so "ready" needs no init reply. The page only
// relays the Archive call and the forging.

import { generateProfile, saveFell } from 'backend/fellforge.web.js';
import wixLocation from 'wix-location';

const EMBED = '#html1';   // change to your Embed a Site element ID

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'generate') {
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
        await saveFell(Object.assign({}, msg.record || {}, campaignId ? { campaignId: campaignId } : {}));
        embed.postMessage({ type: 'submitOk' });
      } catch (e) {
        embed.postMessage({ type: 'submitError', message: 'The forging failed. Try again.' });
      }
    } else if (msg.type === 'LOREFELL_FEEDBACK_SUBMIT') {
      // No feedback collection yet. Logged for now, wire a collection later if wanted.
      console.log('FellForge feedback:', JSON.stringify(msg.payload || {}));
    }
  });
});
