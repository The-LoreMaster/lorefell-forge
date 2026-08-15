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
  // Was .limit(1). Kept at 50 so duplicates can be SEEN; heads[0] is still what is served,
  // so behaviour is unchanged for every caller that is not asking for the diagnostic.
  return wixData.query('SiteEmbeds')
    .eq('slug', slug)
    .limit(50)
    .find({ suppressAuth: true })
    .then((res) => {
      const heads = res.items || [];
      const item = heads[0];
      if (!item || !item.html) {
        return notFound({ headers: htmlHeaders(), body: '<!doctype html><meta charset="utf-8"><p>No embed for ' + slug + '.</p>' });
      }
      // Large tools split across part rows at slug#2, slug#3... Always look for
      // parts and reassemble in numeric order. Rows may be base64 encoded (enc b64)
      // so Wix TEXT field whitespace trimming cannot corrupt chunk joins.
      // ---- decoding, and why it was wrong ----
      // This used to be decodeURIComponent(escape(atob(raw))), and that idiom requires
      // atob to hand back a BINARY string - one character per byte, every code unit under
      // 256 - so that escape can turn each byte into %XX and decodeURIComponent can read
      // the run of them as UTF-8. In this backend atob does not do that. It returns a
      // string that has ALREADY been decoded as UTF-8.
      //
      // For a chunk of pure ASCII that difference does not exist and the idiom round-trips
      // perfectly. For a chunk holding even one character above 0x7F, escape emits a
      // single %XX for a whole code point, decodeURIComponent finds a byte that cannot
      // start a UTF-8 sequence, and throws URIError.
      //
      // Which is exactly what the site was showing: of seven part rows, the only two that
      // decoded were the only two whose source is pure ASCII. The base64 was never
      // corrupt, the rows were never truncated and the seed was never at fault - every
      // chunk carrying an en dash or a middle dot simply failed to decode and was served
      // as base64 text.
      //
      // Buffer.from is the decode this environment actually has, and it is the same one
      // the seeder verifies with, so the two ends now agree by construction rather than
      // by coincidence.
      const decodeFailed = [];
      const dec = (row) => {
        const raw = (row && row.html) || '';
        if (!row || row.enc !== 'b64') return raw;
        try {
          const out = Buffer.from(raw, 'base64').toString('utf8');
          /* a decode that produced nothing from something is a failure wearing a success */
          if (out || !raw) return out;
        } catch (e) { /* fall through and be loud about it */ }
        try {
          /* if Buffer is ever unavailable here, this is the correct modern equivalent */
          const bin = atob(raw);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          return new TextDecoder('utf-8').decode(bytes);
        } catch (e2) { /* nothing left to try */ }
        // NEVER return the raw base64 as though it were the document. That silent
        // fallback is what let a broken decode look like a broken deploy for a week: the
        // page was served, it was the right length, and it was base64. Say so instead.
        decodeFailed.push((row && row.slug) || '?');
        return '';
      };
      return wixData.query('SiteEmbeds')
        .startsWith('slug', slug + '#')
        .limit(100)
        .find({ suppressAuth: true })
        .then((pr) => {
          const parts = [];
          (pr.items || []).forEach((it) => {
            const n = parseInt(String(it.slug).split('#')[1], 10);
            /* the row itself is kept now, not only its decoded text, because who a row IS
               turned out to matter more than how long it is */
            if (n >= 2) parts.push({ n: n, row: it });
          });
          parts.sort((a, b) => a.n - b.n);
          const headHtml = dec(item);

          // GET ...&sample=3        the stored value of part 3, examined rather than summed
          // GET ...&sample=head     the head row
          //
          // Lengths took us as far as they can. Two rows decode and five do not, and the
          // five are exactly the chunks whose SOURCE contains non-ASCII characters - which
          // should be irrelevant, because base64 output is ASCII whatever went into it. So
          // the next thing to look at is the characters themselves.
          //
          // This reports the first character that is not in the standard base64 alphabet,
          // with its position and code, and the text either side of it. One character is
          // all it takes: '-' or '_' means the value was written base64URL, which node's
          // Buffer.from accepts and atob rejects - and would explain a seed verifying
          // against disk while this endpoint serves the raw string. A space means
          // something turned '+' into one. Anything else names its own cause.
          if (request.query && request.query.sample) {
            const which = String(request.query.sample);
            const row = (which === 'head' || which === '1') ? item
                      : (parts.filter((p) => String(p.n) === which)[0] || {}).row;
            if (!row) {
              return ok({ headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
                          body: 'no row ' + which + ' for ' + slug + '\n' });
            }
            const raw = String(row.html || '');
            let rep = 'slug ' + slug + ' sample ' + which + '\n';
            rep += 'id=' + (row._id || '?') + ' enc=' + (row.enc || 'PLAIN') + ' stored=' + raw.length + '\n';
            /* the standard alphabet, and nothing else - padding only at the very end */
            let bad = -1;
            for (let i = 0; i < raw.length; i++) {
              const c = raw.charAt(i);
              const okChar = (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')
                          || (c >= '0' && c <= '9') || c === '+' || c === '/' || c === '=';
              if (!okChar) { bad = i; break; }
            }
            if (bad < 0) {
              rep += 'every character is in the standard base64 alphabet.\n';
              rep += 'length % 4 = ' + (raw.length % 4) + '   (must be 0)\n';
              const pad = (raw.match(/=+$/) || [''])[0].length;
              rep += 'trailing padding = ' + pad + '\n';
              const eq = (raw.match(/=/g) || []).length;
              rep += 'total "=" anywhere = ' + eq + (eq > pad ? '   <-- padding INSIDE the value' : '') + '\n';
            } else {
              const c = raw.charCodeAt(bad);
              rep += 'FIRST INVALID CHARACTER at index ' + bad + '\n';
              rep += '  char  = ' + JSON.stringify(raw.charAt(bad)) + '\n';
              rep += '  code  = ' + c + ' (0x' + c.toString(16) + ')\n';
              rep += '  before: ' + JSON.stringify(raw.slice(Math.max(0, bad - 24), bad)) + '\n';
              rep += '  after : ' + JSON.stringify(raw.slice(bad + 1, bad + 25)) + '\n';
              const dash = (raw.match(/-/g) || []).length, und = (raw.match(/_/g) || []).length;
              const sp = (raw.match(/ /g) || []).length;
              rep += 'counts across the whole value: "-"=' + dash + '  "_"=' + und + '  " "=' + sp + '\n';
              if (dash || und) {
                rep += '\nNOTE: "-" and "_" are the base64URL alphabet. Buffer.from accepts'
                     + ' them and atob does not, which is exactly a seed that verifies'
                     + ' against disk and an endpoint that serves the raw string.\n';
              }
            }
            rep += '\nfirst 120 characters as stored:\n' + JSON.stringify(raw.slice(0, 120)) + '\n';
            rep += 'last 120 characters as stored:\n' + JSON.stringify(raw.slice(-120)) + '\n';
            return ok({ headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }, body: rep });
          }

          if (request.query && request.query.info) {
            const line = (label, row) => {
              const raw = String((row && row.html) || '');
              return label
                + ' id=' + ((row && row._id) || '?')
                + ' enc=' + ((row && row.enc) || 'PLAIN')
                + ' stored=' + raw.length
                + ' decoded=' + dec(row).length
                + ' updated=' + ((row && row._updatedDate) || '?')
                + '\n';
            };
            let rep = 'slug ' + slug + '\n';
            rep += 'rows wearing this exact slug: ' + heads.length
                 + (heads.length > 1 ? '   <-- DUPLICATE HEADS, only the first is served' : '')
                 + '\n';
            heads.forEach((h, i) => { rep += line(i === 0 ? '  head SERVED' : '  head IGNORED', h); });

            /* a part number appearing twice is the same fault one level down, and the
               reassembly below would append both */
            const seen = {}, dupes = [];
            parts.forEach((p) => {
              if (seen[p.n]) dupes.push(p.n); else seen[p.n] = true;
            });
            rep += 'part rows: ' + parts.length
                 + (dupes.length ? '   <-- DUPLICATE PART NUMBERS: ' + dupes.join(', ') : '')
                 + '\n';
            parts.forEach((p) => { rep += line('  part ' + p.n, p.row); });

            /* both totals, because confusing one for the other is what sent us in circles:
               `stored` is base64 and `decoded` is the document the browser receives */
            let rawTot = String(item.html || '').length, decTot = headHtml.length;
            parts.forEach((p) => {
              rawTot += String(p.row.html || '').length;
              decTot += dec(p.row).length;
            });
            rep += 'total stored (base64 as held): ' + rawTot + '\n';
            rep += 'total decoded (what is served): ' + decTot + '\n';
            /* if these are equal, nothing decoded, which means no row carried enc=b64 */
            if (rawTot === decTot) {
              rep += '\nNOTE: stored and decoded are identical, so NOTHING was decoded.'
                   + ' No row here carries enc=b64. Whoever wrote these rows was not the'
                   + ' seed that writes enc=b64 on every row.\n';
            }
            return ok({ headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }, body: rep });
          }

          let body = headHtml;
          parts.forEach((p) => { body += dec(p.row); });
          /* A tool with a hole in it is not a tool. Better a page that says which rows
             would not decode than one that is silently missing a third of itself. */
          if (decodeFailed.length) {
            return serverError({ headers: htmlHeaders(),
              body: '<!doctype html><meta charset="utf-8">'
                  + '<p>Could not decode ' + decodeFailed.length + ' row(s) of ' + slug
                  + ': ' + decodeFailed.join(', ') + '</p>' });
          }
          return ok({ headers: htmlHeaders(), body: body });
        });
    })
    .catch((err) => serverError({ headers: htmlHeaders(), body: '<!doctype html><meta charset="utf-8"><p>' + String(err) + '</p>' }));
}

