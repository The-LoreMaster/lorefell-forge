// Page code for the ThreadSpire page in Wix.
// Paste into the ThreadSpire page. Set the embed element ID to match EMBED.
// Feeds the character-first view: the player's character card, the party at their
// location, revealed nodes, quest-board goals, world issues, and map art.
import { threadspirePublicChar, listMyCharacters, myAdventures, loadCharacter, saveCharacter, deleteCharacter, threadspireSaveMeta, lmLoadCharacter, lmSaveCharacter, lmCreateOfflineFell, lmRemoveFromAdventure, charAdventure, leaveAdventure, lmWipeFell } from 'backend/characters.web.js';
import { getLmPortrait, saveLmPortrait, getForgePools, getForgeLibrary, listMyCampaigns, saveCampaign, submitAct, submitItem, deleteAsset, listGlossary , setMemberRole, detachCharacter, loadCampaign } from 'backend/fatewell.web.js';
import { createInvite, revokeInvite } from 'backend/invites.web.js';
import { publishAdventure, unpublishAdventure, myPublishedAdventures } from 'backend/published.web.js';
import { getFoePack } from 'backend/forge.web.js';
import { listQuests, listDiscovered, getWorldMeta, saveAsset, listAssets, getCampaignPlayers, getClueCards, upsertQuest, getShelves, saveShelves } from 'backend/fatewell.web.js';
import { getCombatForChar, saveCombatDeclare, syncCombatPlayer, publishCombatState, applyCombatToChar, dealDamageToChar, setCombatCharge, getCombatDeclares } from 'backend/combat.web.js';
import { getLibraries } from 'backend/libraries.web.js';
import { listSphereArt } from 'backend/sphereart.web.js';
import { uploadRune } from 'backend/loreforge.web.js';
import { listStages, saveStage, deleteStage } from 'backend/threadspire.web.js';
import { getCampaignState, saveCampaignState, getJournal, saveJournal } from 'backend/campaignview.web.js';
import { loadAdventure, saveAdventureRoot, saveAdvAct, saveAdvSession, saveAdvScene, removeAdvScene, removeAdvSession, removeAdvAct, migrateCampaign } from 'backend/adventures.web.js';
import { myAdventureRole } from 'backend/fatewell.web.js';
import { handleSheetMessage } from 'public/fgSheetBridge.js';
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

