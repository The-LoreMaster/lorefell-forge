// scripts/seedEmbeds.js
// Pushes each /embeds/<slug>.html file into the SiteEmbeds row matched on slug.
// Updates the existing row's html, or inserts the row if the slug is new.
const fs = require("fs");
const path = require("path");
const { req } = require("./lib/wixClient");

const COL = "SiteEmbeds";
const dir = path.resolve(__dirname, "..", "embeds");
const TITLES = { sigilforge: "The SigilForge" };

(async () => {
  if (!fs.existsSync(dir)) { console.log("no embeds dir, skipping"); return; }
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".html"));
  if (!files.length) { console.log("no embed files, skipping"); return; }

  const q = await req("POST", "/wix-data/v2/items/query", { dataCollectionId: COL, query: { paging: { limit: 1000 } } });
  if (!q.ok) { console.error("SiteEmbeds query failed " + q.status + ": " + q.text.slice(0, 300)); process.exit(1); }
  const existing = (q.json.dataItems || q.json.items || []);
  let failed = false;

  // Wix caps a data item near 512KB. Large tools split across part rows:
  // the head row carries chunk 1 and a parts count, extras live at slug#2, slug#3...
  const CHUNK = 90000;

  async function upsert(slugKey, data){
    const hit = existing.find(e => e.data && e.data.slug === slugKey);
    if (hit && hit.id) {
      const merged = Object.assign({}, hit.data, data);
      const u = await req("PUT", "/wix-data/v2/items/" + encodeURIComponent(hit.id), { dataCollectionId: COL, dataItem: { id: hit.id, data: merged } });
      if (!u.ok) { console.error("update " + slugKey + " failed " + u.status + ": " + u.text.slice(0, 300)); return false; }
      console.log("updated embed " + slugKey + " (" + (data.html || "").length + " bytes)");
      return true;
    }
    const i = await req("POST", "/wix-data/v2/items", { dataCollectionId: COL, dataItem: { data: data } });
    if (!i.ok) { console.error("insert " + slugKey + " failed " + i.status + ": " + i.text.slice(0, 300)); return false; }
    console.log("inserted embed " + slugKey + " (" + (data.html || "").length + " bytes)");
    return true;
  }

  for (const file of files) {
    const slug = file.replace(/\.html$/, "");
    const html = fs.readFileSync(path.join(dir, file), "utf8");
    const chunks = [];
    for (let i = 0; i < html.length; i += CHUNK) chunks.push(html.slice(i, i + CHUNK));
    if (!chunks.length) chunks.push("");

    const head = { slug: slug, html: chunks[0], parts: chunks.length };
    if (TITLES[slug]) head.title = TITLES[slug];
    if (!(await upsert(slug, head))) failed = true;

    for (let n = 2; n <= chunks.length; n++) {
      if (!(await upsert(slug + "#" + n, { slug: slug + "#" + n, html: chunks[n - 1], parts: 0 }))) failed = true;
    }

    // remove stale part rows beyond the current count
    const stale = existing.filter(e => {
      const sv = e.data && e.data.slug;
      if (!sv || sv.indexOf(slug + "#") !== 0) return false;
      const n = parseInt(sv.split("#")[1], 10);
      return n > chunks.length;
    });
    for (const row of stale) {
      const d = await req("DELETE", "/wix-data/v2/items/" + encodeURIComponent(row.id) + "?dataCollectionId=" + encodeURIComponent(COL), null);
      if (d.ok) console.log("removed stale part " + row.data.slug);
      else console.error("remove " + row.data.slug + " failed " + d.status);
    }
  }
  if (failed) process.exit(1);
})();
