// scripts/backup.js
// Snapshots your own (native) collections to backups/<timestamp>/, with a manifest.
// Skips Wix system and app collections, sanitizes filenames, and survives a single
// collection failing. The workflow uploads the folder as a downloadable artifact.

const fs = require("fs");
const path = require("path");
const { req } = require("./lib/wixClient");

function safeName(id) { return String(id).replace(/[^A-Za-z0-9_.-]/g, "_"); }

async function listNativeCollections() {
  const r = await req("GET", "/wix-data/v2/collections");
  if (!r.ok) return null;
  const arr = r.json.collections || r.json.dataCollections || r.json.items || [];
  return arr
    .filter(function (c) { return !c.collectionType || c.collectionType === "NATIVE"; })
    .map(function (c) { return c._id || c.id; })
    .filter(Boolean);
}

// Every row, a page at a time: Wix answers at most a hundred rows to a query, so a single
// query backed up only the first hundred of a collection (AdvScenes came back with exactly 100).
async function queryAll(col) {
  let items = [], cursor = null;
  for (let i = 0; i < 200; i++) {
    const body = { dataCollectionId: col, query: cursor ? { cursorPaging: { cursor: cursor, limit: 100 } } : { cursorPaging: { limit: 100 } } };
    const r = await req("POST", "/wix-data/v2/items/query", body);
    if (!r.ok) return items.length ? { ok: true, items: items, partial: true } : { ok: false, status: r.status };
    items = items.concat(r.json.dataItems || r.json.items || []);
    cursor = r.json.pagingMetadata && r.json.pagingMetadata.cursors && r.json.pagingMetadata.cursors.next;
    if (!cursor) break;
  }
  return { ok: true, items: items };
}

(async () => {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const out = path.resolve(__dirname, "..", "backups", ts);
  fs.mkdirSync(out, { recursive: true });

  let cols = await listNativeCollections();
  if (!cols) { cols = ["ForgeConfig", "ForgeComponents", "Creations", "CreationApprovals"]; console.log("collection list unavailable, falling back to named set"); }

  const manifest = [];
  let wrote = 0;
  for (const col of cols) {
    try {
      const r = await queryAll(col);
      if (!r.ok) { console.log("skip (" + r.status + "): " + col); manifest.push({ collection: col, status: r.status }); continue; }
      fs.writeFileSync(path.join(out, safeName(col) + ".json"), JSON.stringify({ collection: col, count: r.items.length, items: r.items }, null, 2));
      manifest.push({ collection: col, count: r.items.length });
      wrote++;
      console.log("backed up " + col + ": " + r.items.length + " items");
    } catch (e) {
      console.log("error on " + col + ": " + String(e));
      manifest.push({ collection: col, error: String(e) });
    }
  }

  fs.writeFileSync(path.join(out, "_manifest.json"), JSON.stringify({ timestamp: ts, collections: manifest, wrote: wrote }, null, 2));
  console.log("backup written to backups/" + ts + " (" + wrote + " collections)");
})().catch(function (e) { console.error("backup crashed: " + String(e)); process.exit(1); });
