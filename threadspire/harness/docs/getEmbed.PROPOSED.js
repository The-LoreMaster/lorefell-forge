// PROPOSED replacement for get_embed in velo/backend/http-functions.js
//
// velo/ is guard-denied, so this is written here to be pasted by hand. Replace ONLY the
// get_embed function; everything else in that file (jsonHeaders, htmlHeaders, the other
// endpoints) stays exactly as it is. Delete this file once applied.
//
// ---- what this is for ----
// The seed reads the rows back through get_embed's own query shapes, decodes them,
// reassembles, and matches the file on disk exactly. ?info=1 on the very same slug
// reports part rows that are 45,000 characters short and have not changed by a single
// byte across three re-seeds. Both cannot be true of the same rows.
//
// The clue that breaks the tie is the ENCODING. The info report sums dec(row), yet a full
// part reads 120,000 - which is the length of the base64 STRING, not of the 90,000 bytes
// it encodes. dec() only decodes when row.enc === 'b64', so the rows this endpoint is
// reading do not carry that flag. The seed writes enc:'b64' on every row and its own dec()
// makes the same test, so had it been reading these rows its verify could not have passed.
//
// So the question is no longer "why are two rows short". It is "which rows is each side
// actually touching", and nothing in the current output can answer that, because it prints
// lengths and nothing that identifies a row.
//
// This adds, per row: the id, the enc flag, the RAW stored length, the DECODED length, and
// - the decisive one - the last-updated date. If the served rows were last written long
// before today's seeds, then the seed is not writing where this endpoint is reading, and
// every re-seed has been landing somewhere the site never looks. That would explain the
// byte-for-byte invariance, the missing enc flag, and the old chunk boundaries together,
// and it is the one explanation that does not require two rows to be special.
//
// It also stops hiding duplicates. The head lookup was .limit(1), so a second row wearing
// the same slug was invisible and unreportable: the endpoint would quietly serve whichever
// came first while every write succeeded against the other.

// GET /_functions/embed?slug=sigilforge
// GET /_functions/embed?slug=sigilforge&info=1   <- the diagnostic
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
      const dec = (row) => {
        const raw = (row && row.html) || '';
        if (row && row.enc === 'b64') { try { return decodeURIComponent(escape(atob(raw))); } catch (e) { return raw; } }
        return raw;
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
          return ok({ headers: htmlHeaders(), body: body });
        });
    })
    .catch((err) => serverError({ headers: htmlHeaders(), body: '<!doctype html><meta charset="utf-8"><p>' + String(err) + '</p>' }));
}
