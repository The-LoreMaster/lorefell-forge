// The SigilForge page code.
// Set the Embed a Site element's ID to match EMBED below (Wix default is often #html1).
// The tool is self-contained for its UI, so the page only relays submissions and
// feedback. It re-validates nothing itself, the backend does that, this is just the wire.

import { submitCreation, findSimilar, getCreations } from 'backend/forge.web.js';
import { uploadRune } from 'backend/loreforge.web.js';
import { currentMember } from 'wix-members-frontend';

const FORGE_KEY = 'sigilforge';
const EMBED = '#html1';   // change to your Embed a Site element ID

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'LOREFELL_ABILITY_SUBMIT') {
      await handleSubmit(embed, msg.payload || {});
    } else if (msg.type === 'LOREFELL_CHECK_OVERLAP') {
      const cf = (msg.payload && msg.payload.forge) || {};
      let matches = [];
      try { matches = await findSimilar(FORGE_KEY, cf); } catch (e) { matches = []; }
      embed.postMessage({ type: 'LOREFELL_OVERLAP_RESULT', matches: matches });
    } else if (msg.type === 'LOREFELL_LOAD_LEDGER') {
      const scope = (msg.payload && msg.payload.scope) || 'all';
      const opts = { limit: 60 };
      if (scope === 'canon') opts.canonStatus = 'canon';
      if (scope === 'mine') {
        try { const me = await currentMember.getMember(); if (me) opts.creatorMemberId = me._id; }
        catch (e) {}
      }
      let items = [];
      try { items = await getCreations(FORGE_KEY, opts); } catch (e) { items = []; }
      embed.postMessage({ type: 'LOREFELL_LEDGER_RESULT', scope: scope, items: items });
    } else if (msg.type === 'LOREFELL_FEEDBACK_SUBMIT') {
      // No feedback collection yet. Logged for now, wire a collection later if wanted.
      console.log('SigilForge feedback:', JSON.stringify(msg.payload || {}));
    }
  });
});

async function handleSubmit(embed, raw) {
  const f = raw.forge || {};

  // Store the rune snapshot if present. A media hiccup never blocks the submission.
  let imageUrl = '';
  if (raw.runePng) {
    try { imageUrl = await uploadRune(raw.runePng, raw.title || 'sigil'); }
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
