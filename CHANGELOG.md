# LoreFell Forge Change Log

Build batches pushed to this repo, newest at the top. The apply workflow is manual, so a push here changes the repo only. Collections change in Wix when the apply workflow runs.

## Infrastructure — the real break, Wix trims whitespace
- Root cause found. Wix TEXT fields strip leading and trailing whitespace on write. Several 90KB chunks began or ended on a space or newline, so the stored parts lost those characters and the reassembled document fused tokens across the joins, throwing a script error at parse. The app never rendered and only the static feedback widget showed. FellGlass’s info total read 149 characters short, which was the trimmed whitespace.
- Fix: the seeder base64 encodes every chunk so Wix cannot alter the bytes, tagged enc b64 on each row, and get_embed decodes UTF-8 safe on reassembly while still reading legacy plain rows. The info diagnostic now reports the encoding and the decoded sizes, which will match the file exactly.
- One paste: http-functions.js. The Apply run reseeds the rows base64 encoded.

## Infrastructure — embed serving hardened after the break
- Root cause of the broken pages: the SiteEmbeds collection had no parts column, Wix silently dropped the field, and get_embed served FateWell’s first chunk alone, a dead app showing only its static feedback widget. FellGlass’s single large row points at a storage cap or sanitizer above the sizes the pattern had proven.
- get_embed no longer depends on any field. It always looks for part rows and reassembles in numeric order, and a diagnostic mode at ?slug=name&info=1 reports stored head and part sizes as plain text.
- The seeder chunks at 90KB, safely under any plausible field cap, and removes stale part rows when a tool shrinks. A formal SiteEmbeds schema defines slug, title, html, and parts so the count persists.
- One paste: http-functions.js again. Then the info URLs verify what Wix actually stored.

## Infrastructure — FateWell and FellGlass move to CMS serving
- Both combat tools join the SiteEmbeds slug pattern. seedEmbeds already carries every file in embeds, so the rows fill on the next Action run, and a new lightweight Seed Embeds workflow refreshes the rows on every push that touches embeds. Tool updates reach lorefell.com with no Wix edits and no dependence on GitHub Pages deploys.
- Large tools now split across part rows. A data item caps near 512KB and FateWell sits at 436KB and growing, so the seeder chunks big files with a parts count on the head row, and get_embed reassembles them in order. Small tools keep a single row unchanged.
- One paste: velo/backend/http-functions.js gains the reassembly. Then repoint the FateWell and FellGlass embeds to the slug URLs and publish once, the last Wix edit these tools need.

## FateWell — the spine bows to the tier you stand in
- On phones the mast aligns left, clear of the save badge.
- The Adventure to Scene spine drops the sideways scroll for a bowing layout: the tier you stand in stretches to show its full name, and the other record types wait as slim labeled stubs on either side, each still one tap away.
- FateWell only, styles only. Refresh with the new head, nothing to paste.

## FateWell — mobile stops elbowing itself
- The save stamp becomes a small navy badge at the top right instead of loose text floating over the mast and headings, one line on phones, with the mast and page headings nudged clear.
- Adventures, Search, Library, and Settings fit their nav cells. The labels sized down until nothing clips.
- The Adventure to Scene spine scrolls sideways on phones. Each tier keeps a readable width instead of four tiles crushing each other into truncation.
- The scene runner strip lays out as an ordered grid on phones: Log beside Roll d6, Escalate or Return full width, Mark scene complete full width, and the beat arrows as a paired row beneath. No more centered scatter.
- FateWell only, styles only. Refresh with the new head, nothing to paste.

## FellGlass — the hand holds still, the React list fills itself
- Picking a card no longer throws the rail back to the left. The hand keeps its scroll position across every re-render, so the chosen card stays under your thumb.
- The React select now stands on its own instead of leaning on the arsenal builder. Movement is always offered, and every lorebound on the sheet contributes its Aspect, tagged Lorebound, whether or not the arsenal tab has rendered this session. Choosing the lorebound raises the full staged Aspect card as built.
- FellGlass only. Refresh with the new head, nothing to paste.

## FellGlass — the arsenal deals as cards
- The declare form’s Act select gives way to the dealt hand. Pill choices for Attack, Change Stance, Use a skill, and Use an item, and the hand deals only what the choice calls for. Attack deals weapon and lorebound cards, and only those the charge can pay for: nothing past the earned Tier renders at all. Stance deals the three armor cards with tiers lit by charge, worn marked, and the pick noting it adopts on Send and spends the Act. Items deal as cards from the pack. Skills stay a list.
- Nothing beneath changed. The native selects remain in the document as the state the cards drive, so the dice ritual, Fellmark bonus die, target select, damage and affliction hints, draft safety, Send, the locked view, staging, and the LoreMaster mirror all run the same code they ran yesterday.
- At Resolution the lorebound React’s small text hint grows into the full Aspect card, Initial to Crown staged by charge with committed picks shown, and the card renders an art plate only when the row carries an image.
- The hand folds at round end with everything else.
- FellGlass only. Refresh with the new head, nothing to paste.

## Prototype two — the hand deals only what the choice calls for
- proto-arsenal-glass.html mocks the dealt hand inside the FellGlass declare flow. The hand stays folded until an Act is chosen: Attack deals the weapon and spell cards, Change Stance deals the three stance cards, and during Resolution the Aspect card deals only when the lorebound React is called. Skills and items stay lists, and Movement is a plain line.
- Picking a card declares it: gold rim, a Declared footer, a target select, a dashed summary, and a Send to the LoreMaster button, mirroring the real flow.
- Art plates render only when the collection row carries an image. Basic Attack, Last Cairn, Emberlash, and all three stances open straight at their names with no placeholder, while Riven Edge, Skysplitter Arc, and the Aerostrix wear their plates with source tags.
- Cards deal in with a short staggered lift, stilled under reduced motion. Prototype only, nothing wired.

## Prototype — the arsenal dealt as cards
- A standalone prototype at proto-arsenal.html, not wired to FateWell. One Fell’s combat arsenal as a hand of cards: weapon abilities and a spell with Tier rails, the lorebound Aspect as a staged React card built from the real Aerostrix Augury data, and the three armor stances with cumulative tier rows and a Switch that names its Act cost.
- The charge fixture at the top drives the whole hand. Tap the pips and locked abilities lift their veil, aspect stages light Initial to Crown, and stance tiers kindle in order. Tier pips on every card speak the same glyph language as the meter.
- Each art plate carries a corner tag naming the Wix collection and image field that feeds it in a real build: Creations img for forged abilities, the CanonAspects art for lorebounds, site art for stances. Tapping a card raises it with the full source mapping.
- Prototype only. FateWell untouched.

## FateWell — the table reads itself
- Loot and rewards leave the scene runner entirely. Rewards join combat in a later build.
- Scene cards wear readiness chips: Empty in ember, the foe count in ice, Ran in gold once a battle has history. A session’s prep state reads in one sweep.
- The runner head carries attendance chips. Tap a player’s name to mark them at the table or away, mid-session, without the Roster dive. Combat fighters follow the toggle.
- The glossary wakes by default with twenty seeded canon terms, Fellmark to Lorebound, gold and clickable wherever prose renders: note bodies, beats, card descriptions, and the recap. Common words like Act, Round, and Charge match case sensitively so plain speech stays plain. Rows in the Glossary collection override the seed, and the settings toggle still turns it all off.
- The recap modal gains Copy for Discord: session name bold, scenes underlined, beats as list lines, ready to paste.
- Adventure-wide search was already live in the bottom navigation, covering acts, sessions, scenes, notes, play logs, the library, and the glossary.
- FateWell only. Refresh with the new head, nothing to paste.

## FateWell — the spine holds its colors, cards drop the empty frame
- The Adventure, Act, Session, and Scene labels stay one color everywhere: silver on every tier, gold on the one you stand in, unchanged by tapping. Root cause: the labels pointed at a silver-dim variable FateWell never defined, so the color fell through to browser button defaults, black on filled tiers and grey on empty ones. The variable now exists and the spine pins its colors explicitly, including active and focus states.
- Grid cards without an image no longer draw the placeholder frame and glyph. The scene number moves inline beside the title and the card starts at its text. Set a cover through the card menu as before.
- FateWell only. Refresh with the new head, nothing to paste.

## Combat — orders that show their work
- Call for a reroll now defines itself on both boards. It keeps the player's Act but wipes their roll: the order clears the roll on their FellGlass with a gold ping and reopens their form to reroll and resend, and the LoreMaster board wipes the mirrored roll and accuracy at the same moment so the effect is visible where the button was pressed.
- Reset their Act joins the player popup. It blanks the whole declaration. The player's FellGlass posts a cleared declare so every board agrees, then opens on an empty form with a gold ping asking them to choose again. The LoreMaster board blanks the mirror instantly.
- Lucky and Unlucky wear the same face, Cinzel uppercase with matched spacing, differing only by color when lit.
- The runner action strip spans the top. The idle tap to roll caption is gone, rolled results still show, the redundant Quick d6 is removed since Roll d6 lives in the same strip, and Mark scene complete stretches to fill the right.
- The FellGlass rail die sits beside Your sheet in a right cluster labeled Generic Roll, sized up for thumbs with touch handling for mobile.
- FellGlass and FateWell. Refresh with the new head, nothing to paste.

## Combat — the round ends on a blank slate
- Begin next round clears every choice on both boards. Foe Act selects return to None instead of forcing Attack, the target select returns to Choose a target instead of auto-filling the first player, and the full player mirror wipes: act, react, target, rolls, accuracy, damage, kind, tier, foe evasion snapshots, and luck marks.
- FellGlass opens the new round truly empty. The kept declaration clears with the tick, so the declare form no longer preselects last round's Act and target, and the Fellmark bonus die resets with the rest.
- FellGlass and FateWell. Refresh with the new head, nothing to paste.

## FateWell — evasion in the box, staging says so
- The manual roll label no longer stacks one word per line. Commit labels sized themselves at the old 46 pixel column width.
- Each attacking player already gets their own gold box against the foe, and now each box carries its own dice at the right: the foe's Evasion die that tumbles on tap, or the 1 to 6 strip when the dice mode is set to manual entry, with a fresh setter for table faces.
- Apply is gone as a word. The hit state shows Will land N plus rider when the round ends, the button reads Stage, the toast says staged and cements at round end, and once staged the box stays visible with a dashed Staged, lands at round end tag instead of vanishing.
- FateWell only. Refresh with the new head, nothing to paste.

## Combat — one Act menu, one dice ritual, React waits for Resolution
- FateWell foes commit through a single grouped Act select in the FellGlass style: None, then Attack holding the standard attack and every ability with Tier gating, then Standard holding Change Stance, Use a skill, and Use an item when carried. Stance and item pickers appear beneath as their own labeled rows.
- The accuracy row wears the FellGlass ritual. The label reads Roll the Dice or enter manually and tapping it flips between the tumbling die and the 1 to 6 strip.
- React belongs to Resolution now, both tools. FellGlass drops the React picker from the declare form. Once the round resolves, the card offers the React select with the lorebound stage hint and a Declare your React button that rides the kept declaration to the LoreMaster, logs, and marks the React spent. FateWell foes get the same shape: a React select of their React abilities plus Movement with a Use React button, logged and toasted, with Restore on the spent state.
- The Spotlight sheds attack rolls. Foe cards show an Evasion line only: the player's relayed roll against the committed accuracy, Hit or Evaded, waiting text until the roll arrives, and an Open Commit link if accuracy was never set. Condition chips on cards are read-only tags now, appearing only when something is marked. Adding and clearing lives in the token popup.
- Popup fixes: the foe popup shows its Accuracy so Clear accuracy visibly empties it, with a toast confirming. Intent is gone. The Durability and Resistance editor is gone. Mark and the reroll controls are real buttons, and marking toasts and shows player-bound conditions as sent until the sheet confirms.
- The quick d6 moved beside Mark scene complete with a Quick d6 label, out of the combat head.
- FellGlass and FateWell. Refresh with the new head, nothing to paste.

## FateWell — the Spotlight breathes
- Accuracy rolls at Commit, always. Attacking foes carry an Accuracy row in their commit card: a FellGlass-style die that tumbles on tap, a 1 to 6 strip for table dice, and a readout with the total, the luck dice, and Fellmark or Fellstrike calls. Targeting a player still pre-rolls it. Evasion stays a Resolve matter, rolled by the player and settled on the card.
- Resolve declutters to the FellGlass shape. The Spotlight controls fold into the gold box head as a small Auto and Manual toggle beside Undo, Reset, and Resolve these Acts. The On the field pile of full cards is gone. Waiting combatants are one slim row each, name plus Act and target, tap for the full popup, with an Add link in manual mode. Resolved rows and the count remain. The footer quick roll leaves, the stage head die covers it.
- The portrait thumb on commit rows is gone. That floating letter was the image fallback showing the first letter of the foe's name.
- If accuracy is missing at Resolve, the card offers the same big die and strip with Roll the accuracy, tap the die. Rolled accuracy reads as a line with the evasion outcome and a Reroll link.
- Foe stance shows as a chip beside the charge pips on the card. The tier effects text moved to the popup under Stance.
- FateWell only. Refresh with the new head, nothing to paste.

