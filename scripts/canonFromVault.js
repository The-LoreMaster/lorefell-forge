// scripts/canonFromVault.js
// One-way: reads the hidden canon source docs in the vault and writes the CMS seed.
// The vault is never written to. Portraits are never emitted, so the merge in
// upsertItems.js preserves images uploaded in Wix.
//
// Usage:
//   VAULT_DIR=../lorefell-fellguide node scripts/canonFromVault.js
//   node scripts/canonFromVault.js --vault /path/to/lorefell-fellguide
//
// Then: npm run apply   (pushes the seed to Wix)

const fs = require("fs");
const path = require("path");

function vaultDir() {
  const i = process.argv.indexOf("--vault");
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  if (process.env.VAULT_DIR) return process.env.VAULT_DIR;
  console.error("Set the vault path: VAULT_DIR=../lorefell-fellguide or --vault <path>");
  process.exit(1);
}

function parseBlocks(text) {
  const blocks = [];
  let cur = null;
  text.split(/\r?\n/).forEach(function (ln) {
    const h = ln.match(/^##\s+(.*\S)\s*$/);
    if (h) { cur = { name: h[1].trim(), f: {}, Branch: [], Crown: [] }; blocks.push(cur); return; }
    if (!cur) return;
    const m = ln.match(/^([A-Za-z][A-Za-z ]*?):\s*(.*)$/);
    if (!m) return;
    const label = m[1].trim(), val = m[2].trim();
    if (label === "Branch" || label === "Crown") { if (val) cur[label].push(val); }
    else cur.f[label] = val;
  });
  return blocks;
}

function read(dir, file) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) { console.error("missing source doc: " + p); process.exit(1); }
  return parseBlocks(fs.readFileSync(p, "utf8"));
}

function writeSeed(name, keyField, items) {
  const out = { collection: name, keyField: keyField, jsonFields: [], items: items };
  const dest = path.resolve(__dirname, "..", "schemas", "seed", name + ".json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 1) + "\n");
  console.log("wrote " + dest + " (" + items.length + " items)");
}

(function () {
  const dir = path.join(vaultDir(), "_Canon", "collections");

  const lb = read(dir, "Lorebounds.md").map(function (b, i) {
    return {
      name: b.name, world: b.f.World || "", role: b.f.Role || "",
      archetype: b.f.Archetype || "", aspectName: b.f.Aspect || "", initial: b.f.Initial || "",
      branch1: b.Branch[0] || "", branch2: b.Branch[1] || "",
      crown1: b.Crown[0] || "", crown2: b.Crown[1] || "", displayOrder: (i + 1) * 10
    };
  });
  writeSeed("Lorebounds", "name", lb);

  const inf = read(dir, "Infusions.md").map(function (b, i) {
    return { name: b.name, effect: b.f.Effect || "", attribute: b.f.Attribute || "", lore: b.f.Lore || "", displayOrder: (i + 1) * 10 };
  });
  writeSeed("Infusions", "name", inf);

  const aug = read(dir, "Augmentations.md").map(function (b, i) {
    return { name: b.name, effect: b.f.Effect || "", domain: b.f.Domain || "", core: /^y/i.test(b.f.Core || ""), lore: b.f.Lore || "", displayOrder: (i + 1) * 10 };
  });
  writeSeed("Augmentations", "name", aug);
})();
