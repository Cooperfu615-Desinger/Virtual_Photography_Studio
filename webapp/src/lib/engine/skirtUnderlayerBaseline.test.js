import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execPath } from 'node:process';
import { test } from 'node:test';
import baseline from './skirtUnderlayerBaseline.json' with { type: 'json' };
import { skirtProtectedRows } from './skirtUnderlayerFixtures.js';
import history from '../../../../scripts/lib/raisedTopHemHistory.json' with { type: 'json' };
import { preRaisedTopHemSource } from '../../../../scripts/lib/gestureExpressionGazeHistoricalReplay.mjs';

test('850 unrelated pre-skirt cases preserve all seven outputs, selections, structured sources and RNG', () => {
  assert.equal(baseline.base, '5c35c4e1a868ab815e1272142526e59794ab7e7e');
  assert.equal(Object.keys(baseline.rows).length, 870);
  const current = skirtProtectedRows();
  assert.deepEqual(Object.keys(current), Object.keys(baseline.rows));
  for (const [key, expected] of Object.entries(baseline.rows)) {
    // Preserve the original seal. The 20 approved raised-top cases now follow
    // the revised contract exercised by manualUnderlayers and raisedTopHem.
    if (key.startsWith('upper-layer/')) continue;
    assert.equal(current[key], expected, key);
  }
});

test('the 20 original upper-layer cases still match their seal before the raised-top revision', () => {
  const root = new URL('../../../../', import.meta.url);
  const directory = mkdtempSync(join(tmpdir(), 'vps-pre-raised-hem-'));
  try {
    cpSync(new URL('webapp/src', root), join(directory, 'webapp/src'), { recursive: true });
    cpSync(new URL('webapp/package.json', root), join(directory, 'webapp/package.json'));
    for (const { path } of history.files) {
      const target = join(directory, path);
      const source = readFileSync(target);
      const before = preRaisedTopHemSource(path, source);
      assert.notEqual(before, source, path);
      writeFileSync(target, before);
    }
    const originalRows = JSON.parse(execFileSync(execPath, ['--input-type=module', '-e', `
      import { skirtProtectedRows } from './webapp/src/lib/engine/skirtUnderlayerFixtures.js';
      console.log(JSON.stringify(skirtProtectedRows()));
    `], { cwd: directory, encoding: 'utf8' }));
    const originalUpper = Object.entries(baseline.rows).filter(([key]) => key.startsWith('upper-layer/'));
    assert.equal(originalUpper.length, 20);
    for (const [key, expected] of originalUpper) assert.equal(originalRows[key], expected, key);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