## Combat — the LoreMaster's hands move to the cards, foes carry their Acts
- Fixed: foe Acts vanished in resolve. The resolve card read the legacy act field while the commit picker writes intent, so every foe said No Act on record. Acts now compose from the committed intent, and declares re-ingest after any phase or round shift.
- FateWell commit rows read like FellGlass: the Intent label is Act, labels stack above full-width selects.
- All manual LoreMaster work lives in the token popup, reachable any phase, so Lucky and Unlucky land before dice are thrown: Vitality plus and minus, luck marks, forced rerolls (foes clear accuracy, Fell get a call that clears their roll and reopens their declare with a gold ping), marking any canon Affliction or Effect from a grouped picker, clearing foe conditions, foe Durability, Resistance, and Fellmark controls, and the deal-damage row for players. The popup refreshes live after every action.
- Resolve cards slim to resolution: read-only Vitality and charge pips up top, stance, chips, staged outcomes, the Act on record, foe accuracy, incoming hits, Impairment prompts, and React. The Adjust drawer is gone.
- Both tools list Reacts on hand. Foe cards read React-use abilities plus Movement. Fell cards read lorebounds from gear plus Movement, Assist an ally, and Any skill. FellGlass gains a real React picker in the declare form, drawn from the arsenal with lorebound Aspects tagged, and picking an Aspect wakes the staged hint: Initial, Branch, or Crown by charge, Everpresent at ten.
- FellGlass refuses to send a damaging Act without an accuracy roll.
- Generic d6 in both tools: a die in the FellGlass rail that pings and writes to the shared log, and one in the FateWell stage head that logs LoreMaster d6 results.
- FellGlass and FateWell. Refresh with the new head, nothing to paste.

## FateWell — dice the FellGuide way, popups in view, guides folded
- The combatant popup anchors to the top of the screen you are looking at. It was centering inside the full-height iframe, which in flow mode is the whole page, so center meant far off screen on phones.
- The Manual and Auto dice toggle is gone. It only decided whether the tool rolled two dice silently, the Fellmark bonus on hits you deal and the Impairment on a double Fellmark. Both are now visible controls in the FellGuide way: a small die to tap or a 1 to 6 strip for table dice. Sending a hit with the bonus unrolled rolls it loudly, toasted and logged. A double Fellmark always raises the Impairment prompt on the card, die or strip, and it applies the chosen face.
- The Commit and Spotlight explanations fold into gold info circles. Tap to read, tap to close.
- The Impairment prompt moved from the Adjust drawer into the card's primary flow so it cannot hide while pending. Mobile combat padding tightened.
- FateWell only. Refresh with the new head, nothing to paste.

## FateWell — clean stat popups that flip
- Durability in play and Resistance in play are gone from the foe popup. The attribute grid already carries both.
- Ability costs are gone for good. The forge data was writing cost text into the use field, and every combat render showed it. The popup, the intent picker labels, and the spotlight ability rows now show name, Tier, and what a Fellmark lands, nothing else.
- The popup flips through the whole table. Swipe left or right on a phone, press the left or right arrow on desktop, or tap the chevrons beside the name. The header counts N of M and Escape closes.
- FateWell only. Refresh with the new head, nothing to paste.

## Token popups — attribute pairing, no costs, player gear
- Foe attributes pair offense against defense: Precision, Power, Magic, and Vigor down the left, Evasion, Durability, Resistance, and Wit down the right.
- Abilities carry no cost anywhere in FateWell. They gate on charge Tier alone, and the popup shows name, Tier, use, and what a Fellmark lands.
- Player popups drop the roll line and show loadout instead: weapons with tree and level, armor level with the active stance, and lorebounds with their form. FellGlass syncs the loadout with combat state through a new gear field.
- Requires a paste of velo/backend/combat.web.js and velo/page-fellglass.js. The CombatPlayer schema gains a gear column and the Apply CMS Action runs on this push.

## Combat — steady dropdowns and full stat-side popups
- Root cause of dropdowns closing: the declare poll marked state as changed on every pass and re-rendered every 12 seconds, destroying any open control. Identical payloads now skip entirely, and when real changes do arrive while a dropdown, input, or text field is focused, the render waits until focus leaves.
- FellGlass gets the same discipline. State updates defer while the declare form is in use, and unsent picks (Act, Target, Skill, Item, Stance) survive any rebuild through a draft layer. Sending, a new round, or combat ending clears the draft.
- The token popup is the full stat side. Foes show Shatter Rating, Vitality, charge, stance, all eight attributes in canon order, Durability and Resistance in play, abilities with tier and use and what they land, items, conditions, intent, and staged outcomes. Fell show level, Vitality, charge, the declared Act with its roll and accuracy, React, conditions, and staged outcomes.
- Fixed on the way: foe items are stored under inv but the intent picker checked items, so Use an item could never appear. Both fields are honored now, in the picker and the popup.
- FellGlass and FateWell. Refresh with the new head, nothing to paste.

## FateWell — combat mode strips to the fight
- Combat mode drops scene narration, beats and clues, the At the table panel, and the Player Declarations list. The combat block gains real padding and Combat Logs sit at the bottom, matching FellGlass.
- Table tokens carry three charge diamonds that light with the meter, the foe's stance, and the round end arrow. Players wear a lock circle top right, yellow until their declaration arrives, green once locked. Tap any token for a popup of its stats: Vitality, charge, stance, attributes, conditions, intent or declared Act, and anything staged for round end.
- Duplicate foes number themselves fully. Adding a second copy renames the bare first to Name 1.
- Foe accuracy can be rolled or entered. A 1 to 6 strip sits beside Roll accuracy and Reroll, the 6 gold, matching the player's manual option.
- The dice mode explanation sits beside the Manual and Auto toggle instead of under it.
- Intents lose Assist an ally, Use an item appears only when the foe carries items, Focus is Target, and foes can target themselves.
- Loot and rewards leave combat entirely and appear on the scene runner once a battle has happened there.
- FellGlass: targets include Yourself, and a Use an item Act appears when the Fell carries inventory, with an item picker that rides the declaration by name.
- FellGlass and FateWell. Refresh with the new head, nothing to paste.

## FateWell — first pass syncing to the FellGlass structure
- Combat mode flows with the page. While a scene runs in combat, the runner unlocks from the fixed viewport shell and scrolls as one surface, chaining past the end like FellGlass. Scene mode keeps the app shell untouched.
- The round track is gone from the stage head, matching FellGlass. The head is the combat line, lock dots, and the table tokens, and Combat Logs rise directly beneath it.
- The red combat ring wraps the combat block, riding above the sticky head so the glow runs the full frame around head, logs, cards, and tools.
- The scroll traps are removed from the runner columns, so reaching the bottom keeps scrolling outward. Inputs and text areas keep their own containment, as they should.
- FateWell only. Refresh with the new head, nothing to paste.

## FellGlass — Fellmark bonus gets the manual option
- The Fellmark bonus follows the same mode as the accuracy roll. In die mode it tumbles as before. Switch to enter manually and the bonus die swaps for a 1 to 6 strip, the 6 flaring gold, so table dice cover both rolls with one toggle.
- FellGlass only. Refresh with the new head, nothing to paste.

## Combat — the round stands: staged outcomes cement at round end
- Nothing permanent lands mid-round anymore. Damage to foes, damage to Fell, afflictions and effects crossing either direction, and charge earned by landing all stage as pending outcomes during the round and cement the moment the LoreMaster begins the next round or the battle ends. This matches the FellGuide line that conditions activate at the start of the next round, extended to Vitality by ruling.
- Both seats see the stack. FateWell cards and table tokens carry a dashed Round end tag per combatant, with tokens previewing the arrow to the new Vitality. FellGlass shows the same dashed tag on the dock, staged damage, staged marks, and the charge waiting on the LoreMaster's ledger, with the arrow to where Vitality will land.
- Per-hit defenses still resolve at confirm where they belong: Evasion, Lastlight, Threshold, Mistform, Nullward, and stance reduction shape each hit when it is taken. Only the ledger waits. Emberhold and temporary Vitality resolve at cement, where stacking is finally known.
- The LoreMaster's manual Vitality taps, pip taps, and condition edits stay immediate as corrections, and a player's own sheet actions stay live. Undo still works, the ledger rides the battle state and snapshots with it.
- The ledger publishes with combat state, so no backend change and nothing to paste.
- FellGlass and FateWell. Refresh with the new head.

## FellGlass — growth on the Fellmark, and nothing sticks until it stands
- A Fellmark on a skill Act grows that skill by one rank, chosen or rolled. The growth commits when the round truly stands: when the LoreMaster begins the next round or the battle ends. Send can be edited and a Spotlight can be undone, so the round boundary is the only irreversible moment. At five filled circles the skill pings ready to master instead, since mastering is a chosen rite on the sheet, never automatic.
- The stance edit loophole is closed. If a locked stance change is edited into a different Act and re-sent, the armor reverts to what it was before the declaration, with a ping and a log line.
- The Skill picker sits above Target, and the picker rows now share identical spacing. Empty hint lines collapse instead of holding a gap.
- The Fellmark bonus die is the same numeral die as the accuracy roll, small and gold-rimmed, tumbling to its number. No more pips beside numbers.
- After sending an attack, the locked card shows the damage that rides it, base and bonus with its type, above Edit declaration.
- FellGlass only. Refresh with the new head, nothing to paste.

## FellGlass — tracker out, stance sealed, skills roll true
- The round track is removed from FellGlass. The buttons and prompts carry the two phases, and Combat Logs move up to sit right under the stage content. FateWell keeps its track for now.
- The roll header drops the parentheses: Roll the Dice or enter manually, Enter Your Roll or roll the die, one line, all of it clickable.
- Armor stances no longer apply on selection. Picking a stance in the declare form is a preview with its note, and the change lands only when Send to LoreMaster is pressed, closing the free-switch loophole. The gold ping and the log line now fire on Send.
- Any skill is a real flow. Choosing it reveals a Skill dropdown listing all 24 skills with their bonus, the header reads Roll the Skill, the readout shows the skill name with its bonus added to the die, and the declare carries the skill by name with the skill total as its accuracy. A skill's bonus counts filled rank circles, identity grants included, plus mastery diamonds.
- FellGlass only. Refresh with the new head, nothing to paste.

## Combat — one-line roll toggle and a two-step round track
- The roll section header is a single clickable line: Roll the Dice (or enter manually), flipping to Enter Your Roll (or roll the die). The whole line is the toggle and it holds one line on phones.
- The round track is two steps everywhere: Declare and Resolve. Commits and Plan folded into Declare, since committing, planning, and declaring are one phase seen from two seats. FellGlass and FateWell show the same track, and FateWell drops its floating ember for the same gold-filled diamond.
- FellGlass and FateWell only. Refresh with the new head, nothing to paste.

## FellGlass — roll label and Send orientation
- The roll section reads Roll the Dice with (Click to input manually) sitting right beside it, swapping to Input Your Roll and (Click to roll the die) in manual mode. The label and toggle sit together instead of spreading across the row.
- Send to LoreMaster sits left on desktop and still stretches to the card padding on phones.
- FellGlass only. Refresh with the new head, nothing to paste.

## FellGlass — the ring, the die, the button
- The red combat ring now rides above the sticky vitals strip, so the glow runs up and around the whole block on phone and desktop instead of starting below the dock.
- Rolling the die is the default. The die wears a gold rim so it reads as the control, and a small Pick the number instead toggle swaps in the 1 to 6 scale with its legend for table dice. Roll the die instead brings it back. The roll readout follows whichever mode is up.
- Send to LoreMaster is centered, and on a phone it stretches to the card padding.
- FellGlass only. Refresh with the new head, nothing to paste.

## FellGlass — the stage joins the page
- The combat stage is no longer a screen-filling overlay. It is a block in the page that ends where its content ends, so the red border wraps the fight itself and Combat Logs sit right under the round track with nothing but page below.
- One scroll. The inner scroll trap is gone. The page scrolls as a whole and keeps going past the stage, on phone and desktop alike.
- Your name, Vitality, charge, and Fatigue ride a sticky strip that stays at the top while the card scrolls on small screens.
- While the stage is up the sheet hides beneath it, and Your sheet still swaps back to the full sheet with the slim return bar.
- FellGlass only. Refresh with the new head, nothing to paste.

## FellGlass — stage polish
- The round track floats directly beneath the stage card now instead of pinning to the bottom of the screen, closing the desktop gap. Combat Logs stays at the bottom.
- The whole column tightened: rail, dock, card, selects, die, faces, and drawers all trimmed so the top, middle, and bottom sections fit a phone screen together.
- Stance adopted pings show a gold border. The unowned-stance line is gone from the stance note.
- Act dropdown sources read Armor and Skills with capitals.
- FellGlass only. Refresh with the new head, nothing to paste.

