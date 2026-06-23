import { ok, notFound, serverError, badRequest } from 'wix-http-functions';
import wixData from 'wix-data';
import { CANON_BONDS } from 'backend/canonBonds.js';

// GET /_functions/embed?slug=sigilforge
// Returns the stored SiteEmbeds.html verbatim as a full HTML document.
export function get_embed(request) {
  const slug = (request.query && request.query.slug) || '';
  if (!slug) {
    return badRequest({ headers: htmlHeaders(), body: '<!doctype html><meta charset="utf-8"><p>Missing slug.</p>' });
  }
  return wixData.query('SiteEmbeds')
    .eq('slug', slug)
    .limit(1)
    .find({ suppressAuth: true })
    .then((res) => {
      const item = res.items[0];
      if (!item || !item.html) {
        return notFound({ headers: htmlHeaders(), body: '<!doctype html><meta charset="utf-8"><p>No embed for ' + slug + '.</p>' });
      }
      return ok({ headers: htmlHeaders(), body: item.html });
    })
    .catch((err) => serverError({ headers: htmlHeaders(), body: '<!doctype html><meta charset="utf-8"><p>' + String(err) + '</p>' }));
}

function htmlHeaders() {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache'
  };
}

// One-time canon seed for BondForge. Visit /_functions/seedBonds?key=skyvault once.
// Idempotent: inserts only the canon bonds not already present. Safe to leave in place.
export async function get_seedBonds(request) {
  if (!request.query || request.query.key !== 'skyvault') return badRequest({ body: { error: 'denied' } });
  const existing = await wixData.query('Creations')
    .eq('forgeKey', 'bondforge').eq('kind', 'bond').eq('canonStatus', 'canon')
    .limit(1000).find({ suppressAuth: true });
  const have = {};
  existing.items.forEach(function (i) { have[i.creationName] = true; });
  const toAdd = CANON_BONDS.filter(function (b) { return !have[b.creationName]; });
  if (toAdd.length) await wixData.bulkInsert('Creations', toAdd, { suppressAuth: true });
  return ok({ body: { seeded: toAdd.length, alreadyPresent: existing.items.length } });
}
