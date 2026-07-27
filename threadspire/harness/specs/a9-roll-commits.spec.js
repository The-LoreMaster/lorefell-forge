/* A9 — the roll commits, and targeting never does.
 *
 * The bug this replaces: right-clicking a foe with a card held set the target AND declared
 * it, with no roll and nothing to undo, so a misclick spent the round's Act. Choosing who
 * and committing to it are two steps now, and the second one is the roll.
 *
 * Both ways in end at the same prompt:
 *   card first — take a card up, target a foe, roll
 *   target first — right-click a foe with an empty hand, choose Attack or Skill, choose
 *   the specific one, roll
 *
 * And nothing is spent until the roll: Cancel and Escape both back out with the card
 * still in hand.
 */
const { test, expect } = require('@playwright/test');
const T = require('./_table.js');

const F = T.FIXTURES;

function playerOnly() {
  return {
    player: {
      role: 'player', campaignId: F.CAMPAIGN_A, characterId: F.FELL_CHAR_ID,
      character: F.CHARACTER_A, characters: [F.CHARACTER_A], party: F.PARTY_A
    }
  };
}

const FIGHTERS = [{ key: 'm:cb-erasure', name: 'The Erasure', side: 'monster', charId: '' }];
const ACTS = [
  { src: 'Blade', nm: 'Basic attack', desc: 'standard strike', dmg: 6, base: 3, dt: 'phys',
    tier: 0, kind: 'weapon', contest: 'evasion', castSkill: '', locked: false },
  { src: 'Blade', nm: 'Rend', desc: 'a tier two', dmg: 8, base: 4, dt: 'phys',
    tier: 2, kind: 'weapon', contest: 'evasion', castSkill: '', locked: true },
  { src: 'skills', nm: 'Any skill', desc: 'pick one', dmg: 0, base: 0, dt: null,
    tier: null, kind: 'standard', contest: 'evasion', castSkill: '', locked: false }
];

async function seat(frame) {
  await frame.evaluate(() => { window.applyRemoteSnapshot = function () {}; });
  await frame.evaluate(({ acts, fighters, myCharId }) => {
    window.S.role = 'player'; window.S.mode = 'combat';
    window.S.characterId = myCharId;
    window.S.map = { w: 2400, h: 1600 };
    window.S.grid = { size: 100, offX: 0, offY: 0, opacity: 0.5 };
    window.S.tokens = [{ id: 'tkFoe', kind: 'foe', refId: 'cb-erasure', name: 'The Erasure', x: 400, y: 400, cells: 1 }];
    window.__sent = [];
    window.sheet.postMessage = function (m) {
      if (!m || m.type !== 'ts-declare') return;
      window.__sent.push(m);
      window.handDeclareResult({ ok: true, round: m.round });
    };
    window.tsHandTake({ charge: 1, acts: acts, reacts: [], skills: { Guard: 3, Might: 1 },
                        items: [], stances: [], gates: { noAct: false, noReact: false, notes: [] },
                        active: true, round: 1, phase: 'commit', fighters: fighters });
    window.renderTokens(); window.render();
  }, { acts: ACTS, fighters: FIGHTERS, myCharId: F.FELL_CHAR_ID });
}

const sent = (frame) => frame.evaluate(() => window.__sent);
const arm = (frame, nm) => frame.evaluate((n) => window.handArm(n, 'act'), nm);
const tapToken = (frame) => frame.evaluate(() =>
  window.handAimByTap(window.S.tokens.find((t) => t.id === 'tkFoe')));
const rightClick = (frame) => frame.evaluate(() => {
  const el = document.querySelector('.token[data-tok="tkFoe"]');
  const r = el.getBoundingClientRect();
  el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true,
    clientX: Math.round(r.left + r.width / 2), clientY: Math.round(r.top + r.height / 2) }));
});
const promptUp = (frame) => frame.evaluate(() => !!document.querySelector('#hand .hand-roll'));
const promptText = (frame) => frame.evaluate(() => {
  const p = document.querySelector('#hand .hand-roll');
  return p ? p.textContent.replace(/\s+/g, ' ') : null;
});
const menuOpts = (frame) => frame.evaluate(() =>
  Array.from(document.querySelectorAll('#hand .hand-pickmenu .hp-opt')).map((b) => ({
    text: b.textContent.replace(/\s+/g, ' ').trim(),
    /* the Act alone. The option also names the weapon and the charge that would unlock
       it, both of which belong on it and neither of which is its name. */
    act: (b.querySelector('.hp-name') || {}).textContent || '',
    kind: b.getAttribute('data-pkind'), take: b.getAttribute('data-ptake'),
    locked: b.classList.contains('locked')
  })));
const click = (frame, sel) => frame.evaluate((s) => document.querySelector(s).click(), sel);

