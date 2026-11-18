import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCharacterCardPromptBundle, buildCharacterCardScenePerson, getCharacterCardOptions } from './characterCardLab.js';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from './engine.js';
import {
  SPECIAL_SCENE_LOCATIONS,
  buildPage3WorldScenePrompt,
  buildPage3WorldSceneCinematicPrompt,
  buildPage3WorldSceneWorldPrompt,
  buildPage1WorldSceneArchitecture,
} from './page3WorldScene.js';
import { PAGE3_DEFAULT_PERSON, readScenePersonAppearance } from './page3Person.js';
import { buildPage3SavedCard } from '../features/page3/page3SavedCard.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt } from '../features/saved-cards/cardCodec.js';
import { attachMidjourneySettingsToPrompt } from '../features/page1/midjourneyParameterState.js';

const outputs = [buildPage3WorldScenePrompt, buildPage3WorldSceneCinematicPrompt, buildPage3WorldSceneWorldPrompt];
const street = { sceneMode: 'street-only', worldLocation: 'taipei-xinyi-taipei101-street-corner' };
const generate = (locks) => generatePrompts(1, { ...createEmptyLocks(), ...locks }, [], { random: createSeededRandom('page3-person') })[0];

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
