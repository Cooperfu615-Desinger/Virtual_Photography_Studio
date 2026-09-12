// Test-only inputs for the behavior-neutral baseline phase. These are NOT
// renderer policies or historical image-model seeds. Never import into runtime.
const zh = (byZh) => ({ byZh });
const COMMON = {
  subjectCount: '1',
  imageTypePresetId: 'photorealistic-photo',
  bodyTypeId: zh('性感曲線身形'),
  facialFeaturesId: zh('冷感高級臉'),
  skinDetailsId: zh('柔霧細緻肌'),
  hairstyleId: zh('柔波：中分'),
  hairStylingStateId: zh('微風吹拂'),
  hairColorId: zh('淺金髮'),
  expressionId: zh('柔和微笑'),
  poseBaseId: 'kneeling',
  poseArrangementId: 'model-natural-body-arrangement',
  poseHandId: 'selfie-natural-right-arm',
  poseHeadId: 'none',
  poseAnchorId: 'none',
  topId: zh('落肩 T 恤'),
  topFitId: 'tight',
  pantsId: zh('皮革長褲'),
  bottomRiseId: zh('超低腰'),
  waistAccessoryId: zh('寬版皮革腰帶'),
  shoesId: zh('赤腳'),
  sceneAttributeId: 'outdoor',
  locationId: zh('戶外：新宿歌舞伎町招牌下'),
  lightingId: zh('藍調傍晚'),
  lightDirectionId: zh('霓虹染色光'),
  framingId: zh('牛仔中景 (Cowboy Shot)'),
  angleId: zh('高位俯視鏡頭'),
  styleId: zh('蓋・布爾丁｜鮮豔敘事時裝'),
  filmId: zh('跨沖霓虹剪影濾鏡'),
};
const SQUAT = {
  ...COMMON,
  poseBaseId: 'squatting',
  poseArrangementId: 'squatting-natural',
  poseHeadId: 'chin-slightly-raised',
  poseAnchorId: 'shared-vertical-surface-support',
  topId: zh('短版蕾絲背心'),
  pantsId: zh('工裝短褲'),
  legwearId: zh('膝上蕾絲吊帶襪'),
  shoesId: zh('全無'),
  angleId: zh('地面高度鏡頭'),
  lightingId: zh('黃昏夕陽'),
  lightDirectionId: zh('高調亮光'),
};
const STANDING = {
  ...COMMON,
  poseBaseId: 'standing',
  poseArrangementId: 'standing-natural',
  poseHandId: 'none',
  angleId: zh('平視高度鏡頭'),
};
function fixture(id, family, locks, { excluded = false, mode = 'single', seed } = {}) {
  return { id, family, seed: seed || `scene-integrated-v1-${id}`, mode, excluded, locks };
}
function freeze(value) {
  if (!value || typeof value !== 'object') return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}

