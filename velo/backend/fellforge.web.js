// backend/fellforge.web.js
// FellForge talks to Claude here. The page bridge relays a "generate" message to
// generateProfile, which asks the Archive for a freshly woken Fell, and a "submit"
// message to saveFell. The embed never holds the key and never writes directly.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';
import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';

const MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM = [
  'You write for LoreFell, a dark grounded weird-fantasy world.',
  'A Fell wakes with no memory of the life they lived before. The player knows only loose fragments.',
  'House style is strict. No em dashes. No en dashes. No semicolons. No ellipses. Short declarative sentences. State facts directly. Dark and grounded. Never whimsical, never hype, never a sales pitch.',
  'Return only a JSON object. No prose around it. No code fences.'
].join(' ');

export const generateProfile = webMethod(Permissions.Anyone, async (character) => {
  const c = character || {};
  const key = await getSecret('ANTHROPIC_API_KEY');
  const res = await fetch(ANTHROPIC_URL, {
    method: 'post',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM,
      messages: [{ role: 'user', content: buildPrompt(c) }]
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('Archive call failed ' + res.status + ' ' + t.slice(0, 200));
  }
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  return parseProfile(text);
});

export const saveFell = webMethod(Permissions.Anyone, async (record) => {
  // Forging a Fell creates a Characters row, not a separate record. The forged
  // identity goes in forgeSeed so FellGlass can open creation pre-filled. The sealed
  // past rides along in its own field, which the player sheet never reads. The full
  // sheet data is written later, by FellGlass autosave, once the character is built.
  const r = record || {};
  let memberId = '';
  try { const m = await currentMember.getMember(); if (m) memberId = m._id; } catch (e) {}
  const forgeSeed = {
    identity: {
      name: r.name || '',
      sex: r.sex || '',
      lineage: r.lineage || '',
      origin: r.origin || '',
      motivation: r.motivation || '',
      desc: r.description || ''
    },
    hooks: r.hooks || '',
    fragments: r.fragments || '',
    firstImpression: r.firstImpression || '',
    tips: r.tips || ''
  };
  const row = {
    charName: r.name || 'Unnamed Fell',
    ownerMemberId: memberId,
    campaign: '',
    campaignId: r.campaignId || '',
    level: 1,
    sealCode: r.sealCode || '',
    forgeSeed: JSON.stringify(forgeSeed),
    sealedPast: r.sealedPast || ''
  };
  const saved = await wixData.insert('Characters', row, { suppressAuth: true });
  return { ok: true, id: saved._id };
});

function buildPrompt(c) {
  const hooks = (c.hooks || []).map((h) => h.type + ': ' + h.text).join('\n');
  const frags = (c.fragments || []).map((f) => f.type + ': ' + f.text).join('\n');
  const lin = (c.lineage && c.lineage.name) || c.lineage || '';
  const ori = (c.origin && c.origin.name) || c.origin || '';
  const mot = (c.motivation && c.motivation.name) || c.motivation || '';
  return [
    'Forge a freshly woken Fell from these pieces. The Fell remembers nothing of their old life.',
    'Sex: ' + (c.sex || 'unspecified'),
    'Lineage: ' + lin,
    'Origin: ' + ori,
    'Motivation: ' + mot,
    'Roleplaying hooks:\n' + hooks,
    'Forgotten fragments:\n' + frags,
    '',
    'Return JSON with exactly these keys:',
    '"description": two or three sentences on who this Fell is now, awake without memory, written in second person.',
    '"firstImpression": one or two sentences on how strangers read them at a glance.',
    '"tips": an array of three short second-person lines on how to play them.',
    '"reveals": an array of three to five lines for the LoreMaster only. Each names one buried truth of the forgotten past that the fragments point toward. The player must never be told these. Keep each one usable as plot, not a riddle.'
  ].join('\n');
}

function parseProfile(text) {
  let t = (text || '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  let o = {};
  try { o = JSON.parse(t); } catch (e) { o = {}; }
  return {
    description: typeof o.description === 'string' ? o.description : '',
    firstImpression: typeof o.firstImpression === 'string' ? o.firstImpression : '',
    tips: Array.isArray(o.tips) ? o.tips.filter((x) => typeof x === 'string') : [],
    reveals: Array.isArray(o.reveals) ? o.reveals.filter((x) => typeof x === 'string') : []
  };
}
