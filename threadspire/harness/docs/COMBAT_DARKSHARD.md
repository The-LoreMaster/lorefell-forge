# Darkshard: the placed object that opens an anti-Aether radius

A dedicated build, scoped here so it does not get built piecemeal. Everything below is decided unless it says OPEN. Read the canon first: schemas/seed/Relics.json (Darkshard row) and the vault entry at The FellGuide/.../Combat Utilities/Darkshard.md. This doc does not restate lore, it turns the lore into a build.

## What a Darkshard is, and why it is not a marker

Caltrops, Rune and Trap are inert markers: tokenFighter (docs/threadspire.html ~line 6999) returns null for kind "marker", so nobody can aim at them. A Darkshard is the opposite. It is a placed OBJECT with Vitality that foes can attack and shatter, and while it lives it opens a radius that cuts every enemy inside it off from the Aether. So it diverges from the placed-utility model on three axes at once: it is targetable, it has a live radius, and it carries a per-round feeding action. Do not try to make it a marker with extra fields. It is its own kind.

## The canon, as mechanics

- Placed with the placement Act, on an OPEN square (space "empty", unlike Caltrops which is "any"). One square, not a cluster, so `adjacent` does not apply.
- Starts at Vitality 1.
- Opens a 10-space radius, a CIRCLE measured from the shard's centre in all directions, the same measure the Lorebound 5-space radius uses. Note: there is no on-board radius render today, Lorebound radius is tracked by eye. So Darkshard is the FIRST visible radius on the board. "Like Lorebounds" means the MEASURE (Euclidean, in cells), not an existing ring to copy. Use the `dist` helper (docs/threadspire.html ~line 9574, Math.hypot) and divide by grid size for a cell distance.
- Feeding: only the PLACER, spending an Act on a later round, while standing within the radius, consumes one Skyvault Shard from their pack and raises the shard's Vitality by 1. Not more Darkshards, Skyvault Shards, the opposite item, it "feeds on them". Feeding is gated by two things: the placer is within the radius, and the placer has a Skyvault Shard to spend. Each fails out loud the way a bad placement square does.
- Shatter: it takes damage like a fighter. When cumulative damage reaches its current Vitality it shatters and the effect ends. Vitality IS its health, one pool, the feeder raises it and the attacker lowers it.
- The effect while it lives: every ENEMY inside the radius is cut off from the Aether, left with standard attacks only. Weapon abilities, spells, infusions, augmentations, armour stances and lorebound Aspects all fall silent.

## Decided rulings (do not re-litigate)

- Radius shape: circle, Euclidean from centre. NOT the Chebyshev box the Caltrops adjacency uses. Different rule, different utility.
- Who feeds: the placer only. Not any Fell in the radius.
- Silence timing: CONTINUOUS. A foe that walks out of the radius regains its abilities that round; one that walks in loses them. Canon says "every enemy INSIDE the radius is cut off", present tense, a condition of being inside, not a snapshot. So silence is a live proximity check, re-evaluated whenever position or the radius changes, never latched.

## Build in two parts, in this order

### Part 1: the object, the ring, feeding, and shatter (self-contained, testable)

This is a Darkshard you can place, see the radius of, feed, and shatter, with no silencing yet. Ship this first.

1. A new token kind, "shard" (not "marker"). resolveOnePlacement (docs/threadspire.html ~line 4235) builds markers today, branch it: a Darkshard makes a shard token carrying vit (current Vitality, starts 1), dmg (0), radius (10), placer (charId). It is created the same way at the resolution swap, through the same batch path.
2. tokenFighter returns a REAL record for a shard (its vit as health), so it lands in the fight and foes can target it. This is the line that today returns null for markers, ~line 7014. A shard is not a marker, so it takes the fighter branch.
3. Draw the radius. A ring on the board centred on the shard, 10 cells in radius. First of its kind, so it is a small new render on the token layer, under the tokens. Faint, so it reads as ground not obstacle.
4. Feeding UI: on the placer's later rounds, an Act that consumes a Skyvault Shard from the pack (decrement, like piece 4's spend) and raises the shard's vit by 1. Gate on placer-within-radius (dist from placer token to shard centre <= 10 cells) and on having a Skyvault Shard. Refuse out loud on either failure.
5. Shatter: damage dealt to the shard subtracts from a pool that starts at vit and rises as it is fed. At damage >= current vit the shard is removed and a log line marks it. The feeder and the attacker push the same number.

Field carry: `space` and any new shard fields must be forwarded through cbUtilityModel (docs/fellglass.html ~line 6157) AND the items map in tsHandPayload. Both hops reshape the row field-by-field and silently drop anything not listed, this is the F11/F12 trap that has bitten twice, once for `places` and once for `adjacent`. Add the fields to BOTH or they will not arrive.

### Part 2: the anti-Aether silencing (its own build, do not fold into Part 1)

This is NOT a placement feature. It is a combat-wide status that happens to be sourced from a placed object, and it reaches into how every foe's available acts are computed. It deserves its own scoping pass because the questions are UI and rules questions, not placement ones:

- A silenced foe's card: does it show only standard attacks, with the rest greyed and a reason ("cut off from the Aether")? The LoreMaster should see WHY a foe is reduced, or it looks like a bug.
- The check is continuous, so it re-runs whenever a token moves or the shard's radius changes. Where does that hook sit so it is not recomputed on every repaint for nothing?
- A foe partly in the radius: a foe is silenced if its token is ANYWHERE within the radius (any overlap), decided by Nate. Not centre-in.
- Multiple shards, overlapping radii: silence is a boolean (cut off or not), so overlap is just OR. Two shards means two health pools and two placers feeding, and this is allowed (decided by Nate). Silence is a boolean, so overlap is just OR.
- Interaction with the abilities the sheet already gates (locked acts, barred acts): silence is another gate on the same list. Find where a foe's act list is built and add silence as one more reason an act is unavailable, rather than a parallel system.

Part 2 rulings (decided, do not re-litigate): a foe is silenced if it is ANYWHERE within the 10 spaces, any overlap of its token with the radius, not centre-in. And multiple simultaneous Darkshards ARE allowed: each has its own Vitality pool and its own placer feeding it, and silence ORs across their radii (a foe in any radius is cut off).

## Definition of done for Part 1

Place a Darkshard on an open square. See its ring. On a later round, standing inside the ring, feed it a Skyvault Shard and watch Vitality go to 2 and a Skyvault Shard leave the pack. Step outside the ring and the feed is refused. Have a foe deal damage equal to its Vitality and watch it shatter and the ring vanish. No silencing yet, that is Part 2.
