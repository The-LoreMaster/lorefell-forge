// scripts/fixStudioName.js
// One-off data fix (Nate, 2026-10-12): the studio is Skyvault Studio, no s. The canon lorebounds
// were seeded into Creations crediting "Skyvault Studios", in creatorName and in the payload's
// creator. This finds "Skyvault Studios" in every table's data in D1 and writes "Skyvault Studio".
// Every row it changes is written to backups/ first (the workflow keeps that as an artifact).
// Safe to repeat: a second run finds nothing.
//
// Needs CLOUDFLARE_API_TOKEN (with D1 edit) and CLOUDFLARE_ACCOUNT_ID, as scripts/applyD1.js does.
// `run(q)` takes any q(sql, params) -> rows.
const fs = require("fs");
const path = require("path");

const DB_NAME = "lorefell";
const FROM = "Skyvault Studios", TO = "Skyvault Studio";

async function run(q, { backupDir } = {}) {
  const tables = (await q(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'`)).map((r) => r.name);
  let changed = 0;
  for (const t of tables) {
    if (!/^[A-Za-z0-9_]+$/.test(t)) continue;
    const cols = (await q(`PRAGMA table_info("${t}")`)).map((c) => c.name);
    if (!cols.includes("data") || !cols.includes("_id")) continue;
    const rows = await q(`SELECT _id, data FROM "${t}" WHERE data LIKE ?`, ["%" + FROM + "%"]);
    if (!rows.length) continue;
    if (backupDir) fs.writeFileSync(path.join(backupDir, t + ".json"), JSON.stringify(rows, null, 1));
    const now = new Date().toISOString();
    for (const r of rows) {
      const data = r.data.split(FROM).join(TO);
      JSON.parse(data);
      await q(`UPDATE "${t}" SET data = ?, _updatedDate = ? WHERE _id = ?`, [data, now, r._id]);
      changed++;
      console.log(`updated ${t}: ${r._id}`);
    }
  }
  console.log(`Studio name: ${changed} row(s) now say ${TO}.`);
  return changed;
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
