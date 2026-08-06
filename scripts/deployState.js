#!/usr/bin/env node
/* Deploy state check. Answers "is main deployed?" per tool, by the RIGHT path for each,
   so nobody verifies the wrong pipe again. Reads DEPLOY_MANIFEST.md is future work; for now
   the path per tool is inline below, matching the manifest table.

   For PAGES tools it checks whether Deploy Pages ran green on the current main tip.
   For CMS tools it checks whether Seed Embeds ran green on the current main tip.
   It does NOT reach the live site (the container cannot), but it catches the exact failure
   that cost an afternoon: a merge whose deploy workflow never ran, or ran on an older sha.

   Usage: GITHUB_TOKEN=... node scripts/deployState.js
*/
const { execSync } = require('child_process');

const TOOLS = [
  { slug: 'threadspire', path: 'PAGES', workflow: 'pages.yml' },
  { slug: 'fatewell',    path: 'PAGES', workflow: 'pages.yml' },
  { slug: 'fellglass',   path: 'PAGES', workflow: 'pages.yml' }
];

const REPO = 'The-LoreMaster/lorefell-forge';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

function sh(c){ return execSync(c, { encoding: 'utf8' }).trim(); }
function api(path){
  const auth = TOKEN ? `-H "Authorization: Bearer ${TOKEN}"` : '';
  return JSON.parse(sh(`curl -s ${auth} "https://api.github.com/repos/${REPO}${path}"`));
}

function main(){
  sh('git fetch origin -q');
  const mainSha = sh('git rev-parse origin/main').slice(0, 7);
  console.log(`main tip: ${mainSha}\n`);

  const byWorkflow = {};
  TOOLS.forEach(t => { byWorkflow[t.workflow] = byWorkflow[t.workflow] || []; byWorkflow[t.workflow].push(t.slug); });

  Object.keys(byWorkflow).forEach(wf => {
    let runs;
    try { runs = api(`/actions/workflows/${wf}/runs?per_page=5`).workflow_runs || []; }
    catch(e){ console.log(`${wf}: could not read runs (${e.message})`); return; }
    const onMain = runs.find(r => r.head_sha.slice(0,7) === mainSha);
    const tools = byWorkflow[wf].join(', ');
    if (!onMain){
      console.log(`STALE  ${wf} (${tools}): no run for ${mainSha}. Latest run is ${runs[0] ? runs[0].head_sha.slice(0,7)+' '+runs[0].status+'/'+runs[0].conclusion : 'none'}. DISPATCH IT.`);
    } else if (onMain.conclusion === 'success'){
      console.log(`OK     ${wf} (${tools}): green on ${mainSha}.`);
    } else {
      console.log(`FAILED ${wf} (${tools}): ${onMain.status}/${onMain.conclusion} on ${mainSha}. RE-RUN.`);
    }
  });
  console.log('\nThis checks the deploy workflow ran green on the merge commit. It does NOT');
  console.log('confirm the live page (the Wix component could point elsewhere); for that,');
  console.log('view-source the tool URL in DEPLOY_MANIFEST.md and search for your change.');
}
main();
