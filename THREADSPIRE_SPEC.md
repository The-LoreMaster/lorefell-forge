# ThreadSpire Play Surface Spec

ThreadSpire becomes the place players run the game. The map is the screen, the sheet opens as windows over it, and combat runs from a battle surface on the same stage. FellGlass remains the home of character creation and the one rules engine. ThreadSpire renders that engine. No rule, formula, or bridge contract is ever reimplemented here. Where FellGlass has a declare form, ThreadSpire has a prettier one calling the same functions.

The working shell is `docs/proto-threadspire.html`, a self-contained prototype with placeholder art. The artist's pieces drop onto it without layout changes.

## The hard architectural rule

One rules engine. The combat math, condition enforcement, augmentation triggers, charge progression, and the postMessage bridge contract live where they live today and are shared, never forked. ThreadSpire phases port the FellGlass sections one at a time behind buttons, moving rendering only. A second implementation of any rule is the failure mode this spec exists to prevent.

## Layout, as ruled

Desktop:
- The map fills the screen behind everything.
- A rail of plaque buttons sits on the right: Notes, Inventory, Skills, Arsenal, Attributes.
- The session log sits top right, always visible.
- The character card cluster sits bottom right: portrait, name, level, LP, vitality gems. Tapping the portrait opens the Identity window.
- One window shell serves every section. A button opens its content in the window. The X top left closes it, and so does clicking the map outside the window. Tapping another button swaps content in place.
- When combat begins the vitality gem turns pink and pulses. It stays pink for the whole fight and toggles the battle window. The player opens and closes it at will.

Mobile (portrait locked for v1):
- A permanent HUD strip on top: portrait, name and level, vitality gem, LP.
- A permanent five slot rail on the bottom: Inventory, Skills, Arsenal, Attributes, More. Each slot is an icon with a small text label. More holds Notes and the Log.
- Windows fill the space between HUD and rail. The X closes, and tapping the lit rail slot again closes.
- The battle surface is a bottom sheet drawer. Drag up to declare, drag down to a peek state showing only the round banner, so the board is nearly full screen between turns. Charge and fatigue live in the drawer header, since combat is when they are used.
- Dice moments render on screen as they happen, the same ritual FellGlass carries today. The log is the one full session log, under More.

## The state seam, binding on every phase

All remote state lands through one function and all local intent leaves through one function:

    applyRemoteState(patch)   the only writer of shared state into the view
    send(evt)                 the only sender of player intent outward

Polling feeds these two functions now. A live transport later replaces the feed and touches nothing else. No view code may read the network or the bridge directly.

## Three homes for state, by write rhythm and by owner

State splits three ways, and the split is by who owns a value and how often it changes, not by what screen shows it. Forcing two rhythms into one record is a collision under last write wins, the same failure as two copies of one fact drifting apart.

**CombatState.** The round, the phase, foe charges, declared acts. LM authored, table visible. It churns on every action.

**CampaignView, its own collection.** What the LoreMaster sets for the table to see: `{ mode: explore | combat, node, background, grid }`. `background` is an image or video reference (video muted, looping, playsinline). `grid` is `{ size, offX, offY, opacity }`, the cell size and offset that define the coordinate system every token position is written in, so it is shared and LM written, otherwise two people counting squares to the same door get different answers. CampaignView is a separate record from CombatState on purpose. It changes when the LM reframes the table, a different rhythm from combat, so a camera reframe never rewrites the combat blob and an act never rewrites the view. Players' ThreadSpire follows CampaignView while a session is live. Offline, a player roams their discovered nodes freely through the existing zoom stack: character, location, territory, world.

**The camera, no record at all.** Zoom and pan belong to whoever is looking. They live outside every synced state object, not merely marked local, so the bridge cannot reach them even by accident. Every viewer decides where they stand.

The LoreMaster decides what lives on the map. Every viewer decides where they stand. Only the ON syncs, not the view.

## Tokens

Map space, never screen space. Each node declares a nominal map box, a fixed width with the height taken from the art's aspect, and the art is fitted into it. Any art size still holds, which is the Cartographer trick, but the units are now whole numbers a grid can divide cleanly instead of percentages.

Tokens store their centre in map units. Not screen percentages, which break the instant anyone zooms. Not cell indices, which would teleport every token on the board the moment the LM recalibrates the grid. The art is the truth and the grid is an overlay onto it, so tokens hold their spot on the art and the grid slides under them.

