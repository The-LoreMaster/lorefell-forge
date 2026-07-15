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

## View state, owned by the LoreMaster

The campaign or combat state carries one object the LM controls during a live session:

    viewState: { mode: explore | combat, node, background }

`background` is an image or video reference (video muted, looping, playsinline). Players' ThreadSpire follows viewState while a session is live. Offline, a player roams their discovered nodes freely through the existing zoom stack: character, location, territory, world.

## Tokens

Percent coordinates against the map art, the Cartographer trick, so any art size holds. A configurable grid per map, size and offset, snap on drop, drawn live by the tool and never baked into art. A player drags only their own token. The LM drags everything and places NPC, asset, and foe tokens from the campaign library. Positions persist per campaign and map node through the bridge, same pattern as combat sync.

## Phases

1. Shell. This file. Layouts, window shell, HUD, rail, drawer, map layer with draggable demo tokens, the state seam with a stub transport, the combat flash. Placeholder art throughout.
2. Section ports. Each rail button's content ports from FellGlass one section at a time, rendering only, engine untouched. Old FellGlass keeps working throughout.
3. Token layer for real. The positions collection, LM palette, grid config, viewState wiring.
4. Battle surface wired to the live combat bridge, the same declare flow and dice ritual FellGlass runs.
5. Skin drop. The artist's pieces replace placeholders. Nine slice frames, gem states, plaque bars.
6. Transport swap when live sync is wanted. Replaces the polling feed behind the seam.

## Decisions log

- Icon plus small label on the mobile rail, never icons alone.
- Drawer peek state collapses to the round banner.
- Portrait lock for v1. Landscape waits on serving ThreadSpire without the Wix page chrome.
- One log. Dice rolls surface on screen in the moment, so the log is reference, not urgency.
- Exit is X top left everywhere, plus map click outside on desktop and rail retap on mobile.
