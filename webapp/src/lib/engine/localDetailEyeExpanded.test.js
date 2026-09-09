import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls } from '../engine.js';
import { buildResolvedLocalDetailBundle } from './localDetailResolvedAdapter.js';

const controls = getLockControls();
const options = (key) => controls.find((c) => c.key === key).options.filter((o) => o.zh !== '全無');
const option = (key, zh) => {
  const result = options(key).find((o) => o.zh === zh);
  assert.ok(result, `${key}/${zh}`);
  return result;
};
const snapshot = () => ({ subjectCount: 1, imageType: 'photorealistic-photo', character: {
  facialFeatures: option('facialFeaturesId', '甜美可愛臉'),
  hairStylingState: option('hairStylingStateId', '柔順自然'),
}, wardrobe: {} });
const eye = (input) => buildResolvedLocalDetailBundle(input).eyes;

test('all six face sources retain only canonical eyes and brows', () => {
  assert.equal(options('facialFeaturesId').length, 6);
  for (const facialFeatures of options('facialFeaturesId')) {
    const input = snapshot();
    input.character.facialFeatures = facialFeatures;
    const result = eye(input);
    assert.equal(result.status, 'ready', facialFeatures.zh);
    assert.equal(result.coverage.brows, 'exposed');
    assert.ok(result.sourceRefs.some((r) => r.key === 'character.facialFeatures.mj.face'));
    assert.doesNotMatch(result.text, /nose|lips|oval|seductive|gaze-ready/);
  }
});

test('normal glasses retain reviewed frame style and color without promising lens transparency', () => {
  const glasses = options('eyewearId').filter((o) => !['眼布', '太陽眼鏡'].includes(o.zh));
  assert.equal(glasses.length, 8);
  for (const eyewear of glasses) {
    const input = snapshot();
    input.wardrobe = { eyewear, eyewearColor: option('eyewearColorId', '金屬銀'),
      eyewearPlacement: option('eyewearPlacementId', '正常戴在臉上') };
    const result = eye(input);
    assert.equal(result.status, 'ready', eyewear.zh);
    assert.ok(result.text.includes(eyewear.en));
    assert.match(result.text, /silver metal frame/);
    assert.doesNotMatch(result.text, /transparent lenses|clear lenses|bright round eyes/);
  }
});

test('tinted lenses suppress underlying eyes; frame transparency does not change lenses', () => {
  const input = snapshot();
  input.wardrobe = { eyewear: option('eyewearId', '太陽眼鏡'),
    eyewearColor: option('eyewearColorId', '透明框') };
  const result = eye(input);
  assert.equal(result.status, 'ready');
  assert.match(result.text, /sunglasses with tinted lenses/);
  assert.match(result.text, /clear transparent frame/);
  assert.doesNotMatch(result.text, /round eyes|transparent lenses/);
});

test('all catalog hairstyles have reviewed baseline handling without importing complete hair', () => {
  assert.equal(options('hairstyleId').length, 31);
  for (const hairstyle of options('hairstyleId')) {
    const input = snapshot();
    input.character.hairstyle = hairstyle;
    const result = eye(input);
    assert.equal(result.status, 'ready', hairstyle.zh);
    assert.doesNotMatch(result.text, /ponytail|pigtails|chin-length|collarbone-length|rounded high buns|red fabric ribbons/);
    assert.ok(result.sourceRefs.some((r) => r.key === 'character.hairstyle'), hairstyle.zh);
  }
});

test('near-eye strands retain local color and wet styling without forcing unobstructed eyes', () => {
  const input = snapshot();
  input.character.hairstyle = option('hairstyleId', '不對稱濕感短鮑伯');
  input.character.hairColor = option('hairColorId', '柔霧黑茶');
  input.character.hairStylingState = option('hairStylingStateId', '濕髮分束');
  const result = eye(input);
  assert.equal(result.status, 'ready');
  assert.match(result.text, /one side falling near the eye/);
  assert.match(result.text, /soft black-tea brown hair/);
  assert.match(result.text, /sleek wet finish/);
  assert.doesNotMatch(result.text, /bright round eyes|curved brows|short bob|sharp uneven silhouette/);
});

test('glasses and near-eye strands remain separate local surfaces', () => {
  const input = snapshot();
  input.character.hairstyle = option('hairstyleId', '不對稱濕感短鮑伯');
  input.wardrobe.eyewear = option('eyewearId', '細框眼鏡');
  const result = eye(input);
  assert.match(result.text, /thin-frame glasses/);
  assert.match(result.text, /one side falling near the eye/);
  assert.doesNotMatch(result.text, /bright round eyes/);
});

