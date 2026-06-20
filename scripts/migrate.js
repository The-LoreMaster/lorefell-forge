// scripts/migrate.js
// One-time, idempotent migration of the legacy LoreForgeAbilities collection into the
// unified Creations collection. Reads every legacy row, maps it onto the Creations
// envelope, and skips any row already migrated (matched on sourceId). Nothing is
// deleted from LoreForgeAbilities, so it remains a backup until you are satisfied.
//
// Safe to rerun. Non-fatal if LoreForgeAbilities does not exist or is empty.
// Runs in the Apply workflow after the collections exist and are seeded.

const { req } = require("./lib/wixClient");

const SOURCE = "LoreForgeAbilities";
const TARGET = "Creations";
const PAGE = 100;

function safeParse(s) {
  if (s && typeof s === "object") return s;
  try { return JSON.parse(s || ""); } catch (e) { return s || null; }
}

function mapRow(o) {
  const type = o.type || "";
  const kind = /monster|foe/i.test(type) ? "foe" : "character";
  const payload = {
    tier: o.tier,
    grammar: type,
    weaponOrSchool: o.weaponOrSchool,
    focus: o.focus,
    primaryDamage: o.primaryDamage,
    targeting: o.targeting,
    spread: o.spread,
    amplify: o.amplify,
    components: safeParse(o.components),
    runeSvg: o.runeSvg,
    flavorText: o.flavorText,
    weaponFacts: o.weaponFacts,
    budgetBreakdown: o.budgetBreakdown,
    migrated: true
  };
  return {
    forgeKey: "sigilforge",
    definitionVersion: 1,
    kind: kind,
    creationName: o.title || "Migrated ability",
    creatorMemberId: o.createdById || null,
    creatorName: o.createdBy || "A Fell",
    ownerMemberId: o.createdById || null,
    worldId: null,
    payload: JSON.stringify(payload),
    shorthand: o.shorthand || "",
    fullText: o.fullExplanation || "",
    legality: JSON.stringify({ tier: o.tier, cost: o.cost, valid: true, migrated: true }),
    creatorNote: "",
    fingerprint: "migrated:" + o._id,
    basedOn: null,
    imageUrl: o.runeImage || null,
    canonStatus: o.loreForgeApproved ? "canon" : "submitted",
    voteCount: 0,
    sourceId: o._id
  };
}

async function alreadyMigrated(sourceId) {
  const r = await req("POST", "/wix-data/v2/items/query", {
    dataCollectionId: TARGET,
    query: { filter: { sourceId: sourceId }, paging: { limit: 1 } }
  });
  if (!r.ok) return false;
  return (r.json.dataItems || r.json.items || []).length > 0;
}

(async () => {
  let offset = 0, total = 0, inserted = 0, skipped = 0, failed = 0;

  while (true) {
    const q = await req("POST", "/wix-data/v2/items/query", {
      dataCollectionId: SOURCE,
      query: { paging: { limit: PAGE, offset: offset } }
    });
    if (!q.ok) {
      console.log("Source collection " + SOURCE + " unavailable (status " + q.status + "). Nothing to migrate.");
      process.exit(0);
    }
    const rows = (q.json.dataItems || q.json.items || []).map(function (it) {
      return it.data ? Object.assign({ _id: it.id || (it.data && it.data._id) }, it.data) : it;
    });
    if (!rows.length) break;

    for (const row of rows) {
      total++;
      if (!row._id) { console.log("skip row with no id"); skipped++; continue; }
      if (await alreadyMigrated(row._id)) { skipped++; continue; }
      const ins = await req("POST", "/wix-data/v2/items", { dataCollectionId: TARGET, dataItem: { data: mapRow(row) } });
      if (ins.ok) { inserted++; console.log("migrated: " + (row.title || row._id)); }
      else { failed++; console.error("MIGRATE FAILED " + (row.title || row._id) + " " + ins.status + ": " + ins.text.slice(0, 200)); }
    }

    if (rows.length < PAGE) break;
    offset += PAGE;
  }

  console.log("Migration done. seen " + total + ", inserted " + inserted + ", skipped " + skipped + ", failed " + failed + ".");
  if (failed) process.exit(1);
})();
