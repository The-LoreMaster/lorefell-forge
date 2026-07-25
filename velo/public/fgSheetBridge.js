// public/fgSheetBridge.js
//
// One handler for the FellGlass character sheet, wherever it runs. The sheet is
// embedded both on its own page and inside ThreadSpire's rail, and each host used to
// carry its own hand-copied copy of this bridge. They drifted: the save ack was added
// to one and forgotten on the other until it was fixed by hand twice, the two disagreed
// on whether an uncreated Fell opens the forge, and only one knew how to hand a Fell
// back to ThreadSpire. This is the single copy. Each host passes what only it knows.
//
// This lives in public/, not backend/, on purpose. It is page-side logic: it calls
// reply() to talk to the sheet frame and tracks which Fell is open, neither of which
// can cross a backend web-module boundary. Wix page code can import from public/ but
// may only import web-modules (.web.js) from backend/, so a plain backend helper here
// would be denied at publish. It imports nothing itself; the host injects the web
// methods it needs through api.
//
// The host supplies a context:
//   reply(obj)              send a message down to the sheet frame
//   getCharId() / setCharId(id)   the current Fell the host is tracking
//   api                     the web methods, injected so this file imports nothing
//                           the host has not already imported and wired
//   godCharId               (optional) a player's Fell the LoreMaster is holding open;
//                           only ThreadSpire supplies it, and only then does a save go
//                           through the gated LM method
//   initNeedsCreated        (optional, default false) whether a record must be marked
//                           created before it opens as a live sheet. The standalone
//                           page wants an unbuilt Fell to open the forge; ThreadSpire
//                           wants the LoreMaster to see whatever exists, forged or not,
//                           so it leaves this false
//   onReady(list)           (optional) called during 'ready' before anything is sent,
//                           returning true if the host has navigated away and the
//                           bridge should stop. The standalone page bounces an entry
//                           with a character straight to the table this way
//   onThreadspireOpen(m)    (optional) handle the sheet asking to open the table
//   onFeedback(payload)     (optional) handle a feedback submission

