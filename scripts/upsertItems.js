// scripts/upsertItems.js
// Seeds each collection from /schemas/seed. Matches existing rows on a natural key
// field so it is safe to run repeatedly. Fields listed in jsonFields are stringified
// before storing, because Wix has no JSON field type and they live in TEXT fields.

const fs = require("fs");
const path = require("path");
const { req } = require("./lib/wixClient");

const dir = path.resolve(__dirname, "..", "schemas", "seed");

function normalize(it) {
  if (it && it.data) return { id: it.id || it.data._id, data: it.data };
  return { id: it._id || it.id, data: it };
}

function prep(item, jsonFields) {
  const out = Object.assign({}, item);
  (jsonFields || []).forEach(function (k) {
    if (out[k] !== undefined && typeof out[k] !== "string") out[k] = JSON.stringify(out[k]);
  });
  return out;
}

(async () => {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
  let failed = false;

  for (const f of files) {
    const spec = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const col = spec.collection, keyField = spec.keyField, jsonFields = spec.jsonFields || [];
    const items = spec.items || [];

    const q = await req("POST", "/wix-data/v2/items/query", { dataCollectionId: col, query: { paging: { limit: 1000 } } });
    if (!q.ok) { console.error("query failed for " + col + " " + q.status + ": " + q.text.slice(0, 300)); failed = true; continue; }
    const existing = (q.json.dataItems || q.json.items || []).map(normalize);

    for (const raw of items) {
      const data = prep(raw, jsonFields);
      const keyVal = raw[keyField];
      const hit = existing.find(e => e.data && e.data[keyField] === keyVal);

      if (hit && hit.id) {
        const merged = Object.assign({}, hit.data, data);
        const u = await req("PUT", "/wix-data/v2/items/" + encodeURIComponent(hit.id), { dataCollectionId: col, dataItem: { id: hit.id, data: merged } });
        if (u.ok) console.log("updated " + col + ": " + keyVal);
        else { console.error("UPDATE FAILED " + col + " " + keyVal + " " + u.status + ": " + u.text.slice(0, 200)); failed = true; }
      } else {
        const ins = await req("POST", "/wix-data/v2/items", { dataCollectionId: col, dataItem: { data: data } });
        if (ins.ok) console.log("inserted " + col + ": " + keyVal);
        else { console.error("INSERT FAILED " + col + " " + keyVal + " " + ins.status + ": " + ins.text.slice(0, 200)); failed = true; }
      }
    }
  }

  if (failed) process.exit(1);
})();
