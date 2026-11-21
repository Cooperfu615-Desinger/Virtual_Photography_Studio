import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCharacterCardPromptBundle, buildCharacterCardScenePerson, getCharacterCardOptions, getCharacterCardSceneExpressions } from './characterCardLab.js';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from './engine.js';
import {
  SPECIAL_SCENE_LOCATIONS,
  buildPage3WorldScenePrompt,
  buildPage3WorldSceneCinematicPrompt,
  buildPage3WorldSceneWorldPrompt,
  buildPage1WorldSceneArchitecture,
  resolvePage3ScenePerson,
} from './page3WorldScene.js';
import { PAGE3_DEFAULT_PERSON, readScenePersonAppearance, readScenePersonSnapshot } from './page3Person.js';
import { buildPage3SavedCard } from '../features/page3/page3SavedCard.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt } from '../features/saved-cards/cardCodec.js';
import { attachMidjourneySettingsToPrompt } from '../features/page1/midjourneyParameterState.js';

const outputs = [buildPage3WorldScenePrompt, buildPage3WorldSceneCinematicPrompt, buildPage3WorldSceneWorldPrompt];
const street = { sceneMode: 'street-only', worldLocation: 'taipei-xinyi-taipei101-street-corner' };
const generate = (locks) => generatePrompts(1, { ...createEmptyLocks(), ...locks }, [], { random: createSeededRandom('page3-person') })[0];
const smile = 'character:表情-facial-expression:柔和微笑:1';
const forest = { specialLocation: 'special-forest-trail', sceneMode: 'street-only' };

test('forest imports the exact effective workbench stance, head and smile without the reference-camera text', () => {
  const prompt = generate({
    subjectCount: '1', specifiedActionId: 'specified-standing-one-leg-weight',
    expressionId: smile, gazeId: 'gaze-down', headPostureId: 'head-slight-tilt',
  });
  const person = readScenePersonSnapshot(attachMidjourneySettingsToPrompt(prompt, { mjStylize: 321 }));
  const profile = { ...forest, person };
  assert.equal(person.text, readScenePersonAppearance(prompt));
  assert.deepEqual(resolvePage3ScenePerson(profile).notices, []);
  for (const build of outputs) {
    const text = build(profile);
    assert.ok(text.includes(person.text));
    assert.match(text, /stands in a relaxed posture/i);
    assert.match(text, /soft (?:natural )?smile/i);
    assert.match(text, /tilt|tilted/i);
    assert.doesNotMatch(text, /centered vertical framing|9:16|--stylize|no visible people/i);
    assert.match(text, /no other people/i);
  }
  assert.equal(readScenePersonSnapshot(generate({ subjectCount: '2' })), null);
});

test('washitsu uses the resolved seated stance and gaze in all three scene prompts', () => {
  const person = readScenePersonSnapshot(generate({
    subjectCount: '1', specifiedActionId: 'specified-sitting-hug-knees', expressionId: 'none',
    gazeId: 'gaze-camera',
  }));
  const profile = { specialLocation: 'special-japanese-washitsu', sceneMode: 'cityscape', person };
  for (const build of outputs) {
    assert.match(build(profile), /tatami/i);
    assert.match(build(profile), /sits|seated/i);
    assert.match(build(profile), /facing the camera|look(?:ing|s)? (?:toward|at) the camera/i);
  }
});

test('the bed pose is omitted in a forest, with a notice, and restores in the hotel without a new import', () => {
  const person = readScenePersonSnapshot(generate({
    subjectCount: '1', specifiedActionId: 'specified-lying-side-pillow-hand', expressionId: smile,
  }));
  const profile = { ...forest, person };
  assert.match(resolvePage3ScenePerson(profile).notices.join(' '), /床/);
  for (const build of outputs) {
    const text = build(profile);
    assert.doesNotMatch(text, /pillow|lies on her side/i);
    assert.match(text, /soft (?:natural )?smile/i);
    assert.ok(text.includes(person.text));
    assert.match(build({ ...profile, specialLocation: 'special-boutique-hotel-room' }), /lies on her side on the bed.*pillow/i);
  }
});

test('the two character-lab fields are optional and apply to the scene import', () => {
  const controls = getLockControls();
  const cards = getCharacterCardOptions(controls);
  const expressions = getCharacterCardSceneExpressions(controls);
  const variant = { characterProfileId: 'character-rika', includedWardrobeLayers: ['shoes'] };
  const before = buildCharacterCardPromptBundle(cards, variant);
  const after = buildCharacterCardPromptBundle(cards, {
    ...variant, scenePoseId: 'specified-sitting-hug-knees', sceneExpressionId: smile,
  });
  assert.deepEqual(before.outputs, after.outputs);
  const base = buildCharacterCardScenePerson(before, expressions);
  const person = buildCharacterCardScenePerson(after, expressions);
  assert.equal(base.text, person.text);
  assert.equal(base.performance, undefined);
  const profile = { specialLocation: 'special-japanese-washitsu', sceneMode: 'cityscape', person };
  const prompts = outputs.map(build => build(profile));
  for (const prompt of prompts) {
    assert.match(prompt, /sits|seated/i);
    assert.match(prompt, /soft natural smile/i);
  }
  const card = buildPage3SavedCard(profile, '和室', 'tatami', ...prompts);
  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(card));
  assert.deepEqual(restored.profile, profile);
  assert.match(restored.summary, /低坐抱膝.*柔和微笑/);
  assert.deepEqual([restored.midjourneyPrompt, restored.grokPrompt, restored.zImagePrompt], prompts);
});

