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
      // Large tools split across part rows at slug#2, slug#3... Always look for
      // parts and reassemble in numeric order. No dependence on a parts field.
      return wixData.query('SiteEmbeds')
        .startsWith('slug', slug + '#')
        .limit(100)
        .find({ suppressAuth: true })
        .then((pr) => {
          const parts = [];
          pr.items.forEach((it) => {
            const n = parseInt(String(it.slug).split('#')[1], 10);
            if (n >= 2) parts.push({ n: n, html: it.html || '' });
          });
          parts.sort((a, b) => a.n - b.n);
          if (request.query && request.query.info) {
            let rep = 'slug ' + slug + '\nhead ' + (item.html || '').length + ' chars\n';
            parts.forEach((x) => { rep += 'part ' + x.n + ' ' + x.html.length + ' chars\n'; });
            let tot = (item.html || '').length; parts.forEach((x) => { tot += x.html.length; });
            rep += 'total ' + tot + ' chars\n';
            return ok({ headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }, body: rep });
          }
          let body = item.html;
          parts.forEach((x) => { body += x.html; });
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

