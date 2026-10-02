// scripts/assetDoctor.js: the library foes as they are stored in Assets (type monster), with
// what each holds: build, stance, signature affliction, infusions, augmentations, acts and
// attributes, and when the row last changed. Names and kit only. As GitHub notices.
const { req } = require("./lib/wixClient");
(async () => {
  const r = await req("POST", "/wix-data/v2/items/query", { dataCollectionId: "Assets", query: { filter: { type: "monster" }, sort: [{ fieldName: "_updatedDate", order: "DESC" }], paging: { limit: 40 } } });
  const items = r.json.dataItems || [];
  if (!items.length) { console.log("::warning::no monster rows; status " + r.status + " " + JSON.stringify(r.json).slice(0, 300)); return; }
  items.forEach((it) => {
    const d = it.data || it; let fm = {}; try { fm = JSON.parse(d.foeMeta || "{}"); } catch (e) {}
    let ab = []; try { ab = JSON.parse(d.abilities || "[]"); } catch (e) {}
    let at = {}; try { at = JSON.parse(d.attrs || "{}"); } catch (e) {}
    const atS = Object.keys(at).filter((k) => at[k]).map((k) => k + at[k]).join(",");
    console.log("::notice::" + (d.name || "?") + " [" + (d.assetId || "") + "] updated " + (d._updatedDate || "") + " | sr=" + (d.shatterRating || "") + " build=" + (fm.build || "-") + " stance=" + (fm.stance || "-") + " sig=" + (fm.sig || "-")
      + " | inf=" + (fm.infusions || []).join("/") + " aug=" + (fm.augments || []).join("/") + " | acts=" + ab.map((a) => (a.tier || "?") + ":" + (a.name || "")).join("/") + " | attrs=" + atS + " hand=" + !!fm.attrsHand + " | keys=" + Object.keys(d).filter((k) => k[0] !== "_").join(","));
  });
})().catch((e) => { console.log("::error::" + String(e)); process.exit(1); });
