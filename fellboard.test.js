const fs=require('fs');
const html=fs.readFileSync('fellboard.html','utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];

// Minimal DOM: each element is a real object with its own value.
const els={};
function el(v){ return {value:v||"", textContent:"", innerHTML:"", classList:{
  toggle(){}, add(){}, remove(){}, contains(){return false} }, checked:false}; }
["newTitle","newArea","newTool","newToolName","toolRow","repoHint","newPriority","newNotes",
 "pairOn","pairFields","pairTitle","pairArea","pairTool","pairToolName","pairToolRow","pairHint","pairNotes",
 "sec-blocked","sec-progress","sec-hold","sec-done","list-blocked","list-progress","list-hold","list-todo","list-done",
 "ct-blocked","ct-progress","ct-hold","ct-todo","ct-done","meta","gate","app","status","tokenInput"
].forEach(id=>els[id]=el());

global.document={getElementById:id=>els[id]||el(), querySelector:()=>el()};
global.localStorage={getItem:()=>"tok",setItem(){},removeItem(){}};
global.window={};
global.fetch=async()=>({ok:true,json:async()=>({sha:"x",content:""})});
global.btoa=s=>Buffer.from(s,'binary').toString('base64');
global.atob=s=>Buffer.from(s,'base64').toString('binary');
global.confirm=()=>true;
global.setTimeout=()=>{}; global.clearTimeout=()=>{};

const ctx={};
const body = script.replace(/boot\(\);\s*$/,'') + `
;ctx.addItem=addItem; ctx.syncRepo=syncRepo; ctx.syncHalf=syncHalf; ctx.fillSelects=fillSelects;
ctx.toolValue=toolValue; ctx.MAIN_IDS=MAIN_IDS; ctx.PAIR_IDS=PAIR_IDS; ctx.setState=s=>{state=s;};
ctx.getState=()=>state; ctx.save=()=>{}; save=()=>{}; ctx.TOOLS=TOOLS;`;
new Function('ctx', body)(ctx);
ctx.setState({version:2,updated:"",items:[]});

function reset(){ ctx.getState().items.length=0; Object.values(els).forEach(e=>{e.value="";e.checked=false;}); }

let fails=0;
function check(name, cond, detail){
  if(cond) console.log("  PASS  "+name);
  else { console.log("  FAIL  "+name+(detail?"  ["+detail+"]":"")); fails++; }
}

console.log("\n== The reported bug: vault -> site pair ==");
reset();
els.newTitle.value="Rename Discord Points to Disruptions";
els.newArea.value="fellguide";
els.newPriority.value="2";
els.newTool.value="FateWell";          // hidden, holds the default first option
els.pairOn.checked=true;
els.pairTitle.value="Update SigilForge labels";
els.pairArea.value="site";
els.pairTool.value="SigilForge";       // the one the user actually chose
ctx.addItem("todo");
const it=ctx.getState().items;
check("two items created", it.length===2, "got "+it.length);
const vault=it.find(i=>i.pairOrder===1), site=it.find(i=>i.pairOrder===2);
check("vault half has no tool", vault.tool===null, "tool="+vault.tool);
check("vault half has no toolFiles", vault.toolFiles===null, JSON.stringify(vault.toolFiles));
check("site half fenced to SigilForge", site.tool==="SigilForge", "tool="+site.tool);
check("site half NOT fenced to FateWell", site.tool!=="FateWell");
check("site half has both mirror paths",
  JSON.stringify(site.toolFiles)===JSON.stringify(["docs/sigilforge.html","embeds/sigilforge.html"]),
  JSON.stringify(site.toolFiles));
check("halves share a pair id", vault.pair===site.pair && !!vault.pair);
check("halves in different repos", vault.repo!==site.repo);

console.log("\n== site -> vault pair ==");
reset();
els.newTitle.value="Fix FoeForge vitality math";
els.newArea.value="site"; els.newTool.value="FoeForge"; els.newPriority.value="1";
els.pairOn.checked=true; els.pairTitle.value="Update encounter math page";
els.pairArea.value="fellguide"; els.pairTool.value="FateWell";  // hidden, should be ignored
ctx.addItem("todo");
const it2=ctx.getState().items;
const a=it2.find(i=>i.pairOrder===1), b=it2.find(i=>i.pairOrder===2);
check("site half fenced to FoeForge", a.tool==="FoeForge", "tool="+a.tool);
check("vault half ignores hidden selector", b.tool===null, "tool="+b.tool);

console.log("\n== Pages-only tool carries its note and one path ==");
reset();
els.newTitle.value="ForgeMaster tweak"; els.newArea.value="site"; els.newTool.value="ForgeMaster";
els.newPriority.value="3";
ctx.addItem("todo");
const fm=ctx.getState().items[0];
check("one path only", fm.toolFiles.length===1, JSON.stringify(fm.toolFiles));
check("no phantom embed path", !fm.toolFiles.some(p=>p.startsWith("embeds/")));
check("toolNote explains why", !!fm.toolNote && fm.toolNote.includes("Pages-only"));

console.log("\n== Same-repo pair is rejected ==");
reset();
els.newTitle.value="A"; els.newArea.value="fellguide"; els.newPriority.value="2";
els.pairOn.checked=true; els.pairTitle.value="B"; els.pairArea.value="lorevault";
ctx.addItem("todo");
check("no items created", ctx.getState().items.length===0, "got "+ctx.getState().items.length);

console.log("\n== New tool in the pair half is required ==");
reset();
els.newTitle.value="A"; els.newArea.value="fellguide"; els.newPriority.value="2";
els.pairOn.checked=true; els.pairTitle.value="B"; els.pairArea.value="site";
els.pairTool.value="__new"; els.pairToolName.value="";   // left blank
ctx.addItem("todo");
check("blank new tool name rejected", ctx.getState().items.length===0, "got "+ctx.getState().items.length);

reset();
els.newTitle.value="A"; els.newArea.value="fellguide"; els.newPriority.value="2";
els.pairOn.checked=true; els.pairTitle.value="B"; els.pairArea.value="site";
els.pairTool.value="__new"; els.pairToolName.value="Wardforge";
ctx.addItem("todo");
const nt=ctx.getState().items.find(i=>i.pairOrder===2);
check("named new tool accepted", nt && nt.tool==="Wardforge", nt?nt.tool:"none");
check("new tool gets convention paths",
  nt && JSON.stringify(nt.toolFiles)===JSON.stringify(["docs/wardforge.html","embeds/wardforge.html"]),
  nt?JSON.stringify(nt.toolFiles):"");

console.log("\n== Slug handles awkward names ==");
reset();
els.newTitle.value="X"; els.newArea.value="site"; els.newPriority.value="3";
els.newTool.value="__new"; els.newToolName.value="The Cartographer II";
ctx.addItem("todo");
const sl=ctx.getState().items[0];
check("slug is safe", JSON.stringify(sl.toolFiles)===JSON.stringify(["docs/the_cartographer_ii.html","embeds/the_cartographer_ii.html"]), JSON.stringify(sl.toolFiles));

console.log("\n== CSS: .hidden actually hides every element we toggle ==");
{
  const css = html.slice(html.indexOf("<style>")+7, html.indexOf("</style>"));
  const spec = sel => {
    const clean = sel.replace(/::?[a-z-]+(\([^)]*\))?/g, "");
    return [
      (clean.match(/#[\w-]+/g)||[]).length,
      (clean.match(/\.[\w-]+/g)||[]).length + (clean.match(/\[[^\]]+\]/g)||[]).length,
      (clean.match(/(?:^|[\s>+~])[a-z][\w-]*/g)||[]).length
    ];
  };
  const gt = (a,b) => a[0]!==b[0] ? a[0]>b[0] : a[1]!==b[1] ? a[1]>b[1] : a[2]>b[2];
  const HIDDEN = spec(".hidden");

  // Every element carrying class="... hidden ..." in the markup.
  const tags = html.match(/<[^>]+class="[^"]*\bhidden\b[^"]*"[^>]*>/g) || [];
  let bad = [];
  for(const tag of tags){
    const id = (tag.match(/id="([\w-]+)"/)||[])[1];
    const classes = (tag.match(/class="([^"]*)"/)||[])[1].split(/\s+/);
    for(const rule of css.matchAll(/([^{}]+)\{([^}]*)\}/g)){
      const sels = rule[1].trim(), body = rule[2];
      if(!/display\s*:/.test(body)) continue;
      if(/\.hidden/.test(sels)) continue;
      for(let sel of sels.split(",")){
        sel = sel.trim();
        if(!sel || sel.startsWith("@") || sel.startsWith("/*")) continue;
        const tail = sel.split(/\s+/).pop();
        const targetsId = id && sel.includes("#"+id);
        const targetsClass = tail.startsWith(".") && classes.includes(tail.slice(1));
        if(!targetsId && !targetsClass) continue;
        if(gt(spec(sel), HIDDEN) && !css.includes(sel + ".hidden")){
          bad.push(`#${id||"?"} beaten by "${sel}" with no ${sel}.hidden guard`);
        }
      }
    }
  }
  check("no display rule outranks .hidden unguarded", bad.length===0, bad.join(" | "));
}

