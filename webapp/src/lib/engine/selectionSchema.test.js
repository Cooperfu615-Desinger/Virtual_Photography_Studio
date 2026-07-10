import test from 'node:test';
import assert from 'node:assert/strict';
import { createSelectionSnapshot } from './selectionSchema.js';

test('selection snapshot follows schema order and fills declared defaults', () => {
  const definitions = [
    { key: 'subjectCount', defaultValue: '1' },
    { key: 'tags', multi: true },
    { key: 'locationId' },
  ];

  const snapshot = createSelectionSnapshot(definitions, {
    subjectCount: '2',
    extraField: 'ignored',
  });

  assert.deepEqual(snapshot, {
    subjectCount: '2',
    tags: [],
    locationId: '',
  });
  assert.deepEqual(Object.keys(snapshot), definitions.map((definition) => definition.key));
});
