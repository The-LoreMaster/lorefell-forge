/* LoreFell table room. One live room per adventure, on a Cloudflare Durable Object.

   Every device at a table holds a WebSocket to its adventure's room. The room is the one
   referee for what moves: a token move is a few dozen bytes, applied in the order it arrives
   and sent to everyone else at once, instead of each device writing its whole copy of the
   table to Wix and the others reading it a second or more later. Wix stays the saved copy;
   the LoreMaster's table still saves there.

   Who may join: a ticket signed by the site (backend/tableroom.web.js) with a private key it
   keeps in Wix Secrets; the room checks it with the public key below. The ticket names the
   adventure, the member, their role (lm or player) and, for a player, the Fell they own. A
   player may move only their own Fell's tokens; the LoreMaster may move anything and alone
   sets the whole board (tokens, scene).

   Messages, all JSON:
     to the room:   tok   { id, p }            one token's changed fields
                    toks  { list }             the whole token list (LoreMaster)
                    scene { b }                a scene switch, everything at once (LoreMaster)
                    ping  { x, y, ... }        a ping on the map
                    hb                         keep-alive
     from the room: init  { tokens, scene, seq, peers }   on joining
                    tok / toks / scene / ping, with seq and from (member)
                    peers { n }
*/
const ROOM_PUBLIC_KEY = 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAERiiyVY0l0T3jgXNUXNXWTMgJV0UDY6jLD0hqcPBMzxny6IDPqod7NkmYkVwg6TqgkUrvqdkpUNNDNsoOzbEcWw==';
const ALLOW = ['https://table.lorefell.com', 'https://the-loremaster.github.io', 'https://lorefell.com', 'https://www.lorefell.com', 'http://localhost:8787', 'null'];

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
  const bin = atob(s), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
let _key = null;
async function roomKey() {
  if (_key) return _key;
  _key = await crypto.subtle.importKey('spki', b64urlToBytes(ROOM_PUBLIC_KEY), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  return _key;
}
/* a ticket is base64url(json) "." base64url(signature); json = { c, m, r, ch, x } */
async function readTicket(t, campaignId) {
  if (!t || t.indexOf('.') < 0) return null;
  const [body, sig] = t.split('.');
  let ok = false;
  try { ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, await roomKey(), b64urlToBytes(sig), new TextEncoder().encode(body)); } catch (e) { ok = false; }
  if (!ok) return null;
  let j = null; try { j = JSON.parse(new TextDecoder().decode(b64urlToBytes(body))); } catch (e) { return null; }
  if (!j || j.c !== campaignId || !(Number(j.x) > Date.now())) return null;
  return { campaignId: j.c, member: String(j.m || ''), role: j.r === 'lm' ? 'lm' : 'player', chars: Array.isArray(j.ch) ? j.ch.map(String) : [] };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/room\/([A-Za-z0-9_-]{3,80})$/);
    if (url.pathname === '/' || url.pathname === '/health') return new Response('lorefell table room', { status: 200 });
    if (!m) return new Response('not found', { status: 404 });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected a websocket', { status: 426 });
    const origin = req.headers.get('Origin') || 'null';
    if (ALLOW.indexOf(origin) < 0) return new Response('origin not allowed', { status: 403 });
    const who = await readTicket(url.searchParams.get('t') || '', m[1]);
    if (!who) return new Response('ticket refused', { status: 401 });
    const id = env.ROOMS.idFromName(m[1]);
    const r = new Request(req, { headers: new Headers(req.headers) });
    r.headers.set('X-Room-Who', JSON.stringify(who));
    return env.ROOMS.get(id).fetch(r);
  }
};

