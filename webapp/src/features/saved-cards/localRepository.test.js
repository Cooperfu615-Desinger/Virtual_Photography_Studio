import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FAVORITES_STORAGE_KEY,
  fitPromptsToStorageBudget,
  loadAndMigrateFavoritePrompts,
  persistFavoriteCollection,
} from './localRepository.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values,
  };
}

function prompt(id, summary = id) {
  return { id, summary, date: '2026-07-10T00:00:00.000Z', midjourneyPrompt: 'prompt' };
}

test('favorite repository migrates legacy feed cards and records completion', () => {
  const storage = createStorage({
    'vps.favorites': JSON.stringify([prompt('favorite')]),
    'vps.prompts': JSON.stringify([prompt('legacy')]),
  });

  const favorites = loadAndMigrateFavoritePrompts(storage);
  assert.deepEqual(favorites.map((item) => item.id), ['favorite', 'legacy']);
  assert.equal(storage.getItem('vps.prompts'), null);
  assert.equal(storage.getItem('vps.savedCardsMigration'), 'feed-to-favorites-v1');
  assert.equal(JSON.parse(storage.getItem(FAVORITES_STORAGE_KEY)).length, 2);
});

test('favorite repository truncates at prompt boundaries', () => {
  const prompts = [{ id: 'a', value: '12345' }, { id: 'b', value: '67890' }];
  const firstPromptBudget = new TextEncoder().encode(JSON.stringify([prompts[0]])).byteLength;
  assert.deepEqual(fitPromptsToStorageBudget(prompts, firstPromptBudget), [prompts[0]]);
});

test('favorite repository persists the newest records within the configured budget', () => {
  const storage = createStorage();
  const result = persistFavoriteCollection([prompt('first'), prompt('second')], {
    storage,
    budget: 200,
  });

  assert.equal(result.failed, false);
  assert.ok(result.truncatedCount >= 1);
  assert.equal(JSON.parse(storage.getItem(FAVORITES_STORAGE_KEY))[0].i, 'first');
});
