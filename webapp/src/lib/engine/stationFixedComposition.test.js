import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../engine.js';
import { isStationFixedSet, fixedSetAllowsLensVariation, stationSubjectFacingText } from './stationFixedComposition.js';
import { validatePromptOutputContract } from './promptOutputContracts.js';
import { buildAllNoneLocks } from '../../features/page1/page1Selectors.js';

const cases = [
  ['nyc-subway-bench-platform', 'New York subway', 'tracks on the right'],
  ['london-tube-arriving-platform', 'London Underground', 'train on the left'],
  ['yamanote-platform-advertising', 'Yamanote Line', 'train on the right'],
];
const id = (key, zh) => {
  const option = getLockControls().find(c => c.key === key).options.find(o => o.zh === zh);
  assert.ok(option, `${key}: ${zh}`);
  return option.id;
};
function generate(setId, lens, orbit = '背面 180 度', overrides = {}) {
  return generatePrompts(1, {
    ...buildAllNoneLocks(getLockControls(), createEmptyLocks()), subjectCount: '1', fixedCompositionSetId: setId,
    topId: id('topId', '短袖上衣'), pantsId: id('pantsId', '直筒牛仔褲'),
    fixedSetCaptureModeId: 'none', fixedSetPerformanceStateId: 'none',
    poseBaseId: 'standing', poseArrangementId: 'any', poseHandId: 'none', poseHeadId: 'none',
    angleId: id('angleId', '平視高度鏡頭'), orbitId: id('orbitId', orbit),
    lensId: id('lensId', lens), ...overrides,
  }, [], { random: createSeededRandom('station-fixed-v1') })[0];
}
for (const [setId, name, layout] of cases) {
  test(`${setId}: source layout and subject facing survive wide and telephoto outputs`, () => {
    for (const lens of ['28mm 廣角', '135mm 長焦壓縮']) {
      const result = generate(setId, lens);
      assert.equal(result.selection.fixedCompositionSetId, setId);
      assert.equal(result.selection.lensId, id('lensId', lens));
      for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
        const text = result[field];
        assert.ok(text.includes(name), `${field}: station identity`);
        assert.ok(text.includes(layout), `${field}: layout`);
        assert.match(text, /Her back faces the lens/);
        assert.match(text, /same longitudinal platform axis/);
        assert.match(text, lens.startsWith('28') ? /28mm.*wide.*perspective/i : /135mm.*compression/i);
        if (field === 'midjourneyPrompt' && lens.startsWith('135')) {
          assert.equal(text.match(/narrow field of view/gi)?.length, 1);
        }
        assert.doesNotMatch(text, /camera orbit|viewpoint around|selected room architecture/i);
        assert.deepEqual(validatePromptOutputContract(field, text), []);
      }
      for (const extra of result.extraPrompts.filter(p => p.id.includes('chest-up'))) {
        assert.ok(extra.text.includes(name));
        assert.match(extra.text, /same longitudinal platform axis/);
      }
      assert.doesNotMatch(result.extraPrompts.find(p => p.id === 'full-body-character').text, /subway|Underground|Yamanote|platform axis/i);
    }
  });
}
test('legacy fixed sets still suppress selected lens and ordinary scenes retain it', () => {
  const legacy = generate('concrete-wall-chesterfield-sofa', '135mm 長焦壓縮');
  assert.equal(legacy.selection.lensId, id('lensId', '全無'));
  assert.doesNotMatch(legacy.zImagePrompt, /135mm/);
  const ordinary = generate('none', '28mm 廣角');
  assert.equal(ordinary.selection.lensId, id('lensId', '28mm 廣角'));
});
test('eight body facings do not exchange the station sides or canonical pose', () => {
  const orbits = getLockControls().find(c => c.key === 'orbitId').options.filter(o => /^(正面|左前|左側|左後|背面|右後|右側|右前)/.test(o.zh));
  assert.equal(orbits.length, 8);
  for (const [setId, , layout] of cases) for (const orbit of orbits) {
    const result = generate(setId, '28mm 廣角', orbit.zh);
    const facing = stationSubjectFacingText(orbit);
    for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
      assert.ok(result[field].includes(facing));
      assert.equal(result[field].split(facing).length - 1, 1);
      assert.ok(result[field].includes(layout));
      assert.doesNotMatch(result[field], /Photographed from the woman's|Photographed directly from behind/);
    }
    const canonical = result.grokPrompt.match(/Pose and Composition:\n([^\n]+)/)?.[1];
    assert.ok(canonical);
    assert.ok(result.zImagePrompt.includes(canonical));
    assert.ok(result.midjourneyPrompt.includes(canonical));
  }
});
test('same resolved station selections regenerate after JSON restore without a lens reset', () => {
  const original = generate(cases[0][0], '135mm 長焦壓縮');
  const restoredLocks = normalizeLocks(JSON.parse(JSON.stringify(original.selection)));
  const restored = generatePrompts(1, restoredLocks, [], { random: createSeededRandom('station-restore-v1') })[0];
  for (const key of ['fixedCompositionSetId', 'lensId', 'angleId', 'orbitId']) {
    assert.equal(restored.selection[key], original.selection[key]);
  }
  for (const key of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
    assert.match(restored[key], /New York subway/);
    assert.match(restored[key], /tracks on the right/);
    assert.match(restored[key], /same longitudinal platform axis/);
    assert.match(restored[key], /Her back faces the lens/);
    assert.match(restored[key], /135mm long telephoto lens/);
  }
});
test('lens permission is opt-in and camera heights remain independently selectable', () => {
  const sets = getLockControls().find(c => c.key === 'fixedCompositionSetId').options;
  for (const set of sets) assert.equal(fixedSetAllowsLensVariation(set), isStationFixedSet(set));
  for (const angle of getLockControls().find(c => c.key === 'angleId').options.filter(o => o.id && o.zh !== '全無')) {
    const result = generate(cases[2][0], '28mm 廣角', '正面 0 度', { angleId: angle.id });
    assert.equal(result.selection.angleId, angle.id);
    assert.match(result.zImagePrompt, /same longitudinal platform axis/);
  }
});
