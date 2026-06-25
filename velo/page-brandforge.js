// The BrandForge page code.
// Relays lineage/world/brand submissions and the lineage catalog to the shared backend.
// Set EMBED to your Embed a Site element ID (Wix default is often #html1).

import { submitCreation, getCreations, getCatalog } from 'backend/forge.web.js';
import { uploadRune } from 'backend/loreforge.web.js';
import { currentMember } from 'wix-members-frontend';

const FORGE_KEY = 'brandforge';
const EMBED = '#html1';

function imgData(image) {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.dataUrl || '';
}

function lineageText(it) {
  const lines = [];
  if (it.bonus) lines.push('Bonus: ' + it.bonus);
  if (it.homeWorld) lines.push('Home world: ' + it.homeWorld);
  if (it.body) lines.push('', it.body);
  if (it.roleplay) lines.push('', 'Roleplaying. ' + it.roleplay);
  return lines.join('\n');
}
function worldText(it) {
  const g = it.glance || {};
  const lines = [];
  if (g.lineage) lines.push('Lineage: ' + g.lineage);
  if (g.brand) lines.push('Brand: ' + g.brand);
  if (it.overview) lines.push('', it.overview);
  if (it.people) lines.push('', 'The people. ' + it.people);
  if (it.magic) lines.push('', 'The magic. ' + it.magic);
  return lines.join('\n');
}
function brandText(it) {
  const lines = [];
  if (it.practiceLong) lines.push('Practice: ' + it.practiceLong + (it.practiceShort ? (' (' + it.practiceShort + ')') : ''));
  if (it.lore) lines.push('', it.lore);
  if (it.inBattle) lines.push('', 'In battle. ' + it.inBattle);
  if (it.greaterWake) lines.push('', 'Greater Wake. ' + it.greaterWake);
  const lw = it.lesserWake;
  if (lw && lw.name) lines.push('', 'Lesser Wake. ' + lw.name + '. ' + (lw.effect || '') + (lw.breakout ? (' Breaks out on ' + lw.breakout + '.') : ''));
  const ob = Array.isArray(it.outsideBattle) ? it.outsideBattle.filter(Boolean) : [];
  if (ob.length) lines.push('', 'Outside battle: ' + ob.join(' '));
  return lines.join('\n');
}

async function submitItem(it, groupId, creator) {
  let imageUrl = '';
  const raw = imgData(it.image);
  if (raw) { try { imageUrl = await uploadRune(raw, uniqName(it.name || it.kind)); } catch (e) { imageUrl = ''; } }

  let fullText = '', shorthand = '', meta = { kind: it.kind, creator: creator, groupId: groupId || '' };
  if (it.kind === 'lineage') {
    fullText = lineageText(it); shorthand = it.bonus || '';
    Object.assign(meta, { bonus: it.bonus || '', bonusType: it.bonusType || '', bonusValue: it.bonusValue || '',
      homeWorld: it.homeWorld || '', body: it.body || '', roleplay: it.roleplay || '' });
  } else if (it.kind === 'world') {
    fullText = worldText(it); shorthand = (it.glance && it.glance.lineage) || '';
    Object.assign(meta, { glance: it.glance || {}, overview: it.overview || '', people: it.people || '',
      magic: it.magic || '', architecture: it.architecture || '', faith: it.faith || '', life: it.life || '' });
  } else {
    fullText = brandText(it); shorthand = it.practiceLong || '';
    Object.assign(meta, { practiceLong: it.practiceLong || '', practiceShort: it.practiceShort || '',
      lore: it.lore || '', inBattle: it.inBattle || '', greaterWake: it.greaterWake || '',
      lesserWake: it.lesserWake || null, outsideBattle: it.outsideBattle || [] });
  }
  const payload = {
    kind: it.kind, title: String(it.name || '').slice(0, 120),
    shorthand: shorthand, fullText: fullText, imageUrl: imageUrl, selections: [], meta: meta
  };
  return submitCreation(FORGE_KEY, payload);
}


// Every uploaded image gets a unique media name so two uploads can never collide
// and overwrite each other (a same-name upload can replace the prior file).
function uniqName(base) {
  return String(base || 'img').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 40)
    + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

$w.onReady(() => {
  const embed = $w(EMBED);

  embed.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'BRAND_CATALOG_LOAD') {
      // The catalog is the canon reference. Community submissions go to LoreForge for the vote, not here.
      let canon = [];
      try {
        const rows = await getCatalog('Lineages', { limit: 200 });
        canon = (rows || [])
          .filter(function (r) { return (r.name || '') !== 'The Unwritten'; })
          .map(function (r) {
            return { name: r.name || '', bonus: r.bonus || '', homeWorld: r.homeWorld || '',
              body: r.body || '', roleplay: r.roleplay || '', image: r.image || '' };
          });
      } catch (e) { canon = []; }
      embed.postMessage({ type: 'BRAND_CATALOG', lineages: canon });
      return;
    }

    if (msg.type === 'BRANDFORGE_SUBMIT') {
      const p = msg.payload || {};
      const items = Array.isArray(p.items) ? p.items : [];
      let creator = '';
      try { const me = await currentMember.getMember(); if (me) creator = (me.profile && me.profile.nickname) || ''; } catch (e) {}
      let ok = true, errors = [];
      for (const it of items) {
        try { const res = await submitItem(it, p.groupId, creator); if (!res || !res.ok) { ok = false; errors = errors.concat(res && res.errors ? res.errors : ['Rejected.']); } }
        catch (e) { ok = false; errors.push('The forge could not reach the vault.'); }
      }
      embed.postMessage({ type: 'BRANDFORGE_SUBMIT_RESULT', ok: ok, error: errors[0] || '' });
    }
  });
});
