// The SigilForge page code.
// Set the Embed a Site element's ID to match EMBED below (Wix default is often #html1).
// The tool is self-contained for its UI, so the page only relays submissions and
// feedback. Browsing and voting live in the LoreForge hall on the site, not here. It re-validates nothing itself, the backend does that, this is just the wire.

import { submitCreation, findSimilar, aiForge, listSigilBuilds, setCreationImage } from 'backend/forge.web.js';
import { uploadRune } from 'backend/loreforge.web.js';
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

const FORGE_KEY = 'sigilforge';
const EMBED = '#html1';   // change to your Embed a Site element ID


// Every uploaded image gets a unique media name so two uploads can never collide
// and overwrite each other (a same-name upload can replace the prior file).
function uniqName(base) {
  return String(base || 'img').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 40)
    + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// The LoreForge's sigils, redrawn with today's runes (Nate, 2026-10-13). An Admin opens the
// SigilForge with ?redraw=1: every SigilForge build in the hall is drawn again by the tool, as a
// new snapshot would be, uploaded, and set as the creation's picture. Run once after the runes
// change. The backend refuses anyone but an Admin.
const renders = {};
function renderIn(embed, state, opts) {
  const reqId = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return new Promise((resolve) => {
    let tries = 0;
    const ask = () => {
      if (!renders[reqId]) return;
      if (tries++ >= 4) { delete renders[reqId]; resolve(''); return; }
      embed.postMessage({ type: 'LOREFELL_RENDER_RUNE', reqId: reqId, state: state, opts: opts });
      setTimeout(ask, 3000);
    };
    renders[reqId] = (png) => { delete renders[reqId]; resolve(png || ''); };
    ask();
  });
}
function buildInputs(b) {
  const m = b.meta || {}, sel = b.selections || [];
  const tier = parseInt(String(b.tier || '1').replace(/\D/g, ''), 10) || 1;
  const type = m.type || (b.mode === 'monster' ? 'Monster' : 'Ability');
  const state = { type: type, weapon: m.weapon || '', focus: m.focus || '', school: m.school || '',
    monsterArchetype: m.monsterArchetype || '', monsterSchool: m.monsterSchool || '', monsterForm: m.monsterForm || 1,
    damage: sel[0] || '', targeting: sel[1] || '', tier: tier, name: b.title || '' };
  return { state: state, opts: { form: b.form || 1, riders: sel[2] ? [sel[2]] : [], tier: tier } };
}
async function redrawSigils(embed) {
  const say = (text) => embed.postMessage({ type: 'LOREFELL_REDRAW_STATUS', text: text });
  let list = null;
  try { list = await listSigilBuilds(); } catch (e) { list = null; }
  if (!list || !list.ok) { say('Redrawing the sigils needs an Admin.'); return; }
  const rows = list.rows || [];
  let done = 0, missed = 0;
  say('Redrawing ' + rows.length + ' sigils');
  for (const b of rows) {
    const inp = buildInputs(b);
    if (!inp.state.damage || !inp.state.targeting) { missed++; continue; }
    const png = await renderIn(embed, inp.state, inp.opts);
    if (!png) { missed++; continue; }
    let url = '';
    try { url = await uploadRune(png, uniqName(b.title || 'sigil')); } catch (e) { url = ''; }
    const r = url ? await setCreationImage(b.creationId, url).catch(() => null) : null;
    if (r && r.ok) done++; else missed++;
    if ((done + missed) % 5 === 0) say('Redrawn ' + done + ' of ' + rows.length);
  }
  say('Done: ' + done + ' sigils redrawn' + (missed ? ', ' + missed + ' could not be' : '') + '.');
}

