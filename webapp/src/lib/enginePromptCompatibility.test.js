import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
  getSceneDependentOptions,
} from './engine.js';

const controls = getLockControls();

function optionId(controlKey, zh) {
  const option = controls.find((control) => control.key === controlKey)?.options.find((item) => item.zh === zh);
  assert.ok(option, `Expected ${zh} in ${controlKey}`);
  return option.id;
}

function createAllNoneLocks() {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const noneOption = control.options?.find((item) => item.zh === '全無' || item.zh === '無額外表情');
    if (noneOption) locks[control.key] = noneOption.id;
  }
  return locks;
}

test('natural salt flats exclude urban night ambience from both the UI pool and random selection', () => {
  const saltFlatLocationId = optionId('locationId', '戶外：白色鹽湖乾裂荒漠');
  const dependentOptions = getSceneDependentOptions([], {
    ...createEmptyLocks(),
    locationId: saltFlatLocationId,
  });
  const lightingLabels = dependentOptions.lightingOptions.map((item) => item.zh);

  assert.ok(!lightingLabels.includes('城市夜間混合光'));
  assert.ok(!lightingLabels.includes('城市高彩度夜色'));

  for (let index = 0; index < 40; index += 1) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      locationId: saltFlatLocationId,
    }, [], {
      random: createSeededRandom(`salt-flat-lighting-${index}`),
    });
    assert.notEqual(prompt.selection.lightingId, optionId('lightingId', '城市夜間混合光'));
    assert.notEqual(prompt.selection.lightingId, optionId('lightingId', '城市高彩度夜色'));
  }
});

test('back-view random head directions exclude camera-facing head controls but explicit locks remain intact', () => {
  const randomLocks = {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
    orbitId: optionId('orbitId', '背面 180 度'),
    poseBaseId: optionId('poseBaseId', '坐姿'),
    poseHeadId: optionId('poseHeadId', '隨機'),
  };
  const incompatibleHeadIds = new Set([
    optionId('poseHeadId', '頭部自然朝向鏡頭'),
    optionId('poseHeadId', '回頭朝向鏡頭'),
    optionId('poseHeadId', '越肩回望'),
    optionId('poseHeadId', '近鏡頭偏轉頭部'),
  ]);

  for (let index = 0; index < 40; index += 1) {
    const [prompt] = generatePrompts(1, randomLocks, [], {
      random: createSeededRandom(`back-view-head-${index}`),
    });
    assert.ok(!incompatibleHeadIds.has(prompt.selection.poseHeadId));
  }

  const explicitHeadId = optionId('poseHeadId', '近鏡頭偏轉頭部');
  const [explicitPrompt] = generatePrompts(1, {
    ...randomLocks,
    poseHeadId: explicitHeadId,
  }, [], {
    random: createSeededRandom('back-view-explicit-head'),
  });
  assert.equal(explicitPrompt.selection.poseHeadId, explicitHeadId);
  assert.match(explicitPrompt.grokPrompt, /head turned slightly off-axis near the lens/i);
});

test('random outerwear opening follows the selected garment fastener while an explicit opening stays user-controlled', () => {
  const denimJacketId = optionId('outerwearId', '丹寧外套');
  const unzipId = optionId('outerwearOpeningId', '不拉拉鍊');

  for (let index = 0; index < 40; index += 1) {
    const [prompt] = generatePrompts(1, {
      ...createAllNoneLocks(),
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      outerwearId: denimJacketId,
      outerwearOpeningId: '',
    }, [], {
      random: createSeededRandom(`denim-opening-${index}`),
    });
    assert.notEqual(prompt.selection.outerwearOpeningId, unzipId);
  }

  const [explicitPrompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outerwearId: denimJacketId,
    outerwearOpeningId: unzipId,
  }, [], {
    random: createSeededRandom('denim-explicit-unzip'),
  });
  assert.equal(explicitPrompt.selection.outerwearOpeningId, unzipId);
  assert.match(explicitPrompt.grokPrompt, /zip-front outerwear left unzipped/i);
});

