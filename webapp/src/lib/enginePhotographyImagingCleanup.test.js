import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildPhotographyStylePrompt,
  createEmptyLocks,
  generatePrompts,
  getLockControls,
  isWormEyeAngleId,
  normalizeLocks,
  sanitizeLocksForCloseupMode,
} from './engine.js';

function control(key) {
  const entry = getLockControls().find((item) => item.key === key);
  assert.ok(entry, `Missing control ${key}`);
  return entry;
}

function optionByLabel(key, label) {
  const option = control(key).options.find((item) => item.zh === label);
  assert.ok(option, `Missing option ${label} in ${key}`);
  return option;
}

function optionById(key, id) {
  const option = control(key).options.find((item) => item.id === id);
  assert.ok(option, `Missing option id ${id} in ${key}`);
  return option;
}

function options(key) {
  return control(key).options;
}

test('composition and angle prompts stay geometric instead of emotional', () => {
  const cameraGeometryOptions = [
    ...options('framingId'),
    ...options('angleId'),
    ...options('orbitId'),
  ].filter((item) => item.zh !== '全無');

  for (const option of cameraGeometryOptions) {
    assert.doesNotMatch(
      option.en,
      /heroic|dominance|vulnerable|cute|dynamic pose|unsettling|cinematic tension/i,
      `${option.zh} should describe camera geometry instead of subject mood`
    );
  }

  assert.match(optionByLabel('angleId', '地面高度鏡頭').en, /floor-level camera position/);
  assert.match(optionByLabel('angleId', '蟲眼視角鏡頭').en, /ultra-low upward camera/);
  assert.doesNotMatch(optionByLabel('angleId', '蟲眼視角鏡頭').en, /ultra-wide lens perspective/);
  assert.doesNotMatch(optionByLabel('angleId', '蟲眼視角鏡頭').en, /feet extremely close to the lens/);
  assert.match(optionByLabel('angleId', '高位俯視鏡頭').en, /looking downward/);
});

test('framing options are ordered from closest face crop to full body with legacy migration', () => {
  assert.deepEqual(
    options('framingId').map((item) => item.zh),
    [
      '全無',
      '半臉傾斜特寫',
      '局部五官特寫',
      '臉部特寫',
      '特寫鏡頭 (Close-Up)',
      '胸上特寫',
      '中景鏡頭 (Medium Shot)',
      '牛仔中景 (Cowboy Shot)',
      '全身鏡頭 (Full Body Shot)',
    ]
  );

  const optimizedFramingPrompts = {
    '半臉傾斜特寫': 'asymmetrical half-face close-up, off-center crop, slight tilted frame',
    '局部五官特寫': 'tight facial-detail close-up, cropped eyes and upper face, partial-feature framing',
    '臉部特寫': 'tight facial close-up, face dominant in frame, minimal headroom',
    '特寫鏡頭 (Close-Up)': 'head and shoulders close-up, tight portrait crop',
    '胸上特寫': 'tight bust-up portrait, chest-up framing, shoulders and torso visible',
    '中景鏡頭 (Medium Shot)': 'medium shot, waist up framing, moderate background presence',
    '牛仔中景 (Cowboy Shot)': 'cowboy shot, knee up figure framing, readable outfit proportions',
    '全身鏡頭 (Full Body Shot)': 'full body shot, head-to-toe figure, environmental scale',
  };

  for (const [label, expectedPrompt] of Object.entries(optimizedFramingPrompts)) {
    const framing = optionByLabel('framingId', label);
    assert.equal(framing.en, expectedPrompt);
    assert.ok(
      framing.en.split(/\s+/).filter(Boolean).length <= 10,
      `${label} should keep framing prompt compact`
    );
    assert.doesNotMatch(
      framing.en,
      /strong visual tension|natural subject presence|detailed facial features|balanced proportions|clean frontal readability|wide framing/i
    );
  }

  assert.equal(
    optionById('framingId', normalizeLocks({
      ...createEmptyLocks(),
      framingId: 'camera:景別構圖-framing:特寫鏡頭-close-up:1',
    }).framingId).zh,
    '特寫鏡頭 (Close-Up)'
  );
  assert.equal(
    optionById('framingId', normalizeLocks({
      ...createEmptyLocks(),
      framingId: 'camera:景別構圖-framing:半臉傾斜特寫:5',
    }).framingId).zh,
    '半臉傾斜特寫'
  );
});

