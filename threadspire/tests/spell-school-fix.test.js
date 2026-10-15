// threadspire/tests/spell-school-fix.test.js
// scripts/fixSpellSchool.js against a local SQLite copy of the Creations table: the old
// SigilForge swap is fixed, every right row and every row it could not have made stays as
// it was, and a second run changes nothing.
'use strict';
const assert = require('assert');
let DatabaseSync;
try { ({ DatabaseSync } = require('node:sqlite')); } catch (e) {
  console.log('spell-school-fix: skipped, this Node has no node:sqlite.');
  process.exit(0);
}
const { run } = require('../../scripts/fixSpellSchool.js');

const db = new DatabaseSync(':memory:');
db.exec('CREATE TABLE "Creations" (_id TEXT PRIMARY KEY, _owner TEXT, _createdDate TEXT, _updatedDate TEXT, data TEXT)');
const q = async (sql, params = []) => {
  const st = db.prepare(sql);
  return /^\s*select/i.test(sql) ? st.all(...params) : (st.run(...params), []);
};

const spell = (focus, school) => ({ forgeKey: 'sigilforge', creationName: focus + ' spell', payload: JSON.stringify({ meta: { type: 'Spell', item: focus, focus, school } }) });
const migrated = (focus, school) => ({ forgeKey: 'sigilforge', payload: JSON.stringify({ grammar: 'Spell', focus, weaponOrSchool: school, migrated: true }) });
const rows = {
  ringBad: spell('Ring', 'Creation'),
  orbBad: spell('Orb', 'Creation'),
  grimoireBad: spell('Grimoire', 'Spirit'),
  cardsGood: spell('Cards', 'Creation'),
  amuletGood: spell('Amulet', 'Spirit'),
  wandGood: spell('Wand', 'Weaving'),
  scrollWeaving: spell('Scroll', 'Weaving'),
  scrollMigratedBad: migrated('Scroll', 'Spirit'),
  ringMigratedGood: migrated('Ring', 'Spirit'),
  ability: { forgeKey: 'sigilforge', payload: JSON.stringify({ meta: { type: 'Ability', weapon: 'Sword', school: '', focus: '' } }) },
  monster: { forgeKey: 'sigilforge', payload: JSON.stringify({ meta: { type: 'Monster', monsterSchool: 'Creation', focus: '' } }) },
  otherForge: { forgeKey: 'brandforge', payload: JSON.stringify({ meta: { focus: 'Ring', school: 'Creation' } }) }
};
const ins = db.prepare('INSERT INTO "Creations" VALUES (?, ?, ?, ?, ?)');
for (const [id, d] of Object.entries(rows)) ins.run(id, 'o', 't0', 't0', JSON.stringify(d));

const read = (id) => {
  const r = db.prepare('SELECT data, _updatedDate FROM "Creations" WHERE _id = ?').get(id);
  const p = JSON.parse(JSON.parse(r.data).payload);
  return { school: p.meta ? p.meta.school : p.weaponOrSchool, touched: r._updatedDate !== 't0' };
};

(async () => {
  const log = console.log; console.log = () => {};
  const first = await run(q);
  const second = await run(q);
  console.log = log;

  assert.strictEqual(first, 4, 'four swapped rows are fixed');
  assert.strictEqual(second, 0, 'a second run finds nothing');
  assert.strictEqual(read('ringBad').school, 'Spirit');
  assert.strictEqual(read('orbBad').school, 'Spirit');
  assert.strictEqual(read('grimoireBad').school, 'Creation');
  assert.strictEqual(read('scrollMigratedBad').school, 'Creation');
  for (const id of ['cardsGood', 'amuletGood', 'wandGood', 'scrollWeaving', 'ringMigratedGood', 'ability', 'monster', 'otherForge']) {
    assert.strictEqual(read(id).touched, false, id + ' is left as it was');
  }
  assert.strictEqual(read('scrollWeaving').school, 'Weaving', 'a disagreement the old swap could not make is reported, not changed');
  assert.strictEqual(read('monster').school, undefined);
  console.log('spell-school-fix: ok');
})().catch((e) => { console.error(e); process.exit(1); });
