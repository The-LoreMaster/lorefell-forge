# CLAUDE.md for lorefell-forge

This repository holds the fellguide.com web tools. It is the master rule list for work
here. `FACTS.md`, `SYNC_RUNBOOK.md` and `CANON_SOURCES.md` stay the authority on what they
cover; this file does not restate them. Nate beats everything, including this file.

## Standing rules

### 1. One character sheet: FellGlass and ThreadSpire never diverge

Any change to the FellGlass character sheet ships in the ThreadSpire character sheet in
the same change, including the view the LoreMaster opens on a player's Fell. That covers
design (layout, styling, wording, icons, order) and function (fields, buttons, edits,
saves, rolls). There is no "FellGlass now, ThreadSpire later." A change that lands in one
and not the other is not done.

The one sanctioned difference is navigation. FellGlass navigates with its own hub; in
ThreadSpire the player uses the rail on the right and the LoreMaster uses the tab bar
across the top. The player's Arsenal tabs (Weapons, Lorebounds, Armor) are drawn inside the
sheet under the stat strip, via the `ts-subtabs` message; that row is navigation too and
never appears standalone. Everything else inside the sheet is identical.

How it is wired, so the rule can be kept rather than remembered:

- ThreadSpire does not have its own sheet. `#sheetFrame` in `threadspire.html` loads
  `fellglass.html?host=threadspire`. The player sheet and the LoreMaster view
  (`lmOpenFell`, `godShow`, the `ts-god` message) are both that one FellGlass page.
  Never build a second sheet or port sheet markup into ThreadSpire.
- Divergence can only come from the seams, so every sheet change checks all three:
  1. The `?host=threadspire` style block in `fellglass.html`. It hides FellGlass's own
     navigation (`#hub`, `#hubBtn`, `#charSwitch`) and styles the frame's scrollbar.
     Nothing else. No card styling, no hidden titles, no hidden header fields.
  2. `ts-god` in `fellglass.html`: the LoreMaster flag. It is the same LoreMaster mode
     FellGlass has on its own page, so what it adds (such as Max Vitality (LM)) shows in
     both places alike.
  3. `GOD_TABS` in `threadspire.html`: the LoreMaster's tab bar. It is every FellGlass
     panel in `PANELS`, same order, same names. The sheet reports its panel back with a
     `sheet-panel` message so the bar stays lit on the right tab.
- Host plumbing that is not sheet design and may stay: height reporting
  (`tsPostHeight`), no automatic character creation in the frame, and `cbOnTable`
  sending combat to ThreadSpire's table instead of the sheet's banner.
- Any new difference is a design ruling for Nate. Ask first.

`threadspire/tests/sheet-parity.test.js` (in `npm run checks`) fails if the tab bar and
`PANELS` differ or if the style block does anything beyond the list above.

Verification for any sheet change: the ThreadSpire harness sheet specs
(`threadspire/harness/specs/_sheet.js` and the `*sheet*` specs) pass, and the change is
checked in ThreadSpire both as the player and as the LoreMaster opening that Fell.
`docs/` and `embeds/` copies of both tools stay byte-identical.
