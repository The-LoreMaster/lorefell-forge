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
                    part  { p }                the rest of the table, by key (LoreMaster):
                                               fog, walls, lights, effects, notes, weather,
                                               music, rest, combatPhase, portraits ...
                    log   { e }                a log line (anyone: a roll, a say)
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
  return { campaignId: j.c, member: String(j.m || ''), role: j.r === 'lm' ? 'lm' : 'player', keeper: j.r === 'lm' && !!j.k, chars: Array.isArray(j.ch) ? j.ch.map(String) : [] };
}

/* A YouTube video's captions as plain text, for the Journal's recap. The browser cannot read
   them itself, so the room fetches the watch page, finds its caption tracks (English first,
   else the first there is) and returns the words. YouTube may refuse a server, and a video
   with no captions has none to give; either way the table says so and the upload still works.
   Nothing is kept. */
async function transcript(req, url) {
  const origin = req.headers.get('Origin') || '';
  const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOW.indexOf(origin) >= 0 ? origin : ALLOW[0], 'Vary': 'Origin' };
  const out = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: h });
  if (ALLOW.indexOf(origin) < 0) return out({ ok: false, error: 'origin not allowed' }, 403);
  const v = String(url.searchParams.get('v') || '').match(/^[A-Za-z0-9_-]{6,20}$/);
  if (!v) return out({ ok: false, error: 'no video id' }, 400);
  try {
    const page = await fetch('https://www.youtube.com/watch?v=' + v[0] + '&hl=en', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9' } });
    const html = await page.text();
    const i = html.indexOf('"captionTracks":');
    if (i < 0) return out({ ok: false, error: html.indexOf('confirm you') >= 0 ? 'YouTube asked the server to sign in' : 'this video has no captions' });
    const end = html.indexOf(']', i);
    let tracks = []; try { tracks = JSON.parse(html.slice(i + 16, end + 1)); } catch (e) { return out({ ok: false, error: 'the captions could not be read' }); }
    const tr = tracks.filter((t) => /^en/.test(t.languageCode || ''))[0] || tracks[0];
    if (!tr || !tr.baseUrl) return out({ ok: false, error: 'this video has no captions' });
    const cap = await fetch(tr.baseUrl.replace(/\\u0026/g, '&') + '&fmt=json3');
    const j = await cap.json();
    const text = (j.events || []).map((e) => (e.segs || []).map((s) => s.utf8 || '').join('')).join(' ').replace(/\s+/g, ' ').trim();
    const tm = html.match(/<title>([^<]*)<\/title>/);
    return out({ ok: !!text, text: text.slice(0, 600000), title: tm ? tm[1].replace(/ - YouTube$/, '') : '', error: text ? '' : 'the captions were empty' });
  } catch (e) { return out({ ok: false, error: 'YouTube could not be reached' }); }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/room\/([A-Za-z0-9_-]{3,80})$/);
    if (url.pathname === '/' || url.pathname === '/health') return new Response('lorefell table room', { status: 200 });
    if (url.pathname === '/transcript') return transcript(req, url);
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

/* drawings: kept as a union of strokes with a list of erased ids, the same rule the site's
   mergeDraw keeps, so the room and the saved copy always agree */
function mergeDraw(a, b) {
  a = a || {}; b = b || {};
  const gone = Array.from(new Set([].concat(a.gone || [], b.gone || []))).slice(-3000);
  const goneSet = {}; gone.forEach((g) => { goneSet[g] = 1; });
  const seen = {}, strokes = [];
  [].concat(a.strokes || [], b.strokes || []).forEach((s) => { if (!s || !s.id || seen[s.id] || goneSet[s.id]) return; seen[s.id] = 1; strokes.push(s); });
  return { strokes: strokes.slice(-600), gone: gone };
}
const KEEPER_PARTS = ['fog', 'walls', 'lights', 'effects', 'notes', 'weather', 'draw', 'portraits'];

