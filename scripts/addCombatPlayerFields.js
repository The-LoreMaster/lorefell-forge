// scripts/addCombatPlayerFields.js
// Adds the placed-utilities fields to the CombatPlayer collection: places, placed,
// placedAck (all TEXT). createCollection.js is create-only - it adopts an existing
// collection and never touches its fields - so a collection that already exists can gain
// a field no other way. This is that way.
//
// Why it reads the LIVE collection first rather than pushing schemas/CombatPlayer.json:
// the update endpoint replaces the field list with the one it is handed. Pushing a local
// copy would silently drop any live field the repo schema does not know about. So the
// live field set is the base, and this only ever ADDS - a field already present is left
// exactly as it is, keys and all. Nothing is removed and nothing is rewritten.
//
// Idempotent: run it twice and the second run reports every field already present and
// writes nothing. Safe to leave wired into apply.yml for that reason.
//
// Field parity: if you add a field here, add it to schemas/CombatPlayer.json too, so the
// two do not drift. The gate does not enforce that pairing for this file, so it is on us.

const { req } = require("./lib/wixClient");

const COLLECTION_ID = "CombatPlayer";

// The fields this pass guarantees. Each is TEXT because each holds JSON or a bare id:
//   places      JSON array of {x,y} - the declared squares, F7's payload
//   placed      JSON {pid,util,squares,at} - the marker the LoreMaster resolved
//   placedAck   the pid the sheet last spent, so a decrement fires exactly once
//   feed        JSON {pid,count} - the board's feed request for a Darkshard
//   feedAck     "pid:count" - the feed the sheet honoured, board raises the shard on it
//   skyShards   NUMBER - the placer's Skyvault Shard count, greys the feed control at zero
const WANT = [
  { key: "places",    type: "TEXT",   displayName: "Places" },
  { key: "placed",    type: "TEXT",   displayName: "Placed" },
  { key: "placedAck", type: "TEXT",   displayName: "Placed Ack" },
  { key: "feed",      type: "TEXT",   displayName: "Feed" },
  { key: "feedAck",   type: "TEXT",   displayName: "Feed Ack" },
  { key: "skyShards", type: "NUMBER", displayName: "Sky Shards" }
];

// The update endpoint wants the collection wrapped and keyed on `id`, the same shape
// createCollection.js writes. A GET returns it keyed on `_id` (or `id`), so normalise.
function fieldKey(f) { return f && (f.key || f.id || f.fieldKey); }

(async () => {
  // 1. Read the collection as it stands live. This is the base we add onto.
  const got = await req("GET", "/wix-data/v2/collections/" + encodeURIComponent(COLLECTION_ID));
  if (!got.ok) {
    console.error("could not read " + COLLECTION_ID + " (status " + got.status + "): " + got.text.slice(0, 400));
    console.error("if this is 404 the collection does not exist yet - run createCollection.js first");
    process.exit(1);
  }

  // Wix has returned the collection under a few shapes across versions; accept them all.
  const col = got.json.collection || got.json.dataCollection || got.json;
  const fields = Array.isArray(col.fields) ? col.fields.slice() : [];
  const have = new Set(fields.map(fieldKey).filter(Boolean));

  console.log("CombatPlayer has " + have.size + " fields live.");

  // 2. Add only what is missing. A present field is left untouched, keys and all.
  const added = [];
  WANT.forEach(function (w) {
    if (have.has(w.key)) { console.log("present, skip: " + w.key); return; }
    fields.push({ key: w.key, type: w.type, displayName: w.displayName });
    added.push(w.key);
  });

  if (!added.length) {
    console.log("nothing to add - all placed-utility fields already present.");
    return;
  }

  console.log("adding: " + added.join(", "));

  // 3. Write the reconciled field list back. The id goes on `id`, not `_id`, to match
  //    the create shape. Everything else on the collection (permissions, plugins,
  //    displayName) is passed through exactly as it came, so this changes fields alone.
  const id = col._id || col.id || COLLECTION_ID;
  const payload = Object.assign({}, col, { id: id, fields: fields });
  delete payload._id;

  const put = await req("PUT", "/wix-data/v2/collections", { collection: payload });
  if (!put.ok) {
    console.error("UPDATE FAILED " + put.status + ": " + put.text.slice(0, 600));
    process.exit(1);
  }

  // 4. Read back and prove the fields are actually there now - a 2xx on a write is not
  //    evidence the store kept them (F8). Same verify-with-the-reader's-own-tool rule.
  const back = await req("GET", "/wix-data/v2/collections/" + encodeURIComponent(COLLECTION_ID));
  if (!back.ok) {
    console.error("wrote, but could not read back to confirm (status " + back.status + ")");
    process.exit(1);
  }
  const backCol = back.json.collection || back.json.dataCollection || back.json;
  const backHave = new Set((backCol.fields || []).map(fieldKey).filter(Boolean));
  const missing = added.filter(function (k) { return !backHave.has(k); });
  if (missing.length) {
    console.error("read-back is missing: " + missing.join(", ") + " - the write was accepted but not kept");
    process.exit(1);
  }

  console.log("confirmed present on read-back: " + added.join(", "));
})();
