// scripts/migrateCampaigns.js
// One-time, idempotent migration of every Campaigns blob into the decomposed Adventures tree
// (Adventures / AdvActs / AdvSessions / AdvScenes). Runs in the Apply workflow after the four
// collections exist. Keeps the SAME id (advId == campaignId) so members, players and stages
// still resolve. Does NOT delete the Campaigns row; the blob remains a backup until the tool
// side has retired it. Safe to rerun: it upserts rows by id and prunes rows the campaign no
// longer contains, so a second run is a no-op on an unchanged campaign.

const { req } = require("./lib/wixClient");
const zlib = require("zlib");

const CAMP = "Campaigns";
const ADV = "Adventures";
const ACTS = "AdvActs";
const SES = "AdvSessions";
const SCN = "AdvScenes";
const PAGE = 50;

function jparse(s, d) { if (s && typeof s === "object") return s; try { return JSON.parse(s || ""); } catch (e) { return d; } }

// A campaign blob is either a plain object or a base64 gzip wrapper. Unwrap either.
function unpack(data) {
  if (data && typeof data.campaignGz === "string") {
    try { return JSON.parse(zlib.gunzipSync(Buffer.from(data.campaignGz, "base64")).toString("utf8")); }
    catch (e) { return {}; }
  }
  return data || {};
}

async function query(coll, filter, limit) {
  const r = await req("POST", "/wix-data/v2/items/query", {
    dataCollectionId: coll,
    query: { filter: filter || {}, paging: { limit: limit || 100 } }
  });
  if (!r.ok) return [];
  return (r.json.dataItems || r.json.items || []).map(function (it) {
    return it.data ? Object.assign({ _id: it.id || (it.data && it.data._id) }, it.data) : it;
  });
}

async function upsert(coll, idField, idVal, fields) {
  // find existing by the natural id field (advId/actId/sesId/sceneId), scoped to the adventure
  const existing = await query(coll, Object.assign({}, fields.advId ? { advId: fields.advId } : {}, { [idField]: idVal }), 1);
  const dataItem = Object.assign({}, fields);
  dataItem[idField] = idVal;
  dataItem.updatedAt = Date.now();
  if (existing.length) {
    dataItem._id = existing[0]._id;
    const r = await req("PUT", "/wix-data/v2/items/" + encodeURIComponent(existing[0]._id), { dataCollectionId: coll, dataItem: dataItem });
    return r.ok;
  }
  const r = await req("POST", "/wix-data/v2/items", { dataCollectionId: coll, dataItem: dataItem });
  return r.ok;
}

async function upsertRoot(advId, camp, ownerMemberId) {
  const acts = Array.isArray(camp.acts) ? camp.acts : [];
  const existing = await query(ADV, { advId: advId }, 1);
  const dataItem = {
    advId: advId,
    name: camp.name || "Adventure",
    ownerMemberId: ownerMemberId || "",
    activeSceneId: camp.activeSceneId || "",
    actOrder: JSON.stringify(acts.map(function (a) { return a.id; })),
    meta: JSON.stringify({ migratedFrom: advId, migratedAt: Date.now() }),
    migratedFrom: advId,
    updatedAt: Date.now()
  };
  if (existing.length) {
    dataItem._id = existing[0]._id;
    // keep an owner already set
    if (existing[0].ownerMemberId) dataItem.ownerMemberId = existing[0].ownerMemberId;
    const r = await req("PUT", "/wix-data/v2/items/" + encodeURIComponent(existing[0]._id), { dataCollectionId: ADV, dataItem: dataItem });
    return r.ok;
  }
  // the root's own _id is the advId, so both tools resolve it by campaign id
  dataItem._id = advId;
  const r = await req("POST", "/wix-data/v2/items", { dataCollectionId: ADV, dataItem: dataItem });
  return r.ok;
}

async function pruneMissing(coll, idField, advId, keep) {
  const rows = await query(coll, { advId: advId }, 1000);
  for (const row of rows) {
    if (!keep[row[idField]]) {
      try { await req("DELETE", "/wix-data/v2/items/" + encodeURIComponent(row._id) + "?dataCollectionId=" + coll); } catch (e) {}
    }
  }
}

