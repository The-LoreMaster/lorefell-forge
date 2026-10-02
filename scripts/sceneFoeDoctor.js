// scripts/sceneFoeDoctor.js: every foe stored in a scene's roster (AdvScenes.combatants) that
// has acts or a library link: scene, name, library id, acts and augmentations, against the
// library row it points to. Names and kit only. As GitHub notices.
const { req } = require("./lib/wixClient");
async function all(col, filter) {
  let out = [], cursor = null;
  for (let i = 0; i < 20; i++) {
    const body = { dataCollectionId: col, query: { paging: { limit: 1000 } } };
    if (filter) body.query.filter = filter;
    if (cursor) body.query.cursorPaging = { cursor, limit: 1000 }, delete body.query.paging;
    const r = await req("POST", "/wix-data/v2/items/query", body); if (!r.ok) break;
    out = out.concat((r.json.dataItems || []).map((it) => Object.assign({ _u: it._updatedDate || (it.data && it.data._updatedDate) }, it.data || it)));
    cursor = r.json.pagingMetadata && r.json.pagingMetadata.cursors && r.json.pagingMetadata.cursors.next; if (!cursor) break;
  }
  return out;
}
const L = [];
(async () => {
  const lib = {}; (await all("Assets", { type: "monster" })).forEach((a) => { let ab = []; try { ab = JSON.parse(a.abilities || "[]"); } catch (e) {} lib[a.assetId] = { name: a.name, acts: ab.map((x) => x.name).join("/") }; });
  const scenes = await all("AdvScenes");
  scenes.forEach((r) => {
    let c = []; try { c = typeof r.combatants === "string" ? JSON.parse(r.combatants) : (r.combatants || []); } catch (e) {}
    c.filter((x) => x && (x.kind === "foe" || x.type === "monster" || x.side === "foe" || x.libId)).forEach((x) => {
      const acts = (x.abilities || []).map((a) => a.name).join("/");
      const l = x.libId ? lib[x.libId] : null;
      L.push((r.name || r.sceneId || "").slice(0, 22) + ": " + (x.name || "?") + " lib=" + (x.libId || "-") + (l ? "(" + l.name + ")" : x.libId ? "(MISSING)" : "") + " acts=[" + acts + "]" + (l && l.acts !== acts ? " libActs=[" + l.acts + "]" : "") + " keys=" + Object.keys(x).join(","));
    });
  });
  const chunks = []; let cur = "";
  L.forEach((l) => { if ((cur + " || " + l).length > 950) { chunks.push(cur); cur = l; } else cur = cur ? cur + " || " + l : l; });
  if (cur) chunks.push(cur); chunks.slice(0, 12).forEach((x) => console.log("::notice::" + x));
  if (!L.length) console.log("::notice::no foes stored in any scene roster (" + scenes.length + " scenes)");
})().catch((e) => { console.log("::error::" + String(e)); process.exit(1); });