test('worm-eye angle forces photography style and lens optics to none', () => {
  const controls = getLockControls();
  const wormEye = optionByLabel('angleId', '蟲眼視角鏡頭');
  const style = optionByLabel('styleId', '艾倫・馮・昂沃斯｜俏皮抓拍雜誌');
  const lens = optionByLabel('lensId', '105mm 中長焦');
  const opticalEffect = optionByLabel('opticalEffectId', '前景遮擋散景');
  const noneStyle = optionByLabel('styleId', '全無');
  const noneLens = optionByLabel('lensId', '全無');
  const noneOpticalEffect = optionByLabel('opticalEffectId', '全無');

  assert.equal(isWormEyeAngleId(wormEye.id), true);

  const sanitized = sanitizeLocksForCloseupMode({
    ...createEmptyLocks(),
    angleId: wormEye.id,
    styleId: style.id,
    lensId: lens.id,
    opticalEffectId: opticalEffect.id,
  }, controls);

  assert.equal(sanitized.styleId, noneStyle.id);
  assert.equal(sanitized.lensId, noneLens.id);
  assert.equal(sanitized.opticalEffectId, noneOpticalEffect.id);

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    angleId: wormEye.id,
    styleId: style.id,
    lensId: lens.id,
    opticalEffectId: opticalEffect.id,
  });

  assert.equal(prompt.selection.styleId, noneStyle.id);
  assert.equal(prompt.selection.lensId, noneLens.id);
  assert.equal(prompt.selection.opticalEffectId, noneOpticalEffect.id);
  assert.match(prompt.grokPrompt, /worm's-eye view/);
  assert.doesNotMatch(prompt.grokPrompt, /Inspired by Ellen von Unwerth/);
  assert.doesNotMatch(prompt.grokPrompt, /105mm medium telephoto lens/);
  assert.doesNotMatch(prompt.grokPrompt, /blurred foreground occlusion near the lens/);
});

