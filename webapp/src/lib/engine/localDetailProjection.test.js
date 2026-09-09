import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildLocalDetailBundle } from './localDetailProjection.js';

const ref = (key, excerpt) => ({ key, excerpt });
const detail = (group, region, key, excerpt) => ({ group, region, ref: ref(key, excerpt) });
const base = () => ({
  subjectCount: 1,
  imageType: 'photorealistic-photo',
  sources: {
    face: { en: 'young sweet pretty face, bright friendly eyes' },
    skin: { en: 'dewy luminous skin texture' },
    cover: { en: 'opaque mirror-polished latex, continuous unbroken coverage' },
    piercing: { en: 'round-cut diamond navel piercing at the belly button' },
    opening: { en: 'worn open at the front' },
    sheer: { en: 'lightweight voile fabric, translucent layered surface' },
  },
  targets: {
    eyes: {
      layers: [{ id: 'face', regions: { eyes: { state: 'exposed', ref: ref('face', 'bright friendly eyes') } } }],
      details: [detail('eyeIdentity', 'eyes', 'face', 'bright friendly eyes')],
    },
    'abdomen-navel': {
      layers: [{ id: 'cover', regions: { navelPosition: { state: 'covered', ref: ref('cover', 'continuous unbroken coverage') } },
        details: [detail('localFabric', 'navelPosition', 'cover', 'opaque mirror-polished latex')] }],
      details: [detail('visibleNavelPiercing', 'navelPosition', 'piercing', 'round-cut diamond navel piercing at the belly button')],
    },
  },
});

test('opaque garment is the visible surface; a hidden piercing cannot open it', () => {
  const result = buildLocalDetailBundle(base())['abdomen-navel'];
  assert.equal(result.status, 'ready');
  assert.match(result.text, /opaque mirror-polished latex/);
  assert.doesNotMatch(result.text, /diamond|bare skin|full-body|whole outfit/);
  assert.equal(result.coverage.navelPosition, 'covered');
  assert.ok(result.sourceRefs.some((r) => r.key === 'cover'));
});

test('opening an outer layer does not open an opaque inner layer', () => {
  const input = base();
  input.targets['abdomen-navel'].layers.unshift({ id: 'outer', regions: {
    navelPosition: { state: 'exposed', ref: ref('opening', 'worn open at the front') },
  } });
  const result = buildLocalDetailBundle(input)['abdomen-navel'];
  assert.equal(result.coverage.navelPosition, 'covered');
  assert.doesNotMatch(result.text, /diamond/);
});

test('transparent outer surface does not remove opaque inner coverage', () => {
  const input = base();
  input.targets['abdomen-navel'].layers.unshift({ id: 'sheer', regions: {
    navelPosition: { state: 'translucent', ref: ref('sheer', 'translucent layered surface') },
  }, details: [detail('localFabric', 'navelPosition', 'sheer', 'lightweight voile fabric')] });
  const result = buildLocalDetailBundle(input)['abdomen-navel'];
  assert.equal(result.coverage.navelPosition, 'covered');
  assert.match(result.text, /lightweight voile fabric/);
  assert.match(result.text, /opaque mirror-polished latex/);
  assert.doesNotMatch(result.text, /diamond/);
});

test('unknown outer layer blocks lower details instead of guessing exposure', () => {
  const input = base();
  input.targets['abdomen-navel'].layers.unshift({ id: 'unreviewed', regions: {} });
  const result = buildLocalDetailBundle(input)['abdomen-navel'];
  assert.equal(result.status, 'needs-source-review');
  assert.equal(result.text, '');
  assert.equal(result.coverage.navelPosition, 'unknown');
});

test('unknown coverage may retain a confirmed local surface, but never underlying skin', () => {
  const input = base();
  input.targets['abdomen-navel'].layers = [{ id: 'sheer', regions: {},
    details: [detail('localFabric', 'navelPosition', 'sheer', 'lightweight voile fabric')] }];
  const result = buildLocalDetailBundle(input)['abdomen-navel'];
  assert.equal(result.status, 'ready');
  assert.equal(result.coverage.navelPosition, 'unknown');
  assert.match(result.text, /lightweight voile fabric/);
  assert.doesNotMatch(result.text, /diamond/);
  assert.ok(result.diagnostics.length);
});

