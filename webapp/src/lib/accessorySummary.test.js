import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAccessorySummaryEntries,
  buildAccessorySummaryText,
} from './accessorySummary.js';

test('accessory summary filters empty controls while preserving field-specific labels', () => {
  const entries = buildAccessorySummaryEntries([
    { key: 'headAccessory', text: '毛帽' },
    { key: 'headAccessoryColor', text: '黑色' },
    { key: 'eyewearColor', text: '黑色' },
    { key: 'empty', text: '全無' },
    { key: 'random', text: '隨機' },
  ]);

  assert.deepEqual(entries.map((entry) => entry.text), ['毛帽', '黑色', '黑色']);
  assert.equal(buildAccessorySummaryText(entries), '毛帽 / 黑色 / 黑色');
});

test('accessory summary collapses repeated values from the same source field', () => {
  assert.equal(
    buildAccessorySummaryText([
      { key: 'waistAccessory', text: '細版皮革腰帶' },
      { key: 'waistAccessory', text: '細版皮革腰帶' },
      { key: 'neckAccessory', text: '多條層疊的水晶項鍊與頸鏈' },
    ]),
    '細版皮革腰帶 / 多條層疊的水晶項鍊與頸鏈',
  );
});
