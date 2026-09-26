import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../features/saved-cards/cardCodec.js';
import { validatePromptOutputContract } from './engine/promptOutputContracts.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

const controls = getLockControls();
const option = (key, zh) => {
  const result = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(result, `${key}: ${zh}`);
  return result.id;
};
const noneLocks = () => Object.fromEntries([
  ...Object.entries(createEmptyLocks()),
  ...controls.filter(c => c.options.some(o => o.zh === '全無' || o.zh === '無額外表情'))
    .map(c => [c.key, c.options.find(o => o.zh === '全無' || o.zh === '無額外表情').id]),
]);
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('optional-silence-v1') })[0];
const texts = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, ...(p.extraPrompts || []).map(x => x.text)];

test('optional none preserves each companion selection without replacement', () => {
  for (const suffix of ['', 'A', 'B']) {
    const key = base => `${base}${suffix}Id`;
    const placementKey = suffix ? `eyewear${suffix}PlacementId` : 'eyewearPlacementId';
    const openingKey = suffix ? `outerwear${suffix}OpeningId` : 'outerwearOpeningId';
    const locks = {
      ...noneLocks(), subjectCount: suffix ? '2' : '1',
      [key('bodyType')]: option(key('bodyType'), '全無'),
      [key('hairstyle')]: option(key('hairstyle'), '乾淨短鮑伯'),
      [key('hairStylingState')]: option(key('hairStylingState'), '全無'),
      [key('outerwear')]: option(key('outerwear'), '西裝外套'),
      [openingKey]: option(openingKey, '全無'),
      [key('eyewear')]: option(key('eyewear'), '粗框眼鏡'),
      [placementKey]: option(placementKey, '全無'),
      framingId: option('framingId', '全身鏡頭 (Full Body Shot)'),
    };
    const p = generate(locks);
    for (const field of [key('bodyType'), key('hairStylingState'), openingKey, placementKey]) {
      assert.equal(p.selection[field], locks[field], field);
    }
    assert.match(p.grokPrompt, /short bob|bob haircut/i);
    assert.match(p.grokPrompt, /blazer/i);
    assert.match(p.grokPrompt, /thick-frame/i);
    for (const text of texts(p)) {
      assert.doesNotMatch(text, /sleek close-to-head roots|front closure in the normal|worn normally on the face|worn on top of the head|body proportion anchor/i);
    }
    const restored = normalizeLocks(p.selection);
    for (const field of [key('bodyType'), key('hairStylingState'), openingKey, placementKey]) assert.equal(restored[field], locks[field]);
  }
});

test('none scene and lighting produce no main scene or lighting fallback', () => {
  const locks = { ...noneLocks(), subjectCount: '1', sceneAttributeId: 'none' };
  const p = generate(locks);
  assert.equal(p.selection.sceneAttributeId, 'none');
  assert.equal(normalizeLocks(p.selection).sceneAttributeId, 'none');
  for (const text of [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt]) {
    assert.doesNotMatch(text, /Scene:|Lighting:|Camera Look:|Pose and Composition:|\bnone\b|unspecified|open neckline styling/i);
  }
  const withScene = generate({ ...locks, locationId: option('locationId', '室內：深邃黑幕') });
  assert.match(withScene.grokPrompt, /black/i);
});

test('retired PAGE1 ratio does not randomly set new prompt proportions', () => {
  const ratio = controls.find(c => c.key === 'aspectRatio');
  assert.equal(ratio.section, 'hidden');
  assert.equal(ratio.randomization, 'excluded');
  assert.equal(createEmptyLocks().aspectRatio, 'none');
  const p = generate(noneLocks());
  assert.equal(p.selection.aspectRatio, 'none');
  assert.doesNotMatch(p.grokPrompt, /aspect ratio|vertical portrait composition|horizontal portrait composition/i);
  assert.equal(normalizeLocks({ aspectRatio: 'random' }).aspectRatio, 'none');
  assert.equal(normalizeLocks({ aspectRatio: '4:5' }).aspectRatio, '4:5');
  const mj = generate({ ...noneLocks(), mjAspectRatio: '3:2' });
  assert.match(mj.midjourneyPrompt, /--ar 3:2/);
  assert.match(mj.extraPrompts.find(x => x.id === 'full-body-character').text, /9:16/);
});

test('empty single and duo optional sections remain contract-valid', () => {
  for (const subjectCount of ['1', '2']) {
    const p = generate({ ...noneLocks(), subjectCount });
    assert.deepEqual(validatePromptOutputContract('grokPrompt', p.grokPrompt, { mode: subjectCount === '2' ? 'duo' : 'single' }), []);
    assert.doesNotMatch(p.grokPrompt, /Woman [12]:|Pose and Composition:|Wardrobe:|Scene:|Lighting:|Camera Look:/);
  }
});

test('silence selections survive Saved Cards and Markdown restore', () => {
  const p = generate(noneLocks());
  const saved = deserializeFavoritePrompt(serializeFavoritePrompt(p));
  const parsed = parseExportedMarkdownPrompt(buildMarkdownExport(p), controls, 'silence-roundtrip');
  for (const restored of [saved, parsed]) {
    for (const key of ['bodyTypeId', 'hairStylingStateId', 'outerwearOpeningId', 'eyewearPlacementId', 'sceneAttributeId', 'aspectRatio']) {
      assert.equal(restored.selection[key], p.selection[key], key);
    }
    assert.equal(restored.grokPrompt, p.grokPrompt);
  }
});
