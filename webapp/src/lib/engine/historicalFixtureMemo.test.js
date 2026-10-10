import assert from 'node:assert/strict';
import test from 'node:test';
import { createHistoricalFixtureMemo } from './historicalFixtureMemoTestSupport.js';
import { GPT_VISIBILITY_ALL } from './gptSceneVisibilityFixtures.js';
import { GPT_CAMERA_SPATIAL_FIXTURES } from './gptCameraSpatialFixtures.js';
import { CLOSE_WORM_CASES, CLOSE_WORM_EXCLUDED } from './closeWormEyeFixtures.js';

test('historical memo reuses deterministic results and isolates caller mutations', () => {
  let calls = 0;
  const memo = createHistoricalFixtureMemo(f => ({
    outputs: { gpt: `seed:${f.seed}` }, selection: { ...f.locks }, randomDraws: ++calls,
  }));
  const fixture = { id: 'case', seed: 'one', locks: { framingId: 'full' } };
  const first = memo.run(fixture);
  const original = structuredClone(first);
  first.outputs.gpt = 'mutated';
  first.selection.framingId = 'mutated';
  assert.deepEqual(memo.run(fixture), original);
  assert.deepEqual(memo.statistics(), { generations: 1, hits: 1 });
});

test('changing a fixture seed or nested locks regenerates its result', () => {
  let calls = 0;
  const memo = createHistoricalFixtureMemo(f => ({ ...structuredClone(f), calls: ++calls }));
  const fixture = { id: 'case', seed: 'one', locks: { angle: { byZh: 'first' } } };
  memo.run(fixture);
  fixture.seed = 'two';
  assert.equal(memo.run(fixture).seed, 'two');
  fixture.locks.angle.byZh = 'second';
  assert.equal(memo.run(fixture).locks.angle.byZh, 'second');
  assert.deepEqual(memo.statistics(), { generations: 3, hits: 0 });
});

test('separate fixtures and separate suite memos do not reuse each other', () => {
  let calls = 0;
  const generate = () => ({ calls: ++calls });
  const first = createHistoricalFixtureMemo(generate);
  const second = createHistoricalFixtureMemo(generate);
  const fixture = { seed: 'same', locks: {} };
  assert.equal(first.run(fixture).calls, 1);
  assert.equal(first.run({ ...fixture }).calls, 2);
  assert.equal(second.run(fixture).calls, 3);
});

test('failed generation is never reused as a cached successful result', () => {
  let calls = 0;
  const memo = createHistoricalFixtureMemo(() => {
    calls += 1;
    if (calls === 1) throw new Error('generation failed');
    return { calls };
  });
  const fixture = { seed: 'same', locks: {} };
  assert.throws(() => memo.run(fixture), /generation failed/);
  assert.equal(memo.run(fixture).calls, 2);
  assert.deepEqual(memo.statistics(), { generations: 1, hits: 0 });
});

test('all three full matrices retain every ordered fixture while reusing overlap', () => {
  const worm = [...GPT_CAMERA_SPATIAL_FIXTURES, ...CLOSE_WORM_CASES, ...CLOSE_WORM_EXCLUDED];
  const matrices = [GPT_VISIBILITY_ALL, GPT_CAMERA_SPATIAL_FIXTURES, worm];
  assert.deepEqual(matrices.map(rows => rows.length), [5614, 6320, 6370]);
  const memo = createHistoricalFixtureMemo(f => ({ id: f.id, seed: f.seed, locks: f.locks }));
  for (const matrix of matrices) {
    assert.deepEqual(matrix.map(f => memo.run(f).id), matrix.map(f => f.id));
  }
  assert.deepEqual(memo.statistics(), { generations: 6370, hits: 11934 });
});
