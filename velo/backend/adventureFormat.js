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
      i++;
      while (i < lines.length && /^>/.test(lines[i])) { out.push(lines[i].replace(/^>\s?/, "")); i++; }
      beats.push({ type: KINDS[type] || "general", callout: type, title: co[2].trim(), body: out.join("\n").trim() });
      continue;
    }
    const h = ln.match(/^#{2,6}\s+(.*\S)\s*$/);
    if (h) { beats.push({ type: "general", callout: "heading", title: h[1], body: "" }); i++; continue; }
    if (/^#\s/.test(ln) || ln.trim() === "") { i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^>/.test(lines[i]) && !/^#/.test(lines[i])) { para.push(lines[i]); i++; }
    beats.push({ type: "general", callout: "note", title: "", body: para.join("\n").trim() });
  }
  return beats;
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
  return {
    id: id, type: "monster", name: f.name || p.file.replace(/\.md$/, ""),
    desc: notes.filter(Boolean).join("\n\n"), img: "", origin: "",
    sr: f.shatter_rating || "Elite", build: f.build || "", stance: f.stance || "",
    maxVit: Number(f.vitality) || 0,
    attrs: f.attributes || {},
    sig: linkTarget(f.affliction || ""),
    infusions: (f.infusions || []).map(linkTarget),
    augments: (f.augmentations || []).map(linkTarget),
    inv: [],
    abilities: (f.acts || []).map((a) => ({
      id: id + "--" + slug(a.name, 40), name: a.name || "", tier: Number(a.tier) || 1, use: "Act",
      desc: plain(a.text || ""), effect: plain(a.text || ""), source: "mine",
      kind: a.kind || "", points: a.points != null ? a.points : null, targeting: a.targeting || "", affliction: a.effect || ""
    })),
    source: "vault"
  };
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
  const used = {};
  const speakers = {};
  const entries = parseBeats(p.body).map((b) => {
    let speaker = "";
    if (b.type === "dialogue") {
      const who = byName[b.title.toLowerCase()];
      speaker = who ? who.id : b.title;
      if (who && who.type === "npc") speakers[who.id] = who;
    }
    // the id is the scene, the kind and the beat's own words: stable across rebuilds, and an
    // edit to one beat leaves every other beat's id alone
    const label = b.type === "dialogue" ? b.title + " " + (b.body.match(/^\*([^*]+)\*/) || [, ""])[1] : (b.title || b.body);
    let key = id + "--" + (b.callout === "heading" ? "h" : b.type) + "-" + (slug(label, 48) || "beat");
    used[key] = (used[key] || 0) + 1;
    if (used[key] > 1) key += "-" + used[key];
    return { id: key, type: b.type, title: plain(b.title), body: plain(b.body), speaker: speaker, handle: "", img: "", pinned: false, open: false };
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
// lower case, so no new file shares one. Returns the folder's name, its files, and how each
// library id maps to the id the vault will give it.
export function writeAdventure(adv, library, taken) {
  taken = taken || new Set();
  const used = new Set();
  const uniq = (base, tag) => {
    let n = fileSafe(base), k = 2;
    if (taken.has(n.toLowerCase()) || used.has(n.toLowerCase())) n = fileSafe(base) + " (" + tag + ")";
    while (taken.has(n.toLowerCase()) || used.has(n.toLowerCase())) n = fileSafe(base) + " (" + tag + " " + (k++) + ")";
    used.add(n.toLowerCase());
    return n;
  };
  const title = String(adv.name || "Adventure").trim();
  const folder = uniq(title, "adventure");
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
  Object.values(usedLib).forEach((e) => {
    let s = slug(e.name, 50) || "foe"; const base = s; let k = 2;
    while (slugsUsed[s]) s = base + "-" + (k++);
    slugsUsed[s] = 1;
    libIdMap[String(e.id)] = advId + "--" + s;
    fileOf[String(e.id)] = uniq(e.name || "Unnamed", title);
    e._slug = s;
  });
  const nameOf = (id) => { const e = id != null ? lib[String(id)] : null; return e ? (e.name || "") : String(id || ""); };
  const files = {};

  // foes
  Object.values(usedLib).filter((e) => e.type !== "npc").forEach((e) => {
    const at = e.attrs || {};
    const acts = (e.abilities || []).map((x) => [
      "  - name: " + q(x.name || ""), "    tier: " + (Number(x.tier) || 1), "    kind: " + q(x.kind || ""),
      "    points: " + (x.points != null && x.points !== "" ? Number(x.points) || 0 : "null"), "    targeting: " + q(x.targeting || ""),
      "    damage: " + q(""), "    effect: " + q(x.affliction || ""), "    text: " + q(x.desc || x.effect || "")].join("\n"));
    files["Foes/" + fileOf[String(e.id)] + ".md"] = ["---", "type: foe", "id: " + q(e._slug), "name: " + q(e.name || ""),
      "shatter_rating: " + q(e.sr || "Elite"), "build: " + q(e.build || ""), "vitality: " + (Number(e.maxVit) || 0),
      "attributes:", ATTRS.map((k) => "  " + k + ": " + (Number(at[k]) || 0)).join("\n"),
      "affliction: " + (e.sig ? q(link(e.sig)) : "null"), "stance: " + (e.stance ? q(e.stance) : "null"),
      yamlList("infusions", (e.infusions || []).map((x) => q(link(x)))), yamlList("augmentations", (e.augments || []).map((x) => q(link(x)))),
      acts.length ? "acts:\n" + acts.join("\n") : "acts: []", "loot: []", "---",
      "# " + (e.name || "Unnamed"), "", String(e.desc || "").trim(), ""].join("\n");
  });
  // characters
  Object.values(usedLib).filter((e) => e.type === "npc").forEach((e) => {
    files["Characters/" + fileOf[String(e.id)] + ".md"] = ["---", "type: character", "id: " + q(e._slug), "name: " + q(e.name || ""),
      "role: " + q(e.role || ""), "lineage: " + q(""), "world: " + q(adv.world || ""), "fate: " + q(""), "---",
      "# " + (e.name || "Unnamed"), "", String(e.desc || "").trim(), ""].join("\n");
  });
  // scenes
  const sceneLinks = [];
  scenesAll.forEach(({ a, se, sc }, i) => {
    const nm = String(sc.name || "Scene " + (i + 1)).trim();
    const file = uniq(String(i + 1).padStart(2, "0") + " - " + nm, title);
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
    const crucible = beats.some((b) => (b.type || b.kind) === "crucible") || Object.keys(counts).length > 0;
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
  files[folder + ".md"] = ["---", "type: adventure", "id: " + q(advId), "title: " + q(title), "world: " + q(adv.world || ""),
    "level: " + (Number(adv.level) || 1), "fell_min: 3", "fell_max: 5",
    "length: " + q(!multi && adv.acts && adv.acts[0] && adv.acts[0].sessions && adv.acts[0].sessions[0] && adv.acts[0].sessions[0].name !== "Session 1" ? adv.acts[0].sessions[0].name : ""),
    "structure: " + (multi ? "acts" : "scenes"), "adventure_type: " + q(adv.type || (multi ? "story" : "tale")),
    "canon: false", "synced: true", "summary: " + q(adv.desc || ""),
    yamlList("scenes", sceneLinks), yamlList("characters", charsL), "locations: []", yamlList("foes", foesL), "---",
    "# " + title, "", String(adv.notes || "").trim(), ""].join("\n");
  Object.values(usedLib).forEach((e) => { delete e._slug; });
  return { folder: folder, advId: advId, files: files, libIdMap: libIdMap };
}