console.log("\n== Reserved names: every RESERVED_SLUGS entry is exercised ==");
{
  // The required set is declared HERE, independently of the file. If the test read
  // the list out of fellboard.html, deleting an entry would delete its own test and
  // the suite would stay green. Every name below has a reason, stated once:
  //   fellboard   -> docs/fellboard.html is the exposure we reverted; never mintable
  //   forgemaster -> lowercase misses the "ForgeMaster" label and mints the phantom
  //                  embeds/forgemaster.html, whose rules.js sibling never loads
  //   rules       -> collides with the generated docs/rules.js
  //   index       -> docs/index.html is the Pages site root
  const REQUIRED = ["fellboard", "forgemaster", "rules", "index"];

  const listSrc = html.match(/const RESERVED_SLUGS = \[([^\]]*)\]/)[1];
  const reserved = listSrc.split(",").map(x => x.trim().replace(/"/g,"")).filter(Boolean);
  for(const r of REQUIRED)
    check(`RESERVED_SLUGS still contains "${r}"`, reserved.includes(r), listSrc);

  // Every entry must be rejected when typed as a NEW tool. toolOf() matches labels
  // exactly, so a lowercase "forgemaster" misses the "ForgeMaster" entry and would
  // otherwise mint the phantom embeds/forgemaster.html. That is why the slug is
  // reserved even though a similarly named tool exists.
  for(const r of REQUIRED){
    reset();
    els.newTitle.value="X"; els.newArea.value="site"; els.newPriority.value="3";
    els.newTool.value="__new"; els.newToolName.value=r;
    ctx.addItem("todo");
    check(`RESERVED "${r}" rejected as a new tool`, ctx.getState().items.length===0,
      "created "+ctx.getState().items.length+" item(s)");
  }

  // Each reserved entry must carry its weight: removing it must break something.
  // Assert that its convention paths would collide with a protected path.
  const PROTECTED_RX = [/fellboard\.html$/, /^docs\/rules\.js$/, /^embeds\/forgemaster\.html$/, /^docs\/index\.html$/];
  for(const r of REQUIRED){
    const would = ["docs/"+r+".html", "embeds/"+r+".html", "docs/"+r+".js"];
    check(`RESERVED "${r}" would otherwise collide with a protected path`,
      would.some(w => PROTECTED_RX.some(rx => rx.test(w))), would.join(","));
  }

  // Casing and spacing must not slip past the guard.
  for(const variant of ["Fellboard","FELLBOARD","  fellboard  "]){
    reset();
    els.newTitle.value="X"; els.newArea.value="site"; els.newPriority.value="3";
    els.newTool.value="__new"; els.newToolName.value=variant;
    ctx.addItem("todo");
    check(`"${variant}" rejected regardless of casing`, ctx.getState().items.length===0,
      "created "+ctx.getState().items.length);
  }

  // The guard exists to stop a fence from ever naming a protected path.
  // Assert on the paths, not on the labels, so the test survives a renamed slug.
  const FORBIDDEN = [/fellboard\.html$/, /^docs\/rules\.js$/, /^velo\//, /^scripts\//, /^schemas\//];
  reset();
  let leaked = [];
  for(const name of ["Fellboard","fellboard","rules","index","Rules Kernel","Wardforge"]){
    reset();
    els.newTitle.value="X"; els.newArea.value="site"; els.newPriority.value="3";
    els.newTool.value="__new"; els.newToolName.value=name;
    ctx.addItem("todo");
    const it = ctx.getState().items[0];
    if(it) for(const f of it.toolFiles||[])
      if(FORBIDDEN.some(rx => rx.test(f))) leaked.push(`${name} -> ${f}`);
  }
  check("no new-tool name can mint a protected path", leaked.length===0, leaked.join(" | "));
}

console.log("\n== An existing TOOLS label bypasses the reserved check by design ==");
reset();
els.newTitle.value="X"; els.newArea.value="site"; els.newPriority.value="3";
els.newTool.value="ForgeMaster";   // chosen from the dropdown, not typed as new
ctx.addItem("todo");
{
  const fm = ctx.getState().items[0];
  check("ForgeMaster selectable and fenced to its real file",
    fm && fm.toolFiles.length===1 && fm.toolFiles[0]==="docs/forgemaster.html",
    fm ? JSON.stringify(fm.toolFiles) : "none");
}

console.log("\n== Reserved name is rejected in the pair half too ==");
reset();
els.newTitle.value="A"; els.newArea.value="fellguide"; els.newPriority.value="2";
els.pairOn.checked=true; els.pairTitle.value="B"; els.pairArea.value="site";
els.pairTool.value="__new"; els.pairToolName.value="Fellboard";
ctx.addItem("todo");
check("paired Fellboard rejected", ctx.getState().items.length===0,
  "got "+ctx.getState().items.length+" items");

console.log("\n== A legitimate new tool still works ==");
reset();
els.newTitle.value="X"; els.newArea.value="site"; els.newPriority.value="3";
els.newTool.value="__new"; els.newToolName.value="Wardforge";
ctx.addItem("todo");
const ok=ctx.getState().items[0];
check("Wardforge accepted with convention paths",
  ok && JSON.stringify(ok.toolFiles)===JSON.stringify(["docs/wardforge.html","embeds/wardforge.html"]),
  ok?JSON.stringify(ok.toolFiles):"none");

console.log("\n"+(fails? fails+" FAILURE(S)" : "ALL PASS"));
process.exit(fails?1:0);
