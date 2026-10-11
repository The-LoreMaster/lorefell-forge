/* LoreFell AI proxy. Deploy as a Cloudflare Worker.
   It holds the Anthropic key server side and answers the forge tools directly,
   which removes the Wix web-method timeout that was returning 504s.

   Setup, one time:
   1. dash.cloudflare.com, Workers and Pages, Create, Worker. Name it lorefell-ai.
   2. Paste this whole file as the worker code. Deploy.
   3. Worker, Settings, Variables, add an encrypted secret:
        ANTHROPIC_API_KEY = your key
   4. Copy the worker URL, for example https://lorefell-ai.<you>.workers.dev
      and give it to me. I point every AI forge at it.

   The ALLOW list restricts who may call it. Keep it tight.

   Since 2026-10-11 the repo deploys it: .github/workflows/ai-worker.yml runs on every merge that
   touches this file (cloudflare/ai-worker/wrangler.toml names it lorefell-ai). The key stays the
   worker's own secret; a deploy never touches it.

   The models (Nate, 2026-10-11): "smart" is Claude Sonnet 5.5, "fast" is Claude Haiku 5.5, both
   with thinking off so a short answer is never eaten by thinking inside the tools' small
   max_tokens. The system prompt is cached (5 minutes): a tool that sends the same instructions
   again soon after, such as a History written episode by episode, pays a tenth for them. A
   system prompt too short to cache simply is not cached, at no cost. */

const ALLOW = [
  'https://table.lorefell.com',          // the tools' own address (GitHub Pages custom domain)
  'https://the-loremaster.github.io',
  'https://lorefell.com',
  'https://www.lorefell.com',
  'https://play.lorefell.com'            // the Wix site's address after the early cutover
];

function cors(origin) {
  const ok = ALLOW.indexOf(origin) !== -1;
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOW[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = cors(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    if (request.method === 'GET') {
      return new Response(JSON.stringify({ ok: true, version: 'lorefell-ai-worker-2' }), { headers });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, error: 'POST only' }), { status: 405, headers });
    }

    let opts;
    try { opts = await request.json(); } catch (e) { opts = {}; }
    opts = opts || {};

    try {
      const smart = opts.model !== 'fast';
      const system = String(opts.system || '');
      const body = {
        model: smart ? 'claude-sonnet-5-5' : 'claude-haiku-5-5',
        max_tokens: Math.min(opts.max_tokens || 700, 4000),
        // thinking off: between_tools is Sonnet 5.5's lowest setting, disabled is Haiku 5.5's
        thinking: { type: smart ? 'between_tools' : 'disabled' },
        messages: Array.isArray(opts.messages) ? opts.messages : []
      };
      // the instructions are the part a tool repeats, so they carry the cache mark
      if (system) body.system = [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }];
      // a Sonnet decline in a category another model may answer is retried there by the API
      if (smart) body.fallbacks = 'default';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: Object.assign({
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }, smart ? { 'anthropic-beta': 'server-side-fallback-2026-07-01' } : {}),
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return new Response(JSON.stringify({ ok: false, status: res.status, error: body.slice(0, 300) }), { headers });
      }

      const data = await res.json();
      if (data.stop_reason === 'refusal') {
        return new Response(JSON.stringify({ ok: false, error: 'The AI declined this one. Try wording it differently.' }), { headers });
      }
      const text = (data.content || [])
        .filter(function (x) { return x.type === 'text'; })
        .map(function (x) { return x.text; })
        .join('');
      return new Response(JSON.stringify({ ok: true, text: text }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 502, headers });
    }
  }
};
