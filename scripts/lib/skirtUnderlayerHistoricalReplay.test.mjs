import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import review from './skirtUnderlayerHistory.json' with { type: 'json' };
import { preSkirtUnderlayerSource, skirtUnderlayerHistoricalPaths } from './skirtUnderlayerHistoricalReplay.mjs';
import { preIndoorKneelSource } from './indoorKneelHistoricalReplay.mjs';

const root = new URL('../../', import.meta.url);
const hash = value => createHash('sha256').update(value).digest('hex');

test('skirt replay restores exact pre-extension Git bytes and preserves types and idempotence', () => {
  assert.equal(review.base, '5c35c4e1a868ab815e1272142526e59794ab7e7e');
  assert.ok(review.files.length > 0, 'review must contain the scoped source changes');
  assert.equal(new Set(skirtUnderlayerHistoricalPaths).size, review.files.length);
  assert.ok(skirtUnderlayerHistoricalPaths.includes('webapp/src/lib/engine/manualUnderlayers.js'));
  for (const file of review.files) {
    const current = readFileSync(new URL(file.path, root));
    const original = execFileSync('git', ['show', review.base + ':' + file.path], {
      cwd: fileURLToPath(root), maxBuffer: 16 * 1024 * 1024,
    });
    assert.equal(hash(current), file.afterHash, file.path);
    assert.equal(hash(original), file.beforeHash, file.path);
    const restored = preSkirtUnderlayerSource(file.path, current);
    assert.deepEqual(restored, original, file.path);
    assert.equal(preSkirtUnderlayerSource(file.path, current.toString()), original.toString(), file.path);
    assert.equal(preSkirtUnderlayerSource(file.path, restored), restored, file.path);
  }
});

test('unknown and modified sources cannot use the reviewed skirt inverse', () => {
  for (const file of review.files) {
    const current = readFileSync(new URL(file.path, root));
    const modified = Buffer.concat([current, Buffer.from('\n// unreviewed change\n')]);
    assert.equal(preSkirtUnderlayerSource(file.path, modified), modified, file.path);
    if (file.path === 'webapp/src/lib/engine.js') {
      assert.throws(() => preIndoorKneelSource(file.path, modified), /rejects (?:unreviewed source|unknown current engine)/);
    }
  }
  assert.equal(preSkirtUnderlayerSource('unrelated', 'unchanged'), 'unchanged');
});