## Combat — stance switching, target names, and the waiting glow
- Change Armor Stance is a full flow on both sides. In FellGlass, choosing it swaps the Target dropdown for a stance picker with the stance description and its Tier 1 grant. Picking a stance applies to your sheet on the spot, logs the shift for the table, and hides the roll section since no roll is needed. Locking sends the LoreMaster the stance by name.
- In FateWell, foe intents gain Change Stance. Picking a stance applies to the foe immediately, logs the shift, and the stance line and table tokens follow.
- The locked card names your target instead of showing its key, and drops the carved capitals for readable type. No focus is now No target.
- After you lock your Act, the round track pulses a soft gold glow on Resolve, showing the round is waiting on the LoreMaster.
- FellGlass and FateWell only. Refresh with the new head, nothing to paste.

## FellGlass — stage layout swap and readability
- The dock with your Vitality, charge, and Fatigue now sits at the top, right under the combat line. The four-step round track moved to the bottom above Combat Logs, which stays last.
- Vitality numbers moved out of the bar. They sit beside your name in clear type, temporary vitality marked, and the bar below is clean. Charge holds the left of the status row and Fatigue rides the right.
- The round track dropped the floating gold circle. The active step is a gold-filled diamond, resolved steps stay dim.
- The declare card lost its filler line. The damage line now reads This Act deals X base and X bonus physical or magical damage to the target, with a halved note when a condition cuts it. Focus is renamed Target, including the Fellmark hint.
- Desktop centering is enforced with stronger rules, beating the popup card cap that held it at 420 wide and left.
- FellGlass only. Refresh with the new head, nothing to paste.

## Combat stage — desktop centering, the die, and readout fixes
- The stage centers itself on wide screens instead of hugging the left edge. The rail, card, dock, and Combat Logs share one column.
- The red combat glow now lives on the stage itself, the same pulse the sheet carries.
- The roll picker is six equal faces, 1 through 6, with a small legend naming 1 Fellstrike and 6 Fellmark. Roll my d6 is a real die: tap it and it tumbles, settles on the result, and flares gold on a Fellmark or red on a Fellstrike. Picking a face by hand sets the die to match. Lucky and Unlucky rolls still ride through it.
- Tier 0 through Tier 3 are spelled out everywhere. No more bare T0 in either tool, including ability gates, charge readouts, and the Welling trigger.
- The dock is the single home for Vitality, charge, Fatigue, and Afflictions. The declare card no longer repeats them, keeping only charge tier effects and round-start notes when they matter. Fatigue in the dock is now five notches that fill as the ladder climbs, next to its name.
- The record is renamed Combat Logs in both tools.
- FateWell picks up the same Tier wording across charge rows, ability lists, and intent gating.
- FellGlass and FateWell only. Refresh with the new head, nothing to paste.

## FateWell — the combat stage
- The combat runner now opens on a stage head that stays pinned while you scroll: the round, the four steps of the round with the moving ember, player lock dots during commit, and the whole table as small tokens with live Vitality bars, charge, and stance.
- The combat log is The record, a pull-down under the stage head, collapsed until you want it. Combat sits directly under it, with the table, Disruptions, Hooks, and Loot following.
- Combatant cards are restructured. State stays on top (Vitality, luck, charge, stance, condition chips), the primary flow follows (the Act, foe accuracy, the incoming resolution, the React), and the rare controls fold into an Adjust drawer per card: Durability and Resistance, the Fellmark toggle, condition notes, and Impairments. Drawers remember whether you left them open.
- The Spotlight box shows progress dots beside Spotlight N of M in auto mode.
- Every control and sender is unchanged: commits, the Spotlight machinery, undo, manual mode, vitality taps, and all resolution flows work exactly as before.
- FateWell only. Refresh with the new head, nothing to paste.

## FellGlass — the combat stage
- Combat is now its own screen instead of a banner stacked on the sheet. The stage shows one thing at a time: the declare form, your locked Act, the Evasion roll when a foe attacks you, or the incoming hit. Each lands where you are already looking, no popups.
- The four steps of the round (Commits, Plan, Declare, Resolve) run as a rail at the top with an ember that moves as the round moves.
- Your Fell rides a dock at the bottom at all times: Vitality with a damage trail, the charge meter, Fatigue, and Afflictions.
- Infusion triggers, infusion reminders, and augment reminders fold into a Your options drawer. The combat log is The record, a pull-up at the bottom. The Lucky and Unlucky banner keeps its place above the stage card.
- Your sheet is one tap away and combat becomes a slim return bar while you are there, so Breakout rolls, healing, stances, and items lose nothing.
- Every sender is unchanged: declares, Evasion relays, hit confirms, and sync all flow exactly as before. Declare copy now reads Declare your Act.
- FellGlass only. Refresh with the new head, nothing to paste.

## Weapons — real forms and innate afflictions
- Every weapon tree now carries its canon forms and the innate affliction each form is known for, drawn from the FellGuide. Bow lands Hunted, then Vulnerable, then Impeded across its three forms. Axe lands Bleeding, Mangled, Crippled. All nine trees are filled the same way.
- A player Fellmark lands the weapon's real affliction on the struck foe instead of the placeholder, and it ticks on the foe like any canon affliction. The innate shown on the weapon slot tracks the weapon's current form.
- FellGlass only. Refresh with the new head, nothing to paste.

## Combat — bonus damage in the log, afflictions land on their own
- Every resolved hit shows its base and bonus split in the log, both directions. A player hit reads for TOTAL (N base + M bonus), and damage a player takes reads the same way, doubled and mark contributions noted.
- Afflictions land automatically on a Fellmark. A player's weapon affliction lands on the struck foe, and a foe's affliction lands on its target. A foe's standard attack falls back to its signature affliction when the chosen ability carries none.
- A foe Fellmark is now read straight from a natural six on its accuracy roll, not a manual toggle. The manual toggle still forces one.
- FateWell and FellGlass only. Refresh with the new head, nothing to paste.

## Combat — runner scroll, roster gate, and log fixes
- The LoreMaster runner no longer jumps to the top on every action. Scroll position is held across re-renders.
- A player only enters combat when their character is on the scene roster. An unattended viewer stays on their own sheet, and an attending player no longer flaps back to the sheet on a transient poll. Only a real end of combat drops them.
- The combat log for the LoreMaster now sits at the top of the combat runner, above Disruptions, outside the commit and resolve panel.
- Foe rolls are logged. A foe's accuracy logs when it commits and on reroll, and a foe's evasion logs when the LoreMaster rolls it. A player Fellmark is now marked in the log.
- FateWell and FellGlass only. Refresh with the new head, nothing to paste.

## Combat — Lucky and Unlucky rolls
- Lucky and Unlucky rolls are now real. A Lucky roll throws two dice and keeps the higher, an Unlucky roll keeps the lower. This applies to player accuracy and evasion and to foe accuracy and evasion, and the kept die still decides a Fellmark or Fellstrike.
- The LoreMaster can mark any combatant Lucky or Unlucky from its card, foe or player. The mark drives that side's rolls and clears at the start of the next round. The Lucky and Unlucky afflictions feed the same result, so a marked combatant who is also afflicted nets out.
- An animated banner shows the state on the foe card, the player card, and the player's own combat banner. The roll readouts show both dice and which one was kept.
- FateWell and FellGlass only. Refresh with the new head, nothing to paste.

## Combat — foe stances now defend
- A foe's stance is now mechanical, driven by its charge the way a player's is. At charge 1 the stance grants plus 2 to its attribute, Shrouded to Evasion, Stalwart to Durability, Vestments to Resistance. At charge 2 the stance reduces incoming damage by that attribute, with base reduced before bonus. At charge 3 the foe card shows the immunity to apply, Fellstrike for Shrouded, Fellmark for Stalwart, spell-target for Vestments.
- Foe Durability and Resistance now fall back to the foe's build attributes when the per-battle field is left at zero, so a built foe defends without setup. The Def inputs show that value and still override.
- This is FateWell only. Refresh with the new head, nothing to paste.

## Combat — player events and foe effects reach the shared log
- Player-side moments now post to the shared log: damage taken and confirmed, healing recovered, breakout rolls, round-start conditions and augmentations, Ignited self-burn, and a negated attack. They relay on the player combat sync and the LoreMaster folds them into the one log both tools show.
- Foe-side automatic effects now log too: a condition halving max Vitality or cutting current Vitality, Ignited burning a foe, and an affliction landing from a foe attack. Player hits also show the damage marks they carried.
- This carries a player log buffer on the combat sync. Re-paste velo/backend/combat.web.js and velo/page-fellglass.js. The new CombatPlayer field arrives from the Apply CMS action on push.

## Combat — foes roll to hit and players evade
- A foe set to Attack a player now rolls accuracy on the LoreMaster board, one d6 plus its Precision, with a reroll. The targeted player gets an incoming-attack popup after they declare, with a row per foe that shows the foe accuracy and a button to roll Evasion. The contest reads as a hit when accuracy meets or beats evasion, and ties go to the attacker.
- The player sends their evasion to the LoreMaster, who sees hit or evaded on the foe card. A foe advances its weapon charge only on a landing attack, by the same ladder a player uses.
- The shared combat log records the foe accuracy roll, the player evasion with its result, and the foe charge change. A banner prompt on the player side reopens the evasion popup while foes are attacking.
- This carries the evasion on the player combat sync. Re-paste velo/backend/combat.web.js and velo/page-fellglass.js. The new CombatPlayer field arrives from the Apply CMS action on push.

## Combat — shared combat log in both tools
- A combat log now appears on the player banner and the LM board, showing the same stream. It lists who is in the fight, what was rolled, the hits and misses with their accuracy and evasion, damage going through, afflictions, weapon charge changes, and round markers.
- The log is one stream the LM writes as it resolves, published to players in the combat state. It resets each battle and holds the most recent entries. The LM narration rail stays private and separate.
- This adds a log field to CombatState, provisioned by the Apply CMS action on push. Re-paste velo/backend/combat.web.js so the log saves and reaches players. The FellGlass and FateWell panels render on a refresh.

## Combat — drop the declare react checkbox, gate combat to the scene roster
- The react checkbox is gone from the declare popup. The react reminder on the combat banner stays as the way to track whether you have spent it.
- A player now enters combat only when their character is on that scene's roster. Player fighters carry their character id, and FellGlass engages combat only when its character is in the published roster, so a character left out of the scene is no longer pulled in.

## Combat — player attacks contest Evasion, charge advances only on a landing
- A player's accuracy roll now travels to the LM. When the LM resolves a player's hit on a foe, the foe rolls Evasion and the panel shows Hit or Evaded, ties going to the attacker. The LM can reroll, and only a Hit applies damage and any Fellmark affliction.
- Weapon charge now climbs only on a landing weapon attack. A landed standard attack reaches T1, a landed T1 reaches T2, a landed T2 reaches T3, and a landed T3 clears to 0. A miss changes nothing, and skills, items, stances, and lorebound aspects no longer move the meter.
- Paste velo/backend/combat.web.js and velo/page-fellglass.js, and push triggers the Apply CMS action to add the four CombatPlayer fields. Foe attacks against players keep the current flow until the next batch.

## Combat — declare popup reworked: centered, roll input, react reminder
- The Declare your turn popup now opens where you tap instead of the middle of the full sheet, so it lands in view no matter where you have scrolled.
- The React dropdown is gone, since reacts happen in play. A react reminder sits on the combat banner and in the popup, shows used or available, and resets each round.
- The Fellmark checkbox is replaced by a roll input. Pick Fellstrike, 2, 3, 4, 5, or Fellmark, or tap a die to roll one, and your Precision is added for the accuracy total. A Fellmark still opens the bonus die. The roll and accuracy ride along in the declaration for the resolution work to come.

## Roster — character deletion from FellGlass with campaign cleanup
- FellGlass now carries a Delete control on the character picker. It confirms, removes the character, and when none remain it offers to make a new one before the picker goes empty.
- A new deleteCharacter backend method removes the row and, for a plain player with no other character in that campaign, drops their adventure membership so the LM roster clears. The campaign owner and lorekeepers are never removed.
- FateWell prunes any server-backed player the roster reader no longer lists, so a deleted character drops on the next sync. Manually added and offline players are left in place.

## Combat — unarmed strike, foe standard attack, and charge-gated foe abilities
- A Fell with no weapon now has an unarmed basic attack that deals Power plus 1 base damage and charges Tier 1 on a hit.
- Every foe now offers a standard attack in its intent picker, and the foe charge meter advances when its act resolves. A standard attack charges Tier 1, a Tier 1 act charges Tier 2, a Tier 2 act charges Tier 3, and a Tier 3 act resets to 0.
- Foe tiered abilities stay locked until the foe holds the matching charge, the same rule the player side already follows.

## Combat — campaign link reconciled across both backends
- The combat reader and the LM roster reader keyed off different fields. The save now writes the campaign id to campaignId and the campaign name to campaign, and the combat reader resolves by campaignId. The combat match and the roster character match both line up, and no schema change is needed since both fields already exist.
- This supersedes the prior campaign fix. Re-paste velo/backend/characters.web.js and velo/backend/combat.web.js, publish, then open a character and pick its campaign once so both fields fill in.

