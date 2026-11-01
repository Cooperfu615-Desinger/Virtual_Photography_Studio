import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  fixture, hashBytes, payloadHash, assertPayloadsEqual, createIsolatedStorage,
  captureIsolatedSnapshot, classifyFavoriteSource, inspectRawRecords, makeSyntheticCollection,
} from '../lib/savedCardsPersistenceFixtures.mjs';
import { ROOT, BASELINE_URL, SOURCE_PATHS, sourceHashes, assertReviewedSources, measureBaseline, verifyBaseline } from '../lib/savedCardsPersistenceBaseline.mjs';
import {
  serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt,
} from '../../webapp/src/features/saved-cards/cardCodec.js';
import { createSavedCardsArchive } from '../../webapp/src/features/saved-cards/savedCardArchive.js';
import { SAVED_CARD_BACKUP_MARKER } from '../../webapp/src/features/saved-cards/page1MarkdownSnapshot.js';
const require = createRequire(new URL('../../webapp/package.json', import.meta.url));
const JSZip = require('jszip');
const baseline = JSON.parse(readFileSync(BASELINE_URL, 'utf8'));
const archiveBaseline = JSON.parse(readFileSync(new URL('../../Docs/reports/saved-cards-persistence-a-2026-11-01/archive-baseline.json', import.meta.url), 'utf8'));
import { measureArchiveBaseline } from '../lib/savedCardsPersistenceArchiveBaseline.mjs';

