// scripts/adventureFromVault.js
// One-way: reads one adventure from the vault's Adventures/ folder, written to
// _Canon/ADVENTURE_FORMAT.md, and builds a lorefell-adventure-pack-1 pack, the format
// ThreadSpire and FateWell import. The vault is never written to.
//
// Every id comes from the vault (the adventure, its scenes, beats, foes and characters), so
// building the same adventure again gives the same ids. That is what lets a synced adventure
// be updated in place instead of landing as a second copy.
//
// Usage:
//   node scripts/adventureFromVault.js --vault ../lorefell-fellguide --adventure "The Broken Bloodline" [--out pack.json]
//   VAULT_DIR=../lorefell-fellguide node scripts/adventureFromVault.js --adventure "The Broken Bloodline"
//
// --built-at <ms> fixes the build time, for a pack kept as a test fixture.
//
// Without --out the pack is written to stdout.

const fs = require("fs");
const path = require("path");

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
function parseYaml(text) {
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

function splitPage(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: text };
  return { fm: parseYaml(m[1]), body: m[2] };
}

/* ---------- text ---------- */
function linkTarget(l) { return String(l || "").replace(/^\[\[|\]\]$/g, "").split("|")[0].split("#")[0].split("/").pop().trim(); }
function plain(text) {
  return String(text || "")
    .replace(/!\[\[[^\]]*\]\]/g, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, (_, t) => t.split("#")[0].split("/").pop());
}
function slug(s, n) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, n || 40).replace(/-$/, "");
}

const KINDS = { readaloud: "readaloud", dialogue: "dialogue", beat: "beat", choice: "beat", crucible: "crucible",
  lorecheck: "lorecheck", clue: "clue", secret: "secret", reminder: "reminder", quest: "quest" };

/* A scene body becomes beats, one per callout, heading or paragraph, in reading order. */
function parseBeats(body) {
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

/* ---------- the adventure ---------- */
function readPage(file) { return splitPage(fs.readFileSync(file, "utf8")); }
function pagesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort().map((f) => Object.assign({ file: f }, readPage(path.join(dir, f))));
}

function buildPack(advDir, opts) {
  opts = opts || {};
  const name = path.basename(advDir);
  const overview = readPage(path.join(advDir, name + ".md"));
  const A = overview.fm;
  if (A.type !== "adventure") throw new Error(name + ".md is not type: adventure");
  const advId = A.id || slug(A.title || name, 60);
  const pre = advId + "--";
  const warnings = [];

  // foes and characters become library records with ids taken from the vault
  const foes = pagesIn(path.join(advDir, "Foes")).filter((p) => p.fm.type === "foe").map((p) => foeRecord(p, pre));
  const npcs = pagesIn(path.join(advDir, "Characters")).filter((p) => p.fm.type === "character").map((p) => npcRecord(p, pre));
  const byName = {};
  foes.concat(npcs).forEach((e) => { byName[e.name.toLowerCase()] = e; });
  const foeByLink = {};
  pagesIn(path.join(advDir, "Foes")).forEach((p, k) => { foeByLink[p.file.replace(/\.md$/, "").toLowerCase()] = foes[k]; });
  (A.characters || []).forEach((l) => {
    if (!byName[linkTarget(l).toLowerCase()]) warnings.push("Character " + linkTarget(l) + " has no page in Characters/, so it is left out.");
  });

  // scenes, in the order the overview lists them
  const scenePages = {};
  pagesIn(path.join(advDir, "Scenes")).forEach((p) => { scenePages[p.file.replace(/\.md$/, "").toLowerCase()] = p; });
  const order = (A.scenes || []).map((l) => scenePages[linkTarget(l).toLowerCase()]).filter(Boolean);
  const scenes = (order.length ? order : Object.values(scenePages).sort((a, b) => (a.fm.order || 0) - (b.fm.order || 0)))
    .map((p) => sceneRecord(p, pre, foeByLink, byName, warnings));

  const actId = advId + "--act-1", sesId = advId + "--session-1";
  const node = (id, nm) => ({ id: id, name: nm, notes: "", img: "", desc: "", entries: [], manualRefs: [] });
  const campaign = Object.assign(node(advId, A.title || name), {
    type: A.structure === "acts" ? "story" : "tale",
    desc: plain(A.summary || ""),
    notes: plain(overview.body.replace(/^#\s.*$/m, "")).trim(),
    players: [],
    world: A.world || "",
    level: A.level || 1,
    synced: A.synced === true,
    vault: { path: "Adventures/" + name, id: advId },
    acts: [Object.assign(node(actId, A.title || name), { implicit: true,
      sessions: [Object.assign(node(sesId, A.length || "Session 1"), { scenes: scenes })] })]
  });
  if (A.structure === "acts") warnings.push("This adventure uses acts. The converter builds scenes-only adventures for now, so every scene sits in one act and one session.");

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
  const id = pre + (f.id || slug(f.name, 60));
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
    id: pre + (c.id || slug(c.name, 60)), type: "npc", name: c.name || p.file.replace(/\.md$/, ""),
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

module.exports = { buildPack, parseYaml, parseBeats, plain };

if (require.main === module) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
  const vault = arg("--vault") || process.env.VAULT_DIR;
  const adv = arg("--adventure");
  if (!vault || !adv) {
    console.error('Usage: node scripts/adventureFromVault.js --vault <path> --adventure "<Adventure Name>" [--out pack.json]');
    process.exit(1);
  }
  const at = arg("--built-at");
  const r = buildPack(path.join(vault, "Adventures", adv), { builtAt: at != null ? Number(at) : undefined });
  r.warnings.forEach((w) => console.error("note: " + w));
  const text = JSON.stringify(r.pack, null, 2) + "\n";
  const out = arg("--out");
  if (out) { fs.writeFileSync(out, text); console.error("Wrote " + out); } else process.stdout.write(text);
}
