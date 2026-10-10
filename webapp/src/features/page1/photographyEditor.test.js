import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyLocks, getLockControls } from '../../lib/engine.js';
import { getPage1ControlActionMode, randomizeLockKeys, setLockKeysToNone } from '../../lib/page1SectionRandom.js';
import { prepareHeadDominantAngleControl, HEAD_DOMINANT_FRAMING_ID } from '../../lib/engine/headDominantFraming.js';
import { carriageOrbitAllowed, resolveCarriageOrbit } from '../../lib/engine/carriageFixedComposition.js';
import { getFixedSceneCameraStatus } from './sceneEditor.js';
import { SECTION_SUBPANELS } from './page1Schema.js';
import { PHOTOGRAPHY_EDITOR_GROUPS, buildPhotographyEditorModel } from './photographyEditor.js';

const controls = getLockControls();
const editorKeys = PHOTOGRAPHY_EDITOR_GROUPS.flatMap(group => group.keys);
const control = key => controls.find(item => item.key === key);
const option = (key, zh) => control(key).options.find(item => item.zh === zh || item.zh.startsWith(zh));
const fixedSet = id => control('fixedCompositionSetId').options.find(item => item.id === id);
const fields = (values = {}, disabledKeys = []) => editorKeys.map(key => ({
  control: control(key),
  value: Object.hasOwn(values, key) ? values[key]
    : control(key).options.find(item => item.zh === '全無')?.id || control(key).defaultValue || '',
  disabled: disabledKeys.includes(key),
}));
const group = (model, id) => model.groups.find(item => item.id === id);
const field = (model, key) => model.groups.flatMap(item => item.fields).find(item => item.control.key === key);
const managedKeys = model => model.groups.flatMap(item => item.fields)
  .filter(item => item.management).map(item => item.control.key);

test('photography cards retain all ten existing keys exactly once and keep placement order', () => {
  const previousKeys = SECTION_SUBPANELS.photography.flatMap(panel => panel.keys);
  assert.equal(editorKeys.length, 10);
  assert.equal(new Set(editorKeys).size, 10);
  assert.deepEqual([...editorKeys].sort(), [...previousKeys].sort());
  const model = buildPhotographyEditorModel(fields());
  assert.deepEqual(model.groups.map(item => [item.id, item.label]), [
    ['image-type', '成品類型'], ['composition', '構圖與視角'],
    ['optics', '鏡頭與光學'], ['look', '風格與成像'],
  ]);
  assert.deepEqual(model.groups.flatMap(item => item.fields.map(entry => entry.control.key)), editorKeys);
});

test('ordinary and duo preparation without an effective single fixed set have no scene management', () => {
  for (const context of [{}, { fixedSet: null }, { fixedSet: fixedSet('none') }]) {
    const model = buildPhotographyEditorModel(fields(), context);
    assert.equal(model.fixedNotice, null);
    assert.deepEqual(managedKeys(model), []);
    assert.deepEqual(model.groups.flatMap(item => item.actionKeys), editorKeys);
  }
});

test('summaries distinguish random, explicit silence and chosen labels with short orbit labels', () => {
  const model = buildPhotographyEditorModel(fields({
    framingId: '', angleId: option('angleId', '全無').id,
    orbitId: option('orbitId', '左前').id, filmId: 'random',
  }));
  assert.equal(group(model, 'composition').summary, '隨機（生成時決定） / 全無 / 左前');
  assert.match(group(model, 'look').summary, /全無 \/ 隨機（生成時決定）$/);
  assert.equal(field(model, 'orbitId').value, option('orbitId', '左前').id);
});

