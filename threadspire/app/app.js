/* ThreadSpire, character-first journey map. Inlined into threadspire.html by bundle.mjs.
   Opens on a player's character token, zooms outward through location, territory, and
   world as the campaign reveals them. The canon graph gives the containment chain;
   the character, discovery set, and art arrive from the parent page bridge. */
'use strict';
(function () {
  var NODES = (window.THREADSPIRE_GRAPH && window.THREADSPIRE_GRAPH.nodes) || [];
  var byId = {}; NODES.forEach(function (n) { byId[n.id] = n; });
  function childrenOf(pid){ return NODES.filter(function(n){ return n.parent===pid; }); }
  function parentOf(id){ var n=byId[id]; return n && n.parent ? byId[n.parent] : null; }

  var qs = new URLSearchParams(location.search);
  var characterId = qs.get('character') || '';
  var campaignId  = qs.get('campaign') || '';
  var demo = qs.get('demo') === '1';

  /* ---- state that arrives from the bridge (or demo fixtures) ---- */
  var CTX = {
    character: null,      // { id, name, playerName, image, lineage, origin, motivation, arsenal, talents, blurb, owner, isOwner, locationId, worldId }
    party: [],            // other characters in the campaign: [{ id, name, image, locationId }]
    discovered: [],       // node ids the LM has revealed
    worldUnlocked: false, // the LM's gate: can the player zoom past territory to world
    goals: [],            // quest board: [{ title, done }]
    worldIssues: [],      // [ "single sentence", ... ]
    art: {}               // nodeId -> { image, title, lore, nodeLayout }
  };

  if (demo) {
    CTX.character = { id:'char:demo', name:'Marrow the Tested', playerName:'Nate', image:'',
      lineage:'The Flayed', origin:'Gravewright', motivation:'Vengeance',
      arsenal:{ weapons:['Rendfang, a Precision blade'], lorebounds:['The Cawmarch'], armor:['Stalwart plating'] },
      talents:['Breakout adept','Ironjaw'], blurb:'Pulled from the ash of a burned reliquary, Marrow keeps a list of names and crosses them off.',
      owner:'m1', isOwner:true, locationId:'location:seed-loc', worldId:'world:seed-world' };
    CTX.party = [{ id:'char:demo2', name:'Quiet Ash', image:'', locationId:'location:seed-loc' }];
    CTX.discovered = ['location:seed-loc','location:seed-loc2'];
    CTX.worldUnlocked = false;
    CTX.goals = [{ title:'Find the archivist beneath Stellum', done:false }, { title:'Wake one forgotten name', done:true }];
    CTX.worldIssues = ['Sellenia is being lulled into a forgetting that erases its history.'];
    CTX.art = {
      'map:seed-terr': { image:'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iIzEwMTYyYSIvPjwvc3ZnPg==',
        title:'The Drowned Coast', lore:'Salt eats the old roads.',
        nodeLayout:[ {x:30,y:40,target:'location:seed-loc',label:'Stellum District'}, {x:70,y:60,target:'location:seed-loc2',label:'Moonbeacon Row'} ] }
    };
    // demo graph nodes if the real graph lacks them
    [['world:seed-world',null,'world','Sellenia'],
     ['map:seed-terr','world:seed-world','map','The Drowned Coast'],
     ['location:seed-loc','map:seed-terr','location','Stellum District'],
     ['location:seed-loc2','map:seed-terr','location','The Moonbeacon Row']
    ].forEach(function(r){ if(!byId[r[0]]){ var n={id:r[0],parent:r[1],type:r[2],title:r[3],summary:''}; NODES.push(n); byId[r[0]]=n; } });
  }

  /* ---- layer helpers: character sits under a location, under a territory(map), under a world ---- */
  function locationOfCharacter(){ return CTX.character && CTX.character.locationId ? byId[CTX.character.locationId] : null; }
  function territoryOf(locId){ var l=byId[locId]; return l ? parentOf(l.id) : null; }
  function worldOf(locId){ var t=territoryOf(locId); return t ? parentOf(t.id) : null; }

  function isRevealed(id){ return CTX.discovered.indexOf(id) >= 0; }
  function artFor(id){ return CTX.art[id] || null; }

  /* focus is a node id, or the special 'character' token */
  var focus = 'character';

  var $ = function (id) { return document.getElementById(id); };
  function esc(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ---- zoom model ----
     character -> location -> territory -> world
     Zoom out from the location to the territory is always allowed once you are at a location.
     Zoom out from territory to world is gated on CTX.worldUnlocked (the LM's call). */
  function currentLayer(){
    if (focus === 'character') return 'character';
    var n = byId[focus]; return n ? n.type : 'character';
  }
  function zoomOutTarget(){
    var layer = currentLayer();
    if (layer === 'character'){ var l=locationOfCharacter(); return l ? l.id : null; }
    if (layer === 'location'){ var t=territoryOf(focus); return t ? t.id : null; }
    if (layer === 'map'){ // territory -> world, gated
      if (!CTX.worldUnlocked) return null;
      var w=worldOf(CTX.character && CTX.character.locationId); return w ? w.id : null;
    }
    return null;
  }
  function zoomInTarget(){
    var layer = currentLayer();
    if (layer === 'world'){ var t=territoryOf(CTX.character.locationId); return t?t.id:null; }
    if (layer === 'map'){ var l=locationOfCharacter(); return l?l.id:null; }
    if (layer === 'location'){ return 'character'; }
    return null;
  }

  function setFocus(f){ focus = f; render(); scrollTop(); }
  window.tsFocus = setFocus;
  window.tsZoomOut = function(){ var t=zoomOutTarget(); if(t) setFocus(t); };
  window.tsZoomIn  = function(){ var t=zoomInTarget(); if(t!=null) setFocus(t); };

  /* ---- the character card ---- */
  function cardHTML(ch, forOwner){
    var a = ch.arsenal || {};
    function list(arr){ return (arr&&arr.length)? arr.map(esc).join(', ') : 'none'; }
    var img = ch.image ? '<div class="card-portrait" style="background-image:url('+esc(ch.image)+')"></div>'
                       : '<div class="card-portrait empty">'+esc((ch.name||'?').charAt(0))+'</div>';
    return '<div class="char-card">'
      + img
      + '<div class="cc-name">'+esc(ch.name||'Unnamed')+'</div>'
      + (ch.playerName ? '<div class="cc-player">played by '+esc(ch.playerName)+'</div>' : '')
      + '<div class="cc-line">'+esc([ch.lineage,ch.origin,ch.motivation].filter(Boolean).join(' \u00b7 '))+'</div>'
      + (ch.blurb ? '<div class="cc-blurb">'+esc(ch.blurb)+'</div>' : '')
      + '<div class="cc-sec"><span class="cc-h">Weapons</span> '+list(a.weapons)+'</div>'
      + '<div class="cc-sec"><span class="cc-h">Lorebounds</span> '+list(a.lorebounds)+'</div>'
      + '<div class="cc-sec"><span class="cc-h">Armor</span> '+list(a.armor)+'</div>'
      + '<div class="cc-sec"><span class="cc-h">Talents</span> '+list(ch.talents)+'</div>'
      + (forOwner ? '<button class="ts-sheet" data-testid="open-sheet" onclick="tsOpenSheet()">Open the full sheet</button>' : '')
      + '</div>';
  }
  window.tsOpenSheet = function(){
    if (window.parent && window.parent!==window) window.parent.postMessage({ type:'THREADSPIRE_OPEN_SHEET', characterId:CTX.character && CTX.character.id }, '*');
  };
  window.tsShowCard = function(cid){
    var ch = (CTX.character && CTX.character.id===cid) ? CTX.character
           : null;
    // other party members: request their lore page from the bridge
    if (!ch){ 
      if (window.parent && window.parent!==window) window.parent.postMessage({ type:'THREADSPIRE_WANT_LORE', characterId:cid }, '*');
      $('pop').innerHTML = '<div class="wait">Opening the lore...</div>';
      $('pop').classList.remove('hidden'); $('veil').classList.remove('hidden');
      return;
    }
    openCardPop(ch, ch.isOwner);
  };
  function openCardPop(ch, forOwner){
    $('pop').innerHTML = cardHTML(ch, forOwner) + '<button class="ts-close" onclick="tsPopClose()">Close</button>';
    $('pop').classList.remove('hidden'); $('veil').classList.remove('hidden');
  }
  window.tsPopClose = function(){ $('pop').classList.add('hidden'); $('veil').classList.add('hidden'); };

  /* the bridge answers a lore request */
  function onLore(ch){
    if (!$('pop') || $('pop').classList.contains('hidden')) return;
    openCardPop(ch, false);
  }

  /* ---- render per layer ---- */
  function render(){
    var layer = currentLayer();
    document.body.setAttribute('data-focus-type', layer);
    var stage = $('stage');

    // breadcrumb across the layers the player can currently see
    var crumbs = [];
    crumbs.push(['character', CTX.character ? CTX.character.name : 'You']);
    var loc = locationOfCharacter();
    if (loc) crumbs.push([loc.id, loc.title]);
    var terr = loc ? territoryOf(loc.id) : null;
    if (terr) crumbs.push([terr.id, terr.title]);
    if (CTX.worldUnlocked){ var w = loc ? worldOf(loc.id) : null; if (w) crumbs.push([w.id, w.title]); }
    $('crumbs').innerHTML = crumbs.map(function(c){
      var on = (c[0]===focus) ? ' on' : '';
      return '<button class="crumb'+on+'" onclick="tsFocus(\''+esc(c[0])+'\')">'+esc(c[1])+'</button>';
    }).join('<span class="crumb-sep">\u203a</span>');

    var h = '';
    if (layer === 'character'){
      h += '<div class="token-wrap">'
        + '<button class="char-token" data-testid="char-token" onclick="tsShowCard(\''+esc(CTX.character?CTX.character.id:'')+'\')">'
        + (CTX.character && CTX.character.image
            ? '<span class="tok-img" style="background-image:url('+esc(CTX.character.image)+')"></span>'
            : '<span class="tok-img empty">'+esc((CTX.character&&CTX.character.name||'?').charAt(0))+'</span>')
        + '<span class="tok-name">'+esc(CTX.character?CTX.character.name:'Your Fell')+'</span>'
        + '</button>'
        + '<p class="tok-hint">Tap to read the card. Zoom out to see where you stand.</p>'
        + '</div>';
    } else {
      var node = byId[focus];
      var art = artFor(focus);
      h += '<div class="layer-card">';
      if (art && art.image){
        var spots = '';
        (art.nodeLayout || []).forEach(function(nd){
          if (!nd || !nd.target) return;
          var known = isRevealed(nd.target);
          var cls = 'map-node' + (known ? '' : ' veiled');
          var label = nd.label || (byId[nd.target] && byId[nd.target].title) || '';
          spots += '<button class="'+cls+'" style="left:'+nd.x+'%;top:'+nd.y+'%" '
            + (known ? 'onclick="tsFocus(\''+esc(nd.target)+'\')"' : 'disabled')
            + ' data-testid="map-node" title="'+esc(known?label:'Undiscovered')+'">'
            + '<span class="mn-dot"></span>'
            + (known && label ? '<span class="mn-label">'+esc(label)+'</span>' : '')
            + '</button>';
        });
        h += '<div class="layer-map-wrap"><div class="layer-map" style="background-image:url('+esc(art.image)+')" data-testid="layer-map"></div>'+spots+'</div>';
      } else {
        h += '<div class="layer-map placeholder" data-testid="layer-map"><span>Map art coming</span></div>';
      }
      h += '<div class="layer-type">'+esc(layer==='map'?'territory':layer)+'</div>';
      h += '<div class="layer-title">'+esc(node?node.title:'')+'</div>';
      var lore = (art && art.lore) || (node && node.summary) || '';
      if (lore) h += '<div class="layer-lore">'+esc(lore)+'</div>';

      // location layer shows campaign goals from the quest board
      if (layer === 'location' && CTX.goals.length){
        h += '<div class="goals"><div class="goals-h">The party\'s goals</div>'
          + CTX.goals.map(function(g){
              return '<div class="goal'+(g.done?' done':'')+'"><span class="goal-box">'+(g.done?'\u2713':'')+'</span>'+esc(g.title)+'</div>';
            }).join('')
          + '</div>';
      }
      // world layer shows what the world faces
      if (layer === 'world' && CTX.worldIssues.length){
        h += '<div class="issues"><div class="goals-h">What this world faces</div>'
          + CTX.worldIssues.map(function(s){ return '<div class="issue">'+esc(s)+'</div>'; }).join('')
          + '</div>';
      }
      // party markers standing at this location
      if (layer === 'location'){
        var here = CTX.party.filter(function(p){ return p.locationId===focus; });
        if (here.length){
          h += '<div class="party"><div class="goals-h">Others who stand here</div>'
            + here.map(function(p){
                return '<button class="party-tok" data-testid="party-token" onclick="tsShowCard(\''+esc(p.id)+'\')">'
                  + (p.image?'<span class="pt-img" style="background-image:url('+esc(p.image)+')"></span>':'<span class="pt-img empty">'+esc(p.name.charAt(0))+'</span>')
                  + '<span class="pt-name">'+esc(p.name)+'</span></button>';
              }).join('')
            + '</div>';
        }
      }
      h += '</div>';
    }

    // zoom controls
    var out = zoomOutTarget(), inn = zoomInTarget();
    var gateNote = '';
    if (currentLayer()==='map' && !CTX.worldUnlocked){
      gateNote = '<p class="gate" data-testid="world-gate">The world beyond stays veiled until your LoreMaster opens it.</p>';
    }
    h += '<div class="zoom-row">'
      + '<button class="zoom" data-testid="zoom-in" onclick="tsZoomIn()"'+(inn==null?' disabled':'')+'>Zoom in</button>'
      + '<button class="zoom" data-testid="zoom-out" onclick="tsZoomOut()"'+(out==null?' disabled':'')+'>Zoom out</button>'
      + '</div>' + gateNote;

    stage.innerHTML = h;
  }

  function scrollTop(){
    function jump(){ try{ window.scrollTo(0,0); }catch(e){} try{ var a=$('topAnchor'); if(a&&a.scrollIntoView) a.scrollIntoView({block:'start'}); }catch(e){}
      if(window.parent&&window.parent!==window) window.parent.postMessage({type:'THREADSPIRE_SCROLLTOP'},'*'); }
    requestAnimationFrame(function(){ jump(); setTimeout(jump,120); });
  }

  /* ---- bridge in ---- */
  if (window.parent && window.parent !== window){
    window.onmessage = function(ev){
      var m = ev && ev.data; if (!m || !m.type) return;
      if (m.type === 'THREADSPIRE_CONTEXT'){
        if (m.character) CTX.character = m.character;
        if (Array.isArray(m.party)) CTX.party = m.party;
        if (Array.isArray(m.discovered)) CTX.discovered = m.discovered;
        if (typeof m.worldUnlocked === 'boolean') CTX.worldUnlocked = m.worldUnlocked;
        if (Array.isArray(m.goals)) CTX.goals = m.goals;
        if (Array.isArray(m.worldIssues)) CTX.worldIssues = m.worldIssues;
        if (m.art) CTX.art = m.art;
        // inject any nodes the bridge sent that the baked graph lacks (campaign locations)
        if (Array.isArray(m.nodes)) m.nodes.forEach(function(n){ if(!byId[n.id]){ NODES.push(n); byId[n.id]=n; } });
        focus = 'character';
        render();
      } else if (m.type === 'THREADSPIRE_LORE'){
        if (m.character) onLore(m.character);
      }
    };
    window.parent.postMessage({ type:'THREADSPIRE_READY', characterId:characterId, campaignId:campaignId }, '*');
  }

  render();
})();
