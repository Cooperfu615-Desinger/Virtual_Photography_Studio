import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getCompiledCatalogForTesting, getLockControls, getKnowledgeBaseSnapshot } from '../engine.js';
import { preAllA5Database as preA5Database } from '../../../../scripts/lib/a5XimendingHistoricalReplay.mjs';
import { createCatalogSnapshots, differences } from '../../../../scripts/lib/catalogBaseline.mjs';

test('A catalog snapshots preserve ordered IDs, aliases and complete compiled metadata', () => {
  const historicalSource = preA5Database();
  const actual = createCatalogSnapshots(getCompiledCatalogForTesting(historicalSource), getLockControls(historicalSource));
  for (const [kind, snapshot] of Object.entries(actual)) {
    const expected = JSON.parse(readFileSync(new URL(`catalogSnapshot.${kind}.json`, import.meta.url), 'utf8'));
    assert.deepEqual(differences(expected, snapshot), [], `${kind}: snapshot changed; do not update during migration`);
  }
});

test('test export captures pre-postprocessing inference once and isolates supplied data and default cache', () => {
  const controls = getLockControls();
  const before = JSON.stringify(controls);
  const source = getKnowledgeBaseSnapshot();
  const sourceBytes = JSON.stringify(source);
  const first = getCompiledCatalogForTesting();
  const supplied = getCompiledCatalogForTesting(source);
  assert.deepEqual(first, supplied);
  assert.equal(JSON.stringify(source), sourceBytes);
  let originalCount = 0, finalCount = 0;
  const groups = { regional: 'Regional', wardrobe: 'Wardrobe', camera: 'CameraLighting', locations: 'Locations', character: 'Character', negative: 'Negative' };
  for (const [group, categories] of Object.entries(first.entries)) {
    for (const [category, entries] of Object.entries(categories)) {
      assert.equal(entries.length, source[groups[group]][category].length);
      for (const [index, item] of entries.entries()) {
        originalCount++;
        assert.ok(item.inferredMeta && item.meta);
        assert.equal(item.en, source[groups[group]][category][index].en.replace(/\*\*/g, '').trim());
      }
    }
  }
  for (const categories of Object.values(first.catalog)) for (const entries of Object.values(categories)) for (const entry of entries) {
    finalCount++;
    assert.equal(Object.hasOwn(entry, 'inferredMeta'), false);
  }
  assert.equal(originalCount, 1050);
  assert.equal(finalCount, originalCount + 2, 'accessory split adds two synthetic none entries');
  assert.notDeepEqual(first.entries.wardrobe, first.catalog.wardrobe, 'accessory split and aliases must occur after the entry capture');
  const item = Object.values(first.entries.wardrobe).flat()[0];
  item.legacyIds.push('test-only-mutation'); item.meta.tags.push('test-only-mutation');
  assert.equal(JSON.stringify(first.catalog).includes('test-only-mutation'), false);
  assert.equal(JSON.stringify(getCompiledCatalogForTesting()).includes('test-only-mutation'), false);
  assert.equal(getLockControls(), controls);
  assert.equal(JSON.stringify(controls), before);
  const miniature = { Wardrobe: { '上身 (Tops)': [{ zh: '測試', en: 'test top', desc: '' }] } };
  assert.equal(getCompiledCatalogForTesting(miniature).entries.wardrobe['上身 (Tops)'].length, 1);
  assert.equal(JSON.stringify(getLockControls()), before);
  assert.throws(() => getCompiledCatalogForTesting([]), /database object/);
});

test('snapshot builder rejects duplicate control and entry identities instead of overwriting', () => {
  assert.throws(() => createCatalogSnapshots({ catalog: {} }, [{ key: 'a', options: [{ id: 'x' }, { id: 'x' }] }]), /duplicate snapshot key/);
  assert.throws(() => createCatalogSnapshots({ catalog: { a: { b: [{ id: 'x' }, { id: 'x' }] } } }, []), /duplicate snapshot key/);
});
