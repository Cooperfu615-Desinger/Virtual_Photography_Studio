// Test-only bridge to the sealed pre-Grok-Imagine engine. Never used at runtime.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import seal from './grokImagineHistoricalSeal.json' with { type: 'json' };
const hash = value => createHash('sha256').update(value).digest('hex');

export function preGrokImagineSource(path, source) {
  if (path !== seal.source) return source;
  const digest = hash(source);
  if (digest === seal.afterHash) {
    const before = gunzipSync(readFileSync(new URL('./grokImaginePrechangeEngine.gz', import.meta.url)));
    assert.equal(hash(before), seal.beforeHash, 'Grok Imagine historical source seal mismatch');
    return Buffer.isBuffer(source) ? before : before.toString('utf8');
  }
  assert.ok(!source.toString().includes('registerGrokImagineResult'), 'Grok Imagine inverse rejects unknown current engine or mixed source');
  return source;
}