$w.onReady(async function () {
  const embed = $w(EMBED);
  if (!embed || !embed.onMessage) return;

  const q = wixLocation.query || {};
  const characterId = q.character || '';
  // Not const: changing adventure rebinds this page rather than reloading it. Asking
  // Wix to navigate to the page it is already on does nothing at all, so the switch
  // simply never happened.
  let campaignId = q.campaign || q.campaignId || '';
  // the player Fell the LoreMaster currently has open, if any
  let godCharId = '';
  // A player reaches the table through their Fell, often with nothing in the address
  // but the Fell itself. The Fell's record says which adventure it is in, so ask it
  // rather than sitting at an adventure of nobody and receiving nothing.
  if (!campaignId && characterId) {
    try { const a = await charAdventure(characterId); if (a && a.campaignId) campaignId = a.campaignId; } catch (e) {}
  }
  // A LoreMaster who deletes an adventure and reimports it gets a new id, but the old
  // one is still in the address bar from before. The page then opened a campaign that no
  // longer exists: no story, and after nine seconds, "Still here". So a stale id is
  // recovered, but carefully: the only thing it is ever swapped for is an adventure we
  // can positively confirm is the right one, the campaign the Fell itself is in. It is
  // never swapped for whichever adventure happens to be first in the list, because that
  // is how a good link to one adventure quietly opens a different one instead.
  //
  // This only ever acts for someone who runs adventures. A plain player owns none, so
  // listMyCampaigns is empty for them and this leaves their campaignId exactly as it
  // arrived: a player reaches the table through their Fell, and that path is untouched.
  async function resolveCampaign(want) {
    let mine = [];
    try { mine = await listMyCampaigns(); } catch (e) { mine = []; }
    if (!mine.length) return want;                      // not a LoreMaster; do not touch it
    const has = (id) => id && mine.some((c) => String(c.id) === String(id));
    if (has(want)) return want;                         // the address is still valid, keep it
    // the id in the address is not one they run: deleted, reimported, or never theirs.
    // The Fell knows which adventure it is in, so ask it, and take that only if it too is
    // one they run. This is the sure swap: same table, right id.
    if (characterId) {
      try { const a = await charAdventure(characterId); if (a && a.campaignId && has(a.campaignId)) return a.campaignId; } catch (e) {}
    }
    // Nothing could be confirmed. If there is exactly one adventure they run, it is the
    // only thing they could have meant, so open it. If there are several, do not guess:
    // keep the id from the address so the table can say plainly that it found no story
    // there, rather than silently opening the wrong adventure.
    if (mine.length === 1) return mine[0].id;
    return want;
  }
  if (campaignId || characterId) {
    const resolved = await resolveCampaign(campaignId);
    // Resolve in memory only. The address is left as it is on purpose: rewriting the
    // query during onReady is the one thing that has caused a reload here before, and
    // the resolver runs again on the next load anyway, so a stale address costs nothing
    // but a moment's indirection, and never a loop.
    if (resolved) campaignId = resolved;
  }
  // The character sheet, FellGlass, runs inside ThreadSpire now. Its bridge is relayed
  // here so the embedded sheet reads and writes the same Characters record its own page
  // would. One tool, one record, shown in the rail.
  let fgCharId = characterId || '';
  // The FellGlass sheet's bridge is shared with its own page; the one copy lives in
  // public/fgSheetBridge.js. Here it is handed the LoreMaster's extra hand: godCharId,
  // set while a player's Fell is held open, routes that Fell's saves through the gated
  // method. ThreadSpire shows whatever a record holds, forged or not, so it does not ask
  // for the created flag the standalone page waits on.
  const fgApi = {
    listMyCharacters, myAdventures, loadCharacter, saveCharacter, deleteCharacter,
    leaveAdventure, getClueCards, listQuests, getCombatForChar, saveCombatDeclare,
    syncCombatPlayer, getLibraries, lmSaveCharacter
  };
  async function fgBridge(m, reply) {
    await handleSheetMessage(m, {
      reply: reply,
      getCharId: () => fgCharId,
      setCharId: (id) => { fgCharId = id; },
      api: fgApi,
      godCharId: godCharId
    });
  }

  embed.onMessage(async (event) => {
    const msg = event && event.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'THREADSPIRE_READY') {
      // Paint the right side straight away; the confirmed context follows and corrects it.
      embed.postMessage({ type: 'THREADSPIRE_ROLE_HINT', role: q.role === 'lm' ? 'lm' : 'player' });
      const ctx = await buildContext(characterId, campaignId);
      // Entry point requests LM (Cast carries ?role=lm); ownership must confirm it.
      let role = 'player';
      if (q.role === 'lm' && campaignId) {
        try { const ar = await myAdventureRole(campaignId); if (ar === 'loremaster' || ar === 'lorekeeper') role = 'lm'; } catch (e) {}
      }
      embed.postMessage(Object.assign({ type: 'THREADSPIRE_CONTEXT', role: role, campaignId: campaignId, characterId: characterId }, ctx));
    } else if (msg.type === 'THREADSPIRE_WANT_LORE') {
      let character = null;
      try { character = await threadspirePublicChar(msg.characterId); } catch (e) { character = null; }
      embed.postMessage({ type: 'THREADSPIRE_LORE', character: character });
    } else if (msg.type === 'THREADSPIRE_OPEN_SHEET') {
      try { wixLocation.to('/the-fellglass?character=' + encodeURIComponent(msg.characterId || characterId)); } catch (e) {}
    } else if (msg.type === 'THREADSPIRE_SCROLLTOP') {
      try { $w(EMBED).scrollTo(); } catch (e) {}
    } else if (msg.type === 'TS_TOOL_UP' && msg.tool === 'fellglass') {
      await fgBridge(msg.msg || {}, (r) => embed.postMessage({ type: 'TS_TOOL_DOWN', tool: 'fellglass', msg: r }));
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
        } else if (msg.type === 'TS_SHELVES_GET') {
          const sh = await getShelves();
          reply(true, sh);
        } else if (msg.type === 'TS_SHELVES_SET') {
          const r = await saveShelves(msg.shelves);
          reply(!!(r && r.ok), r, r && r.error);
        } else if (msg.type === 'TS_ASSET_LIST') {
          const rows = await listAssets();
          let mine = (rows || []).filter((a) => !msg.kind || a.kind === msg.kind);
          // Maps and tokens are pictures. Sending each one's foe stats, abilities and
          // inventory with it made opening the picker fetch the whole library.
          if (msg.kind === 'map' || msg.kind === 'token') {
            mine = mine.map((a) => ({
              assetId: a.assetId, kind: a.kind, name: a.name,
              image: toHttps(a.image), w: a.w || 0, h: a.h || 0, folder: a.folder || '',
              campaignId: a.campaignId || ''
            }));
          } else {
            mine = mine.map((a) => Object.assign({}, a, { image: toHttps(a.image) }));
          }
          reply(true, mine);
        } else if (msg.type === 'TS_STAGE_SAVE') {
          // Stamp the adventure on the way in: listStages filters by it, so a stage
          // saved without one could never be found again.
          const r = await saveStage(Object.assign({}, msg.stage, { campaignId: msg.campaignId || campaignId }));
          reply(!!(r && r.ok), r, r && r.error);
        } else if (msg.type === 'TS_STAGE_LIST') {
          // The embed's own adventure wins, so a stale page constant cannot widen the
          // scope. No adventure at all returns nothing rather than everything.
          const cid = msg.campaignId || campaignId;
          const rows = cid ? await listStages(cid) : [];
          reply(true, rows || []);
        } else if (msg.type === 'TS_CAMPAIGN_LIST') {
          // Every adventure this member runs, loremaster or lorekeeper. The embed only
          // needs the id, the name and which one is open.
          let list = [];
          try { list = await listMyCampaigns(); } catch (e) { list = []; }
          reply(true, (list || []).map((c) => ({ id: c.id, name: c.name, role: c.role })));
        } else if (msg.type === 'TS_CAMPAIGN_SET') {
          // Switch in place. The context now carries the adventure itself, read from the
          // account by buildContext, so rebinding and sending a fresh context brings the
          // new story with it. No navigation, no push from FateWell, no empty table: the
          // switched context has the spine on it, and the play surface stands it up.
          try {
            const next = String(msg.campaignId || '');
            if (!next) { reply(false, null, 'no adventure given'); }
            else {
              campaignId = next;
              const ctx = await buildContext(characterId, campaignId);
              let role = 'player';
              try { const ar = await myAdventureRole(campaignId); if (ar === 'loremaster' || ar === 'lorekeeper') role = 'lm'; } catch (e) {}
              embed.postMessage(Object.assign({ type: 'THREADSPIRE_CONTEXT', role: role, campaignId: campaignId, characterId: characterId, switched: true }, ctx));
              reply(true, { ok: true, campaignId: campaignId });
            }
          } catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_GOD_SHEET') {
          // Hand a player's Fell to the sheet frame. Refused unless the caller runs the
          // adventure that Fell belongs to.
          try {
            const rec = await lmLoadCharacter(msg.charId || '');
            if (!rec) { reply(false, null, 'that Fell is not yours to open'); }
            else {
              godCharId = msg.charId || '';
              let libraries = {}; try { libraries = await getLibraries(); } catch (e) { libraries = {}; }
              // down the existing relay, as the sheet's own init. Same road the player's
              // own sheet travels, so there is one way in and one thing to keep working.
              embed.postMessage({ type: 'TS_TOOL_DOWN', tool: 'fellglass',
                msg: { type: 'init', charId: godCharId,
                       character: rec.forged ? (rec.seed || {}) : (rec.character || {}),
                       blank: !(rec.character && Object.keys(rec.character).length),
                       libraries: libraries } });
              embed.postMessage({ type: 'TS_TOOL_DOWN', tool: 'fellglass', msg: { type: 'ts-god', on: true } });
              // hand the record back too, so the tool can keep it and reopen this Fell
              // with no round trip next time
              reply(true, { ok: true, charId: godCharId, record: rec.forged ? (rec.seed || {}) : (rec.character || {}) });
            }
          } catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_FELL_WIPE') {
          try {
            const r = await lmWipeFell(msg.charId || '');
            if (r && r.ok && godCharId === msg.charId) godCharId = '';
            reply(!!(r && r.ok), r, r && r.error);
          } catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_OFFLINE_FELL') {
          try { const r = await lmCreateOfflineFell(campaignId, msg.name || ''); reply(!!(r && r.ok), r, r && r.error); }
          catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_PARTY_REMOVE') {
          try { const r = await lmRemoveFromAdventure(campaignId, msg.memberId || '', msg.charId || ''); reply(!!(r && r.ok), r, r && r.error); }
          catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_GOD_SHEET_CLOSE') {
          godCharId = '';
          reply(true, { ok: true });
        } else if (msg.type === 'TS_ADVENTURE_CREATE') {
          // Make the adventure here and open it. saveCampaign with no id inserts and
          // hands back the new id; the spine is the smallest FateWell can still open.
          try {
            const nm = String(msg.name || 'New adventure').slice(0, 120);
            const now = Date.now();
            const spine = {
              name: nm,
              acts: [{
                id: 'act-' + now, name: 'Act I',
                sessions: [{
                  id: 'ses-' + now, name: 'Session 1',
                  scenes: [{ id: 'sc-' + now, name: 'Opening scene', beats: [], foes: [], npcs: [], maps: [] }]
                }]
              }]
            };
            const r = await saveCampaign('', { campaign: spine }, nm);
            if (r && r.ok && r.id) reply(true, { id: r.id, name: nm });
            else reply(false, null, (r && r.error) || 'the adventure was not created');
          } catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_NEW_ADVENTURE') {
          // FateWell authors adventures; ThreadSpire runs them. The route is the one
          // the Hearth uses, in docs/the_hearth.html.
          try { wixLocation.to('/the-fatewell'); reply(true, { ok: true }); }
          catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_STAGE_DELETE') {
          const r = await deleteStage(msg.stageId);
          reply(!!(r && r.ok), r, r && r.error);
        } else if (msg.type === 'TS_ADV_SAVE_SCENE') {
          // One scene changed (a foe removed, a beat added). Write ONLY that scene's row, so
          // an edit here never touches another scene. This is the write that ends the lost-edit bug.
          try { const r = await saveAdvScene(campaignId, msg.actId, msg.sesId, msg.scene); reply(!!(r && r.ok), r, r && r.error); }
          catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_ADV_SAVE_ACT') {
          try { const r = await saveAdvAct(campaignId, msg.act); reply(!!(r && r.ok), r, r && r.error); }
          catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_ADV_SAVE_SESSION') {
          try { const r = await saveAdvSession(campaignId, msg.actId, msg.session); reply(!!(r && r.ok), r, r && r.error); }
          catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_ADV_SAVE_ROOT') {
          try { const r = await saveAdventureRoot(campaignId, msg.root); reply(!!(r && r.ok), r, r && r.error); }
          catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_ADV_REMOVE_SCENE') {
          try { const r = await removeAdvScene(campaignId, msg.sceneId); reply(!!(r && r.ok), r, r && r.error); }
          catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_ADV_REMOVE_SESSION') {
          try { const r = await removeAdvSession(campaignId, msg.sesId); reply(!!(r && r.ok), r, r && r.error); }
          catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_ADV_REMOVE_ACT') {
          try { const r = await removeAdvAct(campaignId, msg.actId); reply(!!(r && r.ok), r, r && r.error); }
          catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_STATE_PUSH') {
          // Refuse a write meant for a different adventure. One sent before the switch
          // and arriving after it would land the old table on the new adventure.
          if (msg.campaignId && msg.campaignId !== campaignId) { reply(false, null, 'stale adventure'); }
          else {
            try { const r = await saveCampaignState(campaignId, msg.snap); reply(!!(r && r.ok), r, r && r.error); }
            catch (e) { reply(false, null, String(e)); }
          }
        } else if (msg.type === 'TS_STATE_PULL') {
          // Say which adventure the answer is for. A pull in flight across a switch
          // comes back holding the old one, and it used to be believed.
          try { const r = await getCampaignState(campaignId, msg.since); reply(true, Object.assign({ campaignId: campaignId }, r || {})); }
          catch (e) { reply(true, null); }
        } else if (msg.type === 'TS_JOURNAL_GET') {
          try { const j = await getJournal(campaignId); reply(true, j || []); }
          catch (e) { reply(true, []); }
        } else if (msg.type === 'TS_JOURNAL_SAVE') {
          try { const r = await saveJournal(campaignId, msg.entries || []); reply(!!(r && r.ok), r, r && r.error); }
          catch (e) { reply(false, null, String(e)); }
        } else if (msg.type === 'TS_CHAR_LOAD') {
          let ch = null;
          try { const r = await loadCharacter(msg.charId || characterId); ch = (r && r.character) ? r.character : null; } catch (e) { ch = null; }
          reply(true, ch);
        } else if (msg.type === 'TS_FORGE_DATA') {
          let pools = { infusions: [], augmentations: [], items: [] };
          let pack = null;
          let acts = [];
          try { pools = await getForgePools(); } catch (e) {}
          try { pack = await getFoePack(); } catch (e) {}
          try { acts = await getForgeLibrary(); } catch (e) { acts = []; }
          let camps = [], gloss = [];
          try { camps = await listMyCampaigns(); } catch (e) { camps = []; }
          try { gloss = await listGlossary(); } catch (e) { gloss = []; }
          reply(true, { pools: pools, pack: pack, acts: acts, campaigns: camps, glossary: gloss });
        } else if (msg.type === 'TS_COMBAT_PUBLISH') {
          let ok = false;
          try { const r = await publishCombatState(campaignId, msg.state || {}); ok = !!(r && r.ok); } catch (e) { ok = false; }
          reply(ok);
        } else if (msg.type === 'TS_COMBAT_DECLARES') {
          let list = [];
          try { list = await getCombatDeclares(campaignId); } catch (e) { list = []; }
          reply(true, list);
        } else if (msg.type === 'TS_COMBAT_APPLY') {
          let ok = false;
          try { const r = await applyCombatToChar(campaignId, msg.charId, msg.applied || [], msg.recap || null); ok = !!(r && r.ok); } catch (e) { ok = false; }
          reply(ok);
        } else if (msg.type === 'TS_COMBAT_DAMAGE') {
          let ok = false;
          try { const r = await dealDamageToChar(campaignId, msg.charId, msg.base, msg.bonus, msg.dt); ok = !!(r && r.ok); } catch (e) { ok = false; }
          reply(ok);
        } else if (msg.type === 'TS_COMBAT_CHARGE') {
          let ok = false;
          try { const r = await setCombatCharge(campaignId, msg.charId, msg.value); ok = !!(r && r.ok); } catch (e) { ok = false; }
          reply(ok);
        } else if (msg.type === 'TS_QUEST_SAVE') {
          let ok = false;
          try { const r = await upsertQuest(campaignId, msg.quest || {}); ok = !!(r && r.ok); } catch (e) { ok = false; }
          let list = [];
          try { list = await listQuests(campaignId); } catch (e) { list = []; }
          reply(ok, list);
        } else if (msg.type === 'TS_QUEST_LIST') {
          let list = [];
          try { list = await listQuests(campaignId); } catch (e) { list = []; }
          reply(true, list);
        } else if (msg.type === 'TS_PUBLISH_LIST') {
          let items = [];
          try { items = await myPublishedAdventures(); } catch (e) { items = []; }
          reply(true, items);
        } else if (msg.type === 'TS_PUBLISH') {
          let res = null;
          try { res = await publishAdventure(msg.title, msg.blurb, msg.pack, campaignId); } catch (e) { res = null; }
          reply(!!(res && res.ok), res);
        } else if (msg.type === 'TS_UNPUBLISH') {
          let ok = false;
          try { const r = await unpublishAdventure(msg.id); ok = !!(r && r.ok); } catch (e) { ok = false; }
          reply(ok);
        } else if (msg.type === 'TS_PARTY_LIST') {
          let players = [];
          try { players = await getCampaignPlayers(campaignId, ''); } catch (e) { players = []; }
          reply(true, players);
        } else if (msg.type === 'TS_PARTY_ROLE') {
          let players = [];
          try { await setMemberRole(campaignId, msg.memberId, msg.role); } catch (e) {}
          try { players = await getCampaignPlayers(campaignId, ''); } catch (e) { players = []; }
          reply(true, players);
        } else if (msg.type === 'TS_PARTY_DETACH') {
          let ok = false;
          try { await detachCharacter(msg.charId); ok = true; } catch (e) { ok = false; }
          reply(ok);
        } else if (msg.type === 'TS_INVITE_MAKE') {
          let url = '';
          try { const r = await createInvite(campaignId); url = (r && r.url) || ''; } catch (e) { url = ''; }
          reply(!!url, url);
        } else if (msg.type === 'TS_INVITE_REVOKE') {
          let ok = false;
          try { await revokeInvite(campaignId); ok = true; } catch (e) { ok = false; }
          reply(ok);
        } else if (msg.type === 'TS_FORGE_ACT') {
          let ok = false;
          try { const r = await submitAct(msg.act || {}); ok = !!(r && r.ok); } catch (e) { ok = false; }
          let acts = [];
          try { acts = await getForgeLibrary(); } catch (e) { acts = []; }
          reply(ok, acts);
        } else if (msg.type === 'TS_FORGE_ITEM') {
          let ok = false;
          try { const r = await submitItem(msg.item || {}); ok = !!(r && r.ok); } catch (e) { ok = false; }
          let pools = { infusions: [], augmentations: [], items: [] };
          try { pools = await getForgePools(); } catch (e) {}
          reply(ok, pools);
        } else if (msg.type === 'TS_ASSET_DELETE') {
          let ok = false;
          try { const r = await deleteAsset(msg.assetId); ok = !!(r && r.ok); } catch (e) { ok = false; }
          reply(ok);
        } else if (msg.type === 'TS_LM_PORTRAIT_GET') {
          let por = '';
          try { const r = await getLmPortrait(campaignId); por = (r && r.portrait) || ''; } catch (e) { por = ''; }
          reply(true, por);
        } else if (msg.type === 'TS_LM_PORTRAIT_SAVE') {
          let ok = false;
          try { const r = await saveLmPortrait(campaignId, msg.portrait); ok = !!(r && r.ok); } catch (e) { ok = false; }
          reply(ok);
        } else if (msg.type === 'TS_CHAR_LIST') {
          let list = [];
          try { list = await listMyCharacters(); } catch (e) { list = []; }
          reply(true, list);
        } else if (msg.type === 'TS_CHAR_SAVEMETA') {
          let ok = false;
          try { const r = await threadspireSaveMeta(msg.charId || characterId, { name: msg.name, portrait: msg.portrait }); ok = !!(r && r.ok); } catch (e) { ok = false; }
          reply(ok);
        }
      } catch (e) {
        reply(false, null, String(e));
      }
    }
  });
});

