import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import patches from './maiOutfitHistoricalPatches.json' with { type: 'json' };
import { preMaiOutfitSource } from './maiOutfitHistoricalReplay.mjs';
import { preSelfiePropsSource } from './selfiePropsHistoricalReplay.mjs';

test('outfit inverse restores exact main sources without accepting modified bytes', () => {
 for (const entry of patches.files) {
  const current = preSelfiePropsSource(entry.path, readFileSync(new URL('../../' + entry.path, import.meta.url)));
  const before = execFileSync('git', ['show', patches.base + ':' + entry.path]);
  assert.deepEqual(preMaiOutfitSource(entry.path, current), before, entry.path);
  const corrupted = Buffer.concat([current, Buffer.from('\ncorrupt')]);
  assert.deepEqual(preMaiOutfitSource(entry.path, corrupted), corrupted, entry.path);
 }
});
