import assert from 'node:assert/strict';
import test from 'node:test';
import { retirePage1PoseComposerLocks } from './retiredPoseLocks.js';
import { PHOTOGRAPHY_EDITOR_GROUPS, buildPhotographyEditorModel, prepareCompanionOrbitControl } from './photographyEditor.js';
import { COMPANION_ORBIT_ID, PHONE_MIRROR_ID, PHONE_SELFIE_ID } from '../../lib/engine/phoneCapture.js';

test('workspace retirement migrates old phone slots before clearing the retired fields', () => {
  for (const [key, id, propId] of [
    ['poseHandId', PHONE_SELFIE_ID, PHONE_SELFIE_ID],
    ['posePropId', PHONE_MIRROR_ID, PHONE_MIRROR_ID],
  ]) {
    const source = { subjectCount: '1', [key]: id, poseBaseId: 'standing' };
    const before = JSON.stringify(source);
    const result = retirePage1PoseComposerLocks(source);
    assert.equal(result.propId, propId);
    assert.equal(result[key], 'none');
    assert.equal(result.poseBaseId, 'none');
    assert.equal(result.captureStyleId || 'standard', 'standard');
    assert.equal(JSON.stringify(source), before);
    assert.deepEqual(retirePage1PoseComposerLocks(result), result);
  }
});

test('workspace retirement maps the explicit companion choice ahead of a retired phone slot', () => {
  const result = retirePage1PoseComposerLocks({ subjectCount: '1', captureStyleId: 'companion', posePropId: PHONE_MIRROR_ID });
  assert.equal(result.orbitId, COMPANION_ORBIT_ID);
  assert.notEqual(result.propId, PHONE_MIRROR_ID);
  assert.equal(result.posePropId, 'none');
});

test('a conflicting historical prop is preserved until the user replaces it', () => {
  const result = retirePage1PoseComposerLocks({ subjectCount: '1', captureStyleId: 'selfie', propId: 'hand-hold-iced-coffee' });
  assert.equal(result.propId, 'hand-hold-iced-coffee');
  assert.equal(result.captureStyleId, 'selfie');
});

test('the editor excludes legacy capture controls even when an old field is supplied', () => {
  assert.equal(PHOTOGRAPHY_EDITOR_GROUPS.some(group => group.keys.includes('captureStyleId')), false);
  const model = buildPhotographyEditorModel([{ control: { key: 'captureStyleId', options: [] }, value: 'selfie' }]);
  assert.equal(model.groups.flatMap(group => group.fields).length, 0);
});

test('companion orbit stays visible but unavailable in owned modes without rewriting stored choices', () => {
  const control = { key: 'orbitId', options: [{id:COMPANION_ORBIT_ID,zh:'男友／閨蜜視角'}, {id:'front',zh:'正面'}] };
  const before=JSON.stringify(control);
  for(const [locks,context] of [
    [{subjectCount:'2',orbitId:COMPANION_ORBIT_ID},{}],
    [{subjectCount:'1',captureMode:'observation',orbitId:COMPANION_ORBIT_ID},{}],
    [{subjectCount:'1',orbitId:COMPANION_ORBIT_ID},{fixedCompositionSetActive:true}],
  ]) {
    const result=prepareCompanionOrbitControl(control,locks,context);
    assert.equal(result.options[0].disabled,true);
    assert.match(result.helpText,/一般單人/);
    assert.equal(result.options[1],control.options[1]);
    assert.equal(locks.orbitId,COMPANION_ORBIT_ID);
  }
  assert.equal(prepareCompanionOrbitControl(control,{subjectCount:'1'}),control);
  assert.equal(JSON.stringify(control),before);
});
