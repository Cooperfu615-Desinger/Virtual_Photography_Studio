import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls } from '../engine.js';
import { buildResolvedLocalDetailBundle } from './localDetailResolvedAdapter.js';

const controls = getLockControls();
const option = (key, zh) => {
  const item = controls.find((c) => c.key === key)?.options.find((o) => o.zh === zh);
  assert.ok(item, `${key}/${zh}`);
  return item;
};
const base = () => ({ subjectCount: 1, imageType: 'photorealistic-photo', character: {
  facialFeatures: option('facialFeaturesId', '甜美可愛臉'),
  hairstyle: option('hairstyleId', '帥氣濕亮油頭'),
  hairStylingState: option('hairStylingStateId', '柔順自然'),
}, wardrobe: {} });
const localEvidence = (text) => text.split('\n\n').slice(2).join('\n\n');

test('reviewed hair swept away from the forehead does not suppress the eye crop', () => {
  for (const zh of ['柔順自然', '濕髮分束']) {
    const snapshot = base();
    snapshot.character.hairStylingState = option('hairStylingStateId', zh);
    const result = buildResolvedLocalDetailBundle(snapshot).eyes;
    assert.equal(result.status, 'ready');
    assert.match(result.text, /bright round eyes/);
    assert.doesNotMatch(result.text, /short hair|slicked|wet|forehead|silhouette/);
    assert.ok(result.sourceRefs.some((r) => r.key === 'character.hairstyle'));
  }
});

test('unreviewed wind and changed hair sources remain barriers', () => {
  const variants = [
    { hairStylingState: option('hairStylingStateId', '強烈風感') },
    { hairStylingState: option('hairStylingStateId', '微風吹拂') },
    { hairstyle: { ...base().character.hairstyle, en: 'custom hair covering the eyes' } },
  ];
  for (const variant of variants) {
    const snapshot = base();
    Object.assign(snapshot.character, variant);
    assert.equal(buildResolvedLocalDetailBundle(snapshot).eyes.status, 'needs-source-review');
  }
});

test('reviewed lower-face and audio accessories stay outside the crop', () => {
  for (const zh of ['黑色口罩', '防毒面具（3M 6200）', '耳罩式耳機（戴在頭上）', '耳罩式耳機（掛在脖子上）', '有線耳機']) {
    const snapshot = base();
    snapshot.wardrobe.headAccessory = option('headAccessoryId', zh);
    const result = buildResolvedLocalDetailBundle(snapshot).eyes;
    assert.equal(result.status, 'ready', zh);
    assert.doesNotMatch(localEvidence(result.text), /mask|respirator|headphones|earphones|cable|nose|mouth/);
    assert.ok(result.sourceRefs.some((r) => r.key === 'wardrobe.headAccessory'));
  }
  const snapshot = base();
  snapshot.wardrobe.headAccessory = option('headAccessoryId', '棒球帽');
  assert.equal(buildResolvedLocalDetailBundle(snapshot).eyes.status, 'needs-source-review');
});

test('eye covering retains only its local fabric and hides eye identity and expression', () => {
  const snapshot = base();
  snapshot.wardrobe.eyewear = option('eyewearId', '眼布');
  snapshot.character.expression = option('expressionId', '輕微驚訝');
  const result = buildResolvedLocalDetailBundle(snapshot).eyes;
  assert.equal(result.status, 'ready');
  assert.equal(result.coverage.eyes, 'covered');
  assert.match(result.text, /eye[- ]area/);
  assert.match(result.text, /black elastic stretch-fabric eye covering fitted directly over both eyes/);
  assert.doesNotMatch(localEvidence(result.text), /friendly|widened|raised brows|hair fully|nose|mouth/);
});

test('eye expression fragments do not import lips, teeth, cheeks or whole-face emotion', () => {
  const snapshot = base();
  snapshot.character.expression = option('expressionId', '自然喜悅');
  const result = buildResolvedLocalDetailBundle(snapshot).eyes;
  assert.match(result.text, /eyes gently narrowed by the smile/);
  assert.doesNotMatch(result.text, /visible teeth|lifted cheeks|candid joyful expression|open genuine smile/);
  assert.ok(result.sourceRefs.some((r) => r.key === 'character.expression'));
});

test('stale reviewed expression source is not replaced with invented default expression', () => {
  const snapshot = base();
  snapshot.character.expression = { zh: '自然喜悅', en: 'unknown expression' };
  const result = buildResolvedLocalDetailBundle(snapshot).eyes;
  assert.doesNotMatch(result.text, /narrowed|smile/);
});

test('all thirteen reviewed eye expressions stay source-traceable and respect covering', () => {
  const expressions = controls.find((c) => c.key === 'expressionId').options
    .filter((o) => !['無額外表情', '撒嬌生氣'].includes(o.zh));
  assert.equal(expressions.length, 13);
  for (const expression of expressions) {
    const snapshot = base();
    snapshot.character.expression = expression;
    const result = buildResolvedLocalDetailBundle(snapshot).eyes;
    const references = result.sourceRefs.filter((r) => r.key === 'character.expression');
    assert.equal(references.length, expression.zh === '自然喜悅' ? 1 : 2, expression.zh);
    assert.ok(references.every((r) => expression.en.includes(r.excerpt)));
    assert.match(result.text, /eye[- ]area/);
    snapshot.wardrobe.eyewear = option('eyewearId', '眼布');
    assert.equal(buildResolvedLocalDetailBundle(snapshot).eyes.sourceRefs
      .some((r) => r.key === 'character.expression'), false);
  }
});

test('changed head accessory sources and counterfeit eye-cover labels cannot reveal hidden eyes', () => {
  const snapshot = base();
  snapshot.wardrobe.headAccessory = { ...option('headAccessoryId', '黑色口罩'), en: 'custom covering over the eyes' };
  assert.equal(buildResolvedLocalDetailBundle(snapshot).eyes.status, 'needs-source-review');
  delete snapshot.wardrobe.headAccessory;
  snapshot.wardrobe.eyewear = { ...option('eyewearId', '眼布'), en: 'custom blindfold' };
  snapshot.wardrobe.eyewearPlacement = option('eyewearPlacementId', '戴在頭頂');
  assert.equal(buildResolvedLocalDetailBundle(snapshot).eyes.status, 'needs-source-review');
});