test.describe('A9 targeting asks, the roll commits', () => {

  test('targeting a foe opens a roll instead of declaring', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await arm(player, 'Basic attack');
    await tapToken(player);

    expect(await sent(player), 'nothing has been declared by touching a token').toHaveLength(0);
    expect(await promptUp(player), 'it asks for the roll').toBe(true);
    expect(await promptText(player), 'and says what is about to happen to whom')
      .toContain('The Erasure');
  });

  test('the roll is what sends it', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await arm(player, 'Basic attack');
    await tapToken(player);
    await click(player, '#hand .hr-die');

    const out = await sent(player);
    expect(out, 'the roll committed it').toHaveLength(1);
    expect(out[0].act).toBe('Basic attack');
    expect(out[0].target).toBe('m:cb-erasure');
    expect(out[0].roll, 'and carried a real face').toBeGreaterThanOrEqual(1);
    expect(out[0].roll).toBeLessThanOrEqual(6);
    expect(await promptUp(player), 'and the prompt is done').toBe(false);
  });

  test('a player rolling real dice can enter the face they got', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await arm(player, 'Basic attack');
    await tapToken(player);
    await click(player, '#hand .hr-face[data-face="6"]');

    expect((await sent(player))[0].roll, 'the six they actually rolled').toBe(6);
  });

  test('Cancel backs out with the card still in hand', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await arm(player, 'Basic attack');
    await tapToken(player);
    await click(player, '#hand .hr-cancel');

    expect(await sent(player), 'a wrong token costs a tap, not the round\'s Act').toHaveLength(0);
    expect(await promptUp(player)).toBe(false);
    const held = await player.evaluate(() =>
      window.armed ? { act: window.armed.entry.nm, target: window.armed.target } : null);
    expect(held, 'the card is still held').toBeTruthy();
    expect(held.act).toBe('Basic attack');
    expect(held.target, 'and the target forgotten, ready for another').toBeFalsy();
  });

  test('Escape backs out of the roll before the card', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await arm(player, 'Basic attack');
    await tapToken(player);

    await player.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(await promptUp(player), 'the roll is what Escape leaves first').toBe(false);
    expect(await player.evaluate(() => !!window.armed), 'the card survives it').toBe(true);

    await player.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(await player.evaluate(() => window.armed), 'a second Escape puts the card down').toBe(null);
    expect(await sent(player)).toHaveLength(0);
  });

  /* ---- the target-first path ------------------------------------------------------- */

  test('right-clicking a foe with an empty hand offers the choice, not an attack', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await rightClick(player);

    expect(await sent(player), 'nothing assumed on the player\'s behalf').toHaveLength(0);
    const opts = await menuOpts(player);
    expect(opts.map((o) => o.kind)).toEqual(['attack', 'skill']);
  });

  test('Attack lists the weapon Acts, with locked ones greyed and priced (F9)', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await rightClick(player);
    await click(player, '#hand .hp-opt[data-pkind="attack"]');

    const opts = await menuOpts(player);
    const names = opts.map((o) => o.act);
    expect(names, 'the standard strike is always there').toContain('Basic attack');
    expect(names, 'and the locked ability is still shown').toContain('Rend');

    const rend = opts.find((o) => o.act === 'Rend');
    expect(rend.locked, 'greyed rather than hidden').toBe(true);
    expect(rend.text, 'wearing what would unlock it').toContain('Charge 2');
    expect(rend.take, 'and not takeable').toBeFalsy();
  });

  test('choosing an attack goes to the same roll, at the same target', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await rightClick(player);
    await click(player, '#hand .hp-opt[data-pkind="attack"]');
    /* by what it says: what identifies it on the wire is which weapon offers it */
    const basic = (await menuOpts(player)).find((o) => o.act === 'Basic attack');
    await click(player, '#hand .hp-opt[data-ptake="' + basic.take + '"]');

    expect(await promptUp(player)).toBe(true);
    expect(await sent(player), 'still not committed').toHaveLength(0);

    await click(player, '#hand .hr-die');
    const out = await sent(player);
    expect(out).toHaveLength(1);
    expect(out[0].act).toBe('Basic attack');
    expect(out[0].target, 'the foe that opened the menu').toBe('m:cb-erasure');
  });

  test('Skill lists the Fell\'s skills and carries the one chosen', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await rightClick(player);
    await click(player, '#hand .hp-opt[data-pkind="skill"]');

    const opts = await menuOpts(player);
    expect(opts.map((o) => o.text.split(' ')[0])).toEqual(['Guard', 'Might']);

    await click(player, '#hand .hp-opt[data-pskill="Guard"]');
    await click(player, '#hand .hr-die');

    const out = await sent(player);
    expect(out[0].skill, 'the skill they picked travels with it').toBe('Guard');
  });

  test('the target-first menu can be backed out of too', async ({ page }) => {
    await T.openTable(page, playerOnly());
    const player = await T.frameFor(page, 'player');
    await T.waitBooted(page, player, 'player');
    await seat(player);

    await rightClick(player);
    await click(player, '#hand .hp-cancel');

    expect(await player.evaluate(() => !!document.querySelector('#hand .hand-pickmenu'))).toBe(false);
    expect(await player.evaluate(() => window.armed), 'nothing picked up by accident').toBe(null);
    expect(await sent(player)).toHaveLength(0);
  });
});
