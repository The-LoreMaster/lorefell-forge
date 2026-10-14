// public/abilitySubmit.js
//
// The one LoreForge submit for an ability build. The SigilForge page used to hold this
// inside its own handleSubmit. The FellGlass sheet's builder ("Make your own" at an
// ability slot) sends the SigilForge's exact payload, so the sheet's bridge
// (public/fgSheetBridge.js) runs it through this same function rather than a second copy.
// Both answer the frame with LOREFELL_SUBMIT_RESULT built from what this returns.
//
// It imports nothing. The caller passes the web methods it already imports:
//   api.submitCreation(forgeKey, payload)   backend/forge.web.js
//   api.findSimilar(forgeKey, payload)      backend/forge.web.js
//   api.uploadRune(png, name)               backend/loreforge.web.js
// raw is the tool's payload: { forge, title, creatorNote, flavorText, shorthand,
// fullExplanation, cost, runePng }. Returns { ok, errors, warnings, similar }.

export const FORGE_KEY = 'sigilforge';

// Every uploaded image gets a unique media name so two uploads can never collide
// and overwrite each other (a same-name upload can replace the prior file).
export function uniqName(base) {
  return String(base || 'img').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 40)
    + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export async function submitAbility(raw, api) {
  raw = raw || {};
  const f = raw.forge || {};

  // Store the rune snapshot if present. A media hiccup never blocks the submission.
  let imageUrl = '';
  if (raw.runePng) {
    try { imageUrl = await api.uploadRune(raw.runePng, uniqName(raw.title || 'sigil')); }
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
  try { similar = await api.findSimilar(FORGE_KEY, payload); } catch (e) { similar = []; }

  try {
    const res = await api.submitCreation(FORGE_KEY, payload);
    return { ok: !!res.ok, errors: res.errors || [], warnings: res.warnings || [], similar: similar };
  } catch (e) {
    return { ok: false, errors: ['The forge could not reach the vault. Try again.'], warnings: [], similar: similar };
  }
}
