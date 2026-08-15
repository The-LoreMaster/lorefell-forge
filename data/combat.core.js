/* LoreFell canon combat formulas. The single source of the foe-derivation math shared by
   ThreadSpire and FateWell, so the two tools cannot drift. Generated into both tools by
   scripts/genCanon.js between the LF_COMBAT markers. Do not hand-edit the copies inside the
   tools; edit HERE and run: node scripts/genCanon.js (then cp docs -> embeds, validate).

   Grounded in the FellGuide (Building Crucibles). One ruling overrides the doc: the weapon
   Bonus Damage is read at the FOE'S level - the Average Party Level shifted by the rating -
   the way a Fell's weapon reads at the Fell's own level, not at a flat party level. */
(function(g){
  var WEAPON_BONUS = { 1:1, 2:1, 3:3, 4:3, 5:6, 6:6, 7:10, 8:10, 9:15, 10:15 };
  var RATING = {
    Minion:   { offset:-2, share:0.5, lore:1, inf:0, aug:0 },
    Elite:    { offset:0,  share:1.0, lore:2, inf:1, aug:0 },
    Champion: { offset:1,  share:1.5, lore:3, inf:2, aug:1 },
    Epic:     { offset:2,  share:2.0, lore:4, inf:3, aug:1 },
    Forsaken: { offset:3,  share:2.5, lore:5, inf:3, aug:2 }
  };
  // Only these six infusions change the numbers; the rest are combat effects.
  var BASE_INF  = { Brutal:'Power', Sharp:'Precision', Potent:'Magic' };
  var BONUS_INF = { Mauling:'Power', Wounding:'Precision', Blighting:'Magic' };

  function rat(sr){ return RATING[sr] || RATING.Elite; }
  function clampLvl(n){ n = n | 0; return n < 1 ? 1 : (n > 10 ? 10 : n); }
  function offset(sr){ return rat(sr).offset; }
  function share(sr){ return rat(sr).share; }
  function infBudget(sr){ return rat(sr).inf; }
  function weaponBonus(lvl){ return WEAPON_BONUS[clampLvl(lvl)] || 1; }

  // The build's two attributes: party level shifted by the rating, min 0. Every other is 0.
  function attrValue(apl, sr){ return Math.max(0, (apl | 0) + offset(sr)); }
  // Vitality: 7 x party level x the rating's share, no dice.
  function vitality(apl, sr){ return Math.max(1, Math.round(7 * Math.max(1, apl | 0) * share(sr))); }
  // The foe's effective level for its weapon bonus: party level + rating offset (min 1).
  function foeLevel(apl, sr){ return Math.max(1, (apl | 0) + offset(sr)); }

  // Which attribute the strike uses: the higher of Magic/Power, tie -> the foe's preference.
  function atkType(attrs, pref){
    var m = (attrs && attrs.Magic) || 0, p = (attrs && attrs.Power) || 0;
    if (m > p) return 'magic';
    if (p > m) return 'physical';
    return (pref === 'magic') ? 'magic' : 'physical';
  }

  // Base = 1 + Power (or Magic). Bonus = weaponBonus at the foe's level. Infusions within the
  // rating's budget add to base/bonus. Returns { base, bonus, type:'physical'|'magical' }.
  function damage(attrs, sr, apl, infusions, pref){
    attrs = attrs || {};
    var t = atkType(attrs, pref);
    var base = 1 + (((t === 'magic') ? attrs.Magic : attrs.Power) || 0);
    var bonus = weaponBonus(foeLevel(apl, sr));
    var list = (infusions || []).slice(0, infBudget(sr));
    for (var i = 0; i < list.length; i++){
      var n = list[i];
      if (BASE_INF[n])  base  += attrs[BASE_INF[n]]  || 0;
      if (BONUS_INF[n]) bonus += attrs[BONUS_INF[n]] || 0;
    }
    return { base: base, bonus: bonus, type: (t === 'magic' ? 'magical' : 'physical') };
  }

  // Average Party Level: mean of the attending Fell levels, rounded to nearest, min 1. 0 = none.
  function apl(levels){
    var v = (levels || []).map(Number).filter(function(n){ return n > 0; });
    if (!v.length) return 0;
    return Math.max(1, Math.round(v.reduce(function(a, b){ return a + b; }, 0) / v.length));
  }
  function skillDifficulty(aplVal){ return Math.floor((aplVal | 0) / 5); }
  function disruptions(size, aplVal){ return (size | 0) + (aplVal | 0); }

  g.LF_COMBAT = {
    WEAPON_BONUS: WEAPON_BONUS, RATING: RATING, BASE_INF: BASE_INF, BONUS_INF: BONUS_INF,
    weaponBonus: weaponBonus, offset: offset, share: share, infBudget: infBudget,
    attrValue: attrValue, vitality: vitality, foeLevel: foeLevel, atkType: atkType,
    damage: damage, apl: apl, skillDifficulty: skillDifficulty, disruptions: disruptions
  };
})(typeof window !== "undefined" ? window : this);
