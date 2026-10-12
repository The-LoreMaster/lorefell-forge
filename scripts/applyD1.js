// scripts/applyD1.js
// Seeds the canon collections from /schemas/seed into D1, the database the tools read since the
// data switch (2026-10-11). It does what upsertItems.js did for the Wix CMS, the same way: each
// row is matched on the seed's natural key, so a run changes only what changed and is safe to
// repeat. Fields listed in jsonFields are stored as JSON text, as they were on Wix, because the
// Velo code parses them.
//
// A table is the shape lorefell-site's api/schema.sql gives every collection: the Wix system
// fields as columns and the rest as JSON in `data`. Before writing, every table it touches is
// written to backups/ (the workflow keeps that as an artifact).
//
// Needs CLOUDFLARE_API_TOKEN (with D1 edit) and CLOUDFLARE_ACCOUNT_ID. `run(q)` takes any
// q(sql, params) -> rows, so the tests drive it against a local SQLite.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SEED = path.resolve(__dirname, "..", "schemas", "seed");
const DB_NAME = "lorefell";

const keyOf = (obj, keyField) => (Array.isArray(keyField) ? keyField : [keyField]).map((k) => String(obj[k])).join("\u0001");
function prep(item, jsonFields) {
  const out = Object.assign({}, item);
  (jsonFields || []).forEach((k) => { if (out[k] !== undefined && typeof out[k] !== "string") out[k] = JSON.stringify(out[k]); });
  return out;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function run(q, { backupDir } = {}) {
  const files = fs.readdirSync(SEED).filter((f) => f.endsWith(".json")).sort();
  const counts = { inserted: 0, updated: 0, unchanged: 0 };
  for (const f of files) {
    const spec = JSON.parse(fs.readFileSync(path.join(SEED, f), "utf8"));
    const col = spec.collection, keyField = spec.keyField, items = spec.items || [];
    if (!/^[A-Za-z0-9]+$/.test(col || "")) throw new Error(f + ": bad collection name " + col);
    await q(`CREATE TABLE IF NOT EXISTS "${col}" (_id TEXT PRIMARY KEY, _owner TEXT, _createdDate TEXT, _updatedDate TEXT, data TEXT NOT NULL DEFAULT '{}')`);
    const rows = (await q(`SELECT _id, data FROM "${col}"`)).map((r) => ({ id: r._id, data: JSON.parse(r.data || "{}") }));
    if (backupDir) fs.writeFileSync(path.join(backupDir, col + ".json"), JSON.stringify(rows, null, 1));
    const now = new Date().toISOString();
    for (const raw of items) {
      const data = prep(raw, spec.jsonFields);
      const label = col + ": " + keyOf(raw, keyField).replace(/\u0001/g, "/");
      const hit = rows.find((r) => keyOf(r.data, keyField) === keyOf(raw, keyField));
      if (hit) {
        const merged = Object.assign({}, hit.data, data);
        if (same(merged, hit.data)) { counts.unchanged++; continue; }
        await q(`UPDATE "${col}" SET data = ?, _updatedDate = ? WHERE _id = ?`, [JSON.stringify(merged), now, hit.id]);
        hit.data = merged;
        counts.updated++; console.log("updated " + label);
      } else {
        const id = crypto.randomUUID();
        await q(`INSERT INTO "${col}" (_id, _owner, _createdDate, _updatedDate, data) VALUES (?, NULL, ?, ?, ?)`, [id, now, now, JSON.stringify(data)]);
        rows.push({ id, data });
        counts.inserted++; console.log("inserted " + label);
      }
    }
  }
  console.log(`D1 seed: ${counts.inserted} inserted, ${counts.updated} updated, ${counts.unchanged} unchanged.`);
  return counts;
}

async function cloudflare() {
  const token = process.env.CLOUDFLARE_API_TOKEN, account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account) throw new Error("Set the CLOUDFLARE_API_TOKEN (with D1 edit) and CLOUDFLARE_ACCOUNT_ID repository secrets.");
  const base = `https://api.cloudflare.com/client/v4/accounts/${account}`;
  const call = async (method, p, body) => {
    for (let attempt = 1; ; attempt++) {
      const r = await fetch(base + p, { method, headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const j = await r.json().catch(() => ({}));
      if ((r.status === 429 || r.status >= 500) && attempt < 6) { await new Promise((ok) => setTimeout(ok, 2000 * attempt)); continue; }
      if (!r.ok || j.success === false) throw new Error(`D1 ${p}: ${r.status} ${JSON.stringify(j.errors || j).slice(0, 300)}`);
      return j.result;
    }
  };
  const db = (await call("GET", "/d1/database?name=" + DB_NAME) || []).find((d) => d.name === DB_NAME);
  if (!db) throw new Error("No D1 database named " + DB_NAME + " (or the token cannot read D1).");
  return async (sql, params = []) => ((await call("POST", `/d1/database/${db.uuid}/query`, { sql, params }))[0] || {}).results || [];
}

module.exports = { run };

if (require.main === module) {
  (async () => {
    const backupDir = path.resolve(__dirname, "..", "backups");
    fs.mkdirSync(backupDir, { recursive: true });
    await run(await cloudflare(), { backupDir });
  })().catch((e) => { console.error(e.message || e); process.exit(1); });
}