test('brow expression remains independent from eye expression and is suppressed by fringe', () => {
  const input = snapshot();
  input.character.expression = option('expressionId', '撒嬌生氣');
  assert.match(eye(input).text, /lightly furrowed brows/);
  assert.doesNotMatch(eye(input).text, /pout|puffed cheeks/);
  input.character.hairstyle = option('hairstyleId', '齊瀏海圓弧鮑伯');
  assert.match(eye(input).text, /full straight bangs/);
  assert.doesNotMatch(eye(input).text, /furrowed|curved brows/);
});

test('eye cloth color inherits resolved fabric color instead of retaining black', () => {
  const input = snapshot();
  input.wardrobe = { eyewear: option('eyewearId', '眼布'), eyewearColor: option('eyewearColorId', '白色') };
  const result = eye(input);
  assert.match(result.text, /white elastic stretch-fabric eye covering/);
  assert.doesNotMatch(result.text, /black|white frame|round eyes|curved brows/);
});

test('unreviewed variants cannot borrow a reviewed name or stale structured identity', () => {
  for (const change of [
    { wardrobe: { eyewear: { zh: '细框', en: 'custom glasses' } } },
    { character: { hairstyle: { ...option('hairstyleId', '柔波：中分'), en: 'custom veil-like hair' } } },
    { character: { facialFeatures: { ...option('facialFeaturesId', '甜美可愛臉'), mj: { face: 'changed identity' } } } },
  ]) {
    const input = snapshot();
    Object.assign(input.wardrobe, change.wardrobe);
    Object.assign(input.character, change.character);
    assert.equal(eye(input).status, 'needs-source-review');
  }
});

test('reviewed hairstyle and eyewear pairs keep local eyewear and never require full hair', () => {
  for (const hairstyle of options('hairstyleId')) {
    for (const eyewear of options('eyewearId')) {
      const input = snapshot();
      input.character.hairstyle = hairstyle;
      input.wardrobe.eyewear = eyewear;
      const result = eye(input);
      assert.equal(result.status, 'ready', `${hairstyle.zh}/${eyewear.zh}`);
      assert.ok(result.text.includes(eyewear.zh === '眼布'
        ? 'eye covering fitted directly over both eyes' : eyewear.en));
      assert.doesNotMatch(result.text, /round eyes|curved brows|whole hairstyle|ponytail|pigtails/);
    }
  }
});

test('all frame colors are source-traceable and do not become eye colors', () => {
  for (const eyewearColor of options('eyewearColorId')) {
    const input = snapshot();
    input.wardrobe = { eyewear: option('eyewearId', '細框眼鏡'), eyewearColor };
    const result = eye(input);
    assert.ok(result.text.includes(eyewearColor.en));
    assert.ok(result.sourceRefs.some((r) => r.key === 'wardrobe.eyewearColor' && r.excerpt === eyewearColor.en));
    assert.doesNotMatch(result.text, /blue eyes|green eyes|brown eyes|transparent lenses/);
    input.wardrobe.eyewearPlacement = option('eyewearPlacementId', '戴在頭頂');
    assert.ok(!eye(input).text.includes(eyewearColor.en));
  }
});

test('eye-source expansion is deterministic and does not change the two torso targets', () => {
  const input = snapshot();
  input.wardrobe.top = option('topId', '高領連身上衣');
  const original = buildResolvedLocalDetailBundle(input);
  input.character.hairstyle = option('hairstyleId', '不對稱濕感短鮑伯');
  input.wardrobe.eyewear = option('eyewearId', '太陽眼鏡');
  const before = JSON.stringify(input);
  const changed = buildResolvedLocalDetailBundle(input);
  for (const target of ['collarbone-chest', 'abdomen-navel']) assert.deepEqual(changed[target], original[target]);
  assert.deepEqual(changed, buildResolvedLocalDetailBundle(input));
  assert.equal(JSON.stringify(input), before);
  assert.ok(Object.isFrozen(changed.eyes.sourceRefs));
});

test('raw legacy eye sources survive without structured metadata but do not invent brows', () => {
  const input = snapshot();
  input.character.facialFeatures = { zh: '甜美可愛臉', en: 'bright friendly eyes' };
  assert.match(eye(input).text, /bright friendly eyes/);
  assert.doesNotMatch(eye(input).text, /curved brows|round eyes/);
});