export const SCENE_INTEGRATED_ASSEMBLY_FIXTURES = freeze([
  fixture('R01-squat-low-selfie', 'R01', SQUAT),
  fixture('R02-kneel-high-selfie', 'R02', COMMON),
  // Same seed is essential for the one-variable anchor comparison.
  fixture('R03-squat-no-anchor', 'R03', { ...SQUAT, poseAnchorId: 'none' }, {
    seed: 'scene-integrated-v1-R01-squat-low-selfie',
  }),
  fixture('R04-standing', 'R04', STANDING),
  fixture('R04-sitting', 'R04', { ...STANDING, poseBaseId: 'sitting', poseArrangementId: zh('自然坐姿') }),
  fixture('R05-elbows-on-knees', 'R05', { ...SQUAT, poseHandId: 'squatting-hands-forward' }),
  fixture('R06-mirror-selfie', 'R06', { ...COMMON, poseHandId: 'selfie-mirror-phone-visible' }),
  fixture('R07-companion-selfie', 'R07', { ...COMMON, poseHandId: 'selfie-companion-camera-interaction' }),
  ...[
    ['full', '全身鏡頭 (Full Body Shot)'], ['cowboy', '牛仔中景 (Cowboy Shot)'],
    ['medium', '中景鏡頭 (Medium Shot)'], ['chest', '胸上特寫'],
    ['head', '特寫鏡頭 (Close-Up)'], ['face', '局部五官特寫'],
  ].map(([id, label]) => fixture(`R08-crop-${id}`, 'R08', { ...COMMON, framingId: zh(label) })),
  ...[
    ['front', '正面 0 度'], ['left', '左側 90 度'],
    ['right', '右側 270 度'], ['rear', '背面 180 度'],
  ].map(([id, label]) => fixture(`R09-orbit-${id}`, 'R09', { ...STANDING, orbitId: zh(label) })),
  fixture('R09-half-face', 'R09', { ...STANDING, framingId: zh('半臉傾斜特寫') }),
  fixture('R10-palm-occlusion', 'R10', { ...STANDING, poseHandId: zh('單手向鏡頭張開手掌') }),
  ...['單肩露出', '雙肩露出'].map((label, index) => fixture(`R11-shirt-shoulder-${index + 1}`, 'R11', {
    ...STANDING, outerwearId: zh('長版襯衫'), outerwearColorId: zh('白色'),
    outerwearOpeningId: zh('敞開穿'), outerwearStylingId: zh(label),
  })),
  fixture('R11-dress', 'R11', {
    ...STANDING, topId: zh('全無'), pantsId: zh('全無'), topFitId: 'none', bottomRiseId: 'none',
    dressId: zh('連身：短版｜一字領哥德迷你洋裝'), dressColorId: zh('黑色'),
  }),
  fixture('R11-complete-look', 'R11', {
    ...STANDING, topId: zh('全無'), pantsId: zh('全無'), topFitId: 'none', bottomRiseId: 'none',
    outfitPresetId: zh('套裝：亮面乳膠束帶'), outfitPresetPrimaryColorId: zh('黑色'),
    outfitPresetContrastColorId: zh('紅色'),
  }),
  fixture('R11-waist-chain', 'R11', {
    ...STANDING, waistAccessoryId: zh('銀色水鑽蝴蝶腰鏈'), topColorId: zh('白色'), bottomColorId: zh('黑色'),
  }),
  ...[
    ['indoor', 'indoor', '室內：英倫復古窗邊房間'],
    ['studio', 'indoor', '室內：深邃黑幕'],
    ['none', '', '全無'],
  ].map(([id, attribute, location]) => fixture(`R12-scene-${id}`, 'R12', {
    ...STANDING, sceneAttributeId: attribute, locationId: zh(location),
    lightingId: zh('全無'), lightDirectionId: zh('全無'),
  })),
  fixture('R12-watercolor', 'R12', { ...STANDING, imageTypePresetId: 'watercolor-illustration' }),
  fixture('R13-optics', 'R13', {
    ...STANDING, lensId: zh('50mm 標準鏡頭 (Standard)'), apertureId: zh('f/2.8 淺景深'),
    shutterId: zh('1/1000s 凍結瞬間'), opticalEffectId: zh('柔焦濾鏡 Soft Focus'),
  }),
  fixture('R14-mj-imaging', 'R14', {
    ...STANDING, lensId: zh('50mm 標準鏡頭 (Standard)'), apertureId: zh('f/2.8 淺景深'),
    shutterId: zh('1/1000s 凍結瞬間'), opticalEffectId: zh('霧化高光 Bloom'),
    poseAnchorId: 'shared-vertical-surface-support',
  }),
  fixture('R15-derived-isolation', 'R15', {
    ...STANDING, framingId: zh('局部五官特寫'), shoesId: zh('樂福鞋'),
  }),
  fixture('R16-duo', 'R16', { subjectCount: '2', framingId: zh('全身鏡頭 (Full Body Shot)') }, {
    mode: 'duo', excluded: true,
  }),
  fixture('R16-fixed', 'R16', {
    subjectCount: '1', fixedCompositionSetId: zh('暖灰泥黑絲絨工業沙發棚'),
    topId: zh('棉質細肩背心'), pantsId: zh('直筒牛仔褲'),
  }, { excluded: true }),
  fixture('R16-special', 'R16', { ...STANDING, specialSubjectId: 'skeleton' }, { excluded: true }),
  fixture('R16-character-card', 'R16', {
    subjectCount: '1', characterProfileId: 'character-rika',
    framingId: zh('全身鏡頭 (Full Body Shot)'), locationId: zh('室內：英倫復古窗邊房間'),
  }, { excluded: true }),
  ...['lying-bed-surface', 'water-immersed', 'lying-clear-sea-surface'].flatMap((anchor) => (
    ['中景鏡頭 (Medium Shot)', '局部五官特寫'].map((framing, index) => fixture(`R17-${anchor}-${index}`, 'R17', {
      ...COMMON, poseBaseId: 'lying', poseOrientationId: 'lying-supine',
      poseArrangementId: zh('自然伸展'), poseHandId: zh('仰躺雙手向頭頂伸展'),
      poseHeadId: zh('仰躺頭部自然朝上'), poseAnchorId: anchor, framingId: zh(framing),
    }, { excluded: true }))
  )),
  fixture('R18-exact-text-on', 'R18', {
    ...STANDING, zImageVisibleTextEnabled: true, zImageVisibleTextContent: '測試招牌',
    zImageVisibleTextLanguage: 'traditional-chinese', zImageVisibleTextPlacement: 'background-storefront-sign',
  }),
  fixture('R18-exact-text-off', 'R18', {
    ...STANDING, zImageVisibleTextEnabled: false, zImageVisibleTextContent: '測試招牌',
  }),
  fixture('R19-random-pose', 'R19', {
    ...STANDING, poseBaseId: 'random', poseArrangementId: 'random',
    poseHandId: 'random', poseHeadId: 'random', poseAnchorId: 'random',
  }),
]);

export const SCENE_INTEGRATED_OBSERVATION_CARD = freeze({
  id: 'scene-integrated-observation-test', label: 'Assembly isolation test',
  identityAndBody: 'an adult fictional woman with a lean natural silhouette',
  distinctiveFeatures: 'a small beauty mark below the left eye', baseHair: 'long dark wavy hair',
  defaultWardrobeLayers: {
    top: { label: '上身', prompt: 'a relaxed white cotton shirt' },
    shoes: { label: '鞋子', prompt: 'clean black low-top sneakers' },
  },
});
