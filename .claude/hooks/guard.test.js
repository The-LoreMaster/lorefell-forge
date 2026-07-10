#!/usr/bin/env node
// Test the guard. Run: node .claude/hooks/guard.test.js
"use strict";
const { spawnSync } = require("child_process");
const path = require("path");
const GUARD = path.join(__dirname, "guard.js");

let fails = 0;
function run(payload) {
  const r = spawnSync(process.execPath, [GUARD], { input: JSON.stringify(payload), encoding: "utf8" });
  return { code: r.status, err: (r.stderr || "").trim() };
}
function ck(name, cond, note) {
  console.log((cond ? "  PASS  " : "  FAIL  ") + name + (!cond && note ? `  [${note}]` : ""));
  if (!cond) fails++;
}
const edit = (p) => ({ tool_name: "Edit", tool_input: { file_path: p } });
const write = (p) => ({ tool_name: "Write", tool_input: { file_path: p } });
const bash = (c) => ({ tool_name: "Bash", tool_input: { command: c } });
const ps = (c) => ({ tool_name: "PowerShell", tool_input: { command: c } });
const blocked = (n, p, note) => ck(n, run(p).code === 2, note || `code=${run(p).code}`);
const allowed = (n, p) => { const r = run(p); ck(n, r.code === 0, `code=${r.code} ${r.err}`); };

const V = "/home/nate/LoreFell/lorefell-fellguide";
const F = "/home/nate/LoreFell/lorefell-forge";
const W = "C:\\Users\\Nate Johnson\\LoreFell\\lorefell-forge";

console.log("=== Cross-root: forge paths blocked from a vault session ===");
[["scripts/seedEmbeds.js"],["scripts/build.js"],["schemas/seed/foes.json"],
 ["velo/backend/forge.web.js"],["docs/rules.js"],["fellboard.html"],
 ["docs/fellboard.html"],["embeds/fellboard.html"],["package.json"]]
  .forEach(([p]) => blocked(`blocked ${p}`, edit(`${F}/${p}`)));

console.log("\n=== Cross-root, reverse: vault paths blocked from a forge session ===");
["_Canon/CANON.md","_Canon/STYLE.md","_Canon/ROUTINE_PROMPT.md","CLAUDE.md",
 "Archive/Talents/1 - Balance.md",".obsidian/plugins/obsidian-git/data.json"]
  .forEach((p) => blocked(`blocked ${p}`, edit(`${V}/${p}`)));

console.log("\n=== Windows backslash paths ===");
["scripts\\build.js","docs\\fellboard.html","velo\\backend\\rules.js",".claude\\settings.json"]
  .forEach((p) => blocked(`blocked ${p}`, edit(`${W}\\${p}`)));

console.log("\n=== The routine's real work is NOT blocked ===");
[[`${F}/docs/sigilforge.html`,"docs/sigilforge.html"],
 [`${F}/embeds/sigilforge.html`,"embeds/sigilforge.html"],
 [`${F}/docs/forgemaster.html`,"docs/forgemaster.html"],
 [`${F}/fellboard.test.js`,"fellboard.test.js not fellboard.html"],
 [`${V}/_Canon/backlog.json`,"_Canon/backlog.json"],
 [`${V}/_Canon/CHANGELOG.md`,"_Canon/CHANGELOG.md"],
 [`${V}/The FellGuide/The FellGuide/The Combat/Afflictions.md`,"a FellGuide page"],
 [`${V}/LoreVault/Running Combat.md`,"a LoreVault page"]]
  .forEach(([p,n]) => allowed(`allowed ${n}`, write(p)));