async function buildContext(characterId, campaignId) {
  const out = { character: null, party: [], discovered: [], worldUnlocked: false, goals: [], worldIssues: [], art: {}, nodes: [], rawCampaign: null };

  // The adventure is its own thing now, stored decomposed in the Adventures tree and read by
  // whoever opens it, FateWell or ThreadSpire alike. Read the whole tree; nothing lossy, no
  // spine. If this adventure has not been migrated off the old Campaigns blob yet, migrate it
  // once on first touch, then read the tree. rawCampaign keeps its name for the tool, but it is
  // now the lossless tree, so the play surface stands up the whole story, not a reduced copy.
  if (campaignId) {
    try {
      let adv = await loadAdventure(campaignId);
      if (!adv || !adv.acts) {
        try { await migrateCampaign(campaignId); } catch (e) {}
        adv = await loadAdventure(campaignId);
      }
      if (adv && adv.acts) out.rawCampaign = adv;
      else {
        // last resort: the pre-migration blob, so an adventure never fails to open
        const blob = await loadCampaign(campaignId);
        if (blob && blob.data) out.rawCampaign = blob.data;
      }
    } catch (e) {}
  }

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
    try {
      const roster = await getCampaignPlayers(campaignId);
      const sheets = [];
      for (const pl of (roster || [])) {
        if (!pl.charId) continue;
        let ch = null;
        try { ch = await threadspirePublicChar(pl.charId); } catch (e) {}
        sheets.push(Object.assign({ charId: pl.charId, level: pl.level, maxVit: pl.maxVit, memberName: pl.memberName }, ch || {}));
      }
      out.party = sheets;
    } catch (e) {}
  }

  // map art for every layer, keyed by node id, from The Cartographer
  try {
    const art = await listSphereArt(campaignId || '');
    ((art && art.art) || []).forEach((a) => { out.art[a.nodeId] = { image: a.image, title: a.title, lore: a.lore, nodeLayout: a.nodes }; });
  } catch (e) {}

  return out;
}
