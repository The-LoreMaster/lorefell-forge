/* A29 — the pack gets lighter when the marker goes down, not when the card is played.
 *
 * Piece 4 of COMBAT_PLACED_UTILITIES. Every other utility is spent in cbDeclare, where the
 * declaration is built and sent, and that is right for them: a Tablet strikes the moment
 * it is chosen. A placed utility is different, and the difference is the whole design -
 * declaring a placement puts NOTHING on the ground, so spending the thing there would take
 * it out of the pack for a placement that has not happened yet.
 *
 * So the LoreMaster's resolution is what spends it, and that means a signal travelling
 * from the board back to the sheet. The guard on that signal is the interesting part.
 *
 * The three signals already going that way - a pending hit, a recap, a charge - each
 * compare a timestamp against a variable in the sheet's window. That is good enough for
 * them: re-showing a pending hit after a reload is harmless, and re-applying a charge is
 * idempotent because it is a SET. Taking a utility out of an inventory is a DECREMENT, and
 * a decrement that fires twice costs a player a thing they own.
 *
 * So this one is guarded at both ends of the store: the board writes a placement id, the
 * sheet writes back an ack, and the condition is placed.pid !== placedAck. The window
 * variable beside it is only the fast half - it stops one poll firing while the ack is in
 * flight. The cases below are mostly about that guard, because everything else here is one
 * line of bookkeeping and the guard is where the money is.
 *
 * The id is DERIVED - Fell, round, utility - never minted from a clock. A clock id makes
 * the same placement a different placement on every read, and then nothing can recognise a
 * repeat and the ack can never match.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { mountSheet, reloadSheet } = require(path.join(__dirname, '_sheet.js'));

const CHAR = 'chr-harness-0001';

const SHELF = [
  { id: 'u-caltrops', name: 'Caltrops', use: 'Act', desc: 'five adjacent spaces' },
  { id: 'u-rune', name: 'Rune', use: 'Act to place', desc: 'casts when stepped on' },
  { id: 'u-salt', name: 'Ash Salt', use: 'Act', desc: 'breaks an Affliction' },
  { id: 'u-bracewell', name: 'Bracewell', use: 'React', desc: 'halve one attack' }
];

/* A sheet in a fight, carrying what the case needs. `placed` and `placedAck` are handed in
 * the way getCombatForChar serves them, so the sheet is reading the same shape the store
 * produces rather than one invented here. */
async function inFight(page, inv, extra) {
  const frame = await mountSheet(page, { home: 'threadspire' });
  await frame.evaluate(({ shelf, rows, more }) => {
    ITEMS_LIB = shelf;
    C.inventory = rows;
    C.attrs.wit.base = 8; C.attrs.wit.mod = 0;
    C.weapons = [];
    CUR_WIX_ID = 'chr-harness-0001';
    window._plog = [];
    window.__sync = [];
    /* the sheet's only way out; captured rather than stubbed to nothing, because what it
       sends is half of what these cases are asking about */
    window.postToVelo = function (m) { window.__sync.push(m); };
    setCombatState(Object.assign({
      active: true, round: 1, phase: 'commit',
      fighters: [{ key: 'p:pl-7', name: 'Maerwen', side: 'fell', charId: 'chr-harness-0001' },
                 { key: 'm:cb-1', name: 'A foe', side: 'monster', charId: '' }],
      you: {}, applied: [], recap: { msg: '', at: 0 },
      pendingHit: { base: 0, bonus: 0, dt: 'phys', at: 0 }, chargeSet: { value: 0, at: 0 },
      placed: null, placedAck: ''
    }, more || {}));
    renderItems(); renderBattle();
  }, { shelf: SHELF, rows: inv, more: extra || null });
  return frame;
}

const carrying = (id, qty) => ({ itemId: id, quantity: qty === undefined ? 1 : qty,
                                 discovered: true, equipped: true });
const pack = (frame) => frame.evaluate(() =>
  (C.inventory || []).map((i) => ({ id: i.itemId, n: i.quantity })));
const log = (frame) => frame.evaluate(() =>
  (window._plog || []).map((e) => (e && (e.text || e.html)) || '').join(' | '));
const acks = (frame) => frame.evaluate(() =>
  (window.__sync || []).filter((m) => m.type === 'combat-sync').map((m) => m.placedAck || ''));

/* the board's own id for a placement, so the spec never invents one */
const PID = 'pl:' + CHAR + ':1:Caltrops';
const placedMsg = (pid, util, squares) => ({ pid: pid, util: util, squares: squares, at: 111 });

/* Push a fresh combat state at the sheet, the way a poll does. The signature guard means a
 * state identical to the last one is ignored, which is correct and is why every call here
 * changes something. */
