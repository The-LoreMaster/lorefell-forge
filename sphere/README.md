# The Sphere

The world map on lorefell.com, served at `https://table.lorefell.com/the_sphere.html`.

**Every word in it comes from the FellGuide vault.** World cards are the `##` sections of each
page in `The Lore (Contains Spoilers)/The Sphere/Stratums/`, in the page's own wording. The
header comes from the page's At a Glance callout and opening saying. Lorebounds come from
`The Arsenal/Lorebounds/Lorebound Types/` (a lorebound belongs to the first world its text
names). The About panel is `The Sphere.md` and `The Skyvault.md`. A `Canon coming soon`
callout shows once, quietly, on the world's hub.

Every FellGuide link is built from the page's real path in the vault, so renaming or moving
pages in Obsidian cannot strand a link: the next build follows the move.

## Files

- `template.html`: the widget itself (canvas, layout, styles). Edit this for design changes.
- `sphere.config.json`: the only data not in the vault: ring order and campaign videos.
  A world added to Stratums but missing from the rings lands on the outer ring.
- `../scripts/buildSphere.js`: reads the vault, writes `docs/the_sphere.html`.
- `../docs/the_sphere.html`: generated. Never edit by hand.

## How it stays current

- **Deploy Pages** bakes the Sphere from the vault on every deploy.
- **Sphere Sync** runs every half hour: it bakes from the vault, compares with the live page,
  and redeploys Pages when they differ. Run it by hand from the Actions tab to publish a
  vault edit right away.

Local build: `VAULT_DIR=../lorefell-fellguide node scripts/buildSphere.js` (`--check` to
test for staleness without writing).