console.log("\n=== FALSE POSITIVES that broke the previous guard ===");
["node scripts/build.js 2>&1",
 "node scripts/checkContracts.js 2>&1",
 "node scripts/build.js 2>&1 | tail -20",
 "node scripts/build.js && node scripts/checkContracts.js 2>&1",
 "grep -rn Fellmark scripts/ > /tmp/hits.txt",
 "cat scripts/build.js",
 "git diff --stat scripts/",
 "git log --oneline -- _Canon/CANON.md",
 "git show HEAD:_Canon/CANON.md",
 "git blame docs/rules.js",
 "ls -la velo/backend/",
 "wc -l schemas/seed/*.json"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== Shell writes to protected paths ===");
["echo x > scripts/build.js",
 "echo x >> _Canon/CANON.md",
 "sed -i 's/a/b/' docs/rules.js",
 "cp /tmp/x.html docs/fellboard.html",
 "mv fellboard.test.js fellboard.html",
 "tee velo/backend/rules.js < /tmp/x",
 "dd if=/tmp/x of=schemas/seed/foes.json",
 "git restore --source=main -- scripts/build.js",
 "git checkout main -- _Canon/CANON.md",
 "node scripts/build.js > scripts/build.js"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== PowerShell write cmdlets (all of them) ===");
["Set-Content -Path velo/backend/rules.js -Value ''",
 "Add-Content -Path _Canon/CANON.md -Value 'x'",
 "Out-File -FilePath docs/fellboard.html",
 "Copy-Item /tmp/x.html docs/fellboard.html",
 "Copy-Item -Path /tmp/x -Destination .claude/settings.json",
 "Move-Item fellboard.test.js fellboard.html",
 "New-Item -Path embeds/fellboard.html -ItemType File",
 "Rename-Item docs/sigilforge.html docs/fellboard.html",
 "Remove-Item _Canon/CANON.md",
 "Clear-Content -Path docs/rules.js"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,46)}\``, ps(c)));

console.log("\n=== Arbitrary code execution, both shells ===");
["node -e \"require('fs').writeFileSync('docs/rules.js','')\"",
 "node -p \"1\"",
 "npx prettier --write docs/",
 "npm run build",
 "python -c \"open('x','w')\"",
 "python3 -c \"pass\"",
 "bash -c 'echo x > scripts/y'",
 "sh -c 'true'",
 "eval $(echo rm)",
 "Invoke-Expression 'rm x'",
 "iex 'rm x'",
 "Start-Process notepad"]
  .forEach((c) => { blocked(`Bash blocked \`${c.slice(0,34)}\``, bash(c));
                    blocked(`PS   blocked \`${c.slice(0,34)}\``, ps(c)); });

console.log("\n=== Destructive git, both shells ===");
["git push --force origin main","git push --force-with-lease","git push -f",
 "git reset --hard HEAD~3","git clean -fdx","gh secret set FOO",
 "gh workflow run apply.yml","rm -rf /","rm -rf ~"]
  .forEach((c) => { blocked(`Bash blocked \`${c.slice(0,32)}\``, bash(c));
                    blocked(`PS   blocked \`${c.slice(0,32)}\``, ps(c)); });

console.log("\n=== Ordinary commands the routine needs ===");
["git status","git diff --stat","git add -A","git commit -m 'nightshift: x'",
 "git push","git push origin main","git pull --rebase","git stash",
 "node fellboard.test.js","node scripts/build.js","node scripts/checkContracts.js",
 "npm test","echo done > /tmp/log.txt","cat docs/sigilforge.html",
 "git mv backlog.json _Canon/backlog.json"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,40)}\``, bash(c)));

console.log("\n=== Fails CLOSED on bad input ===");
{
  const r = spawnSync(process.execPath, [GUARD], { input: "not json", encoding: "utf8" });
  ck("garbage stdin blocks (exit 2)", r.status === 2, `code=${r.status}`);
  ck("and says why", /could not parse/i.test(r.stderr), r.stderr);
}
console.log("\n=== Reads are not writes ===");
allowed("Read of CANON.md allowed", { tool_name:"Read", tool_input:{file_path:`${V}/_Canon/CANON.md`} });
allowed("Grep allowed", { tool_name:"Grep", tool_input:{pattern:"x"} });

console.log("\n=== False positives: git branch names are not paths ===");
["git checkout velo/manual-paste",
 "git checkout scripts/rules-rewrite",
 "git checkout -b canon/rename-afflictions",
 "git switch velo/x",
 "git switch -c fix/thing",
 "git checkout main",
 "git checkout nightshift/bl-abc123"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== But pathspecs after -- are still write targets ===");
["git checkout main -- scripts/build.js",
 "git checkout main -- _Canon/CANON.md",
 "git restore scripts/build.js",
 "git restore --source=main -- velo/backend/rules.js"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,46)}\``, bash(c)));

console.log("\n=== PowerShell write cmdlets: denied by the allow-list, source or not ===");
["Copy-Item scripts/build.js C:/tmp/x",
 "Copy-Item -Path velo/backend/rules.js -Destination C:/tmp/backup.js",
 "Get-Content -Path _Canon/CANON.md | Out-File backup.md",
 "Move-Item docs/sigilforge.html C:/tmp/old.html"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,48)}\``, ps(c)));
// Reading is fine. It is writing through a shell that is denied.
allowed("allowed `Get-Content scripts/build.js`", ps("Get-Content scripts/build.js"));

