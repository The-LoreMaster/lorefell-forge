# Darkshard feed round-trip: the velo hand-paste

The board and sheet halves are built and merged. This is the relay between them, which is
hand-pasted into Wix, never auto-deployed. Three small edits. After pasting, the feed
approval, the Skyvault Shard decrement, and the board Vitality raise all close the loop.

## The flow, end to end

1. Board: LM taps a shard, the placer is in range, taps Feed. `lmPushFeed` sends
   `TS_COMBAT_FEED { charId, pid, count }` (count rises per feed, the idempotency key).
2. Velo page (page-threadspire.js): receives TS_COMBAT_FEED, calls a backend method that
   writes `feed = { pid, count }` onto the placer's CombatPlayer row.
3. Sheet: reads `COMBAT.feed` on its next sync (already built: cbAskFeed). Shows the player
   an approval card. On approval, spends one Skyvault Shard and sets `_feedAck = count`.
4. Sheet publishes `skyShards` and `feedAck` on combat-sync (already built).
5. Velo bridge (fgSheetBridge.js): forwards skyShards/feedAck/placedAck to syncCombatPlayer.
6. Backend (combat.web.js): persists them on the CombatPlayer row, and relays feedAck back
   to the board so it can call `applyFeedAck(pid, count)` and raise the shard's Vitality.

## Edit 1: combat.web.js, syncCombatPlayer, persist the three fields

In `syncCombatPlayer`, beside the existing `if (typeof s.curVit ...` lines, add:

```js
  if (typeof s.skyShards === 'number') row.skyShards = s.skyShards;
  if (typeof s.feedAck === 'string') row.feedAck = s.feedAck;
  if (typeof s.placedAck === 'string') row.placedAck = s.placedAck;
```

CMS: CombatPlayer needs three fields (Number skyShards, Text feedAck, Text placedAck). Add
to scripts/addCombatPlayerFields.js the same additive way `places`/`placed`/`placedAck`
were added, and run Apply CMS. placedAck may already exist; the script is idempotent.

New backend method for the feed write (add to combat.web.js):

```js
// ThreadSpire board -> ask the placer's sheet to feed their Darkshard. Writes feed onto
// the CombatPlayer row; the sheet reads it, approves, spends, and acks by count.
export const requestShardFeed = webMethod(Permissions.Anyone, async (charId, pid, count) => {
  if (!charId || !pid) return { ok: false };
  const campaignId = await charCampaign(charId);
  if (!campaignId) return { ok: false };
  const existing = await playerRow(campaignId, charId);
  const row = existing || { campaignId: campaignId, charId: charId };
  row.feed = JSON.stringify({ pid: pid, count: (typeof count === 'number' ? count : 1) });
  row.updatedAt = Date.now();
  try {
    if (existing) await wixData.update('CombatPlayer', row, { suppressAuth: true });
    else await wixData.insert('CombatPlayer', row, { suppressAuth: true });
    return { ok: true };
  } catch (e) { return { ok: false }; }
});
```

CMS: CombatPlayer needs a Text field `feed`.

The sheet reads `COMBAT.feed` as an object; wherever the page hydrates COMBAT for the sheet
from the CombatPlayer row, parse `feed` and `feedAck` through (the same place `placed` is
parsed). And when reading a player's row for the board, carry `skyShards` and `feedAck`
onto the Fell record the board holds, so shardCountFor and the feedAck relay can read them.

## Edit 2: page-threadspire.js, receive TS_COMBAT_FEED

Where the page handles board asks (TS_COMBAT_DAMAGE, TS_COMBAT_PLACED, etc), add:

```js
  } else if (m.type === 'TS_COMBAT_FEED') {
    try { await requestShardFeed(m.charId, m.pid, m.count); } catch (e) {}
```

And when the board's state is refreshed from CombatPlayer rows, carry each Fell's `feedAck`
onto the party record the board holds (`sh.feedAck`). The board's `scanShardFeeds` runs on
every party update and reads it: `feedAck` is the string `"pid:count"`, so the board knows
both which shard was fed and how many times, and `applyFeedAck` guards by count per pid. No
call into the board frame is needed beyond getting `feedAck` onto the party record, since
the scan is already wired to the party feed.

## Edit 3: fgSheetBridge.js, forward the fields on combat-sync

In the `combat-sync` handler, extend the `syncCombatPlayer` call:

```js
      await api.syncCombatPlayer(m.charId || getId(), {
        curVit: m.curVit, maxVit: m.maxVit, charge: m.charge, affs: m.affs,
        defEva: m.defEva, plog: m.plog, gear: m.gear,
        skyShards: m.skyShards, feedAck: m.feedAck, placedAck: m.placedAck
      });
```

This is the F11/F12 trap at the velo layer: the field list here drops anything not named,
so skyShards/feedAck/placedAck must be added explicitly or the sheet's numbers never reach
the CMS. placedAck was already flowing through combatSyncPush but was being dropped here.

## Done when

Place a Darkshard, stand in the radius, LM taps Feed. The player sees an approval card on
their sheet. On approval, a Skyvault Shard leaves their pack and the shard's Vitality rises
on the board. Decline, and neither moves. With no Skyvault Shard in pack, the board's Feed
button is red and disabled and says so.