export class TableRoom {
  constructor(ctx, env) {
    this.ctx = ctx; this.env = env;
    this.tokens = null; this.scene = null; this.seq = 0; this.moved = {};
    this.ready = ctx.blockConcurrencyWhile(async () => {
      this.tokens = (await ctx.storage.get('tokens')) || null;
      this.scene = (await ctx.storage.get('scene')) || null;
      this.seq = (await ctx.storage.get('seq')) || 0;
    });
  }
  async fetch(req) {
    await this.ready;
    const who = JSON.parse(req.headers.get('X-Room-Who') || '{}');
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(who);
    server.send(JSON.stringify({ t: 'init', tokens: this.tokens, scene: this.scene, seq: this.seq, peers: this.ctx.getWebSockets().length, you: { role: who.role } }));
    this.peers();
    return new Response(null, { status: 101, webSocket: client });
  }
  peers() { const n = this.ctx.getWebSockets().length; this.send({ t: 'peers', n: n }); }
  send(msg, except) {
    const s = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) { if (ws === except) continue; try { ws.send(s); } catch (e) {} }
  }
  /* a whole board from the LoreMaster keeps where a token was moved in the last few seconds,
     so a list sent a moment before a player's move cannot put that Fell back */
  keepRecent(list) {
    const now = Date.now(), cur = {};
    (this.tokens || []).forEach((t) => { if (t && t.id) cur[t.id] = t; });
    return list.map((t) => (t && this.moved[t.id] && now - this.moved[t.id] < 3000 && cur[t.id]) ? Object.assign({}, t, { x: cur[t.id].x, y: cur[t.id].y }) : t);
  }
  /* the board is kept so a device joining, or the room waking, starts from where it stands */
  async keep() {
    this.ctx.storage.put('tokens', this.tokens); this.ctx.storage.put('scene', this.scene); this.ctx.storage.put('seq', this.seq);
  }
  async webSocketMessage(ws, raw) {
    await this.ready;
    if (typeof raw !== 'string' || raw.length > 400000) return;
    let msg = null; try { msg = JSON.parse(raw); } catch (e) { return; }
    if (!msg || !msg.t) return;
    const who = ws.deserializeAttachment() || {};
    const lm = who.role === 'lm';
    if (msg.t === 'hb') { try { ws.send('{"t":"hb"}'); } catch (e) {} return; }
    if (msg.t === 'tok') {
      if (!msg.id || !msg.p || typeof msg.p !== 'object') return;
      const list = this.tokens || [];
      const i = list.findIndex((x) => x && x.id === msg.id);
      if (i < 0) return;
      const t = list[i];
      /* a player moves only their own Fell's tokens; the LoreMaster anything */
      if (!lm && !(t.charId && who.chars.indexOf(String(t.charId)) >= 0)) { try { ws.send(JSON.stringify({ t: 'deny', id: msg.id, back: t })); } catch (e) {} return; }
      const p = lm ? msg.p : { x: msg.p.x, y: msg.p.y, rot: msg.p.rot };
      Object.keys(p).forEach((k) => { if (p[k] !== undefined && k !== 'id') t[k] = p[k]; });
      this.moved[msg.id] = Date.now();
      this.seq++; this.send({ t: 'tok', id: msg.id, p: p, seq: this.seq, from: who.member }, ws);
      await this.keep(); return;
    }
    if (msg.t === 'toks') {
      if (!lm || !Array.isArray(msg.list)) return;
      this.tokens = this.keepRecent(msg.list); this.seq++;
      this.send({ t: 'toks', list: this.tokens, seq: this.seq, from: who.member }, ws);
      await this.keep(); return;
    }
    if (msg.t === 'scene') {
      if (!lm || !msg.b || typeof msg.b !== 'object') return;
      this.scene = msg.b; if (Array.isArray(msg.b.tokens)) this.tokens = msg.b.tokens; this.moved = {}; this.seq++;
      this.send({ t: 'scene', b: this.scene, seq: this.seq, from: who.member }, ws);
      await this.keep(); return;
    }
    if (msg.t === 'ping') {
      this.send({ t: 'ping', x: msg.x, y: msg.y, c: msg.c, n: msg.n, k: msg.k, from: who.member }, ws);
      return;
    }
  }
  async webSocketClose(ws) { try { ws.close(); } catch (e) {} this.peers(); }
  async webSocketError(ws) { try { ws.close(); } catch (e) {} this.peers(); }
}