export class TableRoom {
  constructor(ctx, env) {
    this.ctx = ctx; this.env = env;
    this.tokens = null; this.scene = null; this.seq = 0; this.moved = {}; this.parts = {}; this.log = []; this.reach = {}; this.draw = null; this.drawBy = {};
    this.ready = ctx.blockConcurrencyWhile(async () => {
      this.tokens = (await ctx.storage.get('tokens')) || null;
      this.scene = (await ctx.storage.get('scene')) || null;
      this.seq = (await ctx.storage.get('seq')) || 0;
      this.parts = (await ctx.storage.get('parts')) || {};
      this.log = (await ctx.storage.get('log')) || [];
      this.reach = (await ctx.storage.get('reach')) || {};
      this.draw = (await ctx.storage.get('draw')) || null;
      this.drawBy = (await ctx.storage.get('drawBy')) || {};
    });
  }
  async fetch(req) {
    await this.ready;
    const who = JSON.parse(req.headers.get('X-Room-Who') || '{}');
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(who);
    server.send(JSON.stringify({ t: 'init', tokens: this.tokens, scene: this.scene, parts: this.parts, log: this.log, seq: this.seq, peers: this.ctx.getWebSockets().length, lms: this.lmCount(), draw: this.draw, you: { role: who.role, keeper: !!who.keeper }, reach: who.role === 'lm' ? this.reach : undefined }));
    this.peers();
    return new Response(null, { status: 101, webSocket: client });
  }
  /* LoreMasters at the table, lorekeepers not counted: a lorekeeper's table saves the board
     only while this is 0, so there is one writer at a time */
  lmCount(except) {
    let n = 0;
    for (const s of this.ctx.getWebSockets()) { if (s === except) continue; const a = s.deserializeAttachment() || {}; if (a.role === 'lm' && !a.keeper) n++; }
    return n;
  }
  peers(except) { const n = this.ctx.getWebSockets().filter((s) => s !== except).length; this.send({ t: 'peers', n: n, lms: this.lmCount(except) }, except); }
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
      const own = !!(t.charId && who.chars.indexOf(String(t.charId)) >= 0);
      if (!lm && !own && !t.free) { try { ws.send(JSON.stringify({ t: 'deny', id: msg.id, back: t })); } catch (e) {} return; }
      const p = lm ? msg.p : (own ? { x: msg.p.x, y: msg.p.y, rot: msg.p.rot, imgPos: msg.p.imgPos, elev: msg.p.elev, climb: msg.p.climb } : { x: msg.p.x, y: msg.p.y });
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
      /* a lorekeeper edits the scene on the table (grid, map, tokens) but never switches it */
      if (who.keeper && this.scene && msg.b.activeSceneId !== this.scene.activeSceneId) return;
      this.scene = msg.b; if (Array.isArray(msg.b.tokens)) this.tokens = msg.b.tokens; this.moved = {}; this.seq++;
      this.send({ t: 'scene', b: this.scene, seq: this.seq, from: who.member }, ws);
      await this.keep(); return;
    }
    if (msg.t === 'part') {
      if (!lm || !msg.p || typeof msg.p !== 'object') return;
      /* a lorekeeper sends the map layers only, never the run-the-game parts */
      if (who.keeper) { const p = {}; Object.keys(msg.p).forEach((k) => { if (KEEPER_PARTS.indexOf(k) >= 0) p[k] = msg.p[k]; }); if (!Object.keys(p).length) return; msg.p = p; }
      Object.keys(msg.p).forEach((k) => { this.parts[k] = msg.p[k]; });
      if (msg.p.draw) { this.draw = mergeDraw(this.draw, msg.p.draw); this.ctx.storage.put('draw', this.draw); }
      this.seq++; this.send({ t: 'part', p: msg.p, seq: this.seq, from: who.member }, ws);
      this.ctx.storage.put('parts', this.parts); this.ctx.storage.put('seq', this.seq);
      return;
    }
    if (msg.t === 'log') {
      const e = msg.e; if (!e || !e.id || typeof e !== 'object') return;
      if (this.log.some((x) => x && x.id === e.id)) return;
      this.log.push(e); if (this.log.length > 200) this.log = this.log.slice(-200);
      this.send({ t: 'log', e: e, from: who.member }, ws);
      this.ctx.storage.put('log', this.log);
      return;
    }
    /* A Fell's Mobility and reach, from its own player's sheet. Only the player who owns that
       Fell may say it; it is kept, so a LoreMaster joining later has it, and it goes to the
       LoreMaster's devices only, since no other player has a use for it. */
    if (msg.t === 'reach') {
      const c = String(msg.c || '');
      if (lm || !c || (who.chars || []).indexOf(c) < 0) return;
      const v = { m: Math.max(0, Math.min(99, Number(msg.m) || 0)), r: Math.max(0, Math.min(99, Number(msg.r) || 0)), at: Date.now() };
      this.reach[c] = v;
      this.ctx.storage.put('reach', this.reach);
      const out = JSON.stringify({ t: 'reach', c: c, m: v.m, r: v.r, at: v.at });
      for (const s of this.ctx.getWebSockets()) {
        const a = s.deserializeAttachment() || {};
        if (a.role === 'lm') { try { s.send(out); } catch (e) {} }
      }
      return;
    }
    /* A stroke from anyone at the table, and an eraser: everyone's drawings travel here as
       they are made. A player erases only their own strokes; the LoreMaster's side any. */
    if (msg.t === 'stroke') {
      const s = msg.s;
      if (!s || typeof s !== 'object' || typeof s.id !== 'string' || !Array.isArray(s.p) || s.p.length > 6000) return;
      this.draw = mergeDraw(this.draw, { strokes: [s] });
      if (who.member) this.drawBy[s.id] = who.member;
      const keep = {}; (this.draw.strokes || []).forEach((x) => { if (this.drawBy[x.id]) keep[x.id] = this.drawBy[x.id]; }); this.drawBy = keep;
      this.send({ t: 'stroke', s: s, from: who.member }, ws);
      this.ctx.storage.put('draw', this.draw); this.ctx.storage.put('drawBy', this.drawBy);
      return;
    }
    if (msg.t === 'erase') {
      const ids = (Array.isArray(msg.ids) ? msg.ids : []).map(String).slice(0, 600).filter((id) => lm || this.drawBy[id] === who.member);
      if (!ids.length) return;
      this.draw = mergeDraw(this.draw, { gone: ids });
      this.send({ t: 'erase', ids: ids, from: who.member }, ws);
      this.ctx.storage.put('draw', this.draw);
      return;
    }
    /* a door or window opened or closed from any table: kept in the walls the room holds, so a
       table joining later finds it as it stands, and passed to every other table */
    if (msg.t === 'door') {
      const k = String(msg.k || ''), id = String(msg.id || '');
      if (!k || !id) return;
      const walls = this.parts.walls && this.parts.walls[k];
      if (Array.isArray(walls)) { walls.forEach((w) => { if (w && w.id === id) w.open = msg.open ? 1 : 0; }); this.ctx.storage.put('parts', this.parts); }
      this.send({ t: 'door', k: k, id: id, open: msg.open ? 1 : 0, from: who.member }, ws);
      return;
    }
    if (msg.t === 'ping') {
      this.send({ t: 'ping', x: msg.x, y: msg.y, c: msg.c, n: msg.n, k: msg.k, from: who.member }, ws);
      return;
    }
  }
  async webSocketClose(ws) { try { ws.close(); } catch (e) {} this.peers(ws); }
  async webSocketError(ws) { try { ws.close(); } catch (e) {} this.peers(ws); }
}
