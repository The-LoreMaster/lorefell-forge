const { test, expect } = require('@playwright/test');
const APP = '/dist/threadspire.html?demo=1';

test.describe('graph pipeline still builds', () => {
  test('graph.json has every canon layer', async ({ request }) => {
    const g = await (await request.get('/dist/graph.json')).json();
    const types = new Set(g.nodes.map(n => n.type));
    for (const t of ['sphere','world','map','location','scenario']) expect(types.has(t)).toBeTruthy();
  });
});

test.describe('character-first entry', () => {
  test('opens on the character token, not a map', async ({ page }) => {
    await page.goto(APP);
    await expect(page.locator('body')).toHaveAttribute('data-focus-type', 'character');
    await expect(page.getByTestId('char-token')).toBeVisible();
  });

  test('tapping the token opens the reference card with the required fields', async ({ page }) => {
    await page.goto(APP);
    await page.getByTestId('char-token').click();
    const pop = page.locator('.char-card');
    await expect(pop).toBeVisible();
    await expect(pop).toContainText('Marrow the Tested');
    await expect(pop).toContainText('played by Nate');
    await expect(pop).toContainText('The Flayed');      // lineage
    await expect(pop).toContainText('Gravewright');      // origin
    await expect(pop).toContainText('Vengeance');        // motivation
    await expect(pop).toContainText('Rendfang');         // weapon
    await expect(pop).toContainText('The Cawmarch');     // lorebound
    await expect(pop).toContainText('Ironjaw');          // talent
    await expect(pop).toContainText('burned reliquary'); // blurb
  });

  test('the owner sees a full-sheet button', async ({ page }) => {
    await page.goto(APP);
    await page.getByTestId('char-token').click();
    await expect(page.getByTestId('open-sheet')).toBeVisible();
  });
});

test.describe('gated zoom', () => {
  test('zoom out from the token reaches the location', async ({ page }) => {
    await page.goto(APP);
    await page.getByTestId('zoom-out').click();
    await expect(page.locator('body')).toHaveAttribute('data-focus-type', 'location');
    await expect(page.locator('.layer-title')).toContainText('Stellum District');
  });

  test('the location shows the party goals, checked and unchecked', async ({ page }) => {
    await page.goto(APP);
    await page.getByTestId('zoom-out').click();
    const goals = page.locator('.goal');
    await expect(goals).toHaveCount(2);
    await expect(page.locator('.goal.done')).toHaveCount(1);
  });

  test('zoom out again reaches the territory', async ({ page }) => {
    await page.goto(APP);
    await page.getByTestId('zoom-out').click(); // location
    await page.getByTestId('zoom-out').click(); // territory
    await expect(page.locator('body')).toHaveAttribute('data-focus-type', 'map');
    await expect(page.locator('.layer-title')).toContainText('The Drowned Coast');
  });

  test('the world stays gated until the LM unlocks it', async ({ page }) => {
    await page.goto(APP);
    await page.getByTestId('zoom-out').click();
    await page.getByTestId('zoom-out').click();
    await expect(page.getByTestId('world-gate')).toBeVisible();
    await expect(page.getByTestId('zoom-out')).toBeDisabled();
  });
});

test.describe('party members', () => {
  test('another Fell at the location opens their card, read-only', async ({ page }) => {
    await page.goto(APP);
    await page.getByTestId('zoom-out').click();
    await expect(page.getByTestId('party-token')).toBeVisible();
    // clicking requests lore from the bridge; with no bridge in demo it shows the loader
    await page.getByTestId('party-token').click();
    await expect(page.locator('.pop')).toBeVisible();
  });
});
