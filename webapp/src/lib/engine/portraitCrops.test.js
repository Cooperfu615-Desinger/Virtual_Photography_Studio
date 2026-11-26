import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { buildPage1GenerationPromptCards } from '../page1PromptOutputs.js';
import { naturalFixtureLocks } from './midjourneyNaturalFixtures.js';
import { buildPage1MainFramingControl, getRandomMainFramingOptions } from './fixedFramingMainPrompt.js';
import { resolveCompositionVisibilityBucket } from './compositionVisibilityContract.js';
import { deserializeFavoritePrompt, parseLocksFromStandardPrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const framing = controls.find(control => control.key === 'framingId');
const crops = [
  ['大頭照', 'portrait-headshot', 'headShoulders', 'shoulders or collarbones'],
  ['貼臉特寫', 'intimate-facial-close-up', 'faceDetail', 'chin near the lower edge'],
];

for (const [zh, slug, bucket, boundary] of crops) {
  test(`${zh} can be selected, sampled and restored with its independent imaging selections`, () => {
    const item = framing.options.find(option => option.zh === zh);
    assert.equal(item?.id, `camera:景別構圖-framing:${slug}`);
    assert.equal(resolveCompositionVisibilityBucket(item), bucket);
    for (const options of [buildPage1MainFramingControl(framing).options, getRandomMainFramingOptions(framing.options)]) {
      assert.ok(options.some(option => option.id === item.id && !option.disabled));
    }
    for (const [aspectRatio, lighting, aperture] of [
      ['4:5', '柔和順光', 'f/5.6 中等景深'],
      ['9:16', '柔和順光', 'f/5.6 中等景深'],
      ['9:16', '均勻平光', 'f/5.6 中等景深'],
      ['9:16', '均勻平光', 'f/2.8 淺景深'],
      ['16:9', '側向柔光', 'f/11 深焦清晰'],
    ]) {
      const locks = naturalFixtureLocks({ subjectCount: '1', framingId: item.id, aspectRatio,
        lightingId: { byZh: '晴朗白日' }, lightDirectionId: { byZh: lighting }, apertureId: { byZh: aperture } });
      const [result] = generatePrompts(1, locks, [], { random: createSeededRandom('portrait-crop') });
      for (const key of ['framingId', 'aspectRatio', 'lightingId', 'lightDirectionId', 'apertureId']) {
        assert.equal(result.selection[key], locks[key], key);
      }
      const cards = new Map(buildPage1GenerationPromptCards(result).map(card => [card.id, card.value]));
      for (const id of ['gpt', 'grok', 'ai', 'nano-banana-2.1', 'grok-imagine']) {
        assert.ok(cards.get(id)?.toLowerCase().includes(boundary), id);
      }
      assert.ok(result.midjourneyPrompt.includes(`--ar ${aspectRatio}`));
      for (const key of ['lightDirectionId', 'apertureId']) {
        const selected = controls.find(c => c.key === key).options.find(o => o.id === locks[key]);
        assert.ok(result.grokPrompt.toLowerCase().includes(selected.en.toLowerCase().split(',')[0]), selected.en);
      }
      assert.equal(parseLocksFromStandardPrompt(result.grokPrompt, controls).locks.framingId, item.id);
      assert.equal(deserializeFavoritePrompt(serializeFavoritePrompt(result)).selection.framingId, item.id);
      for (const [id, ratio] of [['chest-up-portrait', '4:5'], ['full-body-character', '9:16']]) {
        const text = cards.get(id);
        assert.ok(text?.includes(ratio), id);
        assert.ok(!text.toLowerCase().includes(boundary));
      }
    }
  });
}

test('both portrait crops retain their selection for two people in a landscape frame', () => {
  for (const [zh, , , boundary] of crops) {
    const locks = naturalFixtureLocks({ subjectCount: '2', aspectRatio: '16:9', framingId: { byZh: zh } });
    const [result] = generatePrompts(1, locks, [], { random: createSeededRandom('duo-portrait') });
    assert.equal(result.selection.subjectCount, '2');
    assert.doesNotMatch(result.grokPrompt, /portrait-oriented/i);
    assert.equal(result.selection.framingId, locks.framingId);
    assert.equal(result.selection.aspectRatio, '16:9');
    for (const card of buildPage1GenerationPromptCards(result)) {
      assert.ok(card.value.toLowerCase().includes(boundary), card.id);
    }
  }
});
