// A-stage Node-only fixtures/oracles. Not a storage adapter or product migration.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const FIXTURE_URL = new URL('../fixtures/saved-cards-persistence-v1.json', import.meta.url);
export const fixture = JSON.parse(readFileSync(FIXTURE_URL, 'utf8'));
export const STORAGE_KEYS = Object.freeze(['vps.favorites', 'vps.prompts', 'vps.viewMode', 'vps.savedCardsMigration']);
const brandedStores = new WeakSet();
export const hashBytes = text => createHash('sha256').update(text, 'utf8').digest('hex');

function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + Array.from(value, item => canonical(item)).join(',') + ']';
  assert.ok(value && Object.getPrototypeOf(value) === Object.prototype, 'JSON object required');
  return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
}
export function payloadHash(value, { cloud = false } = {}) {
  // Only the top-level transport field is excluded; nested user fields remain.
  const compared = cloud && value && !Array.isArray(value) && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'cloudUpdatedAt')) : value;
  return hashBytes(canonical(compared));
}
export function assertPayloadsEqual(before, after) {
  assert.equal(payloadHash(after), payloadHash(before), 'payload/order/unknown field changed');
}
export function createIsolatedStorage(initial = {}, { readError = null, writeError = null, quotaBytes = Infinity } = {}) {
  assert.ok(initial && Object.getPrototypeOf(initial) === Object.prototype);
  assert.ok(Object.values(initial).every(value => typeof value === 'string'));
  const values = new Map(Object.entries(initial));
  const calls = [];
  const storage = {
    calls,
    getItem(key) {
      calls.push({ operation: 'get', key });
      if (readError) throw new DOMException('synthetic read failure', readError);
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      calls.push({ operation: 'set', key });
      if (writeError) throw new DOMException('synthetic write failure', writeError);
      if (Buffer.byteLength(String(value), 'utf8') > quotaBytes) throw new DOMException('synthetic quota', 'QuotaExceededError');
      values.set(key, String(value));
    },
    removeItem(key) { calls.push({ operation: 'remove', key }); values.delete(key); },
    dump() { return Object.fromEntries(values); },
  };
  brandedStores.add(storage);
  return storage;
}
export function captureIsolatedSnapshot(storage) {
  assert.ok(brandedStores.has(storage), 'Only an explicitly isolated synthetic store is accepted');
  return Object.fromEntries(STORAGE_KEYS.map(key => {
    try {
      const raw = storage.getItem(key);
      if (raw === null) return [key, { status: 'absent', raw: null }];
      return [key, { status: 'present', raw, bytes: Buffer.byteLength(raw, 'utf8'), rawHash: hashBytes(raw) }];
    } catch (error) {
      return [key, { status: 'read-error', error: error.name }];
    }
  }));
}
export function classifyFavoriteSource(snapshot) {
  const item = snapshot['vps.favorites'];
  if (item.status !== 'present') return item.status;
  try { return Array.isArray(JSON.parse(item.raw)) ? 'array' : 'wrong-shape'; }
  catch { return 'invalid-json'; }
}
export function inspectRawRecords(records) {
  // Read-only inventory: no deduplication, resolver, codec or migration writes.
  assert.ok(Array.isArray(records));
  const seen = new Map();
  return records.map((record, index) => {
    let id, kind;
    if (typeof record === 'string') { id = record; kind = 'id-only-unresolved'; }
    else if (record && !Array.isArray(record) && typeof record === 'object') {
      if (Object.hasOwn(record, 'v')) {
        id = record.i;
        kind = [2, 3, 4].includes(record.v) ? 'compact' : 'unknown-version';
      } else { id = record.id; kind = 'raw'; }
      if (typeof id !== 'string' || !id.length) kind = 'missing-id';
    } else kind = 'invalid-record';
    const digest = payloadHash(record);
    const previous = typeof id === 'string' ? seen.get(id) : undefined;
    const duplicate = previous ? (previous.hash === digest ? 'same' : 'conflict') : null;
    if (typeof id === 'string' && !previous) seen.set(id, { index, hash: digest });
    return { index, id: id ?? null, kind, payloadHash: digest, duplicate, firstIndex: previous?.index ?? null };
  });
}
export function makeSyntheticCollection(recipeName) {
  const recipe = fixture.recipes.find(item => item.name === recipeName);
  assert.ok(recipe, 'Unknown fixed recipe');
  const base = fixture.records.find(item => item.name === 'raw-page1').payload;
  return Array.from({ length: recipe.count }, (_, index) => ({
    ...structuredClone(base),
    id: 'synthetic-capacity-' + String(index).padStart(4, '0'),
    grokPrompt: '  Synthetic 原文 🧪\r\n'.repeat(recipe.repeat) + '\nEND-' + index,
    lineage: { rootId: 'synthetic-capacity-' + index, version: 1, parentId: null },
  }));
}
