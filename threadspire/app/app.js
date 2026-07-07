/* app.js, inlined into threadspire.html by bundle.mjs */
'use strict';
(function () {
  /* ---------- data ---------- */
  var NODES = (window.THREADSPIRE_GRAPH && window.THREADSPIRE_GRAPH.nodes) || [];
  var byId = {};
  NODES.forEach(function (n) { byId[n.id] = n; });

  var qs = new URLSearchParams(location.search);
  var wantNode = qs.get('node') || '';
  var wantWorld = qs.get('world') || '';  // a player deep-linked from their campaign
  if (wantWorld && !wantNode) wantNode = wantWorld;
  var campaignId = qs.get('campaign') || '';
  var seedOn = qs.get('seed') === '1' || wantNode.indexOf(':seed') >= 0;

  /* ---------- seed fixture, only with ?seed or a :seed node target ---------- */
  if (seedOn) {
    var seedNodes = [
      { id: 'world:seed', type: 'world', parent: 'sphere:the-sphere', title: 'Seedfall', summary: 'A test world raised for the harness.', lineage: 'the Seeded', brand: 'Seedset', spoiler: false, vaultUrl: '' },
      { id: 'world:seed-fog', type: 'world', parent: 'sphere:the-sphere', title: 'Veilmark', summary: 'A sibling left undiscovered so the fog can be seen.', spoiler: false, vaultUrl: '' },
      { id: 'world:seed-spoiler', type: 'world', parent: 'sphere:the-sphere', title: 'Hushfall', summary: 'A spoiler sibling.', spoiler: true, vaultUrl: '' },
      { id: 'map:seed', type: 'map', parent: 'world:seed', title: 'The Seeded Reach', summary: 'A test arc.', spoiler: false, vaultUrl: '' },
      { id: 'location:seed', type: 'location', parent: 'map:seed', title: 'First Marker', summary: 'A test location.', spoiler: false, vaultUrl: '' },
      { id: 'scenario:seed', type: 'scenario', parent: 'location:seed', title: 'The Waking Step', summary: 'A test scenario.', spoiler: false, order: 1, vaultUrl: '' },
      { id: 'character:seed', type: 'character', parent: 'scenario:seed', title: 'Marrow the Tested', summary: 'The seed character.', spoiler: false, vaultUrl: '' }
    ];
    seedNodes.forEach(function (n) { if (!byId[n.id]) { NODES.push(n); byId[n.id] = n; } });
  }

  var children = {};
  NODES.forEach(function (n) {
    if (!n.parent) return;
    (children[n.parent] = children[n.parent] || []).push(n);
  });
  Object.keys(children).forEach(function (k) {
    children[k].sort(function (a, b) { return (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title); });
  });

  /* ---------- state ---------- */
  var state = ThreadSpireStorage.load();
  // On the live tool, the shared setting is open by default. Every non-spoiler
  // node starts revealed; spoiler nodes and campaign-specific material stay
  // veiled until earned. A character joining a campaign seeds discovery there.
  (function seedPublic(){
    var changed=false;
    NODES.forEach(function(n){
      if(n.id.indexOf(':seed')>=0) return; // fixtures drive fog tests, never auto-reveal
      if(!n.spoiler && state.discovered.indexOf(n.id)<0){ state.discovered.push(n.id); changed=true; }
    });
    if(changed) ThreadSpireStorage.save(state);
  })();

  // Per-campaign discovery: the parent page answers with the LM-revealed node set.
  // These lift campaign material out of fog on top of the always-public worlds.
  function mergeDiscovered(ids){
    if(!Array.isArray(ids)||!ids.length) return;
    var changed=false;
    ids.forEach(function(id){ if(state.discovered.indexOf(id)<0){ state.discovered.push(id); changed=true; } });
    if(changed){ ThreadSpireStorage.save(state); recomputeRevealed(); render(); }
  }
  if(campaignId && window.parent && window.parent!==window){
    window.onmessage=function(ev){
      var m=ev&&ev.data; if(!m||!m.type) return;
      if(m.type==='threadspire-discovered'){ mergeDiscovered(m.nodes||[]); }
    };
    window.parent.postMessage({ type:'THREADSPIRE_READY', campaignId:campaignId }, '*');
  }
  if (seedOn) {
    ['world:seed', 'map:seed', 'location:seed', 'scenario:seed', 'character:seed'].forEach(function (id) {
      if (state.discovered.indexOf(id) < 0) state.discovered.push(id);
    });
    if (!state.activeCharacter) state.activeCharacter = 'character:seed';
    if (!state.memorials.some(function (m) { return m.id === 'memorial:seed-1'; })) {
      state.memorials.push(
        { id: 'memorial:seed-1', name: 'Vell of the First Try', epitaph: 'He asked the wrong door the right question.', pinnedTo: 'location:seed', world: 'world:seed' },
        { id: 'memorial:seed-2', name: 'Quiet Ash', epitaph: 'She counted the bells and the bells counted back.', pinnedTo: 'location:seed', world: 'world:seed' }
      );
    }
    ThreadSpireStorage.save(state);
  }

  function isDiscovered(id) { return state.discovered.indexOf(id) >= 0; }
  function ancestors(id) {
    var out = [], cur = byId[id];
    while (cur && cur.parent) { out.push(cur.parent); cur = byId[cur.parent]; }
    return out;
  }
  /* revealed: discovered, or an ancestor of anything discovered, or the sphere */
  var revealed = {};
  function recomputeRevealed() {
    revealed = { 'sphere:the-sphere': true };
    state.discovered.forEach(function (id) {
      revealed[id] = true;
      ancestors(id).forEach(function (a) { revealed[a] = true; });
    });
    state.memorials.forEach(function (m) { if (m.pinnedTo) { revealed[m.pinnedTo] = true; ancestors(m.pinnedTo).forEach(function (a) { revealed[a] = true; }); } });
  }
  recomputeRevealed();

  function save() { ThreadSpireStorage.save(state); recomputeRevealed(); }

  /* ---------- focus + render ---------- */
  var focusId = (wantNode && byId[wantNode]) ? wantNode
    : (location.hash.match(/node=([^&]+)/) ? decodeURIComponent(location.hash.match(/node=([^&]+)/)[1]) : '') || 'sphere:the-sphere';
  if (!byId[focusId]) focusId = 'sphere:the-sphere';

  var $ = function (id) { return document.getElementById(id); };
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function crumbTrail(id) {
    var trail = [byId[id]];
    var cur = byId[id];
    while (cur && cur.parent) { cur = byId[cur.parent]; if (cur) trail.unshift(cur); }
    return trail;
  }

  function memorialCountForWorld(worldId) {
    return state.memorials.filter(function (m) { return m.world === worldId; }).length;
  }

  function setFocus(id, push) {
    if (!byId[id]) return;
    focusId = id;
    if (push !== false) {
      try { history.replaceState(null, '', '#node=' + encodeURIComponent(id)); } catch (e) {}
    }
    var card = $('focusCard');
    card.classList.add('swap');
    setTimeout(function () { render(); card.classList.remove('swap'); }, 140);
  }
  window.fwFocus = setFocus;

  function zoomOut() {
    var n = byId[focusId];
    if (n && n.parent) setFocus(n.parent);
  }

  function render() {
    var n = byId[focusId];
    if (!n) return;
    document.body.setAttribute('data-focus', focusId);
    document.body.setAttribute('data-focus-type', n.type);

    /* crumbs */
    var ch = '';
    crumbTrail(focusId).forEach(function (c) {
      ch += '<button class="crumb" data-node="' + esc(c.id) + '" onclick="fwFocus(\'' + esc(c.id) + '\')">' + esc(c.title) + '</button>';
    });
    $('crumbs').innerHTML = ch;

    /* focus card */
    var meta = '';
    if (n.type === 'world') {
      if (n.lineage) meta += '<div class="f-meta">Lineage: ' + esc(n.lineage) + '</div>';
      if (n.brand) meta += '<div class="f-meta">Brand: ' + esc(n.brand) + '</div>';
      var mc = memorialCountForWorld(n.id);
      if (mc) meta += '<div class="f-meta">Fallen remembered here<span class="badge" data-testid="memorial-count">' + mc + '</span></div>';
    }
    var btns = '';
    if (n.parent) btns += '<button class="act" data-testid="zoom-out" onclick="fwZoomOut()">Zoom out</button>';
    if (n.type === 'character' && state.activeCharacter === n.id) {
      btns += '<button class="act gold" data-testid="retire" onclick="fwRetire()">Retire this Fell</button>';
    }
    if (seedOn && focusId === 'sphere:the-sphere') {
      btns += '<button class="act" data-testid="discover-demo" onclick="fwDiscoverDemo()">Discover the veiled world</button>';
    }
    var pinsHtml = '';
    if (isDiscovered(n.id) && n.type !== 'character') {
      var pins = state.pins.filter(function (p) { return p.node === n.id; });
      pins.forEach(function (p) { pinsHtml += '<div class="pin" data-testid="pin">' + esc(p.text) + '</div>'; });
      pinsHtml += '<textarea id="pinText" data-testid="pin-input" placeholder="Pin a note to this place"></textarea>'
        + '<div class="rowbtns"><button class="act" data-testid="pin-save" onclick="fwPin()">Pin it</button></div>';
    }
    $('focusCard').innerHTML =
      '<div class="f-type">' + esc(n.type) + '</div>'
      + '<h1 class="f-title" data-testid="focus-title">' + esc(n.title) + '</h1>'
      + '<div class="f-sum">' + esc(n.summary || '') + '</div>'
      + meta
      + '<div class="rowbtns">' + btns + '</div>'
      + pinsHtml;

    /* children: revealed render plain, undiscovered siblings render fogged */
    var kids = children[n.id] || [];
    var kh = '';
    kids.forEach(function (k) {
      var hidden = !revealed[k.id];
      if (hidden) {
        kh += '<div class="kid fog" data-node="' + esc(k.id) + '" data-title-hidden="true"'
          + (k.spoiler ? ' data-spoiler="true"' : '') + '>'
          + '<div class="k-type">' + esc(k.type) + '</div>'
          + '<div class="k-title">Undiscovered</div></div>';
      } else {
        kh += '<button class="kid" data-node="' + esc(k.id) + '" onclick="fwFocus(\'' + esc(k.id) + '\')">'
          + '<div class="k-type">' + esc(k.type) + '</div>'
          + '<div class="k-title">' + esc(k.title) + '</div>'
          + '<div class="k-sum">' + esc(k.summary || '') + '</div></button>';
      }
    });
    /* memorial markers on their pinned location */
    state.memorials.forEach(function (m) {
      if (m.pinnedTo !== n.id) return;
      kh += '<button class="kid memorial" data-testid="memorial" onclick="fwEpitaph(\'' + esc(m.id) + '\')">'
        + '<div class="k-type">memorial</div>'
        + '<div class="k-title">' + esc(m.name) + '</div></button>';
    });
    $('children').innerHTML = kids.length || kh ? '<div class="kids-h">Within</div>' + kh : '';
  }

  window.fwZoomOut = zoomOut;
  window.fwDiscoverDemo = function () {
    if (state.discovered.indexOf('world:seed-fog') < 0) state.discovered.push('world:seed-fog');
    save(); render();
  };
  window.fwPin = function () {
    var t = $('pinText'); if (!t || !t.value.trim()) return;
    state.pins.push({ node: focusId, text: t.value.trim(), at: Date.now() });
    save(); render();
  };
  window.fwEpitaph = function (mid) {
    var m = state.memorials.filter(function (x) { return x.id === mid; })[0];
    if (!m) return;
    $('pop').innerHTML = '<div class="f-type">memorial</div><h2 class="f-title">' + esc(m.name) + '</h2>'
      + '<div class="f-sum" data-testid="epitaph">' + esc(m.epitaph || '') + '</div>'
      + '<div class="rowbtns"><button class="act" onclick="fwPopClose()">Close</button></div>';
    $('pop').classList.remove('hidden'); $('veil').classList.remove('hidden');
  };
  window.fwPopClose = function () { $('pop').classList.add('hidden'); $('veil').classList.add('hidden'); };
  $('veil').addEventListener('click', window.fwPopClose);

  window.fwRetire = function () {
    var n = byId[focusId];
    if (!n || n.type !== 'character') return;
    $('pop').innerHTML = '<div class="f-type">the long rest</div><h2 class="f-title">Retire ' + esc(n.title) + '?</h2>'
      + '<div class="f-sum">A memorial rises where they last stood. This cannot be undone.</div>'
      + '<textarea id="epi" data-testid="epitaph-input" placeholder="An epitaph, if any words are left"></textarea>'
      + '<div class="rowbtns"><button class="act gold" data-testid="retire-confirm" onclick="fwRetireConfirm()">Lay them to rest</button>'
      + '<button class="act" onclick="fwPopClose()">Not yet</button></div>';
    $('pop').classList.remove('hidden'); $('veil').classList.remove('hidden');
  };
  window.fwRetireConfirm = function () {
    var n = byId[focusId]; if (!n || n.type !== 'character') return;
    var cur = n, loc = null, world = null;
    while (cur && cur.parent) {
      cur = byId[cur.parent];
      if (cur && cur.type === 'location' && !loc) loc = cur;
      if (cur && cur.type === 'world') world = cur;
    }
    var epi = ($('epi') && $('epi').value.trim()) || '';
    state.memorials.push({ id: 'memorial:' + Date.now(), name: n.title, epitaph: epi, pinnedTo: loc ? loc.id : (n.parent || 'sphere:the-sphere'), world: world ? world.id : '' });
    if (state.activeCharacter === n.id) state.activeCharacter = null;
    save(); window.fwPopClose();
    setFocus(loc ? loc.id : 'sphere:the-sphere');
  };

  /* ---------- starfield, guarded, DPR safe ---------- */
  (function sky() {
    var cv = $('sky'); if (!cv) return;
    var ctx; try { ctx = cv.getContext('2d'); } catch (e) { return; }
    if (!ctx) return;
    var stars = [], W = 0, H = 0;
    function size() {
      var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      W = cv.clientWidth || window.innerWidth; H = cv.clientHeight || window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      for (var i = 0; i < 90; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .2, p: Math.random() * Math.PI * 2 });
    }
    try { new ResizeObserver(size).observe(cv); } catch (e) { window.addEventListener('resize', size); }
    size();
    var t = 0;
    (function tick() {
      try {
        t += .016;
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < stars.length; i++) {
          var s = stars[i];
          ctx.globalAlpha = .3 + .5 * Math.abs(Math.sin(t + s.p));
          ctx.fillStyle = '#b8ccd8';
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      } catch (e) { /* never let the sky take the page down */ }
      requestAnimationFrame(tick);
    })();
  })();

  render();
})();