async function poll(frame, more) {
  await frame.evaluate((m) => {
    setCombatState(Object.assign({
      active: true, round: 1, phase: 'commit',
      fighters: [{ key: 'p:pl-7', name: 'Maerwen', side: 'fell', charId: 'chr-harness-0001' },
                 { key: 'm:cb-1', name: 'A foe', side: 'monster', charId: '' }],
      you: {}, applied: [], recap: { msg: '', at: 0 },
      pendingHit: { base: 0, bonus: 0, dt: 'phys', at: 0 }, chargeSet: { value: 0, at: 0 },
      placed: null, placedAck: ''
    }, m || {}));
  }, more || null);
}

test.describe('A29 declaring a placement does not spend it', () => {

  test('a placed utility survives its own declaration', async ({ page }) => {
    const frame = await inFight(page, [carrying('u-caltrops')]);
    await frame.evaluate(() => {
      window._cbCtlOverride = { cbAct: 'Use a utility', cbItemSel: 'Caltrops', cbFocus: '' };
      window._cbPlaces = [{ x: 350, y: 450 }, { x: 350, y: 550 }];
      cbDeclare();
    });
    expect(await pack(frame),
      'nothing is on the ground yet, so nothing has been used').toEqual([{ id: 'u-caltrops', n: 1 }]);
    expect(await log(frame), 'and the table has not been told it was used')
      .not.toContain('Caltrops');
  });

  test('a utility that is NOT placed is still spent at the declare, as it always was', async ({ page }) => {
    /* the half of the old behaviour that must not move: a Tablet or an Ash Salt resolves
       the moment it is chosen, and waiting on the LoreMaster for it would be wrong */
    const frame = await inFight(page, [carrying('u-salt')]);
    await frame.evaluate(() => {
      window._cbCtlOverride = { cbAct: 'Use a utility', cbItemSel: 'Ash Salt', cbFocus: 'm:cb-1' };
      window._cbPlaces = [];
      cbDeclare();
    });
    expect(await pack(frame), 'spent where it always was').toEqual([]);
    expect(await log(frame)).toContain('Ash Salt');
  });

  test('an undone placement leaves the pack untouched, with no putting-back to do', async ({ page }) => {
    const frame = await inFight(page, [carrying('u-rune')]);
    await frame.evaluate(() => {
      window._cbCtlOverride = { cbAct: 'Use a utility', cbItemSel: 'Rune', cbFocus: '' };
      window._cbPlaces = [{ x: 350, y: 450 }];
      cbDeclare();
      cbResetSelf();                       /* the LoreMaster asks for the Act again */
    });
    expect(await pack(frame),
      'there was never anything to give back').toEqual([{ id: 'u-rune', n: 1 }]);
  });
});