// GET /_functions/advinfo?adv=<adventureId>
// Read-only. For one adventure it dumps the shared Adventures tree (what ThreadSpire writes),
// the Campaigns blob (what FateWell writes), each with its write time, and the last-write-wins
// verdict FateWell reaches on load. Use it to see whether a ThreadSpire edit actually landed in
// the tree, and which source is fresher. Nothing is written.
export function get_advinfo(request) {
  const adv = (request.query && (request.query.adv || request.query.id)) || '';
  const H = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' };
  if (!adv) return ok({ headers: H, body: 'Add ?adv=<adventureId> (the campaign/adventure id in the tool URL).' });
  const ms = d => (d ? new Date(d).getTime() : 0);
  const iso = d => (d ? new Date(d).toISOString() : '(none)');
  const R = (coll) => wixData.query(coll).eq('advId', adv).limit(1000).find({ suppressAuth: true, consistentRead: true }).then(r => r.items).catch(() => []);
  return Promise.all([
    wixData.get('Adventures', adv, { suppressAuth: true, consistentRead: true }).catch(() => null),
    R('AdvActs'), R('AdvSessions'), R('AdvScenes'),
    wixData.get('Campaigns', adv, { suppressAuth: true, consistentRead: true }).catch(() => null),
    R('AdvDeletes')
  ]).then(([root, acts, ses, scn, blob, dels]) => {
    const stamps = [root && root._updatedDate]
      .concat(acts.map(r => r._updatedDate), ses.map(r => r._updatedDate), scn.map(r => r._updatedDate))
      .filter(Boolean).map(ms);
    const treeAt = stamps.length ? Math.max.apply(null, stamps) : 0;
    const blobAt = blob ? ms(blob._updatedDate) : 0;
    const treeHas = !!(root || acts.length);
    const verdict = (treeHas && (!blob || treeAt > blobAt))
      ? 'TREE wins  -> FateWell loads the shared tree (ThreadSpire edits show)'
      : (blob ? 'BLOB wins  -> FateWell loads its own copy (ThreadSpire edits do NOT show)' : 'nothing stored');
    let out = 'adventure ' + adv + '\n' + new Date().toISOString() + '\n\n';
    out += '== TREE  (shared source, ThreadSpire writes here) ==\n';
    out += 'root: ' + (root ? (JSON.stringify(root.name || '') + '  updated=' + iso(root._updatedDate)) : '(NO ROOT ROW)') + '\n';
    out += 'acts (' + acts.length + '):\n';
    acts.forEach(a => { out += '  ' + a.actId + '  ' + JSON.stringify(a.name || '') + '  updated=' + iso(a._updatedDate) + '\n'; });
    out += 'sessions=' + ses.length + '  scenes=' + scn.length + '\n';
    const dA = new Set(acts.map(a => a.actId)).size, dSe = new Set(ses.map(s => s.sesId)).size, dSc = new Set(scn.map(s => s.sceneId)).size;
    if (dA !== acts.length || dSe !== ses.length || dSc !== scn.length) {
      out += 'DISTINCT: acts=' + dA + ' sessions=' + dSe + ' scenes=' + dSc + '  (duplicate rows present; heal on next FateWell save)\n';
    }
    out += 'tree newest write: ' + iso(treeAt ? new Date(treeAt) : null) + '\n\n';
    out += '== BLOB  (Campaigns, FateWell writes here) ==\n';
    out += (blob ? (JSON.stringify(blob.name || '') + '  updated=' + iso(blob._updatedDate)) : '(NO BLOB ROW)') + '\n\n';
    out += '== VERDICT ==\n';
    out += 'treeAt ' + (treeAt > blobAt ? '>' : (treeAt === blobAt ? '=' : '<')) + ' blobAt\n';
    out += verdict + '\n\n';
    out += '== TOMBSTONES (AdvDeletes -> the deletedIds FateWell receives) ==\n';
    if (!dels.length) out += '(none)\n';
    const nowMs = Date.now();
    dels.forEach(t => {
      const age = Math.round((nowMs - (t.deletedAt || 0)) / 1000);
      out += '  ' + (t.kind || '?') + ' ' + (t.targetId || '?') + '  age=' + age + 's  deletedAt=' + iso(t.deletedAt) + '\n';
    });
    return ok({ headers: H, body: out });
  }).catch(err => serverError({ headers: H, body: String(err) }));
}