test('missing layers and empty source do not mean bare skin', () => {
  const input = base();
  input.targets['abdomen-navel'].layers = [];
  assert.equal(buildLocalDetailBundle(input)['abdomen-navel'].text, '');
});

test('explicit exposed region retains only locally permitted source details', () => {
  const result = buildLocalDetailBundle(base()).eyes;
  assert.match(result.text, /bright friendly eyes/);
  assert.doesNotMatch(result.text, /young sweet pretty face/);
  assert.equal(result.coverage.eyes, 'exposed');
});

test('stale coverage evidence cannot expose a region', () => {
  const input = base();
  input.sources.face.en = 'a changed description';
  const result = buildLocalDetailBundle(input).eyes;
  assert.equal(result.text, '');
  assert.equal(result.coverage.eyes, 'unknown');
});

test('disallowed groups and invalid region are not public prompt text', () => {
  const input = base();
  input.targets.eyes.details.push(detail('location', 'eyes', 'opening', 'worn open at the front'));
  input.targets.eyes.details.push(detail('eyeIdentity', 'navelPosition', 'opening', 'worn open at the front'));
  assert.doesNotMatch(buildLocalDetailBundle(input).eyes.text, /worn open/);
});

test('subregion exposure never promotes an entire target to exposed', () => {
  const result = buildLocalDetailBundle(base()).eyes;
  assert.equal(result.coverage.eyes, 'exposed');
  assert.equal(result.coverage.brows, 'unknown');
  assert.equal(result.coverageState, 'mixed');
});

test('duo is absent; unrecognized image type and absent target data are unavailable', () => {
  assert.deepEqual(buildLocalDetailBundle({ ...base(), subjectCount: 2 }), {});
  assert.equal(buildLocalDetailBundle({ ...base(), imageType: 'unknown' }).eyes.text, '');
  assert.equal(buildLocalDetailBundle(base())['collarbone-chest'].status, 'needs-source-review');
});

test('non-photographic image types are not replaced with photography', () => {
  for (const type of ['watercolor-illustration', 'oil-painting', 'fashion-illustration', 'pastel-illustration']) {
    const result = buildLocalDetailBundle({ ...base(), imageType: type }).eyes;
    assert.equal(result.status, 'ready');
    assert.doesNotMatch(result.text, /Photorealistic|portrait|lens|camera/);
  }
});

test('photorealistic local targets open with one explicit Japanese-or-Korean woman', () => {
  const input = base();
  input.targets['collarbone-chest'] = {
    layers: [{ id: 'chest', regions: {
      neckBase: { state: 'exposed', ref: ref('face', 'bright friendly eyes') },
      collarbone: { state: 'exposed', ref: ref('face', 'bright friendly eyes') },
      upperChest: { state: 'exposed', ref: ref('face', 'bright friendly eyes') },
    }, details: [detail('localFabric', 'upperChest', 'cover', 'opaque mirror-polished latex')] }],
    details: [],
  };
  for (const target of ['eyes', 'collarbone-chest', 'abdomen-navel']) {
    const result = buildLocalDetailBundle(input)[target];
    assert.equal(result.status, 'ready');
    assert.match(result.text, /^Photorealistic editorial detail image, A 20s seductive stunning Japanese or Korean woman\./);
  }
});

test('same snapshot is deterministic, immutable and ignores scene, camera, pose and shoes', () => {
  const input = base();
  const before = JSON.stringify(input);
  const result = buildLocalDetailBundle(input);
  assert.deepEqual(result, buildLocalDetailBundle({ ...input,
    scene: 'ocean with wet skin', pose: 'palm covering camera', shoes: 'boots', framing: 'full-body fisheye' }));
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(result, buildLocalDetailBundle(input));
  assert.ok(Object.isFrozen(result.eyes.coverage));
});
