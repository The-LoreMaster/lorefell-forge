// scripts/seedEmbeds.js
// Pushes each /embeds/<slug>.html file into the SiteEmbeds row matched on slug.
// Updates the existing row's html, or inserts the row if the slug is new.
//
// ---- why this verifies itself ----
// A seed used to report success by asking "did every write return 2xx". It did, and the
// live threadspire embed was still 45,000 characters short: two part rows held 90,000
// base64 characters where they should have held 120,000, so the tool served on the site
// was missing the last two changes that had been made to it. Nothing failed. The run was
// green, Pages was green, and the only way anyone found out was a player noticing that a
// fix was not there.
//
// A 2xx on a write is not evidence that the bytes landed. Wix can accept a write and
// store less than it was given - a field with a maxLength shorter than the value, most
// obviously, which is exactly what base64 does to a chunk sized for plain text: 90,000
// characters in, 120,000 out, against a field that was formalized when a chunk was 90,000
// characters of HTML.
//
// So the run now ends by reading back what it wrote, decoding it exactly as get_embed
// does, reassembling it, and comparing that to the file on disk. If it does not match,
// character for character, the run fails. That is the only claim worth making: not that
// the writes were accepted, but that the site will serve the file we have.
//
// And because a truncating field is the likeliest cause and is invisible from here, a
// mismatch is not merely reported - it is repaired. The read-back tells us the largest
// value the field actually kept, the chunk size is recomputed to fit under it, and the
// slug is written again. A cap we cannot see becomes a cap we measure.
const fs = require("fs");
const path = require("path");
const { req } = require("./lib/wixClient");

const COL = "SiteEmbeds";
const dir = path.resolve(__dirname, "..", "embeds");
const TITLES = { sigilforge: "The SigilForge" };

// Wix caps a data item near 512KB. Large tools split across part rows:
// the head row carries chunk 1 and a parts count, extras live at slug#2, slug#3...
//
// Measured in BYTES, not characters. The limit that matters sits on the stored base64
// string, base64 is a function of bytes, and a character is not a byte: 90,000 characters
// of one tool is 90,048 bytes and of another exactly 90,000, so a budget counted in
// characters lands on a different base64 length every time and cannot be reasoned about.
// Counting bytes makes the arithmetic exact - four base64 characters per three bytes -
// which is what lets a measured cap become a chunk size in ONE step instead of being
// crept up on a byte at a time.
const CHUNK_BYTES = 90000;
// Below this a tool would need hundreds of rows and something else is wrong; better to
// fail loudly than to shard a file into confetti chasing a cap that is not a size cap.
const MIN_BYTES = 8000;
// get_embed fetches part rows with .limit(100); the head is separate, so 99 extras is
// the most it will ever reassemble.
const MAX_PARTS = 99;
// what a base64 string of `cap` characters can carry
const bytesForCap = (cap) => Math.floor(cap / 4) * 3;

// Wix TEXT fields trim leading and trailing whitespace, which silently corrupts chunk
// joins. Store each chunk base64 encoded so the bytes survive verbatim.
const enc = (s) => Buffer.from(s, "utf8").toString("base64");
// the same decode get_embed performs, so what is verified here is what the site serves
const dec = (row) => {
  const raw = (row && row.html) || "";
  if (row && row.enc === "b64") {
    try { return Buffer.from(raw, "base64").toString("utf8"); } catch (e) { return raw; }
  }
  return raw;
};

// Split on a byte budget, walking by code point. Walking by code point also closes a
// hazard the index-based slice carried: html.slice cuts on UTF-16 units, so a boundary
// could fall between the halves of a surrogate pair and each half would encode to a
// replacement character. The joined document would then differ from the file by a
// character nobody could see - which, before the verify below existed, is exactly the
// kind of damage that shipped green.
function splitInto(html, maxBytes) {
  const chunks = [];
  let cur = "", curBytes = 0;
  for (const ch of html) {
    const b = Buffer.byteLength(ch, "utf8");
    if (curBytes + b > maxBytes && cur) { chunks.push(cur); cur = ""; curBytes = 0; }
    cur += ch; curBytes += b;
  }
  if (cur || !chunks.length) chunks.push(cur);
  return chunks;
}