test('camera angle control uses height-based definitions with legacy lock migration', () => {
  const angleLabels = options('angleId').map((item) => item.zh);

  assert.deepEqual(angleLabels, [
    '全無',
    '高位俯視鏡頭',
    '平視高度鏡頭',
    '肩部高度鏡頭',
    '腰部高度鏡頭',
    '膝蓋高度鏡頭',
    '地面高度鏡頭',
    '蟲眼視角鏡頭',
    '鳥瞰視角',
    '正上方俯視鏡頭',
    '荷蘭角/傾斜 (Dutch Angle)',
  ]);

  assert.ok(!angleLabels.includes('平視角 (Eye-Level Angle)'));
  assert.ok(!angleLabels.includes('仰角 (Low Angle)'));
  assert.ok(!angleLabels.includes('俯角 (High Angle)'));

  const oldEyeLevel = 'camera:相機視角-angle:平視角-eye-level-angle:1';
  const oldLowAngle = 'camera:相機視角-angle:仰角-low-angle:6';
  const oldHighAngle = 'camera:相機視角-angle:俯角-high-angle:7';
  const oldGroundLevel = 'camera:相機視角-angle:地面高度鏡頭:5';

  assert.equal(optionById('angleId', normalizeLocks({ ...createEmptyLocks(), angleId: oldEyeLevel }).angleId).zh, '平視高度鏡頭');
  assert.equal(optionById('angleId', normalizeLocks({ ...createEmptyLocks(), angleId: oldLowAngle }).angleId).zh, '地面高度鏡頭');
  assert.equal(optionById('angleId', normalizeLocks({ ...createEmptyLocks(), angleId: oldHighAngle }).angleId).zh, '高位俯視鏡頭');
  assert.equal(optionById('angleId', normalizeLocks({ ...createEmptyLocks(), angleId: oldGroundLevel }).angleId).zh, '地面高度鏡頭');

  assert.ok(!optionByLabel('angleId', '高位俯視鏡頭').meta.tags.includes('aerial'));
  assert.ok(optionByLabel('angleId', '鳥瞰視角').meta.tags.includes('aerial'));

  const optimizedAnglePrompts = {
    '高位俯視鏡頭': 'high camera position, looking downward, visible top planes',
    '平視高度鏡頭': 'eye-height camera, level perspective, neutral portrait view',
    '肩部高度鏡頭': 'shoulder-level camera, level lens axis, upper-body portrait height',
    '腰部高度鏡頭': 'waist-level camera, level lens axis, grounded portrait height',
    '膝蓋高度鏡頭': 'knee-level camera, level lens axis, legs and shoes emphasized',
    '地面高度鏡頭': 'floor-level camera position, upward view, elongated full-body perspective',
    '蟲眼視角鏡頭': "worm's-eye view, ultra-low upward camera, strong near-far scale distortion",
    '鳥瞰視角': "bird's-eye view, elevated overhead camera, small figure in surrounding space",
    '正上方俯視鏡頭': 'top-down view, camera directly above, flattened graphic composition',
    '荷蘭角/傾斜 (Dutch Angle)': 'dutch angle, diagonal horizon, tilted frame geometry',
  };

  for (const [label, expectedPrompt] of Object.entries(optimizedAnglePrompts)) {
    const angle = optionByLabel('angleId', label);
    assert.equal(angle.en, expectedPrompt);
    assert.ok(
      angle.en.split(/\s+/).filter(Boolean).length <= 10,
      `${label} should keep angle prompt compact`
    );
    assert.doesNotMatch(
      angle.en,
      /neutral stable|natural perspective|intense spatial impact|ultra-wide lens|elevated portrait viewpoint|grounded fashion/i
    );
  }
});

test('duo angle overrides stay geometric after angle cleanup', () => {
  const dutchAngle = optionByLabel('angleId', '荷蘭角/傾斜 (Dutch Angle)');
  const prompt = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    angleId: dutchAngle.id,
  })[0].grokPrompt;

  assert.doesNotMatch(prompt, /dominant|cinematic tension/i);
  assert.match(prompt, /dutch angle, diagonal horizon, tilted two-subject frame/);

  const wormEye = optionByLabel('angleId', '蟲眼視角鏡頭');
  const wormEyePrompt = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    angleId: wormEye.id,
  })[0].grokPrompt;

  assert.match(wormEyePrompt, /ultra-low upward camera/);
  assert.doesNotMatch(wormEyePrompt, /ultra-wide lens perspective/);
  assert.doesNotMatch(wormEyePrompt, /feet extremely close to the lens/);

  const birdEye = optionByLabel('angleId', '鳥瞰視角');
  const birdEyePrompt = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    angleId: birdEye.id,
  })[0].grokPrompt;

  assert.match(birdEyePrompt, /elevated bird's-eye duo view/);
  assert.doesNotMatch(birdEyePrompt, /small figure against the surrounding space/i);
});

