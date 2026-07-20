// Page code for the ThreadSpire page in Wix.
// Paste into the ThreadSpire page. Set the embed element ID to match EMBED.
// Feeds the character-first view: the player's character card, the party at their
// location, revealed nodes, quest-board goals, world issues, and map art.
import { threadspirePublicChar } from 'backend/characters.web.js';
import { listQuests, listDiscovered, getWorldMeta } from 'backend/fatewell.web.js';
import { listSphereArt } from 'backend/sphereart.web.js';
import wixLocation from 'wix-location';

const EMBED = '#html1';

$w.onReady(function () {
  const embed = $w(EMBED);
  if (!embed || !embed.onMessage) return;

  const q = wixLocation.query || {};
  const characterId = q.character || '';
  const campaignId = q.campaign || q.campaignId || '';

  embed.onMessage(async (event) => {
    const msg = event && event.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'THREADSPIRE_READY') {
      const ctx = await buildContext(characterId, campaignId);
      embed.postMessage(Object.assign({ type: 'THREADSPIRE_CONTEXT' }, ctx));
    } else if (msg.type === 'THREADSPIRE_WANT_LORE') {
      let character = null;
      try { character = await threadspirePublicChar(msg.characterId); } catch (e) { character = null; }
      embed.postMessage({ type: 'THREADSPIRE_LORE', character: character });
    } else if (msg.type === 'THREADSPIRE_OPEN_SHEET') {
      try { wixLocation.to('/the-fellglass?character=' + encodeURIComponent(msg.characterId || characterId)); } catch (e) {}
    } else if (msg.type === 'THREADSPIRE_SCROLLTOP') {
      try { $w(EMBED).scrollTo(); } catch (e) {}
    }
  });
});

async function buildContext(characterId, campaignId) {
  const out = { character: null, party: [], discovered: [], worldUnlocked: false, goals: [], worldIssues: [], art: {}, nodes: [] };

  if (characterId) {
    try { out.character = await threadspirePublicChar(characterId); } catch (e) {}
  }

  if (campaignId) {
    try {
      const q = await listQuests(campaignId);
      out.goals = ((q && q.quests) || []).map((x) => ({ title: x.title || '', done: (x.status === 'complete') }));
    } catch (e) {}
    try {
      const d = await listDiscovered(campaignId);
      out.discovered = (d && d.nodes) || [];
    } catch (e) {}
    try {
      const wm = await getWorldMeta(campaignId);
      if (wm) { out.worldUnlocked = !!wm.worldUnlocked; out.worldIssues = wm.worldIssues || []; }
    } catch (e) {}
  }

  // map art for every layer, keyed by node id, from The Cartographer
  try {
    const art = await listSphereArt(campaignId || '');
    ((art && art.art) || []).forEach((a) => { out.art[a.nodeId] = { image: a.image, title: a.title, lore: a.lore, nodeLayout: a.nodes }; });
  } catch (e) {}

  return out;
}