(async () => {
  if (!fs.existsSync(dir)) { console.log("no embeds dir, skipping"); return; }
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".html"));
  if (!files.length) { console.log("no embed files, skipping"); return; }

  let failed = false;
  // ---- the report has to land somewhere it can be read ----
  // Actions logs need repository admin, and the log host is not always reachable, so a
  // run that says everything it knows into stdout can still tell nobody. Every line is
  // therefore also kept and written to the collection as its own embed, which the site
  // already serves: /_functions/embed?slug=_seedreport. A seed that cannot be read is a
  // seed that has to be trusted, and being trusted rather than read is how this went
  // wrong in the first place.
  const report = [];
  const say = (line) => { report.push(line); console.log(line); };
  const cry = (line) => { report.push(line); console.error(line); };

  // ---- read the way get_embed reads ----
  // Every lookup here is a TARGETED query in the same shape the site's reader uses. The
  // previous version kept one bulk snapshot of the whole collection and filtered it in
  // JS, which is a different read from the one that serves the page, and a verify built
  // on a different read can confirm success against rows the site never sees. It was also
  // a SHARED and MUTABLE snapshot: inside the repair loop it went stale, upsert failed to
  // find rows it had just written, and inserted duplicates on top of them.
  async function query(filter, limit) {
    const q = await req('POST', '/wix-data/v2/items/query',
      { dataCollectionId: COL, query: { filter: filter, paging: { limit: limit } } });
    if (!q.ok) {
      console.error('SiteEmbeds query failed ' + q.status + ': ' + q.text.slice(0, 300));
      process.exit(1);
    }
    return (q.json.dataItems || q.json.items || []);
  }
  // one slug, every row wearing it - more than one is itself the fault, so ask for enough
  // to see that rather than a limit that hides it
  const findRows = (slugKey) => query({ slug: slugKey }, 50);
  // exactly get_embed's parts query, prefix and limit alike
  const findParts = (slug) => query({ slug: { $startsWith: slug + '#' } }, MAX_PARTS + 1);

  async function upsert(slugKey, data) {
    const hits = await findRows(slugKey);
    // Two rows for one slug is a fault in its own right: get_embed's head query takes
    // whichever comes first, so the site can serve a stale chunk while every write in
    // this run succeeded. Keep the first, delete the rest, and say so.
    for (let i = 1; i < hits.length; i++) {
      const d = await req("DELETE", "/wix-data/v2/items/" + encodeURIComponent(hits[i].id)
        + "?dataCollectionId=" + encodeURIComponent(COL), null);
      console.error((d.ok ? "removed" : "FAILED to remove") + " duplicate row for " + slugKey);
      if (!d.ok) return false;
    }
    const hit = hits[0];
    if (hit && hit.id) {
      const merged = Object.assign({}, hit.data, data);
      const u = await req("PUT", "/wix-data/v2/items/" + encodeURIComponent(hit.id),
        { dataCollectionId: COL, dataItem: { id: hit.id, data: merged } });
      if (!u.ok) { console.error("update " + slugKey + " failed " + u.status + ": " + u.text.slice(0, 300)); return false; }
      return true;
    }
    const i = await req("POST", "/wix-data/v2/items", { dataCollectionId: COL, dataItem: { data: data } });
    if (!i.ok) { console.error("insert " + slugKey + " failed " + i.status + ": " + i.text.slice(0, 300)); return false; }
    return true;
  }

  // Write one slug at a given chunk size. Returns the b64 lengths that were SENT, so the
  // verify pass can say what was kept against what was offered.
  async function writeSlug(slug, html, size) {
    const chunks = splitInto(html, size);
    // get_embed collects part rows with .limit(100). Past that it stops fetching and
    // reassembles what it has, quietly, which is the same silence this whole file exists
    // to end - only one layer further on, where nothing here can read it back. Refuse to
    // write a shape the reader cannot read.
    if (chunks.length > MAX_PARTS) {
      console.error(slug + " needs " + chunks.length + " parts at " + size
        + " bytes, and get_embed only fetches " + MAX_PARTS + ". Raise the limit in"
        + " http-functions.js before seeding this.");
      return { ok: false, sent: [], parts: chunks.length };
    }
    const b64 = chunks.map(enc);
    let ok = true;

    const head = { slug: slug, html: b64[0], parts: chunks.length, enc: "b64" };
    if (TITLES[slug]) head.title = TITLES[slug];
    if (!(await upsert(slug, head))) ok = false;

    for (let n = 2; n <= b64.length; n++) {
      if (!(await upsert(slug + "#" + n, { slug: slug + "#" + n, html: b64[n - 1], parts: 0, enc: "b64" }))) ok = false;
    }

    // remove stale part rows beyond the current count - and this matters more now that
    // the chunk size can change mid-run: shrinking it leaves the tail rows of the
    // previous shape behind, and get_embed appends every part row it finds.
    for (const row of await findParts(slug)) {
      const sv = row.data && row.data.slug;
      const n = parseInt(String(sv).split("#")[1], 10);
      if (!(n > chunks.length)) continue;
      const d = await req("DELETE", "/wix-data/v2/items/" + encodeURIComponent(row.id)
        + "?dataCollectionId=" + encodeURIComponent(COL), null);
      if (d.ok) console.log("  removed stale part " + sv);
      else { cry("  remove " + sv + " failed " + d.status); ok = false; }
    }

    return { ok: ok, sent: b64, parts: chunks.length };
  }

  // Read the rows back and rebuild the document the way get_embed rebuilds it: head,
  // then #2..#N in numeric order. What comes out of here is what the site will serve.
  async function readBack(slug) {
    const heads = await findRows(slug);
    if (heads.length > 1) {
      console.error('  ' + slug + ': ' + heads.length + ' rows share this slug. get_embed'
        + ' takes the head with .limit(1) and cannot tell you it chose between them.');
    }
    const head = heads[0];
    if (!head) return { text: null, stored: [], dupes: 0 };
    const seen = {}, parts = [];
    let dupes = 0;
    for (const row of await findParts(slug)) {
      const n = parseInt(String(row.data && row.data.slug).split('#')[1], 10);
      if (!(n >= 2)) continue;
      if (seen[n]) { dupes++; continue; }
      seen[n] = true;
      parts.push({ n: n, data: row.data });
    }
    parts.sort((a, b) => a.n - b.n);
    let text = dec(head.data);
    const stored = [head.data.html || ''];
    parts.forEach((p) => { text += dec(p.data); stored.push(p.data.html || ''); });
    return { text: text, stored: stored, dupes: dupes + Math.max(0, heads.length - 1) };
  }

  for (const file of files) {
    const slug = file.replace(/\.html$/, "");
    const html = fs.readFileSync(path.join(dir, file), "utf8");

    let size = CHUNK_BYTES;
    let done = false;

    // Two goes: the first write, and one repair at a measured chunk size. A third go was
    // worse than useless - if a measured repair does not take, the limit is not a size
    // and shrinking again only builds a stranger mixture of new and stale rows on the way
    // to the same failure.
    for (let attempt = 1; attempt <= 2 && !done; attempt++) {
      const w = await writeSlug(slug, html, size);
      if (!w.ok) { failed = true; break; }

      const back = await readBack(slug);
      if (back.text === html) {
        say("seeded " + slug + " (" + html.length + " chars, " + w.parts
          + " part" + (w.parts === 1 ? "" : "s") + " of " + size + " bytes, verified)");
        done = true;
        break;
      }

      // Say exactly which row lost what. This is the report that was missing when the
      // threadspire embed went short: every write returned 2xx and nothing named a row.
      cry("VERIFY FAILED for " + slug + ": served "
        + (back.text === null ? "nothing" : back.text.length + " chars")
        + " against " + html.length + " on disk");
      // Compare what is STORED against what was SENT, character for character. Length
      // alone is not enough, and the difference matters: a row holding the right NUMBER of
      // characters of the WRONG content reads as healthy to a length check, and that is
      // exactly the state a rewrite at a new chunk size leaves a refusing row in. Each
      // verdict below accuses a different layer, so they are kept apart:
      //   truncated  a genuine prefix of what was sent - a field length cap, measurable
      //   refused    kept nothing at all - a rejected write, not a size
      //   wrong      full length but different bytes - the row did not take the write
      //   missing    no such row came back
      let cap = 0, refused = 0, missing = 0;
      const wrong = [];
      w.sent.forEach((sentVal, i) => {
        const got = back.stored[i];
        const label = i === 0 ? slug : slug + "#" + (i + 1);
        if (got === undefined) {
          cry("  " + label + ": row missing entirely (sent " + sentVal.length + ")");
          missing++;
          return;
        }
        if (got === sentVal) return;                      /* this row is exactly right */
        if (got === "") {
          cry("  " + label + ": kept NOTHING of " + sentVal.length
            + " b64 chars - the write was refused");
          refused++;
          return;
        }
        if (got.length < sentVal.length && sentVal.indexOf(got) === 0) {
          cry("  " + label + ": kept the first " + got.length + " of " + sentVal.length
            + " b64 chars - truncated");
          cap = cap ? Math.min(cap, got.length) : got.length;
          return;
        }
        cry("  " + label + ": holds " + got.length + " b64 chars that are NOT what was"
          + " sent (" + sentVal.length + ") - the row did not take the write");
        wrong.push(label);
      });

      if (wrong.length) {
        cry('  ' + wrong.join(', ') + ' did not take the write. This is not a size limit'
          + ' and no chunk size will fix it - the row is being refused or overwritten by'
          + ' something else. Not retrying.');
        failed = true;
        break;
      }
      if (refused || missing) {
        // Not a length cap, so a smaller chunk would only hide this behind a different
        // shape of the same silence.
        cry("  " + (refused ? refused + " row(s) kept nothing" : "")
          + (refused && missing ? " and " : "")
          + (missing ? missing + " row(s) absent" : "")
          + " - this is not a field-length cap, so a smaller chunk cannot fix it. Not retrying.");
        failed = true;
        break;
      }
      if (!cap) {
        cry("  the rows are all full length yet the document does not match:"
          + " the fault is in the ORDER or the ENCODING, not the size. Not retrying.");
        failed = true;
        break;
      }

      // The field kept `capped` base64 characters, so it will hold that many again.
      // Three bytes per four base64 characters, exactly, so this is one step and not a
      // search. Halve instead if the measured cap somehow does not shrink the budget, so
      // an answer we did not anticipate still terminates.
      let next = bytesForCap(cap);
      if (next >= size) next = Math.floor(size / 2);
      if (next < MIN_BYTES) {
        cry("  cannot find a workable chunk size for " + slug);
        failed = true;
        break;
      }
      cry("  the field kept " + cap + " b64 chars; rewriting " + slug
        + " at a chunk of " + next + " bytes");
      size = next;
    }

    if (!done && !failed) {
      cry("VERIFY FAILED for " + slug + " after every attempt");
      failed = true;
    }
  }

  // written before the exit code is decided, so a FAILING run still leaves its reasons
  // somewhere legible rather than only in a log nobody can open
  report.unshift('seed report - ' + files.length + ' embeds');
  try {
    await upsert('_seedreport', { slug: '_seedreport', parts: 1, enc: 'plain',
                                  html: report.join(String.fromCharCode(10)).slice(0, 60000) });
    console.log('report written to /_functions/embed?slug=_seedreport');
  } catch (e) { console.error('could not write the seed report: ' + e); }

  if (failed) {
    console.error("");
    console.error("One or more embeds do not match the file on disk. The site is serving");
    console.error("something other than what is in this repo. Failing the run.");
    process.exit(1);
  }
  console.log("all embeds verified against disk");
})();
