# ThreadSpire Asset Storage (maps and tokens), Phase B spec

This is the plan for real account storage of uploaded maps and tokens. It is written to be approved before any code runs against the live CMS, because a push touching `scripts/**` or `schemas/**` fires `apply.yml` and writes to Wix, which a git revert cannot undo.

## The headline: almost nothing new needs building

The infrastructure this phase would seem to require already exists in the live backend. Phase B is mostly wiring the prototype's upload path to methods that are already there, not standing up new storage.

What already exists:

- **Image upload.** `uploadRune(base64, name)` in `backend/loreforge.web.js` takes an image, uploads it to Wix Media, and returns a `wix:image://` descriptor. Six forges already call it (bond, relic, brand, sigil, foe, fatewell). It lives in the Wix backend, not in the repo clone, so it is a dependency to call, not code to write.
- **The `wix:image://` to loadable URL conversion.** `velo/page-fatewell.js` already converts a `wix:image://` descriptor to an `https` URL a plain `<img>` or a CSS background can load.
- **An account scoped asset store.** The `Assets` collection already has an `image` field and an `ownerMemberId` field. Its backend methods already exist in `fatewell.web.js`: `listAssets` (returns the caller's own assets, owner filtered), `saveAsset` (read modify write, stamps `ownerMemberId` from the session), and `deleteAsset` (owner checked). Permissions are already correct.

What that means: the account scoped store, the owner scoping, the image hosting, and the URL conversion are all done. We are connecting a pipe, not laying one.

## The one open decision for you

The `Assets` collection today is shaped for foes and characters (`shatterRating`, `lp`, `sp`, `maxVit`, `attrs`, `abilities`). A map or an uploaded token is a thinner thing: an image, a name, a kind, and for a map its nominal width and height. Two ways to fit them in, and this is the ruling I need.

**Option 1: reuse `Assets` with a `kind` discriminator.**
Add a small number of fields to the existing `Assets` collection: `kind` (map, token), `w`, `h` (map nominal box), and use the existing `image`, `name`, `assetId`, `ownerMemberId`. Maps and tokens become asset rows with `kind: 'map'` or `kind: 'token'`, filtered out of the foe roster by that kind.
Pro: one collection, one set of backend methods already written, the least new surface.
Con: the collection carries foe fields that a map ignores, so it is a wider table than a map strictly needs.

**Option 2: a dedicated `SceneAssets` collection.**
A new collection with exactly the fields a map or token needs: `assetId`, `ownerMemberId`, `kind`, `name`, `image`, `w`, `h`, `source`. New backend methods mirroring the three Assets ones.
Pro: clean, a map row holds only map fields.
Con: a new schema (fires `apply.yml`), new backend methods, more surface to keep in sync, duplicates logic that already works for `Assets`.

My recommendation is **Option 1**. The existing `Assets` methods are owner scoped and battle tested, adding a `kind` and two size fields is a smaller and safer change than a parallel collection, and the extra foe fields sitting empty on a map row cost nothing. Option 2 is the right call only if you expect scene assets to diverge hard from character assets later, which the current design does not suggest.

**Ruling: Option 1 approved.** Reuse `Assets` with a `kind` discriminator and the two size fields.

## The build, once you rule

Assuming Option 1:

1. **Schema, one careful edit.** Add `kind`, `w`, `h` to `schemas/Assets.json`. This is the only change that touches live infrastructure. It is additive, existing rows keep working. Because CMS schema updates are destructive replace operations, the script follows the read modify write with backup first pattern already established, and I confirm the diff with you before the push that fires `apply.yml`.
2. **Backend, thin additions.** `listAssets` already returns the caller's assets. Add or extend a filter so ThreadSpire can ask for `kind: 'map'` or `kind: 'token'`. `saveAsset` already handles insert and update owner scoped, it needs no change beyond accepting the new fields. No new method if the existing three cover it, which they appear to.
3. **The upload path swap.** In the prototype, phase A reads a file to a local object URL. Phase B changes two lines inside that one function: send the base64 to `uploadRune`, get back a `wix:image://` descriptor, and call `saveAsset` with the map or token record. Everything else in that function, the measuring, the picker card, the background wiring, stays exactly as built.
4. **On load, list the account assets.** When ThreadSpire opens, call `listAssets`, filter to maps and tokens, and show them in the picker and palette alongside the adventure sources. An uploaded map from last session now reappears.
5. **The URL conversion at render.** Reuse the existing `wix:image://` to https helper so a stored map paints on the mapArt and a stored token shows as its face.

## What stays out of scope for this phase

- No change to the adventure preloaded sources (map source C, token source C). Those already work and do not touch storage.
- No change to the seam or CampaignView. A stored asset is referenced by URL on the scene like any other; the bytes live in Wix Media, the reference travels as it does now.
- No new permissions model. `ownerMemberId` and the Anyone with session member scoping already give each account its own private assets.

## The risk and how it is handled

The single risky action is the `schemas/Assets.json` edit, because that push fires `apply.yml` and rewrites the live collection. Mitigation, all already your established practice:

- Read modify write with a backup of the current schema first.
- Additive only, no field removed or retyped, so existing foe and character rows are untouched.
- The diff shown and approved before the push.
- `node --check` and a grep for non column zero exports on any web module touched, since `node --check` does not catch Wix web module nesting violations.

Nothing else in phase B touches live infrastructure. The prototype wiring, the picker, the palette, the upload path, are all ordinary HTML that ships through the normal docs and embeds mirror with the canon gate.

## Definition of done

- An uploaded map saves to the account and reappears in the picker on a fresh load, on a different device, for the same account only.
- An uploaded token does the same in the palette.
- A map or token from the adventure or a record still works unchanged.
- No existing foe or character asset is disturbed by the schema edit.

## Build notes, as executed

- Schema: `kind`, `w`, `h` added to `schemas/Assets.json`, additive only, backup saved to `.schema-backups/` first. This is the only push that fires `apply.yml`.
- Backend: no change needed. `saveAsset` uses `Object.assign({}, asset, ...)`, so it passes the new fields straight to the insert once the columns exist. `listAssets` returns the account's rows and ThreadSpire filters by `kind` on the client, which the seam already does. So the schema edit alone unlocks storage.
- Frontend swap: the prototype's `assetBackend` object is the single swap point. In the live page wiring, its three members map to `uploadRune` (upload), `saveAsset` (save), and `listAssets` then filter (list). The prototype ships with the local stub so the flow is testable without Wix; the page file provides the real three when embedded.
