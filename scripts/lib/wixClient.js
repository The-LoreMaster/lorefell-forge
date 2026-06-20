// scripts/lib/wixClient.js
// Thin wrapper over the Wix Data v2 REST API. Reads credentials from the environment,
// which in CI come from the repo's encrypted Actions secrets. Node 18+ (global fetch).

const API = "https://www.wixapis.com";

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
  const res = await fetch(API + path, {
    method: method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json: json, text: text };
}

module.exports = { req, env, API };