test('orbit control uses degree-based body orientation with legacy lock migration', () => {
  const orbitLabels = options('orbitId').map((item) => item.zh);

  assert.deepEqual(orbitLabels, [
    '全無',
    '正面 0 度',
    '左前 45 度',
    '左側 90 度',
    '左後 135 度',
    '背面 180 度',
    '右後 225 度',
    '右側 270 度',
    '右前 315 度',
  ]);

  assert.ok(!orbitLabels.includes('左前斜側'));
  assert.ok(!orbitLabels.includes('左後斜側'));
  assert.ok(!orbitLabels.includes('右後斜側'));
  assert.ok(!orbitLabels.includes('右前斜側'));

  const oldFront = 'camera:拍攝方位-orbit-angle:正面:1';
  const oldLeftFront = 'camera:拍攝方位-orbit-angle:左前斜側:2';
  const oldLeftSide = 'camera:拍攝方位-orbit-angle:左側:3';
  const oldLeftRear = 'camera:拍攝方位-orbit-angle:左後斜側:4';
  const oldBack = 'camera:拍攝方位-orbit-angle:背面:5';
  const oldRightRear = 'camera:拍攝方位-orbit-angle:右後斜側:6';
  const oldRightSide = 'camera:拍攝方位-orbit-angle:右側:7';
  const oldRightFront = 'camera:拍攝方位-orbit-angle:右前斜側:8';

  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldFront }).orbitId).zh, '正面 0 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldLeftFront }).orbitId).zh, '左前 45 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldLeftSide }).orbitId).zh, '左側 90 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldLeftRear }).orbitId).zh, '左後 135 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldBack }).orbitId).zh, '背面 180 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldRightRear }).orbitId).zh, '右後 225 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldRightSide }).orbitId).zh, '右側 270 度');
  assert.equal(optionById('orbitId', normalizeLocks({ ...createEmptyLocks(), orbitId: oldRightFront }).orbitId).zh, '右前 315 度');

  const backView = optionByLabel('orbitId', '背面 180 度');
  assert.match(backView.en, /180-degree rear view/);
  assert.match(backView.en, /rear-facing torso/);
  assert.doesNotMatch(backView.en, /no frontal face visible/i);

  const optimizedOrbitPrompts = {
    '正面 0 度': '0-degree front view, frontal torso toward camera',
    '左前 45 度': '45-degree front-left view, front three-quarter torso angle',
    '左側 90 度': '90-degree left profile view, lateral torso orientation',
    '左後 135 度': '135-degree rear-left view, torso stays rear-facing if head turns',
    '背面 180 度': '180-degree rear view, back to camera, rear-facing torso, head may turn',
    '右後 225 度': '225-degree rear-right view, torso stays rear-facing if head turns',
    '右側 270 度': '270-degree right profile view, lateral torso orientation',
    '右前 315 度': '315-degree front-right view, front three-quarter torso angle',
  };

  for (const [label, expectedPrompt] of Object.entries(optimizedOrbitPrompts)) {
    const orbit = optionByLabel('orbitId', label);
    assert.equal(orbit.en, expectedPrompt);
    assert.ok(
      orbit.en.split(/\s+/).filter(Boolean).length <= 11,
      `${label} should keep orbit prompt compact`
    );
    assert.doesNotMatch(
      orbit.en,
      /camera positioned|subject's|body remains|frontal torso orientation|lateral torso orientation, lateral/i
    );
  }
});

test('duo orbit overrides use compact current degree labels', () => {
  const rightFront = optionByLabel('orbitId', '右前 315 度');
  const prompt = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    orbitId: rightFront.id,
  })[0].grokPrompt;

  assert.match(prompt, /315-degree front-right duo view, both torsos angled forward/);
  assert.doesNotMatch(prompt, /正面 315 度/);
  assert.doesNotMatch(prompt, /camera at the duo front-right/);

  const backView = optionByLabel('orbitId', '背面 180 度');
  const backPrompt = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    orbitId: backView.id,
  })[0].grokPrompt;

  assert.match(backPrompt, /180-degree rear duo view, backs to camera, torsos rear-facing/);
  assert.doesNotMatch(backPrompt, /bodies remain rear-facing if heads turn/);
});