test('distant drone framing retains the stance and hides face detail while a grounded high view retains it', () => {
  const person = readScenePersonSnapshot(generate({
    subjectCount: '1', specifiedActionId: 'specified-standing-one-leg-weight', expressionId: smile, gazeId: 'gaze-camera',
  }));
  const profile = {
    worldLocation: 'taipei-xinyi-taipei101-street-corner', person,
    sceneMode: 'aerial-high-view', focalViewpoint: 'drone-overhead',
  };
  assert.match(resolvePage3ScenePerson(profile).notices.join(' '), /遠距空拍/);
  for (const build of outputs) {
    assert.match(build(profile), /stands in a relaxed posture/i);
    assert.doesNotMatch(build(profile), /soft natural smile|facing the camera/i);
    const grounded = build({ ...profile, worldLocation: 'taipei-xiangshan-city-night-overlook' });
    assert.match(grounded, /soft natural smile/i);
  }
});

test('a standalone head posture is shown once in the import summary', () => {
  const person = readScenePersonSnapshot(generate({
    subjectCount: '1', expressionId: 'none', gazeId: 'none', headPostureId: 'head-slight-tilt',
  }));
  assert.equal(person.performance.head.label, '頭部微微側傾');
  assert.equal(resolvePage3ScenePerson({ ...forest, person }).summary.filter(label => label === '頭部微微側傾').length, 1);
});

test('import uses resolved full-body appearance and wardrobe while omitting expression and reference staging', () => {
  const prompt = generate({
    subjectCount: '1',
    expressionId: 'character:表情-facial-expression:eyes-closed-enjoyment',
    specifiedActionId: 'specified-lying-prone-forearms-crossed-ankles',
  });
  const reference = prompt.extraPrompts.find(item => item.id === 'full-body-character').text;
  const appearance = readScenePersonAppearance(attachMidjourneySettingsToPrompt(prompt, { mjStylize: 321 }));
  assert.match(reference, /eyes gently closed/i);
  const [subject, wardrobe] = appearance.trim().split('\n\n');
  assert.ok(subject && wardrobe);
  assert.ok(reference.includes(wardrobe));
  assert.match(subject, /adult|hair/i);
  assert.doesNotMatch(appearance, /eyes gently closed|fractured pose|standing naturally|lying prone|centered vertical framing|clean even lighting|9:16|--stylize/i);
  assert.equal(readScenePersonAppearance(generate({ subjectCount: '2' })), '');
});

test('character lab import uses the chosen hairstyle and wardrobe layers without reference directions or temporary free text', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const card = cards.find(item => item.id === 'character-eleanor');
  const bundle = buildCharacterCardPromptBundle(cards, {
    characterProfileId: card.id,
    hairVariantId: 'half-up',
    includedWardrobeLayers: ['shoes'],
    promptOverrideText: 'smiling and seated in a neutral studio',
  });
  const person = buildCharacterCardScenePerson(bundle);
  assert.equal(person.label, card.label);
  assert.ok(person.text.includes(card.distinctiveFeatures));
  if (bundle.variant.hairVariantId === 'half-up') assert.match(person.text, /half-up/);
  assert.ok(person.text.includes(card.defaultWardrobeLayers.shoes.prompt));
  assert.doesNotMatch(person.text, /smiling and seated|neutral studio|photorealistic character reference/i);
  const pure = buildCharacterCardPromptBundle(cards, { ...bundle.variant, outputMode: 'pure-character' });
  assert.ok(!buildCharacterCardScenePerson(pure).text.includes(card.defaultWardrobeLayers.shoes.prompt));
});

test('new and legacy empty profiles keep their original occupancy while imported people share the scene', () => {
  const ruins = SPECIAL_SCENE_LOCATIONS.filter(item => item.id.startsWith('special-ruins-'));
  for (const build of outputs) {
    assert.equal(build({ ...street, person: { source: 'none' } }), build(street));
    assert.match(build(street), /no deliberate portrait subject/i);
    assert.match(build(street), /incidental pedestrians and traffic/i);
    const profile = { ...street, person: { source: 'default' } };
    const prompt = build(profile);
    assert.ok(prompt.includes(PAGE3_DEFAULT_PERSON));
    assert.match(prompt, /same perspective and ambient light/i);
    assert.match(prompt, /incidental pedestrians and traffic/i);
    assert.doesNotMatch(prompt, /no deliberate portrait subject/i);
    assert.deepEqual(buildPage1WorldSceneArchitecture(profile), buildPage1WorldSceneArchitecture(street));
    for (const location of ruins) {
      const scene = { sceneMode: 'cityscape', specialLocation: location.id };
      assert.match(build(scene), /no visible people/i);
      const populated = build({ ...scene, person: { source: 'default' } });
      assert.ok(populated.includes(PAGE3_DEFAULT_PERSON));
      assert.match(populated, /no other people/i);
      assert.doesNotMatch(populated, /no visible people|no deliberate human subject/i);
      assert.ok(populated.toLowerCase().includes(location.realismGuards[1].toLowerCase()));
    }
  }
});

test('a workbench import persists as a snapshot with all three saved prompt texts', () => {
  const person = {
    source: 'prompt-workbench',
    label: '全身角色照',
    text: readScenePersonAppearance(generate({ subjectCount: '1' })).trim(),
  };
  const profile = { ...street, person };
  const prompts = outputs.map(build => build(profile));
  for (const text of prompts) assert.ok(text.includes(person.text));
  const card = buildPage3SavedCard(profile, '街拍', 'Taipei 101', ...prompts);
  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(card));
  assert.deepEqual(restored.profile, profile);
  assert.deepEqual([restored.midjourneyPrompt, restored.grokPrompt, restored.zImagePrompt], prompts);
});