test('actions stay inside their original scopes and preserve disabled and unrelated values', () => {
  const locks = { ...createEmptyLocks(), ...Object.fromEntries(editorKeys.map(key => [key, `chosen-${key}`])),
    lightingId: 'selected-light', locationId: 'selected-location', expressionAId: 'selected-expression',
    mjStylize: 321, cameraSystemId: 'legacy-camera' };
  const prepared = fields(locks, ['angleId', 'opticalEffectId']);
  const model = buildPhotographyEditorModel(prepared);
  for (const card of model.groups) {
    assert.deepEqual(card.actionKeys, card.keys.filter(key => !['angleId', 'opticalEffectId'].includes(key)));
    for (const next of [randomizeLockKeys(locks, card.actionKeys, createEmptyLocks(), controls),
      setLockKeysToNone(locks, card.actionKeys, controls)]) {
      for (const key of Object.keys(locks)) if (!card.actionKeys.includes(key)) assert.deepEqual(next[key], locks[key], key);
    }
  }
  assert.equal(getPage1ControlActionMode('imageTypePresetId', controls), 'reset');
  const reset = randomizeLockKeys(locks, group(model, 'image-type').actionKeys, createEmptyLocks(), controls);
  assert.equal(reset.imageTypePresetId, 'photorealistic-photo');
  // The look card presents both fields, while their existing single-field actions stay separate.
  assert.deepEqual(group(model, 'look').actionKeys, ['styleId', 'filmId']);
  for (const key of group(model, 'look').actionKeys) {
    const next = randomizeLockKeys(locks, [key], createEmptyLocks(), controls);
    for (const other of ['styleId', 'filmId'].filter(item => item !== key)) assert.equal(next[other], locks[other]);
  }
});

test('both coastal fixed scenes describe five managed fields without inventing a focal length', () => {
  const disabled = ['framingId', 'angleId', 'orbitId', 'lensId', 'opticalEffectId'];
  for (const id of ['seaside-slope-railway-crossing', 'seaside-stair-alley']) {
    const set = fixedSet(id);
    const model = buildPhotographyEditorModel(fields({}, disabled), { fixedSet: set });
    assert.deepEqual(managedKeys(model).sort(), [...disabled].sort());
    assert.deepEqual(model.fixedNotice, { name: set.zh, text: getFixedSceneCameraStatus(set) });
    assert.equal(field(model, 'framingId').management.value, '固定場景構圖');
    assert.equal(field(model, 'angleId').management.value, '固定取景視角');
    assert.equal(field(model, 'orbitId').management.value, '固定取景方向');
    assert.equal(field(model, 'lensId').management.value, '由固定場景決定');
    assert.equal(field(model, 'opticalEffectId').management.value, '全無');
    assert.equal(group(model, 'composition').summary, '固定場景構圖 / 固定取景視角 / 固定取景方向');
    assert.deepEqual(group(model, 'composition').actionKeys, []);
    assert.deepEqual(group(model, 'optics').actionKeys, ['apertureId', 'shutterId']);
    assert.doesNotMatch(JSON.stringify(model.groups.map(item => item.summary)), /\d+mm/);
  }
});

test('station retains adjustable focal length, pitch and subject facing with only framing and effects managed', () => {
  for (const id of ['nyc-subway-bench-platform', 'london-tube-arriving-platform', 'yamanote-platform-advertising']) {
    const values = { lensId: option('lensId', '135mm').id, orbitId: option('orbitId', '背面').id };
    const prepared = fields(values, ['framingId', 'opticalEffectId']).map(item => item.control.key === 'orbitId'
      ? { ...item, control: { ...item.control, label: '人物面向（場景取景方向固定）' } } : item);
    const model = buildPhotographyEditorModel(prepared, { fixedSet: fixedSet(id) });
    assert.deepEqual(managedKeys(model), ['framingId', 'opticalEffectId']);
    assert.deepEqual(group(model, 'composition').actionKeys, ['angleId', 'orbitId']);
    assert.deepEqual(group(model, 'optics').actionKeys, ['lensId', 'apertureId', 'shutterId']);
    assert.equal(field(model, 'orbitId').control.label, '人物面向（場景取景方向固定）');
    assert.equal(field(model, 'orbitId').value, values.orbitId);
    assert.match(group(model, 'optics').summary, /135mm/);
    assert.match(model.fixedNotice.text, /人物面向/);
    assert.doesNotMatch(model.fixedNotice.text, /焦段/);
  }
});

