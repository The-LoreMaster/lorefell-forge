// scripts/lib/wixClient.js
// Thin wrapper over the Wix Data v2 REST API. Reads credentials from the environment,
// which in CI come from the repo's encrypted Actions secrets. Node 18+ (global fetch).
//
// Requests are paced and retried. Wix enforces a per-minute write quota (WDE0014); a
// fixed minimum gap between calls keeps us under it, and 429 or transient 5xx responses
// back off and retry, honoring Retry-After when present. Tune with WIX_MIN_GAP_MS and
// WIX_MAX_RETRIES if a plan's quota differs.

const API = "https://www.wixapis.com";

const MIN_GAP_MS = Number(process.env.WIX_MIN_GAP_MS || 400);
const MAX_RETRIES = Number(process.env.WIX_MAX_RETRIES || 6);

let lastCallAt = 0;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function backoff(attempt, retryAfterSec) {
  if (retryAfterSec && !isNaN(retryAfterSec) && retryAfterSec > 0) {
    return Math.min(retryAfterSec * 1000, 30000) + 250;
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
      if (attempt < MAX_RETRIES) { attempt++; await sleep(backoff(attempt, null)); continue; }
      return { ok: false, status: 0, json: { error: String(e) }, text: String(e) };
    }

    if ((res.status === 429 || res.status === 503 || res.status === 502) && attempt < MAX_RETRIES) {
      attempt++;
      const ra = res.headers && res.headers.get ? Number(res.headers.get("retry-after")) : NaN;
      await sleep(backoff(attempt, ra));
      continue;
    }
    return { ok: res.ok, status: res.status, json: json, text: text };
  }
}

module.exports = { req, env, API };
