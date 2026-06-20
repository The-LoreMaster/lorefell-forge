// scripts/createCollection.js
// Creates any collection in /schemas that does not already exist. Never updates an
// existing collection here, because collection updates are destructive replaces and
// are handled deliberately, not on every push.

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

(async () => {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
  let failed = false;

  for (const f of files) {
    const col = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const id = col._id || col.id;

    const got = await req("GET", "/wix-data/v2/collections/" + encodeURIComponent(id));
    if (got.ok) { console.log("exists, skip: " + id); continue; }
    if (got.status !== 404) {
      console.log("existence check for " + id + " returned " + got.status + ", attempting create");
    }

    // Preview API: id key casing has varied. Try _id, then id.
    let r = await req("POST", "/wix-data/v2/collections", { collection: withId(col, "_id") });
    if (!r.ok) {
      console.log("create(_id) failed " + r.status + ": " + r.text.slice(0, 300));
      r = await req("POST", "/wix-data/v2/collections", { collection: withId(col, "id") });
    }

    if (r.ok) { console.log("created: " + id); }
    else { console.error("CREATE FAILED " + id + " " + r.status + ": " + r.text.slice(0, 500)); failed = true; }
  }

  if (failed) process.exit(1);
})();
