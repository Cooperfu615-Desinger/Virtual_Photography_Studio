import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, getLockControls } from '../../lib/engine.js';
import { randomizeLockKeys, setLockKeysToNone } from '../../lib/page1SectionRandom.js';
import { SECTION_SUBPANELS } from './page1Schema.js';
import { SCENE_EDITOR_SCOPES, getSceneEditorActionKeys, getSceneEditorSource, getFixedSceneDetailKeys, getFixedSceneCameraStatus, fixedSceneOptionMatchesSet } from './sceneEditor.js';

const controls = getLockControls();
const sets = controls.find(control => control.key === 'fixedCompositionSetId').options;
const set = id => sets.find(option => option.id === id);

test('scene card scopes preserve old section keys and separate lighting from source actions', () => {
  for (const id of ['space', 'fixed', 'light']) {
    assert.deepEqual(SCENE_EDITOR_SCOPES[id], SECTION_SUBPANELS.scene.find(panel => panel.id === id).keys);
  }
  const locks = { ...createEmptyLocks(), locationId: 'chosen-location', lightingId: 'chosen-light', lightDirectionId: 'chosen-direction',
    fixedCompositionSetId: 'seaside-slope-railway-crossing', importedWorldSceneMode: 'architecture',
    importedWorldSceneArchitectureText: 'source', zImageVisibleTextEnabled: true, zImageVisibleTextContent: '美華冰室' };
  for (const keys of Object.values(SCENE_EDITOR_SCOPES)) {
    for (const next of [randomizeLockKeys(locks, keys, createEmptyLocks(), controls), setLockKeysToNone(locks, keys, controls)]) {
      for (const key of Object.keys(locks)) if (!keys.includes(key)) assert.deepEqual(next[key], locks[key], key);
    }
  }
});

test('source summary reflects fixed priority, imports, duo and surface-led state without changing locks', () => {
  const locks = { ...createEmptyLocks(), fixedCompositionSetId: 'seaside-slope-railway-crossing',
    importedWorldSceneMode: 'architecture', importedWorldSceneArchitectureText: 'source', importedWorldSceneLabel: '測試街景' };
  const before = JSON.stringify(locks);
  assert.equal(getSceneEditorSource(locks, controls).id, 'fixed');
  assert.equal(getSceneEditorSource({ ...locks, subjectCount: '2' }, controls).id, 'imported');
  assert.equal(getSceneEditorSource(locks, controls, true).id, 'surface');
  assert.equal(getSceneEditorSource({ ...locks, fixedCompositionSetId: 'none' }, controls).name, '測試街景');
  assert.equal(getSceneEditorSource(createEmptyLocks(), controls).name, '隨機場景');
  assert.equal(getSceneEditorSource({ ...createEmptyLocks(), locationId: 'none' }, controls).name, '全無');
  assert.equal(JSON.stringify(locks), before);
});

test('fixed card actions retain latent capture and performance when position manages them', () => {
  const keys = getSceneEditorActionKeys('fixed', true);
  assert.deepEqual(keys, ['fixedCompositionSetId', 'fixedSetPositionId', 'fixedSetBackgroundStateId']);
  const locks = { ...createEmptyLocks(), fixedCompositionSetId: 'nyc-subway-bench-platform',
    fixedSetCaptureModeId: 'natural-self-shot', fixedSetPerformanceStateId: 'elegant-restrained' };
  for (const next of [randomizeLockKeys(locks, keys, createEmptyLocks(), controls), setLockKeysToNone(locks, keys, controls)]) {
    assert.equal(next.fixedSetCaptureModeId, locks.fixedSetCaptureModeId);
    assert.equal(next.fixedSetPerformanceStateId, locks.fixedSetPerformanceStateId);
  }
  assert.deepEqual(getSceneEditorActionKeys('fixed'), SCENE_EDITOR_SCOPES.fixed);
  assert.deepEqual(getSceneEditorActionKeys('light', true), SCENE_EDITOR_SCOPES.light);
});

test('fixed detail cards display only applicable scoped options and omit position-managed capture fields', () => {
  const coastal = set('seaside-slope-railway-crossing');
  assert.deepEqual(getFixedSceneDetailKeys(coastal, controls), SCENE_EDITOR_SCOPES.fixed.slice(1));
  const station = set('nyc-subway-bench-platform');
  assert.deepEqual(getFixedSceneDetailKeys(station, controls, true), ['fixedSetPositionId']);
  const carriage = set('japan-carriage-bench-front');
  assert.deepEqual(getFixedSceneDetailKeys(carriage, controls, true), ['fixedSetPositionId', 'fixedSetBackgroundStateId']);
  assert.deepEqual(getFixedSceneDetailKeys(null, controls), []);
  assert.equal(fixedSceneOptionMatchesSet({ setIds: [coastal.id] }, coastal), true);
  assert.equal(fixedSceneOptionMatchesSet({ setGroupId: 'japanese-carriage' }, carriage), true);
  assert.equal(fixedSceneOptionMatchesSet({ setId: station.id }, coastal), false);
});

test('camera status follows actual per-set restrictions rather than claiming every fixed set locks orbit', () => {
  assert.match(getFixedSceneCameraStatus(set('seaside-slope-railway-crossing')), /拍攝視角、環繞角度/);
  const station = getFixedSceneCameraStatus(set('nyc-subway-bench-platform'));
  assert.match(station, /人物面向/);
  assert.doesNotMatch(station, /焦段|拍攝視角、環繞角度/);
  const carriage = getFixedSceneCameraStatus(set('japan-carriage-bench-front'));
  assert.match(carriage, /相機拍攝方位/);
  assert.doesNotMatch(carriage, /景別|焦段/);
  assert.equal(getFixedSceneCameraStatus(null), '');
});
