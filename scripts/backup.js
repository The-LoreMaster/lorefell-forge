// scripts/backup.js
// Snapshots every collection in the site to backups/<timestamp>/<collection>.json,
// plus a manifest. Read-only and tolerant of collections that cannot be read. The
// workflow uploads the backups folder as a private Action artifact you can download.

const fs = require("fs");
const path = require("path");
const { req } = require("./lib/wixClient");

async function listCollections() {
  const r = await req("GET", "/wix-data/v2/collections");
  if (!r.ok) return null;
  const arr = r.json.collections || r.json.dataCollections || r.json.items || [];
  return arr.map(function (c) { return c._id || c.id; }).filter(Boolean);
}

async function queryAll(col) {
  const r = await req("POST", "/wix-data/v2/items/query", { dataCollectionId: col, query: { paging: { limit: 1000 } } });
  if (!r.ok) return { ok: false, status: r.status };
  return { ok: true, items: r.json.dataItems || r.json.items || [] };
}

(async () => {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const out = path.resolve(__dirname, "..", "backups", ts);
  fs.mkdirSync(out, { recursive: true });

  let cols = await listCollections();
  if (!cols) { cols = ["ForgeConfig", "ForgeComponents", "Sigils"]; console.log("collection list unavailable, falling back to named set"); }

  const manifest = [];
  for (const col of cols) {
    const r = await queryAll(col);
    if (!r.ok) { console.log("skip (" + r.status + "): " + col); manifest.push({ collection: col, status: r.status }); continue; }
    fs.writeFileSync(path.join(out, col + ".json"), JSON.stringify({ collection: col, count: r.items.length, items: r.items }, null, 2));
    manifest.push({ collection: col, count: r.items.length });
    console.log("backed up " + col + ": " + r.items.length + " items");
  }

  fs.writeFileSync(path.join(out, "_manifest.json"), JSON.stringify({ timestamp: ts, collections: manifest }, null, 2));
  console.log("backup written to backups/" + ts);
})();