test('A baseline is deterministic and exactly matches the sealed current behavior', () => {
  assert.deepEqual(measureBaseline(), baseline);
  assert.equal(verifyBaseline().futureCasesExecuted, 0);
});
test('snapshot distinguishes absent, empty, invalid and denied without any writes', () => {
  for (const row of fixture.storageCases) {
    const store = createIsolatedStorage(row.keys, { readError: row.readError });
    const result = captureIsolatedSnapshot(store);
    assert.equal(classifyFavoriteSource(result), row.expectedState);
    assert.deepEqual(store.dump(), row.keys);
    assert.ok(store.calls.every(call => call.operation === 'get'));
    for (const value of Object.values(result)) {
      if (value.status === 'present') {
        assert.equal(value.rawHash, hashBytes(value.raw));
        assert.equal(value.bytes, Buffer.byteLength(value.raw, 'utf8'));
      }
    }
  }
});
test('snapshot rejects real or unbranded storage, even if it has a getItem method', () => {
  let touched = false;
  assert.throws(() => captureIsolatedSnapshot({ getItem() { touched = true; } }), /isolated/);
  assert.equal(touched, false);
});
test('raw snapshot and raw payload keep exact UTF-8, whitespace and unknown fields', () => {
  const item = fixture.storageCases.find(row => row.name === 'mixed-records');
  const snapshot = captureIsolatedSnapshot(createIsolatedStorage(item.keys));
  assert.equal(snapshot['vps.favorites'].raw, item.keys['vps.favorites']);
  const payloads = JSON.parse(snapshot['vps.favorites'].raw);
  assertPayloadsEqual(fixture.records.map(row => row.payload), payloads);
  assert.ok(payloads.some(row => row.ld));
  assert.ok(payloads.some(row => row.futureField));
});
test('payload comparison detects loss, reorder, truncation and id/text changes', () => {
  const before = fixture.records.map(row => row.payload);
  const mutations = [
    x => x.pop(), x => x.reverse(), x => { x[0].grokPrompt = x[0].grokPrompt.replace('\r\n', '\n'); },
    x => { delete x[0].futureField; }, x => { x[0].id = x[0].id.toUpperCase(); },
    x => { x[0].extraPrompts.pop(); }, x => { x[0].lineage.parentId = 'changed'; },
    x => { x[0].selection.locationId = 'normalized'; },
  ];
  for (const mutate of mutations) {
    const after = structuredClone(before); mutate(after);
    assert.throws(() => assertPayloadsEqual(before, after), /changed/);
  }
});
test('comparison ignores object key order only and rejects non-JSON values', () => {
  assert.equal(payloadHash({ a: 1, b: 2 }), payloadHash({ b: 2, a: 1 }));
  assert.notEqual(payloadHash([1, 2]), payloadHash([2, 1]));
  for (const value of [undefined, NaN, Infinity, new Date(), { x: undefined }, [, 1]]) {
    assert.throws(() => payloadHash(value));
  }
  assert.notEqual(hashBytes('{"a":1}'), hashBytes('{ "a": 1 }'));
});
test('cloud comparison excludes only the top-level transport timestamp', () => {
  const a = { g: ' raw ', cloudUpdatedAt: 'first', futureField: { cloudUpdatedAt: 'user' } };
  const b = { ...a, cloudUpdatedAt: 'second' };
  assert.notEqual(payloadHash(a), payloadHash(b));
  assert.equal(payloadHash(a, { cloud: true }), payloadHash(b, { cloud: true }));
  b.futureField = { cloudUpdatedAt: 'changed' };
  assert.notEqual(payloadHash(a, { cloud: true }), payloadHash(b, { cloud: true }));
});
test('raw inventory accounts for every duplicate and malformed record without choosing a winner', () => {
  const a = fixture.records[0].payload;
  const rows = [a, structuredClone(a), { ...a, grokPrompt: 'conflict' }, null, 'id-only', { v: 99, i: 'unknown' }, { id: '' }];
  const before = structuredClone(rows), result = inspectRawRecords(rows);
  assert.equal(result.length, rows.length);
  assert.deepEqual(result.map(x => x.duplicate), [null, 'same', 'conflict', null, null, null, null]);
  assert.equal(result[3].kind, 'invalid-record');
  assert.equal(result[4].kind, 'id-only-unresolved');
  assert.equal(result[5].kind, 'unknown-version');
  assert.equal(result[6].kind, 'missing-id');
  assert.deepEqual(rows, before);
});
test('supported versions preserve public text while opaque source preservation stays separate', () => {
  for (const v of [2, 3, 4]) {
    const p = fixture.records.find(row => row.name === 'compact-v' + v).payload;
    const restored = deserializeFavoritePrompt(p);
    assert.equal(restored.id, p.i);
    for (const [field, compact] of [['midjourneyPrompt', 'm'], ['grokPrompt', 'g'], ['zImagePrompt', 'z'], ['nanoBananaPrompt', 'nb']]) {
      assert.equal(restored[field], p[compact]);
    }
    assert.deepEqual(restored.extraPrompts, p.e);
    assert.deepEqual(restored.lineage, p.n);
    assert.equal(restored.futureField, undefined, 'Existing codec is a lossy projection, not a migration');
    assert.equal(serializeFavoritePrompt(restored).v, 3);
  }
  assert.equal(baseline.formats.find(row => row.name === 'unknown-version').decoded, null);
  assert.equal(baseline.formats.find(row => row.name === 'missing-id').decoded, null);
});
test('source-specific payloads, character identity and removed outputs remain in raw fixtures', () => {
  const sources = new Set(fixture.records.map(row => row.payload.source).filter(Boolean));
  for (const source of ['page1', 'page2', 'page3', 'actionPose', 'future-source']) assert.ok(sources.has(source));
  assert.ok(fixture.records.find(row => row.name === 'page2').payload.profile.identityAndBody);
  assert.ok(fixture.records[0].payload.extraPrompts.some(row => row.id === 'chest-up-mj-portrait'));
  assert.equal('nanoBananaPrompt' in fixture.records.find(row => row.name === 'no-nano').payload, false);
  assert.equal(deserializeFavoritePrompt(fixture.records.find(row => row.name === 'unicode-id').payload).id, '卡片/A %2F 🧪');
});
test('capacity recipes reproduce old truncation; none assert that v1 persistence already exists', () => {
  assert.deepEqual(fixture.recipes.map(row => row.count), [131, 500, 1000, 1]);
  for (const row of baseline.capacities) {
    assert.ok(row.serializedBytes > 2250000, row.name);
    assert.ok(row.persistedCount < row.count);
    assert.equal(row.result.truncatedCount, row.count - row.persistedCount);
  }
  assert.equal(baseline.capacities.find(row => row.name === 'single-oversized').persistedCount, 0);
  assert.throws(() => makeSyntheticCollection('../../private'), /Unknown fixed recipe/);
});
test('quota fallback and non-quota failure are recorded as old behavior, not accepted new behavior', () => {
  assert.equal(baseline.faults.quota.after['vps.favorites'], '[]');
  assert.equal(baseline.faults.quota.result.failed, false);
  assert.equal(baseline.faults.denied.result.failed, true);
  assert.equal(baseline.faults.denied.after['vps.favorites'], '[{"preserved":"old durable data"}]');
});
test('old malformed read and destructive migration are demonstrated only in disposable memory', () => {
  for (const name of ['broken-json', 'read-denied', 'wrong-shape']) {
    const row = baseline.storageCases.find(item => item.name === name);
    assert.deepEqual(row.loadedIds, []);
    assert.equal(row.oldMigrationAfter['vps.favorites'], '[]');
  }
  const conflict = baseline.storageCases.find(row => row.name === 'legacy-merge-conflict');
  assert.deepEqual(conflict.migratedIds, ['synthetic-legacy', 'legacy-only']);
  assert.equal('vps.prompts' in conflict.oldMigrationAfter, false);
});
test('ID-only ordering and missing references are recorded rather than guessed', () => {
  assert.deepEqual(baseline.storageCases.find(row => row.name === 'id-only').loadedIds, ['synthetic-legacy']);
  assert.deepEqual(baseline.storageCases.find(row => row.name === 'id-order').loadedIds, ['legacy-a', 'legacy-b']);
});
test('same-count different content demonstrates why count is not sync evidence', () => {
  assert.equal(baseline.merge.countIncreased, false);
  assert.equal(baseline.merge.merged[0].grokPrompt, 'local');
  assert.notEqual(payloadHash(baseline.merge.local), payloadHash(baseline.merge.remote));
});
test('131-card archive records its known Unicode defect; filtered scope and input stay intact', async () => {
  const cards = makeSyntheticCollection('131-large'), before = payloadHash(cards);
  const zip = await JSZip.loadAsync(await createSavedCardsArchive(cards, 1790812800000, 'nodebuffer'));
  const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
  const backup = JSON.parse(await zip.file('saved-cards-backup.json').async('string'));
  assert.equal(manifest.items.length, 131);
  assert.equal(Object.keys(zip.files).filter(name => name.endsWith('.md')).length, 131);
  assert.equal(manifest.backupOnlyFiles.length, 131);
  assert.notEqual(payloadHash(cards), payloadHash(backup.items), 'Known current defect; v1 must eventually preserve all bytes');
  assert.deepEqual(await measureArchiveBaseline(), archiveBaseline);
  assert.equal(payloadHash(cards), before);
  const selected = cards.slice(3, 6);
  const filtered = await JSZip.loadAsync(await createSavedCardsArchive(selected, 1790812800000, 'nodebuffer'));
  assert.deepEqual(JSON.parse(await filtered.file('manifest.json').async('string')).items.map(row => row.sourceId), selected.map(row => row.id));
  const markdown = buildMarkdownExport(cards[0]);
  assert.ok(markdown.startsWith(SAVED_CARD_BACKUP_MARKER));
  assert.throws(() => parseExportedMarkdownPrompt(markdown), /備份.*無法直接匯入/);
});
test('all 15 future scenarios have concrete inputs and outcomes but are not marked executed', () => {
  assert.deepEqual(fixture.futureScenarios.map(x => x.id), Array.from({ length: 15 }, (_, i) => 'SC-P' + String(i + 1).padStart(2, '0')));
  for (const row of fixture.futureScenarios) {
    assert.ok(row.inputs.length > 0); assert.ok(row.expected.length > 0);
    assert.equal(row.status, 'prepared-not-executed');
    assert.ok(row.phase.includes('B') || row.phase.includes('C') || row.phase.includes('D'));
  }
});
test('source drift is rejected and no baseline rewrite occurs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'saved-cards-a-source-'));
  const before = readFileSync(BASELINE_URL);
  try {
    for (const path of SOURCE_PATHS) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), readFileSync(join(ROOT, path)));
    }
    assertReviewedSources(baseline.sources, dir);
    writeFileSync(join(dir, SOURCE_PATHS[0]), 'unknown source');
    assert.throws(() => assertReviewedSources(baseline.sources, dir), /Source drift/);
    assert.deepEqual(readFileSync(BASELINE_URL), before);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('CLI is read-only and refuses update/output/input/browser flags', () => {
  const before = sourceHashes(), baselineBefore = readFileSync(BASELINE_URL);
  const result = JSON.parse(execFileSync(process.execPath, ['scripts/check_saved_cards_persistence_a.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' }));
  assert.equal(result.baselineMatched, true);
  for (const args of [['--update'], ['--output', '/tmp/no-write'], ['--input', 'private.json'], ['--browser'], ['--check', '--measure']]) {
    assert.equal(spawnSync(process.execPath, ['scripts/check_saved_cards_persistence_a.mjs', ...args], { cwd: ROOT }).status, 2);
  }
  assert.deepEqual(sourceHashes(), before);
  assert.deepEqual(readFileSync(BASELINE_URL), baselineBefore);
});
