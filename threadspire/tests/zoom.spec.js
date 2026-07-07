// tests/zoom.spec.js
const { test, expect } = require('@playwright/test');

const APP = '/dist/threadspire.html';
const seed = (n) => APP + '?seed=1&node=' + encodeURIComponent(n);

test.describe('pipeline', () => {
  test('graph.json exists, has every layer, and every chain reaches the sphere', async ({ request }) => {
    const res = await request.get('/dist/graph.json');
    expect(res.ok()).toBeTruthy();
    const g = await res.json();
    const types = new Set(g.nodes.map((n) => n.type));
    for (const t of ['sphere', 'world', 'map', 'location', 'scenario']) expect(types.has(t)).toBeTruthy();
    const byId = Object.fromEntries(g.nodes.map((n) => [n.id, n]));
    for (const n of g.nodes) {
      let cur = n, hops = 0;
      while (cur.parent) { cur = byId[cur.parent]; expect(cur, n.id + ' chain broke').toBeTruthy(); expect(++hops).toBeLessThan(12); }
      expect(cur.type).toBe('sphere');
    }
  });

  test('worlds carry lineage and brand from the At-a-Glance', async ({ request }) => {
    const g = await (await request.get('/dist/graph.json')).json();
    const akk = g.nodes.find((n) => n.id === 'world:akkoroka');
    expect(akk).toBeTruthy();
    expect(akk.lineage.toLowerCase()).toContain('flayed');
    expect(akk.brand.toLowerCase()).toContain('saporset');
    expect(akk.summary.length).toBeGreaterThan(40);
  });
});

test.describe('zoom chain', () => {
  test('zooms out from character to sphere in order', async ({ page }) => {
    await page.goto(seed('character:seed'));
    const order = ['character', 'scenario', 'location', 'map', 'world', 'sphere'];
    for (let i = 0; i < order.length; i++) {
      await expect(page.locator('body')).toHaveAttribute('data-focus-type', order[i]);
      if (i < order.length - 1) await page.getByTestId('zoom-out').click();
    }
    await expect(page.getByTestId('focus-title')).toHaveText('The Sphere');
  });

  test('zooms back in by tapping children', async ({ page }) => {
    await page.goto(seed('sphere:the-sphere'));
    for (const t of ['Seedfall', 'The Seeded Reach', 'First Marker', 'The Waking Step', 'Marrow the Tested']) {
      await page.locator('.kid', { hasText: t }).first().click();
      await expect(page.getByTestId('focus-title')).toHaveText(t);
    }
    await expect(page.locator('body')).toHaveAttribute('data-focus-type', 'character');
  });

  test('breadcrumb jumps straight to a mid ancestor', async ({ page }) => {
    await page.goto(seed('character:seed'));
    await page.locator('.crumb', { hasText: 'Seedfall' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-focus-type', 'world');
    await expect(page.getByTestId('focus-title')).toHaveText('Seedfall');
  });
});

test.describe('fog and spoilers', () => {
  test('an undiscovered sibling renders as a placeholder with no title', async ({ page }) => {
    await page.goto(seed('sphere:the-sphere'));
    const fog = page.locator('[data-node="world:seed-fog"]');
    await expect(fog).toHaveClass(/fog/);
    await expect(fog).toHaveAttribute('data-title-hidden', 'true');
    await expect(fog).not.toContainText('Veilmark');
    await expect(fog).toContainText('Undiscovered');
  });

  test('a spoiler sibling stays veiled too and carries the spoiler mark', async ({ page }) => {
    await page.goto(seed('sphere:the-sphere'));
    const sp = page.locator('[data-node="world:seed-spoiler"]');
    await expect(sp).toHaveAttribute('data-spoiler', 'true');
    await expect(sp).not.toContainText('Hushfall');
  });

  test('discovery lifts the fog', async ({ page }) => {
    await page.goto(seed('sphere:the-sphere'));
    await page.getByTestId('discover-demo').click();
    await expect(page.locator('[data-node="world:seed-fog"]')).toContainText('Veilmark');
  });

  test('a fogged placeholder is not clickable into focus', async ({ page }) => {
    await page.goto(seed('sphere:the-sphere'));
    await page.locator('[data-node="world:seed-spoiler"]').click({ force: true });
    await expect(page.locator('body')).toHaveAttribute('data-focus-type', 'sphere');
  });
});

test.describe('memorials', () => {
  test('memorials render at their pinned location and open an epitaph', async ({ page }) => {
    await page.goto(seed('location:seed'));
    const mems = page.getByTestId('memorial');
    await expect(mems).toHaveCount(2);
    await mems.first().click();
    await expect(page.getByTestId('epitaph')).toBeVisible();
    await expect(page.getByTestId('epitaph')).not.toHaveText('');
  });

  test('the world shows an aggregate count of its fallen', async ({ page }) => {
    await page.goto(seed('world:seed'));
    await expect(page.getByTestId('memorial-count')).toHaveText('2');
  });

  test('retiring the active character raises a memorial at the nearest location', async ({ page }) => {
    await page.goto(seed('character:seed'));
    await page.getByTestId('retire').click();
    await page.getByTestId('epitaph-input').fill('Walked in asking, walked out answered.');
    await page.getByTestId('retire-confirm').click();
    await expect(page.locator('body')).toHaveAttribute('data-focus-type', 'location');
    await expect(page.getByTestId('memorial')).toHaveCount(3);
    await page.goto(seed('world:seed'));
    await expect(page.getByTestId('memorial-count')).toHaveText('3');
  });
});

test.describe('pins', () => {
  test('a pinned note persists across a reload', async ({ page }) => {
    await page.goto(seed('location:seed'));
    await page.getByTestId('pin-input').fill('The door here answers to the old name.');
    await page.getByTestId('pin-save').click();
    await expect(page.getByTestId('pin')).toContainText('old name');
    await page.reload();
    await expect(page.getByTestId('pin')).toContainText('old name');
  });
});

test.describe('real graph in the app', () => {
  test('the sphere renders from real data without the seed', async ({ page }) => {
    await page.goto(APP);
    await expect(page.getByTestId('focus-title')).toHaveText('The Sphere');
    await expect(page.locator('body')).toHaveAttribute('data-focus-type', 'sphere');
  });

  test('deep link to a real world focuses it', async ({ page }) => {
    await page.goto(APP + '?node=world:akkoroka&seed=1');
    await expect(page.getByTestId('focus-title')).toHaveText('Akkoroka');
  });

  test('a ?world= deep link (a player joining a campaign) opens that world', async ({ page }) => {
    await page.goto(APP + '?world=world:akkoroka');
    await expect(page.getByTestId('focus-title')).toHaveText('Akkoroka');
    await expect(page.locator('body')).toHaveAttribute('data-focus-type', 'world');
  });
});
