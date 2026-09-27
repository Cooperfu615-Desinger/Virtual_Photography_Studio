import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const option = (key, zh) => {
  const value = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(value, `${key}: ${zh}`);
  return value.id;
};
function generate(overrides = {}, seed = 'hem-overlap-v1') {
  const locks = createEmptyLocks();
  for (const c of controls) {
    const none = c.options.find(o => o.zh === '全無');
    if (none) locks[c.key] = none.id;
  }
  Object.assign(locks, {
    subjectCount: '1', framingId: option('framingId', '全身鏡頭 (Full Body Shot)'),
    topId: option('topId', '落肩 T 恤'), pantsId: option('pantsId', '真理褲'),
    topStylingId: option('topStylingId', '衣襬遮住部分下身'), ...overrides,
  });
  return generatePrompts(1, locks, [], { random: createSeededRandom(seed) })[0];
}
const visible = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.extraPrompts.find(e => e.id === 'full-body-character').text];
const all = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, ...p.extraPrompts.map(e => e.text)];

test('overlap keeps micro shorts identity and survives visible outputs and saved-card restore', () => {
  const p = generate();
  for (const text of visible(p)) {
    assert.match(text, /partially concealing/i);
    assert.match(text, /dolphin micro shorts/i);
    assert.doesNotMatch(text, /top length meets|long untucked length/);
  }
  for (const e of p.extraPrompts.filter(e => e.id.includes('chest'))) assert.doesNotMatch(e.text, /partially concealing/);
  assert.equal(deserializeFavoritePrompt(serializeFavoritePrompt(p)).selection.topStylingId, 'hem-overlap');
});

test('overlap uses the A body profile without waist or abdominal emphasis and leaves other styling unchanged', () => {
  const bodyTypeId = option('bodyTypeId', '性感曲線身形');
  const p = generate({
    bodyTypeId,
    topId: option('topId', '長版寬鬆麻花針織毛衣'),
    pantsId: option('pantsId', '牛仔短褲'),
    bottomRiseId: option('bottomRiseId', '超低腰'),
  });
  const bodyAreaAnchors = /94-58-92|body proportion anchor|narrow defined waist|defined waist|waistline|waist curve|bust-waist-hip|abdomen|abdominal|midriff|belly|stomach|\babs\b|muscle definition/i;
  const bodyOutputs = [
    p.grokPrompt,
    p.zImagePrompt,
    p.midjourneyPrompt,
    p.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '',
  ];

  assert.equal(p.selection.bodyTypeId, bodyTypeId);
  for (const text of bodyOutputs) {
    assert.match(text, /softly curvy figure/i);
    assert.match(text, /rounded hips/i);
    assert.doesNotMatch(text, bodyAreaAnchors);
  }

  const untucked = generate({ bodyTypeId, topStylingId: 'untucked' });
  assert.match(untucked.grokPrompt, /94-58-92 body proportion anchor/i);
  assert.match(untucked.zImagePrompt, /narrow defined waist/i);
  assert.match(untucked.midjourneyPrompt, /defined waist/i);

  const incompatible = generate({ bodyTypeId, topId: option('topId', '比基尼上身') });
  assert.doesNotMatch(incompatible.grokPrompt, /partially concealing/i);
  assert.match(incompatible.grokPrompt, /94-58-92 body proportion anchor/i);
});

test('all normal body types omit local body-area details while hem overlap is effective', () => {
  const bodyTypeControl = controls.find((control) => control.key === 'bodyTypeId');
  const bodyAreaAnchors = /\bwaist(?:line)?(?!-up)\b|waist curve|waist-hip|bust-waist-hip|abdomen|abdominal|midriff|belly|stomach|\babs\b|muscle definition|body proportion anchor|torso-to-leg|visual height|visual weight|cup-scale|\b\d{2,3}-\d{2,3}-\d{2,3}\b/i;

  for (const item of bodyTypeControl.options.filter((entry) => entry.zh !== '全無')) {
    for (const framingZh of ['全身鏡頭 (Full Body Shot)', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)']) {
      const p = generate({
        bodyTypeId: item.id,
        framingId: option('framingId', framingZh),
      }, `hem-overlap-${item.zh}-${framingZh}`);
      const fullBody = p.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '';
      for (const text of [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, fullBody]) {
        assert.doesNotMatch(text, bodyAreaAnchors, `${item.zh}/${framingZh}`);
      }
    }
  }
});