test('three carriages preserve their already prepared orbit choices and distinct availability', () => {
  for (const id of ['japan-carriage-bench-front', 'japan-carriage-side-aisle', 'japan-carriage-rush-hour']) {
    const set = fixedSet(id);
    const disabled = ['opticalEffectId', ...(set.orbitMode === 'bench-front' ? ['orbitId'] : [])];
    const selected = resolveCarriageOrbit(set, option('orbitId', '背面'), control('orbitId').options);
    const prepared = fields({ orbitId: selected.id }, disabled).map(item => item.control.key === 'orbitId'
      ? { ...item, control: { ...item.control, label: '相機拍攝方位',
        options: item.control.options.filter(candidate => carriageOrbitAllowed(set, candidate)) } } : item);
    const model = buildPhotographyEditorModel(prepared, { fixedSet: set });
    const orbit = field(model, 'orbitId');
    assert.strictEqual(orbit.control, prepared.find(item => item.control.key === 'orbitId').control);
    assert.equal(orbit.value, selected.id);
    assert.equal(field(model, 'framingId').management, null);
    assert.equal(field(model, 'lensId').management, null);
    if (set.orbitMode === 'bench-front') {
      assert.deepEqual(managedKeys(model), ['orbitId', 'opticalEffectId']);
      assert.equal(orbit.management.value, '正面');
      assert.match(orbit.management.reason, /長椅正對面/);
      assert.deepEqual(group(model, 'composition').actionKeys, ['framingId', 'angleId']);
    } else {
      assert.deepEqual(managedKeys(model), ['opticalEffectId']);
      assert.equal(orbit.management, null);
      assert.deepEqual(group(model, 'composition').actionKeys, ['framingId', 'angleId', 'orbitId']);
      assert.doesNotMatch(model.fixedNotice.text, /相機拍攝方位|環繞角度/);
    }
  }
});

test('a bench-front field without a resolved front value does not invent a named orbit', () => {
  const model = buildPhotographyEditorModel(fields({}, ['orbitId', 'opticalEffectId']),
    { fixedSet: fixedSet('japan-carriage-bench-front') });
  assert.equal(field(model, 'orbitId').management.value, '固定取景方向');
});

test('selfie explains only the disabled orbit and does not disable other prepared controls', () => {
  const prepared = fields({}, ['orbitId']);
  const model = buildPhotographyEditorModel(prepared, { handLocksOrbit: true });
  assert.equal(model.fixedNotice, null);
  assert.deepEqual(managedKeys(model), ['orbitId']);
  assert.deepEqual(field(model, 'orbitId').management, {
    label: '自拍動作管理', value: '由自拍動作決定',
    reason: '目前自拍手部動作管理拍攝方位，環繞角度暫不可調整。',
  });
  assert.deepEqual(group(model, 'composition').actionKeys, ['framingId', 'angleId']);
  const stillEnabled = buildPhotographyEditorModel(fields(), { handLocksOrbit: true });
  assert.deepEqual(managedKeys(stillEnabled), []);
  assert.equal(field(stillEnabled, 'orbitId').disabled, false);
});

test('selfie manages orbit in a fixed scene that permits it while scene-managed orbit keeps priority', () => {
  const sofa = fixedSet('concrete-wall-chesterfield-sofa');
  const model = buildPhotographyEditorModel(fields({}, ['framingId', 'lensId', 'opticalEffectId', 'orbitId']),
    { fixedSet: sofa, handLocksOrbit: true });
  assert.deepEqual(model.fixedNotice, { name: sofa.zh, text: getFixedSceneCameraStatus(sofa) });
  assert.equal(field(model, 'orbitId').management.label, '自拍動作管理');
  assert.equal(field(model, 'orbitId').management.value, '由自拍動作決定');
  assert.match(field(model, 'orbitId').management.reason, /自拍手部動作/);
  assert.equal(field(model, 'framingId').management.label, '場景管理');
  assert.equal(field(model, 'lensId').management.label, '場景管理');
  assert.deepEqual(group(model, 'composition').actionKeys, ['angleId']);
  for (const id of ['seaside-slope-railway-crossing', 'japan-carriage-bench-front']) {
    const managed = buildPhotographyEditorModel(fields({}, ['orbitId']),
      { fixedSet: fixedSet(id), handLocksOrbit: true });
    assert.equal(field(managed, 'orbitId').management.label, '場景管理');
    assert.doesNotMatch(field(managed, 'orbitId').management.reason, /自拍/);
  }
});

