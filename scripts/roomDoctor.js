// scripts/roomDoctor.js: why the live room might refuse a ticket. Every adventure whose id
// starts with ROOM_PREFIX (or all, newest first): in Campaigns (owner), in the shared tree
// (Adventures root owner), its AdventureMembers, and how many Fell carry its id. Ids, counts
// and member ids shortened. As GitHub notices.
const { req } = require("./lib/wixClient");
async function q(col, filter, limit) { const r = await req("POST", "/wix-data/v2/items/query", { dataCollectionId: col, query: Object.assign({ paging: { limit: limit || 100 } }, filter ? { filter } : {}) }); return (r.json.dataItems || []).map((it) => Object.assign({}, it.data || it, { _id: it.id || (it.data && it.data._id) })); }
const short = (s) => String(s || "").slice(0, 8);
(async () => {
  const pre = process.env.ROOM_PREFIX || "";
  const camps = pre ? await q("Campaigns", { _id: { $startsWith: pre } }, 20) : await q("Campaigns", null, 50);
  const trees0 = pre ? await q("Adventures", { advId: { $startsWith: pre } }, 20) : [];
  console.log("::notice::Campaigns matching " + pre + ": " + camps.length + "; tree rows matching: " + trees0.length + (trees0[0] ? " (" + trees0.map((t) => t.advId + "/" + (t.kind || t.nodeType || "") + "/" + short(t.ownerMemberId)).slice(0, 4).join(" ") + ")" : ""));
  for (const c of camps.slice(0, 12)) {
    const tree = await q("Adventures", { advId: c._id }, 5);
    const mem = await q("AdventureMembers", { campaignId: c._id }, 50);
    const chars = await q("Characters", { campaignId: c._id }, 50);
    console.log("::notice::" + c._id + " '" + (c.name || c.title || "") + "' owner=" + short(c.ownerMemberId) + " | tree rows=" + tree.length + (tree[0] ? " treeOwner=" + short(tree[0].ownerMemberId) + " keys=" + Object.keys(tree[0]).filter((k) => k[0] !== "_").slice(0, 12).join(",") : "")
      + " | members=" + mem.map((m) => short(m.memberId) + ":" + (m.role || "") + ":" + (m.status || "")).join(" ") + " | Fell=" + chars.map((x) => (x.charName || x.name || "?") + "@" + short(x.ownerMemberId)).join(" "));
  }
  if (!camps.length) console.log("::warning::no Campaigns row starts with " + pre);
  const trees = (await q("Adventures", null, 200)).filter((a) => pre && String(a.advId || "").indexOf(pre) === 0);
  trees.slice(0, 5).forEach((a) => console.log("::notice::tree row advId=" + a.advId + " kind=" + (a.kind || "") + " owner=" + short(a.ownerMemberId)));
})().catch((e) => { console.log("::error::" + String(e)); process.exit(1); });
