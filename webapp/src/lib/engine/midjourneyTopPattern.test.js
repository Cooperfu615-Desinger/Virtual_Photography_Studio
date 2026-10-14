import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const option = (key, zh) => {
  const value = controls.find(control => control.key === key)?.options.find(entry => entry.zh === zh);
  assert.ok(value, `${key}: ${zh}`);
  return value;
};
const patterns = controls.find(control => control.key === 'topPatternId').options.filter(entry => entry.en && entry.zh !== '全無' && entry.id !== 'random');

function generate(overrides = {}) {
  const locks = createEmptyLocks();
  for (const control of controls) {
    const none = control.options.find(entry => entry.zh === '全無' || entry.zh === '無額外表情');
    if (none) locks[control.key] = none.id;
  }
  Object.assign(locks, {
    subjectCount: '1',
    topId: option('topId', '短袖上衣').id,
    framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id,
    ...overrides,
  });
  const before = structuredClone(locks);
  const result = generatePrompts(1, locks, [], { random: createSeededRandom('mj-top-pattern-v1') })[0];
  assert.deepEqual(locks, before);
  return result;
}

test('all 25 top patterns keep their selection across three top identities', () => {
  assert.equal(patterns.length, 25);
  for (const top of ['短袖上衣', '棉質細肩背心', '帽T']) {
    for (const pattern of patterns) {
      const prompt = generate({ topId: option('topId', top).id, topPatternId: pattern.id });
      assert.equal(prompt.selection.topPatternId, pattern.id);
    }
  }
});

test('top patterns remain in GPT chest and out of main MJ across current and legacy parent crops', () => {
  const pattern = option('topPatternId', '胸前卡通塗鴉印花');
  for (const framing of ['全身鏡頭 (Full Body Shot)', '牛仔中景 (Cowboy Shot)', '中景鏡頭 (Medium Shot)', '半臉傾斜特寫', '全臉傾斜特寫', '臉部特寫']) {
    const prompt = generate({ framingId: option('framingId', framing).id, topPatternId: pattern.id });
    assert.equal(prompt.selection.topPatternId, pattern.id);
    assert.ok(prompt.extraPrompts.find(entry => entry.id === 'chest-up-portrait').text.includes(pattern.en), framing);
    // Main close-ups follow the shared projected top, never raw hidden sources.

    assert.equal(prompt.midjourneyPrompt.includes(pattern.en), false, framing);
  }
});

test('selected pattern survives Saved Cards serialization and restoration', () => {
  const pattern = option('topPatternId', '滿版卡通貼紙拼貼印花');
  const prompt = generate({ topPatternId: pattern.id });
  const restored = deserializeFavoritePrompt(serializeFavoritePrompt({ ...prompt, source: 'page1' }));
  assert.equal(restored.selection.topPatternId, pattern.id);
  assert.equal(restored.midjourneyPrompt, prompt.midjourneyPrompt);
});