## Combat — character to campaign link fixed so battle mode reaches the player
- The player tool saved the campaign by name in the column the combat lookup reads by id. Escalating a scene published correctly, but the player match found nothing, so FellGlass stayed on the sheet. The save now stores the campaign id, which is what FateWell publishes under.
- This changes one backend file. Paste velo/backend/characters.web.js into Wix and publish. Then open the character in FellGlass and pick the campaign again once so the stored value updates from the old name to the id. After that, escalate the scene and the player drops into combat.

## Combat — infusions phase four, on-hit and on-kill triggers
- Welling, Reprieve, Emboldening, and Devouring appear as one-tap controls on the combat banner whenever you carry one. Welling adds a charge, Reprieve clears an Affliction, Emboldening grants temporary Vitality equal to your Power, Devouring restores Vitality equal to your Magic. The tool does the math and you tap it the moment you land the hit or drop the foe.
- These fire on events that resolve on the LM board. Rather than build a new cross-tool signal for them, they sit on your banner where you can reach them. Swift stays a reminder, since an extra attack is just another declaration.
- FellGlass only. Refresh the tool.

## Combat — infusions phase three, defense piercing
- Powerful and Ethereal cut through armor. Powerful ignores the foe's Durability up to your Power. Ethereal ignores its Resistance up to your Magic. The pierce travels with your declaration and lowers the foe's defense before the bonus lands, so more of the hit gets through.
- This batch changes backend and bridge files. Paste velo/backend/combat.web.js and velo/page-fellglass.js into Wix and publish. Those files now carry both the double Fellmark relay and the pierce relay, so one paste covers both. The CombatPlayer schema gains a pierce field, so let the apply workflow run after the push.

## Combat — infusions phase two, Fellmark and damage shaping
- Rebounding lands its Base Damage a second time as an unreducible hit, so a Rebounding weapon deals double Base.
- Merciless doubles your Fellmark effects. The Fellmark bonus die counts double while you wield it. The affliction and the impairment are on or off rather than numeric, so they fire as usual on top of the doubled bonus.
- Afflicted lets you choose which affliction you land on a Fellmark instead of the weapon's set one. A picker appears in the declare panel when you wield an Afflicted weapon, and your choice travels with the hit.
- FellGlass only. Refresh the tool.

## Combat — infusions begin to bite, damage and Fatigue
- Six infusions now change your numbers instead of reading as flavor. Sharp, Brutal, and Potent add your attribute to Base Damage. Wounding, Mauling, and Blighting add it to Bonus Damage. The boost flows into your declared hit and your damage readout, so the foe takes the larger number.
- Unflagging treats your Fatigue one rank lower while you wield that weapon, and it stacks with Unbowed.
- These resolve on your sheet, so there is no backend paste. Refresh FellGlass.
- This is the first slice of infusion enforcement. On-hit triggers, defense piercing, reactive strikes, and the positional effects come in later phases.

## Combat — impairment secondary effects and a Corsair level fix
- A landed impairment now applies its until-end-of-battle conditions, not only its name. Dismembered applies Disarmed and Bleeding, Maimed applies Bleeding and Immobilized, Concussed applies Agonized, Blinded applies Bleeding. Those route through the gates the tool already enforces, so the impairment bites instead of sitting as a label. Severed and Sundered carry permanent effects only, recorded for the sheet.
- This works in both directions. On a foe the conditions stack onto its card. On a player they relay to the sheet and show in the panels alongside the impairment text.
- Fixed a copy error in FellGlass. The Lorebounds note said Corsair form arrives at level 8. Canon and the rest of the tool use 7.
- This batch is FellGlass and FateWell only. No backend paste. Refresh both tools.

## Combat — foe-dealt double Fellmark and the impairment panel
- A foe can now land the double Fellmark too. The deal row on a player card gains a Mark Fellmark toggle. Set it and a bonus die appears, rolled by tap or by Auto, and it adds to the bonus before the player reduces it. A six doubles the hit and rolls the Impairment.
- The impairment lands on the player and shows in their Impairments panel with its canon temporary and permanent effects. That panel was reading placeholder fields, so it now pulls the real text from the condition pack and lists all six impairments in the manual picker.
- The Dice setting governs these rolls the same way. Manual leaves the bonus and Impairment dice in your hand. Auto rolls them when you send the hit.
- This batch is FellGlass and FateWell only. No backend paste. Refresh both tools.

## Combat — Fellmark bonus roll and double-Fellmark impairments
- A Fellmark now rolls. When a player marks a Fellmark in the declare panel, a bonus die appears. They tap it, it rolls with the same cinematic d6, and the result folds into their Bonus Damage before the foe reduces it. A six on that die is a double Fellmark.
- A double Fellmark doubles the total damage and triggers an Impairment. The board doubles the hit on apply, then rolls 1d6 on the canon ladder: one Dismembered, two Blinded, three Maimed, four Concussed, five Severed, six Sundered. The result lands on the foe as a recorded condition.
- The LoreMaster chooses how dice roll. A Dice setting on the combat board reads Manual or Auto. Manual leaves the bonus and Impairment dice in your hand with a tap. Auto rolls them for you on apply. The player always rolls their own attack die either way. The choice is remembered between sessions.
- This direction covers a player landing the double Fellmark on a foe. A foe landing one on a player is the next piece.
- This batch changes backend and bridge files. Paste velo/backend/combat.web.js and velo/page-fellglass.js into Wix and publish. The CombatPlayer schema gains a doubleFell field, so let the apply workflow run after the push.

## Combat — hide player declarations from the LoreMaster until resolution
- During the commit phase the declare panel shows readiness only. Each player reads Locked in or Waiting, with a count of how many are in. What they chose stays hidden.
- The choices reveal on the resolution board when you lock and resolve, the same place they always showed. Players can still declare while you commit, you just do not see their picks early.

## Combat — round-phase rhythm banner for players
- The combat banner now shows the round as a four-step strip: Commit, Plan, Declare, Resolve. The active step lights up as the LoreMaster moves the round forward, so the table always knows where it stands.
- A status line under the strip tells the player what to do at each point, from locking an Act and React while the round is open to a spotlight call when they are up.
- The Declare control is gated to the open phase. Once the LoreMaster locks and resolves, it reads Locked instead of inviting a new declaration.
- The phase already synced from FateWell, so this is a FellGlass change with no backend or page-bridge paste.

## Combat — round-start digest in the declare panel
- The declare panel now opens with a short readout of what is true for you this round: your Fatigue level and its effect, your charge tier and what it unlocks, your active Afflictions, and any round-start effects that just applied.
- Round-start effects already ran each round as a quick toast. They now also persist in the digest, so a Mendseam heal or a Slashed halving does not scroll past unseen.

## Reacts — full available list, grouped by source, with Assist
- The declare dropdown now groups options by where they come from: Lorebound, Weapon, Items, Armor, then Standard. Acts group the same way. Picking a lorebound Aspect still shows its live stage and charge requirement.
- Added Assist as a standard React, since assisting an ally costs your React. It carries the assist math and the rule that either Fellmark clears an Affliction when you assist a breakout.
- The Reacts panel and the dropdown share one arsenal build, so a discovered utility item, an infusion, an armor augment, or a lorebound Aspect all surface as Reacts when they qualify.
- Guarded the item lookup so an unknown inventory id no longer throws while the battle panel builds.

## Dice — tappable d6 with cinematic Fellmark and Fellstrike
- The Roll button is gone. Every roll in FellGlass is now a real d6 you tap. It shows pip faces, gives a quick tumble, then settles on the result.
- A Fellmark settles gold. The pips turn gold, a ring bursts from the die, and the screen edge pulses. A Fellstrike settles red with a sharp shake. The flare clears on its own and never blocks the declare or resolve flow.
- Converted all three roll sites: the Mobility, Accuracy, and Evasion rolls in the Battle panel, the per-skill rolls, and the level-up Vitality roll.
- Honors reduced motion. The die still flips and settles, and the flare is skipped.
- Dropped the stale note that called the accuracy and evasion formulas placeholders. Canon is 1d6 plus Precision against 1d6 plus Evasion.

## Combat — two-way damage and spotlight awareness
- Player Acts now carry their computed damage. The declare panel shows "This Act deals N to your focus," and on the loremaster board the focused foe shows an incoming line with a one-tap Apply.
- The loremaster can send a hit to any linked player. The player gets an Incoming damage confirm on their own sheet and takes it off temporary vitality first, then current. Ownership stays with the sheet.
- Players in the active resolve spotlight see a gold "You're up" banner on FellGlass.
- Backend: CombatPlayer gains dmg, pendingHit, pendingHitAt. CombatState gains spotlightChars. New dealDamageToChar method.

## Conditions — canon pack, round-start tick, declare gates
- Pulled the full condition system from the FellGuide vault: 54 afflictions, 39 combat effects, 6 impairments, each with its Breakout skill, canon rule, and an enforcement tag. Inlined as the shared source until the CanonConditions collection is wired.
- FellGlass afflictions now come from canon instead of placeholders.
- Round start applies enforced passives to each owner's own fighters. Slashed halves max Vitality and restores it on breakout. Enfeebled takes half current Vitality once.
- The declare panel reads gates. Ensnared disables the Act, Staggered disables the React, and every active affliction shows its rule.
- Players can roll a Breakout from the declare panel. A Fellmark clears the affliction and counts as that round's Act.
- Foe cards show enforced and gated conditions inline so the loremaster sees what is live.

## Conditions — damage and action modifiers (batch 2)
- Fixed a gap where a player's declared Act carried no damage. Acts now send their computed damage, base, and damage type.
- Bleeding and Infected add to every hit the afflicted takes, on players and on foes.
- Dislocated halves a declarant's physical damage and Vitiated halves their magic damage, shown in the declare panel.
- Mangled and Accursed bounce back when the afflicted deals damage. The dealer takes a confirmed hit, base for Mangled and the full amount for Accursed.
- Ignited deals 1d6 when its bearer takes an Act, once per round, on players at declare and on foes at resolve. Undo reverts a foe's Ignited burn.
- Bruised, Harvested, and Withered stay surfaced as rules for now, since they need durability and healing hooks the relay does not model yet.
- CombatPlayer gains base and dt columns.

## Combat — base damage uses Power
- Base Damage now reads 1 + Power for Power and Precision weapons and 1 + Magic for Magic weapons, matching canon. Precision weapons were reading 1 + Precision. Fixes the weapon damage panel and the damage a declared Act carries to a foe.

## Conditions — Withered and Harvested
- Healing on the sheet now respects the canon. In combat, Withered cancels any healing, and Harvested turns that healing into damage against you, off temporary vitality first.
- Bruised still waits on the damage model, since it needs the base and bonus split.

## Combat — damage model (player as defender)
- Incoming hits now split into base and bonus with a physical or magic type. The loremaster's deal control takes both plus the type.
- A hit resolves by canon on the player's sheet: Bruised turns bonus into base, Durability or Resistance reduces bonus, Vulnerable and Diminished zero those stats, Exposed and Pierced make the attacker ignore them, the active stance Tier 2 reduces the total base-first when live at charge, and Bleeding and Infected add their unreducible point. Temporary vitality takes the result first.
- The incoming prompt shows the raw hit and the reduced total before the player confirms.
- This unlocks Bruised, Vulnerable, Diminished, Exposed, Pierced, and stance Tier 2 mitigation. Foe-side defense reduction (player attacks foe) is the next slice once foe stat blocks carry Durability and Resistance.
- CombatPlayer gains pendBase, pendBonus, pendDt.

## Combat — foe defenses and player afflictions onto foes
- Foe cards carry editable Durability and Resistance. A player's hit on a foe now reduces bonus by the foe's matching defense, with Vulnerable, Diminished, Exposed, and Pierced on the foe behaving as they do on a player. This mirrors the player-as-defender model, so damage now resolves by canon in both directions.
- Players can land afflictions on foes. The declare panel shows the weapon's affliction and a Fellmark check. On a declared Fellmark against a foe focus, the weapon's affliction rides the hit, shows on the foe's incoming line, and lands when the loremaster applies it.
- CombatPlayer gains fellmark and applies.
- Note: a weapon's affliction reads from its meta, which is canon once weapons are wired to the CMS and a placeholder until then.

## Combat — Fatigue enforcement
- The Fatigue ladder now carries its canon effects instead of placeholders. Tired, Weary, and Exhausted show as reminders in the declare panel, Drained disables the Act, and Overwhelmed disables both the Act and the React, the same gating afflictions use.
- The Worn affliction now raises Fatigue by one rank when it takes hold.
- The Unbowed augmentation treats Fatigue as one rank lower for effects and gates.

## Combat — Shared charge auto-progression
- Every weapon now offers a Basic attack alongside its abilities, and ability choices in the declare panel are locked until the shared charge reaches their tier.
- Landing the action that matches your current charge climbs the meter one tier. A basic strike at no charge takes you to Tier 1, a Tier 1 ability to Tier 2, a Tier 2 ability to Tier 3. The Loremaster applying your hit is what advances it, so your sheet updates on its own.
- Unleashing a Tier 3 ability spends the meter and resets it to zero.
- Charge still powers weapon tiers, armor stances, and lorebound aspect stages from the one meter, and the pips remain tappable for manual correction.

