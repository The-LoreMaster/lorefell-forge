import { ok, notFound, serverError, badRequest } from 'wix-http-functions';
import wixData from 'wix-data';
import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';

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
      // parts and reassemble in numeric order. Rows may be base64 encoded (enc b64)
      // so Wix TEXT field whitespace trimming cannot corrupt chunk joins.
      const dec = (row) => {
        const raw = row.html || '';
        if (row.enc === 'b64') { try { return decodeURIComponent(escape(atob(raw))); } catch (e) { return raw; } }
        return raw;
      };
      return wixData.query('SiteEmbeds')
        .startsWith('slug', slug + '#')
        .limit(100)
        .find({ suppressAuth: true })
        .then((pr) => {
          const parts = [];
          pr.items.forEach((it) => {
            const n = parseInt(String(it.slug).split('#')[1], 10);
            if (n >= 2) parts.push({ n: n, html: dec(it) });
          });
          parts.sort((a, b) => a.n - b.n);
          const headHtml = dec(item);
          if (request.query && request.query.info) {
            let rep = 'slug ' + slug + '\nenc ' + (item.enc || 'plain') + '\nhead ' + headHtml.length + ' chars\n';
            parts.forEach((x) => { rep += 'part ' + x.n + ' ' + x.html.length + ' chars\n'; });
            let tot = headHtml.length; parts.forEach((x) => { tot += x.html.length; });
            rep += 'total ' + tot + ' chars\n';
            return ok({ headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }, body: rep });
          }
          let body = headHtml;
          parts.forEach((x) => { body += x.html; });
          return ok({ headers: htmlHeaders(), body: body });
        });
    })
    .catch((err) => serverError({ headers: htmlHeaders(), body: '<!doctype html><meta charset="utf-8"><p>' + String(err) + '</p>' }));
}

// POST /_functions/aiforge
// Body: { system, messages, max_tokens, model }
// HTTP functions carry a longer timeout than web methods, so this path avoids
// the gateway 504 that a slow model call triggers through a webMethod.
export function get_aiforge(request) {
  // GET returns a version stamp so you can confirm the deployed build in a browser
  return ok({ headers: jsonHeaders(), body: { ok: true, version: 'aiforge-v2-wixfetch-guard', hint: 'POST here with {system,messages,max_tokens,model} to generate' } });
}
export function post_aiforge(request) {
  return request.body.json()
    .then((opts) => {
      opts = opts || {};
      return getSecret('ANTHROPIC_API_KEY').then((key) => {
        const call = fetch('https://api.anthropic.com/v1/messages', {
          method: 'post',
          headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: opts.model === 'fast' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6',
            max_tokens: Math.min(opts.max_tokens || 700, 4000),
            system: opts.system || '',
            messages: Array.isArray(opts.messages) ? opts.messages : []
          })
        });
        const guard = new Promise((_, rej) => setTimeout(() => rej(new Error('anthropic call exceeded 25s')), 25000));
        return Promise.race([call, guard]).then((res) => {
          if (!res.ok) {
            return res.text().then((b) => ok({ headers: jsonHeaders(), body: { ok: false, status: res.status, error: (b || '').slice(0, 240) } }));
          }
          return res.json().then((data) => {
            const text = (data.content || []).filter((x) => x.type === 'text').map((x) => x.text).join('');
            return ok({ headers: jsonHeaders(), body: { ok: true, text: text } });
          });
        });
      });
    })
    .catch((err) => serverError({ headers: jsonHeaders(), body: { ok: false, error: String(err) } }));
}

function jsonHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache'
  };
}

function htmlHeaders() {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache'
  };
}

