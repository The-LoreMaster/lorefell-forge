import { ok, notFound, serverError, badRequest } from 'wix-http-functions';
import wixData from 'wix-data';

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
      const parts = item.parts | 0;
      if (parts <= 1) return ok({ headers: htmlHeaders(), body: item.html });
      // Large tools split across part rows at slug#2, slug#3... Reassemble in order.
      return wixData.query('SiteEmbeds')
        .startsWith('slug', slug + '#')
        .limit(50)
        .find({ suppressAuth: true })
        .then((pr) => {
          const byN = {};
          pr.items.forEach((it) => {
            const n = parseInt(String(it.slug).split('#')[1], 10);
            if (n >= 2) byN[n] = it.html || '';
          });
          let body = item.html;
          for (let n = 2; n <= parts; n++) body += (byN[n] || '');
          return ok({ headers: htmlHeaders(), body: body });
        });
    })
    .catch((err) => serverError({ headers: htmlHeaders(), body: '<!doctype html><meta charset="utf-8"><p>' + String(err) + '</p>' }));
}

function htmlHeaders() {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache'
  };
}

