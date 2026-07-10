#!/usr/bin/env node
/**
 * Fellboard guard. A PreToolUse hook.
 *
 * Why Node and not Python: this must run on Nate's Windows machine and in the
 * routine's Linux container. Windows has no Python interpreter, and a hook that
 * cannot execute exits non-zero-but-not-2, which Claude Code treats as a
 * non-blocking error. The tool call then proceeds. A guard that fails open is
 * worse than no guard, because you believe it is working. Node is already a
 * dependency of this repo.
 *
 * Why a hook and not permission rules: permission path patterns anchor to the
 * session's working directory, and only the project root's .claude/settings.json
 * loads. With two repos attached to one routine, exactly one is root. This hook
 * receives the absolute path and does not care which. A PreToolUse denial holds
 * even under bypassPermissions.
 *
 * Exit 2 blocks the tool call. stderr is fed back as the reason.
 * Exit 0 allows it. Any other exit code is a non-blocking error, so never use one.
 *
 * Keep this file identical in both repos.
 */

"use strict";

/** Repo-relative paths no agent may write. Matched against normalized absolute paths. */
const FORBIDDEN = [
  [/(^|\/)fellboard\.html$/i,
   "fellboard.html is the control surface. It is pasted into Wix by hand and must never live under docs/ or embeds/, where pages.yml would publish a page that prompts for a write-scoped GitHub token to a public origin. Block the item and tell Nate."],

  [/(^|\/)scripts\//i,
   "scripts/ is denied. A push here fires apply.yml, which runs createCollection, upsertItems, and migrate against the live Wix CMS. No git revert undoes that. You may RUN the named scripts. You may never edit them."],
  [/(^|\/)schemas\//i,
   "schemas/ is denied. A push here fires apply.yml against the live Wix CMS. Block the item and tell Nate to regenerate the seed himself."],

  [/(^|\/)velo\//i,
   "velo/ is denied. Those files are pasted into Wix by hand, so a silent change leaves the repo and the live site disagreeing. Block, and say a manual Wix paste is required."],

  [/(^|\/)docs\/rules\.js$/i,
   "docs/rules.js is generated from scripts/rules.core.js by scripts/build.js. Editing an output is erased on the next build, and the source is denied to you."],
  [/(^|\/)velo\/backend\/rules\.js$/i,
   "velo/backend/rules.js is generated. See docs/rules.js."],

  [/(^|\/)_Canon\/CANON\.md$/i, "CANON.md is canon. Nate's signature only."],
  [/(^|\/)_Canon\/STYLE\.md$/i, "STYLE.md is canon. Nate's signature only."],
  [/(^|\/)_Canon\/NAV_ORDER_MAP\.md$/i, "NAV_ORDER_MAP.md is canon. Nate's signature only."],
  [/(^|\/)_Canon\/SEASON_BIBLE\.md$/i, "SEASON_BIBLE.md is canon. Nate's signature only."],
  [/(^|\/)_Canon\/ROUTINE_PROMPT\.md$/i,
   "ROUTINE_PROMPT.md is the prompt you operate under. You do not get to rewrite it."],
  [/(^|\/)CLAUDE\.md$/i,
   "CLAUDE.md is the instruction file you operate under. You do not get to rewrite it."],

  [/(^|\/)Archive\//i, "Archive/ is deprecated. Never cite it as current, never fix it."],
  [/(^|\/)\.obsidian\//i, ".obsidian/ is Obsidian's config, not content."],
  [/(^|\/)\.github\/workflows\//i, ".github/workflows/ is infrastructure."],
  [/(^|\/)\.claude\//i, ".claude/ holds the rules that constrain you."],
  [/(^|\/)\.git\//i, ".git/ is the repository's internals."],
  [/(^|\/)package(-lock)?\.json$/i,
   "package.json is denied. npm run executes whatever it contains, which is a path to arbitrary writes."],
  [/(^|\/)\.env($|\.)/i, ".env holds secrets."],
];

/**
 * Commands denied outright: they can write any file, so no target extraction
 * can constrain them. Checked before target extraction.
 */
const FORBIDDEN_CMD = [
  [/\bgit\s+push\b[^|;&]*(--force\b|--force-with-lease\b|\s-f\b|\s\+\S)/i,
   "Force push is denied in every form. History is the audit trail."],
  [/\bgit\s+reset\s+--hard\b/i, "git reset --hard is denied. It destroys uncommitted work."],
  // -n and --dry-run destroy nothing. -n may appear inside a cluster: -nd, -ndx.
  [/\bgit\s+clean\b(?![^|;&]*\s(?:--dry-run\b|-[a-z]*n[a-z]*\b))/i,
   "git clean is denied. It destroys untracked files. Dry runs (-n, --dry-run) are allowed."],
  [/\bgh\s+secret\b/i, "gh secret is denied."],
  [/\bgh\s+workflow\s+run\b/i, "Triggering workflows by hand is denied."],

  // Arbitrary code execution. Each can open and write any file.
  [/\bnode\s+(-e|--eval|-p|--print)\b/i, "node -e can write any file. Use a named script."],
  [/\bnpx\b/i, "npx executes arbitrary packages. Use a named script."],
  [/\bnpm\s+run\b/i, "npm run executes whatever package.json defines. Use a named script."],
  [/\bpython3?\s+(-c|-m)\b/i, "python -c can write any file."],
  [/\b(bash|sh|zsh)\s+-c\b/i, "sh -c can write any file."],
  [/\beval\b/i, "eval can write any file."],
  [/\bInvoke-Expression\b|\biex\b/i, "Invoke-Expression can write any file."],
  [/\bStart-Process\b/i, "Start-Process can launch anything."],

  // These write working-tree files from a patch, a ref, or another worktree.
  // The guard cannot see which files, so it cannot fence them. Deny outright.
  [/\bgit\s+apply\b/i, "git apply writes arbitrary files from a patch. Denied."],
  [/\bgit\s+(am|cherry-pick|revert|merge|rebase)\b/i,
   "git am, cherry-pick, revert, merge, and rebase write working-tree files the guard cannot inspect. Denied. To undo your own uncommitted work, use git restore on the specific files you touched."],
  [/\bgit\s+stash\s+(pop|apply)\b/i, "git stash pop and apply write working-tree files. Denied."],
  [/\bgit\s+worktree\s+add\b/i, "git worktree add creates a second checkout outside the guard's fences. Denied."],

  [/\brm\s+-rf\s+\/(\s|$)/i, "Refusing to delete the filesystem root."],
  [/\brm\s+-rf\s+~(\s|$)/i, "Refusing to delete the home directory."],
];

/**
 * Command allow-list. This is the ceiling.
 *
 * writeTargets() below enumerates known write syntaxes, and that space is not
 * enumerable: cpi, ri, curl -o, tar -C, unzip -d, ln -sf, del, rmdir, and
 * [IO.File]::WriteAllText all write files, and the next round would find more.
 * A denylist of syntaxes stops a confused agent. It does not stop a determined
 * one.
 *
 * So the head of every command segment must appear here. Anything unrecognized
 * is denied, including things nobody has thought of. writeTargets() then
 * constrains the commands that ARE allowed. Deny by default, permit by name.
 *
 * Adding an entry here is a real decision. Ask whether the command can write an
 * arbitrary file, and if it can, do not add it.
 */
const ALLOWED_HEADS = new Set([
  // Read-only inspection.
  "ls", "dir", "cat", "type", "head", "tail", "wc", "grep", "rg", "find",
  "which", "where", "echo", "pwd", "cd", "stat", "du", "diff", "sort", "uniq",
  // find is read-only ONLY without -delete/-exec, gated below.
  "test", "true", "false", "printf", "date", "sleep", "jq",
  "get-content", "get-childitem", "select-string", "measure-object",
  "get-location", "set-location", "write-output", "write-host", "test-path",
  "gc", "gci", "sls", "pwd", "ls",
  // Version control. Subcommands are gated separately below.
  "git", "gh",
  // The named scripts and test runners. node is gated below.
  "node", "npm",
]);

/**
 * git subcommands that write working-tree files, rewrite history, or reach
 * outside the guard's view. Everything not listed is read-only or safe.
 */
const GIT_DENIED = new Set([
  "apply", "am", "cherry-pick", "revert", "merge", "rebase",
  "worktree", "submodule", "read-tree", "checkout-index",
  "gc", "prune", "filter-branch", "replace",
  // config writes .git/config and can set core.hooksPath / core.sshCommand /
  // aliases to arbitrary commands. archive, bundle, and format-patch write files.
  "config", "archive", "bundle", "format-patch",
  // `clean` is intentionally absent. FORBIDDEN_CMD denies it while permitting
  // the -n and --dry-run forms, which destroy nothing.
]);

/** The only scripts node may run. Anything else is arbitrary code execution. */
const NODE_SCRIPTS = [
  "fellboard.test.js",
  "scripts/build.js",
  "scripts/checkContracts.js",
  ".claude/hooks/guard.test.js",
];

/** npm subcommands that do not execute arbitrary package scripts. */
const NPM_ALLOWED = new Set(["test", "ls", "list", "view", "ping", "why", "outdated"]);

/** gh subcommands that do not mutate secrets or trigger workflows. */
const GH_DENIED = new Set(["secret", "workflow", "api", "auth", "repo", "release"]);

/**
 * Pull out the bodies of every command substitution: $(...), backticks, and
 * ${...}. Each runs as its own command, so each must be checked. Nesting is
 * handled by scanning repeatedly until no substitution remains.
 */
function substitutions(cmd) {
  const found = [];
  const patterns = [/\$\(([^()]*)\)/g, /`([^`]*)`/g, /<\(([^()]*)\)/g, />\(([^()]*)\)/g];
  let scan = cmd;
  for (let depth = 0; depth < 8; depth++) {
    let any = false;
    for (const re of patterns) {
      scan = scan.replace(re, (_, body) => { if (body.trim()) found.push(body); any = true; return " "; });
    }
    if (!any) break;
  }
  return found;
}

/** Split a command line into segments a shell would execute independently. */
function segments(cmd) {
  // Split on ||, &&, |, ;, newline, and a backgrounding &. Never split on the &
  // of a file-descriptor dup such as `2>&1` or `>&2`, which is not a separator.
  const placeholder = "\u0000FD\u0000";
  const safe = cmd.replace(/\d?>&\d?/g, placeholder);
  return safe
    .split(/\|\||&&|[|;&\n]/)
    .map((x) => x.split(placeholder).join("").trim())
    .filter(Boolean);
}

/**
 * Reject any segment whose head is not allow-listed, and gate the subcommands
 * of the few heads that are.
 */
function checkAllowList(cmd) {
  // A command substitution runs a nested command. Check each nested body first;
  // otherwise `echo $(cp src docs/fellboard.html)` runs cp through an allowed head.
  for (const body of substitutions(cmd)) {
    const nested = checkAllowList(body);
    if (nested) return nested;
    const w = checkCommand(body);
    if (w) return w;
  }
  for (const rawSeg of segments(cmd)) {
    const seg = rawSeg.replace(/^(?:\w+=\S*\s+)+/, "");
    // Environment prefixes: FOO=bar cmd ...
    const toks = seg.trim().split(/\s+/).filter(Boolean);
    if (!toks.length) continue;

    // A .NET static call or any parenthesized/bracketed expression is not a command.
    if (/^[[($]/.test(toks[0]) || /::/.test(seg)) {
      return `\`${toks[0]}\` is not an allowed command. Method calls and expressions can write any file.`;
    }

    const head = toks[0].replace(/^.*[\\/]/, "").replace(/\.exe$/i, "").toLowerCase();
    if (!ALLOWED_HEADS.has(head)) {
      return `\`${head}\` is not on the command allow-list. The guard denies by default: it permits named commands rather than trying to enumerate every way a shell can write a file. If the item legitimately needs this command, block the item and tell Nate.`;
    }

    const sub = (toks[1] || "").toLowerCase();
    if (head === "git") {
      // git -c name=value <subcmd> and --config-env can point core.editor,
      // core.pager, core.sshCommand, or core.hooksPath at an arbitrary command,
      // and they also displace the real subcommand from the `sub` slot so the
      // gate below never sees it. Reject them outright.
      if (/^-c$|^--config-env/.test((toks[1] || "")) || /\bgit\s+-c\s/.test(seg)) {
        return "git -c and --config-env can set core.editor, core.pager, core.sshCommand, or core.hooksPath to a command git then runs. Denied.";
      }
      // config reads are fine; config writes set those same dangerous keys.
      if (sub === "config" && /\s(--get|--list|--get-all|--get-regexp|-l)\b/.test(seg)) {
        // read form, allowed
      } else if (GIT_DENIED.has(sub)) {
        return `git ${sub} writes files or rewrites history the guard cannot inspect. Denied. To undo your own uncommitted work use git restore on the specific files you touched.`;
      }
      if (sub === "stash" && ["pop", "apply"].includes((toks[2] || "").toLowerCase())) {
        return "git stash pop and git stash apply write working-tree files. Denied.";
      }
      if (sub === "reset" && /--(hard|merge|keep)\b/.test(seg)) {
        return "git reset --hard, --merge, and --keep overwrite working-tree files. Denied.";
      }
      if (sub === "switch" && /--discard-changes\b/.test(seg)) {
        return "git switch --discard-changes overwrites working-tree files. Denied.";
      }
    } else if (head === "npm") {
      if (!NPM_ALLOWED.has(sub)) {
        return `npm ${sub} is denied. npm run executes whatever package.json defines. Only ${[...NPM_ALLOWED].join(", ")} are allowed.`;
      }
      // --prefix / -C / --userconfig / --globalconfig point npm at a foreign
      // package.json whose test script is arbitrary code. The env forms
      // (npm_config_prefix=...) are stripped before we tokenize, so match the raw.
      if (/\s(--prefix\b|-C\b|--userconfig\b|--globalconfig\b)/.test(seg) ||
          /npm_config_(prefix|userconfig|globalconfig)=/i.test(rawSeg)) {
        return "npm with --prefix, -C, or a config override runs a foreign package.json's scripts. Denied.";
      }
    } else if (head === "gh") {
      if (GH_DENIED.has(sub)) return `gh ${sub} is denied.`;
    } else if (head === "find") {
      // find is inspection until it is given an action.
      if (/\s-(delete|exec|execdir|fprint|fprintf|fls)\b/i.test(seg)) {
        return "find with -delete or -exec can write or delete any file. Denied.";
      }
    } else if (head === "node") {
      const raw = (toks[1] || "");
      const script = raw.replace(/\\/g, "/");
      if (!script || /^-/.test(script)) {
        return "node with a flag (-e, -p, --eval) can write any file. Run a named script.";
      }
      // Match the EXACT repo-relative path, not a basename suffix. A suffix match
      // let `node /tmp/evil/fellboard.test.js` through: an agent Writes a hostile
      // script named fellboard.test.js to a scratch dir, then runs it. The script
      // path must be one of the four real files, relative to the repo root, with
      // no directory traversal.
      const rel = script.replace(/^\.\//, "");
      if (rel.includes("..") || rel.startsWith("/") || /^[a-zA-Z]:/.test(script) ||
          !NODE_SCRIPTS.includes(rel)) {
        return `node may only run these exact paths from the repo root: ${NODE_SCRIPTS.join(", ")}. Any other script, including one with the same name elsewhere, can write any file.`;
      }
    }
  }
  return null;
}

/**
 * Extract the paths a command would WRITE to. This is the whole trick.
 *
 * Scanning a command for any mention of a forbidden path blocks `node
 * scripts/build.js 2>&1`, which is a legitimate run with a stderr merge, and
 * `grep -r x scripts/ > out.txt`, which reads scripts/ and writes elsewhere.
 * Only the destinations matter.
 */
function writeTargets(cmd) {
  const t = [];
  const push = (s) => {
    if (!s) return;
    const u = shellUnquote(s);
    t.push(u === UNRESOLVABLE ? UNRESOLVABLE : u);
  };

  // Redirections. `2>&1` and `>&2` are file-descriptor dups, not files.
  // A redirect can abut the previous token with no space: `echo x>file`. Do not
  // require a separator before it. Still skip `>&` fd dups via the (?!&).
  // A redirect target may be quoted and contain spaces:
  //   cat x > "C:/Users/Nate Johnson/.../.claude/hooks/guard.js"
  // Capture the quoted form whole; fall back to the unquoted, space-free form.
  // Capture the whole redirect target, including any embedded or surrounding
  // quotes, up to the next unquoted shell delimiter. shellUnquote() then collapses
  // it the way the shell would: `>"scripts"/build.js` and `>sc"ript"s/build.js`
  // both resolve to scripts/build.js. A fully quoted target may contain spaces.
  const redir = /\d?>>?\s*(?!&)((?:"[^"]*"|'[^']*'|[^\s;&|<>])+)/g;
  let m;
  while ((m = redir.exec(cmd)) !== null) push(m[1]);

  // POSIX tools that take a destination.
  const patterns = [
    /\bsed\s+(?:[^|;&]*\s)?-i(?:\S*)?\s+(?:(?:-e|--expression)\s+\S+\s+)?(?:'[^']*'|"[^"]*"|\S+)\s+(\S+)/gi,
    /\btee\s+(?:-a\s+)?(\S+)/gi,
    /\bdd\b[^|;&]*\bof=(\S+)/gi,
    /\btruncate\b[^|;&]*\s(\S+)\s*$/gi,
    // Write-flags on otherwise read-only allowed heads.
    /\bgit\s+diff\b[^|;&]*\s--output[= ]"?([^\s"|;&]+)/gi,
    /\bsort\b[^|;&]*\s-o\s+"?([^\s"|;&]+)/gi,
  ];
  for (const p of patterns) { while ((m = p.exec(cmd)) !== null) push(m[1]); }

  // cp / mv / install: every argument after the first is a potential destination,
  // but the last is certain. Take all non-flag args after the command to be safe:
  // a two-arg cp writes only the last, and a multi-arg cp writes into the last.
  const cpmv = /\b(cp|mv|install|rsync)\s+((?:[^|;&<>]|\\\s)+)/gi;
  while ((m = cpmv.exec(cmd)) !== null) {
    const args = m[2].trim().split(/\s+/).filter((a) => !a.startsWith("-"));
    if (args.length) push(args[args.length - 1]);
  }

  // git commands that overwrite working-tree files.
  //
  // `git checkout <branch>` switches branches and writes nothing the guard cares
  // about, and branch names routinely contain slashes (fix/thing, canon/rename).
  // Only pathspecs after `--` are write targets. `git restore <pathspec>` takes
  // paths directly, so every non-flag argument counts, and `--` still delimits.
  const gitWrite = /\bgit\s+(restore|checkout)\b([^|;&]*)/gi;
  while ((m = gitWrite.exec(cmd)) !== null) {
    const verb = m[1].toLowerCase();
    const rest = m[2];
    const sep = rest.indexOf(" -- ");
    if (sep !== -1) {
      // Everything after -- is a pathspec.
      for (const a of rest.slice(sep + 4).trim().split(/\s+/)) if (a) push(a);
    } else if (verb === "restore") {
      for (const a of rest.trim().split(/\s+/)) if (a && !a.startsWith("-")) push(a);
    } else {
      // checkout without --. `checkout <branch>` is a switch and writes nothing
      // the guard fences. But `checkout <ref> <pathspec>` restores a working-tree
      // file from that ref. Any argument after the first non-flag token is a
      // pathspec: conservatively treat every such token as a write target. A bare
      // branch switch has only one non-flag token and so stays allowed.
      const args = rest.trim().split(/\s+/).filter((a) => a && !a.startsWith("-"));
      for (let i = 1; i < args.length; i++) push(args[i]);
    }
  }

  // PowerShell cmdlets.
  //
  // Two things make naive matching unsafe. A parameter's meaning depends on the
  // cmdlet: -Path is the DESTINATION for Set-Content and the SOURCE for Copy-Item.
  // And PowerShell binds parameters by unambiguous PREFIX and accepts -Name:Value,
  // so `-Dest docs/fellboard.html` and `-Destination:docs/fellboard.html` are both
  // valid and both name a destination. A regex demanding the full name and a space
  // misses them, and a positional scanner that blindly consumes the token after any
  // flag then swallows the destination itself.
  //
  // So: tokenize, resolve each flag by prefix against that cmdlet's parameters,
  // and know which parameters take a value.
  const PS_CMDLETS = {
    "set-content":      { dest: ["path", "literalpath"], valued: ["value", "encoding"], positional: "first" },
    "add-content":      { dest: ["path", "literalpath"], valued: ["value", "encoding"], positional: "first" },
    "clear-content":    { dest: ["path", "literalpath"], valued: [],                    positional: "first" },
    "remove-item":      { dest: ["path", "literalpath"], valued: [],                    positional: "first" },
    "set-itemproperty": { dest: ["path", "literalpath"], valued: ["name", "value"],     positional: "first" },
    "new-item":         { dest: ["path"],                valued: ["itemtype", "value"], positional: "first" },
    "out-file":         { dest: ["filepath"],            valued: ["encoding"],          positional: "first" },
    // Source and destination are distinct parameters here.
    "copy-item":        { dest: ["destination"],         valued: ["path", "literalpath", "filter"], positional: "last" },
    "move-item":        { dest: ["destination"],         valued: ["path", "literalpath", "filter"], positional: "last" },
    "rename-item":      { dest: ["newname"],             valued: ["path", "literalpath"],           positional: "last" },
  };
  const PS_RE = /\b(Set-Content|Add-Content|Clear-Content|Remove-Item|Set-ItemProperty|New-Item|Out-File|Copy-Item|Move-Item|Rename-Item)\b/i;

  /** Resolve a flag name by unambiguous prefix, PowerShell style. */
  const resolve = (name, candidates) => {
    const n = name.toLowerCase();
    const hits = candidates.filter((c) => c.startsWith(n));
    return hits.length === 1 ? hits[0] : (candidates.includes(n) ? n : null);
  };

  for (const segment of cmd.split(/[|;]/)) {
    const hit = segment.match(PS_RE);
    if (!hit) continue;
    const spec = PS_CMDLETS[hit[1].toLowerCase()];
    const tail = segment.slice(segment.indexOf(hit[0]) + hit[0].length);
    const toks = tail.trim().split(/\s+/).filter(Boolean);

    const known = spec.dest.concat(spec.valued);
    const positional = [];
    let named = false;

    for (let i = 0; i < toks.length; i++) {
      const tok = toks[i];
      if (!tok.startsWith("-")) { positional.push(tok); continue; }

      // -Name:Value binds inline.
      const colon = tok.indexOf(":");
      const rawName = (colon === -1 ? tok.slice(1) : tok.slice(1, colon)).toLowerCase();
      const inline = colon === -1 ? null : tok.slice(colon + 1);
      const resolved = resolve(rawName, known);

      if (resolved && spec.dest.includes(resolved)) {
        if (inline !== null) { push(inline); named = true; }
        else if (i + 1 < toks.length) { push(toks[++i]); named = true; }
        continue;
      }
      if (resolved && spec.valued.includes(resolved)) {
        if (inline === null && i + 1 < toks.length) i++; // consume its value
        continue;
      }
      // Unknown flag or a switch such as -Force or -Recurse. Do NOT consume the
      // next token: it may be the destination, and swallowing it is how
      // `-Dest docs/fellboard.html` escaped the old scanner.
    }

    if (named) continue;
    if (!positional.length) continue;
    if (spec.positional === "first") push(positional[0]);
    else if (positional.length > 1) push(positional[positional.length - 1]);
  }

  return t;
}