test('duo overlap softens only the Body Type of the person wearing hem-overlap', () => {
  const p = generate({
    subjectCount: '2',
    bodyTypeAId: option('bodyTypeAId', '性感曲線身形'),
    bodyTypeBId: option('bodyTypeBId', '性感曲線身形'),
    topAId: option('topAId', '長版寬鬆麻花針織毛衣'),
    topBId: option('topBId', '長版寬鬆麻花針織毛衣'),
    pantsAId: option('pantsAId', '牛仔短褲'),
    pantsBId: option('pantsBId', '牛仔短褲'),
    topStylingAId: 'hem-overlap',
    topStylingBId: option('topStylingBId', '自然放出'),
  }, 'hem-overlap-duo-body-v1');
  const womanOne = p.grokPrompt.split('Woman 2:')[0].split('Woman 1:')[1] || '';
  const womanTwo = p.grokPrompt.split('Woman 2:')[1] || '';

  assert.match(womanOne, /softly curvy figure/i);
  assert.doesNotMatch(womanOne, /94-58-92|defined waist|bust-waist-hip/i);
  assert.match(womanTwo, /94-58-92 body proportion anchor/i);
  assert.match(womanTwo, /narrow defined waist/i);
  assert.equal(p.selection.bodyTypeAId, option('bodyTypeAId', '性感曲線身形'));
  assert.equal(p.selection.bodyTypeBId, option('bodyTypeBId', '性感曲線身形'));
  assert.equal(p.selection.topStylingAId, 'hem-overlap');
  assert.equal(p.selection.topStylingBId, option('topStylingBId', '自然放出'));
});

test('overlap works for silk tops and independent skirts without editing garment length', () => {
  const p = generate({ topId: option('topId', '絲質細肩帶上衣'), pantsId: option('pantsId', '全無'), skirtId: option('skirtId', '水手服長裙') });
  for (const text of visible(p)) assert.match(text, /partially concealing/i);
  assert.match(p.grokPrompt, /near-floor maxi hem/);
});

test('incompatible tops and absent bottoms do not get an overlap instruction', () => {
  for (const top of ['短版 T 恤', '比基尼上身', '蕾絲胸罩', '運動型內衣']) {
    const p = generate({ topId: option('topId', top) });
    for (const text of all(p)) assert.doesNotMatch(text, /partially concealing/);
    assert.equal(p.selection.topStylingId, 'hem-overlap');
  }
  for (const overrides of [
    { pantsId: option('pantsId', '全無') },
    { topId: option('topId', '短袖水手服'), topFitId: 'tight' },
    { outfitPresetId: option('outfitPresetId', '套裝：泳裝度假') },
  ]) for (const text of all(generate(overrides))) assert.doesNotMatch(text, /partially concealing/);
});

test('existing untucked remains a separate selectable option', () => {
  const p = generate({ topStylingId: 'untucked' });
  assert.match(p.grokPrompt, /top hem worn naturally loose over the waistband/);
  for (const text of all(p)) assert.doesNotMatch(text, /partially concealing/);
});

test('jeans and regular sailor tops retain overlap, and close crops restore it only in full-body derivative', () => {
  for (const overrides of [
    { pantsId: option('pantsId', '直筒牛仔褲') },
    { topId: option('topId', '短袖水手服') },
  ]) for (const text of visible(generate(overrides))) assert.match(text, /partially concealing/i);
  const p = generate({ framingId: 'camera:景別構圖-framing:胸上特寫:5' });
  for (const text of [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt]) assert.doesNotMatch(text, /partially concealing/);
  assert.match(p.extraPrompts.find(e => e.id === 'full-body-character').text, /partially concealing/);
});

test('duo overlap is scoped to the person with compatible separates', () => {
  const p = generate({ subjectCount: '2',
    topAId: option('topAId', '絲質細肩帶上衣'), pantsAId: option('pantsAId', '直筒牛仔褲'), topStylingAId: 'hem-overlap',
    topBId: option('topBId', '比基尼上身'), pantsBId: option('pantsBId', '真理褲'), topStylingBId: 'hem-overlap',
  });
  for (const text of [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt]) {
    assert.equal((text.match(/partially concealing/g) || []).length, 1);
  }
});

test('random styling keeps the pre-existing pool', () => {
  for (let i = 0; i < 20; i++) {
    const p = generate({ topStylingId: '' }, i);
    assert.notEqual(p.selection.topStylingId, 'hem-overlap');
  }
});