test('imaging control exposes rendering and color-grade looks without camera body profiles', () => {
  const filmControl = control('filmId');
  assert.equal(filmControl.label, '成像模擬 / 調色');

  const labels = filmControl.options.map((item) => item.zh);
  assert.ok(!labels.some((label) => label.startsWith('相機｜')));
  assert.ok(labels.includes('Leica 風格鹽粒黑白'));
  assert.ok(labels.includes('手機 HDR 直出'));
  assert.ok(labels.includes('Y2K CCD 低清快照'));
  assert.ok(labels.includes('復古 CCD 晃動快照'));
  assert.ok(labels.includes('日系亮膚高彩濾鏡'));
  assert.ok(labels.includes('日系清透淡彩濾鏡'));
  assert.ok(labels.includes('日系高曝光奶油膚色'));
  assert.ok(labels.includes('日系夜景亮膚霓虹'));
  assert.ok(labels.includes('日系雜誌高彩銳利'));
  assert.ok(labels.includes('日系柔霧亮膚'));
  assert.ok(labels.includes('跨沖霓虹剪影濾鏡'));
  assert.ok(labels.includes('高銳利快照黑位'));
  assert.ok(!labels.includes('韓系冷白亮膚濾鏡'));
  assert.ok(!labels.includes('Ricoh GR 街頭快照感'));

  const leicaMono = optionByLabel('filmId', 'Leica 風格鹽粒黑白');
  assert.match(leicaMono.en, /salt-and-pepper grain/);
  assert.match(leicaMono.en, /rich grayscale separation/);

  const renderingLook = optionByLabel('filmId', '高銳利快照黑位');
  assert.doesNotMatch(renderingLook.en, /Ricoh GR/i);
  assert.match(renderingLook.en, /high-acutance snapshot rendering/);
  assert.ok(
    renderingLook.legacyIds.some((id) => id.includes('ricoh-gr-街頭快照感')),
    'renamed rendering look should keep the old lock id'
  );

  const nightFilter = optionByLabel('filmId', '日系夜景亮膚霓虹');
  assert.match(nightFilter.en, /neon-tinted Japanese portrait color grade/);
  assert.match(nightFilter.en, /warm-magenta highlights/);

  const neonCrossProcess = optionByLabel('filmId', '跨沖霓虹剪影濾鏡');
  assert.match(neonCrossProcess.en, /neon cross-processed rendering/);
  assert.match(neonCrossProcess.en, /aggressively crushed black levels/);
  assert.match(neonCrossProcess.en, /cold porcelain highlights/);

  const y2kDigicam = optionByLabel('filmId', 'Y2K CCD 低清快照');
  assert.match(y2kDigicam.en, /early-2000s compact-digital rendering/);
  assert.match(y2kDigicam.en, /low-resolution CCD softness/);
  assert.match(y2kDigicam.en, /on-camera flash glare/);
  assert.match(y2kDigicam.en, /magenta-green color cast/);
  assert.match(y2kDigicam.en, /blocky JPEG artifacts/);

  const shakyCcd = optionByLabel('filmId', '復古 CCD 晃動快照');
  assert.match(shakyCcd.en, /retro CCD failure-snapshot rendering/);
  assert.match(shakyCcd.en, /heavy motion smear/);
  assert.match(shakyCcd.en, /purple edge fringing/);
  assert.match(shakyCcd.en, /banded gradients/);
});

test('legacy camera profile locks migrate into rendering looks', () => {
  assert.equal(
    optionById('filmId', normalizeLocks({ ...createEmptyLocks(), filmId: 'ricoh-gr-snapshot' }).filmId).zh,
    '高銳利快照黑位'
  );
  assert.equal(
    optionById('filmId', normalizeLocks({ ...createEmptyLocks(), filmId: 'fujifilm-x100' }).filmId).zh,
    '富士 Provia 清透明亮'
  );
  assert.equal(
    optionById('filmId', normalizeLocks({ ...createEmptyLocks(), cameraSystemId: 'smartphone-documentary' }).filmId).zh,
    '手機 HDR 直出'
  );
  assert.equal(
    optionById(
      'filmId',
      normalizeLocks({
        ...createEmptyLocks(),
        filmId: 'camera:底片與相機模擬-camera-film-simulation:韓系冷白亮膚濾鏡:23',
      }).filmId
    ).zh,
    '日系高曝光奶油膚色'
  );
});