function normalize(p) {
  return String(p).replace(/\\/g, "/");
}

/**
 * Collapse a write target the way a shell would before it opens the file.
 * `"scripts"/build.js`, `sc"ript"s/build.js`, and `'scripts'/build.js` all name
 * scripts/build.js once the shell strips the quotes. Remove unescaped quotes,
 * keeping their contents. If the target still contains a substitution or a glob,
 * it is unresolvable statically: return a sentinel so the caller blocks it.
 */
const UNRESOLVABLE = "\u0000UNRESOLVABLE\u0000";
function shellUnquote(target) {
  if (/\$\(|`|\$\{|[*?]|\[[^\]]*\]/.test(target)) return UNRESOLVABLE;
  let out = "";
  let q = null;
  for (let i = 0; i < target.length; i++) {
    const c = target[i];
    if (q) { if (c === q) q = null; else out += c; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === "\\" && i + 1 < target.length) { out += target[++i]; continue; }
    out += c;
  }
  return out;
}

function checkPath(p) {
  if (p === UNRESOLVABLE) {
    return "A write target that contains a command substitution or glob cannot be checked statically. Denied. Write to an explicit path.";
  }
  const n = normalize(p);
  for (const [re, reason] of FORBIDDEN) if (re.test(n)) return reason;
  return null;
}

/**
 * Blank the contents of quoted strings, keeping the quotes so token boundaries
 * survive. A commit message carries a backlog item title verbatim, and
 * `git commit -m "eval the encounter math"` is not an eval. Flags live outside
 * quotes, so `bash -c 'rm x'` still reads as `bash -c ''` and still blocks.
 */
function stripQuoted(cmd) {
  // A single left-to-right pass. A two-pass regex mispairs quotes when one is
  // backslash-escaped: `git commit -m "say \"eval\" now"` would leave `eval` bare.
  let out = "";
  let quote = null;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (quote) {
      if (c === "\\" && i + 1 < cmd.length) { i++; continue; } // escaped char, drop it
      if (c === quote) { out += c; quote = null; }
      continue; // everything inside the quotes is dropped
    }
    if (c === "'" || c === '"') { quote = c; out += c; continue; }
    out += c;
  }
  return out;
}

function checkCommand(cmd) {
  const bare = stripQuoted(cmd);
  // Ceiling first: is this command permitted at all?
  const notAllowed = checkAllowList(bare);
  if (notAllowed) return notAllowed;
  // Then the specific denials, which catch dangerous forms of allowed commands.
  for (const [re, reason] of FORBIDDEN_CMD) if (re.test(bare)) return reason;
  for (const target of writeTargets(cmd)) {
    const reason = checkPath(target);
    if (reason) return `${reason} (attempted through a shell write to ${target})`;
  }
  return null;
}

function main(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    // Fail closed. A guard that cannot read its input cannot make a decision,
    // and the previous version's fail-open behavior is the exact failure this
    // hook exists to prevent. If this ever fires in normal use it is a bug and
    // Nate should hear about it immediately rather than silently lose the guard.
    process.stderr.write("[fellboard-guard] BLOCKED. Hook could not parse its input. Failing closed. Tell Nate.\n");
    return 2;
  }

  const tool = data.tool_name || "";
  const ti = data.tool_input || {};
  let reason = null;

  if (["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(tool)) {
    for (const key of ["file_path", "notebook_path"]) {
      if (ti[key]) { reason = checkPath(ti[key]); if (reason) break; }
    }
    if (!reason) for (const e of ti.edits || []) {
      if (e.file_path) { reason = checkPath(e.file_path); if (reason) break; }
    }
  } else if (tool === "Bash" || tool === "PowerShell") {
    if (ti.command) reason = checkCommand(ti.command);
  } else if (tool === "Read") {
    // Reads are allowed everywhere except secrets. The permission layer's
    // Read(./.env) rule anchors to cwd and only loads for the root repo.
    if (ti.file_path && /(^|\/)\.env($|\.)/i.test(normalize(ti.file_path))) {
      reason = ".env holds secrets and is never read by an agent.";
    }
  }

  if (reason) {
    process.stderr.write(`[fellboard-guard] BLOCKED. ${reason}\n`);
    return 2;
  }
  return 0;
}

// Only read stdin when invoked as the hook. Requiring this module for its
// exports must not exit the requiring process.
if (require.main === module) {
  let buf = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (d) => (buf += d));
  process.stdin.on("end", () => process.exit(main(buf)));
}

module.exports = { checkPath, checkCommand, writeTargets, checkAllowList, main };
