import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls } from '../engine.js';
import { buildResolvedLocalDetailBundle } from './localDetailResolvedAdapter.js';

const controls = getLockControls();
const option = (key, zh) => {
  const item = controls.find((control) => control.key === key)?.options.find((candidate) => candidate.zh === zh);
  assert.ok(item, `${key}/${zh}`);
  return item;
};

const base = (character = {}, wardrobe = {}) => buildResolvedLocalDetailBundle({
  subjectCount: 1,
  imageType: 'photorealistic-photo',
  character,
  wardrobe,
  colors: {},
});

test('local targets use region-range compositions instead of a tiny center macro', () => {
  const result = base({
    facialFeatures: option('facialFeaturesId', '甜美可愛臉'),
    bodyType: option('bodyTypeId', '性感曲線身形'),
  }, {
    top: option('topId', '高領連身上衣'),
  });

  assert.match(result.eyes.text, /An eye-area close-up extending from the brow line to the upper cheekbones/);
  assert.match(result['collarbone-chest'].text, /A collarbone-and-upper-chest close-up extending from the base of the neck to the upper bust/);
  assert.match(result['abdomen-navel'].text, /A midriff close-up extending from the lower ribcage to the upper hip line/);
  for (const target of ['eyes', 'collarbone-chest', 'abdomen-navel']) {
    assert.doesNotMatch(result[target].text, /An extreme close-up|This small region fills the frame/);
  }
});

test('chest and abdomen retain only target-specific body contours', () => {
  const result = base({
    facialFeatures: option('facialFeaturesId', '甜美可愛臉'),
    bodyType: option('bodyTypeId', '性感曲線身形'),
  }, {
    top: option('topId', '棉質細肩背心'),
  });
  const abdomen = base({
    bodyType: option('bodyTypeId', '性感曲線身形'),
  }, {
    top: option('topId', '高領連身上衣'),
  })['abdomen-navel'];

  assert.match(result['collarbone-chest'].text, /full F-to-G-cup-scale bust/);
  assert.match(result['collarbone-chest'].text, /slim shoulder straps/);
  assert.doesNotMatch(result['collarbone-chest'].text, /94-58-92|long legs|visual weight/);
  assert.match(abdomen.text, /narrow defined waist/);
  assert.doesNotMatch(result.eyes.text, /narrow defined waist|full bust|body proportion/);
});

test('midriff composition keeps source-backed garment boundaries and waist contours', () => {
  const result = base({
    bodyType: option('bodyTypeId', '柔和沙漏身形'),
  }, {
    top: option('topId', '高領連身上衣'),
    pants: option('pantsId', '直筒牛仔褲'),
    bottomRise: option('bottomRiseId', '低腰'),
  })['abdomen-navel'];

  assert.equal(result.status, 'ready');
  assert.match(result.text, /elongated abdomen with subtle contour lines/);
  assert.match(result.text, /clean denim texture/);
  assert.match(result.text, /low-rise waistband sitting on the hips/);
  assert.equal(result.coverage.nearbyWaistline, 'covered');
  assert.doesNotMatch(result.text, /full-body|whole outfit|room|scene/);
});

test('stale Body Type text does not invent a local contour or block the target', () => {
  const result = base({
    bodyType: { ...option('bodyTypeId', '性感曲線身形'), en: 'custom body text' },
  }, {
    top: option('topId', '高領連身上衣'),
  });

  assert.equal(result['collarbone-chest'].status, 'ready');
  assert.equal(result['abdomen-navel'].status, 'ready');
  assert.ok(result['collarbone-chest'].diagnostics.includes('unreviewed-body-contour'));
  assert.ok(result['abdomen-navel'].diagnostics.includes('unreviewed-body-contour'));
  assert.doesNotMatch(result['collarbone-chest'].text, /custom body text|full bust/);
  assert.doesNotMatch(result['abdomen-navel'].text, /custom body text|narrow defined waist/);
});
