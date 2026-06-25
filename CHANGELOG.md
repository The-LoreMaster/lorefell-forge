# LoreFell Forge Change Log

Build batches pushed to this repo, newest at the top. The apply workflow is manual, so a push here changes the repo only. Collections change in Wix when the apply workflow runs.

---

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
