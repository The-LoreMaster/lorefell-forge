// The /join page code.
// Point the Embed a Site element at the GitHub Pages copy of join.html and set EMBED to
// its element ID. The invite token is read from the page URL query t. A player signs in,
// the page records their membership and lists their characters to attach. Forging a new
// one sends them to FellForge with this adventure linked.

import { authentication, currentMember } from 'wix-members-frontend';
import { redeemInvite, listJoinCharacters, attachCharacter, detachOwnCharacter } from 'backend/invites.web.js';
import wixLocation from 'wix-location';

const EMBED = '#html1';   // change to your Embed a Site element ID

let CAMPAIGN_ID = '';
let CAMPAIGN_NAME = '';
let IS_OWNER = false;
// The page slug that hosts FellForge. Change to match your site if it differs.
const FELLFORGE_PATH = '/fellforge';

$w.onReady(() => {
  const embed = $w(EMBED);
  const token = (wixLocation.query && wixLocation.query.t) || '';

  async function pushState() {
    let signedIn = false;
    try { signedIn = await authentication.loggedIn(); } catch (e) { signedIn = false; }
    if (!signedIn) {
      embed.postMessage({ type: 'JOIN_STATE', signedIn: false, campaignName: CAMPAIGN_NAME });
      return;
    }
    if (!CAMPAIGN_ID) {
      let r = {};
      try { r = await redeemInvite(token); } catch (e) { r = {}; }
      if (r && r.ok) { CAMPAIGN_ID = r.campaignId; CAMPAIGN_NAME = r.campaignName || ''; IS_OWNER = !!r.isOwner; }
    }
    let chars = [];
    try { chars = await listJoinCharacters(); } catch (e) { chars = []; }
    const list = chars.map((c) => ({
      charId: c.charId, name: c.name, level: c.level,
      here: c.campaignId === CAMPAIGN_ID,
      elsewhere: !!c.campaignId && c.campaignId !== CAMPAIGN_ID
    }));
    embed.postMessage({ type: 'JOIN_STATE', signedIn: true, campaignName: CAMPAIGN_NAME, isOwner: IS_OWNER, characters: list });
  }

  embed.onMessage(async (event) => {
    const m = event.data;
    if (!m || typeof m !== 'object' || !m.type) return;

    if (m.type === 'JOIN_READY') {
      await pushState();
    } else if (m.type === 'JOIN_LOGIN') {
      try { await authentication.promptLogin({ mode: 'login' }); } catch (e) {}
      await pushState();
    } else if (m.type === 'JOIN_ATTACH') {
      try { await attachCharacter(CAMPAIGN_ID, m.charId); } catch (e) {}
      await pushState();
    } else if (m.type === 'JOIN_DETACH') {
      try { await detachOwnCharacter(m.charId); } catch (e) {}
      await pushState();
    } else if (m.type === 'JOIN_FORGE') {
      wixLocation.to(FELLFORGE_PATH + '?campaign=' + encodeURIComponent(CAMPAIGN_ID));
    }
  });
});