test('lens and optical effects stay concise while foreground occlusion still blocks part of the frame', () => {
  for (const option of options('lensId').filter((item) => item.zh !== '全無')) {
    const wordCount = option.en.split(/\s+/).filter(Boolean).length;
    assert.ok(wordCount <= 24, `${option.zh} should stay compact`);
  }

  assert.deepEqual(
    options('opticalEffectId').map((item) => item.zh),
    [
      '全無',
      '重散景光斑',
      '旋渦散景 Swirly Bokeh',
      '貓眼散景 Cat-eye Bokeh',
      '肥皂泡散景 Soap-bubble Bokeh',
      '前景遮擋散景',
      '玻璃前景折射',
      '稜鏡折射 Prism Refraction',
      '星芒光圈 Starburst',
      '鏡頭光斑 Lens Flare',
      '變形鏡頭光斑 Anamorphic Flare',
      '局部炫光霧面反差',
      '漏光效果 Light Leaks',
      '柔焦濾鏡 Soft Focus',
      '霧化高光 Bloom',
      '暗角 Vignette',
      '色差 Chromatic Aberration',
      '邊緣模糊',
      '中央清晰邊緣拉抹',
      '光學朦朧薄霧',
    ]
  );
  assert.ok(!options('opticalEffectId').some((item) => item.zh === '淺景深'));
  assert.ok(!options('opticalEffectId').some((item) => item.zh === '極淺景深'));

  const swirlyBokeh = optionByLabel('opticalEffectId', '旋渦散景 Swirly Bokeh');
  assert.match(swirlyBokeh.en, /swirly bokeh rendering/);
  assert.match(swirlyBokeh.en, /rotational peripheral blur/);

  const prismRefraction = optionByLabel('opticalEffectId', '稜鏡折射 Prism Refraction');
  assert.match(prismRefraction.en, /split-image fragments/);
  assert.match(prismRefraction.en, /rainbow spectral streaks/);

  const starburst = optionByLabel('opticalEffectId', '星芒光圈 Starburst');
  assert.match(starburst.en, /diffraction spikes/);
  assert.match(starburst.en, /multi-point highlight stars/);

  const foregroundOcclusion = optionByLabel('opticalEffectId', '前景遮擋散景');
  assert.match(foregroundOcclusion.en, /meaningful partial frame coverage/);
  assert.match(foregroundOcclusion.en, /thick near-field bokeh veil/);
  assert.doesNotMatch(foregroundOcclusion.en, /one third/i);

  const opticalMist = optionByLabel('opticalEffectId', '光學朦朧薄霧');
  assert.match(opticalMist.en, /lens-only mist-filter haze/);
  assert.doesNotMatch(opticalMist.en, /no environmental fog/i);
});