## Combat — Augmentation enforcement
- Round start now runs your augmentations. Mendseam recovers Vitality equal to your Vigor when you took no damage the round before. Scarweave tops your Temporary Vitality up to your Vigor without stacking on itself.
- Incoming hits respect your wards. Threshold caps any single hit at half your maximum Vitality. Emberhold holds you at 1 the first time a hit would drop you to zero in a fight. Lastlight makes the first attack each round miss while you are below half.
- The incoming-damage panel offers a Negate button when Mistform or Nullward is ready, once each round, with Nullward reserved for spells.
- Hexward turns aside the first Affliction marked on you each round.
- Positioning and ally augmentations stay as passive reminders on your sheet.

## Combat — Canon lorebound aspects, staged by charge
- The eighteen canon aspects now live in the tool, replacing the placeholder pool. Each carries its Augury, Scour, Succor and the rest, with Initial, Branch, and Crown stages drawn from the FellGuide.
- An aspect is a React gated by your shared charge. It needs at least Charge 1 to invoke. The declare panel shows the stage your charge reaches, Initial at 1, Branch at 2, Crown at 3, with the branch and crown options laid out to choose from.
- The Loremaster board marks each aspect React with the stage the player's charge supports, so the table resolves it at the right strength.
- Aspect data still defers to the CMS once that collection carries staged effects.

## Lorebounds — canon aspect model
- A lorebound now carries the one Aspect tied to its kind, drawn from its type. The eighteen real types replace the placeholders, and the two-aspect pool is gone.
- Branching and Crown are committed leveling picks, not React choices. The builder offers the two Branching options at Companion form and the two Crown options at Corsair form, and locks in your choice.
- Forms follow canon levels, Familiar 1 to 3, Companion 4 to 6, Corsair 7 to 10, and the leveling guidance matches the FellGuide. Level 10 grants the Everpresent Bond.
- In combat the aspect React shows your committed Branch and Crown for the stage your charge reaches, Initial at 1, Branch at 2, Crown at 3. The Everpresent Bond resolves the aspect in full at any charge.

---

## 2026-06-26 — Combat: player vitality, charge, and conditions sync live

- While in combat the sheet pushes a light snapshot of vitality, charge, and conditions whenever it changes, and once when combat starts. The loremaster board reflects a player's damage or charge within a poll, not only when they redeclare. The declaration and any applied conditions are left untouched
- New backend method syncCombatPlayer and a combat-sync handler in the FellGlass bridge

---

## 2026-06-26 — Combat: declaration roster, resolve recap, live banner, conditions land on the sheet

- The two open loops are closed. A Fellmark condition the loremaster lands on a player now merges into that player's own afflictions or effects on their sheet, deduped, with a ping. Declarations are stamped with their round, so a player's Act clears when the round advances instead of carrying forward
- FateWell commit step shows a player declaration roster: each present player reads Declared with their Act, focus, and React, or Waiting. The loremaster can see who is locked in before advancing
- When the loremaster resolves a spotlight that includes a player, that player gets a one-line recap on their sheet of what happened to them
- The FellGlass banner tracks the round live and shows Declared once the player has sent for that round
- Backend CombatPlayer gains round, recapMsg, and recapAt. apply carries an optional recap line

---

## 2026-06-26 — FateWell: live combat sync with FellGlass (publish, declares, conditions back)

- FateWell publishes the running battle for the campaign whenever combat is live: round, scene, and the fighters on the field with their sides. It clears when combat ends
- It polls for player declarations and folds each one into that player's card, so their Act, React, focus, charge, vitality, and conditions appear on the board and they cluster into the spotbox by their declared focus
- Player vitality and charge on the board are read-only, owned by the sheet. Player conditions show as a mirror of the sheet. A Fellmark an Act lands on a player is queued and pushed to their sheet rather than written over their own conditions
- New backend module combat.web.js with two collections, CombatState per campaign and CombatPlayer per campaign and character, plus the FateWell and FellGlass page bridge handlers. Field-merged writes so declarations and applied conditions never clobber each other

---

## 2026-06-26 — FellGlass: combat mode and the declare panel (player side)

- When the LoreMaster runs combat, the sheet enters combat mode: an ember frame around the screen, a Combat banner with the round, and a declare panel that opens on its own the first time
- The panel lets the player pick an Act, a React, and a focus from the fighters on the field, then send it to the LoreMaster. It carries the player's vitality, charge, and conditions along with the declaration
- The sheet polls for combat state every fifteen seconds and on returning to the tab, the same way it already polls for clue cards. Inert until the backend feeds combat-state and accepts combat-declare, wired next

---

## 2026-06-26 — FateWell: an Act's condition lands only on a Fellmark

- A foe Act's affliction or effect no longer lands on every resolve. It lands only when that foe carries a Fellmark for the round
- Each foe card in Resolve has a Roll d6 that sets a Fellmark on a 6 and calls a Fellstrike on a 1, plus a Mark Fellmark toggle for when you roll physical dice. Resolving the spotlight lands the condition for foes marked Fellmark, and Undo strips it back off. The Fellmark clears when the round advances
- Labels now read On Fellmark in the foe wizard and the commit step, so the trigger is clear where you set it

## 2026-06-26 — FateWell: foe Acts can declare what they inflict, so auto-apply lands it

- Each foe Act can now carry an applied condition, an affliction or effect by name. Set it in the foe wizard so every combatant attached from that foe inherits it, or set it inline in the commit step on a foe already on the field
- When a foe whose Act carries a condition resolves, that condition lands on its focus automatically. Resolving again will not stack the same one, and Undo strips it back off

## 2026-06-26 — FateWell: port the prototype combat board (gold spotbox resolve)

- Combat now runs the designed two-step round on live scene data. Commit is a structured Declare Intent per foe (Attack, Use a skill, Use an item, Assist an ally), with the foe's own Acts or items in a second dropdown and a Focus picker that includes Space
- Resolve is the gold Spotlight box. Auto fills the most-engaged cluster first and steps through them; Manual lets you tap fighters into the box. Resolve these Acts drops them into a grayed Resolved list with a live React box, and Undo and Reset walk the round back, reverting any conditions an Act applied
- Fighter cards carry the full controls: vitality with minus five, minus one, tap-to-type, plus one, plus five, a three-pip charge track, separate Affliction and Effect rows with add and remove, an Act line, and a React-used toggle
- A foe Act that carries an applied condition lands it on its focus automatically when resolved, ready for when foe Acts start declaring what they inflict
- Begin next round clears intents, React flags, and the spotlight state, and warns if anyone on the field is still unresolved

## 2026-06-26 — FateWell: spine labels, empty tiers, and Next Session visibility

- All four spine labels read clearly now, not just the lit one. The current tier still glows gold
- Empty Session and Scene tiers show their label with a blank value instead of a faint dash, so the full descent always reads
- Next Session shows on the last scene whenever a next session exists, and glows gold once every scene in the session is complete, instead of only appearing after completion

## 2026-06-26 — FateWell: drop the duplicated top breadcrumb on spine screens

- On the adventure, act, session, and scene screens the descent spine already shows the path, so the long text breadcrumb is gone. A single Adventures link stays at the top as the route back to the full list, since the bottom tab resumes into the current adventure rather than listing them. Classic view keeps the full breadcrumb

## 2026-06-26 — FateWell: runner top bar no longer collides

- The Roleplay or Combat pill sits beside the scene name instead of inside it, so a long scene name truncates with an ellipsis and the pill stays whole
- The saved and synced status moved into the bar as one compact line under the scene count, so it no longer overlaps the Scenes label. It still updates live

## 2026-06-26 — FateWell: runner navigation, scene and note arrows separated

- The top arrows are labeled Scenes. The note arrows moved off the bottom of the stack and now flank the action bar, fixed in place so they stop jumping as note length changes. The beat count sits in the top row
- When you reach the last note of a scene, the note Next grays out and the Scenes forward arrow glows gold to cue the move
- When every scene in the session is complete, the forward arrow turns into a glowing Next Session button that jumps to the first scene of the next session

## 2026-06-26 — FateWell: brighter spine parents, spine in the scene, roleplay on arrival

- The descent spine's parent tiers read in ice instead of dim grey, so Adventure and Act stay legible while you are deeper in. The spine and view toggle now show inside a scene too
- Arriving at a scene always starts in roleplay. Stepping with the scene arrows, entering from prep, and auto-advancing on complete all reset the mode, so the top scene arrow no longer drops you into combat. Escalate when the fight starts. The battle board is kept either way

## 2026-06-26 — FateWell: gold order numbers on cards, collapsible note bodies

- Every card carries a gold order number. Acts, sessions, and scenes number on the cover. Prep notes number in the header, following run order
- Long prep notes clamp to a few lines with a More toggle, so a wall of read-aloud text no longer stretches the card

## 2026-06-26 — FateWell: prep notes as cards, two runner fixes, smaller scene image

- Prep notes render as cards in card view, at every level. Each card carries its type accent, title, body, and Pin, Edit, Delete. Drag the grip to reorder. Classic view keeps the foldable list
- Fixed: a scene with foes attached no longer opens in combat. Scenes start in roleplay and escalate when you choose. Any scene still showing combat just needs one Return to roleplay and it stays
- Fixed: Return to roleplay and Escalate no longer flicker back. A stale account echo arriving right after a save was reverting the switch, now it is ignored while a local edit is fresh
- The scene image in the stepper is capped and centered instead of stretching full width

## 2026-06-26 — FateWell: act, session, and scene card view with the descent spine

- Acts, sessions, and scenes now render as a card grid with a cover, summary, child count, and an Open control. Each level carries a descent spine across the top, Adventure to Act to Session to Scene, with the live tier lit gold and the others tapped to jump
- Reorder by dragging a card's grip, touch or mouse. The order saves to the underlying list, so play order and the runner follow it
- A View toggle sits above each level, Cards or Classic. Classic keeps the old list with the up and down arrows. Cards is the default. Rename, cover, description, duplicate, and delete all work the same from the card menu
- Roster and notes tabs, recap, and everything below the child list are untouched

## 2026-06-26 — FateWell: combat round is two steps, charging added

- The combat round is now Commit then Resolve. The in-tool Player Intents step is gone, since players will declare on their own sheets once FellGlass combat is built. The LoreMaster commits every combatant's Act and focus in Commit, foes and NPCs alike, then resolves through Spotlights
- Foes and NPCs carry a Charge track on their resolve cards, three tiers, tapped to set or step down. Players have one too, ready to sync from their sheets later
- The focus target formerly called Environment now reads Space. Auto and manual spotlights, the focus clusters, disruptions, loot, afflictions, and effects are all unchanged
- Testing note: with no player declaration yet, a player only joins a spotlight when a foe focuses them. Untargeted players sit as Unengaged until FellGlass feeds their Acts in

## 2026-06-26 — FateWell: roleplay runner as a beat stepper

