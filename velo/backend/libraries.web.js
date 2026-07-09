// backend/libraries.web.js
// Canon content libraries for FellGlass. The sheet ships placeholders and replaces
// each list only when real rows arrive, so collections can come online one at a time.
// Lineages, infusions, and augmentations are wired from their collections. Origins and
// motivations already match the built-in vocabulary, so they need no feed yet.

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

  // Infusions and augmentations, sent as components so the sheet's existing loader maps
  // them by kind. Infusion attribute is the weapon category it belongs to.
  const components = [];
  try {
    const ri = await wixData.query('Infusions').ascending('displayOrder').limit(300).find({ suppressAuth: true });
    ri.items.forEach((it) => {
      if (it.name) components.push({ kind: 'infusion', name: it.name, description: it.effect || '', use: 'Passive', weaponCat: it.attribute || '', category: it.attribute || '' });
    });
  } catch (e) {}
  try {
    const ra = await wixData.query('Augmentations').ascending('displayOrder').limit(300).find({ suppressAuth: true });
    ra.items.forEach((it) => {
      if (it.name) components.push({ kind: 'augmentation', name: it.name, description: it.effect || '', use: 'Passive', category: it.domain || '' });
    });
  } catch (e) {}
  if (components.length) out.components = components;

  // The weapon trees. Each form carries its own Fellmark Affliction, its grip, and its range,
  // so the sheet reads three of each rather than one for the whole tree.
  try {
    const rw = await wixData.query('CanonWeapons').ascending('displayOrder').limit(50).find({ suppressAuth: true });
    const weapons = rw.items.map((it) => ({
      tree: it.tree || '',
      category: it.category || '',
      formOne: it.formOne || '', formTwo: it.formTwo || '', formThree: it.formThree || '',
      afflictionOne: it.afflictionOne || '', afflictionTwo: it.afflictionTwo || '', afflictionThree: it.afflictionThree || '',
      gripOne: it.gripOne, gripTwo: it.gripTwo, gripThree: it.gripThree,
      rangeOne: it.rangeOne, rangeTwo: it.rangeTwo, rangeThree: it.rangeThree
    })).filter((w) => w.tree);
    if (weapons.length) out.weapons = weapons;
  } catch (e) {}

  return out;
});
