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

   The ALLOW list restricts who may call it. Keep it tight. */

const ALLOW = [
  'https://the-loremaster.github.io',
  'https://lorefell.com',
  'https://www.lorefell.com'
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
      return new Response(JSON.stringify({ ok: true, version: 'lorefell-ai-worker-1' }), { headers });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, error: 'POST only' }), { status: 405, headers });
    }

    let opts;
    try { opts = await request.json(); } catch (e) { opts = {}; }
    opts = opts || {};

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: opts.model === 'fast' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6',
          max_tokens: Math.min(opts.max_tokens || 700, 4000),
          system: opts.system || '',
          messages: Array.isArray(opts.messages) ? opts.messages : []
        })
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return new Response(JSON.stringify({ ok: false, status: res.status, error: body.slice(0, 300) }), { headers });
      }

      const data = await res.json();
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
