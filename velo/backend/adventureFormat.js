// The adventure format, both ways (_Canon/ADVENTURE_FORMAT.md in the vault).
//
// readAdventure turns an adventure folder (its pages, as text) into a lorefell-adventure-pack-1
// pack, the format ThreadSpire and FateWell import. writeAdventure turns an adventure made in the
// tools back into those pages. The forge's scripts/adventureFromVault.js reads the vault from
// disk through readAdventure, and the backend uses both when it locks an adventure to the vault,
// so the reading and the writing can never drift apart.
//
// Pure: no database, no files, no network. A folder is a map of its paths ("Scenes/01 - The
// Gate.md") to their text.

/* ---------- a small YAML reader, for the frontmatter the format allows ----------
   Maps, lists, lists of maps, quoted and bare scalars, [] and null. Nothing else appears in
   adventure frontmatter, and the forge carries no YAML dependency. */
function parseScalar(v) {
  v = v.trim();
  if (v === "" || v === "null" || v === "~") return null;
  if (v === "[]") return [];
  if (v === "{}") return {};
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if ((v[0] === '"' && v[v.length - 1] === '"') || (v[0] === "'" && v[v.length - 1] === "'")) {
    const inner = v.slice(1, -1);
    return v[0] === '"' ? inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\") : inner.replace(/''/g, "'");
  }
  return v;
}
export function parseYaml(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "" && !/^\s*#/.test(l));
  let i = 0;
  const indentOf = (l) => l.match(/^ */)[0].length;
  function block(indent) {
    if (i >= lines.length) return null;
    return lines[i].trim().startsWith("- ") || lines[i].trim() === "-" ? list(indent) : map(indent);
  }
  function map(indent) {
    const out = {};
    while (i < lines.length && indentOf(lines[i]) === indent && !lines[i].trim().startsWith("- ")) {
      const m = lines[i].trim().match(/^([^:]+):(?:\s+(.*))?$/);
      if (!m) throw new Error("YAML: cannot read line: " + lines[i]);
      i++;
      const key = m[1].trim();
      if (m[2] !== undefined && m[2].trim() !== "") out[key] = parseScalar(m[2]);
      else if (i < lines.length && indentOf(lines[i]) > indent) out[key] = block(indentOf(lines[i]));
      else if (i < lines.length && indentOf(lines[i]) === indent && lines[i].trim().startsWith("- ")) out[key] = list(indent);
      else out[key] = null;
    }
    return out;
  }
  function list(indent) {
    const out = [];
    while (i < lines.length && indentOf(lines[i]) === indent && lines[i].trim().startsWith("-")) {
      const rest = lines[i].trim().replace(/^-\s?/, "");
      if (/^[^"'\[][^:]*:(\s|$)/.test(rest)) {
        // a map that starts on the dash line: re-read it as a map one level in
        const inner = indent + 2;
        lines[i] = " ".repeat(inner) + rest;
        out.push(map(inner));
      } else {
        i++;
        out.push(parseScalar(rest));
      }
    }
    return out;
  }
  return block(0) || {};
}

export function splitPage(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: text };
  return { fm: parseYaml(m[1]), body: m[2] };
}

/* ---------- text ---------- */
export function linkTarget(l) { return String(l || "").replace(/^\[\[|\]\]$/g, "").split("|")[0].split("#")[0].split("/").pop().trim(); }
export function plain(text) {
  return String(text || "")
    .replace(/!\[\[[^\]]*\]\]/g, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, (_, t) => t.split("#")[0].split("/").pop());
}
export function slug(s, n) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, n || 40).replace(/-$/, "");
}

const KINDS = { readaloud: "readaloud", dialogue: "dialogue", beat: "beat", choice: "beat", crucible: "crucible",
  lorecheck: "lorecheck", clue: "clue", secret: "secret", reminder: "reminder", quest: "quest" };

