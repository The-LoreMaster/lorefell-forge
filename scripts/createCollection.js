// scripts/createCollection.js
// Creates any collection in /schemas that does not already exist. Existence is checked
// against the full collection list and matched by id, so a collection that already
// exists is adopted, never duplicated. When existence cannot be determined, the script
// skips creation rather than risk a duplicate.

const fs = require("fs");
const path = require("path");
const { req } = require("./lib/wixClient");

const dir = path.resolve(__dirname, "..", "schemas");

function withId(col, key) {
  const c = JSON.parse(JSON.stringify(col));
  const id = c._id || c.id;
  delete c._id; delete c.id;
  c[key] = id;
  return c;
}

async function listExistingIds() {
  const r = await req("GET", "/wix-data/v2/collections");
  if (!r.ok) return null;
  const arr = r.json.collections || r.json.dataCollections || r.json.items || [];
  const ids = new Set();
  arr.forEach(function (c) { const id = c._id || c.id; if (id) ids.add(id); });
  return ids;
}

(async () => {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
  const existing = await listExistingIds();
  if (existing) console.log("existing collections: " + Array.from(existing).join(", "));
  let failed = false;

  for (const f of files) {
    const col = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const id = col._id || col.id;

    let exists;
    if (existing) {
      exists = existing.has(id);
    } else {
      const got = await req("GET", "/wix-data/v2/collections/" + encodeURIComponent(id));
      if (got.ok) exists = true;
      else if (got.status === 404) exists = false;
      else { console.log("existence uncertain for " + id + " (status " + got.status + "), skipping create"); continue; }
    }

    if (exists) { console.log("exists, skip: " + id); continue; }

    const r = await req("POST", "/wix-data/v2/collections", { collection: withId(col, "id") });
    if (r.ok) console.log("created: " + id);
    else { console.error("CREATE FAILED " + id + " " + r.status + ": " + r.text.slice(0, 500)); failed = true; }
  }

  if (failed) process.exit(1);
})();
