import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { getLockControls } from '../engine.js';
import { appendZImageUpperScene, Z_IMAGE_UPPER_SCENE_SOURCES } from './zImageUpperScene.js';
import { LOW_CAMERA_LABELS } from './zImageSceneDirection.js';
import { normalizeFullCameraForLegacy } from './zImageFullBodyCameraTestSupport.js';
import { runSceneFixture, digest, OUTPUT_FIELDS } from './sceneIntegratedAssemblyTestSupport.js';
import { UPPER_SCENE_CASES, UPPER_SCENE_MATRIX, UPPER_SCENE_EXCLUDED, UPPER_SCENE_CONTROLS, upperSceneFixture } from './zImageUpperSceneFixtures.js';

const baseline = JSON.parse(readFileSync(new URL('./zImageUpperSceneBaseline.json', import.meta.url), 'utf8'));
const controls = getLockControls();
const locations = controls.find((c) => c.key === 'locationId').options;
const angles = controls.find((c) => c.key === 'angleId').options;
const rows = [...UPPER_SCENE_MATRIX, ...UPPER_SCENE_EXCLUDED, ...UPPER_SCENE_CONTROLS];
const results = rows.map(runSceneFixture);

test('approved sources bind exactly four catalog IDs and identities, with no runtime inference', () => {
  assert.equal(Object.keys(Z_IMAGE_UPPER_SCENE_SOURCES).length, 4);
  for (const [label, text] of UPPER_SCENE_CASES) {
    const matches = locations.filter((l) => l.zh === label);
    assert.equal(matches.length, 1);
    const location = matches[0];
    const record = Z_IMAGE_UPPER_SCENE_SOURCES[location.id];
    assert.equal(record.identity, location.en.split(',')[0]);
    assert.equal(record.clauses.join(', '), text);
    assert.ok(Object.isFrozen(record.clauses));
  }
});

test('helper preserves empty/custom sources, ignores other angles, and is clause-idempotent', () => {
  const location = locations.find((l) => l.zh === UPPER_SCENE_CASES[0][0]);
  const source = `${location.en.split(',')[0]}, sliding door frames`;
  const angle = { zh: '腰部高度鏡頭' };
  const appended = appendZImageUpperScene(source, location, angle);
  assert.equal(appended, `${source}, ${UPPER_SCENE_CASES[0][1]}`);
  assert.equal(appendZImageUpperScene(appended, location, angle), appended);
  assert.equal(appendZImageUpperScene(`${source}, exposed rafters`, location, angle),
    `${source}, exposed rafters, the underside of wooden eaves`);
  assert.equal(appendZImageUpperScene('', location, angle), '');
  assert.equal(appendZImageUpperScene('custom studio', location, angle), 'custom studio');
  assert.equal(appendZImageUpperScene(source, { ...location, id: 'unknown' }, angle), source);
  assert.equal(appendZImageUpperScene(source, location, { zh: '平視高度鏡頭' }), source);
  assert.equal(appendZImageUpperScene(source, location, undefined), source);
});

test('four user-accepted waist-up B prompts match the test pack verbatim', () => {
  const doc = readFileSync(new URL('../../../../Docs/specs/z-image-upper-scene-v2-test-prompts.md', import.meta.url), 'utf8');
  const prompts = [...doc.matchAll(/```text\n([\s\S]*?)\n```/g)].map((m) => m[1]);
  for (const [index, [label]] of UPPER_SCENE_CASES.entries()) {
    assert.equal(runSceneFixture(upperSceneFixture(label, '腰部高度鏡頭')).outputs.zImagePrompt, prompts[index * 2 + 1]);
  }
});

test('230-case pre-change baseline: only approved low-camera main Z scene clauses change', () => {
  assert.equal(results.length, baseline.count);
  const normalized = results.map((result, index) => {
    const angle = angles.find((a) => a.id === result.selection.angleId);
    const eligible = index < UPPER_SCENE_MATRIX.length && LOW_CAMERA_LABELS.includes(angle?.zh);
    const outputs = { ...result.outputs };
    const addition = UPPER_SCENE_CASES.find(([label]) => label === rows[index].locks.locationId.byZh)?.[1];
    if (eligible) {
      const scene = outputs.zImagePrompt.split('\n\n')[1].split('. ')[0];
      assert.ok(scene.endsWith(addition), rows[index].id);
      for (const clause of addition.split(', ')) assert.equal(outputs.zImagePrompt.split(clause).length - 1, 1);
      outputs.zImagePrompt = outputs.zImagePrompt.replace(`, ${addition}`, '');
    } else if (addition) assert.ok(!outputs.zImagePrompt.includes(addition), rows[index].id);
    outputs.zImagePrompt = normalizeFullCameraForLegacy(outputs.zImagePrompt);
    return outputs;
  });
  for (const field of OUTPUT_FIELDS) assert.equal(digest(normalized.map((o) => o[field])), baseline.hashes[field], field);
  assert.equal(digest(results.map((r) => r.selection)), baseline.selectionHash);
  assert.equal(digest(results.map((r) => r.randomDraws)), baseline.randomHash);
});
