// Page code for the ThreadSpire page in Wix.
// Paste into the ThreadSpire page. Set the embed element ID to match EMBED.
// Feeds the character-first view: the player's character card, the party at their
// location, revealed nodes, quest-board goals, world issues, and map art.
import { threadspirePublicChar } from 'backend/characters.web.js';
import { listQuests, listDiscovered, getWorldMeta, saveAsset, listAssets } from 'backend/fatewell.web.js';
import { listSphereArt } from 'backend/sphereart.web.js';
import { uploadRune } from 'backend/loreforge.web.js';
import { listStages, saveStage, deleteStage } from 'backend/threadspire.web.js';
import { getCampaignState, saveCampaignState } from 'backend/campaignview.web.js';
import wixLocation from 'wix-location';

// uploadRune hands back a wix:image:// descriptor, which a plain <img> cannot load.
// Convert to an https url the embed can paint. Same conversion page-fatewell uses.
function toHttps(u) {
  if (typeof u !== 'string') return u;
  const m = u.match(/^wix:image:\/\/v1\/([^/]+)/);
  if (m) return 'https://static.wixstatic.com/media/' + m[1];
  return u;
}

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
    } else if (msg.type && msg.reqId && msg.type.indexOf('TS_') === 0) {
      // The table's storage bridge. The embed asks, the page calls the backend, and
      // answers TS_RESULT carrying the same reqId. Assets ride uploadRune, saveAsset,
      // and listAssets. Stages ride the threadspire.web.js trio.
      const reply = (ok, data, error) => {
        embed.postMessage({ type: 'TS_RESULT', reqId: msg.reqId, ok: ok, data: data, error: error });
      };
      try {
        if (msg.type === 'TS_ASSET_UPLOAD') {
          const ref = await uploadRune(msg.base64, msg.name || 'threadspire-upload');
          reply(true, toHttps(ref));
        } else if (msg.type === 'TS_ASSET_SAVE') {
          const r = await saveAsset(msg.asset);
          reply(!!(r && r.ok), r, r && r.error);
        } else if (msg.type === 'TS_ASSET_LIST') {
          const rows = await listAssets();
          const mine = (rows || []).filter((a) => !msg.kind || a.kind === msg.kind)
            .map((a) => Object.assign({}, a, { image: toHttps(a.image) }));
          reply(true, mine);
        } else if (msg.type === 'TS_STAGE_SAVE') {
          const r = await saveStage(msg.stage);
          reply(!!(r && r.ok), r, r && r.error);
        } else if (msg.type === 'TS_STAGE_LIST') {
          const rows = await listStages(msg.campaignId || campaignId);
          reply(true, rows || []);
        } else if (msg.type === 'TS_STAGE_DELETE') {
          const r = await deleteStage(msg.stageId);
          reply(!!(r && r.ok), r, r && r.error);
        } else if (msg.type === 'TS_STATE_PUSH') {
          try { const r = await saveCampaignState(campaignId, msg.snap); reply(!!(r && r.ok), r, r && r.error); }
          catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_STATE_PULL') {
          try { const r = await getCampaignState(campaignId, msg.since); reply(true, r); }
          catch (e) { reply(true, null); }
        }
      } catch (e) {
        reply(false, null, String(e));
      }
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
