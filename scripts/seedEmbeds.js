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

  for (const file of files) {
    const slug = file.replace(/\.html$/, "");
    const html = fs.readFileSync(path.join(dir, file), "utf8");
    const data = { slug: slug, html: html };
    if (TITLES[slug]) data.title = TITLES[slug];
    const hit = existing.find(e => e.data && e.data.slug === slug);

    if (hit && hit.id) {
      const merged = Object.assign({}, hit.data, data);
      const u = await req("PUT", "/wix-data/v2/items/" + encodeURIComponent(hit.id), { dataCollectionId: COL, dataItem: { id: hit.id, data: merged } });
      if (!u.ok) { console.error("update " + slug + " failed " + u.status + ": " + u.text.slice(0, 300)); failed = true; }
      else console.log("updated embed " + slug + " (" + html.length + " bytes)");
    } else {
      const i = await req("POST", "/wix-data/v2/items", { dataCollectionId: COL, dataItem: { data: data } });
      if (!i.ok) { console.error("insert " + slug + " failed " + i.status + ": " + i.text.slice(0, 300)); failed = true; }
      else console.log("inserted embed " + slug + " (" + html.length + " bytes)");
    }
  }
  if (failed) process.exit(1);
})();
