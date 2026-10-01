// scripts/rosterDoctor.js
// For each adventure: the roster (combatants) FateWell holds in its Campaigns blob against
// what the shared tree (AdvScenes) holds, scene by scene. Counts and names of scenes only,
// as GitHub notices.
const zlib = require("zlib");
const { req } = require("./lib/wixClient");
async function all(col, filter) {
  let out = [], cursor = null;
  for (let i = 0; i < 20; i++) {
    const body = { dataCollectionId: col, query: { paging: { limit: 1000 } } };
    if (filter) body.query.filter = filter;
    if (cursor) body.query.cursorPaging = { cursor, limit: 1000 }, delete body.query.paging;
    const r = await req("POST", "/wix-data/v2/items/query", body);
    if (!r.ok) break;
    out = out.concat((r.json.dataItems || []).map((it) => it.data || it));
    cursor = r.json.pagingMetadata && r.json.pagingMetadata.cursors && r.json.pagingMetadata.cursors.next;
    if (!cursor) break;
  }
  return out;
}
function unpack(d) { let x = d; try { x = typeof d === "string" ? JSON.parse(d) : d; } catch (e) { return {}; }
  if (x && typeof x.campaignGz === "string") { try { return JSON.parse(zlib.gunzipSync(Buffer.from(x.campaignGz, "base64")).toString("utf8")); } catch (e) { return {}; } }
  return x || {}; }
const LINES = []; const note = (m) => LINES.push(m);
(async () => {
  const camps = await all("Campaigns");
  const scenes = await all("AdvScenes");
  const treeBy = {}; scenes.forEach((r) => { let c = []; try { c = typeof r.combatants === "string" ? JSON.parse(r.combatants) : (r.combatants || []); } catch (e) {} treeBy[r.sceneId] = { n: c.length, adv: r.advId, at: r._updatedDate || r.updatedAt || "" }; });
  camps.forEach((cp) => {
    const data = unpack(cp.data);
    const diffs = []; let total = 0, blobN = 0, treeN = 0;
    (data.acts || []).forEach((a) => (a.sessions || []).forEach((se) => (se.scenes || []).forEach((sc) => {
      total++;
      const b = (sc.combatants || []).length, t = treeBy[sc.id] ? treeBy[sc.id].n : -1;
      blobN += b; treeN += Math.max(0, t);
      if (b !== t) diffs.push((sc.name || sc.id).slice(0, 24) + " fw" + b + "/ts" + (t < 0 ? "none" : t));
    })));
    if (total) note((cp.name || cp._id).slice(0, 28) + " [" + cp._id + "] scenes " + total + " roster fw" + blobN + " ts" + treeN + (diffs.length ? " DIFF: " + diffs.slice(0, 8).join("; ") + (diffs.length > 8 ? " +" + (diffs.length - 8) : "") : " same"));
  });
  const chunks = []; let cur = "";
  LINES.forEach((l) => { if ((cur + " || " + l).length > 950) { chunks.push(cur); cur = l; } else cur = cur ? cur + " || " + l : l; });
  if (cur) chunks.push(cur);
  chunks.slice(0, 9).forEach((c) => console.log("::notice::" + c));
})().catch((e) => { console.log("::error::" + String(e)); process.exit(1); });
