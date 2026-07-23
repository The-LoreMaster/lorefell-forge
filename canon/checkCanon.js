#!/usr/bin/env node
// canon/checkCanon.js
// Canon drift gate (v1). Three independent axes, driven by canon/canon.map.json:
//
//   Axis 1  generated staleness  - re-run a generator; fail if its committed output differs
//                                   (source changed without a rebuild, or output hand-edited).
//                                   v1 gates ONLY the build.js rules pipeline; genCanon is
//                                   excluded (see CANON_SOURCES.md).
//   Axis 2  docs <-> embeds       - every embeds/<name>.html must byte-match docs/<name>.html.
//   Axis 3  manual co-change      - for each concept, if the push touches SOME but not ALL of
//                                   its sibling blocks, fail. Differential: it only ever reads
//                                   the current diff, so pre-existing drift never trips it.
//
// Each concept-bearing file is policed by exactly one axis (the map enforces this by listing it
// under exactly one of `generated` / `manual`).
//
// Usage:
//   node canon/checkCanon.js [baseRef]
//   CANON_BASE=<ref> node canon/checkCanon.js
// baseRef defaults to $CANON_BASE, else origin/main, else HEAD~1. Axis 3 compares baseRef..worktree.
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'canon', 'canon.map.json'), 'utf8'));

// git via execFileSync (no shell) so refspecs like HEAD^{commit} and --format=%B survive on Windows cmd.exe.
function git(args) { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }); }
function gitOk(args) { try { git(args); return true; } catch (e) { return false; } }
function sh(cmd) { return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }); }
function read(rel) { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (e) { return null; } }
function nl(s) { return s == null ? s : s.replace(/\r/g, ''); } // normalize line endings for content compares

const problems = [];
const notes = [];
function fail(msg) { problems.push(msg); }

/* ---------- base ref for the differential (axis 3) ---------- */
function resolveBase() {
  const explicit = process.argv[2] || process.env.CANON_BASE;
  const candidates = [explicit, 'origin/main', 'HEAD~1'].filter(Boolean);
  for (const c of candidates) if (gitOk(['rev-parse', '--verify', '--quiet', c + '^{commit}'])) return c;
  return null;
}

/* ---------- parse `git diff --unified=0` into per-file changed line ranges (NEW-file coords) ---------- */
function changedRanges(base) {
  const out = git(['diff', '--unified=0', base, '--']);
  const byFile = {};
  let cur = null;
  out.split('\n').forEach((ln) => {
    const f = ln.match(/^\+\+\+ b\/(.*)$/);
    if (f) { cur = f[1] === '/dev/null' ? null : f[1]; if (cur && !byFile[cur]) byFile[cur] = []; return; }
    const h = ln.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (h && cur) {
      const start = parseInt(h[1], 10);
      const count = h[2] === undefined ? 1 : parseInt(h[2], 10);
      // count 0 = pure deletion at `start`; treat as touching that line.
      byFile[cur].push([start, start + Math.max(count, 1) - 1]);
    }
  });
  return byFile;
}

/* ---------- locate a member's block range [start,end] (1-based) in the current worktree ---------- */
function blockRange(member) {
  const src = read(member.file);
  if (src == null) return { missing: true };
  if (!member.tag && !member.anchorStart) return { whole: true }; // whole-file member (e.g. a seed JSON)
  const lines = src.split('\n');
  const startNeedle = member.tag ? 'CANON:' + member.tag + ' start' : member.anchorStart;
  const endNeedle = member.tag ? 'CANON:' + member.tag + ' end' : member.anchorEnd;
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) {
    if (s < 0 && lines[i].indexOf(startNeedle) >= 0) { s = i + 1; continue; }
    if (s >= 0 && lines[i].indexOf(endNeedle) >= 0) { e = i + 1; break; }
  }
  if (s < 0 || e < 0) return { anchorMissing: true, needle: startNeedle };
  // Inner content only (between the delimiters), so editing the sentinel comment lines themselves
  // does not count as touching the block - only real data edits inside do.
  return (e - 1 >= s + 1) ? { start: s + 1, end: e - 1 } : { start: s, end: e };
}

function rangesOverlap(a, b) { return a[0] <= b[1] && b[0] <= a[1]; }

