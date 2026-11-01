// Current-behavior characterization only. Mutations are confined to fake stores.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  FAVORITES_STORAGE_KEY, FAVORITES_STORAGE_BUDGET, STORAGE_PERSIST_DELAY_MS, STORAGE_IDLE_TIMEOUT_MS,
  persistFavoriteCollection, loadFavoritePrompts, loadAndMigrateFavoritePrompts,
} from '../../webapp/src/features/saved-cards/localRepository.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, mergeFavoritePrompts } from '../../webapp/src/features/saved-cards/cardCodec.js';
import { fixture, FIXTURE_URL, hashBytes, payloadHash, createIsolatedStorage, captureIsolatedSnapshot, classifyFavoriteSource, inspectRawRecords, makeSyntheticCollection } from './savedCardsPersistenceFixtures.mjs';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const BASELINE_URL = new URL('../../Docs/reports/saved-cards-persistence-a-2026-11-01/baseline.json', import.meta.url);
export const SOURCE_PATHS = Object.freeze([
  'webapp/src/features/saved-cards/localRepository.js',
  'webapp/src/features/saved-cards/cardCodec.js',
  'webapp/src/features/saved-cards/useFavoritesWorkspace.js',
  'webapp/src/features/saved-cards/savedCardArchive.js',
  'webapp/src/features/saved-cards/page1MarkdownSnapshot.js',
  'webapp/src/features/storage/browserStorage.js',
  'webapp/src/lib/savedCardsMigration.js',
  'webapp/src/lib/favoritesRepository.js',
  'webapp/src/lib/favoriteAuthState.js',
  'webapp/src/lib/firebase.js',
  'webapp/src/components/SavedCardsWorkspace.jsx',
  'webapp/src/components/PromptCard.jsx',
  'webapp/src/App.jsx',
  'firestore.rules',
  'webapp/package-lock.json',
]);
export function sourceHashes(directory = ROOT) {
  return Object.fromEntries(SOURCE_PATHS.map(path => [path, hashBytes(readFileSync(join(directory, path)))]));
}
export function assertReviewedSources(expected, directory = ROOT) {
  assert.deepEqual(sourceHashes(directory), expected, 'Source drift: preserve the A baseline; review a forward baseline separately');
}
export function measureBaseline() {
  assert.equal(globalThis.window, undefined, 'Node-only: do not run against a browser');
  assert.equal(globalThis.indexedDB, undefined, 'No IndexedDB connection permitted in stage A');
  const capacities = fixture.recipes.map(recipe => {
    const cards = makeSyntheticCollection(recipe.name);
    const inputHash = payloadHash(cards);
    const serialized = cards.map(serializeFavoritePrompt);
    const storage = createIsolatedStorage();
    const result = persistFavoriteCollection(cards, { storage });
    const stored = JSON.parse(storage.getItem(FAVORITES_STORAGE_KEY));
    assert.equal(payloadHash(cards), inputHash, 'Current code mutated fixture input');
    return { name: recipe.name, count: cards.length, inputHash,
      serializedBytes: Buffer.byteLength(JSON.stringify(serialized), 'utf8'),
      result, persistedCount: stored.length, persistedIds: stored.map(item => item.i),
      storedHash: payloadHash(stored) };
  });
  const formats = fixture.records.map(({ name, payload }) => {
    const before = payloadHash(payload);
    const decoded = deserializeFavoritePrompt(payload);
    const encoded = decoded ? serializeFavoritePrompt(decoded) : null;
    assert.equal(payloadHash(payload), before);
    return { name, inputHash: before, inventory: inspectRawRecords([payload])[0], decoded, encoded };
  });
  const storageCases = fixture.storageCases.map(item => {
    const storage = createIsolatedStorage(item.keys, { readError: item.readError });
    const snapshot = captureIsolatedSnapshot(storage);
    assert.equal(classifyFavoriteSource(snapshot), item.expectedState);
    assert.deepEqual(storage.dump(), item.keys, 'Snapshot must be read-only');
    const loaded = loadFavoritePrompts(storage);
    // The legacy writer is exercised ONLY against a second disposable fake.
    const migrationStore = createIsolatedStorage(item.keys, { readError: item.readError });
    const migrated = loadAndMigrateFavoritePrompts(migrationStore);
    return { name: item.name, snapshot, classification: classifyFavoriteSource(snapshot),
      loadedIds: loaded.map(card => card.id), loadedHash: payloadHash(loaded),
      migratedIds: migrated.map(card => card.id), migratedHash: payloadHash(migrated),
      oldMigrationAfter: migrationStore.dump(), calls: migrationStore.calls };
  });
  const cards = makeSyntheticCollection('131-large').slice(0, 3);
  const original = JSON.stringify([{ preserved: 'old durable data' }]);
  const quota = createIsolatedStorage({ [FAVORITES_STORAGE_KEY]: original }, { quotaBytes: 2 });
  const quotaResult = persistFavoriteCollection(cards, { storage: quota });
  const denied = createIsolatedStorage({ [FAVORITES_STORAGE_KEY]: original }, { writeError: 'SecurityError' });
  const deniedResult = persistFavoriteCollection(cards, { storage: denied });
  const local = { id: 'same-id', grokPrompt: 'local' };
  const remote = { id: 'same-id', grokPrompt: 'remote' };
  const merged = mergeFavoritePrompts([remote], [local]);
  return {
    schemaVersion: 1, stage: 'A-current-behavior-not-v1-acceptance',
    baseCommit: '60c46d39ef0524c9b641c771e6319fb5d4b2e091',
    fixtureHash: hashBytes(readFileSync(FIXTURE_URL)), sources: sourceHashes(),
    constants: { key: FAVORITES_STORAGE_KEY, budget: FAVORITES_STORAGE_BUDGET,
      delayMs: STORAGE_PERSIST_DELAY_MS, idleTimeoutMs: STORAGE_IDLE_TIMEOUT_MS },
    capacities, formats, storageCases,
    faults: { quota: { result: quotaResult, after: quota.dump() }, denied: { result: deniedResult, after: denied.dump() } },
    merge: { local, remote, merged, countIncreased: merged.length > 1 },
    futureAcceptance: fixture.futureScenarios.map(({ id, phase, status }) => ({ id, phase, status })),
  };
}
export function verifyBaseline() {
  const expected = JSON.parse(readFileSync(BASELINE_URL, 'utf8'));
  assertReviewedSources(expected.sources);
  const actual = measureBaseline();
  assert.deepEqual(actual, expected, 'A baseline changed; do not overwrite historical evidence');
  return { stage: 'A', baselineMatched: true, fixtureRecords: fixture.records.length,
    storageCases: fixture.storageCases.length, capacityRecipes: fixture.recipes.length,
    futureCasesPrepared: fixture.futureScenarios.length, futureCasesExecuted: 0,
    productPersistenceImplemented: false, networkRequests: 0 };
}
