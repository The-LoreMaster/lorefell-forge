/* S2b: the LoreMaster's adventure chooser fills in, and the list is asked for at boot.
 *
 * Two faults found in the 2026-10-08 harness sweep:
 *  - the chooser drew whatever list it had when it opened and nothing drew it again, so
 *    opened before the list arrived it said "Finding your adventures" for good;
 *  - the boot ask for the list ran before the role was known, so for the LoreMaster it
 *    asked for nothing, and Settings opened on a loading line.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function loremaster() {
  return { lm: { role: 'lm', campaignId: F.CAMPAIGN_A, party: F.PARTY_A,
                 campaignList: F.CAMPAIGN_LIST, fromCast: true } };
}

test.describe('S2b the adventure chooser', () => {

  test('the list is asked for at boot, once the LoreMaster role is known', async ({ page }) => {
    const { lm } = await T.openTableAndBoot(page, loremaster());
    await lm.waitForFunction(() => window.S._advState === 'ready' && Array.isArray(window.S._advList));
  });

  test('opened before the list arrives, the chooser fills in when it does', async ({ page }) => {
    const { lm } = await T.openTableAndBoot(page, loremaster());
    await lm.evaluate(() => { window.S._advList = null; window.S._advState = ''; window.advChooser('yours'); });
    await expect(lm.locator('#advChooser button.ach-card')).toHaveCount(F.CAMPAIGN_LIST.length);
  });

  test('a list that could not be reached says so, and Try again fetches it', async ({ page }) => {
    const { lm } = await T.openTableAndBoot(page, loremaster());
    await lm.evaluate(() => { window.S._advList = null; window.S._advState = 'failed'; window.advChooser('yours'); });
    await expect(lm.locator('#advChooser')).toContainText('could not be reached');
    await lm.locator('#advChooser button', { hasText: 'Try again' }).click();
    await expect(lm.locator('#advChooser button.ach-card')).toHaveCount(F.CAMPAIGN_LIST.length);
  });
});