console.log("\n=== But PowerShell destinations still block ===");
["Copy-Item C:/tmp/x.html docs/fellboard.html",
 "Copy-Item -Path C:/tmp/x -Destination .claude/settings.json",
 "Move-Item C:/tmp/x.js scripts/build.js",
 "Set-Content -Path velo/backend/rules.js -Value ''",
 "Add-Content -Path _Canon/CANON.md -Value 'x'",
 "Out-File -FilePath docs/fellboard.html",
 "Remove-Item _Canon/CANON.md",
 "New-Item -Path embeds/fellboard.html -ItemType File",
 "Clear-Content docs/rules.js",
 "Rename-Item docs/sigilforge.html docs/fellboard.html",
 "Get-Content C:/tmp/x | Out-File docs/rules.js"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,48)}\``, ps(c)));

console.log("\n=== False positives: quoted text is not a command ===");
['git commit -m "eval the encounter math"',
 'git commit -m "nightshift: clean up npx references"',
 'git commit -m "iex bug in the parser"',
 'git commit -m "git clean rewrite of the lore"',
 'git commit -m "do not touch .claude/"',
 'git commit -m "rewrite scripts/ documentation"']
  .forEach((c) => allowed(`allowed \`${c.slice(0,50)}\``, bash(c)));

console.log("\n=== But real invocations still block, quotes and all ===");
["bash -c 'echo x > scripts/y'",
 "node -e \"require('fs').writeFileSync('x','')\"",
 "python -c \"pass\"",
 "Invoke-Expression 'rm x'"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== git clean -n is a dry run ===");
["git clean -n", "git clean --dry-run"].forEach((c) => allowed(`allowed \`${c}\``, bash(c)));
["git clean -fdx", "git clean -f"].forEach((c) => blocked(`blocked \`${c}\``, bash(c)));

console.log("\n=== Requiring the module does not exit the process ===");
{
  const g = require("./guard.js");
  ck("exports checkPath", typeof g.checkPath === "function");
  ck("exports checkCommand", typeof g.checkCommand === "function");
  ck("checkPath blocks a forbidden path", !!g.checkPath("/x/scripts/build.js"));
  ck("checkPath allows a normal path", !g.checkPath("/x/docs/sigilforge.html"));
  ck("process still alive after require", true);
}

console.log("\n=== Read: secrets blocked cross-root, everything else allowed ===");
const read = (p) => ({ tool_name: "Read", tool_input: { file_path: p } });
["/home/nate/LoreFell/lorefell-forge/.env",
 "/home/nate/LoreFell/lorefell-forge/.env.local",
 "C:\\Users\\Nate Johnson\\LoreFell\\lorefell-forge\\.env"]
  .forEach((p) => blocked(`blocked read of ${p.split(/[\\/]/).pop()}`, read(p)));
["/home/nate/LoreFell/lorefell-fellguide/_Canon/CANON.md",
 "/home/nate/LoreFell/lorefell-forge/scripts/build.js",
 "/home/nate/LoreFell/lorefell-forge/docs/sigilforge.html"]
  .forEach((p) => allowed(`read allowed: ${p.split("/").slice(-2).join("/")}`, read(p)));

console.log("\n=== FALSE NEGATIVES: PowerShell prefix and inline parameter binding ===");
["Copy-Item a.txt -Dest docs/fellboard.html",
 "Copy-Item a.txt -Destination:docs/fellboard.html",
 "Copy-Item a.txt -D docs/fellboard.html",
 "Copy-Item -Force a.txt docs/fellboard.html",
 "Set-Content -Path:docs/rules.js -Value ''",
 "Set-Content -Pat velo/backend/rules.js -Value x",
 "New-Item -Path:embeds/fellboard.html -ItemType File",
 "Remove-Item -LiteralPath _Canon/CANON.md",
 "Copy-Item -Recurse -Force C:/tmp/x .claude/settings.json"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,50)}\``, ps(c)));

console.log("\n=== Prefix resolution alone stops these (a named param ate the positional slot) ===");
["Copy-Item -Path a.txt -Dest docs/fellboard.html",
 "Copy-Item -Path a.txt -Destin docs/fellboard.html",
 "Move-Item -Path a.txt -Dest embeds/fellboard.html",
 "Rename-Item -Path docs/sigilforge.html -NewN docs/fellboard.html"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,52)}\``, ps(c)));

