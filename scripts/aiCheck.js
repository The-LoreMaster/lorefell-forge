// scripts/aiCheck.js
// Runs FoeForge's own AI request (aiForge) through the AI worker, the way the tool does from
// table.lorefell.com, and prints what comes back, so a tool that says "shaped offline" can be
// diagnosed from the worker's real answer. Needs network access to the worker (GitHub Actions).
// "invalid x-api-key" means the worker's ANTHROPIC_API_KEY secret in Cloudflare needs replacing.
//   node scripts/aiCheck.js
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

(async () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'foeforge.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://table.lorefell.com/foeforge.html',
    beforeParse(w) {
      w.ResizeObserver = class { observe() {} };
      w.fetch = async (url, opts) => {
        const t0 = Date.now();
        const res = await fetch(url, Object.assign({}, opts, { headers: Object.assign({}, opts.headers, { Origin: 'https://table.lorefell.com' }) }));
        const body = await res.text();
        console.log('worker HTTP ' + res.status + ' in ' + (Date.now() - t0) + ' ms, ' + body.length + ' bytes');
        console.log('request max_tokens ' + JSON.parse(opts.body).max_tokens + ', system ' + JSON.parse(opts.body).system.length + ' chars, user ' + JSON.parse(opts.body).messages[0].content.length + ' chars');
        console.log('body: ' + body.slice(0, 1500));
        try { const j = JSON.parse(body); if (j && j.ok === false) console.log('THE WORKER FAILED: ' + (j.status ? 'Anthropic answered ' + j.status + '. ' : '') + String(j.error || '').slice(0, 300)); } catch (e) {}
        // jsdom has no Response, so hand the tool the two members it reads
        return { ok: res.ok, status: res.status, json: async () => JSON.parse(body), text: async () => body };
      };
    } });
  await new Promise(r => setTimeout(r, 300));
  const theme = 'a drowned bell-ringer that drags the living into the deep';
  const out = await dom.window.eval('aiForge(' + JSON.stringify(theme) + ')');
  console.log(out ? 'aiForge parsed: ' + JSON.stringify(out).slice(0, 600) : 'aiForge returned nothing: the tool would say "shaped offline"');
  process.exit(out ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