test.describe('A29 the resolution is what spends it', () => {

  test('the placement resolving takes it out of the pack, once', async ({ page }) => {
    const frame = await inFight(page, [carrying('u-caltrops')]);
    await poll(frame, { placed: placedMsg(PID, 'Caltrops', 5), placedAck: '' });

    expect(await pack(frame), 'the marker is down, so the pouch is empty').toEqual([]);
    expect(await log(frame), 'and the table is told').toContain('Caltrops');
  });

  test('a three-use utility ticks down by one, not by one per square', async ({ page }) => {
    const frame = await inFight(page, [carrying('u-caltrops', 3)]);
    await poll(frame, { placed: placedMsg(PID, 'Caltrops', 5), placedAck: '' });

    expect((await pack(frame))[0].n,
      'five squares is one use of the thing, not five').toBe(2);
  });

  test('the sheet acks the placement it spent', async ({ page }) => {
    const frame = await inFight(page, [carrying('u-caltrops')]);
    await poll(frame, { placed: placedMsg(PID, 'Caltrops', 5), placedAck: '' });

    expect(await acks(frame), 'the ack carries the id, so the store can hold the guard')
      .toContain(PID);
  });

  test('polling the same placement again does not spend a second one', async ({ page }) => {
    const frame = await inFight(page, [carrying('u-caltrops', 3)]);
    await poll(frame, { placed: placedMsg(PID, 'Caltrops', 5), placedAck: '' });
    /* the same placement, read again, with something else moved so the signature guard
       does not swallow the poll and make this pass for the wrong reason */
    await poll(frame, { placed: placedMsg(PID, 'Caltrops', 5), placedAck: '', round: 1,
                        chargeSet: { value: 0, at: 5 } });
    await poll(frame, { placed: placedMsg(PID, 'Caltrops', 5), placedAck: PID,
                        chargeSet: { value: 0, at: 6 } });

    expect((await pack(frame))[0].n, 'one placement, one use').toBe(2);
  });

  test('a placement the store says was already acked is not spent at all', async ({ page }) => {
    /* the reload case, from the sheet's point of view: it comes up knowing nothing and the
       row tells it this one is done */
    const frame = await inFight(page, [carrying('u-caltrops')],
      { placed: placedMsg(PID, 'Caltrops', 5), placedAck: PID });

    expect(await pack(frame),
      'the ack in the row is what stops it, not anything the sheet remembered')
      .toEqual([{ id: 'u-caltrops', n: 1 }]);
    expect(await log(frame)).not.toContain('Caltrops');
  });

  test('a reload does not ack an empty string over a real one', async ({ page }) => {
    /* The failure this prevents: a fresh sheet has no ack in memory, pushes an empty one,
       erases the stored ack, then reads the placement as unspent and charges the Fell
       again. The sheet must ADOPT the stored ack before anything of its own goes out. */
    const frame = await inFight(page, [carrying('u-caltrops')],
      { placed: placedMsg(PID, 'Caltrops', 5), placedAck: PID });

    await frame.evaluate(() => { window.__sync = []; combatSyncPush(); });
    const sent = await acks(frame);
    expect(sent.every((a) => a === PID),
      'whatever it says about the placement, it does not say "nothing"').toBe(true);
    expect(await frame.evaluate(() => window._placedSpent),
      'the stored ack was adopted, not ignored').toBe(PID);
  });

  test('a placement another copy of this sheet already acked is not spent again', async ({ page }) => {
    /* THE CASE THAT MAKES THE DURABLE HALF OF THE GUARD EARN ITS PLACE, and it was missing
       from this file until the guard was probed by deleting it and every case still
       passed. A clause no test can tell from its absence is not covered, however sensible
       it reads.
    *
     * The scenario is ordinary at a table: the same Fell open twice, a tablet and a
     * laptop. Copy A spends placement 1 and acks it, so its window variable holds pid 1.
     * The loremaster resolves placement 2 and copy B - which got there first - spends and
     * acks it. Copy A now polls and sees pid 2, which is NOT what its window variable
     * holds, so the fast half of the guard says spend. Only the row saying "already acked"
     * stops it charging the Fell for a thing that is already gone.
     *
     * The window variable is the fast half; the row is the guard. */
    const frame = await inFight(page, [carrying('u-caltrops', 3)]);
    const first = PID;
    const second = 'pl:' + CHAR + ':2:Caltrops';

    /* this copy spends the first one itself, so its window variable is genuinely set */
    await poll(frame, { placed: placedMsg(first, 'Caltrops', 5), placedAck: '' });
    expect((await pack(frame))[0].n, 'the first one really was spent here').toBe(2);
    expect(await frame.evaluate(() => window._placedSpent)).toBe(first);

    /* and now the row reports a placement this copy never handled, already acked */
    await poll(frame, { round: 2, placed: placedMsg(second, 'Caltrops', 5), placedAck: second });

    expect((await pack(frame))[0].n,
      'the other copy already paid for it; this one must not pay again').toBe(2);
  });

  test('a second, different placement in a later round is spent on its own', async ({ page }) => {
    const frame = await inFight(page, [carrying('u-caltrops', 3)]);
    await poll(frame, { placed: placedMsg(PID, 'Caltrops', 5), placedAck: '' });
    expect((await pack(frame))[0].n).toBe(2);

    const later = 'pl:' + CHAR + ':2:Caltrops';
    await poll(frame, { round: 2, placed: placedMsg(later, 'Caltrops', 5), placedAck: PID });
    expect((await pack(frame))[0].n,
      'a different round is a different placement, and it costs its own').toBe(1);
  });

  test('a placement for something no longer carried still acks', async ({ page }) => {
    /* Otherwise the row is re-read on every poll forever, and the sheet spends its life
       trying to spend a thing that is not there. */
    const frame = await inFight(page, [carrying('u-rune')]);
    await poll(frame, { placed: placedMsg(PID, 'Caltrops', 5), placedAck: '' });

    expect(await pack(frame), 'the Rune is untouched').toEqual([{ id: 'u-rune', n: 1 }]);
    expect(await acks(frame), 'and the placement is answered rather than re-read forever')
      .toContain(PID);
  });

  test('a placement with no id is ignored rather than guessed at', async ({ page }) => {
    const frame = await inFight(page, [carrying('u-caltrops')]);
    await poll(frame, { placed: { pid: '', util: 'Caltrops', squares: 5, at: 111 }, placedAck: '' });

    expect(await pack(frame),
      'without an id there is no way to fire once, so it does not fire')
      .toEqual([{ id: 'u-caltrops', n: 1 }]);
  });
});
