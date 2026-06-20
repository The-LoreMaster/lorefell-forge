// rules.core.js
// The single source of truth for the rule interpreter.
// build.js wraps this for two runtimes:
//   docs/rules.js        browser global window.LF.validate, loaded by the kernel
//   velo/backend/rules.js  ESM export, pasted into the Wix Velo backend
// Never edit the generated copies. Edit here and run: node scripts/build.js
//
// validate(payload, def) -> { legal, errors, warnings, totals }
//   payload = { tier:1..3, form:1..3, selections:["componentId", ...], title?, worldId? }
//   def     = { rules:{budgets,gates,slots,exceptions,modifiers}, components:[...], componentGroups:[...] }

function validate(payload, def) {
  var errors = [], warnings = [];
  var rules = def.rules || {};
  var tier = payload.tier || 1;
  var form = payload.form || 1;

  var byId = {};
  (def.components || []).forEach(function (c) { byId[c.componentId] = c; });
  var chosen = (payload.selections || []).map(function (id) { return byId[id]; }).filter(Boolean);

  var byTier = (rules.budgets && rules.budgets.byTier) || {};
  var band = byTier[String(tier)] || [0, 99];
  var min = band[0], max = band[1];
  (rules.exceptions || []).forEach(function (ex) {
    if (ex.budgetOverride && exactMatch(ex.when, { tier: tier, form: form })) {
      min = ex.budgetOverride[0];
      max = ex.budgetOverride[1];
    }
  });

  var extra = 0;
  chosen.forEach(function (c) {
    (rules.modifiers || []).forEach(function (m) {
      if (m.id === c.componentId && m.effect === "grantExtraPoint") { extra += (m.amount || 0); }
    });
  });
  var maxEff = max + extra;

  var total = chosen.reduce(function (s, c) { return s + (c.cost || 0); }, 0);
  if (total > maxEff) errors.push("Over budget: " + total + " spent, " + maxEff + " allowed.");
  if (total < min) warnings.push("Under budget: " + total + " spent, " + min + " minimum.");

  (rules.slots || []).forEach(function (slot) {
    var n = chosen.filter(function (c) { return c.groupId === slot.from; }).length;
    if (slot.selection === "exactlyOne" && n !== 1) errors.push("Choose exactly one from " + slot.from + ".");
    if (slot.selection === "atLeastOne" && n < 1) errors.push("Choose at least one from " + slot.from + ".");
    if (slot.selection === "maxOf" && n > (slot.count || 0)) errors.push("At most " + (slot.count || 0) + " from " + slot.from + ".");
  });

  chosen.forEach(function (c) {
    (c.categories || []).forEach(function (cat) {
      var gate = (rules.gates || []).filter(function (g) { return g.category === cat; })[0];
      if (gate && !meets(gate.requires, { tier: tier, form: form })) {
        errors.push((c.label || c.componentId) + " needs " + describe(gate.requires) + ".");
      }
    });
  });

  return {
    legal: errors.length === 0,
    errors: errors,
    warnings: warnings,
    totals: { cost: total, budget: [min, maxEff], extraPoints: extra }
  };
}

function exactMatch(when, ctx) {
  if (!when) return false;
  return Object.keys(when).every(function (k) { return ctx[k] === when[k]; });
}

function meets(req, ctx) {
  if (!req) return true;
  if (req.anyOf) return req.anyOf.some(function (r) { return meets(r, ctx); });
  if (req.allOf) return req.allOf.every(function (r) { return meets(r, ctx); });
  return Object.keys(req).every(function (k) {
    if (k === "tier") return ctx.tier >= req.tier;
    if (k === "form") return ctx.form >= req.form;
    return ctx[k] === req[k];
  });
}

function describe(req) {
  if (!req) return "";
  if (req.anyOf) return req.anyOf.map(describe).join(" or ");
  if (req.allOf) return req.allOf.map(describe).join(" and ");
  return Object.keys(req).map(function (k) {
    if (k === "tier") return "tier " + req.tier + " or higher";
    if (k === "form") return "form " + req.form + " or higher";
    return k + " " + req[k];
  }).join(", ");
}
