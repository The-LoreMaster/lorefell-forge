## 2026-10-05 - Phantomfield walks through anything

A Fell wearing Phantomfield now moves through walls, tokens and ground that cannot be crossed, by drag or by tap-to-move, and the movement squares show past walls. Where the move ends is still checked: ending inside another token or on uncrossable ground is refused with a line saying why.

## 2026-10-05 - Infusions and augmentations work at the table, and say so

Every weapon infusion and armor augmentation that was only a reminder now does what the FellGuide says, and each one writes a line in the log naming itself and what it did, or why it could not (no token on the map, Oakspine, a wall in the way, the foe still standing, a Power of 0). Land it now runs the Fell's hit through the foe's defenses (it used to subtract the raw number, and could not find the foe at all because the target came prefixed), counts Powerful, Ethereal and Goring, and stages the damage for the round's end. On a hit: Vorpal and Siphoning take Charges, Welling charges, Rooting locks the token until the round ends, Hooking and Forceful move the token a space (blocked, they deal Base Damage), Sweeping finds the nearest other foe, Coursing hits everyone adjacent after a spell, Swift offers its second attack, and Reprieve, Emboldening and Devouring fire on their own when the foe drops and reach the player's sheet (the buttons are gone). Against a Fell: Runeguard cuts the Base, Vengeful, Backlash and Deathsong strike back, Guarding and Backlash answer a miss, Bulwark is offered on the attacking foe's card, Afterimage makes the first Evasion Lucky, Driftstep prompts a step, Shadowmeld leaves a Fell who dealt nothing Obscured. On the sheet and the row: Honed counts a 5 as a Fellmark, Hunting makes the attack Lucky, Agile doubles the movement shown for the round, Blinking reaches anything in sight but not through a wall, Treadlight ignores a Pale's movement and damage, Ironroot's space refuses Pales and placed utilities. The foe-side Rooting, Hooking, Forceful, Vorpal, Siphoning, Welling and Sweeping are worked when a foe's strike is sent to a Fell.

## 2026-10-05 - Snap stays as it was set

Snap to the grid belonged only to the browser it was set in, and anything that redrew the grid (loading a board, another screen's grid change) snapped every token again regardless. It is now kept with the table's grid, so it holds between sessions and on every screen, a scene's own grid never changes it, and with snap off nothing re-snaps the tokens.

## 2026-10-05 - Placed sounds stay put, and drag smoothly

Placed sounds were lost on every reload: the table had already made an empty sound list for the map by the time the saved board arrived, took that as having sounds of its own, ignored the saved ones and saved the empty list over them. Only a table with placed sounds now keeps its own (merged with the saved ones by map), and a LoreMaster table that has not yet heard the board sends no sounds at all. A dragged ♫ stopped after half a space because the marks were redrawn under the pointer; they are no longer redrawn mid-drag, and the drag follows the whole page.

## 2026-10-05 - Sounds: move them, tap them, fade them, upload several

A sound's ♫ on the map answers the LoreMaster now: a tap opens that sound, a drag moves it (the map's pan used to take the press, so neither worked). Each sound gains Fade in and Fade out (off, or up to ten seconds): it comes up over that time when it starts being heard, and goes over that time when it stops (out of reach, taken off, another map or scene). Uploading takes several files at once: each joins the adventure's sounds, the first goes onto the sound it was chosen for, and anything that is not audio or is over 20 MB is named as not uploaded.

## 2026-10-05 - Sounds you can hear, edit from the map, and manage

A placed sound was silent for the LoreMaster unless Hear it as was set: by default the LoreMaster now hears from the token they select, else the party's middle, else the middle of their view, and placed sounds no longer go quiet when one's music is turned off. Tapping a sound's ♫ on the map opens that sound alone, to change or take off the map. Each sound's list now uploads a sound (Upload a sound…) and opens My sounds (Rename or remove my sounds…), where each of the adventure's sounds can be played, renamed, or removed from the adventure and every map that plays it, and the folder's others added; the top Upload button is gone. The LoreMaster's players'-view bar sits lower, clear of the frame, and the minimized scene runner sits above the bottom border.

## 2026-10-05 - The LoreMaster's table hears its board again

Since the second-screen fix, a LoreMaster's table could fail to hear the stored board at all: the adventure's own save on opening moved the version on first, so the first read came back "nothing newer", and that no longer counted. The table then never armed the lobby (no lobby bar, no landing in the lobby) and held every save. Until the board has been read once, the table now asks for all of it.

## 2026-10-05 - The players'-view bar fits the window

Seeing the lobby as the players do, the LoreMaster's bar is one slim line centred on the table (PLAYERS' VIEW, Threadwalk, Set the lobby, Bring them in, Back to the map), the same shape as the lobby bar, scrolling sideways rather than running off the edge of a window that is not full screen; on a phone it sits beside the wrench. The chat's To button no longer squeezes the box beside it.

## 2026-10-05 - Two screens, one board: scene by scene, the newer layout wins

The remaining loss (one scene's map and 25 tokens at a time) came from two LoreMaster screens open at once, a phone and the computer: each saved its whole copy of every scene, so an older copy of a scene, or one that had not loaded, replaced what the other screen had laid out. Each scene's layout is now stamped when it truly changes on a screen, and the site merges scene by scene: the newer layout wins, a scene this screen did not send stays, and a copy never empties a laid-out scene or strips it of every token unless the LoreMaster cleared it on purpose (taking off its last token says so). A player's save now only moves stored tokens by id, never adds or removes them. Paste velo/backend/campaignview.web.js and velo/page-threadspire.js.

## 2026-10-05 - The lobby bar on a phone sits up top

On a phone the LoreMaster's lobby bar no longer covers the rail at the bottom (Story, Stages): it sits at the top beside the toolbar's wrench, one slim line (LOBBY, See it, Set it, Bring them in, fold) that scrolls sideways rather than wrapping, and folds to a small "In the lobby" pill there.

## 2026-10-05 - No more boards emptied by a second screen

The cause of the lost maps and tokens: a LoreMaster's table only starts saving once it has heard the stored board, but a second LoreMaster screen (a phone beside the computer) took the live room's pieces (the lobby, music, clocks) as having heard it, and saved its own empty scenes over every map and token. A failed or unchanged read was also counted toward "nothing stored", and six of them did the same. Now only the site's own stored board, read in full, lets a LoreMaster's table write; a failed read answers nothing; and the site itself refuses a LoreMaster's save that would empty most of the board (under a third of its placed tokens and of its scenes' maps, or every scene gone), keeping the board as it was in Saved versions and saying so at the table. Paste velo/backend/campaignview.web.js and velo/page-threadspire.js.

## 2026-10-05 - Sounds have their own folder

Placed sounds and trigger sounds come from a sound shelf of their own, apart from the music: uploads go to the site's LoreFell Sounds folder (Media Manager), straight from the Sounds window (Upload a sound), landing on the sound being edited or the newest one without a sound. The folder's other sounds are listed to join this adventure in a tap. A trigger's sound lists the sounds first, then the music. Paste velo/backend/campaignview.web.js and velo/page-threadspire.js.

## 2026-10-05 - The lobby bar moves again

The LoreMaster's lobby bar has its grip back, folded or open: drag to move it, double-click the grip to put it back, and it stays where it was put when folded or unfolded. Backlog: #730, #733, #734 and #739 closed as not planned.

## 2026-10-05 - The backlog; Lore Check calls; a tidier lobby, runner, Sounds window and token menu

The backlog lives in GitHub Issues (label backlog), described in BACKLOG.md, with a pull request template asking which issue each change moves. Lore Check beats gain Call for the check: everyone or chosen Fell roll a chosen skill (Lore by default) against the LoreMaster's 1d6 + the Skill Difficulty and anything added, each on their own screen, results in the log; a Fell with no player is rolled for. The runner centres on the table rather than the window (with the frame's rail measured), in full screen too; The table loses its dot. The LoreMaster's lobby bar is a compact pill under the toolbar, centred on the table, that folds to "In the lobby". Players have no toolbar in the lobby after all. A lobby armed before the saved one arrived now takes its picture or video, music and weather from it rather than losing them. Placed sounds, lorebound rings and trigger rings live in the map's moving layer, fixed to the map like tokens. The Sounds window is rebuilt as cards, and the token menu's rows fill its width.

## 2026-10-04 - A quieter runner and token menu; the lobby's words fold away

The runner keeps what is reached for in play (the scene, Maps, Tokens, the fight, Mark) and puts the Lobby, Clocks, Sounds and Vote behind one button, The table, a menu that says where each stands (a gold dot when something is live) and opens above the runner when there is no room below. The token menu shows the often-used row (hide, lock, light, height, a Fell's whisper, and any trigger or lorebound set on it) with the rest under More; every button names itself on hover or focus at once. In the lobby, a player can bring out the toolbar, and the lobby's words fold away to just its name (kept per device).

## 2026-10-04 - The audience votes

The runners gain Vote: the LoreMaster asks a question with two to four choices and opens the vote. Viewers vote at table.lorefell.com/vote.html for the adventure (a link and, on the stream, its QR code), on any phone, one vote a browser, no account; the room counts (/pub/vote) and refuses a second vote or one after closing. The table and the stream show the question with its bars filling, movable; closing it marks the winner, says it in the log, and the result stays until the LoreMaster takes it off the screen.

## 2026-10-04 - Hex grids

The grid panel gains Shape: Squares or Hexes. Hexes are pointy-topped, as wide as a square of the cell size, so a step to a neighbour is one cell as on squares; they take the grid's fade and shift, tokens snap to hex centres (dropped, tapped to move, or all at once when the shape changes), and the setting travels with the grid to every table.

## 2026-10-04 - Triggers: a chance to avoid, ambushes, doors, light, battle and portals

A trigger can give a chance to avoid it: the Fell's player is asked at once to roll a chosen skill, 1d6 + that skill against the LoreMaster's 1d6 + the Skill Difficulty and anything added (the climbing check's way), and their table answers in the log; beating it avoids what it does to them (damage, Afflictions, the portal), while the line, its sound, the Pales and the clock happen regardless. The LoreMaster can roll for a Fell with no player, or say it lands or is avoided. It can spring an ambush (chosen hidden tokens show themselves), open or slam shut chosen doors, bring darkness or light, begin combat, and send the Fell through a portal to a spot marked on the map, the token arriving with a swirl on every screen (none for reduced motion).

## 2026-10-04 - Triggers that do it all at once

A trigger now takes several Afflictions and several Pales (each spreading the same distance), damage to the Fell who sets it off (Base and Bonus, physical or magical, as Send a hit deals it), a sound from the music library played for everyone when it fires, a clock to tick, and its line shown across everyone's screen for a few seconds as well as in the log. Everything set happens at once. A log line can carry a banner and a sound, played once by each table that sees it arrive (never for history).

## 2026-10-04 - Trigger tokens

Any token that is not a Fell can be made a trigger (the LoreMaster's token row): its range (stepping onto it, or up to five spaces), what happens (said in the log), an Affliction for the Fell who sets it off (on their sheet, as the LoreMaster gives one, in a fight or out of one), a Pale that spreads from it (any of the twelve, its own space or up to three around), whether it fires once or every time a Fell comes in again, whether it shows itself when it fires (hide the token for a trap), and whether it is armed. Only the LoreMaster's table watches, never while Threadwalking; the LoreMaster sees each trigger's reach as a dashed red ring, greyed once spent.

## 2026-10-04 - Weapons swap on the quick bar

The quick bar takes weapons: a weapon in hand reads Attack and rolls with it; one carried but not held reads Wield, and a tap swaps it into the hand on the sheet, putting the held ones away as the grip needs, and says so (or why not). The sheet's hand now lists every weapon carried, held or not.

## 2026-10-04 - Lorebounds on the map

Any token that is not a Fell can be marked as a lorebound (the LoreMaster's token row): whose it is and its form, Familiar, Companion or Corsair. Its Fell's player may move it (the room allows it too), it moves as far as its Fell (a Corsair twice as far, FellGuide, Lorebounds), and a dashed ring shows its Mobility range, where its Aspect reaches: to everyone in a fight, to its owner and the LoreMaster otherwise.

## 2026-10-04 - The quick bar

Each player has a quick bar on the table: they star what they reach for most (Attack, Evade, any skill with its bonus, their Acts, Reacts and utility items) and it sits at the bottom of the table, movable by its grip, raised above the hand row in a fight. A tap rolls the skill or the attack through the sheet as the picker does, or, in a fight, readies the Act or React on the hand row (an item opens the hand row's items); outside a fight an Act says it waits for one. Kept for each Fell on its device; hidden in the lobby.

## 2026-10-04 - Whispers from a token; sounds placed on the map

A Fell's token offers a whisper: the LoreMaster's token row gains Whisper to, and a player right-clicking another Fell gets Whisper to or Roll; either sets the chat to that whisper, ready to type. The runners gain Sounds: place a sound on the map from the music library, with a reach in spaces and a loudness. Each player hears it by their own Fell's distance, louder as they close in, muffled through a wall, silent beyond its reach; the stream hears it from the party's middle; the LoreMaster listens as any token, or the party's middle, or not at all, and sees each sound's mark and reach on the map. Each map (each floor) keeps its own sounds; the lobby and a Threadwalk keep them from the players.

## 2026-10-04 - Clocks

The scene and battle runners gain Clocks: segmented countdowns (4 to 12) the LoreMaster names and ticks, each seen by everyone or by the LoreMaster alone. They sit at the top of the table, movable by their grip; a tap ticks one, a right-click takes one back, and a full clock turns red and says so in the log. Public clocks show to the players and the stream, through the live room and the saved table.

## 2026-10-04 - Whispers

Every chat box gains a To chooser beside Say: All, or a whisper to the LoreMaster or any one Fell at the table (the LoreMaster can whisper to any Fell); typing "/w Name words" whispers too. A whisper shows, in its own colour as "whispers to", only to its writer, its reader and the LoreMaster; other players, the stream and the published combat feed never see it.

## 2026-10-04 - A stage's maps are its floors

Moving between maps of the same stage moves between floors: each keeps its own tokens (foes, NPCs, objects), and the Fell go with the party; coming back finds a floor as it was left. Fog, walls, lights, elevation, Pales, effects, notes and drawings were already each map's own; weather now is too (a floor without its own takes the scene's).

## 2026-10-04 - A table Fell is the one handed to a player

The Fell handed to a player is one made at the table (Someone at the table: owned by nobody, the adventure's), not the LoreMaster's own: Add a player, Hand a table Fell to a player lists the table's Fell, with Make one at the table. Adopted, it becomes its player's ordinary Fell and no longer the table's. Paste velo/backend/invites.web.js.

## 2026-10-04 - A Fell made for a player to adopt

The LoreMaster can set any of their own Fell waiting in an adventure (Add a player, A Fell waiting for a player; Characters gains adoptFor). A player who has joined through the invite link finds it on the join page, above their own Fell, with Make it mine: it becomes theirs, joins the adventure (its sheet's record too), stops waiting, and its sheet opens. Paste velo/backend/invites.web.js, velo/page-join.js and velo/page-threadspire.js.

## 2026-10-04 - The lobby's own music; Threadwalk keeps the table's music

The lobby can have music of its own, a track (looping) or a playlist (played through and around), chosen in the lobby window; whoever is in the lobby hears it, and when they are brought in the table's music takes over. A lobby with no music is silent: players waiting never hear the scene the LoreMaster is working in. Threadwalking never changes what the players hear: the visited scene's music plays for the LoreMaster alone, and coming back puts the table's music back as it was before anything is said to the room again.

## 2026-10-04 - Movable bars, weather in the lobby, a focus for Story pictures, uploads for beats

The map toolbar and the lobby's bar each have a grip: drag to move them, double-click to put them back; where they sit is kept on that screen. On a phone the lobby's bar sits along the bottom, its words above and its buttons sharing the width. The lobby has weather of its own (any of the table's), drawn over its picture or video for the players, the stream and the LoreMaster looking at it. A Story cover has Move the focus: drag the picture in a frame of the cover's shape, and the part that stays in view is kept, on the cover and on its card in the lists. Every beat and note can upload its picture as well as take an address, with a preview.

## 2026-10-04 - Video maps keep their video; a page for every name in the Codex

A video map's video address was saved to the account but dropped, because the Assets collection had no field for it, so after a reload it came back as its still (and the lobby took the still). Assets gains video. Video maps uploaded before this need uploading again. In the Codex, a person, place or thing opens its own page: what the table wrote of it, what the Fell's Records say, every line of the recaps that names it by session (the name in bold), and the others named alongside it, each a step to their own page, with The sessions that name them and Write about them (the name filled in).

## 2026-10-04 - The Histories page, gathered a part at a time

The Histories page could not be gathered on a channel with many playlists: a worker may make only so many outside calls per request (fifty on the free plan), and each playlist took one. The room now builds the list a part at a time, the never-read playlists first and then the longest unread, within a budget per pass, keeping the rest from the last pass; the page asks again until it is whole, and the two-hourly round runs a pass too so visitors find it ready. When it cannot be gathered, the page says why.

## 2026-10-04 - Adventure, not campaign

LoreFell does not say campaign. The Histories page speaks of adventures, and the Anexanum writes a new History's note as Adventure and its row on The Histories as Adventure.

## 2026-10-04 - The channel's campaigns page is The Histories

The public page of the channel's campaigns is The Histories (embeds/the_histories.html, for a page at /the-histories), since The Adventures is already the page of published adventures.

## 2026-10-04 - The Adventures: every campaign on the channel, for anyone

A public page (embeds/adventures_watch.html) lists every playlist on the LoreFell channel except the Lorebounds and the Shorts, newest first, each as a wide banner from its own art with its episode count, its dates and a snippet (the playlist's description, or the opening of its FellGuide History when the playlist has none). Opened, it lists the episodes in order, each named by the part after the pipe, linked to YouTube within the playlist, with Watch from the start, the playlist, and Read its History when the History is in the vault. The room gathers it with the owner's connection and keeps it for six hours (/pub/adventures), so visitors cost nothing of YouTube's allowance.

## 2026-10-04 - Lobby uploads stay the lobby's; the lobby's picture cannot be deleted

An upload begun for the lobby carries that with it, so a long video that finishes after the Maps window was closed still goes to the lobby, never into a stage waiting for a map or onto the table (it had landed in a stage). The lobby's picture or video cannot be removed from the shelf, singly or in a batch, while it is the lobby's: removing it deleted the file and left the lobby empty.

## 2026-10-04 - From the email, one Approve does it all

The review opened from the session video's email ends its recap step with Approve, which does all of it at once, each part listed and able to be left out: adds the recap to the Journal, adds it to the Codex, makes it the Retelling, and emails it to the adventure's players (as the recap email does, titled with the session's scene); then the title and description come up to approve and put up.

## 2026-10-04 - An email when a session video is ready to review

When the room's round writes a new session video's draft, it asks the site to email Nate (get_anexanumReady; the site asks the room's /ax-pending what to say, answered once per draft, so nothing else can send it). The email, on the recap template, links to ThreadSpire with the adventure (the room learns each adventure's name from the LoreMaster's table) and the video: opening it holds the round, and the review starts at once: the names to check, the recap, then the title and description (from the Story's own scenes) to approve and put up, which marks the round done. Left alone, it still goes up on its own twelve hours after the draft. Paste velo/backend/http-functions.js and velo/page-threadspire.js.

## 2026-10-04 - New session videos titled and described on their own

The table room runs a round every two hours (a Cloudflare cron) for the channel's owner. It looks at the uploads of the last seven days; a session video (over twenty minutes, no pipe in its title yet, not still streaming) is waited on until YouTube has made its captions, then given a title, Adventure | Episode, and a description (hook, teaser, chapters, any moments kept at the table, the invitation, hashtags), kept as a draft. Twelve hours later, if Nate has not opened the draft in the Anexanum, it goes up as written; opening it holds it for him to put up. Shorts, clips and videos already titled are left alone. The Anexanum's videos show each one's state (waiting for captions, draft ready and when it goes up, held, updated automatically) and a Check now. The room reaches the AI proxy through a service binding.

## 2026-10-04 - A new History gets its row on The Histories

Writing the world for a new History also adds its row to the table on The Histories' own page ([[Name]], Campaign), shown as a changed page in the review like the order map.

## 2026-10-04 - Make a transcript on the graphics card, or the processor

Make a transcript tries an NVIDIA graphics card first, finding its libraries in Python's own folders once installed (pip install nvidia-cublas-cu12 nvidia-cudnn-cu12), and if they are missing or the card fails ("cublas64_12.dll is not found") the processor takes over for the rest of the session, with a line saying so.

## 2026-10-04 - The Recap Cutter reads the recording's sound itself

Make a transcript failed with "open() got an unexpected keyword argument 'metadata_errors'": a newer PyAV refuses the way faster-whisper opens a file. The Cutter now reads the sound with ffmpeg, ten minutes at a time, and hands it to faster-whisper directly, carrying each piece's times through, so memory stays small on a long session and progress shows by the minute.

## 2026-10-04 - Recaps from any timed transcript, or one made from the recording

The Anexanum reads text transcripts that put a time at the start of each line ("00:01:23 words", "[1:23] Name: words", and the like), as well as .srt, .vtt and .sbv, so the recap's clips can be chosen from them. The Recap Cutter gains Make a transcript: from the recording alone it writes a timed .srt beside it on Nate's machine (faster-whisper; Careful is better with names, quick is faster), to use in the Anexanum's Use a transcript file.

## 2026-10-04 - A recap video from a transcript file

The Anexanum's recap video can work from a transcript file instead of YouTube's captions: Use a transcript file on the recap screen (offered at once when YouTube cannot give the captions, as when its daily allowance is spent), or A recap video from a transcript file on the videos tab, for any session, on the channel or not. An .srt, .vtt or .sbv file (Restream or YouTube Studio) carries the times the clips need; a .txt file gives the recap alone. A plan from a file with no video on YouTube shows its times without watch links, and the Recap Cutter cuts it from the recording the same way.

## 2026-10-04 - YouTube's allowance named when it runs out; captions read once

When YouTube refuses because its daily allowance is spent (each video's captions cost 250 of its 10,000 daily units), the Anexanum and the table now say so plainly and when it resets, instead of an empty list or "that video is not on your connected channel". A video's captions are read from YouTube once and kept in the room in pieces, so writing its title and description, planning its recap video, writing its chapter and transcribing it again cost nothing more.

## 2026-10-04 - The Anexanum on a phone; F for full screen

On a phone the Anexanum runs in one column: the header stacks, the two tabs share the width, the steps scroll sideways, every list row puts its words on top and its buttons beneath at a touch size, fields are full width (16px text, so a phone does not zoom), and the review's ledger sits above the page. On a desktop, F (anywhere but a text box) or the Full screen button toggles full screen.

## 2026-10-04 - Every adventure opens in the lobby

Every time an adventure opens on the LoreMaster's table (a fresh open, a reload, or a switch to another adventure), everyone is sent to the lobby and the LoreMaster opens looking at it, within a second or two of the board arriving; the twenty-minute window that let a quick reload skip it is gone. Players keep landing in the lobby whenever no LoreMaster is at the table.

## 2026-10-04 - The lobby kept, not rebuilt; the runner keeps its shape

The lobby is kept while hidden instead of being taken down and built again, so its video carries on where it was when the LoreMaster looks at it again (a rebuilt video sat on its still). While the lobby is up, the runner and the toolbar are hidden without leaving the layout, so the runner's cards keep their size and do not come back squeezed into a narrow column; leaving the lobby view repaints the runner.

## 2026-10-04 - The scene's stage map is never overlaid; the Retelling keeps its paragraphs

The cause of the lobby's picture appearing under the tokens: an earlier lobby upload wrote its picture into the map the scene (or its session) remembers, and on every load that remembered map was laid over the stage's own. A scene's stage map now always wins over a remembered map that differs from it, and choosing the lobby's picture puts back whatever the scene showed before, if anything moved it. The Retelling and the Codex keep a recap's paragraphs and line breaks.

## 2026-10-04 - The lobby beneath the frame; the right adventure's; everyone starts there

The lobby sits inside the table's stage, beneath Joel's frame, the rail and the HUD, so a player in it can open their Fell and do everything with it while they wait (it had covered them). A lobby belongs to its adventure: none shows while an adventure is still arriving, and an adventure being left takes its lobby with it. Opening the LoreMaster's table fresh (not a reload within twenty minutes) puts everyone in the lobby and the LoreMaster with them, looking as the players do, with Threadwalk to set up scenes (Open in the lobby, in Settings, is on unless turned off). Threadwalk closes the scene list at once and leaves the lobby view. The lobby's video is made as a muted element before it is given its source, so it plays on its own.

## 2026-10-04 - The lobby: nothing behind the picker; one bar; uploads stay out of the scene

While the adventure picker is open (on opening the table, or choosing another), there is no lobby behind it, only the blank table. Seeing the lobby as the LoreMaster puts away the lobby bar, so the two no longer overlap, and its own bar stays on one line. An upload made for the lobby never becomes the scene's map: it waits until it has landed and goes to the lobby, and a map still uploading cannot be chosen for the lobby (its temporary address stops working, which froze the lobby's video on a still). The lobby's video starts again if it stalls.

## 2026-10-04 - The lobby from the Maps shelf; the LoreMaster in the lobby; quieter uploads; marks you can change

No lobby shows before an adventure is open and the table knows who you are (the last adventure's lobby showed behind the adventure picker). The lobby's picture or video is chosen in the Maps window itself, folders and all, which says it is choosing for the lobby, or uploaded from there and picked as soon as it lands; No picture clears it. A video upload says only that it uploaded, or that it did not. The LoreMaster can look at the lobby as the players see it (See it, on the lobby bar), with a bar there to Threadwalk to a scene, set the lobby, bring everyone in or go back to the map; Open in the lobby (Settings, Your table) opens the table that way whenever everyone is in it. A new mark can be undone from its bar, and in Moments each mark can be moved five seconds either way or removed for good.

## 2026-10-04 - Recap clips start on a line and end on a sentence

Every clip of a recap video lands on the captions: it starts a breath (0.2s) before the line it opens on, and ends a breath (0.35s) after the end of a sentence, a line ending in . ! ? or followed by a pause of 0.6s or more (auto-captions do not always punctuate). The trims step the start a line at a time and the end a sentence at a time, instead of a second, and Says shows exactly the lines inside the clip. Picks, added moments and reopened plans all land this way.

## 2026-10-04 - A recap video built on the story

Recap video now starts from the story: it first writes a short recap of the session from its captions (100 to 140 words, the kind ThreadSpire writes, ending where the story stopped), shown and editable, then takes the recap's beats in order and finds, for each, the few seconds in the captions where it is shown happening in the fiction (characters speaking in the story, choices, reveals, consequences, not a long stretch of one narrator, never rules talk or banter), lays in one or two highlights (funny, triumph or drama, from the marked moments first) where they happened, and ends on the session's final minutes. Each clip is marked Story or Highlight, with the beat it shows and what is said in it. Thirty to forty-five seconds. Write the recap again, and Choose the clips from this recap; the recap is kept with the plan.

## 2026-10-04 - A recap video: planned in the Anexanum, cut on Nate's machine

The Anexanum's videos gain Recap video: from the session's captions, line by line, and the moments marked at the table (kept and suggested, sent from ThreadSpire's Moments when they are kept), the AI picks six to eight clips of three to five seconds in story order, thirty to forty seconds in all. Each can be watched from its start, trimmed a second at a time, or dropped, a marked moment can be added, Choose again picks afresh, and the plan is kept as a draft. Download the plan writes a recap plan file. The new tools/recap-cutter (Python and ffmpeg on Windows, Recap Cutter.bat) takes the plan and the session's recording and cuts the recap with a quick fade at each cut, 16:9 and a 9:16 vertical over a blurred fill, beside the recording; Move every clip by covers a recording that starts a few seconds apart from YouTube's video. No title card, no music. The room hands back caption lines with their seconds and keeps the moments by video. Nothing of it reaches ThreadSpire's players or the Retelling.

## 2026-10-04 - The lobby is home; Threadwalk

A player (and the stream) sees the lobby whenever the LoreMaster is not running the table: with no LoreMaster in the live room, or the room not reached, the map is out of reach, so a Fell opened to level up during a rest between sessions cannot touch a token; the sheet still opens from the menu. With the LoreMaster there, the lobby follows Send everyone to the lobby and Bring everyone in. The LoreMaster's table, opened after three hours away (a new session, not a reload), puts everyone in the lobby to be brought in. A quiet visit is called Threadwalk.

## 2026-10-04 - A quiet visit

The LoreMaster can step into another scene to set it up while the players stay where they are and see nothing of it: Visit quietly beside each scene in the scene runner's list (not in the middle of a fight). While visiting, the LoreMaster's table says nothing to anyone (nothing to the live room, nothing saved, the saved table not taken in), a bar says where they are and that the players see none of it, and what the players do at the table meanwhile waits in a queue. Back to the table saves the visited scene's layout to that scene, puts the table back as it was, plays the queue over it, and only then speaks again. A scene with no map yet keeps the tokens set out in it, and they are there when everyone is taken to it.

## 2026-10-04 - The lobby

The scene and battle runners gain Lobby: the LoreMaster sends everyone to the lobby, sets it (a picture or video from the map shelf, a title, the adventure's name unless another is given, and a line for the players) and brings everyone in with one press. Players and the stream see it fill the screen beneath the frame, the rail and the HUD (so the sheet and windows still open), with the next session when one is set; a video plays muted and looping, and Still maps shows its still. The LoreMaster keeps the map and sees a slim bar while the players wait, with Set it and Bring everyone in. The lobby is kept with the table, so players opening it later land there until they are brought in, and it travels through the live room.

## 2026-10-04 - The Anexanum: the videos

The Anexanum's videos tab lists every video on the channel, or one playlist, oldest first, each marked updated or draft saved. Write it reads the video's captions and description and writes its title as "Adventure | Episode" and a description made to be found: a hook, a teaser, chapters from the timed captions, an invitation to lorefell.com and hashtags. The adventure comes from the title before the pipe and is editable; if it matches a History in the FellGuide, that History's chapter titles are offered, and the AI uses one when the episode is that chapter; the episode is editable too. Save draft keeps it in the room; Write it again starts fresh; Update the video replaces the title and description on YouTube. Draft the rest drafts every video without one, one after another, never putting any up. The room gains /ax/uploads and /ax/video/update, and /ax/video hands back the captions' timings.

## 2026-10-04 - The Anexanum

A new tool, The Anexanum (embeds/the_anexanum.html, a hidden members-only page /the-anexanum with velo/page-the_anexanum.js), Nate's lore desk, open only to the member who owns the connected YouTube channel (a ticket from anexanumTicket, checked by the room). The Histories, in four steps: choose a playlist (one History per playlist, or add to an existing History); write the chapters, one per episode from its captions and description, in the FellGuide's voice with STYLE.md's rules and a chapter of A Court of Ashes as its model, picking up where it stopped when YouTube's allowance runs out; write the world, a page for each person, place, beast and thing the chapters name, updating a page already in the FellGuide rather than replacing it, then the History's own page (opening, Campaign note, chapters table) and its block in NAV_ORDER_MAP; review and send, a ledger of every page marked new or changed, each editable, a changed one shown line by line, and Send to the FellGuide commits the ticked pages to the vault's main branch for Obsidian to pull. Drafts are kept in the room until sent or dropped. The room gains the /ax endpoints (playlists, a playlist's videos, a video's description and captions, the vault's files and a commit, drafts) and the FELLGUIDE_TOKEN key, set from the repository secret. The videos tab points to ThreadSpire for now.

## 2026-10-03 - Recaps start short

A recap from a session's video is written short to begin with, 100 to 140 words; Shorter takes it to 70 to 100, Longer to 170 to 230, and A fresh take stays short.

## 2026-10-03 - Write it again, five ways

In the recap from a session's video, Write it again opens five choices: Shorter (100 to 140 words), Longer (260 to 340), A fresh take, More vivid and Plainer. Shorter, Longer, More vivid and Plainer rework the recap on screen, edits included, keeping its events; A fresh take writes it anew.

## 2026-10-03 - Videos from any adventure; Codex entries renamed and named for their scene

Tidy old videos can show Every video on the channel, oldest first, beside this adventure's own: a video from an adventure not in ThreadSpire is written from its captions alone (no outline, no Journal), and the Update window has The adventure, the name before the pipe, taken from the video's title and editable, kept with a draft. A recap written from a session's video is named for the scene of the Story it mostly tells (picked by the AI from the outline, changeable in the recap step, with a box for any other name), and goes into the Codex under that name. The LoreMaster can rename any Codex entry, by typing or by choosing a scene.

## 2026-10-03 - Drafts for a video's update; tidying the old videos

Update the video has Save draft: the title, description and scene are kept with the table and the video opens on its draft next time (Write it again starts fresh); updating the video clears its draft and marks it updated. Settings, Sessions, YouTube gains Tidy old videos: every video on the channel that names this adventure, oldest first (read in pages of fifty, up to four hundred), each marked updated or draft saved, opened one by one, or Draft the rest, which writes a draft for each video without one, one after another, never putting any up: the LoreMaster reads each and updates it. The room's uploads list reads more than fifteen when asked.

## 2026-10-03 - A video is named for the scene it played out in

Update the video names the episode by scene, not session, since a session often runs over several episodes: the AI reads the recap, the captions and the Journal against the Story's outline and picks the scene the episode mostly played out in, written exactly as the outline has it, and the title becomes "Adventure | Scene". The window shows Where this episode played out, a list of every scene by its session with the match chosen, and changing it rewrites the title; the name after the pipe can still be typed freely.

## 2026-10-03 - Moment tags; a video's title always carries its session

A moment's kinds are Tags now, several at once, with Drama added (Funny, Triumph, Disaster, Epic, Drama), in the mark bar, the Moments review and the Journal's links. Update the video always finds the session's name (the recap's, the Story's, the Retelling's, or the newest sent recap's, past a bare "Session 1"), shows it in its own box that rewrites the title as "Adventure | Session" as you type, and replaces the whole description rather than a marked section of it.

## 2026-10-03 - Moment marks

During a session the LoreMaster presses M (never while typing) or Mark on the scene and battle runners, just after something worth keeping. A mark reaches back, 45 seconds by default and 10 on, with 30, 60 and 90 a tap away in the bar that confirms it, along with a kind (funny, triumph, disaster, epic); it takes the scene's name. Marks are kept with the LoreMaster's table. The log's own big beats (a Fellmark or Fellstrike, the fallen, Lore Points, a level) are offered as suggestions, unticked. Moments, beside each session video in From the session's video, lines the marks up with the video (a live stream says when it began; a five-second nudge covers the stream's delay), lets each be kept, renamed and given a kind, with a link to watch from it, and Tighten with the captions trims each to where it really starts. Kept moments go into the Journal as links for clipping and into the video's description as a Moments list the next time it is updated. The room hands back when a live stream began and how long a video runs. Only for the site's own channel.

## 2026-10-03 - Update any session video

Every session video in the list has Update the video, recap written or not; without one written from it, the Retelling's recap (or the newest sent) gives the description its story.

## 2026-10-03 - YouTube is the site's own channel only; Update the video, easier to find

The YouTube connection belongs to one channel: the site owner's, the first LoreMaster to connect (Nate). For anyone else the room refuses to connect and the table shows nothing of it: no Settings row, no link field, no prompts, no channel list (the copy-a-transcript steps stay for everyone). Update the video is easier to find: Settings, Sessions, YouTube has Update a video, which opens the session videos with their buttons, and each Codex entry that came from a video has Update the video beside Watch.

## 2026-10-03 - Session videos get their title and description; the Codex in the Lore Points pill

For a session video on the connected channel, ThreadSpire writes its title as "Adventure | Session" and a description section made to be found and shared: a hook, a short teaser from the recap, chapters from where the story turns in the timed captions (the first at 0:00, at least three), a line inviting people to lorefell.com, and four to six hashtags. It is shown in full to edit, and nothing goes up until Update the video. Only the section between its two marks is ever written, so anything else in the description stays as it was. It is offered right after a recap is written from a video, and from From the session's video beside each written one. The room reads a video's title and description and puts the new ones up (/yt/video, /yt/video/update), and hands the captions back in timed pieces. The player's Lore Points pill holds the points, a thin white rule and the Codex's mark in white, which opens the Codex; the separate gold button is gone.

## 2026-10-03 - The Retelling stays up; Codex and Retelling from recaps and the Journal

The Retelling card is wider in a large window (half the screen, never under 560). It no longer closes itself: when its minute is up, the LoreMaster's copy turns its edge and bar red, and the LoreMaster takes it down when ready. Recaps sent gain Add to the Codex beside Make it the Retelling and Delete. Every Journal note gains two small marks: Add to the Codex (as an entry of the Story, never twice) and Make it the Retelling (lit while it is).

## 2026-10-03 - Write an Entry anywhere in the Codex; the Retelling on the LoreMaster's screen; the Hearth knows your role

The Codex's first tab is The Story, and every tab has Write an Entry, for the LoreMaster and the players: a person, place or thing with a name and what is known of it, a quest, a clue, or a note on the story, each marked with who added it, removable by its writer or the LoreMaster (addCodexItem, removeCodexItem; AdventureSessions gains codexItems). A player's person, quest or clue goes into their own Fell's Records (Characters, Quests, Clues), which the Codex reads, so it is kept in both. The LoreMaster's Story entry stays a full recap entry. The Retelling shows on the LoreMaster's own screen as well as the stream and the players'. The Hearth opens an adventure you run or keep the lore for as its LoreMaster (role=lm), and the role check now finds the owner of an adventure that lives only in the shared story, which was opening the LoreMaster as a player. The player's Codex button sits half a step lower, in a darker gold. Paste velo/backend/sessions.web.js, velo/backend/fatewell.web.js and velo/page-threadspire.js.

## 2026-10-03 - Choosing the Retelling; quieter HUD marks

The Retelling uses the recap the LoreMaster chose: Recaps sent (Settings) and the Codex each offer Make it the Retelling, marked when it is; a recap written from a session's video becomes it on its own. With none chosen it falls back to the newest in the Codex, then the newest recap sent, so recaps sent before the Codex existed count. A sent recap can be deleted from the list (deleteRecap). The LoreMaster's chevron marks sit a little further into their slant and are a quieter gold, below the FellGuide book; the player's Codex button is quieter too, a touch higher and further right in its opening. Paste velo/backend/sessions.web.js and velo/page-threadspire.js.

## 2026-10-03 - The LoreMaster's HUD buttons show; no old dice on opening; the player's Codex seated

The LoreMaster's three chevrons stayed numbers because the player's Vitality numbers were written into them on every repaint, over the buttons; they are the Retelling, the Codex and the LoreVault now, and clickable. Opening an adventure no longer throws the rolls already in its log: a log that arrives before the table has thrown anything is marked as seen, and only later rolls are thrown (lines the table wrote as it opened used to throw the old rolls with them). The player's Codex button sits in the round opening of the frame, left of the Lore Points.

## 2026-10-03 - Name fixes you can edit; your channel's session videos in the video window; the Fell's Records in the Codex

The name check never offers an "Unknown": a misheard name with no match in the Story comes with an empty box to type the right name into (it is used only once something is typed), every suggested name can be edited, and a fix of your own can be added (Heard as, Should be). From the session's video lists this adventure's videos on your connected channel, newest first, each with Write its recap (or Again, once written), so a video put off with Later is a tap away. The Codex gains Quests and Clues, and People shows the characters each Fell wrote in their Records, each marked with who kept it (never a Fell's Secrets or Notes); the LoreMaster can write a Codex entry by hand. Paste velo/backend/sessions.web.js.

## 2026-10-03 - The Retelling and the Codex

The LoreMaster's HUD puts its three empty chevrons to work: the Retelling (a looping arrow round a flame), the Codex (a bound book with an eye) and the LoreVault (a vault door, dimmed, for later); a foe's charge is on its card. The Codex is the story so far as the LoreMaster shared it: The Story So Far, every recap sent to the players or added from a session's video (Add it to the Codex too, on by default), in order as "Session 2 | The Feast of Ash" with its date and a Watch link; and People, Places and Things, every name those recaps mention (matched against the Story, the Library and the Fell when the recap is added), each with the sessions it appears in and a tap through to them. It shows nothing a recap did not. Players open it from a gold Codex button beside their Lore Points. The Retelling puts the last recap up for the stream and every player as a card (the adventure's picture, Previously, in ..., the session's name, the recap), on and off from the LoreMaster's HUD; anyone can close it on their own screen and it closes itself after a minute. AdventureSessions gains codex; new methods getCodex, addCodexEntry and removeCodexEntry. Paste velo/backend/sessions.web.js and velo/page-threadspire.js.

## 2026-10-03 - The FellGuide from every sheet; session videos noticed

Every Fell sheet's header carries a gold book that opens the FellGuide, beside the Condition button, at the table, in the Fell window and on FellGlass alone. Rules link to their own FellGuide pages: an affliction on you in the fight banner (Read Crippled in the FellGuide), each skill (a small book beside its name), each attribute's breakdown, and on the LoreMaster's cards each condition and the stance's tiers (Armor Stances). The pages are mapped by name from the FellGuide's own files. When the LoreMaster opens the table with a YouTube channel connected, the room reads the channel's newest uploads (a new /yt/uploads), and the first one in the last fourteen days whose title names the adventure (the part before the pipe) and has not been made into a recap or waved off is offered: Write its recap, Later or Not this one. Yes pulls its captions and goes to the name check; the part after the pipe is the session's title, carried into the recap and onto its Journal entry. Captions not ready yet are asked about again next time.

## 2026-10-03 - The canon gate on a new branch

The Canon Drift Gate's push run compared a branch's first push against an empty "before" (all zeros), and could fail with no reason given. It now compares a new branch, or a forced push it cannot follow, against where the branch left main, so it judges the branch on its own changes like the pull request run does.

## 2026-10-03 - One picture width in the chooser; the Hearth's sessions take turns

The adventure chooser's pictures are all the same width (a fixed share of the card), whatever is written beside them. On the Hearth, a member in several adventures sees their next sessions one at a time, sliding on every three seconds, with dots to pick one; it holds still while pointed at or focused, and does not move at all for a screen that asks for less motion. One adventure shows one card, as before.

## 2026-10-03 - Lore Drops' weave on top; one rule above Mobility

On the LoreMaster's view of a Fell, Weave Lore Drops (Weave anew) is a gold button under the Lore Drops title, set off from the truths by a rule. In the Attributes card, Mobility no longer draws a second rule over the one under Resistance (the same sheet for player and LoreMaster).

## 2026-10-03 - Weekly sessions; a wider adventure chooser

The next session can repeat every week at its day and time, with an end date if wanted. Settings shows "Every Saturday at 9:00 PM. Next: ..." and the coming six weeks as chips: tap one to skip that week, tap again to bring it back. The reminder email, the players' menus, the Hearth and the test email all follow the next week that is not skipped and has not ended; nothing needs setting again each week. AdventureSessions gains repeatWeekly, repeatUntil and skips; a new method, skipSessionWeek. The adventure chooser's pictures take half of each card, "You run it" is gone (a lorekeeper's adventure still says so), and New's second button is Import. Paste velo/backend/sessionsCore.js, velo/backend/sessions.web.js and velo/page-threadspire.js.

## 2026-10-03 - Every adventure with its picture; switches beside their words

The adventure chooser shows each adventure's picture, wide (168 by 84), in Yours (read from each story's root, in one look-up by listMyCampaigns) and in Published (kept on the published row when it is published, read from the pack for ones published before). In a narrow window the picture goes on top and the words beneath it. A Settings or menu row whose only control is a switch keeps the switch beside its words at any width. Paste velo/page-threadspire.js, velo/backend/fatewell.web.js and velo/backend/published.web.js.

## 2026-10-03 - Video maps

The LoreMaster can put an MP4 (or WebM) up to 100 MB on the map shelf, from the picker, by dropping it, or by pasting it. It goes straight from the browser to Media Manager, LoreFell Maps (a new backend method, mapVideoUploadUrl, beside the music one), with its progress shown; its first frame is uploaded as its poster, and its true size sets the board. The video plays under everything, muted and looping, for the LoreMaster, the players and the stream, with the grid, tokens, fog, walls, lights, effects, notes and drawings on top, and pan and zoom moving it like a picture. Its poster, with a play mark, is its face on the shelf, in the map picker and in Stages, and travels with the map through the saved state and the live room, which lays a scene on the poster instead of waiting on the video. Still maps (Settings, Your table, and a player's menu; on by default where the screen asks for less motion) shows a video map as its poster. A picture map in its place takes the video away. Paste velo/backend/campaignview.web.js and velo/page-threadspire.js.

## 2026-10-03 - Settings, gathered; choose your adventure from its banner

The LoreMaster's Settings open with Choose your adventure: the adventure's banner is the button, and it opens a chooser with three tabs: Yours (every adventure you run or keep the lore for, the one on the table marked), New (make one, or bring in a pack file) and Published (the Adventures page, Take a copy to run your own). Below it: Adventure settings (type and world, saved versions, back up, publish), Sessions (next session, YouTube, test the emails, recaps, stream view), Your table (dice, hide my rolls, player view, clean view, full screen, ping colour; on and off are switches) and the seams as a quiet link. A player's menu opens with their Fell's banner (tap to switch or build one), then Sessions (next session, reminders, handouts) and Your table (dice, Fellmarks raise skills, scene pictures, ping colour). The page offers the Adventures page's list and a published pack to the table. Paste velo/page-threadspire.js.

## 2026-10-03 - Roomier windows, settings buttons under their words, the toolbar in two rows, a recap from one entry

Windows have one width on a desktop: 460 for an ordinary window and 720 for the wide ones (the recap, the session's video, recaps sent), which were held at 340 by an older rule. In a narrow window every Settings and menu row puts its buttons under its words. In a window too narrow for it, the toolbar wraps onto a second row rather than running under the menu on the right. Write a recap can draft from one Journal entry, picked from a list, and its box is taller.

## 2026-10-03 - YouTube connected: a session video's link brings its captions

A LoreMaster can connect their own YouTube channel once (Settings, Sessions, YouTube: a Google sign-in), and From the session's video takes the link again: the live room reads that video's captions through YouTube's own API (the caption list and the caption text, nothing else) and the recap flow goes on as before. The room keeps each LoreMaster's sign-in privately, by member; Disconnect forgets it. An i beside the link explains it, and the steps for copying a transcript by hand stay for anyone else's video. The room's deploy sets the YouTube keys from the repository's YT_CLIENT_ID and YT_CLIENT_SECRET.

## 2026-10-03 - The Journal reads well in a narrow window; YouTube's transcript, by hand

In a narrow window a Journal entry puts its time above the note, and the note takes the full width instead of a thin column. YouTube will not hand a video's captions to a server, so From the session's video drops the link and shows how to bring the transcript instead: Show transcript under the video, timestamps off, copy and paste; or download it from YouTube Studio's Subtitles on your own channel and upload it. Upload and paste are unchanged.

## 2026-10-03 - Gold file pickers; a second way into a video's captions

Every file picker across the tools (ThreadSpire, FellGlass, FateWell, BondForge, BrandForge, FoeForge, RelicForge) wears the gold of the primary buttons instead of the browser's white. When YouTube's watch page refuses the room (it asks servers to sign in), the room now asks the way YouTube's own Android and iPhone apps do, and reads the captions in either of YouTube's forms. Upload and paste are unchanged.

## 2026-10-03 - A session's recap from its video; Journal entries can be edited

The Journal gains From the session's video: the transcript comes from the YouTube link (the live room fetches the video's captions, nothing kept), an uploaded file (.txt, .srt or .vtt, timestamps stripped) or pasted text. The AI checks every name in it against the Story (acts, sessions, scenes, NPCs, foes, speakers), the Library and the Fell and their players, and lists what looks misheard; the LoreMaster unticks any that are right. Then it writes one recap of the session, 170 to 230 words (about half a minute to read), from the corrected transcript and the Journal's notes, using the names as spelled. It can be edited or written again, and Add to the Journal keeps it as an entry marked From the session's video; the transcript itself is not kept. Every Journal entry can now be edited in place.

## 2026-10-03 - The Spotlight on every screen

The LoreMaster's table says which tokens stand in the current Spotlight (a new spot part, through the room and the saved state), and every player's table and the stream light the same ones, gold for a Fell and red for a foe. The toolbar list opens under the wrench, lined up with it (beside it when the bar runs down a narrow screen). The FellGuide's Survival page gains Height and Falling.

## 2026-10-03 - Pales; climbing rolls Movement; a roomier Journal

Build the map gains Pales (LoreVault, Pales). New Pale starts from the shelf of twelve (Pyre, Mire, Murk, Chasm, Gale, Slick, Bramble, Blight, Hallow, Hush, Aegis, Maw), named, with its trigger, an amount, an Affliction for a Blight, its duration (the scene, a number of rounds, or once like a trap) and its type; set in a scene it is free, conjured mid-fight it spends 8 (Environmental) or 15 (Magical) Disruptions. Its spaces are painted on the map and everyone sees them, named, in the Pale's colour. A token entering one puts its rule in the log (and tells the LoreMaster); each Next round lists who stands in a Pale that acts at the start or end of a round or while inside, and counts down the ones that last a number of rounds; a Chasm cannot be entered by a player. Nothing is applied by itself. Climbing and climbing down roll the Movement skill (1d6 + Movement against the LoreMaster's 1d6 + the Skill Difficulty); the height gained is still half Mobility. The Journal's Write a recap sits at the left over the note box, and a note may run twice as long (1,200 characters) in a taller box.

## 2026-10-03 - Elevation and climbing; Reveal a room; Sight check; a pack of foes; no Condition tab

Build the map gains Elevation: paint spaces with a height in spaces, up or down (Paint, Clear, and the height), shown on the map to everyone. A player moving onto or off a height is asked for a Mobility check (1d6 + Mobility against the LoreMaster's 1d6 + the Skill Difficulty), by the house rules: a success climbs, or climbs down, up to half their Mobility; a failure gains nothing, a Fellstrike leaves a fall to the LoreMaster; a climb not finished carries on next round, the token showing its height and what is left (▲3/6). Going down offers Climb down or Jump, with the fall damage to read from: from 5 spaces, each point of Temper ignoring one, 2 Base for each space past 4; nothing is applied by itself. The LoreMaster's token menu gains a height for any token. Fog gains Reveal a room: tap inside an area closed in by walls and its fog clears. Move and mark gains Sight check (LoreMaster): tap one token, then another, and a line says whether they see each other, and if not, why (a wall or closed door, beyond Vision, Masked). The token shelf gains Place ×N: a pack of one foe, numbered, sharing its one line. The LoreMaster's tab bar on a Fell drops Condition, as the player's tabs do (sheet-parity test and CLAUDE.md follow). The room lets a player's own token carry its height and climb.

## 2026-10-03 - A steady Spotlight glow; the Treasure Phase centred; doors in Player view

The Spotlight on the map is a soft ring of light around each token in the Spotlight the battle runner is on, gold for a Fell and red for a foe, with no beam and no pulse; it is drawn with the token, so it no longer flickers when the map repaints. The Treasure Phase window sits in the middle of the screen (and still scrolls when tall). The LoreMaster's Player view shows the door and window handles the way players see them.

## 2026-10-03 - The scene runner's scene picker and gear; the fight clock; the Spotlight lit

The scene runner's scene name opens the scenes of its session, to put another on the table without opening the Story. Pictures on or off moves under the runner's gear, which is Scene settings outside a fight. A fight clock, the LoreMaster's alone, sits under the Fellmark from Begin combat: time in the fight and the round, amber past twelve minutes and red past fifteen (the LoreVault's aim is under fifteen). In the Spotlights, the fighters in the Spotlight the battle runner is on stand in light on the LoreMaster's map: a warm glow and a soft beam from above.

## 2026-10-03 - The token menu always whole, with a close; the runner moves; toolbars

The token menu's LoreMaster row (hide, hide the name, lock, light, front, back, duplicate, remove) is drawn every time the menu opens: closing it and opening the same token again left the row empty while its memory said full. The menu has a close in its corner. The scene runner and the battle runner can each be dragged by their top bar to wherever the LoreMaster wants them, kept on this screen; a double-click on the bar puts one back at the bottom. The toolbar is split into toolbars by what they are for: Move and mark (pan, select, ruler, ping, draw, full screen), Build the map (grid, fog, walls, light, notes), Atmosphere (effects, weather, music), Run the scene (rest, bring everyone here, copy to scenes) and History (undo, redo), set apart by dividers. Hovering the wrench (or right-clicking or long-pressing it) lists them to show or hide, kept on this screen; clicking it still folds them all away. Players see only the toolbars they have tools in.

## 2026-10-03 - The Fell's card in the foe card's shape; cards keep their place

An opened card no longer jumps back to its top: the table's once-a-second repaint keeps where each card's tab was scrolled, and opening a card in Commit brings it to the centre of the strip. The Fell's card on the LoreMaster's side takes the foe card's shape: portrait, name, level and player, Vitality, charge, Fatigue, their live stance tiers and conditions, and the same icon tabs. Plan in Commit (what they declared, their strike, the foes coming for them with each one's damage, their Reacts), Resolve in the Spotlights (their act and roll, Land it on their target, the hits coming for them with Send filled from each foe, Send a hit by hand, their defenses), Acts, Stats, Conditions (each with its rule; Apply) and Lore. Their sheet stays the authority: a hit sent to them goes to their sheet, which applies their defenses and stance.

## 2026-10-03 - The foe card, rebuilt for the table

Every foe is built to the Fell attending when a Crucible begins (LoreVault, Building Crucibles): Vitality 7 x the average party level x its rating's share, for every foe whether or not it has a build, an Epic or Forsaken alone against more than four Fell padded half a Fell for each past four, and every foe filled to full with the last fight's charge, conditions, React and escalation cleared. The opened foe card is one card: its picture, name, rating, build and the attributes it is open to; Vitality as a bar and a number you can type; the Fell it is balanced to; its charge, the stance tiers live at that charge, and the conditions on it. Below, icon tabs named only when open: Plan in Commit (its act and target, a tap on a Fell on the map or the strip making it the target; its strike as Base + Bonus, to hit, reach and moves; what its kit adds as it attacks; its React), Resolve in the Spotlights (its act, the roll, the damage to read out, and Take a hit: type the Base and Bonus you are read, Physical or Magical, and it works the hit by the FellGuide, Durability or Resistance on the Bonus only, its stance's Tier 1 and Tier 2 as its charge reaches them, Bleeding, Threshold and Emberhold, every step written into the LoreMaster's log on Apply), Acts (every tier, its React, Escalate for 5 Disruptions revealing the next rung), Stats (every infusion and augmentation with its rule and whether it is counted automatically or a reminder when it attacks or is struck, a box for the once-a-round ones; the Affliction it carries and its Discordant; its stance tiers; its attributes), Conditions (each with its rule, Lift, Apply) and Tell and loot.

## 2026-10-03 - Doors and windows anyone can open; the FellGuide link

Every door and window carries a small handle: a door or window mark, gray and faded, lit gold on hover, its open shape when open. Players see the handles of the doors and windows they can see (never the wall lines) and open or close them from their own table: it changes on their screen at once, goes through the live room (a new door message, kept in the room's walls), every table follows, and the LoreMaster's table saves it. Fog, light and movement follow it everywhere; an open window now lets a body through as an open door does. The HUD's FellGuide book opens fellguide.com/The+FellGuide/Overview.

## 2026-10-03 - Walls off the grid, walls that stop a player, the FellGuide in the HUD

Walls go where they are drawn, like doors and windows already did; their ends still catch on a wall's end nearby so runs join, and the Walls panel gains Snap to grid for when they should follow the lines. A move that crosses a wall, a window or a closed door turns the mark, the dotted line and the drag readout red and says a wall is in the way: a player cannot make it (the mark offers no Move, and a dragged Fell goes back where it stood), the LoreMaster's side may still move past it. The LoreMaster's red circle in the HUD is a gold book that opens the FellGuide (www.fellguide.com) in a new tab, in place of a foe's Vitality.

## 2026-10-03 - The players' moments on the stream

The stream view now shows what the players see as it happens: a beat's picture as it reaches them, large in the middle and titled; a handout given to the whole party (never one given to a single Fell); the roll banners at the top, never the LoreMaster's hidden rolls; and the Lore Point moment for any Fell, named. Nothing of the Journal, Lore Drops, the Story, unread beats, foe stats or Settings. The stream's panel gains Close the picture (or its cross) to clear a picture so the map can be seen, and Pause pictures until switched back; both change the stream alone.

## 2026-10-03 - Everyone's drawings through the live room

A stroke now reaches every table through the live room the moment it is drawn, from players as well as the LoreMaster, and an eraser the same; the site keeps its copy as before (mergeDraw). The room keeps the drawings with the same union-and-erased rule, so a table joining later gets them all, and knows who drew each stroke: a player can erase only their own, the LoreMaster's side any. The LoreMaster's table saves what arrives and no longer sends the whole drawing back.

## 2026-10-03 - Rest Between Sessions

The LoreMaster's Rest window gains Rest between sessions: a rest left open all week. Each player is asked the moment their table loads (or their Fell's own FellGlass page): Rest, Keep watch or Later. Rest rolls the recovery roll (1d6 + Renewal) and takes a rank of Fatigue off, then offers a Skyvault Shard, Food Portions (up to 1 + Vigor), inspecting up to 1 + Wit undiscovered utilities (each a Lore check against 1d6 + the Skill Difficulty), and levelling; the Camp Kettle is shared at the table. Nothing is rolled or spent for a player who does not choose to rest. What each Fell did is kept on the Fell (restsDone), the moment it is rolled, so it is never taken twice, and told to the LoreMaster's log alone; the Rest window lists each Fell as Rested (with the rolls), Kept watch or Not yet (the roster now carries restsDone). Crystals can be spent the whole time the rest is open. It ends only when the LoreMaster ends it: their table asks, each time it opens while one is under way, whether to end it or keep it going. A new backend method, betweenRestFor, tells a Fell's own page about its adventure's rest. Paste velo/page-threadspire.js, velo/page-fellglass.js, velo/public/fgSheetBridge.js, velo/backend/campaignview.web.js and velo/backend/fatewell.web.js.

## 2026-10-03 - The reminder email carries the adventure's picture

The session reminder (the morning job and its test) now sends the image variable the recap already had, read from the adventure's own picture, so both templates can show the header. A recap or test sent without a picture from the table falls back to the adventure's stored one. Paste velo/backend/sessionsCore.js and velo/backend/sessions.web.js.

## 2026-10-03 - Test emails, the library's buttons, one board button, Run this scene

Settings, Sessions gains Test the emails (Recap, Reminder), and the recap window gains Send me a test: each goes to the LoreMaster alone, the recap with the draft in the window (sendTestEmail). The library's Select, New foe, New NPC and New item share even columns, two by two in a narrow window. The Story window's Quest board and Handouts are one button, Quests and handouts, and Run this scene now closes the Story window so the scene runs. Paste velo/backend/sessions.web.js and velo/page-threadspire.js.

## 2026-10-03 - The Lorekeeper

A lorekeeper now has their own table: everything for the map, the tokens and the Fell, as the LoreMaster has it (moving, adding and removing tokens, every token menu, the whole map toolbar, opening and editing any Fell, the party in the Fell window), and nothing that runs the game. Their rail is Fell, Library and Stages; the scene runner, the Journal, the Story (and so Summon a foe, Continue the story, quests and handouts), rests, gathering everyone's view, copying a scene's setup, sessions and recaps, saved versions, publishing, type and world, roles and dice gifts are hidden, and the site refuses them to a lorekeeper as well (the Journal and saved versions, story writing, quests, dice gifts and publishing are now the LoreMaster's alone). Their map work reaches the LoreMaster live through the room, which now takes it, and the LoreMaster's table saves it: one writer, as before. When no LoreMaster is in the room, the lorekeeper's table saves the board on the table itself (never the story's other scenes or the running of it), and hands it back the moment one arrives. The room counts LoreMasters, refuses a lorekeeper's scene switch and run-the-game parts, and the ticket marks a lorekeeper. Paste velo/page-threadspire.js, velo/backend/tableroom.web.js, campaignview.web.js, adventures.web.js, fatewell.web.js, characters.web.js and published.web.js.

## 2026-10-03 - A recap from the Journal, from what you write, or both

Write a recap's Journal choice gains Nothing, just what I write. Draft works from whatever it has and says so: the chosen notes (Draft from my notes), what is already in the box (Polish what I wrote, keeping its facts), or both (Draft from my notes and what I wrote, weaving the written words in). It always writes into the box for editing, and a recap can still be written by hand and sent with no draft at all.

## 2026-10-03 - Each player's email opens their own Fell

The recap and reminder emails now give each player their own link, to the table with their Fell in this adventure (?character=...&campaign=...), so it opens on the player's side with their Fell in hand; someone with no Fell there gets the adventure's link. The two Triggered Email ids are filled in. Paste velo/backend/sessionsCore.js and velo/backend/sessions.web.js.

## 2026-10-03 - A recap carries the adventure's picture and its session's name

Write a recap opens with the session the running scene belongs to as its title (still editable), and sends the adventure's header picture with it as the email's image variable: a Wix picture becomes its public address, and with no picture the email gets a clear one-pixel strip (assets/email-blank.png) so nothing shows. Paste velo/backend/sessions.web.js and velo/page-threadspire.js.

## 2026-10-03 - The next session, its reminder, and recaps

Settings gains Sessions: the LoreMaster sets the next session (day, time and a note) and reads the recaps sent. Players see it in their menu with Email me a reminder (on unless they turn it off), and on the Hearth, which opens that adventure. One reminder email goes out the morning of (from 8:00 AM Arizona time), once per session, from a new hourly Wix job. The Journal gains Write a recap: drafted from the Journal only (since the last recap, today, the last 7 days, or everything), edited by the LoreMaster, sent to the players chosen, and kept on the adventure. Both emails are Wix Triggered Emails sent by member id; their two template ids go at the top of backend/sessionsCore.js. A new collection, AdventureSessions, holds it. Setting the session and sending a recap are the LoreMaster's alone. Paste velo/backend/sessionsCore.js, velo/backend/sessions.web.js, velo/backend/jobs.config, velo/page-threadspire.js and velo/page-the_hearth.js.

## 2026-10-03 - Masked: only what is next to you

A Masked Fell may only target what touches its own token (diagonals count, and a large token touches along its whole footprint), per the FellGuide's Masked. A tap or right-click on anything further away says "Masked: you can only target what is next to you" and aims at nothing. The sheet's own target list in the fight banner offers only the fighters next to the Fell (the table tells it, through a new ts-masked-reach message), and says so plainly when nothing is.

## 2026-10-03 - Lore Drops

The Sealed Past is now Lore Drops on the LoreMaster's side of the sheet: the card's title, its note, Weave Lore Drops and Weave anew, and the log line when one is granted. A granted Lore Drop reaches the player as a plain Secret under From the LoreMaster, with no heading (earlier grants titled From your sealed past now show without it too). The stored field and message names are unchanged, so nothing moves.

## 2026-10-03 - Fell window, Arsenal tab, moves past Mobility, live reach

The LoreMaster's Fell list: each row opens its Fell (the Open button is gone), the Fell's name once with the player beneath, level under the portrait in a narrow window. A held Fell's sections sit in one bar across the top (back chevron, section marks, the lit one named) and Weapons, Lorebounds and Armor gather under Arsenal, drawn inside the sheet the way the player has them (sheet-parity test and CLAUDE.md rule 3 updated). Closing a held Fell takes its bar with it. Inside the sheet: the portrait's upload hint moved to its tooltip, Lore Drops read full width with Grant Lore under each, the Arsenal's three tabs keep to one line. The log's gear matches Say at every size. Every token's move turns red past its Mobility (5 when none is set, halved by Fatigue for a Fell): the roster carries each Fell's Mobility (getCampaignPlayers), and a player's table says its Fell's Mobility and reach live through the room (a new reach message, kept by the room and sent to the LoreMaster only).

## 2026-09-28 - Handouts in a player's menu

With the Board button gone from the phone's top bar, a player on a phone had no way to their handouts; Handouts is now in every player's menu, with how many there are, as well as in the log's gear.

## 2026-09-28 - A version saved by hand; the log's box full wide; the board where it belongs; a quest's picture

Saved versions gains Save a version now (a new backend method, saveBoardVersionNow, the LoreMaster's only). The log's box runs the full width again with Say and a gear beside it; the gear holds Full log and Float the log (and, for a player, Handouts), and the Board button is gone from the log and the phone's top bar. A player's quests are in their Records, under Quests, where they can add their own: the LoreMaster's quests show there as From the LoreMaster, marked The party or For you, with a picture when there is one (the sheet always asked for the board; it now shows whose a quest is and its picture), and a quest notice offers Records. The LoreMaster's quest board opens from the Story window, under Quests (Quest board, Handouts). A quest can carry a picture: uploaded when it is posted, shown on the board and in the player's Records, and kept under Handouts as From the quest, for whoever the quest is for; taking the quest down takes the handout back. Paste velo/backend/campaignview.web.js, velo/backend/fatewell.web.js and velo/page-threadspire.js.

## 2026-09-28 - The board is the LoreMaster's alone to write

The Ashen Hands emptied again: read from the site, the board restored last night was later saved over by a table holding no board at all (no scenes, the demo's default scene active). Every table, players' included, sent its whole snapshot when it saved, and a player's copy of the board (the scenes' bindings, the active scene, grid, map, handouts) is only what it was shown, or nothing when it has not loaded the story. A player's table now sends only what is theirs (token moves when the live room is down, drawings, pings, the log), the LoreMaster's table sends no board until its stored board has loaded, and the site keeps only those keys from anyone who is not the adventure's LoreMaster. The board was restored from the 01:09 backup again. Paste velo/backend/campaignview.web.js.

## 2026-09-28 - The Board: quests for the party or for chosen Fell, and handouts

A Board window for the LoreMaster and the players, opened from Board beside the log (and in a phone's top bar), with two tabs. Quests: the party's, and side quests for one or more Fell, each saying whose it is. The LoreMaster posts a quest at any time, for the party or chosen Fell, marks it done, edits it or takes it down; a player sees the party's quests and their own, never another player's side quest (the site filters them: QuestBoard gains assignedTo, assignedNames and questKind, only the adventure's LoreMaster may post), and is told on screen when a quest arrives for them, with Board to open it. Quests written into scenes and offered from the runner land on the same board for the party. Handouts: every picture shown to the players from a beat is kept, with anything the LoreMaster hands out (a title, a picture, a few words, for the party or chosen Fell); a player sees the party's and their own, is told when one arrives, and taps one to see it large in the picture window. Paste velo/backend/fatewell.web.js (and velo/page-fellglass.js has nothing new).

## 2026-09-28 - Backups take every row

The first weekly backup check showed AdvScenes backed up with exactly 100 rows: Wix answers at most a hundred rows to a query, and the backup asked once, so every collection over a hundred rows (the story's scenes above all) was only partly backed up. The backup now pages through every row.

## 2026-09-28 - Saved versions of the board, and a weekly backup check

Settings, Keep and share, gains Saved versions: the adventure's board as the site has kept it, newest first, each with when, what it held (scenes, maps, tokens placed, effects, notes) and what changed from the one before, marked when it was kept before a large loss or before a restore, with Restore (which puts back every scene's map, tokens, effects, fog, walls, lights, notes, weather and music, leaves the story, library and log alone, keeps the board as it stood first so the restore can be undone, and reloads the table). The site keeps them in a new collection, BoardHistory: every fifteen minutes while a board changes, and always the board as it was just before a save that would take most of its tokens, maps or effects away; thirty per adventure. A new Weekly Backup Check workflow takes a fresh backup every Monday and proves it can be used (every board and story parses, the collections the table needs are present, what each board holds), failing (and so emailing) when it cannot; the checked backup is kept sixty days. Paste velo/backend/campaignview.web.js and velo/page-threadspire.js.

## 2026-09-28 - A beat's picture, on screen and to the players

When the scene runner comes to a beat with a picture, the picture rises in the middle of the LoreMaster's screen, between the map bar and the runner (fitted to the space between them), titled, and marked shown to the players or, for a secret or a note, yours alone; it goes when the runner moves to a beat without one, and the cross puts it away. It goes out to the players through the live room (and the table's saved state): on a player's table it opens in its own window, moved by its head and resized from its corner like the floating log, its place and size remembered on that screen, closed with its cross until the next picture. The runner's Pictures switch turns them off for everyone; a player can turn scene pictures off in their menu.

## 2026-09-28 - The Ashen Hands' board, and a guard against saving an emptied one

The Ashen Hands lost its maps, tokens, effects and notes in every scene: the stored board, read from the site, went from six scenes with maps and 120 tokens placed (version 3404, the 01:09 backup) to one scene and nothing placed (3444). The live room's rule that a table does not take tokens from Wix's slower copy also kept the LoreMaster's table from taking its stored board when it opened or switched to an adventure while a room was up; the board came up empty and was saved over the full one. The LoreMaster's table now takes its stored board on loading, room or no room. And a guard: a LoreMaster's board that loaded full (two or more scenes with maps, six or more tokens placed) and has since come up empty in one go is not saved; the save mark says so instead. The board was restored from the 01:09 backup (scripts/boardDoctor.js, doctor mode board, reports and restores one adventure's board).

## 2026-09-28 - Tap to move on a phone; a line toward the marked space

On a phone a tap on the map or a token was often read as a pan or a drag, because a finger moves a few pixels while it taps (the allowance was four pixels): a touch now allows twelve, so tapping a token and then a space marks it. A dotted line in the mover's ping colour runs from the token's edge toward the marked space, red with the mark when the move is past the token's Mobility, and follows the map as it is panned or zoomed. A drag on one's own token starts only once the pointer has really travelled, so a tap on it selects it; the mark's prompt stays on screen, nudged in from an edge.

## 2026-09-28 - The sealed past, granted to the player a truth at a time

Each truth of a Fell's sealed past, in the LoreMaster's view of the sheet, has Grant to the player: it is given to that Fell's Secrets, under From the LoreMaster (titled From your sealed past), through the same give the beats use, so it survives the player's own saves and reaches their open sheet; the truth then shows as Granted, and the log notes it for the LoreMaster alone. The player may dismiss it from their Secrets as with anything given.

## 2026-09-28 - Tap a token, tap a space, confirm; smoother moves for everyone watching

With a token selected that you may move, a tap on an empty space marks it (outlined to the token's size) with Move here and a cancel; tapping the marked space again, or Move here, moves the token there, snapped like a drag, and it reaches everyone through the live room. Past the token's Mobility (counted as the ruler counts, a diagonal one space) the mark turns red and asks Move anyway?, and the move is still allowed. Another tap moves the mark; Cancel, Escape or another token clears it. A token someone else is dragging now glides between the steps the room sends rather than jumping from one to the next, which read as a twitch over longer moves.

## 2026-09-28 - Switching adventure moves the table to the new adventure's room

A table that switched adventure stayed off the live room: switching closed the old room, but a retry timer left from before was never cleared, and the watcher that opens the room waits while a retry is pending, so it never opened the new one (and the seams kept the old adventure's refusal). A fired or cancelled retry now clears itself, closing the room resets it, and the watcher moves the room to whatever adventure the table is on within two seconds of a switch.

## 2026-09-28 - The room ticket: the page's own adventure, and the whole reason

When the live room refuses the LoreMaster's ticket, the page now tries again with its own adventure (the one it opened, from the address or the context) if the table asked with a different one, and the seams show the whole reason along with the adventure the table asked for; it was cut off at sixty characters, which hid the adventure's id. Paste velo/page-threadspire.js.

## 2026-09-28 - The scene roster and the library chooser, given room

The scene's Roster window and Add from library, opened from the Story, are wide windows now (up to a thousand pixels) that scroll as a whole instead of in a small inner box. The roster names its scene, lays the Fell out as a grid of attending chips and the cast as a grid of cards, and counts the cast; the library lays its foes and NPCs in grids, counted, with the search focused, the scope switch beside the title and Forge a new foe beside Close.

## 2026-09-28 - The Hearth's ThreadSpire mark: three spires

Nate's pick: the ThreadSpire mark on the Hearth is three spires on a single base, the middle one tallest. It replaces the wound spire, which was too busy.

## 2026-09-28 - The Hearth's ThreadSpire mark

The ThreadSpire mark on the Hearth read as a Christmas tree. It is now a slender spire on a stepped plinth with a needle's eye at its tip, a thread drawn through the eye and wound down around it.

## 2026-09-28 - The scene reader on a phone; the LoreMaster's bottom bar starts with the Story

On a phone the scene reader's bar is laid out in two rows: the scene's name between its arrows with minimize at the end, and its controls (Maps, Tokens, Begin combat, the party level, or the battle's own) beneath in one even row that scrolls sideways if it must; it was wrapping into a cramped, uneven block. The LoreMaster's bottom bar on a phone now runs Story, Fell, Library, Stages, Journal. The All saved mark moves to the top left on a phone, clear of the bottom bar.

## 2026-09-28 - Removing from the roster: a clean choice, and several at once

Removing a foe or NPC from the Story window's roster asks cleanly: From this scene (the library keeps it), or From the scene and the library (every copy here goes and it leaves every shelf; for your own library entries), each a full-width choice saying what it does, with Cancel beneath; the three cramped buttons are gone. The roster gains Select: tick any number of foes and NPCs (or All), then Remove, which takes them from the scene's roster after one confirmation.

## 2026-09-28 - Invested Lore opens for the LoreMaster at once

When the LoreMaster opened a player's Fell, its Invested Lore (level, Lore Points, paragon points), the strip and mobility stayed in the player's read-only form until some later redraw: switching the sheet into the LoreMaster's mode redrew the arsenal and identity but not those. They now redraw the moment the mode turns on, so they can be edited as soon as the tab opens.

## 2026-09-28 - A mark that says whether everything is saved

A small mark in the corner of the LoreMaster's table, and beside the foe editor's Save, says whether every change has reached the site: Saving while anything is on its way or waiting its turn (a scene, the story, a library foe, an act, the table's own state), All saved with the time once nothing is left, and Not saved in red, naming what, when a save was refused, until a later one lands. When it says All saved, a refresh loses nothing.

## 2026-09-28 - A foe's library entry and its scene copies keep whichever was edited last

A library foe and its copies in scenes now sync both ways, whichever was edited last. Every edit stamps the foe it was made on (in the library row's foeMeta as kitAt, and on a scene copy), a roster edit carries its stamp to the library, and copies carry the stamp of the kit they took. When the library is read, a scene copy edited after its library entry hands its kit to the library (which is saved) before every copy takes it; otherwise the library's kit goes out to the copies. A copy still keeps its own number, wounds and place in a fight.

## 2026-09-28 - The library is the one record of a library foe's kit

Read from the site's data, a library foe's own row held its newest acts and kit (The Coalescence's Spectral Eddy, Drowning Convergence, Absolute Dissolution), while its copies stored in scenes held older ones (Drift and Coil, Devour Essence, Coalescent Hunger), and the Story roster shows the scene's copy, so edits looked lost after a reload. Carrying a library edit to the scenes reached only the board lists, which a scene that is not on the table does not have; the stored roster (combatants, what a scene saves) was never touched. It now is, and once the library is read, every library foe's copies across the story take its kit (acts, kit, build, stance, signature affliction, attributes, moves, reach, picture, description), keeping only their own id, number, wounds and place in a fight; a scene is saved only when a copy in it changed. scripts/sceneFoeDoctor.js (doctor mode scenefoes) lists every foe stored in a scene against its library row.

## 2026-09-28 - Every dropdown in alphabetical order

Every dropdown in ThreadSpire and FellGlass, character creation included (lineage, origin, motivation), puts its names in alphabetical order as it appears, wherever it is drawn and whenever it is redrawn. A placeholder (None, No act, Any adventure, Choose...) stays first and an action (Forge a custom..., New...) last; option groups keep their order with each sorted within; a list that is a ladder (ratings from Minion to Forsaken, tiers, levels and numbers, the act forge's damage and target costs) is left in its order; and the chosen value is kept.

## 2026-09-28 - Foe edits reach the library; a new build brings its attributes

Read straight from the site's data, library foes were saving, but not every edit was reaching them: a foe edited in a scene's roster before the library had loaded could not find its library entry, so its acts, augmentations, afflictions and the rest were written to the scene but never to the library, and the library's older copy came back the next time it was opened. The library is now read before any foe is edited, a roster foe whose entry is still not in the list writes to it by its id, and an edit reaching the library carries mobility, reach, the tie-break and hand-set attributes too (and the library row keeps mobility and reach). A library save that does not land is tried again, then says so on screen instead of failing silently. Choosing a new build gives the foe that build's attributes. scripts/assetDoctor.js (doctor mode assets) lists the library foes as stored, with their kit.

## 2026-09-28 - One foe editor everywhere

The Library's edit button and Forge a new foe, and Summon a foe's Edit, opened an older foe forge, not the editor the Story roster opens. They now open the same editor. The older forge also trimmed a foe's infusions and augmentations to its rating's slice every time it was opened or saved, which threw away the rest of its kit (one way augmentations went missing); it is no longer used for library foes. Forge a new foe makes a new library entry (tied to the open adventure) and opens it in the editor.

## 2026-09-28 - The foe editor's attributes, back

The rebuilt foe editor lost the attributes; they are back, all eight as steppers. Left alone they come from the build and rating and the Crucible scales them to the party as it begins; change one and the foe's attributes are kept as set, by the editor, by a change of rating, and by the Crucible (which still scales its Vitality and works out its strike from them), until Use the build's gives them back.

## 2026-09-28 - The foe editor, rebuilt; foe edits save on every scene

The foe editor is one clean window in the order a foe is built: who it is (picture, name, description, adventure); what it is (build, stance and signature affliction, each with what it means: the LoreVault's build table, the FellGuide's Armor Stances, the affliction's rule); how it fights (rating, moves and reach, and what that makes it against this party, read only); its kit (infusions, augmentations and relics, each with its rule); and its three Acts in place, one per tier with a Forge beside each and Forge all three from its description. Gone: Derive from build and rating (the Crucible derives a foe's numbers as it begins, and changing the rating here derives them at once), the attribute and maximum Vitality steppers, and the notes. Edits to a foe in a scene's roster, and library edits carried to every scene that holds the foe, were saved only for the scene on the table; every scene touched is now saved. A library edit carried to a scene no longer strips a copy's number (Grimgrit 2 stays Grimgrit 2).

## 2026-09-28 - A summoned foe keeps its signature affliction

A summoned foe's signature affliction never reached it: the AI's name for a signature move was saved in the foe's signature affliction field, and the affliction it chose was kept only on the card. The summoner now asks for the signature affliction from the Foe's own family, saves it as the foe's signature affliction (what the editor shows and its Discordant lays at Epic and Forsaken), and shows it on the card with its mark and rule. A foe summoned before this has a move's name there or nothing: set its Signature affliction in the editor.

## 2026-09-28 - Forge all three acts fills every tier

Forge all three acts could come back with one act of three. An act that does not stand by the SigilForge rules is now mended where the fault is plain (a damage package that cannot carry its effect: an attack effect or a physical affliction is given damage, a support effect none; a target or damage name the forge does not know falls back to the plainest one), then fitted to its tier; and the tiers still empty are asked for again, with the faults of the last answer, up to twice. Summon a foe's acts are mended the same way.

## 2026-09-28 - Forge all three acts from the foe; remove a foe from the roster, or from the library too

A foe's Acts editor gains Forge all three acts: from the foe's name, description and build, the forge builds its three Acts by the SigilForge rules, one at each tier (each brought into its tier's budget, afflictions only from the foe's own family), forges them into the LoreMaster's library as yours and sets them on the foe; any that will not stand by the rules are named so they can be forged by hand. Each foe and NPC in the Story window's roster has a remove (the cross): Remove from the scene, or, for one of your own library entries, Remove and delete from the library (every copy of it in the scene goes, then the library entry).

## 2026-09-28 - Forging an Act for a foe follows the SigilForge rules; story edits save on every scene

Forge a custom Act, in a foe's Acts editor, is now built by the SigilForge rules: a name, one damage package, one target inlay and one effect (a combat effect, or one affliction of the foe's own family, the others not offered), the cost and the tier it makes shown as the pieces are chosen, the rule text written from the pieces, and Forge allowed only when the act is legal and lands at the slot's tier. Or describe it and the forge builds it for that tier (brought into the tier's budget if it misses). It is saved as yours and set on the foe. Beats added, edited or deleted in any scene but the one on the table were lost on a reload: only the scene on the table was being saved. The scene a beat belongs to is now saved with it, and so is whatever scene the Story window has open.

## 2026-09-28 - Summoned acts land one at each tier, and become yours; Acts forged at the table save

A summoned foe could come back with a Tier 1 and two Tier 3s: an act meant for Tier 2 that cost too much was kept at the tier its cost made it. An act is now brought into the budget of the tier it was meant for, cheapest change first (fewer targets, or a lighter damage package, or more targets when it costs too little; its effect is kept), and only then checked. Each act a summon builds is forged into the LoreMaster's own SigilForge library, so it shows as (yours) and can be picked for any foe. Every Act forged at the table had silently failed to save (the table sent title, the backend read name), which is why acts chosen or forged in the foe's Acts editor did not stick; the table now sends both and the backend reads either. The Acts editor also shows the act a foe holds even when it is not on the shelf, as (this foe's), instead of No Act. Paste velo/backend/fatewell.web.js.

## 2026-09-28 - Several foes at once; more of a foe in the roster; beats added between beats

Summon a foe's Add to this scene takes a count (the minus and plus beside it), adding that many, numbered on (Grimgrit 1, Grimgrit 2...). Each foe in the Story window's roster has a + that adds more of it, any number, each a copy at full Vitality numbered on from those already there (a library foe through the library, so its art and kit come with it). A scene's beats can be added at any place: an insert line (+ Beat here) sits above each beat and after the last, showing on hover (always, faintly, on a touch screen), and the new beat goes in exactly there.

## 2026-09-28 - Foes and NPCs belong to the adventure they are made in; a bigger foe editor; Epic shows two augmentations

The foe editor's Adventure picker showed Any adventure for a foe that was tied to one (it compared the adventure's id with the adventures' names); it now shows the adventure. A foe or NPC opened in the editor while an adventure is open, and not yet tied to one, is tied to it, and NPCs gain the Adventure picker too. The foe and NPC editor is wider and taller (it scrolls as a whole rather than in a small box). Nate's ruling: an Epic Foe shows two augmentations, as a Forsaken does; the table's ratings, the foe pack's budget and the LoreVault's Building Crucibles table are updated to match.

## 2026-09-28 - Summon a foe builds the full kit; adding it closes the summoner

Summon a foe now builds a Foe's full kit, as the LoreVault's Building Crucibles has it (every Foe is built to its Forsaken kit and its Shatter Rating reveals a slice): three infusions, two augmentations and an act at each tier. The card shows the whole kit, with what the chosen rating hides greyed and marked with the rating that reveals it (an Epic shows one augmentation and the second marked Forsaken); raising the rating, or escalating it in play, brings the rest out. Add to this scene now closes the summoner once the foe is in the roster.

## 2026-09-28 - Summon a foe can take premade abilities

Summon a foe now asks how its acts are made: built new by the SigilForge rules (as before), or chosen from the premade abilities in the SigilForge library (canon, and the LoreMaster's own), one at each tier, the AI picking by exact name from the list and only names that exist being taken. Every act on a summoned foe can also be swapped for a premade ability by hand: Swap opens the library at that act's tier, with a search and a tier choice; a premade act is marked on the card and keeps its own text, and the Shatter Rating rescale treats it like any other act.

## 2026-09-28 - Summon a foe builds its acts by the SigilForge's rules; every pop-up has a close

Summon a foe made up its acts. They are now built by the SigilForge's own rules, Monster mode: each act is one damage package, one target inlay and one effect (a combat effect, or one affliction from the Foe's own family), the AI choosing only from the SigilForge's components; the cost of the three sets the act's tier (1 to 2 is Tier 1, 3 to 4 Tier 2, 5 or more Tier 3), an attack effect needs damage, a support effect needs No Damage, a physical affliction needs damage. An answer that breaks the rules is sent back once with what broke them, as the SigilForge does; after that only acts that stand are kept, at the tier their cost makes them. Each act's rule text is written from the components' own rules, with the AI's line of flavour beneath, and the card shows each act's inlays and cost. The table carries the SigilForge's component list and tier budgets, copied by scripts/syncSigilRules.js, and the checks fail if the two ever drift. Every pop-up window now has a close in its top corner (those that must be answered excepted).

## 2026-09-28 - Pop-up windows sit in the middle of the screen

Every pop-up window (Disruptions, Summon a foe, Continue the story, the dice, the afflictions picker, confirmations and the rest) now sits in the middle of the screen, across and down, at any screen size and in full screen, and scrolls inside itself when it is taller than the screen. They used to sit a set distance down from the top, which in full screen left them high and off to one side of the eye. The map bar's own panels (grid, fog and the like) are unchanged.

## 2026-09-28 - Disruptions: the DP on the LoreMaster's frame

The DP on the LoreMaster's frame is now the Disruptions pool from the LoreVault: Party Size plus Average Party Level, filled when a Crucible begins. A tap opens the spend menu (Environmental Disruption 8, Magical Disruption 15, Fuel a React 3, Escalate a Foe 5, Loose a Discordant again 12), with what the pool cannot afford greyed out; each spend lowers the pool and is noted in the log for the LoreMaster alone, the last can be undone, the pool can be nudged up or down or filled again by hand, and it is kept with the table's saved state. Log lines marked for the LoreMaster alone no longer reach players.

## 2026-09-28 - The LoreMaster gives dice from the table

Right-click a set you hold in Your dice (or open it and choose Give these to a player) to give it: pick a Fell at the table, or Give to everyone at the table. A set is the player's, for every Fell they play, and the log says who was given what. The LoreMaster may now give any set (the table offers only sets they hold themselves), not just Spindle's Web and The Double; giving to everyone uses a new backend method, lmGiveDiceAll, open only to the adventure's LoreMaster, which gives each player with a Fell in the adventure the set once. Paste velo/backend/characters.web.js and velo/page-threadspire.js.

## 2026-09-28 - The Story window: fold acts and sessions; read beats in full

In the Story outline each act and session has a fold beside it; a folded one hides what is under it and shows how many sessions or scenes it holds (and the table's mark if the scene on the table is inside). Open all and Fold all sit at the top of the outline, and what is folded is remembered per adventure on that screen. A scene's beats now open in place to be read in full, line breaks and all, with a click, and fold again with another; the pencil on a beat (on hover, always on a touch screen) opens it to edit. Open all and Fold all sit beside the Beats heading.

## 2026-09-28 - Deleting a large adventure; Story cards without pictures

Deleting a large adventure could report it was not deleted when it had been: the page answered only after clearing the whole story tree and its library rows, which outlasted the fifteen seconds the table waits. The page now answers as soon as the adventure itself is gone and clears the rest after; and if no answer comes in time, the table says it is still deleting and checks the list of adventures for up to a minute before calling it a failure. In the Story window, a card for an act, session or scene with no cover no longer shows an empty picture box: just its name and description. Paste velo/page-threadspire.js.

## 2026-09-28 - The LoreMaster's room ticket; Player view is fog only; the app icon filled

The live room refused the LoreMaster's ticket for an adventure the role helper could not find ("off (not at this adventure)"): the ticket now reads ownership directly, from Campaigns or from the shared story's root, then a membership, then a Fell in the adventure, and says which it could not find. Player view now changes only the fog: tokens, hidden names, notes and the token menus stay the LoreMaster's whatever the view, so nothing can be left stuck in the players' version. The app icon is filled edge to edge in navy, with no rim, so no light edge shows when a device rounds or masks it. Paste velo/backend/tableroom.web.js.

## 2026-09-28 - Play, second batch: a floating log, the skill picker, ping colours, pasted pictures, LoreFell as an app

The log's Float button pops it out: drag it anywhere by its head, resize it from the corner, and set how see-through it is; it keeps its own Say box, and its place, size and see-through are remembered on that screen (and it comes back open if it was). The hold-to-roll skill picker's close is now a large, bright button that stays in view while the list scrolls, and Escape or a tap elsewhere closes the picker too. Everyone picks their own ping colour (Settings, Your table, for the LoreMaster; the menu for players). A picture can be pasted from the clipboard: as a Fell's portrait on the sheet (or onto the open sheet from the table), and onto the token or map shelf while it is open. LoreFell can be installed as an app: the site serves a web app manifest at /_functions/manifest with LoreFell's icons (gold fellmark on navy), opening at the Hearth, with a ThreadSpire shortcut. To switch it on, paste velo/backend/http-functions.js, then in Wix Settings, Custom code, add to the head of all pages: <link rel="manifest" href="/_functions/manifest"><meta name="theme-color" content="#0a0f1c"><link rel="apple-touch-icon" href="https://table.lorefell.com/assets/app-icon-192.png">.

## 2026-09-28 - From the first session: new players live, Fellmark growth, rolls for all, hidden rolls, Lore Points, the LoreMaster's role

Someone joining the table now appears on everyone's screen without a refresh: when the room's count rises every table asks again who is at the table, and the LoreMaster's table sends the party's public sheets (names, levels, Vitality, afflictions, portraits) through the room. A Fellmark on a skill check raises that skill by 1, as the FellGuide says, automatically or asked first (the player's choice, Fellmarks raise skills in their menu); the sheet does it and the table says so in the log and on screen, or that the skill stands ready to master. Every roll shows at the top of everyone's screen for a few seconds: who, the die (gold on a Fellmark, red on a Fellstrike), each bonus with its number, the total and what it was for. The LoreMaster may hide their rolls (Settings, Rolls): a hidden roll is theirs alone, marked hidden on their screen and kept out of players' logs and banners. A Lore Point arriving for a player crosses their screen as a gem. And whoever runs an adventure now arrives as its LoreMaster from any link that names the adventure without naming a Fell; a link without role=lm used to open the LoreMaster's own table as a player. Paste velo/page-threadspire.js.

## 2026-09-28 - Affliction marks; a token's right-click menu; free tokens; framing the picture

Each of the 37 afflictions has its own small mark, shown at a token's crown only for what that token is afflicted with, named with its rule on hover. An affliction reaching a token from more than one place (the table, the sheet, the party's sheets) used to show twice (Masked read MA MA); each now shows once. Right-clicking a token opens a menu. For the LoreMaster: Afflictions (a picker with every affliction and its mark; ticked ones are kept on the token, shown to everyone and read by the fog, so a token ticked Masked sees as Masked), Let the players move it (a free token can be dragged by anyone; the live room allows it), and Frame the picture. For a player, on their own Fell: Frame my picture. Framing drags the picture about inside the token's circle and zooms it (slider or wheel), with Reset; every token of the same Fell takes the same framing, and it travels with the token.

## 2026-09-28 - Everything at the table travels through the live room

The live room now carries the rest of the table too: fog, walls and doors, lights, effects, map notes, weather, music, rests, the LoreMaster's view call, lore point grants, the battle phase, the LoreMaster's drawings, and the Fell's portraits, each sent by the LoreMaster's table when it changes; and every log line (rolls, says, the LoreMaster's notices) from anyone, merged line by line so nothing is lost or laid over. A device joining is handed all of it at once. While the room is up a player's table takes these from the room, not from Wix's slower copy, and a log from Wix is merged rather than replacing the one on screen. Wix stays the saved copy.

## 2026-09-28 - The live table room

Token moves, pings and scene switches now travel between devices through a live room for each adventure (cloudflare/table-room, a Cloudflare Durable Object), in a fraction of a second, instead of each device writing its whole copy of the table to Wix and the others reading it a second or more later. A move is sent as the token is dragged and when it is dropped, as one token's position; the room applies moves in the order they arrive and sends them on. A player may move only their own Fell's tokens (the room puts anything else back); the LoreMaster's table says what the board is, sending the scene (map picture, size, grid and tokens together) when it changes and the token list when its shape changes, and a whole board from the LoreMaster keeps a token a player moved in the last few seconds where they put it. A scene arrives whole: its map picture loads first, then scene, map, grid and tokens are laid at once. While the room is up, the token list and the scene are taken from it rather than from Wix's slower copy, and a player's saves leave their tokens out, so an older copy can no longer pull a token back or swap its picture. Wix stays the saved copy (the LoreMaster's table still saves there), and if the room cannot be reached the table carries on through Wix alone, reconnecting in the background. Joining needs a ticket signed by the site (backend/tableroom.web.js, with the private key in Wix Secrets as TABLE_ROOM_KEY); the room checks it with the public key. The seams show the room and how many are at the table. Deployed by the Table room workflow (needs the CLOUDFLARE_API_TOKEN repository secret). Paste velo/backend/tableroom.web.js (new) and velo/page-threadspire.js.

## 2026-09-28 - A held Fell's sections on a rail; the Fell list stops overlapping

Opening a player's Fell from the Fell window put eight sections and a way back in two crowded rows of tabs over the sheet. They now run down a rail on the left, each a mark over its name (All Fell, Lore, Attributes, Condition, Weapons, Armor, Lorebounds, Skills, Inventory), with the sheet beside it; the open section is gold. On a narrow screen the rail runs across the top and scrolls. In the Fell list, a long name or line of details wrapped under the role and the buttons; names and details now keep to one line each and end with an ellipsis, and on a narrow window the role steps aside.

## 2026-09-28 - Level 1 Vitality counts Vigor

Nate's ruling: a level 1 Fell's maximum Vitality is 5 plus their Vigor at level 1 (the starting crystal, the motivation and any other lasting grant), not a flat 5. FellGlass now forges a Fell with that, and a level 1 Fell forged before this gets it once when its sheet next opens (current Vitality rises by the same). Fell above level 1 are left as they are, since their level 1 Vigor cannot be read back; the LoreMaster can set any Fell's maximum by hand. Level ups were already d6 plus Vigor each.

## 2026-09-28 - The LoreMaster sets a Fell's maximum Vitality

The Fell window's options for a player (the ⋯ beside them) gain Set maximum Vitality, showing the number now. It writes to the Fell's sheet through a new backend method, lmSetVitality, open only to the LoreMaster of that Fell's adventure; current Vitality is brought down to the new maximum if it was over. The LoreMaster's word is kept on the sheet with a time, so the player's open sheet saving its old number cannot undo it: a save carrying an older word takes the LoreMaster's newer one. After that the sheet carries the same word, so a level gained raises Vitality as usual. Paste velo/backend/characters.web.js and velo/page-threadspire.js.

## 2026-09-28 - A player who joins comes to the adventure

A player who joined through an invite could land on an empty lobby map with their Fell instead of the adventure, and stay there. The join page sent a player forging a new Fell to /fellforge, which is not the site's FellForge page (/the-fellforge), so the new Fell was forged without the adventure; and nothing afterwards brought a Fell with no adventure to the one its player had joined. The join page now forges at the right address, and when a player opens the table with a Fell that has no adventure but they have joined one through an invite, the Fell is attached to the adventure they joined most recently and the table opens on it. Paste velo/backend/invites.web.js, velo/page-threadspire.js and velo/page-join.js.

## 2026-09-28 - The Hearth's ThreadSpire opens the LoreMaster's table

The Hearth's ThreadSpire button opened the table as a player with no Fell, so a LoreMaster was offered a Fell to choose, which leads to FellGlass. It now opens the table as the LoreMaster (role=lm): someone who runs adventures arrives at the LoreMaster's table and chooses an adventure; anyone else is still a player and chooses their Fell. Paste velo/page-threadspire.js.

## 2026-09-28 - Each player sees what their own Fell sees

The fog showed each player the whole party's sight: every Fell's view, pooled. A player now sees only what their own Fell sees (its vision, the light it can see, its own Echosight), so a wall, the dark or an affliction between two Fell means something. Places the party has already explored stay dimmed for everyone, since that memory is shared. The LoreMaster's Player view still shows the whole party's sight.

## 2026-09-28 - The stream link opens the stream

The copied stream link pointed at the site's home page: the table is told only the site's address, not the page it sits on, so the link lost /the-threadspire. It is now the site's address with the ThreadSpire page's path added.

## 2026-09-28 - The Stream view

Settings gains Streaming, Copy link: the ThreadSpire page with view=stream (and this adventure) is a window to capture, in another tab or as a browser source. It follows the LoreMaster's table live (scene, map, tokens, effects, weather, dice and music) and never writes: no state is pushed and every saving request is answered on the spot and goes nowhere, so it cannot overwrite the table. It shows what the players see, without the fog (hidden tokens, hidden names and unrevealed notes stay hidden), and none of the LoreMaster's tools. A small panel, shown when the mouse moves and faded when it rests so it stays out of the capture, switches Players' view or Everything, and Map only or With the table (the table's frame, menus and log around the map); see=all and frame=1 in the address do the same. Paste velo/page-threadspire.js.

## 2026-09-28 - Change an adventure's type and world after it is made

The type and world can now be changed after an adventure is made: Settings has a Type and world row (Change, or Set when they never were), and the Story window's adventure page has Change beside them. It opens the same choices as a new adventure (the four types; Unwritten or one of the 36 worlds, with a name and a line for an Unwritten one), saves onto the adventure, and notes the change in the log.

## 2026-09-28 - The adventure's cover survives a reload

The adventure's own cover (and its description, notes, type and world) was saved, but dropped when the story was built from the account on load, so it vanished on every hard refresh while the acts', sessions' and scenes' covers stayed. The story now keeps the adventure's own fields when it loads.

## 2026-09-28 - Settings, Stages, Fell and Journal, cleaned up

The four side windows share one quiet system: groups of rows on a single panel, separated by hairlines, each row saying what it is on the left and what it does on the right, with compact buttons rather than dashed placeholders. Settings opens on a plaque naming the adventure you are running (over its cover, with its type and world), then Adventure (switch, new), Your table (dice, player view, clean view, full screen, each with its key), Keep and share (back up, import, publish or update and take down), and Under the hood. Fell lists each person on one panel with a larger portrait and an Open button that says what it does; Add a player and Refresh sit at the foot. Stages gain a clearer card for the stage on the table and a New stage button. The Journal takes notes in a growing box (Enter adds, Shift+Enter for a new line) and lists them newest first under day headings (Today, Yesterday, then the date), with the time beside each.

## 2026-09-28 - Masked reaches the fog from the sheet

A Fell made Masked on their sheet still saw as far as anyone: the fog read afflictions only from what the LoreMaster set on the Fell at the table. It now also reads the Fell's own sheet, which FellGlass reports to its player's table with the rest of the hand (afflictions, effects and impairments by name), and the party's public sheets, which now carry the same, for everyone else's view. A Masked Fell's own screen shows only their space and the spaces beside it, and they add only those to the party's sight. Paste velo/backend/characters.web.js.

## 2026-09-28 - FateWell retired: ThreadSpire on the Hearth, publishing at the table

The Hearth's FateWell button is now ThreadSpire (Write and run your adventures), with a spire for its mark. ThreadSpire's Settings already had Published (publish, update, take down), but it sent the adventure in a shape the directory could not bring back in; it now sends a real pack, as FateWell did (the story, its foes and NPCs, never the table, journal or players), with its images inlined to media. The directory now sends a chosen adventure to ThreadSpire, which offers to bring it in as a fresh adventure. Settings no longer offers Write one in FateWell. FateWell stays reachable at its address as a fallback, with a banner saying it is retired; its saves stay in its own copy and no longer write the shared story, so opening it cannot undo work done in ThreadSpire. Paste velo/page-threadspire.js, velo/page-adventures.js and velo/page-fatewell.js.

## 2026-09-28 - New adventure: name, type, world and cover

A new adventure is begun from one form wherever it is offered: Settings (A new adventure, Make one here), the adventure picker on a first visit, and the Story window's adventure page (New adventure). Name, type (Tale, Story, Legacy or Chronicle) and world are required: one of the Sphere's 36 worlds, or Unwritten, a world of your own, which then needs its name and can take a line about it. A cover is optional and uploads before the adventure is made. Type and world are asked here and only here; the Story window's adventure page shows them. The page's create handler now writes them onto the adventure. Paste velo/page-threadspire.js.

## 2026-09-28 - Continue the story

A scene's beats in the Story window gain Continue the story. Say what happens next and it drafts three to six beats for the open scene from everything before it in the story (every earlier scene, in every earlier session and act, in reading order: names, descriptions, beats and who speaks), plus the scene so far and who is in it. Secrets go along marked as hidden, never to be revealed in read-aloud or dialogue; lore checks are left out. The five most recent scenes go whole and the older ones condensed, and on a very long adventure the earliest are left out for length, which it says. The draft comes back as beats, each kept or discarded with a tick; Try again redrafts; Add puts the kept beats in the scene, linking a speaker the library knows (one it does not becomes the line's name). It uses the same AI connection as Summon a foe.

## 2026-09-28 - Summon a foe, from a description

The Story window's roster gains Summon foe. Describe a foe and the AI (the same connection FateWell used) picks, from the build rules only, its build, stance, attack, reach, movement, affliction, signature, and its infusions, augmentations and acts to an Epic foe's budget, and names and describes it in the house voice; anything it names that is not in the lists is dropped and the budgets are enforced. Its attributes, Vitality and damage are not the AI's: they are derived from build and rating as every foe's are. It is saved to the library at once, tagged to the adventure, and its Shatter Rating can then be set: the kit trims to that rating's budget (kept whole underneath, so raising it back restores it) and the numbers rescale, saving each time. Add to this scene puts it in the roster; Edit opens the foe forge; Summon another starts again.

## 2026-09-28 - The Story window on a phone

On a phone the Story window fills the screen and the outline and the page take turns: choosing a row in the outline opens its page, and the outline button at the top left goes back. The search runs the full width under the title, a row's rename and delete are always showing (there is no hover), and a scene's roster, quests and Run this scene follow its beats on the same page.

## 2026-09-28 - The Story window

Story now opens a window over the table, in ThreadSpire's own style, rather than the side panel: the outline down the left (the adventure, its acts, sessions and scenes; select any; add a scene, session or act; rename and delete on hover; drag a row among its siblings, or a scene onto a session and a session onto an act), the chosen node in the middle, and for a scene its roster (each opens its sheet; + Library; the full roster window), quests and Run this scene down the right. Every node has a cover image (uploaded to the site) and a description, shown at the top. A scene shows its beats, with the speaker's portrait on dialogue, opened to edit, dragged into order, and never ticked. An act, a session or the adventure shows its children as cards and its notes. Search runs across every name, description, beat and note in the story. It is a window by default with a full-screen button; Escape or the cross closes it. The adventure's own fields (its cover, description, notes, and the type and world FateWell set) are now kept when the story loads and sent back whole when the story's outline is saved, once they have been loaded, so nothing written elsewhere is lost.

## 2026-09-28 - The name plate has room at its edges

The name under the portrait now sits centred with a little room at each end (and a little more when it takes two lines), rather than running up against the plate's edges; the fit to the plate allows for it.

## 2026-09-28 - Long names fit the portrait's name plate

A name too long for the plate under the portrait (a speaker such as Prior Halvek Sorn, or a long Fell name) ran off both ends. The type now steps down until the name fits, to about two thirds of its size; a name still too long then takes two lines at that size, and anything beyond is cut with an ellipsis. The full name is on the plate's tooltip.

## 2026-09-28 - Map notes move with the map; notes copy to scenes; FateWell's speakers at the table

Map notes jumped about while the map moved: they were placed by a redraw on a timer, so they lagged the camera. They are now moved with every pan and zoom, as tokens are, and only rebuilt when the notes themselves change. Copy to scenes gains Map notes (replace or join, like tokens and effects). A dialogue speaker chosen in FateWell did not reach the table: the scene's FateWell entries became beats without their speaker (or art), and FateWell names a speaker by its library record, which the table's cast lookup did not recognise. Beats now keep speaker, art and handle, and a speaker is found by its library record in the cast, or from the library itself, so the speaker's name and portrait show, on the beat and in the LoreMaster's portrait.

## 2026-09-28 - Undo covers effects, notes and weather, with buttons on the map bar

Ctrl+Z on the map undid tokens, walls, lights, fog and drawings, but not what came after: effects, map notes and weather now undo and redo too. The map bar gains Undo and Redo buttons (lit when there is a step to take), for a tablet or anyone without the keys. Each scene keeps its own history: a scene switch starts afresh, and a step recorded in another scene is never laid on this one.

## 2026-09-28 - The first scene opens with its own map

The scene a reload lands on could open wearing another scene's map: the board that arrived disagreed with the scene's own saved layout. When they disagree, the scene's saved layout (map, tokens, grid) is now laid, since it is written on every save and is the truth about that scene.

## 2026-09-28 - The selection bar's buttons take the first click

With several tokens chosen, the bar's buttons (Name, Hide, Lock and the rest) often did nothing until a few seconds had passed: the bar was rebuilt every half second, so a button was replaced between the press and the release and the click landed on nothing. It is now drawn only when what it shows changes; so are the token menu's icon row and the map note pins, which had the same trouble.

## 2026-09-28 - The board knows which scene it belongs to

After a reload, scene one's tokens and effects turned up over scene two's map, and scene one came up empty. The table's stored state arrives first, with the board of the scene that was up; the story then stands up again from the account with its own idea of the active scene (the story's record, which a scene switch did not update), and the scene was swapped under the board, which the next save then stored into the wrong scene. The board now knows which scene it belongs to: it is only ever saved into that scene, a scene switch hands it over, and when the story stands up the table goes back to the board's scene, its map filled in from its layout and the shared map shelf (a scene fresh from the story had no map on it, so the seams read map on scene: none). A scene switch now also writes the story's record of the active scene, so a reload opens where you were.

## 2026-09-28 - Copy this scene's setup to other scenes

A new Copy to scenes button on the LoreMaster's map bar (and Copy effects to other scenes in the Effects panel, Copy weather to other scenes in the Weather panel, a copy button in the Fog panel, each with its part already ticked) opens one window: tick what to copy (the map, tokens, effects, fog, walls and doors, lights, weather, grid), choose whether tokens and effects replace what the other scene has or join it, and tick the scenes, a whole session at a tick; each scene is listed with the map it has. Positions are the map's own, so things land in the same spots on another version of the map; a scene with no map yet takes this one so what is copied has somewhere to lie. Tokens and effects are given fresh ids, the Fell are never copied, and each scene keeps its copy as its own from then on. Coming back to a scene with a layout of its own no longer leaves a Fell's token behind: the Fell at the table come along when the scene has none of theirs.

## 2026-09-28 - A reload no longer writes an empty board over the stored one

After a hard refresh every scene but the first lost its map, and the board its tokens and effects. A freshly loaded LoreMaster table pushed before its first pull had landed, sending the empty board and empty scene layouts it starts with, and a key that is sent replaces the stored one, so the stored layouts were overwritten by nothing, and the first pull then brought the nothing back. The LoreMaster's table now does not push until it has heard the stored state, and pushes as soon as it has. A new adventure has nothing stored: getCampaignState now says so (none) instead of answering as if a read failed, and an older backend's empty answers stand for the same after six in a row. Switching adventures resets this, so the next adventure is heard before it is written. Paste velo/backend/campaignview.web.js.

## 2026-09-28 - The LoreMaster's table holds its pulls while its own change is on its way

Scenes still lost tokens, or their map, on the way back to them. Underneath was the table taking every pulled copy of the state: whenever the LoreMaster's latest change (a token, a map, a scene switch, a wall) had not reached the site yet, a pulled copy was older than the screen, and taking it put the old board back, which the next save then stored. The LoreMaster's table now holds its pulls while a change of its own is on its way (sent, or about to be), or while the site is not taking its changes; a change the site did not take is sent again four seconds later, and after a minute of failing the table gives way and takes the site's copy rather than drift. Players are not held. The map shelf is now one shelf in every scene (it was carried over only when the next scene's copy was shorter), and a map is found by id even if the scene's copy of the shelf lacks it.

## 2026-09-28 - Scene is king: everything on the map belongs to the scene

Fog, walls, lights, effects, map notes and drawings were kept per map, so two scenes on the same map (or a stage's several versions of a map) shared them. They are now kept per scene and map together, so each scene keeps its own. What was kept per map before comes along: effects, notes, fog and drawings move to the first scene that opens that map, since they were that scene's work; walls and lights, being the map's shape, are copied into a scene that opens a map with none of its own yet (from before, or from another scene on the same map), to keep or change. The LoreMaster's table does the settling and sends it to everyone.

## 2026-09-28 - A new scene comes up with its own board

Switching scenes could leave the last scene's board on the table: the LoreMaster's table took the scene and board from pulled copies, and a copy still in flight (saved before the switch) put the old scene's tokens, map and grid back, or even the old scene itself. Once the LoreMaster's table is loaded, a pulled copy no longer moves the scene, and for twelve seconds after a switch a pulled copy's tokens, map and grid are not taken. A scene with no layout of its own yet now starts clear, keeping only the Fell's tokens; its stage or remembered map is laid as before, and once a map is clicked on a stage for it, it keeps its own layout from then on.

## 2026-09-28 - The shelf lays out properly; drag a box to select

The shelf's tiles carried the class token, which is also the class of a token on the map (sized, placed absolutely and rotated), so saved tokens came out in one narrow column that ran off the bottom of the window and drew stray diagonal lines; the shelf's kind classes are now shk-token and shk-map, and the grid lays out as it should. Dragging a box across empty space in either shelf now selects every tile it touches (with Ctrl or Cmd held it adds to the selection), and a click on empty space clears it. The Select button reads Select all.

## 2026-09-28 - The map and token shelves work like folders

Both windows browse their saved things as a file browser does. A breadcrumb shows where you are (All maps, then each folder down) and each step of it takes a drop. Folders show first as folder tiles with how many things and folders they hold, opened with a click; the things in the folder follow. Drag a map or token onto a folder tile or a breadcrumb step to move it there; drag a folder onto another to nest it, with everything inside (not into itself or its own branch). Select with Ctrl or Cmd click, Shift click for a run, the tick on a tile, or Select for everything here; a selection drags together, and a bar offers Move to, Remove and, for tokens, Place all (laid out in rows at the middle of the map). + Folder makes a folder where you are; a folder tile renames or removes on hover (its contents stay). Search shows matches from every folder with where each lives. The token window has two tabs, This scene (its foes, Fell and NPCs) and Saved tokens (the shelf); tokens and maps uploaded while a folder is open land in it. The map on the table is marked on its tile. Folders are still paths, so nothing about how they are stored changes.

## 2026-09-28 - Saved tokens no longer vanish; the token and map windows, rebuilt; many images at once

Saved tokens lived on the scene that happened to be on the table when they loaded, so switching scenes left them behind and the shelf looked emptied (only a token saved since showed). They now belong to the account (S.accountTokens), and the map shelf travels with the LoreMaster from scene to scene too. Nothing was lost: a hard refresh shows them all.

Place a token and Choose a map are rebuilt: a fixed head with the title, a search box and Upload (and, for maps, New folder), a body that scrolls on its own, and a foot saying what a click and a drop do. Tokens sit in an even grid of portrait tiles, kinds with nothing in them are left out, and a tile's tools appear on hover; maps sit in an even grid of thumbnails, their folder tools fade until hovered. Search narrows every kind, or all maps whatever their folder. Upload in either takes many images at once, and images dropped anywhere in either window are saved; several tokens go straight to the shelf with a running count (Saving 3 of 8), one is placed on the map as before.

## 2026-09-28 - Player view shows tokens as players see them

Player view hid the fog and walls the way a player's screen does, but drew tokens the LoreMaster's way: hidden tokens faint, hidden names struck through, lock marks, unrevealed map notes, and lights carried by hidden tokens. In Player view all of these are now drawn as a player sees them (hidden tokens and names gone, no lock marks, only revealed notes); leaving Player view brings the LoreMaster's marks back.

## 2026-09-28 - Hide a token's name

The token menu gains a name toggle (and the selection bar a Name button): with the name hidden, players see the token without its label, and the LoreMaster sees the label dimmed and struck through, so it is plain which names are hidden. It can be changed at any time, is kept with the token (nameHidden) for everyone, and travels in an export.

## 2026-09-28 - Spaces, not squares

LoreFell counts in spaces. The table now says so wherever it showed squares: the distance while dragging a token (3 sp of 5), the ruler (4 spaces), the spaces left to place, a light's reach (3 sp), an effect's size, a carried light, and the log's placement lines.

## 2026-09-28 - Tokens wear their library art

A scene's NPCs were cast with only an id and a name, so their image (and library link) was dropped, and a foe or NPC cast before the library had loaded had no art either; their tokens landed wearing the default portrait. The cast now keeps each NPC's image and library id, and the token palette and the tokens on the map look the art up from the library record at the moment they draw, so it is found however late the library arrives. Tokens already placed without art pick it up too.

## 2026-09-28 - Attached NPCs and dialogue speakers are in the roster

In FateWell an attached NPC or foe was reference only, outside the scene's roster, so the table could not count it or place it without a second step. Now the people in a scene are its roster: attaching an NPC or foe to a scene adds it to the roster, and so does setting someone as a dialogue entry's speaker in that scene. Every adventure, the first time it is opened after this, brings each scene's attached and speaking NPCs and foes into its roster once (rosterSynced), and saves, which carries them to ThreadSpire; removing one from the roster afterwards is left alone. NPCs carried down from the adventure, act or session stay as reference, since they belong to every scene.

## 2026-09-28 - FateWell's attached NPCs and foes at the table

FateWell's Attached NPCs and items are reference pinned to a scene (or carried down from its adventure, act or session), not the scene's roster, so ThreadSpire showed a roster of 0 and could not place them. The roster window now lists them under Attached in FateWell, each with Add to the roster (and Add all), and Place a token offers them alongside the scene's own NPCs and foes, so they can go straight onto the map. Only library foes and NPCs not already in the cast are listed.

## 2026-09-28 - Flames, lightning and holy light, less fake

Flames are now fire made of many short-lived points of light rising and cooling, white-hot at the root, the chosen colour in the body, dark red at the tips, swaying and drawing back to the centre, laid additively so they bloom where they gather. Lightning strikes rather than scribbles: a branched bolt (midpoint displacement) flashes for a breath with a white core inside a coloured glow, flickers, lights the patch around it, then the dark returns until the next strike, now and then a second stroke straight after. Holy Light falls from above: soft shafts widening as they fall and breathing slowly, motes turning in them, and a gentle pool where they land, in place of the turning wedges.

## 2026-09-28 - Painted effects on the map

A new Effects tool (LoreMaster only, the flame on the map bar). Nine animated effects: Flames, Arcane (a turning rune ring), Lightning (arcs crackling inside the patch), Smoke, Frost (glinting rime), Poison Cloud (rolling, bubbling), Holy Light (turning rays), Shadow and Embers; each in any colour (it starts at the effect's own), at any size from half a square to six. Place stamps a patch with a click; Paint lays a run of them along a drag; Adjust picks one to change its kind, colour, size or glow, or to delete it; Erase brushes them away; Clear all empties the map. Glows (on by default for the bright ones) makes an effect light the dark like a placed light, and lift what it lights for a party that can see it. Effects lie on the map under the tokens and under the fog, so fog keeps them hidden until it lifts. They are kept per map in the table's state (effects), written by the LoreMaster and taken once on arrival, so they reach every player, survive a reload and travel in an export. For reduced motion they hold still.

## 2026-09-28 - New foes and NPCs belong to the adventure they are made in

A foe or NPC made from inside an adventure (New in the library, or the foe forge, in ThreadSpire; the library wizard in FateWell, which already chose the current campaign) is tagged to that adventure with its name. The ThreadSpire foe forge saved its foe without converting it for the site, so the adventure (kept inside foeMeta) never arrived; it now saves through assetToRow like every other entry. The need to set it by hand came mostly from the earlier read-back bug, where an NPC's saved adventure was dropped on reload (fixed in PR 513).

## 2026-09-28 - A roster built for any scene is saved

Adding foes or NPCs to a scene's roster saved only the scene on the table: a roster built for any other scene, from the Story window, showed, then was gone on reload. Scenes edited from the roster are now marked and written alongside the active one, and a write the site does not take is tried again. A foe or NPC added by name (not from the library) went only into the board list, which is not stored; it now goes into the stored roster too.

## 2026-09-28 - Scene layouts stick: the LoreMaster's table takes them once

Scenes still came back with the wrong map after a reload. The LoreMaster's table took the stored scene layouts on every pull (unless touched in the last eight seconds), so an older copy still in flight put each scene's old map back moments after a new one was chosen, and the next save stored the old one. The LoreMaster's table now takes the stored layouts once, on arrival, and is their source after that, as with the music; players follow every pull. A scene with only a map or only a grid of its own (no stage) is now sent too, and a layout's tokens are slimmed like any others. Switching adventures now resets these take-once marks (layouts, music, weather, notes), so the next adventure's stored copies are taken rather than skipped. The Grid panel's Apply to scenes label showed \u2026 as text; fixed.

## 2026-09-28 - Apply the grid to chosen scenes

The Grid panel gains Apply to scenes: the grid as it stands (cell, fade, shift) given to whichever scenes are ticked, a whole session at a tick, kept on each scene's layout so it returns with the scene. A scene given a grid but no map yet still takes its grid.

## 2026-09-28 - Each scene keeps its own map and tokens

A stage held one chosen map for every scene that used it, and the active stage was the adventure's alone, so the last map clicked showed in every scene (The Green Chapel everywhere); and laying a map with no stage active quietly made a new stage, which is what kept adding stages. Now each scene keeps its own layout on its binding: the map chosen for it (from any stage), the tokens where they stand, the grid and the map's size. Clicking a map on a stage sets it for the scene you are in and makes that stage the scene's; another scene can use another map from the same or a different stage. The layout is recorded whenever the table saves and when the LoreMaster leaves a scene, and laid again on return. It lives in the table's saved state, so it survives a reload, another browser (incognito included) and an export and import. Laying a map from the Maps window no longer makes a stage. A scene with no layout of its own still falls back to its stage, then to the map remembered for it or its session.

## 2026-09-28 - Page code: named imports again

The whole-module imports added for the newest backend functions are taken back out: Velo's support for a namespace import of a web module is not something to lean on while the table is not saving, and every backend file they guarded is now on the site. The page code names each function it uses, as it always had. Paste velo/page-threadspire.js and velo/page-fellglass.js.

## 2026-09-28 - The page code cannot be stopped by a backend it is ahead of

A page's named import of a backend function the site does not have yet stops that whole page from loading in Wix, and with ThreadSpire's page goes every load and save the table makes: nothing loads (stages, music, playlists look gone, though they are untouched in the CMS) and nothing saves (the log reports bridge timeouts). The newest functions (musicUploadUrl, musicLibrary, myDice, saveDicePicks, lmGiveDice, earnDice, restoreRoster) are now reached through the whole module in page-threadspire.js and page-fellglass.js, so a backend that lacks one fails only that one call, with a message saying which file to paste. Paste velo/page-threadspire.js and velo/page-fellglass.js.

## 2026-09-28 - Manage music, rebuilt to fit, with search and songs from other adventures

Manage music ran off the bottom of the screen and sprawled in full screen. It is now one window that fits any screen: a head that stays put (Music, a search box, Upload), two columns that scroll on their own (this adventure's songs, each with the playlists it is in, a + Playlist choice and a remove; and its playlists, numbered), and a foot with Done. Search narrows songs and playlists as you type. Songs are this adventure's by default; Show my other adventures' songs lists every song in the site's LoreFell Music folder that this adventure does not have yet, each with Add (a new musicLibrary in backend/campaignview.web.js reads the folder). On a phone the columns stack. Paste velo/backend/campaignview.web.js, then velo/page-threadspire.js.

## 2026-09-28 - A table volume for the music

The LoreMaster's Music panel gains Table volume, how loud the music plays for everyone, half by default, so it never arrives at full blast. Each person's own Your volume is now their share of that, full by default, kept on their device; a player sees what the table is set at. A table volume rides with the music (live.vol), so it reaches every player and exports with the table.

## 2026-09-28 - Staying full screen through an upload

A browser leaves full screen whenever it opens its own file picker, which nothing on a page can prevent, so uploading a map or a stage's art threw the LoreMaster out of full screen. The table now notes it was full screen when a picker opened, asks to go back the moment the file arrives, and if the browser insists on a tap for that, shows Back to full screen at the top for a few seconds. Images can also be dragged from the desktop and dropped onto the table, which never opens a picker: the map shows Drop images to add them as maps, and they are added to the Maps library as an upload would.

## 2026-09-28 - The grid can be moved again, to line up with a map's own squares

Grid offsets had been dropped in July (the grid always began at the map's corner), which left a map with its own drawn squares impossible to line up. The Grid panel gains Shift X and Shift Y, each sliding the grid within one square, and Line up: Drag the grid, which turns a drag on the map into sliding the grid until the squares meet, and sends it to everyone when let go. Shifts are kept, sent and restored (pulled snapshots no longer reset them to 0), and tokens find the middle of their square again after a change.

## 2026-09-28 - An NPC keeps its adventure; FateWell's own library filter follows suit

An NPC's (or item's) adventure was saved, inside foeMeta, but read back only for foes, so every reload dropped it and the NPC belonged nowhere. Both tools now read it for every kind. FateWell's main Library had its own filter, separate from the roster pickers, still letting every untagged foe and NPC through; it now shows only the chosen adventure's foes and NPCs (items with no adventure still show). The library's Campaign field and its filters say Adventure (Any adventure, All adventures), in FateWell and in ThreadSpire's library sheet.

## 2026-09-28 - The library's adventure filter shows that adventure's cast only

ThreadSpire's Showing: this adventure and FateWell's campaign filter both let in every untagged foe and NPC, so the filter seemed to do nothing. Filtered to an adventure, both now show only the foes and NPCs saved to it; untagged ones and other adventures' are in the whole library, one tap away. Items with no adventure still show, since an item is no one's cast. Ids are compared as text, so a numeric and a text id for the same adventure match.

## 2026-09-28 - Tablets go full screen on the first tap, as phones do

Wix serves tablets its desktop layout, a fixed-size box on a page that leaves white space around the table. A phone's first tap already took the table full screen; a tablet's now does too (any touch screen with no pointer to hover), where the browser allows it. The Full screen button on the map bar toggles it after that.

## 2026-09-28 - Tablets: the die asks first, and a Full screen button

On a tablet in a desktop layout the dice tray rolled on every tap, because the roll type is chosen by hovering, which a touch screen cannot do. Any screen without a hovering pointer now does what a phone does: a tap on the die opens the roll types, and choosing one rolls. The map bar gains a Full screen button for everyone (F still works), which tablets lacked.

## 2026-09-28 - FellGlass makes the Dice Prefs row too

Opening FellGlass now calls myDice once, quietly, so a member who only ever uses the sheet still gets their named Dice Prefs row and can be granted dice before reaching a table. Paste velo/page-fellglass.js.

## 2026-09-28 - Every member gets a Dice Prefs row, with a name

A member's Dice Prefs row was made only when they first chose a die, so players who had joined and rolled were not there to be granted sets. myDice, which runs when a member opens the table, now makes the row the first time, and keeps a Name on it (their profile's nickname, or their name, or their login email) so the LoreMaster can tell rows apart in the CMS. DicePrefs gains the Name field. Paste velo/backend/characters.web.js.

## 2026-09-28 - Crystal Glints, softer

Crystal Glints was too busy. Half as many flakes, fainter, and their flashes rarer, smaller and dimmer.

## 2026-09-28 - Weather for every world

The nineteen worlds without weather now have their own, each from its FellGuide page: Resonance (Akkoroka), Perpetual Dawn (Amaranthia), High Winds (Avemriol), Trench Heat (Brimsever), Hearthglow (Burhallow), The Hive (Crixalis), Old Forest (Eldarwyn), Threnody Winds (Karn), Omen Fog (Natbakka), Story-Motes (Sable), Sigils (Scitnix), Root-Dark (Shervinaw), Bramble Wind (Sylvanoth), Hunter's Frost (Thaloryn), Probability (The Scere), Mountain Cloud (Ursathar), Faeliri Snow (Valoria), The Seasons (Verdantia; blossom, leaves and snow in turn) and Dragon Heat (Wylv). Of the worlds now lists every world's weather in order of its world, Blizzard among them. Each button's tooltip names its world and, where a weather suits others, where else it can stand in (Snow: Thaloryn, Ursathar, Valoria, Vulkaris; Embers: Brimsever, Mortavia, Wylv; and so on), so the LoreMaster knows where an overlap might be used. For reduced motion, Root-Dark, Hearthglow and Faeliri Snow keep their still wash.

## 2026-09-28 - Weather strength, and the journal in backups

The Weather panel gains a Strength slider (10 to 100 percent) for the scene's weather, so a storm can be a hint or a downpour; it is kept per scene with the weather, reaches every player, and exports with the table. An adventure export now carries the LoreMaster's journal, which lived only on the site, and an import writes it back to the new adventure; the table's log (its last 400 lines) now comes along too. Paste velo/page-threadspire.js.

## 2026-09-28 - Weather: the second batch of worlds

Eight more, each from its world's FellGuide page. Weather: Blizzard (Vulkaris), snow driven sideways in gusts with a white-out haze. Of the worlds: The Abysm (Shadakar), dark ink-mist curling in from the edges; Steam and Frost (Garyx), steam rising from the ground and frost glinting; Pollen and Petals (Elysara and Mireth), golden pollen and drifting petals; Crystal Glints (Kwuhara), crystal flakes falling and catching the light; Prismatic Light (Felidae), slow ribbons of shifting colour. Magic: Leylines (Wildermire), faint golden threads with pulses running along them; Temporal Echoes (Therion), a moment rippling out and fading as if time stuttered there. For reduced motion, The Abysm keeps its still dark wash.

## 2026-09-28 - Weather of the worlds, and magic

Eight more kinds of weather, each drawn from its world's FellGuide page, in the Weather panel under three headings (Weather, Of the worlds, Magic), each world named on hover. Spores (Sporion): blue, green, amber and violet spores rising and pulsing. Crimson Haze (Vyrathis): low red mist and a crimson tint. Ashstorm (Mortavia): gusting ash with glowing flecks, the light dimming in the gusts. Static Storm (Mireleor): drifting smoke with blue-white arcs crackling across the map. Moonlight (Sellenia): a silver wash with pale motes hanging still. Deep Water (Neriad): rising bubbles, a blue-green glow and wandering caustic light. Spirit Wisps (Oroniel): pale spirits wandering and curling, trailing light. Discord (Pandemonium): black static falling upward, the map's edges darkening and bending inward. For reduced motion, Crimson Haze and Moonlight keep their still wash, like Mist.

## 2026-09-28 - Rename a token at any time

Renaming a foe's token in the token menu did nothing visible, because a foe token shows its foe's name and the rename only reached the token. Now a rename reaches the foe too, in the roster, the fight and the stored scene, so the card, the tracker and the token read the same. A token can also be renamed by double-clicking (or double-tapping) it, for the LoreMaster; the two taps are counted in the token's own tap handler, since the tokens redraw between them. The name field takes up to 40 characters, and on a Fell's token it is read-only, since a Fell's name is its player's.

## 2026-09-28 - The LoreMaster's +N is the Skill Difficulty; foes are numbered from 1

The diamond under the LoreMaster's Vitality read a difficulty nothing ever set. It now shows the Skill Difficulty as the LoreVault defines it (Building Crucibles): the Average Party Level divided by 5, rounded down, with the working on hover. The rest's item inspection now rolls against the same number (1d6 plus the Skill Difficulty), which is what the rule meant by APL difficulty; it had been adding the whole average level (vault PR 22 corrects the wording). When a second foe of a kind arrives, from the library or by copying a token, the first is numbered too, on its card and its token: Wolf 1 and Wolf 2 rather than Wolf and Wolf 2.

## 2026-09-28 - A copied foe token brings its foe; Bring everyone here shows it worked

Copying a foe's token (Ctrl+C and Ctrl+V, Ctrl+D, or Duplicate) now copies the foe with it: a new combatant in the scene's roster and in the fight, with the same stats, the next name (Wolf 2, Wolf 3), full Vitality, and no charge or afflictions; the token takes the new foe's id, so the card, the tracker and the token are one foe. Bring everyone here now shows it worked: a banner for the LoreMaster (Everyone is looking here now) and for each player (The LoreMaster brought your view here), and rings spreading from the spot. Its tooltip read \u2019 as text; fixed. The LoreMaster's frame (Vitality and the charge diamonds) now shows a foe when its token is chosen on the map, as well as when its card is open.

## 2026-09-28 - Foe rings from the foe, a map note that says it is waiting, and a larger Skyvault Shards

The token menu's Move and Reach are gone: a foe's rings now come from the foe itself, its weapon range (already on the foe and its card) and a new Mobility on the foe forge and the library sheet, beside the range, 5 until set. A map note, once its button is pressed, lights the button and shows a banner (Click the map where the note goes, with Cancel; Escape cancels too), rather than waiting silently for a click. The Skyvault Shards label on the LoreMaster's gem is larger.

## 2026-09-28 - The map bar runs across, a cleaner token menu, rings in battle for foes too, and a Ping tool

On a desktop the map bar now runs across the top of the table and each tool's panel drops down beneath it (phones keep the column). A Ping tool joins it: click the map to point something out, for anyone (double-click still pings too). The token menu is simpler: the name field, the size, then one row of icon buttons with their names on hover (hide, lock, carry a light with its squares, to front, to back, duplicate, remove), and Rotate beneath; the long Duplicate and Remove bars are gone. A foe's menu adds Move and Reach, in squares, set by the LoreMaster and kept on the token. Movement and weapon-range rings now show only in battle, for the chosen Fell and, for the LoreMaster, the chosen foe from its Move and Reach; dragging a foe shows red past its Move.

## 2026-09-28 - Ten things for the map

Afflictions show on tokens as small badges under them (short name, the full name on hover, a +N for the rest; helpful effects in green). The chosen Fell's movement this turn is shaded (its Mobility by straight-line distance, not through walls) with a dashed circle at its weapons' reach; a player sees their own Fell's, the LoreMaster any Fell they select whose reach the table knows. Dragging a token shows how far it has gone, in red past its Mobility. The token menu gains Hide (the token vanishes for players and shows faint and dashed for the LoreMaster), Lock (no one can drag it; a small mark for the LoreMaster), Light (a light carried by the token, 2, 4 or 6 squares, lighting what it moves through, darkness included), To front and To back; the selection bar gains Hide and Lock. The LoreMaster's map bar gains Bring everyone here (every player's view goes to what the LoreMaster sees), Weather per scene (rain, storm with lightning, snow, ash, embers, mist; lighter on phones, stilled for reduced motion except mist) and Map notes (a pin only the LoreMaster sees until Show to the table, then a pin players can open). The sheet tells the table its Fell's Mobility and weapon reach (reach, in the hand). Weather, notes and the view call ride the table's state, written by the LoreMaster.

## 2026-09-28 - Undo on the map, and Rotate that follows the pointer

Ctrl+Z (Cmd+Z) now undoes the LoreMaster's last change on the map, and Ctrl+Shift+Z or Ctrl+Y does it again: tokens placed, moved, removed, turned, renamed or copied, walls and doors, lights, fog painting and drawings, up to 40 steps. Changes that arrive from someone else reset the watch rather than becoming something to undo, so it only walks back the LoreMaster's own work, and the restored map goes to everyone. Rotation steps are 20 degrees (the arrows, R and Shift+R), and Rotate itself turns the chosen token, or a whole selection, to face wherever the pointer goes until a click sets it; Escape puts it back.

## 2026-09-28 - Remove many tokens at once, rotate tokens, and the Skyvault Shards slot names itself

A box selection of more than one token gets a small bar (Rotate, Duplicate, Remove), and Delete or Backspace removes whatever is chosen, one token or many; removing a Fell's token asks first, and never touches the Fell itself. Tokens turn: Rotate in the token menu, R (Shift+R the other way), 45 degrees a step, for one token or a selection; the name stays level, and the turn is kept with the token (rot) for everyone. The LoreMaster's SS slot now reads Skyvault Shards, and Skyvault Shards and the count while Shards are waiting to be placed.

## 2026-09-28 - Searching for Skyvault Shards, placing them, and copying tokens

A Fell's hand in battle gains Search for Shards (an Act): a Fell finds up to 1 + Wit Shards each battle, none shared (vault PR 21). Declaring it logs a request to the LoreMaster. The LoreMaster's SS slot now glows with the Shards waiting to be placed; a click on it starts placing them, each click on the map setting one Skyvault Shard down (Done, or Escape, ends it), and the placement is logged against that Fell's search, so a second search the same battle can only bring out what is left of their 1 + Wit. With none waiting, the slot offers to place Shards by hand. A Shard on the map is the new Skyvault Shard art (img/skyvault-shard.png), with no frame or disc, a transparent background and a soft gold shimmer. A player taps one to pick it up: it leaves the map and they add it to their inventory. When a battle ends, every Shard left on the map is cleared.

Shards now live only in the inventory, as Skyvault Shard utilities: the Invested Lore row loses its Skyvault Shards counter, a count still held there moves into the inventory once, and the Paragon card checks and spends the inventory Shard.

Tokens can be copied: Ctrl+C (Cmd+C) copies the chosen token or a box selection, Ctrl+V pastes at the pointer keeping their spacing, Ctrl+D or the token menu's Duplicate copies beside the original. Each copy is a new token; Fells are never copied.

## 2026-09-28 - The frame's tooltips are the browser's own

The drawn tooltips beside the portrait frame were large and in the way. The same lines are now the browser's own tooltips (the title on each number), small and only on hover, with nothing drawn over the table; the LoreMaster's side still has none.

## 2026-09-28 - The portrait frame's numbers say what they are

On a player's side, hovering any number on the portrait frame (a tap, on a touch screen, beside whatever the tap already does) shows what it is, in the FellGuide's words: Total, Temporary, Current and Maximum Vitality (Survival, Understanding Vitality), Charges (The Currency), Lore Points and Level. The tip opens to the left of the frame and stays on screen. The LoreMaster's side, where the same slots show the chosen foe, is unchanged.

## 2026-09-28 - The Lore grant's amount box matches the table

The amount in Grant Lore Points was a bare white browser box. It is now the table's own field: dark, gold-rimmed, the number in Cinzel gold, no spinner arrows (the - and + beside it do that), a gold ring on focus. The checkboxes take the gold, and Grant reads as disabled when there is no one to grant to.

## 2026-09-28 - The LoreMaster grants Lore Points

On the LoreMaster's side only, the LP slot on the portrait frame now reads Lore and opens a grant: any amount, to the Fells chosen (every Fell at the table checked by default). A grant is kept in the table's state under loreGrants, written by the LoreMaster, and logged (The LoreMaster grants 3 Lore Points to Astra). Each player's table hands the grants meant for its Fell to the sheet (ts-lore-grants), which adds each once: the ids taken are kept in the Fell's own record (lore.grantsTaken), so a grant never lands twice, on any device, however late the player arrives; the sheet logs it (Astra receives 3 Lore Points from the LoreMaster, now 7). Players' LP slot is unchanged.

## 2026-09-28 - Levelling happens at a rest, which the LoreMaster calls

A player could open Level Up whenever a crystal was banked. Crystals are spent while resting (FellGuide, Leveling), and rests come from the LoreMaster, so a player's sheet now levels only while ThreadSpire's rest has opened it: the rest window's Level up passes permission to the sheet (ts-rest-op levelup), and finishing, skipping or the LoreMaster ending the rest takes it back (rest-over). Outside a rest a banked crystal shows as the plain count with Level up at the next rest, the header button stays hidden, and luOpen explains rather than opens. After levelling, a Back to resting button returns the player to the rest still under way, rather than starting a new one. The LoreMaster can level any Fell at any time. Lore Points stay the Treasure Phase's and the LoreMaster's, as before. level-up-in-card.test.js covers the waiting row, the hidden button, levelling at a rest, and the LoreMaster.

## 2026-09-28 - Lore Points: added where the player can see it, and not by hand

The Treasure Phase already put a battle's Lore Points onto each Fell, but on a button that only said Next, so a player could not tell they had been added. The button now reads Add 5 Lore Points to my Fell, over a note that there is nothing to add by hand; afterwards the phase says Added to your Fell, with the new total; and the table's log records it (Astra takes 5 Lore Points from the battle, now 7). A player's Level, Lore Points and Paragon Points no longer carry steppers: points arrive from the Treasure Phase, level from spending crystals, Paragon from the LoreMaster, who keeps the steppers. The same in FellGlass and ThreadSpire.

## 2026-09-28 - Rests, called by the LoreMaster

A Rest button (a tent) in the LoreMaster's map bar, never on the sheet. Call a rest works only outside a fight; the panel then lists every player at the table as Deciding, Rested or Skipped, and End the rest closes it. Each player gets a window: Skip this rest, or Rest. Resting runs the FellGuide's rest against their own sheet (vault PR 18 brought the book in line): the recovery roll, 1d6 plus Renewal thrown on the table, full Vitality on a Fellmark; one rank of Fatigue off; and, shown only when carried, a Skyvault Shard (full Vitality and 1d6 more ranks off, one Shard for both), Food Portions (another Renewal roll each, up to 1 plus Vigor), a Camp Kettle (clears the Fatigue of everyone resting, through the log), Level up when there are crystals to spend, and inspecting undiscovered utilities, up to 1 plus Wit, each a Lore check (1d6 plus Lore) against the LoreMaster's 1d6 plus the party's average level: match or beat and the item is Discovered, fail and it stays undiscovered. Other utilities used at a rest are listed with what they do. Finishing writes the whole rest to the log. The sheet does the arithmetic (ts-rest-op in, ts-rest-result back); the rest rides the table's state under rest, written by the LoreMaster.

## 2026-09-28 - Mobility rolls the Generic dice; Arsenal cards open from anywhere

A Mobility roll (from the stat strip) rolled the LoreFell set whatever the player had chosen, since mobility is not one of the four kinds; any roll outside Attack, Evade and Skill now rolls the player's Generic dice. A folded Weapons, Lorebounds or Armor card, and the held stance, now opens from a tap anywhere on it, not only its header; a control on it (the Equipped toggle, a picker) keeps its own job, and an open card closes from its header. A folded card shows it can be opened: the pointer, and a gold edge on hover.

## 2026-09-28 - Attribute breakdown opens on click only

Hovering an attribute no longer opens its breakdown, which covered the lines being read. A click (a tap on a phone) opens it; another click on the same attribute, or anywhere else, closes it. The same in FellGlass and ThreadSpire.

## 2026-09-28 - Four special sets for those who come before release, and a clearer dice window

Four sets given by hand, shown in the collection with how they come (grants keys developer, playtester, streamer, community): Wyrdwright (developers; dark teal with glowing circuit traces that pulse), Proving Glass (playtesters; iridescent glass whose colours cycle), On Air (streamers; magenta to cyan with a live-red pulse ring), and The Gathering (Discord community; Discord blurple nebula with drifting stars). On the table their 3D dice glow and breathe in flight and at rest; Proving Glass shifts hue face by face. The collection now counts 50. Every set always says how it is actually earned, even when it was given (no more A gift from the Skyvault on sets with a rule of their own). A die in use for any kind of roll has a gold border in place of the A E S G letters; the chosen die's panel has a close (x) and says that choosing a kind moves it there from whichever die had it.

## 2026-09-28 - Dice grants: "all"

A grants entry of all (["all"] in DicePrefs) gives that member every set there is, the hidden ones included. Sets they would own by the rules anyway still say how they were earned; the rest say they were a gift.

## 2026-09-28 - The dice window is the collection

The four assignment rows (Attack, Evade, Skill, Generic, each listing every set owned) are gone; they would only have grown. The window is the collection alone: every set, earned ones lit with small letters beneath (A E S G) showing which kinds of roll use them, unearned ones as plain shadows. Tapping an earned die opens a panel above the grid (it stays in view while scrolling) naming it, saying how it was earned, and offering the four kinds; choosing one moves that kind to this die. A shadow was a blacked-out face, which a translucent set (Wyspar) showed through; a shadow is now an empty tile with no face at all, its tooltip still naming the set and how to earn it. Redrawing keeps the window's scroll.

## 2026-09-28 - Story dice, and every set as a shadow until it is earned

Three sets the story gives. Spindle's Web (black, orange-lensed, webbed) and The Double (Whip's purple and gold coin) are the LoreMaster's to give: a Fell's options menu offers both, and lmGiveDice (backend/characters.web.js) gives only when the caller is the adventure's owner or at the loremaster role and the Fell is at that table. Discord (void, cracked red and violet) is earned when a Fell falls to 0 Vitality: the sheet says so to the table once per fall (ts-fell-fallen), and earnDice checks the Fell's saved Vitality, and that it is the caller's own Fell, before it counts; the table logs it. All three live in DicePrefs.grants beside hand grants, for the player, across every Fell. The dice window's Still to earn list becomes the Collection (earned of all): every set there is to earn, the unearned as shadows whose tooltip names them and says how to earn them; once earned a set steps out of the shadow and joins the rows above. Hidden sets are never shown. Paste velo/backend/characters.web.js, then velo/page-threadspire.js.

## 2026-09-28 - Dice: one tooltip, kept on screen; dice kept on the table; sets given by hand

The dice window showed two tooltips (the browser's own and the drawn one), and the drawn one was clipped by the window. Now there is one, placed on the page itself and kept on screen, naming the set and how it was earned (or how to earn it). On a full-screen table dice could fly over the top of the frame and land under the widgets: the table's open floor is now measured in proportion to the window as well as in pixels (diceFloor), other players' dice enter from the floor's own top edge, a 3D die's bounces come back off the floor's edges, and it comes to rest exactly where it was sent. A hidden set, Skyvault, exists only to be given: DicePrefs gains a grants field that only the site's owner can write in the CMS (a list of set keys, such as ["skyvault"]), and anything listed there is that member's, whatever the rules; a hidden set is never listed under Still to earn. Paste velo/backend/characters.web.js.

## 2026-09-28 - A dice window, earned-how on hover, and glowing Fellmarks and Fellstrikes

Settings and the players' gear menu now hold one Your dice line (the current die and Choose your dice) that opens a window for choosing a set for each kind of roll. Choosing redraws only that window, which ends the jolt of the whole Settings panel redrawing under the pointer. Hovering an earned set names it and says how it was earned (everyone's first dice; played a Shadowkin Fell; reached level 10; ran an adventure as its LoreMaster). A 3D die resting on a Fellmark burns gold, its faces pulsing and a halo rising with motes; on a Fellstrike it smoulders red with an uneven flicker. Both follow the die and fade with it, and hold still for anyone who prefers reduced motion.

## 2026-09-28 - Real 3D dice, the LoreMaster's set, and Your dice where players look

Dice are now real 3D dice, drawn with three.js (loaded from cdnjs the first time a die is thrown): thrown from the roller's side, a die falls, bounces on the map, tumbles and rolls to rest, its last tumble easing onto the face that was rolled, so the table sees what the log records. Faces are painted from the roller's set (its colours, pips, edge, sheen, glow or starfield); a Fellmark or a Fellstrike flares where it rests, and another player's die carries their name. Devices without WebGL, or while three.js has not loaded, keep the flat dice; phones and low-power devices draw at a lower resolution without shadows.

A LoreMaster set (deep crimson, gold pips, a gold rim) belongs to anyone who runs an adventure (myDice now reports ranAdventure) and is the LoreMaster's default. Your dice, which only the LoreMaster's Settings showed, now sits in the players' gear menu too, replacing the old Dice skins: Soon row, which is also gone from the LoreMaster's Settings. Paste velo/backend/characters.web.js.

## 2026-09-28 - Dice sets: earned by lineage and level, chosen per roll

Everyone rolls the LoreFell set from the start. A lineage's dice become the player's the moment any Fell of theirs takes that lineage, and stay theirs across every Fell they play (Shadowkin: Black Glass; Dragis: Gold Scale; and a set for each of the 37 lineages, the looks approved from the table in chat). Resplendent, Ascendent and Transcendent come when any of the player's Fells reaches level 10, 20 and 30. What a player owns is worked out on the site from their own Fells (myDice in backend/characters.web.js), so it cannot be claimed from the page; their choice of set for Attack, Evade, Skill and Generic is kept per member in a new DicePrefs collection (saveDicePicks). Settings opens with Your dice: a row per kind of roll with every set owned, and Still to earn listing the rest with how each is earned. The chosen set rides on every roll, so the rest of the table sees each player's dice in that player's set. Sets can give each face its own look (Spireborn), a sheen, a glow, or a moving starfield (Transcendent). Paste velo/backend/characters.web.js, then velo/page-threadspire.js.

## 2026-09-28 - Rolling from everywhere, onto the table

The die in the corner rolls what its menu says, with the sheet's own numbers: Evade rolls d6 plus the Fell's Evasion; Skill opens the skills with their values (Lucky Rolls included) and rolls the one chosen; Attack asks which weapon when more than one is in hand, and in a fight takes up that weapon's attack card exactly as a tap on the card would, so the target is tapped and the attack reaches the LoreMaster the usual way, while outside a fight it rolls accuracy (d6 plus Precision) and the log shows the weapon's damage as base plus bonus; Generic stays a plain d6. The sheet's skill dice, inside ThreadSpire, now roll onto the table rather than inside the sheet, and an opened weapon on the Arsenal tab has an Attack button that does what the quick roller's Attack does for that weapon. Every die lands on the table with the Fell's name. New messages: ts-quick-roll (table to sheet), ts-quick-choose and ts-weapon-attack (sheet to table); a roll may carry a short note, shown in the log. On FellGlass outside the table, rolls stay on the sheet. Merged with skip ci for the contract checker.

## 2026-09-28 - Dice: prime on a new log, not only the first

The previous change primed the roll guard on the log's first arrival only, which would have thrown another adventure's last rolls when a LoreMaster switched adventures, and it threw even the first die a beat late, which load-roll.test.js caught locally. The guard now primes whenever an arriving log is not a continuation of the one on screen (the roll last thrown is not in it): the first load, or another adventure's. A continuation throws its new rolls, the first at once and the rest a little apart. load-roll.test.js gains two checks: a pulled roll from someone else throws, tagged with them; another adventure's log throws nothing.

## 2026-09-28 - Everyone sees everyone's dice

Other people's rolls never threw a die on anyone's screen. Every pull of the table's state marked the log's newest roll as already shown, a guard meant only for opening an adventure (so last session's final roll is not thrown out of nowhere); on every later pull it swallowed each new roll from the rest of the table before it could be thrown. The guard now runs only on the log's first arrival. A roll from someone else drops onto the map from the top with their name tag, as intended, and every roll that arrived since the last one thrown lands, a little apart (up to four at once), rather than only the newest.

## 2026-09-28 - Full adventure backups: the table and who sits at it

Export from ThreadSpire now carries everything needed to bring an adventure back as it was. Beside the story and its foes and NPCs (now every foe and NPC saved to the adventure, used or not; NPCs were left out before), the pack gains a table section (the boards, each a map with every token where it stood, which scene uses which, and the live table state: tokens, grid, map, drawings, fog, walls and doors, lights and darkness, and the music setup) and a roster (each member, their role, and their Fell). The format stays lorefell-adventure-pack-1; FateWell ignores the new sections and older packs import as before.

Import restores it all: the stages are saved to the new adventure, the table state is written as its live state, and a new restoreRoster (backend/fatewell.web.js, owner only) adds the members back at their roles and reattaches their Fells. A Fell comes back only if it is free, or still pointing at the adventure the backup came from after that adventure was deleted, and only if it still belongs to the member the backup names, so a pack cannot pull anyone else's Fell, or one sitting at another table, into this one; the table's log says how many came back and how many stayed. Library ids are reminted as before, and the table follows them. Paste velo/backend/fatewell.web.js, then velo/page-threadspire.js.

## 2026-09-28 - Music picks up where it left off, and loops by default

Switching music now remembers where the music being left was, and music coming back picks up from there: after a fight, the scene's playlist returns at the same song and moment rather than its first track. Battle music always starts fresh, since every fight is a new one. Playlists and single tracks loop by default, battle music included: the playlist carries on round, a single track plays again. A Loop button beside the controls lets the LoreMaster turn that off for the table, and then the music stops after the last track.

## 2026-09-28 - Music: new tracks and playlists appear in the panel at once

A track uploaded or a playlist made in Manage music did not appear in the Music panel's This scene and Battle lists until the panel was closed and reopened. Every change to the music now redraws the panel, and so does Done.

## 2026-09-28 - Music: the file goes straight to Media Manager

Uploading through the backend failed with 413: a song is far bigger than a Wix backend call will carry. musicUpload is replaced by musicUploadUrl, which only asks Wix (mediaManager.getUploadUrl) for an upload address and token for LoreFell Music; the table then posts the file there itself, from the LoreMaster's device, and takes the file's address from Wix's reply (static.wixstatic.com/mp3/...). Files up to 50 MB. Paste velo/backend/campaignview.web.js, then velo/page-threadspire.js.

## 2026-09-28 - Music: upload files; links are gone

Suno signs its song files (CloudFront Key-Pair-Id) and the signatures expire, so no Suno address, public or not, can be played from the table. The link option is removed, along with musicResolve. Manage music now has Upload file: the LoreMaster picks an audio file they own (an MP3 downloaded from Suno, say), the table reads it and hands it to a new musicUpload in backend/campaignview.web.js, which puts it in the site's Media Manager under LoreFell Music (public, up to 25 MB, members only) and returns its address; the track joins the library under the file's name. Paste velo/backend/campaignview.web.js, then velo/page-threadspire.js. Tracks added from Suno links before today will not play; remove them.

## 2026-09-28 - Music: only a Suno CDN file is a song

Suno serves a page fetched by a server with a placeholder where the song's audio address would be (studio-api.prod.suno.com/api/forbidden), and the lookup took it for the song. musicResolve, and the table itself, now accept only a real audio file on Suno's CDN (cdn*.suno.ai, .mp3 or .m4a); anything else gives way to the CDN address built from the song's id. Tracks remember their Suno id, so a track still holding the placeholder is mended as it plays. Paste velo/backend/campaignview.web.js; tracks added before today need adding once more.

## 2026-09-28 - Music: say why a track will not play

A track whose file would not load kept the Tap anywhere prompt up, since every refusal to play was read as a missing tap; tapping could never help. The player now tells the two apart: only the browser's autoplay refusal asks for a tap, and a file that fails shows its reason in the Music panel (private, moved or not audio; unreachable; or the error's name), with the address for the LoreMaster. musicResolve now takes the audio address the Suno page itself gives (og:audio or its audio_url) before falling back to the usual CDN address. Paste velo/backend/campaignview.web.js.

## 2026-09-28 - Music at the table

A Music button in the map bar, for everyone. The LoreMaster keeps a library of tracks for the adventure, added by pasting a Suno song link (full or short; the site reads the song page for its title and audio address through a new musicResolve in backend/campaignview.web.js, since a browser cannot) or the address of an audio file uploaded to the site; groups them into playlists; and assigns a playlist or a single track to each scene and one to battle. Opening a scene, or a fight starting and ending, switches the music on its own; a scene with nothing assigned leaves the music as it is. Each device plays its own copy; the LoreMaster's screen publishes what is playing and when it started, and every device seeks to the same moment, so the table hears roughly the same bar. The LoreMaster has previous, play or pause, next, and an On/Off switch for the whole table. Each player has their own volume and a Mute on this device, kept on their device. Browsers will not start sound before a first tap, so a player who has not tapped yet sees Music is playing, tap anywhere to hear it. Music lives in the table's state under music, written only by the LoreMaster, taken from the stored copy once on arrival. Paste velo/backend/campaignview.web.js, then velo/page-threadspire.js.

## 2026-09-28 - The Attributes tab, option D: ring rows

The team moved from option A to D. Each attribute is now one line, grouped under Offensive, Core and Defensive: its segmented ring with the number on the left (white for points owned, gold for granted, red outlines for lost), then its name and what it is used for, from the sheet's own attribute descriptions. As before, nothing spells a modifier out: the number turns gold when raised and red when lowered, and hovering the line (tapping, on a phone) opens the breakdown by source, with the battle modifier and, for the LoreMaster, the base. The breakdown no longer repeats what the attribute is used for, since the line says it. Mobility stays the single line at the foot.

## 2026-09-28 - Arsenal rows say they open; slots describe and fill themselves

Every Arsenal row carries a chevron at its right that turns when the row opens, and the name lights on hover, so it is plain the row opens. Afflictions, infusions and augmentations describe themselves: hover shows what they do, a tap says so in a panel. An empty slot reads + 1st Slot (dashed), and a tap offers what the FellGuide allows there, with each option's effect, to the player whose slot it is; the choice is kept, and changing a filled slot is the LoreMaster's. The lists: a weapon's infusions of its own category not already on it; an extra affliction slot's afflictions of the weapon's own family (per the Fellmark rule) not already held; an ability slot's abilities of the weapon's tree at that tier, from the forms it has reached; an augmentation slot's augmentations not already worn.

The abilities come from a new WeaponAbilities collection, generated from the vault's new _Canon/collections/WeaponAbilities.md (the 54 ability and spell pages under The Arsenal/Weapons/Weapon Trees: tree, form, tier, shorthand, description). The sheet had only placeholders before. libraries.web.js sends them as weaponAbilities; the battle cards now carry each chosen ability's own text. Paste velo/backend/libraries.web.js.

## 2026-09-28 - The Arsenal as C3, and the battle cards as C4

The team's picks from the mockup boards, built. Weapons, Lorebounds and Armor share one card shape. Each item is a row led by its kind's symbol (a blade for physical weapons, a spark for magic, a paw for lorebounds, a shield for armor), the name with its type under it (Dagger over Blade, Pip over The Aerostrix), and the level at the right; then one row of labelled facts: Grip, Equipped and Range for a weapon (Equipped is the control that takes it up or sets it down), Form, Mobility and Archetype for a lorebound. Closed rows show only that much. Opening a weapon leads with its base and bonus damage, large and ruled above and below, then its afflictions, infusions and abilities; opening a lorebound shows its Aspect, ruled, with Initial, and Branch and Crown once reached (to choose, where they are due); opening the armor shows its augmentations. The stance held opens to its unlocked tiers; the others say what Tier 1 gives and can be adopted. Slots appear only once unlocked, as 1st, 2nd or 3rd Slot, with no level mentioned; nothing is shown twice; the damage math, the level steppers, reforging and removal move into a LoreMaster panel at the foot of an opened row.

The battle cards are squarer, with a coloured edge by kind, and a slight fan across the row. A card's top strip carries the choice: its title, then the source (capitalised: Dagger, Skills), the tier for a tiered ability, a physical or magic symbol and the damage as base+bonus; a card that needs charge says so in words (1 charge), and one that needs none says nothing. The charge rail on each card is gone; charges live above the row. Choosing a card lifts it and opens its text; a weapon ability now carries its own description rather than just its tier. Any skill reads: Roll 1d6 and add your current skill competency. Choose your skill.

## 2026-09-27 - Every attribute point says where it came from

The attribute breakdown used to lump lineage, origin and motivation into one granted line and everything else into Base. A Fell now keeps a ledger of its attribute points (attrSrc): character creation records the Origin, the starting weapon, armor or lorebound choice, the Lineage and the Motivation; later Motivations, abandoning one, a Title's +3, each level-up (and its armor or lorebound growth) and the LoreMaster's base changes are recorded as they happen. The hover or tap panel lists each on its own line, granted points in gold: Base, Origin (The Watchful) +1, Lineage (The Rysen) +1, Motivation (The Witty) +1, Level 3 +1, and so on.

A Fell forged before the ledger has its breakdown worked out instead: the current Motivation's +1, the Lineage's share of the granted points, and a pre-built Origin's +1 out of Base, with anything left over shown as Base. Its first recorded change starts the ledger from that, so nothing already worked out is forgotten. A custom-path Fell's starting choices were never recorded, so those stay inside its Base. Sheet only, no Velo paste.

## 2026-09-27 - The Attributes tab, option A: rings in rows

The team's pick from four mockups. Each category (Offensive, Core, Defensive) is its own centred row, every ring the same size, so Core no longer leaves a hole in a grid. A ring is ten ticks, one per point: points the Fell owns are white, points something grants (lineage, origin, motivation, an armor stance, a positive battle modifier) are gold, and points taken away (fatigue, a negative battle modifier) are red outlines.

Per Nate, nothing spells a modifier out on the tab. The number turns gold when it is raised and red when it is lowered, and hovering it with a mouse, or tapping it on a phone or tablet, opens a small panel with the breakdown (base, what raises it, what lowers it), the battle modifier's - and +, and what the attribute is used for. The LoreMaster's panel also sets the base. The sixteen steppers under the rings are gone. Mobility is a single line at the foot of the card, red when Weary halves it, with the same panel; its old card is hidden. Clear battle mods appears only when a battle modifier is set. The same in FellGlass and ThreadSpire.

## 2026-09-27 - Talent pills sit beside the dice; the phone bar drops its name

Each skill's talent pill now sits on the dice's line, under the rank circles, on the left with the dice on the right and the two centred on each other; its description opens beneath. It reads only the talent's name, greyed until the skill's first Mastery earns it (the hover says so). The phone top bar no longer shows the portrait, name and level, which every open tab already shows; it keeps its buttons, at the right. Switch Fell is still in the menu.

## 2026-09-27 - Talents from Wix, as clickable pills on every skill

Talents were placeholders ("Trickery Talent (placeholder)"). They now follow the same road as augmentations and infusions: the vault's _Canon/collections/Talents.md (written from the 24 talent pages) becomes schemas/seed/Talents.json through canonFromVault.js, apply.yml creates and seeds the new Talents collection (schemas/Talents.json), libraries.web.js sends them to the sheet as talents, and nothing in the sheet names a talent. Each skill shows its talent as a pill under its question: lit once the skill has a Mastery point, dim with "at first Mastery" until then, and tapping it opens what it does. Mastering a skill stores the talent's real name. threadspirePublicChar derives a Fell's talents from its mastered skills through the collection (the list it read was never written), and the sheet's Ever-Watchful sense does the same. Paste velo/backend/libraries.web.js and velo/backend/characters.web.js.

## 2026-09-27 - P for Player view, and one brightness for every light

P toggles the LoreMaster's Player view, as H toggles the clean view; Settings and the badge name the key. Light gains a button under Bright that sets every light on the map to the slider's brightness at once (and makes it the brightness for the next light placed).

## 2026-09-27 - Fog thickness everywhere outside sight, light brightness, and H hides the Player view badge

Thick now sets the fog's density everywhere outside the party's sight, never-seen and seen-before alike. It used to touch only remembered places, so after Fog the whole map, which starts the map's memory over, the slider had nothing to act on and seemed dead. Fog the whole map and Fog off also keep the map's thickness and vision switch rather than resetting them. Lift all fog is gone: it did what Fog off does, with extra steps.

Light gains Bright, from 10% to full. Pressing an existing light with Light in hand picks it (outlined), and the slider sets its brightness; with none picked it sets the next light placed. A light's label reads its reach and brightness. A lit place is as clear as its brightest light makes it.

H now hides the Player view badge with the other widgets.

## 2026-09-27 - A thickness slider for the fog

Fog's options gain Thick, a slider from 50% to fully solid for how much the fog covers places the party has seen but cannot see now. It is kept per map with the fog (th), 98% unless changed, and every player's screen follows it. The LoreMaster's own view stays at half strength; Player view shows the result.

## 2026-09-27 - Fog outside sight is 98% solid

Places the party has seen but cannot see now are covered at 98%, per Nate, so nothing of the map comes through for players outside their vision.

## 2026-09-27 - Thicker fog outside the party's sight

Places the party has seen but cannot see now were thinned to let the map show through clearly. They now show only as a faint shape through nearly whole fog, so almost nothing comes through for players outside their vision. Inside the vision circle nothing changed: clear to half its reach, half-dimmed to the edge.

## 2026-09-27 - The map bar folds away at the top left, and the LoreMaster gets a Player view

The map bar moved to the table's top left, as far in from the corner as the dice tray is from its own, and has a tools button at its head that folds the whole bar down to that one symbol (and back). Folding returns the map to Move and closes any open panel; this screen remembers whether it was folded. The grid's panel opens beside it at the same height. On a phone it sits just under the top bar.

The LoreMaster's Settings gain Player view, under The view. It draws the table as the party sees it: fog solid rather than at half strength, anything under the fog or Obscured hidden, walls, doors and lights unseen. A badge at the top of the screen says Player view and takes the LoreMaster back. It is the shared party view, so a Masked player's narrower sight, or a player whose own Fell sees the Obscured, would differ from it. Nothing about the table changes. The old Grid and map controls button in Settings is gone, since the grid lives in the map bar now.

## 2026-09-27 - Echosight and Ever-Watchful at the table

The fog now knows how each Fell sees. threadspirePublicChar reports senses (Echosight from the armor's augmentations, Ever-Watchful from the talents), and the sheet's hand payload carries the same for the player's own Fell. An Echosight Fell sees through darkness: its full 15-square sight stands in the dark, and the party shares it as it shares any sight. A player whose own Fell has Echosight or Ever-Watchful sees Obscured foes; everyone else's screen still hides them, since perceiving the concealed is that Fell's alone. Paste velo/backend/characters.web.js.

## 2026-09-27 - Light sources, darkness, windows, and walls that step back when not being drawn

Wall and window lines show only while Walls is the tool in hand; away from it the fog keeps working unseen, and doors keep a half-strength handle to open and close. Walls gains Window (blocks the way, not the view; lines at any angle like doors) and Remove all, which clears every wall, window and door on the map after asking.

Light is a new tool in the LoreMaster's map bar: press where a light sits and drag out its reach, in half squares, shown as a circle with its size while Light is in hand (a mark at half strength otherwise). Remove takes one; Remove all takes every light after asking. A light any Fell has a clear line to reveals everything within its reach that its own light reaches, stopping at walls and closed doors, however far it is from the party. Darkness, a switch per map, is the FellGuide's call made the LoreMaster's: in the dark a Fell sees only what is lit, plus its own space and the ones beside it. Lights and darkness are kept per map under lights, written only by the LoreMaster once the stored copy has arrived.

## 2026-09-27 - Distance as the crow flies, sight that thins with range, and H hides the map bar

Nate's ruling: distance is measured in a straight line, rounded to the nearest whole square. The ruler now reads that (12 across and 12 down is 17 squares), and Vision reaches 15 squares in a circle rather than a square, so the two always agree. Within that circle, sight is clear to half its reach and half-dimmed from there to the edge, with a short blend between; places seen before sit a little dimmer still. Tokens anywhere in the circle stay visible. H, which hides the widgets for a clean view, now hides the map bar, the grid panel and the ruler too, and they return on H.

## 2026-09-27 - The grid panel closes like the bar's others

Choosing any tool in the map bar closes the grid's panel, and opening the grid closes whichever tool panel was open and returns the map to Move, so only one panel beside the bar is ever open.

## 2026-09-27 - Doors at any angle, and fog that survives a grid change

Doors no longer snap to the grid: they land exactly where they are drawn, at any angle, and only catch on the end of a wall already there, so a door still meets its wall. Walls still snap to the grid's corners.

Vision and the fog both scale with the grid: sight is 15 grid squares, and the fog's cells are a quarter of a square. Changing the grid's size used to change how many fog cells a map had, and the stored fog, no longer matching, vanished. It is now carried over by position, painted fog and the party's memory alike, and saved again at the new size.

## 2026-09-27 - Grid in the map bar, fog without vision, and maps that stay with their scenes

The grid's controls (cell size, fade, inset, snap) open from a Grid button in the LoreMaster's map bar, beside it like the tools' options. The Settings button above the scene runner's note is gone; the scene's name sits there instead.

Fog has an automatic vision switch per map (the eye in Fog's options). On, the Fell clear fog around themselves as before; off, only the LoreMaster's painting counts, so fog works with no walls at all. Walls stay optional either way.

Maps now stay put. The map picker asks where a map goes: This scene, or Whole session. The choice is stored in the adventure itself (tableMap on the scene or session, written with the story), so it survives reloads, cache clears and days between sessions, until changed. A scene's own map beats its session's; picking one for the whole session clears each scene's own. Opening a scene lays its remembered map down. After a reload the LoreMaster's shelf used to load only when Maps was opened, so their own table had no picture for its map and told the players its address was empty; the shelf now loads as the LoreMaster's table stands up, the last known address is kept rather than blanked, and the remembered map is laid down. Fog and walls are keyed by map, so they come back with it.

## 2026-09-27 - Walls, doors, and shadows behind big creatures

The LoreMaster's map bar gains Walls, with Wall, Door and Remove. Drag from corner to corner to lay one; ends snap to the grid's corners or to the end of a wall already there. A door carries a handle at its middle (D closed, O open) that the LoreMaster taps to open or close. Walls and closed doors stop the party's sight: a fog cell counts as seen only if the line from the Fell to it crosses none of them, so the fog clears room by room as the party moves. Open doors let sight through. Players never see the lines, only what the fog shows. Walls are kept per map in the table's state under walls, written only by the LoreMaster.

Creatures 2x2 or larger (or any token marked shadow) cast a dim shadow: what lies behind them in range is dimmed rather than revealed, and tokens there are hidden, per the FellGuide's line of sight. The creature's own squares stay lit.

The LoreMaster's push now carries fog and walls only once the stored copy has arrived, so a push made in the first moment after a reload can no longer lay an empty set over what was saved.

## 2026-09-27 - Fog of war: the party sees 15 spaces

On a map with fog on, every Fell now reveals 15 spaces around it, the FellGuide's Vision, counted as the ruler counts, one per space in any direction, so the area is a square 31 spaces across. The party shares what it sees. Places once seen stay dimmed when the party moves on: the map shows through thinly, and any token there is hidden. The LoreMaster's screen keeps that memory in the fog record (e), so a player who joins or reloads finds the same places dimmed. Painted reveals still clear fog anywhere.

Conditions apply to the Fell who has them. A Masked Fell (canon: may only see its own space and adjacent spaces) contributes only that to the party, and the Masked player's own screen shows only that, allies beyond it included. An Obscured foe is hidden from every player until it deals or takes damage. Blinded changes nothing here: canon's Blinded is Bleeding and Dazzled, which halves Accuracy. Walls, doors and creature shadows are next.

## 2026-09-27 - Fog of war, stage A: painted by hand

The LoreMaster's map bar gains Fog. Its options fly out beside the bar (Draw's now do too, so the bar stays short): Reveal and Cover brushes in three sizes, Fog the whole map, Lift all fog, and Fog off for this map. Each map keeps its own fog as a grid of quarter-square cells, run-length encoded, in the table's state under fog, keyed by the map. Only the LoreMaster's push carries it; a player's push leaves it out, so a stale copy can never overwrite it.

It is drawn as mist rather than a grey sheet: a tileable noise texture, deep blue-black with pale wisps, generated once and drifting slowly, with soft edges wherever it has been cleared. The LoreMaster sees it at about half strength, so the map and every token stay visible to them. Players see it solid, and any token standing under it is hidden from them, except the Fell, who are never hidden from their party. Walls, automatic fog from the party's shared vision, remembered places dimmed, creature shadows and the per-player conditions (Masked, Obscured) are stage B.

## 2026-09-27 - Map tools: select, ruler, drawing, pings

A small bar at the left of the table (above the dice tray on a phone) holds Pan, Select, Ruler and Draw. Pan is the default and does what the map always did.

Select drags a box; every token inside it is selected and outlined, and dragging any selected token moves every one of them this seat may move, snapped and sent together. The ruler measures from any point or token to any other, counting one per square in every direction, diagonals included, per Nate: the count is the larger of the two sides. It stays up until the next measure or another tool. Draw puts strokes over the map image and under the tokens, in six colours, sized to the grid; they belong to the map they were drawn on. A player's eraser takes only their own strokes; the LoreMaster's takes any, and Clear wipes the map after asking. Double-clicking the map, in any tool, pings it: rings in the pinger's colour with their name, for everyone looking at that map.

Drawings and pings travel in the table's state as draw and pings. Because every seat pushes at once, saveCampaignState now merges them instead of overwriting: strokes are a union by id minus erasures, erasures are kept as tombstones so an older copy cannot bring a stroke back, and only the last twenty pings are kept. Paste velo/backend/campaignview.web.js.

## 2026-09-27 - The speaker's face while their Dialogue beat is up

On a Dialogue beat the LoreMaster's portrait and name on the right should become the NPC speaking it, and go back after. Every beat card set the speaker as it was drawn, including the cards either side of the centre, and nothing ever set it back, so the portrait could show a neighbouring beat's speaker and keep it. lmSyncSpeaker now follows the centred beat only, on every repaint of the scene runner: a Dialogue beat with a speaker shows them, anything else, and leaving the scene for a fight, returns the LoreMaster's own portrait and name. The phone top bar follows it too.

## 2026-09-27 - LoreMaster's Notes, and the Seal closed to lorekeepers

A LoreMaster's Notes card sits under the Sealed Past on the Lore tab: how the LoreMaster means to handle the player and their lore. It saves a moment after typing stops, through a new seal-notes message, TS_LM_NOTES_SAVE and lmNotesSave, into the same row field as the Sealed Past, beside it, so weaving a seal anew leaves the notes alone. It is never on the sheet's record.

Both cards are now the LoreMaster's alone. The gate that admitted the adventure's owner, loremaster or lorekeeper now admits only the owner or a member made loremaster, and refuses a lorekeeper as it refuses the player. The sheet shows the two cards only after the backend answers for this LoreMaster, so a lorekeeper opening a Fell sees neither. Paste velo/backend/characters.web.js, then velo/page-threadspire.js. The contract checker learns seal-notes and ts-notes-saved; merged with skip ci and the workflows run by hand.

## 2026-09-27 - The LoreMaster's Fell menu says what each option does

Empty this Fell and start it over now shows only for a Fell kept at the table, and lmWipeFell refuses any other: a player's Fell is theirs to rebuild. Release their Fell becomes Unlink their Fell (they stay in the adventure), which is what it did: the Fell leaves, the player keeps their seat and can bring another. Remove from the adventure becomes Remove them from the adventure, and its confirmation says the seat and the Fell both go and a new invite is needed to return. Unlinking or removing cleared the adventure on the row but not in the sheet's record, so the Fell's Lore tab went on naming it; loading now clears it there too. Paste velo/backend/characters.web.js.

## 2026-09-27 - Accepting an invite opens the Fell's sheet

On the join page, attaching a Fell to the adventure now takes the player straight to that Fell in FellGlass (/the-fellglass?charId=...), which opens on its sheet with the adventure already on the Lore tab. If attaching fails, the player stays on the join page and sees the list as it stands. Paste velo/page-join.js.

## 2026-09-27 - Lettering that fits any window, and a joined Fell that knows its adventure

On another screen the lettering came out enormous and ran into itself. The frame art stretches to fill the window, so the HUD's slots are fractions of its width and height, but its text was sized by height alone; any window narrower than 16:9, or a zoomed browser or larger system text, made the text outgrow its slot. Every one of ThreadSpire's sixteen height-based sizes is now the smaller of its height share and the matching width share, and HUD and rail text stays on one line. On the sheet, the stat strip's labels scale with the strip itself (container units on the header), stay on one line and end in an ellipsis before they can collide, and a long name does the same.

Joining an adventure through an invite attached only the Characters row, so the Fell's own record, which the sheet reads, still said no adventure and its Lore tab showed none. attachCharacter now writes the adventure's id and name into the record too, and loadCharacter and lmLoadCharacter carry the row's adventure into the record on load, which also fixes every Fell already joined this way the next time it opens. Paste velo/backend/invites.web.js and velo/backend/characters.web.js.

## 2026-09-27 - The Sealed Past simply shows for the LoreMaster

Nate's call: only the LoreMaster ever sees this card, so there is no one to warn and nothing to break. Opening a Fell in LoreMaster mode now reads its sealed past at once and lays it out for review, with the fragments the player holds beneath. A Fell with none offers Weave the seal; once woven it stays shown, with Weave it anew (which asks first). Break the Seal, its Players, look away warning, Close the seal and the Sealed as code line are gone. No Velo paste.

## 2026-09-27 - The Archive writes the whole entry, in an expandable Description

The field is Description again, with Consult the Archive beneath it rather than beside the label. The Archive now writes everything FellForge did: who you are, a first impression, three lines on how to play them, and, for a Fell that never went through FellForge, three forgotten fragments (a forged Fell keeps its own). It lands as one readable, editable text under those four headings. A forged Fell whose Description held only FellForge's first paragraph has its first impression, tips and fragments folded in once from the forge seed, below what was there, and saved. An Expand button grows the field to show the whole entry; switching tabs folds it back. Paste velo/backend/characters.web.js and velo/public/fgSheetBridge.js again.

## 2026-09-27 - The Archive and the Sealed Past come to the sheet

FellForge's two Archive calls now have a home on the sheet, in FellGlass and ThreadSpire alike. The Identity card's Description is now The Archive: the same field, where a forged Fell's FellForge entry already lands, with a Consult the Archive button that writes a two or three sentence entry from the Fell's own facts (name, lineage, origin, motivation, level, titles, and any FellForge hooks and fragments), in FellForge's house style. Asking over written text asks first. The call is consultArchive in backend/characters.web.js, reached through the shared sheet bridge as archive-consult.

The Sealed Past is a card under Records that shows only in LoreMaster mode. Break the Seal takes two taps, the second warning the table, and shows the buried truths, the seal code and the fragments the player holds. A Fell with no seal can have one woven from what the sheet knows, and any seal can be woven anew. It is never stored on the sheet's record or sent to a player's sheet: ThreadSpire asks lmSealedGet and lmSealedWeave through TS_SEALED_GET and TS_SEALED_WEAVE, and those read and write the row's own sealedPast field behind a gate that admits only the adventure's owner, loremaster or lorekeeper. Owning the Fell is deliberately not enough, so the player cannot read their own. The sheet clears it the moment the LoreMaster closes the Fell or another loads.

Paste velo/backend/characters.web.js, then velo/public/fgSheetBridge.js, then velo/page-fellglass.js and velo/page-threadspire.js. The contract checker learns seal-request, seal-weave and ts-sealed; merged with skip ci and Pages, Seed Embeds and Contracts run by hand.

## 2026-09-27 - The tools move to table.lorefell.com

GitHub Pages serves the forge under its own address, table.lorefell.com, a CNAME in the lorefell.com DNS on Wix pointing at the-loremaster.github.io. Paths lose the /lorefell-forge/ prefix (https://table.lorefell.com/threadspire.html), and GitHub redirects the old github.io addresses there. The AI worker's ALLOW list gains https://table.lorefell.com, since a tool served from the new address calls it from that origin and would otherwise be refused; the worker is deployed by hand in Cloudflare. DEPLOY_MANIFEST.md, SERVING.md and README.md carry the new addresses. The Wix embeds are updated in the Wix editor.

## 2026-09-27 - Phone top bar: portrait, gear, a proper full-screen icon, and the tabs in reading order

The phone portrait showed a corner of the picture: a later phone rule used the background shorthand, which reset the size, so the image drew at full size inside a 38px circle. It covers the circle now. The full-screen button read as the literal text \u26f6; it is an icon, four corners out to go full screen and in to come back. The top-right button on a phone is Settings, so it wears a gear rather than the Fellmark, for players and now for the LoreMaster too (it opens their Settings; it was hidden for them). In a fight a player's gear still opens the fight and turns red. And the phone's bottom bar reads from the Fell outward, Lore, Attributes, Arsenal, Skills, Inventory, where desktop keeps its order.

## 2026-09-27 - No sample Fell on a phone, and the table fills the screen

The page starts from a sample Fell (Acantha, level 12) for the offline prototype. The desktop HUD already waited for the player's own Fell before showing anything, but the phone top bar did not, so Acantha flashed up before the real Fell. The phone bar now stays blank until the player's Fell arrives, and it is hidden with the rest of the HUD while the role is still being decided.

On a phone the table sits inside a site page with its own header and footer. Where the browser allows a page to go full screen (Android and most desktop browsers), the first tap takes the table full screen, and a button in the phone top bar toggles it after that. iPhones only allow full screen for video, so there the button stays hidden. For every phone, the ThreadSpire page code now scrolls the table to the top of the view on load when wix-window reports a mobile form factor, so with the embed sized to the screen in the mobile editor the header scrolls away. velo/page-threadspire.js must be pasted again.

## 2026-09-27 - Phones get a plain table; desktop keeps Joel's art

Joel's art is painted for a wide screen and does not survive a phone. Under 700px wide, the frame art, the HUD art, the window art and the wooden table edge all stand down, and the map sits on a plain navy field between the gold top bar and the bottom rail, both lifted above everything and given a soft shadow. Desktop is unchanged.

The phone top bar now works the way the desktop HUD does: the portrait and name open Switch Fell, the vitality gem opens the Vitality window and shows current plus temp, the Fellmark opens the menu or, in a fight, the fight (and pulses red while one is on), and Log opens the session log. It used to try to open an identity section that does not exist, and its name read Acantha until painted.

The LoreMaster's scene runner on a phone sits clear of the bottom rail, its toolbar wraps to two lines, and the beat card, which copied the toolbar's width and so ran off both edges, is capped at the screen's width.

## 2026-09-27 - Loose ends: a clean check run, a new Fell's first save, and imports that do not collide

npm run checks passes end to end again. adventure-source.test.js checked a fresh open in the same tick, but the stand-up now waits for the library so foes are hydrated first; the test waits for it. The code was right, the test was stale.

A new Fell's first save was being logged and marked as an edit to the Fell in hand, since ThreadSpire credited every sheet save to S.characterId. A save for a different Fell, or for one with no id yet, is no longer counted against the one in hand. Cancelling a forging now also sets the window title back from NEW FELL to the section it was on.

ThreadSpire's import kept the pack's foe and NPC ids, so importing the same pack twice made two adventures share library entries, and deleting either took the other's with it. Each import now remints those ids and every reference to them inside the adventure follows, the way FateWell's import does.

## 2026-09-27 - Tab pages and battle cards ready for phones

An audit of every sheet tab at phone width (390px) and desktop found nothing spilling sideways; the trouble on a phone was size. On a touch screen or anything under 600px wide, the sheet's controls grow to a thumb's size: steppers and dial buttons 36px, small buttons 34px, record and Remnant + buttons 34px, skill pips 22px with wider gaps, inputs 40px at 16px type (which also stops phones zooming on focus), info buttons and charge gems given a larger hit area beyond their drawn shape, and the smallest labels up a step. Desktop with a mouse is unchanged.

ThreadSpire's sheet window on a phone kept its desktop placement, a third of the screen over the frame art, because #win.sheeting outranked the phone rule for #win. It now fills the space between the top bar and the bottom rail, sits above the desktop art that still covers a phone until the mobile pass, drops the window's own frame art for a plain panel, and gains a title bar with the section name and a close cross. The card row's top line wraps on narrow screens instead of running off the edge, the Fatigue and Charge labels drop to save room, and their controls grow. The map page, the menu, and the desktop layout are untouched.

## 2026-09-27 - page-threadspire.js imported listAssets twice

The last change added an import of listAssets that the page already had, and a duplicate import is a syntax error in a module, so the page would not save in Velo. The extra line is gone. threadspire/tests/velo-syntax.test.js now parses every Velo file as an ES module, the way Velo loads it, and is part of npm run checks, so this kind of mistake is caught before a paste.

## 2026-09-27 - A LoreMaster sees their own adventures; deleting clears the library; forging can be cancelled

listMyCampaigns now returns only adventures the member owns. Keeper roles on someone else's adventure no longer add it to the list, in FateWell or in ThreadSpire's picker. A lorekeeper still reaches an adventure they help run through its link or a cast: the ThreadSpire page's resolveCampaign now keeps a linked adventure when myAdventureRole says loremaster or lorekeeper, rather than swapping it for one of their own. Published adventures stay on the Adventures page.

Deleting an adventure from ThreadSpire now also removes the library foes and NPCs tagged with it, as FateWell does, matching the tag FateWell keeps in foeMeta. ThreadSpire's import was sending pack entries raw, without an assetId, so saveAsset refused every one and imported adventures arrived with no library entries at all. It now shapes them with assetToRow and the page stamps the new adventure into foeMeta.

Building a new Fell no longer drops the one in hand. The sheet remembers it, saves nothing while the forge is open, and Cancel brings it straight back through select-character. A finished forging saves as before, and ThreadSpire now takes up the new Fell when the sheet announces it, into whatever adventure it is in.

The Mobility roll no longer writes the total into the strip, which read as Mobility changing. In ThreadSpire the dice and the log carry it; on its own page a small note under the strip shows it for a few seconds.

Paste velo/backend/fatewell.web.js, then velo/page-threadspire.js.

## 2026-09-27 - Delete an adventure from ThreadSpire's picker

Each adventure in Open an adventure has a delete button. It asks first, by name, then takes the same two steps FateWell does through a new TS_ADVENTURE_DELETE page call: deleteCampaign for the campaign row, then removeAdventure for its story tree. Both refuse an adventure owned by another member, and the picker says so. Deleting the adventure on the table puts the table down and leaves the picker open to choose another. Players keep their Fells. velo/page-threadspire.js must be pasted again.

## 2026-09-27 - Mobility rolls, Level opens leveling, fatigue bites, and ThreadSpire imports from its picker

Mobility on the stat strip now rolls 1d6 + Mobility. Inside ThreadSpire the sheet hands the roll to the table through a new ts-sheet-roll message, and it is thrown like any tray roll: dice on the map, a line in the log (Astra rolled 4 + Mobility 5 = 9 on Mobility), and out to everyone. On its own page the strip shows the total for a moment. Level on the strip opens the Lore tab and scrolls to Invested Lore, which flashes once. Fatigue now reaches the numbers, per Survival, with ranks stacking: Tired takes 1 from Precision, Weary halves Mobility for movement (rounded down, shown in the strip in red; the Mobility roll uses full Mobility), Exhausted takes 2 from Evasion, and Drained and Overwhelmed keep taking the Act and the React as before. The penalties sit in attrTotal, so accuracy and everything else that reads an attribute follows, and the dials show a fatigue chip. ThreadSpire's Open an adventure picker gains Import adventure beside New adventure, using the import it already had, with Back returning to the picker. Merged with skip ci for the contract change; Pages, Seed Embeds and Contracts run by hand.

## 2026-09-27 - Vitality can be changed from the strip and the HUD; Condition is Status

Nate's call: a player may add or remove anything, and it still tracks through combat. Tapping the Vitality cell in the stat strip opens a panel under it with current, max and any temp, an amount, and Damage, Heal and + Temp; the LoreMaster holding a Fell open also gets Max Vitality there. In ThreadSpire, tapping the HUD's Total, Temp, Current or Max opens the same four controls in a small window that repaints as the sheet saves, through a new ts-vit-op message. Every path runs through vitOp, which saves, and the save carries the change into the fight through combat sync. Damage still drains Temp first. With those controls reachable from anywhere, the Vitality card on Condition is hidden too, so Condition, still behind the heart button, is Status alone. Merged with skip ci for the contract change; Pages, Seed Embeds and Contracts run by hand.

## 2026-09-27 - Fatigue can be set from the strip and from above the cards

Fatigue gets what charges got. Tapping the Fatigue cell in the stat strip opens a small panel under the strip: the rank and its name, what it does (with any reduction from Unbowed or Unflagging), and - / +. Tapping anywhere else closes it; the rest of the strip stays a readout. ThreadSpire's card row shows Fatigue beside the Charge bar, stepped with - and + and named by rank, through a new ts-fatigue-step message, and the hand payload now carries fatigue and fatigueName. Every change goes through fatigueSet, which also re-reads the hand's gates, so a Drained Fell sees their Acts grey out at once. Merged with skip ci for the contract change; Pages, Seed Embeds and Contracts run by hand.

## 2026-09-27 - Charges can be set from the strip and from above the cards

With the diamonds gone from Condition, a player had no way left to set their own charges. Two places now do it, with one rule (chargeTap): tap the next tier to light it, tap a lit tier to drop back below it, tap a full set to clear it. The charge gems in the stat strip, on every tab, are live; the rest of the strip stays a readout. And ThreadSpire's card row has a small Charge bar at the right of its top line, which tells the sheet through a new ts-charge-tap message; the thin gems on each card still only show what the Fell has. checkContracts learns ts-charge-tap as a message from ThreadSpire to its sheet frame. Merged with skip ci so apply.yml leaves the live CMS alone; Pages, Seed Embeds and Contracts were run by hand.

## 2026-09-27 - Defenses leave Condition

Durability and Resistance already show on the Attributes tab, so the Defenses block on Condition is hidden too (cond-cut). Condition is now the vitality controls and Status.

## 2026-09-27 - Condition shows nothing the strip or the cards already show

Nate's rule for the tab: nothing the stat strip shows, and nothing the battle cards show. The Temp, Current and Max boxes, the vitality bar, the Charges diamonds and the Fatigue pips are hidden (cond-cut, renderers still run). What stays: the Damage, Heal and +Temp controls, the LoreMaster's max vitality control, Defenses, and Status.

## 2026-09-27 - Battle becomes Condition

The Battle tab repeated what the table already shows: the cards carry Acts, Reacts, Passives and weapon damage, and the dice and declare flow carry the rolls. It now keeps only what nothing else covers, and is named Condition: Vitality with its Damage, Heal and +Temp controls, Charges, Fatigue, Defenses (Durability and Resistance), and Status (Afflictions, Impairments, Effects Placed, Boons, Banes). Rolls, Acts and Reacts, and the weapon damage rows are hidden with cond-cut rather than deleted, because their renderers build the hand ThreadSpire draws and phone play may want them back. The header button trades the crossed swords for a heart with a pulse line and still toggles back to the previous tab. PANELS, GOD_TABS and ThreadSpire's section title read Condition; the panel key stays battle.

## 2026-09-27 - The crossed swords toggle back

Tapping the crossed swords while Battle is showing returns to the tab the Fell was on before it, rather than doing nothing.

## 2026-09-27 - Crossed swords for Battle, a quiet stat strip, and swapping from the name plaque

The stat strip under the name jumped to a panel when clicked, mostly Battle, and read as a mis-tap. It is a readout now and does nothing on click. Battle gets its own crossed-swords button in the sheet header on every tab, lit while Battle is showing, in FellGlass and ThreadSpire alike. In ThreadSpire, a player tapping their name plaque in the HUD gets a Switch Fell list: their Fells, the one in hand marked Playing, and Build a new Fell. Choosing one takes it up the way the on-load chooser does, into whatever adventure it is in. The LoreMaster's plaque is unchanged.

## 2026-09-27 - Remnants on the Inventory tab

A Remnants card sits between Utilities and Aurum. Its + opens a short form: title, the world it comes from, and a description. Each Remnant can be edited or removed. The player fills it in, or the LoreMaster does while holding the Fell open in ThreadSpire, since that is the same sheet. The world box suggests the 36 canon worlds from data/Worlds.canon.json and takes any other name. Stored on the Fell as remnants, seeded empty. No slot limit is enforced: the FellGuide says Remnant slots open only at very high levels and leaves the rest to the LoreMaster.

## 2026-09-27 - Give to: the LoreMaster hands any beat to chosen Fell

Every beat in ThreadSpire's scene runner now has a Give to button, whatever its kind. It opens a list of the Fell in the adventure: tick them one by one, or Assign to all. The LoreMaster also picks which Records section it lands in, defaulting from the beat (Quest to Quests, Clue to Clues, Secret to Secrets, Dialogue to Characters, anything else to Notes). It arrives in each chosen Fell's Records on the Lore tab under From the LoreMaster, and nobody else sees it. The player can dismiss one.

A new backend method, giveRecord, writes the entry to each Fell's data.given, checking every Fell against the adventure it is in, and a new TS_GIVE page call carries it. Giving the same beat again replaces the entry and brings it back if it was dismissed. Because a player's open sheet can hold an older copy and its next autosave writes the whole record, saveCharacter and lmSaveCharacter now merge given entries rather than overwrite them: what is already on the row is kept, and a dismissal (data.givenGone) holds against a stale copy too. Each receiving Fell's sheetRev is bumped so an open sheet reloads. The quest board heading in Records reads Quest board again, so From the LoreMaster means given entries only. Paste velo/backend/characters.web.js, then velo/page-threadspire.js.

## 2026-09-27 - Records move to the Lore tab

The sheet's Notes panel held Quests, Characters and Notes, but ThreadSpire's player rail has no Notes tab, so on the table a player could not reach their own records at all. Records now sit on the Lore tab as a card under Invested Lore, with five kinds: Quests, Characters, Clues, Secrets and Notes. Each has a + that opens a line to write one, Enter to save. Quests also shows the campaign's quest board and Clues the clues discovered in play, both above the Fell's own entries. Clues and Secrets are new record kinds, seeded empty on every Fell. The Notes panel is retired, from PANELS and from the LoreMaster's tab bar, and the autosave line moves with it to the Lore tab. Edits and deletes in a record now save straight away. The Invested Lore tip no longer says leveling consumes one crystal.

## 2026-09-27 - Abandon this vow explains itself on hover

The line under Abandon this vow still said it returned only the +1 attribute, which stopped being true when Motivations began granting their three skills. The line is gone from view. The button's hover text now reads: Abandoning returns the attribute and skill bonuses and opens the choice of a new Motivation.

## 2026-09-27 - A Motivation raises its three skills too

Nate's ruling: choosing a Motivation raises its attribute by 1 and each of that attribute's three skills by 1 (The Precise: Trickery, Presence, Finesse). FellGlass granted the attribute only. The skill points now land at character creation and whenever a new Motivation is taken up, as the same kind of grant Origin skills use. grants.motSkillsFor records which vow's skills are credited, so they land once and never twice, however often the Fell is reloaded or the field is touched. Abandoning a vow returns them with the attribute point. Claiming its Title keeps them. A Fell forged before this change is credited once when it next loads, and saved.

## 2026-09-27 - The crystal picker says only what it needs to

Nate's call: players do not need the instruction paragraph under "You hold N Ascension Crystals". The picker is now the title, the count with its steppers, and the Level X to Level Y line.

## 2026-09-27 - Every level's Vitality roll is d6 plus Vigor, kept from the roll

Nate's ruling: a multi-crystal ascension rolls Vitality once per level, and each roll adds the Fell's Vigor plus the d6 to maximum Vitality. That was already the arithmetic, but the total was read back off the die's on-screen result after a fixed wait, with a fallback of Vigor + 1 if the text was not there yet. The roll now computes d6 + Vigor itself and applies that number. Vigor is read fresh each level, so a crystal invested in Vigor counts on its own roll and every later one.

## 2026-09-27 - Spend several Ascension Crystals in one ascension

The sheet counted crystals correctly, by canon: Lore Points crystallise in groups the size of the next level's cost, so a level 1 Fell with 6 Lore Points holds 3. But Level Up spent one crystal and then priced the rest at the new level, so 6 Lore Points became one level and a single leftover crystal. Leveling says the opposite: saving points and spending them together is the cheaper way up. Level Up now opens by showing how many crystals the Fell holds and asking how many to spend, and walks the full level up (attribute, Arsenal, Vitality roll) once for each. The whole ascension is paid at the price of the level it started from, on the first Ascend. Leaving partway keeps the rest: they are held on the Fell as ascPending, still count as crystals, and the next Level Up resumes them. A Fell with one crystal goes straight into the level up as before.

## 2026-09-27 - A battle lasts only while the LoreMaster is running it

A player's table could stand in a battle forever. The adventure's stored state keeps the mode it was last left in, so a LoreMaster who closed the tab mid-fight left combat written there, and every player who opened the table afterwards was put back in it. A player who left the adventure fared worse: the page kept the adventure from the address bar and kept reading its state. Four changes. The LoreMaster's table stamps lmAt on every state push and pushes once a minute while a fight is on; a player takes a battle only from a stamp under ten minutes old by their clock that is still changing (a new one within two and a half minutes, measured locally), so a fight nobody is running drops on its own and comes back the moment the LoreMaster returns. A LoreMaster who opens an adventure left in battle, with an old or missing stamp, is asked once to pick it back up or end it; a quick refresh mid-fight is not asked about. Leaving an adventure drops the battle for that player at once and puts the table down to no adventure: the page now takes a player's adventure from their Fell rather than the address, and TS_ENTER_FELL no longer keeps the old adventure when the Fell has none. And in a fight, where the gem opens the fight, the fight window has a Menu tab and the menu has Back to the battle. velo/page-threadspire.js must be pasted again.

## 2026-09-27 - Arsenal tabs sit under the name and stat strip

Every other panel in ThreadSpire reads name, then stats, then content. Arsenal put its Weapons, Lorebounds and Armor tabs above the sheet, so the tabs came first and the name and stat strip sat under them. ThreadSpire now hands the sheet those tabs with a ts-subtabs message and the sheet draws them in its header, directly under the stat strip, where they stick with the header on scroll. Clicking one switches the panel inside the sheet, which reports back with sheet-panel. Any other section, or closing the window, clears the row, and a reloaded sheet gets it back. The row is navigation only and never appears on the standalone FellGlass page. The LoreMaster's tab bar is unchanged.

## 2026-09-27 - Players can build and delete Fells from ThreadSpire

The FellGlass page sends a player straight to ThreadSpire, and ThreadSpire hides FellGlass's own character switcher, so a player had no way left to add or delete a Fell. The on-load chooser now has a Build a new Fell button and a delete button beside each Fell, and the Characters list in the menu under the Fellmark has a delete button on each row. Deleting asks first, then calls the same deleteCharacter FellGlass's switcher uses, through a new TS_CHAR_DELETE page call. Deleting the Fell in hand drops it from the table and reopens the chooser. This is player side only: the LoreMaster's menu shows no delete. velo/page-threadspire.js must be pasted again for TS_CHAR_DELETE.

## 2026-09-27 - ThreadSpire shows the sheet exactly as FellGlass does

Nate's ruling on the one-sheet rule: ThreadSpire matches FellGlass exactly, and the only difference is navigation (the player's rail, the LoreMaster's top tab bar). Three things changed to get there. The LoreMaster tab bar gains Battle and Notes and now lists every FellGlass panel in FellGlass's order under FellGlass's names, so The Lore reads as it does on the sheet. The host style block no longer restyles cards, hides each panel's first card title, or strips the header, portrait and stat strip; it hides only FellGlass's own hub, Sections button and character switcher, and styles the scrollbar. And the sheet now reports its active panel to ThreadSpire with a sheet-panel message, since the stat strip can switch panels on its own and would otherwise leave the tab bar lit on the wrong tab. threadspire/tests/sheet-parity.test.js pins both the tab list and the style block, and is part of npm run checks.

## 2026-09-27 - One character sheet, held as a standing rule

FellGlass and ThreadSpire share one character sheet: ThreadSpire loads fellglass.html in its sheet frame for both the player and the LoreMaster view. That is now a written rule in CLAUDE.md rather than an implementation detail. Any design or function change to the FellGlass sheet ships in ThreadSpire in the same change, the three seams where they could drift (the tsembed style block, the ts-god flag, and GOD_TABS) are named, and any new exception is a design ruling for Nate. One open question is recorded there: the LoreMaster tab bar omits the Battle and Notes panels.

## 2026-08-16 - SagaForge decommissioned from the hearth

SagaForge is pulled from the hearth. Its card and icon are gone from the_hearth.html, so nothing
on the site routes to it. The tool itself is left untouched in the repo (docs/sagaforge.html and
embeds/sagaforge.html) because it is meant to come back, not to be thrown away; reviving it is
re-adding its WALL card and icon to the hearth. Its Wix page at /the-sagaforge is separate and can
be removed or hidden there whenever convenient.

## 2026-08-16 - The foe math reads from one source

The foe derivation lived as two hand-kept copies, one in ThreadSpire and one in FateWell, free to drift, which is how a rules question turned into a formula hunt across both tools. It reads from one source now. data/combat.core.js holds the LF_COMBAT global: the rating table (offsets, vitality shares, infusion budgets, lore points), the weapon-bonus table, and every derivation from attribute value and vitality through the damage composition, the average party level, the skill difficulty, and the disruption pool. genCanon bakes it verbatim into both tools between the LF_COMBAT markers, byte-identical and idempotent, and each tool's foe functions delegate to it, keeping only their own labels and card text around the shared numbers. Editing a foe rule is one file and one command now. checkCombatCore pins it with thirty-two assertions, and an old-versus-new sweep of every rating by level by build by infusion set by preference, 3750 damage cases plus vitality and offset, proved the delegation identical when it landed. One ruling overrides the vault prose: the weapon Bonus Damage reads at the foe's own level, the party level shifted by the rating, not the flat party level, and Building Crucibles was corrected to match. Do not hand-edit the baked LF_COMBAT block inside a tool. Edit data/combat.core.js, run node scripts/genCanon.js, mirror docs to embeds, and validate. See CANON_SOURCES.md item 0 for the full record.

## 2026-08-08 - Retire the repair button, and let the library hold a foe's full profile

Two cleanups now that the sync is trustworthy. The one time repair button is gone from the backup panel: it rebuilt the whole tree in a single call and timed out, and the normal save now populates the tree correctly on its own, so the button was a crutch from the broken era. The console function stays for a true emergency. And the library now holds a foe's real vitality. A foe often carries vit zero and leans on its rating to derive the number at the table, so an adopted library entry stored zero while the foe read full. The adopt seed now stores the resolved effective vitality, and the backfill repairs a thin entry's vitality and rating on the next save, so the library and the roster show the same foe in both tools.

## 2026-08-08 - A refresh of a cast tab is not a fresh cast

Refreshing a ThreadSpire tab whose address still ended in the cast marker stood the table up as a hollow shell. A cast deep-links to the active scene on the strength of a live relay from FateWell, but a refresh has no relay behind it, so deep-linking lands on nothing. A cast now counts only on the first load of a tab. A marker in session storage survives a refresh, so a reload of a cast tab is treated as a plain open: the chooser is offered and nothing is deep-linked into emptiness. The address bar marker is still stripped so a bookmark stays clean.

## 2026-08-08 - The board foe carries its image at last

Every layer checked out: the library held the image, the combatant pointed at the right entry by the same id in both tools, and the rehydrate merged the image onto the combatant. Yet the token and the roster still showed nothing. The cast step that turns a hydrated combatant into the board foe copied the name, rating, vitality, damage and kit, but never the image or the description, so it stripped both right back off the moment before drawing. The board foe carries image and description now. The token reads the foe image, the roster card reads it, and the foe on the board is finally the same entity as the one in FateWell and the library.

## 2026-08-08 - A foe keeps its image when its library entry predates it

The probe found the last gap: the library entry resolved, but held no image. Foes slim to a library reference and lose their own image and description in the trade. When the slim found an existing library entry, it stripped those fields from the foe without checking the entry actually held them. So any foe given an image or description after its library entry was first made lost that art at save time, since the entry never had it and the foe was about to be emptied. The slim now backfills the entry from the foe first, filling only what the entry is missing, then strips. A foe carries its face and its text through to the table.

## 2026-08-08 - ThreadSpire loads the foe library, so slim foes come back whole

The roster probe answered it in one number: the library count was zero. Foes are stored slim, their image and description held in the account library by libId, and the board rehydrates from there. ThreadSpire only loaded that library when the LoreMaster opened the Library tab, never on standup, and never at all for a player. So a freshly opened adventure showed every foe as a bare name with no art. Now the library loads for both roles when the role is known, and again before the adventure spine is built, since rehydration happens once at build time and needs the library present first. A player gets it too, because the asset list has no role gate on the page. With the earlier fix carrying the description into the library seed, a foe now arrives at the table with its face and its text.

## 2026-08-08 - The foe description survives the library, and a probe for the missing image

The tree write is fixed, but a foe still reached ThreadSpire with no image and no description, so the roster fault was never only the tree. Foes are slimmed on save: their image and description move to an account library entry keyed by a library id, and ThreadSpire rehydrates from that entry. The adopt-a-library-entry seed copied the image but not the description, so an adopted foe lost its description at the seam. The seed carries the description now. The missing image is not yet explained, so the roster probe now reports, per combatant, whether its library id resolves and whether the resolved entry actually holds an image and a description. The next open reads the answer.

## 2026-08-08 - Show the read-failure fields the query fix added

The scene read fix records readErr and sceneReadCapped, but the tool never printed them, so the DIAG line looked identical to the old one and there was no way to tell from the console whether the fix was even running. The DIAG line now prints both. An empty readErr and a false sceneReadCapped mean the reads ran clean; anything else names what went wrong instead of leaving a plausible zero.

## 2026-08-08 - The scene read asked for more rows than Wix will hand back

Scene rows were written and then could not be found. The reconcile read the tree by advId, got nothing, concluded the adventure was missing and re-inserted all sixty nine scenes, every save, which is what filled the collection with duplicates. An unfiltered scan of the same collection found those rows and they carried the exact advId the filter had asked for, so the field looked broken in a way no schema could explain. It was not the field, and it was not the advId. The scene read asked for two thousand rows. Wix Data returns at most a thousand, so that one query failed on every call, and the catch on it turned the failure into an empty list. An empty list is what a fresh collection looks like, so the diff trusted it and wrote. Every other query in the codebase, across fifteen backend files, sits at a thousand or under; this was the only one over, and it was the only read that came back empty. The neighbouring session and act reads at a thousand were fine all along, which is why only scenes flooded.

Two things change. The read stays under the cap, and a read that fails is no longer allowed to look like a collection that is empty: the reconcile now refuses and reports the error rather than diffing against a guess, since treating a failed read as an empty tree is the thing that writes. The failure reason and a truncation flag ride in the diagnostics, so the next read that misbehaves says so instead of returning a plausible zero. The earlier belief that REST written rows were unqueryable from Velo was wrong and the comments that recorded it are corrected; the write path was never at fault.

## 2026-08-07 - The map art layer lets drags through

Clicking to pan the board twitched and then stopped, though tokens moved and pinch zoom worked. The scene art layer that sits over the board was taking pointer events, so it caught the drag and the board never saw the move. Token drags and pinch both grab the pointer up front and were unaffected, which is why only plain panning died. The art layer is marked to ignore pointer events now, so a drag passes straight through to the board beneath. This was named by asking the browser what sat under the cursor, rather than guessing at overlays.

## 2026-08-07 - The chooser stops locking the board, and opens at once

Two faults from the chooser, fixed together. The board would twitch and then refuse to move, and tokens would not click, because the progressive fill kept calling the modal on a timer even after a choice was made, so the full screen modal reopened over the table and swallowed every drag. The fill now stops the instant a choice is made and never reopens, the close clears the live flag, and the board ignores the modal only while it is actually displayed. And the chooser was appearing up to ten seconds late because it waited for the full context, which is slow while a large adventure is read; it now opens on the role hint, which carries whether this was a cast and arrives almost immediately. A cast still deep-links straight in.

## 2026-08-07 - The chooser opens at once, and it must be answered

The chooser was fixed in four ways from watching it in use. It now opens the instant the role is known, with a short gathering line, and fills in the adventures as the list arrives, rather than waiting seconds for the whole context handshake before showing anything. There is a New adventure choice, which sends the LoreMaster to FateWell to author one. The stay here escape is gone from both the adventure and the Fell chooser, because staying resolves to nowhere sensible; the choice is required. And the backdrop no longer closes it on an outside click, since it is a gate, not a passing dialog. A cast from FateWell still deep-links straight to the active scene and never sees the chooser.

## 2026-08-07 - A cast marker does not survive into a bookmark

The chooser skipped for a LoreMaster opening a bookmark, because the bookmark had been saved from a cast and still carried the cast marker in its address. The marker is meant for one arrival, not forever. The page now strips it from the address bar as soon as it is read, on the top frame and without a reload, so a tab opened by a cast can be bookmarked freely and the saved URL is clean. A real cast still deep-links straight to the active scene; a bookmark of it now offers the chooser like any other direct open.

## 2026-08-07 - Enter-a-Fell no longer reassigns a constant

The new enter-a-Fell handler tried to reassign characterId, which is a constant in that page, so publish failed. It never needed to: the local cid holds the chosen Fell and is already used everywhere the handler acts. Removed the assignment.

## 2026-08-07 - A chooser on open, for adventures and for Fells

Opening ThreadSpire from a bookmark or a typed address used to drop you into whatever the address bar held, which after a reimport was often the wrong or a stale adventure. Now a bookmark or direct open offers a chooser. The LoreMaster picks the adventure to bring to the table; the player picks which Fell to take up, and the page resolves that Fell's adventure. A cast from FateWell is different on purpose: it carries a cast marker and deep-links straight to the active scene, so the table opens exactly where the session left off with no extra step. The chooser can be dismissed, leaving whatever the address pointed to open, so nothing is forced. This is independent of the tree sync work and stands on its own.

## 2026-08-07 - One pass populates, and beats survive the load path

The refused second pass told its own story: the write budget of forty left a sixty nine scene adventure a shell, and the continuation pass depended on reading back rows the replica had not caught up to, so the guard rightly refused and the shell stayed. The budget rises to one hundred twenty, enough for a large adventure with its sessions, acts and root in a single pass, so a fresh population never depends on read after write at all. And the tree structure log showed no stored scene carries beats: the blob keeps scene content in entries, the old spine builder mapped entries to beats, and the load path builder did not. It maps them now, the same way, so scene content shows on the board.

## 2026-08-07 - Consistent reads, a reconcile that finishes, and no more stale clobbers

The diagnostics finally converged on the disease. Wix Data queries are eventually consistent by default, so under write churn the diff read a lagging replica, saw no rows it had just written, and re-inserted, which fed the churn: a self sustaining storm, six hundred ninety rows in the scene collection, and the reason the reimported adventure never matched. Every read that feeds a write decision now asks for a consistent read from the primary. Second, the reconcile writes at most forty rows a pass, which left a sixty nine scene adventure a permanent forty scene shell; the save now runs passes until one writes nothing, so a population finishes. Third, a cast from FateWell delivers the full current adventure, and the context load was replacing it with the smaller stale tree; the load now keeps the fuller adventure and says so. The tree collections need one more clean rebuild by hand, then the tree stays honest.

## 2026-08-07 - The verdict, and the structure of what the tree holds

The roster probe settled which side the bug is on. The stored combatants for the scene are the old four, and the board derives them faithfully, so the display is honest and the tree data is stale. The tree is a shell from its first population and later FateWell saves are not reaching it. To size the staleness, the context diagnostic now prints the shape of what the account read actually carried: sessions per act, scenes per session, and how many scenes hold beats and combatants. If the shape is collapsed or the beats are absent there, the write side is confirmed for structure as well as roster, and the fix aims at why the reconcile stopped updating.

## 2026-08-07 - Name which side the stale roster is on

The full adventure loads and paints now, both acts on the panel, forty scenes standing. What remains is the original complaint, the scene roster showing old foes. Two suspects are left and only one probe is needed: when a scene is activated, and once for the scene the load lands on, the console prints what the scene stores against what the board derived from it. Stale names in the stored combatants means the write to the tree never carried the edit. A correct store with wrong foes means the derivation drops it. The next click on the scene answers it.

## 2026-08-07 - The full adventure paints when it lands

The probes told the whole story in order. The relay wins the race to the first paint, so the table draws its stale single scene, then the full forty scene adventure arrives from the account, stands up cleanly, and nothing repaints. The good load was winning in memory and losing on screen, every refresh. Now, when the full adventure stands up, the board and the open side window repaint on the spot. The story panel shows both acts the moment they land instead of holding the picture it drew a second earlier.

## 2026-08-07 - Every path that can replace the adventure now says so

The trace proved the forty scene adventure stands up cleanly and nothing visible replaces it, yet the panel shows one act. Two paths set the adventure directly without going through the traced loader, the blank placeholder and the reset, so they were invisible. Both log now, and the story panel itself logs what it paints from, act and scene counts, at the moment it renders. The next reload shows the full sequence from stand-up to paint, and whichever step drops the story names itself.

## 2026-08-07 - Trace the stand-up, surface the swallowed error, fix the reset flag

Three changes to end the circling. First, a real bug: advReset cleared the remote flag but not the full-load flag, so after an adventure switch every load path believed the full adventure had already stood up and skipped it. The reset clears it now. Second, the full stand-up from the account runs inside a catch that swallowed its error into a field nobody reads; if any of the forty scenes tripped it, the load died silently and the stale relay adventure stayed. The error prints loudly now, with its stack. Third, every call to loadAdventureSpine logs its caller and how many scenes it carried, so the console shows the exact sequence of what stood up and what replaced it. One reload reads the verdict.

## 2026-07-29 - The relay stops feeding a stale adventure over the loaded one

fullLoaded was true, the whole adventure stood up, yet the table still showed one session. The live relay row carries an adventure field from earlier pushes, and it merges and keeps old fields, so it held a stale single-session shape from before the reimport. Every poll read it back and overwrote the full adventure. The relay is for live play state, the active scene, tokens, the log, not the adventure structure, which comes from the account. So once the full adventure has loaded, the relay adventure field is ignored entirely; it is honoured only before the real load, to put something on an empty table. The active scene id from the relay still points into the loaded tree, so the table still follows the LoreMaster from scene to scene.

## 2026-07-29 - A partial relay snapshot stops overwriting the full adventure

The diagnostic found it: the full adventure did stand up on load, forty scenes, but a live relay snapshot arrived right after carrying far fewer, sometimes one, and overwrote it. That is why a refresh landed on a single stale scene with an old roster. The relay now counts the scenes it carries against what is already loaded and refuses to replace a fuller adventure with a smaller one; it only takes over when nothing real has loaded yet, or when it is genuinely newer and no less complete. The full account read wins, and live pushes still update state on top of it without shrinking the story.

## 2026-07-29 - See why the adventure does not stand up on load

The full adventure still would not load on refresh, so this logs the context as it arrives: whether the raw campaign came with it, how many scenes it held, whether the load flags were already set, and whether the surface thinks it is the LoreMaster. One line in the console, and window._ctxDiag in devtools, says which condition is stopping the full load, so the next fix is aimed rather than guessed.

## 2026-07-29 - A refresh loads the whole adventure, not one stale scene

On a hard refresh ThreadSpire stood the table up on a single scene, the one the live relay carries, and skipped the full adventure read from the account, because a partial relay snapshot arrived first and set the flag that blocked the full load. That is why a refresh showed one scene and an old roster: the relay snapshot predated the edit. The full tree read now has its own flag and loads whenever it has not run this session, even if a relay snapshot came first, so a refresh stands up the entire adventure from the account and later relay pushes still update live state on top. Together with the roster deriving from the shared combatants, a FateWell edit now shows after a refresh.

## 2026-07-29 - The load path derives the roster from the shared combatants

The roster still showed the old foe because the fix went into the wrong function. Two scene builders exist: one reads combatants and casts the board, the other, the one the adventure load actually calls, was reading a foes list the tree does not carry and ignoring combatants entirely. So a FateWell roster edit, stored in combatants, never reached the board. The load path now derives foes and npcs from the shared combatants, each re-hydrated from the library first, so a foe added or removed in FateWell shows on the ThreadSpire board after a load. A scene still carrying its own foes mid-session is left as is.

## 2026-07-29 - ThreadSpire rebuilds a foe from the library, so the roster syncs

The library synced but the roster did not: a foe removed and replaced in FateWell still showed the old one in ThreadSpire. The cause is that a combatant stored in the shared tree is slimmed to a library reference, its name, image, stats and kit stripped, since the library holds the full profile. FateWell rebuilds the foe from the library on load; ThreadSpire did not, so it cast a bare foe with no name or image from the stripped record. ThreadSpire now re-hydrates each combatant from the library by its libId before building the board view, the same way FateWell does, so the current roster and its images show correctly.

## 2026-07-29 - Re-enable the shared tree, cleanly, and stop the bad migration from returning

The plan to make the shared source real: the corrupt tree is being cleared by hand in the Wix editor and the collections recreated empty. Two code changes support that. The REST migration that wrote unqueryable rows is disabled in the apply workflow, so recreating the collections does not immediately re-corrupt them; the tree is filled through the Velo dual-write instead, whose rows the tools can actually query. And the dual-write is turned back on, guarded against the flood by its real signature: a full bulk-insert for an adventure is allowed once, since a fresh tree needs it, but a second one within thirty seconds is refused, which is what a runaway loop would do and a healthy write never does. After this, a FateWell save populates the tree through Velo and ThreadSpire reads the same tree, which is what the rearchitecture was for.

## 2026-07-29 - The repair runs in small steps so it cannot time out

The one-shot repair hit a 504: clearing thousands of rows and rebuilding in a single backend call ran past the web method time limit. The repair is broken into bounded calls now. wipeChunk removes a few hundred rows per call and reports how many remain; remigrateOne rebuilds a single adventure and verifies it; listCampaignIds names what to rebuild. The tool, running in the browser where there is no such limit, loops wipeChunk until the collections are empty, then rebuilds each adventure in turn, showing progress as it goes. No single call runs long enough to be cut off.

## 2026-07-29 - A button for the repair, since the console cannot reach the embed

The repair trigger lived on the embed window, which the browser console cannot reach because the tool runs inside a frame. So the repair is a button now, next to Save all adventures in the backup panel, shown only when signed in. It asks to confirm, says plainly that the adventures themselves are the source and are not touched, and announces when the rebuild finishes. One click, no console.

## 2026-07-29 - Wipe and rebuild the tree through the path the tools read

The migrated rows were written through REST and do not answer the Velo query the tools use, which is why the reconcile never found them and flooded the collection with duplicates. Deleting the duplicates alone would not help, since a fresh REST-style write would be just as unqueryable. So the repair clears the four collections completely and rebuilds every adventure from its Campaigns blob through wixData, the same path the tools query, then verifies each adventure by that very query. It runs once, by hand: type fwWipeRemigrate() in the tool console. The reconcile guard is relaxed only for this deliberate rebuild, through a force flag, so the normal save still refuses to bulk-insert. The blobs are untouched and remain the source, so the rebuild is safe to repeat.

## 2026-07-29 - Stop the duplicate flood and add the tools to clean it up

The diagnostics settled it. The reconcile query by advId came back empty for the rows the REST migration wrote, though an unfiltered scan saw those same rows carrying the right advId, so every compressed save thought the tree was empty and re-inserted all sixty nine scenes. The scene collection had climbed past four thousand duplicate rows, each failed pass adding more and burning the quota. Three changes stop the harm. The compressed dual-write is disabled, so no more duplicates are written. A hard guard in the reconcile refuses to bulk-insert when it finds no existing scenes for a non-empty adventure, so nothing can flood this way again even if re-enabled. And a repair method removes every scene, session and act row for an adventure by scanning and matching in code, the read path the diagnostics proved reliable, so the duplicates can be cleared before the tree is rebuilt cleanly. FateWell loads from its own blob and keeps working throughout.

## 2026-07-29 - Diagnose why the compressed reconcile re-inserts every scene

The telemetry named the flood: dualWrite-gz spends forty inserts every fire, which means the diff is matching no existing scene rows and re-inserting the whole tree each time. To see why in one screenshot, the reconcile now reports how many scenes the blob holds, how many are stored, how many matched by id, and a sample blob id against a sample stored id. If matched sits far below stored, the ids do not line up and that is the bug to chase. Temporary instrumentation to pinpoint the mismatch, not a fix.

## 2026-07-29 - Close the sync loop cleanly

Converting the bulk sync to a spaced loop left the old loop's closing brace behind, an extra bracket that a plain syntax check waved through but the publish parser rejected. It closed the message handler early and broke the file. Removed the orphan; the block balances and publishes.

## 2026-07-29 - Bulk sync saves one adventure at a time, with room to breathe

Saving several adventures in one unbroken burst stacked their calls into the same minute and tripped the quota on the second one, even though each save on its own was small. The member id came through this time, so the flood was milder than before, right at the edge. The Save all path now saves each adventure in turn with a short pause between them, so the per-minute budget has room and a two adventure sync lands cleanly. The tree reconcile is left to its normal throttle rather than forced during the sync, to keep the burst light.

## 2026-07-29 - An unstorable image no longer blocks the whole save

This was why a save reported success but nothing persisted. Adding a foe with an image makes the save host the image first and defer the rest, expecting to run again once the image is a stored url. If the image is too large to store, it stays a data url, so the next save finds it again and defers again, and the adventure never actually saves. There was no error because each step looked like it worked. Now the save defers for hosting only once per change. If an image is still inline after that, the save proceeds anyway, drops the unstorable image from the stored copy so it neither blocks nor bloats the row, and says plainly that one image was too large and stays on this device. The rest of the edit lands.

## 2026-07-29 - The compressed save stops reading the whole tree back

The telemetry named the culprit at last: dualWrite-gz, the tree reconcile on the compressed save path, was firing again and again and stacking toward the quota. It ran through migrateCampaign, which reads the whole tree back to verify and re-stamps the Campaigns row every call. That is migration bookkeeping, not the cost a routine save should pay. A lean path replaces it: read the blob once, decompress, diff-write the tree, and stop. No read-back, no re-stamp. The first-open auto-migration still uses the full verified path, since that runs once, but every autosave after takes the cheap road. Same tree, a fraction of the calls.

## 2026-07-29 - Telemetry covers the whole save, not just the tree

The tree telemetry was measuring one room while the fire was in another. The FateWell backend, where saveCampaign, roleFor and memberId live, and the campaign-view poll that runs every two seconds were never counted, so a flood from either was invisible. Both are instrumented now, through the same counter, and their tallies fold into the rolling per-minute count on the page. The poll reports a baseline reading at most every ten seconds so it does not spam the readout while still showing what it spends. Now the number on screen is the whole picture: what a save costs, what the Save all button costs, and what the poll costs underneath it all.

## 2026-07-29 - Drop an orphaned flush ack

The flush handler posted a done message back to the tool that nothing listened for, which the contract check correctly flags as a page talking into the void. The tool fires the flush on its way out and does not wait for a reply, so the ack served no purpose. Removed it; the contract is clean again.

## 2026-07-29 - FateWell trusts the blob it just wrote

A saved roster change reverted on refresh even though the save succeeded. FateWell was reading the shared tree on load, but it writes the tree on a short delay while the blob is written at once, so a refresh landing in that gap loaded the tree's older copy and lost the edit. FateWell now loads from its own blob first, which is always as fresh as the last save, and falls back to the tree only when there is no blob. The tree stays the channel ThreadSpire reads. The delay before the tree write is shorter now, and the tool asks the page to flush any pending tree write when it is hidden or unloaded, so a refresh cannot outrun it and ThreadSpire still sees the change promptly.

## 2026-07-29 - Deleting a library foe deletes it everywhere

A library profile could not really be deleted while a scene still used it. The save routine rebuilds the library from scene combatants, so a deleted profile came straight back on the next save. Now deleting a profile from the library also strips it from every scene that references it, matched the same way the save routine resolves a combatant to the library, by id then by name and type, so nothing is left to rebuild from. The confirm says how many scene slots it will clear, so the reach of the delete is not a surprise. Both the single delete and the multi select delete cascade this way.

## 2026-07-29 - Telemetry no longer breaks publish

The telemetry reached for the embed from a module level function where that name did not exist, so Wix refused to publish the page with an undefined reference. The embed is now held in a module level variable set when the page wires up, and the telemetry posts through that. Same behaviour, but the reference is real everywhere it is used, so publish passes.

## 2026-07-29 - Telemetry on every backend save call

Stop guessing where the quota goes. Every Wix data call in the adventures backend now runs through a counting wrapper, so each save returns a tally: how many gets, queries, inserts, updates and removes it made, and against which collection. The FateWell page folds that into a rolling count of calls in the last sixty seconds and shows it in a small corner readout, dim when low and red near the quota, plus window._tele in devtools for the full history. Now a flood is a number on screen, not a theory. This is instrumentation, not a fix; it tells us which path is spending the calls so the fix lands in the right place.

## 2026-07-29 - The tree reconciles on a throttle, not every autosave

Saving a foe still tripped the quota through a side door: every autosave, and there are many while adding foes, ran a full tree reconcile, so the reads and writes piled up until the minute's quota was gone and the next thing, the Save all button, had nothing left. The blob save was never the problem; it is small and immediate. The tree dual-write is now throttled per adventure, remembering the latest campaign and reconciling at most once every few seconds, with the last edit always flushed. ThreadSpire reads the tree when it opens and auto-migrates from the blob if it is behind, so the tree does not need to be perfectly current every keystroke, only current soon. Both the single save and the Save all button now schedule the reconcile instead of forcing it inline.

## 2026-07-29 - The diff stops calling every row changed

The quota flood came back because the diff that was meant to skip unchanged rows was comparing JSON fields by their serialized string. Two equal objects can serialize with different key order, so every scene looked changed and the whole tree wrote on every save, exhausting the per-minute quota again; once tripped, even the sign-in check failed, which is why the error also saw no member id. The diff now compares JSON fields by value, with keys sorted, so an unchanged scene truly writes nothing. And a single save now spends a capped write budget, so even a first save after migration or a broad change lands what it can and lets the next save finish the rest, rather than flooding and landing nothing.

## 2026-07-29 - Every image saved is a stored url

Inline images and blob addresses have no business in a saved row: a data image bloats the row past Wix's per item limit, and a blob address is local to one browser and dies on reload. FateWell already pushed its images to stored urls on save; ThreadSpire did not on the paths that now write the adventure tree and the stages. It does now. Every adventure save, scene, act, session and root, and every stage save carrying a map or token, walks its payload and replaces any data image with a stored url, converting a wix descriptor to its static address and dropping a blob address that cannot be uploaded from here. So no save from either tool can put anything but a real url into a row.

## 2026-07-29 - A save writes only what changed

Saving a large adventure through FateWell was flooding Wix past its per-minute quota: every save rewrote every row, so a 69 scene adventure fired a couple of hundred calls at once, and once the quota tripped even the sign-in check failed, which is why the error also said it saw no member id. Now saveAdventureFromCampaign reads the adventure's rows once and writes only the root, acts, sessions and scenes whose content actually changed, and removes the rows a campaign dropped, using the lists it already read. An unchanged scene costs nothing; a one scene edit costs one write. The backend migrate reuses the same diff writer, so opening a large adventure no longer bursts either. ThreadSpire already wrote one scene at a time and was never the culprit.

## 2026-07-29 - The migration writes where a query can find them

The batch migration reported every scene written and none read back, with nothing rejected, because the raw REST writes were missing the envelope Wix Data v2 wants: fields must sit under dataItem.data, not at the top of dataItem. The writes returned ok and stored nothing queryable, so the read-back found zero. Fixed to wrap every write, insert and update, in the data envelope the working scripts already use, with the id alongside on an update. The tools themselves were never affected; they write through the Velo client, which takes a flat object, so an adventure opened in FateWell or ThreadSpire migrated correctly on first touch. Only the batch script, on its own REST path, wrote into the void. A rerun is idempotent and now lands the rows.

## 2026-07-29 - Migration verification made truthful

The first migration run reported every scene written but zero read back, which read as a failure but is the shape of a Wix Data query lagging its own writes: the count ran off the search index a beat before it caught up. The read-back now settles and retries a few times before trusting a low number, and each scene write is checked for rejection so a genuinely refused write (an oversized beats field, say) is counted and named rather than hidden inside a zero. A rerun is safe and idempotent; this makes the rerun tell the truth.

## 2026-07-29 - Every adventure migrated into the shared tree

The migration that finishes the move. scripts/migrateCampaigns.js walks every Campaigns blob, decomposes it into the Adventures tree under the same id so members, players and stages still resolve, and verifies each by counting its scenes back. It is idempotent, upserting by id and pruning rows a campaign no longer holds, so it is safe to rerun. It runs in the Apply workflow after the collections exist. The Campaigns blob is not deleted; it stays as a live mirror, since both tools still dual-write it, so there is a costless backup to restore from. The tree is the source both tools read; the blob is the safety net beneath it.

## 2026-07-29 - FateWell reads and writes the shared adventure, and the two tools agree on a scene

FateWell now joins ThreadSpire on the one source. On open it reads the Adventures tree, migrating an old blob once on first touch, so it sees whatever ThreadSpire wrote. On save it still writes the blob for now, and also writes the whole tree, so an edit in FateWell reaches ThreadSpire from the same rows; a compressed save goes through the migrator, which decodes it. A new backend, saveAdventureFromCampaign, decomposes a campaign into the tree and prunes the rows a delete removed.

The two tools also agree on what a scene holds. combatants is the shared, stored shape: FateWell authors it directly, and ThreadSpire keeps it in step as foes and npcs are added or removed on its roster, so a foe removed at the table is a foe removed in the record both tools read. The board keeps its own derived view for rendering; only the shared shape is stored.

## 2026-07-29 - ThreadSpire reads and writes the shared adventure

The step that ends the lost-edit bug. ThreadSpire no longer loads a lossy spine of the active scene and write nothing back. On open it reads the whole adventure tree through loadAdventure, migrating an old Campaigns blob once on first touch, so every act, session and scene arrives with all its content, beat images and prep and the rest included. Every edit now writes through to the shared tree: a change inside a scene saves that one scene's row, debounced; a new act, session or scene, a rename, a reorder or a delete rewrites the tree's skeleton and removes the deleted row. The live relay row still carries real-time play; it no longer carries the story, the Adventures collections do. A foe removed and a beat added survive a reload now, because they are written where the adventure actually lives. The lossless load also means the old spine can never overwrite the scenes it did not hold.

## 2026-07-29 - Adventures: the shared source, decomposed

The first and largest piece of ending the two-adventures problem. An adventure no longer lives as one blob that only one tool can write. It is decomposed into four collections, Adventures at the root and AdvActs, AdvSessions, AdvScenes beneath, with each scene carrying its beats and combatants batched into its own row. A new backend, adventures.web.js, reads the whole tree in the shape the tools already hold, writes one row at a time so an edit to one scene touches only that scene, and migrates a Campaigns blob into the tree without deleting it. Nothing reads these collections yet; this is the foundation the tools will be moved onto next, so both FateWell and ThreadSpire read and write the same adventure and the drift that lost a session's edits is designed out. The rule that ends the specific bug: a tool must load the whole tree, never a single scene, so a save can never overwrite the scenes it did not hold.

## 2026-07-29 - Card follow-ups, and safeguards so a deploy is never a mystery again

Follow-ups on the foe and Fell cards, from play. The Attack tab is back, with the damage line, and the standard attack no longer doubles into the Acts tab. A kit description on desktop is a hover tooltip now rather than a forced click, while touch still taps to open it, since a finger cannot hover. The Back button from a description no longer drops you onto the library version of the card: it closes the panel and leaves you on the combat card you came from. And the three armor stances carry their rules now, from the FellGuide, all three shown with the held one lit, so a stance is never a bare name.

Safeguards, after a deploy that could not be seen. A new DEPLOY_MANIFEST.md records, per tool, which of the two serving paths it uses, because the whole confusion was verifying the CMS pipe for ThreadSpire, which is served from GitHub Pages. SERVING.md no longer claims every tool serves from Wix; it points at the manifest first. And scripts/deployState.js answers "is main deployed" per tool by checking the right workflow ran green on the exact merge commit, which is the check that was missed.

## 2026-07-29 - The foe card, made usable in play

A pass over the expanded foe and Fell cards, from playing them.

The card no longer jumps to the top while you read it. The state feed repaints the strip about once a second, and that rebuild was throwing away your scroll position and, worse, tearing an open dropdown out from under you. Now the open card's scroll is captured and restored across a repaint, and a repaint that arrives while a dropdown or field inside the card has focus is skipped until you let go, so nothing you are mid-way through is interrupted.

The Attack tab is gone. A standard attack is an Act, so it now leads the Acts tab at tier 0 with its own damage line, and every other Act sits below it whether charged or not, the ones beyond the current charge grayed with the reason. The redundant second Charges row is gone from the card; the diamond pips on the Vitality line are the one charge control, and they now publish to the players the way the old row did.

The Act picker offers the whole vocabulary, not just Attack: the standard attack, the foe's own Acts with the charged ones marked when they are not yet paid for, and Skill, Assist an ally, and Movement. Targets now include a Fell, another foe, the actor itself, or a space. The roll no longer shows until a target is chosen, since a die before a target has nothing to resolve against.

On Stats, infusions, augmentations, stances, and afflictions carry their descriptions now, on hover or a tap. Every stance shows, the held one lit and the rest grayed, so the whole set a foe could take is visible at a glance.

## 2026-07-29 - The CombatPlayer collection learns the feed fields

The Darkshard feed round-trip needs three columns the collection did not have: feed, the board's request; feedAck, the sheet's honoured feed; and skyShards, the placer's Skyvault Shard count. Added to the field script and the schema together, additive, so a push applies them to the live collection without touching the rows already there.

## 2026-07-29 - The Darkshard feeds from the pack, with the player's blessing

Feeding a Darkshard now spends a real Skyvault Shard from the placer's pack, and only with the player's approval. The board asks; the placer's sheet shows an approval card, spends one Skyvault Shard on yes, and acks the feed; the board raises the shard's Vitality when that ack returns, so the number and the pack move together and a decline moves neither. If the placer carries no Skyvault Shard, the board's Feed control turns red and refuses, and says why. A placer holding more than one Darkshard feeds the one they were asked about, since the ack names its shard. The relay between the two halves is a velo hand-paste, scoped in full in DARKSHARD_FEED_VELO.md; until it is pasted, the approval card does not reach the sheet.

## 2026-07-29 - Feeding a Darkshard spends a Skyvault Shard, with the player's say

The board no longer feeds a Darkshard on the LoreMaster's tap alone. Tapping Feed asks the placer, and the asking reaches their own sheet, which is where the pack lives. The player sees an in-table card: spend one Skyvault Shard to raise the shard's Vitality, or not. On approval the shard leaves their pack and the board raises the Vitality; decline and neither moves. The board's Feed control turns red and refuses when the placer carries no Skyvault Shard, read from the count their sheet publishes. The sheet's Skyvault Shard count and its feed acknowledgement now ride the combat sync; the relay that carries them across the frame and the CMS is a velo hand-paste, written up in DARKSHARD_FEED_VELO.md, and the board and sheet are built to close the loop the moment it is pasted.

## 2026-07-29 - The Darkshard takes the field

A Darkshard is now a placed OBJECT, not an inert marker. Set on an open square, it resolves at the resolution swap into a shard the fight can see and strike: it carries its own Vitality, starting at one, and opens a deep violet radius drawn on the ground beneath the tokens, the first visible radius on the board. Its Vitality rides in a corner badge. The LoreMaster can strike it, and when the damage taken reaches its Vitality it shatters and the ring goes with it. A feed control raises its Vitality, gated on the placer standing within the radius, measured as a circle from its centre. This is the board half of Part 1. The feeding pack-decrement, the placer actually spending a Skyvault Shard, is a follow-up that needs a velo paste; until it lands, feeding raises Vitality but does not yet draw the shard from the pack, and the log says as much. The anti-Aether silencing is still its own build, and the shard now exists on the board for it to read.

## 2026-07-29 - Placed markers pulse in their own colour

The outline glow is now per utility, driven off two colour values set on each marker so the same pulse animation carries any colour. Caltrops pulse violet. Traps (red), runes (green) and Skyvault Shards (white) are wired ahead of their rules, ready the day each becomes placeable. Darkshard is left out of the outline map on purpose, it is headed for a radius rather than an edge glow.

## 2026-07-29 - The gold pulse turned up

The outline glow was too faint to read. Stacked gold drop-shadows now compound into a real halo, with a warm near-white core at the peak, and the dim point of the pulse still carries a clear gold edge.

## 2026-07-29 - The caltrops glow gold around their own edge

No box and no fill now: the art sits on the map as itself, and the gold pulses around its actual outline. drop-shadow follows the PNG's shape rather than a square, so the glow traces the spikes. A steady dark shadow underneath holds them legible on a bright map through the whole 2.4s pulse.

## 2026-07-29 - Placed art breathes a gold pulse

A slow gold glow now pulses behind a placed marker, out and back on a 2.4s heartbeat, layered over the soft dark ground so the still version is one line away if the pulse does not land. A depth shadow rides through the whole cycle, so the marker keeps its footing on the map even at the glow's low point.

## 2026-07-29 - Placed art gets its dark ground back, softened, and keeps no border

The half-transparent fill returns behind the art at half the darkness of the first version, no border. It grounds the silver against a busy map without the hard black tile, and a light shadow lifts the marker off the terrain.

## 2026-07-29 - Placed art loses its frame and stands on a shadow alone

The gold frame and the scrim are gone from art markers. The picture now sits on the map as itself, lifted only by a light shadow that follows its own outline, so a caltrop reads as a caltrop on the ground rather than a picture in a box.

## 2026-07-29 - Placed art lifts off the map, and stops shouting its own name

The caltrops rendered through their transparency but sank into a busy map, silver on nothing. The art now sits on a soft dark scrim, a radial that is deepest at the centre and fades to nothing before the gold frame, so it grounds the picture without the old filled box, and it carries a drop-shadow that follows the shape's own outline rather than the square, giving it an edge against whatever lies beneath. The repeated name is gone from art markers: five "Caltrops" tags across one cluster was noise, and the picture already says what it is. A marker with no art keeps its label, since letters alone say little.

## 2026-07-29 - Placement art shows through, and the Skyvault Shard is wired

The placed-utility art was rendering inside a black box: the dark fill kept for letter markers was showing through the cut-out PNGs. An art marker now drops the fill and the glow and lets the picture stand on its own transparent ground inside the gold frame, sized to contain so the whole shape shows uncropped. Skyvault Shard art is wired alongside the others, on its Relics row and in the board's lookup, ready for whenever its rules place it. Rune and Trap render their art on placement now too; their trigger rules are scoped as a future build and written down so they are not lost.

## 2026-07-29 - Placed utilities wear Joel's art, and the Darkshard rulings are locked

A resolved Caltrops, Rune or Trap now shows its own art on the board instead of gold letters. The art lives on the Relics rows in canon as the record of truth, and threadspire carries a matching lookup keyed by name, because a placement marker is drawn where the declare knows only the utility's name and the board holds no relics catalogue to look it up in. The gold frame and glow stay, so a caltrop reads as itself and still as a placed thing; a utility with no art keeps the letters. Darkshard art is carried too, for when its own build lands, it is not a marker yet.

The two open Darkshard rulings are now decided in the scope doc: a foe is silenced if it is anywhere within the radius, any overlap, not centre-in; and multiple simultaneous Darkshards are allowed, each with its own Vitality and its own placer, silence being a boolean that ORs across their radii.

## 2026-07-29 - A placement warning lives only as long as the next tap

The line that refused a bad placement square stayed up until something else redrew the row, so it read as outstaying the mistake it named. It now clears the instant the player taps again, good tap or bad, so it lasts exactly as long as the player takes to try once more.

## 2026-07-29 - Caltrops land as a cluster, and the ground answers all at once

Two changes to how a placed utility works, both from the table.

The five squares of a Caltrops must now form one connected cluster. The first tap is where they land and is free; every tap after it has to touch a square already set, eight-neighbour, so a diagonal counts and the spread reads as a scatter rather than a rigid plus. A tap that does not touch is refused out loud on the board, the way an occupied square already was, rather than quietly dropped. The rule rides on a new `adjacent` flag on the utility model, separate from `space` so neither field carries the other's meaning, and it is forwarded through both hops that reshape the row so it cannot be dropped between the pack and the table. Caltrops still land on any square, occupied or not.

Placement is no longer a per-Fell button. The instant the LoreMaster swaps to resolution, every declared placement on the board materialises at once and every placer's pack spends at once. There is no "Place it" to press. Until that swap nothing is on the ground and nothing is spent, so a player who declares a placement and then takes it back loses nothing, which is what the old per-Fell resolve could not promise: it spent and placed the moment it was pressed, and an undo afterward left the marker down, the pack short, and the placement id burned so it could not be laid again. The surprise of the ground answering is now the LoreMaster's to spring, and the foes', to walk into.

## 2026-07-29 - The LoreMaster gets the grid the players already had

The grid drew on the side that met the map fresh and not on the side that already held it. drawGrid ran only inside the map probe's first-measure branch, so the players, whose map arrives new at combat, saw their squares, while the LoreMaster, who usually has that same map already measured from laying it down, hit the skip path and got a bare map with no lines. The plain-load path now draws the grid too, so both sides of the table see the same squares. This also gives placement markers the coordinate surface they resolve onto, which was the real reason a placed utility could not be seen on the LoreMaster's board.

## 2026-07-29 — The CombatPlayer collection gains the ground it forgot

Three fields the placed-utilities feature writes to did not exist on the collection: places, placed and placedAck. Wix keeps nothing when a write names a field the collection does not have, so a declared Caltrops travelled the whole pipe correctly and vanished at the last step, looking exactly like a broken feature. createCollection.js could never have fixed this - it adopts a collection that exists and never touches its fields - so a one-time additive pass reads the live collection, adds only what is missing, writes it back and reads it back to prove the store kept it. It is idempotent: a second run adds nothing. The schema and the script are kept in step by hand. The one line that runs it inside Apply CMS is a workflow edit, which needs a hand with workflow scope, so it is left for that hand.

## 2026-07-29 — The card row learns the LoreMaster's manners and the die tells the truth

Taking one card up no longer opens the whole row: resting cards keep their single line and only the held card grows, the same compact-around-open rule the LoreMaster's cards already follow. The die and the roll readout now land above the cards instead of behind them, and the readout has stopped inventing its numbers. The stub arithmetic that stamped Precision 3 and Finesse 2 on every roll is gone; a loose roll from the tray shows the die and nothing else, and a roll that commits a declare shows the sheet's own accuracy, roll plus Precision for an attack, roll plus the skill's bonus for a skill, handed back with the declare result so the table and the LoreMaster hold the same number by construction. The card also decides the die now: arming an attack readies the attack die, a skill the skill die, and a utility that rolls nothing opens no dice at all. Every way of rolling while a roll is owed commits it, including the type picker paths that used to slip past and roll loose, which is why a committed Act sometimes looked like a die that rolled and did nothing.

## 2026-07-25 — Watching the sheet speak

Five attempts at making a change on one side reach the other have missed, which means a guess about where a save travels is wrong somewhere. The seams now count what the sheet actually says to the table and what the table does with it: how many messages have come from the sheet at all, whether any of them were saves, who the last one was marked for, and which marks the table is holding. One reading settles it.

## 2026-07-25 — A Fell can be emptied and begun again

A Fell written over with another Fell's life can be put right. The mark beside it offers to empty it: attributes, skills, weapons, armour, bonds and pack all go, and the name and the adventure stay. Nothing else could undo it, because the wrong life was not only shown on the sheet, it was written to the record while it sat there.

An empty record is no longer kept in hand between openings. Holding one meant the next opening laid an empty sheet down from memory before the true one could arrive.

A Fell fetched again after its player writes to it no longer throws the window open. It is fetched quietly and the sheet is re-lit where it stands.

## 2026-07-25 — A Fell opens as itself

A Fell that had not been through the forging was answered with nothing at all, on the grounds that there was nothing to show. The sheet, told nothing, kept the Fell before it and wore that one's whole life: its attributes, its skills, its pack. Every Fell made for someone at the table is unforged, so every one of them arrived wearing the last Fell looked at. A Fell that exists is now opened as itself, forged or not, and a sheet handed nothing starts empty rather than keeping what it had.

Changes now travel between the LoreMaster and the Fell in both directions. The mark that says a Fell has been written to was being set on the road going down to the sheet, and a save only ever travels up, so nothing was ever announced. It is set where saves actually pass, by either hand, and whoever holds the older copy fetches it again.

The Fell plaque leads to the roster. Holding a Fell open, it read as already being where you were and shut the window instead, which looked like nothing happening. Closing is what the cross is for.

## 2026-07-25 — What the LoreMaster changes, the player sees

A Fell worked on from the LoreMaster's side now reaches the player's own sheet. Their sheet was holding the copy it loaded and had no reason to ask for another, so anything given or taken sat unseen until they opened it again. The table already carries word between the two every second, so the change is announced there: a mark against that Fell, and the player's own table tells their sheet to fetch itself anew. Their log says the LoreMaster has changed their Fell, so nothing shifts under their hands unexplained.

A window opens from nothing every time. One left showing a sheet kept showing it, and whatever was written into the body afterwards was written out of sight, so a section could be opened and appear to do nothing at all.

## 2026-07-25 — Walking away from a Fell puts it down

The Fell tab opens on the list again. Leaving that tab by any other plaque left the Fell still held, so coming back showed the sheet frame instead of the roster, and the frame had nothing in it. The tab looked dead until something else shook it loose. Going anywhere else now sets the Fell down properly.

A utility whose entry has left the library says so and can be put down, rather than being reached into and stopping the whole list from drawing. That is what made a handful of them appear at once and then behave after they were removed.

## 2026-07-25 — A utility keeps its secret unless it says otherwise

Being known on sight is something a utility now states outright. Reading silence as openness meant that the moment the veiled lines failed to reach the sheet, every utility in the game lay bare and the Discovered button had nothing left to do. Silence keeps the secret instead, and a utility whose veil has not arrived shows three question marks and a line saying it is something you have not seen before. The Skyvault Shard says it is open, and is the only one that does.

The Remnant button is gone. A remnant is a kind of utility, not a state one is in.

## 2026-07-25 — A Skyvault Shard is known on sight

Some things need no introduction. A utility carrying no veiled line has nothing to hide, so it shows its own name whether or not it has been identified. The Skyvault Shard is the first of them. A Darkshard is still a black shard that takes the light, and stays that way until somebody says otherwise.

The lute is worked with silver.

## 2026-07-25 — The veiled lines say what the things actually look like

Thirty three of the utilities now wear the description their maker gave them rather than the one guessed from their name. Filcher's Band is a ring cut with runes. Haulers are steel gloves. The Skeleton Key is bone white with its bow carved as a skull. The Wispin Coin is a blue gem with a symbol on one face and a grinning bogle merchant on its back.

## 2026-07-25 — A utility you have not identified still shows itself

An unknown utility says what it looks like in the hand instead of nothing at all. A pitted stone, warm in the hand. A key filed down to bare teeth. A coin struck on one side only. You can see what you are holding and still not know what it does, which is the whole of the tension.

Every utility carries its own veiled line, written for it rather than worked out from its name, and it says nothing of what the thing is for or which shelf it came from. The three question marks stay above it.

## 2026-07-25 — Room under the pills, and one Foxfire too many

A row of pills no longer has the next heading resting on its shoulders.

Foxfire is gone from the utilities seed and from the RelicForge shelf, leaving Foxfire Gem to stand alone. The row already written to the site is not removed by this, since seeding adds and amends but never deletes; that one is a deletion by hand.

## 2026-07-25 — Utilities are the real ones

The Utilities card draws from the shelf the RelicForge fills. It had four placeholders written into the sheet itself, so a Fell could only ever carry things that do not exist in the game; there are fifty eight real ones. They are called utilities, by that name, and one not yet identified still shows as unknown until the LoreMaster reveals it.

Three more lines gone: the note about an innate affliction on a weapon nobody has chosen yet, the aside about the ability filter being lifted for the LoreMaster, and the Crown Aspect line, which was left behind when its Branch twin went.

## 2026-07-25 — The sheet stops explaining itself in the margins

The line reciting your creation bonuses is gone; the dials and the circles already show them. What an attribute is for is on the dial itself, on hover or a tap, rather than printed under every one, and the base value no longer announces itself. Mobility says Mobility.

Gone from the weapons: the reforging rule, the next level teaser, and the three lines about which slot unlocks when. Gone from bonds: the next level teaser and the two lines about when the Branch and Crown are chosen. Gone from armour: its next level teaser and the augmentation slot lines. The skills explanation is back behind the card's mark.

A part that is granted rather than chosen is a pill now, not a dropdown, because it was never the player's to pick from a list: afflictions, infusions, abilities, augmentations, a bond's Aspect and its Form, and each armour stance tier. Pressing one says what it does. The LoreMaster can still set it from the same window, since somebody has to be able to put it right.

With no armour there is nothing on the card but how armour is come by. The LoreMaster keeps one way to grant it, which is better than hiding the card from the only person who can fix it.

## 2026-07-25 — A thin sheet no longer breaks the sheet

Opening a Fell replaced the whole sheet with whatever was stored, and the attributes, skills and counters were only ever laid onto the sheet the page started with. A Fell saved thin, as one made for someone at the table was, arrived with no attributes at all, so drawing the dials reached into nothing and stopped. Everything after it in the same breath was abandoned, which is why the attributes were missing, why the crystals read as nonsense, and why the mark on a card did nothing when pressed: the wiring never ran. Every sheet is now given its full shape on the way in, whatever was stored, and a Fell made for the table is written out in full to begin with.

The mark is round, and pressing it opens the words in a window rather than trusting a class to reach the right paragraph.

The explanations on the Invested Lore counters are behind that mark now, along with the rest. The hint about tapping the circle for a portrait is gone, as is the line spelling out what the vow asks: the mark is what those were for.

Two are deliberately still spoken aloud. The skills card explains itself, because that one is worth reading while playing. And with no weapon in hand, how a weapon is taken up is the only useful thing the card can say, so it says it, and steps back behind the mark once there is a weapon to look at.

## 2026-07-25 — The sheet says less and answers when asked

Every card's explanation is folded behind its own name. A mark beside the title tells a desktop what the card is for on hover and opens it for anything else, on every tab: invested lore, attributes, mobility, vitality, the dice, acts and reacts, weapons, armor, stances, bonds, skills and inventory. The sheet is for playing from, and the rules now wait until they are wanted.

The living notes are untouched. A line that reports how much lore is banked, or that there is no armor yet, is not an explanation and still says so plainly.

The vow keeps its name on the sheet and hands over the rest when asked: which three skills it wants, how far each has come, and what claiming the Title grants. Character Level is simply Level. Titles keep out of sight until one is earned, and now that they are shown at all they are filled from what has actually been claimed.

Feedback is a quiet line at the foot of the sheet with a small mark beside it, rather than a slab across the width of it.

The flash on opening Settings is gone. The art behind the table is chosen by which plaque on the rail is lit, and Settings is on no plaque, so it fell through to the plain table and had to fetch it. A place with no art of its own keeps whatever is already showing.

## 2026-07-25 — Shelves belong to the member, not to one browser

How you keep your maps and tokens follows you now. The folders and the order they sit in were held in whichever browser made them, so the same account met different shelves on a phone and on a desktop. They belong to the member, like the art they file: read when the table opens, written whenever a folder is made, renamed, removed or moved.

The browser's own copy is kept as the quick one, so a shelf still draws at once and still works with nothing behind it. The account is what settles a disagreement. An account with nothing saved yet is given whatever this browser already knew, so nobody's shelves are lost on the way in.

They stay at the account and not on the adventure, because the maps and tokens are the account's too: an adventure that carried its own folders would meet its own art filed nowhere. When an adventure is exported it can carry a copy of the arrangement with it, which is the right place for that to happen.

## 2026-07-25 — Cards read across, tokens keep their own folders, Settings opens finished

A foe or an NPC in the Library shows its picture square at the left of its name, rather than as a band across the top of the card. More of them fit on a screen and the name is the first thing read.

The token shelf keeps its own folders. One list of folder names served both shelves, so every folder made for maps stood empty among the tokens, which is the clutter nobody had added. The folders already made are handed to the maps, since that is what their names were for, and a folder holding tokens still shows among the tokens because that is read from the tokens themselves.

Settings opens on its finished face. It had asked the site for your other adventures on the way in and put up a line about looking for them, then replaced itself when they arrived, which read as one screen flashing past another. The asking happens when the table opens instead.

## 2026-07-25 — A stage keeps its place, and the Fell list shows faces

Reordering the stages holds through a reload. Their order had lived only in the open tool, so the shelf came back in whatever order the account happened to hand the stages over. A stage now carries its own place and is put back in it. A stage that has never been moved keeps its name's order, so nothing shuffles on the first load after this.

Along the way, the same old trap: the row a stage arrives in was being rebuilt field by field, and a field left out of that rebuilding is a field that quietly stops arriving. The place in the shelf was one such field.

The Fell list shows each Fell's face, half again as large, ringed in gold. The rows carry no picture of their own, so the faces are found where a token finds them, and the hooded figure stands in for a Fell that has none.

## 2026-07-25 — Shelves you can arrange, and a stage given several faces at once

Folders can be put in the order you want them. They had fallen alphabetically, which is no help when the bridge should come before the barrow. Arrows on each folder move it among the folders beside it, a folder inside a folder stays inside it however its neighbours are arranged, and the order is remembered. Maps and tokens both.

A map or token can be filed without dragging. Aiming a card at a strip of text is a game of darts on a phone, so each one now carries a mark that asks where it should live and puts it there. Dragging still works for anyone who prefers it.

A stage can be given several maps in one go. The shelf stays open and each map taken drops out of the list, rather than closing after every single one and making you open it again for the next face of the same place.

## 2026-07-25 — A map or token knows which adventure it was made for

Art made while an adventure is open is stamped with that adventure, the way a foe already is. It is stamped at the single place every save passes through, so no part of the tool has to remember and none can forget, and it is carried back on the shelves so the stamp can be seen rather than assumed. The seams say how much of the saved art bears it.

Nothing is hidden by this. A map or token still belongs to the account and still appears on every shelf; it simply also knows where it came from. That is what an export needs in order to take the right things with it.

## 2026-07-25 — The token shelf reads like the map shelf

A folder inside a folder is shown as one, sitting under its parent and wearing its own name, instead of every folder spelling out its whole descent along the top of the shelf. Two rows reading Kwuhara and Kwuhara/Sarn Bridge were one folder and the folder inside it all along. The map shelf has always drawn them this way; the token shelf now does the same, and gains the same mark for making a folder within a folder.

The rename and remove marks on a saved token sit proud of its corner in gold, at a size a thumb can find. They had been small, faint, and laid over the picture itself.

## 2026-07-25 — Saved tokens can be named and removed, and stages hold their order

The rename and remove marks on a saved token are always there now. They had been waiting for a pointer to hover over them, which on a phone never happens, so on the device most of this is used they did not exist. A token just uploaded also knows its own record at once, rather than only after the shelf is loaded again, so it can be named or removed the moment it arrives.

Dragging a stage reorders the shelf. The drag had been working all along and rearranging the scene's own list of stages, which nothing has read since stages were set loose from scenes. It moves the stage where the shelf actually looks.

## 2026-07-25 — Tokens: names back, squares true, and a Fell's token in its player's hand

The names are back under the tokens. Keeping the picture inside the circle had been done by clipping everything outside it, and the name hangs below the circle, so it was clipped away with the rest. The round rim keeps the picture in on its own.

Tokens sit in the middle of a square at any cell size now. The grid is drawn on a sheet that begins far above and left of the map so it can run past every edge, and its lines were counted from there rather than from the map's own corner. They only fell where a token snaps when the cell size happened to divide that distance evenly, which at a hundred it does and at ninety it does not. The lines now start at the map's corner, where the snapping always thought they were.

Snap can be turned off. Under Settings it reads To the grid or Anywhere, and the choice is remembered.

A Fell's token is its player's to move. The token was carrying the scene's own note of that Fell rather than the Fell's record, so nothing on the player's table could recognise it as theirs and clicking it did nothing at all. It carries the record now, and a token laid down before this is still known by its name.

## 2026-07-25 — Tokens: their own names, their own squares, their own players

The name box on a token holds the name. It was showing the single letter a faceless token wears in place of a face, which is not a name and was never meant to be typed over.

A token sits in the middle of a square, and stays there when the squares change size. One laid down lands in the middle of a square too, rather than at whatever pixel the map's centre happens to be.

The LoreMaster can press Delete on a chosen token.

A Fell's own token answers to its own player now. It carries the gold rim on that player's table so they can see which one is theirs, and they can move it. A token the table itself owns, a foe or anything the LoreMaster set out, stays the LoreMaster's alone.

The picture fills the circle once. It had been tiling around itself, because nothing told it not to repeat, and it ran under the dark rim rather than stopping at it. The rim stays; it was the one part that looked right.

## 2026-07-25 — The hooded figure stands in until a face is given

Nothing shows up blank and nothing wears the last face looked at. A token, a foe, a name speaking in the story and the LoreMaster all default to the hooded figure until given a portrait of their own, and the LoreMaster can replace any of them whenever they like.

The borrowed face was a real fault, not only an empty one. Opening a Fell repainted the portrait when there was one to paint and did nothing when there was not, so the Fell opened before it stayed on screen and passed for this one's face. A new Fell was the same story. The portrait is painted every time now, the figure when there is nothing else, so what is on screen is always this Fell's own.

Only the screen defaults. A Fell with no portrait still has no portrait in its record, so the day it gets one, nothing has to be undone.

## 2026-07-25 — Weapon ranges set to the 5, 10, 15 scale

Every weapon's range now sits on one scale. Melee and the first rung of each tree reach 5. Spear, Rod, Amulet and Scroll reach 10. Crossbow, Staff, Orb and Grimoire reach 15. Twenty two of the twenty seven changed, and the bows came down hardest, from ten, twenty and thirty to five, ten and fifteen.

The figures were kept in four places that nothing held together: the nested source the sheet is baked from, the flattened seed the site's collection is filled from, the sheet's own baked block, and a table inside SigilForge that the canon gate did not know about. All four are set from one list, and SigilForge is now named in the gate's weapons entry, so the next hand that changes one of them will be told about the rest.

## 2026-07-25 — ThreadSpire: the runner holds still, and the road goes on

Dragging the scene runner no longer drags the page with it, in any direction. The beat's own words still scroll inside their card, which is the one place a drag is meant to move anything.

At the last beat of a scene the forward arrow takes the light and leads on, to the next scene of this session or the first of the session after it. It appears even for a scene of a single beat, where before there was no arrow at all and no way onward but the Story tab.

The players sitting at the table without a device, added in FateWell before there was a record for them to share, are handed over now. Anything the table already knows is matched first, so nobody is made twice, and a player is only dropped from FateWell's roster once the account has confirmed them and then lost them, never on a moment's silence.

## 2026-07-25 — A player at the table is one Fell, wherever you add them

FateWell and the table each kept their own list of the players sitting at the table without a device, so one added in either place was invisible in the other. There is one record now and both tools work on it. Add someone in FateWell and they are at the table; add them at the table and they appear on FateWell's roster, named the same, at the same level, with the same vitality. Remove them in either and they are gone from both, and their Fell goes with them, since the table made it and no player owns it.

FateWell run on its own still keeps such a player to itself, as it must, and hands them over the next time it is open on the site.

## 2026-07-25 — ThreadSpire: tokens drawn at the size they are seen

A token's face no longer softens as the table pulls back. Tokens were being drawn on the same layer as the map, which the board scales as a whole: each token was painted once at its size on the board and then that painting was shrunk along with everything else, so what reached the eye was a small copy of a large picture rather than a small picture. Sharpening the source could not help, because the loss happened after.

Tokens now sit on a layer the board never scales, laid out at the size they are actually seen and positioned by the camera. Each is painted once, at that size, and stays sharp at any distance. Their names sharpen with them.

## 2026-07-25 — ThreadSpire: settings in the corner, and faces that stay sharp

The grid's nudges are gone. It begins at the map's own corner and a token sits in the middle of its cell, so the two are always in step and there is nothing to line up by hand. What remains is cell size, fade and inset, under a panel now called Settings, moved to the top left corner with a mark to close it, and reached from the runner bar or from Settings.

A token's face no longer turns to mush as it shrinks. A portrait is many times larger than the circle it is drawn in, and the picture was being squeezed into the circle and then shrunk again with the whole board, two reductions in a row. Each picture is now drawn down once, cleanly, to a size a token can use, and that is what the table shows. The seams say how many were sharpened, since a picture served without leave to read it back has to be shown as it came.

## 2026-07-25 — ThreadSpire: the runner bar carries the map, not the scene's name

The scene's name is gone from the runner bar. Scenes are chosen in Story, and naming the same scene twice on one screen was the waste. In its place is the map itself: cell size, offsets, fade and inset, where a LoreMaster reaches for them while running the table.

Those controls had not been lost, only orphaned. The panel holding the only way to open them was unreachable code: a newer settings body answered first, so the older one sat there looking alive while nothing could ever run it. The orphan is gone and the controls are reached from the runner bar and from Settings under The map. The clean view and full screen the same panel promised are back beside them, having lived only on the H and F keys.

## 2026-07-25 — ThreadSpire: the map covers the whole frame

The map now fills the table edge to edge. Holding the play area short of the right menu meant the picture only had to reach as far as the menu began, so the felt showed in the strip between the two. Blue hidden behind the menu art is no matter; blue on the table is. The map covers the frame entirely, and what runs past an edge is out of sight rather than short of it.

## 2026-07-25 — ThreadSpire: stages stand alone, and the map fills the frame

Stages are no longer summoned by scenes. Visiting a scene used to conjure a stage to go with it, which is why the shelf filled with copies of the same place. A stage is the LoreMaster's to make now, deliberately, and the deck shows every stage the adventure holds rather than only the ones a scene had gathered. The active stage is the adventure's, kept in one place. Old duplicates already saved can be removed from the shelf and will not come back.

The map fills the open table for real now. The cover it was meant to hold was worked out but never applied on a plain load, so the picture sat below it and the felt showed at the sides. It is enforced whenever a map is laid down, so a tall map and a wide one both cover the frame and the only thing past an edge is behind the menu art.

## 2026-07-25 — ThreadSpire: the map covers the frame, whatever its shape

No blue shows around the map now. The table was carrying a made-up size for every map, a wide default, so a tall picture was treated as though it were wide and left bare at its sides. The board reads the picture's true shape from the picture itself when it is laid down, so the fill fits a tall map and a wide one alike, and the map always covers the open table. What runs off an edge is behind the menu art, out of sight, not blue on the felt.

## 2026-07-25 — ThreadSpire: token polish and a map that stays in its frame

A token on the map wears its whole name now, read from the sheet the tables hold, so it is the Fell's name and not a single letter, and it stays right if the Fell is renamed. A saved token can be renamed or removed from the shelf, from the token itself; a foe or Fell chip cannot, since its name and life are its record's to keep. Clicking the dim area around the token shelf or the map shelf closes it, the same as tapping the map already did.

The map holds its frame. It zooms out only as far as it still fills the open table, by width or by height, whichever fills first, so the blue never shows around a shrunken image. It can be dragged up and down and side to side, but not past its own edges. The open table ends where the right menu begins, so the map fills to there and no longer hides beneath the ornate rail. All of this follows the window as it resizes and the stage as it lays a new map.

## 2026-07-25 — FellGlass: a portrait is stored, not baked

A Fell's portrait was kept in the record as the picture itself, encoded, which is why it was too heavy to share with the table and could not travel to another device. It is uploaded once to stored media on save now and kept as a plain address from then on, exactly as a foe's art, a lorebound's, a relic's and every other picture in the forge already is. The first time a Fell is saved, its portrait is converted and never carried as bytes again.

This is the lasting fix beneath the earlier one. The registry that finds a portrait on each side still stands for any Fell not yet saved since the change, and quietly stops mattering as each is saved and its picture becomes an address that travels on its own.

## 2026-07-25 — ThreadSpire: portraits kept where the roster cannot wipe them

The pictures vanished on reload because the only place they lived was the roster, and the roster is rebuilt constantly and carries no pictures. Every refresh, the boot load brought the portraits, and the first roster refresh wrote over them with rows that had none.

Portraits and foe art now live in their own keeping, filled by every source that has a picture and cleared by nothing. A Fell's portrait is found there by its charId on whichever side is painting, a foe's art by its id, so a token shows its face on both tables and keeps it through a reload. The written adventure now drops only the heavy per-Fell portraits it can shed safely, since the far side finds those for itself; foe art stays, because there are few foes and the players have no other way to see them.

The seams show what is known: how many Fell portraits and foe pictures are held, and whether the first token found its art or fell back to letters.

The lasting fix is still to upload portraits to stored addresses in FellGlass rather than bake them into the record, which would let a picture travel anywhere without being found again on each side. This makes them work now, and correctly, without waiting for that.

## 2026-07-25 — ThreadSpire: portraits found, not carried

The seams named both of the last faults at once. A Fell reached the players as its letters because its portrait was a picture baked into the record as encoded bytes, which cannot travel to another device and was stripped in transit. And the story would not push at all, refused for size, because those same baked-in pictures, one per foe and speaker, put it over the ceiling.

Both are the same mistake, and the fix is the same. A picture is found on each side rather than sent to it. A Fell token shows the portrait from the party sheet both tables already hold; a foe token shows the art from the scene. The token carries only a name and a reference, and the story travels with its pictures stripped, so it fits through the door and the players receive the scenes, the stages and the names that were missing.

The seams already showed this, in the words LOCAL, will not travel and the failed story push. That is what the panel is for.

## 2026-07-25 — ThreadSpire: a map lands on the stage, not beside it

Picking a map from the shelf changes the face of the stage you are on now, and keeps its tokens, instead of laying a bare map the stage system did not know about. That bare map is why the stage vanished: the next stage save or restore wrote over a background nothing was tracking. A map now belongs to the stage that holds it, the way it always should have, and if there is no stage yet, choosing a map makes one.

The seams say more about tokens now, so a token that is not reaching the players can be read rather than guessed: how many are on the table, how many carry a real stored picture, and how many hold a picture that lives only on this device and cannot travel. The first token is named with which of those it is, and the active stage is shown.

## 2026-07-25 — ThreadSpire: the map button works, and a placed token shows itself

Choosing a map from the Maps shelf sets it now. It found the map and then did nothing with it, which is why the shelf looked dead while stage faces worked: the stage path set the scene's background and the shelf never did. It sets it, sizes the table to it, and sends it out, the same as a stage face.

Placing a token used to happen behind the palette, which covers the whole map, so there was no sign it worked until the palette was closed. Placing now closes the palette and the new token flashes where it landed.

A token uploaded at the table now reaches the players as its picture. It is a local picture until it is stored, and a local picture cannot travel to another device, so the token first arrives as its letters and becomes the picture the moment the upload is saved.

The table syncs a little quicker: the feed runs a touch more often, and an accepted push pulls once straight after rather than waiting for the next beat.

## 2026-07-24 — ThreadSpire: the story travels alone

The first push always carried the whole written adventure, because nothing had ever been marked delivered. If the story alone is over what the site will carry, every push fails on its account, the marker never sets, and the table is exactly where it was: nothing syncs, forever, with the story to blame and no one saying so.

The story travels by itself now. The frequent push carries only the light state: map, tokens, log, mode. The story goes separately, once per change, after a light push has proven the door works. The site keeps whatever it was last given, so a push about one thing no longer erases the others. And a story too large to carry blocks only itself, says so in the log with its size, and lets the map, tokens and log keep travelling.

The seams gained a Story push line: delivered, waiting, or too large, with the weight in KB.

## 2026-07-24 — ThreadSpire: the snapshot fits through the door

The seams named it on their first reading: every push the LoreMaster ever made was refused for size, so the shared state row was never written at all, and the players pulled faithfully from a row that did not exist. Nothing was wrong with the pipeline. The bag was too big for the door.

Three things made it heavy and all three are lighter. A picture held only on this device rode as a wall of encoded bytes inside its token; only stored addresses travel now, and such a token shows its letters at the table until its art is on the account. The whole adventure rode on every push; it rides only when it has changed, and the site keeps the last one it was given so a player joining late still receives it. The log rides shorter.

The seams now show the size of each push beside its fate, so the next time something oversized creeps in it is a number on a panel rather than a mystery.

## 2026-07-24 — ThreadSpire: the seams are visible

Every failure in the shared state pipeline was silent, which is why a broken link could only be found by guessing at it, one wrong guess per round. Both ends are now instrumented and there is a panel to read them: Show the seams, in Settings for the LoreMaster and in the menu for a player. It says the role, the adventure, the last push and whether it was taken, the last pull and what it brought, the map and its picture, the tokens. When two tables disagree, open it on both and compare lines: the wrong number names the broken side, and nobody has to guess.

A push the site refuses is also said in the log now, once every thirty seconds at most: the table did not take that change, and the players may not be seeing what you see. Quiet splitting is the worst kind.

## 2026-07-24 — ThreadSpire: the map the LoreMaster sets is a map the players are given

The map never reached anyone because it was never sent. Setting a map wrote it onto the LoreMaster's own screen through the one function that means this is now true of the table, and that function drew the screen and stopped there. Only tokens and the log ever left for the server. So every fix to how a player receives a map was a fix to a road nothing travelled. The function says it outward now, for the LoreMaster, coalesced so a flurry of small changes is one message rather than a storm.

Opening one Fell after another is quick now. The record is kept from the first time it is opened, so coming back to a Fell lights the sheet from memory at once and checks for changes quietly behind it. Only a Fell not yet seen this session waits, and only that one shows the label.

## 2026-07-24 — ThreadSpire: a player arrives at the adventure their Fell is in

The map was reaching nobody because the players were sitting at no adventure at all. A player comes to the table through their Fell, and the table learned which adventure it was in only from the address, which the way in does not carry. So the table asked the site for the state of nothing, and nothing is what it got: no map, no scene, no battle. It asks the Fell now, and the Fell's record has always known.

The adventure is shown on the sheet and no longer chosen there. It is set when the LoreMaster brings a Fell into an adventure, which is the only place that ever meant anything, and a Fell that claimed to be somewhere its record disagreed with was a Fell that received nothing. Campaign is called Adventure throughout. Leaving is its own choice, under the name: the Fell stays yours and the LoreMaster can bring you back.

The beat reads through to the table now, like the bar above it.

Opening one Fell after another says whose is coming instead of leaving the last one on screen looking like the new one.

## 2026-07-24 — ThreadSpire: the map reaches the table

A map set by the LoreMaster now appears on everyone's table. It was being sent as a name from the LoreMaster's own shelf, and nobody else has that shelf, so every player was handed the name of a picture they had no way to find. The picture's address travels with the name, and a player's table keeps it so the ordinary painter can find it like any other map.

A map arriving at the same moment as a change of scene was also being written onto the scene being left, and went with it. It waits for the scene to settle now.

The scene runner holds still. The reader is a fixed height, up to half the page, so the bar above it sits on the same line whatever the beat says, and long read-aloud scrolls inside the card rather than moving the runner about. The scrollbar is visible enough to take hold of.

The pause when a Fell is first opened is gone. The sheet is a whole tool in a frame and it was not fetched until the moment it was wanted. It waits out of sight from a second or so after the table opens.

## 2026-07-24 — ThreadSpire: battle takes the table again

When battle begins, every player at the adventure is pulled into it, the way FateWell always did it. The edge of their screen burns red and the battle is put in front of them, wherever they were and whatever they had open. Their sheet then loads, finds its own name among the fighters, and takes over with its declares. When the battle ends, the edge glows gold and the table is theirs again.

Two things had broken this. The sheet refuses a battle whose fighters list does not name its own Fell, and the table was publishing no fighters at all, so every sheet that asked was told the fight had nothing to do with them. And inside ThreadSpire a player's sheet does not exist until they open it, so nothing was even asking. The table itself now watches for the battle in the state it already receives, and the published state names every fighter: every foe at the scene, and every player at the adventure.

The published state also carries the scene's name and the recent log, so the sheet's combat panel has words in it rather than blanks.

## 2026-07-24 — ThreadSpire: choosing several, and a pill that holds its words

An opened Fell lands on Lore, which is where you look first.

The library can be worked in handfuls. Select turns the shelf into a chooser, All takes exactly what is on screen and nothing behind it, and Delete takes the lot at once with the names read back before it happens. Because All means what is on screen, narrowing by search or changing between this adventure and the saved collection narrows what All will take.

The minimized runner is a pill again. Its label was a button, and a button inside a button is not allowed, so the browser closed the pill early and left a bare circle with the scene name spilled out beneath it. The pill takes plain words now, and a long scene name is cut short rather than breaking the shape.

## 2026-07-24 — ThreadSpire: a Fell the table keeps is not a loremaster

Every Fell whose record the adventure's own account holds was wearing the loremaster's badge, because a roster line took its role from whoever owns the record rather than from a player sitting at the table. There is no player behind those Fell, so there was no role to show and nothing to promote. Setting one to player appeared to work and the badge went back the moment the list was fetched again, since the owner test won every time.

Such a Fell now says it is at the table, and is not offered a role, because the account it would have changed is the loremaster's own.

Removing one of them removes the Fell, which is what it means when the table is holding it for someone. A Fell with a player behind it is still released rather than destroyed.

## 2026-07-24 — ThreadSpire: someone at the table, and a roster that answers

The bar over an opened Fell leads with Lore where the name used to sit, since the name is already on the sheet, and Arsenal is called Weapons, which is what it holds.

A player with no device can be given a Fell here. It is a real Fell with a real sheet, kept by the adventure rather than owned by anyone, so the LoreMaster fills it in and runs it through the same sheet everyone else uses. Invite a player is now Add a player, and asks which of the two you mean.

The mark beside a Fell opens on something now. It did nothing for a Fell made at the table, because it went looking for a member who was never there. It finds the Fell instead, and offers to open it, to hand the lorekeeper's keys to a player or take them back, to release a Fell from the adventure, and to remove someone from the adventure altogether.

Removing a player takes their seat and lets their Fell go rather than destroying it, because the Fell is theirs. A Fell made at the table has nobody to give it back to, so that one goes with them. The loremaster of an adventure cannot be removed from it.

## 2026-07-24 — ThreadSpire: the LoreMaster's hand on a Fell

Open a Fell from the Fell tab and it opens as its own sheet, the same one the player uses, with the locks off. Attributes, Skills, Arsenal, Lorebounds, Armor, Inventory and Lore are all there as tabs, and a Fell button at the left goes back to the party. Closing the window puts the Fell down.

Nothing is reimplemented. The panels are FellGlass's own, reached the way the player reaches them, so what the sheet learns the LoreMaster inherits.

Whether a LoreMaster may touch a Fell is decided by the site, not by the tool. The Fell's own record says which adventure it belongs to, and the site checks the caller runs that adventure before handing anything over or writing anything back. A Fell from another table cannot be opened, whatever the tool asks for. The owner and the adventure on a Fell stay the player's; the LoreMaster changes what is on the sheet, not whose it is.

## 2026-07-24 — ThreadSpire: an answer about the adventure you left is not news

The table asks the site for the state of the adventure every second and a half. A question asked just before changing adventure comes back just after it, holding the old adventure, and the table believed it. That is where the other adventure's stages kept coming from, and why a second Lobby appeared beside the first: the old one arrived as truth, and the new adventure went and made its own.

Both directions now name the adventure they are about. An answer about the one you left is dropped, and a write sent before the change is refused rather than landing on the new adventure.

A stage has to carry this adventure's mark to be dealt onto the deck. Letting an unmarked one through was meant to be kind to older rows and instead put one adventure's tables on every other adventure.

The Lobby is one particular stage now, not any stage that happens to be called Lobby. That is why two of them could not be removed: both answered to the name, so both were protected. The adventure's own Lobby stays; a duplicate can be sent away like anything else.

## 2026-07-24 — ThreadSpire: fetch the new adventure's things when you arrive

The library came up empty after changing adventure. The table put the library down on the way out, as it should, but kept the note saying the library had already been fetched, so nothing ever went back for it. The tab was reading an empty hand.

The stages went the same way, for a plainer reason: everything an adventure needs was fetched once when the page opened, which was right while changing adventure meant opening the page again. It has not meant that since the switch started happening in place, so the new adventure arrived and nobody went to get its stages, its journal or its quests.

Arriving at an adventure now fetches its things, the same way opening the page does.

## 2026-07-24 — ThreadSpire: one asking is enough

Choosing an adventure from the list and pressing the button opens it. The confirmation after that asked the same question a second time and protected nothing: the table saves on the way out and the one you left is still there to come back to.

Still here has stopped appearing after switches that worked. It was asking whether the veil existed rather than whether it was showing, and the veil is built once and reused, so the answer was always yes.

## 2026-07-24 — ThreadSpire: nothing between adventures

The scene that flashed at the start, The Silent Beacon with its notes and its foe, is the demo baked into the tool for working on it outside the site. Inside the site it was one flash of an adventure nobody wrote before the real one landed, and one push away from being written over the real one. Inside the site the table now boots empty and stays behind the veil until the true adventure arrives. The demo remains for the workbench, where it belongs.

The push that could destroy a table is gated. Between adventures nothing the table holds is true of anywhere, and a push in that window wrote the emptied state over the new adventure's stored one and then marked it as already seen, so the real state was both gone and never fetched. That is why the switch landed on a default scene instead of the prepped one. No push leaves the table while it is between adventures, and a pending one from the moment before the switch is cancelled.

The veil lifts when the new adventure's state has actually arrived, not before, so there is no glimpse of an emptied table on the way. An adventure so new it has no state yet lifts the veil after a short wait instead.

Still here no longer appears after a switch that worked. It was checking for the veil's frame, which outlives the veil.

## 2026-07-24 — ThreadSpire: the adventure changes without the page moving

Asking the site to go to the page it is already on does nothing, which is why the veil came up, the Sphere was traversed, and the same adventure was still sitting there afterwards. The page now rebinds instead of reloading. It takes the new adventure, tells the table, and every call after that reads the new one.

The table puts down what belonged to the adventure it is leaving: its stages, its scenes, its journal, its library, its log, the tokens on the map. Anything kept would arrive at the new table wearing the old one's face.

A folder on the map shelf takes a drop anywhere in it now, over the maps as well as the name. Aiming at a strip of text was a game of darts.

## 2026-07-24 — ThreadSpire: make an adventure at the table

A new adventure can be made from Settings without leaving. Give it a name and it opens here with one scene, ready to run. FateWell is still there for writing it out properly, and the button for that sits beside it.

The veil now says Traversing the Sphere, which is what is actually happening.

A map that cannot be shown is no longer filed as though it were. If the account hands back nothing, or hands back the address the picture only has on this device, the map is refused at that moment and says why, instead of sitting on the shelf as a name over an empty square. Any map already on the shelf without a picture says so on its card and asks to be uploaded again.

## 2026-07-24 — ThreadSpire: write a new adventure from the table

Settings can send you to FateWell to write a new adventure. ThreadSpire runs an adventure and does not author one, so it hands over rather than growing a second place to do the same job. The table saves on the way out, and the new adventure is waiting in the list when you come back.

The address of every tool was in the Hearth's own routing table the whole time. It is written down now, so the next thing that needs to send someone to FateWell or SagaForge can look it up instead of guessing.

## 2026-07-24 — ThreadSpire: an uploaded map keeps the address it was stored at

An uploaded map was saved to the account correctly and then went on using the address it had while it was still only a file on the device. That address belongs to the page that made it and dies with the page, so the picture was there all session and gone the moment anything reloaded, with a black square where it had been and nothing to say why.

The map now takes the stored address the moment the account has it. The shelf, the stage cards and the table all repaint when it arrives.

The account is also the record when the two disagree. A map already in hand was skipped when its row came back, which is how a dead address outlived the real one that had replaced it. The row wins now, and an address of the dead shape is retired on sight rather than left to pretend.

A map that will not draw says which kind of nothing it is: not on the shelf, never saved, or saved without a picture. A map that failed to save says so plainly at the time, and warns that it will not survive a reload.
## 2026-07-24 — ThreadSpire: stages belong to one adventure

Stages from other adventures were turning up on the deck. Two reasons, both fixed. The list of stages was fetched with whatever adventure the page happened to know, and when it knew none it fetched every stage the account owns rather than none. And the Lobby used one id for every adventure, so there was only ever one Lobby row and opening a second adventure wrote over the first one's. The adventure now travels with every stage call, is checked again on the way back, and each adventure keeps its own Lobby.

Settings leads with the adventure you are running, said plainly, and offers the rest as a list to choose from and open.

Changing adventure now shows that it is happening. The table is veiled, the adventure is named, and it stays that way until the other one opens. If the page does not move, it says so instead of leaving a veil up.

The switch also works every time rather than most of the time. Asking a page to go to the same address with a different question sometimes did not move it at all.

## 2026-07-24 — Two checks and a page of facts

ThreadSpire was never contract checked. It was missing from the list, so the tool with the most bridge calls in the project had nothing watching whether the page and the embed still agreed. It is on the list now, and the check learned a new trick along the way: a tool that hosts another tool in an iframe talks downward to it, and that is a contract too. ThreadSpire's three messages to the FellGlass sheet are now checked against FellGlass rather than against the page, which was never going to answer them.

A second check looks for a global that is read and never given a value. That is the shape of the bug that had five parts of ThreadSpire silently doing nothing all day: the combat state, the declares, the party, the published copy and the adventure list all asked a question of a flag nobody had ever set. It found one more on its first honest run, in FellGlass: an error message that would have thrown instead of appearing, on the path where you open ThreadSpire before saving a Fell.

FACTS.md holds the handful of values that cannot be worked out by reading the code and that cost real time when guessed. Page routes, where each Velo file goes, which paths write to the live CMS. It is not an architecture document on purpose; those go stale and then mislead, which is the lesson CANON_SOURCES.md already teaches.

## 2026-07-24 — ThreadSpire: the maps were never gone

Stages was not fetching the shelf. The account's maps were only ever collected when the Maps shelf itself was opened, so on a fresh load every stage looked as though its maps had vanished, when in truth they had never been asked for. Opening Stages now brings the shelf with it, and when the shelf arrives the stage cards, the picker and the table all repaint, instead of waiting for something else to redraw them.

Nothing was deleted. Open Stages after a refresh and the maps are on their cards again.

Open it now opens. The switch was sending the browser to a route guessed at rather than the page it is actually on, so the button did nothing at all. It reopens the current page instead, whatever its address.

## 2026-07-24 — ThreadSpire: five things were asking a question nobody set

Five parts of the table checked a flag that was never given a value anywhere in the file, so all five quietly did nothing: the adventure list, the published copy, the party list, the combat state going out to the players' sheets, and the declares coming back. They now ask whether ThreadSpire is running inside the site, which is the thing they were trying to establish in the first place.

The adventure switcher was the visible symptom. It said the page had not answered, when in truth it had never been asked.

Battle should be watched after this. The state going out to players and the declares coming back have not run before now, so the loop is live for the first time rather than merely wired.

## 2026-07-24 — ThreadSpire: say why the adventure list is empty

An empty list of adventures and a page that never answered looked exactly the same: This is the only adventure you run. Settings now tells them apart. While it is asking it says so, and if the page does not answer it says the page is out of date, names the file to paste, and offers to try again.

Story's link now reads Change adventure rather than Change, because the word on its own did not say what it changed.

## 2026-07-24 — ThreadSpire: change adventures without leaving the table

Settings, on the fellmark gem, now lists every adventure you run and opens any of them. The one you are in sits at the top. Story carries the adventure's name at its head with a quiet Change beside it, so the window that tells you what you are running points at the one place that changes it.

Changing adventure is a fresh start rather than a swap in place. The current stage is saved, then ThreadSpire reopens on the other adventure, which is the only honest way to do it: the adventure is read once at the door and the party, the journal, the stages and the live table all hang off it. Anyone at the table follows across.

A battle in progress blocks the change and says why. Ending a round in a table nobody is at helps no one.

## 2026-07-24 — ThreadSpire: upload a handful, find one quickly

Choosing maps for a stage now shows them under the folders they are filed in, and there is a search above the list. Searching looks across every folder at once, and matches the folder name as well as the map name, so you can find the bridge without remembering where you put it.

Maps upload several at a time. Choose a handful or drop a handful; anything that is not an image is left out and said so. When a stage asked for the upload, all of them join that stage, and the table only changes if the stage had no map to begin with.

The log says what landed rather than narrating each file.

## 2026-07-24 — ThreadSpire: the stage card, rebuilt

The card was one horizontal row, and the strip of maps was dropped into it as another item in that row. The title lost the fight for width and came out a word per line, the meta line broke apart, and the thumbnails landed wherever there was room.

The card now reads top to bottom. A line for the stage: its name, whether it is the table in front of the party, and what is standing on it. Then the faces it can wear, as a proper row of thumbnails, each captioned with the map's name, the one on the table wearing a gold rim. The old lone thumbnail is gone, because the faces are the picture now and two pictures of the same map on one card is one too many.

Taking a map off a stage is a small mark that appears on the thumbnail you are pointing at, rather than a button sitting over the artwork at all times.

An empty stage says so plainly and offers Add a map rather than a bare plus.

## 2026-07-24 — ThreadSpire: a stage holds its own maps

A stage keeps a row of maps on its card in the Stages window, with a plus on the end. Add the bridge whole, the bridge broken, the bridge under fog. Tap one to lay it down. Every token stays exactly where it stands, and so does the grid and the size of the table.

The maps belong to the stage. There is no name to type and no shared record to keep in step, so putting a face on one stage cannot touch another stage that shows the same place. That was the problem with the last two attempts at this: both of them linked maps through something outside the stage, which meant a slip could rewrite the arrangement everywhere at once.

Adding a map offers what is already on your shelf, or takes an upload straight onto the stage without changing what the party is currently looking at. Taking one off a stage leaves it on the shelf. The map groups added yesterday are gone, along with the strip of faces under the frame, since the stage card is where this belongs.

Stages carry a new field for the list. The schema was backed up first.

## 2026-07-24 — ThreadSpire: map groups

Maps that are faces of one place now share a group. The group is a name you type on the map, The Bridge or The Bailey Gate or whatever the place is called, and every map carrying that name is a face of it. Folders stay what they were, a way to tidy the shelf.

There is no original and no copies. The maps in a group are peers, so renaming one, refiling one or removing one leaves the rest of the group standing.

The shelf shows a group as one card, because choosing a map means choosing a place. Show every face lays them all out again when you want to rename or refile one.

Lay any face of a group on a stage and the group appears as a strip under the frame, named, with a chip for each face. One tap changes what everyone at the table is looking at. The stage keeps its tokens, its grid and its size, which is the point of the whole thing.

Faces of a different size to the one on the table still group, and say so when you hover them, rather than being refused.

## 2026-07-24 — ThreadSpire: folders that nest, and a shelf that shuts

A folder made on the map shelf now appears. It was being made all along and then skipped at the paint, because a folder with nothing in it was not drawn, so there was nowhere to drop the first map and the New folder button looked dead.

Folders hold folders. Valoria can hold The Bridge, and the shelf reads the tree off the paths themselves rather than keeping a second record of what contains what. Each heading folds away with its whole branch, carries a count of everything beneath it, and has a plus for making a folder inside it. Renaming a folder moves the branch with it. Removing one drops what was inside into the folder above rather than all the way out to the shelf.

Tapping the dark outside the map shelf puts it away.

## 2026-07-24 — ThreadSpire: one place, several faces

A map can now be filed as a face of another map. A bridge, the same bridge broken, the same bridge under fog: one place on the shelf, several faces, and the LoreMaster names each face. Nothing is inferred from a file name.

The family belongs to the map, so a face authored once is available to every stage that lays that map down. Which face is showing belongs to the stage. Changing the face leaves the tokens, the grid and the size of the table exactly as they were, which is the whole point of it.

When the map on the table has more than one face, a strip of them sits under the frame for the LoreMaster. One tap changes what everyone is looking at, and the log says so, because art that changes in silence reads as a fault.

Faces of one place have to share a size. A mismatch is refused when the face is filed, with the reason, rather than discovered mid scene when every token has slid against the art.

Assets carries two new fields, variantOf and variantLabel. The schema was backed up first.

## 2026-07-23 — ThreadSpire: a removed stage stays removed through a reload, and the table closes a window

The X removes a stage outright now. The confirmation step is gone; the button is the decision.

Removal used to be remembered only for as long as the page stayed open, so a refresh forgot every removal and the arrangement arriving from the table put the stage straight back. The note of what was removed now travels with the table state and is kept in the browser as well, so a stage stays gone across a reload and across the other seats. A stage that was removed before its record reached the account is cleared the next time the deck loads, which sweeps the ones already stuck there.

Tapping the table behind an open window closes it. The rails, the HUD, the log and any dialog keep their own handling.

## 2026-07-23 — ThreadSpire: remove the duplicated block that shadowed every stage fix

A previous edit inserted its rewritten stage section instead of replacing the old one, leaving 2,178 dead lines: a byte-identical copy of an earlier 2,004 line span, plus the pre-rework stage functions. Later definitions win in a script, so the stale copies of all 17 stage functions shadowed the adventure-wide delete and the tombstone fix. Stage deletion fired the old guard and deleted stages resurfaced on the next snapshot. Removed lines 3516 to 5693 in one cut, verified the defined-function set is identical before and after, and confirmed the tombstone lmDeleteStage is now the only definition. No behavior added; the fixes already merged now actually run.

## ThreadSpire: a removed stage stays removed, and the deck stops collecting dust

- Removing a stage sticks now. The table keeps a note of what was removed, because the arrangement arriving from the table a moment later still carried it and quietly put it back, which is why the card never left. Scenes that hold no stages no longer leave an empty entry behind either, so the deck stops accumulating one for every scene ever opened.

## ThreadSpire: removing a stage removes it

- A stage now goes for good when you remove it, taking it off every scene that held it and out of the account, with a word first about what is being lost. It had only been unpinning the stage from the scene you were on, and refusing to let go of it entirely while any other scene still held it, so it stayed in the list and looked as though nothing had happened.

## ThreadSpire: every stage is the adventure's, not one scene's

- Stages were being saved all along; they were tied to whichever scene happened to be open when they were made, so opening another scene left them behind and the deck looked empty but for the Lobby. The window now shows every stage the adventure holds, and switching to one attaches it to the scene you are on. A stage saved without a name reads as untitled rather than as a blank card, and each card's own buttons keep their presses to themselves.

## ThreadSpire: stages hold, and the maps open quickly

- A stage's own buttons work again. The whole card had been made draggable, and a draggable card swallows the presses inside it, so rename and the rest did nothing; only a grip drags now. Stage work also marks itself as yours, so a table update arriving a moment later can no longer put the old deck back over what you just did. Opening Maps was fetching every asset you own, foes and all their statistics included, to show a handful of pictures; it now asks only for the pictures, and thumbnails load as they come into view.

## ThreadSpire: stages come back

- Stages survive a reload now. They were being saved without the adventure they belong to, while the list that fetches them asks for exactly that, so every stage was written and then never found again, leaving only the Lobby that gets made fresh each time. The deck itself, which stages a scene holds and which one is up, now travels with the table state rather than being rebuilt from nothing. Renaming a stage says when it cannot find it instead of appearing to do nothing.

## ThreadSpire: stages you can name and set a map on

- A stage now carries its own controls: rename it, choose which map it lays down, or delete it. Choosing the map is explicit rather than guessed, and the stage remembers it, so returning to a stage brings its map back with it. The placeholder maps are gone from the shelf, so what you see there is what you put there. Token folders can be renamed, removed and folded away, they carry a count, and the tokens themselves drag into them properly now.

## ThreadSpire: maps that stay, stages you can order

- Uploaded maps save properly now. A full size battle map runs to many megabytes once encoded, and the upload was giving out quietly, leaving the map alive only until the page reloaded; images are drawn down to a sensible size before they go up. Maps and tokens coming back from your account now carry their own identity and folder, so filing, renaming and removing reach them rather than doing nothing. Stages can be dragged into whatever order you want them in, and long names cut off cleanly instead of sprawling.

## ThreadSpire: new folders, and drag to file

- Maps and saved tokens both take folders now. A folder is made with a press and stands empty until something is put in it, and an image is filed by dragging it onto a folder heading, or back out onto Loose. Removing a folder leaves everything in it on the shelf.

## ThreadSpire: the shelf of maps takes folders

- Maps are the LoreMaster's own, across every adventure, and can now be put into folders. A folder is made by naming one, renamed in place, and removed without touching what is in it; the maps simply come back out loose. The picker groups by folder and keeps the loose ones together at the end.

## ThreadSpire: search the library, tend the maps, keep the Lobby

- The library has a search at the top. Maps are treated as what they are, images on the LoreMaster's shelf: each can be renamed or removed from the picker, and a map still on the table has to be replaced before it can go. Every table now keeps a Lobby, the blue parchment the party gathers on before a map is laid down; it is always the first stage and it says so rather than going quietly when someone tries to remove it.

## Canon: the gate understands a generated concept

- The drift gate no longer asks for a hand co-change on the foe pack. A generated concept's copies are outputs of a bake, so touching them without the seed is the ordinary shape; what matters is that the bake is fresh, and the gate now enforces exactly that by re-running the generator and failing if any output moves. Hand-editing a baked file, or changing a seed without rebuilding, both fail.

## Canon: the foe pack is generated, not kept by hand

- The foe pack lived in three places at once and had drifted apart: the pack's own copies of the infusion and augmentation text had fallen behind the collections that own them, and the two tools spelled the same field differently from canon. It is now baked into both tools from the seeds by the generator, taking each part from whatever collection owns it. The bake reproduces what was already live exactly, so nothing at the table changes; what changes is that the next edit lands everywhere at once.

## ThreadSpire: the rules show on infusions and augmentations

- What an infusion or augmentation does now reads under it. The text was in the collections all along, recorded as the effect, while the tool was only looking for a rule. It now takes either, so anything the forges write shows wherever the pick appears.

## ThreadSpire: infusions and augmentations read like relics

- Infusions and augmentations are now chosen from a dropdown and listed with what each one does, the same way relics already worked. What is on a foe reads plainly with its rule beneath it, and comes off with a single press, rather than being hunted for in a grid of chips.

## Canon: the foe pack carries its per-rating budget

- The pack now also seeds how many infusions, augmentations and Acts each rating allows. The row added alongside the ratings was the Act tier ladder, which is a different thing; the budget is read straight off the ratings themselves and matches what the tools already hold.

## Canon: the foe pack seeds its ratings, infusions and augmentations

- The foe pack collection only ever held builds, stances and afflictions. Its ratings, infusions, augmentations and ability budget were never seeded, so nothing downstream could scale a foe: attributes derive from the party's level shifted by a rating's offset, and with no ratings there was nothing to shift by. All four are now seeded from the canon file that has held them all along. The three rows already there are untouched.

## ThreadSpire: quests are written as beats, and deriving explains itself

- A quest raised from the Quests window is now written into the scene as a beat rather than posted, and the window shows what is written but not yet offered separately from what is on the board. Only running the beat puts it up. Deriving a foe's kit now says what it is waiting on when it cannot, instead of appearing to do nothing, and reopening a sheet holds its place rather than jumping to the top. The forge data is fetched as soon as the LoreMaster is known, so a card opens without a wait.

## ThreadSpire: a quest beat posts from the runner

- A quest written into a scene stays prep until it is offered. Running that beat gives the LoreMaster a press to post it, which puts it on the board the players read and marks the beat as posted so it cannot go up twice. Taking the quest down again releases the beat, so it can be offered later.

## ThreadSpire: a foe's kit derives again, and the catalogue appears

- Attributes and vitality derive from a foe's build and rating against the party it faces, rather than sitting at zero, and there is a press on the card to derive them. Infusions and augmentations now offer the whole canon catalogue with anything forged since, because the foe pack was only handing over three of its kinds and keeping the rest, including the rating offsets the derivation reads. Numbers on the sheet gained plus and minus alongside the field. A quest now leaves the window the moment it is taken down.

## ThreadSpire: running a round

- A Fell's card now shows what they declared, what they rolled against, and the damage they are holding, with a single press to land it on the foe they named. Vitality comes off that foe, the table sees it, and the log records who struck whom. The same card sends a strike back the other way, sets their charges, and puts an effect on them, all reaching the player's own sheet. Beginning combat, turning the round, and ending it now announce themselves to the table and pull the declares in fresh.

## ThreadSpire: the foe card in battle

- In battle a foe's card is where the fight is tracked. Vitality moves by one or five either way, charges are set on a row of pips, and what has taken hold of it is applied and lifted from the card itself, each change logged and pushed to the table so the players see it. The rest of the card still holds what the foe is, and none of it edits from the shelf. The table also publishes whether combat is running and which round it is on, and reads back what the Fell have declared.

## ThreadSpire: quests on the scene, publishing, and clearing the shelf

- A scene now carries its quests. Raise one where it comes up and it posts to the board the players read, mark it done when they finish it, or take it down. Settings publishes the adventure to the directory and takes it down again, and shows whether it is up. A library entry can be deleted from its card, leaving the shelf everywhere while scenes already holding it keep what they have.

## ThreadSpire: the Fell tab runs the party

- The Fell tab is now the party itself. It lists everyone at the adventure with their character, their vitality, and their role, and each one opens to hand over the loremaster's seat, name a lorekeeper, set someone back to player, or release their character so it can join another adventure. An invite link can be made, copied, and revoked from the table, rather than only from FateWell.

## ThreadSpire: the rest of the foe card, and the forges behind it

- The foe card now shows the strike a foe makes, its base and bonus damage by type with what it rolls to hit, and asks the LoreMaster which way it swings when Power and Magic tie. A foe can be tied to an adventure or left on every shelf. Acts and relics can be forged from the table when the shelf has not got what a scene needs; each is saved as yours and appears wherever the tool offers them. The glossary and the adventure list are now read at the table too.

## ThreadSpire: Acts on the foe card

- A foe's Acts now come from SigilForge, the same forged shelf FateWell reads. The card lists what the foe carries with its tier and text, and Edit Acts opens the three tiers, each choosing from the Acts forged at that tier and showing what the chosen one does. Typing abilities by hand is gone for foes.

## ThreadSpire: the foe card, drawn from the forge

- A foe now opens the card FateWell gives it, and its choices come from the same collections in Wix. Build, stance, and signature affliction are picked from the canon foe pack. Infusions and augmentations are chips from the forged pools, tapped to add or drop, each carrying what it does on hover and behind its info dot. Relics are chosen from the forged shelf with their rules shown, rather than typed. The card also reads its rating against the party, showing what a foe of that rating stands at, and what it would stand at as a Forsaken.

## ThreadSpire: one sheet for a figure, on the shelf or at the table

- Opening a figure gives the same sheet whether you reach it from the library or from a scene's roster: portrait, name, description, rating or role, maximum vitality, build and stance, signature affliction, attributes, infusions, augments, inventory, and abilities, all editable in both places. Saving writes to the library and carries the change to every scene holding that figure. Vitality in play and charges are no longer on this sheet; those belong to the foe card in battle, along with effects and afflictions.

## ThreadSpire: one card, drawn the way FateWell draws it

- The library and the roster now use the same card, and that card is FateWell's: a cover portrait, the type across the top, the name, and a line beneath carrying rank and vitality, with where it came from underneath. A figure looks the same on the shelf and at the table. Roster cards add current vitality to that line and carry the remove control in the corner.

## ThreadSpire: roster removal and member sheets work, library entries open

- Removing a roster member and opening one both work now. Every identifier created at the table was a number while the same value came back from a click as text, so no lookup ever matched: the removal deleted nothing and the member sheet had nothing to open. Identifiers are now text and carry a stamp so they stay unique across reloads, and every lookup compares them as text, so older entries still match. The X removes straight away, with no confirmation. Library entries open a card showing portrait, rating, vitality, build, signature affliction, attributes, infusions, augments, inventory, abilities, and description, the same face FateWell shows.

## ThreadSpire: the adventure loads again

- The table opens the real adventure from FateWell instead of the placeholder storyline. Yesterday's guard against stale syncs was written so that the first arrival of the adventure could never pass it, so the seed stayed put. The adventure now always wins when it first arrives, and the guard only applies to later updates. Scene fields the table owns, attendance and prep among them, survive a reload instead of being dropped.

## ThreadSpire: restore the Story saver

- Story and roster actions work again. The function that saves the adventure spine had gone missing while thirteen places still called it, so removing a foe, opening a member, toggling attendance, and every Story edit failed the moment they were clicked. It is restored, and the spine now carries a revision so a returning sync cannot roll back or rebuild a newer local tree underneath an open window.

## ThreadSpire: foe edits go home to the library, and attendance updates at once

- Editing a roster member that came from the library now writes back to the library automatically, no button to press. Name, portrait, description, rating, maximum vitality, attributes, abilities, inventory, infusions, and augments all travel, and every other scene holding that foe picks up the change. Current vitality and charges stay with the scene, since those are what is happening now rather than what the foe is. The attendance toggle now updates the moment it is clicked, and reads Attending or Absent.

## ThreadSpire: edit and remove roster members

- Removing an NPC or foe from a roster now works and asks first; before, the removal happened but the open window never repainted, so it looked like nothing did. Clicking a roster member opens their sheet: portrait with upload and remove, name, description, Shatter Rating, vitality, charges, and all eight attributes, the same fields FateWell edits. Choosing a rating fills in that rating's vitality. Members added from the library stay linked, and edits made here apply to this scene.

## ThreadSpire: roster in its own window, no library flash

- The roster moves out of the scene body into its own window, opened by a Roster button at the top of the scene that shows how many are at the table, so nothing competes with the beats. The Library tab no longer shows its old layout for a moment before the real one arrives; it holds until the library is ready, and the library is fetched as soon as the LoreMaster's role is known so the tab is usually ready before it is opened.

## ThreadSpire: the library, and rosters built from it

- ThreadSpire now reads the same library FateWell authors, using the same conversion, so a foe or NPC means the same thing in both tools. The Library tab lists foes, NPCs, and items with their portraits and stats, scoped to this adventure by default with a toggle for the whole saved collection. A scene's roster can add from the library: the entry arrives with its name, portrait, rank, vitality, attributes, abilities, inventory, infusions, and augments intact, and keeps its link back to the library. Roster rows show the portrait and vitality, and a dialogue beat's speaker resolves through that same link, so one figure's art and stats follow it into the roster, the notes, and battle.

## ThreadSpire: every scene has a roster

- A scene now carries its own roster, and that roster is what the dialogue speaker list reads from. Every player is in the scene by default; the LoreMaster can mark one out when they do not join, and an absent player shows struck through. NPCs and foes can be added to a scene by name and removed again, so there is something to choose from when a dialogue beat asks who is speaking.

## ThreadSpire: beats match the FateWell editor

- Beats now carry what FateWell gives them. A dialogue beat picks its speaker from the cast at the table, and that speaker's portrait, colour, and stats attach to the beat wherever it appears; running the beat also swaps the LoreMaster's identity portrait and name to whoever is talking. Clue beats carry a handle, the short tag a Lore Check references to reveal them. Any beat can carry an image. All of it shows in the scene runner.

## ThreadSpire: beat speakers and reordering

- A dialogue beat can now name its speaker. The field appears when you pick Dialogue and suggests the foes and library figures already at the table, and the speaker shows on the beat card and in the scene runner. Beats can also be moved up and down within their scene, so the order you run them in is the order you set.

## ThreadSpire: beats own the Story, and the runner steps aside for slideouts

- Prep notes are now beats everywhere. In Story, a scene's beats show as compact color-coded cards, one line each with the kind tag; clicking a card opens it in a panel to edit its type, title, and body, or delete it, and Add a beat creates one with the full set of types. The separate table-notes feature is removed, the Journal covers that. Beats edited at the table live on the same scene the runner reads, so they show in the scene runner when the scene is run. And opening any slideout now hides the scene runner entirely, restoring it in whatever state it was in, minimized or open, when the slideout closes.

## 2026-07-21 — SagaForge story engine

- The spine now states its promises and its reversals. Three PROMISE lines (one of tone, one of arc, one of plot, each with where it pays off) and one or two TWIST lines carrying two concrete plants each. Both parse into the skeleton, ride in campaign notes, and reach every scene draft, so plants land as ordinary detail before the reversal and twists read surprising then inevitable.
- Black moment placed per size: the Tale's setback, the Story's second to last session, deep in the Legacy's final third after the false victory sours. Whatever turns the black moment was planted earlier, never new help from nowhere. Legacy finales converge at least two threads paying off in the same scene. Chronicle sessions each run a complete small arc while season promises live in the factions.
- Try and fail cadence: sessions before the climax resolve on yes but or no and, clean victories only at a false victory or the finale. Every scene shows progress or meaningful backsliding on a named promise. The antagonist moves first until the darkest turn.
- World texture rule: every session shows the world pressing on ordinary life in at least three details that could exist nowhere else, plus one unexplained detail a session, never explained. A scene that could move to another world unchanged gets rewritten.
- Foes fight through visible limits the table can learn, winnable by understanding. NPC arcs are movement: more or less capable, driven, or worthy of trust than they began.

## ThreadSpire: Story shows a scene's authored notes

- Opening a scene in Story now shows its authored notes, the beats FateWell wrote, with their kind tags, alongside any notes added at the table. Before, Story only showed table-added notes, so authored scenes looked empty even though the runner displayed them.

## ThreadSpire: LoreMaster portrait on the member record, scene notes reachable

- The LoreMaster's portrait now saves to their member row, so it follows them to any device. The Adventure Members collection gains one additive Portrait field, backed up before the change. In Story, clicking a scene now opens it to show its notes, with a run arrow beside it to make that scene the running one; before, the name only set the scene live and its notes stayed hidden. A local edit is also protected from being overwritten by an in-flight table sync.

## ThreadSpire: in-table editing for Story, notes at every level, no role flash

- Story now edits inside the table. Creating, renaming, and deleting an act, session, scene, or note opens a proper panel with a name field and a body, the same shape as the FateWell popup, instead of a browser prompt. Notes sit under acts and sessions as well as scenes. The table also paints the right side immediately now: the page tells the table which side to draw as soon as it opens, so a slow load no longer shows the player view first.

## ThreadSpire: no role flash, and Story builds the adventure spine

- The table no longer shows the player side for a moment before the LoreMaster loads; the identity column and rail stay hidden until the role is known. Story is now a working spine: acts open to sessions, sessions to scenes, scenes to their notes, with add, rename, and delete at every level and a click to set the running scene. Notes are edited in place. The spine travels with the table state, so it survives a reload.

## ThreadSpire: the LoreMaster identity rail

- The LoreMaster's tabs are now Journal, Fell, Library, Stages, Story, and Settings moves off the rail onto the fellmark gem at the bottom, which carries the same fellmark symbol the player side uses. The identity column gains its LoreMaster meanings: LP and SS on the blue gems, the red circle takes the vitality of a clicked foe, the three shapes beside it light gold with that foe's charges, the gem left of the name shows the skill difficulty step, DP sits at the bottom right, and the portrait is the LoreMaster's own, uploaded by clicking it. Name and portrait swap to whichever foe or NPC is speaking.

## ThreadSpire: fix the right-click dice menu

- The right-click menu now stays where you opened it. It was snapping back to the dice tray and closing immediately, because the cursor landing on the menu triggered the tray's hover logic. A menu opened by right-click now holds until you pick a type or click away.

## ThreadSpire: right-click to roll, pinned log bar

- Right-clicking anywhere on the map opens the dice type menu at the cursor; picking a type rolls it. Clicking elsewhere dismisses it. The log's say bar now stays pinned in place while only the log entries scroll beneath it.

## ThreadSpire/FellGlass: subtle dark-blue scrollbars

- The slideout scrollbar now matches the theme, dark blue and semi-transparent over a transparent track, instead of the browser default. The earlier rule targeted descendant scrollbars but the sheet scrolls the document itself, so it's now a global scrollbar style covering both webkit and Firefox.

## ThreadSpire: player combat, step 1 (real battle panel + entry)

- The player's combat now opens the real FellGlass battle panel through the seam instead of a placeholder. Battle is mapped as a sheet panel, so declares, rolls, and vitality/charge/fatigue sync run through the combat bridge that already exists. While combat is active the fellmark gem pulses and opens battle; otherwise it opens the menu.

## ThreadSpire: remove the slideout title

- The slideout title is gone; the selected tab already shows where you are. The window now fills the art's content slot without a title band.

## ThreadSpire: fonts load everywhere, full stat sync, empty stage default

- ThreadSpire now loads its own fonts (Cinzel, Crimson Pro) instead of relying on the device already having them, which is why they looked wrong on another machine. The identity menu now syncs Lore Points, temp vitality, charge, and fatigue from the sheet, not just level and current/max. A fresh stage starts with no tokens instead of the two demo tokens. The slideout title is raised further onto the gold line.

## ThreadSpire: title on the gold line, portrait toggles

- The slideout title now sits right at the top gold line (dropped the header's top padding and its redundant divider). Clicking the portrait a second time now closes Lore, matching the fellmark's toggle behavior.

## ThreadSpire: Joel's slideout art restored, positioned by the SVG

- Joel's slideout frame art is back. The window and its close X are now placed by the Slideout SVG, the content sits in the panel slot and the X on its corner diamond. The FellGlass panels are transparent so the art shows through, with only the light-blue interactive elements kept; cards are a subtle dark blue and scrollbars are faint to match.

## ThreadSpire: real drag fix (composited grid + feed pause), bare slideout

- The map drags smoothly now. The grid moved into the transformed layer so it pans and zooms as one GPU-composited layer instead of repainting a full-screen gradient every frame, and the background state feed pauses while you're panning so it can't re-render mid-drag. The slideout background art is removed, only the cards themselves show now, and the circle around the close X is gone.

## ThreadSpire: free map panning + slideout polish

- The map pans freely now, it was snapping back to center whenever it was smaller than the view, which read as the twitch. With the infinite grid there are no bounds. The slideout returns to its previous position, sits behind the portrait, and its card backgrounds are transparent so the frame art shows through. The close X moves to the top-left and the title pulls left.

## ThreadSpire: Joel's slideout frame art

- The slideout window now uses Joel's extended-menu frame art. The art sits behind the window and shows only while a window is open; the window itself is transparent and positioned into the art's panel, so the sheet and menus render inside the ornate frame on the right, with the tabs overlaying its edge.

## ThreadSpire: fix map drag stutter + fellmark toggles

- Dragging the map is smooth again. The infinite grid was rebuilding its full gradient every camera frame; it now only rebuilds when the zoom or grid size changes and just shifts position while panning. The fellmark menu gem now closes on a second click.

## ThreadSpire: glow art swaps on click, god-mode LM toggle, smaller fellmark

- Selecting a tab now actually swaps in Joel's glow art (the swap runs on open and close, and the old blue highlight box is removed so only the art shows). LoreMaster Mode in the menu now means god mode, it unlocks editing every part of the sheet, driven into FellGlass, rather than swapping views. The fellmark logo is sized down to sit inside its gem.

## ThreadSpire: selected-tab glow art + fellmark menu gem

- Selecting a tab now swaps in Joel's glowing selected-state art for that slot, so the chosen menu item lights up in the frame. A fellmark gem is added at the bottom of the identity column; it opens a Menu slideout that holds the character switcher (moved off the name) plus settings, LoreMaster Mode is back as a toggle, and dice skins are stubbed for when the art arrives. The character name is display-only now.

## ThreadSpire: the menu follows the current Fell live

- The identity menu now stays in sync with the sheet. When you build a new Fell, edit the name in Lore, or change the portrait, the menu's image, name, and level update immediately, because the menu now listens to the sheet's own load and save events and adopts whichever Fell the sheet is on.

## ThreadSpire/FellGlass: editable name, no lingering red flash, faster switcher

- The Lore name is editable at any time again (the forged-name lock is off). The Fellstrike red edge-flash no longer re-fires when you change tabs, its class is cleared once the flash finishes, so a later reflow can't restart it. The character switcher now shows a cached list instantly and refreshes in the background, and the list is warmed when the character loads, so swapping characters no longer waits every time.

## ThreadSpire: portrait resets per character, faster sheet, reachable dice menu

- The identity portrait now clears when a character has none, so one Fell's image no longer lingers on another. The sheet iframe preloads when the character loads, so opening the slideouts no longer waits on a fresh load. And the dice type menu no longer vanishes when you move to click it, hovering now holds it open with a short grace delay so you can reach and select a type.

## ThreadSpire: sheet loads the table's character, and the menu sits over the slideout

- The embedded sheet was defaulting to the first character in your account rather than the Fell the table is for, which is why the identity card and the open sheet disagreed. The table now tells the sheet which character to load on open and on switch, so they match. The right menu now renders over the slideout window's edge instead of the window covering the menu.

## ThreadSpire: portrait synced to Lore, dice type on hover/tap, consistent window

- The identity portrait now reflects the sheet's Lore portrait, updating when the sheet loads and when you switch characters; clicking it opens Lore to change it, rather than a separate upload. The dice type is no longer a button: hovering the dice on desktop (or tapping once on mobile) reveals the types, and selecting one rolls it. The slideout window is positioned proportionally so it sits in the same place in fullscreen as it does windowed.

## ThreadSpire: smaller dice, character switcher, no load flashes

- The dice is halved (the cube itself), keeping its bottom-left spot and the gap to the type button. Renaming from the name is removed (rename lives in Lore); clicking the name now opens a Characters slideout to switch between your Fell or build a new one. The identity stats no longer flash defaults, they hold blank until the real sheet loads. And the sheet tabs no longer flash the build-a-new-character flow before loading, the embedded sheet waits for the real character instead of falling back to creation.

## ThreadSpire: real 70px dice, infinite grid, no stat flash

- The die itself (the cube) is now 70px, so it actually changed size; before, only its empty container was resized. The grid is now an infinite white grid that tracks the camera and fills the whole view at any zoom, over a transparent background, instead of a bounded grid that vanished past the map edge. And the identity stats no longer flash their defaults before the character loads; they stay blank until the real values are ready.

## ThreadSpire: dice to its slot at 70px, and name/portrait/log now persist

- The dice sits in its SVG slot at 70px (6.47vh, scaling with the view), with its type option beside it. Renaming the character and uploading a portrait now save to the Characters record through a new meta-save, so they survive a reload. The session log is written into the shared table state and restored on load, so it persists instead of starting fresh every time.

## ThreadSpire: HUD polish pass

- The dice is smaller and raised higher off the bottom border. The portrait now sits behind the menu art (the frame overlays its edges) while staying clickable to upload and change the character image. The character name is click-to-edit. The log defaults empty instead of the demo seed, and the chat bar is back at the top of the log, shrunk to fit so you can type in the slot.

## ThreadSpire: viewport-proportional layout (the fix for the drift)

- The interface was placed at fixed pixel positions computed for one window size, so any other window size made everything miss the art. Every slot, tabs, log, and all the identity gems, is now positioned as a percentage of the viewport, exactly as drawn in the SVG, and text scales in viewport units. The art stretches to the window and the interface stretches identically with it, so alignment holds at any size. The dice sits with equal padding from the left and bottom borders, clear of Attack.

## ThreadSpire: rescale interface to the true 1077x590 viewport

- Every slot recomputed from the SVG at the app's real viewport (1077x590), so the tabs, log, and identity gems land on Joel's frame instead of sitting too far right. The dice is pulled left and down and bottom-aligned with Attack. The map default is now transparent so the table texture shows through instead of the placeholder gradient.

## ThreadSpire: fix render crashing on the removed fellmark

- render() looped over the desktop and mobile fellmarks and toggled a class on each without checking it exists. With the desktop fellmark removed in the identity rebuild, that threw on every render, so the rail never populated and nothing was clickable. Guarded now, so render completes and the interface paints and responds.

## ThreadSpire: explicit table layer order

- The table now stacks in the intended order: the uploaded background as the map surface (it was hidden under an opaque fill), then the grid, tokens, and dice, then the outer frame and the right menu art, then the interface text and buttons, and the slideout window on top. The dice is smaller and nudged up and to the right.
## ThreadSpire: fix the boot crash from the removed fellmark

- Boot was throwing because a helper still tried to write into the desktop fellmark element that the identity rebuild had removed, and that error fired before render, leaving the whole interface blank. The helper now skips a missing element, so boot completes and the tabs, log, and identity paint again.

## ThreadSpire: fix the interface vanishing (hud was a full-screen box)

- The rebuilt identity container was a full-viewport element sitting over the whole table, which hid the tabs and log and blocked interaction. It is now boxless, only its small stat slots exist, each a fixed element in its own place. The interface and clicks come back.

## ThreadSpire: interface placed to the frame's exact slots

- Using the SVG guide boxes Joel drew, every interface element now sits in its precise slot: the five tabs, the log feed in its corner, and a rebuilt identity block, the LP gem, the TEMP/CURRENT/MAX and TOTAL vitality gems, the charge gem, the name, portrait, and level badge, each placed to the art. Text is in Cinzel and Crimson Pro to match the site. The log shows only the roll feed in its slot; the say-input is tucked away for now.

## ThreadSpire: interface text now sits in front of the frame art

- The tabs, log, and identity were rendering behind Joel's frame because the play area is a fixed layer that trapped them below it. The frame art now lives in the same layer as the interface, so the text reads in front of the art as intended. Log set in Crimson Pro to match the site.

## ThreadSpire: tabs and log aligned to the frame slots

- The rail tabs now sit on the frame's gem slots exactly, detected from the art at a 37px pitch, real coordinates instead of a scaled approximation, and the log drops into its top-right slot. Active tab reads in gold. Identity and the stat gems come next.

## ThreadSpire: Joel's frame art layered in

- The tabletop art is now layered into the table: the aged background behind the play area, the outer frame, and the right-side UI frame with its tab, vitality, and identity slots. The interface elements sit transparent over the art so the ornate shapes show through, with the log, tabs, and identity in the right column. This is the first alignment pass; exact slot placement gets dialed in next.

## ThreadSpire: right column scaled to the art proportions

- The log, rail menu, and identity card are scaled down to about 0.6, so the right column reads at roughly the width Joel's frame uses (about 120px at the 980x550 embed) instead of the oversized 200px. The content windows now meet that scaled column. This is a first pass at matching the target layout; fine placement comes with the art overlay.
## ThreadSpire: sheet window set to 315x480 for the 980x550 embed

- The FellGlass sheet window is now 315 by 480, the scaled slot for the current 980 by 550 embed (Joel's 1920 by 1080 design at ~0.51). Positioned against the menu.

## ThreadSpire: fixed 610x940 sheet window

- The FellGlass sheet window is now a fixed 610 by 940 frame positioned against the menu, matching the target layout, instead of auto-sizing to content. The FellGlass sections fill and scroll inside it for now; how they sit in that frame gets redesigned next.

## ThreadSpire: right column aligned

- The log, the rail menu, and the identity card now share one right-hand column at the same width, and the content windows end where the menu begins instead of floating with a gap. This lines the interface up so the frame art can overlay cleanly later.
## ThreadSpire: sheet iframe fills the window

- The character sheet frame now stretches to fill its window as a flex child, instead of an absolutely placed box that held a short intrinsic height and scrolled inside a tall empty panel. The section fills the frame; the window sizes to it.

## ThreadSpire: sheet window measures the settled panel

- The window now measures the panel's real content, not the padded page, and re-reports as the content finishes rendering and whenever it changes, using a resize observer. That stops the window from locking to a stale height measured before the section had drawn, so it sizes to what is actually there.

## ThreadSpire: sheet window hugs its content, no repeated header

- The sheet panel now sizes to the section inside it instead of floating in a fixed tall box, FellGlass reports its content height and the window fits it, capped so long sections scroll. FellGlass's own panel title is hidden in embed mode, so the section name no longer appears twice above the tab.

## ThreadSpire: sheet window back to the contained panel

- The sheet panel no longer takes over the whole top of the table. It returns to the contained panel that pops out beside the rail, the FellGlass section renders inside it and scrolls if it is long.

## ThreadSpire: Arsenal splits into Weapons, Lorebounds, Armor

- The Arsenal tab now carries its own inner tabs. Opening Arsenal shows Weapons, Lorebounds, and Armor across the top, each swapping the panel to that FellGlass section, so the whole arsenal is reachable from one tab instead of weapons only.

## ThreadSpire: the sheet panel fits and lands on the right section

- The sheet now opens in a large panel that fills the table beside the rail, instead of a cramped box, so the FellGlass section has room to render. FellGlass's character-switcher bar is hidden in embed mode along with its header and hub, so only the panel shows. And the requested section now sticks: tapping Attributes lands on attributes, not the default lore panel, even after the character finishes loading.

## ThreadSpire: the real FellGlass sections in the tabs

- The sheet tabs are no longer a barebones rebuild. Each tab now shows the actual FellGlass panel, its real rendering and full functionality: Attributes opens FellGlass's attributes, Arsenal its weapons, Skills its skills, Inventory its inventory, Lore its lore. FellGlass runs in an embed mode that hides its own header and hub so only the panel shows, and ThreadSpire's tabs drive which panel is up. Same code, same behavior, no drift. The Acantha placeholder no longer flashes before your character loads.

## 2026-07-21 — SagaForge: the Churn is Burhallow's alone

- Canon correction. The Chronicle playbook cited the Churn as the world-neutral reason open tables change between sessions. The Churn is Harfolk belief, Burhallow alone. Across LoreFell the LoreMaster summons Fell souls and bodies as needed, and the playbook now says so. The Burhallow lore capsule keeps the Churn and marks it as that warren's own account.

## ThreadSpire: derive the character id from the sheet context

- The sheet load no longer depends on a single id field in the page message. If the character id is not passed directly, ThreadSpire now takes it from the character object the table already sends, so the sheet still finds its owner and loads.

## 2026-07-21 — SagaForge adventure craft engine

- Added variation decks: sixteen adventure frames and ten antagonist stances, rolled on the Scope step with reroll and hand pick, avoiding recently used picks. The rolled frame and stance ride in the premise, spine, and every scene prompt.
- Added the repetition ledger: each exported adventure logs a fingerprint (title, size, world, frame, stance) to local storage, and the last eight ride in prompts as explicit bans so adventures stop converging on one shape.
- Added per size playbooks: Tale (in medias res, one reversal, complete tonight), Story (hook, complication, irreversible turn), Legacy (antagonist plan of four to six offscreen steps as PLAN lines, false victory, mid saga reframe), Chronicle (self contained open table sessions, three to five FACTION lines with goals and ticks). PLAN and FACTION parse into the skeleton and ride in campaign notes.
- Upgraded crucibles: every crucible body opens with OBJECTIVE, TERRAIN, and TURN lines. Objectives draw from a ten entry deck with no repeats inside an adventure, Takedown allowed once. The LM NOTE gains a FAILURE line so a loss moves the story forward.
- Upgraded NPCs: the NPC block gains want, fear, tell, and voice fields, carried through parsing, the FateWell pack, and the Markdown export. New NPCs must differ from every prior NPC in role, manner, and want.
- Added standing world lore capsules for Valoria, Vyrathis, Pyranthia, and Burhallow, injected when the world matches, plus bans on the worn shapes of past campaigns drawn from The Histories.
## ThreadSpire: clearer sheet loading, and the name shows right away

- The sheet tabs no longer sit on a silent Loading forever. If no character is linked, if the sheet is private to another owner, or if the page code has not answered, the tab now says exactly what is wrong. The character name and portrait also show immediately from the table context, before the full sheet finishes loading, instead of holding on the placeholder.

## ThreadSpire: your real character in the rail tabs

- ThreadSpire now loads your actual character from the one Characters record instead of the Acantha placeholder, so your name, level, vitality, and portrait are yours. The rail tabs render your real sheet: Attributes, Skills, Inventory, Arsenal (weapons, lorebounds, armor), and Lore (lineage, origin, motivation). These read the stored sheet directly; the situational math, grants, stance bonuses, and forged weapon names, still lives in FellGlass so the two never drift.

## ThreadSpire hosts the character sheet (FellGlass, live)

- The player's full sheet now lives inside ThreadSpire. Tapping the rail or the identity card opens the real FellGlass, the whole tool, not a copy, in a panel over the table. Its bridge is relayed through ThreadSpire's page to the same Characters record its own page uses, so every edit saves to the one record that FateWell and the rest of ThreadSpire already read. Nothing is duplicated, so nothing can drift. This is the first half of making ThreadSpire the single home; the LoreMaster's authoring tool is next.

## ThreadSpire: the Fell get their faces and gear

- The Fell cards were bare name and level. Now, on cast, each Fell is matched to its character sheet and picks up its portrait, weapons, lorebounds, armor, talents, and identity, lineage, origin, and motivation, so the LoreMaster sees who is at the table and what they carry, and Fell tokens wear their portraits. The deep combat numbers still live with the sheet module and come later; this is the face and the kit.

## ThreadSpire: the roster travels with the cast

- Casting to the Spire now carries each scene's whole roster, not just its notes. Foes arrive with their rating, vitality, attributes, acts, infusions, and attack line; NPCs by name; and the Fell at the table by name and level. They fill the Library tab and, once combat begins, the foe and Fell cards on the play strip. Everything is read-through, the cards show, the math stays in the engine.

## FateWell: table journal appears in Adventure Notes

- The LoreMaster's Journal from ThreadSpire now shows up on its own in FateWell's Adventure Notes, no button to press. When you open the adventure, FateWell pulls your table journal in and drops each entry into Adventure Notes as a real note, titled by the time you wrote it, so you can rename, fold, reorder, and delete them for recaps. Each entry is pulled exactly once and tracked, so nothing duplicates and a note you delete stays gone. The pull is one-way and never rewrites the campaign, FateWell adds the notes through its own save, so there is no risk to your prep.

## ThreadSpire: rail hugs the identity card

- The right-side tabs were parked high to clear the scene bar, leaving a gap above the LoreMaster card. They now drop down to sit just above the identity card and the tabs are a touch more compact, so the cluster reads as one and stays well clear of the log above.

## ThreadSpire: the LoreMaster's Journal

- A new LM-only Journal tab, a single stream you type into as you play, in roleplay and in battle, timestamped and kept for your recaps. It lives on the campaign row but only the LoreMaster can read it, so it never reaches a player, and it never touches FateWell prep. The running log still captures every roll and line as before; the Journal is for what you choose to write.

## ThreadSpire: real note categories with matching colors

- Scene notes carried only their text before, so every one showed as gray Read aloud. The Cast handoff now carries each note's real FateWell type, and ThreadSpire renders the matching label and color: Read-aloud, Dialogue, Crucible, Lore Check, Clue, Quest, Secret, Beat, Reminder, and Note, each in the same hue FateWell uses. The tags now match what you wrote.

## ThreadSpire: clean view and full screen for streaming

- Two viewing modes for streaming or projecting. Clean view hides every widget, the rail, the scene bar, the dice, the log, the identity card, and shows only the map and tokens; a faint Show widgets pill in the top corner brings them back. Full screen takes the runtime to the whole display. Both are in the Settings tab, and both have shortcuts: H toggles clean view, F toggles full screen. Full screen needs the embed to allow it, which is a one-time setting on the host page.

## ThreadSpire: fixed beat height, arrow-key navigation

- The beat card is now a fixed height instead of growing to its content, so the scene bar above it stays put no matter how long or short a note is; long notes scroll inside the set frame. The left and right arrow keys now step through beats and no longer scroll the whole window (they are ignored while typing in the chat box).

## ThreadSpire: card sizing, width-to-bar, collapsible log, focus discipline

- Every card now caps at 44vh and scrolls inside, so nothing ever runs off screen. The beat card takes the width of the scene bar above it, left and right, so they read as one stacked unit. The play log collapses to a small pill from a toggle in its header. And the view keeps one thing in focus at a time: opening a rail window minimizes the scene bar and beats and closes any open card, closing the window brings the bar back, and opening a foe or player card closes an open window.

## ThreadSpire: contain the beat cards

- The scene notes were ballooning over the map, onto the dice, and off the bottom of the screen. Now a beat shows one card at a time (the peeking neighbor cards are gone; the arrows and dots navigate), the card is compact and capped at 44vh so long notes scroll inside it instead of running off screen, and its width is held to about 420px so it stays clear of the rail on the right and the dice at the bottom left. The map stays readable while a beat is open.

## ThreadSpire: declutter the LoreMaster view

- Two always-on panels were crowding the map. The Testing panel is now hidden when embedded (it was pure scaffolding); a backtick keypress summons it while testing. The grid sliders no longer sit open on the map for every LoreMaster; they moved behind a Grid controls toggle in Settings, where the window already promised grid, log, and view controls would gather. The map stays clear until you ask for a tool.
## ThreadSpire: scene beats through the handoff, and FellGlass flash fix

- Cast now carries each scene's beats, not just its name, so the Notes window shows what you wrote to run the scene instead of Nothing here. FateWell maps a scene's entries into read, check, and choice beats and hands them over in the spine; ThreadSpire loads them per scene. FellGlass no longer flashes the sheet before redirecting: when embedded it stays behind a cover until it knows it is staying (a deep-linked sheet or a new-character wizard) or is standalone or offline, so a player being routed to the table never sees the sheet blink.

## ThreadSpire: promote the runtime to the production file

- The live site embeds threadspire.html, but the whole runtime was built in proto-threadspire.html, so none of it was ever live. This promotes the runtime into threadspire.html (docs and embeds) and removes the prototype, so the existing embed serves the real ThreadSpire: the LoreMaster view, the scene picker, Stages, the transport, the context handoff, and the real-adventure load. No second file left to drift.

## ThreadSpire: load the real adventure on Cast

- Cast to the Spire now hands the real game over. The button gate was too strict (it required a campaign id that hub mode leaves empty), so it never showed; it now appears whenever an adventure is open. On Cast, FateWell pushes the adventure spine, the true acts, sessions, and scenes with their ids and names, into CampaignView, then opens ThreadSpire. ThreadSpire reads that spine on load and builds its scene picker from your actual adventure, landing on the scene you were on, instead of the seeded demo. Per-scene content ports later; the spine is enough to run and switch. No blob parsing, the spine comes straight from FateWell's own model.

## FellGlass: route players to ThreadSpire

- FellGlass becomes the on-ramp, not the daily home. Opening the-fellglass from the site with a character now heads straight to ThreadSpire, where the rail is the sheet. A player with no character gets the creation wizard, and finishing it carries them to ThreadSpire with their new character. Deep links with an explicit charId still open the sheet as before, and if the character lookup fails the tool falls open to the builder so no one is ever stranded.
## FateWell: Cast to the Spire

- A gold "Cast to the Spire" button now sits in the breadcrumb bar whenever an adventure is open, hidden on the home list. It opens ThreadSpire in a new tab on this same campaign, carrying campaign and role=lm, so FateWell stays open and the two run side by side. It solves the campaign-id problem too: FateWell already knows the id and builds the link for you. Access is still gated on the ThreadSpire side by ownership, so the role=lm hint only lands you in the LoreMaster view if you actually run the adventure.

## ThreadSpire: context handoff, role by entry point and ownership

- ThreadSpire now completes the handshake it was missing. On load it announces THREADSPIRE_READY, and it consumes the THREADSPIRE_CONTEXT the page returns, so it finally learns its role and campaign instead of defaulting to a player on the seeded demo. Role is decided by entry point and secured by ownership: the page honors an LM request only when myAdventureRole confirms the signed-in member is the loremaster or lorekeeper, so a plain link opens the player view even for the LM, a Cast link opens the LoreMaster runtime, and a player who forges role=lm still gets the player view. FateWell and schemas untouched.

## ThreadSpire: CampaignView, live shared state (Phase 2)

- The transport now points at a real store. A CampaignView collection holds one versioned snapshot per campaign, and threadspire.web.js gains getCampaignState and saveCampaignState, member-aware and campaign-scoped through the admin-locked collection. The page bridge swaps its in-memory stub for these methods, degrading quietly if the collection is not live yet. The ThreadSpire client is unchanged: its Phase 1 seam already speaks TS_STATE, so this only moves the far end from stub to collection. FateWell untouched; the collection is created, never a replace, so Campaigns is skipped on apply.

## ThreadSpire: the shared-state transport seam (Phase 1)

- The live sync wire is in place. A stateBackend seam relays the shared slice outward on every send (board, active scene and stage, phase) and a feed pulls remote truth back, version-gated so a client never clobbers its own live edits. The stub keeps a versioned snapshot in memory, so a lone client runs exactly as before; embedded, the same two calls ride the page bridge to a CampaignView-shaped stub store on the page. Swapping that stub for the CampaignView collection is the whole of Phase 2, the seam does not move. FateWell and schemas untouched.

## ThreadSpire: multi-scene handover and the scene picker

- The runtime now receives the adventure spine, Act then Session then Scene, the shape FateWell authors. S.scene points at the active scene and everything reads it unchanged; switching repoints it and restores that scene's board through its own private binding, so each scene keeps its own stages and returns to where you left it. The runner bar's gold label is now the scene picker, grouped down the spine, and the Notes tab stays the current scene's beats. Stages remain private instance state, so the module stays portable. FateWell and schemas untouched.

## ThreadSpire: Stages as a private instance layer

- Stages and their scene bindings move off the scene into S.instance, a layer private to the LoreMaster. A scene now carries only portable module content, its map pack and beats, so an exported adventure can never carry anyone's board. Scenes bind to stages many to many through S.instance.bindings keyed by scene id, one stage can serve several scenes and shares its layout between them, and stages persist per account through stageBackend so one table's boards never reach another. The runner bar shows the scene and opens its notes, stage switching lives on the Stages tab. FateWell and schemas untouched.

## ThreadSpire: Stages in the window frame, the stage vocabulary, and the live storage bridge

- Stages now opens in the same window frame as Notes, Library, Search, and Settings, a proper section with the deck as cards, switch, delete, and new stage. The floating popover is gone. The stage name in the top bar opens the same window.
- The saved table model speaks Stage throughout the code: the backend seam, the snapshot and restore, the switch and delete, and the seed ids. The word scene stays with the adventure's narrative scenes.
- Notes and Library are fed from the adventure's own state: Notes lists the scene's beats with their kinds, Library lists the foes, Fell, and NPCs at the table. Search and Settings hold their frames.
- The live storage bridge lands. Embedded in the Wix page, the asset and stage seams route over postMessage to the page, which calls uploadRune, saveAsset, and listAssets for images and the new threadspire.web.js trio, listStages, saveStage, deleteStage, owner scoped like the Assets methods, for stages. Standalone, the stubs keep the proto working offline. A new Stages collection schema carries stageId, owner, campaign, name, map reference, token JSON, grid JSON, and the map box. On an embedded load the account's stages pull into the deck, so last session's tables come back.
## FateWell: the ThreadSpire join (opt-in, dormant)

- FateWell can mirror its running scene to ThreadSpire through a shared CampaignView, and reflect ThreadSpire's back. It is off by default: nothing runs unless a session turns the join on, so a normal weekend behaves exactly as before, and the campaign's own data still saves the way it always has. Adds a shared campaignview.web.js backend (member-checked, campaign-scoped), a CampaignView collection, and the two bridge handlers. Merging this creates the collection on apply, which is a create and never a replace, so the Campaigns collection is skipped and untouched.

## SigilForge: Rooted, the combat effect

- Rooted joins the shared combat effects, the single round form of the Rooting infusion. When it lands the target cannot move until the end of the round. It costs 2 and sits in the Movement group of the effect inlay, the lighter kin of Immobilized. Authored in SigilForge, carried into the conditions pack, and baked into FateWell and FellGlass.

## FateWell: keep ThreadSpire's maps and tokens out of the foe library

- ThreadSpire's saved maps and tokens live in the same Assets collection as the foe library, tagged by kind. FateWell's library ingest took every named row, so a saved map or token appeared in the roster as an empty foe. The ingest now drops rows tagged map or token before they reach the library. Foe rows are untouched.

## ThreadSpire: the LoreMaster's rail and identity panel

- In LM mode the right side of the table becomes the LoreMaster's. The identity panel reads LoreMaster with the signed in member's name beneath, read from the Wix member on the live page, and the vitality and LP gems step aside. The five character plaques become Notes, Library, Stages, Search, and Settings. Notes, Library, Search, and Settings open windows in the same frame the character sections use, ready to carry FateWell and FellGuide content when the bridge lands. Stages opens the scene deck directly, the saved table layouts, named Stages so the word scene stays with the adventure's narrative scenes. Flipping back to a player restores the character rail and panel untouched.

## ThreadSpire: scenes remember themselves, tokens delete, labels beneath

- Scenes are now saved bundles. Each holds its map, every token's position and footprint, and the grid. The scene name in the top bar is the switcher: click it and a compact deck drops down with a card per scene, its map thumbnail, and its token count. Switching snapshots the table into the scene being left and restores the one entered, so the party stands where you left them, between scene changes and between sessions. New scene and delete live on the deck, and the last scene cannot be deleted. Bundles persist through a scene seam mirroring the asset seam, stubbed now, a Scenes collection when storage lands.
- The LoreMaster can remove a token from the map, a control on the token menu.
- Token labels render as text beneath the token, not inside the disc. The disc keeps its portrait or initials, the name sits under it on a small plaque.

## ThreadSpire: asset save seam, uploads persist to the account

- Uploaded maps and tokens now save through one asset seam, three calls, upload, save, list, that stand in front of the account store. An uploaded map saves and reappears in the picker on a later load; an uploaded token saves and joins a Your saved tokens section of the palette to place again. The seam runs on a local stub for now that mimics the live Wix contract exactly, so the full save and reappear flow works offline. The stubs swap to the live uploadRune, saveAsset, and listAssets in one place, the seam itself does not move. This is Option 1 of the asset storage spec, reusing the Assets collection with a kind discriminator.

## ThreadSpire: the token palette, from records and by upload

- A Tokens button opens a palette that places tokens drawn from the scene's own records. Foes and NPCs come from the adventure, the Fell come from their FellGlass sheets, each as a chip with its portrait or its initials. Placing one drops it at the map centre for the LoreMaster to move, carrying its record link, its name, and a footprint that matches its rating. A token with a portrait renders that image as its face on the map.
- The palette also takes an ad hoc upload, click or drop an image, the same local preview the maps use. The token places tagged not yet saved, ahead of account storage. Non image files are turned away. This is tokens from every source except the account store, which lands with the shared storage step.

## ThreadSpire: carousel arrows move into the top bar

- The prev and next arrows now live inside the top bar, one on each end, with the scene name and controls between them. They are part of the chrome, so they cannot sit on or near a card at any width. When only one card is present the ends hold spacers instead, keeping the bar balanced.

## ThreadSpire: cards stay inside the arrow lane

- The carousel arrows sit on a fixed lane, and every card is now capped so its edge, and the edge of its peeking neighbor, stays inside that lane. A card can no longer slide under an arrow at any width. The neighbors tuck in a little tighter to hold the margin, and the scene, foe, Fell, and spotlight cards all share the same cap so none of them reach the arrows.

## ThreadSpire: upload a map from your device, local preview

- The upload slot in the map picker now takes a real image. Click it to pick a file or drag one onto it. The image is read locally, measured so the map box matches its natural size, added to the picker as a reusable card with a thumbnail, and set as the scene background. Nothing leaves the device yet, the card is marked not yet saved. This is the upload interaction ahead of account storage: the same path will persist to the account collection when storage lands, and only the preview URL changes to a stored one. Non image files are turned away with a reason.

## ThreadSpire: the map picker, adventure maps first

- A Maps button on the scene controls opens a picker of the maps the adventure preloaded. Choosing one sets it as the scene background and sizes the map box to the art, so a map of any shape no longer stretches to the old hardcoded box. The choice rides on scene state through the seam, since the background is what the LoreMaster sets for the table, not a per player view. This is the first of the map sources, the ones the adventure authors. The picker also shows an upload slot, stubbed for now, that lands when account storage does.

## ThreadSpire: auto evasion rolls return, carousel arrows clear the cards

- The evasion line is back on the foe card, matching the runner. When a foe's act targets a Fell it auto shows, waiting on the roll and naming the Fell's Evasion. Throwing the foe die resolves it: accuracy, the die plus Precision, against the Fell's Evasion, landing on Hit or Evaded, and the contest logs to the stream.
- The carousel arrows no longer sit on the cards. They are pinned to the viewport edges, well outside the centered card, and tuck to the screen edges on a narrow screen.

## ThreadSpire: the spotlight hugs the map's edge, and combat minimizes to a pill

- The spotlight gold box no longer stacks full cards down the screen. It matches the FateWell runner: members sit side by side as the same compact cards the commit phase shows, the box hugs them low and wide, and the map stays visible above it. Clicking a member opens its five tabs in place inside the box. Foes keep a small die on the compact face so a roll does not need the card opened. The resolve control sits in the box head.
- The whole combat strip minimizes to a small gold pill naming the round and phase. One click collapses it so the LoreMaster has the map, one click reopens it where it was. The pill works in scene mode too.

## ThreadSpire: real spotlight groups, Fell cards tabbed, foe dice, two visual fixes

- Spotlights now form the way the FateWell runner forms them. In auto mode the focus graph clusters combatants who target each other into one spotlight, so an attacker and its target sit in the same gold box and resolve together. In manual mode the LoreMaster toggles which cards group, matching the two modes the runner has. A spotlight is one gold box holding every member, with a single resolve that clears the whole group. Resolved spotlights sink below the unresolved, and unengaged combatants stand as their own solos.
- Fell cards get the same compact to tabbed treatment as foes, with the same five tabs, pulling from the FellGlass sheet. About holds level, vitality, charge, and reacts on hand. Attributes holds the grid. Attack holds the weapon line. Acts holds the Fell's Acts and skills. Stats holds arsenal and lore.
- Foe dice stay on the card, a d6 the LoreMaster throws for the foe, Fellmark on 6 and Fellstrike on 1, logged to the stream, present on the About tab and inside the spotlight. Targeting drives the grouping, so the act and target pickers now feed the focus graph.
- Fixed the map knob panel peeking out from behind the testing panel, now stacked below it, and the carousel arrows overlapping the cards, now sat outside the card zone with the neighbors tucked in.

## ThreadSpire: fix a broken CSS value that displaced the HUD and testing bar

- A stray unclosed color value in the compact card style broke CSS parsing for the rules after it, which stripped the fixed positioning from the testing bar and the character HUD. The vitality gem fell to the top left on its own and the testing buttons vanished behind the map. The value is closed now, so both return to place. The testing bar is also a labeled panel in the top left so it is easy to find, with Toggle LM role first.

## ThreadSpire: tabbed foe cards, auto-width scene cards, dropdown fix

- The foe combat card is compact by default, the same small card the FateWell strip shows, name, vitality bar, and charge. Clicking it expands to a tabbed card just larger than a scene card, with five tabs. About holds name, vitality, charge, and the act and target pickers. Attributes holds the grid. Attack holds the damage line. Acts holds the Acts with their grays and the React row. Stats holds infusions, augmentations, stance, and afflictions.
- Scene run cards grow to fit their note up to a width that stays clear of the dice tray on the left and the character panel on the right, then the body scrolls. Short beats stay small, long beats widen to the cap.
- Fixed the Act and target dropdowns closing the instant they opened. The centered card carried a recentering click that re-rendered the whole card on any click inside it, including opening a select. The center card no longer recenters on its own clicks, so its dropdowns stay open to choose from.

## ThreadSpire: foe cards carry the full combat runner detail

- The combat foe card on the ThreadSpire map now matches the FateWell runner line for line. Attributes grid, the standard attack damage with its to-hit and the base and bonus note, the Acts with tiers and effects and both grays, needs charge for a locked tier and beyond rating for one above the rung, infusions and augmentations with the rating reveal, stance, and signature affliction. The act line is a real act picker and target picker in Commit, resolving to the target's name once locked. The React row is a dropdown of the foe's react ready Acts plus Skill and Movement, with used and restore. Fell cards show their reacts on hand. Everything reads from scene state through the seam, no math owned here.

## ThreadSpire: the run cards become a carousel over the map

- The LoreMaster cards no longer sit in a window with a blue background. They float over the map as a carousel, the current card centered and sharp, the previous and next flanking it small and dimmed. Arrow keys, clicks, and taps swipe through them, and dots mark the position. The strip container passes clicks through to the map so panning still works around the cards.
- Combat wears the same carousel. Foe cards center on the map with a solid background for the LoreMaster's eyes, carrying the canon damage line and the charge diamonds. Once acts lock, each becomes a Spotlight wrapped in a gold box, swiped through and resolved one at a time, the same combat rhythm on the ThreadSpire map. Each face keeps its own place in the deck, so scene, commit, and resolve remember where you were.
- The dev bar and the map knob panel moved to the top left, clear of the carousel at the bottom.

## ThreadSpire: the LoreMaster runtime, run cards that flip to combat

- ThreadSpire gains the LoreMaster's run surface, a bottom card strip that reads the scene FateWell authored and renders it. In a scene it shows run cards, read aloud, checks, and choices. Beginning combat flips the cards to foe and Fell cards wearing the same shape and the same canon damage line the FateWell tracker shows. Committing acts and locking them groups the cards into Spotlights the LoreMaster resolves one at a time. Charge sets from the card with dark when empty and gold when set diamonds. Ending combat returns to the scene.
- This is the first vertical slice of the seam. The strip reads S.scene as remote truth handed over by the engine and never owns the math. All intent leaves through the same seam the rest of the shell uses. It proves a LoreMaster can run a scene and a battle from inside ThreadSpire, the runtime, while FateWell stays the authoring tool. Foe kit, damage, and the phase model are read through, not held, so the single source of truth stays in FateWell.

## ThreadSpire: CampaignView ruled its own collection, seam proven before ports

- View state splits three ways by owner and write rhythm, not by screen. CombatState holds the round, phase, charges, and acts. CampaignView, its own collection, holds what the LM sets for the table: mode, node, background, and the grid that defines the coordinate system. The camera holds no record at all, living outside every synced object so the bridge cannot reach it. CampaignView is separate from CombatState on purpose, so a camera reframe never rewrites the combat blob and an act never rewrites the view, which under last write wins would clobber each other.
- The build order gains a proving slice. Before porting FellGlass sections, one real value travels FateWell to the seam to a ThreadSpire render end to end, foe charge first, CampaignView in parallel, so both records are shown to sync independently before the section ports and the battle bridge repeat the pattern. ThreadSpire renders the FateWell and FellGlass engines through the seam and never holds them, so the combat and character math stay single sourced.

## FateWell: the top dock charge diamonds track the live charge

- The charge set on a foe now shows on its card in the top combat strip. The dock already read the same live charge, but its diamonds were styled so faintly that an empty one looked lit and a set one did not stand out, so the strip appeared stuck at empty while the Spotlight showed the real charge. Every read-only charge diamond now reads clearly dark when empty and solid gold when set, so the top card, the Spotlight, and the popup all show the same charge at a glance. The dock stays tap-to-open since its card is small; the setting is done on the larger cards.

## FateWell: charge diamonds read dark until lit

- The interactive charge diamonds carried a faint gold border even when empty, so an unlit charge looked half on and a click that landed looked like nothing changed. An empty charge diamond now reads clearly dark, and a set one fills solid gold with a glow, so setting or stepping a charge is unmistakable. The click path was already sound; this is the contrast that makes it legible.

## FateWell: charge is adjustable on every foe surface

- The charge control worked only on the Resolve card. The Spotlight card, the card header, and the token popup showed the charge as read-only diamonds, so there was nowhere to set it while running a fight from those views. A foe's charge diamonds are now live everywhere a foe appears: click a diamond to set that tier, and a minus and plus step it. A Minion stays read-only since it never charges, and a player's own charge stays read-only on these views since a player runs their own. This pairs with the earlier fix that stopped the tool auto charging on an unresolved swing, so in hand-run combat the loremaster now sets charge directly from whatever card is in front of them.

## FateWell: the token popup joins the one foe sheet

- The foe token popup, the one with the current-vitality and luck controls, kept its own hand-built attribute grid and ability list, read straight from the combatant. So it still showed The Erasure at all zeros while the Spotlight card beside it showed the synced Precision 6 and Power 6. It now renders the same shared sheet the roster and Spotlight use, read through to the library, non editable. Its live board controls stay, current vitality, charge, conditions, accuracy, but the foe's kit below them is one renderer everywhere. Four foe surfaces, one sheet, no drift.

## FateWell: the loremaster decides a foe's damage type on a tie

- When a foe's Power and Magic are level, the strike could read either way, so the loremaster picks. A small toggle appears on the foe sheet only on a tie, physical or magical, and the choice drives the whole line: Base off Power or Magic, and Bonus met by Durability or Resistance. The moment one attribute leads, the lead wins and the toggle is gone. The choice stores on the foe, survives the library round-trip, and syncs to the board like the rest of the kit.

## FateWell: the combat runner reads through to the library, live

- A foe on the board now renders from the library entry it came from, resolved by its stored link and scaled to the rating it fights at. The library is the truth and the card reads through to it, so a change made in the library mid combat reaches the board on the next render. This replaces the earlier attempt that trusted a copy stored on the combatant, which is why The Erasure could read every attribute as zero on the board while the library showed Precision 6 and Power 6.
- The scene still owns what a scene owns: current vitality, the live charge, conditions, and the rating the foe fights at. Everything the library authors, its attributes, build, Acts, infusions, augmentations, stance, and signature, is read live from the library. A summoned foe the library never held falls back to its own stored kit.

## FateWell: foe cards derive attributes live, healing older foes

- A foe on the board could read No attributes assigned while the library and roster showed its real Precision and Power. The library re-derives a foe's attributes on every render, but the combat card trusted the value stored on the combatant, which was empty for any foe placed before that value was derived. The card now derives the same way the library does, from the foe's build and rating, so a foe placed at any time shows its true attributes and its damage line reads off real Power or Magic. A scene that scaled a foe's attributes still wins, so per-scene scaling is not lost.

## FateWell: charge only on a confirmed hit, and manual charge controls

- The foe charge advanced the moment an attack was assigned, not when it landed. The resolve check defaulted to landed and only flipped to missed when a real evasion roll was on record, so in hand-run combat where the loremaster calls hits, every declared swing charged the foe. Now the tool charges only on a hit it can confirm, holding both rolls with accuracy meeting evasion. An unresolved swing is not a landed one, so an unknown outcome leaves the charge alone and the loremaster carries it by hand.
- The charge row gained a minus and a plus beside the pips, clamped 0 to 3. The plus is what you tap when a swing lands while you are judging hits yourself. The pips still set a tier directly, and clicking the top lit pip still drops one. This covers the testing mode where no evasion is recorded.

## FateWell: the foe combat sheet, one reckoning on every surface

- A foe now shows the same sheet in the library, on the roster, in the crucible, and in the Spotlight: derived attributes, the Standard Attack's damage line, its Acts, infusions, augmentations, stance, and signature affliction. One renderer serves all four, so the surfaces cannot drift apart again. The library and roster keep their editors; the crucible stays locked, per the ruling that a foe on the board is already forged.
- The damage line reads from the FellGuide. Base is 1 plus Power for a physical foe or 1 plus Magic for a magical one. Bonus always exists: a foe makes the same strike a Fell makes, so it swings a weapon leveled like the party's, and its Bonus is the Arsenal weapon table read at the Average Party Level. The kit stacks on top of that, Mauling, Wounding, and Blighting adding to Bonus and Brutal, Sharp, and Potent raising Base, per the stacking rule in Bonus Damage. Physical when Power leads, magical when Magic leads. The line rides open on every combat card, 6 + 3 physical, so the loremaster reads what to allocate at a glance, with the to-hit beside it.
- Two grays, two facts. The Shatter Rating reveals a slice of the full Forsaken kit and everything beyond the rung waits grayed as beyond rating, still there for escalation. Within the reveal, a Tier N Act stays grayed as needs charge N until the foe's meter reaches it, and it lights the moment the charge lands. A Minion shows only its Standard Attack, its whole kit waits, and its charge meter does not render, since a Minion never charges.
- Fixed a quiet math corruption: the ability editor saved an Act's tier as a string. The unlock check survived by coercion but charge advancement did not, reading a string tier as tier 0 and charging the foe as if it had swung bare handed. Tiers now save as numbers and existing data heals on load.

## ThreadSpire round four: the dice hit the table

- Rolling throws a die onto the screen. It leaves the socket, arcs, bounces twice, lands somewhere new every time, sits for two seconds, then shrinks back into the socket it came from. The socket shows an empty outline while its die is away. Screen space, so it lands the same for everyone no matter where their camera is pointed.
- A Fellmark announces itself. Gold aura, three rings expanding out of the landing point, the die glowing and its pips flaring brighter gold, and a swell on impact. A Fellstrike goes red, tighter and faster, and shakes rather than rises. Everything else stays quiet, which is what makes those two land.
- Skins are earned, so they belong to the Fell and they travel. Each roll carries the skin it was thrown with, and a player assigns one per roll type, so the die says what is being rolled before anyone reads a word. The rest of the table sees what you unlocked instead of taking your word for it.
- Every roll at the table throws now, not only your own. Kaelo rolling puts Kaelo's die on your screen, wearing Kaelo's skin and carrying his name. Yours returns to your socket, everyone else's lifts and fades where it lands. The bottom readout still spells out your own maths alone.
- One code path for every die. A roll leaves through the seam and the throw happens when it comes back, so your own die is drawn from remote truth exactly like everyone else's. The animation cannot pick a face, and a test greps the throw for a random face roll and fails if one ever appears.
- The Fellmark moved into the gem row between vitality and LP, where it stops covering the Lore plaque. The rail now stacks off the top of the character card rather than from a fixed offset, so the two no longer grow into each other on a short window.

## ThreadSpire round three: log order, the rail, the Fellmark, and the token menu

- The log runs newest first. A new line lands directly under Say something and older ones work downward off the panel, so the two things always in view are the chat box and the latest thing that happened. Nothing has to be chased. The full log overlay reads the same way.
- The rail is Inventory, Skills, Arsenal, Attributes, Lore. Notes leaves the rail and will live inside Lore, along with player description, origin, lineage, total ascension crystals, and skyvault shards. Lore takes the foot of the rail on both desktop and mobile, which retires the More slot.
- The Fellmark is the combat trigger. It sits at the foot of the column, lights and pulses when combat opens, and takes you to the battle surface. The vitality gem stops flashing and goes back to being vitality. One thing signals combat, one thing shows health. The symbol is a placeholder standing in for Joel's art, and the behaviour will not change when the art lands.
- Token editing moved into a menu. Tapping a token lights it up for anyone, so you can see what you are touching. The LoreMaster gets a menu on the selection carrying the label and the footprint, which replaces the click-to-cycle sizing that got messy the moment a tap meant two things at once. The menu is drawn in screen space and anchored to the token, so it stays legible at any zoom.
- Selection sits outside the shared state with the camera. Who you are touching is a fact about your screen, not about the board, so it never syncs. Same wall, same reason.

## ThreadSpire map space: the camera, the grid, and the wall between them

- The map now has a coordinate system of its own. One layer carries a camera, translate then scale, and the background, the grid, and the tokens all ride it. Everything else stays in screen space and never moves. Tokens store their centre in map units instead of screen percentages, which is the change that makes zoom possible at all.
- Only the ON syncs, not the view. The LoreMaster decides what lives on the map, every viewer decides where they stand. The camera lives outside the shared state object rather than inside it marked local, so applyRemoteState physically cannot reach it. A wall, not a convention.
- Wheel zooms to the cursor and pinch zooms to the midpoint, because centre anchored zoom is useless the moment you look at a corner. One finger on the map pans, one finger on a token you hold moves it, two fingers pinch. A pan no longer closes the open window the way a click does.
- The grid is drawn in map space with non-scaling strokes, so it stays welded to the art and stays a hairline at 4x instead of thickening into rope. The LoreMaster owns cell size, offset on both axes, and opacity. Offset earns its place, no map art has its grid starting at the origin.
- Token size is derived rather than stored: cell size times footprint times inset. Footprint is per token in cells and is a game fact, an Epic owning 2x2 is something a player reads off the board. Odd footprints centre on a cell, even ones on an intersection, so a 2x2 covers four whole squares instead of straddling eight halves. The inset is only air, keeping grid lines visible and stopping neighbours fusing into one blob.
- Recalibrating the grid no longer moves anything. Tokens hold their spot on the art and the grid slides under them, which is the whole reason positions are map units and not cell indices.
- THREADSPIRE_SPEC.md updated to match on both counts, since the old text had tokens at screen percentages and viewState silent on where the camera lives.

## ThreadSpire roll readout, the die shows the roll and the log shows the math

- The die face carries the raw d6 and nothing else. The session log now spells the working out in full: 5 + Power 2 + Might 1 = 8 on Attack, with Fellmark and Fellstrike called on the raw die per canon.
- A readout rises at the bottom of the play surface when a roll lands, naming the type, the die, each modifier, and the total, then fades on its own. It waits out the tumble so the number on screen always agrees with the face that came up. A Fellmark lights it gold, a Fellstrike lights it red.
- The breakdown arrives as remote truth and the view only renders it. Where the modifiers come from is the engine's business, so the shell carries a stub resolver sitting with the stub transport, fenced off from the view and marked for deletion when the phase four bridge lands. Nothing about the math lives in ThreadSpire.

## ThreadSpire round two rulings land on the shell

- The session log is one stream and every surface renders the same array, so the panel and the full log overlay cannot drift apart. Chat, rolls, and system lines are entry kinds on that stream, interleaved, newest at the bottom, auto scrolled. A chat box sits at the top of the log panel and the overlay carries its own, since mobile reaches the log through More. Chat text is escaped on the way in.
- A d6 sits bottom left of the play surface with a picker for Attack, Evade, Skill, or Generic. The type tags the roll in the log and in the event sent to the LoreMaster. On mobile the tray lifts clear of the battle drawer instead of hiding under it.
- The die is a CSS 3D cube that tumbles and lands on the rolled face. Faces come from a skin set keyed off the character, so dice skins are a texture swap and a cosmetic hook. Result and visual are separate layers: rollFromTray owns the number and the seam, animateDie is only told what landed, which is the seam a physics layer would replace later.
- The drawer's demo die is gone. One die, one roll path. The old copy also printed its own attack math, which was a second implementation of a rule the spec forbids reimplementing here. The tray reports the raw die and leaves modifiers to the engine.

## ThreadSpire becomes a play surface, spec and shell

- THREADSPIRE_SPEC.md rules the plan: ThreadSpire is the place players run the game, FellGlass keeps creation and remains the one rules engine, and ThreadSpire renders it. The spec carries the state seam, the LM-owned view state, the token model, six phases, and the decisions log from design review.
- docs/proto-threadspire.html is the phase one shell with placeholder art. Desktop: map stage, plaque rail, session log, character card cluster, one window shell closed by the X or a map click. Mobile: HUD strip, five slot icon rail with More holding Notes and the log, full screen windows, and the battle bottom sheet with a peek state. Combat flashes the vitality gem pink and the gem toggles the battle surface. Demo tokens drag with grid snap through the transport seam.

## The vault flows through: seeds and bakes reconciled to current canon

- The FellGuide vault is canon, so the July aspect rulings now flow the whole pipeline: canonFromVault regenerated the Lorebounds, Infusions, and Augmentations seeds, and genCanon rebaked every tool copy. Six aspects return to single-attribute scaling per the vault (the Aerostrix, the Boreal, the Felionis, the Mordel, the Slipfang, the Worgar), the Alkagoo and Aquafin reworks land, and the Agile infusion carries its shorter wording.
- FateWell's hand-kept aspect name list still carried Unbind, the Runesteed's old aspect, missed when the vault renamed it to Redoubt. Fixed, which is exactly the one-sided drift the gate exists to catch.

## CI check for vault-to-seed staleness, staged for the workflow

- The canon gate's biggest blind spot has its fix written: a workflow step that checks out the vault, reruns canonFromVault, and fails if any seed no longer matches its vault source, printing the exact fix. A vault canon edit can no longer sit silently unbaked once applied.
- The change ships as canon/canon.yml.proposed because a token without workflow scope cannot push workflow files. Applying it is two steps in the GitHub UI: copy the proposed file over .github/workflows/canon.yml, and add a VAULT_TOKEN repository secret with read access to the vault. Without the secret the step warns loudly and skips instead of failing.

## genCanon is trustworthy again and the gate watches it

- Fixed the trap in genCanon.js that would quietly regress two lorebound categories on any re-bake. The hand-kept ASPECT_META lookup still carried the obsolete Pyre and knew nothing of Redoubt or Kindle, so a run flipped both to support. The lookup is gone. The category now derives from the Lorebounds seed's own archetype field, which is the source of record, so it cannot drift again.
- The FellGlass aspect block is rebaked from the seed and committed, and a second run changes nothing.
- The canon gate's axis 1 now runs genCanon alongside the rules pipeline. A seed edit without a re-bake, or a hand edit to a baked block, fails CI with the exact fix printed. The same blocks stay under axis 3 co-change, so a stale bake and a one-sided edit are each caught by the axis built for them.

## Foes belong to their campaign, and leave with it

- Importing an adventure now stamps every foe and NPC it brings in with that campaign. They scope to it in the library and travel with it.
- Deleting a campaign deletes the foes and NPCs assigned to it, so testing adventures stops leaving a pile of orphaned copies behind. Foes marked Any campaign and foes tied to other campaigns are untouched.
- Import dedup is now per campaign, so each adventure carries its own set rather than silently sharing one that cannot be cleaned up.

## Foe rolls read at a glance

- A foe's card shows all its rolls on one line. The attack roll appears when the foe is attacking a player, and an evade roll appears for each attending player targeting the foe. The evade slot shows the moment a player targets the foe, so the roll is visible rather than buried in a resolve spotlight.
- Tap any die to roll or reroll it, or fill them all with Roll All. Player rolls stay off paper and are never entered.

## Roll All for the foe side, and Skill as a foe React

- One Roll All button in the combat runner rolls the whole foe side of the round at once. Every foe attacking a player rolls its accuracy, and every foe a player targets rolls its evade. Player rolls are read off paper, never entered, and every foe roll is logged. The foe accuracy and evade rolls already existed and stay rerollable in Resolve.
- The foe React on the Resolve card now offers Skill alongside its React abilities and Movement.

## Combat declare and roster, closer to one screen

- A foe's stance is fixed. The combat runner no longer offers a stance dropdown; it shows the stance the foe carries, read only. Switching stances is a player move, not a foe one.
- The foe React is its own control now that stance is locked. It offers a Skill, any of the foe's abilities, or none, and the choice shows on the Resolve card.
- The scene Roster edits vitality and conditions inline. A foe's health and its marked conditions can be changed straight from the Roster, the same object the combat runner uses, so a change in one shows in the other without leaving the screen.

## Insert a scene note anywhere

- Prep notes gain an insert point. In card view a + sits on each card's leading corner and drops a new note into that gap, which lands both between two cards in a row and between rows. In classic view a slim + rail sits between each card, vertical only. The trailing Add note still appends.
- The new note opens the editor straight away and slots into the tapped position rather than the end.

## Motivations grant a starting point

- Choosing a Motivation raises its Attribute by 1 at once, on top of everything from the track, origin, and lineage. It applies at creation and again each time a new Motivation is taken up after a Title.
- The grant fires when a Motivation is committed from an empty slot, which is the first pick and every post-Title choice, so the point lands once per Motivation and the field cannot be toggled to farm it.
- Creation copy no longer says a Motivation grants nothing. The Title still grants +3 when all three skills reach four masteries.

## Declaring for written-in players, done right

- Removed the duplicate player card I added. The real card is the token popup, and it already handled vitality, conditions, reroll, and dealing damage. Tapping a player's name on the resolution card now opens that one card.
- Written-in players get a light kit in the player editor: a stance and a short list of Acts. Nothing heavier, since a manual player has no full build.
- Their card gains a declare control that shows only for written-in players. Pick an Act from their kit and a target, and it runs in the spotlight like anyone else. A live player still declares on their own device.

## The loremaster can run players from the board

- Tap a player on the combat board to open their card. Edit vitality and afflictions, set charge, and declare their Act, target, and React.
- Written-in players (party members with no live app) carry a light kit on the card: a short list of Acts and a stance. The declare control fills from their Acts, so the spotlight runs them like anyone else. A loremaster running the whole table can declare for every player and foe, then resolve as usual.
- Live players show their own declaration as it comes in. You can still set it by hand if they step away, and their next sync takes over.

## Campaign in the editor, one image on the card, search clears clean

- The foe editor sets which campaign a foe belongs to. This ties it to a campaign so it stays off the shelf in your others, or Any campaign to keep it everywhere. The tag now saves to the account too.
- The display card shows one image, not two. The small header token is gone in favor of the full image.
- In the editor the image spans the full width with Choose and Remove beneath it.
- Clearing the library search restores the full list for the current scope. The grid renders every card and the search filters the view, so an empty box shows everything again.

## Name, image, and description live in the editor and on the card

- The foe editor edits name, image, and description directly. No trip to a separate editor. Name and description save as you type and sync when you leave the field. The image saves when you choose it.
- The display card shows the image and description, and combatants now carry the description so a foe reads the same on a scene board as it does in the library.
- New profile sits at the top of the library, above the search.

## Popups center on the scroll, and the library has a search

- Popups now center in the view wherever the page is scrolled, tracking the document's own scroll rather than a reported band or the click point. A long sheet caps its height and scrolls its own content.
- The library has a name search. Type to filter the shelf live, across the current filter and scope.

## The library keeps infusions, and popups land where you click

- Fixed the real save loss: a foe's infusions were never written to the account row. The sync stored build, stance, signature, augmentations, and Acts, but dropped infusions, so a reload came back without them. Infusions now save and load both ways.
- Editing a foe in its sheet now pushes the change to the account, not just the local copy. Before, only the create wizard synced, so later edits could vanish on a reload. Each edit autosaves. There is no save button because none is needed.
- Popups open where you clicked. The old logic clamped the card toward the top of the frame when the page reported its visible band as the whole frame, which put every popup at the top out of reach. It now anchors to the click in document space, which is correct in every embed, and holds its place as the page scrolls.

## Foes keep their whole kit, and the popups behave

- Adding a built foe to a scene no longer strips it. The rating scales vitality and attributes, but the infusions, augmentations, and Acts are whatever the loremaster built, kept in full at every rating. A Minion of a foe hits softer than a Forsaken of it and brings the same kit.
- The editor is fully unlocked. Infusions and augmentations are no longer capped by rating. Author as many as you want. Acts were already open.
- Popups now open where you clicked instead of at the top of the frame, and clamp into view when embedded. Clicking inside an open card no longer scrolls the view. The card holds its place and its scroll position through every re-render.
- The attach and roster popups have a name search. Type to filter the list, and empty sections fall away.

## The foe editor is unlocked

- Editing Acts no longer gates tiers by the foe's rating. All three tiers are open in the editor. A foe is authored in full, and the rating only trims the kit in a scene. Ratings apply in battle, not at the workbench.
## A canon drift gate guards concepts that live in more than one file

- A concept edited in one place and missed in its siblings is the recurring break. A new CI workflow, Canon Drift Gate, runs on every push and fails when a change drifts.
- Three checks. Generated staleness re-runs the rules build and fails if the committed rules.js no longer matches its source. The docs and embeds mirror check fails if any pair differs. Manual co-change fails when a push touches some but not all of a concept's sibling blocks, and it prints the exact canon-skip token to override.
- Eight concepts are mapped in canon.map.json: foe pack, weapons, aspects, skills, attributes, infusions, augmentations, conditions. Each inline block is fenced by a CANON start and end comment, so the checker knows its bounds and an editor sees the warning before an edit is lost.
- The gate lives in a new canon folder, not scripts, so a push never fires the live Wix apply. genCanon is left out of the staleness check for now. It errors on three targets and would regress two aspect categories, both recorded for a later fix.
- A companion doc, CANON_SOURCES.md, records the source of truth backlog worst drift first, the vault to seed CI blind spot as the next job, the dead data files, and the live issues found while building the gate.

## Foe vitality scales by rating again, never a baked ceiling

- The ceiling authoring baked a fixed vitality onto library foes, the Forsaken value, and that number then showed everywhere through effMaxVit. A foe rated Minion could report the Forsaken vitality, 88 against a level 5 party, instead of its own 18.
- Library foes no longer store a vitality number. It derives from the rating every time. The library sheet shows the derived value for the default rating and for Forsaken, read only.
- On load, every monster combatant re-derives its max from its own rating and the party, so foes carrying a stale or baked number correct themselves. Full-health foes stay full, wounded foes keep their wound clamped to the new max.
- Vitality is 7 times average party level times the rating share, unchanged. Minion 0.5, Elite 1, Champion 1.5, Epic 2, Forsaken 2.5.

## One foe card, display and editor, everywhere a foe appears

- Foes now render through a single card. A read-only display card shows the whole kit: build, stance, signature, infusions, augmentations, relics, Acts. The editor shows the same sections as live pickers. Display and editor read the same fields and the same rule text, so they stay in step.
- The scene roster, the session, act, and adventure rollups, and the board detail all use this one card. Monsters in the rollups are full cards now, not bare chips. Other entities stay chips.
- Every foe card carries an edit button that opens the editor. Scene cards keep the inline rating dial and a remove control.
- Removed the separate on-board abilities editor. Its edits did not survive a reload once the library became the source of truth, so it was a trap. Acts are authored in the one editor.

## Foe rating scaling survives a reload

- The reload path rehydrated a combatant from its authored library foe without trimming or scaling to the combatant's own rating, so per-scene ratings and the vitality that comes with them were discarded on every load. A Minion rehydrated the full Forsaken kit and kept whatever vitality it was stored with.
- Monster combatants now re-derive on load: kit trims to the rating budget in author order, attributes and vitality rescale to the rating. This also heals foes spawned before the ceiling model, so old scenes correct themselves on next open.
- NPC combatants are unchanged. They carry their authored kit with no rating scaling.

## Foes author at the ceiling and scale per scene

- A library foe is now built to the Forsaken ceiling. Its whole kit is authored once: up to three infusions, two augmentations, three Acts. A scene sets the rating it fights at, and the instance trims down from that ceiling in author order, first picked first kept. Attributes and vitality rescale to the scene rating. The library foe is never changed.
- Every foe takes infusions. Base Damage is at least 1 for any foe, so infusions always bite. The old gate that hid infusions from builds with no attack attribute is gone. The full catalog is open to every build.
- Fixed a drop: the four scene-spawn paths never carried a foe's infusions onto the board, so authored infusions vanished on attach. Combatants now carry infusions, and monInfo shows them.
- The scene roster card gains a rating selector and an edit button. Change the rating on the card and the foe re-derives from its authored self. The edit button opens the full foe sheet.
- The library sheet's rating selector is now a non-destructive default. Picking it no longer reforges attributes or refills the kit. It only sets the rating a foe starts at when added to a scene.

## The Vixel stops healing and the Runesteed builds walls

- The Vixel's Crown removed an Affliction, which is the Cawmarch's whole reason to exist. It now forces the enemy to target a different Fell or lose its Act. Every rung of the Vixel moves something, and none of them touch Afflictions.
- The Runesteed is rebuilt around Manifested. Its Aspect is Redoubt. It raises a barrier between a Fell and the attacker, and the attack strikes the barrier. The Branch widens the wall or thickens it. The Crown raises a line of them, or encircles the Fell.
- The Runesteed no longer negates a Combat Effect. Nothing does. A Combat Effect already clears with an Act and a Breakout roll, so no bond needs to answer it.
- Its archetype moves from restoration to mitigation.

## The Grimgrit scales with its owner

- The Grimgrit's Aspect deals Base damage equal to the higher of the lorebound owner's Vigor or Wit, and its second Branch deals Bonus damage the same way. FellGlass and the Lorebounds seed already said so. The canon pack and BondForge did not.
- The Grimgrit and the Solmera now read as the pair they are. Only the trigger differs, hit against missed.

## The Solmera answers a miss

- The Solmera was the Grimgrit. Same trigger, same verb, and a Branch that offered the same two ideas. Its Aspect answered a blow that landed, which is the Grimgrit's whole reason to exist. It now answers a blow that misses, the way the Guarding infusion answers what the Vengeful infusion cannot.
- Its Aspect is Kindle. Pyre belongs to a spell.
- The Aspect is worded exactly as Reprisal is, so the two lorebounds read as the pair they are.
- BondForge, FellGlass, FateWell, the CanonAspects pack, and the Lorebounds seed all carried the Solmera in four different shapes, and two of them already disagreed on whether the Combat Effect was chosen or random. They now agree.

## SigilForge weapon Afflictions and a truthful payload

- SigilForge carried its own weapon table, and the affliction sweep never reached it. It still named Persecuted, Dislocated, Restricted, and Defanged, four Afflictions that no longer exist, and eight more from the wrong family. Every one of the twenty seven forms now matches canon.
- A Spell recorded the weapon dropdown it left behind, so eighteen forged spells claimed to be a Shortbow. The payload now records the item a build was actually forged on, and a Spell carries its focus rather than a weapon.

## SigilForge weapon facts follow canon

- SigilForge carried its own weapon table, and the affliction sweep never reached it. Fourteen of the twenty seven forms named the wrong Fellmark Affliction, and four named an Affliction that has been deleted. Every forged ability printed it into its full text.
- The table is rebuilt from Weapons.canon.json. Grips and ranges already agreed.

## SigilForge timing costs nothing

- Resolving a combat effect before the roll no longer costs 1 more than resolving it after. When an effect lands is a choice about the fiction, never a purchase.
- The Vision forge, the randomizer, the budget breakdown, the Codex, and the timing tooltip all follow.

## The last two condition files follow the pack

- CanonConditions.seed.json still carried all 99 old conditions. It is rebuilt from the canon pack, 77 rows.
- FoePack.canon.json still offered foes 54 Afflictions. It offers the 37 that remain, with their rules and Breakouts taken from the pack.

## Weapons come from the vault

- Added the CanonWeapons collection, with a schema and a seed of all nine trees. Each row carries three forms, three Fellmark Afflictions, three grips, and three ranges.
- FellGlass reads the weapon trees from the vault and falls back to the pack baked into it. A row that names fewer than three Afflictions leaves the baked pack alone, so a half filled row can never blank a weapon or give all three forms the same Affliction.
- The seed matches the baked pack exactly, so provisioning it changes nothing until the vault is edited.

## FellGlass weapon afflictions cannot collapse

- The weapon catalog could be overridden from the vault, and that override read one Affliction for a whole tree. All three forms would have carried the same one. It now reads an Affliction for each form and keeps the inline pack when the vault does not carry all three.
- The weapon placeholder named Bleed, which is not an Affliction. A weapon with no Affliction now says so plainly instead of naming one that does not exist.

## Weapon afflictions follow the family

- Eight of the twenty seven weapon forms carried an Affliction from the wrong family. A Hatchet applied a Precision Affliction, a Wand applied one, a Long Sword applied a Magic Affliction. Every form now applies an Affliction of its own family.
- Two Afflictions were doubled. Impeded sat on the Crossbow and the Halberd, Crippled on the Great Axe and the Flail. Every form now carries an Affliction no other form carries.
- Weapons.canon.json still named Persecuted, Restricted, Defanged, and Dislocated, all four deleted. It is rebuilt from the same map.

## SigilForge forges Obscured

- Obscured joins the Combat Effects. It costs 3 and rides a No Damage ability only, since dealing damage ends it the moment it lands. That cost puts it out of reach of a Tier 1 build.
- The Xenophis, the Shadowmeld augmentation, and the Gloomcowl relic still grant it. A forged spell can now grant it too.
- 37 Afflictions, 34 Combat Effects, every one of them forgeable.

## Obscured stays

- Obscured was cut with the rest and should not have been. The Xenophis applies it through its Umbra Aspect, the Shadowmeld augmentation grants it, and the Gloomcowl relic hides a Fell in it. It is restored.
- SigilForge is canon for what an ability may forge. It is not the whole condition catalog. A condition an Aspect, an augmentation, or a relic applies now carries forgeable false, and Obscured is the only one.
- 37 Afflictions, 34 Combat Effects, 33 of them forgeable.

## The cut conditions are gone from every tool

- Three weapon groups applied an Affliction that no longer exists. The Flail now applies Crippled, the Halberd applies Impeded, the Ring applies Jinxed, and the Orb applies Masked.
- FellGlass no longer enforces Dislocated, Infected, or Withered. Vitiated now halves every kind of damage you deal, as its rule reads.
- The 54 affliction lists in FateWell, BrandForge, FoeForge, and SagaForge are trimmed to the 37 that remain, along with the CanonFoePack seed. The ForgeComponents seed drops the six cut Combat Effects.
- No tool and no seed names a cut condition.

## Conditions follow SigilForge

- SigilForge is canon for conditions. The canon conditions pack is regenerated from it. 37 Afflictions, 33 Combat Effects, 6 Impairments.
- 17 Afflictions and 7 Combat Effects are gone. Bonus Damage is added.
- A Combat Effect no longer carries a Breakout. Ten of them did. Only an Affliction is cleared by a Breakout roll.
- The foe signature affliction list is trimmed from 54 to the 37 that remain.

## SigilForge breakout skills

- Every affliction's Breakout skill carried a stray asterisk, so the Codex read Renewal star rather than Renewal. The mark belongs on the affliction, never on the skill that ends it.

## FateWell relics come from the relic catalog

- Fixed the relic list arriving empty. The canon relics live in the Relics collection, and the pool was reading Creations, which holds only what has been forged and submitted. All 58 canon relics now reach the foe sheet.
- A forged relic keeps its detail under payload meta, which the reader missed, so a relic you forged carried no group, rarity, or rule. It does now.
- A relic reads as its rarity, its group, how it is used, and what it does. Canon relics carry no rarity, so the line drops it rather than printing a gap.

## FateWell the foe sheet says what a foe is

- Choosing a Build now says what it carries and how it attacks. Choosing a Stance names its charge tiers. The signature affliction shows its rule. All three read the same way, a choice with its meaning under it.
- Items are relics, drawn from RelicForge. The weapon list is gone, since a Longbow was never an item a foe carried in this sense.
- Each relic sits in its own row with its rarity, its group, and what it does. Forging a custom relic saves it to RelicForge, not to a made-up item shelf.

## FateWell the foe sheet names the standard

- The vitality row now says what the rating stands at against this party, so a loremaster can see the standard before padding a foe that fights alone.

## FateWell foe vitality is a share of a Fell

- A foe's Vitality is now seven times the average party level, times the share its Shatter Rating is worth. A Minion is half a Fell, an Elite is one, a Champion one and a half, an Epic two, a Forsaken two and a half.
- The number of Fell at the table no longer changes a foe's health. A Minion held a whole player's Vitality, and every Fell who joined made every Minion harder. A larger party is answered by fielding more foes.
- Every reading of vitality, the attach, the re-forge, and the rescale, runs the one formula.

## FateWell foe vitality reads against a Fell

- Foe vitality no longer multiplies by the party size for every rank. A Minion carried a whole player's health, and every Fell who joined the table made every Minion harder. The count answers the party. The health does not.
- A Fell holds about seven Vitality a level. A foe is measured against that. A Minion holds a third of a Fell, an Elite holds a Fell, a Champion holds half again. An Epic and a Forsaken stand alone, so they alone grow with the party, since they alone take the whole party's damage.
- Ranks always climb. A small party can never leave a boss softer than the rank beneath it.
- All three readings of vitality, the attach, the re-forge, and the rescale, now run the same model.

## FateWell forged Acts and items report where they went

- A forged Act or item now says whether it reached your creations. The vault answers, and the tool tells you plainly if it refused.
- Forging while the tool is not connected to the site says so, rather than pretending it saved.
- The saved row now fills its kind and full text, so the vote hall reads it the same way it reads anything else.

## FateWell tooltips on a finger

- Every infusion, augmentation, item, affliction, and Act now carries a small info dot. Tap it and a card opens with its name and what it does. Hovering still opens it on a pointer.
- The dot never steals a tap from the chip, so a chip that taps to select still taps to select. Tapping anywhere else, or scrolling, closes the card.

## FateWell foe sheet reads the arsenal

- Hovering an infusion or augmentation now tells you what it does. The tool carried only their names, so no tip could ever appear. All 33 infusions and all 20 augmentations now carry their canon text, taken from the FellGuide.
- Items come from the arsenal. The dropdown lists every weapon and magic item by group, with a Forge a custom item option that saves to your creations. The free text box is gone.
- Removed the Add an Act row from the foe sheet. Acts are managed in Edit Acts, one slot per tier.

## FateWell foe sheet tooltips and a real Acts editor

- Hovering an infusion, augmentation, item, affliction, or Act on a foe sheet shows what it does. Afflictions read from the canon conditions pack, the rest from the collections. Anything the tool has no text for shows no tip rather than a guess.
- Fixed Act text never showing on a foe. The sheet read a field the Acts do not carry.
- Edit Acts opened the old library wizard. It now opens a proper editor with one slot per tier, each reading the forged Act shelf, canon and your own, filtered to that tier and to what the Shatter Rating allows.
- Each slot carries a Forge a custom Act option. A custom Act lands on the foe at once, joins the shelf for every other foe, and is written back to your creations so it outlives the session.

## FateWell campaign settings tab

- The adventure type, the party, the world, and what the world faces moved off the top of the campaign screen into a Settings tab beside Overview and Roster. The title now sits directly above the tabs.

## FateWell the party sets two numbers

- Set the party now takes only the average party level and the party size. The tool works out skill difficulty, discord points, and the Lore Points a battle rewards.
- Skill difficulty and discord show on the combat bar, and the Lore Points a battle rewards show with the spoils. None of the three appear on the campaign screen or in Set the party, since none of them are yours to set.

## FateWell the party drives the table

- Disruptions, the Discord pool, is the number of characters plus the average party level. It shows on the combat bar beside Difficulty.
- Skill difficulty climbs one for every five levels of the party.
- A battle now ends with Lore Points rewarded, one for each Shatter Rating category fought, with the ratings named so the number can be checked. The loremaster may pin a number for one scene, or for the whole adventure.
- Every one of these reads from the party and can be pinned by hand in Set the party. Set the number of players and their average level and the rest follows.

## FateWell one reading of the party

- Fixed a foe re-forging to a different vitality than it attached at. Two readings of the party disagreed. Attaching averaged the campaign roster, re-forging read the site roster and fell back to level 3 and a party of 4, ignoring the roster in front of you. Both now read one party.
- Added Set the party on the campaign screen. Pin the average party level, the party size, the skill difficulty, and a discord pool. An adventure with no players still scales its foes, and a pinned value holds until you clear it, so bringing players in later does not quietly move the numbers.
- Each field pins on its own. Leave one empty and it reads from the roster. The campaign line shows what the party currently reads as, and whether it is pinned or assumed.

## FateWell foes draw from the collections

- The foe sheet now pulls its Acts from the forged Act shelf rather than a blank text box. Pick one and it lands with its name, tier, and text, up to the rating's Act ceiling.
- Infusions, augmentations, and items merge the canon lists with anything the loremaster forged, and anything of theirs that reached canon. A custom pick is marked yours. A custom infusion still honors the build's attack families, and nothing shadows a canon entry of the same name.
- Acts the loremaster forged in SigilForge are usable at their own table now, not only the ones voted to canon.
- Editing Acts by hand is still there for a foe that needs something the shelf does not hold.

## FateWell one foe sheet everywhere

- The library, the roster, and the crucible now show the same foe sheet. It carries the shatter rating, vitality, build, stance, signature affliction, infusions, augmentations, items, and Acts.
- In the library and on a roster every field opens. Infusions and augmentations are picked from the pools the build and rating allow, and the sheet shows how many of the budget are spent. Changing the rating rescales the foe and refills its kit.
- In a crucible the foe is already on the board, so its forging is locked. Only current vitality and the conditions riding on it may change.
- Fixed re-forging a foe destroying its items. Infusions were being written into the inventory field. They live apart now, and existing foes are split on load, with infusion names moving across and real items staying put.

## FateWell runner toggle and quieter nav

- The List view now carries the Stepper and List toggle. Switching to List used to strand you there with no way back.
- Removed the keyboard and swipe hints from the scene nav row. The arrows and the swipe still work, they are just no longer announced.

## FateWell import sits with the adventures

- Choosing an adventure pack moved out of Settings and onto the Adventures screen, where it belongs. Import Adventure now sits beside Create an Adventure, and both appear when the shelf is empty so a first story can arrive either way.
- The New Adventure button reads Create an Adventure.

## FateWell library scope and bulk delete

- The library now scopes to the campaign you are on, showing assets tagged to it plus untagged ones, with a toggle for all campaigns. It matches how search works.
- Added Select. In selection mode a tap picks a profile rather than opening it. Select all covers only what is currently visible, so the type filter and the campaign scope both hold, and it flips to Select none once everything is picked.
- Delete removes every picked profile at once and names the count before it does. Scenes that already use a profile keep their copies, the same as deleting one.
- A profile tagged to a campaign now shows that campaign on its card.

## FateWell swipe the beats on a phone

- Swipe the note left for the next beat, right for the previous one. Scenes stay on their buttons.
- The swipe only resolves when your finger lifts, and a mostly vertical drag is left to the page, so scrolling is untouched. It stays quiet on buttons, at the first and last beat, in combat and list view, and behind a modal.

## SigilForge Vision forge understands affliction families

- The forge was told to pick afflictions by flavor across family lines. Its own guidance offered Frenzied and Terrorized as interchangeable fear afflictions when one is Precision and the other is Power, and pointed at Frozen and Ignited for builds that can never take them. That guidance is gone.
- Afflictions now reach the forge in three labelled family blocks, so the gate is visible in the shape of the list rather than buried in a column. The item fixes the family, and the family fixes which list the forge may read.
- When a build reaches outside its family, the forge is handed the afflictions it may actually use, and told it can change the item instead. It no longer just learns that it was wrong.
- The tier note now says a cost 5 affliction only fits Tier 3.

## FateWell keyboard runner fix

- The arrow keys did nothing because the guard watched the wrong screen. Run the Scene is the runner, not the scene editor. The keys now fire where they should.

## FateWell run the scene from the keyboard

- Down and up walk the beats in the stepper. Left and right walk the scenes, and right off the last scene carries you into the next session, the same as the button.
- The keys stay quiet while a modal is open, while you are typing in a field, when a modifier is held, and anywhere but the scene runner. In list and combat view the arrows leave scrolling alone, though left and right still move between scenes.

## SagaForge QA pass and scene rosters

- The export screen now runs a QA pass over the built pack and reports what it finds. Faults are worth fixing before it ships. Warnings are worth a look. The pack still exports either way.
- The pass checks a crucible carries foes and foes carry a crucible, every crucible has its LM note placed before it, no cost or gain line hides in spoken prose, no LoreMaster direction sits in a read-aloud, every scene names its cast, every dialogue speaker exists in the roster, the world issue is a complete sentence, a Legacy saga plants a hook, no two NPCs share a name, no foe carries a story NPC's name even buried inside a longer one, ids are unique, and the finale runs climax then consequence then resolution.
- Fixed the scene roster carrying only forged foes. An NPC present in the scene now lands on the roster whether they speak or not.

## SagaForge structure and consistency pass

- Fixed the world issue arriving cut off. It was sliced at 120 characters. It now ships as the complete sentence, and the premise asks for a question with two defensible answers.
- Fixed scene notes shipping empty. Each scene now carries a CAST block naming who is present, what they want, and the offscreen or unnamed forces driving the scene.
- The NPC roster now holds every named character with an identity, an allegiance, and an arc. It used to carry a name and one line.
- A crucible is a battle. The drafter only writes one when a fight is loaded, names the foes in the prose, and forks the objective the fight resolves rather than whether to fight at all.
- Every crucible now carries an LM NOTE - Before the Crucible secret block holding the choice, the trigger, the pressure, what happens if the party stalls, the tactical read, and the costs and gains. LoreMaster directions stay out of read-aloud prose.
- A foe can no longer share a name with a story NPC or another foe. Collisions are caught and disambiguated.
- The outline escalates toward the climax and ends in three moves: climax, consequence, resolution. The world issue is referenced at the climax and answered in the epilogue.
- The premise now fixes the one rule its central phenomenon obeys, and a Legacy saga names what it leaves for the next one. Both ride in the campaign notes so every scene inherits them.
- Foe briefings run through the house voice. They were the one prose path that skipped it.

## FateWell roster picker scoped to the campaign

- Adding an asset to a roster or attaching from the library now shows only the assets tagged to the campaign you are on, plus untagged ones. A one-tap toggle switches to the whole library when you need a foe or NPC from elsewhere.

## FateWell search filters, sort, scope, and asset campaign tags

- Search now has type filters you can combine: Structure (acts, sessions, scenes, notes), Assets (NPCs, foes, items), and Other (campaign, players, glossary, play log). With none picked it shows everything.
- Added sort: best match, name, newest, oldest, and by type.
- Added a scope toggle: search this campaign only, or across all campaigns. Cross-campaign results show which campaign they belong to.
- NPC, foe, and item records now carry a Campaign field you set directly in their editor. Assets tagged to a campaign show only in that campaign's search; untagged assets show everywhere. New assets also stamp a created date so they can be sorted.

## FateWell export an adventure as JSON

- Each adventure card now has an Export as JSON option in its menu. It downloads the adventure as a pack in the same format Import reads, so you can edit it in bulk and bring it back. The export carries the referenced NPCs and forged foes, clears the table state, and resets any fired hooks, so it lands as a clean copy. If an embedded sandbox blocks the download, a copyable text box opens instead.

## SagaForge crucible briefings

- Forging foes for a crucible now writes a LoreMaster briefing into the scene. It names the foes, says where they come from and why they are here, how they open the fight and what they want, and the one thing that turns the fight. The lineup is listed with each foe's tier, build, and stance. The player-facing scene keeps its cliffhanger; the briefing is a secret block only the LoreMaster sees, placed just before the crucible. Re-forging replaces the briefing rather than stacking it.

## SigilForge solo effects hidden on multi-target

- Cleaved, Refracted, and Redirected now only appear in the effect list when targeting is One Target. On a Two, Three, or All Targets build they are hidden, since they already reach a second target on their own. This mirrors the targeting lock that snaps to One Target when one of them is chosen.

## SigilForge effect list fix

- Fixed the effect list emptying when a multi-target was chosen. Picking Two Targets showed only two effects and Three Targets showed none, because a leftover Tier 1 filter hid every effect that pushed the build past cost 2. That filter is gone. Every legal effect always shows, and an over-budget build reads as a clear error instead.

## SigilForge solo-target effects

- Effects that already reach a second target on their own, Cleaved, Refracted, and Redirected, now lock the build to One Target. The multi-target options are disabled while one of these is chosen, so the second target is not doubled up. Gathered and Scattered still allow multiple targets, since they are built to move every affected target.

## FateWell modal centering

- Popups in FateWell now center on your screen when embedded. On open the tool asks the Wix page to bring the embed into view and report the window height, then centers the card in the visible band instead of guessing from the last click, which landed off screen in a tall iframe.

## SigilForge modal centering

- The review popup now centers on your screen when the tool is embedded. On open it asks the Wix page to bring the embed into view and report the window height, then pins itself to the visible area rather than sitting at a fixed spot in a tall iframe that scrolls away. If the tool runs standalone, it falls back to normal centering.

## SigilForge Vision forge stops asking questions

- The forge no longer asks clarifying questions. It always commits to a build, making the strongest reasonable choice when a description is ambiguous. The player adjusts the result by hand if needed.

## SigilForge Vision forge updated for v3

- The Vision forge now knows the current rules. It sees the damage packages (Standard, Double Base, Double Standard, No Damage) and their costs, the family-locked afflictions, and the hard tier budgets.
- It maximizes the build. When a forged build sits under the picked tier's ceiling, the forge is nudged once to spend the headroom with a costlier damage package, an added target, or a stronger effect that still fits the fantasy, rather than handing back a thin build.
- The tier is treated as a firm ceiling in the prompt, matching the tool: a build may not exceed its tier's budget.

## SigilForge tier is a hard budget

- The picked Tier is now a firm ceiling, not a suggestion. A build that costs more than the tier's budget is not valid. It shows Not a valid build in red with a clear error, rather than quietly forging a tier up.
- The budget bar always shows the picked tier's range, for example 6 / 3-4, so an over-budget build is obvious at a glance.
- Under budget stays a soft note. Tier 3 is open-topped, so a heavy Tier 3 build is fine.

## SigilForge status text

- The follows the rules line no longer shows next to a warning. A build that will forge a tier above the pick shows only the explanation, not a mixed all clear and warning.
- The status by the runes reads the truth: Forged as Tier 3 when cost carries it up, Tier N under budget when it is below the pick, Valid build only when it is on target.

## SigilForge tier truth

- A build now reports the tier its cost earns. Picking Tier 2 and spending 6 forges as Tier 3, and the build says so instead of claiming it follows the rules at Tier 2. The Tier selector is a floor: cost can raise a build a tier, and a weapon's Form still sets the lowest tier.
- Build warnings are consistent across tiers. Over the picked tier reads it will be forged one tier up. Under the picked tier reads it may be slightly weaker. On target reads clean.
- Submission sends the true tier, so the vault stores the build at the tier it actually is.

## SigilForge damage packages and Tier 2 fix

- Fixed Tier 2 hiding some cost 3 effects. The effect filter now only trims at Tier 1, which keeps Tier 1 cheap. At Tier 2 and 3 every effect shows, and a heavier pick simply lands the build in the tier its cost earns.
- Double Base Damage and Double Standard Damage are damage packages again, chosen in the Primary Damage dropdown, not combat effects. Double Base costs 2, Double Standard costs 3, and that cost counts toward the tier. Abilities can pick any of the three attack packages.
- Bonus is relabeled Bonus Damage and stays a combat effect.

## SigilForge All Targets fix

- Fixed the effect list going empty when All Targets was chosen, which left the build asking you to choose an effect that was not there. All Targets costs 4 and fills a low tier's budget on its own, so the effect filter was hiding everything. The filter now steps aside when the target cost already fills the tier, and the build's cost carries it to the right tier.

## SigilForge submit, stop the vault re-gating with old rules

- Fixed the backend rejecting valid v3 builds with messages like Hunted needs Tier 2 or higher and 2nd Form or higher. Those gates live in the old vault config. The tool now does the full v3 legality check itself, and the vault confirms only that the cost lands in the tier, matching v3 where tier is set by cost and there are no Form or Tier component ladders.
- The rule interpreter's authored path is v3 aware: a tier is defined by its minimum cost, and the top tier is open-topped, so a heavy Tier 3 build no longer trips an over budget error.

## SigilForge affliction full text

- The full description now reads Apply the (name) affliction instead of writing out the effect. The effect text lives in the FellGuide and the Codex. Combat effects still show their full rule.

## SigilForge damage by type

- Abilities must deal damage. The No Damage option is removed for Abilities, since a weapon strike always lands a hit. Spells keep both Standard Damage and No Damage, so a spell can be pure support or control. Foes keep both. The randomizer and the Vision forge follow the same rule.

## SigilForge affliction wording, keep the v3 changes

- Bleeding reads take your own Base Damage, and Vitiated reads Damage you deal is halved. These are the v3 balance versions and they stay. The canon Breakout Skills are kept.

## SigilForge afflictions matched to the FellGuide

- Every affliction now uses its exact FellGuide effect text and its canon Breakout Skill. The tool's placeholder breakouts and reworded effects are replaced with the source wording.
- Notable corrections: Bleeding deals 1 additional Base Damage, Vitiated halves Magic damage specifically, Vulnerable breaks out on Guard, and the full set of breakout skills now matches canon.
- Ruined is renamed to Disenchanted to match the FellGuide.

## SigilForge v3 fixes, round three

- Fixed the bug that broke the Ledger and Codex tabs and stopped the rune rendering on load. A dead handler was throwing during startup and halting the rest of the setup. The tabs work and the rune draws on load now.
- Full descriptions read as paragraphs. The damage sentence and the effect sentence sit together instead of on separate lines.
- Cleaved and Siphoned read as follow-on clauses: on a hit, deal Standard Damage, then deal the extra.
- Double Standard replaces the damage rather than adding to it: on a hit, the target suffers Double Standard Damage.
- Added Double Base Damage at cost 2, which replaces the damage the same way.
- Manifested now creates an object that has a Vitality of 1.
- Repositioned is a No Damage effect with a single description, no timing choice. Movement effects only show a before or after choice on an attack, since a No Damage action has no roll. Swapped works on both an attack and a No Damage ability.
- Builds show a tag: a gold Tracked tag when the effect must be tracked between rolls, a purple Affliction tag when the build carries one.
- Lucky reads correctly by type: your roll is Lucky on an attack, the target's next roll is Lucky on a No Damage ability.
- Removed the breakout reminder line and the Evasion note from descriptions. Afflictions will use their FellGuide text.

## SigilForge v3 fixes, round two

- Sabotaged no longer says including its effect on Evasion. It reads Ignore the target's Armor Stance, since the stance covers Evasion.
- Tier 1 abilities and spells no longer list cost 3 effects. Only what fits a Tier 1 budget shows. The heavier effects appear once you raise the Tier.
- Fixed the confusing tier message. The Tier you pick sets a budget target. Spending below it is allowed and shows a plain note that the build may be slightly weaker. Nothing turns red for being under budget.
- Added a language review file listing the shorthand and full description for every effect and affliction, generated straight from the tool, so the wording can be read in one place.

## SigilForge v3 fixes

- The rune now renders on load. A default effect is set so the forge shows a complete build from the first paint.
- The weapon tier floor is back. A weapon's Form sets its lowest Tier: the first weapon in a group forges Tier 1 and up, the second Tier 2 and up, the third Tier 3 only. So Shortbow is Tier 1+, Longbow Tier 2+, Crossbow Tier 3, and the same across every weapon group.
- Combat effects are grouped in the dropdown by type: Damage, Defense, Charge, Movement, Support, Utility.
- Afflictions are hidden at Tier 1. The affliction toggle only opens at Tier 2 and higher.
- The pre label is gone from the dropdown. An effect that can resolve before or after the roll shows a timing choice instead, and the timing reads in the shorthand and description.
- Shorthand and full descriptions are tighter. Shorthand names the effect, for example Sabotaged. On a hit, deal Standard Damage. The full description states the rule plainly, for example Ignore the target's Armor Stance. On a hit, the target suffers Standard Damage.

## SigilForge rebuilt on the v3 ruleset

- Abilities are now three inlays: damage, effect, and target, one each. Damage is Standard or None, both free. The effect inlay holds one combat effect or one affliction. The target inlay sets one, two, three, or all targets, and more than one spreads the damage, effect, and affliction to every target.
- Tier is set by total cost alone. No form ladders, no per component tier gates, no Spread or Amplify components. Afflictions cost 3 or more, so they never appear at Tier 1.
- Combat effects are shared across every weapon. Afflictions are drawn from the build's attack family: Bows, Blades, and Polearms are Precision, Swords, Axes, and Bludgeons are Power, Magic items are Magic. Weapons still grant their own signature affliction on a Fellmark.
- Effects resolve before or after the roll. A pre effect sets up the strike and costs one more. Afflictions always resolve on the hit.
- Magic bypasses Evasion. The LoreMaster rolls the target's Difficulty plus 1d6 against the attacker's Magic plus Mastery, and Magic afflictions can land without a wound on a No Damage ability.
- The Codex, the randomizer, the Vision forge, the rune, and the shorthand and full text builders all follow the new rules. All three build modes stay: Ability, Spell, and Foe.

# LoreFell Forge Change Log

Build batches pushed to this repo, newest at the top. The apply workflow is manual, so a push here changes the repo only. Collections change in Wix when the apply workflow runs.

## SagaForge moves off the web method to end the 504
- The 504 is the Wix web method timeout, about 14 seconds, which a cold model call can exceed at any size. The AI call now runs through a new http function, post_aiforge, which carries a longer timeout. SagaForge fetches it directly and falls back to the old relay only if the direct call is blocked.
- Two pastes: http-functions.js for the new endpoint, and the page code is unchanged. Confirm ANTHROPIC_API_KEY is in Secrets.

## SagaForge skeleton no longer cuts off
- A full Legacy or Chronicle outline was hitting the token ceiling and stopping mid word, leaving the last scene half written. The skeleton budget rises to 3500 and the backend ceiling to 4000, enough for a complete outline. A guard detects a cut off tail, re asks once for the whole outline, and prunes any trailing scene fragment so it never lands as a real scene.
- Re paste forge.web.js for the raised ceiling.

## SagaForge scrolls to the top on every step
- Advancing any step now brings the top of the tool into view reliably. It uses scrollIntoView on the top anchor, run after paint and repeated as the iframe height settles, which propagates up through the embed so the page follows even without page code. The page bridge also scrolls the Wix page when present.

## SagaForge skeleton builds in small phased calls
- The 504 was latency margin, confirmed by a tiny test call that returned instantly while the full 3500-token skeleton call ran past the Wix web-method wall. The skeleton now builds in phases: a small call for the act spine and threats, then one small call per act for its sessions and scenes, assembled in the tool. Premise trimmed to 450 tokens. Every call now sits well under the limit that SigilForge clears.

## Images host without blocking a large save
- A big chronicle that also carried a new image failed, because hosting the image meant sending the whole adventure uncompressed and that overflowed the field. Images are now hosted on their own, only the images go up, they come back as shared links, and then the adventure saves compressed. A large chronicle and its cover art both save now.
- Paste: page-fatewell.js, it gained the image hosting step.

## Adventure cover image saves from the list
- Setting an adventure cover from the adventures list did nothing because the save looked at the currently open adventure, and none was open. It now resolves the adventure by the one you picked, so the cover lands, hosts, and shows.

## Images are hosted and shared again
- Compression had sidelined the image hosting step, so cover images were not being uploaded to shared media. Now an adventure that carries a freshly added image saves uncompressed once, so the page bridge uploads each image to hosted media and hands back a short link. Those links fold into the adventure, so the next save compresses cleanly and every player who loads the adventure sees the images. Large chronicles still compress once their images are hosted links rather than embedded data.

## Images save again
- The save was deleting images off the working copy before storing, a leftover from before compression existed. Now that the whole adventure is compressed, images ride inside it and take little room, so nothing is stripped. The save no longer touches your live images, and an uploaded image is kept at the smallest size it reaches rather than discarded for being over a raw byte budget.

## The Sync button compresses too
- The per adventure autosave already compressed, but the Sync button and first connect used a separate bulk path that still sent the adventure uncompressed, so a large chronicle failed there. That path now slims and compresses each adventure the same way, so every save route fits the field limit.

## Chronicles save at any size
- A prose heavy chronicle carries more text than a single account field can hold, which is what the too-large error was. The tool now compresses the adventure before it goes to the account and expands it on load, so even a large chronicle stores in a fraction of the space. A test chronicle well past the limit compressed to a small fraction of the cap. Import, editing, and the runner are unchanged, the compression happens only at the save and load boundary.
- Paste: fatewell.web.js and page-fatewell.js, both handle the compressed payload.

## Large chronicle save, the real fix
- The slimming only worked when a spawned foe still pointed at a live library entry. After the library cleanup those links were broken, so the foes stored full size and the chronicle stayed over the account limit. Slimming now relinks each foe to a surviving library entry by name, and adopts one if none exists, so every spawned foe stores as a light reference. A six act chronicle drops well under the limit and rehydrates in full on load.

## Large chronicles save again
- A spawned foe copied its whole stat block onto the scene, and a full chronicle with hundreds of foes pushed the stored adventure past the account field limit, so the save failed and blamed an image. The saved copy now stores each spawned foe as a light reference and rebuilds its stats from the library on load. A six act chronicle drops well under the limit, and the live board keeps full stats throughout.

## Reimporting an adventure no longer clones its foes
- Import minted a fresh library entry for every foe and NPC each time, so reimporting the same adventure stacked duplicate after duplicate until the library grew large enough to break the account save. The save then blamed an image, wrongly. Import now reuses an existing library entry with the same name and type instead of adding another, so reimports are clean.
- The too-large-image message was firing for a bloated library, not an image. The underlying cause is fixed.

## Heavy images no longer block the account save
- A large image stored on an adventure could exceed the account field limit and fail every save, even after the image was removed in the interface, because the data still sat in the record. The save now clears any oversized image before sending and tells you once, so the save goes through.
- Uploaded images are shrunk to a byte budget, stepping down quality then size, so a full size photo cannot produce a value too big to store.

## Outline fields stay plain text, and the wordmark matches
- Pasting into an act, session, or scene field could carry heading or other markup into the outline. Every editable field now forces plain text on paste and flattens any markup that slips in, so no more bumping to a heading or pasting as plain text by hand.
- The SagaForge wordmark now colors Forge in gold like the other forges, on a silver base.

## Act walk edits no longer vanish, and sessions can be removed
- Adding a scene or session wiped everything you had typed in the act because the edits were not read back before the view redrew. Every add and remove now captures your edits first, so nothing above the change is lost.
- Sessions can be removed in the act walk, matching scenes. The last session in an act is protected so an act always holds at least one.

## SagaForge builds the outline act by act
- Scope gains a structure choice. Let the forge decide as before, or set it yourself with the number of acts, sessions per act, and scenes per session. Acts and sessions are held exactly, scenes are a target the forge can vary by one or two.
- After Scope the outline is built one act at a time. Each act is forged on its own, and you recast just that act with a note or edit its sessions and scenes by hand, then lock it. Only then is the next act forged, and it follows on from the acts already locked. The forge never drafts the whole structure in one shot, so it cannot railroad the shape.
- You can step back to a locked act, add or remove sessions and scenes by hand, and the whole-outline recast still waits at the end for a final pass.

## Re-forge a foe to a new rating
- A foe can be bumped or dropped to a different Shatter Rating and it re-derives to match. Attributes and vitality rescale to the tier, infusions and augmentations fill or trim to the tier budget, and Acts trim to the tier ceiling. Existing picks are kept when the tier allows, so a hand tuned foe is not wiped.
- Available in prep from the Library, on a foe's options menu, and in the crucible from a combatant's panel for a mid fight escalation. Infusions and augmentations fill from canon, family matched to the build. New Act slots are yours to fill in the ability panel.

## Forged foes are built out like FoeForge
- SagaForge now gives each foe its full arsenal by tier, the way FoeForge builds one. Infusions are family matched to the foe's build and counted by tier, augmentations are counted by tier, and Acts come from canon. A Minion carries none, an Elite one infusion and one Act, a Champion two infusions, one augmentation, two Acts, an Epic three infusions, one augmentation, three Acts, a Forsaken three infusions, two augmentations, three Acts. A build with no attack attribute carries no infusions.
- Infusions and augmentations ride through the pack onto the imported foe, survive the account library, and spawn onto the scene. The scene ability panel shows a foe's infusions and augmentations alongside its Acts.

## Forged foes carry canon Acts
- SagaForge now gives each forged foe real Acts, drawn only from the canon abilities and spells marked canon in the Creations collection. The forge picks Acts that fit a foe's build and tier, capped by tier: a Minion carries none, an Elite one, a Champion two, an Epic or Forsaken up to three. Nothing is invented, and anything outside the canon pool is dropped.
- The Acts ride in the pack and land on the imported foe, so a crucible opens with foes that have their kit, editable in the scene ability panel before the fight.
- Paste: page-sagaforge.js, it now hands SagaForge the canon Act pool.

## Crucibles arrive with their foes, and you can edit their kit
- Importing an adventure now spawns each crucible scene's forged foes straight onto its board. A scene that expected a Champion and three Minions opens with them present, numbered and statted, instead of empty. NPC and item references stay as references.
- Every combatant on a scene has an abilities panel, reachable before you run the fight. View and edit each foe's abilities and spells, name, tier, and effect, so a LoreMaster can shape the kit ahead of the crucible. Forged foes start with their base attack and stance, and you add the rest here. Auto generated abilities remain the later stage.

## Imported scenes open all the way
- The scene roster read fields an imported scene never had, so opening a scene crashed the same way sessions did. Migrate now brings every scene up to the full scene contract, the attendance map, play log, discord pool, and loot table included, so imported and older scenes open through roster, notes, and the runner without a missing field taking down the view.

## Imported foes and NPCs stay put
- On a hosted account the library syncs separately from campaigns, and the account copy overwrites the local one on every load. Import added foes and NPCs to the local library but never saved them to the account, so the next sync wiped them. Import now writes each imported foe and NPC to the account, and their full stats round-trip through the Assets store.

## Imported sessions open again
- Opening a session on an imported adventure crashed because its scenes had no combatants array, and the session view read the foe count without a guard. Migrate now backfills combatants, refs, and manualRefs on every scene, and the session view guards the read. Imported adventures open all the way down to their scenes.

## FateWell survives a campaign that predates the players field
- Older or imported campaigns without a players array crashed the whole screen the moment it tried to render their summary. Navigation looked broken across the tool because render itself threw. FateWell now backfills a missing players array and world issues array on load, so any campaign renders, and it guards the summary line directly.

## Import no longer stalls on a forged adventure
- A SagaForge scene has no combat state until you run one, but the importer assumed every scene already had a battle object and threw the moment it read one that did not. The import died silently and the screen sat on Reading. Scenes now get a battle object if they lack one, and the importer surfaces any real error instead of hanging.

## Faster import
- Importing an adventure was syncing every campaign in your account to the server at once, one slow write per campaign, stacked on top of the normal save. Import now persists only the adventure it just added. The full sync stays where it belongs, on the Sync button and on first connect.

## Recast, not redline
- Renamed the outline and scene revision controls from Redline to Recast, a forge word that fits LoreFell. The action is unchanged, tell the forge what to change and it reshapes what it made.

## SagaForge lets you redline the skeleton
- The outline step gains a redline field. Tell the forge what to change and reforge, and your instruction folds into the rebuild and overrides the defaults. The field edits you make by hand still hold, and Forge fresh stays for a clean rebuild.
- Baked a canon default into the outline prompt: the Fell are newcomers to the place, strangers walking in, never natives returning. Stops the forge inventing a shared past the Fell never had.

## SagaForge writes cleaner and stops scolding
- The house voice baked into every SagaForge prompt now carries the real rules from the voice guide: show through observable detail, cut structural negations, cut interpretation in place of the thing, no told mood, no AI stock phrases, a specific over a vague detail. Drafts come out sounding like a person, not a model.
- The banned glyph warning is gone. SagaForge now auto cleans the mechanical marks it used to flag, em and en dashes, ellipses, semicolons, double hyphens, so the draft arrives clean. Your redline field stays for your own edits.

## The world opens when the LoreMaster says so, and maps travel inward
- FateWell gains a world veil toggle beside the reveal controls. World veiled keeps ThreadSpire's world layer closed to players. World open to players lifts it. The choice saves on the campaign and ThreadSpire reads it, so the gate is finally the LoreMaster's to open.
- ThreadSpire now shows what the world faces on the world layer, pulled from the conflicts authored in FateWell.
- The nodes placed in The Cartographer are live. A map shows its hotspots, a discovered one glows and travels inward when tapped, an undiscovered one sits veiled and dim. The zoom and the placed nodes are now one system.
- Pastes: fatewell.web.js (getWorldMeta), page-threadspire.js (reads world meta).

## The Cartographer, and ThreadSpire loads real maps
- A dev only tool for placing map art and travel nodes. Pick a world, territory, or location, give it a map image and lore, then tap the map to drop the nodes players click to travel inward, each pointing at a child node. Positions are stored as percentages so any art size holds. Saves to the new SphereArt collection through an admin only backend.
- ThreadSpire now paints each layer from SphereArt. A node with placed art shows its map, the placeholder stripes only remain where art is not set yet.
- New: schemas/SphereArt.json, backend/sphereart.web.js, docs/the_cartographer.html, page-cartographer.js. ThreadSpire bridge extended to load art. The Cartographer is a dev route, not on the Hearth.

## ThreadSpire rebuilt, character first
- ThreadSpire is no longer a lore atlas on the Hearth. It lives on the character sheet, reached from the Sections hub, and opens on that character's token. Tap the token for a reference card: image, name, player name, lineage, origin, motivation, arsenal, talents, and the character's blurb. The owner gets a button through to the full sheet.
- Zoom outward through the journey: token to location to territory. The world stays veiled until the LoreMaster unlocks it. The location shows the party's goals from the quest board, checked or not. The world will show what it faces. Other Fell standing at a location open a read only card.
- Maps are placeholder art for now, wired through a SphereArt seam so real art and clickable nodes drop in world by world with the dev map tool to come.
- Pastes: characters.web.js (a safe public character view with the player's display name), and the rebuilt page-threadspire.js. The old atlas version is replaced.

## Worlds carry the conflict an adventure brings them
- FateWell campaigns with a world set can now name what that world faces. Each conflict is a single sentence, up to 120 characters, and a campaign can hold several. They are campaign scoped, so two parties in the same canon world show their own conflicts. ThreadSpire will surface these on the world layer.
- SagaForge asks the same question at the premise step, What the world faces, drafts a sharp sentence from the pitch, and carries it through the pack. FateWell imports it as the campaign's first world issue, ready to edit or extend.

## Summon foes straight into a crucible in FateWell
- A Summon foes button on any scene forges a legal canon lineup and drops it onto the board as ready combatants, no trip to FoeForge and no import. Pick a difficulty, skirmish, standard, boss and lackeys, or climax, and the forge composes the encounter to it, scaled to the party level and size.
- Foes are canon only, legal by construction, using the same pack and scaling math as FoeForge and SagaForge. This does not rebuild FoeForge inside FateWell, hand built foes still belong there.

## Multi-foe crucibles, and drafting inside FateWell
- SagaForge now forges a lineup per crucible, not a single foe. A block per foe with a count, so a Champion with three Minions or a warband of Elites all land as numbered ready combatants attached to the scene. The forge composes the encounter to the stakes.
- FateWell can draft a scene in place. A Forge with AI button on any scene calls the worker and appends typed blocks in house voice, reusing known NPCs and foes and continuing from blocks already there. No leaving for SagaForge and reimporting to flesh out one scene.

## SagaForge forges canon foes for its crucibles
- Stage 1 of the foe pipeline. When an adventure has crucible scenes, the export step offers Forge the foes. SagaForge picks a legal canon build, tier, stance, and signature affliction for each fight, scaled to the party level with the same math FoeForge uses, and emits each as a ready monster in the pack, referenced by its scene.
- On import, FateWell adds the forged foes to the library and wires each crucible scene to its foe, so the fight lands ready to drop onto the board. Older packs without foes import unchanged.
- Foe choices are canon only, legal by construction. Custom on the spot abilities through the SigilForge validator are the next stage.
- The foe canon pack is now a shared data file so SagaForge and FoeForge draw from one source.

## SagaForge sharpens a premise before the skeleton
- A new Premise step sits between Scope and Skeleton. The forge drafts five lines from the pitch, Situation, Intrusion, Opposition, Clock, and Cost, and shows them for edit and approval before any structure is built. Each answers a question a storyline cannot hold without: the world already wrong, the specific event that pulls the Fell in, who wants it to continue and why they are right from where they stand, what worsens while the party delays, and what winning will demand.
- The approved premise drives the skeleton. Opposition seeds the act threats and the antagonist, Clock becomes the visible pressure, Cost becomes the ending's price. A LoreMaster who cannot fill the Opposition line learns the idea is not ready, which is the point of the gate.
- SagaForge refreshes on its own.

## FateWell can reveal a single place, not just the world
- The reveal control gains Reveal a place beside Reveal world. It lists the campaign world's maps, locations, and scenarios in reading order, indented by depth. Revealing one cascades upward to its map and world and never downward, so a location never spoils its scenarios.
- The baked Sphere tree now carries node types so the picker can group places without a backend call.

## ThreadSpire Stage B, discovery earned at the table
- Fog is now per campaign. The LoreMaster reveals a node from FateWell and its path to the Sphere reveals with it, worlds and maps above a location, never the scenarios below, so a place never spoils its own secrets. The reveal cascades upward only.
- New ThreadSpireDiscovery collection, keyed by campaign and node, written by the LoreMaster, read by players in that campaign. Backend methods revealNodes, hideNode, listDiscovered mirror the quest board pattern.
- ThreadSpire, given a campaign, asks the page for that campaign's revealed set and lifts exactly those out of fog on top of the always public worlds. FellGlass carries the campaign through its Sphere link so a player lands on their world with their party's discoveries showing.
- myAdventures now returns each campaign's worldId, completing the Stage A auto link.
- Pastes: characters.web.js, fatewell.web.js, page-fatewell.js, the new page-threadspire.js. Push the ThreadSpireDiscovery schema so the Apply CMS action provisions it.

## ThreadSpire, and campaigns get a world
- ThreadSpire is live, the Sphere explorer, with a Hearth tile between FellGlass and FateWell. Public worlds are open, campaign material stays veiled.
- FateWell campaigns can now be anchored to a world. The adventure header shows the world with a Set world or Change world control, sourced from the canon world list baked from the ThreadSpire graph. The choice saves on the campaign and survives publish and import.
- SagaForge carries its world through the export pack as a hint, and FateWell matches that hint to a real world on import so a forged adventure lands anchored.
- FellGlass shows See this saga in the Sphere on a character whose campaign has a world, opening ThreadSpire focused there. This needs the adventures list to carry worldId, one backend addition noted for the paste.

## SagaForge builds conflict first
- The skeleton was producing well organized tours, scene after scene of the Fell witnessing and learning. The outline prompt now demands a struggle the party can lose. Every act carries a THREAT line naming who opposes the Fell and what is at stake, both shown and editable in the skeleton view and fed into every scene draft in that act. Scene purposes take active verbs, at least one scene per session forces an irreversible costly choice, the opposition worsens on its own visible clock, the antagonist holds a specific defensible belief stated plainly, and the ending poses a hard choice with a price rather than a clean victory.
- The scene drafting gains craft rules for the table. Every scene contains a decision or an opposing push, never information alone. Read alouds run short and sensory and end on motion or wrongness. NPCs want something from the Fell and fear something. Clues cost something to obtain. Crucibles state what is lost by fleeing. Scenes end on a hook or an advancing threat, never a tidy close.
- SagaForge refreshes on its own.

## SagaForge skeleton drops JSON too
- The last JSON parse error was the skeleton, not the scenes. Act, session, and scene names and purposes are prose, and an apostrophe or colon in a purpose broke the JSON the same way scene bodies did. The skeleton now comes back as TITLE, ACT, SESSION, SCENE lines and parses as text. Both the outline and the drafting are now JSON free where prose lives.
- Verified against names and purposes carrying apostrophes and colons across nested acts.

## SagaForge stops fighting JSON, drafts in delimited blocks
- The recurring parse error was structural. Asking the model to pack multi paragraph prose into JSON string values means every quote, apostrophe, and newline is a chance to break the shape, and no repair pass wins that reliably. Scenes now come back as marked text blocks, @@BLOCK to @@END, which the tool parses as text. Prose can contain anything, there is nothing to escape.
- Verified against prose with embedded quotes, apostrophes, colons, and line breaks. The skeleton still uses JSON since it is short and structural.

## SagaForge uses the fast model to beat the Wix timeout
- The 504 is the Wix web method execution wall, not token count. A cold Sonnet call to generate prose can run past it. SagaForge now requests the faster model through a new model flag on aiForge, which returns inside the window. The stronger model stays the default for every other forge.
- Scroll to top still requires the updated page-sagaforge.js from the prior change to be pasted, the tool side drives all scrollers but the parent page jump depends on that handler.

## SagaForge survives a malformed draft, and scrolls up reliably
- A scene sometimes came back as JSON with a raw newline or a trailing comma inside it, which killed the whole parse. The parser now repairs the errors models actually make, unescaped newlines and tabs inside strings, trailing commas, smart quotes, before parsing. If it still cannot read the shape, the scene is asked once more for valid JSON before surfacing an error.
- The scroll to top now drives every possible scroller, the iframe window, the document root, the body, and a top anchor it scrolls into view, alongside the parent page message. It no longer depends on the parent handler alone.

## SagaForge drafts scene by scene to beat the 504
- The session draft was one large AI call, which ran past the Wix web module timeout and returned a 504 gateway error. Drafting now runs one scene at a time in small sequential calls, each well under the limit, accumulated into the session before the approve gate. The approve and redline flow is unchanged.
- A scene that fails can be retried on its own, resuming rather than restarting the session.
- SigilForge worked because its single call caps at 700 tokens; SagaForge sessions were far larger.

## SagaForge scrolls to the top on each step
- Advancing the flow now returns the page to the top of the embed, reaching the parent page rather than only the iframe. Covers the step buttons and the two AI transitions, drafting a session and moving to the next.
- The relay unreachable message is a setup signal, not a tool bug: the page code is not yet relaying. Confirm page-sagaforge.js is pasted and published, the embed element id matches EMBED in the paste, and ANTHROPIC_API_KEY is in this site's Secrets.

## SagaForge — forge an adventure, one approval at a time
- A new forge for LoreMasters. A guided flow runs the whole build: the pitch in a sentence, a scope interview keyed to the adventure size, a skeleton of acts, sessions, and scenes approved before any prose, then one session drafted at a time in FateWell typed blocks with approve or redline gates. Nothing is written until the structure is agreed, nothing advances until the draft is accepted.
- Sizes are the four FateWell already knows: Tale, Story, Legacy, Chronicle, with the same recommendations and the same structure rules. Tale and Story ride an implicit act, Legacy and Chronicle carry visible acts.
- The house voice is enforced twice, in the drafting prompt and by a scrub on every returned draft. A violation triggers one silent correction pass, and anything that survives is flagged in red for the redline.
- NPCs are first class. The forge gathers the cast as it drafts, keeps them consistent across sessions, and exports them as library rows so dialogue color codes by speaker on import.
- Three exports: a FateWell pack that drops straight into the existing Import as your own editable copy, a markdown module, and a print stylesheet in the navy and gold for PDF.
- The AI runs on the shared aiForge relay over the same postMessage rails as SigilForge. Drafts persist locally, so a half built adventure survives a closed tab.
- The Hearth's LoreMaster wall carries the SagaForge banner touchmark and routes to /the-sagaforge.
- One paste, page-sagaforge.js, and one Wix page to create at /the-sagaforge with the embed pointed at the Pages URL.

## FateWell modals land where you clicked
- Confirm and name dialogs, including delete and publish an adventure, were pinned to the top of the embed by a fixed backdrop. In a tall Wix iframe that top sits far from where the loremaster is looking, so the popup opened off screen. The dialog now anchors near the click, the same pattern the combat overlays already use, and stays reachable at any scroll.
- FateWell refreshes on its own.

## Blank boards tell the truth
- The gallery and quest reads now report whether they actually reached the data. Before, a network failure returned an empty list, indistinguishable from a hall or board that is genuinely empty, so a player saw nothing and assumed nothing was there.
- The LoreForge now shows The hall could not be reached on a failed read, separate from the Nothing forged here yet empty state. The FellGlass quest board warns and keeps the last known board rather than blanking it.
- Clue cards were left as they are, their shape is consumed directly and they were not the source of the confusion.
- Pastes: forge.web.js, fatewell.web.js, page-loreforge.js, page-fellglass.js. Tools refresh on their own.

## Runeguard and Bulwark enforce at the table
- The player sheet now reports its equipped augmentations and its highest defensive attribute with every combat sync. No paste needed, the sheet sends more and the board reads it.
- When the LoreMaster deals damage to a Fell, the deal panel shows every eligible guardian. Runeguard reduces the Base Damage in the input by the guardian's highest defensive attribute. Bulwark redirects the whole hit to the guardian, who confirms it on their own sheet under the ownership rule. Each spends once a round and resets at round start.
- Mobility range stays table judged, the buttons say if in range, since the tools do not model positions.
- Both tools refresh on their own.

## Aspect targeting enforced
- The lorebound Aspect React now carries a target. The card lists every ally in the fight, and Yourself appears only once that bond reaches Corsair form, so the no self benefit rule enforces itself at declare time. The chosen target folds into the React line the LoreMaster sees, Scour then an arrow then the ally's name, with no bridge or backend change.
- With no ally in the fight and the bond below Corsair, the card says plainly that the Aspect has no valid target.
- FellGlass refreshes on its own. No paste.

## Combat declares stop failing silently
- Every declare now carries a request id and expects an ack from the page. If no ack lands in seven seconds it resends once on its own, and if that also goes unanswered the player gets a plain warning to declare again. An explicit rejection from the backend warns immediately.
- Combat state syncs ack too. A failed sync warns once and heals on the next change, since syncs fire on every edit.
- One paste, page-fellglass.js. FellGlass refreshes on its own.

## Weapons carry their real canon
- New seed, data/Weapons.canon.json, extracted straight from the vault's Weapon Trees: nine trees, twenty seven forms, each with its Fellmark Affliction, grip, and range. The generator now rebuilds FellGlass's WEAPON_DB from it, so the weapon data joins the single source pipeline.
- The afflictions in the tool already matched the vault exactly, the stale note in the backlog was wrong about that. What was placeholder was grip and range, which now render per form: One-hand or Two-hand, and the true range number.
- weaponAff and the affliction landing plumbing were already correct, they now simply run on verified data.
- FellGlass refreshes on its own.

## Branch and Crown picks lock on commit
- Choosing a Branch or Crown now asks for confirmation and then locks. The sheet shows the committed pick as a plain fact, no re-pick. Level gates were already in place, Branch at Companion form and Crown at Corsair.
- The pick also saves immediately on commit instead of waiting for the next edit.
- Paragon Point changes are out of scope until that system is designed.

## Canon becomes single source
- New generator, scripts/genCanon.js. It rewrites every baked canon dataset in the tools from the seed files: the ShardForge infusion and augment catalogs, the FoeForge augmentation list, the conditions pack in FateWell and FellGlass, and the FellGlass Aspect fallback. A canon edit now touches one seed file, then one command regenerates everything. The run is idempotent.
- The first run already caught a real drift: FoeForge still carried the old Shadowmeld wording under a variant the hand edits missed. It also brought the FellGlass Aspect fallback up to the reworked canon, Vigor or Wit scaling, chosen effects, the capture tiers, so standalone previews no longer show stale rules.
- Ritual addition: after any seed edit, run node scripts/genCanon.js, then the usual validate and copy steps.

## Quests flow from the LoreMaster's table to the players' sheets
- A new Quest note type in FateWell. Write the task as a note, then post it to the quest board from the run view. The note carries its board state: post, mark complete, retract, or post again after a retraction.
- FellGlass grows a quest board above the discovered clues. Every character linked to the campaign sees the same board, open quests plain, completed quests struck through. It polls with the clues, so a posted quest reaches the table within the same beat.
- The board lives in a new QuestBoard collection keyed by campaign and note, upserts carry the full record. The Apply run creates the collection.
- Three pastes: fatewell.web.js, page-fatewell.js, page-fellglass.js. Both tools refresh on their own.

## FellGlass — characters stop bleeding into each other
- Two races fixed. Switching characters could fire a queued autosave from the previous character against the one just loaded, writing its lineage, origin, motivation, and name onto the wrong record. A load guard now blocks autosave while a character loads in, and any pending save is dropped the moment you switch, so edits can never cross records.
- Combat leaked across the switch too. The previous character's combat state, staged declares, evasion, and marks stayed live until the new fetch returned. Switching now clears the combat state and its flags first, so each character shows only its own fight.
- FellGlass refreshes on its own.

## FellForge — bring your own name
- A name field sits under the rolled suggestions. Type your own and it claims the sheet, or tap a suggestion as before. Typing clears the chip highlight, tapping a chip clears the field, and a reroll clears both. The note no longer promises a bring-your-own step that did not exist.
- FellForge refreshes on its own.

## Movement corrected to a React
- Movement spends your whole React, not your Act. My earlier build had it backwards. The Act stays free, so you can move on your React and still attack, use an ability, cast, or use a skill on your Act the same round. Both tools log it as React spent, Act still free.
- The once per round movement limit is already enforced, since Movement is a React and the React is spent once per round.
- Agile is the exception and still grants a free movement during your Act, in addition to React movement.
- Both tools refresh on their own.

## Thistlewing initial reworded
- Thistlewing now creates a rune or trap in the lorebound owner's inventory, distinct from Alkagoo's potion or tablet into the targeted Fell. Branches and crowns still mirror.

## Obscured reworded
- Obscured now ends when you deal damage or are dealt damage. The end of next round clause is gone, so the effect lasts until either of you lands a hit. Updated in the condition data, the seed, the Lumitoad grant that describes it, and the baked copies in FateWell and FellGlass.
- Reseed CanonConditions if it serves from the CMS.

## Lorebound Aspects, attribute sweep and capture tiers
- Every Aspect that scaled a heal, prevention, or bonus off a specific attribute now uses the higher of the owner's Vigor or Wit. This pass caught Aerostrix, Mordel, and Slipfang alongside the earlier set. Zeroing effects like Evasion becomes 0 stay, they are not attribute scaling. Vixel, Solmera, and Runesteed left untouched for a later redesign.
- Alkagoo and Thistlewing capture wording clarified. The branch captures one Tier higher up to Tier 2, the crown captures one Tier higher again up to Tier 3, so skipping the branch caps the crown at Tier 2 on its own.
- Seed is the source. Reseed CanonAspects so the tools carry it.

## Lorebound Aspects reworked
- Nine Aspects revised and two global rules applied across all eighteen, in the Lorebounds seed data. Aquafin gives the prevented Charge to another Fell in range, owner on the second branch. Boreal prevents by the higher of Vigor or Wit. Alkagoo copies into the targeted Fell rather than the owner. Drakelith's second crown gives a single target the Unlucky Affliction. Felionis prevents Base damage on the branch and hits all enemies in range on the crown. Grimgrit deals Base and Bonus by the higher of Vigor or Wit. Thistlewing now matches Alkagoo. Vixel's crowns choose their effects rather than rolling at random. Worgar manifests into the Fell's inventory, heals and reflects by the higher of Vigor or Wit.
- Global: every heal or prevention keyed off Vigor or Renewal now uses the higher of the owner's Vigor or Wit. Every Combat Effect or Affliction that was applied at random is now chosen.
- Source of truth is the seed. Reseed the CanonAspects collection so the live tools carry the new text.

## Runeguard reworded
- Runeguard now reduces Base Damage specifically, matching the guardian intent. Seed and both baked copies.

## Augmentations reworked
- Ten augmentations updated in the seed data and the baked copies in FoeForge and ShardForge. Threshold now caps against current Vitality. Mendseam loses its condition and heals from the highest defensive attribute. Shadowmeld grants Obscured, replacing the retired Shrouded, and triggers at end of round if you dealt no damage. Afterimage loses its movement condition. Deathsong reflects Base damage equal to your highest defensive attribute. Emberhold saves you every time now, at an even chance of death each time. Scarweave wards from the highest defensive attribute with no stacking clause. Bulwark reaches anyone in Mobility range. Unbowed caps Fatigue at rank 3. Lastlight triggers below 25 Vitality.
- Runeguard held for a clarification, its current text already reduces by the highest defensive attribute.
- If augmentations are served from the CMS, reseed so the live text matches.

## ShardForge — Agile infusion reworded
- Agile now reads: While wielding this weapon, you may use a free movement during your Act. This does not remove your ability to move during your React. Updated in the Infusions seed data and the tool's baked copy.
- ShardForge refreshes on its own. If the Infusions collection is served from the CMS, reseed it so the live text matches.

## Canon — Movement is React only and takes the whole Act
- Movement was already React side in both tools. Now choosing it also spends the Act. It is not split across Act and React, it is a React that costs the entire Act, so a Fell or Foe that moves does nothing else that round.
- FellGlass: declaring Movement as the React clears the declared Act and logs React and Act spent. FateWell: a foe taking the Movement React clears its intent the same way.
- Both refresh on their own.

## Forges drop the name field, credit comes from the member record
- The enter your name inputs are gone from ShardForge, BondForge, and BrandForge. The backend already stamps the creator from the signed in member on every submission, so the field was redundant and could mislead by letting someone type a name that the record ignored. Credit now always comes from the account.
- The dependent listeners and reads were made safe or removed so nothing throws with the fields gone.
- All three refresh on their own. No paste, the backend already credits from the member.

## SigilForge — Forge From a Description works again
- Root cause of the failed fetch: the tool called the AI relay by a direct cross-origin fetch from the github.io embed to lorefell.com, which the browser blocks without CORS headers the endpoint did not send. FellForge never hit this because it calls the AI over the postMessage bridge, server side.
- SigilForge now uses that same bridge. The tool posts its system prompt and messages to the Wix page, a new aiForge backend method calls Anthropic with the shared key, and the reply comes back over postMessage. No cross-origin fetch, no CORS wall, and it uses the same key FellForge already proves works.
- Two pastes: forge.web.js and page-sigilforge.js. SigilForge itself refreshes on its own.

## SigilForge — Unlocked toggle syncs, Vision hides while unlocked
- The toggle drove state but the view did not always follow it, so flipping it felt dead on a set build and would not return cleanly. Render is now the single source of truth: the checkbox, the third inlay slot, and the budget readout all follow the unlocked state on every render, in both directions.
- Forge From a Vision hides while Unlocked is on and returns when it is off. A vision describes a legal build, so it belongs to normal ruling.
- Reset clears the unlocked state with everything else. The tip copy now describes the full waiver, not just the budget.
- SigilForge refreshes on its own.

## SigilForge — locked rules enforce again
- The hard and soft split captured the errors array before any rule ran, so with Unlocked off nothing blocked. Errors are now built after every rule check. Locked mode enforces the full ruleset again, Unlocked still waives to warnings.

## SigilForge — Unlocked means anything goes
- Unlocked now waives every structural rule, not just the budget ceiling. Over budget, Spread and Amplify together, the tier and form ladders on targeting, spread, amplify and afflictions, the affliction cap, and the inlay limit all stop blocking submit. They surface as red warnings instead, each one a thing the LoreMaster is agreeing to when they approve the build.
- A third Inlay slot opens while Unlocked, for builds that need more than the standard two. It carries into the submission and clears when you switch Unlocked back off.
- Only genuine nonsense still blocks: no damage package chosen, no targeting chosen, an unknown component. Everything a LoreMaster could reasonably allow goes through.
- Unlocked builds still file under the adventure status, so none of this reaches canon in the LoreForge.
- SigilForge refreshes on its own. The forge.web.js paste from the last change still stands if not yet pasted.

## SigilForge — Unlocked builds for adventure use
- A new Unlocked build toggle by the budget bar lets you forge past the tier ceiling. Every other forging rule still holds, only the over budget block lifts. Under budget and all the tier, form, and affliction rules stay enforced.
- When an unlocked build runs over budget a red warning states it plainly: adventure only, requires LoreMaster approval, not eligible for canon in the LoreForge.
- The submission carries the flags, and the backend files an unlocked build under an adventure status rather than submitted. The LoreForge gallery only shows submitted and canon, so an unlocked build never reaches the vote or canon.
- One paste, forge.web.js. SigilForge itself refreshes on its own.

## Info circles across the forges
- The header definition circles ported from SigilForge to every builder. Each meaningful field carries a small gold circle that opens a plain definition, hover on desktop and tap on touch.
- FellForge: Sex, Lineage, Origin, Motivation. FoeForge: Build, Stance, Signature Affliction, Deploy at, Party level, Number of Fell. RelicForge: Group, Cost, Uses, Rarity. ShardForge: What it does, and the category field.
- Shared pattern, one CSS block and one tap handler per tool. All refresh on their own.

## SigilForge — headers carry their meaning
- Every builder header gains a small gold info circle: Primary Damage Package, Targeting, Inlay Slot 1 and 2, Spread, and Amplify. Each opens a short plain definition of what that piece is and what it does. Hover on desktop, tap on touch, one open at a time.
- SigilForge only, refreshes on its own.

## Canon — stance change is a React, and it takes the whole React
- Reverses the earlier ruling that stance change cost an Act. Switching an Armor Stance is now a React and consumes your entire React, so you cannot shift stance and hold another React in the same round.
- FellGlass: Change Stance leaves the Act hand entirely. It appears in the React list as Change Stance to each stance you own but do not currently hold, tagged Stance. Choosing it on Resolution adopts the stance, spends the React, and logs the shift. All benefits swap at once.
- FateWell: the foe Change Stance leaves the Act dropdown and becomes its own Stance React control on the foe, always available, so a LoreMaster spends a foe React to shift it rather than an Act.
- Help text corrected in FellGlass to read as a React that takes the whole React.
- Both tools refresh on their own.
- Vault still says an Act in three places, listed below for the FellGuide edit.

## Votes bind everywhere, the LoreForge turns pages
- One vote per member per creation, enforced at the single castVote method every surface calls, so voting from SigilForge and voting from the LoreForge count as the same vote. The check moves to a new CreationVotes ledger collection because the old voters array on the row never persisted, the column does not exist and Wix drops unknown fields on write, meaning the dedupe silently never worked.
- Fixed a live data loss bug in the same pass. The vote update wrote a partial object, and a partial update replaces the whole row in Wix, which would have erased a creation down to its id and tally on the first vote. Updates now carry the full record.
- The gallery pages at twelve creations, Back and Forward with a page count beneath the grid, page resetting on any filter, sort, or hall change. The backend read takes skip and returns the total.
- One paste, forge.web.js, one page code paste, page-loreforge.js. The Apply run creates the CreationVotes collection.

## The Hearth — the touchmarks are struck
- The letter stamps give way to punched silhouettes, solid metal with the detail cut out in navy: the cracked pane, the well rings, the anvil, the rune disc, the infusion gem, the interlocked rings with a true over and under weave, the brand under its heat, the open tome, the horned skull, the set relic. The marks ride the stamp color, so the crown pair burns ember at the fire and the racks hold gold.
- Nothing to paste. The embed refreshes on its own.

## LoreForge — the stray Character kicker goes
- Older SigilForge submissions carried the backend’s fallback kind of character from before their kind wiring existed, so cards read SigilForge Character. The gallery now suppresses character as a kind label everywhere, since the forge name already says it where it is true. Live submissions carry spell or ability correctly and still show.
- Nothing to paste.

## LoreForge shows its runes, the hall crossing smooths, the Hearth trims
- SigilForge rune images render in the gallery now. Submissions store the media manager wix image URL raw, and getGallery passed it through unconverted, a scheme browsers cannot load. The gallery read now converts through the same wixImg helper the catalog uses.
- Crossing between the LoreForge and the Pentifax no longer snaps red then swaps. The themed elements ease across a third of a second and the grid fades out on the crossing, returning with the new hall’s rows.
- EchoForge and SagaForge leave the Hearth. The wall holds FoeForge and RelicForge until SagaForge earns its place back.
- One paste: forge.web.js.

## Infrastructure — the deploy stops tripping on itself
- Two failures, two fixes. Re-running a failed single job deploy re-uploaded the Pages artifact, and two artifacts with one name hard-fail the deploy action. The workflow now splits into a build job that uploads once and a deploy job that consumes it, so re-runs reuse the artifact. And the deploy retries itself once after a ninety second cooldown, since GitHub’s Pages backend intermittently reports failure and trying again later is the actual remedy.
- The Pages source is confirmed on GitHub Actions, so this workflow owns deploys now. The site was stale from the failed runs; this push redeploys everything through the Hearth rebuild.

## The Hearth rebuilt, a smithy at night
- The spinning hub is gone. The new Hearth reads as walking into a blacksmith’s shop: a banked fire at the top where FellGlass and FateWell wait as the crown tools, then two racks below, the bench for players and the wall for LoreMasters, every forge hung as a tool with its maker’s touchmark stamped beside its name and a one line purpose.
- Motion stays banked. The fire glow breathes on a slow seven second cycle, three ember motes drift up and gutter, sections settle in once on entry, and striking a tool flares its border ember before the page turns. All of it stills under reduced motion.
- One column on phones, the crown pairs at 560 and the racks pair at 640. The HEARTH_NAV contract and routes are unchanged, so the page code needs no repaste.
- Nothing to paste. The embed refreshes on its own.

## The LoreForge splits its halls, the Pentifax burns red
- The Pentifax is its own hall now. A toggle at the top swaps between the LoreForge, every forge except foes, and the Pentifax, foes only, canon and submitted. The Pentifax view turns the accents red throughout: mast, chips, badges, vote buttons. The forge filter hides there since the hall is one forge.
- Copy corrected: the community votes, the dev team decides what enters canon. The Pentifax hall reads as the foe hall voted by the table.
- Card plates sit to the left of the text on desktop and above on mobile.
- Read the full record opens where you are looking. The modal was centering on the iframe rather than the visible viewport, so it landed midway down the page. It now anchors to the click point, clamped to the top.
- The Hearth routes carry the real page slugs, the-fellforge through the-loreforge.
- Two pastes refresh: forge.web.js and page-loreforge.js.

## The LoreForge opens, the Hearth completes
- The LoreForge is the hall of every forge: all community creations across all types in one gallery at loreforge.html. Forge filter chips build themselves from what exists, show narrows to In the vote or Canon, order flips between most voted and newest. Cards carry the forge and kind, creator, flavor line, a full record modal, canon badges, and the Pentifax vote with live counts, sign in handling, and already voted states. Art plates render only when a creation carries an image. New backend getGallery reads every forge in one query, submitted and canon only, private work never leaves its owner. Votes go through the existing castVote with each row’s own forge key.
- The Hearth had its tiles and its HEARTH_NAV signal but nothing listening. page-the_hearth.js catches the signal and routes the parent page. A LoreForge tile joins the player grid at Vote the canon.
- Contracts now cover loreforge and the_hearth pairs.
- Three pastes: forge.web.js, page-loreforge.js on a new loreforge page, page-the_hearth.js on the Hearth page. Both tools embed from github.io like the rest.

## FateWell — the combat runner reads clean on a phone
- The runner header stacks into three rows on phones: Prep and the scene arrows share the top line, the scene name takes a full line of its own with the mode badge beside it, and the position and save state sit together beneath in one muted line. No more vertical wrapping in a crushed middle column.
- The action strip is a tight grid: Log beside Roll d6 on one row, Escalate to combat or Return to roleplay full width, Mark scene complete full width, and the beat arrows as a paired row beneath in roleplay. Combat mode has no arrows and ends at the complete button.
- Desktop untouched. Everything lives inside the phone media block, which now wins by source order.
- FateWell only, styles only.

## FateWell — mobile overrides actually win now
- The mobile block sat above the base rules in the stylesheet, so every base rule that came later quietly overrode it, which is why the mast kept centering and the spine and runner tweaks needed heavier hands. Moved the whole max-width 600px block to the end of the stylesheet so it wins by source order. The mast now aligns left on phones as intended, and the stacked spine and runner strip hold.
- Note: the large crescent logo and title at the very top of the phone view are the Wix site header wrapping the embed, not the tool. That one is aligned in the Wix Editor, outside FateWell.
- FateWell only, styles only.

## FateWell — mobile spine and runner strip, second pass
- The bowing spine collapsed on real phones, tiers overlapping into each other. Replaced with a clean stacked layout: on phones the Adventure, Act, Session, and Scene tiers each take a full-width row, kicker left, name beside it, the live one lit gold. No crush, every name readable, every tier still one tap.
- The runner strip targeted the wrong DOM last time. Rebuilt against the real structure: Log, Roll d6, Escalate or Return, and Mark scene complete stack as a single column, the beat arrows sit as a row beneath. No more scatter at the top of a combat scene.
- Mast stays left aligned on phones.
- FateWell only, styles only.

## FateWell — nested images persist to the account
- Root cause of images not surviving across browsers: the live page code was saving nested record images as base64 straight into the campaign row. A few phone photos pushed the row past the Wix item size cap and the whole save threw server-side, so nothing reached the account. Local editing masked it because localStorage has no cap. The current page code already recurses the campaign and uploads every data URL to Wix media, storing a small static URL, so acts, sessions, scenes, and NPC entries persist.
- The save is no longer silent on failure. The backend reports a save result and the tool warns when a save does not reach the account, naming a too-large image as the likely cause instead of failing invisibly.
- Paste both files: velo/page-fatewell.js and the FateWell embed source, then publish. The page paste is the actual fix.

## Infrastructure — back to github.io, deploy hardened
- The CMS serving path hit a wall. Wix wraps every _functions response in a strict Content Security Policy that blocks inline scripts and inline styles without a nonce, and the combat tools are one large inline script and style each. Stored documents cannot carry a nonce, so the app was blocked while only the static feedback widget survived. The base64 storage fix was sound, but the origin itself will not run these tools.
- FateWell and FellGlass return to github.io serving. The standing fix for the original pain, manual version edits, is to drop the pinned version string from the two embeds so pushes go live on the short Pages cache with no Wix edits.
- The intermittent deploy failures were GitHub’s built-in Pages deploy giving up on the first try. A new Deploy Pages workflow replaces it with a deploy step tuned to tolerate transient failures, many status checks over a long window instead of one shot. It takes effect once the Pages source is set to GitHub Actions in repo settings.

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
