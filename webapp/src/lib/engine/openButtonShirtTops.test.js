import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { buildPage1GenerationPromptCards } from '../page1PromptOutputs.js';
import { naturalFixtureLocks } from './midjourneyNaturalFixtures.js';
import { buildRestoreLocks, deserializeFavoritePrompt, parseLocksFromStandardPrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';

const shirts = [
  { label: '開釦短袖襯衫', id: 'wardrobe:上身-tops:open-button-short-sleeve-shirt', sleeve: 'short' },
  { label: '開釦長袖襯衫', id: 'wardrobe:上身-tops:open-button-long-sleeve-shirt', sleeve: 'long' },
];
const controls = getLockControls();
const option = (key, label) => controls.find(control => control.key === key).options.find(item => item.zh === label);
const generate = selections => generatePrompts(1, naturalFixtureLocks({
  subjectCount: '1',
  framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
  ...selections,
}), [], { random: createSeededRandom('open-button-shirt-tops-v1') })[0];

test('both standalone shirts can be selected and paired with independently colored pants', () => {
  for (const { label, id, sleeve } of shirts) {
    for (const key of ['topId', 'topAId', 'topBId']) assert.equal(option(key, label)?.id, id);
    const result = generate({
      topId: id,
      topColorId: { byZh: '紅色' },
      pantsId: { byZh: '直筒牛仔褲' },
      bottomColorId: { byZh: '白色' },
    });
    assert.equal(result.selection.topId, id);
    assert.match(result.grokPrompt, /upper buttons open/i);
    assert.match(result.grokPrompt, /shirt fabric in red/i);
    assert.match(result.grokPrompt, /straight-leg jeans/i);
    assert.doesNotMatch(result.grokPrompt, /hot pants|bodycon mini skirt/i);
    for (const { title, value } of buildPage1GenerationPromptCards(result)) {
      assert.match(value, new RegExp(`${sleeve}-sleeve button-up shirt`, 'i'), title);
    }
    const imported = parseLocksFromStandardPrompt(result.grokPrompt, controls).locks;
    assert.equal(imported.topId, id);
    assert.equal(imported.topColorId, result.selection.topColorId);
    const saved = deserializeFavoritePrompt(serializeFavoritePrompt(result));
    assert.equal(buildRestoreLocks(saved.selection, controls).topId, id);
  }
});

test('the independent short fit and duo routes retain the corresponding shirt and color', () => {
  const [short, long] = shirts;
  const crop = generate({ topId: short.id, topFitId: 'underbust-fitted' });
  assert.match(crop.grokPrompt, /short-sleeve button-up shirt/i);
  assert.match(crop.grokPrompt, /underbust-cropped/i);
  const duo = generate({
    subjectCount: '2',
    topAId: short.id,
    topBId: long.id,
    topAColorId: { byZh: '紅色' },
    topBColorId: { byZh: '白色' },
  });
  assert.match(duo.grokPrompt, /short-sleeve button-up shirt[^\n]*shirt fabric in red/i);
  assert.match(duo.grokPrompt, /long-sleeve button-up shirt[^\n]*shirt fabric in white/i);
});
