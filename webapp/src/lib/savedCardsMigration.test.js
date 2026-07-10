import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_FEED_STORAGE_KEY,
  LEGACY_VIEW_MODE_STORAGE_KEY,
  SAVED_CARDS_MIGRATION_KEY,
  SAVED_CARDS_MIGRATION_VERSION,
  finalizeLegacyFeedMigration,
  mergeLegacyFeedPrompts,
} from './savedCardsMigration.js';

test('legacy Feed cards append to Favorites without replacing richer favorite records', () => {
  const favorite = { id: 'shared', summary: 'favorite copy', selection: { subjectCount: '1' } };
  const legacyDuplicate = { id: 'shared', summary: 'legacy copy' };
  const legacyOnly = { id: 'legacy-only', summary: 'legacy only' };

  assert.deepEqual(
    mergeLegacyFeedPrompts([favorite], [legacyDuplicate, legacyOnly]),
    [favorite, legacyOnly],
  );
});

test('legacy Feed migration ignores malformed records and duplicate ids', () => {
  const first = { id: 'one' };
  const second = { id: 'two' };

  assert.deepEqual(
    mergeLegacyFeedPrompts([], [null, {}, first, first, second]),
    [first, second],
  );
});

test('legacy storage keys are removed only after the complete Favorites payload is saved', () => {
  const values = new Map([
    [LEGACY_FEED_STORAGE_KEY, 'feed'],
    [LEGACY_VIEW_MODE_STORAGE_KEY, 'feed'],
  ]);
  const storage = {
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };

  assert.equal(finalizeLegacyFeedMigration(storage, { failed: true, truncatedCount: 0 }), false);
  assert.equal(values.has(LEGACY_FEED_STORAGE_KEY), true);
  assert.equal(finalizeLegacyFeedMigration(storage, { failed: false, truncatedCount: 1 }), false);
  assert.equal(values.has(LEGACY_FEED_STORAGE_KEY), true);

  assert.equal(finalizeLegacyFeedMigration(storage, { failed: false, truncatedCount: 0 }), true);
  assert.equal(values.has(LEGACY_FEED_STORAGE_KEY), false);
  assert.equal(values.has(LEGACY_VIEW_MODE_STORAGE_KEY), false);
  assert.equal(values.get(SAVED_CARDS_MIGRATION_KEY), SAVED_CARDS_MIGRATION_VERSION);
});
