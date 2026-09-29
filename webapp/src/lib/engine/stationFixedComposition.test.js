import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, getSceneDependentOptions, normalizeLocks } from '../engine.js';
import { transitionPage1Locks } from '../../features/page1/lockTransitions.js';
import { isStationFixedSet, fixedSetAllowsLensVariation, stationSubjectFacingText } from './stationFixedComposition.js';
import { validatePromptOutputContract } from './promptOutputContracts.js';
import { buildAllNoneLocks } from '../../features/page1/page1Selectors.js';
import { STATION_POSITION_OPTIONS } from './stationFixedComposition.js';
import { fixedScenePoseLocks, getFixedScenePosition } from './fixedScenePose.js';

test('nine station positions own one canonical pose, preserve facing and lens and restore', () => {
  assert.equal(STATION_POSITION_OPTIONS.length, 9);
  for (const position of STATION_POSITION_OPTIONS) {
    assert.equal(STATION_POSITION_OPTIONS.filter(p => p.setId === position.setId).length, 3);
    for (const lens of ['28mm 廣角', '135mm 長焦壓縮']) {
      for (const orbit of ['正面 0 度', '背面 180 度', '左側 90 度']) {
        const result = generate(position.setId, lens, orbit, { fixedSetPositionId: position.id,
          poseBaseId: 'kneeling', poseHandId: 'selfie-mirror-phone-visible', fixedSetCaptureModeId: 'selfie' });
        for (const text of [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt]) {
          assert.equal(text.split(position.en).length - 1, 1, position.id);
          assert.doesNotMatch(text, /kneeling|selfie/i);
          assert.match(text, /same longitudinal platform axis/);
        }
        for (const extra of result.extraPrompts.filter(p => p.id.includes('chest-up'))) {
          assert.ok(extra.text.includes(position.chestEn), `${position.id}: chest`);
          assert.doesNotMatch(extra.text, /hips supported|hands resting.*lap|relaxed stride/);
        }
        assert.equal(result.selection.poseBaseId, position.baseId);
        assert.equal(result.selection.orbitId, id('orbitId', orbit));
        assert.equal(result.selection.framingId, id('framingId', '全無'));
        const restored = generatePrompts(1, normalizeLocks(JSON.parse(JSON.stringify(result.selection))), [],
          { random: createSeededRandom('station-position-restore') })[0];
        assert.ok(restored.zImagePrompt.includes(position.en));
        assert.doesNotMatch(restored.extraPrompts.find(p => p.id === 'full-body-character').text,
          /waiting bench|platform gates|stopped train|tiled platform wall|canopy column/);
      }
    }
  }
});
test('station takeover is pure and excludes none, foreign scenes and duo', () => {
  const source = { subjectCount: '1', fixedCompositionSetId: 'nyc-subway-bench-platform',
    fixedSetPositionId: 'station-nyc-seated', poseBaseId: 'kneeling', actionPoseCardId: 'saved-card', poseHeadId: 'any' };
  const snapshot = structuredClone(source);
  assert.equal(fixedScenePoseLocks(source).poseBaseId, 'sitting');
  assert.equal(fixedScenePoseLocks(source).actionPoseCardId, '');
  assert.equal(fixedScenePoseLocks(source).poseHeadId, 'any');
  assert.deepEqual(source, snapshot);
  for (const patch of [{ fixedSetPositionId: 'none' }, { fixedCompositionSetId: 'japan-carriage-bench-front' }, { subjectCount: '2' }]) {
    const input = { ...source, ...patch };
    assert.equal(getFixedScenePosition(input), null);
    assert.equal(fixedScenePoseLocks(input), input);
  }
  const foreign = generate('yamanote-platform-advertising', '28mm 廣角', '正面 0 度', { fixedSetPositionId: source.fixedSetPositionId });
  assert.equal(foreign.selection.fixedSetPositionId, 'none');
  assert.equal(foreign.selection.poseBaseId, 'standing');
});
test('station spatial sources retain image-side layout, shared light and stopped Yamanote train', () => {
  const result = generate('yamanote-platform-advertising', '28mm 廣角');
  for (const text of [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt,
    ...result.extraPrompts.filter(p => p.id.includes('chest-up')).map(p => p.text)]) {
    assert.match(text, /stationary silver green-striped train/);
    assert.match(text, /Left and right refer to the image/);
    assert.match(text, /shares its ambient light/);
  }
});

