// scripts/fixSpellSchool.js
// One-off data fix (Nate, 2026-10-15): until forge #852 (2026-10-14) the SigilForge had the
// Artifact and Tome schools swapped, so a Spell forged on a Ring, Amulet or Orb was saved as
// Creation, and one forged on Cards, a Scroll or a Grimoire as Spirit. Canon (CANON.md, Spell
// skills): Foci cast on Weaving, Artifact on Spirit, Tome on Creation.
//
// The rule reads the focus, never the date and never the school alone. A SigilForge row in
// Creations is fixed only when its focus is an Artifact or a Tome and its school is the other
// of Spirit and Creation, the one pair the old table could write. Every other row is left
// alone, and a disagreement the old table could not have made is reported, never changed.
//   new rows:      payload.meta.focus and payload.meta.school
//   migrated rows: payload.focus and payload.weaponOrSchool (payload.migrated is true)
// LoreForgeAbilities, the old Wix backup, is read by nothing and is left as it is (Nate).
//
// Every row it changes is written to backups/ first (the workflow keeps that as an artifact).
// Safe to repeat: a second run finds nothing.
//
// Needs CLOUDFLARE_API_TOKEN (with D1 edit) and CLOUDFLARE_ACCOUNT_ID, as scripts/applyD1.js does.
// `run(q)` takes any q(sql, params) -> rows.
const fs = require("fs");
const path = require("path");

const DB_NAME = "lorefell";
const SCHOOL_BY_FOCUS = {
  Wand: "Weaving", Rod: "Weaving", Staff: "Weaving",
  Ring: "Spirit", Amulet: "Spirit", Orb: "Spirit",
  Cards: "Creation", Scroll: "Creation", Grimoire: "Creation"
};
const SWAPPED = { Spirit: "Creation", Creation: "Spirit" };

/* Where a row keeps its focus and school, or null when it is not a Spell with a focus. */
function spellFields(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.meta && typeof payload.meta === "object" && payload.meta.focus) {
    return { focus: payload.meta.focus, school: payload.meta.school, set: (s) => { payload.meta.school = s; } };
  }
  if (payload.migrated && payload.focus) {
    return { focus: payload.focus, school: payload.weaponOrSchool, set: (s) => { payload.weaponOrSchool = s; } };
  }
  return null;
}

/* The school a row should carry, or null when the row is right or is not ours to change. */
function correction(fields) {
  const want = SCHOOL_BY_FOCUS[fields.focus];
  if (!want || fields.school === want) return null;
  if (want === "Weaving" || SWAPPED[want] !== fields.school) return null;
  return want;
}

async function run(q, { backupDir } = {}) {
  const rows = await q(`SELECT _id, data FROM "Creations" WHERE json_extract(data, '$.forgeKey') = 'sigilforge'`);
  const fixes = [], odd = [];
  for (const r of rows) {
    const data = JSON.parse(r.data);
    const asString = typeof data.payload === "string";
    let payload;
    try { payload = asString ? JSON.parse(data.payload) : data.payload; } catch (e) { continue; }
    const fields = spellFields(payload);
    if (!fields) continue;
    const want = correction(fields);
    if (!want) {
      if (SCHOOL_BY_FOCUS[fields.focus] && fields.school !== SCHOOL_BY_FOCUS[fields.focus]) odd.push(`${r._id}: ${fields.focus} on ${JSON.stringify(fields.school)}`);
      continue;
    }
    const was = fields.school;
    fields.set(want);
    data.payload = asString ? JSON.stringify(payload) : payload;
    fixes.push({ row: r, data: JSON.stringify(data), note: `${data.creationName || r._id}: ${fields.focus} ${was} -> ${want}` });
  }
  if (fixes.length && backupDir) fs.writeFileSync(path.join(backupDir, "Creations.json"), JSON.stringify(fixes.map((f) => f.row), null, 1));
  const now = new Date().toISOString();
  for (const f of fixes) {
    JSON.parse(f.data);
    await q(`UPDATE "Creations" SET data = ?, _updatedDate = ? WHERE _id = ?`, [f.data, now, f.row._id]);
    console.log(`updated Creations ${f.row._id}: ${f.note}`);
  }
  console.log(`Spell schools: ${fixes.length} row(s) fixed.`);
  odd.forEach((o) => console.log(`left alone, not the old swap: ${o}`));

  /* Report, read only: every SigilForge Spell by focus and school, so a run that finds nothing shows why. */
  const tally = {};
  for (const r of await q(`SELECT data FROM "Creations" WHERE json_extract(data, '$.forgeKey') = 'sigilforge'`)) {
    let payload;
    try { const d = JSON.parse(r.data); payload = typeof d.payload === "string" ? JSON.parse(d.payload) : d.payload; } catch (e) { continue; }
    const fields = spellFields(payload);
    if (!fields) continue;
    const k = `${fields.focus} on ${fields.school}`;
    tally[k] = (tally[k] || 0) + 1;
  }
  Object.keys(tally).sort().forEach((k) => console.log(`Creations: ${k}: ${tally[k]}`));
  return fixes.length;
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

module.exports = { run, SCHOOL_BY_FOCUS };

if (require.main === module) {
  (async () => {
    const backupDir = path.resolve(__dirname, "..", "backups");
    fs.mkdirSync(backupDir, { recursive: true });
    await run(await cloudflare(), { backupDir });
  })().catch((e) => { console.error(e.message || e); process.exit(1); });
}
