// The FateWell page code.
// Point the Embed a Site element at the GitHub Pages copy of fatewell.html and set
// EMBED to its element ID. The campaign to open is taken from the page URL query
// campaignId. The tool requests forge, assets, and glossary on load; those are
// answered with empty sets until their collections are wired (see TODO below).

import { loadCampaign, saveCampaign, getSealed } from 'backend/fatewell.web.js';
import wixLocation from 'wix-location';

const EMBED = '#html1';   // change to your Embed a Site element ID

$w.onReady(() => {
  const embed = $w(EMBED);
  const campaignId = (wixLocation.query && wixLocation.query.campaignId) || '';

  embed.onMessage(async (event) => {
    const m = event.data;
    if (!m || typeof m !== 'object' || !m.type) return;

    if (m.type === 'lmtool-ready') {
      if (!campaignId) return;  // no campaign chosen: tool stays in its own list
      let blob = null;
      try { blob = await loadCampaign(campaignId); } catch (e) { blob = null; }
      embed.postMessage({
        type: 'lmtool-open',
        campaignId: campaignId,
        title: (blob && blob.title) || 'Campaign',
        data: (blob && blob.data) ? { campaign: blob.data } : null
      });
    } else if (m.type === 'lmtool-save') {
      try { await saveCampaign(m.campaignId || campaignId, m.data || {}, ''); } catch (e) {}
    } else if (m.type === 'lmtool-campaign-title') {
      try { await saveCampaign(m.campaignId || campaignId, null, m.title || ''); } catch (e) {}
    } else if (m.type === 'lmtool-forge-request') {
      embed.postMessage({ type: 'lmtool-forge', abilities: [] });   // TODO: feed canon forged reference content
    } else if (m.type === 'lmtool-assets-request') {
      embed.postMessage({ type: 'lmtool-assets', assets: [] });     // TODO: feed an Assets collection
    } else if (m.type === 'lmtool-glossary-request') {
      embed.postMessage({ type: 'lmtool-glossary', glossary: [] }); // TODO: feed a Glossary collection
    } else if (m.type === 'lmtool-sealed-request') {
      let sealed = [];
      try { sealed = await getSealed(m.memberIds || [], m.names || []); } catch (e) { sealed = []; }
      embed.postMessage({ type: 'lmtool-sealed', sealed: sealed });
    } else if (m.type === 'LOREFELL_FEEDBACK_SUBMIT') {
      console.log('FateWell feedback:', JSON.stringify(m.payload || {}));
    }
  });
});