const cases = [
  ['nyc-subway-bench-platform', 'New York subway', 'tracks on the right'],
  ['london-tube-arriving-platform', 'London Underground', 'train on the left'],
  ['yamanote-platform-advertising', 'Yamanote Line', 'train on the right'],
];
const transitSets = [...cases.map(([set]) => set), 'japan-carriage-bench-front', 'japan-carriage-side-aisle', 'japan-carriage-rush-hour'];
test('transit UI keeps manual options and does not clear a selected light on ambient changes', () => {
  for (const set of transitSets) {
    const previousLocks = { ...buildAllNoneLocks(getLockControls(), createEmptyLocks()), subjectCount: '1',
      fixedCompositionSetId: set, lightDirectionId: id('lightDirectionId', '高調亮光') };
    const candidateLocks = { ...previousLocks, lightingId: id('lightingId', '室內低照度暖色夜景') };
    const options = getSceneDependentOptions([], candidateLocks);
    assert.deepEqual(options.lightDirectionOptions, getLockControls().find(c => c.key === 'lightDirectionId').options);
    const result = transitionPage1Locks({ previousLocks, candidateLocks, lockControls: getLockControls() });
    assert.equal(result.lightDirectionId, candidateLocks.lightDirectionId);
    assert.equal(result.lightingId, candidateLocks.lightingId);
  }
});
test('transit random ambient uses actual scene metadata, not the cleared ordinary location', () => {
  const options = getLockControls().find(c => c.key === 'lightingId').options;
  for (const set of transitSets) {
    for (let seed = 0; seed < 24; seed += 1) {
      const result = generatePrompts(1, {
        ...buildAllNoneLocks(getLockControls(), createEmptyLocks()), subjectCount: '1',
        fixedCompositionSetId: set, poseBaseId: 'standing', lightingId: '', lightDirectionId: '',
      }, [], { random: createSeededRandom(`transit-light-${seed}`) })[0];
      const selected = options.find(o => o.id === result.selection.lightingId);
      assert.ok(selected, set);
      if (selected.zh === '全無') continue;
      const tags = selected.meta.tags;
      if (set === 'yamanote-platform-advertising') {
        assert.ok(!tags.includes('ambient_indoor') && !tags.includes('ambient_studio'), selected.zh);
      } else {
        assert.ok(!tags.includes('ambient_outdoor'), selected.zh);
        if (set.startsWith('nyc-') || set.startsWith('london-')) assert.ok(!tags.includes('studio_light'), selected.zh);
      }
    }
  }
});
test('legacy fixed-set compatibility remains while ordinary explicit lighting stays unchanged', () => {
  const lightingId = id('lightingId', '黃昏夕陽');
  const legacy = generate('concrete-wall-chesterfield-sofa', '28mm 廣角', '正面 0 度', { lightingId });
  assert.notEqual(legacy.selection.lightingId, lightingId);
  assert.equal(generate('none', '28mm 廣角', '正面 0 度', { lightingId }).selection.lightingId, lightingId);
});
test('six transit sets preserve explicit ambient and subject lighting across scene-bearing outputs', () => {
  for (const set of transitSets) {
    for (const [ambient, subject, fragment] of [
      ['黃昏夕陽', '暖金黃昏色溫', 'golden'],
      ['藍調傍晚', '霓虹染色光', 'neon'],
      ['室內低照度暖色夜景', '高調亮光', 'high-key'],
    ]) {
      const result = generate(set, '28mm 廣角', '正面 0 度', {
        lightingId: id('lightingId', ambient), lightDirectionId: id('lightDirectionId', subject),
      });
      assert.equal(result.selection.lightingId, id('lightingId', ambient), set);
      assert.equal(result.selection.lightDirectionId, id('lightDirectionId', subject), set);
      for (const text of [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt,
        ...result.extraPrompts.filter(p => p.id.includes('chest-up')).map(p => p.text)]) {
        assert.ok(text.toLowerCase().includes(fragment), `${set}: ${fragment}`);
      }
      const restored = generatePrompts(1, normalizeLocks(JSON.parse(JSON.stringify(result.selection))), [],
        { random: createSeededRandom('transit-light-restore') })[0];
      assert.equal(restored.selection.lightingId, result.selection.lightingId);
      assert.equal(restored.selection.lightDirectionId, result.selection.lightDirectionId);
    }
    const silent = generate(set, '28mm 廣角');
    assert.equal(silent.selection.lightingId, id('lightingId', '全無'));
    assert.equal(silent.selection.lightDirectionId, id('lightDirectionId', '全無'));
    const subjectOnly = generate(set, '28mm 廣角', '正面 0 度', { lightDirectionId: id('lightDirectionId', '霓虹染色光') });
    assert.equal(subjectOnly.selection.lightingId, id('lightingId', '全無'));
    assert.equal(subjectOnly.selection.lightDirectionId, id('lightDirectionId', '霓虹染色光'));
  }
});
const id = (key, zh) => {
  const option = getLockControls().find(c => c.key === key).options.find(o => o.zh === zh);
  assert.ok(option, `${key}: ${zh}`);
  return option.id;
};
test('London scene keeps the existing label and a stationary train in every scene-bearing output', () => {
  const option = getLockControls().find(c => c.key === 'fixedCompositionSetId').options
    .find(o => o.id === 'london-tube-arriving-platform');
  assert.equal(option.zh, '倫敦地鐵列車進站月台');
  for (const lens of ['28mm 廣角', '135mm 長焦壓縮']) {
    const result = generate(option.id, lens);
    const texts = [result.grokPrompt, result.zImagePrompt, result.midjourneyPrompt,
      ...result.extraPrompts.filter(p => p.id.includes('chest-up')).map(p => p.text)];
    for (const text of texts) {
      assert.match(text, /stationary red-and-white Tube train on the left/);
      assert.doesNotMatch(text, /arriving|motion streaks|train-only|moving train/i);
    }
  }
});
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
  for (const set of sets) assert.equal(fixedSetAllowsLensVariation(set), isStationFixedSet(set) || set.setGroupId === 'japanese-carriage');
  for (const angle of getLockControls().find(c => c.key === 'angleId').options.filter(o => o.id && o.zh !== '全無')) {
    const result = generate(cases[2][0], '28mm 廣角', '正面 0 度', { angleId: angle.id });
    assert.equal(result.selection.angleId, angle.id);
    assert.match(result.zImagePrompt, /same longitudinal platform axis/);
  }
});