export async function handleSheetMessage(m, ctx) {
  if (!m || typeof m !== 'object' || !m.type) return;

  const api = ctx.api;
  const reply = ctx.reply;
  const getId = () => ctx.getCharId();
  const setId = (id) => ctx.setCharId(id);

  async function listChars() {
    try { return await api.listMyCharacters(); } catch (e) { return []; }
  }
  async function sendCharacters(curId) {
    const list = await listChars();
    reply({ type: 'characters', list: list, currentId: curId || '' });
  }
  async function loadLibraries() {
    try { return await api.getLibraries(); } catch (e) { return {}; }
  }
  async function openCharacter(id, libraries) {
    if (libraries === undefined) libraries = await loadLibraries();
    if (!id) { reply({ type: 'new', libraries: libraries, charId: '' }); return; }
    let res = null;
    try { res = await api.loadCharacter(id); } catch (e) { res = null; }
    if (res && res.forged) {
      reply({ type: 'new', forge: res.seed || {}, libraries: libraries, charId: id });
    } else if (res && res.character && (!ctx.initNeedsCreated || res.character.created)) {
      reply({ type: 'init', character: res.character, libraries: libraries, charId: id });
    } else {
      reply({ type: 'new', libraries: libraries, charId: id });
    }
  }

  if (m.type === 'ready') {
    if (m.charId) setId(m.charId);
    const list = await listChars();
    // The host gets first refusal on a fresh open: the standalone page bounces an
    // entry that already has a character to the table rather than showing the sheet.
    if (ctx.onReady) {
      const handled = await ctx.onReady(list);
      if (handled) return;
    }
    if (!getId() && list.length) setId(list[0].id);
    const libraries = await loadLibraries();
    reply({ type: 'characters', list: list, currentId: getId() || '' });
    let adventures = [];
    try { adventures = await api.myAdventures(); } catch (e) { adventures = []; }
    reply({ type: 'adventures', list: adventures });
    await openCharacter(getId(), libraries);

  } else if (m.type === 'select-character') {
    setId(m.charId || '');
    await openCharacter(getId());
    await sendCharacters(getId());

  } else if (m.type === 'add-character') {
    setId('');
    const libraries = await loadLibraries();
    reply({ type: 'new', libraries: libraries, charId: '' });
    await sendCharacters('');

  } else if (m.type === 'clues-request') {
    let clues = [];
    try { clues = await api.getClueCards(m.charId || getId()); } catch (e) { clues = []; }
    reply({ type: 'clues', clues: clues });

  } else if (m.type === 'quests-request') {
    let qr = null;
    try { qr = await api.listQuests(m.campaignId || ''); } catch (e) { qr = null; }
    reply({ type: 'quests', ok: !(qr && qr.ok === false), quests: (qr && qr.quests) || [] });

  } else if (m.type === 'leave-adventure') {
    try { await api.leaveAdventure(m.charId || getId()); } catch (e) {}

  } else if (m.type === 'combat-request') {
    let state = null;
    try { state = await api.getCombatForChar(m.charId || getId()); } catch (e) { state = null; }
    reply({ type: 'combat-state', state: state });

  } else if (m.type === 'combat-sync') {
    let ok = true;
    try {
      await api.syncCombatPlayer(m.charId || getId(), {
        curVit: m.curVit, maxVit: m.maxVit, charge: m.charge, affs: m.affs,
        defEva: m.defEva, plog: m.plog, gear: m.gear
      });
    } catch (e) { ok = false; }
    reply({ type: 'combat-sync-ack', ok: ok });

  } else if (m.type === 'combat-declare') {
    let ok = true;
    try {
      await api.saveCombatDeclare(m.charId || getId(), {
        act: m.act, react: m.react, target: m.target, round: m.round, dmg: m.dmg,
        base: m.base, dt: m.dt, fellmark: m.fellmark, doubleFell: m.doubleFell,
        pierce: m.pierce, applies: m.applies, actTier: m.actTier, acc: m.acc,
        roll: m.roll, kind: m.kind, fellstrike: m.fellstrike, charge: m.charge,
        curVit: m.curVit, maxVit: m.maxVit, affs: m.affs
      });
    } catch (e) { ok = false; }
    reply({ type: 'combat-declare-ack', ok: ok, reqId: m.reqId || 0 });

  } else if (m.type === 'save') {
    // Every save is answered, pass or fail, carrying the number the sheet sent, so a
    // write that was refused or that threw cannot pass for one that landed.
    const cid = m.charId || '';
    const ack = (ok, id, error) => reply({
      type: 'saved', ok: ok, saveSeq: m.saveSeq, localId: m.localId || '',
      charId: id || cid, error: error || ''
    });
    // While the LoreMaster holds a player's Fell open, the sheet's own autosave is
    // writing to someone else's record. That goes through the gated method, which
    // checks the caller's role against the adventure rather than taking the page's
    // word. Only ThreadSpire ever sets godCharId.
    if (ctx.godCharId && cid && cid === ctx.godCharId) {
      try { const r = await api.lmSaveCharacter(cid, m.character || {}); ack(!!(r && r.ok), cid, r && r.error); }
      catch (e) { ack(false, cid, String((e && e.message) || e)); }
    } else {
      try {
        const r = await api.saveCharacter(cid, m.character || {});
        if (r && r.ok && r.id && !cid) { setId(r.id); ack(true, r.id); await sendCharacters(r.id); }
        else ack(!!(r && r.ok), (r && r.id) || cid, r && r.error);
      } catch (e) { ack(false, cid, String((e && e.message) || e)); }
    }

  } else if (m.type === 'delete-character') {
    const cid = m.charId || getId();
    let res = { ok: false };
    try { res = await api.deleteCharacter(cid); } catch (e) { res = { ok: false }; }
    const list = await listChars();
    const nextId = list.length ? list[0].id : '';
    setId(nextId);
    reply({ type: 'char-deleted', ok: !!(res && res.ok), remaining: list.length, leftCampaign: !!(res && res.leftCampaign) });
    reply({ type: 'characters', list: list, currentId: nextId });
    await openCharacter(nextId);

  } else if (m.type === 'threadspire-open') {
    if (ctx.onThreadspireOpen) ctx.onThreadspireOpen(m);

  } else if (m.type === 'LOREFELL_FEEDBACK_SUBMIT') {
    if (ctx.onFeedback) ctx.onFeedback(m.payload || {});
  }
}
