// scripts/stateDoctor.js
// Reads the live CampaignView and Stages, and any backups downloaded beside it (in
// doctor-backups/<run>/<timestamp>/), and reports, per adventure, how many songs, playlists,
// stages and scene stage bindings each copy holds, as GitHub annotations (no private text,
// only counts and ids). With RESTORE=<campaignId> and FROM=<run id>, it puts that backup's
// music and stage bindings back into the live row, leaving everything else as it is now.
const fs = require("fs");
const path = require("path");
const { req } = require("./lib/wixClient");

async function all(col) {
  const r = await req("POST", "/wix-data/v2/items/query", { dataCollectionId: col, query: { paging: { limit: 1000 } } });
  if (!r.ok) return [];
  return (r.json.dataItems || r.json.items || []).map((it) => it.data || it);
}
function counts(snapStr) {
  let s = null; try { s = typeof snapStr === "string" ? JSON.parse(snapStr) : snapStr; } catch (e) { s = null; }
  if (!s) return { ok: false };
  const m = s.music || {}, inst = s.instance || {};
  const bind = inst.bindings || {};
  const bound = Object.keys(bind).filter((k) => bind[k] && (bind[k].stageIds || []).length).length;
  return { ok: true, tracks: (m.tracks || []).length, lists: (m.lists || []).length, scenesWithMusic: Object.keys(m.scenes || {}).length,
    instStages: (inst.stages || []).length, boundScenes: bound, weather: Object.keys(s.weather || {}).length, notes: Object.keys(s.notes || {}).length, keys: Object.keys(s).sort().join(",") };
}
function note(msg) { console.log("::notice::" + msg); }

(async () => {
  const live = await all("CampaignView");
  const stages = await all("Stages");
  const stageCount = {}; stages.forEach((st) => { const c = String(st.campaignId || ""); stageCount[c] = (stageCount[c] || 0) + 1; });
  note("LIVE CampaignView rows: " + live.length + "; Stages rows: " + stages.length);
  live.forEach((row) => { const c = counts(row.snapshot); note("LIVE " + row.campaignId + " v" + row.version + " " + JSON.stringify(c) + " stagesRows=" + (stageCount[row.campaignId] || 0)); });

  const base = path.resolve(__dirname, "..", "doctor-backups");
  const backups = {};
  if (fs.existsSync(base)) {
    for (const run of fs.readdirSync(base)) {
      const runDir = path.join(base, run);
      const stamps = fs.readdirSync(runDir).filter((d) => fs.statSync(path.join(runDir, d)).isDirectory());
      for (const ts of stamps) {
        const f = path.join(runDir, ts, "CampaignView.json");
        if (!fs.existsSync(f)) { note("BACKUP " + run + " " + ts + ": no CampaignView"); continue; }
        const items = (JSON.parse(fs.readFileSync(f, "utf8")).items || []).map((it) => it.data || it);
        const sf = path.join(runDir, ts, "Stages.json");
        const sItems = fs.existsSync(sf) ? (JSON.parse(fs.readFileSync(sf, "utf8")).items || []).map((it) => it.data || it) : [];
        backups[run] = { ts, items };
        items.forEach((row) => { const c = counts(row.snapshot); note("BACKUP " + run + " " + ts + " " + row.campaignId + " v" + row.version + " " + JSON.stringify(c) + " stagesRows=" + sItems.filter((x) => String(x.campaignId) === String(row.campaignId)).length); });
      }
    }
  }

  const target = process.env.RESTORE || "", from = process.env.FROM || "";
  if (target && from) {
    const b = backups[from]; if (!b) { note("RESTORE: no backup " + from); return; }
    const old = b.items.find((r) => String(r.campaignId) === String(target));
    const cur = live.find((r) => String(r.campaignId) === String(target));
    if (!old || !cur) { note("RESTORE: row missing in " + (old ? "live" : "backup")); return; }
    const os = JSON.parse(old.snapshot), cs = JSON.parse(cur.snapshot);
    const keep = ["music", "instance", "weather", "notes", "loreGrants"];
    keep.forEach((k) => { if (os[k] !== undefined) cs[k] = os[k]; });
    const r = await req("POST", "/wix-data/v2/items/query", { dataCollectionId: "CampaignView", query: { filter: { campaignId: String(target) }, paging: { limit: 1 } } });
    const item = (r.json.dataItems || [])[0];
    if (!item) { note("RESTORE: live item not found"); return; }
    const data = Object.assign({}, item.data, { snapshot: JSON.stringify(cs), version: (item.data.version || 0) + 1 });
    const u = await req("PUT", "/wix-data/v2/items/" + encodeURIComponent(item.id || item._id || item.data._id), { dataCollectionId: "CampaignView", dataItem: { id: item.id || item.data._id, data } });
    note("RESTORE " + target + " from " + from + ": " + (u.ok ? "done" : "failed " + u.status) + " " + JSON.stringify(counts(cs)));
  }
})().catch((e) => { console.log("::error::" + String(e)); process.exit(1); });
