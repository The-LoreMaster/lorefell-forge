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
const LINES = [];
function note(msg) { LINES.push(msg); }
function flush() {
  // GitHub keeps only a handful of notices per step, so the report is packed into a few
  const chunks = []; let cur = "";
  LINES.forEach((l) => { if ((cur + " || " + l).length > 900) { chunks.push(cur); cur = l; } else cur = cur ? cur + " || " + l : l; });
  if (cur) chunks.push(cur);
  chunks.slice(0, 9).forEach((c) => console.log("::notice::" + c));
  if (chunks.length > 9) console.log("::notice::(" + (chunks.length - 9) + " more chunks)");
}

(async () => {
  const live = await all("CampaignView");
  const stages = await all("Stages");
  const stageCount = {}; stages.forEach((st) => { const c = String(st.campaignId || ""); stageCount[c] = (stageCount[c] || 0) + 1; });
  const liveBy = {}; live.forEach((row) => { liveBy[row.campaignId] = counts(row.snapshot); });

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
        backups[run] = { ts, items, sItems };
      }
    }
  }

  // only what differs: per adventure, live against each backup (t songs, l playlists, s stages, b scenes bound, r Stages rows)
  const fmt = (c, rows) => c && c.ok ? ("t" + c.tracks + " l" + c.lists + " s" + c.instStages + " b" + c.boundScenes + " r" + rows) : "-";
  Object.keys(liveBy).forEach((cid) => {
    const parts = ["LIVE " + fmt(liveBy[cid], stageCount[cid] || 0)];
    let interesting = (liveBy[cid].tracks || liveBy[cid].instStages);
    Object.keys(backups).forEach((run) => {
      const b = backups[run], row = b.items.find((r) => String(r.campaignId) === String(cid));
      if (!row) return;
      const c = counts(row.snapshot), rows = b.sItems.filter((x) => String(x.campaignId) === String(cid)).length;
      if (c.tracks || c.instStages || rows) interesting = true;
      parts.push(run.slice(-6) + "@" + b.ts.slice(5, 16) + " " + fmt(c, rows));
    });
    if (interesting) note(cid + ": " + parts.join(" | "));
  });
  note("Stages rows live: " + stages.length + " across " + Object.keys(stageCount).length + " adventures");
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
  flush();
})().catch((e) => { console.log("::error::" + String(e)); flush(); process.exit(1); });
