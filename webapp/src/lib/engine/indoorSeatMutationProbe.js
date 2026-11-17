// Runs only inside an isolated source copy. Infrastructure errors must escape.
import assert from 'node:assert/strict';
import process from 'node:process';
import { expectations, sceneFor, actionFor, witnessRecords, assertWitness, assertSeatRule,
  assertExcludedOwners, assertRestoredWitnesses, approvedLegacyRows, legacyRow } from './indoorSeatVerificationSupport.js';

const family = expectations.witnesses.find(w => w.id === process.argv[2]);
assert.ok(family, 'Unknown mutation witness family');
const scene = sceneFor(family.sceneId), action = actionFor(family.actionId);
const failures = [];
function check(category, fn) {
  try { fn(); }
  catch (error) {
    if (!(error instanceof assert.AssertionError)) throw error;
    failures.push({ category, message: error.message.split('\n')[0] });
  }
}
check('rules', () => assertSeatRule(scene, action));
check('owner', () => assertExcludedOwners());
if (process.argv[3] === 'restore') check('restore', () => assertRestoredWitnesses());
for (const record of witnessRecords([family])) check('witness', () => assertWitness(record));
check('legacy-row', () => assert.deepEqual(legacyRow(scene, action), approvedLegacyRows()[scene.id + '/' + action.id]));
process.stdout.write(JSON.stringify({ failures }));