- Running a roleplay scene now shows one beat at a time instead of a scroll. A dimmed preview of the previous beat sits above and the next below, both tappable, with a short flip on the move. A progress rail tracks the scene, and the beat image (or the speaking NPC's image on a dialogue beat with none attached) shows under the whole stack rather than inside the card
- Every per-type behavior carries over: reveal clue on a Lore check, escalate on a Crucible beat, the beat checkbox, and folded secrets. A Stepper and List toggle keeps the classic scroll available, and combat is untouched
- The position is saved per scene, so leaving and returning to a scene keeps your place

## 2026-06-25 — FateWell: Previous and Next scene buttons on the scene screen

- Added Previous scene and Next scene under Run this scene, so you can move through a session without going back to the list. They disable at the first and last scene and hide when a session has only one scene

## 2026-06-25 — FateWell: ref-card thumbnails are always square

- The portrait on a roster or attached-NPC card stretched to the card height, so a long description made it tall and a short card kept it square. The thumbnail is now a fixed square that crops to fill, so every portrait reads 1x1 no matter the card height or source image

## 2026-06-25 — FateWell: the runner holds scene-builder order

- The runner was regrouping notes into type buckets (Read aloud, Voices, Beats, Lore checks), which scrambled the sequence you set. It now renders notes in the exact order from the scene builder, each still styled by type. Read-aloud stays a boxed block, beats stay interactive checkboxes, dialogue keeps its speaker portrait, and secrets stay folded in place

## 2026-06-25 — FateWell: note images no longer vanish on the account round-trip

- A note image added locally was being wiped about a second later when the autosave round-tripped through the account and the server copy came back without it. The tool now keeps the local image (note or cover) for any item whose returned copy lost it, so it survives regardless of the bridge
- A real uploaded image from the server still wins when present
- Tool only. The bridge image-keep fix from the prior step still helps cross-device once re-pasted

## 2026-06-25 — FateWell: note images show in the runner; image upload no longer blanks on failure; subtler save text

- The runner now renders a note's own image. It was only shown in prep, so note images looked lost once you ran the scene
- The page bridge keeps the downscaled image if a cover or note upload fails, instead of blanking it. This matched the asset fix and covered the last silent image loss
- The save timestamp is now plain light text, smaller, no card
- Re-paste the FateWell page bridge for the image-keep behavior

## 2026-06-25 — FateWell: always-on save timestamp with a separate account-sync line

- The top-right time is now always visible and persists across reloads, so it shows even while you are only browsing
- Added a second brighter line, Synced to account <time>, stamped when Save All Adventures confirms (and on any account save)
- Tool only, no bridge or backend change needed

## 2026-06-25 — FateWell: NPC/item images persist; adventure-of-origin tag

- Root fix: the account loader only read the image for monsters, so NPC and item portraits were written but never read back and vanished on reload. It now reads the image for every type
- The page bridge keeps the downscaled image if the media upload fails, instead of blanking it
- The account reload preserves a local image when the stored row has none
- Library profiles are stamped with the adventure they were created in, shown as From <adventure> on the card
- Re-paste the FateWell page bridge for the upload-keep behavior

## 2026-06-25 — FateWell: deleting an adventure removes it from the account; last-saved indicator

- Deleting an adventure now also deletes its row from your account, owner-checked, so it no longer comes back on reload
- Added a Last saved time in the top-right corner, updated on every local save
- Requires re-pasting the FateWell page bridge and re-uploading the FateWell backend

## 2026-06-25 — FateWell: full roster cascade, bigger dialogue portraits

- NPCs added at the adventure now show on the act and session roster tabs too, under Carried down from above, not just in scenes
- Inline dialogue portraits in the runner are larger

## 2026-06-25 — FateWell: modals center in the viewport

- Popups, including the note editor, now center in the current window instead of anchoring to the click point. In the runner, where the page scroll is locked, the Save button is always reachable
- The backdrop scrolls and the card caps at viewport height, so even a long editor stays usable

## 2026-06-25 — FateWell: campaign NPCs in the scene roster, bigger dialogue portrait

- The scene Roster tab now lists NPCs added at the adventure, act, or session under Campaign roster, with their portrait and a one-tap Add to scene. No more re-attaching from the library per scene
- Once added, the card shows In scene and the combatant row shows the portrait, so it is clear it was added
- Runner dialogue shows a full-size portrait to the left of the speaker name and line, in place of the tiny avatar

## 2026-06-25 — FateWell: NPC and monster images persist

- Picked images are downscaled before saving, so a full-size photo no longer produces a row too large for the CMS to store, which was dropping the image on reload
- The asset save now returns the stored image URL and the tool adopts it, replacing the heavy data URI in the local copy
- Requires re-pasting the FateWell page bridge so the asset save returns the saved image

## 2026-06-25 — FateWell: single scroll in the runner

- The runner locks the document to the viewport so only the runner pane scrolls. The extra in-embed scrollbar is gone, leaving the one runner scroll plus the host page's own bar

## 2026-06-25 — FateWell: themed scrollbars

- Scroll areas inside the tool use a slim LoreFell-styled scrollbar, dark track with an ice thumb. The host page scrollbar outside the embed is the browser's and cannot be themed from the tool

## 2026-06-25 — FateWell: runner bar order, table moved to combat

- Log sits to the left of Roll d6 in the frozen bar
- At the table moved out of roleplay; it shows in combat only

## 2026-06-25 — FateWell: runner loot scoped to combat, log moved to a popup

- Loot and rewards only shows in the runner once a scene is in combat. Roleplay mode no longer carries it
- The play log is now a Log button in the frozen top bar that opens a popup with a text box and the recent entries

## 2026-06-25 — FateWell: runner frozen control bar, single scroll

- Run scene now has one scrolling area with a frozen top bar. The scene bar plus Roll, Escalate or Return, and Mark complete stay put while the narration scrolls under them
- Replaces the two-pane split, so there is a single scrollbar instead of three
- For the frozen bar to sit at the top of the visible area, set the Wix HTML embed height to about one screen rather than taller

## 2026-06-25 — FateWell: runner uses two independent scroll panes

- In roleplay run mode the narration and the board are each their own scroll pane bounded to the screen height. The board stays in view while you scroll the narration, and scrolls its own content
- This replaces the sticky column, which could not pin when the embed is taller than the screen
- Mobile keeps the single-column flow

## 2026-06-25 — FateWell: dialogue speaker assigned by dropdown

- Dialogue notes assign a single speaker from a dropdown instead of a Name colon line in the body. One speaker per note, no accidental doubling
- The dropdown lists NPCs and monsters available at the level, including ones carried down from the adventure, act, and session
- The assigned speaker's portrait and color show on the note in prep and in the runner
- Old notes that used the Name colon style still render as before

## 2026-06-25 — FateWell: scene roster cascade, dialogue portraits, colored run notes

- Drag-selecting note text from right to left no longer closes the editor. The backdrop only closes on a click that also started on the backdrop
- NPCs and items added at the adventure, act, or session roster now carry down into every scene under a Carried down subsection
- Attached NPC and item cards show the portrait as a full-height strip on the left
- Dialogue speaker lines show the speaker portrait next to the name, in prep and in the runner, matched by name to the library
- Run scene right column is pinned and scrolls its own content again
- Run scene notes appear in boxes tinted by note type, matching the prep colors

## 2026-06-25 — FateWell: card art scope, NPC popout portrait, note formatting, runner scroll

- Adventure, act, session, and scene cards keep the cover image as a top banner. Only the Library cards use the left thumbnail
- The NPC and item quick-review popout shows the portrait on the left
- LM Description removed from the note type picker
- Notes support inline bold with two asterisks and italic with one, plus B and I buttons that wrap the selected text
- Run scene right column scrolls with the page again, so its full content is reachable

## 2026-06-25 — FateWell: Library cards use a left portrait

- Library profile cards now show the portrait as a left thumbnail instead of a full-width banner, matching the scene roster cards

## 2026-06-25 — FateWell: campaign NPCs everywhere, card art, in-scene marker

- NPCs and items on the campaign roster now appear in every scene under a Campaign roster subsection, tagged Campaign, so they no longer need re-adding per scene
- Attached NPC and item cards show the portrait on the left
- Each card carries an In scene badge once that NPC is in the scene roster, with a one-tap Add to scene and a jump to the roster

## 2026-06-25 — FellGlass: faster saves and a flush on leaving

- The character sheet autosave debounce dropped from 1200ms to 600ms, and a pending save flushes when the tab is hidden or closing. The sheet has no local fallback, so this closes the only window where a last edit could be lost on close

## 2026-06-25 — Faster saves and a flush on leaving

- The account autosave debounce dropped from 900ms to 600ms. The browser copy was already written on every change. When the tab is hidden or closing, any pending account push is flushed immediately, so nothing in the debounce window is lost on close

## 2026-06-25 — At the Table sticks while reading

- In Run scene on desktop, the At the Table column now stays in view as you scroll the Read Aloud text. It caps to the viewport and scrolls on its own if combat expands it. On mobile the columns still stack normally

## 2026-06-25 — Covers render again, breadcrumbs align

- uploadRune returns a wix:image descriptor that a plain image tag cannot load, which left covers broken. The tool now normalizes any wix:image value to its static URL when rendering, and the bridge stores the static URL on save and repairs descriptors already saved
- The breadcrumb row now sits in the same centered column as the cards instead of flush to the page edge

## 2026-06-25 — FellGlass: a new sheet never overwrites the last character

- The sheet now tracks the Wix row id of the character on screen and echoes it on every save. A brand-new sheet carries no id, so it inserts a new row instead of reusing the last one. The backend acks the new id so later saves update the same row. Building several characters without reloading no longer overwrites earlier ones
- New message: bridge to tool saved (carries the new row id)

## 2026-06-25 — Unique media names so images never overwrite each other

- Every forge that uploads an image (SigilForge runes, RelicForge, BondForge portraits, BrandForge, FoeForge, FateWell covers and assets) now gives each upload a unique media name. Two uploads sharing a name could replace the prior file, which looked like a creation overwriting the last one
- Fixes a regression where every FateWell cover used the same fixed media name

## 2026-06-25 — Cover images go to media, not the saved row

- Saving was failing with WDE0009 because cover images stored as data URIs pushed the adventure row past Wix's per-item size limit. The bridge now uploads every inline image to media and keeps only the URL before saving, then returns the slimmed adventure so the local copy stops carrying base64
- New message: bridge to tool lmtool-campaigns-slimmed

## 2026-06-25 — saveCampaign surfaces the real error

- saveCampaign now wraps its work and returns the underlying error text, so the sync result shows the true cause instead of Velo's generic Unable to handle the request. It also uses an explicit insert for new rows and update for existing ones

## 2026-06-25 — Sync reports its result

- Save all adventures to my account now sends one batch and reports back: how many saved, any error text, and the member id the server actually saw. Saves no longer fail silently
- New messages: tool to bridge lmtool-sync, bridge to tool lmtool-sync-result. saveCampaign returns the owner id it wrote

## 2026-06-25 — Restore a backup into the account

- Loading a backup now pushes every restored adventure to the account when FateWell is hosted, so a backup brought to a new browser becomes owned Wix rows
- Settings gains a Save all adventures to my account button to force a full sync on demand

## 2026-06-25 — FateWell hub mode: adventures persist to the account

- Opened on the site without a chosen adventure, FateWell now runs as a hub. The backend hands over every adventure the signed-in member owns, the tool shows and edits them, and each one is saved to the Campaigns collection stamped with that member as its loremaster
- Local adventures are pushed to the account on connect, so existing local work is backed up and owned. Creating a new adventure persists it under its own id. The roster loads per adventure through a players request
- New backend listMyCampaigns. New messages: bridge to tool lmtool-hosted, tool to bridge lmtool-players-request

## 2026-06-25 — Stop blank Campaigns rows

- FateWell running outside a chosen adventure was firing a stray autosave with no campaign id, and the backend turned each one into an empty Campaigns row. Both the bridge and saveCampaign now ignore a save that carries no campaign context, so no empty row is ever created

## 2026-06-24 — Navigation moved to a single top row

- The four nav items sit on one line on mobile and desktop. The bar was three columns, so Settings wrapped to a second row. It is now four columns
- The bar moved from a fixed strip at the bottom to a slim bar under The FateWell wordmark, above the breadcrumbs

## 2026-06-24 — Seed retries cover gateway timeouts

- The CMS seeder now retries 504 and 408 alongside 429, 502, and 503. A single transient gateway timeout no longer hard-fails the Apply run and aborts the steps after it

## 2026-06-24 — Adventure invites and a member roster

- Add to roster replaces Add a player: invite a player with a reusable, revocable link, or add an offline player by hand
- The roster groups by member, with each member's attached characters listed beneath, and a joined member with no character yet shown as such
- A character holds one adventure at a time. The invite link lands on a join page where a player signs in and attaches characters, or forges a new one in FellForge with the adventure linked
- New: CampaignInvites and AdventureMembers collections, invites.web.js, the join page and bridge. FellForge saves the campaign link from its query. Characters gain a campaignId field

## 2026-06-24 — Clear the top right

- Removed the sync status badge and the gear from the top bar. Settings and backup now live as an entry in the bottom nav

## 2026-06-24 — FateWell polish

- Adventure type order is Tale, Story, Legacy, Chronicle. Each length reads as a recommendation, and Chronicle is Infinite, open table
- The FateWell wordmark sits at the top, Well in gold
- Create and menu popups now open on the spot you clicked rather than the center of the embed, so the controls stay in view
- An adventure's cover image shows above the title on its screen and on its list card

## 2026-06-24 — Adventures with four types

- Campaigns are now Adventures. New Adventure opens a type chooser: Story, Legacy, Chronicle, Tale
- Story and Tale play straight in sessions under one hidden act; Legacy and Chronicle carry visible Acts. A Tale auto-creates its single session and hides the add control
- Each adventure shows its type and length, and a Change type control promotes or shifts it, with guards so a type without acts cannot strand extra acts or sessions
- Internal keys, the Campaigns collection, and the message contract are unchanged; only the visible noun and structure depth differ

## 2026-06-24 — FellGlass infusions and augmentations from the collections

- getLibraries now feeds the live Infusions and Augmentations collections to FellGlass as components, replacing the placeholder lists. Infusion attribute drives the weapon category it belongs to
- No sheet change needed; the existing loader maps them by kind. FoeForge already reads both collections directly, so a catalog edit now propagates to the builder, the foe tool, and the player sheet alike

## 2026-06-24 — Asset uploads, foe vitality, charId link, contract check

- Asset portraits now upload through the shared media step in the bridge, so a pasted or uploaded image is stored as a real URL. Assets image field is TEXT to accept any value
- Canon foes carry their tier weight; FateWell derives deploy Vitality from the campaign roster (average party level times number of Fell times weight) when no fixed number is set
- Players carry a charId from a campaign roster feed, so the sealed past match keys on the character first, then member, then name
- New contracts check (npm run contracts, and a CI workflow) scans every tool against its page bridge for unmatched postMessage types

## 2026-06-24 — Canon foes in the FateWell asset library

- listAssets now merges canon Pentifax foes in as read-only monster assets alongside the loremaster's own library
- Foe vitality is party scaled, so the table number is left at zero for the loremaster to set; editing a canon foe forks a personal copy that shadows the canon entry

## 2026-06-24 — FateWell feeds wired

- Forge feed now serves canon SigilForge creations as the loremaster's reference library, read only
- Assets feed backed by a new owner-scoped Assets collection, with save and delete from the tool's monster, npc, and item library
- Glossary feed backed by a new Glossary collection, read by anyone, empty until terms are added in the CMS
- page-fatewell.js answers all three requests plus asset save and delete; no more empty stubs

## 2026-06-24 — Seeder survives Wix rate limits

- scripts/lib/wixClient.js now paces requests and retries 429 and transient 5xx with backoff, honoring Retry-After. Fixes the WDE0014 quota failures during Apply CMS
- Tunable with WIX_MIN_GAP_MS and WIX_MAX_RETRIES. Re-running Apply is idempotent and finishes any rows that failed before

## 2026-06-24 — Sealed past in FateWell

- The campaign roster now reveals a forged Fell's sealed past two ways: a quick inline toggle on the player row, and a dedicated panel the loremaster can open any time
- Added getSealed to backend/fatewell.web.js, gated to loremaster and lorekeeper roles, matched to the roster by member id then by name
- page-fatewell.js answers the tool's sealed request; the player view never receives any of it

## 2026-06-24 — FateWell stood up on the site

- The loremaster and lorekeeper hub deploys as fatewell.html. Title corrected to FateWell
- Added the Campaigns collection, backend/fatewell.web.js (loadCampaign, saveCampaign, owner-checked), and velo/page-fatewell.js for the hosted open and save loop
- Forge, assets, and glossary requests are answered empty for now, wired to their collections next
- Sealed past reveal is the next step: it attaches to the campaign roster, role-gated to loremaster and lorekeeper

## 2026-06-24 — Live lineage library in FellGlass

- Added backend/libraries.web.js (getLibraries) reading the Lineages collection, mapped to the shape the sheet expects
- page-fellglass.js now sends the libraries with every init and new message, so the sheet replaces its lineage placeholders with canon
- The forge pre-fill matches lineage, origin, and motivation by normalized name, so a forged Shadowkin resolves to the canon The Shadowkin and the player drops straight to the weapon step

## 2026-06-24 — FellForge to FellGlass handoff

- FellForge now forges into the Characters collection. The forged identity goes in forgeSeed, the sealed past in its own field, no sheet data yet
- FellGlass opens creation pre-filled from a forged Fell. Lineage, origin, motivation, name, and description carry over; the player still chooses the starting weapon and infusion or the lorebound type
- The player sheet never receives the sealed past. It waits in the Characters row for FateWell

## 2026-06-24 — FellGlass wiring and a load-breaking fix

- Fixed FellGlass: the character object was declared const, so loading a saved or forged character threw and silently failed. Now a let binding, init works
- Title em dash removed
- Added the Characters collection, backend/characters.web.js (listMyCharacters, loadCharacter, saveCharacter), and velo/page-fellglass.js
- loadCharacter never returns the sealed past to the player sheet. A forged Fell not yet built returns its seed so the sheet opens creation pre-filled
- FellGlass serves from docs/fellglass.html and embeds/fellglass.html

## 2026-06-24 — FellForge cleanup and site wiring

- Masthead unified to the gold Forge wordmark, subtitle line removed
- Added the Claude backend backend/fellforge.web.js (generateProfile, saveFell) and the page bridge velo/page-fellforge.js
- Added the Fells collection schema with the sealed past readable by admin only
- FellForge now serves from the GitHub Pages pipeline at docs/fellforge.html and embeds/fellforge.html

## 2026-06-24 — Catalog pagination (ShardForge, BondForge, FoeForge, SigilForge)

- ShardForge catalog paginates at 12 per page across both the infusion list and the Core / Show-all augmentation view
- BondForge lorebound catalog and ledger, FoeForge Pentifax, and SigilForge ledger paginate at 8 per page
- All use numbered pages with Prev/Next, reset to page 1 on search, filter, scope change, or reload, and jump to the list top on page change

## 2026-06-24 — Catalog pagination (RelicForge, BrandForge)

- Catalogs now show 8 items per page with numbered pages and Prev/Next, resetting to page 1 on search or filter
- Removed RelicForge inner list scroll, so there is no scroll-within-a-scroll

## 2026-06-24 — BrandForge: lineage images above the text

- Lineage catalog cards now show the image full width above the text on desktop and mobile, sized to fit the horizontal image instead of a cropped left thumbnail

## 2026-06-24 — Revert createCollection id change

- The Wix v2 create API keys the collection on id, not _id. Reverted so collection creation succeeds again

## 2026-06-24 — Fix collection creation field types

- createCollection now sends the collection _id rather than id, so the field schema registers on create and new collections get typed fields instead of undefined ones
- Lineages seed no longer writes an empty image value, so the image field is not inferred as text

## 2026-06-24 — BrandForge catalog cleanup

- Catalog now shows canon lineages only, so community and test submissions no longer duplicate entries without descriptions
- Removed the Base a lineage on this button from catalog cards; the catalog is a read reference
- Removed The Unwritten from the catalog and seed; the Forge submission flow is the build-your-own path

## 2026-06-24 — BrandForge aligned, wired, with a Lineages catalog

- Top-level Catalog and Forge tabs; the existing builder (Submit one / Stratum, Lineage / World / Brand) lives under Forge
- Subtitle removed; sticky submit bar moved into normal flow so there is no reserved white space at the bottom
- Image upload added to World and Brand, not just Lineage
- Submissions now go to the shared Creations collection tagged brandforge with kind lineage, world, or brand, through a new page bridge, replacing the old three-collection plan
- New Lineages catalog (37 lineages sourced from the FellGuide) read live through getCatalog; community lineage submissions show with author and a submitted note; Base a lineage on this seeds the Forge
- New: schemas/Lineages.json, schemas/seed/Lineages.json, brandforge ForgeConfig row, velo/page-brandforge.js

## 2026-06-24 — RelicForge: catalog images resized

- Catalog cards now place the image as a fixed thumbnail to the left of the text on desktop, and above the text on mobile, instead of one oversized full-width image

## 2026-06-24 — RelicForge aligned, wired, and imaged

- Gold Forge wordmark, subtitle and divider removed, body reset so there is no white space around the embed
- Catalog and Forge are two tabs at every width; the desktop two-column split is gone, single column tuned for mobile
- Catalog now reads the live Relics collection through a page bridge and falls back to the built-in set if the bridge is not wired; community submissions show with author and a Submitted badge
- Added image upload on the Forge form and image display on catalog cards
- New: schemas/Relics.json, schemas/seed/Relics.json (58 relics), relicforge ForgeConfig row, velo/page-relicforge.js

## 2026-06-24 — ShardForge masthead promoted to the gold wordmark

- ShardForge is now the large Shard plus gold Forge title, with Infusions or Augmentations as a small label beneath it
- Removed the lede description lines on both the Infusions and Augmentations sides

## 2026-06-24 — Unified forge wordmark (gold Forge), drop taglines

- FoeForge and SigilForge now render the name with Forge in gold to match BondForge
- Removed the tagline lines under the title on FoeForge (build a Foe once...) and BondForge (Lorebound Aspects) to tighten the masthead
- Convention for new forges: wordmark Name plus Forge in gold, no subtitle line

## 2026-06-24 — BondForge: lorebound image fits the card on mobile

- On phones, a lorebound card with an image now sizes to the image, so a horizontal portrait fills the width with no empty space above and below. The fixed box stays only for the letter fallback when there is no image

## 2026-06-24 — FoeForge: Deploy-at defaults to Minion

- render now re-syncs the Deploy-at select to state every pass, so Consult, Load, New Foe, and Random no longer leave it stale
- Random Foe no longer randomizes the deploy tier; At the table always starts at Minion until you change it

## 2026-06-24 — FoeForge: clearer all-tier table

- Split the cryptic R/D column into labeled React and Disc columns with a check mark, and added a one line legend explaining Attr, Vit, Acts, Inf, React, and Disc

## 2026-06-24 — FoeForge: complete stat cards, offline Random

- The stat card now falls back to an act's library effect when a manually picked act carries none, so the block is always complete
- Random Foe no longer waits on the AI. It shapes the build and names locally and forges acts only for tiers the library cannot fill. With a full act library it is instant and needs no network

## 2026-06-24 — FoeForge: all-tier view, clone, stat card, random

- Card back now shows an Every tier table: attribute value, vitality, acts live, and infusions live at each Shatter Rating, with the deployed tier highlighted
- Save as new clones the current build into a fresh saved Foe without touching the one it came from
- Stat card builds a clean read-aloud block of the whole Foe with a Copy button, ready for the table or an external HUD
- Random Foe forges a complete legal Foe from a random theme and tier through the same pipeline as Consult

## 2026-06-24 — FoeForge: New Foe reset

- Added a New Foe button that clears the builder back to blank, including name, arsenal, acts, description, image, and the loaded Foe link. The act library stays loaded. It arms on first tap and clears on the second so nothing is wiped by accident

## 2026-06-24 — FoeForge: saved Foes persist with their forged acts

- Save to my Foes now writes a private record keyed to the member, isolated from the Pentifax ledger. Forged acts kept to the Foe ride along in the save, so they come back when you reopen it, button state and all
- Added a My saved Foes list with Load and Delete. Loading restores the full build, the description, and the local forged acts. Saving an already loaded Foe updates it in place
- Backend saveFoe, myFoes, deleteFoe added

## 2026-06-24 — FoeForge: forged acts stay local, opt-in to LoreForge

- The forge no longer auto-submits AI acts. A built act is kept to the Foe by default and listed under Forged Acts with a Send to LoreForge button, so a loremaster shares it only if they want it. An act that already exists in LoreForge is reused, not duplicated
- Much richer flavor coverage. buildLegalAct now maps a wide vocabulary (fire, fear, bleed, rot, poison, mind, madness, curse, luck, bind, slow, weaken, frost, maim, light, shadow, cut, blunt, wither, expose, strip, dispel, frenzy, mark, shatter, corrupt, and more) to real afflictions, with Major afflictions used at Tier 3 where they fit. Every mapping is validated legal and in band

## 2026-06-24 — FoeForge: AI acts built from real components

- The AI no longer writes act mechanics. It names a custom act, gives a one word flavor, and a short description. The new backend buildLegalAct assembles the act from real SigilForge components, validates it against the shared rules, and keeps the cost inside the tier band. The effect text comes from the component descriptions
- FoeForge submits these real component builds to LoreForge, so a generated act follows the ruleset exactly instead of inventing effects

## 2026-06-24 — Authored creations pass validation

- The shared rule interpreter now accepts an authored creation. It skips the component slot and gate checks and validates only against the tier cost band. This lets the FoeForge AI write a legal ability or spell and submit it to LoreForge without filling SigilForge's Damage, Targeting, and Inlay slots
- Regenerated docs/rules.js and velo/backend/rules.js from rules.core.js. FoeForge custom acts now post with authored true

## 2026-06-24 — FoeForge: flip card, AI invents and submits acts

- Consult now invents legal acts when the catalog cannot fill a tier. Abilities for Power builds, spells for Magic builds, costs kept in the tier band. New ones auto-submit to LoreForge, and an existing one of the same name is reused instead of duplicated
- The Foe Card flips. Front holds the arsenal, the image, and the description. Back holds the table-side stats with the deploy controls on top. A flip button works on desktop and mobile
- Moved the Description box up to the old Validation slot and moved Validation directly above Save. Removed the live-tool note. Party level now defaults to 1

## 2026-06-24 — FoeForge: stricter legality, Foe descriptions

- A legal Foe now needs three infusions, two augmentations, and one Act at each tier (T1, T2, T3). Builds with no attack attribute still carry no infusions
- Consult and the offline shaping now produce a full legal arsenal so a forged Foe validates on the first pass
- Added a Description field. The AI writes it during Consult, the way SigilForge does for abilities, and it shows on the Foe card and in the Pentifax ledger

## 2026-06-24 — FoeForge: AI forges the whole arsenal

- Consult from description now has the AI choose build, stance, affliction, infusions, augmentations, and acts from the live catalogs, not just the name. The pick is validated and trimmed if anything is illegal. Offline it falls back to the local shaping
- Removed the Core and Non-Core label from augmentations. The validator never used it
- Pills now use touch-action manipulation and a tap highlight so the tap-to-reveal fires cleanly on mobile

## 2026-06-24 — FoeForge: mobile-readable descriptions

- Infusion and augmentation picker rows now show their effect inline, matching the Acts rows, so descriptions are visible on touch without a hover
- Result pills (card, ledger, selected, stance, affliction, acts) reveal their description on tap, with a tap elsewhere to dismiss. Native hover is kept for desktop

## 2026-06-24 — FoeForge: the Pentifax ledger

- Added a Forge / Pentifax tabbar. The Pentifax tab lists submitted Foes with All, Canon, and Mine filters and a vote button, matching the other forge ledgers
- Each entry shows stance, affliction, infusions, augmentations, and acts as pills with hover tooltips, plus a Canon or Submitted badge and the author
- page-foeforge.js answers FOE_LOAD_LEDGER and FOE_VOTE

## 2026-06-24 — FoeForge card polish and standard attack bonus damage

- Foe card relabels Signature to Affliction. Stance and Affliction now render as pills with hover tooltips, matching infusions and augmentations
- Standard Attack now lists Bonus Damage alongside Base Damage, both drawn from Power or Magic depending on the build
- Fixed the indent on the empty acts message

## 2026-06-24 — FoeForge: selection descriptions, hover tooltips, creative consult names

- Stance and Signature Affliction now show the selected option's effect under the box. Build keeps its line
- Infusions, augmentations, and acts show their effect on hover, on the picker rows, the selected pills, and the Foe card
- Consult names a foe through the forge AI with a richer local fallback, so a shadow demon stops coming back as The Demon

## 2026-06-24 — FoeForge: blank start, live abilities only, provenance badges, full text

- Removed the demo foe. The builder opens blank, no name and no preset infusions, augmentations, or acts
- Dropped the sample act list. Acts now come only from SigilForge submissions, submitted and canonized, with an empty state when none exist
- Each ability, infusion, and augmentation carries a Canon or Submitted badge
- Abilities show their full description, not the shorthand. getCreations now returns fullText

## 2026-06-24 — FoeForge wired: submit to the Pentifax, builder reads live components

- Submit routes a foe to the Pentifax, the foe canon hall (Creations, kind foe, meta hall pentifax). Save stays private and local
- The builder reads abilities, infusions, and augmentations, official and submitted. Infusions and augmentations come from their collections plus ShardForge submissions, abilities from SigilForge creations
- Live components feed the pickers and the client validator. The baked pack and sample acts remain as an offline fallback
- Added a foeforge ForgeConfig row, loremaster access. Ability cost defaults to the tier minimum since SigilForge does not store a numeric cost yet

## 2026-06-24 — BondForge portraits no longer click to enlarge

- Removed the in-place zoom from catalog, ledger, and preview portraits. They fill their panel and do nothing on tap

## 2026-06-24 — Add SYNC_RUNBOOK for a two-token chat

- Documented the full loop a chat with forge and vault tokens follows: edit vault canon, regenerate seed, push both, dispatch the Apply Action for Wix
- Spelled out what is automatic (Pages, seed via Action) and what is manual (Velo paste)

## 2026-06-23 — Infusion gem icon; FellGuide as source for the collections

- ShardForge infusions now show a faceted gem. Augmentations keep the shield
- Added canonFromVault.js: reads hidden source docs in the vault (_Canon/collections) into the CMS seed, then apply pushes to Wix. One way, the vault is never written to
- Portraits are never emitted, so manual Wix uploads survive every sync (upsertItems merges)
- Added npm run canon and npm run sync. Source docs and a governance note live in the vault

## 2026-06-23 — BondForge cards: larger left-half portrait, click to zoom in place

- Catalog and ledger portraits now fill the left half of the card and stretch to its height
- Clicking a portrait expands it in place inside the card and shows the full uncropped image. Clicking again collapses it
- Removed the fixed centered lightbox, which anchored to the middle of the embed iframe and forced scrolling

## 2026-06-23 — Canon moves to editable CMS collections

- Added three content collections you edit in the CMS: Lorebounds, Infusions, Augmentations. Real columns plus a native Image field, created and seeded by the apply pipeline
- Added a generic backend read getCatalog(collectionId). Sorts by displayOrder and converts Wix image fields to URLs. Any forge can use it
- BondForge catalog now reads Lorebounds. ShardForge catalog reads Infusions and Augmentations per side. Baked sets remain only as an offline fallback
- Retired the earlier Creations-based bond seed and its endpoint

## 2026-06-23 — BondForge catalog reads canon from the CMS

- Catalog now loads canon lorebounds from the Creations collection (kind bond, canonStatus canon) through getCreations. The baked 18 remain only as an offline fallback
- page-bondforge.js handles CATALOG_LOAD and returns canon rows normalized for the catalog
- Added backend/canonBonds.js (the 18 canon bonds) and a guarded /_functions/seedBonds endpoint to load them once. Idempotent
- Portrait convention still applies: a canon row with no imageUrl falls back to bonds/<slug> art, then the letter

## 2026-06-23 — BondForge: ledger, voting, submission to the LoreForge

- Wired the BondForge lorebound generator to the shared backend (forgeKey bondforge, kind bond)
- Added a Ledger tab to view, vote, and review submissions (All / Canon / Mine)
- Submit now routes to the vault through page-bondforge.js and submitCreation. Portrait uploads reuse the rune uploader, set as the creation image
- Added a bondforge ForgeConfig row with an empty ruleset. No backend change, kind already generalized

## 2026-06-23 — ShardForge: desktop reveals Canonize on click

- Desktop now shows the catalog alone by default. The Canonize column appears on the right only when its tab is clicked, and the Ledger takes the full width when active

## 2026-06-23 — ShardForge: one tool for infusions and augmentations

- Folded augmentations into the ShardForge tool with an Infusions / Augmentations toggle up top
- Each side carries its own catalog, categories, and copy. Augmentations keep the Core-first view and Core badge; infusions show the full set
- One shared Ledger that follows the active side (kind infusion or augmentation), same All / Canon / Mine and voting
- No backend change. page-shardforge.js already keys kind off the side

## 2026-06-23 — ShardForge: ledger, voting, submission to the LoreForge

- Wired the ShardForge infusions tool to the shared backend (forgeKey shardforge, kind infusion)
- Added a Ledger tab to view, vote, and review submissions (All / Canon / Mine), mirroring SigilForge
- Submission now posts to the vault through page-shardforge.js and submitCreation instead of a mock
- Generalized submitCreation kind to payload.kind so any forge sets its own (no SigilForge change)
- Added a shardforge ForgeConfig row with an empty ruleset so freeform submissions validate cleanly

## 2026-06-22 — SigilForge: remove false innate trigger, clarify Base Damage

- Innate weapon afflictions trigger on a 6 for every Form. Removed the incorrect 3rd Form 5-or-6 trigger from the tool and the FellGuide
- Base Damage shows cost -1 directly. Dropped the confusing gain a point wording (no modifier was ever applied)

## 2026-06-22 — SigilForge balance pass

- No Damage cost 0 to -2; Purged 1 to 2; Persecuted* 4 to 3 (no longer Major)
- Enfeebled*, Suppressed*, Disarmed* 3 to 4 (now Major Afflictions, Tier 3 + 3rd Form)
- Crushed may now be carried by Spread and named by Amplify (removed from both ban lists)
- All Enemies renamed All Targets; rule now covers all enemies or all allies
- Inert*, Anchored*, Benighted*, Defanged* marked Foe-only (FoeOnly), rejected on Ability and Spell builds in the tool and the validator
- Monster tab relabeled Foe (internal value unchanged)

## 2026-06-21 — SigilForge: Inlay labels, remix + AI fixes, ledger voting

- Renamed the two slot labels from Rider Slot to Inlay Slot (player-facing copy)
- AI Forge now resolves near-miss component names (e.g. Ignited -> Ignited*) and surfaces truly unknown names to the validator loop, so the chosen Inlay no longer drops silently
- Forge from this now loads pre-meta creations by defaulting the weapon/focus, so the build restores and the player re-picks the item
- Added a Vote control to each ledger card (castVote backend, one vote per member via optional voters field, graceful tally-only fallback)

## 2026-06-21 — SigilForge: AI Forge live, Codex category arrows

- Enabled Forge From a Vision (AI_FORGE_ENDPOINT -> apex /_functions/aiForge); card now shows
- Added left/right arrows to the Component Codex category filter row (desktop; touch-scroll on mobile)

## 2026-06-20 — C3: The Forging Ledger, browse and remix

- The Ledger tab now browses the LoreForge through getCreations instead of repeating the component costs the Codex already carries. Filters for All, Canon, and Mine.
- Each entry shows its canon track (Canon, In Vote, Submitted, Declined, Draft) and a Gate 2 line: canon attaches freely, everything else needs LoreMaster approval to attach.
- Forge from this loads a creation back into the Forge by reusing applyAiBuild, and sets basedOn lineage for the next submission. The forge block now carries an identity meta block so remix restores the weapon, spell, or foe faithfully.
- Page code gained the LOREFELL_LOAD_LEDGER route, member-scoped Mine via currentMember, and stores meta on the record. Backend unchanged, getCreations shipped in C1.

## 2026-06-20 — C2: Bring It To Your LoreMaster

- Submit now opens a review step themed on the canon Bring It To Your LoreMaster section instead of forging straight away.
- The panel shows a legality line (tier, points of cap, Inlays, Afflictions, Legal), the canon Five Questions as a self-check, and a one-line note that becomes creatorNote for the LoreMaster at Gate 2.
- Overlap runs through findSimilar before the send. A close match shows its name, creator, and canon badge, with Base mine on this to set basedOn lineage, or send as new.
- Page code gained the LOREFELL_CHECK_OVERLAP route and now carries creatorNote, narrative flavorText, and basedOn onto the record. No backend change, submitCreation already persists all three.

## 2026-06-20 — C1: SigilForge tool repointed to the vault

- Tool now writes to Creations through submitCreation. It emits a payload.forge block in the interpreter shape (tier, form, mode, kind, selections as labels, spreadTarget, amplifyTarget) and defers the success message to a LOREFELL_SUBMIT_RESULT from the page bridge, so it never claims a save the vault refused.
- Renamed rider to Inlay across all player copy and the AI Forge contract. Code identifiers, CSS classes, and the rune renderer were left untouched.
- Added page-sigilforge.js for The SigilForge page, bridging submit and feedback, storing the rune via uploadRune, and reporting overlap from findSimilar.
- forge.web.js keeps the tool's authored shorthand and full text when provided, and gained getCreations for the Ledger browse and basedOn lineage.
- embeds/sigilforge.html plus scripts/seedEmbeds.js, wired into apply.yml, seed the tool into the SiteEmbeds sigilforge row.

## 2026-06-20 — Backend moved to the modern .web.js web module

- Replaced backend/forge.jsw with backend/forge.web.js, since Wix deprecated .jsw web modules. getForgeDefinition, submitCreation, and findSimilar are now webMethod exports with explicit permissions (Anyone for the definition read, SiteMember for submit and overlap). rules.js stays a plain backend module imported by it.

## 2026-06-20 — Fix collection create: send collection.id

- createCollection.js was putting the new collection id in collection._id, which Wix Data v2 rejects with `id must not be empty`. It now sends collection.id. This also removes the old duplicate-collection behavior, since Wix no longer derives the id from the display name.

## 2026-06-20 — Component ids aligned to the tool labels

- Set ForgeComponents componentId equal to each component label so the SigilForge tool, which selects components by label, submits ids the backend validates directly. No mapping layer between tool and CMS.

## 2026-06-20 — Unified Creations collection and legacy migration

- Renamed the SigilForge submission target from Sigils to a single shared Creations collection that every forge writes to and LoreForge and the viewers read, discriminated by forgeKey and kind. Sigils was deleted.
- Added imageUrl and sourceId to the record. imageUrl carries the primary visual, sourceId records provenance for imported rows.
- Added scripts/migrate.js, an idempotent one-time migration that copies legacy LoreForgeAbilities rows into Creations, folding the build into payload, mapping loreForgeApproved to the canon track, and skipping anything already migrated. LoreForgeAbilities is left intact as a backup.
- The migration runs as the final step of the Apply workflow, so one run creates, seeds, and migrates. It is non-fatal if the legacy collection is absent.
- Repointed the backend overlap lookup, the backup fallback set, the kernel fallback definition, and the README.

## 2026-06-20 — SigilForge data, interpreter, and two-gate record

- Replaced the toy ForgeConfig and ForgeComponents seeds with the real SigilForge set: one config row and 103 components. Rider is renamed to Inlay, the spread and amplify ban flags are carried as categories, and major afflictions are tagged by cost.
- Corrected the gates to current canon. Afflictions need Tier 2 and 2nd Form. Major Afflictions and All Enemies need Tier 3 and 3rd Form. Spread needs 2nd Form. Amplify needs Tier 2. Three Targets needs 2nd Form.
- Added the Form floor so Tier cannot fall below the weapon Form, the mythic budget of 7 at Tier 3 on a 3rd Form item, and an Inlay cap that counts Spread and Amplify against the two-Inlay limit.
- Extended the interpreter with the rules it lacked: mutual exclusion, the one-Affliction sub cap, Spread requiring Secondary Targets, No Damage requiring an Inlay, and Spread and Amplify each naming an eligible Inlay with the per-component bans.
- Sigils schema gains the two-gate model and record fields: kind, canonStatus, creatorName, legality, creatorNote, fingerprint, basedOn.
- Added the CreationApprovals collection for per-campaign LoreMaster approval.
- Backend re-validates every submission, writes the legality proof and author, and exposes findSimilar for the overlap check.
- Interpreter tested against legal and illegal builds before committing.
