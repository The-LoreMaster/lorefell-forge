// scripts/sagaCanonFromVault.js
// One-way: reads what the SagaForge writes from out of the vault and writes it into
// velo/backend/sagaCanon.js, a plain data module the SagaForge backend reads. The vault is never
// written to. Run it whenever the house rules, the format, canon, a world or a lineage changes:
//
//   node scripts/sagaCanonFromVault.js --vault ../lorefell-fellguide
//   node scripts/sagaCanonFromVault.js --vault ../lorefell-fellguide --check   (fails if stale)
//
// The worked example is The Stone Warren, the adventure the SagaForge's rules were learned on,
// kept in threadspire/tests/fixtures/Adventures.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "velo", "backend", "sagaCanon.js");
const EXAMPLE = path.join(ROOT, "threadspire", "tests", "fixtures", "Adventures", "The Stone Warren");

function vaultDir() {
  const i = process.argv.indexOf("--vault");
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  if (process.env.VAULT_DIR) return process.env.VAULT_DIR;
  console.error("Set the vault path: --vault ../lorefell-fellguide or VAULT_DIR");
  process.exit(1);
}

const LORE = "The FellGuide/The FellGuide/The Lore (Contains Spoilers)";

function read(vault, rel) {
  const p = path.join(vault, rel);
  if (!fs.existsSync(p)) { console.error("missing: " + rel); process.exit(1); }
  return fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
}
// Obsidian embeds and image lines carry nothing the writer can use.
function clean(text) {
  return text.replace(/^!\[\[[^\]]*\]\]\s*$/gm, "").replace(/^!\[[^\]]*\]\([^)]*\)\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}
