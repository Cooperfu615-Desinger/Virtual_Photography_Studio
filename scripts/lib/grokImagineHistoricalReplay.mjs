import { preIndoorSeatSource } from './indoorSeatHistoricalReplay.mjs';
// Test-only bridge to the sealed pre-Grok-Imagine engine. Never used at runtime.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import seal from './grokImagineHistoricalSeal.json' with { type: 'json' };
const hash = value => createHash('sha256').update(value).digest('hex');

export function preGrokImagineSource(path, source) {
  source = preIndoorSeatSource(path, source);
  if (path !== seal.source) return source;
  // The outfit's display-name exception is later than the sealed Grok change.
  // Accept only its exact reviewed bytes, then replay the original seal.
  if (hash(source) === '0727139c62bb897a5916aa1d33ffd2b7b2f887c56224a07d4638f91f89751753') {
    const line = "    if (rawZh === '不知火舞風女忍者套裝') return `套裝：${rawZh}`;\n";
    const original = source.toString().replace(line, '');
    assert.equal(hash(original), seal.afterHash, 'Outfit inverse must restore sealed Grok engine');
    source = Buffer.isBuffer(source) ? Buffer.from(original) : original;
  }
  const digest = hash(source);
  if (digest === seal.afterHash) {
    const before = gunzipSync(readFileSync(new URL('./grokImaginePrechangeEngine.gz', import.meta.url)));
    assert.equal(hash(before), seal.beforeHash, 'Grok Imagine historical source seal mismatch');
    return Buffer.isBuffer(source) ? before : before.toString('utf8');
  }
  assert.ok(!source.toString().includes('registerGrokImagineResult'), 'Grok Imagine inverse rejects unknown current engine or mixed source');
  return source;
}
