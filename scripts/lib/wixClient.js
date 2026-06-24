// scripts/lib/wixClient.js
// Thin wrapper over the Wix Data v2 REST API. Reads credentials from the environment,
// which in CI come from the repo's encrypted Actions secrets. Node 18+ (global fetch).
//
// Requests are paced and retried. Wix enforces a per-minute write quota (WDE0014). A
// fixed minimum gap between calls keeps throughput under typical caps, and a 429 climbs
// its backoff fast enough that the cumulative wait crosses a full minute window within
// the retry budget, so the quota resets and the call succeeds. Transient 5xx use a
// gentler curve. Retry-After is honored when present. Tune with WIX_MIN_GAP_MS,
// WIX_MAX_RETRIES.

const API = "https://www.wixapis.com";

const MIN_GAP_MS = Number(process.env.WIX_MIN_GAP_MS || 500);
const MAX_RETRIES = Number(process.env.WIX_MAX_RETRIES || 8);

let lastCallAt = 0;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function backoff(attempt, retryAfterSec, isQuota) {
  if (retryAfterSec && !isNaN(retryAfterSec) && retryAfterSec > 0) {
    return Math.min(retryAfterSec * 1000, 30000) + 250;
  }
  if (isQuota) {
    // 4s, 8s, 16s, 30s, 30s... cumulative crosses a 60s window by the 4th try.
    return Math.min(4000 * Math.pow(2, attempt - 1), 30000) + Math.floor(Math.random() * 400);
  }
  return Math.min(1000 * Math.pow(2, attempt - 1), 30000) + Math.floor(Math.random() * 250);
}

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error("Missing required env var: " + name);
  return v;
}

function headers() {
  const h = {
    "Authorization": env("WIX_API_KEY"),
    "wix-site-id": env("WIX_SITE_ID"),
    "Content-Type": "application/json"
  };
  if (process.env.WIX_ACCOUNT_ID) h["wix-account-id"] = process.env.WIX_ACCOUNT_ID;
  return h;
}

async function req(method, path, body) {
  const since = Date.now() - lastCallAt;
  if (since < MIN_GAP_MS) await sleep(MIN_GAP_MS - since);

  let attempt = 0;
  while (true) {
    lastCallAt = Date.now();
    let res, text, json;
    try {
      res = await fetch(API + path, {
        method: method,
        headers: headers(),
        body: body ? JSON.stringify(body) : undefined
      });
      text = await res.text();
      try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { raw: text }; }
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        attempt++;
        const w = backoff(attempt, null, false);
        console.error("network error, retry " + attempt + "/" + MAX_RETRIES + " in " + Math.round(w / 1000) + "s");
        await sleep(w);
        continue;
      }
      return { ok: false, status: 0, json: { error: String(e) }, text: String(e) };
    }

    if ((res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504 || res.status === 408) && attempt < MAX_RETRIES) {
      attempt++;
      const ra = res.headers && res.headers.get ? Number(res.headers.get("retry-after")) : NaN;
      const w = backoff(attempt, ra, res.status === 429);
      console.error((res.status === 429 ? "rate limited (" : "server busy (") + res.status + "), retry " + attempt + "/" + MAX_RETRIES + " in " + Math.round(w / 1000) + "s");
      await sleep(w);
      continue;
    }
    return { ok: res.ok, status: res.status, json: json, text: text };
  }
}

module.exports = { req, env, API };
