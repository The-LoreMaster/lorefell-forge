// backend/tableroom.web.js
// A ticket into an adventure's live table room (cloudflare/table-room). The room is where
// token moves, pings and scene switches travel between devices in a fraction of a second;
// Wix stays the saved copy. The ticket says which adventure, which member, their role, and
// (for a player) which Fell they own, and is signed here with a private key kept in Wix
// Secrets (TABLE_ROOM_KEY); the room checks it with the matching public key. Only a member
// who runs the adventure, or who plays in it, gets one.
import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';
import { getSecret } from 'wix-secrets-backend';
import crypto from 'crypto';
import { myAdventureRole } from 'backend/fatewell.web.js';

const ROOM_URL = 'wss://lorefell-table.nate8-johnson.workers.dev/room/';
const HOURS = 12;

async function memberId() {
  try { const m = await currentMember.getMember(); return m ? m._id : ''; } catch (e) { return ''; }
}
function b64u(buf) { return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }

export const tableRoomTicket = webMethod(Permissions.Anyone, async (campaignId) => {
  const mid = await memberId();
  if (!mid || !campaignId) return { ok: false, error: 'not signed in, or no adventure' };
  let role = '';
  try { role = await myAdventureRole(campaignId); } catch (e) { role = ''; }
  const lm = role === 'loremaster' || role === 'lorekeeper';
  // the Fell this member plays in the adventure (a player moves only these)
  let chars = [];
  try {
    const r = await wixData.query('Characters').eq('ownerMemberId', mid).eq('campaignId', campaignId).limit(20).find({ suppressAuth: true });
    chars = r.items.map((it) => it._id);
  } catch (e) { chars = []; }
  if (!lm && !role && !chars.length) return { ok: false, error: 'not at this adventure' };
  let pem = '';
  try { pem = await getSecret('TABLE_ROOM_KEY'); } catch (e) { pem = ''; }
  if (!pem) return { ok: false, error: 'TABLE_ROOM_KEY is not set in Secrets Manager' };
  const body = b64u(JSON.stringify({ c: campaignId, m: mid, r: lm ? 'lm' : 'player', ch: chars, x: Date.now() + HOURS * 3600 * 1000 }));
  let sig = '';
  try { sig = b64u(crypto.sign('sha256', Buffer.from(body), { key: pem.replace(/\\n/g, '\n'), dsaEncoding: 'ieee-p1363' })); }
  catch (e) { return { ok: false, error: 'the key in TABLE_ROOM_KEY could not sign (' + String(e).slice(0, 60) + ')' }; }
  return { ok: true, url: ROOM_URL + encodeURIComponent(campaignId), ticket: body + '.' + sig, role: lm ? 'lm' : 'player' };
});
