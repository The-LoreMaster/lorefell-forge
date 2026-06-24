// backend/libraries.web.js
// Canon content libraries for FellGlass. The sheet ships placeholders and replaces
// each list only when real rows arrive, so collections can come online one at a time.
// Lineages is wired now. Origins and motivations already match the built-in vocabulary,
// so they need no feed yet. Add a block here as each collection lands.

import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';

export const getLibraries = webMethod(Permissions.Anyone, async () => {
  const out = {};
  try {
    const r = await wixData.query('Lineages')
      .ascending('displayOrder').limit(200).find({ suppressAuth: true });
    const lineages = r.items.map((it) => ({
      name: it.name || '',
      description: it.body || '',
      bonusType: it.bonusType || 'skill',
      bonusName: it.bonusValue || ''
    })).filter((l) => l.name);
    if (lineages.length) out.lineages = lineages;
  } catch (e) {}
  return out;
});
