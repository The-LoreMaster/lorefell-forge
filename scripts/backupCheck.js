// scripts/backupCheck.js: proves a fresh backup can be used. Reads the newest folder in
// backups/ (made by scripts/backup.js in the same run) and checks that every adventure's board
// (CampaignView) and story root (Adventures) parses, that Characters and Assets rows are
// there, and reports per adventure what its board holds. Fails the run (so GitHub emails) if a
// board will not parse or a collection the table needs is missing.
const fs = require("fs"), path = require("path");
const base = path.resolve(__dirname, "..", "backups");
const dirs = fs.existsSync(base) ? fs.readdirSync(base).filter((d) => fs.statSync(path.join(base, d)).isDirectory()).sort() : [];
if (!dirs.length) { console.log("::error::no backup was written"); process.exit(1); }
const dir = path.join(base, dirs[dirs.length - 1]);
const read = (c) => { const f = path.join(dir, c + ".json"); if (!fs.existsSync(f)) return null; try { return (JSON.parse(fs.readFileSync(f, "utf8")).items || []).map((it) => it.data || it); } catch (e) { return "bad"; } };
let bad = 0;
["CampaignView", "Adventures", "AdvScenes", "Characters", "Assets", "Campaigns"].forEach((c) => {
  const rows = read(c);
  if (rows === null) { console.log("::error::backup has no " + c); bad++; }
  else if (rows === "bad") { console.log("::error::backup's " + c + " will not parse"); bad++; }
  else console.log("::notice::" + c + ": " + rows.length + " rows");
});
(read("CampaignView") || []).forEach((r) => {
  if (!r || typeof r !== "object") return;
  try { const s = JSON.parse(r.snapshot || "{}"); const b = (s.instance && s.instance.bindings) || {};
    let placed = 0, maps = 0; Object.keys(b).forEach((k) => { placed += ((b[k] && b[k].tokens) || []).length; if (b[k] && b[k].mapId) maps++; });
    console.log("::notice::board " + r.campaignId + " v" + r.version + ": " + Object.keys(b).length + " scenes, " + maps + " maps, " + placed + " tokens placed");
  } catch (e) { console.log("::error::board " + r.campaignId + " will not parse"); bad++; }
});
if (bad) process.exit(1);
console.log("::notice::backup " + dirs[dirs.length - 1] + " checks out");