console.log("\n=== Every PowerShell write cmdlet is off the allow-list, source or not ===");
// The agent writes files through the path-fenced Edit and Write tools, never
// through a shell. So even a benign-looking Copy-Item is denied: the guard does
// not need to reason about whether its arguments are safe. The parameter parser
// above remains as defense in depth for the paths that reach writeTargets.
["Copy-Item scripts/build.js C:/tmp/x",
 "Copy-Item -Path velo/backend/rules.js -Destination C:/tmp/backup.js",
 "Copy-Item -Path:_Canon/CANON.md -Destination:C:/tmp/canon.md",
 "Move-Item docs/sigilforge.html C:/tmp/old.html",
 "Get-Content -Path _Canon/CANON.md | Out-File backup.md"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,52)}\``, ps(c)));

console.log("\n=== But read-only PowerShell still works ===");
["Get-Content _Canon/CANON.md",
 "Get-ChildItem docs/",
 "Select-String -Pattern Fellmark -Path docs/sigilforge.html",
 "Test-Path docs/fellboard.html"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,48)}\``, ps(c)));

console.log("\n=== git clean dry runs, including clusters ===");
["git clean -n", "git clean -nd", "git clean -ndx", "git clean --dry-run"]
  .forEach((c) => allowed(`allowed \`${c}\``, bash(c)));
["git clean -f", "git clean -fdx"].forEach((c) => blocked(`blocked \`${c}\``, bash(c)));

console.log("\n=== Escaped quotes inside commit messages ===");
['git commit -m "say \\"eval\\" now"',
 'git commit -m "npx and iex, discussed"',
 "git commit -m 'nightshift: eval pass on encounter math'"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,48)}\``, bash(c)));

console.log("\n=== git verbs that write files the guard cannot inspect ===");
["git apply patch.diff", "git am 0001.patch", "git cherry-pick abc123",
 "git revert HEAD", "git merge main", "git rebase main",
 "git stash pop", "git stash apply", "git worktree add ../scratch"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,40)}\``, bash(c)));
["git stash", "git stash list", "git stash show", "git log --merges"]
  .forEach((c) => allowed(`allowed \`${c}\``, bash(c)));

console.log("\n=== require() must not exit the requiring process ===");
{
  const fs = require("fs");
  const probe = path.join(__dirname, "__require_probe.js");
  fs.writeFileSync(probe, `require(${JSON.stringify(GUARD)}); console.log("SURVIVED");`);
  const r = spawnSync(process.execPath, [probe], { input: "", encoding: "utf8" });
  fs.unlinkSync(probe);
  // Assert on status, not stdout: the broken version prints SURVIVED and then
  // exits 2 from its stdin "end" handler.
  ck("require() does not exit the requiring process",
     r.status === 0 && /SURVIVED/.test(r.stdout), `status=${r.status}`);
}

console.log("\n=== The command allow-list is the ceiling: unknown heads are denied ===");
["cpi a.txt docs/fellboard.html", "copy a.txt docs/fellboard.html",
 "ni docs/fellboard.html -ItemType File", "sc _Canon/CANON.md x",
 "ac _Canon/CANON.md x", "ri _Canon/CANON.md", "mi a.txt fellboard.html", "rni a b"]
  .forEach((c) => blocked(`PS alias blocked \`${c.slice(0,42)}\``, ps(c)));

["New-Item -Path docs -Name fellboard.html -ItemType File"]
  .forEach((c) => blocked("New-Item -Path dir -Name leaf blocked", ps(c)));

["rm _Canon/CANON.md", "rm -rf velo/", "del _Canon/CANON.md", "rmdir /s /q velo",
 "curl -o docs/fellboard.html http://x", "wget -O scripts/build.js http://x",
 "tar -xf a.tar -C velo", "unzip a.zip -d scripts",
 "ln -sf /dev/null docs/fellboard.html", "truncate -s 0 docs/rules.js",
 "chmod 777 scripts/build.js", "dd if=/dev/zero of=docs/rules.js"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));

["git checkout-index -a -f", "git reset --keep", "git reset --merge",
 "git switch --discard-changes", "git submodule update", "git read-tree -u HEAD",
 "git gc --prune=now", "git filter-branch"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,42)}\``, bash(c)));

