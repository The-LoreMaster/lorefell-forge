// backend/libraries.web.js
// Canon content libraries for FellGlass. The sheet ships placeholders and replaces
// each list only when real rows arrive, so collections can come online one at a time.
// Lineages, infusions, and augmentations are wired from their collections. Origins and
// motivations ship as canon inside the sheet and are overridden here only when their
// collections actually hold rows, so nothing breaks before they are filled in.
//
// The sheet drops any row whose attribute is not one of the eight it knows, so the
// attribute column must hold the lowercase id (precision, power, magic, vigor, wit,
// evasion, durability, resistance) rather than a display name.

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

  // Origins. The sheet already carries the eight as canon, so an empty or missing
  // collection leaves those standing rather than emptying the dropdown.
  try {
    const ro = await wixData.query('Origins')
      .ascending('displayOrder').limit(200).find({ suppressAuth: true });
    const origins = ro.items.map((it) => ({
      name: it.name || '',
      attr: String(it.attribute || it.attr || '').trim().toLowerCase(),
      description: it.body || it.description || ''
    })).filter((o) => o.name && o.attr);
    if (origins.length) out.origins = origins;
  } catch (e) {}

  // Motivations. titleEarned is the Title the vow pays out when its three skills are
  // walked to four masteries each.
  try {
    const rmo = await wixData.query('Motivations')
      .ascending('displayOrder').limit(200).find({ suppressAuth: true });
    const motivations = rmo.items.map((it) => ({
      name: it.name || '',
      attr: String(it.attribute || it.attr || '').trim().toLowerCase(),
      titleEarned: it.titleEarned || it.title || ''
    })).filter((m) => m.name && m.attr);
    if (motivations.length) out.motivations = motivations;
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

  // Utilities: the shelf the RelicForge fills. The sheet had four placeholders written into
  // it, so a Fell could carry nothing that actually exists in the game.
  try {
    const ru = await wixData.query('Relics').ascending('displayOrder').limit(500).find({ suppressAuth: true });
    const utilities = ru.items.map((it) => ({
      id: it._id,
      name: it.name || '',
      use: it.use || 'Out of Combat',
      description: it.description || '',
      veiled: it.veiled || '',
      group: it.group || '',
      rarity: it.rarity || '',
      uses: it.uses || ''
    })).filter((u) => u.name);
    if (utilities.length) out.utilities = utilities;
  } catch (e) {}

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