function memberChanged(member, changed) {
  const hunks = changed[member.file];
  if (!hunks || !hunks.length) return { changed: false };
  const r = blockRange(member);
  if (r.missing) return { changed: false, err: 'file not found: ' + member.file };
  if (r.anchorMissing) return { changed: false, err: 'sentinel/anchor not found in ' + member.file + ' (looked for "' + r.needle + '")' };
  if (r.whole) return { changed: true };
  const block = [r.start, r.end];
  return { changed: hunks.some((h) => rangesOverlap(h, block)) };
}

/* ================= Axis 1: generated staleness (rules pipeline only) ================= */
function axis1() {
  (MAP.generated || []).forEach((g) => {
    // Save exact pre-run bytes, run the generator, see if any output changed, then restore the
    // saved bytes. Non-destructive: never touches git, never clobbers uncommitted work. In CI the
    // worktree equals the pushed commit, so "generator changes an output" == the pushed output is
    // out of sync with its source.
    const before = {};
    g.outputs.forEach((o) => { before[o] = read(o); });
    let regenErr = null;
    try { sh(g.generator); } catch (e) { regenErr = (e.stderr || e.stdout || e.message || '').toString().trim(); }
    const stale = g.outputs.filter((o) => nl(read(o)) !== nl(before[o]));
    // restore pre-run bytes verbatim
    g.outputs.forEach((o) => { if (before[o] != null) fs.writeFileSync(path.join(ROOT, o), before[o]); });
    if (regenErr) fail('[axis1:' + g.concept + '] generator failed: ' + g.generator + '\n    ' + regenErr.split('\n').slice(0, 4).join('\n    '));
    else if (stale.length) fail('[axis1:' + g.concept + '] STALE generated output: ' + stale.join(', ')
      + '\n    Source ' + g.source + ' changed but the output was not rebuilt (or the output was hand-edited).'
      + '\n    Fix: run `' + g.generator + '` and commit the result.');
  });
}

/* ================= Axis 2: docs <-> embeds mirror ================= */
function axis2() {
  const docsDir = path.join(ROOT, MAP.mirror.docsDir);
  const embDir = path.join(ROOT, MAP.mirror.embedsDir);
  if (!fs.existsSync(embDir)) return;
  fs.readdirSync(embDir).filter((f) => f.endsWith('.html')).forEach((f) => {
    const dp = path.join(docsDir, f), ep = path.join(embDir, f);
    if (!fs.existsSync(dp)) { fail('[axis2] ' + MAP.mirror.embedsDir + '/' + f + ' has no ' + MAP.mirror.docsDir + '/ counterpart'); return; }
    if (fs.readFileSync(dp).equals(fs.readFileSync(ep))) return;
    fail('[axis2] mirror drift: ' + MAP.mirror.docsDir + '/' + f + ' != ' + MAP.mirror.embedsDir + '/' + f
      + '\n    Fix: cp ' + MAP.mirror.docsDir + '/' + f + ' ' + MAP.mirror.embedsDir + '/' + f);
  });
}

/* ================= Axis 3: manual co-change ================= */
function axis3(base) {
  if (!base) { notes.push('[axis3] no base ref resolved; co-change check skipped'); return; }
  const changed = changedRanges(base);
  let messages = '';
  try { messages = git(['log', base + '..HEAD', '--format=%B']); } catch (e) { messages = ''; }

  // Co-change groups come from the `concepts` index (single source of truth shared with fellboard.html):
  // each concept's `forge` list is the axis-3 member set. `vault` is board-only and never read here, so
  // vault paths absent from the forge checkout cannot trip this gate. Keys starting with `_` (e.g. `_note`)
  // are documentation, not concepts. Falls back to the legacy flat `manual` array if `concepts` is absent.
  const groups = MAP.concepts
    ? Object.keys(MAP.concepts)
        .filter((k) => k[0] !== '_')
        .map((concept) => ({ concept, members: MAP.concepts[concept].forge || [] }))
    : (MAP.manual || []);

  groups.forEach((group) => {
    if (new RegExp('\\[canon-skip:\\s*' + group.concept + '\\s*\\]', 'i').test(messages)) {
      notes.push('[axis3:' + group.concept + '] skipped via [canon-skip: ' + group.concept + ']');
      return;
    }
    // A generated concept has no siblings to keep in step by hand: its copies are outputs of
    // a bake, so touching them without the source is the normal shape. Axis 1 is what holds
    // it honest, by re-running the generator and failing if any output moves.
    const meta = MAP.concepts && MAP.concepts[group.concept];
    if (meta && meta.generated) {
      notes.push('[axis3:' + group.concept + '] generated concept; freshness is axis 1\'s to enforce');
      return;
    }
    const touched = [], untouched = [];
    group.members.forEach((m) => {
      const res = memberChanged(m, changed);
      if (res.err) fail('[axis3:' + group.concept + '] config: ' + res.err);
      (res.changed ? touched : untouched).push(m.file);
    });
    if (touched.length && untouched.length) {
      fail('[axis3:' + group.concept + '] drift: changed ' + touched.join(', ')
        + ' but NOT ' + untouched.join(', ') + '.'
        + '\n    Update the untouched sibling(s) to match, or if this is intentional add'
        + '\n    [canon-skip: ' + group.concept + ']   to your commit message.');
    }
  });
}

