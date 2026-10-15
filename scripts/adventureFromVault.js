// scripts/adventureFromVault.js
// One-way: reads one adventure from the vault's Adventures/ folder, written to
// _Canon/ADVENTURE_FORMAT.md, and builds a lorefell-adventure-pack-1 pack, the format
// ThreadSpire and FateWell import. The vault is never written to. The reading itself lives in
// velo/backend/adventureFormat.js, which the backend also uses to write an adventure back to the
// vault, so the two can never drift.
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
const { readAdventure, parseYaml, parseBeats, plain } = require("../velo/backend/adventureFormat.js");

// Every page in an adventure folder, as path -> text, the shape readAdventure takes.
function folderFiles(advDir) {
  const files = {};
  (function walk(dir, rel) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
      const r = rel ? rel + "/" + d.name : d.name;
      if (d.isDirectory()) walk(path.join(dir, d.name), r);
      else if (d.name.endsWith(".md")) files[r] = fs.readFileSync(path.join(dir, d.name), "utf8");
    });
  })(advDir, "");
  return files;
}

function buildPack(advDir, opts) {
  return readAdventure(folderFiles(advDir), path.basename(advDir), opts);
}

module.exports = { buildPack, folderFiles, parseYaml, parseBeats, plain };

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
