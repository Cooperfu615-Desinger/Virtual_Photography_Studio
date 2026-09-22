// Node-only scoped replacement for historical chest-output hashes. Historical
// baselines stay immutable; the other four outputs, selections and RNG are pinned
// to the pre-change engine as well as to their existing feature-specific gates.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { digest, OUTPUT_FIELDS } from './sceneIntegratedAssemblyTestSupport.js';

export const CHEST_OUTPUT_FIELDS = ['chestUpPortraitPrompt', 'chestUpMjPortraitPrompt'];
export const PROTECTED_OUTPUT_FIELDS = OUTPUT_FIELDS.filter(field => !CHEST_OUTPUT_FIELDS.includes(field));

export function measureChestUpRevision(results) {
  return {
    count: results.length,
    chestHashes: Object.fromEntries(CHEST_OUTPUT_FIELDS.map(field => [field, digest(results.map(r => r.outputs[field]))])),
    protectedHash: digest(results.map(r => PROTECTED_OUTPUT_FIELDS.map(field => r.outputs[field]))),
    selectionHash: digest(results.map(r => r.selection)),
    randomHash: digest(results.map(r => r.randomDraws)),
  };
}

export function assertChestUpRevision(group, results) {
  const expected = JSON.parse(readFileSync(new URL('./chestUpSameStateBaseline.json', import.meta.url), 'utf8'));
  assert.ok(expected.groups[group], `Missing scoped chest baseline: ${group}`);
  assert.deepEqual(measureChestUpRevision(results), expected.groups[group], `${group}: chest revision or protected state drift`);
}