test('aperture and shutter controls compose with lens optics in all prompt outputs', () => {
  assert.equal(control('apertureId').label, '光圈 / 景深');
  assert.equal(control('shutterId').label, '快門 / 動態殘影');

  assert.deepEqual(
    options('apertureId').map((item) => item.zh),
    [
      '全無',
      'f/11 深焦清晰',
      'f/5.6 中等景深',
      'f/2.8 淺景深',
      'f/2.0 強背景分離',
      'f/1.4 極淺景深散景',
    ]
  );
  assert.deepEqual(
    options('shutterId').map((item) => item.zh),
    [
      '全無',
      '1/1000s 凍結瞬間',
      '1/250s 日常清晰',
      '1/60s 背景動態拖影',
      '1/30s 主體動態殘影',
      '1/15s 全畫面慢門拖影',
      '後簾同步閃光殘影',
    ]
  );

  const aperture = optionByLabel('apertureId', 'f/1.4 極淺景深散景');
  const shutter = optionByLabel('shutterId', '1/30s 主體動態殘影');
  assert.match(aperture.en, /f\/1\.4-style ultra shallow depth of field/);
  assert.match(aperture.en, /razor-thin focus plane/);
  assert.match(shutter.en, /1\/30s slow-shutter portrait blur/);
  assert.match(shutter.en, /visible face and body smear/);

  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    lensId: optionByLabel('lensId', '85mm 中長焦 (人像鏡皇)').id,
    apertureId: aperture.id,
    shutterId: shutter.id,
    opticalEffectId: optionByLabel('opticalEffectId', '重散景光斑').id,
  });

  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*shot on 85mm short telephoto portrait lens/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*f\/1\.4-style ultra shallow depth of field/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*1\/30s slow-shutter portrait blur/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*heavy bokeh rendering/);
  assert.match(prompt.zImagePrompt, /f\/1\.4-style ultra shallow depth of field/);
  assert.match(prompt.zImagePrompt, /1\/30s slow-shutter portrait blur/);
  assert.doesNotMatch(prompt.midjourneyPrompt, /f\/1\.4-style ultra shallow depth of field|1\/30s slow-shutter portrait blur/);
  assert.match(prompt.summary, /鏡頭：[^|]*f\/1\.4 極淺景深散景/);
  assert.match(prompt.summary, /鏡頭：[^|]*1\/30s 主體動態殘影/);
});

test('generated prompts expose rendering color grade as a single D-section rendering layer', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    filmId: optionByLabel('filmId', '日系亮膚高彩濾鏡').id,
    angleId: optionByLabel('angleId', '腰部高度鏡頭').id,
    lensId: optionByLabel('lensId', '35mm 廣角 (人文視角)').id,
    opticalEffectId: optionByLabel('opticalEffectId', '前景遮擋散景').id,
  });

  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*glossy Japanese portrait color grade/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*lifted midtones/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*warm peach skin-tone protection/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*shot on 35mm lens/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*blurred foreground occlusion near the lens/);
  assert.match(prompt.zImagePrompt, /clear opening toward the subject/);
  assert.doesNotMatch(prompt.zImagePrompt, /meaningful partial frame coverage/);
  assert.match(prompt.summary, /鏡頭：[^|]*日系亮膚高彩濾鏡/);
});

test('photography style prompts stay focused on image language', () => {
  const styleLabels = options('styleId').map((item) => item.zh);
  assert.ok(styleLabels.includes('森山大道｜噪訊黑白暗調'));
  assert.ok(styleLabels.includes('艾倫・馮・昂沃斯｜俏皮抓拍雜誌'));
  assert.ok(styleLabels.includes('萊斯利・基｜華麗明星商業感'));
  assert.ok(!styleLabels.includes('Daido Moriyama（森山大道）'));
  assert.ok(!styleLabels.includes('Ellen von Unwerth（艾倫・馮・昂沃斯）'));

  assert.equal(
    optionById('styleId', normalizeLocks({
      ...createEmptyLocks(),
      styleId: 'regional:攝影風格:daido-moriyama-森山大道:15',
    }).styleId).zh,
    '森山大道｜噪訊黑白暗調'
  );

  const ellen = optionByLabel('styleId', '艾倫・馮・昂沃斯｜俏皮抓拍雜誌');
  const leslie = optionByLabel('styleId', '萊斯利・基｜華麗明星商業感');
  const eikoh = optionByLabel('styleId', '細江英公｜戲劇黑白藝術張力');
  const mika = optionByLabel('styleId', '蜷川實花｜濃烈色彩戲劇感');

  assert.doesNotMatch(buildPhotographyStylePrompt(ellen), /sensual/i);
  assert.doesNotMatch(buildPhotographyStylePrompt(leslie), /skin rendering/i);
  assert.doesNotMatch(buildPhotographyStylePrompt(eikoh), /body tension/i);
  assert.match(buildPhotographyStylePrompt(mika), /complex non-floral color layers/i);
  assert.match(buildPhotographyStylePrompt(mika), /no floral or botanical motifs/i);
});