test('outfit presets with embedded outerwear suppress a random second layer but preserve explicit outerwear overrides', () => {
  const embeddedOuterwearPresetLabels = [
    '套裝：西裝長褲',
    '套裝：秘書短裙',
    '套裝：空服員制服',
    '套裝：醫生診療袍',
    '套裝：粉針織罩衫寬牛仔',
    '套裝：西裝外套蕾絲迷你洋裝',
    '套裝：綁帶針織寬牛仔',
    '套裝：運動外套荷葉七分褲',
    '套裝：白蕾絲長罩衫牛仔褲',
  ];
  const outdoorBaseLocks = {
    ...createEmptyLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    locationId: optionId('locationId', '戶外：金色海灘與浪線'),
    outerwearId: '',
    outerwearFitId: '',
    outerwearPatternId: '',
    outerwearOpeningId: '',
    outerwearStylingId: '',
  };

  embeddedOuterwearPresetLabels.forEach((label) => {
    const presetId = optionId('outfitPresetId', label);
    const preset = controls.find((control) => control.key === 'outfitPresetId')?.options.find((item) => item.id === presetId);
    assert.equal(preset?.meta?.embeddedOuterwear, true, `${label} must declare its embedded outer layer`);

    for (let index = 0; index < 24; index += 1) {
      const [prompt] = generatePrompts(1, {
        ...outdoorBaseLocks,
        outfitPresetId: presetId,
      }, [], {
        random: createSeededRandom(`embedded-outerwear-${label}-${index}`),
      });
      assert.equal(prompt.selection.outerwearId, '', `${label} should not receive a random second outerwear layer`);
    }
  });

  const unlayeredPresetId = optionId('outfitPresetId', '套裝：拼接掛脖長背心漆皮短褲');
  const [unlayeredPrompt] = generatePrompts(1, {
    ...outdoorBaseLocks,
    outfitPresetId: unlayeredPresetId,
  }, [], {
    random: createSeededRandom('embedded-outerwear-1'),
  });
  assert.notEqual(unlayeredPrompt.selection.outerwearId, '', 'presets without an embedded layer retain random outerwear behavior');

  const [explicitPrompt] = generatePrompts(1, {
    ...outdoorBaseLocks,
    outfitPresetId: optionId('outfitPresetId', '套裝：西裝外套蕾絲迷你洋裝'),
    outerwearId: optionId('outerwearId', '龐克皮衣'),
  }, [], {
    random: createSeededRandom('embedded-outerwear-explicit-override'),
  });
  assert.equal(explicitPrompt.selection.outerwearId, optionId('outerwearId', '龐克皮衣'));
  assert.match(explicitPrompt.grokPrompt, /navy oversized blazer/i);
  assert.match(explicitPrompt.grokPrompt, /punk leather jacket/i);
});

test('random optical effects avoid global diffusion with high-acutance black levels while an explicit effect stays intact', () => {
  const highAcutanceFilmId = optionId('filmId', '高銳利快照黑位');
  const incompatibleEffectIds = new Set([
    optionId('opticalEffectId', '柔焦濾鏡 Soft Focus'),
    optionId('opticalEffectId', '光學朦朧薄霧'),
  ]);

  for (let index = 0; index < 40; index += 1) {
    const [prompt] = generatePrompts(1, {
      ...createAllNoneLocks(),
      filmId: highAcutanceFilmId,
      opticalEffectId: '',
    }, [], {
      random: createSeededRandom(`high-acutance-effect-${index}`),
    });
    assert.ok(!incompatibleEffectIds.has(prompt.selection.opticalEffectId));
  }

  const mistId = optionId('opticalEffectId', '光學朦朧薄霧');
  const [explicitPrompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    filmId: highAcutanceFilmId,
    opticalEffectId: mistId,
  }, [], {
    random: createSeededRandom('high-acutance-explicit-mist'),
  });
  assert.equal(explicitPrompt.selection.opticalEffectId, mistId);
  assert.match(explicitPrompt.grokPrompt, /lens-only mist-filter haze/i);
});

test('AI keeps the selected outerwear and lighting while the medium crop anchors lower garments at its edge', () => {
  const [prompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '中景鏡頭 (Medium Shot)'),
    outfitPresetId: optionId('outfitPresetId', '套裝：拼接掛脖長背心漆皮短褲'),
    outfitPresetPrimaryColorId: optionId('outfitPresetPrimaryColorId', '鵝黃色'),
    outerwearId: optionId('outerwearId', '丹寧外套'),
    outerwearColorId: optionId('outerwearColorId', '鵝黃色'),
    outerwearFitId: optionId('outerwearFitId', '合身'),
    outerwearOpeningId: optionId('outerwearOpeningId', '敞開穿'),
    locationId: optionId('locationId', '戶外：白色鹽湖乾裂荒漠'),
    lightingId: optionId('lightingId', '月光夜色'),
    lightDirectionId: optionId('lightDirectionId', '低光高反差'),
  }, [], {
    random: createSeededRandom('ai-visible-outerwear-and-lighting'),
  });

  assert.match(prompt.grokPrompt, /patchwork halter scarf top with a long pointed draped hem/i);
  assert.match(prompt.grokPrompt, /glossy micro shorts at the lower crop edge/i);
  assert.doesNotMatch(prompt.grokPrompt, /controlled by the outfit color selection/i);
  assert.match(prompt.midjourneyPrompt, /denim jacket/i);
  assert.match(prompt.midjourneyPrompt, /moonlit night environment/i);
  assert.match(prompt.midjourneyPrompt, /low-key subject lighting/i);
  assert.match(prompt.midjourneyPrompt, /glossy micro shorts at the lower crop edge/i);
});
