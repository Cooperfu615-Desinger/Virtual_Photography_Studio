import assert from 'node:assert/strict';
import test from 'node:test';

import { loadJsonStorage, loadStringStorage, saveJsonStorage } from './browserStorage.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    values,
  };
}

test('browser storage helpers parse JSON and preserve fallbacks', () => {
  const storage = createStorage({ profile: '{"mode":"page1"}', mode: 'page2', broken: '{' });

  assert.deepEqual(loadJsonStorage('profile', {}, storage), { mode: 'page1' });
  assert.deepEqual(loadJsonStorage('missing', { mode: 'fallback' }, storage), { mode: 'fallback' });
  assert.deepEqual(loadJsonStorage('broken', { mode: 'fallback' }, storage), { mode: 'fallback' });
  assert.equal(loadStringStorage('mode', 'page1', storage), 'page2');
});

test('saveJsonStorage writes serialized values and reports failures', () => {
  const storage = createStorage();
  assert.equal(saveJsonStorage('profile', { mode: 'page3' }, storage), true);
  assert.equal(storage.values.get('profile'), '{"mode":"page3"}');

  const failingStorage = { setItem: () => { throw new Error('quota'); } };
  assert.equal(saveJsonStorage('profile', {}, failingStorage), false);
});
