import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
  getSceneDependentOptions,
  normalizeLocks,
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
  const halfZipId = optionId('outerwearOpeningId', '拉鏈拉一半');

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
    assert.notEqual(prompt.selection.outerwearOpeningId, halfZipId);
  }

  const [explicitPrompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outerwearId: denimJacketId,
    outerwearOpeningId: halfZipId,
  }, [], {
    random: createSeededRandom('denim-explicit-unzip'),
  });
  assert.equal(explicitPrompt.selection.outerwearOpeningId, halfZipId);
  assert.match(explicitPrompt.grokPrompt, /zip-front outerwear partially zipped/i);
});

test('outerwear opening options expose the new closure states and migrate old saved ids', () => {
  const openingControl = controls.find((control) => control.key === 'outerwearOpeningId');
  assert.deepEqual(
    openingControl.options.map((option) => option.zh),
    ['正常', '扣子扣一半', '拉鏈拉一半', '敞開穿'],
  );

  const legacyOpeningIds = [
    ['全無', '正常'],
    ['敞開穿', '敞開穿'],
    ['不扣扣子', '扣子扣一半'],
    ['不拉拉鍊', '拉鏈拉一半'],
  ];
  legacyOpeningIds.forEach(([legacyLabel, currentLabel], index) => {
    const legacyId = `wardrobe:外套開合-outerwear-opening:${legacyLabel}:${index}`;
    assert.equal(normalizeLocks({ outerwearOpeningId: legacyId }).outerwearOpeningId, optionId('outerwearOpeningId', currentLabel));
  });
});

test('renamed hooded outerwear options migrate both current and historical saved ids', () => {
  const regularHoodieId = optionId('outerwearId', '連帽外套');
  const hoodUpHoodieId = optionId('outerwearId', '連帽外套_戴');

  assert.equal(
    normalizeLocks({ outerwearId: 'wardrobe:外套-outerwear:運動連帽外套:2' }).outerwearId,
    regularHoodieId,
  );
  assert.equal(
    normalizeLocks({ outerwearId: 'wardrobe:外套-outerwear:連帽拉鍊外套:9' }).outerwearId,
    hoodUpHoodieId,
  );
  assert.equal(
    normalizeLocks({ outerwearId: 'wardrobe:外套-outerwear:連帽拉鍊外套-不拉拉鍊:9' }).outerwearId,
    hoodUpHoodieId,
  );
});

test('outerwear styling replaces the old slipped-shoulder option with explicit shoulder exposure and migrates old ids', () => {
  const stylingControl = controls.find((control) => control.key === 'outerwearStylingId');
  assert.deepEqual(
    stylingControl.options.map((option) => option.zh),
    ['全無', '正常穿著', '單肩露出', '雙肩露出'],
  );

  const legacyId = 'wardrobe:外套穿法-outerwear-styling:滑落肩部:2';
  assert.equal(
    normalizeLocks({ outerwearStylingId: legacyId }).outerwearStylingId,
    optionId('outerwearStylingId', '單肩露出'),
  );
});

test('formal longline shirt is treated as button-front outerwear for opening randomization', () => {
  const longlineShirtId = optionId('outerwearId', '長版襯衫');
  const halfButtonId = optionId('outerwearOpeningId', '扣子扣一半');
  const halfZipId = optionId('outerwearOpeningId', '拉鏈拉一半');

  for (let index = 0; index < 40; index += 1) {
    const [prompt] = generatePrompts(1, {
      ...createAllNoneLocks(),
      subjectCount: '1',
      framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
      outerwearId: longlineShirtId,
      outerwearOpeningId: '',
    }, [], {
      random: createSeededRandom(`longline-shirt-opening-${index}`),
    });
    assert.notEqual(prompt.selection.outerwearOpeningId, halfZipId);
  }

  const [explicitPrompt] = generatePrompts(1, {
    ...createAllNoneLocks(),
    subjectCount: '1',
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    outerwearId: longlineShirtId,
    outerwearOpeningId: halfButtonId,
  });
  assert.equal(explicitPrompt.selection.outerwearOpeningId, halfButtonId);
  assert.match(explicitPrompt.grokPrompt, /button-front outerwear partially buttoned/i);
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