/* A scene body becomes beats, one per callout, heading or paragraph, in reading order. */
export function parseBeats(body) {
  const beats = [];
  const lines = body.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    const co = ln.match(/^>\s*\[!([a-z]+)\][+-]?\s*(.*)$/i);
    if (co) {
      const type = co[1].toLowerCase();
      const out = [];
      const start = i;
      i++;
      while (i < lines.length && /^>/.test(lines[i])) { out.push(lines[i].replace(/^>\s?/, "")); i++; }
      beats.push({ type: KINDS[type] || "general", callout: type, title: co[2].trim(), body: out.join("\n").trim(), raw: lines.slice(start, i).join("\n") });
      continue;
    }
    const h = ln.match(/^#{2,6}\s+(.*\S)\s*$/);
    if (h) { beats.push({ type: "general", callout: "heading", title: h[1], body: "", raw: ln }); i++; continue; }
    if (/^#\s/.test(ln) || ln.trim() === "") { i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^>/.test(lines[i]) && !/^#/.test(lines[i])) { para.push(lines[i]); i++; }
    beats.push({ type: "general", callout: "note", title: "", body: para.join("\n").trim(), raw: para.join("\n") });
  }
  return beats;
}

// A beat's id: its scene, its kind and its own words, so it is stable across rebuilds and an
// edit to one beat leaves every other beat's id alone. parsed is parseBeats' output.
export function beatIds(parsed, sceneId) {
  const used = {};
  return parsed.map((b) => {
    const label = b.type === "dialogue" ? b.title + " " + (b.body.match(/^\*([^*]+)\*/) || [, ""])[1] : (b.title || b.body);
    let key = sceneId + "--" + (b.callout === "heading" ? "h" : b.type) + "-" + (slug(label, 48) || "beat");
    used[key] = (used[key] || 0) + 1;
    if (used[key] > 1) key += "-" + used[key];
    return key;
  });
}

// The tools key a canon world by id (world:vyrathis) and show its name (worldName); the vault
// names it (Vyrathis). ThreadSpire changes a world through worldId and worldName, so those win.
export function worldIdOf(name) { const s = slug(name, 40); return s ? "world:" + s : ""; }
function worldNameOf(adv) {
  if (adv.worldName) return String(adv.worldName);
  const id = String(adv.worldId || "");
  if (id.indexOf("world:") === 0) return id.slice(6).split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return String(adv.world || "");
}

function withPre(pre, id) { id = String(id || ""); return id.indexOf(pre) === 0 ? id : pre + id; }

/* ---------- reading: an adventure folder becomes a pack ---------- */
function pagesIn(files, dir) {
  return Object.keys(files).filter((p) => p.indexOf(dir + "/") === 0 && p.slice(dir.length + 1).indexOf("/") < 0 && p.endsWith(".md"))
    .sort().map((p) => Object.assign({ file: p.slice(dir.length + 1) }, splitPage(files[p])));
}

export function readAdventure(files, name, opts) {
  opts = opts || {};
  if (files[name + ".md"] === undefined) throw new Error("The adventure has no overview page, " + name + ".md");
  const overview = splitPage(files[name + ".md"]);
  const A = overview.fm;
  if (A.type !== "adventure") throw new Error(name + ".md is not type: adventure");
  const advId = A.id || slug(A.title || name, 60);
  const pre = advId + "--";
  const warnings = [];

  // foes and characters become library records with ids taken from the vault
  const foePages = pagesIn(files, "Foes").filter((p) => p.fm.type === "foe");
  const foes = foePages.map((p) => foeRecord(p, pre));
  const charPages = pagesIn(files, "Characters").filter((p) => p.fm.type === "character");
  const npcs = charPages.map((p) => npcRecord(p, pre));
  const charFiles = {}; charPages.forEach((p) => { charFiles[p.file.replace(/\.md$/, "").toLowerCase()] = 1; });
  const byName = {};
  foes.concat(npcs).forEach((e) => { byName[e.name.toLowerCase()] = e; });
  const foeByLink = {};
  foePages.forEach((p, k) => { foeByLink[p.file.replace(/\.md$/, "").toLowerCase()] = foes[k]; });
  (A.characters || []).forEach((l) => {
    if (!byName[linkTarget(l).toLowerCase()] && !charFiles[linkTarget(l).toLowerCase()]) warnings.push("Character " + linkTarget(l) + " has no page in Characters/, so it is left out.");
  });

  // scenes, in the order the overview lists them
  const scenePages = {};
  pagesIn(files, "Scenes").forEach((p) => { scenePages[p.file.replace(/\.md$/, "").toLowerCase()] = p; });
  const order = (A.scenes || []).map((l) => scenePages[linkTarget(l).toLowerCase()]).filter(Boolean);
  const pages = order.length ? order : Object.values(scenePages).sort((a, b) => (a.fm.order || 0) - (b.fm.order || 0));

  const node = (id, nm) => ({ id: id, name: nm, notes: "", img: "", desc: "", entries: [], manualRefs: [] });
  let acts;
  if (A.structure === "acts") {
    // each scene names its act and session; they stand in the order their first scene does
    acts = [];
    const actBy = {}, sesBy = {};
    pages.forEach((p) => {
      const an = String(p.fm.act || "Act 1"), sn = String(p.fm.session || "Session 1");
      const aid = p.fm.act_id || pre + "act-" + (slug(an, 40) || "1");
      let act = actBy[aid];
      if (!act) { act = actBy[aid] = Object.assign(node(aid, an), { sessions: [] }); acts.push(act); }
      const sid = p.fm.session_id || aid + "--session-" + (slug(sn, 40) || "1");
      let ses = sesBy[sid];
      if (!ses) { ses = sesBy[sid] = Object.assign(node(sid, sn), { scenes: [] }); act.sessions.push(ses); }
      ses.scenes.push(sceneRecord(p, pre, foeByLink, byName, warnings));
    });
  } else {
    acts = [Object.assign(node(pre + "act-1", A.title || name), { implicit: true,
      sessions: [Object.assign(node(pre + "session-1", A.length || "Session 1"), { scenes: pages.map((p) => sceneRecord(p, pre, foeByLink, byName, warnings)) })] })];
  }
  const campaign = Object.assign(node(advId, A.title || name), {
    type: A.adventure_type || (A.structure === "acts" ? "story" : "tale"),
    desc: plain(A.summary || ""),
    notes: plain(overview.body.replace(/^#\s.*$/m, "")).trim(),
    players: [],
    world: A.world || "",
    worldId: A.world ? worldIdOf(A.world) : "",
    worldName: A.world || "",
    level: A.level || 1,
    synced: A.synced === true,
    vault: { path: "Adventures/" + name, id: advId },
    acts: acts
  });

  return {
    pack: {
      meta: { format: "lorefell-adventure-pack-1", builtAt: opts.builtAt != null ? opts.builtAt : Date.now(), source: "vault", vaultPath: "Adventures/" + name, synced: campaign.synced },
      campaign: campaign, npcs: npcs, foes: foes
    },
    warnings: warnings
  };
}

function foeRecord(p, pre) {
  const f = p.fm;
  const id = withPre(pre, f.id || slug(f.name, 60));
  const notes = [plain(p.body.replace(/^#\s.*$/m, "")).trim()];
  if (f.react) notes.push("React: " + plain(f.react));
  const full = {
    infusions: (f.infusions || []).map(linkTarget),
    augments: (f.augmentations || []).map(linkTarget),
    abilities: (f.acts || []).map((a) => ({
      id: id + "--" + slug(a.name, 40), name: a.name || "", tier: Number(a.tier) || 1, use: "Act",
      desc: plain(a.text || ""), effect: plain(a.text || ""), source: "mine",
      kind: a.kind || "", points: a.points != null ? a.points : null, targeting: a.targeting || "", damage: a.damage || "", affliction: a.effect || ""
    }))
  };
  const sr = f.shatter_rating || "Elite";
  // the whole kit goes to the table: the foe card reveals what the rating, and any escalation,
  // allows, and greys the rest (FOE_REVEAL in ThreadSpire)
  return Object.assign({
    id: id, type: "monster", name: f.name || p.file.replace(/\.md$/, ""),
    desc: notes.filter(Boolean).join("\n\n"), img: "", origin: "",
    sr: sr, build: f.build || "", stance: f.stance || "",
    maxVit: Number(f.vitality) || 0,
    attrs: f.attributes || {},
    sig: linkTarget(f.affliction || ""),
    inv: [],
    source: "vault"
  }, full);
}
function npcRecord(p, pre) {
  const c = p.fm;
  return {
    id: withPre(pre, c.id || slug(c.name, 60)), type: "npc", name: c.name || p.file.replace(/\.md$/, ""),
    role: c.role || "", desc: plain(p.body.replace(/^#\s.*$/m, "")).trim(), img: "", origin: "",
    maxVit: 0, attrs: {}, inv: [], abilities: [], source: "vault"
  };
}

function sceneRecord(p, pre, foeByLink, byName, warnings) {
  const s = p.fm;
  const id = s.id ? s.id : pre + slug(s.name, 60);
  const speakers = {};
  const parsed = parseBeats(p.body);
  const ids = beatIds(parsed, id);
  const entries = parsed.map((b, bi) => {
    let speaker = "";
    if (b.type === "dialogue") {
      const who = byName[b.title.toLowerCase()];
      speaker = who ? who.id : b.title;
      if (who && who.type === "npc") speakers[who.id] = who;
    }
    return { id: ids[bi], type: b.type, title: plain(b.title), body: plain(b.body), speaker: speaker, handle: "", img: "", pinned: false, open: false };
  });
  const combatants = [];
  (s.foes || []).forEach((f, k) => {
    const e = foeByLink[linkTarget(f && f.foe).toLowerCase()];
    if (!e) { warnings.push("Scene " + (s.name || p.file) + " names a foe with no page: " + linkTarget(f && f.foe)); return; }
    combatants.push({ id: id + "--" + e.id.split("--").pop(), libId: e.id, type: "monster", side: "foe" });
  });
  Object.keys(speakers).forEach((nid) => {
    combatants.push({ id: id + "--" + nid.split("--").pop(), libId: nid, type: "npc", side: "npc" });
  });
  return {
    id: id, name: s.name || p.file.replace(/\.md$/, ""), prep: "", img: "", desc: "",
    mode: "roleplay", status: "active", beatDone: {}, entries: entries, log: [],
    att: {}, refs: [], combatants: combatants, ps: {}, hooks: [],
    battle: { round: 1, phase: "commit", locked: false, pLocked: false, spots: [], spotMode: "auto", manual: {}, order: [] },
    dis: { spent: [], base: null },
    loot: { lucky: {}, shards: {}, rolls: {}, notes: {} },
    order: s.order || 0, crucible: s.crucible === true, location: plain(s.location || "")
  };
}


/* ---------- writing: an adventure made in the tools becomes a folder ---------- */

// YAML for the frontmatter the format uses. Strings are always quoted, so nothing a LoreMaster
// typed can be read back as something else.
function q(s) { return '"' + String(s == null ? "" : s).replace(/\r?\n+/g, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'; }
function link(target, shown) { return "[[" + target + (shown && shown !== target ? "|" + shown : "") + "]]"; }
function yamlList(key, items) { return items.length ? key + ":\n" + items.map((x) => "  - " + x).join("\n") : key + ": []"; }
// A file name may not hold the characters a vault file name cannot, nor a link's [ ] | #.
function fileSafe(s) { return String(s || "").replace(/[\\/:*?"<>|#^\[\]]+/g, " ").replace(/\s+/g, " ").trim() || "Untitled"; }

const ATTRS = ["Precision", "Power", "Magic", "Evasion", "Durability", "Resistance", "Vigor", "Wit"];
const KIND_OUT = { readaloud: "readaloud", read: "readaloud", dialogue: "dialogue", beat: "beat", choice: "beat", crucible: "crucible",
  lorecheck: "lorecheck", check: "lorecheck", clue: "clue", secret: "secret", reminder: "reminder", quest: "quest", general: "general" };

function calloutLines(kind, title, body) {
  const out = ["> [!" + kind + "]" + (title ? " " + String(title).replace(/\r?\n+/g, " ").trim() : "")];
  String(body || "").replace(/\r/g, "").split("\n").forEach((ln) => { out.push(ln ? "> " + ln : ">"); });
  if (!String(body || "").trim()) out.length = 1;
  return out.join("\n");
}
// One beat as the vault writes it. A note with no title that is one plain paragraph stays a
// paragraph; anything else a paragraph could not hold whole goes in a callout.
function beatText(b, nameOf) {
  const kind = KIND_OUT[b.type || b.kind] || "general";
  const title = String(b.title || "").trim(), body = String(b.body || "").replace(/\r/g, "").trim();
  if (kind === "dialogue") {
    // the beat's own title when it already names the speaker, so its spelling stays the writer's
    const who = nameOf(b.speaker);
    return calloutLines("dialogue", (title && who && title.toLowerCase() === who.toLowerCase()) ? title : (who || title || "Someone"), body);
  }
  if (kind === "general") {
    if (title && !body) return "## " + title.replace(/\r?\n+/g, " ");
    const onePara = body && !/\n\s*\n/.test(body) && !body.split("\n").some((ln) => /^\s*(>|#)/.test(ln));
    if (!title && onePara) return body;
    return calloutLines("general", title, body);
  }
  return calloutLines(kind, title, body);
}

// adv: the adventure as the tools hold it (acts, sessions, scenes, entries or beats, combatants).
// library: its library records (foes and NPCs). taken: the names already used in the vault, in
// lower case, so no new file shares one. opts.folder writes into a folder of that name, and
// opts.names gives a scene or library entry (by id) the file name it already has. Returns the
// folder's name, its files, and how each library id maps to the id the vault will give it.
export function writeAdventure(adv, library, taken, opts) {
  taken = taken || new Set();
  opts = opts || {};
  const used = new Set();
  const names = opts.names || {};
  Object.keys(names).forEach((k) => used.add(String(names[k]).toLowerCase()));
  const uniq = (base, tag) => {
    let n = fileSafe(base), k = 2;
    if (taken.has(n.toLowerCase()) || used.has(n.toLowerCase())) n = fileSafe(base) + " (" + tag + ")";
    while (taken.has(n.toLowerCase()) || used.has(n.toLowerCase())) n = fileSafe(base) + " (" + tag + " " + (k++) + ")";
    used.add(n.toLowerCase());
    return n;
  };
  const title = String(adv.name || "Adventure").trim();
  const folder = opts.folder ? (used.add(String(opts.folder).toLowerCase()), String(opts.folder)) : uniq(title, "adventure");
  // the adventure keeps its own id, so the copy in the account and the vault stay one adventure
  const advId = adv.id != null && String(adv.id).trim() ? String(adv.id).trim() : (slug(title, 60) || "adventure");
  const lib = {}; (library || []).forEach((e) => { if (e && e.id != null) lib[String(e.id)] = e; });
  const scenesAll = [];
  (adv.acts || []).forEach((a) => (a.sessions || []).forEach((se) => (se.scenes || []).forEach((sc) => scenesAll.push({ a, se, sc }))));
  const multi = (adv.acts || []).length > 1 || (adv.acts || []).some((a) => (a.sessions || []).length > 1);

  // the foes and characters this adventure uses: on a scene, as a speaker, or kept for it
  const usedLib = {};
  const want = (id) => { if (id != null && lib[String(id)]) usedLib[String(id)] = lib[String(id)]; };
  scenesAll.forEach(({ sc }) => {
    (sc.combatants || []).forEach((c) => want(c && c.libId));
    (sc.entries || sc.beats || []).forEach((b) => want(b && b.speaker));
  });
  (library || []).forEach((e) => { if (e && e.campaignId != null && String(e.campaignId) === String(adv.id)) want(e.id); });
  const libIdMap = {}, fileOf = {}, slugsUsed = {};
  // an entry the vault already named keeps its id; any other takes one from its name
  const own = (e) => String(e.id).indexOf(advId + "--") === 0 ? String(e.id).slice(advId.length + 2) : "";
  Object.values(usedLib).forEach((e) => { if (own(e)) slugsUsed[own(e)] = 1; });
  Object.values(usedLib).forEach((e) => {
    let s = own(e);
    if (!s) { s = slug(e.name, 50) || "foe"; const base = s; let k = 2; while (slugsUsed[s]) s = base + "-" + (k++); }
    slugsUsed[s] = 1;
    libIdMap[String(e.id)] = advId + "--" + s;
    fileOf[String(e.id)] = names[String(e.id)] || uniq(e.name || "Unnamed", title);
    e._slug = s;
  });
  const nameOf = (id) => { const e = id != null ? lib[String(id)] : null; return e ? (e.name || "") : String(id || ""); };
  const files = {};

  // foes
  Object.values(usedLib).filter((e) => e.type !== "npc").forEach((e) => {
    const at = e.attrs || {};
    const kit = e;
    const acts = (kit.abilities || []).map((x) => [
      "  - name: " + q(x.name || ""), "    tier: " + (Number(x.tier) || 1), "    kind: " + q(x.kind || ""),
      "    points: " + (x.points != null && x.points !== "" ? Number(x.points) || 0 : "null"), "    targeting: " + q(x.targeting || ""),
      "    damage: " + q(x.damage || ""), "    effect: " + q(x.affliction || ""), "    text: " + q(x.desc || x.effect || "")].join("\n"));
    // the vault keeps a foe's React on its own line; the tools carry it at the end of the notes
    const rm = String(e.desc || "").replace(/\r/g, "").match(/^([\s\S]*?)(?:\n\s*\n|^)React: ([\s\S]+)$/);
    const desc = rm ? rm[1] : String(e.desc || ""), react = rm ? rm[2].replace(/\s+/g, " ").trim() : "";
    files["Foes/" + fileOf[String(e.id)] + ".md"] = ["---", "type: foe", "id: " + q(e._slug), "name: " + q(e.name || ""),
      "shatter_rating: " + q(e.sr || "Elite"), "build: " + q(e.build || ""), "vitality: " + (Number(e.maxVit) || 0),
      "attributes:", ATTRS.map((k) => "  " + k + ": " + (Number(at[k]) || 0)).join("\n"),
      "affliction: " + (e.sig ? q(link(e.sig)) : "null"), "stance: " + (e.stance ? q(e.stance) : "null"),
      yamlList("infusions", (kit.infusions || []).map((x) => q(link(x)))), yamlList("augmentations", (kit.augments || []).map((x) => q(link(x)))),
      acts.length ? "acts:\n" + acts.join("\n") : "acts: []"].concat(react ? ["react: " + q(react)] : [], ["loot: []", "---",
      "# " + (e.name || "Unnamed"), "", desc.trim(), ""]).join("\n");
  });
  // characters
  Object.values(usedLib).filter((e) => e.type === "npc").forEach((e) => {
    files["Characters/" + fileOf[String(e.id)] + ".md"] = ["---", "type: character", "id: " + q(e._slug), "name: " + q(e.name || ""),
      "role: " + q(e.role || ""), "lineage: " + q(""), "world: " + q(worldNameOf(adv)), "fate: " + q(""), "---",
      "# " + (e.name || "Unnamed"), "", String(e.desc || "").trim(), ""].join("\n");
  });
  // scenes
  const sceneLinks = [];
  scenesAll.forEach(({ a, se, sc }, i) => {
    const nm = String(sc.name || "Scene " + (i + 1)).trim();
    const file = names[String(sc.id)] || uniq(String(i + 1).padStart(2, "0") + " - " + nm, title);
    sceneLinks.push(q(link(file, nm)));
    const counts = {};
    (sc.combatants || []).forEach((c) => {
      if (!c || !c.libId || !usedLib[String(c.libId)] || usedLib[String(c.libId)].type === "npc") return;
      counts[String(c.libId)] = (counts[String(c.libId)] || 0) + 1;
    });
    const beats = sc.entries && sc.entries.length ? sc.entries : (sc.beats || []);
    const checks = beats.filter((b) => /^(lorecheck|check)$/.test(b.type || b.kind)).map((b) => {
      const m = String(b.title || "").match(/^\s*([A-Za-z]+)\s*:\s*(.*)$/);
      return m ? "  - skill: " + q(m[1]) + "\n    purpose: " + q(m[2]) : null;
    }).filter(Boolean);
    const crucible = typeof sc.crucible === "boolean" ? sc.crucible : (beats.some((b) => (b.type || b.kind) === "crucible") || Object.keys(counts).length > 0);
    const fm = ["---", "type: scene", "id: " + q(sc.id), "adventure: " + q(link(folder)), "order: " + (i + 1)];
    if (multi) fm.push("act: " + q(a.name || "Act"), "act_id: " + q(a.id), "session: " + q(se.name || "Session"), "session_id: " + q(se.id));
    fm.push("name: " + q(nm), "location: " + q(sc.location || ""), "crucible: " + crucible,
      Object.keys(counts).length ? "foes:\n" + Object.keys(counts).map((id) => "  - foe: " + q(link(fileOf[id])) + "\n    count: " + q(String(counts[id]))).join("\n") : "foes: []",
      "hazards: []", checks.length ? "checks:\n" + checks.join("\n") : "checks: []", "lore_points: 0", "teaches: []", "---");
    files["Scenes/" + file + ".md"] = fm.join("\n") + "\n" + beats.map((b) => beatText(b, nameOf)).join("\n\n") + "\n";
  });
  // the overview
  const foesL = Object.values(usedLib).filter((e) => e.type !== "npc").map((e) => q(link(fileOf[String(e.id)])));
  const charsL = Object.values(usedLib).filter((e) => e.type === "npc").map((e) => q(link(fileOf[String(e.id)])));
  files[folder + ".md"] = ["---", "type: adventure", "id: " + q(advId), "title: " + q(title), "world: " + q(worldNameOf(adv)),
    "level: " + (Number(adv.level) || 1), "fell_min: 3", "fell_max: 5",
    "length: " + q(!multi && adv.acts && adv.acts[0] && adv.acts[0].sessions && adv.acts[0].sessions[0] && adv.acts[0].sessions[0].name !== "Session 1" ? adv.acts[0].sessions[0].name : ""),
    "structure: " + (multi ? "acts" : "scenes"), "adventure_type: " + q(adv.type || (multi ? "story" : "tale")),
    "canon: false", "synced: true", "summary: " + q(adv.desc || ""),
    yamlList("scenes", sceneLinks), yamlList("characters", charsL), "locations: []", yamlList("foes", foesL), "---",
    "# " + title, "", String(adv.notes || "").trim(), ""].join("\n");
  Object.values(usedLib).forEach((e) => { delete e._slug; });
  return { folder: folder, advId: advId, files: files, libIdMap: libIdMap };
}


/* ---------- rewriting: a checked-out adventure saved back over its own folder ----------
   writeAdventure makes pages from nothing. A hand-written folder holds more than the tools
   carry (wikilinks in prose, frontmatter only the vault reads, a callout the tools fold into
   another kind), so saving over it rewrites only what the table changed: a page nobody touched
   comes back byte for byte, a beat nobody touched keeps its own lines, and a frontmatter key
   keeps its own lines unless its meaning changed. */

// The frontmatter keys the tools own, per page type. Every other key belongs to the vault and
// is never touched on a page that has it.
const OWNED = {
  adventure: ["id", "title", "world", "level", "length", "structure", "adventure_type", "synced", "summary", "scenes", "characters", "foes"],
  scene: ["id", "adventure", "order", "act", "act_id", "session", "session_id", "name", "location", "crucible", "foes"],
  foe: ["id", "name", "shatter_rating", "build", "vitality", "attributes", "affliction", "stance", "infusions", "augmentations", "acts", "react"],
  character: ["id", "name", "role"]
};
const LINKY = { scenes: 1, characters: 1, foes: 1, adventure: 1, foe: 1 };
export const CHECKOUT_KEYS = ["checked_out", "checked_out_at"];

function pageParts(text) {
  const m = String(text).match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)([\s\S]*)$/);
  return m ? { open: m[1], fm: m[2], close: m[3], body: m[4] } : null;
}
// Frontmatter as top-level key blocks, each with its own lines.
function fmBlocks(fm) {
  const out = [];
  String(fm).split(/\r?\n/).forEach((ln) => {
    const k = ln.match(/^([A-Za-z_][^:\s]*)\s*:/);
    if (k) out.push({ key: k[1], lines: [ln] });
    else if (out.length) out[out.length - 1].lines.push(ln);
    else out.push({ key: null, lines: [ln] });
  });
  return out;
}
function blockValue(b) { try { return parseYaml(b.lines.join("\n"))[b.key]; } catch (e) { return undefined; } }
function isEmpty(v) {
  return v == null || v === "" || v === 0 || v === false || (Array.isArray(v) && !v.length) || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);
}
// Two values mean the same thing to the reader. Only what the new value says is compared, so a
// key the vault adds inside an act or a list entry never counts as a change.
function sameValue(o, n, key) {
  if (isEmpty(n)) return isEmpty(o);
  if (Array.isArray(n)) return Array.isArray(o) && o.length === n.length && n.every((x, i) => sameValue(o[i], x, key));
  if (typeof n === "object") return !!o && typeof o === "object" && !Array.isArray(o) && Object.keys(n).every((k) => sameValue(o[k], n[k], k));
  if (o == null || typeof o === "object") return false;
  return LINKY[key] ? linkTarget(o).toLowerCase() === linkTarget(n).toLowerCase() : plain(String(o)).trim() === plain(String(n)).trim();
}
const targets = (list, k) => (Array.isArray(list) ? list : []).map((x) => linkTarget(k ? (x && x[k]) : x).toLowerCase()).filter(Boolean);
const sameSet = (a, b) => { const A = Array.from(new Set(a)).sort(), B = Array.from(new Set(b)).sort(); return A.join("\n") === B.join("\n"); };
// What the reader takes a key to be when a page leaves it out. A key the old page left out is
// only written when the new value says something else.
function readerDefault(type, key, fm, base) {
  if (key === "name" || key === "title") return base;
  if (key === "id") return slug(fm.name || fm.title || base, 60);
  if (key === "structure") return "scenes";
  if (key === "adventure_type") return fm.structure === "acts" ? "story" : "tale";
  if (key === "level") return 1;
  if (key === "shatter_rating") return "Elite";
  return null;
}
function headingSwap(body, oldName, newName) {
  if (!newName || String(oldName) === String(newName)) return body;
  return body.replace(/^# .*$/m, "# " + newName);
}
function bodyText(body) { return plain(String(body || "").replace(/^#\s.*$/m, "")).trim(); }

// One page: the old page's lines wherever the new page means the same.
function mergePage(type, oldText, newText, base, bodyFn, inFolder) {
  const o = pageParts(oldText), n = pageParts(newText);
  if (!o || !n) return newText;
  const ob = fmBlocks(o.fm), nb = fmBlocks(n.fm);
  const nBy = {}; nb.forEach((b) => { if (b.key) nBy[b.key] = b; });
  const own = OWNED[type] || [];
  const oldFm = splitPage(oldText).fm;
  const seen = {};
  const out = [];
  ob.forEach((b) => {
    if (b.key) seen[b.key] = 1;
    if (b.key && CHECKOUT_KEYS.indexOf(b.key) >= 0) return;
    const nbk = b.key && nBy[b.key];
    if (!nbk || own.indexOf(b.key) < 0) { out.push(b.lines.join("\n")); return; }
    const ov = blockValue(b), nv = blockValue(nbk);
    let same;
    if (type === "scene" && b.key === "foes") same = sameSet(targets(ov, "foe"), targets(nv, "foe"));
    else if (type === "adventure" && (b.key === "characters" || b.key === "foes")) same = sameSet(targets(ov).filter((t) => inFolder[t]), targets(nv));
    else same = sameValue(ov, nv, b.key);
    out.push((same ? b : nbk).lines.join("\n"));
  });
  nb.forEach((b) => {
    if (!b.key || seen[b.key] || own.indexOf(b.key) < 0 || CHECKOUT_KEYS.indexOf(b.key) >= 0) return;
    const nv = blockValue(b);
    if (isEmpty(nv)) return;
    const d = readerDefault(type, b.key, oldFm, base);
    if (d != null && sameValue(d, nv, b.key)) return;
    out.push(b.lines.join("\n"));
  });
  return o.open + out.join("\n") + o.close + bodyFn(o.body, n.body, oldFm, splitPage(newText).fm);
}

// A scene's body: every beat the table left alone keeps its own lines.
function mergeSceneBody(oldBody, newBody, sceneId, beats, nameOf) {
  const old = parseBeats(oldBody), ids = beatIds(old, sceneId);
  const byId = {}; old.forEach((b, i) => { byId[ids[i]] = b; });
  let kept = 0;
  const parts = beats.map((b) => {
    const o = byId[String(b.id)];
    const kind = (x) => KIND_OUT[x] || "general";
    if (o && kind(o.type) === kind(b.type || b.kind) && plain(o.title).trim() === String(b.title || "").trim()
      && plain(o.body).trim() === String(b.body || "").replace(/\r/g, "").trim()) {
      const who = (b.type || b.kind) === "dialogue" ? nameOf(b.speaker) : "";
      if (!who || who === String(b.speaker || "") || who.toLowerCase() === o.title.toLowerCase()) { kept++; return o.raw; }
    }
    return beatText(b, nameOf);
  });
  if (kept === beats.length && beats.length === old.length && parts.every((p, i) => p === old[i].raw)) return oldBody;
  const head = []; const lines = String(oldBody).split(/\r?\n/);
  for (let i = 0; i < lines.length && (/^#\s/.test(lines[i]) || lines[i].trim() === ""); i++) if (/^#\s/.test(lines[i])) head.push(lines[i]);
  return (head.length ? head.join("\n") + "\n\n" : "") + parts.join("\n\n") + "\n";
}

// adv and library as writeAdventure takes them; oldFiles: the folder as it stands in the vault
// (path -> text); folder: its name. Returns the files to write (only those that changed), the
// paths to delete, the folder as it will stand, and the library id map.
export function rewriteAdventure(adv, library, oldFiles, folder, taken) {
  const advId = String(adv.id);
  const pre = advId + "--";
  // every page the old folder has, by the id the reader gives it
  const names = {}, pageOf = {};
  const pagesBy = (dir, type) => pagesIn(oldFiles, dir).filter((p) => p.fm.type === type);
  pagesBy("Scenes", "scene").forEach((p) => {
    const id = p.fm.id ? String(p.fm.id) : pre + slug(p.fm.name, 60);
    names[id] = p.file.replace(/\.md$/, ""); pageOf["Scenes/" + p.file] = id;
  });
  pagesBy("Foes", "foe").concat(pagesBy("Characters", "character")).forEach((p) => {
    const id = withPre(pre, p.fm.id || slug(p.fm.name, 60));
    names[id] = p.file.replace(/\.md$/, "");
  });
  const w = writeAdventure(adv, library, taken, { folder: folder, names: names });
  const lib = {}; (library || []).forEach((e) => { if (e && e.id != null) lib[String(e.id)] = e; });
  const nameOf = (id) => { const e = id != null ? lib[String(id)] : null; return e ? (e.name || "") : String(id || ""); };
  const sceneOf = {};
  (adv.acts || []).forEach((a) => (a.sessions || []).forEach((se) => (se.scenes || []).forEach((sc) => { sceneOf[String(sc.id)] = sc; })));

  const inFolder = {};
  Object.keys(oldFiles).forEach((p) => { inFolder[p.split("/").pop().replace(/\.md$/, "").toLowerCase()] = 1; });
  const files = {}, out = {};
  Object.keys(w.files).forEach((path) => {
    const now = w.files[path], was = oldFiles[path];
    if (was === undefined) { out[path] = now; return; }
    const base = path.split("/").pop().replace(/\.md$/, "");
    const type = splitPage(now).fm.type;
    let text;
    if (type === "scene") {
      const sc = sceneOf[pageOf[path] || ""] || {};
      const beats = sc.entries && sc.entries.length ? sc.entries : (sc.beats || []);
      text = mergePage("scene", was, now, base, (ob) => mergeSceneBody(ob, "", String(sc.id), beats, nameOf));
    } else {
      text = mergePage(type, was, now, base, (ob, nb, ofm, nfm) => {
        const nameKey = type === "adventure" ? "title" : "name";
        return bodyText(ob) === bodyText(nb) ? headingSwap(ob, ofm[nameKey], nfm[nameKey]) : nb;
      }, inFolder);
      if (type === "adventure") {
        // a character or foe the overview links to without a page in the folder stays linked
        text = keepOutsideLinks(text, was, inFolder);
      }
    }
    out[path] = text;
  });
  Object.keys(out).forEach((p) => { if (out[p] !== oldFiles[p]) files[p] = out[p]; });
  // pages the adventure no longer has: scenes, foes and characters the reader would have read
  const deletes = [];
  [["Scenes", "scene"], ["Foes", "foe"], ["Characters", "character"]].forEach(([dir, type]) => {
    pagesBy(dir, type).forEach((p) => { const path = dir + "/" + p.file; if (out[path] === undefined) deletes.push(path); });
  });
  const result = Object.assign({}, oldFiles);
  deletes.forEach((p) => { delete result[p]; });
  Object.assign(result, files);
  return { folder: folder, advId: w.advId, files: files, deletes: deletes, all: result, libIdMap: w.libIdMap };
}

// The overview's characters and foes lists, with every link the old page had to a page outside
// this folder added back, so a link like [[Malachar]] is never lost.
function keepOutsideLinks(text, oldText, inFolder) {
  const ofm = splitPage(oldText).fm, parts = pageParts(text);
  if (!parts) return text;
  const blocks = fmBlocks(parts.fm).map((b) => {
    if (b.key !== "characters" && b.key !== "foes") return b.lines.join("\n");
    const now = blockValue(b) || [];
    const have = targets(now);
    const extra = (Array.isArray(ofm[b.key]) ? ofm[b.key] : []).filter((x) => !inFolder[linkTarget(x).toLowerCase()] && have.indexOf(linkTarget(x).toLowerCase()) < 0);
    if (!extra.length) return b.lines.join("\n");
    return yamlList(b.key, now.map((x) => q(x)).concat(extra.map((x) => q(x))));
  });
  return parts.open + blocks.join("\n") + parts.close + parts.body;
}

// The overview, marked or unmarked as checked out to ThreadSpire.
export function markCheckedOut(text, at) {
  const p = pageParts(clearCheckedOut(text));
  if (!p) return text;
  return p.open + p.fm + "\nchecked_out: true\nchecked_out_at: " + q(new Date(at || Date.now()).toISOString()) + p.close + p.body;
}
export function clearCheckedOut(text) {
  const p = pageParts(text);
  if (!p) return text;
  return p.open + fmBlocks(p.fm).filter((b) => CHECKOUT_KEYS.indexOf(b.key) < 0).map((b) => b.lines.join("\n")).join("\n") + p.close + p.body;
}
