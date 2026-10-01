// scripts/bindDoctor.js: for one adventure (CAMPAIGN), each scene's saved layout as the table
// stores it: map, token count and names, effects on its scene|map key, and what the board
// itself holds. Names of tokens only; no other content. As GitHub notices.
const { req } = require("./lib/wixClient");
(async () => {
  const cid = process.env.CAMPAIGN || "";
  const r = await req("POST", "/wix-data/v2/items/query", { dataCollectionId: "CampaignView", query: { filter: { campaignId: cid }, paging: { limit: 1 } } });
  const row = ((r.json.dataItems || [])[0] || {}).data; if (!row) { console.log("::error::no row for " + cid); return; }
  const s = JSON.parse(row.snapshot || "{}");
  const sc = await req("POST", "/wix-data/v2/items/query", { dataCollectionId: "AdvScenes", query: { filter: { advId: cid }, paging: { limit: 200 } } });
  const names = {}; (sc.json.dataItems || []).forEach((it) => { const d = it.data || it; names[d.sceneId] = (d.name || "").slice(0, 28); });
  const L = [];
  L.push("v" + row.version + " board: activeScene=" + (names[s.activeSceneId] || s.activeSceneId) + " bg=" + s.background + " tokens=" + (s.tokens || []).length);
  const b = (s.instance && s.instance.bindings) || {};
  Object.keys(b).forEach((k) => { const v = b[k] || {};
    const fxKeys = Object.keys(s.effects || {}).filter((x) => x.indexOf(k + "|") === 0).map((x) => x.split("|")[1] + ":" + (s.effects[x] || []).length);
    L.push((names[k] || k) + " map=" + (v.mapId || "-") + " stage=" + (v.activeStageId || "-") + " tokens=" + (v.tokens || []).length + " [" + (v.tokens || []).slice(0, 4).map((t) => t.name).join(",") + "] fx=" + (fxKeys.join(" ") || "0"));
  });
  const legacy = Object.keys(s.effects || {}).filter((x) => x.indexOf("|") < 0); if (legacy.length) L.push("effects still per map: " + legacy.join(","));
  const chunks = []; let cur = "";
  L.forEach((l) => { if ((cur + " || " + l).length > 950) { chunks.push(cur); cur = l; } else cur = cur ? cur + " || " + l : l; });
  if (cur) chunks.push(cur); chunks.slice(0, 9).forEach((c) => console.log("::notice::" + c));
})().catch((e) => { console.log("::error::" + String(e)); process.exit(1); });