function cleanScene(sc) {
  // store the scene's own fields in sceneData, beats and combatants in their columns
  const own = {};
  Object.keys(sc || {}).forEach(function (k) {
    if (["id", "name", "prep", "img", "desc", "mode", "status", "beats", "combatants"].indexOf(k) >= 0) return;
    own[k] = sc[k];
  });
  return {
    name: sc.name || "",
    prep: sc.prep || "", img: sc.img || "", desc: sc.desc || "",
    mode: sc.mode || "roleplay", status: sc.status || "active",
    beats: JSON.stringify(sc.beats || []),
    combatants: JSON.stringify(sc.combatants || []),
    sceneData: JSON.stringify(own)
  };
}

async function migrateOne(camp) {
  const advId = camp._id;
  const data = unpack(jparse(camp.data, {}));
  const acts = Array.isArray(data.acts) ? data.acts : [];

  await upsertRoot(advId, Object.assign({ name: camp.name }, data), camp.ownerMemberId);

  const keepA = {}, keepSe = {}, keepSc = {};
  let nScenes = 0;
  for (let ai = 0; ai < acts.length; ai++) {
    const a = acts[ai];
    keepA[a.id] = 1;
    await upsert(ACTS, "actId", a.id, {
      advId: advId, name: a.name || "", notes: a.notes || "", img: a.img || "", desc: a.desc || "",
      sortIndex: ai,
      sessionOrder: JSON.stringify((a.sessions || []).map(function (s) { return s.id; })),
      extra: JSON.stringify({})
    });
    const sessions = a.sessions || [];
    for (let si = 0; si < sessions.length; si++) {
      const se = sessions[si];
      keepSe[se.id] = 1;
      await upsert(SES, "sesId", se.id, {
        advId: advId, actId: a.id, name: se.name || "",
        sortIndex: si,
        sceneOrder: JSON.stringify((se.scenes || []).map(function (s) { return s.id; })),
        extra: JSON.stringify({})
      });
      const scenes = se.scenes || [];
      for (let ci = 0; ci < scenes.length; ci++) {
        const sc = scenes[ci];
        keepSc[sc.id] = 1;
        await upsert(SCN, "sceneId", sc.id, Object.assign({ advId: advId, actId: a.id, sesId: se.id, sortIndex: ci }, cleanScene(sc)));
        nScenes++;
      }
    }
  }

  await pruneMissing(SCN, "sceneId", advId, keepSc);
  await pruneMissing(SES, "sesId", advId, keepSe);
  await pruneMissing(ACTS, "actId", advId, keepA);

  // verify round trip: count scenes back
  const backScenes = (await query(SCN, { advId: advId }, 1000)).length;
  return { advId: advId, name: camp.name || "Adventure", scenesWritten: nScenes, scenesReadBack: backScenes, clean: nScenes === backScenes };
}

(async () => {
  let offset = 0, total = 0, ok = 0, dirty = 0, failed = 0;
  const report = [];
  while (true) {
    const q = await req("POST", "/wix-data/v2/items/query", {
      dataCollectionId: CAMP,
      query: { paging: { limit: PAGE, offset: offset } }
    });
    if (!q.ok) {
      console.log("Campaigns unavailable (status " + q.status + "). Nothing to migrate.");
      process.exit(0);
    }
    const rows = (q.json.dataItems || q.json.items || []).map(function (it) {
      return it.data ? Object.assign({ _id: it.id || (it.data && it.data._id) }, it.data) : it;
    });
    if (!rows.length) break;
    for (const camp of rows) {
      total++;
      try {
        const res = await migrateOne(camp);
        if (res.clean) { ok++; } else { dirty++; }
        report.push(res);
        console.log((res.clean ? "OK   " : "DIFF ") + res.advId + "  " + res.name + "  scenes " + res.scenesWritten + " -> " + res.scenesReadBack);
      } catch (e) {
        failed++;
        console.log("FAIL " + camp._id + "  " + ((e && e.message) || e));
      }
    }
    offset += PAGE;
  }
  console.log("\nCampaigns migrated: " + total + " total, " + ok + " clean, " + dirty + " with a scene-count difference, " + failed + " failed.");
  if (dirty || failed) {
    console.log("A DIFF means a scene did not read back; a FAIL means the row threw. Neither deletes the Campaigns blob, so the source is intact. Investigate before retiring the blob.");
  }
})();
