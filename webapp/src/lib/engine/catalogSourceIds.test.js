import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCompiledCatalogForTesting, getKnowledgeBaseSnapshot } from '../engine.js';

const entries = source => getCompiledCatalogForTesting(source).entries.camera['環境光條件 (Ambient Light Conditions)'];
test('formal IDs and alias order survive source renaming and reordering without invented aliases', () => {
  const source = getKnowledgeBaseSnapshot();
  const rows = source.CameraLighting['環境光條件 (Ambient Light Conditions)'];
  const expected = new Map(entries(source).map(row => [row.id, row.legacyIds]));
  rows.reverse(); rows[0].zh = '僅供 ID 回歸的改名';
  for (const row of entries(source)) assert.deepEqual(row.legacyIds, expected.get(row.id));
  assert.equal(entries(source)[0].id, rows[0].stableId);
});
test('explicit empty aliases remain empty while stableId-only and legacy records keep fallback behavior', () => {
  const category = '環境光條件 (Ambient Light Conditions)';
  const raw = { zh: '測試光', en: 'test light', desc: 'test description' };
  const source = { CameraLighting: { [category]: [{ ...raw, stableId: 'camera:fixture:explicit', legacyIds: [] }, { ...raw, stableId: 'camera:fixture:old' }, { ...raw }] } };
  const result = entries(source);
  assert.deepEqual(result[0].legacyIds, []);
  assert.equal(result[1].id, 'camera:fixture:old');
  assert.equal(result[1].legacyIds.length, 2);
  assert(result[1].legacyIds.every(id => id.endsWith(':1')));
  assert.equal(result[2].legacyIds.length, 2);
  assert(result[2].id.endsWith(':2'));
});
