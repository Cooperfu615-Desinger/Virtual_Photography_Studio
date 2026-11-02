import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectSyntheticMigration, makeSyntheticSource, snapshotSyntheticSource, stableJSON } from './persistenceBMigration.js';
import { withIsolatedMigrationLock } from './persistenceBCoordinator.js';

test('B source guard rejects real or unbranded adapters', async () => {
  await assert.rejects(snapshotSyntheticSource({read: () => null}), /Synthetic source required/);
});
test('canonical payload comparison preserves unknown fields, arrays and whitespace', () => {
  assert.equal(stableJSON({b: 2, a: 1}), stableJSON({a: 1, b: 2}));
  assert.notEqual(stableJSON({a: ['x','y']}), stableJSON({a: ['y','x']}));
  assert.notEqual(stableJSON({a: 'x '}), stableJSON({a: 'x'}));
  assert.notEqual(stableJSON({a: 1, unknown: true}), stableJSON({a: 1}));
  assert.throws(() => stableJSON([undefined]), /Non-JSON/);
  assert.throws(() => stableJSON(Array(1)), /Non-JSON/);
  assert.throws(() => stableJSON({a: NaN}), /Non-JSON/);
});
test('unknown versions and conflicting duplicate records remain unresolved', async () => {
  const source = makeSyntheticSource({'vps.favorites': JSON.stringify([{id:'a', future:{note:'原文'}}, {id:'a', future:{note:'不同'}}, {v:99,i:'b'}])});
  const raw=source.read('vps.favorites'), snapshot=await snapshotSyntheticSource(source);
  const {records, unresolved}=await inspectSyntheticMigration(snapshot);
  assert.equal(source.read('vps.favorites'), raw);
  assert.deepEqual(records.map(row=>row.cardId),['a']);
  assert.deepEqual(unresolved.map(row=>row.reason),['duplicate-conflict','unknown-version']);
  assert.equal(snapshot['vps.favorites'].raw, raw);
});
test('ID-only records follow legacy feed ordering and missing IDs are unresolved', async () => {
  const source=makeSyntheticSource({'vps.favorites': JSON.stringify(['b','missing','a']), 'vps.prompts': JSON.stringify([{id:'a'},{id:'b'}])});
  const result=await inspectSyntheticMigration(await snapshotSyntheticSource(source));
  assert.deepEqual(result.records.map(row=>row.cardId),['a','b']);
  assert.deepEqual(result.unresolved.map(row=>row.reason),['missing-id-only']);
});
test('Web Lock contention fails closed and absent locks use fallback', async () => {
  const name='vps-saved-cards-b-test-unit';
  assert.equal(await withIsolatedMigrationLock({name,lockManager:null,operation:()=>42}),42);
  await assert.rejects(withIsolatedMigrationLock({name,lockManager:{request:async (_name,_options,callback)=>callback(null)},operation:()=>42}),/unavailable/);
});
