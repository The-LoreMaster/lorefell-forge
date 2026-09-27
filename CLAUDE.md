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

How it is wired, so the rule can be kept rather than remembered:

- ThreadSpire does not have its own sheet. `#sheetFrame` in `threadspire.html` loads
  `fellglass.html?host=threadspire`. The player sheet and the LoreMaster view
  (`lmOpenFell`, `godShow`, the `ts-god` message) are both that one FellGlass page.
  Never build a second sheet or port sheet markup into ThreadSpire.
- Divergence can only come from the seams, so every sheet change checks all three:
  1. `tsembed` in `fellglass.html`: the `?host=threadspire` style block and every
     `body.tsembed` branch. These hide FellGlass chrome that ThreadSpire replaces with its
     own (portrait, id, stat strip, hub, character switcher, first card title). Nothing
     else may be hidden or restyled there.
  2. `ts-god` in `fellglass.html`: the LoreMaster flag. It may change who is allowed to
     edit. It may not change what the sheet looks like or what it can do.
  3. `GOD_TABS` in `threadspire.html`: the LoreMaster's panel bar. A new, renamed or
     reordered FellGlass panel is mirrored there in the same change.
- Any new exception to the above (something hidden, restyled or missing in ThreadSpire)
  is a design ruling for Nate. Ask, then record the ruling in the list below.

Recorded exceptions:

- *Pending ruling:* `GOD_TABS` omits the `battle` and `notes` panels that FellGlass has.

Verification for any sheet change: the ThreadSpire harness sheet specs
(`threadspire/harness/specs/_sheet.js` and the `*sheet*` specs) pass, and the change is
checked in ThreadSpire both as the player and as the LoreMaster opening that Fell.
`docs/` and `embeds/` copies of both tools stay byte-identical.
