// Capture is exclusive; comparisons always replay the frozen pre-change inputs.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../webapp/src/lib/engine.js';
import { GAZE_OPTIONS, GESTURE_OPTIONS } from '../webapp/src/lib/engine/gazeGesture.js';
import { REPRESENTATIVE_PROMPT_FIXTURES } from '../webapp/src/lib/engine/representativePromptFixtures.js';
import { REVIEW_FRAMINGS } from '../webapp/src/lib/engine/gestureExpressionGazeFixtures.js';

const controls = getLockControls();
const option = (key, zh) => {
  const result = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(result, `${key}: ${zh}`);
  return result.id;
};
const resolve = locks => Object.fromEntries(Object.entries(locks).map(([key, value]) => [key,
  value && typeof value === 'object' && 'byZh' in value ? option(key, value.byZh) : value]));
function capture({ locks, seed }) {
  const random = createSeededRandom(seed); let calls = 0;
  const prompt = generatePrompts(1, locks, [], { random: () => { calls++; return random(); } })[0];
  const { id: _id, date: _date, ...stable } = prompt;
  return JSON.parse(JSON.stringify({ prompt: stable, calls }));
}
function scenarios() {
  const cases = REPRESENTATIVE_PROMPT_FIXTURES.map(f => ({ id: `representative:${f.id}`,
    seed: f.seed, locks: { ...createEmptyLocks(), ...resolve(f.locks) } }));
  for (let i = 0; i < 200; i++) cases.push({ id: `random:${i}`, seed: `gesture-expansion:old:${i}`,
    locks: i < 100 ? { subjectCount: i % 5 === 0 ? '2' : '1' } : { subjectCount: '1',
      specifiedActionId: 'random', gazeId: 'random', gestureId: 'random', headPostureId: 'random' } });
  const actions = { general: 'specified-standing-natural', squatting: 'specified-squatting-natural',
    'lying-prone': 'specified-lying-prone-forearms-crossed-ankles' };
  for (const gesture of GESTURE_OPTIONS.filter(o => actions[o.scope])) {
    for (const framing of REVIEW_FRAMINGS) for (const gaze of GAZE_OPTIONS.filter(o => o.id.startsWith('gaze-'))) {
      cases.push({ id: `${gesture.id}:${framing}:${gaze.id}`, seed: 'gesture-expansion:old-matrix',
        locks: { ...createEmptyLocks(), subjectCount: '1', specifiedActionId: actions[gesture.scope],
          gestureId: gesture.id, gazeId: gaze.id, framingId: option('framingId', framing) } });
    }
  }
  return cases;
}
const [mode, file] = process.argv.slice(2);
assert.ok(['capture', 'compare'].includes(mode) && file, 'capture|compare PATH');
if (mode === 'capture') {
  const rows = scenarios().map(input => ({ input, expected: capture(input) }));
  writeFileSync(file, gzipSync(JSON.stringify({ seed: 'gesture-expansion:old', rows })), { flag: 'wx' });
  console.log(JSON.stringify({ captured: rows.length, sha256: createHash('sha256').update(readFileSync(file)).digest('hex') }));
} else {
  const baseline = JSON.parse(gunzipSync(readFileSync(file)));
  for (const { input, expected } of baseline.rows) assert.deepEqual(capture(input), expected, input.id);
  console.log(JSON.stringify({ compared: baseline.rows.length, equal: true, outputsSelectionsAndRng: true }));
}
