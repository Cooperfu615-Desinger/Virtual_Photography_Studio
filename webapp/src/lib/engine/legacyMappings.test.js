import {preC4JewelryHistoricalTest} from '../../../../scripts/lib/c4JewelryHistoricalTest.mjs';
const c4JewelryHistoricalTest=preC4JewelryHistoricalTest(import.meta.url);
import {withPreC4CatalogReplay} from '../../../../scripts/lib/c4CatalogLabelsReplay.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import baseline from './legacyMappings.baseline.json' with { type: 'json' };
import { getLockControls, normalizeLocks } from '../engine.js';
import { pathToFileURL } from 'node:url';
import { withPreA2WardrobeRecoveryReplay } from '../../../../scripts/lib/a2WardrobeColorRecoveryReplay.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
test('E immutable pre-move snapshot: 22 computed tables and 2 legacy constants', async () => {
 await withPreC4CatalogReplay(async directory => {
 const {getLegacyMappingsForTesting}=await import(pathToFileURL(directory+'/webapp/src/lib/engine.js'));
  assert.equal(hash(readFileSync(new URL('./legacyMappings.baseline.json', import.meta.url))), '27418a72920655416cdbe38b50ee89f97388e6e261dc2f512d4ac237fe937a6c');
  assert.equal(JSON.stringify(getLegacyMappingsForTesting()), JSON.stringify(baseline.snapshot));
  const copy = getLegacyMappingsForTesting(); copy.tables.REGIONAL_STYLE_LEGACY_OPTION_MAP.length = 0;
  assert.equal(JSON.stringify(getLegacyMappingsForTesting()), JSON.stringify(baseline.snapshot));
 });
});
c4JewelryHistoricalTest('E every legacy source path restores exactly as pre-E, including first-match and explicit selections', async () => {
  await withPreA2WardrobeRecoveryReplay(async directory => {
  const { parseLocksFromStandardPrompt } = await import(pathToFileURL(directory + '/webapp/src/features/saved-cards/cardCodec.js'));
  const controls = getLockControls();
  for (const row of baseline.cases) {
    const actual = row.prompt === undefined ? normalizeLocks(row.input, controls) : parseLocksFromStandardPrompt(row.prompt, controls);
    assert.equal(hash(JSON.stringify(actual)), row.expectedHash, row.table + ': ' + JSON.stringify(row.input ?? row.prompt));
  }
  });
});
