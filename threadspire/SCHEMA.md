# ThreadSpire SCHEMA, observed reality

Phase 0 recon of the vault, recorded before the parser was written. Where this
contradicts the build brief, reality won and the deviation is noted.

## Deviations from the brief

1. **There is no `sphere/` app and no `sphere/parse_worlds.js` in this repo.**
   The brief assumes both exist and says to extend them. They do not exist at any
   path. The parser and the rendering core in `threadspire/` are built from scratch,
   following the conventions the brief attributes to them (page-as-truth,
   At-a-Glance callouts, DPR-safe resize, guarded draw loop).
2. **There is no folder named Adventure catalog or FateWell catalog.** The real
   catalog is `The Histories`, seven arc folders under
   `The FellGuide/The FellGuide/The Lore (Contains Spoilers)/The Histories/`.
   Each arc is the brief's "Adventure Map" layer.
3. **Storyline chapters carry no authored location link and no front matter.**
   The scenario to location edge is inferred (see Scenario below) or gapped.
4. **No published-URL scheme is recorded in `_Canon` docs.** `vaultUrl` is set
   to an empty string for every node rather than fabricating a scheme.
5. **Playwright's browser CDN is blocked in this environment.** The harness runs
   on the Chromium binary shipped inside the `@sparticuz/chromium` npm package
   (registry.npmjs.org is allowed). The mobile project forces
   `browserName: 'chromium'` because the iPhone 13 device descriptor defaults to
   WebKit, which cannot be downloaded here.

## Layer sources

### sphere (1)
- Source: `.../The Sphere/The Sphere.md`
- summary: first prose paragraph.
- Sibling cosmology pages (`The Skyvault.md`, `The Keelser.md`,
  `The Eternal Hunt.md`) fit no layer and are skipped, logged in GAPS.

### world (the Stratums)
- Source: `.../The Sphere/Stratums/*.md`, one page per world, 36 pages observed
  at recon plus any added later.
- At-a-Glance callout at the top:
  `> [!note] <Name> at a Glance` with `**Lineage:**` and `**Brand:**` lines.
- lineage: text after `**Lineage:**`. brand: text after `**Brand:**`.
- summary: first paragraph under `## Realm Overview`, else first prose paragraph.
- spoiler: false. Worlds are the shared setting.

### map (a History arc)
- Source: each directory under `The Histories/` that contains a root
  `<Arc Name>.md`. Observed arcs: A Court of Ashes, Echoes Below Burhallow,
  Of Withering Thorns, Shaper of the Nexus, The Crimson Heir,
  The Drums of Fellwinter, The Shattering of Valoria.
- summary: first prose paragraph of the arc root page.
- spoiler: true. Everything under The Histories is campaign material.
- parent world, resolved in order:
  1. A `[!note] Campaign` callout line of the form `A <Lineage> history` whose
     lineage matches a world's At-a-Glance Lineage (articles stripped).
  2. A world title appearing in the arc title or its first three paragraphs.
  3. Neither: the arc parents to a `lore-pending` world under the sphere and the
     break is logged in GAPS.

### location
- Source: `<arc>/Locations/*.md`. parent: the arc's map node.
- summary: first prose paragraph. spoiler: true.

### scenario (a Storyline chapter)
- Source: `<arc>/Storyline/NN - <Name>.md`, ordered by the numeric prefix.
- summary: first prose paragraph. spoiler: true.
- parent, resolved in order:
  1. The first of the arc's location names mentioned anywhere in the chapter
     text. This is textual inference from canon, not an authored link, and is
     recorded per node in GAPS as `inferred-location`.
  2. No location mentioned: the chapter parents to the arc's map node and the
     missing edge is logged in GAPS.

### Not mapped
- `<arc>/Characters`, `<arc>/Bestiary`, `<arc>/Artifacts` folders exist and are
  rich, but fit no layer in the chain. Skipped, available for a later phase.
- `LoreVault/` is table-facing guidance, not place canon. Skipped.

## Node shape (graph.json)

As specified in the brief: `id` (`type:slug`, slug from the filename,
lowercased, non-alphanumerics collapsed to `-`), `type`, `parent`, `title`,
`summary`, `spoiler`, `vaultUrl` (empty, see deviation 4), plus `lineage` and
`brand` on worlds and `order` on scenarios.
