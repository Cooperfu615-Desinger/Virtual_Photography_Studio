import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import baseline from './legacyMappings.baseline.json' with { type: 'json' };
import { getLegacyMappingsForTesting, getLockControls, normalizeLocks } from '../engine.js';
import { parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
const hash = value => createHash('sha256').update(value).digest('hex');
test('E immutable pre-move snapshot: 22 computed tables and 2 legacy constants', () => {
  assert.equal(hash(readFileSync(new URL('./legacyMappings.baseline.json', import.meta.url))), '27418a72920655416cdbe38b50ee89f97388e6e261dc2f512d4ac237fe937a6c');
  assert.equal(JSON.stringify(getLegacyMappingsForTesting()), JSON.stringify(baseline.snapshot));
  const copy = getLegacyMappingsForTesting(); copy.tables.REGIONAL_STYLE_LEGACY_OPTION_MAP.length = 0;
  assert.equal(JSON.stringify(getLegacyMappingsForTesting()), JSON.stringify(baseline.snapshot));
});
test('E every legacy source path restores exactly as pre-E, including first-match and explicit selections', () => {
  const controls = getLockControls();
  for (const row of baseline.cases) {
    const actual = row.prompt === undefined ? normalizeLocks(row.input, controls) : parseLocksFromStandardPrompt(row.prompt, controls);
    assert.equal(hash(JSON.stringify(actual)), row.expectedHash, row.table + ': ' + JSON.stringify(row.input ?? row.prompt));
  }
});