test('head-dominant summary uses the projected angle and preserves the latent original value', () => {
  const locks = { framingId: HEAD_DOMINANT_FRAMING_ID, angleId: option('angleId', '蟲眼').id };
  const projected = prepareHeadDominantAngleControl(control('angleId'), locks, controls);
  const prepared = fields(locks).map(item => item.control.key === 'angleId'
    ? { ...item, control: projected, value: projected.closureDisplayValue } : item);
  const before = JSON.stringify(locks);
  const model = buildPhotographyEditorModel(prepared);
  assert.equal(field(model, 'angleId').disabled, false);
  assert.equal(field(model, 'angleId').management, null);
  assert.match(group(model, 'composition').summary, /^頭部主導近景 \/ 全無/);
  assert.doesNotMatch(group(model, 'composition').summary, /蟲眼/);
  assert.ok(field(model, 'angleId').control.options.find(item => item.id === locks.angleId).disabled);
  assert.strictEqual(field(model, 'angleId').control, projected);
  assert.equal(JSON.stringify(locks), before);
});

test('availability stays authoritative and unrelated disabled fields are not labelled as scene managed', () => {
  const set = fixedSet('seaside-slope-railway-crossing');
  const enabled = buildPhotographyEditorModel(fields(), { fixedSet: set });
  assert.deepEqual(managedKeys(enabled), []);
  assert.deepEqual(enabled.groups.flatMap(item => item.actionKeys), editorKeys);
  const unrelated = buildPhotographyEditorModel(fields({}, ['styleId', 'filmId', 'apertureId', 'shutterId']), { fixedSet: set });
  assert.deepEqual(managedKeys(unrelated), []);
  assert.deepEqual(group(unrelated, 'look').actionKeys, []);
  const station = buildPhotographyEditorModel(fields({}, ['lensId', 'angleId', 'orbitId']),
    { fixedSet: fixedSet('nyc-subway-bench-platform') });
  assert.deepEqual(managedKeys(station), []);
});

test('frozen input fields, values, option objects and context are preserved without mutation', () => {
  const prepared = fields({ orbitId: option('orbitId', '左後').id }, ['orbitId', 'lensId']);
  const context = { fixedSet: fixedSet('seaside-slope-railway-crossing'), handLocksOrbit: true };
  const before = JSON.stringify({ prepared, context });
  prepared.forEach(Object.freeze);
  Object.freeze(prepared);
  Object.freeze(context);
  const model = buildPhotographyEditorModel(prepared, context);
  for (const item of prepared) {
    const result = field(model, item.control.key);
    assert.notStrictEqual(result, item);
    assert.strictEqual(result.control, item.control);
    assert.equal(result.value, item.value);
    assert.equal(result.disabled, item.disabled);
  }
  assert.equal(field(model, 'orbitId').management.label, '場景管理');
  assert.equal(JSON.stringify({ prepared, context }), before);
});

test('only known card keys are included while partial or empty prepared input remains safe', () => {
  const prepared = fields().filter(item => item.control.key === 'styleId');
  prepared.push({ control: { key: 'lightingId', options: [] }, value: 'outside-scope', disabled: false });
  const model = buildPhotographyEditorModel(prepared);
  assert.deepEqual(model.groups.flatMap(item => item.fields.map(entry => entry.control.key)), ['styleId']);
  assert.deepEqual(group(model, 'look').actionKeys, ['styleId']);
  assert.equal(group(model, 'composition').summary, '');
  assert.deepEqual(buildPhotographyEditorModel().groups.flatMap(item => item.fields), []);
});
