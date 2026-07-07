# ThreadSpire BUILD_REPORT

Autonomous red-green build on branch `threadspire-dev`. All writes live under
`threadspire/`. No canon page was modified. `main` was not touched.

## Result

- 30 of 30 tests pass, desktop and mobile projects, two consecutive clean runs.
- `dist/graph.json`: 122 nodes. 1 sphere, 37 worlds, 7 maps, 34 locations,
  43 scenarios. 0 broken chains, every node walks to the sphere.
- `dist/threadspire.html`: single self-contained file, about 99 KB, graph inlined.
- `GAPS.md`: 52 recorded holes and inferences, generated fresh on every build.

## What got built

- `build.mjs` parses the vault into the graph. Worlds come from the Stratums
  pages (At-a-Glance lineage and brand, Realm Overview summary). Maps are the
  seven History arcs, worlds resolved by the campaign lineage line or a title
  mention. Locations come from each arc's Locations folder. Scenarios are the
  numbered Storyline chapters, parented to the first arc location their text
  mentions, else to their map, every inference logged.
- `app/` plus `bundle.mjs` produce the explorer: breadcrumb trail, focus card,
  child list, zoom out button, hash deep links, a guarded DPR-safe starfield.
  Fog renders undiscovered siblings as unnamed placeholders that cannot be
  focused. Spoiler nodes carry a marker and stay veiled the same way. Memorials
  render at their pinned location, open an epitaph, and aggregate as a count on
  their world. Retiring the active character raises a memorial at the nearest
  location ancestor. Pins persist through the storage adapter.
- `storage.js` is the swap point for a later Wix CMS backend. Every persistent
  read and write goes through it.
- `tests/zoom.spec.js` covers the pipeline contract, the ordered zoom chain in
  both directions, breadcrumb jumps, fog, spoilers, discovery, memorials, the
  retire flow, pin persistence, and the real graph without the seed fixture.

## Deviations from the brief, in full (details in SCHEMA.md)

1. The `sphere/` app and `parse_worlds.js` the brief says to extend do not
   exist anywhere in this repo. Both were built from scratch.
2. No Adventure catalog or FateWell catalog folders exist. The Histories arcs
   are the real catalog and were adopted as the map layer.
3. Storyline chapters have no authored location links. Scenario edges are
   inferred from location names in the chapter text and logged per node.
4. No published URL scheme is recorded in `_Canon`, so `vaultUrl` is an empty
   string on every node rather than a fabricated pattern.
5. Playwright's browser CDN is blocked in this environment. Tests run on the
   Chromium binary shipped inside the `@sparticuz/chromium` npm package. Its
   `--single-process` flag is stripped because it made closing one browser
   context kill the shared process, which failed every second test until
   removed. The mobile project forces `browserName: 'chromium'` since the
   iPhone 13 descriptor defaults to WebKit, which cannot be downloaded here.

## Flakes and honesty

One mobile run failed once on the zoom-out chain immediately after the
single-process fix, before the crashed-browser debris cleared. It did not
reproduce in a direct device-emulated repro or in two subsequent full runs.
Recorded here rather than hidden.

## How to run

```
cd threadspire
npm install
npm test        # builds the graph, bundles the app, runs the suite
```

The branch is pushed as `threadspire-dev` so the work survives this session.
`main` is untouched and no PR was opened. Review at your pace.