/* ================= SELFTEST (SELFTEST=1 node canon/checkCanon.js) ================= */
// Guards the `concepts` index without needing git or a diff. Two checks:
//   1. structural sanity - every concept has a non-empty forge, every forge member has a
//      file, and a vault key is present.
//   2. golden parity - the normalized axis-3 groups the index produces must match the
//      frozen snapshot canon/concepts.groups.golden.json, which was seeded from the exact
//      membership the legacy `manual` array produced. Any change to concept membership
//      that diverges from the golden fails here, so the migration's behavior-preserving
//      property is enforced in CI forever, not merely proven once. When membership changes
//      on purpose, regenerate the golden (see the note in that file).
function normalizeGroups() {
  const out = {};
  Object.keys(MAP.concepts || {}).filter((k) => k[0] !== '_').sort().forEach((concept) => {
    out[concept] = (MAP.concepts[concept].forge || [])
      .map((m) => ({ file: m.file, tag: m.tag || null, anchorStart: m.anchorStart || null, anchorEnd: m.anchorEnd || null }))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  });
  return out;
}
function selftest() {
  const goldenPath = path.join(ROOT, 'canon', 'concepts.groups.golden.json');
  const errs = [];
  if (!MAP.concepts) errs.push('no `concepts` block in canon.map.json');
  Object.keys(MAP.concepts || {}).filter((k) => k[0] !== '_').forEach((c) => {
    const e = MAP.concepts[c];
    if (!e.forge || !e.forge.length) errs.push('concept "' + c + '" has no forge members');
    (e.forge || []).forEach((m) => { if (!m.file) errs.push('concept "' + c + '" has a forge member with no file'); });
    if (!('vault' in e)) errs.push('concept "' + c + '" is missing its vault key');
  });
  const live = normalizeGroups();
  let golden = null;
  try { golden = JSON.parse(nl(fs.readFileSync(goldenPath, 'utf8'))); }
  catch (e) { errs.push('golden missing/unreadable: canon/concepts.groups.golden.json'); }
  if (golden && JSON.stringify(golden) !== JSON.stringify(live)) {
    errs.push('axis-3 groups diverge from canon/concepts.groups.golden.json (concept membership changed).'
      + '\n    If this change is intentional, regenerate the golden from the current concepts index.');
  }
  if (errs.length) {
    console.error('\ncanon SELFTEST FAILED (' + errs.length + '):');
    errs.forEach((p) => console.error('- ' + p));
    process.exit(1);
  }
  console.log('canon SELFTEST: ok (concepts index well-formed; axis-3 groups match the frozen legacy golden).');
  process.exit(0);
}

/* ================= run ================= */
if (process.env.SELFTEST) selftest(); // runs the self-check and exits; never touches git
const base = resolveBase();
console.log('canon gate: base=' + (base || '(none)'));
axis1();
axis2();
axis3(base);

notes.forEach((n) => console.log('  note: ' + n));
if (problems.length) {
  console.error('\ncanon drift gate FAILED (' + problems.length + '):\n');
  problems.forEach((p) => console.error('- ' + p + '\n'));
  process.exit(1);
}
console.log('\ncanon drift gate: clean (axes 1 rules, 2 mirror, 3 co-change).');
