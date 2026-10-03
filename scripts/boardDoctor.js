// scripts/boardDoctor.js: one adventure's board (CAMPAIGN), live and in each fetched backup:
// scene bindings with a map and with tokens, tokens on the table, effects, fog, walls, lights
// and notes keys, and the row's version and time. With RESTORE (the same id) and FROM (a backup
// run), it puts that backup's whole board back (instance, tokens, effects, fog, walls, lights,
// notes, weather, drawings, grid, map, background, music), keeping the live log and the rest.
const fs = require("fs"), path = require("path");
const { req } = require("./lib/wixClient");
const CID = process.env.CAMPAIGN || "";
function board(snapStr) {
  let s = null; try { s = typeof snapStr === "string" ? JSON.parse(snapStr) : snapStr; } catch (e) {}
  if (!s) return "unreadable";
  const b = (s.instance && s.instance.bindings) || {};
  const ids = Object.keys(b), withMap = ids.filter((k) => b[k] && b[k].mapId).length, withTok = ids.filter((k) => b[k] && (b[k].tokens || []).length).length;
  const tokTotal = ids.reduce((a, k) => a + ((b[k] && b[k].tokens) || []).length, 0);
  const n = (o) => Object.keys(o || {}).length;
  const fx = Object.keys(s.effects || {}).reduce((a, k) => a + ((s.effects[k] || []).length || 0), 0);
  return "scenes " + ids.length + " (map " + withMap + ", tokens " + withTok + ", " + tokTotal + " placed) | table tokens " + (s.tokens || []).length + " | effects " + fx + " in " + n(s.effects) + " | fog " + n(s.fog) + " walls " + n(s.walls) + " lights " + n(s.lights) + " notes " + n(s.notes) + " | stages " + ((s.instance && s.instance.stages) || []).length + " | active " + (s.activeSceneId || "-");
}
(async () => {
  const r = await req("POST", "/wix-data/v2/items/query", { dataCollectionId: "CampaignView", query: { filter: { campaignId: CID }, paging: { limit: 1 } } });
  const item = (r.json.dataItems || [])[0];
  const live = item ? (item.data || item) : null;
  console.log("::notice::LIVE " + CID + " v" + (live && live.version) + " @" + (live && (live._updatedDate || "")) + ": " + (live ? board(live.snapshot) : "no row"));
  const base = path.resolve(__dirname, "..", "doctor-backups"), backups = {};
  if (fs.existsSync(base)) for (const run of fs.readdirSync(base)) { const rd = path.join(base, run);
    for (const ts of fs.readdirSync(rd).filter((d) => fs.statSync(path.join(rd, d)).isDirectory())) { const f = path.join(rd, ts, "CampaignView.json"); if (!fs.existsSync(f)) continue;
      const row = (JSON.parse(fs.readFileSync(f, "utf8")).items || []).map((it) => it.data || it).find((x) => String(x.campaignId) === CID);
      backups[run] = { ts, row }; console.log("::notice::BACKUP " + run + " @" + ts + " v" + (row && row.version) + ": " + (row ? board(row.snapshot) : "no row")); } }
  const from = process.env.FROM || "";
  if (process.env.RESTORE === CID && from && backups[from] && backups[from].row && item) {
    const os = JSON.parse(backups[from].row.snapshot), cs = JSON.parse(live.snapshot);
    ["instance","tokens","effects","fog","walls","lights","notes","weather","draw","grid","map","background","backgroundUrl","music","activeSceneId","maps"].forEach((k) => { if (os[k] !== undefined) cs[k] = os[k]; });
    const data = Object.assign({}, item.data, { snapshot: JSON.stringify(cs), version: (item.data.version || 0) + 1 });
    const u = await req("PUT", "/wix-data/v2/items/" + encodeURIComponent(item.id || item.data._id), { dataCollectionId: "CampaignView", dataItem: { id: item.id || item.data._id, data } });
    console.log("::notice::RESTORE " + CID + " from " + from + ": " + (u.ok ? "done" : "failed " + u.status) + " -> " + board(cs));
  }
})().catch((e) => { console.log("::error::" + String(e)); process.exit(1); });