$w.onReady(() => {
  const embed = $w(EMBED);
  if (String((wixLocation.query || {}).redraw || '') === '1') setTimeout(() => redrawSigils(embed), 2500);

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'LOREFELL_RUNE_RENDERED') { const done = renders[msg.reqId]; if (done) done(msg.png); return; }
    if (msg.type === 'LOREFELL_AI_FORGE') {
      const reqId = msg.reqId;
      try {
        const r = await aiForge(msg.payload || {});
        embed.postMessage({ type: 'LOREFELL_AI_FORGE_RESULT', reqId: reqId, ok: !!(r && r.ok), text: (r && r.text) || '', status: (r && r.status) || 0, error: (r && r.error) || '' });
      } catch (e) {
        embed.postMessage({ type: 'LOREFELL_AI_FORGE_RESULT', reqId: reqId, ok: false, error: 'relay unreachable' });
      }
      return;
    }
    if (msg.type === 'LOREFELL_ABILITY_SUBMIT') {
      await handleSubmit(embed, msg.payload || {});
    } else if (msg.type === 'LOREFELL_CHECK_OVERLAP') {
      const cf = (msg.payload && msg.payload.forge) || {};
      let matches = [];
      try { matches = await findSimilar(FORGE_KEY, cf); } catch (e) { matches = []; }
      embed.postMessage({ type: 'LOREFELL_OVERLAP_RESULT', matches: matches });
    } else if (msg.type === 'LOREFELL_FEEDBACK_SUBMIT') {
      // No feedback collection yet. Logged for now, wire a collection later if wanted.
      console.log('SigilForge feedback:', JSON.stringify(msg.payload || {}));
    } else if (msg.type === 'LOREFELL_MODAL_OPEN') {
      // Scroll the embed to the top of the viewport so the modal lands on screen, then report
      // the window height so the tool can center the modal in the visible area. After this the
      // embed top aligns with the viewport top, so the visible band starts at 0.
      try {
        await embed.scrollTo();
        const rect = await wixWindow.getBoundingRect();
        const vh = (rect && rect.window && rect.window.height) ? rect.window.height : 800;
        embed.postMessage({ type: 'LOREFELL_VIEWPORT', top: 0, height: vh });
      } catch (e) {}
    }
  });
});

async function handleSubmit(embed, raw) {
  const f = raw.forge || {};

  // Store the rune snapshot if present. A media hiccup never blocks the submission.
  let imageUrl = '';
  if (raw.runePng) {
    try { imageUrl = await uploadRune(raw.runePng, uniqName(raw.title || 'sigil')); }
    catch (e) { imageUrl = ''; }
  }

  const payload = {
    tier: f.tier,
    form: f.form,
    mode: f.mode,
    kind: f.kind,
    selections: f.selections || [],
    spreadTarget: f.spreadTarget || '',
    amplifyTarget: f.amplifyTarget || '',
    basedOn: f.basedOn || '',
    meta: f.meta || {},
    title: raw.title || '',
    creatorNote: raw.creatorNote || '',
    flavorText: raw.flavorText || '',
    shorthand: raw.shorthand || '',
    fullText: raw.fullExplanation || '',
    imageUrl: imageUrl
  };

  // The SigilForge tool runs the full v3 legality check in the browser: tier is set by the
  // build's total cost, afflictions gate by cost alone, and there are no Form or Tier
  // component ladders. The old vault ForgeConfig still carries the v2 ladders, so we do not
  // let it re-gate the build. Every submission is treated as authored: the vault confirms the
  // cost lands in the tier band and stores it, rather than rebuilding from stale gate data.
  payload.authored = true;
  if (typeof raw.cost === 'number') payload.cost = raw.cost;

  let similar = [];
  try { similar = await findSimilar(FORGE_KEY, payload); } catch (e) { similar = []; }

  try {
    const res = await submitCreation(FORGE_KEY, payload);
    embed.postMessage({
      type: 'LOREFELL_SUBMIT_RESULT',
      ok: !!res.ok,
      errors: res.errors || [],
      warnings: res.warnings || [],
      similar: similar
    });
  } catch (e) {
    embed.postMessage({
      type: 'LOREFELL_SUBMIT_RESULT',
      ok: false,
      errors: ['The forge could not reach the vault. Try again.'],
      warnings: [],
      similar: similar
    });
  }
}