A configurable grid per map, cell size, offset on both axes, and opacity, snap on drop, drawn live by the tool and never baked into art. Offset is not optional, no map art has its grid starting at the origin. Footprint is per token in cells, and it is a game fact rather than a cosmetic one, an Epic owning 2x2 is something a player reads off the board. Odd footprints centre on a cell, even ones centre on an intersection. Token size is derived, never stored: cell size times footprint times a global inset. The inset is only air, so grid lines stay visible and neighbouring tokens do not fuse into one blob.

A player drags only their own token. The LM drags everything and places NPC, asset, and foe tokens from the campaign library. Positions persist per campaign and map node through the bridge, same pattern as combat sync.

## Phases

1. Shell. This file. Layouts, window shell, HUD, rail, drawer, map layer with draggable demo tokens, the state seam with a stub transport, the combat flash. Placeholder art throughout. Round two adds the chat box on the log stream, the full log overlay, and the dice tray with its type picker and CSS cube. Round three flips the log to newest first under the chat box, moves the rail to Inventory through Attributes with Lore at the foot, hands combat to the Fellmark, and puts token editing in a menu. Round four throws the dice on screen.

Dice are thrown in screen space, so they land the same for everyone regardless of where each camera is pointed. The throw is choreography and nothing else. The number is decided elsewhere and arrives as remote truth, and the animation is only ever told what to carry. Nothing in the throw may pick a face, or the tumble becomes a rule.

Every roll at the table throws, not only your own. Skins are earned in game, so they live on the Fell and they travel, and each roll carries the skin it was thrown with. That is what lets the rest of the table see what you unlocked. A player assigns a skin per roll type, so the die says what is being rolled before anyone reads a word. Your die leaves your socket and returns to it. Everyone else's arcs in from the edge, wears their own skin, carries their name, and fades where it lands. The bottom readout spells out your own maths alone.
2. Section ports. Each rail button's content ports from FellGlass one section at a time, rendering only, engine untouched. Old FellGlass keeps working throughout.
3. Token layer for real. The positions collection, LM palette, grid config, CampaignView wiring. Round two built the camera, the grid, and footprints against the stub, so what remains here is where the shared half lives and how it syncs.
4. Battle surface wired to the live combat bridge, the same declare flow and dice ritual FellGlass runs.
5. Skin drop. The artist's pieces replace placeholders. Nine slice frames, gem states, plaque bars.
6. Transport swap when live sync is wanted. Replaces the polling feed behind the seam.

## Decisions log

- Icon plus small label on the mobile rail, never icons alone.
- Drawer peek state collapses to the round banner.
- Portrait lock for v1. Landscape waits on serving ThreadSpire without the Wix page chrome.
- One log. Dice rolls surface on screen in the moment, so the log is reference, not urgency.
- Exit is X top left everywhere, plus map click outside on desktop and rail retap on mobile.

## Round two rulings, after shell review

- A chat box sits at the top of the log panel. Chat is one more entry kind on the existing log stream, interleaved with rolls and effects.
- Log entries flow top to bottom, newest at the bottom, auto scrolled. A control opens the full log in the centered window shell as an overlay.
- A d6 sits bottom left of the play surface with a clean picker for the roll type: Attack, Evade, Skill, or Generic. The type tags the roll in the log and to the LoreMaster. Same dice ritual FellGlass runs today.
- The die renders as a CSS 3D cube with tumble, faces drawn from a skin set, so dice skins are texture swaps and a per character cosmetic hook. A physics dice layer (three.js) can replace the visual later without touching the roll logic, result and visual stay separate layers.

## CampaignView ruling and the proving slice

- CampaignView is its own collection, not a field on CombatState. Combat state churns on every action; view state changes when the LM reframes the table. Welded into one record under last write wins, a camera reframe and a foe charge landing in the same beat clobber each other. Separated, each writes on its own rhythm and neither can overwrite the other. This gates Phases 3 and 4.
- Prove the seam before porting sections. Between Phase 2 and the full battle bridge, land one thin vertical slice: one real value travels FateWell to the seam to a ThreadSpire render, end to end. Foe charge is the first value, since it is freshly built and easy to read at a glance. CampaignView comes online in parallel as the second, proving both records sync independently. Only once the seam is proven with real values do the section ports and the battle bridge become repetition of a known good pattern.
- ThreadSpire renders the engines, it does not hold them. Moving the LoreMaster combat and FellGlass in means ThreadSpire renders FateWell and FellGlass through the seam. The combat and character math stay where they are, one source of truth each. A ported copy would have to carry every fix twice forever and drift, the same failure the shared foe sheet closed.
