// The FellGlass (character sheet) page code.
// Point the Embed a Site element at the GitHub Pages copy of fellglass.html and set
// EMBED to its element ID. The character to show is taken from the page URL query
// charId, which your character list page sets when a player taps a character.

import { listMyCharacters, myAdventures, loadCharacter, saveCharacter, deleteCharacter } from 'backend/characters.web.js';
import { getClueCards, listQuests } from 'backend/fatewell.web.js';
import { getCombatForChar, saveCombatDeclare, syncCombatPlayer } from 'backend/combat.web.js';
import { getLibraries } from 'backend/libraries.web.js';
import wixLocation from 'wix-location';

const EMBED = '#html1';   // change to your Embed a Site element ID

$w.onReady(() => {
  const embed = $w(EMBED);
  let charId = (wixLocation.query && wixLocation.query.charId) || '';

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    async function listChars() {
      try { return await listMyCharacters(); } catch (e) { return []; }
    }
    async function sendCharacters(curId) {
      const list = await listChars();
      embed.postMessage({ type: 'characters', list: list, currentId: curId || '' });
    }
    async function openCharacter(id, libraries) {
      if (libraries === undefined) { try { libraries = await getLibraries(); } catch (e) { libraries = {}; } }
      if (!id) { embed.postMessage({ type: 'new', libraries: libraries, charId: '' }); return; }
      let res = null;
      try { res = await loadCharacter(id); } catch (e) { res = null; }
      if (res && res.forged) {
        embed.postMessage({ type: 'new', forge: res.seed || {}, libraries: libraries, charId: id });
      } else if (res && res.character && res.character.created) {
        embed.postMessage({ type: 'init', character: res.character, libraries: libraries, charId: id });
      } else {
        embed.postMessage({ type: 'new', libraries: libraries, charId: id });
      }
    }

    if (msg.type === 'ready') {
      let libraries = {};
      try { libraries = await getLibraries(); } catch (e) { libraries = {}; }
      const list = await listChars();
      if (!charId && list.length) charId = list[0].id;
      embed.postMessage({ type: 'characters', list: list, currentId: charId || '' });
      let adventures = [];
      try { adventures = await myAdventures(); } catch (e) { adventures = []; }
      embed.postMessage({ type: 'adventures', list: adventures });
      await openCharacter(charId, libraries);
    } else if (msg.type === 'select-character') {
      charId = msg.charId || '';
      await openCharacter(charId);
      sendCharacters(charId);
    } else if (msg.type === 'add-character') {
      charId = '';
      let libraries = {};
      try { libraries = await getLibraries(); } catch (e) { libraries = {}; }
      embed.postMessage({ type: 'new', libraries: libraries, charId: '' });
      sendCharacters('');
    } else if (msg.type === 'clues-request') {
      let clues = [];
      try { clues = await getClueCards(msg.charId || charId); } catch (e) { clues = []; }
      embed.postMessage({ type: 'clues', clues: clues });
    } else if (msg.type === 'quests-request') {
      let quests = [];
      try { quests = await listQuests(msg.campaignId || ''); } catch (e) { quests = []; }
      embed.postMessage({ type: 'quests', quests: quests });
    } else if (msg.type === 'combat-request') {
      let state = null;
      try { state = await getCombatForChar(msg.charId || charId); } catch (e) { state = null; }
      embed.postMessage({ type: 'combat-state', state: state });
    } else if (msg.type === 'combat-sync') {
      let syncOk = true;
      try { await syncCombatPlayer(msg.charId || charId, { curVit: msg.curVit, maxVit: msg.maxVit, charge: msg.charge, affs: msg.affs, defEva: msg.defEva, plog: msg.plog, gear: msg.gear }); } catch (e) { syncOk = false; }
      embed.postMessage({ type: 'combat-sync-ack', ok: syncOk });
    } else if (msg.type === 'combat-declare') {
      let declOk = true;
      try {
        await saveCombatDeclare(msg.charId || charId, {
          act: msg.act, react: msg.react, target: msg.target, round: msg.round, dmg: msg.dmg, base: msg.base, dt: msg.dt, fellmark: msg.fellmark, doubleFell: msg.doubleFell, pierce: msg.pierce, applies: msg.applies, actTier: msg.actTier,
          acc: msg.acc, roll: msg.roll, kind: msg.kind, fellstrike: msg.fellstrike,
          charge: msg.charge, curVit: msg.curVit, maxVit: msg.maxVit, affs: msg.affs
        });
      } catch (e) { declOk = false; }
      embed.postMessage({ type: 'combat-declare-ack', ok: declOk, reqId: msg.reqId || 0 });
    } else if (msg.type === 'save') {
      // The sheet tells us which row it is editing. An empty id means a brand-new sheet,
      // so it inserts a new row rather than overwriting the last one. We tell the sheet
      // the new id so its next save updates the same row.
      const cid = msg.charId || '';
      try {
        const r = await saveCharacter(cid, msg.character || {});
        if (r && r.ok && r.id && !cid) {
          charId = r.id;
          embed.postMessage({ type: 'saved', localId: msg.localId || '', charId: r.id });
          sendCharacters(r.id);
        }
      } catch (e) {}
    } else if (msg.type === 'delete-character') {
      const cid = msg.charId || charId;
      let res = { ok: false };
      try { res = await deleteCharacter(cid); } catch (e) { res = { ok: false }; }
      const list = await listChars();
      const nextId = list.length ? list[0].id : '';
      charId = nextId;
      embed.postMessage({ type: 'char-deleted', ok: !!(res && res.ok), remaining: list.length, leftCampaign: !!(res && res.leftCampaign) });
      embed.postMessage({ type: 'characters', list: list, currentId: nextId });
      await openCharacter(nextId);
    } else if (msg.type === 'LOREFELL_FEEDBACK_SUBMIT') {
      console.log('FellGlass feedback:', JSON.stringify(msg.payload || {}));
    }
  });
});
