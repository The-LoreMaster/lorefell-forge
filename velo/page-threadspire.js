// Page code for the ThreadSpire page in Wix.
// Paste into the ThreadSpire page. Set the embed element ID to match EMBED.
// Feeds the character-first view: the player's character card, the party at their
// location, revealed nodes, quest-board goals, world issues, and map art.
import { threadspirePublicChar, listMyCharacters, myAdventures, loadCharacter, saveCharacter, deleteCharacter, threadspireSaveMeta } from 'backend/characters.web.js';
import { listQuests, listDiscovered, getWorldMeta, saveAsset, listAssets, getCampaignPlayers, getClueCards } from 'backend/fatewell.web.js';
import { getCombatForChar, saveCombatDeclare, syncCombatPlayer } from 'backend/combat.web.js';
import { getLibraries } from 'backend/libraries.web.js';
import { listSphereArt } from 'backend/sphereart.web.js';
import { uploadRune } from 'backend/loreforge.web.js';
import { listStages, saveStage, deleteStage } from 'backend/threadspire.web.js';
import { getCampaignState, saveCampaignState, getJournal, saveJournal } from 'backend/campaignview.web.js';
import { myAdventureRole } from 'backend/fatewell.web.js';
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
  // The character sheet, FellGlass, runs inside ThreadSpire now. Its bridge is relayed
  // here so the embedded sheet reads and writes the same Characters record its own page
  // would. One tool, one record, shown in the rail.
  let fgCharId = characterId || '';
  async function fgBridge(m, reply) {
    async function listChars() { try { return await listMyCharacters(); } catch (e) { return []; } }
    async function sendCharacters(curId) { const list = await listChars(); reply({ type: 'characters', list: list, currentId: curId || '' }); }
    async function openCharacter(id, libraries) {
      if (libraries === undefined) { try { libraries = await getLibraries(); } catch (e) { libraries = {}; } }
      if (!id) { reply({ type: 'new', libraries: libraries, charId: '' }); return; }
      let res = null; try { res = await loadCharacter(id); } catch (e) { res = null; }
      if (res && res.forged) reply({ type: 'new', forge: res.seed || {}, libraries: libraries, charId: id });
      else if (res && res.character && res.character.created) reply({ type: 'init', character: res.character, libraries: libraries, charId: id });
      else reply({ type: 'new', libraries: libraries, charId: id });
    }
    if (m.type === 'ready') {
      let libraries = {}; try { libraries = await getLibraries(); } catch (e) { libraries = {}; }
      if (!fgCharId) { const list = await listChars(); if (list.length) fgCharId = list[0].id; }
      await sendCharacters(fgCharId);
      let adventures = []; try { adventures = await myAdventures(); } catch (e) { adventures = []; }
      reply({ type: 'adventures', list: adventures });
      await openCharacter(fgCharId, libraries);
    } else if (m.type === 'select-character') {
      fgCharId = m.charId || ''; await openCharacter(fgCharId); await sendCharacters(fgCharId);
    } else if (m.type === 'add-character') {
      fgCharId = ''; let libraries = {}; try { libraries = await getLibraries(); } catch (e) { libraries = {}; }
      reply({ type: 'new', libraries: libraries, charId: '' }); await sendCharacters('');
    } else if (m.type === 'clues-request') {
      let clues = []; try { clues = await getClueCards(m.charId || fgCharId); } catch (e) { clues = []; }
      reply({ type: 'clues', clues: clues });
    } else if (m.type === 'quests-request') {
      let qr = null; try { qr = await listQuests(m.campaignId || ''); } catch (e) { qr = null; }
      reply({ type: 'quests', ok: !(qr && qr.ok === false), quests: (qr && qr.quests) || [] });
    } else if (m.type === 'combat-request') {
      let state = null; try { state = await getCombatForChar(m.charId || fgCharId); } catch (e) { state = null; }
      reply({ type: 'combat-state', state: state });
    } else if (m.type === 'combat-sync') {
      let ok = true; try { await syncCombatPlayer(m.charId || fgCharId, { curVit: m.curVit, maxVit: m.maxVit, charge: m.charge, affs: m.affs, defEva: m.defEva, plog: m.plog, gear: m.gear }); } catch (e) { ok = false; }
      reply({ type: 'combat-sync-ack', ok: ok });
    } else if (m.type === 'combat-declare') {
      let ok = true;
      try { await saveCombatDeclare(m.charId || fgCharId, { act: m.act, react: m.react, target: m.target, round: m.round, dmg: m.dmg, base: m.base, dt: m.dt, fellmark: m.fellmark, doubleFell: m.doubleFell, pierce: m.pierce, applies: m.applies, actTier: m.actTier, acc: m.acc, roll: m.roll, kind: m.kind, fellstrike: m.fellstrike, charge: m.charge, curVit: m.curVit, maxVit: m.maxVit, affs: m.affs }); } catch (e) { ok = false; }
      reply({ type: 'combat-declare-ack', ok: ok, reqId: m.reqId || 0 });
    } else if (m.type === 'save') {
      const cid = m.charId || '';
      try { const r = await saveCharacter(cid, m.character || {}); if (r && r.ok && r.id && !cid) { fgCharId = r.id; reply({ type: 'saved', localId: m.localId || '', charId: r.id }); await sendCharacters(r.id); } } catch (e) {}
    } else if (m.type === 'delete-character') {
      const cid = m.charId || fgCharId; let res = { ok: false }; try { res = await deleteCharacter(cid); } catch (e) { res = { ok: false }; }
      const list = await listChars(); const nextId = list.length ? list[0].id : ''; fgCharId = nextId;
      reply({ type: 'char-deleted', ok: !!(res && res.ok), remaining: list.length, leftCampaign: !!(res && res.leftCampaign) });
      reply({ type: 'characters', list: list, currentId: nextId }); await openCharacter(nextId);
    }
  }

  embed.onMessage(async (event) => {
    const msg = event && event.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'THREADSPIRE_READY') {
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