function names(vault, rel) {
  const dir = path.join(vault, rel);
  const out = [];
  (function walk(d) {
    fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".md")) out.push(e.name.slice(0, -3));
    });
  })(dir);
  // A folder's own index page carries the folder's name and is not an entry.
  const folders = new Set();
  (function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { if (e.isDirectory()) { folders.add(e.name); walk(path.join(d, e.name)); } }); })(dir);
  folders.add(path.basename(dir));
  return out.filter((n) => !folders.has(n)).sort();
}
// Every page name in the vault outside Archive, so the scan can tell a real link from a made-up one.
function allPages(vault) {
  const out = new Set();
  (function walk(d) {
    fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      if (e.name.startsWith(".") || e.name === "Archive" || e.name === "Adventures") return;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".md")) out.add(e.name.slice(0, -3));
    });
  })(vault);
  return Array.from(out).sort();
}
function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const o = {};
  if (m) m[1].split("\n").forEach((ln) => { const k = ln.match(/^([a-z_]+):\s*(.*)$/); if (k) o[k[1]] = k[2].replace(/^["']|["']$/g, ""); });
  return o;
}
function atGlance(text, label) {
  const m = text.match(new RegExp("\\*\\*" + label + ":\\*\\*\\s*(.+)"));
  return m ? m[1].trim() : "";
}

function build(vault) {
  const house = {
    writing: clean(read(vault, "_Canon/ADVENTURE_WRITING.md")),
    format: clean(read(vault, "_Canon/ADVENTURE_FORMAT.md")),
    style: clean(read(vault, "_Canon/STYLE.md")),
    canon: clean(read(vault, "_Canon/CANON.md")),
    crucibles: clean(read(vault, "The LoreVault/Running the Game/Building Crucibles.md")),
    makingTheCall: clean(read(vault, "The LoreVault/Running the Game/Making the Call.md")),
    shaping: clean(read(vault, "The LoreVault/Telling the Story/Shaping an Adventure.md")),
    storySoFar: clean(read(vault, LORE + "/The Story So Far.md"))
  };

  // Which worlds already have a played History, so a rolled adventure can prefer one without.
  const histDir = path.join(vault, LORE, "The Histories");
  const histories = [];
  fs.readdirSync(histDir, { withFileTypes: true }).forEach((e) => {
    if (!e.isDirectory()) return;
    const main = path.join(histDir, e.name, e.name + ".md");
    if (!fs.existsSync(main)) return;
    const fm = frontmatter(fs.readFileSync(main, "utf8"));
    if (fm.world) histories.push({ name: e.name, world: fm.world });
  });

  const worldDir = path.join(vault, "The LoreVault/The Worlds");
  const worlds = fs.readdirSync(worldDir).filter((f) => f.endsWith(".md") && f !== "The Worlds.md").sort().map((f) => {
    const name = f.slice(0, -3);
    const vaultPage = clean(read(vault, "The LoreVault/The Worlds/" + f));
    const sp = path.join(vault, LORE, "The Sphere/Stratums", f);
    const sp2 = path.join(vault, LORE, "The Sphere/Stratums/Other", f);
    const stratum = fs.existsSync(sp) ? clean(fs.readFileSync(sp, "utf8")) : fs.existsSync(sp2) ? clean(fs.readFileSync(sp2, "utf8")) : "";
    const sub = (vaultPage.match(/^##\s*\*(.+)\*\s*$/m) || [])[1] || "";
    return {
      name: name,
      line: sub,
      lineage: atGlance(vaultPage, "Lineage").replace(/^the\s+/i, ""),
      brand: atGlance(vaultPage, "Brand"),
      histories: histories.filter((h) => h.world === name).map((h) => h.name),
      vault: vaultPage,
      stratum: stratum
    };
  });

  const linDir = "The FellGuide/The FellGuide/The Characters/The Lineages";
  const lineages = names(vault, linDir).map((n) => {
    const t = clean(read(vault, linDir + "/" + n + ".md"));
    const first = (t.split("\n\n").find((p) => p && !p.startsWith("#")) || "").replace(/\s+/g, " ").slice(0, 400);
    return { name: n.replace(/^The\s+/, ""), line: first };
  });

  const lists = {
    infusions: names(vault, "The FellGuide/The FellGuide/The Arsenal/Weapons/Infusions"),
    augmentations: names(vault, "The FellGuide/The FellGuide/The Arsenal/Armor/Augmentations"),
    afflictions: names(vault, "The FellGuide/The FellGuide/The Combat/The Afflictions/Afflictions"),
    combatEffects: names(vault, "The FellGuide/The FellGuide/The Combat/The Afflictions/Combat Effects"),
    skills: "Trickery Presence Finesse Might Movement Bearing Weaving Spirit Creation Endurance Renewal Resolve Vigilance Logic Lore Reflex Elusion Poise Guard Temper Anchor Conviction Sanctum Resonance".split(" "),
    stances: ["Shrouded", "Stalwart", "Vestments"],
    builds: ["Reaver", "Adept", "Scourge", "Stalker", "Duelist", "Inquisitor", "Berserker", "Juggernaut", "Golem", "Wisp", "Idol", "Maleficar", "Shade", "Mirage", "Bulwark"],
    pages: allPages(vault),
    links: ["Making the Call", "The Fell Who Forgot", "Secrets and Lore Drops", "Treasure Phase", "Running Pandemonium", "Building Crucibles", "Survival"]
  };

  const ex = (rel) => fs.readFileSync(path.join(EXAMPLE, rel), "utf8").replace(/\r\n/g, "\n").trim();
  const example = {
    overview: ex("The Stone Warren.md"),
    scene: ex("Scenes/03 - The Larders.md"),
    fight: ex("Scenes/05 - Down the Shaft.md"),
    foe: ex("Foes/The Flat-Eyed Felionis.md"),
    character: ex("Characters/Old Furze.md")
  };

  return "// Generated by scripts/sagaCanonFromVault.js from the vault. Do not edit by hand.\n" +
    "// The house rules, canon, the worlds and lineages, and the worked example the SagaForge writes from.\n\n" +
    "export const HOUSE = " + JSON.stringify(house, null, 1) + ";\n\n" +
    "export const WORLDS = " + JSON.stringify(worlds, null, 1) + ";\n\n" +
    "export const LINEAGES = " + JSON.stringify(lineages, null, 1) + ";\n\n" +
    "export const LISTS = " + JSON.stringify(lists, null, 1) + ";\n\n" +
    "export const EXAMPLE = " + JSON.stringify(example, null, 1) + ";\n";
}

if (require.main === module) {
  const text = build(vaultDir());
  if (process.argv.includes("--check")) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (cur !== text) { console.error("velo/backend/sagaCanon.js is stale. Run: node scripts/sagaCanonFromVault.js --vault ../lorefell-fellguide"); process.exit(1); }
    console.log("sagaCanon: up to date");
  } else {
    fs.writeFileSync(OUT, text);
    console.log("wrote " + OUT + " (" + Math.round(text.length / 1024) + " KB)");
  }
}

module.exports = { build };