console.log("\n=== Arbitrary code execution, closed by the allow-list ===");
["[IO.File]::WriteAllText('docs/fellboard.html','x')",
 "[System.IO.File]::Delete('_Canon/CANON.md')",
 "python3 evil.py", "python evil.py", "perl -e 'x'", "ruby x.rb",
 "node evil.js", "node ../evil.js", "node /tmp/x.js",
 "./evil.sh", "sh evil.sh", "powershell -File evil.ps1"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== node runs only the named scripts ===");
["node fellboard.test.js", "node scripts/build.js", "node scripts/checkContracts.js",
 "node .claude/hooks/guard.test.js", "node scripts/build.js 2>&1",
 "node scripts/build.js 2>&1 | tail -20",
 "node scripts/build.js && node scripts/checkContracts.js"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,48)}\``, bash(c)));

console.log("\n=== The routine's full command set survives the allow-list ===");
["git status","git diff --stat","git log --oneline -5","git show HEAD","git add -A",
 "git commit -m 'nightshift: fix carousel'","git push","git push origin main",
 "git pull --rebase","git fetch","git branch -a","git checkout -b canon/rename",
 "git switch main","git stash","git stash list","git restore docs/sigilforge.html",
 "git mv a b","git blame docs/rules.js","npm test","gh run list","gh pr view 3",
 "cat docs/sigilforge.html","grep -rn Fellmark .","ls -la docs/",
 "git diff --stat && git status","echo done > /tmp/log.txt",
 "grep -rn x scripts/ > /tmp/hits.txt","FOO=bar git status"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,46)}\``, bash(c)));

console.log("\n=== CEILING BYPASS: node runs only the four exact paths ===");
// The live exploit: Write a hostile script named fellboard.test.js to a scratch
// dir, then `node` it. A basename-suffix match let this through. Now the path
// must equal one of the four real files, repo-relative, no traversal.
["node /tmp/evil/fellboard.test.js",
 "node scratch/fellboard.test.js",
 "node ../evil/fellboard.test.js",
 "node x/scripts/build.js",
 "node ./../../fellboard.test.js",
 "node C:/tmp/fellboard.test.js",
 "node ..\\evil\\build.js"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));
["node fellboard.test.js","node ./fellboard.test.js","node scripts/build.js",
 "node scripts/checkContracts.js","node .claude/hooks/guard.test.js",
 "node scripts/build.js 2>&1 | tail -20"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== No-space redirects are still redirects ===");
["echo x>docs/fellboard.html","echo x>>_Canon/CANON.md",
 "echo x >docs/fellboard.html","printf y>scripts/build.js"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,42)}\``, bash(c)));
["echo x>/tmp/log.txt","node scripts/build.js 2>&1"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,42)}\``, bash(c)));

console.log("\n=== git checkout <ref> <pathspec> writes a file ===");
["git checkout HEAD scripts/build.js","git checkout main scripts/build.js",
 "git checkout abc123 _Canon/CANON.md","git checkout main -- docs/rules.js"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));
["git checkout main","git checkout -b canon/rename","git checkout velo/manual-paste","git switch main"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== find is a write primitive with -delete / -exec ===");
["find . -name x -delete","find docs -exec cp src docs/fellboard.html ;",
 "find . -execdir rm {} ;"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));
["find . -name '*.html'","find docs -type f","find . -maxdepth 2"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== CEILING: command substitution runs a nested command ===");
["echo $(cp src docs/fellboard.html)",
 "echo `cp src docs/fellboard.html`",
 "echo $(rm _Canon/CANON.md)",
 "echo $(node /tmp/evil.js)",
 "x=$(curl -o docs/fellboard.html http://x)",
 "echo $(echo $(rm velo/x))",
 "cat <(cp a docs/fellboard.html)"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,46)}\``, bash(c)));
["echo $(git status)", "echo $(date)", "echo $(ls docs/)"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== CEILING: git -c and git config execute arbitrary code ===");
['git -c core.editor="cp src docs/fellboard.html" commit',
 'git config core.pager "sh -c x"',
 "git -c core.pager=evil log",
 "git --config-env=X commit",
 "git format-patch -o scripts HEAD",
 "git format-patch HEAD~3"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,48)}\``, bash(c)));
["git commit -m x", "git log --oneline", "git diff --stat", "git config --get user.name", "git config --list"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,44)}\``, bash(c)));

["git config core.pager 'sh -c x'", "git config user.name X"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== Redirect targets with spaces or quotes ===");
['cat evil > "C:/Users/Nate Johnson/x/.claude/hooks/guard.js"',
 'echo x > "docs/fellboard.html"',
 "echo x > 'docs/fellboard.html'",
 'cat a >> "/home/nate/lorefell-forge/scripts/build.js"']
  .forEach((c) => blocked(`blocked \`${c.slice(0,50)}\``, bash(c)));
['echo x > "/tmp/some log.txt"', "echo x > /tmp/log.txt"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,46)}\``, bash(c)));

