// backend/sphereart.web.js
// Map art and clickable node layouts for ThreadSpire, authored in The Cartographer.
// Dev-authored world and territory art has an empty campaignId, so every campaign
// reads it. Location art added by a LoreMaster carries a campaignId and is scoped to
// that campaign. Nodes are stored as a JSON string since the CMS has no array type.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const COLLECTION = 'SphereArt';

async function memberId() {
  try { const m = await currentMember.getMember(); return m ? m._id : ''; }
  catch (e) { return ''; }
}

function outRow(r) {
  let nodes = [];
  try { nodes = r.nodes ? JSON.parse(r.nodes) : []; } catch (e) { nodes = []; }
  return {
    _id: r._id,
    nodeId: r.nodeId,
    kind: r.kind || '',
    image: r.image || '',
    title: r.artTitle || '',
    lore: r.lore || '',
    nodes: Array.isArray(nodes) ? nodes : [],
    campaignId: r.campaignId || ''
  };
}

// Every dev-authored piece (campaignId empty), plus any rows for a given campaign.
// ThreadSpire calls this to paint its layers.
export const listSphereArt = webMethod(Permissions.Anyone, async (campaignId) => {
  try {
    const r = await wixData.query(COLLECTION).limit(1000).find({ suppressAuth: true });
    const items = r.items
      .filter((x) => !x.campaignId || (campaignId && x.campaignId === campaignId))
      .map(outRow);
    return { ok: true, art: items };
  } catch (e) { return { ok: false, art: [], error: 'The Cartographer could not be reached.' }; }
});

export const getSphereArt = webMethod(Permissions.Anyone, async (nodeId) => {
  if (!nodeId) return null;
  try {
    const r = await wixData.query(COLLECTION).eq('nodeId', nodeId).limit(1).find({ suppressAuth: true });
    return r.items.length ? outRow(r.items[0]) : null;
  } catch (e) { return null; }
});

// Save or update the art for one node. Dev-only in practice; the CMS permission
// on SphereArt should be admin-write. Nodes come in as an array, stored as JSON.
export const saveSphereArt = webMethod(Permissions.Admin, async (rec) => {
  if (!rec || !rec.nodeId) return { ok: false, error: 'A node id is required.' };
  const row = {
    nodeId: rec.nodeId,
    kind: rec.kind || 'location',
    image: rec.image || '',
    artTitle: rec.title || '',
    lore: rec.lore || '',
    nodes: JSON.stringify(Array.isArray(rec.nodes) ? rec.nodes : []),
    campaignId: rec.campaignId || ''
  };
  try {
    const ex = await wixData.query(COLLECTION).eq('nodeId', rec.nodeId).limit(1).find({ suppressAuth: true });
    if (ex.items.length) {
      await wixData.update(COLLECTION, Object.assign({}, ex.items[0], row), { suppressAuth: true });
    } else {
      await wixData.insert(COLLECTION, row, { suppressAuth: true });
    }
    return { ok: true };
  } catch (e) { return { ok: false, error: 'The art could not be saved.' }; }
});
