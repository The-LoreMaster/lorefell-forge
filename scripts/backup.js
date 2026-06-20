// scripts/backup.js
// Snapshots each collection to backups/<timestamp>/<collection>.json. Tolerant of
// collections that do not exist yet, so it is safe to run before the first create.
// The workflow uploads the backups folder as a private Action artifact; it is never
// committed to the public repo.

const fs = require("fs");
const path = require("path");
const { req } = require("./lib/wixClient");

const collections = ["ForgeConfig", "ForgeComponents", "Sigils"];

(async () => {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const out = path.resolve(__dirname, "..", "backups", ts);
  fs.mkdirSync(out, { recursive: true });

  for (const col of collections) {
    const q = await req("POST", "/wix-data/v2/items/query", { dataCollectionId: col, query: { paging: { limit: 1000 } } });
    if (!q.ok) {
      console.log("skip backup (" + q.status + "): " + col);
      fs.writeFileSync(path.join(out, col + ".json"), JSON.stringify({ collection: col, status: q.status, note: "unavailable or not created yet" }, null, 2));
      continue;
    }
    const items = q.json.dataItems || q.json.items || [];
    fs.writeFileSync(path.join(out, col + ".json"), JSON.stringify({ collection: col, count: items.length, items: items }, null, 2));
    console.log("backed up " + col + ": " + items.length + " items");
  }

  console.log("backup written to backups/" + ts);
})();