console.log("\n=== Write-flags on read-only heads ===");
["git diff --output docs/fellboard.html",
 "git diff --output=docs/fellboard.html HEAD",
 "sort -o docs/fellboard.html file"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,46)}\``, bash(c)));
["git diff --stat", "sort file.txt", "sort -o /tmp/out.txt file"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== LEAK: quotes and substitutions inside a write target ===");
['echo x > "scripts"/build.js',
 'echo x > sc"ript"s/build.js',
 "echo x > 'scripts'/build.js",
 'echo x > do"cs/rules".js',
 'echo x > $(printf scripts)/build.js',
 'echo x > `echo scripts`/build.js',
 'echo x > docs/*.html',
 'echo x > sc"ripts"/../docs/fellboard.html']
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));
["echo x > /tmp/log.txt", 'echo x > "/tmp/some log.txt"',
 "echo done >> /tmp/out", "grep -rn x scripts/ > /tmp/hits.txt"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== LEAK: git config write vectors ===");
["git config core.hooksPath .evil",
 'git config core.sshCommand "sh -c evil"',
 'git config alias.p "!sh -c evil"',
 "git config user.name X"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));
["git config --get user.name", "git config --list", "git config --get-all remote.origin.url"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== LEAK: git -c exec vector ===");
["git -c core.sshCommand=payload fetch",
 "git -c core.pager=evil log",
 "git --config-env=core.editor=X commit"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== LEAK: git output-file subcommands ===");
["git archive -o scripts/build.js HEAD",
 "git archive --output=schemas/x.zip HEAD",
 "git bundle create velo/x.bundle HEAD",
 "git format-patch -o scripts HEAD~1"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));

console.log("\n=== LEAK: npm foreign package.json ===");
["npm test --prefix ../evil",
 "npm test -C ../evil",
 "npm_config_prefix=../evil npm test",
 "npm test --userconfig ../evil/.npmrc",
 "npm test --globalconfig ../evil/rc"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,44)}\``, bash(c)));
["npm test", "npm ls", "npm view x"].forEach((c) => allowed(`allowed \`${c}\``, bash(c)));

console.log("\n=== LEAK: write-cmdlets inside (...) subexpressions ===");
["Write-Output (Tee-Object -InputObject x -FilePath docs/fellboard.html)",
 "Write-Output (Tee-Object -LiteralPath schemas/x.json -InputObject x)",
 "Write-Output (Export-Csv -Path scripts/build.js -InputObject x)",
 "x = (Set-Content -Path docs/rules.js -Value y)"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,48)}\``, ps(c)));

console.log("\n=== LEAK: broad pathspec and -C in git restore/checkout ===");
["git restore --source=HEAD~1 .",
 "git restore --overlay --source=HEAD~1 .",
 "git restore -s badcommit .",
 "git checkout HEAD~3 -- .",
 "git -C . restore --source=HEAD~1 scripts/build.js",
 "git -C ../x restore --source=HEAD~1 .",
 "git -C ../other config core.hooksPath .evil",
 "git -C ../other gc",
 "git --git-dir=../x/.git config core.pager evil",
 "git restore --source=HEAD~1 scripts/build.js",
 "git restore scripts/build.js",
 "git restore velo/x.js",
 "git restore _Canon/CANON.md"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,46)}\``, bash(c)));
["git restore docs/sigilforge.html", "git restore embeds/sigilforge.html",
 "git checkout main", "git checkout -b canon/x", "git checkout velo/manual-paste"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,46)}\``, bash(c)));

console.log("\n=== LEAK: npm foreign package.json and NODE_OPTIONS ===");
["cd ../evil && npm test",
 "pushd ../evil; npm test",
 'npm test --node-options="--require ./evil.js"',
 "npm_config_node_options=--require=./evil.js npm test",
 "NODE_OPTIONS=--require=./evil.js node scripts/build.js"]
  .forEach((c) => blocked(`blocked \`${c.slice(0,48)}\``, bash(c)));
["npm test", "npm ls", "node scripts/build.js", "cd docs && ls"]
  .forEach((c) => allowed(`allowed \`${c.slice(0,44)}\``, bash(c)));

console.log("\n" + (fails ? `${fails} FAILURE(S)` : "ALL PASS"));
process.exit(fails ? 1 : 0);
