# page-threadspire.js — two lines to paste

`velo/page-threadspire.js` is guard-denied and it is a long file, so this is a patch rather
than a whole replacement: two edits, both by search-and-replace, nothing else touched.

Pairs with `combat.web.PROPOSED.js`. Neither is any use without the other.

---

## 1. The import

Find this line (near the top, one of the `import` block):

```js
import { getCombatForChar, saveCombatDeclare, syncCombatPlayer, publishCombatState, applyCombatToChar, dealDamageToChar, setCombatCharge, getCombatDeclares } from 'backend/combat.web.js';
```

Replace it with:

```js
import { getCombatForChar, saveCombatDeclare, syncCombatPlayer, publishCombatState, applyCombatToChar, dealDamageToChar, setCombatCharge, getCombatDeclares, resolveCombatPlacement } from 'backend/combat.web.js';
```

## 2. The handler

Find this block (in `embed.onMessage`, among the `TS_COMBAT_*` cases):

```js
        } else if (msg.type === 'TS_COMBAT_CHARGE') {
          let ok = false;
          try { const r = await setCombatCharge(campaignId, msg.charId, msg.value); ok = !!(r && r.ok); } catch (e) { ok = false; }
          reply(ok);
```

Add the new case immediately after it, before the next `} else if`:

```js
        } else if (msg.type === 'TS_COMBAT_PLACED') {
          // The loremaster resolved a placed utility. The marker is already on the board;
          // this is what lets the placer's sheet spend the thing out of their pack.
          let ok = false;
          try {
            const r = await resolveCombatPlacement(campaignId, msg.charId, {
              pid: msg.pid, util: msg.util, squares: msg.squares
            });
            ok = !!(r && r.ok);
          } catch (e) { ok = false; }
          reply(ok);
```

---

## What to check once it is pasted

`fgApi` — the object handed to `handleSheetMessage` — does **not** need `resolveCombatPlacement`.
That object is the sheet's API surface, and the sheet never resolves a placement; only the
loremaster's board does, and the board talks through `embed.onMessage` directly. Adding it
there would be harmless and would also be a lie about who may call it.

The two CombatPlayer fields (`placed`, `placedAck`, both Text) have to exist in the
collection or every write is silently dropped — Wix accepts an unknown field and keeps
nothing, which is F8's whole shape. Worth confirming they are there before deciding the
feature does not work.