// GET /_functions/advorphans  - READ ONLY. Lists every Adventures root grouped by owner, with
// child counts, and flags duplicate names, roots with no Campaigns blob, empty trees, and blobs
// with no root. Nothing is deleted; this is the eyeball pass before any cleanup.
export function get_advorphans(request) {
  const H = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' };
  const iso = d => (d ? new Date(d).toISOString() : '(none)');
  const all = coll => wixData.query(coll).limit(1000).find({ suppressAuth: true, consistentRead: true }).then(r => r.items).catch(() => []);
  return Promise.all([all('Adventures'), all('Campaigns'), all('AdvActs'), all('AdvSessions'), all('AdvScenes')])
    .then(([advs, blobs, acts, ses, scn]) => {
      const tally = rows => { const m = {}; rows.forEach(r => { m[r.advId] = (m[r.advId] || 0) + 1; }); return m; };
      const aC = tally(acts), sC = tally(ses), cC = tally(scn);
      const blobById = {}; blobs.forEach(b => { blobById[b._id] = b; });
      const advById = {}; advs.forEach(a => { advById[a._id] = a; });
      let out = 'ADVENTURE ORPHAN / DUPLICATE REPORT (READ ONLY)\n' + new Date().toISOString() + '\n\n';
      out += 'Adventures roots: ' + advs.length + '   Campaigns blobs: ' + blobs.length + '\n';
      out += 'AdvActs: ' + acts.length + '   AdvSessions: ' + ses.length + '   AdvScenes: ' + scn.length + '\n\n';
      const byOwner = {};
      advs.forEach(a => { const o = a.ownerMemberId || '(no owner)'; (byOwner[o] = byOwner[o] || []).push(a); });
      Object.keys(byOwner).forEach(owner => {
        const list = byOwner[owner];
        const nameCount = {}; list.forEach(a => { const n = (a.name || '').toLowerCase().trim(); nameCount[n] = (nameCount[n] || 0) + 1; });
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        out += '== owner ' + owner + '  (' + list.length + ' roots) ==\n';
        list.forEach(a => {
          const flags = [];
          if ((nameCount[(a.name || '').toLowerCase().trim()] || 0) > 1) flags.push('DUPLICATE-NAME');
          if (!blobById[a._id]) flags.push('NO-BLOB');
          const kids = (aC[a._id] || 0) + (sC[a._id] || 0) + (cC[a._id] || 0);
          if (kids === 0) flags.push('EMPTY-TREE');
          out += '  ' + a._id + '  ' + JSON.stringify(a.name || '') +
                 '  acts=' + (aC[a._id] || 0) + ' ses=' + (sC[a._id] || 0) + ' scn=' + (cC[a._id] || 0) +
                 '  updated=' + iso(a._updatedDate) +
                 (flags.length ? '  <<< ' + flags.join(', ') : '') + '\n';
        });
        out += '\n';
      });
      const orphanBlobs = blobs.filter(b => !advById[b._id]);
      out += '== Campaigns blobs with NO Adventures root (' + orphanBlobs.length + ') ==\n';
      if (!orphanBlobs.length) out += '(none)\n';
      orphanBlobs.forEach(b => { out += '  ' + b._id + '  ' + JSON.stringify(b.name || '') + '  updated=' + iso(b._updatedDate) + '\n'; });
      out += '\nREAD-ONLY. Nothing was changed. Review before any cleanup.\n';
      return ok({ headers: H, body: out });
    })
    .catch(e => serverError({ headers: H, body: 'error: ' + ((e && e.message) || e) }));
}

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

