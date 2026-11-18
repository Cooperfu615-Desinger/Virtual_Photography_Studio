import assert from 'node:assert/strict';
import test from 'node:test';
import { getPage3FieldActionOptions, updatePage3Field } from './page3FieldActions.js';
import {
  PAGE3_WORLD_SCENE_FIELD_OPTIONS,
  buildPage3WorldScenePrompt,
  buildPage3WorldSceneCinematicPrompt,
  buildPage3WorldSceneWorldPrompt,
} from '../../lib/page3WorldScene.js';

test('every scene field exposes its own none value and draws a different real option when possible', () => {
  for (const [key, options] of Object.entries(PAGE3_WORLD_SCENE_FIELD_OPTIONS)) {
    const first = getPage3FieldActionOptions(options, '');
    assert.equal(first.noneId, key === 'photographerStyle' ? 'style-none' : 'none');
    assert.equal(first.randomChoices.length, options.length - 2, key);
    assert.ok(first.randomChoices.every(option => option.id && option.id !== first.noneId));
    for (const option of first.randomChoices) {
      const next = getPage3FieldActionOptions(options, option.id);
      assert.equal(next.randomChoices.length, first.randomChoices.length - 1, key);
      assert.ok(!next.randomChoices.some(candidate => candidate.id === option.id), key);
    }
  }
  const options = [{ id: '' }, { id: 'none' }, { id: 'only' }, { id: 'locked', disabled: true }];
  assert.deepEqual(getPage3FieldActionOptions(options, 'only').randomChoices.map(o => o.id), ['only']);
  assert.deepEqual(getPage3FieldActionOptions(options.slice(0, 2), '').randomChoices, []);
});

test('changing a field preserves the other parameters and imported-person snapshot', () => {
  const profile = {
    worldLocation: 'world-place',
    specialLocation: '',
    sceneMode: 'street-only',
    ambientLight: 'blue-hour-city-glow',
    person: { source: 'character-lab', label: 'Test', text: 'An adult woman.' },
  };
  assert.deepEqual(updatePage3Field(profile, 'ambientLight', 'none'), { ...profile, ambientLight: 'none' });
  assert.deepEqual(updatePage3Field(profile, 'specialLocation', 'special-place'), { ...profile, worldLocation: '', specialLocation: 'special-place' });
  assert.deepEqual(updatePage3Field(profile, 'worldLocation', 'none'), { ...profile, worldLocation: 'none' });
  assert.equal(updatePage3Field({ ...profile, specialLocation: 'special-place' }, 'worldLocation', 'none').specialLocation, '');
});

test('explicit none removes field wording from all three prompts and preserves mode and place rules', () => {
  const profile = {
    sceneMode: 'street-only',
    worldLocation: 'taipei-xinyi-taipei101-street-corner',
    cameraSystem: 'leica-m',
    ambientLight: 'blue-hour-city-glow',
  };
  for (const build of [buildPage3WorldScenePrompt, buildPage3WorldSceneCinematicPrompt, buildPage3WorldSceneWorldPrompt]) {
    const previous = build(profile);
    assert.match(previous, /Frame a local detail/);
    assert.match(previous, /Editorial photography mood/);
    const cleared = build({ ...profile, sceneFocus: 'none', ambientLight: 'none', photographerStyle: 'style-none' });
    assert.doesNotMatch(cleared, /Frame a local detail|blue hour city glow|editorial photography mood/i);
    assert.match(cleared, /Taipei 101/);
    assert.match(cleared, /Leica M/);
    assert.match(cleared, /no deliberate portrait subject/i);
    assert.match(cleared, /avoid a postcard-like establishing shot/i);
  }
});
